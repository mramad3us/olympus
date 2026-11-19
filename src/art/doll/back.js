// OLYMPUS art: the back of a man, the close figure turned away from you (VIEWS §7.7; the build sheet v0.0.23 §1 A, §3.1, item 3; portrait-facing's F1).
//
// The user, 2026-11-17: "the portraits need to be more dynamic and show us what we would be seeing". A man with his back to you is
// seen from behind: his card cannot draw his face, his chest's pouches or the gun in his hands, which his body hides. doll.js draws
// the front; this module draws, on the same grid (grid.js) and from the same kit (doll.js kitOf and dressKit: the same colours, the
// same body B), what is seen from behind, from the waist up (the legs and the boots are doll.js's own, the same from either side):
//   - the torso's back by the outfit: the blouse's (its outline, a yoke seam across the shoulders, a seam down the middle, in the
//     Valles pattern: its part joins kit.camoParts), the vac suit's shell with the pack on it, the PT tee's, a bare back (the spine
//     and the shoulder blades), a towel's; the rigger's belt across the small of the back;
//   - the plate carrier's back panel when a carrier is worn (the front plate's outline, its drag handle at the top, the webbing's
//     rows), and no magazine pouches (they are on the front);
//   - the devices on the back face (a halligan, a ram) drawn whole on the panel, where the front sees only their ends over the shoulders;
//   - the rifle: slung on the back, whole, its muzzle up over the viewer's left shoulder (the front's line seen from behind), lit from
//     above (memoised as worn.js rifleStamp is); slung in front or at the ready, only its sling across the back, the gun hidden;
//   - the arms from behind: hanging, the backs of the hands at the sides; bent onto a gun or a device held in front, the upper arm and
//     the elbow only, the forearm and the hands hidden by the body ("the hands hidden": portrait-back holds no hand pixel in the front's
//     hands' boxes); held up (a man who gave up), the backs of the open hands by the head, where a man behind him sees them;
//   - the back of the head: the skull's outline (doll.js head()'s contour), the ears, the neck; the hair by its cut (a man's high and
//     tight leaves the scalp, a medium cut covers the crown, a woman's bun or braid on it); the headgear's back (the helmet's shell and
//     its rear strap, the soft cover's crown, the vac helmet's shell with its lamp, no visor); the ear defenders' band and cups; the
//     force-on-force mask's strap across the back of the head.
// backParts(g, B, kit, Y) draws them and returns { anchors: { head, aZone } (reference coordinates: the head's centre and the
// man-target's A zone's centre, 30 cm under it: where the front's are, so the card's marks land on the back where they land on the
// front), parts: { panel: [ids], rifle: id | null, hands: [ids], strap: id | null } }. Art: it imports art and data only.
// Pure but the rifle's memo.
import { cloth, flesh, mix, smooth, ribbon, REF } from './grid.js';
import { shapeAt, turned } from '../figures/templates.js';
import { drawingOf } from '../rifles.js';
import { cutOf } from '../figures/outfits.js';
import { RIFLE_CM, DEVICE_C, earCups, HANDS_LOOKS, HANDS_LOOK } from './worn.js';

/** Doll pixels a centimetre at scale 1 (doll.js PX_PER_CM's). */
const PX_PER_CM = 0.72;
/** The head's centre (reference coordinates: doll.js head()'s contour, rows 5.4 to 25.6) and the A zone's centre, 30 cm under it. */
export const BACK_HEAD = Object.freeze([REF.W / 2, 15.5]), BACK_A = Object.freeze([REF.W / 2, 15.5 + 30 * PX_PER_CM]);
/** The rifle slung on the back seen from behind: its line, from the butt low at the viewer's right to the muzzle over the left shoulder (the front's, mirrored). */
export const BACK_RIFLE_FROM = Object.freeze([12, 70]), BACK_RIFLE_TO = Object.freeze([-18, 12]);
/** The drag handle's and the webbing's rows on the back panel (reference). */
const HANDLE_Y = 31, WEB_ROWS = Object.freeze([38, 42, 46]);
const STAMP_MAX = 32;
const STAMPS = new Map();
// (doll.js head()'s contour, half its width by row: the skull's outline is the same from either side)
const HALF = Object.freeze([[0, 5.4], [3.4, 5.8], [6, 7.2], [7.8, 10], [8.2, 13.5], [8, 17.5], [7.2, 20.5], [5.6, 23.4], [3, 25.2], [0, 25.6]]);

