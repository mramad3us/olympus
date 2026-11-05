// OLYMPUS art: the kit of the squad bay and the quarterdeck. Racks, lockers, footlockers, rifle racks, desks.
//
// PLACES §4.4 sets the bay (layout A: a two-high `rack2` 0.95 × 2.05 m, heads to the wall, two wall
// lockers beside it, a footlocker at its foot, a 2.3 m aisle) and the quarterdeck's duty desk (the
// duty NCO, the logbook, the key box, the two-faced clock). Each maker builds one piece in its own
// frame (src/art/kit/kit.js: x across, z toward its front, the origin on the floor at its middle) from
// a few boxes whose faces are painted to size. The camera sees tops and fronts, so the detail goes
// there: a rack's made blanket and its foot end, a locker's door with its louvres, padlock, name card
// and stencilled number, the rifles' profiles on the pegs, the logbook open on the desk.
//
// A rack is built as it stands, not painted flat: the lower mattress under the upper deck, the gap
// between them (0.8 m, so the camera at 45° sees the lower blanket's foot end under the upper bunk),
// boots on the floor under the lower bunk, the upper deck's shadow on the lower one. Its posts are
// thin boxes of one part with the frame: at a pixel or two they ink dark, as a steel tube frame reads.
//
// Makes (o.make) and looks (o.look), each from the seed where not given:
//   rack2, rack1    make 'steel' (olive tube), 'grey' (grey enamel), 'modular' (panel ends, a drawer
//                   under); look { made: true | false, blanket: 'olive' | 'grey' | 'tan' | 'red', towel, boots }
//   wallLocker      make 'single' (one door, louvres), 'tier' (two doors stacked), 'mesh' (perforated);
//                   look { colour: 'olive' | 'grey' | 'tan', open, n (its number), bag (something on top) }
//   footlocker      make 'wood' (plywood, steel corners), 'steel' (olive trunk), 'polymer' (moulded);
//                   look { open, n }
//   rifleRack       make 'pegs' (rifles laid on wall pegs, profile out), 'upright' (a stand, rifles in
//                   butt slots, a locking bar), 'cabinet' (a steel cabinet, mesh doors); look { n (rifles), empty }
//   desk            make 'steel' (grey government desk), 'field' (folding table), 'wood'; look { screen }
//   chair, stool    make 'folding' | 'office' | 'steel'; stool make 'round' | 'square'
//   studyTable      a table and four stools (PLACES: "a study table with 4 stools")
//   dutyDesk        make 'counter' (a counter front with the company's plate), 'desk', 'podium'; look { lamp }
// Pure.
import { tex } from './kit.js';
import { C, U, P, bevel, sunk, oval, cloth, folds, louvres, handleV, handleH, padlock, nameCard, screenFace, cabinet, tone, hash3 } from './common.js';
import { paintedSteel, grimeFoot, chips, scuffs } from '../materials/index.js';
import { fontFor } from './type.js';

const BLANKETS = { olive: 0x4c633d, grey: 0x625854, tan: 0x96694f, red: 0x6e272f };
const FRAMES = { steel: 0x37664f, grey: 0x565b67, modular: 0x7c736b };
const LOCKERS = { olive: 0x4c633d, grey: 0x87959d, tan: 0xb28a59 };
const pick = (r, list) => list[Math.floor(r() * list.length)];

// ---------- racks ----------

