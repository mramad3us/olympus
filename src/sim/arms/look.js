// OLYMPUS arms: what the stage reads of the arms, the rifle on a figure, the kit, the range's paper and brass (VIEWS §3.4, §4.4; WEAPONS §2.8; the build sheet 0.0.5 §2.1). Pure.
//
// The stage draws what is there (the world's truth, at a game time ms = clock.ms + alpha × TICK_MS)
// and reads it only through here (TECH §2.2's SIM_FOR_VIEW), never the state's arms records direct:
//   gunLook(state, actor, ms)  the rifle on a figure: the model; carry, the art's rig ('front' slung on
//                    its two-point sling, 'slung' on the back, 'low', 'high', 'aim'); the stance; the
//                    aim's point and since when; the last shot's game time; the action under way (the
//                    shot role's stepNow through ACTION_FRAMES, a list walked by the sub-step's k); the
//                    flash within FLASH_MS of the shot and the kick within KICK_MS (as fractions, 1 at the
//                    shot), on game time, so stop motion freezes them; the muzzle's tip (carry.js
//                    muzzleOf: the flash's and the sound's point); the finger; the magazine in or out.
//   kitLook(state, pid)   the ear defenders, the carrier, each pouch's magazines.
//   rangeLook(state, ms)  the range session's: hot (the red flag), each lane's holes (the shot role's
//                    paper.js placed them, by hash, in their ring: stored on the session's shots), the
//                    brass in flight and at rest (caseAt, each with the stance it left), the magazines
//                    lying, the bracketed target and whether the shooter is aimed, and the last shot's
//                    blast within DUST_MS (fire: where the shooter lies or kneels, facing, the stance, its
//                    game time, and 0.0.6's load and lane, a tracer's ember drawn to its card) for the
//                    stage's flash star and the dust off the regolith.
// caseAt(rec, ms) is a case's flight at Mars' gravity (WEAPONS §2.8): launched from the port
// horizontally at EJECT_MS ± 0.3 m/s (by hash), EJECT_DEG ± 20° (by hash) to the right of the bore,
// from the port's height by the stance (PORT_H_M), falling at G_MS2 until it lands and rests where it
// lands in regolith: 0.87 s and 3.5 m from a standing port, 0.37 s and 1.5 m prone. ejectCase()
// makes the record (the shot role stores it, at most BRASS_LIVE in a session); a round or the dummy
// thrown by a hand on the charging handle leaves at HAND_EJECT_K of the speed. Nothing here writes.
//
// 0.0.7 (the build sheet 0.0.7 §2.4): on test-range's KD course gunLook draws a gunner of the relay as the player is
// drawn (its aim at its own face or card, its last shot's flash and kick, its sub-step's frame: gunner.js
// gunnerNow), and rangeLook gains kd: { line, faces (all twenty lanes: the face's place and paper, how far it is
// up (the pits' carrier: range.js pitView, continuous, never a pop), its marked holes, the spotter, the score disk
// since when, the red flag since when), flags (each wind flag's heading and lift: wind.js flagOf), fires (every
// shooter's shot within FIRE_LOOK_MS 1.2 s: where they lie, sit or kneel, facing, the stance, the load), brass
// (the cases flying, with their stance) and tiles (the cases at rest, counted on their 1 m tiles: brass.js),
// dust (a round into the berm behind its face within DUST_MS) }. A sitting port is PORT_H_M.sit high.
// AIM_LEAD_K, EDGE_KEEP_M and FRAME_HALF_M are VIEWS §2.4's weapon-mode lead, shared by the camera and
// the shot role's targetsOf: the frame's centre AIM_LEAD_K of the way from the player to the bracketed
// target, the player kept EDGE_KEEP_M inside the frame's half-size at 16 px/m.
import { hash01 } from '../../core/hash.js';
import { q } from '../../core/num.js';
import { ACTIONS, gunField } from './firearms.js';
import { muzzleOf, carryOf, faceRad } from './carry.js';
import { lyingOf, CONTAINERS } from './kit.js';
import { loadOf } from './calibres.js';
import { stepNow, targetsOf } from './shooting.js';
import { gunnerNow, gunnerTarget } from './gunner.js';
import { flagOf } from './wind.js';
import { tilesLook } from './brass.js';
import { pitView } from '../scenarios/range.js';
import { KD_RANGE } from '../../data/places/range.js';

