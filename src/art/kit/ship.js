// OLYMPUS art: the kit of a warship's decks and a base's locks. Suits, doors, hatches, ladders, couches, fittings.
//
// PLACES §5.1 says what every deck carries ("the main trunk's hatch ... a damage-control locker ...
// handholds along every wall and round every hatch for free fall; mag strips along passageways; a
// bulkhead clock on UTC; a deck plaque with its number and name; emergency lamps every 4 m") and §1.6
// what fills an opening (a pressure door 1.0 × 2.0 m sliding, with a 0.2 × 0.3 m window; a dogged oval
// bulkhead door 0.8 × 1.8 m with six dogs; a hatch 0.8 × 0.8 m in a deck with its ladder; an airlock
// door 1.0 × 2.0 m with a window, interlocked with its pair; a vehicle door 4 × 4 m). COMBAT gives a
// hatch coaming 0.25 m and a crash couch 1.0 m (cover heights); longhaul's room cameras show how a
// deck reads from above (docs/research/shots/longhaul-roomcam-*.png: couches in padding blue, a floor
// hatch framed in hazard stripes with its ladder going down, railings round it).
//
// Doors stand against the north wall as fixtures: a frame box in front of the wall whose face is the
// door, closed (an open door is the sim's later work: a gap in the plan and a leaf drawn aside). A
// hatch is a coaming on the deck whose top is painted: shut (its lid, dogs and wheel) or open (the
// shaft's dark falling away, the rungs of its ladder smaller and darker each one down, the lid standing
// on its hinge). Status lights glow by class (src/art/paint.js GLOW): green ALWAYS (a lock ready), red
// ALWAYS (vacuum beyond), amber EMERGENCY (the beacon in an emergency), so a mood changes them.
//
// Makes and looks:
//   suitLocker      'open' (a stand: the suit hung on its frame, the helmet on the shelf, the charging line),
//                   'locker' (a locker with a window, the suit inside), 'rack' (a wall frame); look { suit:
//                   'navy' | 'marine' | 'eva', empty }
//   airlockDoor     'inner' | 'outer' (vacuum beyond: its warning) | 'vehicle' (4 m, segmented); look { state: 'ready' | 'cycling' | 'vacuum', n }
//   pressureDoor    'sliding' | 'dogged' (oval, six dogs) | 'fire'; look { label }
//   hatch           'deck' (round, a wheel) | 'square' (powered) | 'escape'; look { open }
//   ladderWell      'rails' (railings round an open shaft) | 'cage' | 'trunk' (the ladder up through the overhead)
//   crashCouch      'troop' | 'station' (a screen over it) | 'medical'; look { harness }
//   conduit         'pipes' (colour-banded runs on brackets) | 'cables' (a cable tray) | 'duct'; w: its run
//   handhold        'bar' | 'ring'
//   emergencyLight  'lamp' (a battery lamp, its amber lens and pool) | 'strip' (a floor strip) | 'beacon'
// Pure.
import { tex } from './kit.js';
import { C, U, P, bevel, sunk, oval, cloth, glass, statusLamp, screenFace, tone } from './common.js';
import { paintedSteel, grimeFoot, scuffs } from '../materials/index.js';
import { fontFor } from './type.js';
import { GLOW } from '../paint.js';

const rail = (c) => tex(`shiprail:${c}`, (px, w, h) => { px(0, 0, w, h, c); px(0, 0, w, 1, tone(c, 0.08)); if (h > 2) px(0, h - 1, w, 1, tone(c, -0.12)); });
const BULK = 0x6d757f, FRAME = 0x3e424d;
const SUITS = { navy: [0xa7b4b4, 0x3c5d84], marine: [0x9c917a, 0x8f3f31], eva: [0xd6d0c9, 0xd0ac5e] };

/** Hazard stripes over (x, y, w, h), bands `band` px wide. */
function hazard(px, x, y, w, h, band = 3, a = C.hazard, b = C.hazardD) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, 1, 1, Math.floor((i + j) / band) % 2 ? b : a);
}

// ---------- suits ----------

