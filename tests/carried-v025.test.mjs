// OLYMPUS tests: v0.0.25's carried fixes on the 1 G house (its build sheet §1 E, items 15 to 17; the carried lens's C1, C2 and C3), each failing without its fix.
//
// C1, your #2 never holds you in a doorway on a drawn house (F4): on drawn seed 3 the tier one's walk along the hall past room 3's
// door met his #2 coming out of room 3, north of the hall, at its funnel's edge, and the body gap held your walk two ticks in the
// doorway (0.10 s; house-swings' heavy case, 6 of 40 drawn lanes). bundle.js zoneGate's pass gate (passGate) holds him inside the
// room until you are past: 0 still ticks of yours in room 3's funnel, the lane to the card.
// C2, the P-12's admin drawn as the pistol (v0.0.23's question 19): the tower's MAKE READY and SHOW CLEAR run the P-12's part as one
// beat with it in its holster (sidearm.js adminRun), and the stage drew the rifle's frames through it; look.js gunLook now gives the
// pistol in the hands at the low ready and its admin frames (ADMIN_FRAMES), so on the private's lane by the keys on 48213 every tick
// of the beat, yours and your #2's, is drawn as one of the P-12's own frames (poses.js rifleFrame, the stage's own reader). (The
// integration of v0.0.25: v0.0.24 as tagged already drew the admin so, its own ADMIN_FRAMES walking the draw and the holster too
// (pistolHolster) beside the press check and the magazine (pistolCheck, pistolMag); E's duplicate of it was dropped at the merge and
// this case reads the tag's frames: the pistol's three, never the rifle's.)
// C3, "PAIR, MOVING ON" never covers "TORSO SURE" (v0.0.23's play review 9, question 22): in the house each plate naming a target
// was slid off the room on its own (plaque.js slideRect), so the row's plate could slide onto the shot's plaque under it; now each is
// kept off the plates placed before it in the frame and stacked below one it would meet. Page-free: the plates placed by place()
// with main.js's anchors (over a target, or beside a turner) among a fixed generator's figures and stands, and the panel's and the
// radio box's rects (main.js houseKeepOff: layout.js rectsAt in picture px), in a 1280 × 720 and a 1600 × 900 window (render/scale.js
// frameFor: one 640 × 360 picture, the HUD's rects its own at each): the two never intersect.
import { assert } from './helpers.mjs';
import { flawlessLane, botOf } from './flawless.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { gunLook } from '../src/sim/arms/look.js';
import { stepNow } from '../src/sim/arms/shooting.js';
import { handsOf } from '../src/sim/combat/two.js';
import { rifleFrame } from '../src/art/figures/poses.js';
import { plaquePixels, rowPartsPixels, shotPlaque, place, keepOff } from '../src/ui/plaque.js';
import { frameFor } from '../src/render/scale.js';
import { rectsAt } from '../src/ui/hud/layout.js';

// (the P-12's part of a tower macro, sidearm.js ADMIN's subs run by adminRun as one beat)
const ADMIN_SUB = /^pistol:(ready|clear)$/;
// (the P-12 band's frames the tag's ADMIN_FRAMES draws through the beat: the hand at the holster, the press check, the magazine out)
const P12_ADMIN_FRAMES = new Set(['pistolHolster', 'pistolCheck', 'pistolMag']);

// (a small linear congruential generator: the layouts the same on every run; plaque-place's)
function lcg(seed) { let x = seed >>> 0; return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 2 ** 32); }
const meets = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
// (a plate's element as place() writes it, off the page: its transform read back to picture px, k 1)
const fakeEl = (className) => ({ className, dataset: {}, style: {}, getContext: () => null, setAttribute() {} });
const rectOf = (el, p) => { const m = /translate\((-?\d+)px, (-?\d+)px\)/.exec(el.style.transform); return { x: Number(m[1]), y: Number(m[2]), w: p.w, h: p.h }; };

