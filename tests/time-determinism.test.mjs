// Determinism through an activity's skip (TIME §14; the build sheet 0.0.4 §5.2; TIME's test 16): the
// barracks at 21:00, 3,000 lived ticks walking the bay, a two-hour sleep in the rack skipped behind
// its splash, 3,000 more ticks (up, and down the aisle); run twice, and once saved and loaded inside
// the skip after its third slice: one digest. Prints the digests, µs a lived tick and µs a skipped
// game minute (CPU ceilings × machine().k, printed).
import { assert, fmt, machine } from './helpers.mjs';
import { createGame } from './game.mjs';
import { goTo, plan } from './bots/lib.mjs';
import { stepsBudget } from '../src/sim/time/skip.js';
import { MIN_MS, TICK_MS } from '../src/core/clock.js';

const SEED = 48213;
const START = { scenario: 'barracks', seed: SEED, hour: 21 };
/** CPU ceilings on the user's Mac in the foreground: a lived tick with the bay's 14, my 400 µs; a skipped minute TIME §5.10's 8-hour sleep in a quiet barracks, 25 ms (52 µs a minute), held here at 250 µs a minute until BODY's minute step meets it (the time role's own share is printed apart, held to 52). */
const TICK_US_MAX = 400, SKIP_MIN_US_MAX = 250, BUDGET_8H_MS = 25, OWN_MIN_US_MAX = 52;

const walkA = () => plan([goTo({ x: 58.4, z: 3.95 }), goTo({ x: 50.2, z: 3.95 }), goTo('f:e1:bay-2-1:rack-n1#1')]);
const walkB = () => plan([goTo({ x: 56.0, z: 3.95 }), goTo({ x: 51.0, z: 3.95 })]);

function runSliced(mode) {
  let g = createGame(START);
  const t = { tickUs: 0, ticks: 0, skipUs: 0, skipMin: 0, slices: 0 };
  const lived = (n, bot) => { const t0 = performance.now(); for (let i = 0; i < n; i++) g.step(1, bot); t.tickUs += (performance.now() - t0) * 1000; t.ticks += n; };
  lived(3000, walkA());
  const me = g.me();
  delete me.bot;                                                     // (the walk done: the next plan starts afresh)
  const r = g.sim.act(g.state, { act: 'activity', args: { id: 'sleep', spotId: 'f:e1:bay-2-1:rack-n1#1', args: { forMs: 2 * 3_600_000 } } }, g.bus, { held: false, tickMs: TICK_MS, sim: g.sim });
  assert(r && g.state.skip, `no sleep began: ${JSON.stringify(g.state.time.doing)} at ${JSON.stringify({ x: me.x, z: me.z })}`);
  const from = g.state.clock.ms;
  const t0 = performance.now();
  for (let n = 0; g.state.skip; n++) {
    g.advance(Infinity, stepsBudget(37));
    t.slices++;
    if (mode === 'inskip' && n === 2) { const json = g.save(); g = createGame(START); g.load(json); }
  }
  t.skipUs = (performance.now() - t0) * 1000;
  t.skipMin = (g.state.clock.ms - from) / MIN_MS;
  delete g.me().bot;
  lived(3000, walkB());
  return { g, t, digest: g.digest() };
}

export default [
  {
    name: 'test 16: 3,000 ticks, a two-hour sleep skipped in slices, 3,000 ticks, run twice and once saved and loaded inside the skip: one digest; µs a tick and a skipped minute',
    timeoutMs: 180_000,
    fn() {
      const a = runSliced('plain'), b = runSliced('plain'), c = runSliced('inskip');
      const k = machine().k;
      const tickUs = a.t.tickUs / a.t.ticks, minUs = a.t.skipUs / Math.max(1, a.t.skipMin);
      console.log(`      digests: ${a.digest}, again ${b.digest}, loaded inside the skip after its third slice ${c.digest}`);
      console.log(`      ${a.t.ticks} lived ticks at ${fmt(tickUs, 1)} µs (ceiling ${TICK_US_MAX} µs × k ${fmt(k, 2)}); the sleep ${fmt(a.t.skipMin, 0)} game min in ${a.t.slices} slices, ${fmt(minUs, 1)} µs a skipped minute (ceiling ${SKIP_MIN_US_MAX} µs × k)`);
      const end = a.g.facts('skip-end').at(-1);
      console.log(`      the sleep: ${end.activity}, ${end.minutes} min, ${end.interrupted ? `stopped by ${end.by}` : 'its full length'}; the player at (${fmt(a.g.me().x, 2)}, ${fmt(a.g.me().z, 2)}) ${a.g.me().posture ?? 'stand'}`);
      assert(a.digest === b.digest && a.digest === c.digest, `digests ${a.digest} ${b.digest} ${c.digest}`);
      assert(Math.abs(a.t.skipMin - (120 + 4.4)) < 0.01 && end.activity === 'sleep', `the sleep ran ${a.t.skipMin} min (the turn-in into PT kit, 4.4 min, and two hours)`);
      // (an 8-hour sleep from 22:00, timed whole and with the body inert: the time role's own share, the placing of the squad, the queue)
      const sleep8 = (domains) => {
        const g = createGame({ ...START, hour: 22, domains });
        g.sim.act(g.state, { act: 'activity', args: { id: 'sleep', spotId: 'f:e1:bay-2-1:rack-n1#1', args: { forMs: 8 * 3_600_000 } } }, g.bus, { held: false, tickMs: TICK_MS, sim: g.sim });
        const t0 = performance.now(); g.advance(); const ms = performance.now() - t0;
        return { ms, min: g.facts('skip-end').at(-1).minutes };
      };
      sleep8({}); sleep8({ body: { owner: 'BODY', keys: [] } });                       // (warm)
      const whole = sleep8({}), own = sleep8({ body: { owner: 'BODY', keys: [] } });
      const ownUs = own.ms * 1000 / own.min;
      console.log(`      an 8-hour sleep from 22:00: ${fmt(whole.ms, 1)} ms whole (${fmt(whole.ms * 1000 / whole.min, 1)} µs a minute; TIME §5.10's budget ${BUDGET_8H_MS} ms × k ${fmt(k, 2)}: ${whole.ms <= BUDGET_8H_MS * k ? 'within' : 'over, by the body\'s minute step'}), ${fmt(own.ms, 1)} ms with the body inert (${fmt(ownUs, 1)} µs a minute: the queue, the slow mark, the squad's placing)`);
      assert(tickUs <= TICK_US_MAX * k && minUs <= SKIP_MIN_US_MAX * k && ownUs <= OWN_MIN_US_MAX * k, `cost: ${fmt(tickUs, 1)} µs a tick, ${fmt(minUs, 1)} µs a minute, ${fmt(ownUs, 1)} µs a minute without the body`);
    },
  },
];
