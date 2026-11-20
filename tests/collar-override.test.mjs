// OLYMPUS tests: the breach by override, F152 (the build sheet v0.0.27 §1 D, item 2, §6 D, §8; COMBAT §14.3; SH§5).
//
// At the leader's "Four, override." your #4 at the lock's panel rolls d20 + Tech once against OVERRIDE_DC 13 (shoothouse.js overrideRoll,
// pure): 120 s on a pass, 30 s more a point under, at most 300 s; a miss by 5 or more locks the panel out once for 60 s more (his "Panel's
// locked me out. Again."). The time passes in one outcome skip behind one splash, never a fast-forward; at its end, and not before, the
// holdouts are alerted (the 'collar' fact the defenders read), the lock's inner hatch undogged and the panel's lamp green; the tower's
// "Stand by." follows. These cases hold the roll's rule over every sheet's Tech on 2,000 seeds, and the scene's one lane to "Stand by." on
// 48213 by the private with the save at the override's end carrying on byte for byte.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { overrideRoll, OVERRIDE_PASS_MS, OVERRIDE_POINT_MS, OVERRIDE_MAX_MS, OVERRIDE_LOCKOUT_MS, OVERRIDE_LOCKOUT_MISS } from '../src/sim/scenarios/shoothouse.js';
import { OVERRIDE_DC } from '../src/data/courses.js';
import { testSheet, TEST_SHEETS } from '../src/sim/skills/templates.js';
import { value } from '../src/sim/skills/skills.js';
import { lockedOf } from '../src/sim/combat/bundle.js';
import { collarBot } from './bots/collar.mjs';

const N = 2000;

export default [
  {
    name: 'F152: the override\'s roll by every sheet\'s Tech on 2,000 seeds: 120 s on a pass, 30 s more a point under, at most 300 s, a lockout of 60 s once on a miss by 5 or more, nothing outside 120 to 300 s',
    fn() {
      const rows = [], bad = [];
      for (const tier of Object.keys(TEST_SHEETS)) {
        const v = value(testSheet(tier), 'tech');
        let pass = 0, lock = 0, sum = 0, lo = Infinity, hi = 0;
        for (let seed = 1; seed <= N; seed++) {
          const r = overrideRoll(seed, v), under = Math.max(0, OVERRIDE_DC - r.total), locked = !r.ok && -r.margin >= OVERRIDE_LOCKOUT_MISS;
          const want = Math.min(OVERRIDE_MAX_MS, (r.ok ? OVERRIDE_PASS_MS : OVERRIDE_PASS_MS + under * OVERRIDE_POINT_MS) + (locked ? OVERRIDE_LOCKOUT_MS : 0));
          if (r.ms !== want || r.ms < OVERRIDE_PASS_MS || r.ms > OVERRIDE_MAX_MS || r.tries !== (locked ? 2 : 1)) bad.push(`${tier} ${seed}: ${JSON.stringify(r)}`);
          pass += r.ok; lock += locked; sum += r.ms; lo = Math.min(lo, r.ms); hi = Math.max(hi, r.ms);
        }
        rows.push(`${tier} Tech ${v}: pass ${(100 * pass / N).toFixed(1)}%, locked out ${(100 * lock / N).toFixed(1)}%, mean ${(sum / N / 1000).toFixed(1)} s, ${lo / 1000} to ${hi / 1000} s`);
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, bad.slice(0, 5).join('; '));
    },
  },
  {
    name: 'F152: the private on 48213 from the brief to "Stand by.": one splash for the override (an outcome skip, never lived), the holdouts alerted at its end and not before, the inner hatch undogged and the lamp green then, its save carrying on byte for byte for 300 ticks',
    fn() {
      const g = createGame({ scenario: 'test-collar', seed: 48213, tier: 'private', holdouts: 'pirates' }), s = g.state, R = s.armoury.range, H = R.house, B = H.boarding, bot = collarBot({ mode: 'keys' });
      const facts = [], skips = [], hatch = 'o:mu:d2:lock';
      g.bus.on?.('house', f => facts.push({ ...f, at: s.clock.ms }));
      g.bus.on?.('activity', f => { if (f.phase === 'start') skips.push(f); });
      let lockedBefore = null, lampBefore = null, saved = null;
      for (let i = 0; i < 8000 && !saved; i++) {
        if (B.collar && B.collar.alertAtMs === null && lockedBefore === null && !s.skip) { lockedBefore = lockedOf(s, hatch); lampBefore = B.collar.lamp; }
        g.step(1, bot);
        if (B.collar?.alertAtMs !== null && B.collar?.alertAtMs !== undefined) saved = g.save();
      }
      const K = B.collar, f = facts.filter(x => x.phase === 'override');
      // (the save at the override's end, loaded, carries on as the game it came from, through "Stand by." and GO)
      const g2 = createGame({ scenario: 'test-collar', seed: 48213, tier: 'private', holdouts: 'pirates' });
      g2.load(saved);
      g.step(300, bot); g2.step(300, collarBot({ mode: 'keys' }));
      console.log(`      roll ${K.roll} + Tech = ${K.total} against ${K.dc}: ${K.ok ? 'pass' : 'miss'}, ${K.ms / 1000} s, tries ${K.tries}; splashes ${skips.length} (${skips.map(x => `${x.activity} ${x.mode} ${(x.toMs - x.fromMs) / 1000} s`).join(', ')}); the alert at ${f.length ? (f[0].atMs - K.atMs) / 1000 : '-'} s from the command; the hatch dogged before ${lockedBefore}, after ${lockedOf(s, hatch)}; the lamp ${lampBefore} then ${K.lamp}; the tower at ${R.cmd?.id} 300 ticks on`);
      console.log(`      the save at the alert carried on 300 ticks: ${g.digest()} and loaded ${g2.digest()}`);
      assert(skips.length === 1 && skips[0].mode === 'outcome' && skips[0].toMs - skips[0].fromMs === K.ms, JSON.stringify(skips));
      assert(f.length === 1 && f[0].atMs === K.doneAtMs && f[0].roll === K.total && f[0].dc === 13 && f[0].ms === K.ms && f[0].tries === K.tries, JSON.stringify(f));
      assert(lockedBefore === true && lockedOf(s, hatch) === false && lampBefore === 'amber' && K.lamp === 'green', 'the hatch and the lamp');
      assert(['standby', 'go'].includes(R.cmd?.id), R.cmd?.id);
      assert(g.digest() === g2.digest(), 'byte for byte');
    },
  },
];
