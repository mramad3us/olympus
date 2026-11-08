// OLYMPUS tests: the stairs, as drawn and as walked. The user, playing v0.0.4 (2026-11-06): "florr N-1,
// cannot cross the space to head downstairs again, is it intentional ?", then "stairs at level N
// (starting level) are fine, it's when I try going down to N-2 from N-1 that I'm stuck": upstairs, the
// kit drew each well's landing at the well's north end while the sim left its south end open. Then the
// user, playing v0.0.5 (2026-11-07): "also stairs are screwed now, when going up, the screen changes
// when we step on the first stair at the bottom and not when I reach the top of the stairs", "actually
// i didn't analyse right, stairs are not backwards it's that we can get on the upwards staircase from
// the wrong end" and "and the UP indicator is on the entry of the staircase which I interpreted as the
// top of the staircase and not the bottom": v0.0.5's flight blocked nothing, so one stepped onto it
// from its open side beside its top, one step from the floor's band, or walked into the band from
// past its top before touching it; and its "▲ UP" stood at its foot, read as the name of that end.
//
// Here, for every flight and every stairsWell in every area at 16 and 24 px/m, the kit's own drawing
// (place()'s stair, as the builder snapped it) against the sim's (fixtures.js flightGuardOf, openTopOf,
// blockRectOf): a flight's stringers are its blocked rects, its rails and newels stand on them and
// nowhere in its lane; a well's lit landing is its open top, its dark well and its guard the blocked
// rest, but its landing's rails (landingRailsOf). The words name the end they lead to: "UP" at a
// flight's top, WORD_IN_M in from it and clear of its closed end's picture, "DOWN" at a well's bottom,
// nothing in the half one steps onto, painted upright whatever the turn, a pixel clear of the guard;
// the walking arrow runs from the end one steps onto (on a flight with an open side, in through the
// opening, whose floor shows on the screen past the open side's handrail) and points its head at the word. Then a walker tries every way onto
// every flight and well from a ring of start points round each footprint on both floors (the keys held
// toward it, then along the climb), and reaches the other floor only from a flight's foot or a well's
// landing, the floor changing only at the band; and a bot from the hall goes up each flight by its foot
// and down each well from its landing. Last, the floor is named on the HUD's place line. This file
// reads both the art and the sim, as places-validate does (the sim may not import the art: TECH §2.2).
// Numbers printed: each stair's guard and lane, its word's place, the ring's tally and a sample of it.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { recordingArea } from './kit-makers.test.mjs';
import { runBot, goTo, plan } from './bots/lib.mjs';
import { place } from '../src/art/kit/index.js';
import * as KIT from '../src/art/kit/structure.js';
import { C } from '../src/art/kit/common.js';
import { paint, unword } from '../src/art/paint.js';
import { snapBox } from '../src/render/batch-math.js';
import { AREA_LIST } from '../src/sim/places/areas.js';
import * as FX from '../src/sim/places/fixtures.js';
import { buildGrid, CLASSES } from '../src/sim/places/nav.js';
import { standOk } from '../src/sim/places/collide.js';
import { STEP_M, PORTAL_DEPTH_M } from '../src/sim/places/plan.js';
import { WALK_MS } from '../src/sim/places/move.js';
import { TICK_MS } from '../src/core/clock.js';
import { areaOf, placeLine, roomOf, surfaceAt } from '../src/sim/places/model.js';
import { watchFaces } from '../src/ui/hud/watch.js';
import { lightLevel } from '../src/sim/places/light.js';

