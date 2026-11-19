'use strict';
// Usage: node w46.js <repoDir> [jsonParamOverrides]  -> prints JSON summary of W46 (central) + R6 floor behaviour over W01..W46
// Read-only: loads engine/lib.js and the ledger from <repoDir>, writes nothing.
const path = require('path');
const repo = path.resolve(process.argv[2]);
const E = require(path.join(repo, 'engine', 'lib.js'));
const over = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const P = E.defaultParams();
function deepSet(o, k, v) { const ks = k.split('.'); let t = o; for (let i = 0; i < ks.length - 1; i++) t = t[ks[i]]; t[ks[ks.length - 1]] = v; }
for (const k in over) deepSet(P, k, over[k]);
const ledger = E.loadLedger(repo);
const firstMon = E.isoWeekMonday(2026, 1);
const lastWeek = +(process.env.LASTW || 46);
const CLIFF = ['reversion', 'selfdestruct'];
const pp = x => Math.round(x * 1000) / 10;
const summarise = (w, sites) => {
  const top = Object.entries(sites).sort((a, b) => b[1] - a[1]);
  return { leader: top[0][0], leader_pp: pp(top[0][1]), second: top[1][0], second_pp: pp(top[1][1]),
    top5: top.slice(0, 5).map(([k, v]) => k + ' ' + pp(v)), cliffs_pp: pp(CLIFF.reduce((a, s) => a + sites[s], 0)),
    roads: Object.fromEntries(E.ROADS.concat(['None']).map(T => [T, pp(w[T])])) };
};
const floorWeeks = { baseline: [], normal: [], loc: [], many: [] };
let last = null;
const weeksToRun = process.env.ONLYLAST ? [lastWeek] : Array.from({ length: lastWeek }, (_, i) => i + 1);
for (const wk of weeksToRun) {
  const asOf = E.dstr(firstMon + 7 * wk);
  const C = E.centralWeek(ledger, asOf, P);
  for (const L in floorWeeks) if (C.lenses[L].w.R6 <= P.roadFloor + 1e-6) floorWeeks[L].push(wk);
  if (wk === lastWeek) last = C;
}
const out = { week: lastWeek, lenses: {} };
for (const L in last.lenses) out.lenses[L] = summarise(last.lenses[L].w, last.lenses[L].sites);
out.lenses.pooled = summarise(last.pooled.w, last.pooled.sites);
if (!process.env.ONLYLAST) out.r6_floor = Object.fromEntries(Object.entries(floorWeeks).map(([L, a]) => [L, { first_week: a[0] || null, weeks_at_floor: a.length }]));
if (E.sourceWeights) { const pv = E.buildProviders(ledger, E.dstr(firstMon + 7 * lastWeek), P); out.dedup = pv.dedup; }
console.log(JSON.stringify(out));
