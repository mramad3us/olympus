// OLYMPUS tests: T on a DI line that names a reach does the reach (the integrator's fix of v0.0.10, reported by the scene role).
// instinct/range.js stepOfAct read the '@' of every act as its tempo, so 'stop:reach@p3' (pairs-short's reach, pairs-reload's
// reach and the ground, pairs-ready's magazine) parsed as the step 'reach' at the tempo 'p3', chooseStep refused it, and T
// did nothing on a line the panel had (the user's rule: every DI line names a row the panel has, and T does it). Now only
// a tempo the steps know (checks.js TEMPO) is read after the '@'; anything else is the row's place.
//
// The parse is checked on its own; then the stress bot plays test-stress and test-pairs and, at every DI line or chip whose
// act is a reach@ row, a copy of the game loaded from that tick is sent T: the reach must start.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stressBot } from './bots/stress.mjs';
import { pairsBot } from './bots/pairs.mjs';
import { stepOfAct } from '../src/sim/skills/instinct/range.js';
import { firedNow } from '../src/sim/skills/instinct.js';
import { pairsNow } from '../src/sim/scenarios/pairs.js';

export default [
  {
    name: 'stepOfAct reads a tempo after \'@\' only when it is one (normal, rushed, careful, steady); otherwise the \'@\' is the row\'s place (\'reach@p3\', \'reach@ground\'), so T on a reach line chooses that row (v0.0.10; T did nothing there)',
    fn() {
      const cases = [
        ['stop:reach@p3', { step: 'reach@p3', tempo: 'normal', target: null }],
        ['stop:reach@ground', { step: 'reach@ground', tempo: 'normal', target: null }],
        ['stop:fire@careful', { step: 'fire', tempo: 'careful', target: null }],
        ['stop:shot:pair@rushed>turner:3', { step: 'shot:pair', tempo: 'rushed', target: 'turner:3' }],
        ['stop:aim>paper:4', { step: 'aim', tempo: 'normal', target: 'paper:4' }],
        ['stop:stowMag@p2', { step: 'stowMag@p2', tempo: 'normal', target: null }],
      ];
      for (const [act, want] of cases) {
        const got = stepOfAct(act);
        console.log(`      ${act} → ${JSON.stringify(got)}`);
        assert(JSON.stringify(got) === JSON.stringify(want), JSON.stringify({ act, got, want }));
      }
    },
  },
  {
    name: 'over whole courses (the stress bot on test-stress, the pairs bot on test-pairs, recruit and private, three seeds each), every DI line naming a reach@ row is done by T: the reach starts from a copy of that tick',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    timeoutMs: 300_000,
    fn() {
      let seen = 0, done = 0;
      const bad = [], ids = {};
      for (const [scenario, mk] of [['test-stress', stressBot], ['test-pairs', pairsBot]]) {
        for (const tier of ['recruit', 'private']) {
          for (const seed of [48213, 7, 2024]) {
            const g = createGame({ scenario, seed, tier }), bot = mk();
            let tried = 0;
            for (let t = 0; t < 20 * 60 * 20 && !pairsNow(g.state)?.end && tried < 6; t++) {
              g.step(1, bot); g.clearFacts();
              const reach = firedNow(g.state).find(l => /^stop:reach@/.test(l.act ?? ''));
              if (!reach) continue;
              tried++; seen++; ids[reach.id] = (ids[reach.id] ?? 0) + 1;
              const h = createGame({ scenario, seed, tier });
              h.load(g.save());
              h.step(1, { act: [{ act: 'instinct', args: { id: reach.id, act: reach.act } }] });
              const d = h.state.stop?.doing, ok = !!d && String(d.step ?? '').startsWith('reach@');
              if (ok) done++; else bad.push({ scenario, tier, seed, tick: g.state.clock.tick, id: reach.id, act: reach.act, doing: d?.step ?? null });
            }
          }
        }
      }
      console.log(`      ${seen} reach lines met (${Object.entries(ids).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}); T did the reach on ${done}`);
      assert(seen > 0, 'no reach line met: the test proves nothing');
      assert(!bad.length, JSON.stringify(bad.slice(0, 5)));
    },
  },
];
