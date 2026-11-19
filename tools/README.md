# tools/

Command-line helpers. All are plain Node (no dependencies); run them from the repo root.

| Tool | What it does | Writes |
|---|---|---|
| `validate_evidence.mjs` | Schema and neutrality check for evidence items (`--ledger` = every ledger file; CI runs it on every PR) | nothing |
| `weekly_build.mjs` | The weekly build: engine check, file merged items, replay, export, update `index.html` | ledger, `index.html` |
| `anonymize.mjs` | Replaces country names with bloc labels (`--scan <file>` = report only) | only with `--out` |
| `gen_indicators_md.mjs` | Regenerates `INDICATORS.md` from `ledger/indicators.json` | `INDICATORS.md` |
| `fetch_vision_votes.mjs` | Reads the Visions vote counts from GitHub Discussions | stdout |
| `w46.js` | Summary of one week (default 2026-W46, central values): leader, top 5, cliffs and R1–R6 per lens, R6 floor weeks, source de-duplication counts. `node tools/w46.js . ['{"srcDedup":false}']`; `LASTW=40` for another week | stdout (JSON) |
| `sens.js` | One-at-a-time sensitivity of the W46 result over 279 parameter ranges, break-even scans and Monte Carlo leader frequency ([docs/sensitivity.md](../docs/sensitivity.md) is made from it). `node tools/sens.js .`; `OVR='{"srcDedup":false}'` to override engine parameters. ~1 min | stdout (JSON) |

`w46.js` and `sens.js` load `engine/lib.js` and the ledger directly and never write files, so their
output always matches the engine in the same checkout.
