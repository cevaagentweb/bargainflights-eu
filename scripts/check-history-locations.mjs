import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const cache = new Map();
function load(relative) {
  if (cache.has(relative)) return cache.get(relative);
  if (relative.endsWith(".json")) return JSON.parse(fs.readFileSync(relative, "utf8"));
  const compiled = ts.transpileModule(fs.readFileSync(relative, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)((specifier) => {
    assert.ok(specifier.startsWith("@/"), `Unexpected import: ${specifier}`);
    const target = specifier.slice(2);
    return load(path.extname(target) ? target : `${target}.ts`);
  }, module, module.exports);
  cache.set(relative, module.exports);
  return module.exports;
}

const { groupHistoryLocations, historyLocationFares } = load("lib/history-locations.ts");
const today = "2026-10-29";
const updated = "2026-10-29T09:00:00Z";
const base = {
  origin: "VIE", originCity: "Vienna", destination: "SSH", destinationCity: "Sharm El Sheikh (Dahab area)",
  destinationCountry: "Egypt", region: "Egypt", tripType: "One Way", departureDate: "2026-10-28",
  returnDate: null, priceEur: 127, status: "gone", firstSeenAt: updated, lastSeenAt: updated, goneAt: updated, timesSeen: 1,
};
// The cheapest fare is deliberately beyond the old first-24-record page.
const entries = Array.from({ length: 29 }, (_, index) => ({ ...base, id: `ssh-${index}`, priceEur: 127 + index }));
entries.push({ ...base, id: "ssh-cheapest", priceEur: 69, departureDate: "2026-10-27" });
entries.push({ ...base, id: "homebound-legacy", origin: "SSH", originCity: base.destinationCity, destination: "BUD", destinationCity: "Budapest", destinationCountry: "Hungary", priceEur: 79 });
entries.push({ ...base, id: "ssh-active", departureDate: today, priceEur: 90, status: "active", goneAt: null });
entries.push({ ...base, id: "cai", destination: "CAI", destinationCity: "Cairo", priceEur: 120 });
entries.push({ ...base, id: "cai-future-gone", destination: "CAI", destinationCity: "Cairo", departureDate: "2026-11-01", priceEur: 130 });

const all = groupHistoryLocations(entries, "all", today, updated);
assert.equal(all.locations.length, 2);
assert.equal(all.total, entries.length);
assert.equal(all.locations[0].key, "SSH");
assert.equal(all.locations[0].city, base.destinationCity);
assert.equal(all.locations[0].fareCount, 32);
assert.equal(all.locations[0].dateCount, 3);
assert.equal(all.locations[0].bestDeal.priceEur, 69);
assert.equal(all.locations[0].outboundBest, 69);
assert.equal(all.locations[0].returnBest, 79);
assert.equal(all.locations[0].activeCount, 1);
assert.equal(all.locations[0].pastCount, 31);
assert.equal(all.locations.reduce((sum, location) => sum + location.fareCount, 0), entries.length);
assert.deepEqual(all.counts, { all: 34, past: 32, active: 1, gone: 33 });

const past = groupHistoryLocations(entries, "past", today, updated);
assert.equal(past.total, 32);
assert.equal(past.locations[0].fareCount, 31);
const active = groupHistoryLocations(entries, "active", today, updated);
assert.equal(active.locations.length, 1);
assert.equal(active.locations[0].bestDeal.id, "ssh-active");
assert.equal(groupHistoryLocations(entries, "gone", today, updated).total, 33);
assert.deepEqual(groupHistoryLocations([], "all", today, null).locations, []);

const first = historyLocationFares(entries, { market: "ssh", status: "all", limit: 24 }, today, updated);
const second = historyLocationFares(entries, { market: "SSH", status: "all", limit: 24, offset: 24 }, today, updated);
assert.equal(first.total, 32);
assert.equal(first.deals[0].priceEur, all.locations[0].bestDeal.priceEur);
const full = [...first.deals, ...second.deals];
assert.equal(new Set(full.map((deal) => deal.id)).size, 32);
assert.ok(full.every((deal, index) => index === 0 || deal.priceEur >= full[index - 1].priceEur));
assert.equal(historyLocationFares(entries, { market: "SSH", status: "past" }, today, updated).total, 31);
assert.equal(historyLocationFares(entries, { market: "XXX", status: "all" }, today, updated).total, 0);
assert.equal(historyLocationFares(entries, { market: "SSH", status: "all", offset: Number.NaN, limit: Number.NaN }, today, updated).limit, 24);
assert.equal(entries[0].priceEur, 127, "Grouping must not reorder or modify the archive");
console.log("History grouping, direction inference, full-archive minima, status filters and fare pagination passed.");
