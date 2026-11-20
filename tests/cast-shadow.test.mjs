// OLYMPUS tests: one shadow under a body (v0.0.28; the user's stars of 2026-11-20: house-stack-figures S5, a cast shadow under each man;
// float-look F-a, the shadow alone; wreck-faces K-a, the projection alone). render/faces.js castShadowPixels is the stage's rule in
// numbers (render/figures.js's blob shader draws the same from the man's atlas cell): a man standing on the floor lays his legs flat
// away from the light, so each of two men 0.65 m apart in the stack casts his own, scissoring with his stride, over at most 60% of the
// floor v0.0.27's two blobs (0.84 m across, one dark ellipse) darkened (their lower bodies, 10 to 16 px across at 16 px/m, overlap on
// screen at 0.65 m whatever the shadow, so no strip of floor shows between them); a body off the floor is drawn at the scale of one on the deck (F-b's scale step retired) and nothing
// is drawn dashed on the deck under the deckhead (K-b's footprint retired). Each case fails without its change (castShadowPixels
// missing; heightLookOf's 1.25 at 1.0 m; OVERHEAD_LOOK 'K-b').
import { assert } from './helpers.mjs';
import { castShadowPixels, heightLookOf, SHADOW_UP_M, SHADOW_K, SHADOW_A, FLOAT_LOOK, OVERHEAD_LOOK } from '../src/render/faces.js';
import { composeFrame } from '../src/art/figures/compose.js';
import { shade } from '../src/art/figures/shade.js';
import { wear, coloursOf } from '../src/art/figures/outfits.js';
import { beatPose, cyclePose } from '../src/art/figures/walk.js';

const PPM = 16;
// (a frame of the combat EVA suit with the R-7 at the low ready, as the stage paints it: { w, h, ax, ay, opaque(px, py) })
function frame(pose, dir = 'left', seed = 1) {
  const look = wear({ outfit: 'combatSuit', weapon: 'rifle', carry: 'low', carrier: true, seed, model: 'r7' });
  const fr = composeFrame(look, dir, 'idle0', { ppm: PPM, pose }), pm = shade(fr.cells, coloursOf(fr.look, PPM));
  return { w: pm.w, h: pm.h, ax: fr.ax, ay: fr.ay, opaque: (x, y) => (pm.data[y * pm.w + x] >>> 24) >= 128 };
}
// (a man's shadow on the floor's pixel grid: his card's left column at his spot less his anchor's column, his sole's row his spot's)
const placed = (f, x, z) => castShadowPixels(f, PPM).map(([ix, iy]) => [Math.round(x * PPM) - f.ax + ix, Math.round(z * PPM) + iy]);

export default [
  {
    name: 'v0.0.28 (S5, the user\'s star of 2026-11-20): each man in the stack, 0.65 m apart, casts his own shadow from his own legs, laid away from the light (right and down, never up or left of the pixel that casts it), scissoring with his stride, and the two darken at most 60% of the floor v0.0.27\'s two blobs (0.84 m across, one dark ellipse) did',
    fn() {
      const rows = [], bad = [];
      const blobPx = (cx, cz) => { const out = []; const rx = 0.42 * PPM, rz = 0.252 * PPM; for (let y = Math.floor(cz - rz - 1); y <= Math.ceil(cz + rz + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cz) / rz; if (dx * dx + dy * dy <= 1) out.push(`${x},${y}`); } return out; };
      const shapes = [];
      for (const [name, pose] of [['the stack', beatPose('stack', { weapon: 'rifle', carry: 'low', cycle: 'B' })], ['mid-stride', cyclePose('B', 'combat', 2, { weapon: 'rifle', carry: 'low' })]]) {
        const f = frame(pose), A = placed(f, 29.95, 12.45), B = placed(f, 30.6, 12.45);
        const union = new Set([...A, ...B].map(p => p.join(','))), blobs = new Set([...blobPx(29.95 * PPM, 12.45 * PPM), ...blobPx(30.6 * PPM, 12.45 * PPM)]);
        // (away from the light: each shadow pixel lies right of and down from a card pixel of his within SHADOW_UP_M of his soles)
        const own = castShadowPixels(f, PPM), legs = [];
        for (let py = 0; py < f.h; py++) for (let px = 0; px < f.w; px++) if (f.opaque(px, py) && f.ay - py - 0.5 <= SHADOW_UP_M * PPM && f.ay - py - 0.5 >= -1) legs.push([px, py]);
        const away = own.every(([ix, iy]) => iy >= 0 && legs.some(([px]) => ix >= px && ix - px <= Math.round(SHADOW_UP_M * PPM * SHADOW_K[0])));
        shapes.push(own.map(p => p.join(',')).sort().join(';'));
        rows.push(`${name}: each shadow ${A.length} px over ${new Set(A.map(p => p[1])).size} rows; the two ${union.size} px against the two blobs' ${blobs.size}; away from the light ${away}`);
        if (!A.length || !(union.size <= blobs.size * 0.6) || !away) bad.push(name);
      }
      const scissors = shapes[0] !== shapes[1];
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      the shadow changes with the stride: ${scissors}; SHADOW_UP_M ${SHADOW_UP_M}, SHADOW_K ${SHADOW_K.join(' × ')}, SHADOW_A ${SHADOW_A}`);
      assert(!bad.length && scissors, bad.join(', '));
    },
  },
  {
    name: 'v0.0.28 (F-a and K-a, the user\'s stars of 2026-11-20): a body 1.0 m off the floor is drawn at the scale of one on the deck, its shadow smaller and fainter the higher; the overhead\'s dashed footprint is gone (red on v0.0.27: 1.25 at 1.0 m, K-b)',
    fn() {
      const at = [0, 0.5, 1.0, 2.0].map(y => ({ y, ...heightLookOf(y) }));
      console.log(`      ${at.map(h => `${h.y} m: scale ${h.scaleK}, shadow ${h.blob.k.toFixed(2)} × at ${h.blob.alpha.toFixed(2)}`).join('; ')}; FLOAT_LOOK ${FLOAT_LOOK}, OVERHEAD_LOOK ${OVERHEAD_LOOK}`);
      assert(at.every(h => h.scaleK === 1) && at[2].blob.k < at[0].blob.k && at[3].blob.alpha < at[1].blob.alpha && FLOAT_LOOK === 'F-a' && OVERHEAD_LOOK === 'K-a', JSON.stringify(at));
    },
  },
];
