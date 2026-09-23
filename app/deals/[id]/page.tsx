import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Info,
  Plane,
  Route,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TripTypeBadge } from "@/components/trip-type-badge";
import { readFeed } from "@/lib/feed-store";
import { readDealHistoryEntry } from "@/lib/history-store";
import {
  dealDirection,
  dealMarketCode,
  findTripOptions,
  ONE_WAY_LIMIT_EUR,
  ROUND_TRIP_LIMIT_EUR,
  type PairableDeal,
} from "@/lib/trip-options";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Build a low-cost journey",
  description:
    "Pair a one-way bargain with possible return-home or positioning flights, including selected nearby airports.",
};

const currency = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatDate(value: string) {
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function routeLabel(deal: PairableDeal) {
  return `${deal.originCity} (${deal.origin}) → ${deal.destinationCity} (${deal.destination})`;
}

export default async function DealOptionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^flight-[a-f0-9]{24}$/i.test(id)) notFound();

  const [feed, storedSelected] = await Promise.all([
    readFeed(),
    readDealHistoryEntry(id),
  ]);
  const currentDeals: PairableDeal[] = feed.deals.map((deal) => ({
    ...deal,
    status: "active",
  }));
  const selected =
    currentDeals.find((deal) => deal.id === id) ?? storedSelected;
  if (!selected) notFound();

  const direction = dealDirection(selected);
  const marketCode = dealMarketCode(selected);
  const marketCity =
    selected.marketCity ||
    (direction === "return" ? selected.originCity : selected.destinationCity);
  const options = findTripOptions(selected, currentDeals);
  const isRoundTrip = selected.tripType.toLowerCase().includes("round");
  const optionsHeading =
    direction === "outbound"
      ? `Ways back home after ${marketCity}`
      : `Ways to reach ${marketCity} before flying home`;

  return (
    <main className="min-h-screen bg-[#071019] text-[#f4f8fb]">
      <header className="border-b border-white/10 bg-[#071019]/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-bold text-white">
            <span className="grid size-9 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300">
              <Plane className="size-4 -rotate-12" />
            </span>
            BARGAINFLIGHTS.EU
          </Link>
          <Link href="/history" className="text-xs font-semibold text-slate-300 hover:text-cyan-300">
            Bargain history
          </Link>
        </div>
      </header>

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_42%),linear-gradient(180deg,#0a1722_0%,#071019_100%)]">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            <ArrowLeft className="size-4" /> Back to deals
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Badge className="border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
              {direction === "return" ? "Return home" : "Going abroad"}
            </Badge>
            <TripTypeBadge tripType={selected.tripType} />
            <Badge variant="outline" className="border-white/15 text-slate-300">
              {selected.region} · {marketCode}
            </Badge>
            {selected.status === "gone" && (
              <Badge className="border border-amber-300/25 bg-amber-300/10 text-amber-200">
                Archive fare—recheck availability
              </Badge>
            )}
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">
            Build the other half of this trip.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
            Start with the selected bargain, then compare separate one-way legs from the same destination or a monitored nearby hub.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.35fr] lg:py-16">
        <aside>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">Selected fare</p>
          <Card className="mt-4 rounded-none border-white/10 bg-[#0b1721] text-white shadow-none">
            <CardContent className="p-6">
              <p className="text-sm text-slate-400">{selected.region}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">{routeLabel(selected)}</h2>
              <p className="mt-5 text-5xl font-black tracking-[-0.05em] text-amber-200">
                {currency.format(selected.priceEur)}
              </p>
              <div className="mt-6 space-y-3 border-y border-white/10 py-5 text-sm text-slate-300">
                <p className="flex items-center gap-2"><CalendarDays className="size-4 text-cyan-300" /> {formatDate(selected.departureDate)}{selected.returnDate ? ` – ${formatDate(selected.returnDate)}` : ""}</p>
                <p className="flex items-center gap-2"><Plane className="size-4 text-cyan-300" /> {selected.airline || "Airline not listed"}</p>
                <p className="flex items-center gap-2"><Route className="size-4 text-cyan-300" /> {selected.tripType} · {selected.stops == null ? "stops not listed" : selected.stops === 0 ? "direct" : `${selected.stops} stop${selected.stops === 1 ? "" : "s"}`}</p>
              </div>
              <Button asChild className="mt-6 w-full bg-cyan-300 font-bold text-[#041019] hover:bg-cyan-200">
                <a href={selected.googleFlightsUrl} target="_blank" rel="noreferrer">Open selected fare <ExternalLink /></a>
              </Button>
            </CardContent>
          </Card>

          <div className="mt-5 border border-white/10 bg-white/[0.025] p-5 text-sm leading-6 text-slate-400">
            <p className="flex items-start gap-3"><Info className="mt-1 size-4 shrink-0 text-amber-200" /> Combined totals include only the two displayed flight fares. Positioning flights, buses, trains, hotels, baggage and transfers between countries or airports are not included.</p>
          </div>
        </aside>

        <section>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">Flight-only combinations</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">{optionsHeading}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Each one-way leg must be below €{ONE_WAY_LIMIT_EUR}; the two displayed fares together must be no more than €{ROUND_TRIP_LIMIT_EUR}.
          </p>

          {isRoundTrip ? (
            <div className="mt-8 border border-white/10 bg-white/[0.025] p-8">
              <h3 className="text-xl font-bold text-white">This result already includes both flight directions.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Open the selected fare to inspect its included return date and itinerary.</p>
            </div>
          ) : options.length > 0 ? (
            <div className="mt-8 space-y-4">
              {options.map((option) => (
                <Card key={option.deal.id} className="rounded-none border-white/10 bg-[#0b1721] text-white shadow-none">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <TripTypeBadge tripType={option.deal.tripType} />
                          <Badge className={option.deal.status === "active" ? "border border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : "border border-amber-300/25 bg-amber-300/10 text-amber-200"}>
                            {option.deal.status === "active" ? "Latest scan" : "History—recheck"}
                          </Badge>
                          {option.nearbyMarket && (
                            <Badge variant="outline" className="border-white/15 text-slate-300">Nearby hub</Badge>
                          )}
                          {!option.sameHomeAirport && (
                            <Badge variant="outline" className="border-white/15 text-slate-300">Different home airport</Badge>
                          )}
                        </div>
                        <h3 className="mt-3 text-xl font-black">{routeLabel(option.deal)}</h3>
                        <p className="mt-2 text-sm text-slate-400">{formatDate(option.deal.departureDate)} · {option.gapDays} day{option.gapDays === 1 ? "" : "s"} {direction === "outbound" ? "after" : "before"} the selected departure</p>
                        <p className="mt-1 text-sm text-slate-400">{option.deal.airline || "Airline not listed"} · {option.deal.stops == null ? "stops not listed" : option.deal.stops === 0 ? "direct" : `${option.deal.stops} stop${option.deal.stops === 1 ? "" : "s"}`}</p>
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-3xl font-black text-amber-200">{currency.format(option.deal.priceEur)}</p>
                        <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-cyan-300 sm:justify-end"><WalletCards className="size-4" /> {currency.format(option.combinedPriceEur)} combined</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <Button asChild className="bg-cyan-300 font-bold text-[#041019] hover:bg-cyan-200">
                        <a href={option.deal.googleFlightsUrl} target="_blank" rel="noreferrer">Open this fare <ExternalLink /></a>
                      </Button>
                      <Button asChild variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10">
                        <Link href={`/deals/${option.deal.id}`}>View this leg</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-dashed border-white/15 bg-white/[0.025] p-8">
              <h3 className="text-xl font-bold text-white">No matching second leg under the limit yet.</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">The scanner will keep checking the same market and its selected nearby hubs. New matches will appear here automatically after a daily scan.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
