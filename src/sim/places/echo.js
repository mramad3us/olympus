// OLYMPUS places: Echo Company's barracks, both floors, built from its tables into two frozen area records.
//
// src/data/places/echo.js authors the building (PLACES §4.4; the build sheet 0.0.3 §2.1): the east
// wing's rooms, doors and pieces, the core's on each floor, the three squad bay layouts in a room's
// own frame and which bay takes which, the lamps, the posts, the stairs and the outside doors. This
// module does the derivation the tables leave to a rule of their own numbers (TECH §2.4: no logic in
// data), at load, the same in every career (nothing here reads a seed of the world):
//   - each wing is laid in the east wing's frame, its bays' layouts placed at the room's north-west
//     corner, then the west wing mirrored about the core's centre line (x' = 84 − x, a face turned left
//     for right), so a mirrored bay is its layout mirrored;
//   - ids: a room `<code>.<key>` (e1.bay-2-1), its zone `<code>.z.<key>` (the hallways and the lobby,
//     joined by doorways, share `<code>.z.hall`), an opening `o:<code>:<key>` (o:e1:bay-2-1, the outside
//     doors o:e1:front, o:e1:east-exit, o:e1:west-exit), a fixture `f:<code>:<room key>:<name>`;
//   - a rack lists its berths (BERTH_ORDER's billets by the layout's slots, lower first; HQ_BERTHS in a
//     platoon's rack room) and each berth's locker and footlocker (lockerIds, footlockerIds);
//   - a piece's look seed: the kind's next of the six authored SEEDS, in the order the pieces are laid;
//   - lamps: a bay's ceiling panels from its layout, one panel per 12 m² elsewhere on a regular grid
//     (PLACES §9.6's "one lamp per 12 m²"), a night light at every night emergencyLight, an exit glow at
//     every exit sign, and the tables' desk and red lamps; the squads' stencils on the north wall;
//   - the links (the three stairs, stops at the flight's middle on both floors) and the portals: each
//     stair's band on floor 1 across the flight 0.8 m below its top (out 's', the way up), on floor 2
//     the well's top edge (out 'n', the way down), each arriving 0.7 m past the other floor's band; the
//     outside doors' bands on their walls (out 's'), arriving 0.9 m out on the ground.
// The records keep TEST_AREA's shape with the sheet's additions (rooms' surface, lighting, owner,
// layout, windows; openings' leaf, openS, closeS; fixtures' berths, lockerIds, footlockerIds, faces,
// dir; links, portals, posts; look.decor and look.lamps with kinds). Frozen.
import {
  ECHO, SEEDS, WINGS, BAY_LAYOUTS, BERTH_ORDER, HQ_BERTHS, LAYOUTS, WING_ROOMS, WING_DOORS, WING_FIXTURES,
  CORE_ROOMS, CORE_DOORS, CORE_FIXTURES, LAMPS, POSTS, STAIRS, STAIR_BANDS, EXITS, SPAWNS, FINISH,
} from '../../data/places/echo.js';
import { LAMP_KINDS } from '../../data/places/sky.js';

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };
const r4 = (v) => { const r = Math.round(v * 10000) / 10000; return r === 0 ? 0 : r; };
const MIRROR_FACE = Object.freeze({ left: 'right', right: 'left', up: 'up', down: 'down' });
/** A room's clear height, metres (PLACES §1.1: base buildings 3.0 m). */
export const CEILING_M = 3.0;
/** A ceiling panel lights at most this much floor (PLACES §9.6: one lamp per 12 m²). */
export const LAMP_AREA_M2 = 12;
const OPEN_S = Object.freeze({ door: 1.0, extDoor: 1.2 });         // (PLACES §1.6: open and close seconds)

// (a template's keys filled: {p} the platoon, {P} its name, {s} the stair's side letter, {S} its name, {side} the side's word)
const fill = (t, w) => t.replace(/\{p\}/g, w.p).replace(/\{P\}/g, w.platoon).replace(/\{s\}/g, w.stair).replace(/\{S\}/g, w.stair === 'e' ? 'East' : 'West').replace(/\{side\}/g, w.stair === 'e' ? 'east' : 'west');
const onFloor = (rec, level) => !(rec.floor1 && level !== 1) && !(rec.floor2 && level !== 2);

