# engine/ — recompute the map from the ledger

`recompute` replays the reviewed evidence in the ledger week by week and writes the road and
site shares the map shows. It is deterministic: same ledger, same dates, same output. There is
no hard-coded year: the week range comes from the data and the date.

## Run

Needs Node.js 18+ and no npm packages. From the repository root:

```
node engine/recompute              # engine/snapshots/atlas-<year>-Www.json (first..last week) + engine/replay_summary.json (~1-2 min)
node engine/recompute --check      # unit check against the worked example, writes nothing
node engine/recompute --no-mc      # skip the Monte Carlo ranges (fast)
node engine/recompute --export-ui  # after a full run: engine/out/g1_replay_data.js (the file the site inlines)
node tools/weekly_build.mjs        # the weekly build: --check, file merged items, replay, export, update index.html
```

Week range options: `--from YYYY-Www`, `--to YYYY-Www`, `--today YYYY-MM-DD` (or env `FA_TODAY`).
Defaults: the first week is the start of the oldest **reviewed** phase (phase `2026` -> 2026-W01,
phase `2022-11` -> the ISO week of 2022-11-01, unless its `approved_<phase>.json` sets `history_from`:
`2022-11-30` -> 2022-W48, the current first week); the last week is the last **complete** ISO week
before today (a run on Monday 2026-11-23 ends at 2026-W47). To reproduce the 2026-W46 map
exactly: `node engine/recompute --to 2026-W46`.

## Inputs (what counts)

- `ledger/backfill/<phase>/I-*.json`: every phase folder is read, but a phase **counts only when
  `ledger/backfill/review/approved_<phase>.json` exists** with an `approved` date (the review
  record: indicators on hold, item-level corrections that change a counted field). Phases without
  it (today: 2025) are in the ledger for reading only and never move the numbers.
- `ledger/reviewed/<year>/<indicator>.json`: accepted contributor items. The weekly build moves
  each merged `ledger/inbox/EV-*.json` here; every item here counts, in the week of its own
  `published` date.
- `ledger/backfill/review/rulings.json`: maintainer rulings (indicators ruled MET / NOT MET from a
  date, merged indicators), listed with their reasons in `ledger/adjudications.md`.

Each run prints which phases counted and which were skipped.

## What the engine does

- Each item shifts the log-odds of the roads its indicator feeds: direction × strength ×
  source reliability (tier 1 / 2 / 3 = 0.95 / 0.85 / 0.70).
- Events fade with a half-life by kind: incidents and control failures 365 days, tier-3
  reports 90 days, other announcements 180 days. Laws and treaties in force do not fade.
  For data series and forecasts the latest reading replaces earlier ones.
- Caps: 0.7 per event cluster, 1.5 per indicator (log-odds); forecasts ±0.5 per source.
- Correlated evidence: items that cite the same source page (URL compared without scheme,
  `www.`, query, fragment or trailing slash) are not independent. Each week a source page carries
  one unit of weight, split evenly over the items that cite it and that move the numbers that
  week, across all indicators (`srcDedup`, `srcDedupScope` in `defaultParams`; an optional
  per-indicator cap per source is `srcCapIndicator`, off by default).
- Each item enters at the first weekly snapshot on or after its own published date.
- Road shares = editorial priors × evidence, with 3% kept as "none of these".
  Site shares = Σ road share × editorial split. Ranges = p10–p90 of Monte Carlo draws that
  vary strength (×0.5–1.5), priors and splits.
- Lenses: Baseline plus three maintainer presets (Slow diffusion, Loss of control, Many
  powers); Pooled = their equal mean.

All defaults live at the top of `lib.js` (`DEFAULTS`); values marked PROPOSED are still
under review. A full run prints the sensitivity of each default (halved / doubled).

## Known gaps

- 16 items (of 818 in the five phases 2022-11..2026) are on `hold`: shown on the map's Evidence page
  but not scored, because their source could not be re-read as of the item's date.
- The road-row wiring of a merged indicator (`rowFrom` in the `IND` table of `lib.js`) is
  still model code; the rulings themselves are read from `ledger/backfill/review/rulings.json`.
- The weekly build updates the numbers in `index.html`; the Evidence page text of newly filed
  items appears with the next full site build.

Verified 2026-11-19: on the public ledger all 46 weekly snapshots (2026-W01..W46) and the UI
export match the published map byte for byte. Since method 4.5.0 (2026-11-20) all five phases
count and the replay runs 2022-W48..2026-W46 (207 weekly snapshots). The map's own build uses this same engine and
stops if its copy differs.
