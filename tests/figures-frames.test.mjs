// OLYMPUS tests: the figures' new frames of 0.0.4 (the look picked: 16 px/m chibi), the towel, the body's cues on the sprite.
//
// The build sheet 0.0.4 §5.3: "every new frame and the towel in four directions, in its cell, on the
// palette, none blank". The new frames are ROADMAP §4.6's held set (VIEWS §3.4): the stroll, the stairs
// up and down, the look and the glance (the move band), the berth's transitions (sitUp, standUp, climb,
// lieDown with sit), dressing (two frames), the basin, the toothbrush and the razor (the rest band); the
// towel outfit (at the waist bare chested, at the chest for a woman, shower shoes); the wet head and the
// tired walk (VIEWS §7.3). Each is composed facing down, up, right and left at 16 px/m (the user's pick)
// and 24 (the test density), and the test holds: drawn (not blank), inside its cell (the soles on the
// anchor's row for a standing frame: the crouch of standUp and the climb's raised knee are seen with their
// feet forward of the body's middle, so higher in the picture), every pixel's colour within PALETTE_E of the MARS palette's nearest
// after the stage's snap would take it (the worst printed), the frames distinct from each other where
// they should be (a stroll is not the walk, the stairs are not the walk, the glance is not the idle),
// the towel distinct from PT kit and a woman's from a man's, a wet head and a tired walk distinct from
// the dry and the rested, and the berth's paintings (breathing, sat up, a curtain part drawn) distinct.
// It prints the counts, the sheet's bands and the worst palette distance.
import { assert, fmt } from './helpers.mjs';
import { BANDS, DIRS, STEP_M, gaitFrame, poseOf, TRANSITION_FRAMES } from '../src/art/figures/poses.js';
import { composeFrame } from '../src/art/figures/compose.js';
import { paintFrame, sheetLayout, shapeKey } from '../src/art/figures/atlas.js';
import { wear, OUTFITS } from '../src/art/figures/outfits.js';
import { paintSleeper, sleeperKey, BERTH_M, BREATH_HZ, CURTAIN_STEPS } from '../src/art/figures/bedding.js';
import { STRIDE_WRAP_M } from '../src/data/body/gait.js';
import { PALETTES, paletteDistance } from '../src/art/palette.js';
import { rgbOf } from '../src/art/tone.js';
import { paint, unword } from '../src/art/paint.js';

const NEW = ['stroll0', 'stroll1', 'stroll2', 'stroll3', 'stairsUp0', 'stairsUp1', 'stairsUp2', 'stairsUp3', 'stairsDown0', 'stairsDown1', 'stairsDown2', 'stairsDown3',
  'look', 'glance', 'sitUp', 'standUp', 'climb', 'lieDown', 'dress0', 'dress1', 'basin', 'brush', 'shave'];
