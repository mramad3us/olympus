// OLYMPUS art: Base Melas's ground a chunk at a time. The valley floor, the paving, the massing, the fence.
//
// The ground of a base (an area of kind 'ground': places' `melas.ground`, the build sheet's §2.1) is laid
// out once, as authored data (the first rule of 2026-11-05: handcrafted, the same in every career), and
// drawn in CHUNK_M (32 m) squares the stage streams round the camera (src/render/chunks.js, TECH §9.3).
// Each chunk is a collector of boxes and flat pieces (src/art/jobs.js 'chunk'), so it is one draw call:
//   - the valley floor: regolith (src/art/materials/surfaces.js), a world-anchored tile, so chunks meet
//     without a seam; outside the fence, the apron, a few boulders where a hash of the area's authored
//     look seed and the chunk puts them (cosmetic, no seed of the world);
//   - the surfaces clipped to the chunk: paving (cast slabs with their saw-cut joints: the roads, the
//     company streets, the aprons, the parade deck with its formation lines), paths (sintered regolith
//     slabs, PLACES §4.1), each lifted a few millimetres over what it lies on so none fights another;
//   - the massing (PLACES §4.2's buildings as footprints: the build sheet's "walls with roofs seen from
//     outside"): a box a rect, its front (south, what the camera sees) the façade (sintered block,
//     a window a 3 m bay a storey, glowing at night; the coping; grime at its foot), its top the roof
//     (a membrane, its seams, the HVAC plant on the barracks); every door a reveal DOOR_REVEAL_M deep cut
//     into it, dark behind its leaf (a prop the stage swings with the door it is twinned with); an open
//     structure (the cleaning canopy) its posts and its roof only. A building is one part on every
//     chunk it crosses (partOf: the outline never draws a seam where two chunks meet);
//   - the fence (3 m, chain link on posts every 3 m: its mesh holes alpha-tested, so it is seen through),
//     its gates closed (bars), and the ground's fixtures (lamp posts, bins, the guidon post) by the kit.
// What a chunk holds is chosen on the main thread (pieceOf: the records that reach into it), so the
// worker is sent a few kilobytes, not the whole ground.
// Pure.
import { paint } from '../paint.js';
import { tone, hash3, mixHex } from '../tone.js';
import { GLOW } from '../paint.js';
import { tile, sinteredBrick, concrete } from '../materials/index.js';
import { GROUND } from './ground.js';
import { boulder } from './rocks.js';
import { place } from '../kit/index.js';

/** A chunk's side, metres (CONTRACTS §6, PLACES §2.4). */
export const CHUNK_M = 32;
/** A door's reveal into its massing, its height, metres (the build sheet's §4: DOOR_REVEAL_M). */
export const DOOR_REVEAL_M = 0.8, DOOR_H_M = 2.2;
/** A storey (PLACES §1.1) and a window bay along a façade, metres. */
export const STOREY_M = 3.4, BAY_M = 3.0;
/** The surfaces' order and lift: what lies on what (metres off the regolith). */
export const SURFACE_LIFT_M = Object.freeze({ regolith: 0, path: 0.002, paving: 0.004, mark: 0.006 });
const FACADE = 0xa78c77, ROOF = 0x7c736b, REVEAL = 0x8f8a80, DOORWAY = 0x14151c, FENCE = 0x7c7f86, POST = 0x565b67;

// ---------- the index: which records reach into which chunk ----------

const keyOf = (cx, cz) => `${cx},${cz}`;
/** The chunk holding a point, as integers: [cx, cz]. */
export const chunkAt = (x, z) => [Math.floor(x / CHUNK_M), Math.floor(z / CHUNK_M)];
/** A chunk's rectangle in the area frame, metres. */
export const chunkRect = (cx, cz) => ({ x0: cx * CHUNK_M, z0: cz * CHUNK_M, x1: (cx + 1) * CHUNK_M, z1: (cz + 1) * CHUNK_M });

