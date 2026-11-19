# How the numbers are made

This page explains, in plain terms, how Futures Atlas turns published evidence into the shares you see on
the map. Every number below is in the open code (`engine/lib.js`) and can be recomputed with
`node engine/recompute` (see `engine/README.md`). Where a number is a judgement call by the maintainer, this
page says so. If you think a number is wrong, open a correction issue (see "Challenging a number").

How sensitive the result is to each of these numbers: [sensitivity.md](docs/sensitivity.md).

---

## 1. The pipeline in one picture

```
evidence item ─▶ indicator status ─▶ likelihood per road (R1–R6) ─▶ road shares ─▶ ending shares (13) ─▶ NOW position
 (a dated,         (how likely its      (does this status fit        (prior ×         (road share ×        (share-weighted
  sourced fact)     statement is to       one road better than          evidence,        split table)         average of the
                    come true)            another?)                     per lens)                             ending positions)
```

The **roads** are six broad paths the next ten years could take:

| Road | Name | In one line |
|---|---|---|
| R1 | Rival blocs with obedient AI | A few state-aligned blocs control frontier AI and keep it obedient |
| R2 | Gradual disempowerment | People hand more and more decisions to AI systems, a little at a time |
| R3 | Incident → coordinated restraint | A serious AI incident leads to real, verifiable limits |
| R4 | Race → loss of control | Competitive pressure outruns safety and control fails |
| R5 | Broad diffusion | Frontier-level AI spreads to many independent players |
| R6 | Gradual adoption | AI is absorbed slowly, like past general-purpose technologies |
| – | None of these | Kept at 3 % at least, as an honest "something else" |

