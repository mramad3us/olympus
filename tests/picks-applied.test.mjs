// OLYMPUS tests: the user's picks of 2026-11-19 applied (v0.0.24 F; DESIGN.md's log, "the user's gallery picks": the older sets,
// v0.0.11 to v0.0.20's, scored at last). Each scored set carries "scored": { on, picks } in its sample.json (tools/gallery.mjs copies
// it into samples/index.json); this holds each pick in its one home, read from those files, never restated here but for the map
// of a view to its home:
//   helmets R-d → helmets.js HELMET_DRAWN_AS.regular 'R3', E-a → .elite 'E1', O-b → .opa 'O2', the trim (A-b) on the Corps' own;
//   held-devices G1 to G3 → the throw by distance (poses.js throwClassOf), B3 → HELD_POSES.heldBar, R2 → .heldRam, C1 and K1 as built;
//   opfor-look M2 and M3 → helmets.js FOF_MASKS_WORN (a man's by his seed), H1 → poses.js HANDS_POSE, P1 → hitcard.js PAINT_LOOK;
//   marks M2-a, M2-b → range-items.js JAMB_DRAWN_AS 'm2';
//   p12-card P12X (A, C, D) → pistols.js PISTOL_DRAWN_AS p12a, p12c and p12d kept, p12b gone; p12-draw P12M-a → the P-12 as built,
//   the suit's gloves grey (outfits.js COMBAT_SUIT.glove, the user's note);
//   walk W-c → the cycle its view draws (its query's c, B) is gait.js CYCLE; house-light H*-a → HL-a; wcard2 WC2-A-a → the strip 'glyph';
//   audio A-4 → the shot is A5, A4 rebuilt (src/data/sounds.js SHOT_DEFAULT; the set's D group open with D-b, A5, its default).
// Fails without the picks applied.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { HELMET_DRAWN_AS, FOF_MASKS_WORN, fofMaskFor } from '../src/art/figures/helmets.js';
import { HELD_POSES } from '../src/art/figures/templates.js';
import { heldFrameOf, HANDS_POSE, THROW_NEAR_M, THROW_FAR_M } from '../src/art/figures/poses.js';
import { PAINT_LOOK } from '../src/art/doll/hitcard.js';
import { JAMB_DRAWN_AS } from '../src/render/range-items.js';
import { PISTOL_DESIGN_IDS, PISTOL_DRAWN_AS } from '../src/art/pistols.js';
import { COMBAT_SUIT, wear } from '../src/art/figures/outfits.js';
import { CYCLE } from '../src/data/body/gait.js';
import { SHOT_DEFAULT, SHOT_HOUSE, SHOT_CANDIDATES } from '../src/data/sounds.js';

const sample = (id) => JSON.parse(readFileSync(path.join(root, 'samples', id, 'sample.json'), 'utf8'));
const viewOf = (S, id) => S.groups.flatMap(g => (g.views ?? []).map(v => ({ ...v, group: g.id }))).find(v => v.id === id);
const lum = (c) => 0.299 * ((c >> 16) & 255) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255);

