// OLYMPUS tests: the P-12's dead-end walk, in the hand and in the holster (the user's rule, never a dead end; the build sheet 0.0.18 §5.1 test 18).
//
// The planner's walk (plan.js reachable) on the P-12 alone, from Conditions 1, 3 and 4 in the hand and in the holster, every
// action of the hands at a pass, a miss and a disaster and every pull, each belief crossed with the thigh pouch's states (none,
// an empty, a few, two full): every one offers a way to fire (in the holster the draw first, the house's Transition), or says
// honestly there is none.
import { assert } from './helpers.mjs';
import { absKey, plan, honestNone, reachable, clearPlans } from '../src/sim/arms/plan.js';

const BASE = { model: 'p12', lk: false, st: null, mode: 'safe', ck: true, hand: null, pool: Object.freeze(['+']), ground: null, dump: true, room: true };
const SEEDS = ['hand', 'holster'].flatMap(carry => [{ mag: 'in', n: '+', ch: 'live' }, { mag: 'in', n: '+', ch: 'empty' }, { mag: 'out', n: null, ch: 'empty' }].map(c => Object.freeze({ ...BASE, carry, ...c })));
const THIGH = Object.freeze({ none: [], empty: ['0'], 'a few': ['+'], full: ['+', '+'] });

export default [
  {
    name: 'every believed state of the P-12, in the hand and in the holster, with every thigh pouch state (none, empty, a few, full), offers a way to fire (Fix, Transition or RELOAD) or says honestly there is none',
    fn() {
      const t0 = performance.now(), all = reachable(SEEDS, { models: ['p12'] }), seen = new Map();
      // (each belief in the hand holstered as it is too: Rifle up's holster puts it away in whatever state it had)
      for (const a0 of all) for (const carry of ['hand', 'holster']) { const a = { ...a0, carry }, k = absKey({ ...a, pool: [], ground: null }); if (!seen.has(k)) seen.set(k, a); }
      clearPlans();
      let ways = 0, none = 0;
      const dead = [], first = {}, by = {};
      for (const a of seen.values()) for (const [name, pool] of Object.entries(THIGH)) {
        const x = Object.freeze({ ...a, pool: Object.freeze(pool), ground: null }), p = plan(x, 'fire');
        if (p.path) { ways++; const f = p.path[0] ?? '(ready)'; first[f] = (first[f] ?? 0) + 1; by[x.carry] = (by[x.carry] ?? 0) + 1; }
        else if (p.none === 'no rounds' && honestNone(x)) none++;
        else dead.push(`${absKey(x)} (${name}) → ${p.none}`);
        if (x.carry === 'holster' && p.path?.length && p.path[0] !== 'draw:thigh') dead.push(`${absKey(x)}: not drawn first (${p.path.join(',')})`);
      }
      console.log(`      ${all.length} states reached, ${seen.size} beliefs (hand ${[...seen.values()].filter(a => a.carry === 'hand').length}, holster ${[...seen.values()].filter(a => a.carry === 'holster').length}) × ${Object.keys(THIGH).length} thigh pouch states in ${(performance.now() - t0).toFixed(0)} ms`);
      console.log(`      a way ${ways} (in the hand ${by.hand ?? 0}, holstered ${by.holster ?? 0}), honestly none ${none}, dead ends ${dead.length}; first steps ${Object.entries(first).sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k} ${n}`).join(', ')}`);
      assert(!dead.length, JSON.stringify(dead.slice(0, 6)));
    },
  },
];
