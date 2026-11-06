// Perception's sight, the one visibility primitive (PEOPLE §7.1, §7.2, §7.6; the 0.0.3 build sheet
// §2.2, §5.2), on scenes in the real Echo barracks (bay-2-1 and hall-2): walls and closed doors block,
// the dark shortens the reach to 10 + 42 × lightLevel, the cone and the awareness radius decide what
// is behind, racks do not block a standing eye and lockers do, clearLine is symmetric, and sightMask
// (what the fog draws) equals visibility at every cell. Prints the light at the spots, the reaches,
// the cells compared and the cost per call against the tick's budget.
import { assert, fmt, machine } from './helpers.mjs';
import { createGame } from './game.mjs';
import { areaOf, roomOf, openingState } from '../src/sim/places/model.js';
import { sightGridOf, SIGHT_CELL_M, SIGHT_REACH_M, SIGHT_EDGE_M, SIGHT_WINDOW_M } from '../src/sim/places/sight.js';
import { navOf, CLASSES } from '../src/sim/places/nav.js';
import { standOk } from '../src/sim/places/collide.js';
import { lightLevel } from '../src/sim/places/light.js';
import { footprintOf } from '../src/sim/places/fixtures.js';
import { eyeOf, visibility, sightOf, canSee, clearLine, sightMask, SIGHT_M, LIGHT_M, SEEN, ALWAYS_M, LAYER_BIT, REACH_SOFT_M } from '../src/sim/people/perception.js';
import { stream, range, int } from '../src/core/rng.js';
import { playerActor } from '../src/core/ids.js';
import { readFileSync } from 'node:fs';

// The page's fog mask, which sightMask fills: src/render/view.js FOG_CELLS of src/render/fog.js FOG_CELL_M.
// Both modules import three.js, which node cannot load, so the two constants are read from their sources here,
// and the timing below is the page's own call.
const PAGE_FOG = (() => {
  const src = f => readFileSync(new URL(`../src/render/${f}`, import.meta.url), 'utf8');
  const c = /FOG_CELLS = Object\.freeze\(\[(\d+), (\d+)\]\)/.exec(src('view.js')), m = /FOG_CELL_M = ([\d.]+);/.exec(src('fog.js'));
  assert(c && m, 'src/render/view.js FOG_CELLS or src/render/fog.js FOG_CELL_M is no longer declared as this test reads it');
  return { cells: [Number(c[1]), Number(c[2])], cellM: Number(m[1]) };
})();

const SEED = 48213;
const AREA = 'melas.echo.1';
const room = (id) => areaOf(AREA).rooms.find(r => r.id === id);
const fixture = (id) => areaOf(AREA).fixtures.find(f => f.id === id);
const centreOf = (r) => [(r.rect[0] + r.rect[2]) / 2, (r.rect[1] + r.rect[3]) / 2];
const viewer = (x, z, face, more = {}) => ({ id: 'aView', who: null, x, z, face, ...more });
const target = (x, z, more = {}) => ({ id: 'aTgt', who: null, x, z, ...more });
// (a barracks game at an hour, the player put at (x, z) facing face)
function scene(hour, x, z, face) {
  const g = createGame({ scenario: 'barracks', seed: SEED, hour });
  const me = playerActor(g.state);
  Object.assign(me, { x, z, face, $px: x, $pz: z });
  return g;
}
const doorAct = (id, to) => ({ act: 'door', args: { id, to } });
const pct = (list, q) => list[Math.min(list.length - 1, Math.floor(q * list.length))];
const put = (me, x, z, face) => Object.assign(me, { x, z, face, $px: x, $pz: z });
const cellBits = (grid, x, z) => grid.bits[Math.floor((z - grid.z0) / grid.cellM) * grid.nx + Math.floor((x - grid.x0) / grid.cellM)];

