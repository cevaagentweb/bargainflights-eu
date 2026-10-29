import type { DealHistoryEntry, HistoryPageData, HistoryStatusFilter } from "@/lib/history-store";
import { dealDirection, dealMarketCode } from "@/lib/trip-options";

export type HistoryLocation = {
  key: string;
  city: string;
  region: string;
  bestDeal: DealHistoryEntry;
  fareCount: number;
  dateCount: number;
  activeCount: number;
  pastCount: number;
  goneCount: number;
  outboundBest: number | null;
  returnBest: number | null;
};

export type HistoryLocationsData = {
  locations: HistoryLocation[];
  counts: HistoryPageData["counts"];
  total: number;
  lastUpdated: string | null;
};

function matchesStatus(deal: DealHistoryEntry, status: HistoryStatusFilter, today: string) {
  return status === "all" ||
    (status === "past" ? deal.departureDate < today : deal.status === status);
}

function compareFares(a: DealHistoryEntry, b: DealHistoryEntry) {
  return a.priceEur - b.priceEur ||
    a.departureDate.localeCompare(b.departureDate) || a.id.localeCompare(b.id);
}

function historyCounts(entries: DealHistoryEntry[], today: string) {
  return {
    all: entries.length,
    past: entries.filter((deal) => deal.departureDate < today).length,
    active: entries.filter((deal) => deal.status === "active").length,
    gone: entries.filter((deal) => deal.status === "gone").length,
  };
}

export function groupHistoryLocations(
  entries: DealHistoryEntry[],
  status: HistoryStatusFilter,
  today: string,
  lastUpdated: string | null,
): HistoryLocationsData {
  const byLocation = new Map<string, DealHistoryEntry[]>();
  let total = 0;
  for (const deal of entries) {
    if (!matchesStatus(deal, status, today)) continue;
    const key = dealMarketCode(deal);
    const current = byLocation.get(key) ?? [];
    current.push(deal);
    byLocation.set(key, current);
    total += 1;
  }

  const locations = [...byLocation.entries()].map(([key, deals]) => {
    const bestDeal = [...deals].sort(compareFares)[0];
    const lowestInDirection = (direction: "outbound" | "return") => {
      const fares = deals.filter((deal) => dealDirection(deal) === direction);
      return fares.length ? Math.min(...fares.map((deal) => deal.priceEur)) : null;
    };
    return {
      key,
      city: bestDeal.marketCity || (dealDirection(bestDeal) === "return" ? bestDeal.originCity : bestDeal.destinationCity),
      region: bestDeal.marketRegion || bestDeal.region,
      bestDeal,
      fareCount: deals.length,
      dateCount: new Set(deals.map((deal) => deal.departureDate)).size,
      activeCount: deals.filter((deal) => deal.status === "active" && deal.departureDate >= today).length,
      pastCount: deals.filter((deal) => deal.departureDate < today).length,
      goneCount: deals.filter((deal) => deal.status === "gone" && deal.departureDate >= today).length,
      outboundBest: lowestInDirection("outbound"),
      returnBest: lowestInDirection("return"),
    };
  }).sort((a, b) => a.bestDeal.priceEur - b.bestDeal.priceEur || a.city.localeCompare(b.city));

  return { locations, counts: historyCounts(entries, today), total, lastUpdated };
}

export function historyLocationFares(
  entries: DealHistoryEntry[],
  options: { market: string; status: HistoryStatusFilter; offset?: number; limit?: number },
  today: string,
  lastUpdated: string | null,
): HistoryPageData {
  const offset = Number.isFinite(options.offset) ? Math.max(0, Math.trunc(options.offset!)) : 0;
  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.min(100, Math.trunc(options.limit!))) : 24;
  const market = options.market.toUpperCase();
  const deals = entries.filter((deal) =>
    dealMarketCode(deal) === market && matchesStatus(deal, options.status, today),
  ).sort(compareFares);
  return {
    deals: deals.slice(offset, offset + limit),
    counts: historyCounts(entries, today),
    total: deals.length,
    offset,
    limit,
    lastUpdated,
  };
}