const { footprintOf, blockRectOf, blockRectsOf, openTopOf, flightGuardOf, flightLaneOf, flightFarOf, landingRailsOf } = FX;
const SEED = 48213;
const wells = () => AREA_LIST.flatMap(a => (a.fixtures ?? []).filter(f => f.kind === 'stairsWell').map(f => ({ a, f })));
const flights = () => AREA_LIST.flatMap(a => (a.fixtures ?? []).filter(f => f.kind === 'stairs').map(f => ({ a, f })));
const R = (g) => ({ x0: g.x0, z0: g.z0, x1: g.x1, z1: g.z1 });
const fmtR = (r) => `x ${r.x0.toFixed(3)} to ${r.x1.toFixed(3)}, z ${r.z0.toFixed(3)} to ${r.z1.toFixed(3)}`;
// (two rects the same within e on every edge; one inside another within e; their overlap's depth; a point in a rect; its distance from one)
const same = (p, q, e) => ['x0', 'z0', 'x1', 'z1'].every(k => Math.abs(p[k] - q[k]) <= e + 1e-9);
const inside = (p, q, e) => p.x0 >= q.x0 - e - 1e-9 && p.x1 <= q.x1 + e + 1e-9 && p.z0 >= q.z0 - e - 1e-9 && p.z1 <= q.z1 + e + 1e-9;
const overlapM = (p, q) => Math.min(Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0), Math.min(p.z1, q.z1) - Math.max(p.z0, q.z0));
const mid = (r) => [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2];
const within = (r, x, z) => x >= r.x0 - 1e-9 && x <= r.x1 + 1e-9 && z >= r.z0 - 1e-9 && z <= r.z1 + 1e-9;
const distTo = (r, x, z) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1));
const drawn = (f, ppm) => place(recordingArea(ppm), { kind: f.kind, make: f.make, x: f.x, z: f.z, face: f.face, dir: f.dir, open: f.open, seed: f.seed ?? 1 });
// (the stair's axis in the area: 'z' when it runs north–south; where along it a rect's middle lies; the footprint's end nearer a rect)
const axisOf = (f) => (f.face === 'left' || f.face === 'right' ? 'x' : 'z');
const along = (f, r) => (axisOf(f) === 'z' ? (r.z0 + r.z1) / 2 : (r.x0 + r.x1) / 2);
const ends = (f) => { const fp = footprintOf(f); return axisOf(f) === 'z' ? [fp.z0, fp.z1] : [fp.x0, fp.x1]; };
const endToward = (f, r) => { const [a, b] = ends(f), m = along(f, r); return Math.abs(m - a) < Math.abs(m - b) ? a : b; };
const otherEnd = (f, e) => { const [a, b] = ends(f); return Math.abs(e - a) < 1e-9 ? b : a; };
// (a stair's end one steps onto, and the end it leads to, along its axis)
const stepEndOf = (f) => (f.kind === 'stairs' ? otherEnd(f, endToward(f, flightFarOf(f))) : endToward(f, openTopOf(f)));
const farEndOf = (f) => otherEnd(f, stepEndOf(f));
// (a ground as the batch paints it: its snapped size at the density, its top painter)
const paintGround = (g, ppm) => { const b = snapBox({ ...R(g), y0: -1, y1: 0 }, ppm); return paint(b.wPx, b.dPx, (px, w, h) => g.top(px, w, h, ppm)); };
const isInk = (v) => !v.hole && v.hex === C.amber;
// (which way a painting's arrow points along an axis: +1 toward the larger index, −1 the smaller, 0 if no head
// shows: its head the end whose rows of ink widen from a narrow tip, row on row; and the rows its ink spans)
function arrowPoints(pm, axis) {
  const n = axis === 'z' ? pm.h : pm.w, m = axis === 'z' ? pm.w : pm.h, widths = [];
  for (let k = 0; k < n; k++) {
    let a = -1, b = -1;
    for (let i = 0; i < m; i++) { const v = unword(pm.data[axis === 'z' ? k * pm.w + i : i * pm.w + k]); if (isInk(v)) { if (a < 0) a = i; b = i; } }
    widths.push(a < 0 ? 0 : b - a + 1);
  }
  const rows = widths.map((w, k) => (w ? k : -1)).filter(k => k >= 0), first = rows[0], last = rows.at(-1);
  const widens = (k0, s) => [0, 1, 2].every(i => widths[k0 + s * i] < widths[k0 + s * (i + 1)]) && widths[k0] <= 3;
  const atFirst = widens(first, 1), atLast = widens(last, -1);
  return { dir: atLast && !atFirst ? 1 : atFirst && !atLast ? -1 : 0, first, last, head: Math.max(...widths) };
}
// (whether a painting has ink within d pixels of the point (i, j))
const inkNear = (pm, i, j, d) => { for (let y = j - d; y <= j + d; y++) for (let x = i - d; x <= i + d; x++) if (x >= 0 && y >= 0 && x < pm.w && y < pm.h && isInk(unword(pm.data[y * pm.w + x]))) return true; return false; };
const inkRowsOf = (pm) => { let n = 0; for (let j = 0; j < pm.h; j++) for (let i = 0; i < pm.w; i++) if (isInk(unword(pm.data[j * pm.w + i]))) { n++; break; } return n; };

// (where a stair's room meets its hall: a point 0.8 m into the hall, through the room's door)
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
// (the link's portal across a stair, on its floor, and where it fires)
const portalOf = (a, f) => a.portals.find(p => (a.links ?? []).some(l => l.id === p.via) && Math.abs((p.band.a + p.band.b) / 2 - (axisOf(f) === 'z' ? f.x : f.z)) < 0.01);
function zoneOf(b) {
  const s = b.out === 's' || b.out === 'e' ? 1 : -1, p = b.at + s * STEP_M, q = b.at + s * (STEP_M + PORTAL_DEPTH_M);
  return b.axis === 'x' ? { x0: b.a, x1: b.b, z0: Math.min(p, q), z1: Math.max(p, q) } : { x0: Math.min(p, q), x1: Math.max(p, q), z0: b.a, z1: b.b };
}

