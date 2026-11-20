// OLYMPUS render: the kit's devices on the stage, the shoot house's grenades, charges, breach holes and the instructor's read drawn by code (VIEWS §7.3; WEAPONS §12; COMBAT §25.20; the build sheet 0.0.18 §2.3, §11; 0.0.19 §1 K-face, kit2 §2.10).
//
// Two parts. bangListOf(rl) is v0.0.18's: the bangs layer (bangs.js) draws the pairs' and the stress course's training bangs
// and the house's G-11s from the look (look.js: burst.js devicesLook) as before, null where none. A practice grenade (the
// G-9P, the G-13P: the house look's kit.practice) is left out of it from v0.0.19, since it is no flash grenade: this module
// draws it whole. createDevices(stage) is v0.0.19's layer, which draws the house look's `kit` (sim/arms/devlook.js
// devicesView: the sim's records at the moment drawn, every quantity the sim's own helper's) on buffers allocated once at the
// layer's making (DEVICES_MAX 4 bodies and levers, CHARGES_MAX 2 strips, TUBE_PX 512 pixels of shock tube a charge, HOLES_MAX
// 24 holes, READ_PIXELS for the read's READ_TICKS_MAX 16 ticks, their counts and its ring), so no buffer is made or grown
// mid-play:
//   the practice body   blue with a brown band (the training colour), BODY_PX 3 × 2 as the bang's (the kit's rule for small
//                       things), upright in flight and flat where it lies; after the burst it lies where it went, blue still (a
//                       practice body is used again), for the look's BURST_LOOK_MS;
//   the lever           a LEVER_PX 2 × 1 sliver thrown off the hand at its release (the look's lever: a cook's, else the
//                       throw's), its arc a cosmetic closed form from the item's hash (LEVER_M out, LEVER_UP_M up, LEVER_MS),
//                       then lying where it fell; the layer keeps it (by id, for the session) till its grenade's burst has
//                       left the look, so it never pops out at the burst;
//   the pop and puff    a spotting charge's small flash (POP_R_M, BANG_FLASH_MS, light; its first frame forced once, as the
//                       bang's) and bangs.js's smoke recipe scaled by PUFF_K about its middle and thinned to PUFF_KEEP of its
//                       pixels: "a pop and a puff" (the sheet's §10, honest);
//   the charges         a charge on its door as a strip up the edge it is on, the leaf's height (LEAF_H_M), and its shock
//                       tube to the firing point, a 1 px orange line on the floor, bright from Fire to the burst, spent after;
//   the holes           a ballistic breach's holes in the closed leaf, two dark pixels each, and the frangible's grey dust for
//                       DUST_MS from its round;
//   the read            a thin red tick from the burst to each body the read counted, its fragments beside it in a 3 × 5
//                       figure, and a faint ring at λ 0.71 clipped to the floor (the read's: its building's rooms) and the views; it comes in
//                       and goes out as the look's fade says (in over 200 ms, held 2 s, out over 400 ms), by an ordered dither
//                       of its pixels (the smoke's way): nothing pops.
// update(kit, { ms, tintOf, views, wind }) writes the pixels only when the picture changes (a body in flight, a lever, a fade's
// step, a lit tube, the dust, a new record): with the clock held nothing is written. It returns { bodies, levers, charges,
// tube, holes, reads, readPx, puff, pop, pixels, lamps, writes, allocBytes, max }. Pure but the layer.
import { PX_PER_M } from './scale.js';
import { createPixels } from './decals.js';
import { bangSmokePixels, BANG_FLASH_MS, SMOKE_PX_MAX } from './range-items.js';
import { hash01 } from '../core/hash.js';