// (a polyline surface as rectangles: each axis-aligned segment widened by its width, a diagonal one by its bounding box)
function segRects(s) {
  if (s.rect) return [s.rect];
  const h = (s.widthM ?? 4) / 2, out = [];
  for (let k = 0; k + 1 < (s.pts?.length ?? 0); k++) {
    const [ax, az] = s.pts[k], [bx, bz] = s.pts[k + 1];
    out.push([Math.min(ax, bx) - h, Math.min(az, bz) - h, Math.max(ax, bx) + h, Math.max(az, bz) + h]);
  }
  return out;
}
const rectsMeet = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

/**
 * The ground's records by chunk: { chunks: Map key → { massing: [i], surfaces: [i], fixtures: [i], fence,
 * gates: [i] }, cx0, cz0, cx1, cz1 (the chunks the bounds cover) }. Built once per ground (the stage keeps it).
 */
export function indexGround(ground) {
  const b = ground.boundsM, [cx0, cz0] = chunkAt(b.x0, b.z0), [cx1, cz1] = chunkAt(b.x1 - 1e-6, b.z1 - 1e-6);
  const chunks = new Map();
  const at = (cx, cz) => { const k = keyOf(cx, cz); let c = chunks.get(k); if (!c) chunks.set(k, c = { massing: [], surfaces: [], fixtures: [], gates: [], fence: false }); return c; };
  const each = (r, fn) => {
    const [a0, b0] = chunkAt(r[0], r[1]), [a1, b1] = chunkAt(r[2] - 1e-6, r[3] - 1e-6);
    for (let cz = Math.max(cz0, b0); cz <= Math.min(cz1, b1); cz++) for (let cx = Math.max(cx0, a0); cx <= Math.min(cx1, a1); cx++) fn(at(cx, cz));
  };
  (ground.massing ?? []).forEach((m, i) => { for (const r of m.rects) each(r, c => { if (!c.massing.includes(i)) c.massing.push(i); }); });
  (ground.surfaces ?? []).forEach((s, i) => { for (const r of segRects(s)) each(r, c => { if (!c.surfaces.includes(i)) c.surfaces.push(i); }); });
  (ground.fixtures ?? []).forEach((f, i) => each([f.x - 0.5, f.z - 0.5, f.x + 0.5, f.z + 0.5], c => { if (!c.fixtures.includes(i)) c.fixtures.push(i); }));
  (ground.gates ?? []).forEach((g, i) => each([g.x - g.widthM / 2 - 1, g.z - g.widthM / 2 - 1, g.x + g.widthM / 2 + 1, g.z + g.widthM / 2 + 1], c => c.gates.push(i)));
  if (ground.fence) {
    const [x0, z0, x1, z1] = ground.fence.rect, t = 0.3;
    for (const r of [[x0 - t, z0 - t, x1 + t, z0 + t], [x0 - t, z1 - t, x1 + t, z1 + t], [x0 - t, z0 - t, x0 + t, z1 + t], [x1 - t, z0 - t, x1 + t, z1 + t]]) each(r, c => { c.fence = true; });
  }
  return { chunks, cx0, cz0, cx1, cz1 };
}

/** What a chunk's job is sent: the records that reach into it, plain (a few kilobytes). */
export function pieceOf(ground, index, cx, cz) {
  const c = index.chunks.get(keyOf(cx, cz)) ?? { massing: [], surfaces: [], fixtures: [], gates: [], fence: false };
  return {
    id: ground.id, cx, cz, walkM: ground.walkM ?? null, seed: ground.look?.seed ?? 1,
    massing: c.massing.map(i => ({ ...ground.massing[i], index: i })),
    surfaces: c.surfaces.map(i => ground.surfaces[i]),
    fixtures: c.fixtures.map(i => ground.fixtures[i]),
    gates: c.gates.map(i => ground.gates[i]),
    fence: c.fence ? ground.fence : null,
  };
}

// ---------- paintings ----------

