# Sensitivity of the leading ending (week 2026-W46)

What this tests: the published W46 result (method 4.5.0, all five evidence phases 2022-11..2026 counted,
Pooled lens, central values: Enslaved God 18.0 %, Conquerors 17.4 %), with **one parameter at a time**
moved to each end of a plausible range while everything else stays at its default. 279 ranges were
tested: 42 engine parameters, 24 lens priors, all 32 split cells, all 180 likelihood cells, and the one
maintainer ruling that moves the numbers. Script: [`tools/sens.js`](../tools/sens.js) (`node tools/sens.js .`,
read-only, prints JSON; re-run 2026-11-20 on the public ledger; its base case reproduces the live W46 map).
Parameter meanings and default rationales: [METHODS.md](../METHODS.md). The previous version of this page
(method 4.3.0, 2026 evidence only: Enslaved God 14.1 % vs Conquerors 13.6 %, 48 flips) is in the git history.

## Headline

| | Pooled at W46 |
|---|---|
| Leader | **Enslaved God 18.0 %** (80 % range 12.9–20.8) |
| Runner-up | **Conquerors 17.4 %** (10.5–23.8; margin **0.6 pp**) |
| Then | Descendants 12.6 · Self-destruction 8.7 · Normal technology 7.1 · Zookeeper 6.9 |
| Leader in each lens | Baseline: Enslaved God · Slow diffusion: Enslaved God · Loss of control: Conquerors · Many powers: Conquerors |
| Leader across 4,000 Monte Carlo draws (priors, splits, evidence strength, family damping varied together) | Enslaved God **48.4 %** of draws · Conquerors **44.3 %** · Descendants 6.7 % · Normal technology 0.6 % · Self-destruction 0.1 % |

**The leading ending is sensitive to almost everything that touches R1 or R4.** The Pooled leader is a
near tie between Enslaved God (fed mainly by R1 "Rival blocs with obedient AI") and Conquerors (fed mainly
by R4 "Race → loss of control"). **63 of the 279** one-at-a-time ranges flip it, every time to Conquerors
(`beta` and `strengthScale` act identically and are counted separately). The single deciding editorial
numbers are the two splits: R1 sends 70 % of its share to Enslaved God and R4 sends 45 % to Conquerors;
dropping the first below **0.625** or raising the second above **0.48** hands the lead to Conquerors.
Evidence strength matters just as much: counting evidence 4 % more strongly (beta 1.04) flips it to
Conquerors, counting it at about a sixth (beta 0.16) flips it to Normal technology. In the Monte Carlo the
two lead in 48 % and 44 % of draws. Reading: the map says "Enslaved God and Conquerors are jointly the
largest shares, about 18 % each", not "Enslaved God leads". The splits, priors and likelihood rows are
maintainer judgement (see [METHODS.md](../METHODS.md)), so the order of the top two is a judgement call,
not a finding.

## What-if: I-R4-01 not met (maintainer ruling)

I-R4-01 ("an AI system is documented to have copied itself or persisted outside its intended environment
without authorisation, uncontained for ≥ 24 h") was ruled MET from 2026-08-26 under the general rule
*"if the original source does not disclose the duration, we treat the requirement as met, unless there is
evidence that the actual escape lasted less than 24 hours"* (reasoning:
[ledger/adjudications.md](../ledger/adjudications.md)). Without the ruling, its items count as ordinary
fading evidence.

| W46, central | Ruling applied (published) | Ruling not applied |
|---|---|---|
| Pooled leader | Enslaved God 18.0 | Enslaved God 21.8 |
| Runner-up | Conquerors (margin 0.6 pp) | Conquerors (margin **8.2 pp**) |
| Largest Pooled road move | – | 8.4 pp |
| Lens leaders | Many powers: Conquerors | Many powers: Enslaved God; others unchanged |
| Lenses with R6 at its 1 % floor | 3 | 1 |

The ruling does not change who leads in the Pooled view, but it is what makes the race a near tie:
without it Enslaved God leads by 8.2 pp.

## Every range that flips a leader

"Lo / Hi result" = Pooled leader, its share and (in brackets) its lead over the runner-up in pp, then any
**lens** whose own leader changes. "Max road move" = largest change of any Pooled road share across both
ends (splits move endings only, not roads). Ranges: engine parameters and likelihood cells as listed in
METHODS.md; priors ×0.5 / ×1.5 (the other five roads rescaled); splits at their published low / high;
likelihood cells ±0.10. Rows that change only a lens leader are included.

