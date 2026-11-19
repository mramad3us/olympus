// OLYMPUS tests: the P-12's stances and the R-7 hanging while it is up (the lead's F98 and F99 for the user's note of 2026-11-17).
//
// The user, 2026-11-17: "Graphics : Holding the sidearm with the rifle dangling should be redrawn, sidearm should have the same
// stances (low ready, high ready, aimed, etc) as the rifle". On v0.0.22 the stage drew the P-12 out as two frames of the stance sheet
// ('draw', 'pistolAim') that no sheet a pistol's look has carried (its carry is 'front': the view fell back to the slung carry's
// frame, empty hands, the pistol never seen), the doll had the low ready only and the card none. Now:
//   F98 the low ready, the high ready, aimed, the hand at the holster and the admin are each a distinct frame on the stage's figure
//       (poses.js's pistol band, in every facing, the pistol's muzzle drawn but at the holster), on the doll (worn.js holdGear's
//       places, the pistol's pixels in the hands) and on the card; the rifle's own frames byte for byte as before (art-held's golden,
//       the pistol band left out: '1c53d76d17f6d4', pinned on v0.0.19's code);
//   F99 the R-7 hangs on its sling in every pistol frame and facing (its cells drawn), muzzle down, never over an arm (the frame with
//       the hang against the same frame without it: no arm or glove cell changed), on the doll never over a hand; and it swings with
//       the walk (the four pistolWalk frames' rifle pictures differ).
// And the walks through the gait view (the review of 2026-11-18): with the P-12 out the walk's frames follow the walk's own steps in
// order over the whole cycle, both legs' steps drawn, no frame held past its quarter of the cycle, and aimed it walks too (before,
// pistolWalkOf read one digit of the glide's frame: in cycles A and B the second step held pistolWalk3 for half the cycle, basePose
// drew the first step's keys only, and aimed it drew one standing frame, the legs frozen as the figure slid).
// Prints each count.
import { assert } from './helpers.mjs';
import { composeFrame } from '../src/art/figures/compose.js';
import { wear } from '../src/art/figures/outfits.js';
import { BANDS, DIRS, PISTOL_FRAMES, PISTOL_WALK_N, pistolFrameOf, pistolWalkOf, pistolWalkKey, walkFrame } from '../src/art/figures/poses.js';
import { bandSpec, CYCLE_IDS } from '../src/art/figures/walk.js';
import { createGaitView } from '../src/render/gait-view.js';
import { doll, BODY } from '../src/art/doll/doll.js';
import { rifleStamp } from '../src/art/doll/worn.js';
import { word } from '../src/art/paint.js';
import { dressOf } from '../src/art/doll/dress.js';
import { paintHitcard } from '../src/art/doll/hitcard.js';
import { hash } from '../src/core/hash.js';
import { f98Line, f99Line, PORTRAIT_ENFORCED } from './flawless-portrait.mjs';

const PPM = 24;
const STANCES = Object.freeze([['low ready', 'pistolLow', 'pistol-ready'], ['high ready', 'pistolHigh', 'pistol-high'], ['aimed', 'pistolAimed', 'pistol-aim'], ['at the holster', 'pistolHolster', 'pistol-draw'], ['the admin', 'pistolCheck', 'pistol-check']]);
const cellsKey = (fr) => hash(fr.cells.map(r => r.map(c => (c ? c.ch : '.')).join('')).join('|')).toString(16);
const LOOK = wear({ outfit: 'utilities', weapon: 'rifle', carry: 'front', armour: true, gloves: true, seed: 4 });
const GEAR = { outfit: 'utilities', suit: null, carrier: { model: 'pc-m3', pouches: [] }, ears: null, rifle: { model: 'r7', finish: null, place: 'ready', mag: true }, pistol: { model: 'p12', place: 'holster', mag: true }, thigh: null, held: null, devices: [], painted: false, mask: null, hands: null, device: null };
const PERSON = { look: { skin: 'tan', hair: { style: 'highTight', color: 'dark' } }, sex: 'm' };

// (the stage: the cells a frame's hang changed, and whether one of them was an arm's: a glove, or skin off the face's part)
function hangDiff(frame, dir) {
  const a = composeFrame(LOOK, dir, frame, { ppm: PPM }), pose = a.pose, b = composeFrame(LOOK, dir, frame, { ppm: PPM, pose: { ...pose, noHang: true } });
  let changed = 0, overArm = 0, top = Infinity, bottom = -Infinity;
  const cells = [];
  for (let y = 0; y < a.cells.length; y++) for (let x = 0; x < a.cells[y].length; x++) {
    const p = a.cells[y][x], q = b.cells[y]?.[x];
    if ((p?.ch ?? '.') === (q?.ch ?? '.')) continue;
    changed++; cells.push(`${x},${y}`); top = Math.min(top, y); bottom = Math.max(bottom, y);
    // (the look's gloves ('d'): the hands at the ends of the arms; the skin the hang's strap crosses at the collar is the neck's)
    if (q && q.ch === 'd') overArm++;
  }
  return { changed, overArm, key: cells.join(' '), top, bottom, muzzle: a.muzzle };
}

