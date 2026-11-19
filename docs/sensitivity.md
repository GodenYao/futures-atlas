# Sensitivity of the leading ending (week 2026-W46)

What this tests: the published W46 result (method 4.3.0, Pooled lens, central values), with
**one parameter at a time** moved to each end of a plausible range while everything else stays at its
default. 279 ranges were tested: 42 engine parameters, 24 lens priors, all 32 split cells, all 180
likelihood cells, and the one maintainer ruling that moves the numbers. Script:
[`tools/sens.js`](../tools/sens.js) (`node tools/sens.js .`, read-only, prints JSON).
Parameter meanings and default rationales: [METHODS.md](../METHODS.md).

## Headline

| | Pooled at W46 |
|---|---|
| Leader | **Enslaved God 14.1 %** |
| Runner-up | **Conquerors 13.6 %** (margin **0.5 pp**) |
| Then | Normal technology 10.7 · Descendants 10.6 · Gatekeeper 8.5 |
| Leader in each lens | Baseline: Enslaved God · Slow diffusion: Enslaved God · Loss of control: Conquerors · Many powers: Normal technology |
| Leader across 4,000 Monte Carlo draws (priors, splits, evidence strength, family damping varied together) | Enslaved God **39.8 %** of draws · Conquerors **39.0 %** · Normal technology 11.1 % · Descendants 8.2 % · Gatekeeper 1.7 % · others ≤ 0.1 % |

**The leading ending is sensitive to almost everything that touches R1 or R4.** The Pooled leader is a
near tie between Enslaved God (fed mainly by R1 "Rival blocs with obedient AI") and Conquerors (fed mainly
by R4 "Race → loss of control"). 48 of the 279 one-at-a-time ranges flip it, always between these two
(or, for one split, to Descendants). The single deciding editorial numbers are the two splits: R1 sends
70 % of its share to Enslaved God and R4 sends 45 % to Conquerors; dropping the first below **0.615** or
raising the second above **0.485** hands the lead to Conquerors. Evidence strength matters just as much:
counting evidence 4 % more strongly (beta 1.04) flips it to Conquerors, counting it at about a quarter
(beta 0.26) flips it to Normal technology. In the Monte Carlo the two are tied (≈ 39–40 % each). Honest
reading: the map says "Enslaved God and Conquerors are jointly most likely, about 14 % each", not
"Enslaved God leads". The splits, priors and likelihood rows are maintainer judgement (see
[METHODS.md](../METHODS.md)), so the order of the top two is a judgement call, not a finding.

## What-if: I-R4-01 not met (maintainer ruling)

