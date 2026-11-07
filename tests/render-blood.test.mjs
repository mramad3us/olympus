// OLYMPUS tests: blood's pixels in node (the build sheet 0.0.7 §5.4; tradecraft's render/blood.js ported).
//
// src/render/blood.js, no GPU: a spatter's pixels come from its seed, the same every time and the same as tradecraft's
// own generator (its src/render/blood.js `pixels`, read from its source and run beside ours: its numbers printed beside
// ours); a decal darkens from fresh to dry over DRY_MS; at most the body's 120 decals and MAX_BLOOD_PIXELS pixels are
// drawn, the newest kept; a wound's mark is MARK_PX pixels on the figure where its part is, standing and lying, sparing
// at 16 px/m.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { assert, fmt, root } from './helpers.mjs';
import { decalPixels, bloodPixels, markPixels, dryOf, SHADES, DRY_MS, MAX_BLOOD_PIXELS, MARK_PX } from '../src/render/blood.js';
import { BLOOD_DECALS_MAX } from '../src/sim/body/blood.js';

const TC = path.join(root, '..', 'tradecraft', 'src', 'render', 'blood.js');
// (tradecraft's generator, from its source: read-only, run here beside ours)
function tradecraftPixels() {
  if (!existsSync(TC)) return null;
  const src = readFileSync(TC, 'utf8'), a = src.indexOf('function* pixels(d)'), b = src.indexOf('\nexport function createBlood');
  if (a < 0 || b < 0) return null;
  return new Function(`${src.slice(a, b)}; return pixels;`)();
}

export default [
  {
    name: 'a spatter\'s pixels come from its seed, the same every time, and the same as tradecraft\'s own generator',
    fn() {
      const d = { x: 1300.4, z: 330.2, dx: 1, n: 12, seed: 81273, atMs: 0 }, drip = { x: 1300.1, z: 330.6, dx: 0, n: 2, seed: 5521, atMs: 0 };
      const ours = [...decalPixels(d)], again = [...decalPixels(d)], tc = tradecraftPixels();
      const theirs = tc ? [...tc(d)] : null;
      const same = JSON.stringify(ours) === JSON.stringify(again), parity = theirs ? JSON.stringify(theirs) === JSON.stringify(ours) : null;
      const far = Math.max(...ours.map(p => Math.hypot(p.x - d.x, p.z - d.z)));
      console.log(`      a spatter of 12 flung east: ${ours.length} pixels, ${ours.filter(p => p.big).length} big, the farthest ${fmt(far, 2)} m out; drawn ${bloodPixels([d], 0).length} px; a drip of 2: ${bloodPixels([drip], 0).length} px`);
      console.log(`      ours (x, z) ${ours.slice(0, 3).map(p => `(${fmt(p.x, 3)}, ${fmt(p.z, 3)})`).join(' ')}; tradecraft's ${theirs ? theirs.slice(0, 3).map(p => `(${fmt(p.x, 3)}, ${fmt(p.z, 3)})`).join(' ') : '(not found)'}: ${parity === null ? 'no parity run' : parity ? 'identical' : 'DIFFERENT'}`);
      assert(same, 'the same every time');
      assert(parity !== false, 'tradecraft\'s numbers');
      assert(ours.every(p => p.x >= d.x - 0.3), 'flung east');
    },
  },
  {
    name: 'blood darkens as it dries over DRY_MS, at most the body\'s 120 decals and MAX_BLOOD_PIXELS drawn (the newest kept)',
    fn() {
      const list = Array.from({ length: BLOOD_DECALS_MAX }, (_, i) => ({ x: 1300 + (i % 12) * 0.5, z: 330 + Math.floor(i / 12) * 0.5, dx: i % 3 - 1, n: 30, seed: 1000 + i, atMs: i * 1000 }));
      const fresh = bloodPixels([list[0]], 0), dry = bloodPixels([list[0]], DRY_MS), all = bloodPixels(list, DRY_MS);
      const shade = (px) => px.map(p => SHADES.indexOf(p.c)).reduce((a, b) => a + b, 0) / px.length;
      console.log(`      a decal fresh: mean shade ${fmt(shade(fresh), 2)}; half an hour on: ${fmt(shade(dry), 2)} (dry ${dryOf(0, DRY_MS)}); ${list.length} decals of 30: ${all.length} px drawn of ${MAX_BLOOD_PIXELS}; the newest's in: ${all.some(p => Math.abs(p.z - list.at(-1).z) < 0.6)}`);
      assert(shade(dry) > shade(fresh) + 1, 'darker dry');
      assert(all.length <= MAX_BLOOD_PIXELS && BLOOD_DECALS_MAX === 120, `${all.length} px`);
    },
  },
  {
    name: 'a wound\'s mark is MARK_PX pixels on the figure where its part is, standing and lying, over the card, sparing at 16 px/m',
    fn() {
      const stand = { x: 1300, z: 330, face: 'right' }, lie = { ...stand, lie: true };
      const rows = [];
      for (const part of ['head', 'torso', 'legL', 'armR']) {
        const s = markPixels(stand, [{ part, atMs: 0 }], 0), l = markPixels(lie, [{ part, atMs: 0 }], 0);
        rows.push(`${part}: standing ${fmt(s[0].y - 0.2, 2)} m up, lying ${fmt(l[0].x - 1300, 2)} m along`);
        assert(s.length === MARK_PX && l.length === MARK_PX, part);
      }
      const head = markPixels(stand, [{ part: 'head', atMs: 0 }], 0)[0], leg = markPixels(stand, [{ part: 'legL', atMs: 0 }], 0)[0];
      console.log(`      ${rows.join('; ')}`);
      assert(head.y > leg.y + 0.8, 'the head over the leg');
    },
  },
];