/** Mars' surface gravity (m/s²: 0.38 g). */
export const G_MS2 = 3.727;
/** The ejection (WEAPONS §2.8, the build sheet's §4): speed, its spread, the angle off the bore to the right and its spread, a hand's throw. */
export const EJECT_MS = 4.0, EJECT_SPREAD_MS = 0.3, EJECT_DEG = 60, EJECT_SPREAD_DEG = 20, HAND_EJECT_K = 0.5;
/** The port's height by stance (m), and where it sits: ahead along the bore and to its right of the holder. */
export const PORT_H_M = Object.freeze({ stand: 1.4, kneel: 0.95, prone: 0.25, sit: 0.9 });
/** A shooter's shot is in rangeLook.kd.fires this long (ms of game time): the build sheet 0.0.7 §2.4. */
export const FIRE_LOOK_MS = 1200;
export const PORT_AHEAD_M = 0.30, PORT_RIGHT_M = 0.12;
/** The session keeps at most this many cases (WEAPONS §2.8). */
export const BRASS_LIVE = 64;
/**
 * The art's flash and kick, on game time (ms): the flash two ticks (the design review's: at 70 ms its strong
 * part fell in a tick never drawn, and at 16 px/m a 50 ms star could not be caught), the kick 140.
 */
export const FLASH_MS = 100, KICK_MS = 140;
/** A shot's blast dust off the regolith in front of a low muzzle (prone, kneeling): how long it hangs and settles (ms of game time). */
export const DUST_MS = 1200;
/** VIEWS §2.4's weapon-mode lead (the camera's and targetsOf's). */
export const AIM_LEAD_K = 0.55, EDGE_KEEP_M = 2.5, FRAME_HALF_M = Object.freeze([20, 11.25]);
/** The art's frame for each action (firearms.js ACTIONS' frames, and the shot's own steps). */
export const ACTION_FRAMES = Object.freeze({
  ...Object.fromEntries(Object.entries(ACTIONS).filter(([, a]) => a.frame).map(([k, a]) => [k, a.frame])),
  aim: 'aim', hold: 'aim', fire: 'fire',
});
/** The postures as the art's rigs. */
export const CARRY_RIGS = Object.freeze({ slungFront: 'front', slungBack: 'slung', lowReady: 'low', highReady: 'high', aimed: 'aim' });

const frameAt = (action, k) => {
  const f = ACTION_FRAMES[action] ?? (action?.startsWith('magOut:') ? 'magout' : null);
  if (!Array.isArray(f)) return f;
  return f[Math.min(f.length - 1, Math.max(0, Math.floor(k * f.length)))];
};
const fade = (dt, span) => (dt >= 0 && dt < span ? q(1 - dt / span, 0.001) : 0);
const session = (state) => state.armoury?.range ?? null;

// (a key's place: the target's, as the shot role lists them, or an actor's)
function placeOf(state, pid, key) {
  if (!key) return null;
  const t = (targetsOf(state, pid) ?? []).find(o => o.key === key);
  if (t) return { x: t.x, z: t.z };
  const a = state.actors?.list?.find(o => o.id === key);
  return a ? { x: a.x, z: a.z } : null;
}

/** The rifle on a figure (see the header), or null when the person carries none. */
export function gunLook(state, actor, ms = state?.clock?.ms ?? 0) {
  const pid = actor?.who, c = pid ? carryOf(state, pid, actor) : null;
  if (!c) return null;
  const gun = state.items?.[c.gunId];
  if (!gun) return null;
  const s = state.stop?.who === pid ? state.stop : null;
  const sess = session(state), shooter = sess ? sess.who ?? state.player?.id ?? null : null;
  // (0.0.7: a gunner of the KD's relay, drawn as the player is: its aim at its own target, its shots, its sub-step)
  const G = sess?.course === 'kd' && pid !== shooter ? sess.relay?.find(g => g.pid === pid) ?? null : null;
  const gT = G && c.posture === 'aimed' ? gunnerTarget(state, G) : null;
  const aimAt = s?.aim ? (s.aim.x !== undefined ? { x: s.aim.x, z: s.aim.z } : placeOf(state, pid, s.aim.key)) : gT ? { x: gT.x, z: gT.z } : null;
  const shots = sess?.course === 'kd' ? (sess.shots ?? []).filter(x => x.who === pid) : shooter === pid ? sess.shots : null;
  const shotMs = shots?.length ? shots[shots.length - 1].atMs : null;
  const step = s ? stepNow(state, pid, ms) : G ? gunnerNow(state, pid, ms) : null;
  const m = muzzleOf(state, pid, actor);
  return {
    model: gun.model, carry: CARRY_RIGS[c.posture] ?? 'front', stance: actor.stance ?? 'stand',
    aim: aimAt ? { x: aimAt.x, z: aimAt.z, ms: s?.aim?.settledMs ?? G?.aimAtMs ?? null } : null, shotMs,
    action: step ? { frame: frameAt(step.action, step.k ?? 0), k: step.k ?? 0 } : null,
    flash: shotMs === null ? 0 : fade(ms - shotMs, FLASH_MS), kick: shotMs === null ? 0 : fade(ms - shotMs, KICK_MS),
    muzzle: m ? { x: m.x, y: m.y, z: m.z } : null, finger: c.finger, mag: !!gun.mag, locked: !!gunField(gun, 'locked'),
  };
}

