import { createHmac } from "node:crypto";
import { isIP } from "node:net";

import { redisCommand, redisPipeline, redisSettings } from "@/lib/redis";

export const dynamic = "force-dynamic";

const VISITORS_KEY = "bargainflights:unique-visitors:v1";
const PRODUCTION_HOSTS = new Set(["bargainflights.eu", "www.bargainflights.eu"]);

function noStoreHeaders() {
  return { "Cache-Control": "no-store" };
}

function trackingEnabled() {
  return Boolean(
    redisSettings() &&
      process.env.WAITLIST_CONTROLLER_NAME &&
      process.env.WAITLIST_PRIVACY_EMAIL,
  );
}

async function countVisitors() {
  return Number(await redisCommand<number>(["PFCOUNT", VISITORS_KEY]));
}

export async function GET() {
  if (!trackingEnabled()) {
    return Response.json({ count: null }, { headers: noStoreHeaders() });
  }
  try {
    return Response.json(
      { count: await countVisitors() },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    console.error("Visitor count failed", error);
    return Response.json(
      { count: null },
      { status: 503, headers: noStoreHeaders() },
    );
  }
}

export async function POST(request: Request) {
  if (!trackingEnabled()) {
    return Response.json({ count: null }, { headers: noStoreHeaders() });
  }

  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) {
    return Response.json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders() });
  }

  const forwarded = request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") || "";
  const address = forwarded.split(",")[0]?.trim() || "";
  const agent = request.headers.get("user-agent")?.slice(0, 512) || "";
  const secret = process.env.VISITOR_HASH_SECRET || process.env.INGEST_TOKEN ||
    redisSettings()?.token || "";

  try {
    if (!PRODUCTION_HOSTS.has(url.hostname) || !isIP(address) || !agent || !secret) {
      return Response.json(
        { count: await countVisitors() },
        { headers: noStoreHeaders() },
      );
    }

    const fingerprint = createHmac("sha256", secret)
      .update(address)
      .update("\0")
      .update(agent)
      .digest("hex");
    const [, count] = await redisPipeline([
      ["PFADD", VISITORS_KEY, fingerprint],
      ["PFCOUNT", VISITORS_KEY],
    ]);
    return Response.json(
      { count: Number(count) },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    console.error("Visitor count failed", error);
    return Response.json(
      { count: null },
      { status: 503, headers: noStoreHeaders() },
    );
  }
}
