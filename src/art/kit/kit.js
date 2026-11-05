// OLYMPUS art: the kit builder. A piece of furniture or a fixture as a few boxes, in metres, turned to a facing.
//
// tradecraft's furniture (src/art/furniture.js kit()) built a piece from boxes measured in pixels at
// 16 px/m, each box its own mesh and material. Here a piece is described in metres, in its own frame,
// and goes into an area (src/render/batch.js createArea) whose boxes all share one material and one
// draw call; the same piece paints itself at 16 and at 24 px/m because every size is metres and every
// painter measures from the face it is given (pxOf, wear.js P).
//
// The piece's frame: x across, z toward its front, y up, the origin on the floor at the middle of its
// footprint (tradecraft's: W, D, BK = −D/2 its back, FR = D/2 its front). The camera looks north and
// 45° down, so what reads is the top and the south (+z) face of each box: that is where the detail goes,
// painted rather than modelled; sides are plain (seen edge-on, they still cast shadows); a back is
// painted where a piece may stand facing away (a locker against the south wall shows its back).
//
// Facing turns a piece in quarter turns about its middle (down: its front to +z, the camera; right:
// to +x; up: away, to −z; left: to −x). Boxes are axis-aligned, so a turn moves each box, swaps its
// width and depth, hands each face's painting to the face it becomes (a vertical face keeps its
// painting as seen from outside), and turns a top's painting with it (rotPainter). The piece's origin
// snaps to the pixel grid first, then every box edge (rounded from metres, edge by edge, so boxes that
// meet in metres meet in pixels), so a face painted to its size puts one texel on one screen pixel.
//
// Parts (outlines are inked where parts meet): comp() starts one; boxes take the current part, or
// `part`. A maker groups the boxes that read as one thing (a rack's frame, each mattress, each pillow).
//
// Painters are remembered by key (tex): the same key gives the same function, so the batch paints it
// once per size and every piece of a make shares the painting in the atlas (tradecraft's keep()).
// The key must name everything the painting depends on (make, colour, state).
// Pure (no three.js: the area it builds into is any object with box(), lamp(), glowLine(), part()).
import { paint, unword } from '../paint.js';
import { hash3, hashStr, rng } from '../tone.js';

/** Quarter turns for a facing: its front toward +z (the camera), +x, −z, −x. */
export const FACINGS = Object.freeze({ down: 0, right: 1, up: 2, left: 3 });
// Where each local face goes, by quarter turn (derived from the rotation (x, z) → (x cos + z sin, −x sin + z cos)).
const FACE_TO = [
  { front: 'front', back: 'back', left: 'left', right: 'right', top: 'top', bottom: 'bottom' },
  { front: 'right', right: 'back', back: 'left', left: 'front', top: 'top', bottom: 'bottom' },
  { front: 'back', back: 'front', left: 'right', right: 'left', top: 'top', bottom: 'bottom' },
  { front: 'left', left: 'back', back: 'right', right: 'front', top: 'top', bottom: 'bottom' },
];
const FACE_NAMES = ['front', 'back', 'left', 'right', 'top', 'bottom'];

/** A point in the piece's frame turned q quarter turns: [x, z] in the world's axes (before the origin is added). */
export function turn(x, z, q) {
  switch (q & 3) {
    case 1: return [z, -x];
    case 2: return [-x, -z];
    case 3: return [-z, x];
    default: return [x, z];
  }
}

/** A top's texel (i, j) in the world's painting, turned q: the texel [li, lj] of the piece's own painting (lw × lh). */
export function rotTexel(i, j, q, lw, lh) {
  switch (q & 3) {
    case 1: return [lw - 1 - j, i];
    case 2: return [lw - 1 - i, lh - 1 - j];
    case 3: return [j, lh - 1 - i];
    default: return [i, j];
  }
}

const memo = new Map();
/** A painter remembered by key: (px, w, h, ppm) => draw(px, w, h, ppm). The key names the look. */
export function tex(key, draw) {
  let f = memo.get(key);
  if (!f) { f = (px, w, h, ppm) => draw(px, w, h, ppm); f.key = key; memo.set(key, f); }
  return f;
}
/** How many painters are remembered (for the tests and the leak check). */
export const texCount = () => memo.size;
/** Forget the remembered painters. */
export function clearTex() { memo.clear(); rotated = new WeakMap(); rotatedPm = new WeakMap(); }

let rotated = new WeakMap(), rotatedPm = new WeakMap();
/** A top's painter turned q quarter turns: it paints the piece's own painting and copies it turned (remembered per painter and turn). */
export function rotPainter(fn, q) {
  q &= 3;
  if (!q || typeof fn !== 'function') return fn;
  let m = rotated.get(fn);
  if (!m) rotated.set(fn, m = new Map());
  let r = m.get(q);
  if (!r) {
    r = (px, w, h, ppm) => {
      const lw = q % 2 ? h : w, lh = q % 2 ? w : h, pm = paint(lw, lh, (p2, ww, hh) => fn(p2, ww, hh, ppm));
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const [li, lj] = rotTexel(i, j, q, lw, lh), v = unword(pm.data[lj * lw + li]);
        px(i, j, 1, 1, v.hole ? null : v.hex, v.glow);
      }
    };
    m.set(q, r);
  }
  return r;
}
/** A Pixmap turned q quarter turns (a top given as a painting rather than a painter), remembered. */
export function rotPixmap(pm, q) {
  q &= 3;
  if (!q || pm.repeat) return pm;
  let m = rotatedPm.get(pm);
  if (!m) rotatedPm.set(pm, m = new Map());
  let r = m.get(q);
  if (!r) {
    const w = q % 2 ? pm.h : pm.w, h = q % 2 ? pm.w : pm.h, data = new Uint32Array(w * h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const [li, lj] = rotTexel(i, j, q, pm.w, pm.h); data[j * w + i] = pm.data[lj * pm.w + li]; }
    r = { ...pm, w, h, data };
    m.set(q, r);
  }
  return r;
}
const isPixmap = (v) => v && typeof v === 'object' && v.data instanceof Uint32Array;
/** A face spec turned q (only tops and bottoms change: their paintings turn with the piece). */
function turnFace(spec, q) {
  if (!q || spec === undefined || typeof spec === 'number') return spec;
  if (typeof spec === 'function') return rotPainter(spec, q);
  if (isPixmap(spec)) return rotPixmap(spec, q);
  if (spec.anchor === 'world') return spec;
  if (spec.paint) return { ...spec, paint: rotPainter(spec.paint, q) };
  if (spec.pixmap) return { ...spec, pixmap: rotPixmap(spec.pixmap, q) };
  return spec;
}