/** The ring round a footprint: starts RING_OUT_M out, every RING_STEP_M along each side, and its four corners, each with the key toward it. */
const RING_OUT_M = 0.45, RING_STEP_M = 0.4;
/** A walking tick's step, metres (the most a step moves the walker: the floor changes on the step that ends in the zone). */
const STEP_WALK_M = WALK_MS * TICK_MS / 1000;
function ringOf(f) {
  const fp = footprintOf(f), o = RING_OUT_M, out = [];
  for (let x = fp.x0; x <= fp.x1 + 1e-9; x += RING_STEP_M) { out.push({ side: 'n', x, z: fp.z0 - o, key: { mz: 1 } }); out.push({ side: 's', x, z: fp.z1 + o, key: { mz: -1 } }); }
  for (let z = fp.z0; z <= fp.z1 + 1e-9; z += RING_STEP_M) { out.push({ side: 'w', x: fp.x0 - o, z, key: { mx: 1 } }); out.push({ side: 'e', x: fp.x1 + o, z, key: { mx: -1 } }); }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) out.push({ side: `${sz < 0 ? 'n' : 's'}${sx < 0 ? 'w' : 'e'}`, x: sx < 0 ? fp.x0 - o : fp.x1 + o, z: sz < 0 ? fp.z0 - o : fp.z1 + o, key: { mx: -sx, mz: -sz } });
  return out.map(s => ({ ...s, x: Math.round(s.x * 1e4) / 1e4, z: Math.round(s.z * 1e4) / 1e4 }));
}
// (the keys along a stair toward the end it leads to: a flight's top, a well's bottom)
// (a flight's open side's rail, the shorter of its two, or null when both are short (no side named))
const openRailOf = (f) => { const [p, q] = flightGuardOf(f).slice(1, 3), len = (r) => r.z1 - r.z0 + r.x1 - r.x0; return Math.abs(len(p) - len(q)) < 1e-9 ? null : len(p) < len(q) ? p : q; };
const climbKey = (f) => { const d = Math.sign(farEndOf(f) - stepEndOf(f)); return axisOf(f) === 'z' ? { mz: d } : { mx: d }; };

