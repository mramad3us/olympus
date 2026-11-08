// places-move: the walker's collision (src/sim/places/collide.js, move.js), pinned on what the 0.0.2
// review found. A walker collides as its class's circle against the rects its grid was built from, so
// it stands off every wall face by its radius; a door closed on it, or a position inside a wall, puts
// it on the nearest free cell at once and never lets it walk through walls or off the grid (0.0.2 let a
// "loose" walker step anywhere: a door closed on the office doorway and 20 s east left the player at x
// 60.65, 12 m past the grid's edge); and the office's 0.9 m door passes a walk that misses its middle,
// through the door assist (0.0.2 stopped S from the hallway at x 37.55 dead, and wedged S+A from (39.0,
// 1.2) against the west jamb).
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { TEST_AREA } from '../src/data/places/testroom.js';
import { CLASSES, navOf, isFree, cellOf, buildGrid } from '../src/sim/places/nav.js';
import { setOpening } from '../src/sim/places/model.js';
import { standOk, overlaps, sweep } from '../src/sim/places/collide.js';
import { moveActor, settle, PLAYER_CLS, NUDGE_M } from '../src/sim/places/move.js';
import { WALK_MS } from './mars-gaits.mjs';
import { TICK_MS } from '../src/core/clock.js';

const R0 = CLASSES[PLAYER_CLS];
// (a game with the player put at a point, and the grid it walks)
function placed(x, z, face = 'down') {
  const g = createGame({ scenario: 'sandbox', seed: 1 });
  Object.assign(g.me(), { x, z, face });
  return g;
}
const where = (g) => ({ x: g.me().x, z: g.me().z });
const ok = (g) => { const grid = navOf(g.state, 'test.rooms', PLAYER_CLS), m = g.me(); return { onGrid: cellOf(grid, m.x, m.z) >= 0, free: isFree(grid, m.x, m.z), stand: standOk(grid, m.x, m.z) }; };

