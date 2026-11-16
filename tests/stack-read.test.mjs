// OLYMPUS tests: the stack read as two men (the build sheet v0.0.20 item 22, feel.md FL-7; quick, in node; printed until the user picks).
//
// "You and your #2 merge into one blob on the walk" (the v0.0.14 reviews): at the stack the two men stand 0.65 m apart along the
// hall, 10.4 px at 16 px/m, under a chibi head's width, so one figure lies over the other at one depth. This composes the two
// men in the combat EVA suit as the stage does (the figure code's frames, shaded, you drawn over your #2 10 px on, facing the
// door), with each candidate's marks (helmets.js STACKS through lookPicked: S0 today's, S1 a lit edge, S2 a visor per man, S3 the
// red tape on your #2), and measures the shared edge: where a pixel of yours meets one of his, parted (a pixel of neither between
// them: FL-7's measure) and told apart (their colours a luma step of PART_LUMA or more, the eye's cue when nothing parts them).
// S4 (a pixel of the floor's tone) and S5 (a cast shadow each) are the stage's rules, drawn by the gallery's page alone, so they
// are named, not measured. Nothing is asserted on the shares until the user picks (STACK_DRAWN_AS empty): they are printed.
import { assert, fmt } from './helpers.mjs';
import { composeFrame } from '../src/art/figures/compose.js';
import { shade } from '../src/art/figures/shade.js';
import { wear, coloursOf } from '../src/art/figures/outfits.js';
import { lookPicked, STACKS, STACK_DRAWN_AS } from '../src/art/figures/helmets.js';

/** A luma step that tells two pixels apart (0 to 1). */
const PART_LUMA = 0.08;
const base = { outfit: 'combatSuit', weapon: 'rifle', carry: 'low', model: 'r7', carrier: true };
function figureOf(look) { const L = wear(look), f = composeFrame(L, 'right', 'walk2', { ppm: 16 }); return shade(f.cells, coloursOf(f.look, 16)); }
const luma = (v) => (0.3 * (v & 255) + 0.59 * ((v >>> 8) & 255) + 0.11 * ((v >>> 16) & 255)) / 255;

/** The two men at the stack with a candidate's marks: { edge, parted, apart } (pixels of the shared edge, parted by a gap, told apart by colour). */
function stackRead(id) {
  const ids = id === 'S0' ? [] : [id], me = figureOf(lookPicked({ ...base, seed: 3 }, 0, { stack: ids })), two = figureOf(lookPicked({ ...base, seed: 5 }, 1, { stack: ids }));
  const W = me.w + 10, H = me.h, who = new Int8Array(W * H), px = new Uint32Array(W * H), u32 = (pm) => new Uint32Array(pm.data.buffer, pm.data.byteOffset, pm.w * pm.h);
  const put = (pm, dx, k) => { const d = u32(pm); for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) { const v = d[y * pm.w + x]; if ((v >>> 24) > 0) { who[y * W + x + dx] = k; px[y * W + x + dx] = v; } } };
  put(two, 10, 2); put(me, 0, 1);
  let edge = 0, parted = 0, apart = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W - 1; x++) {
    const a = who[y * W + x], b = who[y * W + x + 1];
    if (a === 1 && b === 2) { edge++; if (Math.abs(luma(px[y * W + x]) - luma(px[y * W + x + 1])) >= PART_LUMA) apart++; }
    if (a === 1 && b === 0 && who[y * W + x + 2] === 2) { edge++; parted++; }
  }
  return { edge, parted, apart };
}

export default [
  {
    name: 'the stack\'s two men parted along their shared edge, by candidate (FL-7\'s 60% wanted; S4 and S5 the stage\'s, named): printed until the user picks',
    fn() {
      const rows = ['S0', 'S1', 'S2', 'S3'].map(id => ({ id, ...stackRead(id) }));
      console.log(`      ${rows.map(r => `${r.id} edge ${r.edge} px, parted ${fmt(100 * r.parted / Math.max(1, r.edge), 0)}%, told apart by colour ${fmt(100 * r.apart / Math.max(1, r.edge), 0)}%`).join('; ')}; S4 and S5: ${Object.entries(STACKS).filter(([, v]) => v.page).map(([k, v]) => `${k} ${v.page}`).join(', ')} (the gallery's page); picked: ${STACK_DRAWN_AS.join(', ') || 'none'}`);
      assert(rows.every(r => r.edge > 0), 'the two men share an edge at the stack');
    },
  },
];
