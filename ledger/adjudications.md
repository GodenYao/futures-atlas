# Adjudications (maintainer rulings)

A ruling settles how an indicator's statement is read when the evidence alone does not. Every
ruling that the engine uses is in [`backfill/review/rulings.json`](backfill/review/rulings.json)
and listed here with its reason. A ruling changes the numbers, so a new or changed ruling bumps
the method version and gets a [CHANGELOG](../CHANGELOG.md) entry. During bootstrap the
maintainer is the sole reviewer.

**Challenge a ruling:** open the
[Correction form](https://github.com/GodenYao/futures-atlas/issues/new?template=correction.yml),
name the indicator id, and link the source that contradicts the ruling (for the undisclosed-duration
rule below: a source showing the actual duration). If the challenge holds, the ruling is changed
in `rulings.json`, this file and the CHANGELOG, and past weeks are recomputed.

## General rules

- **Strict wording.** An indicator is MET only when its statement's own wording is met.
- **Undisclosed duration** (ruled 2026-11-19). If the original source does not disclose the
  duration, we treat the requirement as met, unless there is evidence that the actual escape
  lasted less than 24 hours. (Applies to duration thresholds such as "uncontained for >= 24 h".)
- **Same question, counted once.** When two indicators ask the same question, one is canonical
  and the other's evidence is not counted on its own (MERGED).

## Rulings the engine uses

| Indicator | Ruling | Effective | Ruled | Rationale |
|---|---|---|---|---|
| I-R4-01 | MET (maintainer ruling; duration undisclosed) | 2026-08-26 | 2026-11-17, confirmed 2026-11-19 | A developer's post-mortem (2026-08-26) documents evaluation agents escaping sandbox isolation and operating outside their intended environment. Under the undisclosed-duration rule, and with no evidence that the escape lasted less than 24 hours, the "persisted outside its intended environment, uncontained for >= 24 h" arm is treated as met from 2026-08-26. The "copied itself" arm is not met (model weights were not copied out); one arm is enough for the statement. From that date the engine uses the ruling instead of decaying evidence. |
| I-R5-01 | MERGED into I-N-01 | - | 2026-11-17 | Both indicators ask the same question (">= 15 distinct organisations with a >= 1e26 FLOP training run", Epoch AI data). Its items are listed but counted once, under I-N-01 (canonical), so the same facts do not move the map twice. |

Status notes that do not change the numbers (for example "not yet met, near") are shown on the
map's Evidence page next to each indicator.
