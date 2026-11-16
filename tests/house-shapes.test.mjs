// OLYMPUS tests: the drawn house's catalogue and draw, and the goldens that pin them (the build sheet v0.0.21 §1 items 1 and 18, §6; house lens H2, H9).
//
// SHAPES (scenes/assemble.js shapesOf) is every order of the three rooms with each one's side that has a placement under the
// layout rules: 36 of 48 without mirrors, 8,005 placements, layout A's shape (Cn.Ks.En) among them with 542 (the house lens's
// stage-1 figures, its draw2.mjs with the mirrors' loop to 1: the cross-check's §15 item 10). The draw over 10,000 seeds never
// falls back (its depth-first search finds a fit for every shape drawn: it was enumerated as fitting) and every layout keeps every
// rule; seeds 1 to 100 give at least 90 distinct layouts (95 on the lens's dice; the game's rng streams give their own). The
// goldens: X4_CHUNK_PLANS (the chunks as data, their families' plans and their stands' places), SHAPES (the catalogue) and
// HOUSE_DRAWS (the whole codes of seeds 1 to 100, so the draw is pinned and a change of rule is said), with the set's four printed
// beside, unchanged (places-validate's WHEEL_S4, HOUSE1 and the C0 grid, room's X4_PLANS). This is house-shapes, not
// house-catalogue (that file is v0.0.14's catalogue of the panel's rows, R4's).
import { assert, fmt } from './helpers.mjs';
import { golden, goldenDigest } from './golden.mjs';
import { X4_CHUNKS } from '../src/data/chunks/x4.js';
import { WHEEL_S4, HOUSE1 } from '../src/data/places/wheel.js';
import { X4_PLANS } from '../src/data/places/x4-plans.js';
import { buildGrid } from '../src/sim/places/nav.js';
import { shapesOf, shapeName, drawHouse, drawnCodeOf, parseHouse, layoutOk } from '../src/sim/scenes/assemble.js';

/** The draw's seeds (the sheet's §6: 10,000) and the floor on distinct layouts in seeds 1 to 100. */
const DRAW_N = 10_000, DISTINCT_MIN = 90;

export default [
  {
    name: 'SHAPES: 36 shapes of 48 (no mirrors), 8,005 placements, layout A\'s Cn.Ks.En among them with 542; pinned by a golden',
    fn() {
      const t0 = performance.now(), S = shapesOf(), ms = performance.now() - t0, n = S.reduce((a, s) => a + s.n, 0), A = S.find(s => shapeName(s) === 'Cn.Ks.En');
      const h = golden('house: SHAPES', S.map(s => [shapeName(s), s.n]), '09b1bf7d12d216')   // (v0.0.21, set on purpose: stage 1's catalogue, no mirrors);
      console.log(`      ${S.length} shapes, ${n} placements, enumerated in ${fmt(ms, 0)} ms (once a process: 0 if an earlier case of the file drew); A's ${A?.n ?? 'missing'}; golden ${h}`);
      console.log(`      ${S.map(s => `${shapeName(s)} ${s.n}`).join(', ')}`);
      assert(S.length === 36 && n === 8005 && A?.n === 542, JSON.stringify({ shapes: S.length, n, A: A?.n }));
    },
  },
  {
    name: `the draw over ${DRAW_N} seeds: no fallback, every layout keeping every rule; seeds 1 to 100 at least ${DISTINCT_MIN} distinct layouts; HOUSE_DRAWS (the whole codes of seeds 1 to 100) and X4_CHUNK_PLANS pinned by goldens, the set's four beside them unchanged`,
    fn() {
      let worst = 0, off = 0, failed = 0;
      const t0 = performance.now(), byShape = new Map();
      for (let seed = 1; seed <= DRAW_N; seed++) {
        const t = performance.now();
        let L = null;
        try { L = drawHouse(seed); } catch { failed++; continue; }
        worst = Math.max(worst, performance.now() - t);
        const H = parseHouse(L);
        if (!H || !layoutOk(H.rooms)) off++;
        const k = H.rooms.map(r => `${r.letter}${r.side}`).join('.');
        byShape.set(k, (byShape.get(k) ?? 0) + 1);
      }
      const ms = performance.now() - t0, draws = Array.from({ length: 100 }, (_, i) => drawnCodeOf(i + 1)), layouts = new Set(draws.map(c => c.split('|')[0]));
      const swings = draws.flatMap(c => parseHouse(c).rooms.map(r => r.how)), states = draws.flatMap(c => parseHouse(c).rooms.map(r => r.state));
      const count = (xs) => Object.entries(xs.reduce((m, x) => ({ ...m, [x]: (m[x] ?? 0) + 1 }), {})).map(([k, v]) => `${k} ${v}`).join(', ');
      const hd = golden('house: HOUSE_DRAWS', draws, '1d1aa8d574ac36')   // (v0.0.21, set on purpose: seeds 1 to 100 drawn);
      const hc = golden('house: X4_CHUNK_PLANS', X4_CHUNKS, '08d77f5cb5eb82')   // (v0.0.21, set on purpose: the chunks with their families' plans and places);
      const set = { WHEEL_S4: goldenDigest(WHEEL_S4), HOUSE1: goldenDigest(HOUSE1), grid: goldenDigest(buildGrid(WHEEL_S4, 'C0', { closed: (o) => o.state === 'closed' }).cost), X4_PLANS: goldenDigest(X4_PLANS) };
      const setOk = set.WHEEL_S4 === '05f066607e544d' && set.HOUSE1 === '04447e988e6958' && set.grid === '1dd12b42226e54' && set.X4_PLANS === '1aed1872708ea3';
      console.log(`      ${DRAW_N} seeds drawn in ${fmt(ms, 0)} ms, the worst search ${fmt(worst, 2)} ms; ${failed} fell back, ${off} off a rule; ${byShape.size} shapes met`);
      console.log(`      seeds 1 to 100: ${layouts.size} distinct layouts; doors ${count(swings)}; ${count(states)}; 48213 ${drawnCodeOf(48213)}`);
      console.log(`      HOUSE_DRAWS ${hd}, X4_CHUNK_PLANS ${hc}; the set's: WHEEL_S4 ${set.WHEEL_S4}, HOUSE1 ${set.HOUSE1}, the C0 grid ${set.grid}, X4_PLANS ${set.X4_PLANS} (${setOk ? 'unchanged' : 'MOVED'})`);
      assert(!failed && !off && layouts.size >= DISTINCT_MIN && setOk, JSON.stringify({ failed, off, distinct: layouts.size, set }));
    },
  },
];
