#!/usr/bin/env node
// Futures Atlas - read Visions votes from GitHub Discussions (sketch, Node >= 18, no dependencies).
//
//   GITHUB_TOKEN=... node tools/fetch_vision_votes.mjs > build/vision_votes.json
//   node tools/fetch_vision_votes.mjs --fixture test/visions_fixture.json   # offline, no token
//
// Token: read from the GITHUB_TOKEN environment variable ONLY (never a file or argument),
// never printed. Read-only access to public discussions is enough.
// Repo: GITHUB_REPOSITORY (owner/name) or the default below.
// Output (stdout): { generated, source, note, sites: { <ending id>: [ {votes, url, ...} x <= 3 ] } }
// Votes are opinion only: this file is NEVER an input to the engine or to map shares.

import fs from 'node:fs';

const REPO = process.env.GITHUB_REPOSITORY || 'GodenYao/futures-atlas';
const CATEGORY = 'Visions';
const TOP_N = 3;
const ENDINGS = {
  'Normal technology': 'normaltech', 'Libertarian Utopia': 'libertarian', 'Egalitarian Utopia': 'egalitarian',
  'Enslaved God': 'enslaved', '1984': 'o1984', 'Gatekeeper': 'gatekeeper', 'Protector God': 'protector',
  'Benevolent Dictator': 'benevolent', 'Zookeeper': 'zookeeper', 'Descendants': 'descendants',
  'Conquerors': 'conquerors', 'Reversion': 'reversion', 'Self-destruction': 'selfdestruct',
};
const KINDS = new Set(['explainer', 'short film', 'talk', 'documentary', 'article', 'other']);

const args = process.argv.slice(2);
const fixture = args[0] === '--fixture' ? args[1] : null;

const QUERY = `
query($owner:String!, $name:String!, $cat:ID!, $after:String) {
  repository(owner:$owner, name:$name) {
    discussions(first:25, categoryId:$cat) {
      nodes {
        title url
        comments(first:100, after:$after) {
          pageInfo { hasNextPage endCursor }
          nodes {
            url createdAt isMinimized body
            author { login }
            reactions(content:THUMBS_UP, first:100) { totalCount nodes { user { login } } }
          }
        }
      }
    }
  }
}`;
const CAT_QUERY = `query($owner:String!, $name:String!) {
  repository(owner:$owner, name:$name) { discussionCategories(first:25) { nodes { id name } } } }`;

async function gql(query, variables) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set (environment variable only)');
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: 'bearer ' + token, 'content-type': 'application/json', 'user-agent': 'futures-atlas-build' },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (!r.ok || j.errors) throw new Error('GraphQL error: ' + JSON.stringify(j.errors || r.status));
  return j.data;
}

async function loadDiscussions() {
  if (fixture) return JSON.parse(fs.readFileSync(fixture, 'utf8')).data.repository.discussions.nodes;
  const [owner, name] = REPO.split('/');
  const cats = (await gql(CAT_QUERY, { owner, name })).repository.discussionCategories.nodes;
  const cat = cats.find(c => c.name === CATEGORY);
  if (!cat) throw new Error(`no discussion category "${CATEGORY}" in ${REPO}`);
  const first = (await gql(QUERY, { owner, name, cat: cat.id, after: null })).repository.discussions.nodes;
  // Sketch: page through comments per discussion when one has > 100 replies.
  for (const d of first) {
    let page = d.comments;
    while (page.pageInfo && page.pageInfo.hasNextPage) {
      const more = (await gql(QUERY, { owner, name, cat: cat.id, after: page.pageInfo.endCursor }))
        .repository.discussions.nodes.find(x => x.url === d.url);
      if (!more) break;
      d.comments.nodes.push(...more.comments.nodes);
      page = more.comments;
    }
  }
  return first;
}

// Parse the fixed reply format from docs/VISIONS.md.
function parseReply(body) {
  const field = k => {
    const m = new RegExp('^\\s*\\*\\*' + k + ':\\*\\*\\s*(.+?)\\s*$', 'mi').exec(body || '');
    return m ? m[1] : null;
  };
  const link = field('Link');
  if (!link || !/^https:\/\//.test(link)) return null;
  const title = field('Vision');
  if (!title) return null;
  const kindRaw = (field('Kind') || 'other').toLowerCase();
  const fitRaw = field('Fit') || '';
  const start = field('Start');
  let startSec = null;
  if (start && /^\d{1,2}(:\d{2}){1,2}$/.test(start)) startSec = start.split(':').reduce((a, b) => a * 60 + +b, 0);
  let yt = null;
  try {
    const u = new URL(link);
    if (/(^|\.)youtube\.com$/.test(u.hostname)) yt = u.searchParams.get('v');
    else if (u.hostname === 'youtu.be') yt = u.pathname.slice(1);
  } catch { return null; }
  return {
    title: title.slice(0, 200),
    link,
    yt: yt && /^[A-Za-z0-9_-]{6,20}$/.test(yt) ? yt : null,
    ch: (field('Creator') || '').slice(0, 120),
    kind: KINDS.has(kindRaw) ? kindRaw : 'other',
    start: startSec,
    fit: /^partial/i.test(fitRaw) ? 'partial' : /^full/i.test(fitRaw) ? 'full' : null,
    fit_note: fitRaw.replace(/^(full|partial)\s*[—–-]?\s*/i, '').slice(0, 200),
  };
}

function votesOf(c) {
  const me = c.author && c.author.login;
  const users = (c.reactions.nodes || []).map(n => n.user && n.user.login);
  const self = me && users.includes(me) ? 1 : 0;
  // totalCount is exact; the self-vote check only sees the first 100 reactors (sketch limitation).
  return Math.max(0, c.reactions.totalCount - self);
}

const discussions = await loadDiscussions();
const sites = {};
for (const d of discussions) {
  const m = /^Visions\s*·\s*(.+)$/.exec(d.title.trim());
  const id = m && ENDINGS[m[1].trim()];
  if (!id) continue;
  const rows = [];
  for (const c of d.comments.nodes) {
    if (c.isMinimized) continue;
    const v = parseReply(c.body);
    if (!v) continue;
    rows.push({ ...v, votes: votesOf(c), url: c.url, created: c.createdAt, by: c.author ? 'gh:' + c.author.login : null });
  }
  rows.sort((a, b) => b.votes - a.votes || a.created.localeCompare(b.created));
  sites[id] = rows.slice(0, TOP_N);
}

process.stdout.write(JSON.stringify({
  generated: new Date().toISOString(),
  source: `GitHub Discussions, ${REPO}, category ${CATEGORY}`,
  note: 'Votes reflect online opinion only; map shares come from evidence, never from votes.',
  sites,
}, null, 2) + '\n');
