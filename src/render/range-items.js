// OLYMPUS render: the range's and the decals' pixels. Where each pixel of a hole, a flag, a case or a thing lying goes. Pure.
//
// The geometry the range layer (src/render/range.js) and the decals (src/render/decals.js) draw, kept
// apart from their three.js meshes, as vignette-items.js is from vignettes.js, so the tests read it in
// node: cardFace() and holePixel() put a hole on the card as the kit paints it (src/art/kit/range.js
// kdFrame: its backer facing the camera, the card CARD_K times life size, cm from its centre x right and y
// down), flagPixels() a red flag hoisted on its pole, brassPixels() a case in flight or lying (its height
// drawn on the chibi's bore by drawnY: see range.js), decalPixels() a thing lying (tradecraft's items.js
// templates, bigger than life, outlined), and the shot's blast (the design review's: at 16 px/m the
// figure's own 4 × 3 flash sat under the chibi's chin for one tick, and nothing showed the planet):
// flashPixels() a star at the drawn muzzle, 9 × 5 for its first tick and 5 × 3 for its second, lifted
// toward the camera and drawn after the figures so it lies over the head; dustPixels() the regolith the blast throws up in front of
// a prone or kneeling muzzle, grey-ochre motes up to DUST_UP_M that fall at Mars' 0.38 g and settle,
// DUST_MS in all. 0.0.6 (the user, 2026-11-07: "different types of rounds"): a live tracer thrown out of the port
// lies with its red tip (brassPixels' and decalPixels' 'tracer'), and a tracer shot draws tracePixels(): by day at
// 25 m the trace proper has not lit (calibres.js traceFromM 30 m), so what shows is the igniter's dim ember, a dotted
// dull-red streak TRACE_STREAK_M long behind the round as it flies at its 790 m/s to the card (32 ms at 25 m, one or
// two frames at 60 Hz), every other pixel, and the bright trace only past traceFromM. Every pixel is a centre in
// metres on the stage's pixel grid.
// 0.0.7 (the build sheet 0.0.7 §2.4 (b), (c)): the KD ground's moving things, from rangeLook.kd:
//   - THE FACES: kdFaceAt() puts a face where its carrier has it, FACE_K times life size (src/art/kit/range.js),
//     its top edge where the sim's top edge is (so a face down at FACE_DOWN_Y is wholly under the ground, and one
//     up stands over the parapet), moving continuously with the carrier's up (0 down, 1 up: never a pop);
//     kdHolePixel() a hole on it (cm from its centre, x right and y down), spotterPixels() the spotter in the hole
//     the pits put up (an orange plus round a dark centre: it reads on the white and on the black), diskPixels()
//     the score disk on its pole at the face's right shoulder (a white disc with the value's digit, 10 px across
//     at 16 px/m, rising on its pole over DISK_RISE_MS and going down the same way), missFlagPixels() the red
//     flag waved across the face for a miss;
//   - THE FLAGS: sleevePixels() a range flag's sleeve on its pole's top, blowing toward the sim's wind (flagOf's
//     towardRad, the way it blows to) and lifted by its strength (liftK 0 limp along the pole to 1 straight out),
//     in red and white bands, its tail stirring on game time;
//   - THE RELAY: flashPixels() and dustPixels() for every shooter's fire (sitting as well: drawnMuzzleM's 'sit'),
//     tilePixels() the cases at rest on a metre tile (rangeLook.kd.tiles: up to TILE_CASES_MAX drawn, scattered by
//     hash in the tile's half nearest its middle), bermDustPixels() a round's dust off the berm's face.
// Pure: no three.js, no DOM.
import { PX_PER_M } from './scale.js';
import { hash01 } from '../core/hash.js';
import { cardPx, cardPxPerCm, CARD_AT_M, CARD_RINGS_CM, FACE_K, KD_FACES, facePx, facePxPerCm } from '../art/kit/range.js';
import { fontFor } from '../art/kit/type.js';
import { composeFrame } from '../art/figures/compose.js';
import { FLAG, TOWER } from '../data/places/range.js';

/** The flag's hoist and lowering, and its flutter's step, game milliseconds. */
export const FLAG_HOIST_MS = 600, FLAG_FLAP_MS = 400;
/** A new hole's puff of paper, game milliseconds. */
export const PUFF_MS = 200;
/** The blast's dust: how high the motes are thrown (m), how many prone and kneeling, Mars' gravity (m/s²), and the whole of it (game ms: look.js DUST_MS). */
export const DUST_UP_M = 0.3, DUST_N = Object.freeze({ prone: 9, kneel: 5, sit: 5 }), DUST_G_MS2 = 3.727, DUST_LIFE_MS = 1200;
/** The flash's first tick and its whole (game ms: look.js FLASH_MS). */
export const FLASH_STAR_MS = 50, FLASH_LIFE_MS = 100;
/**
 * The sim's port heights by stance (the arms role's PORT_H_M, WEAPONS §2.8: a real body's) and the chibi's
 * drawn bore at the same stances, measured from its aim frames (compose.js: the muzzle's row over the
 * soles), metres. A case's height is drawn through the line joining them (drawnY), so it leaves the drawn
 * port and lands where and when the sim says.
 */
