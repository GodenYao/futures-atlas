# Futures Atlas (design sample)

An open, interactive 3D map of possible AI futures over the next ten years: six roads from "Now" fan out into thirteen outcomes (Max Tegmark's twelve *Life 3.0* aftermath scenarios plus "Normal technology"). Road width = estimated share; lenses show how different schools of thought would weigh the same evidence.

**Status: DESIGN SAMPLE.** All numbers on the map are illustrative only and are not forecasts. Placement of outcomes is our interpretation of Tegmark's scenarios.

- Live preview: https://godenyao.github.io/futures-atlas/
- Older samples: `samples/`

## Contribute

The map is recomputable from a public evidence ledger in [`ledger/`](ledger/). Three ways to help:

- **Evidence** (priority) — a pull request adding one JSON file per fact to `ledger/inbox/`.
  Using an AI agent? Point it at **[AGENTS.md](AGENTS.md)**. Schema:
  [`ledger/schema/evidence.schema.json`](ledger/schema/evidence.schema.json); indicators:
  [INDICATORS.md](INDICATORS.md). CI checks every PR.
- **Corrections** — the [correction form](https://github.com/GodenYao/futures-atlas/issues/new?template=correction.yml)
  for wrong data, broken links, overstated or non-neutral wording.
- **Visions** — post or 👍 videos per ending in [Discussions › Visions](https://github.com/GodenYao/futures-atlas/discussions/categories/visions)
  ([rules](docs/VISIONS.md)). Votes reflect online opinion only and never change the map.

Every item is reviewed against its source while its pull request is open (public comment
window, at most 7 days); once merged it counts from the next weekly build, in the week of its
own publication date. During bootstrap the maintainer is the sole reviewer. Rules:
[CONTRIBUTING.md](CONTRIBUTING.md) · [Code of conduct](CODE_OF_CONDUCT.md).

Submitting works best on a computer; the map itself works on phones.

Videos in the "Visions" panel are embedded from YouTube and belong to their creators.

Personal project, not affiliated with or endorsed by any employer.

Code: Apache-2.0. Ledger, summaries and figures: CC BY 4.0.
