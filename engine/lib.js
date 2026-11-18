'use strict';
// Futures Atlas aggregation engine, method v4.2 §3 (evidence -> r_i -> roads -> sites). Defaults and sensitivities: engine/README.md.
// Node.js stdlib only. Deterministic given ledger + params + seed.
const fs = require('fs');
const path = require('path');

const METHOD_VERSION = '4.2.0-backfill';
const ROADS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
const NONE = 'None';

// ---------- §2.6 likelihood rows p(yes | R1..R6) and families ----------
const IND = {
  'I-R1-01': { row: [.85, .70, .60, .70, .30, .55], fam: 'compute-concentration' },
  'I-R1-02': { row: [.70, .40, .45, .45, .20, .30], fam: 'state-integration' },
  'I-R1-03': { row: [.85, .55, .60, .60, .35, .45], fam: 'state-integration' },
  'I-R1-04': { row: [.95, .85, .40, .95, .85, .85], fam: 'coordination' },
  'I-R1-05': { row: [.80, .70, .50, .80, .60, .25], fam: 'investment' },
  'I-R2-01': { row: [.45, .75, .35, .50, .45, .20], fam: 'labour-entry' },
  'I-R2-02': { row: [.55, .75, .40, .60, .65, .30], fam: 'adoption' },
  'I-R2-03': { row: [.60, .70, .45, .80, .60, .15], fam: 'capability' },
  'I-R2-04': { row: [.45, .70, .35, .45, .45, .30], fam: 'delegation' },
  'I-R2-05': { row: [.40, .65, .35, .45, .40, .25], fam: 'labour-entry' },
  'I-R3-01': { row: [.20, .15, .70, .40, .25, .10], fam: 'incident' },
  'I-R3-02': { row: [.10, .08, .45, .15, .08, .05], fam: 'restraint' },
  'I-R3-03': { row: [.35, .25, .70, .20, .20, .20], fam: 'restraint' },
  'I-R3-04': { row: [.05, .05, .40, .05, .10, .05], fam: 'coordination' },
  'I-R3-05': { row: [.40, .20, .65, .15, .15, .20], fam: 'restraint' },
  'I-R4-01': { row: [.25, .25, .40, .60, .35, .08], fam: 'control-failure' },
  'I-R4-02': { row: [.45, .55, .45, .75, .45, .10], fam: 'capability' },
  'I-R4-03': { row: [.55, .50, .30, .75, .50, .30], fam: 'race-pressure' },
  'I-R4-04': { row: [.65, .60, .40, .75, .55, .15], fam: 'capability' },
  'I-R4-05': { row: [.45, .60, .35, .75, .45, .10], fam: 'ai-rnd' },
  // I-R5-01 merged into I-N-01 (adjudication 2026-11-17): I-N-01 is canonical, its evidence drives the I-R5-01 road row once.
  'I-N-01': { row: [.40, .50, .35, .55, .80, .35], fam: 'holders', rowFrom: 'I-R5-01' },
  'I-R5-02': { row: [.35, .50, .40, .60, .85, .45], fam: 'open-weights' },
  'I-R5-03': { row: [.25, .40, .35, .40, .65, .40], fam: 'compute-concentration' },
  'I-R5-04': { row: [.55, .65, .45, .65, .80, .35], fam: 'cost' },
  'I-R5-05': { row: [.55, .65, .25, .75, .85, .70], fam: 'open-weights' },
  'I-R6-01': { row: [.55, .40, .65, .35, .45, .85], fam: 'macro' },
  'I-R6-02': { row: [.15, .15, .35, .10, .25, .55], fam: 'investment' },
  'I-R6-03': { row: [.20, .20, .35, .10, .25, .65], fam: 'capability' },
  'I-R6-04': { row: [.40, .20, .50, .35, .30, .70], fam: 'adoption' },
  'I-R6-05': { row: [.30, .30, .45, .25, .40, .65], fam: 'macro' },
};
// R1 road attributes
const LANE = { // p(yes | narrow / broad)
  'I-TF-01': [.60, .30], 'I-TF-02': [.55, .25], 'I-TF-03': [.65, .40], 'I-TF-04': [.10, .35],
};
const HOLD_K = ['1', '2', '3-5', '6+'];
const HOLD = { 'I-N-01': [.05, .20, .45, .80], 'I-N-02': [.05, .15, .55, .85] };

