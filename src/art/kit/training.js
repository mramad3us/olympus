// OLYMPUS art: the kit of training. The gym's racks and weights, the centrifuge's gondola, the range.
//
// A marine's sol (DESIGN.md, Pitch): "PT under 0.38 g, the range, suit drills, classes, weapon cleaning,
// a centrifuge session to keep your body ready for Earth gravity". PLACES §4.9 sets the G-house (the
// Ring and the Long Arm: gondolas on arms, a seat in each, the rider strapped in for the session),
// §4.11 the field house (racks, benches, plates on rubber matting) and §4.12 the ranges (booths at a
// firing line, targets on carriers downrange). tradecraft's range set (src/art/furniture.js
// boothDivider, rangeBench, bulletTrap) is the model for the booths; OLYMPUS adds the carrier and the
// pop-up target, and the field make with sandbags (PLACES §3.14 sandbag: regolith bags, 0.5 m).
//
// Makes:
//   gymRack        'squat' (a power rack, a barbell on its hooks, plates on its pegs), 'dumbbells' (a
//                  two-tier rack of hex dumbbells), 'bench' (a bench press: its stand, the bar, plates),
//                  'plates' (a plate tree and a kettlebell row), all on a square of rubber matting
//   centrifuge     'pod' (a closed capsule on its arm's end: hatch, window, lights), 'open' (a gondola:
//                  a reclined seat in a frame, harness), 'arm' (the arm's end and its fairing)
//   rangeBooth     'indoor' (tradecraft's: a felt divider with its lane number, a bench with a rubber
//                  mat), 'baffled' (a steel baffle, the bench), 'field' (sandbags and a bench of planks)
//   targetCarrier  'carrier' (a frame hung from the overhead track, a paper target on it), 'stand'
//                  (tradecraft's paper target on a stand), 'popup' (a silhouette on its mechanism)
// Pure.
import { tex } from './kit.js';
import { C, U, P, bevel, oval, cloth, glass, statusLamp, screenFace, tone, hash3 } from './common.js';
import { paintedSteel, rubberMat, grimeFoot } from '../materials/index.js';
import { fontFor } from './type.js';

const rail = (c) => tex(`trainrail:${c}`, (px, w, h) => { px(0, 0, w, h, c); px(0, 0, w, 1, tone(c, 0.08)); if (h > 2) px(0, h - 1, w, 1, tone(c, -0.12)); });
const mat = tex('gymmat', (px, w, h, ppm) => rubberMat(px, 0, 0, w, h, { c: 0x31292a, ppm, kind: 'coin', tileM: 1.0, seed: 3 }));
const PLATE = { 20: 0x3c5d84, 15: 0xd0ac5e, 10: 0x538252, 5: 0xd6d0c9, 25: 0xb45150 };

/** A weight plate seen edge-on from the front at (x, y): its rim, colour by weight. */
function plateEdge(px, x, y, w, h, kg) { const c = PLATE[kg] ?? 0x31292a; px(x, y, w, h, c); px(x, y, w, 1, tone(c, 0.08)); px(x + w - 1, y, 1, h, tone(c, -0.12)); }
const barFace = tex('barbell', (px, w, h) => { px(0, 0, w, h, C.steel); px(0, 0, w, 1, tone(C.steel, 0.08)); px(0, h - 1, w, 1, tone(C.steel, -0.2)); });

