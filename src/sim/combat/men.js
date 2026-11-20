// OLYMPUS combat: the live men, the one seam through which the sim reads a man who is a man and not a stand: how much of him a viewer sees, a fading memory of him, a marking round at a marine, and a man covered and accounted for (COMBAT §7.11, §25.18; the build sheet v0.0.19 §3.3, §0 item 13).
//
// "Stack and clear, live" puts role-players in place of stands 2a and 3a. Each rides an R.turners record with a `live`
// sub-record (src/sim/scenarios/opfor.js writes it: { who, card, st, … }), so the detector, the #2, the pars, the clear gate
// and the target view take him in through the paths they already have. Every new reader asks this module, never his T
// fields directly, so the day men get a registry of their own only this module moves.
//
// What is seen of a man (seenK). For a stand it is exactly the expression every sighting read before (contact.js's detector,
// the #2's twoSees and twoOn): PEOPLE's sightOf at its spot times turners.js facingOf, the raw product, each call site
// keeping its own quantisation or none (the build sheet's §0 item 13), so every turner lane is byte for byte the same. For a
// live man it is his facing (1, or 0 once the instructor has ruled him out) times his exposure: the mean of perception.js
// visibility at three points, his centre and EXPOSE_OFF_M 0.2 m either side of it across the viewer's line of sight. Each
// point's visibility is the eye's openness there times its clear line on the sight grid, so a man half behind room 3's wing
// wall or a jamb is seen at two lines of three (0.67 of the openness, over SEEN 0.5) and not at one (0.33). A round's
// flash draws the eye (`drawn`): the viewer's cone opened to the whole circle (CONE_SOFT_RAD past π, so its soft edge
// is full behind him too), the lines left as they are: a man who can shoot you always has a line back (clearLine is
// symmetric), and only the cone differs. marineTarget gives a marine as a role-player's target by the same exposure.
//
// The memory (remember, stale). A viewer's sightings of a live man are kept on a { [key]: ms } map, the last tick he was
// seen: the player's on state.mind.contact.seenAt, the #2's on R.house.two.seenAt, a role-player's own on T.live.seen. He is
// stale MAN_MEMORY_MS 3 s after he was last seen, and forgotten then for the take-in: his next appearance is a fresh window.
// The same rule serves every viewer. forget() drops him at once (a man who gave up is a new man to take in).
//
// A marking round at a marine (incoming, the one writer): the round's line from the muzzle toward the marine, extended; each
// marine of the stack within its zero takes the near miss (supp.js 'subsonic' for a marking round, 'crack' for a ball one,
// by his distance from the line); a strike (the shot's hole on him: resolveShot's man branch, target kind 'marine') goes on
// R.house.live.struck { who, by, shotId, part, zone, at, atMs }, gives the victim supp.js's 'hit' (HIT_PTS 25: it stings,
// it never wounds) and emits the 'house' fact phase 'paint'. A marine who did not know the shooter has his eye drawn
// (contact.drawn, or the #2's W.drawn: { key, atMs }, good for DRAWN_MS, one tick). v0.0.20 (the user's answer of 2026-11-16,
// "Paintball should end if the hit is 'fatal'"): the strike is rated on its tick by combat/would.js wouldHave, what the live
// round it stands for would have done to him through his kit's armour by the wound model, and only a fatal one (would.js
// fatalOf: killed, down for good at once, or bled out inside BLEED_OUT_MS) makes him the casualty; v0.0.19's sensor (two torso
// or one head: MARINE_DOWN, would.js COUNT_DOWN) judges a lane v0.0.19 saved. struckOn reads the marks and the verdict, and the
// first marine down is the casualty (R.house.live.casualty = { who, by, atMs, endAtMs = atMs + CASUALTY_MS 2 s, why, shotId },
// the 'house' fact 'casualty'): the scene
// halts the lane with stepper.js HALTS 'casualty' and ends it with its card at endAtMs; through the beat (casualtyOn) nothing of
// yours is taken (contact.js refusesAct, feetOf) and the panel is down.
//
// Covered and accounted for. aimedOn(state, pid, T, ms): a marine's rifle in his hands, its muzzle's yaw within react.js
// SECTOR_HALF_DEG 20° of the man, and the man seen (seenK at SEEN). coverTick keeps T.live.cover = { pid, fromMs } while one
// marine is on him (you first, then your #2), and coveringOf gives that marine once COVER_MS 0.5 s has run. accountedOf is
// 'out' (ruled out), 'down' or 'hands' when he is so and covered (by you, or your #2's "Got him.", R.house.two.got), else null;
// gateWhy is the clear gate's reason on him ('down', 'hands', 'unaccounted': seen by the team, up, and in nobody's sight now).
//
// What a man is doing, read (v0.0.26, "Bang, then go": its build sheet item 6, §0 item 11, §3.1). liveStateOf(state, T, ms) is the
// one map from his record to the words a viewer's eyes read off him: 'dazed' while he is shocked (shockedNow: startled by supp.js,
// or flash-blind or stunned by his combat block) and neither down nor giving up, else LIVE_STATE by his st. The identification
// (contact.js identify), the instinct, opfor.js opforLook's frame and the card read it, so the daze is drawn and named exactly
// while the sim's block says so, on every live lane (one rule: a shocked man read AIMING was wrong on "Stack and clear, live" too).
// None of it writes anything on a lane with no live man: every writer is reached only through a record with `live`.
//
// v0.0.27, "Away the boarding party" (its build sheet items 6, 7, §1 A; FT§4, FT§5.2, FT§5.5): LIVE_STATE gains 'firing-blind' (st
// 'blind', an irregular's blind fire over his cover) and 'running-away' (st 'flee', his flight to his refuge), the plaque's FIRING BLIND
// and RUNNING AWAY; incoming's near misses and coverTick's marines are the fire team (team.js fireTeamOf: you and your #2 everywhere, the
// leader and the AR too aboard); its strike is rated with the scene's bus (would.js wouldHave's), and on 'real' (would.js realOf: the
// round's own load on the marine's own body) it writes no 'paint' fact and no casualty: bodyDown(state, pid, ms) is then the one reader
// of a man down, the wound model's downOf on his own body, the knock included, or his stance 'down' (body/domain.js woundsFast's).
// A defender's round that strikes nobody aboard meets its face here (holes.js missFace: the boarding's holes and counts, the hull's
// line, the ball's grit), as houseShot does for the marines' (the v0.0.27 code review, finding 1: his misses reached no wall).
// Pure but remember, forget, incoming and coverTick, which write the memories, the house's record and the pools.
import { q } from '../../core/num.js';
import { playerActor, playerId } from '../../core/ids.js';
import { sightOf, eyeOf, visibility, SEEN, CONE_SOFT_RAD } from '../people/perception.js';
import { contactOf, noteContact } from '../people/mind.js';
import { facingOf, turnersOf } from '../arms/turners.js';
import { muzzleOf, angleDiff } from '../arms/carry.js';
import { addSupp, inputPts, startled, blockOf, SUBSONIC_ZERO_M, CRACK_ZERO_M } from './supp.js';
import { SECTOR_HALF_DEG } from './react.js';
import { membersOf, fireTeamOf } from './team.js';
import { wouldHave, strikeOf, fatalOf, realOf, COUNT_DOWN } from './would.js';
import { opOf, sessionOf, houseRec } from './op.js';
import { missFace } from './holes.js';
import { downOf } from '../body/wounds.js';