/** A vac suit hanging, seen from the front: w × h px with holes round it (the stand's back shows through). */
const suitFront = (kind) => tex(`suit:${kind}`, (px, w, h, ppm) => {
  const [c, trim] = SUITS[kind] ?? SUITS.marine, u = U(ppm), cx = w / 2, ring = C.steel;
  px(0, 0, w, h, null);
  const rows = (t0, t1, half, col) => { for (let j = Math.floor(t0 * h); j < Math.floor(t1 * h); j++) { const t = (j / h - t0) / (t1 - t0), hw = typeof half === 'function' ? half(t) : half; px(Math.round(cx - hw * w), j, Math.max(1, Math.round(2 * hw * w)), 1, col); } };
  rows(0.0, 0.05, 0.12, ring);                                      // (the neck ring, its helmet off)
  rows(0.05, 0.42, (t) => 0.3 - t * 0.04, c);                      // (the hard upper torso)
  rows(0.42, 0.47, 0.25, ring);                                     // (the waist ring)
  rows(0.47, 0.58, 0.25, tone(c, -0.04));                          // (the hips)
  for (const s of [-1, 1]) {                                        // (the legs, the boots)
    for (let j = Math.floor(0.58 * h); j < Math.floor(0.92 * h); j++) px(Math.round(cx + s * w * 0.13 - w * 0.1), j, Math.max(1, Math.round(w * 0.2)), 1, j % Math.max(3, Math.round(4 * u)) === 0 ? tone(c, -0.06) : c);
    px(Math.round(cx + s * w * 0.13 - w * 0.11), Math.floor(0.92 * h), Math.max(1, Math.round(w * 0.22)), h - Math.floor(0.92 * h), 0x31292a);
    for (let j = Math.floor(0.08 * h); j < Math.floor(0.5 * h); j++) px(Math.round(cx + s * w * 0.34 - w * 0.07), j, Math.max(1, Math.round(w * 0.14)), 1, j % Math.max(3, Math.round(4 * u)) === 0 ? tone(c, -0.06) : c);   // (the arms hanging)
    px(Math.round(cx + s * w * 0.34 - w * 0.07), Math.floor(0.48 * h), Math.max(1, Math.round(w * 0.14)), Math.max(1, Math.round(0.01 * h * u)), ring);
    px(Math.round(cx + s * w * 0.34 - w * 0.07), Math.floor(0.5 * h), Math.max(1, Math.round(w * 0.14)), Math.floor(0.06 * h), 0x31292a);   // (the gloves)
  }
  // (the chest: its display lit, the trim, a unit patch, the lit edge on the left, shade on the right)
  const dx = Math.round(cx - w * 0.1), dy = Math.floor(0.14 * h);
  px(dx, dy, Math.max(2, Math.round(w * 0.2)), Math.max(2, Math.round(0.05 * h)), C.black);
  px(dx + 1, dy + 1, Math.max(1, Math.round(w * 0.2) - 2), Math.max(1, Math.round(0.05 * h) - 2), 0x9fe0b0, GLOW.SCREEN);
  px(Math.round(cx - w * 0.26), Math.floor(0.3 * h), Math.round(w * 0.52), Math.max(1, Math.round(u)), trim);
  px(Math.round(cx + w * 0.12), Math.floor(0.08 * h), Math.max(2, Math.round(w * 0.1)), Math.max(2, Math.round(0.03 * h)), trim);
  for (let j = Math.floor(0.05 * h); j < Math.floor(0.42 * h); j++) { px(Math.round(cx - (0.3 - (j / h) * 0.1) * w), j, 1, 1, tone(c, 0.07)); px(Math.round(cx + (0.3 - (j / h) * 0.1) * w) - 1, j, 1, 1, tone(c, -0.1)); }
});
const helmetFront = (kind) => tex(`helmet:${kind}`, (px, w, h, ppm) => {
  const [c, trim] = SUITS[kind] ?? SUITS.marine;
  px(0, 0, w, h, null);
  oval(px, w / 2, h * 0.52, w / 2, h * 0.5, c);
  oval(px, w / 2, h * 0.6, w * 0.36, h * 0.3, 0x1d2b46);
  oval(px, w * 0.38, h * 0.5, w * 0.08, h * 0.07, 0x86bdbc);
  px(Math.floor(w * 0.2), Math.floor(h * 0.15), Math.ceil(w * 0.6), Math.max(1, Math.round(U(ppm))), trim);
  px(Math.floor(w * 0.12), h - Math.max(1, Math.round(U(ppm))), Math.ceil(w * 0.76), Math.max(1, Math.round(U(ppm))), C.steel);
});
const helmetTop = (kind) => tex(`helmettop:${kind}`, (px, w, h) => { const [c, trim] = SUITS[kind] ?? SUITS.marine; px(0, 0, w, h, null); oval(px, w / 2, h / 2, w / 2, h / 2, c); oval(px, w * 0.4, h * 0.4, w * 0.2, h * 0.2, tone(c, 0.06)); px(Math.floor(w / 2), 1, 1, h - 2, trim); });
const standBack = tex('suitstandback', (px, w, h, ppm) => {
  paintedSteel(px, 0, 0, w, h, { c: BULK, ppm, seed: 21 });
  const f = fontFor(ppm), s = 'SUIT';
  if (f.width(s) < w - 4) f.stencil(px, 2, 2, s, tone(BULK, -0.18));
  statusLamp(px, w - P(0.08, ppm, 3), P(0.08, ppm, 2), Math.max(1, Math.round(U(ppm))), 0x9fe0b0, GLOW.ALWAYS);
  px(w - P(0.12, ppm, 3), P(0.3, ppm), P(0.06, ppm, 2), P(0.08, ppm, 2), C.black); px(w - P(0.12, ppm, 3), P(0.3, ppm), P(0.06, ppm, 2), 1, 0xd0ac5e);   // (the O2 charging port)
  grimeFoot(px, 0, 0, w, h, BULK, { ppm, upM: 0.3, seed: 2 });
});
export function suitLocker(k, o) {
  const { W, D, seed } = o, make = o.make ?? 'open', look = o.look ?? {}, kind = look.suit ?? ['marine', 'marine', 'navy', 'eva'][seed % 4];
  k.comp();
  if (make === 'locker') {
    k.box({ x: 0, z: 0, w: W, d: D, h: 2.1, faces: { front: tex(`suitlocker:${kind}:${!!look.empty}`, (px, w, h, p) => {
      paintedSteel(px, 0, 0, w, h, { c: BULK, ppm: p, seed: 23 });
      const m = P(0.05, p, 2); bevel(px, m, m, w - 2 * m, h - 2 * m - P(0.1, p), BULK, 1.2);
      const gx = m + P(0.08, p, 2), gy = m + P(0.15, p, 2), gw = w - 2 * gx, gh = Math.floor(h * 0.6);
      px(gx, gy, gw, gh, 0x1d2b46);
      if (!look.empty) { const S = SUITS[kind]; px(gx + Math.floor(gw * 0.25), gy + Math.floor(gh * 0.25), Math.ceil(gw * 0.5), Math.floor(gh * 0.7), tone(S[0], -0.25)); oval(px, gx + gw / 2, gy + gh * 0.14, gw * 0.16, gh * 0.1, tone(S[0], -0.2)); px(gx + Math.floor(gw * 0.3), gy + Math.floor(gh * 0.45), Math.ceil(gw * 0.4), 1, tone(S[1], -0.2)); }
      glass(px, gx, gy, gw, Math.floor(gh / 2), 0x1d2b46, { dark: true });
      statusLamp(px, w - m - P(0.08, p, 2), m + P(0.05, p, 2), Math.max(1, Math.round(U(p))), look.empty ? 0xb45150 : 0x9fe0b0, GLOW.ALWAYS);
      px(w - m - P(0.06, p, 2), Math.floor(h * 0.55), 1, P(0.2, p, 3), C.steel);
      const f = fontFor(p), s = `S-${10 + seed % 40}`; if (f.width(s) < w - 2 * m) f.stencil(px, m + 2, h - P(0.1, p) - f.h - 3, s, 0xd9d1b7);
      grimeFoot(px, 0, 0, w, h, BULK, { ppm: p, upM: 0.3, seed: 3 });
    }), top: tone(BULK, 0.05), sides: tone(BULK, -0.06) } });
    return;
  }
  // (an open stand or a wall rack: a back panel, a shelf for the helmet, the suit hung in front)
  const backD = make === 'rack' ? 0.06 : 0.12;
  k.box({ x: 0, z: -D / 2 + backD / 2, w: W, d: backD, h: 2.1, faces: { front: standBack, top: BULK, sides: tone(BULK, -0.06) } });
  if (make === 'open') for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.03), z: 0, w: 0.05, d: D, h: 2.1, faces: { sides: FRAME, front: rail(FRAME), top: tone(FRAME, 0.08) } });
  k.box({ x: 0, z: -D / 2 + backD + 0.12, y: 1.72, w: W - 0.1, d: 0.25, h: 0.03, faces: { sides: FRAME, front: rail(FRAME), top: tex('suitshelf', (px, w, h) => { px(0, 0, w, h, FRAME); for (let i = 1; i < w; i += 3) px(i, 0, 1, h, tone(FRAME, -0.1)); }) } });
  if (look.empty) return;
  k.comp();
  k.box({ x: 0, z: -D / 2 + backD + 0.28, y: 0.08, w: 0.7, d: 0.04, h: 1.58, faces: { front: suitFront(kind), back: suitFront(kind), top: null, sides: null }, only: ['front', 'back'] });
  // (the life-support pack behind it, its top showing over the shoulders; the helmet on the shelf; the charging line)
  k.comp();
  k.box({ x: 0, z: -D / 2 + backD + 0.13, y: 0.95, w: 0.42, d: 0.22, h: 0.62, faces: { top: tex('lsspacktop', (px, w, h) => { px(0, 0, w, h, 0x565b67); bevel(px, 0, 0, w, h, 0x565b67); px(2, 1, w - 4, 1, 0xd0ac5e); }), front: rail(0x565b67), sides: 0x565b67 } });
  k.comp();
  k.box({ x: 0.05, z: -D / 2 + backD + 0.12, y: 1.75, w: 0.32, d: 0.3, h: 0.32, faces: { front: helmetFront(kind), top: helmetTop(kind), sides: SUITS[kind][0] } });
  k.comp();
  k.box({ x: W / 2 - 0.12, z: -D / 2 + backD + 0.04, y: 0.9, w: 0.03, d: 0.06, h: 0.5, faces: { sides: 0xd0ac5e, front: rail(0xd0ac5e) } });
}

