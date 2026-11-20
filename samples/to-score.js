// OLYMPUS samples: the "To score" list, the gallery's first section (the build sheet v0.0.23 §1 item 8; overhaul.md's O-3: "the
// open sets listed in one place with each set's default and how many views it has, so one sitting covers them all").
//
// A set the user has not scored carries "open": { default, since, decides, builtIn } in its sample.json, which tools/gallery.mjs
// copies into samples/index.json (indexEntry). toScore(index) turns the index into the list the page draws: one row a set still
// open, with its title, its default (the view or views the game draws until the score, each with the group it is in), its view
// count, the day it was first sent, what it decides and the round that draws the pick. The rows are ordered by the round that
// draws them, the newest first (the sets just sent, which the game's To score page leads with too: v0.0.25's fixer), then the oldest
// first (what has waited longest), then by id; v0.0.28: within a round, a set's "open" may carry a rank (a number, the lowest
// first, before any set with none), the lead's order of what to score first (the sets sent back on the user's notes of
// 2026-11-20 lead with the side card, "I need you to be serious about this"). A set
// with no "open" is not listed; a default naming no view of the set is listed with `missing` (the page says so, the test fails).
// v0.0.24 (the user, 2026-11-19: "please in the future, place the already rated picks in a hidden drop down section at the
// bottom"): a set with no "open" is one the user has already rated (its "scored" { on, picks } says when and what, where the
// lead recorded it); ratedSets(index) lists them, in the index's order, for the page's collapsed section at the bottom, and the
// waiting sets (toScore's) are drawn above it. "Copy my picks" gives only what changed since the last copy (newSince: a star, a
// score or a note added or changed since the copy this browser remembers), then one line counting the earlier ones.
// Pure: samples/index.html imports it, and tests/gallery-open.test.mjs checks it with no DOM.

/** A round's order ('v0.0.23' before 'v0.0.24'; anything else last). */
const roundKey = (r) => { const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(r ?? '')); return m ? Number(m[1]) * 1e6 + Number(m[2]) * 1e3 + Number(m[3]) : -Infinity; };

/** The open sets of an index (see the header): [{ id, title, defaults: [{ id, group, name }], missing: [ids], views, since, decides, builtIn, rank }]. */
export function toScore(index) {
  const rows = [];
  for (const s of index?.samples ?? []) {
    if (!s.open) continue;
    const all = (s.groups ?? []).flatMap(g => (g.views ?? []).map(v => ({ id: v.id, group: g.id, name: v.name })));
    const want = Array.isArray(s.open.default) ? s.open.default : [s.open.default].filter(Boolean);
    const defaults = want.map(id => all.find(v => v.id === id)).filter(Boolean);
    rows.push({
      id: s.id, title: s.title, defaults, missing: want.filter(id => !all.some(v => v.id === id)), views: all.length,
      since: s.open.since ?? null, decides: s.open.decides ?? '', builtIn: s.open.builtIn ?? null, rank: Number.isFinite(s.open.rank) ? s.open.rank : null,
    });
  }
  // (v0.0.25's fixer, the play review: the newest round's first, as the game's To score page has them, then the oldest first;
  // v0.0.28: a rank first within its round)
  const rankOf = (r) => r.rank ?? Infinity;
  return rows.sort((a, b) => roundKey(b.builtIn) - roundKey(a.builtIn) || (rankOf(a) - rankOf(b) || 0) || String(a.since ?? '').localeCompare(String(b.since ?? '')) || a.id.localeCompare(b.id));
}

/** The list as text, a line a set (the page's "Copy the list", and the lead's announcement). */
export function toScoreText(rows) {
  return rows.map(r => `${r.id} (${r.views} views, since ${r.since ?? '?'}, drawn in ${r.builtIn ?? '?'}): default ${r.defaults.map(d => d.id).join(', ') || 'none'}${r.decides ? `; decides ${r.decides}` : ''}`).join('\n');
}

/** The sets already rated (see the header): every set of the index with no "open", in the index's order: [{ id, title, views, scored }]. */
export function ratedSets(index) {
  return (index?.samples ?? []).filter(s => !s.open).map(s => ({ id: s.id, title: s.title, views: (s.groups ?? []).reduce((n, g) => n + (g.views ?? []).length, 0), scored: s.scored ?? null }));
}

/**
 * What changed since the last copy (see the header), pure: now and copied are { picks: [keys], scores: { key: n }, notes: { key: text } }
 * (copied null: nothing was copied yet). Returns { picks, scores, notes } holding only the new or changed entries (a star removed
 * is not a pick to send), and earlier: how many of now's entries were already copied as they are.
 */
export function newSince(now, copied = null) {
  const C = { picks: new Set(copied?.picks ?? []), scores: copied?.scores ?? {}, notes: copied?.notes ?? {} };
  const out = { picks: [], scores: {}, notes: {}, earlier: 0 };
  const keys = [...new Set([...(now?.picks ?? []), ...Object.keys(now?.scores ?? {})])];
  for (const k of keys) {
    const star = (now.picks ?? []).includes(k), score = now.scores?.[k];
    const same = star === C.picks.has(k) && (score === undefined ? C.scores[k] === undefined : C.scores[k] === score);
    if (same) { out.earlier++; continue; }
    if (star) out.picks.push(k);
    if (score !== undefined) out.scores[k] = score;
  }
  for (const [k, t] of Object.entries(now?.notes ?? {})) {
    if (!String(t ?? '').trim()) continue;
    if (C.notes[k] === t) out.earlier++; else out.notes[k] = t;
  }
  return out;
}
