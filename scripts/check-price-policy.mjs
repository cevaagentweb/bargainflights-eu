import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const cache = new Map();
function load(relative) {
  if (cache.has(relative)) return cache.get(relative);
  if (relative.endsWith(".json")) return JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true}}).outputText;
  const module = {exports: {}};
  const localRequire = (specifier) => {
    assert.ok(specifier.startsWith("@/"), `Unexpected import: ${specifier}`);
    const target = specifier.slice(2);
    return load(target.endsWith(".json") ? target : `${target}.ts`);
  };
  new Function("require", "module", "exports", compiled)(localRequire, module, module.exports);
  cache.set(relative, module.exports);
  return module.exports;
}

const policy = load("lib/price-policy.ts");
const {findTripOptions} = load("lib/trip-options.ts");
for (const code of ["BOG", "LIM", "BKK", "NRT", "PEK", "BGI", "ANU", "PTY", "SJO", "POS", "TAB", "AUA", "CUR", "FDF", "PTP", "MRU", "SYD", "AKL"]) {
  assert.equal(policy.oneWayLimitForDeal({origin: "VIE", destination: code}), 330, code);
  assert.equal(policy.roundTripLimitForDeal({origin: code, destination: "VIE", routeDirection: "return"}), 660, code);
}
for (const code of ["CUN", "MEX", "MBJ", "PUJ", "SDQ", "POP", "HAV", "MLE", "MBA", "ZNZ", "CPT", "JNB", "SEZ", "BLR", "MAA", "COK"]) {
  assert.equal(policy.oneWayLimitForDeal({origin: "VIE", destination: code}), 221, code);
  assert.equal(policy.roundTripLimitForDeal({origin: code, destination: "VIE"}), 440, code);
}

const outbound = {id: "out", origin: "VIE", destination: "BKK", marketCode: "BKK", tripType: "One Way", departureDate: "2027-02-10", priceEur: 329.99};
const homebound = {id: "in", origin: "BKK", destination: "VIE", marketCode: "BKK", routeDirection: "return", tripType: "One Way", departureDate: "2027-02-24", priceEur: 329.99};
assert.equal(findTripOptions(outbound, [homebound]).length, 1);
assert.equal(findTripOptions(homebound, [outbound]).length, 1);
assert.equal(findTripOptions({...outbound, priceEur: 330}, [homebound]).length, 0);
assert.equal(findTripOptions(outbound, [{...homebound, priceEur: 330}]).length, 0);
const nearOut = {...outbound, destination: "ZNZ", marketCode: "ZNZ", priceEur: 220};
const nearIn = {...homebound, origin: "ZNZ", marketCode: "ZNZ", priceEur: 220};
assert.equal(findTripOptions(nearOut, [nearIn]).length, 1);
assert.equal(findTripOptions({...nearOut, priceEur: 220.5}, [{...nearIn, priceEur: 220.5}]).length, 0);
assert.equal(findTripOptions(nearOut, [{...nearIn, priceEur: 221}]).length, 0);
assert.equal(policy.isFartherDestination("", "Madagascar", "Africa"), true);
assert.equal(policy.isFartherDestination("", "India", "South Asia"), false);
console.log("Website price tiers and both-direction trip pairing checks passed.");
