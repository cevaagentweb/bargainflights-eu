"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Archive, ArrowLeft, ChevronDown, Plane, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TripTypeBadge } from "@/components/trip-type-badge";
import type { HistoryStatusFilter } from "@/lib/history-store";
import type { HistoryLocationsData } from "@/lib/history-locations";
import HistoryLocationFares from "./history-location-fares";

const currency = new Intl.NumberFormat("en-IE", {
  style: "currency", currency: "EUR", maximumFractionDigits: 0,
});

function formatObservedAt(value: string | null) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bratislava",
  }).format(parsed);
}

const filters: Array<{ value: HistoryStatusFilter; label: string }> = [
  { value: "past", label: "Past departures" },
  { value: "all", label: "All finds" },
  { value: "active", label: "Active now" },
  { value: "gone", label: "No longer listed" },
];

export default function HistoryClient({ initialData }: { initialData: HistoryLocationsData }) {
  const [data, setData] = useState(initialData);
  const [filter, setFilter] = useState<HistoryStatusFilter>("past");
  const [openLocation, setOpenLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (nextFilter: HistoryStatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/history?view=locations&status=${nextFilter}&t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("The history is temporarily unavailable.");
      setData(await response.json() as HistoryLocationsData);
      setFilter(nextFilter);
      setOpenLocation(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load the history.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#071019] text-[#f4f8fb]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#071019]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="BargainFlights.eu home">
            <span className="grid size-9 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300"><Plane className="size-4 -rotate-12" /></span>
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
          <Badge className="border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200"><Archive className="mr-2 size-3.5" /> Deal history</Badge>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">Bargains that came—and went.</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">One location, all its recorded bargains. Open a destination to explore past dates and fares, from cheapest to most expensive.</p>
          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[["All recorded", data.counts.all], ["Past departures", data.counts.past], ["Active now", data.counts.active], ["No longer listed", data.counts.gone]].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:text-xs">{label}</p>
                <p className="mt-2 text-3xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16" aria-busy={loading}>
        <div className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">Browse history by location</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Flight bargain archive</h2>
            <p className="mt-2 text-sm text-slate-400">Last history update: {formatObservedAt(data.lastUpdated)}</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="History status filter">
            {filters.map((item) => (
              <button key={item.value} type="button" aria-pressed={filter === item.value} disabled={loading} onClick={() => void loadHistory(item.value)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition disabled:opacity-50 ${filter === item.value ? "border-cyan-300 bg-cyan-300 text-[#041019]" : "border-white/15 bg-white/[0.025] text-slate-300 hover:border-cyan-300/40 hover:text-white"}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rose-400/25 bg-rose-400/10 px-5 py-4 text-sm text-rose-100"><span>{error}</span><Button variant="outline" size="sm" disabled={loading} onClick={() => void loadHistory(filter)} className="border-rose-200/30 bg-transparent text-rose-100"><RefreshCw /> Retry</Button></div>}

        {loading ? <p role="status" className="mt-8 flex items-center gap-2 text-sm text-slate-400"><RefreshCw className="size-4 animate-spin" /> Loading locations…</p> : data.locations.length > 0 ? (
          <div className="mt-6">
            <p className="text-sm text-slate-400"><strong className="text-white">{data.locations.length}</strong> location{data.locations.length === 1 ? "" : "s"} · {data.total} recorded fare{data.total === 1 ? "" : "s"}</p>
            <p className="mt-1 text-xs text-slate-500">Lowest recorded prices first. Past fares may no longer be available.</p>
            <div className="mt-5 space-y-3">
              {data.locations.map((location, index) => {
                const expanded = openLocation === location.key;
                return (
                  <div key={location.key} className={`overflow-hidden rounded-2xl border bg-[#0b1722] transition-colors ${expanded ? "border-cyan-300/45" : "border-white/10 hover:border-cyan-300/30"}`}>
                    <button type="button" aria-expanded={expanded} aria-controls={expanded ? `history-location-${location.key}` : undefined} onClick={() => setOpenLocation(expanded ? null : location.key)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-4 p-5 text-left transition hover:bg-white/[0.025] sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-300">#{String(index + 1).padStart(2, "0")} · {location.region}</p>
                        <h3 className="mt-2 break-words text-2xl font-black text-white sm:text-3xl">{location.city} <span className="font-mono text-sm font-semibold text-slate-500">{location.key}</span></h3>
                        <p className="mt-2 text-sm text-slate-400">{location.dateCount} travel date{location.dateCount === 1 ? "" : "s"} · {location.fareCount} fare{location.fareCount === 1 ? "" : "s"}</p>
                        <p className="mt-1 text-xs text-slate-500">{[
                          location.pastCount > 0 ? `${location.pastCount} departed` : null,
                          location.activeCount > 0 ? `${location.activeCount} active now` : null,
                          location.goneCount > 0 ? `${location.goneCount} no longer listed` : null,
                        ].filter(Boolean).join(" · ")}</p>
                      </div>
                      <div className="col-span-2 row-start-2 flex flex-wrap gap-2 text-xs font-semibold lg:col-auto lg:row-auto">
                        {location.outboundBest !== null && <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-cyan-100">Outbound from {currency.format(location.outboundBest)}</span>}
                        {location.returnBest !== null && <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-emerald-100">Homebound from {currency.format(location.returnBest)}</span>}
                      </div>
                      <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 lg:col-auto lg:row-auto">
                        <div className="max-w-24 text-right">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Lowest recorded</p>
                          <p className="mt-1 text-3xl font-black tracking-tight text-amber-300">{currency.format(location.bestDeal.priceEur)}</p>
                          <div className="mt-1 flex justify-end"><TripTypeBadge tripType={location.bestDeal.tripType} /></div>
                        </div>
                        <ChevronDown className={`size-5 shrink-0 text-cyan-300 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    {expanded && (
                      <div id={`history-location-${location.key}`} className="border-t border-white/10 bg-[#08131d] p-5 sm:p-6">
                        <h4 className="text-lg font-bold text-white">Recorded dates and fares for {location.city}</h4>
                        <p className="mt-1 text-sm text-slate-400">Cheapest to most expensive. Each fare shows its travel date and current status.</p>
                        <HistoryLocationFares key={`${filter}-${location.key}`} market={location.key} filter={filter} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-8 border border-dashed border-white/15 bg-white/[0.025] px-6 py-16 text-center">
            <Archive className="mx-auto size-8 text-slate-500" />
            <h3 className="mt-5 text-xl font-bold text-white">No bargains in this view yet</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">Try All finds to explore the other recorded fares.</p>
          </div>
        )}
      </section>
    </main>
  );
}
