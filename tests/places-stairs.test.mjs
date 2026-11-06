// OLYMPUS tests: the stairs, as drawn and as walked. The user, playing v0.0.4 (2026-11-06): "florr N-1,
// cannot cross the space to head downstairs again, is it intentional ?", then "stairs at level N
// (starting level) are fine, it's when I try going down to N-2 from N-1 that I'm stuck". Upstairs, the
// kit drew each well's landing and its arrow at the well's north end, by the hall door, while the sim
// leaves its south end open (places' blockRectOf: the back is the top) and fires the way down there;
// downstairs the flight's arrow pointed down the screen (the way one climbs, south) and its UP, turned
// with the flight, was painted upside down and read "dn"; and no floor was named anywhere.
//
// Here, for every stairsWell in every area at 16 and 24 px/m, the kit's own drawing (place()'s stair:
// the landing, the well's open floor, the mark, the guard, as the builder snapped them) against the
// sim's (fixtures.js openTopOf and blockRectOf): the landing and the DOWN mark are the open top, the
// dark well and every guard box lie over the blocked rest, within the pixel the builder snaps to; a
// flight's UP mark at its foot; a well turned each of the four ways keeps the rule, and its mark is
// painted upright whatever the turn. Then a bot walks onto each drawn landing from the hall, from beside
// the well's far end (where v0.0.4 drew the landing) and from the far side, and goes down; and from
// each UP mark up the flight, and goes up. Last, the floor is named on the HUD's place line. This file
// reads both the art and the sim, as places-validate does (the sim may not import the art: TECH §2.2).
// Numbers printed: each well's drawn landing beside its open top, the bots' ticks and arrivals.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { recordingArea } from './kit-makers.test.mjs';
import { runBot, goTo, plan } from './bots/lib.mjs';
import { place } from '../src/art/kit/index.js';
import { stairEnd, stairMark, STAIR_TOP_M as KIT_STAIR_TOP_M } from '../src/art/kit/structure.js';
import { C } from '../src/art/kit/common.js';
import { rotPainter } from '../src/art/kit/kit.js';
import { paint, unword } from '../src/art/paint.js';
import { snapBox } from '../src/render/batch-math.js';
import { AREA_LIST } from '../src/sim/places/areas.js';
import { footprintOf, blockRectOf, openTopOf, STAIR_TOP_M } from '../src/sim/places/fixtures.js';
import { areaOf, placeLine, roomOf, surfaceAt } from '../src/sim/places/model.js';
import { watchFaces } from '../src/ui/hud/watch.js';

const SEED = 48213;
const wells = () => AREA_LIST.flatMap(a => (a.fixtures ?? []).filter(f => f.kind === 'stairsWell').map(f => ({ a, f })));
const flights = () => AREA_LIST.flatMap(a => (a.fixtures ?? []).filter(f => f.kind === 'stairs').map(f => ({ a, f })));
const R = (g) => ({ x0: g.x0, z0: g.z0, x1: g.x1, z1: g.z1 });
const fmtR = (r) => `x ${r.x0.toFixed(3)} to ${r.x1.toFixed(3)}, z ${r.z0.toFixed(3)} to ${r.z1.toFixed(3)}`;
// (two rects the same within e on every edge; one inside another within e; their overlap's depth)
const same = (p, q, e) => ['x0', 'z0', 'x1', 'z1'].every(k => Math.abs(p[k] - q[k]) <= e + 1e-9);
const inside = (p, q, e) => p.x0 >= q.x0 - e - 1e-9 && p.x1 <= q.x1 + e + 1e-9 && p.z0 >= q.z0 - e - 1e-9 && p.z1 <= q.z1 + e + 1e-9;
const overlapM = (p, q) => Math.min(Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0), Math.min(p.z1, q.z1) - Math.max(p.z0, q.z0));
const mid = (r) => [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2];
const drawn = (f, ppm) => place(recordingArea(ppm), { kind: f.kind, make: f.make, x: f.x, z: f.z, face: f.face, dir: f.dir, seed: f.seed ?? 1 });

// (the rows of a painting that hold the mark's amber ink, top to bottom: [first column, last column] each)
function inkRows(pm) {
  const rows = [];
  for (let j = 0; j < pm.h; j++) {
    let a = -1, b = -1;
    for (let i = 0; i < pm.w; i++) { const v = unword(pm.data[j * pm.w + i]); if (!v.hole && v.hex === C.amber) { if (a < 0) a = i; b = i; } }
    if (a >= 0) rows.push([a, b]);
  }
  return rows;
}

