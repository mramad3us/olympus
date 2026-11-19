// OLYMPUS tests: the device in the hands as the art draws it (the build sheet v0.0.22 §1 item 17, §6 D; the residuals lens's R3; samples/held-devices' defaults).
//
// Pure, in node. The held strip (atlas.js heldStrip) has a card for every shape and colour of the catalogue (devicetable.js looks; the
// spool, never in a hand, left out), every frame a body with it draws (the idle, the walk, the run, the rifle slung in front; the held
// band's own: templates.js HELD_POSES) and every facing; each card lies inside its cell, the device drawn whole never touches the
// cell's edge (where a longer part would be cut off), and the hand that holds it is on it (its nearest pixel within 1 px of the
// hand's tip; the halligan, the ram and the strip at the leaf by both hands where both hold). Facing you, the held band shows most of
// its device. The held band's frames carry no device (the card does), so a figure with no device is the frame it always was: the
// game's other frames digest to v0.0.19's golden (samples-held's), and no frame drawn for a sheet carries a device letter. heldFrameOf
// names a frame of the band for every shape and beat, each with its cards. The strip's size and its bake are printed.
import { assert } from './helpers.mjs';
import { golden } from './golden.mjs';
import { composeFrame } from '../src/art/figures/compose.js';
import { shade } from '../src/art/figures/shade.js';
import { wear, coloursOf } from '../src/art/figures/outfits.js';
import { FRAMES, DIRS, BANDS, STANCE_BANDS, HELD_BAND, heldFrameOf } from '../src/art/figures/poses.js';
import { BEAT_FRAMES, beatPose } from '../src/art/figures/walk.js';
import { heldStrip, heldKey, sheetLayout, HELD_WALK_FRAMES, HELD_LOOK } from '../src/art/figures/atlas.js';
import { HELD, HELD_POSES, HELD_VARIANTS, HELD_LETTERS } from '../src/art/figures/templates.js';
import { DEVICES } from '../src/sim/arms/devicetable.js';

const PPM = 16, LETTERS = new Set(Object.values(HELD_LETTERS));
// (the hands that hold the device in a frame: the right fist for a hand-held shape's walk and the can's, the strip's and the pin's
// frames; both where the pose puts both on a long tool or on the strip at the leaf)
const holders = (shape, frame) => {
  const P = HELD_POSES[frame];
  if (!P) return ['r'];
  if (frame === 'heldPin') return ['r'];
  return ['r', 'l'].filter(s => P.reach[s]);
};
const framesOf = (shape) => [...HELD_WALK_FRAMES, ...Object.keys(HELD_POSES).filter(f => HELD_POSES[f].parts[shape])];

