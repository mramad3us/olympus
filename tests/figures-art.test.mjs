// OLYMPUS tests: the figures' art (src/art/figures/). Proportions, frames, facings, shading, sheets, flashes.
//
// Pure tests (no GPU): they compose and shade frames in node at both densities (the density is an
// argument of every painter here, so one run checks 16 px/m, the user's pick, and 24, the one-constant
// rule's guard) for the chibi, the one figure since the user's pick (2026-11-06, VIEWS §2.3), and print the numbers that matter: the figures' heights and heads, the frames that compose, the
// sheet and its bands, what a band costs to paint, and the palette the camouflage lands on.
import { createHash } from 'node:crypto';
import { assert } from './helpers.mjs';
import { bodyOf } from '../src/art/figures/body.js';
import { FRAMES, DIRS, BANDS, STEP_M, gaitFrame, gunPose, tumbleFrame, turnOf, KICK_MS, FLASH_MS, AFTER_MS, cellKind } from '../src/art/figures/poses.js';
import { composeFrame } from '../src/art/figures/compose.js';
import { shade, INK } from '../src/art/figures/shade.js';
import { wear, coloursOf, OUTFITS, VALLES } from '../src/art/figures/outfits.js';
import { sheetLayout, paintBand, paintSheet, flashStrip, shapeKey } from '../src/art/figures/atlas.js';
import { unword } from '../src/art/paint.js';
import { TRADECRAFT, nearest } from '../src/art/palette.js';
import { oklch } from '../src/art/tone.js';

