// OLYMPUS tests: the walk in named along #1's path (v0.0.23, its build sheet item 10, carried FH-1; COMBAT §25.10): the keys the instructor names below the corporal walk you through the door, never into the wall beside it.
//
// v0.0.22's walk-in words were the bearing from #1's stack to his point (cqb.js keysOf): "Q and Z" on room 1 of lane A, through by
// luck, "D and S" on room 2 and "Z" on room 3, both into the wall beside the doorway, which lies west of both stacks: the recruit who
// held them stood 0.16 m off room 2's stack from 77.8 s to the room's pass. From v0.0.23 the words follow #1's own path
// (walkWords(plan, at): walkLegs, legsWords, "Q to the door, S through it, then D"). Two holds:
//   - every room the house can draw (layouts A, B and C on 48213, 20 drawn houses on seeds 1 to 20, 10 eight-room houses on 101
//     to 110): the legs from the stack cross the door's plane exactly once, and the first leg, walked straight from the stack by its
//     key, meets no wall before its end (route.js clipped, the door open);
//   - in the drill's world (tests/drill-world.mjs, lane A at 1 G, the recruit's sheet), a reader of the words (tests/bots/reader.mjs
//     readKeys, READ_MS after each change) walks from each stack to #1's point within WALK_IN_MAX_S: before the plane the walk-in
//     words where he stands (the line as cqb-walk re-reads it on each leg), past it the bearing to the point (cqb-walk's "Keep
//     moving. {keys} to your point"). On v0.0.22's words rooms 2 and 3 are never reached (the first keys walk into the wall).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { drillWorld } from './drill-world.mjs';
import { readKeys, KEY_MOVE, READ_MS } from './bots/reader.mjs';
import { walkWords, walkLegs, keysOf } from '../src/sim/skills/instinct/cqb.js';
import { lanePlanOf, pastThreshold } from '../src/sim/combat/room.js';
import { clipped } from '../src/sim/combat/route.js';
import { setOpening } from '../src/sim/places/model.js';
import { leaveStop } from '../src/sim/arms/shooting.js';
import { moveTo } from '../src/sim/places/portals.js';

/** The reader's walk from a stack to #1's point, at most (s; FH-1: about 4.3 to 4.9 s measured on lane A at the recruit's walk). */
export const WALK_IN_MAX_S = 6;
/** #1's point reached within this (m; the flawless suites' POINT_AT_M). */
const POINT_AT_M = 0.35;
/** The first leg's straight walk may end this short of its end before it counts as a wall met (m). */
const WALL_SLACK_M = 0.05;

// (the houses: [name, createGame's fill, seed])
const HOUSES = [['A', {}, 48213], ['B', { layout: 'B' }, 48213], ['C', { layout: 'C' }, 48213],
  ...Array.from({ length: 20 }, (_, i) => [`drawn ${i + 1}`, { draw: 'drawn' }, i + 1]), ...Array.from({ length: 10 }, (_, i) => [`eight ${i + 101}`, { rooms: 'all' }, i + 101])];

export default [
  {
    name: 'the walk-in words on every room the house can draw cross the door once, and their first key walked straight from the stack meets no wall (v0.0.22\'s "D and S" at room 2 of lane A walked into the wall beside the doorway)',
    fn() {
      const bad = [], words = {};
      let rooms = 0;
      for (const [name, fill, seed] of HOUSES) {
        const g = createGame({ scenario: 'test-shoothouse', seed, tier: 'recruit', ...fill }), lp = lanePlanOf(g.state);
        for (const d of lp.order) {
          const P = lp.plans[d];
          if (!P?.door) continue;
          rooms++;
          const L = walkLegs(P, P.stack[0]), st = P.stack[0], v = KEY_MOVE[L[0]?.key] ?? [0, 0], to = [st[0] + v[0] * (L[0]?.m ?? 0), st[1] + v[1] * (L[0]?.m ?? 0)];
          const got = clipped(g.state, st, to, { open: [P.door] }), short = Math.hypot(got[0] - to[0], got[1] - to[1]);
          const w = walkWords(P).keys;
          words[w] = (words[w] ?? 0) + 1;
          if (name === 'A') console.log(`      lane A ${P.room ?? d}: "${w}" (legs ${L.map(l => `${l.key} ${l.m.toFixed(2)} m${l.past ? ' through' : ''}`).join(', ')})`);
          if (L.filter(l => l.past).length !== 1 || short > WALL_SLACK_M || readKeys(w)[0] !== L[0].key) bad.push({ name, d, legs: L.map(l => `${l.key}${l.m.toFixed(2)}${l.past ? '*' : ''}`).join(' '), short: +short.toFixed(2), w });
        }
      }
      console.log(`      ${rooms} rooms on ${HOUSES.length} houses, ${bad.length} whose words fail; the words: ${Object.entries(words).map(([w, n]) => `"${w}" ${n}`).join(', ')}`);
      assert(rooms >= 90 && !bad.length, JSON.stringify(bad.slice(0, 6)));
    },
  },
  {
    name: 'a reader of the walk-in words walks from each stack of lane A to #1\'s point within WALK_IN_MAX_S 6 s, the recruit at 1 G in the drill\'s world (v0.0.22: room 2 and room 3 never reached)',
    fn() {
      const out = [];
      for (const door of ['o:w4:r1', 'o:w4:r2', 'o:w4:r3']) {
        const w = drillWorld({ tier: 'recruit' }), { g, s } = w, P = w.lane.plans[door], pt = P.points[0];
        moveTo(s, w.me().id, { area: s.armoury.range.area, x: P.stack[0][0], z: P.stack[0][1], face: 'left' }, null, { why: 'test' });
        setOpening(s, door, 'open');
        if (s.stop) leaveStop(s, g.bus, 'scene');
        const t0 = s.clock.ms;
        let read = null, atS = null;
        for (let i = 0; i < 400 && atS === null; i++) {
          const me = w.me(), text = pastThreshold(P, me.x, me.z) ? keysOf(pt[0] - me.x, pt[1] - me.z) : walkWords(P, [me.x, me.z]).keys;
          if (text !== read?.text) read = { text, atMs: s.clock.ms, keys: readKeys(text) };
          if (Math.hypot(me.x - pt[0], me.z - pt[1]) <= POINT_AT_M) { atS = (s.clock.ms - t0) / 1000; break; }
          let mx = 0, mz = 0;
          if (s.clock.ms - read.atMs >= READ_MS) for (const k of read.keys) { mx += KEY_MOVE[k][0]; mz += KEY_MOVE[k][1]; }
          g.step(1, { mx, mz });
        }
        const me = w.me();
        out.push({ door, words: walkWords(P).keys, atS, at: [+me.x.toFixed(2), +me.z.toFixed(2)] });
        console.log(`      ${door}: "${walkWords(P).keys}", the point ${atS === null ? `never reached (stood at ${me.x.toFixed(2)}, ${me.z.toFixed(2)})` : `reached in ${atS.toFixed(2)} s`}`);
      }
      assert(out.every(o => o.atS !== null && o.atS <= WALK_IN_MAX_S), JSON.stringify(out));
    },
  },
];
