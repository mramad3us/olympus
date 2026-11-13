// OLYMPUS tests: the stepper, v0.0.5's step machinery out of shooting.js with channels added (src/sim/combat/stepper.js; COMBAT §25.7.1; the build sheet 0.0.12 §2.2, §5.2).
//
// The built macros run through the new engine exactly as before (scene-handling's and scene-pairs' records are their own
// suites, held byte for byte; here each step lives ceil(Σ ms / TICK_MS) ticks: LOAD, MAKE READY, a RELOAD and a Pair at
// Weapon handling 10 and 42); a bundle's beats run one at a time to rung 2 and overlap by the flow from rung 3 (hands and
// voice with the feet) and 4 (the eyes too); a contact cuts a move mid-path where it stands and the rest is the "Carry on";
// Backspace stops a bundle after its beat and starts nothing new; a save made in a bundle loads and carries on byte for byte.
import { assert, fmt } from './helpers.mjs';
import { drillWorld, DRILL_WEAPONS } from './drill-world.mjs';
import { createGame } from './game.mjs';
import { pairsWorld } from './specials-world.mjs';
import { stepsOf, chooseStep } from '../src/sim/arms/shooting.js';
import { flowOf, profileOf, profileAt } from '../src/sim/combat/stepper.js';
import { planBundle } from '../src/sim/combat/bundle.js';
import { TICK_MS } from '../src/core/clock.js';

const pick = (g, id) => g.step(1, { act: [{ act: 'stop', args: { step: id } }] });
const settle = (g, s, max = 3000) => { let n = 0; while (n++ < max && !(s.stop?.mode === 'stop' && s.stop.phase === 'choose')) g.step(1); return n; };
// (the running beats' channels at each tick of a bundle: which ran together)
function overlaps(d) {
  const ran = d.beats.filter(b => b.fromMs !== null && b.untilMs !== null && b.untilMs > b.fromMs);
  const pairs = new Set();
  for (const a of ran) for (const b of ran) if (a !== b && a.fromMs < b.untilMs && b.fromMs < a.untilMs) pairs.add([a.ch, b.ch].sort().join('+'));
  return [...pairs].sort();
}

