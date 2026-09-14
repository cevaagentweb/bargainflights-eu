import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bargainflights.eu"),
  title: {
    default: "BargainFlights.eu | Cheap flights from Central Europe",
    template: "%s | BargainFlights.eu",
  },
  description:
    "Fresh unusually cheap flights from Vienna, Budapest and Prague to East Africa, Latin America and Southeast Asia.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "BargainFlights.eu | Cheap flights from Central Europe",
    description:
      "An independent scanner for unusually cheap flights from Vienna, Budapest and Prague.",
    url: "/",
    siteName: "BargainFlights.eu",
    type: "website",
    images: [
      {
        url: "/coastline-hero.png",
        width: 1792,
        height: 887,
        alt: "Aerial view of a tropical coastline and turquoise sea",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BargainFlights.eu | Cheap flights from Central Europe",
    description:
      "Fresh unusually cheap flights from Vienna, Budapest and Prague.",
    images: ["/coastline-hero.png"],
  },
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "BargainFlights.eu",
  url: "https://bargainflights.eu",
  description:
    "An independent flight-deal scanner for unusually cheap fares from Central Europe.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
