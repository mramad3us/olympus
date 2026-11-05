// OLYMPUS art: what the figures wear. Outfits as plain data, the colours of their role letters, the Valles pattern.
//
// A look is plain data a person carries ({ outfit, skin, hair, weapon, carry, rank, seed }); wear()
// expands it into the layers the composer draws (compose.js): a top and legs of a kind (blouse and
// trousers, a T-shirt and shorts, the vac suit's shell over its skin, coveralls), boots, what is on the
// head (the utility cover, the combat helmet, the vac helmet sealed, its neck ring with the helmet off
// and clipped to the pack, a miner's hard hat), body armour, the suit's pack, rank, accents. The
// outfits are SETTING.md 5.7's, as a marine knows them (all colours my call, to be scored):
//   - UTILITIES, the Valles pattern: "a blocky disruptive pattern of rust, ochre, umber, basalt grey and
//     dust pink"; the soft utility cover; tan rough-out boots; a rigger's belt. The NCO wears the same
//     with rank pins on both collar points (SETTING 5.5: on utilities rank is a black-metal pin on the
//     collar), drawn here as a dark pin with a lit edge so it shows on the camouflage.
//   - PT KIT: "an oxblood shirt with the Corps emblem, grey shorts", running shoes, bare legs and arms.
//   - THE LIGHT VAC SUIT (HAD Mk 7, "the can"): a tight counter-pressure skin (dark, on the limbs) under a
//     clip-on shell (pale: the hard torso, the helmet, gloves and boots) with a life-support pack, seal
//     rings at the neck, wrists and waist, a chest display that glows; sealed, the visor down; open, the
//     helmet off and clipped to the pack, the neck ring bare.
//   - THE PLATE CARRIER over utilities: drab (VIEWS.md 2.6's webbing family), three magazine pouches,
//     and the combat helmet.
//   - A CIVILIAN, a Europa ice miner: safety-orange coveralls with reflective bands, a dosimeter on the
//     chest, a hard hat with its lamp lit.
// The Valles pattern is painted at pixel scale by valles(): value noise cut into bands, in blocks of a
// pixel at 16 px/m and two at 24 (a pattern a few centimetres a block either way), its coordinates
// those of the body part it is on, so it moves with the part and never swims across a walking figure.
// Colours here are base tones; shade.js makes each one's light, shade and dark by rule. Pure.
import { noise } from '../tone.js';

/** Skin tones (tradecraft's SKIN). */
export const SKIN = Object.freeze({ light: 0xedc39c, tan: 0xc48a62, brown: 0x8c5a3f, dark: 0x5e3a2a });
export const HAIR = Object.freeze({ black: 0x23252f, dark: 0x2a1c18, brown: 0x5e3a2a, auburn: 0x7a3a26, blond: 0xb9862e, grey: 0x8f96a6 });

/** The Valles pattern's colours (SETTING 5.7): ochre, dust pink, rust, umber, basalt grey. */
// (darker and redder than they look in a painter: the stage's warm grade and palette snap turned a lighter
// set yellow, and a camouflaged cover read as blond hair; these land on rust, brown ochre, umber, basalt
// and a tan pink in tradecraft's palette by day, checked by simulating the grade and the snap)
export const VALLES = Object.freeze({ ochre: 0x9a6a4a, pink: 0xb48478, rust: 0x8a4634, umber: 0x58382c, basalt: 0x5c5654 });

/**
 * The Valles pattern's colour at a part's pixel (u, v), for a density (blocks of 1 px at 16 px/m, 2 at 24)
 * and a seed (each garment its own, so sleeve and chest don't line up).
 */
export function valles(u, v, ppm, seed = 1) {
  const blk = ppm >= 20 ? 2 : 1, s = ppm >= 20 ? 2.2 : 1.6;           // (a block, and the noise's cell in blocks)
  const bu = Math.floor(u / blk), bv = Math.floor(v / blk);
  const n = noise(bu / s, bv / s, seed) * 0.72 + noise(bu / (s * 0.5), bv / (s * 0.5), seed + 7) * 0.28;
  const m = noise(bu / (s * 1.3) + 11, bv / (s * 1.3), seed + 3);
  if (n > 0.64) return m > 0.5 ? VALLES.umber : VALLES.basalt;
  if (n > 0.5) return VALLES.rust;
  if (n < 0.3) return VALLES.pink;
  return VALLES.ochre;
}

/** The outfits a look can name. */
export const OUTFITS = Object.freeze(['utilities', 'nco', 'pt', 'vac', 'vacOpen', 'carrier', 'civilian']);
export const OUTFIT_LABELS = Object.freeze({
  utilities: 'Utilities, Valles pattern', nco: 'Sergeant in utilities (collar pins)', pt: 'PT kit', vac: 'Light vac suit, sealed',
  vacOpen: 'Light vac suit, helmet off', carrier: 'Plate carrier over utilities', civilian: 'Europa ice miner',
});