// (where a well's room meets its hall: a point 0.8 m into the hall, through the room's door)
function hallSide(area, f) {
  const o = (area.openings ?? []).find(x => x.kind === 'door' && x.rooms.includes(f.room) && x.rooms.some(r => r !== f.room && r !== 'outside'));
  const room = area.rooms.find(r => r.id === f.room), m = (o.a + o.b) / 2;
  if (o.axis === 'x') return { x: m, z: Math.abs(room.rect[1] - o.at) < 0.01 ? o.at - 0.8 : o.at + 0.8 };
  return { x: Math.abs(room.rect[0] - o.at) < 0.01 ? o.at - 0.8 : o.at + 0.8, z: m };
}
// (a point 0.7 m out from a rect's edge on the side `toward` names, at its middle across)
function past(r, toward, d = 0.7) {
  const [mx, mz] = mid(r);
  return toward === 's' ? { x: mx, z: r.z1 + d } : toward === 'n' ? { x: mx, z: r.z0 - d } : toward === 'e' ? { x: r.x1 + d, z: mz } : { x: r.x0 - d, z: mz };
}
// (the side of a well's footprint its open top lies on, and the opposite)
const topSide = (f) => { const fp = footprintOf(f), t = openTopOf(f); return t.z1 >= fp.z1 - 1e-9 && t.z0 > fp.z0 + 1e-9 ? 's' : t.z0 <= fp.z0 + 1e-9 && t.z1 < fp.z1 - 1e-9 ? 'n' : t.x1 >= fp.x1 - 1e-9 && t.x0 > fp.x0 + 1e-9 ? 'e' : 'w'; };
const OPP = { n: 's', s: 'n', e: 'w', w: 'e' };

