// OLYMPUS render: interiors as a dollhouse is seen from above, and ship decks the same way.
//
// tradecraft's cutaway (src/render/interior.js, DESIGN.md Look): each room's floor; the north wall
// standing to the ceiling (WALL_H_M), painted room by room with its skirting and what is on it (its
// doors, signs, the emergency lamps); the west and east walls to the ceiling too, seen edge on; every
// other wall cut to CUT_H_M (1.0 m) with a dark top (CUT), its face the finish of the room in front of
// it, the south boundary's the building's outside; round it all, the dark. The wall rule is
// src/render/walls.js. OLYMPUS adds a deck mode (DESIGN.md: "Ship interiors are stacks of decks ...
// one deck shows at a time with its walls cut away"): the same rule with deck plating underfoot and
// bulkheads of riveted plate, a conduit along their top, door frames striped for danger.
//
// And the ship's and the base's emergency lighting, always built, lit only when the mood says
// (src/render/moods.js, after LONGHAUL's room cameras):
//   - floor strips: a strip of amber along the foot of every wall, glow class STRIP, and their spill
//     light on the floor (glow lines into the area's strip-light map);
//   - battle strips: a red line along the walls at 1.3 m (the north wall) or 0.8 m (cut walls, my call,
//     so it shows below their cut), painted into the wall's face as glow class BATTLE, its spill
//     light on the walls and the floor near them;
//   - emergency lamps: an amber lens on the north wall at 2.2 m (glow class EMERGENCY) and a lamp of
//     kind 'emergency' that pools on the floor in front of it.
// The plan, plain data:
//   { x0, z0, x1, z1, rooms: [{ x0, z0, x1, z1, floor, floorColor, finish }], openings: [{ axis, at, a, b,
//     kind: 'door' | 'gap', label }], decor: [{ kind: 'emergency' | 'sign' | 'board' | 'stencil' | 'clock',
//     x, y, w, h, text }], lamps: [{ x, z, ... }] }
// A door on the north wall is painted on it (tradecraft's front door); anywhere else an opening is a
// gap in the wall with a threshold. Everything goes into an area (src/render/batch.js): one draw call.
import { wallsOf, wallRect, WALL_H_M, CUT_H_M, OUTER_T_M } from './walls.js';
import { tile } from '../art/tiles.js';
import { GLOW, paint } from '../art/paint.js';
import { tone, hash3 } from '../art/tone.js';
import { bevel, rivet, hazard, plate, mottle } from '../art/brush.js';
import { text, textWidth, stencil } from '../art/font.js';
import { SHIP_GLOWS } from '../art/palette.js';

export { WALL_H_M, CUT_H_M };
/** A cut wall's top and the edge-on walls' ends: the dark of a section drawing. */
export const CUT = 0x3a3f4b;
export const DARK = 0x14151c;
export const STRIP = SHIP_GLOWS[0], BATTLE_RED = SHIP_GLOWS[1], EMERGENCY_AMBER = 0xffb347;
/** Heights of the battle strip (north wall, cut walls), the emergency lamps; the floor strips' width; metres. */
export const BATTLE_Y_M = 1.3, BATTLE_CUT_Y_M = 0.8, EMERGENCY_Y_M = 2.2, STRIP_W_M = 0.08;

/** Finishes: a base building's painted block (two-tone, a wainscot to 1 m) and a ship's bulkhead. */
export const FINISHES = Object.freeze({
  block: { kind: 'block', c1: 0xd2c8b0, c2: 0x6f735e, outside: 0xa89c86, floor: 'slab', floorColor: 0x8f8d86 },
  bulkhead: { kind: 'bulkhead', c1: 0x8a949c, c2: 0x5c6670, outside: 0x3c4148, floor: 'deck', floorColor: 0x6a7076 },
});

// ---------- painting a wall's face (px, pixels, y down; the face h px tall from the floor) ----------

