// OLYMPUS tests: what the stage may know of the Wreck before it is seen, F137's sim half (the build sheet v0.0.25 item 9, §6 A, §8; src/sim/places/known.js; the user, 2026-11-19, of H2: "we shouldn't know what's behind closed doors or walls without looking").
//
// The Wreck's scene names `familiar: 'walls'` (the lane's, C's: its plan briefed, every compartment black until seen). Under that
// rule src/sim/places/known.js familiarOf is false on the scene's host area and true elsewhere, and footprintOf gives { rect (the
// area's bounds), fixed: [], walls (every wall run's rect) }. The view's half (src/render/known.js begin marking footprint.walls with
// WALL_CELLS, D's) is emulated here by handing the walls to begin as `fixed` parts, which begin marks with the same WALL_CELLS ring:
// at the start every wall cell is known and no compartment's floor is; a cell in sight is known from then on; from deck 5's passage
// nothing of deck 6 is ever in sight (perception's visibility, the fog's own function, is 0 at every cell of the other deck), nor the
// other way after the trunk; and every shipped scene's familiarity and footprint are what they were (no `walls` key off the Wreck).
// The scene is not this role's, so the rule is passed in (sceneFamiliar's shape); the scene-borne rule is checked by C's suites.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { wreckWorld, atTrunk } from './wreck-world.mjs';
import * as KNOWN from '../src/sim/places/known.js';
import { createKnown, WALL_CELLS } from '../src/render/known.js';
import { planOf, wallsOf, wallRect } from '../src/sim/places/plan.js';
import { crossHatch } from '../src/sim/places/hatch.js';
import { eyeOf, visibility } from '../src/sim/people/perception.js';
import { WRECK, WRECK_ID, WRECK_DECKS, WRECK_TRUNK } from '../src/data/places/wreck.js';

const CELL_M = 0.25;
/** The Wreck's scene's rule (C's spec: familiar 'walls' on its host area). */
const RULE = Object.freeze({ familiar: 'walls', area: WRECK_ID });
const fmt = (o) => JSON.stringify(o);
// (the view's begin with the walls marked as D's hunk marks them: footprint.walls, WALL_CELLS each)
const beginWalls = (K, s) => K.begin(s, WRECK, () => { const fp = KNOWN.footprintOf(s, RULE); return { familiar: KNOWN.familiarOf(s, WRECK_ID, RULE), footprint: { ...fp, fixed: [...fp.fixed, ...fp.walls] }, rooms: [] }; });
// (cells by kind: a wall cell, its centre inside a wall run's rect; a floor cell, its centre in a room and more than WALL_CELLS + 1 cells off every wall rect)
function cellKinds(K) {
  const m = K.mask, [nx, nz] = K.size, walls = wallsOf(planOf(WRECK)).map(wallRect), out = { wall: 0, wallKnown: 0, floor: 0, floorKnown: 0, byDeck: { 5: 0, 6: 0 } };
  const off = (WALL_CELLS + 1) * CELL_M;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = m.x0 + (i + 0.5) * CELL_M, z = m.z0 + (j + 0.5) * CELL_M;
    if (walls.some(r => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1)) { out.wall++; if (K.known(i, j)) out.wallKnown++; continue; }
    const room = WRECK.rooms.find(r => x > r.rect[0] && x < r.rect[2] && z > r.rect[1] && z < r.rect[3]);
    if (!room || walls.some(r => x > r.x0 - off && x < r.x1 + off && z > r.z0 - off && z < r.z1 + off)) continue;
    out.floor++; out.byDeck[room.deck]++;
    if (K.known(i, j)) out.floorKnown++;
  }
  return out;
}
// (the cells of a deck in sight from an eye: perception's visibility above 0, every 0.5 m over its rooms)
function inSight(s, eye, deck) {
  let n = 0, seen = 0;
  for (const r of WRECK.rooms.filter(q => q.deck === deck)) for (let x = r.rect[0] + 0.25; x < r.rect[2]; x += 0.5) for (let z = r.rect[1] + 0.25; z < r.rect[3]; z += 0.5) { n++; if (visibility(s, eye, x, z) > 0) seen++; }
  return { n, seen };
}

