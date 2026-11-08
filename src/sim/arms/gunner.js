// OLYMPUS arms: the relay, generated marines firing their own strings beside you on the tower's commands (WEAPONS §11.3, §11.5; the build sheet 0.0.7 §2.3, §8 items 10, 23 and 27).
//
// Tradecraft's gunner() (src/sim/armed.js: "the same steps as the player's (firearms.js act(): its time by
// their Weapon handling, its roll), one after another in real time: the draw, the safety or the selector, a
// round chambered, a stoppage cleared, the aim, the shot (the same odds as yours), the recovery"), ported to
// OLYMPUS's people and arms and to the range: a gunner answers the tower and nothing else (no threat is read:
// COMBAT §25's take-in is 0.0.7b's, the sheet's §8 item 27). Each gunner is plain data on the session
// (R.relay[]: { pid, aid, lane (the KD lane), bay (the bay's lane), gunId, magIds, untilMs, i (the command
// it works to), q (the sub-steps left), sub: { action, fromMs, toMs } | null, done, step, hold: [x, y] (mrad),
// read: { crossMs, atMs } | null, zero: { elev, wind } | null, string, fired, seats, shots, score, of, v, out? }),
// so a save mid-string carries on byte for byte.
// gunnerStep (the 'actors' fast layer, lived only) gives each gunner whose untilMs has come its next sub-step:
//   - a new command (R.cmd.i past the one it worked to): a plan of the Corps' sub-steps for it (drills.js
//     MACROS' subs for LOAD, MAKE READY, the RELOADs, CEASE FIRE, UNLOAD; the stance the tower called; the
//     optic's lever; the dope dialled to its believed zero + the dope card; its own read of the flags and the
//     hold for it, holdFor of the strike it believes; its group read and its clicks dialled on the zero
//     card); a step under way always finishes first (on CEASE FIRE it stops at the sub-step's end, then goes
//     on safe: COMBAT §3.3's orderToMe);
//   - each handling sub-step through firearms.js doAction (its time by the gunner's Weapon handling, its roll,
//     its fumbles and its negligent discharges the ladder's, as yours), log false: a gunner's rolls stay out of
//     J (the log is the player's: the sheet's §8 item 23); a stance by combat/steps.js stanceMs, applied at its end;
//   - the string: the aim (shot.js aimMsOf), the hold to +4 in slow fire and to +2 in rapid (HELD_SLOW,
//     HELD_RAPID, at Marksmanship's rate), the pull (shot.js resolveShot at its own face with its held aim and
//     its hold, log false: its own stream, its own roll, the hole, the case thrown), until its magazine locks
//     back, the second magazine seated in a string of two (the 200 m's), a stoppage cleared by IMMEDIATE ACTION
//     (REMEDIAL ACTION on a double feed seen);
//   - its shots recorded on the session with its `who` (handling.js recordShot), so the pits mark them, the
//     case lands on the tiles, the 'shot' fact carries the report (the hud's sound); its score on the record.
// relayReady(state, i) is every gunner done with command i (lineReady reads it: the RO calls the next command
// when the whole line is ready). skipString(state, pid, …) is a string rolled shot by shot at the string's
// start modifiers (WEAPONS §11.3), for relay 2's confirm behind the pits' splash: each shot a d20 on
// stream('relay2', seed, pid, line, k), its ring by paper.js ringOf. gunnerNow(state, pid, ms) is what the
// stage reads of a gunner's step (look.js: the action's frame and its share k), as stepNow is the player's.
// Pure but newGunner, gunnerStep, skipString and relayCease.
import { stream, d20 } from '../../core/rng.js';
import { playerId } from '../../core/ids.js';
import { rollerOf } from '../combat/roll.js';
import { stanceMs } from '../combat/steps.js';
import { gravityAt } from '../places/env.js';
import { subsOf } from './drills.js';
import { doAction, beliefOf, gunField, beliefZero, dialMs, sightOf, setSight, believeZero, OPTIC_S } from './firearms.js';
import { aimMsOf, resolveShot, poiOf, holdFor, HELD_RATE0, dcOf } from './shot.js';
import { readWind } from './wind.js';
import { DOPE_CARD } from './ballistics.js';
import { ringOf, groupOf, poolOf, callOf, scoreOf, PAPERS } from './paper.js';
import { KD_RANGE, kdLaneOf } from '../../data/places/range.js';
import { KD_STRINGS } from '../../data/courses.js';
import { recordShot, seqOf } from '../scenarios/handling.js';
import { gunnerNd } from '../scenarios/range.js';
import { policeOf, POLICE_CASE_S } from './brass.js';
import { faceUpAt, markedFor } from './pits.js';
import { SLUNG } from './carry.js';

