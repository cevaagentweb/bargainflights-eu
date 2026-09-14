import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://bargainflights.eu/sitemap.xml",
    host: "https://bargainflights.eu",
  };
}