/** A finish over (x, 0, w, h) of a face hPx tall standing from the floor (rows from the top). */
function paintFinish(px, x, w, h, f, ppm, { battleY = null } = {}) {
  const row = (yM) => h - Math.round(yM * ppm);                    // (a height above the floor as a row from the top)
  if (f.kind === 'bulkhead') {
    const seam = row(1.4), pw = Math.max(8, Math.round(1.0 * ppm));
    px(x, 0, w, h, f.c1);
    px(x, seam, w, h - seam, f.c2);
    for (let i = x; i < x + w; i += pw) {
      const ww = Math.min(pw, x + w - i);
      bevel(px, i, 0, ww, seam, f.c1, 1.2); bevel(px, i, seam, ww, h - seam, f.c2, 1.2);
      for (const yy of [2, seam - 3, seam + 2, h - 4]) if (yy > 0 && yy < h - 1) { rivet(px, i + 2, yy, yy < seam ? f.c1 : f.c2); rivet(px, i + ww - 3, yy, yy < seam ? f.c1 : f.c2); }
    }
    const cy = row(2.45), ch = Math.max(2, Math.round(0.09 * ppm));  // (a conduit along the top, its brackets)
    if (cy > 0 && cy < h) {
      px(x, cy, w, ch, 0xa8b0b6); px(x, cy, w, 1, 0xc8d0d4); px(x, cy + ch - 1, w, 1, 0x5c6670);
      for (let i = x + 4; i < x + w; i += Math.round(1.2 * ppm)) px(i, cy - 1, 2, ch + 2, 0x4c5262);
    }
  } else {
    // (painted block: courses every 0.2 m, half bond, the joints a shade darker; the wainscot to 1 m, a dark rule over it)
    const wain = row(1.0), bh = Math.max(2, Math.round(0.2 * ppm)), bw = Math.max(4, Math.round(0.4 * ppm));
    for (let y = 0, r = 0; y < h; y += bh, r++) {
      for (let i = x + (r % 2) * Math.floor(bw / 2) - bw; i < x + w; i += bw) {
        const a = Math.max(x, i), b = Math.min(x + w, i + bw);
        if (b <= a) continue;
        const d = ((hash3(i, r, 7) % 5) - 2) * 0.006;
        for (const [y0, y1, c] of [[y, Math.min(y + bh, wain), f.c1], [Math.max(y, wain), y + bh, f.c2]]) if (y1 > y0) {
          px(a, y0, b - a, y1 - y0, tone(c, d));
          if (b === i + bw) px(b - 1, y0, 1, y1 - y0, tone(c, -0.03));
        }
      }
      px(x, y + bh - 1, w, 1, tone(y + bh - 1 < wain ? f.c1 : f.c2, -0.035));
    }
    px(x, wain - 1, w, 2, tone(f.c2, -0.12));
    px(x, 0, w, 2, tone(f.c1, 0.04));                                 // (the cornice)
  }
  const sk = Math.max(2, Math.round(0.1 * ppm));                     // (the skirting)
  px(x, h - sk, w, sk, tone(f.c2, -0.22)); px(x, h - sk, w, 1, tone(f.c2, -0.1));
  if (battleY !== null) { const by = row(battleY); px(x, by, w, Math.max(2, Math.round(0.06 * ppm)), BATTLE_RED, GLOW.BATTLE); }
}

/** A door painted on a wall face: its frame, leaf, handle, the label over it; (x, w) px, h the face's rows. */
function paintDoor(px, x, w, h, f, ppm, label) {
  const top = h - Math.round(2.1 * ppm), fr = Math.max(2, Math.round(0.08 * ppm));
  const frameC = f.kind === 'bulkhead' ? 0x4c5262 : 0x6a7182, leafC = f.kind === 'bulkhead' ? 0x6e7882 : 0x5f6650;
  px(x - fr, top - fr, w + 2 * fr, h - top + fr, frameC); bevel(px, x - fr, top - fr, w + 2 * fr, h - top + fr, frameC, 1.4);
  if (f.kind === 'bulkhead') hazard(px, x - fr, top - fr, w + 2 * fr, fr, { band: Math.max(2, Math.round(0.1 * ppm)) });
  px(x, top, w, h - top, leafC); bevel(px, x, top, w, h - top, leafC, 1.2);
  const ww = Math.max(3, Math.round(0.24 * ppm)), wh = Math.max(3, Math.round(0.36 * ppm));   // (a small wired window)
  px(x + Math.round((w - ww) / 2), top + Math.round(0.3 * ppm), ww, wh, 0x2b3a44); px(x + Math.round((w - ww) / 2), top + Math.round(0.3 * ppm), ww, 1, 0x4c6070);
  const hy = h - Math.round(1.05 * ppm);                             // (the handle and push plate)
  px(x + w - Math.round(0.18 * ppm), hy, Math.max(2, Math.round(0.1 * ppm)), 2, 0xb8bdc8); px(x + w - Math.round(0.18 * ppm), hy + 2, Math.max(2, Math.round(0.1 * ppm)), 1, 0x353947);
  if (label) {                                                        // (a white plate over the door, the room's number)
    const tw = textWidth(label) + 4, ty = top - fr - 9;
    if (ty > 0) { px(x + Math.round((w - tw) / 2), ty, tw, 8, 0xe2dac6); bevel(px, x + Math.round((w - tw) / 2), ty, tw, 8, 0xe2dac6); text(px, x + Math.round((w - tw) / 2) + 2, ty + 2, label, 0x23252f); }
  }
}