/** The kit on a figure: { ears, carrier, pouches: [{ n }] } (n: the magazines in each pouch). */
export function kitLook(state, pid) {
  const kit = state.people?.[pid]?.kit;
  if (!kit) return { ears: false, carrier: false, pouches: [] };
  const head = state.items?.[kit.worn?.head], carrier = state.items?.[kit.worn?.carrier];
  const pouches = (carrier?.holds ?? []).map(id => state.items[id]).filter(p => CONTAINERS[p?.model]?.fits?.includes('mag')).map(p => ({ n: (p.holds ?? []).length }));
  return { ears: head?.model === 'ears-m1', carrier: !!carrier, pouches };
}

/** A case's place at ms (WEAPONS §2.8's flight): { x, y, z, rest, rotRad }. rec: ejectCase's. */
export function caseAt(rec, ms) {
  const t = Math.max(0, (Math.min(ms, rec.landMs) - rec.atMs) / 1000), rest = ms >= rec.landMs;
  const spin = hash01('brass', rec.atMs, rec.kind) * 2 * Math.PI;
  if (rest) return { x: rec.at[0], y: 0, z: rec.at[1], rest: true, rotRad: q(spin, 1e-4) };
  return { x: q(rec.x0 + rec.v[0] * t, 1e-4), y: q(Math.max(0, rec.y0 + rec.v[1] * t - 0.5 * G_MS2 * t * t), 1e-4), z: q(rec.z0 + rec.v[2] * t, 1e-4), rest: false, rotRad: q(spin + t * 25, 1e-4) };
}

/**
 * A case thrown from the port (WEAPONS §2.8; the record the shot role stores): { kind, atMs, x0, y0,
 * z0, v: [vx, vy, vz], landMs, at: [x, z] }. gun: its record (unused this round but for its model);
 * carry: { x, z, yawRad (or headRad, the heading), stance, hand } (hand: thrown by a hand on the charging handle); key: the
 * hash's (the shot's id, or the step's).
 */
export function ejectCase(gun, carry, { atMs, kind = 'case', key = '' } = {}) {
  const yaw = carry.yawRad ?? carry.headRad ?? faceRad(carry.face), stance = carry.stance ?? 'stand';
  const speed = (EJECT_MS + (hash01('eject', key, 'v') * 2 - 1) * EJECT_SPREAD_MS) * (carry.hand ? HAND_EJECT_K : 1);
  const dir = yaw + (EJECT_DEG + (hash01('eject', key, 'a') * 2 - 1) * EJECT_SPREAD_DEG) * Math.PI / 180;
  const x0 = q(carry.x + PORT_AHEAD_M * Math.cos(yaw) - PORT_RIGHT_M * Math.sin(yaw), 1e-4), z0 = q(carry.z + PORT_AHEAD_M * Math.sin(yaw) + PORT_RIGHT_M * Math.cos(yaw), 1e-4);
  const y0 = PORT_H_M[stance] ?? PORT_H_M.stand;
  const vx = q(speed * Math.cos(dir), 1e-4), vz = q(speed * Math.sin(dir), 1e-4);
  const tS = Math.sqrt(2 * y0 / G_MS2), landMs = atMs + Math.round(tS * 1000);
  const tq = (landMs - atMs) / 1000;
  return { kind, atMs, x0, y0, z0, v: [vx, 0, vz], landMs, at: [q(x0 + vx * tq, 1e-4), q(z0 + vz * tq, 1e-4)] };
}

/**
 * The range as the stage draws it, or null with no session: { hot, lanes: [{ lane, mine, holes: [{
 * xCm, yCm, score, v, n, string, atMs }] }], brass: [{ x, y, z, kind, rest, rotRad }], lying: [{ id, kind: 'mag', x,
 * z }], pick: { x, z } | null, aimed }. n: the hole's number in its string, string its string (0 to 2), atMs its shot's game time.
 */
