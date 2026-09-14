import { readFeed } from "@/lib/feed-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const feed = await readFeed();
  const today = new Date().toISOString().slice(0, 10);
  return Response.json(
    {
      ...feed,
      deals: feed.deals
        .filter((deal) => deal.departureDate >= today)
        .sort(
          (a, b) =>
            a.priceEur - b.priceEur ||
            a.departureDate.localeCompare(b.departureDate),
        )
        .slice(0, 250),
    },
    {
      headers: {
        "Cache-Control":
          "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
