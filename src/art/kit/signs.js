// OLYMPUS art: what hangs on the walls, and the odds of a lounge. Signs, stencils, windows, boards, sofas, machines, bins.
//
// Signs are plaques (type.js plaque(): tradecraft's enamelled plaque in the picture's own alphabet, 3 × 5
// at 16 px/m, 5 × 7 at 24) on a box a few millimetres proud of the wall, sized to their words in pixels,
// so they are outlined as objects and read at a glance: deck plaques (PLACES §5.1 "a deck plaque with its
// number and name"), room plates, safety and warning signs, the exit sign whose letters glow in a
// blackout (glow class ALWAYS: VIEWS's "exit signs in phosphor glow"), and the plaque over every exit
// (VIEWS §2.9, the user in tradecraft: "where is the door out of the flat"). A stencil is letters only:
// its face is holes but for the letters, so the wall shows between them; laid on the floor (look.floor)
// it is a floor marking ("KEEP CLEAR", a lane number, "STAND HERE").
//
// A window is a fixture in front of the north wall that looks like a deep opening in it: the reveal in
// shade, the sill lit, the glass showing the sky (painted, so it darkens with the mood's light: a pane by
// day, a dark one at night). Base Melas's windows are small and deep (PLACES §4.4: "small deep windows,
// two per bay, on the north wall"); a ship's viewport has its armoured shutter half down.
//
// Makes and looks:
//   sign      'plaque' { text, sub, style, icon } | 'stencil' { text, colour, floor } | 'exit' { arrow }
//   window    'deep' | 'port' | 'slit'; look { sky: a colour, night }
//   board     'notice' (cork, the Plan of the Day pinned) | 'white' (a whiteboard written on) | 'plan'
//   sofa      'vinyl' | 'cloth'; vending 'snack' | 'drink'; bin 'bin' | 'mop' (a bucket and mop) | 'extinguisher'
// Pure.
import { tex } from './kit.js';
import { C, U, P, oval, cloth, glass, tone, hash3, mixHex } from './common.js';
import { paintedSteel, grimeFoot } from '../materials/index.js';
import { fontFor, plaque, plaqueSize } from './type.js';
import { GLOW } from '../paint.js';

const rail = (c) => tex(`signrail:${c}`, (px, w, h) => { px(0, 0, w, h, c); px(0, 0, w, 1, tone(c, 0.08)); if (h > 2) px(0, h - 1, w, 1, tone(c, -0.12)); });

/**
 * A sign on a wall: its box sized to its plaque in pixels at the area's density. The piece's origin is
 * where its bottom edge meets the wall's face, its middle; y (the builder's) is its height.
 */
export function sign(k, o) {
  const { ppm, seed } = o, make = o.make ?? 'plaque', look = o.look ?? {};
  const text = String(look.text ?? 'MCRN').toUpperCase();
  k.comp();
  if (make === 'stencil') {
    const f = fontFor(ppm), scale = look.big ? 2 : 1, wpx = f.width(text) * scale, hpx = f.h * scale, c = look.colour ?? 0xd9d1b7;
    const face = tex(`stencil:${text}:${c}:${scale}`, (px, w, h, p) => { px(0, 0, w, h, null); const F = fontFor(p); if (scale === 1) F.stencil(px, 0, 0, text, c); else F.stencil((x, y, ww, hh, col) => px(x * 2, y * 2, ww * 2, hh * 2, col), 0, 0, text, c); });
    if (look.floor) { const wM = wpx / ppm, hM = hpx / ppm; k.ground({ x0: -wM / 2, z0: -hM / 2, x1: wM / 2, z1: hM / 2, top: face, lift: 0.004 }); return; }
    k.box({ x: 0, z: 0, w: wpx / ppm, d: 0.01, h: hpx / ppm, faces: { front: face }, only: ['front'] });
    return;
  }
  if (make === 'exit') {
    const s = 'EXIT', f = fontFor(ppm), arrow = look.arrow ?? 'right';
    const [pw, ph] = plaqueSize({ text: s, icon: arrow, ppm, pad: 2 });
    k.box({ x: 0, z: 0, w: pw / ppm, d: 0.06, h: ph / ppm, faces: { front: tex(`exit:${arrow}`, (px, w, h, p) => plaque(px, 0, 0, { text: s, icon: arrow, ppm: p, style: { face: 0x27694b, hi: 0x538252, lo: 0x003536, ink: 0x9fe0b0, glyph: 0x9fe0b0 }, glow: GLOW.ALWAYS })), top: 0x27694b, sides: 0x003536 } });
    return;
  }
  const [pw, ph] = plaqueSize({ text, sub: look.sub ?? null, icon: look.icon ?? null, ppm });
  k.box({ x: 0, z: 0, w: pw / ppm, d: 0.02, h: ph / ppm, faces: { front: tex(`plaque:${text}:${look.sub}:${look.style}:${look.icon}`, (px, w, h, p) => plaque(px, 0, 0, { text, sub: look.sub ?? null, style: look.style ?? 'deck', icon: look.icon ?? null, ppm: p })), top: C.ink, sides: C.ink } });
}

