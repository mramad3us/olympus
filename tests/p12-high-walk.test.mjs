// OLYMPUS tests: the P-12's high-ready walk, within the atlas's slots (v0.0.24, carried from v0.0.23: its play review's finding 7),
// and the stance sheet's two frames nothing drew.
//
// v0.0.23's play review, finding 7: the high-ready pistol walked drawn at the low ready (the pistol band had the low ready's walk and
// the aimed one only). Four more frames in the pistol band would not fit the atlas: the rifle pool's sheet (1360 px at 16 px/m, 2040 at
// 24) goes three and two across a 4096 atlas with 16 px to spare, so one more frame takes the rifle sheets from 6 to 4 at 16 px/m and
// the base sheets from 15 to 10 at 24. They are a band of the stance pool instead (poses.js BANDS.stancePistol), on the shots' shelf,
// painted in the high carry's stance sheet only, which every armed mover has before GO: no sheet grows, no slot is taken. Held here:
//   - the gait view draws pistolHighWalk0 to 3 in order over the whole cycle for a mover in a stance at the high ready (pistolSheet),
//     the low ready's walk otherwise and for the low ready, in cycles A, B and C;
//   - each frame holds the pistol up at the chest as pistolHigh stands (the muzzle within 2 px of pistolHigh's, at least 12 px above
//     the low ready walk's, in every facing), over the low ready walk's legs and its hanging R-7's swing (its pose the low walk's key
//     but for the rig: the legs, feet, lean and stride the same), four distinct frames a facing;
//   - the atlas: the stance sheet 512 × 576 at 16 px/m and 768 × 864 at 24 as before, in its base slot; the rifle pool 1360 × 152 and
//     2040 × 228 as before; so, by figures.js's own count, 40 and 15 base slots and 6 and 6 rifle sheets, before and after; the band
//     painted whole in the high carry's stance sheet;
//   - the stance sheet's 'draw' and 'pistolAim' are gone (no frame the game draws asked them since v0.0.23's pistol band), while
//     walk.js beatPose still poses them for the three sample pages that draw them.
// Fails without the band (no pistolHighWalk frame: the gait view draws pistolWalk at the high ready) and with the two frames back.
import { assert } from './helpers.mjs';
import { composeFrame } from '../src/art/figures/compose.js';
import { wear } from '../src/art/figures/outfits.js';
import { BANDS, DIRS, FRAMES, POOL_OF, STANCE_BANDS, PISTOL_HIGH_BAND, PISTOL_HIGH_CARRY, PISTOL_WALK_N, pistolWalkOf } from '../src/art/figures/poses.js';
import { bandSpec, beatPose, CYCLE_IDS } from '../src/art/figures/walk.js';
import { sheetLayout, paintBand } from '../src/art/figures/atlas.js';
import { createGaitView } from '../src/render/gait-view.js';
import { hash } from '../src/core/hash.js';

const PPM = 24;
const LOOK = wear({ outfit: 'utilities', weapon: 'rifle', carry: 'front', armour: true, gloves: true, seed: 4 });
const ATLAS_PX = 4096, RIFLE_SLOTS_MIN = 4;
/** figures.js createFigures's count of the atlas's slots for a layout: { base, rifle } (its own lines, copied: the module needs three.js). */
function slotsOf(lay, atlasPx = ATLAS_PX) {
  const RL = lay.pools.rifle, COLS = Math.floor(atlasPx / lay.w), RCOLS = Math.max(1, Math.floor(atlasPx / RL.w));
  let ROWS = Math.floor(atlasPx / lay.h);
  while (ROWS > 1 && Math.floor((atlasPx - ROWS * lay.h) / RL.h) * RCOLS < RIFLE_SLOTS_MIN) ROWS--;
  return { base: COLS * ROWS, rifle: RCOLS * Math.floor((atlasPx - ROWS * lay.h) / RL.h) };
}
const cellsKey = (fr) => hash(fr.cells.map(r => r.map(c => (c ? c.ch : '.')).join('')).join('|')).toString(16);

