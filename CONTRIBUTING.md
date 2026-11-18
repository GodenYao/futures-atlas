# Contributing to Futures Atlas

Futures Atlas is an open map of where AI may be heading over the next ten years. Six roads
(R1–R6) leave NOW and fan out into thirteen endings. Road widths and site shares are
recomputed every week from a **public evidence ledger** (`ledger/`), so the most useful
contribution is **one checked, public fact**.

Submitting works best on a computer. On a phone you can browse the map and share links.

| Track | Use it for | How |
|---|---|---|
| 1. Evidence (priority) | A public fact that bears on a road or an ending | Pull request adding one JSON file to `ledger/inbox/` — by hand or with an AI agent ([AGENTS.md](AGENTS.md)) |
| 2. Corrections | Wrong data, broken link, wrong date, overstated or non-neutral wording | [Correction form](https://github.com/GodenYao/futures-atlas/issues/new?template=correction.yml) |
| 3. Visions | A video that shows what one ending could look like; votes | A reply in that ending's [Visions discussion](https://github.com/GodenYao/futures-atlas/discussions/categories/visions) ([docs/VISIONS.md](docs/VISIONS.md)) |
| Other | Code fixes, looks and city models; propose a new ending (rare) | Pull request / Discussions (see below) |

## 1. Evidence by pull request

Most contributors use an AI agent: point it at [AGENTS.md](AGENTS.md) and review what it
writes before you open the PR. You are responsible for the submission.

1. **Pick** a fact and an indicator from [INDICATORS.md](INDICATORS.md) (or just a road).
   Prefer the primary source. Search `ledger/` for the same event first (see *Duplicates*).
2. **Write** `ledger/inbox/<id>.json` following
   [`ledger/schema/evidence.schema.json`](ledger/schema/evidence.schema.json). Id =
   `EV-<published YYYYMMDD>-<slug>`. Example and field list:
   [`ledger/inbox/README.md`](ledger/inbox/README.md).
3. **Check** locally: `node tools/validate_evidence.mjs ledger/inbox/<id>.json` (no install
   needed, Node 18+).
4. **Open the PR** with the checklist in the template. CI (`Validate evidence`) runs the same
   checks. Errors: schema, file name = id, dates, indicator id, paywall note. Warnings: country
   names in the summary/reasoning/counterpoint, loaded words, a source already in the ledger
   or in another file of the PR. CI is read-only: it never labels, edits or merges.
5. **Public comment window = the open PR, at most 7 days.** Anyone can comment on the PR
   while it is open. The maintainer's review agent reads the source, posts a written verdict
   (criteria below), may push wording fixes (for example country names rewritten to bloc
   labels) and applies the labels.
6. **Maintainer merges after review.** The maintainer approves and merges the PR — earlier
   than 7 days once review is complete and no objection is open, and in any case within
   7 days of opening — or closes it with label `rejected` and a reason. There is no
   auto-merge.
7. **Merge = accepted.** A merged item counts from the **next weekly build**, in the **week of
   its own publication date** (a March fact sits in March, not in this week). There is no
   further window after the merge; objections to a merged item go through the
   [Correction form](https://github.com/GodenYao/futures-atlas/issues/new?template=correction.yml).
   Items in open or closed-unmerged PRs never move the map.

Reviews prioritise the newest evidence (the last 4 weeks). History back to 2022-11-30 is
welcome and is reviewed after that. Ledger layout and the full life of an item:
[ledger/README.md](ledger/README.md).

### Duplicates: one event = one evidence item

- One event (a release, a rule, a dataset update) is **one** item. A second source for the
  same event is not a new item: it becomes a corroborating entry in the existing item's
  `sources` list. Extra sources can raise the reviewer's `confidence`; they **never add
  weight**.
- **Simultaneous submissions:** the first PR (by opening time) becomes the primary item; later
  PRs for the same event are merged into it as `sources`, and both people are credited
  (`submitted_by` + `contributors`).
- The validator warns when a source URL matches one already in the ledger or in another file
  of the same PR, after normalisation (https, no `www.`/mobile/AMP variants, no trailing
  slash, no `utm_*` or other tracking parameters).

## 2. Review criteria

The same checks used for the maintainer's history backfill apply to every submission.

| Verdict | Meaning | Outcome |
|---|---|---|
| faithful | Summary, numbers and date match the source | accept |
| overstated | Summary claims more than the source says | accept with softer wording, or hold |
| blended | Summary mixes in claims from other sources | split or rewrite, then accept |
| wrong-date | Date is not the source's publication / event date | fix the date, then accept |
| source-unreachable | Link dead and no archive copy | hold until a working copy exists |

Reviewers also set the reviewer-only fields: `kind`, `source_tier` (1 primary / official,
2 reputable secondary, 3 other), `confidence`. Strength is never set by the submitter. When an
item may settle an indicator, the ruling follows the **strict wording of the indicator
statement** and is logged in [`ledger/adjudications.md`](ledger/adjudications.md):
`MET` (with effective date), `NOT YET MET`, `UNRESOLVED` or `MERGED`.

**Who reviews.** During bootstrap the maintainer is the sole reviewer, assisted by a review
agent that drafts verdicts; the maintainer makes every merge decision. This is disclosed on the
site. Review opens to a wider pool as contributors join. Credit is by GitHub handle
(reputation only — no money, tokens or credits).

## 3. Neutrality rules

- **Describe, do not judge.** What happened, with numbers and dates. No "good" or "bad"
  endings, no welfare ratings, no advocacy, no own forecast.
- **One fact, one item.** Interpretation goes only in `reasoning` and `counterpoint`.
- **Blocs, not countries.** The public ledger and the map show bloc labels (`Bloc A`,
  `Bloc B`, `Bloc C`, ...), never country names. Write a bloc label if you know it, or a
  neutral description ("a top-3 compute jurisdiction", "a national government"). If you write
  a country name, CI warns and the review agent rewrites it to the bloc label before merge,
  using a mapping the maintainer keeps private. **Your PR text is public:** a name you write
  stays visible in the PR history even after the file is rewritten.
- **No flag colours and no red/green verdict colours** in visual contributions.
- **Endings follow their sources:** Tegmark, *Life 3.0* (2017) for twelve endings; Narayanan &
  Kapoor, "AI as Normal Technology" (2025) for Normal technology.
- Conflicts of interest: disclose by industry category in `coi`; no employer names.
- AI-drafted items name the agent in `agent`.

## 4. Corrections

Use the [Correction form](https://github.com/GodenYao/futures-atlas/issues/new?template=correction.yml)
for anything already merged, on the site or in the ledger. Corrections are reviewed like
evidence. If one changes a counted item, the change and its reason are logged in the CHANGELOG
and the affected weeks are recomputed in the next build (git history shows what changed).

## 5. Visions

One discussion per ending in the **Visions** category; one reply per vision in a fixed format;
👍 on a reply = one vote; the weekly build shows the top 3 per ending. Rules:
[docs/VISIONS.md](docs/VISIONS.md). **Votes reflect online opinion only and never change the
map.**

## 6. Code, looks, models, new endings

1. Open an issue or Discussion first for anything larger than a small fix.
2. Fork, branch, one change per PR; say what changed and how you tested it; before/after
   screenshots for visual changes.
3. Performance budget: smooth on mid-range laptops and phones (first load ≤ ~3 MB,
   ~400 draw calls on desktop). Report what you measured.
4. Assets: CC0 or CC BY only, credited in `ASSETS.md`.
5. Keep the UI wording rules (signed pp for changes, `NOW` uppercase, "ending" = scenario,
   "site" = its place on the map).
6. **New endings** are rare and strictly reviewed (distinct end state, position on both map
   axes, a road that leads there, ≥ 2 published sources, a description of what you would see).
   Start in Discussions.

## Labels

Labels are applied by the maintainer's review agent (and by the correction form), not by CI:
fork PRs only get a read-only token, and the workflow never runs PR code with write access.
List and meanings: [LABELS.md](LABELS.md). Code of conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Licence

By contributing you agree that code is licensed Apache-2.0 and ledger text, summaries and
figures CC BY 4.0 (see [LICENSE](LICENSE)). Embedded videos belong to their creators.

Personal project, not affiliated with or endorsed by any employer.
