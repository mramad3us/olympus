// places-walk-sol: ROADMAP §4.1's walk test. A training sol's walks over Base Melas's site plan, leg
// by leg, before a building is drawn, against SOL_WALK_MAX_MIN 12 real minutes (my call in ROADMAP:
// about a quarter of TIME §17's 50-minute sol), and the same sol with an evening at the battalion gym
// against GYM_EVENING_MAX_MIN 15 (PLACES §4.3). The walker routes each leg on the site graph and
// measures its ground edges by A* on the ground and its interior edges (Echo's floor) by polyline.
//
// Both plans are walked: PLACES §4.2's as written (MELAS_PLAN_AS_WRITTEN, printed, not failed: the
// test's first finding) and the compacted one the game uses (MELAS_PLAN, which must hold). Times are
// at BODY §16.1's 1.14 m/s walk on Mars (WALK_MS; the build sheet §8 item 2), with ROADMAP's 1.2 and
// PLACES's brisk 1.32 m/s beside it. The user (tradecraft, 2026-10-29): "we should not have the
// option to just fast travel to work, it would skip all the gameplay", so walking is never removed:
// the plan compacts instead (ROADMAP §4.1's levers, in order).
//
// 0.0.3: Echo's ground floor is a live area, so its interior route's edges are measured again by A*
// on the floor itself (PLACES §4.3: "When Echo's floor becomes a live area … its interior route is
// measured by A* instead of v0.0.2's polylines, places-walk-sol is run again"), its doors open, and
// the sol is totalled both ways: printed, the plan's polyline sol still the one held.
import { assert, fmt } from './helpers.mjs';
import { MELAS_COMPACTION } from '../src/data/places/melas.js';
import { MELAS_PLAN, MELAS_PLAN_AS_WRITTEN } from '../src/sim/places/siteplan.js';
import { WALK_MS } from '../src/sim/places/move.js';
import { walkPlan, resetWalker, REF_SOL, GYM_EVENING, SOL_WALK_MAX_MIN, GYM_EVENING_MAX_MIN, SPEEDS_MS } from './bots/walker.mjs';
import { siteGraph, route } from '../src/sim/places/graph.js';
import { openNavOf, path } from '../src/sim/places/nav.js';
import { ECHO_1 } from '../src/sim/places/echo.js';

const mins = (r) => r.minutes.map((m, k) => `${fmt(m, 2)} min at ${r.speedsMs[k]} m/s`).join(', ');
function print(plan, sol, gym) {
  console.log(`      ${plan.id} (${plan.template}), leg by leg at ${WALK_MS} m/s:`);
  for (const l of sol.legs) console.log(`        ${String(l.n).padStart(2)} ${l.from.padEnd(17)} → ${l.to.padEnd(17)} ${fmt(l.lengthM, 1).padStart(6)} m ${fmt(l.s, 1).padStart(6)} s  (ground ${fmt(l.groundM, 1)}, inside ${fmt(l.interiorM, 1)}; ${l.why})`);
  console.log(`        the sol: ${fmt(sol.totalM, 1)} m, ${mins(sol)} (limit ${SOL_WALK_MAX_MIN}); computed in ${fmt(sol.computeMs, 0)} ms`);
  const g18 = gym.legs.filter(l => l.n === 18 || l.n === 19);
  console.log(`        the gym evening: ${g18.map(l => `${l.from} → ${l.to} ${fmt(l.lengthM, 1)} m`).join(', ')}; ${fmt(gym.totalM, 1)} m, ${mins(gym)} (limit ${GYM_EVENING_MAX_MIN})`);
}

