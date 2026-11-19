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
// R8 (the shoot house rework; VIEWS §3.10.8): the stance pool (poses.js STANCE_BANDS: the glide, Assault and the beats of close
// quarters, painted in one carry) is shelved like the base pool, its sheet within a base sheet's size, so the render keeps it in a
// base slot of its own (src/render/figures.js), only for an armed mover in a stance: no new texture, the base looks unchanged.
// 0.0.5: the rifle's handling bands (poses.js RIFLE_BANDS) are laid out in a POOL of their own, a second,
// smaller sheet (pools.rifle: the bands side by side, 1360 × 152 at 16 px/m from v0.0.23's P-12 band, RIFLE_SHEET_W_M), so the base sheet
// keeps its size and the atlas its 40 looks at 16 px/m; the render keeps rifle sheets in the atlas's rows
// the base sheets leave below them (src/render/figures.js) and gives one only to a look that handles a
// rifle. A band's rectangle and its cells are in its pool's sheet (bands[band].pool).
// Each cell carries its frame's anchor (ax, ay: the pixel over the sim's spot, body.js), the same for
// every look at a density (lying frames are fitted to their cells by the body alone, not
// by what it carries), so the render places any look's card from the layout. The flashes are not on the
// sheets: flashStrip() paints every one there can be (each gun, facing and fire frame: tradecraft's
// FLASH turned with the gun, or a star at you) into one small strip, with each one's offset from its
// cell's top-left, and the render draws it as a card of its own, unlit, for FLASH_MS.
// v0.0.22 (its build sheet §1 item 17; the residuals lens's R3): the device in the hands is not on the sheets either. heldStrip()
// paints it once, at load, into one small strip of cards: for each device's shape (templates.js HELD and HELD_POSES), each frame a
// body with it in hand draws (the idle, the walk and the run, the rifle slung in front, holding it in the right fist; and the held
// band's own) and each facing, the frame composed with the device and without it, both shaded in the house marine's look, and the
// card is every pixel the two differ in (the device where the body leaves it in sight, its outline, the inner line it lays on the
// body), cropped, with its offset from its cell's top-left: so the card over the figure's card is the frame with the device, to the
// pixel, and a figure with no device is the frame it always was. A card a colour of that shape (devicetable.js look.colour); the
// hands' tips kept for the checks. The render draws them as the figures are, lit (src/render/figures.js).
// Pure: Pixmaps (src/art/paint.js words), no GPU objects.
import { PX_PER_M } from '../../render/scale.js';
import { BANDS, BAND_KEYS, DIRS, cellKind, FRAMES, POOL_OF } from './poses.js';
import { bodyOf } from './body.js';
import { composeFrame } from './compose.js';
import { shade } from './shade.js';
import { coloursOf, wear } from './outfits.js';
import { flashCells, HELD, HELD_POSES, HELD_COLOURS, HELD_VARIANTS } from './templates.js';
import { word } from '../paint.js';

/** The sheet's width, metres at the density (512 px at 16 px/m, 768 at 24). */
export const SHEET_W_M = 32;
/** The rifle pool's sheet width, metres (its three bands side by side: 880 px at 16 px/m, so four go across a 4096 atlas; v0.0.23,
 * the P-12's band beside them (poses.js BANDS.pistol, fifteen frames with its two walks, the user's note of 2026-11-17): 85 m,
 * 1360 px at 16 px/m (three across) and 2040 at 24 (two across), the most that keeps those counts). */
export const RIFLE_SHEET_W_M = 85;
const GAP = 0;

