import { createHash, timingSafeEqual } from "node:crypto";

import { redisCommand, redisSettings } from "@/lib/redis";

export const dynamic = "force-dynamic";

const WAITLIST_KEY = "bargainflights:expansion-waitlist:v1";
const RATE_LIMIT_PREFIX = "bargainflights:waitlist-rate:v1";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type WaitlistRecord = {
  email: string;
  city: string | null;
  createdAt: string;
  consentVersion: "2026-09-15";
  source: "documentation";
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

async function rateLimit(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
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
      { error: "The interest list is not open yet." },
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

    // Quietly accept bot-filled honeypot submissions without storing them.
    if (typeof payload.website === "string" && payload.website.trim()) {
      return Response.json({ ok: true, status: "joined" }, { headers: noStoreHeaders() });
    }

    if (payload.consent !== true) {
      return Response.json(
        { error: "Please confirm that we may store your email." },
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

    const city =
      typeof payload.city === "string" && payload.city.trim()
        ? payload.city.trim().slice(0, 80)
        : null;
    const record: WaitlistRecord = {
      email,
      city,
      createdAt: new Date().toISOString(),
      consentVersion: "2026-09-15",
      source: "documentation",
    };
    const created = Number(
      await redisCommand<number>([
        "HSETNX",
        WAITLIST_KEY,
        email,
        JSON.stringify(record),
      ]),
    );

    return Response.json(
      { ok: true, status: created === 1 ? "joined" : "already_joined" },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to join the list.";
    const missingStorage = message.includes("Redis REST environment variables");
    console.error("Waitlist signup failed", { missingStorage, message });
    return Response.json(
      {
        error: missingStorage
          ? "The interest list is being connected. Please try again soon."
          : "We could not save your email. Please try again.",
      },
      { status: missingStorage ? 503 : 500, headers: noStoreHeaders() },
    );
  }
}

export async function GET(request: Request) {
  const configuredToken =
    process.env.WAITLIST_ADMIN_TOKEN || process.env.INGEST_TOKEN || "";
  const suppliedToken =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";

  if (
    !configuredToken ||
    !suppliedToken ||
    !safeTokenMatch(suppliedToken, configuredToken)
  ) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: noStoreHeaders() },
    );
  }

  try {
    const raw = await redisCommand<string[]>(["HGETALL", WAITLIST_KEY]);
    const records: WaitlistRecord[] = [];
    for (let index = 1; index < raw.length; index += 2) {
      try {
        records.push(JSON.parse(raw[index]) as WaitlistRecord);
      } catch {
        // Skip malformed values instead of breaking the complete export.
      }
    }
    records.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return Response.json(
      { count: records.length, records },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    console.error("Waitlist export failed", error);
    return Response.json(
      { error: "Unable to export the waitlist." },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}