// ---------- windows ----------

const SKIES = { mars: 0xdba382, dust: 0xb28a59, night: 0x1d2b46, space: 0x14161d, dawn: 0xc4a6bf };
const windowFace = (make, sky, frame) => tex(`window:${make}:${sky}:${frame}`, (px, w, h, ppm) => {
  const s = SKIES[sky] ?? sky, u = U(ppm);
  if (make === 'port') {
    // (a ship's viewport: a heavy bolted frame, the armoured shutter half down, stars or a planet's limb through the glass)
    paintedSteel(px, 0, 0, w, h, { c: 0x3e424d, ppm, seed: 3 });
    const m = P(0.1, ppm, 2), gx = m, gy = m, gw = w - 2 * m, gh = h - 2 * m;
    px(gx, gy, gw, gh, 0x14161d);
    for (let i = 0; i < gw * gh / 40; i++) { const r = hash3(i, 9); px(gx + (r % gw), gy + ((r >>> 9) % gh), 1, 1, r % 5 ? 0x87959d : C.paper); }
    oval(px, gx + gw * 0.8, gy + gh * 1.6, gw * 0.9, gh * 1.0, 0xb45150); oval(px, gx + gw * 0.8, gy + gh * 1.6, gw * 0.88, gh * 0.97, 0x91384a);
    const sh = Math.floor(gh * 0.45); px(gx, gy, gw, sh, 0x565b67); for (let y = gy + 2; y < gy + sh; y += Math.max(2, Math.round(2 * u))) px(gx, y, gw, 1, tone(0x565b67, -0.1)); px(gx, gy + sh - 1, gw, 1, C.hazard);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; px(Math.round(w / 2 + Math.cos(a) * (w / 2 - 2)), Math.round(h / 2 + Math.sin(a) * (h / 2 - 2)), 1, 1, C.steel); }
    return;
  }
  // (a deep window in a thick wall: the reveal in shade on its top and right, the sill lit, the glass with the sky, a mullion)
  const rv = P(make === 'slit' ? 0.06 : 0.12, ppm, 2), c = frame;
  px(0, 0, w, h, tone(c, -0.18));
  px(0, 0, w, rv, tone(c, -0.3)); px(w - rv, 0, rv, h, tone(c, -0.25)); px(0, 0, rv, h, tone(c, -0.1));
  const gx = rv, gy = rv, gw = w - 2 * rv, gh = h - rv - P(0.08, ppm, 2);
  for (let j = 0; j < gh; j++) px(gx, gy + j, gw, 1, mixHex(s, tone(s, -0.12), j / gh));
  // (the far wall of the canyon, a band of it, faint)
  if (sky === 'mars' || sky === 'dust' || sky === 'dawn') for (let i = 0; i < gw; i++) { const hh = Math.round(gh * (0.35 + 0.1 * Math.sin(i * 0.3) + 0.05 * Math.sin(i * 1.1))); px(gx + i, gy + gh - hh, 1, hh, tone(s, -0.08)); }
  glass(px, gx, gy, gw, Math.floor(gh * 0.6), s);
  if (make !== 'slit') px(gx + Math.floor(gw / 2), gy, 1, gh, tone(c, -0.05));
  px(0, h - P(0.08, ppm, 2), w, P(0.08, ppm, 2), tone(c, 0.06)); px(0, h - P(0.08, ppm, 2), w, 1, tone(c, 0.1));   // (the sill)
  for (let i = 0; i < gw; i += 3) if (hash3(i, 3) % 2) px(gx + i, gy + gh - 1, 2, 1, 0xc18064);   // (dust on the outside sill)
});
export function wallWindow(k, o) {
  const { W, H } = o, make = o.make ?? 'deep', look = o.look ?? {};
  k.comp();
  const h = make === 'slit' ? 0.35 : make === 'port' ? 0.7 : H, w = make === 'port' ? 0.9 : W;
  k.box({ x: 0, z: 0, w, d: 0.04, h, faces: { front: windowFace(make, look.sky ?? (make === 'port' ? 'space' : 'mars'), look.frame ?? 0xd9d1b7), top: tone(look.frame ?? 0xd9d1b7, 0.05), sides: tone(look.frame ?? 0xd9d1b7, -0.1) } });
}

