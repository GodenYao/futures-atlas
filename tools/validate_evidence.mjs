#!/usr/bin/env node
// Futures Atlas - evidence inbox validator (dependency-free, Node >= 18).
//
// Usage:
//   node tools/validate_evidence.mjs --all                 # every item under ledger/inbox/ (incl. _examples/)
//   node tools/validate_evidence.mjs --ledger              # --all + every ledger/backfill/** bundle (backfill.schema.json),
//                                                          #   ledger/reviewed/** and the review records (what CI runs)
//   node tools/validate_evidence.mjs ledger/inbox/EV-....json [more files]
//   node tools/validate_evidence.mjs --root <repo> <files>  # repo root if not run from the repo
//
// Checks, in order:
//   1. file is .json, <= 16 KB, parses, holds ONE item (an object, not an array / bundle)
//   2. JSON Schema (ledger/schema/evidence.schema.json, draft 2020-12 subset implemented below)
//   3. file name == id + ".json"; date in id == published; published is a real date,
//      >= 2022-11-30 and not in the future
//   4. indicator id exists in ledger/indicators.json
//   5. neutrality (warnings only): country names / demonyms / capital metonyms
//      (tools/neutrality/country_terms.txt) in summary, reasoning, counterpoint - the reviewer
//      agent rewrites them to bloc labels before merge; bloc labels "Bloc A".."Bloc Z" and
//      "Bloc <number>" are allowed, malformed bloc labels warn; loaded words (loaded_terms.txt)
//   6. paywall: source host on tools/neutrality/paywall_domains.txt requires access "paywall"
//      plus access_note
//   7. duplicates: same source_url already in the ledger = warning; same id twice = error
// Exit code: 0 = pass, 1 = validation errors, 2 = usage / setup error.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIN_DATE = '2022-11-30';
const MAX_BYTES = 16 * 1024;
const TEXT_FIELDS = ['summary', 'reasoning', 'counterpoint'];
const GH = !!process.env.GITHUB_ACTIONS;

// ---------- CLI ----------
const argv = process.argv.slice(2);
let root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let all = false, ledgerMode = false;
const files = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--all') all = true;
  else if (a === '--ledger') { all = true; ledgerMode = true; }
  else if (a === '--root') root = path.resolve(argv[++i] || '.');
  else if (a === '-h' || a === '--help') { usage(0); }
  else if (a.startsWith('--')) { console.error('unknown option ' + a); usage(2); }
  else files.push(path.resolve(a));
}
function usage(code) {
  console.log('usage: node tools/validate_evidence.mjs [--root DIR] (--all | --ledger | FILE...)\n  --all     every inbox item\n  --ledger  every inbox item + every ledger/backfill/** bundle + ledger/reviewed/** + review records (CI)');
  process.exit(code);
}

