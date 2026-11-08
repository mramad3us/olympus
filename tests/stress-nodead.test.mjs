// test-stress, "Bang", never dead-ends (src/sim/scenarios/stress.js; the user, 2026-11-07: "a scene never dead-ends", DESIGN.md's log; the build sheet 0.0.10 §5.2): a fuzz shooter mashing keys through every startle, Breathe spammed and never, the mode entered before and after the noise, and the wrong ways scripted (never firing, never reloading on string 5 with the short magazine ignored, idling), and a boot recruit whose RELOAD fails five times: every run reaches the card within 30 game minutes.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stressBot, stressFuzzBot } from './bots/stress.mjs';
import { pairsNow } from '../src/sim/scenarios/pairs.js';
import { stressNow, recOf, RELOAD_STRING } from '../src/sim/scenarios/stress.js';
import { addSupp, feltOf } from '../src/sim/combat/supp.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { stepAct } from './bots/lib.mjs';

const RELOAD_PARTS = new Set(['reach', 'seat', 'release', 'charge', 'magOut:drop', 'magOut:pouch']);
import { checkIds } from './ids-check.mjs';

/** A run's bound (game ms; the build sheet §5.2): 30 game minutes. */
export const FUZZ_BOUND_MS = 30 * 60_000;
const TIERS = ['recruit', 'private', 'sgt', 'raider', 'tierone'];

// (a game played by bot to the card or the bound: its end, its game time, its strings, its faults, its id walk)
function run(g, bot, { bound = FUZZ_BOUND_MS } = {}) {
  const s = g.state, t0 = s.clock.ms;
  let ticks = 0, noise = 0;
  for (; ticks < Math.ceil(bound / 50) + 20 && !pairsNow(s).end; ticks++) {
    g.step(1, bot);
    for (const [type, d] of g.bus.events) if (type === 'fx' && (d.kind === 'blank' || d.kind === 'bang')) noise++;
    g.clearFacts();
  }
  const P = pairsNow(s), Z = stressNow(s), R = s.armoury.range, faults = {};
  for (const f of R.faults) faults[f.rule] = (faults[f.rule] ?? 0) + 1;
  return { s, P, Z, R, end: P.end?.phase ?? null, why: P.end?.why ?? null, ms: s.clock.ms - t0, ticks, noise, strs: P.strs.map(x => x.done), faults, errors: g.errors.length, ids: checkIds(JSON.parse(g.save()), g.sim.domains) };
}
const line = (tag, r) => `${tag}: ${r.end ?? 'NO END'}${r.why ? ` (${r.why})` : ''} at +${fmt(r.ms / 60000, 1)} min; ${r.noise} blanks and bangs; strings ${r.strs.join(' ')}; faults ${Object.entries(r.faults).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}`;
const ok = (r) => r.end && r.ms <= FUZZ_BOUND_MS && !r.errors && !r.ids.invalid.length && !r.ids.dangling.length;
const okOf = (r) => JSON.stringify({ end: r.end, ms: r.ms, errors: r.errors, ids: { invalid: r.ids.invalid.slice(0, 3), dangling: r.ids.dangling.slice(0, 3) } });

function fuzzTable(seeds) {
  const runs = [];
  for (const seed of seeds) {
    const g = createGame({ scenario: 'test-stress', seed: 5000 + seed, tier: TIERS[seed % TIERS.length] });
    const r = run(g, stressFuzzBot({ seed })), mem = g.me().bot ?? {};
    runs.push(r);
    console.log(`      ${line(`${r.R.sheet} ${5000 + seed}`, r)}; mashed in a startle ${mem.fuzz?.steps?.mash ?? 0}, Breathe spammed ${mem.spam ?? 0}, G in a standby ${mem.g ?? 0}`);
    assert(ok(r), okOf(r));
  }
  console.log(`      ${runs.length} runs to the card; the longest +${fmt(Math.max(...runs.map(r => r.ms)) / 60000, 1)} min (bound ${FUZZ_BOUND_MS / 60000} min); the dead ends hunted: none`);
}