export default [
  {
    name: 'the training sol walks at most 12 real minutes at 1.14 m/s over the compacted plan, the gym evening under 15; PLACES §4.2\'s plan as written is printed beside it',
    fn() {
      resetWalker();
      const asWritten = walkPlan(MELAS_PLAN_AS_WRITTEN, REF_SOL), asWrittenGym = walkPlan(MELAS_PLAN_AS_WRITTEN, GYM_EVENING);
      const sol = walkPlan(MELAS_PLAN, REF_SOL), gym = walkPlan(MELAS_PLAN, GYM_EVENING);
      print(MELAS_PLAN_AS_WRITTEN, asWritten, asWrittenGym);
      console.log(`      ${asWritten.minutes[0] > SOL_WALK_MAX_MIN ? `as written, over ${SOL_WALK_MAX_MIN} minutes by ${fmt(asWritten.minutes[0] - SOL_WALK_MAX_MIN, 2)}: compacted by ROADMAP §4.1's first lever (the daily places brought together)` : 'as written, within the limit'}:`);
      for (const m of MELAS_COMPACTION) console.log(`        ${m.id} moved from (${m.from}) to (${m.to}): ${m.why}`);
      print(MELAS_PLAN, sol, gym);
      const saved = asWritten.totalM - sol.totalM;
      console.log(`      the compaction saves ${fmt(saved, 1)} m a sol, ${fmt(saved / WALK_MS / 60, 2)} real minutes at ${WALK_MS} m/s; the mess is walked door to door until its floor is built (0.0.9); marches and rides are the Corps moving you, not walked`);
      for (const r of [asWritten, asWrittenGym, sol, gym]) assert(r.legs.every(l => l.lengthM !== null), JSON.stringify(r.legs.filter(l => l.lengthM === null)));
      assert(sol.minutes[0] <= SOL_WALK_MAX_MIN, `the sol walks ${fmt(sol.minutes[0], 2)} minutes at ${WALK_MS} m/s, over ${SOL_WALK_MAX_MIN}`);
      assert(gym.minutes[0] < GYM_EVENING_MAX_MIN, `the gym evening walks ${fmt(gym.minutes[0], 2)} minutes at ${WALK_MS} m/s, not under ${GYM_EVENING_MAX_MIN}`);
      assert(SPEEDS_MS[0] === WALK_MS, 'the first speed is the walk');
    },
  },
  {
    name: 'Echo\'s interior route measured by A* on its real ground floor (PLACES §4.3\'s rerun), and the sol totalled with it beside the polylines',
    fn() {
      const g = siteGraph(MELAS_PLAN), grid = openNavOf(ECHO_1.id, 'C0'), [ox, , oz] = ECHO_1.originM;
      const interior = g.edges.filter(e => e.kind === 'interior');
      const astar = new Map(), rows = [];
      for (const e of interior) {
        const a = e.pts[0], b = e.pts[e.pts.length - 1], r = path(grid, [a[0] - ox, a[1] - oz], [b[0] - ox, b[1] - oz]);
        astar.set(`${e.a}|${e.b}`, r.fail ? null : r.lengthM);
        rows.push(`${e.a} → ${e.b}: polyline ${fmt(e.lengthM, 2)} m, A* ${r.fail ? r.fail : `${fmt(r.lengthM, 2)} m`}`);
      }
      let poly = 0, real = 0;
      for (const leg of REF_SOL) {
        const r = route(g, leg.from, leg.to);
        for (const e of r.legs) if (e.kind === 'interior') { poly += e.lengthM; real += astar.get(`${e.a}|${e.b}`) ?? astar.get(`${e.b}|${e.a}`) ?? e.lengthM; }
      }
      const sol = walkPlan(MELAS_PLAN, REF_SOL), withAstar = sol.totalM - poly + real;
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      the reference sol's walk inside Echo: ${fmt(poly, 1)} m by the polylines, ${fmt(real, 1)} m by A* on the floor; the sol ${fmt(sol.totalM, 1)} m (${fmt(sol.minutes[0], 2)} min) becomes ${fmt(withAstar, 1)} m, ${fmt(withAstar / WALK_MS / 60, 2)} min at ${WALK_MS} m/s (limit ${SOL_WALK_MAX_MIN})`);
      assert([...astar.values()].every(v => v !== null), 'an interior edge A* cannot walk');
    },
  },
];
