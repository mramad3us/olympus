// test-pairs never dead-ends (src/sim/scenarios/pairs.js; the user, 2026-11-07: "a scene never dead-ends", DESIGN.md's log; the build sheet 0.0.8 §5.3): a fuzz shooter of random rows, aims at the no-shoot, never reloading, idling out of the mode, entering the mode in the standby and walking off the point reaches the card on every run within 30 game minutes; a shooter who never leaves the mode in the standby, and one who never engages, are passed over by the coach.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { pairsFuzzBot, pairsBot } from './bots/pairs.mjs';
import { pairsNow, STRING_MAX_MS } from '../src/sim/scenarios/pairs.js';
import { COURSES } from '../src/data/courses.js';
import { checkIds } from './ids-check.mjs';
import { stepAct } from './bots/lib.mjs';

/** A fuzz run's bound (game ms; the build sheet §5.3): 30 game minutes. */
export const FUZZ_BOUND_MS = 30 * 60_000;
const C = COURSES.pairs;

// (one fuzz run: the card or not, its game time, its decisions, its faults and the dead ends hunted: a command waited on past moveOnMs lived)
function fuzzRun(seed, { tier = null } = {}) {
  const tiers = ['recruit', 'private', 'sgt', 'raider', 'tierone'];
  const g = createGame({ scenario: 'test-pairs', seed: 3000 + seed, tier: tier ?? tiers[seed % tiers.length] }), s = g.state, t0 = s.clock.ms, bot = pairsFuzzBot({ seed });
  let ticks = 0, lastCmdAt = t0, longest = 0, lived = 0, seen = 0;
  for (; ticks < Math.ceil(FUZZ_BOUND_MS / 50) + 20 && !pairsNow(s).end; ticks++) {
    const before = s.clock.ms;
    g.step(1, bot);
    if (s.clock.ms - before <= 50) lived += s.clock.ms - before;
    const ev = g.bus.events;
    for (; seen < ev.length; seen++) if (ev[seen][0] === 'range' && ev[seen][1].phase === 'cmd') { longest = Math.max(longest, lived - lastCmdAt); lastCmdAt = lived; }
    if (ev.length > 5000) { g.clearFacts(); seen = 0; }
  }
  const P = pairsNow(s), R = s.armoury.range, mem = g.me().bot, faults = {};
  for (const f of R.faults) faults[f.rule] = (faults[f.rule] ?? 0) + 1;
  return { seed, tier: R.sheet, end: P.end?.phase ?? null, why: P.end?.why ?? null, ms: s.clock.ms - t0, ticks, longestMs: longest, decisions: Object.values(mem.steps ?? {}).reduce((a, b) => a + b, 0), steps: { ...(mem.steps ?? {}) },
    strs: P.strs.map(x => x.done), faults, errors: g.errors.length, ids: checkIds(JSON.parse(g.save()), g.sim.domains), summary: P.summary };
}
function fuzzTable(runs) {
  for (const r of runs) console.log(`      ${r.tier} ${r.seed}: ${r.end ?? 'NO END'}${r.why ? ` (${r.why})` : ''} at +${fmt(r.ms / 60000, 1)} min, ${r.decisions} decisions, strings ${r.strs.join(' ')}; faults ${Object.entries(r.faults).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}; the longest wait on a command ${fmt(r.longestMs / 1000, 0)} s lived`);
  const sum = (pred) => runs.reduce((a, r) => a + Object.entries(r.steps).filter(([k]) => pred(k)).reduce((b, [, n]) => b + n, 0), 0);
  console.log(`      the hunted: shot rows ${sum(k => k.startsWith('shot:'))}, the brackets moved ${sum(k => k === 'pick')}, the contact's rows ${sum(k => k.startsWith('contact:'))}, reloads ${sum(k => /reload/.test(k))}, X ${sum(k => k === 'leave')}, G ${sum(k => k === 'G')}, walks ${sum(k => k === 'walk')}, waits ${sum(k => k === 'wait')}`);
  const worst = Math.max(...runs.map(r => r.ms));
  console.log(`      ${runs.length} runs: ${runs.filter(r => r.end).length} to the card; the longest +${fmt(worst / 60000, 1)} min of game time (bound ${FUZZ_BOUND_MS / 60000} min)`);
  for (const r of runs) assert(r.end && r.ms <= FUZZ_BOUND_MS && !r.errors && !r.ids.invalid.length && !r.ids.dangling.length, JSON.stringify({ ...r, ids: { invalid: r.ids.invalid.slice(0, 3), dangling: r.ids.dangling.slice(0, 3) } }));
}

