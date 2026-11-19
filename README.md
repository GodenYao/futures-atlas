# Futures Atlas

An open, interactive 3D map of 13 possible AI endings over the next ten years (Max Tegmark's
twelve *Life 3.0* aftermath scenarios plus "Normal technology", Narayanan & Kapoor). A NOW
point shows where this week's public evidence puts us; shares are computed through six
editorial scenario families (R1–R6).

- Live map: https://godenyao.github.io/futures-atlas/

## What it is

- **An evidence-weighted map of scenarios.** Ending shares start from editorial weights set
  by the maintainer and move each week with reviewed public evidence in [`ledger/`](ledger/).
- **Recomputable.** [`engine/`](engine/) replays the ledger and reproduces every share on the
  map (`node engine/recompute`, no dependencies).
- **Neutral.** No ending is rated good or bad. Rival powers are unnamed (Bloc A, Bloc B), with
  no flags or national colours.

## What it is not

- **Not a forecast.** The numbers say how the evidence so far tilts a set of editorial
  starting weights, not how likely an ending is.
- Not a poll: votes on Visions never change the map.
- Not finished: one maintainer, one reviewed year of evidence (2026). Lenses other than
  Baseline are maintainer presets, not the views of the thinkers they are named after.

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