/** A mattress top with its bedding, w × h px (head at the top row): made (sheet collar, blanket tight, a folded blanket at the foot) or unmade. */
function beddingTop(blanket, made, seed) {
  return tex(`bedding:${blanket}:${made}:${seed % 3}`, (px, w, h, ppm) => {
    if (made === 'asleep') return asleep(px, w, h, ppm, blanket, seed);
    const u = U(ppm), b = BLANKETS[blanket] ?? blanket, collar = P(0.32, ppm, 3);
    // (wool woven: a fine weave a pixel a row, not a broad mottle, which the palette snap turns to camouflage)
    const weave = (x0, y0, ww, hh, c) => { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) px(x0 + i, y0 + j, 1, 1, (i + 2 * j) % 5 === 0 ? tone(c, -0.03) : c); };
    if (made) {
      weave(0, 0, w, h, b);
      px(0, 0, w, collar, C.sheet); px(0, collar - 1, w, 1, tone(C.sheet, -0.08)); px(0, collar, w, 1, tone(b, -0.1));   // (the sheet's collar folded over the blanket)
      px(0, 0, w, 1, tone(C.sheet, 0.04));
      const fold = P(0.3, ppm, 3), fy = h - fold - P(0.1, ppm, 1), fc = blanket === 'grey' ? 0x4c633d : 0x625854;   // (a second blanket folded across the foot)
      weave(0, fy, w, fold, fc); px(0, fy, w, 1, tone(fc, 0.06)); px(0, fy + fold - 1, w, 1, tone(fc, -0.1)); px(0, Math.floor(fy + fold / 2), w, 1, tone(fc, -0.06));
      px(0, 0, 1, h, tone(b, -0.08)); px(w - 1, 0, 1, h, tone(b, -0.12));   // (tight edges: the hospital corners)
      px(Math.floor(w / 2), collar + 1, 1, Math.max(1, fy - collar - 2), tone(b, -0.04));   // (the crease down its middle)
      px(0, h - 1, w, 1, tone(b, 0.04));
    } else {
      // (unmade: the sheet rumpled, the blanket thrown back into a heap across the foot half, a corner of the sheet pulled off the ticking)
      weave(0, 0, w, h, C.sheet);
      folds(px, 0, 1, w, Math.floor(h * 0.5), C.sheet, { n: 5, seed: seed + 1, k: 0.8 });
      const top = Math.floor(h * (0.5 + (seed % 3) * 0.05));
      for (let i = 0; i < w; i++) {
        const t = top + Math.round((Math.sin(i * 0.35 + seed) + Math.sin(i * 0.9 + seed * 2) * 0.5) * 1.2 * u);
        for (let j = Math.max(0, t); j < h; j++) px(i, j, 1, 1, j === t ? tone(b, 0.07) : j === t + 1 ? tone(b, 0.03) : (i + 2 * j) % 5 === 0 ? tone(b, -0.03) : b);
        px(i, Math.min(h - 1, t + 2 + Math.round(2 * u)), 1, 1, tone(b, -0.08));
      }
      folds(px, 0, top + 3, w, h - top - 3, b, { n: 3, seed: seed + 7, vertical: true, k: 1 });
      const tick = P(0.22, ppm, 2);
      for (let j = 0; j < tick; j++) for (let i = w - tick; i < w; i++) if (i - (w - tick) + j < tick) px(i, j, 1, 1, (i % 2) ? 0x3c5d84 : C.linen);
    }
  });
}
/** Someone asleep under the blanket: drawn up to the shoulders, the body's ridge down it, knees, the feet's hump at the foot. */
function asleep(px, w, h, ppm, blanket, seed) {
  const b = BLANKETS[blanket] ?? blanket, collar = P(0.42, ppm, 4), cx = w / 2 + ((seed % 3) - 1) * w * 0.08;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(i, j, 1, 1, (i + 2 * j) % 5 === 0 ? tone(b, -0.03) : b);
  px(0, 0, w, collar, C.sheet);
  for (let j = collar; j < h - 2; j++) {
    const t = (j - collar) / (h - collar), half = w * (t < 0.12 ? 0.36 : t < 0.5 ? 0.3 - t * 0.1 : 0.22 - (t - 0.5) * 0.12);
    const l = Math.round(cx - half), r = Math.round(cx + half);
    px(l, j, 1, 1, tone(b, 0.07)); px(l + 1, j, Math.max(1, Math.round(half * 0.6)), 1, tone(b, 0.03));
    px(r, j, 1, 1, tone(b, -0.1)); px(r - 1, j, 1, 1, tone(b, -0.05));
  }
  px(Math.round(cx - w * 0.36), collar, Math.round(w * 0.72), 1, tone(C.sheet, -0.1));   // (the sheet turned down over the blanket's edge)
  px(0, collar, w, 1, tone(b, 0.06));
}
const pillowSleeper = (seed) => tex(`pillow-sleeper:${seed % 4}`, (px, w, h, ppm) => {
  // (a head on the pillow, turned aside: the hair, an ear, the back of the neck into the blanket)
  px(0, 0, w, h, C.paper); px(0, h - 1, w, 1, tone(C.linen, -0.05)); px(w - 1, 0, 1, h, tone(C.linen, -0.04));
  const hair = [0x31292a, 0x573a37, 0x7f4d23, 0x1a1214][seed % 4], skin = [0xc48a62, 0x8f5a3c, 0xe0a882, 0x6b4630][(seed >> 2) % 4];
  const cx = w * (0.45 + (seed % 3) * 0.05), cy = h * 0.6, rx = Math.max(2, P(0.1, ppm)), ry = Math.max(2, P(0.12, ppm));
  for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
    const a = (i + 0.5 - cx) / rx, bb = (j + 0.5 - cy) / ry;
    if (a * a + bb * bb <= 1) px(i, j, 1, 1, bb > 0.35 && a > -0.2 ? skin : hair);
  }
  px(Math.round(cx + rx * 0.6), Math.round(cy + ry * 0.2), 1, 1, tone(skin, -0.1));
  px(0, Math.round(cy + ry) + 1, w, 1, tone(C.paper, -0.08));
});
const mattressFront = (blanket, made) => tex(`mattressfront:${blanket}:${made}`, (px, w, h) => {
  const b = BLANKETS[blanket] ?? blanket;
  px(0, 0, w, h, made ? b : tone(b, -0.04)); px(0, 0, w, 1, tone(b, 0.06)); px(0, h - 1, w, 1, tone(b, -0.14));
  if (!made) for (let i = 0; i < w; i += 3) px(i, 1, 1, h - 2, tone(b, -0.07));
});
const pillowTop = tex('pillow', (px, w, h) => {
  px(0, 0, w, h, C.paper); px(0, h - 1, w, 1, tone(C.linen, -0.05)); px(w - 1, 0, 1, h, tone(C.linen, -0.04));
  px(1, Math.floor(h / 2), w - 2, 1, tone(C.paper, -0.05)); px(0, 0, w, 1, tone(C.paper, 0.02));
});
const railFace = (c) => tex(`rail:${c}`, (px, w, h) => { px(0, 0, w, h, c); px(0, 0, w, 1, tone(c, 0.08)); if (h > 2) px(0, h - 1, w, 1, tone(c, -0.12)); });
const endPanel = (c) => tex(`rackend:${c}`, (px, w, h, ppm) => {
  paintedSteel(px, 0, 0, w, h, { c, ppm, seed: 4 });
  sunk(px, P(0.06, ppm), P(0.06, ppm), w - 2 * P(0.06, ppm), h - 2 * P(0.06, ppm), tone(c, -0.02));
  scuffs(px, 0, 0, w, h, c, { ppm, seed: 2 });
});
const towelFace = (c) => tex(`towel:${c}`, (px, w, h, ppm) => { cloth(px, 0, 0, w, h, c, { seed: 6, u: U(ppm) }); px(0, 0, w, 1, tone(c, 0.06)); px(0, h - 1, w, 1, tone(c, -0.1)); for (let i = 1; i < w; i += 3) px(i, 1, 1, h - 2, tone(c, -0.04)); px(0, h - P(0.05, ppm), w, 1, tone(c, 0.1)); });
const bootSide = tex('boot-front', (px, w, h) => { px(0, 0, w, h, 0x31292a); px(0, 0, w, 1, tone(0x31292a, 0.08)); px(0, h - 1, w, 1, C.ink); });
const bootTop = tex('boot-top', (px, w, h) => { px(0, 0, w, h, 0x49403e); px(0, 0, w, Math.max(1, Math.floor(h / 3)), 0x31292a); px(1, 1, Math.max(1, w - 2), 1, tone(0x49403e, 0.06)); });

/** A pair of boots standing at (x, z) in the piece's frame (toes toward +z). */
export function boots(k, x, z, { coyote = false } = {}) {
  const c = coyote ? 0x96694f : 0x31292a;
  for (const dx of [-0.07, 0.07]) {
    k.comp();
    k.box({ x: x + dx, z, w: 0.1, d: 0.28, h: 0.08, faces: { front: coyote ? railFace(c) : bootSide, top: coyote ? railFace(tone(c, 0.04)) : bootTop, sides: c } });
    k.box({ x: x + dx, z: z - 0.08, y: 0.08, w: 0.09, d: 0.1, h: 0.12, faces: { front: coyote ? railFace(c) : bootSide, top: C.ink, sides: c } });
  }
}

