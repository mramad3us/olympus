// The loop (src/core/loop.js): fixed 50 ms ticks from any frame rate, the 250 ms cap, the player's
// pause and an overlay's, the sim's holds (stop motion), the layers at their periods, and skip():
// time passing a minute at a time with interrupts, outcomes and its report (the 0.0.1 engine, kept
// for these tests as TECH §5.1 says). Then the four modes of TECH §3.6 with the sim's sliced skips
// (src/sim/game.js, src/sim/time/skip.js): ff at most 40 ticks and 8 ms a frame, outcome at most
// 4 ms, back to live with nothing owed; a skip saved after its third slice resuming to the same
// digest; a hold set by the rules layer; a live frame that stops when a tick begins a skip.
import { assert, near, fmt } from './helpers.mjs';
import { createLoop, NO_INPUT, FRAME_CAP_MS, FF_TICKS_FRAME, FF_FRAME_MS, SKIP_FRAME_MS } from '../src/core/loop.js';
import { recordingBus, createBus } from '../src/core/bus.js';
import { newState, toJSON, fromJSON } from '../src/core/state.js';
import { digest } from '../src/core/hash.js';
import { TICK_MS, MIN_MS, HOUR_MS, holdTime, releaseTime, isHeld } from '../src/core/clock.js';
import { createSim, newGame } from '../src/sim/game.js';
import { dummyWorld, scriptInput } from './game-dummy.mjs';

const busyFor = (ms) => { const t = performance.now(); while (performance.now() - t < ms) { /* (a dear tick, on purpose) */ } };
// (the median: the machine is shared, so one frame preempted is not the loop's fault; counts are held exactly)
const median = (a) => [...a].sort((x, y) => x - y)[a.length >> 1];

// (a game in a loop driven by frames, as the page drives it: poll gives each tick's input, keyed to
// clock.seq as a recording is, so a loaded game is fed what the game it came from would have been)
function framed({ seed = 1, domains = {}, inputs = null, hour = null } = {}) {
  const bus = recordingBus();
  const loop = createLoop({ bus, poll: () => (inputs ? inputs(loop.state?.clock.seq ?? 0) : { ...NO_INPUT, act: [] }), onError: (e, w) => { throw new Error(`${w}: ${e.message}`); } });
  const sim = createSim({ loop, bus, domains });
  loop.setState(newGame({ seed, hour, domains }));
  let t = 1000;
  loop.frame(t);
  return { loop, sim, bus, get state() { return loop.state; }, frame(dtMs = 17) { t += dtMs; loop.frame(t); return loop.stats; } };
}

// (a loop on a fresh state, driven by hand: frames at a given rate for a span of real time)
function rig({ startMs = 0, step = null, bus = createBus() } = {}) {
  const state = newState(1, { startMs });
  const loop = createLoop({ step, bus, onError: () => {} });
  loop.setState(state);
  let t = 1000;
  const run = (seconds, fps) => { const dt = 1000 / fps; const n = Math.round(seconds * fps); for (let i = 0; i < n; i++) { t += dt; loop.frame(t); } };
  loop.frame(t);
  return { state, loop, run, bus, frameAt: (ms) => { t += ms; loop.frame(t); } };
}

