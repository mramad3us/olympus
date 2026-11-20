// OLYMPUS tests: F120 to F122, every portrait as you would see it (the build sheet v0.0.24 §8, its F117 to F119 read three higher: v0.0.23 took F97 to F99).
//
// The user, 2026-11-17: "the portraits need to be more dynamic and show us what we would be seeing, including what they are
// holding"; and their standing rule of 2026-11-19: "keep things simple, it's a game. I love the attention do detail, but only if it
// won't impact gameplay or performance (or introduce so much complexity it creates bugs)". The gauges, each a pure function its
// suites call and print:
//   F120 the card's facing as scored (facingDrawn, marksOnPlane): a man turned past the back's band from your eye is drawn by the back
//        pick (F1, from behind), one side on by the side pick (F3, the head turned; F2 the profile only if scored), front on else; the
//        marks on the man-target's plane side on at the cosine of his yaw from the figure's middle, within a pixel, and front on and
//        from behind where the front card puts them (P's call: a man-target has no back);
//   F121 his light and the jamb (lightDrawn, jambDrawn): a card at a level from LIGHT_FULL_K up (the house's lit rooms 0.75, "Bang"
//        1.0) byte for byte the unlit card; below it every figure pixel darkened by lightK, never below LIGHT_FLOOR_K (the figure's
//        mean luminance within LUM_TOL of the share); the share a jamb hides from a side drawn in the jamb's tones over the figure's
//        columns, nothing else moved; no doll painted for a change of light or cover (the doll's key holds neither);
//   F122 the truth cards (truthAgrees): each engaged stand's T.atFirst written once at your first round at it and never rewritten,
//        equal to the record a replay from a save made before that round computes at its tick (his hold, pose, facing and aim; a
//        board what its stand holds), and the end card's rows one a stand engaged, in the order engaged.
// All enforced from E's merge (LOOKS_ENFORCED); F123, every pick drawn as picked, is looks-applied's own.
import { LIGHT_FULL_K, LIGHT_FLOOR_K, lightK } from '../src/data/portrait.js';
import { JAMB_C } from '../src/art/doll/portrait.js';

/** The gauges this file enforces (from E's merge). */
export const LOOKS_ENFORCED = Object.freeze(new Set(['F120', 'F121', 'F122']));
/** F121's tolerance on the figure's mean luminance against its light's share (P§8 item 8: "within 5% of LIGHT_FLOOR_K's"). */
export const LUM_TOL = 0.05;
/** F120's tolerance: a mark within this of its place on the plane (card px). */
export const MARK_TOL_PX = 1;

const hexOf = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);
const lumOf = (c) => 0.299 * ((c >> 16) & 255) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255);

/** F120 for one record and its doll: { ok, want, got } (pm.pose: the doll's drawn pose, facing and hold). picks: { back, side }. */
export function facingDrawn(rec, pm, picks = { back: 'F1', side: 'F3' }) {
  // (v0.0.28, F4: side on, a true profile facing his side, 'sideL' or 'sideR' (src/art/doll/side.js))
  const want = rec.facing === 'back' ? (picks.back === 'F1' ? 'back' : 'front') : rec.facing === 'left' || rec.facing === 'right' ? (picks.side === 'F2' ? 'profile' : picks.side === 'F4' ? (rec.facing === 'left' ? 'sideL' : 'sideR') : rec.facing) : 'front';
  const got = pm?.pose?.facing ?? 'front';
  return { ok: got === want, want, got };
}
/**
 * F120's marks: the side card's marks against the front card's, each at the cosine of the yaw from the figure's middle (midX, card
 * px). front, side: paintHitcard's marks ([{ n, x, y }]). { ok, worst (px), k }.
 */
export function marksOnPlane(front, side, yawQ, midX) {
  const k = Math.abs(Math.cos(yawQ));
  let worst = 0;
  for (const m of front) {
    const s = side.find(x => x.n === m.n);
    if (!s) return { ok: false, worst: Infinity, k };
    worst = Math.max(worst, Math.abs(s.x - (midX + (m.x - midX) * k)), Math.abs(s.y - m.y));
  }
  return { ok: worst <= MARK_TOL_PX, worst: Math.round(worst * 100) / 100, k: Math.round(k * 1000) / 1000 };
}

/**
 * F121's light for one card painted unlit and at a level: { ok, same, differ, lum, want }. figure: a Uint8Array over the card
 * (1 on the figure's pixels, from the unlit card against its ground). At LIGHT_FULL_K and up the two are the same bytes; below,
 * every differing pixel is a figure's, and the figure's mean luminance over the unlit's is lightK's share within LUM_TOL.
 */
export function lightDrawn(unlit, lit, level, figure) {
  let differ = 0, off = 0, a = 0, b = 0;
  for (let i = 0; i < unlit.data.length; i++) {
    if (unlit.data[i] !== lit.data[i]) { differ++; if (!figure[i]) off++; }
    if (figure[i]) { a += lumOf(hexOf(unlit.data[i])); b += lumOf(hexOf(lit.data[i])); }
  }
  const want = lightK(level), lum = a > 0 ? b / a : 1;
  if (level >= LIGHT_FULL_K) return { ok: differ === 0, same: differ === 0, differ, lum: 1, want: 1 };
  return { ok: off === 0 && Math.abs(lum - want) <= LUM_TOL && want >= LIGHT_FLOOR_K, same: false, differ, off, lum: Math.round(lum * 1000) / 1000, want: Math.round(want * 1000) / 1000 };
}
/**
 * F121's jamb: the card with a share hidden from the left against the whole one: { ok, jamb (the hidden columns' pixels in the
 * jamb's tones), cols, outside (pixels moved right of the jamb's edge) }. fx0, fx1: the figure's columns on the card; figH: the
 * figure's rows; left: the hidden share.
 */
export function jambDrawn(whole, hid, { fx0, fx1, figH, left }) {
  const W = whole.w, edge = fx0 + Math.round((fx1 - fx0 + 1) * left), tones = new Set([JAMB_C.face, JAMB_C.lit, JAMB_C.ink]);
  let jamb = 0, cells = 0, outside = 0;
  for (let y = 1; y < figH; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x, c = hexOf(hid.data[i]);
    if (x < edge) { cells++; if (tones.has(c)) jamb++; } else if (hid.data[i] !== whole.data[i]) outside++;
  }
  return { ok: cells > 0 && jamb === cells && outside === 0, jamb, cells, edge, outside };
}

/** F122 for one stand: { ok, why } given its capture (T.atFirst) and the oracle's record ({ how, pose, facing, aimAt, face, holds }). */
export function truthAgrees(atFirst, oracle) {
  if (!atFirst) return { ok: false, why: 'no capture' };
  const keys = ['how', 'pose', 'facing', 'aimAt', 'face', 'holds'], off = keys.filter(k => (atFirst[k] ?? null) !== (oracle?.[k] ?? null));
  return { ok: !off.length, why: off.length ? `${off.map(k => `${k} ${atFirst[k]} against ${oracle?.[k]}`).join(', ')}` : null };
}
