// OLYMPUS tests: the draw over X4's eight rooms, lazy, and the three-room draw untouched (the build sheet v0.0.22 item 14, §6 A; house lens G3, §0 item 3).
//
// Enumerating every fitting shape of three of the eight rooms takes about half a second (2,377 of 2,688), so the eight-room draw is
// lazy (scenes/assemble.js lazyOf): a candidate order and sides drawn uniformly on stream 'house:shape8', fitted by v0.0.21's seeded
// depth-first search, redrawn on a miss at most SHAPE_TRIES 8 times, then layout A's shape. Over 10,000 seeds: no fallback, every
// layout keeping every layout rule (assemble.js layoutOk), the tries' histogram and the worst seed's ms printed; seeds 1 to 100 give at
// least 95 distinct layouts and use every room; the three-room draw ('a') gives v0.0.21's HOUSE_DRAWS layouts to the code; and the
// whole codes of seeds 1 to 100 on 'all' are pinned (HOUSE_DRAWS8). It fails without the lazy draw (drawHouse on 'all' draws the
// three-room catalogue: three letters only).
import { assert, fmt } from './helpers.mjs';
import { golden } from './golden.mjs';
import { lazyOf, drawHouse, drawnCodeOf, parseHouse, layoutOk, ROOM_SETS, SHAPE_TRIES, castFair } from '../src/sim/scenes/assemble.js';

/** The draw's seeds, and the floor on distinct layouts in seeds 1 to 100 (the house lens measured 100). */
const DRAW_N = 10_000, DISTINCT_MIN = 95;

export default [
  {
    name: `the lazy draw over ${DRAW_N} seeds on all eight rooms: no fallback to layout A's shape, every layout keeping every rule; seeds 1 to 100 at least ${DISTINCT_MIN} distinct layouts using every room, every cast fair; the three-room draw v0.0.21's to the code; HOUSE_DRAWS8 pinned`,
    fn() {
      const t0 = performance.now(), hist = {};
      let worst = 0, fell = 0, off = 0;
      for (let seed = 1; seed <= DRAW_N; seed++) {
        const t = performance.now(), r = lazyOf(seed);
        worst = Math.max(worst, performance.now() - t);
        hist[r.tries] = (hist[r.tries] ?? 0) + 1;
        if (r.fell) fell++;
        if (!layoutOk(r.rooms)) off++;
      }
      const ms = performance.now() - t0, codes = Array.from({ length: 100 }, (_, i) => drawnCodeOf(i + 1, { rooms: 'all' })), H = codes.map(parseHouse);
      const layouts = new Set(codes.map(c => c.split('|')[0])), used = {}, unfair = H.filter(h => !castFair(h.rooms, h.faces, h.places).ok).length;
      for (const h of H) for (const R of h.rooms) used[R.letter] = (used[R.letter] ?? 0) + 1;
      // (the three rooms' draw: every layout part of seeds 1 to 100 the catalogue's (letters C, K and E only, as v0.0.21 drew them))
      const three = Array.from({ length: 100 }, (_, i) => drawHouse(i + 1)), threeOk = three.every(c => parseHouse(c).rooms.every(R => ROOM_SETS.a.includes(R.letter)));
      const h8 = golden('house: HOUSE_DRAWS8', codes, '1f9cbf02859d52')   // (v0.0.22, set on purpose: seeds 1 to 100 drawn from the eight rooms);
      console.log(`      ${DRAW_N} seeds in ${fmt(ms, 0)} ms (the worst ${fmt(worst, 2)} ms); tries ${JSON.stringify(hist)} (at most ${SHAPE_TRIES}); ${fell} fell to layout A's shape, ${off} off a rule`);
      console.log(`      seeds 1 to 100: ${layouts.size} distinct layouts, the rooms used ${JSON.stringify(used)}; ${unfair} casts unfair; 48213 ${drawnCodeOf(48213, { rooms: 'all' })}; the three rooms' draw on C, K and E alone ${threeOk}; HOUSE_DRAWS8 ${h8}`);
      assert(!fell && !off && layouts.size >= DISTINCT_MIN && Object.keys(used).length === ROOM_SETS.all.length && !unfair && threeOk, JSON.stringify({ fell, off, distinct: layouts.size, used, unfair, threeOk }));
    },
  },
];