export default [
  {
    name: 'C1: on drawn seed 3 the honest tier one\'s walk along the hall past room 3\'s door is never held in its funnel by his #2 coming out of room 3 (0 still ticks there; 2 before the pass gate), the lane to the card',
    fn() {
      const r = flawlessLane({ tier: 'tierone', seed: 3, fill: { draw: 'drawn' } });
      const stops = r.door.stopMs, all = stops.reduce((a, b) => a + b, 0);
      console.log(`      drawn seed 3, the tier one: your still ms in a doorway by room ${JSON.stringify(stops)} (room 3 ${stops[2]} ms, ${stops[2] / 50} ticks; v0.0.24 100 ms, 2 ticks); the #2's ${r.door.twoMs} ms; funnel faults ${r.door.faults}; moves ending in a doorway ${r.door.endsIn}; the lane ${r.laneS?.toFixed(2)} s (v0.0.24 41.70 s), ${r.done ? 'to the card' : 'NOT to the card'}`);
      assert(r.done && stops[2] === 0 && all === 0 && r.door.faults === 0, JSON.stringify({ done: r.done, stops, faults: r.door.faults }));
    },
  },
  {
    name: 'C2: the P-12\'s admin on the tower\'s MAKE READY and SHOW CLEAR is drawn as the pistol: the private by the keys on 48213 from the fill, every tick of the admin beat (yours and your #2\'s) drawn as the P-12\'s own frames (its holster, press check or magazine), the pistol at the low ready and the rifle hanging',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' }), pid = g.state.player.id;
      const seen = { you: {}, two: {} }, off = [];
      let ticks = 0;
      const r = runHouse(g, botOf('keys', { seed: 48213 }), { maxMs: 30 * 60_000, each(game) {
        const st = game.state, ms = st.clock.ms, H = st.armoury.range.house;
        for (const a of st.actors.list) {
          const mine = a.who === pid, s = mine ? stepNow(st, pid, ms) : a.who === H?.twoPid ? handsOf(st, a.who, ms) : null;
          if (!ADMIN_SUB.test(s?.action ?? '')) continue;
          ticks++;
          const gl = gunLook(st, a, ms), f = rifleFrame(gl, { face: a.face, x: a.x, z: a.z, ms }).frame, o = mine ? seen.you : seen.two, k = `${s.action} ${f}`;
          o[k] = (o[k] ?? 0) + 1;
          if (!P12_ADMIN_FRAMES.has(f) || gl.pistol?.posture !== 'lowReady' || gl.carry !== 'front') { if (off.length < 4) off.push({ ms, who: a.who, action: s.action, frame: f, pistol: gl.pistol ?? null, carry: gl.carry }); }
        }
      } });
      const n = (o) => Object.values(o).reduce((a, b) => a + b, 0);
      console.log(`      the private by the keys on 48213, ${r.done ? 'to the card' : 'NOT to the card'}: ${ticks} admin ticks; yours ${n(seen.you)} ${JSON.stringify(seen.you)}; your #2's ${n(seen.two)} ${JSON.stringify(seen.two)}; off ${off.length}${off.length ? ` ${JSON.stringify(off)}` : ''} (v0.0.24: every one the rifle's frame)`);
      assert(r.done && n(seen.you) > 0 && n(seen.two) > 0 && !off.length && Object.keys({ ...seen.you, ...seen.two }).some(k => k.endsWith('pistolMag')), JSON.stringify({ off, seen }));
    },
  },
  {
    name: 'C3: the row\'s plate ("PAIR, MOVING ON") and the shot\'s plaque ("TORSO SURE") never intersect, placed by place() with main.js\'s anchors among 300 layouts of figures and stands at the pictures of a 1280 × 720 and a 1600 × 900 window',
    fn() {
      const pq0 = plaquePixels({ ...shotPlaque({ part: 'torso', oddsText: 'SURE', rangeM: 4, next: 'aim', aimS: 0.4 }), notch: true });
      const pqB = plaquePixels({ ...shotPlaque({ part: 'torso', oddsText: 'SURE', rangeM: 4, next: 'aim', aimS: 0.4 }), notch: false });
      const pp = rowPartsPixels({ id: 'shot:pair@moving', label: 'Pair, moving on · −2', ms: 640, parts: [{ k: 'aim', ms: 300 }, { k: 'round', ms: 170, part: 'torso' }, { k: 'round', ms: 170, part: 'torso' }], rounds: [{ part: 'torso', odds: 1 }, { part: 'torso', odds: 1 }] });
      const rows = [];
      let met = 0, n = 0;
      for (const [winW, winH] of [[1280, 720], [1600, 900]]) {
        const F = frameFor(winW, winH), W = F.w, H = F.h, rnd = lcg(winW * 7 + winH), bounds = { x: 0, y: 0, w: W, h: H }, k = F.cssW / W;
        const R = rectsAt(winW, winH, 'weapon'), toPic = (q) => ({ x: (q.x - F.left) / k, y: (q.y - F.top) / k, w: q.w / k, h: q.h / k }), hud = ['STEPS', 'RADIO'].filter(x => R[x]).map(x => ({ ...toPic(R[x]), who: x }));
        const reserved = R.PLAQUE ? toPic(R.PLAQUE) : null;
        const how = {};
        let here = 0;
        for (let i = 0; i < 300; i++) {
          // (a target, the figures and stands round it (a stack's men, the room's other boards), a man's box 0.6 m by 1.8 m at 16 px/m)
          const tx = 40 + rnd() * (W - 80), ty = 50 + rnd() * (H - 70), tw = 10, th = 29;
          const boxes = [{ x: tx - tw / 2, y: ty - th / 2, w: tw, h: th, who: 'T' }];
          for (let j = 0, m = 2 + Math.floor(rnd() * 7); j < m; j++) boxes.push({ x: tx - 60 + rnd() * 120, y: ty - 70 + rnd() * 90, w: tw, h: th, who: `f${j}` });
          keepOff({ boxes: [...boxes, ...hud], bounds, reserved });
          const beside = rnd() < 0.5, pq = beside ? pqB : pq0, aim = fakeEl('plaque reticle'), parts = fakeEl('plaque parts');
          // (main.js weaponHud's anchors: over a target its notch at the target's top; beside a turner level with it, to its right
          // where it fits; the row's plate stacked over the plaque, centred on its notch or aligned on its side)
          const sideR = tx + tw / 2 + 5 + 140 <= W - 2, sideX = beside ? (sideR ? Math.round(tx + tw / 2 + 5) : Math.round(tx - tw / 2 - 5)) : 0;
          const tipX = beside ? (sideR ? sideX : sideX - pq.w) + pq.tip : Math.max(pq.tip + 2, Math.min(W - (pq.w - pq.tip) - 2, Math.round(tx)));
          const tipY = beside ? Math.round(ty - pq.h / 2) + pq.h : Math.round(ty - th / 2 - 3);
          place(aim, pq, tipX, tipY, 1, 'tip');
          const cx = beside ? (sideR ? sideX + pp.w / 2 : sideX - pp.w / 2) : Math.max(Math.ceil(pp.w / 2) + 2, Math.min(W - Math.ceil(pp.w / 2) - 2, tipX)), cy = tipY - pq.h - 1 - pp.h / 2;
          place(parts, pp, cx, cy, 1, 'centre');
          const A = rectOf(aim, pq), P = rectOf(parts, pp);
          const k = `${aim.dataset.slid ?? 'none'}/${parts.dataset.slid ?? 'none'}`;
          how[k] = (how[k] ?? 0) + 1;
          n++;
          if (meets(A, P)) { met++; here++; }
        }
        keepOff(null);
        rows.push(`${winW} × ${winH} (picture ${W} × ${H}, the panel ${hud.find(b => b.who === 'STEPS') ? `${Math.round(hud.find(b => b.who === 'STEPS').w)} × ${Math.round(hud.find(b => b.who === 'STEPS').h)} px` : 'none'}): ${here} of 300 layouts with the two intersecting; the plaque/row's plate ${Object.entries(how).sort().map(([k, v]) => `${k} ${v}`).join(', ')}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      the plaque ${pq0.w} × ${pq0.h} px ("${pq0.words ?? 'TORSO SURE'}"), the row's plate ${pp.w} × ${pp.h} px ("${pp.words}"); ${met} of ${n} intersect (v0.0.24: some every size, each slid on its own)`);
      assert(met === 0, JSON.stringify(rows));
    },
  },
];
