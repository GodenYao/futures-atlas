# Changelog

## 2026-11-20 — method 4.5.0 (backfill phases 2022-11..2025 approved; replay from 2022-11-30)
- The four remaining history phases (2022-11, 2023, 2024, 2025; 107 + 113 + 154 + 212 items) passed review (auto-review, maintainer rulings, source re-reads) and now count, each item in the week of its own published date. All five phases are in `ledger/backfill/` (the three missing 2025 files added).
- The replay starts in the week of 2022-11-30 (2022-W48) instead of 2026-W01: `approved_2022-11.json` sets `history_from`, which the engine uses as the first week (207 weekly snapshots).
- Backfill items may carry baseline readings published before 2022-11-30 (they enter the first replay week); the validator no longer flags them. Contributor items must still be dated on or after 2022-11-30.
- Map: the replay paces itself to about 80 s over the longer span (weeks with evidence hold shorter, never faster than 3 steps a second); replay pills name the start week with its year.
- Effect on week 2026-W46 (Pooled): Enslaved God 14.13 → 17.99 %, Conquerors 13.81 → 17.39 %, Descendants 12.6 %; R1 20.1 → 25.6 %, R3 18.1 → 8.0 %, R4 30.7 → 38.6 %, R5 13.6 → 11.1 %, R2 12.7 → 12.1 %, R6 1.9 → 1.6 %. The leading ending is unchanged. The sensitivity table in `docs/sensitivity.md` was computed before this change.

## 2026-11-20 — evidence corrections (online re-sourcing, method 4.4.0 unchanged)
- Rulings that needed a source re-read were applied: release dates and first-print values read from archived copies (productivity, wealth-share and labour-cost releases), corrected Federal Register links, primary announcement links, a corrected bill sponsor line, and summaries rewritten to say only what their source says.
- Items whose filing values could not be re-read are now on `hold` (shown, not counted): 2 more in the counted 2026 phase, 13 in total.
- Effect on week 2026-W46 (Pooled): R1 20.0 → 20.1 %; other roads and the leading endings unchanged at one decimal.

## 2026-11-20 — method 4.4.0 (data rulings)
- Maintainer rulings on the evidence review applied to the backfill ledger: source tiers, confidence, dates, directions (search-result items with no finding are neutral and not counted), kinds, corrected summaries and source links.
- New item flag `hold`: the item stays on the Evidence page with a "Not counted" tag but is not scored (used when a source is only readable in a version later than the item's date). 11 items in the counted 2026 phase are on hold.
- `duplicate_of` is a display mark only; scoring keeps the existing same-source down-weighting.
- Effect on week 2026-W46 (Pooled): Enslaved God 14.15 → 14.13 %, Conquerors 13.62 → 13.81 %; R3 20.3 → 18.1 %, R5 12.6 → 13.6 %, R2 12.0 → 12.7 %. The leading ending is unchanged. The sensitivity table in `docs/sensitivity.md` was computed before this change.

## 2026-11-19 — method 4.3.0
- Source de-duplication: items citing the same source share one unit of weight per week.
- Methods published in `METHODS.md` (every parameter with value, range and rationale); one-at-a-time sensitivity test in `docs/sensitivity.md`.

## 2026-11-19 — new map view (B4)
- NOW is placed by the 13 ending shares at true scale (cliff endings Reversion and Self-destruction excluded); ground cloud, weekly trail, misty link from NOW to the leading ending.
- Scenario families (R1-R6) are a backstage calculation layer: hidden on the map by default, preview/pin from the side panel. R6 renamed "Gradual adoption" (was Plateau).
- Cliff endings shown as glowing cliff faces + a "cliffs" row under NOW.
- Tagline: "An evidence-weighted map of possible futures for AI and humanity". Header reads "Leading ending". Text view of endings at `#/text`.
- Old road-first view kept at `?b4=0`. Engine numbers and replay unchanged.

## 2026-11-18 — contribution pipeline
- Public evidence ledger (`ledger/`): schema, indicators, inbox, history backfill (2025–2026, bloc labels only).
- Evidence via pull request (one JSON file per item); CI validator `tools/validate_evidence.mjs`.
- Comment window = the open pull request, at most 7 days; merge = accepted; counts from the next weekly build in the week of the item's own publication date.
- Country names in text fields: warning; the reviewer rewrites them to bloc labels (Bloc A, B, C ...).
- One event = one item; further sources are added as corroboration, never extra weight.
- Neutrality lists in `tools/neutrality/` (country terms, loaded terms, paywall domains); edits to them are rule changes and are logged here.
- Correction issue form; Visions voting via GitHub Discussions (votes never change the map).

## 2026-11-18 — public engine, rulings file
- `engine/` recomputes all weekly snapshots from `ledger/backfill/` (no number changes).
- Maintainer rulings moved from code to `ledger/backfill/review/rulings.json`; date overrides in `approved_2026.json`.
- 9 backfill summaries corrected to match their sources; one informal bloc name → "Bloc C".
- Reviewer: country names are replaced by bloc labels in the merge commit; review comments never show bloc labels.
