// OLYMPUS art: the kit of the head and the laundry. Shower stalls, toilet stalls, urinals, sinks, fountains, washers.
//
// PLACES §4.4 sets the barracks' heads (side A: five shower heads in a room with a drying area,
// basins with a mirror on the north wall, toilet stalls on the east wall, urinals, a privacy baffle)
// and the laundry (washers, dryers, a folding table); VIEWS §3.4 how a marine shows in them: in the
// shower "the stall's curtain covers shoulders to shins; above it wet hair, below it bare feet; steam
// from the stall", in a stall "the door shut, boots visible under the gap (the door is furniture with
// an OCCUPIED slide)". So a shower stall's curtain hangs from 0.3 m to 1.8 m, a toilet stall's
// partitions and door stand 0.25 m off the floor, and the door carries its slide.
//
// A stall is built with its left partition; the last of a row (look.end) adds its right one, so a row
// of n stalls is n + 1 partitions. Partitions are boxes whose fronts (their edges, seen end-on) are
// thin; what reads is the curtain or the door across each stall's front and the fittings inside seen
// over the top: the shower head and its pipe, the toilet's bowl, the drain in the stall's floor
// (painted on a flat piece: tradecraft's "flat things are painted").
//
// Makes and looks:
//   showerStall    make 'curtain' | 'door' (frosted) | 'open' (a gang shower's post); look { curtain:
//                  'closed' | 'open' | 'half', colour, end, wet (the floor darker), steam }
//   toiletStall    make 'steel' | 'laminate' | 'ship' (a vacuum toilet, handholds); look { door: 'closed' |
//                  'open', occupied (boots under the door), end }
//   urinal         make 'wall' | 'trough'
//   sinkRow        make 'counter' (basins in a counter, a mirror over it), 'trough' (a steel trough, taps
//                  in a row), 'pedestal' (basins on pedestals, a mirror each); w: its length; look { fog }
//   waterFountain  make 'wall' | 'bottle' (a bottle filler, its counter lit) | 'cooler' (a jug on a cooler)
//   washer         make 'washer' | 'dryer' | 'stack' (a dryer on a washer); look { running }
// Pure.
import { tex } from './kit.js';
import { C, U, P, bevel, sunk, oval, folds, mirror, glass, tone, hash3 } from './common.js';
import { paintedSteel, ceramic, grimeFoot, scuffs, stain } from '../materials/index.js';
import { fontFor } from './type.js';

const rail = (c) => tex(`headrail:${c}`, (px, w, h) => { px(0, 0, w, h, c); px(0, 0, w, 1, tone(c, 0.08)); if (h > 2) px(0, h - 1, w, 1, tone(c, -0.12)); });
const PORCELAIN = 0xd6d0c9, TILE = 0xc7d5d0;
const CURTAINS = { white: 0xd6d0c9, blue: 0x4d79a1, olive: 0x737949, grey: 0x87959d };

/** A tiled panel (a partition's or a wall's), painted in world pixels so its grid runs on. */
const tiledPanel = (c) => tex(`tiled:${c}`, (px, w, h, ppm) => { ceramic(px, 0, 0, w, h, { c, ppm, tileM: 0.15, seed: 4 }); grimeFoot(px, 0, 0, w, h, c, { ppm, upM: 0.2, seed: 5 }); });
const panelFace = (c) => tex(`stallpanel:${c}`, (px, w, h, ppm) => { paintedSteel(px, 0, 0, w, h, { c, ppm, seed: 7 }); scuffs(px, 0, 0, w, h, c, { ppm, seed: 3, lowM: 0.6 }); });

// ---------- showers ----------