/** The rifle slung on the back seen from behind, whole: its pixels at scale S ([[x, y, colour]] target pixels), memoised. */
export function backRifleStamp(model, finish, S, MID, mag = true) {
  const key = `${model}|${finish ?? ''}|${S}|${MID}|${mag ? 1 : 0}`, hit = STAMPS.get(key);
  if (hit) return hit;
  const lenPx = Math.round(RIFLE_CM * PX_PER_CM * S), D = drawingOf(model ?? 'r7', finish), shape = shapeAt('rifle', lenPx, 2.4 * S, mag, D.fig);
  const C = { n: cloth(0x5c6270), u: cloth(0x2e313c), v: cloth(0xa0a8b4), ...Object.fromEntries(Object.entries(D.colours).map(([k, c]) => [k, cloth(c)])) };
  const from = [MID + BACK_RIFLE_FROM[0], BACK_RIFLE_FROM[1]], to = [MID + BACK_RIFLE_TO[0], BACK_RIFLE_TO[1]];
  const th = Math.atan2(to[1] - from[1], to[0] - from[0]), cells = turned(shape, from[0] * S, from[1] * S, th, true), has = new Set(cells.map(([x, y]) => `${x},${y}`));
  // (lit from above, as the front's: a pixel with nothing of the rifle under it is its lower edge, in shade)
  const out = cells.map(([x, y, ch]) => { const T = C[ch] ?? C.n; return [Math.round(x), Math.round(y), !has.has(`${x},${y + 1}`) ? T.shade : ch === 'v' ? T.light : T.base]; });
  if (STAMPS.size >= STAMP_MAX) STAMPS.clear();
  STAMPS.set(key, out);
  return out;
}

const lfOf = (MID) => (pts) => pts.map(([d, y]) => [MID - d, y]);
const rtOf = (MID) => (pts) => pts.map(([d, y]) => [MID + d, y]);