/** The held aim a gunner takes before a pull: to +4 in slow fire, +2 in rapid (the build sheet 0.0.7 §2.3). */
export const HELD_SLOW = 4, HELD_RAPID = 2;
/** A gunner with nothing to do looks again this often (ms): a tick is too often for twelve marines who are waiting. */
export const IDLE_MS = 500;
/** A slow-fire gunner waits for its mark at most this long before it fires on (ms; the pits' longest cycle is ~16 s), and looks again this often. */
export const MARK_WAIT_MAX_MS = 30_000, MARK_LOOK_MS = 250;
/** A group whose centre is this close to the zero mark, each axis, is zeroed (cm; the course's zeroOkCm). */
export const ZERO_OK_CM = 1.0;

const session = (state) => state.armoury?.range ?? null;
const actorOf = (state, pid) => state.actors?.list?.find(a => a.who === pid) ?? null;

/** A gunner made and put on the relay (w; see the header). Returns the record. */
export function newGunner(state, { pid, lane, bay, gunId, magIds = [] }) {
  const R = session(state);
  const G = { pid, aid: actorOf(state, pid)?.id ?? null, lane, bay, gunId, magIds: [...magIds], untilMs: state.clock.ms, i: -1, q: [], sub: null, done: false, step: null,
    hold: [0, 0], read: null, zero: null, string: null, fired: 0, seats: 0, shots: 0, score: 0, of: 0, v: 0 };
  (R.relay ??= []).push(G);
  return G;
}

/** The face or card a gunner fires at on the session's line now: shot.js's target shape. */
export function gunnerTarget(state, G) {
  const R = session(state), a = actorOf(state, G.pid);
  if (!R || !a) return null;
  if ((R.line ?? 25) === 25) {
    const L = KD_RANGE.bay.lanes.find(l => l.lane === G.bay), t = L?.target;
    if (!t) return null;
    return { key: `paper:${G.bay}`, kind: 'paper', paper: R.paper ?? 'zero25', x: t.x, z: t.z, y: t.centreY, dM: Math.hypot(t.x - a.x, t.z - a.z), lane: G.bay, line: 25, name: `the lane ${G.bay} card`, far: false };
  }
  // (the face's carrier height now, as the player's target has it (pits.js): a face down takes the round into the berm)
  const L = kdLaneOf(G.lane), f = L.face, up = faceUpAt(R, G.lane, state.clock.ms);
  return { key: `face:${G.lane}`, kind: 'paper', paper: f.paper, x: f.x, z: f.z, y: f.downY + (f.upY - f.downY) * up, up, dM: Math.hypot(f.x - a.x, f.z - a.z), lane: G.lane, line: R.line, name: `target ${G.lane}`, far: true };
}

