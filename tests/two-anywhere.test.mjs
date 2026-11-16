// OLYMPUS tests: your number two off the range session (the build sheet v0.0.21 §1 item 21, §6 D; the done lens's J3; F72's team half).
//
// src/sim/combat/two.js (v0.0.21's stage 0 moved him there from the house's scenario) is driven off the range by the operation's
// record (combat/op.js openOp's state.cqb: his record `two`, the legs, the turners) through op.js's off-lane host ('cqb', which
// two.js registers: the legs' plans, the turners' hit sensor opShot), and by the operation's layers (two.js opActors, opRules),
// which a scene that opens an operation adds (tests/cqb-world.mjs's world). Before v0.0.21 nothing drove him off the range: with
// the session gone his body stood where it was (the done lens's offlane18.mjs, 0.00 m) and his eyes read no turner. Each case
// fails without its fix: opActors and opRules are v0.0.21's.
import { assert } from './helpers.mjs';
import { opLane } from './flawless-op.mjs';
import { TWO_CUE_MS } from './flawless.mjs';
import { cqbWorld } from './cqb-world.mjs';
import { hostOf, NULL_HOST } from '../src/sim/combat/op.js';
import { createGame } from './game.mjs';

const lags = (l) => Object.entries(l.watch.entry).map(([door, E]) => ({ door, lagMs: E.inMs === null ? null : E.inMs - E.cueMs, out: E.out, cued: E.cueMs !== null }));

export default [
  {
    name: 'off the range your number two goes in on his cue, within F25\'s 3 s in every room and never out, and takes his own men (F9), on every T sheet on the user\'s seed',
    fn() {
      const bad = [];
      for (const tier of ['cpl', 'sgt', 'raider', 'tierone']) {
        const l = opLane({ tier, seed: 1489397426 }), L = lags(l), eng = l.engaged.filter(e => e.by !== null);
        const wrong = eng.filter(e => !(e.by === (e.owner === 1 ? 'me' : 'two') || (e.by === 'two' && e.covered)));
        console.log(`      ${tier.padEnd(8)} ${l.done ? 'every leg clear' : 'NOT DONE'} in ${(l.ms / 1000).toFixed(2)} s; his entries ${L.map(x => `${x.door.slice(-2)} ${x.out ? 'OUT' : x.lagMs === null ? 'not in' : `${(x.lagMs / 1000).toFixed(2)} s`}`).join(', ')}; men taken ${eng.map(e => `${e.stand} (his ${e.owner === 2 ? 'two' : 'me'}) by ${e.by}${e.covered ? ', covered' : ''}`).join('; ')}; his rounds ${l.watch.lines.shots}`);
        if (!l.done || L.filter(x => x.cued).length < 3 || L.some(x => x.out || x.lagMs === null || x.lagMs > TWO_CUE_MS) || wrong.length || !eng.some(e => e.by === 'two')) bad.push({ tier, legs: l.legs, L, wrong, err: l.err });
      }
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'alone off the range (no number two in the operation\'s team) the drill clears every room with nobody to wait on',
    fn() {
      const l = opLane({ tier: 'sgt', seed: 48213, two: false });
      console.log(`      the sergeant alone: ${l.done ? 'every leg clear' : 'NOT DONE'} in ${(l.ms / 1000).toFixed(2)} s [${l.legs.join(', ')}]; men taken ${l.engaged.filter(e => e.by).length} of ${l.engaged.length}, all by ${[...new Set(l.engaged.map(e => e.by).filter(Boolean))].join(', ')}; F1 ${l.watch.walls.over} over`);
      assert(l.done && l.engaged.every(e => e.by !== 'two') && l.watch.walls.over === 0, JSON.stringify({ legs: l.legs, engaged: l.engaged, err: l.err }));
    },
  },
  {
    name: 'his host: the house\'s on its lane, the operation\'s off the range (the record, the legs\' plans, the turners\' sensor), the null host with neither',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }), lane = hostOf(g.state);
      const w = cqbWorld({ tier: 'sgt' }), op = hostOf(w.s), L = w.s.cqb.rooms[0];
      delete w.s.cqb;
      const none = hostOf(w.s);
      console.log(`      the lane's host's record the house's: ${lane.houseOf(g.state) === g.state.armoury.range.house}; off the range the record ${op.houseOf(w.s) === undefined ? '-' : 'state.cqb'}, room 1's plan's door ${op.planOf(w.s, L)?.door ?? 'none'}, a sensor ${op.houseShot !== NULL_HOST.houseShot}; with neither the null host ${none === NULL_HOST}`);
      assert(lane.houseOf(g.state) === g.state.armoury.range.house, 'the lane is the house\'s');
      assert(op.planOf(w.s, L)?.door === 'o:w4:r1' && op.houseShot !== NULL_HOST.houseShot, 'off the range the operation\'s host');
      assert(none === NULL_HOST, 'nothing open: the null host');
    },
  },
];