// (the torso's back by the outfit; returns its part)
function torsoBack(g, B, kit, Y) {
  const MID = g.MID, lf = lfOf(MID), rt = rtOf(MID), both = (pts) => [...lf(pts), ...rt(pts).reverse()], d = kit.drop ?? 0;
  const shoulders = [[B.neck + 0.5, 25.6 + d * 0.5], [B.neck + 4.5, 28.5 + d], [B.shoulder - 4, 30.6 + d], [B.shoulder - 1, 33 + d]];
  if (kit.suit) {
    // (the shell's back: its outline as the front's, the pack on it, the Corps' red at the shoulders)
    const T = cloth(kit.shell), hem = Y.BELT_Y + 2;
    const id = g.add(g.scan(both([[B.neck + 1.4, 25], [B.neck + 5, 27.6], [B.shoulder - 3, 29.6], [B.shoulder, 32.6], [B.chest + 1.6, 41], [B.waist + 1.6, Y.WAIST_Y], [B.waist + 2, hem]])), T.soft);
    g.on(id, g.scan(smooth(lf([[B.neck + 3, 27], [B.chest - 5, 36], [B.chest - 3.4, 43], [B.waist - 3.6, Y.WAIST_Y], [B.waist - 2, hem + 1], [B.hip + 9, hem + 1], [B.hip + 9, 27]]), 3)), T.shade);
    const red = cloth(kit.band ?? 0x9e3c36);
    for (const side of [lf, rt]) g.on(id, g.scan(side([[B.shoulder - 1, 29.6], [B.shoulder + 0.6, 33], [B.chest - 2, 33.4], [B.neck + 5, 28.4]])), side === rt ? red.soft : red.base);
    const P = cloth(kit.pack), pack = g.add(g.scan(smooth(both([[7, 29], [10, 31], [10.6, 46], [9, 50], [0, 50.6]]), 3)), P.base);
    g.on(pack, g.rows(29, 0, REF.W, 30), P.light); g.on(pack, g.scan(lf([[0, 31], [10.6, 31], [10.6, 51], [0, 51]])), P.shade); g.on(pack, g.rows(49, 0, REF.W), P.deep);
    const R = cloth(kit.rings), w = g.add(g.scan(both([[B.waist + 2.4, hem - 1], [B.waist + 2.4, hem + 2]])), R.base);
    g.on(w, g.rows(hem - 1, 0, REF.W), R.light); g.on(w, g.rows(hem + 1, 0, REF.W), R.deep);
    return id;
  }
  if (kit.towel) {
    // (a bare back: the spine down the middle, the shoulder blades, the waist; a towel at the chest or the waist over it)
    const S = flesh(kit.skin), id = g.add(g.scan(both([[B.neck, 24], [B.neck + 4, 28 + d], [B.shoulder - 4.4, 30.2 + d], [B.shoulder - 1.4, 32.6 + d], [B.chest - 0.4, 41], [B.waist, Y.WAIST_Y], [B.hip, Y.BELT_Y + 1]])), S.base, REF.H);
    g.on(id, g.scan(smooth(lf([[B.neck + 3, 27], [B.chest - 5, 36], [B.chest - 4, 43], [B.waist - 4, Y.WAIST_Y], [B.waist - 2, Y.BELT_Y + 2], [B.hip + 9, Y.BELT_Y + 2], [B.hip + 9, 27]]), 3)), S.shade);
    for (let y = 29; y < Y.BELT_Y; y++) g.on(id, g.rows(y, MID, MID), S.shade);
    for (const side of [lf, rt]) g.on(id, g.scan(side(ribbon([[3, 33], [8, 35], [10, 40]], 1.4))), S.shade);
    if (kit.towel) {
      const T = cloth(0xe8e2d4), top = B.small ? 36 : Y.BELT_Y - 1;
      const tw = g.add(g.scan(both([[0, top], [B.chest + 0.4, top], [B.waist + 1.4, Math.max(top, Y.WAIST_Y)], [B.hip + 1.6, Y.BELT_Y + 2], [B.hip + 2, Y.BELT_Y + 6]])), T.base);
      g.on(tw, g.rows(top, 0, REF.W), T.light); g.on(tw, g.rows(top + 1, 0, REF.W), T.shade);
    }
    return id;
  }
  const T = cloth(kit.pt ? 0x6e2a2e : kit.top), hem = kit.pt ? 64 : 68, ease = kit.pt ? 0 : 1.2;
  const id = g.add(g.scan(both([...shoulders, [B.chest + ease + 0.6 * !kit.pt, 41], [B.waist + ease + (kit.pt ? 1 : 0.6), Y.WAIST_Y], [B.hip + ease + (kit.pt ? 0.8 : 0.6), Y.BELT_Y + 2], [B.hip + ease + (kit.pt ? 1 : 0.8), hem]])), T.base);
  // (lit from the viewer's right now: the light comes from the front's left, and we stand behind him)
  g.on(id, g.scan(rt([[B.chest + 2, 41], [B.chest - 2, 31], [B.neck + 3, 28], [B.neck + 5, 31], [B.chest - 4, 34], [B.chest - 2, 42], [B.waist + 1, 50]])), T.soft);
  g.on(id, g.scan(smooth(lf([[B.neck + 3, 27], [B.chest - 5, 36], [B.chest - 3.4, 43], [B.waist - 3.6, Y.WAIST_Y], [B.waist - 2, 58], [B.hip - 2.4, hem + 2], [B.hip + 9, hem + 2], [B.hip + 9, 27]]), 3)), T.shade);
  g.on(id, g.rows(hem - 1, 0, REF.W), T.deep);
  if (!kit.pt) {
    // (the yoke's seam across the shoulder blades, the seam down the middle, a fold at the small of the back)
    g.on(id, g.scan(both([[B.shoulder - 3, 34], [B.shoulder - 3, 35], [0, 35.4], [0, 34.4]])), T.shade);
    for (let y = 36; y < hem - 1; y++) g.on(id, g.rows(y, MID, MID), T.shade);
    g.on(id, g.scan(ribbon([[MID - 9, 56], [MID, 58], [MID + 9, 56]], 1.4)), T.shade);
    kit.camoParts?.add(id);
  }
  // (the collar's back over the neck, standing a row)
  const S = flesh(kit.skin), nk = g.add(g.scan(both([[B.neck - 0.4, 22], [B.neck, 25.6], [0, 26]])), S.shade, REF.H);
  g.quiet.add(nk);
  if (!kit.pt) { const col = g.add(g.scan(both([[B.neck + 0.2, 24.4], [B.neck + 1.4, 26.4], [0, 27.4], [0, 25.6]])), T.light, 0); kit.camoParts?.add(col); }
  else g.over(g.scan(both([[B.neck + 0.2, 24.6], [B.neck + 0.6, 26.2], [0, 26.6], [0, 25.2]])), T.deep);
  return id;
}