function rackMaker(k, o, tiers) {
  const two = tiers >= 2;
  const { W, D, ppm, r, seed } = o, make = o.make ?? 'steel', look = o.look ?? {};
  const fc = FRAMES[make] ?? FRAMES.steel, rail = railFace(fc);
  const blanket = look.blanket ?? pick(r, ['olive', 'olive', 'grey', 'tan']);
  const madeLo = look.made ?? (look.madeLower ?? r() > 0.25), madeHi = look.madeUpper ?? look.made ?? r() > 0.3;
  const H = tiers === 3 ? 2.15 : two ? 1.7 : 0.75, post = 0.05, BK = -D / 2, FR = D / 2;
  const frame = k.comp();
  // (posts, as tall as the rack; the modular make's ends are panels)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box({ x: sx * (W / 2 - post / 2), z: sz * (D / 2 - post / 2), w: post, d: post, h: H, faces: { sides: fc, front: rail, top: tone(fc, 0.06) } });
  const decks = tiers === 3 ? [0.3, 0.98, 1.66] : two ? [0.28, 1.22] : [0.3];
  decks.forEach((y, i) => {
    k.box({ x: 0, z: 0, y, w: W - 2 * post, d: D - 2 * post, h: 0.05, part: frame, faces: { sides: fc, front: rail, top: tone(fc, -0.2) } });
    k.comp();
    const sleeping = look.sleeper && hash3(seed, i, 3) % 4 !== 0, made = sleeping ? 'asleep' : i === 0 ? madeLo : madeHi;
    k.box({ x: 0, z: 0, y: y + 0.05, w: W - 2 * post - 0.02, d: D - 2 * post - 0.02, h: 0.14, faces: { top: beddingTop(blanket, made, seed * 2 + i), front: mattressFront(blanket, made === true || made === 'asleep'), back: mattressFront(blanket, true), sides: BLANKETS[blanket] ?? 0x4c633d } });
    // (the pillow at the head, askew when unmade)
    k.comp();
    const off = made || sleeping ? 0 : (hash3(seed, i) % 2 ? 0.12 : -0.1);
    k.box({ x: off, z: BK + 0.32, y: y + 0.19, w: 0.58, d: 0.34, h: 0.09, faces: { top: sleeping ? pillowSleeper(seed * 3 + i) : pillowTop, sides: C.linen, front: railFace(C.linen) } });
    if (!made && !sleeping && hash3(seed, i, 5) % 2) {                          // (the blanket hanging off the foot)
      k.comp(); k.box({ x: (hash3(seed, i) % 2 ? 1 : -1) * 0.15, z: FR - post - 0.03, y: y - 0.12, w: 0.42, d: 0.03, h: 0.32, faces: { front: mattressFront(blanket, false), top: BLANKETS[blanket], sides: BLANKETS[blanket] } });
    }
  });
  // (the end frames: a bar across the foot under the upper deck and at the top, a head bar; modular: panels)
  const endsPart = frame;
  if (make === 'modular') {
    for (const z of [BK + post / 2, FR - post / 2]) k.box({ x: 0, z, y: two ? 1.4 : 0.48, w: W - 2 * post, d: 0.03, h: two ? 0.28 : 0.25, part: endsPart, faces: { front: endPanel(fc), sides: fc, top: tone(fc, 0.06) } });
    k.box({ x: 0, z: FR - 0.03, y: 0.04, w: W - 2 * post, d: 0.03, h: 0.2, part: endsPart, faces: { front: endPanel(fc), sides: fc, top: fc } });   // (a drawer front under the lower deck)
  } else {
    const bars = tiers === 3 ? [0.62, 1.3, 2.05] : two ? [0.62, 1.58] : [0.55];
    for (const y of bars) for (const z of [BK + post / 2, FR - post / 2]) k.box({ x: 0, z, y, w: W - 2 * post, d: 0.03, h: 0.04, part: endsPart, faces: { sides: fc, front: rail, top: tone(fc, 0.06) } });
  }
  // (a towel drying over the foot bar; boots under the lower deck; a laundry bag on a head post)
  if (look.towel ?? r() < 0.45) { k.comp(); k.box({ x: (r() - 0.5) * 0.3, z: FR - post / 2 + 0.02, y: two ? 0.42 : 0.3, w: 0.36, d: 0.03, h: 0.24, faces: { front: towelFace(pick(r, [0x625854, 0x4c633d, C.linen, 0x3c5d84])), sides: 0x625854, top: 0x695745 } }); }
  if (look.boots ?? r() < 0.8) boots(k, (r() - 0.5) * 0.3, FR - 0.32, { coyote: r() < 0.5 });
  if (two && (look.bag ?? r() < 0.3)) { k.comp(); k.box({ x: -W / 2 + 0.06, z: BK + 0.12, y: 0.9, w: 0.2, d: 0.2, h: 0.45, faces: { front: towelFace(0x4c633d), top: 0x264c35, sides: 0x4c633d } }); }
}
export const rack2 = (k, o) => rackMaker(k, o, 2);
export const rack1 = (k, o) => rackMaker(k, o, 1);
/** A three-high rack (a warship's berthing, PLACES §5.3: three-high columns under a 2.4 m deckhead), pan lockers under the lowest. */
export const rack3 = (k, o) => rackMaker(k, o, 3);

// ---------- lockers ----------

const lockerFront = (make, c, n, open, seed) => tex(`locker:${make}:${c}:${n}:${open}:${seed % 4}`, (px, w, h, ppm) => {
  const u = U(ppm), f = fontFor(ppm), m = P(0.04, ppm, 1);
  paintedSteel(px, 0, 0, w, h, { c, ppm, seed: 11 });
  if (open) {
    // (the door is open: the locker's inside, uniforms on hangers, a cover on the shelf, boots at the foot)
    const ix = m + 1, iy = m + 1, iw = w - 2 * m - 2, ih = h - 2 * m - 2 - P(0.08, ppm);
    px(ix, iy, iw, ih, tone(c, -0.42));
    const shelf = iy + P(0.3, ppm, 3);
    px(ix, shelf, iw, 1, tone(c, -0.1));
    px(ix + 1, shelf - P(0.1, ppm, 2), Math.max(2, Math.floor(iw / 2)), P(0.1, ppm, 2), 0x96694f);   // (a cover)
    px(ix, shelf + P(0.06, ppm, 1), iw, 1, C.steelD);                                                 // (the hanging rail)
    const garments = [0x96694f, 0x8f3f31, 0x96694f, 0x4c633d, 0x625854];
    let gx = ix + 1;
    for (let g = 0; gx < ix + iw - 1; g++) {
      const gw = Math.max(2, Math.round((2 + (hash3(g, seed) % 2)) * u)), gc = garments[(g + seed) % garments.length], gh = P(0.75 + (hash3(seed, g) % 3) * 0.12, ppm);
      px(gx, shelf + P(0.08, ppm, 1), Math.min(gw, ix + iw - gx), gh, gc);
      px(gx, shelf + P(0.08, ppm, 1), 1, gh, tone(gc, 0.06)); px(gx + Math.min(gw, ix + iw - gx) - 1, shelf + P(0.08, ppm, 1), 1, gh, tone(gc, -0.1));
      gx += gw;
    }
    for (const bx of [ix + 1, ix + Math.floor(iw / 2)]) { px(bx, iy + ih - P(0.12, ppm, 2), Math.max(2, Math.floor(iw / 2) - 1), P(0.12, ppm, 2), 0x31292a); px(bx, iy + ih - P(0.12, ppm, 2), Math.max(2, Math.floor(iw / 2) - 1), 1, 0x49403e); }
    bevel(px, 0, 0, w, h, c, 1.2);
  } else {
    const panels = make === 'tier' ? [[m, m, w - 2 * m, Math.floor(h * 0.62) - m], [m, Math.floor(h * 0.62) + 1, w - 2 * m, h - Math.floor(h * 0.62) - 1 - m - P(0.08, ppm)]] : [[m, m, w - 2 * m, h - 2 * m - P(0.08, ppm)]];
    for (const [x, y, ww, hh] of panels) {
      bevel(px, x, y, ww, hh, c, 1.1);
      if (make === 'mesh') { for (let j = y + 2; j < y + hh - 2; j++) for (let i = x + 2; i < x + ww - 2; i++) if ((i + j) % 2 === 0) px(i, j, 1, 1, tone(c, -0.3)); }
      else {
        const lw = Math.max(3, ww - P(0.18, ppm, 4)), lx = x + Math.floor((ww - lw) / 2), lh = Math.min(P(0.14, ppm, 3), Math.floor(hh / 5));
        louvres(px, lx, y + P(0.06, ppm, 2), lw, lh, c, Math.max(2, Math.round(2 * u)));
        louvres(px, lx, y + hh - P(0.06, ppm, 2) - lh, lw, lh, c, Math.max(2, Math.round(2 * u)));
      }
      handleV(px, x + ww - P(0.07, ppm, 2), y + Math.floor(hh * (make === 'tier' && y > m ? 0.3 : 0.45)), P(0.12, ppm, 3), C.steel);
      padlock(px, x + ww - P(0.07, ppm, 2), y + Math.floor(hh * (make === 'tier' && y > m ? 0.3 : 0.45)) + P(0.13, ppm, 3), u);
    }
    nameCard(px, m + P(0.08, ppm, 2), m + P(0.36, ppm, 4), P(0.18, ppm, 4), P(0.08, ppm, 3), seed);
    const label = typeof n === 'string' ? n : `E${n}`, lw = f.width(label);
    if (lw < w - 2 * m - 2) f.stencil(px, Math.floor((w - lw) / 2), m + P(0.2, ppm, 3), label, 0xd9d1b7);
    for (const hy of [0.15, 0.85]) px(m - 1 >= 0 ? m - 1 : 0, Math.floor(h * hy), 1, P(0.08, ppm, 2), C.steelD);   // (the hinges)
  }
  px(0, h - P(0.08, ppm, 2), w, P(0.08, ppm, 2), tone(c, -0.25));            // (the plinth)
  grimeFoot(px, 0, 0, w, h, c, { ppm, upM: 0.25, seed: 3 });
  chips(px, 0, 0, w, h, c, { ppm, seed: seed + 5, per: 0.04 });
  scuffs(px, 0, 0, w, h - P(0.08, ppm, 2), c, { ppm, seed: seed + 9, lowM: 0.4 });
});
const steelTop = (c, what = null) => tex(`steeltop:${c}:${what}`, (px, w, h, ppm) => {
  paintedSteel(px, 0, 0, w, h, { c: tone(c, 0.03), ppm, seed: 2 });
  if (what === 'cover') { const cw = P(0.24, ppm, 4), ch = P(0.2, ppm, 3); oval(px, w * 0.4, h * 0.5, cw / 2, ch / 2, 0x96694f); oval(px, w * 0.4, h * 0.5 - 0.5, cw / 3, ch / 3, tone(0x96694f, 0.05)); }
  if (what === 'kevlar') { oval(px, w * 0.55, h * 0.5, P(0.13, ppm, 3), P(0.11, ppm, 3), 0x695745); oval(px, w * 0.55 - 1, h * 0.5 - 1, P(0.08, ppm, 2), P(0.06, ppm, 2), tone(0x695745, 0.06)); }
});
const steelBack = (c, n) => tex(`steelback:${c}:${n}`, (px, w, h, ppm) => {
  paintedSteel(px, 0, 0, w, h, { c: tone(c, -0.03), ppm, seed: 7 });
  const f = fontFor(ppm), s = String(n);
  if (f.width(s) < w - 4) f.stencil(px, Math.floor((w - f.width(s)) / 2), P(0.25, ppm), s, tone(c, -0.18));
  grimeFoot(px, 0, 0, w, h, c, { ppm, upM: 0.3, seed: 8 });
});