// ---------- §4.3 seed lenses ----------
const LENSES = {
  baseline: { name: 'Baseline', prior: { R1: .30, R2: .20, R3: .15, R4: .10, R5: .10, R6: .12, None: .03 } },
  normal: { name: 'Normal technology', prior: { R1: .20, R2: .12, R3: .10, R4: .03, R5: .15, R6: .37, None: .03 } },
  loc: { name: 'Loss-of-control', prior: { R1: .20, R2: .22, R3: .12, R4: .30, R5: .08, R6: .05, None: .03 } },
  many: { name: 'Many powers', prior: { R1: .15, R2: .20, R3: .10, R4: .08, R5: .35, R6: .09, None: .03 } },
};
const ATTR_PRIOR = { q0: 0.50, holders: [.15, .45, .30, .10] };

// ---------- §2.4 editorial splits sigma (central, lo, hi) = fa4_data.js RD6[].f ----------
const SPLITS = {
  R1: { enslaved: [.70, .55, .85], o1984: [.08, .03, .15], gatekeeper: [.07, .03, .15], egalitarian: [.05, .01, .10], libertarian: [.05, .01, .10], selfdestruct: [.05, .02, .10] },
  R2: { benevolent: [.25, .15, .40], zookeeper: [.25, .15, .40], protector: [.20, .10, .30], descendants: [.15, .05, .25], normaltech: [.10, .05, .20], libertarian: [.05, .01, .10] },
  R3: { gatekeeper: [.35, .20, .50], normaltech: [.25, .10, .40], o1984: [.20, .10, .35], egalitarian: [.10, .03, .20], reversion: [.10, .02, .15] },
  R4: { conquerors: [.45, .30, .60], descendants: [.25, .10, .40], selfdestruct: [.15, .05, .25], zookeeper: [.10, .05, .20], protector: [.05, .01, .10] },
  R5: { libertarian: [.30, .15, .45], normaltech: [.25, .10, .40], egalitarian: [.20, .10, .35], selfdestruct: [.15, .05, .25], descendants: [.10, .03, .20] },
  R6: { normaltech: [.70, .50, .85], egalitarian: [.10, .03, .20], libertarian: [.10, .03, .20], enslaved: [.05, .02, .10], reversion: [.05, .01, .10] },
};
const SITES = ['enslaved', 'o1984', 'gatekeeper', 'egalitarian', 'libertarian', 'selfdestruct', 'benevolent', 'zookeeper', 'protector', 'descendants', 'normaltech', 'conquerors', 'reversion'];