// (the rigger's belt across the small of the back, under the blouse's hem as the front's)
function beltBack(g, B, kit, Y) {
  if (kit.suit || kit.pt || kit.towel || kit.bareArms) return null;
  const MID = g.MID, T = cloth(0x5c4a36), w = B.hip + 2.4, id = g.add(g.rows(Y.BELT_Y, MID - w, MID + w - 1, Y.BELT_Y + 2), T.base);
  g.on(id, g.rows(Y.BELT_Y, MID - w, MID + w - 1), T.light); g.on(id, g.rows(Y.BELT_Y + 2, MID - w, MID + w - 1), T.shade);
  return id;
}

// (the carrier's back panel: the front plate's outline, its drag handle, the webbing's rows; its shoulder straps)
function panelBack(g, B, kit, Y) {
  const A = kit.armour;
  if (!A) return [];
  const MID = g.MID, lf = lfOf(MID), rt = rtOf(MID), both = (pts) => [...lf(pts), ...rt(pts).reverse()], T = cloth(A.color), top = 30, foot = Y.WAIST_Y + 1, ids = [];
  const band = g.add(g.scan(both([[11, 40], [B.chest + 0.6, 41], [B.waist + 1.8, Y.WAIST_Y - 1], [B.waist + 1.4, foot + 1], [11, foot + 1]])), T.shade);
  g.on(band, g.scan(lf([[11, 40], [20, 40], [20, foot + 2], [11, foot + 2]])), T.deep);
  ids.push(band);
  for (const side of [lf, rt]) { const s = g.add(g.scan(side([[6.2, top + 1], [B.neck + 1.4, 26.6], [B.neck + 4.6, 27.6], [10.4, top + 1]])), side === rt ? T.soft : T.shade, 0); g.on(s, g.rows(27, 0, REF.W), side === rt ? T.light : T.base); ids.push(s); }
  const plate = g.add(g.scan(both([[6.4, top], [9.4, top], [12.2, top + 4], [12.4, foot], [0, foot]])), T.base);
  g.on(plate, g.scan(rt([[0, top], [9.4, top], [12.2, top + 4], [12.4, foot], [10.6, foot], [10.6, top + 5], [8.4, top + 1.6], [0, top + 1.6]])), T.soft);
  g.on(plate, g.rows(top, 0, REF.W), T.light);
  g.on(plate, g.scan(lf([[2, top + 2], [8.4, top + 2], [11, top + 5], [11, foot], [2, foot]])), T.shade);
  g.on(plate, g.rows(foot - 1, 0, REF.W), T.deep);
  // (the webbing: rows of loops across the panel, every other pixel dark)
  for (const y of WEB_ROWS) for (let x = MID - 10; x <= MID + 9; x += 2) for (const [yy, x0] of g.rows(y, x, x)) if (g.part[yy]?.[x0] === plate) g.col[yy][x0] = T.deep;
  ids.push(plate);
  // (the drag handle at the top of the panel: a loop of webbing, lit on top)
  const D = cloth(A.pouch), h = g.add(g.rows(HANDLE_Y, MID - 3, MID + 2, HANDLE_Y + 2), D.base);
  g.on(h, g.rows(HANDLE_Y, MID - 3, MID + 2), D.light); g.on(h, g.rows(HANDLE_Y + 1, MID - 2, MID + 1), D.deep);
  ids.push(h);
  return ids;
}

