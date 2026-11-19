// OLYMPUS samples: the "To score" list, the gallery's first section (the build sheet v0.0.23 §1 item 8; overhaul.md's O-3: "the
// open sets listed in one place with each set's default and how many views it has, so one sitting covers them all").
//
// A set the user has not scored carries "open": { default, since, decides, builtIn } in its sample.json, which tools/gallery.mjs
// copies into samples/index.json (indexEntry). toScore(index) turns the index into the list the page draws: one row a set still
// open, with its title, its default (the view or views the game draws until the score, each with the group it is in), its view
// count, the day it was first sent, what it decides and the round that draws the pick. The rows are ordered by the round that
// draws them (this round's first: their defaults ship now), then the oldest first (what has waited longest), then by id. A set
// with no "open" is not listed; a default naming no view of the set is listed with `missing` (the page says so, the test fails).
// Pure: samples/index.html imports it, and tests/gallery-open.test.mjs checks it with no DOM.

/** A round's order ('v0.0.23' before 'v0.0.24'; anything else last). */
const roundKey = (r) => { const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(r ?? '')); return m ? Number(m[1]) * 1e6 + Number(m[2]) * 1e3 + Number(m[3]) : Infinity; };

/** The open sets of an index (see the header): [{ id, title, defaults: [{ id, group, name }], missing: [ids], views, since, decides, builtIn }]. */
export function toScore(index) {
  const rows = [];
  for (const s of index?.samples ?? []) {
    if (!s.open) continue;
    const all = (s.groups ?? []).flatMap(g => (g.views ?? []).map(v => ({ id: v.id, group: g.id, name: v.name })));
    const want = Array.isArray(s.open.default) ? s.open.default : [s.open.default].filter(Boolean);
    const defaults = want.map(id => all.find(v => v.id === id)).filter(Boolean);
    rows.push({
      id: s.id, title: s.title, defaults, missing: want.filter(id => !all.some(v => v.id === id)), views: all.length,
      since: s.open.since ?? null, decides: s.open.decides ?? '', builtIn: s.open.builtIn ?? null,
    });
  }
  return rows.sort((a, b) => roundKey(a.builtIn) - roundKey(b.builtIn) || String(a.since ?? '').localeCompare(String(b.since ?? '')) || a.id.localeCompare(b.id));
}

/** The list as text, a line a set (the page's "Copy the list", and the lead's announcement). */
export function toScoreText(rows) {
  return rows.map(r => `${r.id} (${r.views} views, since ${r.since ?? '?'}, drawn in ${r.builtIn ?? '?'}): default ${r.defaults.map(d => d.id).join(', ') || 'none'}${r.decides ? `; decides ${r.decides}` : ''}`).join('\n');
}
