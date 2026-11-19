# AGENTS.md — instructions for AI agents

You are helping a person add **evidence** to Futures Atlas, an open map of where AI may be
heading over the next ten years. The person you work for is responsible for the submission
and is named in `submitted_by`. Follow these rules exactly; reviewers check every one.

**Scope:** you add JSON files under `ledger/inbox/` and open a pull request. Do not edit the
map, the engine, `ledger/reviewed/`, `ledger/backfill/`, `ledger/adjudications.md`, the
schema or the neutrality lists in an evidence PR.

## 1. Find a source

1. Read [`INDICATORS.md`](INDICATORS.md). Pick an indicator whose statement the fact bears on,
   or a road (R1-R6) if no indicator fits. Each indicator names the sources it resolves on
   (Epoch AI, official gazettes, statistics agencies, METR, system cards, ...).
2. Prefer the **primary source**: the paper, filing, gazette, system card, dataset release or
   official statement, not coverage of it. Use news only when no primary source exists.
3. Open the source and read the part you summarise. Never summarise from a search snippet,
   a headline or another model's memory. If you cannot open it, stop and tell the person.
4. **One event = one evidence item.** Search `ledger/` and open PRs for the URL and the event
   (`grep -r "<domain or key phrase>" ledger/`; `gh pr list --repo GodenYao/futures-atlas --search "<phrase>"`).
   If the event is already there, do not create a second item: propose your URL as an extra
   entry in that item's `sources` list (a PR editing that item, or a note in the open PR).
   Extra sources may raise confidence; they never add weight. If two PRs arrive for the same
   event, the first PR is primary and the later one is merged into it as a source; both people
   are credited (`contributors`). If the existing item is wrong, suggest a Correction.
5. **Date** = the source's own publication date (or the event date it reports), not today.
   Anything from 2022-11-30 onward is accepted. Newest evidence (last 4 weeks) is reviewed first.
6. Paywalls: if the source is paywalled, look for the free primary document first. If you
   still use it, set `"access": "paywall"` and say in `access_note` where a free abstract,
   copy or archive is. Hosts in `tools/neutrality/paywall_domains.txt` fail CI without this.

## 2. Fill the schema

Schema: [`ledger/schema/evidence.schema.json`](ledger/schema/evidence.schema.json).
Example: [`ledger/inbox/_examples/`](ledger/inbox/_examples/).

| Field | How to fill it |
|---|---|
| `schema_version` | `1` |
| `id` | `EV-<published as YYYYMMDD>-<slug>`; slug = 2-6 lowercase words, `a-z0-9` and `-` |
| `source_url` | the URL you actually read (canonical form: no tracking parameters, no AMP/mobile variant) |
| `archive_url` | optional; a `web.archive.org/web/...` copy if one exists (do not invent one) |
| `sources` | optional; extra corroborating sources for the SAME event: `[{"url": "...", "title": "...", "published": "YYYY-MM-DD"}]` |
| `published` | `YYYY-MM-DD`, equal to the date in the id |
| `title` | the title exactly as published |
| `summary` | 1-3 sentences, 30-600 characters: what happened, with the source's numbers and dates |
| `detail` | optional: document number, page/table, named organisations |
| `roads` | e.g. `["R4"]`; may be `[]` only if `endings` or `indicator` is set |
| `endings` | optional; only if the fact speaks to an end state directly |
| `indicator` | optional id from INDICATORS.md; omit if unsure (never guess a new id) |
| `direction` | `raises`, `lowers` or `unclear` for the road(s)/ending(s) |
| `reasoning` | one sentence, why that direction |
| `counterpoint` | the strongest reason it may not mean what it seems; `none known` is allowed but reviewers prefer a real one |
| `source_type` | `paper`, `news`, `official`, `dataset`, `company`, `other` |
| `access` | `open`, `registration`, `paywall` (+ `access_note`) |
| `language` | BCP 47 tag of the source: `en`, `zh`, `fr`, `pt-BR`, ... |
| `submitted_by` | `gh:<the person's GitHub handle>` |
| `contributors` | optional extra handles credited for the same item (`["gh:..."]`) |
| `agent` | name of the agent/tool and model that drafted it (disclosure) |
| `coi` | optional category if the person has a conflict of interest; never an employer name |
| `licence` | `CC-BY-4.0` |