/** The bangs the view draws from a range look: a list, or null where there is none. The house look's practice grenades are this layer's (see the header). */
export function bangListOf(rl) {
  const before = rl?.stress?.bangs?.length ? [...(rl?.pairs?.bangs ?? []), ...rl.stress.bangs] : rl?.pairs?.bangs ?? null;
  const practice = new Set(rl?.house?.kit?.practice ?? []);
  const kit = (rl?.house?.bangs ?? []).filter(b => !practice.has(b?.id));
  return kit.length ? [...(before ?? []), ...kit] : before;
}

// ---- the numbers (my calls but where a source is named) ----
/** The buffers, allocated once (kit2 §2.10; the look gives at most as many). */
export const DEVICES_MAX = 4, CHARGES_MAX = 2, TUBE_PX = 512, READ_TICKS_MAX = 16, HOLES_MAX = 24;
/** A practice body and a lever (px), and the colours: the training blue with a brown band, the lever's steel, the strip's olive, the tube's orange, the read's red. */
export const BODY_PX = Object.freeze([3, 2]), LEVER_PX = Object.freeze([2, 1]);
export const DEVICE_C = Object.freeze({ body: 0x2f5d9e, band: 0x7a5232, ink: 0x1d2433, lever: 0x9aa0a6, strip: 0x56603e, stripInk: 0x2a2e22, tube: 0xe0782c, tubeLit: 0xffd27a, tubeSpent: 0x6a4a34, hole: 0x141210, dust: 0xbdb5a6, pop: 0xfff4d6, read: 0xc8322a, ring: 0xd96a5e });
/** The lever's flight: out LEVER_M (a range by its hash), up LEVER_UP_M, over LEVER_MS, from the hand's HAND_Y_M. */
export const LEVER_M = Object.freeze([0.6, 1.3]), LEVER_UP_M = 0.35, LEVER_MS = 380, HAND_Y_M = 1.2;
/** The spotting charge's pop (its flash's radius, m) and its puff: bangs.js's smoke scaled by PUFF_K, PUFF_KEEP of its pixels. */
export const POP_R_M = 0.3, PUFF_K = 0.45, PUFF_KEEP = 0.4;
/** A charge's strip up its door's edge (m) and its width (px); the dust's time (ms). */
export const LEAF_H_M = 2.0, STRIP_PX = 2, DUST_MS = 900;
/** The read's pixels a burst at most (its ticks, their counts and its ring). */
export const READ_PIXELS = 6144;
/** A pop first drawn later than this after its moment is not drawn at all (game ms: a load, a skip; the bang's FLASH_LATE_MS). */
export const POP_LATE_MS = 500;
const PUFF_PIXELS = DEVICES_MAX * Math.ceil(SMOKE_PX_MAX * PUFF_KEEP), POP_PIXELS = DEVICES_MAX * 48;
const BODY_PIXELS = DEVICES_MAX * (BODY_PX[0] * BODY_PX[1] + LEVER_PX[0] * LEVER_PX[1]) + CHARGES_MAX * (STRIP_PX * Math.ceil(LEAF_H_M * 32) + TUBE_PX) + HOLES_MAX * 14;

const snap = (v, ppm) => Math.round(v * ppm) / ppm;
// (an ordered dither's threshold for pixel i: a 4 × 4 Bayer matrix, so a fade thins evenly)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Whether pixel i is kept at a share k (0 to 1) by the ordered dither. */
export const ditherKeep = (i, k) => k >= 1 || (k > 0 && (BAYER[i % 16] + 0.5) / 16 < k);

