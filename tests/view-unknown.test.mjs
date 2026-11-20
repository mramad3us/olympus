// OLYMPUS tests: view-unknown, the known cells of an unfamiliar place (the build sheet v0.0.23 item 7, §6 B; the user, 2026-11-17: "we see what is in the rooms before entering them, this should not be the case when we start generating procedurally").
//
// The pure parts, in node: src/sim/places/known.js (familiarOf, footprintOf, knownRoomsOf) and src/render/known.js (the cells,
// on the fog's lattice of the area). On the drawn lane 48213 at the fill the footprint's outer band, the catwalk and the booth are
// known and every cell of the three rooms is not; played to its card by the honest tier one, each cell is known from its first
// frame in sight (or its ring's) and never unknown after (F88's node half, flawless-known.mjs cellsGauge: the check holds a known
// cell against perception's visibility, called afresh, so a window put on the wrong cells of the area fails it, as the shifted
// case shows); a save at room 1's entry loads with room 1 known whole and rooms 2 and 3 not (the rebuild from the legs); from v0.0.28
// (the intel) the set house, the named layout B and the live lane are briefed as the drawn house is, their walls known and their rooms'
// insides not, a scene with 'none' knowing only the outside, and the 25 m bay is familiar: no cell made, today's picture. Fails
// without the fix (no known cells: the module is missing). The page half is ui-unknown's (heavy).
import { assert } from './helpers.mjs';
import { createGame, withHouse } from './game.mjs';
import { houseHonestBot, houseKeysBot, houseFuzzBot, runHouse } from './bots/house.mjs';
import { createKnown, UNKNOWN_C, UNKNOWN_HIDDEN, WALL_CELLS } from '../src/render/known.js';
import * as KNOWN from '../src/sim/places/known.js';
import { areaOf } from '../src/sim/places/model.js';
import { planOf } from '../src/sim/places/plan.js';
import { houseSpecOf } from '../src/sim/scenes/assemble.js';
import { cellsGauge, f88Line, CELL_M, KNOWN_ENFORCED } from './flawless-known.mjs';

const fmt = (o) => JSON.stringify(o);
// (the cells whose centres lie inside a rect shrunk by a cell's width: the room's own floor, its walls' cells left out)
function cellsIn(K, rect, shrink = WALL_CELLS + 1) {
  const m = K.mask, [nx, nz] = K.size, out = { n: 0, known: 0 };
  if (!m) return out;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = m.x0 + (i + 0.5) * CELL_M, z = m.z0 + (j + 0.5) * CELL_M, s = shrink * CELL_M;
    if (x > rect[0] + s && x < rect[2] - s && z > rect[1] + s && z < rect[3] - s) { out.n++; if (K.known(i, j)) out.known++; }
  }
  return out;
}
const beginOn = (K, state) => { const area = areaOf(state.places.live.area); return K.begin(state, area, () => ({ familiar: KNOWN.familiarOf(state, area.id), footprint: KNOWN.footprintOf(state), rooms: KNOWN.knownRoomsOf(state) })); };
const laneRooms = (state) => { const A = areaOf(houseSpecOf(state).area); return state.armoury.range.house.rooms.map(L => ({ leg: L.room, rects: A.rooms.filter(r => r.id === L.room || r.id === `${L.room}-far`).map(r => r.rect) })); };