/** A live man out of a viewer's sight this long is forgotten for the take-in (ms); his exposure's side points off his centre (m); a cover held this long counts (ms); a casualty's beat before the card (ms). My calls. */
export const MAN_MEMORY_MS = 3000, EXPOSE_OFF_M = 0.2, COVER_MS = 500, CASUALTY_MS = 2000;
/** The eye drawn by a round stays drawn this long (ms: one tick, the look that follows the round). */
export const DRAWN_MS = 50;
/** v0.0.19's marking sensor on a marine (the stands' own, shoothouse.js STOP_TORSO, STOP_HEAD), kept for a lane v0.0.19 saved (would.js COUNT_DOWN; v0.0.20 rates each strike: would.js). */
export const MARINE_DOWN = COUNT_DOWN;
/** A man on the move is harder to hit (shot.js modsOf; my call). */
export const MOVING_MAN_V = -2;
/** A round's line is followed this far past its muzzle for the near misses (m; past any room of the house). */
export const LINE_M = 30;
/** A marine's target point's height by his stance (m: the torso's centre; a stand's face is 1.35). */
export const MARINE_Y = Object.freeze({ stand: 1.35, kneel: 0.9, crouch: 0.9, prone: 0.25 });
/** What a live man is doing, in the identification's words (COMBAT §7.11's state words, the plaque's): by T.live.st. */
export const LIVE_STATE = Object.freeze({ wait: 'looking', turn: 'looking', aim: 'aiming', fire: 'aiming', move: 'running', cover: 'aiming', freeze: 'cowering', hands: 'hands', down: 'down', out: 'down',
  // ("Away the boarding party": an irregular's blind fire from cover and his flight to his refuge (opfor.js blindTick, startFlee))
  blind: 'firing-blind', flee: 'running-away' });