export default [
  {
    name: 'every flight is drawn as the sim blocks it: its stringers are flightGuardOf\'s rects (its closed top, its rails, the open side\'s FLIGHT_FOOT_M short of the foot), its handrails and newels stand on them and nowhere in its lane (the user, 2026-11-07: "we can get on the upwards staircase from the wrong end"); every stairsWell\'s lit landing is its open top and its dark well and guard the blocked rest (the user, 2026-11-06: "cannot cross the space to head downstairs again, is it intentional ?")',
    fn() {
      for (const k of ['STAIR_TOP_M', 'FLIGHT_RAIL_M', 'FLIGHT_FOOT_M', 'FLIGHT_END_M']) assert(FX[k] === KIT[k], `the sim's ${k} ${FX[k]}, the kit's ${KIT[k]}`);
      assert(JSON.stringify(FX.WELL_RAIL_M) === JSON.stringify(KIT.WELL_RAIL_M), `the sim's WELL_RAIL_M ${JSON.stringify(FX.WELL_RAIL_M)}, the kit's ${JSON.stringify(KIT.WELL_RAIL_M)}`);
      const lines = [];
      assert(flights().length >= 3 && wells().length >= 3, `${flights().length} flights, ${wells().length} wells (Echo has three of each)`);
      for (const ppm of [16, 24]) {
        for (const { a, f } of flights()) {
          // (what the nav grid and collision stop walkers on: blockRectsOf, the guard)
          const s = drawn(f, ppm).stair, e = 1 / ppm, guard = blockRectsOf(f), lane = flightLaneOf(f), n = f.open ? 4 : 3;
          assert(guard.length === n && guard.every((g, i) => same(g, flightGuardOf(f)[i], 1e-9)), `${f.id}: the sim stops walkers on ${JSON.stringify(guard)}`);
          assert(s && s.blocks?.length === n && s.guard?.length > n, `${f.id}: the maker reported ${JSON.stringify(s && Object.keys(s))}`);
          s.blocks.forEach((b, i) => assert(same(R(b), guard[i], e), `${f.id} at ${ppm} px/m: stringer ${i} drawn at ${fmtR(R(b))}, the sim blocks ${fmtR(guard[i])}`));
          for (const b of s.guard) {
            assert(guard.some(g => inside(R(b), g, e)), `${f.id} at ${ppm} px/m: a guard box ${fmtR(R(b))} stands on none of the blocked rects`);
            assert(overlapM(R(b), { x0: lane.x0 + e, z0: lane.z0 + e, x1: lane.x1 - e, z1: lane.z1 - e }) <= 1e-9, `${f.id} at ${ppm} px/m: a guard box ${fmtR(R(b))} stands in the lane ${fmtR(lane)}`);
          }
          // (the opening on the screen, where the foot is north: the open side's guard pictured (height y at ground z − y) no nearer the foot than its newel's picture)
          const fpz = footprintOf(f), openRail = openRailOf(f), footAt = guard[3] ? guard[3].z1 : fpz.z0;
          let shown = null;
          if (f.face === 'up' && f.dir !== 'down' && openRail) {
            const pic = Math.min(...s.guard.filter(b => inside(R(b), openRail, e)).map(b => b.z0 - b.y1));
            shown = { from: footAt, to: pic, gapM: openRail.z0 - footAt };
            assert(pic >= openRail.z0 - 0.2 - e - 1e-9 && pic - footAt >= 0.6, `${f.id} at ${ppm} px/m: the open side's guard pictured from z ${pic.toFixed(3)}, its rail from ${openRail.z0}: the opening shows only ${(pic - footAt).toFixed(2)} m`);
          }
          if (ppm === 16) lines.push(`${f.id} (${a.id}, facing ${f.face}, open ${f.open ?? 'both sides'}): its top closed ${fmtR(guard[0])}; rails ${fmtR(guard[1])} and ${fmtR(guard[2])}${guard[3] ? `; across the foot ${fmtR(guard[3])}` : ''}; the lane ${fmtR(lane)}; ${s.guard.length} guard boxes${shown ? `; the opening ${shown.gapM.toFixed(2)} m on the floor, ${(shown.to - shown.from).toFixed(2)} m clear on the screen (z ${shown.from} to ${shown.to.toFixed(2)})` : ''}`);
        }
        for (const { a, f } of wells()) {
          const s = drawn(f, ppm).stair, e = 1 / ppm, top = openTopOf(f), block = blockRectOf(f), rails = landingRailsOf(f);
          assert(blockRectsOf(f).length === 3 && same(blockRectsOf(f)[0], block, 1e-9) && rails.every((r, i) => same(blockRectsOf(f)[i + 1], r, 1e-9)), `${f.id}: the sim stops walkers on ${JSON.stringify(blockRectsOf(f))}`);
          assert(s && s.dir === 'down' && s.landing && s.open && s.mark && s.arrow && s.guard?.length && s.rails?.length >= 2, `${f.id}: the maker reported ${JSON.stringify(s && Object.keys(s))}`);
          // (the landing's rails: drawn on the sim's, the landing's lane between them, its far edge open)
          for (const b of s.rails) assert(rails.some(r => inside(R(b), r, e)), `${f.id} at ${ppm} px/m: a landing rail box ${fmtR(R(b))} stands on neither of ${JSON.stringify(rails)}`);
          assert(rails.every(r => inside(r, top, 1e-9) && overlapM(r, top) > 0), `${f.id}: the landing's rails ${JSON.stringify(rails)} not along its open top ${fmtR(top)}`);

          assert(same(R(s.landing), top, e), `${f.id} at ${ppm} px/m: the landing drawn at ${fmtR(R(s.landing))}, the sim's open top ${fmtR(top)}`);
          assert(same(R(s.open), block, e), `${f.id} at ${ppm} px/m: the well drawn at ${fmtR(R(s.open))}, the blocked rect ${fmtR(block)}`);
          for (const b of s.guard) {
            assert(inside(R(b), block, e), `${f.id} at ${ppm} px/m: a guard box ${fmtR(R(b))} outside the blocked rect ${fmtR(block)}`);
            assert(overlapM(R(b), top) <= e + 1e-9, `${f.id} at ${ppm} px/m: a guard box ${fmtR(R(b))} stands on the landing ${fmtR(top)}`);
          }
          if (ppm === 16) lines.push(`${f.id} (${a.id}, facing ${f.face}): landing ${fmtR(R(s.landing))}, open top ${fmtR(top)}, railed along ${rails.map(fmtR).join(' and ')}; ${s.guard.length} guard boxes over ${fmtR(block)}, ${s.rails.length} on the landing's rails`);
        }
      }
      // (any way a flight faces, either way it runs, any open side: the stringers are the sim's rects)
      let turned = 0;
      for (const face of ['down', 'right', 'up', 'left']) for (const dir of ['up', 'down']) for (const open of [null, 'left', 'right']) {
        const f = { id: 'f:t:flight', kind: 'stairs', make: 'concrete', x: 20.3, z: 11.7, face, dir, open };
        const s = drawn(f, 16).stair, g = flightGuardOf(f);
        assert(s.blocks.length === g.length, `facing ${face}, ${dir}, open ${open}: ${s.blocks.length} stringers drawn, the sim's ${g.length}`);
        s.blocks.forEach((b, i) => assert(same(R(b), g[i], 1 / 16), `facing ${face}, ${dir}, open ${open}: stringer ${i} at ${fmtR(R(b))}, the sim's ${fmtR(g[i])}`));
        turned++;
      }
      for (const l of lines) console.log(`      ${l}`);
      console.log(`      the guard: rails ${FX.FLIGHT_RAIL_M} m, the foot open ${FX.FLIGHT_FOOT_M} m on the open side (and railed across where a side is named), the top closed ${FX.FLIGHT_END_M} m deep and drawn ${KIT.END_H_M} m high; a well's landing railed ${FX.WELL_RAIL_M.rail} m along both sides; ${turned} turned flights (4 faces, both ways, 3 open sides) drawn as the sim blocks`);
    },
  },
  {
    name: 'a stair\'s word names the end it leads to: "UP" at a flight\'s top, "DOWN" at a well\'s bottom, none in the half one steps onto, upright whatever the turn, and its walking arrow runs from the end one steps onto (on a flight with an open side, in through the opening) and points its head at the word (the user, 2026-11-07: "the UP indicator is on the entry of the staircase which I interpreted as the top of the staircase and not the bottom")',
    fn() {
      const lines = [];
      for (const ppm of [16, 24]) for (const { a, f } of [...flights(), ...wells()]) {
        const s = drawn(f, ppm).stair, e = 1 / ppm, [lo, hi] = ends(f), L = hi - lo, stepEnd = stepEndOf(f), farEnd = farEndOf(f);
        const word = R(s.mark), arrow = R(s.arrow), text = f.kind === 'stairs' && f.dir !== 'down' ? 'UP' : 'DOWN';
        const wantIn = f.kind === 'stairs' ? KIT.WORD_IN_M : FX.STAIR_TOP_M / 2, wordIn = Math.abs(along(f, word) - farEnd);
        // (the word: its middle wantIn from the far end, a pixel's slack, in the far third; none in the half one steps onto)
        assert(s.dir === (text === 'UP' ? 'up' : 'down'), `${f.id}: its word's way ${s.dir}`);
        assert(Math.abs(wordIn - wantIn) <= e + 1e-9 && wordIn <= L / 3 + e, `${f.id} at ${ppm} px/m: its ${text} centred ${wordIn.toFixed(3)} m from its far end, not ${wantIn}`);
        assert(Math.abs(along(f, word) - stepEnd) > L / 2, `${f.id} at ${ppm} px/m: its ${text} lies in the half one steps onto`);
        // (a flight's word clear of its own closed end's picture: the end's top drawn END_H_M up, at ground z − y)
        if (f.kind === 'stairs' && f.face === 'up' && f.dir !== 'down') assert(word.z1 <= farEnd - KIT.END_H_M + e, `${f.id} at ${ppm} px/m: its UP ${fmtR(word)} under the picture of its closed end (from z ${farEnd - KIT.END_H_M})`);
        // (the arrow: from the end one steps onto (a rail's width in, past a rail across it) to the word, its head at the word)
        const [a0, a1] = axisOf(f) === 'z' ? [arrow.z0, arrow.z1] : [arrow.x0, arrow.x1];
        assert(Math.min(Math.abs(a0 - stepEnd), Math.abs(a1 - stepEnd)) <= FX.FLIGHT_RAIL_M + e + 1e-9 && overlapM(arrow, word) <= e + 1e-9, `${f.id} at ${ppm} px/m: the arrow ${fmtR(arrow)}, the word ${fmtR(word)}, the end stepped onto at ${stepEnd}`);
        const pm = paintGround(s.arrow, ppm), pt = arrowPoints(pm, axisOf(f)), want = Math.sign(along(f, word) - along(f, arrow));
        assert(pt.dir === want && pt.head >= 7, `${f.id} at ${ppm} px/m: its arrow's head points ${pt.dir} (${pt.head} px across), the word lies ${want}`);
        // (on a flight with an open side, the arrow comes in at that side's edge, at the opening's middle)
        let leg = '';
        if (f.kind === 'stairs' && f.open) {
          const fp = footprintOf(f), openRail = openRailOf(f);
          const edgeX = Math.abs(openRail.x0 - fp.x0) < 1e-9 ? arrow.x0 : arrow.x1, midZ = stepEnd + Math.sign(farEnd - stepEnd) * (FX.FLIGHT_FOOT_M + FX.FLIGHT_RAIL_M) / 2;
          const i = Math.min(pm.w - 1, Math.max(0, Math.floor((edgeX - arrow.x0) * ppm))), j = Math.floor((midZ - arrow.z0) * ppm);
          assert(axisOf(f) === 'z' && inkNear(pm, i, j, Math.round(0.12 * ppm)), `${f.id} at ${ppm} px/m: no arrow at the open side's edge (${edgeX}, ${midZ.toFixed(2)})`);
          leg = `, in from the open side at (${edgeX.toFixed(2)}, ${midZ.toFixed(2)})`;
        }
        // (the word painted as the batch paints it: ink in rows, upright)
        const wp = paintGround(s.mark, ppm), up = paint(wp.w, wp.h, (px, w, h) => KIT.stairWord(text)(px, w, h, ppm));
        assert(inkRowsOf(wp) >= 5 && wp.data.every((v, i) => v === up.data[i]), `${f.id} at ${ppm} px/m: its ${text} is not painted upright (${inkRowsOf(wp)} rows of ink)`);
        // (a pixel's margin between the word's plate and the guard either side of it)
        const across = axisOf(f) === 'z' ? wp.w : wp.h, inkCols = [];
        for (let i = 0; i < wp.w; i++) for (let j = 0; j < wp.h; j++) if (isInk(unword(wp.data[j * wp.w + i]))) { inkCols.push(i); break; }
        assert(axisOf(f) !== 'z' || (Math.min(...inkCols) >= 1 && Math.max(...inkCols) <= across - 2), `${f.id} at ${ppm} px/m: its ${text}'s letters from column ${Math.min(...inkCols)} to ${Math.max(...inkCols)} of ${across}, touching the guard`);
        if (ppm === 16) lines.push(`${f.id} (${a.id}): ${text} centred ${wordIn.toFixed(2)} m from its far end (${farEnd}), on ${wp.w} × ${wp.h} px, letters in columns ${Math.min(...inkCols)} to ${Math.max(...inkCols)}; the arrow from ${stepEnd}, its head ${pt.head} px across pointing at it${leg}`);
      }
      // (every turn: the word upright where it fits, the arrow along the stair toward it)
      for (const ppm of [16, 24]) for (const face of ['down', 'right', 'up', 'left']) for (const [kind, open] of [['stairs', null], ['stairs', 'left'], ['stairs', 'right'], ['stairsWell', null]]) {
        const f = { id: 'f:t:s', kind, make: kind === 'stairs' ? 'concrete' : 'rail', x: 20.3, z: 11.7, face, dir: kind === 'stairs' ? 'up' : 'down', open };
        const s = drawn(f, ppm).stair, text = kind === 'stairs' ? 'UP' : 'DOWN', wp = paintGround(s.mark, ppm), up = paint(wp.w, wp.h, (px, w, h) => KIT.stairWord(text)(px, w, h, ppm));
        const pt = arrowPoints(paintGround(s.arrow, ppm), axisOf(f)), want = Math.sign(along(f, R(s.mark)) - along(f, R(s.arrow))), upright = wp.data.every((v, i) => v === up.data[i]);
        assert(upright && pt.dir === want, `${kind} facing ${face}, open ${open} at ${ppm} px/m: the word upright ${upright}, the arrow ${pt.dir} toward ${want}`);
        if (ppm === 16 && (face === 'up' || face === 'left') && open !== 'right') lines.push(`${kind} facing ${face}${kind === 'stairs' ? `, open ${open ?? 'both sides'}` : ''} at 16 px/m: its ${text} ${inkRowsOf(wp) ? 'painted' : 'left out (no room across)'} on ${wp.w} × ${wp.h} px, the arrow's head ${pt.head} px across pointing at it`);
      }
      for (const l of lines) console.log(`      ${l}`);
    },
  },
  {
    name: 'a walker who tries every way onto every flight and well, from a ring of starts round each footprint on both floors, reaches the other floor only from a flight\'s foot or a well\'s landing, and the floor changes only at the band (the user, 2026-11-07: "when going up, the screen changes when we step on the first stair at the bottom and not when I reach the top of the stairs"; "we can get on the upwards staircase from the wrong end")',
    timeoutMs: 180000,
    fn() {
      const bad = [], tallies = [], sample = [];
      for (const { a, f } of [...flights(), ...wells()]) {
        const grid = buildGrid(a, 'C0', { closed: () => false }), p = portalOf(a, f), zone = zoneOf(p.band), climb = climbKey(f), stepEnd = stepEndOf(f);
        const on = f.kind === 'stairs' ? flightLaneOf(f) : openTopOf(f), fp = footprintOf(f);
        const t = { id: f.id, starts: 0, stood: 0, changed: 0, bad: 0, at: [] };
        for (const st of ringOf(f)) {
          t.starts++;
          if (!standOk(grid, st.x, st.z)) continue;
          t.stood++;
          const g = createGame({ scenario: 'barracks', seed: SEED, hour: 12, at: { area: a.id, x: st.x, z: st.z, face: 'down' } });
          let entered = null, changed = null, prev = { x: g.me().x, z: g.me().z };
          for (const [input, n] of [[st.key, 40], [climb, 140]]) {
            for (let k = 0; k < n && !changed; k++) {
              g.step(1, input);
              const me = g.me();
              if (g.state.places.live.area !== a.id) { changed = { from: prev }; break; }
              // (where the walker first stands on the stair: a flight's lane, a well's footprint)
              if (!entered && within(f.kind === 'stairs' ? on : fp, me.x, me.z)) entered = { x: me.x, z: me.z };
              prev = { x: me.x, z: me.z };
            }
            if (changed) break;
          }
          if (!changed) continue;
          t.changed++;
          // (onto a flight's lane within FLIGHT_FOOT_M and a walker's radius of its foot; a well's landing, or a step from
          // it where that step changed the floor; and the floor changed on a step from the lane or the landing into the zone)
          const enteredAt = entered && (axisOf(f) === 'z' ? entered.z : entered.x), near = (r, q) => distTo(r, q.x, q.z) <= STEP_WALK_M + 1e-6;
          const atFoot = f.kind === 'stairs' ? !!entered && Math.abs(enteredAt - stepEnd) <= FX.FLIGHT_FOOT_M + CLASSES.C0 + 1e-6 : near(on, entered ?? changed.from);
          const atBand = (f.kind === 'stairs' ? within(on, changed.from.x, changed.from.z) : near(on, changed.from)) && near(zone, changed.from);
          const line = `${f.id} from ${st.side} (${st.x.toFixed(2)}, ${st.z.toFixed(2)}): onto it at (${entered ? `${entered.x.toFixed(2)}, ${entered.z.toFixed(2)}` : 'nowhere'}), the floor changed on the step from (${changed.from.x.toFixed(2)}, ${changed.from.z.toFixed(2)})`;
          t.at.push(axisOf(f) === 'z' ? changed.from.z : changed.from.x);
          if (!atFoot || !atBand) { bad.push(line); t.bad++; } else if (sample.length < 8 && t.changed === 1) sample.push(line);
        }
        tallies.push(t);
        assert(t.changed >= 1, `${f.id}: no start of ${t.stood} reached the other floor`);
      }
      for (const t of tallies) console.log(`      ${t.id}: ${t.starts} starts, ${t.stood} with room to stand, ${t.changed} reached the other floor, ${t.changed - t.bad} ${t.id.includes(':e1:') ? 'from the foot' : 'from the landing'} and ${t.bad} otherwise, the floor changing at ${Math.min(...t.at).toFixed(2)} to ${Math.max(...t.at).toFixed(2)}`);
      for (const l of sample) console.log(`        ${l}`);
      assert(!bad.length, `onto a stair other than at its foot or its landing, or the floor changed off the band:\n${bad.join('\n')}`);
    },
  },
  {
    name: 'a bot from the hall walks to each flight\'s foot and up it and arrives upstairs facing on, and down each well from its landing into the flight\'s lane facing on, from the hall, from beside the well\'s far end and from the far side (the user, 2026-11-06: "it\'s when I try going down to N-2 from N-1 that I\'m stuck")',
    timeoutMs: 120000,
    fn() {
      const lines = [];
      for (const { a, f } of flights()) {
        const p = portalOf(a, f), lane = flightLaneOf(f), stepEnd = stepEndOf(f), farEnd = farEndOf(f), s = Math.sign(farEnd - stepEnd), [lx] = mid(lane);
        // (the foot a third of a metre onto the lane; the top as deep as the lane goes)
        const footZ = stepEnd + s * 0.3, topZ = farEnd - s * 0.25;
        const g = createGame({ scenario: 'barracks', seed: SEED, hour: 12, at: { area: a.id, ...hallSide(a, f), face: 'down' } });
        const r = runBot(g, plan([goTo({ x: lx, z: footZ }, { area: a.id }), goTo({ x: lx, z: topZ }, { area: a.id, arriveM: 0 })]), { maxTicks: 3000 });
        const me = g.me(), live = g.state.places.live.area, above = areaOf(p.to.area), well = above.fixtures.find(w => w.kind === 'stairsWell' && Math.abs(w.x - f.x) < 0.01);
        const b = blockRectOf(well), inBlock = me.x > b.x0 && me.x < b.x1 && me.z > b.z0 && me.z < b.z1;
        assert(live === p.to.area && !inBlock && me.face === p.to.face && Math.abs(me.x - f.x) < 0.3, `${f.id}: from the hall by its foot up the flight ended in ${live} at (${me.x.toFixed(2)}, ${me.z.toFixed(2)}) facing ${me.face} after ${r.ticks} ticks (${r.reason ?? 'done'})`);
        lines.push(`${f.id} from the hall by its foot (${lx.toFixed(2)}, ${footZ.toFixed(2)}): up in ${r.ticks} ticks, at (${me.x.toFixed(2)}, ${me.z.toFixed(2)}) on ${live} facing ${me.face}, the well behind`);
      }
      for (const { a, f } of wells()) {
        const s = drawn(f, 16).stair, [lx, lz] = mid(R(s.landing)), side = topSide(f), fp = footprintOf(f), p = portalOf(a, f);
        const room = a.rooms.find(r => r.id === f.room).rect, farEnd = past(fp, OPP[side], -0.5);
        const beside = side === 'n' || side === 's' ? { x: fp.x0 - room[0] > room[2] - fp.x1 ? fp.x0 - 0.6 : fp.x1 + 0.6, z: farEnd.z } : { x: farEnd.x, z: fp.z0 - room[1] > room[3] - fp.z1 ? fp.z0 - 0.6 : fp.z1 + 0.6 };
        const lane = flightLaneOf(areaOf(p.to.area).fixtures.find(x => x.kind === 'stairs' && Math.abs(x.x - f.x) < 0.01));
        for (const [where, at] of [['the hall', hallSide(a, f)], ['beside the far end', beside], ['the far side', past(fp, side)]]) {
          assert(where === 'the hall' ? roomOf(a, at.x, at.z)?.id !== f.room : roomOf(a, at.x, at.z)?.id === f.room, `${f.id}: the start ${where} (${at.x}, ${at.z}) is in ${roomOf(a, at.x, at.z)?.id}`);
          const g = createGame({ scenario: 'barracks', seed: SEED, hour: 12, at: { area: a.id, x: at.x, z: at.z, face: 'down' } });
          const r = runBot(g, plan([goTo({ x: lx, z: lz }, { area: a.id, arriveM: 0 })]), { maxTicks: 3000 });
          const me = g.me(), live = g.state.places.live.area;
          assert(live === p.to.area, `${f.id} from ${where} (${at.x.toFixed(2)}, ${at.z.toFixed(2)}): still in ${live} at (${me.x.toFixed(2)}, ${me.z.toFixed(2)}) after ${r.ticks} ticks (${r.reason ?? 'done'})`);
          assert(surfaceAt(g.state, me.x, me.z) === 'stairs' && within(lane, me.x, me.z) && me.face === p.to.face, `${f.id} from ${where}: arrived at (${me.x}, ${me.z}) facing ${me.face}, off the flight's lane ${fmtR(lane)}`);
          lines.push(`${f.id} from ${where}: down in ${r.ticks} ticks, in ${p.to.area}'s lane at (${me.x.toFixed(2)}, ${me.z.toFixed(2)}) facing ${me.face}`);
        }
      }
      for (const l of lines) console.log(`      ${l}`);
    },
  },
  {
    name: 'a walker crossing the room past a well\'s landing, pressed against its side, stays on its floor: the landing is railed along both sides and walked onto across its far edge only (the review of 0.0.6: v0.0.5\'s open sides let the door assist slide a walker going west at z 14.2 to 14.9 onto the landing, and down)',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    fn() {
      const lines = [];
      for (const { a, f } of wells()) {
        const fp = footprintOf(f), top = openTopOf(f), room = a.rooms.find(r => r.id === f.room).rect;
        // (from the room's wider side of the well, walking (and running) toward it along every row beside the landing)
        const east = room[2] - fp.x1 > fp.x0 - room[0], x = east ? fp.x1 + 0.9 : fp.x0 - 0.9, key = { mx: east ? -1 : 1 };
        let rows = 0, changed = [];
        for (let z = top.z0 - 0.1; z <= top.z1 - 0.05 + 1e-9; z += 0.05) for (const run of [false, true]) {
          const g = createGame({ scenario: 'barracks', seed: SEED, hour: 12, at: { area: a.id, x, z: Math.round(z * 100) / 100, face: east ? 'left' : 'right' } });
          rows++;
          for (let k = 0; k < 80; k++) { g.step(1, run ? { ...key, run: true } : key); if (g.state.places.live.area !== a.id) { changed.push(`z ${z.toFixed(2)}${run ? ' running' : ''}`); break; } }
        }
        assert(!changed.length, `${f.id}: walking ${east ? 'west' : 'east'} past its landing went down at ${changed.join(', ')}`);
        lines.push(`${f.id}: ${rows} walks ${east ? 'west' : 'east'} past its landing (z ${(top.z0 - 0.1).toFixed(2)} to ${(top.z1 - 0.05).toFixed(2)}, walking and running), none went down`);
      }
      for (const l of lines) console.log(`      ${l}`);
    },
  },
  {
    name: 'a walker who cannot stand where it is is settled on its own side of a flight\'s guard, never over a rail or the closed top into the lane (the review of 0.0.6: &at=80.95,15.45, squeezed between the east flight\'s top and the vestibule\'s wall, was settled to (80.875, 14.875), in the lane a step from its band)',
    fn() {
      const lines = [];
      for (const { a, f } of flights()) {
        const lane = flightLaneOf(f), fp = footprintOf(f);
        for (const [x, z] of [[f.x, fp.z1 + 0.15], [f.x - 0.3, fp.z1 + 0.1], [f.x + 0.3, fp.z1 + 0.05]].map(p => p.map(v => Math.round(v * 1e4) / 1e4))) {
          const g = createGame({ scenario: 'barracks', seed: SEED, hour: 12, at: { area: a.id, x, z, face: 'up' } });
          g.step(1, {});
          const me = g.me();
          assert(g.state.places.live.area === a.id && !within(lane, me.x, me.z), `${f.id}: from (${x}, ${z}) settled to (${me.x}, ${me.z}) on ${g.state.places.live.area}, in the lane ${fmtR(lane)}`);
          for (let k = 0; k < 40; k++) g.step(1, { mz: -1 });
          assert(g.state.places.live.area === a.id, `${f.id}: from (${x}, ${z}), settled to (${me.x}, ${me.z}), walking north went up`);
          lines.push(`${f.id}: from (${x.toFixed(2)}, ${z.toFixed(2)}) settled to (${me.x.toFixed(3)}, ${me.z.toFixed(3)}), outside the lane; 40 ticks north kept it on ${a.id}`);
        }
      }
      for (const l of lines) console.log(`      ${l}`);
    },
  },
  {
    name: 'at 23:00 a well\'s word and a flight\'s way on lie in a night light\'s pool (the review of 0.0.6 at 23:00 in the stair room: the main well\'s DOWN read "??OI" in the dark corner, the east well\'s "??WN"; a stair is a way out and lit at night, my call)',
    fn() {
      const lines = [];
      for (const { a, f } of [...flights(), ...wells()]) {
        const g = createGame({ scenario: 'barracks', seed: SEED, hour: 23, at: { area: a.id, x: f.x + 1.5, z: f.z, face: 'left' } });
        const s = drawn(f, 16).stair, [wx, wz] = mid(R(s.mark)), ms = g.state.clock.ms, dark = lightLevel(g.state, f.x + 1.6, 16.8, ms, a.id);
        const fp = footprintOf(f), word = lightLevel(g.state, wx, wz, ms, a.id), on = lightLevel(g.state, f.x, fp.z0 + 0.5, ms, a.id);
        const pts = f.kind === 'stairs' ? [['the way on', on], ['its UP (not asked)', word]] : [['its DOWN', word]];
        assert(pts[0][1] >= 0.1, `${f.id} at 23:00: ${pts[0][0]} lit ${pts[0][1]}`);
        lines.push(`${f.id} at 23:00: ${pts.map(([w, L]) => `${w} lit ${L.toFixed(3)}`).join(', ')}; the room's far corner ${dark.toFixed(3)}`);
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
      // (up the east stair, in its lane: the log's place line names the floor arrived on)
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 12, at: { area: 'melas.echo.1', x: 80.95, z: 13.5, face: 'down' } });
      runBot(g, plan([goTo({ x: 80.95, z: 14.95 }, { area: 'melas.echo.1', arriveM: 0 })]), { maxTicks: 400 });
      const log = (g.state.log ?? []).filter(e => e.kind === 'place').map(e => e.text);
      assert(g.state.places.live.area === 'melas.echo.2' && log.at(-1) === 'Echo Company barracks, upper floor.', `${g.state.places.live.area}; the log: ${JSON.stringify(log)}`);
      console.log(`      upstairs: '${lines[0]}'; downstairs: '${lines[1]}'; on the street: '${lines[2]}'; the log up the stair: '${log.at(-1)}'`);
    },
  },
];