// ---- the pixels (metres; upright unless flat) ----
/** A practice body's pixels where the look puts it ({ at: { x, y, z, flying } }): [{ x, y, z, c, flat }]. */
export function bodyPixels(g, ppm = PX_PER_M) {
  const at = g?.at;
  if (!at) return [];
  const P = 1 / ppm, [w, h] = BODY_PX, out = [], x0 = snap(at.x, ppm) - Math.floor(w / 2) * P;
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const c = i === 1 ? DEVICE_C.band : DEVICE_C.body;
    if (at.flying) out.push({ x: x0 + (i + 0.5) * P, y: snap(at.y, ppm) + (h - j - 0.5) * P, z: snap(at.z, ppm) + 0.05, c, flat: false });
    else out.push({ x: x0 + (i + 0.5) * P, y: 0.018, z: snap(at.z, ppm) + (j - Math.floor(h / 2) + 0.5) * P, c: j === 0 && i !== 1 ? DEVICE_C.ink : c, flat: true });
  }
  return out;
}
/** The lever at ms from its release ({ id, from: [x, z], atMs }): its arc, then where it lies; null before. */
export function leverAt(L, ms) {
  if (!L || !Number.isFinite(L.atMs) || ms < L.atMs) return null;
  const ang = hash01('lever', String(L.id)) * 2 * Math.PI, d = LEVER_M[0] + (LEVER_M[1] - LEVER_M[0]) * hash01('lever-m', String(L.id));
  const u = Math.min(1, (ms - L.atMs) / LEVER_MS);
  return { x: L.from[0] + Math.cos(ang) * d * u, y: Math.max(0.02, HAND_Y_M * (1 - u) + 4 * LEVER_UP_M * u * (1 - u)), z: L.from[1] + Math.sin(ang) * d * u, flying: u < 1 };
}
/** The lever's pixels at ms (a sliver, steel). */
export function leverPixels(L, ms, ppm = PX_PER_M) {
  const at = leverAt(L, ms);
  if (!at) return [];
  const P = 1 / ppm, out = [];
  for (let i = 0; i < LEVER_PX[0]; i++) out.push({ x: snap(at.x, ppm) + (i + 0.5) * P, y: at.flying ? snap(at.y, ppm) : 0.016, z: snap(at.z, ppm) + (at.flying ? 0.05 : 0), c: DEVICE_C.lever, flat: !at.flying });
  return out;
}
/** The spotting charge's pop at ms: a small flash, light, for BANG_FLASH_MS of game time (force: the first frame after, once). */
export function popPixels(g, ms, ppm = PX_PER_M, { force = false } = {}) {
  if (!(ms >= g.burstAtMs) || (ms - g.burstAtMs >= BANG_FLASH_MS && !force)) return [];
  const P = 1 / ppm, R = Math.max(1, Math.round(POP_R_M * ppm)), cx = snap(g.at.x, ppm), cz = snap(g.at.z, ppm), out = [];
  for (let i = -R; i < R; i++) for (let j = 0; j < R; j++) if (Math.hypot(i + 0.5, j + 0.5) <= R) out.push({ x: cx + (i + 0.5) * P, y: (j + 0.5) * P, z: cz + 0.2, c: DEVICE_C.pop, flat: false });
  return out;
}
/** The puff at ms: bangs.js's smoke for the burst, scaled by PUFF_K about its middle, PUFF_KEEP of its pixels kept by the dither. */
export function puffPixels(g, ms, ppm = PX_PER_M, wind = null) {
  if (!(ms >= g.burstAtMs)) return [];
  const all = bangSmokePixels({ id: g.id, x: g.at.x, z: g.at.z, atMs: g.burstAtMs }, ms, ppm, wind), out = [];
  for (let i = 0; i < all.length; i++) {
    if (!ditherKeep(i, PUFF_KEEP)) continue;
    const q = all[i];
    out.push({ x: snap(g.at.x + (q.x - g.at.x) * PUFF_K, ppm), y: snap(q.y * PUFF_K, ppm), z: q.z, c: q.c, flat: false });
  }
  return out;
}
/** A charge's strip up its door's edge (upright, the leaf's height), on the edge the look gives (the BC-1's hinge, the SC-1's latch). */
export function stripPixels(c, ppm = PX_PER_M) {
  if (!c?.from || c.st === 'gone') return [];
  const P = 1 / ppm, n = Math.round(LEAF_H_M * ppm), out = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < STRIP_PX; i++) out.push({ x: snap(c.from[0], ppm) + (i - STRIP_PX / 2 + 0.5) * P, y: (j + 0.5) * P, z: snap(c.from[1], ppm) + 0.03, c: i === 0 ? DEVICE_C.stripInk : DEVICE_C.strip, flat: false });
  return out;
}
/** Whether a charge's tube is lit at ms: from its Fire to its burst. */
export const tubeLit = (c, ms) => Number.isFinite(c?.firedAtMs) && c.burstAtMs === null && ms <= c.firedAtMs + 2000;
/** The shock tube on the floor from the charge to its firing point (1 px, at most TUBE_PX): lit from Fire to the burst, spent after. */
export function tubePixels(c, ms, ppm = PX_PER_M) {
  if (!c?.from || !c.to) return [];
  const lit = tubeLit(c, ms), spent = c.st === 'gone';
  const L = Math.hypot(c.to[0] - c.from[0], c.to[1] - c.from[1]), n = Math.min(TUBE_PX, Math.max(1, Math.round(L * ppm))), out = [];
  const sagK = 0.15 * (hash01('tube', String(c.id)) - 0.5);
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) / n, sag = Math.sin(u * Math.PI) * sagK;
    out.push({ x: snap(c.from[0] + (c.to[0] - c.from[0]) * u + sag, ppm), y: 0.012, z: snap(c.from[1] + (c.to[1] - c.from[1]) * u - sag, ppm), c: lit ? DEVICE_C.tubeLit : spent ? DEVICE_C.tubeSpent : DEVICE_C.tube, flat: true });
  }
  return out;
}
/** A breach hole in the closed leaf (two dark pixels), and its round's dust for DUST_MS. */
export function holePixels(h, ms, ppm = PX_PER_M) {
  const P = 1 / ppm, out = [];
  if (h.closed) for (let i = 0; i < 2; i++) out.push({ x: snap(h.x, ppm) + (i - 0.5) * P, y: snap(h.y, ppm), z: snap(h.z, ppm) + 0.04, c: DEVICE_C.hole, flat: false });
  const t = Number.isFinite(h.atMs) ? ms - h.atMs : -1;
  if (t >= 0 && t < DUST_MS) {
    const k = 1 - t / DUST_MS, r = 0.08 + 0.25 * (t / DUST_MS);
    for (let q = 0; q < 12; q++) {
      if (!ditherKeep(q, k)) continue;
      const a = hash01('dust', h.door, h.point, q) * 2 * Math.PI, d = r * hash01('dust-r', h.door, h.point, q);
      out.push({ x: snap(h.x + Math.cos(a) * d, ppm), y: snap(h.y + Math.sin(a) * d * 0.6 + 0.1 * (t / DUST_MS), ppm), z: snap(h.z, ppm) + 0.06, c: DEVICE_C.dust, flat: false });
    }
  }
  return out;
}
// (a figure of the count beside a tick: 3 × 5 pixels a digit)
const GLYPHS = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111' };
function figurePixels(n, x, z, ppm, c) {
  const P = 1 / ppm, out = [], s = String(Math.max(0, Math.min(99, Math.round(n))));
  [...s].forEach((d, k) => { const g = GLYPHS[d]; for (let r = 0; r < 5; r++) for (let q = 0; q < 3; q++) if (g[r * 3 + q] === '1') out.push({ x: snap(x, ppm) + (k * 4 + q + 0.5) * P, y: 0.02, z: snap(z, ppm) + (r + 0.5) * P, c, flat: true }); });
  return out;
}
/** Whether a point is on the floor (one of the look's rects [x0, z0, x1, z1]) and inside one of the views ({ x0, x1, z0, z1 }), for the ring. */
export function floorClip(floor = [], views = null) {
  return (x, z) => (floor ?? []).some(q => x >= q[0] && x <= q[2] && z >= q[1] && z <= q[3]) && (!views?.length || views.some(v => x >= v.x0 && x <= v.x1 && z >= v.z0 && z <= v.z1));
}
/**
 * The read's overlay at its fade (the look's k): its ticks, counts and ring, the dither keeping k of them, at most READ_PIXELS;
 * clip(x, z) says whether a point of the ring is on the floor shown.
 */
