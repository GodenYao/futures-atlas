#!/usr/bin/env node
// Futures Atlas - rewrite country names to bloc labels (dependency-free, Node >= 18).
//
// The country -> bloc mapping is PRIVATE and never stored in this repository. The tool does not
// embed one: pass its path with --map. Term groups (names, abbreviations, demonyms, capitals)
// come from tools/neutrality/country_terms.txt (override with --terms).
//
// Usage:
//   node tools/anonymize.mjs --map PRIVATE.json --out DIR FILE|DIR...    rewrite into DIR
//   node tools/anonymize.mjs --map PRIVATE.json --in-place FILE...        rewrite in place
//   node tools/anonymize.mjs --map PRIVATE.json --assign [--assign-supranational] FILE|DIR...
//        extend the mapping file with the next free labels for groups found in the inputs,
//        in order of first appearance by `published` date (stable: existing labels never change)
//   node tools/anonymize.mjs --scan DIR...       list remaining terms in any text file
//                                                (country_terms.txt itself is skipped; exit 1 on hits)
//
// Mapping file (JSON): { "labels": { "<group name or alias>": "Bloc A", ... } }. A flat object
// of the same shape, or the inverse { "Bloc A": "<name>" }, is also read; other keys are ignored.
// Labels: Bloc A .. Bloc Z, then Bloc 27, Bloc 28, ...
// Inputs: one evidence item, or a file with an `items` array (backfill phase files). Every string
// field is rewritten except identifiers, dates, enums and URLs; URLs inside text are left intact.
// Output never prints mapping contents, only counts per label.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = { map: null, terms: path.join(here, 'neutrality/country_terms.txt'), out: null, inPlace: false,
  assign: false, supra: false, scan: false, inputs: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--map') opt.map = argv[++i];
  else if (a === '--terms') opt.terms = argv[++i];
  else if (a === '--out') opt.out = argv[++i];
  else if (a === '--in-place') opt.inPlace = true;
  else if (a === '--assign') opt.assign = true;
  else if (a === '--assign-supranational') opt.supra = true;
  else if (a === '--scan') opt.scan = true;
  else if (a === '-h' || a === '--help') usage(0);
  else if (a.startsWith('--')) { console.error('unknown option ' + a); usage(2); }
  else opt.inputs.push(a);
}
function usage(code) {
  console.log('usage: anonymize.mjs --map FILE (--out DIR | --in-place | --assign) INPUT...  |  anonymize.mjs --scan DIR...');
  process.exit(code);
}
if (!opt.inputs.length) usage(2);

