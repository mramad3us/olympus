// OLYMPUS render: the light of the live area, from places' light helper, onto the stage each frame.
//
// VIEWS §2.7 and TECH §9.6, built at 0.0.3. Places computes the light (src/sim/places/light.js: lampsOf,
// lightingOf, lightLevel, and skyAt, which carries sun.js's sunAt: the elevation, `eclipsed`); this module copies it into the stage, as
// the hub asks ("the view copies its numbers into three.js"), through src/render/light-maps.js's pure
// maps:
//   - outdoors (an area of kind 'ground'): the rig is the Mars sky's row at the sun's elevation from
//     skyAt (the sun's colour and strength, the sky's fill and the ground's bounce, the glow of lamps and
//     windows, the shadows' strength), the key light off and the shadows gone while the canyon wall or a
//     body hides the disc (`eclipsed`: the canyon's shade at dawn and dusk), its height from sunAt in
//     whole degrees (its screen azimuth the art's upper left, VIEWS §2.7);
//   - indoors (a floor): the rig is the calibrated one (a front face shows its painted colour), and each
//     room is lit by its own fill through the room map (a bay at lights out next to its lit head), its
//     colour by its lighting state (day, evening, lights out); the night lights' lenses glow at lights out;
//   - everywhere: the static pools of lampsOf (night lights, the fire watch's red lamp, desk lamps, exit
//     lamps, street lamps, the fence's floods) in the tiled lamp table, re-sent only when places hands a
//     new array (lampsOf keeps the same object until a lamp changes);
//   - a figure's tint: exposure(lightLevel at its feet) in the colour of its light (light-maps.js tintOf).
// What it reads, it reads through the module namespace, so the stage runs against 0.0.2's places (a
// lightLevel of 1 everywhere, no lamps table) as against 0.0.3's: a function places does not offer yet
// falls back to the area's authored lamps, a fill of 1 and the mood by the hour (moods.js).
// stats: { kind, table (pools in the table), slots (dynamic slots in use), overflow, fills, uploads }.
import * as THREE from 'three';
import * as LIGHT from '../sim/places/light.js';
import { SHARED } from './materials.js';
import { MOODS } from './moods.js';
import { lampMaps, roomMap, roomFills, tintOf, poolAt, exposure, FILL_COLOURS } from './light-maps.js';
import { linear } from '../art/tone.js';
import { marsClock } from '../core/calendar.js';
import { roomAt, planOf } from '../sim/places/plan.js';

/** The interior rig: the calibration (a hemisphere fill of 0.6 and a key of 0.79, × π: painted = shown), a soft shadow. */
export const INTERIOR_RIG = Object.freeze({ sky: 0xe8eaf0, ground: 0x8f8a80, skyK: 0.6, sun: 0xfff4e6, sunK: 0.79, shadow: 0.35 });
/** The background round a cutaway (the dark) and beyond a ground's apron. */
export const BG_INDOOR = 0x14151c, BG_OUTDOOR = 0x2a1f22;
const DAY_FROM_H = 6, NIGHT_FROM_H = 19;

const lumaLin = (hex) => { const c = linear(hex); return 0.30 * c[0] + 0.59 * c[1] + 0.11 * c[2]; };
/** The calibrated rig's light (VIEWS §2.7's ≥ 20° row: a sky fill of 0.6 and a key of 0.79), as the luma both give. */
const RIG_FULL = 0.6 * lumaLin(0xc4d0ea) + 0.79 * lumaLin(0xfff1de);
/** The gain that makes a row's rig show `want` of the calibrated light (1 at the full row; never below it). */
export function rigGain(sky, skyK, sun, sunK, want) {
  const L = (skyK * lumaLin(sky) + sunK * lumaLin(sun)) / RIG_FULL;
  return L > 1e-4 ? Math.max(1, Math.min(60, want / L)) : 1;
}

const dataTex = (data, w, h, type, filter = THREE.NearestFilter) => {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, type);
  t.minFilter = t.magFilter = filter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
};

/**
 * The light of the live area: { setArea(area), frame(state, area, info) → { kind, dimK, elevDeg },
 * tintAt(state, x, z), stats, dispose() }. info: { ms, lonEDeg, siteId, heldMood (a MOODS name: the
 * samples' and the debug's override) }.
 */