export function wallLocker(k, o) {
  const { W, D, ppm, r, seed } = o, make = o.make ?? 'single', look = o.look ?? {};
  const c = LOCKERS[look.colour] ?? look.colour ?? LOCKERS.olive, n = look.n ?? 200 + (seed % 60), open = look.open ?? false;
  k.comp();
  k.box({ x: 0, z: 0, w: W, d: D, h: 1.9, faces: { front: lockerFront(make, c, n, open, seed), top: steelTop(c, look.top ?? (r() < 0.25 ? 'cover' : r() < 0.15 ? 'kevlar' : null)), back: steelBack(c, n), sides: tone(c, -0.06) } });
  if (open) { k.comp(); k.box({ x0: -W / 2 - 0.02, x1: -W / 2 + 0.01, z0: D / 2, z1: D / 2 + W - 0.04, y: 0.05, h: 1.8, faces: { sides: tone(c, -0.08), front: railFace(c), top: c } }); }
  if (look.bag ?? r() < 0.2) { k.comp(); k.box({ x: (r() - 0.5) * 0.15, z: 0, y: 1.9, w: 0.45, d: 0.3, h: 0.25, faces: { front: towelFace(0x4c633d), top: tex('seabag-top', (px, w, h, p) => { cloth(px, 0, 0, w, h, 0x4c633d, { u: U(p) }); px(Math.floor(w / 2), 0, 1, h, 0x264c35); }), sides: 0x4c633d } }); }
}

// ---------- footlockers ----------

const footFront = (make, n) => tex(`foot:${make}:${n}`, (px, w, h, ppm) => {
  const u = U(ppm), f = fontFor(ppm), lid = P(0.08, ppm, 2);
  if (make === 'wood') {
    const c = C.ply;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(i, j, 1, 1, tone(c, (hash3(i >> 1, j, 3) % 9 === 0 ? -0.04 : 0) + (Math.sin((i + j * 0.3) * 0.5) > 0.85 ? -0.02 : 0)));
    px(0, lid, w, 1, tone(c, -0.18)); px(0, lid + 1, w, 1, tone(c, 0.04));
    const cap = P(0.06, ppm, 2);
    for (const [x, y] of [[0, 0], [w - cap, 0], [0, h - cap], [w - cap, h - cap]]) { px(x, y, cap, cap, C.steelD); px(x, y, cap, 1, tone(C.steelD, 0.08)); }
    const s = `2/4 E-${n}`, sw = f.width(s);
    if (sw < w - 2 * cap - 2) f.stencil(px, Math.floor((w - sw) / 2), lid + P(0.08, ppm, 2), s, 0x264c35);
    padlock(px, Math.floor(w / 2) - 1, Math.max(0, lid - 2), u);
    bevel(px, 0, 0, w, h, c, 0.8);
  } else if (make === 'steel') {
    const c = 0x4c633d;
    paintedSteel(px, 0, 0, w, h, { c, ppm, seed: 21 });
    px(0, lid, w, 1, tone(c, -0.2));
    for (const fx of [0.25, 0.75]) { const x = Math.floor(w * fx); px(x - 1, lid - 1, P(0.06, ppm, 3), P(0.07, ppm, 3), C.steel); px(x - 1, lid - 1, P(0.06, ppm, 3), 1, tone(C.steel, 0.08)); }
    for (let x = P(0.15, ppm); x < w - 2; x += P(0.2, ppm, 3)) px(x, lid + 2, 1, h - lid - 4, tone(c, -0.06));
    const s = String(n), sw = f.width(s);
    f.stencil(px, Math.floor((w - sw) / 2), lid + P(0.1, ppm, 2), s, 0xd9d1b7);
    chips(px, 0, 0, w, h, c, { ppm, seed: n });
  } else {
    const c = n % 2 ? 0xb1896d : 0x31292a;
    px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c, 1.3);
    px(0, lid, w, 1, tone(c, -0.2));
    for (let x = P(0.08, ppm); x < w - 2; x += P(0.12, ppm, 3)) { px(x, lid + 2, 1, h - lid - 4, tone(c, 0.05)); px(x + 1, lid + 2, 1, h - lid - 4, tone(c, -0.06)); }
    for (const fx of [0.22, 0.78]) { const x = Math.floor(w * fx); px(x - 1, lid - 1, P(0.07, ppm, 3), P(0.06, ppm, 2), C.black); }
  }
});
const footTop = (make, n, open) => tex(`foottop:${make}:${n}:${open}`, (px, w, h, ppm) => {
  const c = make === 'wood' ? C.ply : make === 'steel' ? 0x4c633d : (n % 2 ? 0xb1896d : 0x31292a);
  if (open) {
    // (the lid up: the tray's contents, shaving kit, folded T-shirts, socks rolled, a book)
    px(0, 0, w, h, tone(c, -0.3)); bevel(px, 0, 0, w, h, c);
    const cells = [[0.05, 0.1, 0.35, 0.8, 0x96694f], [0.42, 0.1, 0.25, 0.4, C.linen], [0.42, 0.55, 0.25, 0.35, 0x625854], [0.7, 0.1, 0.25, 0.8, 0x4c633d]];
    for (const [a, b, cw, ch, cc] of cells) { const X = Math.floor(a * w), Y = Math.floor(b * h), WW = Math.max(1, Math.floor(cw * w)), HH = Math.max(1, Math.floor(ch * h)); px(X, Y, WW, HH, cc); px(X, Y, WW, 1, tone(cc, 0.07)); for (let j = Y + 2; j < Y + HH; j += 2) px(X, j, WW, 1, tone(cc, -0.04)); }
    return;
  }
  if (make === 'wood') { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(i, j, 1, 1, tone(c, hash3(i, j >> 1, 9) % 11 === 0 ? -0.04 : 0.02)); }
  else paintedSteel(px, 0, 0, w, h, { c: tone(c, 0.03), ppm, seed: 23 });
  bevel(px, 0, 0, w, h, c, 1.2);
  px(0, 1, w, 1, tone(c, -0.1));
  for (const fx of [0.2, 0.8]) px(Math.floor(w * fx), 0, P(0.06, ppm, 2), 2, C.steelD);
});
export function footlocker(k, o) {
  const { W, D, H, seed } = o, make = o.make ?? 'wood', look = o.look ?? {}, n = look.n ?? 200 + (seed % 60), open = !!look.open;
  k.comp();
  const side = make === 'wood' ? C.ply : make === 'steel' ? 0x4c633d : (n % 2 ? 0xb1896d : 0x31292a);
  k.box({ x: 0, z: 0, w: W, d: D, h: H, faces: { front: footFront(make, n), top: footTop(make, n, open), back: footFront(make, n), sides: tone(side, -0.05) } });
  if (open) { k.comp(); k.box({ x: 0, z: -D / 2 + 0.02, y: H, w: W, d: 0.03, h: D * 0.9, faces: { front: tex(`lidin:${make}`, (px, w, h, ppm) => { px(0, 0, w, h, tone(side, -0.1)); bevel(px, 0, 0, w, h, side); nameCard(px, Math.floor(w * 0.35), P(0.1, ppm), P(0.2, ppm, 4), P(0.1, ppm, 3), seed); }), sides: side, top: side } }); }
}

