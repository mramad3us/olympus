// OLYMPUS art: what the close figure wears and carries, drawn from the gear record (VIEWS §4.2, §4.3; the build sheet 0.0.18 §2.2).
//
// The user's ask of 2026-11-15 (DESIGN.md's log): "the I and C menu preview of the character should show the currently worn gear".
// doll.js draws the body and its clothes; this module draws, on the same grid (grid.js) and in the same order of parts, the
// pieces the gear adds (src/sim/arms/gear.js gearOf, turned into the doll's arguments by ./dress.js), each in its place:
//   - the rifle: slung across the chest ('front': the butt high at the viewer's left, the muzzle at the viewer's right knee, as
//     the world figure's front rig), slung on the back ('back': drawn before the torso, so only the muzzle over the viewer's
//     right shoulder shows), at the low ready ('ready': diagonal across the body 35° below level, the muzzle down to the
//     viewer's right, both arms bent onto it, the right hand at the grip, the left at the handguard), or hanging from the right
//     hand ('hand': the board's painted man, v0.0.17's rifleIn to the pixel);
//   - the carrier's magazine pouches by the kit's list (two at MID − 8 and MID + 2, three at v0.0.17's three places, four at
//     width 5), the dump pouch on the belt at the wearer's left hip, and the magazines in them as their baseplates: a HAD-30's
//     2 px wide in 0x23252f above the pouch's lip, lit on its top row, one for each magazine in it (VIEWS §4.2: "a double
//     magazine pouch shows two baseplates when full and one when half"); the dump pouch sags a row for each two it holds; an
//     empty pouch shows its seam alone;
//   - on the suit a slim belt at BELT_Y in the carrier's colour when it carries a dump pouch, a holster or a thigh pouch;
//   - the drop-leg holster on the wearer's right thigh (the viewer's left) from the belt to row 84, two leg straps, the
//     P-12's grip over its mouth in the frame's polymer black, or the mouth open and dark with the pistol drawn; the pistol
//     pouch below it, rows 86 to 96, a HAD-17's baseplate for each magazine;
//   - the ear defenders' cups at rows 12 to 19, MID ± 9, and the band over the crown (not under a sealed helmet);
//   - the kit's devices off the front (v0.0.18, the fixer's; DEVICES[model].look's shape and colour): a pouch for each slot on
//     the carrier's flank, the wearer's left at the viewer's right, its devices' tops over its lip (a G-11's can and spoon,
//     an SC-1's strip, an FD-1's orange spool); on the back, drawn before the torso so only what clears the shoulders shows, a
//     halligan's bar and fork over the viewer's left shoulder and a ram's head over the right; a device in a back pouch shows
//     nothing from the front;
//   - in the hands: the pistol at the ready (both fists at the belly, the slide down) or hanging from the right hand (the
//     board's), its drawing src/art/pistols.js pistolDrawingOf's (arms' PISTOL_DRAWN_AS), else the figures' pistol shape; a
//     phone (a dark slab with a lit screen) in the right hand; a magazine in the left;
//   - a device in the hands (gear.device; HELD_BENDS): a G-11's can in the right fist at the chest, its top and spoon
//     over the fist; a strip charge upright in the right fist; the halligan across the body in both fists, its fork high at the
//     viewer's right; the ram level at the belly in both; an emptied device pouch keeps its slot and draws its body alone.
// The rifle is the doll's one costly piece (templates.js turned() per pixel: 5 ms at the hit card's near band), so rifleStamp
// memoises its pixel list once per model, finish, scale, place, body and magazine (in or out, gear.rifle.mag), and every doll replays it in the same order, the
// same pixels (a board's figure keeps its digest, which ui-hitcard's B goldens check). Pure but the memo.
// v0.0.19 (the build sheet 0.0.19 §1 L-look; opfor §2.6; COMBAT §7.11): the first live men. THE MASK (gear.mask 'fof', the
// role-players' force-on-force mask) over the face, by the look the user scores (samples/opfor-look, MASK_LOOKS; MASK_LOOK the
// default until then): M1 a wire mesh from the brow to the chin in a black frame, M2 (the default) a clear lens over the eyes in a
// black frame and a moulded lower shell with three vents, M3 a smoked full-face shield in a black rim with a chin guard; each on a
// head strap round to the ears; never under a sealed helmet. THE HANDS (gear.hands 'up': a man who gave up, his rifle on the floor)
// raised, palms out and empty, by the look scored (HANDS_LOOKS; HANDS_LOOK): H1 (the default) at the shoulders, H2 at the face;
// the arms are the doll's own bent arms (gearBends), the open palms drawn over the fists. Both are drawn after the seams (kit.late)
// with their own rims, so nothing of v0.0.18's doll moves without them.
import { cloth, flesh, mix, INK } from './grid.js';
import { shapeAt, turned } from '../figures/templates.js';
import { drawingOf } from '../rifles.js';
import { pistolDrawingOf, P12_LEN_M } from '../pistols.js';
import { COMBAT_SUIT, EARS } from '../figures/outfits.js';

