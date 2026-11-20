// OLYMPUS tests: samples-board, the boarding's three look sets and the game's defaults (samples/hauler-deck, belt-crew, board-poses; the build sheet v0.0.27 §10, item 16).
//
// "Away the boarding party" draws its look from three sets the user scores: I, the Patient Mule's crew deck (I-a the default), D,
// the holdouts' dress (D-c), and B and Z, blind fire and a man down at 0 G (B-a, Z-a). Stage 0 made the sets; the look builds their
// defaults until the user scores. These tests hold each set as the gallery shoots it (its groups and views, each at its own
// whole-pixel size, open with its default since 2026-11-19, built in v0.0.27, in samples/index.json with every shot on disk, each
// view drawn in node at that size), and each default at its one home, so a set and the game cannot drift apart: blind fire's and
// the 0 G down's stage rows are poses.js BLIND_POSES' and DOWN_FREE_POSES' to the number, the picks BLIND_POSE and DOWN_FREE_POSE
// the set's defaults, the cards' bends doll.js POSE_BENDS.blind and .downFree with data/portrait.js FRAME_SEEN's holds; the game's
// frames (the shock band's 'blind' and 'downFree') the sample's candidate frames pixel for pixel in the four facings, and the game's
// target card of a man firing blind and one down at 0 G the sample's B-a and Z-a cards at 4 m and 14 m; the coveralls' makes
// outfits.js BELT_MAKES; I-a's colours the kit's (art/kit/belt.js BELT_LOOK) and each within the Belter palette's reach. Quick.
// Fails with a default the game does not draw, a pose row, a card bend or a colour that differs from its set's, or a set not shot whole.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { expand, nativeOf } from '../tools/gallery.mjs';
import { drawn } from './samples-check.mjs';
import { BLIND_POSES, DOWN_FREE_POSES, BLIND_POSE, DOWN_FREE_POSE, BANDS, DIRS, SHOCK_BAND } from '../src/art/figures/poses.js';
import { POSE_BENDS } from '../src/art/doll/doll.js';
import { FRAME_SEEN, POSES } from '../src/data/portrait.js';
import { BELT_MAKES } from '../src/art/figures/outfits.js';
import { BELT_LOOK } from '../src/art/kit/belt.js';
import { PALETTES, nearest } from '../src/art/palette.js';
import { BOARD_FX_C } from '../src/render/board-fx.js';
import { BLIND, DOWN_FREE, DEFAULTS } from '../samples/board-poses/poses.js';
import { cardOfCand, HOLDOUT, HOLDOUT_PERSON } from '../samples/board-poses/board.js';
import { MAKES } from '../samples/belt-crew/crew.js';
import { CANDIDATES as DECKS, DEFAULT as DECK_DEFAULT } from '../samples/hauler-deck/deck.js';
import { recOf, cardOf } from '../samples/portrait-lib/posed.js';
import { frameOf } from '../samples/portrait-lib/figure.js';

const SAMPLES = path.join(root, 'samples');
const SETS = Object.freeze([
  Object.freeze({ id: 'hauler-deck', mod: 'deck.js', groups: ['I'], views: 3, open: ['I-a'] }),
  Object.freeze({ id: 'belt-crew', mod: 'crew.js', groups: ['D'], views: 3, open: ['D-c'] }),
  Object.freeze({ id: 'board-poses', mod: 'board.js', groups: ['B', 'Z'], views: 4, open: ['B-a', 'Z-a'] }),
]);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const eqPm = (a, b) => a.w === b.w && a.h === b.h && a.data.length === b.data.length && a.data.every((v, i) => v === b.data[i]);
// (a colour's distance to its nearest in a palette: the channels' largest step, 0 to 255)
const off = (c, P) => { const n = nearest(c, P); return Math.max(...[16, 8, 0].map(s => Math.abs(((c >> s) & 255) - ((n >> s) & 255)))); };

