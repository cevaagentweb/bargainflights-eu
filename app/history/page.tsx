import type { Metadata } from "next";

import HistoryClient from "./history-client";
import { readDealHistory } from "@/lib/history-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Flight deal history",
  description:
    "Browse active and expired bargain flights previously found from Vienna, Budapest and Prague.",
  alternates: { canonical: "/history" },
  openGraph: {
    title: "Flight deal history | BargainFlights.eu",
    description:
      "See which unusually cheap flights are still active and which bargains have disappeared.",
    url: "/history",
  },
};

export default async function HistoryPage() {
  const initialData = await readDealHistory({ status: "past", limit: 24 });
  return <HistoryClient initialData={initialData} />;
}