const layouts = new Map();
/**
 * The sheet's layout at a density: { w, h (the base pool's sheet), bands: { [band]: { x, y, w, h, pool } },
 * cells: Map `${frame}|${dir}` → { x, y, w, h, ax, ay, kind, band, pool }, pools: { base: { w, h }, rifle:
 * { w, h } } } (x, y in the band's pool's sheet; ax, ay in the cell).
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
  // (shelves, a pool at a time: blocks left to right while they fit the sheet's width, then a new shelf)
  const bands = {}, cells = new Map(), pools = {};
  // (R8: the stance pool shelved as the base is, its sheet no larger than a base one, so it takes a base slot of the atlas)
  for (const [pool, wM] of [['base', SHEET_W_M], ['rifle', RIFLE_SHEET_W_M], ['stance', SHEET_W_M]]) {
    const mine = blocks.filter(b => POOL_OF[b.band] === pool);
    const SW = Math.max(Math.round(wM * ppm), ...mine.map(b => b.w));
    let sx = 0, sy = 0, shelf = 0;
    for (const b of mine) {
      if (sx + b.w > SW) { sx = 0; sy += shelf; shelf = 0; }
      bands[b.band] = { x: sx, y: sy, w: b.w, h: b.h, pool };
      for (const c of b.cells) cells.set(`${c.frame}|${c.dir}`, { ...c, pool, x: sx + c.x, y: sy + c.y });
      sx += b.w; shelf = Math.max(shelf, b.h);
    }
    pools[pool] = { w: SW, h: sy + shelf };
  }
  const out = { ppm, w: pools.base.w, h: pools.base.h, bands, cells, body: B, pools };
  layouts.set(key, out);
  return out;
}

// ---------- composed frames, shared by shape ----------

/**
 * What in a look changes a frame's drawing (not its colours): the cut of the top and legs, what's on the
 * head, armour, pack, belt, rank, gloves, hair style and its step (0.0.6), weapon and carry (and the rifle's drawing, when a
 * look names one: src/art/rifles.js), and the body's cues it shows
 * (wet hair's sheen, a tired body's pose). Looks alike in these (a squad in
 * utilities, whatever their skin, hair colour or camouflage's seed) share their composed frames.
 */