export default [
  {
    name: 'the boarding\'s three sets shot whole: hauler-deck (I, three views), belt-crew (D, three) and board-poses (B and Z, four), each view at its own whole-pixel size, open with I-a, D-c, B-a and Z-a since 2026-11-19, built in v0.0.27, indexed as sample.json says with every shot on disk and the sets waiting on top of the gallery, each view drawn in node at its size',
    async fn() {
      const index = JSON.parse(readFileSync(path.join(SAMPLES, 'index.json'), 'utf8')), lines = [];
      for (const W of SETS) {
        const s = JSON.parse(readFileSync(path.join(SAMPLES, W.id, 'sample.json'), 'utf8')), groups = expand(W.id, s), views = groups.flatMap(g => g.views);
        assert(same(groups.map(g => g.id), W.groups) && views.length === W.views && new Set(views.map(v => v.id)).size === views.length, JSON.stringify({ id: W.id, groups: groups.map(g => g.id), views: views.length }));
        assert(same(s.open?.default, W.open) && s.open.since === '2026-11-19' && s.open.builtIn === 'v0.0.27' && typeof s.open.decides === 'string' && s.open.decides.length > 10, JSON.stringify({ id: W.id, open: s.open }));
        const entry = index.samples.find(e => e.id === W.id);
        assert(entry && same(entry.open, s.open), `${W.id}: the index's entry and its open`);
        const shot = new Map(entry.groups.flatMap(g => g.views).map(v => [v.id, v])), sizes = [];
        for (const v of views) {
          const n = nativeOf(v.pixel, v.query), e = shot.get(v.id);
          assert(n && Number.isInteger(n[0]) && Number.isInteger(n[1]) && e?.shot && same(e.native, n) && existsSync(path.join(SAMPLES, e.shot)), JSON.stringify({ view: v.id, n, e }));
          const P = await drawn(`${W.id}/${W.mod}`, v);
          sizes.push(`${v.id} ${P.w}×${P.h}`);
        }
        // (waiting on top of the gallery, the rated folded below: the user's rule of 2026-11-19; open means waiting)
        const at = index.samples.findIndex(e => e.id === W.id);
        lines.push(`${W.id}: ${groups.map(g => `${g.id} ${g.views.length}`).join(', ')}; ${sizes.join(', ')}; default ${s.open.default.join(', ')}; the index's entry ${at + 1} of ${index.samples.length}, open`);
      }
      for (const l of lines) console.log(`      ${l}`);
    },
  },
  {
    name: 'each default at its one home: blind fire\'s and the 0 G down\'s stage rows are poses.js\' (BLIND_POSES, DOWN_FREE_POSES) to the number, the picks B-a and Z-a, the cards\' bends POSE_BENDS.blind and .downFree with FRAME_SEEN\'s holds (rifle-high, empty); the coveralls\' makes BELT_MAKES; I-a\'s colours the kit\'s BELT_LOOK, each within 12 levels of the Belter palette',
    fn() {
      const rows = [];
      for (const c of BLIND) { assert(same(BLIND_POSES[c.id], c.stage), `${c.id}: the stage row differs`); rows.push(c.id); }
      for (const c of DOWN_FREE) { assert(same(DOWN_FREE_POSES[c.id], c.stage), `${c.id}: the stage row differs`); rows.push(c.id); }
      assert(same(Object.keys(BLIND_POSES), BLIND.map(c => c.id)) && same(Object.keys(DOWN_FREE_POSES), DOWN_FREE.map(c => c.id)), 'the candidates\' ids');
      assert(BLIND_POSE === DEFAULTS.B && DOWN_FREE_POSE === DEFAULTS.Z, JSON.stringify({ BLIND_POSE, DOWN_FREE_POSE, DEFAULTS }));
      const Ba = BLIND.find(c => c.id === BLIND_POSE), Za = DOWN_FREE.find(c => c.id === DOWN_FREE_POSE);
      assert(same(POSE_BENDS.blind, Ba.card.bend) && Ba.card.hold === FRAME_SEEN.blind.how && FRAME_SEEN.blind.pose === 'blind' && POSES.includes('blind'), JSON.stringify({ bend: POSE_BENDS.blind, want: Ba.card.bend, F: FRAME_SEEN.blind }));
      assert(same(POSE_BENDS.downFree, Za.card.bend) && Za.card.hold === FRAME_SEEN.downFree.how && FRAME_SEEN.downFree.pose === 'downFree' && POSES.includes('downFree'), JSON.stringify({ bend: POSE_BENDS.downFree, want: Za.card.bend, F: FRAME_SEEN.downFree }));
      assert(same(MAKES, BELT_MAKES.map(M => M.cloth)), JSON.stringify({ MAKES, BELT_MAKES }));
      const I = DECKS[DECK_DEFAULT], pairs = [['frame', I.wall], ['top', I.top], ['trim', I.trim], ['paint', I.paint]];
      assert(DECK_DEFAULT === 'I-a' && pairs.every(([k, c]) => BELT_LOOK[k] === c), JSON.stringify({ DECK_DEFAULT, BELT_LOOK, I }));
      const colours = [I.floor, I.wall, I.top, I.trim, I.piece, I.paint, ...BELT_MAKES.flatMap(M => [M.cloth, M.band]), BOARD_FX_C.green, 0xc8a43a], errs = colours.map(c => off(c, PALETTES.belt)), mars = colours.map(c => off(c, PALETTES.mars));
      console.log(`      ${rows.length} stage rows as the sample's (${rows.join(', ')}); the picks ${BLIND_POSE} and ${DOWN_FREE_POSE}; the cards' blind ${JSON.stringify(POSE_BENDS.blind)} with ${FRAME_SEEN.blind.how}, downFree ${JSON.stringify(POSE_BENDS.downFree)} with ${FRAME_SEEN.downFree.how}`);
      console.log(`      the Belter palette ${PALETTES.belt.length} colours: I-a's, the makes', the lock's green and the coamings' yellow, ${colours.length} colours within ${Math.max(...errs)} levels at worst (mean ${(errs.reduce((a, b) => a + b, 0) / errs.length).toFixed(1)}); the Mars palette's ${Math.max(...mars)} (mean ${(mars.reduce((a, b) => a + b, 0) / mars.length).toFixed(1)})`);
      assert(Math.max(...errs) <= 12, JSON.stringify(colours.map((c, i) => [c.toString(16), errs[i]])));
    },
  },
  {
    name: 'the game draws the set\'s defaults pixel for pixel: the shock band\'s blind and downFree frames in four facings at 16 px/m, and the target card of a man firing blind and of one down at 0 G at 4 m and 14 m',
    fn() {
      const L = HOLDOUT({ carry: 'low' });
      let frames = 0, px = 0;
      assert(BANDS[SHOCK_BAND].includes('blind') && BANDS[SHOCK_BAND].includes('downFree'), JSON.stringify(BANDS[SHOCK_BAND]));
      for (const dir of DIRS) for (const [f, cand] of [['blind', BLIND.find(c => c.id === BLIND_POSE)], ['downFree', DOWN_FREE.find(c => c.id === DOWN_FREE_POSE)]]) {
        const g = frameOf(L, dir, f, { ppm: 16 }), want = frameOf(L, dir, 'idle0', { ppm: 16, pose: cand.stage });
        assert(g.px.length > 50 && same([g.px, g.ax, g.ay], [want.px, want.ax, want.ay]), JSON.stringify({ dir, f, game: g.px.length, sample: want.px.length }));
        frames++; px += g.px.length;
      }
      const cards = [];
      for (const r of [4, 14]) for (const [id, group, pose] of [[BLIND_POSE, 'B', 'blind'], [DOWN_FREE_POSE, 'Z', 'downFree']]) {
        const cand = (group === 'B' ? BLIND : DOWN_FREE).find(c => c.id === id), C = cardOfCand(cand, group);
        const want = cardOf({ gear: C.gear, person: HOLDOUT_PERSON, rec: C.rec, bend: C.bend, rangeM: r, words: 'X' });
        const game = cardOf({ gear: C.gear, person: HOLDOUT_PERSON, rec: recOf(C.gear, { pose, hold: { how: FRAME_SEEN[pose].how } }), rangeM: r, words: 'X' });
        assert(eqPm(game, want), JSON.stringify({ group, rangeM: r, game: [game.w, game.h], sample: [want.w, want.h] }));
        cards.push(`${id} at ${r} m`);
      }
      console.log(`      ${frames} frames as the sample draws them (${px} pixels); the cards ${cards.join(', ')} pixel for pixel`);
    },
  },
];