export default [
  {
    name: 'F98 the P-12\'s stances drawn: low ready, high ready, aimed, at the holster and the admin each a distinct frame on the stage (every facing), the doll and the card, the pistol in the hands; gunLook\'s posture and act name them (v0.0.22: two frames no pistol\'s sheet carried)',
    fn() {
      const stage = { n: 0, distinct: 0, pistol: 0 }, doll1 = { n: 0, distinct: 0, held: 0 }, card = { n: 0, distinct: 0 };
      for (const dir of DIRS) {
        const keys = STANCES.map(([, f]) => cellsKey(composeFrame(LOOK, dir, f, { ppm: PPM })));
        stage.n += keys.length; stage.distinct += new Set(keys).size;
        for (const [, f] of STANCES) if (f !== 'pistolHolster' && composeFrame(LOOK, dir, f, { ppm: PPM }).muzzle) stage.pistol++;
      }
      const dolls = STANCES.map(([, , how]) => doll({ ...dressOf(GEAR, PERSON, { rec: { pose: 'stand', facing: 'front', hold: { how }, aimAt: how === 'pistol-aim' ? 'you' : null } }), scale: 96 / 72 }));
      doll1.n = dolls.length; doll1.distinct = new Set(dolls.map(d => hash(Array.from(d.data).join(',')))).size;
      doll1.held = dolls.filter((d, i) => STANCES[i][1] !== 'pistolHolster' && d.held.some(Boolean)).length;
      const cards = STANCES.map(([, , how]) => paintHitcard({ phase: 'belief', marks: [], words: 'P-12', rangeM: 5, subject: { kind: 'man', rec: { kind: 'man', gear: GEAR, pose: 'stand', facing: 'front', hold: { how }, aimAt: how === 'pistol-aim' ? 'you' : null }, gear: GEAR, person: PERSON } }));
      card.n = cards.length; card.distinct = new Set(cards.map(c => hash(Array.from(c.data).join(',')))).size;
      // (the names: gunLook's pistol posture and its action frame to the stage's frame, and walking)
      const names = [pistolFrameOf({ posture: 'lowReady' }), pistolFrameOf({ posture: 'highReady' }), pistolFrameOf({ posture: 'aimed' }), pistolFrameOf({ posture: 'lowReady' }, { frame: 'sling', k: 0 }), pistolFrameOf({ posture: 'lowReady' }, { frame: ['check', 'charge'], k: 0.6 }), pistolFrameOf({ posture: 'aimed' }, null, 1), pistolWalkOf({ posture: 'lowReady' }, { frame: 'glide2' }, 4), pistolWalkOf({ posture: 'aimed' }, { frame: 'glide6' }, 4)];
      const r = { ok: stage.distinct === stage.n && stage.pistol === 4 * DIRS.length && doll1.distinct === doll1.n && doll1.held === 4 && card.distinct === card.n, stage, doll: doll1, card, rifle: 'byte for byte (art-held, \'1c53d76d17f6d4\')' };
      console.log(`      ${f98Line(r)}`);
      console.log(`      the names: ${names.join(', ')}; the band ${BANDS.pistol.length} frames (${PISTOL_FRAMES.join(', ')})`);
      assert(names.join() === 'pistolLow,pistolHigh,pistolAimed,pistolHolster,pistolCheck,pistolFire,pistolWalk1,pistolAimWalk3', names.join());
      assert(r.ok && PORTRAIT_ENFORCED.has('F98'), JSON.stringify(r));
    },
  },
  {
    name: 'F99 the R-7 hangs on its sling while the pistol is up: drawn in every pistol frame and facing, muzzle down, never over an arm or a glove (the frame with its hang against the same without), on the doll never over a hand; and it swings with the walk (the four walk frames\' rifles differ)',
    fn() {
      let n = 0, hung = 0, down = 0, overArms = 0;
      for (const dir of DIRS) for (const f of BANDS.pistol) {
        const d = hangDiff(f, dir);
        n++; if (d.changed > 0) hung++; overArms += d.overArm;
        // (muzzle down: the hang's cells reach lower than they start, the rifle's length down the body; from behind its butt at the shoulder)
        if (d.changed > 0 && d.bottom - d.top >= 6) down++;
      }
      const walks = DIRS.flatMap(dir => ['pistolWalk', 'pistolAimWalk'].flatMap(w => [0, 1, 2, 3].map(k => hangDiff(`${w}${k}`, dir).key)));
      const walkDistinct = new Set(walks).size;
      // (the doll: RH1 against no rifle at all, at each stance; a changed pixel that was a hand's skin is the rifle over a hand)
      // (the rifle's own colours on the doll, its stamp at RH1's place: a hand's edge darkened by the seam over the rifle is the hand's)
      const gunC = new Set(rifleStamp('r7', null, 96 / 72, 'hang', BODY.m, 32, true).map(([, , c]) => word(c)));
      let dollOver = 0; const dollAt = [];
      for (const [, , how] of STANCES) {
        const rec = { pose: 'stand', facing: 'front', hold: { how }, aimAt: how === 'pistol-aim' ? 'you' : null };
        const a = doll({ ...dressOf(GEAR, PERSON, { rec }), scale: 96 / 72 }), b = doll({ ...dressOf({ ...GEAR, rifle: null }, PERSON, { rec }), scale: 96 / 72 });
        // (the skin's tones: the face's middle, under the brows and over the mouth)
        const skin = new Set(), K = 96 / 72; for (let y = Math.round(17 * K); y < Math.round(21 * K); y++) for (let x = Math.round(29 * K); x < Math.round(35 * K); x++) skin.add(b.data[y * b.w + x]);
        for (let y = Math.round(30 * 96 / 72); y < a.h; y++) for (let x = 0; x < a.w; x++) { const i = y * a.w + x; if (a.data[i] !== b.data[i] && skin.has(b.data[i]) && gunC.has(a.data[i])) { dollOver++; dollAt.push(`${how} ${x},${y}`); } }
      }
      const r = { ok: hung === n && down === n && overArms === 0 && dollOver === 0 && walkDistinct >= 4 * DIRS.length - 1, n, hung, down, overArms, dollOver, walkDistinct, walkN: walks.length };
      console.log(`      ${f99Line(r)}${dollAt.length ? ` (${dollAt.slice(0, 4).join('; ')})` : ''}`);
      assert(r.ok && PORTRAIT_ENFORCED.has('F99'), JSON.stringify(r));
    },
  },
  {
    name: 'the P-12 walks through the gait view: at the low ready and aimed, the frames follow the walk\'s steps in order over the whole cycle, both legs\' steps drawn, none held past its quarter, in cycles A, B and C (the review of 2026-11-18: the second step held one frame, aimed a standing frame slid)',
    fn() {
      const rows = [], bad = [];
      for (const cycle of CYCLE_IDS) for (const posture of ['lowReady', 'aimed']) {
        const n = bandSpec(cycle, 'combat').n, span = Math.ceil(2 * n / PISTOL_WALK_N);
        // (the glide's own frames, step by key, to the pistol walk's key: in order, every key met, none over its span, and the legs
        // it draws a key of its own span)
        const ks = Array.from({ length: 2 * n }, (_, f) => Number(/(\d)$/.exec(pistolWalkOf({ posture }, { step: Math.floor(f / n), j: f % n }, n))[1]));
        const order = ks.every((k, i) => i === 0 || k === ks[i - 1] || k === ks[i - 1] + 1) && ks[0] === 0 && ks.at(-1) === PISTOL_WALK_N - 1;
        const held = Math.max(...Array.from({ length: PISTOL_WALK_N }, (_, k) => ks.filter(x => x === k).length));
        const own = Array.from({ length: PISTOL_WALK_N }, (_, k) => ks[pistolWalkKey(k, n)] === k).every(Boolean);
        // (through createGaitView over one cycle walked: the runs of frames drawn, in order, every one a walk frame of its posture)
        const gv = createGaitView(), runs = [];
        for (let i = 0; i <= 80; i++) {
          const gp = i * 2 / 80;
          const out = gv.draw({ id: 'p', ms: i * 50, tickMs: i * 50, free: true, simFace: 'right', yawRad: 0, turnsByYaw: true, walking: true, travelRad: 0, stride: gp * 0.6, gp, stepM: 0.6, vMs: 1.2, band: 'combat', sheet: false, kick: false, aimed: false, beat: null, action: null, pistol: { posture }, gMs2: 3.71, cycle });
          if (!runs.length || runs.at(-1) !== out.frame) runs.push(out.frame);
        }
        const want = Array.from({ length: PISTOL_WALK_N }, (_, k) => `${posture === 'aimed' ? 'pistolAimWalk' : 'pistolWalk'}${k}`);
        const gvOk = runs.slice(0, PISTOL_WALK_N).join() === want.join() && runs.slice(PISTOL_WALK_N).every(f => f === want[0]);
        // (the pictures: the four frames distinct in every facing, the legs of both steps (the far and the near leg leading))
        const pics = DIRS.map(dir => new Set(want.map(f => cellsKey(composeFrame({ ...LOOK, cycle }, dir, f, { ppm: PPM })))).size);
        const ok = order && held <= span && own && gvOk && pics.every(c => c === PISTOL_WALK_N);
        rows.push(`${cycle} ${posture}: glide ${2 * n} frames to keys ${ks.join('')} (held ${held}, span ${span}); the gait view ${runs.join(' ')}; pictures ${pics.join('/')}`);
        if (!ok) bad.push({ cycle, posture, order, held, span, own, gvOk, runs, pics });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(bad.length === 0, JSON.stringify(bad));
    },
  },
];