export function gymRack(k, o) {
  const { W, D, ppm, seed } = o, make = o.make ?? 'squat';
  k.ground({ x0: -W / 2, z0: -D / 2, x1: W / 2, z1: D / 2, top: mat, lift: 0.003 });
  const fc = 0x31292a;
  if (make === 'squat') {
    k.comp();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box({ x: sx * (W / 2 - 0.12), z: sz * (D / 2 - 0.18), w: 0.07, d: 0.07, h: 2.25, faces: { front: tex('upright', (px, w, h, p) => { px(0, 0, w, h, fc); for (let y = P(0.3, p); y < h; y += P(0.05, p, 2)) px(Math.floor(w / 2), y, 1, 1, 0x7c736b); px(0, 0, 1, h, tone(fc, 0.1)); }), sides: fc, top: tone(fc, 0.1) } });
    for (const sz of [-1, 1]) k.box({ x: 0, z: sz * (D / 2 - 0.18), y: 2.2, w: W - 0.2, d: 0.06, h: 0.06, faces: { sides: fc, front: rail(fc) } });
    for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.12), z: 0, y: 0.05, w: 0.06, d: D - 0.3, h: 0.06, faces: { sides: fc } });
    // (the bar on its J-hooks at 1.3 m, loaded)
    k.comp();
    k.box({ x: 0, z: D / 2 - 0.18, y: 1.32, w: W + 0.5, d: 0.03, h: 0.03, faces: { front: barFace, sides: C.steel, top: C.steel } });
    for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) k.box({ x: sx * (W / 2 + 0.06 + i * 0.05), z: D / 2 - 0.18, y: 1.1, w: 0.045, d: 0.45, h: 0.45, faces: { front: tex(`plate:${i ? 15 : 20}`, (px, w, h) => plateEdge(px, 0, 0, w, h, i ? 15 : 20)), top: PLATE[i ? 15 : 20], sides: tex(`platefacing:${i ? 15 : 20}`, (px, w, h, p) => { px(0, 0, w, h, null); oval(px, w / 2, h / 2, w / 2, h / 2, PLATE[i ? 15 : 20]); oval(px, w / 2, h / 2, w / 2 - P(0.04, p, 1), h / 2 - P(0.04, p, 1), tone(PLATE[i ? 15 : 20], -0.06)); oval(px, w / 2, h / 2, P(0.03, p, 1), P(0.03, p, 1), C.steel); }) } });
    // (plates on the storage pegs at the back)
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { k.comp(); k.box({ x: sx * (W / 2 - 0.05 - i * 0.045), z: -D / 2 + 0.08, y: 0.1, w: 0.04, d: 0.4 - i * 0.06, h: 0.4 - i * 0.06, faces: { front: tex(`plate:${[25, 20, 10][i]}`, (px, w, h) => plateEdge(px, 0, 0, w, h, [25, 20, 10][i])), sides: PLATE[[25, 20, 10][i]], top: PLATE[[25, 20, 10][i]] } }); }
    return;
  }
  if (make === 'dumbbells') {
    k.comp();
    for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.05), z: 0, w: 0.06, d: 0.5, h: 0.85, faces: { sides: fc, front: rail(fc) } });
    for (const [y, z] of [[0.35, 0.08], [0.75, -0.1]]) {
      k.box({ x: 0, z, y, w: W, d: 0.3, h: 0.04, faces: { sides: fc, front: rail(fc), top: tex(`dbtier:${y}:${seed % 2}`, (px, w, h, p) => {
        px(0, 0, w, h, fc);
        const n = Math.max(3, Math.floor(w / P(0.2, p, 4)));
        for (let i = 0; i < n; i++) { const x = Math.floor((i + 0.5) * w / n), s = P(0.06 + i * 0.006, p, 2); px(x - s, 1, s, h - 2, 0x31292a); px(x + 1, 1, s, h - 2, 0x31292a); px(x - s, 1, s, 1, 0x565b67); px(x + 1, 1, s, 1, 0x565b67); px(x, Math.floor(h / 2), 1, 1, C.steel); }
      }) } });
      k.box({ x: 0, z: z + 0.15, y: y + 0.04, w: W, d: 0.02, h: 0.1, faces: { front: tex(`dbfront:${y}`, (px, w, h, p) => { const n = Math.max(3, Math.floor(w / P(0.2, p, 4))); px(0, 0, w, h, null); for (let i = 0; i < n; i++) { const x = Math.floor((i + 0.5) * w / n), s = P(0.06 + i * 0.006, p, 2); px(x - s, 0, s, h, 0x31292a); px(x + 1, 0, s, h, 0x31292a); px(x - s, 0, s, 1, 0x565b67); px(x + 1, 0, s, 1, 0x565b67); } }), sides: 0x31292a, top: 0x31292a } });
    }
    return;
  }
  if (make === 'bench') {
    k.comp();
    k.box({ x: 0, z: 0.15, w: 0.08, d: 1.1, h: 0.4, faces: { sides: fc } });
    k.box({ x: 0, z: 0.15, y: 0.4, w: 0.3, d: 1.15, h: 0.06, faces: { top: tex('benchpad', (px, w, h, p) => { px(0, 0, w, h, 0x31292a); px(1, 1, w - 2, h - 2, 0x8f3f31); cloth(px, 1, 1, w - 2, h - 2, 0x8f3f31, { u: U(p) }); px(1, 1, w - 2, 1, tone(0x8f3f31, 0.08)); }), front: rail(0x8f3f31), sides: 0x6e272f } });
    for (const sx of [-1, 1]) k.box({ x: sx * 0.5, z: -0.38, w: 0.06, d: 0.06, h: 1.15, faces: { sides: fc, front: rail(fc) } });
    k.comp();
    k.box({ x: 0, z: -0.38, y: 1.08, w: 2.0, d: 0.03, h: 0.03, faces: { front: barFace, sides: C.steel } });
    for (const sx of [-1, 1]) k.box({ x: sx * 0.72, z: -0.38, y: 0.86, w: 0.05, d: 0.45, h: 0.45, faces: { front: tex('plate:20', (px, w, h) => plateEdge(px, 0, 0, w, h, 20)), sides: PLATE[20], top: PLATE[20] } });
    return;
  }
  // plates: a plate tree and kettlebells along the mat
  k.comp();
  k.box({ x: -W / 2 + 0.3, z: 0, w: 0.5, d: 0.5, h: 0.05, faces: { sides: fc } });
  k.box({ x: -W / 2 + 0.3, z: 0, y: 0.05, w: 0.05, d: 0.05, h: 1.1, faces: { sides: fc } });
  for (let i = 0; i < 4; i++) { const kg = [25, 20, 15, 10][i]; k.box({ x: -W / 2 + 0.3 + (i % 2 ? 0.08 : -0.08), z: 0, y: 0.15 + Math.floor(i / 2) * 0.45, w: 0.04, d: 0.42, h: 0.42, faces: { front: tex(`plate:${kg}`, (px, w, h) => plateEdge(px, 0, 0, w, h, kg)), sides: PLATE[kg], top: PLATE[kg] } }); }
  for (let i = 0; i < 4; i++) { k.comp(); const s = 0.14 + i * 0.03; k.box({ x: -W / 2 + 0.8 + i * 0.3, z: 0.1, w: s, d: s, h: s * 1.2, faces: { front: tex(`kettlebell:${i}`, (px, w, h, p) => { px(0, 0, w, h, null); oval(px, w / 2, h * 0.62, w / 2, h * 0.4, 0x31292a); px(Math.floor(w * 0.25), 0, Math.ceil(w * 0.5), Math.max(1, P(0.025, p, 1)), 0x31292a); px(Math.floor(w * 0.25), 0, 1, Math.floor(h * 0.3), 0x31292a); px(Math.floor(w * 0.75), 0, 1, Math.floor(h * 0.3), 0x31292a); oval(px, w * 0.4, h * 0.55, w / 6, h / 8, 0x565b67); }), top: 0x31292a, sides: 0x31292a } }); }
}