export function rangeLook(state, ms = state?.clock?.ms ?? 0) {
  const s = session(state);
  if (!s) return null;
  const [l0, l1] = s.lanes ?? [1, 6];
  const shots = s.shots ?? [], count = {};
  const holes = {};
  for (const sh of shots) {
    if (!sh.hole) continue;
    const k = `${sh.lane}|${sh.string ?? 0}`;
    count[k] = (count[k] ?? 0) + 1;
    (holes[sh.lane] ??= []).push({ xCm: sh.hole[0], yCm: sh.hole[1], score: sh.score ?? 0, v: !!sh.v, n: count[k], string: sh.string ?? 0, atMs: sh.atMs ?? null });
  }
  const lanes = [];
  for (let lane = l0; lane <= l1; lane++) lanes.push({ lane, mine: lane === s.lane, holes: holes[lane] ?? [] });
  const area = state.actors?.area ?? state.places?.live?.area;
  const lying = area ? lyingOf(state, area).filter(l => state.items?.[l.id]?.type === 'mag').map(l => ({ id: l.id, kind: 'mag', x: l.x, z: l.z })) : [];
  const pick = state.stop?.pick ?? null, pid = state.stop?.who ?? null;
  // (the last shot's blast: the shooter's place and stance now, which a string never moves; its game time)
  const mineShots = s.course === 'kd' ? shots.filter(x => x.who === (s.who ?? state.player?.id)) : shots;
  const last = mineShots.length ? mineShots[mineShots.length - 1] : null, me = state.actors?.list?.find(a => a.who === (s.who ?? state.player?.id)) ?? null;
  // (a tracer's: its kind, its lane, and where its trace lights and how fast it flies, the calibre's own numbers)
  const L = last?.load ? loadOf('6.5x40r', last.load) : null;
  const fire = last && me && ms - last.atMs >= 0 && ms - last.atMs < DUST_MS ? { atMs: last.atMs, x: me.x, z: me.z, face: me.face ?? 'right', stance: me.stance ?? 'stand',
    ...(last.load ? { load: last.load, lane: last.lane, ...(L?.traceFromM ? { traceFromM: L.traceFromM, vMs: L.vRefMs } : {}) } : {}) } : null;
  return {
    hot: !!s.hot, lanes,
    brass: (s.brass ?? []).map(rec => ({ ...caseAt(rec, ms), kind: rec.kind, stance: STANCE_OF_PORT[rec.y0] ?? 'stand', atMs: rec.atMs })),
    lying, pick: pick && pid ? placeOf(state, pid, pick) : null, aimed: !!state.stop?.aim, fire,
    kd: s.course === 'kd' ? kdLook(state, s, ms) : null,
  };
}

// (0.0.7: the KD's part of rangeLook (see the header))
function kdLook(state, s, ms) {
  const K = KD_RANGE.kd, seed = state.meta?.seed ?? 0;
  const faces = K.lanes.map(L => {
    const v = pitView(s, L.lane, ms), p = s.pits?.[L.lane];
    return { lane: L.lane, x: L.face.x, z: L.face.z, paper: L.face.paper, up: v.up, holes: (v.holes ?? []).map(h => ({ xCm: h.at[0], yCm: h.at[1], n: h.n, atMs: h.atMs })),
      spotter: v.spotter, disk: v.disk ? { value: v.disk.value, sinceMs: v.disk.sinceMs ?? null } : null, flagSinceMs: p?.flagUntilMs && p.flagUntilMs > ms ? p.flagSinceMs ?? null : null };
  });
  const flags = K.flags.map(f => ({ x: f.x, z: f.z, ...flagOf(seed, ms, f.x, f.z) }));
  const actors = state.actors?.list ?? [], fires = [], dust = [];
  for (const sh of s.shots ?? []) {
    const dt = ms - sh.atMs;
    if (dt < 0 || dt >= Math.max(FIRE_LOOK_MS, DUST_MS + 1000)) continue;
    const a = actors.find(x => x.who === sh.who);
    if (dt < FIRE_LOOK_MS && a) fires.push({ who: sh.who, atMs: sh.atMs, x: a.x, z: a.z, face: a.face ?? 'right', stance: a.stance ?? 'stand', load: sh.load ?? 'ball', lane: sh.lane });
    // (a round past its face into the berm: the dust where it struck, its flight later)
    if ((sh.line ?? 25) !== 25 && sh.lane) {
      const at = sh.atMs + 450, L = K.lanes[sh.lane - 1];
      if (L && ms >= at && ms - at < DUST_MS) dust.push({ x: K.berm.rect[0] + 0.3, y: q(L.face.upY + (sh.hole ? -sh.hole[1] / 100 : 0.6), 0.01), z: q(L.z + (sh.hole ? sh.hole[0] / 100 : 0.4), 0.01), atMs: at });
    }
  }
  const brass = (s.brass ?? []).filter(rec => rec.landMs > ms || rec.kind !== 'case').map(rec => ({ ...caseAt(rec, ms), kind: rec.kind, stance: STANCE_OF_PORT[rec.y0] ?? 'stand', atMs: rec.atMs }));
  return { line: s.line ?? 25, faces, flags, fires, brass, tiles: tilesLook(state), dust };
}
// (a case's stance from the port height it left: PORT_H_M's values are the stances')
const STANCE_OF_PORT = Object.freeze(Object.fromEntries(Object.entries(PORT_H_M).map(([k, v]) => [v, k])));