export const SIM_PORT_M = Object.freeze({ prone: 0.25, kneel: 0.95, stand: 1.4 });
export function drawnBoreM(ppm = PX_PER_M) {
  const out = {};
  for (const [stance, frame] of [['stand', 'aim'], ['kneel', 'kneel'], ['prone', 'prone']]) {
    const fr = composeFrame({ outfit: 'utilities', weapon: 'rifle', carry: 'low' }, 'right', frame, { ppm });
    out[stance] = fr.muzzle ? Math.max(0.05, (fr.ay - fr.muzzle[1] - 0.5) / ppm) : SIM_PORT_M[stance] * 0.6;
  }
  return out;
}
const bores = new Map();
/** A height in the sim's case flight as drawn on the chibi (piecewise linear through the stances' ports; above the standing port, scaled as it). */
export function drawnY(y, ppm = PX_PER_M, stance = null) {
  let b = bores.get(ppm);
  if (!b) bores.set(ppm, (b = drawnBoreM(ppm)));
  // (through the prone and standing ports for a case from either: the chibi kneeling holds its bore nearly as
  // high as standing, its legs being short, and a kneeling point would flatten a standing case's arc; a case
  // that left a kneeling port goes through the kneeling port's own, so it leaves from the drawn port (the
  // integrator's: a few pixels under it))
  if (stance === 'kneel') return y <= SIM_PORT_M.kneel ? y * b.kneel / SIM_PORT_M.kneel : b.kneel + (y - SIM_PORT_M.kneel) * b.stand / SIM_PORT_M.stand;
  const pts = [[0, 0], [SIM_PORT_M.prone, b.prone], [SIM_PORT_M.stand, b.stand]];
  for (let i = 1; i < pts.length; i++) if (y <= pts[i][0]) { const [a0, b0] = pts[i - 1], [a1, b1] = pts[i]; return b0 + (b1 - b0) * (y - a0) / (a1 - a0); }
  return y * b.stand / SIM_PORT_M.stand;
}
/** The part the flag writes (outlined against the sky and the tower). */
export const FLAG_PART = 0xa5a5b1;
/** A hole through the black (the paper's fibres) and through the white (the dark behind it). */
export const PALE = 0xdfe2e8, DARK = 0x23252f;
const RED = 0xff4a3a, RED_D = 0xb45150, BRASS = 0xd0ac5e, BRASS_L = 0xf6e3a0, COPPER = 0xb45b3a, DUMMY = 0xe08a3a, TRACER_TIP = 0xc23b2e;
/** A tracer's ember (see the header): the streak behind the round (m), its speed (TRACE_V_MS, m/s) and where the bright trace lights (m) when the look gives none (rangeLook's fire carries the calibre's own: calibres.js), their colours. */
export const TRACE_STREAK_M = 3, TRACE_V_MS = 790, TRACE_FROM_M = 30, EMBER = 0x8a3a2e, TRACE = 0xff6a3a;

const snap = (v, ppm) => Math.round(v * ppm) / ppm;
/**
 * How far a hole's pixel stands off its card toward the camera, metres: as far up as south, so it covers
 * the same pixel of the picture (a point shows where the ground at z − y does), 17 cm nearer along the
 * camera's line, so it wins the depth test against the card it is on (7 cm did not: the stage's depth is
 * coarser than that at the card's distance, measured in the browser); it is drawn as the see-through's
 * kept pixels are (createPixels' noLine), so the outline pass draws no line round it.
 */
export const HOLE_LIFT_M = 0.12;
/**
 * The card's face on a frame at target { x, z } as the kit paints it (kdFrame's backer, facing the camera):
 * { x0 (its left edge), y1 (its top), z (its plane), cx0, cy0 (the card's top-left texel), c (the card's
 * middle, texels from its corner), k (texels a centimetre) }.
 */