/** Doll pixels a centimetre at scale 1 (doll.js PX_PER_CM's: 175 cm over 126 rows). */
const PX_PER_CM = 0.72;
/** The rifle's length on the doll (cm), its grip's share from the butt, and the low ready's angle below level (degrees). */
export const RIFLE_CM = 85, GRIP_K = 4.5 / 16, READY_DEG = 35;
/** The magazine's baseplate colours: the HAD-30's polymer, lit on its top row (VIEWS §4.2). */
export const PLATE_C = Object.freeze({ base: 0x23252f, lit: 0x4c5262 });
/** The memo's bound: model × finish × scale × place × body is a handful in a game; this keeps a bench from growing it. */
const STAMP_MAX = 64;
const STAMPS = new Map();

// (the rifle's anchor and direction by its place, reference coordinates: [x, y] where the turned shape's origin, the butt, sits, and th)
function rifleLine(place, B, MID, lenRef) {
  if (place === 'front') { const to = [MID + 14, 92], from = [MID - 13, 33]; return { at: from, th: Math.atan2(to[1] - from[1], to[0] - from[0]) }; }
  if (place === 'back') { const from = [MID - 12, 70], to = [MID + 18, 12]; return { at: from, th: Math.atan2(to[1] - from[1], to[0] - from[0]) }; }
  if (place === 'ready') { const th = READY_DEG * Math.PI / 180, grip = [MID - 8, 58], g = lenRef * GRIP_K; return { at: [grip[0] - Math.cos(th) * g, grip[1] - Math.sin(th) * g], th }; }
  return null;
}

/**
 * The rifle's pixels on the doll's grid at scale S for a place ([[x, y, colour]] in target pixels, in turned()'s order),
 * memoised. 'hand' is v0.0.17's rifleIn exactly: hanging from the right hand, muzzle down, its far side in shade.
 */
export function rifleStamp(model, finish, S, place, B, MID, mag = true) {
  const key = `${model}|${finish ?? ''}|${S}|${place}|${B.hand}|${B.armIn[0][1]}|${mag ? 1 : 0}`;
  const hit = STAMPS.get(key);
  if (hit) return hit;
  const lenPx = Math.round(RIFLE_CM * PX_PER_CM * S);
  // (the rifle as its drawing has it, src/art/rifles.js: the look's model, else the R-7's; its furniture in its finish's colours;
  // the magazine in the well only when the gear says so: the hunt of v0.0.18 found the doll drawing it whatever the gear said)
  const D = drawingOf(model ?? 'r7', finish), shape = shapeAt('rifle', lenPx, 2.4 * S, mag, D.fig);
  // (lighter than the sprites' rifle: against the doll's dark wall gun metal would vanish)
  const C = { n: cloth(0x5c6270), u: cloth(0x2e313c), v: cloth(0xa0a8b4), ...Object.fromEntries(Object.entries(D.colours).map(([k, c]) => [k, cloth(c)])) };
  const out = [];
  if (place === 'hand') {
    const hx = (MID - B.hand) * S, hy = (B.armIn[0][1] + 3) * S, grip = lenPx * 4.5 / 16;
    for (const [x, y, ch] of turned(shape, hx - 1, hy - grip, Math.PI / 2, false)) {
      const T = C[ch] ?? C.n, c = x > hx + 1.5 * S ? T.shade : ch === 'v' ? T.light : T.base;
      out.push([Math.round(x), Math.round(y), c]);
    }
  } else {
    const L = rifleLine(place, B, MID, lenPx / S), cells = turned(shape, L.at[0] * S, L.at[1] * S, L.th, place === 'back');
    const has = new Set(cells.map(([x, y]) => `${x},${y}`));
    // (lit from above: a pixel with nothing of the rifle under it is its lower edge, in shade; the sight's letter lit)
    for (const [x, y, ch] of cells) {
      const T = C[ch] ?? C.n, c = !has.has(`${x},${y + 1}`) ? T.shade : ch === 'v' ? T.light : T.base;
      out.push([Math.round(x), Math.round(y), place === 'back' ? mix(c, INK, 0.25) : c]);
    }
  }
  if (STAMPS.size >= STAMP_MAX) STAMPS.clear();
  STAMPS.set(key, out);
  return out;
}

