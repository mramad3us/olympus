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
import { assert, fmt } from './helpers.mjs';
import { MELAS_COMPACTION } from '../src/data/places/melas.js';
import { MELAS_PLAN, MELAS_PLAN_AS_WRITTEN } from '../src/sim/places/siteplan.js';
import { WALK_MS } from '../src/sim/places/move.js';
import { walkPlan, resetWalker, REF_SOL, GYM_EVENING, SOL_WALK_MAX_MIN, GYM_EVENING_MAX_MIN, SPEEDS_MS } from './bots/walker.mjs';

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
];