export default [
  {
    name: 'on a drawn lane at the fill (48213): the footprint\'s outer band, the catwalk and the booth known, every cell of the three rooms unknown; the mask a bit a cell (fails without the fix: no known cells)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, draw: 'drawn' }), s = g.state, K = createKnown({ cellM: CELL_M });
      const active = beginOn(K, s), fp = KNOWN.footprintOf(s), m = K.mask, [nx, nz] = K.size;
      const rooms = laneRooms(s).map(r => ({ leg: r.leg, ...r.rects.reduce((a, rc) => { const c = cellsIn(K, rc); return { n: a.n + c.n, known: a.known + c.known }; }, { n: 0, known: 0 }) }));
      const fixed = fp.fixed.map(rc => cellsIn(K, rc, 0)), outside = (() => { let n = 0, k = 0; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = m.x0 + (i + 0.5) * CELL_M, z = m.z0 + (j + 0.5) * CELL_M; if (x < fp.rect[0] || x > fp.rect[2] || z < fp.rect[1] || z > fp.rect[3]) { n++; if (K.known(i, j)) k++; } } return { n, k }; })();
      console.log(`      ${s.places.live.area}: active ${active}, ${nx} × ${nz} cells of ${CELL_M} m, ${K.count} known at the fill; the mask ${m.w} × ${m.h} = ${m.w * m.h} B (a byte a cell would be ${nx * nz} B); UNKNOWN_C ${UNKNOWN_C.toString(16).padStart(6, '0')}, UNKNOWN_HIDDEN ${UNKNOWN_HIDDEN}`);
      console.log(`      outside the footprint ${outside.k} of ${outside.n} known; the fixed parts (catwalk, booth) ${fixed.map(c => `${c.known}/${c.n}`).join(', ')}; the rooms ${rooms.map(r => `${r.leg.split('.').pop()} ${r.known}/${r.n}`).join(', ')}`);
      assert(active && outside.k === outside.n && fixed.every(c => c.known === c.n && c.n > 0), fmt({ active, outside, fixed }));
      assert(rooms.length === 3 && rooms.every(r => r.n > 0 && r.known === 0), fmt(rooms));
      assert(m.w * m.h <= Math.ceil(nx / 8) * nz && m.w * m.h < 4096, fmt({ w: m.w, h: m.h }));
    },
  },
  {
    name: 'F88 (node half): the drawn lane 48213 played to its card by the honest tier one: no cell known before it or its ring was in sight, none unknown again, the mask under UPLOAD_MID_KB; a window put on the wrong cells fails the gauge',
    fn() {
      assert(KNOWN_ENFORCED.has('F88'), 'F88 enforced');
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', draw: 'drawn' }), C = cellsGauge();
      const r = runHouse(g, houseHonestBot(), { each: (gg) => C.each(gg.state) }), F = C.end().F88;
      console.log(`      the lane: ${r.ticks} ticks, ${r.done ? 'to its card' : 'NOT DONE'}`);
      console.log(`      ${f88Line(F)}`);
      assert(r.done && F.ok && F.active && F.insideKnown > 0 && F.recomputes > 10, fmt({ done: r.done, F }));
      // (the teeth: the same lane with every sight put 8 cells (2 m) north of where it was seen)
      const g2 = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', draw: 'drawn' }), K = createKnown({ cellM: CELL_M });
      const shifted = Object.defineProperties({}, Object.getOwnPropertyDescriptors(K));
      shifted.see = (vis, box) => K.see(vis, { ...box, z0: box.z0 - 8 * CELL_M });
      const C2 = cellsGauge({ known: shifted }), r2 = runHouse(g2, houseHonestBot(), { maxTicks: 900, each: (gg) => C2.each(gg.state) }), F2 = C2.end().F88;
      console.log(`      the teeth, the sight 8 cells north (${r2.ticks} ticks): F88 ${F2.ok ? 'MET' : 'OPEN'}, ${F2.unseen.length}${F2.unseen.length >= 6 ? ' or more' : ''} cells known before in sight, the first ${fmt(F2.unseen[0] ?? null)}`);
      assert(!F2.ok && F2.unseen.length > 0, fmt(F2.unseen));
    },
  },
  {
    name: 'the rebuild at a load: a save at room 1\'s entry on the drawn lane loads with room 1 known whole and rooms 2 and 3 unknown, the hall as walked (knownRoomsOf, read from the legs)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', draw: 'drawn' });
      let json = null;
      runHouse(g, houseHonestBot(), { maxTicks: 4000, each: (gg) => { if (!json && gg.state.armoury.range.house.rooms[0].state === 'entered') json = gg.save(); } });
      assert(json, 'room 1 entered on the lane');
      const g2 = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', draw: 'drawn' });
      g2.load(json);
      const s = g2.state, K = createKnown({ cellM: CELL_M }), active = beginOn(K, s), kr = KNOWN.knownRoomsOf(s);
      const rooms = laneRooms(s).map(r => ({ leg: r.leg, ...r.rects.reduce((a, rc) => { const c = cellsIn(K, rc); return { n: a.n + c.n, known: a.known + c.known }; }, { n: 0, known: 0 }) }));
      const hall = kr.find(r => r.known !== 'whole'), A = areaOf(houseSpecOf(s).area), door1 = A.openings.find(o => o.id === s.armoury.range.house.rooms[0].door);
      console.log(`      loaded at ${s.clock.ms - s.armoury.range.house.goAtMs} ms after GO: knownRoomsOf ${kr.map(r => `${r.id.split('.').pop()} ${r.known} [${r.rect.map(v => v.toFixed(2)).join(', ')}]`).join('; ')}`);
      console.log(`      the cells: ${rooms.map(r => `${r.leg.split('.').pop()} ${r.known}/${r.n}`).join(', ')}; the hall walked from x ${hall?.rect[0].toFixed(2)} (room 1's door ${door1.a}–${door1.b})`);
      assert(active && rooms[0].known === rooms[0].n && rooms[1].known === 0 && rooms[2].known === 0, fmt(rooms));
      assert(hall && Math.abs(hall.rect[0] - Math.min(door1.a, door1.b)) < 1e-9, fmt({ hall, door1 }));
    },
  },
  {
    name: 'the intel (v0.0.28, the user\'s note of 2026-11-20: "although we can\'t know what is inside the rooms, the layout would be known most of the time, unless the scenario justifies the lack of intel"): the set house, layout B, the live lane and a drawn house at the fill have every wall cell known and no room\'s floor, nor the cells its boards stand on; a scene with \'none\' knows only the outside; the 25 m bay is familiar (red on v0.0.27: the set house familiar, the drawn one\'s inner walls unknown)',
    fn() {
      const rows = [];
      // (a wall cell: its centre inside a wall run's rect, inside the footprint; the plan's walls, sim/places/plan.js wallsOf)
      const wallCells = (K, fp) => { const m = K.mask, [nx, nz] = K.size, out = { n: 0, known: 0 }; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = m.x0 + (i + 0.5) * CELL_M, z = m.z0 + (j + 0.5) * CELL_M; if (x <= fp.rect[0] || x >= fp.rect[2] || z <= fp.rect[1] || z >= fp.rect[3]) continue; if ((fp.walls ?? KNOWN.footprintOf(K.$s, { familiar: 'walls', area: K.$area }).walls).some(r => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3])) { out.n++; if (K.known(i, j)) out.known++; } } return out; };
      for (const [name, o, rule] of [['the set house', { scenario: 'test-shoothouse', seed: 48213 }], ['layout B', { scenario: 'test-shoothouse', seed: 48213, layout: 'B' }], ['the live lane', { scenario: 'test-shoothouse', seed: 48213, opfor: 'live' }], ['a drawn house', { scenario: 'test-shoothouse', seed: 48213, draw: 'drawn' }], ['the set house, no intel', { scenario: 'test-shoothouse', seed: 48213 }, 'none']]) {
        const g = createGame(o), s = g.state, area = areaOf(s.places.live.area), K = createKnown({ cellM: CELL_M });
        const R = rule ? { familiar: rule, area: 'melas.wheel.s4' } : KNOWN.sceneFamiliar(s), fam = KNOWN.familiarOf(s, area.id, R), fp = KNOWN.footprintOf(s, R);
        const active = K.begin(s, area, () => ({ familiar: fam, footprint: fp, rooms: KNOWN.knownRoomsOf(s) }));
        K.$s = s; K.$area = area.id;
        const floors = laneRooms(s).reduce((a, r) => r.rects.reduce((b, rc) => { const c = cellsIn(K, rc); return { n: b.n + c.n, known: b.known + c.known }; }, a), { n: 0, known: 0 });
        // (the rooms' boards: the hall's west board stands under the catwalk, a fixed part known since v0.0.23, and in your sight from GO)
        const boards = s.armoury.range.turners.filter(T => !T.live && !/\.hall$/.test(T.room ?? '')), boardsKnown = boards.filter(T => K.at(T.x, T.z)).length;
        rows.push({ name, intel: R?.familiar ?? null, fam, active, walls: wallCells(K, fp), floors, boards: boards.length, boardsKnown, fpKeys: Object.keys(fp).join('+') });
      }
      const bay = (() => { const g = createGame({ scenario: 'test-handling', seed: 1 }), s = g.state, K = createKnown({ cellM: CELL_M }); return { fam: KNOWN.familiarOf(s, s.places.live.area), active: beginOn(K, s), host: KNOWN.hostKind(s) }; })();
      for (const r of rows) console.log(`      ${r.name} (${r.intel}): familiar ${r.fam}, cells ${r.active ? 'made' : 'none'}, footprint ${r.fpKeys}; wall cells inside ${r.walls.known} of ${r.walls.n} known; the rooms' floors ${r.floors.known} of ${r.floors.n}; the rooms' boards on a known cell ${r.boardsKnown} of ${r.boards}`);
      console.log(`      the 25 m bay: familiar ${bay.fam}, cells ${bay.active ? 'made' : 'none'}, combat scene ${bay.host}`);
      const briefed = rows.slice(0, 4), none = rows[4];
      assert(briefed.every(r => r.intel === 'walls' && !r.fam && r.active && r.walls.n > 100 && r.walls.known === r.walls.n && r.floors.n > 0 && r.floors.known === 0 && r.boards > 0 && r.boardsKnown === 0), fmt(briefed));
      assert(!none.fam && none.active && none.fpKeys === 'rect+fixed' && none.walls.known < none.walls.n / 2 && none.floors.known === 0, fmt(none));
      assert(bay.fam && !bay.active && bay.host === null, fmt(bay));
    },
  },
  {
    name: 'the review of the picks, finding 8: "every wall, door and hatch drawn from GO" holds for the doors too: under \'walls\' at GO every point of every door\'s and bulkhead hatch\'s line (an opening with a leaf: plan.js kind \'door\') is known on the set house, a drawn house, the eight rooms, the Wreck and the hauler, so a shut door never reads as a gap; a doorway\'s threshold, a room\'s floor, and the rooms\' floors still not (red on the review\'s build: the house\'s doors 1 to 4 of 9 points, the Wreck\'s 3 of 8)',
    fn() {
      const rows = [], bad = [];
      for (const [name, o] of [['the set house', { scenario: 'test-shoothouse', seed: 48213 }], ['a drawn house', { scenario: 'test-shoothouse', seed: 48213, draw: 'drawn' }], ['the eight rooms', { scenario: 'test-shoothouse', seed: 48213, rooms: 'all' }], ['the Wreck', { scenario: 'test-zerocqb', seed: 48213 }], ['the hauler', { scenario: 'test-collar', seed: 48213 }]]) {
        const s = createGame(o).state, area = areaOf(s.places.live.area), K = createKnown({ cellM: CELL_M });
        const active = beginOn(K, s);
        let pts = 0, known = 0;
        const unknown = [];
        for (const d of planOf(area).openings.filter(o => o.kind === 'door')) for (let t = d.a + 0.05; t < d.b; t += 0.1) {
          const [x, z] = d.axis === 'x' ? [t, d.at] : [d.at, t];
          pts++; if (K.at(x, z)) known++; else if (unknown.length < 3) unknown.push(d.id);
        }
        const floors = s.armoury?.range?.house?.rooms?.length && !area.decks ? laneRooms(s).reduce((a, r) => r.rects.reduce((b, rc) => { const c = cellsIn(K, rc); return { n: b.n + c.n, known: b.known + c.known }; }, a), { n: 0, known: 0 }) : null;
        rows.push(`${name}: cells ${active ? 'made' : 'none'}; the doors' points known ${known} of ${pts}${unknown.length ? ` (${unknown.join(', ')})` : ''}${floors ? `; the rooms' floors ${floors.known} of ${floors.n}` : ''}`);
        if (!active || !pts || known !== pts || (floors && (floors.n === 0 || floors.known > 0))) bad.push(name);
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, fmt({ bad, rows }));
    },
  },
  {
    name: 'F88 (heavy): drawn lanes by the honest tier one, the keys private and the fuzz on four seeds each: no cell known before in sight, none unknown again',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const seeds = [48213, 11, 1037, 4028068471], bots = { honest: () => houseHonestBot(), keys: () => houseKeysBot(), fuzz: () => houseFuzzBot({ seed: 3 }) }, tiers = { honest: 'tierone', keys: 'private', fuzz: 'private' };
      const bad = [];
      let lanes = 0;
      for (const seed of seeds) for (const [b, mk] of Object.entries(bots)) {
        const g = withHouse({ draw: 'drawn' }, () => createGame({ scenario: 'test-shoothouse', seed, tier: tiers[b] })), C = cellsGauge();
        const r = runHouse(g, mk(), { maxMs: 10 * 60_000, each: (gg) => C.each(gg.state) }), F = C.end().F88;
        lanes++;
        console.log(`      ${b} ${seed}: ${r.ticks} ticks${r.done ? '' : ' (not done)'}; ${f88Line(F).slice(0, 240)}`);
        if (!F.ok || !F.active) bad.push({ b, seed, F });
      }
      console.log(`      ${lanes} lanes, ${bad.length} OPEN`);
      assert(!bad.length, fmt(bad.map(x => ({ b: x.b, seed: x.seed, unseen: x.F.unseen, lost: x.F.lost }))));
    },
  },
];