const curtainFace = (colour, state, seed) => tex(`curtain:${colour}:${state}:${seed % 3}`, (px, w, h, ppm) => {
  const c = CURTAINS[colour] ?? colour, u = U(ppm);
  px(0, 0, w, h, null);
  const cover = state === 'open' ? 0.22 : state === 'half' ? 0.55 : 1;
  const cw = Math.max(2, Math.round(w * cover)), x0 = state === 'closed' ? 0 : 0;
  for (let i = x0; i < x0 + cw; i++) {
    const fold = Math.floor(i / Math.max(2, Math.round(3 * u))) % 2;
    for (let j = 0; j < h; j++) px(i, j, 1, 1, tone(c, fold ? -0.04 : 0.02) );
  }
  folds(px, x0, 0, cw, h, c, { n: 3, seed, vertical: true });
  for (let i = x0; i < x0 + cw; i += Math.max(2, Math.round(3 * u))) px(i, 0, 1, 1, C.steel);   // (the rings)
  px(x0, h - 1, cw, 1, tone(c, -0.1));
  // (wet: darker along its hem, and a few drips)
  for (let i = x0; i < x0 + cw; i++) if (hash3(i, seed) % 3 === 0) px(i, h - 2 - (hash3(i, 5) % Math.max(1, Math.round(2 * u))), 1, 1, tone(c, -0.08));
});
const stallFloor = (wet, seed) => tex(`stallfloor:${wet}:${seed % 2}`, (px, w, h, ppm) => {
  const c = wet ? tone(0xa5b5b6, -0.08) : 0xa5b5b6;
  ceramic(px, 0, 0, w, h, { c, ppm, tileM: 0.1, seed: 9 });
  // (the drain: a round grate in the middle, the floor falling to it)
  const cx = w / 2, cy = h / 2, r = Math.max(2, P(0.07, ppm));
  oval(px, cx, cy, r + 1, r + 1, tone(c, -0.1)); oval(px, cx, cy, r, r, 0x565b67);
  for (let j = Math.floor(cy - r) + 1; j < cy + r; j += 2) px(Math.floor(cx - r) + 1, j, Math.max(1, 2 * r - 1), 1, 0x31292a);
  px(Math.floor(cx - r), Math.floor(cy - r), Math.max(1, r), 1, tone(0x565b67, 0.1));
  if (wet) for (let k = 0; k < 6; k++) { const hh = hash3(k, seed); stain(px, hh % w, (hh >>> 8) % h, Math.max(1, Math.round(U(ppm) * 2)), c, { dL: -0.04, clip: [0, 0, w, h] }); }
});
const showerHead = tex('showerhead', (px, w, h) => { px(0, 0, w, h, C.chrome); px(0, 0, w, 1, tone(C.chrome, 0.06)); px(0, h - 1, w, 1, tone(C.chrome, -0.15)); for (let i = 1; i < w - 1; i += 2) px(i, h - 1, 1, 1, 0x565b67); });
const soapShelf = tex('soapshelf', (px, w, h) => { px(0, 0, w, h, C.chrome); px(1, 0, Math.max(1, Math.floor(w / 3)), Math.max(1, h - 1), 0x669f93); px(Math.floor(w / 2) + 1, 0, Math.max(1, Math.floor(w / 4)), Math.max(1, h - 1), 0xd0ac5e); });

