// OLYMPUS tests: the plates stay off the room, the pure slide rule (the build sheet v0.0.20 §1 item 14; feel FL-8).
//
// plaque.js slideRect: a plate anchored to a target that covers a protected box (a figure, a stand, the room's floor, the panel, the
// radio box) slides to the nearest side clear of them, else to its reserved rect (layout.js RECTS.PLAQUE). Over 200 random layouts
// (a fixed generator, my seed) it never covers a protected box when a free side exists: when it goes to its reserved rect, none of
// the four sides of the boxes it met was free. And keepOff only acts while set (the house): with none, place() puts a plate where
// it is anchored, as every other scene had it.
import { assert } from './helpers.mjs';
import { slideRect, keepOff } from '../src/ui/plaque.js';
import { RECTS } from '../src/ui/hud/layout.js';

// (a small linear congruential generator: the layouts the same on every run)
function lcg(seed) { let x = seed >>> 0; return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 2 ** 32); }
const meets = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export default [
  {
    name: 'over 200 random layouts the slide never covers a protected box when a free side exists, goes to the reserved rect only when none does, and keeps a plate that covers nothing where it was',
    fn() {
      const rnd = lcg(2026), bounds = { x: 0, y: 0, w: 640, h: 360 }, reserved = { x: 520, y: 150, w: 110, h: 30 };
      const how = { kept: 0, slid: 0, reserved: 0, stuck: 0 }, bad = [];
      let moved = 0;
      for (let i = 0; i < 200; i++) {
        const boxes = Array.from({ length: 2 + Math.floor(rnd() * 14) }, () => ({ x: rnd() * 600, y: rnd() * 330, w: 8 + rnd() * 140, h: 10 + rnd() * 110 }));
        const rect = { x: rnd() * 560, y: rnd() * 330, w: 50 + rnd() * 70, h: 12 + rnd() * 8 }, r = slideRect(rect, boxes, { bounds, reserved });
        how[r.how]++;
        const at = { ...rect, x: r.x, y: r.y };
        if (r.how === 'kept' && (r.x !== rect.x || r.y !== rect.y || boxes.some(b => meets(rect, b)))) bad.push(`kept ${i}`);
        if (r.how === 'slid') { moved += Math.hypot(r.x - rect.x, r.y - rect.y); if (boxes.some(b => meets(at, b))) bad.push(`slid onto a box ${i}`); }
        if (r.how === 'reserved') {
          const hit = boxes.filter(b => meets(rect, b)), U = hit.reduce((u, b) => ({ x0: Math.min(u.x0, b.x), y0: Math.min(u.y0, b.y), x1: Math.max(u.x1, b.x + b.w), y1: Math.max(u.y1, b.y + b.h) }), { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
          const sides = [{ ...rect, y: U.y0 - rect.h - 2 }, { ...rect, y: U.y1 + 2 }, { ...rect, x: U.x0 - rect.w - 2 }, { ...rect, x: U.x1 + 2 }];
          const inB = (q) => q.x >= 0 && q.y >= 0 && q.x + q.w <= 640 && q.y + q.h <= 360;
          if (sides.some(q => inB(q) && !boxes.some(b => meets(q, b)))) bad.push(`reserved with a free side ${i}`);
        }
      }
      console.log(`      ${JSON.stringify(how)}; slid ${(moved / Math.max(1, how.slid)).toFixed(1)} px on the mean; the reserved rect ${RECTS.PLAQUE.w} × ${RECTS.PLAQUE.h} at --ui 1, ${RECTS.PLAQUE.anchor} under ${RECTS.PLAQUE.below}`);
      assert(!bad.length && how.slid >= 40 && how.kept >= 10, JSON.stringify({ bad: bad.slice(0, 5), how }));
      keepOff(null);
    },
  },
];