// ---------- parameters: doc-fixed (B.6) + PROPOSED defaults (see defaults.md) ----------
function defaultParams() {
  return {
    beta: 1.0, roadFloor: 0.01, noneFloor: 0.03, rClip: [0.05, 0.95],
    tierRho: { 1: 0.95, 2: 0.85, 3: 0.70 }, rhoCap: 0.98,
    deltaCapCluster: 0.7, deltaCapIndicator: 1.5, llCap: 1.6, rhoF: 0.5, diagFloor: 0.5,
    fcCapSource: 0.5, fcFamilyClip: 0.4, fcShare: 0.25,
    // PROPOSED defaults (maintainer reviewing) ---------------------------------------
    eventDelta: { high: 0.30, med: 0.20, low: 0.10 },      // P1 (legacy flat table, used only if eventDeltaByKind is null)
    // P1 maintainer choice D (2026-11-17): delta by event subkind (high-confidence value) x confidence multiplier. Values PROPOSED.
    eventDeltaByKind: { incident: 0.40, announcement: 0.25, report: 0.15 },
    confMult: { high: 1.0, med: 0.67, low: 0.33 },
    instrDelta: { high: 0.40, med: 0.25, low: 0.10 },      // P2 non-decaying shift per treaty-law item
    stateShift: { high: 0.50, med: 0.35, low: 0.20 },      // P3 probit offset of a direction-only data-series reading (= gap / s_i with s_i = 1)
    stateSpread: 1.0,                                      // P3b s_i multiplier (offset divided by this)
    fcShift: { high: 0.50, med: 0.35, low: 0.20 },         // P4 logit shift of latest forecast item (then per-source cap 0.5)
    halfLife: { incident: 365, announcement: 180, report: 90 }, // doc values; P5 = mapping of backfill 'event' to these subkinds
    halfLifeScale: 1.0,
    btos: { base: 17.4, baseDate: '2025-12-15', resDate: '2027-11-15', sdPerYear: 4.0, // P6 BTOS numeric state
      thr: { 'I-R2-02': [34.9, 'ge'], 'I-R6-04': [26.1, 'lt'] }, exclFrom: { 'I-R2-02': '2026-10-19', 'I-R6-04': '2026-10-19' } },
    strengthScale: 1.0,
    mc: { draws: 4000, strength: [0.5, 1.5], rhoF: [0.3, 0.7], priorSigma: 0.40 },
  };
}

// ---------- math ----------
const logit = p => Math.log(p / (1 - p));
const sigm = x => 1 / (1 + Math.exp(-x));
const clip = (x, a, b) => Math.max(a, Math.min(b, x));
function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
function probit(p) { // Acklam
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const pl = 0.02425; let q, r;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
function mulberry32(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(rng) { let u = 0; while (u === 0) u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()); }
const dayMs = 864e5;
const dnum = s => Date.parse(s + 'T00:00:00Z') / dayMs;
const dstr = n => new Date(n * dayMs).toISOString().slice(0, 10);
function quantile(arr, q) { const a = Float64Array.from(arr).sort(); const i = (a.length - 1) * q; const lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); }

// ---------- §3.4 indicator nowcast providers ----------
// A provider is f(pbar, P) -> { r, rho, fcFrac, parts:[{id,kind,logit,rho}], resolved }
function provFixedState(r, rho) { return () => ({ r, rho, fcFrac: 0, parts: [{ kind: 'state', r }] }); }
function provResolution(v) { return () => ({ r: v, rho: 1, fcFrac: 0, resolved: true, parts: [{ kind: 'resolution', r: v }] }); }

function familyOfEvent(fam, tier) { // P5: backfill kind 'event' -> §3.2 subkind
  if (fam === 'incident' || fam === 'control-failure') return 'incident';
  if (tier >= 3) return 'report';
  return 'announcement';
}
function sgnOf(dir) { return dir === 'toward YES' ? 1 : dir === 'toward NO' ? -1 : 0; }
function parsePct(v) { if (v == null) return null; const s = String(v); if (/original wording/i.test(s)) return null; const m = s.match(/(-?\d+(?:\.\d+)?)\s*%/); return m ? parseFloat(m[1]) : null; }

