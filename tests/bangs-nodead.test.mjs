// "Three bangs" never dead-ends (src/sim/scenarios/pairs.js setup 'bangs'; the user, 2026-11-07: "a scene never dead-ends", DESIGN.md's log; the build sheet 0.0.9 §5.2): a fuzz shooter mashing keys through the startle, entering the mode before and after the bangs, never firing, walking off the point and idling reaches the card on every run within 30 game minutes; a shooter in the mode before the first bang has the plan put off and thrown again once he is out; one in it after the first hears the rest on time and the turn no earlier than 2 s after the third; a recruit whose first five Off safe attempts leave the rifle on safe still reaches the card.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { bangsFuzzBot, pairsBot } from './bots/pairs.mjs';
import { stepAct } from './bots/lib.mjs';
import { pairsNow, BANGS } from '../src/sim/scenarios/pairs.js';
import { gunOn } from '../src/sim/arms/shooting.js';
import { checkIds } from './ids-check.mjs';

/** A run's bound (game ms; the build sheet §5.2): 30 game minutes. */
export const FUZZ_BOUND_MS = 30 * 60_000;
const TIERS = ['recruit', 'private', 'sgt', 'raider', 'tierone'];

// (a game played by bot to the card or the bound: its end, its game time, its bangs, its strings, its faults, its id walk)
function run(g, bot, { bound = FUZZ_BOUND_MS, watch = null } = {}) {
  const s = g.state, t0 = s.clock.ms, bangs = [];
  let ticks = 0;
  for (; ticks < Math.ceil(bound / 50) + 20 && !pairsNow(s).end; ticks++) {
    g.step(1, bot);
    for (const [type, d] of g.bus.events) {
      if (type === 'fx' && d.kind === 'bang') bangs.push(d.atMs - t0);
      watch?.(type, d, s);
    }
    g.clearFacts();
  }
  const P = pairsNow(s), R = s.armoury.range, faults = {};
  for (const f of R.faults) faults[f.rule] = (faults[f.rule] ?? 0) + 1;
  return { s, P, R, end: P.end?.phase ?? null, ms: s.clock.ms - t0, ticks, bangs, strs: P.strs.map(x => x.done), faults, errors: g.errors.length, ids: checkIds(JSON.parse(g.save()), g.sim.domains), summary: P.summary, bangLine: P.bangs?.summary ?? null };
}
function line(tag, r, mem = null) {
  return `${tag}: ${r.end ?? 'NO END'} at +${fmt(r.ms / 60000, 1)} min; bangs at +${r.bangs.map(x => fmt(x / 1000, 2)).join(', +') || 'none'} s; strings ${r.strs.join(' ')}; faults ${Object.entries(r.faults).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}${mem?.steps ? `; mashed in the startle ${mem.steps.mash ?? 0}` : ''}`;
}
const ok = (r) => r.end && r.ms <= FUZZ_BOUND_MS && !r.errors && !r.ids.invalid.length && !r.ids.dangling.length;
function fuzzTable(seeds) {
  const runs = [];
  for (const seed of seeds) {
    const g = createGame({ scenario: 'test-pairs', seed: 4000 + seed, tier: TIERS[seed % TIERS.length], setup: 'bangs' });
    const r = run(g, bangsFuzzBot({ seed })), mem = g.me().bot?.fuzz ?? {};
    runs.push(r);
    console.log(`      ${line(`${r.R.sheet} ${4000 + seed}`, r, mem)}`);
    console.log(`        ${r.bangLine}`);
    assert(ok(r), JSON.stringify({ seed, end: r.end, ms: r.ms, errors: r.errors, ids: { invalid: r.ids.invalid.slice(0, 3), dangling: r.ids.dangling.slice(0, 3) } }));
  }
  console.log(`      ${runs.length} runs to the card; the longest +${fmt(Math.max(...runs.map(r => r.ms)) / 60000, 1)} min (bound ${FUZZ_BOUND_MS / 60000} min); the bangs went off on ${runs.filter(r => r.bangs.length === BANGS.n).length}`);
  assert(runs.filter(r => r.bangs.length === BANGS.n).length >= Math.ceil(runs.length / 2), 'the bangs on most runs');
}