/** The rifle drawn at its place (a new part, in the stamp's order). */
export function rifleAt(g, B, kit, place, MID) {
  const id = g.add([], 0);
  // (a figure with no gear record, the board's 'hand' rifle, keeps its magazine)
  for (const [x, y, c] of rifleStamp(kit.model ?? 'r7', kit.finish, g.S, place, B, MID, kit.gear?.rifle?.mag !== false)) g.px(x, y, c, id);
  return id;
}

/** The masks to score (see the header) and the default drawn until the user picks. */
export const MASK_LOOKS = Object.freeze({ M1: 'mesh', M2: 'lens', M3: 'shield' }), MASK_LOOK = 'M2';
/** The mask's colours: its frame and shell, their lit edge, the vents, the lens's tint, the mesh's wire, the shield's smoke. */
export const MASK_C = Object.freeze({ frame: 0x24262d, shell: 0x3a3d46, lit: 0x5a5f6c, vent: 0x15161c, lens: 0x9fc4d8, glint: 0xe8f4fa, wire: 0x30333b, smoke: 0x4e6474, strap: 0x2c2e35 });
/** The hands' looks to score (see the header): where the hands are held ([d, y]: reference columns from the middle, a row), and the default. */
export const HANDS_LOOKS = Object.freeze({ H1: Object.freeze([16.4, 31]), H2: Object.freeze([12.6, 21]) }), HANDS_LOOK = 'H1';

/**
 * The fists' places for a device in the hands (the hunt of v0.0.18; my call, drawn to read at the doll's size): a can, an
 * egg or a spool in the right fist at the chest; a strip charge in the right fist at the belt, upright; the halligan across the
 * body in both fists, its fork up at the viewer's right; the ram level at the belly in both. [d, y]: reference columns from the
 * middle (bendR to the viewer's left, bendL to the right) and a row.
 */
export const HELD_BENDS = Object.freeze({
  can: Object.freeze({ bendR: Object.freeze([6, 47]) }), egg: Object.freeze({ bendR: Object.freeze([6, 47]) }), spool: Object.freeze({ bendR: Object.freeze([6, 47]) }),
  strip: Object.freeze({ bendR: Object.freeze([6, 55]) }),
  bar: Object.freeze({ bendR: Object.freeze([7, 62]), bendL: Object.freeze([3, 46]) }),
  ram: Object.freeze({ bendR: Object.freeze([7, 59]), bendL: Object.freeze([7, 59]) }),
});
/** The halligan's line in the hands: from its pick end low at the viewer's left to its fork high at the right (reference). */
const BAR_FROM = Object.freeze([-12, 70]), BAR_TO = Object.freeze([9, 36]);

/**
 * The device in the hands (gear.device, v0.0.20): 'under' the arms (the halligan's bar, the ram's body, a strip's length, so the
 * fists close over them), then 'over' them (a can's top and its spoon above the fist).
 */