// (the plan of sub-steps for a command: see the header). A slung rifle comes up first (firearms.js 'up', to low ready):
// doAction refuses a handling step on a slung rifle, and the relay lay through LOAD and MAKE READY with theirs on
// their backs, loading only in the string (the runtime review's of v0.0.7)
const NOT_HANDLING = /^(stance:|aim$|hold$|fire$|string$|mark$|group$|police$|turnIn$|optic$|dope$|up$)/;
function planFor(state, G, def) {
  const plan = planOf(state, G, def), posture = state.people[G.pid]?.kit?.carry?.posture ?? 'slungFront';
  const k = plan.findIndex(a => !NOT_HANDLING.test(a));
  if (k >= 0 && SLUNG.has(posture)) plan.splice(k, 0, 'up');
  return plan;
}
function planOf(state, G, def) {
  const gun = state.items[G.gunId], b = beliefOf(state, G.gunId), a = actorOf(state, G.pid), stance = a?.stance ?? 'stand';
  const macro = (id) => subsOf(id, b).slice();
  const toStance = (s) => (stance === s ? [] : [`stance:${s}`]);
  switch (def.id) {
    case 'prone': return toStance('prone');
    case 'load': return b.mag === 'in' ? [] : macro('load');
    case 'sit': return [...toStance('sit'), ...(b.mag === 'in' ? [] : macro('load'))];
    case 'ready': return b.chamber === 'live' ? [] : macro('ready');
    case 'reload': return b.locked && b.count === 0 ? [...macro('reload:speed'), 'selector:safe'] : b.mag === 'in' ? [] : macro('load');
    // (the string's position first, whatever the stance was left in: a setup entered mid-string, a casualty's interruption)
    case 'fire': return [...toStance(KD_STRINGS[def.string]?.position ?? 'prone'), 'aim', 'selector:semi', 'string'];
    case 'cease': return gunField(gun, 'mode') === 'safe' && (state.people[G.pid]?.kit?.carry?.finger ?? 'off') === 'off' ? [] : macro('cease');
    case 'group': return ['group'];
    case 'clear': return gun.mag || gunField(gun, 'chamber') ? macro('unload') : [];
    case 'police': return [...toStance('kneel'), 'police', 'stance:stand'];
    case 'turnIn': return ['turnIn'];
    case 'optic': return (gun.optic ?? 1) === 4 ? [] : ['optic'];
    case 'dope': return ['dope'];
    default: return [];
  }
}

