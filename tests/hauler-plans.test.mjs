// OLYMPUS tests: the Patient Mule's room plans, F151's plan half and F169's (the build sheet v0.0.27 §1 D, item 17, §6 D, §8; src/data/places/hauler-plans.js).
//
// The boarding's lane walks four legs of deck 2 (HAULER_ORDER: the passage, the holders' leg, authored; cabin 1, the bunk room and
// cabin 2, each its hatch's plan as the deriver gives it, committed by tools/derive-plans.mjs --ship hauler). These cases hold:
//   - the derived plans equal what the deriver gives today, field for field (fresh), two slots each, every hatch's #2 stack point within
//     HATCH_STACK_M 0.9 m of #1's (K3's data check: the swing's own points stand 0.65 m apart, so the deriver needs no hatch rule of
//     its own; the one D added moved nothing and was dropped, the review of D), the house's and X4's plans untouched;
//   - the passage's plan a hold with no door of its own (its gate the lock hatch's line), its stack and points your start and Four's
//     (hauler.js HAULER_START), every point of every plan standable and every path leg clear on the C0 grid, every way the lane walks
//     routed (the start to cabin 1's stack, each compartment's #1 point to the next stack);
//   - nobody passes anybody in the 1.5 m passage: from where the pair comes (your start and Four's for cabin 1; each compartment's points
//     for the next), #2's stack point lies no farther along the way than #1's (the pair out of the lock with you first, out of each
//     compartment you first: Four stacks short of you). Hinged the other way, cabin 1's (at x 3.75) and cabin 2's hatches put his stack
//     past yours, and the two of you held each other in the passage for good (the honest sergeant and the keys private on 48213, each
//     compartment passed by its due: D's finding, fixed in hauler.js);
//   - the holders 0.9 m and more from every stack point of every compartment's hatch (§0 item 12, SH risk 4), out of every path of yours.
import { assert, root } from './helpers.mjs';
import { deriveShip, SHIP_DERIVED } from '../tools/derive-plans.mjs';

/** K3's gap at a hatch: #2's stack point at most this far from #1's (the build sheet's item 17; a data check, m). */
const HATCH_STACK_M = 0.9;
import { HAULER_PLANS, HAULER_ORDER, LOCK_HATCH_ID } from '../src/data/places/hauler-plans.js';
import { HAULER, HAULER_ID, HAULER_START, HAULER_HOLDERS, HAULER_HATCHES } from '../src/data/places/hauler.js';
import { buildGrid, path } from '../src/sim/places/nav.js';
import { standOk } from '../src/sim/places/collide.js';
import { X4_PLANS } from '../src/data/places/x4-plans.js';
import { goldenDigest } from './golden.mjs';
import { readFileSync } from 'node:fs';

/** The house's authored plans (layout A, B, C), digested on the base tree (.run/v027/base.tree): the hatch rule moves none of them. */
export const X4_PLANS_DIGEST = '1aed1872708ea3';
const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const HOLDER_GAP_M = 0.9;
// (a point's distance along a way: the projection of p on the line from a toward b, metres)
const along = (a, b, p) => { const L = D(a, b) || 1; return ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / L; };
// (the segment's least distance to a point)
const segD = (a, b, p) => { const vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz, t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vz) / l2)) : 0; return Math.hypot(a[0] + vx * t - p[0], a[1] + vz * t - p[1]); };