export function cardFace(target, ppm = PX_PER_M) {
  const W = 1.0, H = 1.2, ox = snap(target.x, ppm), x0 = snap(ox - W / 2, ppm), x1 = snap(ox + W / 2, ppm), y1 = snap(H, ppm);
  const w = Math.round((x1 - x0) * ppm), h = Math.round(y1 * ppm), n = cardPx(ppm);
  return { x0, y1, z: snap(target.z, ppm), w, h, n, cx0: Math.round(w / 2 - n / 2), cy0: Math.round(h - CARD_AT_M.y * ppm - n / 2), c: n / 2, k: cardPxPerCm(ppm) };
}
/** A hole's pixel on its card: { x, y, z, i, j (the face's texel), black (through the black: a pale pixel) }, or null off the card. */
export function holePixel(target, hole, ppm = PX_PER_M) {
  const f = cardFace(target, ppm);
  const i = Math.floor(f.cx0 + f.c + hole.xCm * f.k), j = Math.floor(f.cy0 + f.c + hole.yCm * f.k);
  if (i < f.cx0 || i >= f.cx0 + f.n || j < f.cy0 || j >= f.cy0 + f.n) return null;
  return { x: f.x0 + (i + 0.5) / ppm, y: f.y1 - (j + 0.5) / ppm + HOLE_LIFT_M, z: f.z + HOLE_LIFT_M, i, j, black: Math.hypot(hole.xCm, hole.yCm) <= CARD_RINGS_CM.black };
}
/**
 * The flag's pixels hoisted k (0 down at the deck, 1 at the pole's top), stirring at game time ms:
 * [{ x, y, z, c }] metres, from its pole at { x, z } (KD_RANGE.tower.flag).
 */
export function flagPixels(pole, k, ms, ppm = PX_PER_M, F = { ...FLAG, baseY: TOWER.deckY + 0.6 }) {
  if (k <= 0) return [];
  const w = Math.max(3, Math.round(F.w * ppm)), h = Math.max(2, Math.round(F.h * ppm)), top = F.baseY + (F.poleTopY - F.baseY) * Math.min(1, k);
  const flap = Math.floor(ms / FLAG_FLAP_MS) % 2, x0 = snap(pole.x, ppm) + 0.5 / ppm, z = snap(pole.z, ppm) + 0.05, out = [];
  for (let i = 0; i < w; i++) {
    // (the fly end droops and ripples: each column sags by its distance from the pole and the flutter's phase)
    const sag = Math.round((i / w) * 2 + (flap ? Math.sin(i / 3) : Math.cos(i / 3)) * (i / w) * 1.2);
    const hh = Math.max(2, h - Math.round((i / w) * 2));
    for (let j = 0; j < hh; j++) out.push({ x: x0 + (i + 0.5) / ppm, y: snap(top, ppm) - (j + sag + 0.5) / ppm, z, c: (j === 0 || i % 5 === 4) ? RED_D : RED });
  }
  return out;
}
/**
 * A case's pixels (rangeLook's brass: { x, y, z, kind, rest, rotRad, stance, atMs }; ms the game time drawn):
 * [{ x, y, z, c, flat }]. In flight two pixels along its spin, a white glint on its first tick out of the port
 * (the design review's: a 1-pixel case could not be seen hang at 0.38 g); at rest two lying.
 */
export function brassPixels(b, ppm = PX_PER_M, ms = null) {
  const P = 1 / ppm, gx = (Math.round(b.x * ppm) + 0.5) * P, gz = (Math.round(b.z * ppm) + 0.5) * P;
  if (!b.rest) {
    const turn = Math.floor((b.rotRad ?? 0) / (Math.PI / 2)), glint = turn % 2 === 0, y = Math.max(0.03, drawnY(b.y, ppm, b.stance));
    const fresh = ms !== null && Number.isFinite(b.atMs) && ms - b.atMs >= 0 && ms - b.atMs < FLASH_STAR_MS;
    // (end over end: lying along the picture on one quarter turn, upright on the next)
    const [dx, dy] = turn % 2 === 0 ? [P, 0] : [0, P];
    return [{ x: gx, y, z: gz, c: fresh ? 0xffffff : glint ? BRASS_L : BRASS, flat: false }, { x: gx + dx, y: y + dy, z: gz, c: glint ? BRASS : BRASS_L, flat: false }];
  }
  const along = Math.abs(Math.cos(b.rotRad ?? 0)) > Math.SQRT1_2, dx = along ? P : 0, dz = along ? 0 : P;
  const [c0, c1] = b.kind === 'dummy' ? [DUMMY, BRASS] : b.kind === 'round' ? [BRASS, COPPER] : b.kind === 'tracer' ? [BRASS, TRACER_TIP] : [BRASS, BRASS_L];
  return [{ x: gx, y: 0.014, z: gz, c: c0, flat: true }, { x: gx + dx, y: 0.014, z: gz + dz, c: c1, flat: true }];
}