const P = {
  schema: path.join(root, 'ledger/schema/evidence.schema.json'),
  indicators: path.join(root, 'ledger/indicators.json'),
  inbox: path.join(root, 'ledger/inbox'),
  ledger: path.join(root, 'ledger'),
  countries: path.join(root, 'tools/neutrality/country_terms.txt'),
  loaded: path.join(root, 'tools/neutrality/loaded_terms.txt'),
  paywall: path.join(root, 'tools/neutrality/paywall_domains.txt'),
};

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function readList(p) {
  if (!fs.existsSync(p)) return [];
  // one term per line; "a | b | c" groups (country_terms.txt) are flattened; "@tag" markers dropped
  return fs.readFileSync(p, 'utf8').split(/\r?\n/)
    .map(s => s.replace(/#.*$/, '').replace(/@[a-z-]+/g, ''))
    .flatMap(s => s.split('|')).map(s => s.trim()).filter(Boolean);
}
// bloc labels: "Bloc A".."Bloc Z" or "Bloc <number>" (27, 28, ...)
const BLOC_OK = /(?<![\p{L}\p{N}])Bloc (?:[A-Z]|[1-9][0-9]*)(?![\p{L}\p{N}])/gu;
const BLOC_ANY = /(?<![\p{L}\p{N}])bloc\s+[\p{L}\p{N}]+(?![\p{L}\p{N}])/giu;
const BLOC_GENERIC = /^bloc\s+(?:labels?|of|and|or|the|a|an|is|are|with|in|on|to|by|for|that|which|level|leader|leaders|positions?|members?|countries)$/i;
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

let schema, indicatorIds;
try {
  schema = readJSON(P.schema);
  indicatorIds = new Set(readJSON(P.indicators).indicators.map(x => x.id));
} catch (e) {
  console.error('setup error: cannot read schema or indicators under ' + root + ': ' + e.message);
  process.exit(2);
}
const countryTerms = readList(P.countries);
const loadedTerms = readList(P.loaded);
const paywallDomains = readList(P.paywall).map(d => d.toLowerCase().replace(/^\*\./, ''));

if (all) {
  for (const f of walk(P.inbox)) if (path.basename(f) !== 'README.md') files.push(f);
}
if (!files.length) { console.error('no files to check'); usage(2); }

// ---------- minimal JSON Schema 2020-12 validator (only the keywords this schema uses) ----------
const ANNOTATIONS = new Set(['$schema', '$id', 'title', 'description', '$defs', 'examples', '$comment']);
const KNOWN = new Set(['type', 'enum', 'const', 'pattern', 'minLength', 'maxLength', 'format', 'properties',
  'required', 'additionalProperties', 'items', 'minItems', 'maxItems', 'uniqueItems', 'allOf', 'anyOf',
  'if', 'then', '$ref']);

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v;
}
let curRoot = null; // schema whose $defs a $ref resolves against (backfill checks swap it)
function resolveRef(ref) {
  if (!ref.startsWith('#/')) throw new Error('only local $ref supported: ' + ref);
  return ref.slice(2).split('/').reduce((o, k) => o[k], curRoot || schema);
}
function isDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}
function isUri(s) { try { const u = new URL(s); return !!u.protocol && !!u.host; } catch { return false; } }

function validate(v, s, at, errs) {
  for (const k of Object.keys(s)) {
    if (!KNOWN.has(k) && !ANNOTATIONS.has(k)) throw new Error('validator does not implement schema keyword "' + k + '"');
  }
  if (s.$ref) validate(v, resolveRef(s.$ref), at, errs);
  const t = typeOf(v);
  if (s.type) {
    const ok = [].concat(s.type).some(x => x === t || (x === 'number' && t === 'integer'));
    if (!ok) { errs.push(`${at}: expected ${s.type}, got ${t}`); return; }
  }
  if ('const' in s && JSON.stringify(v) !== JSON.stringify(s.const)) errs.push(`${at}: must be ${JSON.stringify(s.const)}`);
  if (s.enum && !s.enum.some(e => JSON.stringify(e) === JSON.stringify(v))) errs.push(`${at}: must be one of ${s.enum.join(' | ')}`);
  if (t === 'string') {
    const len = [...v].length;
    if (s.minLength != null && len < s.minLength) errs.push(`${at}: shorter than ${s.minLength} characters`);
    if (s.maxLength != null && len > s.maxLength) errs.push(`${at}: longer than ${s.maxLength} characters`);
    if (s.pattern && !new RegExp(s.pattern, 'u').test(v)) errs.push(`${at}: does not match ${s.pattern}`);
    if (s.format === 'date' && !isDate(v)) errs.push(`${at}: not a valid YYYY-MM-DD date`);
    if (s.format === 'uri' && !isUri(v)) errs.push(`${at}: not a valid URL`);
  }
  if (t === 'array') {
    if (s.minItems != null && v.length < s.minItems) errs.push(`${at}: needs at least ${s.minItems} item(s)`);
    if (s.maxItems != null && v.length > s.maxItems) errs.push(`${at}: at most ${s.maxItems} item(s)`);
    if (s.uniqueItems && new Set(v.map(x => JSON.stringify(x))).size !== v.length) errs.push(`${at}: items must be unique`);
    if (s.items) v.forEach((x, i) => validate(x, s.items, `${at}[${i}]`, errs));
  }
  if (t === 'object') {
    for (const r of s.required || []) if (!(r in v)) errs.push(`${at}: missing required field "${r}"`);
    const props = s.properties || {};
    for (const [k, x] of Object.entries(v)) {
      if (props[k]) validate(x, props[k], `${at}.${k}`, errs);
      else if (s.additionalProperties === false) errs.push(`${at}: field "${k}" is not allowed (reviewer-only or unknown)`);
    }
  }
  for (const sub of s.allOf || []) validate(v, sub, at, errs);
  if (s.anyOf) {
    const ok = s.anyOf.some(sub => { const e = []; validate(v, sub, at, e); return !e.length; });
    if (!ok) errs.push(`${at}: needs at least one of: non-empty roads, non-empty endings, or an indicator`);
  }
  if (s.if) {
    const e = []; validate(v, s.if, at, e);
    if (!e.length && s.then) validate(v, s.then, at, errs);
  }
}