/**
 * Whether the live men on this lane choose (v0.0.27's stage 0, its build sheet §0 item 18; CA K1): v0.0.26 gated its new behaviours on
 * "Bang, then go"'s record (R.house.bangGo) so "Stack and clear, live" kept its pins; the boarding (R.house.boarding, "Away the boarding
 * party") is the second lane whose defenders choose, so the gates that are the choosing's, not the scene's, read this one predicate: the
 * re-aim after the shock and the aim from the facing he turned from (opfor.js), the read that follows sight (contact.js contactLook), and
 * T's lines over a cowering or dazed man (instinct/cqb.js). The scene's own (the window, the held door, the search, its card) stay on
 * bangGo. The live lane stays false (house-live-pin holds).
 */
export const choosesOf = (state) => { const H = houseRec(state); return !!(H?.bangGo || H?.boarding); };

/**
 * Whether a person is shocked at ms (COMBAT §7.11 step 2; the role-players' "starts nothing"): startled (supp.js startled), or his
 * combat block's flash-blind or stun still running. The one reader: opfor.js rpShocked is this.
 */
export function shockedNow(state, pid, ms = state.clock.ms) {
  if (startled(state, pid, ms)) return true;
  const c = blockOf(state, pid);
  return !!c && ((c.blindUntilMs ?? 0) > ms || (c.stunUntilMs ?? 0) > ms);
}
/** What a live man is doing at ms, in the identification's words (see the header): 'dazed' while shocked, not down nor giving up, else LIVE_STATE by his st; null for a stand. */
export function liveStateOf(state, T, ms = state.clock.ms) {
  const L = T?.live;
  if (!L) return null;
  if (L.st !== 'hands' && L.st !== 'down' && L.st !== 'out' && !L.give && shockedNow(state, L.who, ms)) return 'dazed';
  return LIVE_STATE[L.st] ?? 'looking';
}
/** Whether a turner record is a live man. */
export const isLive = (T) => !!T?.live;
/** The casualty's beat under way (the lane's R.house.live.casualty set and its end not yet come): the stack is out of the fight, every act of yours refused and your feet still (contact.js refusesAct and feetOf), the panel down (the scene's casualtyTick). */
export const casualtyOn = (state) => { const H = opOf(state); return !!H?.live?.casualty && !H.end; };
const stopped = (T) => T.stoppedAtMs !== null && T.stoppedAtMs !== undefined;
/** Up and facing at ms: not stopped, facing at SEEN (the one "up and facing" reader for new code; a stand's as every site read it). */
export function upNow(T, ms) { return !!T && !stopped(T) && facingOf(T, ms) >= SEEN; }
/** The live men's people on the lane, or null when there are none (shooting.js targetsOf leaves them out of the 'person' targets). */
export function liveWho(state) {
  let out = null;
  for (const T of turnersOf(state)) if (T.live?.who) (out ??= new Set()).add(T.live.who);
  return out;
}
/** Whether a live man's dash is under way at ms. */
export function movingNow(T, ms) { const m = T?.live?.move; return !!m && Number.isFinite(m.fromMs) && ms >= m.fromMs && (!Number.isFinite(m.untilMs) || ms < m.untilMs); }

