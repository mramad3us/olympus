// OLYMPUS art: the kit of the mess hall and a ship's galley. Mess tables, the serving line, the galley's units.
//
// PLACES §4.5 sets Base Melas's mess hall: two serving lines along the galley wall (a tray start,
// utensils, six serving segments, drinks; servers behind, customers sliding trays along the front),
// 240 seats at 30 eight-seat tables, the galley behind with its ranges, kettles and prep tables. A ship's
// mess (PLACES §5.3 deck 4) is the same in steel, its tables and stools bolted down.
//
// The serving line is a run of segments, each a stainless counter with its wells and a sneeze guard
// over them (two posts and a shelf; its heat lamps glow, glow class LAMP), and the tray slide along
// the customer's side: what the camera sees from 45° is the pans of food in the wells (painted on the
// counter's top), the guard's shelf over them, the slide's three tubes. Steam rises from the hot
// wells (the scene asks src/render/weather.js for a puff over each: VIEWS §2.8 "steam: showers,
// galleys, laundries").
//
// Makes and looks:
//   messTable    make 'bench' (two benches), 'stools' (eight swing-out stools), 'ship' (steel, a fiddle
//                rail, fixed stools); look { trays: 0..8, state: 'full' | 'half' | 'cleared' }
//   servingLine  make 'steam' (hot pans: the main, two sides, vegetables), 'cold' (salad on ice), 'start'
//                (the tray stack, utensil bins, cups); w: its length
//   galleyUnit   make 'range' (six burners, two oven doors), 'kettle' (a steam kettle on its stand),
//                'prep' (a stainless table, a board, knives, bowls)
//   tableSmall   make 'folding' | 'steel'
// Pure.
import { tex } from './kit.js';
import { C, U, P, bevel, oval, glass, statusLamp, tone, hash3 } from './common.js';
import { paintedSteel, grimeFoot, scuffs } from '../materials/index.js';
import { fontFor } from './type.js';

const rail = (c) => tex(`messrail:${c}`, (px, w, h) => { px(0, 0, w, h, c); px(0, 0, w, 1, tone(c, 0.08)); if (h > 2) px(0, h - 1, w, 1, tone(c, -0.12)); });
const stainlessFace = (key, draw = null) => tex(`stainless:${key}`, (px, w, h, ppm) => {
  const c = 0xa5b5b6;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(i, j, 1, 1, tone(c, ((i * 7 + j * 3) % 23 === 0 ? 0.04 : 0) + (Math.sin(i * 0.15 + j * 0.05) > 0.9 ? 0.02 : 0)));
  bevel(px, 0, 0, w, h, c, 1.1);
  if (draw) draw(px, w, h, ppm, c);
});

// ---------- trays and food ----------

const FOOD = { meat: 0x7f4d23, mash: 0xe1cdb8, beans: 0x946c2e, greens: 0x538252, carrot: 0xc67e51, rice: 0xd9d1b7, sauce: 0x91384a, bread: 0xb08b54, egg: 0xe9cd9e, fruit: 0xb45150 };
/** A tray at (x, y), w × h px, its compartments full, half eaten or cleared. */
export function tray(px, x, y, w, h, state = 'full', seed = 1) {
  const c = 0x7c736b;
  px(x, y, w, h, c); px(x, y, w, 1, tone(c, 0.08)); px(x, y + h - 1, w, 1, tone(c, -0.12));
  const cells = [[0.06, 0.12, 0.5, 0.8], [0.6, 0.12, 0.34, 0.36], [0.6, 0.54, 0.34, 0.38]];
  const what = [['meat', 'mash'], ['greens', 'carrot', 'beans'], ['bread', 'fruit', 'rice']];
  cells.forEach(([a, b, cw, ch], k) => {
    const X = x + Math.round(a * w), Y = y + Math.round(b * h), W = Math.max(1, Math.round(cw * w)), H = Math.max(1, Math.round(ch * h));
    px(X, Y, W, H, tone(c, -0.08));
    if (state === 'cleared') { if (hash3(seed, k) % 3 === 0) px(X + 1, Y + 1, 1, 1, FOOD.sauce); return; }
    const list = what[k], f1 = FOOD[list[hash3(seed, k) % list.length]], f2 = FOOD[list[(hash3(seed, k) + 1) % list.length]];
    const fill = state === 'half' ? 0.5 : 1;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      if (state === 'half' && (i + j * 2) % 5 > 2) continue;
      const fc = k === 0 && i > W * 0.55 ? f2 : f1;
      if (j < H * fill || state !== 'half') px(X + i, Y + j, 1, 1, j === 0 ? tone(fc, 0.06) : fc);
    }
  });
}
const cup = (px, x, y, s, c = 0xd6d0c9) => { px(x, y, s, s, c); px(x, y, s, 1, tone(c, 0.06)); px(x + 1, y + 1, Math.max(1, s - 2), Math.max(1, s - 2), 0x573a37); };