// ---------- neutrality helpers ----------
function termRegex(term) {
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // short ALL-CAPS abbreviations match case-sensitively so "us" the pronoun is fine
  const caseSensitive = /^[A-Z.]{2,5}$/.test(term);
  return new RegExp('(?<![\\p{L}\\p{N}])' + esc + '(?![\\p{L}\\p{N}])', caseSensitive ? 'u' : 'iu');
}
const countryRx = countryTerms.map(t => [t, termRegex(t)]);
const loadedRx = loadedTerms.map(t => [t, termRegex(t)]);

// ---------- existing ledger index (for duplicate warnings) ----------
// URLs are compared after normalisation: https, no www./m./amp. host prefix, no trailing slash,
// no /amp suffix, no tracking parameters (utm_*, fbclid, gclid, ...), sorted query, no #fragment.
const TRACK = /^(utm_.*|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|ref|ref_src|src|cmpid|amp|outputtype|output|s|smid|sr_share|guccounter)$/i;
function normUrl(u) {
  let x; try { x = new URL(u.trim()); } catch { return u.trim(); }
  const host = x.hostname.toLowerCase().replace(/^(www\d?|m|mobile|amp)\./, '');
  let p = x.pathname.replace(/\/amp\/?$/i, '').replace(/\.amp(\.html)?$/i, '$1').replace(/\/+$/, '');
  const q = [...x.searchParams].filter(([k]) => !TRACK.test(k)).sort(([a], [b]) => a.localeCompare(b));
  return 'https://' + host + p + (q.length ? '?' + new URLSearchParams(q).toString() : '');
}
function itemUrls(it) {
  const out = [];
  if (typeof it.source_url === 'string') out.push(it.source_url);
  if (Array.isArray(it.sources)) for (const s of it.sources) {
    const u = typeof s === 'string' ? s : s && s.url; if (typeof u === 'string') out.push(u);
  }
  return out;
}
const seenUrl = new Map();
for (const f of walk(P.ledger)) {
  if (!f.endsWith('.json') || f.startsWith(path.join(P.ledger, 'schema'))) continue;
  let j; try { j = readJSON(f); } catch { continue; }
  const items = Array.isArray(j.items) ? j.items : [j];
  for (const it of items) if (it && typeof it === 'object') for (const u of itemUrls(it)) {
    const k = normUrl(u);
    if (!seenUrl.has(k)) seenUrl.set(k, []);
    seenUrl.get(k).push(path.relative(root, f) + (it.id ? '#' + it.id : ''));
  }
}
const runUrl = new Map(); // normalised URL -> first file in THIS run (other files in the same PR)

// ---------- run ----------
const today = new Date(Date.now() + 864e5).toISOString().slice(0, 10); // allow +1 day for time zones
const ids = new Map();
let nErr = 0, nWarn = 0;

function report(kind, file, msg) {
  const rel = path.relative(root, file) || file;
  if (kind === 'error') nErr++; else nWarn++;
  if (GH) console.log(`::${kind} file=${rel}::${msg.replace(/\r?\n/g, ' ')}`);
  else console.log(`${kind.toUpperCase().padEnd(7)} ${rel}: ${msg}`);
}