// (one sub-step begun at now: its effects at once (a handling step's are doAction's), a stance's at its end; returns its ms)
function runSub(state, bus, G, action, now) {
  const a = actorOf(state, G.pid), gun = state.items[G.gunId], roller = rollerOf(state, G.pid, { ms: now }), R = session(state);
  const kit = state.people[G.pid]?.kit;
  if (action.startsWith('stance:')) {
    const to = action.slice(7);
    if (kit?.carry?.posture === 'aimed') kit.carry.posture = 'lowReady';
    return stanceMs(a?.stance ?? 'stand', to, { gG: gravityAt(state, null, a?.x ?? 0, a?.z ?? 0).gG, fitness: roller.value('fitness') });
  }
  if (action === 'aim') {
    const T = gunnerTarget(state, G);
    if (!T || !a) return 0;
    const ms = aimMsOf(state, G.pid, G.gunId, T);
    if (kit?.carry) kit.carry.posture = 'aimed';
    a.headRad = Math.round(Math.atan2(T.z - a.z, T.x - a.x) * 1e6) / 1e6; a.face = 'right';
    G.aimAtMs = now + ms;
    // (its read of the flags and the hold for it: holdFor the strike it believes, its own read in place of the coach's)
    if (T.line !== 25) {
      const w = readWind(state, G.pid, { atMs: now, bearingRad: 0, rangeM: T.dM, coach: false });
      G.read = { crossMs: w.crossMs, atMs: now };
      (R.reads ??= {})[G.pid] = { crossMs: w.crossMs, atMs: now };
      const poi = poiOf(state, G.pid, G.gunId, T, { belief: true, hold: null, crossMs: w.crossMs });
      const h = holdFor(poi, T.dM);
      G.hold = [h.xMil, h.yMil];
    } else G.hold = [0, 0];
    return ms;
  }
  if (action === 'hold') {
    const mrk = roller.value('marksmanship'), rate = HELD_RATE0 + mrk / 10, want = KD_STRINGS[G.string]?.rapid ? HELD_RAPID : HELD_SLOW;
    const settled = G.aimAtMs ?? now;
    return Math.max(0, Math.ceil((settled + want / rate * 1000 - now) / 50) * 50);
  }
  if (action === 'mark') return MARK_LOOK_MS;
  if (action === 'fire') {
    const T = gunnerTarget(state, G);
    const mrk = roller.value('marksmanship'), rate = HELD_RATE0 + mrk / 10;
    const heldV = Math.round(Math.min(4, Math.max(0, (now - (G.aimAtMs ?? now)) / 1000 * rate)));
    if (kit?.carry) kit.carry.finger = 'on';
    const { ms, shot } = resolveShot(state, bus, { pid: G.pid, gunId: G.gunId, target: T, tempo: 'normal', held: { v: heldV }, hold: { xMil: G.hold[0], yMil: G.hold[1] }, log: false });
    recordShot(state, bus, { ...shot, lane: T?.lane ?? null });
    if (shot.fired) {
      G.fired++; G.shots++; G.lastShot = shot.id;
      G.aimAtMs = now + ms;
      // (the zero card's groups are not scored, as the player's are not: the card counts the 300 m and 200 m strings)
      // (the zero's holes kept with the turrets they were fired at, for the gunner's own pooled read: paper.js poolOf)
      if (G.string === 'zero' && shot.hole?.at) (G.zeroHoles ??= []).push({ at: shot.hole.at, sight: { ...sightOf(gun) } });
      if (G.string !== 'zero') {
        if (shot.hole) { G.score += shot.hole.score ?? 0; G.of += 5; if (shot.hole.v) G.v++; }
        else G.of += 5;
      }
    }
    if (!shot.fired || shot.stoppage) G.stop = shot.stoppage === 'double' ? 'double' : 'ia';
    return ms;
  }
  if (action === 'group') {
    // (its own group read on the zero card and its clicks dialled: no coach of its own, its eye and the card's grid)
    // (every hole of its zero so far, each moved by the clicks dialled since, read as one group: the coach's way with yours,
    // paper.js poolOf (a three-round group alone wanders several clicks))
    const holes = G.zeroHoles ?? [];
    if (!holes.length || G.zeroed) return 0;
    const paper = R.paper ?? 'zero25', g = poolOf(holes, sightOf(gun), 25), call = callOf(paper, g.centreCm, 25), mark = PAPERS[paper]?.markCm ?? [0, 0];
    // (the turrets it ends on are the zero it believes, as the coach writes the player's down: the dope at each line is
    // dialled from it (without this the relay's dope threw the zero away and they shot 30 cm off at 300 m))
    // (firearms.js setSight and believeZero: the turrets clamped to their reach, a 0, 0 written as absent, as the player's
    // are (the code review's of v0.0.7))
    const believe = () => believeZero(gun, sightOf(gun));
    if (Math.abs(g.centreCm[0] - mark[0]) <= ZERO_OK_CM && Math.abs(g.centreCm[1] - mark[1]) <= ZERO_OK_CM) { G.zeroed = true; believe(); return 0; }
    const s = sightOf(gun), turned = setSight(gun, { elev: s.elev + call.elev, wind: s.wind + call.wind });
    believe();
    return dialMs(roller, turned.n);
  }
  if (action === 'police') {
    const n = policeOf(state, G.pid);
    return Math.round(Math.max(1, n) * POLICE_CASE_S * 1000);
  }
  if (action === 'turnIn') {
    for (const id of G.magIds) { const m = state.items[id]; if (m?.n) m.n = 0; }
    if (gun.mag && state.items[gun.mag]?.n) state.items[gun.mag].n = 0;
    return 1500;
  }
  if (action === 'optic') { gun.optic = 4; return Math.round(OPTIC_S * 1000); }
  if (action === 'dope') {
    const line = R.line, dope = DOPE_CARD.r7?.[line]?.elev ?? 0, z = beliefZero(gun), s = sightOf(gun);
    const turned = setSight(gun, { elev: z.elev + dope, wind: z.wind });
    return turned.n ? dialMs(roller, turned.n) : 0;
  }
  // (a handling sub-step: firearms.js doAction, its roll kept out of J and off the player's stream (rng 'relay'))
  const r = doAction(state, bus, { pid: G.pid, gunId: G.gunId, action, tempo: 'normal', pressure: 'evaluated', log: false, rng: 'relay' });
  if (r.magIn && !r.refused) G.seats++;
  if (r.nd) gunnerNd(state, bus, G, r.nd);
  if (action === 'finger' && kit?.carry) delete kit.carry.finger;
  return r.ms ?? 0;
}