// ---------- tables ----------

const tableTop = (make, trays, state, seed, w0) => tex(`messtop:${make}:${trays}:${state}:${seed % 4}:${w0}`, (px, w, h, ppm) => {
  const c = make === 'ship' ? 0xa5b5b6 : 0xc4ac97;
  if (make === 'ship') paintedSteel(px, 0, 0, w, h, { c, ppm, seed: 3, edge: false });
  else for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(i, j, 1, 1, tone(c, ((i * 13 + j * 7) % 31 === 0 ? -0.03 : 0)));
  bevel(px, 0, 0, w, h, c, 0.8);
  if (make === 'ship') { px(0, 0, w, 1, 0x7c736b); px(0, h - 1, w, 1, 0x7c736b); px(0, 0, 1, h, 0x7c736b); px(w - 1, 0, 1, h, 0x7c736b); }   // (the fiddle rail)
  // (the condiment caddy in the middle: ketchup, mustard, hot sauce, napkins)
  const cx = Math.floor(w / 2) - P(0.08, ppm, 2), cy = Math.floor(h / 2) - P(0.05, ppm, 1);
  px(cx, cy, P(0.16, ppm, 4), P(0.1, ppm, 3), 0x565b67);
  [0xb45150, 0xd0ac5e, 0x7f4d23].forEach((bc, i) => px(cx + 1 + i * Math.max(1, Math.round(U(ppm))), cy + 1, Math.max(1, Math.round(U(ppm))), Math.max(1, P(0.06, ppm, 1)), bc));
  px(cx + P(0.12, ppm, 3), cy + 1, P(0.04, ppm, 1), P(0.08, ppm, 2), C.paper);
  // (trays at the places, each half facing its bench)
  const tw = P(0.36, ppm, 6), th = P(0.27, ppm, 4), per = 4;
  for (let t = 0; t < trays; t++) {
    const side = t < per ? 0 : 1, slot = t % per, x = Math.round((slot + 0.5) * w / per - tw / 2), y = side ? h - th - 1 : 1;
    if (hash3(seed, t) % 5 === 0) continue;
    tray(px, x, y, tw, th, state, seed + t);
    cup(px, x + tw + 1 < w ? x + tw - 2 : x, side ? y - P(0.08, ppm, 2) : y + th + 1, P(0.07, ppm, 2));
  }
});
export function messTable(k, o) {
  const { W, D, seed } = o, make = o.make ?? 'bench', look = o.look ?? {};
  const trays = look.trays ?? 0, state = look.state ?? 'full', tw = 0.8, legC = make === 'ship' ? 0x7c736b : 0x49403e;
  k.comp();
  for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.25), z: 0, w: 0.06, d: tw - 0.2, h: 0.72, faces: { sides: legC, front: legC } });
  k.box({ x: 0, z: 0, y: 0.1, w: W - 0.6, d: 0.05, h: 0.05, faces: { sides: legC } });
  k.box({ x: 0, z: 0, y: 0.72, w: W, d: tw, h: 0.04, faces: { top: tableTop(make, trays, state, seed, Math.round(W * 10)), front: rail(make === 'ship' ? 0x7c736b : 0x9c917a), sides: make === 'ship' ? 0x87959d : 0x9c917a } });
  if (make === 'bench') {
    for (const sz of [-1, 1]) {
      k.comp();
      k.box({ x: 0, z: sz * (tw / 2 + 0.22), y: 0.42, w: W - 0.1, d: 0.3, h: 0.04, faces: { top: tex(`benchtop:${make}`, (px, w, h, p) => { const c = 0x9c917a; px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c); for (let x = 0; x < w; x += P(0.6, p, 8)) px(x, 0, 1, h, tone(c, -0.08)); scuffs(px, 0, 0, w, h, c, { ppm: p, seed: 3, lowM: 0.3 }); }), front: rail(0x9c917a), sides: 0x7f735a } });
      for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.3), z: sz * (tw / 2 + 0.22), w: 0.05, d: 0.2, h: 0.42, faces: { sides: legC } });
    }
  } else {
    // (stools on swing-out arms from the frame, four a side: a ship's are bolted to the deck)
    for (const sz of [-1, 1]) for (let i = 0; i < 4; i++) {
      k.comp();
      const x = -W / 2 + (i + 0.5) * W / 4, z = sz * (tw / 2 + 0.24);
      k.box({ x, z, w: 0.05, d: 0.05, h: 0.44, faces: { sides: legC } });
      k.box({ x, z, y: 0.44, w: 0.32, d: 0.32, h: 0.04, faces: { top: tex(`messstool:${make}`, (px, w, h, p) => { px(0, 0, w, h, null); oval(px, w / 2, h / 2, w / 2, h / 2, make === 'ship' ? 0x4d5a7b : 0x8f3f31); oval(px, w / 2 - 1, h / 2 - 1, w / 3, h / 3, tone(make === 'ship' ? 0x4d5a7b : 0x8f3f31, 0.06)); }), front: rail(make === 'ship' ? 0x4d5a7b : 0x8f3f31), sides: make === 'ship' ? 0x4d5a7b : 0x8f3f31 } });
      if (make !== 'ship') k.box({ x, z: sz * (tw / 2 + 0.06), y: 0.1, w: 0.04, d: 0.36, h: 0.04, faces: { sides: legC } });
    }
  }
}
export function tableSmall(k, o) {
  const { W, D, seed } = o, make = o.make ?? 'folding', c = make === 'steel' ? 0xa5b5b6 : 0xc4ac97;
  k.comp();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box({ x: sx * (W / 2 - 0.05), z: sz * (D / 2 - 0.05), w: 0.035, d: 0.035, h: 0.72, faces: { sides: 0x49403e } });
  k.box({ x: 0, z: 0, y: 0.72, w: W, d: D, h: 0.04, faces: { top: tex(`smalltable:${make}:${seed % 2}`, (px, w, h, p) => { px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c, 0.8); if (seed % 2) { px(Math.floor(w * 0.6), Math.floor(h * 0.4), P(0.25, p, 4), P(0.32, p, 5), C.paper); px(Math.floor(w * 0.6), Math.floor(h * 0.4), P(0.25, p, 4), 1, 0x8f3f31); } }), front: rail(c), sides: tone(c, -0.1) } });
}

