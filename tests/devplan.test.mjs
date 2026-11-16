// OLYMPUS tests: the planner over devices (src/sim/arms/devplan.js; kit2 §2.2, §6 tests 1 to 7; the build sheet 0.0.19 §3.1, §0 item 21): every state the hands reach has its way, a live grenade only its throw, an armed one never thrown to free the hands, the fuse as believed, guard 0 in plan.js, the cook that never bursts in the hand, the names.
//
// Each case fails without the edge, the guard or the rule it names (said in its name). Quick: the walk is the abstraction's,
// under a second; the game cases are one shoot house on seed 48213.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assert, fmt, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { devReachable, devPlan, devKey, devPlanStats, clearDevPlans, devNameOf, devAbsOf, handsPath, stepDev, DEV_POPS, DEV_WORDS } from '../src/sim/arms/devplan.js';
import { DEVICES, COOK_FREEZE_MS, RELEASE_MS, cookOk, setSt, pouchedOf, fuseBelieved } from '../src/sim/arms/devices.js';
import { planFor } from '../src/sim/arms/plan.js';
import { deviceRows } from '../src/sim/combat/bundle.js';
import { gunOn } from '../src/sim/arms/shooting.js';
import { move } from '../src/sim/arms/kit.js';
import { playerId } from '../src/core/ids.js';
import { TEST_SHEETS } from '../src/sim/skills/templates.js';

const house = (loadout = 'mixed', tier = 'sgt') => createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go', loadout });
// (a device of a model taken from its pouch into the strong hand, the rifle let hang, in a state)
function inHand(g, model, st) {
  const s = g.state, pid = playerId(s), p = pouchedOf(s, pid, model);
  move(s, p.id, { pid, hand: 0 });
  setSt(s, p.id, st);
  s.people[pid].kit.carry.posture = 'slungFront';
  return p.id;
}
const seed = (o) => Object.freeze({ kind: 'grenade', model: 'g9p', st: 'armed', face: 'left', hand: 'strong', rifle: 'hang', cook: 0, at: 'stack', fd: 'none', mis: false, ...o });

