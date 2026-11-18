# Visions — community videos per ending, voted in GitHub Discussions

Each ending on the map has a **Visions** strip: up to three videos (or articles) that show what
that ending could look like. The order is set by community votes in GitHub Discussions.

> **Votes reflect online opinion only. They never change the map.** Road widths and site
> shares come from the evidence ledger and the published method, never from votes, views or
> reactions. A popular video says nothing about how likely an ending is.

## Layout

- Discussion category **Visions** (announcement-style: only maintainers start discussions,
  everyone can reply).
- **One discussion per ending**, 13 in total, titled exactly `Visions · <Ending name>`:
  Normal technology · Libertarian Utopia · Egalitarian Utopia · Enslaved God · 1984 ·
  Gatekeeper · Protector God · Benevolent Dictator · Zookeeper · Descendants · Conquerors ·
  Reversion · Self-destruction.
- **One top-level reply per vision.** Replies inside a vision's thread are comments, not
  new visions.
- **Thumbs-up (👍) on a vision reply = one vote.** GitHub allows one 👍 per account per reply.
  The submitter's own 👍 is not counted. Other reactions are ignored.

## Reply format (fixed; the build parses it)

```
**Vision:** <title as published>
**Link:** https://www.youtube.com/watch?v=<id>
**Creator:** <channel or author>
**Kind:** explainer | short film | talk | documentary | article | other
**Start:** 1:38
**Fit:** full | partial — <one line: which part of the ending it shows>
```

- `Start` is optional (mm:ss or h:mm:ss); use it when the ending is one chapter of a longer video.
- One vision per reply. Search the discussion first; duplicates are hidden and their votes are not merged.
- Public, embeddable video (YouTube or Vimeo) or a public article. No adverts, brand spots or
  paywalled pages. The work stays its creator's; the site embeds it and links to it.
- Describe the fit neutrally ("shows the sector system", not "best video ever").
- Fit follows the ending's source (Tegmark, *Life 3.0*; Narayanan & Kapoor for Normal
  technology). A video about something else is hidden by a maintainer with a short reason.

## How the build uses votes

1. The weekly build runs `node tools/fetch_vision_votes.mjs > build/vision_votes.json`
   with a read-only `GITHUB_TOKEN` from the environment (Actions secret or the maintainer's
   shell; never committed, never printed).
2. The script reads the `Visions` category over the GitHub GraphQL API, parses each
   top-level reply, skips replies that are hidden (minimised), unparseable or not https,
   and counts 👍 minus the submitter's own.
3. Per ending it keeps the top 3 by votes (ties: earlier reply first) and writes ending id,
   link, title, creator, kind, start, votes and the reply URL.
4. The site shows them in the Visions strip with the vote count and the date the counts were
   read, plus the line *"Votes reflect online opinion only; map shares come from evidence."*
5. Counts are read once a week (same freeze as the evidence snapshot), so the strip never
   changes between builds. Vote counts are not stored in the ledger and are not inputs to
   the engine.

Until real discussions exist, the strip shows the curated demo list in **curated order**,
without counts.

## Moderation

Maintainers hide off-topic, duplicate, abusive or advert replies (GitHub "Hide" →
reason). Hidden replies are not counted. Vote manipulation (sock-puppet accounts, vote
trading) leads to the reply being hidden. The [Code of Conduct](../CODE_OF_CONDUCT.md) applies.