export default [
  {
    name: 'every stairsWell is drawn as the sim walks it: its lit landing and its DOWN mark on the open top blockRectOf leaves, its dark well and its guard over the blocked rest (the user, 2026-11-06: "cannot cross the space to head downstairs again, is it intentional ?")',
    fn() {
      assert(STAIR_TOP_M === KIT_STAIR_TOP_M, `the sim's STAIR_TOP_M ${STAIR_TOP_M}, the kit's ${KIT_STAIR_TOP_M}`);
      const all = wells(), lines = [];
      assert(all.length >= 3, `${all.length} wells (Echo's upper floor has three)`);
      for (const ppm of [16, 24]) for (const { a, f } of all) {
        const s = drawn(f, ppm).stair, e = 1 / ppm, top = openTopOf(f), block = blockRectOf(f);
        assert(s && s.dir === 'down' && s.landing && s.open && s.mark && s.guard?.length, `${f.id}: the maker reported ${JSON.stringify(s && Object.keys(s))}`);
        const landing = R(s.landing), open = R(s.open), mark = R(s.mark);
        assert(same(landing, top, e), `${f.id} at ${ppm} px/m: the landing drawn at ${fmtR(landing)}, the sim's open top ${fmtR(top)}`);
        assert(same(mark, top, e), `${f.id} at ${ppm} px/m: the DOWN mark at ${fmtR(mark)}, the open top ${fmtR(top)}`);
        assert(same(open, block, e), `${f.id} at ${ppm} px/m: the well drawn at ${fmtR(open)}, the blocked rect ${fmtR(block)}`);
        for (const b of s.guard) {
          assert(inside(b, block, e), `${f.id} at ${ppm} px/m: a guard box ${fmtR(b)} outside the blocked rect ${fmtR(block)}`);
          assert(overlapM(b, top) <= e + 1e-9, `${f.id} at ${ppm} px/m: a guard box ${fmtR(b)} stands on the landing ${fmtR(top)}`);
        }
        if (ppm === 16) lines.push(`${f.id} (${a.id}, facing ${f.face}): landing drawn ${fmtR(landing)}, open top ${fmtR(top)}; ${s.guard.length} guard boxes over ${fmtR(block)}`);
      }
      for (const { f } of flights()) {
        const s = drawn(f, 16).stair, fp = footprintOf(f), m = R(s.mark), [mx, mz] = mid(m), [fx0, fz0] = [f.x, f.z];
        // (the foot is the flight's front: +z as it faces down, −z facing up, and so on)
        const fr = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[f.face ?? 'down'], footD = ((mx - fx0) * fr[0] + (mz - fz0) * fr[1]);
        const want = (fr[0] ? fp.x1 - fp.x0 : fp.z1 - fp.z0) / 2 - STAIR_TOP_M / 2;
        assert(s.dir === (f.dir === 'down' ? 'down' : 'up') && Math.abs(footD - want) <= 1 / 16 + 1e-9, `${f.id}: its ${s.dir} mark ${footD.toFixed(3)} m toward its front, not ${want} (its foot)`);
      }
      const fl = flights()[0];
      lines.push(`${flights().length} flights, each its UP mark on its foot (${fl.f.id}: ${fmtR(R(drawn(fl.f, 16).stair.mark))})`);
      for (const l of lines) console.log(`      ${l}`);
    },
  },
  {
    name: 'a well turned any of the four ways keeps the rule (landing and mark on openTopOf, the well on blockRectOf), and its mark is painted upright on the screen whatever the turn: ▲ UP and ▼ DOWN never read backwards',
    fn() {
      const lines = [];
      for (const ppm of [16, 24]) for (const face of ['down', 'right', 'up', 'left']) {
        const f = { id: 'f:t:well', kind: 'stairsWell', make: 'rail', x: 20.3, z: 11.7, face };
        const s = drawn(f, ppm).stair, e = 1 / ppm;
        assert(same(R(s.landing), openTopOf(f), e) && same(R(s.mark), openTopOf(f), e) && same(R(s.open), blockRectOf(f), e), `facing ${face} at ${ppm} px/m: landing ${fmtR(R(s.landing))}, open top ${fmtR(openTopOf(f))}; well ${fmtR(R(s.open))}, blocked ${fmtR(blockRectOf(f))}`);
        // (the mark as the batch paints it, at its snapped size: amber rows narrowing upward for ▲, downward for ▼)
        for (const dir of ['up', 'down']) {
          const end = stairEnd(dir === 'down' ? 'stairsWell' : 'stairs', dir, 4.8), q = { down: 0, right: 1, up: 2, left: 3 }[face];
          const b = snapBox({ ...R(s.mark), y0: -1, y1: 0 }, ppm), top = rotPainter(rotPainter(stairMark(end.dir), (4 - q) & 3), q);
          const pm = paint(b.wPx, b.dPx, (px, w, h) => top(px, w, h, ppm)), up = paint(b.wPx, b.dPx, (px, w, h) => stairMark(end.dir)(px, w, h, ppm));
          assert(pm.data.every((v, i) => v === up.data[i]), `facing ${face} at ${ppm} px/m: the ${dir} mark is not painted upright`);
          const rows = inkRows(pm), tri = rows.slice(0, Math.max(4, Math.round(0.38 * ppm))), widths = tri.map(([x0, x1]) => x1 - x0 + 1);
          const rising = widths.every((w, i) => i === 0 || w > widths[i - 1]), falling = widths.every((w, i) => i === 0 || w < widths[i - 1]);
          assert(dir === 'up' ? rising : falling, `facing ${face} at ${ppm} px/m: the ${dir} triangle's rows ${widths.join(', ')}`);
          if (face === 'up' && ppm === 16) lines.push(`${dir} at 16 px/m: ${b.wPx} × ${b.dPx} px, the triangle's rows ${widths.join(', ')} px, ${rows.length} rows of ink with its word`);
        }
      }
      for (const l of lines) console.log(`      ${l}`);
    },
  },
  {
    name: 'a walker who steps onto any drawn landing goes down, from the hall, from beside the well\'s far end (where v0.0.4 drew the landing) and from the far side; and from any flight\'s UP mark, up the flight, goes up (the user, 2026-11-06: "it\'s when I try going down to N-2 from N-1 that I\'m stuck")',
    timeoutMs: 120000,
    fn() {
      const lines = [];
      for (const { a, f } of wells()) {
        const s = drawn(f, 16).stair, landing = R(s.landing), [lx, lz] = mid(landing), side = topSide(f), fp = footprintOf(f);
        const below = a.portals.find(p => (a.links ?? []).some(l => l.id === p.via) && Math.abs((p.band.a + p.band.b) / 2 - f.x) < 0.01).to.area;
        // (beside the far end: 0.6 m off the well's long side, on the room's wider side, 0.5 m in from its far end, where the v0.0.4 picture put the landing)
        const room = a.rooms.find(r => r.id === f.room).rect, farEnd = past(fp, OPP[side], -0.5);
        const beside = side === 'n' || side === 's' ? { x: fp.x0 - room[0] > room[2] - fp.x1 ? fp.x0 - 0.6 : fp.x1 + 0.6, z: farEnd.z } : { x: farEnd.x, z: fp.z0 - room[1] > room[3] - fp.z1 ? fp.z0 - 0.6 : fp.z1 + 0.6 };
        const starts = [['the hall', hallSide(a, f)], ['beside the far end', beside], ['the far side', past(fp, side)]];
        for (const [where, at] of starts) {
          assert(where === 'the hall' ? roomOf(a, at.x, at.z)?.id !== f.room : roomOf(a, at.x, at.z)?.id === f.room, `${f.id}: the start ${where} (${at.x}, ${at.z}) is in ${roomOf(a, at.x, at.z)?.id}`);
          const g = createGame({ scenario: 'barracks', seed: SEED, hour: 12, at: { area: a.id, x: at.x, z: at.z, face: 'down' } });
          const r = runBot(g, plan([goTo({ x: lx, z: lz }, { area: a.id, arriveM: 0 })]), { maxTicks: 3000 });
          const me = g.me(), live = g.state.places.live.area;
          assert(live === below, `${f.id} from ${where} (${at.x.toFixed(2)}, ${at.z.toFixed(2)}): still in ${live} at (${me.x.toFixed(2)}, ${me.z.toFixed(2)}) after ${r.ticks} ticks (${r.reason ?? 'done'})`);
          assert(surfaceAt(g.state, me.x, me.z) === 'stairs', `${f.id} from ${where}: arrived off the flight at (${me.x}, ${me.z})`);
          lines.push(`${f.id} from ${where}: down in ${r.ticks} ticks, on ${below}'s flight at (${me.x.toFixed(2)}, ${me.z.toFixed(2)}) facing ${me.face}`);
        }
      }
      for (const { a, f } of flights()) {
        const s = drawn(f, 16).stair, [mx, mz] = mid(R(s.mark)), p = a.portals.find(q => (a.links ?? []).some(l => l.id === q.via) && Math.abs((q.band.a + q.band.b) / 2 - f.x) < 0.01);
        const fp = footprintOf(f), topZ = p.band.out === 's' ? fp.z1 - 0.1 : fp.z0 + 0.1;
        const g = createGame({ scenario: 'barracks', seed: SEED, hour: 12, at: { area: a.id, ...hallSide(a, f), face: 'down' } });
        const r = runBot(g, plan([goTo({ x: mx, z: mz }, { area: a.id }), goTo({ x: f.x, z: topZ }, { area: a.id, arriveM: 0 })]), { maxTicks: 3000 });
        const me = g.me(), live = g.state.places.live.area, above = areaOf(p.to.area), well = above.fixtures.find(w => w.kind === 'stairsWell' && Math.abs(w.x - f.x) < 0.01);
        const b = blockRectOf(well), inBlock = me.x > b.x0 && me.x < b.x1 && me.z > b.z0 && me.z < b.z1;
        assert(live === p.to.area && !inBlock, `${f.id}: from its UP mark up the flight ended in ${live} at (${me.x.toFixed(2)}, ${me.z.toFixed(2)}) after ${r.ticks} ticks (${r.reason ?? 'done'})`);
        lines.push(`${f.id} from the hall by its UP mark: up in ${r.ticks} ticks, at (${me.x.toFixed(2)}, ${me.z.toFixed(2)}) on ${live} facing ${me.face}, the well behind`);
      }
      for (const l of lines) console.log(`      ${l}`);
    },
  },
  {
    name: 'the HUD\'s place line names the floor: "Echo Company barracks, upper floor · East stair" upstairs, "ground floor" downstairs, nothing added out of doors; the log\'s line on arriving says the same floor',
    fn() {
      const up = createGame({ scenario: 'barracks', seed: SEED, hour: 12, at: { area: 'melas.echo.2', x: 82.8, z: 16.5, face: 'down' } });
      const down = createGame({ scenario: 'barracks', seed: SEED, hour: 12, at: { area: 'melas.echo.1', x: 82.8, z: 12.5, face: 'down' } });
      const street = createGame({ scenario: 'barracks', seed: SEED, hour: 12, at: { area: 'melas.ground', x: 522, z: 224, face: 'down' } });
      const lines = [placeLine(up.state), placeLine(down.state), placeLine(street.state)];
      assert(lines[0] === 'Echo Company barracks, upper floor · East stair', lines[0]);
      assert(lines[1] === 'Echo Company barracks, ground floor · East stair', lines[1]);
      assert(!/floor/.test(lines[2]) && lines[2].length > 0, lines[2]);
      assert(watchFaces(up.state).place === lines[0], `the watch shows '${watchFaces(up.state).place}'`);
      for (const a of AREA_LIST.filter(x => x.floorName)) assert(a.name.endsWith(`, ${a.floorName}`), `${a.id}: named '${a.name}', its floor '${a.floorName}'`);
      // (up the east stair: the log's place line names the floor arrived on)
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 12, at: { area: 'melas.echo.1', x: 80.95, z: 13.5, face: 'down' } });
      runBot(g, plan([goTo({ x: 80.95, z: 15.2 }, { area: 'melas.echo.1', arriveM: 0 })]), { maxTicks: 400 });
      const log = (g.state.log ?? []).filter(e => e.kind === 'place').map(e => e.text);
      assert(g.state.places.live.area === 'melas.echo.2' && log.at(-1) === 'Echo Company barracks, upper floor.', `${g.state.places.live.area}; the log: ${JSON.stringify(log)}`);
      console.log(`      upstairs: '${lines[0]}'; downstairs: '${lines[1]}'; on the street: '${lines[2]}'; the log up the stair: '${log.at(-1)}'`);
    },
  },
];
