# Indicators

Generated from `ledger/indicators.json` by `tools/gen_indicators_md.mjs` (method v4.2). Do not edit by hand.

Each indicator is a dated, checkable statement. Evidence items name the indicator they bear on in `indicator`; omit it if unsure and a reviewer assigns one. An indicator is ruled MET only when its own wording is met (see `ledger/adjudications.md`).

## R1 · Rival blocs with obedient AI

| Id | Road | Statement |
|---|---|---|
| `I-R1-01` | R1 | >= 90% of training compute of the 10 largest known 2027 training runs belongs to organisations headquartered in the two leading jurisdictions (Epoch AI; snapshot 2028-03-31) |
| `I-R1-02` | R1 | A government in a top-3 compute jurisdiction takes equity, a golden share or a formal priority-access security partnership with a top-5 frontier developer (by 2027-12-31) |
| `I-R1-03` | R1 | >= 2 of the top-3 compute jurisdictions publish new or expanded controls on AI chips, chip tools or model weights (official gazettes; calendar 2027) |
| `I-R1-04` | R1 | No agreement between the two leading compute jurisdictions sets verifiable limits on training compute or capabilities (official readouts, treaty texts; by 2028-06-30) |
| `I-R1-05` | R1 | Combined FY2027 capex of the 5 largest AI/cloud spenders >= 1.2x FY2026 (securities filings; on FY2027 filings) |

## R2 · Gradual disempowerment

| Id | Road | Statement |
|---|---|---|
| `I-R2-01` | R2 | Relative employment index of ages 22-25 in the most AI-exposed occupation quintile falls >= 5 pts from its 2026 level (Stanford Digital Economy Lab 'Canaries' series, last 2027 release) |
| `I-R2-02` | R2 | Share of firms using AI to produce goods or services >= 2x its 2025 average (Bloc A Census Bureau BTOS, 2027Q4) |
| `I-R2-03` | R2 | Frontier 50%-success task time horizon >= 16 h (METR measurements, cross-checked against government AISI reports; by 2027-12-31) |
| `I-R2-04` | R2 | A top-10 economy legally authorises fully automated decisions (no human sign-off) in a new benefits, tax or immigration domain (official gazette; OECD.AI; by 2028-12-31) |
| `I-R2-05` | R2 | Recent-graduate unemployment minus the all-worker rate >= 2.0 pp in any 2027 quarter (NY Fed College Labor Market, 2027 quarterly) |

## R3 · Incident → coordinated restraint

| Id | Road | Statement |
|---|---|---|
| `I-R3-01` | R3 | An AI incident with >= USD 1bn damage or >= 100 deaths is officially attributed to AI (OECD AIM; government statements; by 2027-12-31) |
| `I-R3-02` | R3 | A top-5 developer publicly halts frontier training >= 30 days, citing safety (developer announcement + independent confirmation; by 2027-12-31) |
| `I-R3-03` | R3 | A top-3 compute jurisdiction has licensing or pre-approval of frontier training above a compute threshold in force (official gazette; by 2028-12-31) |
| `I-R3-04` | R3 | An international body gains inspection or compute-verification powers covering >= 2 of the top-5 compute jurisdictions (treaty text, official gazettes; by 2029-12-31) |
| `I-R3-05` | R3 | A mandatory registry of large training clusters (or chip-location tracking) operates in >= 2 of the top-3 jurisdictions (official gazettes; by 2028-12-31) |

## R4 · Race → loss of control

| Id | Road | Statement |
|---|---|---|
| `I-R4-01` | R4 | An AI system is documented to have copied itself or persisted outside its intended environment without authorisation, uncontained for >= 24 h (developer post-mortem or government report; by 2027-12-31) |
| `I-R4-02` | R4 | A developer system card or government AISI evaluation reports a model at the developer's highest published autonomy or AI-R&D risk tier (by 2027-12-31) |
| `I-R4-03` | R4 | A top-5 developer weakens or withdraws a published safety-framework commitment, documented by a text diff (framework documents, archived; calendar 2027) |
| `I-R4-04` | R4 | Largest known training run >= 5e27 FLOP (Epoch AI; by 2027-12-31) |
| `I-R4-05` | R4 | A top-5 developer reports AI systems did >= 50% of code or experiments in a frontier training project (technical report or system card; by 2028-12-31) |

## R5 · Broad diffusion

| Id | Road | Statement |
|---|---|---|
| `I-R5-01` | R5 | >= 15 distinct organisations with a >= 1e26 FLOP run (shared with I-N-01; counted once per family) (Epoch AI; 2027-12-31) *Merged with I-N-01 (counted once; I-N-01 canonical).* |
| `I-R5-02` | R5 | The best open-weight model reaches the frontier score of 6 months earlier (Epoch Capabilities Index; rolling; 2027-12-31) |
| `I-R5-03` | R5 | >= 20% of announced >100 MW AI data-centre capacity is outside the two leading jurisdictions (Epoch data-centre tracker; IEA; 2027) |
| `I-R5-04` | R5 | Price of inference at fixed capability falls >= 10x from 2026 to 2027 (Epoch / AI Index price series; 2027 annual) |
| `I-R5-05` | R5 | No top-3 compute jurisdiction bans or licenses open-weight release at the frontier tier (official gazettes; by 2028-06-30) |

## R6 · Normal technology / plateau

| Id | Road | Statement |
|---|---|---|
| `I-R6-01` | R6 | Nonfarm business labour productivity growth in 2027 < 2.5% (Bloc A BLS; annual) |
| `I-R6-02` | R6 | Combined capex of the 5 largest spenders falls year on year for 2 consecutive quarters (securities filings; by 2028-06-30) |
| `I-R6-03` | R6 | The Epoch Capabilities Index gain in 2027 is < 50% of its 2025 gain (Epoch AI; resolves 2028-01) |
| `I-R6-04` | R6 | BTOS AI-use share in 2027Q4 is < 1.5x its 2025 average (Bloc A Census BTOS; 2027Q4) |
| `I-R6-05` | R6 | Global data-centre electricity use in 2027 is below the IEA's 2025 base-case projection for 2027 (IEA; 2028 release) |

## R1 attribute · holders (how many independent controllers of frontier AI)

| Id | Road | Statement |
|---|---|---|
| `I-N-01` | R1 | >= 15 distinct organisations have a training run >= 1e26 FLOP (Epoch AI, snapshot 2027-12-31) |
| `I-N-02` | R1 | Organisations with a training run >= 1e26 FLOP are headquartered in >= 4 jurisdictions (Epoch AI, snapshot 2027-12-31) |

## R1 lane · narrow masters (technofeudal sub-risk)

| Id | Road | Statement |
|---|---|---|
| `I-TF-01` | R1 | Labour share (nonfarm business, 4-quarter average) in 2027 is >= 1 pp below 2025 (BLS Productivity & Costs, Q4 2027 release) |
| `I-TF-02` | R1 | Top-1% wealth share at 2027Q4 >= 2025Q4 + 1 pp (Federal Reserve Distributional Financial Accounts, 2027Q4 release) |
| `I-TF-03` | R1 | Median per-capita disposable income growth < mean growth in 2027 annual data (national statistics office; one indicator per leading jurisdiction) |
| `I-TF-04` | R1 | A top-3 compute jurisdiction legislates guaranteed public access to frontier AI, or an AI dividend or sovereign fund paid to citizens (official gazette, by 2028-12-31) |

36 indicators. Changing a statement is a method change (semver bump + CHANGELOG entry).