// (the back face's long tools, whole on the back: a halligan across the panel, the fork high at the viewer's right; a ram upright at the left)
function devicesBack(g, kit) {
  const MID = g.MID, out = [];
  for (const d of (kit.gear?.devices ?? []).filter(x => x.face === 'back' && x.shape)) {
    const C = cloth(DEVICE_C[d.colour] ?? DEVICE_C.olive);
    if (d.shape === 'bar') {
      const id = g.add(g.scan([[MID + 7, 50], [MID + 9, 50], [MID + 15, 4], [MID + 13, 4]]), C.base);
      g.on(id, g.scan([[MID + 8, 50], [MID + 9, 50], [MID + 15, 4], [MID + 14, 4]]), C.light);
      g.span(3, MID + 15, MID + 17, C.base, id); g.span(2, MID + 17, MID + 18, C.light, id);   // (the fork)
      g.span(50, MID + 5, MID + 9, C.shade, id);                                                 // (the pick and adze)
      out.push(id);
    } else if (d.shape === 'ram') {
      const id = g.add(g.scan([[MID - 11, 48], [MID - 5, 48], [MID - 11, 6], [MID - 16, 6]]), C.base);
      g.on(id, g.rows(6, MID - 16, MID - 11, 8), C.light);
      out.push(id);
    }
  }
  return out;
}

// (the rifle on the back: whole when slung there; its sling across the back when it is in front or in the hands)
function rifleBack(g, kit) {
  const R = kit.gear?.rifle, MID = g.MID;
  if (!R && !kit.model) return { rifle: null, strap: null };
  if (R?.place === 'back') {
    const id = g.add([], 0);
    for (const [x, y, c] of backRifleStamp(kit.model ?? R.model ?? 'r7', kit.finish ?? R.finish, g.S, MID, R.mag !== false)) g.px(x, y, c, id);
    return { rifle: id, strap: null };
  }
  if (R?.place === 'front' || R?.place === 'ready') {
    // (the two-point sling over the wearer's left shoulder (the viewer's right from behind) down to the right hip)
    const S = cloth(0x2c2e38), id = g.add(g.scan(ribbon([[MID + 9, 27.4], [MID + 2, 40], [MID - 7, 52], [MID - 13, 58]], 1.6)), S.base);
    g.on(id, g.scan(ribbon([[MID + 9, 27.6], [MID + 2, 40.2], [MID - 7, 52.2]], 0.6)), S.light);
    return { rifle: null, strap: id };
  }
  return { rifle: null, strap: null };
}

