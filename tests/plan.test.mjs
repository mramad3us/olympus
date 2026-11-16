// OLYMPUS tests: the planner under the handling rows (src/sim/arms/plan.js; the build sheet 0.0.18 §5.1 tests 4, 5, 7, 8, 10 to 12).
//
// The user, 2026-11-15: the handling options come from the gun's believed state, for any gun. What each test pins, each failing
// on v0.0.17's offers:
//   - a magazine believed empty in a closed, empty rifle with spares in reach: Fix and the reload slot offer RELOAD (v0.0.17: Fix
//     "nothing offered now", MAKE READY needing rounds believed in, RELOAD a locked bolt, Top up rounds);
//   - a missed lock back leaves a round behind the bolt: Fix looks at the port first, never the bolt release onto it (v0.0.17: Fix
//     was Top up, and the bolt release then fed a double);
//   - an empty magazine in the hand is dropped, never seated by RELOAD (v0.0.17's subsOf seated whatever the hand held);
//   - the tower's MAKE READY keeps Fix; on the lane an empty chamber with a magazine in is Charge;
//   - the memo changes nothing; planning at the house's busiest stop stays inside a pause's budget; the names follow the path.
import { assert, machineK } from './helpers.mjs';
import { drillWorld } from './drill-world.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot } from './bots/house.mjs';
import { doAction, beliefOf } from '../src/sim/arms/firearms.js';
import { macrosFor } from '../src/sim/arms/drills.js';
import { stepsOf, chooseStep } from '../src/sim/arms/shooting.js';
import { modelOf } from '../src/sim/arms/groups.js';
import { move, handMagOf, pouchesOf } from '../src/sim/arms/kit.js';
import { plan, nameOf, clearPlans, planStats, PLAN_POPS } from '../src/sim/arms/plan.js';

/** The planning budget at a pause (ms, × the machine's factor; the build sheet 0.0.18 §4). */
export const PLAN_CEIL_MS = 3;

// (a step chosen and run to its end, time standing again: the stepper's ticks)
function run(g, s, step) {
  const r = chooseStep(s, g.bus, { step });
  for (let i = 0; i < 400 && s.stop?.mode === 'stop' && s.stop.phase !== 'choose'; i++) g.step(1);
  return r;
}
const fixOf = (s) => modelOf(stepsOf(s)).core.fix.row;
// (the rifle's magazine in made empty, believed so, the chamber empty and the bolt home: the in-0 state)
function inZero(w) {
  const { s, gunId } = w, gun = s.items[gunId];
  s.items[gun.mag].n = 0; delete gun.chamber;
  gun.belief = { chamber: 'empty', count: 0 };
  return w;
}
const base = { model: 'r7', carry: 'ready', mag: 'in', n: '+', ch: 'live', lk: false, st: null, mode: 'semi', ck: true, hand: null, pool: ['+', '+'], ground: null, dump: true, room: true };
const A = (o) => Object.freeze({ ...base, ...o });

