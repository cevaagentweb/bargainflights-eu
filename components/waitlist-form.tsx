"use client";

import { FormEvent, useState } from "react";
import { Check, LoaderCircle, Mail, MapPin } from "lucide-react";

type SubmissionState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const originIdeas = [
  "Bratislava (BTS)",
  "Kraków (KRK)",
  "Warsaw (WAW)",
  "Zagreb (ZAG)",
  "Ljubljana (LJU)",
  "Another city",
];

export function WaitlistForm({ enabled }: { enabled: boolean }) {
  const [state, setState] = useState<SubmissionState>({ kind: "idle" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setState({ kind: "submitting" });

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fields.get("email"),
          city: fields.get("city"),
          consent: fields.get("consent") === "yes",
          website: fields.get("website"),
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        status?: "joined" | "already_joined";
      };

      if (!response.ok) throw new Error(result.error || "Unable to join the list.");

      form.reset();
      setState({
        kind: "success",
        message:
          result.status === "already_joined"
            ? "You are already on the interest list."
            : "You are on the list. We will only write when there is meaningful news.",
      });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to join the list.",
      });
    }
  }

  return (
    <form onSubmit={submit} className="mt-8" noValidate>
      <div className="pointer-events-none absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="waitlist-website">Website</label>
        <input id="waitlist-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_0.85fr_auto]">
        <label className="group relative block">
          <span className="sr-only">Email address</span>
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-300" />
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={254}
            disabled={!enabled}
            placeholder="you@example.com"
            className="h-12 w-full rounded-xl border border-white/15 bg-[#071019] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15"
          />
        </label>

        <label className="group relative block">
          <span className="sr-only">Airport you would like us to add</span>
          <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-300" />
          <select
            name="city"
            defaultValue=""
            disabled={!enabled}
            className="h-12 w-full appearance-none rounded-xl border border-white/15 bg-[#071019] pl-11 pr-8 text-sm text-slate-200 outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15"
          >
            <option value="">Airport to add (optional)</option>
            {originIdeas.map((idea) => (
              <option key={idea} value={idea}>{idea}</option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={!enabled || state.kind === "submitting"}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 text-sm font-bold text-[#041019] transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-70"
        >
          {!enabled ? (
            <>Opening soon <Mail className="size-4" /></>
          ) : state.kind === "submitting" ? (
            <><LoaderCircle className="size-4 animate-spin" /> Saving</>
          ) : (
            <>Join the interest list <Mail className="size-4" /></>
          )}
        </button>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-400">
        <input
          name="consent"
          type="checkbox"
          value="yes"
          required
          disabled={!enabled}
          className="mt-0.5 size-4 shrink-0 rounded border-white/20 bg-[#071019] accent-cyan-300"
        />
        <span>
          I agree that BargainFlights.eu may store my email to measure demand and contact me about expanded airport coverage. I can withdraw at any time. See the <a href="/privacy" className="text-cyan-300 underline decoration-cyan-300/30 underline-offset-2 hover:text-cyan-200">privacy notice</a>.
        </span>
      </label>

      {!enabled && (
        <p className="mt-4 text-sm text-amber-200/80" role="status">
          The interest list is ready and will open as soon as its free storage is connected.
        </p>
      )}

      {state.kind === "success" && (
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-300" role="status">
          <span className="grid size-5 place-items-center rounded-full bg-emerald-300/10"><Check className="size-3.5" /></span>
          {state.message}
        </p>
      )}
      {state.kind === "error" && (
        <p className="mt-4 text-sm font-medium text-rose-300" role="alert">{state.message}</p>
      )}
    </form>
  );
}