// (a body's exposure from an eye: the mean visibility at its centre and EXPOSE_OFF_M either side across the line of sight)
function exposureOf(state, eye, x, z, ms) {
  const dx = x - eye.x, dz = z - eye.z, d = Math.hypot(dx, dz);
  if (d < 1e-6) return visibility(state, eye, x, z, ms);
  const px = -dz / d * EXPOSE_OFF_M, pz = dx / d * EXPOSE_OFF_M;
  return (visibility(state, eye, x, z, ms) + visibility(state, eye, x + px, z + pz, ms) + visibility(state, eye, x - px, z - pz, ms)) / 3;
}
// (a viewer's eye, drawn: its cone opened to the whole circle, its soft edge full behind it too)
const drawnEye = (eye) => ({ ...eye, coneRad: Math.PI + CONE_SOFT_RAD, outerCos: -2 });
/** How much of a body at (x, z) a viewer sees at ms (see the header): the exposure, the eye drawn or not. */
export function bodySeen(state, viewer, x, z, ms, { drawn = false } = {}) {
  if (!viewer) return 0;
  const eye = eyeOf(state, viewer);
  return exposureOf(state, drawn ? drawnEye(eye) : eye, x, z, ms);
}

/**
 * What a viewer sees of a man at ms (see the header): a stand's sightOf × facingOf, raw (each call site keeps its own
 * quantisation; f, the facing a site has read already); a live man's facing × his exposure, the eye drawn or not.
 */
export function seenK(state, viewer, T, ms, { drawn = false, f = undefined } = {}) {
  if (!T) return 0;
  if (!T.live) return sightOf(state, viewer, { x: T.x, z: T.z }, ms).vis * (f ?? facingOf(T, ms));
  const face = f ?? facingOf(T, ms);
  return face > 0 ? face * bodySeen(state, viewer, T.x, T.z, ms, { drawn }) : 0;
}

/** Whether a viewer's record ({ drawn: { key, atMs } }) has its eye drawn onto a man at ms (DRAWN_MS). */
export const drawnOn = (rec, key, ms) => !!rec?.drawn && rec.drawn.key === key && ms - rec.drawn.atMs <= DRAWN_MS && ms >= rec.drawn.atMs;

/** A marine as a role-player's target at ms (shot.js resolveShot's man branch, kind 'marine'): { key: 'm:<pid>', kind, who, x, y, z, dM, face, facingK }, or null. */
export function marineTarget(state, who, fromActor, ms = state.clock.ms) {
  const me = playerActor(state), a = me?.who === who ? me : state.actors?.list?.find(x => x.who === who) ?? null;
  if (!a) return null;
  const dM = fromActor ? Math.hypot(a.x - fromActor.x, a.z - fromActor.z) : 0;
  return { key: `m:${who}`, kind: 'marine', who, x: a.x, y: MARINE_Y[a.stance ?? 'stand'] ?? MARINE_Y.stand, z: a.z, dM: q(dM, 0.01), face: 'threat',
    facingK: q(bodySeen(state, fromActor, a.x, a.z, ms), 1e-6), name: who === playerId(state) ? 'you' : 'your number two' };
}

/** A sighting remembered on a memory map at ms. */
export function remember(mem, key, ms) { mem[key] = ms; return mem; }
/** Whether a man is stale on a memory map at ms: never seen, or out of sight more than MAN_MEMORY_MS. */
export function stale(mem, key, ms) { const t = mem?.[key]; return t === undefined || ms - t > MAN_MEMORY_MS; }
/** A man dropped from every marine's memory (the take-in's known and seenAt, yours and your #2's): his next sighting is a fresh window. */
export function forget(state, key) {
  const c = contactOf(state), W = opOf(state)?.two;
  for (const rec of [c, W]) { if (!rec) continue; if (rec.known) delete rec.known[key]; if (rec.seenAt) delete rec.seenAt[key]; }
}

// (a marine's live actor)
const actorOf = (state, pid) => { const me = playerActor(state); return me?.who === pid ? me : state.actors?.list?.find(a => a.who === pid) ?? null; };
// (a point's distance from a ray: from (ox, oz) along (ux, uz), LINE_M long; Infinity behind its start)
function rayDist(ox, oz, ux, uz, x, z) {
  const t = (x - ox) * ux + (z - oz) * uz;
  if (t < 0 || t > LINE_M) return Infinity;
  return Math.abs((x - ox) * uz - (z - oz) * ux);
}