// (the drawn muzzle of the chibi at each stance, facing right: metres ahead of the body's anchor and up, from its
// fire frames as compose.js draws them; the figure's own flash is drawn there)
const muzzles = new Map();
export function drawnMuzzleM(ppm = PX_PER_M) {
  let m = muzzles.get(ppm);
  if (m) return m;
  m = {};
  for (const [stance, frame] of [['stand', 'aim'], ['kneel', 'kneel'], ['prone', 'prone'], ['sit', 'sitAim']]) {
    const fr = composeFrame({ outfit: 'utilities', weapon: 'rifle', carry: 'low' }, 'right', frame, { ppm });
    m[stance] = fr.muzzle ? { aheadM: (fr.muzzle[0] - fr.ax + 0.5) / ppm, upM: Math.max(0.05, (fr.ay - fr.muzzle[1] - 0.5) / ppm) } : { aheadM: 0.5, upM: SIM_PORT_M[stance] * 0.6 };
  }
  muzzles.set(ppm, m);
  return m;
}
/** How far the blast's pixels stand toward the camera from the figure's card, so they draw over its head (m: the holes' lift). */
export const FLASH_LIFT_M = 0.18;
const FLASH_CORE = 0xfffbe6, FLASH_RAY = 0xffd25a, FLASH_EDGE = 0xf08a2a;
// (the star, rows top to bottom: o the core, r a ray, e its end)
const STAR = Object.freeze(['    e    ', ' e  r  e ', 'errroorre', ' e  r  e ', '    e    ']);
const STAR2 = Object.freeze(['  e  ', 'erore', '  e  ']);
/**
 * The muzzle's flash (rangeLook's fire: { atMs, x, z, face, stance }) at game time ms: [{ x, y, z, c }] metres,
 * the star at the drawn muzzle for FLASH_STAR_MS, then its smaller second for the rest of FLASH_LIFE_MS; none after.
 */
export function flashPixels(fire, ms, ppm = PX_PER_M) {
  if (!fire) return [];
  const dt = ms - fire.atMs;
  if (!(dt >= 0 && dt < FLASH_LIFE_MS) || (fire.face !== 'right' && fire.face !== 'left')) return [];
  const m = drawnMuzzleM(ppm)[fire.stance] ?? drawnMuzzleM(ppm).stand, sgn = fire.face === 'left' ? -1 : 1, P = 1 / ppm;
  const cx = Math.round((fire.x + sgn * (m.aheadM + 2 * P)) * ppm), cy = Math.round(m.upM * ppm), z = snap(fire.z, ppm) + FLASH_LIFT_M;
  const rows = dt < FLASH_STAR_MS ? STAR : STAR2, h = rows.length, w = rows[0].length, out = [];
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === ' ') return;
    out.push({ x: (cx + sgn * (i - Math.floor(w / 2)) + 0.5) * P, y: (cy - (j - Math.floor(h / 2)) + 0.5) * P + FLASH_LIFT_M, z, c: ch === 'o' ? FLASH_CORE : ch === 'r' ? FLASH_RAY : FLASH_EDGE });
  }));
  return out;
}
/**
 * A tracer's flight (rangeLook's fire with load 'tracer'; target: its lane's card { x, z, centreY }) at game time ms:
 * [{ x, y, z, c }] metres, see the header: the dotted ember from the drawn muzzle along the line to the card's
 * centre, the TRACE_STREAK_M behind the round, until it arrives; none for ball, none after.
 */
export function tracePixels(fire, ms, ppm = PX_PER_M, target = null) {
  if (!fire || fire.load !== 'tracer' || !target || (fire.face !== 'right' && fire.face !== 'left')) return [];
  const dt = (ms - fire.atMs) / 1000, m = drawnMuzzleM(ppm)[fire.stance] ?? drawnMuzzleM(ppm).stand, sgn = fire.face === 'left' ? -1 : 1;
  const x0 = fire.x + sgn * m.aheadM, y0 = m.upM, toM = Math.abs(target.x - x0), y1 = target.centreY ?? y0;
  const d = (fire.vMs ?? TRACE_V_MS) * dt, from = fire.traceFromM ?? TRACE_FROM_M;
  if (!(dt >= 0) || d - TRACE_STREAK_M > toM) return [];
  const out = [], P = 1 / ppm, z = snap(fire.z, ppm) + FLASH_LIFT_M;
  for (let i = Math.max(0, Math.floor((d - TRACE_STREAK_M) * ppm)); i <= Math.min(d, toM) * ppm; i++) {
    if (i % 2) continue;
    const s = i / ppm, k = toM > 0 ? s / toM : 0;
    out.push({ x: snap(x0 + sgn * s, ppm) + 0.5 * P, y: snap(y0 + (y1 - y0) * k, ppm) + 0.5 * P + FLASH_LIFT_M, z, c: s >= from ? TRACE : EMBER });
  }
  return out;
}
const DUST = Object.freeze([0xc8b28c, 0xb59c74, 0xd6c29c, 0xa89070]);
/**
 * The blast's dust in front of a prone or kneeling muzzle (rangeLook's fire) at game time ms: [{ x, y, z, c,
 * flat }] metres. Each mote by hash of the shot's time: thrown up to DUST_UP_M from 0.5 to 1.6 m ahead of the
 * muzzle (past the firing point's paving, on the regolith) and a little to either side, falling at Mars' gravity (a mote's flight 1.6 times an Earth fall's), then
 * lying until DUST_LIFE_MS, fewer at the end (settled into the regolith).
 */