// ---------- doors ----------

const doorFace = (make, state, label) => tex(`airlock:${make}:${state}:${label}`, (px, w, h, ppm) => {
  const u = U(ppm), f = fontFor(ppm), frame = FRAME, leaf = make === 'outer' ? 0x565b67 : BULK;
  paintedSteel(px, 0, 0, w, h, { c: frame, ppm, seed: 31 });
  if (make === 'vehicle') {
    const m = P(0.25, ppm), band = Math.max(3, Math.round(4 * u));
    hazard(px, 0, 0, w, m, band); hazard(px, 0, 0, m, h, band); hazard(px, w - m, 0, m, h, band);
    const lx = m, lw = w - 2 * m, ly = m + P(0.2, ppm), lh = h - ly;
    for (let y = ly; y < h; y += P(0.4, ppm, 5)) { px(lx, y, lw, P(0.4, ppm, 5), leaf); bevel(px, lx, y, lw, P(0.4, ppm, 5), leaf, 1.1); for (let x = lx + 3; x < lx + lw - 2; x += P(0.5, ppm, 6)) px(x, y + 2, 1, 1, tone(leaf, 0.1)); }
    const s = 'VEHICLE LOCK 1'; if (f.width(s) < lw - 4) f.stencil(px, lx + Math.floor((lw - f.width(s)) / 2), ly + P(0.5, ppm), s, 0xd9d1b7);
    for (const sx of [m + P(0.3, ppm), w - m - P(0.3, ppm)]) statusLamp(px, sx - 1, P(0.08, ppm, 2), P(0.12, ppm, 3), state === 'ready' ? 0x9fe0b0 : state === 'cycling' ? 0xe7b84a : 0xb45150, state === 'cycling' ? GLOW.EMERGENCY : GLOW.ALWAYS);
    grimeFoot(px, 0, 0, w, h, leaf, { ppm, upM: 0.6, seed: 5, k: 1.5 });
    return;
  }
  // (the frame: hazard-striped round the leaf; the leaf with its window, its handle and dogs; over it the status light; at its side the panel)
  const dw = P(1.0, ppm), dh = P(2.0, ppm), dx = P(0.18, ppm), dy = h - dh - P(0.06, ppm), band = Math.max(2, Math.round(3 * u)), fr = P(0.08, ppm, 2);
  hazard(px, dx - fr, dy - fr, dw + 2 * fr, fr, band); hazard(px, dx - fr, dy - fr, fr, dh + fr, band); hazard(px, dx + dw, dy - fr, fr, dh + fr, band);
  px(dx, dy, dw, dh, leaf); bevel(px, dx, dy, dw, dh, leaf, 1.3);
  sunk(px, dx + P(0.08, ppm, 2), dy + P(0.08, ppm, 2), dw - 2 * P(0.08, ppm, 2), dh - 2 * P(0.08, ppm, 2), tone(leaf, -0.02), 0.7);
  const wx = dx + Math.floor((dw - P(0.3, ppm)) / 2), wy = dy + P(0.3, ppm);
  px(wx - 1, wy - 1, P(0.3, ppm) + 2, P(0.4, ppm) + 2, C.black); glass(px, wx, wy, P(0.3, ppm), P(0.4, ppm), state === 'vacuum' ? 0x1d2b46 : 0x3c5d84, { dark: true });
  oval(px, dx + dw / 2, dy + dh * 0.55, P(0.14, ppm, 3), P(0.14, ppm, 3), C.steel); oval(px, dx + dw / 2, dy + dh * 0.55, P(0.1, ppm, 2), P(0.1, ppm, 2), leaf); px(Math.floor(dx + dw / 2), Math.floor(dy + dh * 0.55 - P(0.14, ppm, 3)), 1, 2 * P(0.14, ppm, 3), C.steel);   // (the wheel)
  for (const yy of [0.2, 0.8]) { px(dx - 1, Math.floor(dy + dh * yy), 2, P(0.08, ppm, 2), C.steel); px(dx + dw - 1, Math.floor(dy + dh * yy), 2, P(0.08, ppm, 2), C.steel); }   // (the dogs)
  const lc = state === 'ready' ? 0x9fe0b0 : state === 'cycling' ? 0xe7b84a : 0xb45150;
  statusLamp(px, dx + Math.floor(dw / 2) - P(0.06, ppm, 1), Math.max(1, dy - fr - P(0.16, ppm, 3)), P(0.12, ppm, 3), lc, state === 'cycling' ? GLOW.EMERGENCY : GLOW.ALWAYS);
  // (the panel: a pressure readout, a keypad, the cycle button)
  const pxx = dx + dw + fr + P(0.08, ppm, 2), pw = Math.max(4, w - pxx - P(0.05, ppm, 1)), py = dy + Math.floor(dh * 0.35);
  if (pw >= 4) {
    px(pxx, py, pw, P(0.4, ppm, 6), C.black); px(pxx + 1, py + 1, pw - 2, P(0.12, ppm, 3), 0x1d2b46, GLOW.SCREEN);
    f.text(px, pxx + 1, py + 1, state === 'vacuum' ? '0' : '66', 0x9fe0b0, GLOW.SCREEN);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) px(pxx + 1 + i * Math.max(1, Math.round(u)), py + P(0.18, ppm, 4) + j * Math.max(1, Math.round(u)), 1, 1, 0x7c736b);
    px(pxx + pw - 2, py + P(0.3, ppm, 5), 1, 1, 0xb45150, GLOW.ALWAYS);
  }
  // (what it says: the lock's name, and on an outer door, what is beyond)
  const s = label || (make === 'outer' ? 'VACUUM' : 'AIRLOCK');
  if (f.width(s) < dw) f.stencil(px, dx + Math.floor((dw - f.width(s)) / 2), dy + dh - P(0.35, ppm) - f.h, s, make === 'outer' ? 0xb45150 : 0xd9d1b7);
  grimeFoot(px, 0, 0, w, h, frame, { ppm, upM: 0.3, seed: 4 });
  scuffs(px, dx, dy, dw, dh, leaf, { ppm, seed: 6, lowM: 0.5, k: 1.5 });
});
export function airlockDoor(k, o) {
  const { W, D, seed } = o, make = o.make ?? 'inner', look = o.look ?? {};
  const w = make === 'vehicle' ? Math.max(W, 4.6) : W, h = make === 'vehicle' ? 4.6 : 2.6;
  k.comp();
  k.box({ x: 0, z: 0, w, d: D, h, faces: { front: doorFace(make, look.state ?? 'ready', look.label ?? ''), top: tone(FRAME, 0.05), sides: tone(FRAME, -0.05) } });
  if (make === 'vehicle') { for (const sx of [-1, 1]) k.lamp({ x: sx * (w / 2 - 0.3), z: 0.8, y: 4.2, r: 1.4, core: 0.4, ring: 0.15, kind: 'emergency', color: 0xffb347 }); }
}
const pdoorFace = (make, label) => tex(`pdoor:${make}:${label}`, (px, w, h, ppm) => {
  const u = U(ppm), f = fontFor(ppm), frame = FRAME, leaf = make === 'fire' ? 0x91384a : BULK;
  paintedSteel(px, 0, 0, w, h, { c: frame, ppm, seed: 41 });
  const band = Math.max(2, Math.round(3 * u));
  if (make === 'dogged') {
    // (an oval bulkhead door, 0.8 × 1.8 m: its coaming, six dogs round it, the lever)
    const cx = w / 2, cy = h - P(0.06, ppm) - P(0.9, ppm), rx = P(0.4, ppm) + 1, ry = P(0.9, ppm);
    oval(px, cx, cy, rx + P(0.08, ppm, 2), ry + P(0.08, ppm, 2), C.hazard);
    for (let j = Math.floor(cy - ry - 3); j < cy + ry + 3; j++) for (let i = Math.floor(cx - rx - 3); i < cx + rx + 3; i++) { const a = (i + 0.5 - cx) / (rx + P(0.08, ppm, 2)), b = (j + 0.5 - cy) / (ry + P(0.08, ppm, 2)); if (a * a + b * b <= 1 && Math.floor((i + j) / band) % 2) px(i, j, 1, 1, C.hazardD); }
    oval(px, cx, cy, rx, ry, leaf); oval(px, cx - 1, cy - 1, rx - 2, ry - 2, tone(leaf, 0.03));
    for (let d = 0; d < 6; d++) { const a = (d / 6) * Math.PI * 2 + 0.5; px(Math.round(cx + Math.cos(a) * (rx - 2)), Math.round(cy + Math.sin(a) * (ry - 2)), Math.max(2, Math.round(2 * u)), Math.max(1, Math.round(u)), C.steel); }
    px(Math.round(cx + rx * 0.4), Math.round(cy - 1), P(0.15, ppm, 3), Math.max(1, Math.round(u)), C.steel);
    const s = label || 'DOGGED'; if (f.width(s) < 2 * rx) f.stencil(px, Math.round(cx - f.width(s) / 2), Math.round(cy - ry * 0.5), s, 0xd9d1b7);
  } else {
    const dw = P(1.0, ppm), dh = P(2.0, ppm), dx = Math.floor((w - dw) / 2), dy = h - dh - P(0.06, ppm), fr = P(0.08, ppm, 2);
    hazard(px, dx - fr, dy - fr, dw + 2 * fr, fr, band); hazard(px, dx - fr, dy, fr, dh, band); hazard(px, dx + dw, dy, fr, dh, band);
    px(dx, dy, dw, dh, leaf); bevel(px, dx, dy, dw, dh, leaf, 1.3);
    px(dx + Math.floor(dw / 2), dy, 1, dh, tone(leaf, -0.15));          // (the sliding leaves' meeting line)
    const wx = dx + Math.floor((dw - P(0.2, ppm)) / 2) + P(0.15, ppm), wy = dy + P(0.4, ppm);
    px(wx - 1, wy - 1, P(0.2, ppm) + 2, P(0.3, ppm) + 2, C.black); glass(px, wx, wy, P(0.2, ppm), P(0.3, ppm), 0x3c5d84, { dark: true });
    statusLamp(px, dx + Math.floor(dw / 2) - 1, Math.max(1, dy - fr - P(0.14, ppm, 3)), P(0.1, ppm, 2), make === 'fire' ? 0xb45150 : 0x9fe0b0, GLOW.ALWAYS);
    const s = label || (make === 'fire' ? 'FIRE DOOR' : 'PRESSURE DOOR'); if (f.width(s) < dw - 2) f.stencil(px, dx + Math.floor((dw - f.width(s)) / 2), dy + Math.floor(dh * 0.62), s, make === 'fire' ? C.paper : 0xd9d1b7);
    else { const s2 = s.split(' ')[0]; if (f.width(s2) < dw - 2) f.stencil(px, dx + Math.floor((dw - f.width(s2)) / 2), dy + Math.floor(dh * 0.62), s2, 0xd9d1b7); }
    scuffs(px, dx, dy, dw, dh, leaf, { ppm, seed: 8, lowM: 0.4, k: 1.4 });
  }
  grimeFoot(px, 0, 0, w, h, frame, { ppm, upM: 0.25, seed: 9 });
});
export function pressureDoor(k, o) {
  const { W, D } = o, make = o.make ?? 'sliding', look = o.look ?? {};
  k.comp();
  k.box({ x: 0, z: 0, w: W, d: D, h: 2.4, faces: { front: pdoorFace(make, look.label ?? ''), top: tone(FRAME, 0.05), sides: tone(FRAME, -0.05) } });
}

