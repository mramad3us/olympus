// OLYMPUS render: lighting moods, plain numbers the light rig copies into three.js.
//
// A mood is everything the stage's light is at a moment, as data: the sky fill (a hemisphere light:
// sky colour, ground bounce, strength) and the key light (the "sun": colour, strength, how dark its
// shadows are), the open-air tint a sprite takes (linear RGB: sprites are pre-shaded and only tinted,
// tradecraft's lightAt()), how strongly each kind of lamp is lit (their pools come from the stage's ten
// lamp slots, src/render/lights.js), how strongly each glow class shows (src/art/paint.js GLOW: lamp
// lenses, windows, strips, screens), the floor strips' and battle strips' spill light, the background,
// and how dark the unseen is under the fog of awareness (dimK).
//
// The calibration is tradecraft's (src/art/pixelart.js, PIPELINE 2026-10-25: at a sun of 0.66 "the
// palette snap moved every colour a step down ... What is painted is what shows"): a hemisphere fill
// of 0.6 and a sun of 0.79 (× π, three's physical units) make a face toward the camera show exactly
// its painted colour, a top 1.17 of it, a face turned from the sun 0.69. The sun's direction on
// screen never moves (upper left, a little in front): sprites are shaded that way.
//
// The presets, as asked for the stage sample:
//   - day, dusk, night: the open sky at a sun elevation of 18°, 0.5° and −9° from keyframes
//     (skyAt()); SKY.earth is tradecraft's (Moscow's sky, user-approved), SKY.mars my first cut of a
//     Martian one (butterscotch by day, the blue sunset, a cold night), to be scored. Lamps are lit as
//     tradecraft lit them, by the sun's height (on from 2° above the horizon to 3° below);
//   - battle, emergency, blackout: a ship's or a base's interior states, after LONGHAUL's room
//     cameras (js/ui/roomcam.js MODE, "worst first"): battle stations dims the panels to about a
//     third and lights red strips along the bulkheads; emergency (reactor not online) leaves the
//     panels at a tenth, warm, lights amber emergency lamps and the floor strips; a blackout is the
//     floor strips alone. LONGHAUL's ambient numbers are scaled to this stage's calibration
//     (its exposure × panel strength against its normal 1.25), so a front under battle light shows
//     about 0.45 of its colour, under emergency about 0.15, in a blackout only what the strips light;
//   - ship: LONGHAUL's normal cool-white panel light (not on a sample key; the deck default).
// Pure.

import { GLOW, GLOW_CLASSES } from '../art/paint.js';
import { linear, mixHex } from '../art/tone.js';

const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** Sky keyframes by the sun's elevation (degrees), high to low: colours sRGB hex, strengths × π, tint linear. */
export const SKY = Object.freeze({
  earth: [
    { elev: 18, sun: 0xfff2dc, sunK: 0.79, sky: 0xdde6ff, ground: 0x9a8a78, skyK: 0.6, tint: [1, 1, 1] },
    { elev: 7, sun: 0xffe2b4, sunK: 0.74, sky: 0xdcdcf0, ground: 0x9a8470, skyK: 0.56, tint: [1, 0.95, 0.86] },
    { elev: 0.5, sun: 0xffb685, sunK: 0.48, sky: 0xa2a8cc, ground: 0x5e5258, skyK: 0.43, tint: [0.76, 0.66, 0.6] },
    { elev: -4, sun: 0x95c1e3, sunK: 0.16, sky: 0x6a8fc4, ground: 0x23294a, skyK: 0.32, tint: [0.14, 0.19, 0.3] },
    { elev: -9, sun: 0x95c1e3, sunK: 0.15, sky: 0x5d8fc2, ground: 0x1b2541, skyK: 0.26, tint: [0.061, 0.118, 0.193] },
  ],
  // (my call: dusty butterscotch fill and a rust bounce by day; the sunset's light bluish, as Mars's is round the sun)
  mars: [
    { elev: 18, sun: 0xfff0dc, sunK: 0.79, sky: 0xe8d8c8, ground: 0xa07a5c, skyK: 0.6, tint: [1, 0.97, 0.93] },
    { elev: 7, sun: 0xffe4bc, sunK: 0.74, sky: 0xdccab8, ground: 0x96725c, skyK: 0.55, tint: [1, 0.93, 0.85] },
    { elev: 0.5, sun: 0xc8d8f4, sunK: 0.45, sky: 0x98a2c0, ground: 0x5a4a4a, skyK: 0.42, tint: [0.66, 0.68, 0.78] },
    { elev: -4, sun: 0x8fa8d8, sunK: 0.14, sky: 0x5a6890, ground: 0x2a2430, skyK: 0.3, tint: [0.12, 0.14, 0.24] },
    { elev: -9, sun: 0x8fa8d8, sunK: 0.1, sky: 0x48587e, ground: 0x1c1a26, skyK: 0.22, tint: [0.05, 0.08, 0.15] },
  ],
});