// ---------- the centrifuge ----------

const couchTop = (c, harness) => tex(`couchtop:${c}:${harness}`, (px, w, h, ppm) => {
  // (a body-contoured seat seen from above: headrest, shoulders, seat, legs; a 5-point harness laid open)
  px(0, 0, w, h, null);
  const u = U(ppm), cx = w / 2;
  const shape = (t) => (t < 0.16 ? 0.36 : t < 0.2 ? 0.3 : t < 0.55 ? 0.48 : t < 0.62 ? 0.44 : 0.4);
  for (let j = 0; j < h; j++) { const t = j / h, half = Math.round(shape(t) * w / 2 * 2) / 2; px(Math.round(cx - half), j, Math.max(1, Math.round(2 * half)), 1, c); }
  for (let j = 0; j < h; j++) { const t = j / h, half = Math.round(shape(t) * w / 2 * 2) / 2; px(Math.round(cx - half), j, 1, 1, tone(c, 0.07)); px(Math.round(cx + half) - 1, j, 1, 1, tone(c, -0.1)); }
  // (the seams of the gel pads)
  for (const t of [0.16, 0.36, 0.55, 0.78]) px(Math.round(cx - w * 0.2), Math.floor(t * h), Math.round(w * 0.4), 1, tone(c, -0.08));
  cloth(px, Math.round(cx - w * 0.18), Math.floor(0.22 * h), Math.round(w * 0.36), Math.floor(0.3 * h), c, { seed: 4, u, k: 0.7 });
  if (harness) {
    const s = C.black, b = 0x7c736b;
    for (let j = Math.floor(0.2 * h); j < 0.5 * h; j++) { const t = (j - 0.2 * h) / (0.3 * h); px(Math.round(cx - w * 0.3 + t * w * 0.24), j, Math.max(1, Math.round(u)), 1, s); px(Math.round(cx + w * 0.3 - t * w * 0.24), j, Math.max(1, Math.round(u)), 1, s); }
    px(Math.round(cx - w * 0.06), Math.floor(0.5 * h), Math.max(2, Math.round(w * 0.12)), Math.max(2, Math.round(2 * u)), b);
    px(Math.round(cx), Math.floor(0.52 * h), Math.max(1, Math.round(u)), Math.floor(0.08 * h), s);
  }
});
export function centrifuge(k, o) {
  const { W, D, ppm, seed } = o, make = o.make ?? 'pod';
  const shell = 0xd6d0c9, frame = 0x565b67;
  if (make === 'arm') {
    k.comp();
    k.box({ x: 0, z: -D / 2 + 0.3, y: 1.6, w: 0.5, d: 0.6, h: 0.5, faces: { front: tex('armend', (px, w, h, p) => { paintedSteel(px, 0, 0, w, h, { c: frame, ppm: p, seed: 2 }); px(2, 2, w - 4, 1, 0xd0ac5e); px(2, h - 3, w - 4, 1, 0xd0ac5e); }), top: tex('armtop', (px, w, h, p) => { paintedSteel(px, 0, 0, w, h, { c: frame, ppm: p, seed: 3 }); for (let i = 1; i < w - 1; i += 3) px(i, 1, 1, h - 2, 0xd0ac5e); }), sides: frame } });
    k.box({ x: 0, z: 0.25, y: 1.85, w: 0.12, d: 1.5, h: 0.12, faces: { top: tex('armcable', (px, w, h) => { px(0, 0, w, h, 0x31292a); px(1, 0, 1, h, 0xb45150); px(w - 2, 0, 1, h, 0x4d79a1); }), front: rail(0x31292a), sides: 0x31292a } });
    k.comp();
    k.box({ x: 0, z: 0.4, y: 0.4, w: 1.5, d: 1.6, h: 1.4, faces: { front: tex('gondolafront', (px, w, h, p) => { paintedSteel(px, 0, 0, w, h, { c: shell, ppm: p, seed: 5 }); glass(px, Math.floor(w * 0.2), Math.floor(h * 0.15), Math.floor(w * 0.6), Math.floor(h * 0.35), 0x3c5d84, { dark: true }); fontFor(p).stencil(px, 3, h - fontFor(p).h - 3, 'LONG ARM 2', 0x8f3f31); statusLamp(px, w - 5, 3, Math.max(1, Math.round(U(p))), 0x9fe0b0, 1); }), top: tex('gondolatop', (px, w, h, p) => { paintedSteel(px, 0, 0, w, h, { c: tone(shell, 0.03), ppm: p, seed: 6 }); oval(px, w / 2, h / 2, P(0.2, p, 3), P(0.2, p, 3), frame); oval(px, w / 2, h / 2, P(0.1, p, 2), P(0.1, p, 2), C.steel); }), sides: tone(shell, -0.06) } });
    return;
  }
  if (make === 'open') {
    k.comp();
    for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.15), z: 0, y: 0.2, w: 0.1, d: D - 0.3, h: 0.1, faces: { sides: frame, top: tone(frame, 0.08) } });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box({ x: sx * (W / 2 - 0.15), z: sz * (D / 2 - 0.3), w: 0.1, d: 0.1, h: 2.2, faces: { sides: frame, front: rail(frame) } });
    for (const sz of [-1, 1]) k.box({ x: 0, z: sz * (D / 2 - 0.3), y: 2.1, w: W - 0.2, d: 0.1, h: 0.1, faces: { sides: frame, front: rail(0xd0ac5e), top: 0xd0ac5e } });
    k.box({ x: 0, z: 0, y: 0.3, w: 0.4, d: 0.4, h: 0.25, faces: { sides: 0x31292a } });
    k.comp();
    k.box({ x: 0, z: 0.05, y: 0.55, w: 0.7, d: 1.9, h: 0.16, faces: { top: couchTop(0x4d5a7b, true), front: rail(0x4d5a7b), sides: 0x3c405d } });
    k.box({ x: 0.5, z: -0.3, y: 0.7, w: 0.2, d: 0.3, h: 0.25, faces: { front: tex('gondolapanel', (px, w, h, p) => screenFace(px, 0, 0, w, h, { kind: 'graph', seed: 3 })), top: C.black, sides: C.black } });
    k.lamp({ x: 0, z: 0, y: 2.1, r: 1.2, core: 0.45, ring: 0.18, kind: 'ceiling', color: 0xe8eef6 });
    return;
  }
  // pod: a closed capsule, its hatch on the front, a window, running lights, the arm's yoke over it
  k.comp();
  k.box({ x: 0, z: 0.1, y: 0.25, w: W - 0.2, d: D - 0.6, h: 1.85, faces: { front: tex(`podfront:${seed % 2}`, (px, w, h, p) => {
    paintedSteel(px, 0, 0, w, h, { c: shell, ppm: p, seed: 8 });
    const hw = Math.floor(w * 0.5), hx = Math.floor((w - hw) / 2), hy = P(0.2, p);
    px(hx - 1, hy - 1, hw + 2, h - hy - P(0.1, p) + 2, C.steelDD); px(hx, hy, hw, h - hy - P(0.1, p), tone(shell, -0.05)); bevel(px, hx, hy, hw, h - hy - P(0.1, p), shell, 1.3);
    glass(px, hx + P(0.12, p), hy + P(0.15, p), hw - 2 * P(0.12, p), P(0.35, p, 4), 0x3c5d84, { dark: true });
    for (let y = hy + 2; y < h - P(0.2, p); y += P(0.3, p, 4)) { px(hx - 2, y, 2, 1, 0xd0ac5e); px(hx + hw, y, 2, 1, 0xd0ac5e); }
    statusLamp(px, hx + hw - P(0.12, p, 3), hy + P(0.6, p), Math.max(1, Math.round(U(p))), 0x9fe0b0, 1);
    statusLamp(px, P(0.08, p, 2), P(0.1, p, 2), Math.max(1, Math.round(U(p))), 0xe7b84a, 6);
    const f = fontFor(p), s = 'RING 4'; if (f.width(s) < w - 6) f.stencil(px, Math.floor((w - f.width(s)) / 2), hy - f.h - 2 > 0 ? hy - f.h - 2 : 1, s, 0x8f3f31);
    grimeFoot(px, 0, 0, w, h, shell, { ppm: p, upM: 0.3, seed: 9 });
  }), top: tex('podtop', (px, w, h, p) => { paintedSteel(px, 0, 0, w, h, { c: tone(shell, 0.04), ppm: p, seed: 10 }); bevel(px, 0, 0, w, h, shell, 1.3); for (let i = 3; i < w - 3; i += P(0.25, p, 3)) px(i, 2, 1, h - 4, tone(shell, -0.05)); }), sides: tone(shell, -0.06), back: tone(shell, -0.08) } });
  k.box({ x: 0, z: 0.1, y: 0, w: W - 0.6, d: D - 1.0, h: 0.25, faces: { sides: frame, front: rail(frame) } });
  k.comp();
  for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.05), z: 0.1, y: 0.9, w: 0.1, d: 0.3, h: 1.4, faces: { sides: frame, front: rail(frame) } });
  k.box({ x: 0, z: 0.1, y: 2.2, w: W, d: 0.3, h: 0.1, faces: { sides: frame, top: tone(frame, 0.08), front: rail(frame) } });
}