export function showerStall(k, o) {
  const { W, D, seed } = o, make = o.make ?? 'curtain', look = o.look ?? {};
  const panel = make === 'open' ? null : tiledPanel(TILE), t = 0.05, ph = 1.95;
  // (the stall's floor: its tiles and its drain, wet when it has been used)
  k.ground({ x0: -W / 2, z0: -D / 2, x1: W / 2, z1: D / 2, top: stallFloor(look.wet ?? true, seed), lift: 0.003 });
  if (make === 'open') {
    k.comp();
    k.box({ x: 0, z: -D / 2 + 0.06, w: 0.12, d: 0.12, h: 2.1, faces: { sides: C.steel, front: rail(C.chrome), top: C.chrome } });
    for (const sx of [-1, 1]) k.box({ x: sx * 0.1, z: -D / 2 + 0.06, y: 1.85, w: 0.1, d: 0.1, h: 0.05, faces: { front: showerHead, sides: C.chrome, bottom: showerHead } });
    return;
  }
  k.comp();
  k.box({ x0: -W / 2, x1: -W / 2 + t, z0: -D / 2, z1: D / 2, y: 0, h: ph, faces: { right: panel, left: panel, front: rail(tone(TILE, -0.05)), top: tone(TILE, -0.15) } });
  if (look.end) k.box({ x0: W / 2 - t, x1: W / 2, z0: -D / 2, z1: D / 2, y: 0, h: ph, faces: { right: panel, left: panel, front: rail(tone(TILE, -0.05)), top: tone(TILE, -0.15) } });
  // (the back: the shower head on its pipe, the valve, the soap shelf)
  k.comp();
  k.box({ x: 0.1, z: -D / 2 + 0.06, y: 1.86, w: 0.12, d: 0.12, h: 0.06, faces: { front: showerHead, top: C.chrome, sides: C.chrome } });
  k.box({ x: 0.1, z: -D / 2 + 0.04, y: 1.15, w: 0.12, d: 0.05, h: 0.12, faces: { front: tex('valve', (px, w, h) => { px(0, 0, w, h, C.chrome); oval(px, w / 2, h / 2, w / 3, h / 3, 0xb45150); px(Math.floor(w / 2), 1, 1, h - 2, C.paper); }), sides: C.chrome } });
  k.box({ x: -0.22, z: -D / 2 + 0.05, y: 1.25, w: 0.22, d: 0.08, h: 0.04, faces: { top: soapShelf, front: rail(C.chrome), sides: C.chrome } });
  // (the front: the curtain on its rod, or a frosted door)
  k.comp();
  k.box({ x: 0, z: D / 2 - 0.03, y: 1.92, w: W, d: 0.025, h: 0.025, faces: { sides: C.chrome, front: rail(C.chrome) } });
  if (make === 'door') {
    k.box({ x: 0, z: D / 2 - 0.03, y: 0.25, w: W - 2 * t - 0.02, d: 0.03, h: 1.6, faces: { front: tex('showerdoor', (px, w, h, p) => { px(0, 0, w, h, C.chrome); for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) px(i, j, 1, 1, (i * 3 + j) % 7 === 0 ? 0xc7d5d0 : 0xa5b5b6); glass(px, 2, 2, w - 4, Math.floor(h / 3), 0xa5b5b6); handleRail(px, w - P(0.08, p, 2), Math.floor(h / 2), P(0.25, p, 4)); }), sides: C.chrome, top: C.chrome } });
  } else {
    k.box({ x: 0, z: D / 2 - 0.03, y: 0.3, w: W - 2 * t - 0.02, d: 0.02, h: 1.6, faces: { front: curtainFace(look.colour ?? 'white', look.curtain ?? 'closed', seed), back: curtainFace(look.colour ?? 'white', look.curtain ?? 'closed', seed), sides: CURTAINS[look.colour ?? 'white'] ?? 0xd6d0c9, top: C.chrome } });
  }
}
function handleRail(px, x, y, len) { px(x, y, 1, len, C.steel); px(x + 1, y, 1, len, tone(C.steel, -0.2)); }

// ---------- toilets ----------