// ---------- the serving line ----------

const PANS = { steam: [['meat', 'sauce'], ['mash'], ['beans', 'greens'], ['rice'], ['carrot', 'greens'], ['egg']], cold: [['greens'], ['fruit'], ['carrot'], ['egg'], ['greens', 'fruit'], ['bread']] };
const counterTop = (make, n, seed) => tex(`servetop:${make}:${n}:${seed % 3}`, (px, w, h, ppm) => {
  const c = 0xa5b5b6;
  px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c, 0.8);
  if (make === 'start') {
    // (the tray stack, two utensil bins, a cup dispenser, napkins)
    const tw = P(0.4, ppm, 6), th = P(0.3, ppm, 4);
    for (let i = 0; i < 4; i++) { px(P(0.08, ppm) + i, P(0.1, ppm) - i, tw, th, tone(0x7c736b, i * 0.02)); px(P(0.08, ppm) + i, P(0.1, ppm) - i, tw, 1, tone(0x7c736b, 0.08 + i * 0.02)); }
    for (let b = 0; b < 3; b++) { const x = Math.floor(w * 0.45) + b * P(0.2, ppm, 3); px(x, P(0.1, ppm), P(0.16, ppm, 3), P(0.24, ppm, 4), 0x565b67); for (let j = 0; j < 3; j++) px(x + 1 + j * Math.max(1, Math.round(U(ppm))), P(0.12, ppm), 1, P(0.18, ppm, 3), C.steel); }
    for (let i = 0; i < 6; i++) oval(px, w * 0.82 + (i % 3) * P(0.08, ppm, 2), h * 0.3 + Math.floor(i / 3) * P(0.08, ppm, 2), P(0.03, ppm, 1), P(0.03, ppm, 1), C.paper);
    return;
  }
  // (the wells: n pans of food in a row, each a hotel pan with its rim, a serving spoon in some)
  const list = PANS[make] ?? PANS.steam, m = P(0.05, ppm, 1), pw = Math.floor((w - m) / n) - m, ph = h - 2 * m - P(0.12, ppm, 2);
  for (let i = 0; i < n; i++) {
    const x = m + i * (pw + m), y = m;
    px(x, y, pw, ph, 0x7c736b); px(x, y, pw, 1, tone(0x7c736b, -0.1));
    const foods = list[(i + seed) % list.length];
    for (let j = 1; j < ph - 1; j++) for (let ii = 1; ii < pw - 1; ii++) {
      const fc = FOOD[foods[(ii * 3 + j) % 7 < 4 ? 0 : foods.length - 1]];
      px(x + ii, y + j, 1, 1, tone(fc, (hash3(ii, j, i + seed) % 5 === 0 ? 0.05 : 0) - (j === 1 ? 0.05 : 0) + (make === 'cold' && (ii + j) % 4 === 0 ? 0.04 : 0)));
    }
    if (make === 'cold') for (let ii = 0; ii < pw; ii += 2) px(x + ii, y + ph - 1, 1, 1, 0xc7d5d0);
    if (hash3(seed, i) % 2) { px(x + Math.floor(pw * 0.6), y + 1, 1, Math.floor(ph * 0.7), C.steel); px(x + Math.floor(pw * 0.6) - 1, y + Math.floor(ph * 0.7), 3, 2, C.steel); }
  }
  px(0, h - P(0.1, ppm, 2), w, 1, tone(c, -0.15));
});
const counterFront = (make) => stainlessFace(`servefront:${make}`, (px, w, h, ppm) => {
  const f = fontFor(ppm), s = make === 'start' ? 'TRAYS' : make === 'cold' ? 'SALAD' : 'HOT LINE';
  for (let x = P(0.6, ppm); x < w; x += P(0.6, ppm)) px(x, 2, 1, h - P(0.12, ppm) - 2, tone(0xa5b5b6, -0.12));
  if (f.width(s) < w - 6) f.text(px, P(0.1, ppm), P(0.12, ppm), s, 0x565b67);
  px(0, h - P(0.12, ppm), w, P(0.12, ppm), 0x49403e);
  grimeFoot(px, 0, 0, w, h - P(0.12, ppm), 0xa5b5b6, { ppm, upM: 0.2, seed: 7 });
});
export function servingLine(k, o) {
  const { W, ppm, seed } = o, make = o.make ?? 'steam';
  const cd = 0.75, cz = -0.2, n = Math.max(2, Math.round(W / 0.55));
  k.comp();
  k.box({ x: 0, z: cz, w: W, d: cd, h: 0.9, faces: { front: counterFront(make), top: counterTop(make, n, seed), back: stainlessFace('serveback'), sides: 0x87959d } });
  if (make !== 'start') {
    // (the sneeze guard: posts, a shelf with heat lamps under it, a glass panel leaning toward the customer)
    k.comp();
    for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.04), z: cz + 0.05, y: 0.9, w: 0.04, d: 0.04, h: 0.55, faces: { sides: C.steel, front: rail(C.steel) } });
    // (the guard's glass is seen through: only its steel edges, the heat lamps' housing at the back and a glint are drawn; the food shows)
    k.box({ x: 0, z: cz - 0.1, y: 1.42, w: W, d: 0.18, h: 0.05, faces: { top: tex('guardhousing', (px, w, h, p) => { px(0, 0, w, h, 0x87959d); px(0, h - 1, w, 1, C.steel); for (let x = P(0.15, p); x < w - 2; x += P(0.55, p, 6)) px(x, 1, P(0.3, p, 4), Math.max(1, h - 3), 0x49403e); }), front: rail(C.steel), bottom: tex('heatlamps', (px, w, h, p) => { px(0, 0, w, h, 0x49403e); for (let x = P(0.15, p); x < w - 2; x += P(0.55, p, 6)) px(x, 1, P(0.3, p, 4), Math.max(1, h - 2), 0xff8a3a, 2); }), sides: C.steel } });
    k.box({ x: 0, z: cz + 0.1, y: 1.42, w: W, d: 0.2, h: 0.02, faces: { top: tex('guardglass-top', (px, w, h) => { px(0, 0, w, h, null); px(0, h - 1, w, 1, C.steel); for (let i = 0; i < Math.min(w, h * 3); i += 2) px(Math.floor(w * 0.15) + i, h - 2 - Math.floor(i / 3), 1, 1, 0xc7d5d0); }), front: rail(C.steel), sides: C.steel } });
    if (make === 'steam') for (let i = 0; i < Math.min(3, n); i++) k.lamp({ x: -W / 2 + (i + 0.5) * W / Math.min(3, n), z: cz, y: 1.4, r: 0.45, core: 0.35, ring: 0.1, kind: 'ceiling', color: 0xffa060 });
  }
  // (the tray slide: three tubes on brackets along the customer's side)
  k.comp();
  for (let x = -W / 2 + 0.15; x < W / 2; x += 0.6) k.box({ x, z: cz + cd / 2 + 0.12, y: 0.55, w: 0.03, d: 0.24, h: 0.3, faces: { sides: C.steelD } });
  k.box({ x: 0, z: cz + cd / 2 + 0.14, y: 0.84, w: W, d: 0.26, h: 0.03, faces: { top: tex('trayslide', (px, w, h) => { px(0, 0, w, h, null); for (let j = 0; j < h; j += Math.max(2, Math.floor(h / 3))) { px(0, j, w, 1, C.steel); if (j + 1 < h) px(0, j + 1, w, 1, tone(C.steel, -0.2)); } }), front: rail(C.steel), sides: C.steel } });
}