export default [
  {
    name: 'a magazine believed empty in, the bolt home and the chamber empty, with spares in reach: Fix and the reload slot offer RELOAD (magazine out, reach, seat, charge), and it fires after',
    fn() {
      const w = inZero(drillWorld({ tier: 'private' })), { g, s, pid, gunId } = w;
      const m = macrosFor(s, pid, gunId).find(x => x.id === 'reload:speed');
      assert(m && JSON.stringify(m.subs) === JSON.stringify(['magOut:drop', 'reach', 'seat', 'charge']), JSON.stringify(macrosFor(s, pid, gunId).map(x => [x.id, x.subs])));
      const f = fixOf(s), slot = modelOf(stepsOf(s)).groups.GUN.slots[1]?.row;
      assert(f?.id === 'macro:reload:speed' && f.label === 'RELOAD' && !f.off, JSON.stringify({ fix: f }));
      assert(slot?.id === 'macro:reload:speed', JSON.stringify({ slot }));
      run(g, s, 'macro:reload:speed');
      const b = beliefOf(s, gunId);
      assert(b.mag === 'in' && b.count > 0 && s.items[gunId].chamber === 'live', JSON.stringify({ b, chamber: s.items[gunId].chamber }));
      console.log(`      Fix ${f.label}: ${f.subs.map(x => x.id).join(', ')} in ${(f.ms / 1000).toFixed(2)} s; then ${b.count} in the magazine, one chambered`);
    },
  },
  {
    name: 'a missed lock back leaves a round behind the bolt: Fix looks at the port first and never offers the bolt release onto it; Fix pressed until ready ends with no double feed',
    fn() {
      const w = drillWorld({ tier: 'private' }), { g, s, pid, gunId } = w;
      const r = doAction(s, g.bus, { pid, gunId, action: 'lockBack', force: { lockBack: 'miss' } });
      const b0 = beliefOf(s, gunId);
      assert(s.items[gunId].chamber === 'live' && b0.locked && b0.chamber === '?', JSON.stringify({ text: r.text, truth: s.items[gunId].chamber, b0 }));
      const f0 = fixOf(s);
      assert(f0?.id === 'observe', JSON.stringify({ fix: f0 }));
      const seen = [];
      for (let i = 0; i < 8; i++) {
        const f = fixOf(s), b = beliefOf(s, gunId);
        if (b.chamber === 'live' && !b.locked && !b.stoppage && b.mode !== 'safe') break;
        if (!f || f.stand) break;
        assert(!(f.id === 'release' && b.locked && b.chamber !== 'empty'), JSON.stringify({ at: i, fix: f.id, b }));
        seen.push(f.id);
        run(g, s, f.id);
        assert(!s.items[gunId].jam, JSON.stringify({ at: i, after: f.id, jam: s.items[gunId].jam }));
      }
      const gun = s.items[gunId];
      assert(gun.chamber === 'live' && !gun.locked && !gun.jam && gun.mode !== 'safe', JSON.stringify({ seen, gun }));
      console.log(`      Fix pressed: ${seen.join(' → ')}; then ready, no double feed`);
    },
  },
  {
    name: 'an empty magazine in the hand is never seated by RELOAD: dropped, then a full one reached',
    fn() {
      const w = drillWorld({ tier: 'private' }), { s, pid, gunId } = w, gun = s.items[gunId];
      // (the magazine out into the hand, believed empty, the chamber fired dry)
      const magId = gun.mag;
      s.items[magId].n = 0; s.items[magId].belief = { n: 0 };
      move(s, magId, { pid, hand: 1 });
      delete gun.chamber; gun.belief = { chamber: 'empty' };
      assert(handMagOf(s, pid)?.id === magId && beliefOf(s, gunId).mag === 'out', JSON.stringify({ hand: handMagOf(s, pid) }));
      const m = macrosFor(s, pid, gunId).find(x => x.id === 'reload:speed');
      assert(m && m.subs[0] === 'dropMag' && m.subs.includes('reach') && !m.subs.slice(0, m.subs.indexOf('reach')).includes('seat'), JSON.stringify(macrosFor(s, pid, gunId).map(x => [x.id, x.subs])));
      const f = fixOf(s);
      assert(f?.id === 'macro:reload:speed', JSON.stringify({ fix: f }));
      console.log(`      RELOAD: ${m.subs.join(', ')}; keep the empty: ${macrosFor(s, pid, gunId).find(x => x.id === 'reload:retain')?.subs.join(', ') ?? 'not offered'}`);
    },
  },
  {
    name: 'on the tower\'s MAKE READY, Fix is MAKE READY, and on the lane with an empty chamber and a magazine in, Fix is Charge (the build sheet 0.0.18 §0 item 19)',
    fn() {
      const w = drillWorld({ tier: 'private', safe: true }), { s, gunId, R } = w, gun = s.items[gunId];
      delete gun.chamber; gun.belief = { chamber: 'empty', count: 14 };
      R.cmd = { id: 'ready', atMs: s.clock.ms };
      const f1 = fixOf(s);
      assert(f1?.id === 'macro:ready' && f1.cmd, JSON.stringify({ fix: f1 }));
      R.cmd = null;
      const f2 = fixOf(s);
      assert(f2?.id === 'charge', JSON.stringify({ fix: f2 }));
      console.log(`      the tower's MAKE READY: Fix ${f1.label} (${(f1.ms / 1000).toFixed(2)} s); on the lane: Fix ${f2.label} (${(f2.ms / 1000).toFixed(2)} s)`);
    },
  },
  {
    name: 'the memo changes nothing: a house lane with the memo cleared mid-lane saves byte for byte',
    fn() {
      const lane = (clearAt) => {
        clearPlans();
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' });
        let n = 0;
        runHouse(g, houseHonestBot(), { each: () => { if (++n === clearAt) clearPlans(); } });
        return { d: g.digest(), st: planStats() };
      };
      const a = lane(-1), b = lane(400);
      assert(a.d === b.d, JSON.stringify({ a: a.d, b: b.d }));
      console.log(`      the tier one's lane on 48213: digest ${a.d} both ways; the memo ${a.st.hits} hits, ${a.st.misses} misses (${a.st.size} kept), the most pops ${a.st.maxPops} (cap ${PLAN_POPS})`);
      assert(a.st.misses <= a.st.size, JSON.stringify(a.st));
    },
  },
  {
    name: 'planning stays inside a pause\'s budget: stepsOf at the house\'s contact stop with the memo cold, and the P-12 drawn, under PLAN_CEIL_MS × k',
    fn() {
      const k = machineK(), ceil = PLAN_CEIL_MS * k;
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'contact' }), s = g.state;
      for (let i = 0; i < 400 && !(s.stop?.mode === 'stop' && s.stop.phase === 'choose' && s.stop.via === 'contact'); i++) g.step(1);
      const time = () => { clearPlans(); stepsOf(s); clearPlans(); const t0 = performance.now(); stepsOf(s); return performance.now() - t0; };
      const t1 = [0, 0, 0].map(time).sort((x, y) => x - y)[1];
      // (the pistol drawn: Transition)
      if (s.stop?.phase === 'choose') run(g, s, 'weapon:transition');
      const drawn = s.stop?.gun !== s.people[s.player.id].kit.worn.sling;
      const t2 = s.stop?.mode === 'stop' ? [0, 0, 0].map(time).sort((x, y) => x - y)[1] : 0;
      const warm = (() => { stepsOf(s); const t0 = performance.now(); stepsOf(s); return performance.now() - t0; })();
      console.log(`      stepsOf at the contact stop, memo cold: ${t1.toFixed(2)} ms; ${drawn ? 'the P-12 drawn' : 'no transition offered'}: ${t2.toFixed(2)} ms; warm ${warm.toFixed(2)} ms (ceiling ${ceil.toFixed(2)} ms, k ${k.toFixed(2)})`);
      assert(t1 < ceil && t2 < ceil, JSON.stringify({ t1, t2, ceil }));
    },
  },
  {
    name: 'the names follow the path: each plan is the row the panel already has, its id and its words (house-magout\'s "Magazine in" kept)',
    fn() {
      const table = [
        [A({ n: '0', ch: 'empty', lk: true }), 'fed', 'speed', 'macro:reload:speed', 'RELOAD', 'magOut:drop,reach,seat,release'],
        [A({ n: '0', ch: 'empty', lk: true }), 'retain', 'retain', 'macro:reload:retain', 'RELOAD, keep the empty', 'magOut:dump,reach,seat,release'],
        [A({ n: '+' }), 'topup', 'tactical', 'macro:reload:tactical', 'Top up', 'magOut:pouch,reach,seat'],
        [A({ mag: 'out', n: null }), 'topup', 'tactical', 'macro:reload:tactical', 'Magazine in', 'reach,seat'],
        [A({ mag: 'out', n: null }), 'fed', null, 'macro:reload:tactical', 'Magazine in', 'reach,seat'],
        [A({ mag: 'out', n: null, ch: 'empty' }), 'fed', 'speed', 'macro:reload:speed', 'RELOAD', 'reach,seat,charge'],
        [A({ n: '0', ch: 'empty' }), 'fire', null, 'macro:reload:speed', 'RELOAD', 'magOut:drop,reach,seat,charge'],
        [A({ st: 'click', ck: false }), 'fire', null, 'macro:ia', 'IMMEDIATE ACTION', 'ia'],
        [A({ st: 'double', ch: 'case' }), 'fire', null, 'macro:remedial', 'REMEDIAL ACTION', 'remedial'],
        [A({ ch: '?' }), 'fire', null, 'pressCheck', 'Press check', 'pressCheck'],
        [A({ ch: '?', lk: true }), 'fire', null, 'observe', 'Look at the port', 'observe'],
        [A({ ch: 'empty', mode: 'safe' }), 'fire', null, 'charge', 'Charge', 'charge,selector:semi'],
        [A({ mode: 'safe' }), 'fire', null, 'selector:semi', 'Off safe', 'selector:semi'],
        [A({ ch: 'empty', lk: true }), 'fire', null, 'release', 'Bolt release', 'release'],
        [A({ carry: 'slung', mode: 'safe' }), 'fire', null, 'up', 'Rifle up', 'up,selector:semi'],
        [A({ model: 'p12', carry: 'hand', ch: 'empty', pool: ['+'], dump: false }), 'fire', null, 'charge', 'Rack the slide', 'charge'],
        [A({ model: 'p12', carry: 'holster', mode: 'safe', pool: ['+'], dump: false }), 'fire', null, 'draw:thigh', 'Draw the pistol', 'draw:thigh,selector:semi'],
      ];
      const bad = [];
      for (const [a, goal, purpose, id, label, path] of table) {
        const p = plan(a, goal), n = nameOf(p, purpose, a.model);
        if (p.path?.join(',') !== path || n?.id !== id || n?.label !== label) bad.push({ a: `${a.model} ${a.carry} ${a.mag}${a.n ?? ''} ${a.ch}${a.lk ? ' L' : ''} ${a.st ?? ''} ${a.mode}`, goal, want: [id, label, path], got: [n?.id, n?.label, p.path?.join(',')] });
      }
      console.log(`      ${table.length} paths named: ${table.map(([, , , , label]) => label).filter((x, i, l) => l.indexOf(x) === i).join(', ')}`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
];
