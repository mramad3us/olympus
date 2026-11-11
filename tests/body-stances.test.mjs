// OLYMPUS tests: the movement stances, Relaxed, Combat and Assault, by gravity, and BODY §16.2's traction (src/sim/body/motion.js gaitSpeeds' gait, tractionOf; src/sim/places/move.js's inertia; the build sheet 0.0.12 §2.2, §4, §8 items 4 to 6).
//
// Held: the walks by gravity (1 G: Combat 1.23, Assault 2.03 m/s; Melas 0.97 and 1.60; Europa too), the runs unchanged; the
// build sheet's §4 traction rows by sheet at 1 G with 25 kg of kit on 75 (the boot recruit's push 2.88 and brake 4.68 m/s²
// to the tier one's 3.66 and the grip's 5.88), their stops and seams; a seam's cost lived by the keys (the private's stop
// from the Combat walk at 1 G in 0.24 s); Relaxed and an absent stance keep the built walk, so moment 2's walk does not move
// (tests/game-walk pins it to the tick).
import { assert, fmt } from './helpers.mjs';
import { gaitSpeeds, tractionOf, GAIT_K } from '../src/sim/body/motion.js';
import { G0_MS2 } from '../src/core/phys.js';
import { BODIES } from '../src/data/places/env.js';
import { drillWorld } from './drill-world.mjs';
import { legsHere } from '../src/sim/places/move.js';

const r2 = (x) => Math.round(x * 100) / 100;

export default [
  {
    name: 'the stances\' walks by gravity: Combat ×0.85 and Assault ×1.4 of the rounded walk, the runs unchanged (1 G: 1.23 and 2.03 m/s; Melas 0.97 and 1.60)',
    fn() {
      const rows = [];
      for (const [name, gG] of [['1 G', 1], ['Melas', BODIES.mars.gG], ['Europa', BODIES.europa.gG]]) {
        const g = Object.fromEntries(Object.keys(GAIT_K).map(k => [k, gaitSpeeds({ gG, gait: k })]));
        rows.push({ name, walk: Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.walkMs])), run: g.relaxed.runMs, runSame: g.combat.runMs === g.relaxed.runMs && g.assault.runMs === g.relaxed.runMs });
        console.log(`      ${name.padEnd(7)} walk: relaxed ${fmt(g.relaxed.walkMs, 2)}, combat ${fmt(g.combat.walkMs, 2)}, assault ${fmt(g.assault.walkMs, 2)} m/s; run ${fmt(g.relaxed.runMs, 2)} in all three`);
      }
      assert(rows[0].walk.combat === 1.23 && rows[0].walk.assault === 2.03 && rows[1].walk.combat === 0.97 && rows[1].walk.assault === 1.6, JSON.stringify(rows));
      assert(rows.every(r => r.runSame), 'the runs');
      assert(gaitSpeeds({ gG: 1 }).walkMs === gaitSpeeds({ gG: 1, gait: 'relaxed' }).walkMs, 'absent is Relaxed');
    },
  },
  {
    name: 'BODY §16.2\'s traction at 1 G with 25 kg of kit on 75 by sheet, against the build sheet\'s §4 rows: push and brake, the stop and the seam from Combat and Assault',
    fn() {
      const want = { recruit: [8, 2.88, 4.68], private: [12, 3.12, 5.07], cpl: [13, 3.18, 5.17], sgt: [14, 3.24, 5.27], raider: [19, 3.54, 5.75], tierone: [21, 3.66, 5.88] };
      const bad = [];
      for (const [tier, [F, up, dn]] of Object.entries(want)) {
        const t = tractionOf({ gMs2: G0_MS2, mu: 0.6, effFitness: F, massKg: 75, loadKg: 25 });
        const stopC = 1.23 / t.brakeMs2, stopA = 2.03 / t.brakeMs2, seamC = 1.23 / t.pushMs2 + stopC, seamA = 2.03 / t.pushMs2 + stopA;
        console.log(`      ${tier.padEnd(8)} (F ${F}): push ${fmt(t.pushMs2, 2)}, brake ${fmt(t.brakeMs2, 2)} m/s²; a stop ${fmt(stopC, 2)} / ${fmt(stopA, 2)} s, a seam ${fmt(seamC, 2)} / ${fmt(seamA, 2)} s (Combat / Assault)`);
        if (Math.abs(r2(t.pushMs2) - up) > 0.011 || Math.abs(r2(t.brakeMs2) - dn) > 0.011) bad.push(`${tier} ${r2(t.pushMs2)}, ${r2(t.brakeMs2)}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'a seam\'s cost lived by the keys in Combat at 1 G: the private walks to the Combat walk at his push and stops at his brake (0.24 s from 1.23 m/s), with the suit\'s kit',
    fn() {
      const w = drillWorld({ tier: 'private' }), { g, s, pid } = w, me = w.me();
      g.step(1, { act: [{ act: 'shoot' }] });
      const legs = legsHere(s, pid, me.x, me.z);
      let n = 0;
      for (; n < 60 && Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0) < 1.23 - 1e-9; n++) g.step(1, { mx: -1, mz: 0 });
      const up = n * 50, x0 = me.x;
      let k = 0;
      for (; k < 60 && me.v; k++) g.step(1, {});
      const stopMs = k * 50, stopM = x0 - me.x;
      console.log(`      the kit ${w.loadKg} kg: push ${fmt(legs.pushMs2, 2)}, brake ${fmt(legs.brakeMs2, 2)} m/s²; up to 1.23 m/s in ${up} ms, stopped in ${stopMs} ms over ${fmt(stopM, 3)} m`);
      assert(Math.abs(up - 1.23 / legs.pushMs2 * 1000) <= 60 && Math.abs(stopMs - 1.23 / legs.brakeMs2 * 1000) <= 60, JSON.stringify({ up, stopMs }));
    },
  },
  {
    name: 'Relaxed and an absent stance keep the built walk: no inertia, the built speed on the first tick (moment 2\'s walk and the shipped scenes do not move)',
    fn() {
      const w = drillWorld({ tier: 'private', stance: 'relaxed' }), { g, s } = w, me = w.me();
      g.step(1, { act: [{ act: 'shoot' }] });
      const x0 = me.x;
      g.step(1, { mx: -1, mz: 0 });
      const step = x0 - me.x;
      delete me.moveStance;
      const x1 = me.x;
      g.step(1, { mx: -1, mz: 0 });
      console.log(`      Relaxed: ${fmt(step, 4)} m on the first tick, absent: ${fmt(x1 - me.x, 4)} m (1.45 m/s × 0.05 s = 0.0725 m), no velocity kept: ${me.v === undefined}`);
      assert(Math.abs(step - 0.0725) < 1e-4 && Math.abs(x1 - me.x - 0.0725) < 1e-4 && me.v === undefined, `${step} ${x1 - me.x}`);
    },
  },
];
