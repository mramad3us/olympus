// The Corps' commands as macros (src/sim/arms/drills.js; WEAPONS §5.3; the build sheet 0.0.5 §4, §5.1): each macro's time by tier against the sheet's corrected §5.3, the belief and the condition after each sub-step, where a rushed UNLOAD halts at Weapon handling 4, no macro past a failure that is not routine, a routine natural 1 costing only time, subsOf's skips, and SHOW CLEAR's last net and its failure.
import { assert, fmt } from './helpers.mjs';
import { armsWorld, heard } from './arms-world.mjs';
import { move } from '../src/sim/arms/kit.js';
import { fixedRoller } from '../src/sim/combat/roll.js';
import { feed, beliefOf, conditionOf, conditionOfBelief, gunField, said, doAction } from '../src/sim/arms/firearms.js';
import { MACROS, subsOf, macroMs, macrosFor, runMacro } from '../src/sim/arms/drills.js';

const R7 = { type: 'gun', model: 'r7' };
// (beliefs a macro starts from: Condition 1, Condition 4, locked on an empty magazine, rounds left)
const B1 = { mag: 'in', chamber: 'live', locked: false, count: 4, mode: 'safe' }, B4 = { mag: 'out', chamber: 'empty', locked: false, mode: 'safe' };
const BL = { mag: 'in', chamber: 'empty', locked: true, count: 0, mode: 'semi' }, BR = { mag: 'in', chamber: 'live', locked: false, count: 2, mode: 'semi' };
const FROM = { load: B4, ready: { ...B1, chamber: 'empty', count: 5 }, unload: B1, clear: B1, 'reload:speed': BL, 'reload:retain': BL, 'reload:tactical': BR, ia: { ...BR, stoppage: 'click' }, remedial: { ...BR, stoppage: 'double' }, cease: { ...BR } };
// (the build sheet's §4: at WH 10, and LOAD / MAKE READY / UNLOAD / IA / speed reload by tier)
const SHEET10 = { load: 2.41, ready: 3.10, unload: 5.00, clear: 7.90, 'reload:speed': 2.53, 'reload:retain': 2.99, 'reload:tactical': 3.22, ia: 1.57, remedial: 6.05, cease: 0.40 };
const SHEET_TIERS = { 3: [3.66, 4.59, 7.35, 2.02, 3.43], 7: [2.83, 3.61, 5.80, 1.73, 2.85], 15: [1.93, 2.51, 4.05, 1.37, 2.13], 20: [1.60, 2.10, 3.40, 1.22, 1.84], 30: [1.18, 1.58, 2.56, 1.02, 1.45] };
// (WEAPONS §5.3's own times, before the sheet's §8 item 13 corrected them)
const WEAPONS53 = { load: 2.3, ready: 2.7, unload: 5.1, clear: 8, 'reload:speed': 2.5, 'reload:retain': 2.7, 'reload:tactical': 3.2, ia: 1.3, remedial: 5.75, cease: 0.4 };

// (a fixture in Condition 1 on safe: a magazine of five in, one chambered)
function cond1(opts = {}) {
  const W = armsWorld(opts), g = W.state.items[W.gunId], m = W.state.items[W.magIds[0]];
  move(W.state, W.magIds[0], { gun: W.gunId });
  feed(g, m);
  g.belief = { chamber: 'live', count: m.n };
  delete m.belief;
  return W;
}

