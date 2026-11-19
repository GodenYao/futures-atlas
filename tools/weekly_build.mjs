#!/usr/bin/env node
// Futures Atlas - weekly build (run by .github/workflows/weekly-build.yml every Monday 01:00 UTC, or by hand).
//
//   node tools/weekly_build.mjs [--today YYYY-MM-DD] [--no-file]
//
// Steps (stops with exit 1 on any failure; never pushes - the workflow opens a PR):
//   1. node engine/recompute --check          §3.9 worked example must pass in full
//   2. file accepted items: every merged ledger/inbox/EV-*.json (not _examples/) that names an indicator is moved
//      into ledger/reviewed/<year of published>/<indicator>.json (one bundle per indicator and year) with
//      review: { filed: <today> }. Reviewer fields not in the submission schema get defaults
//      (kind "event", source_tier 2, confidence "med"); the maintainer may adjust them in the weekly PR.
//      Items without an indicator stay in the inbox and are listed (they cannot count).
//   3. node engine/recompute                  replays every reviewed backfill phase + reviewed/ up to the last
//                                             complete ISO week (year-agnostic)
//   4. node engine/recompute --export-ui      -> engine/out/g1_replay_data.js
//   5. splice the new `var BFRP=...;` into index.html, only if it changed
// Prints `week=<YYYY-Www>` and `changed=<true|false>` (also to $GITHUB_OUTPUT when set).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const today = arg('--today', process.env.FA_TODAY || new Date().toISOString().slice(0, 10));
const env = Object.assign({}, process.env, { FA_TODAY: today });
const run = (...a) => execFileSync('node', a, { cwd: root, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 64 << 20 });
const fail = m => { console.error('weekly build: ' + m); process.exit(1); };

// 1. unit check
const chk = run('engine/recompute', '--check');
const m = /§3\.9 CHECK: (\d+)\/(\d+) passed/.exec(chk);
if (!m || m[1] !== m[2]) fail('engine --check failed:\n' + chk.split('\n').filter(l => /FAIL|CHECK/.test(l)).join('\n'));
console.log(`check: ${m[1]}/${m[2]} passed`);

// 2. file merged inbox items into reviewed/
const inbox = path.join(root, 'ledger', 'inbox');
let filed = 0; const noInd = [];
if (!args.includes('--no-file') && fs.existsSync(inbox)) {
  for (const f of fs.readdirSync(inbox).filter(f => /^EV-.*\.json$/.test(f)).sort()) {
    const p = path.join(inbox, f); const it = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!it.indicator) { noInd.push(f); continue; }
    const dir = path.join(root, 'ledger', 'reviewed', it.published.slice(0, 4)); fs.mkdirSync(dir, { recursive: true });
    const bp = path.join(dir, it.indicator + '.json');
    const b = fs.existsSync(bp) ? JSON.parse(fs.readFileSync(bp, 'utf8')) : { indicator: it.indicator, items: [] };
    if (!b.items.some(x => x.id === it.id)) {
      b.items.push(Object.assign({ kind: 'event', source_tier: 2, confidence: 'med' }, it, { review: Object.assign({ filed: today }, it.review || {}) }));
      b.items.sort((x, y) => (x.published || '').localeCompare(y.published || '') || x.id.localeCompare(y.id));
      fs.writeFileSync(bp, JSON.stringify(b, null, 2) + '\n');
    }
    fs.unlinkSync(p); filed++;
  }
}
console.log(`filed ${filed} accepted inbox item(s) into ledger/reviewed/` + (noInd.length ? `; ${noInd.length} without an indicator stay in the inbox (not counted): ${noInd.join(', ')}` : ''));

// 3-4. replay + export
run('engine/recompute');
const out = path.join(root, 'engine', 'out', 'g1_replay_data.js');
run('engine/recompute', '--export-ui', '--out', out);
const js = fs.readFileSync(out, 'utf8');
const nb = /var BFRP=.*;\n/.exec(js); if (!nb) fail('export has no BFRP line');
const week = JSON.parse(nb[0].slice(9, -2)).weeks.slice(-1)[0];

// 5. splice into index.html
const ip = path.join(root, 'index.html'); const html = fs.readFileSync(ip, 'utf8');
const i0 = html.indexOf('var BFRP='); if (i0 < 0) fail('index.html has no var BFRP=');
const i1 = html.indexOf(';\n', i0); if (i1 < 0) fail('index.html: BFRP line not terminated');
const next = html.slice(0, i0) + nb[0].slice(0, -1) + html.slice(i1 + 2 - 1);
const changed = next !== html || filed > 0;
if (next !== html) fs.writeFileSync(ip, next);
console.log(`week=${week}\nchanged=${changed}` + (next !== html ? ' (index.html data updated)' : ' (index.html data unchanged)'));
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `week=${week}\nchanged=${changed}\nfiled=${filed}\n`);
