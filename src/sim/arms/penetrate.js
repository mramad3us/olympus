// OLYMPUS arms: what a round does to whatever is in its way, paper, earth, steel, armour and people, and the line it flies through a live area (WEAPONS §7.7, §8.2 to §8.7; the build sheet 0.0.7 §2.1, §8 item 16).
//
// **One contest for everything** (WEAPONS §8.2, my call): a round's penetration, pen(v) = pen0 × (v / v0)^penExp
// mm of rolled homogeneous armour (penOf, from the flight table's speed), against a layer's P_eff = P × (1 − wear)
// (P a material's pPerMm × its thickness, or an armour layer's rating): pStop = 1 below half the rating (the
// floor: a pistol round never beats a rifle plate), else the logistic 1 / (1 + exp((pen − P) / (0.1 P + 0.3))),
// so a rating is never a wall from above; a round through keeps v × √(1 − P / pen) (after). A frangible round
// meeting a hard material is resolved at half its pen and, through it, flies on as fragments (FRAG_PEN_K 0.3
// of its pen, woundK FRAG_WOUND_K 0.3). MATERIALS are WEAPONS §8.5's table; the berm and the ground stop all.
//
// **Armour** (WEAPONS §8.3; tradecraft's armour.js adapted): where a torso hit lands on what a person wears is
// tradecraft's layerHit() to the die, u = U(0, 1) × (1 − AIM_K 0.2 × centreOf(margin)), plate under its cover,
// soft under plate + soft, else bare (a well-aimed round nearer the middle); tradecraft's per-calibre STOP table
// becomes the logistic on each layer's rating (ARMOUR: the Corps' carrier, plate 11 over soft 4, covering 0.55
// and 0.30 of the torso); the helmet's dome HELMET_COVER 0.6 of head hits; behind a stop, tradecraft's blunt
// trauma (BLUNT: points × k, a rib cracked min(0.5, crack × w²), winded KNOCK_S × w, knocked down min(0.6,
// knock × w)) for BODY to apply; each stop wears its layer (WEAR, at most WEAR_MAX 0.5).
//
// **Through the body** (WEAPONS §8.4; the build sheet §8 item 16, not tradecraft's EXIT_P): the tissue resists by
// TISSUE_P (torso 1.6, a limb 0.8, the head 1.4 mm RHAe; a frangible round ×2): it exits when pen > P × U(0.7,
// 1.3) and goes on with pen − P (over-penetration: every rifle ball exits a torso).
//
// **The line** (traceRound, WEAPONS §7.7): from the muzzle along its yaw and pitch, the bore line's drop in the
// place's gravity (ballistics.js boreTable), through the live area as the range authors it (src/data/places/
// range.js KD_RANGE): the ground (y 0; the pits' floor −2.5 m between their walls), the parapet (0.5 m over the
// floor in front of the faces), the KD's berm (8 m) and the bay's (3 m) stop it; the faces and the 25 m cards are
// paper (holed, never stopping: the hole in cm on the face, x right and y down as seen from the line); every
// body whose height span the line crosses within BODY_R_M 0.25 m of its centre line is hit (the part by the
// line's height on the span: legs to 45%, torso to 85%, the head above; a prone body along its length, head
// first), within STRAY_M 0.35 m STRAY_HIT 0.25 of the time (tradecraft's STRAY); every person it passes within
// CRACK_M 3 m a near miss, cracking while supersonic in air (§2.7). Every draw on stream('pen', seed, rngKey).
// It never writes the body: it returns the hits (hitOf: WEAPONS §8.7's record, its w from woundFactor) and the
// caller hands each to BODY's applyHit. holeArea() sizes every hole a round makes (WEAPONS §8.6), for later readers.
// Pure.
import { stream, range, chance } from '../../core/rng.js';
import { playerActor } from '../../core/ids.js';
import { KD_RANGE } from '../../data/places/range.js';
import { CALIBRES, loadOf } from './calibres.js';
import { boreTable, airOf, envOfPlace, woundFactor } from './ballistics.js';
import { SPAN_M } from './carry.js';
import { faceUpAt } from './pits.js';