// ---------- boards ----------

const boardFace = (make, seed) => tex(`board:${make}:${seed % 3}`, (px, w, h, ppm) => {
  const f = fontFor(ppm), u = U(ppm);
  if (make === 'white') {
    px(0, 0, w, h, C.steel); px(1, 1, w - 2, h - 2, 0xe8eef6 & 0xffffff ? 0xd6d0c9 : 0xd6d0c9);
    const t = 'PT 0600'; if (f.width(t) < w - 6) f.text(px, 3, 3, t, 0x3c5d84);
    for (let j = 3 + f.h + 3; j < h - 4; j += f.h + 2) px(3, j, Math.max(2, Math.floor((w - 8) * (0.4 + (hash3(j, seed) % 5) / 10))), 1, [0x3c5d84, 0xb45150, 0x264c35][j % 3]);
    px(Math.floor(w * 0.6), Math.floor(h * 0.45), Math.floor(w * 0.3), 1, 0xb45150); px(Math.floor(w * 0.6), Math.floor(h * 0.45), 1, Math.floor(h * 0.3), 0xb45150);
    px(2, h - 2, w - 4, 1, C.steelD); px(Math.floor(w * 0.2), h - 3, P(0.08, ppm, 2), 1, 0xb45150); px(Math.floor(w * 0.3), h - 3, P(0.08, ppm, 2), 1, 0x3c5d84);
    return;
  }
  if (make === 'plan') {
    px(0, 0, w, h, C.ink); px(1, 1, w - 2, h - 2, C.paper);
    const m = Math.max(2, Math.round(3 * u));
    px(m, m, w - 2 * m, h - 2 * m - f.h - 2, 0xd6d0c9);
    for (let i = 0; i < 6; i++) { const r = hash3(i, seed); px(m + (r % (w - 3 * m)), m + ((r >>> 8) % Math.max(1, h - 3 * m - f.h)), 1, Math.max(2, (r >>> 16) % 8), 0x31292a); }
    px(m, m, w - 2 * m, 1, 0x31292a); px(m, h - m - f.h - 3, w - 2 * m, 1, 0x31292a); px(m, m, 1, h - 2 * m - f.h - 2, 0x31292a); px(w - m - 1, m, 1, h - 2 * m - f.h - 2, 0x31292a);
    oval(px, w * 0.4, h * 0.45, Math.max(1, Math.round(1.5 * u)), Math.max(1, Math.round(1.5 * u)), 0xb45150);
    const t = 'YOU ARE HERE'; if (f.width(t) < w - 4) f.text(px, Math.floor((w - f.width(t)) / 2), h - f.h - 2, t, 0xb45150);
    return;
  }
  // (a cork board: the Plan of the Day, the watch bill, a safety notice, a photograph, pins)
  px(0, 0, w, h, 0x573a37); px(1, 1, w - 2, h - 2, 0xb28a59);
  for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) if (hash3(i, j, 5) % 7 === 0) px(i, j, 1, 1, tone(0xb28a59, -0.05));
  const sheets = [[0.06, 0.08, 0.32, 0.8, C.paper], [0.42, 0.1, 0.24, 0.42, 0xe8cbae], [0.7, 0.06, 0.24, 0.36, C.paper], [0.45, 0.58, 0.2, 0.32, 0xd0ac5e], [0.72, 0.5, 0.2, 0.4, C.paper]];
  sheets.forEach(([a, b, cw, ch, c], s) => {
    const X = Math.floor(a * w), Y = Math.floor(b * h), W2 = Math.max(2, Math.floor(cw * w)), H2 = Math.max(2, Math.floor(ch * h));
    px(X + 1, Y + 1, W2, H2, tone(0xb28a59, -0.12)); px(X, Y, W2, H2, c);
    if (s === 0 && f.width('POD') < W2 - 2) { f.text(px, X + 1, Y + 1, 'POD', 0x8f3f31); for (let j = Y + f.h + 3; j < Y + H2 - 1; j += 2) px(X + 1, j, Math.max(1, W2 - 2 - (hash3(j, s) % 4)), 1, 0x565b67); }
    else for (let j = Y + 2; j < Y + H2 - 1; j += 2) px(X + 1, j, Math.max(1, W2 - 2 - (hash3(j, s + seed) % 4)), 1, 0x87959d);
    px(X + Math.floor(W2 / 2), Y, 1, 1, [0xb45150, 0x3c5d84, 0x538252][s % 3]);
  });
});
export function board(k, o) {
  const { W, H, seed } = o, make = o.make ?? 'notice';
  k.comp();
  k.box({ x: 0, z: 0, w: W, d: 0.03, h: H, faces: { front: boardFace(make, seed), top: 0x573a37, sides: 0x573a37 } });
}

