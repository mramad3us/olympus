// OLYMPUS sim: the instructor's read of a practice grenade, what the live grenade it stands for would have done (WEAPONS §12.3, §12.4; COMBAT §11.3, §25.20; the build sheet 0.0.19 §3.1).
//
// A G-9P or G-13P bursts as a 4 g spotting charge: a pop and a puff. The instructor scores it as the live G-9 or G-13 it stands
// for (DEVICES[model].as), and readBurst(state, { burst, model, x, z, atMs, room, byId }) is his read, once a burst, from the
// place alone: it never writes a body (a practice grenade wounds nobody; its live twin would hand the same hits to BODY later,
// one model for both). burst.js stores it on the burst's record (R.house.bursts[i].read); house-kit.js readsTick applies it.
//
// **Who is read:** you and your #2 (the stack: { me, two }) and every stand of the house within READ_M 15 m, up at the burst.
// **Fragments** (the G-9's only): WEAPONS §12.3's λ = K × exposure × (1 − keeps) / max(r, 0.5)² (blast.js fragLambda, K 160;
// exposure standing 1, kneeling 0.6, prone 0.25: blast.js FRAG_EXPOSURE), n drawn Poisson(λ) by blast.js fragHits on its one
// stream ('arms:frag', the burst's item id, the body's key: a person's id or a stand's key). `keeps` is fragLine's: every wall of
// the place (places/plan.js wallsOf, wallRect) stops every ball (WALL_STOPS: the house's ballistic panels, PLACES' 10 mm steel
// faced with 50 mm rubber, a rule of this module, never a penetrate.js material), a closed leaf (places/model.js leafClosed,
// places/plan.js leafRect) keeps a ball by penetrate.js pStop on LEAF_WALL (WALLS.cabin, honeycomb 25 mm, P 1.25; my call,
// keyed by the opening's kind, so no place's data moves) at the ball's penetration there, and an open opening keeps nothing.
// Straight lines only: every body is under the house's 2.8 m walls. The instructor on the catwalk leaves himself out ("on a
// live day I'm behind glass": my call). The ball: BALL's sphere (0.057 g, 4.5 mm², Cd 0.92 above the air's speed of sound and
// 0.47 below), from 1,350 m/s at the burst, slowed in the area's air (ballVMs: env.js airAt's density, so the Wheel's 66 kPa
// gives 880 m/s at 15 m, a UN hull's 101.3 kPa 701, Mars's thin air 1,345 and vacuum 1,350), its penetration 0.8 × (v/1350)²
// mm RHAe (ballPenMm).
// **Blast:** kPa = max(peakKPa(W, r, Pa) × blastLine's k (1 with a clear line, blast.js CORNER_SHADOW_K without), the room's
// closed pressure qspKPa(W, V) for a body in the burst's room), W the live twin's TNT; V the burst's room (burst.js burstRoom's
// volume: a G-13 in room 1 13.7 kPa, room 2 10.0, the closet 153).
// v0.0.22 (the build sheet v0.0.22 item 7, R1 a): blastLine(state, area, from, body, { y, line }) → { clear, k } is the one reader
// of fragLine's `wall` and `through` for a blast, read by this module's bodyRead and by burst.js burst for every live burst (the
// G-11's and the charges' people and stands), so a grenade or a charge has one blast model, the practice read's: a body with no
// line of sight to the burst (a wall or a closed leaf between: the stack on the wall beside the door, as drilled) takes
// CORNER_SHADOW_K of the free field's peak; a body at or above the walls' height (places/plan.js WALL_H_M 2.8 m: the instructor on
// the catwalk at y 3.0) is clear over them. Before it burst.js gave every person the free field's peak whatever stood between: the
// boot recruit's G-11, short at room 1's foot on seed 1489397426, put 29.8 kPa on him round the jamb (14.9 with the line).
// **Outcomes, per body:** 'down' at n ≥ FRAG_DOWN_N 3, or kPa ≥ BLAST_LUNG_KPA 200 with COMBAT §11.3's 30% (its stream);
// 'wounded' at n ≥ 1; 'injured' (the eardrums) at kPa ≥ EARDRUM_KPA 34.5 (5 psi, to check; EARDRUM50_KPA 103 the half
// rupture's 15 psi); 'stunned' at kPa ≥ blast.js STUN_KPA 20, U(2,000, 6,000) ms on stream 'house:stun' (stunMs). `out` is the
// worst of them.
// **The faults it raises** (house-kit.js applies them): `fragged`, a G-9's read with a no-shoot or the hostage card in the
// burst's room, by its truth (the doctrine's rule, whatever the balls did); `concussed`, a no-shoot or the hostage injured by a
// G-13's; `burst`, a man of the stack with n ≥ 1 (D1's `blast` is kPa ≥ 27.6 on the stack, for any device: one quantity, one
// fault), and at n ≥ FRAG_DOWN_N or kPa ≥ EARDRUM50_KPA the cease fire (the lane's end, its card).
// **The throw's exposure** (throwExposure): over the throw (the arm from the stack to the release), each threat stand facing at
// SEEN or more with a clear line (people/perception.js clearLine, the stand layer) to the thrower's head at the release point,
// the ms summed; past the house's par it is the fault `exposed`, else a neutral mark. **The cook note:** a G-9 or G-13 on the
// floor longer than FRAG_SIT_MS 2,500 ms before it went: uncookedMs, "UNCOOKED 3.8 S" (house-kit.js, from the Sergeant up);
// satMs is its time on the floor whatever it was (the gauges' F33).
// readMarks(read) is the read's lines for the run sheet, each { text, fault }.
// Pure.
import { stream, next, range, chance } from '../../core/rng.js';
import { playerActor, playerId } from '../../core/ids.js';
import { q } from '../../core/num.js';
import { DEVICES } from '../arms/devices.js';
import { peakKPa, qspKPa, fragLambda, fragHits, FRAG_EXPOSURE, STUN_KPA, CORNER_SHADOW_K, BREACH_SAFE_KPA } from '../arms/blast.js';
import { pStop, pOfMaterial, WALLS } from '../arms/penetrate.js';
import { airAt } from '../places/env.js';
import { areaOf, openingOf, leafClosed } from '../places/model.js';
import { planOf as placePlanOf, wallsOf, wallRect, leafRect, WALL_H_M } from '../places/plan.js';
import { facingOf } from '../arms/turners.js';
import { clearLine, SEEN } from '../people/perception.js';
import { sightGridOf } from '../places/sight.js';
import { sessionOf } from './op.js';