// (a sub-step's end: a stance taken)
function endSub(state, G) {
  const s = G.sub;
  if (!s) return;
  if (s.action.startsWith('stance:')) {
    const a = actorOf(state, G.pid), to = s.action.slice(7);
    if (a) { if (to === 'stand') delete a.stance; else a.stance = to; }
  }
  G.sub = null;
}

// (the string's next: the hold and the pull, the change of magazine in a string of two, the stoppage's drill, or done)
function stringNext(state, G) {
  const gun = state.items[G.gunId], b = beliefOf(state, G.gunId), S = KD_STRINGS[G.string] ?? KD_STRINGS.zero;
  if (G.stop) { const st = G.stop; delete G.stop; return [...subsOf(st === 'double' ? 'remedial' : 'ia', b), 'aim', 'string']; }
  const mag = gun.mag ? state.items[gun.mag] : null, empty = !mag || (mag.n ?? 0) === 0;
  // (rounds in the magazine and none chambered (the bolt went home on nothing): rack one up)
  if (!empty && !gunField(gun, 'chamber') && !gunField(gun, 'jam')) return ['charge', 'aim', 'string'];
  if (empty && !gunField(gun, 'chamber')) {
    const spare = G.magIds.some(id => id !== gun.mag && (state.items[id]?.n ?? 0) > 0);
    if (G.fired < S.rounds && G.seats < (S.mags ?? 1) + (G.seatsAt ?? 0) && spare) return [...subsOf('reload:speed', b), 'aim', 'string'];
    return null;
  }
  // (slow fire: the wait for its mark (the build sheet §2.3), the face up again with the disk or the flag for its last
  // shot before the next pull, as a shooter on the line waits; MARK_WAIT_MAX_MS at most, then it fires on)
  if (S.marked === 'each' && G.lastShot && !G.markWaitFrom) G.markWaitFrom = state.clock.ms;
  if (S.marked === 'each' && G.lastShot && !markedFor(session(state), G.lane, state.clock.ms, [G.lastShot]) && state.clock.ms - G.markWaitFrom < MARK_WAIT_MAX_MS) return ['mark', 'string'];
  delete G.markWaitFrom;
  return ['hold', 'fire', 'string'];
}