export function handDevice(g, B, kit, layer) {
  const d = kit.gear?.device, MID = g.MID;
  if (!d) return null;
  const C = devC(d), to = kit.bendR ?? HELD_BENDS.can.bendR, x = MID - to[0];
  if (layer === 'under') {
    if (d.shape === 'bar') {
      const [a, b] = [[MID + BAR_FROM[0], BAR_FROM[1]], [MID + BAR_TO[0], BAR_TO[1]]];
      const id = g.add(g.scan([[a[0] - 1, a[1]], [a[0] + 1, a[1]], [b[0] + 1, b[1]], [b[0] - 1, b[1]]]), C.base);
      g.on(id, g.scan([[a[0], a[1]], [a[0] + 1, a[1]], [b[0] + 1, b[1]], [b[0], b[1]]]), C.light);
      g.span(b[1] - 1, b[0] - 1, b[0] + 3, C.base, id); g.span(b[1] - 2, b[0] + 2, b[0] + 4, C.light, id);   // (the fork)
      g.span(a[1] + 1, a[0] - 3, a[0] + 1, C.shade, id);                                                   // (the pick and adze)
      return id;
    }
    if (d.shape === 'ram') {
      const id = g.add(g.rows(to[1] - 3, MID - 12, MID + 11, to[1] + 3), C.base);
      g.on(id, g.rows(to[1] - 3, MID - 12, MID + 11), C.light); g.on(id, g.rows(to[1] + 3, MID - 12, MID + 11), C.shade);
      g.on(id, g.rows(to[1] - 3, MID + 9, MID + 11, to[1] + 3), cloth(DEVICE_C.steel).base);   // (the striking face)
      return id;
    }
    if (d.shape === 'strip') {
      const id = g.add(g.rows(to[1] - 10, x - 1, x, to[1] + 5), C.base);
      g.on(id, g.rows(to[1] - 10, x - 1, x - 1, to[1] + 5), C.light);
      return id;
    }
    return null;
  }
  if (d.shape === 'can' || d.shape === 'egg' || d.shape === 'spool') {
    // (above the fist: the can's top, lit, its spoon down the viewer's left side in steel)
    const y0 = to[1] - 7, id = g.add(g.rows(y0, x - 1.5, x + 1.5, y0 + 4), C.base);
    g.on(id, g.rows(y0, x - 1.5, x + 1.5), C.light);
    if (d.shape !== 'spool') g.on(id, g.rows(y0 + 1, x - 2.5, x - 2.5, y0 + 5), 0x8a909c);
    return id;
  }
  return null;
}

/** The arms' bends the gear's hands give (the gear wins over the body's cues while the hands are on a weapon: my call). */
export function gearBends(gear) {
  // (v0.0.19: the hands up and empty, both arms, at the look's place)
  if (gear?.hands === 'up') { const to = HANDS_LOOKS[gear.handsLook] ?? HANDS_LOOKS[HANDS_LOOK]; return { bendR: [to[0], to[1]], bendL: [to[0], to[1]] }; }
  // (a device in the hands, by its shape: HELD_BENDS)
  if (gear?.device) { const b = HELD_BENDS[gear.device.shape] ?? HELD_BENDS.can; return { bendR: [...b.bendR], ...(b.bendL ? { bendL: [...b.bendL] } : {}) }; }
  if (gear?.rifle?.place === 'ready') { const th = READY_DEG * Math.PI / 180; return { bendR: [8, 58], bendL: [-8 + Math.cos(th) * 14, 58 + Math.sin(th) * 14] }; }
  if (gear?.pistol?.place === 'ready') return { bendR: [2, 56], bendL: [2, 56] };
  return null;
}

/** The suit's slim belt (a dump pouch, a holster or a thigh pouch hangs from it). */
export function suitBelt(g, B, kit, Y) {
  const T = cloth(kit.armour?.color ?? COMBAT_SUIT.carrier), w = B.waist + 2.2, x0 = g.MID - w, x1 = g.MID + w - 1;
  const id = g.add(g.rows(Y.BELT_Y + 2, x0, x1, Y.BELT_Y + 3), T.base);
  g.on(id, g.rows(Y.BELT_Y + 2, x0, x1), T.light); g.on(id, g.rows(Y.BELT_Y + 3, x0, x1), T.shade);
  g.span(Y.BELT_Y + 2, g.MID - 2, g.MID + 1, 0x6a7182); g.span(Y.BELT_Y + 3, g.MID - 2, g.MID + 1, 0x4c5262);   // (the buckle)
  return id;
}

/** The carrier's magazine pouches from the gear's list, on the plate (foot its lower row): [{ x0, w, holds, mags, id }]. */
export function carrierPouches(g, kit, foot) {
  const D = cloth(kit.armour.pouch), list = (kit.gear?.carrier?.pouches ?? []).filter(p => p.key !== 'dump'), MID = g.MID;
  const at = list.length <= 2 ? [[MID - 8, 6], [MID + 2, 6]] : list.length === 3 ? [[MID - 11, 6], [MID - 3, 6], [MID + 5, 6]] : [[MID - 11, 5], [MID - 5, 5], [MID + 1, 5], [MID + 7, 5]];
  const out = [];
  list.slice(0, at.length).forEach((p, k) => {
    const [x0, w] = at[k], right = x0 > MID;
    const id = g.add(g.rows(foot - 9, x0, x0 + w - 1, foot - 2), right ? D.shade : D.base);
    g.on(id, g.rows(foot - 9, x0, x0 + w - 1), right ? D.base : D.light); g.on(id, g.rows(foot - 8, x0, x0 + w - 1), right ? D.base : D.soft);
    g.on(id, g.rows(foot - 7, x0, x0 + w - 1), D.deep);
    g.on(id, g.rows(foot - 6, x0 + w - 1, x0 + w - 1, foot - 3), D.deep);
    out.push({ x0, w, holds: p.holds, mags: p.mags, id, top: foot - 9 });
  });
  // (the baseplates late, over the seams: one a magazine, left to right)
  kit.late.push(() => { for (const p of out) plates(g, p.x0 + 1, p.top - 2, Math.min(p.mags, p.holds, Math.floor((p.w - 1) / 2)), 2, 2); });
  return out;
}