const cache = new Map();
const keep = (key, fn) => { let t = cache.get(key); if (!t) cache.set(key, t = fn()); return t; };
/** The façade of a building of height H: a 3 m bay of sintered block with a window a storey, a coping, a plinth. World-anchored. */
function facadeTile(H, ppm, c = FACADE) {
  return keep(`facade:${H}:${ppm}:${c}`, () => {
    const w = Math.round(BAY_M * ppm), h = Math.max(4, Math.round(H * ppm));
    return paint(w, h, (px) => {
      sinteredBrick(px, 0, 0, w, h, { c, ppm, seed: 21 });
      const storeys = Math.max(1, Math.round(H / STOREY_M));
      for (let s = 0; s < storeys; s++) {
        const floorY = h - Math.round(s * STOREY_M * ppm), ww = Math.round(0.9 * ppm), wh = Math.round(1.0 * ppm), wx = Math.round((w - ww) / 2), wy = floorY - Math.round(2.1 * ppm);
        if (wy < 2) continue;
        px(wx - 1, wy - 1, ww + 2, wh + 2, tone(c, -0.25));                 // (the deep reveal)
        px(wx, wy, ww, wh, 0x2b3a44, GLOW.NIGHT);                            // (the glass, lit at night)
        px(wx, wy, ww, Math.max(1, Math.round(wh * 0.3)), 0x3c5d84, GLOW.NIGHT);
        px(wx + Math.floor(ww / 2), wy, 1, wh, tone(c, -0.12));             // (the mullion)
        px(wx - 1, wy + wh, ww + 2, Math.max(1, Math.round(0.06 * ppm)), tone(c, 0.12));   // (the sill)
        if (s > 0) px(0, floorY, w, 1, tone(c, -0.08));                       // (the storey's band)
      }
      px(0, 0, w, Math.max(2, Math.round(0.15 * ppm)), tone(c, 0.08)); px(0, Math.max(2, Math.round(0.15 * ppm)), w, 1, tone(c, -0.15));   // (the coping)
      const pl = Math.max(2, Math.round(0.3 * ppm)); px(0, h - pl, w, pl, tone(c, -0.1));   // (the plinth, the dust's line on it)
      for (let i = 0; i < w; i++) if (hash3(i, 3) % 3 === 0) px(i, h - pl - 1, 1, 1, mixHex(c, GROUND.dust, 0.5));
    }, { repeat: true, key: `facade:${H}:${ppm}:${c}` });
  });
}
/** The roof: a membrane in 4 m sheets, its seams, gravel ballast at random. World-anchored. */
const roofTile = (ppm) => keep(`roof:${ppm}`, () => { const n = Math.round(4 * ppm); return paint(n, n, (px) => {
  px(0, 0, n, n, ROOF);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const h = hash3(i, j, 31) % 61; if (h < 3) px(i, j, 1, 1, tone(ROOF, -0.06)); else if (h < 5) px(i, j, 1, 1, tone(ROOF, 0.05)); }
  px(0, 0, n, 1, tone(ROOF, -0.1)); px(0, 1, n, 1, tone(ROOF, 0.04)); px(0, 0, 1, n, tone(ROOF, -0.08));
}, { repeat: true, key: `roof:${ppm}` }); });
/** Chain link: a diamond mesh of wire 3 m tall, holes between (alpha-tested), a rail along its top. World-anchored along x. */
const fenceTile = (H, ppm) => keep(`fence:${H}:${ppm}`, () => { const w = Math.max(6, Math.round(0.5 * ppm)), h = Math.round(H * ppm), d = Math.max(3, Math.round(0.12 * ppm)); return paint(w, h, (px) => {
  px(0, 0, w, h, null);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + j) % d === 0 || (i - j + 1000 * d) % d === 0) px(i, j, 1, 1, FENCE);
  px(0, 0, w, Math.max(2, Math.round(0.06 * ppm)), POST); px(0, h - 2, w, 2, POST);
}, { repeat: true, key: `fence:${H}:${ppm}` }); });
/** A closed gate's bars, 2.4 m tall. */
const gateTile = (H, ppm) => keep(`gate:${H}:${ppm}`, () => { const w = Math.max(4, Math.round(0.25 * ppm)), h = Math.round(H * ppm); return paint(w, h, (px) => {
  px(0, 0, w, h, null); px(0, 0, 2, h, POST); px(0, 0, w, 2, POST); px(0, Math.round(h / 2), w, 1, POST); px(0, h - 2, w, 2, POST);
}, { repeat: true, key: `gate:${H}:${ppm}` }); });
const pavingTile = (ppm, c) => tile('concrete', { metres: 6, ppm, c, seed: 7, jointM: 3, stains: 0.2, cracks: 0.3 });
const pathTile = (ppm) => tile('concrete', { metres: 2.4, ppm, c: GROUND.slab, seed: 3, jointM: 0.6, stains: 0.3, cracks: 0.5 });
const groundTile = (ppm) => tile('regolith', { metres: 4, ppm, c: GROUND.regolith, seed: 7, dust: 0.45, ripples: 0.5 });
const revealFace = (ppm) => keep(`reveal:${ppm}`, () => paint(4, 4, (px) => concrete(px, 0, 0, 4, 4, { c: REVEAL, ppm, seed: 2 }), { repeat: true, key: `reveal:${ppm}` }));

