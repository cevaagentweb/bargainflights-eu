"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Clock3,
  ExternalLink,
  Plane,
  RefreshCw,
  Route,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  HistoryPageData,
  HistoryStatusFilter,
} from "@/lib/history-store";
import { todayInBratislava } from "@/lib/local-date";

const currency = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatTravelDate(value: string) {
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatObservedAt(value: string | null) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Bratislava",
  }).format(parsed);
}

const filters: Array<{ value: HistoryStatusFilter; label: string }> = [
  { value: "past", label: "Past departures" },
  { value: "all", label: "All finds" },
  { value: "active", label: "Active now" },
  { value: "gone", label: "No longer listed" },
];

export default function HistoryClient({
  initialData,
}: {
  initialData: HistoryPageData;
}) {
  const [data, setData] = useState(initialData);
  const [filter, setFilter] = useState<HistoryStatusFilter>("past");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(
    async (nextFilter: HistoryStatusFilter, offset = 0, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/history?status=${nextFilter}&offset=${offset}&limit=24&t=${Date.now()}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("The history is temporarily unavailable.");
        const payload = (await response.json()) as HistoryPageData;
        setData((current) =>
          append
            ? { ...payload, deals: [...current.deals, ...payload.deals] }
            : payload,
        );
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not load the history.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const selectFilter = (nextFilter: HistoryStatusFilter) => {
    setFilter(nextFilter);
    void loadHistory(nextFilter);
  };

  return (
    <main className="min-h-screen bg-[#071019] text-[#f4f8fb]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#071019]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="BargainFlights.eu home">
            <span className="grid size-9 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300">
              <Plane className="size-4 -rotate-12" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[0.08em] text-white">BARGAINFLIGHTS.EU</span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-slate-500">Deal archive</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/documentation" className="hidden text-slate-300 transition hover:text-cyan-300 sm:inline">Guide & mission</Link>
            <Link href="/" className="flex items-center gap-2 text-cyan-300 transition hover:text-cyan-200"><ArrowLeft className="size-3.5" /> Current deals</Link>
          </div>
        </div>
      </header>

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.15),transparent_40%),linear-gradient(180deg,#0a1722_0%,#071019_100%)]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <Badge className="border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
            <Archive className="mr-2 size-3.5" /> Deal history
          </Badge>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">Bargains that came—and went.</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">Every daily scan leaves a record. Scroll through bargains with past departure dates, or explore every fare the scanner has discovered.</p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["All recorded", data.counts.all],
              ["Past departures", data.counts.past],
              ["Active now", data.counts.active],
              ["No longer listed", data.counts.gone],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">Observed fares</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Flight bargain archive</h2>
            <p className="mt-2 text-sm text-slate-400">Last history update: {formatObservedAt(data.lastUpdated)}</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="History status filter">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={filter === item.value}
                onClick={() => selectFilter(item.value)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  filter === item.value
                    ? "border-cyan-300 bg-cyan-300 text-[#041019]"
                    : "border-white/15 bg-white/[0.025] text-slate-300 hover:border-cyan-300/40 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-center justify-between gap-4 border border-rose-400/25 bg-rose-400/10 px-5 py-4 text-sm text-rose-100">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void loadHistory(filter)} className="border-rose-200/30 bg-transparent text-rose-100"><RefreshCw /> Retry</Button>
          </div>
        )}

        {data.deals.length > 0 ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {data.deals.map((deal) => {
              const departed = deal.departureDate < todayInBratislava();
              return (
              <Card key={deal.id} className="overflow-hidden rounded-none border-white/10 bg-[#0b1721] text-white shadow-none">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
                    <span className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">{deal.routeDirection === "return" ? "Return home · " : ""}{deal.region}</span>
                    <Badge className={departed ? "border border-amber-300/25 bg-amber-300/10 text-amber-200" : deal.status === "active" ? "border border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border border-slate-400/20 bg-slate-400/10 text-slate-300"}>
                      <span className={`mr-2 size-1.5 rounded-full ${departed ? "bg-amber-300" : deal.status === "active" ? "bg-emerald-300" : "bg-slate-500"}`} />
                      {departed ? "Departed" : deal.status === "active" ? "Active now" : "No longer listed"}
                    </Badge>
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="text-sm text-slate-400">{deal.originCity} to {deal.destinationCountry}</p>
                        <h3 className="mt-1 text-2xl font-black tracking-tight text-white">{deal.origin} <span className="text-cyan-300">→</span> {deal.destination}</h3>
                        <p className="mt-1 font-semibold text-slate-200">{deal.destinationCity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black tracking-tight text-amber-200">{currency.format(deal.priceEur)}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{deal.tripType}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 border-y border-white/10 py-4 text-sm text-slate-300 sm:grid-cols-2">
                      <p className="flex items-center gap-2"><CalendarDays className="size-4 text-cyan-300" /> {formatTravelDate(deal.departureDate)}{deal.returnDate ? ` – ${formatTravelDate(deal.returnDate)}` : ""}</p>
                      <p className="flex items-center gap-2"><Route className="size-4 text-cyan-300" /> {deal.stops == null ? "Stops not listed" : deal.stops === 0 ? "Direct" : `${deal.stops} stop${deal.stops === 1 ? "" : "s"}`}</p>
                      <p className="flex items-center gap-2"><Clock3 className="size-4 text-cyan-300" /> First caught {formatObservedAt(deal.firstSeenAt)}</p>
                      <p className="flex items-center gap-2"><RefreshCw className="size-4 text-cyan-300" /> Seen in {deal.timesSeen} scan{deal.timesSeen === 1 ? "" : "s"}</p>
                    </div>

                    <div className="mt-4 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                      <span>Last seen: {formatObservedAt(deal.lastSeenAt)}</span>
                      {deal.goneAt && <span>Marked gone: {formatObservedAt(deal.goneAt)}</span>}
                    </div>

                    <Button asChild variant="outline" className="mt-5 w-full border-white/15 bg-transparent text-white hover:bg-white/10">
                      <a href={deal.googleFlightsUrl} target="_blank" rel="noreferrer">{deal.status === "active" ? "Check live fare" : "Recheck this route"} <ExternalLink /></a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 border border-dashed border-white/15 bg-white/[0.025] px-6 py-16 text-center">
            <Archive className="mx-auto size-8 text-slate-500" />
            <h3 className="mt-5 text-xl font-bold text-white">No bargains in this view yet</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">The archive begins with the first scan after history tracking was enabled.</p>
          </div>
        )}

        {data.deals.length < data.total && (
          <div className="mt-10 text-center">
            <Button disabled={loading} onClick={() => void loadHistory(filter, data.deals.length, true)} className="bg-cyan-300 font-bold text-[#041019] hover:bg-cyan-200">
              {loading ? <><RefreshCw className="animate-spin" /> Loading</> : "Load more bargains"}
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
