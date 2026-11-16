// OLYMPUS data: the shoot house's light, three candidates to score (FL-9, the v0.0.20 feel round; samples/house-light).
//
// The house's light was my call in v0.0.12 and was never sampled (the user's rule: "the look is chosen from numbered
// samples they score", CLAUDE.md). The game keeps HL-a, today's light, until the user picks: a candidate is a runtime
// key, state.$houseLight ('HL-b' or 'HL-c'; never saved, the URL's &houselight=b|c or the sample's page), and with
// none every light number, every pixel and every roll is v0.0.19's (tests/house-light.test.mjs holds it).
//
// What today's house is (src/data/places/wheel.js, sky.js): every room of house 1 is of kind cqbRoom, which no
// lighting class names, so it follows the base's clock as an office does (VIEWS §2.7: the day overheads, fill 0.75 in
// neutral white 0xf2f0ea); room 3 is cqbDim, 0.40 at every hour (COMBAT §25.10.4: "dim light the instructor sets");
// the hall and the apron are lit as the rooms. The lamps over each room's centre are ceiling lamps, the fill, so no
// room has a pool. The shots read darker than these numbers say for two reasons that are not the light: the fog of
// awareness (src/render/post.js dim(): the unseen greyed and taken to dimK, 0.48 under a 0.75 fill, after the gamma)
// and the solid voids of layouts B and C between the lane's rooms, which are dark massing, not unlit rooms.
//
// A real shoot house is lit from above. Its rooms have no ceilings, so that the instructors on the catwalk can see
// down into every one, and the light comes from the building's high-bay fixtures over the catwalk (high-pressure sodium
// or metal halide in the older ones, LED high bays of about 4,000 to 5,000 K in the newer), aimed down through the
// open tops; the control booth dims them for low-light runs, and some houses hang lamps inside a room to stage it.
// The Wheel's sector has the space for that: 8 m clear over the houses (PLACES §4.15), the catwalk at 3 m.
//   HL-a  today's: the clock's overheads, room 3 dim (the game's until the user picks).
//   HL-b  the floods from the catwalk: the sector's high bays and the catwalk's floods, LED cool white (the floods'
//         own lamp, sky.js LAMP_KINDS.flood: 0xe8ecf4, S/P 1.9), light every room of the house, the hall and the
//         apron as one lit space at the hall's fill, 0.75, at every hour the house is used; room 3 is lit as the hall
//         (its dim, a course rule, goes with this candidate: see the sample's note). What you have not seen is dimmed
//         by the fog alone, so the unseen reads the same wherever you stand (dimK 0.48 everywhere in the house).
//   HL-c  warm pools over each room's centre, darker corners: a pendant over each room's middle (a warm-white lamp,
//         0xfff4e6, the interior rig's own key, S/P 1.2; 0xffd9a8 (3,000 K) and 0xffe6b8 (3,500 K) both snapped the pool's
//         core to a salmon pink in the Mars palette, the review of 2026-11-16 found, so the warmth is the spill's) gives a pool
//         whose core brings the room to the hall's 0.75 and whose ring to 0.50, over a low fill of 0.30, the pendants'
//         spill off the concrete (warm, 0xece0cc); room 3 keeps its dim at the centre
//         (0.15 fill and a weaker pendant, 0.40 in its core, today's level there). The radii keep each ring inside its
//         room (pixel art's pool: a hard core to r, a ring to 1.5 r; places counts no wall), so the hall and the booth
//         are as today. The corners then show 58% of their painted colour (exposure(0.30)), the ring 78%, the core 100%.
//         The fog's dim follows the light where you stand (lighting.js: dimK 0.18 + 0.3 × exposure there), so under
//         HL-c the whole unseen picture darkens as you step out of a pool into a room's spill (0.35 at 0.30).
// Each candidate is the same light model (src/sim/places/light.js): rooms' lighting classes, moods and lamp kinds, so
// perception's reach (10 m + 42 m × the light), the take-in and the shot read the candidate's light as the picture
// shows it (the hub: one quantity, one number). Pure data, frozen.
import { MOODS, LAMP_KINDS } from './sky.js';

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The area the candidates light (house 1 and its apron: src/data/places/wheel.js WHEEL_S4). */
export const HOUSE_LIGHT_AREA = 'melas.wheel.s4';
/** The candidates' ids, in order; HL-a is today's (no key on the state). */
export const HOUSE_LIGHT_IDS = Object.freeze(['HL-a', 'HL-b', 'HL-c']);

/** The house rooms by id (wheel.js LAYOUT_A's ids), the hall, the apron's four strips. */
const LANE_ROOMS = ['w4.r1', 'w4.r2', 'w4.closet', 'w4.r3', 'w4.r3-far'];
const APRON = ['w4.apron-n', 'w4.apron-e', 'w4.apron-s', 'w4.apron-w'];