/**
 * A builder for one piece at (x, z) on the floor (metres; y: the floor's height), turned to `face`,
 * into `area`. Returns { box, comp, part, lamp, glowLine, q, ppm, boxes, lamps } (see the header).
 */
export function builder(area, { x = 0, z = 0, y = 0, face = 'down' } = {}) {
  const ppm = area.ppm, q = typeof face === 'number' ? face & 3 : FACINGS[face] ?? 0;
  const ox = Math.round(x * ppm) / ppm, oz = Math.round(z * ppm) / ppm, oy = Math.round(y * ppm) / ppm;
  const boxes = [], lamps = [];
  let current = area.part();
  const snap = (m) => Math.round(m * ppm) / ppm;
  const k = {
    ppm, q, boxes, lamps, x: ox, z: oz, y: oy,
    /** Start a new part (an outline round it); returns its number. */
    comp() { current = area.part(); return current; },
    /** A new part number without making it current. */
    part: () => area.part(),
    get current() { return current; },
    /**
     * A box in the piece's frame: { x, z, y, w, d, h } (centre of its footprint, bottom, sizes) or
     * { x0, x1, y0, y1, z0, z1 }; faces as the batch takes them, in the piece's own names; part, glow,
     * omit, only. Returns the world box the area snapped.
     */
    box(s) {
      const lx0 = s.x0 ?? (s.x ?? 0) - s.w / 2, lx1 = s.x1 ?? (s.x ?? 0) + s.w / 2;
      const lz0 = s.z0 ?? (s.z ?? 0) - s.d / 2, lz1 = s.z1 ?? (s.z ?? 0) + s.d / 2;
      const ly0 = s.y0 ?? s.y ?? 0, ly1 = s.y1 ?? ly0 + s.h;
      const [ax, az] = turn(lx0, lz0, q), [bx, bz] = turn(lx1, lz1, q);
      const faces = {};
      const src = s.faces ?? {};
      const sides = src.sides ?? s.color;
      for (const f of FACE_NAMES) {
        const v = src[f] ?? (f === 'bottom' ? src.top ?? sides : f === 'top' ? sides : sides);
        if (v !== undefined) faces[FACE_TO[q][f]] = f === 'top' || f === 'bottom' ? turnFace(v, q) : v;
      }
      const spec = {
        x0: snap(ox + Math.min(ax, bx)), x1: snap(ox + Math.max(ax, bx)),
        z0: snap(oz + Math.min(az, bz)), z1: snap(oz + Math.max(az, bz)),
        y0: snap(oy + ly0), y1: snap(oy + ly1),
        faces, part: s.part ?? current, glow: s.glow ?? 0,
      };
      if (s.omit) spec.omit = s.omit.map(f => FACE_TO[q][f]);
      if (s.only) spec.only = s.only.map(f => FACE_TO[q][f]);
      const b = area.box(spec);
      boxes.push(b);
      return b;
    },
    /** A lamp in the piece's frame (src/render/lights.js: { x, z, y, r, kind, color, core, ring }). */
    lamp(l) { const [wx, wz] = turn(l.x ?? 0, l.z ?? 0, q); const o = area.lamp({ ...l, x: ox + wx, z: oz + wz, y: (l.y ?? 2.7) + oy }); lamps.push(o); return o; },
    /** A glow line (floor strip, battle strip) in the piece's frame. */
    glowLine(g) {
      const [ax, az] = turn(g.x0, g.z0, q), [bx, bz] = turn(g.x1, g.z1, q), t = g.toward ? turn(g.toward[0], g.toward[1], q) : null;
      area.glowLine({ ...g, x0: ox + ax, z0: oz + az, x1: ox + bx, z1: oz + bz, toward: t });
    },
    /** A flat piece on the floor in the piece's frame (a mat, a drain, a stencil), lifted off the floor. */
    ground({ x0, z0, x1, z1, y = 0, lift = 0.003, top, color, glow = 0, part = 0 }) {
      const [ax, az] = turn(x0, z0, q), [bx, bz] = turn(x1, z1, q);
      return area.ground({ x0: snap(ox + Math.min(ax, bx)), z0: snap(oz + Math.min(az, bz)), x1: snap(ox + Math.max(ax, bx)), z1: snap(oz + Math.max(az, bz)), y: oy + y, lift, top: turnFace(top, q), color, glow, part });
    },
  };
  return k;
}

/** A piece's seeded random (cosmetic: which books, which dents), from its kind and seed. */
export const pieceRng = (kind, seed) => rng(hashStr(kind) ^ Math.imul(seed | 0, 2654435761));
/** A variant index 0..n−1 for a seed (which of a make's looks). */
export const variant = (seed, n) => hash3(seed | 0, 977) % n;