| Group | Parameter | Default | Range | Lo result | Hi result | Max road move (pp) |
|---|---|---|---|---|---|---|
| engine | `beta` | 1 | 0.5 – 1.5 | Enslaved God 18.2 (+6.7) · lens: Many powers→Normal technology | Conquerors 24.4 (+9.0) · lens: Baseline→Conquerors | 15.7 |
| engine | `strengthScale` | 1 | 0.5 – 1.5 | Enslaved God 18.2 (+6.7) · lens: Many powers→Normal technology | Conquerors 24.4 (+9.0) · lens: Baseline→Conquerors | 15.7 |
| engine | `btos.base` | 17.4 | 15 – 20 | Conquerors 17.3 (+0.8) | Enslaved God 18.6 (+1.3) | 4.2 |
| engine | `halfLifeScale` | 1 | 0.5 – 2 | Enslaved God 18.1 (+1.7) | Conquerors 18.4 (+0.8) | 2.3 |
| engine | `halfLife.announcement` | 180 | 90 – 365 | Enslaved God 17.7 (+1.1) | Conquerors 18.4 (+0.8) | 2.2 |
| engine | `eventDeltaByKind.announcement` | 0.25 | 0.12 – 0.45 | Enslaved God 17.8 (+1.2) | Conquerors 18.3 (+0.5) | 2.1 |
| engine | `btos.thr.I-R2-02.0` | 34.9 | 30 – 40 | Conquerors 17.3 (+0.1) | Enslaved God 18.2 (+0.8) | 2.1 |
| engine | `eventDeltaByKind.incident` | 0.4 | 0.2 – 0.7 | Enslaved God 18.9 (+2.1) | Conquerors 18.1 (+1.1) | 1.7 |
| engine | `deltaCapIndicator` | 1.5 | 1 – 2.5 | Conquerors 17.0 (+0.1) | Enslaved God 18.7 (+1.3) | 1.6 |
| engine | `tierRho.2` | 0.85 | 0.75 – 0.95 | Enslaved God 18.1 (+1.3) | Conquerors 17.9 (+0.1) | 1.2 |
| prior | Loss of control R4 | 0.3 | 0.15 – 0.45 | Enslaved God 19.6 (+4.5) | Conquerors 18.7 (+1.6) | 5.0 |
| prior | Baseline R1 | 0.3 | 0.15 – 0.45 | Conquerors 18.4 (+3.2) · lens: Baseline→Conquerors | Enslaved God 20.6 (+4.2) | 4.0 |
| prior | Slow diffusion R1 | 0.2 | 0.1 – 0.3 | Conquerors 18.0 (+2.8) | Enslaved God 20.2 (+3.3) | 4.0 |
| prior | Baseline R4 | 0.1 | 0.05 – 0.15 | Enslaved God 19.4 (+3.7) | Conquerors 18.6 (+1.6) · lens: Baseline→Conquerors | 3.7 |
| prior | Many powers R5 | 0.35 | 0.175 – 0.525 | Enslaved God 18.5 (+0.5) | Enslaved God 17.3 (+0.7) · lens: Many powers→Normal technology | 3.6 |
| prior | Many powers R4 | 0.08 | 0.04 – 0.12 | Enslaved God 18.7 (+2.9) · lens: Many powers→Enslaved God | Conquerors 18.5 (+1.1) | 3.4 |
| prior | Many powers R1 | 0.15 | 0.075 – 0.225 | Conquerors 17.8 (+1.5) | Enslaved God 19.5 (+2.6) · lens: Many powers→Enslaved God | 2.3 |
| prior | Slow diffusion R4 | 0.03 | 0.015 – 0.045 | Enslaved God 18.7 (+2.3) | Conquerors 18.2 (+0.8) | 2.1 |
| prior | Loss of control R1 | 0.2 | 0.1 – 0.3 | Conquerors 18.0 (+1.3) | Enslaved God 19.3 (+2.6) | 1.9 |
| split | R1 → Enslaved God | 0.7 | 0.55 – 0.85 | Conquerors 17.4 (+0.7) | Enslaved God 19.0 (+1.6) | 0 |
| split | R1 → 1984 | 0.08 | 0.03 – 0.15 | Enslaved God 18.9 (+1.6) | Conquerors 17.4 (+0.6) | 0 |
| split | R1 → Gatekeeper | 0.07 | 0.03 – 0.15 | Enslaved God 18.7 (+1.4) | Conquerors 17.4 (+0.7) | 0 |
| split | R1 → Egalitarian Utopia | 0.05 | 0.01 – 0.10 | Enslaved God 18.7 (+1.4) | Conquerors 17.4 (+0.2) | 0 |
| split | R1 → Libertarian Utopia | 0.05 | 0.01 – 0.10 | Enslaved God 18.7 (+1.4) | Conquerors 17.4 (+0.2) | 0 |
| split | R1 → Self-destruction | 0.05 | 0.02 – 0.10 | Enslaved God 18.5 (+1.2) | Conquerors 17.4 (+0.2) | 0 |
| split | R4 → Conquerors | 0.45 | 0.30 – 0.60 | Enslaved God 18.0 (+3.7) · lens: Many powers→Descendants | Conquerors 20.2 (+2.2) | 0 |
| split | R4 → Descendants | 0.25 | 0.10 – 0.40 | Conquerors 20.5 (+2.5) | Enslaved God 18.0 (+1.6) · lens: Many powers→Descendants | 0 |
| split | R4 → Self-destruction | 0.15 | 0.05 – 0.25 | Conquerors 19.3 (+1.3) | Enslaved God 18.0 (+2.2) | 0 |
| split | R4 → Zookeeper | 0.10 | 0.05 – 0.20 | Conquerors 18.3 (+0.3) | Enslaved God 18.0 (+2.2) | 0 |
| split | R4 → Protector God | 0.05 | 0.01 – 0.10 | Conquerors 18.1 (+0.1) | Enslaved God 18.0 (+1.4) | 0 |
| row | I-R4-01 p(yes \| R1) | 0.25 | 0.15 – 0.35 | Conquerors 19.2 (+5.2) · lens: Baseline→Conquerors | Enslaved God 22.5 (+6.5) · lens: Many powers→Enslaved God | 8.1 |
| row | I-R4-01 p(yes \| R4) | 0.60 | 0.50 – 0.70 | Enslaved God 19.1 (+3.3) · lens: Many powers→Enslaved God | Conquerors 18.8 (+1.8) | 3.5 |
| row | I-R2-02 p(yes \| R4) | 0.60 | 0.50 – 0.70 | Conquerors 18.4 (+1.1) | Enslaved God 18.8 (+2.6) · lens: Many powers→Enslaved God | 2.6 |
| row | I-R2-02 p(yes \| R1) | 0.55 | 0.45 – 0.65 | Enslaved God 19.2 (+2.2) | Conquerors 17.9 (+1.3) | 2.1 |
| row | I-R3-01 p(yes \| R1) | 0.20 | 0.10 – 0.30 | Conquerors 17.8 (+1.1) | Enslaved God 19.2 (+2.2) | 1.9 |
| row | I-R1-02 p(yes \| R4) | 0.45 | 0.35 – 0.55 | Enslaved God 18.6 (+2.0) | Conquerors 18.1 (+0.6) | 1.8 |
| row | I-R3-01 p(yes \| R4) | 0.40 | 0.30 – 0.50 | Enslaved God 18.5 (+1.9) | Conquerors 18.1 (+0.6) | 1.7 |
| row | 27 further R1 or R4 cells (I-R1-02, I-R1-03, I-R1-04, I-R2-01, I-R2-05, I-R3-03, I-R3-05, I-R4-02, I-R4-03, I-R4-05, I-R5-04, I-R5-05, I-R6-01, I-R6-04, I-R6-05) | – | ±0.10 | flip to Conquerors at one end, lead ≤ 0.9 pp | Enslaved God at the other, lead ≈ 0.8–1.7 pp | 0.7 – 1.6 |

