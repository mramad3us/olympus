// OLYMPUS tests: the read scope (src/core/reads.js; the build sheet v0.0.21 §1 item 13, §6 stage 0; perf lens P1, P3).
//
// The scope shares one step panel per ms and one body per person and ms across the instinct's rules (state.$reads, opened by
// the instinct's two evaluations and by stepsOf when none is open), the run sheet is built on its first read only (houseNow's
// getters), and a whole second is due once at its ms (the held second). It must move no tick: (a) five lanes end on the same
// digest with the scope and with it forced off (state.$readsOff, the test switch); (b) the panel is built at most once a tick
// but where a row is chosen that tick (the choice's panel and the next one's), and the run sheet never before the lane's end
// but by a read of the view's sheet; (c) under READS_FREEZE (what the scope keeps frozen) a lane runs to its card without a
// throw, in a child process with READS_FREEZE=1; (d) a pause standing on a whole second runs no evaluation of the instinct over
// 40 held ticks (40 on v0.0.20's tree: one every held tick).
// v0.0.25 (its build sheet §1 E; the carried lens §3.3): (a)'s five lanes split, the case unchanged: the tier one by T and the private by
// the keys quick (the two lanes (c) also runs), the flash, the live sergeant and the fuzz recruit in a heavy "(a, more)"; the file was
// over its quick CPU line alone (4.8 s against 3.6 s × k), about 60% of it (a)'s.
import { execFileSync } from 'node:child_process';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { botOf } from './flawless.mjs';
import { runHouse } from './bots/house.mjs';
import { BUILT } from '../src/core/reads.js';
import { houseNow } from '../src/sim/scenarios/shoothouse.js';
import { isHeld } from '../src/core/clock.js';

// ((a)'s lanes, run with the scope and with it forced off, each to its end: one digest and one tick count both ways)
function scopeLanes(LANES) {
  const out = LANES.map(L => {
    const on = make(L), off = make(L);
    off.state.$readsOff = true;
    const r1 = runHouse(on, botOf(L.bot, { seed: L.seed })), r2 = runHouse(off, botOf(L.bot, { seed: L.seed }));
    return { L: `${L.bot} ${L.tier} ${L.seed}${L.setup ? ` ${L.setup}` : ''}${L.opfor ? ` ${L.opfor}` : ''}`, ticks: [r1.ticks, r2.ticks], on: on.digest(), off: off.digest() };
  });
  for (const o of out) console.log(`      ${o.L}: ${o.ticks[0]} ticks, digest ${o.on} with the scope, ${o.off} without (${o.ticks[1]} ticks)`);
  assert(out.every(o => o.on === o.off && o.ticks[0] === o.ticks[1]), JSON.stringify(out));
}
const make = (L) => createGame({ scenario: 'test-shoothouse', seed: L.seed, tier: L.tier, setup: L.setup ?? 'go', ...(L.loadout ? { loadout: L.loadout } : {}), ...(L.opfor ? { opfor: L.opfor } : {}) });