export function dustPixels(fire, ms, ppm = PX_PER_M) {
  if (!fire || !DUST_N[fire.stance] || (fire.face !== 'right' && fire.face !== 'left')) return [];
  const t = (ms - fire.atMs) / 1000;
  if (!(t >= 0 && t * 1000 < DUST_LIFE_MS)) return [];
  const m = drawnMuzzleM(ppm)[fire.stance], sgn = fire.face === 'left' ? -1 : 1, out = [];
  for (let i = 0; i < DUST_N[fire.stance]; i++) {
    const h = (k) => hash01('dust', fire.atMs, i, k);
    const up = DUST_UP_M * (0.45 + 0.55 * h('up')) * (fire.stance === 'prone' ? 1 : 0.6), v0 = Math.sqrt(2 * DUST_G_MS2 * up), flight = 2 * v0 / DUST_G_MS2;
    // (each mote leaves a little after the blast, the farthest last)
    const t0 = 0.03 * h('t0'), tt = t - t0;
    if (tt < 0) continue;
    const ahead = m.aheadM + 0.5 + 1.1 * h('x'), side = (h('z') - 0.5) * 0.7, drift = 0.25 * h('drift') * Math.min(tt, flight);
    const x = fire.x + sgn * (ahead + drift), z = fire.z + side;
    if (tt < flight) {
      const y = Math.max(0.02, v0 * tt - 0.5 * DUST_G_MS2 * tt * tt);
      out.push({ x: snap(x, ppm), y: snap(y, ppm) + 0.5 / ppm, z: snap(z, ppm) + 0.05, c: DUST[i % DUST.length], flat: false });
    } else if (h('stay') < 1 - tt / (DUST_LIFE_MS / 1000)) out.push({ x: snap(x, ppm), y: 0.016, z: snap(z, ppm), c: DUST[(i + 1) % DUST.length], flat: true });
  }
  return out;
}

const INK = 0x14151c;
const COLOURS = Object.freeze({ u: 0x23252f, U: 0x3e424d, b: 0xd0ac5e, B: 0xf0d48a, c: 0xb45b3a, o: 0xe08a3a, r: 0xc23b2e, k: INK, g: 0x6e7582 });
/** Each kind lying along x, its tip to the east (rows north to south); letters are COLOURS. */
export const SHAPES = Object.freeze({
  mag: ['uuuuU', ' uuuu'],                                          // (the HAD-30: its body curving, the baseplate at its end)
  round: ['bbbc'],                                                  // (a live round: brass and its copper tip)
  dummy: ['ooob'],                                                  // (the orange dummy)
  tracer: ['bbbr'],                                                 // (a live tracer: brass and its red tip, 0.0.6)
  case: ['bB'],                                                     // (a spent case, short and bright)
});

/** One thing's pixels lying (see the header): [{ x, z, c }] metres on the pixel grid, its outline first. */
export function decalPixels(it, ppm = PX_PER_M) {
  const rows = SHAPES[it.kind] ?? SHAPES.mag, h = Math.floor(hash01('decal', it.id ?? `${it.x},${it.z}`) * 4), P = 1 / ppm;
  const along = h % 2 === 0, flip = h >= 2;
  const W = Math.max(...rows.map(r => r.length)), H = rows.length, on = new Set(), out = [];
  const gx = Math.round(it.x * ppm), gz = Math.round(it.z * ppm);
  const at = (i, j) => { const u = (flip ? W - 1 - i : i) - Math.floor(W / 2), v = j - Math.floor(H / 2); return along ? [(gx + u + 0.5) * P, (gz + v + 0.5) * P] : [(gx + v + 0.5) * P, (gz + u + 0.5) * P]; };
  rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ' ') on.add(`${i},${j}`); }));
  const ring = new Set();
  for (const k of on) { const [i, j] = k.split(',').map(Number); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!on.has(`${i + a},${j + b}`)) ring.add(`${i + a},${j + b}`); }
  for (const k of ring) { const [i, j] = k.split(',').map(Number); const [x, z] = at(i, j); out.push({ x, z, c: INK }); }
  rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ' ') { const [x, z] = at(i, j); out.push({ x, z, c: COLOURS[ch] ?? COLOURS.u }); } }));
  return out;
}


// ---------- the KD ground (0.0.7) ----------

