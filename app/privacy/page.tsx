import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plane, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "How BargainFlights.eu handles email addresses submitted to the airport-expansion interest list.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const controllerName = process.env.WAITLIST_CONTROLLER_NAME || "";
  const privacyEmail = process.env.WAITLIST_PRIVACY_EMAIL || "";
  const active = Boolean(controllerName && privacyEmail);

  return (
    <div className="min-h-screen bg-[#071019] text-[#f4f8fb]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="BargainFlights.eu home">
            <span className="grid size-9 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300">
              <Plane className="size-4 -rotate-12" />
            </span>
            <span className="text-sm font-bold tracking-[0.08em] text-white">BARGAINFLIGHTS.EU</span>
          </Link>
          <Link href="/documentation#expansion" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-cyan-300">
            <ArrowLeft className="size-3.5" /> Interest list
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex items-center gap-3 text-cyan-300">
          <span className="grid size-10 place-items-center rounded-xl bg-cyan-300/10"><ShieldCheck className="size-5" /></span>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em]">Plain-language privacy notice</p>
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">Expansion interest list privacy.</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
          This notice applies only to the form used to measure interest in adding more departure cities to BargainFlights.eu. It is not a general newsletter signup.
        </p>

        {!active && (
          <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-5 text-sm leading-7 text-amber-100/80">
            The interest list is not accepting email addresses yet. The responsible person or company and a working privacy contact will be published here before collection opens.
          </div>
        )}

        <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {[
            {
              title: "Who controls the data",
              body: active
                ? `${controllerName} is the data controller for this interest list. Privacy requests can be sent to ${privacyEmail}.`
                : "Controller details have not been configured because the interest list is not active.",
            },
            {
              title: "What is collected",
              body: "Your email address, your optional preferred departure airport, the time you joined and the consent wording version. For abuse prevention, a one-way hash derived from the requesting IP address is kept for no longer than 24 hours; the raw IP address is not placed in the interest list.",
            },
            {
              title: "Why it is collected",
              body: "The information is used to count genuine interest, understand which departure airports people want, and contact participants only when there is meaningful news about expanded coverage. The processing is based on the consent given with the form.",
            },
            {
              title: "Where it is stored",
              body: "The website runs on Vercel and the interest list is designed to use an Upstash Redis database with server-side credentials. These providers process technical data needed to host the site and save submissions. Their contractual safeguards govern any processing outside the European Economic Area.",
            },
            {
              title: "How long it is kept",
              body: "Interest-list records are reviewed after 12 months and deleted when they are no longer needed for the expansion decision. A record may be removed sooner when consent is withdrawn.",
            },
            {
              title: "Your choices",
              body: "You may ask whether your email is stored, request access or correction, restrict processing, receive your supplied data, or withdraw consent and request deletion. Withdrawing consent does not affect processing that took place before the withdrawal. You may also complain to the competent data-protection supervisory authority.",
            },
            {
              title: "Providing data and automation",
              body: "Joining is voluntary. Without an email address you cannot join the list. The submitted information is not used for automated decisions or profiling, and it is not sold to third parties.",
            },
          ].map((item) => (
            <section key={item.title} className="grid gap-3 py-7 sm:grid-cols-[190px_1fr] sm:gap-8">
              <h2 className="font-bold text-white">{item.title}</h2>
              <p className="text-sm leading-7 text-slate-400">{item.body}</p>
            </section>
          ))}
        </div>

        {active && (
          <section className="mt-10 rounded-2xl border border-white/10 bg-[#0b1722] p-6">
            <h2 className="font-bold text-white">Contact and deletion requests</h2>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              Write to <a href={"mailto:" + privacyEmail} className="text-cyan-300 underline decoration-cyan-300/30 underline-offset-2 hover:text-cyan-200">{privacyEmail}</a> from the address you submitted. This helps locate the correct record without asking for additional personal information.
            </p>
          </section>
        )}

        <p className="mt-8 text-xs text-slate-600">Last updated: 15 September 2026</p>
      </main>
    </div>
  );
}
