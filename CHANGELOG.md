# Changelog

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