// Build a provider for an indicator from ledger items as of `asOf` (strict: published < asOf, i.e. by the Sunday before the Monday freeze).
function ledgerProvider(id, items, asOf, P, resolution, famForEvent) {
  const asN = dnum(asOf);
  const live = items.filter(it => dnum(it.published) < asN);
  if (resolution && dnum(resolution.date) < asN) return { prov: provResolution(resolution.value), used: [{ id: 'RESOLUTION', kind: 'resolution', value: resolution.value, date: resolution.date }] };
  const used = [];
  const btosThr = P.btos.thr[id];
  // state (data-series): latest non-neutral reading replaces
  let stateIt = null, btosIt = null;
  for (const it of live) {
    if (it.kind !== 'data-series') continue;
    if (btosThr) {
      const x = parsePct(it.value);
      const excl = P.btos.exclFrom[id] && it.published >= P.btos.exclFrom[id];
      if (x == null || excl) continue;
      if (!btosIt || it.published >= btosIt.published) btosIt = Object.assign({ x }, it);
    } else {
      if (sgnOf(it.direction) === 0) continue;
      if (!stateIt || it.published >= stateIt.published) stateIt = it;
    }
  }
  const events = live.filter(it => (it.kind === 'event' || it.kind === 'treaty-law') && sgnOf(it.direction) !== 0);
  let fcIt = null;
  for (const it of live) if (it.kind === 'forecast' && (!fcIt || it.published >= fcIt.published)) fcIt = it;
  if (stateIt) used.push({ id: stateIt.id, kind: 'state' });
  if (btosIt) used.push({ id: btosIt.id, kind: 'state-numeric', x: btosIt.x });
  for (const e of events) used.push({ id: e.id, kind: e.kind === 'treaty-law' ? 'instrument' : 'event:' + familyOfEvent(famForEvent, e.source_tier) });
  if (fcIt && sgnOf(fcIt.direction) !== 0) used.push({ id: fcIt.id, kind: 'forecast' });
  const prov = (pbar) => {
    const parts = [];
    let base = pbar, stRho = 1, stW = 0;
    if (btosIt) {
      const [thr, op] = btosThr; const t = dnum(btosIt.published), T = dnum(P.btos.resDate);
      const yrs = Math.max((t - dnum(P.btos.baseDate)) / 365.25, 0.05), rem = Math.max((T - t) / 365.25, 0.05);
      const slope = (btosIt.x - P.btos.base) / yrs; const xhat = btosIt.x + slope * rem;
      const s = P.btos.sdPerYear * Math.sqrt(rem);
      base = clip(Phi(op === 'ge' ? (xhat - thr) / s : (thr - xhat) / s), P.rClip[0], P.rClip[1]);
      stRho = P.tierRho[btosIt.source_tier]; stW = Math.abs(logit(base) - logit(pbar));
      parts.push({ id: btosIt.id, kind: 'state-numeric', x: btosIt.x, xhat: +xhat.toFixed(2), s: +s.toFixed(2), thr, r: +base.toFixed(4) });
    } else if (stateIt) {
      const z = probit(clip(pbar, 1e-6, 1 - 1e-6)) + sgnOf(stateIt.direction) * P.stateShift[stateIt.confidence] / P.stateSpread;
      base = clip(Phi(z), P.rClip[0], P.rClip[1]);
      stRho = P.tierRho[stateIt.source_tier]; stW = Math.abs(logit(base) - logit(pbar));
      parts.push({ id: stateIt.id, kind: 'state', r: +base.toFixed(4) });
    }
    let ev = 0; const evw = [];
    for (const e of events) {
      let d;
      if (e.kind === 'treaty-law') d = sgnOf(e.direction) * P.instrDelta[e.confidence];
      else {
        const h = P.halfLife[familyOfEvent(famForEvent, e.source_tier)] * P.halfLifeScale;
        const age = dnum(asOf) - dnum(e.published);
        const sub = familyOfEvent(famForEvent, e.source_tier);
        const mag = P.eventDeltaByKind ? P.eventDeltaByKind[sub] * P.confMult[e.confidence] : P.eventDelta[e.confidence];
        d = clip(sgnOf(e.direction) * mag, -P.deltaCapCluster, P.deltaCapCluster) * Math.pow(2, -age / h);
      }
      ev += d; evw.push([Math.abs(d), P.tierRho[e.source_tier]]); parts.push({ id: e.id, kind: e.kind === 'treaty-law' ? 'instrument' : 'event', shift: +d.toFixed(4) });
    }
    ev = clip(ev, -P.deltaCapIndicator, P.deltaCapIndicator);
    let fc = 0, fcRho = 1;
    if (fcIt) { fc = clip(sgnOf(fcIt.direction) * P.fcShift[fcIt.confidence], -P.fcCapSource, P.fcCapSource); fcRho = P.tierRho[fcIt.source_tier]; parts.push({ id: fcIt.id, kind: 'forecast', shift: fc }); }
    const r = clip(sigm(logit(base) + ev + fc), P.rClip[0], P.rClip[1]);
    // reliability: |logit|-weighted mean of input tier rho (P7)
    let W = stW, RW = stW * stRho;
    for (const [w, rr] of evw) { W += w; RW += w * rr; }
    W += Math.abs(fc); RW += Math.abs(fc) * fcRho;
    const rho = W > 0 ? Math.min(RW / W, P.rhoCap) : 1;
    return { r, rho, fcFrac: W > 0 ? Math.abs(fc) / W : 0, parts };
  };
  return { prov, used };
}