export function createLighting(stage) {
  let area = null, lampsRef = null, maps = null, table = null, grid = null, room = null, roomKey = null;
  let fillMin = -1, fillsNow = new Map(), coloursNow = new Map(), lightingNow = new Map(), lampsNow = [], sky = null;
  const stats = { kind: null, table: 0, slots: 0, overflow: 0, fills: 0, uploads: { lamps: 0, rooms: 0 }, rig: null };

  function setArea(a) {
    area = a; lampsRef = null; maps = null; roomKey = null; fillMin = -1;
    fillsNow = new Map(); coloursNow = new Map(); lightingNow = new Map(); lampsNow = [];
    stats.kind = a?.kind ?? null;
    SHARED.uLampBox.value.w = 0;
    SHARED.uRoomBox.value.set(0, 0, 0, 0);
  }

  // (the lamps of the area now: places' lampsOf, else the area's authored lamps, all lit)
  function lampsOf(state, ms) {
    if (typeof LIGHT.lampsOf === 'function') return LIGHT.lampsOf(state, area.id, ms) ?? [];
    return area.look?.lamps ?? [];
  }
  const levelAt = (state, x, z, ms) => (typeof LIGHT.lightLevel === 'function' ? LIGHT.lightLevel(state, x, z, ms, area.id) : 1);
  const lightingOf = (state, roomId, ms) => (typeof LIGHT.lightingOf === 'function' ? LIGHT.lightingOf(state, area.id, roomId, ms) : 'day');
  const fillColour = (lighting) => FILL_COLOURS[lighting] ?? FILL_COLOURS.day;

  function sendLamps(lamps) {
    const b = area.boundsM;
    maps = lampMaps(lamps, { x0: b.x0 - 4, z0: b.z0 - 4, x1: b.x1 + 4, z1: b.z1 + 4 });
    const W = 256;
    if (!table || table.image.height !== maps.rows) { table?.dispose(); table = dataTex(maps.table, W, maps.rows, THREE.FloatType); }
    else { table.image.data = maps.table; table.needsUpdate = true; }
    if (!grid || grid.image.width !== maps.nx || grid.image.height !== maps.nz) { grid?.dispose(); grid = dataTex(maps.grid, maps.nx, maps.nz, THREE.FloatType); }
    else { grid.image.data = maps.grid; grid.needsUpdate = true; }
    SHARED.uLampTable.value = table; SHARED.uLampGrid.value = grid;
    SHARED.uLampBox.value.set(maps.x0, maps.z0, maps.cellM, maps.n ? 1 : 0);
    SHARED.uLampN.value.set(maps.nx, maps.nz);
    stats.table = maps.n; stats.overflow = maps.overflow; stats.uploads.lamps++;
  }

  function sendRooms(state, ms, lamps) {
    const fills = roomFills(area, lamps, (x, z) => levelAt(state, x, z, ms));
    const colours = new Map();
    for (const r of area.rooms ?? []) { const l = lightingOf(state, r.id, ms); lightingNow.set(r.id, l); colours.set(r.id, fillColour(l)); }
    fillsNow = fills; coloursNow = colours; stats.fills = fills.size;
    const m = roomMap(area, fills, colours);
    if (m.key === roomKey && room) return;
    roomKey = m.key;
    if (!room || room.image.width !== m.nx || room.image.height !== m.nz) { room?.dispose(); room = dataTex(m.data, m.nx, m.nz, THREE.UnsignedByteType); }
    else { room.image.data = m.data; room.needsUpdate = true; }
    SHARED.uRoomMap.value = room;
    SHARED.uRoomBox.value.set(...m.box);
    SHARED.uRoomOut.value.setRGB(...m.mean);
    stats.uploads.rooms++;
  }

  /** A frame's light for the live area: the rig, the pools, the rooms. */
  function frame(state, a, { ms = state?.clock?.ms ?? 0, lonEDeg = 0, siteId = a?.site ?? null, heldMood = null } = {}) {
    if (a !== area) setArea(a);
    if (!area || !state) return { kind: null, dimK: 0.48 };
    const lamps = lampsOf(state, ms);
    if (lamps !== lampsRef) { lampsRef = lamps; lampsNow = lamps; sendLamps(lamps); fillMin = -1; }
    const outdoor = area.kind === 'ground';
    let mood, dimK, elevDeg = null;
    if (heldMood && MOODS[heldMood]) { mood = MOODS[heldMood]; dimK = mood.dimK; SHARED.uAmbientK.value = 0; }
    else if (outdoor) {
      sky = typeof LIGHT.skyAt === 'function' ? LIGHT.skyAt(siteId, ms) : null;
      if (sky) {
        // (the row's rig scaled so it shows the open air's level through the eye's exposure, as every
        // tint and every pool does: at noon the row as VIEWS writes it, at night the dark between the
        // lamps a tenth of the painted colours, not a three-hundredth)
        const sun0 = sky.eclipsed ? 0 : (sky.sunK ?? 0), g = rigGain(sky.skyColor ?? 0x8a96c8, sky.skyK ?? 0.4, sky.sunColor ?? 0xfff1de, sun0, exposure(sky.level ?? 1));
        const sun = sun0 * g;
        mood = { name: 'sky', background: BG_OUTDOOR, sun: sky.sunColor ?? 0xfff1de, sunK: sun, sky: sky.skyColor ?? 0x8a96c8, ground: sky.ground ?? 0x6a4a44, skyK: (sky.skyK ?? 0.4) * g,
          shadow: sky.eclipsed ? 0 : (sky.shadow ?? 1) * 0.8, tint: sky.tint ?? [1, 1, 1], lamps: {}, lampColour: {},
          glow: { lamp: sky.glow ?? 0, night: sky.glow ?? 0, strip: 0, battle: 0, emergency: 0, screen: 1 }, stripLight: [0, 0, 0], battleLight: [0, 0, 0] };
        elevDeg = sky.elevDeg ?? null;
        dimK = 0.18 + 0.3 * exposure(sky.level ?? 1);
        SHARED.uAmbientK.value = exposure(sky.level ?? 1);
      } else {
        const h = marsClock(ms, lonEDeg).hour;
        mood = h >= DAY_FROM_H && h < NIGHT_FROM_H ? MOODS.day : MOODS.night; dimK = mood.dimK;
        SHARED.uAmbientK.value = mood === MOODS.day ? 1 : 0.1;
      }
    } else {
      // (a floor: its rooms' fills each game minute, or when the lamps change; the rig calibrated)
      const minute = Math.floor(ms / 60_000);
      if (minute !== fillMin) { fillMin = minute; sendRooms(state, ms, lamps); }
      const night = [...lightingNow.values()].some(l => l === 'lightsOut');
      // (the windows show the open air's light: glow class LAMP, the sky's level through the eye)
      const out = typeof LIGHT.skyAt === 'function' && siteId ? exposure(LIGHT.skyAt(siteId, ms).level ?? 1) : 1;
      mood = { name: night ? 'lightsOut' : 'interior', background: BG_INDOOR, ...INTERIOR_RIG, tint: [1, 1, 1], lamps: {}, lampColour: {},
        glow: { lamp: out, night: night ? 1 : 0, strip: 0, battle: 0, emergency: 0, screen: 1 }, stripLight: [0, 0, 0], battleLight: [0, 0, 0] };
      const you = state.actors?.list?.find(x => x.id === state.player?.actor);
      dimK = 0.18 + 0.3 * exposure(you ? levelAt(state, you.x, you.z, ms) : 0.75);
    }
    stage.setLight(mood);
    if (elevDeg !== null) stage.setSunElevation(elevDeg);
    stats.rig = mood.name;
    return { kind: outdoor ? 'ground' : 'floor', dimK, elevDeg, eclipsed: !!sky?.eclipsed, sunK: mood.sunK };
  }

  /** The tint a figure at (x, z) takes now: places' level through the exposure, in its light's colour. */
  function tintAt(state, x, z, ms = state.clock.ms) {
    if (!area) return [1, 1, 1];
    const L = levelAt(state, x, z, ms), pool = poolAt(lampsNow, x, z);
    let base;
    if (area.kind === 'ground') base = sky ? (sky.tint ? sky.tint : linear(sky.skyColor ?? 0xffffff)) : MOODS.day.tint;
    else { const r = area.rooms?.length ? roomAt(planOf(area), x, z) : null; base = linear(r ? coloursNow.get(r.id) ?? FILL_COLOURS.day : FILL_COLOURS.day); }
    return tintOf(L, base, pool);
  }

  return {
    setArea, frame, tintAt, stats,
    get lamps() { return lampsNow; }, get fills() { return fillsNow; }, get sky() { return sky; },
    dispose() { table?.dispose(); grid?.dispose(); room?.dispose(); SHARED.uLampBox.value.w = 0; SHARED.uRoomBox.value.set(0, 0, 0, 0); },
  };
}