/** The open sky's light at a sun elevation (degrees): { sun, sunK, sky, ground, skyK, tint, glow, shadow }. */
export function skyAt(elev, keys = SKY.earth) {
  let i = 0;
  while (i < keys.length - 1 && elev < keys[i + 1].elev) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const k = a === b ? 0 : clamp01((a.elev - elev) / (a.elev - b.elev));
  return {
    elev, sun: mixHex(a.sun, b.sun, k), sunK: lerp(a.sunK, b.sunK, k), sky: mixHex(a.sky, b.sky, k), ground: mixHex(a.ground, b.ground, k),
    skyK: lerp(a.skyK, b.skyK, k), tint: a.tint.map((v, j) => lerp(v, b.tint[j], k)),
    glow: clamp01((2 - elev) / 5), shadow: clamp01(elev / 4),
  };
}

/** Lamps by kind: each lamp of the area says its kind (src/render/lights.js). */
export const LAMP_KINDS = Object.freeze(['ceiling', 'emergency', 'desk']);

/** A mood from the open sky at elevation `elev` (day, dusk, night). */
export function skyMood(name, elev, keys = SKY.earth) {
  const s = skyAt(elev, keys);
  return {
    name, background: 0x14151c, sun: s.sun, sunK: s.sunK, sky: s.sky, ground: s.ground, skyK: s.skyK, shadow: s.shadow, tint: s.tint,
    lamps: { ceiling: s.glow, emergency: 0, desk: s.glow }, lampColour: {},
    glow: { lamp: s.glow > 0.05 ? 1 : 0, night: s.glow, strip: 0, battle: 0, emergency: 0, screen: 1 },
    stripLight: [0, 0, 0], battleLight: [0, 0, 0],
    dimK: 0.18 + 0.3 * clamp01(1 - s.glow),
  };
}

const AMBER = 0xffa23a, RED = 0xff4a3a, LAMP_AMBER = 0xffb347;
const lin = (hex, k) => linear(hex).map(v => v * k);

/** The presets (see the header). Keys 1–6 on the stage sample pick the first six. */
export const MOODS = Object.freeze({
  day: skyMood('day', 18),
  dusk: skyMood('dusk', 0.5),
  night: skyMood('night', -9),
  battle: {
    name: 'battle', background: 0x14151c, sun: 0xeef2ff, sunK: 0.32, sky: 0xd8a0a4, ground: 0x4a2226, skyK: 0.24, shadow: 0.3, tint: [0.4, 0.27, 0.28],
    lamps: { ceiling: 0.36, emergency: 0, desk: 0.36 }, lampColour: { ceiling: 0xeef2ff },
    glow: { lamp: 1, night: 0, strip: 0, battle: 1, emergency: 0, screen: 1 },
    stripLight: [0, 0, 0], battleLight: lin(RED, 0.45), dimK: 0.2,
  },
  emergency: {
    name: 'emergency', background: 0x14151c, sun: 0xffdcb4, sunK: 0.12, sky: 0xd8c0a0, ground: 0x3a2a1e, skyK: 0.1, shadow: 0.15, tint: [0.2, 0.15, 0.1],
    lamps: { ceiling: 0.1, emergency: 1, desk: 0 }, lampColour: { ceiling: 0xffdcb4, emergency: LAMP_AMBER },
    glow: { lamp: 0.25, night: 0, strip: 1, battle: 0, emergency: 1, screen: 1 },
    stripLight: lin(AMBER, 0.55), battleLight: [0, 0, 0], dimK: 0.16,
  },
  blackout: {
    name: 'blackout', background: 0x0e0f14, sun: 0x9fb4d8, sunK: 0.03, sky: 0x6a7890, ground: 0x14151c, skyK: 0.05, shadow: 0, tint: [0.03, 0.03, 0.04],
    lamps: { ceiling: 0, emergency: 0, desk: 0 }, lampColour: {},
    glow: { lamp: 0, night: 0, strip: 1, battle: 0, emergency: 0, screen: 0 },
    stripLight: lin(AMBER, 0.7), battleLight: [0, 0, 0], dimK: 0.12,
  },
  ship: {
    name: 'ship', background: 0x14151c, sun: 0xf4f6ff, sunK: 0.79, sky: 0xe8eeff, ground: 0x6a6e78, skyK: 0.6, shadow: 0.35, tint: [0.95, 0.97, 1],
    lamps: { ceiling: 0.45, emergency: 0, desk: 0.45 }, lampColour: { ceiling: 0xf4f6ff },
    glow: { lamp: 1, night: 0, strip: 0, battle: 0, emergency: 0, screen: 1 },
    stripLight: [0, 0, 0], battleLight: [0, 0, 0], dimK: 0.48,
  },
});
/** The order of the sample's keys 1–6. */
export const MOOD_KEYS = Object.freeze(['day', 'dusk', 'night', 'battle', 'emergency', 'blackout']);

