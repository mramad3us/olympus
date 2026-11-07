// The chain (the build sheet 0.0.6 §2.1, §5.1, §8 items 10 to 14; TIME §8.1, §5.3): the user, 2026-11-06, "implement
// ways of combining actions ... long pressing R should open the menu with all the possible interractions as single
// actions, with the ability to select several actions". Several single actions at one fixture, in the order one
// does them in, behind one splash. Prints a chain of brush teeth, shave and wash face (its plan, each step's
// boundaries and line, the body before and after), the same chain lived, fast-forwarded and skipped side by side,
// Backspace at 1, 3, 6 and 6.5 minutes (where it ends, what is dropped), an interrupt in the shave, the night's
// dress then sleep to reveille, and a late chain fitted. Holds one skip and one skip-start, three activity ends in
// order, outcome.chain of three; the engines' bodies within time-parity's tolerances and the same boundaries to the
// millisecond; Backspace ends at the running step's end, never mid-step; an interrupt cuts the running step and
// drops the rest; a save made at every outcome step and every 20th fast-forward tick, reloaded, ends on the same digest.
import { assert, fmt } from './helpers.mjs';
import { createGame, stepBudget, NO_BUDGET } from './game.mjs';
import { planChain, chainNow } from '../src/sim/time/chain.js';
import { areaOf } from '../src/sim/places/model.js';
import { spotsOf } from '../src/sim/places/fixtures.js';
import { bodyOf, bodySync } from '../src/sim/body/body.js';
import { post, cancel } from '../src/core/queue.js';
import { NIGHT_SRC } from '../src/sim/time/pod.js';
import { riseActor, RISE_MS, outfitOf } from '../src/sim/people/place.js';
import { marsClock } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';
import { MIN_MS, TICK_MS } from '../src/core/clock.js';

const SEED = 48213, LON = SITES.melas.lonEDeg, AREA = 'melas.echo.1';
const SINK = 'f:e1:head-2a:sinks-1#1', FOOT = 'f:e1:bay-2-1:rack-n1#1';
const STEPS = Object.freeze([{ id: 'wash-face' }, { id: 'shave' }, { id: 'teeth' }]);             // (checked in any order: the chain runs in the menu's)
const ctxOf = (g) => ({ held: false, tickMs: TICK_MS, sim: g.sim });
const hm = (ms) => { const c = marsClock(ms, LON); return c.timeslip ? `24:00 +${Math.floor(c.slipMs / MIN_MS)}` : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}`; };
const rel = (ms, t0) => `+${fmt((ms - t0) / 1000, 1)} s`;
const spot = (id) => { const fx = areaOf(AREA).fixtures.find(f => id.startsWith(f.id + '#')); return spotsOf(fx).find(s => s.id === id); };
const putAt = (g, id) => { const sp = spot(id); Object.assign(g.me(), { x: sp.x, z: sp.z, face: sp.face ?? 'down', $px: sp.x, $pz: sp.z }); return sp; };
/** time-parity's tolerances (BODY §25), the engines' own after a sync. */
const TOL = Object.freeze({ energy: 5, water: 0.01, bladder: 5, bowel: 1, grime: 0.5, stubble: 0.001, hands: 0.5, pressure: 0.05 });
const ledgers = (b) => ({ energy: b.energy.gutKcal + b.energy.reserveKcal, water: b.water.balanceL + (b.water.gutL ?? 0), bladder: b.bladder.ml, bowel: b.bowel.g, grime: b.hygiene.grime, stubble: b.hygiene.stubbleH, hands: b.hands?.dirt ?? 0, pressure: b.sleep.pressureH });

// (barracks at 19:30 at Head A's first sink, the chain sent as the menu sends it)
function atSink() {
  const g = createGame({ scenario: 'barracks', seed: SEED, hour: 19.5 });
  putAt(g, SINK);
  const b = g.state.people[g.state.player.id].body;
  b.hygiene = { ...(b.hygiene ?? {}), stubbleH: 14 };
  return g;
}
const send = (g, more = {}) => g.step(1, { act: [{ act: 'chain', args: { spotId: SINK, steps: STEPS, ...more } }] });
// (to the end: the skip, or a lived chain's ticks)
const finish = (g) => { for (let n = 0; (g.state.skip || g.state.time.doing || g.state.time.chain) && n < 20 * 60 * 30; n++) g.step(1); };
const ends = (g) => g.facts('activity').filter(f => f.phase === 'end');

// (a chain run plain, saved at every outcome step or every nth fast-forward tick; each save loaded in a fresh game and run on: the same digest)
function savesCarryOn(engine, steps, every) {
  const plain = atSink();
  plain.sim.act(plain.state, { act: 'chain', args: { spotId: SINK, steps, force: engine } }, plain.bus, ctxOf(plain));
  const saves = [];
  if (engine === 'outcome') { while (plain.state.skip) { saves.push(plain.save()); plain.advance(Infinity, stepBudget(1)); } }
  else { for (let n = 0; plain.state.skip; n++) { if (n % every === 0) saves.push(plain.save()); plain.step(1); } }
  plain.step(200);
  const want = plain.digest();
  let same = 0;
  for (const json of saves) {
    const h = createGame({ scenario: 'barracks', seed: SEED, hour: 19.5 });
    h.load(json);
    if (engine === 'outcome') { while (h.state.skip) h.advance(Infinity, stepBudget(1)); } else finish(h);
    h.step(200);
    if (h.digest() === want) same++;
  }
  console.log(`      ${engine}: ${steps.map(x => x.id).join(', ')}; ${saves.length} saves mid-chain, ${same} ended on the plain run's digest ${want}`);
  assert(saves.length > 5 && same === saves.length, JSON.stringify({ saves: saves.length, same }));
}