// ---------- §3.5-3.7 one lens evaluation ----------
function jeffrey(rt, p, pbar) { return Math.log(rt * p / pbar + (1 - rt) * (1 - p) / (1 - pbar)); }
function diagSpread(row) { const l = row.map(p => logit(p)); return Math.max(...l) - Math.min(...l); }

// prior: {R1..R6,None}; providers: {id: prov}; opts: {beta, rhoF, k (strength), flat (evidence-only)}
function evalRoads(prior, providers, P, opts = {}) {
  const beta = opts.beta != null ? opts.beta : P.beta, rhoF = opts.rhoF != null ? opts.rhoF : P.rhoF, k = (opts.k != null ? opts.k : 1) * P.strengthScale;
  let pr = Object.assign({}, prior);
  if (opts.flat) { pr = { None: prior.None }; for (const T of ROADS) pr[T] = (1 - prior.None) / 6; }
  const per = {}; const famN = {};
  for (const id of Object.keys(providers)) {
    const row = IND[id].row;
    const pbar = ROADS.reduce((a, T, j) => a + pr[T] * row[j], 0) / (1 - pr.None);
    const o = providers[id](pbar, P);
    const rt = o.resolved ? o.r : pbar + o.rho * (o.r - pbar);
    const low = diagSpread(row) < P.diagFloor;
    let l = row.map(p => rt >= 1 ? Math.log(p / pbar) : rt <= 0 ? Math.log((1 - p) / (1 - pbar)) : jeffrey(rt, p, pbar));
    l = l.map(x => clip(x, -P.llCap, P.llCap));
    const active = !low && Math.abs(rt - pbar) > 1e-12;
    per[id] = { pbar, r: o.r, rt, rho: o.rho, fcFrac: o.fcFrac || 0, lraw: l, active, low, parts: o.parts, fam: IND[id].fam };
    if (active) famN[IND[id].fam] = (famN[IND[id].fam] || 0) + 1;
  }
  const tot = ROADS.map(() => 0), fcv = ROADS.map(() => 0), absSum = ROADS.map(() => 0);
  for (const id in per) {
    const x = per[id]; if (!x.active) { x.m = 0; x.l = ROADS.map(() => 0); continue; }
    // LOO holds family multipliers at the full-set values (opts.famN), as the §3.9 LOO table does
    const n = (opts.famN && opts.famN[x.fam]) || famN[x.fam]; x.m = 1 / (1 + (n - 1) * rhoF);
    x.l = x.lraw.map(v => v * x.m);
    x.l.forEach((v, j) => { tot[j] += v * (1 - x.fcFrac); fcv[j] += v * x.fcFrac; absSum[j] += Math.abs(v); });
  }
  // §3.6 forecast family caps
  // (2) centred component clip ±0.4 nats per road; (3) share cap: |forecast family| <= 25% of Σ|ℓ| measured over all
  // roads together (PROPOSED reading P8: the per-road reading would clip the §3.9 example, which the doc says is not clipped).
  let fcScale = 1; const mean = fcv.reduce((a, b) => a + b, 0) / 6;
  fcv.forEach((v) => { const c = Math.abs(v - mean); if (c > P.fcFamilyClip) fcScale = Math.min(fcScale, P.fcFamilyClip / c); });
  const fcAbs = fcv.reduce((a, v) => a + Math.abs(v), 0), allAbs = absSum.reduce((a, b) => a + b, 0);
  if (P.fcSharePerRoad) fcv.forEach((v, j) => { if (Math.abs(v) > P.fcShare * absSum[j]) fcScale = Math.min(fcScale, P.fcShare * absSum[j] / Math.abs(v)); });
  else if (fcAbs > P.fcShare * allAbs && fcAbs > 0) fcScale = Math.min(fcScale, P.fcShare * allAbs / fcAbs);
  const total = tot.map((v, j) => v + fcv[j] * fcScale);
  const prS = opts.flatSoftmaxOnly ? Object.assign({ None: prior.None }, Object.fromEntries(ROADS.map(T => [T, (1 - prior.None) / 6]))) : pr;
  const z = ROADS.map((T, j) => Math.log(prS[T]) + beta * k * total[j]); z.push(Math.log(prS.None));
  const mx = Math.max(...z); let e = z.map(v => Math.exp(v - mx)); const s = e.reduce((a, b) => a + b, 0); e = e.map(v => v / s);
  // floors (1% per road, §3.7) and the fixed 3% "None of these" floor (B.6)
  if (e[6] < P.noneFloor) { const sc = (1 - P.noneFloor) / (1 - e[6]); e = e.map((v, j) => j === 6 ? P.noneFloor : v * sc); }
  for (let it = 0; it < 3; it++) { const low = e.map((v, j) => j < 6 && v < P.roadFloor); if (!low.some(Boolean)) break; const fixed = low.filter(Boolean).length * P.roadFloor; const rest = e.reduce((a, v, j) => a + (low[j] || j === 6 ? 0 : v), 0); e = e.map((v, j) => low[j] ? P.roadFloor : j === 6 ? v : v * (1 - fixed - e[6]) / rest); }
  const w = {}; ROADS.forEach((T, j) => w[T] = e[j]); w.None = e[6];
  return { w, per, total, fcScale, famN };
}