const TAN_BOOT = 0x9a7650, BELT = 0x5c4a36, DRAB = 0x545e40, DRAB_DARK = 0x3d4530;
const SHELL = 0xc8c0ae, SKINSUIT = 0x3b4256, SUIT_RING = 0x4c5262, SUIT_BOOT = 0x5a6070, PACK = 0x7d776c, OXBLOOD = 0x6e2a2e, PT_GREY = 0x8f96a6;
const MINER = 0xd0663a, MINER_BAND = 0xdfe2e8, HARDHAT = 0xe0b040, HELMET = 0x5f6646;   // (the helmet drab, as the carrier: a tan one met the skin's tone)

/**
 * A look's layers (see the header): { top, legs, boots, gloves, head, hair, armour, pack, rank, belt,
 * weapon, carry, skin, seed }. top/legs: { kind, color | pattern }; head: { kind, color, sealed }.
 */
export function wear(look = {}) {
  const outfit = OUTFITS.includes(look.outfit) ? look.outfit : 'utilities';
  const seed = look.seed ?? 1;
  const L = {
    outfit, seed,
    skin: SKIN[look.skin] ?? look.skin ?? SKIN.tan,
    hair: { style: look.hair?.style ?? 'crew', color: HAIR[look.hair?.color] ?? look.hair?.color ?? HAIR.dark },
    weapon: look.weapon ?? null, carry: look.carry ?? (look.weapon ? 'low' : null),
    top: null, legs: null, boots: TAN_BOOT, gloves: null, head: null, armour: null, pack: null, rank: look.rank ?? null, belt: null,
    accents: {}, closedEyes: false,
  };
  const camo = { pattern: 'valles' };
  switch (outfit) {
    case 'utilities': case 'nco': case 'carrier':
      L.top = { kind: 'blouse', ...camo, seed: seed * 3 + 1 };
      L.legs = { kind: 'trousers', ...camo, seed: seed * 3 + 2 };
      L.belt = BELT;
      L.head = look.head === null ? null : { kind: outfit === 'carrier' ? 'helmet' : 'cover', ...(outfit === 'carrier' ? { color: HELMET } : { ...camo, seed: seed * 3 + 3 }) };
      if (outfit === 'nco') L.rank = look.rank ?? 'sgt';
      if (outfit === 'carrier') L.armour = { color: DRAB, pouches: DRAB_DARK };
      break;
    case 'pt':
      L.top = { kind: 'tee', color: OXBLOOD, emblem: true };
      L.legs = { kind: 'shorts', color: PT_GREY };
      L.boots = 0xc4c8d0;                                             // (running shoes)
      L.accents.socks = 0xe8e6e0;
      break;
    case 'vac': case 'vacOpen':
      L.top = { kind: 'suit', color: SHELL, skin: SKINSUIT };
      L.legs = { kind: 'suit', color: SKINSUIT, shell: SHELL };
      L.boots = SUIT_BOOT; L.gloves = SUIT_RING;
      L.pack = { color: PACK, helmet: outfit === 'vacOpen' };           // (open: the helmet clipped to the pack)
      L.head = outfit === 'vac' ? { kind: 'vac', color: SHELL, sealed: true } : { kind: 'ring', color: SUIT_RING };
      L.accents.rings = SUIT_RING; L.accents.band = 0x9e3c36;            // (the Corps' red on the shoulders)
      break;
    case 'civilian':
      L.top = { kind: 'coverall', color: MINER };
      L.legs = { kind: 'coverall', color: MINER };
      L.boots = 0x47302a; L.gloves = 0x47302a;
      L.accents.bands = MINER_BAND;
      L.head = { kind: 'hardhat', color: HARDHAT };
      L.hair = { style: look.hair?.style ?? 'short', color: HAIR[look.hair?.color] ?? look.hair?.color ?? HAIR.brown };
      break;
  }
  return L;
}

/** Every role letter's base colour (or a pattern function (u, v) → colour) for a look's layers, at ppm. */
export function coloursOf(L, ppm) {
  const pat = (layer) => (layer?.pattern === 'valles' ? (u, v) => valles(u, v, ppm, layer.seed ?? 1) : layer?.color ?? 0x8f96a6);
  return {
    s: L.skin, h: L.hair.color, t: pat(L.top), p: pat(L.legs), f: L.boots, a: pat(L.head),
    r: L.hair.color, y: L.belt ?? 0x47302a, w: 0xf6f4ee, x: 0x6b4636,
    ø: L.armour?.color ?? DRAB, æ: L.armour?.pouches ?? DRAB_DARK,
    c: L.top?.kind === 'suit' ? L.top.color : (L.legs?.shell ?? SHELL), ð: L.accents.rings ?? SUIT_RING, þ: 0x1b2541,
    j: L.pack?.color ?? PACK, i: L.accents.bands ?? L.accents.band ?? 0xdfe2e8, d: L.gloves ?? 0x353947,
    // (what's in the hand: steel, the dark of a gun's metal, black polymer; socks)
    v: 0x9aa1ae, n: 0x353947, u: 0x23252f, ŝ: L.accents.socks ?? 0xe8e6e0,
  };
}
