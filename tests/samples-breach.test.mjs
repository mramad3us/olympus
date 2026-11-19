// OLYMPUS tests: samples-breach, "A man in the bang" (samples/breach-poses; the build sheet v0.0.26 §10, §6 C samples-breach, §11 risk 1).
//
// "Bang, then go" draws a role-player dazed (startled, stunned or flash-blind) and frozen (cowering) from a set the user scores: D,
// the daze (D-a, the default, and D-b), and C, the cower (C-a, the default, and C-b). Stage 0 made the set; the look builds its
// defaults until the user scores. These tests hold the set as the gallery shoots it (its two groups and four views, each at its own
// whole-pixel size, open with D-a and C-a since 2026-11-19, built in v0.0.26, in samples/index.json with every shot on disk; each view
// drawn in node at that size), and each default at its one home, so the sample and the game cannot drift apart: every candidate's
// stage row is poses.js DAZE_POSES' and COWER_POSES' to the number and the pick DAZE_POSE and COWER_POSE the set's default; the
// game's frames (daze0 and daze1, its sway a pixel down, and cower) composed from the shock band are the sample's candidate frames
// pixel for pixel in the four facings; and the game's target card of a dazed man (the record's pose 'daze', the rifle low:
// data/portrait.js FRAME_SEEN, art/doll/doll.js POSE_BENDS.daze) and of a cowering one (the pose 'cower', the hands empty) is the
// sample's D-a and C-a card at 4 m and 14 m, pixel for pixel. Quick. Fails with a default the game does not draw, a pose row or a
// card bend that differs from the sample's, or the set not shot whole.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { expand, nativeOf } from '../tools/gallery.mjs';
import { drawn } from './samples-check.mjs';
import { DAZE_POSES, COWER_POSES, DAZE_POSE, COWER_POSE, BANDS, DIRS, SHOCK_BAND } from '../src/art/figures/poses.js';
import { POSE_BENDS } from '../src/art/doll/doll.js';
import { FRAME_SEEN } from '../src/data/portrait.js';
import { DAZE, COWER, DEFAULTS } from '../samples/breach-poses/poses.js';
import { cardOfCand } from '../samples/breach-poses/breach.js';
import { RP, RP_PERSON, STAGE_RP, recOf, cardOf } from '../samples/portrait-lib/posed.js';
import { frameOf } from '../samples/portrait-lib/figure.js';

const SAMPLES = path.join(root, 'samples');
const ID = 'breach-poses';
const WANT = Object.freeze({ groups: ['D', 'C'], views: 4, open: ['D-a', 'C-a'] });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const eqPm = (a, b) => a.w === b.w && a.h === b.h && a.data.length === b.data.length && a.data.every((v, i) => v === b.data[i]);