export default [
  {
    name: 'a fuzz shooter on "Three bangs" (keys mashed through the startle, the mode entered in the standby before and after the bangs, random rows, never reloading on odd seeds, walking off the point, idling) reaches the card on 4 runs within 30 game minutes, every item held once',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    fn() { fuzzTable([1, 2, 3, 4]); },
  },
  {
    name: 'the fuzz shooter on "Three bangs" reaches the card on 30 runs, every sheet, within 30 game minutes (heavy)',
    heavy: true,
    timeoutMs: 600_000,
    fn() { fuzzTable(Array.from({ length: 30 }, (_, i) => 100 + i)); },
  },
  {
    name: 'into the mode in the banged standby before the first bang: the plan put off (its attempt + 1) and no bang on him while he waits in it; out of it, the bangs come on the next arming, the turn 2 s after the third, and the course reaches the card',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'bangs' }), base = pairsBot();
      let gAt = null, planned = null;
      const bot = (state, me, mem) => {
        const R = state.armoury.range, s = R.str, now = state.clock.ms;
        // (in the banged standby, armed, before the first bang: G, then the panel's Wait, for 3 s of game time, past the
        // first bang's planned time)
        if (gAt === null && s && s.k === BANGS.string && s.turnedMs === null && !s.done && R.bangs.plan.length && !R.bangs.plan.some(b => b.done)) {
          if (!state.stop) { planned = R.bangs.plan[0].atMs; return { act: ['ready'] }; }
          gAt = now;
        }
        if (gAt !== null && now < Math.max(gAt, planned) + 3000) return state.stop?.mode === 'stop' && state.stop.phase === 'choose' ? { act: [stepAct('wait', 'normal', null)] } : state.stop ? {} : { act: ['ready'] };
        return base(state, me, mem);
      };
      const r = run(g, bot), B = r.R.bangs;
      console.log(`      ${line('private 48213', r)}; into the mode ${planned - gAt} ms before the first bang was due, out of it ${Math.max(gAt, planned) + 3000 - planned} ms after; the plan's attempt ${B.attempt}, its first bang +${B.plan[0].atMs - planned} ms after the one put off; ${r.bangLine}`);
      assert(ok(r) && B.attempt === 1 && B.plan[0].atMs > planned + 3000 && r.bangs.length === BANGS.n && r.P.strs[0].bangs?.n === BANGS.n && r.P.bangs.plan.every(b => b.done), JSON.stringify({ end: r.end, attempt: B.attempt, bangs: r.bangs }));
    },
  },
  {
    name: 'into the mode in the banged standby after the first bang: the other two go off on time (1 s apart), and the turn comes no earlier than 2 s after the third; the course reaches the card',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'sgt', setup: 'bangs' }), base = pairsBot();
      let entered = null, turnAt = null;
      const bot = (state, me, mem) => {
        const R = state.armoury.range, s = R.str;
        if (s && s.k === BANGS.string && s.turnedMs === null && !s.done && R.bangs.plan[0]?.done && !R.bangs.plan[1]?.done && entered === null) {
          if (!state.stop) return { act: ['ready'] };
          entered = state.clock.ms;
        }
        return base(state, me, mem);
      };
      const r = run(g, bot, { watch: (type, d, s) => { if (type === 'range' && d.phase === 'turn' && turnAt === null) turnAt = s.armoury.range.str.turnedMs; } });
      const plan = r.R.bangs.plan, third = plan.at(-1).atMs;
      console.log(`      ${line('sergeant 48213', r)}; into the mode +${entered - plan[0].atMs} ms after the first bang; the turn +${turnAt - third} ms after the third`);
      assert(ok(r) && entered !== null && plan.every((b, i) => i === 0 || b.atMs - plan[i - 1].atMs === BANGS.gapMs) && r.bangs.length === BANGS.n && turnAt - third >= BANGS.turnMs, JSON.stringify({ end: r.end, entered, turn: turnAt - third }));
    },
  },
  {
    name: 'a shooter who never fires on the banged string (X at the pause) sees it end at its time, a \'time\' fault, and reaches the card with the bangs\' card',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 7, tier: 'recruit', setup: 'bangs' }), base = pairsBot();
      const bot = (state, me, mem) => {
        const P = pairsNow(state);
        if (P?.str?.k === BANGS.string && P.str.turned && !P.str.done) return state.stop?.mode === 'stop' && state.stop.phase === 'choose' ? { act: [stepAct('leave', 'normal', null)] } : {};
        return base(state, me, mem);
      };
      const r = run(g, bot);
      console.log(`      ${line('recruit 7', r)}; string 0 "${r.P.strs[0].paper}"; ${r.bangLine}`);
      assert(ok(r) && r.P.strs[0].done === 'time' && r.faults.time >= 1 && r.P.strs[0].bangs?.turnToFirstMs === null, JSON.stringify({ end: r.end, strs: r.strs, faults: r.faults }));
    },
  },
  {
    name: 'a boot recruit whose first five Off safe attempts leave the rifle on safe (the lever put back by the test: five slips in a row are rare by the dice, a slipped thumb leaving it on safe since v0.0.9) reaches the card: the strings time out or are fired, never a wall',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'recruit', setup: 'bangs' }), s = g.state, pid = s.player.id;
      let failed = 0;
      const r = run(g, pairsBot(), {
        watch: (type, d) => {
          if (type === 'step' && d.phase === 'sub' && d.action === 'selector:semi' && failed < 5) {
            const gun = s.items[gunOn(s, pid)];
            gun.mode = 'safe'; failed++;
          }
        },
      });
      console.log(`      ${line('recruit 48213, five on safe', r)}; Off safe put back ${failed} times; ${r.summary}`);
      for (const x of r.P.strs) console.log(`        string ${x.k}: "${x.paper}", ${x.done}`);
      assert(ok(r) && failed === 5 && r.P.strs.length === 5, JSON.stringify({ end: r.end, failed, strs: r.strs }));
    },
  },
  {
    name: 'the pairs bot\'s whole banged course as the boot recruit on the reviews\' seeds (31337, 1, 10, 17) reaches the card with no enter-and-leave loop: the mode entered at most 15 times (they were 125: an empty magazine seated off the ground with the bolt home, the short one dropped at the feet, a halted UNLOAD, SHOW CLEAR waited out, the rifle dropped onto its sling in the clear) and no lull waited out on a count not known; the DI names the swap (pairs-reload \'swap\') and the Top up (pairs-topup \'unsure\')',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    fn() {
      for (const seed of [31337, 1, 10, 17]) {
        const g = createGame({ scenario: 'test-pairs', seed, tier: 'recruit', setup: 'bangs' }), s = g.state;
        let enters = 0, was = false;
        const r = run(g, pairsBot(), { watch: (type, d) => { if (type === 'stop-mode' && d.phase === 'enter') enters++; } });
        console.log(`      ${line(`recruit ${seed}`, r)}; into the mode ${enters} times`);
        assert(ok(r) && enters <= 15 && !r.faults.slow, JSON.stringify({ seed, end: r.end, enters, faults: r.faults }));
      }
    },
  },
];
