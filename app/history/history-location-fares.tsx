"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, ExternalLink, Plane, RefreshCw, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TripTypeBadge } from "@/components/trip-type-badge";
import type { HistoryPageData, HistoryStatusFilter } from "@/lib/history-store";
import { todayInBratislava } from "@/lib/local-date";
import { dealDirection } from "@/lib/trip-options";

const currency = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

function formatTravelDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(date);
}

function formatObservedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bratislava",
  }).format(date);
}

export default function HistoryLocationFares({ market, filter }: { market: string; filter: HistoryStatusFilter }) {
  const [data, setData] = useState<HistoryPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFares = useCallback(async (offset = 0, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/history?status=${filter}&market=${market}&offset=${offset}&limit=24&t=${Date.now()}`, {
        cache: "no-store", signal,
      });
      if (!response.ok) throw new Error("The fares for this location are temporarily unavailable.");
      const payload = await response.json() as HistoryPageData;
      if (signal?.aborted) return;
      setData((current) => offset > 0 && current
        ? { ...payload, deals: [...new Map([...current.deals, ...payload.deals].map((deal) => [deal.id, deal])).values()] }
        : payload);
    } catch (caught) {
      if (!signal?.aborted) setError(caught instanceof Error ? caught.message : "Could not load these fares.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [filter, market]);

  useEffect(() => {
    const controller = new AbortController();
    void loadFares(0, controller.signal);
    return () => controller.abort();
  }, [loadFares]);

  const today = todayInBratislava();
  return (
    <div aria-busy={loading}>
      {error && (
        <div role="alert" className="mt-5 rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">
          <p>{error}</p>
          <Button variant="outline" size="sm" disabled={loading} onClick={() => void loadFares(data ? data.offset + data.limit : 0)} className="mt-3 border-rose-200/30 bg-transparent text-rose-100"><RefreshCw /> Retry</Button>
        </div>
      )}
      {!data && loading && <p role="status" className="mt-5 flex items-center gap-2 text-sm text-slate-400"><RefreshCw className="size-4 animate-spin" /> Loading recorded fares…</p>}
      {data && data.deals.length === 0 && <p className="mt-5 text-sm text-slate-400">No matching fares for this location. Refresh the archive to see the latest records.</p>}
      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {data?.deals.map((deal) => {
          const departed = deal.departureDate < today;
          return (
            <article key={deal.id} className="min-w-0 rounded-xl border border-white/10 bg-[#0b1722] p-4 sm:p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><CalendarDays className="size-4 shrink-0 text-cyan-300" />{formatTravelDate(deal.departureDate)}</p>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <TripTypeBadge tripType={deal.tripType} />
                  <Badge variant="outline" className="border-white/15 text-slate-300">{dealDirection(deal) === "return" ? "Return home" : "Going abroad"}</Badge>
                  <Badge className={departed ? "border border-amber-300/25 bg-amber-300/10 text-amber-200" : deal.status === "active" ? "border border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border border-slate-400/20 bg-slate-400/10 text-slate-300"}>
                    {departed ? "Departed" : deal.status === "active" ? "Active now" : "No longer listed"}
                  </Badge>
                </div>
                <p className="text-2xl font-black tracking-tight text-amber-300">{currency.format(deal.priceEur)}</p>
              </div>
              <h5 className="mt-4 text-xl font-black text-white">{deal.origin} <span className="text-cyan-300">→</span> {deal.destination}</h5>
              <p className="mt-1 text-xs text-slate-400">{deal.originCity} to {deal.destinationCity}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5"><Plane className="size-3.5 text-cyan-300" />{deal.airline || "Airline not listed"}</span>
                <span className="inline-flex items-center gap-1.5"><Route className="size-3.5 text-cyan-300" />{deal.stops == null ? "Stops not listed" : deal.stops === 0 ? "Direct" : `${deal.stops} stop${deal.stops === 1 ? "" : "s"}`}</span>
                {deal.returnDate && <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5 text-cyan-300" />Back {formatTravelDate(deal.returnDate)}</span>}
              </div>
              <div className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-xs text-slate-500">
                <p className="flex items-center gap-1.5"><Clock3 className="size-3.5 shrink-0" />First caught {formatObservedAt(deal.firstSeenAt)}</p>
                <p>Last seen: {formatObservedAt(deal.lastSeenAt)} · {deal.timesSeen} scan{deal.timesSeen === 1 ? "" : "s"}</p>
                {deal.goneAt && <p>Marked gone: {formatObservedAt(deal.goneAt)}</p>}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                <Button asChild className="bg-cyan-300 font-bold text-[#041019] hover:bg-cyan-200"><Link href={`/deals/${deal.id}`}>Build trip options</Link></Button>
                <Button asChild variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10">
                  <a href={deal.googleFlightsUrl} target="_blank" rel="noreferrer" aria-label={!departed && deal.status === "active" ? "Open fare directly" : "Recheck this route"}><ExternalLink /></a>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      {data && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <p>{data.deals.length} of {data.total} recorded fares shown</p>
          {data.offset + data.limit < data.total && <Button disabled={loading} onClick={() => void loadFares(data.offset + data.limit)} variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10">{loading ? <><RefreshCw className="animate-spin" /> Loading</> : "More fares for this location"}</Button>}
        </div>
      )}
    </div>
  );
}