// ---------- the galley ----------

export function galleyUnit(k, o) {
  const { W, D, ppm, seed } = o, make = o.make ?? 'range';
  k.comp();
  if (make === 'kettle') {
    k.box({ x: 0, z: 0, w: 0.3, d: 0.3, h: 0.5, faces: { sides: 0x87959d, front: stainlessFace('kettlestand') } });
    k.box({ x: 0, z: 0, y: 0.5, w: 0.95, d: 0.85, h: 0.5, faces: { top: tex('kettletop', (px, w, h, p) => { px(0, 0, w, h, null); oval(px, w / 2, h / 2, w / 2, h / 2, 0xa5b5b6); oval(px, w / 2, h / 2, w / 2 - P(0.05, p, 1), h / 2 - P(0.05, p, 1), 0x7c736b); oval(px, w / 2, h / 2 + 1, w / 2 - P(0.08, p, 2), h / 2 - P(0.08, p, 2), 0xc67e51); oval(px, w * 0.4, h * 0.45, P(0.1, p, 2), P(0.06, p, 1), tone(0xc67e51, 0.08)); }), front: stainlessFace('kettlefront', (px, w, h, p) => { px(Math.floor(w / 2) - 1, h - P(0.12, p), P(0.08, p, 2), P(0.1, p, 2), C.steelDD); }), sides: 0xa5b5b6 } });
    k.box({ x: 0.55, z: 0, y: 0.6, w: 0.2, d: 0.2, h: 0.35, faces: { front: tex('kettlectl', (px, w, h, p) => { px(0, 0, w, h, 0x565b67); statusLamp(px, 2, 2, Math.max(1, Math.round(U(p))), 0x9fe0b0, 1); px(2, Math.floor(h / 2), w - 4, 1, C.steel); }), sides: 0x565b67 } });
    return;
  }
  if (make === 'prep') {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box({ x: sx * (W / 2 - 0.05), z: sz * (D / 2 - 0.05), w: 0.04, d: 0.04, h: 0.88, faces: { sides: C.steelD } });
    k.box({ x: 0, z: 0, y: 0.25, w: W - 0.1, d: D - 0.1, h: 0.03, faces: { top: tex('prepshelf', (px, w, h, p) => { px(0, 0, w, h, 0x87959d); for (let i = 0; i < 4; i++) { px(Math.floor(w * (0.1 + i * 0.22)), 1, P(0.25, p, 4), h - 2, [0x7c736b, 0xa5b5b6, 0x565b67, 0x7c736b][i]); } }), sides: 0x87959d } });
    k.box({ x: 0, z: 0, y: 0.88, w: W, d: D, h: 0.04, faces: { top: tex(`preptop:${seed % 2}`, (px, w, h, p) => {
      const c = 0xa5b5b6; px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c, 0.8);
      const bw = P(0.5, p, 8), bh = P(0.32, p, 5), bx = Math.floor(w * 0.2), by = Math.floor(h * 0.3);
      px(bx, by, bw, bh, 0xd6d0c9); bevel(px, bx, by, bw, bh, 0xd6d0c9);
      for (let i = 0; i < 4; i++) px(bx + 2 + i * P(0.1, p, 2), by + 2, P(0.06, p, 1), P(0.04, p, 1), FOOD.carrot);
      px(bx + bw + 2, by + 1, P(0.25, p, 4), 1, C.steel); px(bx + bw + 2, by + 1, P(0.08, p, 2), 1, C.ink);   // (a knife)
      oval(px, w * 0.75, h * 0.5, P(0.14, p, 3), P(0.12, p, 2), 0xd6d0c9); oval(px, w * 0.75, h * 0.5, P(0.1, p, 2), P(0.08, p, 2), FOOD.mash);
    }), front: rail(0xa5b5b6), sides: 0xa5b5b6 } });
    return;
  }
  // range: six burners, two ovens, a back splash with its knobs
  k.box({ x: 0, z: 0, w: W, d: D, h: 0.9, faces: { front: stainlessFace('rangefront', (px, w, h, p) => {
    const m = P(0.06, p, 2), dw = Math.floor((w - 3 * m) / 2), top = P(0.16, p, 3);
    for (let i = 0; i < 6; i++) { const x = m + Math.floor(i * (w - 2 * m) / 6) + P(0.08, p, 1); px(x, P(0.05, p, 1), P(0.05, p, 2), P(0.05, p, 2), C.black); }
    for (let d = 0; d < 2; d++) { const x = m + d * (dw + m); px(x, top, dw, h - top - P(0.12, p), 0x87959d); bevel(px, x, top, dw, h - top - P(0.12, p), 0x87959d); px(x + 2, top + P(0.1, p, 2), dw - 4, P(0.25, p, 3), C.black); px(x + 3, top + P(0.12, p, 2), Math.max(1, dw - 6), 1, 0xff8a3a, 3); px(x + 2, top + 2, dw - 4, 1, C.steel); }
    px(0, h - P(0.12, p), w, P(0.12, p), C.black);
  }), top: tex(`rangetop:${seed % 2}`, (px, w, h, p) => {
    px(0, 0, w, h, 0x31292a); bevel(px, 0, 0, w, h, 0x49403e);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      const cx = (i + 0.5) * w / 3, cy = (j + 0.5) * h / 2, r = Math.min(w / 7, h / 4.5);
      oval(px, cx, cy, r, r, 0x49403e); oval(px, cx, cy, r * 0.6, r * 0.6, 0x31292a);
      if ((i + j + seed) % 3 === 0) { oval(px, cx, cy, r * 0.95, r * 0.95, 0x7c736b); oval(px, cx, cy, r * 0.75, r * 0.75, 0xa5b5b6); oval(px, cx - 1, cy - 1, r * 0.35, r * 0.3, 0xc7d5d0); }   // (a stock pot on it)
      else if ((i + j + seed) % 3 === 1) { px(Math.floor(cx - r * 0.6), Math.floor(cy), 1, 1, 0xff8a3a, 3); px(Math.floor(cx + r * 0.5), Math.floor(cy), 1, 1, 0xff8a3a, 3); }
    }
  }), sides: 0x87959d, back: 0x87959d } });
  k.box({ x: 0, z: -D / 2 + 0.04, y: 0.9, w: W, d: 0.08, h: 0.3, faces: { front: stainlessFace('rangeback', (px, w, h, p) => { for (let i = 0; i < 6; i++) { const x = Math.floor((i + 0.5) * w / 6); px(x, Math.floor(h / 2), P(0.04, p, 2), P(0.04, p, 2), C.black); } }), top: 0xa5b5b6, sides: 0x87959d } });
}