export default [
  {
    name: 'brush teeth, shave and wash face chained at a sink: one plan of 7 min in the menu\'s order, one skip and one skip-start, three activity ends in order each with its line, outcome.chain of three, the stubble shaved',
    fn() {
      const g = atSink(), s = g.state, pid = s.player.id, t0 = s.clock.ms;
      const p = planChain(s, { spotId: SINK, steps: STEPS });
      const b0 = ledgers(bodyOf(s, pid));
      g.clearFacts();
      // (begun by the sim's action and advanced by hand a minute in, so the splash's view is read mid-chain; the harness's step would run it whole)
      g.sim.act(s, { act: 'chain', args: { spotId: SINK, steps: STEPS } }, g.bus, ctxOf(g));
      g.advance(t0 + MIN_MS, NO_BUDGET);
      const view = chainNow(s);
      g.advance(Infinity, NO_BUDGET);
      const b1 = ledgers(bodyOf(s, pid)), sk = g.facts('skip-start'), se = g.facts('skip-end'), e = ends(g), ch = g.facts('chain');
      console.log(`      the plan at ${hm(t0)}: "${p.label}" (${p.kind}, ${fmt(p.durMs / 1000, 1)} s), late ${p.late ? 'yes' : 'no'}`);
      for (const st of p.steps) console.log(`        ${st.id.padEnd(10)} ${rel(st.fromMs, t0).padStart(9)} → ${rel(st.toMs, t0).padStart(9)}  "${st.label}"`);
      console.log(`      the splash's view as it began: step ${view.i + 1} of ${view.n}, ${view.steps.map(x => x.label).join(' | ')}`);
      for (const f of e) console.log(`        end ${f.activity.padEnd(10)} ${rel(f.toMs, t0).padStart(9)} (${f.mode}, ${f.chain.i + 1}/${f.chain.n}) "${f.outcome.line}"`);
      console.log(`      facts: chain ${ch.map(c => `${c.phase}${c.phase === 'step' ? ` ${c.i}` : ''}`).join(', ')}; skip-start ${sk.length} (chain ${JSON.stringify(sk[0]?.chain)}), skip-end ${se.length}, its lines ${JSON.stringify(se[0]?.outcome.lines)}`);
      for (const k of Object.keys(b0)) console.log(`        ${k.padEnd(9)} ${fmt(b0[k], 3).padStart(10)} → ${fmt(b1[k], 3).padStart(10)}`);
      assert(p.ok && p.steps.map(x => x.id).join() === 'teeth,shave,wash-face' && p.kind === 'outcome' && Math.round(p.durMs / 1000) === 420 && /^brush teeth, shave, wash face · 7 min, done \d\d:\d\d$/.test(p.label), JSON.stringify(p));
      assert(p.steps.slice(0, -1).every(x => x.toMs % 1000 === 0) && p.steps.every((x, i) => i === 0 || x.fromMs === p.steps[i - 1].toMs), 'steps end to end, on whole seconds');
      assert(sk.length === 1 && se.length === 1 && sk[0].chain?.n === 3 && e.map(f => f.activity).join() === 'teeth,shave,wash-face' && e.every(f => f.fraction === 1 && f.outcome.line), JSON.stringify(e.map(f => [f.activity, f.fraction])));
      assert(se[0].outcome.chain?.length === 3 && se[0].outcome.chain.every(c => c.by === 'natural' && c.fraction === 1 && c.line) && se[0].toMs === p.endMs && !s.time.chain, JSON.stringify(se[0].outcome.chain));
      assert(e.map(f => f.toMs).join() === p.steps.map(x => x.toMs).join() && b1.stubble < 0.05 && ch.map(c => c.phase).join() === 'start,step,step,end', JSON.stringify({ toMs: e.map(f => f.toMs), stub: b1.stubble }));
    },
  },
  {
    name: 'the same chain lived, fast-forwarded and skipped from one state: the same boundaries to the millisecond, the bodies within time-parity\'s tolerances (BODY §25)',
    fn() {
      const run = (force) => {
        const g = atSink(), s = g.state, t0 = s.clock.ms;
        g.clearFacts();
        const c0 = performance.now();
        send(g, { force });
        finish(g);
        const ms = performance.now() - c0;
        bodySync(s, s.player.id, s.clock.ms);
        const bounds = g.facts('activity').map(f => `${f.phase}:${f.activity}@${f.phase === 'end' ? f.toMs - t0 : f.fromMs - t0}`);
        return { t0, bounds, body: ledgers(bodyOf(s, s.player.id)), skips: g.facts('skip-start').length, ms, clock: s.clock.ms - t0 };
      };
      const R = { live: run('live'), ff: run('ff'), outcome: run('outcome') };
      const bad = [];
      for (const k of Object.keys(TOL)) {
        const v = Object.values(R).map(r => r.body[k]), spread = Math.max(...v) - Math.min(...v);
        console.log(`        ${k.padEnd(9)} lived ${fmt(R.live.body[k], 4).padStart(10)}  ff ${fmt(R.ff.body[k], 4).padStart(10)}  outcome ${fmt(R.outcome.body[k], 4).padStart(10)}  spread ${fmt(spread, 5)} (±${TOL[k]})`);
        if (spread > TOL[k]) bad.push(`${k} ${spread}`);
      }
      for (const [k, r] of Object.entries(R)) console.log(`      ${k.padEnd(8)} ${r.skips} skip(s), ${fmt(r.ms, 0)} ms of compute, the clock +${fmt(r.clock / 1000, 2)} s: ${r.bounds.join(' ')}`);
      assert(R.live.bounds.join() === R.ff.bounds.join() && R.ff.bounds.join() === R.outcome.bounds.join(), 'the boundaries differ');
      assert(R.live.skips === 0 && R.ff.skips === 1 && R.outcome.skips === 1 && !bad.length, JSON.stringify({ bad, skips: [R.live.skips, R.ff.skips, R.outcome.skips] }));
    },
  },
  {
    name: 'Backspace in a chain stops after the running step, never mid-step, the rest dropped (at 1, 3, 6 and 6.5 minutes, skipped and fast-forwarded); an interrupt the step\'s mask lets through cuts it at its fraction and drops the rest',
    fn() {
      const rows = [];
      // (the harness finishes an outcome skip in the tick that began it, so the chain is begun by the sim's own action here and advanced by hand)
      const results = [];
      for (const [engine, atMin] of [['outcome', 1], ['outcome', 3], ['outcome', 6], ['outcome', 6.5], ['ff', 3]]) {
        const g = atSink(), s = g.state, t0 = s.clock.ms, p = planChain(s, { spotId: SINK, steps: STEPS });
        g.clearFacts();
        g.sim.act(s, { act: 'chain', args: { spotId: SINK, steps: STEPS, force: engine } }, g.bus, ctxOf(g));
        if (engine === 'outcome') {
          g.advance(t0 + atMin * MIN_MS, NO_BUDGET);
          g.advance(Infinity, NO_BUDGET, ['skip:stop']);
        } else {
          while (s.clock.ms < t0 + atMin * MIN_MS) g.step(1);
          g.sim.act(s, 'skip:stop', g.bus, ctxOf(g));
          finish(g);
        }
        const se = g.facts('skip-end').at(-1), stop = g.facts('chain').find(c => c.phase === 'stop'), running = p.steps.find(x => x.toMs > t0 + atMin * MIN_MS);
        results.push({ engine, atMin, se, stop, running, t0 });
        rows.push(`${engine.padEnd(8)} Backspace at ${String(atMin).padStart(3)} min (in ${running.id}): ended ${rel(se.toMs, t0)} (${running.id}'s end ${rel(running.toMs, t0)}), ${se.outcome.chain.map(c => `${c.id} ${c.by}`).join(', ')}`);
      }
      // (an interrupt: an A event (prio 1) at 3 min, in the shave)
      const g = atSink(), s = g.state, t0 = s.clock.ms;
      post(s, { atMs: t0 + 3 * MIN_MS, prio: 1, kind: 'test', src: 'test', line: 'A whistle in the hall.' });
      const whistle = s.events.find(e => e.src === 'test');
      g.clearFacts();
      send(g);
      const se = g.facts('skip-end').at(-1), endFact = g.facts('chain').at(-1);
      rows.push(`an A event at ${rel(whistle.atMs, t0)}: ended ${rel(se.toMs, t0)}, ${se.outcome.chain.map(c => `${c.id} ${c.by} ${fmt(c.fraction, 2)}`).join(', ')}; the chain's end by ${endFact.by}, dropped ${endFact.dropped.join(', ')}; lines ${JSON.stringify(se.outcome.lines)}`);
      for (const r of rows) console.log(`      ${r}`);
      for (const r of results) {
        assert(r.se.toMs === r.running.toMs && r.stop?.toMs === r.running.toMs, `${r.engine} at ${r.atMin}: ended ${r.se.toMs - r.t0}, the step's end ${r.running.toMs - r.t0}`);
        const after = r.se.outcome.chain.slice(r.se.outcome.chain.findIndex(c => c.id === r.running.id) + 1);
        assert(after.every(c => c.by === 'dropped') && r.se.outcome.chain.find(c => c.id === r.running.id).fraction === 1, JSON.stringify(r.se.outcome.chain));
      }
      const shave = se.outcome.chain.find(c => c.id === 'shave');
      assert(se.toMs === whistle.atMs && shave.fraction > 0 && shave.fraction < 1 && se.outcome.chain[2].by === 'dropped' && endFact.by === 'interrupt' && !s.time.chain, JSON.stringify(se.outcome.chain));
    },
  },
  {
    name: 'saves mid-chain carry on byte for byte: one made at every step of the skipped chain, loaded in a fresh game, ends on the same digest',
    fn() { savesCarryOn('outcome', STEPS, 1); },
  },
  {
    name: 'saves mid-chain carry on byte for byte, fast-forwarded: wash hands and wash face (90 s, a fast-forward), a save every 20th tick loaded in a fresh game ends on the same digest',
    heavy: true,
    timeoutMs: 300_000,
    fn() { savesCarryOn('ff', [{ id: 'wash-face' }, { id: 'wash-hands' }], 20); },
  },
  {
    name: 'the night\'s dress then sleep (the build sheet §8 item 6: "the menu chains dress then sleep"): one splash from 21:54 to reveille, the sleep begun in the berth behind it, PT kit on; and a chain late for the count, fitted to its leading whole steps',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 21.9 });
      const s = g.state;
      // (a quiet night: the career's first drill, drawn onto its first two nights, taken out of this one's queue, as instinct's morning does)
      cancel(s, NIGHT_SRC, ev => ev.kind === 'alert');
      putAt(g, FOOT);
      const steps = [{ id: 'sleep', args: { until: 'reveille' } }, { id: 'dress', args: { to: 'pt' } }];
      const p = planChain(s, { spotId: FOOT, steps });
      g.clearFacts();
      g.step(1, { act: [{ act: 'chain', args: { spotId: FOOT, steps } }] });
      const lying = (g.me().posture ?? 'stand') === 'lie', lead = !!s.time.lead;
      finish(g);
      const se = g.facts('skip-end'), e = ends(g);
      console.log(`      21:54 at the rack: "${p.label}" (${p.steps.map(x => x.id).join(', ')}); ${se.length} splash(es), ${hm(se[0].fromMs)} to ${hm(se[0].toMs)}${se[0].interrupted ? ` (landed by ${se[0].by})` : ''}; ${e.map(f => `${f.activity} ${hm(f.toMs)} ${fmt(f.fraction, 2)}`).join(', ')}; in ${outfitOf(g.me())}, lying after the skip began ${lying}, a lead ${lead}`);
      assert(p.ok && p.steps.map(x => x.id).join() === 'dress,sleep' && se.length === 1 && e.map(f => f.activity).join() === 'dress,sleep' && outfitOf(g.me()) === 'pt' && !lead, JSON.stringify({ p: p.steps.map(x => x.id), e: e.map(f => f.activity) }));
      assert(/05:30/.test(hm(se[0].toMs)) && se[0].outcome.chain.every(c => c.by !== 'dropped'), JSON.stringify(se[0].outcome.chain));
      // (late: at the klaxon, up, at a sink; wash hands, teeth and wash face would miss the count; fitted, the leading whole steps that end in time)
      const n = createGame({ scenario: 'test-night', seed: SEED }), ns = n.state;
      n.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] });
      riseActor(ns, n.me(), ns.clock.ms); n.step(Math.ceil(RISE_MS / TICK_MS) + 2);
      putAt(n, SINK);
      const late = [{ id: 'wash-hands' }, { id: 'teeth' }, { id: 'wash-face' }];
      const lp = planChain(ns, { spotId: SINK, steps: late });
      n.clearFacts();
      n.step(1, { act: [{ act: 'chain', args: { spotId: SINK, steps: late } }] });
      const refused = !ns.skip && !ns.time.doing;
      n.step(1, { act: [{ act: 'chain', args: { spotId: SINK, steps: late, late: 'fit' } }] });
      finish(n);
      const ne = n.facts('skip-end').at(-1), nd = ends(n);
      console.log(`      ${hm(lp.steps[0].fromMs)} at a sink in the drill: "${lp.label}", late: ${lp.late?.label}, fit ${fmt((lp.late?.fitMs ?? 0) / 1000, 0)} s; sent as is: ${refused ? 'refused (the late card first)' : 'BEGAN'}; fitted: ${nd.map(f => `${f.activity} ${rel(f.toMs, lp.steps[0].fromMs)}`).join(', ')}${ne ? `, ${ne.outcome.chain?.length ?? 1} step(s)` : ''}`);
      assert(lp.late && refused && nd.length >= 1 && nd.length < 3 && nd.every(f => f.toMs - lp.steps[0].fromMs <= lp.late.fitMs + 1000), JSON.stringify({ late: lp.late, nd: nd.map(f => f.activity) }));
    },
  },
  {
    name: 'a chain judges each step by what the steps before leave (the fixer\'s, 0.0.6): at a toilet stall with 300 mL in the bladder, the stall then the head is refused "nothing to give", as the head alone would be after the stall; the head alone is offered',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 14 }), s = g.state;
      const STALL = 'f:e1:head-2a:stall-1#1';
      putAt(g, STALL);
      const b = s.people[s.player.id].body;
      b.bladder.ml = 300;
      const both = planChain(s, { spotId: STALL, steps: [{ id: 'bowel' }, { id: 'urinate' }] });
      const alone = planChain(s, { spotId: STALL, steps: [{ id: 'urinate' }] });
      g.clearFacts();
      g.step(1, { act: [{ act: 'chain', args: { spotId: STALL, steps: [{ id: 'bowel' }, { id: 'urinate' }] } }] });
      const began = !!(s.skip || s.time.doing || s.time.chain);
      console.log(`      the stall and the head: ${both.ok ? `planned "${both.label}"` : `refused, "${both.why}"`} (steps ${both.steps.map(x => `${x.id}${x.off ? ` struck ${x.off}` : ''}`).join(', ')}); sent: ${began ? 'BEGAN' : 'nothing began'}; the head alone: ${alone.ok ? `"${alone.label}"` : alone.why}`);
      assert(!both.ok && both.why === 'nothing to give' && both.steps[1].off === 'nothing to give' && !both.steps[0].off && !began && alone.ok, JSON.stringify({ both, alone: alone.ok, began }));
    },
  },
];