/** What hangs on the north wall (decor), painted at (x, y) px, w × h px. */
function paintDecor(px, d, x, y, w, h, f) {
  if (d.kind === 'emergency') {                                      // (a lamp housing, its amber lens: lit in an emergency)
    px(x, y, w, h, 0x4c5262); bevel(px, x, y, w, h, 0x4c5262, 1.2);
    px(x + 1, y + 1, w - 2, h - 2, EMERGENCY_AMBER, GLOW.EMERGENCY);
    return;
  }
  if (d.kind === 'board') {                                           // (a notice board: cork, papers pinned)
    px(x, y, w, h, 0x6b4636); px(x + 1, y + 1, w - 2, h - 2, 0xb48459);
    for (let k = 0, i = x + 2; i < x + w - 4; k++, i += 5) { const ph = 4 + (hash3(k, 3) % 4), py = y + 2 + (hash3(k, 5) % Math.max(1, h - ph - 3)); px(i, py, 4, ph, k % 3 ? 0xf4efe6 : 0xe8d888); px(i + 1, py, 1, 1, 0x9e3c36); px(i, py + 2, 4, 1, 0x8f96a6); }
    return;
  }
  if (d.kind === 'clock') { px(x, y, w, h, 0x23252f); px(x + 1, y + 1, w - 2, h - 2, 0xf4efe6); const cx = x + Math.floor(w / 2), cy = y + Math.floor(h / 2); px(cx, y + 2, 1, cy - y - 1, 0x23252f); px(cx, cy, Math.max(1, Math.floor(w / 3)), 1, 0x23252f); return; }
  if (d.kind === 'stencil') { stencil(px, x, y, d.text ?? 'MCRN', d.color ?? tone(f.c1, -0.35)); return; }
  // a sign: a plate, its text centred
  const c = d.color ?? 0x9e3c36;
  px(x, y, w, h, c); bevel(px, x, y, w, h, c, 1.2);
  if (d.text) text(px, x + Math.max(1, Math.round((w - textWidth(d.text)) / 2)), y + Math.max(1, Math.round((h - 5) / 2)), d.text, d.textColor ?? 0xf4efe6);
}

/**
 * Build a plan into an area (src/render/batch.js): floors, walls by the cutaway's rule, the north
 * wall painted, strips and lamps. { deck: the ship's look (FINISHES.bulkhead), finish: a finish to use
 * (by name or object), strips, battle, seed }. Returns { walls, rooms } for the caller's reference.
 */