/** WEAPONS §8.5's materials: { word, pPerMm, hard }; stopsAll: earth that no small arm crosses. */
export const MATERIALS = Object.freeze({
  paper: Object.freeze({ word: 'paper', pPerMm: 0, hard: false }),
  regolith: Object.freeze({ word: 'regolith', pPerMm: 0.05, hard: false }),
  berm: Object.freeze({ word: 'the berm', pPerMm: 0.05, hard: false, stopsAll: true }),
  ground: Object.freeze({ word: 'the ground', pPerMm: 0.05, hard: false, stopsAll: true }),
  concrete: Object.freeze({ word: 'concrete', pPerMm: 0.15, hard: true }),
  steelMild: Object.freeze({ word: 'mild steel', pPerMm: 0.8, hard: true }),
  steelArmour: Object.freeze({ word: 'armour steel', pPerMm: 1.0, hard: true }),
  aluminium: Object.freeze({ word: 'aluminium alloy', pPerMm: 0.3, hard: true }),
  titanium: Object.freeze({ word: 'titanium', pPerMm: 0.55, hard: true }),
  cfrp: Object.freeze({ word: 'composite', pPerMm: 0.25, hard: true }),
  // (hard, against §8.5's table's "no": its own perforations (frangible through a cabin wall 23%) are a hard skin's, the
  // panel's aluminium faces; my call, a doc change for WEAPONS §8.5)
  honeycomb: Object.freeze({ word: 'honeycomb panel', pPerMm: 0.05, hard: true }),
  glass: Object.freeze({ word: 'glass', pPerMm: 0.1, hard: true }),
  ice: Object.freeze({ word: 'water ice', pPerMm: 0.01, hard: true }),
});
/** WEAPONS §8.5's examples as walls: { material, mm }. */
export const WALLS = Object.freeze({
  partition: Object.freeze({ word: 'a 2 mm partition', material: 'aluminium', mm: 2 }),
  cabin: Object.freeze({ word: 'a cabin wall', material: 'honeycomb', mm: 25 }),
  bulkhead: Object.freeze({ word: 'a pressure bulkhead', material: 'aluminium', mm: 8 }),
  pressureDoor: Object.freeze({ word: 'a pressure door', material: 'steelMild', mm: 6 }),
  lander: Object.freeze({ word: 'a lander\'s skin', material: 'titanium', mm: 4 }),
  habitat: Object.freeze({ word: 'a habitat wall', material: 'steelArmour', mm: 3.5 }),
  ice1m: Object.freeze({ word: '1 m of ice', material: 'ice', mm: 1000 }),
  locker: Object.freeze({ word: 'a locker', material: 'steelMild', mm: 1.5 }),
  sandbag: Object.freeze({ word: 'a 40 cm sandbag', material: 'regolith', mm: 400 }),
  baseWall: Object.freeze({ word: 'Base Melas\'s wall', material: 'concrete', mm: 200 }),
});
/** The tissue's resistance (WEAPONS §8.4), mm RHAe; a frangible round's ×FRANGIBLE_TISSUE_K. */
export const TISSUE_P = Object.freeze({ torso: 1.6, limb: 0.8, head: 1.4 });
export const FRANGIBLE_TISSUE_K = 2;
/** A frangible round on a hard layer: half its pen; through, fragments at FRAG_PEN_K of the pen and FRAG_WOUND_K of the wound. */
export const FRANGIBLE_HARD_K = 0.5, FRAG_PEN_K = 0.3, FRAG_WOUND_K = 0.3;
/** pStop's floor (a share of the rating) and its width (× the rating, + mm). */
export const STOP_FLOOR_K = 0.5, STOP_WIDTH_K = 0.1, STOP_WIDTH_MM = 0.3;
/** The exit's draw: tissue × U(EXIT_U[0], EXIT_U[1]) (WEAPONS §8.4). */
export const EXIT_U = Object.freeze([0.7, 1.3]);
/** The line through bodies (tradecraft's STRAY): hit within BODY_R_M, within STRAY_M STRAY_HIT of the time; a near miss within CRACK_M. */
export const BODY_R_M = 0.25, STRAY_M = 0.35, STRAY_HIT = 0.25, CRACK_M = 3;
/** The part by the line's height on a standing span: legs to LEGS_TO, torso to TORSO_TO, the head above; a prone body's along its length (head first). */
export const LEGS_TO = 0.45, TORSO_TO = 0.85, PRONE_HEAD_TO = 0.15, PRONE_TORSO_TO = 0.6, PRONE_LEN_M = 1.8, PRONE_AHEAD_M = 0.35;
/** A face's paper (m) where the range does not say: the KD's A face, the 25 m card. */
export const FACE_HALF_M = 0.5, CARD_HALF_M = 0.15;
/** The march's step along the line where it looks for the ground (m), and the bisection's finish (m). */
export const MARCH_M = 2, FINE_M = 0.01;