Scenario-family ("road") names: R1 Rival blocs with obedient AI · R2 Gradual disempowerment ·
R3 Incident → coordinated restraint · R4 Race → loss of control · R5 Broad diffusion ·
R6 Gradual adoption (ids unchanged; family names never reuse an ending name such as
"Normal technology"). Ending names must match the schema enum exactly.

Do **not** add `kind`, `source_tier`, `confidence`, `review` or any other field: they are
reviewer-only and CI rejects them. Strength is set by reviewers, never by the submitter.

## 3. Neutrality rules

- **Describe, do not judge.** No "good"/"bad", no welfare or desirability claims, no advocacy,
  no forecast of your own. Interpretation goes only in `reasoning` and `counterpoint`.
- **Say only what the source says.** No blending in facts from other sources, no rounding
  that changes meaning, no stronger verbs than the source uses ("plans" is not "will").
- **Bloc labels or neutral descriptions, never country names.** In every text field (`title`
  excepted, which is quoted as published) write a bloc label (`Bloc A`, `Bloc B`, ...) when the
  person gives you one, otherwise a neutral description ("a top-3 compute jurisdiction",
  "a national government", "a frontier developer", "a national statistics agency"). Do not
  guess which country is which bloc. Names in `summary`, `reasoning` or `counterpoint` give a CI
  warning; the maintainer's review agent rewrites any remaining names to bloc labels before
  merge with a private mapping. Term list: `tools/neutrality/country_terms.txt`.
- **Tell the person: PR text is public.** Whatever is written in the PR (title, body, commits,
  first file version) stays in the public PR history even after the review agent rewrites it.
  Keep raw country names out of the PR title, body and commit messages too.
- **One fact per item.** Two events = two files and, ideally, two PRs.
- No personal data about private individuals.
- Ending definitions follow their sources (Tegmark, *Life 3.0*; Narayanan & Kapoor for
  Normal technology). Do not attribute mechanisms to an ending that its source does not describe.

## 4. Branch, validate, PR (gh CLI)

```sh
gh repo fork GodenYao/futures-atlas --clone && cd futures-atlas   # once
git switch -c evidence/EV-20261109-short-slug
# write ledger/inbox/EV-20261109-short-slug.json
node tools/validate_evidence.mjs ledger/inbox/EV-20261109-short-slug.json   # must say PASS
git add ledger/inbox/EV-20261109-short-slug.json
git commit -m "evidence: EV-20261109-short-slug (I-R4-02)"
git push -u origin HEAD
gh pr create --repo GodenYao/futures-atlas \
  --title "evidence: EV-20261109-short-slug" \
  --body-file .github/PULL_REQUEST_TEMPLATE.md
```

Then edit the PR body: tick only the boxes that are true and add notes for the reviewer.
One item per PR is preferred (max 5 related items). Never commit tokens or `.env` files.
If CI fails, read the annotation, fix the file, push again. Do not open a new PR for a fix.
Read warnings too (duplicates, country names) and fix what you can. Do not add labels:
the maintainer's review agent applies them.

## 5. What reviewers check

| Verdict | Meaning | Outcome |
|---|---|---|
| faithful | summary, numbers and date match the source | accept |
| overstated | summary claims more than the source | softer wording or hold |
| blended | mixes in other sources | split or rewrite |
| wrong-date | not the source's own date | fix, then accept |
| source-unreachable | dead link, no archive | hold until a working copy exists |

Also: duplicates (one event = one item), primary source preferred, neutrality, a real
counter-point, indicator fit (reviewer may reassign or mark "context only"), direction against
the indicator statement. The maintainer's review agent posts the verdict in the PR and may push
wording edits (with reasons); the maintainer decides and merges. Rejections give a reason.

## 6. Counting rule (tell the person this)

- The open PR is the public comment window: **at most 7 days**. The maintainer may merge
  earlier once review is complete and no objection is open. No auto-merge.
- **Merge = accepted.** The item counts from the next weekly build (Monday 01:00 UTC workflow
  that opens a "Weekly build Wxx" PR; live once the maintainer merges it), **only in the week of its
  own publication date**. It is never new evidence for the current week.
- There is no window after the merge: objections to a merged item go through the Correction form.
- Unmerged or rejected items never move the map.
- **Visions votes never affect shares.** They reflect online opinion only.

## 7. Corrections and Visions

- Something already merged or on the site is wrong → the Correction issue form, not a PR to
  someone else's item.
- Videos for an ending → a reply in that ending's Discussion (see [docs/VISIONS.md](docs/VISIONS.md)),
  not an evidence item.