export default [
  {
    name: 'each macro\'s time is the sum of its sub-steps\' formula times: at WH 10 LOAD 2.41 s, MAKE READY 3.10, UNLOAD 5.00, SHOW CLEAR 7.90, RELOAD 2.53 / 2.99 / 3.22, IA 1.57, REMEDIAL 6.05, CEASE FIRE 0.40, and by tier as the sheet has them',
    fn() {
      const obs = fixedRoller({ awareness: 10 });
      const ids = Object.keys(MACROS), tiers = [3, 7, 10, 15, 20, 30];
      console.log(`      ${'macro'.padEnd(24)}${tiers.map(v => `WH ${v}`.padStart(8)).join('')}   §5.3   sub-steps`);
      let worst = 0;
      for (const id of ids) {
        const t = tiers.map(v => macroMs(fixedRoller({ weapons: v }), R7, id, FROM[id], 'normal', { observer: obs }) / 1000);
        console.log(`      ${MACROS[id].label.padEnd(24)}${t.map(x => fmt(x, 2).padStart(8)).join('')}   ${fmt(WEAPONS53[id], 2)}   ${subsOf(id, FROM[id]).join(', ')}`);
        worst = Math.max(worst, Math.abs(t[2] - SHEET10[id]));
      }
      const five = ['load', 'ready', 'unload', 'ia', 'reload:speed'];
      for (const [v, want] of Object.entries(SHEET_TIERS)) {
        const got = five.map(id => macroMs(fixedRoller({ weapons: Number(v) }), R7, id, FROM[id], 'normal') / 1000);
        got.forEach((g, i) => { worst = Math.max(worst, Math.abs(g - want[i])); });
      }
      const rushed = macroMs(fixedRoller({ weapons: 10 }), R7, 'load', FROM.load, 'rushed') / 1000, careful = macroMs(fixedRoller({ weapons: 10 }), R7, 'ready', FROM.ready, 'careful') / 1000;
      console.log(`      LOAD rushed (the magazine in rushable, the thumbs not) ${fmt(rushed, 2)} s; MAKE READY careful (the press check careful) ${fmt(careful, 2)} s`);
      console.log(`      worst against the sheet's §4: ${fmt(worst, 3)} s (SHOW CLEAR is 7.89 s of formula, 7.90 lived on the 50 ms tick)`);
      assert(worst <= 0.0151, `the sheet's macro times: worst ${worst}`);
    },
  },
  {
    name: 'the belief and the weapons condition after each sub-step of LOAD, MAKE READY, CEASE FIRE, UNLOAD and UNLOAD SHOW CLEAR at WH 10 in the light',
    fn() {
      const W = armsWorld({ wh: 10 }), { state, bus, pid, gunId, coachId } = W;
      const show = (r) => { for (const s of r.subs) console.log(`        ${s.action.padEnd(14)} ${String(s.ms).padStart(5)} ms ${s.routine ? 'routine' : s.grade} → C${s.cond ?? '-'}: ${s.text}`); };
      for (const [macro, extra] of [['load'], ['ready'], ['cease'], ['unload'], ['load'], ['ready'], ['clear', { observerId: coachId }]]) {
        if (macro === 'cease') { state.items[gunId].mode = 'semi'; state.people[pid].kit.carry.finger = 'on'; }
        const r = runMacro(state, bus, { macro, pid, gunId, ...(extra ?? {}) });
        console.log(`      ${MACROS[macro].label}: ${fmt(r.ms / 1000, 2)} s, ${r.halted ? `halted at ${r.halted.at}` : 'whole'} → ${said(beliefOf(state, gunId))} (C${conditionOf(state.items[gunId]) ?? '-'}, believed ${conditionOfBelief(beliefOf(state, gunId)) ?? '-'})`);
        show(r);
        assert(!r.halted, `${macro} at WH 10 in the light never halts: ${JSON.stringify(r.halted)}`);
      }
      assert(conditionOf(state.items[gunId]) === 4 && gunField(state.items[gunId], 'cocked'), 'shown clear: Condition 4, the hammer cocked');
      const said1 = heard(bus, 'say').map(s => s.text);
      assert(said1.includes('Clear.'), `the coach: ${said1.join(' | ')}`);
    },
  },
  {
    name: 'a rushed UNLOAD at WH 4 over 400 runs: where it halts; no macro carries on past a failure that is not routine, the rest of it queued',
    fn() {
      const at = {}, grades = {};
      let halted = 0, totalMs = 0;
      for (let i = 0; i < 400; i++) {
        const W = cond1({ wh: 4, seed: 1000 + i });
        const r = runMacro(W.state, W.bus, { macro: 'unload', pid: W.pid, gunId: W.gunId, tempo: 'rushed' });
        totalMs += r.ms;
        const all = subsOf('unload', { mag: 'in', locked: false });
        if (r.halted) {
          halted++;
          at[r.halted.at] = (at[r.halted.at] ?? 0) + 1;
          grades[r.halted.why] = (grades[r.halted.why] ?? 0) + 1;
          const k = r.subs.length - 1;
          assert(all[k] === r.halted.at && JSON.stringify(r.queue) === JSON.stringify(all.slice(k + 1)), `halted at ${r.halted.at}: the rest queued, nothing after it done`);
          const failed = r.subs[k];
          assert(!failed.ok && !failed.routine || failed.mishap || r.halted.why === 'refused', `the halt is a failure that bites: ${JSON.stringify(failed)}`);
        } else assert(r.subs.every(s => s.ok || s.routine), 'a whole UNLOAD had no failure that bites');
      }
      console.log(`      ${halted} of 400 halted (${fmt(halted / 4, 1)}%), mean ${fmt(totalMs / 400 / 1000, 2)} s; at: ${Object.entries(at).map(([k, v]) => `${k} ${v}`).join(', ')}; by: ${Object.entries(grades).map(([k, v]) => `${k} ${v}`).join(', ')}`);
      assert(halted > 40, 'a rushed recruit halts often');
    },
  },
  {
    name: 'a routine natural 1 costs ×1.6 of its time and halts nothing (WH 10, in the light, the range\'s pressure)',
    fn() {
      let found = null, runs = 0;
      for (let i = 0; i < 2000 && !found; i++) {
        const W = cond1({ wh: 10, seed: 5000 + i });
        const r = runMacro(W.state, W.bus, { macro: 'unload', pid: W.pid, gunId: W.gunId });
        runs++;
        assert(!r.halted, `UNLOAD at WH 10 is routine throughout: halted ${JSON.stringify(r.halted)}`);
        const nat1 = W.state.log.filter(e => e.kind === 'roll' && e.roll?.roll === 1);
        if (nat1.length) found = { r, e: nat1[0], W };
      }
      assert(found, 'a natural 1 in 2,000 UNLOADs');
      const { r, e } = found, sub = r.subs.find(s => s.action === e.step);
      const base = macroMs(fixedRoller({ weapons: 10 }), R7, 'unload', { mag: 'in', locked: false });
      console.log(`      a natural 1 on ${e.step} after ${runs} UNLOADs: routine ${e.roll.routine}, grade ${e.roll.grade}, ${sub.ms} ms; the UNLOAD ${r.ms} ms against ${base} ms whole, nothing halted`);
      const one = { 'selector:safe': 401, 'magOut:pouch': 1611, lockBack: 691, inspect: 1151, release: 345, port: 401 }[e.step];
      assert(e.roll.routine && !e.roll.ok && Math.abs(sub.ms - one * 1.6) <= 2 && !r.halted, `×1.6: ${sub.ms} against ${one}`);
    },
  },
  {
    name: 'subsOf skips only a magazine out with none believed in and a lock back with the bolt believed locked; the selector\'s and the port\'s checks always run',
    fn() {
      const lines = [];
      for (const [what, b] of [['Condition 1', B1], ['Condition 4', B4], ['locked on empty', BL], ['locked, no magazine', { ...BL, mag: 'out' }]]) {
        for (const m of ['unload', 'clear', 'load', 'ready', 'cease']) {
          const s = subsOf(m, b), all = MACROS[m].subs;
          lines.push(`${what} ${MACROS[m].label}: ${all.length - s.length} skipped (${all.filter(a => !s.includes(a)).join(', ') || 'none'})`);
          for (const a of all.filter(x => !s.includes(x))) assert((a.startsWith('magOut:') && b.mag === 'out') || (a === 'lockBack' && b.locked), `${what} ${m}: ${a} skipped`);
          assert(all.filter(a => a.startsWith('selector:') || a === 'port').every(a => s.includes(a)), `${what} ${m}: the checks run`);
        }
      }
      console.log(`      ${lines.join('\n      ')}`);
    },
  },
  {
    name: 'what the belief offers: LOAD from Condition 4, MAKE READY from 3, the reloads from a bolt locked on empty, SHOW CLEAR only with an observer at hand',
    fn() {
      const W = armsWorld({ wh: 10 }), { state, bus, pid, gunId, coachId } = W;
      const ids = (o = {}) => macrosFor(state, pid, gunId, o).map(m => `${m.id} ${fmt(m.ms / 1000, 2)}`);
      const lines = [`Condition 4: ${ids().join(', ')}`];
      assert(ids().some(x => x.startsWith('load')) && !ids().some(x => x.startsWith('ready')), 'C4: LOAD, not MAKE READY');
      runMacro(state, bus, { macro: 'load', pid, gunId });
      lines.push(`Condition 3: ${ids().join(', ')}`);
      assert(ids().some(x => x.startsWith('ready')), 'C3: MAKE READY');
      runMacro(state, bus, { macro: 'ready', pid, gunId });
      const g = state.items[gunId], m = state.items[g.mag];
      m.n = 0; g.chamber = undefined; delete g.chamber; g.locked = true; g.mode = 'semi'; g.belief = { chamber: 'empty', locked: true, count: 0 };
      lines.push(`locked on empty: ${ids().join(', ')}; with the coach: ${ids({ observerId: coachId }).join(', ')}`);
      assert(ids().some(x => x.startsWith('reload:speed')) && ids().some(x => x.startsWith('reload:retain')) && !ids().some(x => x.startsWith('clear')), 'locked empty: the reloads, no SHOW CLEAR alone');
      assert(ids({ observerId: coachId }).some(x => x.startsWith('clear')), 'SHOW CLEAR with the coach');
      console.log(`      ${lines.join('\n      ')}`);
    },
  },
  {
    name: 'SHOW CLEAR with a round left in (a missed lock back, then a forced bad inspection): the coach at Awareness 14 says "Hold."; a forced failed look lets the function check fire it: ND-1, into the berm',
    fn() {
      // (the coach catches it)
      const W = cond1({ wh: 10, awareness: 14 }), { state, bus, pid, gunId, coachId } = W;
      const force = { lockBack: 'miss', inspect: 'bad' };
      const a = runMacro(state, bus, { macro: 'clear', pid, gunId, observerId: coachId, force });
      assert(a.halted?.at === 'lockBack' && beliefOf(state, gunId).chamber === '?', `the missed lock back halts it, '?': ${JSON.stringify(a.halted)}`);
      // (a marine who carries on without checking: the queue, as the panel offers it)
      let lines = [`the lock back missed: "${a.subs.at(-1).text}"; carried on: ${a.queue.join(', ')}`];
      let held = null;
      for (const action of a.queue) {
        const r = doAction(state, bus, { pid, gunId, action, observerId: coachId, force });
        lines.push(`${action}: ${r.observed?.said ?? r.text}`);
        if (r.halts) { held = { action, r }; break; }
      }
      assert(held?.action === 'show' && held.r.observed.said === 'Hold. There\'s a round in it.', `the coach holds it: ${JSON.stringify(held?.r?.observed?.said)}`);
      console.log(`      ${lines.join('\n      ')}`);
      // (the coach's look fails: Clear., and the function check fires the round)
      const V = cond1({ wh: 10, awareness: 14 });
      const force2 = { lockBack: 'miss', inspect: 'bad', show: 'miss' };
      const b = runMacro(V.state, V.bus, { macro: 'clear', pid: V.pid, gunId: V.gunId, observerId: V.coachId, force: force2 });
      lines = [];
      let nd = null;
      for (const action of b.queue) {
        const r = doAction(V.state, V.bus, { pid: V.pid, gunId: V.gunId, action, observerId: V.coachId, force: force2 });
        lines.push(`${action}: ${r.observed?.said ?? r.text}`);
        if (r.nd) { nd = r.nd; break; }
      }
      console.log(`      the look failed: ${lines.join('; ')}`);
      console.log(`      the discharge: ${nd?.grade}, into the ${nd?.into} at (${nd?.at?.x}, ${nd?.at?.z}), during ${nd?.during}; facts: ${heard(V.bus, 'nd').map(f => `${f.grade} ${f.into}`).join(', ')}`);
      assert(nd && nd.grade === 'ND-1' && nd.into === 'berm' && nd.during === 'functionCheck', `ND-1 into the berm: ${JSON.stringify(nd)}`);
    },
  },
];