/** WEAPONS §8.3's armour layers: { word, P (mm RHAe), blunt { k, crack, knock }, wear a stop }. */
export const LAYERS = Object.freeze({
  soft: Object.freeze({ word: 'the soft panel', P: 4, blunt: Object.freeze({ k: 0.22, crack: 0.05, knock: 0.1 }), wear: 0.02 }),
  plate: Object.freeze({ word: 'the plate', P: 11, blunt: Object.freeze({ k: 0.30, crack: 0.06, knock: 0.15 }), wear: 0.08 }),
  helmet: Object.freeze({ word: 'the helmet', P: 5, blunt: null, wear: 0.05 }),
  visor: Object.freeze({ word: 'the visor', P: 2, blunt: null, wear: 0.05 }),
  lightSuit: Object.freeze({ word: 'the suit\'s shell', P: 1, blunt: Object.freeze({ k: 0.1, crack: 0, knock: 0 }), wear: 0 }),
  insurgentPlate: Object.freeze({ word: 'a steel plate', P: 6, blunt: Object.freeze({ k: 0.35, crack: 0.06, knock: 0.15 }), wear: 0.03 }),
});
/** What a kind of armour covers on the torso (WEAPONS §8.3): the Corps' carrier, a soft vest, an insurgent's plate. */
export const ARMOUR = Object.freeze({
  carrier: Object.freeze({ word: 'the Corps\' carrier', cover: Object.freeze({ plate: 0.55, soft: 0.30 }) }),
  softVest: Object.freeze({ word: 'a soft vest', cover: Object.freeze({ soft: 0.75 }) }),
  insurgent: Object.freeze({ word: 'a steel plate, front only', cover: Object.freeze({ insurgentPlate: 0.3 }) }),
});
/** The helmet's dome (WEAPONS §8.3: 0.6 of head hits; the face bare). */
export const HELMET_COVER = 0.6;
/** Tradecraft's centring (AIM_K, AIM_MARGIN) and blunt seconds (KNOCK_S); wear's cap. */
export const AIM_K = 0.2, AIM_MARGIN = 10, KNOCK_S = Object.freeze([1, 3]), WEAR_MAX = 0.5;
/** WEAPONS §8.6's hole factors: a rigid layer's (ball and AP, PDW rounds, a slug), a fabric's entry and exit. */
export const HOLE_K = Object.freeze({ rigid: 1.5, pdw: 1.3, slug: 1.6, jet: 2, entry: 1.0, exit: 1.5 });

// ---- the contest (WEAPONS §8.2) ----

/** A round's penetration at a speed (mm RHAe): pen0 × (v / v0)^penExp, v0 the load's reference muzzle velocity. */
export function penOf(cal, load, vMs) {
  const L = loadOf(cal, load);
  if (!L?.vRefMs || !L.pen0Mm) return 0;
  return L.pen0Mm * Math.pow(Math.max(0, vMs) / L.vRefMs, L.penExp ?? 2);
}
/** The speed a load has at a penetration (penOf's inverse). */
export function vOfPen(cal, load, penMm) {
  const L = loadOf(cal, load);
  if (!L?.vRefMs || !L.pen0Mm || penMm <= 0) return 0;
  return L.vRefMs * Math.pow(penMm / L.pen0Mm, 1 / (L.penExp ?? 2));
}
/** The chance a layer of P_eff stops a round of pen (see the header). */
export function pStop(penMm, pEff) {
  if (pEff <= 0) return 0;
  if (penMm < STOP_FLOOR_K * pEff) return 1;
  return 1 / (1 + Math.exp((penMm - pEff) / (STOP_WIDTH_K * pEff + STOP_WIDTH_MM)));
}
/** A round's speed after perforating a layer (WEAPONS §8.2): v × √(1 − P / pen). */
export const after = (vMs, penMm, pEff) => (penMm > 0 ? vMs * Math.sqrt(Math.max(0, 1 - pEff / penMm)) : 0);
/** A material's (or a wall's) P (mm RHAe) at a thickness. */
export const pOfMaterial = (material, mm) => (MATERIALS[material]?.pPerMm ?? 0) * mm;