export default [
  {
    name: 'a target behind a wall is unseen; through bay-2-1\'s closed door unseen, through it open seen (PEOPLE §7.6: walls and closed leaves block every layer)',
    fn() {
      const door = areaOf(AREA).openings.find(o => o.id === 'o:e1:bay-2-1');
      const mid = (door.a + door.b) / 2;
      // (inside the bay 2.2 m north of the door facing it; outside in hall-2 1.0 m south of it)
      const g = scene(12, mid, door.at - 2.2, 'down');
      const s = g.state, me = playerActor(s), out = target(mid, door.at + 1.0);
      const shut = sightOf(s, me, out);
      g.step(1, { act: [doorAct(door.id, 'open')] });
      g.step(40);                                                     // (2 s: the leaf done moving)
      assert(openingState(s, door.id) === 'open', `the door action left ${door.id} ${openingState(s, door.id)}`);
      const open = sightOf(s, me, out);
      // (the wall to bay-2-2: from bay-2-1's east end facing east, a target 1.5 m into bay-2-2)
      const b1 = room('e1.bay-2-1'), wallX = b1.rect[2], z = 3.9;
      Object.assign(me, { x: wallX - 1.5, z, face: 'right' });
      const behindWall = sightOf(s, me, target(wallX + 1.5, z));
      const sameRoom = sightOf(s, me, target(wallX - 3.5, z, {}));
      assert(!shut.seen && shut.vis === 0, `through the closed door: ${JSON.stringify(shut)}`);
      assert(open.seen && open.vis >= SEEN, `through the open door: ${JSON.stringify(open)}`);
      assert(!behindWall.seen && behindWall.vis === 0, `through the wall: ${JSON.stringify(behindWall)}`);
      console.log(`      the bay door (${door.id}, x ${door.a} to ${door.b} at z ${door.at}): closed ${fmt(shut.vis, 2)}, open ${fmt(open.vis, 2)} from 3.2 m; through the wall at x ${wallX} from 3.0 m: ${fmt(behindWall.vis, 2)}`);
    },
  },
  {
    name: 'at 23:00 the reach is 10 + 42 × lightLevel: in hall-2 a target 12 m off in the dark unseen, one in a night light\'s core seen at 12 m; in the bay the fire watch under the red lamp seen from the bay\'s far end',
    fn() {
      const hall = room('e1.hall-2'), lamps = areaOf(AREA).look.lamps;
      const night = lamps.filter(L => L.kind === 'night' && L.room === 'e1.hall-2').sort((a, b) => b.x - a.x);
      assert(night.length >= 2, `night lights in hall-2: ${night.length}`);
      const L = night[1], zc = (hall.rect[1] + hall.rect[3]) / 2;
      // (the target in the lamp's pool where it comes nearest the hall's middle, clear of the wall's cells; the viewer 12 m west, facing east)
      const g = scene(23, L.x - 12, zc, 'right');
      const s = g.state, me = playerActor(s);
      const grid = sightGridOf(s, AREA, me.x, me.z), free = (x, z) => (cellBits(grid, x, z) & LAYER_BIT.stand) === 0;
      let inCore = null;
      for (let dz = 0; dz <= 1.2 && !inCore; dz += 0.05) for (const zz of [L.z + dz, L.z - dz]) {
        if (inCore || !free(L.x, zz) || !free(L.x - 12, zz)) continue;
        if (lightLevel(s, L.x, zz, s.clock.ms, AREA) >= 0.2) inCore = target(L.x, zz);
      }
      assert(inCore, `no spot of the night light at (${L.x}, ${L.z}) lit 0.2 or more inside the hall`);
      put(me, L.x - 12, inCore.z, 'right');
      // (and a dark spot 12 m east of some point of the hall: no pool reaches it)
      let darkFrom = null;
      for (let vx = hall.rect[0] + 0.5; vx + 12 < hall.rect[2] - 0.5 && darkFrom === null; vx += 0.25) if (lightLevel(s, vx + 12, zc, s.clock.ms, AREA) <= 0.06) darkFrom = vx;
      assert(darkFrom !== null, 'no dark spot in hall-2 at 23:00');
      const dark = target(darkFrom + 12, zc);
      const lCore = lightLevel(s, inCore.x, inCore.z, s.clock.ms, AREA), lDark = lightLevel(s, dark.x, dark.z, s.clock.ms, AREA);
      const dCore = Math.hypot(inCore.x - me.x, inCore.z - me.z), dDark = 12;
      const vCore = sightOf(s, me, inCore), vDark = sightOf(s, viewer(darkFrom, zc, 'right'), dark);
      assert(lDark <= 0.06 && !vDark.seen, `the dark at ${fmt(dDark)} m: light ${lDark}, ${JSON.stringify(vDark)}`);
      assert(vCore.seen, `the night light's core at ${fmt(dCore)} m: light ${lCore}, ${JSON.stringify(vCore)}`);
      // (the bay: the fire watch at the post under the red lamp, seen from the bay's west end)
      const fw = s.actors.list.find(a => a.posture === 'sit' && a.spotId?.includes('stool'));
      assert(fw, 'no fire watch at the post at 23:00');
      const b1 = room('e1.bay-2-1');
      Object.assign(me, { x: b1.rect[0] + 0.8, z: fw.z, face: 'right' });
      const red = lamps.find(l => l.kind === 'red');
      const lFw = lightLevel(s, fw.x, fw.z, s.clock.ms, AREA), vFw = sightOf(s, me, fw);
      assert(vFw.seen, `the fire watch from ${fmt(Math.hypot(fw.x - me.x, fw.z - me.z))} m: light ${lFw}, ${JSON.stringify(vFw)}`);
      console.log(`      hall-2 at 23:00: the dark ${lDark} (reach ${fmt(SIGHT_M + LIGHT_M * lDark)} m) at ${fmt(dDark)} m: ${fmt(vDark.vis, 2)}; a night light's core ${lCore} (reach ${fmt(SIGHT_M + LIGHT_M * lCore)} m) at ${fmt(dCore)} m: ${fmt(vCore.vis, 2)}`);
      console.log(`      bay-2-1 at 23:00: the fire watch at (${fw.x}, ${fw.z}) under the red lamp (${red.x}, ${red.z}): light ${lFw}, reach ${fmt(SIGHT_M + LIGHT_M * lFw)} m, seen from ${fmt(Math.hypot(fw.x - me.x, fw.z - me.z))} m at the west end: ${fmt(vFw.vis, 2)}`);
    },
  },
  {
    name: 'behind the viewer beyond the awareness radius unseen, within 1 m always seen; the racks do not block a standing eye but do a crouched one, the lockers block (the sheet §8, item 12); a sleeper behind a drawn curtain seen only within 1 m',
    fn() {
      const g = scene(12, 54.8, 3.95, 'right');
      const s = g.state, me = playerActor(s);
      const behind5 = sightOf(s, me, target(me.x - 5, me.z)), behind09 = sightOf(s, me, target(me.x - 0.9, me.z));
      const ahead5 = sightOf(s, me, target(me.x + 5, me.z));
      assert(!behind5.seen && behind09.seen && behind09.vis === 1 && ahead5.seen, JSON.stringify({ behind5, behind09, ahead5 }));
      // (across a rack along its middle: from the floor west of it to the floor east of it)
      const grid = sightGridOf(s, AREA, me.x, me.z);
      const rack = fixture('f:e1:bay-2-1:rack-n2'), fr = footprintOf(rack), zr = (fr.z0 + fr.z1) / 2;
      const P = [fr.x0 - 0.6, zr], Q = [fr.x1 + 0.6, zr];
      const rackStand = clearLine(grid, ...P, ...Q, 'stand'), rackCrouch = clearLine(grid, ...P, ...Q, 'crouch');
      const rackBits = cellBits(grid, rack.x, rack.z);
      // (along a locker pair's face: from one side of it to the other)
      const lk = fixture('f:e1:bay-2-1:locker-n1a'), lb = fixture('f:e1:bay-2-1:locker-n1b');
      const fa = footprintOf(lk), fb = footprintOf(lb), zl = (fa.z0 + fa.z1) / 2;
      const lockStand = clearLine(grid, Math.min(fa.x0, fb.x0) - 0.3, zl, Math.max(fa.x1, fb.x1) + 0.3, zl, 'stand');
      assert(rackStand && !rackCrouch && (rackBits & LAYER_BIT.stand) === 0, `the rack: stand ${rackStand}, crouch ${rackCrouch}, bits ${rackBits}`);
      assert(!lockStand && (cellBits(grid, lk.x, lk.z) & LAYER_BIT.stand) !== 0, `the lockers: stand ${lockStand}`);
      // (a curtained sleeper: unseen at 2 m in plain view, seen at 0.8 m)
      Object.assign(me, { x: 54.8, z: 3.95, face: 'up' });
      const far = sightOf(s, me, target(54.8, 2.0, { curtain: true })), near = sightOf(s, me, target(54.8, 3.2, { curtain: true }));
      const open = sightOf(s, me, target(54.8, 2.0));
      assert(!far.seen && near.seen && open.seen, JSON.stringify({ far, near, open }));
      const e = eyeOf(s, me);
      console.log(`      the player's eyes: cone ${fmt(e.coneRad * 360 / Math.PI, 0)}°, awareness ${fmt(e.awareM, 2)} m (soft to ${fmt(e.awareM + 0.75, 2)}), always within ${ALWAYS_M} m; behind at 5 m ${fmt(behind5.vis, 2)}, at 0.9 m ${fmt(behind09.vis, 2)}; ahead at 5 m ${fmt(ahead5.vis, 2)}`);
      console.log(`      across rack n2 (bits ${rackBits}): standing eye ${rackStand ? 'clear' : 'blocked'}, crouched ${rackCrouch ? 'clear' : 'blocked'}; along lockers n1a and n1b: ${lockStand ? 'clear' : 'blocked'}; a curtained sleeper at 1.95 m ${fmt(far.vis, 2)}, at 0.75 m ${fmt(near.vis, 2)}, uncurtained ${fmt(open.vis, 2)}`);
    },
  },
  {
    name: 'clearLine(a, b) = clearLine(b, a) for 10,000 random pairs on Echo\'s grid, every layer; a diagonal crack between two blocking cells blocks, one blocking corner does not',
    fn() {
      const g = scene(12, 54.8, 3.95, 'up');
      const s = g.state, grid = sightGridOf(s, AREA, 54.8, 3.95);
      const r = stream('test', 'clearLine');
      let asym = 0, clear = 0;
      const x0 = grid.x0, z0 = grid.z0, w = grid.nx * grid.cellM, h = grid.nz * grid.cellM;
      for (let k = 0; k < 10_000; k++) {
        const ax = x0 + range(r, 0, w), az = z0 + range(r, 0, h), bx = x0 + range(r, 0, w), bz = z0 + range(r, 0, h);
        const layer = ['stand', 'crouch', 'prone'][int(r, 3)];
        const ab = clearLine(grid, ax, az, bx, bz, layer), ba = clearLine(grid, bx, bz, ax, az, layer);
        if (ab !== ba) asym++;
        if (ab) clear++;
      }
      // (the crack: a 4 × 4 grid with two blocking cells set diagonally, (1, 2) and (2, 1))
      const tiny = { x0: 0, z0: 0, nx: 4, nz: 4, cellM: 0.5, bits: new Uint8Array(16) };
      tiny.bits[2 * 4 + 1] = 7; tiny.bits[1 * 4 + 2] = 7;
      const crack = clearLine(tiny, 0.25, 0.25, 1.75, 1.75, 'stand');        // (through the corner they share)
      tiny.bits[1 * 4 + 2] = 0;
      const corner = clearLine(tiny, 0.25, 0.25, 1.75, 1.75, 'stand');       // (past one blocking cell's corner)
      assert(asym === 0, `${asym} asymmetric pairs of 10,000`);
      assert(!crack && corner, `crack ${crack}, one corner ${corner}`);
      console.log(`      10,000 pairs on ${grid.nx} × ${grid.nz} cells: ${asym} asymmetric, ${clear} clear; the diagonal crack blocked, one corner clear`);
    },
  },
  {
    name: 'sightMask equals visibility at every cell on 50 scenes (bay-2-1 at 12:00 and 23:00, hall-2, the lobby, the street at noon and at night), with its cost per call against the tick\'s budget',
    fn() {
      const scenes = [];
      const r = stream('test', 'mask-scenes');
      const add = (label, hour, area, rect, n) => { for (let k = 0; k < n; k++) scenes.push({ label, hour, area, x: range(r, rect[0] + 0.4, rect[2] - 0.4), z: range(r, rect[1] + 0.4, rect[3] - 0.4), face: ['up', 'down', 'left', 'right'][int(r, 4)] }); };
      const b1 = room('e1.bay-2-1').rect, h2 = room('e1.hall-2').rect, lobby = room('e1.lobby')?.rect;
      add('bay 12:00', 12, AREA, b1, 10); add('bay 23:00', 23, AREA, b1, 10); add('hall 23:00', 23, AREA, h2, 8);
      if (lobby) add('lobby 12:00', 12, AREA, lobby, 6);
      const ground = areaOf('melas.ground');
      if (ground) { add('street noon', 12, 'melas.ground', [510, 216, 540, 232], 8); add('street night', 23, 'melas.ground', [510, 216, 540, 232], 8); }
      while (scenes.length < 50) add('bay 23:00', 23, AREA, b1, 1);
      let cells = 0, mismatches = 0, first = null;
      const maskMs = { in: [], out: [] }, visUs = [], byLabel = {};
      const games = new Map();
      for (const sc of scenes) {
        const key = `${sc.hour}`;
        let g = games.get(key);
        if (!g) { g = createGame({ scenario: 'barracks', seed: SEED, hour: sc.hour }); games.set(key, g); }
        const s = g.state;
        s.places.live = { site: 'melas', area: sc.area };
        const eye = eyeOf(s, viewer(sc.x, sc.z, sc.face));
        const [nx, nz] = PAGE_FOG.cells, cm = PAGE_FOG.cellM;                // (the page's own mask, centred as the view centres it)
        const mask = { x0: Math.floor((sc.x - nx * cm / 2) / cm) * cm, z0: Math.floor((sc.z - nz * cm / 2) / cm) * cm, nx, nz, cellM: cm, vis: new Float32Array(nx * nz) };
        sightMask(s, eye, mask);                                        // (warm)
        const runs = [];
        for (let k = 0; k < 3; k++) { const t0 = performance.now(); sightMask(s, eye, mask); runs.push(performance.now() - t0); }
        const dt = runs.sort((a, b) => a - b)[1];                       // (the median of three: the scheduler's hiccups out, the algorithm's cost in)
        (sc.area === AREA ? maskMs.in : maskMs.out).push(dt);
        (byLabel[sc.label] ??= []).push(dt);
        for (let j = 0; j < mask.nz; j++) for (let i = 0; i < mask.nx; i++) {
          const x = mask.x0 + (i + 0.5) * mask.cellM, z = mask.z0 + (j + 0.5) * mask.cellM;
          const v = Math.fround(visibility(s, eye, x, z));
          cells++;
          if (v !== mask.vis[j * mask.nx + i]) { mismatches++; first ??= { ...sc, x, z, v, m: mask.vis[j * mask.nx + i] }; }
        }
        // (visibility's cost: 2,000 calls at random cells of the scene's window, timed in batches of 200)
        for (let b = 0; b < 10; b++) {
          const pts = Array.from({ length: 200 }, () => [mask.x0 + range(r, 0, mask.nx * mask.cellM), mask.z0 + range(r, 0, mask.nz * mask.cellM)]);
          const t1 = performance.now();
          for (const [x, z] of pts) visibility(s, eye, x, z);
          visUs.push((performance.now() - t1) * 1000 / 200);
        }
      }
      for (const g of games.values()) g.state.places.live = { site: 'melas', area: AREA };
      maskMs.in.sort((a, b) => a - b); maskMs.out.sort((a, b) => a - b); visUs.sort((a, b) => a - b);
      const all = [...maskMs.in, ...maskMs.out].sort((a, b) => a - b);
      const labels = [...new Set(scenes.map(sc => sc.label))].map(l => `${l} ${scenes.filter(sc => sc.label === l).length}`).join(', ');
      console.log(`      ${scenes.length} scenes (${labels}): ${cells} cells compared, ${mismatches} mismatches`);
      console.log(`      visibility: ${fmt(pct(visUs, 0.5), 2)} µs a call p50, ${fmt(pct(visUs, 0.95), 2)} µs p95 (limit 5)`);
      console.log(`      by scene, the slowest: ${Object.entries(byLabel).map(([l, v]) => `${l} ${fmt(Math.max(...v), 2)} ms`).join(', ')}`);
      console.log(`      sightMask over the page's ${PAGE_FOG.cells[0]} × ${PAGE_FOG.cells[1]} cells of ${PAGE_FOG.cellM} m: indoors ${fmt(pct(maskMs.in, 0.5), 2)} ms p50, ${fmt(pct(maskMs.in, 0.95), 2)} ms p95${maskMs.out.length ? `; outdoors ${fmt(pct(maskMs.out, 0.5), 2)} ms p50, ${fmt(pct(maskMs.out, 0.95), 2)} ms p95` : '; outdoors: no ground area yet'} (limit 3; the fog recomputes on a 0.25 m move, a turn, a door, once a game second)`);
      // (CPU-time ceilings in the foreground's terms: this process may be in macOS's background band, helpers.mjs machine())
      const M = machine();
      console.log(`      the ceilings here: × ${fmt(M.k, 2)} (the reference loop in ${fmt(M.ms, 0)} ms, the foreground ${fmt(M.ms / M.k, 1)}); sightMask p95 in the foreground's terms ${fmt(pct(all, 0.95) / M.k, 2)} ms`);
      assert(mismatches === 0, `${mismatches} of ${cells} cells differ; the first ${JSON.stringify(first)}`);
      assert(pct(visUs, 0.95) <= 5 * M.k, `visibility p95 ${fmt(pct(visUs, 0.95), 2)} µs (limit 5 × ${fmt(M.k, 2)})`);
      assert(pct(all, 0.95) <= 3 * M.k, `sightMask p95 ${fmt(pct(all, 0.95), 2)} ms (limit 3 × ${fmt(M.k, 2)})`);
    },
  },
  {
    name: 'canSee is sightOf\'s seen, the fog\'s own function: from the aisle facing north at 12:40, those in the cone or within the awareness radius are seen, those behind and beyond it are not',
    fn() {
      const g = scene(12.67, 54.8, 3.95, 'up');
      const s = g.state, me = playerActor(s), e = eyeOf(s, me);
      const seen = [], unseen = [];
      let checked = 0;
      for (const a of s.actors.list) {
        if (a === me) continue;
        const so = sightOf(s, me, a);
        assert(canSee(s, me, a) === so.seen, `canSee and sightOf disagree on ${a.id}`);
        const d = Math.hypot(a.x - me.x, a.z - me.z), off = Math.abs(Math.atan2(a.z - me.z, a.x - me.x) + Math.PI / 2);
        const tag = `${s.people[a.who].name.family} ${fmt(d, 1)} m ${fmt(off * 180 / Math.PI, 0)}° ${fmt(so.vis, 2)}`;
        (so.seen ? seen : unseen).push(tag);
        if (d < e.awareM - 0.1) { assert(so.seen, `within the awareness radius but unseen: ${tag}`); checked++; }
        else if (d > e.awareM + 0.85 && off > e.coneRad + 0.15) { assert(!so.seen, `behind and beyond the radius but seen: ${tag}`); checked++; }
      }
      assert(seen.length >= 4 && unseen.length >= 2 && checked >= 4, JSON.stringify({ seen, unseen, checked }));
      console.log(`      seen: ${seen.join(', ')}`);
      console.log(`      unseen: ${unseen.join(', ')} (${checked} clear-cut cases checked against the cone of ${fmt(e.coneRad * 360 / Math.PI, 0)}° and the radius of ${fmt(e.awareM, 2)} m)`);
    },
  },
  {
    name: 'an eye pressed against a wall sees nothing behind it: slid into bay-2-2\'s west wall, no cell of bay-2-1 and none of the squad there is seen, nor is the eye seen from bay-2-1; no standing pair on floor 1 sees across a wall or a closed door (v0.0.3\'s review: the 0.5 m sight cell held the wall and the eye)',
    fn() {
      // (walk west from bay-2-2's middle until the wall stops the walker, at its clearance radius from the face)
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 12, at: { area: AREA, x: 62.5, z: 4.0, face: 'left' } });
      g.step(1);
      let x0;
      do { x0 = g.me().x; g.step(1, { mx: -1 }); } while (g.me().x < x0);
      const s = g.state, me = g.me(), eye = eyeOf(s, me), b1 = room('e1.bay-2-1'), wallX = b1.rect[2];
      const mask = sightMask(s, eye, { x0: 48, z0: 0, nx: 26, nz: 16, cellM: 0.5 });
      let litBehind = 0, cellsBehind = 0;
      for (let k = 0; k < mask.vis.length; k++) {
        const cx = 48 + (k % 26 + 0.5) * 0.5, cz = (Math.floor(k / 26) + 0.5) * 0.5;
        if (roomOf(AREA, cx, cz)?.id !== 'e1.bay-2-1') continue;
        cellsBehind++;
        if (mask.vis[k] > 0) litBehind++;
      }
      const squad = s.actors.list.filter(a => a !== me && roomOf(AREA, a.x, a.z)?.id === 'e1.bay-2-1');
      const seenThrough = squad.filter(a => visibility(s, eye, a.x, a.z) > 0);
      // (the far end: from inside bay-2-1, 2.5 m west of the wall facing it, the body pressed to the wall's far side)
      const back = sightOf(s, viewer(wallX - 2.5, me.z, 'right'), target(me.x, me.z));
      // (every standing spot on floor 1 against every spot 0.6 to 0.8 m off in another room, the segment through no open opening)
      const grid = navOf(s, AREA, 'C0'), area = areaOf(AREA), probe = viewer(0, 0, 'down');
      const throughOpen = (x, z, tx, tz) => area.openings.some(o => {
        if (openingState(s, o.id) !== 'open') return false;
        if (o.axis === 'x') { if ((z - o.at) * (tz - o.at) > 0) return false; const t = (o.at - z) / (tz - z || 1e-9), px = x + t * (tx - x); return px >= o.a - 0.3 && px <= o.b + 0.3; }
        if ((x - o.at) * (tx - o.at) > 0) return false; const t = (o.at - x) / (tx - x || 1e-9), pz = z + t * (tz - z); return pz >= o.a - 0.3 && pz <= o.b + 0.3;
      });
      let pairs = 0, across = 0, firstAcross = null;
      for (let x = 0.5; x < 83.5; x += 0.25) for (let z = 0.5; z < 23.5; z += 0.25) {
        if (!standOk(grid, x, z)) continue;
        const r1 = roomOf(AREA, x, z); if (!r1) continue;
        for (const [dx, dz] of [[0, 0.75], [0, 0.6], [0.6, 0], [0.75, 0], [0.25, 0.6], [0, -0.75], [-0.75, 0]]) {
          const tx = x + dx, tz = z + dz;
          if (!standOk(grid, tx, tz)) continue;
          const r2 = roomOf(AREA, tx, tz);
          if (!r2 || r2.id === r1.id || r2.zone === r1.zone || throughOpen(x, z, tx, tz)) continue;
          Object.assign(probe, { x, z, face: dz > 0 ? 'down' : dz < 0 ? 'up' : dx > 0 ? 'right' : 'left' });
          pairs++;
          if (visibility(s, eyeOf(s, probe), tx, tz) > 0) { across++; firstAcross ??= `${r1.id} (${x}, ${z}) to ${r2.id} (${tx}, ${tz})`; }
        }
      }
      console.log(`      the walker stopped at (${fmt(me.x, 3)}, ${fmt(me.z, 2)}), ${fmt(me.x - wallX, 3)} m east of the wall's line x ${wallX} (C0 ${CLASSES.C0} m; sight cells ${SIGHT_CELL_M} m): ${litBehind} of ${cellsBehind} cells of bay-2-1 lit, ${seenThrough.length} of ${squad.length} there above 0; from bay-2-1 at 2.5 m: ${fmt(back.vis, 2)}`);
      console.log(`      ${pairs} standing pairs 0.6 to 0.8 m apart across a wall or a closed door on floor 1: ${across} see each other${firstAcross ? ` (the first ${firstAcross})` : ''}`);
      assert(litBehind === 0 && seenThrough.length === 0, JSON.stringify({ at: [me.x, me.z], litBehind, seenThrough: seenThrough.map(a => a.id) }));
      assert(back.vis === 0, `seen from bay-2-1 through the wall: ${JSON.stringify(back)}`);
      assert(pairs > 300 && across === 0, JSON.stringify({ pairs, across, firstAcross }));
    },
  },
  {
    name: 'a ground\'s sight window holds everything sight reaches: one built 43 m west and kept as the eye walks to its edge gives the mask a fresh game gives there (v0.0.3\'s review: 919 cells differed with a 32 m edge)',
    fn() {
      assert(SIGHT_REACH_M === SIGHT_M + LIGHT_M + REACH_SOFT_M && SIGHT_EDGE_M > SIGHT_REACH_M, JSON.stringify({ SIGHT_REACH_M, SIGHT_EDGE_M, reach: SIGHT_M + LIGHT_M + REACH_SOFT_M }));
      const G = 'melas.ground';
      const maskAt = (s, x, z) => sightMask(s, eyeOf(s, viewer(x, z, 'right')), { x0: Math.floor((x - 60) / 0.5) * 0.5, z0: Math.floor((z - 60) / 0.5) * 0.5, nx: 240, nz: 240, cellM: 0.5 });
      const a = createGame({ scenario: 'barracks', seed: SEED, hour: 12 });
      a.state.places.live = { site: 'melas', area: G };
      const w = sightGridOf(a.state, G, 500, 224);
      // (the farthest east the window is kept: SIGHT_EDGE_M short of its edge, less a hair)
      const ex = w.x0 + w.nx * w.cellM - SIGHT_EDGE_M - 0.1, ez = 224;
      const m1 = maskAt(a.state, ex, ez), kept = sightGridOf(a.state, G, ex, ez) === w;
      const b = createGame({ scenario: 'barracks', seed: SEED, hour: 12 });
      b.state.places.live = { site: 'melas', area: G };
      const m2 = maskAt(b.state, ex, ez), w2 = sightGridOf(b.state, G, ex, ez);
      let differ = 0, lit = 0, first = null;
      for (let k = 0; k < m1.vis.length; k++) { if (m1.vis[k] > 0) lit++; if (m1.vis[k] !== m2.vis[k]) { differ++; first ??= { k, kept: m1.vis[k], fresh: m2.vis[k] }; } }
      a.state.places.live = b.state.places.live = { site: 'melas', area: AREA };
      console.log(`      the window built round (500, 224): x ${w.x0} to ${w.x0 + w.nx * w.cellM} (${SIGHT_WINDOW_M} m), kept with the eye at (${fmt(ex, 1)}, ${ez}), ${fmt(SIGHT_EDGE_M + 0.1, 1)} m from its east edge: ${kept}; a fresh game's window there x ${w2.x0} to ${w2.x0 + w2.nx * w2.cellM}`);
      console.log(`      sightMask over 120 × 120 m at noon: ${lit} cells lit, ${differ} differ from the fresh game's (sight reaches ${SIGHT_REACH_M} m, the edge holds ${SIGHT_EDGE_M} m)`);
      assert(kept, 'the window was not kept: the case does not test the edge');
      assert(differ === 0, `${differ} cells differ; the first ${JSON.stringify(first)}`);
    },
  },
];