/** A face's sim heights when the look gives none (the range role's FACE_UP_Y, FACE_DOWN_Y: its centre, metres). */
export const FACE_UP_Y = 1.9, FACE_DOWN_Y = -0.6;
/** The score disk: its diameter at 16 px/m (px; scaled with the density), its rise on its pole and its going down (game ms). */
export const DISK_PX = 10, DISK_RISE_MS = 300;
/** The miss's red flag waved across the face: its size (m) and its wave's period (game ms). */
export const MISS_FLAG_M = Object.freeze([0.9, 0.6]), MISS_WAVE_MS = 700;
/** A flag's sleeve: its length and its mouth's and tail's diameters (m: drawn bigger than life, the kit's way with small things, so its way and its lift read at 16 px/m), its bands, its stir (game ms). */
export const SLEEVE_M = Object.freeze({ len: 2.2, mouth: 0.55, tail: 0.25, poleTop: 4.5 }), SLEEVE_BANDS = 5, SLEEVE_STIR_MS = 350;
/** The most cases drawn on a metre tile at rest (a tile's count can be the relay's whole string). */
export const TILE_CASES_MAX = 10;
/** A round's dust off the berm: motes, how high they go (m), the whole of it (game ms). */
export const BERM_DUST_N = 10, BERM_DUST_UP_M = 0.9, BERM_DUST_MS = 1600;
const SPOT = 0xf08a2a, SPOT_C = 0x1a1214, DISK = 0xf4efe6, DISK_INK = 0x1a1214, POLE = 0xb7b0a8, SLEEVE = [0xe85a3a, 0xf4efe6], MISS = 0xc23b2e;
/** A face's drawn left edge behind the face's line (m): just clear of the parapet's back. */
export const FACE_BEHIND_M = 0.06;
/** How far the face's overlays stand toward the camera from its plane (m: the 25 m card's HOLE_LIFT_M). */
export const FACE_LIFT_M = HOLE_LIFT_M;

/**
 * A face where its carrier has it: { x0, x1, yTop, yBot, cy, z, n (px a side), k (px a cm), paper } metres, on the
 * pixel grid. face: rangeLook.kd's { x, z, paper, up, upY?, downY? }; its top edge at the sim's (centre + half its
 * real side), its drawn side FACE_K times the real, its left edge FACE_BEHIND_M behind the face's line (over the
 * pits); up moves it continuously between down and up.
 */
export function kdFaceAt(face, ppm = PX_PER_M) {
  const F = KD_FACES[face.paper] ?? KD_FACES.kdA, sideM = F.sideCm / 100, n = facePx(face.paper ?? 'kdA', ppm);
  const up = Math.max(0, Math.min(1, face.up ?? 1)), cy = (face.downY ?? FACE_DOWN_Y) + ((face.upY ?? FACE_UP_Y) - (face.downY ?? FACE_DOWN_Y)) * up;
  // (its left edge on the face's line, the parapet's back: so the whole face stands over the pits and sinks into them
  // evenly, never half behind the parapet's top and half into the floor; a metre east of the sim's centre at FACE_K 2)
  const yTop = snap(cy + sideM / 2, ppm), x0 = snap(face.x + FACE_BEHIND_M, ppm);
  return { x0, x1: x0 + n / ppm, yTop, yBot: yTop - n / ppm, cy: yTop - n / ppm / 2, z: snap(face.z, ppm), n, k: facePxPerCm(ppm), paper: face.paper ?? 'kdA' };
}
/** A hole's pixel on a KD face (cm from its centre, x right and y down): { x, y, z, i, j, black } or null off the paper. */
export function kdHolePixel(fa, hole, ppm = PX_PER_M) {
  const i = Math.floor(fa.n / 2 + hole.xCm * fa.k), j = Math.floor(fa.n / 2 + hole.yCm * fa.k);
  if (i < 0 || i >= fa.n || j < 0 || j >= fa.n) return null;
  const F = KD_FACES[fa.paper] ?? KD_FACES.kdA;
  return { x: fa.x0 + (i + 0.5) / ppm, y: fa.yTop - (j + 0.5) / ppm + FACE_LIFT_M, z: fa.z + FACE_LIFT_M, i, j, black: Math.hypot(hole.xCm, hole.yCm) <= F.blackCm };
}
/**
 * The spotter in a hole ([xCm, yCm]): a 3 × 3 orange disc round the dark hole, with a dark rim a pixel wide, 5 × 5 in
 * all, [{ x, y, z, c }], or none off the paper (the runtime review's of v0.0.7: the plus of five pixels read as a 1 to
 * 2 px dot in the black through the far window).
 */
