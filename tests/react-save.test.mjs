// A save made inside the take-in's window loads and pauses on the same tick, byte for byte (COMBAT §25.4.8; the build sheet 0.0.8 §5.1).
//
// The private on the fixture bay (tests/contact-world.mjs) walking along the line when two turners turn, one at the
// sighting and one joining 150 ms later, so the window carries a join, the held feet and the notice roll: saved at
// seen + 1, + 5 and + 9 ticks (all inside the 1,250 ms window), each save loaded into a fresh game and stepped on with
// the same input pauses on the same tick, and its state after equals the unsaved run's, the save's JSON byte for
// byte and the digest; the window's record read back from the save equals the one saved.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { contactOf } from '../src/sim/people/mind.js';
import { takeInWords } from '../src/sim/combat/react.js';
import { bayGame, turn, runTo, LANE } from './contact-world.mjs';

const AFTER = 20;   // (ticks stepped after the pause: held, then X out and time running)
// (a record as JSON with its keys sorted: a load writes the canonical order)
const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(key => [key, x[key]])) : x));

export default [
  {
    name: 'saves at seen + 1, + 5 and + 9 ticks of the private\'s window each load and pause on the same tick, and carry on byte for byte with the unsaved run (COMBAT §25.4.8: "A save made inside the window loads and pauses on the same tick")',
    fn() {
      const input = { mz: 1 };
      const { g } = bayGame();
      const T = g.state.clock.ms;
      turn(g, [LANE], T);
      runTo(g, s => !!contactOf(s)?.pending, input);
      const seenMs = contactOf(g.state).pending.seenMs;
      turn(g, [LANE + 1], g.state.clock.ms + 100);
      const saves = {};
      let k = 0;
      // (stepped tick by tick to the pause, saved at seen + 1, 5 and 9 ticks)
      while (!contactOf(g.state)?.last) {
        g.step(1, input); k++;
        if ([1, 5, 9].includes(k)) saves[k] = { json: g.save(), atMs: g.state.clock.ms, pending: canon(contactOf(g.state).pending) };
      }
      const pauseMs = g.state.clock.ms, L = contactOf(g.state).last;
      g.step(AFTER - 1, input);
      g.step(1, { act: ['shoot'] });
      g.step(10, input);
      const ref = g.save(), refDigest = g.digest(), ticksTo = (atMs) => (pauseMs - atMs) / 50 + 1;
      console.log(`      the window: seen at T + ${seenMs - T}, n ${L.n} (${L.ids.join(', ')}), ${L.expect}, ${L.grade}; paused at T + ${pauseMs - T} (${takeInWords(L.ms)} s); then ${AFTER} ticks held, X, 10 ticks walking`);
      const bad = [];
      for (const [at, sv] of Object.entries(saves)) {
        const h = createGame({ scenario: 'test-handling', seed: 48213 });
        const s = h.load(sv.json);
        const back = canon(contactOf(s).pending);
        let n = 0;
        while (!contactOf(h.state)?.last && n < 200) { h.step(1, input); n++; }
        const pausedAt = h.state.clock.ms;
        h.step(AFTER - 1, input);
        h.step(1, { act: ['shoot'] });
        h.step(10, input);
        const same = h.save() === ref, dig = h.digest() === refDigest;
        console.log(`      saved at seen + ${at} ticks (T + ${sv.atMs - T}, ${fmt(sv.json.length / 1024, 0)} KB): the window read back ${back === sv.pending ? 'equal' : 'DIFFERENT'}; paused after ${n} ticks at T + ${pausedAt - T} (${pausedAt === pauseMs ? 'the same tick' : 'ANOTHER TICK'}, ${ticksTo(sv.atMs)} expected, the held tick counted); the state after: ${same ? 'byte for byte' : 'DIFFERENT'}, digest ${dig ? 'equal' : 'DIFFERENT'}`);
        if (back !== sv.pending || pausedAt !== pauseMs || n !== ticksTo(sv.atMs) || !same || !dig || h.errors.length) bad.push(at);
      }
      assert(Object.keys(saves).length === 3 && L.n === 2 && !bad.length && !g.errors.length, JSON.stringify({ bad, n: L.n, saves: Object.keys(saves) }));
    },
  },
];