// ---------- rifles and racks ----------

/**
 * A service rifle's profile, laid muzzle to the right, w × h px (h is about 0.24 m): stock and butt
 * pad, pistol grip, receiver with its rail, the magazine well (empty: magazines are kept apart), the
 * handguard, the barrel and its muzzle device, the sling's buckle. Hecate Arms' standard rifle is
 * OLYMPUS's own (WEAPONS names the arsenal); this is its silhouette at a pixel or two a centimetre.
 */
export function rifleProfile(px, x, y, w, h, { c = 0x31292a, furniture = 0x695745, ppm = 16 } = {}) {
  const L = (f) => x + Math.round(f * w), T = (f) => y + Math.round(f * h);
  const fill = (a, b, t, bt, col) => px(L(a), T(t), Math.max(1, L(b) - L(a)), Math.max(1, T(bt) - T(t)), col);
  fill(0, 0.26, 0.3, 0.75, furniture); fill(0, 0.03, 0.25, 0.8, tone(furniture, -0.1));   // (the stock, its butt pad)
  fill(0.26, 0.56, 0.3, 0.6, c); fill(0.26, 0.56, 0.3, 0.38, tone(c, 0.1));              // (the receiver, lit on top)
  fill(0.3, 0.36, 0.6, 0.98, tone(furniture, -0.05));                                     // (the pistol grip)
  fill(0.4, 0.47, 0.6, 0.85, tone(c, -0.05));                                             // (the magazine well)
  fill(0.3, 0.52, 0.16, 0.3, tone(c, 0.05));                                              // (the rail and its optic)
  fill(0.33, 0.43, 0.06, 0.18, 0x3c5d84);
  fill(0.56, 0.85, 0.34, 0.6, furniture); fill(0.56, 0.85, 0.34, 0.4, tone(furniture, 0.08));   // (the handguard)
  fill(0.85, 1, 0.42, 0.52, tone(c, -0.05)); fill(0.95, 1, 0.38, 0.56, c);                // (the barrel, its muzzle device)
  if (ppm >= 20) { fill(0.6, 0.62, 0.6, 0.7, C.steelD); fill(0.1, 0.12, 0.75, 0.85, C.steelD); }   // (the sling's swivels)
}

