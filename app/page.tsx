"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  Plane,
  RefreshCw,
  Route,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DealAlertForm } from "@/components/deal-alert-form";
import { TripTypeBadge } from "@/components/trip-type-badge";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

type Deal = {
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

type DealsResponse = {
  deals: Deal[];
  lastUpdated: string | null;
  scan: {
    finishedAt: string;
    searched: number;
    qualifying: number;
  } | null;
};

type LocationGroup = {
  key: string;
  city: string;
  region: string;
  bestDeal: Deal;
  earliestDate: string;
  deals: Deal[];
  dates: Array<{ date: string; deals: Deal[] }>;
  outboundBest: number | null;
  returnBest: number | null;
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

function formatFreshness(value: string | null) {
  if (!value) return "Awaiting the first scan";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently refreshed";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function homeAirportCode(deal: Deal) {
  return deal.routeDirection === "return" ? deal.destination : deal.origin;
}

function DealFareCard({ deal }: { deal: Deal }) {
  const saving =
    deal.typicalRangeLowEur && deal.typicalRangeLowEur > deal.priceEur
      ? deal.typicalRangeLowEur - deal.priceEur
      : null;

  return (
    <article className="rounded-xl border border-white/10 bg-[#0b1722] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <TripTypeBadge tripType={deal.tripType} />
          <Badge variant="outline" className="border-white/15 text-slate-300">
            {deal.routeDirection === "return" ? "Return home" : "Going abroad"}
          </Badge>
        </div>
        <p className="text-2xl font-black tracking-tight text-amber-300">
          {currency.format(deal.priceEur)}
        </p>
      </div>

      <h5 className="mt-4 text-xl font-black text-white">
        {deal.origin} <span className="text-cyan-300">→</span> {deal.destination}
      </h5>
      <p className="mt-1 text-xs text-slate-400">
        {deal.originCity} to {deal.destinationCity}
      </p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300">
        <span className="inline-flex items-center gap-1.5"><Plane className="size-3.5 text-cyan-300" />{deal.airline || "Airline not listed"}</span>
        <span className="inline-flex items-center gap-1.5"><Route className="size-3.5 text-cyan-300" />{deal.stops == null ? "Stops not listed" : deal.stops === 0 ? "Direct" : `${deal.stops} stop${deal.stops === 1 ? "" : "s"}`}</span>
        {deal.returnDate && <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5 text-cyan-300" />Back {formatDate(deal.returnDate)}</span>}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {saving ? `€${Math.round(saving)} under usual` : deal.googlePriceLevel || "Low fare"}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <Button asChild className="bg-cyan-300 font-bold text-[#04101a] hover:bg-cyan-200">
          <Link href={`/deals/${deal.id}`}>Build trip options <ArrowRight /></Link>
        </Button>
        <Button asChild variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10">
          <a href={deal.googleFlightsUrl} target="_blank" rel="noreferrer" aria-label={`Open ${deal.origin} to ${deal.destination} fare directly`}><ExternalLink /></a>
        </Button>
      </div>
    </article>
  );
}

export default function Home() {
  const [data, setData] = useState<DealsResponse>({ deals: [], lastUpdated: null, scan: null });
  const [homeAirport, setHomeAirport] = useState("all");
  const [region, setRegion] = useState("all");
  const [direction, setDirection] = useState("all");
  const [sort, setSort] = useState("price");
  const [openLocation, setOpenLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/deals?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("The live feed is temporarily unavailable.");
      setData((await response.json()) as DealsResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load the latest deals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`/api/deals?t=${Date.now()}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("The live feed is temporarily unavailable.");
        return response.json() as Promise<DealsResponse>;
      })
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Could not load the latest deals.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const homeAirports = useMemo(
    () => [...new Set(data.deals.map(homeAirportCode))].sort((a, b) => a.localeCompare(b)),
    [data.deals],
  );
  const regions = useMemo(
    () => [...new Set(data.deals.map((deal) => deal.region))].sort((a, b) => a.localeCompare(b)),
    [data.deals],
  );
  const filteredDeals = useMemo(() => {
    return data.deals.filter(
      (deal) =>
        (homeAirport === "all" || homeAirportCode(deal) === homeAirport) &&
        (region === "all" || deal.region === region) &&
        (direction === "all" || (deal.routeDirection ?? "outbound") === direction),
    );
  }, [data.deals, direction, homeAirport, region]);
  const locations = useMemo<LocationGroup[]>(() => {
    const byLocation = new Map<string, Deal[]>();
    for (const deal of filteredDeals) {
      const key = (deal.marketCode ||
        (deal.routeDirection === "return" ? deal.origin : deal.destination)).toUpperCase();
      const current = byLocation.get(key) || [];
      current.push(deal);
      byLocation.set(key, current);
    }

    return [...byLocation.entries()].map(([key, deals]) => {
      const first = deals[0];
      const bestDeal = deals.reduce((best, deal) =>
        deal.priceEur < best.priceEur ? deal : best,
      );
      const byDate = new Map<string, Deal[]>();
      for (const deal of deals) {
        const current = byDate.get(deal.departureDate) || [];
        current.push(deal);
        byDate.set(deal.departureDate, current);
      }
      const dates = [...byDate.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, dateDeals]) => ({
          date,
          deals: dateDeals.sort((a, b) => a.priceEur - b.priceEur),
        }));
      const lowestInDirection = (value: "outbound" | "return") => {
        const matching = deals.filter((deal) => (deal.routeDirection ?? "outbound") === value);
        return matching.length ? Math.min(...matching.map((deal) => deal.priceEur)) : null;
      };

      return {
        key,
        city: first.marketCity ||
          (first.routeDirection === "return" ? first.originCity : first.destinationCity),
        region: first.region,
        bestDeal,
        earliestDate: dates[0].date,
        deals,
        dates,
        outboundBest: lowestInDirection("outbound"),
        returnBest: lowestInDirection("return"),
      };
    }).sort((a, b) =>
      sort === "date"
        ? a.earliestDate.localeCompare(b.earliestDate) || a.bestDeal.priceEur - b.bestDeal.priceEur
        : a.bestDeal.priceEur - b.bestDeal.priceEur || a.city.localeCompare(b.city),
    );
  }, [filteredDeals, sort]);

  return (
    <main className="min-h-screen bg-[#071019] text-[#f4f8fb]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#071019]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#top" className="flex items-center gap-3" aria-label="BargainFlights.eu home">
            <span className="grid size-9 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300">
              <Plane className="size-4 -rotate-12" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[0.08em] text-white">BARGAINFLIGHTS.EU</span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-slate-500">Cheap fares, caught live</span>
            </span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/history" className="text-xs font-semibold text-slate-300 transition hover:text-cyan-300">
              History
            </a>
            <a href="/documentation" className="text-xs font-semibold text-slate-300 transition hover:text-cyan-300">
              <span className="sm:hidden">Guide</span><span className="hidden sm:inline">Guide & mission</span>
            </a>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              <span className="hidden sm:inline">Live scanner</span>
            </div>
          </div>
        </div>
      </header>

      <section id="top" className="relative isolate overflow-hidden border-b border-white/10">
        <Image
          src="/coastline-hero.png"
          alt="Aerial view of a tropical coastline and turquoise sea"
          width={1792}
          height={887}
          priority
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[#06101b]/70" />
        <div className="absolute inset-y-0 left-0 -z-10 w-full bg-[#06101b]/40 lg:w-3/5" />
        <div className="mx-auto grid min-h-[490px] max-w-7xl items-end px-5 pb-12 pt-24 sm:px-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center lg:py-24">
          <div className="max-w-3xl">
            <Badge className="mb-5 border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
              <Sparkles className="size-3" /> unusually cheap, caught live
            </Badge>
            <h1 className="max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              Flights cheap enough to change your plans.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              Fresh fares from Vienna, Budapest and Prague, plus Condor routes from Vienna to destinations outside Europe — only when the price is genuinely interesting.
            </p>
            <a href="#flight-alerts" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-[#041019] transition hover:bg-cyan-200">
              Join the flight-alert interest list <ArrowRight className="size-4" />
            </a>
          </div>
          <div className="mt-10 justify-self-start border-l-2 border-cyan-300 pl-5 lg:mt-0 lg:justify-self-end">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyan-200">Last radar sweep</p>
            <p className="mt-2 text-sm font-semibold text-white">{formatFreshness(data.lastUpdated)}</p>
            <p className="mt-1 text-xs text-slate-300">
              {data.scan ? `${data.scan.searched.toLocaleString()} route-date checks` : "Public feed ready"}
            </p>
          </div>
        </div>
      </section>

      <section id="deals" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex flex-col gap-6 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">Browse by location</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">One place, all its cheap dates.</h2>
            <p className="mt-2 text-sm text-slate-400">See the best price for each location first. Open a place to compare every date, route and fare. One-way fares stay under €221; direct round trips stay under €440.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <label className="sr-only" htmlFor="home-airport-filter">Home airport</label>
            <NativeSelect id="home-airport-filter" value={homeAirport} onChange={(event) => { setHomeAirport(event.target.value); setOpenLocation(null); }} className="min-w-32 border-white/15 bg-[#0c1824] text-slate-100">
              <NativeSelectOption value="all">All home airports</NativeSelectOption>
              {homeAirports.map((value) => <NativeSelectOption key={value} value={value}>{value}</NativeSelectOption>)}
            </NativeSelect>

            <label className="sr-only" htmlFor="region-filter">Region</label>
            <NativeSelect id="region-filter" value={region} onChange={(event) => { setRegion(event.target.value); setOpenLocation(null); }} className="min-w-36 border-white/15 bg-[#0c1824] text-slate-100">
              <NativeSelectOption value="all">All regions</NativeSelectOption>
              {regions.map((value) => <NativeSelectOption key={value} value={value}>{value}</NativeSelectOption>)}
            </NativeSelect>

            <label className="sr-only" htmlFor="direction-filter">Route direction</label>
            <NativeSelect id="direction-filter" value={direction} onChange={(event) => { setDirection(event.target.value); setOpenLocation(null); }} className="min-w-36 border-white/15 bg-[#0c1824] text-slate-100">
              <NativeSelectOption value="all">All directions</NativeSelectOption>
              <NativeSelectOption value="outbound">Going abroad</NativeSelectOption>
              <NativeSelectOption value="return">Returning home</NativeSelectOption>
            </NativeSelect>

            <label className="sr-only" htmlFor="sort-filter">Sort deals</label>
            <NativeSelect id="sort-filter" value={sort} onChange={(event) => setSort(event.target.value)} className="min-w-32 border-white/15 bg-[#0c1824] text-slate-100">
              <NativeSelectOption value="price">Cheapest location</NativeSelectOption>
              <NativeSelectOption value="date">Soonest location</NativeSelectOption>
            </NativeSelect>

            <Button type="button" variant="outline" onClick={() => void loadDeals()} disabled={loading} className="border-white/15 bg-[#0c1824] text-slate-100 hover:bg-white/10 hover:text-white">
              <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <Card className="border-red-300/20 bg-red-400/5">
            <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold text-red-100">Radar feed interrupted</p><p className="mt-1 text-sm text-red-200/70">{error}</p></div>
              <Button onClick={() => void loadDeals()}>Try again</Button>
            </CardContent>
          </Card>
        ) : loading && data.deals.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5" />)}
          </div>
        ) : locations.length > 0 ? (
          <div>
            <p className="text-sm text-slate-400">
              <strong className="text-white">{locations.length}</strong> location{locations.length === 1 ? "" : "s"} · {filteredDeals.length} current fare{filteredDeals.length === 1 ? "" : "s"}
            </p>
            <div className="mt-5 space-y-3">
              {locations.map((location, index) => {
                const expanded = openLocation === location.key;
                return (
                  <div key={location.key} className={`overflow-hidden rounded-2xl border bg-[#0b1722] transition-colors ${expanded ? "border-cyan-300/45" : "border-white/10 hover:border-cyan-300/30"}`}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={expanded ? `location-${location.key}` : undefined}
                      onClick={() => setOpenLocation(expanded ? null : location.key)}
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-4 p-5 text-left transition hover:bg-white/[0.025] sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center"
                    >
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-300">#{String(index + 1).padStart(2, "0")} · {location.region}</p>
                        <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">{location.city} <span className="font-mono text-sm font-semibold text-slate-500">{location.key}</span></h3>
                        <p className="mt-2 text-sm text-slate-400">{location.dates.length} travel date{location.dates.length === 1 ? "" : "s"} · {location.deals.length} fare{location.deals.length === 1 ? "" : "s"}</p>
                      </div>
                      <div className="col-span-2 row-start-2 flex flex-wrap gap-2 text-xs font-semibold lg:col-auto lg:row-auto">
                        {location.outboundBest !== null && <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-cyan-100">Fly there from {currency.format(location.outboundBest)}</span>}
                        {location.returnBest !== null && <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-emerald-100">Fly home from {currency.format(location.returnBest)}</span>}
                      </div>
                      <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 lg:col-auto lg:row-auto">
                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Lowest fare</p>
                          <p className="mt-1 text-3xl font-black tracking-tight text-amber-300">{currency.format(location.bestDeal.priceEur)}</p>
                          <div className="mt-1 flex justify-end"><TripTypeBadge tripType={location.bestDeal.tripType} /></div>
                        </div>
                        <ChevronDown className={`size-5 shrink-0 text-cyan-300 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </div>
                    </button>

                    {expanded && (
                      <div id={`location-${location.key}`} className="border-t border-white/10 bg-[#08131d] p-5 sm:p-6">
                        <h4 className="text-lg font-bold text-white">Dates and fares for {location.city}</h4>
                        <p className="mt-1 text-sm text-slate-400">All current options are shown below, earliest departure first.</p>
                        <div className="mt-5 space-y-5">
                          {location.dates.map(({ date, deals }) => (
                            <section key={date} className="grid gap-3 border-b border-white/10 pb-5 last:border-b-0 last:pb-0 md:grid-cols-[170px_minmax(0,1fr)]">
                              <div>
                                <p className="flex items-center gap-2 font-semibold text-white"><CalendarDays className="size-4 text-cyan-300" />{formatDate(date)}</p>
                                <p className="mt-1 text-xs text-slate-500">{deals.length} fare{deals.length === 1 ? "" : "s"} on this date</p>
                              </div>
                              <div className="grid gap-3 xl:grid-cols-2">
                                {deals.map((deal) => <DealFareCard key={deal.id} deal={deal} />)}
                              </div>
                            </section>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-white/15 bg-white/[0.025] px-6 py-16 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-white/5 text-slate-400"><Plane className="size-5" /></span>
            <h3 className="mt-5 text-xl font-bold text-white">No matching deal right now</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">The board only shows fares that pass the strict price filter. Try another home airport or region, or come back after the next scan.</p>
            {(homeAirport !== "all" || region !== "all" || direction !== "all") && (
              <Button variant="outline" className="mt-6 border-white/15 bg-transparent text-white hover:bg-white/10" onClick={() => { setHomeAirport("all"); setRegion("all"); setDirection("all"); setOpenLocation(null); }}>Clear filters</Button>
            )}
          </div>
        )}

        <section id="flight-alerts" className="mt-12 scroll-mt-24 rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.055] p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">Flight alerts</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Want cheap flights in your inbox?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Add your email to show interest in future flight alerts. We are collecting subscribers now; no flight emails are being sent yet.
          </p>
          <DealAlertForm />
        </section>

        <div className="mt-8 grid gap-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">Why this project exists</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Read the guide—or request your departure city.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">See how fares are selected, what each result means and join the interest list for expanded airport coverage.</p>
          </div>
          <Button asChild className="bg-cyan-300 font-bold text-[#041019] hover:bg-cyan-200">
            <a href="/documentation">Guide & expansion list <ArrowRight /></a>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 border-t border-white/10 pt-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="flex items-center gap-2 font-semibold text-white"><ArrowRight className="size-4 text-amber-300" /> How this board works</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Independent scans check selected destinations and Condor itineraries from Vienna to destinations outside Europe. Condor fares must be under €221 and in Google Flights&apos; Low price range. Prices move quickly, so always confirm the final fare and conditions on Google Flights before booking.</p>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-600">BargainFlights.eu</p>
        </div>
      </section>
    </main>
  );
}