// (one wing in the east wing's frame: rooms, openings, pieces, lamps, stencils)
function wing(level, w) {
  const rooms = [], openings = [], pieces = [], lamps = [], decor = [];
  for (const r of WING_ROOMS) {
    if (!onFloor(r, level)) continue;
    const key = fill(r.key, w), bay = r.bay !== undefined ? w.bays[r.bay] : null;
    rooms.push({ key, kind: r.kind, rect: [...r.rect], name: bay ? bay.name : fill(r.name, w), lighting: r.lighting, surface: r.surface, color: r.color,
      owner: bay ? { unitId: bay.unit } : r.hq ? { unitId: w.unit } : null, layout: bay ? BAY_LAYOUTS[key] : null, windows: r.windows ?? 0, serves: r.serves ?? null });
    if (!bay) continue;
    // (the bay's layout, placed at the room's north-west corner)
    const L = LAYOUTS[BAY_LAYOUTS[key]], [x0, z0] = r.rect;
    openings.push({ key, kind: 'door', axis: 'x', at: r.rect[3], a: x0 + L.door[0], b: x0 + L.door[1], rooms: [key, fill('hall-{p}', w)], state: 'closed' });
    for (const p of L.pieces) pieces.push({ ...p, room: key, x: x0 + p.x, z: z0 + p.z, bayUnit: bay.unit });
    for (const [lx, lz] of L.lamps) lamps.push({ kind: 'ceiling', x: x0 + lx, z: z0 + lz, y: CEILING_M, room: key });
    decor.push({ kind: 'stencil', x: x0 + L.stencilX, y: 2.2, text: bay.stencil, room: key });
  }
  for (const o of WING_DOORS) if (onFloor(o, level)) openings.push({ ...o, key: fill(o.key, w), rooms: o.rooms.map(k => (k === 'outside' ? k : fill(k, w))) });
  for (const f of WING_FIXTURES) if (onFloor(f, level)) pieces.push({ ...f, room: fill(f.room, w), hqBerths: f.hq !== undefined ? HQ_BERTHS[f.hq] : undefined });
  return { rooms, openings, pieces, lamps, decor };
}
// (a wing turned into the west: x' = 84 − x, faces left for right)
function mirror(part) {
  const M = ECHO.mirrorX, mx = (x) => r4(M - x);
  return {
    rooms: part.rooms.map(r => ({ ...r, rect: [mx(r.rect[2]), r.rect[1], mx(r.rect[0]), r.rect[3]] })),
    openings: part.openings.map(o => (o.axis === 'x' ? { ...o, a: mx(o.b), b: mx(o.a) } : { ...o, at: mx(o.at) })),
    pieces: part.pieces.map(p => ({ ...p, x: mx(p.x), face: MIRROR_FACE[p.face] })),
    lamps: part.lamps.map(l => ({ ...l, x: mx(l.x) })),
    decor: part.decor.map(d => ({ ...d, x: mx(d.x) })),
  };
}

// (a room's ceiling panels on a regular grid: one per LAMP_AREA_M2 at most, at least one)
function panelsOf(room) {
  const [x0, z0, x1, z1] = room.rect, w = x1 - x0, d = z1 - z0;
  const nx = Math.max(1, Math.round(w / Math.sqrt(LAMP_AREA_M2))), nz = Math.max(1, Math.round(d / Math.sqrt(LAMP_AREA_M2)));
  const out = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) out.push({ kind: 'ceiling', x: r4(x0 + (i + 0.5) * w / nx), z: r4(z0 + (j + 0.5) * d / nz), y: CEILING_M, room: room.key });
  return out;
}

