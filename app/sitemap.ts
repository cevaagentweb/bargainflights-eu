import type { MetadataRoute } from "next";
import { readFeed } from "@/lib/feed-store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://bargainflights.eu";
  const feed = await readFeed();
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: baseUrl + "/documentation",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: baseUrl + "/history",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: baseUrl + "/privacy",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    ...feed.deals.map((deal) => ({
      url: `${baseUrl}/deals/${deal.id}`,
      lastModified: new Date(deal.scanFinishedAt),
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
