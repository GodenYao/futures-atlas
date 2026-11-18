#!/usr/bin/env node
// Prints INDICATORS.md from ledger/indicators.json (stdout only).
//   node tools/gen_indicators_md.mjs > INDICATORS.md
// CI / reviewers can diff the output against the committed file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'ledger/indicators.json'), 'utf8'));
const ROADS = {
  R1: 'Rival blocs with obedient AI',
  R2: 'Gradual disempowerment',
  R3: 'Incident → coordinated restraint',
  R4: 'Race → loss of control',
  R5: 'Broad diffusion',
  R6: 'Normal technology / plateau',
};
const esc = s => String(s).replace(/\|/g, '\\|');
const out = [];
out.push('# Indicators');
out.push('');
out.push(`Generated from \`ledger/indicators.json\` by \`tools/gen_indicators_md.mjs\` (method ${data.method}). Do not edit by hand.`);
out.push('');
out.push('Each indicator is a dated, checkable statement. Evidence items name the indicator they bear on in `indicator`; omit it if unsure and a reviewer assigns one. An indicator is ruled MET only when its own wording is met (see `ledger/adjudications.md`).');
out.push('');
const groups = [
  ...Object.keys(ROADS).map(r => [`${r} · ${ROADS[r]}`, i => i.road === r && !i.attribute]),
  ['R1 attribute · holders (how many independent controllers of frontier AI)', i => i.attribute === 'holders'],
  ['R1 lane · narrow masters (technofeudal sub-risk)', i => i.attribute === 'narrow-masters lane'],
];
for (const [title, f] of groups) {
  const rows = data.indicators.filter(f);
  if (!rows.length) continue;
  out.push(`## ${title}`);
  out.push('');
  out.push('| Id | Road | Statement |');
  out.push('|---|---|---|');
  for (const i of rows) out.push(`| \`${i.id}\` | ${i.road} | ${esc(i.statement)}${i.note ? ' *' + esc(i.note) + '*' : ''} |`);
  out.push('');
}
out.push(`${data.indicators.length} indicators. Changing a statement is a method change (semver bump + CHANGELOG entry).`);
process.stdout.write(out.join('\n') + '\n');
