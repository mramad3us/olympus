// OLYMPUS scenes sample: the lighting moods the scenes are shown in, as plain data for the stage.
//
// A mood is what src/render/moods.js says it is (sky fill, key light, sprite tint, lamps by kind, glow
// classes, strip light, the unseen's dimming); these are the scenes' own, written from VIEWS §2.7 until
// the sim's light module (src/sim/light.js, not yet built) computes them:
//   - Base Melas interiors: "Day: overheads 0xf2f0ea (4000 K) as fill 0.75", "Evening: overheads warmer
//     0xf6e6cc, 0.65", "Lights out (taps to reveille): overheads off; exit signs in phosphor glow; the
//     head's light through its doorway; the fire watch's red-lens torch as a moving pool (r 1.5 m, red
//     family); night lights at floor level every 6 m (amber, r 0.8 m) | 0.04 plus pools". Reveille is the
//     day's overheads coming on before the sky is light (the windows still dawn-dark).
//     Lamp kinds are the scene's: 'ceiling' the overheads, 'head' the head's own (lit at lights out),
//     'nightLight' the floor-level ambers, 'torch' the fire watch's red lens, 'desk' the duty desk's lamp.
//   - Mars, open air: VIEWS's row for a sun at 20° or more (sun 0xfff1de at 0.79, sky 0xc4d0ea at 0.6,
//     ground 0xa06e56), and a storm laid over it by the dust's optical depth τ (src/render/weather.js
//     dustOf: the sun and sky scaled, the sky's colour toward 0xb07656, shadows thinned, the sprite tint
//     down to VIEWS's lightLevel at noon); the floodlights over doors come on in a storm.
//   - Ships: the stage's own (src/render/moods.js MOODS.ship, battle, emergency: after LONGHAUL's room
//     cameras), with the deck's lamps by kind.
import { MOODS } from '../../src/render/moods.js';
import { dustOf, DUST_SKY } from '../../src/render/weather.js';
import { mixHex } from '../../src/art/tone.js';

const glowOff = { lamp: 0, night: 0, strip: 0, battle: 0, emergency: 0, screen: 1 };

export const reveille = {
  name: 'reveille', background: 0x14151c, sun: 0xf2f0ea, sunK: 0.76, sky: 0xf2f0ea, ground: 0x8a8272, skyK: 0.6, shadow: 0.28, tint: [0.97, 0.97, 0.95],
  lamps: { ceiling: 0.1, head: 0.1, desk: 0.5, nightLight: 0, torch: 0, emergency: 0, flood: 0 }, lampColour: { ceiling: 0xf2f0ea, head: 0xf2f0ea },
  glow: { ...glowOff, lamp: 1 }, stripLight: [0, 0, 0], battleLight: [0, 0, 0], dimK: 0.45,
};
export const evening = {
  ...reveille, name: 'evening', sun: 0xf6e6cc, sunK: 0.68, sky: 0xf6e6cc, skyK: 0.55, ground: 0x8a7a66, tint: [0.92, 0.86, 0.78],
  lamps: { ...reveille.lamps, ceiling: 0.14, head: 0.14 }, lampColour: { ceiling: 0xf6e6cc, head: 0xf6e6cc },
};
export const lightsOut = {
  name: 'lightsOut', background: 0x0e0f14, sun: 0x8fa0c8, sunK: 0.09, sky: 0x4a5888, ground: 0x1e1c26, skyK: 0.15, shadow: 0, tint: [0.08, 0.09, 0.14],
  lamps: { ceiling: 0, head: 0.75, desk: 1, nightLight: 1, torch: 1, emergency: 0, flood: 0 }, lampColour: { head: 0xf2f0ea, nightLight: 0xffb347, torch: 0xff4a3a, desk: 0xffd9a0 },
  glow: { ...glowOff, night: 1 }, stripLight: [0, 0, 0], battleLight: [0, 0, 0], dimK: 0.14,
};

export const marsDay = {
  name: 'marsDay', background: 0x2a1c1c, sun: 0xfff1de, sunK: 0.79, sky: 0xc4d0ea, ground: 0xa06e56, skyK: 0.6, shadow: 1, tint: [1, 1, 1],
  lamps: { ceiling: 0, desk: 0, emergency: 0, flood: 0 }, lampColour: {}, glow: { ...glowOff }, stripLight: [0, 0, 0], battleLight: [0, 0, 0], dimK: 0.48,
};
/** A dust storm of optical depth τ over the Martian day (VIEWS §2.7's table, through weather.js dustOf). */
export function marsStorm(tau) {
  const d = dustOf(tau), light = tau <= 1 ? 0.95 : tau <= 3 ? 0.95 - (tau - 1) * 0.175 : tau <= 6 ? 0.6 - (tau - 3) * 0.083 : Math.max(0.15, 0.35 - (tau - 6) * 0.05);
  return {
    ...marsDay, name: `storm τ ${tau}`, sunK: 0.79 * d.sunK, skyK: 0.6 * d.skyK, sky: mixHex(marsDay.sky, DUST_SKY, d.skyToward), ground: mixHex(marsDay.ground, 0x6e4a3a, 0.4),
    shadow: d.shadow, tint: [light, light * 0.9, light * 0.78], background: mixHex(0x2a1c1c, DUST_SKY, 0.5),
    lamps: { ...marsDay.lamps, flood: 1 }, lampColour: { flood: 0xfff0d8 }, glow: { ...glowOff, lamp: 1, night: 1 }, dimK: 0.32, tau, dust: d,
  };
}

// (indoors the key light's shadows are kept soft: panels overhead throw none to speak of, and a hard one reads as a stain on the deck)
export const ship = { ...MOODS.ship, shadow: 0.12, lamps: { ...MOODS.ship.lamps, ceiling: 0.2, head: 0.2, desk: 0.45 } };
export const battle = { ...MOODS.battle, shadow: 0.1, lamps: { ...MOODS.battle.lamps, head: 0.3 } };
export const emergency = { ...MOODS.emergency, shadow: 0.05, lamps: { ...MOODS.emergency.lamps, ceiling: 0 } };   // (the panels at a tenth are fill, not pools: their faint rings read as stains)
export const shipNight = {
  ...MOODS.ship, name: 'shipNight', sunK: 0.79 * 0.3, skyK: 0.6 * 0.3, sky: 0xdfe8f6, sun: 0xdfe8f6, tint: [0.28, 0.3, 0.34], shadow: 0.15,
  lamps: { ceiling: 0.12, desk: 0.5, nightLight: 1, emergency: 0 }, lampColour: { nightLight: 0xff4a3a }, glow: { ...MOODS.ship.glow, night: 1 }, dimK: 0.2,
};
