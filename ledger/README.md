# Evidence ledger (public)

The ledger is the public record the map is computed from. Anyone can read it, check it and
recompute the numbers. Ledger text is CC BY 4.0; code is Apache-2.0.

```
ledger/
├── schema/evidence.schema.json     submission format (JSON Schema 2020-12)
├── indicators.json                 indicator ids + statements (rendered as INDICATORS.md)
├── inbox/                          evidence items arrive here by PR, one item per file;
│   │                               a file on the main branch = merged = accepted
│   └── _examples/                     example items, never counted
├── reviewed/<year>/<indicator>.json   accepted items, filed there by the weekly build (counted)
├── backfill/<phase>/<indicator>.json  maintainer history backfill (replay material; a phase
│                                      counts only once backfill/review/approved_<phase>.json exists)
├── backfill/review/approved_<phase>.json  per-phase review record: pass/hold, wording overrides
├── backfill/review/rulings.json       maintainer rulings the engine reads (MET dates, merges)
└── adjudications.md                rulings on indicator status, with reasons and how to challenge them
```

## Life of an item

```
PR adds ledger/inbox/EV-....json
  └─ CI validate-evidence  (read-only: schema, naming, dates, paywall = errors;
                            country names, loaded words, duplicate sources = warnings)
  └─ open PR = public comment window, AT MOST 7 days
       - review agent posts a verdict, may push wording fixes (e.g. bloc labels), applies labels
       - anyone can comment in the PR
  └─ maintainer merges after review (earlier than 7 days if review is done and no objection
     is open; no auto-merge)  -> label: accepted      or closed -> label: rejected + reason
  └─ merge = accepted. Next weekly build (workflow every Monday 01:00 UTC, after the 00:00 freeze):
       - files the item under reviewed/<year>/<indicator>.json with reviewer fields
         (kind, source_tier, confidence, review: {pr, merged})
       - counts it in the week of its OWN `published` date; past weekly snapshots are
         recomputed (git history shows what changed)
  └─ no post-merge window: objections go through the Correction form
  └─ if it may settle an indicator: a ruling row in adjudications.md
```

## Rules that apply to every stage

- **Counting rule.** An item counts from the first weekly build after its merge, only in the
  week of its own publication date. It is never treated as new evidence for a later week.
  Items in open or unmerged PRs never move the numbers.
- **One event = one item.** Further sources for the same event are added to the existing
  item's `sources` list; they may raise `confidence` but never add weight. Simultaneous
  submissions: the first PR is primary, later ones are merged into it as sources and their
  authors are credited in `contributors`.
- **Strict wording.** An indicator is ruled `MET` only when the statement's own wording is met.
  Rulings: `MET` (with effective date), `NOT YET MET`, `UNRESOLVED` (re-judged on new facts),
  `MERGED` (duplicates counted once).
- **No silent rewrites.** Wording fixes after acceptance are applied as logged overrides
  (`review/approved_<phase>.json`, or a correction PR with a CHANGELOG line); source records
  are not edited silently.
- **Backfill.** History reconstructed by the maintainer (from 2022-11-30) is replay material:
  each item sits in its own past week. While there are no outside contributors, backfill
  batches are published without a comment window; this exemption is logged in the method
  CHANGELOG.
- **Votes are not evidence.** Visions votes (GitHub Discussions) never enter the ledger and
  never change road or site shares.
- **Blocs, not countries.** Every text field in the ledger uses bloc labels (`Bloc A`,
  `Bloc B`, then `Bloc C` ... `Bloc Z`, `Bloc 27`, ...). Labels are stable once assigned. The
  country -> bloc mapping is kept private by the maintainer; `tools/anonymize.mjs` applies it
  and takes the mapping path as an argument. Source URLs are kept as published.

## Recompute

The engine (`engine/recompute`) reads `inbox/` (merged items), `reviewed/`, `backfill/`,
`review/` and `adjudications.md` and writes one snapshot per week. Same ledger in, same
numbers out.