// (n baseplates side by side from x, their tops at row y: each w wide, h tall, a column between them)
function plates(g, x, y, n, w = 2, h = 2) {
  for (let i = 0; i < n; i++) {
    const a = x + i * (w + 1);
    g.span(y, a, a + w - 1, PLATE_C.lit);
    for (let r = 1; r < h; r++) g.span(y + r, a, a + w - 1, PLATE_C.base);
  }
}

/** The dump pouch on the belt at the wearer's left hip, sagging a row for each two magazines in it. */
export function dumpPouch(g, B, kit, Y) {
  const p = (kit.gear?.carrier?.pouches ?? []).find(q => q.key === 'dump');
  if (!p) return null;
  const D = cloth(kit.armour?.pouch ?? COMBAT_SUIT.pouches), x = g.MID + B.hip - 4.2, sag = Math.floor(p.mags / 2), y1 = Y.BELT_Y + 7 + sag;
  const id = g.add(g.rows(Y.BELT_Y - 1, x, x + 7, y1), D.base);
  g.on(id, g.rows(Y.BELT_Y - 1, x, x + 7), D.light); g.on(id, g.rows(y1, x, x + 7), D.deep); g.on(id, g.rows(Y.BELT_Y - 1, x + 7, x + 7, y1), D.shade);
  g.span(Y.BELT_Y + 1, x, x + 7, D.deep);
  if (p.mags) kit.late.push(() => plates(g, x + 1, Y.BELT_Y - 3, Math.min(p.mags, 2), 2, 2));
  return id;
}

/** The drop-leg holster on the wearer's right thigh (the viewer's left), and the pistol pouch below it. */
export function holster(g, B, kit, Y) {
  const P = kit.gear?.pistol, T = kit.gear?.thigh, A = cloth(kit.armour?.pouch ?? COMBAT_SUIT.pouches), MID = g.MID;
  const x0 = MID - B.hip - 0.6, x1 = MID - B.hip + 5.4;
  if (P) {
    const id = g.add(g.scan([[x0, Y.BELT_Y + 2], [x1, Y.BELT_Y + 2], [x1, 84], [x0 + 0.6, 84]]), A.base);
    g.on(id, g.rows(Y.BELT_Y + 2, x0, x1), A.light); g.on(id, g.scan([[x1 - 1, Y.BELT_Y + 2], [x1, Y.BELT_Y + 2], [x1, 84], [x1 - 1, 84]]), A.shade);
    for (const y of [70, 79]) g.span(y, x0 - 0.6, x1 + 2.6, A.deep, id);   // (the leg straps)
    // (its mouth: the P-12's grip in the frame's black over it, or open and dark with the pistol drawn)
    if (P.place === 'holster') { g.span(Y.BELT_Y, x0 + 1.4, x1 - 1.4, 0x3a3d48, id); g.span(Y.BELT_Y + 1, x0 + 1.4, x1 - 1.4, 0x23252f, id); g.span(Y.BELT_Y + 2, x0 + 1, x1 - 1, 0x23252f, id); }
    else g.span(Y.BELT_Y + 2, x0 + 1, x1 - 1, INK, id);
  }
  if (T) {
    const D = cloth(kit.armour?.pouch ?? COMBAT_SUIT.pouches), id = g.add(g.rows(86, x0 + 0.4, x1 - 0.4, 96), D.base);
    g.on(id, g.rows(86, x0 + 0.4, x1 - 0.4), D.light); g.on(id, g.rows(96, x0 + 0.4, x1 - 0.4), D.deep); g.on(id, g.rows(88, x0 + 0.4, x1 - 0.4), D.deep);
    kit.late.push(() => plates(g, x0 + 1.4, 84, Math.min(T.mags, T.holds), 1, 2));
  }
}