// ---------- boxes cut by boxes ----------

/** a minus b, as at most six boxes ({ x0, x1, y0, y1, z0, z1 }); a box b doesn't meet comes back whole. */
export function subtractBox(a, b) {
  if (b.x0 >= a.x1 || b.x1 <= a.x0 || b.y0 >= a.y1 || b.y1 <= a.y0 || b.z0 >= a.z1 || b.z1 <= a.z0) return [a];
  const out = [], c = { ...a };
  if (b.x0 > c.x0) { out.push({ ...c, x1: b.x0 }); c.x0 = b.x0; }
  if (b.x1 < c.x1) { out.push({ ...c, x0: b.x1 }); c.x1 = b.x1; }
  if (b.z0 > c.z0) { out.push({ ...c, z1: b.z0 }); c.z0 = b.z0; }
  if (b.z1 < c.z1) { out.push({ ...c, z0: b.z1 }); c.z1 = b.z1; }
  if (b.y0 > c.y0) { out.push({ ...c, y1: b.y0 }); c.y0 = b.y0; }
  if (b.y1 < c.y1) { out.push({ ...c, y0: b.y1 }); c.y1 = b.y1; }
  return out;
}
/** A door's reveal as the box it cuts from its building's rect (on the rect's `side` edge). */
export function revealBox(door, rect, H = DOOR_H_M) {
  const w = (door.widthM ?? 1) / 2, R = DOOR_REVEAL_M, [x0, z0, x1, z1] = rect;
  switch (door.side) {
    case 's': return { x0: door.x - w, x1: door.x + w, z0: z1 - R, z1: z1 + 0.01, y0: -0.01, y1: H };
    case 'n': return { x0: door.x - w, x1: door.x + w, z0: z0 - 0.01, z1: z0 + R, y0: -0.01, y1: H };
    case 'e': return { x0: x1 - R, x1: x1 + 0.01, z0: door.z - w, z1: door.z + w, y0: -0.01, y1: H };
    default: return { x0: x0 - 0.01, x1: x0 + R, z0: door.z - w, z1: door.z + w, y0: -0.01, y1: H };
  }
}
const onEdge = (door, r) => (door.side === 's' ? Math.abs(door.z - r[3]) < 0.05 : door.side === 'n' ? Math.abs(door.z - r[1]) < 0.05 : door.side === 'e' ? Math.abs(door.x - r[2]) < 0.05 : Math.abs(door.x - r[0]) < 0.05)
  && (door.side === 's' || door.side === 'n' ? door.x > r[0] && door.x < r[2] : door.z > r[1] && door.z < r[3]);
const clip = (b, r) => ({ ...b, x0: Math.max(b.x0, r.x0), x1: Math.min(b.x1, r.x1), z0: Math.max(b.z0, r.z0), z1: Math.min(b.z1, r.z1) });
const solid = (b) => b.x1 - b.x0 > 0.02 && b.z1 - b.z0 > 0.02 && b.y1 - b.y0 > 0.02;

// ---------- a chunk ----------

/**
 * Lay a chunk (pieceOf's record) into a collector: { ppm, massPart(i) (a building's part, the same on every
 * chunk), fencePart }. Returns { boxes, surfaces, massing, fixtures, leaves: [{ id, opening, pivot, base,
 * swing, w, h }] } (the leaves already laid as props in the collector).
 */
