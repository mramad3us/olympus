// OLYMPUS data: the rifles' finishes, the colours a squad's arms are issued in by deployment (WEAPONS §3.10).
//
// The user, 2026-11-08, of the standard issue's sample: "Make sure we have multiple colors so we can equip ourselves to
// camo in environments depending on deployments". A finish is a colour scheme, never a shape: any rifle drawing
// (src/art/rifles.js) is drawn in any finish, on the weapon card, on the figure and on the doll, and nothing in the
// gun's data changes with it. One kit per squad (WEAPONS §3.10, 2026-11-08): a squad is issued one finish, the
// player's rifle with the others' (src/sim/arms/kit.js materialise's finish).
//
// Each finish is a set of Mars palette colours (src/art/palette.js PALETTES.mars, so the stage's snap leaves them as
// drawn), one family's steps a ramp:
//   - the furniture (FL its lit edge, F its base, FD its dark, FDD the slots' dark): the receivers, the handguard,
//     the carry handle, the grip, on the card and as the figure's furniture letters;
//   - the metal (B, BL its lit edge): the stock's skeleton, the sight's box, the scope, the brake, the light, drawn
//     in the issue's black polymer on the Corps' black and on flat dark earth (the first reference's look), in the
//     finish's own darks on the others so the whole rifle wears it;
//   - the magazine (mag: its body, edge, ribs, baseplate and window), black polymer unless the finish colours it; a
//     coloured magazine's window is a step darker than its body by at least 1.8:1 in contrast, so the believed rounds
//     and an empty window still read;
//   - the figure's furniture (fig: FL, F, FD), only where it differs from the card's: Earth desert's figure is one step
//     darker than its card, since at 16 px/m its card ramp and Europa ice's both read as near white (the judge's
//     crops of 2026-11-11), and a step down keeps desert a warm sand against ice's cool grey.
// The finishes: the Corps' black (the issue's: the user, 2026-11-08, "armors are black"; the steel greys' lowest
// steps), flat dark earth (the first reference's butterscotch dust), Mars rust (the regolith's own red dust family:
// its base 0xa65e4b is the valley floor's colour), Earth desert (the sand grey, the pale one), Europa ice (the steel
// greys' highest steps, its metal a mid grey so nothing on it is black against snow), Earth woodland (the olive
// family) and urban grey (the steel greys' middle steps, cool as concrete).
// A gun item carries `finish` (an id here) only when it is not the issue's: the Corps' black is stored as no field
// at all, as every default on a gun's record is (its mode, its dust), so every save and every scene's digest keeps its bytes
// and a save from before finishes reads black. finishId(id) reads an unknown id as black.
// Pure.

/** The issue's finish: the Corps' black, stored as no field on the gun. */
export const ISSUE_FINISH = 'black';

/** The black polymer and its lit edge (the card's POLY and POLY_L). */
const POLY = 0x282b34, POLY_L = 0x3e424d;
/** The HAD-30 in black polymer (src/art/weaponcard.js's colours): body, edge, ribs, baseplate, window. */
const BLACK_MAG = Object.freeze({ body: POLY, edge: POLY_L, rib: POLY_L, plate: POLY_L, win: 0x1d2b46 });

const finish = (id, name, R, metal, mag = BLACK_MAG, fig = null) => Object.freeze({ id, name, ...R, ...metal, mag: Object.freeze({ ...mag }), ...(fig ? { fig: Object.freeze({ ...fig }) } : {}) });

/** The finishes by id (see the header): { id, name, FL, F, FD, FDD, B, BL, mag: { body, edge, rib, plate, win }, fig? { FL, F, FD } }. */
export const FINISHES = Object.freeze({
  black: finish('black', "the Corps' black", { FL: 0x565b67, F: 0x3e424d, FD: 0x282b34, FDD: 0x14161d }, { B: POLY, BL: POLY_L }),
  fde: finish('fde', 'flat dark earth', { FL: 0xcdab7d, F: 0xb28a59, FD: 0x976a36, FDD: 0x7f4c2c }, { B: POLY, BL: POLY_L }),
  mars: finish('mars', 'Mars rust', { FL: 0xc18064, F: 0xa65e4b, FD: 0x874442, FDD: 0x672d39 }, { B: 0x573a37, BL: 0x725247 },
    { body: 0x7b4d41, edge: 0x96694f, rib: 0x96694f, plate: 0x96694f, win: 0x3c2328 }),
  desert: finish('desert', 'Earth desert', { FL: 0xdad0bc, F: 0xbbb09a, FD: 0x9c917a, FDD: 0x7f735a }, { B: 0x695745, BL: 0x7f735a },
    { body: 0x9c917a, edge: 0xbbb09a, rib: 0xbbb09a, plate: 0x7f735a, win: 0x392523 }, { FL: 0xbbb09a, F: 0x9c917a, FD: 0x7f735a }),
  ice: finish('ice', 'Europa ice', { FL: 0xc7d5d0, F: 0xa5b5b6, FD: 0x87959d, FDD: 0x6e7582 }, { B: 0x6e7582, BL: 0x87959d },
    { body: 0x87959d, edge: 0xa5b5b6, rib: 0xa5b5b6, plate: 0x6e7582, win: 0x3e424d }),
  woodland: finish('woodland', 'Earth woodland', { FL: 0x949669, F: 0x737949, FD: 0x4c633d, FDD: 0x264c35 }, { B: 0x543d2c, BL: 0x69583d },
    { body: 0x4c633d, edge: 0x737949, rib: 0x737949, plate: 0x543d2c, win: 0x230f11 }),
  urban: finish('urban', 'urban grey', { FL: 0x87959d, F: 0x6e7582, FD: 0x565b67, FDD: 0x3e424d }, { B: POLY, BL: POLY_L }),
});
/** The finishes' ids, the issue's first. */
export const FINISH_IDS = Object.freeze(Object.keys(FINISHES));

/** A finish's id as drawn: a known id, else the issue's (an unknown or absent finish reads black). */
export const finishId = (id) => (id && Object.hasOwn(FINISHES, id) ? id : ISSUE_FINISH);
/** Whether an id names a finish (newGun refuses one that doesn't). */
export const isFinish = (id) => typeof id === 'string' && Object.hasOwn(FINISHES, id);
