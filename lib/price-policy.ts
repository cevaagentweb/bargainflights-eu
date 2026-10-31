import policy from "@/data/price-policy.json";

export const BUDGET_ONE_WAY_EUR = policy.budgetOneWayEur;
export const BUDGET_ROUND_TRIP_EUR = policy.budgetRoundTripEur;
export const STANDARD_ONE_WAY_EUR = policy.standardOneWayEur;
export const FARTHER_ONE_WAY_EUR = policy.fartherOneWayEur;
export const STANDARD_ROUND_TRIP_EUR = policy.standardRoundTripEur;
export const FARTHER_ROUND_TRIP_EUR = policy.fartherRoundTripEur;

type FareLocation = {
  origin: string;
  destination: string;
  destinationCountry?: string;
  region?: string;
  routeDirection?: "outbound" | "return";
  marketCode?: string;
  marketCountry?: string;
  marketRegion?: string;
  tripType?: string;
};

function normalize(value: string | undefined) {
  return (value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

export function isFartherDestination(code: string, country?: string, region?: string) {
  const airport = code.toUpperCase();
  if (isBudgetDestination(code, country, region) || policy.standardAirportCodes.includes(airport)) return false;
  return policy.fartherAirportCodes.includes(airport) ||
    policy.fartherCountries.includes(normalize(country)) ||
    policy.fartherRegions.includes(normalize(region));
}

export function isBudgetDestination(code: string, country?: string, region?: string) {
  return policy.budgetAirportCodes.includes(code.toUpperCase()) ||
    policy.budgetCountries.includes(normalize(country)) ||
    policy.budgetRegions.includes(normalize(region));
}

function marketLocation(deal: FareLocation): [string, string | undefined, string | undefined] {
  const homebound = deal.routeDirection === "return" ||
    (!deal.routeDirection && policy.homeAirports.includes(deal.destination.toUpperCase()) &&
      !policy.homeAirports.includes(deal.origin.toUpperCase()));
  return [
    deal.marketCode || (homebound ? deal.origin : deal.destination),
    deal.marketCountry || (homebound ? undefined : deal.destinationCountry),
    deal.marketRegion || (homebound ? undefined : deal.region),
  ];
}

export function isFartherDeal(deal: FareLocation) {
  return isFartherDestination(...marketLocation(deal));
}

export function isBudgetDeal(deal: FareLocation) {
  return isBudgetDestination(...marketLocation(deal));
}

export function oneWayLimitForDeal(deal: FareLocation) {
  if (isBudgetDeal(deal)) return BUDGET_ONE_WAY_EUR;
  return isFartherDeal(deal) ? FARTHER_ONE_WAY_EUR : STANDARD_ONE_WAY_EUR;
}

export function roundTripLimitForDeal(deal: FareLocation) {
  if (isBudgetDeal(deal)) return BUDGET_ROUND_TRIP_EUR;
  return isFartherDeal(deal) ? FARTHER_ROUND_TRIP_EUR : STANDARD_ROUND_TRIP_EUR;
}

export function pairLimitForDeals(first: FareLocation, second: FareLocation) {
  return Math.max(roundTripLimitForDeal(first), roundTripLimitForDeal(second));
}

export function isWithinPriceLimit(deal: FareLocation & { priceEur: number }) {
  const roundTrip = normalize(deal.tripType).replaceAll("-", " ").includes("round trip");
  return deal.priceEur < (roundTrip ? roundTripLimitForDeal(deal) : oneWayLimitForDeal(deal));
}
