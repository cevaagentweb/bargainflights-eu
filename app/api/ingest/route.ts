import { PublicDeal, writeFeed } from "@/lib/feed-store";
import { updateDealHistory } from "@/lib/history-store";

export const dynamic = "force-dynamic";

type IncomingDeal = Record<string, unknown>;

function requiredText(value: unknown, name: string, max = 200) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value.trim().slice(0, max);
}

function optionalText(value: unknown, max = 200) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : null;
}

function dateText(value: unknown, name: string) {
  const result = requiredText(value, name, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) {
    throw new Error(`${name} must be YYYY-MM-DD`);
  }
  return result;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDeal(value: IncomingDeal, scanFinishedAt: string): PublicDeal {
  const priceEur = Number(value.priceEur);
  if (!Number.isFinite(priceEur) || priceEur <= 0 || priceEur > 10000) {
    throw new Error("priceEur must be a positive number");
  }
  const url = new URL(requiredText(value.googleFlightsUrl, "googleFlightsUrl", 2000));
  if (url.protocol !== "https:") {
    throw new Error("googleFlightsUrl must use HTTPS");
  }
  const stops = optionalNumber(value.stops);
  return {
    id: requiredText(value.id, "id", 160),
    origin: requiredText(value.origin, "origin", 8).toUpperCase(),
    originCity: requiredText(value.originCity, "originCity", 100),
    destination: requiredText(value.destination, "destination", 8).toUpperCase(),
    destinationCity: requiredText(value.destinationCity, "destinationCity", 100),
    destinationCountry: requiredText(value.destinationCountry, "destinationCountry", 100),
    region: requiredText(value.region, "region", 100),
    routeDirection: value.routeDirection === "return" ? "return" : "outbound",
    marketCode: (
      optionalText(value.marketCode, 8) ??
      (value.routeDirection === "return"
        ? requiredText(value.origin, "origin", 8)
        : requiredText(value.destination, "destination", 8))
    ).toUpperCase(),
    marketCity:
      optionalText(value.marketCity, 100) ??
      (value.routeDirection === "return"
        ? requiredText(value.originCity, "originCity", 100)
        : requiredText(value.destinationCity, "destinationCity", 100)),
    tripType: requiredText(value.tripType, "tripType", 40),
    departureDate: dateText(value.departureDate, "departureDate"),
    returnDate:
      value.returnDate === null || value.returnDate === undefined || value.returnDate === ""
        ? null
        : dateText(value.returnDate, "returnDate"),
    priceEur,
    airline: optionalText(value.airline, 160),
    stops: stops === null ? null : Math.max(0, Math.min(9, Math.trunc(stops))),
    googleFlightsUrl: url.toString(),
    googlePriceLevel: optionalText(value.googlePriceLevel, 80),
    typicalRangeLowEur: optionalNumber(value.typicalRangeLowEur),
    publishedAt: new Date().toISOString(),
    scanFinishedAt,
  };
}

export async function POST(request: Request) {
  const configuredToken = process.env.INGEST_TOKEN;
  const suppliedToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!configuredToken || !suppliedToken || suppliedToken !== configuredToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      scan?: Record<string, unknown>;
      deals?: IncomingDeal[];
    };
    const scan = payload.scan ?? {};
    const finishedAt = requiredText(scan.finishedAt, "scan.finishedAt", 40);
    const searched = Math.max(0, Math.trunc(Number(scan.searched) || 0));
    const incoming = Array.isArray(payload.deals) ? payload.deals : [];
    if (incoming.length > 500) {
      throw new Error("A maximum of 500 deals can be published at once");
    }
    const deals = incoming.map((deal) => normalizeDeal(deal, finishedAt));
    const publicFeed = {
      deals,
      lastUpdated: finishedAt,
      scan: { finishedAt, searched, qualifying: deals.length },
    };
    await writeFeed(publicFeed);
    await updateDealHistory(publicFeed);
    return Response.json({ ok: true, published: deals.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid publish payload";
    const missingRedis = message.includes("Redis REST environment variables");
    return Response.json(
      { error: message },
      { status: missingRedis ? 503 : 400 },
    );
  }
}