/**
 * A round of pen against a wall or a material (r the dice): { stopped, penLeftMm, fragments, pEff, p } (WEAPONS §8.2, §8.5):
 * the berm and the ground stop all; a frangible round on a hard material at half its pen and fragments through it.
 */
export function throughMaterial(r, { penMm, material, mm, frangible = false, wear = 0 }) {
  const M = MATERIALS[material];
  if (!M) return { stopped: false, penLeftMm: penMm, fragments: false, pEff: 0, p: 0 };
  if (M.stopsAll) return { stopped: true, penLeftMm: 0, fragments: false, pEff: Infinity, p: 1 };
  const pEff = pOfMaterial(material, mm) * (1 - wear), pen = frangible && M.hard ? penMm * FRANGIBLE_HARD_K : penMm, p = pStop(pen, pEff);
  if (chance(r, p)) return { stopped: true, penLeftMm: 0, fragments: false, pEff, p };
  const left = Math.max(0, pen - pEff);
  return frangible && M.hard ? { stopped: false, penLeftMm: left * FRAG_PEN_K, fragments: true, pEff, p } : { stopped: false, penLeftMm: left, fragments: false, pEff, p };
}

// ---- armour (WEAPONS §8.3; tradecraft's armour.js) ----

/** How much a hit made by margin m is pulled to the middle of the torso (tradecraft's centreOf): 0 … 1. */
export const centreOf = (m = 0) => Math.max(0, Math.min(1, (m ?? 0) / AIM_MARGIN));
// (a person's armour cover: { cover } given, a kind's, or what they wear (kit.worn.armour's model), else none)
const coverOf = (person) => person?.armour?.cover ?? ARMOUR[person?.armour?.kind ?? person?.armour]?.cover ?? null;
/**
 * Where a torso hit lands on what a person wears (tradecraft's layerHit to the die: see the header): a layer of
 * the cover ('plate', 'soft', …) or 'bare'. person: { armour: kind | { kind } | { cover } } or none; r the dice.
 */
export function layerHit(person, r, centre = 0) {
  const C = coverOf(person);
  if (!C) return 'bare';
  const u = (r ? range(r, 0, 1) : 0.5) * (1 - AIM_K * centre);
  let acc = 0;
  for (const k of ['plate', 'insurgentPlate', 'soft']) { if (C[k] === undefined) continue; acc += C[k]; if (u < acc) return k; }
  return 'bare';
}
/** Whether a head hit lands on the helmet's dome (WEAPONS §8.3): 'helmet' or 'face'; none worn, 'bare'. */
export const helmetHit = (person, r) => (!person?.helmet ? 'bare' : chance(r, HELMET_COVER) ? 'helmet' : 'face');
/** Behind a stop (tradecraft's bullet()'s stopped branch, to the die): { bluntPts, crack, knockS, down } for BODY. */
export function bluntOf(layer, bulletPts, w, r) {
  const B = LAYERS[layer]?.blunt;
  if (!B) return { bluntPts: 0, crack: false, knockS: 0, down: false };
  const ww = Math.max(0.2, w);
  return { bluntPts: Math.round(bulletPts * B.k * 10) / 10, crack: chance(r, Math.min(0.5, B.crack * ww * ww)), knockS: Math.round(range(r, KNOCK_S[0], KNOCK_S[1]) * ww * 10) / 10, down: chance(r, Math.min(0.6, B.knock * ww)) };
}
/** A round against an armour layer: { layer, stopped, p, penLeftMm, wear } (the layer's P worn by its stops so far). */
export function throughLayer(r, { penMm, layer, wear = 0, frangible = false }) {
  const L = LAYERS[layer];
  if (!L) return { layer, stopped: false, p: 0, penLeftMm: penMm, wear };
  const pEff = L.P * (1 - Math.min(WEAR_MAX, wear)), pen = frangible ? penMm * FRANGIBLE_HARD_K : penMm, p = pStop(pen, pEff), stopped = chance(r, p);
  return { layer, stopped, p, penLeftMm: stopped ? 0 : Math.max(0, pen - pEff), wear: stopped ? Math.min(WEAR_MAX, wear + L.wear) : wear };
}

