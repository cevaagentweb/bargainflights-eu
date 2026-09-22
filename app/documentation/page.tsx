import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  ExternalLink,
  MapPin,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { WaitlistForm } from "@/components/waitlist-form";

export const metadata: Metadata = {
  title: "Cheap Flight Guide from Vienna, Budapest & Prague",
  description:
    "How BargainFlights.eu finds unusually cheap flights from Vienna, Budapest and Prague, how to read each deal, and what the independent flight scanner will cover next.",
  alternates: { canonical: "/documentation" },
  openGraph: {
    title: "The BargainFlights.eu guide and mission",
    description:
      "A practical guide to finding and evaluating unusually cheap flights from Central Europe.",
    url: "/documentation",
    type: "article",
  },
};

const chapters = [
  ["mission", "Our mission"],
  ["scanner", "How the scanner works"],
  ["bargain", "What counts as a bargain"],
  ["reading", "How to read a deal"],
  ["timing", "Why fares change"],
  ["coverage", "Airports and regions"],
  ["expansion", "What we may add next"],
  ["faq", "Frequently asked questions"],
] as const;

const faqs = [
  {
    question: "What is BargainFlights.eu?",
    answer:
      "BargainFlights.eu is an independent flight-deal board. It scans selected route and date combinations from Central European airports and publishes only fares that pass its price filter.",
  },
  {
    question: "Which departure airports are currently covered?",
    answer:
      "The first version focuses on Vienna (VIE), Budapest (BUD) and Prague (PRG). The expansion interest list helps decide which airport should be added next.",
  },
  {
    question: "Does BargainFlights.eu sell flights?",
    answer:
      "No. BargainFlights.eu does not sell tickets or take payment. Each result links to a Google Flights search where you can recheck the current fare and continue to an airline or booking provider.",
  },
  {
    question: "Why can the price be different when I open a deal?",
    answer:
      "Airfares are dynamic. Seats can sell, availability can change and airlines can update fares between a scan and your visit. The price shown is evidence of what the scanner found, not a guaranteed quote.",
  },
  {
    question: "Are the fares one-way or return?",
    answer:
      "Both can appear. Outbound and homebound one-way fares must be below €221, while direct round-trip results must be below €440. A deal page can also pair two one-way fares from the same market or selected nearby hubs. Every card identifies the trip type and shows the return date when one is part of the result.",
  },
  {
    question: "How do I request another departure city?",
    answer:
      "Join the expansion interest list and optionally select the airport that would help you most. The list is used to measure demand, not to send a general travel newsletter.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

function ChapterLabel({ number }: { number: string }) {
  return (
    <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
      Chapter {number}
    </p>
  );
}

export default function DocumentationPage() {
  const waitlistEnabled = Boolean(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
    (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN) &&
    process.env.WAITLIST_CONTROLLER_NAME &&
    process.env.WAITLIST_PRIVACY_EMAIL,
  );

  return (
    <div className="min-h-screen bg-[#071019] text-[#f4f8fb]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
        }}
      />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#071019]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="BargainFlights.eu home">
            <span className="grid size-9 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300">
              <Plane className="size-4 -rotate-12" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[0.08em] text-white">BARGAINFLIGHTS.EU</span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-slate-500">Guide & mission</span>
            </span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 transition hover:text-cyan-300">
            <ArrowLeft className="size-3.5" /> Live deals
          </Link>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_72%_24%,rgba(103,232,249,0.16),transparent_27%),radial-gradient(circle_at_90%_70%,rgba(251,191,36,0.10),transparent_24%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="max-w-4xl">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">BargainFlights field guide</p>
              <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
                A clearer way to find unusually cheap flights from Central Europe.
              </h1>
              <p className="mt-7 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                BargainFlights.eu watches selected fares from Vienna, Budapest and Prague and publishes the rare prices worth a closer look. This guide explains what the scanner does, what it does not do, and how to use each result with realistic expectations.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Vienna · VIE", "Budapest · BUD", "Prague · PRG", "Independent scanner"].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:py-20">
          <aside>
            <nav className="lg:sticky lg:top-24" aria-label="Guide chapters">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">In this guide</p>
              <ol className="mt-5 grid gap-1 border-l border-white/10">
                {chapters.map(([id, label], index) => (
                  <li key={id}>
                    <a href={"#" + id} className="group flex gap-3 border-l border-transparent py-2.5 pl-4 text-sm text-slate-400 transition hover:border-cyan-300 hover:text-white">
                      <span className="font-mono text-xs text-slate-600 group-hover:text-cyan-300">{String(index + 1).padStart(2, "0")}</span>
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
              <Link href="/#deals" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
                See the latest fares <ArrowRight className="size-4" />
              </Link>
            </nav>
          </aside>

          <article className="min-w-0">
            <section id="mission" className="scroll-mt-24 border-b border-white/10 pb-16">
              <ChapterLabel number="01" />
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Our mission: less searching, more signal.</h2>
              <div className="mt-7 grid gap-6 text-[15px] leading-7 text-slate-300 sm:text-base sm:leading-8">
                <p>
                  Cheap-flight websites often try to show every possible journey. BargainFlights.eu has a narrower purpose: surface a small number of prices that are unusual enough to justify changing a date, trying a nearby departure airport or taking a trip sooner than planned.
                </p>
                <p>
                  The project began with a practical Central European problem. Travellers near Slovakia can often reach several major airports, yet comparing Vienna, Budapest and Prague across many destinations and dates is repetitive. A low fare may exist for only a short time and from only one of those airports.
                </p>
                <blockquote className="border-l-2 border-amber-300 bg-amber-300/[0.05] px-6 py-5 text-lg font-semibold leading-8 text-amber-100">
                  The goal is not to promise the “cheapest flight”. It is to make genuinely interesting fares easier to notice while they still exist.
                </blockquote>
                <p>
                  BargainFlights.eu is independent. It does not sell tickets, accept payment or rank results according to commission. A published deal is an invitation to investigate—not a recommendation to book without checking the itinerary and final conditions.
                </p>
              </div>
            </section>

            <section id="scanner" className="scroll-mt-24 border-b border-white/10 py-16">
              <ChapterLabel number="02" />
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">How the flight scanner works.</h2>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300">
                The scanner repeatedly checks selected route-and-date combinations. It keeps the public board deliberately small by publishing only results that pass its configured price threshold.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  { icon: Search, step: "01", title: "Search", text: "Selected origins, destinations and travel dates are checked in repeatable batches." },
                  { icon: Sparkles, step: "02", title: "Filter", text: "Ordinary prices are removed. Only fares that meet the current deal rule continue." },
                  { icon: Plane, step: "03", title: "Publish", text: "Useful trip details and a Google Flights search link are placed on the public board." },
                ].map(({ icon: Icon, step, title, text }) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-[#0b1722] p-6">
                    <div className="flex items-center justify-between">
                      <span className="grid size-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300"><Icon className="size-4" /></span>
                      <span className="font-mono text-xs text-slate-600">{step}</span>
                    </div>
                    <h3 className="mt-5 font-bold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
              <p className="mt-7 text-sm leading-7 text-slate-400">
                Search coverage is selective rather than universal. A route that does not appear may simply be outside the current scan set, or its latest price may not have qualified.
              </p>
            </section>

            <section id="bargain" className="scroll-mt-24 border-b border-white/10 py-16">
              <ChapterLabel number="03" />
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">What counts as a bargain flight?</h2>
              <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
                <div className="space-y-5 text-base leading-8 text-slate-300">
                  <p>
                    The current public board focuses on fares below its configured deal ceiling. Price is the first filter because it is objective and easy to compare, but a low number alone does not make every itinerary good.
                  </p>
                  <p>
                    Check the trip type, number of stops, total journey, baggage rules, airport changes and connection times. A €140 one-way fare and a €280 return fare answer different travel needs. A long overnight connection may be worthwhile for one traveller and useless for another.
                  </p>
                  <p>
                    When a typical-range reference is available, the card may show how far the discovered fare sits below that lower range. Treat this as context, not a promise about future prices.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">A useful deal answers</p>
                  <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
                    {[
                      "Is the price for one direction or the full return journey?",
                      "Are the dates and departure airport practical for you?",
                      "How many stops and airport changes are involved?",
                      "Is the final live price still available?",
                      "What baggage and change conditions apply?",
                    ].map((item) => (
                      <li key={item} className="flex gap-3"><ShieldCheck className="mt-1 size-4 shrink-0 text-emerald-300" />{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section id="reading" className="scroll-mt-24 border-b border-white/10 py-16">
              <ChapterLabel number="04" />
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">How to read and verify a deal.</h2>
              <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
                {[
                  ["Route", "Airport codes identify the exact origin and destination. Check whether either city has more than one airport."],
                  ["Price", "The euro amount is the fare observed during the scan. It may change before you open or complete a booking."],
                  ["Trip type", "One-way and round-trip results are labelled so that unlike itineraries are not confused."],
                  ["Direction", "Return home identifies a one-way fare from a monitored long-haul city back to Vienna, Budapest or Prague."],
                  ["Trip options", "Open a deal to see possible second legs from the same market or selected nearby hubs. Combined totals cover the displayed flights only; positioning travel and transfers are excluded."],
                  ["Travel dates", "Departure and return dates come from the discovered itinerary. Flexible dates may reveal alternatives."],
                  ["Stops", "Direct, one-stop and multi-stop journeys can differ greatly in total travel time and risk."],
                  ["Live search", "The Google Flights link recreates the search. Confirm the current total with the airline or booking provider before paying."],
                ].map(([label, description], index) => (
                  <div key={label} className="grid gap-2 border-b border-white/10 p-5 last:border-b-0 sm:grid-cols-[150px_1fr] sm:gap-6">
                    <p className="flex items-center gap-3 font-semibold text-white"><span className="font-mono text-xs text-cyan-300">{String(index + 1).padStart(2, "0")}</span>{label}</p>
                    <p className="text-sm leading-6 text-slate-400">{description}</p>
                  </div>
                ))}
              </div>
              <Link href="/#deals" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-[#041019] transition hover:bg-cyan-200">
                Open the live deal board <ExternalLink className="size-4" />
              </Link>
            </section>

            <section id="timing" className="scroll-mt-24 border-b border-white/10 py-16">
              <ChapterLabel number="05" />
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Why a cheap fare can disappear.</h2>
              <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_260px]">
                <div className="space-y-5 text-base leading-8 text-slate-300">
                  <p>
                    Airline pricing is dynamic. A fare can change when a low-price booking class sells out, the airline updates availability, a promotion ends, currency values move or another traveller completes a booking.
                  </p>
                  <p>
                    This is why every deal shows when the underlying scan finished. A fresh timestamp is useful context, but it cannot reserve a seat. Reopen the live search, confirm the dates and check the final amount before making plans.
                  </p>
                  <p>
                    Avoid rushing past important details. A good price does not compensate for an unsuitable visa requirement, self-transfer, overnight connection or baggage policy. If the journey is complex, read the operating airline’s conditions directly.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-6">
                  <Clock className="size-5 text-amber-300" />
                  <p className="mt-4 font-bold text-amber-100">Price found ≠ price reserved</p>
                  <p className="mt-2 text-sm leading-6 text-amber-100/65">The board records a discovery. Only the seller can confirm availability and complete a booking.</p>
                </div>
              </div>
            </section>

            <section id="coverage" className="scroll-mt-24 border-b border-white/10 py-16">
              <ChapterLabel number="06" />
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Current airports and destination regions.</h2>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300">
                The first version is built around airports that many travellers in and around Slovakia can reach by road, rail or connecting transport.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  ["VIE", "Vienna", "Austria"],
                  ["BUD", "Budapest", "Hungary"],
                  ["PRG", "Prague", "Czechia"],
                ].map(([code, city, country]) => (
                  <div key={code} className="rounded-2xl border border-white/10 bg-[#0b1722] p-6">
                    <p className="font-mono text-3xl font-black text-white">{code}</p>
                    <p className="mt-2 font-semibold text-cyan-300">{city}</p>
                    <p className="text-sm text-slate-500">{country}</p>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                {["East Africa", "Latin America", "Southeast Asia"].map((region) => (
                  <span key={region} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"><MapPin className="size-3.5 text-amber-300" />{region}</span>
                ))}
              </div>
              <p className="mt-7 text-sm leading-7 text-slate-400">
                Coverage changes as the scanner is refined. The deal board, not this list, is the authoritative view of what has qualified most recently.
              </p>
            </section>

            <section id="expansion" className="scroll-mt-24 border-b border-white/10 py-16">
              <ChapterLabel number="07" />
              <div className="rounded-3xl border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(103,232,249,0.10),rgba(11,23,34,0.9)_48%,rgba(251,191,36,0.06))] p-6 sm:p-10">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Help choose the next radar point</p>
                <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl">Would a version with more departure cities be useful?</h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
                  The first goal is simply to measure real interest. Join with your email and, if you want, tell us which airport would make the board more useful. This is not a daily deals newsletter. We will contact you only about meaningful expansion news.
                </p>
                <WaitlistForm enabled={waitlistEnabled} />
              </div>
            </section>

            <section id="faq" className="scroll-mt-24 pt-16">
              <ChapterLabel number="08" />
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Frequently asked questions.</h2>
              <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
                {faqs.map((faq) => (
                  <details key={faq.question} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold text-white">
                      {faq.question}
                      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-white/10 text-cyan-300 transition group-open:rotate-45">+</span>
                    </summary>
                    <p className="max-w-3xl pt-4 text-sm leading-7 text-slate-400">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </article>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} BargainFlights.eu · Independent flight-deal discovery</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
            <Link href="/" className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200">Live deals <ArrowRight className="size-3.5" /></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
