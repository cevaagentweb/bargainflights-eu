import seedFeed from "@/data/seed-deals.json";
import { redisCommand, redisSettings } from "@/lib/redis";

export type PublicDeal = {
  id: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  destinationCountry: string;
  region: string;
  routeDirection?: "outbound" | "return";
  marketCode?: string;
  marketCity?: string;
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