const pegsFace = (n, empty, seed) => tex(`riflepegs:${n}:${empty}:${seed % 3}`, (px, w, h, ppm) => {
  const back = 0x565b67, u = U(ppm);
  paintedSteel(px, 0, 0, w, h, { c: back, ppm, seed: 31 });
  const row = Math.floor((h - P(0.12, ppm)) / n), rh = Math.max(4, Math.round(0.22 * ppm));
  for (let i = 0; i < n; i++) {
    const y = P(0.08, ppm) + i * row;
    for (const fx of [0.18, 0.62]) { px(Math.floor(w * fx), y + rh - 1, Math.max(2, Math.round(2 * u)), Math.max(2, Math.round(2 * u)), C.steel); px(Math.floor(w * fx), y + rh + 1, Math.max(2, Math.round(2 * u)), 1, tone(back, -0.2)); }
    if (empty || hash3(seed, i) % 7 === 0) continue;
    rifleProfile(px, P(0.04, ppm), y, w - P(0.08, ppm), rh, { ppm, furniture: hash3(seed, i, 3) % 3 ? 0x695745 : 0x31292a });
    px(P(0.04, ppm) + 1, y + rh, w - P(0.1, ppm), 1, tone(back, -0.15));     // (its shadow on the board)
  }
  // (the locking cable down the front, its padlock at the foot)
  px(w - P(0.05, ppm, 2), 0, 1, h - P(0.08, ppm), C.steel);
  padlock(px, w - P(0.06, ppm, 2) - 1, h - P(0.08, ppm) - 2, u);
});
const rifleFront = tex('rifle-front', (px, w, h, ppm) => {
  // (a rifle seen end-on from its left, upright: butt at the foot, the grip and magazine well, the handguard, the muzzle at the top)
  px(0, 0, w, h, 0x31292a);
  px(0, h - P(0.28, ppm), w, P(0.28, ppm), 0x695745);
  px(0, Math.floor(h * 0.42), w, P(0.1, ppm, 2), 0x49403e);
  px(0, Math.floor(h * 0.12), w, P(0.25, ppm), tone(0x695745, 0.04));
  px(0, 0, w, 1, 0x7c736b);
  if (w > 1) px(w - 1, 0, 1, h, tone(0x31292a, -0.1));
});
const rifleSide = tex('rifle-side', (px, w, h, ppm) => {
  // (the profile stood up: the face is d × h, the rifle along h; drawn turned by painting rows)
  const tmp = []; const put = (x, y, ww, hh, c) => tmp.push([x, y, ww, hh, c]);
  rifleProfile(put, 0, 0, h, w, { ppm });
  for (const [x, y, ww, hh, c] of tmp) for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) px(y + j, h - 1 - (x + i), 1, 1, c);
});
export function rifleRack(k, o) {
  const { W, D, ppm, r, seed } = o, make = o.make ?? 'pegs', look = o.look ?? {};
  if (make === 'pegs') {
    const n = look.n ?? 5;
    k.comp();
    k.box({ x: 0, z: -D / 2 + 0.06, y: 0.25, w: W, d: 0.12, h: 1.45, faces: { front: pegsFace(n, !!look.empty, seed), top: 0x565b67, sides: 0x3e424d } });
    return;
  }
  if (make === 'cabinet') {
    k.comp();
    k.box({ x: 0, z: 0, w: W, d: D, h: 1.85, faces: { front: tex(`riflecab:${seed % 3}:${!!look.empty}`, (px, w, h, p) => {
      const c = 0x565b67; paintedSteel(px, 0, 0, w, h, { c, ppm: p, seed: 41 });
      const m = P(0.05, p, 2), dw = Math.floor((w - 3 * m) / 2);
      for (let d = 0; d < 2; d++) {
        const x0 = m + d * (dw + m), y0 = m, hh = h - 2 * m - P(0.08, p);
        px(x0, y0, dw, hh, tone(c, -0.38));
        // (the rifles behind the mesh: dark verticals with the stock's lighter band)
        if (!look.empty) for (let i = x0 + 2; i < x0 + dw - 1; i += Math.max(3, Math.round(3 * U(p)))) { px(i, y0 + 3, 2, hh - 5, 0x31292a); px(i, y0 + hh - P(0.3, p), 2, P(0.28, p), 0x695745); px(i, y0 + 3, 1, 1, 0x7c736b); }
        for (let j = y0; j < y0 + hh; j++) for (let i = x0; i < x0 + dw; i++) if ((i % 3 === 0) || (j % 3 === 0)) px(i, j, 1, 1, tone(c, -0.12));
        bevel(px, x0, y0, dw, hh, c, 1.3);
        handleV(px, d ? x0 + 1 : x0 + dw - 2, y0 + Math.floor(hh / 2), P(0.1, p, 2));
      }
      padlock(px, Math.floor(w / 2) - 1, Math.floor(h / 2), U(p));
      const f = fontFor(p), s = 'ARMS'; if (f.width(s) < w - 4) f.stencil(px, Math.floor((w - f.width(s)) / 2), P(0.1, p), s, 0xd0ac5e);
      grimeFoot(px, 0, 0, w, h, c, { ppm: p, seed: 4 });
    }), top: 0x6e7582, sides: 0x3e424d } });
    return;
  }
  // upright: a base with butt slots, a back rail, rifles standing, a locking bar across them
  const n = look.n ?? Math.max(4, Math.floor((W - 0.1) / 0.11)), fc = 0x3e424d;
  k.comp();
  k.box({ x: 0, z: 0, w: W, d: D, h: 0.12, faces: { front: tex('rackbase', (px, w, h, p) => { paintedSteel(px, 0, 0, w, h, { c: fc, ppm: p, seed: 5 }); for (let x = P(0.05, p); x < w; x += Math.max(2, Math.round(0.11 * p))) px(x, 1, Math.max(1, Math.round(0.06 * p)), h - 2, tone(fc, -0.25)); }), top: tex('rackbasetop', (px, w, h, p) => { px(0, 0, w, h, fc); for (let x = P(0.05, p); x < w; x += Math.max(2, Math.round(0.11 * p))) px(x, 1, Math.max(1, Math.round(0.06 * p)), h - 2, C.ink); }), sides: fc } });
  k.box({ x: 0, z: -D / 2 + 0.03, y: 0.12, w: W, d: 0.05, h: 1.1, faces: { front: tex('rackback', (px, w, h, p) => { paintedSteel(px, 0, 0, w, h, { c: tone(fc, 0.05), ppm: p, seed: 6 }); }), sides: fc, top: fc } });
  for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.03), z: 0, y: 0.12, w: 0.05, d: D - 0.04, h: 1.15, faces: { sides: fc, front: fc } });
  if (!look.empty) for (let i = 0; i < n; i++) {
    if (hash3(seed, i) % 9 === 0) continue;
    k.comp();
    k.box({ x: -W / 2 + 0.08 + i * ((W - 0.16) / Math.max(1, n - 1)), z: 0, y: 0.06, w: 0.06, d: 0.22, h: 1.0, faces: { front: rifleFront, top: 0x31292a, right: rifleSide, left: rifleSide, back: rifleFront } });
  }
  k.comp();
  k.box({ x: 0, z: D / 2 - 0.08, y: 0.85, w: W - 0.02, d: 0.04, h: 0.05, faces: { sides: C.steel, front: railFace(C.steel), top: tone(C.steel, 0.05) } });
  k.box({ x: W / 2 - 0.1, z: D / 2 - 0.05, y: 0.76, w: 0.06, d: 0.03, h: 0.09, faces: { sides: 0xb08b54, front: tex('lockbody', (px, w, h) => { px(0, 0, w, h, 0xb08b54); px(0, 0, w, 1, tone(0xb08b54, 0.08)); px(Math.floor(w / 2), Math.floor(h / 2), 1, 1, C.ink); }) } });
}

// ---------- desks, chairs, tables ----------