// R1 attributes (§3.7 last bullet)
function evalLane(provs, P, rhoF, q0) {
  q0 = q0 != null ? q0 : ATTR_PRIOR.q0; let n = 0; const ls = [];
  for (const id in provs) { const [pn, pb] = LANE[id]; const pbar = q0 * pn + (1 - q0) * pb; const o = provs[id](pbar, P); const rt = o.resolved ? o.r : pbar + o.rho * (o.r - pbar);
    if (Math.abs(rt - pbar) < 1e-12) continue; n++; ls.push(jeffrey(rt, pn, pbar) - jeffrey(rt, pb, pbar)); }
  const m = n ? 1 / (1 + (n - 1) * (rhoF != null ? rhoF : P.rhoF)) : 0;
  return sigm(logit(q0) + m * ls.reduce((a, b) => a + b, 0));
}
function evalHolders(provs, P, rhoF) {
  const pr = ATTR_PRIOR.holders; let n = 0; const acc = [0, 0, 0, 0];
  const L = [];
  for (const id in provs) { const row = HOLD[id]; const pbar = row.reduce((a, p, j) => a + p * pr[j], 0); const o = provs[id](pbar, P); const rt = o.resolved ? o.r : pbar + o.rho * (o.r - pbar);
    if (Math.abs(rt - pbar) < 1e-12) continue; n++; L.push(row.map(p => jeffrey(rt, p, pbar))); }
  const m = n ? 1 / (1 + (n - 1) * (rhoF != null ? rhoF : P.rhoF)) : 0;
  for (const l of L) l.forEach((v, j) => acc[j] += m * v);
  const z = pr.map((p, j) => Math.log(p) + acc[j]); const mx = Math.max(...z); const e = z.map(v => Math.exp(v - mx)); const s = e.reduce((a, b) => a + b, 0);
  const out = {}; HOLD_K.forEach((kk, j) => out[kk] = e[j] / s); return out;
}