// ---------- the range ----------

const dividerFace = (make, n) => tex(`divider:${make}:${n}`, (px, w, h, ppm) => {
  if (make === 'baffled') { paintedSteel(px, 0, 0, w, h, { c: 0x565b67, ppm, seed: 3 }); for (let y = P(0.2, ppm); y < h; y += P(0.25, ppm, 3)) px(1, y, w - 2, 1, tone(0x565b67, -0.1)); }
  else {
    const felt = 0x3e424d, frame = 0x87959d;
    px(0, 0, w, h, frame); px(1, 1, w - 2, h - 3, felt);
    for (let y = 2; y < h - 3; y += 2) for (let x = 2 + ((y / 2) % 2); x < w - 2; x += 3) px(x, y, 1, 1, tone(felt, 0.05));
    px(0, 0, w, 1, tone(frame, 0.1)); px(0, h - 2, w, 2, 0x282b34);
  }
  if (n) { const f = fontFor(ppm), s = String(n), pw = f.width(s) + 4, ph = f.h + 4; px(2, 3, pw, ph, C.paper); px(2, 3 + ph - 1, pw, 1, 0xc4ac97); f.text(px, 4, 5, s, C.ink); }
});
export function rangeBooth(k, o) {
  const { W, D, seed } = o, make = o.make ?? 'indoor', look = o.look ?? {};
  k.comp();
  if (make === 'field') {
    // (sandbags stacked to a rest, a bench of planks behind them)
    for (let row = 0; row < 3; row++) for (let i = 0; i < 3 - (row % 2); i++) {
      k.comp();
      k.box({ x: -W / 2 + 0.2 + i * 0.36 + (row % 2) * 0.18, z: D / 2 - 0.2, y: row * 0.17, w: 0.36, d: 0.28, h: 0.17, faces: { front: tex(`sandbag:${(i + row) % 3}`, (px, w, h, p) => { const c = 0x9c917a; px(0, 0, w, h, c); cloth(px, 0, 0, w, h, c, { seed: i + row, u: U(p) }); px(0, 0, w, 1, tone(c, 0.06)); px(0, h - 1, w, 1, tone(c, -0.12)); px(0, 0, 1, h, tone(c, -0.05)); px(w - 1, 0, 1, h, tone(c, -0.1)); px(Math.floor(w * 0.85), 1, 1, h - 2, tone(c, -0.08)); }), top: tex('sandbagtop', (px, w, h, p) => { cloth(px, 0, 0, w, h, 0x9c917a, { u: U(p) }); px(0, h - 1, w, 1, tone(0x9c917a, 0.04)); }), sides: 0x7f735a } });
    }
    k.comp();
    k.box({ x: 0, z: -0.15, w: W, d: 0.35, h: 0.45, faces: { top: tex('plankbench', (px, w, h, p) => { for (let j = 0; j < h; j += P(0.12, p, 3)) { px(0, j, w, P(0.12, p, 3) - 1, tone(0x8c6d59, (j % 3) * 0.01)); px(0, j + P(0.12, p, 3) - 1, w, 1, tone(0x8c6d59, -0.15)); } }), front: rail(0x8c6d59), sides: 0x573a37 } });
    return;
  }
  // (the divider on the booth's left, the lane's number on it; the bench across its front)
  k.box({ x0: -W / 2, x1: -W / 2 + 0.05, z0: -D / 2, z1: D / 2, y: 0, h: 1.6, faces: { front: dividerFace(make, look.n ?? 0), right: dividerFace(make, 0), left: dividerFace(make, 0), top: 0x87959d } });
  if (look.end) k.box({ x0: W / 2 - 0.05, x1: W / 2, z0: -D / 2, z1: D / 2, y: 0, h: 1.6, faces: { front: dividerFace(make, 0), right: dividerFace(make, 0), left: dividerFace(make, 0), top: 0x87959d } });
  k.comp();
  const steel = 0x6e7582;
  for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.12), z: -D / 2 + 0.3, w: 0.04, d: 0.04, h: 0.9, faces: { sides: steel } });
  k.box({ x: 0, z: -D / 2 + 0.3, y: 0.3, w: W - 0.25, d: 0.4, h: 0.03, faces: { top: tex('benchshelf', (px, w, h, p) => { px(0, 0, w, h, steel); px(Math.floor(w * 0.2), 1, P(0.25, p, 4), h - 2, 0x4c633d); px(Math.floor(w * 0.2), 1, P(0.25, p, 4), 1, tone(0x4c633d, 0.08)); }), sides: steel } });
  k.box({ x: 0, z: -D / 2 + 0.3, y: 0.9, w: W - 0.2, d: 0.5, h: 0.04, faces: { top: tex(`rangebench:${seed % 2}`, (px, w, h, p) => {
    const m = 0x24503a, rim = 0x282b34; px(0, 0, w, h, rim); px(1, 1, w - 2, h - 2, m); px(1, 1, w - 2, 1, tone(m, 0.1));
    for (let x = 3; x < w - 2; x += P(0.25, p, 4)) px(x, Math.floor(h / 2), 1, 1, tone(m, -0.08));
    // (ear defenders, a box of rounds, a magazine)
    const ex = Math.floor(w * 0.65), ey = Math.floor(h * 0.3); px(ex, ey, P(0.18, p, 3), P(0.06, p, 1), C.black); oval(px, ex, ey + 1, P(0.04, p, 1), P(0.05, p, 1), 0xd0ac5e); oval(px, ex + P(0.18, p, 3), ey + 1, P(0.04, p, 1), P(0.05, p, 1), 0xd0ac5e);
    px(Math.floor(w * 0.15), Math.floor(h * 0.35), P(0.12, p, 2), P(0.08, p, 2), 0xb45150); px(Math.floor(w * 0.15), Math.floor(h * 0.35), P(0.12, p, 2), 1, C.paper);
    if (seed % 2) { px(Math.floor(w * 0.4), Math.floor(h * 0.5), P(0.2, p, 3), P(0.04, p, 1), C.black); px(Math.floor(w * 0.4) + P(0.2, p, 3) - 1, Math.floor(h * 0.5), 1, 1, 0xd0ac5e); }
    px(0, h - 1, w, 1, tone(rim, 0.12));
  }), front: rail(0x282b34), sides: 0x282b34 } });
}
/** A paper target face: a stand's or a carrier's frame, a backer, a chest silhouette, the rings (tradecraft paperFrame). */
const targetFace = (kind) => tex(`target:${kind}`, (px, w, h, ppm) => {
  const u = U(ppm);
  px(0, 0, w, h, null);
  const fw = Math.max(1, Math.round(u)), m = P(0.04, ppm, 1);
  if (kind !== 'popup') { px(0, 0, w, h - P(0.5, ppm), 0xb28a59); px(fw, fw, w - 2 * fw, h - P(0.5, ppm) - 2 * fw, 0xc4ac97); }
  const px0 = m + fw, py0 = m + fw, pw = w - 2 * (m + fw), ph = h - P(0.5, ppm) - 2 * (m + fw);
  if (kind === 'popup') {
    // (an E-type silhouette, olive, on its arm)
    const c = 0x737949, cx = w / 2;
    for (let j = 0; j < h - P(0.35, ppm); j++) { const t = j / (h - P(0.35, ppm)), half = t < 0.25 ? w * 0.16 : w * 0.46; px(Math.round(cx - half), j, Math.round(2 * half), 1, c); }
    px(Math.floor(cx) - 1, h - P(0.35, ppm), 2, P(0.35, ppm), C.steelD);
    px(Math.round(cx - w * 0.16), 0, Math.round(w * 0.32), 1, tone(c, 0.08));
    return;
  }
  px(px0, py0, pw, ph, C.paper);
  const cx = px0 + pw / 2, s = 0x1d2b46;
  for (let j = 0; j < ph; j++) { const t = j / ph, half = t < 0.3 ? pw * 0.15 : t < 0.36 ? pw * 0.2 : pw * 0.4; px(Math.round(cx - half), py0 + j + Math.round(ph * 0.08), Math.round(2 * half), 1, s); if (j + Math.round(ph * 0.08) >= ph - 1) break; }
  for (const rr of [0.28, 0.18, 0.08]) { const r = pw * rr; for (let a = 0; a < 40; a++) { const x = Math.round(cx + Math.cos(a / 40 * Math.PI * 2) * r), y = Math.round(py0 + ph * 0.6 + Math.sin(a / 40 * Math.PI * 2) * r); px(x, y, 1, 1, C.paper); } }
  for (let i = 0; i < 5; i++) { const hh = hash3(i, 31); px(Math.round(cx - pw * 0.15 + (hh % Math.max(1, Math.round(pw * 0.3)))), Math.round(py0 + ph * 0.45 + ((hh >>> 8) % Math.max(1, Math.round(ph * 0.3)))), 1, 1, C.ink); }
  px(Math.floor(w / 2) - fw, h - P(0.5, ppm), 2 * fw, P(0.5, ppm), 0x573a37);
});
export function targetCarrier(k, o) {
  const { W, D } = o, make = o.make ?? 'carrier';
  if (make === 'carrier') {
    k.comp();
    k.box({ x: 0, z: 0, y: 2.3, w: 0.12, d: D * 3, h: 0.1, faces: { top: tex('track', (px, w, h) => { px(0, 0, w, h, 0x31292a); px(Math.floor(w / 2), 0, 1, h, 0x7c736b); }), front: rail(0x31292a), sides: 0x31292a } });
    k.box({ x: 0, z: 0, y: 2.1, w: 0.25, d: 0.2, h: 0.2, faces: { front: tex('carrierbox', (px, w, h, p) => { px(0, 0, w, h, 0x565b67); bevel(px, 0, 0, w, h, 0x565b67); statusLamp(px, 2, 2, Math.max(1, Math.round(U(p))), 0xb45150, 1); }), sides: 0x565b67, top: 0x565b67 } });
    k.comp();
    k.box({ x: 0, z: 0, y: 1.0, w: 0.02, d: 0.02, h: 1.1, faces: { sides: C.steelD } });
    k.box({ x: 0, z: 0, y: 0.95, w: 0.65, d: 0.03, h: 0.7, faces: { front: tex('carriertarget', (px, w, h, p) => { px(0, 0, w, h, C.steelD); px(1, 1, w - 2, h - 2, C.paper); const cx = w / 2; for (let j = 2; j < h - 2; j++) { const t = j / h, half = t < 0.3 ? w * 0.12 : w * 0.36; px(Math.round(cx - half), j, Math.round(2 * half), 1, 0x1d2b46); } for (const rr of [0.25, 0.15]) for (let a = 0; a < 36; a++) px(Math.round(cx + Math.cos(a / 36 * 6.283) * w * rr), Math.round(h * 0.6 + Math.sin(a / 36 * 6.283) * w * rr), 1, 1, C.paper); }), back: C.paper, sides: C.steelD, top: C.steelD } });
    return;
  }
  k.comp();
  k.box({ x: 0, z: 0, w: 0.5, d: 0.08, h: make === 'popup' ? 1.3 : 1.7, faces: { front: targetFace(make), back: targetFace(make), sides: 0x573a37, top: 0xb28a59 } });
  k.box({ x: 0, z: 0, w: 0.5, d: 0.35, h: 0.06, faces: { sides: make === 'popup' ? 0x565b67 : 0x573a37, top: make === 'popup' ? tex('popupbase', (px, w, h) => { px(0, 0, w, h, 0x565b67); px(1, 1, w - 2, 1, 0xd0ac5e); }) : 0x573a37 } });
}
