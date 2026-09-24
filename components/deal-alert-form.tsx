"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Check, LoaderCircle, Mail } from "lucide-react";

type Availability = "checking" | "open" | "closed";
type SubmissionState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function DealAlertForm() {
  const [availability, setAvailability] = useState<Availability>("checking");
  const [state, setState] = useState<SubmissionState>({ kind: "idle" });

  useEffect(() => {
    let active = true;
    fetch("/api/alerts/status", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ enabled?: boolean }>)
      .then((result) => {
        if (active) setAvailability(result.enabled ? "open" : "closed");
      })
      .catch(() => {
        if (active) setAvailability("closed");
      });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (availability !== "open") return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setState({ kind: "submitting" });

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fields.get("email"),
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
        message: result.status === "already_joined"
          ? "This email is already on the flight-alert interest list."
          : "Thanks — your interest has been recorded. No flight emails are being sent yet.",
      });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to join the list.",
      });
    }
  }

  const disabled = availability !== "open" || state.kind === "submitting";

  return (
    <form onSubmit={submit} className="mt-6" noValidate>
      <div className="pointer-events-none absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="alert-website">Website</label>
        <input id="alert-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Email address for future flight alerts</span>
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={254}
            disabled={disabled}
            placeholder="you@example.com"
            className="h-12 w-full rounded-xl border border-white/15 bg-[#071019] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15 disabled:opacity-60"
          />
        </label>
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 text-sm font-bold text-[#041019] transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60"
        >
          {state.kind === "submitting" ? <><LoaderCircle className="size-4 animate-spin" /> Saving</> :
            availability === "checking" ? <><LoaderCircle className="size-4 animate-spin" /> Checking</> :
            availability === "closed" ? <>Opening soon <Mail className="size-4" /></> :
            <>Join the list <ArrowRight className="size-4" /></>}
        </button>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-400">
        <input
          name="consent"
          type="checkbox"
          value="yes"
          required
          disabled={disabled}
          className="mt-0.5 size-4 shrink-0 accent-cyan-300"
        />
        <span>
          I agree that BargainFlights.eu may store my email for the flight-alert interest list and contact me about cheap flights if email alerts launch. No emails are being sent yet. I can withdraw at any time. See the <a href="/privacy" className="text-cyan-300 underline decoration-cyan-300/30 underline-offset-2 hover:text-cyan-200">privacy notice</a>.
        </span>
      </label>

      {availability === "closed" && (
        <p className="mt-4 text-sm text-amber-200/80" role="status">
          Signups will open when the privacy contact is confirmed.
        </p>
      )}
      {state.kind === "success" && (
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-300" role="status">
          <Check className="size-4" /> {state.message}
        </p>
      )}
      {state.kind === "error" && (
        <p className="mt-4 text-sm font-medium text-rose-300" role="alert">{state.message}</p>
      )}
    </form>
  );
}