/** Fragments: down at this many (my call), a body clean under this λ (my call). */
export const FRAG_DOWN_N = 3, FRAG_SAFE_LAMBDA = 0.05;
/** Blast on a body (kPa; 5 psi, 15 psi and the lung's threshold, to check: COMBAT §11.3). */
export const EARDRUM_KPA = 34.5, EARDRUM50_KPA = 103, BLAST_LUNG_KPA = 200;
/** Blast lung's share at BLAST_LUNG_KPA or more (COMBAT §11.3's 30%). */
export const BLAST_LUNG_P = 0.3;
/** A grenade longer than this on the floor before it went was thrown uncooked (ms; FM 3-23.30's 2 s cook), and the read's reach (m). */
export const FRAG_SIT_MS = 2500, READ_M = 15;
/** The stun's length at STUN_KPA or more (COMBAT §11.3), ms. */
export const STUN_MS = Object.freeze([2000, 6000]);
/** A closed leaf as a wall (penetrate.js WALLS, by the opening's kind: my call). */
export const LEAF_WALL = Object.freeze({ door: 'cabin', interior: 'cabin' });
/** The house's walls stop every ball (its ballistic panels: a rule of the read, never a penetrate.js material). */
export const WALL_STOPS = true;
/** The fragment's ball (WEAPONS §12.3): mass kg, frontal area m², drag above and below the air's speed of sound, its speed at the burst m/s. */
export const BALL = Object.freeze({ mKg: 5.7e-5, aM2: 4.5e-6, cdSuper: 0.92, cdSub: 0.47, v0Ms: 1350 });
/** The ball's penetration at its v0 (mm RHAe; WEAPONS §12.3's). */
export const BALL_PEN0_MM = 0.8;
/** A body's head for the throw's exposure, and its height for the read's lines (m). */
export const HEAD_Y_M = 1.6;
/** The read's constants together (the build sheet 0.0.19 §3.1). */
export const PRACTICE_CONST = Object.freeze({ FRAG_DOWN_N, FRAG_SAFE_LAMBDA, FRAG_SIT_MS, READ_M, EARDRUM_KPA, EARDRUM50_KPA, BLAST_LUNG_KPA, BLAST_LUNG_P, LEAF_WALL, WALL_STOPS, BALL, BALL_PEN0_MM });

const r1 = (x) => q(Math.min(x, 10_000), 0.1), r3 = (x) => q(x, 0.001);