/** The ear defenders' cups and their band over the crown (never under a sealed helmet). */
export function earCups(g, kit) {
  if (kit.head?.kind === 'vac') return;
  const C = cloth(EARS.cup), MID = g.MID;
  for (const x of [MID - 11, MID + 8]) { const id = g.add(g.rows(12, x, x + 2, 19), C.base); g.on(id, g.rows(12, x, x + 2), C.light); g.on(id, g.rows(19, x, x + 2), C.deep); }
  const band = g.add(g.scan([[MID - 10, 4], [MID - 6, 0.6], [MID + 6, 0.6], [MID + 10, 4], [MID + 9, 12], [MID + 8, 12], [MID + 8.6, 4.6], [MID + 5.4, 2], [MID - 5.4, 2], [MID - 8.6, 4.6], [MID - 9, 12], [MID - 10, 12]]), EARS.band);
  return band;
}

/** The pistol in the hand: 'ready' at the belly between both fists, 'hand' hanging from the right hand (the board's). */
export function pistolAt(g, B, kit, place) {
  const S = g.S, MID = g.MID, D = pistolDrawingOf(kit.gear?.pistol?.model ?? 'p12'), len = Math.round(P12_LEN_M * 100 * PX_PER_CM * S * (place === 'ready' ? 0.7 : 1));
  const shape = shapeAt('pistol', len, 1.6 * S, kit.gear?.pistol?.mag !== false, D?.fig ?? null), C = { n: cloth(0x3a3d48), u: cloth(0x23252f), v: cloth(0x8a909c) };
  const [x0, y0] = place === 'ready' ? [MID * S, 57 * S] : [(MID - B.hand) * S, (B.armIn[0][1] + 2) * S];
  const id = g.add([], 0);
  for (const [x, y, ch] of turned(shape, x0, y0, Math.PI / 2, false)) { const T = C[ch] ?? C.n; g.px(Math.round(x), Math.round(y), x > x0 + S ? T.shade : T.base, id); }
  return id;
}

/** The open palms over the fists of hands held up (gear.hands 'up'): four fingers up from each fist, a thumb in, in the skin's tones. */
export function openPalms(g, kit) {
  const to = kit.bendR, S = kit.gloves ? cloth(kit.gloves) : flesh(kit.skin), MID = g.MID;
  if (!to) return;
  for (const [sx, far] of [[-1, 0], [1, 1]]) {
    const cx = MID + sx * to[0], top = to[1] - 7 - far;
    // (the palm a little wider than the fist, the fingers above it, a seam of shade between them, the thumb toward the body)
    g.span(top + 4, cx - 2.4, cx + 2.4, far ? S.base : S.soft); g.span(top + 5, cx - 2.4, cx + 2.4, far ? S.shade : S.base);
    for (let f = 0; f < 4; f++) { const x = cx - 2.4 + f * 1.4; for (let y = top + (f === 0 || f === 3 ? 1 : 0); y < top + 4; y++) g.put(x, y, far ? S.base : S.light); }
    for (const k of [1, 2]) g.put(cx - 2.4 + k * 1.4 - 0.4, top + 3, S.shade);
    g.put(cx - sx * 3.2, top + 5, S.base); g.put(cx - sx * 3.2, top + 6, S.shade);
  }
}

