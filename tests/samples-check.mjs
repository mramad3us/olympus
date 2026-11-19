// OLYMPUS test helper: the checks the look sets' suites share (samples-portrait, samples-void; the build sheet v0.0.23 §6 E).
//
// checkSet(id, want) holds a set's sample.json against what its suite wants (its groups as tools/gallery.mjs expands them, the
// count of views, each view's whole-pixel size, its "open": the default naming views of the set, the day sent, what it decides,
// the round that draws the pick), then holds samples/index.json to it: the set's "open" copied as it is, every view shot at its
// own size (the gallery's whole-pixel check passed) and the shot on disk. drawn(mod, view) draws a view's picture in node and
// holds its size to sample.json's; onePerGroup picks the view a group is drawn by (the default's, else the first).
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { expand, nativeOf } from '../tools/gallery.mjs';

export const SAMPLES = path.join(root, 'samples');
const sampleOf = (id) => JSON.parse(readFileSync(path.join(SAMPLES, id, 'sample.json'), 'utf8'));
const indexOf = () => JSON.parse(readFileSync(path.join(SAMPLES, 'index.json'), 'utf8'));
const ROUNDS = ['v0.0.23', 'v0.0.24'];

/**
 * The checks every set shares (see the header): returns { groups, views } (expanded) and prints its line.
 * want: { groups: [ids], views: n, open: [default ids] | null, builtIn }.
 */
export function checkSet(id, want) {
  const s = sampleOf(id), groups = expand(id, s), views = groups.flatMap(g => g.views);
  assert(JSON.stringify(groups.map(g => g.id)) === JSON.stringify(want.groups), JSON.stringify({ id, groups: groups.map(g => g.id), want: want.groups }));
  assert(views.length === want.views, JSON.stringify({ id, views: views.length, want: want.views }));
  assert(new Set(views.map(v => v.id)).size === views.length, `${id}: a view id twice`);
  for (const v of views) {
    const n = nativeOf(v.pixel, v.query);
    assert(n && Number.isInteger(n[0]) && Number.isInteger(n[1]) && n[0] > 0 && n[1] > 0, JSON.stringify({ id, view: v.id, pixel: v.pixel }));
  }
  if (want.open) {
    const o = s.open;
    assert(o && JSON.stringify(o.default) === JSON.stringify(want.open), JSON.stringify({ id, open: o?.default ?? null, want: want.open }));
    for (const d of o.default) assert(views.some(v => v.id === d), `${id}: the default ${d} is no view of the set`);
    assert(/^2026-11-\d\d$/.test(o.since) && typeof o.decides === 'string' && o.decides.length > 10 && ROUNDS.includes(o.builtIn) && o.builtIn === want.builtIn,
      JSON.stringify({ id, since: o.since, decides: o.decides, builtIn: o.builtIn, want: want.builtIn }));
  } else assert(!s.open, `${id}: open, though nothing of it is scored yet`);
  // (the index: every view shot at its own size, the shot on disk)
  const entry = indexOf().samples.find(e => e.id === id);
  assert(entry, `${id}: not in samples/index.json (run node tools/gallery.mjs ${id})`);
  assert(JSON.stringify(entry.open ?? null) === JSON.stringify(s.open ?? null), `${id}: the index's open is not sample.json's`);
  const shot = new Map(entry.groups.flatMap(g => g.views).map(v => [v.id, v]));
  for (const v of views) {
    const e = shot.get(v.id), n = nativeOf(v.pixel, v.query);
    assert(e && e.shot && JSON.stringify(e.native) === JSON.stringify(n) && existsSync(path.join(SAMPLES, e.shot)),
      JSON.stringify({ id, view: v.id, shot: e?.shot ?? null, native: e?.native ?? null, pixel: n }));
  }
  console.log(`      ${id}: ${groups.length} group${groups.length === 1 ? '' : 's'} (${groups.map(g => `${g.id} ${g.views.length}`).join(', ')}), ${views.length} view${views.length === 1 ? '' : 's'} shot whole, default ${s.open ? s.open.default.join(', ') : 'none'} (${s.open?.builtIn ?? 'not open'})`);
  return { s, groups, views };
}

/** A view's picture in node: its size against sample.json's pixel. */
export async function drawn(mod, v) {
  const M = await import(path.join(SAMPLES, mod)), P = M.picture(new URLSearchParams(v.query)), n = nativeOf(v.pixel, v.query);
  assert(P.w === n[0] && P.h === n[1], JSON.stringify({ mod, view: v.id, drawn: [P.w, P.h], pixel: n }));
  return P;
}
/** One view a group: the open default's, else the group's first. */
export const onePerGroup = (groups, s) => groups.map(g => g.views.find(v => s.open?.default?.includes(v.id)) ?? g.views[0]);
