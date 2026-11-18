# Labels

**Who applies labels:** the maintainer's review agent (it runs with the maintainer's token,
outside GitHub Actions), plus the correction form, which sets its own labels. CI stays
read-only: `validate-evidence.yml` has `permissions: contents: read`, runs on `pull_request`
(never `pull_request_target`) and never labels, comments, edits or merges. Contributors do not
need to label anything.

Create the labels once (Issues › Labels) before the templates go live; the correction form
fails to label if they do not exist. Colours are muted to match the site.

## Required

| Label | Colour | Applied by | Meaning |
|---|---|---|---|
| `evidence` | `#C9A45C` | review agent (every PR touching `ledger/inbox/`) | Evidence pull request |
| `needs-review` | `#8A94A6` | correction form; review agent on new evidence PRs | Waiting for review (PR open = comment window, at most 7 days) |
| `accepted` | `#5E8C7A` | review agent, when the maintainer merges | Merged = accepted; counts from the next weekly build in its own publication week |
| `rejected` | `#7A6A6A` | review agent, when the maintainer closes | Closed with a written reason |
| `correction` | `#6F8FB0` | correction form | Report about something already merged, on the site or in the ledger |
| `vision` | `#9B88B5` | review agent / maintainer | Visions housekeeping (Discussions handle the votes themselves) |

## Optional

| Label | Colour | Meaning |
|---|---|---|
| `needs-info` | `#B0A070` | Question back to the submitter |
| `duplicate` | `#6A6A6A` | Same event already in the ledger or an earlier PR; merged in as a corroborating source |
| `history` | `#7F8C8D` | Published before the last 4 weeks; reviewed after newer items |
| `good first issue` | `#7057ff` | GitHub default |

The `gh label create` commands are in `PUSH_PLAN.md` (draft only, not run).

Discussions: enable Discussions and create the category **Visions** (format: Announcement, so
only maintainers start the 13 ending threads), titled `Visions · <Ending name>`; see
[docs/VISIONS.md](docs/VISIONS.md).
