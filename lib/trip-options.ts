import type { PublicDeal } from "@/lib/feed-store";

export const ONE_WAY_LIMIT_EUR = 221;
export const ROUND_TRIP_LIMIT_EUR = 440;

export type PairableDeal = PublicDeal & {
  status?: "active" | "gone";
  firstSeenAt?: string;
  lastSeenAt?: string;
};

export type TripOption = {
  deal: PairableDeal;
  combinedPriceEur: number;
  gapDays: number;
  nearbyMarket: boolean;
  sameHomeAirport: boolean;
};

const HOME_AIRPORTS = new Set(["VIE", "BUD", "PRG"]);

const NEARBY_MARKETS: Record<string, string[]> = {
  BKK: ["KUL", "SIN", "SGN", "DPS", "MNL"],
  SIN: ["KUL", "BKK", "DPS", "MNL", "SGN"],
  DPS: ["KUL", "SIN", "BKK"],
  KUL: ["SIN", "BKK", "DPS", "MNL", "SGN"],
  MNL: ["KUL", "SIN", "BKK", "SGN"],
  SGN: ["BKK", "KUL", "SIN", "MNL"],
  BOG: ["LIM", "MEX"],
  LIM: ["BOG", "GRU", "EZE"],
  GRU: ["EZE", "LIM", "BOG"],
  EZE: ["GRU", "LIM"],
  CUN: ["MEX"],
  MEX: ["CUN", "BOG"],
  ZNZ: [],
};

export function dealDirection(deal: PublicDeal) {
  if (deal.routeDirection) return deal.routeDirection;
  return HOME_AIRPORTS.has(deal.destination) && !HOME_AIRPORTS.has(deal.origin)
    ? "return"
    : "outbound";
}

export function dealMarketCode(deal: PublicDeal) {
  return (
    deal.marketCode ||
    (dealDirection(deal) === "return" ? deal.origin : deal.destination)
  ).toUpperCase();
}

function isOneWay(deal: PublicDeal) {
  return deal.tripType.toLowerCase().replaceAll("-", " ").includes("one way");
}

function dateScore(value: string) {
  return Date.parse(`${value}T00:00:00Z`);
}

export function findTripOptions(
  selected: PairableDeal,
  candidates: PairableDeal[],
  limit = 8,
): TripOption[] {
  if (!isOneWay(selected) || selected.priceEur >= ONE_WAY_LIMIT_EUR) return [];

  const selectedDirection = dealDirection(selected);
  const selectedMarket = dealMarketCode(selected);
  const selectedHome =
    selectedDirection === "return" ? selected.destination : selected.origin;
  const allowedMarkets = new Set([
    selectedMarket,
    ...(NEARBY_MARKETS[selectedMarket] ?? []),
  ]);
  const selectedDate = dateScore(selected.departureDate);
  if (!Number.isFinite(selectedDate)) return [];

  return candidates
    .filter((candidate) => {
      if (candidate.id === selected.id || !isOneWay(candidate)) return false;
      if (candidate.priceEur >= ONE_WAY_LIMIT_EUR) return false;
      if (dealDirection(candidate) === selectedDirection) return false;
      if (!allowedMarkets.has(dealMarketCode(candidate))) return false;
      const candidateDate = dateScore(candidate.departureDate);
      if (!Number.isFinite(candidateDate)) return false;
      const gapDays = Math.round(
        Math.abs(candidateDate - selectedDate) / 86_400_000,
      );
      if (gapDays < 1 || gapDays > 90) return false;
      if (selectedDirection === "outbound" && candidateDate <= selectedDate) return false;
      if (selectedDirection === "return" && candidateDate >= selectedDate) return false;
      return selected.priceEur + candidate.priceEur <= ROUND_TRIP_LIMIT_EUR;
    })
    .map((deal) => {
      const candidateDate = dateScore(deal.departureDate);
      const candidateHome =
        dealDirection(deal) === "return" ? deal.destination : deal.origin;
      return {
        deal,
        combinedPriceEur: selected.priceEur + deal.priceEur,
        gapDays: Math.round(Math.abs(candidateDate - selectedDate) / 86_400_000),
        nearbyMarket: dealMarketCode(deal) !== selectedMarket,
        sameHomeAirport: candidateHome === selectedHome,
      };
    })
    .sort(
      (a, b) =>
        Number(b.deal.status === "active") - Number(a.deal.status === "active") ||
        Number(a.nearbyMarket) - Number(b.nearbyMarket) ||
        Number(b.sameHomeAirport) - Number(a.sameHomeAirport) ||
        a.combinedPriceEur - b.combinedPriceEur ||
        a.gapDays - b.gapDays,
    )
    .slice(0, Math.max(1, limit));
}