const deskTop = (make, look, seed) => tex(`desktop:${make}:${look}:${seed % 3}`, (px, w, h, ppm) => {
  const c = make === 'wood' ? C.woodL : make === 'field' ? 0x737949 : 0xa5b5b6;
  if (make === 'wood') { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(i, j, 1, 1, tone(c, Math.sin(i * 0.4 + Math.sin(j * 0.7)) > 0.8 ? -0.03 : 0)); }
  else paintedSteel(px, 0, 0, w, h, { c, ppm, seed: 51, edge: false });
  bevel(px, 0, 0, w, h, c, 0.7);
  px(0, h - 1, w, 1, tone(c, 0.05));
  const bw = P(0.45, ppm, 6), bh = P(0.32, ppm, 4);
  if (make !== 'field') { px(Math.floor(w * 0.3), Math.floor(h * 0.35), bw, bh, 0x264c35); px(Math.floor(w * 0.3), Math.floor(h * 0.35), bw, 1, tone(0x264c35, 0.08)); }   // (the blotter)
  const pw = P(0.21, ppm, 4), ph = P(0.28, ppm, 5);
  px(Math.floor(w * 0.34), Math.floor(h * 0.4), pw, ph, C.paper); for (let j = 2; j < ph - 1; j += 2) px(Math.floor(w * 0.34) + 1, Math.floor(h * 0.4) + j, pw - 2 - (j % 4 === 0 ? 2 : 0), 1, 0x87959d);
  px(Math.floor(w * 0.34) + pw - 1, Math.floor(h * 0.4) + 1, 1, ph, tone(C.paper, -0.12));
  px(Math.floor(w * 0.75), Math.floor(h * 0.55), P(0.07, ppm, 2), P(0.07, ppm, 2), C.paper); px(Math.floor(w * 0.75), Math.floor(h * 0.55), P(0.07, ppm, 2), 1, 0x573a37);   // (a mug)
  if (seed % 2) { px(Math.floor(w * 0.08), Math.floor(h * 0.3), P(0.2, ppm, 3), P(0.26, ppm, 4), 0xb08b54); px(Math.floor(w * 0.08), Math.floor(h * 0.3), P(0.2, ppm, 3), 1, 0x7f4d23); }   // (a folder)
});
const deskFront = (make) => tex(`deskfront:${make}`, (px, w, h, ppm) => {
  if (make === 'field') { px(0, 0, w, P(0.04, ppm, 1), 0x737949); px(0, P(0.04, ppm, 1), w, 1, tone(0x737949, -0.2)); return; }
  const c = make === 'wood' ? C.wood : 0x87959d, top = P(0.04, ppm, 1);
  px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c);
  px(0, 0, w, top, tone(c, 0.08));
  const pw = Math.floor(w * 0.36), dh = Math.floor((h - top - 2) / 3);
  for (let i = 0; i < 3; i++) { const y = top + 1 + i * (dh + 1); bevel(px, w - pw, y, pw - 1, dh, c); handleH(px, w - pw + Math.floor(pw / 2) - 2, y + Math.floor(dh / 2), P(0.08, ppm, 2)); }
  px(1, top + 1, w - pw - 2, h - top - 1, tone(c, -0.36));      // (the kneehole in shadow)
  grimeFoot(px, 0, 0, w, h, c, { ppm, upM: 0.15, seed: 2 });
});
/** A terminal: a monitor standing at the back of a desk, its screen to the front (glow class SCREEN). */
export function terminal(k, x, z, y, { w = 0.48, h = 0.32, kind = 'text', seed = 1 } = {}) {
  k.comp();
  k.box({ x, z: z + 0.02, y, w: 0.16, d: 0.12, h: 0.02, faces: { sides: C.black } });
  k.box({ x, z: z - 0.01, y: y + 0.02, w: 0.04, d: 0.04, h: 0.08, faces: { sides: C.black } });
  k.box({ x, z, y: y + 0.08, w, d: 0.04, h, faces: { front: tex(`monitor:${kind}:${seed % 3}`, (px, ww, hh) => screenFace(px, 0, 0, ww, hh, { kind, seed })), back: tex('monitorback', (px, ww, hh) => { px(0, 0, ww, hh, 0x3e424d); px(1, 1, ww - 2, 1, C.black); }), sides: C.black, top: C.black } });
}
export function desk(k, o) {
  const { W, D, r, seed } = o, make = o.make ?? 'steel', look = o.look ?? {};
  k.comp();
  if (make === 'field') {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box({ x: sx * (W / 2 - 0.04), z: sz * (D / 2 - 0.04), w: 0.03, d: 0.03, h: 0.72, faces: { sides: 0x49403e } });
    k.box({ x: 0, z: 0, y: 0.72, w: W, d: D, h: 0.04, faces: { top: deskTop(make, 0, seed), front: deskFront(make), sides: 0x4c633d } });
  } else {
    k.box({ x: 0, z: 0, w: W, d: D, h: 0.72, faces: { front: deskFront(make), top: make === 'wood' ? C.wood : 0x87959d, sides: make === 'wood' ? C.woodD : 0x6e7582, back: make === 'wood' ? C.wood : 0x6e7582 } });
    k.box({ x: 0, z: 0, y: 0.72, w: W + 0.02, d: D + 0.02, h: 0.04, faces: { top: deskTop(make, 0, seed), front: railFace(make === 'wood' ? C.woodL : 0xa5b5b6), sides: make === 'wood' ? C.wood : 0x87959d } });
  }
  if (look.screen ?? r() < 0.7) terminal(k, -W * 0.2, -D / 2 + 0.12, 0.76, { seed });
}
export function chair(k, o) {
  const make = o.make ?? 'folding', c = make === 'office' ? 0x31292a : make === 'steel' ? 0x4c633d : 0x565b67;
  k.comp();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box({ x: sx * 0.19, z: sz * 0.18, w: 0.03, d: 0.03, h: 0.44, faces: { sides: tone(c, -0.1) } });
  const seat = make === 'office' ? 0x3e424d : c;
  k.box({ x: 0, z: 0.01, y: 0.44, w: 0.44, d: 0.42, h: 0.04, faces: { top: tex(`seat:${seat}`, (px, w, h, p) => { px(0, 0, w, h, seat); bevel(px, 0, 0, w, h, seat, 1.2); if (make === 'office') cloth(px, 1, 1, w - 2, h - 2, seat, { u: U(p) }); }), front: railFace(seat), sides: seat } });
  k.box({ x: 0, z: -0.2, y: 0.48, w: 0.42, d: 0.04, h: make === 'office' ? 0.42 : 0.34, faces: { front: tex(`chairback:${make}`, (px, w, h, p) => { px(0, 0, w, h, seat); bevel(px, 0, 0, w, h, seat, 1.2); if (make === 'folding') px(1, Math.floor(h * 0.6), w - 2, h - Math.floor(h * 0.6) - 1, tone(c, -0.38)); }), back: seat, sides: seat, top: tone(seat, 0.06) } });
}
export function stool(k, o) {
  const make = o.make ?? 'round', c = 0x565b67, top = make === 'round' ? 0x31292a : 0x8c6d59;
  k.comp();
  k.box({ x: 0, z: 0, w: 0.05, d: 0.05, h: 0.42, faces: { sides: c } });
  k.box({ x: 0, z: 0, w: 0.3, d: 0.3, h: 0.02, faces: { sides: c } });
  k.box({ x: 0, z: 0, y: 0.42, w: 0.34, d: 0.34, h: 0.05, faces: { top: tex(`stooltop:${make}`, (px, w, h, p) => { px(0, 0, w, h, top); if (make === 'round') { px(0, 0, w, h, null); oval(px, w / 2, h / 2, w / 2, h / 2, top); oval(px, w / 2 - 1, h / 2 - 1, w / 3, h / 3, tone(top, 0.05)); } else bevel(px, 0, 0, w, h, top); }), front: railFace(top), sides: top } });
}
export function studyTable(k, o) {
  const { W, D, seed } = o, steel = o.make === 'steel';
  k.comp();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box({ x: sx * (W / 2 - 0.05), z: sz * (D / 2 - 0.05), w: 0.04, d: 0.04, h: 0.72, faces: { sides: 0x49403e } });
  k.box({ x: 0, z: 0, y: 0.72, w: W, d: D, h: 0.04, faces: { top: tex(`study:${seed % 3}:${steel}`, (px, w, h, ppm) => {
    const c = steel ? 0xa5b5b6 : 0xa78c77;
    if (steel) paintedSteel(px, 0, 0, w, h, { c, ppm, seed: 8, edge: false }); else for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(i, j, 1, 1, tone(c, Math.sin(i * 0.33 + Math.sin(j * 0.5) * 2) > 0.85 ? -0.03 : 0));
    bevel(px, 0, 0, w, h, c, 0.6);
    // (a manual open, a notebook, a pen, a mug)
    const bw = P(0.32, ppm, 6), bh = P(0.22, ppm, 4), bx = Math.floor(w * 0.15), by = Math.floor(h * 0.3);
    px(bx, by, bw, bh, C.paper); px(bx + Math.floor(bw / 2), by, 1, bh, tone(C.paper, -0.15)); for (let j = 2; j < bh - 1; j += 2) { px(bx + 1, by + j, Math.floor(bw / 2) - 2, 1, 0x87959d); px(bx + Math.floor(bw / 2) + 2, by + j, Math.floor(bw / 2) - 3, 1, 0x87959d); }
    px(Math.floor(w * 0.6), Math.floor(h * 0.45), P(0.18, ppm, 3), P(0.24, ppm, 4), 0x3c5d84); px(Math.floor(w * 0.6), Math.floor(h * 0.45), P(0.18, ppm, 3), 1, tone(0x3c5d84, 0.1));
    px(Math.floor(w * 0.82), Math.floor(h * 0.3), P(0.07, ppm, 2), P(0.07, ppm, 2), C.paper); px(Math.floor(w * 0.82), Math.floor(h * 0.3), P(0.07, ppm, 2), 1, 0x573a37);
  }), front: railFace(steel ? 0xa5b5b6 : 0xa78c77), sides: steel ? 0x87959d : 0x8c6d59 } });
}

