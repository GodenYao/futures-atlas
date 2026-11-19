'use strict';
// One-at-a-time sensitivity of the W46 result. Usage: [OVR='{"srcDedup":false}'] node sens.js <repoDir> > sens.json   (reads only)
const path = require('path');
const repo = path.resolve(process.argv[2]);
const E = require(path.join(repo, 'engine', 'lib.js'));
{ const dp = E.defaultParams; const ov = JSON.parse(process.env.OVR || '{}'); E.defaultParams = () => Object.assign(dp(), ov); }
const ledger0 = E.loadLedger(repo);
const asOf = E.dstr(E.isoWeekMonday(2026, 1) + 7 * 46);
const ROADS = E.ROADS, LK = Object.keys(E.LENSES);
const pp = x => Math.round(x * 1000) / 10;
function deepSet(o, k, v) { const ks = k.split('.'); let t = o; for (let i = 0; i < ks.length - 1; i++) t = t[ks[i]]; t[ks[ks.length - 1]] = v; }
function deepGet(o, k) { return k.split('.').reduce((a, x) => a[x], o); }
function run(P, ledger) {
  const C = E.centralWeek(ledger || ledger0, asOf, P);
  const rank = s => Object.entries(s).sort((a, b) => b[1] - a[1]);
  const pr = rank(C.pooled.sites);
  const o = { leader: pr[0][0], lead_pp: pp(pr[0][1]), second: pr[1][0], margin_pp: pp(pr[0][1] - pr[1][1]), roads: Object.fromEntries(ROADS.map(T => [T, pp(C.pooled.w[T])])), lens: {} };
  for (const L of LK) { const r = rank(C.lenses[L].sites); o.lens[L] = r[0][0]; }
  o.r6floor = LK.filter(L => C.lenses[L].w.R6 <= P.roadFloor + 1e-6).length;
  return o;
}
const base = run(E.defaultParams());
const rows = [];
function rec(group, name, central, lo, hi, rLo, rHi, why) {
  const flip = r => r.leader !== base.leader;
  const lensFlip = r => LK.filter(L => r.lens[L] !== base.lens[L]).map(L => L + '->' + r.lens[L]);
  const maxRoad = Math.max(...ROADS.flatMap(T => [Math.abs(rLo.roads[T] - base.roads[T]), Math.abs(rHi.roads[T] - base.roads[T])]));
  rows.push({ group, name, central, lo, hi, lo_res: { leader: rLo.leader, lead_pp: rLo.lead_pp, second: rLo.second, margin_pp: rLo.margin_pp, r6floor: rLo.r6floor, lensFlips: lensFlip(rLo) },
    hi_res: { leader: rHi.leader, lead_pp: rHi.lead_pp, second: rHi.second, margin_pp: rHi.margin_pp, r6floor: rHi.r6floor, lensFlips: lensFlip(rHi) }, flips: flip(rLo) || flip(rHi), max_road_pp: Math.round(maxRoad * 10) / 10, why });
}
// ---- engine parameters (P) ----
const PR = [
  ['beta', .5, 1.5], ['roadFloor', .005, .03], ['noneFloor', .01, .05], ['rClip.0', .02, .10], ['rClip.1', .90, .98],
  ['tierRho.1', .90, 1.0], ['tierRho.2', .75, .95], ['tierRho.3', .50, .85], ['rhoCap', .95, 1.0],
  ['deltaCapCluster', .4, 1.0], ['deltaCapIndicator', 1.0, 2.5], ['llCap', 1.0, 2.5], ['rhoF', .3, .7], ['diagFloor', .25, 1.0],
  ['fcCapSource', .3, .8], ['fcFamilyClip', .2, .8], ['fcShare', .15, .40],
  ['eventDeltaByKind.incident', .20, .70], ['eventDeltaByKind.announcement', .12, .45], ['eventDeltaByKind.report', .05, .30],
  ['confMult.med', .5, .85], ['confMult.low', .15, .5],
  ['instrDelta.high', .2, .7], ['instrDelta.med', .12, .45], ['instrDelta.low', .05, .2],
  ['stateShift.high', .25, 1.0], ['stateShift.med', .17, .7], ['stateShift.low', .1, .4], ['stateSpread', .5, 2.0],
  ['fcShift.high', .25, 1.0], ['fcShift.med', .17, .7], ['fcShift.low', .1, .4],
  ['halfLife.incident', 180, 730], ['halfLife.announcement', 90, 365], ['halfLife.report', 45, 180], ['halfLifeScale', .5, 2.0],
  ['btos.base', 15.0, 20.0], ['btos.sdPerYear', 2.0, 8.0], ['btos.resDate', '2027-08-15', '2028-02-15'],
  ['btos.thr.I-R2-02.0', 30.0, 40.0], ['btos.thr.I-R6-04.0', 22.0, 30.0], ['strengthScale', .5, 1.5],
];
for (const [k, lo, hi] of PR) {
  const P0 = E.defaultParams(); const c = k.startsWith('btos.thr.') ? P0.btos.thr[k.split('.')[2]][0] : deepGet(P0, k);
  const mk = v => { const P = E.defaultParams(); if (k.startsWith('btos.thr.')) P.btos.thr[k.split('.')[2]][0] = v; else deepSet(P, k, v); return P; };
  rec('engine', k, c, lo, hi, run(mk(lo)), run(mk(hi)));
}
// ---- lens priors: each road prior x0.5 / x1.5, other roads rescaled so the six roads keep their total ----
for (const L of LK) for (const T of ROADS) {
  const pr = E.LENSES[L].prior, keep = Object.assign({}, pr), tot = ROADS.reduce((a, x) => a + pr[x], 0);
  const at = f => { const v = keep[T] * f; const rest = tot - keep[T]; for (const x of ROADS) pr[x] = x === T ? v : keep[x] * (tot - v) / rest; const r = run(E.defaultParams()); Object.assign(pr, keep); return r; };
  rec('prior', `${L}.${T}`, keep[T], +(keep[T] * .5).toFixed(3), +(keep[T] * 1.5).toFixed(3), at(.5), at(1.5));
}
// ---- splits: each cell at its published lo / hi (rows renormalise) ----
for (const T of ROADS) for (const s in E.SPLITS[T]) {
  const cell = E.SPLITS[T][s], c = cell[0]; const at = v => { cell[0] = v; const r = run(E.defaultParams()); cell[0] = c; return r; };
  rec('split', `${T}->${s}`, c, cell[1], cell[2], at(cell[1]), at(cell[2]));
}
// ---- likelihood rows: each cell +-0.10 (kept in [0.02, 0.98]) ----
for (const id in E.IND) for (let j = 0; j < 6; j++) {
  const row = E.IND[id].row, c = row[j]; const lo = Math.max(.02, +(c - .1).toFixed(2)), hi = Math.min(.98, +(c + .1).toFixed(2));
  const at = v => { row[j] = v; const r = run(E.defaultParams()); row[j] = c; return r; };
  rec('row', `${id}[${ROADS[j]}]`, c, lo, hi, at(lo), at(hi));
}
// ---- rulings (structural on/off) ----
{ const L1 = Object.assign({}, ledger0, { resolutions: {} }); const r = run(E.defaultParams(), L1); rec('ruling', 'I-R4-01 MET ruling (off vs on)', 'on', 'off', 'on', r, base); }
// ---- break-even values for the two deciding splits ----
// scan from the central value down and up (step) until the pooled leader changes; report the first value and the new leader
function scan(name, c, setv, lo, hi, step, mkP) {
  const out = { name, central: c };
  for (const [dir, lim] of [['down', lo], ['up', hi]]) {
    out[dir] = null;
    for (let v = c; dir === 'down' ? v >= lim - 1e-9 : v <= lim + 1e-9; v += dir === 'down' ? -step : step) {
      const undo = setv(v); const r = run(mkP ? mkP(v) : E.defaultParams()); undo();
      if (r.leader !== base.leader) { out[dir] = { at: +v.toFixed(4), new_leader: r.leader }; break; }
    }
  }
  return out;
}
const sp = (T, s) => v => { const cell = E.SPLITS[T][s], c = cell[0]; cell[0] = v; return () => { cell[0] = c; }; };
const rw = (id, j) => v => { const row = E.IND[id].row, c = row[j]; row[j] = v; return () => { row[j] = c; }; };
const noop = () => () => {};
const be = [
  scan('split R1->enslaved', .70, sp('R1', 'enslaved'), .01, .99, .005),
  scan('split R4->conquerors', .45, sp('R4', 'conquerors'), .01, .99, .005),
  scan('split R4->descendants', .25, sp('R4', 'descendants'), .01, .99, .005),
  scan('split R1->o1984', .08, sp('R1', 'o1984'), .0, .5, .005),
  scan('split R6->normaltech', .70, sp('R6', 'normaltech'), .01, .99, .005),
  scan('row I-R4-01[R1]', .25, rw('I-R4-01', 0), .02, .98, .005),
  scan('row I-R4-01[R4]', .60, rw('I-R4-01', 3), .02, .98, .005),
  scan('beta (evidence strength)', 1, noop, .1, 2.5, .01, v => Object.assign(E.defaultParams(), { beta: v })),
  scan('eventDeltaByKind.incident', .40, noop, .05, 1.0, .01, v => { const P = E.defaultParams(); P.eventDeltaByKind.incident = v; return P; }),
];
// ---- Monte Carlo leader frequency (same draw design as mcWeek: k, rhoF, splits, prior noise per lens) ----
const P = E.defaultParams(); const pv = E.buildProviders(ledger0, asOf, P); const rng = E.mulberry32(46); const cnt = {}; const D = 4000;
for (let d = 0; d < D; d++) {
  const k = P.mc.strength[0] + (P.mc.strength[1] - P.mc.strength[0]) * rng(); const rhoF = P.mc.rhoF[0] + (P.mc.rhoF[1] - P.mc.rhoF[0]) * rng();
  const sp = E.drawSplits(rng); const ps = {}; for (const s of E.SITES) ps[s] = 0;
  for (const L of LK) { const pr = E.perturbPrior(E.LENSES[L].prior, rng, P.mc.priorSigma); const r = E.evalRoads(pr, pv.road, P, { k, rhoF }); const st = E.sitesOf(r.w, sp); for (const s of E.SITES) ps[s] += st[s] / 4; }
  const top = Object.entries(ps).sort((a, b) => b[1] - a[1])[0][0]; cnt[top] = (cnt[top] || 0) + 1;
}
const mcLeader = Object.fromEntries(Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, Math.round(v / D * 1000) / 10]));
console.log(JSON.stringify({ base, rows, break_even: be, mc_leader_freq_pct: mcLeader }, null, 1));