export default [
  {
    name: '(a) two lanes end on the same digest with the read scope and with it forced off (state.$readsOff): the scope moves no tick (the tier one by T and the private by the keys; the other three in "(a, more)")',
    timeoutMs: 120_000,
    fn() {
      scopeLanes([{ tier: 'tierone', seed: 48213, bot: 'honest' }, { tier: 'private', seed: 48213, bot: 'keys', setup: 'room:3' }]);
    },
  },
  {
    name: '(a, more) three lanes more end on the same digest with the read scope and with it forced off: the flash, the live sergeant and the fuzz recruit (heavy from v0.0.25: (a)\'s five lanes split, the case unchanged)',
    heavy: true,
    timeoutMs: 120_000,
    fn() {
      scopeLanes([{ tier: 'tierone', seed: 48213, bot: 'kit:flash', loadout: 'flash', setup: 'room:2' }, { tier: 'sgt', seed: 48213, bot: 'honest', opfor: 'live' }, { tier: 'recruit', seed: 48213, bot: 'fuzz', setup: 'hall' }]);
    },
  },
  {
    name: '(b) the tier one by T on 48213: the step panel built at most once a tick but where a row is chosen that tick (two to four on v0.0.20\'s tree), and the run sheet never before the lane\'s end but by a read of houseNow\'s sheet',
    timeoutMs: 60_000,
    fn() {
      const g = make({ tier: 'tierone', seed: 48213 }), bot = botOf('honest');
      let acts = 0, n = 0, extra = 0, sheetsLive = 0;
      const hist = {}, wrap = (s, me, mem) => { const r = bot(s, me, mem); acts = r?.act?.length ?? 0; return r; };
      while (!g.state.armoury.range.end && n++ < 20_000) {
        const b = BUILT.steps, sh = BUILT.sheet, live = !g.state.armoury.range.house?.end;
        g.step(1, wrap); g.clearFacts();
        const d = BUILT.steps - b;
        hist[d] = (hist[d] ?? 0) + 1;
        if (d > 1 + acts) extra++;
        if (live && !g.state.armoury.range.house?.end) sheetsLive += BUILT.sheet - sh;
      }
      const s0 = BUILT.sheet, N = houseNow(g.state), card = N.summary, s1 = BUILT.sheet; void N.sheet; void N.verdict;
      console.log(`      ${n} ticks: panel builds a tick ${JSON.stringify(hist)}; ticks over 1 + the rows chosen ${extra}; run sheets built while the lane ran ${sheetsLive}; a read of the view's summary, sheet and verdict built ${BUILT.sheet - s0} (the card ${card ? 'read' : 'none'}, ${s1 - s0} at its first read)`);
      assert(extra === 0 && sheetsLive === 0 && BUILT.sheet - s0 === 1, JSON.stringify({ hist, extra, sheetsLive, read: BUILT.sheet - s0 }));
    },
  },
  {
    name: '(c) under READS_FREEZE (the scope\'s panel and bodies frozen) the tier one\'s lane and the private\'s by the keys run to the card without a throw, in a child process with READS_FREEZE=1; a panel read inside a scope is frozen there',
    timeoutMs: 120_000,
    fn() {
      const code = `
        const { createGame } = await import(${JSON.stringify(`${root}/tests/game.mjs`)});
        const { botOf } = await import(${JSON.stringify(`${root}/tests/flawless.mjs`)});
        const { runHouse } = await import(${JSON.stringify(`${root}/tests/bots/house.mjs`)});
        const { READS_FREEZE } = await import(${JSON.stringify(`${root}/src/core/reads.js`)});
        const { stepsOf } = await import(${JSON.stringify(`${root}/src/sim/arms/shooting.js`)});
        const out = { freeze: READS_FREEZE, lanes: [], frozen: null };
        for (const [tier, b] of [['tierone', 'honest'], ['private', 'keys']]) {
          const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go' });
          let frozen = null;
          const r = runHouse(g, botOf(b, { seed: 48213 }), { each: (gg) => { const s = gg.state; if (frozen === null && s.stop?.mode === 'stop' && s.stop.phase === 'choose') { s.$reads = new Map(); try { const v = stepsOf(s); frozen = v.length > 0 && Object.isFrozen(v) && Object.isFrozen(v[0]); } finally { s.$reads = null; } } } });
          out.lanes.push({ tier, ticks: r.ticks, done: r.done, end: g.state.armoury.range.house.end?.why ?? null, errors: g.errors?.length ?? 0 });
          out.frozen ??= frozen;
        }
        console.log(JSON.stringify(out));`;
      let res;
      try {
        const txt = execFileSync(process.execPath, ['--input-type=module', '-e', code], { cwd: root, encoding: 'utf8', timeout: 110_000, env: { ...process.env, READS_FREEZE: '1' } });
        res = JSON.parse(txt.trim().split('\n').at(-1));
      } catch (e) { throw new Error(`the frozen lane threw: ${String(e?.stderr ?? e?.message ?? e).split('\n').slice(0, 6).join(' | ')}`); }
      console.log(`      READS_FREEZE ${res.freeze}: ${res.lanes.map(l => `${l.tier} ${l.ticks} ticks to ${l.end} (done ${l.done}, errors ${l.errors})`).join('; ')}; a scoped panel frozen ${res.frozen}`);
      assert(res.freeze === true && res.frozen === true && res.lanes.every(l => l.done && !l.errors), JSON.stringify(res));
    },
  },
  {
    name: '(d) the held second: a pause in stop motion standing on a whole second, stepped 40 ticks with no input, evaluates the instinct 0 times and builds no panel (40 on v0.0.20\'s tree, one every held tick)',
    timeoutMs: 60_000,
    fn() {
      const g = make({ tier: 'tierone', seed: 48213 }), bot = botOf('honest');
      let n = 0;
      while (!g.state.armoury.range.end && n++ < 20_000 && !(isHeld(g.state, 'stop') && g.state.clock.ms % 1000 === 0 && g.state.stop?.phase === 'choose')) { g.step(1, bot); g.clearFacts(); }
      const at = g.state.clock.ms;
      assert(isHeld(g.state, 'stop') && at % 1000 === 0, JSON.stringify({ n, ms: at }));
      let evals = 0, prev = g.state.$instinct;
      const b0 = BUILT.steps;
      for (let i = 0; i < 40; i++) { g.step(1, {}); g.clearFacts(); if (g.state.$instinct !== prev) evals++; prev = g.state.$instinct; }
      console.log(`      held at tick ${n} (ms ${at % 60_000} into its minute, still held ${isHeld(g.state)}, the clock ${g.state.clock.ms === at ? 'standing' : 'moved'}): 40 ticks, the instinct evaluated ${evals} times, the panel built ${BUILT.steps - b0} times`);
      assert(evals === 0 && BUILT.steps - b0 === 0 && g.state.clock.ms === at, JSON.stringify({ evals, builds: BUILT.steps - b0 }));
    },
  },
];