for (const file of [...new Set(files)]) {
  const E = m => report('error', file, m), W = m => report('warning', file, m);
  const base = path.basename(file);
  const insideRoot = !path.relative(root, file).startsWith('..');
  if (insideRoot) {
    const relDir = path.relative(P.inbox, path.dirname(file));
    if (relDir.startsWith('..') || (relDir && relDir !== '_examples')) E('evidence files go directly in ledger/inbox/ (or ledger/inbox/_examples/ for examples)');
  }
  if (!base.endsWith('.json')) { E('only .json files are accepted in ledger/inbox/ (one item per file)'); continue; }
  if (!fs.existsSync(file)) { E('file not found'); continue; }
  const raw = fs.readFileSync(file, 'utf8');
  if (Buffer.byteLength(raw) > MAX_BYTES) { E(`file larger than ${MAX_BYTES} bytes - one short item per file`); continue; }
  let item;
  try { item = JSON.parse(raw); } catch (e) { E('invalid JSON: ' + e.message); continue; }
  if (Array.isArray(item) || (item && typeof item === 'object' && Array.isArray(item.items))) {
    E('one item per file: found a list/bundle; split it into one file per item'); continue;
  }

  const errs = [];
  validate(item, schema, '$', errs);
  errs.forEach(E);
  if (typeOf(item) !== 'object') continue;

  if (typeof item.id === 'string') {
    if (base !== item.id + '.json') E(`file name must be "${item.id}.json" (id), found "${base}"`);
    if (ids.has(item.id)) E(`duplicate id, also in ${ids.get(item.id)}`); else ids.set(item.id, path.relative(root, file));
    const m = /^EV-(\d{4})(\d{2})(\d{2})-/.exec(item.id);
    if (m && typeof item.published === 'string' && `${m[1]}-${m[2]}-${m[3]}` !== item.published)
      E(`id date ${m[1]}${m[2]}${m[3]} does not match published ${item.published}`);
  }
  if (typeof item.published === 'string' && isDate(item.published)) {
    if (item.published < MIN_DATE) E(`published ${item.published} is before the ledger start ${MIN_DATE}`);
    if (item.published > today) E(`published ${item.published} is in the future`);
  }
  if (typeof item.indicator === 'string' && !indicatorIds.has(item.indicator))
    E(`unknown indicator "${item.indicator}" - see INDICATORS.md, or omit the field`);

  for (const f of TEXT_FIELDS) {
    if (typeof item[f] !== 'string') continue;
    // well-formed bloc labels are allowed; strip them before the term checks
    const text = item[f].replace(BLOC_OK, ' ');
    for (const m of text.matchAll(BLOC_ANY)) if (!BLOC_GENERIC.test(m[0]))
      W(`neutrality: "${f}" has "${m[0]}"; bloc labels are written "Bloc A".."Bloc Z" or "Bloc <number>"`);
    for (const [t, rx] of countryRx) if (rx.test(text))
      W(`neutrality: "${f}" names a country, nationality or capital ("${t}"); write a bloc label (e.g. "Bloc A") or a neutral descriptor (e.g. "a top-3 compute jurisdiction") - the reviewer agent will rewrite it before merge`);
    for (const [t, rx] of loadedRx) if (rx.test(text))
      W(`neutrality: "${f}" uses a loaded word ("${t}"); describe, do not judge`);
  }

  if (typeof item.source_url === 'string' && isUri(item.source_url)) {
    const host = new URL(item.source_url).hostname.toLowerCase().replace(/^www\./, '');
    const hit = paywallDomains.find(d => host === d || host.endsWith('.' + d));
    if (hit && item.access !== 'paywall') E(`source host ${host} is on the paywall list: set "access": "paywall" and add "access_note" (where a free copy or abstract is)`);
    const me = path.relative(root, file);
    for (const u of itemUrls(item)) {
      const k = normUrl(u);
      const prev = (seenUrl.get(k) || []).filter(p => !p.startsWith(me));
      if (prev.length) W(`source ${u} matches an item already in the ledger: ${prev.slice(0, 3).join(', ')} - one event = one item; add it to that item's "sources" instead`);
      const other = runUrl.get(k);
      if (other && other !== me) W(`source ${u} also appears in ${other} in this check - one event = one item`);
      else if (!other) runUrl.set(k, me);
    }
    if (item.archive_url === undefined) W('no archive_url; a reviewer will add one');
  }
}

