// OLYMPUS tests: the dead-end walk of the planner over every believed state the hands can reach, on the R-7 and the P-12 (src/sim/arms/plan.js; the build sheet 0.0.18 §5.1 tests 1 to 3 and 10).
//
// The user's rule: never a dead end. The walk (plan.js reachable) starts from Conditions 1, 3 and 4 on safe, the rifle ready and
// slung, the pistol in the hand and holstered, two full spares, and tries every action the hands can at a pass, a miss and a
// disaster, and every pull (a round, the last round, a stovepipe, a double feed, a dud); each gun-and-hand belief it reaches is
// crossed with 8 pouch states (two full spares, a full and an empty, an empty, none; a full one at the feet or none). In every one
// the planner has a way to fire or says honestly there is none, where v0.0.17's offers (tests/plan-legacy.mjs) had none on the
// magazine believed empty in a closed, empty gun. The planner's step is held equal to doAction's on a real state, and where
// v0.0.17 offered a reload its path is the planner's but for the empty magazine in the hand, which v0.0.17 seated.
import { assert, machineK } from './helpers.mjs';
import { drillWorld } from './drill-world.mjs';
import { absOf, absKey, stepAbs, plan, honestNone, reachable, clearPlans, planStats, planFor, PLAN_POPS, GOAL_OF } from '../src/sim/arms/plan.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { modelOf } from '../src/sim/arms/groups.js';
import { doAction, gunField } from '../src/sim/arms/firearms.js';
import { move, discard, pouchesOf, atFeetOf, issueSidearm, handMagOf } from '../src/sim/arms/kit.js';
import { newMag } from '../src/sim/arms/firearms.js';
import { legacyMacros, legacySubs, legacyFix } from './plan-legacy.mjs';

const SEED_BASE = { lk: false, st: null, mode: 'safe', ck: true, hand: null, pool: Object.freeze(['+', '+']), ground: null, dump: true, room: true };
const CONDITIONS = Object.freeze([{ mag: 'in', n: '+', ch: 'live' }, { mag: 'in', n: '+', ch: 'empty' }, { mag: 'out', n: null, ch: 'empty' }]);
export const SEEDS = Object.freeze([['r7', 'ready'], ['r7', 'slung'], ['p12', 'hand'], ['p12', 'holster']]
  .flatMap(([model, carry]) => CONDITIONS.map(c => Object.freeze({ model, carry, ...SEED_BASE, ...c }))));
const POUCHES = Object.freeze([['+', '+'], ['+', '0'], ['0'], []].flatMap(pool => ['+', null].map(ground => ({ pool: Object.freeze(pool), ground }))));
const live = (a) => (a.carry === 'ready' || a.carry === 'hand') && a.ch === 'live' && !a.lk && !a.st && a.mode !== 'safe';

let WALK = null;
// (the walk once a process: the reachable states, and each gun-and-hand belief crossed with the pouch states)
function walk() {
  if (WALK) return WALK;
  const t0 = performance.now(), all = reachable(SEEDS);
  const tReach = performance.now() - t0, beliefs = new Map();
  for (const a of all) { const k = absKey({ ...a, pool: [], ground: null, dump: true, room: true }); if (!beliefs.has(k)) beliefs.set(k, a); }
  const crossed = [];
  for (const a of beliefs.values()) for (const p of POUCHES) crossed.push(Object.freeze({ ...a, ...p, dump: true, room: true }));
  WALK = { all, beliefs: [...beliefs.values()], crossed, tReach };
  return WALK;
}

// ---- a belief made real on the drill's world (the agreement test) ----

