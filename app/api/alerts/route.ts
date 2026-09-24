import { createHash, timingSafeEqual } from "node:crypto";

import { redisCommand, redisSettings } from "@/lib/redis";

export const dynamic = "force-dynamic";

const ALERTS_KEY = "bargainflights:flight-alert-subscribers:v1";
const RATE_LIMIT_PREFIX = "bargainflights:flight-alert-rate:v1";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type AlertSubscriber = {
  email: string;
  createdAt: string;
  consentVersion: "2026-09-24";
  source: "homepage";
};

function noStoreHeaders() {
  return { "Cache-Control": "private, no-store, max-age=0" };
}

function normalizedEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null;
}

function safeTokenMatch(received: string, configured: string) {
  const receivedBuffer = Buffer.from(received);
  const configuredBuffer = Buffer.from(configured);
  return (
    receivedBuffer.length === configuredBuffer.length &&
    timingSafeEqual(receivedBuffer, configuredBuffer)
  );
}

function adminAuthorized(request: Request) {
  const configuredToken =
    process.env.WAITLIST_ADMIN_TOKEN || process.env.INGEST_TOKEN || "";
  const suppliedToken =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  return Boolean(
    configuredToken &&
      suppliedToken &&
      safeTokenMatch(suppliedToken, configuredToken),
  );
}

async function rateLimit(request: Request) {
  const forwarded = request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") || "";
  const address = forwarded.split(",")[0]?.trim() || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const fingerprint = createHash("sha256")
    .update(`${day}:${address}`)
    .digest("hex")
    .slice(0, 24);
  const key = `${RATE_LIMIT_PREFIX}:${day}:${fingerprint}`;
  const attempts = Number(await redisCommand<number>(["INCR", key]));
  if (attempts === 1) await redisCommand(["EXPIRE", key, 86_400]);
  return attempts <= 10;
}

export async function POST(request: Request) {
  if (
    !redisSettings() ||
    !process.env.WAITLIST_CONTROLLER_NAME ||
    !process.env.WAITLIST_PRIVACY_EMAIL
  ) {
    return Response.json(
      { error: "The flight-alert list is not open yet." },
      { status: 503, headers: noStoreHeaders() },
    );
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4_096) {
    return Response.json(
      { error: "Request is too large." },
      { status: 413, headers: noStoreHeaders() },
    );
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;

    if (typeof payload.website === "string" && payload.website.trim()) {
      return Response.json({ ok: true, status: "joined" }, { headers: noStoreHeaders() });
    }
    if (payload.consent !== true) {
      return Response.json(
        { error: "Please agree to receive flight-alert emails." },
        { status: 400, headers: noStoreHeaders() },
      );
    }

    const email = normalizedEmail(payload.email);
    if (!email) {
      return Response.json(
        { error: "Enter a valid email address." },
        { status: 400, headers: noStoreHeaders() },
      );
    }
    if (!(await rateLimit(request))) {
      return Response.json(
        { error: "Too many attempts. Please try again tomorrow." },
        { status: 429, headers: noStoreHeaders() },
      );
    }

    const record: AlertSubscriber = {
      email,
      createdAt: new Date().toISOString(),
      consentVersion: "2026-09-24",
      source: "homepage",
    };
    const created = Number(
      await redisCommand<number>([
        "HSETNX",
        ALERTS_KEY,
        email,
        JSON.stringify(record),
      ]),
    );
    return Response.json(
      { ok: true, status: created === 1 ? "joined" : "already_joined" },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    console.error("Flight-alert signup failed", error);
    return Response.json(
      { error: "We could not save your email. Please try again." },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}

export async function GET(request: Request) {
  if (!adminAuthorized(request)) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: noStoreHeaders() },
    );
  }

  try {
    const raw = await redisCommand<string[]>(["HGETALL", ALERTS_KEY]);
    const records: AlertSubscriber[] = [];
    for (let index = 1; index < raw.length; index += 2) {
      try {
        records.push(JSON.parse(raw[index]) as AlertSubscriber);
      } catch {
        // A malformed value should not prevent the other records from exporting.
      }
    }
    records.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return Response.json(
      { count: records.length, records },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    console.error("Flight-alert export failed", error);
    return Response.json(
      { error: "Unable to export the flight-alert list." },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}

export async function DELETE(request: Request) {
  if (!adminAuthorized(request)) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: noStoreHeaders() },
    );
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const email = normalizedEmail(payload.email);
    if (!email) {
      return Response.json(
        { error: "Enter a valid email address." },
        { status: 400, headers: noStoreHeaders() },
      );
    }
    const removed = Number(await redisCommand<number>(["HDEL", ALERTS_KEY, email]));
    return Response.json({ removed: removed === 1 }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("Flight-alert removal failed", error);
    return Response.json(
      { error: "Unable to remove the email." },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