// (the arms from behind (see the header): hanging with the backs of the hands, bent forward with the hands hidden, or up by the head)
function armsBack(g, B, kit) {
  const MID = g.MID, lf = lfOf(MID), rt = rtOf(MID), bare = kit.bareArms, S = flesh(kit.skin), T = bare ? S : cloth(kit.sleeve), G = kit.gloves ? cloth(kit.gloves) : S;
  const out = B.armOut, inn = B.armIn, hands = [], up = kit.gear?.hands === 'up';
  for (const [side, bend, lit] of [[lf, kit.bendR, false], [rt, kit.bendL, true]]) {
    if (up) {
      // (held up: the upper arm out from the shoulder, the forearm up to the open hand beside the head; the back of the hand to us)
      const to = HANDS_LOOKS[kit.gear?.handsLook] ?? HANDS_LOOKS[HANDS_LOOK], elbow = [to[0] + 4.4, 40];
      const arm = g.add(g.scan(side(smooth([[out[0][0] - 1, 29.4], [out[2][0], 32], [elbow[0] + 2, elbow[1] + 1], [elbow[0] - 1.6, elbow[1] + 2], [inn.at(-1)[0], 38]], 3))), lit ? T.soft : T.base, 40);
      const fore = g.add(g.scan(side([[elbow[0] + 1.6, elbow[1]], [elbow[0] - 1.6, elbow[1]], [to[0] - 1.6, to[1] + 3], [to[0] + 1.6, to[1] + 3]])), lit ? T.base : T.shade);
      if (!kit.suit && !bare) { kit.camoParts?.add(arm); kit.camoParts?.add(fore); }
      const h = g.add(g.scan(side(smooth([[to[0] - 2.4, to[1] + 3], [to[0] - 2.4, to[1] - 4], [to[0] + 2.4, to[1] - 4], [to[0] + 2.4, to[1] + 3]], 2))), lit ? G.soft : G.base);
      g.on(h, g.scan(side([[to[0] - 2.4, to[1] - 4], [to[0] + 2.4, to[1] - 4], [to[0] + 2.4, to[1] - 3], [to[0] - 2.4, to[1] - 3]])), G.light);
      hands.push(h);
      continue;
    }
    if (bend) {
      // (on a gun or a device in front: the upper arm down the side to the elbow, bent forward; the forearm and the hand behind the body)
      const upper = [...out.slice(0, 5), [out[5][0], 51], [out[5][0] - 1.2, 52.4], [inn[2][0] - 0.4, 52.4], ...inn.slice(3)];
      const arm = g.add(g.scan(side(smooth(upper, 3))), lit ? T.soft : T.base, 40);
      g.on(arm, g.scan(side([[out[5][0] - 3, 49], [out[5][0] + 0.4, 49], [out[5][0] + 0.4, 53], [out[5][0] - 3, 53]])), T.shade);   // (the elbow's crease)
      if (!kit.suit && !bare) kit.camoParts?.add(arm);
      continue;
    }
    // (hanging: the arm down the side, the back of the hand at the cuff)
    const arm = g.add(g.scan(side(smooth([...out, ...inn], 3))), lit ? T.soft : T.base, 40);
    g.on(arm, g.scan(side([[edgeAt(inn, 44) + 2.4, 41], [edgeAt(inn, 60) + 2.4, 60], [edgeAt(inn, 68) + 2.2, inn[0][1] + 1], [edgeAt(inn, 68) - 3, inn[0][1] + 1], [edgeAt(inn, 44) - 3, 40]])), T.shade);
    if (!kit.suit && !bare) kit.camoParts?.add(arm);
    const y0 = inn[0][1] - 1, h = g.add(g.scan(side(smooth([[B.hand - 3.4, y0], [B.hand + 2.6, y0], [B.hand + 2.4, y0 + 8], [B.hand - 0.6, y0 + 10], [B.hand - 3, y0 + 7]], 3))), lit ? G.soft : G.base);
    g.on(h, g.scan(side([[B.hand - 3.4, y0], [B.hand + 2.6, y0], [B.hand + 2.6, y0 + 1.4], [B.hand - 3.4, y0 + 1.4]])), G.light);
    hands.push(h);
  }
  kit.handIds?.push(...hands);
  return hands;
}
// (an arm's inner contour at a row: [[d, y]] listed by row, descending)
const edgeAt = (inn, y) => { const t = [...inn].reverse(); for (let i = 0; i + 1 < t.length; i++) if (y <= t[i + 1][1]) return t[i][0] + (t[i + 1][0] - t[i][0]) * (y - t[i][1]) / (t[i + 1][1] - t[i][1]); return t.at(-1)[0]; };