const N = { '0': 0, '+': 5, '?': 5 };
function magOf(s, fam, b) { const id = newMag(s, { fam, n: N[b], told: b !== '?' }); return id; }
// (the world's own magazines of the gun's families cleared from the pouches, the hands and the feet; the abstraction's put back)
let BASE = null;
// (the drill's world once, the P-12 issued beside the rifle; each belief made real on a copy of it)
function base() {
  if (BASE) return BASE;
  const w = drillWorld({ tier: 'private' }), p = issueSidearm(w.s, w.pid).gunId;
  BASE = { s: w.s, pid: w.pid, rifle: w.gunId, pistol: p };
  return BASE;
}
function concrete(a) {
  const B = base(), s = structuredClone(B.s), pid = B.pid, kit = s.people[pid].kit, gunId = a.model === 'p12' ? B.pistol : B.rifle;
  const fam = a.model === 'p12' ? 'had17' : 'had30', g = s.items[gunId];
  // (every pouch emptied, so a magazine moved finds room as the abstraction's room says: the pool goes in chest pouch 2)
  for (const p of pouchesOf(s, pid)) for (const id of p.mags) discard(s, id);
  for (const l of atFeetOf(s, pid)) discard(s, l.id);
  if (g.mag) discard(s, g.mag);
  for (const k of ['chamber', 'jam', 'locked', 'cocked', 'mode', 'portOpen', 'set', 'load']) delete g[k];
  if (a.mode !== 'safe') g.mode = a.mode;
  if (!a.ck) g.cocked = false;
  if (a.lk) g.locked = true;
  const ch = { live: 'live', dud: 'dud', case: 'case' }[a.ch];
  if (ch) g.chamber = ch;
  if (a.st === 'double') { g.jam = 'double'; g.chamber = 'case'; } else if (a.st === 'case' || a.st === 'felt') g.chamber = 'case'; else if (a.st === 'click') g.chamber = 'dud';
  g.belief = { chamber: a.ch, ...(a.lk ? { locked: true } : {}), ...(a.st ? { stoppage: a.st } : {}) };
  if (a.mag === 'in') { const m = magOf(s, fam, a.n); delete s.items[m].belief; move(s, m, { gun: gunId }); if (a.n !== '?') g.belief.count = N[a.n]; }
  // (the carry: the pistol in the right hand or its holster, the rifle up or slung)
  if (a.model === 'p12') { if (a.carry === 'hand') { move(s, gunId, { pid, hand: 0 }); kit.carry.posture = 'lowReady'; } else kit.carry.posture = 'slungFront'; }
  else kit.carry.posture = a.carry === 'slung' ? 'slungFront' : 'lowReady';
  if (a.hand && a.hand !== 'x') move(s, magOf(s, fam, a.hand), { pid, hand: 1 });
  const into = pouchesOf(s, pid).find(p => p.key === 'p2');
  for (const b of a.pool) move(s, magOf(s, fam, b), { container: into.id });
  if (a.ground) { const me = s.actors.list.find(x => x.who === pid); move(s, magOf(s, fam, a.ground), { ground: { area: s.actors.area, x: me.x + 0.3, z: me.z } }); }
  s.stop.gun = gunId;
  return { s, pid, gunId };
}
// (the actions the planner searches, the guards' and the walk's own besides)
const ACTS = Object.freeze(['magOut:drop', 'magOut:dump', 'magOut:pouch', 'reach', 'reach@ground', 'seat', 'charge', 'release', 'stowMag', 'dumpMag', 'dropMag', 'lockBack', 'up', 'tap', 'rack', 'magOut:strip', 'magIn', 'observe', 'pressCheck']);