// ---- the body (WEAPONS §8.4, §8.7) ----

/** A part's tissue resistance (mm RHAe): legs and arms a limb's. */
export const tissueOf = (part) => (part === 'torso' ? TISSUE_P.torso : part === 'head' ? TISSUE_P.head : TISSUE_P.limb);
/** Whether a round of pen exits a part (r the dice): { through, penLeftMm }. */
export function throughTissue(r, { penMm, part, frangible = false }) {
  const P = tissueOf(part) * (frangible ? FRANGIBLE_TISSUE_K : 1), through = penMm > P * range(r, EXIT_U[0], EXIT_U[1]);
  return { through, penLeftMm: through ? Math.max(0, penMm - P) : 0 };
}

/**
 * WEAPONS §8.7's hit record (the 'hit' fact; BODY's applyHit's intake): { kind: 'gunshot', onId, part, fromId, rangeM,
 * load: 'cal/load', energyJ, diaMm, w, penLeftMm, through, exitPart, margin, shotId, nd, armour }.
 */
export function hitOf({ onId, part, fromId = null, rangeM = 0, cal = '6.5x40r', load = 'ball', vMs = 0, margin = 0, shotId = null, through = false, exitPart = null, armour = null, penLeftMm = 0, nd = false, woundK = null }) {
  const C = CALIBRES[cal], L = loadOf(cal, load) ?? {}, eJ = 0.5 * ((L.massG ?? 0) / 1000) * vMs * vMs;
  const w = woundFactor({ eJ, diaMm: C?.diaMm ?? 6.7, woundK: woundK ?? L.woundK ?? 1 });
  return { kind: 'gunshot', onId, part, fromId, rangeM: Math.round(rangeM * 10) / 10, load: `${cal}/${load}`, energyJ: Math.round(eJ), diaMm: C?.diaMm ?? 6.7, w: Math.round(w * 100) / 100,
    penLeftMm: Math.round(penLeftMm * 100) / 100, through: !!through, exitPart: through ? exitPart ?? part : null, margin, shotId, nd: !!nd, armour };
}

/**
 * The holes a projectile makes in a layer (WEAPONS §8.6), for every reader: [{ areaMm2, kind: 'entry' | 'exit' |
 * 'through' }]. load: 'cal/load' or { cal, load }; layer: { kind: 'rigid' | 'fabric', exits } (a fabric layer on a
 * body: an entry, and an exit if the round leaves the body).
 */
export function holeArea(load, layer = { kind: 'rigid' }) {
  const [cal, l] = typeof load === 'string' ? load.split('/') : [load.cal, load.load ?? 'ball'];
  const C = CALIBRES[cal], L = loadOf(cal, l) ?? {}, dia = C?.diaMm ?? 6.7;
  const area = (k) => Math.round(Math.PI * Math.pow(dia * k / 2, 2) * 10) / 10;
  if (layer.kind === 'fabric') return [{ areaMm2: area(HOLE_K.entry), kind: 'entry' }, ...(layer.exits ? [{ areaMm2: area(HOLE_K.exit), kind: 'exit' }] : [])];
  const k = L.slug ? HOLE_K.slug : dia < 5.5 ? HOLE_K.pdw : HOLE_K.rigid;
  return [{ areaMm2: area(k), kind: 'through' }];
}