// (the back of the head: the skull's outline, the ears, the hair by its cut; then the headgear's back)
function headBack(g, B, kit) {
  const MID = g.MID, lf = lfOf(MID), rt = rtOf(MID), S = flesh(kit.skin), sealed = kit.head?.kind === 'vac';
  const neck = g.add(g.scan([...lf([[B.neck, 20], [B.neck + 0.4, 25], [B.neck + 1, 28]]), ...rt([[B.neck + 1, 28], [B.neck + 0.4, 25], [B.neck, 20]])]), S.shade, REF.H);
  g.quiet.add(neck);
  if (!sealed) for (const [side, c] of [[lf, S.shade], [rt, S.base]]) g.add(g.scan(side([[7.4, 12.6], [9.8, 13], [10, 16], [9, 18.8], [7.2, 19]])), c);
  const skull = g.add(g.scan(smooth([...lf(HALF.slice(0, -1)), ...rt(HALF.slice(1)).reverse()], 4)), S.base);
  g.on(skull, g.scan(smooth(lf([[2, 5], [6, 8], [8, 14], [7, 22], [3, 25.6], [10, 25.6], [10, 5]]), 3)), S.shade);
  if (!sealed) {
    const cut = cutOf(kit.hair?.style), step = kit.hair?.step ?? 0, H = cloth(kit.hair?.color ?? 0x2a1c18);
    // (the hair's reach down the back of the head by the cut: a medium cut to the nape's top, a high and tight to the crown, a woman's to the nape)
    const low = cut === 'shaved' ? 0 : cut === 'highTight' ? 9 + step : cut === 'lowReg' ? 14 + step : cut === 'medReg' ? 18 + step : 21 + 0.6 * step;
    if (low > 0) {
      const hair = g.add(g.scan(smooth([...lf(HALF.filter(([, y]) => y <= low).map(([d, y]) => [d + 0.4, y - 0.4])), [MID, low + 0.6], ...rt(HALF.filter(([, y]) => y <= low).map(([d, y]) => [d + 0.4, y - 0.4])).reverse()], 3)), H.base);
      g.on(hair, g.scan(smooth(rt([[0, 3], [4, 4.4], [6, 7], [3, 7.4], [0, 6]]), 2)), H.light);
      g.on(hair, g.scan(lf([[3, 2], [9, 2], [9, low + 1], [5, low + 1]])), H.shade);
      // (the hairline at the nape: the clippers' fade, skin darkened toward the hair's colour, a row under it)
      g.on(skull, g.rows(Math.min(24, low + 1), MID - 7, MID + 6), mix(S.base, H.shade, 0.4));
    } else g.on(skull, g.rows(5, MID - 4, MID + 3, 9), mix(S.base, H.shade, 0.25));
    if (cut === 'bun') { const b = g.add(g.scan(smooth([[MID - 3.6, 10], [MID - 3, 6.6], [MID, 5.8], [MID + 3, 6.6], [MID + 3.6, 10], [MID, 11.6]], 3)), H.base); g.on(b, g.rows(7, MID - 2, MID + 1), H.light); g.on(b, g.rows(10, MID - 3, MID + 3), H.shade); }
    if (cut === 'braid') { for (let y = 4; y <= 20; y++) g.put(MID + (y % 2 ? 0 : -1), y, y % 2 ? H.light : H.shade); }
  }
  const h = kit.head;
  if (h?.kind === 'helmet') {
    const T = cloth(h.color), add = (pts, c) => g.add(g.scan(pts), c);
    const shell = add(smooth([[MID - 10.6, 14.6], [MID - 11.2, 8], [MID - 9.2, 3.2], [MID - 4, 1.2], [MID + 4, 1.2], [MID + 9.2, 3.2], [MID + 11.2, 8], [MID + 10.6, 14.6], [MID - 0, 15.4]], 4), T.base);
    g.on(shell, g.scan(smooth([[MID + 8.6, 6.4], [MID + 5, 3], [MID - 1, 2.6], [MID + 4, 5.4]], 3)), T.light);
    g.on(shell, g.scan(lf([[3, 1], [5, 16], [11, 16], [11, 1]])), T.shade);
    g.on(shell, g.rows(13, 0, REF.W, 14), T.deep);
    // (the rear strap and its pad under the brim's back)
    const st = g.add(g.rows(15, MID - 6, MID + 5, 16), 0x2c2e38); g.on(st, g.rows(15, MID - 2, MID + 1), 0x3a3d48);
  } else if (h?.kind === 'cover') {
    const T = cloth(0x9a6a4a), top = g.add(g.scan(smooth([[MID - 9.6, 10.4], [MID - 10.4, 6], [MID - 9, 2.8], [MID + 9, 2.8], [MID + 10.4, 6], [MID + 9.6, 10.4]], 4)), T.base);
    g.on(top, g.rows(3, MID - 6, MID + 8), T.light); g.on(top, g.scan(lf([[4, 2], [5, 11], [13, 11], [13, 2]])), T.shade); g.on(top, g.rows(10, 0, REF.W), T.deep);
    kit.camoParts?.add(top);
  } else if (sealed) {
    // (the vac helmet from behind: the shell all round, no visor, its lamp on the side, the neck ring)
    const T = cloth(h.helm?.shell ?? h.color), shellId = g.add(g.scan(smooth([[MID - 12.4, 16], [MID - 13, 8], [MID - 10, 1.4], [MID, -0.6], [MID + 10, 1.4], [MID + 13, 8], [MID + 12.4, 16], [MID + 11, 24], [MID + 7, 28.6], [MID - 7, 28.6], [MID - 11, 24]], 4)), T.base);
    g.on(shellId, g.scan(smooth([[MID + 10, 6], [MID + 6, 1.8], [MID - 2, 1.2], [MID + 5, 4.4]], 3)), T.light);
    g.on(shellId, g.scan(lf([[6, -1], [9, 28], [14, 28], [14, -1]])), T.shade);
    g.on(shellId, g.rows(20, MID - 9, MID + 8), T.deep);
    const R = cloth(kit.rings), ring = g.add(g.scan([...lf([[11, 27.4], [12, 30.4]]), ...rt([[12, 30.4], [11, 27.4]])]), R.base);
    g.on(ring, g.rows(27, 0, REF.W), R.light); g.on(ring, g.rows(29, 0, REF.W), R.deep);
    const lamp = g.add(g.rows(10, MID + 12, MID + 13, 12), 0xf8e08a); kit.glow?.add(lamp);
  } else if (h?.kind === 'ring') {
    const R = cloth(kit.rings), ring = g.add(g.scan([...lf([[9.4, 26.2], [10.4, 29.4]]), ...rt([[10.4, 29.4], [9.4, 26.2]])]), R.base);
    g.on(ring, g.rows(26, 0, REF.W), R.light); g.on(ring, g.rows(28, 0, REF.W), R.deep);
  }
  if (kit.gear?.ears) earCups(g, kit);
  // (the force-on-force mask's strap round the back of the head, never under a sealed helmet)
  if (kit.gear?.mask && !sealed) { const m = g.add(g.rows(11, MID - 8.6, MID + 7.6, 12), 0x2c2e35); g.on(m, g.rows(11, MID - 8.6, MID + 7.6), 0x3a3d46); }
  return skull;
}

/**
 * The back of a man on the doll's grid (see the header): g the grid, B the body (doll.js BODY[sex]), kit doll.js kitOf's (dressKit
 * applied), Y the rows ({ BELT_Y, WAIST_Y }). Draws from the waist up; returns { anchors, parts }.
 */
export function backParts(g, B, kit, Y) {
  const torso = torsoBack(g, B, kit, Y);
  beltBack(g, B, kit, Y);
  const panel = panelBack(g, B, kit, Y);
  const devices = devicesBack(g, kit);
  const { rifle, strap } = rifleBack(g, kit);
  const hands = armsBack(g, B, kit);
  const skull = headBack(g, B, kit);
  return { anchors: { head: [...BACK_HEAD], aZone: [...BACK_A] }, parts: { torso, panel, devices, rifle, strap, hands, skull } };
}

/** The memo's size (the tests'). */
export const backStampCount = () => STAMPS.size;