export function overlayPixels(r, ppm = PX_PER_M, { clip = null } = {}) {
  if (!r || !(r.k > 0)) return [];
  const all = [];
  for (const t of (r.ticks ?? []).slice(0, READ_TICKS_MAX)) {
    const L = Math.hypot(t.x - r.x, t.z - r.z), n = Math.max(1, Math.round(L * ppm));
    for (let k = 1; k < n; k++) { const u = k / n; all.push({ x: snap(r.x + (t.x - r.x) * u, ppm), y: 0.022, z: snap(r.z + (t.z - r.z) * u, ppm), c: DEVICE_C.read, flat: true }); }
    if (t.n >= 1) all.push(...figurePixels(t.n, t.x + 0.25, t.z - 0.45, ppm, DEVICE_C.read));
  }
  if (r.ringM > 0) {
    const n = Math.round(2 * Math.PI * r.ringM * ppm);
    for (let k = 0; k < n; k += 2) {
      const a = (k / n) * 2 * Math.PI, x = r.x + Math.cos(a) * r.ringM, z = r.z + Math.sin(a) * r.ringM;
      if (!clip || clip(x, z)) all.push({ x: snap(x, ppm), y: 0.02, z: snap(z, ppm), c: DEVICE_C.ring, flat: true });
    }
  }
  const out = [];
  for (let i = 0; i < all.length && out.length < READ_PIXELS; i++) if (ditherKeep(i, r.k)) out.push(all[i]);
  return out;
}