function sitesOf(w, splits) {
  const out = {}; for (const s of SITES) out[s] = 0;
  for (const T of ROADS) { const sp = splits[T]; for (const s in sp) out[s] += w[T] * sp[s]; }
  return out;
}
function centralSplits() { const o = {}; for (const T of ROADS) { o[T] = {}; let t = 0; for (const s in SPLITS[T]) t += SPLITS[T][s][0]; for (const s in SPLITS[T]) o[T][s] = SPLITS[T][s][0] / t; } return o; }
function drawSplits(rng) { const o = {}; for (const T of ROADS) { o[T] = {}; let t = 0; for (const s in SPLITS[T]) { const [, lo, hi] = SPLITS[T][s]; o[T][s] = lo + (hi - lo) * rng(); t += o[T][s]; } for (const s in o[T]) o[T][s] /= t; } return o; }
function perturbPrior(prior, rng, sigma) { const o = { None: prior.None }; let t = 0; for (const T of ROADS) { o[T] = prior[T] * Math.exp(sigma * gauss(rng)); t += o[T]; } for (const T of ROADS) o[T] *= (1 - prior.None) / t; return o; }

// ---------- ledger ----------
function loadLedger(siteDir) {
  // public repo layout: <repo>/ledger/backfill/{2026/*.json, review/approved_2026.json}; older private layout: <site>/backfill/...
  const bf = fs.existsSync(path.join(siteDir, 'ledger', 'backfill')) ? path.join(siteDir, 'ledger', 'backfill') : path.join(siteDir, 'backfill');
  const appr = JSON.parse(fs.readFileSync(path.join(bf, 'review', 'approved_2026.json'), 'utf8'));
  const ov = appr.wording_overrides || {};
  const hold = new Set((appr.counting && appr.counting.hold) || []);
  // maintainer rulings on single indicators (MET/NOT MET resolutions, merges): review/rulings.json
  const rulF = path.join(bf, 'review', 'rulings.json');
  const rul = fs.existsSync(rulF) ? JSON.parse(fs.readFileSync(rulF, 'utf8')) : {};
  const merges = rul.merges || {};
  const byInd = {}; const excluded = [];
  for (const f of fs.readdirSync(path.join(bf, '2026')).filter(f => f.endsWith('.json')).sort()) {
    const j = JSON.parse(fs.readFileSync(path.join(bf, '2026', f), 'utf8'));
    const id = j.indicator;
    for (const it0 of j.items) {
      const it = Object.assign({}, it0, ov[it0.id] || {});
      if (merges[id]) { excluded.push({ id: it.id, why: merges[id].why || ('merged into ' + merges[id].into) }); continue; }
      if (hold.has(id)) { excluded.push({ id: it.id, why: 'indicator on hold' }); continue; }
      if (it.kind === 'data-gap') { excluded.push({ id: it.id, why: 'data-gap: displayed, not counted (§3.2)' }); continue; }
      (byInd[id] = byInd[id] || []).push(it);
    }
  }
  const resolutions = rul.resolutions || {};
  return { byInd, excluded, resolutions, approved: appr.approved };
}

function buildProviders(ledger, asOf, P, drop) {
  const road = {}, lane = {}, hold = {}, used = {};
  for (const id of Object.keys(IND)) {
    if (drop && drop.has(id)) continue;
    const { prov, used: u } = ledgerProvider(id, ledger.byInd[id] || [], asOf, P, ledger.resolutions[id], IND[id].fam);
    road[id] = prov; used[id] = u;
  }
  for (const id of Object.keys(LANE)) { if (drop && drop.has(id)) continue; const { prov, used: u } = ledgerProvider(id, ledger.byInd[id] || [], asOf, P, null, 'distribution'); lane[id] = prov; used[id] = u; }
  for (const id of Object.keys(HOLD)) { if (drop && drop.has(id)) continue; const { prov, used: u } = ledgerProvider(id, ledger.byInd[id] || [], asOf, P, null, 'holders'); hold[id] = prov; used[id] = used[id] || u; }
  return { road, lane, hold, used };
}

