// OLYMPUS art: a figure's sheet. Every frame of a look laid out in bands, painted a band at a time, and the flashes.
//
// A person's frames (poses.js FRAMES, four facings each) go on one sheet per look, the way tradecraft's
// crowd held a sheet a person (src/render/crowd.js), so the render keeps one slot of its atlas per look
// and never re-sends it whole. The sheet is laid out once per density (sheetLayout()):
// each band (gait, arms, rest, float) a block of cells, a row per facing and a column per frame, each
// cell its frame's kind (body.js: a standing cell, a long one for a body lying side on, the long one
// stood up for one lying end on, a square for a tumble); the blocks shelved into a sheet SHEET_W_M wide
// (my call: 32 m at 16 px/m is 512 px, a sheet about 512 × 456). So a band is one rectangle of the
// sheet, and it is painted (paintBand(): compose.js and shade.js for each of its cells) and sent up
// alone, the first time anyone of that look needs it: a crowd that never aims never costs an aim.
//
// Each cell carries its frame's anchor (ax, ay: the pixel over the sim's spot, body.js), the same for
// every look at a density (lying frames are fitted to their cells by the body alone, not
// by what it carries), so the render places any look's card from the layout. The flashes are not on the
// sheets: flashStrip() paints every one there can be (each gun, facing and fire frame: tradecraft's
// FLASH turned with the gun, or a star at you) into one small strip, with each one's offset from its
// cell's top-left, and the render draws it as a card of its own, unlit, for FLASH_MS.
// Pure: Pixmaps (src/art/paint.js words), no GPU objects.
import { PX_PER_M } from '../../render/scale.js';
import { BANDS, BAND_KEYS, DIRS, cellKind, FRAMES } from './poses.js';
import { bodyOf } from './body.js';
import { composeFrame } from './compose.js';
import { shade } from './shade.js';
import { coloursOf, wear } from './outfits.js';
import { flashCells } from './templates.js';
import { word } from '../paint.js';

/** The sheet's width, metres at the density (512 px at 16 px/m, 768 at 24). */
export const SHEET_W_M = 32;
const GAP = 0;

const layouts = new Map();
/**
 * The sheet's layout at a density: { w, h, bands: { [band]: { x, y, w, h } },
 * cells: Map `${frame}|${dir}` → { x, y, w, h, ax, ay, kind, band } } (x, y in the sheet; ax, ay in the cell).
 */
export function sheetLayout(ppm = PX_PER_M) {
  const key = `${ppm}`;
  if (layouts.has(key)) return layouts.get(key);
  const B = bodyOf(ppm), anchorLook = wear({ outfit: 'utilities', weapon: null });
  const blocks = BAND_KEYS.map(band => {
    let y = 0, w = 0;
    const cells = [];
    for (const dir of DIRS) {
      let x = 0, rh = 0;
      for (const frame of BANDS[band]) {
        const c = B.cell[cellKind(frame, dir)];
        // (the anchor is the body's: composed bare, the same for every look; standing cells keep their own)
        const fr = c.kind === 'stand' ? null : composeFrame(anchorLook, dir, frame, { ppm });
        cells.push({ frame, dir, x, y, w: c.w, h: c.h, ax: fr ? fr.ax : c.ax, ay: fr ? fr.ay : c.ay, kind: c.kind, band });
        x += c.w + GAP; rh = Math.max(rh, c.h);
      }
      w = Math.max(w, x); y += rh + GAP;
    }
    return { band, w, h: y, cells };
  });
  // (shelves: blocks left to right while they fit the sheet's width, then a new shelf)
  const SW = Math.max(Math.round(SHEET_W_M * ppm), ...blocks.map(b => b.w));
  let sx = 0, sy = 0, shelf = 0;
  const bands = {}, cells = new Map();
  for (const b of blocks) {
    if (sx + b.w > SW) { sx = 0; sy += shelf; shelf = 0; }
    bands[b.band] = { x: sx, y: sy, w: b.w, h: b.h };
    for (const c of b.cells) cells.set(`${c.frame}|${c.dir}`, { ...c, x: sx + c.x, y: sy + c.y });
    sx += b.w; shelf = Math.max(shelf, b.h);
  }
  const out = { ppm, w: SW, h: sy + shelf, bands, cells, body: B };
  layouts.set(key, out);
  return out;
}

// ---------- composed frames, shared by shape ----------

/**
 * What in a look changes a frame's drawing (not its colours): the cut of the top and legs, what's on the
 * head, armour, pack, belt, rank, gloves, hair style, weapon and carry. Looks alike in these (a squad in
 * utilities, whatever their skin, hair colour or camouflage's seed) share their composed frames.
 */
export function shapeKey(L) {
  return [L.top?.kind, L.top?.emblem ? 'e' : '', L.legs?.kind, L.head?.kind ?? '-', L.armour ? 'ø' : '', L.pack ? (L.pack.helmet ? 'jh' : 'j') : '',
    L.belt ? 'y' : '', L.rank ? 'r' : '', L.gloves ? 'd' : '', L.hair?.style, L.weapon ?? '-', L.carry ?? '-'].join('|');
}
/** How many composed frames are kept (a least-recently-used cache: about ten shapes' gait bands). */
export const COMPOSED_KEEP = 600;
const composed = new Map();
/** A frame composed (compose.js), from the cache when a look of the same shape has had it. */
export function composeCached(L, dir, frame, { ppm = PX_PER_M } = {}) {
  const key = `${ppm}|${shapeKey(L)}|${frame}|${dir}`;
  let fr = composed.get(key);
  if (fr) { composed.delete(key); composed.set(key, fr); return fr; }
  fr = composeFrame(L, dir, frame, { ppm });
  composed.set(key, fr);
  if (composed.size > COMPOSED_KEEP) composed.delete(composed.keys().next().value);
  return fr;
}
export const composedStats = () => ({ frames: composed.size });