// ---------- hatches and ladders ----------

/** The open shaft seen from 45° above: its dark, the far wall's rungs going down, each smaller and darker. */
function shaft(px, x, y, w, h, ppm) {
  px(x, y, w, h, 0x14161d);
  const rw = Math.floor(w * 0.6), rx = x + Math.floor((w - rw) / 2);
  for (let n = 0, yy = y + 1; yy < y + h - 1 && n < 8; n++) {
    const shade = Math.max(0, 0.35 - n * 0.05), c = tone(0x7c736b, -0.25 + shade * 0.6);
    px(rx + n, yy, Math.max(1, rw - 2 * n), 1, c);
    px(rx + n, yy, 1, Math.max(1, P(0.3, ppm) - n), tone(c, -0.05)); px(rx + rw - n - 1, yy, 1, Math.max(1, P(0.3, ppm) - n), tone(c, -0.05));
    yy += Math.max(2, P(0.3, ppm) - n * Math.max(1, Math.round(ppm / 16)));
  }
}
const hatchTop = (make, open, label) => tex(`hatch:${make}:${open}:${label}`, (px, w, h, ppm) => {
  const u = U(ppm), band = Math.max(2, Math.round(3 * u)), f = fontFor(ppm);
  paintedSteel(px, 0, 0, w, h, { c: 0x4c5f5e, ppm, seed: 51 });
  hazard(px, 0, 0, w, P(0.1, ppm, 2), band); hazard(px, 0, h - P(0.1, ppm, 2), w, P(0.1, ppm, 2), band); hazard(px, 0, 0, P(0.1, ppm, 2), h, band); hazard(px, w - P(0.1, ppm, 2), 0, P(0.1, ppm, 2), h, band);
  const m = P(0.2, ppm), cw = w - 2 * m, ch = h - 2 * m;
  if (open) { px(m - 1, m - 1, cw + 2, ch + 2, C.black); shaft(px, m, m, cw, ch, ppm); return; }
  if (make === 'deck' || make === 'escape') {
    const cx = w / 2, cy = h / 2, r = Math.min(cw, ch) / 2;
    oval(px, cx, cy, r + 1, r + 1, C.black); oval(px, cx, cy, r, r, make === 'escape' ? 0x91384a : BULK); oval(px, cx - 1, cy - 1, r - 2, r - 2, tone(make === 'escape' ? 0x91384a : BULK, 0.03));
    oval(px, cx, cy, r * 0.42, r * 0.42, C.steel); oval(px, cx, cy, r * 0.32, r * 0.32, make === 'escape' ? 0x91384a : BULK);
    px(Math.round(cx - r * 0.42), Math.round(cy), Math.round(r * 0.84), 1, C.steel); px(Math.round(cx), Math.round(cy - r * 0.42), 1, Math.round(r * 0.84), C.steel);
    for (let d = 0; d < 6; d++) { const a = d / 6 * Math.PI * 2; px(Math.round(cx + Math.cos(a) * (r - 2)), Math.round(cy + Math.sin(a) * (r - 2)), Math.max(1, Math.round(u)), Math.max(1, Math.round(u)), C.steel); }
  } else {
    px(m, m, cw, ch, BULK); bevel(px, m, m, cw, ch, BULK, 1.4);
    for (let y = m + 3; y < m + ch - 2; y += P(0.12, ppm, 3)) px(m + 2, y, cw - 4, 1, tone(BULK, -0.06));
    px(m + cw - P(0.12, ppm, 3), m + Math.floor(ch / 2) - 1, P(0.08, ppm, 2), 3, C.steel);
  }
  const s = label || (make === 'escape' ? 'ESCAPE' : 'TRUNK');
  if (f.width(s) < w - 4) f.text(px, Math.floor((w - f.width(s)) / 2), h - P(0.1, ppm, 2) - f.h - 1, s, 0xd9d1b7);
});
export function hatch(k, o) {
  const { W, D, seed } = o, make = o.make ?? 'deck', look = o.look ?? {}, open = !!look.open;
  k.comp();
  k.box({ x: 0, z: 0, w: W, d: D, h: 0.08, faces: { top: hatchTop(make, open, look.label ?? ''), front: tex('coaming', (px, w, h, p) => hazard(px, 0, 0, w, h, Math.max(2, Math.round(3 * U(p))))), sides: C.hazardD } });
  if (open) {
    k.comp();
    k.box({ x: 0, z: -D / 2 + 0.1, y: 0.08, w: W - 0.4, d: 0.06, h: W - 0.4, faces: { front: tex(`hatchlid:${make}`, (px, w, h, p) => { px(0, 0, w, h, BULK); bevel(px, 0, 0, w, h, BULK, 1.3); sunk(px, 2, 2, w - 4, h - 4, tone(BULK, -0.03)); px(1, h - P(0.1, p, 2), w - 2, 1, C.hazard); oval(px, w / 2, h / 2, P(0.1, p, 2), P(0.1, p, 2), C.steel); }), back: BULK, sides: FRAME, top: tone(BULK, 0.05) } });
    k.box({ x: 0, z: -D / 2 + 0.06, y: 0.08, w: 0.12, d: 0.08, h: 0.12, faces: { sides: C.steelD } });
  }
}
export function ladderWell(k, o) {
  const { W, D, ppm } = o, make = o.make ?? 'rails';
  const yellow = C.hazard, hole = W - 0.3;
  k.comp();
  k.box({ x: 0, z: 0, w: W, d: D, h: 0.05, faces: { top: hatchTop('square', true, ''), front: tex('coaming', (px, w, h, p) => hazard(px, 0, 0, w, h, Math.max(2, Math.round(3 * U(p))))), sides: C.hazardD } });
  // (the ladder's rails rising out of the shaft at its back, as grab handles; or all the way up the trunk)
  const top = make === 'trunk' ? 2.4 : 1.1;
  k.comp();
  for (const sx of [-1, 1]) k.box({ x: sx * 0.22, z: -hole / 2 + 0.08, y: 0, w: 0.05, d: 0.05, h: top, faces: { sides: 0x7c736b, front: rail(0xa5b5b6), top: 0xa5b5b6 } });
  if (make === 'trunk') {
    k.box({ x: 0, z: -hole / 2 + 0.08, y: 0, w: 0.44, d: 0.03, h: top, faces: { front: tex('rungs', (px, w, h, p) => { px(0, 0, w, h, null); for (let y = P(0.3, p) - 1; y < h; y += P(0.3, p)) { px(0, y, w, Math.max(1, P(0.03, p, 1)), 0xa5b5b6); px(0, y + Math.max(1, P(0.03, p, 1)), w, 1, 0x49403e); } }), sides: null, top: null }, only: ['front'] });
  } else {
    k.box({ x: 0, z: -hole / 2 + 0.08, y: top - 0.05, w: 0.44, d: 0.05, h: 0.05, faces: { sides: 0x7c736b, front: rail(0xa5b5b6) } });
  }
  if (make === 'rails' || make === 'cage') {
    // (railings round three sides of the hole, open on the side you climb in from)
    k.comp();
    const rc = make === 'cage' ? 0x7c736b : yellow;
    for (const [x, z] of [[-W / 2 + 0.05, -D / 2 + 0.05], [W / 2 - 0.05, -D / 2 + 0.05], [-W / 2 + 0.05, D / 2 - 0.25], [W / 2 - 0.05, D / 2 - 0.25]]) k.box({ x, z, w: 0.05, d: 0.05, h: 1.05, faces: { sides: rc, front: rail(rc), top: tone(rc, 0.08) } });
    for (const y of [0.5, 1.0]) {
      k.box({ x0: -W / 2 + 0.03, x1: W / 2 - 0.03, z0: -D / 2 + 0.03, z1: -D / 2 + 0.07, y, h: 0.04, faces: { sides: rc, front: rail(rc), top: tone(rc, 0.08) } });
      for (const sx of [-1, 1]) k.box({ x0: sx * (W / 2 - 0.05) - 0.02, x1: sx * (W / 2 - 0.05) + 0.02, z0: -D / 2 + 0.05, z1: D / 2 - 0.25, y, h: 0.04, faces: { sides: rc, front: rail(rc), top: tone(rc, 0.08) } });
    }
  }
}

