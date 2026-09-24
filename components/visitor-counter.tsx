"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UsersRound } from "lucide-react";

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/visitors", { method: "POST", cache: "no-store" })
      .then((response) => response.json() as Promise<{ count?: number | null }>)
      .then((result) => {
        if (active && typeof result.count === "number") setCount(result.count);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (count === null) return null;

  return (
    <footer className="border-t border-white/10 bg-[#071019] text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs sm:px-8">
        <span className="inline-flex items-center gap-2">
          <UsersRound className="size-4 text-cyan-300" />
          Approx. unique visitors: <strong className="font-mono text-sm text-white">{count.toLocaleString("en-GB")}</strong>
        </span>
        <span>Counted since this counter launched · <Link href="/privacy" className="text-cyan-300 hover:text-cyan-200">How it works</Link></span>
      </div>
    </footer>
  );
}