export default [
  {
    name: 'the hauler\'s derived plans equal what the deriver gives today, two slots each, every hatch\'s #2 stack point within 0.9 m of #1\'s (K3\'s gap, as the swing gives it), and the house\'s plans untouched',
    async fn() {
      const { plans, lines } = await deriveShip('hauler');
      for (const l of lines) console.log(`      ${l}`);
      const stale = [];
      for (const [id, P] of Object.entries(plans)) for (const [k, v] of Object.entries(P)) if (JSON.stringify(v) !== JSON.stringify(HAULER_PLANS.plans[id]?.[k])) stale.push(`${id} ${k}`);
      const gaps = HAULER_ORDER.filter(k => k !== LOCK_HATCH_ID).map(k => [k, D(...HAULER_PLANS.plans[k].stack)]);
      console.log(`      the stacks' gaps ${gaps.map(([k, d]) => `${k.split(':').at(-1)} ${d.toFixed(2)} m`).join(', ')} (at most ${HATCH_STACK_M}); the derived legs ${SHIP_DERIVED.hauler.legs.map(x => x[0]).join(', ')}`);
      const src = readFileSync(`${root}/src/sim/combat/derive.js`, 'utf8');
      console.log(`      X4's plans ${goldenDigest(X4_PLANS)} (the base's ${X4_PLANS_DIGEST}); derive.js with no hatch rule of its own: ${!/hatchStack/.test(src)}`);
      assert(goldenDigest(X4_PLANS) === X4_PLANS_DIGEST, 'the house\'s plans moved');
      assert(!stale.length, `stale: ${stale.join(', ')} (node tools/derive-plans.mjs --ship hauler --write)`);
      assert(HAULER_PLANS.lane === 'M' && HAULER_PLANS.area === HAULER_ID && HAULER_PLANS.order.length === 4 && HAULER_PLANS.order[0] === LOCK_HATCH_ID, JSON.stringify(HAULER_PLANS.order));
      for (const k of HAULER_ORDER) { const P = HAULER_PLANS.plans[k]; assert(P.stack.length === 2 && P.points.length === 2 && P.sectors.length === 2 && P.paths[1] && P.paths[2], `${k}: two slots`); }
      assert(gaps.every(([, d]) => d <= HATCH_STACK_M + 1e-9), JSON.stringify(gaps));
    },
  },
  {
    name: 'the passage is a hold (no door of its own, its gate the lock hatch\'s line, your start and Four\'s its stack and points); every plan point standable and every path leg clear on the C0 grid; the lane\'s ways routed',
    fn() {
      const P = HAULER_PLANS.plans[LOCK_HATCH_ID], lock = HAULER_HATCHES.find(h => h.id === LOCK_HATCH_ID);
      assert(P.hold === true && P.door === null && P.gate.axis === lock.axis && P.gate.at === lock.at && P.gate.a === lock.a && P.gate.b === lock.b, JSON.stringify({ hold: P.hold, door: P.door, gate: P.gate }));
      assert(JSON.stringify(P.stack) === JSON.stringify([HAULER_START[2].at, HAULER_START[3].at]) && JSON.stringify(P.points) === JSON.stringify(P.stack), JSON.stringify(P.stack));
      const g = buildGrid(HAULER, 'C0', { closed: () => false }), bad = [], lens = [];
      const legClear = (a, b) => { const n = Math.max(1, Math.ceil(D(a, b) / 0.05)); for (let i = 0; i <= n; i++) if (!standOk(g, a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n)) return false; return true; };
      let nPts = 0, nLegs = 0;
      for (const k of HAULER_ORDER) {
        const Q = HAULER_PLANS.plans[k];
        for (const p of [...Q.stack, ...Q.points, ...Q.paths[1], ...Q.paths[2]]) { nPts++; if (!standOk(g, ...p)) bad.push(`${k}: ${JSON.stringify(p)} not standable`); }
        for (const sl of [1, 2]) for (let i = 1; i < Q.paths[sl].length; i++) { nLegs++; if (!legClear(Q.paths[sl][i - 1], Q.paths[sl][i])) bad.push(`${k} path ${sl} leg ${i}`); }
      }
      const route = (from, to, why) => { const r = path(g, from, to); if (r.fail) bad.push(`${why}: ${r.fail}`); else lens.push(`${why} ${r.lengthM} m`); };
      const legs = HAULER_ORDER.map(k => HAULER_PLANS.plans[k]);
      for (let i = 1; i < legs.length; i++) for (const sl of [0, 1]) route(legs[i - 1].points[sl], legs[i].stack[sl], `${sl + 1}: leg ${i} to ${i + 1}`);
      console.log(`      ${nPts} plan points standable, ${nLegs} path legs clear every 0.05 m; routed ${lens.join(', ')}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'nobody passes anybody in the 1.5 m passage: out of the lock and out of each compartment, Four\'s stack point lies no farther along the way than yours, and the holders stand 0.9 m and more off every stack point and every path of yours',
    fn() {
      const legs = HAULER_ORDER.map(k => HAULER_PLANS.plans[k]), rows = [], bad = [];
      for (let i = 1; i < legs.length; i++) {
        // (you lead out: your way from your point (or your start) to your stack; Four's stack along that way, against yours)
        const from = legs[i - 1].points[0], to = legs[i].stack[0], a1 = along(from, to, legs[i].stack[0]), a2 = along(from, to, legs[i].stack[1]);
        rows.push(`${HAULER_ORDER[i].split(':').at(-1)} #1 ${a1.toFixed(2)} m, #2 ${a2.toFixed(2)} m along`);
        if (a2 > a1 + 1e-6) bad.push(`${HAULER_ORDER[i]}: #2's stack ${a2.toFixed(2)} m along your way, past yours ${a1.toFixed(2)}`);
      }
      const hold = [];
      for (const h of HAULER_HOLDERS) {
        let least = Infinity;
        for (const P of legs.slice(1)) for (const p of P.stack) least = Math.min(least, D(h.at, p));
        for (const P of legs.slice(1)) for (const sl of [1, 2]) for (let i = 1; i < P.paths[sl].length; i++) least = Math.min(least, segD(P.paths[sl][i - 1], P.paths[sl][i], h.at) + 0.4);
        hold.push(`#${h.n} ${least.toFixed(2)} m`);
        if (least < HOLDER_GAP_M) bad.push(`holder #${h.n} ${least.toFixed(2)} m off a stack or a path`);
      }
      console.log(`      ${rows.join('; ')}; the holders' least gap to a stack point (or a path, less its body) ${hold.join(', ')}`);
      assert(!bad.length, bad.join('; '));
    },
  },
];