const PPMS = [16, 24];
const box = (cells) => {
  let x0 = Infinity, x1 = -1, y0 = Infinity, y1 = -1;
  cells.forEach((row, y) => row.forEach((c, x) => { if (c) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }));
  return { x0, x1, y0, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
};
const partsOf = (cells, test) => { const s = new Set(); cells.forEach(r => r.forEach(c => { if (c && test(c)) s.add(c.part); })); return [...s]; };

export default [
  {
    name: 'the chibi stands life-size (about 1.8 m) and its head is about 2.4 of its height (the user\'s pick, 2026-11-06: 16 px/m chibi)',
    fn() {
      const prop = 'chibi';
      for (const ppm of PPMS) {
        const fr = composeFrame({ outfit: 'pt', weapon: null, hair: { style: 'lowReg' } }, 'down', 'idle0', { ppm });
        const b = box(fr.cells), B = bodyOf(ppm), heightM = b.h / ppm, heads = b.h / B.head.h;
        console.log(`      ${prop} at ${ppm} px/m: ${b.h} px tall (${heightM.toFixed(2)} m with hair), head ${B.head.w} × ${B.head.h} px, ${heads.toFixed(2)} heads; cell ${fr.w} × ${fr.h}`);
        assert(heightM > 1.6 && heightM < 1.95, `${prop}@${ppm}: ${heightM} m`);
        assert(heads > 2.0 && heads < 2.7, `${prop}@${ppm}: ${heads} heads`);
        // (the soles end on the anchor's row; a toe nearer the camera may go a pixel or two below it, into the cell's foot room)
        assert(b.y1 + 1 >= fr.ay && b.y1 + 1 <= fr.ay + Math.round(0.125 * ppm), `${prop}@${ppm}: the soles end on the anchor's row (${b.y1 + 1} vs ${fr.ay})`);
      }
    },
  },
  {
    name: 'every frame composes in all four facings at both densities, and stays inside its cell',
    fn() {
      const looks = [{ outfit: 'carrier', weapon: 'rifle', carry: 'low' }, { outfit: 'vac', weapon: 'pistol', carry: 'slung' }, { outfit: 'civilian', weapon: null }];
      let n = 0, empty = 0;
      const t0 = performance.now();
      const prop = 'chibi';
      for (const ppm of PPMS) for (const look of looks) for (const frame of FRAMES) for (const dir of DIRS) {
        const fr = composeFrame(look, dir, frame, { ppm });
        const b = box(fr.cells);
        if (b.x1 < 0) { empty++; continue; }
        assert(fr.cells.length === fr.h && fr.cells[0].length === fr.w, `${frame} ${dir}: the grid is its cell`);
        assert(fr.kind === cellKind(frame, dir), `${frame} ${dir}: cell ${fr.kind}`);
        // (a lying or tumbling figure is fitted: none of it on the cell's edge)
        if (fr.kind !== 'stand') assert(b.x0 > 0 && b.y0 > 0 && b.x1 < fr.w - 1, `${prop}@${ppm} ${frame} ${dir}: fitted inside its ${fr.kind} cell (${JSON.stringify(b)} in ${fr.w}×${fr.h})`);
        n++;
      }
      console.log(`      ${n} frames composed (${FRAMES.length} frames × ${DIRS.length} facings × 2 densities × 3 looks) in ${(performance.now() - t0).toFixed(0)} ms; ${empty} empty`);
      assert(empty === 0, `${empty} frames drew nothing`);
    },
  },
  {
    name: 'the rifle stays in the right hand whichever way they face: a true left view, not the right mirrored (VIEWS.md 3.2)',
    fn() {
      for (const prop of ['chibi']) {
        const look = wear({ outfit: 'utilities', weapon: 'rifle' });
        const gunAt = (fr) => partsOf(fr.cells, c => c.ch === 'n' || c.ch === 'v'), headAt = (fr) => Math.min(...partsOf(fr.cells, c => c.ch === 's' && c.part > 3));
        const right = composeFrame(look, 'right', 'aim', { ppm: 16 }), left = composeFrame(look, 'left', 'aim', { ppm: 16 });
        // (facing right the right side is toward the camera: the shouldered rifle is drawn over the head; facing left, behind it)
        const gr = Math.max(...gunAt(right)), gl = Math.max(...gunAt(left));
        let differ = 0;
        const W = right.w;
        for (let y = 0; y < right.h; y++) for (let x = 0; x < W; x++) { const a = right.cells[y][x], b = left.cells[y][W - 1 - x]; if (!!a !== !!b || (a && b && a.ch !== b.ch)) differ++; }
        console.log(`      ${prop}: aiming right the gun is part ${gr} (the head ${headAt(right)}); aiming left part ${gl} (the head ${headAt(left)}); left differs from the mirrored right in ${differ} pixels`);
        assert(gr > headAt(right), `${prop}: facing right, the rifle is over the head`);
        assert(gl < headAt(left), `${prop}: facing left, the rifle is behind the head (the far side)`);
        assert(differ > 10, `${prop}: the left view is drawn, not mirrored`);
      }
    },
  },
  {
    name: 'walks, runs and bounds advance by distance (STEP_M), so feet never slide; idling runs at 2 fps by a person\'s phase; tumbles turn by 45°',
    fn() {
      const seq = (gait, step, n) => Array.from({ length: n }, (_, i) => gaitFrame(gait, { stride: i * step + 1e-6 }));
      const w = seq('walk', STEP_M.walk, 5), r = seq('run', STEP_M.run, 5), b = seq('bound', STEP_M.bound, 5);
      console.log(`      walk ${STEP_M.walk} m a frame: ${w.join(' ')}; run ${STEP_M.run} m: ${r.join(' ')}; bound ${STEP_M.bound} m: ${b.join(' ')}`);
      assert(w.join() === 'walk0,walk1,walk2,walk3,walk0' && r[4] === 'run0' && b[2] === 'bound2', 'one frame a step');
      assert(gaitFrame('idle', { tS: 0.6 }) === 'idle1' && gaitFrame('idle', { tS: 1.1 }) === 'idle0', 'idle at 2 fps');
      assert(gaitFrame('idle', { tS: 0, phase: 1 }) === 'idle1', 'a phase offsets idling');
      assert(tumbleFrame(Math.PI / 4) === 'tumble1' && tumbleFrame(0.1) === 'float0' && tumbleFrame(-Math.PI / 2) === 'tumble6', 'tumbles by 45°');
    },
  },
  {
    name: 'gunPose follows tradecraft\'s timings: aimed, the kick for KICK_MS, the flash for FLASH_MS, the arms up AFTER_MS; turned off the facing; prone and kneeling fire their own frames',
    fn() {
      const a = { x: 0, z: 0, face: 'right', gait: 'idle', $aim: { x: 5, z: 0, ms: 0 } };
      const at = (ms, extra = {}) => gunPose({ ...a, ...extra }, ms);
      console.log(`      aimed: ${at(500).frame}; shot at 1000, at 1050: ${at(1050, { $shot: 1000 }).frame} flash ${at(1050, { $shot: 1000 }).flash}; at 1100: ${at(1100, { $shot: 1000 }).frame} flash ${at(1100, { $shot: 1000 }).flash}; at 1200: ${at(1200, { $shot: 1000 }).frame}`);
      assert(at(500).frame === 'aim' && !at(500).flash, 'aimed');
      assert(at(1000 + FLASH_MS - 1, { $shot: 1000 }).flash && !at(1000 + FLASH_MS + 1, { $shot: 1000 }).flash, 'the flash');
      assert(at(1000 + KICK_MS - 1, { $shot: 1000 }).frame === 'fire' && at(1000 + KICK_MS + 1, { $shot: 1000 }).frame === 'aim', 'the kick');
      assert(gunPose({ ...a, $aim: null, $shot: 1000 }, 1000 + AFTER_MS - 1).frame !== null && gunPose({ ...a, $aim: null, $shot: 1000 }, 1000 + AFTER_MS + 1).frame === null, 'arms kept up AFTER_MS');
      assert(at(500, { $aim: { x: 5, z: -3, ms: 0 } }).frame === 'aimhi' && at(500, { $aim: { x: 5, z: 3, ms: 0 } }).frame === 'aimlo', 'up and down the picture side on');
      assert(turnOf('down', Math.atan2(3, 3)) === -1 || turnOf('down', Math.atan2(3, 3)) === 1, 'turned from the front');
      assert(at(1050, { $shot: 1000, stance: 'prone' }).frame === 'pronefire' && at(1500, { stance: 'kneel' }).frame === 'kneel', 'prone and kneeling');
    },
  },
  {
    name: 'shading follows tradecraft\'s rules: an ink outline round the silhouette, lit top edges, shaded bottom edges, inner lines, glows carried in the alpha',
    fn() {
      for (const ppm of PPMS) {
        const L = wear({ outfit: 'vac', weapon: null });
        const fr = composeFrame(L, 'down', 'idle0', { ppm }), pm = shade(fr.cells, coloursOf(L, ppm));
        let outline = 0, missing = 0, glows = 0, colours = new Set();
        for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
          const v = unword(pm.data[y * pm.w + x]);
          if (fr.cells[y][x]) { colours.add(v.hex); if (v.glow) glows++; continue; }
          const next = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => fr.cells[y + dy]?.[x + dx]);
          if (next) { if (v.hole || v.hex !== INK) missing++; else outline++; }
        }
        console.log(`      vac suit at ${ppm} px/m: ${outline} ink outline pixels (${missing} missing), ${colours.size} colours, ${glows} glowing pixels (the chest display)`);
        assert(missing === 0 && outline > 60, 'an unbroken outline');
        assert(glows > 0, 'the chest display glows');
      }
    },
  },
  {
    name: 'the Valles pattern lands on rust, ochre, umber, basalt and dust pink by day, not yellow: a camouflaged cover read as blond hair before (my call, checked through tradecraft\'s grade and snap)',
    fn() {
      const grade = (hex) => {
        let c = [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map(v => v / 255);
        const l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
        c = c.map((v, i) => (v + (l - v) * 0.18) * [1.05, 1.0, 0.9][i] + Math.max(0, 0.35 - l) * [0.03, -0.01, 0.05][i]);
        return c.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255)).reduce((a, v) => a * 256 + v, 0);
      };
      const out = Object.entries(VALLES).map(([k, c]) => { const s = nearest(grade(c), TRADECRAFT), [L, C, h] = oklch(s); return { k, s, L, C, h }; });
      console.log(`      ${out.map(o => `${o.k} → #${o.s.toString(16).padStart(6, '0')} (L ${o.L.toFixed(2)}, h ${o.h.toFixed(0)}°)`).join('; ')}`);
      for (const o of out) assert(o.C < 0.02 || o.h < 66, `${o.k} snaps yellow (h ${o.h.toFixed(0)}°)`);
    },
  },
  {
    name: 'a sheet is laid out in bands, every cell inside its band; the atlas holds 40 looks at 16 px/m and 15 at 24 (0.0.4: the move and rest bands\' 84 cells took it from 64 and 25; a sleeper in a rack takes no look, the squad\'s PT and utilities 27 at the klaxon)',
    fn() {
      const prop = 'chibi';
      for (const ppm of PPMS) {
        const lay = sheetLayout(ppm);
        for (const c of lay.cells.values()) {
          const b = lay.bands[c.band];
          assert(c.x >= b.x && c.y >= b.y && c.x + c.w <= b.x + b.w && c.y + c.h <= b.y + b.h, `${c.frame} ${c.dir} outside its band`);
          assert(c.ax >= 0 && c.ax < c.w && c.ay > 0 && c.ay <= c.h, `${c.frame} ${c.dir}: anchor ${c.ax},${c.ay} in ${c.w}×${c.h}`);
        }
        const slots = Math.floor(4096 / lay.w) * Math.floor(4096 / lay.h);
        const kb = (r) => Math.round(r.w * r.h * 4 / 1024);
        console.log(`      ${prop} at ${ppm} px/m: sheet ${lay.w} × ${lay.h} (${kb(lay)} KB), ${lay.cells.size} cells; bands ${Object.entries(lay.bands).map(([k, r]) => `${k} ${r.w}×${r.h} (${kb(r)} KB)`).join(', ')}; ${slots} looks in a 4096² atlas`);
        assert(lay.cells.size === FRAMES.length * DIRS.length, 'every frame and facing has a cell');
        assert(slots >= (ppm === 16 ? 40 : 15), `${slots} slots`);
      }
    },
  },
  {
    name: 'looks of one shape share their composed frames: a second face in the same outfit pays only for its shading',
    fn() {
      for (const ppm of PPMS) {
        const looks = [0, 1, 2, 3].map(i => ({ outfit: 'utilities', weapon: 'rifle', carry: 'slung', seed: 10 + i, skin: ['tan', 'light', 'brown', 'dark'][i] }));
        assert(new Set(looks.map(l => shapeKey(wear(l)))).size === 1, 'one shape');
        const ms = looks.map(l => paintBand(l, 'gait', { ppm }).ms);
        console.log(`      gait band (${BANDS.gait.length} frames × 4 facings) at ${ppm} px/m: first face ${ms[0].toFixed(1)} ms, then ${ms.slice(1).map(v => v.toFixed(1)).join(', ')} ms`);
        assert(Math.min(...ms.slice(1)) < ms[0], 'cheaper the second time');
      }
    },
  },
  {
    name: 'a look paints the same sheet byte for byte every time (no Math.random: hashes and seeds), and a seed changes only its camouflage',
    fn() {
      const h = (pm) => createHash('sha1').update(Buffer.from(pm.data.buffer)).digest('hex').slice(0, 12);
      const a = paintSheet({ outfit: 'carrier', weapon: 'rifle', seed: 4 }, { ppm: 16 }), b = paintSheet({ outfit: 'carrier', weapon: 'rifle', seed: 4 }, { ppm: 16 });
      const c = paintSheet({ outfit: 'carrier', weapon: 'rifle', seed: 5 }, { ppm: 16 });
      console.log(`      carrier, chibi, 16 px/m: ${h(a)} twice ${h(b)}; seed 5: ${h(c)}`);
      assert(h(a) === h(b), 'the same twice');
      assert(h(a) !== h(c), 'another seed, another camouflage');
    },
  },
  {
    name: 'every fire frame of both guns in every facing has its flash in the strip, a burst side on and a star at the camera',
    fn() {
      for (const ppm of PPMS) {
        const s = flashStrip(ppm);
        const side = [...s.index.keys()].filter(k => k.includes('|right|') || k.includes('|left|')).length;
        console.log(`      ${ppm} px/m: ${s.count} flashes in a ${s.pm.w} × ${s.pm.h} strip (${side} side on), each in a ${s.size}-px square`);
        for (const gun of ['rifle', 'pistol']) for (const dir of DIRS) for (const f of ['fire', 'firehi', 'firelo', 'kneelfire']) assert(s.index.has(`${gun}|${dir}|${f}`), `${gun} ${dir} ${f}`);
      }
    },
  },
  {
    name: 'every outfit dresses the figure differently: seven looks, seven palettes of pixels',
    fn() {
      const sig = OUTFITS.map(o => { const L = wear({ outfit: o, weapon: null }); const fr = composeFrame(L, 'down', 'idle0', { ppm: 16 }); const pm = shade(fr.cells, coloursOf(L, 16)); return createHash('sha1').update(Buffer.from(pm.data.buffer)).digest('hex').slice(0, 8); });
      console.log(`      ${OUTFITS.map((o, i) => `${o} ${sig[i]}`).join(', ')}`);
      assert(new Set(sig).size === OUTFITS.length, 'all different');
    },
  },
];