export function layChunk(col, piece, { massPart, fencePart }) {
  const ppm = col.ppm, R = chunkRect(piece.cx, piece.cz), counts = { boxes: 0, surfaces: 0, massing: 0, fixtures: 0, leaves: 0 };
  // The valley floor, one quad, world-anchored.
  col.ground({ x0: R.x0, z0: R.z0, x1: R.x1, z1: R.z1, y: 0, top: groundTile(ppm) });
  // The surfaces, clipped to the chunk, in their order.
  const order = (s) => SURFACE_LIFT_M[s.kind] ?? 0;
  for (const s of [...piece.surfaces].sort((a, b) => order(a) - order(b))) {
    if (s.kind === 'regolith') continue;
    const top = s.kind === 'path' ? pathTile(ppm) : pavingTile(ppm, s.color ?? 0x9c917a);
    for (const r of segRects(s)) {
      const c = clip({ x0: r[0], z0: r[1], x1: r[2], z1: r[3] }, R);
      if (c.x1 - c.x0 < 0.05 || c.z1 - c.z0 < 0.05) continue;
      col.ground({ x0: c.x0, z0: c.z0, x1: c.x1, z1: c.z1, lift: order(s), top });
      counts.surfaces++;
    }
    // (the parade deck's formation lines: a white line every 2 m across it, a mark every 1 m along each)
    if (/parade/.test(`${s.id ?? ''} ${s.zone ?? ''} ${s.name ?? ''}`) && s.rect) {
      const [x0, z0, x1, z1] = s.rect;
      for (let z = z0 + 4; z < z1 - 2; z += 2) {
        if (z < R.z0 || z >= R.z1) continue;
        for (let x = Math.max(x0 + 4, Math.ceil(R.x0)); x < Math.min(x1 - 4, R.x1); x += 1) col.ground({ x0: x, z0: z, x1: x + 0.5, z1: z + 0.08, lift: SURFACE_LIFT_M.mark, color: 0xd9d1b7 });
      }
    }
  }
  // The massing.
  for (const m of piece.massing) {
    const part = massPart(m.index), H = m.heightM ?? STOREY_M;
    if (m.open) {
      // (an open structure: posts at its corners and every 4 m, a roof at its height)
      for (const r of m.rects) {
        const top = Math.min(H, 3.6), b = { x0: r[0], z0: r[1], x1: r[2], z1: r[3] };
        for (let x = r[0] + 0.1; x <= r[2] - 0.1 + 1e-6; x += Math.max(4, (r[2] - r[0] - 0.2) / Math.max(1, Math.round((r[2] - r[0]) / 4)))) for (const z of [r[1] + 0.1, r[3] - 0.1]) {
          if (x < R.x0 || x >= R.x1 || z < R.z0 || z >= R.z1) continue;
          col.box({ x0: x - 0.08, x1: x + 0.08, z0: z - 0.08, z1: z + 0.08, y0: 0, y1: top - 0.2, part, faces: { sides: POST } }); counts.boxes++;
        }
        const rb = clip({ ...b, y0: top - 0.2, y1: top }, R);
        if (solid(rb)) { col.box({ ...rb, part, faces: { top: roofTile(ppm), front: tone(ROOF, -0.1), sides: tone(ROOF, -0.15) } }); counts.boxes++; }
      }
      counts.massing++;
      continue;
    }
    for (const r of m.rects) {
      let boxes = [{ x0: r[0], x1: r[2], z0: r[1], z1: r[3], y0: 0, y1: H }];
      const reveals = (m.doors ?? []).filter(d => onEdge(d, r)).map(d => ({ d, b: revealBox(d, r) }));
      for (const { b } of reveals) boxes = boxes.flatMap(x => subtractBox(x, b));
      for (const b0 of boxes) {
        const b = clip(b0, R);
        if (!solid(b)) continue;
        col.box({ ...b, part, faces: { front: facadeTile(H, ppm), top: roofTile(ppm), sides: tone(FACADE, -0.12), back: tone(FACADE, -0.2) } });
        counts.boxes++;
      }
      // (each reveal: its sides and head in concrete, dark at its back where the leaf hangs)
      for (const { d, b } of reveals) {
        const back = d.side === 's' ? { x0: b.x0, x1: b.x1, z0: b.z0 - 0.02, z1: b.z0, y0: 0, y1: DOOR_H_M } : d.side === 'n' ? { x0: b.x0, x1: b.x1, z0: b.z1, z1: b.z1 + 0.02, y0: 0, y1: DOOR_H_M }
          : d.side === 'e' ? { x0: b.x0 - 0.02, x1: b.x0, z0: b.z0, z1: b.z1, y0: 0, y1: DOOR_H_M } : { x0: b.x1, x1: b.x1 + 0.02, z0: b.z0, z1: b.z1, y0: 0, y1: DOOR_H_M };
        const cb = clip(back, R);
        if (solid(cb)) { col.box({ ...cb, part, faces: { sides: DOORWAY, front: DOORWAY, top: revealFace(ppm) } }); counts.boxes++; }
        const inR = d.x >= R.x0 && d.x < R.x1 && d.z >= R.z0 && d.z < R.z1;
        if (!inR || !d.opening) continue;
        // (the leaf at the reveal's back, swinging in: the door it is twinned with on the floor inside)
        const w = d.widthM ?? 1;
        const leaf = d.side === 's' ? { pivot: [d.x - w / 2, b.z0 + 0.03], base: 0, swing: 1 } : d.side === 'n' ? { pivot: [d.x + w / 2, b.z1 - 0.03], base: Math.PI, swing: 1 }
          : d.side === 'e' ? { pivot: [b.x0 + 0.03, d.z + w / 2], base: Math.PI / 2, swing: 1 } : { pivot: [b.x1 - 0.03, d.z - w / 2], base: -Math.PI / 2, swing: 1 };
        col.prop({ id: d.id ?? d.opening, kind: 'leaf', opening: d.opening, ...leaf, w, h: DOOR_H_M - 0.05 });
        place(col, { kind: 'doorLeaf', make: 'ext', x: 0, z: 0, face: 'down', w, h: DOOR_H_M - 0.05, seed: 1 });
        col.endProp();
        counts.leaves++;
      }
    }
    // (the barracks' roof plant: a unit a 20 m of roof, by the building's index, not by any world's seed)
    if (H > STOREY_M + 1) {
      const r = m.rects[0];
      for (let x = r[0] + 8 + (m.index % 3) * 2; x < r[2] - 6; x += 20) {
        const z = r[1] + 3 + (hash3(m.index, Math.round(x), 5) % 4), b = { x0: x, x1: x + 2.4, z0: z, z1: z + 1.6, y0: H, y1: H + 1.1 };
        if (x < R.x0 || x >= R.x1 || z < R.z0 || z >= R.z1) continue;
        col.box({ ...b, faces: { front: tex2('hvac', ppm), top: tone(0x87959d, 0.04), sides: 0x87959d } }); counts.boxes++;
      }
    }
    counts.massing++;
  }
  // The fence and its gates.
  if (piece.fence) {
    const f = piece.fence, [x0, z0, x1, z1] = f.rect, H = f.heightM ?? 3, P = f.postM ?? 3, t = 0.04;
    const gaps = piece.gates.map(g => (g.axis === 'z' || Math.abs(g.x - x0) < 0.5 || Math.abs(g.x - x1) < 0.5 ? { axis: 'z', at: g.x, a: g.z - g.widthM / 2, b: g.z + g.widthM / 2 } : { axis: 'x', at: g.z, a: g.x - g.widthM / 2, b: g.x + g.widthM / 2 }));
    const runs = [{ axis: 'x', at: z0, a: x0, b: x1 }, { axis: 'x', at: z1, a: x0, b: x1 }, { axis: 'z', at: x0, a: z0, b: z1 }, { axis: 'z', at: x1, a: z0, b: z1 }];
    for (const run of runs) {
      let segs = [[run.a, run.b]];
      for (const g of gaps.filter(g => g.axis === run.axis && Math.abs(g.at - run.at) < 0.5)) segs = segs.flatMap(([a, b]) => (g.b <= a || g.a >= b ? [[a, b]] : [[a, g.a], [g.b, b]].filter(([p, q]) => q - p > 0.1)));
      for (const [a, b] of segs) {
        const lo = Math.max(a, run.axis === 'x' ? R.x0 : R.z0), hi = Math.min(b, run.axis === 'x' ? R.x1 : R.z1);
        const inOther = run.axis === 'x' ? run.at >= R.z0 && run.at < R.z1 : run.at >= R.x0 && run.at < R.x1;
        if (hi - lo < 0.02 || !inOther) continue;
        const panel = run.axis === 'x' ? { x0: lo, x1: hi, z0: run.at - t / 2, z1: run.at + t / 2 } : { x0: run.at - t / 2, x1: run.at + t / 2, z0: lo, z1: hi };
        col.box({ ...panel, y0: 0, y1: H, part: fencePart, faces: { front: fenceTile(H, ppm), back: fenceTile(H, ppm), sides: POST, top: POST } }); counts.boxes++;
        for (let p = Math.ceil(lo / P) * P; p < hi; p += P) {
          const post = run.axis === 'x' ? { x0: p - 0.04, x1: p + 0.04, z0: run.at - 0.04, z1: run.at + 0.04 } : { x0: run.at - 0.04, x1: run.at + 0.04, z0: p - 0.04, z1: p + 0.04 };
          col.box({ ...post, y0: 0, y1: H + 0.1, part: fencePart, faces: { sides: POST, top: tone(POST, 0.08) } }); counts.boxes++;
        }
      }
    }
    for (const g of gaps) {
      const inOther = g.axis === 'x' ? g.at >= R.z0 && g.at < R.z1 : g.at >= R.x0 && g.at < R.x1;
      const lo = Math.max(g.a, g.axis === 'x' ? R.x0 : R.z0), hi = Math.min(g.b, g.axis === 'x' ? R.x1 : R.z1);
      if (!inOther || hi - lo < 0.02) continue;
      const box = g.axis === 'x' ? { x0: lo, x1: hi, z0: g.at - 0.05, z1: g.at + 0.05 } : { x0: g.at - 0.05, x1: g.at + 0.05, z0: lo, z1: hi };
      col.box({ ...box, y0: 0.05, y1: 2.4, part: fencePart, faces: { front: gateTile(2.4, ppm), back: gateTile(2.4, ppm), sides: POST, top: POST } }); counts.boxes++;
    }
  }
  // The fixtures (the kit's), each in the chunk its centre is in.
  for (const f of piece.fixtures) {
    if (f.x < R.x0 || f.x >= R.x1 || f.z < R.z0 || f.z >= R.z1) continue;
    place(col, f); counts.fixtures++;
  }
  // The apron's boulders, outside the walked ground: by a hash of the authored look seed and the chunk.
  const W = piece.walkM;
  if (W) for (let k = 0; k < 3; k++) {
    const h = hash3(piece.seed, piece.cx * 131 + k, piece.cz * 71), x = R.x0 + (h % 1000) / 1000 * CHUNK_M, z = R.z0 + ((h >>> 10) % 1000) / 1000 * CHUNK_M;
    const inside = x > W.x0 - 6 && x < W.x1 + 6 && z > W.z0 - 6 && z < W.z1 + 6;
    if (inside || (h >>> 20) % 3) continue;
    boulder(col, { x, z, sizeM: 0.4 + ((h >>> 22) % 5) * 0.15, kind: (h >>> 25) % 2 ? 'basalt' : 'rust', seed: h % 97 }); counts.boxes++;
  }
  return counts;
}

const tex2 = (key, ppm) => keep(`${key}:${ppm}`, () => paint(Math.round(2.4 * ppm), Math.round(1.1 * ppm), (px, w, h) => {
  px(0, 0, w, h, 0x87959d); px(0, 0, w, 1, tone(0x87959d, 0.08));
  for (let i = 2; i < w - 2; i += Math.max(2, Math.round(0.1 * ppm))) px(i, 2, 1, h - 4, tone(0x87959d, -0.15));
}, { key: `${key}:${ppm}` }));