// ---- the layer ----
/** The devices on a stage (see the header): { group, update, stats, pixels, dispose }. */
export function createDevices(stage, { ppm = stage.ppm ?? PX_PER_M } = {}) {
  const THREE = stage.THREE;
  const body = createPixels(THREE, BODY_PIXELS, { ppm, order: 1, name: 'device' }), puff = createPixels(THREE, PUFF_PIXELS, { ppm, order: 1, name: 'puff' });
  const read = createPixels(THREE, READ_PIXELS, { ppm, order: 2, name: 'read' }), pop = createPixels(THREE, POP_PIXELS, { ppm, order: 3, name: 'pop' });
  pop.mesh.material.transparent = true; pop.mesh.material.depthWrite = false;
  // (a pixel's bytes: its matrix, colour, tint and part, float32)
  const bytes = (p) => p.max * (16 + 3 + 3 + 1) * 4;
  const group = new THREE.Group();
  group.name = 'devices';
  group.add(body.mesh, puff.mesh, read.mesh, pop.mesh);
  const levers = new Map(), popped = new Map();             // (a grenade's lever as it flew, kept till its grenade leaves the look; a pop's first frame)
  const stats = { bodies: 0, levers: 0, charges: 0, tube: 0, holes: 0, reads: 0, readPx: 0, puff: 0, pop: 0, pixels: 0, lamps: [], writes: 0, allocBytes: bytes(body) + bytes(puff) + bytes(read) + bytes(pop), max: { body: body.max, puff: puff.max, read: read.max, pop: pop.max } };
  let lastKey = '', session = null;
  function update(kit, { ms = 0, tintOf = null, views = null, wind = null, sessionKey = null } = {}) {
    if (sessionKey !== session) { session = sessionKey; levers.clear(); popped.clear(); }
    const V = kit ?? { grenades: [], charges: [], holes: [], reads: [] };
    for (const g of V.grenades) if (g.lever && !levers.has(g.id)) levers.set(g.id, g.lever);
    const inLook = new Set(V.grenades.map(g => g.id));
    for (const id of [...levers.keys()]) if (!inLook.has(id)) levers.delete(id);
    const pr = V.grenades.filter(g => g.practice).slice(-DEVICES_MAX);
    // (what moves the picture: a body in flight or rolling, a lever flying, a fade between its ends, a lit tube, the dust, the puff)
    const moving = V.grenades.some(g => g.at?.flying || (!g.done && !g.at)) || [...levers.values()].some(L => ms >= L.atMs && ms < L.atMs + LEVER_MS) || (V.reads ?? []).some(r => r.k > 0 && r.k < 1) || (V.charges ?? []).some(c => tubeLit(c, ms)) || (V.holes ?? []).some(h => Number.isFinite(h.atMs) && ms >= h.atMs && ms - h.atMs < DUST_MS) || pr.some(g => ms >= g.burstAtMs && ms - g.burstAtMs < 8000);
    const key = JSON.stringify([V.grenades.map(g => [g.id, g.done, g.at?.x, g.at?.z]), (V.charges ?? []).map(c => [c.id, c.st, c.firedAtMs, c.to]), (V.holes ?? []).map(h => [h.door, h.point, h.closed]), (V.reads ?? []).map(r => [r.id, r.k]), [...levers.keys()], moving ? Math.floor(ms / 16) : 0, views?.map(v => [Math.round(v.x0 * 4), Math.round(v.z0 * 4)])]);
    stats.lamps = [];
    if (key === lastKey) return stats;
    lastKey = key;
    stats.writes++;
    const tint = (x, z) => (tintOf ? tintOf(x, z) : [1, 1, 1]);
    let n = 0, np = 0, nr = 0, nq = 0, bodies = 0, lev = 0, tube = 0, holes = 0;
    const put = (P, i, q, o = {}) => P.set(i, { x: q.x, y: q.y, z: q.z, flat: q.flat, color: q.c, tint: o.light ? undefined : tint(q.x, q.z), noLine: !!o.noLine, light: !!o.light });
    for (const g of pr) {
      for (const q of bodyPixels(g, ppm)) if (put(body, n, q)) { n++; bodies++; }
      // (the pop: in its time, or the first frame after it once, never again; never first drawn POP_LATE_MS late)
      const first = popped.get(g.id), late = ms - g.burstAtMs;
      if (late >= 0 && (first === undefined ? late < POP_LATE_MS : ms - first < BANG_FLASH_MS)) {
        const px = popPixels(g, ms, ppm, { force: true });
        if (first === undefined) popped.set(g.id, ms);
        for (const q of px) if (put(pop, nq, q, { light: true })) nq++;
      }
      for (const q of puffPixels(g, Math.floor(ms / 50) * 50, ppm, wind)) if (put(puff, np, q, { noLine: true })) np++;
    }
    for (const L of [...levers.values()].slice(-DEVICES_MAX)) for (const q of leverPixels(L, ms, ppm)) if (put(body, n, q)) { n++; lev++; }
    for (const c of V.charges ?? []) {
      for (const q of stripPixels(c, ppm)) if (put(body, n, q)) n++;
      for (const q of tubePixels(c, ms, ppm)) if (put(body, n, q, { light: tubeLit(c, ms) })) { n++; tube++; }
    }
    for (const h of V.holes ?? []) for (const q of holePixels(h, ms, ppm)) if (put(body, n, q)) { n++; holes++; }
    for (const r of V.reads ?? []) for (const q of overlayPixels(r, ppm, { clip: floorClip(r.floor, views) })) if (put(read, nr, q, { noLine: true })) nr++;
    body.count(n); puff.count(np); read.count(nr); pop.count(nq);
    Object.assign(stats, { bodies, levers: lev, charges: (V.charges ?? []).filter(c => c.st !== 'gone').length, tube, holes, reads: (V.reads ?? []).filter(r => r.k > 0).length, readPx: nr, puff: np, pop: nq, pixels: n + np + nr + nq });
    return stats;
  }
  return { group, update, stats, pixels: { body, puff, read, pop }, dispose() { for (const p of [body, puff, read, pop]) p.dispose(); group.removeFromParent(); } };
}