export default [
  {
    name: 'a fuzz shooter on test-stress (keys mashed through every startle, Breathe spammed on even seeds, the mode entered in the standby before and after the noise, random rows, never reloading on odd seeds, walking off the point, idling) reaches the card on 4 runs within 30 game minutes, every item held once',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    timeoutMs: 600_000,
    fn() { fuzzTable([1, 2, 3, 4]); },
  },
  {
    name: 'the fuzz shooter on test-stress reaches the card on 30 runs, every sheet, within 30 game minutes (heavy)',
    heavy: true,
    timeoutMs: 1_800_000,
    fn() { fuzzTable(Array.from({ length: 30 }, (_, i) => 100 + i)); },
  },
  {
    name: 'the wrong ways reach the card: never firing (every string ends at its time), never reloading on string 5 with the coach\'s one-round magazine ignored, never Breathing, idling out of the mode in a standby',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    timeoutMs: 600_000,
    fn() {
      const cases = [
        ['never firing, recruit 48213', { seed: 48213, tier: 'recruit' }, stressBot({ noFire: true }), (r) => r.strs.every(x => x === 'time' || x === 'moved')],
        ['no reload on string 5, recruit 7', { seed: 7, tier: 'recruit' }, stressBot({ noReload: true }), (r) => r.R.strs.some(x => x.k === RELOAD_STRING) && !r.Z.strings.find(x => x.k === RELOAD_STRING)?.reload?.ms],
        ['the coach\'s one-round magazine ignored, private 7', { seed: 7, tier: 'private' }, stressBot({ ignoreShort: true }), (r) => r.R.strs.some(x => x.k === RELOAD_STRING)],
        ['never Breathing, recruit 99', { seed: 99, tier: 'recruit' }, stressBot({ breathe: false }), (r) => r.Z.strings.every(x => x.breathe.n === 0)],
      ];
      for (const [tag, opts, bot, extra] of cases) {
        const r = run(createGame({ scenario: 'test-stress', ...opts }), bot);
        console.log(`      ${line(tag, r)}`);
        for (const x of r.P.strs) console.log(`        string ${x.k + 1}: "${x.paper}", ${x.done}`);
        assert(ok(r) && extra(r), okOf(r));
      }
      // (idling: X out of the mode at every standby for 20 s before anything else, the turn armed and taken in turn)
      const base = stressBot(), idle = (state, me, mem) => {
        const s = state.armoury?.range?.str;
        if (s && !s.done && s.turnedMs === null && s.turnAtMs !== null && !state.stop) { mem.idleFrom ??= {}; mem.idleFrom[s.k] ??= state.clock.ms; if (state.clock.ms - mem.idleFrom[s.k] < 20_000) return {}; }
        return base(state, me, mem);
      };
      const r = run(createGame({ scenario: 'test-stress', seed: 3, tier: 'sgt' }), idle);
      console.log(`      ${line('idling 20 s in each armed standby, sergeant 3', r)}`);
      assert(ok(r), okOf(r));
    },
  },
  {
    name: 'a boot recruit whose RELOAD on string 5 fumbles five times or more reaches the card: the second turner turns, the string ends by the threats, its time or the rounds, never a wall (the dice alone fail four of its parts at worst in 60 seeds (the heavy search prints them), so the test holds his felt at 90 or more with the pool\'s own input, a round past his head, from the RELOAD\'s start until five parts have failed, and lets the magazine go again if the bolt comes home before)',
    timeoutMs: 600_000,
    fn() {
      const g = createGame({ scenario: 'test-stress', seed: 48213, tier: 'recruit' }), s = g.state, pid = s.player.id, base = stressBot({ breathe: false });
      let inputs = 0, fails = 0, parts = 0;
      // (the reload's parts rolled from string 5's RELOAD on, through the string and after it (the lull's), counted from the facts)
      g.bus.on('step', (d) => { if (d.phase === 'sub' && RELOAD_PARTS.has(d.action) && recOf(s.armoury.range, RELOAD_STRING)?.reload) { parts++; if (d.ok === false) fails++; } });
      let drops = 0;
      const bot = (state, me, mem) => {
        const R = state.armoury?.range, L = recOf(R, RELOAD_STRING)?.reload;
        if (L && fails < 5 && feltOf(state, pid) < 90 && !state.skip) addSupp(state, null, pid, { id: `test:${inputs++}`, kind: 'crack', pts: 8, atMs: state.clock.ms });
        // (the RELOAD home with fewer than five failed: the magazine let go again, as a shaking hand might, so he reloads again)
        if (L && L.endMs !== null && fails < 5 && R.str?.k === RELOAD_STRING && !R.str.done && state.stop?.mode === 'stop' && state.stop.phase === 'choose' && stepsOf(state).some(x => x.id === 'magOut:drop' && !x.off)) { drops++; return { act: [stepAct('magOut:drop', 'normal', null)] }; }
        return base(state, me, mem);
      };
      const r = run(g, bot), s5 = r.Z.strings.find(x => x.k === RELOAD_STRING), L = s5?.reload;
      console.log(`      ${line('recruit 48213, held pinned from the RELOAD on', r)}; ${inputs} rounds past his head, the magazine let go ${drops} times after the bolt came home; reload parts from string 5's RELOAD on: ${fails} of ${parts} failed (on the string: ${L?.partFails} of ${L?.parts}, ${L?.ms === null ? 'never home' : `home after ${fmt(L.ms / 1000, 2)} s`}); the second turner ${s5?.second ? `taken in in ${fmt(s5.second.takeInMs / 1000, 2)} s` : 'turned, never taken in'}`);
      console.log(`        paper: ${s5?.paper}`);
      assert(ok(r) && fails >= 5 && r.R.strs.some(x => x.k === RELOAD_STRING), okOf(r));
    },
  },
  {
    name: 'the boot recruit\'s RELOAD on string 5 by the dice alone, 60 seeds searched (heavy): every run to the card, the failed parts of each RELOAD printed, the worst seed named',
    heavy: true,
    timeoutMs: 1_800_000,
    fn() {
      const tried = [];
      for (let seed = 1; seed <= 60; seed++) {
        const r = run(createGame({ scenario: 'test-stress', seed: 7000 + seed, tier: 'recruit' }), stressBot({ breathe: false }));
        const L = r.Z.strings.find(x => x.k === RELOAD_STRING)?.reload;
        tried.push({ seed: 7000 + seed, fails: L?.partFails ?? null, parts: L?.parts ?? null });
        assert(ok(r), okOf(r));
      }
      const worst = tried.reduce((a, b) => ((b.fails ?? -1) > (a.fails ?? -1) ? b : a));
      console.log(`      searched (seed, the RELOAD's failed parts of its parts): ${tried.map(t => `${t.seed} ${t.fails ?? '-'}/${t.parts ?? '-'}`).join(', ')}`);
      console.log(`      the worst: seed ${worst.seed}, ${worst.fails} failed parts; every run to the card`);
    },
  },
];