export default [
  {
    name: 'every believed state the hands can reach on the R-7 and the P-12, with every pouch state, offers a way to fire or the panel says honestly there is none (v0.0.17\'s offers had none on a magazine believed empty in a closed, empty gun)',
    fn() {
      const { all, beliefs, crossed, tReach } = walk();
      clearPlans();
      let ways = 0, none = 0, dead = [], legacyDead = 0, inZeroLegacy = 0, msSum = 0, msMax = 0, planMax = 0;
      const first = {}, t0 = performance.now();
      for (const a of crossed) {
        const t = performance.now(), p = plan(a, 'fire'), dt = performance.now() - t;
        planMax = Math.max(planMax, dt);
        if (p.path) { ways++; msSum += p.costMs; msMax = Math.max(msMax, p.costMs); const f = p.path[0] ?? '(ready)'; first[f] = (first[f] ?? 0) + 1; }
        else if (p.none === 'no rounds' && honestNone(a)) none++;
        else dead.push(`${absKey(a)} → ${p.none}`);
        // (v0.0.17's Fix, where it had a way: none on a gun that cannot fire with rounds about is its dead end)
        if (!live(a) && !honestNone(a) && !legacyFix(a)) { legacyDead++; if (a.mag === 'in' && a.n === '0' && a.ch === 'empty' && !a.lk && !a.st) inZeroLegacy++; }
      }
      const tPlans = performance.now() - t0, st = planStats();
      console.log(`      ${all.length} states reached (${tReach.toFixed(0)} ms), ${beliefs.length} gun-and-hand beliefs (R-7 ${beliefs.filter(b => b.model === 'r7').length}, P-12 ${beliefs.filter(b => b.model === 'p12').length}) × ${POUCHES.length} pouch states = ${crossed.length}`);
      console.log(`      a way to fire ${ways}, honestly none ${none}, dead ends ${dead.length}; first steps ${Object.entries(first).sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k} ${n}`).join(', ')}`);
      console.log(`      a way's time at WH 10: mean ${(msSum / Math.max(1, ways) / 1000).toFixed(2)} s, worst ${(msMax / 1000).toFixed(2)} s; planning ${(tPlans / crossed.length).toFixed(3)} ms mean, worst ${planMax.toFixed(2)} ms; memo ${st.hits} hits, ${st.misses} misses, the most pops ${st.maxPops} (cap ${PLAN_POPS})`);
      console.log(`      v0.0.17's Fix had no way where the planner has one: ${legacyDead} states, ${inZeroLegacy} of them the magazine believed empty in a closed, empty gun`);
      assert(!dead.length, JSON.stringify(dead.slice(0, 6)));
      assert(st.maxPops < PLAN_POPS, JSON.stringify(st));
      assert(inZeroLegacy > 0, JSON.stringify({ legacyDead, inZeroLegacy }));
    },
  },
  {
    name: 'the panel on the walk\'s states (every 16th made real in the house, the gun in the hands): wherever the planner has a way to fire, Fix is that way\'s row, or a round is believed up and Fix fires it first (Off safe, or "already so"); a struck Fix only where there is honestly none (the review of v0.0.18: the walk tested the planner, never the panel)',
    fn() {
      const { crossed } = walk();
      let n = 0, way = 0, same = 0, now = 0, none = 0; const bad = [];
      for (let i = 0; i < crossed.length; i += 16) {
        const a = crossed[i];
        if (a.carry === 'slung' || a.carry === 'holster') continue;
        const c = concrete(a), p = planFor(c.s, c.pid, c.gunId, 'fire', { purpose: null }), f = modelOf(stepsOf(c.s)).core.fix.row;
        n++;
        if (!p.path) { none++; continue; }
        if (!p.path.length) continue;
        way++;
        if (f?.id === p.id && !f.off) same++;
        else if (a.ch === 'live' && !a.st && !a.lk && (f?.id === 'selector:semi' || (f?.kind === 'stand' && f.off === 'already so'))) now++;
        else bad.push(`${absKey(a)}: plan ${p.path.join(',')} (${p.id}); Fix ${f?.id} ${f?.off ?? ''}`);
      }
      console.log(`      ${n} panels: a way to fire ${way} (Fix the planner's row ${same}, a round up fired first ${now}), honestly none ${none}, wrong ${bad.length}`);
      assert(!bad.length && same > 0, JSON.stringify(bad.slice(0, 6)));
    },
  },
  {
    name: 'the planner\'s step agrees with doAction: every 40th believed state made real on the drill\'s world, each planned action done through doAction with a forced pass, reads back as stepAbs said',
    fn() {
      const { all } = walk();
      const pick = all.filter(a => a.dump && a.room && a.pool.length <= 2).filter((_, i) => i % 40 === 0);
      let n = 0, same = 0;
      const bad = [];
      for (const a of pick) {
        const c = concrete(a), got0 = absOf(c.s, c.pid, c.gunId);
        if (absKey(got0) !== absKey(a)) { bad.push({ made: absKey(a), read: absKey(got0) }); continue; }
        for (const x of ACTS) {
        // (the planner's own edges: up only while slung, nothing else then; the draw is the stepper's, sidearm.js)
        if ((a.carry === 'slung') !== (x === 'up') || a.carry === 'holster') continue;
        const want = stepAbs(a, x);
        if (!want) continue;
        const s = structuredClone(c.s), { pid, gunId } = c;
        // (a magazine put back goes to the first pouch with room for it, as plan.js planFor names it)
        const fam = a.model === 'p12' ? 'had17' : 'had30', into = pouchesOf(s, pid).find(q => !q.dump && q.room > 0 && (!q.fams || q.fams.includes(fam)));
        const act = x === 'stowMag' && into ? `stowMag@${into.key}` : x;
        const r = doAction(s, null, { pid, gunId, action: act, force: { [act]: 'pass' } });
        if (r.refused) { bad.push({ at: absKey(a), x, refused: r.text }); continue; }
        // (the stepper's own ends: the draw into the hand is sidearm.js's; the walk's pistol is in the hand already)
        const got = absOf(s, pid, gunId);
        n++;
        if (absKey(got) === absKey(want)) same++; else bad.push({ at: absKey(a), x, stepAbs: absKey(want), doAction: absKey(got) });
        }
      }
      console.log(`      ${pick.length} states, ${n} actions done through doAction: ${same} read back as stepAbs said, ${bad.length} not`);
      assert(!bad.length, JSON.stringify(bad.slice(0, 5)));
    },
  },
  {
    name: 'where v0.0.17 offered a reload, the planner\'s path is the one it ran, but for the named improvement: an empty magazine in the hand is dropped or put away, never seated',
    fn() {
      const { all } = walk();
      const states = new Map();
      for (const a of all) if (a.model === 'r7' && a.carry === 'ready' && a.pool.join('') === '++' && !a.ground && a.dump && a.room) states.set(absKey(a), a);
      let rows = 0, same = 0;
      const diffs = [], improved = [];
      for (const a of states.values()) for (const id of legacyMacros(a).filter(x => x.startsWith('reload:'))) {
        rows++;
        const old = legacySubs(id, a).join(','), p = plan(a, GOAL_OF[id.slice(7)], { look: false }), mine = p.path?.join(',') ?? `NONE ${p.none}`;
        if (old === mine) { same++; continue; }
        (a.hand === '0' ? improved : diffs).push(`${id} at ${absKey(a)}: v0.0.17 ${old} | now ${mine}`);
      }
      const handZero = [...states.values()].filter(a => a.hand === '0' && legacyMacros(a).some(x => x.startsWith('reload:')) && legacyMacros(a).filter(x => x.startsWith('reload:')).some(id => legacySubs(id, a).includes('seat'))).length;
      console.log(`      ${states.size} R-7 beliefs ready with two full spares: ${rows} reload rows, ${same} the same path, ${improved.length} improved (an empty in the hand, ${handZero} such beliefs), ${diffs.length} other`);
      if (improved.length) console.log(`      e.g. ${improved[0]}`);
      assert(!diffs.length, JSON.stringify(diffs.slice(0, 6)));
      assert(improved.length > 0 && improved.every(x => !/now (seat|magOut:\w+,seat)/.test(x)), JSON.stringify(improved.slice(0, 4)));
    },
  },
  {
    name: 'the memo changes nothing: every plan of the walk is the same asked cold, one by one, as asked from the memo',
    fn() {
      const { crossed } = walk();
      const goals = ['fire', 'fed', 'retain', 'topup'], warm = new Map();
      clearPlans();
      // (a slice that fits the memo (PLAN_MEMO_MAX): asked twice, the second from the memo)
      const some = crossed.filter((_, i) => i % 12 === 0);
      for (const a of some) for (const goal of goals) warm.set(`${goal}|${absKey(a)}`, JSON.stringify(plan(a, goal)));
      for (const a of some) for (const goal of goals) plan(a, goal);
      const hits = planStats().hits;
      let diff = 0, n = 0;
      for (const a of some) for (const goal of goals) { clearPlans(); n++; if (JSON.stringify(plan(a, goal)) !== warm.get(`${goal}|${absKey(a)}`)) diff++; }
      console.log(`      ${warm.size} plans from the memo (${hits} hits on the second pass), ${n} asked cold: ${diff} differ`);
      assert(diff === 0 && hits >= warm.size, JSON.stringify({ diff, hits, size: warm.size }));
    },
  },
];