export default [
  {
    name: 'a door closed on the walker puts it on the nearest free cell, and 20 s pressing east along the wall ends in a free cell on the grid (0.0.2: x 60.65, off the grid)',
    fn() {
      const g = placed(37.85, 2.4);                                  // (in the office doorway)
      navOf(g.state, 'test.rooms', PLAYER_CLS);                      // (the grid built first, so the door re-marks it)
      const changed = setOpening(g.state, 'o:t1:office', 'closed');
      g.step(1);
      const out = where(g), first = ok(g);
      g.step(20 * 20, { mx: 1 });
      const end = where(g), last = ok(g), grid = navOf(g.state, 'test.rooms', PLAYER_CLS);
      console.log(`      the door closed on (37.85, 2.40): ${changed} cells re-marked; put at (${fmt(out.x, 3)}, ${fmt(out.z, 3)}) on the first tick; 20 s east: (${fmt(end.x, 3)}, ${fmt(end.z, 3)}), on the grid ${last.onGrid}, free ${last.free}; the grid ends at x ${fmt(grid.x0 + grid.nx * grid.cellM, 2)}`);
      assert(first.stand && first.free, JSON.stringify({ out, first }));
      assert(last.onGrid && last.free && last.stand, JSON.stringify({ end, last }));
      near(end.x, 48 - R0, 1e-3, 'stopped by the office\'s east wall at its radius:');
    },
  },
  {
    name: 'a walker placed inside a wall, or in the dark between rooms, is put out at once and never walks on inside it',
    fn() {
      const rows = [];
      // (on the bay's north wall line, pressing east: 0.0.2 walked 4.56 m along inside the wall)
      const a = placed(22.0, 2.4);
      a.step(80, { mx: 1 });
      rows.push(`on the bay's north wall at (22.00, 2.40), 4 s east: (${fmt(a.me().x, 3)}, ${fmt(a.me().z, 3)})`);
      assert(ok(a).stand && a.me().z > 2.48 + R0 - 1e-3, JSON.stringify({ at: where(a), ...ok(a) }));
      // (in the dark between the bay and the office, pressing south: 0.0.2 walked to z 21.74, off the area)
      const b = placed(34.0, 3.5);
      b.step(20 * 20, { mz: 1 });
      const grid = navOf(b.state, 'test.rooms', PLAYER_CLS);
      rows.push(`between the rooms at (34.00, 3.50), 20 s south: (${fmt(b.me().x, 3)}, ${fmt(b.me().z, 3)}), on the grid ${ok(b).onGrid} (it ends at z ${fmt(grid.z0 + grid.nz * grid.cellM, 2)})`);
      assert(ok(b).onGrid, JSON.stringify({ at: where(b), ...ok(b) }));
      // (far from any free cell, 6 m into the dark west of the bay: south never takes it farther, north brings it out)
      const c = placed(5.0, 8.0);
      c.step(20 * 20, { mz: 1 });
      const south = where(c);
      c.step(20 * 20, { mz: -1 });
      const north = where(c);
      rows.push(`6 m into the dark at (5.00, 8.00): 20 s south held it at z ${fmt(south.z, 3)}; 20 s north brought it to (${fmt(north.x, 3)}, ${fmt(north.z, 3)}), standing ${ok(c).stand}`);
      for (const r of rows) console.log(`      ${r}`);
      assert(south.z <= 8.0 && ok(c).stand && north.z <= 2.32 - R0 + 1e-3, JSON.stringify({ south, north, ...ok(c) }));
    },
  },
  {
    name: 'the office\'s 0.9 m door passes a walk that misses its middle: S from the hallway at x 37.55, N from the office at 37.6, and S+A from (39.0, 1.2) all end on the other side',
    fn() {
      const rows = [];
      const cases = [
        ['S from the hallway at x 37.55', 37.55, 1.2, { mz: 1 }, (p) => p.z > 3.0],
        ['S from the hallway at x 38.15', 38.15, 1.2, { mz: 1 }, (p) => p.z > 3.0],
        ['N from the office at x 37.60', 37.6, 4.0, { mz: -1 }, (p) => p.z < 1.8],
        ['S+A from (39.0, 1.2)', 39.0, 1.2, { mz: 1, mx: -1 }, (p) => p.z > 3.0],
        ['S+D from (36.8, 1.2)', 36.8, 1.2, { mz: 1, mx: 1 }, (p) => p.z > 3.0],
      ];
      for (const [label, x, z, inp, through] of cases) {
        const g = placed(x, z);
        g.step(5 * 20, inp);
        const p = where(g);
        rows.push(`${label}: (${fmt(p.x, 3)}, ${fmt(p.z, 3)}) after 5 s, ${through(p) ? 'through' : 'NOT through'}`);
        assert(through(p) && ok(g).stand, `${label}: ${JSON.stringify(p)}`);
      }
      // (pressing into a flat wall finds no way through: the assist never slides along it)
      const w = placed(33.0, 1.2);
      w.step(40, { mz: 1 });
      rows.push(`S into the hallway's south wall at x 33.00: (${fmt(w.me().x, 3)}, ${fmt(w.me().z, 3)}), the assist reaching ${NUDGE_M} m either way`);
      for (const r of rows) console.log(`      ${r}`);
      assert(w.me().x === 33.0 && Math.abs(w.me().z - (2.32 - R0)) < 1e-3, JSON.stringify(where(w)));
    },
  },
  {
    name: 'a walker stops at exactly its radius from every wall face and fixture, whatever the cells\' phase (0.0.2: 0.21 to 0.32 m from the faces)',
    fn() {
      // (face: where the wall's or the fixture's face lies; the walk toward it; the axis that stops)
      const faces = [
        ['the bay\'s west wall (inner, face x 20.08)', 22, 6, { mx: -1 }, 'x', 20.08 + R0],
        ['the bay\'s east wall (inner, face x 31.52)', 29, 3.6, { mx: 1 }, 'x', 31.52 - R0],
        ['the bay\'s north wall (inner, face z 2.48)', 24, 4, { mz: -1 }, 'z', 2.48 + R0],
        ['the bay\'s south wall (outer, face z 10.1)', 29, 6, { mz: 1 }, 'z', 10.1 - R0],
        ['the hallway\'s north wall (outer, face z 0)', 33, 1.2, { mz: -1 }, 'z', R0],
        ['the hallway\'s west wall (outer, face x 0)', 3, 1.2, { mx: -1 }, 'x', R0],
        ['the office\'s east wall (outer, face x 48)', 44, 6.5, { mx: 1 }, 'x', 48 - R0],
      ];
      const rows = [];
      for (const [label, x, z, inp, axis, want] of faces) {
        const g = placed(x, z);
        g.step(6 * 20, inp);
        const got = g.me()[axis];
        rows.push(`${label}: stopped at ${axis} ${fmt(got, 4)}, ${fmt(Math.abs(got - want) * 1000, 2)} mm from its radius`);
        near(got, want, 2e-4, `${label}:`);
      }
      // (a fixture: the desk in the bay, walked into from the east; its footprint's face from the grid's blockers)
      const g = placed(23.5, 3.0), grid = navOf(g.state, 'test.rooms', PLAYER_CLS);
      const desk = grid.blockers.find(b => b.tag === 'f:t1:desk:01');
      g.step(6 * 20, { mx: -1 });
      rows.push(`the bay's desk (face x ${fmt(desk.x1, 3)}): stopped at x ${fmt(g.me().x, 4)}`);
      for (const r of rows) console.log(`      ${r}`);
      near(g.me().x, desk.x1 + R0, 2e-4, 'the desk:');
    },
  },
  {
    name: 'collide.js: touching is clear, a sweep stops at the contact on a face and at a corner\'s half chord, and C2 stands off by 0.40 m',
    fn() {
      const grid = buildGrid(TEST_AREA, 'C0'), c2 = buildGrid(TEST_AREA, 'C2');
      // (the hallway's north wall: the outer rect z -0.3 to 0; a circle at z 0.27 touches it)
      assert(!overlaps(grid, 33, R0) && overlaps(grid, 33, R0 - 1e-4), 'touching is clear, 0.1 mm closer overlaps');
      const t = sweep(grid, 33, 1.2, 'z', -2);
      near(t, 1.2 - R0, 1e-12, 'a sweep north to the wall face:');
      // (the office door's west jamb ends at x 37.4, z 2.32 to 2.48: from (37.55, 1.5) south, the corner stops it at its half chord)
      const off = 37.55 - 37.4, chord = Math.sqrt(R0 * R0 - off * off), tc = sweep(grid, 37.55, 1.5, 'z', 2);
      near(tc, 2.32 - chord - 1.5, 1e-12, 'a sweep onto the jamb\'s corner:');
      const a = { x: 40, z: 6 };                                      // (an actor walked on the suited class's grid by hand)
      let walked = 0;
      for (let i = 0; i < 200; i++) walked += moveActor(a, 1, 0, WALK_MS, c2);
      console.log(`      a sweep north from z 1.2 stops after ${fmt(t, 4)} m; onto the jamb's corner ${fmt(off, 2)} m aside, after ${fmt(tc, 4)} m (half chord ${fmt(chord, 4)}); C2 walked ${fmt(walked, 3)} m east to x ${fmt(a.x, 4)} (face 48, radius 0.40)`);
      near(a.x, 48 - CLASSES.C2, 2e-4, 'C2 against the office\'s east wall:');
      // (settle is idempotent where the walker stands)
      assert(!settle(a, c2), 'a walker standing where it may is not moved');
      assert(Math.abs(walked - (48 - CLASSES.C2 - 40)) < 1e-3 && WALK_MS * TICK_MS / 1000 > 0, `walked ${walked}`);
    },
  },
];