// ---------- couches ----------

const couchTopOf = (c, harness, kind) => tex(`couch:${c}:${harness}:${kind}`, (px, w, h, ppm) => {
  const u = U(ppm), cx = w / 2;
  px(0, 0, w, h, null);
  const shape = (t) => (t < 0.15 ? 0.34 : t < 0.19 ? 0.28 : t < 0.55 ? 0.47 : t < 0.6 ? 0.42 : 0.38);
  for (let j = 0; j < h; j++) { const hw = Math.round(shape(j / h) * w); px(Math.round(cx - hw), j, Math.max(1, 2 * hw), 1, c); px(Math.round(cx - hw), j, 1, 1, tone(c, 0.08)); px(Math.round(cx + hw) - 1, j, 1, 1, tone(c, -0.12)); }
  px(Math.round(cx - shape(0) * w), 0, Math.round(2 * shape(0) * w), 1, tone(c, 0.08));
  for (const t of [0.15, 0.35, 0.55, 0.78]) px(Math.round(cx - w * 0.22), Math.floor(t * h), Math.round(w * 0.44), 1, tone(c, -0.09));
  cloth(px, Math.round(cx - w * 0.2), Math.floor(0.2 * h), Math.round(w * 0.4), Math.floor(0.32 * h), c, { seed: 4, u, k: 0.6 });
  if (harness) {
    const s = 0x31292a, b = 0x7c736b, sw = Math.max(1, Math.round(1.5 * u));
    for (let j = Math.floor(0.17 * h); j < 0.47 * h; j++) { const t = (j - 0.17 * h) / (0.3 * h); px(Math.round(cx - w * 0.3 + t * w * 0.25), j, sw, 1, s); px(Math.round(cx + w * 0.3 - t * w * 0.25) - sw + 1, j, sw, 1, s); }
    px(Math.round(cx - w * 0.07), Math.floor(0.47 * h), Math.max(2, Math.round(w * 0.14)), Math.max(2, Math.round(2.5 * u)), b); px(Math.round(cx - w * 0.07), Math.floor(0.47 * h), Math.max(2, Math.round(w * 0.14)), 1, tone(b, 0.1));
    px(Math.round(cx), Math.floor(0.5 * h), sw, Math.floor(0.1 * h), s);
    for (const sx of [-1, 1]) px(Math.round(cx + sx * w * 0.36), Math.floor(0.55 * h), sw, Math.floor(0.08 * h), s);
  }
  if (kind === 'medical') { px(Math.round(cx - 1), Math.floor(0.62 * h), 3, Math.max(3, Math.round(5 * u)), 0xb45150); px(Math.round(cx - 2), Math.floor(0.62 * h) + 1, 5, Math.max(1, Math.round(u)), 0xb45150); }
});
export function crashCouch(k, o) {
  const { W, D, seed } = o, make = o.make ?? 'troop', look = o.look ?? {};
  const c = make === 'medical' ? 0xd6d0c9 : make === 'station' ? 0x3c405d : 0x4d5a7b, base = 0x3e424d;
  k.comp();
  // (the gimbal's pedestal and cradle under the couch)
  k.box({ x: 0, z: 0.1, w: 0.35, d: 0.6, h: 0.22, faces: { sides: base, front: rail(base), top: base } });
  k.box({ x: 0, z: 0, y: 0.22, w: W - 0.1, d: D - 0.1, h: 0.08, faces: { sides: tone(base, 0.05), front: rail(base), top: base } });
  k.comp();
  k.box({ x: 0, z: 0, y: 0.3, w: W - 0.12, d: D - 0.14, h: 0.22, faces: { top: couchTopOf(c, look.harness ?? true, make), front: tex(`couchfoot:${c}`, (px, w, h, p) => { px(0, 0, w, h, null); const hw = Math.round(0.38 * w); px(Math.round(w / 2 - hw), 0, 2 * hw, h, c); px(Math.round(w / 2 - hw), 0, 2 * hw, 1, tone(c, 0.08)); px(Math.round(w / 2 - hw), h - 1, 2 * hw, 1, tone(c, -0.15)); }), back: c, sides: tone(c, -0.08) }, omit: [] });
  // (the armrests with their controls, the leg rest's lip)
  k.comp();
  for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.06), z: -0.15, y: 0.42, w: 0.1, d: 0.5, h: 0.12, faces: { top: tex(`armrest:${sx}:${make}`, (px, w, h, p) => { px(0, 0, w, h, base); bevel(px, 0, 0, w, h, base); px(1, h - P(0.12, p, 2), w - 2, P(0.08, p, 2), C.black); px(1, h - P(0.12, p, 2), 1, 1, 0x9fe0b0, GLOW.SCREEN); if (sx > 0 && make === 'station') px(Math.floor(w / 2), 1, Math.max(1, Math.round(U(p))), Math.max(1, Math.round(2 * U(p))), C.steelDD); }), front: rail(base), sides: base } });
  if (make === 'station' || make === 'medical') {
    // (a screen on an arm over the occupant's face: its face turned up to them, so the camera sees it lit)
    k.comp();
    k.box({ x: W / 2 - 0.05, z: -D / 2 + 0.25, y: 0.3, w: 0.05, d: 0.05, h: 0.85, faces: { sides: base } });
    k.box({ x: 0.1, z: -D / 2 + 0.38, y: 1.12, w: 0.5, d: 0.32, h: 0.04, faces: { top: tex(`couchscreen:${make}:${seed % 2}`, (px, w, h) => screenFace(px, 0, 0, w, h, { kind: make === 'medical' ? 'graph' : 'text', seed })), front: rail(C.black), sides: C.black } });
  }
  // (the helmet clipped at the head, for the troop make)
  if (make === 'troop' && (look.helmet ?? seed % 3 !== 0)) { k.comp(); k.box({ x: -W / 2 + 0.08, z: -D / 2 + 0.2, y: 0.3, w: 0.22, d: 0.22, h: 0.2, faces: { top: helmetTop('marine'), front: helmetFront('marine'), sides: SUITS.marine[0] } }); }
}

