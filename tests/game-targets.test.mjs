// The skip engine's grid and its independence from the splash (src/sim/time/skip.js; TECH §5.3,
// §5.5, §8.2): an 8-hour sleep advanced under three target curves and by skipNow, each stopped by
// the player 5 h in at the same atMs as a replay feeds it, gives one digest; so does a chapter day
// under two curves; and each kind steps on its own grid (outcome minutes; day hours while steady,
// minutes while not; world event to event while steady), every step ending at an event's second.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { post, hazard } from '../src/core/queue.js';
import { q } from '../src/core/num.js';
import { SEC_MS, MIN_MS, HOUR_MS, TICK_MS } from '../src/core/clock.js';
import { stepsBudget, NO_BUDGET } from '../src/sim/time/skip.js';

const TAU_MS = 47 * MIN_MS;                                          // (the test process's time constant)
const floorMin = (ms) => Math.floor(ms / MIN_MS) * MIN_MS;

// A small world for these tests: an exponential process stepped by the slow layer (its value
// depends on where steps end, so a grid moved by the splash would show), an hourly job, pre-drawn
// pings with a ticker line, and a window in which it is not steady. record, if given, hears every
// step as [t0, t1, steady at t0], and seen every event handled as [its atMs, the clock then]
// (runtime, outside the state).
function testWorld(record = null, seen = null) {
  const w = (state) => state.world.tw;
  const steadyAt = (state, ms) => !(w(state).unsteadyFromMs <= ms && ms < w(state).unsteadyToMs);
  return {
    owner: 'TECH', keys: ['world'],
    init(state) { state.world ??= {}; state.world.tw ??= { x: 1000, target: 20, steps: 0, hours: 0, pings: 0, gen: 0, pending: false, unsteadyFromMs: null, unsteadyToMs: null }; },
    slow: [{
      name: 'testWorld',
      step(state, bus, t0, t1) {
        const d = w(state);
        record?.push([t0, t1, steadyAt(state, t0)]);
        d.x = q(d.target + (d.x - d.target) * Math.exp(-(t1 - t0) / TAU_MS), 1e-6);
        d.steps++;
        if (!d.pending) { d.pending = true; hazard(state, { src: 'world:tw', key: 'ping', ratePerMin: 1 / 37, gen: d.gen, kind: 'tw-ping', line: 'A ping on the net.' }); }
      },
      steady: (state) => steadyAt(state, state.clock.ms),
      nextChangeMs: (state, t0) => { const d = w(state); return d.unsteadyFromMs !== null && t0 < d.unsteadyFromMs ? d.unsteadyFromMs : d.unsteadyToMs !== null && t0 < d.unsteadyToMs ? d.unsteadyToMs : Infinity; },
    }],
    jobs: { twHourly: { every: 'hour@:17Z', run: (state, bus, ev) => { seen?.push([ev.atMs, state.clock.ms]); w(state).hours++; } } },
    events: {
      'tw-ping': (state, bus, ev) => { seen?.push([ev.atMs, state.clock.ms]); const d = w(state); d.pings++; d.gen++; d.pending = false; d.target = 20 + (d.pings % 7) * 3; },
      'tw-odd': (state, bus, ev) => { seen?.push([ev.atMs, state.clock.ms]); w(state).target += 1; },
    },
  };
}

// (one 8-hour sleep from 22:00 Melas, stopped by skip:stop at stopAt, with targets from curve(frame) and a budget)
function sleepRun(curve, budget, { kind = 'outcome', planMs = 8 * HOUR_MS, stopAfterMs = 5 * HOUR_MS, unsteady = null } = {}) {
  const g = createGame({ seed: 48213, hour: 22, domains: { world: testWorld() } });
  g.step(40);
  if (unsteady) { g.state.world.tw.unsteadyFromMs = g.state.clock.ms + unsteady[0]; g.state.world.tw.unsteadyToMs = g.state.clock.ms + unsteady[1]; }
  const s = g.beginSkip({ activity: 'sleep', planMs, kind, mask: 'D' });
  const stopAt = stopAfterMs === null ? Infinity : floorMin(s.fromMs + stopAfterMs);
  let frames = 0, steps = 0;
  while (g.state.skip && g.state.clock.ms < stopAt && frames < 1e5) {
    const r = g.advance(Math.min(curve(frames, s), stopAt), budget);
    steps += r.steps; frames++;
  }
  let stoppedAt = null;
  if (g.state.skip) {
    stoppedAt = g.state.clock.ms;
    steps += g.advance(Infinity, budget, ['skip:stop']).steps;
    frames++;
  }
  const end = g.facts('skip-end').at(-1);
  return { digest: g.digest(), frames, steps, stoppedAt, end, x: g.state.world.tw.x, pings: g.state.world.tw.pings, hours: g.state.world.tw.hours, fromMs: s.fromMs, ticker: g.facts('skip-frame').reduce((n, f) => n + f.ticker.length, 0) };
}