export default [
  {
    name: 'every device state the hands can reach (the G-11, G-9P, G-13P, SC-1, BC-1, the halligan and the ram; the rifle ready, hanging or slung; every face; a misfire) has a plan to its goal and a plan to empty hands with the rifle up; each of the pin back in, unprime, recover and recock is on some plan (fails without them)',
    fn() {
      clearDevPlans();
      const all = devReachable(), bad = [], used = new Set();
      let worst = 0, worstKey = null;
      for (const a of all) for (const goal of ['clear', a.kind === 'grenade' ? 'thrown' : a.kind === 'charge' ? 'fired' : 'clear']) {
        const p = devPlan(a, goal);
        if (!p.path) { bad.push(`${devKey(a)} → ${goal}: ${p.none}`); continue; }
        p.path.forEach(x => used.add(x));
        if (p.costMs > worst) { worst = p.costMs; worstKey = `${devKey(a)} → ${goal}`; }
      }
      // (the D2 edges a misfire and a primed charge need, each from its own state)
      const prim = devPlan(seed({ kind: 'charge', model: 'bc1', st: 'primed', hand: null, rifle: 'ready', at: 'safe', fd: 'fitted' }), 'clear');
      const mis = devPlan(seed({ kind: 'charge', model: 'bc1', st: 'misfire', hand: null, rifle: 'ready', at: 'safe', fd: 'fitted', mis: true }), 'fired');
      const rec = devPlan(seed({ kind: 'charge', model: 'sc1', st: 'placed', hand: null, rifle: 'hang', at: 'latch', fd: 'none' }), 'placed');
      const st = devPlanStats(), models = [...new Set(all.map(a => a.model))];
      console.log(`      ${all.length} states (${models.join(', ')}), ${all.length * 2} plans: none ${bad.length}; the worst ${fmt(worst / 1000, 2)} s (${worstKey}); pops ${st.pops}, at most ${st.maxPops} a search (cap ${DEV_POPS}); memo ${st.size}`);
      console.log(`      acts on some plan: ${[...used].sort().join(', ')}; a misfire fired by ${mis.path?.join(' → ')}`);
      assert(!bad.length, bad.slice(0, 5).join(' | '));
      assert(st.maxPops < DEV_POPS, JSON.stringify(st));
      for (const x of ['gren:repin', 'gren:stow', 'gren:clear', 'tool:drop', 'charge:fire']) assert(used.has(x), `${x} on no plan`);
      assert(mis.path?.[0] === 'charge:recock' && prim.path && rec.path?.length === 0, JSON.stringify({ mis, prim, rec }));
      // (unprime and recover exist as steps from their states: the walk would leave a primed charge or a placed one with no way back)
      assert(stepDev(seed({ kind: 'charge', model: 'sc1', st: 'primed', hand: null, rifle: 'ready', at: 'safe', fd: 'fitted' }), 'charge:unprime')?.st === 'placed', 'unprime');
      assert(stepDev(seed({ kind: 'charge', model: 'sc1', st: 'placed', hand: null, rifle: 'hang', at: 'latch', fd: 'carried' }), 'charge:recover')?.st === 'held', 'recover');
    },
  },
  {
    name: 'a live grenade in the hand offers only Throw it and Throw it clear: never the rifle, the pouch or the pin (fails without guard D1)',
    fn() {
      const live = seed({ st: 'live', cook: 2000 }), pc = devPlan(live, 'clear'), pt = devPlan(live, 'thrown');
      const g = house('frag'), s = g.state, pid = playerId(s), id = inHand(g, 'g9p', 'live');
      const rows = deviceRows(s, pid, (rid, kind, label, ms, o = {}) => ({ id: rid, kind, label, ms, ...o })).map(r => r.id);
      const fire = planFor(s, pid, gunOn(s, pid), 'fire', { purpose: null });
      console.log(`      the plans: to clear ${pc.path.join(' → ')}, to thrown ${pt.path.join(' → ')}; the rows ${rows.join(', ')}; Fix's ${fire.path?.join(' → ')} (${fire.label})`);
      assert(pc.path.join() === 'gren:clear,up' && pt.path.join() === 'gren:throw', JSON.stringify({ pc, pt }));
      assert(rows.join() === 'dev:throw,dev:gren:clear', JSON.stringify(rows));
      assert(fire.path?.[0] === 'gren:clear' && fire.id === 'dev:gren:clear', JSON.stringify({ id, fire: fire.path, fid: fire.id }));
    },
  },
  {
    name: 'an armed grenade is never thrown to free the hands: with a G-9P armed, Fix is Pin back in, then the pouch (fails if "clear" may throw)',
    fn() {
      const a = seed({}), p = devPlan(a, 'clear');
      const g = house('frag'), s = g.state, pid = playerId(s);
      inHand(g, 'g9p', 'armed');
      const h = handsPath(s, pid);
      console.log(`      the abstraction: ${p.path.join(' → ')} (${fmt(p.costMs / 1000, 2)} s); in the house: ${h.path.join(' → ')}, ${fmt(h.ms / 1000, 2)} s at the sergeant's pace, "${h.label}" (${h.id})`);
      assert(p.path.join() === 'gren:repin,gren:stow,up' && !p.path.some(x => x === 'gren:throw' || x === 'gren:clear'), JSON.stringify(p));
      assert(h.path.join() === 'gren:repin,gren:stow' && h.id === 'dev:repin' && h.label === DEV_WORDS.repin, JSON.stringify(h));
    },
  },
  {
    name: 'the planner reads the fuse as believed: a G-9P\'s cook is planned against 4.0 s, never its drawn fuse (a Proxy on the item throws on fuseMs and fuseAtMs)',
    fn() {
      const g = house('frag'), s = g.state, pid = playerId(s), id = inHand(g, 'g9p', 'armed');
      const rec = s.items[id], drawn = rec.fuseMs;
      s.items[id] = new Proxy(rec, { get(t, k) { if (k === 'fuseMs' || k === 'fuseAtMs') throw new Error(`the planner read ${String(k)}`); return t[k]; } });
      clearDevPlans();
      const a = devAbsOf(s, pid, id), clear = devPlan(a, 'clear'), cook = stepDev(a, 'gren:cook:2'), h = handsPath(s, pid);
      s.items[id] = rec;
      console.log(`      drawn fuse ${drawn} ms (unread), believed ${fuseBelieved('g9p')} ms; a 2 s cook planned ${cook ? 'yes' : 'no'}, 3 s ${cookOk('g9p', 3000) ? 'yes' : 'no'}; the hands' way ${h.path.join(' → ')}`);
      assert(a && clear.path && cook?.cook === 2000 && !cookOk('g9p', 3000), JSON.stringify({ a, clear, cook }));
    },
  },
  {
    name: 'with a grenade armed in the hand, the gun\'s Fix and RELOAD begin with the hands\' way out (plan.js guard 0; without it Fix is the rifle\'s own with a full hand), a purpose\'s row keeps its own name and the hands run the gun\'s subs alone, and with the hands empty planFor is v0.0.18\'s',
    fn() {
      const g = house('frag'), s = g.state, pid = playerId(s), gun = gunOn(s, pid);
      const before = planFor(s, pid, gun, 'fire', { purpose: null });
      inHand(g, 'g9p', 'armed');
      const fix = planFor(s, pid, gun, 'fire', { purpose: null }), fed = planFor(s, pid, gun, 'fed', { purpose: 'speed' });
      // (the gun's own plan for RELOAD's purpose with the hands as they now are, named as v0.0.18 names it: guard 0 renames none of it)
      s.people[pid].kit.hands[0] = null;
      const fed0 = planFor(s, pid, gun, 'fed', { purpose: 'speed' });
      console.log(`      empty hands: ${JSON.stringify(before.path)} (${before.id}); a G-9P armed: Fix ${fix.path.join(' → ')} named ${fix.id} "${fix.label}", ${fmt(fix.ms / 1000, 2)} s; RELOAD's ${fed.path.join(' → ')} named ${fed.id}, its subs ${fed.subs.join(' → ')} (the gun's alone, as with no hands ${fed0.id})`);
      assert(fix.path.slice(0, 2).join() === 'gren:repin,gren:stow' && fix.id === 'dev:repin' && fix.hands?.path?.length === 2, JSON.stringify(fix));
      assert(fed.path[0] === 'gren:repin' && fed.id === fed0.id && fed.subs.join() === fed0.subs.join() && !fed.subs.some(x => /^gren:/.test(x)), JSON.stringify({ fed, fed0 }));
      assert(!before.hands, JSON.stringify(before));
    },
  },
  {
    name: 'a 2 s cook never bursts in the hand at any sheet or any grade of the count, the fuse at its 4.0 s least (the count late on a miss, a disaster\'s freeze, the throw\'s release after it)',
    fn() {
      const least = DEVICES.g9p.fuse[0], rows = [];
      for (const tier of Object.keys(TEST_SHEETS)) for (const grade of ['pass', 'miss', 'disaster']) {
        const count = grade === 'pass' ? 2000 * 1.05 : grade === 'miss' ? 2000 * 1.25 : 2000 * 1.25 + COOK_FREEZE_MS;
        rows.push({ tier, grade, leftHandMs: count + RELEASE_MS });
      }
      const worst = Math.max(...rows.map(r => r.leftHandMs));
      console.log(`      ${rows.length} cases: the grenade out of the hand at worst ${fmt(worst / 1000, 2)} s after the lever (a disaster: ×1.25 and ${COOK_FREEZE_MS} ms frozen, then the throw's ${RELEASE_MS} ms), against the least fuse ${fmt(least / 1000, 2)} s: margin ${fmt((least - worst) / 1000, 2)} s`);
      assert(worst < least, JSON.stringify({ worst, least }));
    },
  },
  {
    name: 'the names follow the path: Flash it, Frag it, Cook 2, frag it, Concuss it, Throw it, Throw it clear, Pin back in, Pin in, pouch, rifle up, Prime again, Unprime, the breach rows D1\'s ids',
    fn() {
      const T = [
        [['hang', 'gren:reach', 'gren:pin', 'gren:throw'], 'g11', 'thrown', 'drill:door:flash', 'Flash it'],
        [['hang', 'gren:reach', 'gren:pin', 'gren:throw'], 'g9p', 'thrown', 'drill:door:frag', 'Frag it'],
        [['hang', 'gren:reach', 'gren:pin', 'gren:cook:2', 'gren:throw'], 'g9p', 'thrown', 'drill:door:frag', 'Cook 2, frag it'],
        [['hang', 'gren:reach', 'gren:pin', 'gren:throw'], 'g13p', 'thrown', 'drill:door:conc', 'Concuss it'],
        [['gren:throw'], 'g9p', 'thrown', 'dev:throw', 'Throw it'],
        [['gren:clear', 'up'], 'g9p', 'clear', 'dev:gren:clear', 'Throw it clear'],
        [['gren:repin'], 'g11', 'clear', 'dev:repin', 'Pin back in'],
        [['gren:repin', 'gren:stow', 'up'], 'g9p', 'clear', 'dev:repin', 'Pin in, pouch, rifle up'],
        [['charge:recock', 'charge:fire'], 'bc1', 'fired', 'dev:charge:recock', 'Prime again'],
        [['charge:unprime'], 'sc1', 'clear', 'dev:charge:unprime', 'Unprime'],
        [['hang', 'charge:reach', 'move:latch', 'charge:place'], 'sc1', 'placed', 'drill:door:breach', 'Breach (explosive)'],
      ];
      const bad = [];
      for (const [path, model, goal, id, label] of T) { const n = devNameOf(path, model, goal); console.log(`      ${model} ${goal} ${path.join(' → ')}: ${n.id} "${n.label}"`); if (n.id !== id || n.label !== label) bad.push({ path, got: n, want: { id, label } }); }
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'devplan.js imports nothing from src/sim/combat but roll.js (the build sheet 0.0.19 §0 item 21: plan.js imports it through guard 0, so a combat import would close a cycle through bundle.js)',
    fn() {
      const src = readFileSync(path.join(root, 'src/sim/arms/devplan.js'), 'utf8');
      const imps = [...src.matchAll(/^import .* from '([^']+)';$/gm)].map(m => m[1]);
      const combat = imps.filter(p => p.includes('/combat/'));
      console.log(`      imports: ${imps.join(', ')}`);
      assert(combat.every(p => p.endsWith('/combat/roll.js')), JSON.stringify(combat));
    },
  },
];