const stallDoor = (c, occupied) => tex(`stalldoor:${c}:${occupied}`, (px, w, h, ppm) => {
  paintedSteel(px, 0, 0, w, h, { c, ppm, seed: 13 });
  sunk(px, P(0.04, ppm), P(0.04, ppm), w - 2 * P(0.04, ppm), h - 2 * P(0.04, ppm), tone(c, -0.015), 0.6);
  // (the OCCUPIED slide: red when bolted, green when free)
  const sx = w - P(0.14, ppm, 4), sy = Math.floor(h * 0.42), sw = P(0.1, ppm, 3), sh = Math.max(2, P(0.035, ppm, 2));
  px(sx - 1, sy - 1, sw + 2, sh + 2, C.steelD); px(sx, sy, sw, sh, occupied ? 0xb45150 : 0x538252);
  px(sx + sw + 2, sy + sh + 1, 1, P(0.08, ppm, 2), C.steel);
  scuffs(px, 0, 0, w, h, c, { ppm, seed: 9, lowM: 0.3, k: 1.3 });
  // (graffiti scratched and painted over: every head has some)
  if (w > 10) { px(P(0.12, ppm), Math.floor(h * 0.3), P(0.12, ppm, 3), 1, tone(c, -0.05)); px(P(0.14, ppm), Math.floor(h * 0.3) + 2, P(0.08, ppm, 2), 1, tone(c, -0.05)); }
});
const toiletTop = (make) => tex(`toilettop:${make}`, (px, w, h, ppm) => {
  px(0, 0, w, h, null);
  const c = make === 'ship' ? C.chrome : PORCELAIN;
  oval(px, w / 2, h / 2 + 0.5, w / 2, h / 2, c);
  oval(px, w / 2, h / 2 + 0.5, w / 2 - P(0.04, ppm, 1), h / 2 - P(0.04, ppm, 1), make === 'ship' ? 0x87959d : C.paper);
  oval(px, w / 2, h / 2 + 1, w / 2 - P(0.08, ppm, 2), h / 2 - P(0.09, ppm, 2), make === 'ship' ? 0x31292a : 0x86bdbc);
  oval(px, w / 2, h / 2 + 1, w / 4, h / 5, make === 'ship' ? C.black : 0x5d9db1);
});
export function toiletStall(k, o) {
  const { W, D, seed } = o, make = o.make ?? 'steel', look = o.look ?? {};
  const c = make === 'laminate' ? 0xc4ac97 : make === 'ship' ? 0x87959d : 0x6e7582, t = 0.04, y0 = make === 'ship' ? 0 : 0.25, top = 1.85;
  k.comp();
  k.box({ x0: -W / 2, x1: -W / 2 + t, z0: -D / 2, z1: D / 2, y: y0, h: top - y0, faces: { right: panelFace(c), left: panelFace(c), front: rail(tone(c, 0.05)), top: tone(c, -0.1) } });
  if (look.end) k.box({ x0: W / 2 - t, x1: W / 2, z0: -D / 2, z1: D / 2, y: y0, h: top - y0, faces: { right: panelFace(c), left: panelFace(c), front: rail(tone(c, 0.05)), top: tone(c, -0.1) } });
  // (the toilet against the back: its bowl seen from above over the partitions, a flush valve's pipe up the wall)
  k.comp();
  k.box({ x: 0, z: -D / 2 + 0.38, w: 0.22, d: 0.3, h: 0.32, faces: { sides: make === 'ship' ? C.chrome : PORCELAIN, front: rail(make === 'ship' ? C.chrome : PORCELAIN) } });
  k.box({ x: 0, z: -D / 2 + 0.38, y: 0.32, w: 0.38, d: 0.5, h: 0.08, faces: { top: toiletTop(make), sides: make === 'ship' ? C.chrome : PORCELAIN, front: rail(make === 'ship' ? C.chrome : PORCELAIN) } });
  k.box({ x: 0, z: -D / 2 + 0.06, y: 0.35, w: 0.06, d: 0.06, h: 0.6, faces: { sides: C.chrome, front: rail(C.chrome) } });
  k.box({ x: 0, z: -D / 2 + 0.06, y: 0.95, w: 0.14, d: 0.08, h: 0.08, faces: { sides: C.chrome, front: tex('flushvalve', (px, w, h) => { px(0, 0, w, h, C.chrome); px(w - 2, 1, 2, 1, C.black); }) } });
  k.box({ x: W / 2 - 0.12, z: -D / 2 + 0.55, y: 0.65, w: 0.06, d: 0.14, h: 0.14, faces: { sides: C.chrome, top: tex('tp', (px, w, h) => { px(0, 0, w, h, C.chrome); oval(px, w / 2, h / 2, w / 2, h / 2, C.paper); }) } });
  if (make === 'ship') k.box({ x: -W / 2 + 0.08, z: -D / 2 + 0.3, y: 0.8, w: 0.03, d: 0.35, h: 0.03, faces: { sides: C.hazard } });
  // (the door: shut or open; boots under its gap when someone's in)
  k.comp();
  const doorW = W - 2 * t - 0.06, open = look.door === 'open';
  if (open) k.box({ x0: -W / 2 + t + 0.02, x1: -W / 2 + t + 0.05, z0: D / 2 - 0.02, z1: D / 2 + doorW - 0.05, y: y0 + 0.02, h: top - y0 - 0.1, faces: { sides: panelFace(c), front: rail(c), top: c } });
  else k.box({ x: 0, z: D / 2 - 0.02, y: y0 + 0.02, w: doorW, d: 0.03, h: top - y0 - 0.1, faces: { front: stallDoor(c, !!look.occupied), back: panelFace(c), sides: c, top: tone(c, -0.1) } });
  k.box({ x: 0, z: D / 2 - 0.02, y: top - 0.04, w: W, d: 0.05, h: 0.04, faces: { sides: tone(c, -0.12), front: rail(tone(c, -0.05)) } });
  if (look.occupied && !open) {
    for (const dx of [-0.08, 0.08]) { k.comp(); k.box({ x: dx, z: D / 2 - 0.22, w: 0.1, d: 0.26, h: 0.12, faces: { front: rail(0x31292a), top: 0x31292a, sides: 0x31292a } }); }
  }
}
export function urinal(k, o) {
  const { W, D } = o, make = o.make ?? 'wall';
  k.comp();
  if (make === 'trough') {
    k.box({ x: 0, z: -D / 2 + 0.15, y: 0.5, w: W, d: 0.3, h: 0.12, faces: { top: tex('trough', (px, w, h, p) => { px(0, 0, w, h, C.chrome); px(1, 1, w - 2, h - 2, 0x87959d); px(1, h - 2, w - 2, 1, 0x5d9db1); }), front: rail(C.chrome), sides: C.chrome } });
    k.box({ x: 0, z: -D / 2 + 0.02, y: 0.62, w: W, d: 0.04, h: 0.55, faces: { front: tex('troughback', (px, w, h, p) => { paintedSteel(px, 0, 0, w, h, { c: C.chrome, ppm: p, seed: 3 }); px(0, 1, w, 1, 0x5d9db1); }), sides: C.chrome } });
    return;
  }
  k.box({ x: 0, z: -D / 2 + 0.17, y: 0.45, w: 0.4, d: 0.34, h: 0.6, faces: { front: tex('urinalfront', (px, w, h, p) => { px(0, 0, w, h, PORCELAIN); bevel(px, 0, 0, w, h, PORCELAIN); oval(px, w / 2, h * 0.6, w / 2 - P(0.05, p, 1), h * 0.35, 0xc7d5d0); px(Math.floor(w / 2) - 1, h - P(0.1, p, 2), 2, 1, 0x565b67); }), top: tex('urinaltop', (px, w, h) => { px(0, 0, w, h, PORCELAIN); px(1, 1, w - 2, Math.max(1, h - 3), 0xc7d5d0); }), sides: PORCELAIN } });
  k.box({ x: 0, z: -D / 2 + 0.03, y: 1.05, w: 0.05, d: 0.05, h: 0.2, faces: { sides: C.chrome } });
}

