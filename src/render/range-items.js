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
//   - THE FLAGS: sleevePixels() a range flag's sleeve on its hoop at its pole's top, blowing toward the sim's wind
//     (flagOf's towardRad, the way it blows to), its five red and white bands filling one by one with its strength
//     (liftK, a band each 1.5 m/s), its shadow on the ground downwind, fluttering on game time (the user's report of v0.0.7: see the function);
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
/** A flag's sleeve: its length and its mouth's and tail's diameters (m: drawn bigger than life, the kit's way with small things, so its way and its lift read at 16 px/m), its bands (wind.js FLAG_BANDS). */
export const SLEEVE_M = Object.freeze({ len: 2.8, mouth: 0.5, tail: 0.22, poleTop: 4.5 }), SLEEVE_BANDS = 5;
/** The sleeve's hoop on its swivel, downwind of the pole (m); a slack band's hang and a full band's sag, each in a calm and in a gale (degrees below level); a slack band's share of its width (0.55 in the first cut: a sleeve blowing toward the camera read the same limp or straight out, the verifier's); the flutter's swing (degrees) and period (game ms). */
export const SLEEVE_ARM_M = 0.15, SLEEVE_HANG_DEG = Object.freeze([80, 65]), SLEEVE_SAG_DEG = Object.freeze([16, 3]), SLEEVE_SLACK_K = 0.4, SLEEVE_FLUTTER_DEG = 5, SLEEVE_FLUTTER_MS = 900;
/** The sleeve's shadow: how high it lies over the ground (m: the decals' lift). A slack band's creases: a darker row every SLEEVE_CREASE_PX rows of the picture. */
export const SHADOW_Y_M = 0.012, SLEEVE_CREASE_PX = 3;
/** The most cases drawn on a metre tile at rest (a tile's count can be the relay's whole string). */
export const TILE_CASES_MAX = 10;
/** A round's dust off the berm: motes, how high they go (m), the whole of it (game ms). */
export const BERM_DUST_N = 10, BERM_DUST_UP_M = 0.9, BERM_DUST_MS = 1600;
const SPOT = 0xf08a2a, SPOT_C = 0x1a1214, DISK = 0xf4efe6, DISK_INK = 0x1a1214, POLE = 0xb7b0a8, SLEEVE = [0xe85a3a, 0xf4efe6], MISS = 0xc23b2e, HOOP = 0x14161a, INSIDE = 0x241010, SHADOW = 0x24191a;
const DEG = Math.PI / 180;
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
/** The stake's height (m: art/kit/range.js kdPoint's H) and the mark's caret over your own plate (rows, px). */
export const STAKE_H_M = 0.6, OWN_CARET_ROWS = 3;
/**
 * Your own point's mark on its numbered stake (0.0.7's tower fixer; the user's report of 2026-11-07, "did call me line 5
 * when I'm line 10"): a frame of brass a pixel outside the plate the kit paints (kdPoint: the number on the Corps' red,
 * its size the font's at ppm), and a caret over it pointing down, so the stake on your row reads as yours among twenty.
 * own: rangeLook.kd.own ({ x, z, text }). Pixels { x, y, z, c } in metres, unlit by the outline (noLine).
 */