export default [
  {
    name: 'the helmets as scored: R3 the Corps\' regulars (R-d, 90), E1 the elites, O2 the OPA, the Corps\' in the Mars trim; the light vac suit\'s sealed dome for civilians',
    fn() {
      const S = sample('helmets'), picks = S.scored.picks;
      const R = wear({ outfit: 'combatSuit', seed: 3 }), E = wear({ outfit: 'combatSuit', seed: 3, unit: 'elite' }), O = wear({ outfit: 'combatSuit', seed: 3, unit: 'opa' }), V = wear({ outfit: 'vac', seed: 3 });
      console.log(`      scored ${S.scored.on}: ${picks.join(', ')}; drawn as ${JSON.stringify(HELMET_DRAWN_AS)}; a regular ${R.helm?.id} (${R.helm?.faction}), an elite ${E.helm?.id} (${E.helm?.faction}), the OPA ${O.helm?.id} (${O.helm?.faction}); the vac suit ${V.head?.kind}, helm ${V.helm ?? 'none'}`);
      assert(picks.includes('R-d') && /R3/.test(viewOf(S, 'R-d').name) && HELMET_DRAWN_AS.regular === 'R3', JSON.stringify(HELMET_DRAWN_AS));
      assert(picks.includes('E-a') && /E1/.test(viewOf(S, 'E-a').name) && HELMET_DRAWN_AS.elite === 'E1' && picks.includes('O-b') && /O2/.test(viewOf(S, 'O-b').name) && HELMET_DRAWN_AS.opa === 'O2', JSON.stringify(HELMET_DRAWN_AS));
      assert(R.helm.id === 'R3' && R.helm.faction === 'mars' && E.helm.id === 'E1' && E.helm.faction === 'mars' && O.helm.id === 'O2' && O.helm.faction === null && !V.helm, JSON.stringify({ R: R.helm?.id, E: E.helm?.id, O: O.helm?.id }));
    },
  },
  {
    name: 'the held devices as scored: the G-11 wound up and thrown by the throw\'s distance (G2 and T3 near, G1 and T1 between, G3 and T2 far), the halligan on the shoulder (B3), the ram hanging (R2)',
    fn() {
      const S = sample('held-devices'), picks = S.scored.picks;
      const frames = [1.5, 5, 12].map(m => [0.2, 0.8].map(k => heldFrameOf({ shape: 'can', throwM: m }, { kind: 'throw', k })).join('/'));
      console.log(`      scored ${S.scored.on}: ${picks.join(', ')}; a throw of 1.5, 5 and 12 m (near under ${THROW_NEAR_M} m, far over ${THROW_FAR_M}): ${frames.join(', ')}; the halligan held at ${JSON.stringify(HELD_POSES.heldBar.parts.bar[0].a)}, the ram at ${JSON.stringify(HELD_POSES.heldRam.parts.ram[0].a)}`);
      assert(['G1', 'G2', 'G3', 'B3', 'R2'].every(p => picks.includes(p)), picks.join());
      assert(frames.join() === 'heldThrowNear0/heldThrowNear1,heldThrow0/heldThrow1,heldThrowFar0/heldThrowFar1', frames.join());
      // (B3's and R2's points, the sample's own: held.js B3P and R2P)
      assert(JSON.stringify(HELD_POSES.heldBar.parts.bar[0].a) === '[0.3,-0.26,-0.18]' && HELD_POSES.heldBar.reach.l === null && JSON.stringify(HELD_POSES.heldRam.parts.ram[0].a) === '[0.04,-0.34,-0.3]' && HELD_POSES.heldRam.reach.l === null, JSON.stringify({ bar: HELD_POSES.heldBar, ram: HELD_POSES.heldRam.reach }));
    },
  },
  {
    name: 'the live men as scored: the masks M2 and M3, one a man by his seed; the hands up H1, the paint P1; the room\'s mark the chemlight (M2-a, M2-b)',
    fn() {
      const S = sample('opfor-look'), M = sample('marks'), seen = new Set(Array.from({ length: 40 }, (_, i) => fofMaskFor(1000 + i)));
      console.log(`      opfor-look scored ${S.scored.on}: ${S.scored.picks.join(', ')}; forty seeds wear ${[...seen].sort().join(' and ')}; hands ${HANDS_POSE}, paint ${PAINT_LOOK}; marks scored ${M.scored.picks.join(', ')}: the mark drawn ${JAMB_DRAWN_AS}`);
      assert(JSON.stringify([...FOF_MASKS_WORN].sort()) === JSON.stringify(S.scored.picks.filter(p => /^M/.test(p)).sort()) && seen.size === 2, JSON.stringify({ worn: FOF_MASKS_WORN, seen: [...seen] }));
      assert(S.scored.picks.includes(HANDS_POSE) && S.scored.picks.includes(PAINT_LOOK), JSON.stringify(S.scored.picks));
      assert(M.scored.picks.every(p => p.startsWith('M2')) && JAMB_DRAWN_AS === 'm2', JSON.stringify(M.scored));
    },
  },
  {
    name: 'the P-12 as scored: A in the game, C and D kept as the alternates\' drawings, B (the slab, scored 0) gone; the combat EVA suit\'s gloves grey, apart from its rings',
    fn() {
      const C = sample('p12-card'), D = sample('p12-draw'), L = wear({ outfit: 'combatSuit', seed: 3 });
      console.log(`      p12-card scored ${C.scored.picks.join(', ')}, p12-draw ${D.scored.picks.join(', ')}; designs ${PISTOL_DESIGN_IDS.join(', ')}, the P-12 drawn as ${PISTOL_DRAWN_AS.p12}; the gloves #${L.gloves.toString(16)} (luminance ${lum(L.gloves).toFixed(0)}) against the rings #${COMBAT_SUIT.ring.toString(16)} (${lum(COMBAT_SUIT.ring).toFixed(0)}) and the shell #${COMBAT_SUIT.shell.toString(16)} (${lum(COMBAT_SUIT.shell).toFixed(0)})`);
      assert(PISTOL_DRAWN_AS.p12 === 'p12a' && PISTOL_DESIGN_IDS.join() === 'p12a,p12c,p12d' && !C.groups.some(g => g.id === 'P12B') && !D.groups.some(g => g.views.some(v => /p12b/.test(v.query ?? ''))), PISTOL_DESIGN_IDS.join());
      assert(L.gloves === COMBAT_SUIT.glove && lum(COMBAT_SUIT.glove) - lum(COMBAT_SUIT.ring) >= 40 && lum(COMBAT_SUIT.glove) - lum(COMBAT_SUIT.shell) >= 60, JSON.stringify({ gloves: L.gloves }));
    },
  },
  {
    name: 'the rest as scored: the walk the cycle W-c draws (B, the game\'s), the house\'s light HL-a, the second gun\'s strip WC2-A; the shot A4 rebuilt as A5 in every scene, its D group waiting with A5 its default',
    fn() {
      const W = sample('walk'), H = sample('house-light'), C2 = sample('wcard2'), A = sample('audio');
      const wc = new URLSearchParams(viewOf(W, W.scored.picks[0]).query).get('c');
      console.log(`      walk scored ${W.scored.picks.join()}: its view draws cycle ${wc}, the game's ${CYCLE}; house-light ${H.scored.picks.join(', ')}; wcard2 ${C2.scored.picks.join()}; audio scored ${A.scored.picks.join()}, open ${JSON.stringify(A.open.default)}: the shot ${SHOT_DEFAULT} everywhere (the house ${SHOT_HOUSE})`);
      assert(wc === CYCLE && CYCLE === 'B', JSON.stringify({ wc, CYCLE }));
      assert(H.scored.picks.every(p => /-a$/.test(p)) && C2.scored.picks[0].startsWith('WC2-A'), JSON.stringify({ H: H.scored, C2: C2.scored }));
      const d = viewOf(A, A.open.default[0]);
      assert(A.scored.picks.includes('A-4') && SHOT_DEFAULT === 'A5' && SHOT_HOUSE === 'A5' && new URLSearchParams(d.query).get('c') === SHOT_DEFAULT && SHOT_CANDIDATES.A5, JSON.stringify({ d, SHOT_DEFAULT }));
    },
  },
];
