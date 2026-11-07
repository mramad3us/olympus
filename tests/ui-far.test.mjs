// The far window's place against the HUD's rectangles (quick; the build sheet 0.0.7 §5.5; VIEWS §2.4, §7.5: "nothing
// overlaps", the user's complaint of overlapping interface in tradecraft).
//
// layout.js placeFar(w, h, state, { bearingRad, rCss, k, frame, from, label }) puts the far window's disc on the frame's
// edge along the bearing to the far point, inset 4 picture pixels, and where that meets a rectangle of the state slides
// along the edge to the nearest free place, its tick on the ring still along the true bearing. Here, at 1600 × 900 and
// 1024 × 768 (and the two other shapes core-browser uses), every bearing in 10° steps, in the states weapon (PAPER in)
// and weapon-far (PAPER yielding) and walking (E held on a KD line): the disc (to its bezel and tick) and its label meet
// no rectangle, both inside the window and the picture, the tick within 1° of the bearing; the radius 79 picture
// pixels at the picture's scale (VIEWS §2.4's FAR_R_PX). Prints how many bearings slid, the longest slide, where east
// (the KD's downrange) lands.
import { assert, fmt } from './helpers.mjs';
import { placeFar, farTick, rectsAt, overlaps, STATES, FAR_R_PX, FAR_TICK_PX } from '../src/ui/hud/layout.js';
import { frameFor } from '../src/render/scale.js';

const SIZES = [[1600, 900], [1024, 768], [1280, 600], [1920, 1080]];
// (the label's box as main.js passes it: the far label plaque "TARGET 10 · 300 M" at the picture's scale, about 75 × 13 picture px)
const LABEL_PIC = [75, 13];

export default [
  {
    name: 'the far window meets no HUD rectangle at 1600 × 900 and 1024 × 768 (and 1280 × 600, 1920 × 1080), at every bearing in 10° steps, in weapon, weapon-far and walking; inside the picture, its tick along the true bearing (±1°)',
    fn() {
      let checked = 0;
      for (const [w, h] of SIZES) {
        const f = frameFor(w, h, 1, { res: [640, 360], resMax: [768, 430] }), k = f.scale, frame = { x: f.left, y: f.top, w: f.cssW, h: f.cssH };
        for (const state of ['weapon', 'weapon-far', 'walking']) {
          const rects = rectsAt(w, h, state), blocks = STATES[state].map(n => [n, rects[n]]);
          let slid = 0, most = 0, hidden = 0;
          const sides = {};
          let east = null;
          for (let deg = 0; deg < 360; deg += 10) {
            const b = deg * Math.PI / 180, p = placeFar(w, h, state, { bearingRad: b, rCss: FAR_R_PX * k, k, frame, label: { w: LABEL_PIC[0] * k, h: LABEL_PIC[1] * k } });
            checked++;
            if (p.hidden) { hidden++; continue; }
            const disc = { x: p.cx - p.RK, y: p.cy - p.RK, w: 2 * p.RK, h: 2 * p.RK };
            for (const [n, r] of blocks) {
              assert(!overlaps(disc, r), JSON.stringify({ w, h, state, deg, meets: n, disc, r }));
              if (p.label) assert(!overlaps(p.label, r), JSON.stringify({ w, h, state, deg, label: p.label, meets: n, r }));
            }
            assert(disc.x >= frame.x && disc.y >= frame.y && disc.x + disc.w <= frame.x + frame.w && disc.y + disc.h <= frame.y + frame.h, JSON.stringify({ w, h, state, deg, disc, frame }));
            assert(p.label, JSON.stringify({ w, h, state, deg, why: 'no room for the label', p }));
            assert(p.label.x >= 0 && p.label.y >= 0 && p.label.x + p.label.w <= w && p.label.y + p.label.h <= h && !overlaps(p.label, disc), JSON.stringify({ w, h, state, deg, label: p.label, disc }));
            const t = farTick(p, k), tb = Math.atan2(t.y1 - t.y0, t.x1 - t.x0), dDeg = Math.abs(((tb - b) * 180 / Math.PI + 540) % 360 - 180);
            assert(dDeg <= 1, JSON.stringify({ w, h, state, deg, tickDeg: tb * 180 / Math.PI }));
            assert(Math.abs(Math.hypot(t.x1 - t.x0, t.y1 - t.y0) - (p.R - p.r + FAR_TICK_PX * k)) < 1e-6, 'the tick runs from the ring past the bezel');
            near1(p.r, FAR_R_PX * k);
            if (p.slid) { slid++; most = Math.max(most, p.slidPx); }
            sides[p.label.side] = (sides[p.label.side] ?? 0) + 1;
            if (deg === 0) east = p;
          }
          console.log(`      ${w} × ${h} ${state.padEnd(10)} r ${fmt(FAR_R_PX * k, 0)} px: ${36 - hidden} placed, ${hidden} left off, ${slid} slid (longest ${fmt(most, 0)} px); east at (${fmt(east?.cx ?? NaN, 0)}, ${fmt(east?.cy ?? NaN, 0)}); labels ${Object.entries(sides).map(([s, n]) => `${s} ${n}`).join(', ')}`);
          assert(hidden === 0, `${w} × ${h} ${state}: ${hidden} bearings found no free place`);
        }
      }
      console.log(`      ${checked} placements checked`);
    },
  },
  {
    name: 'placeFar slides only when it must: a bearing whose edge point is free stays on the bearing (slid 0); a frame too small for the disc leaves it off (hidden), never drawn over the HUD',
    fn() {
      const w = 1600, h = 900, f = frameFor(w, h, 1, { res: [640, 360], resMax: [768, 430] }), k = f.scale, frame = { x: f.left, y: f.top, w: f.cssW, h: f.cssH };
      // (west at the frame's middle height: the left band between TOASTS and the bottom stack is free at 1600 × 900)
      const west = placeFar(w, h, 'weapon-far', { bearingRad: Math.PI, rCss: FAR_R_PX * k, k, frame, from: { x: 800, y: 340 } });
      console.log(`      west from (800, 340): centre (${fmt(west.cx, 0)}, ${fmt(west.cy, 0)}), slid ${west.slidPx} px`);
      assert(!west.hidden && !west.slid && Math.abs(west.cy - 340) < 1e-6, JSON.stringify(west));
      const tiny = placeFar(400, 300, 'weapon-far', { bearingRad: 0, rCss: 200, k: 2.5 });
      console.log(`      a 400 × 300 window and a 200 px disc: hidden ${tiny.hidden}`);
      assert(tiny.hidden, JSON.stringify(tiny));
      // (weapon-far is the weapon state with PAPER yielding: the same rectangles less PAPER, RADIO on STEPS)
      const a = rectsAt(w, h, 'weapon'), b = rectsAt(w, h, 'weapon-far');
      assert(!STATES['weapon-far'].includes('PAPER') && STATES.weapon.filter(n => n !== 'PAPER').every(n => STATES['weapon-far'].includes(n)), JSON.stringify(STATES['weapon-far']));
      assert(JSON.stringify(a.RADIO) === JSON.stringify(b.RADIO), `RADIO on STEPS in both: ${JSON.stringify(a.RADIO)} / ${JSON.stringify(b.RADIO)}`);
    },
  },
];

function near1(a, b) { assert(Math.abs(a - b) < 1e-6, `${a} ≠ ${b}`); }