// ---------- sinks ----------

const sinkTop = (make, n, seed) => tex(`sinktop:${make}:${n}:${seed % 2}`, (px, w, h, ppm) => {
  const c = make === 'trough' ? C.chrome : make === 'pedestal' ? PORCELAIN : 0x9c917a;
  if (make === 'pedestal') px(0, 0, w, h, null); else { px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c, 0.8); }
  if (make === 'trough') { px(P(0.04, ppm, 1), P(0.06, ppm, 1), w - 2 * P(0.04, ppm, 1), h - 2 * P(0.06, ppm, 1), 0x87959d); px(P(0.04, ppm, 1), h - P(0.08, ppm, 2), w - 2 * P(0.04, ppm, 1), 1, 0x7c736b); }
  for (let i = 0; i < n; i++) {
    const cx = (i + 0.5) * w / n, cy = h * 0.55, rx = Math.min(w / n / 2 - 1, P(0.2, ppm, 3)), ry = h * 0.32;
    if (make === 'pedestal') oval(px, cx, cy, rx + 2, ry + 2, PORCELAIN);
    if (make !== 'trough') { oval(px, cx, cy, rx, ry, tone(PORCELAIN, -0.05)); oval(px, cx, cy + 1, rx - 1, ry - 1, C.paper); }
    px(Math.floor(cx), Math.floor(cy), 1, 1, 0x565b67);
    px(Math.floor(cx) - 1, P(0.04, ppm, 1), 3, P(0.08, ppm, 2), C.chrome); px(Math.floor(cx), P(0.04, ppm, 1) + P(0.08, ppm, 2), 1, 2, C.chrome);   // (the tap)
    if (hash3(seed, i) % 2) { px(Math.floor(cx + rx) + 1, P(0.05, ppm, 1), P(0.05, ppm, 1), P(0.08, ppm, 2), [0x669f93, 0x4d79a1, 0xd6d0c9][i % 3]); }   // (a toiletry left out)
  }
});
const mirrorFace = (fog) => tex(`mirrorstrip:${fog}`, (px, w, h, ppm) => {
  mirror(px, 0, 0, w, h, C.chrome);
  if (fog) for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) if ((i + j * 3) % 4 !== 0 && hash3(i >> 1, j >> 1, 3) % 5 > 0) px(i, j, 1, 1, tone(0xc7d5d0, (hash3(i, j) % 3) * 0.01));
  for (let x = P(0.6, ppm, 8); x < w - 2; x += P(0.6, ppm, 8)) px(x, 1, 1, h - 2, C.chrome);
});
export function sinkRow(k, o) {
  const { W, D, seed } = o, make = o.make ?? 'counter', look = o.look ?? {}, n = Math.max(1, Math.round(W / 0.6));
  k.comp();
  if (make === 'pedestal') {
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + (i + 0.5) * W / n;
      k.box({ x, z: -D / 2 + 0.2, w: 0.14, d: 0.14, h: 0.8, faces: { sides: PORCELAIN, front: rail(PORCELAIN) } });
    }
  } else {
    k.box({ x: 0, z: 0, w: W, d: D, h: 0.82, faces: { front: tex(`sinkfront:${make}`, (px, w, h, p) => {
      if (make === 'trough') { paintedSteel(px, 0, 0, w, h, { c: C.chrome, ppm: p, seed: 4 }); px(0, P(0.14, p), w, P(0.03, p, 1), C.steelD); for (let x = P(0.3, p); x < w; x += P(0.6, p)) px(x, P(0.2, p), 1, h - P(0.3, p), C.steelD); return; }
      const c = 0x7f735a; cabinetSimple(px, w, h, c, p);
    }), top: sinkTop(make, n, seed), sides: make === 'trough' ? C.chrome : 0x7f735a } });
  }
  if (make === 'pedestal') k.box({ x: 0, z: -D / 2 + 0.25, y: 0.8, w: W, d: 0.4, h: 0.1, faces: { top: sinkTop(make, n, seed), front: tex(`pedestalfront:${n}`, (px, w, h, p) => { px(0, 0, w, h, null); for (let i = 0; i < n; i++) { const x0 = Math.round((i + 0.15) * w / n), x1 = Math.round((i + 0.85) * w / n); px(x0, 0, x1 - x0, h, PORCELAIN); px(x0, h - 1, x1 - x0, 1, tone(PORCELAIN, -0.1)); } }), sides: PORCELAIN } });
  // (the mirror over it on the wall, a shelf under the mirror; none where the wall is a cut one)
  if (look.mirror === false) return;
  k.comp();
  k.box({ x: 0, z: -D / 2 + 0.015, y: 1.15, w: W, d: 0.03, h: 0.75, faces: { front: mirrorFace(!!look.fog), sides: C.chrome, top: C.chrome } });
  k.box({ x: 0, z: -D / 2 + 0.06, y: 1.08, w: W, d: 0.1, h: 0.03, faces: { top: tex(`mirrorshelf:${n}:${seed % 3}`, (px, w, h, p) => { px(0, 0, w, h, C.chrome); for (let i = 0; i < n * 2; i++) if (hash3(seed, i, 7) % 3) px(Math.floor((i + 0.3) * w / (n * 2)), 0, P(0.04, p, 1), Math.max(1, h - 1), [0x669f93, 0x4d79a1, 0xb45150, 0xd6d0c9, 0xd0ac5e][hash3(i, seed) % 5]); }), front: rail(C.chrome), sides: C.chrome } });
}
function cabinetSimple(px, w, h, c, ppm) {
  px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c);
  const n = Math.max(1, Math.round(w / (0.6 * ppm))), dw = Math.floor((w - 2) / n);
  for (let i = 0; i < n; i++) { const x = 1 + i * dw; bevel(px, x, P(0.08, ppm), dw - 1, h - P(0.18, ppm), c); px(x + dw - 4, P(0.15, ppm), 1, P(0.1, ppm, 2), C.steel); }
  px(0, h - P(0.1, ppm), w, P(0.1, ppm), tone(c, -0.3));
  grimeFoot(px, 0, 0, w, h, c, { ppm, upM: 0.2, seed: 3 });
}