/** The force-on-force mask over the face (see the header), by its look (MASK_LOOKS): never under a sealed helmet. */
export function fofMask(g, kit, look = MASK_LOOK) {
  if (kit.head?.kind === 'vac') return;
  const MID = g.MID, C = MASK_C, kind = MASK_LOOKS[look] ?? MASK_LOOKS[MASK_LOOK];
  // (the head strap from the frame's sides round over the ears, across the hair at the back of the head)
  for (const sx of [-1, 1]) { g.span(11, MID + sx * 8.6 - (sx > 0 ? 0 : 1.2), MID + sx * 8.6 + (sx > 0 ? 1.2 : 0), C.strap); g.span(12, MID + sx * 8.6 - (sx > 0 ? 0 : 1.2), MID + sx * 8.6 + (sx > 0 ? 1.2 : 0), C.strap); }
  // (the face's outline, as doll.js head() draws it, widened a pixel for the frame)
  const half = (y) => { const H = [[5.4, 0], [5.8, 3.4], [7.2, 6], [10, 7.8], [13.5, 8.2], [17.5, 8], [20.5, 7.2], [23.4, 5.6], [25.2, 3], [25.6, 0]]; for (let i = 1; i < H.length; i++) if (y <= H[i][0]) { const [y0, d0] = H[i - 1], [y1, d1] = H[i]; return d0 + (d1 - d0) * (y - y0) / (y1 - y0); } return 0; };
  const row = (y, c, inset = 0) => { const d = half(y + 0.5) + 0.6 - inset; if (d > 0.5) g.span(y, MID - d, MID + d - 1, c); };
  // (a clear part over what is drawn under it: the eyes behind a lens or a mesh still show, tinted)
  const tint = (y, c, k, inset = 0) => { const d = half(y + 0.5) + 0.6 - inset; if (d <= 0.5) return; for (const [yy, x0, x1] of g.rows(y, MID - d, MID + d - 1)) for (let x = x0; x <= x1; x++) if (g.col[yy]?.[x] !== null && g.col[yy]?.[x] !== undefined) g.col[yy][x] = mix(g.col[yy][x], c, k); };
  // (a rim's pixel at each side of a row: the frame round a clear part)
  const rim = (y, c) => { const d = half(y + 0.5) + 0.6; if (d > 0.5) { g.span(y, MID - d, MID - d + 1, c); g.span(y, MID + d - 2, MID + d - 1, c); } };
  if (kind === 'mesh') {
    // (M1: a black frame from the brow to the chin, a wire mesh inside it: the face behind every other pixel, dimmed)
    for (let y = 10; y <= 24; y++) { tint(y, C.wire, 0.45, 1); rim(y, C.frame); }
    for (let y = 10; y <= 24; y++) { const d = half(y + 0.5) - 0.8; for (let x = Math.ceil(MID - d); x < MID + d - 1; x++) if ((x + y) % 2) g.put(x, y, C.wire); }
    row(9, C.frame); row(25, C.frame);
    g.span(9, MID - 6, MID + 5, C.lit);
    return;
  }
  if (kind === 'shield') {
    // (M3: a smoked shield from the brow to the jaw in a black rim, a chin guard under it)
    row(8, C.frame);
    for (let y = 9; y <= 21; y++) { tint(y, C.smoke, 0.55, 1); rim(y, C.frame); }
    for (let y = 22; y <= 26; y++) row(y, C.frame);
    for (let y = 23; y <= 25; y++) row(y, C.shell, 1);
    g.span(10, MID - 6, MID - 3, C.glint); g.put(MID - 6, 11, C.glint);
    g.span(23, MID - 4, MID + 3, C.lit);
    return;
  }
  // (M2, the default: a black frame round a clear lens over the eyes, a moulded lower shell with three vents to the chin)
  row(10, C.frame);
  for (let y = 11; y <= 16; y++) { tint(y, C.lens, 0.35, 1); rim(y, C.frame); }
  for (let y = 17; y <= 26; y++) row(y, C.frame);
  for (let y = 18; y <= 25; y++) row(y, C.shell, 1);
  g.span(11, MID - 6, MID - 4, C.glint);
  g.span(18, MID - 5, MID + 4, C.lit);
  for (const dx of [-3, 0, 3]) for (let y = 20; y <= 22; y++) g.put(MID + dx - 0.5, y, C.vent);
}

/** What the free hand holds: a phone in the right hand (a dark slab, its screen lit), a magazine in the left. */
export function heldItem(g, B, kit) {
  const MID = g.MID, y = B.armIn[0][1] + 1;
  // (v0.0.19: the mask and the open hands, after the seams with their own rims (see the header))
  if (kit.gear?.mask) kit.late.push(() => fofMask(g, kit, kit.gear.maskLook ?? MASK_LOOK));
  if (kit.gear?.hands === 'up') kit.late.push(() => openPalms(g, kit));
  if (kit.gear?.device) handDevice(g, B, kit, 'over');
  if (kit.gear?.held === 'phone') {
    const x = MID - B.hand - 2, id = g.add(g.rows(y, x, x + 2, y + 4), 0x23252f);
    g.on(id, g.rows(y + 1, x + 1, x + 1, y + 3), 0x8fc8e8);
    return id;
  }
  if (kit.gear?.held === 'mag') {
    // (in the left hand: hanging, or at its fist where the hands are on the rifle)
    const x = kit.bendL ? MID + kit.bendL[0] - 1 : MID + B.hand - 2, yy = kit.bendL ? kit.bendL[1] - 3 : y;
    return magIn(g, x, yy);
  }
  return null;
}
// (a HAD-30 held: its body curving forward, its baseplate lit)
function magIn(g, x, y) {
  const id = g.add(g.scan([[x, y + 2], [x + 3, y + 2], [x + 4, y + 9], [x + 1, y + 9]]), PLATE_C.base);
  g.on(id, g.rows(y + 9, x + 1, x + 4), PLATE_C.lit);
  return id;
}