// ---------- fittings ----------

/** A run of conduit along a wall (y: its mounting height from the builder's y), its brackets every metre. */
export function conduit(k, o) {
  const { W, D } = o, make = o.make ?? 'pipes';
  k.comp();
  for (let x = -W / 2 + 0.2; x < W / 2; x += 1.0) k.box({ x, z: 0, w: 0.04, d: D, h: 0.42, faces: { sides: C.steelD, front: rail(C.steelD) } });
  if (make === 'duct') { k.box({ x: 0, z: 0.02, y: 0.05, w: W, d: D - 0.04, h: 0.32, faces: { front: tex('duct', (px, w, h, p) => { paintedSteel(px, 0, 0, w, h, { c: 0xa5b5b6, ppm: p, seed: 61 }); for (let x = 0; x < w; x += P(1.2, p)) { px(x, 0, 1, h, tone(0xa5b5b6, -0.15)); px(x + 1, 0, 1, h, tone(0xa5b5b6, 0.06)); } }), top: 0xa5b5b6, sides: 0x87959d } }); return; }
  const runs = make === 'cables' ? [[0.05, 0.22, 'tray']] : [[0.06, 0.08, 0x3c5d84], [0.17, 0.06, 0xb45150], [0.26, 0.05, 0xd0ac5e], [0.34, 0.04, 0x538252]];
  for (const [y, h, c] of runs) {
    k.comp();
    if (c === 'tray') { k.box({ x: 0, z: 0.02, y, w: W, d: D - 0.03, h, faces: { front: tex('cabletray', (px, w, hh, p) => { px(0, 0, w, hh, C.steelD); for (let j = 1; j < hh - 1; j += 2) px(0, j, w, 1, [0x31292a, 0xc67e51, 0x31292a, 0x3c5d84, 0x31292a][(j >> 1) % 5]); px(0, 0, w, 1, C.steel); px(0, hh - 1, w, 1, C.steelDD); for (let x = 0; x < w; x += P(0.3, p)) px(x, 0, 1, hh, C.steelD); }), top: tex('cabletraytop', (px, w, hh) => { px(0, 0, w, hh, C.steelD); for (let j = 1; j < hh - 1; j++) px(0, j, w, 1, [0x31292a, 0xc67e51, 0x3c5d84][j % 3]); }), sides: C.steelD } }); continue; }
    k.box({ x: 0, z: D / 2 - 0.03 - h / 2, y, w: W, d: h, h, faces: { front: tex(`pipe:${c}`, (px, w, hh, p) => { const base = 0x87959d; px(0, 0, w, hh, base); px(0, 0, w, 1, tone(base, 0.1)); px(0, hh - 1, w, 1, tone(base, -0.15)); for (let x = P(0.4, p); x < w; x += P(1.0, p)) px(x, 0, P(0.1, p, 2), hh, c); }), top: tone(0x87959d, 0.05), sides: 0x7c736b } });
  }
}
export function handhold(k, o) {
  const make = o.make ?? 'bar', c = make === 'ring' ? C.steel : C.hazard;
  k.comp();
  if (make === 'ring') { k.box({ x: 0, z: 0, w: 0.12, d: 0.05, h: 0.12, faces: { front: tex('ringhold', (px, w, h) => { px(0, 0, w, h, null); oval(px, w / 2, h / 2, w / 2, h / 2, c); oval(px, w / 2, h / 2, w / 2 - 2, h / 2 - 2, null); }), top: c, sides: c } }); return; }
  for (const sx of [-1, 1]) k.box({ x: sx * 0.13, z: -0.02, w: 0.03, d: 0.06, h: 0.06, faces: { sides: C.steelD } });
  k.box({ x: 0, z: 0.02, y: 0.02, w: 0.3, d: 0.03, h: 0.03, faces: { front: tex('handbar', (px, w, h) => { for (let i = 0; i < w; i++) px(i, 0, 1, h, Math.floor(i / 2) % 2 ? C.hazard : C.hazardD); }), top: C.hazard, sides: C.hazardD } });
}
export function emergencyLight(k, o) {
  const make = o.make ?? 'lamp';
  k.comp();
  if (make === 'night') {
    // (a night light at the foot of a wall: a small housing, its amber lens glowing when the mood lights night glows)
    k.box({ x: 0, z: 0, w: 0.16, d: 0.05, h: 0.08, faces: { front: tex('nightlight', (px, w, h) => { px(0, 0, w, h, 0x565b67); px(1, 1, w - 2, h - 2, 0xffb347, GLOW.NIGHT); }), top: 0x565b67, sides: 0x49403e } });
    k.lamp({ x: 0, z: 0.3, y: 0.3, r: 0.32, core: 0.4, ring: 0.1, kind: 'nightLight', color: 0xffb347 });
    return;
  }
  if (make === 'strip') {
    k.ground({ x0: -o.W / 2, z0: -0.04, x1: o.W / 2, z1: 0.04, color: 0xffa23a, glow: GLOW.STRIP, lift: 0.004 });
    k.glowLine({ kind: 'strip', x0: -o.W / 2, z0: 0, x1: o.W / 2, z1: 0 });
    return;
  }
  if (make === 'beacon') {
    k.box({ x: 0, z: 0, w: 0.14, d: 0.12, h: 0.06, faces: { sides: C.black } });
    k.box({ x: 0, z: 0, y: 0.06, w: 0.12, d: 0.1, h: 0.12, faces: { front: tex('beacon', (px, w, h) => { px(0, 0, w, h, 0xe7b84a, GLOW.EMERGENCY); px(1, 1, 1, h - 2, 0xf8e08a, GLOW.EMERGENCY); px(0, h - 1, w, 1, tone(0xe7b84a, -0.15), GLOW.EMERGENCY); }), top: tex('beacontop', (px, w, h) => px(0, 0, w, h, 0xe7b84a, GLOW.EMERGENCY)), sides: 0xe7b84a } });
    k.lamp({ x: 0, z: 0.8, y: 2.3, r: 1.6, core: 0.5, ring: 0.2, kind: 'emergency', color: 0xf0a93a });
    return;
  }
  k.box({ x: 0, z: 0, w: 0.36, d: 0.1, h: 0.14, faces: { front: tex('emlamp', (px, w, h, p) => { px(0, 0, w, h, 0x565b67); bevel(px, 0, 0, w, h, 0x565b67); px(1, 1, Math.floor(w * 0.6), h - 2, 0xffb347, GLOW.EMERGENCY); px(1, 1, Math.floor(w * 0.6), 1, 0xf8e08a, GLOW.EMERGENCY); statusLamp(px, w - 3, 2, 1, 0x9fe0b0, GLOW.ALWAYS); }), top: 0x565b67, sides: 0x49403e } });
  k.lamp({ x: 0, z: 0.8, y: 2.2, r: 1.6, core: 0.5, ring: 0.2, kind: 'emergency', color: 0xf0a93a });
}

