<!--
Thanks for contributing. Evidence PRs: ONE item per PR is preferred (max 5 related items).
Agents: follow AGENTS.md and keep every box below truthful; reviewers check them.
This PR is public: do not write raw country names in the title, body or commits (use bloc
labels or neutral descriptions) - PR history keeps them even after the file is rewritten.
-->

## What this PR does

- [ ] Adds evidence item(s) under `ledger/inbox/`
- [ ] Adds a corroborating source to an existing item's `sources` (same event)
- [ ] Code / looks / docs change (describe below; skip the evidence checklist)

Item id(s): `EV-YYYYMMDD-slug`

## Evidence checklist

- [ ] One item per file, file name = `<id>.json`, placed directly in `ledger/inbox/`
- [ ] `node tools/validate_evidence.mjs ledger/inbox/<id>.json` passes locally (CI runs it too)
- [ ] I opened the source myself (or checked the agent's reading of it) and the summary says nothing the source does not say
- [ ] `published` is the source's own publication / event date, not today's date
- [ ] Primary source linked where one exists; paywalled sources have `"access": "paywall"` and an `access_note`
- [ ] Summary is neutral: no opinion, no own forecast; bloc labels or neutral descriptions instead of country names
- [ ] `counterpoint` is a real counter-argument (or `none known`)
- [ ] I searched the ledger, open PRs and the Evidence page for the same event (one event = one item; extra sources go in that item's `sources`)
- [ ] Conflict of interest disclosed by category in `coi` if relevant (no employer names)
- [ ] If an AI agent drafted this, it is named in `agent`; I take responsibility as `submitted_by`
- [ ] I release the summary, detail, reasoning and counterpoint under CC BY 4.0

## I understand

- [ ] This open PR is the public comment window, **at most 7 days**. The maintainer's review agent posts a verdict, may push wording fixes and applies labels; the maintainer merges after review (possibly earlier) or closes with a reason. No auto-merge.
- [ ] Merge = accepted: the item counts from the next weekly build, only in the **week of its own publication date**, never as new evidence for the current week.
- [ ] After the merge there is no further window; objections go through the Correction form.
- [ ] Unmerged items never move the map. Visions votes never move the map either.

## Notes for the reviewer (optional)

<!-- Paywall details, page or table number, related ledger items, anything uncertain. -->