export default [
  {
    name: 'the P-12 at the high ready walks drawn at the high ready (v0.0.23\'s play review, finding 7): through the gait view pistolHighWalk0 to 3 in order over the whole cycle for a mover in a stance, the pistol up at the chest as pistolHigh stands over the low walk\'s legs, in every facing and cycle; the low ready and a walker with no stance sheet as before',
    fn() {
      const rows = [], bad = [];
      for (const cycle of CYCLE_IDS) for (const [posture, sheet, want] of [['highReady', true, 'pistolHighWalk'], ['highReady', false, 'pistolWalk'], ['lowReady', true, 'pistolWalk']]) {
        const gv = createGaitView(), runs = [], n = bandSpec(cycle, 'combat').n;
        for (let i = 0; i <= 80; i++) {
          const gp = i * 2 / 80;
          const out = gv.draw({ id: 'p', ms: i * 50, tickMs: i * 50, free: true, simFace: 'right', yawRad: 0, turnsByYaw: true, walking: true, travelRad: 0, stride: gp * 0.6, gp, stepM: 0.6, vMs: 1.2, band: 'combat', sheet: false, pistolSheet: sheet, kick: false, aimed: false, beat: null, action: null, pistol: { posture }, gMs2: 3.71, cycle });
          if (!runs.length || runs.at(-1) !== out.frame) runs.push(out.frame);
        }
        const keys = Array.from({ length: PISTOL_WALK_N }, (_, k) => `${want}${k}`);
        const ok = runs.slice(0, PISTOL_WALK_N).join() === keys.join() && runs.slice(PISTOL_WALK_N).every(f => f === keys[0]) && pistolWalkOf({ posture }, { step: 1, j: n - 1 }, n, { sheet }) === keys.at(-1);
        rows.push(`${cycle} ${posture}${sheet ? ', stance sheet' : ''}: ${runs.join(' ')}`);
        if (!ok) bad.push({ cycle, posture, sheet, runs });
      }
      // (the pictures: the muzzle up at the chest as pistolHigh's, the legs and the swinging R-7 below the belt the low walk's)
      const pics = [];
      for (const dir of DIRS) {
        const high = composeFrame(LOOK, dir, 'pistolHigh', { ppm: PPM }), seen = new Set();
        for (let k = 0; k < PISTOL_WALK_N; k++) {
          const a = composeFrame(LOOK, dir, `pistolHighWalk${k}`, { ppm: PPM }), b = composeFrame(LOOK, dir, `pistolWalk${k}`, { ppm: PPM });
          seen.add(cellsKey(a));
          const keys = [...new Set([...Object.keys(a.pose), ...Object.keys(b.pose)])], legs = keys.every(f => f === 'rig' || JSON.stringify(a.pose[f]) === JSON.stringify(b.pose[f])) && a.pose.rig.mode === 'high' && b.pose.rig.mode === 'low' && a.pose.rig.hang === b.pose.rig.hang;
          const up = a.muzzle && b.muzzle ? b.muzzle[1] - a.muzzle[1] : null, asHigh = a.muzzle && high.muzzle ? Math.abs(a.muzzle[1] - high.muzzle[1]) : null;
          pics.push(`${dir}${k} up ${up} px, ${asHigh} px off pistolHigh${legs ? '' : ', LEGS DIFFER'}`);
          if (!(up >= 12 && asHigh <= 2 && legs)) bad.push({ dir, k, up, asHigh, legs });
        }
        if (seen.size !== PISTOL_WALK_N) bad.push({ dir, distinct: seen.size });
      }
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      the frames: ${pics.join('; ')}`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'the high-ready walk takes no slot of the atlas: the stance sheet 512 × 576 and 768 × 864 and the rifle pool 1360 × 152 and 2040 × 228 as before, so 40 and 15 base slots and 6 and 6 rifle sheets at 16 and 24 px/m; its band on the shots\' shelf, painted whole in the high carry\'s stance sheet only',
    fn() {
      const want = { 16: { stance: [512, 576], rifle: [1360, 152], base: 40, rifleSheets: 6 }, 24: { stance: [768, 864], rifle: [2040, 228], base: 15, rifleSheets: 6 } }, bad = [];
      for (const ppm of [16, 24]) {
        const lay = sheetLayout(ppm), st = lay.pools.stance, rl = lay.pools.rifle, sl = slotsOf(lay), b = lay.bands[PISTOL_HIGH_BAND], shots = lay.bands.stanceShots, w = want[ppm];
        console.log(`      ${ppm} px/m: the stance sheet ${st.w} × ${st.h} in a base slot of ${lay.w} × ${lay.h}; the rifle pool ${rl.w} × ${rl.h}; ${sl.base} base slots and ${sl.rifle} rifle sheets (${w.base} and ${w.rifleSheets} before); the band at ${b.x}, ${b.y} (${b.w} × ${b.h}) beside the shots at ${shots.x}, ${shots.y}`);
        if (st.w !== w.stance[0] || st.h !== w.stance[1] || rl.w !== w.rifle[0] || rl.h !== w.rifle[1] || sl.base !== w.base || sl.rifle !== w.rifleSheets || b.y !== shots.y || b.pool !== 'stance') bad.push({ ppm, st, rl, sl, b, shots });
      }
      // (painted whole in the high carry's stance sheet: every cell of the band has a body in it)
      const lay = sheetLayout(16), pb = paintBand({ ...LOOK, carry: PISTOL_HIGH_CARRY, sheet: 'stance' }, PISTOL_HIGH_BAND, { ppm: 16 });
      let blank = 0;
      for (const f of BANDS[PISTOL_HIGH_BAND]) for (const d of DIRS) {
        const c = lay.cells.get(`${f}|${d}`);
        let px = 0;
        for (let y = c.y - pb.rect.y; y < c.y - pb.rect.y + c.h; y++) for (let x = c.x - pb.rect.x; x < c.x - pb.rect.x + c.w; x++) if ((pb.pm.data[y * pb.rect.w + x] >>> 24) >= 128) px++;
        if (px < 60) blank++;
      }
      console.log(`      ${BANDS[PISTOL_HIGH_BAND].length * DIRS.length} cells painted in the high carry's stance sheet, ${blank} blank; pools ${POOL_OF[PISTOL_HIGH_BAND]}`);
      assert(!bad.length && !blank && STANCE_BANDS.includes(PISTOL_HIGH_BAND) && PISTOL_HIGH_CARRY === 'high', JSON.stringify({ bad, blank }));
    },
  },
  {
    name: 'the stance sheet no longer paints \'draw\' and \'pistolAim\' (no frame the game draws asked them since v0.0.23\'s pistol band); walk.js beatPose still poses them for the three sample pages that draw them (p12-draw, pistol-stances, portrait-pose)',
    fn() {
      const gone = ['draw', 'pistolAim'], lay = sheetLayout(16);
      const inSheet = gone.filter(f => FRAMES.includes(f) || DIRS.some(d => lay.cells.has(`${f}|${d}`)) || STANCE_BANDS.some(b => BANDS[b].includes(f)));
      const posed = gone.filter(f => beatPose(f, { weapon: 'pistol' }));
      console.log(`      the stance shots: ${BANDS.stanceShots.join(', ')}; in a sheet: ${inSheet.join(', ') || 'none'}; posed by beatPose: ${posed.join(', ')}`);
      assert(!inSheet.length && posed.length === 2 && BANDS.stanceShots.join() === 'fireMove0,fireMove1', JSON.stringify({ inSheet, posed, shots: BANDS.stanceShots }));
    },
  },
];