// ---- the line through the live area (WEAPONS §7.7) ----

// (the area's people as the line meets them: the player and the actors, by who)
function bodiesOf(state) {
  const out = [], seen = new Set(), me = playerActor(state);
  for (const a of [me, ...(state.actors?.list ?? [])]) {
    if (!a?.who || seen.has(a.who)) continue;
    seen.add(a.who); out.push(a);
  }
  return out;
}
const headingOf = (a) => a.headRad ?? ({ right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[a.face] ?? 0);
// (the slab's entry and exit along a horizontal ray for an x/z rect [x0, z0, x1, z1]: [sIn, sOut] or null)
function slab(fx, fz, cx, cz, [x0, z0, x1, z1]) {
  let lo = -Infinity, hi = Infinity;
  for (const [o, d, a, b] of [[fx, cx, x0, x1], [fz, cz, z0, z1]]) {
    if (Math.abs(d) < 1e-12) { if (o < a || o > b) return null; continue; }
    let t0 = (a - o) / d, t1 = (b - o) / d;
    if (t0 > t1) [t0, t1] = [t1, t0];
    lo = Math.max(lo, t0); hi = Math.min(hi, t1);
  }
  return hi >= Math.max(0, lo) ? [Math.max(0, lo), hi] : null;
}

/**
 * The line a round flies through the live area (see the header): { path: [{ x, y, z }], stoppedBy: { kind: 'berm' |
 * 'ground' | 'parapet' | 'body' | 'past', at: { x, y, z }, id? }, hits: [HitRecord], faces: [{ lane, paper, at: [xCm,
 * yCm] }], nearMisses: [{ who, passM, crack }] }. from: the muzzle { x, y, z }; yawRad and pitchRad its line.
 */
export function traceRound(state, { shooterId = null, from, yawRad = 0, pitchRad = 0, cal = '6.5x40r', load = 'ball', barrelMm = 460, env = null, maxM = 2000, rngKey = '', margin = 0, nd = false, shotId = null } = {}) {
  const E = env ?? envOfPlace(state), air = airOf(E), g = E.gMs2, T = boreTable(cal, load, barrelMm), L = loadOf(cal, load) ?? {};
  if (!Number.isFinite(g)) throw new Error(`traceRound(): the place's gravity (env.gMs2, envOfPlace), not ${g}`);   // (TECH §1.4: never a quiet 0 G)
  const r = stream('pen', state.meta?.seed ?? 0, rngKey), cx = Math.cos(yawRad), cz = Math.sin(yawRad), tp = Math.tan(pitchRad);
  const maxS = Math.min(maxM, T.maxM);
  const yAt = (s) => from.y + s * tp - g * T.at(air.rhoKgM3, air.soundMs, 1, s).dS2;
  const vT = (s) => T.at(air.rhoKgM3, air.soundMs, 1, s).vMs;
  const pt = (s) => ({ x: Math.round((from.x + cx * s) * 100) / 100, y: Math.round(yAt(s) * 100) / 100, z: Math.round((from.z + cz * s) * 100) / 100 });
  const K = KD_RANGE, kd = K.kd ?? null, area = state.places?.live?.area ?? null, onRange = !area || area === K.area;
  // (the ground under a point: the pits' floor between their walls, else 0)
  const floorAt = (x, z) => (kd && x > kd.pits.x0 && x < kd.pits.x1 && z > kd.walk[1] && z < kd.walk[3] ? kd.pits.floorY : 0);
  // (the solids that stop it: [rect, topY, kind]; the berms and the parapet on the range)
  const solids = [];
  if (onRange) {
    if (kd) { solids.push([[...kd.berm.rect], kd.berm.heightM, 'berm']); solids.push([[kd.pits.parapet.x0, kd.walk[1], kd.pits.parapet.x1, kd.walk[3]], kd.pits.parapet.topY, 'parapet']); }
    if (K.bay?.berm) solids.push([[...K.bay.berm], 3.0, 'berm']);
  }
  // (the end: the first solid whose height the line is under inside its footprint, the ground, or maxS)
  let endS = maxS, endKind = 'past', endId = null;
  for (const [rect, top, kind] of solids) {
    const sl = slab(from.x, from.z, cx, cz, rect);
    if (!sl || sl[0] >= endS) continue;
    let hitS = null;
    if (yAt(sl[0]) < top) hitS = sl[0];
    else if (yAt(Math.min(sl[1], endS)) < top) { let a = sl[0], b = Math.min(sl[1], endS); while (b - a > FINE_M) { const m = (a + b) / 2; if (yAt(m) < top) b = m; else a = m; } hitS = b; }
    if (hitS !== null && hitS < endS) { endS = hitS; endKind = kind; }
  }
  // (the ground: marched, then bisected)
  { let prev = 0;
    for (let s = Math.min(MARCH_M, endS); ; s = Math.min(s + MARCH_M, endS)) {
      const y = yAt(s), fl = floorAt(from.x + cx * s, from.z + cz * s);
      if (y <= fl) { let a = prev, b = s; while (b - a > FINE_M) { const m = (a + b) / 2; if (yAt(m) <= floorAt(from.x + cx * m, from.z + cz * m)) b = m; else a = m; } endS = b; endKind = 'ground'; break; }
      prev = s;
      if (s >= endS) break;
    } }
  // (the events before the end: faces (paper), bodies; in order of s)
  const events = [];
  if (onRange && kd) for (const Ln of kd.lanes) {
    const f = Ln.face; if (Math.abs(cx) < 1e-9) continue;
    const s = (f.x - from.x) / cx; if (s <= 0 || s >= endS) continue;
    const up = faceUpAt(state.armoury?.range, Ln.lane, state.clock.ms), cy = f.downY + (f.upY - f.downY) * up;
    const y = yAt(s), z = from.z + cz * s, half = FACE_HALF_M;
    if (Math.abs(z - f.z) <= half && Math.abs(y - cy) <= half) events.push({ s, kind: 'face', lane: Ln.lane, paper: f.paper ?? 'kdA', at: [Math.round((z - f.z) * 1000) / 10, Math.round((cy - y) * 1000) / 10] });
  }
  if (onRange && K.bay?.lanes) for (const Ln of K.bay.lanes) {
    const t = Ln.target; if (!t || Math.abs(cx) < 1e-9) continue;
    const s = (t.x - from.x) / cx; if (s <= 0 || s >= endS) continue;
    const y = yAt(s), z = from.z + cz * s;
    if (Math.abs(z - t.z) <= CARD_HALF_M && Math.abs(y - (t.centreY ?? 0.6)) <= CARD_HALF_M) events.push({ s, kind: 'face', lane: Ln.lane, paper: 'card25', at: [Math.round((z - t.z) * 1000) / 10, Math.round(((t.centreY ?? 0.6) - y) * 1000) / 10] });
  }
  const near = [];
  // (a body's span from the ground it stands on, a.y: the pits' pullers stand 2.5 m down, under the parapet's shield)
  for (const a of bodiesOf(state)) {
    if (a.who === shooterId) continue;
    const stance = a.stance ?? 'stand';
    if (stance === 'prone' || stance === 'down') {
      // (lying along its heading, the head PRONE_AHEAD_M ahead of its point: the line's least distance to that segment)
      const h = headingOf(a), hx = a.x + Math.cos(h) * PRONE_AHEAD_M, hz = a.z + Math.sin(h) * PRONE_AHEAD_M, fx2 = hx - Math.cos(h) * PRONE_LEN_M, fz2 = hz - Math.sin(h) * PRONE_LEN_M;
      const crossAt = (px, pz) => (px - from.x) * cz - (pz - from.z) * cx, a0 = crossAt(hx, hz), a1 = crossAt(fx2, fz2);
      let u = Math.abs(a0) <= Math.abs(a1) ? 0 : 1;
      if (a0 * a1 < 0) u = a0 / (a0 - a1);
      const px = hx + u * (fx2 - hx), pz = hz + u * (fz2 - hz), d = Math.abs(crossAt(px, pz)), s = (px - from.x) * cx + (pz - from.z) * cz;
      if (s <= 0 || s >= endS) continue;
      const y = yAt(s) - (a.y ?? 0), span = SPAN_M.prone, vOff = y > span[1] ? y - span[1] : y < span[0] ? span[0] - y : 0;
      if (d <= STRAY_M && !vOff) events.push({ s, kind: 'body', who: a.who, d, part: u < PRONE_HEAD_TO ? 'head' : u < PRONE_TORSO_TO ? 'torso' : 'legs' });
      else if (Math.hypot(d, vOff) <= CRACK_M) near.push({ s, who: a.who, passM: Math.hypot(d, vOff) });
      continue;
    }
    const s = (a.x - from.x) * cx + (a.z - from.z) * cz;
    if (s <= 0 || s >= endS) continue;
    const d = Math.abs((a.x - from.x) * cz - (a.z - from.z) * cx), y = yAt(s) - (a.y ?? 0), span = SPAN_M[stance] ?? SPAN_M.stand;
    const vOff = y > span[1] ? y - span[1] : y < span[0] ? span[0] - y : 0;
    if (d <= STRAY_M && !vOff) { const k = (y - span[0]) / (span[1] - span[0]); events.push({ s, kind: 'body', who: a.who, d, part: k < LEGS_TO ? 'legs' : k < TORSO_TO ? 'torso' : 'head' }); }
    else if (Math.hypot(d, vOff) <= CRACK_M) near.push({ s, who: a.who, passM: Math.hypot(d, vOff) });
  }
  events.sort((a, b) => a.s - b.s);
  // (the round along the events: paper holed, bodies hit or missed, its pen spent in tissue)
  const hits = [], faces = [], path = [pt(0)], nearMisses = [], frangible = !!L.frangible;
  let kv = 1, stopped = null;
  for (const e of events) {
    if (e.s >= endS) break;
    const v = kv * vT(e.s);
    if (e.kind === 'face') { faces.push({ lane: e.lane, paper: e.paper, at: e.at, rangeM: Math.round(e.s * 10) / 10 }); continue; }
    if (e.d > BODY_R_M && !chance(r, STRAY_HIT)) { nearMisses.push({ who: e.who, passM: Math.round(e.d * 100) / 100, crack: air.soundMs > 0 && v > air.soundMs }); continue; }
    const pen = penOf(cal, load, v), person = state.people?.[e.who] ?? null;
    let armour = null, penIn = pen;
    if (e.part === 'torso') {
      const layer = layerHit(person, r, centreOf(margin));
      if (layer !== 'bare') {
        const t = throughLayer(r, { penMm: pen, layer, frangible });
        armour = { layer, stopped: t.stopped, p: Math.round(t.p * 1000) / 1000 };
        if (t.stopped) { hits.push(hitOf({ onId: e.who, part: e.part, fromId: shooterId, rangeM: e.s, cal, load, vMs: v, margin, shotId, armour, nd })); stopped = { s: e.s, kind: 'body', id: e.who }; break; }
        penIn = t.penLeftMm;
      }
    }
    const tt = throughTissue(r, { penMm: penIn, part: e.part, frangible });
    hits.push(hitOf({ onId: e.who, part: e.part, fromId: shooterId, rangeM: e.s, cal, load, vMs: v, margin, shotId, through: tt.through, exitPart: e.part, armour, penLeftMm: tt.penLeftMm, nd }));
    path.push(pt(e.s));
    if (!tt.through || tt.penLeftMm <= 0) { stopped = { s: e.s, kind: 'body', id: e.who }; break; }
    kv = vOfPen(cal, load, tt.penLeftMm) / Math.max(1, vT(e.s));
  }
  const endAt = stopped ? stopped.s : endS;
  for (const n of near) if (n.s < endAt) { const v = kv * vT(n.s); nearMisses.push({ who: n.who, passM: Math.round(n.passM * 100) / 100, crack: air.soundMs > 0 && v > air.soundMs }); }
  const end = pt(endAt);
  path.push(end);
  return { path, stoppedBy: stopped ? { kind: 'body', at: end, id: stopped.id } : { kind: endKind, at: end, ...(endId ? { id: endId } : {}) }, hits, faces, nearMisses, rangeM: Math.round(endAt * 10) / 10 };
}
