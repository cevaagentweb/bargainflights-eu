import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BargainFlights.eu | Cheap flights from Central Europe",
  description:
    "Fresh unusually cheap flights from Vienna, Budapest and Prague to East Africa, Latin America and Southeast Asia.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