export function ownPointPixels(own, ppm = PX_PER_M) {
  if (!own) return [];
  const f = fontFor(ppm), P = 1 / ppm, text = String(own.text ?? '');
  const pw = Math.max(0.3, (f.width(text || '0') + 3) / ppm), ph = Math.max(0.25, (f.h + 3) / ppm), H = STAKE_H_M;
  const nx = Math.round(pw * ppm) + 2, ny = Math.round(ph * ppm) + 2, x0 = own.x - pw / 2 - P / 2, y0 = H - ph - P / 2, z = own.z + 0.08, out = [];
  for (let i = 0; i < nx; i++) { out.push({ x: x0 + i * P, y: y0, z, c: BRASS }); out.push({ x: x0 + i * P, y: y0 + (ny - 1) * P, z, c: BRASS }); }
  for (let j = 1; j < ny - 1; j++) { out.push({ x: x0, y: y0 + j * P, z, c: BRASS }); out.push({ x: x0 + (nx - 1) * P, y: y0 + j * P, z, c: BRASS }); }
  // (the caret: rows of 5, 3 and 1 pixels over the frame's top, pointing down at the plate)
  const top = y0 + (ny - 1) * P, cx = own.x;
  for (let r = 0; r < OWN_CARET_ROWS; r++) {
    const half = r;
    for (let dx = -half; dx <= half; dx++) out.push({ x: cx + dx * P, y: top + (2 + r) * P, z, c: BRASS_L });
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
 * z south; liftK the share of its SLEEVE_BANDS bands the wind fills, wind.js flagOf: speedMs / FLAG_FULL_MS 7.5, so
 * a band a FLAG_BAND_MS 1.5 m/s, a real sleeve's 3 knots) at game time ms: [{ x, y, z, c, flat?, shadow? }] metres.
 * The picture cannot tell north from up (seen from the south at 45°, a point at height y shows where the ground at
 * z − y does), so a sleeve streaming across the line of fire, the wind that matters on a range firing east, ran up
 * or down its own pole and read as limp (the user's report of v0.0.7, 2026-11-07: "the wind hose doesn't match the
 * wind instructions", a 3 m/s wind from the right drawn straight down the pole). It is drawn so that it reads in
 * every direction, a sleeve as it truly hangs (my calls):
 *   - THE HOOP: the mouth on a rigid ring at the pole's top, SLEEVE_ARM_M downwind of it on its swivel, upright
 *     and square to the wind: seen edge-on (a dark bar) in a wind along the line, face-on in a crosswind; a sleeve
 *     blowing away from the camera (north, a wind from the right of a shooter facing east) shows its open mouth, the
 *     dark inside ringed by the hoop, at the pole's top; one blowing toward it (south) covers the hoop with its body;
 *   - THE BANDS FILL as a real sleeve's do: band i full from (i + 1) × FLAG_BAND_MS, a full band out near level
 *     (SLEEVE_SAG_DEG, 16° below in a breeze to 3° straight out), a slack one hanging SLEEVE_HANG_DEG 80° below in a
 *     calm (65° as the rest fill), narrower (SLEEVE_SLACK_K of its width) and creased (a darker row every
 *     SLEEVE_CREASE_PX), a band filling between: so the count of full bands, wide and smooth, is the speed, two at
 *     3 m/s, limp under 1.5, straight out at 7.5, whichever way it blows. Blowing toward the camera (south, a wind from
 *     the left) a full band and a hanging one draw the same way down the picture (a point at height y shows where the
 *     ground at z − y does), so there the width and the creases tell them apart, and a sleeve straight out shows its
 *     tail's open end, dark, at its foot (an opening is seen when it faces the camera, the mouth's rule); 2.8 m long and 0.5 m across its
 *     mouth (bigger than life, the kit's way, and longer than 0.0.7's 2.2 m so two bands streaming away from the
 *     camera still stand clear of the hoop);
 *   - THE SHADOW: its body's track on the ground straight below it (a blob, the figures' way, not the sun's),
 *     dark, three pixels in four within and every other one at its edge (every other one throughout in the first
 *     cut, which read as a smear on the pole's own line in a north or south wind, the verifier's), from under the hoop
 *     downwind: the ground's plane shows north and south where height cannot;
 *   - THE FLUTTER: the slack bands' hang swinging a few degrees on SLEEVE_FLUTTER_MS of game time, its phase by the
 *     pole, and the gusts filling and emptying the bands (flagOf's speed is the gusting wind's).
 * The body is stamped as discs along its axis, farthest from the camera first, so the nearest band shows, and its
 * silhouette's edge is a shade darker; the shadow's pixels lie flat (shadow: true, no outline round them).
 */
export function sleevePixels(flag, ms, ppm = PX_PER_M) {
  const P = 1 / ppm, lift = Math.max(0, Math.min(1, flag.liftK ?? 0)), filled = lift * SLEEVE_BANDS;
  const t = flag.towardRad ?? 0, hx = Math.cos(t), hz = Math.sin(t), L = SLEEVE_M.len;
  const top = (flag.poleTop ?? SLEEVE_M.poleTop) - 0.08, r0 = SLEEVE_M.mouth / 2;
  const cx = flag.x + hx * SLEEVE_ARM_M, cz = flag.z + hz * SLEEVE_ARM_M;
  const sag = (SLEEVE_SAG_DEG[0] + (SLEEVE_SAG_DEG[1] - SLEEVE_SAG_DEG[0]) * lift) * DEG, hang = (SLEEVE_HANG_DEG[0] + (SLEEVE_HANG_DEG[1] - SLEEVE_HANG_DEG[0]) * lift) * DEG;
  const ph = 2 * Math.PI * hash01('sleeve', flag.x, flag.z), wave = 2 * Math.PI * ms / SLEEVE_FLUTTER_MS;
  // (the axis: from the hoop's centre band by band, each at its own angle below level; d the body's diameter there)
  const steps = Math.max(SLEEVE_BANDS * 4, Math.round(2 * L * ppm)), axis = [];
  // (a band's width share: 1 full to SLEEVE_SLACK_K slack; the hoop holds the mouth open, so band 0 starts at 1, and
  // each band eases from the last's over its first third)
  const fillOf = (i) => Math.max(0, Math.min(1, filled - i)), kOf = (i) => (i < 0 ? 1 : SLEEVE_SLACK_K + (1 - SLEEVE_SLACK_K) * fillOf(i));
  let x = cx, y = top, z = cz;
  for (let s = 0; s <= steps; s++) {
    const along = s / steps, i = Math.min(SLEEVE_BANDS - 1, Math.floor(along * SLEEVE_BANDS)), u = along * SLEEVE_BANDS - i;
    const fill = fillOf(i), k = kOf(i - 1) + (kOf(i) - kOf(i - 1)) * Math.min(1, u * 3);
    const d = (SLEEVE_M.mouth + (SLEEVE_M.tail - SLEEVE_M.mouth) * along) * k;
    axis.push({ x, y, z, d, band: i, fill });
    const a = hang + (sag - hang) * fill + SLEEVE_FLUTTER_DEG * DEG * (1 - 0.8 * fill) * Math.sin(wave + ph + i * 0.9);
    const ds = L / steps;
    x += hx * Math.cos(a) * ds; z += hz * Math.cos(a) * ds; y -= Math.sin(a) * ds;
  }
  // (the picture: a pixel per (gx, gy), the last stamp kept; depth toward the camera is z + y)
  const pic = new Map();
  // (the mouth's side of the picture: a body pixel near the hoop on its upwind side is cut, so the mouth ends square
  // at the hoop and not in a ball; along the first band's way as the picture has it)
  const a0 = hang + (sag - hang) * fillOf(0), mx = hx * Math.cos(a0), my = hz * Math.cos(a0) + Math.sin(a0), ml = Math.hypot(mx, my) || 1;
  const hqx = cx * ppm, hqy = (cz - top) * ppm, NEAR_M = SLEEVE_M.mouth;
  const stamp = (q, rM, c, cut = false, body = true, crease = false) => {
    const R = rM * ppm, qx = q.x * ppm, qy = (q.z - q.y) * ppm, yv = snap(q.y, ppm) + 0.5 * P;
    for (let gy = Math.floor(qy - R); gy <= Math.ceil(qy + R); gy++) for (let gx = Math.floor(qx - R); gx <= Math.ceil(qx + R); gx++) {
      const e = Math.hypot(gx + 0.5 - qx, gy + 0.5 - qy);
      if (e > R + 0.15) continue;
      if (cut && ((gx + 0.5 - hqx) * mx + (gy + 0.5 - hqy) * my) / ml < -0.5) continue;
      pic.set(`${gx},${gy}`, { x: (gx + 0.5) * P, y: yv, z: (gy + 0.5) * P + yv, c: crease && ((gy % SLEEVE_CREASE_PX) + SLEEVE_CREASE_PX) % SLEEVE_CREASE_PX === 0 ? tone8(c) : c, body });
    }
  };
  // (the hoop: a ring square to the wind; its inside seen when it faces the camera (the wind from the south: hz < 0))
  const hoop = [], H = 24;
  for (let j = 0; j < H; j++) {
    const f = 2 * Math.PI * j / H, a = Math.cos(f) * r0, b = Math.sin(f) * r0;
    hoop.push({ x: cx - hz * a, y: top + b, z: cz + hx * a });
  }
  const facing = -hz, ring = () => { for (const q of hoop) stamp(q, 0.6 / ppm, HOOP, false, false); };
  if (facing <= 0.2) ring();
  const order = axis.map((q, i) => ({ q, i, depth: q.z + q.y })).sort((a, b) => a.depth - b.depth || b.i - a.i);
  for (const { q, i } of order) stamp(q, q.d / 2, SLEEVE[q.band % 2], i * L / steps < NEAR_M, true, q.fill < 0.5);
  // (the tail's open end, when its last band is full and the tail faces the camera (along its axis, + toward the
  // south and up: the camera's side): a dark disc inside its rim at the tail's end)
  const qe = axis.at(-1), qp = axis.at(-2), tl = Math.hypot(qe.x - qp.x, qe.y - qp.y, qe.z - qp.z) || 1, tailFacing = ((qe.z - qp.z) + (qe.y - qp.y)) / tl / Math.SQRT2;
  if (qe.fill > 0.6 && tailFacing > 0.3) {
    const R = qe.d / 2 * ppm - 1, qx = qe.x * ppm, qy = (qe.z - qe.y) * ppm, yv = snap(qe.y, ppm) + 0.5 * P;
    for (let gy = Math.floor(qy - R); gy <= Math.ceil(qy + R); gy++) for (let gx = Math.floor(qx - R); gx <= Math.ceil(qx + R); gx++) {
      if (Math.hypot(gx + 0.5 - qx, gy + 0.5 - qy) > Math.max(0.75, R)) continue;
      pic.set(`${gx},${gy}`, { x: (gx + 0.5) * P, y: yv, z: (gy + 0.5) * P + yv, c: INSIDE, body: false });
    }
  }
  if (facing > 0.2) {
    // (the open mouth: the dark inside, the hoop's disc as the picture has it (an offset (X, Y) from its centre is the
    // disc's (a, b) with X = −hz·a, Y = hx·a − b), then the hoop round it)
    const R = r0 * ppm;
    for (let gy = Math.floor(hqy - 2 * R); gy <= Math.ceil(hqy + 2 * R); gy++) for (let gx = Math.floor(hqx - R); gx <= Math.ceil(hqx + R); gx++) {
      const a = -(gx + 0.5 - hqx) / hz, b = hx * a - (gy + 0.5 - hqy);
      if (a * a + b * b > R * R) continue;
      const yv = snap(top + b * P, ppm) + 0.5 * P;
      pic.set(`${gx},${gy}`, { x: (gx + 0.5) * P, y: yv, z: (gy + 0.5) * P + yv, c: INSIDE, body: false });
    }
    ring();
  } else if (facing > -0.2) ring();
  // (the body's silhouette a shade darker at its edge, the bands their own colours within: the stage inks round the lot)
  const out = [];
  for (const [key, p] of pic) {
    const [gx, gy] = key.split(',').map(Number), edge = p.body && !(pic.has(`${gx - 1},${gy}`) && pic.has(`${gx + 1},${gy}`) && pic.has(`${gx},${gy - 1}`) && pic.has(`${gx},${gy + 1}`));
    out.push({ x: p.x, y: p.y, z: p.z, c: edge ? tone8(p.c) : p.c });
  }
  // (the shadow: the body's track on the ground, straight below it, three pixels in four within, every other one at its edge)
  const ground = new Set();
  for (const q of axis) {
    const R = q.d / 2 * ppm, qx = q.x * ppm, qz = q.z * ppm;
    for (let gz = Math.floor(qz - R); gz <= Math.ceil(qz + R); gz++) for (let gx = Math.floor(qx - R); gx <= Math.ceil(qx + R); gx++) {
      const e = Math.hypot(gx + 0.5 - qx, gz + 0.5 - qz);
      if (e > R || (e > R - 1.2 ? (gx + gz) & 1 : (gx & 1) && (gz & 1))) continue;
      const key = `${gx},${gz}`;
      if (ground.has(key)) continue;
      ground.add(key);
      out.push({ x: (gx + 0.5) * P, y: SHADOW_Y_M, z: (gz + 0.5) * P, c: SHADOW, flat: true, shadow: true });
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

// ---------- 0.0.8: the pairs pad's turning targets (the build sheet 0.0.8 §2.4, §4's face; VIEWS §7.4, §11) ----------
//
// A turner's face (rangeLook.pairs.turners: { key, lane, x, z, y (its centre's height), facingK 0 edge-on to 1 facing,
// face 'paper' | 'armoured' | null (the threat's and the no-shoot's board alike: see below), holds (what the marine has
// identified it holding, else null), holes, down, plateAtMs }) is drawn TURNER_K times life size, as
// the KD faces are FACE_K (a 0.46 × 0.76 m man-target 15 × 24 px at 16 px/m, beside a chibi of 34: man-sized), facing
// the camera as every target on the range is (the range's convention: src/art/kit/range.js's header), its drawn
// width the face's × facingK, at least the one pixel of its edge: so it turns over its real TURN_MS, a pixel or two a
// frame, and never jumps; edge-on it is a thin dark line on its stand, and the face hung on it changes only then (the
// scene hangs it edge-on). Its painting (turnerFace): a man-target's silhouette cut from board (the head a disc 8 cm
// across its radius at [0, −30] cm, the shoulders rounding into a torso 46 cm wide, the A zone's perforations 16 × 28
// cm at its middle where the density parts them), every paper face one board colour, khaki, threat and no-shoot alike,
// with what it holds painted in the hands only once the marine has identified it (pairs.js seenFace: a rifle across the
// body, a pistol held out at the chest, open hands raised, a phone at the ear), the armoured silhouette steel-grey with
// its plate on the chest and its head plate (steel is seen as steel). The picture draws what the character perceives
// (PEOPLE §7.6; COMBAT §25.4.6; the fixer's of 0.0.8, after the reviews: olive for a threat and pale for a no-shoot
// from the turn, at 15 × 24 px, gave the answer before the take-in, and the identification and Challenge nothing to do).
// Holes (turnerHolePixel): where the shot put them on the face (cm from its centre, x right, y down), dark through
// board, a lead splash where a round rang on steel and a dark hole where one went through it; a new one puffs as the
// card's do. The steel's spark (sparkPixels): a round that rings throws SPARK_N sparks off the plate for SPARK_MS of
// game time, flung from the strike and falling, and the strike's white flash for its first tick, drawn unlit (a light
// of its own). The head plate knocked down (plateAtMs) falls off the face under Mars' gravity, drifting off its hinge, to
// the ground in front of the stand, where it lies (nothing pops out of view), its hinge left; each round that rings rocks
// the face a pixel over ROCK_MS (the fixer's of 0.0.8, after the design review: at 16 px/m the steel's moment hardly
// showed in the picture: a 180 ms spark and a head plate gone in a few pixels).
/** The turner's face drawn this many times life size (as the KD faces' FACE_K; my call, the build sheet 0.0.8 §4). */
export const TURNER_K = 2;
/** The face's size and its centre's height when the look gives none (m: the scene's PAIRS.face, the build sheet 0.0.8 §2.3). */
export const TURNER_FACE_M = Object.freeze({ wM: 0.46, hM: 0.76, centreY: 1.35 });
/** The man-target's silhouette (cm from the face's centre, y down: paper.js PAPERS.man's zones, §2.2). */
export const MAN_CM = Object.freeze({ w: 46, h: 76, head: Object.freeze({ r: 8, at: Object.freeze([0, -30]) }), A: Object.freeze([16, 28]), torsoTop: -18 });
/** The steel's spark: how long (game ms), how many, how fast they fly (m/s), and the strike's flash (game ms). */
export const SPARK_MS = 180, SPARK_N = 9, SPARK_V_MS = 6, SPARK_FLASH_MS = 50;
/** The head plate knocked down: its drift off the hinge (m/s, sideways) as it falls at Mars' gravity, and its fall's end (game ms: from the head's height to the ground). */
export const PLATE_DRIFT_MPS = 0.35, PLATE_FALL_MS = 1100;
/** A round that rings rocks the face a pixel one way then back over this long (game ms). */
export const ROCK_MS = 120;
/** The face's pixels stand this far off the stand toward the camera (m: as HOLE_LIFT_M, so it wins the depth test against the shaft and clamp), its holes a little more. */
export const TURNER_LIFT_M = 0.2, TURNER_HOLE_LIFT_M = 0.24;
/** The outline's parts: a turner's face is its own part (lane + this), so the outline pass inks round its silhouette. */
export const TURNER_PART = 0xa5a5c1;
const TURNER_C = Object.freeze({
  // (every paper face one khaki board, threat or no-shoot, so it stands off the regolith's orange and the cards' white
  // and says nothing of its kind (see the header); my call)
  paper: Object.freeze({ face: 0x9c9474, edge: 0x4a4636, zone: 0xb3ab8a, hold: 0x14120f }),
  threat: Object.freeze({ face: 0x9c9474, edge: 0x4a4636, zone: 0xb3ab8a, hold: 0x14120f }),
  noshoot: Object.freeze({ face: 0x9c9474, edge: 0x4a4636, zone: 0xb3ab8a, hold: 0x14120f }),
  armoured: Object.freeze({ face: 0x7c8592, edge: 0x3b3f4a, zone: 0x5b636f, plate: 0x4e5560, head: 0x98a2ae, hold: 0x231c1c }),
});
const SKIN = 0xd99a7a, PHONE = 0x1d1d24, SPLASH = 0xc9ccd2, SPARK_C = Object.freeze([0xfff6c8, 0xffd36a, 0xff9a3a]);
/** Whether a cm point lies on the man-target's silhouette, and on which part ('head', 'neck', 'torso'), or null. */
export function manPart(xCm, yCm) {
  const H = MAN_CM.head, w2 = MAN_CM.w / 2;
  if (Math.hypot(xCm - H.at[0], yCm - H.at[1]) <= H.r) return 'head';
  if (Math.abs(xCm) <= 4 && yCm >= H.at[1] + H.r - 1 && yCm < MAN_CM.torsoTop) return 'neck';
  if (yCm >= MAN_CM.torsoTop && yCm <= MAN_CM.h / 2) {
    // (the shoulders round from 17 cm a side at the torso's top to the full 23 six centimetres down)
    const half = yCm < MAN_CM.torsoTop + 6 ? w2 - 6 + (yCm - MAN_CM.torsoTop) : w2;
    if (Math.abs(xCm) <= half) return 'torso';
  }
  return null;
}
/** The face's size in pixels at the density: { w, h, k (px a cm) } (15 × 24 at 16 px/m). */
export function turnerPx(ppm = PX_PER_M, F = TURNER_FACE_M) {
  return { w: Math.max(5, Math.round(F.wM * TURNER_K * ppm)), h: Math.max(8, Math.round(F.hM * TURNER_K * ppm)), k: TURNER_K * ppm / 100 };
}
const faceMemo = new Map();
/**
 * A face's painting: { w, h, cells: [colour | null] (row by row, null clear), edge (the one pixel seen edge-on, top to
 * bottom) }, by its kind and what it holds (remembered). kind 'paper' | 'armoured' (and 'threat', 'noshoot': the paper's
 * board); holds 'rifle' |
 * 'pistol' | 'hands' | 'phone' | null; head false once its plate is gone (the armoured's).
 */
export function turnerFace(kind = 'paper', holds = null, ppm = PX_PER_M, { head = true } = {}) {
  const key = `${kind}|${holds}|${ppm}|${head}`;
  if (faceMemo.has(key)) return faceMemo.get(key);
  const { w, h } = turnerPx(ppm), C0 = TURNER_C[kind] ?? TURNER_C.threat, cells = new Array(w * h).fill(null);
  const cm = (i, j) => [((i + 0.5) / w - 0.5) * MAN_CM.w, ((j + 0.5) / h - 0.5) * MAN_CM.h];
  const partAt = (i, j) => (i < 0 || j < 0 || i >= w || j >= h ? null : manPart(...cm(i, j)));
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const p = partAt(i, j);
    if (!p || (!head && p === 'head')) continue;
    const [x, y] = cm(i, j);
    // (the edge where a neighbour is off the silhouette: the board's cut edge, darker)
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([di, dj]) => { const q = partAt(i + di, j + dj); return !q || (!head && q === 'head'); });
    let c = edge ? C0.edge : C0.face;
    if (kind === 'armoured' && p === 'head') c = edge ? C0.edge : C0.head;
    else if (kind === 'armoured' && p === 'torso' && Math.abs(x) <= 12 && y >= -12 && y <= 16 && !edge) c = C0.plate;
    // (the A zone's perforation, a dotted line where the density gives it three pixels or more inside)
    else if (!edge && kind !== 'armoured' && w >= 12) {
      const [aw, ah] = MAN_CM.A, hx = MAN_CM.w / w / 2, hy = MAN_CM.h / h / 2;
      const onX = Math.abs(Math.abs(x) - aw / 2) < hx && Math.abs(y) <= ah / 2, onY = Math.abs(Math.abs(y) - ah / 2) < hy && Math.abs(x) <= aw / 2;
      if ((onX || onY) && (i + j) % 2 === 0) c = C0.zone;
    }
    cells[j * w + i] = c;
  }
  const put = (xCm, yCm, wCm, hCm, c) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const [x, y] = cm(i, j);
      if (x >= xCm - wCm / 2 && x <= xCm + wCm / 2 && y >= yCm - hCm / 2 && y <= yCm + hCm / 2) cells[j * w + i] = c;
    }
  };
  // (what it holds, painted in its hands: never more than the board would carry)
  if (holds === 'rifle') { put(2, 8, 40, 3.2, C0.hold); put(-12, 12, 5, 4, C0.hold); }
  else if (holds === 'pistol') { put(0, 4, 7, 9, C0.hold); put(0, 10, 9, 4, SKIN); }
  // (open hands raised beside the head, inside the brackets' corners so the pick's brackets never hide them)
  else if (holds === 'hands') { put(-13, -25, 6, 8, SKIN); put(13, -25, 6, 8, SKIN); }
  else if (holds === 'phone') { put(7, -29, 4, 8, PHONE); put(8, -24, 6, 5, SKIN); }
  // (seen edge-on: the board's edge down its middle, where the silhouette is)
  const mid = Math.floor(w / 2), edge = [];
  for (let j = 0; j < h; j++) edge.push(cells[j * w + mid] ? C0.edge : null);
  const out = { w, h, cells, edge, kind };
  faceMemo.set(key, out);
  return out;
}
/**
 * Where a turner's face is drawn: { x0, x1 (its drawn columns' edges), cx, yTop, yBot, cy, z, w, h, dw (the drawn
 * width in pixels: w × facingK, at least 1), k (px a cm), facingK }. The face turns about its middle (the shaft).
 */
export function turnerAt(t, ppm = PX_PER_M, F = TURNER_FACE_M) {
  const { w, h, k } = turnerPx(ppm, F), fk = Math.max(0, Math.min(1, Number(t.facingK) || 0));
  const dw = Math.max(1, Math.round(w * fk)), cx = snap(t.x, ppm), cy = t.y ?? F.centreY;
  const yTop = snap(cy + h / ppm / 2, ppm), x0 = cx - Math.floor(dw / 2) / ppm;
  return { x0, x1: x0 + dw / ppm, cx, yTop, yBot: yTop - h / ppm, cy: yTop - h / ppm / 2, z: snap(t.z, ppm), w, h, dw, k, facingK: fk };
}
/** A face's pixel column for a drawn column (0 … dw − 1): the painting's column it shows, foreshortened. */
const srcCol = (i, dw, w) => Math.min(w - 1, Math.floor((i + 0.5) * w / dw));
/** A hole's pixel on a turner's face as drawn (cm from its centre, x right, y down): { x, y, z, i, j } or null off the face. */
export function turnerHolePixel(ta, hole, ppm = PX_PER_M) {
  const i = Math.floor(ta.w / 2 + hole.xCm * ta.k), j = Math.floor(ta.h / 2 + hole.yCm * ta.k);
  if (i < 0 || i >= ta.w || j < 0 || j >= ta.h) return null;
  // (on a face turned part-way, the drawn column that shows the painting's column i)
  const di = ta.dw >= ta.w ? i : Math.min(ta.dw - 1, Math.floor(i * ta.dw / ta.w));
  return { x: ta.x0 + (di + 0.5) / ppm, y: ta.yTop - (j + 0.5) / ppm + TURNER_HOLE_LIFT_M, z: ta.z + TURNER_HOLE_LIFT_M, i, j };
}
/**
 * A turner's pixels at game time ms: [{ x, y, z, c, part, noLine }] metres: its face foreshortened by facingK, its holes,
 * a new hole's puff, the steel's spark and the head plate falling. Nothing for a stand with no face hung.
 */
export function turnerPixels(t, ms, ppm = PX_PER_M) {
  if (!t?.face) return [];
  const plateGone = t.face === 'armoured' && Number.isFinite(t.plateAtMs) && ms >= t.plateAtMs;
  const ta = turnerAt(t, ppm), pf = turnerFace(t.face, t.holds ?? null, ppm, { head: !plateGone }), out = [];
  const part = TURNER_PART + (t.lane ?? 0), P = 1 / ppm, L = TURNER_LIFT_M;
  // (a round that rang within ROCK_MS: the face rocks a pixel one way, then back (see the header))
  const rang = (t.holes ?? []).reduce((m, h) => (h.ring && Number.isFinite(h.atMs) && ms >= h.atMs && ms - h.atMs < ROCK_MS ? Math.max(m, ms - h.atMs) : m), -1);
  const rock = rang < 0 ? 0 : (rang < ROCK_MS / 2 ? 1 : -1) * P;
  for (let i = 0; i < ta.dw; i++) {
    const si = ta.dw === 1 ? -1 : srcCol(i, ta.dw, pf.w);
    for (let j = 0; j < pf.h; j++) {
      const c = si < 0 ? pf.edge[j] : pf.cells[j * pf.w + si];
      if (c === null || c === undefined) continue;
      out.push({ x: ta.x0 + (i + 0.5) * P + rock, y: ta.yTop - (j + 0.5) * P + L, z: ta.z + L, c, part, noLine: false });
    }
  }
  // (the head plate knocked off: it falls at Mars' gravity, drifting off its hinge, to the ground before the stand, and lies
  // there as a flat disc (see the header); its hinge a dark pixel row left)
  if (plateGone) {
    const dt = Math.max(0, ms - t.plateAtMs), H = MAN_CM.head;
    if (ta.dw > 1) {
      const r = H.r * ta.k * ta.facingK, cxp = ta.x0 + ta.dw / 2 * P, cyp = ta.yTop - (pf.h / 2 + H.at[1] * ta.k) * P, s0 = dt / 1000;
      // (where it is: the fall from the head's height, the drift sideways; on the ground (y at its radius) it lies flat)
      const R0 = Math.round(H.r * ta.k), floor = (Math.ceil(R0 * 0.35) + 1) * P, yFall = cyp - 0.5 * DUST_G_MS2 * s0 * s0, lying = yFall <= floor || dt >= PLATE_FALL_MS;
      const px0 = snap(cxp + PLATE_DRIFT_MPS * Math.min(s0, PLATE_FALL_MS / 1000), ppm), py0 = lying ? floor : snap(yFall, ppm);
      const flat = lying ? 0.35 : 1;
      for (let dy = -R0; dy <= R0; dy++) for (let dx = -Math.round(r); dx <= Math.round(r); dx++) {
        if (Math.hypot(dx / Math.max(0.5, ta.facingK), dy / flat) > H.r * ta.k) continue;
        out.push({ x: px0 + (dx + 0.5) * P, y: py0 - (dy + 0.5) * P + L + 0.01, z: ta.z + L + 0.01, c: dy === -R0 && !lying ? TURNER_C.armoured.edge : TURNER_C.armoured.head, part, noLine: false });
      }
    }
    const hy = ta.yTop - (pf.h / 2 + (H.at[1] + H.r) * ta.k) * P;
    for (let i = Math.max(0, Math.floor(ta.dw / 2) - 1); i <= Math.min(ta.dw - 1, Math.floor(ta.dw / 2) + 1); i++) out.push({ x: ta.x0 + (i + 0.5) * P, y: hy + L, z: ta.z + L, c: TURNER_C.armoured.edge, part, noLine: false });
  }
  // (the holes: dark through board and through steel, a lead splash where a round rang; a new one's puff of board)
  for (const h of t.holes ?? []) {
    const q = turnerHolePixel(ta, h, ppm);
    if (!q || (h.zone === 'head' && plateGone && t.face === 'armoured')) continue;
    // (a hole reads against its face: dark through the khaki board and through steel)
    out.push({ x: q.x, y: q.y, z: q.z, c: h.ring && !h.through ? SPLASH : DARK, part, noLine: true });
    const age = Number.isFinite(h.atMs) ? ms - h.atMs : Infinity;
    if (!h.ring && age >= 0 && age < PUFF_MS) for (const [dx, dy] of age < PUFF_MS / 2 ? [[1, 0], [-1, 0], [0, -1]] : [[1, -1], [-1, -1]]) out.push({ x: q.x + dx * P, y: q.y - dy * P, z: q.z, c: PALE, part, noLine: true });
  }
  return out;
}
/**
 * The steel's spark for a round that rang (a hole { xCm, yCm, ring, atMs }) at game time ms: [{ x, y, z, c }] metres, unlit:
 * the strike's flash (a plus, white) for SPARK_FLASH_MS, then SPARK_N sparks flung off the plate (their ways by hash,
 * SPARK_V_MS, falling at Mars' 3.7 m/s², fading from white to orange) until SPARK_MS. None off steel or past its time.
 */
export function sparkPixels(t, hole, ms, ppm = PX_PER_M) {
  if (!t || !hole?.ring || !Number.isFinite(hole.atMs)) return [];
  const dt = ms - hole.atMs;
  if (!(dt >= 0 && dt < SPARK_MS)) return [];
  const ta = turnerAt(t, ppm), q = turnerHolePixel(ta, hole, ppm);
  if (!q) return [];
  const P = 1 / ppm, out = [], s = dt / 1000, lift = 0.06;
  if (dt < SPARK_FLASH_MS) for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) out.push({ x: q.x + dx * P, y: q.y + dy * P + lift, z: q.z + lift, c: SPARK_C[0] });
  for (let n = 0; n < SPARK_N; n++) {
    const hh = (k) => hash01('spark', hole.atMs, hole.xCm, hole.yCm, n, k);
    // (sprayed all round the strike in the plate's plane, as the picture shows the plate: a star of streaks, falling)
    const a = 2 * Math.PI * (n + hh('a')) / SPARK_N, v = SPARK_V_MS * (0.4 + 0.6 * hh('v'));
    const x = q.x + Math.cos(a) * v * s, y = q.y + Math.sin(a) * v * s * 0.6 - 0.5 * DUST_G_MS2 * s * s;
    const life = SPARK_MS * (0.5 + 0.5 * hh('l'));
    if (dt > life) continue;
    const c = SPARK_C[Math.min(2, Math.floor(dt / life * 3))];
    out.push({ x: snap(x, ppm) + 0.5 * P, y: snap(y, ppm) + 0.5 * P + lift, z: q.z + lift, c });
    // (a streak: where it was a frame before, a pixel behind it along its flight, so it reads as moving)
    const s0 = Math.max(0, s - 0.016), x0 = q.x + Math.cos(a) * v * s0, y0 = q.y + Math.sin(a) * v * s0 * 0.6 - 0.5 * DUST_G_MS2 * s0 * s0;
    if (Math.round(x0 * ppm) !== Math.round(x * ppm) || Math.round(y0 * ppm) !== Math.round(y * ppm)) out.push({ x: snap(x0, ppm) + 0.5 * P, y: snap(y0, ppm) + 0.5 * P + lift, z: q.z + lift, c: SPARK_C[2] });
  }
  return out;
}