// ---------- term groups ----------
const groups = []; // {name, terms[], supra}
for (const line of fs.readFileSync(opt.terms, 'utf8').split(/\r?\n/)) {
  let s = line.replace(/#.*$/, '').trim();
  if (!s) continue;
  const supra = /@supranational/.test(s);
  s = s.replace(/@[a-z-]+/g, '');
  const terms = s.split('|').map(x => x.trim()).filter(Boolean);
  if (terms.length) groups.push({ name: terms[0], terms, supra });
}
const termToGroup = new Map();
for (const g of groups) for (const t of g.terms) termToGroup.set(t.toLowerCase(), g);
const isAbbr = t => /^[A-Z.]{2,6}$/.test(t);
const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// one alternation, longest first (multi-word names before their shorter parts, dotted abbreviations before shorter ones)
const allTerms = [...termToGroup.keys()].map(k => groups.find(g => g.terms.some(t => t.toLowerCase() === k)).terms
  .find(t => t.toLowerCase() === k)).sort((a, b) => b.length - a.length);
const alts = allTerms.map(t => isAbbr(t) ? esc(t) : `${esc(t)}|${esc(t.toUpperCase())}`);
const TERM_RX = new RegExp('(?<![\\p{L}\\p{N}])(?:' + alts.join('|') + ')(?![\\p{L}\\p{N}])', 'gu');
const URL_RX = /(https?:\/\/[^\s"'<>)\]]+|[\w.-]+\.(?:org|com|gov|edu|io|ai|net|int)\/[^\s"'<>)\]]*)/g;
const groupOf = m => termToGroup.get(m.toLowerCase());

function segments(text) { // [[isUrl, piece], ...]
  const out = []; let last = 0;
  for (const m of text.matchAll(URL_RX)) {
    if (m.index > last) out.push([false, text.slice(last, m.index)]);
    out.push([true, m[0]]); last = m.index + m[0].length;
  }
  if (last < text.length) out.push([false, text.slice(last)]);
  return out;
}
function findGroups(text) {
  const found = [];
  for (const [u, p] of segments(text)) if (!u) for (const m of p.matchAll(TERM_RX)) found.push(groupOf(m[0]));
  return found;
}

// ---------- scan mode ----------
if (opt.scan) {
  const termsFile = path.resolve(opt.terms);
  let hits = 0, files = 0;
  const walk = d => fs.statSync(d).isDirectory()
    ? fs.readdirSync(d).flatMap(e => e === '.git' || e === 'node_modules' ? [] : walk(path.join(d, e))) : [d];
  for (const f of opt.inputs.flatMap(walk)) {
    if (path.resolve(f) === termsFile || !/\.(md|json|ya?ml|mjs|js|txt|html)$/.test(f)) continue;
    files++;
    fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((line, i) => {
      for (const [u, p] of segments(line)) if (!u) for (const m of p.matchAll(TERM_RX)) {
        hits++; console.log(`${f}:${i + 1}: ${m[0]}`);
      }
    });
  }
  console.log(`scan: ${files} file(s), ${hits} country term(s) outside URLs and ${path.basename(termsFile)}`);
  process.exit(hits ? 1 : 0);
}

// ---------- mapping ----------
if (!opt.map) { console.error('--map PRIVATE_MAPPING.json is required (the tool embeds no mapping)'); process.exit(2); }
const LABEL_RX = /^Bloc (?:[A-Z]|[1-9][0-9]*)$/;
const labelIndex = l => /^Bloc [A-Z]$/.test(l) ? l.charCodeAt(5) - 64 : Number(l.slice(5));
const labelFor = n => n <= 26 ? 'Bloc ' + String.fromCharCode(64 + n) : 'Bloc ' + n;
let mapDoc = fs.existsSync(opt.map) ? JSON.parse(fs.readFileSync(opt.map, 'utf8')) : {};
const raw = mapDoc.labels && typeof mapDoc.labels === 'object' ? mapDoc.labels : mapDoc;
const gLabel = new Map(); // group name -> label
for (const [k, v] of Object.entries(raw)) {
  if (typeof v !== 'string') continue;
  let name = k, label = v;
  if (LABEL_RX.test(k) && !LABEL_RX.test(v)) { name = v; label = k; }
  if (!LABEL_RX.test(label)) continue;
  const g = termToGroup.get(name.toLowerCase());
  if (!g) { console.error(`mapping key not in the term list (add it to ${path.basename(opt.terms)}): entry #${gLabel.size + 1}`); process.exit(2); }
  gLabel.set(g.name, label);
}
const used = new Set(gLabel.values());
if (used.size !== gLabel.size) { console.error('mapping assigns one label to two groups'); process.exit(2); }

// ---------- inputs ----------
const listInputs = p => fs.statSync(p).isDirectory()
  ? fs.readdirSync(p).filter(f => f.endsWith('.json')).sort().map(f => path.join(p, f)) : [p];
const inputs = opt.inputs.flatMap(listInputs);
const SKIP_KEY = /^(id|indicator|phase|phase_window|generated|published|kind|direction|confidence|source_tier|source_type|access|language|licence|submitted_by|agent|roads|endings|schema_version|backfilled)$|url$/i;
function eachText(obj, fn, key = '') {
  if (typeof obj === 'string') return SKIP_KEY.test(key) ? obj : fn(obj);
  if (Array.isArray(obj)) return SKIP_KEY.test(key) ? obj : obj.map(x => eachText(x, fn, key));
  if (obj && typeof obj === 'object') {
    const o = {}; for (const [k, v] of Object.entries(obj)) o[k] = eachText(v, fn, k); return o;
  }
  return obj;
}

if (opt.assign) {
  const items = [];
  for (const f of inputs) {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    for (const it of Array.isArray(j.items) ? j.items : [j]) items.push(it);
  }
  items.sort((a, b) => String(a.published || '').localeCompare(String(b.published || '')) || String(a.id).localeCompare(String(b.id)));
  let next = Math.max(0, ...[...used].map(labelIndex)) + 1, added = 0;
  for (const it of items) eachText(it, s => {
    for (const g of findGroups(s)) if (!gLabel.has(g.name) && (!g.supra || opt.supra)) {
      gLabel.set(g.name, labelFor(next++)); added++;
    }
    return s;
  });
  const labels = {};
  for (const [n, l] of [...gLabel].sort((a, b) => labelIndex(a[1]) - labelIndex(b[1]))) labels[n] = l;
  mapDoc = { _note: mapDoc._note || 'PRIVATE country -> bloc mapping. Never commit to the public repo. Labels are stable once assigned.', labels };
  fs.writeFileSync(opt.map, JSON.stringify(mapDoc, null, 2) + '\n');
  console.log(`assign: ${items.length} item(s) scanned; ${gLabel.size - added} label(s) kept, ${added} added; mapping written`);
  process.exit(0);
}

if (!opt.out && !opt.inPlace) { console.error('need --out DIR or --in-place'); process.exit(2); }
const perLabel = new Map(); const unmapped = new Map();
function rewrite(text) {
  return segments(text).map(([u, p]) => u ? p : p.replace(TERM_RX, (m, off, whole) => {
    const g = groupOf(m); const l = gLabel.get(g.name);
    if (!l) { unmapped.set(g.name, (unmapped.get(g.name) || 0) + 1); return m; }
    perLabel.set(l, (perLabel.get(l) || 0) + 1);
    const after = whole.slice(off + m.length);
    if (m.length === 2 && after.startsWith('$')) return m + 'D ';      // two-letter code + '$' = currency (-> ISO code)
    if (m.endsWith('.') && (after === '' || /^\s+[A-Z]/.test(after))) return l + '.'; // keep sentence end
    return l;
  })).join('').replace(/USD \$/g, 'USD ');
}
for (const f of inputs) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const o = eachText(j, rewrite);
  const dest = opt.inPlace ? f : path.join(opt.out, path.basename(f));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(o, null, 2) + '\n');
}
const total = [...perLabel.values()].reduce((a, b) => a + b, 0);
console.log(`rewrite: ${inputs.length} file(s), ${total} replacement(s) across ${perLabel.size} label(s)` +
  (unmapped.size ? `; ${[...unmapped.values()].reduce((a, b) => a + b, 0)} term(s) in ${unmapped.size} unmapped group(s) LEFT AS IS (run --assign or extend the mapping)` : ''));
process.exit(unmapped.size ? 3 : 0);