console.log(`\n${files.length} file(s) checked: ${nErr} error(s), ${nWarn} warning(s) -> ${nErr ? 'FAIL' : 'PASS'}`);
if (ledgerMode) checkLedger();
process.exit(nErr ? 1 : 0);

// ---------- --ledger: every bundled backfill item, every reviewed item, review records ----------
// Errors: schema (ledger/schema/backfill.schema.json), duplicate ids, id/indicator/phase mismatch, bad or future dates,
// unknown indicators, overrides or rulings pointing at nothing. Warnings: country names in summaries, duplicate_of
// targets that do not exist. Reviewed items: evidence schema (reviewer fields allowed) + the same date/indicator rules.
function checkLedger() {
  const e0 = nErr, w0 = nWarn; let nFiles = 0, nItems = 0;
  const bfDir = path.join(P.ledger, 'backfill'), rvDir = path.join(P.ledger, 'reviewed'), rdDir = path.join(bfDir, 'review');
  const bfSchema = readJSON(path.join(P.ledger, 'schema', 'backfill.schema.json'));
  const allIds = new Map(); const dupRefs = [];
  const dateRules = (E, it, at, bf) => {
    if (typeof it.published === 'string' && isDate(it.published)) {
      // backfill phases may carry older baseline readings (pre-window context); they enter the first replay week
      // (method 4.5.0, replay from 2022-11-30). Contributor items must still be on/after the ledger start.
      if (it.published < MIN_DATE && !bf) E(`${at}: published ${it.published} is before the ledger start ${MIN_DATE}`);
      if (it.published > today) E(`${at}: published ${it.published} is in the future`);
    }
  };
  const neutral = (W, it, at) => { for (const f of ['summary']) if (typeof it[f] === 'string') { const text = it[f].replace(BLOC_OK, ' '); for (const [t, rx] of countryRx) if (rx.test(text)) W(`${at}: neutrality: "${f}" names a country ("${t}")`); } };
  const phases = fs.existsSync(bfDir) ? fs.readdirSync(bfDir, { withFileTypes: true }).filter(d => d.isDirectory() && d.name !== 'review').map(d => d.name).sort() : [];
  for (const ph of phases) for (const f of fs.readdirSync(path.join(bfDir, ph)).sort()) {
    const file = path.join(bfDir, ph, f); const E = m => report('error', file, m), W = m => report('warning', file, m);
    if (!f.endsWith('.json')) { E('only .json bundles belong in ledger/backfill/<phase>/'); continue; }
    nFiles++;
    let j; try { j = readJSON(file); } catch (e) { E('invalid JSON: ' + e.message); continue; }
    const errs = []; curRoot = bfSchema; validate(j, bfSchema, '$', errs); curRoot = null; errs.forEach(E);
    if (typeOf(j) !== 'object') continue;
    if (j.indicator && f !== j.indicator + '.json') E(`file name must be "${j.indicator}.json"`);
    if (j.indicator && !indicatorIds.has(j.indicator)) E(`unknown indicator "${j.indicator}"`);
    if (j.phase && j.phase !== ph) E(`phase "${j.phase}" does not match folder "${ph}"`);
    (Array.isArray(j.items) ? j.items : []).forEach((it, i) => {
      if (typeOf(it) !== 'object') return; nItems++; const at = `items[${i}] ${it.id || ''}`.trim();
      if (it.indicator !== j.indicator) E(`${at}: indicator "${it.indicator}" differs from the bundle's "${j.indicator}"`);
      if (typeof it.id === 'string') {
        if (!it.id.startsWith(`BF-${ph}-${j.indicator}-`)) E(`${at}: id must start with BF-${ph}-${j.indicator}-`);
        if (allIds.has(it.id)) E(`${at}: duplicate id, also in ${allIds.get(it.id)}`); else allIds.set(it.id, path.relative(root, file));
      }
      if (it.duplicate_of) dupRefs.push([file, at, it.duplicate_of]);
      dateRules(E, it, at, true); neutral(W, it, at);
    });
  }
  // accepted contributor items (filed by tools/weekly_build.mjs)
  const REVIEWER = ['kind', 'source_tier', 'confidence', 'review'];
  for (const file of walk(rvDir).sort()) {
    const E = m => report('error', file, m), W = m => report('warning', file, m);
    if (!file.endsWith('.json')) { E('only .json bundles belong in ledger/reviewed/<year>/'); continue; }
    nFiles++;
    let j; try { j = readJSON(file); } catch (e) { E('invalid JSON: ' + e.message); continue; }
    if (!Array.isArray(j.items)) { E('expected { indicator, items: [...] }'); continue; }
    const yr = path.basename(path.dirname(file));
    j.items.forEach((it, i) => {
      nItems++; const at = `items[${i}] ${it.id || ''}`.trim();
      const core = Object.fromEntries(Object.entries(it).filter(([k]) => !REVIEWER.includes(k)));
      const errs = []; validate(core, schema, at, errs); errs.forEach(E);
      if (it.kind != null && !bfSchema.$defs.item.properties.kind.enum.includes(it.kind)) E(`${at}: kind must be one of ${bfSchema.$defs.item.properties.kind.enum.join(' | ')}`);
      if (it.source_tier != null && ![1, 2, 3].includes(it.source_tier)) E(`${at}: source_tier must be 1 | 2 | 3`);
      if (it.confidence != null && !['high', 'med', 'low'].includes(it.confidence)) E(`${at}: confidence must be high | med | low`);
      if (it.indicator !== j.indicator) E(`${at}: indicator "${it.indicator}" differs from the bundle's "${j.indicator}"`);
      if (typeof it.published === 'string' && it.published.slice(0, 4) !== yr) E(`${at}: published ${it.published} is not in folder ${yr}/`);
      if (allIds.has(it.id)) E(`${at}: duplicate id, also in ${allIds.get(it.id)}`); else allIds.set(it.id, path.relative(root, file));
      dateRules(E, it, at); neutral(W, it, at);
    });
  }
  for (const [file, at, ref] of dupRefs) if (!allIds.has(ref)) report('warning', file, `${at}: duplicate_of "${ref}" is not an id in the ledger`);
  // review records: approved_<phase>.json + rulings.json
  if (fs.existsSync(rdDir)) for (const f of fs.readdirSync(rdDir).filter(f => f.endsWith('.json')).sort()) {
    const file = path.join(rdDir, f); const E = m => report('error', file, m);
    nFiles++;
    let j; try { j = readJSON(file); } catch (e) { E('invalid JSON: ' + e.message); continue; }
    const m = /^approved_(.+)\.json$/.exec(f);
    if (m) {
      if (!phases.includes(m[1])) E(`review record for phase "${m[1]}" but there is no ledger/backfill/${m[1]}/`);
      if (j.approved != null && !isDate(j.approved)) E('"approved" must be a YYYY-MM-DD date');
      for (const id of Object.keys(j.wording_overrides || {})) if (!allIds.has(id)) E(`wording override for unknown item "${id}"`);
      for (const id of (j.counting && j.counting.hold) || []) if (!indicatorIds.has(id)) E(`hold lists unknown indicator "${id}"`);
    } else if (f === 'rulings.json') {
      for (const [id, r] of Object.entries(j.resolutions || {})) {
        if (!indicatorIds.has(id)) E(`resolution for unknown indicator "${id}"`);
        if (![0, 1].includes(r.value) || !isDate(r.date || '')) E(`resolution ${id}: needs value 0|1 and a YYYY-MM-DD date`);
      }
      for (const [id, r] of Object.entries(j.merges || {})) if (!indicatorIds.has(id) || !indicatorIds.has(r.into)) E(`merge ${id} -> ${r.into}: unknown indicator`);
    } else E('unexpected file in ledger/backfill/review/ (expected approved_<phase>.json or rulings.json)');
  }
  console.log(`ledger: ${nFiles} file(s), ${nItems} item(s) checked: ${nErr - e0} error(s), ${nWarn - w0} warning(s) -> ${nErr ? 'FAIL' : 'PASS'}`);
}