I-R4-01 ("an AI system is documented to have copied itself or persisted outside its intended environment
without authorisation, uncontained for ≥ 24 h") was ruled MET from
2026-08-26 under the general rule *"if the original source does not disclose the duration, we treat the
requirement as met, unless there is evidence that the actual escape lasted less than 24 hours"*
(reasoning: [ledger/adjudications.md](../ledger/adjudications.md)). Without the ruling, its items count
as ordinary fading evidence.

| W46, central | Ruling applied (published) | Ruling not applied | Change |
|---|---|---|---|
| Pooled leader | Enslaved God 14.1 | Enslaved God 17.4 | +3.3 pp |
| Pooled top 5 | Enslaved God 14.1 · Conquerors 13.6 · Normal technology 10.7 · Descendants 10.6 · Gatekeeper 8.5 | Enslaved God 17.4 · Normal technology 12.0 · Conquerors 10.6 · Descendants 9.4 · Gatekeeper 7.6 | Conquerors 2nd → 3rd (−3.0 pp); margin 0.5 → 5.4 pp |
| Pooled R4 "Race → loss of control" | 30.3 | 23.5 | **−6.8 pp** |
| Pooled R1 / R2 / R3 / R5 / R6 | 20.1 / 12.0 / 20.3 / 12.5 / 1.8 | 24.6 / 15.2 / 16.9 / 12.3 / 4.5 | +4.5 / +3.2 / −3.4 / −0.2 / +2.7 |
| R4 by lens (Baseline / Slow diffusion / Loss of control / Many powers) | 27.0 / 12.9 / 56.9 / 24.3 | 19.8 / 8.6 / 47.7 / 18.0 | −7.2 / −4.3 / −9.2 / −6.3 |
| Lens leaders | unchanged | unchanged | – |
| Lenses with R6 at its 1 % floor | 3 | 1 | – |

The ruling does not change who leads, but it is what makes the race a tie: without it Enslaved God leads
by 5.4 pp and Conquerors drops to third.

## Every range that flips a leader

"Lo / Hi result" = Pooled leader with its lead over the runner-up in pp, then any **lens** whose own
leader changes. "Max road move" = largest change of any Pooled road share across both ends (splits move
endings only, not roads). Ranges: engine parameters and likelihood cells as listed in METHODS.md; priors
×0.5 / ×1.5 (the other five roads rescaled); splits at their published low / high; likelihood cells
±0.10. `beta` and the evidence scale `strengthScale` act identically, so only `beta` is listed.

| Group | Parameter | Default | Range | Lo result | Hi result | Max road move (pp) |
|---|---|---|---|---|---|---|
| engine | `beta` | 1 | 0.5 – 1.5 | Enslaved God 15.9 (+2.3) · lens: Slow diffusion→Normal technology | Conquerors 18.1 (+5.9) · lens: Baseline→Conquerors, Many powers→Conquerors | 9.9 |
| engine | `btos.base` | 17.4 | 15 – 20 | Conquerors 13.9 (+0.5) | Enslaved God 14.4 (+1.0) | 5.4 |
| engine | `eventDeltaByKind.incident` | 0.40 | 0.20 – 0.70 | Enslaved God 15.0 (+1.7) | Conquerors 14.0 (+1.1) | 3.3 |
| engine | `stateSpread` | 1 | 0.5 – 2 | Conquerors 14.4 (+0.0) | Enslaved God 14.0 (+1.0) | 1.7 |
| engine | `stateShift.med` | 0.35 | 0.17 – 0.70 | Enslaved God 14.2 (+0.9) | Conquerors 14.0 (+0.1) | 1.5 |
| prior | Loss of control R4 | 0.30 | 0.15 – 0.45 | Enslaved God 15.3 (+3.9) | Conquerors 15.2 (+1.8) | 5.3 |
| prior | Many powers R5 | 0.35 | 0.175 – 0.525 | Enslaved God 14.6 · lens: Many powers→Conquerors | Enslaved God 13.6 | 3.9 |
| prior | Baseline R1 | 0.30 | 0.15 – 0.45 | Conquerors 14.2 (+2.4) · lens: Baseline→Conquerors | Enslaved God 16.6 (+3.6) | 3.5 |
| prior | Slow diffusion R1 | 0.20 | 0.10 – 0.30 | Conquerors 13.9 (+2.0) · lens: Slow diffusion→Normal technology | Enslaved God 16.2 (+2.8) | 3.3 |
| prior | Baseline R4 | 0.10 | 0.05 – 0.15 | Enslaved God 14.9 (+2.7) | Conquerors 14.7 (+1.2) · lens: Baseline→Conquerors | 3.0 |
| prior | Many powers R4 | 0.08 | 0.04 – 0.12 | Enslaved God 14.5 (+2.1) | Conquerors 14.6 (+0.8) · lens: Many powers→Conquerors | 2.8 |
| prior | Many powers R3 | 0.10 | 0.05 – 0.15 | Enslaved God 14.4 · lens: Many powers→Conquerors | Enslaved God 13.9 | 2.2 |
| prior | Many powers R1 | 0.15 | 0.075 – 0.225 | Conquerors 13.9 (+1.0) | Enslaved God 15.4 · lens: Many powers→Enslaved God | 1.9 |
| prior | Loss of control R1 | 0.20 | 0.10 – 0.30 | Conquerors 14.1 (+1.1) | Enslaved God 15.4 (+2.3) | 1.7 |
| prior | Slow diffusion R4 | 0.03 | 0.015 – 0.045 | Enslaved God 14.5 (+1.6) | Conquerors 14.2 (+0.4) | 1.6 |
| split | R1 → Enslaved God | 0.70 | 0.55 – 0.85 | Conquerors 13.6 (+0.5) | Enslaved God 14.9 (+1.3) | 0 |
| split | R1 → 1984 | 0.08 | 0.03 – 0.15 | Enslaved God 14.9 (+1.3) | Conquerors 13.6 (+0.4) | 0 |
| split | R1 → Gatekeeper | 0.07 | 0.03 – 0.15 | Enslaved God 14.7 (+1.1) | Conquerors 13.6 (+0.5) | 0 |
| split | R1 → Egalitarian Utopia | 0.05 | 0.01 – 0.10 | Enslaved God 14.7 (+1.1) | Conquerors 13.6 (+0.1) | 0 |
| split | R1 → Libertarian Utopia | 0.05 | 0.01 – 0.10 | Enslaved God 14.7 (+1.1) | Conquerors 13.6 (+0.1) | 0 |
| split | R1 → Self-destruction | 0.05 | 0.02 – 0.10 | Enslaved God 14.6 (+1.0) | Conquerors 13.6 (+0.1) | 0 |
| split | R3 → Normal technology | 0.25 | 0.10 – 0.40 | Enslaved God 14.1 · lens: Many powers→Conquerors | Enslaved God 14.1 | 0 |
| split | R4 → Conquerors | 0.45 | 0.30 – 0.60 | Enslaved God 14.1 | Conquerors 15.8 (+1.6) | 0 |
| split | R4 → Descendants | 0.25 | 0.10 – 0.40 | Conquerors 16.0 (+1.9) | Enslaved God 14.1 · lens: Many powers→Descendants | 0 |
| split | R4 → Self-destruction | 0.15 | 0.05 – 0.25 | Conquerors 15.1 (+1.0) | Enslaved God 14.1 | 0 |
| split | R4 → Zookeeper | 0.10 | 0.05 – 0.20 | Conquerors 14.3 (+0.2) | Enslaved God 14.1 | 0 |
| split | R4 → Protector God | 0.05 | 0.01 – 0.10 | Conquerors 14.2 (+0.0) | Enslaved God 14.1 | 0 |
| split | R5 → Normal technology | 0.25 | 0.10 – 0.40 | Enslaved God 14.1 · lens: Many powers→Descendants | Enslaved God 14.1 | 0 |
| split | R5 → Descendants | 0.10 | 0.03 – 0.20 | Enslaved God 14.1 | Enslaved God 14.1 · lens: Many powers→Descendants | 0 |
| row | I-R4-01 p(yes \| R1) | 0.25 | 0.15 – 0.35 | Conquerors 14.7 (+3.0) · lens: Baseline→Conquerors, Slow diffusion→Normal technology | Enslaved God 18.1 (+5.4) · lens: Many powers→Enslaved God | 6.8 |
| row | I-R4-01 p(yes \| R4) | 0.60 | 0.50 – 0.70 | Enslaved God 14.8 (+2.6) | Conquerors 14.9 (+1.4) | 3.2 |
| row | I-R2-02 p(yes \| R4) | 0.60 | 0.50 – 0.70 | Conquerors 14.5 (+0.8) | Enslaved God 14.7 (+2.1) | 2.4 |
| row | I-R2-02 p(yes \| R1) | 0.55 | 0.45 – 0.65 | Enslaved God 15.2 (+1.8) | Conquerors 13.9 (+1.0) | 1.8 |
| row | I-R3-01 p(yes \| R1) | 0.20 | 0.10 – 0.30 | Conquerors 13.8 (+0.7) | Enslaved God 15.1 (+1.7) | 1.4 |
| row | I-R3-01 p(yes \| R4) | 0.40 | 0.30 – 0.50 | Enslaved God 14.4 (+1.5) | Conquerors 14.2 (+0.3) | 1.4 |
| row | 17 further R1 or R4 cells (I-R2-01, I-R2-05, I-R4-02, I-R4-03, I-R4-05, I-R5-04, I-R6-01, I-R6-04, I-R6-05) | – | ±0.10 | flip to Conquerors at one end, lead ≤ 0.3 pp | Enslaved God at the other, lead ≈ 1.1–1.4 pp | 0.7 – 1.0 |

Ranges that move a road by ≥ 2 pp **without** flipping the Pooled leader: the I-R4-01 ruling (R4 6.8),
the other I-R4-01 row cells (R2 4.4, R3 4.2, R5 3.0), Many powers prior R5 (3.9), Baseline and Slow
diffusion prior R3 (2.8 / 2.8), the survey threshold for I-R2-02 (2.5), Many powers prior R3 (2.2),
announcement event shift (2.1), I-R2-02 p(yes | R2) (2.0).

## Break-even values (scan from the default until the Pooled leader changes)

| Parameter | Default | Leader changes at (down) | Leader changes at (up) |
|---|---|---|---|
| Split R1 → Enslaved God | 0.70 | 0.615 → Conquerors | none up to 0.99 |
| Split R4 → Conquerors | 0.45 | 0.13 → Descendants | 0.485 → Conquerors |
| Split R4 → Descendants | 0.25 | 0.21 → Conquerors | 0.435 → Descendants |
| Split R1 → 1984 | 0.08 | none down to 0 | 0.12 → Conquerors |
| Split R6 → Normal technology | 0.70 | none | none |
| I-R4-01 p(yes \| R1) | 0.25 | 0.24 → Conquerors | none |
| I-R4-01 p(yes \| R4) | 0.60 | none | 0.63 → Conquerors |
| beta (evidence strength) | 1.0 | 0.26 → Normal technology | 1.04 → Conquerors |
| Incident event shift | 0.40 | none down to 0.05 | 0.50 → Conquerors |

(Split values are before each road's row is renormalised to 100 %.)

## What does not matter much

- All per-tier reliability, caps, clips, forecast caps, family damping (`rhoF`), diagnosticity floor,
  half-lives, instrument shifts and forecast shifts: no leader flip anywhere in their ranges, ≤ 2 pp on any
  road. R1-attribute inputs (narrow masters, holders) do not feed ending shares at all.
- None of the 279 ranges moves the leader to anything outside {Enslaved God, Conquerors, Descendants} in
  the Pooled view; lens leaders also move only among Enslaved God, Conquerors, Normal technology and
  Descendants.
- Source de-duplication (method 4.3.0) changed the W46 picture very little: before it, Pooled was
  Enslaved God 14.2 vs Conquerors 13.7, 50 flips out of 279, Monte Carlo 39.7 % vs 39.3 %; turning it off
  (`srcDedup: false`) reproduces method 4.2 exactly.
