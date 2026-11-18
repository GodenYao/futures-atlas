# Evidence inbox

Drop **one evidence item per file** here by pull request. Everything in this folder is
**submitted** while its pull request is open (the public comment window, at most 7 days) and
never moves the map then. Once the maintainer merges it after review it is **accepted**: it
counts from the next weekly build, in the week of its own publication date, and the build files
it under `ledger/reviewed/`. Objections after the merge go through the correction form.

## File rules

| Rule | Example |
|---|---|
| Format | JSON, UTF-8, one object (no arrays, no bundles) |
| File name | `<id>.json` |
| Id | `EV-<published YYYYMMDD>-<short-kebab-slug>`, e.g. `EV-20261002-framework-v2-1-revision` |
| Location | directly in `ledger/inbox/` (`_examples/` is for examples only and is never counted) |
| Schema | [`ledger/schema/evidence.schema.json`](../schema/evidence.schema.json) (JSON Schema 2020-12) |
| Indicator ids | [`INDICATORS.md`](../../INDICATORS.md); omit `indicator` if unsure |
| Licence | `"licence": "CC-BY-4.0"` covers summary, detail, reasoning, counterpoint |

Reviewer-only fields (`kind`, `source_tier`, `confidence`, `review`) are **not allowed** here;
reviewers add them when an item is promoted.

## Check before you open the PR

```sh
node tools/validate_evidence.mjs ledger/inbox/EV-20261109-your-slug.json
```

CI (`.github/workflows/validate-evidence.yml`) runs the same script on every PR that touches
this folder. It checks the schema, file name = id, date in id = `published`, the date range
(2022-11-30 to today), that the indicator exists, country names in summary/reasoning/counterpoint
(`tools/neutrality/country_terms.txt`), paywalled hosts without an `access_note`
(`tools/neutrality/paywall_domains.txt`), and warns about duplicate sources and loaded words.

## Minimal item

See [`_examples/EV-20261002-framework-v2-1-revision.json`](_examples/EV-20261002-framework-v2-1-revision.json).

```json
{
  "schema_version": 1,
  "id": "EV-YYYYMMDD-short-slug",
  "source_url": "https://...",
  "published": "YYYY-MM-DD",
  "title": "Title as published",
  "summary": "1-3 neutral sentences with the source's numbers and dates.",
  "roads": ["R4"],
  "direction": "raises",
  "reasoning": "One sentence: why that direction.",
  "counterpoint": "none known",
  "source_type": "paper",
  "access": "open",
  "language": "en",
  "submitted_by": "gh:your-handle",
  "licence": "CC-BY-4.0"
}
```

Optional: `archive_url`, `detail`, `endings`, `indicator`, `access_note` (required if
`access` is `paywall`), `agent`, `coi`.

Full instructions for people: [CONTRIBUTING.md](../../CONTRIBUTING.md). For AI agents: [AGENTS.md](../../AGENTS.md).
