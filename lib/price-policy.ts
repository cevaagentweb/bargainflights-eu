import policy from "@/data/price-policy.json";

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
};

function normalize(value: string | undefined) {
  return (value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

export function isFartherDestination(code: string, country?: string, region?: string) {
  const airport = code.toUpperCase();
  if (policy.standardAirportCodes.includes(airport)) return false;
  return policy.fartherAirportCodes.includes(airport) ||
    policy.fartherCountries.includes(normalize(country)) ||
    policy.fartherRegions.includes(normalize(region));
}

export function isFartherDeal(deal: FareLocation) {
  const homebound = deal.routeDirection === "return" ||
    (!deal.routeDirection && policy.homeAirports.includes(deal.destination.toUpperCase()) &&
      !policy.homeAirports.includes(deal.origin.toUpperCase()));
  return isFartherDestination(
    deal.marketCode || (homebound ? deal.origin : deal.destination),
    deal.marketCountry || (homebound ? undefined : deal.destinationCountry),
    deal.marketRegion || (homebound ? undefined : deal.region),
  );
}

export function oneWayLimitForDeal(deal: FareLocation) {
  return isFartherDeal(deal) ? FARTHER_ONE_WAY_EUR : STANDARD_ONE_WAY_EUR;
}

export function roundTripLimitForDeal(deal: FareLocation) {
  return isFartherDeal(deal) ? FARTHER_ROUND_TRIP_EUR : STANDARD_ROUND_TRIP_EUR;
}

export function pairLimitForDeals(first: FareLocation, second: FareLocation) {
  return isFartherDeal(first) || isFartherDeal(second)
    ? FARTHER_ROUND_TRIP_EUR : STANDARD_ROUND_TRIP_EUR;
}
