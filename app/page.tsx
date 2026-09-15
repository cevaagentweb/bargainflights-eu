"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  ExternalLink,
  Plane,
  RefreshCw,
  Route,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function Home() {
  const [data, setData] = useState<DealsResponse>({ deals: [], lastUpdated: null, scan: null });
  const [origin, setOrigin] = useState("all");
  const [region, setRegion] = useState("all");
  const [sort, setSort] = useState("price");
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

  const origins = useMemo(
    () => [...new Set(data.deals.map((deal) => deal.origin))].sort((a, b) => a.localeCompare(b)),
    [data.deals],
  );
  const regions = useMemo(
    () => [...new Set(data.deals.map((deal) => deal.region))].sort((a, b) => a.localeCompare(b)),
    [data.deals],
  );
  const filteredDeals = useMemo(() => {
    const filtered = data.deals.filter(
      (deal) =>
        (origin === "all" || deal.origin === origin) &&
        (region === "all" || deal.region === region),
    );
    return filtered.sort((a, b) =>
      sort === "date"
        ? a.departureDate.localeCompare(b.departureDate) || a.priceEur - b.priceEur
        : a.priceEur - b.priceEur || a.departureDate.localeCompare(b.departureDate),
    );
  }, [data.deals, origin, region, sort]);

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
              Fresh fares from Vienna, Budapest and Prague to East Africa, Latin America and Southeast Asia — only when the price is genuinely interesting.
            </p>
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
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">Latest catches</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">One-way under €221 · returns under €450</h2>
            <p className="mt-2 text-sm text-slate-400">One-way and round-trip deals surfaced by the automated scanner.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <label className="sr-only" htmlFor="origin-filter">Origin</label>
            <NativeSelect id="origin-filter" value={origin} onChange={(event) => setOrigin(event.target.value)} className="min-w-32 border-white/15 bg-[#0c1824] text-slate-100">
              <NativeSelectOption value="all">All origins</NativeSelectOption>
              {origins.map((value) => <NativeSelectOption key={value} value={value}>{value}</NativeSelectOption>)}
            </NativeSelect>

            <label className="sr-only" htmlFor="region-filter">Region</label>
            <NativeSelect id="region-filter" value={region} onChange={(event) => setRegion(event.target.value)} className="min-w-36 border-white/15 bg-[#0c1824] text-slate-100">
              <NativeSelectOption value="all">All regions</NativeSelectOption>
              {regions.map((value) => <NativeSelectOption key={value} value={value}>{value}</NativeSelectOption>)}
            </NativeSelect>

            <label className="sr-only" htmlFor="sort-filter">Sort deals</label>
            <NativeSelect id="sort-filter" value={sort} onChange={(event) => setSort(event.target.value)} className="min-w-32 border-white/15 bg-[#0c1824] text-slate-100">
              <NativeSelectOption value="price">Lowest price</NativeSelectOption>
              <NativeSelectOption value="date">Soonest first</NativeSelectOption>
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
        ) : filteredDeals.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredDeals.map((deal, index) => {
              const saving = deal.typicalRangeLowEur && deal.typicalRangeLowEur > deal.priceEur ? deal.typicalRangeLowEur - deal.priceEur : null;
              return (
                <Card key={deal.id} className="group relative overflow-hidden border-white/10 bg-[#0b1722] py-0 shadow-none transition-transform duration-300 hover:-translate-y-1 hover:border-cyan-300/35">
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-slate-400">
                      <span className="text-cyan-300">#{String(index + 1).padStart(2, "0")}</span>{deal.region}
                    </div>
                    {saving ? (
                      <Badge className="bg-emerald-300/10 text-emerald-200">€{Math.round(saving)} under usual</Badge>
                    ) : (
                      <Badge variant="outline" className="border-white/15 text-slate-300">{deal.googlePriceLevel || "Low fare"}</Badge>
                    )}
                  </div>

                  <CardContent className="px-5 py-6">
                    <div className="flex items-center gap-3">
                      <div><p className="font-mono text-3xl font-black text-white">{deal.origin}</p><p className="text-xs text-slate-500">{deal.originCity}</p></div>
                      <div className="flex flex-1 items-center gap-2 text-slate-600"><span className="h-px flex-1 bg-white/10" /><Plane className="size-4 text-cyan-300" /><span className="h-px flex-1 bg-white/10" /></div>
                      <div className="text-right"><p className="font-mono text-3xl font-black text-white">{deal.destination}</p><p className="text-xs text-slate-500">{deal.destinationCity}</p></div>
                    </div>

                    <div className="mt-6 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">From</p>
                        <p className="mt-1 text-4xl font-black tracking-[-0.05em] text-amber-300">{currency.format(deal.priceEur)}</p>
                        <p className="mt-1 text-xs text-slate-500">{deal.tripType}</p>
                      </div>
                      <div className="space-y-2 text-right text-xs text-slate-300">
                        <p className="flex items-center justify-end gap-2"><CalendarDays className="size-3.5 text-slate-500" />{formatDate(deal.departureDate)}{deal.returnDate ? ` – ${formatDate(deal.returnDate)}` : ""}</p>
                        <p className="flex items-center justify-end gap-2"><Route className="size-3.5 text-slate-500" />{deal.stops == null ? "Stops not listed" : deal.stops === 0 ? "Direct" : `${deal.stops} stop${deal.stops === 1 ? "" : "s"}`}</p>
                      </div>
                    </div>

                    <Button asChild className="mt-6 w-full bg-cyan-300 font-bold text-[#04101a] hover:bg-cyan-200">
                      <a href={deal.googleFlightsUrl} target="_blank" rel="noreferrer">Check live fare <ExternalLink /></a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-white/15 bg-white/[0.025] px-6 py-16 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-white/5 text-slate-400"><Plane className="size-5" /></span>
            <h3 className="mt-5 text-xl font-bold text-white">No matching deal right now</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">The board only shows fares that pass the strict price filter. Try another origin or region, or come back after the next scan.</p>
            {(origin !== "all" || region !== "all") && (
              <Button variant="outline" className="mt-6 border-white/15 bg-transparent text-white hover:bg-white/10" onClick={() => { setOrigin("all"); setRegion("all"); }}>Clear filters</Button>
            )}
          </div>
        )}

        <div className="mt-12 grid gap-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
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
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">An independent scanner checks selected destinations and publishes only the fares under its deal threshold. Prices move quickly, so always confirm the final fare and conditions on Google Flights before booking.</p>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-600">BargainFlights.eu</p>
        </div>
      </section>
    </main>
  );
}