Ranges that move a road by ≥ 2 pp **without** flipping the Pooled leader: the I-R4-01 ruling (8.4; Many
powers lens → Enslaved God), the I-R4-01 p(yes | R2) cell (4.4), Many powers prior R5 (3.6, listed above
for its lens flip), the I-R4-01 p(yes | R5) cell (2.8), the high-tier instrument shift `instrDelta.high`
(2.5), Many powers prior R2 (2.0).

## Break-even values (scan from the default until the Pooled leader changes)

| Parameter | Default | Leader changes at (down) | Leader changes at (up) |
|---|---|---|---|
| Split R1 → Enslaved God | 0.70 | 0.625 → Conquerors | none |
| Split R4 → Conquerors | 0.45 | 0.09 → Descendants | 0.48 → Conquerors |
| Split R4 → Descendants | 0.25 | 0.215 → Conquerors | 0.48 → Descendants |
| Split R1 → 1984 | 0.08 | none | 0.12 → Conquerors |
| Split R6 → Normal technology | 0.70 | none | none |
| I-R4-01 p(yes \| R1) | 0.25 | 0.24 → Conquerors | none |
| I-R4-01 p(yes \| R4) | 0.60 | none | 0.625 → Conquerors |
| beta (evidence strength) | 1.0 | 0.16 → Normal technology | 1.04 → Conquerors |
| Incident event shift | 0.40 | none | 0.49 → Conquerors |

(Split values are before each road's row is renormalised to 100 %.)

## What does not matter much

- Per-tier reliability other than tier 2, caps other than the per-indicator cap, clips, forecast caps,
  family damping (`rhoF`), diagnosticity floor, the other half-lives, instrument shifts and forecast
  shifts: no leader flip anywhere in their ranges, ≤ 2.5 pp on any road. R1-attribute inputs (narrow
  masters, holders) do not feed ending shares at all.
- None of the 279 ranges moves the Pooled leader to anything other than Conquerors; lens leaders move only
  among Enslaved God, Conquerors, Normal technology and Descendants.
- Adding the 2022-11..2025 history (method 4.5.0) changed the Monte Carlo split from 39.8 / 39.0 % to
  48.4 / 44.3 % and the number of flipping ranges from 48 to 63.
- Source de-duplication (method 4.3.0): turning it off (`srcDedup: false`) reproduces method 4.2 exactly.