// central pooled (and per-lens) result for one week
function centralWeek(ledger, asOf, P, drop, famNByLens) {
  const pv = buildProviders(ledger, asOf, P, drop); const sp = centralSplits();
  const lenses = {};
  for (const L in LENSES) { const r = evalRoads(LENSES[L].prior, pv.road, P, famNByLens ? { famN: famNByLens[L] } : {}); lenses[L] = { w: r.w, per: r.per, total: r.total, famN: r.famN, sites: sitesOf(r.w, sp) }; }
  const pooled = { w: {}, sites: {} };
  for (const T of ROADS.concat([NONE])) pooled.w[T] = Object.values(lenses).reduce((a, x) => a + x.w[T], 0) / 4;
  for (const s of SITES) pooled.sites[s] = Object.values(lenses).reduce((a, x) => a + x.sites[s], 0) / 4;
  const q = evalLane(pv.lane, P), N = evalHolders(pv.hold, P);
  return { lenses, pooled, q, N, used: pv.used };
}

function mcWeek(ledger, asOf, P, seed) {
  const pv = buildProviders(ledger, asOf, P); const rng = mulberry32(seed); const D = P.mc.draws;
  const keys = Object.keys(LENSES).concat(['pooled']);
  const R = {}, S = {}; for (const k of keys) { R[k] = {}; S[k] = {}; for (const T of ROADS.concat([NONE])) R[k][T] = new Float64Array(D); for (const s of SITES) S[k][s] = new Float64Array(D); }
  const Q = new Float64Array(D);
  for (let d = 0; d < D; d++) {
    const k = P.mc.strength[0] + (P.mc.strength[1] - P.mc.strength[0]) * rng();
    const rhoF = P.mc.rhoF[0] + (P.mc.rhoF[1] - P.mc.rhoF[0]) * rng();
    const sp = drawSplits(rng); const pw = {}, ps = {};
    for (const T of ROADS.concat([NONE])) pw[T] = 0; for (const s of SITES) ps[s] = 0;
    for (const L in LENSES) {
      const pr = perturbPrior(LENSES[L].prior, rng, P.mc.priorSigma);
      const r = evalRoads(pr, pv.road, P, { k, rhoF }); const st = sitesOf(r.w, sp);
      for (const T in r.w) { R[L][T][d] = r.w[T]; pw[T] += r.w[T] / 4; }
      for (const s of SITES) { S[L][s][d] = st[s]; ps[s] += st[s] / 4; }
    }
    for (const T in pw) R.pooled[T][d] = pw[T]; for (const s of SITES) S.pooled[s][d] = ps[s];
    Q[d] = evalLane(pv.lane, P, rhoF);
  }
  const out = {};
  for (const k of keys) { out[k] = { roads: {}, sites: {} }; for (const T in R[k]) out[k].roads[T] = [quantile(R[k][T], .1), quantile(R[k][T], .9)]; for (const s of SITES) out[k].sites[s] = [quantile(S[k][s], .1), quantile(S[k][s], .9)]; }
  out.q = [quantile(Q, .1), quantile(Q, .9)];
  return out;
}

// ISO week helpers
function isoWeekMonday(year, w) { const jan4 = Date.UTC(year, 0, 4); const dow = (new Date(jan4).getUTCDay() + 6) % 7; return jan4 / dayMs - dow + (w - 1) * 7; }
function isoWeekOf(n) { const d = new Date(n * dayMs); const dow = (d.getUTCDay() + 6) % 7; const th = n - dow + 3; const y = new Date(th * dayMs).getUTCFullYear(); const w = Math.floor((th - isoWeekMonday(y, 1)) / 7) + 1; return [y, w]; }

module.exports = { METHOD_VERSION, ROADS, NONE, IND, LANE, HOLD, HOLD_K, LENSES, ATTR_PRIOR, SPLITS, SITES, defaultParams, logit, sigm, Phi, probit, mulberry32, quantile,
  provFixedState, provResolution, evalRoads, evalLane, evalHolders, sitesOf, centralSplits, drawSplits, perturbPrior, loadLedger, buildProviders, centralWeek, mcWeek,
  isoWeekMonday, isoWeekOf, dnum, dstr, jeffrey };