export function shapeKey(L) {
  return [L.top?.kind, L.top?.emblem ? 'e' : '', L.legs?.kind, L.head?.kind ?? '-', L.armour ? 'ø' : '', L.pack ? (L.pack.helmet ? 'jh' : 'j') : '',
    L.belt ? 'y' : '', L.rank ? 'r' : '', L.gloves ? 'd' : '', `${L.hair?.style}${L.hair?.step || ''}`, L.weapon ?? '-', L.carry ?? '-', L.wet ? 'w' : '', L.tired ? 't' : '',
    `${L.ears ? 'E' : ''}${L.headset ? 'H' : ''}${L.brassard ? 'B' : ''}${L.magOut ? 'M' : ''}`].join('|') + (L.model ? `|${L.model}` : '') + (L.cycle ? `|c${L.cycle}` : '') + (L.mask ? `|k${L.mask}` : '');
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

/**
 * Every band of a look on one sheet (a Pixmap of the whole layout): for the samples, the tests and a single
 * card. The rifle pool's sheet is stacked under the base's when any of its bands are asked for (rifle: true
 * for all of them; by default a look with a weapon gets them).
 */
export function paintSheet(look, { ppm = PX_PER_M, bands = null, rifle = null } = {}) {
  const lay = sheetLayout(ppm), L = look?.top ? look : wear(look);
  const want = bands ?? BAND_KEYS.filter(b => POOL_OF[b] === 'base' || (POOL_OF[b] === 'rifle' && (rifle ?? !!L.weapon)));
  const withRifle = want.some(b => POOL_OF[b] === 'rifle'), withStance = want.some(b => POOL_OF[b] === 'stance');
  const RH = withRifle ? lay.pools.rifle.h : 0;
  const W = Math.max(lay.w, withRifle ? lay.pools.rifle.w : 0), H = lay.h + RH + (withStance ? lay.pools.stance.h : 0), data = new Uint32Array(W * H);
  let ms = 0;
  for (const band of want) {
    const b = paintBand(look, band, { ppm }), r = b.rect, oy = POOL_OF[band] === 'rifle' ? lay.h : POOL_OF[band] === 'stance' ? lay.h + RH : 0;
    for (let y = 0; y < r.h; y++) data.set(b.pm.data.subarray(y * r.w, (y + 1) * r.w), (oy + r.y + y) * W + r.x);
    ms += b.ms;
  }
  return { w: W, h: H, data, repeat: false, key: null, glows: true, ms };
}

/** One frame of a look as a Pixmap with its anchor: { pm, ax, ay, muzzle, flash } (a single card, a close look). */
export function paintFrame(look, dir, frame, { ppm = PX_PER_M } = {}) {
  const L = look?.top ? look : wear(look);
  const fr = composeFrame(L, dir, frame, { ppm });
  return { pm: shade(fr.cells, coloursOf(L, ppm)), ax: fr.ax, ay: fr.ay, muzzle: fr.muzzle, flash: fr.flash, kind: fr.kind };
}

export const FIRE_FRAMES = Object.freeze(['fire', 'firehi', 'firelo', 'kneelfire', 'pronefire', 'sitFire', 'fireMove0', 'fireMove1']);
/**
 * The flash's size on Mars, of tradecraft's (the build sheet 0.0.5 §2.3 (c): "the flash (Mars ×1.2)": in
 * Melas's 66 kPa the propellant's gas burns on a little further past the muzzle than at sea level).
 */
export const MARS_FLASH_K = 1.2;
const strips = new Map();
/**
 * Every flash there can be at a density, in one strip: { pm, size (a slot's side, px),
 * index: Map `${gun}|${dir}|${frame}` → { slot, ox, oy } } (ox, oy: the slot's top-left from its frame's
 * cell's top-left, in the layout's cell, so the render puts it over the muzzle; behind: drawn behind the figure).
 */
export function flashStrip(ppm = PX_PER_M) {
  const key = `${ppm}`;
  if (strips.has(key)) return strips.get(key);
  const lay = sheetLayout(ppm), k = ppm / 16 * MARS_FLASH_K, list = [];
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

// ---------- the device in the hands (see the header) ----------
/** The frames a body walking or standing with a device draws (the held band's are HELD_POSES' own), each with the device in its right fist. */
export const HELD_WALK_FRAMES = Object.freeze(['idle0', 'idle1', ...Array.from({ length: 8 }, (_, i) => `walk${i}`), ...Array.from({ length: 8 }, (_, i) => `run${i}`), 'slungFront']);
/** The look the held cards are composed in: the house marine's (the black combat EVA suit, the carrier, the R-7 slung in front). */
export const HELD_LOOK = Object.freeze({ outfit: 'combatSuit', carrier: true, weapon: 'rifle', carry: 'front', seed: 3, model: 'r7' });
/** The width of the held strip (px; its shelves of cards). */
const HELD_STRIP_W = 512;
const heldStrips = new Map();
export { HELD_VARIANTS };
/** A card's key in the strip's index. */
export const heldKey = (shape, colour, frame, dir) => `${shape}|${colour}|${frame}|${dir}`;
/**
 * The held strip at a density (see the header): { pm (the strip, rows of cards), index: Map heldKey → { x, y, w, h (in the strip), ox,
 * oy (the card's top-left from its cell's), hands: { r, l } (the tips in the cell's pixels), seen (pixels), all? (check: the device
 * drawn alone, { n, px, w, h }) }, shapes, ms }. look: the look composed (HELD_LOOK); shapes: the shapes baked (all by default; the
 * render bakes the lane's kit's at the brief's splash); check: the tests' whole-device pixels too.
 */
export function heldStrip(ppm = PX_PER_M, { look = HELD_LOOK, shapes = null, check = false } = {}) {
  const want = HELD_VARIANTS.filter(([shape]) => !shapes || shapes.includes(shape)), key = `${ppm}|${JSON.stringify(look)}|${want.map(v => v[0]).join(',')}${check ? '|check' : ''}`;
  if (heldStrips.has(key)) return heldStrips.get(key);
  const t0 = performance.now(), L = wear(look), col0 = coloursOf(L, ppm), steel = HELD_COLOURS.steel;
  const cards = [], plain = new Map();
  const plainOf = (frame, dir) => { const k = `${frame}|${dir}`; if (!plain.has(k)) plain.set(k, shade(composeFrame(L, dir, frame, { ppm }).cells, col0)); return plain.get(k); };
  for (const [shape, colours] of want) {
    const frames = [...HELD_WALK_FRAMES.map(f => [f, HELD[shape]]), ...Object.entries(HELD_POSES).filter(([, P]) => P.parts[shape]).map(([f, P]) => [f, P.parts[shape]])];
    for (const [frame, parts] of frames) for (const dir of DIRS) {
      const fr = composeFrame(L, dir, frame, { ppm, device: { parts } });
      const base = plainOf(frame, dir), W = fr.w;
      // (check: the device drawn alone too, its whole pixels and whether any lies on the cell's edge, where a longer part is cut off)
      const only = check ? composeFrame(L, dir, frame, { ppm, device: { parts, only: true } }) : null;
      const devPx = only ? only.cells.flatMap((row, y) => row.map((c, x) => (c && HELD_LETTER_SET.has(c.ch.toLowerCase()) ? [x, y] : null))).filter(Boolean) : null;
      const all = devPx ? { n: devPx.length, px: devPx, w: only.w, h: only.h } : null;
      for (const colour of colours) {
        const c = HELD_COLOURS[colour] ?? HELD_COLOURS.olive;
        const pm = shade(fr.cells, { ...col0, 'ǧ': c, 'ƶ': c, 'š': steel, 'ő': HELD_COLOURS.orange });
        const px = [];
        for (let i = 0; i < pm.data.length; i++) if (pm.data[i] !== base.data[i]) px.push(i);
        let x0 = W, y0 = fr.h, x1 = -1, y1 = -1;
        for (const i of px) { const x = i % W, y = (i / W) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
        cards.push({ key: heldKey(shape, colour, frame, dir), pm, W, px, x0, y0, w: x1 < 0 ? 0 : x1 - x0 + 1, h: y1 < 0 ? 0 : y1 - y0 + 1, hands: fr.hands, ...(all ? { all } : {}) });
      }
    }
  }
  // (shelves: cards left to right, then a new row; an empty card (the device all behind the body) takes no room)
  let sx = 0, sy = 0, shelf = 0;
  for (const c of cards) { if (!c.w) continue; if (sx + c.w > HELD_STRIP_W) { sx = 0; sy += shelf; shelf = 0; } c.x = sx; c.y = sy; sx += c.w; shelf = Math.max(shelf, c.h); }
  const H = Math.max(1, sy + shelf), data = new Uint32Array(HELD_STRIP_W * H), index = new Map();
  for (const c of cards) {
    for (const i of c.px) { const x = i % c.W, y = (i / c.W) | 0; data[(c.y + y - c.y0) * HELD_STRIP_W + c.x + x - c.x0] = c.pm.data[i]; }
    index.set(c.key, { x: c.x ?? 0, y: c.y ?? 0, w: c.w, h: c.h, ox: c.x0, oy: c.y0, hands: c.hands, seen: c.px.length, ...(c.all ? { all: c.all } : {}) });
  }
  const out = { pm: { w: HELD_STRIP_W, h: H, data, repeat: false, key: `held:${key}`, glows: false }, index, count: cards.length, shapes: want.map(v => v[0]), ms: performance.now() - t0 };
  heldStrips.set(key, out);
  return out;
}
const HELD_LETTER_SET = new Set(['ǧ', 'š', 'ƶ', 'ő']);

/** The frames a band holds, and which band a frame is in (for the render's lazy painting). */
export { BANDS, BAND_KEYS, FRAMES };