export default [
  {
    name: 'a fuzz shooter (random rows, the brackets on the no-shoot, never reloading on odd seeds, idling out of the mode, entering it in the standby, walking off the point) reaches the card on 4 runs within 30 game minutes, every item held once (the user, 2026-11-07: "a scene never dead-ends")',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    fn() { fuzzTable([1, 2, 3, 4].map(seed => fuzzRun(seed))); },
  },
  {
    name: 'the fuzz shooter reaches the card on 30 runs, every sheet, within 30 game minutes',
    heavy: true,
    timeoutMs: 600_000,
    fn() { fuzzTable(Array.from({ length: 30 }, (_, i) => fuzzRun(100 + i))); },
  },
  {
    name: 'a shooter who enters the mode in every standby and waits there is told "Out of it. Wait for the turn." once a string, the turn never comes on him, and the coach moves the line on (a \'slow\' fault a string) to the card',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private' }), s = g.state, base = pairsBot();
      // (the pairs bot, but in each standby: G, then the panel's Wait over and over)
      const bot = (state, me, mem) => {
        const P = pairsNow(state);
        if (P?.cmd === 'standby' && P.str && !P.str.turned && !P.str.done) {
          if (!state.stop) return { act: ['ready'] };
          if (state.stop.mode === 'stop' && state.stop.phase === 'choose') return { act: [stepAct('wait', 'normal', null)] };
          return {};
        }
        return base(state, me, mem);
      };
      let outs = 0, turns = 0;
      for (let n = 0; n < 20 * 60 * 30 && !pairsNow(s).end; n++) {
        g.step(1, bot);
        for (const [type, d] of g.bus.events) { if (type === 'say' && /Out of it\. Wait for the turn|Not in the mode/.test(d.text)) outs++; if (type === 'range' && d.phase === 'turn') turns++; }
        g.clearFacts();
      }
      const P = pairsNow(s), R = s.armoury.range;
      console.log(`      ${P.summary}; "Out of it" said ${outs} times, turns ${turns}, strings ${P.strs.map(x => x.done).join(' ')}; faults ${R.faults.map(f => f.rule).join(', ')}`);
      assert(P.end?.phase === 'clear' && outs === 5 && turns === 0 && P.strs.every(x => x.done === 'moved') && R.faults.filter(f => f.rule === 'slow').length >= 5, JSON.stringify({ end: P.end, outs, turns, strs: P.strs.map(x => x.done) }));
    },
  },
  {
    name: 'a shooter who never engages (out of the mode at the pause: X at once) sees each string end at its time (STRING_MAX_MS lived, a \'time\' fault, the coach\'s "Time.") and reaches the card',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 7, tier: 'raider' }), s = g.state, base = pairsBot();
      const bot = (state, me, mem) => {
        const P = pairsNow(state);
        if (P?.str?.turned && !P.str.done) return state.stop?.mode === 'stop' && state.stop.phase === 'choose' ? { act: [stepAct('leave', 'normal', null)] } : {};
        return base(state, me, mem);
      };
      for (let n = 0; n < 20 * 60 * 30 && !pairsNow(s).end; n++) g.step(1, bot);
      const P = pairsNow(s), R = s.armoury.range;
      console.log(`      ${P.summary}; strings ${P.strs.map(x => `${x.done} "${x.paper}"`).join(' · ')}; faults ${R.faults.map(f => f.rule).join(', ')}`);
      assert(P.end?.phase === 'clear' && P.strs.every(x => x.done === 'time') && R.faults.filter(f => f.rule === 'time').length === 5, JSON.stringify({ end: P.end, strs: P.strs.map(x => x.done), faults: R.faults }));
      console.log(`      each string's limit ${STRING_MAX_MS / 1000} s lived; the coach moves a command on after ${C.moveOnMs / 1000} s lived`);
    },
  },
  {
    name: 'the pairs bot as the boot recruit on seeds 1, 5 and 6 (the runtime review of v0.0.8: a fumble slung the rifle, a Top up dropped the magazine, an ND during the make-safe) puts each fumble right and reaches the card with every string fired; an ND into the berm is a fault, not the stop',
    fn() {
      const rows = [];
      for (const seed of [1, 5, 6]) {
        const g = createGame({ scenario: 'test-pairs', seed, tier: 'recruit' }), s = g.state, bot = pairsBot();
        let n = 0;
        for (; n < 20 * 60 * 30 && !pairsNow(s).end; n++) { g.step(1, bot); if (g.bus.events.length > 5000) g.clearFacts(); }
        const P = pairsNow(s), R = s.armoury.range, faults = R.faults.map(f => f.rule);
        rows.push(`recruit ${seed}: ${P.end?.phase ?? 'NO END'} at +${fmt((s.clock.ms - s.meta.createdMs) / 60000, 1)} min; strings ${P.strs.map(x => x.done).join(' ')}; faults ${faults.join(', ') || 'none'}; ${P.summary}`);
        assert(P.end?.phase === 'clear' && P.strs.length === 5 && P.strs.every(x => x.paper) && !faults.includes('walk'), JSON.stringify({ seed, end: P.end, strs: P.strs.map(x => x.done), faults }));
      }
      for (const l of rows) console.log(`      ${l}`);
    },
  },
  {
    name: 'a shooter the coach\'s move-on leaves on the 7 m point (he never walks back to the ten) is never stopped for standing on it: no turn comes while he is off the 10 m point, strings 2 to 4 go down as not fired, and the card is reached (the runtime and design reviews of v0.0.8)',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private' }), s = g.state, base = pairsBot();
      const bot = (state, me, mem) => { const o = base(state, me, mem); return o && (o.mx || o.mz) ? {} : o; };
      let turns = 0;
      for (let n = 0; n < 20 * 60 * 30 && !pairsNow(s).end; n++) {
        g.step(1, bot);
        for (const [type, d] of g.bus.events) if (type === 'range' && d.phase === 'turn') turns++;
        g.clearFacts();
      }
      const P = pairsNow(s), R = s.armoury.range, me = g.me();
      console.log(`      ${P.summary}; turns ${turns}; strings ${P.strs.map(x => x.done).join(' ')}; faults ${R.faults.map(f => f.rule).join(', ')}; he stands at x ${fmt(me.x, 2)} (the 7 m point ${R.lane ? '' : ''}1117.0)`);
      assert(P.end?.phase === 'clear' && turns === 2 && P.strs.slice(2).every(x => x.done === 'moved') && !R.faults.some(f => f.rule === 'walk'), JSON.stringify({ end: P.end, turns, strs: P.strs.map(x => x.done), faults: R.faults.map(f => f.rule) }));
    },
  },
];
