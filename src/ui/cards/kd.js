// OLYMPUS cards: the KD's two paper cards, the group card at the zero and the score card at a string's end (the build sheet 0.0.7 §2.5 (b); WEAPONS §11.1, §11.4).
//
// Both are drawn in the PAPER inset (hud/paper.js faceModel and drawFace), so they take no rectangle of their own
// and never cover the line: graphics first, a line or two of words under them (VIEWS §7.6). The group card, when
// the coach has read a group on the 25 m zero card (range.js kdNow's groups: { holes, centreCm, call, ok }): the
// card's grid and its mark, the group's three holes (the earlier groups' plain and dimmer), its centre an amber
// cross and the call an arrow from it to the mark, and under it the call as the coach says it, "10 UP · 4 LEFT"
// with the turrets' arrows, or "ZEROED · LEAVE IT" once a group sits on the mark. The score card, at a string's
// CEASE FIRE (kdNow's strings: { id, line, paper, holes: [{ at, score, v, n }], score, of, v }): your face with its
// holes, each with its value beside it (V, 5 to 2), and under it the string ("300 M · 4 5 V 4 3") and its total
// ("21 OF 25 · 1 V"). The live face between (kdLiveModel) is the face as the pits have marked it (kdNow's
// pits[lane].holes), the newest ringed, the string so far under it. Every hole is the sim's, as the pits marked
// it; nothing here reads a truth the pits have not shown. Pure models; the inset draws them.
import { faceModel } from '../hud/paper.js';

/** A value's box beside its hole on the score card (inset px: one or two 3 × 5 letters at 2 px a letter pixel). */
const VAL_W = 7, VAL_H = 10;
const VAL_SPOTS = Object.freeze([[3, -11], [3, 2], [-9, -11], [-9, 2], [5, -5], [-11, -5], [0, -14], [0, 5]]);

/** The clicks of a call as the coach says them: "10 UP · 4 LEFT", "2 DOWN", or "ON" when nothing moves. */
export function callWords(call) {
  if (!call) return '';
  const e = Math.round(call.elev ?? 0), w = Math.round(call.wind ?? 0);
  if (!e && !w) return 'ON';
  return [e ? `${Math.abs(e)} ${e > 0 ? 'UP' : 'DOWN'}` : null, w ? `${Math.abs(w)} ${w > 0 ? 'RIGHT' : 'LEFT'}` : null].filter(Boolean).join(' · ');
}
/** A hole's place: kdNow's groups give it bare ([xCm, yCm]), its strings and pits as { at }. */
export const atOf = (h) => (Array.isArray(h) ? h : h?.at ?? null);
/** A value as the card writes it: 'V', '5' to '2', '-' a miss. */
export const valueOf = (h) => (h?.v ? 'V' : h && h.at && (h.score ?? 0) > 0 ? String(h.score) : '-');

/**
 * The group card: faceModel's record for the zero card with the groups' holes (the last group's fresh), its centre,
 * the call's arrow, and under it the call. groups: kdNow's; lane: your bay lane; paper: 'zero25'.
 */
export function groupCardModel(groups = [], { lane = null, paper = 'zero25' } = {}) {
  const last = groups.at(-1) ?? null, n = groups.length;
  const holes = groups.flatMap((g, i) => (g.holes ?? []).map((h, j) => ({ at: atOf(h), score: h?.score, v: h?.v, n: j + 1, old: i < n - 1 })));
  const read = !!last && (last.centreCm || last.call || last.ok);
  // (the call as the coach says it, the clicks alone: "DIAL" ran it past the inset's width at --ui 1.25; the arrow says the way)
  const said = !last ? null : last.ok ? 'ZEROED · LEAVE IT' : last.call ? callWords(last.call) : null;
  const m = faceModel(paper, { holes, group: read ? last : null, label: `LANE ${lane ?? '?'} · GROUP ${n || 1}`, scoreLines: said ? [said] : null });
  m.words = `the zero card, group ${n}: ${last?.holes?.length ?? 0} hole${(last?.holes?.length ?? 0) === 1 ? '' : 's'}${last?.centreCm ? `, its centre ${fmtCm(last.centreCm)}` : ''}${said ? ` · ${said}` : ''}`;
  m.card = 'group';
  return m;
}
const fmtCm = ([x, y]) => `${Math.abs(x).toFixed(1)} cm ${x >= 0 ? 'right' : 'left'}, ${Math.abs(y).toFixed(1)} cm ${y >= 0 ? 'low' : 'high'}`;

/** A string's line under the face: "300 M · 4 5 V 4 3" (every shot in its order, a miss '-'), and its total "21 OF 25 · 1 V". */
export function stringLines(str) {
  if (!str) return null;
  const list = (str.holes ?? []).map(valueOf);
  return [`${str.line ?? '?'} M · ${list.join(' ') || 'NO SHOTS'}`, `${str.score ?? 0} OF ${str.of ?? 0}${str.v ? ` · ${str.v} V` : ''}`];
}

/**
 * The score card: faceModel's record for the string's face with each hole's value beside it and the string's lines
 * under it. str: kdNow's string; lane: your KD lane.
 */
export function kdScoreModel(str, { lane = null } = {}) {
  const holes = (str?.holes ?? []).map((h, i) => ({ at: h.at ?? null, score: h.score, v: h.v, n: h.n ?? i + 1 }));
  const m = faceModel(str?.paper ?? 'kdA', { holes, label: `TARGET ${lane ?? '?'} · ${str?.line ?? '?'} M`, scoreLines: stringLines(str), newest: false });
  // (each hole's value beside it, at the first spot round it that meets no other value nor hole)
  const boxes = [], meets = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const h of m.holes) {
    let at = null;
    for (const [dx, dy] of VAL_SPOTS) {
      const b = { x: h.x + dx, y: h.y + dy, w: VAL_W, h: VAL_H };
      if (boxes.some(o => meets(o, b)) || m.holes.some(o => o !== h && meets(b, { x: o.x - 1.5, y: o.y - 1.5, w: 3, h: 3 }))) continue;
      at = b; break;
    }
    at ??= { x: h.x + VAL_SPOTS[0][0], y: h.y + VAL_SPOTS[0][1], w: VAL_W, h: VAL_H };
    boxes.push(at);
    h.label = valueOf({ at: true, score: h.score, v: h.v }); h.lx = at.x; h.ly = at.y;
  }
  const lines = stringLines(str);
  m.words = `${m.label}: ${lines ? lines.join(' · ') : 'no string'}`;
  m.card = 'score';
  return m;
}

/** The live face on the KD as the pits have marked it: faceModel's record, the newest ringed, the string so far under it. */
export function kdLiveModel(pit, { paper = 'kdA', lane = null, line = null, str = null } = {}) {
  const holes = (pit?.holes ?? []).map((h, i) => ({ at: h.at ?? null, score: h.score, v: h.v, n: h.n ?? i + 1 }));
  const so = str?.holes?.length ? [`${line ?? str.line ?? '?'} M · ${str.holes.map(valueOf).join(' ')}`] : null;
  const m = faceModel(paper, { holes, label: `TARGET ${lane ?? '?'} · ${line ?? '?'} M`, scoreLines: so });
  m.words = `${m.label}: ${holes.length} marked${so ? ` · ${so[0]}` : ''}`;
  m.card = 'live';
  return m;
}