export default [
  {
    name: 'the held strip: a card for every shape, colour, frame and facing, inside its cell, the device whole, the holding hand on it within 1 px; the catalogue\'s colours, no more',
    fn() {
      const t0 = performance.now(), S = heldStrip(PPM, { check: true }), ms = performance.now() - t0, lay = sheetLayout(PPM);
      const cat = {};
      for (const D of Object.values(DEVICES)) if (D.look && D.look.shape !== 'spool') (cat[D.look.shape] ??= new Set()).add(D.look.colour);
      const catRows = Object.entries(cat).map(([k, v]) => `${k}:${[...v].sort().join('+')}`).sort().join(' '), ours = HELD_VARIANTS.map(([k, v]) => `${k}:${v.join('+')}`).sort().join(' ');
      assert(catRows === ours, JSON.stringify({ catRows, ours }));
      let n = 0, worst = 0, edge = [], far = [], outside = [], missing = [];
      for (const [shape, colours] of HELD_VARIANTS) for (const frame of framesOf(shape)) for (const dir of DIRS) for (const colour of colours) {
        const c = S.index.get(heldKey(shape, colour, frame, dir)), cell = lay.cells.get(`${frame}|${dir}`);
        if (!c) { missing.push(heldKey(shape, colour, frame, dir)); continue; }
        n++;
        if (c.w && (c.ox < 0 || c.oy < 0 || c.ox + c.w > cell.w || c.oy + c.h > cell.h)) outside.push(heldKey(shape, colour, frame, dir));
        if (colour !== colours[0]) continue;
        const A = c.all;
        if (A.px.some(([x, y]) => x <= 0 || y <= 0 || x >= A.w - 1 || y >= A.h - 1)) edge.push(`${shape} ${frame} ${dir}`);
        for (const s of holders(shape, frame)) {
          // (the hand's tip to the nearest device pixel's square, px)
          const t = c.hands[s], dist = Math.min(...A.px.map(([x, y]) => Math.hypot(Math.max(0, Math.abs(x + 0.5 - t[0]) - 0.5), Math.max(0, Math.abs(y + 0.5 - t[1]) - 0.5))));
          worst = Math.max(worst, dist);
          if (dist > 1) far.push(`${shape} ${frame} ${dir} ${s} ${dist.toFixed(2)}`);
        }
      }
      console.log(`      ${n} cards (${S.index.size} in the strip, ${S.pm.w} × ${S.pm.h} px, ${(S.pm.w * S.pm.h * 4 / 1024).toFixed(0)} KB), baked in ${ms.toFixed(0)} ms with the checks; the catalogue's ${catRows}`);
      console.log(`      the holding hand to its device: the farthest ${worst.toFixed(2)} px; outside the cell ${outside.length}, on its edge ${edge.length}, missing ${missing.length}`);
      assert(!missing.length && !outside.length && !edge.length && !far.length, JSON.stringify({ missing: missing.slice(0, 4), outside: outside.slice(0, 4), edge: edge.slice(0, 4), far: far.slice(0, 6) }));
    },
  },
  {
    name: 'facing you, the held band shows its device (at least half its pixels in sight); every shape and beat names a frame of the band with its cards',
    fn() {
      const S = heldStrip(PPM, { check: true }), rows = [];
      for (const [shape, colours] of HELD_VARIANTS) for (const frame of Object.keys(HELD_POSES).filter(f => HELD_POSES[f].parts[shape])) {
        const c = S.index.get(heldKey(shape, colours[0], frame, 'down'));
        rows.push(`${shape} ${frame} ${c.seen}/${c.all.n}`);
        assert(c.seen >= 0.5 * c.all.n, JSON.stringify({ shape, frame, seen: c.seen, all: c.all.n }));
      }
      console.log(`      changed of drawn, facing you: ${rows.join(', ')}`);
      const beats = [null, { kind: 'arm', k: 0.2 }, { kind: 'arm', k: 0.9 }, { kind: 'throw', k: 0.2 }, { kind: 'throw', k: 0.8 }, { kind: 'force', k: 0.1 }, { kind: 'force', k: 0.3 }, { kind: 'force', k: 0.8 }, { kind: 'place', k: 0.5 }, { kind: 'stack', k: 0 }];
      const named = new Set();
      for (const [shape, colours] of HELD_VARIANTS) for (const b of beats) {
        const f = heldFrameOf({ shape, colour: colours[0] }, b);
        assert(BANDS[HELD_BAND].includes(f) && DIRS.every(d => S.index.get(heldKey(shape, colours[0], f, d))), JSON.stringify({ shape, b, f }));
        named.add(f);
      }
      console.log(`      heldFrameOf over ${HELD_VARIANTS.length} shapes × ${beats.length} beats names ${named.size} of the band's ${BANDS[HELD_BAND].length}: ${[...named].join(', ')}`);
      assert(named.size === BANDS[HELD_BAND].length && heldFrameOf(null) === null, [...named].join());
    },
  },
  {
    name: 'a figure with no device is the frame it always was: the game\'s other frames digest to v0.0.19\'s golden, the held band in the stance pool beside the shots (the stance sheet\'s size kept), no frame for a sheet carries a device letter',
    fn() {
      const looks = [wear({ ...HELD_LOOK, carry: 'low' }), wear(HELD_LOOK), wear({ outfit: 'utilities', weapon: 'pistol', carry: 'low', carrier: true, seed: 5 })];
      // (samples-held's looks and loop, the frames before v0.0.22's: pinned on v0.0.19's own compose.js)
      const suit = (carry) => wear({ outfit: 'combatSuit', carrier: true, weapon: 'rifle', carry, seed: 3, model: 'r7' });
      // (v0.0.23: the P-12's band (poses.js BANDS.pistol, the user's note of 2026-11-17) is new frames, left out like the held band:
      // every frame before it is byte for byte as pinned, F98's "the rifle's own frames as before")
      const old = FRAMES.filter(f => !BANDS[HELD_BAND].includes(f) && !BANDS.pistol.includes(f)), parts = [];
      for (const L of [suit('low'), suit('front'), looks[2]]) for (const d of DIRS) {
        for (const f of old) { const fr = composeFrame(L, d, f, { ppm: PPM }); parts.push(shade(fr.cells, coloursOf(fr.look, PPM)).data); }
        for (const b of BEAT_FRAMES) { const fr = composeFrame(L, d, 'idle0', { ppm: PPM, pose: beatPose(b, { weapon: L.weapon, carry: L.carry }) }); parts.push(shade(fr.cells, coloursOf(fr.look, PPM)).data); }
      }
      const all = new Uint32Array(parts.reduce((a, p) => a + p.length, 0));
      let o = 0; for (const p of parts) { all.set(p, o); o += p.length; }
      golden('the figures\' frames, three looks, every frame and beat, four facings', all, '1c53d76d17f6d4');
      let letters = 0, n = 0;
      for (const L of looks) for (const d of DIRS) for (const f of BANDS[HELD_BAND]) { const fr = composeFrame(L, d, f, { ppm: PPM }); n++; letters += fr.cells.flat().filter(c => c && LETTERS.has(c.ch.toLowerCase())).length; assert(!fr.hands, `${f} reports hands`); }
      const lay = sheetLayout(PPM), b = lay.bands[HELD_BAND];
      console.log(`      ${parts.length} frames as before; the held band's ${n} frames with ${letters} device pixels; the band at ${b.x}, ${b.y} (${b.w} × ${b.h}) of the stance sheet ${lay.pools.stance.w} × ${lay.pools.stance.h}`);
      assert(letters === 0 && STANCE_BANDS.includes(HELD_BAND) && lay.pools.stance.w === 512 && lay.pools.stance.h === 432 && b.pool === 'stance', JSON.stringify({ letters, b, stance: lay.pools.stance }));
      assert(Object.keys(HELD).join() === 'can,egg,strip,spool,bar,ram', Object.keys(HELD).join());
    },
  },
];