export default [
  {
    name: 'the built steps through the new engine: each lives ceil(its formula time / a tick) ticks, sub-step by sub-step (LOAD, MAKE READY, a RELOAD and a Pair at Weapon handling 10 and 42; scene-handling and scene-pairs pin the records byte for byte)',
    fn() {
      for (const tier of ['private', 'tierone']) {
        const rows = [];
        for (const id of ['shot:pair', 'macro:unload', 'macro:load', 'macro:ready']) {
          // (the Pair at a turner's pause, taken in first; the commands on a quiet bay, one world each)
          const w = id === 'shot:pair' ? pairsWorld({ tier, turned: [3], aimAt: 3 }) : pairsWorld({ tier }), { g, s } = w;
          if (id === 'shot:pair') { let n = 0; while (n++ < 200 && !(s.stop?.via === 'contact' && s.stop.phase === 'choose' && !s.mind.contact?.pending)) g.step(1); }
          if (id === 'macro:load' || id === 'macro:ready') { pick(g, 'macro:unload'); settle(g, s); }
          if (id === 'macro:ready') { pick(g, 'macro:load'); settle(g, s); }
          const st = stepsOf(s).find(r => r.id === id && !r.off);
          if (!st) { rows.push(`${id} not offered`); continue; }
          const t0 = s.clock.ms;
          pick(g, id);
          const d = s.stop.doing;
          settle(g, s);
          // (the rolled sub-steps' time (a fumble ×1.6 in it), its boundaries each on the first tick at or after it)
          const rolled = d.subs.reduce((a, x) => a + (x.ms ?? 0), 0), lived = s.clock.ms - t0, want = Math.ceil(rolled / TICK_MS) * TICK_MS;
          rows.push(`${st.label} ${st.ms} ms planned, ${rolled} rolled (${d.subs.length} subs), ${lived} lived`);
          assert(lived >= want && lived <= want + TICK_MS, `${tier} ${id}: ${lived} against ${want}`);
        }
        console.log(`      ${tier} (WH ${tier === 'private' ? 10 : 42}): ${rows.join(' · ')}`);
      }
    },
  },
  {
    name: 'a bundle\'s channels by rung: one beat at a time to rung 2 (the time the sum), the hands and the voice with the feet from rung 3, the eyes too at rung 4 (COMBAT §25.3.1\'s flow)',
    fn() {
      const out = [];
      for (const rung of [0, 1, 2, 3, 4]) {
        const F = [...flowOf(rung)].join('+') || 'none';
        const w = drillWorld({ tier: 'sgt' }), { s, pid } = w;
        const p = planBundle(s, pid, 'room:clear', { door: 'o:w4:r1', rung });
        const sum = p.beats.reduce((a, b) => a + b.ms, 0);
        out.push({ rung, F, ms: p.ms, sum, n: p.beats.length });
      }
      for (const r of out) console.log(`      rung ${r.rung}: flow ${r.F.padEnd(16)} Clear the room planned ${fmt(r.ms / 1000, 2)} s against its beats' sum ${fmt(r.sum / 1000, 2)} s (${r.n} beats)`);
      assert(out[0].ms === out[0].sum && out[1].ms === out[1].sum && out[2].ms === out[2].sum, 'to rung 2 the time is the sum');
      assert(out[3].ms < out[3].sum && out[4].ms < out[3].ms, 'from rung 3 the flow shortens it, more at 4');
    },
  },
  {
    name: 'lived by rung in room 1: the beats that ran together, by channel (none to rung 2; hands and voice with the feet at 3, and the door\'s read; the eyes too at 4)',
    fn() {
      for (const [tier, bundle] of [['cpl', 'stack:point'], ['sgt', 'room:clear'], ['tierone', 'room:clear']]) {
        const w = drillWorld({ tier }), { g, s } = w;
        const row = stepsOf(s).find(r => r.id.startsWith(`drill:${bundle}>`));
        pick(g, row.id);
        const d = s.stop.doing;
        settle(g, s);
        const ov = overlaps(d);
        console.log(`      ${tier.padEnd(8)} ${bundle.padEnd(16)} ran together: ${ov.join(', ') || 'nothing'}`);
        if (tier === 'cpl') assert(!ov.length, ov.join());
        // (at rung 3 the eyes wait for the feet but for the door's read, which rides the approach from rung 3 (flowFrom, the rework's R4))
        const eyesWithFeet = d.beats.filter(b => b.ch === 'eyes' && b.fromMs !== null && d.beats.some(f => f.ch === 'feet' && f.fromMs !== null && f.fromMs < b.untilMs && b.fromMs < f.untilMs)).map(b => b.key);
        if (tier === 'sgt') assert(ov.every(x => /feet/.test(x)) && eyesWithFeet.every(k => k === 'read'), JSON.stringify({ ov, eyesWithFeet }));
        if (tier === 'tierone') assert(ov.some(x => x === 'eyes+feet'), ov.join());
      }
    },
  },
  {
    name: 'from rung 2 a contact suspends a move mid-path, never cuts it: the bundle kept whole on the stop, its entry still running at its speed, "Carry on" taking it up; Hold him halts it where it stands, the rest the panel\'s "Carry on" from there; Backspace stops a bundle after its beat and starts nothing new (the rework, COMBAT §25.19.3.1: v0.0.12 cut the feet in the doorway)',
    fn() {
      const w = drillWorld({ tier: 'tierone' }), { g, s } = w, t0 = s.clock.ms;
      s.mind.clearing = { room: 'w4.r1', fromMs: t0 }; w.T('1a').turnAtMs = t0 - 2000;
      pick(g, stepsOf(s).find(r => r.id.startsWith('drill:room:clear>')).id);
      const d = s.stop.doing;
      settle(g, s);
      const F = s.stop.flow, run = F?.beats?.find(b => b.st === 'run' && b.k === 'move'), me = w.me();
      console.log(`      the pause at ${fmt((s.clock.ms - t0) / 1000, 2)} s: the flow ${F === d ? 'kept' : 'lost'}, suspended ${JSON.stringify(F?.suspended)}, its ${run?.key} running to ${fmt(((run?.untilMs ?? t0) - t0) / 1000, 2)} s, nothing cut (${d.beats.filter(b => b.st === 'cut').length}); the body at (${me.x}, ${me.z}) moving ${JSON.stringify(me.v)}; Carry on: "${stepsOf(s).find(r => r.id === 'drill:carry')?.label}"`);
      assert(F === d && F.suspended?.why === 'contact' && run && run.untilMs > s.clock.ms && !d.beats.some(b => b.st === 'cut') && !s.stop.carry && s.stop.doing === null, JSON.stringify({ suspended: F?.suspended, run: run?.key, carry: s.stop.carry }));
      assert(stepsOf(s).some(r => r.id === 'drill:carry'), 'Carry on offered');
      // (Hold him needs the feet: the flow halted where it stands, the entry cut there, the rest "Carry on")
      const hold = stepsOf(s).find(r => r.id === 'contact:hold' && !r.off);
      assert(hold, 'Hold him offered');
      pick(g, 'contact:hold');
      const cut = d.beats.find(b => b.st === 'cut' && b.k === 'move');
      console.log(`      Hold him: the entry cut at ${fmt((cut?.untilMs - t0) / 1000, 2)} s, the rest: ${s.stop.carry?.beats?.join(', ')}`);
      assert(cut && !s.stop.flow && s.stop.carry?.beats?.includes(cut.key), JSON.stringify({ cut: cut?.key, carry: s.stop.carry }));
      // (Backspace: a fresh world, the bundle stopped in its approach: the approach ends, nothing more starts)
      const w2 = drillWorld({ tier: 'sgt' }), g2 = w2.g, s2 = w2.s;
      pick(g2, stepsOf(s2).find(r => r.id.startsWith('drill:room:clear>')).id);
      g2.step(10);
      const d2 = s2.stop.doing, running = d2.beats.filter(b => b.st === 'run').map(b => b.key);
      g2.step(1, { act: [{ act: 'stop', args: { step: 'drill:stop' } }] });
      settle(g2, s2);
      const ran = d2.beats.filter(b => b.st === 'done').map(b => b.key);
      console.log(`      Backspace in the approach (running: ${running.join(', ')}): done ${ran.join(', ')}; carried ${s2.stop.carry?.beats?.join(', ')}`);
      assert(ran.every(id => running.includes(id)) && s2.stop.carry?.why === 'stop', JSON.stringify({ ran, running, carry: s2.stop.carry }));
    },
  },
  {
    name: 'a save made in a bundle (mid-beat, the feet and the hands running together) loads and carries on byte for byte',
    fn() {
      const w = drillWorld({ tier: 'tierone' }), { g, s } = w;
      pick(g, stepsOf(s).find(r => r.id.startsWith('drill:room:clear>')).id);
      g.step(60);
      const running = s.stop?.doing?.beats?.filter(x => x.st === 'run').map(x => `${x.key}/${x.ch}`).join(', ');
      const json = g.save();
      const g2 = createGame({ scenario: 'test-handling', seed: 48213, hour: 11, setup: 'bench', domains: { weapons: DRILL_WEAPONS } });
      g2.load(json);
      g2.state.$testPlans = s.$testPlans;
      for (let i = 0; i < 300; i++) { g.step(1); g2.step(1); }
      const a = g.digest(), b = g2.digest();
      console.log(`      saved at ${running}; 300 ticks on: ${a} and ${b}`);
      assert(a === b && running.includes('feet') && running.includes('hands'), `${a} against ${b}; ${running}`);
    },
  },
  {
    name: 'the move\'s closed form: a trapezoid at the legs\' push and brake reaches its length at its time (the private\'s 4.0 m stack at 1 G: 3.57 s; BODY §16.2)',
    fn() {
      const P = profileOf(4.0, 1.23, 3.12, 5.07), end = profileAt(P, P.T);
      console.log(`      4.0 m at 1.23 m/s, push 3.12 and brake 5.07 m/s²: ${fmt(P.T, 3)} s (up ${fmt(P.t1, 3)}, cruise ${fmt(P.t2, 3)}, down ${fmt(P.t3, 3)}), at its end ${fmt(end.s, 3)} m and ${fmt(end.v, 3)} m/s`);
      assert(Math.abs(P.T - 3.570) < 0.002 && Math.abs(end.s - 4) < 1e-9 && end.v === 0, JSON.stringify(P));
    },
  },
];