export default [
  {
    name: 'under \'walls\' the Wreck is unfamiliar and every other area familiar; its footprint is its bounds and every wall run, nothing fixed; with no rule, every area familiar as before (fails without the rule: the Wreck familiar, no walls)',
    fn() {
      const w = wreckWorld({ two: false }), s = w.s, fp = KNOWN.footprintOf(s, RULE), runs = wallsOf(planOf(WRECK));
      const fam = { wreck: KNOWN.familiarOf(s, WRECK_ID, RULE), wellA: KNOWN.familiarOf(s, 'phobos.void.well-a', RULE), wheel: KNOWN.familiarOf(s, 'melas.wheel.s4', RULE), none: KNOWN.familiarOf(s, WRECK_ID, null) };
      console.log(`      familiar: ${fmt(fam)}; footprint rect ${fmt(fp?.rect)}, fixed ${fp?.fixed.length}, walls ${fp?.walls.length} of ${runs.length} runs`);
      assert(fam.wreck === false && fam.wellA && fam.wheel && fam.none, fmt(fam));
      const b = WRECK.boundsM;
      assert(fp && fmt(fp.rect) === fmt([b.x0, b.z0, b.x1, b.z1]) && fp.fixed.length === 0 && fp.walls.length === runs.length, fmt(fp));
      // (the world is carried aboard from the house's fill, so its scene's own rule is the house's 'set': the Wreck familiar by it, no footprint off the lane)
      const own = KNOWN.sceneFamiliar(s);
      assert(KNOWN.footprintOf(s, null) === null && own?.familiar === 'set' && KNOWN.familiarOf(s, WRECK_ID), fmt({ own, fp: KNOWN.footprintOf(s, null) }));
    },
  },
  {
    name: 'at the start (the view\'s begin with the walls marked, WALL_CELLS each): every wall cell of both decks known, no compartment\'s floor; a cell in sight known from then on, and the mask stays a bit a cell',
    fn() {
      const w = wreckWorld({ two: false }), s = w.s, K = createKnown({ cellM: CELL_M });
      const active = beginWalls(K, s), c = cellKinds(K), [nx, nz] = K.size, m = K.mask;
      console.log(`      active ${active}: ${nx} × ${nz} cells (${(nx * nz).toLocaleString('en-GB')}), ${K.count} known at the start; walls ${c.wallKnown} of ${c.wall} known; floors ${c.floorKnown} of ${c.floor} known (deck 5 ${c.byDeck[5]}, deck 6 ${c.byDeck[6]}); the mask ${m.w} × ${m.h} = ${m.w * m.h} B`);
      assert(active && c.wall > 0 && c.wallKnown === c.wall && c.floor > 0 && c.floorKnown === 0, fmt({ active, c }));
      // (a cell seen: the fog's wanted sight over a box of one cell in cell 2's middle)
      const [x, z] = [4.6, 1.5], box = { x0: Math.floor(x / CELL_M) * CELL_M, z0: Math.floor(z / CELL_M) * CELL_M, nx: 1, nz: 1, cellM: CELL_M };
      const before = K.at(x, z), n = K.see(new Float32Array([1]), box), after = K.at(x, z);
      console.log(`      cell 2's middle (${x}, ${z}): known ${before} → ${after} (${n} cells with its ring)`);
      assert(!before && after && n === 9 && m.w * m.h <= Math.ceil(nx / 8) * nz, fmt({ before, after, n }));
    },
  },
  {
    name: 'from deck 5 nothing of deck 6 is ever in sight, and after the trunk nothing of deck 5 (perception\'s visibility 0 at every cell of the other deck); at the start the passage you stand in is in sight and no closed compartment is',
    fn() {
      const w = wreckWorld(), s = w.s;
      const eye5 = eyeOf(s, w.me()), d6 = inSight(s, eye5, 6), passage = (() => { let n = 0, k = 0; const r = WRECK.rooms.find(q => q.id === 'wk.d5.passage'); for (let x = r.rect[0] + 0.25; x < r.rect[2]; x += 0.5) { n++; if (visibility(s, eye5, x, 3.6) > 0) k++; } return { n, k }; })();
      const cells = WRECK.rooms.filter(q => q.deck === 5 && q.kind === 'cell').map(r => { let n = 0, k = 0; for (let x = r.rect[0] + 0.5; x < r.rect[2] - 0.25; x += 0.5) for (let z = r.rect[1] + 0.5; z < r.rect[3] - 0.25; z += 0.5) { n++; if (visibility(s, eye5, x, z) > 0) k++; } return k; });
      atTrunk(w);
      const r = crossHatch(s, null, WRECK_TRUNK.id, [w.pid, w.twoPid]);
      const eye6 = eyeOf(s, w.me()), d5 = inSight(s, eye6, 5), here = inSight(s, eye6, 6);
      console.log(`      from deck 5's passage: deck 6 ${d6.seen} of ${d6.n} points in sight; the passage ${passage.k} of ${passage.n}; the six closed cells ${cells.join(', ')}`);
      console.log(`      after the trunk (${r.ok ? 'crossed' : r.why}): deck 5 ${d5.seen} of ${d5.n}; deck 6 ${here.seen} of ${here.n} from the landing (${WRECK_DECKS[6].name})`);
      assert(d6.n > 200 && d6.seen === 0 && passage.k > 10 && cells.every(k => k === 0), fmt({ d6, passage, cells }));
      assert(r.ok && d5.n > 200 && d5.seen === 0 && here.seen > 0, fmt({ r, d5, here }));
    },
  },
  {
    name: 'every shipped scene\'s knowledge is what it was: the house as set familiar, the house drawn not (its footprint with no walls key), the void range and the barracks familiar with no footprint',
    fn() {
      const rows = [];
      for (const [scenario, opts] of [['test-shoothouse', {}], ['test-shoothouse', { draw: 'drawn' }], ['test-anchors', {}], ['barracks', {}]]) {
        const g = createGame({ scenario, seed: 48213, ...opts }), s = g.state, area = s.places.live.area, fp = KNOWN.footprintOf(s), fam = KNOWN.familiarOf(s, area);
        rows.push({ scenario: `${scenario}${opts.draw ? ` (${opts.draw})` : ''}`, area, rule: KNOWN.sceneFamiliar(s)?.familiar ?? null, fam, fp: fp ? Object.keys(fp).join('+') : null });
      }
      for (const r of rows) console.log(`      ${r.scenario}: ${r.area}, rule ${r.rule}, familiar ${r.fam}, footprint ${r.fp}`);
      const [set, drawn, anchors, barracks] = rows;
      assert(set.fam && set.fp === 'rect+fixed' && !drawn.fam && drawn.fp === 'rect+fixed' && anchors.fam && anchors.fp === null && barracks.fam && barracks.fp === null, fmt(rows));
    },
  },
];
