// OLYMPUS sample: your corner shown, without angles drawn on the floor (v0.0.28; the user's note of 2026-11-20 on pistol-stances T: "BTW
// not a big fan of the angles drawn on the floor, we need a slicker way of doing it").
//
// The pictures are drawn by code from ./scene.json (./make.mjs: room 1 at its entry and room 3, the house as set, the game's own plan,
// corner rule and sector wedge), at the stage's 16 px a metre, the floor and the walls as plain tones, the aid's pixels over them: two
// moments each, the aid whole as you go in (k 1) and fading once your sector is taken (k 0.5, a pixel kept while its hash is under k):
//   A-a  v0.0.17 to v0.0.27's aid (the angles): your corner's bracket, your point a ring with a dot, your #2's dotted in grey, and your
//        sector as a wedge, two dotted rays from your point to the walls and a dotted arc between them (drawn here by its own code, as
//        the game drew it, frozen);
//   A-b  v0.0.28's, the game's own (src/render/range-items.js cornerAidPixels): no rays and no arc; your sector shown where it ends,
//        a short solid mark 0.3 m long at the foot of each wall its edges meet, into your sector, its far end faded, the two marks
//        framing the stretch of wall you own; your point a ring with no dot; your #2's solid in a fainter grey; the whole fading over
//        400 ms once your sector is taken (corner.js AID_FADE_MS). The words under the pictures are wrapped to the picture's width
//        (wrapWords; the review of the picks: A-b's line ran past the right edge).
import { cornerAidPixels, AID_MINE } from '../../src/render/range-items.js';
import { pic, GAP, textW } from '../portrait-lib/card.js';

export const LOOKS = Object.freeze(['A-a', 'A-b']), DEFAULT = 'A-b';
const PPM = 16, FLOOR = 0x3b3d42, OUT = 0x1b1c21, WALL = 0x8a8f99, LABEL = 0x9aa0ab, HEAD = 0xd8dce4, LABEL_H = 9;
const WORDS = Object.freeze({ 'A-a': 'TODAY: THE WEDGE, TWO DOTTED RAYS AND AN ARC', 'A-b': 'A MARK AT THE FOOT OF EACH WALL YOUR SECTOR MEETS, NO ANGLES' });

// (v0.0.27's aid, frozen: the dots by hash, the wedge's rays and arc dotted every 2 px, your #2's dotted in AID_TWO's grey of then)
const OLD_TWO = 0x9fb2c6, BRACKET_M = 0.6, INSET_M = 0.1, RING_M = 0.28;
const hash = (i) => (((i + 1) * 2654435761) >>> 0) / 4294967296;
function oldAidPixels(aid) {
  const out = [], seen = new Set();
  let i = 0;
  const dot = (x, z, c, k) => { const px = Math.floor(x * PPM), pz = Math.floor(z * PPM), key = `${px},${pz}`; if (seen.has(key)) return; seen.add(key); if (hash(i++) >= k) return; out.push({ x: px / PPM, z: pz / PPM, c }); };
  const line = (a, b, c, k, every) => { const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * PPM / every)); for (let j = 0; j <= n; j++) dot(a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n, c, k); };
  const arc = (x, z, r, a0, a1, c, k, every) => { const n = Math.max(2, Math.ceil(r * Math.abs(a1 - a0) * PPM / every)); for (let j = 0; j <= n; j++) { const t = a0 + (a1 - a0) * j / n; dot(x + r * Math.cos(t), z + r * Math.sin(t), c, k); } };
  for (const m of aid.marks) {
    const c = m.mine ? AID_MINE : OLD_TWO, every = m.mine ? 1 : 2, { x, z, along: u, back: v } = m.corner;
    for (const w of m.mine ? [0, 1 / PPM] : [0]) {
      const o = [x + (INSET_M + w) * (u[0] + v[0]), z + (INSET_M + w) * (u[1] + v[1])];
      line(o, [o[0] + (BRACKET_M - w) * u[0], o[1] + (BRACKET_M - w) * u[1]], c, m.k, every);
      line(o, [o[0] + (BRACKET_M - w) * v[0], o[1] + (BRACKET_M - w) * v[1]], c, m.k, every);
    }
    if (m.point) { arc(m.point[0], m.point[1], RING_M, 0, 2 * Math.PI, c, m.k, every); dot(m.point[0], m.point[1], c, m.k); }
  }
  const S = aid.sector;
  for (const e of S.rays) line([S.x, S.z], e, AID_MINE, S.k, 2);
  arc(S.x, S.z, S.arcM ?? 0.6, S.fromRad, S.toRad, AID_MINE, S.k, 2);
  return out;
}