export function spotterPixels(fa, at, ppm = PX_PER_M) {
  if (!at) return [];
  const h = kdHolePixel(fa, { xCm: at[0], yCm: at[1] }, ppm);
  if (!h) return [];
  const P = 1 / ppm, out = [];
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const ring = Math.max(Math.abs(dx), Math.abs(dy));
    if (ring === 2 && Math.abs(dx) === 2 && Math.abs(dy) === 2) continue;   // (its corners off: round)
    out.push({ x: h.x + dx * P, y: h.y - dy * P, z: h.z + 0.01, c: ring === 2 || ring === 0 ? SPOT_C : SPOT });
  }
  return out;
}
/** How far up a disk or a flag on its pole stands (0 down to 1 up) at ms: risen over DISK_RISE_MS from since, and gone down over it from until. */
export function poleUp(sinceMs, ms, untilMs = null) {
  if (!Number.isFinite(sinceMs) || ms < sinceMs) return 0;
  const up = Math.min(1, (ms - sinceMs) / DISK_RISE_MS);
  if (Number.isFinite(untilMs) && ms > untilMs) return Math.max(0, up - (ms - untilMs) / DISK_RISE_MS);
  return up;
}
/**
 * The score disk on its pole at the face's right shoulder: [{ x, y, z, c }] metres. value 'V' | 5 | 4 | 3 | 2; k how
 * far up (poleUp): the pole comes up from the pits behind the face, the disk over the face's top corner.
 */
export function diskPixels(fa, value, k, ppm = PX_PER_M) {
  if (!(k > 0)) return [];
  const P = 1 / ppm, d = Math.max(6, Math.round(DISK_PX * ppm / 16)), r = d / 2, out = [];
  const cxPx = Math.round((fa.x1 - fa.x0) * ppm) + Math.round(r) - 2, top = fa.yTop + (d * 0.6) / ppm, lowest = -0.3;
  const cy = lowest + (top - lowest) * k, z = fa.z + FACE_LIFT_M + 0.02, x0 = fa.x0;
  // (the pole: from the parapet's top up to the disk)
  for (let y = Math.max(0.5, cy - (d * 2) / ppm); y < cy - r * P; y += P) out.push({ x: x0 + (cxPx + 0.5) * P, y: snap(y, ppm) + 0.5 * P, z: z - 0.01, c: POLE });
  const glyph = fontFor(ppm), text = String(value), tw = glyph.width(text), on = new Set();
  glyph.text((x, y, w = 1, h = 1) => { for (let a = 0; a < w; a++) for (let b = 0; b < h; b++) on.add(`${x + a},${y + b}`); }, Math.floor((d - tw) / 2), Math.floor((d - glyph.h) / 2), text, 0);
  for (let j = 0; j < d; j++) for (let i = 0; i < d; i++) {
    const e = Math.hypot(i + 0.5 - r, j + 0.5 - r);
    if (e > r) continue;
    const c = e > r - 1 ? DISK_INK : on.has(`${i},${j}`) ? DISK_INK : DISK;
    out.push({ x: x0 + (cxPx - Math.floor(r) + i + 0.5) * P, y: snap(cy, ppm) + (r - j - 0.5) * P, z, c });
  }
  return out;
}
/** The red flag waved across the face for a miss (k how far up, poleUp; ms the game time for its wave): [{ x, y, z, c }]. */
export function missFlagPixels(fa, k, ms, ppm = PX_PER_M) {
  if (!(k > 0)) return [];
  const P = 1 / ppm, w = Math.round(MISS_FLAG_M[0] * ppm), h = Math.round(MISS_FLAG_M[1] * ppm), out = [];
  // (swung from the face's left shoulder to its right and back, its staff from the pits)
  const sw = 0.5 + 0.5 * Math.sin(2 * Math.PI * ms / MISS_WAVE_MS), span = (fa.x1 - fa.x0) - MISS_FLAG_M[0];
  const x0 = snap(fa.x0 + span * sw, ppm), top = fa.yTop + 0.2 - (1 - k) * (fa.yTop + 0.5), z = fa.z + FACE_LIFT_M + 0.03;
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const sag = Math.round(Math.sin(i / 3 + ms / 120) * (i / w) * 1.5);
    out.push({ x: x0 + (i + 0.5) * P, y: snap(top, ppm) - (j + sag + 0.5) * P, z, c: j === 0 ? tone8(MISS) : MISS });
  }
  for (let y = 0.5; y < top; y += P) out.push({ x: x0 + 0.5 * P, y: snap(y, ppm) + 0.5 * P, z, c: POLE });
  return out;
}
const tone8 = (c) => (((c >> 16) & 255) * 0.75 << 16) | (((c >> 8) & 255) * 0.75 << 8) | ((c & 255) * 0.75);
/**
 * A range flag's sleeve on its pole at { x, z } (rangeLook.kd.flags: towardRad the way the wind blows it, x east and
 * z south; liftK 0 limp to 1 straight out) at game time ms: [{ x, y, z, c }] metres. Its axis from the pole's top
 * toward the wind's way, drooping (1 − liftK) × 80° below level; its width tapering from the mouth to the tail; its
 * bands red and white; its tail stirring a pixel on SLEEVE_STIR_MS. Seen from the south at 45°, a point at height y
 * shows where the ground at z − y does, so a sleeve blowing north rises up the picture, one blowing east lies across it.
 */