// (HL-b: the floods; their colour and S/P the floods' own lamp's, their fill the day overheads' (the hall's today))
const FLOOD = { color: LAMP_KINDS.flood.color, fill: MOODS.day.fill, sp: LAMP_KINDS.flood.sp };
// (HL-c: the pendants' spill off the concrete, and the pendant pools; room 3's weaker, so its centre is today's dim)
const SPILL = 0xece0cc, PENDANT = 0xfff4e6;

/**
 * The candidates: { id, name, about, areas: { <area id>: { rooms (room id → lighting class), classes (the classes it
 * adds: { always, nightLights }, as sky.js CLASSES), moods (the moods it adds: { color, fill, sp }, as sky.js MOODS),
 * kinds (the lamp kinds it adds, as sky.js LAMP_KINDS; a kind with no r takes each lamp's own), lamps (lamps added to
 * the area's look.lamps: { x, z, r, kind, room }) } } }. HL-a has no areas: today's light.
 */
export const HOUSE_LIGHTS = deepFreeze({
  'HL-a': { id: 'HL-a', name: 'today\'s light', about: 'The base\'s overheads by the clock (0.75 by day), room 3 dim (0.40): v0.0.19 as built.', areas: {} },
  'HL-b': {
    id: 'HL-b', name: 'floods from the catwalk', about: 'The sector\'s high bays and the catwalk\'s LED floods light the open-top house as one: every room, the hall and the apron at 0.75 in cool white; the fog alone dims the unseen.',
    areas: {
      [HOUSE_LIGHT_AREA]: {
        rooms: Object.fromEntries([...LANE_ROOMS, 'w4.hall', ...APRON].map(id => [id, 'houseFlood'])),
        classes: { houseFlood: { always: 'flood', nightLights: false } },
        moods: { flood: FLOOD },
        kinds: {}, lamps: [],
      },
    },
  },
  'HL-c': {
    id: 'HL-c', name: 'warm pools, darker corners', about: 'A warm pendant over each room\'s centre: the core at the hall\'s 0.75, the ring 0.50, the corners at a 0.30 spill; room 3 dim at its centre (0.40) as today; the hall as today.',
    areas: {
      [HOUSE_LIGHT_AREA]: {
        rooms: { 'w4.r1': 'housePool', 'w4.r2': 'housePool', 'w4.closet': 'housePool', 'w4.r3': 'housePoolDim', 'w4.r3-far': 'housePoolDim' },
        classes: { housePool: { always: 'pooled', nightLights: false }, housePoolDim: { always: 'pooledDim', nightLights: false } },
        moods: { pooled: { color: SPILL, fill: 0.30, sp: 1.2 }, pooledDim: { color: SPILL, fill: 0.15, sp: 1.2 } },
        kinds: {
          pendant: { core: 0.45, ring: 0.20, color: PENDANT, lit: 'always', sp: 1.2 },
          pendantDim: { core: 0.25, ring: 0.10, color: PENDANT, lit: 'always', sp: 1.2 },
        },
        // (each ring, 1.5 r, inside its room: room 1 is 5 × 4 m, room 2 5.5 × 5, room 3's near leg 4 × 6.8, its far leg 3.5 × 4)
        lamps: [
          { x: 29.0, z: 10.0, r: 1.3, y: 2.6, kind: 'pendant', room: 'w4.r1' },
          { x: 22.75, z: 16.9, r: 1.6, y: 2.6, kind: 'pendant', room: 'w4.r2' },
          { x: 17.5, z: 8.6, r: 1.3, y: 2.6, kind: 'pendantDim', room: 'w4.r3' },
          { x: 21.25, z: 7.2, r: 1.15, y: 2.6, kind: 'pendantDim', room: 'w4.r3-far' },
        ],
      },
    },
  },
});

/** A candidate id from the URL's word ('b', 'HL-b', 'hl-b'), else null (today's). */
export function houseLightOf(word) {
  const w = String(word ?? '').trim().toUpperCase().replace(/^HL-?/, '');
  const id = `HL-${w.toLowerCase()}`;
  return HOUSE_LIGHT_IDS.includes(id) && id !== 'HL-a' ? id : null;
}

/** The candidate's record for an area under a state (state.$houseLight), or null where it changes nothing. */
export function houseLightFor(state, areaId) {
  const id = state?.$houseLight;
  return (id && HOUSE_LIGHTS[id]?.areas?.[areaId]) || null;
}

/** Every mood a candidate adds, by name: the stage's fill colours for them (src/render/lighting.js). */
export const HOUSE_LIGHT_MOODS = deepFreeze(Object.assign({}, ...Object.values(HOUSE_LIGHTS).flatMap(c => Object.values(c.areas).map(a => a.moods))));