// (TIME §6.2: the splash's real seconds for a gap of m minutes, and its eased progress)
const splashS = (m) => Math.min(8, Math.max(1.6, 1.4 + 0.95 * Math.log(1 + m / 4)));
const ease = (t) => t * t * (3 - 2 * t);
// (the target at progress p: floored to the minute, and at the end the skip's end itself, which need
// not be on a minute: a splash that floored its last target would never let the skip finish)
const at = (s, p) => (p >= 1 ? s.toMs : floorMin(s.fromMs + p * (s.toMs - s.fromMs)));
const curves = (planMs, fps = 60) => {
  const frames = Math.round(splashS(planMs / MIN_MS) * fps);
  return {
    ease: (f, s) => at(s, ease(Math.min(1, f / frames))),
    linear: (f, s) => at(s, Math.min(1, f / frames)),
    stall: (f, s) => (f < 40 ? floorMin(s.fromMs + 0.1 * (s.toMs - s.fromMs)) : s.toMs),
    now: (f, s) => Infinity,
  };
};

export default [
  {
    name: 'an 8-hour sleep under three target curves and by skipNow, each stopped by skip:stop 5 h in, gives one digest',
    fn() {
      const c = curves(8 * HOUR_MS);
      const runs = {
        ease: sleepRun(c.ease, stepsBudget(7)),
        linear: sleepRun(c.linear, NO_BUDGET),
        stall: sleepRun(c.stall, stepsBudget(1)),
        skipNow: sleepRun(c.now, NO_BUDGET),
      };
      const d = Object.values(runs).map(r => r.digest);
      assert(new Set(d).size === 1, Object.entries(runs).map(([k, r]) => `${k} ${r.digest}`).join(', '));
      const r0 = runs.ease;
      assert(Object.values(runs).every(r => r.stoppedAt === r0.stoppedAt && r.end.interrupted && r.end.by === 'player'), 'the stop landed at different atMs');
      assert(r0.stoppedAt === floorMin(r0.fromMs + 5 * HOUR_MS) && (r0.end.minutes === 299 || r0.end.minutes === 300), JSON.stringify(r0.end));
      assert(r0.pings > 3 && r0.hours >= 4 && r0.ticker === r0.pings, JSON.stringify({ pings: r0.pings, hours: r0.hours, ticker: r0.ticker }));
      console.log(`      ${Object.entries(runs).map(([k, r]) => `${k}: ${r.frames} frames, ${r.steps} steps, ${r.digest}`).join('; ')}`);
      console.log(`      stopped by the player at ${r0.stoppedAt} (${r0.end.minutes} minutes in) in every run; x ${r0.x}, ${r0.pings} pings on the ticker, ${r0.hours} hourly jobs`);
    },
  },
  {
    name: 'a chapter day under two curves gives one digest, its grid hours while steady and minutes while not',
    fn() {
      const c = curves(24 * HOUR_MS, 60);
      const opts = { kind: 'day', planMs: 24 * HOUR_MS, stopAfterMs: null, unsteady: [3 * HOUR_MS, 4.5 * HOUR_MS] };
      const a = sleepRun((f, s) => at(s, Math.min(1, f / 150)), stepsBudget(3), opts);
      const b = sleepRun(c.stall, NO_BUDGET, opts);
      assert(a.digest === b.digest && a.steps === b.steps && !a.end.interrupted && a.end.minutes === 24 * 60, JSON.stringify({ a: a.digest, b: b.digest, sa: a.steps, sb: b.steps }));
      // (24 h: about 24 hour steps, 90 minute steps in the unsteady stretch, and the events' seconds)
      assert(a.steps > 24 + 85 && a.steps < 24 + 90 + 2 * (a.pings + a.hours) + 4, `${a.steps} steps`);
      console.log(`      linear over 150 frames at 3 steps a frame: ${a.frames} frames, ${a.steps} steps, ${a.digest}; stalled 40 frames then all at once: ${b.frames} frames, ${b.steps} steps, ${b.digest}`);
      console.log(`      ${a.pings} pings and ${a.hours} hourly jobs in the day; 90 minutes not steady stepped by the minute`);
    },
  },
  {
    name: 'each kind\'s grid over 8 h: outcome minutes; day hours while steady, minutes while not; world event to event while steady; an event ends a step at its second',
    fn() {
      const out = [];
      for (const [kind, unsteady] of [['outcome', null], ['day', [2.5 * HOUR_MS, 3.5 * HOUR_MS]], ['world', null], ['world', [1 * HOUR_MS, 1.25 * HOUR_MS]]]) {
        const record = [], seen = [];
        const g = createGame({ seed: 7, hour: 21, domains: { world: testWorld(record, seen) } });
        g.step(1);
        const from = g.state.clock.ms;
        if (unsteady) { g.state.world.tw.unsteadyFromMs = from + unsteady[0]; g.state.world.tw.unsteadyToMs = from + unsteady[1]; }
        const oddAt = Math.floor((from + 90 * MIN_MS + 17 * SEC_MS) / SEC_MS) * SEC_MS;
        post(g.state, { atMs: oddAt, kind: 'tw-odd', src: 'test', prio: 5 });
        const end = g.skipNow({ activity: 'sleep', planMs: 8 * HOUR_MS, kind, mask: 'D' });
        const to = end.toMs;
        // (the events the skip met: the pings and hourly jobs at their seconds, and the odd one)
        const pings = g.state.world.tw.pings, hours = g.state.world.tw.hours;
        const ends = record.map(([, t1]) => t1);
        const evEnds = new Set(ends.filter(t1 => t1 % MIN_MS !== 0));
        assert(ends.includes(oddAt), `${kind}: no step ended at the event's second ${oddAt}`);
        const late = seen.filter(([atMs, clockMs]) => atMs !== clockMs || !ends.includes(atMs));
        assert(seen.length >= pings + hours + 1 && !late.length, `${kind}: ${late.length} of ${seen.length} events handled off their second: ${JSON.stringify(late[0])}`);
        assert(record.every(([t0, t1]) => t1 > t0) && ends.at(-1) === to, `${kind}: a zero step, or the last step missed the end`);
        if (kind === 'outcome') {
          const boundaries = Math.floor(to / MIN_MS) - Math.floor(from / MIN_MS);
          assert(record.every(([t0, t1]) => t1 <= floorMin(t0) + MIN_MS) && ends.filter(t1 => t1 % MIN_MS === 0).length === boundaries, `outcome: steps ${record.length}, minute ends ${ends.filter(t1 => t1 % MIN_MS === 0).length} of ${boundaries}`);
        } else if (kind === 'day') {
          const hourSteps = record.filter(([t0, t1, st]) => st && t1 - t0 > MIN_MS).length, minuteSteps = record.filter(([t0, t1, st]) => !st).length;
          assert(record.every(([t0, t1, st]) => t1 <= (st ? Math.floor(t0 / HOUR_MS) * HOUR_MS + HOUR_MS : floorMin(t0) + MIN_MS)), 'day: a step crossed its grid');
          assert(minuteSteps >= 59 && minuteSteps <= 61 + evEnds.size && hourSteps >= 5, `day: ${hourSteps} hour-long steps, ${minuteSteps} steps not steady`);
        } else {
          // (a steady step ends at an event's second, where a contributor next changes, or at the end)
          const changes = new Set([g.state.world.tw.unsteadyFromMs, g.state.world.tw.unsteadyToMs]);
          const lone = record.filter(([, t1, st]) => st && t1 !== to && t1 % SEC_MS !== 0 && !changes.has(t1));
          assert(!lone.length, `world: a steady step ended off a second: ${JSON.stringify(lone[0])}`);
          if (!unsteady) assert(record.length <= pings + hours + 3, `world: ${record.length} steps for ${pings + hours + 1} events`);
          else assert(record.filter(([, , st]) => !st).length >= 14, 'world: the unsteady quarter hour was not stepped by the minute');
        }
        out.push(`${kind}${unsteady ? ` (not steady ${fmt((unsteady[1] - unsteady[0]) / MIN_MS, 0)} min)` : ''}: ${record.length} steps; ${seen.length} events (${pings} pings, ${hours} hourly jobs, one at +${fmt((oddAt - from) / SEC_MS, 0)} s), each handled at its own second, a step ending there`);
      }
      for (const line of out) console.log(`      ${line}`);
    },
  },

  {
    name: 'every skip step ends on the 50 ms tick grid: a contributor whose next change is fractional (t0 + 2,345,678.9 ms), and a chunk of 1,234 ms, leave the clock on whole ticks, and live play after counts its seconds (0.0.2: off the grid, the live autosave never came)',
    fn() {
      const out = [];
      for (const kind of ['day', 'world']) {
        const record = [];
        const odd = { owner: 'TECH', keys: ['world'], init: (st) => { st.world ??= {}; },
          slow: [{ name: 'oddChange', step: (st, bus, t0, t1) => { record.push([t0, t1]); }, steady: () => true, nextChangeMs: (st, t0) => t0 + 2_345_678.9 }] };
        const g = createGame({ seed: 5, hour: 9, domains: { world: odd } });
        g.step(3);
        const s = g.beginSkip({ activity: 'wait', planMs: 6 * HOUR_MS, kind, mask: 'D' });
        g.advance(s.fromMs + 2 * HOUR_MS);                              // (a slice, then the player stops it there)
        g.advance(Infinity, NO_BUDGET, ['skip:stop']);
        const off = record.filter(([, t1]) => t1 % TICK_MS !== 0), at = g.state.clock.ms;
        const live0 = g.state.time.liveSinceSaveMs;
        g.step(40);
        const counted = g.state.time.liveSinceSaveMs - live0;
        out.push(`${kind}: ${record.length} steps, ${off.length} off the grid; stopped at +${fmt((at - s.fromMs) / SEC_MS, 1)} s (clock mod 50 ms: ${at % TICK_MS}); 40 live ticks counted ${counted} ms toward the live autosave`);
        assert(!off.length && at % TICK_MS === 0, `${kind}: off the grid: ${JSON.stringify(off[0])}, clock ${at}`);
        assert(counted === 2 * SEC_MS, `${kind}: 40 live ticks counted ${counted} ms`);
      }
      // (a chunk of 1,234 ms asked: rounded up to 1,250, so the wait ends on the grid)
      const g = createGame({ seed: 5, hour: 9 });
      g.step(3);
      const s = g.beginSkip({ activity: 'wait', planMs: 10 * MIN_MS, kind: 'outcome', mask: 'D', chunkMs: 1234 });
      g.advance(s.toMs - MIN_MS, NO_BUDGET, ['skip:chunk']);
      g.advance(Infinity);
      const end = g.facts('skip-end').at(-1);
      out.push(`a chunk of 1,234 ms asked: chunkMs ${s.chunkMs}; the wait ended at +${fmt((end.toMs - end.fromMs) / SEC_MS, 3)} s (mod 50 ms: ${end.toMs % TICK_MS})`);
      for (const line of out) console.log(`      ${line}`);
      assert(s.chunkMs === 1250 && end.toMs === s.fromMs + 10 * MIN_MS + 1250 && end.toMs % TICK_MS === 0, JSON.stringify({ chunkMs: s.chunkMs, end }));
    },
  },
  {
    name: 'an event due at the skip\'s first clock is handled at its own second, not a step late (0.0.2: at +2 s, for one due at +1 s)',
    fn() {
      const seen = [];
      const probe = { owner: 'TECH', keys: ['world'], init: (st) => { st.world ??= {}; }, events: { 'probe': (st, bus, ev) => { seen.push([ev.atMs, st.clock.ms]); } } };
      const g = createGame({ seed: 9, hour: 9, domains: { world: probe } });
      // (to a tick at .950 of a second, then R pressed on it: the skip's first clock is the next whole second)
      while (g.state.clock.ms % SEC_MS !== 950) g.step(1);
      const due = g.state.clock.ms + TICK_MS;
      post(g.state, { atMs: due, kind: 'probe', src: 'test', prio: 5 });
      g.step(1, { act: ['hand'] });
      const end = g.facts('skip-end').at(-1);
      console.log(`      R pressed on the tick at .950: the probe due at the skip's first clock (+50 ms) handled with the clock at +${seen[0] ? seen[0][1] - due + 50 : '?'} ms; the wait ran ${fmt((end.toMs - end.fromMs) / MIN_MS, 2)} min`);
      assert(seen.length === 1 && seen[0][0] === due && seen[0][1] === due, JSON.stringify({ seen, due }));
    },
  },
  {
    name: 'a hold set during a skip stops it there, by \'hold\': an outcome skip at the step that set it, a fast-forward at the tick',
    fn() {
      const out = [];
      for (const [kind, planMs] of [['outcome', 2 * HOUR_MS], ['ff', 90_000]]) {
        const summons = { owner: 'TECH', keys: ['world'], init: (s) => { s.world ??= {}; },
          events: { 'test-summons': (state) => { state.clock.holds.push('talk'); } } };
        const g = createGame({ seed: 21, domains: { world: summons } });
        g.step(5);
        const from = g.state.clock.ms, at = Math.floor((from + planMs / 3) / SEC_MS) * SEC_MS;
        post(g.state, { atMs: at, kind: 'test-summons', src: 'test', prio: 2 });
        if (kind === 'ff') { g.sim.beginSkip(g.state, { activity: 'wait', planMs }); for (let i = 0; i < 5000 && g.state.skip; i++) g.step(1); }
        else g.skipNow({ activity: 'wait', planMs, kind, mask: 'D' });
        const end = g.facts('skip-end').at(-1);
        assert(!g.state.skip && end.interrupted && end.by === 'hold' && end.toMs >= at && end.toMs <= at + MIN_MS, JSON.stringify(end));
        out.push(`${kind}: summoned at +${fmt((at - from) / SEC_MS, 2)} s, stopped at +${fmt((end.toMs - from) / SEC_MS, 2)} s by '${end.by}'`);
      }
      console.log(`      ${out.join('; ')}`);
    },
  },
];