export function sleevePixels(flag, ms, ppm = PX_PER_M) {
  const P = 1 / ppm, lift = Math.max(0, Math.min(1, flag.liftK ?? 0)), droop = (1 - lift) * 80 * Math.PI / 180;
  const t = flag.towardRad ?? 0, dx = Math.cos(t) * Math.cos(droop), dz = Math.sin(t) * Math.cos(droop), dy = -Math.sin(droop);
  const L = SLEEVE_M.len, steps = Math.max(8, Math.round(2 * L * ppm)), out = [], seen = new Set();   // (half-pixel steps along and across: a diagonal sleeve with no gaps)
  const stir = Math.floor(ms / SLEEVE_STIR_MS) % 2;
  const top = (flag.poleTop ?? SLEEVE_M.poleTop) - 0.05, z0 = flag.z + 0.06;
  // (the screen's up: what a pixel's offset across the sleeve runs along; its axis in picture pixels: x, and z − y)
  const sx = dx, sy = dz - dy, sl = Math.hypot(sx, sy) || 1, nx = -sy / sl, ny = sx / sl;
  for (let s = 0; s <= steps; s++) {
    const f = s / steps, wob = f > 0.6 ? (stir ? 1 : -1) * (f - 0.6) * 1.5 * P * (1.2 - lift) : 0;
    const x = flag.x + dx * L * f + nx * wob, y = top + dy * L * f, z = z0 + dz * L * f;
    const half = ((SLEEVE_M.mouth + (SLEEVE_M.tail - SLEEVE_M.mouth) * f) * ppm) / 2;
    const band = Math.min(SLEEVE_BANDS - 1, Math.floor(f * SLEEVE_BANDS)), c = SLEEVE[band % 2];
    for (let o = -half; o <= half; o += 0.5) {
      // (across the axis on the picture: a pixel along the normal, put back at the sleeve's own depth)
      const gx = Math.round((x + nx * o * P) * ppm), gy = Math.round(((z - y) + ny * o * P) * ppm);
      const key = `${gx},${gy}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ x: (gx + 0.5) * P, y: snap(y, ppm) + 0.5 * P, z: (gy + 0.5) * P + snap(y, ppm) + 0.5 * P, c: Math.abs(o) > half - 1 ? tone8(c) : c });
    }
  }
  return out;
}
/** The cases at rest on a metre tile (rangeLook.kd.tiles: { x, z, n }, x and z its corner): [{ x, y, z, c, flat }], up to TILE_CASES_MAX. */
export function tilePixels(t, ppm = PX_PER_M) {
  const out = [], n = Math.min(TILE_CASES_MAX, t.n ?? 0);
  for (let i = 0; i < n; i++) {
    const h = (k) => hash01('tile', t.x, t.z, i, k);
    const b = { x: t.x + 0.2 + 0.6 * h('x'), z: t.z + 0.2 + 0.6 * h('z'), rest: true, rotRad: h('r') * Math.PI * 2, kind: 'case' };
    out.push(...brassPixels(b, ppm));
  }
  return out;
}
/** A round's dust off the berm (rangeLook.kd.dust: { x, y, z, atMs }) at game time ms: motes thrown up and back toward the line, falling at 0.38 g. */
export function bermDustPixels(d, ms, ppm = PX_PER_M) {
  const t = (ms - d.atMs) / 1000;
  if (!(t >= 0 && t * 1000 < BERM_DUST_MS)) return [];
  const out = [];
  for (let i = 0; i < BERM_DUST_N; i++) {
    const h = (k) => hash01('berm', d.atMs, d.x, i, k);
    const up = BERM_DUST_UP_M * (0.3 + 0.7 * h('u')), v0 = Math.sqrt(2 * DUST_G_MS2 * up), back = -(0.2 + 0.8 * h('b')), side = (h('s') - 0.5) * 0.8;
    const y = (d.y ?? 1) + v0 * t - 0.5 * DUST_G_MS2 * t * t;
    if (y < 0) continue;
    if (h('stay') > 1 - t * 1000 / BERM_DUST_MS) continue;
    out.push({ x: snap(d.x + back * t, ppm), y: snap(y, ppm) + 0.5 / ppm, z: snap(d.z + side * t, ppm) + 0.05, c: DUST[i % DUST.length], flat: false });
  }
  return out;
}
