import seedFeed from "@/data/seed-deals.json";

export type PublicDeal = {
  id: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  destinationCountry: string;
  region: string;
  tripType: string;
  departureDate: string;
  returnDate: string | null;
  priceEur: number;
  airline: string | null;
  stops: number | null;
  googleFlightsUrl: string;
  googlePriceLevel: string | null;
  typicalRangeLowEur: number | null;
  publishedAt: string;
  scanFinishedAt: string;
};

export type PublicFeed = {
  deals: PublicDeal[];
  lastUpdated: string | null;
  scan: {
    finishedAt: string;
    searched: number;
    qualifying: number;
  } | null;
};

const FEED_KEY = "bargainflights:latest-feed:v1";

function redisSettings() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function redisCommand(command: unknown[]) {
  const settings = redisSettings();
  if (!settings) throw new Error("Redis REST environment variables are not configured");
  const response = await fetch(settings.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Redis returned HTTP ${response.status}`);
  }
  const payload = (await response.json()) as { result?: unknown; error?: string };
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

export async function readFeed(): Promise<PublicFeed> {
  if (!redisSettings()) return seedFeed as PublicFeed;
  try {
    const value = await redisCommand(["GET", FEED_KEY]);
    if (typeof value !== "string" || !value) return seedFeed as PublicFeed;
    return JSON.parse(value) as PublicFeed;
  } catch (error) {
    console.error("Unable to read the live deal feed", error);
    return seedFeed as PublicFeed;
  }
}

export async function writeFeed(feed: PublicFeed) {
  await redisCommand(["SET", FEED_KEY, JSON.stringify(feed)]);
}