/** A fragment's speed (m/s) at rM in an air (env.js airAt's): a sphere's drag, supersonic down to the air's sound speed, then subsonic. */
export function ballVMs(rM, air) {
  const rho = air?.vacuum ? 0 : air?.rhoKgM3 ?? 0, c = air?.soundMs ?? 343;
  if (!(rho > 0)) return BALL.v0Ms;
  const k = (cd) => rho * cd * BALL.aM2 / (2 * BALL.mKg);
  const v1 = BALL.v0Ms * Math.exp(-k(BALL.cdSuper) * rM);
  if (v1 >= c) return v1;
  // (the stretch past the sound barrier at the subsonic drag)
  const rC = Math.log(BALL.v0Ms / c) / k(BALL.cdSuper);
  return c * Math.exp(-k(BALL.cdSub) * (rM - rC));
}
/** A fragment's penetration (mm RHAe) at its speed: BALL_PEN0_MM × (v / v0)². */
export const ballPenMm = (vMs) => BALL_PEN0_MM * (vMs / BALL.v0Ms) ** 2;

// (whether the segment from p to q meets a rectangle { x0, x1, z0, z1 }: Liang–Barsky, the first 2 cm left out so a burst lying
// against a wall's face is read from its own side)
function meets(p, q2, R) {
  const dx = q2[0] - p[0], dz = q2[1] - p[1], L = Math.hypot(dx, dz) || 1;
  let t0 = 0.02 / L, t1 = 1;
  for (const [pp, qq] of [[-dx, p[0] - R.x0], [dx, R.x1 - p[0]], [-dz, p[1] - R.z0], [dz, R.z1 - p[1]]]) {
    if (pp === 0) { if (qq < 0) return false; continue; }
    const t = qq / pp;
    if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 <= t1;
}
/**
 * What keeps a ball from a body (see the header): { keeps (0 to 1), wall (a wall in the way), through: [opening ids of the closed
 * leaves crossed] }; vMs the ball's speed there (its penetration through a leaf).
 */
export function fragLine(state, area, from, to, { vMs = BALL.v0Ms } = {}) {
  const A = areaOf(area);
  if (!A) return { keeps: 0, wall: false, through: [] };
  const P = placePlanOf(A);
  if (WALL_STOPS) for (const w of wallsOf(P)) if (meets(from, to, wallRect(w))) return { keeps: 1, wall: true, through: [] };
  let pass = 1;
  const through = [];
  for (const o of P.openings) {
    if (o.kind !== 'door' || !leafClosed(state, o.id) || !meets(from, to, leafRect(o))) continue;
    const W = WALLS[LEAF_WALL[o.type] ?? 'cabin'];
    pass *= 1 - pStop(ballPenMm(vMs), pOfMaterial(W.material, W.mm));
    through.push(o.id);
  }
  return { keeps: q(1 - pass, 1e-4), wall: false, through };
}
/**
 * The blast's line from a burst to a body (see the header): { clear, k }, k 1 with a line of sight and CORNER_SHADOW_K without
 * (a wall, or a closed leaf, between); y the body's height over the floor (at or above WALL_H_M: clear over the walls); line a
 * fragLine already read for the same two points (bodyRead's, so the practice read reads the walls once). Pure.
 */
export function blastLine(state, area, from, body, { y = 0, line = null } = {}) {
  if ((y ?? 0) >= WALL_H_M) return { clear: true, k: 1 };
  const L = line ?? fragLine(state, area, from, body), clear = !L.wall && !L.through.length;
  return { clear, k: clear ? 1 : CORNER_SHADOW_K };
}

// (a body's exposure to the balls by its stance)
const exposureOf = (stance) => FRAG_EXPOSURE[stance] ?? 1;
// (the body's worst of the outcomes)
const outOf = ({ n, kPa, lung }) => (n >= FRAG_DOWN_N || lung ? 'down' : n >= 1 ? 'wounded' : kPa >= EARDRUM_KPA ? 'injured' : kPa >= STUN_KPA ? 'stunned' : null);

/**
 * The instructor's read of a practice burst (see the header): the Read, plain data. burst: the grenade's item id; room: burst.js
 * burstRoom's record ({ id, in, next, volM3 }) or null; byId: the thrower.
 */
export function readBurst(state, { burst, model, x, z, atMs = state.clock.ms, room = null, byId = null }) {
  const D = DEVICES[model], as = D?.as ?? model, L = DEVICES[as] ?? D, W = L?.tntKg ?? 0, K = L?.frag?.K ?? 0;
  const seed = state.meta?.seed ?? 0, area = state.places?.live?.area, air = airAt(state, area, x, z), Pa = air?.vacuum ? 0 : air?.pKpa ?? 0;
  const kPaRoom = room && Pa > 0 ? r1(qspKPa(W, room.volM3)) : 0, from = [x, z], inRoom = (rid) => !!room && room.in.includes(rid);
  const A = areaOf(area), roomAtXZ = (px, pz) => A?.rooms?.find(r => px >= r.rect[0] && px <= r.rect[2] && pz >= r.rect[1] && pz <= r.rect[3])?.id ?? null;
  // (one body read: its distance, the line to it, its balls and its blast)
  const bodyRead = (key, bx, bz, stance, rid) => {
    const rM = Math.hypot(bx - x, bz - z), v = ballVMs(rM, air), line = fragLine(state, area, from, [bx, bz], { vMs: v });
    const lam = K ? fragLambda(K, rM, exposureOf(stance), line.keeps) : 0, n = lam > 0 ? fragHits(seed, burst, key, lam) : 0;
    const { clear, k } = blastLine(state, area, from, [bx, bz], { line }), peak = peakKPa(W, rM, Pa) * k;
    const kPa = Math.max(Number.isFinite(peak) ? peak : 10_000, inRoom(rid) ? kPaRoom : 0);
    const lung = kPa >= BLAST_LUNG_KPA && chance(stream(seed, 'house:lung', burst, key), BLAST_LUNG_P);
    return { rM: r3(rM), lam: q(lam, 1e-4), n, kPa: r1(kPa), out: outOf({ n, kPa, lung }), clear };
  };
  const stands = {}, R = sessionOf(state), noncombatants = [], concussed = [];
  for (const T of R?.turners ?? []) {
    if (T.stoppedAtMs !== null && T.stoppedAtMs !== undefined && T.stoppedAtMs <= atMs) continue;
    if (Math.hypot(T.x - x, T.z - z) > READ_M) continue;
    // (a role-player is read as a stand is, by his own stance (his record keeps his actor's place): before the review of v0.0.19 he was
    // left out, so a frag at his feet neither ruled him out nor stunned him, and house-kit.js's ruling never ran)
    const man = T.live ? state.actors?.list?.find(a => a.who === T.live.who) : null;
    const stance = man ? (man.stance ?? (man.posture === 'sit' || man.posture === 'kneel' ? 'kneel' : 'stand')) : 'stand';
    const b = bodyRead(T.key, T.x, T.z, stance, T.room);
    const stunMs = b.kPa >= STUN_KPA ? Math.round(range(stream(seed, 'house:stun', burst, T.key), STUN_MS[0], STUN_MS[1])) : 0;
    stands[T.key] = { stand: T.stand, face: T.face, rM: b.rM, lam: b.lam, n: b.n, kPa: b.kPa, out: b.out, stunMs };
    if (inRoom(T.room) && (T.face === 'noshoot' || T.face === 'hostage')) {
      noncombatants.push(T.stand);
      if (as === 'g13' && b.kPa >= EARDRUM_KPA) concussed.push(T.stand);
    }
  }
  // (the stack: you and your #2, by their own stance)
  const H = R?.house ?? null, me = playerActor(state), twoA = H?.twoPid ? state.actors?.list?.find(a => a.who === H.twoPid) : null;
  const stackOne = (a, key) => { if (!a) return null; const b = bodyRead(key, a.x, a.z, a.stance ?? 'stand', roomAtXZ(a.x, a.z)); return { rM: b.rM, lam: b.lam, n: b.n, kPa: b.kPa }; };
  const stack = { me: stackOne(me, playerId(state)), two: stackOne(twoA, H?.twoPid) };
  // (the throw: its exposure over the arm and the release, and how long it sat on the floor)
  const F = state.items?.[burst]?.flight ?? null;
  const exposed = F && byId ? throwExposure(state, byId, { fromMs: (F.fromMs ?? atMs) - THROW_ARM_MS, toMs: F.fromMs ?? atMs, at: headOf(F), door: F.door ?? null }) : null;
  const sat = F && Number.isFinite(F.landMs) ? atMs - F.landMs : null;
  return { model, as, x: r3(x), z: r3(z), atMs, room: room?.id ?? null, kPaRoom, stands, stack, noncombatants, fragged: as === 'g9' && noncombatants.length > 0, concussed,
    exposed, uncookedMs: sat !== null && sat > FRAG_SIT_MS ? sat : null, ...(sat !== null ? { satMs: sat } : {}) };
}
// (the thrower's head at the throw: where he stood (the flight's `head`), HEAD_LEAN_M toward the hand round the jamb; the hand's
// own place where no stand was noted)
function headOf(F) {
  if (!F.head) return [F.x0, F.z0];
  const dx = F.x0 - F.head[0], dz = F.z0 - F.head[1], L = Math.hypot(dx, dz) || 1, k = Math.min(HEAD_LEAN_M, L);
  return [F.head[0] + dx / L * k, F.head[1] + dz / L * k];
}
/** The head leans this far toward the opening for the throw (m; kit2 §2.4). */
export const HEAD_LEAN_M = 0.3;
/** The throw's arm before the release, the time the thrower shows himself in the door (ms; devices.js gren:throw's 0.7 s). */
export const THROW_ARM_MS = 700;

/**
 * The thrower's exposure in the door (see the header): { ms, by: [stand] } with some, else null. at: the release point [x, z]
 * (the hand round the jamb, the head behind it); a tick at a time from fromMs to toMs.
 */
export function throwExposure(state, pid, { fromMs, toMs, at = null, door = null } = {}) {
  const R = sessionOf(state), area = state.places?.live?.area;
  if (!R?.turners || !at || !area || !(toMs > fromMs)) return null;
  const grid = sightGridOf(state, area, at[0], at[1]), by = new Set();
  let ms = 0;
  for (let t = fromMs; t < toMs; t += 50) {
    let seen = false;
    for (const T of R.turners) {
      if (!['threat', 'armoured', 'hostage'].includes(T.face) || (T.stoppedAtMs !== null && T.stoppedAtMs !== undefined && T.stoppedAtMs <= t)) continue;
      if (facingOf(T, t) < SEEN || !clearLine(grid, T.x, T.z, at[0], at[1], 'stand')) continue;
      seen = true; by.add(T.stand);
    }
    if (seen) ms += 50;
  }
  return ms ? { ms, by: [...by].sort() } : null;
}

/** A read's marks for the run sheet (see the header): [{ text, fault }], the neutral lines and the faults' marks. */
export function readMarks(read, { parMs = Infinity, cookNote = true } = {}) {
  if (!read) return [];
  const out = [], up = (s) => String(s).toUpperCase(), word = read.as === 'g9' ? 'FRAG' : 'CONCUSSION', room = read.room ? up(read.room.replace(/^w\d+\./, '').replace(/^r(\d)$/, 'room $1')) : 'THE HALL';
  const st = Object.values(read.stands);
  const down = st.filter(s => s.out === 'down').map(s => `${up(s.stand)} DOWN`), hurt = st.filter(s => s.out === 'wounded').map(s => `${up(s.stand)} WOUNDED`);
  out.push({ text: `${word} IN ${room}${down.length || hurt.length ? `: ${[...down, ...hurt].join(', ')}` : ''}`, fault: null });
  for (const s of st) if (s.stunMs && s.out !== 'down') out.push({ text: `${up(s.stand)} STUNNED ${(s.stunMs / 1000).toFixed(1)} S`, fault: null });
  if (read.fragged) out.push({ text: st.some(s => s.face === 'hostage' && read.noncombatants.includes(s.stand)) ? 'FRAGGED THE HOSTAGE' : 'FRAGGED A NO-SHOOT ROOM', fault: 'fragged' });
  for (const s of read.concussed) out.push({ text: `NO-SHOOT IN THE BLAST ${Math.round(read.stands[Object.keys(read.stands).find(k => read.stands[k].stand === s)]?.kPa ?? 0)} KPA`, fault: 'concussed' });
  for (const [who, b] of Object.entries(read.stack ?? {})) if (b && b.n >= 1) out.push({ text: `IN THE BURST: ${who === 'me' ? 'YOU' : 'YOUR #2'}, ${b.n} FRAGMENT${b.n === 1 ? '' : 'S'}`, fault: 'burst' });
  if (read.exposed) out.push({ text: read.exposed.ms > parMs ? `EXPOSED IN THE THROW ${(read.exposed.ms / 1000).toFixed(1)} S` : `EXPOSED ${(read.exposed.ms / 1000).toFixed(1)} S`, fault: read.exposed.ms > parMs ? 'exposed' : null });
  if (cookNote && read.uncookedMs) out.push({ text: `UNCOOKED ${(read.uncookedMs / 1000).toFixed(1)} S`, fault: null });
  return out;
}
/** Whether a man of the stack is out of the burst by the read (F30): no ball, λ under FRAG_SAFE_LAMBDA, under BREACH_SAFE_KPA. */
export const stackClean = (b) => !b || (b.n === 0 && b.lam < FRAG_SAFE_LAMBDA && b.kPa < BREACH_SAFE_KPA);