/** The devices' colours by their look's colour word (src/sim/arms/devices.js DEVICES[model].look). */
export const DEVICE_C = Object.freeze({ olive: 0x5a6238, steel: 0x8a909c, black: 0x2a2c34, orange: 0xc8742a, blue: 0x3a5a9a, grey: 0x7a7e86 });
const devC = (d) => cloth(DEVICE_C[d.colour] ?? DEVICE_C.olive);

/** The back's long tools over the shoulders: a halligan's bar and fork at the viewer's left, a ram's head at the right (before the torso). */
export function backDevices(g, B, kit) {
  const MID = g.MID;
  for (const d of (kit.gear?.devices ?? []).filter(x => x.face === 'back' && x.shape)) {
    const C = devC(d);
    if (d.shape === 'bar') {
      const id = g.add(g.scan([[MID - 9, 46], [MID - 7, 46], [MID - 13, 2], [MID - 15, 2]]), C.base);
      g.on(id, g.scan([[MID - 8, 46], [MID - 7, 46], [MID - 13, 2], [MID - 14, 2]]), C.light);
      g.span(1, MID - 17, MID - 15, C.base, id); g.span(0, MID - 18, MID - 17, C.light, id);   // (the fork)
      g.span(3, MID - 13, MID - 11, C.shade, id);                                                // (the adze)
    } else if (d.shape === 'ram') {
      const id = g.add(g.scan([[MID + 6, 44], [MID + 11, 44], [MID + 16, 4], [MID + 11, 4]]), C.base);
      g.on(id, g.rows(4, MID + 11, MID + 16, 6), C.light);
    }
  }
}

/** The devices' pouches on the carrier's flanks: a pouch a slot, its devices' tops over its lip (left face at the viewer's right). */
export function sideDevices(g, B, kit) {
  const MID = g.MID, D = cloth(kit.armour?.pouch ?? COMBAT_SUIT.pouches), list = (kit.gear?.devices ?? []).filter(x => x.face === 'left' || x.face === 'right');
  const pouches = {};
  for (const d of list) (pouches[`${d.face}${d.slot}`] ??= { face: d.face, slot: d.slot, devs: [] }).devs.push(d);
  for (const p of Object.values(pouches)) {
    const x0 = p.face === 'left' ? MID + 10 : MID - 15, y0 = 44 + p.slot * 9, w = 5;
    const id = g.add(g.rows(y0, x0, x0 + w - 1, y0 + 7), D.base);
    g.on(id, g.rows(y0, x0, x0 + w - 1), D.light); g.on(id, g.rows(y0 + 7, x0, x0 + w - 1), D.deep);
    g.on(id, g.rows(y0, p.face === 'left' ? x0 + w - 1 : x0, p.face === 'left' ? x0 + w - 1 : x0, y0 + 7), D.shade);
    // (an emptied pouch keeps its place, its flap down: its body and nothing over its lip)
    kit.late.push(() => p.devs.filter(d => d.shape).slice(0, 2).forEach((d, i) => {
      const C = devC(d), x = x0 + 1 + i * 2;
      if (d.shape === 'can') { g.span(y0 - 2, x, x + 1, C.light); g.span(y0 - 1, x, x + 1, C.base); g.span(y0 - 3, x + 1, x + 1, 0x8a909c); }   // (the can, its spoon)
      else if (d.shape === 'strip') { g.span(y0 - 1, x, x + 1, C.base); g.span(y0 - 2, x, x + 1, C.light); }
      else if (d.shape === 'spool') { g.span(y0 - 2, x, x + 1, C.light); g.span(y0 - 1, x, x + 1, C.shade); }
      else { g.span(y0 - 1, x, x + 1, C.base); }
    }));
  }
}

/** The memo's size (the tests' and the bench's). */
export const stampCount = () => STAMPS.size;