/** The fast layer 'actors' (live only: see the header): each gunner due does its next sub-step. */
export function gunnerStep(state, input, bus) {
  const R = session(state);
  if (!R || R.course !== 'kd' || !R.relay?.length || R.end || state.skip) return;
  const now = state.clock.ms, seq = seqOf(R), def = R.cmd ? seq[R.cmd.i] : null;
  for (const G of R.relay) {
    if (G.out || now < G.untilMs) continue;
    if (G.sub) endSub(state, G);
    if (!def) { G.untilMs = now + IDLE_MS; continue; }
    if (G.i !== R.cmd.i) {
      G.i = R.cmd.i; G.done = false;
      if (def.id === 'fire') { G.string = def.string; G.fired = 0; G.seatsAt = G.seats; delete G.lastShot; delete G.markWaitFrom; }
      G.q = planFor(state, G, def);
    }
    let action = G.q.shift();
    // (CEASE FIRE, or the line's cease on an ND: what is left of a string is dropped at the sub-step's end)
    if (!R.hot && action && ['hold', 'fire', 'string', 'mark'].includes(action)) { G.q = []; action = undefined; }
    while (action === 'string') {
      const next = R.hot ? stringNext(state, G) : null;
      if (!next) { action = undefined; break; }
      G.q = next; action = G.q.shift();
    }
    if (!action) { G.done = true; G.step = null; G.untilMs = now + IDLE_MS; continue; }
    const ms = runSub(state, bus, G, action, now);
    G.step = action;
    G.sub = { action, fromMs: now, toMs: now + ms };
    G.untilMs = now + Math.max(50, ms);
  }
}

/** Whether every gunner is done with command i (the RO's eye on the line: see the header). */
export function relayReady(state, i = session(state)?.cmd?.i) {
  const R = session(state);
  if (!R?.relay?.length) return true;
  return R.relay.every(G => G.out || (G.i === i && G.done && !G.sub));
}

/** Every gunner's string stopped and the rifle on safe at once (w): the line's cease on an ND, the range closed. */
export function relayCease(state) {
  for (const G of session(state)?.relay ?? []) {
    G.q = []; G.sub = null;
    const gun = state.items[G.gunId], kit = state.people[G.pid]?.kit;
    if (gun && gun.mode && gun.mode !== 'safe') gun.mode = 'safe';
    if (kit?.carry?.finger) delete kit.carry.finger;
  }
}

/** What the stage reads of a gunner's step: { action, k, fromMs, toMs } | null (see the header). */
export function gunnerNow(state, pid, ms = state.clock.ms) {
  const G = session(state)?.relay?.find(g => g.pid === pid);
  if (!G?.sub) return null;
  const { action, fromMs, toMs } = G.sub, k = toMs > fromMs ? Math.max(0, Math.min(1, (ms - fromMs) / (toMs - fromMs))) : 1;
  return { action, k, fromMs, toMs };
}

/**
 * A string rolled shot by shot at its start's modifiers (WEAPONS §11.3; see the header): { shots, score, of, v }.
 * opts: { line (200 | 300 | 500), paper, rounds, position ('prone' | 'sit' | 'kneel' | 'stand'), rapid, key }.
 */
export function skipString(state, pid, { line = 300, paper = 'kdA', rounds = 5, position = 'prone', rapid = false, key = 'skip' } = {}) {
  const roller = rollerOf(state, pid), value = roller.value('marksmanship');
  const { dc } = dcOf({ model: 'r7', rangeM: line, paper });
  const POS = { stand: 0, kneel: 2, sit: 3, prone: 4 };
  const mods = (roller.mods('marksmanship', { targetM: line }) ?? []).reduce((s, m) => s + m.v, 0) + (POS[position] ?? 0) + (rapid ? HELD_RAPID : HELD_SLOW) + 5;
  const r = stream('relay2', state.meta.seed, pid, line, key), holes = [];
  for (let k = 0; k < rounds; k++) {
    const nat = d20(r), ring = ringOf(nat + value + mods - dc, nat);
    holes.push(ring ? { at: [0, 0], score: ring.score, v: !!ring.v } : { at: null, score: 0, v: false });
  }
  const s = scoreOf(holes);
  return { shots: s.shots, score: s.score, of: s.of, v: s.v };
}

/** The relay's scores for the card: [{ who, lane, score, of, v }]. */
export const relayScores = (state) => (session(state)?.relay ?? []).map(G => ({ who: G.pid, lane: G.lane, score: G.score, of: G.of, v: G.v }));
// (the player is never a gunner: their own steps are the stop's)
export const isGunner = (state, pid) => pid !== playerId(state) && !!session(state)?.relay?.some(G => G.pid === pid);