// ---------- fountains and machines ----------

export function waterFountain(k, o) {
  const make = o.make ?? 'wall';
  k.comp();
  if (make === 'cooler') {
    k.box({ x: 0, z: 0, w: 0.34, d: 0.34, h: 0.95, faces: { front: tex('cooler', (px, w, h, p) => { px(0, 0, w, h, PORCELAIN); bevel(px, 0, 0, w, h, PORCELAIN); px(1, P(0.12, p), w - 2, P(0.16, p, 3), tone(PORCELAIN, -0.12)); px(2, P(0.14, p), 1, 1, 0x4d79a1); px(w - 3, P(0.14, p), 1, 1, 0xb45150); px(0, h - 1, w, 1, tone(PORCELAIN, -0.15)); }), top: PORCELAIN, sides: tone(PORCELAIN, -0.05) } });
    k.box({ x: 0, z: 0, y: 0.95, w: 0.28, d: 0.28, h: 0.36, faces: { front: tex('jug', (px, w, h) => { px(0, 0, w, h, 0x4d79a1); px(1, 1, 1, h - 2, 0x86bdbc); px(0, 2, w, 1, 0x86bdbc); px(w - 1, 0, 1, h, 0x3c5d84); }), top: tex('jugtop', (px, w, h) => { px(0, 0, w, h, 0x4d79a1); oval(px, w / 2, h / 2, w / 3, h / 3, 0x86bdbc); }), sides: 0x3c5d84 } });
    return;
  }
  k.box({ x: 0, z: -0.02, y: 0.62, w: 0.42, d: 0.3, h: 0.32, faces: { front: tex(`fountain:${make}`, (px, w, h, p) => { paintedSteel(px, 0, 0, w, h, { c: C.chrome, ppm: p, seed: 9 }); px(Math.floor(w / 2) - 1, h - P(0.1, p, 2), 3, P(0.04, p, 1), C.steelD); px(w - P(0.08, p, 2), Math.floor(h / 3), P(0.05, p, 2), P(0.05, p, 2), C.black); }), top: tex('fountaintop', (px, w, h, p) => { px(0, 0, w, h, C.chrome); oval(px, w / 2, h / 2, w / 2 - 2, h / 2 - 2, 0x87959d); px(Math.floor(w / 2), Math.floor(h / 2), 1, 1, 0x31292a); px(Math.floor(w * 0.3), 1, 2, 2, C.steel); }), sides: C.steelD } });
  if (make === 'bottle') k.box({ x: 0, z: -0.12, y: 0.94, w: 0.38, d: 0.08, h: 0.55, faces: { front: tex('bottlefill', (px, w, h, p) => { paintedSteel(px, 0, 0, w, h, { c: 0x565b67, ppm: p, seed: 2 }); px(2, 2, w - 4, P(0.08, p, 2), C.black); fontFor(p).text(px, 3, 3, '24K', 0x9fe0b0, 7); px(2, Math.floor(h * 0.4), w - 4, Math.floor(h * 0.45), 0x31292a); px(Math.floor(w / 2) - 1, Math.floor(h * 0.42), 2, 2, C.chrome); }), sides: 0x565b67, top: 0x565b67 } });
}
const machineFront = (make, running, seed) => tex(`machine:${make}:${running}:${seed % 3}`, (px, w, h, ppm) => {
  const c = make === 'dryer' ? 0xc4ac97 : 0xd6d0c9, u = U(ppm);
  px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c, 1.2);
  const panel = P(0.14, ppm, 3);
  px(1, 1, w - 2, panel, tone(c, -0.08)); px(1, panel, w - 2, 1, tone(c, -0.15));
  screenFace(px, w - P(0.2, ppm, 5), 2, P(0.14, ppm, 4), Math.max(3, panel - 3), running);
  oval(px, P(0.1, ppm, 2), panel / 2 + 1, P(0.035, ppm, 1), P(0.035, ppm, 1), C.steelD);
  // (the door: a ring, its glass, the wash going round behind it)
  const cx = w / 2, cy = panel + (h - panel) * 0.48, r = Math.min(w, h - panel) * 0.33;
  oval(px, cx, cy, r + 1, r + 1, C.steelD); oval(px, cx, cy, r, r, C.chrome); oval(px, cx, cy, r - Math.max(1, u), r - Math.max(1, u), make === 'dryer' ? 0x31292a : 0x3c5d84);
  if (running) for (let a = 0; a < 6; a++) { const t = a + seed; oval(px, cx + Math.cos(t) * r * 0.45, cy + Math.sin(t) * r * 0.45, r * 0.25, r * 0.2, [0x96694f, 0x4c633d, 0xd6d0c9, 0x625854][a % 4]); }
  for (let i = 0; i < r; i++) px(Math.floor(cx - r * 0.4 + i * 0.3), Math.floor(cy - r * 0.5 + i * 0.2), 1, 1, tone(0x86bdbc, 0.05));
  px(1, h - P(0.08, ppm, 2), w - 2, 1, tone(c, -0.12));
  grimeFoot(px, 0, 0, w, h, c, { ppm, upM: 0.12, seed: 6 });
  function screenFace(px2, x, y, ww, hh, on) { px2(x, y, ww, hh, C.black); if (on) { px2(x + 1, y + 1, ww - 2, hh - 2, 0x1d2b46, 7); px2(x + 1, y + 1, Math.max(1, ww - 4), 1, 0x9fe0b0, 7); } }
});
export function washer(k, o) {
  const { W, D, seed } = o, make = o.make ?? 'washer', look = o.look ?? {}, running = look.running ?? seed % 2 === 0;
  const parts = make === 'stack' ? ['washer', 'dryer'] : [make];
  parts.forEach((m, i) => {
    k.comp();
    k.box({ x: 0, z: 0, y: i * 0.88, w: W - 0.02, d: D, h: 0.86, faces: { front: machineFront(m, i === 0 ? running : !running, seed + i), top: tex(`machinetop:${m}:${i === parts.length - 1}`, (px, w, h, p) => { const c = m === 'dryer' ? 0xc4ac97 : 0xd6d0c9; px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c); if (i === parts.length - 1 && m === 'washer') { px(Math.floor(w * 0.2), Math.floor(h * 0.3), P(0.15, p, 3), P(0.2, p, 3), 0xd0ac5e); px(Math.floor(w * 0.2), Math.floor(h * 0.3), P(0.15, p, 3), 1, 0xb45150); } }), sides: tone(m === 'dryer' ? 0xc4ac97 : 0xd6d0c9, -0.06) } });
  });
}