/** A mood by name or as given, its missing fields from the day's. */
export function moodOf(m) {
  const base = MOODS.day, o = typeof m === 'string' ? MOODS[m] : m;
  if (!o) throw new Error(`no mood '${m}'`);
  return { ...base, ...o, lamps: { ...base.lamps, ...o.lamps }, lampColour: { ...o.lampColour }, glow: { ...base.glow, ...o.glow } };
}

/** The glow classes' strengths for a mood (uGlowK): ALWAYS is always 1. */
export function glowKOf(mood) {
  const k = new Float32Array(GLOW_CLASSES), g = mood.glow;
  k[GLOW.NONE] = 0; k[GLOW.ALWAYS] = 1; k[GLOW.LAMP] = g.lamp; k[GLOW.NIGHT] = g.night;
  k[GLOW.STRIP] = g.strip; k[GLOW.BATTLE] = g.battle; k[GLOW.EMERGENCY] = g.emergency; k[GLOW.SCREEN] = g.screen;
  return k;
}

/** How strongly a lamp shines in a mood (its kind's level), and in what colour. */
export function lampLevel(mood, lamp) { return mood.lamps[lamp.kind ?? 'ceiling'] ?? 0; }
export function lampColour(mood, lamp) { return mood.lampColour[lamp.kind ?? 'ceiling'] ?? lamp.color ?? 0xe7b84a; }

/** The n lamps nearest (x, z) that are lit in the mood: [{ lamp, k, d2 }], nearest first. */
export function pickLamps(lamps, x, z, mood, n) {
  const out = [];
  for (const l of lamps) {
    const k = lampLevel(mood, l);
    if (k > 0.001) out.push({ lamp: l, k, d2: (l.x - x) ** 2 + (l.z - z) ** 2 });
  }
  out.sort((a, b) => a.d2 - b.d2);
  return out.slice(0, n);
}

/**
 * The light at (x, z) as a sprite takes it, linear [r, g, b]: the open-air tint plus each lit lamp's
 * pool it stands in (a core to r, a ring to 1.5 r, hard-edged), as tradecraft's lightAt().
 */
export function lightAt(mood, lamps, x, z, extra = null) {
  const out = mood.tint.slice();
  for (const l of lamps) {
    const lv = lampLevel(mood, l);
    if (lv <= 0) continue;
    const d = Math.hypot(x - l.x, z - l.z), r = l.r ?? 2, core = l.core ?? 0.5, ring = l.ring ?? 0.2;
    const k = d < r ? core + ring : d < r * 1.5 ? ring : 0;
    if (!k) continue;
    const c = linear(lampColour(mood, l));
    for (let j = 0; j < 3; j++) out[j] += c[j] * k * lv;
  }
  if (extra) for (let j = 0; j < 3; j++) out[j] += extra[j];
  return out;
}
