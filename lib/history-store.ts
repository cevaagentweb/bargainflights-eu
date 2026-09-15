import type { PublicDeal, PublicFeed } from "@/lib/feed-store";
import { todayInBratislava } from "@/lib/local-date";
import { redisCommand, redisPipeline, redisSettings } from "@/lib/redis";

export type HistoryStatus = "active" | "gone";
export type HistoryStatusFilter = "all" | "past" | HistoryStatus;

export type DealHistoryEntry = PublicDeal & {
  firstSeenAt: string;
  lastSeenAt: string;
  goneAt: string | null;
  status: HistoryStatus;
  timesSeen: number;
};

export type HistoryPageData = {
  deals: DealHistoryEntry[];
  counts: {
    all: number;
    past: number;
    active: number;
    gone: number;
  };
  total: number;
  offset: number;
  limit: number;
  lastUpdated: string | null;
};

const ENTRIES_KEY = "bargainflights:deal-history:entries:v1";
const ALL_ORDER_KEY = "bargainflights:deal-history:all:v1";
const DEPARTURE_ORDER_KEY = "bargainflights:deal-history:departure:v1";
const ACTIVE_ORDER_KEY = "bargainflights:deal-history:active:v1";
const GONE_ORDER_KEY = "bargainflights:deal-history:gone:v1";
const META_KEY = "bargainflights:deal-history:meta:v1";

function timestampScore(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function departureScore(value: string) {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pastDepartureMaxScore() {
  const today = todayInBratislava();
  return Date.parse(`${today}T00:00:00Z`) - 1;
}

function parseEntry(value: unknown): DealHistoryEntry | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const parsed = JSON.parse(value) as DealHistoryEntry;
    return parsed && typeof parsed.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function parseMeta(value: unknown) {
  if (typeof value !== "string" || !value) return { lastUpdated: null };
  try {
    const parsed = JSON.parse(value) as { lastUpdated?: unknown };
    return {
      lastUpdated:
        typeof parsed.lastUpdated === "string" ? parsed.lastUpdated : null,
    };
  } catch {
    return { lastUpdated: null };
  }
}

export async function updateDealHistory(feed: PublicFeed) {
  const observedAt =
    feed.scan?.finishedAt || feed.lastUpdated || new Date().toISOString();
  const currentIds = new Set(feed.deals.map((deal) => deal.id));
  const previousActiveValue = await redisCommand<unknown>([
    "ZRANGE",
    ACTIVE_ORDER_KEY,
    0,
    -1,
  ]);
  const previousActive = Array.isArray(previousActiveValue)
    ? previousActiveValue.filter((value): value is string => typeof value === "string")
    : [];
  const lookupIds = [...new Set([...previousActive, ...currentIds])];
  const storedValues = await redisPipeline(
    lookupIds.map((id) => ["HGET", ENTRIES_KEY, id]),
  );
  const stored = new Map<string, DealHistoryEntry>();
  lookupIds.forEach((id, index) => {
    const entry = parseEntry(storedValues[index]);
    if (entry) stored.set(id, entry);
  });

  const writes: unknown[][] = [];
  const observedScore = timestampScore(observedAt);

  for (const deal of feed.deals) {
    const existing = stored.get(deal.id);
    const sameScan = existing?.lastSeenAt === observedAt;
    const entry: DealHistoryEntry = {
      ...deal,
      firstSeenAt: existing?.firstSeenAt || observedAt,
      lastSeenAt: observedAt,
      goneAt: null,
      status: "active",
      timesSeen: existing
        ? sameScan
          ? existing.timesSeen
          : Math.max(1, existing.timesSeen) + 1
        : 1,
    };
    writes.push(
      ["HSET", ENTRIES_KEY, deal.id, JSON.stringify(entry)],
      ["ZADD", ALL_ORDER_KEY, observedScore, deal.id],
      ["ZADD", DEPARTURE_ORDER_KEY, departureScore(deal.departureDate), deal.id],
      ["ZADD", ACTIVE_ORDER_KEY, observedScore, deal.id],
      ["ZREM", GONE_ORDER_KEY, deal.id],
    );
  }

  for (const id of previousActive) {
    if (currentIds.has(id)) continue;
    const existing = stored.get(id);
    if (existing) {
      const entry: DealHistoryEntry = {
        ...existing,
        status: "gone",
        goneAt: observedAt,
      };
      writes.push(
        ["HSET", ENTRIES_KEY, id, JSON.stringify(entry)],
        ["ZADD", ALL_ORDER_KEY, observedScore, id],
        ["ZADD", GONE_ORDER_KEY, observedScore, id],
      );
    }
    writes.push(["ZREM", ACTIVE_ORDER_KEY, id]);
  }

  writes.push([
    "SET",
    META_KEY,
    JSON.stringify({ lastUpdated: observedAt }),
  ]);
  await redisPipeline(writes);
}

export async function readDealHistory(options?: {
  status?: HistoryStatusFilter;
  offset?: number;
  limit?: number;
}): Promise<HistoryPageData> {
  const status = options?.status ?? "all";
  const offset = Math.max(0, Math.trunc(options?.offset ?? 0));
  const limit = Math.max(1, Math.min(100, Math.trunc(options?.limit ?? 24)));
  if (!redisSettings()) {
    return {
      deals: [],
      counts: { all: 0, past: 0, active: 0, gone: 0 },
      total: 0,
      offset,
      limit,
      lastUpdated: null,
    };
  }

  const selectedKey =
    status === "active"
      ? ACTIVE_ORDER_KEY
      : status === "gone"
        ? GONE_ORDER_KEY
        : ALL_ORDER_KEY;
  const pastMax = pastDepartureMaxScore();
  const pageCommand =
    status === "past"
      ? [
          "ZREVRANGEBYSCORE",
          DEPARTURE_ORDER_KEY,
          pastMax,
          "-inf",
          "LIMIT",
          offset,
          limit,
        ]
      : ["ZREVRANGE", selectedKey, offset, offset + limit - 1];
  const totalCommand =
    status === "past"
      ? ["ZCOUNT", DEPARTURE_ORDER_KEY, "-inf", pastMax]
      : ["ZCARD", selectedKey];
  const [
    idsValue,
    totalValue,
    allValue,
    pastValue,
    activeValue,
    goneValue,
    metaValue,
  ] =
    await redisPipeline([
      pageCommand,
      totalCommand,
      ["ZCARD", ALL_ORDER_KEY],
      ["ZCOUNT", DEPARTURE_ORDER_KEY, "-inf", pastMax],
      ["ZCARD", ACTIVE_ORDER_KEY],
      ["ZCARD", GONE_ORDER_KEY],
      ["GET", META_KEY],
    ]);
  const ids = Array.isArray(idsValue)
    ? idsValue.filter((value): value is string => typeof value === "string")
    : [];
  const values = await redisPipeline(
    ids.map((id) => ["HGET", ENTRIES_KEY, id]),
  );
  const deals = values
    .map(parseEntry)
    .filter((entry): entry is DealHistoryEntry => entry !== null);
  const meta = parseMeta(metaValue);

  return {
    deals,
    counts: {
      all: Number(allValue) || 0,
      past: Number(pastValue) || 0,
      active: Number(activeValue) || 0,
      gone: Number(goneValue) || 0,
    },
    total: Number(totalValue) || 0,
    offset,
    limit,
    lastUpdated: meta.lastUpdated,
  };
}
