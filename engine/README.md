# engine/ — recompute the map from the ledger

`recompute` replays the reviewed evidence in `ledger/backfill/` week by week and writes the
road and site shares the map shows. It is deterministic: same ledger, same output.

## Run

Needs Node.js 18+ and no npm packages. From the repository root:

```
node engine/recompute              # writes engine/snapshots/atlas-2026-W01..W46.json + engine/replay_summary.json (~1-2 min)
node engine/recompute --check      # unit check against the worked example, writes nothing
node engine/recompute --no-mc      # skip the Monte Carlo ranges (fast)
node engine/recompute --export-ui  # after a full run: engine/out/g1_replay_data.js (the file the site inlines)
```

Inputs: `ledger/backfill/2026/I-*.json` (evidence items) and
`ledger/backfill/review/approved_2026.json` (which phase is reviewed, indicators on hold, and
item-level corrections that change a counted field). Only reviewed phases count.

## What the engine does

- Each item shifts the log-odds of the roads its indicator feeds: direction × strength ×
  source reliability (tier 1 / 2 / 3 = 0.95 / 0.85 / 0.70).
- Events fade with a half-life by kind: incidents and control failures 365 days, tier-3
  reports 90 days, other announcements 180 days. Laws and treaties in force do not fade.
  For data series and forecasts the latest reading replaces earlier ones.
- Caps: 0.7 per event cluster, 1.5 per indicator (log-odds); forecasts ±0.5 per source.
- Each item enters at the first weekly snapshot on or after its own published date.
- Road shares = editorial priors × evidence, with 3% kept as "none of these".
  Site shares = Σ road share × editorial split. Ranges = p10–p90 of Monte Carlo draws that
  vary strength (×0.5–1.5), priors and splits.
- Lenses: Baseline plus three maintainer presets (Slow diffusion, Loss of control, Many
  powers); Pooled = their equal mean.

All defaults live at the top of `lib.js` (`DEFAULTS`); values marked PROPOSED are still
under review. A full run prints the sensitivity of each default (halved / doubled).

## Known gaps

- The 2025 phase is in the ledger but not reviewed, so it does not count.
- Indicator rulings (for example "counted under I-N-01") are applied in code (`lib.js`),
  not yet read from a ledger file.
- Item wording corrections that do not change a counted field are applied only in the site
  build, not in this file.

Verified 2026-11-18: run on the public ledger, all 46 weekly snapshots and the UI export
match the published map exactly.