// ---------- the duty desk ----------

const logbook = tex('logbook', (px, w, h, ppm) => {
  // (the duty logbook open: green cloth covers, two ruled pages, entries in a hand, a pen across it)
  px(0, 0, w, h, 0x264c35);
  const m = Math.max(1, Math.round(U(ppm)));
  px(m, m, w - 2 * m, h - 2 * m, C.paper); px(Math.floor(w / 2), m, 1, h - 2 * m, tone(C.paper, -0.18));
  for (let j = m + 2; j < h - m - 1; j += 2) { px(m + 1, j, Math.floor(w / 2) - m - 2, 1, 0xa5b5b6); px(Math.floor(w / 2) + 2, j, Math.floor(w / 2) - m - 3, 1, 0xa5b5b6); }
  for (let j = m + 2; j < h - m - 3; j += 2) px(m + 1, j, Math.max(1, Math.floor(w / 2) - m - 3 - (hash3(j, 1) % 4)), 1, 0x3c5d84);
  px(Math.floor(w * 0.6), Math.floor(h * 0.7), Math.floor(w * 0.35), 1, C.ink);
});
export function dutyDesk(k, o) {
  const { W, D, ppm, r, seed } = o, make = o.make ?? 'counter', look = o.look ?? {};
  const wood = 0x573a37, fc = make === 'counter' ? wood : 0x87959d;
  k.comp();
  if (make === 'podium') {
    k.box({ x: 0, z: 0, w: 0.6, d: 0.5, h: 1.05, faces: { front: tex('podium', (px, w, h, p) => { px(0, 0, w, h, wood); bevel(px, 0, 0, w, h, wood); sunk(px, P(0.05, p), P(0.08, p), w - 2 * P(0.05, p), h - P(0.2, p), tone(wood, -0.03)); }), top: logbook, sides: tone(wood, -0.05) } });
    return;
  }
  // (the counter: a front 1.05 m high with the company's plate; behind it the desk at 0.76 with the log, a phone, a terminal, a lamp)
  if (make === 'counter') {
    k.box({ x: 0, z: D / 2 - 0.08, w: W, d: 0.16, h: 1.05, faces: { front: tex(`dutyfront:${W.toFixed(2)}`, (px, w, h, p) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(i, j, 1, 1, tone(wood, Math.sin(i * 0.25 + Math.sin(j * 0.4)) > 0.85 ? -0.025 : 0));
      bevel(px, 0, 0, w, h, wood);
      px(0, 0, w, P(0.05, p, 2), tone(wood, 0.08));
      const f = fontFor(p), t = f.width('ECHO COMPANY') < w - 8 ? 'ECHO COMPANY' : 'ECHO', s = '2ND BN 4TH MARINES';
      const pw = Math.min(w - 4, f.width(t) + 6), ph = f.h * (f.width(s) < pw - 4 ? 2 : 1) + 5, x0 = Math.floor((w - pw) / 2), y0 = P(0.25, p);
      px(x0 - 1, y0 - 1, pw + 2, ph + 2, C.ink); px(x0, y0, pw, ph, 0x8f3f31); px(x0, y0, pw, 1, 0xac5b33);
      f.text(px, x0 + Math.floor((pw - f.width(t)) / 2), y0 + 2, t, 0xe7b84a);
      if (f.width(s) < pw - 4) f.text(px, x0 + Math.floor((pw - f.width(s)) / 2), y0 + 3 + f.h, s, C.paper);
      px(0, h - P(0.1, p), w, P(0.1, p), tone(wood, -0.3));
      scuffs(px, 0, 0, w, h - P(0.1, p), wood, { ppm: p, seed: 4, k: 1.5 });
    }), top: tex('dutyledge', (px, w, h, p) => { px(0, 0, w, h, 0xa78c77); bevel(px, 0, 0, w, h, 0xa78c77); }), back: wood, sides: tone(wood, -0.05) } });
    for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.04), z: 0, w: 0.08, d: D - 0.2, h: 1.05, faces: { sides: tone(wood, -0.05), top: 0xa78c77 } });
  }
  const dz = make === 'counter' ? -0.12 : 0;
  k.comp();
  k.box({ x: 0, z: dz, y: 0.72, w: W - 0.2, d: D - 0.32, h: 0.04, faces: { top: tex(`dutytop:${seed % 2}`, (px, w, h, p) => { paintedSteel(px, 0, 0, w, h, { c: 0xa5b5b6, ppm: p, seed: 9, edge: false }); bevel(px, 0, 0, w, h, 0xa5b5b6, 0.6); px(Math.floor(w * 0.7), Math.floor(h * 0.25), P(0.18, p, 3), P(0.1, p, 2), C.black); px(Math.floor(w * 0.7) + 1, Math.floor(h * 0.25) + 1, P(0.1, p, 2), 1, 0x86bdbc, 7); }), front: railFace(0xa5b5b6), sides: 0x87959d } });
  if (make === 'desk') k.box({ x: 0, z: dz, w: W - 0.2, d: D - 0.32, h: 0.72, faces: { front: deskFront('steel'), top: fc, sides: 0x6e7582 } });
  k.comp();
  k.box({ x: -W * 0.12, z: dz + 0.02, y: 0.76, w: 0.46, d: 0.32, h: 0.025, faces: { top: logbook, front: railFace(0x264c35), sides: 0x264c35 } });
  terminal(k, W * 0.22, dz - (D - 0.32) / 2 + 0.1, 0.76, { kind: 'status', seed });
  if (look.lamp ?? true) {
    k.comp();
    k.box({ x: -W / 2 + 0.25, z: dz - 0.1, y: 0.76, w: 0.12, d: 0.12, h: 0.02, faces: { sides: C.black } });
    k.box({ x: -W / 2 + 0.25, z: dz - 0.1, y: 0.78, w: 0.03, d: 0.03, h: 0.3, faces: { sides: C.black } });
    k.box({ x: -W / 2 + 0.25, z: dz - 0.04, y: 1.04, w: 0.16, d: 0.12, h: 0.08, faces: { front: tex('desklamp', (px, w, h) => { px(0, 0, w, h, 0x264c35); px(0, h - 1, w, 1, C.glow, 2); }), top: 0x264c35, sides: 0x264c35, bottom: tex('desklampin', (px, w, h) => px(0, 0, w, h, C.glow, 2)) } });
    k.lamp({ x: -W / 2 + 0.3, z: dz + 0.25, y: 1.0, r: 1.1, core: 0.5, ring: 0.18, kind: 'desk', color: 0xffd9a0 });
  }

}