export function buildCutaway(area, plan, { deck = false, finish = null, strips = true, battle = true } = {}) {
  const ppm = area.ppm;
  const F = typeof finish === 'string' ? FINISHES[finish] : finish ?? (deck ? FINISHES.bulkhead : FINISHES.block);
  const fin = (r) => (r.finish ? (typeof r.finish === 'string' ? FINISHES[r.finish] : r.finish) : F);
  const runs = wallsOf(plan);
  // The dark round it all, under the floor (a few pixels down: a flat piece snaps to the pixel grid, and
  // two centimetres under would snap to the floor's own height and fight it for the depth).
  area.ground({ x0: plan.x0 - 30, z0: plan.z0 - 20, x1: plan.x1 + 30, z1: plan.z1 + 20, y: -0.15, color: DARK });
  // Floors, a tile each, world-anchored so they run on under the walls.
  for (const r of plan.rooms) {
    const f = fin(r);
    area.ground({ x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1, top: tile(r.floor ?? f.floor, { metres: (r.floor ?? f.floor) === 'slab' ? 2 : 1, ppm, c: r.floorColor ?? f.floorColor }) });
  }
  // The north wall: one box the plan's width and the outer walls' thickness, its face painted room by room.
  const bx0 = plan.x0 - OUTER_T_M, bx1 = plan.x1 + OUTER_T_M, roomsN = plan.rooms.filter(r => Math.abs(r.z0 - plan.z0) < 0.01);
  const doorsN = (plan.openings ?? []).filter(o => o.axis === 'x' && Math.abs(o.at - plan.z0) < 0.01);
  const northFace = (px, w, h) => {
    px(0, 0, w, h, CUT);
    const X = (m) => Math.round((m - bx0) * ppm);
    for (const r of roomsN) paintFinish(px, X(r.x0), X(r.x1) - X(r.x0), h, fin(r), ppm, { battleY: battle ? BATTLE_Y_M : null });
    for (const d of plan.decor ?? []) {
      // (a stencil is as wide as its text in the 3 × 5 font, whatever the density: centred on its x)
      const dw = d.kind === 'stencil' ? textWidth(d.text ?? 'MCRN') : Math.max(3, Math.round((d.w ?? (d.kind === 'emergency' ? 0.3 : 0.6)) * ppm));
      const dh = d.kind === 'stencil' ? 5 : Math.max(3, Math.round((d.h ?? (d.kind === 'emergency' ? 0.14 : 0.4)) * ppm));
      const y = d.y ?? (d.kind === 'emergency' ? EMERGENCY_Y_M : 1.5);
      paintDecor(px, d, X(d.x) - Math.floor(dw / 2), h - Math.round(y * ppm) - dh, dw, dh, F);
    }
    for (const o of doorsN) paintDoor(px, X(o.a), X(o.b) - X(o.a), h, F, ppm, o.label);
  };
  area.box({ x0: bx0, x1: bx1, y0: 0, y1: WALL_H_M, z0: plan.z0 - OUTER_T_M, z1: plan.z0, faces: { front: northFace, sides: tone(CUT, 0.06), top: CUT } });
  // The other walls: side walls full height (edge on), the rest cut, their faces the room's in front.
  for (const w of runs.filter(w => w.side !== 'n')) {
    const q = wallRect(w);
    if (w.axis === 'x') {
      const front = plan.rooms.find(r => Math.abs(r.z0 - w.at) < 0.01 && r.x0 < w.b && r.x1 > w.a);
      const face = w.side === 's' ? outsideFace(F) : front ? (px, ww, hh) => paintFinish(px, 0, ww, hh, fin(front), ppm, { battleY: battle ? BATTLE_CUT_Y_M : null }) : tone(CUT, 0.1);
      area.box({ ...q, y0: 0, y1: w.h, faces: { front: face, sides: tone(CUT, 0.06), top: CUT } });
    } else {
      area.box({ ...q, y0: 0, y1: w.h, faces: { front: tone(CUT, 0.1), sides: tone(CUT, 0.06), top: CUT } });
    }
  }
  // Thresholds in the gaps (a door on the north wall is painted on it, with a plate of floor before it).
  for (const o of plan.openings ?? []) {
    const onNorth = o.axis === 'x' && Math.abs(o.at - plan.z0) < 0.01;
    const z0 = onNorth ? o.at : o.at - 0.08, z1 = onNorth ? o.at + 0.3 : o.at + 0.08;
    const t = deck ? hazardTile(ppm) : 0x6a7182;
    if (o.axis === 'x') area.ground({ x0: o.a, z0, x1: o.b, z1, lift: 0.002, top: t });
    else area.ground({ x0: o.at - 0.08, z0: o.a, x1: o.at + 0.08, z1: o.b, lift: 0.002, top: t });
  }
  // Floor strips along every wall's foot, inside; and where their light falls. Battle strips' light along the walls they run on.
  if (strips || battle) {
    const S = STRIP_W_M, put = (x0, z0, x1, z1) => {
      if (x1 - x0 < 0.05 && z1 - z0 < 0.05) return;
      if (strips) area.ground({ x0, z0, x1, z1, lift: 0.004, color: STRIP, glow: GLOW.STRIP });
    };
    const line = (kind, x0, z0, x1, z1, toward) => area.glowLine({ kind, x0, z0, x1, z1, toward });
    const INTO = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };     // (a strip on a wall's north side shines north, and so on)
    // (the north wall's foot, broken at its doors)
    for (const r of roomsN) {
      let segs = [[r.x0, r.x1]];
      for (const o of doorsN) segs = segs.flatMap(([a, b]) => (o.b <= a || o.a >= b ? [[a, b]] : [[a, o.a], [o.b, b]].filter(([p, q]) => q - p > 0.1)));
      for (const [a, b] of segs) { put(a, plan.z0, b, plan.z0 + S); if (strips) line('strip', a, plan.z0 + S / 2, b, plan.z0 + S / 2, INTO.s); }
      if (battle) line('battle', r.x0, plan.z0, r.x1, plan.z0, INTO.s);
    }
    for (const w of runs.filter(w => w.side !== 'n')) {
      const q = wallRect(w);
      const sides = w.side === 's' ? ['n'] : w.side === 'w' ? ['e'] : w.side === 'e' ? ['w'] : w.axis === 'x' ? ['n', 's'] : ['w', 'e'];
      for (const s of sides) {
        const r = s === 'n' ? [q.x0, q.z0 - S, q.x1, q.z0] : s === 's' ? [q.x0, q.z1, q.x1, q.z1 + S] : s === 'w' ? [q.x0 - S, q.z0, q.x0, q.z1] : [q.x1, q.z0, q.x1 + S, q.z1];
        if (w.outer && w.axis === 'x') { r[0] = Math.max(r[0], plan.x0); r[2] = Math.min(r[2], plan.x1); }
        put(...r);
        if (strips) line('strip', ...(w.axis === 'x' ? [r[0], (r[1] + r[3]) / 2, r[2], (r[1] + r[3]) / 2] : [(r[0] + r[2]) / 2, r[1], (r[0] + r[2]) / 2, r[3]]), INTO[s]);
      }
      if (battle && w.axis === 'x' && !w.outer) line('battle', q.x0, q.z1, q.x1, q.z1, INTO.s);   // (the strip is on its south face)
    }
  }
  // Lamps: the ceiling's, and an emergency lamp under each housing on the north wall.
  for (const l of plan.lamps ?? []) area.lamp(l);
  for (const d of (plan.decor ?? []).filter(d => d.kind === 'emergency')) area.lamp({ x: d.x, z: plan.z0 + 0.7, y: EMERGENCY_Y_M, r: 1.3, core: 0.55, ring: 0.2, kind: 'emergency', color: EMERGENCY_AMBER });
  return { walls: runs };
}