/** A marine's marks (see the header): { torso, head, down, list, fatal }; down when a strike on him was fatal (would.js fatalOf, the one rule). */
export function struckOn(state, who) {
  const list = (opOf(state)?.live?.struck ?? []).filter(s => s.who === who);
  const torso = list.filter(s => s.part === 'torso' && (s.zone === 'A' || s.zone === 'C')).length, head = list.filter(s => s.zone === 'head').length;
  const fatal = fatalOf(state, who);
  return { torso, head, down: !!fatal, list, fatal };
}

/**
 * A role-player's round at a marine (see the header): { who (the marine aimed at), by (the role-player's turner key), shot
 * (resolveShot's record), atMs }. The near misses, the strike, the drawn eyes and the casualty. Returns { hit, down }.
 * v0.0.27 ("Away the boarding party", its build sheet item 7, §0 item 1; FT§5.2, FT§5.5): the near misses over the fire team
 * (team.js fireTeamOf: you and your #2 on every lane, the leader and the AR too aboard), the strike rated with the scene's bus
 * (would.js wouldHave's bus: on 'real' the round's own load on the marine's own body, the knock and the blood); on 'real' no paint
 * fact and no casualty's beat: the marine is down while his body is (bodyDown), and nothing ends the lane but the scene's own ends.
 */
export function incoming(state, bus, { who, by, shot, atMs = shot?.atMs ?? state.clock.ms }) {
  const R = sessionOf(state), H = R?.house, L = H?.live ?? null, real = realOf(state);
  if (!shot?.fired) return { hit: false, down: false };
  const hit = !!shot.hole?.at && shot.zone !== null && shot.zone !== undefined;
  const victim = actorOf(state, who), m = shot.muzzle ?? null;
  const ox = m?.x ?? victim?.x ?? 0, oz = m?.z ?? victim?.z ?? 0, dx = (victim?.x ?? ox) - ox, dz = (victim?.z ?? oz) - oz, d = Math.hypot(dx, dz);
  const ux = d > 1e-6 ? dx / d : Math.cos(shot.dirRad ?? 0), uz = d > 1e-6 ? dz / d : Math.sin(shot.dirRad ?? 0);
  const kind = shot.load === 'marking' ? 'subsonic' : 'crack', zeroM = kind === 'subsonic' ? SUBSONIC_ZERO_M : CRACK_ZERO_M;
  const drawn = [];
  for (const { pid } of fireTeamOf(state)) {
    const a = actorOf(state, pid);
    if (!a) continue;
    if (hit && pid === who) {
      addSupp(state, bus, pid, { id: `${shot.id}`, kind: 'hit', pts: inputPts('hit'), why: real ? 'a round in you' : 'paint', atMs });
      drawn.push(pid);
      continue;
    }
    const rM = pid === who ? 0 : rayDist(ox, oz, ux, uz, a.x, a.z);
    if (!(rM <= zeroM)) continue;
    const pts = inputPts(kind, { rM });
    if (pts > 0) { addSupp(state, bus, pid, { id: `${shot.id}`, kind, pts, why: 'a round past your head', atMs }); drawn.push(pid); }
  }
  // (the eye drawn onto a shooter its marine did not know (see the header))
  for (const pid of drawn) {
    if (pid === playerId(state)) { const c = contactOf(state); if (c?.known?.[by] === undefined) noteContact(state, {}).drawn = { key: by, atMs }; }
    else if (H?.two?.pid === pid && H.two.known?.[by] === undefined) H.two.drawn = { key: by, atMs };
  }
  // (the boarding round's code review, finding 1: aboard the boarding his miss meets the first face on its line, a hole or dust (holes.js missFace),
  // as houseShot sends the marines'; before, no defender's round reached a wall: THEIRS 0, the hull never holed, no grit drawn)
  if (!hit) { if (H?.boarding) missFace(state, shot, bus); return { hit: false, down: false }; }
  if (L) (L.struck ??= []).push({ who, by, shotId: shot.id, part: shot.part ?? 'torso', zone: shot.zone, at: shot.hole.at, atMs });
  // (the strike rated on its tick, the one rule (would.js); the fact carries its verdict for the hud and the hot wash)
  const would = L ? wouldHave(state, strikeOf(state, { ...shot, atMs }, { on: who, by }), bus) : null;
  // (on 'real' the round is the wound, never paint: no 'paint' fact, no casualty; down is his own body's)
  if (real) return { hit: true, down: bodyDown(state, who, atMs), would };
  bus?.emit('house', { phase: 'paint', who, by, shotId: shot.id, part: shot.part ?? 'torso', zone: shot.zone, atMs, would: would ? (would.fatal ? 'fatal' : would.why === 'stopped' ? 'stopped' : 'wound') : null });
  const fatal = L ? fatalOf(state, who) : null, down = !!fatal;
  if (down && L && !L.casualty) {
    L.casualty = { who, by, atMs, endAtMs: atMs + CASUALTY_MS, why: fatal.why, shotId: fatal.shotId };
    bus?.emit('house', { phase: 'casualty', who, by, atMs, endAtMs: L.casualty.endAtMs, why: fatal.why });
  }
  return { hit: true, down, would };
}