/**
 * A band of a look painted: a Pixmap of the band's rectangle (its cells' frames, shaded and outlined),
 * { band, rect: { x, y, w, h }, pm, ms }. The look may be raw (outfits.js wear() is applied).
 */
export function paintBand(look, band, opts = {}) {
  const it = bandSteps(look, band, opts);
  for (;;) { const r = it.next(); if (r.done) return r.value; }
}

/**
 * paintBand() a cell at a time: a generator that yields after each frame and returns the band, so the
 * render can spread a new face over a few frames within its budget (src/render/figures.js).
 */
export function* bandSteps(look, band, { ppm = PX_PER_M } = {}) {
  let ms = 0, t0 = performance.now();
  const L = look?.top ? look : wear(look), lay = sheetLayout(ppm), rect = lay.bands[band];
  const data = new Uint32Array(rect.w * rect.h), col = coloursOf(L, ppm);
  for (const frame of BANDS[band]) for (const dir of DIRS) {
    const c = lay.cells.get(`${frame}|${dir}`);
    const fr = composeCached(L, dir, frame, { ppm });
    const pm = shade(fr.cells, col);
    // (a lying frame painted for its anchor, not the layout's: shifted so the two agree)
    const ox = c.x - rect.x + (c.ax - fr.ax), oy = c.y - rect.y + (c.ay - fr.ay);
    for (let y = 0; y < pm.h; y++) {
      const Y = oy + y;
      if (Y < c.y - rect.y || Y >= c.y - rect.y + c.h) continue;
      for (let x = 0; x < pm.w; x++) {
        const v = pm.data[y * pm.w + x], X = ox + x;
        if (!v || X < c.x - rect.x || X >= c.x - rect.x + c.w) continue;
        data[Y * rect.w + X] = v;
      }
    }
    ms += performance.now() - t0;
    yield ms;
    t0 = performance.now();
  }
  return { band, rect, pm: { w: rect.w, h: rect.h, data, repeat: false, key: null, glows: true }, ms };
}

/** Every band of a look on one sheet (a Pixmap of the whole layout): for the samples, the tests and a single card. */
export function paintSheet(look, { ppm = PX_PER_M, bands = BAND_KEYS } = {}) {
  const lay = sheetLayout(ppm), data = new Uint32Array(lay.w * lay.h);
  let ms = 0;
  for (const band of bands) {
    const b = paintBand(look, band, { ppm }), r = b.rect;
    for (let y = 0; y < r.h; y++) data.set(b.pm.data.subarray(y * r.w, (y + 1) * r.w), (r.y + y) * lay.w + r.x);
    ms += b.ms;
  }
  return { w: lay.w, h: lay.h, data, repeat: false, key: null, glows: true, ms };
}

/** One frame of a look as a Pixmap with its anchor: { pm, ax, ay, muzzle, flash } (a single card, a close look). */
export function paintFrame(look, dir, frame, { ppm = PX_PER_M } = {}) {
  const L = look?.top ? look : wear(look);
  const fr = composeFrame(L, dir, frame, { ppm });
  return { pm: shade(fr.cells, coloursOf(L, ppm)), ax: fr.ax, ay: fr.ay, muzzle: fr.muzzle, flash: fr.flash, kind: fr.kind };
}

export const FIRE_FRAMES = Object.freeze(['fire', 'firehi', 'firelo', 'kneelfire', 'pronefire']);
const strips = new Map();
/**
 * Every flash there can be at a density, in one strip: { pm, size (a slot's side, px),
 * index: Map `${gun}|${dir}|${frame}` → { slot, ox, oy } } (ox, oy: the slot's top-left from its frame's
 * cell's top-left, in the layout's cell, so the render puts it over the muzzle; behind: drawn behind the figure).
 */
export function flashStrip(ppm = PX_PER_M) {
  const key = `${ppm}`;
  if (strips.has(key)) return strips.get(key);
  const lay = sheetLayout(ppm), k = ppm / 16, list = [];
  for (const gun of ['rifle', 'pistol']) for (const dir of DIRS) for (const frame of FIRE_FRAMES) {
    if (gun === 'pistol' && frame === 'pronefire') continue;
    const fr = composeFrame(wear({ outfit: 'utilities', weapon: gun }), dir, frame, { ppm });
    if (!fr.muzzle || !fr.flash) continue;
    const c = lay.cells.get(`${frame}|${dir}`);
    const cells = flashCells(fr.flash.kind === 'side' ? 'side' : 'star', fr.muzzle[0] + (c.ax - fr.ax), fr.muzzle[1] + (c.ay - fr.ay), fr.flash.th, k);
    list.push({ key: `${gun}|${dir}|${frame}`, cells, behind: fr.flash.kind === 'back' });
  }
  const size = Math.max(4, ...list.map(({ cells }) => {
    const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
    return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + 1;
  }));
  const data = new Uint32Array(size * list.length * size), index = new Map();
  list.forEach(({ key: k2, cells, behind }, slot) => {
    const x0 = Math.min(...cells.map(c => c[0])), y0 = Math.min(...cells.map(c => c[1]));
    for (const [x, y, colr] of cells) data[(y - y0) * size * list.length + slot * size + (x - x0)] = word(colr);
    index.set(k2, { slot, ox: x0, oy: y0, behind });
  });
  const out = { pm: { w: size * list.length, h: size, data, repeat: false, key: `flash:${key}`, glows: false }, size, index, count: list.length };
  strips.set(key, out);
  return out;
}

/** The frames a band holds, and which band a frame is in (for the render's lazy painting). */
export { BANDS, BAND_KEYS, FRAMES };