/** The building's outside, under a cut south wall: weathered block (a base), dark plate (a deck). */
function outsideFace(F) {
  return (px, w, h, ppm) => {
    if (F.kind === 'bulkhead') { px(0, 0, w, h, F.outside); for (let i = 0; i < w; i += Math.max(8, Math.round(ppm))) plate(px, i, 0, Math.min(Math.round(ppm), w - i), h, F.outside); return; }
    // (unpainted block: its courses and joints, a weathered band along the foot)
    const bh = Math.max(2, Math.round(0.2 * ppm)), bw = Math.max(4, Math.round(0.4 * ppm));
    px(0, 0, w, h, F.outside);
    for (let y = 0, r = 0; y < h; y += bh, r++) { px(0, y + bh - 1, w, 1, tone(F.outside, -0.05)); for (let i = (r % 2) * Math.floor(bw / 2); i < w; i += bw) px(i, y, 1, bh - 1, tone(F.outside, -0.04)); }
    px(0, h - Math.max(2, Math.round(0.15 * ppm)), w, Math.max(2, Math.round(0.15 * ppm)), tone(F.outside, -0.06));
    px(0, 0, w, 1, tone(F.outside, 0.05));
  };
}

const hazards = new Map();
/** A threshold's danger stripes, a repeating tile half a metre square (its stripes a whole number of periods across). */
function hazardTile(ppm) {
  if (!hazards.has(ppm)) {
    const n = Math.round(0.5 * ppm), band = Math.max(2, Math.round(0.1 * ppm));
    hazards.set(ppm, paint(n, n, (px) => hazard(px, 0, 0, n, n, { band }), { repeat: true, key: `hazard:${ppm}` }));
  }
  return hazards.get(ppm);
}