// ---------- the lounge's odds ----------

export function sofa(k, o) {
  const { W, D } = o, make = o.make ?? 'vinyl', c = make === 'vinyl' ? 0x6e2341 : 0x52587a, legs = 0x31292a;
  const fab = tex(`sofafab:${c}`, (px, w, h, p) => { cloth(px, 0, 0, w, h, c, { u: U(p), k: make === 'vinyl' ? 0.6 : 1 }); px(0, 0, w, 1, tone(c, 0.07)); px(0, h - 1, w, 1, tone(c, -0.12)); if (make === 'vinyl') for (let i = 0; i < 3; i++) px(Math.floor(w * (0.2 + i * 0.3)), 1, 1, 1, tone(c, 0.15)); });
  k.comp();
  k.box({ x: 0, z: 0, y: 0.08, w: W, d: D, h: 0.3, faces: { front: fab, sides: fab, top: c } });
  k.box({ x: 0, z: -D / 2 + 0.1, y: 0.38, w: W, d: 0.2, h: 0.45, faces: { front: fab, top: tex(`sofaback:${c}`, (px, w, h) => { px(0, 0, w, h, tone(c, 0.06)); px(0, h - 1, w, 1, tone(c, 0.1)); }), sides: fab, back: fab } });
  for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.08), z: 0.05, y: 0.38, w: 0.16, d: D - 0.1, h: 0.2, faces: { front: fab, top: tone(c, 0.06), sides: fab } });
  const n = Math.max(1, Math.round((W - 0.32) / 0.6));
  for (let i = 0; i < n; i++) { k.comp(); const cw = (W - 0.32) / n; k.box({ x: -W / 2 + 0.16 + (i + 0.5) * cw, z: 0.08, y: 0.38, w: cw - 0.01, d: D - 0.3, h: 0.1, faces: { top: tex(`cushion:${c}`, (px, w, h, p) => { cloth(px, 0, 0, w, h, tone(c, 0.04), { u: U(p) }); px(0, 0, w, 2, tone(c, -0.06)); px(0, h - 1, w, 1, tone(c, 0.1)); }), front: rail(tone(c, 0.03)), sides: c } }); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box({ x: sx * (W / 2 - 0.08), z: sz * (D / 2 - 0.08), w: 0.05, d: 0.05, h: 0.08, faces: { sides: legs } });
}
export function vending(k, o) {
  const { W, D, seed } = o, make = o.make ?? 'snack', body = make === 'drink' ? 0x8f3f31 : 0x31292a;
  k.comp();
  k.box({ x: 0, z: 0, w: W, d: D, h: 1.85, faces: { front: tex(`vending:${make}:${seed % 2}`, (px, w, h, p) => {
    paintedSteel(px, 0, 0, w, h, { c: body, ppm: p, seed: 71 });
    const m = P(0.06, p, 2), gw = Math.floor(w * 0.66), gh = Math.floor(h * 0.7);
    px(m, m, gw, gh, 0x14161d);
    const rows = 5, rh = Math.floor((gh - 2) / rows);
    for (let r = 0; r < rows; r++) {
      const y = m + 1 + r * rh;
      px(m + 1, y, gw - 2, rh - 1, 0x1d2b46, GLOW.SCREEN);
      for (let x = m + 2; x < m + gw - 3; x += Math.max(3, Math.round(3 * U(p)))) { const c = [0xb45150, 0xd0ac5e, 0x3c5d84, 0x538252, 0xc67e51, C.paper][hash3(x, r, seed) % 6]; px(x, y + rh - P(0.14, p, 3) - 1, Math.max(2, Math.round(2 * U(p))), P(0.14, p, 3), c, GLOW.SCREEN); }
      px(m + 1, y + rh - 1, gw - 2, 1, C.steelD, GLOW.SCREEN);
    }
    glass(px, m, m, gw, Math.floor(gh / 3), 0x1d2b46, { dark: true });
    const cx = m + gw + m;
    px(cx, m + P(0.1, p, 2), w - cx - m, P(0.14, p, 3), C.black); px(cx + 1, m + P(0.1, p, 2) + 1, w - cx - m - 2, P(0.06, p, 1), 0x9fe0b0, GLOW.SCREEN);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) px(cx + 1 + i * Math.max(2, Math.round(2 * U(p))), m + P(0.3, p, 5) + j * Math.max(2, Math.round(2 * U(p))), 1, 1, C.steel);
    px(m, h - P(0.3, p), gw, P(0.16, p, 3), C.black);
    const f = fontFor(p), s = make === 'drink' ? 'COLD' : 'SNACKS'; if (f.width(s) < w - 4) f.text(px, Math.floor((w - f.width(s)) / 2), m + gh + 2, s, make === 'drink' ? C.paper : 0xe7b84a, GLOW.SCREEN);
    grimeFoot(px, 0, 0, w, h, body, { ppm: p, upM: 0.2, seed: 2 });
  }), top: tone(body, 0.04), sides: tone(body, -0.05) } });
}
export function bin(k, o) {
  const make = o.make ?? 'bin';
  k.comp();
  if (make === 'extinguisher') {
    k.box({ x: 0, z: 0, y: 0.6, w: 0.16, d: 0.16, h: 0.5, faces: { front: tex('extinguisher', (px, w, h, p) => { px(0, 0, w, h, 0xb45150); px(0, 0, 1, h, tone(0xb45150, 0.08)); px(w - 1, 0, 1, h, tone(0xb45150, -0.12)); px(1, Math.floor(h * 0.35), w - 2, P(0.1, p, 2), C.paper); px(Math.floor(w / 2), 0, 1, 1, C.ink); }), top: tex('exttop', (px, w, h) => { px(0, 0, w, h, null); oval(px, w / 2, h / 2, w / 2, h / 2, 0xb45150); px(Math.floor(w / 2) - 1, Math.floor(h / 2) - 1, 2, 2, C.ink); }), sides: 0x91384a } });
    k.box({ x: 0, z: -0.06, y: 1.1, w: 0.06, d: 0.06, h: 0.12, faces: { sides: C.ink } });
    return;
  }
  if (make === 'mop') {
    k.box({ x: 0, z: 0, w: 0.4, d: 0.3, h: 0.3, faces: { front: tex('mopbucket', (px, w, h) => { px(0, 0, w, h, 0xd0ac5e); px(0, 0, w, 1, tone(0xd0ac5e, 0.1)); px(0, h - 1, w, 1, tone(0xd0ac5e, -0.15)); px(Math.floor(w * 0.6), 2, Math.floor(w * 0.3), Math.floor(h / 2), 0x976d00); }), top: tex('mopwater', (px, w, h) => { px(0, 0, w, h, 0xd0ac5e); px(1, 1, Math.floor(w * 0.55), h - 2, 0x7f735a); px(Math.floor(w * 0.6), 1, w - Math.floor(w * 0.6) - 1, h - 2, 0x976d00); }), sides: 0xb38c2f } });
    k.box({ x: -0.05, z: -0.02, y: 0.1, w: 0.03, d: 0.03, h: 1.25, faces: { sides: 0x8c6d59 } });
    return;
  }
  k.box({ x: 0, z: 0, w: 0.38, d: 0.38, h: 0.6, faces: { front: tex('bin', (px, w, h, p) => { paintedSteel(px, 0, 0, w, h, { c: 0x37664f, ppm: p, seed: 5 }); for (let x = 2; x < w - 1; x += P(0.08, p, 2)) px(x, 2, 1, h - 4, tone(0x37664f, -0.08)); }), top: tex('bintop', (px, w, h, p) => { px(0, 0, w, h, 0x37664f); px(1, 1, w - 2, h - 2, C.black); px(2, 2, P(0.1, p, 2), P(0.08, p, 2), C.paper); }), sides: 0x264c35 } });
}