/** Build one floor's record from the tables (see the header). */
export function buildFloor(floor) {
  const level = floor.level, code = floor.code, W = WINGS[floor.id];
  const east = wing(level, W.east), west = mirror(wing(level, W.west));
  const core = { rooms: CORE_ROOMS[floor.id].map(r => ({ ...r, owner: null, layout: null, windows: 0, serves: null })), openings: CORE_DOORS[floor.id].map(o => ({ ...o })), pieces: CORE_FIXTURES[floor.id].map(f => ({ ...f })) };
  const roomsIn = [...core.rooms, ...east.rooms, ...west.rooms];
  const rid = (key) => `${code}.${key}`;
  const HALLS = new Set(['hall-core', 'lobby', fill('hall-{p}', W.east), fill('hall-{p}', W.west)]);
  // (rooms)
  const seedOf = (() => { const n = {}; return (kind) => { const k = (n[kind] = (n[kind] ?? -1) + 1); return SEEDS[k % SEEDS.length]; }; })();
  const rooms = roomsIn.map(r => {
    const rec = { id: rid(r.key), kind: r.kind, name: r.name, rect: r.rect.map(r4), ceilingM: CEILING_M, zone: HALLS.has(r.key) ? `${code}.z.hall` : `${code}.z.${r.key}`,
      floor: { kind: r.surface === 'tile' ? 'tile' : r.surface === 'concrete' ? 'concrete' : 'vinyl', color: r.color, seed: seedOf('floor') }, surface: r.surface, lighting: r.lighting };
    if (r.owner) rec.owner = { ...r.owner };
    if (r.layout) rec.layout = r.layout;
    if (r.windows) rec.windows = r.windows;
    if (r.serves) rec.serves = r.serves;
    return rec;
  });
  const zones = [];
  for (const r of rooms) { const z = zones.find(x => x.id === r.zone); if (z) z.rooms.push(r.id); else zones.push({ id: r.zone, rooms: [r.id] }); }
  // (openings)
  const openings = [...core.openings, ...east.openings, ...west.openings].map(o => {
    const rec = { id: `o:${code}:${o.key}`, kind: o.kind, axis: o.axis, at: r4(o.at), a: r4(o.a), b: r4(o.b), rooms: o.rooms.map(k => (k === 'outside' ? k : rid(k))), state: o.state };
    if (OPEN_S[o.kind]) Object.assign(rec, { leaf: 'hinged', openS: OPEN_S[o.kind], closeS: OPEN_S[o.kind] });
    return rec;
  });
  // (fixtures: ids, seeds, berths and their lockers)
  const pieces = [...core.pieces, ...east.pieces, ...west.pieces];
  const fid = (p) => `f:${code}:${p.room}:${p.name}`;
  const fixtures = pieces.map(p => {
    const rec = { id: fid(p), kind: p.kind, make: p.make, x: r4(p.x), z: r4(p.z), face: p.face, room: rid(p.room), seed: seedOf(p.kind) };
    for (const k of ['y', 'mount', 'dir']) if (p[k] !== undefined) rec[k] = p[k];
    if (p.faces) rec.faces = [...p.faces];
    if (p.look) rec.look = { ...p.look };
    return rec;
  });
  const byRoom = (room) => pieces.map((p, i) => [p, fixtures[i]]).filter(([p]) => p.room === room);
  pieces.forEach((p, i) => {
    const f = fixtures[i];
    if (p.slots) {                                                  // (a bay's rack: its berths by slot; the weapons platoon's stand empty)
      const generated = !String(p.bayUnit).includes('-4-');
      const mates = byRoom(p.room);
      f.berths = p.slots.map(s => (generated ? BERTH_ORDER[s] : null));
      f.lockerIds = p.slots.map(s => mates.find(([m]) => m.kind === 'wallLocker' && m.of?.includes(s))?.[1].id ?? null);
      f.footlockerIds = p.slots.map(s => mates.find(([m]) => m.kind === 'footlocker' && m.of?.includes(s))?.[1].id ?? null);
    } else if (p.hqBerths) {                                        // (a platoon's HQ rack)
      const mates = byRoom(p.room), k = p.hq;
      f.berths = [...p.hqBerths];
      f.lockerIds = [0, 1].map(b => mates.find(([m]) => m.hqOf && m.hqOf[0] === k && m.hqOf[1] === b)?.[1].id ?? null);
      f.footlockerIds = [null, null];
    }
  });
  // (lamps: ceiling panels, night lights, exit glows, the tables' own)
  const lampsIn = [...east.lamps, ...west.lamps];
  for (const r of roomsIn) if (!r.layout) lampsIn.push(...panelsOf(r));
  for (const f of fixtures) {
    if (f.kind === 'emergencyLight' && f.make === 'night') lampsIn.push({ kind: 'night', x: f.x, z: f.z, y: f.y ?? 0.3, room: f.room.slice(code.length + 1) });
    if (f.kind === 'sign' && f.make === 'exit') lampsIn.push({ kind: 'exit', x: f.x, z: f.z, y: f.y ?? 2.0, room: f.room.slice(code.length + 1) });
  }
  lampsIn.push(...LAMPS[floor.id]);
  const lamps = lampsIn.map(l => ({ x: r4(l.x), z: r4(l.z), y: l.y, r: LAMP_KINDS[l.kind]?.r ?? 0, kind: l.kind, room: rid(l.room) }));
  const decor = [...east.decor, ...west.decor].map(d => ({ ...d, x: r4(d.x), room: rid(d.room) }));
  // (posts)
  const posts = POSTS[floor.id].map(p => ({ id: p.id, unitId: p.unitId, seatId: `f:${code}:${p.seat[0]}:${p.seat[1]}#${p.seat[2]}` }));
  // (stairs: the links, and the portals each way)
  const B = STAIR_BANDS, links = [], portals = [];
  const other = ECHO.floors.find(f => f.id !== floor.id);
  for (const st of STAIRS) {
    const base = st.mirrorOf ? STAIRS.find(s => s.key === st.mirrorOf) : st;
    const x = st.mirrorOf ? r4(ECHO.mirrorX - base.x) : base.x, a = st.mirrorOf ? r4(ECHO.mirrorX - base.b) : base.a, b = st.mirrorOf ? r4(ECHO.mirrorX - base.a) : base.b;
    links.push({ id: st.link, kind: 'stairs', stops: ECHO.floors.map(f => ({ area: f.id, x, z: base.z, face: 'up' })) });
    portals.push(level === 1
      ? { id: st.link, kind: 'stairs', via: st.link, band: { axis: 'x', at: B.upBandZ, a, b, out: 's' }, to: { area: other.id, x, z: B.arriveUpZ, face: 'down' } }
      : { id: st.link, kind: 'stairs', via: st.link, band: { axis: 'x', at: B.downBandZ, a, b, out: 'n' }, to: { area: other.id, x, z: B.arriveDownZ, face: 'up' } });
  }
  // (the outside doors: the ground's points)
  for (const e of EXITS) {
    const o = openings.find(x => x.id === `o:${code}:${e.door}`);
    if (!o) continue;
    portals.push({ id: o.id, kind: 'door', via: o.id, band: { axis: 'x', at: o.at, a: o.a, b: o.b, out: 's' }, to: { area: 'melas.ground', x: e.out.x, z: e.out.z, face: 'down' } });
  }
  return deepFreeze({
    id: floor.id, site: ECHO.site, kind: 'floor', code, name: floor.name, short: ECHO.name, level,
    originM: [ECHO.originM[0], r4((level - 1) * ECHO.storeyM), ECHO.originM[2]],
    boundsM: { ...floor.boundsM }, spawn: { ...SPAWNS[floor.id] },
    rooms, openings, fixtures, zones, links, portals, posts,
    look: { palette: 'mars', finish: { ...FINISH }, decor, lamps },
  });
}

/** Echo's ground floor (melas.echo.1): 2nd Platoon east, 1st Platoon west, the company's core. */
export const ECHO_1 = buildFloor(ECHO.floors[0]);
/** Echo's first floor (melas.echo.2): the Weapons Platoon east, 3rd Platoon west, the classroom and the study room. */
export const ECHO_2 = buildFloor(ECHO.floors[1]);
/** Where an outside door leads in from the ground: the ground's portal id → { opening, area, x, z, face }. */
export const ECHO_ENTRIES = deepFreeze(EXITS.map(e => ({ ground: e.ground, opening: `o:e1:${e.door}`, to: { area: ECHO.floors[0].id, x: e.in.x, z: e.in.z, face: 'up' } })));