/** A room's tile (its window at 16 px a metre): the floor in its rects, the walls, the aid at strength k by the look. */
function tile(room, look, k) {
  const [x0, z0, x1, z1] = room.window, w = Math.round((x1 - x0) * PPM), h = Math.round((z1 - z0) * PPM), P = pic(w, h, OUT);
  const px = (x) => Math.floor((x - x0) * PPM), pz = (z) => Math.floor((z - z0) * PPM);
  for (const r of room.rects) for (let j = pz(r[1]); j < pz(r[3]); j++) for (let i = px(r[0]); i < px(r[2]); i++) P.put(i, j, FLOOR);
  for (const r of room.walls) for (let j = pz(r[1]); j <= pz(r[3]); j++) for (let i = px(r[0]); i <= px(r[2]); i++) P.put(i, j, WALL);
  const aid = { marks: room.marks.map(m => ({ ...m, k })), sector: { ...room.sector, k } };
  for (const q of look === 'A-a' ? oldAidPixels(aid) : cornerAidPixels(aid, PPM)) P.put(px(q.x + 0.5 / PPM), pz(q.z + 0.5 / PPM), q.c);
  return P;
}
/** The words under the pictures, by look (wrapped to the picture's width by wrapWords). */
export const NOTES = Object.freeze({
  'A-a': 'A-A: YOUR SECTOR AS A WEDGE: TWO DOTTED RAYS FROM YOUR POINT TO THE WALLS AND A DOTTED ARC BETWEEN THEM, YOUR POINT A RING WITH A DOT. YOUR #2\'S MARKS DOTTED IN GREY; THE AID FADES OVER 800 MS ONCE YOUR SECTOR IS TAKEN',
  'A-b': 'A-B: YOUR SECTOR SHOWN WHERE IT ENDS, A SHORT SOLID MARK 0.3 M INTO IT AT THE FOOT OF EACH WALL ITS EDGES MEET. YOUR POINT A RING, NO DOT; YOUR #2\'S SOLID, FAINTER; THE AID FADES OVER 400 MS ONCE YOUR SECTOR IS TAKEN',
});
/** Words broken at spaces into lines no wider than w pixels in the alphabet (textW). */
export function wrapWords(str, w) {
  const out = [];
  for (const word of String(str).split(' ')) { const last = out.at(-1); if (last !== undefined && textW(`${last} ${word}`) <= w) out[out.length - 1] = `${last} ${word}`; else out.push(word); }
  return out;
}
/** The picture for a look and the scene: { w, h, col, report }. */
export function picture(look, scene) {
  const T = scene.rooms.flatMap(room => [[room, 1, 'AS YOU GO IN'], [room, 0.5, 'FADING, YOUR SECTOR TAKEN']]).map(([room, k, words]) => ({ room, k, words, P: tile(room, look, k) }));
  const th = Math.max(...T.map(t => t.P.h)), W = GAP + T.reduce((a, t) => a + t.P.w + GAP, 0), notes = wrapWords(NOTES[look], W - 2 * GAP - 2);
  const H = GAP + LABEL_H + LABEL_H + th + GAP + notes.length * 7 + GAP;
  const P = pic(W, H);
  P.write(GAP + 1, GAP + 1, `${look}: ${WORDS[look]} · YOUR CORNER IN TEAL, YOUR #2'S IN GREY · 16 PX/M`, HEAD);
  let X = GAP;
  const Y = GAP + LABEL_H + LABEL_H;
  for (const t of T) { P.write(X + 1, Y - LABEL_H + 1, `${t.room.name}, ${t.words}`.slice(0, Math.floor(t.P.w / 4)), LABEL); P.blit(t.P, X, Y); X += t.P.w + GAP; }
  const ly = Y + th + GAP;
  notes.forEach((line, n) => P.write(GAP + 1, ly + n * 7, line, LABEL));
  const head = `${look}: ${WORDS[look]} · YOUR CORNER IN TEAL, YOUR #2'S IN GREY · 16 PX/M`;
  P.report = { frame: [W, H], look, tiles: T.map(t => ({ room: t.room.name, k: t.k, size: [t.P.w, t.P.h] })), lines: [{ x: GAP + 1, w: textW(head) }, ...notes.map(l => ({ x: GAP + 1, w: textW(l) }))] };
  return P;
}