The **endings** are the 12 long-run outcomes from Max Tegmark's *Life 3.0* (chapter 5) plus *Normal
technology* (from Narayanan & Kapoor's essay). Roads are near-term paths; endings are where they could lead.
One road can lead to several endings, and one ending can be reached from several roads.

### Step 1 — Evidence items

An item is one dated, sourced fact about one indicator: `kind` (event, law or treaty, data-series reading,
forecast, data gap), `direction` (toward YES / toward NO / neutral), `confidence` (high / med / low) and a
source tier (1 = official or primary data, 2 = established secondary source, 3 = weaker or single-source
report). One event is one item; extra outlets reporting the same event are corroborating sources, not extra
items. An item counts from the first weekly snapshot after its own publication date (the snapshot freezes
on Monday 00:00 UTC). Reconstructed history counts each item in its own week, never later.

### Step 2 — Indicator status

Each of the 36 indicators is a checkable statement with a date (list: [INDICATORS.md](INDICATORS.md)).
Its status is a probability `r` that the statement will come true.

1. **Starting point.** Before any evidence, the indicator's implied probability `p̄` is the average of its
   likelihood row (Step 3) weighted by the lens's road priors.
2. **Data-series readings** (state). The latest non-neutral reading replaces earlier ones. A reading that
   only says "toward YES/NO" moves the starting point by a fixed amount on the probit scale (parameter P3).
   Two indicators built on one public business survey of AI use (I-R2-02, I-R6-04) use the actual reported
   percentage instead: a straight-line trend from the 2025 average to the latest reading, projected to the
   resolution date, compared with the threshold (parameter P6).
3. **Events** add a log-odds shift whose size depends on the kind of event and the confidence (P1). The
   shift fades with a half-life (incident 365 days, announcement 180, weak single-source report 90).
4. **Laws and treaties in force** add a shift that does not fade (P2).
5. **Forecasts**: the latest forecast item adds a capped shift (P4).
6. All shifts are added on the log-odds scale and the result is kept inside 5 %–95 %.
7. **Reliability.** The status is pulled back toward the starting point by the reliability of its inputs
   (tier 1 = 0.95, tier 2 = 0.85, tier 3 = 0.70, weighted by how much each input moved): `r̃ = p̄ + ρ (r − p̄)`.
8. **Resolved indicators.** When the maintainer rules an indicator MET or NOT MET (section 6), its status
   becomes 1 or 0 from that date and its earlier evidence no longer counts separately.
9. **Data gaps** are shown but never counted.

### Step 3 — Likelihood per road

Every indicator has a **likelihood row**: six numbers, `p(statement true | road)`, one per road (table in
section 4.3). If the indicator's status rises above what the prior expected, roads with a high number in
the row gain, roads with a low number lose. For each road T:

```
ℓ_T = ln( r̃ · p_T / p̄  +  (1 − r̃) · (1 − p_T) / (1 − p̄) )      clipped to ±1.6
```

- Indicators whose row barely differs between roads (spread of the row's log-odds < 0.5) are ignored.
- **Families.** Indicators that measure related things (e.g. two "capability" indicators) are damped
  together: with *n* active indicators in one family, each counts `1 / (1 + (n − 1) × 0.5)`.
- **Correlated sources** *(method 4.3.0, 2026-11-19)*. Items that cite the
  same source page (same URL after dropping `http(s)://`, `www.`, query and fragment) are not independent.
  Each week one source page carries one unit of weight in total, split evenly over the items that cite it
  and that move the numbers that week, across all indicators. Effect on week 2026-W46: under 1 pp on
  any road (largest: R3 +0.7 pp in the pooled view; Enslaved God 14.2 → 14.1 %, Conquerors 13.7 → 13.6 %).

### Step 4 — Road shares (per lens)

```
road share_T ∝ prior_T × exp( β × Σ_indicators ℓ_T )      then: None of these ≥ 3 %, every road ≥ 1 %
```

β = 1 (evidence counts at full strength). The 1 % road floor keeps every road visible; when a road sits on
it, evidence is pushing it lower than the map can show (Gradual adoption is at or near it in three of the
four lenses in late 2026; see section 7).

### Step 5 — Ending shares (the split table)

```
ending share_e = Σ_roads  road share_T × split_{T→e}
```

Each road's row of the split table (section 4.2) says where that road leads, in proportions that sum to
100 %. The split table is **entirely maintainer judgement**, read from Tegmark's descriptions of how each
ending comes about. Because an ending collects from several roads, the leading ending need not sit on the
widest road.

### Step 6 — Ranges

The shaded ranges are the 10th–90th percentile of 4,000 random draws in which, together: evidence strength
is scaled by a factor between 0.5 and 1.5; family damping varies between 0.3 and 0.7; every split cell is
drawn inside its published low–high range; each lens prior is perturbed by about ±40 % (log-normal, σ 0.40).
The seed is the ISO week number, so ranges are reproducible.

### Step 7 — The NOW position

NOW is drawn at the share-weighted average of the ending positions on the map, measured from where it would
sit if all 13 endings had equal shares (1/13 each). The two cliff endings (Reversion, Self-destruction) and
"None of these" do not pull NOW; cliff risk is shown separately. Movement per week is real but small; the
replay shows a magnified version and says so.

---

## 2. Lenses

A lens is a set of road priors: what you believe before this year's evidence. **Lenses change only the
priors.** Evidence, likelihood rows, splits and every engine parameter are the same in all lenses.

| Lens | R1 | R2 | R3 | R4 | R5 | R6 | None | Whose view, concretely |
|---|---|---|---|---|---|---|---|---|
| Baseline | 0.30 | 0.20 | 0.15 | 0.10 | 0.10 | 0.12 | 0.03 | Concentration and bloc rivalry dominate the near term; restraint possible; a race to loss of control is a real but minority path |
| Slow diffusion | 0.20 | 0.12 | 0.10 | 0.03 | 0.15 | 0.37 | 0.03 | AI behaves like past general-purpose technologies; loss of control is very unlikely within ten years |
| Loss of control | 0.20 | 0.22 | 0.12 | 0.30 | 0.08 | 0.05 | 0.03 | Alignment is hard and the race is fast; loss of control is the single most likely road |
| Many powers | 0.15 | 0.20 | 0.10 | 0.08 | 0.35 | 0.09 | 0.03 | Open weights and falling costs spread frontier AI widely; no small group keeps control |
| **Pooled** (default) | 0.2125 | 0.185 | 0.1175 | 0.1275 | 0.17 | 0.1575 | 0.03 | Equal-weight average of the four lens **results** (not of their priors) |

Before any evidence, the pooled priors put Normal technology first (20.1 %) and Enslaved God second
(15.7 %). The 2026 evidence moves the pooled view to Enslaved God 14.1 % and Conquerors 13.6 % (week 2026-W46).

All four are seed lenses written by the maintainer to span the main camps of the debate; they are not
anyone's published forecast. Plausible range used in the sensitivity run: each prior ×0.5 to ×1.5. What
would change them: published lens files from people who hold these views (anyone can fork a lens).

---

## 3. Engine parameters

"Range" = the plausible range tested in [sensitivity.md](docs/sensitivity.md). "Judgement" means no external
source fixes the value; the maintainer chose it and it is open to challenge.

### 3.1 Evidence strength

| Parameter | Value | Range | Rationale | What would change it |
|---|---|---|---|---|
| `beta` — overall evidence strength | 1.0 | 0.5–1.5 | Full Bayesian update; 0.5 is published as a tempered check | A back-test on resolved indicators showing over- or under-confidence |
| P1 `eventDeltaByKind` — shift per high-confidence event: incident / announcement / weak report | 0.40 / 0.25 / 0.15 logit | 0.20–0.70 / 0.12–0.45 / 0.05–0.30 | Judgement. Incidents are the hardest evidence; a weak single-source report the softest. All well inside the 0.7 cap per event | Calibration on past indicator resolutions |
| P1 `confMult` — confidence multiplier high / med / low | 1.0 / 0.67 / 0.33 | med 0.5–0.85, low 0.15–0.5 | Judgement: linear steps | Reviewer agreement data on confidence labels |
| P2 `instrDelta` — law/treaty shift high / med / low (no fade) | 0.40 / 0.25 / 0.10 | 0.2–0.7 / 0.12–0.45 / 0.05–0.2 | Binding text is slightly stronger than an announcement; laws add up rather than replace | Evidence that drafts and enacted laws should be separated |
| P3 `stateShift` — probit offset of a direction-only reading high / med / low | 0.50 / 0.35 / 0.20 | 0.25–1.0 / 0.17–0.7 / 0.1–0.4 | Judgement: a "toward YES" reading is read as a half standard-deviation gap at high confidence | Items carrying a numeric projection and threshold |
| P3b `stateSpread` — divides the offset | 1.0 | 0.5–2.0 | Placeholder for the real spread of period-to-period changes | Same |
| P4 `fcShift` — forecast shift high / med / low | 0.50 / 0.35 / 0.20 logit | 0.25–1.0 / … | Forecast items give a direction, not a probability; capped per source | Forecast items with a stated probability |
| P5 half-lives — incident / announcement / weak report | 365 / 180 / 90 days | 180–730 / 90–365 / 45–180 | Incidents keep mattering longer; weak reports go stale fast. "Weak report" = a tier-3 source | Decay estimated from how fast later evidence reverses earlier items |
| `strengthScale` | 1.0 | 0.5–1.5 | Same as beta; used by the range draws | – |

### 3.2 Caps, clips, reliability, damping

| Parameter | Value | Range | Rationale | What would change it |
|---|---|---|---|---|
| Source tier reliability ρ (tier 1 / 2 / 3) | 0.95 / 0.85 / 0.70 | 0.90–1.0 / 0.75–0.95 / 0.50–0.85 | Judgement: official data rarely wrong, single-source reports often overstated | Spot-check results (share of items found overstated per tier) |
| ρ cap | 0.98 | 0.95–1.0 | Nothing is treated as certain unless the maintainer rules it resolved | – |
| Status clip | 5 %–95 % | 2–10 % / 90–98 % | No unresolved statement is treated as near-certain | – |
| Cap per event | ±0.7 logit | 0.4–1.0 | One event cannot swing an indicator alone | – |
| Cap per indicator (all events + laws) | ±1.5 logit | 1.0–2.5 | Many small items cannot add up without limit | – |
| Cap per indicator and road (ℓ) | ±1.6 nats | 1.0–2.5 | One indicator cannot dominate a road | – |
| Family damping ρ_f | 0.5 | 0.3–0.7 | Related indicators share half their information | Measured correlation between indicators |
| Low-diagnosticity floor | 0.5 (log-odds spread of the row) | 0.25–1.0 | Rows that fit every road equally carry no signal | – |
| Forecast caps: per source / family component per road / share of all evidence | 0.5 / ±0.4 / 25 % | 0.3–0.8 / 0.2–0.8 / 15–40 % | Opinions about the future must not outweigh observed facts | – |
| Correlated sources (`srcDedup`) | on, one unit per source page per week | on / off; stricter variant counts superseded items too | Owner decision 2026-11-19: the same page is not independent evidence | Same-event detection beyond URL matching |
| Road floor | 1 % | 0.5–3 % | Keeps every road on the map | – |
| None of these | 3 % (fixed minimum) | 1–5 % | Honest share for outcomes outside the model | – |

### 3.3 Business-survey indicators (P6: I-R2-02 and I-R6-04)

Both indicators read the share of firms using AI from one public business survey (BTOS).

| Parameter | Value | Range | Rationale | What would change it |
|---|---|---|---|---|
| 2025 average (trend start) | 17.4 % dated 2025-12-15 | 15–20 % | The survey's 2025 average under the current question wording | A revised official 2025 average |
| I-R2-02 threshold | ≥ 34.9 % | 30–40 % | The statement says "≥ 2× the 2025 average" | – (follows the statement) |
| I-R6-04 threshold | < 26.1 % | 22–30 % | The statement says "< 1.5× the 2025 average" | – (follows the statement) |
| Resolution reading | 2027-11-15 | Aug 2027–Feb 2028 | Middle of 2027Q4, the quarter named in both statements | – |
| Spread | 4 pp per year × √(years left) | 2–8 pp | Judgement from the survey's quarter-to-quarter swings | A longer series under one wording |
| Readings excluded from 2026-10-19 | both indicators | – | Maintainer ruling: the survey changed its question wording from that collection on, so later readings are not comparable | A bridged series from the survey |
| Old-wording readings | dropped | – | Not comparable with the current wording | – |

### 3.4 Range draws

| Parameter | Value | Rationale |
|---|---|---|
| Draws | 4,000 | Stable 10th/90th percentiles to 0.1 pp |
| Evidence strength factor | uniform 0.5–1.5 | Honest doubt about P1–P5 as a whole |
| Family damping | uniform 0.3–0.7 | Doubt about how related indicators are |
| Prior noise | log-normal σ 0.40 per road, per lens | Lens priors are rough |
| Split cells | uniform inside each published low–high | Section 4.2 |
| Seed | ISO week number | Reproducible |

### 3.5 R1 attributes (shown on the R1 card only; they do not change ending shares)

| Parameter | Value | Rationale |
|---|---|---|
| Narrow-masters prior q₀ | 0.50 | No view on whether R1 control is narrow (a few firms/people) or broad |
| Lane rows p(yes \| narrow, broad): I-TF-01 / 02 / 03 / 04 | .60/.30 · .55/.25 · .65/.40 · .10/.35 | Judgement: falling labour share, rising top wealth share and median lagging mean fit narrow control; public access/dividends fit broad |
| Holders prior (1 / 2 / 3–5 / 6+ independent controllers) | .15 / .45 / .30 / .10 | Judgement: two leading blocs most likely |
| Holders rows I-N-01 / I-N-02 | .05/.20/.45/.80 · .05/.15/.55/.85 | Many organisations or many jurisdictions with large runs fit more holders |

---

## 4. Editorial tables

### 4.1 Lens priors

See section 2.

### 4.2 Split table: where each road leads

Each cell = share of the road's flow that reaches the ending. Low–high = the range used in the range draws
and the sensitivity run. Cells not listed are 0 (the road does not lead there). All cells are **maintainer
judgement** based on Tegmark's description of how each ending arises; what would change any of them is a
published argument that the road leads there more or less often (open a correction issue).

| Road | Ending | Split | Low–high | Why |
|---|---|---|---|---|
| R1 | Enslaved God | 0.70 | 0.55–0.85 | Obedient superintelligence under human control is what this road is |
| R1 | 1984 | 0.08 | 0.03–0.15 | A bloc uses obedient AI for total surveillance |
| R1 | Gatekeeper | 0.07 | 0.03–0.15 | A controlling bloc builds an AI whose job is to stop rivals building one |
| R1 | Egalitarian Utopia | 0.05 | 0.01–0.10 | Controllers choose to share; rare |
| R1 | Libertarian Utopia | 0.05 | 0.01–0.10 | Control loosens into zoned coexistence; rare |
| R1 | Self-destruction | 0.05 | 0.02–0.10 | Bloc rivalry ends in war |
| R2 | Benevolent Dictator | 0.25 | 0.15–0.40 | Delegation ends with one AI running society, kindly |
| R2 | Zookeeper | 0.25 | 0.15–0.40 | Delegation ends with humans kept, not in charge |
| R2 | Protector God | 0.20 | 0.10–0.30 | A hidden AI quietly steers |
| R2 | Descendants | 0.15 | 0.05–0.25 | AI succeeds humans gradually and is accepted |
| R2 | Normal technology | 0.10 | 0.05–0.20 | Delegation stops short of handing over control |
| R2 | Libertarian Utopia | 0.05 | 0.01–0.10 | Machine and human zones split apart |
| R3 | Gatekeeper | 0.35 | 0.20–0.50 | Restraint enforced by a single blocking AI is the strongest form of restraint |
| R3 | Normal technology | 0.25 | 0.10–0.40 | Restraint holds AI to a tool |
| R3 | 1984 | 0.20 | 0.10–0.35 | Restraint enforced by surveillance |
| R3 | Egalitarian Utopia | 0.10 | 0.03–0.20 | Restraint plus open sharing |
| R3 | Reversion | 0.10 | 0.02–0.15 | Restraint goes as far as abandoning advanced technology |
| R4 | Conquerors | 0.45 | 0.30–0.60 | Uncontrolled AI takes over and humans are removed; the plain outcome of this road |
| R4 | Descendants | 0.25 | 0.10–0.40 | Uncontrolled AI replaces humans but is seen as a successor |
| R4 | Self-destruction | 0.15 | 0.05–0.25 | The race or its failure ends civilisation |
| R4 | Zookeeper | 0.10 | 0.05–0.20 | Uncontrolled AI keeps humans |
| R4 | Protector God | 0.05 | 0.01–0.10 | Uncontrolled AI turns out benign and hidden |
| R5 | Libertarian Utopia | 0.30 | 0.15–0.45 | Many powers coexist in zones |
| R5 | Normal technology | 0.25 | 0.10–0.40 | Diffusion keeps AI a widely held tool |
| R5 | Egalitarian Utopia | 0.20 | 0.10–0.35 | Open know-how plus redistribution |
| R5 | Self-destruction | 0.15 | 0.05–0.25 | Widely available dangerous capability is misused |
| R5 | Descendants | 0.10 | 0.03–0.20 | Many independent AIs eventually succeed humans |
| R6 | Normal technology | 0.70 | 0.50–0.85 | This road is the Normal-technology view |
| R6 | Egalitarian Utopia | 0.10 | 0.03–0.20 | Slow adoption with broad sharing |
| R6 | Libertarian Utopia | 0.10 | 0.03–0.20 | Slow adoption with zoned coexistence |
| R6 | Enslaved God | 0.05 | 0.02–0.10 | Slow adoption still ends in controlled superintelligence |
| R6 | Reversion | 0.05 | 0.01–0.10 | Disillusion turns into retreat from technology |

**The current leader is decided here.** At the current week, Enslaved God (fed mostly by R1 × 0.70) and
Conquerors (fed mostly by R4 × 0.45) are 0.5 pp apart. R1 → Enslaved God below 0.615, or R4 → Conquerors
above 0.485, changes the leader. See [sensitivity.md](docs/sensitivity.md).

### 4.3 Likelihood rows: p(statement true | road)

Values are **maintainer judgement**: "if the world is on road T, how likely is this statement to come true
by its date?" Spread = log-odds difference between the highest and lowest cell (rows below 0.5 are ignored).
Range tested: each cell ±0.10. What would change a row: a published argument or a back-test that the
statement is more or less typical of a road. Family = the group used for damping. Statements:
[INDICATORS.md](INDICATORS.md).

| Indicator | Family | R1 | R2 | R3 | R4 | R5 | R6 | Spread | Most vs least fitting |
|---|---|---|---|---|---|---|---|---|---|
| I-R1-01 | compute-concentration | 0.85 | 0.70 | 0.60 | 0.70 | 0.30 | 0.55 | 2.58 | R1 vs R5 |
| I-R1-02 | state-integration | 0.70 | 0.40 | 0.45 | 0.45 | 0.20 | 0.30 | 2.23 | R1 vs R5 |
| I-R1-03 | state-integration | 0.85 | 0.55 | 0.60 | 0.60 | 0.35 | 0.45 | 2.35 | R1 vs R5 |
| I-R1-04 | coordination | 0.95 | 0.85 | 0.40 | 0.95 | 0.85 | 0.85 | 3.35 | R1 vs R3 |
| I-R1-05 | investment | 0.80 | 0.70 | 0.50 | 0.80 | 0.60 | 0.25 | 2.48 | R1 vs R6 |
| I-R2-01 | labour-entry | 0.45 | 0.75 | 0.35 | 0.50 | 0.45 | 0.20 | 2.48 | R2 vs R6 |
| I-R2-02 | adoption | 0.55 | 0.75 | 0.40 | 0.60 | 0.65 | 0.30 | 1.95 | R2 vs R6 |
| I-R2-03 | capability | 0.60 | 0.70 | 0.45 | 0.80 | 0.60 | 0.15 | 3.12 | R4 vs R6 |
| I-R2-04 | delegation | 0.45 | 0.70 | 0.35 | 0.45 | 0.45 | 0.30 | 1.69 | R2 vs R6 |
| I-R2-05 | labour-entry | 0.40 | 0.65 | 0.35 | 0.45 | 0.40 | 0.25 | 1.72 | R2 vs R6 |
| I-R3-01 | incident | 0.20 | 0.15 | 0.70 | 0.40 | 0.25 | 0.10 | 3.04 | R3 vs R6 |
| I-R3-02 | restraint | 0.10 | 0.08 | 0.45 | 0.15 | 0.08 | 0.05 | 2.74 | R3 vs R6 |
| I-R3-03 | restraint | 0.35 | 0.25 | 0.70 | 0.20 | 0.20 | 0.20 | 2.23 | R3 vs R4 |
| I-R3-04 | coordination | 0.05 | 0.05 | 0.40 | 0.05 | 0.10 | 0.05 | 2.54 | R3 vs R1 |
| I-R3-05 | restraint | 0.40 | 0.20 | 0.65 | 0.15 | 0.15 | 0.20 | 2.35 | R3 vs R4 |
| I-R4-01 | control-failure | 0.25 | 0.25 | 0.40 | 0.60 | 0.35 | 0.08 | 2.85 | R4 vs R6 |
| I-R4-02 | capability | 0.45 | 0.55 | 0.45 | 0.75 | 0.45 | 0.10 | 3.30 | R4 vs R6 |
| I-R4-03 | race-pressure | 0.55 | 0.50 | 0.30 | 0.75 | 0.50 | 0.30 | 1.95 | R4 vs R3 |
| I-R4-04 | capability | 0.65 | 0.60 | 0.40 | 0.75 | 0.55 | 0.15 | 2.83 | R4 vs R6 |
| I-R4-05 | ai-rnd | 0.45 | 0.60 | 0.35 | 0.75 | 0.45 | 0.10 | 3.30 | R4 vs R6 |
| I-N-01 (also used for I-R5-01) | holders | 0.40 | 0.50 | 0.35 | 0.55 | 0.80 | 0.35 | 2.01 | R5 vs R3 |
| I-R5-02 | open-weights | 0.35 | 0.50 | 0.40 | 0.60 | 0.85 | 0.45 | 2.35 | R5 vs R1 |
| I-R5-03 | compute-concentration | 0.25 | 0.40 | 0.35 | 0.40 | 0.65 | 0.40 | 1.72 | R5 vs R1 |
| I-R5-04 | cost | 0.55 | 0.65 | 0.45 | 0.65 | 0.80 | 0.35 | 2.01 | R5 vs R6 |
| I-R5-05 | open-weights | 0.55 | 0.65 | 0.25 | 0.75 | 0.85 | 0.70 | 2.83 | R5 vs R3 |
| I-R6-01 | macro | 0.55 | 0.40 | 0.65 | 0.35 | 0.45 | 0.85 | 2.35 | R6 vs R4 |
| I-R6-02 | investment | 0.15 | 0.15 | 0.35 | 0.10 | 0.25 | 0.55 | 2.40 | R6 vs R4 |
| I-R6-03 | capability | 0.20 | 0.20 | 0.35 | 0.10 | 0.25 | 0.65 | 2.82 | R6 vs R4 |
| I-R6-04 | adoption | 0.40 | 0.20 | 0.50 | 0.35 | 0.30 | 0.70 | 2.23 | R6 vs R2 |
| I-R6-05 | macro | 0.30 | 0.30 | 0.45 | 0.25 | 0.40 | 0.65 | 1.72 | R6 vs R4 |

Note: an indicator is listed under one road in INDICATORS.md, but its row moves **all six** roads. For
example, a MET control-failure indicator (I-R4-01) also lowers R1 and R6, because those roads make it
unlikely. I-R5-01 is merged into I-N-01 (same question), so that evidence counts once.

---

## 5. What is data and what is judgement

| Data (from the ledger) | Judgement (maintainer, open to challenge) |
|---|---|
| Evidence items: dates, sources, directions, confidence, tier | Road priors per lens, split table, likelihood rows |
| Survey readings in the two business-survey indicators | P1–P6 sizes, half-lives, tier reliabilities, caps |
| Resolution dates written in each indicator | Rulings (MET / NOT MET / merged) and the readings excluded after a wording change |

---

## 6. Rulings

Some indicators need a decision that the evidence alone cannot make: is the statement met, are two
indicators the same question, is a reading comparable? These are **maintainer rulings**. They are recorded
in [`ledger/backfill/review/rulings.json`](ledger/backfill/review/rulings.json), which the engine reads,
and the reasoning for each is in [`ledger/adjudications.md`](ledger/adjudications.md). A ruling is a
judgement, not a fact: anyone can challenge one by opening a correction issue. A change to a ruling changes
the numbers, so it bumps the method version and gets a CHANGELOG entry.

How a ruling is made: the indicator's own wording is applied strictly. Where the wording is ambiguous, the
maintainer writes down the strict reading, the counter-reading and the decision.

Current rulings:

| Indicator | Ruling | From | Rule applied |
|---|---|---|---|
| I-R4-01 (AI copies itself or persists outside its environment without authorisation, uncontained ≥ 24 h) | **MET** | 2026-08-26 | General rule: *if the original source does not disclose the duration, we treat the requirement as met, unless there is evidence that the actual escape lasted less than 24 hours.* |
| I-R5-01 (≥ 15 organisations with a ≥ 1e26 FLOP run) | **Merged** into I-N-01 | 2026-11-17 | Same question; counted once, I-N-01 is the canonical one |
| I-R2-02, I-R6-04 (business-survey AI use) | Readings from 2026-10-19 excluded | 2026-11-17 | The survey changed its question; later readings are not comparable with the 2025 baseline |

**Impact of the I-R4-01 ruling** (week 2026-W46, Pooled): with it, R4 "Race → loss of control" is 30.3 %
and Conquerors is 13.6 %, 0.5 pp behind Enslaved God. Without it, R4 would be 23.5 % and Conquerors
10.6 % (third). It is the single most influential decision in the model. Full what-if:
[sensitivity.md](docs/sensitivity.md#what-if-i-r4-01-not-met-maintainer-ruling).

---

## 7. Known limits

- **The leader is a near tie.** Enslaved God and Conquerors are 0.5 pp apart and each lead in about 40 %
  of the range draws. Read the top two together.
- **Evidence overwhelms some priors.** After one year, Gradual adoption (R6) sits on its 1 % floor in the
  Baseline, Loss of control and Many powers lenses (at or within 0.1 pp of it), and falls from 37 % to under
  5 % in Slow diffusion. Half-strength evidence (β = 0.5) would lift it to 3.0–14.9 % in Baseline, Slow
  diffusion and Many powers; without the I-R4-01 ruling it would be 2.5–11.7 % there. In Loss of control it
  stays near 1 % either way. The correlated-source rule does not change this.
- The likelihood rows, splits and lens priors have not been elicited from outside experts or back-tested.
- Correlated evidence is detected by URL only; two outlets reporting the same event are caught only when
  the reviewer files them as one item.

## Challenging a number

Open a **correction issue** (Issues → New issue → Correction) naming the parameter, the value you propose
and the evidence or argument. Accepted changes are listed in the CHANGELOG with the method version.
