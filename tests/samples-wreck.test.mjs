// OLYMPUS tests: samples-wreck, the two sets "Hold to hold" draws from (the build sheet v0.0.25 §10, §6 D samples-wreck; stage 0 made
// them on the round's first day, D builds at their defaults until the user scores them).
//
// samples/wreck-faces ("A room with no floor, read from above": K a thing on the deckhead, T a board on a face, P the pop-up, H the
// deck hatch, B the bulkhead hatch, X through the trunk; 14 views) and samples/portrait-faces ("A man upside down to you": R; 2 views)
// held as the gallery shoots them: their groups, their views each at its own whole-pixel size, open with the sheet's defaults (K-b,
// T-a, P-a, H-a, B-a, X-a; R-a), sent on 2026-11-19 and built in v0.0.25, in samples/index.json as sample.json says with every shot on
// disk at its size; every view drawn in node at that size; and the game drawing each default from its one home (render/faces.js
// OVERHEAD_LOOK K-b; art/doll/portrait.js PORTRAIT_PICKS.roll R-a; the board's turn the sample's TURN, wreck-look's; the pop-up
// hinged at its base, P-a). Quick. Fails without the sets or with a default the game does not draw.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { expand, nativeOf } from '../tools/gallery.mjs';
import { drawn } from './samples-check.mjs';
import { OVERHEAD_LOOK } from '../src/render/faces.js';
import { PORTRAIT_PICKS } from '../src/art/doll/portrait.js';

const SAMPLES = path.join(root, 'samples');
const SETS = Object.freeze({
  // (v0.0.28, the user's picks of 2026-11-20: wreck-faces scored but X, which waits re-explained and redrawn, open since then and
  // built in v0.0.28; portrait-faces scored whole, R-a and R-b joined, and folded)
  'wreck-faces': { groups: ['K', 'T', 'P', 'H', 'B', 'X'], views: 14, open: ['X-a'], since: '2026-11-20', builtIn: 'v0.0.28', scored: ['K-a', 'T-a', 'P-b', 'H-b', 'B-a'], mod: 'wreck-faces/faces.js' },
  'portrait-faces': { groups: ['R'], views: 2, open: null, scored: ['R-a', 'R-b'], mod: 'portrait-faces/faces.js' },
});

export default [
  {
    name: 'wreck-faces and portrait-faces shot whole: their groups and views each at its own whole-pixel size, scored on 2026-11-20 (wreck-faces open for X alone, re-explained in v0.0.28; portrait-faces folded), indexed as sample.json says with every shot on disk',
    fn() {
      const index = JSON.parse(readFileSync(path.join(SAMPLES, 'index.json'), 'utf8'));
      for (const [id, want] of Object.entries(SETS)) {
        const s = JSON.parse(readFileSync(path.join(SAMPLES, id, 'sample.json'), 'utf8')), groups = expand(id, s), views = groups.flatMap(g => g.views);
        assert(JSON.stringify(groups.map(g => g.id)) === JSON.stringify(want.groups) && views.length === want.views && new Set(views.map(v => v.id)).size === views.length, JSON.stringify({ id, groups: groups.map(g => g.id), views: views.length }));
        assert(want.open ? JSON.stringify(s.open?.default) === JSON.stringify(want.open) && s.open.since === want.since && s.open.builtIn === want.builtIn && typeof s.open.decides === 'string' && s.open.decides.length > 10 : !s.open, JSON.stringify({ id, open: s.open }));
        assert(s.scored?.on === '2026-11-20' && JSON.stringify(s.scored.picks) === JSON.stringify(want.scored), JSON.stringify({ id, scored: s.scored }));
        const entry = index.samples.find(e => e.id === id);
        assert(entry && JSON.stringify(entry.open ?? null) === JSON.stringify(s.open ?? null) && JSON.stringify(entry.scored) === JSON.stringify(s.scored), `${id}: the index's entry`);
        const shot = new Map(entry.groups.flatMap(g => g.views).map(v => [v.id, v]));
        for (const v of views) {
          const n = nativeOf(v.pixel, v.query), e = shot.get(v.id);
          assert(n && Number.isInteger(n[0]) && Number.isInteger(n[1]) && e?.shot && JSON.stringify(e.native) === JSON.stringify(n) && existsSync(path.join(SAMPLES, e.shot)), JSON.stringify({ id, view: v.id, n, e }));
        }
        console.log(`      ${id}: ${groups.map(g => `${g.id} ${g.views.length}`).join(', ')}; ${views.length} views shot whole; scored ${s.scored.picks.join(', ')}; ${s.open ? `open ${s.open.default.join(', ')} (since ${s.open.since}, ${s.open.builtIn})` : 'folded'}`);
      }
    },
  },
  {
    name: 'every view drawn in node at its sample.json size, and the game draws each pick from its one home: K-a (OVERHEAD_LOOK, the user\'s star of 2026-11-20; K-b before), R-a (PORTRAIT_PICKS.roll)',
    async fn() {
      const sizes = [];
      for (const [id, want] of Object.entries(SETS)) {
        const s = JSON.parse(readFileSync(path.join(SAMPLES, id, 'sample.json'), 'utf8')), views = expand(id, s).flatMap(g => g.views);
        for (const v of views) { const P = await drawn(want.mod, v); sizes.push(`${v.id} ${P.w}×${P.h}`); }
      }
      console.log(`      ${sizes.join(', ')}`);
      console.log(`      the game: the overhead ${OVERHEAD_LOOK}, the portrait's roll ${PORTRAIT_PICKS.roll}`);
      assert(OVERHEAD_LOOK === 'K-a' && PORTRAIT_PICKS.roll === 'R-a', JSON.stringify({ OVERHEAD_LOOK, roll: PORTRAIT_PICKS.roll }));
    },
  },
];