/** How far a figure's colour may sit from the palette's nearest (tradecraft's metric on 0..1 RGB): the stage snaps everything, this says the ramps land near a colour of their own. */
const PALETTE_E = 0.02;
const LOOK = { skin: 'tan', hair: { style: 'short', color: 'brown' }, head: null };
const opaque = (pm) => { let n = 0; for (const v of pm.data) if ((v >>> 24) >= 128) n++; return n; };
const sig = (pm) => { let h = 2166136261; for (const v of pm.data) { h ^= v; h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
const diff = (a, b) => { let n = 0; for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) n++; return n; };

export default [
  {
    name: 'every new frame composes facing down, up, right and left at 16 and 24 px/m, drawn, inside its cell, its colours near the MARS palette (the build sheet 0.0.4 §5.3)',
    fn() {
      const mars = PALETTES.mars.map(rgbOf);
      let n = 0, worst = { e: 0 }, blank = [];
      const t0 = performance.now();
      for (const ppm of [16, 24]) for (const outfit of ['utilities', 'pt', 'towel']) for (const frame of NEW) for (const dir of DIRS) {
        const look = { ...LOOK, outfit }, fr = composeFrame(look, dir, frame, { ppm }), pf = paintFrame(look, dir, frame, { ppm });
        n++;
        const px = opaque(pf.pm);
        if (px < 40 * (ppm / 16) ** 2) blank.push(`${outfit} ${frame} ${dir}@${ppm}: ${px}`);
        let y1 = -1;
        fr.cells.forEach((row, y) => row.forEach(c => { if (c) y1 = Math.max(y1, y); }));
        if (fr.kind === 'stand' && !poseOf(frame).noLegs && !['standUp', 'climb'].includes(frame)) assert(y1 + 1 >= fr.ay - 1 && y1 + 1 <= fr.ay + Math.round(0.125 * ppm), `${frame} ${dir}@${ppm}: the soles on the anchor's row (${y1 + 1} vs ${fr.ay})`);
        for (const v of pf.pm.data) {
          if ((v >>> 24) < 128) continue;
          const [r, g, b] = rgbOf(unword(v).hex);
          let e = Infinity;
          for (const [pr, pg, pb] of mars) e = Math.min(e, paletteDistance(r, g, b, pr, pg, pb));
          if (e > worst.e) worst = { e, frame, dir, ppm, outfit, hex: unword(v).hex.toString(16) };
        }
      }
      console.log(`      ${n} frames composed (${NEW.length} new frames × 4 facings × 3 outfits × 2 densities) in ${fmt(performance.now() - t0, 0)} ms; ${blank.length} blank`);
      console.log(`      the worst colour's distance to the MARS palette: ${fmt(worst.e, 4)} (#${worst.hex}, ${worst.outfit} ${worst.frame} ${worst.dir} at ${worst.ppm} px/m; at most ${PALETTE_E})`);
      assert(!blank.length, blank.join('; '));
      assert(worst.e <= PALETTE_E, JSON.stringify(worst));
    },
  },
  {
    name: 'the new frames are frames of their own: a stroll is not the walk, the stairs are neither, the look and the glance turn the head off the idle, dressing\'s two frames differ',
    fn() {
      const look = { ...LOOK, outfit: 'utilities' }, pf = (f, d = 'down') => paintFrame(look, d, f, { ppm: 16 }).pm;
      const pairs = [['stroll0', 'walk0'], ['stairsUp0', 'walk0'], ['stairsDown0', 'walk0'], ['stairsUp0', 'stairsDown0'], ['look', 'idle0'], ['glance', 'idle0'], ['dress0', 'dress1'], ['sitUp', 'sit'], ['standUp', 'idle0'], ['climb', 'idle0'], ['brush', 'basin'], ['shave', 'brush']];
      const rows = [];
      for (const [a, b] of pairs) for (const d of ['down', 'right']) {
        const n = diff(pf(a, d), pf(b, d));
        rows.push(`${a}/${b} ${d} ${n}`);
        assert(n >= 6, `${a} and ${b} facing ${d} differ in ${n} pixels`);
      }
      console.log(`      pixels apart at 16 px/m: ${rows.join(', ')}`);
    },
  },
  {
    name: 'the stroll and the stairs advance by distance as the walk does (STEP_M 0.12 and 0.14 m a frame), and their cycles divide the stride\'s ring, so feet never slide and a wrap never jumps a frame',
    fn() {
      const s = [0, 0.12, 0.24, 0.36, 0.48].map(m => gaitFrame('stroll', { stride: m + 1e-6 })), u = [0, 0.14, 0.28, 0.42, 0.56].map(m => gaitFrame('stairsUp', { stride: m + 1e-6 }));
      console.log(`      stroll ${STEP_M.stroll} m a frame: ${s.join(' ')}; stairs ${STEP_M.stairs} m: ${u.join(' ')}; the ring ${STRIDE_WRAP_M} m holds ${fmt(STRIDE_WRAP_M / (4 * STEP_M.stroll), 1)} and ${fmt(STRIDE_WRAP_M / (4 * STEP_M.stairs), 1)} cycles`);
      assert(s.join() === 'stroll0,stroll1,stroll2,stroll3,stroll0' && u.join() === 'stairsUp0,stairsUp1,stairsUp2,stairsUp3,stairsUp0', 'one frame a step');
      for (const k of ['stroll', 'stairs']) { const c = STRIDE_WRAP_M / (4 * STEP_M[k]); assert(Math.abs(c - Math.round(c)) < 1e-9, `${k}: ${c} cycles`); }
      assert(Object.values(TRANSITION_FRAMES).every(f => f === null || BANDS.rest.includes(f)), 'every transition frame is in the rest band');
    },
  },
  {
    name: 'the towel: at the waist bare chested, at the chest for a woman, shower shoes, no cover; every outfit draws differently (eight looks now)',
    fn() {
      const man = paintFrame({ ...LOOK, outfit: 'towel' }, 'down', 'idle0', { ppm: 16 }).pm, woman = paintFrame({ ...LOOK, outfit: 'towel', sex: 'f', hair: { style: 'bun', color: 'brown' } }, 'down', 'idle0', { ppm: 16 }).pm;
      const pt = paintFrame({ ...LOOK, outfit: 'pt' }, 'down', 'idle0', { ppm: 16 }).pm;
      const L = wear({ ...LOOK, outfit: 'towel' }), F = wear({ ...LOOK, outfit: 'towel', sex: 'f' });
      const sigs = OUTFITS.map(o => sig(paintFrame({ outfit: o }, 'down', 'idle0', { ppm: 16 }).pm));
      console.log(`      a man's towel ${L.top.kind}/${L.legs.kind}, a woman's ${F.top.kind}/${F.legs.kind}; the towel apart from PT kit in ${diff(man, pt)} pixels, a woman's from a man's in ${diff(man, woman)}; ${new Set(sigs).size} of ${OUTFITS.length} outfits distinct`);
      assert(L.top.kind === 'bare' && L.legs.kind === 'towel' && F.top.kind === 'towelChest' && !L.head && !L.belt, 'the towel\'s layers');
      assert(diff(man, pt) > 40 && diff(man, woman) > 20, 'the towel draws');
      assert(new Set(sigs).size === OUTFITS.length, 'every outfit different');
    },
  },
  {
    name: 'the body\'s cues on the sprite (VIEWS §7.3): wet hair is darker with a sheen, the tired walk carries its head a pixel lower and swings its arms less; both are part of the look\'s shape',
    fn() {
      const dry = { ...LOOK, outfit: 'towel' }, wet = { ...dry, wet: true }, tired = { ...LOOK, outfit: 'utilities', tired: true }, rested = { ...LOOK, outfit: 'utilities' };
      const dW = diff(paintFrame(dry, 'down', 'idle0').pm, paintFrame(wet, 'down', 'idle0').pm);
      const dT = diff(paintFrame(rested, 'right', 'walk0').pm, paintFrame(tired, 'right', 'walk0').pm);
      const swing = (look) => { const p = poseOf('walk0', { tired: !!look.tired }); return Math.abs(p.arms.r[0]) + Math.abs(p.arms.l[0]); };
      const headY = (look) => { const fr = composeFrame(look, 'right', 'walk0'); let y0 = 99; fr.cells.forEach((row, y) => row.forEach(c => { if (c && y < y0) y0 = y; })); return y0; };
      console.log(`      wet against dry: ${dW} pixels; tired against rested walking: ${dT} pixels, the arms' swing ${fmt(swing(tired), 2)} against ${fmt(swing(rested), 2)} rad, the crown's row ${headY(tired)} against ${headY(rested)}`);
      assert(dW >= 8 && dT >= 10, 'the cues show');
      assert(swing(tired) < swing(rested) * 0.6 && headY(tired) === headY(rested) + 1, 'the tired walk');
      assert(shapeKey(wear(wet)) !== shapeKey(wear(dry)) && shapeKey(wear(tired)) !== shapeKey(wear(rested)), 'the cues are in the shape key');
    },
  },
  {
    name: 'the berth breathes (two paintings at BREATH_HZ), sits up (the blanket thrown back, the pillow empty), and its curtain closes in CURTAIN_STEPS steps: each a painting of its own',
    fn() {
      const ppm = 16, w = Math.round(BERTH_M[0] * ppm), h = Math.round(BERTH_M[1] * ppm);
      const o = { blanket: 'olive', skin: 'tan', hair: { style: 'crew', color: 'dark' }, seed: 7, ppm };
      const pm = (more) => paint(w, h, (px) => paintSleeper(px, w, h, { ...o, ...more }));
      const a = pm({ breath: 0 }), b = pm({ breath: 1 }), up = pm({ up: true }), half = pm({ curtain: 'olive', curtainK: 0.5 }), full = pm({ curtain: 'olive' });
      const keys = new Set([{}, { breath: 1 }, { up: true }, { curtain: 'olive', curtainK: 0.5 }, { curtain: 'olive' }].map(m => sleeperKey({ ...o, ...m })));
      console.log(`      a berth ${w} × ${h} px; breathing ${diff(a, b)} pixels apart at ${BREATH_HZ} Hz; sat up ${diff(a, up)}; a curtain half drawn ${diff(a, half)}, drawn ${diff(a, full)}; ${keys.size} keys for 5 paintings; ${CURTAIN_STEPS} steps`);
      assert(diff(a, b) >= 4 && diff(a, b) < 40, 'the blanket rises a little');
      assert(diff(a, up) > 80 && diff(half, full) > 40 && diff(a, half) > 40, 'sat up and the curtain');
      assert(keys.size === 5, 'each its own key');
    },
  },
  {
    name: 'the sheet keeps every band in it: move and rest added, the transitions in rest, a band\'s cells inside it, the gait band unchanged (14 frames)',
    fn() {
      for (const ppm of [16, 24]) {
        const lay = sheetLayout(ppm);
        console.log(`      ${ppm} px/m: sheet ${lay.w} × ${lay.h}; ${Object.entries(lay.bands).map(([k, r]) => `${k} ${BANDS[k].length} frames ${r.w}×${r.h}`).join(', ')}`);
        assert(BANDS.gait.length === 14 && BANDS.move.length === 14 && BANDS.rest.length === 10, 'the bands');
        for (const f of NEW) for (const d of DIRS) assert(lay.cells.has(`${f}|${d}`), `${f} ${d} has a cell`);
      }
    },
  },
];
