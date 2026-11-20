// OLYMPUS tests: the canopy's one choice, F176 (the build sheet v0.0.28 item 10, §0 items 1 to 4, §6 B, §8).
//
// On armoury-world's canopy setup at the canopy's own hour (09:26, the bus back from the ammunition point): the three rows' minutes and
// spotless percentages equal upkeep.js cleanMs and cleanOdds exactly, on five sheets; the rows struck with cleanOff's words on a chamber
// believed '?'; the DI's tempo by the rule (the most careful whose clean, one re-clean and two trips of TRIP_MIN fit before ten-thirty;
// none, rushed): normal for the boot recruit and the private, careful from the corporal up on a clean day, rushed for the private with
// twenty minutes left (a shakedown's day); signed in after RACK_BY_H the fault 'late', never a stop. Each fails without its rule. The review
// of v0.0.28 C's: your squad placed at the canopy leaves your own table's four places free, so no marine stands 1.75 m in front of you on
// the picture with his head on your ring and your mat.
import { assert } from './helpers.mjs';
import { armGame, armOf, act, untilCmd, toStation } from './armoury-world.mjs';
import { armouryNow, armouryOf, diTempoOf, TRIP_MIN } from '../src/sim/scenarios/armoury-day.js';
import { cleanMs, cleanOdds, cleanOff } from '../src/sim/arms/upkeep.js';
import { armouryPlaceOf } from '../src/sim/places/fixtures.js';

const HOUR = 9 + 26 / 60;
const mins = (ms) => Math.max(1, Math.round(ms / 60000));

export default [
  {
    name: 'F176: the three rows\' minutes and spotless chances equal cleanMs and cleanOdds on five sheets; the DI\'s tempo normal for the recruit and the private, careful from the corporal up',
    fn() {
      const bad = [], want = { recruit: 'normal', private: 'normal', cpl: 'careful', sgt: 'careful', tierone: 'careful' };
      for (const tier of Object.keys(want)) {
        const g = armGame({ tier, setup: 'canopy', hour: HOUR }), A = armOf(g), pid = g.state.player.id;
        untilCmd(g, 'clean'); toStation(g);
        const N = armouryNow(g.state);
        const rows = N.rows.map(r => {
          const ms = cleanMs(g.state, pid, A.gunId, r.tempo), p = cleanOdds(g.state, pid, A.gunId, r.tempo).spotless;
          if (!r.label.includes(`· ${mins(ms)} min · ${Math.round(p * 100)}% spotless`)) bad.push(`${tier} ${r.id}: "${r.label}" against ${mins(ms)} min, ${Math.round(p * 100)}%`);
          return r.label;
        });
        const t = diTempoOf(g.state);
        console.log(`      ${tier}: ${rows.join(' | ')}; the DI's ${t} with ${Math.round((A.rackByMs - g.state.clock.ms) / 60000)} min left`);
        if (t !== want[tier]) bad.push(`${tier}: the DI's ${t}, not ${want[tier]}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'F176: every row struck with cleanOff\'s words on a chamber believed \'?\'; rushed for the private with twenty minutes left; signed in after ten-thirty the fault \'late\', the card still reached',
    fn() {
      const g = armGame({ tier: 'private', setup: 'canopy', hour: HOUR }), A = armOf(g), pid = g.state.player.id, gun = g.state.items[A.gunId];
      untilCmd(g, 'clean'); toStation(g);
      gun.belief = { ...gun.belief, chamber: '?' };
      const why = cleanOff(g.state, pid, A.gunId), struck = armouryNow(g.state).rows;
      console.log(`      a chamber believed '?': ${struck.map(r => `${r.id} ${r.struck ? `"${r.why}"` : 'open'}`).join(', ')} (cleanOff: "${why}")`);
      assert(why && struck.length === 3 && struck.every(r => r.struck && r.why === why), JSON.stringify(struck));
      const h = armGame({ tier: 'private', setup: 'canopy', hour: 10 + 10 / 60 }), B = armOf(h);
      const left = Math.round((B.rackByMs - h.state.clock.ms) / 60000), t = diTempoOf(h.state);
      const need = (tempo) => Math.round((cleanMs(h.state, h.state.player.id, B.gunId, tempo) + cleanMs(h.state, h.state.player.id, B.gunId, tempo, { again: true }) + 2 * TRIP_MIN * 60000) / 60000);
      console.log(`      ${left} min left: rushed needs ${need('rushed')}, normal ${need('normal')}: the DI's ${t}`);
      assert(t === 'rushed', t);
      // (late: the turn-in setup, ten-thirty moved behind the clock, the window to the card)
      const k = armGame({ tier: 'private', setup: 'turnin' }), C = armOf(k), R = armouryOf(k.state);
      C.rackByMs = k.state.clock.ms - 1;
      untilCmd(k, 'barrel'); toStation(k); act(k, 'barrel'); untilCmd(k, 'handIn'); toStation(k);
      act(k, 'handIn'); untilCmd(k, 'signIn'); act(k, 'signIn');
      for (let i = 0; i < 400 && !R.end; i++) k.step(1);
      console.log(`      signed in after ten-thirty: late ${C.late}, faults ${JSON.stringify(R.faults.map(f => `${f.rule}/${f.kind}`))}, the end ${R.end?.phase}`);
      assert(C.late && R.faults.some(f => f.rule === 'late' && f.kind === 'warn') && R.end?.phase === 'clear', JSON.stringify({ late: C.late, faults: R.faults, end: R.end }));
    },
  },
  {
    name: 'F176: your squad at the canopy leaves your own table\'s four places free, nobody in front of you at the mat (the review of v0.0.28 C)',
    fn() {
      const bad = [];
      for (const seed of [48213, 2, 7]) {
        const g = armGame({ seed, setup: 'canopy', hour: HOUR }), A = armOf(g), pid = g.state.player.id, table = A.table.split('#')[0];
        untilCmd(g, 'clean');
        const places = [1, 2, 3, 4].map(k => armouryPlaceOf(`${table}#${k}`)), others = g.state.actors.list.filter(a => a.who !== pid);
        const on = others.filter(a => places.some(p => Math.hypot(a.x - p.x, a.z - p.z) < 0.3)), near = Math.min(...others.map(a => Math.hypot(a.x - places[0].x, a.z - places[0].z)));
        console.log(`      seed ${seed}: your place ${A.table}; others at your table ${on.length}; the nearest other to your place ${near.toFixed(2)} m; ${others.length} others on the ground`);
        if (on.length) bad.push(`seed ${seed}: ${on.map(a => a.who).join(', ')} at your table`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
];