export default [
  {
    name: 'fixed steps: 20 ticks a game second from 30, 60 and 144 frames a second; alpha between them',
    fn() {
      const out = [];
      for (const fps of [30, 60, 144]) {
        const { state, loop, run } = rig();
        let alphaMin = 1, alphaMax = 0;
        const L = createLoop({ render: (a) => { alphaMin = Math.min(alphaMin, a); alphaMax = Math.max(alphaMax, a); } });
        L.setState(newState(1));
        let t = 0; L.frame(t);
        for (let i = 0; i < 10 * fps; i++) { t += 1000 / fps; L.frame(t); }
        run(10, fps);
        assert(Math.abs(state.clock.tick - 200) <= 1 && state.clock.ms === state.clock.tick * TICK_MS, `${fps} fps: ${state.clock.tick} ticks, ${state.clock.ms} ms`);
        assert(Math.abs(L.state.clock.tick - 200) <= 1, 'the rendering loop ticked differently');
        assert(alphaMin >= 0 && alphaMax < 1, `alpha ${alphaMin}…${alphaMax}`);
        out.push(`${fps} fps: ${state.clock.tick} ticks in 10 s (alpha ${fmt(alphaMin, 3)}…${fmt(alphaMax, 3)})`);
        assert(loop.stats.ticksLastFrame <= 1 || fps === 30, 'more than a tick a frame at 60 fps');
      }
      console.log(`      ${out.join('; ')}`);
    },
  },
  {
    name: 'the frame cap: a 2 s stall costs 5 ticks (250 ms), never a burst',
    fn() {
      const { state, loop, frameAt } = rig();
      frameAt(2000);
      assert(state.clock.tick === FRAME_CAP_MS / TICK_MS && loop.stats.ticksLastFrame === 5, `a 2 s frame ran ${state.clock.tick} ticks`);
      frameAt(16);
      assert(state.clock.tick === 5, 'the stall was carried over');
      console.log(`      a 2000 ms frame: ${state.clock.tick} ticks, ${state.clock.ms} ms of game time`);
    },
  },
  {
    name: 'pause: Space\'s reason and an overlay\'s each stop the ticks; time resumes only when both are gone',
    fn() {
      const { state, loop, run } = rig();
      run(1, 60);
      const t1 = state.clock.tick;
      loop.togglePause();                                          // (Space)
      run(2, 60);
      assert(state.clock.tick === t1 && loop.paused, 'ticks ran while paused');
      const closeMenu = loop.pauseFor('overlay:menu');
      loop.togglePause();                                          // (Space again: the menu still holds it)
      run(1, 60);
      assert(state.clock.tick === t1 && loop.pauseReasons.join() === 'overlay:menu', `reasons ${loop.pauseReasons}`);
      closeMenu();
      run(1, 60);
      assert(!loop.paused && Math.abs(state.clock.tick - t1 - 20) <= 1, `after both: ${state.clock.tick - t1} ticks in 1 s`);
      const n = loop.step(7);                                      // (the debug handle's step runs paused or not)
      loop.pause(true);
      assert(loop.step(3) === 3 && n === 7, 'step(n) refused while paused');
      console.log(`      1 s: ${t1} ticks; paused 3 s (Space, then the menu): +0; both gone, 1 s: +${state.clock.tick - t1 - 10}; step(n) ignores the pause`);
    },
  },
  {
    name: 'layers: slow each game minute, world each hour, slow before world on the hour, fast every tick in order',
    fn() {
      const calls = [];
      const { state, loop } = rig({ startMs: HOUR_MS - 3 * TICK_MS, step: () => calls.push('step') });
      loop.register('fast', () => calls.push('fast2'));
      loop.register('world', (s, b, ctx) => calls.push(`world@${ctx.atMs}`));
      loop.register('slow', (s, b, ctx) => calls.push(`slow@${ctx.atMs}`));
      loop.register('sol', (s, b, ctx) => calls.push('sol'), 88_775_244);
      loop.step(4);
      const want = ['step', 'fast2', 'step', 'fast2', 'step', 'fast2', `slow@${HOUR_MS}`, `world@${HOUR_MS}`, 'step', 'fast2'];
      assert(JSON.stringify(calls) === JSON.stringify(want), calls.join(' '));
      let slow = 0, world = 0;
      const L = createLoop(); L.setState(newState(1));
      L.register('slow', () => slow++); L.register('world', () => world++);
      L.step(20 * 3600 * 2);                                       // (two game hours of ticks)
      assert(slow === 120 && world === 2, `two hours: slow ${slow}, world ${world}`);
      assert(loop.layers.map(l => `${l.name}:${l.everyMs}`).join() === 'step:50,fast:50,slow:60000,world:3600000,sol:88775244', loop.layers.map(l => l.name).join());
      let threw = false; try { L.register('mystery', () => {}); } catch { threw = true; }
      assert(threw, 'a layer of no known name and no period was accepted');
      console.log(`      over the hour: ${calls.slice(4, 8).join(', ')}; two hours of ticks: slow ${slow}, world ${world}`);
    },
  },
  {
    name: 'holds (stop motion): the sim asks, ticks still reach it, the clock and the other layers wait; released, it moves at once',
    fn() {
      const bus = recordingBus();
      let choose = 0, other = 0, slow = 0;
      const step = (s, input, b, ctx) => {
        if (input.act.includes('ready')) holdTime(s, 'shoot');     // (G: weapon ready, stop motion)
        if (ctx.held) { choose++; if (input.act.includes('digit:1')) releaseTime(s, 'shoot'); }
      };
      const { state, loop } = rig({ step, bus });
      loop.register('fast', () => other++);
      loop.register('slow', () => slow++);
      loop.step(10);
      const ms0 = state.clock.ms;
      loop.step(1, { ...NO_INPUT, act: ['ready'] });
      assert(state.clock.ms === ms0 && loop.held, 'the clock moved in the tick the hold began');
      loop.step(2000);                                             // (100 s of ticks while the player thinks)
      assert(state.clock.ms === ms0 && slow === 0 && choose === 2000 && other === 10, `held: ms +${state.clock.ms - ms0}, choose ${choose}, other ${other}, slow ${slow}`);
      const r = loop.skip(10 * MIN_MS, { what: 'nap' });
      assert(r.elapsedMs === 0 && r.stopped === 'interrupt' && /shoot/.test(r.reason), `a skip while held: ${JSON.stringify(r)}`);
      loop.step(1, { ...NO_INPUT, act: ['digit:1'] });
      assert(state.clock.ms === ms0 + TICK_MS && !loop.held, 'released: the clock did not move in that tick');
      const holds = bus.events.filter(([t]) => t === 'hold').map(([, d]) => d.held);
      assert(JSON.stringify(holds) === '[true,false]', `hold events ${JSON.stringify(holds)}`);
      assert(state.clock.holds.length === 0, 'a hold left behind');
      console.log(`      2000 ticks held: clock +0 ms, the step heard ${choose} of them, others 0, slow 0; a skip asked while held passed ${r.elapsedMs} ms; events 'hold' ${holds.join(' then ')}`);
    },
  },
  {
    name: 'skip: a 15-minute shower steps the slow layer 15 times, then outcomes once, and reports',
    fn() {
      const bus = recordingBus();
      const { state, loop } = rig({ startMs: 8 * HOUR_MS, bus });
      const slowAt = [];
      loop.register('slow', (s, b, ctx) => slowAt.push(ctx.atMs));
      let worldN = 0; loop.register('world', () => worldN++);
      let got = null;
      const tick0 = state.clock.tick;
      const r = loop.skip(15 * MIN_MS, { what: 'shower', outcomes: (s, b, rep) => { got = rep; s.player.washedMs = rep.toMs; } });
      assert(r.minutes === 15 && slowAt.length === 15 && slowAt[0] === 8 * HOUR_MS + MIN_MS && slowAt[14] === 8 * HOUR_MS + 15 * MIN_MS, `slow at ${slowAt.length}: ${slowAt[0]}…${slowAt.at(-1)}`);
      assert(r.stopped === 'done' && r.reason === null && r.elapsedMs === 15 * MIN_MS && r.requestedMs === 15 * MIN_MS && state.clock.ms === 8 * HOUR_MS + 15 * MIN_MS, JSON.stringify(r));
      assert(got && got.elapsedMs === r.elapsedMs && state.player.washedMs === r.toMs, 'outcomes did not get the gap');
      assert(state.clock.tick === tick0 && worldN === 0, 'a skip moved the tick count or crossed an hour it did not');
      const types = bus.events.map(([t]) => t);
      assert(types[0] === 'skip-start' && types.at(-1) === 'skip' && bus.events.at(-1)[1].minutes === 15, types.join());
      console.log(`      ${JSON.stringify(r)}`);
    },
  },
  {
    name: 'skip: from mid-minute, a ragged length is whole ticks; minutes count the boundaries crossed',
    fn() {
      const { state, loop } = rig({ startMs: 8 * HOUR_MS + 12_350 });
      let slow = 0; loop.register('slow', () => slow++);
      let second = 0, secondN = 0; loop.register('second', (s, b, ctx) => { second++; secondN += ctx.n; }, 1000);
      const r = loop.skip(2 * MIN_MS + 1);                          // (1 ms over: rounded up to a whole tick)
      assert(r.requestedMs === 2 * MIN_MS + TICK_MS && r.elapsedMs === r.requestedMs, JSON.stringify(r));
      assert(state.clock.ms === 8 * HOUR_MS + 12_350 + 2 * MIN_MS + TICK_MS && state.clock.ms % TICK_MS === 0, `clock ${state.clock.ms}`);
      assert(r.minutes === 2 && slow === 2, `minutes ${r.minutes}, slow ${slow}`);
      assert(second === 3 && secondN === 120, `a 1 s layer in a skip: ${second} calls for ${secondN} seconds`);
      console.log(`      from 08:00:12.350, 2 min + 1 ms → ${r.requestedMs} ms, ${r.minutes} minutes stepped; a 1 s layer called ${second} times for ${secondN} s`);
    },
  },
  {
    name: 'skip: interrupted by the predicate, by a layer, and by a hold; outcomes get the time lived',
    fn() {
      // (sleep 8 h; the predicate is a need gone critical at 07:00 into it)
      const a = rig({ startMs: 22 * HOUR_MS });
      let lived = 0;
      const r1 = a.loop.skip(8 * HOUR_MS, { what: 'sleep', interrupt: (s, at) => (at.elapsedMs >= 7 * HOUR_MS ? 'bladder' : null), outcomes: (s, b, rep) => { lived = rep.elapsedMs; } });
      assert(r1.stopped === 'interrupt' && r1.reason === 'bladder' && r1.minutes === 420 && r1.elapsedMs === 7 * HOUR_MS && lived === 7 * HOUR_MS, JSON.stringify(r1));
      // (a layer interrupts: the alarm at 06:00 on the slow layer)
      const b = rig({ startMs: 0 });
      b.loop.register('slow', (s, bus, ctx) => { if (ctx.skipping && ctx.atMs === 6 * HOUR_MS) ctx.interrupt('reveille'); });
      const r2 = b.loop.skip(12 * HOUR_MS, { what: 'sleep' });
      assert(r2.reason === 'reveille' && r2.toMs === 6 * HOUR_MS && r2.minutes === 360, JSON.stringify(r2));
      // (the sim sets a hold from a layer: a summons wanting an answer)
      const c = rig({ startMs: 0 });
      c.loop.register('slow', (s, bus, ctx) => { if (ctx.atMs === 30 * MIN_MS) holdTime(s, 'talk'); });
      const r3 = c.loop.skip(HOUR_MS, { what: 'reading' });
      assert(r3.stopped === 'interrupt' && /talk/.test(r3.reason) && r3.minutes === 30, JSON.stringify(r3));
      // (an interrupt on the very last minute doesn't count: the skip is done)
      const d = rig();
      const r4 = d.loop.skip(5 * MIN_MS, { interrupt: (s, at) => (at.elapsedMs >= 5 * MIN_MS ? 'late' : null) });
      assert(r4.stopped === 'done', JSON.stringify(r4));
      // (the step calls skip from inside a tick; that tick then adds its own 50 ms)
      const e = rig({ step: (s, input, bus, ctx) => { if (input.act.includes('hand')) ctx.skip(20 * MIN_MS, { what: 'chow' }); } });
      e.loop.step(1, { ...NO_INPUT, act: ['hand'] });
      assert(e.state.clock.ms === 20 * MIN_MS + TICK_MS && e.state.clock.tick === 1, `skip from a tick: ${e.state.clock.ms}`);
      console.log(`      sleep 8 h: stopped by '${r1.reason}' after ${r1.minutes} min; by a layer: '${r2.reason}' at ${r2.toMs / HOUR_MS} h; by a hold: '${r3.reason}' after ${r3.minutes} min; from a tick: ${e.state.clock.ms} ms`);
    },
  },
  {
    name: 'skip: a week of minutes is quick, and the slow layer is stepped 10,080 times',
    heavy: false,
    fn() {
      const { state, loop } = rig();
      let n = 0; loop.register('slow', (s) => { n++; s.world.minutes = (s.world.minutes ?? 0) + 1; });
      let hours = 0; loop.register('world', () => hours++);
      const t0 = performance.now();
      const r = loop.skip(7 * 24 * HOUR_MS, { what: 'voyage' });
      const ms = performance.now() - t0;
      assert(r.minutes === 10080 && n === 10080 && hours === 168 && state.world.minutes === 10080, `${r.minutes} minutes, ${n} slow, ${hours} hours`);
      assert(ms < 500, `a week took ${ms} ms`);
      console.log(`      a week: ${r.minutes} minutes and ${hours} hours stepped in ${fmt(ms, 1)} ms (${fmt(ms * 1000 / r.minutes, 2)} µs a minute, layers trivial)`);
    },
  },
  {
    name: 'errors: a tick that throws is lost and told; the next runs; a skip whose layer throws stops with \'error\'',
    fn() {
      const told = [];
      const state = newState(1);
      let k = 0;
      const loop = createLoop({ step: () => { if (++k === 3) throw new Error('boom'); }, onError: (e, where) => told.push(`${where}: ${e.message}`) });
      loop.setState(state);
      loop.step(5);
      assert(state.clock.tick === 4 && loop.stats.lostTicks === 1 && told[0] === 'tick: boom', `${state.clock.tick} ticks, told ${told}`);
      loop.register('slow', (s, b, ctx) => { if (ctx.skipping && ctx.atMs >= 3 * MIN_MS) throw new Error('layer'); });
      let out = null;
      const r = loop.skip(10 * MIN_MS, { outcomes: (s, b, rep) => { out = rep; } });
      assert(r.stopped === 'error' && r.reason === 'layer' && out?.stopped === 'error' && r.elapsedMs < 4 * MIN_MS, JSON.stringify(r));
      const rendered = createLoop({ render: () => { throw new Error('paint'); }, onError: (e, where) => told.push(where) });
      rendered.frame(0); rendered.frame(16);
      assert(told.filter(w => w === 'render').length === 2, 'a throwing render stopped the frames');
      console.log(`      5 ticks with one throwing: ${state.clock.tick} moved, told '${told[0]}'; a skip's layer threw: stopped '${r.stopped}' after ${fmt(r.elapsedMs / 1000, 1)} s`);
    },
  },

  {
    name: 'modes: paused, live, ff and outcome, a pause winning; ff at most 40 ticks and 8 ms a frame, outcome at most 4 ms; back to live with nothing owed',
    fn() {
      let tickCostMs = 0, stepCostMs = 0;
      const dear = { ...dummyWorld, fast: { ...dummyWorld.fast, rules: () => busyFor(tickCostMs) },
        slow: [...dummyWorld.slow, { name: 'dear', step: () => busyFor(stepCostMs) }] };
      const g = framed({ domains: { world: dear } });
      for (let i = 0; i < 60; i++) g.frame();
      assert(g.loop.mode === 'live' && Math.abs(g.state.clock.tick - 20) <= 1, `live: ${g.loop.mode}, ${g.state.clock.tick} ticks`);
      g.loop.pause(true);
      const tPaused = g.state.clock.tick;
      for (let i = 0; i < 10; i++) g.frame();
      assert(g.loop.mode === 'paused' && g.state.clock.tick === tPaused, 'paused');
      // (a pause wins over a running skip too)
      g.sim.beginSkip(g.state, { activity: 'wait', planMs: 60_000 });
      g.frame();
      assert(g.loop.mode === 'paused' && g.state.skip.kind === 'ff', `a pause during a skip: ${g.loop.mode}`);
      g.loop.pause(false);
      // (ff: cheap ticks, then dear ones)
      const ffRun = (costMs) => {
        tickCostMs = costMs;
        const per = [], ms = [];
        while (g.state.skip && per.length < 10_000) { const st = g.frame(); if (st.mode !== 'ff') break; per.push(st.ffTicksLastFrame); ms.push(st.skipFrameMs); }
        tickCostMs = 0;
        return { per, ms };
      };
      const cheap = ffRun(0);
      assert(!g.state.skip && Math.max(...cheap.per) <= FF_TICKS_FRAME && cheap.per.reduce((a, b) => a + b, 0) === 60_000 / TICK_MS, `ff: ${cheap.per.join(',')}`);
      assert(g.loop.alpha === 0, `the frame that ended the ff left alpha ${g.loop.alpha}`);
      g.frame();
      assert(g.loop.mode === 'live', `after the ff: ${g.loop.mode}`);
      g.sim.beginSkip(g.state, { activity: 'wait', planMs: 20_000 });
      const dearFf = ffRun(0.6);
      assert(Math.max(...dearFf.per) <= Math.ceil(FF_FRAME_MS / 0.6) + 1 && median(dearFf.ms) <= FF_FRAME_MS + 1, `dear ff: ${dearFf.per.join(',')} ticks, median ${median(dearFf.ms)} ms`);
      // (outcome: dear steps, sliced at 4 ms)
      g.frame();
      stepCostMs = 0.35;
      g.sim.beginSkip(g.state, { activity: 'wait', planMs: 90 * MIN_MS });
      const steps = [], sms = [];
      while (g.state.skip && steps.length < 10_000) { const st = g.frame(); steps.push(st.skipStepsLastFrame); sms.push(st.skipFrameMs); }
      stepCostMs = 0;
      assert(g.loop.mode === 'outcome' && Math.max(...steps) <= Math.ceil(SKIP_FRAME_MS / 0.35) + 1 && median(sms) <= SKIP_FRAME_MS + 1, `outcome: ${steps.join(',')} steps, median ${median(sms)} ms`);
      assert(g.loop.alpha === 0 && g.loop.target === null, `the frame that ended the outcome skip left alpha ${g.loop.alpha}, target ${g.loop.target}`);
      g.frame();
      assert(g.loop.mode === 'live', `after the outcome: ${g.loop.mode}`);
      const mean = (a) => fmt(a.reduce((x, y) => x + y, 0) / a.length, 1);
      console.log(`      live 1 s: ${tPaused} ticks; paused 10 frames: +0 (a pause wins over a running skip)`);
      console.log(`      ff 60 s, cheap ticks: ${cheap.per.length} frames, ${Math.max(...cheap.per)} ticks a frame at most (mean ${mean(cheap.per)}); 0.6 ms ticks: ${Math.max(...dearFf.per)} at most (mean ${mean(dearFf.per)}), frames ${fmt(median(dearFf.ms), 1)} ms median, ${fmt(Math.max(...dearFf.ms), 1)} ms the longest`);
      console.log(`      outcome 90 min at 0.35 ms a step: ${steps.length} frames, ${Math.max(...steps)} steps a frame at most (mean ${mean(steps)}), frames ${fmt(median(sms), 1)} ms median, ${fmt(Math.max(...sms), 1)} ms the longest; then live, alpha 0`);
    },
  },
  {
    name: 'a skip saved after its third slice and loaded resumes to the same digest',
    fn() {
      const run = (saveAfter) => {
        let g = framed({ seed: 48213, domains: { world: dummyWorld }, inputs: (k) => scriptInput(k, { hands: false }) });
        for (let i = 0; i < 300; i++) g.frame();
        g.sim.beginSkip(g.state, { activity: 'sleep', planMs: 3 * HOUR_MS, kind: 'outcome' });
        const from = g.state.skip.fromMs;
        let slices = 0, json = null;
        while (g.state.skip) {
          g.loop.skipTarget(from + (slices + 1) * 7 * MIN_MS);
          g.frame();
          slices++;
          if (slices === saveAfter && g.state.skip) {
            json = toJSON(g.state);
            const atMs = g.state.skip.atMs;
            g = framed({ seed: 1, domains: { world: dummyWorld }, inputs: (k) => scriptInput(k, { hands: false }) });
            g.loop.setState(fromJSON(json));
            assert(g.state.skip && g.state.skip.atMs === atMs, 'the skip did not come back with the load');
          }
        }
        // (then live frames to the same tick: real time decides which frame a tick falls in, never what it does)
        const seqEnd = g.state.clock.seq + 120;
        while (g.state.clock.seq < seqEnd) g.frame();
        return { digest: digest(toJSON(g.state)), slices, saved: json ? json.length : 0 };
      };
      const plain = run(0), resumed = run(3);
      assert(plain.digest === resumed.digest && plain.slices === resumed.slices, JSON.stringify({ plain, resumed }));
      console.log(`      3 h in ${plain.slices} slices of 7 game minutes: ${plain.digest} plain, ${resumed.digest} saved after the third slice (${fmt(resumed.saved / 1024, 1)} KB) and loaded`);
    },
  },
  {
    name: 'a hold set by the rules layer skips paths and second, runs offers, keeps the clock; clock.seq counts the held ticks',
    fn() {
      const calls = { rules: 0, paths: 0, second: 0, offers: 0, input: 0 };
      const probe = { owner: 'TECH', keys: ['world'], init: (s) => { s.world ??= {}; },
        fast: {
          input: (s, input) => { calls.input++; if (input.act.includes('let-go')) releaseTime(s, 'probe'); },
          rules: (s) => { calls.rules++; if (s.world.holdNow) { s.world.holdNow = false; holdTime(s, 'probe'); } },
          paths: () => { calls.paths++; }, second: () => { calls.second++; }, offers: () => { calls.offers++; },
        } };
      const bus = recordingBus();
      const loop = createLoop({ bus });
      createSim({ loop, bus, domains: { world: probe } });
      loop.setState(newGame({ seed: 3, domains: { world: probe } }));
      const s = loop.state;
      loop.step(4);
      const before = { ...calls }, ms0 = s.clock.ms, seq0 = s.clock.seq;
      s.world.holdNow = true;
      loop.step(1);
      const d = (k) => calls[k] - before[k];
      assert(isHeld(s, 'probe') && s.clock.ms === ms0 && d('rules') === 1 && d('paths') === 0 && d('second') === 0 && d('offers') === 1 && d('input') === 1, `the tick that held: ${JSON.stringify(calls)}`);
      loop.step(10);
      assert(s.clock.ms === ms0 && d('rules') === 1 && d('offers') === 11 && d('input') === 11 && s.clock.seq === seq0 + 11 && s.clock.tick === 4, `held: ${JSON.stringify(calls)}, seq ${s.clock.seq}`);
      loop.step(1, { ...NO_INPUT, act: ['let-go'] });
      assert(!isHeld(s) && s.clock.ms === ms0 + TICK_MS && d('paths') === 1 && d('second') === 1 && s.clock.seq === seq0 + 12, `released: ${JSON.stringify(calls)}`);
      console.log(`      the tick that held: rules ${1}, paths 0, second 0, offers 1, clock +0; ten held ticks: input and offers only, clock.seq +${10}, clock.tick ${s.clock.tick - 1}; released by input: the rest of that tick ran, clock +${TICK_MS} ms`);
    },
  },
  {
    name: 'a live frame stops ticking when a tick begins a skip: the owed ticks dropped, the next frame in the skip\'s mode',
    fn() {
      const g = framed({ inputs: (k) => ({ ...NO_INPUT, act: k === 0 ? ['hand'] : [] }) });
      const tick0 = g.state.clock.tick;
      g.frame(FRAME_CAP_MS);                                       // (five ticks owed)
      assert(g.state.clock.tick === tick0 + 1 && g.state.skip?.kind === 'outcome' && g.loop.alpha === 0 && g.loop.stats.ticksLastFrame === 1, `ticks ${g.state.clock.tick - tick0}, skip ${g.state.skip?.kind}, alpha ${g.loop.alpha}`);
      g.frame();
      assert(g.loop.mode === 'outcome' && g.state.clock.tick === tick0 + 1, `next frame: ${g.loop.mode}`);
      let frames = 1;
      while (g.state.skip && frames < 1000) { g.frame(); frames++; }
      g.frame();
      assert(!g.state.skip && g.loop.mode === 'live' && g.bus.events.some(([t, d]) => t === 'skip-end' && d.minutes === 15), 'the wait did not end');
      console.log(`      a 250 ms frame owed 5 ticks: 1 ran (R began a 15-minute wait), 4 dropped; the wait in ${frames} outcome frames (no splash target: to its end at 4 ms a frame), then live`);
    },
  },
];