export default [
  {
    name: 'breach-poses shot whole: groups D and C, four views each at its own whole-pixel size, open with D-a and C-a since 2026-11-19, built in v0.0.26, indexed as sample.json says with every shot on disk, each view drawn in node at its size',
    async fn() {
      const s = JSON.parse(readFileSync(path.join(SAMPLES, ID, 'sample.json'), 'utf8')), groups = expand(ID, s), views = groups.flatMap(g => g.views);
      assert(same(groups.map(g => g.id), WANT.groups) && views.length === WANT.views && new Set(views.map(v => v.id)).size === views.length, JSON.stringify({ groups: groups.map(g => g.id), views: views.length }));
      assert(same(s.open?.default, WANT.open) && s.open.since === '2026-11-19' && s.open.builtIn === 'v0.0.26' && typeof s.open.decides === 'string' && s.open.decides.length > 10, JSON.stringify(s.open));
      const index = JSON.parse(readFileSync(path.join(SAMPLES, 'index.json'), 'utf8')), entry = index.samples.find(e => e.id === ID);
      assert(entry && same(entry.open, s.open), 'the index\'s entry and its open');
      const shot = new Map(entry.groups.flatMap(g => g.views).map(v => [v.id, v])), sizes = [];
      for (const v of views) {
        const n = nativeOf(v.pixel, v.query), e = shot.get(v.id);
        assert(n && Number.isInteger(n[0]) && Number.isInteger(n[1]) && e?.shot && same(e.native, n) && existsSync(path.join(SAMPLES, e.shot)), JSON.stringify({ view: v.id, n, e }));
        const P = await drawn(`${ID}/breach.js`, v);
        sizes.push(`${v.id} ${P.w}×${P.h}`);
      }
      // (the waiting set on top of the gallery, the rated ones folded below: the user's rule of 2026-11-19; open means waiting)
      const at = index.samples.findIndex(e => e.id === ID);
      console.log(`      ${ID}: ${groups.map(g => `${g.id} ${g.views.length}`).join(', ')}; ${sizes.join(', ')}; default ${s.open.default.join(', ')} (since ${s.open.since}, ${s.open.builtIn}); the index's entry ${at + 1} of ${index.samples.length}, open`);
    },
  },
  {
    name: 'each default at its one home: every candidate\'s stage row is poses.js\' (DAZE_POSES, COWER_POSES) to the number, the picks D-a and C-a; the daze\'s card bend POSE_BENDS.daze, the cower\'s C1 with the hands empty (FRAME_SEEN)',
    fn() {
      const rows = [];
      for (const c of DAZE) { assert(same(DAZE_POSES[c.id], c.stage), `${c.id}: the stage row differs`); rows.push(c.id); }
      for (const c of COWER) { assert(same(COWER_POSES[c.id], c.stage), `${c.id}: the stage row differs`); rows.push(c.id); }
      assert(same(Object.keys(DAZE_POSES), DAZE.map(c => c.id)) && same(Object.keys(COWER_POSES), COWER.map(c => c.id)), 'the candidates\' ids');
      assert(DAZE_POSE === DEFAULTS.D && COWER_POSE === DEFAULTS.C, JSON.stringify({ DAZE_POSE, COWER_POSE, DEFAULTS }));
      const Da = DAZE.find(c => c.id === DAZE_POSE), Ca = COWER.find(c => c.id === COWER_POSE);
      assert(same(POSE_BENDS.daze, Da.card.bend) && Da.card.hold === FRAME_SEEN.daze.how && FRAME_SEEN.daze.pose === 'daze', JSON.stringify({ bend: POSE_BENDS.daze, want: Da.card.bend, how: FRAME_SEEN.daze }));
      assert(Ca.card.pose === 'cower' && !Ca.card.bend && Ca.card.hold === FRAME_SEEN.cower.how && FRAME_SEEN.cower.pose === 'cower', JSON.stringify({ C: Ca.card, how: FRAME_SEEN.cower }));
      // (the kneeling daze, my call: the kneel's legs under the daze's arms)
      assert(same(POSE_BENDS.dazeKneel.arms, POSE_BENDS.daze.arms) && POSE_BENDS.dazeKneel.drop === POSE_BENDS.kneel.drop && same(POSE_BENDS.dazeKneel.legs, POSE_BENDS.kneel.legs), JSON.stringify(POSE_BENDS.dazeKneel));
      console.log(`      ${rows.length} stage rows as the sample's (${rows.join(', ')}); the picks ${DAZE_POSE} and ${COWER_POSE}; the card's daze ${JSON.stringify(POSE_BENDS.daze)} with ${FRAME_SEEN.daze.how}, the cower C1 with ${FRAME_SEEN.cower.how}`);
    },
  },
  {
    name: 'the game draws the sample\'s defaults pixel for pixel: the shock band\'s daze0, daze1 (the sway a pixel down) and cower in four facings at 16 px/m, and the target card of a dazed man and a cowering one at 4 m and 14 m',
    fn() {
      const L = STAGE_RP({ carry: 'low' }), Da = DAZE.find(c => c.id === DAZE_POSE), Ca = COWER.find(c => c.id === COWER_POSE);
      let frames = 0, px = 0;
      assert(BANDS[SHOCK_BAND].includes('daze0') && BANDS[SHOCK_BAND].includes('daze1') && BANDS[SHOCK_BAND].includes('cower'), JSON.stringify(BANDS[SHOCK_BAND]));
      for (const dir of DIRS) for (const [f, cand, bob] of [['daze0', Da, 0], ['daze1', Da, 1], ['cower', Ca, 0]]) {
        const g = frameOf(L, dir, f, { ppm: 16 }), want = frameOf(L, dir, 'idle0', { ppm: 16, pose: { ...cand.stage, bob } });
        assert(g.px.length > 50 && same([g.px, g.ax, g.ay], [want.px, want.ax, want.ay]), JSON.stringify({ dir, f, game: g.px.length, sample: want.px.length }));
        frames++; px += g.px.length;
      }
      // (the sway: daze1 is daze0 a pixel lower above the hips, never the same picture)
      const d0 = frameOf(L, 'down', 'daze0', { ppm: 16 }), d1 = frameOf(L, 'down', 'daze1', { ppm: 16 });
      assert(!same(d0.px, d1.px), 'the sway draws nothing');
      const cards = [];
      for (const r of [4, 14]) for (const [cand, group, pose, how] of [[Da, 'D', 'daze', FRAME_SEEN.daze.how], [Ca, 'C', 'cower', FRAME_SEEN.cower.how]]) {
        const C = cardOfCand(cand, group);
        const want = cardOf({ gear: C.gear, person: RP_PERSON, rec: C.rec, bend: C.bend, rangeM: r, words: 'X' });
        const game = cardOf({ gear: RP, person: RP_PERSON, rec: recOf(RP, { pose, hold: { how } }), rangeM: r, words: 'X' });
        assert(eqPm(game, want), JSON.stringify({ group, rangeM: r, game: [game.w, game.h], sample: [want.w, want.h] }));
        cards.push(`${cand.id} at ${r} m`);
      }
      console.log(`      ${frames} frames as the sample draws them (${px} pixels), the sway a pixel down; the cards ${cards.join(', ')} pixel for pixel`);
    },
  },
];