/**
 * Whether a person's own body keeps him down at ms (v0.0.27, "Away the boarding party": FT§5.2, down is the body's for everyone on
 * 'real'): the wound model's downOf (the knock included) on his body, or his stance 'down' (body/domain.js woundsFast's: held while
 * downOf says so, and for a man not the player while he waits for the corpsman, bleeding or shot in a leg or the torso). Read before
 * the body's layer of the same tick has run, downOf covers the strike's own tick; once the knock is over the stance carries it.
 */
export function bodyDown(state, pid, ms = state.clock.ms) {
  const rec = state.people?.[pid]?.body;
  if (rec && downOf(rec, ms).down) return true;
  return actorOf(state, pid)?.stance === 'down';
}

/** Whether a marine has a man covered at ms (see the header): his rifle in his hands, its yaw within SECTOR_HALF_DEG of the man, the man seen. */
export function aimedOn(state, pid, T, ms = state.clock.ms) {
  const a = actorOf(state, pid), mz = a ? muzzleOf(state, pid, a) : null;
  if (!mz || !mz.inHand || !T) return false;
  if (Math.abs(angleDiff(Math.atan2(T.z - mz.oz, T.x - mz.ox), mz.yawRad)) > SECTOR_HALF_DEG * Math.PI / 180) return false;
  return seenK(state, a, T, ms) >= SEEN;
}
/** The cover on a live man kept at ms (see the header; the scene's houseRules calls it each tick): T.live.cover = { pid, fromMs } while a marine is on him. Returns the covering pid or null. */
export function coverTick(state, T, ms = state.clock.ms) {
  if (!T?.live) return null;
  const L = T.live, now = L.cover && aimedOn(state, L.cover.pid, T, ms) ? L.cover.pid : null;
  if (now) return coveringOf(state, T, ms);
  const pid = fireTeamOf(state).map(m => m.pid).find(p => aimedOn(state, p, T, ms)) ?? null;
  if (pid) L.cover = { pid, fromMs: ms }; else delete L.cover;
  return coveringOf(state, T, ms);
}
/** The marine covering a live man at ms (COVER_MS held), or null. */
export function coveringOf(state, T, ms = state.clock.ms) {
  const c = T?.live?.cover;
  return c && ms - c.fromMs >= COVER_MS ? c.pid : null;
}
// (covered: by a marine's held cover, or by your #2's "Got him.")
const covered = (state, T, ms) => coveringOf(state, T, ms) !== null || opOf(state)?.two?.got?.[T.key] !== undefined;
/** A live man accounted for (see the header): 'out', 'down' or 'hands' when so and covered, else null. */
export function accountedOf(state, T, ms = state.clock.ms) {
  const st = T?.live?.st;
  if (!st) return null;
  if (st === 'out') return 'out';
  if ((st === 'down' || stopped(T)) && covered(state, T, ms)) return 'down';
  if (st === 'hands' && covered(state, T, ms)) return 'hands';
  return null;
}
/** The clear gate's reason on a live man at ms (see the header): 'down', 'hands', 'unaccounted' or null. */
export function gateWhy(state, T, ms = state.clock.ms) {
  const st = T?.live?.st;
  if (!st || st === 'out' || accountedOf(state, T, ms)) return null;
  if (st === 'down' || stopped(T)) return 'down';
  if (st === 'hands') return 'hands';
  const seenBy = opOf(state)?.live?.seenBy;
  if (seenBy?.[T.key] === undefined) return null;
  const inSight = membersOf(state).some(m => { const a = actorOf(state, m.pid); return !!a && seenK(state, a, T, ms) >= SEEN; });
  return inSight ? null : 'unaccounted';
}
