// OLYMPUS data: the light's numbers, VIEWS §2.7's Mars rows and Base Melas's interior moods as one table (the build sheet 0.0.3 §2.1, §4).
//
// src/sim/places/light.js computes every light the game has from this table (TECH §9.6, correction
// 14: one helper), and the stage reads the same table for its colours, so the dusk on screen and the
// dusk in the dice are one number (the user, tradecraft debrief 2026-10-26: "every number means the
// same thing everywhere").
//   MARS_ROWS    the open air by the sun's geometric elevation (degrees, high to low; interpolated
//                between rows): the sun's colour and strength (K × π, null where there is no sun),
//                the sky fill's colour and strength, the ground's colour, the sprite tint (linear RGB),
//                how far windows and lamps glow, the shadows' strength and the open air's lightLevel.
//                While the canyon's wall hides the disc (`eclipsed`), the key light is off and the
//                shadows 0 whatever the row says, the level and the tint at most the 0° row's (the
//                sky follows the row: it brightens before the sun clears the rim).
//   MOODS        an interior's fill by its lighting state (VIEWS §2.7's Base Melas interiors): day's
//                overheads 0.75, evening's warmer 0.65, lights out 0.04 (the overheads off).
//   CLASSES      what a room's lighting class does with the state (the sheet's §4): berthing as the
//                state says; a head at the evening's 0.65 at every hour (heads stay lit); a hall as
//                berthing with its night lights lit at lights out; an office as berthing.
//   LAMP_KINDS   the lamps that make pools, each a hard two-ring disc (core to r, ring to 1.5 r: VIEWS
//                §2.7, pixel art's pool of light), their colours, radii and when they are lit; and the
//                kinds that make none (a ceiling panel is the room's fill, the sheet's §8 item 7; an
//                exit sign only glows).
//   TIMES        the lighting's hours by Melas time (CONTRACTS §4, PLACES §3.9): reveille 05:30 on a
//                weekday, 07:00 on Saturday and Sunday; evening from 18:00; taps at 22:00.
// Numbers marked (my call) in the sheet: WINDOW_K, the pools' radii and strengths but the night
// light's and the red lamp's, which are VIEWS's.

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** Mars, open air, by the sun's geometric elevation (VIEWS §2.7's table). */
export const MARS_ROWS = deepFreeze([
  { elevDeg: 20, sun: 0xfff1de, sunK: 0.79, sky: 0xc4d0ea, skyK: 0.60, ground: 0xa06e56, tint: [1, 1, 1], glow: 0, shadow: 1.0, level: 1.0 },
  { elevDeg: 8, sun: 0xffdcb0, sunK: 0.72, sky: 0xb6c2e2, skyK: 0.55, ground: 0x9a6450, tint: [0.97, 0.92, 0.86], glow: 0, shadow: 1.0, level: 0.9 },
  { elevDeg: 4, sun: 0xf6b48c, sunK: 0.50, sky: 0xa4b0d8, skyK: 0.45, ground: 0x8a5a4a, tint: [0.82, 0.70, 0.66], glow: 0.2, shadow: 0.8, level: 0.6 },
  { elevDeg: 0, sun: null, sunK: 0, sky: 0x8a96c8, skyK: 0.38, ground: 0x6a4a44, tint: [0.60, 0.56, 0.66], glow: 0.6, shadow: 0, level: 0.35 },
  { elevDeg: -6, sun: null, sunK: 0, sky: 0x4a5888, skyK: 0.24, ground: 0x3a3036, tint: [0.20, 0.22, 0.34], glow: 1, shadow: 0, level: 0.12 },
  { elevDeg: -15, sun: null, sunK: 0, sky: 0x232a44, skyK: 0.14, ground: 0x1e1c26, tint: [0.035, 0.05, 0.10], glow: 1, shadow: 0, level: 0.02 },
]);

/** Base Melas's interiors by their lighting state: the overheads' colour and the room's fill (VIEWS §2.7). */
export const MOODS = deepFreeze({
  day: { color: 0xf2f0ea, fill: 0.75 },
  evening: { color: 0xf6e6cc, fill: 0.65 },
  lightsOut: { color: null, fill: 0.04 },
});

/** What a room's lighting class makes of the clock's state (the sheet's §4). */
export const CLASSES = deepFreeze({
  berthing: { always: null, nightLights: false },
  head: { always: 'evening', nightLights: false },
  hall: { always: null, nightLights: true },
  office: { always: null, nightLights: false },
});
/** A room's lighting class by its kind, where the room does not name one. */
export const CLASS_OF_KIND = deepFreeze({ squadBay: 'berthing', rackRoom: 'berthing', head: 'head', shower: 'head', hall: 'hall', lobby: 'hall', vestibule: 'hall', stairs: 'hall', mail: 'hall' });

/** A window's share of the open air's light in its room (my call). */
export const WINDOW_K = 0.3;

/**
 * The lamp kinds: a pool's radius r (m), its core's and its ring's strength, its colour, and when it is
 * lit ('lightsOut': from taps to reveille; 'always'; 'dark': while the sun is under the geometric
 * horizon; 'lit': while its room's overheads are). r null: no pool.
 */
export const LAMP_KINDS = deepFreeze({
  ceiling: { r: null, core: 0, ring: 0, color: 0xf2f0ea, lit: 'lit' },
  night: { r: 0.8, core: 0.20, ring: 0.08, color: 0xf0a93a, lit: 'lightsOut' },
  red: { r: 1.5, core: 0.25, ring: 0.10, color: 0xd23a2e, lit: 'lightsOut' },
  desk: { r: 1.2, core: 0.35, ring: 0.15, color: 0xf6e0bc, lit: 'always' },
  exit: { r: null, core: 0, ring: 0, color: 0x6ad08a, lit: 'always' },
  street: { r: 2.5, core: 0.45, ring: 0.20, color: 0xf0b050, lit: 'dark' },
  flood: { r: 3.0, core: 0.50, ring: 0.20, color: 0xe8ecf4, lit: 'dark' },
});

/** The lighting's hours by Melas civil time, decimal hours (CONTRACTS §4, PLACES §3.9). */
export const TIMES = deepFreeze({ REVEILLE_H: 5.5, REVEILLE_WEEKEND_H: 7.0, EVENING_H: 18.0, TAPS_H: 22.0 });
