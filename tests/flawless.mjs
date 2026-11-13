// OLYMPUS tests: the shoot house's "flawless" gauges (COMBAT §25.19.8, R9 of §25.19.10): every criterion F1 to F24 measured over lanes run by an honest bot, printed, and failed only where ENFORCED says.
//
// The rework's rule (the user, 2026-11-11, scoring "Stack and clear" 25/25/25: the shoot house is the pilot for the whole
// game, and the AI must clear flawlessly) is written as tests over an honest player: tests/bots/house.mjs houseHonestBot,
// who presses only T and the shot the DI's line names on a man of his own, so a lane it finishes is one T finishes. These
// gauges come first (R9 is "written first as gauges, printing, not failing, from R1 and made to fail from R6"): each lane
// is watched tick by tick (flawlessLane) and the lanes are summed into one row a criterion (gaugeOf), which prints its
// value against its threshold and says MET or OPEN. A criterion fails its suite once it is named in ENFORCED: the stages R1
// to R8b added theirs as they landed, and R9 (2026-11-13) the rest, so every criterion F1 to F24 now fails its suite.
//
// What a lane's watch measures, every tick from GO to the lane's end (the clock's step dt is 0 while time stands still, so
// a pause is never a stop of the feet):
//   F1  each team body's circle at the walker's C0 (0.27 m) against the area's blockers (the walls and fixtures of the
//       open nav grid, src/sim/places/nav.js openNavOf) and every door leaf closed at that ms (plan.js leafRect): the
//       deepest overlap, where, who and what moved him; ticks over WALL_TOL_M 0.005 m; ticks off the floor
//   F2  #1 to #2 centre to centre: the least, and the ms under BODY_GAP_M 0.50 m; the guard's holds (bundle.js gapHold, the
//       #2's record), an honest lane's longest at most GUARD_MAX_MS
//   F3  (static, flawlessPaths) every authored paths[slot], far.path, and every move beat's path seen in a run, leg by
//       leg clearLine on the C0 grid with the doors open
//   F4  #1's feet under STILL_MS 0.3 m/s inside any door's funnel (room.js inFunnel, the place's no-stop zone), on every sheet
//       and bot (the rework's R8b, 2026-11-13: "soldiers need to stay fluidly moving"; rung 2 and up before), ms a room: the
//       game's, apart from a step that stands still by the player's choice (FEET_ROWS, places/zones.js standsStill, a "stop
//       here", a knee) and the rest it leaves the body at until it moves again (`parked`, the fuzz's); the #2's still ticks in
//       a zone; every move a body is given (a bundle's, a shot row's feet, a carry through) whose end lies in a zone; the
//       house's funnel faults in lanes with no such choice
//   F5  #1's place at his first round on each man: metres past the threshold (room.js's plane, less THRESHOLD_M 0.3)
//   F6  from #1 leaving his stack (STACK_LEAVE_M 0.3 off it, the leg stacked) to his point (POINT_AT_M 0.35): the least
//       speed, and the ms under 0.3 m/s (the feet rows excepted)
//   F7  the corner faults; at each room's "Clear!" (the 'house' fact clear) every hot spot covered, and by whom
//   F8  the faults by kind; for the fuzz bot, each fault's evidence recomputed here, independently (see faultEvidence)
//   F9  each threat's first round, by #1 or #2 (the 'shot' facts' target), against his stand's slot (a man of yours the #2 took
//       while covering your rifle down, H.two.covered, his by the rule); threats left up
//   F10 the pars missed by stand (the dummy's man, clicked within PAR_JAM_MS of his sighting, apart), the sheet's par
//   F11 the honest bot's dead ends by kind (mem.dead) and its ms out of stop motion with no act on the lane
//   F12 a stop whose line is "Carry on" right after a shot row, nobody of the room up and facing
//   F13 the stops a lane (a new choice in stop motion, or a reflex card, on the lane), each with its why (the line, the
//       halt, the contact's pause), and the presses made at it
//   F14 the lane's end ('time' a hang), the stall facts, the bot's throws; F15 the lane's and each room's time
//   F16 at each stop, any row (id or label), line or act naming a lane or a house (LANE_WORDS)
//   F17 the #2's distance to his stack at your 'stacked'; the 'two' hand-backs
//   F19 the #2 on his moving ticks: his gait idle, his tween start ($px, $pz) not where he was at the tick's start (the
//       error, metres), figureOf drawing him idle or not keeping his stride; and (the rework's R2) the instructor's the same
//       on his catwalk, printed beside
//   F24 at each stop: T's act a row of the panel (live, struck or absent, and on which page); a shot line's named row there
// Elsewhere: F18 (flawlessAdmin: the #2's condition after each tower command, from the fill), F20 (the stoppage bot,
// stoppageRun: from the rework's R6 each lane's afterClick also keeps the transition's start, its draw's end against its formula
// (the rifle let hang and the thigh's draw, firearms.js actionMs at the sheet's Weapon handling), the pistol's row and first
// round; under Gun down your "Gun up!", his "Up." and your stand, and whether your #2 saw and took the man you had bracketed), F21 (the keys bot, by laneTimes), F22 (the reference room, refRoom), F23 (determinism, saveRun).
import { createGame } from './game.mjs';
import { houseHonestBot, houseKeysBot, houseFuzzBot, stoppageBot, runHouse, SHOT_LINES } from './bots/house.mjs';
import { houseNow, HOUSE_SCENE, THREAT_FACES, STANDS, FUNNEL_FAULT_MS, LANE_MAX_MS, PAR_MS, PAR_OF_TIER, handsOf } from '../src/sim/scenarios/shoothouse.js';
import { gunField, beliefOf, actionMs } from '../src/sim/arms/firearms.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { facingOf } from '../src/sim/arms/turners.js';
import { sightOf, SEEN } from '../src/sim/people/perception.js';
import { q } from '../src/core/num.js';
import { subsOf } from '../src/sim/arms/drills.js';
import { lanePlanOf, inFunnel, pastThreshold, THRESHOLD_M } from '../src/sim/combat/room.js';
import { openNavOf, clearLine } from '../src/sim/places/nav.js';
import { onFloor, standOk } from '../src/sim/places/collide.js';
import { areaOf, leafClosed } from '../src/sim/places/model.js';
import { planOf, leafRect } from '../src/sim/places/plan.js';
import { routed, ROUTE_CLS } from '../src/sim/combat/route.js';
import { muzzleOf, SWEEP_SAFE, SPAN_M } from '../src/sim/arms/carry.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { panelOf } from '../src/sim/arms/panel.js';
import { modelOf, keyPathOf, resolvePath, LAYOUTS } from '../src/sim/arms/groups.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { RUNG_OF_TIER } from '../src/sim/skills/templates.js';
import { figureOf } from '../src/sim/people/figure.js';
import { BUNDLES } from '../src/sim/combat/drills/enter-and-clear.js';
import { CALL_S, CALL_FLOW_S, TWO_SLOT_M, TWO_WAIT_MS } from '../src/sim/combat/bundle.js';
import { TICK_MS } from '../src/core/clock.js';
import { fmt } from './helpers.mjs';
import { zoneAt, liveZoneAt, standsStill } from '../src/sim/places/zones.js';
import { contactNow } from '../src/sim/combat/contact.js';
import { moveNow } from '../src/sim/combat/stepper.js';

/**
 * R9 (2026-11-13): every criterion left, so the gauges are failing criteria (COMBAT §25.19.8): F3 the paths (nav.js clearLine
 * no longer walks past a segment's end), F6 the feet stack to point (a tick within STACK_LEAVE_M of the stack is at it), F7
 * the corners (the #2's looks wait while his eyes are on a man or on your sector, bundle.js runSlot), F8 the faults, F9 the
 * sectors, F10 the pars (the house cues each leg, contact.js and shot.js read each man's own expectation, the far leg's eyes
 * and the corporal's muzzle go where he faces; a man challenged for his hands is set apart as the dummy's is), F13 the tier
 * one's stops (the #2's doorway is "with you", a still-up man keeps the bracket, the armed man takes it, a window's open
 * tick is no stop), F14 hangs, F15 the lane time, F17 the #2 at his slot, F22 the operator's room and F24 the DI's rows.
 */
export const R9_ENFORCED = Object.freeze(['F3', 'F6', 'F7', 'F8', 'F9', 'F10', 'F13', 'F14', 'F15', 'F17', 'F22', 'F24']);
/** The criteria that fail their suite (COMBAT §25.19.8; R9 writes the gauges first: none until a stage lands its own). R1 (2026-11-12): F1, the walls, met on every bot and sheet (the authored paths walkable, the #2 held off a swinging leaf). R2 (2026-11-12): F19, the #2 animated (BODY §16.8's locomotion record, src/sim/body/loco.js). R3 (2026-11-12): F4, no doorway stops, F5, the first round out of the door, and F23, a save inside a suspended flow carrying on byte for byte (the flow: a contact suspends the drill from rung 2, the shot inside it, src/sim/combat/bundle.js). R4 (2026-11-12): F11, no dead ends (the reflex card's first answer, Make safe and Wait after the lane), F12, no "Carry on" after a row with nobody up, and F16, nothing names a lane or a house (the catalogue, src/sim/combat/drills/enter-and-clear.js MUSCLE). R5 (2026-11-13): F2, never through each other on any bot (the #2's entry cued by distance and his body gap, src/sim/combat/bundle.js; your own walk held at the gap, src/sim/places/move.js useBodies), and F18, the #2's admin (the tower's commands on his own macros, src/sim/scenarios/shoothouse.js twoCmd). R6 (2026-11-13): F20, the stoppage (the card's answers by the situation, Gun down, Off the line, Transition: pistol and Rifle up, src/sim/arms/sidearm.js; the #2 taking your man while you are down). R8b (2026-11-13): F21, no watering down by the keys, met by fluid movement (the user: "soldiers need to stay fluidly moving"; never re-baselined), and F4 widened to every sheet and bot, the #2's stills and every move's end with it (src/sim/places/zones.js, move.js throughOf, bundle.js crossingClear and freeBody). */
export const ENFORCED = Object.freeze(new Set(['F1', 'F19', 'F4', 'F5', 'F23', 'F11', 'F12', 'F16', 'F2', 'F18', 'F20', 'F21', ...R9_ENFORCED]));
/** The seeds: the user's 1489397426 first, then 1000 + 37i (COMBAT §25.19.8). */
export const flawlessSeeds = (n) => Array.from({ length: n }, (_, i) => (i === 0 ? 1489397426 : 1000 + 37 * i));
/** The sheets, the recruit to the tier one, and those T plays (rung 2 and up). */
export const SHEETS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);
export const T_SHEETS = Object.freeze(SHEETS.filter(t => RUNG_OF_TIER[t] >= 2));
/** The thresholds (COMBAT §25.19.8, §25.19.9): a body's overlap tolerated, the least gap, the feet's still speed, the doorway's. */
export const WALL_TOL_M = 0.005, BODY_GAP_M = 0.50, STILL_MS = 0.3, STACK_LEAVE_M = 0.3, POINT_AT_M = 0.35;
/** The body gap's guard held the #2 this long at once by the honest bot is the cue's fault, not the guard's (ms; COMBAT §25.19.3.4: "if it ever holds more than 0.3 s the cue is fixed"). */
export const GUARD_MAX_MS = 300;
/** You stand on your stack within this of its point (the house course's stackM, m): F17 reads the #2 then. */
export const STACK_AT_M = 0.4;
/** The tier one's lane: mean and max (s), and the stops a lane at p95. */
export const LANE_MEAN_S = 46, LANE_MAX_S = 60, STOPS_P95 = 14;
/** The tier one's room 1 to his own "Clear!" (the routed figure, s) and its tolerance (F22); doctrine's band. */
export const REF_ROOM_S = 5.27, REF_TOL = 0.15, DOCTRINE_ROOM_S = Object.freeze([5, 6]);
/** The keys bot's routed v0.0.12 figures (§25.19.1, s) and their tolerance (F21): the lane on 48213, and the private over 100 seeds. */
export const KEYS_REF = Object.freeze({ recruit: { lane48213: 95.2 }, private: { lane48213: 78.3, lane100: 78.42 } }), KEYS_TOL = 0.10;
/** The par each sheet is held to (F10): the operator's for the tier one and the Raider, the advanced for the sergeant and the corporal. */
export const PAR_HELD = Object.freeze({ tierone: 'operator', raider: 'operator', sgt: 'advanced', cpl: 'advanced' });
/** A dummy's click within this of a man's sighting is his par's excuse (ms). */
export const PAR_JAM_MS = 3000;
/** The rows that stop the feet on purpose (F4, F6's exception; COMBAT §25.19.3.1 item 3): none of them built yet. */
export const FEET_ROWS = /stop-?here|gun-?down|off-?the-?line|contact:hold|contact:challenge|back-?out|get-?down/;
/** The fuzz bot's lanes: no doorway stop of the game's, yours or your #2's, longer than this at once (ms; the rework's R8b, my call: a tick's give-way, never a queue). */
export const FUZZ_DOOR_MS = 300;
/** A blocked cell's cost on the nav grid (src/sim/places/nav.js's BLOCKED, not exported there). */
const NAV_BLOCKED = 255;
/** Words a row, a line or an act must not have (F16: "no row, line or act names a lane or a house"). */
export const LANE_WORDS = /\b(house|lane)\b/i;
/** The design's stoppage answers (§25.19.6), the card's keys in the house from the rework's R6 (arms/sidearm.js cardOptions; 'none' always last). */
export const STOPPAGE_ANSWERS = Object.freeze(['transition', 'gundown', 'offline', 'ia', 'look']);

const AREA = HOUSE_SCENE.area;
const r3 = (v) => (Number.isFinite(v) ? Math.round(v * 1000) / 1000 : v);
const d2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const legOfStand = (stand) => (stand === 'H' ? 3 : Number(stand?.[0]) - 1);
const slotOf = (stand) => STANDS[stand]?.slot ?? 1;
// (the signed distance past a plan's door plane, + into the room: room.js's `across`)
const acrossM = (P, x, z) => P.plane.into * ((P.plane.axis === 'x' ? z : x) - P.plane.at);

// (the area's blockers at C0 (doors open) and its doors' leaves, once)
let geo = null;
function geoOf() {
  if (geo) return geo;
  const G = openNavOf(AREA, 'C0'), plan = planOf(areaOf(AREA));
  geo = { G, R: G.radiusM, rects: G.blockers, doors: plan.openings.filter(o => o.kind === 'door').map(o => ({ o, r: leafRect(o) })) };
  return geo;
}
// (how far a body's circle at (x, z) runs into a rect: radius less the distance, + when overlapping)
function into(r, x, z, R) {
  const dx = x < r.x0 ? r.x0 - x : x > r.x1 ? x - r.x1 : 0, dz = z < r.z0 ? r.z0 - z : z > r.z1 ? z - r.z1 : 0;
  let d = Math.hypot(dx, dz);
  if (d === 0) d = -Math.min(x - r.x0, r.x1 - x, z - r.z0, r.z1 - z);
  return R - d;
}
/** A body's deepest overlap with the walls, fixtures and the leaves closed at ms (m, 0 when clear), and what it is in. */
export function overlapOf(state, x, z, ms = state.clock.ms) {
  const { R, rects, doors } = geoOf();
  let worst = 0, what = null;
  for (const r of rects) { const k = into(r, x, z, R); if (k > worst) { worst = k; what = 'wall'; } }
  for (const D of doors) { if (!leafClosed(state, D.o, ms)) continue; const k = into(D.r, x, z, R); if (k > worst) { worst = k; what = `leaf ${D.o.id}`; } }
  return { m: worst, what };
}

// (the 3-D muzzle line against a teammate's body as a capsule (COMBAT §25.19.3.5): the shortest distance between the
// muzzle's segment, from the holder's line to FLAG_REACH_M along its yaw and pitch, and the body's vertical axis, floor to head)
export const FLAG_BODY_R_M = 0.3, FLAG_REACH_M = 5, FLAG_MS = 300;
export function flag3d(m, x, z, stance = 'stand') {
  if (!m || !m.inHand || SWEEP_SAFE.has(m.posture)) return false;
  const [y0, y1] = SPAN_M[stance] ?? SPAN_M.stand;
  const c = Math.cos(m.pitchRad), u = [Math.cos(m.yawRad) * c, Math.sin(m.pitchRad), Math.sin(m.yawRad) * c];
  const p = [m.ox, m.oy, m.oz], q = [x, y0, z], v = [0, y1 - y0, 0];
  // (segment p + s u, s in [0, reach]; segment q + t v, t in [0, 1]: the closest pair by clamped projection)
  const w = [p[0] - q[0], p[1] - q[1], p[2] - q[2]], a = FLAG_REACH_M * FLAG_REACH_M, b = FLAG_REACH_M * u[1] * v[1], cc = v[1] * v[1];
  const dd = FLAG_REACH_M * (u[0] * w[0] + u[1] * w[1] + u[2] * w[2]), e = v[1] * w[1], den = a * cc - b * b;
  let s = den > 1e-12 ? (b * e - cc * dd) / den : 0;
  s = Math.max(0, Math.min(1, s));
  let t = (b * s + e) / cc;
  if (t < 0) { t = 0; s = Math.max(0, Math.min(1, -dd / a)); } else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (b - dd) / a)); }
  const P1 = [p[0] + u[0] * FLAG_REACH_M * s, p[1] + u[1] * FLAG_REACH_M * s, p[2] + u[2] * FLAG_REACH_M * s], Q1 = [q[0], q[1] + v[1] * t, q[2]];
  // (ahead of the muzzle only: a body behind the holder is never in his line)
  return s > 0 && Math.hypot(P1[0] - Q1[0], P1[1] - Q1[1], P1[2] - Q1[2]) <= FLAG_BODY_R_M;
}

/** The bot by its name (honest, keys, fuzz, stoppage). */
export function botOf(kind, { seed = 1, answer = null } = {}) {
  if (kind === 'keys') return houseKeysBot();
  if (kind === 'fuzz') return houseFuzzBot({ seed });
  if (kind === 'stoppage') return stoppageBot({ answer });
  return houseHonestBot();
}

/**
 * One lane watched (see the header): a record of every criterion's raw numbers for gaugeOf. Options: tier, seed, bot ('honest',
 * 'keys', 'fuzz', 'stoppage'), answer (the stoppage bot's), setup ('go'; null from the fill), maxMs, more(game, ctx) after
 * each tick's watch (F23's saves).
 */
export function flawlessLane({ tier, seed, bot = 'honest', answer = null, setup = 'go', maxMs = 15 * 60_000, more = null }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, ...(setup ? { setup } : {}) }), s0 = g.state;
  const pid = s0.player.id, H0 = s0.armoury.range.house, twoPid = H0.twoPid, rung = RUNG_OF_TIER[tier] ?? 0, lane = lanePlanOf(s0);
  const doorPlans = lane.order.map((door, k) => ({ k, door, P: lane.plans[door] })).filter(x => x.P?.door);
  const rec = {
    tier, seed, bot, answer, rung, done: false, err: null, end: null, laneS: null, legS: [],
    wall: { worstM: 0, who: null, at: null, src: null, what: null, over: 0, offFloor: 0 },
    gap: { minM: Infinity, underMs: 0 },
    door: { stopMs: [0, 0, 0, 0], faults: 0, chosenMs: 0, keysMs: 0, runMs: 0, longestMs: 0, twoMs: 0, twoRunMs: 0, twoLongestMs: 0, endsIn: 0, endsWhat: [] },
    firstOut: [], feet: { legs: {} }, corners: { faults: 0, clears: 0, uncovered: 0, by: {} },
    faults: {}, evidence: {}, engaged: [], pars: { held: PAR_HELD[tier] ?? null, set: H0.par, missed: [] },
    stops: [], stalls: 0, names: [], two: { stackM: [], handbacks: 0 },
    anim: { moveTicks: 0, idle: 0, tweenBad: 0, tweenMaxM: 0, figIdle: 0, figStride: 0, chief: { moveTicks: 0, idle: 0, tweenBad: 0, figIdle: 0 } }, paths: new Map(),
    card: [], mem: null,
  };
  const prev = { ms: s0.clock.ms, me: null, two: null, chief: null, choosing: false, stop: null, step: null, presses: 0, hist: [] };
  const firstBy = {}, firstMine = {}, rifleId = s0.people[pid]?.kit?.worn?.sling ?? null, endsSeen = new Set();
  const feetLeg = {}, stackSeen = {}, unseenAt = new Set(), twoUnseenAt = new Set(), missAt = {};
  const each = (game) => {
    const st = game.state, H = st.armoury.range.house, R = st.armoury.range, now = st.clock.ms, dt = now - prev.ms;
    const onLane = H.goAtMs !== null && !H.end;
    const me = st.actors.list.find(a => a.who === pid), two = twoPid ? st.actors.list.find(a => a.who === twoPid) : null;
    const S = st.stop, mem = me?.bot ?? {};
    const facts = { shot: game.facts('shot'), house: game.facts('house'), bundle: game.facts('bundle'), say: game.facts('say') };
    // (F10: a man whose hands your pause could not see (the identification 'unseen': the challenge doctrine owes him, COMBAT
    // §25.4.6), kept, so his par is set apart as the dummy's man is)
    for (const f of game.facts('contact')) if (f.phase === 'pause' && f.who === pid) { const last = contactNow(st)?.last; for (const k of f.ids ?? []) if (last?.ident?.[k] === 'unseen') unseenAt.add(k); }
    // (a round of either of you on a man that missed him (no zone: the row's odds, as scored), the first such kept, for F10)
    for (const f of facts.shot) if (f.fired && f.target && (f.zone === null || f.zone === undefined)) { const by = f.who === pid ? 'me' : f.who === twoPid ? 'two' : null; if (by) missAt[`${by}|${f.target}`] ??= f.atMs; }
    // (and your #2's: his identification failed, he looks again after CHALLENGE_MS (shoothouse.js twoTick), the window lengthened)
    { const c = st.armoury?.range?.house?.two?.contact; if (c?.key && c.untilMs > c.seenMs + c.ms) twoUnseenAt.add(c.key); }
    // ---- the shots (every tick: the fuzz's evidence and F9 read them) ----
    for (const f of facts.shot) {
      if (!f.fired || !f.target) continue;
      const by = f.who === pid ? 'me' : f.who === twoPid ? 'two' : 'other';
      firstBy[f.target] ??= by;
      if (by === 'me' && firstMine[f.target] === undefined && me) {
        const T = R.turners.find(t => t.key === f.target), L = T ? [...H.rooms, H.hall][legOfStand(T.stand)] : null, P = L ? lane.plans[L.door] : null;
        firstMine[f.target] = true;
        if (P?.door) rec.firstOut.push({ key: f.target, stand: T.stand, pastM: r3(acrossM(P, me.x, me.z) - THRESHOLD_M), funnel: inFunnel(P, me.x, me.z) });
      }
    }
    // ---- F20: from the dummy's click, your next round and your first on the man you had bracketed ----
    if (H.dummy?.clickAtMs !== null && H.dummy?.clickAtMs !== undefined && !rec.afterClick) {
      const ro = rollerOf(st, pid), pistol = st.people[pid]?.kit?.worn?.holster ? st.items[st.people[pid].kit.worn.holster] : null;
      rec.afterClick = { atMs: H.dummy.clickAtMs, man: S?.pick ?? null, nextMs: null, manMs: null, pistol: false,
        trFormulaMs: pistol ? actionMs(ro, st.items[rifleId], 'hang') + actionMs(ro, pistol, 'draw:thigh') : null };
    }
    // (the rework's R6: the answer's own measures (see the header))
    if (rec.afterClick) {
      const A = rec.afterClick, d = S?.doing;
      if (d?.step === 'weapon:transition' && A.trFromMs === undefined) A.trFromMs = d.fromMs;
      if (A.trFromMs !== undefined && A.drawnMs === undefined && S?.gun && S.gun !== rifleId) A.drawnMs = now;
      if (A.drawnMs !== undefined && A.pRowMs === undefined && d?.kind === 'shot' && S.gun !== rifleId) A.pRowMs = d.fromMs;
      if (d?.step === 'weapon:gun-down') { A.gd = true; const i = d.list.indexOf('stance:stand'); if (i >= 0 && d.i === i && A.standMs === undefined) A.standMs = d.subFromMs; }
      for (const f of facts.say) {
        if (f.who === pid && f.text === 'Gun up!' && A.gunUpMs === undefined) A.gunUpMs = now;
        if (f.who === twoPid && f.text === 'Up.' && A.gunUpMs !== undefined && A.upMs === undefined) A.upMs = now;
      }
      // (his round on the man you had bracketed while you are down: taken by him)
      if (A.gd && A.man && A.standMs === undefined) for (const f of facts.shot) if (f.who === twoPid && f.fired && f.target === A.man) A.twoTook = true;
      // (his identification of the man failed and he challenges him (shoothouse.js twoTick: CHALLENGE_MS, COMBAT §25.4.6, never a round
      // at a man whose weapon he has not seen): not his to take while it lasts (the rework's R8b: one sergeant's lane of 100, 1740)
      if (A.gd && A.man && A.standMs === undefined && H.two?.contact?.key === A.man && H.two.contact.untilMs > H.two.contact.seenMs + H.two.contact.ms) A.twoChallenged = true;
      // (his take-in on your man under way: dropped when your rifle came back first, the man yours again by the rule (shoothouse.js
      // coverTick: "a man of yours he had not fired on yet is yours again"))
      if (A.gd && A.man && A.standMs === undefined && H.two?.contact?.key === A.man) A.twoOn = true;
      // (he can see him and is on nobody else: a man of his own sector he is on comes first (his take-in, his row); the rework's
      // R9, 2026-11-13: the corporal's lane 2295, his own 1b on him through your Gun down, read as seen and not taken)
      const busyElse = (H.two?.contact && H.two.contact.key !== A.man) || (H.two?.eng && H.two.eng.key !== A.man);
      if (A.gd && A.man && A.standMs === undefined && two && !A.twoSaw && !busyElse) {
        const T = R.turners.find(t => t.key === A.man), fk = T ? facingOf(T, now) : 0;
        if (T && T.stoppedAtMs === null && THREAT_FACES.includes(T.face) && fk >= SEEN && q(sightOf(st, two, { x: T.x, z: T.z }, now).vis * fk, 1e-6) >= SEEN) {
          A.twoSaw = true;
          const W = H.two;
          A.sawState = { atMs: now - A.atMs, cover: !!W.cover, owed: W.coverOwed ?? null, eng: W.eng?.key ?? null, contact: W.contact?.key ?? null, known: W.known?.[A.man] !== undefined, walking: !!W.doing?.beats?.some(b => b.st === 'run' && b.k === 'move'), slot: T.slot, leg: H.cur, stand: T.stand };
        }
      }
    }
    if (rec.afterClick) for (const f of facts.shot) {
      if (!f.fired || f.who !== pid || f.atMs <= rec.afterClick.atMs) continue;
      if (rec.afterClick.nextMs === null) { rec.afterClick.nextMs = f.atMs - rec.afterClick.atMs; rec.afterClick.pistol = f.gun !== rifleId; rec.afterClick.roundMs = f.atMs; }
      if (rec.afterClick.manMs === null && f.target && f.target === rec.afterClick.man) rec.afterClick.manMs = f.atMs - rec.afterClick.atMs;
    }
    if (onLane && me) {
      const legs = [...H.rooms, H.hall], L = legs[H.cur] ?? null, P = L ? lane.plans[L.door] : null;
      // ---- F1: the bodies against the walls and the closed leaves ----
      for (const [who, a, d] of [['#1', me, S?.doing], ['#2', two, H.two?.doing]]) {
        if (!a) continue;
        const o = overlapOf(st, a.x, a.z, now);
        if (o.m > WALL_TOL_M) rec.wall.over++;
        if (!onFloor(geoOf().G, a.x, a.z)) rec.wall.offFloor++;
        if (o.m > rec.wall.worstM) {
          const mv = d?.beats?.find(b => b.st === 'run' && b.k === 'move');
          Object.assign(rec.wall, { worstM: r3(o.m), who, at: [r3(a.x), r3(a.z)], what: o.what, src: d ? `${d.step}${mv ? `/${mv.key}` : ''}` : who === '#1' ? 'keys' : 'idle' });
        }
        // (F3: every move beat's path seen, once)
        for (const b of d?.beats ?? []) if (b.k === 'move' && b.path && b.st === 'run') { const k = JSON.stringify(b.path); if (!rec.paths.has(k)) rec.paths.set(k, { path: b.path, who, step: d.step, key: b.key }); }
      }
      // ---- F17: the #2's distance to his stack the first tick you stand on yours (STACK_AT_M), a door's leg ----
      // (a leg that began with you already on its stack (the stall passed the last room while the fuzz stood here): the #2 is
      // told only as it begins, so he is measured TWO_WAIT_MS on, his wait at a door (bundle.js), not on the leg's first tick
      // (the rework's R9, 2026-11-13: the sergeant's fuzz lane on the user's seed, room 2 passed under you at room 3's stack,
      // his 4.04 m read the tick the leg began))
      const onStack = !!P?.stack && d2(me.x, me.z, P.stack[0][0], P.stack[0][1]) <= STACK_AT_M;
      if (stackSeen[`from${H.cur}`] === undefined) stackSeen[`from${H.cur}`] = onStack ? now : null;
      const early = stackSeen[`from${H.cur}`] !== null && now - stackSeen[`from${H.cur}`] < TWO_WAIT_MS;
      if (two && P?.door && P.stack?.[1] && !stackSeen[H.cur] && onStack && !early) {
        stackSeen[H.cur] = true;
        rec.two.stackM.push(r3(d2(two.x, two.z, P.stack[1][0], P.stack[1][1])));
      }
      // ---- F2: the two bodies ----
      if (two) {
        const m = d2(me.x, me.z, two.x, two.z);
        if (m < rec.gap.minM) rec.gap.minM = m;
        if (m < BODY_GAP_M) rec.gap.underMs += Math.max(dt, 0);
      }
      const feetRow = FEET_ROWS.test(String(S?.doing?.step ?? ''));
      const v = prev.me && dt > 0 ? d2(me.x, me.z, prev.me[0], prev.me[1]) / (dt / 1000) : null;
      // ---- F4: the feet in a doorway (the game's; a step standing by the player's choice, and the rest it leaves, apart) ----
      // (the doorway live: a funnel while its door stands open (zones.js liveZoneAt); out of stop motion with no window and no carry
      // the feet are the keys', the player's own (a walk pressed into a jamb), counted apart (keysMs) as a choice is)
      const keys = !S && !st.mind?.contact?.pending && !me.through;
      const chosen = feetRow || standsStill(S?.doing?.step) || !!S?.doing?.still || !!S?.feet?.still || !!me.stance;
      const Z = liveZoneAt(st, AREA, me.x, me.z), inDoor = !!Z;
      if (v !== null && dt > 0) {
        if (inDoor && v < STILL_MS && (chosen || keys)) prev.parked = true;
        else if (!inDoor || v >= STILL_MS) prev.parked = false;
        if (inDoor && v < STILL_MS) {
          if (keys) rec.door.keysMs += dt;
          else if (chosen || prev.parked) rec.door.chosenMs += dt;
          else { const D = doorPlans.find(x => x.P.door === Z.door); if (D) rec.door.stopMs[D.k] += dt; rec.door.runMs += dt; rec.door.longestMs = Math.max(rec.door.longestMs, rec.door.runMs); }
        }
        if (!(inDoor && v < STILL_MS && !keys && !chosen && !prev.parked)) rec.door.runMs = 0;
      }
      // (the #2's still ticks in a doorway: whatever holds him, and his longest at once)
      if (two && prev.two && dt > 0) {
        if (d2(two.x, two.z, prev.two[0], prev.two[1]) / (dt / 1000) < STILL_MS && liveZoneAt(st, AREA, two.x, two.z)) { rec.door.twoMs += dt; rec.door.twoRunMs += dt; rec.door.twoLongestMs = Math.max(rec.door.twoLongestMs, rec.door.twoRunMs); }
        else rec.door.twoRunMs = 0;
      }
      // (every move a body is given, seen once: its end clear of every zone)
      for (const [who, mv] of [['#1', moveNow(st, pid)], ['#2', H.two?.doing?.beats?.find(b => b.st === 'run' && b.k === 'move' && b.prof) ?? two?.through ?? null]]) {
        const end = mv?.path?.at(-1);
        if (!end) continue;
        const k = `${who}|${mv.fromMs}|${end[0]},${end[1]}`;
        if (endsSeen.has(k)) continue;
        endsSeen.add(k);
        if (zoneAt(AREA, end[0], end[1])) { rec.door.endsIn++; if (rec.door.endsWhat.length < 4) rec.door.endsWhat.push(`${who} ${mv.id ?? mv.key} → ${JSON.stringify(end)}`); }
      }
      // ---- F6: the feet from the stack to the point ----
      if (P?.door && v !== null) {
        const f = feetLeg[H.cur] ??= { st: 'stack', minV: Infinity, underMs: 0 };
        if (f.st === 'stack' && ['stacked', 'open', 'entered'].includes(L.state) && d2(me.x, me.z, P.stack[0][0], P.stack[0][1]) > STACK_LEAVE_M) f.st = 'flow';
        // (a tick within STACK_LEAVE_M of the stack is at the stack, not between it and the point: from rung 3 the approach flows
        // into the entry and the leg reads 'open' while the body is still coming in, so a hand on a slow door held him there,
        // 0.15 m from his stack, and counted (the rework's R9, 2026-11-13: 5 of the sergeant's 300 rooms, 0.25 s each))
        if (f.st === 'flow') {
          if (d2(me.x, me.z, P.points[0][0], P.points[0][1]) <= POINT_AT_M) f.st = 'done';
          else if (!feetRow && d2(me.x, me.z, P.stack[0][0], P.stack[0][1]) > STACK_LEAVE_M) { f.minV = Math.min(f.minV, v); if (v < STILL_MS) f.underMs += dt; }
        }
      }
      // ---- F8's evidence: the funnel's and the flag's recent ticks ----
      if (dt > 0) {
        prev.hist.push({ ms: now, funnel: !!P?.door && inFunnel(P, me.x, me.z), slow: v !== null && v < STILL_MS, flag: !!two && flag3d(muzzleOf(st, pid), two.x, two.z, two.stance ?? 'stand') });
        if (prev.hist.length > 40) prev.hist.shift();
      }
      // ---- F19: the #2 animated ----
      if (two && prev.two && dt > 0) {
        const moved = d2(two.x, two.z, prev.two[0], prev.two[1]);
        if (moved > 1e-6) {
          rec.anim.moveTicks++;
          if (!two.gait || two.gait === 'idle') rec.anim.idle++;
          const err = d2(two.$px ?? two.x, two.$pz ?? two.z, prev.two[0], prev.two[1]);
          if (err > 1e-6) { rec.anim.tweenBad++; rec.anim.tweenMaxM = Math.max(rec.anim.tweenMaxM, r3(err)); }
          const f = figureOf(st, two, now);
          if (f.gait === 'idle') rec.anim.figIdle++;
          if (f.strideM !== two.strideM) rec.anim.figStride++;
        }
      }
      // (the instructor's the same, on his catwalk; his first placement there a jump, drawn as one)
      const chief = H.chiefPid ? st.actors.list.find(a => a.who === H.chiefPid) : null;
      if (chief && prev.chief && dt > 0) {
        const moved = d2(chief.x, chief.z, prev.chief[0], prev.chief[1]), C = rec.anim.chief;
        if (moved > 1e-6 && moved < 1.5) {
          C.moveTicks++;
          if (!chief.gait || chief.gait === 'idle') C.idle++;
          if (d2(chief.$px ?? chief.x, chief.$pz ?? chief.z, prev.chief[0], prev.chief[1]) > 1e-6) C.tweenBad++;
          if (figureOf(st, chief, now).gait === 'idle') C.figIdle++;
        }
      }
      if (chief) prev.chief = [chief.x, chief.z];
      // ---- the stops (F11 to F13, F16, F24) ----
      // (a choice while a take-in window is open is not yet a stop: the window's own time runs (contact.js contactInput lets the
      // clock go on to the pause, the DI silent through a take-in) and the pause that ends it is the stop, with its line (the
      // rework's R9, 2026-11-13: F24's 61 "no line" stops of 400 lanes were each such a tick, the pause after it carrying its line))
      const choosing = !!S && ((S.mode === 'stop' && S.phase === 'choose') || !!S.reflex) && !contactNow(st)?.pending;
      if (prev.stop && prev.choosing) prev.stop.presses += (mem.presses ?? 0) - prev.presses;
      if (choosing && !prev.choosing) {
        const line = instinctNow(st).line, steps = stepsOf(st), stop = { leg: H.cur, atS: r3((now - H.goAtMs) / 1000), line: line?.id ?? null, act: line?.act ?? null, why: whyOf(game, st, pid, prev), presses: 0 };
        // (F24: T's act on the panel, live, struck or absent, and its page; a shot line's named row)
        // (a reflex card's answer is live where the card offers it (the rework's R4: cqb-stoppage's act is the card's first answer))
        if (line?.act?.startsWith('stop:reflex:')) { stop.actRow = (S.reflex?.options ?? []).some(o => `stop:reflex:${o.key}` === line.act) ? 'live' : 'absent'; stop.actPage = 0; }
        else if (line?.act?.startsWith('stop:')) {
          const id = line.act.slice(5), row = steps.find(x => x.id === id) ?? steps.find(x => x.id === id.split('>')[0]);
          stop.actRow = !row ? 'absent' : row.off ? 'struck' : 'live';
          stop.actPage = row ? pageOf(steps, row.id) : null;
          // (R7: the act's row on the grouped panel, VIEWS §7.8: its keys by its own place in each layout, pressed and reaching it)
          if (row) { const m = modelOf(steps, { act: line.act }); stop.keys = {}; for (const L of LAYOUTS) { const pth = keyPathOf(m, L, row.id, { next: false }), r = pth ? resolvePath(m, L, pth) : null; stop.keys[L] = pth && r?.id === row.id ? pth.length : null; } stop.onNext = LAYOUTS.every(L => keyPathOf(m, L, row.id)?.length === 1); }
        } else if (line?.act) stop.actRow = 'not a row';
        else if (line && SHOT_LINES.has(line.id)) stop.actRow = steps.some(x => (x.kind === 'shot' || x.id === 'fire') && !x.off) ? 'names a live shot' : 'names a struck shot';
        else stop.actRow = line ? 'names nothing' : 'no line';
        // (F12: "Carry on" right after a shot row, nobody of the room up and facing)
        const shotBefore = /^(shot:|fire$)/.test(String(prev.step ?? ''));
        const up = R.turners.some(T => T.room === L?.room && THREAT_FACES.includes(T.face) && T.stoppedAtMs === null && T.turnAtMs !== null && T.turnAtMs <= now);
        stop.carryAfterShot = shotBefore && !up && (line?.id === 'cqb-carryon' || line?.act === 'stop:drill:carry');
        // (F16: a row, the line or its act naming a lane or a house)
        for (const x of steps) if (LANE_WORDS.test(String(x.label ?? '')) || /(^|[:>])house[:>]/.test(String(x.id))) addName(rec, `row ${x.id} "${x.label ?? ''}"`);
        if (line && (LANE_WORDS.test(String(line.text ?? '')) || /house/.test(String(line.act ?? '')))) addName(rec, `line ${line.id} "${line.text}"${line.act ? ` (${line.act})` : ''}`);
        rec.stops.push(stop);
        prev.stop = stop;
      }
      if (!choosing && prev.choosing) prev.stop = null;
      prev.choosing = choosing;
      prev.presses = mem.presses ?? 0;
      if (S?.doing?.step) prev.step = S.doing.step;
    }
    // ---- the house's facts: faults (F7, F8), clears (F7), stacked (F17), stalls (F14) ----
    for (const f of facts.house) {
      if (f.phase === 'fault') {
        rec.faults[f.kind] = (rec.faults[f.kind] ?? 0) + 1;
        if (f.kind === 'corner') rec.corners.faults++;
        if (f.kind === 'funnel') rec.door.faults++;
        const ev = faultEvidence(st, f, prev.hist, facts.shot, pid);
        const e = rec.evidence[f.kind] ??= { n: 0, ok: 0, how: ev.how };
        e.n++; if (ev.ok) e.ok++;
      }
      if (f.phase === 'stall') rec.stalls++;
      if (f.phase === 'clear') {
        const k = [...H.rooms, H.hall].findIndex(V => V.room === f.room), L = [...H.rooms, H.hall][k], P = L ? lane.plans[L.door] : null;
        rec.corners.clears++;
        for (const h of P?.hot ?? []) { const by = L.covered?.[h.id]?.by ?? 'none'; rec.corners.by[by] = (rec.corners.by[by] ?? 0) + 1; if (by === 'none') rec.corners.uncovered++; }
      }
    }
    for (const f of facts.bundle) if (f.who === pid && f.phase === 'halt' && f.why === 'two') rec.two.handbacks++;
    if (me) prev.me = [me.x, me.z];
    if (two) prev.two = [two.x, two.z];
    prev.ms = now;
    more?.(game, { rec, choosing: prev.choosing, onLane });
  };
  let r = null;
  try { r = runHouse(g, botOf(bot, { seed, answer }), { maxMs, each }); } catch (e) { rec.err = String(e?.message ?? e).slice(0, 300); }
  const st = g.state, H = st.armoury.range.house, R = st.armoury.range, N = houseNow(st);
  rec.done = !!r?.done && !rec.err;
  rec.end = H.end?.why ?? null; rec.rangeEnd = R.end?.phase ?? null;
  rec.laneS = N.timerMs === null ? null : N.timerMs / 1000;
  rec.legS = N.legs.map(V => (V.ms === null ? null : V.ms / 1000));
  rec.legState = N.legs.map(V => V.state);
  rec.mem = r?.mem ?? (st.actors.list.find(a => a.who === pid)?.bot ?? {});
  rec.feet.legs = Object.fromEntries(Object.entries(feetLeg).map(([k, f]) => [k, { st: f.st, minV: Number.isFinite(f.minV) ? r3(f.minV) : null, underMs: f.underMs }]));
  rec.gap.minM = Number.isFinite(rec.gap.minM) ? r3(rec.gap.minM) : null;
  // (the body gap's guard on the #2's walks (bundle.js gapHold): its holds, their ms and the longest run)
  rec.gap.guard = { holds: H.two?.gap?.holds ?? 0, ms: H.two?.gap?.ms ?? 0, maxMs: H.two?.gap?.maxMs ?? 0 };
  // (F9: each threat's first round by whom against his slot; F10: the pars missed)
  for (const T of R.turners) {
    if (!THREAT_FACES.includes(T.face)) continue;
    // (a man of yours your #2 took while he covered your rifle down (shoothouse.js twoCover, H.two.covered) is his by the rule: "or by #2 for #1's while #1 is gun down")
    rec.engaged.push({ stand: T.stand, slot: slotOf(T.stand), by: firstBy[T.key] ?? null, up: T.stoppedAtMs === null, covered: (H.two?.covered ?? []).includes(T.key) });
  }
  for (const V of N.legs) for (const c of V.contacts) if (c.parMet === false) {
    const jam = N.dummy.clickAtMs !== null && N.dummy.clickAtMs >= c.seenMs && N.dummy.clickAtMs <= c.seenMs + PAR_JAM_MS;
    const m = missAt[`${c.by}|${c.key}`];
    rec.pars.missed.push({ stand: c.stand, by: c.by, jam, challenged: (c.by === 'me' && unseenAt.has(c.key)) || (c.by === 'two' && twoUnseenAt.has(c.key)), missedRound: m !== undefined && m <= c.seenMs + H.parMs });
  }
  rec.dummy = { ...N.dummy };
  rec.card = N.summary;
  return rec;
}

// (why a stop came: the reflex, the contact's pause, a halt, a bundle's end or a single's (the audit's classes))
function whyOf(game, st, pid, prev) {
  const S = st.stop;
  if (S?.reflex) return `reflex:${S.reflex.why}`;
  const bf = game.facts('bundle'), cf = game.facts('contact');
  if (cf.some(f => f.phase === 'pause')) return 'contact';
  const halt = bf.find(f => f.who === pid && (f.phase === 'halt' || f.phase === 'seam'));
  if (halt) return `halt:${halt.why ?? halt.phase}`;
  const end = bf.find(f => f.who === pid && f.phase === 'end');
  if (end) return `end:${String(end.id).replace(/>.*$/, '')}`;
  if (prev.step) return `after:${String(prev.step).replace(/[>@].*$/, '')}`;
  return 'GO';
}
// (the page a row sits on, 0 the first; -1 off every page)
function pageOf(steps, id) {
  const pn = panelOf(steps);
  for (let k = 0; k < pn.pages; k++) if (panelOf(steps, { page: k }).slots.some(sl => sl.step.id === id)) return k;
  return -1;
}
const addName = (rec, w) => { if (!rec.names.includes(w) && rec.names.length < 12) rec.names.push(w); };

/**
 * A fault's evidence, recomputed here from the bodies and the shots, never from the scene's own rule (F8's fuzz): { ok, how }.
 * funnel: every one of the last FUNNEL_FAULT_MS of lived ticks in the door's funnel with the feet under 0.3 m/s; muzzle: the
 * 3-D capsule (flag3d) met on every one of the last FLAG_MS; noshoot and hostage: a round of yours on such a face this
 * tick; the rest read the scene's record ('record'), not recomputed.
 */
export function faultEvidence(state, f, hist, shots, pid) {
  const lived = (ms) => hist.filter(h => h.ms > state.clock.ms - ms);
  if (f.kind === 'funnel') { const h = lived(FUNNEL_FAULT_MS); return { ok: h.length >= Math.floor(FUNNEL_FAULT_MS / TICK_MS) - 1 && h.every(x => x.funnel && x.slow), how: 'feet' }; }
  if (f.kind === 'muzzle') { const h = lived(FLAG_MS); return { ok: h.length >= Math.floor(FLAG_MS / TICK_MS) - 1 && h.every(x => x.flag), how: '3-D capsule' }; }
  if (f.kind === 'noshoot' || f.kind === 'hostage') {
    const R = state.armoury.range, faces = new Set(shots.filter(s => s.fired && s.who === pid && s.target).map(s => R.turners.find(t => t.key === s.target)?.face));
    return { ok: faces.has(f.kind), how: 'the round' };
  }
  return { ok: true, how: 'record' };
}

// ---- the static checks ----

/** F3, the data: every authored path, far leg and (given) seen move path, leg by leg clear on the C0 grid with the doors open: { legs, cut: [{ what, from, to }] }. */
export function flawlessPaths(seen = []) {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), lane = lanePlanOf(g.state), G = openNavOf(lane.area, ROUTE_CLS);
  const out = { legs: 0, cut: [], routedCut: 0, wallStart: 0 };
  const cellBlocked = (x, z) => { const i = Math.floor((x - G.x0) / G.cellM), j = Math.floor((z - G.z0) / G.cellM); return i < 0 || j < 0 || i >= G.nx || j >= G.nz || G.cost[j * G.nx + i] === NAV_BLOCKED; };
  const check = (what, path, seen = false) => {
    for (let i = 1; i < path.length; i++) {
      out.legs++;
      if (clearLine(G, path[i - 1][0], path[i - 1][1], path[i][0], path[i][1])) continue;
      // (the grid's 0.25 m cells are stricter than the walker's circle: whether the walker's own rule breaks too, at 0.01 m steps)
      const [a, b] = [path[i - 1], path[i]], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.01));
      let walker = false;
      for (let k = 0; k <= n && !walker; k++) walker = !standOk(G, a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n);
      // (a move seen in a lane starts where the body stands, and a body the keys pressed against a wall stands, by the walker's
      // circle (F1 holds it), in a cell the 0.25 m grid blocks, so no line from it is clear on the grid: such a first leg is
      // judged by the walker's own rule and counted apart (the rework's R9, 2026-11-13: 32 legs of the keys' and the fuzz's
      // lanes, every one walkable, from z 19.05 m against room 2's south wall))
      if (seen && i === 1 && cellBlocked(a[0], a[1]) && standOk(G, a[0], a[1]) && !walker) { out.wallStart++; continue; }
      out.cut.push({ what, from: a.map(r3), to: b.map(r3), walker });
    }
  };
  for (const door of lane.order) {
    const P = lane.plans[door], name = door === 'hall' ? 'hall' : door.split(':').at(-1);
    for (const [slot, path] of Object.entries(P.paths ?? {})) check(`${name} paths[${slot}]`, path);
    if (P.far?.path) check(`${name} far`, P.far.path);
  }
  for (const s of seen) check(`${s.who} ${String(s.step).replace(/>.*$/, '')}/${s.key}`, s.path, true);
  return out;
}
/** F16, the catalogue: every bundle's id and label naming a lane or a house. */
export function flawlessNames() {
  return BUNDLES.filter(b => /(^|:)house(:|$)/.test(b.id) || LANE_WORDS.test(String(b.label ?? '')) || LANE_WORDS.test(String(b.short ?? ''))).map(b => `${b.id} "${b.label ?? ''}"`);
}

// ---- F18, F20, F22, F23 ----

/** The #2's condition after each tower command, from the fill (F18): [{ cmd, before, metMs, steps }] a lane. */
export function flawlessAdmin({ tier, seed }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier }), pid = g.state.player.id, twoPid = g.state.armoury.range.house.twoPid, out = [];
  let cur = null;
  // (his rifle as it is (firearms.js gunField: a default is written as absent), his carry, and his macro's end: a condition is
  // met once his macro for the command is done (or none was owed) and the rifle is as the command wants it)
  const cond = (st) => { const gun = st.items[st.people[twoPid]?.kit?.worn?.sling], c = st.people[twoPid]?.kit?.carry ?? {}; return gun ? { mag: !!gun.mag, chamber: gunField(gun, 'chamber') ?? 'empty', mode: gunField(gun, 'mode') ?? null, low: c.posture === 'lowReady', finger: c.finger ?? 'off', busy: !!st.armoury.range.house.two?.doing && !st.armoury.range.house.two.doing.beats, shown: !!st.armoury.range.house.two?.shown } : null; };
  // ("already so" at a command is his rifle there before it: v0.0.12's fill loaded him, so LOAD and MAKE READY found him done)
  const met = (cmd, c) => !!c && !c.busy && (cmd === 'load' ? c.mag : cmd === 'ready' ? c.mag && c.chamber === 'live' && c.mode === 'safe' && c.low : cmd === 'clear' ? !c.mag && c.chamber === 'empty' && c.shown : cmd === 'stop' ? c.mode === 'safe' && c.finger === 'off' && c.low : true);
  const r = runHouse(g, houseHonestBot(), { maxMs: 15 * 60_000, each: (game) => {
    const st = game.state, R = st.armoury.range, cmd = R.cmd?.id ?? null, H = st.armoury.range.house;
    if (cmd !== cur?.cmd || R.cmd?.atMs !== cur?.atMs) {
      cur = ['load', 'ready', 'clear', 'stop'].includes(cmd) ? { cmd, atMs: R.cmd.atMs, before: met(cmd, cond(st)) && cmd !== 'stop', metMs: null, steps: [], planMs: null, startMs: null, list: null, macroList: null } : null;
      if (cur) out.push(cur);
    }
    const d = H.two?.doing;
    if (cur && d && !d.beats && d.cmd === cur.cmd && cur.planMs === null) { cur.planMs = d.planMs; cur.startMs = d.fromMs - cur.atMs; cur.macroList = subsOf(d.macro, beliefOf(st, st.people[twoPid].kit.worn.sling)); cur.$d = d; }
    // (his list and his sub-steps' times as lived, fumbles included (the doing's record, read to its end))
    if (cur?.$d) { cur.list = [...cur.$d.list.slice(0, cur.$d.i + 1)]; cur.livedMs = cur.$d.subs.reduce((t, x) => t + x.ms, 0); }
    if (cur && cur.metMs === null && met(cur.cmd, cond(st))) cur.metMs = st.clock.ms - cur.atMs;
    const step = d?.step ?? null;
    if (cur && step && !cur.steps.includes(step)) cur.steps.push(step);
    // (his sub-steps as the stage reads them (shoothouse.js handsOf), each in the macro's order)
    const h = handsOf(st, twoPid);
    if (cur && h?.action && cur.steps.at(-1) !== `${h.step}>${h.action}#${h.i}`) cur.steps.push(`${h.step}>${h.action}#${h.i}`);
  } });
  for (const c of out) delete c.$d;
  return { tier, seed, done: r.done, cmds: out, mem: r.mem, pid };
}

/** The reference room by the honest bot (F22): room 1 to your own "Clear!" (the beat's start plus the call), s, as scene-shoothouse measures it. */
export function refRoom({ tier = 'tierone', seed = 48213 } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'ref' }), pid = g.state.player.id, ready = {};
  runHouse(g, houseHonestBot(), { maxMs: 10 * 60_000, each: (game) => {
    const cur = game.state.armoury.range.house?.cur ?? null;
    for (const f of game.facts('bundle')) if (f.who === pid && f.phase === 'beat' && /(^|:)clear$/.test(f.beat ?? '') && cur !== null) ready[cur] ??= f.atMs;
  } });
  const N = houseNow(g.state), V = N.legs[0], callMs = (RUNG_OF_TIER[tier] >= 3 ? CALL_FLOW_S : CALL_S) * 1000;
  const own = Number.isFinite(ready[0]) ? Math.min(V.ms, ready[0] - N.goAtMs + callMs) : V.ms;
  return { tier, seed, ownS: own === null ? null : own / 1000, roomS: V.ms === null ? null : V.ms / 1000, state: V.state };
}

/** Determinism (F23): the honest bot's lane, a save at every stop on the lane (and SUSPEND_SAVES ticks inside a suspended flow), each loaded and carried on to the card, byte for byte against the unbroken run every CHECK_EVERY ticks. */
export const CHECK_EVERY = 20, SUSPEND_SAVES = 3;
export function saveRun({ tier = 'tierone', seed }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }), digests = [], saves = [];
  let tick = 0, suspended = 0;
  const bot = houseHonestBot();
  while (!houseNow(g.state)?.rangeEnd && tick < 40_000) {
    const S = g.state.stop, H = g.state.armoury.range.house, onLane = H.goAtMs !== null && !H.end;
    const choosing = !!S && ((S.mode === 'stop' && S.phase === 'choose') || !!S.reflex);
    // (the DI's line on the screen at the save is the page's, runtime ($instinct, never saved): the twin is given it, as the
    // hud still shows it, so the honest bot reads the same line on the tick after the load; the sim's state is all from the save)
    const line = () => (g.state.$instinct ? JSON.parse(JSON.stringify(g.state.$instinct)) : null);
    if (onLane && choosing && !g._wasChoosing) saves.push({ tick, why: 'stop', json: g.save(), line: line() });
    // (inside a suspended flow (the rework's R3: state.stop.flow, the bundle suspended at a pause or taken up beside a shot row
    // on the hands): the first SUSPEND_SAVES ticks of it with the flow running beside the step, the hardest state to carry on)
    if (onLane && S?.flow && !S.flow.suspended && suspended < SUSPEND_SAVES) { suspended++; saves.push({ tick, why: 'suspended', json: g.save(), line: line() }); }
    g._wasChoosing = choosing;
    g.step(1, bot); g.clearFacts(); tick++;
    if (tick % CHECK_EVERY === 0) digests[tick] = g.digest();
  }
  const end = tick, last = g.digest(), bad = [];
  for (const sv of saves) {
    const twin = createGame({ scenario: 'test-shoothouse', seed });
    twin.load(sv.json);
    if (sv.line) twin.state.$instinct = sv.line;
    const b = houseHonestBot();
    let k = sv.tick, ok = true;
    while (k < end) {
      twin.step(1, b); twin.clearFacts(); k++;
      if (k % CHECK_EVERY === 0 && digests[k] !== undefined && twin.digest() !== digests[k]) { ok = false; bad.push({ save: sv.tick, why: sv.why, at: k }); break; }
    }
    if (ok && twin.digest() !== last) bad.push({ save: sv.tick, why: sv.why, at: 'end' });
  }
  return { tier, seed, ticks: end, saves: saves.length, suspended, bad };
}

/** The stoppage bot over seeds for one answer (F20): the lanes ended live, the card's keys seen, the times from the click. */
export function stoppageRun({ tier, seeds, answer, stopIfAbsentAfter = 5 }) {
  const out = { tier, answer, lanes: 0, live: 0, offered: 0, clicked: 0, keys: {}, toNextMs: [], toManMs: [], hangs: 0, skipped: false };
  for (const seed of seeds) {
    const rec = flawlessLane({ tier, seed, bot: 'stoppage', answer, setup: 'go' });
    out.lanes++;
    if (rec.done && rec.end !== 'time') out.live++; else out.hangs++;
    const cards = rec.mem?.cards ?? [];
    for (const c of cards) for (const k of c.keys) out.keys[k] = (out.keys[k] ?? 0) + 1;
    if (cards.some(c => c.chose === answer)) out.offered++;
    if (rec.dummy?.clickAtMs !== null && rec.dummy?.clickAtMs !== undefined) out.clicked++;
    const a = rec.afterClick;
    if (a?.nextMs !== null && a?.nextMs !== undefined) out.toNextMs.push(a.nextMs);
    if (a?.manMs !== null && a?.manMs !== undefined) out.toManMs.push(a.manMs);
    if (a?.pistol) out.pistol = (out.pistol ?? 0) + 1;
    // (the rework's R6: the transition's draw against its formula and the pistol's first round against its row; Gun down's stand
    // against his "Up.", and the man you had bracketed taken by your #2 where he could see him)
    if (a?.trFromMs !== undefined && a.drawnMs !== undefined) {
      const T = (out.tr ??= { n: 0, drawMs: [], formulaMs: [], late: 0, roundLate: 0 });
      T.n++; T.drawMs.push(a.drawnMs - a.trFromMs); T.formulaMs.push(a.trFormulaMs);
      if (a.drawnMs - a.trFromMs > a.trFormulaMs * (1 + 0.6) + TICK_MS) T.late++;
      if (a.pistol && a.pRowMs !== undefined && a.roundMs - a.atMs > (a.drawnMs - a.atMs) + (a.roundMs - a.pRowMs) + 100) T.roundLate++;
    }
    if (a?.gd) {
      const G = (out.gd ??= { n: 0, standBeforeUp: 0, noUp: 0, saw: 0, took: 0, challenged: 0 });
      G.n++;
      // (the stand begins at his word's own ms (shoothouse.js coverTick closes the wait there); the say fact is read at the tick's end)
      if (a.standMs !== undefined && a.upMs !== undefined && a.standMs < a.upMs - TICK_MS) G.standBeforeUp++;
      if (a.standMs !== undefined && a.upMs === undefined) G.noUp++;
      if (a.twoSaw && a.twoChallenged && !a.twoTook) G.challenged++;
      else if (a.twoSaw && !a.twoTook && a.twoOn) G.yours = (G.yours ?? 0) + 1;
      else if (a.twoSaw) { G.saw++; if (a.twoTook) G.took++; }
    }
    if (out.lanes >= stopIfAbsentAfter && out.offered === 0) { out.skipped = true; break; }
  }
  return out;
}

// ---- the gauges ----

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const quantile = (xs, p) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };
const tally = (xs) => { const o = {}; for (const x of xs) o[x] = (o[x] ?? 0) + 1; return o; };
const top = (o, n = 6) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} ${v}`).join(', ') || 'none';
const s1 = (v) => (v === null || v === undefined ? '-' : fmt(v, 1)), s2 = (v) => (v === null || v === undefined ? '-' : fmt(v, 2));

/**
 * The lanes summed into one row a criterion: [{ id, name, value, target, met, line }]. Each criterion reads only the lanes it
 * is about (the honest bot's for the T criteria, rung 2 or 3 and up where COMBAT §25.19.8 says).
 */
export function gaugeOf(recs) {
  const rows = [], add = (id, name, met, value, target) => rows.push({ id, name, met: !!met, value, target });
  const honest = recs.filter(r => r.bot === 'honest' && r.rung >= 2), grain = recs.filter(r => r.bot === 'honest' && r.rung < 2), r2up = honest.filter(r => r.rung >= 2), r3up = honest.filter(r => r.rung >= 3), t1 = honest.filter(r => r.tier === 'tierone');
  const n = recs.length;
  // F1
  { const w = recs.reduce((m, r) => (r.wall.worstM > m.wall.worstM ? r : m), recs[0]), over = recs.reduce((a, r) => a + r.wall.over, 0), off = recs.reduce((a, r) => a + r.wall.offFloor, 0);
    add('F1', 'no wall paths', over === 0, `${over} body-ticks over ${WALL_TOL_M} m in ${recs.filter(r => r.wall.over).length} of ${n} lanes; worst ${w.wall.who ? `${s2(w.wall.worstM * 100)} cm (${w.wall.who} at ${JSON.stringify(w.wall.at)} in ${w.wall.what}, ${w.wall.src}; ${w.tier} ${w.seed})` : 'none'}; off the floor ${off}`, `0 over ${WALL_TOL_M} m`); }
  // F2
  { const withTwo = recs.filter(r => r.gap.minM !== null), min = Math.min(...withTwo.map(r => r.gap.minM)), under = withTwo.reduce((a, r) => a + r.gap.underMs, 0), lanes = withTwo.filter(r => r.gap.underMs > 0).length;
    // (the guard should never act with the cue right (COMBAT §25.19.3.4): its holds printed, and an honest lane's held over GUARD_MAX_MS at once is the cue's fault)
    const G = withTwo.map(r => r.gap.guard ?? { holds: 0, ms: 0, maxMs: 0 }), gl = G.filter(g => g.holds > 0).length, gMax = Math.max(0, ...G.map(g => g.maxMs)), hMax = Math.max(0, ...withTwo.filter(r => r.bot === 'honest').map(r => r.gap.guard?.maxMs ?? 0));
    const byBot = Object.entries(tally(withTwo.map(r => r.bot))).map(([b]) => { const m = Math.min(...withTwo.filter(r => r.bot === b).map(r => r.gap.minM)); return `${b} ${s2(m)}`; }).join(', ');
    add('F2', 'no bodies through each other', min >= BODY_GAP_M && hMax <= GUARD_MAX_MS, `least ${s2(min)} m (${byBot}); ${s2(under / 1000 / Math.max(1, withTwo.length))} s a lane under ${BODY_GAP_M} m (${lanes} of ${withTwo.length} lanes); the guard's holds: ${G.reduce((a, g) => a + g.holds, 0)} in ${gl} lanes, ${s2(G.reduce((a, g) => a + g.ms, 0) / 1000)} s, longest ${s2(gMax / 1000)} s (honest ${s2(hMax / 1000)} s)`, `never under ${BODY_GAP_M} m; the guard never over ${GUARD_MAX_MS / 1000} s at once by T`); }
  // F3
  { const seen = new Map(); for (const r of recs) for (const [k, v] of r.paths ?? []) if (!seen.has(k)) seen.set(k, v);
    const o = flawlessPaths([...seen.values()]), authored = o.cut.filter(c => !/^#/.test(c.what)), moved = o.cut.filter(c => /^#/.test(c.what));
    add('F3', 'paths walkable', !o.cut.length, `${o.cut.length} of ${o.legs} legs not clear on the C0 grid: authored ${authored.length}, ${authored.filter(c => c.walker).length} by the walker's rule too (${authored.slice(0, 3).map(c => c.what).join(', ') || 'none'}), the move beats seen ${moved.length} of ${seen.size} paths, ${moved.filter(c => c.walker).length} by the walker's rule too; first legs from a body against a wall, by the walker ${o.wallStart}${moved.length ? ` (${moved.slice(0, 2).map(c => `${c.what} ${JSON.stringify(c.from)}→${JSON.stringify(c.to)}`).join('; ')})` : ''}`, 'all clear'); }
  // F4
  // (the rework's R8b: every sheet and bot, the game's stops apart from the player's chosen ones and his keys'; the honest and the
  // keys bots' lanes held to 0, the fuzz's (random rows and keys, a doorway stood in on purpose) to no stop of the game's longer
  // than FUZZ_DOOR_MS at once, you or your #2)
  { const L = recs.filter(r => r.door), H = L.filter(r => r.bot !== 'fuzz'), F = L.filter(r => r.bot === 'fuzz'), sum = (xs, f) => xs.reduce((a, r) => a + f(r), 0);
    const ms = sum(H, r => r.door.stopMs.reduce((x, y) => x + y, 0)), mine = H.filter(r => !r.door.chosenMs), faults = sum(mine, r => r.door.faults);
    const byRoom = [0, 1, 2].map(k => s2(sum(H, r => r.door.stopMs[k]) / 1000 / Math.max(1, H.length))), two = sum(H, r => r.door.twoMs), ends = sum(L, r => r.door.endsIn);
    const chosen = sum(L, r => r.door.chosenMs), keysMs = sum(L, r => r.door.keysMs), byTier = Object.entries(tally(H.filter(r => r.door.stopMs.some(x => x > 0)).map(r => `${r.bot} ${r.tier}`))).map(([k, v]) => `${k} ${v}`).join(', ');
    const fLong = Math.max(0, ...F.map(r => r.door.longestMs)), fTwo = Math.max(0, ...F.map(r => r.door.twoLongestMs)), fuzzOk = fLong <= FUZZ_DOOR_MS && fTwo <= FUZZ_DOOR_MS;
    const fuzz = F.length ? `; the fuzz (${F.length} lanes): the game's ${s2(sum(F, r => r.door.stopMs.reduce((x, y) => x + y, 0)) / 1000)} s, longest ${s2(fLong / 1000)} s at once, the #2's ${s2(sum(F, r => r.door.twoMs) / 1000)} s, longest ${s2(fTwo / 1000)} s` : '';
    add('F4', 'no doorway stops (every sheet)', ms === 0 && faults === 0 && two === 0 && ends === 0 && fuzzOk, `the game's: ${s2(ms / 1000)} s in ${H.filter(r => r.door.stopMs.some(x => x > 0)).length} of ${H.length} lanes${byTier ? ` (${byTier})` : ''} (a lane, rooms 1 to 3: ${byRoom.join(', ')} s); the #2's ${s2(two / 1000)} s; moves ending in a doorway ${ends}${ends ? ` (${L.flatMap(r => r.door.endsWhat).slice(0, 3).join('; ')})` : ''}; funnel faults ${faults} (and ${sum(L, r => r.door.faults) - faults} earned by a step standing by choice, ${s2(chosen / 1000)} s so chosen; by the keys' own ${s2(keysMs / 1000)} s)${fuzz}`, `0 by the game, the #2 0, moves 0, 0 funnel faults unchosen; the fuzz none over ${FUZZ_DOOR_MS / 1000} s at once`); }
  // F5
  { const xs = r3up.flatMap(r => r.firstOut), past = xs.filter(x => x.pastM > 0);
    add('F5', 'the first round out of the door (rung 3 and up)', xs.length && past.length === xs.length, `${past.length} of ${xs.length} past the threshold (${pct(past.length, xs.length)}); metres past mean ${s2(mean(xs.map(x => x.pastM)))}, min ${s2(Math.min(...xs.map(x => x.pastM)))}; from the funnel ${xs.filter(x => x.funnel).length}`, '100% past'); }
  // F6
  { const legs = r3up.flatMap(r => Object.values(r.feet.legs).filter(f => f.minV !== null)), stopped = legs.filter(f => f.underMs > 0);
    add('F6', 'the feet never stop, stack to point (rung 3 and up)', legs.length && !stopped.length, `${stopped.length} of ${legs.length} rooms under ${STILL_MS} m/s, ${s2(mean(stopped.map(f => f.underMs / 1000)))} s each; least speed ${s2(Math.min(...legs.map(f => f.minV)))} m/s; rooms not reached ${r3up.flatMap(r => Object.values(r.feet.legs)).filter(f => f.st !== 'done').length}`, `above ${STILL_MS} m/s`); }
  // F7
  { const hb = honest.length ? honest : recs, cf = hb.reduce((a, r) => a + r.corners.faults, 0), unc = hb.reduce((a, r) => a + r.corners.uncovered, 0), by = {};
    for (const r of hb) for (const [k, v] of Object.entries(r.corners.by)) by[k] = (by[k] ?? 0) + v;
    add('F7', 'no missed corners', cf === 0 && unc === 0, `corner faults ${cf}; hot spots uncovered at "Clear!" ${unc}; covered by ${top(by)}`, '0; every hot spot before "Clear!"'); }
  // F8
  { const fT = {}; for (const r of honest) for (const [k, v] of Object.entries(r.faults)) fT[k] = (fT[k] ?? 0) + v;
    const fuzz = recs.filter(r => r.bot === 'fuzz'), ev = {};
    for (const r of fuzz) for (const [k, e] of Object.entries(r.evidence)) { const x = ev[k] ??= { n: 0, ok: 0, how: e.how }; x.n += e.n; x.ok += e.ok; }
    const bad = ['muzzle', 'funnel', 'time', 'standing', 'noshoot', 'hostage'].reduce((a, k) => a + (fT[k] ?? 0), 0);
    const evN = Object.values(ev).reduce((a, e) => a + e.n, 0), evOk = Object.values(ev).reduce((a, e) => a + e.ok, 0);
    add('F8', 'faults only when deserved', bad === 0 && evOk === evN, `honest T: ${top(fT, 10)} in ${honest.filter(r => Object.keys(r.faults).length).length} of ${honest.length} lanes${fuzz.length ? `; fuzz (${fuzz.length} lanes): ${Object.entries(ev).map(([k, e]) => `${k} ${e.ok}/${e.n} by ${e.how}`).join(', ') || 'no faults'}` : ''}`, '0 (T); 100% evidenced (fuzz)'); }
  // F9
  { const xs = honest.flatMap(r => r.engaged), wrong = xs.filter(x => x.by !== null && x.by !== (x.slot === 2 ? 'two' : 'me') && !(x.by === 'two' && x.covered)), up = xs.filter(x => x.up);
    const byStand = {}; for (const x of xs) { const k = `${x.stand}(#${x.slot})`; const o = byStand[k] ??= { me: 0, two: 0, none: 0, covering: 0 }; const by = x.by === 'two' && x.slot === 1 && x.covered ? 'covering' : x.by ?? 'none'; o[by] = (o[by] ?? 0) + 1; }
    add('F9', 'every threat engaged in its sector', !wrong.length && !up.length, `wrong sector ${wrong.length} of ${xs.length}; left up ${up.length}; by stand ${Object.entries(byStand).map(([k, o]) => `${k} me ${o.me} two ${o.two}${o.covering ? ` (covering you ${o.covering})` : ''} none ${o.none}`).join(' · ')}`, '100%; 0 up'); }
  // F10
  // (the rework's R9, 2026-11-13: a man your pause could not identify ("can't see his hands") is challenged as doctrine says, 1.2 s
  // (contact.js CHALLENGE_MS), never shot unseen: his par is set apart and printed, as the dummy's man is, a roll the drill
  // answers and the sheet does not own)
  // (and a man whose first round inside his par missed him: the par times the first hit, and a miss is the row's odds, the
  // user's scored numbers, not the flow's time; set apart and printed (R9: the corporal's head shot on the hostage, 2 of 100))
  { const held = honest.filter(r => r.pars.held), apart = (m) => m.jam || m.challenged || m.missedRound, miss = held.flatMap(r => r.pars.missed.filter(m => !apart(m)).map(m => `${r.tier}:${m.stand}`)), jam = held.flatMap(r => r.pars.missed.filter(m => m.jam)), chal = held.flatMap(r => r.pars.missed.filter(m => !m.jam && m.challenged)), mr = held.flatMap(r => r.pars.missed.filter(m => !m.jam && !m.challenged && m.missedRound));
    const wrongPar = held.filter(r => r.pars.set !== r.pars.held).map(r => `${r.tier} ${r.pars.set}`);
    add('F10', 'pars', !miss.length && !wrongPar.length, `missed ${miss.length} (${top(tally(miss), 8)}); the dummy's man ${jam.length}; challenged, his hands unseen ${chal.length}; a first round inside the par that missed ${mr.length}; the sheet's par not the held one: ${[...new Set(wrongPar)].join(', ') || 'none'}`, 'met but the dummy\'s'); }
  // F11
  { const dk = {}; for (const r of honest) for (const [k, v] of Object.entries(r.mem?.dead ?? {})) dk[k] = (dk[k] ?? 0) + v;
    const total = Object.values(dk).reduce((a, b) => a + b, 0), out = honest.reduce((a, r) => a + (r.mem?.outMs ?? 0), 0);
    const fuzzUndone = recs.filter(r => r.bot === 'fuzz' && !r.done).length;
    add('F11', 'no dead ends', total === 0 && out === 0 && !fuzzUndone, `${total} in ${honest.length} lanes (${s2(total / Math.max(1, honest.length))} a lane): ${top(dk, 10)}; out of stop motion with no act ${s1(out / 1000 / Math.max(1, honest.length))} s a lane; waits ${honest.reduce((a, r) => a + (r.mem?.waits ?? 0), 0)}, X ${honest.reduce((a, r) => a + (r.mem?.leaves ?? 0), 0)}, off-lane presses by hand ${honest.reduce((a, r) => a + (r.mem?.hand ?? 0), 0)} (${top(sumOf(honest.map(r => r.mem?.handBy ?? {})))})${recs.some(r => r.bot === 'fuzz') ? `; fuzz lanes not to the card ${fuzzUndone}` : ''}${grain.length ? `; below rung 2 by T alone (the keys' grain, ${grain.length} lanes): out of stop motion ${s1(mean(grain.map(r => (r.mem?.outMs ?? 0) / 1000)))} s a lane, legs passed by the stall ${s1(mean(grain.map(r => r.legState.filter(x => x === 'passed').length)))} of 4` : ''}`, '0'); }
  // F12
  { const xs = r2up.flatMap(r => r.stops.filter(s => s.carryAfterShot));
    add('F12', 'no "Carry on" after a shot row, nobody up (rung 2 and up)', !xs.length, `${xs.length} in ${r2up.length} lanes`, '0'); }
  // F13
  { const per = t1.map(r => r.stops.length), line = tally(t1.flatMap(r => r.stops.map(s => s.line ?? 'no line'))), why = tally(t1.flatMap(r => r.stops.map(s => s.why))), presses = t1.flatMap(r => r.stops.map(s => s.presses)), multi = presses.filter(p => p > 1).length;
    const n = Math.max(1, t1.length), a = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fmt(v / n, 2)]));
    add('F13', 'stops a lane (the tier one)', t1.length && quantile(per, 0.95) <= STOPS_P95 && multi === 0, `mean ${s1(mean(per))}, p95 ${quantile(per, 0.95) ?? '-'}, max ${per.length ? Math.max(...per) : '-'}, lanes over ${STOPS_P95} ${per.filter(k => k > STOPS_P95).length} of ${t1.length}; presses a stop mean ${s2(mean(presses))}, ${multi} stops with more than one; a lane by why ${top(a(why), 12)}; a lane by line ${top(a(line), 12)}`, `p95 at most ${STOPS_P95}, one press each`); }
  // F14
  { const hang = recs.filter(r => r.end === 'time'), stalls = recs.reduce((a, r) => a + r.stalls, 0), hs = honest.reduce((a, r) => a + r.stalls, 0), err = recs.filter(r => r.err), undone = recs.filter(r => !r.done && !r.err && r.bot !== 'fuzz');
    const xs = recs.map(r => r.laneS).filter(Number.isFinite);
    add('F14', 'no hangs', !hang.length && hs === 0 && !err.length && !undone.length, `to LANE_MAX_MS ${hang.length}; stalls ${stalls} (the honest bot's ${hs}); throws ${err.length}${err.length ? ` (${err[0].tier} ${err[0].seed}: ${err[0].err})` : ''}; not to the card ${undone.length}; lane mean ${s1(mean(xs))} s, p95 ${s1(quantile(xs, 0.95))}, max ${s1(xs.length ? Math.max(...xs) : null)}`, `0 to ${LANE_MAX_MS / 1000} s; 0 stalls (honest)`); }
  // F15
  { const xs = t1.map(r => r.laneS).filter(Number.isFinite), rooms = [0, 1, 2, 3].map(k => s2(mean(t1.map(r => r.legS[k]).filter(Number.isFinite))));
    add('F15', 'lane time (the tier one)', xs.length && mean(xs) <= LANE_MEAN_S && Math.max(...xs) <= LANE_MAX_S, `mean ${s1(mean(xs))} s, p95 ${s1(quantile(xs, 0.95))}, max ${s1(xs.length ? Math.max(...xs) : null)}; rooms 1 to 3 and the hall ${rooms.join(', ')} s`, `mean ${LANE_MEAN_S} s or less, max ${LANE_MAX_S} s`); }
  // F16
  { const names = [...new Set(recs.flatMap(r => r.names))], stat = flawlessNames();
    add('F16', 'nothing names a lane or a house', !names.length && !stat.length, `the catalogue: ${stat.join(', ') || 'none'}; at the stops: ${names.slice(0, 5).join(' | ') || 'none'}${names.length > 5 ? ` and ${names.length - 5} more` : ''}`, 'none'); }
  // F17
  { const xs = recs.flatMap(r => r.two.stackM), far = xs.filter(m => m > TWO_SLOT_M), hb = recs.reduce((a, r) => a + r.two.handbacks, 0);
    add('F17', 'the #2 at his slot', xs.length && !far.length && hb === 0, `${far.length} of ${xs.length} stacks with him over ${TWO_SLOT_M} m (worst ${s2(Math.max(...xs))} m, mean ${s2(mean(xs))}); 'two' hand-backs ${hb}`, '100%; 0'); }
  // F19
  { const mv = recs.reduce((a, r) => a + r.anim.moveTicks, 0), idle = recs.reduce((a, r) => a + r.anim.idle, 0), tb = recs.reduce((a, r) => a + r.anim.tweenBad, 0), fig = recs.reduce((a, r) => a + r.anim.figIdle, 0), tmax = Math.max(0, ...recs.map(r => r.anim.tweenMaxM));
    const fs = recs.reduce((a, r) => a + (r.anim.figStride ?? 0), 0), C = sumOf(recs.map(r => r.anim.chief ?? {}));
    add('F19', 'the #2 animated', mv && (mv - idle) / mv >= 0.99 && tb === 0 && (mv - fig) / mv >= 0.99 && fs === 0, `${mv} moving ticks: gait walking ${pct(mv - idle, mv)}, figureOf walking ${pct(mv - fig, mv)}, its stride kept but ${fs}; tween start wrong on ${tb} (worst ${s2(tmax)} m); the instructor ${C.moveTicks ?? 0} moving ticks, walking ${pct((C.moveTicks ?? 0) - (C.idle ?? 0), C.moveTicks ?? 0)}, drawn walking ${pct((C.moveTicks ?? 0) - (C.figIdle ?? 0), C.moveTicks ?? 0)}, tween start wrong on ${C.tweenBad ?? 0}`, '99% or more; tween error 0'); }
  // F24
  { const st = honest.flatMap(r => r.stops), byRow = tally(st.map(s => s.actRow)), pages = tally(st.filter(s => s.actPage !== undefined && s.actPage !== null).map(s => (s.actPage === 0 ? 'page 1' : s.actPage > 0 ? 'a later page' : 'not shown')));
    const bad = st.filter(s => ['absent', 'struck', 'names a struck shot', 'names nothing', 'no line', 'not a row'].includes(s.actRow)).length;
    // (R7: the grouped panel: T's row by its own place in each layout (presses, one press's share), on NEXT in one press, every path reaching it)
    const keyed = st.filter(x => x.keys), miss = keyed.filter(x => LAYOUTS.some(L => x.keys[L] === null)).length, nextBad = keyed.filter(x => !x.onNext).length;
    const lay = LAYOUTS.map(L => { const xs = keyed.map(x => x.keys[L]).filter(Number.isFinite); return `${L.toUpperCase()} ${s2(mean(xs))} (${pct(xs.filter(v => v === 1).length, xs.length)} in one)`; }).join(', ');
    add('F24', 'every DI line names a row the panel has, live', st.length && bad === 0 && miss === 0 && nextBad === 0, `${st.length} stops: ${top(byRow, 8)}; v0.0.13's pages: T's row on ${top(pages)}; the grouped panel (R7): T's row by its own place ${lay}, on NEXT in one press ${keyed.length - nextBad}/${keyed.length}, a path that misses ${miss}`, '100%'); }
  return rows;
}
const sumOf = (os) => { const o = {}; for (const x of os) for (const [k, v] of Object.entries(x)) o[k] = (o[k] ?? 0) + v; return o; };
const pct = (a, b) => (b ? `${fmt((100 * a) / b, 1)}%` : '-');

/** The gauge as lines, six spaces in (the house style of the tests' numbers), with a head. */
export function printGauge(head, rows) {
  console.log(`      ${head}`);
  for (const r of rows) console.log(`      ${r.id.padEnd(3)} ${r.met ? 'MET ' : 'OPEN'} ${r.name}: ${r.value} (target ${r.target})${ENFORCED.has(r.id) ? ' [enforced]' : ''}`);
}
/** The criteria enforced and not met (the suites' assertion: none until ENFORCED names some). */
export const failing = (rows) => rows.filter(r => ENFORCED.has(r.id) && !r.met).map(r => `${r.id} ${r.name}: ${r.value}`);
/** Run lanes over sheets and seeds with a bot: the records, and a per-sheet line printed as each sheet ends. */
export function laneSet({ sheets, seeds, bot = 'honest', setup = 'go', print = true }) {
  const recs = [];
  for (const tier of sheets) {
    const mine = [];
    for (const seed of seeds) { const r = flawlessLane({ tier, seed, bot, setup }); mine.push(r); recs.push(r); }
    if (print) {
      const xs = mine.map(r => r.laneS).filter(Number.isFinite), ends = tally(mine.map(r => r.err ? 'throw' : r.end ?? 'none'));
      console.log(`      ${bot} ${tier.padEnd(8)} ${mine.length} lanes: lane mean ${s1(mean(xs))} s (p95 ${s1(quantile(xs, 0.95))}, max ${s1(xs.length ? Math.max(...xs) : null)}); ends ${top(ends)}; stops a lane ${s1(mean(mine.map(r => r.stops.length)))} (p95 ${quantile(mine.map(r => r.stops.length), 0.95) ?? '-'}; by why ${top(tally(mine.flatMap(r => r.stops.map(s => String(s.why).replace(/:.*$/, '')))), 6)}); dead ends a lane ${s2(mean(mine.map(r => Object.values(r.mem?.dead ?? {}).reduce((a, b) => a + b, 0))))}; T a lane ${s1(mean(mine.map(r => r.mem?.T ?? 0)))}`);
    }
  }
  return recs;
}
export { mean, tally, top, s1, s2, pct };

// ---- the gauges of the other runs ----

/** F18's printed reference: each command's macro time at Weapon handling 15 (COMBAT §25.19.5's table, ms); the bound is his own macro's time at his sheet's Weapon handling as he lived it (its sub-steps' times, a fumble's included: the dice are his, the wait is the tower's) from his start, plus ADMIN_SLACK_MS (my call); the fumbles' cost is printed apart. */
export const ADMIN_MS = Object.freeze({ load: 1930, ready: 2510, clear: 7900, stop: 600 }), ADMIN_SLACK_MS = 500;
// (a list in a macro's order: each of the macro's sub-steps in turn, a halt's re-plan allowed to start it again)
const inOrder = (list, macro) => { if (!list) return true; let j = 0; for (const a of list) { const k = macro.indexOf(a, j); if (k >= 0) j = k + 1; else if (macro.includes(a)) j = macro.indexOf(a) + 1; else if (!a.startsWith('posture:') && a !== 'say:ready' && a !== 'up') return false; } return true; };
/** F18 over flawlessAdmin's runs: one row. */
export function adminGauge(runs) {
  const by = {}, bad = [];
  for (const r of runs) for (const c of r.cmds) {
    const o = by[c.cmd] ??= { n: 0, before: 0, met: 0, ms: [], over: [], steps: new Set(), order: 0, fumbleMs: [] };
    o.n++; if (c.before) o.before++;
    // (his own macro's time where one ran (none owed: his condition already the command's at it, as Stop finds a man who made safe after his rows))
    const bound = c.planMs === null ? ADMIN_SLACK_MS : c.startMs + (c.livedMs ?? c.planMs) + ADMIN_SLACK_MS, ordered = inOrder(c.list, c.macroList ?? []);
    if (c.planMs !== null && c.livedMs > c.planMs + 50) o.fumbleMs.push(c.livedMs - c.planMs);
    const ok = !c.before && c.metMs !== null && c.metMs <= bound && ordered;
    if (ok) o.met++; else bad.push(`${r.tier} ${r.seed} ${c.cmd}`);
    if (!ordered) o.order++;
    if (c.metMs !== null) { o.ms.push(c.metMs); o.over.push(c.metMs - (bound - ADMIN_SLACK_MS)); }
    for (const s of c.steps) o.steps.add(String(s).replace(/#.*$/, '').replace(/^cmd:[a-z]+>/, ''));
  }
  const words = Object.entries(by).map(([k, o]) => `${k.toUpperCase()} ${o.met}/${o.n} (already so at the command ${o.before}; his time ${o.ms.length ? `${s2(mean(o.ms) / 1000)} s mean, worst ${s2(Math.max(...o.over) / 1000)} s past his macro` : 'never'}; out of order ${o.order}; fumbles ${o.fumbleMs.length}${o.fumbleMs.length ? ` (+${s2(mean(o.fumbleMs) / 1000)} s mean)` : ''}; his steps ${[...o.steps].join(', ') || 'none'})`).join(' · ');
  return { id: 'F18', name: "the #2's admin", met: !bad.length && runs.length > 0, value: `${runs.length} lanes from the fill: ${words || 'no command seen'}${bad.length ? `; not met: ${bad.slice(0, 4).join(', ')}` : ''}`, target: `his condition within his macro + ${ADMIN_SLACK_MS / 1000} s, every command` };
}
/** F20 over stoppageRun's results: one row. */
export function stoppageGauge(outs) {
  const live = outs.every(o => o.live === o.lanes), offered = STOPPAGE_ANSWERS.filter(a => outs.some(o => o.answer === a && o.offered > 0));
  const trWords = (T) => (T ? `; the draw ${s2(mean(T.drawMs) / 1000)} s against its formula ${s2(mean(T.formulaMs) / 1000)}, late ${T.late}, the first pistol round past its row ${T.roundLate}` : '');
  const gdWords = (G) => (G ? `; stood before his "Up." ${G.standBeforeUp}, no "Up." ${G.noUp}, the man seen by your #2 ${G.saw}, taken by him ${G.took}${G.challenged ? `, challenged (not identified) ${G.challenged}` : ''}${G.yours ? `, yours again (your rifle back inside his take-in) ${G.yours}` : ''}` : '');
  const words = outs.map(o => `${o.tier} ${o.answer}: ${o.skipped ? `not offered in ${o.lanes} lanes, stopped` : `offered in ${o.offered} of ${o.lanes}`}, live ${o.live}/${o.lanes}, the click met ${o.clicked}; next round ${s2(mean(o.toNextMs) / 1000)} s, on the man ${s2(mean(o.toManMs) / 1000)} s${o.pistol ? `, a pistol's ${o.pistol}` : ''}${trWords(o.tr)}${gdWords(o.gd)}`).join(' · ');
  const keys = {}; for (const o of outs) for (const [k, v] of Object.entries(o.keys)) keys[k] = (keys[k] ?? 0) + v;
  // (the rework's R6: each answer offered on some sheet and ending live; the transition's draw in its formula's time (a fumble's
  // ×1.6 and a tick allowed) and its first round within the row's own; you never stand before his "Up."; a man of yours your #2
  // could see while you were down is taken by him)
  const late = outs.reduce((n, o) => n + (o.tr?.late ?? 0) + (o.tr?.roundLate ?? 0), 0), stood = outs.reduce((n, o) => n + (o.gd?.standBeforeUp ?? 0), 0);
  const saw = outs.reduce((n, o) => n + (o.gd?.saw ?? 0), 0), took = outs.reduce((n, o) => n + (o.gd?.took ?? 0), 0);
  return { id: 'F20', name: 'the stoppage', met: live && offered.length === STOPPAGE_ANSWERS.length && late === 0 && stood === 0 && took === saw,
    value: `the card's answers seen: ${top(keys, 8)}; the design's offered: ${offered.join(', ') || 'none'} of ${STOPPAGE_ANSWERS.join(', ')}; transitions late ${late}, stood before "Up." ${stood}, his men taken ${took} of ${saw} seen (yours again before his take-in ended ${outs.reduce((n, o) => n + (o.gd?.yours ?? 0), 0)}); ${words}`, target: 'each answer ends live, in its time; you stand only after his "Up."; he takes the man he can see' };
}
/** F21 over the keys bot's lanes and 48213's: one row. */
export function keysGauge(recs, on48213 = []) {
  const parts = [], bad = [];
  for (const tier of ['recruit', 'private']) {
    if (!recs.some(r => r.tier === tier && r.bot === 'keys') && !on48213.some(r => r.tier === tier)) continue;
    const mine = recs.filter(r => r.tier === tier && r.bot === 'keys'), xs = mine.map(r => r.laneS).filter(Number.isFinite), room1 = mine.map(r => r.legS[0]).filter(Number.isFinite);
    const one = on48213.find(r => r.tier === tier), ref = KEYS_REF[tier] ?? {};
    const dev48 = one?.laneS && ref.lane48213 ? one.laneS / ref.lane48213 - 1 : null, dev100 = xs.length && ref.lane100 ? mean(xs) / ref.lane100 - 1 : null;
    if (dev48 !== null && Math.abs(dev48) > KEYS_TOL) bad.push(`${tier} 48213`);
    if (dev100 !== null && Math.abs(dev100) > KEYS_TOL) bad.push(`${tier} 100`);
    parts.push(`${tier}: 48213 lane ${s1(one?.laneS)} s against ${ref.lane48213 ?? '-'} (${dev48 === null ? '-' : `${dev48 >= 0 ? '+' : ''}${fmt(dev48 * 100, 1)}%`}), room 1 ${s2(one?.legS?.[0])} s; ${mine.length} seeds: lane mean ${s1(mean(xs))} s${ref.lane100 ? ` against ${ref.lane100} (${dev100 >= 0 ? '+' : ''}${fmt(dev100 * 100, 1)}%)` : ''}, p95 ${s1(quantile(xs, 0.95))}, room 1 mean ${s2(mean(room1))} s; to the card ${mine.filter(r => r.done).length}/${mine.length}`);
  }
  return { id: 'F21', name: 'no watering down (the keys)', met: !bad.length && parts.length > 0, value: parts.join(' · '), target: `within ${KEYS_TOL * 100}% of the routed v0.0.12 figures` };
}
/** F22 over refRoom's runs (48213 first): one row. */
export function refGauge(runs) {
  const one = runs[0], xs = runs.map(r => r.ownS).filter(Number.isFinite), dev = one?.ownS ? one.ownS / REF_ROOM_S - 1 : null;
  const inBand = (v) => v >= DOCTRINE_ROOM_S[0] && v <= DOCTRINE_ROOM_S[1];
  return { id: 'F22', name: "the operator's room against doctrine", met: dev !== null && Math.abs(dev) <= REF_TOL,
    value: `${one?.tier} on ${one?.seed}: ${s2(one?.ownS)} s to his own "Clear!" (${dev === null ? '-' : `${dev >= 0 ? '+' : ''}${fmt(dev * 100, 1)}%`} of ${REF_ROOM_S}), ${s2(one?.roomS)} s with his #2's; ${xs.length} seeds mean ${s2(mean(xs))} s, ${xs.filter(inBand).length} in doctrine's ${DOCTRINE_ROOM_S.join(' to ')} s`, target: `${REF_ROOM_S} s ±${REF_TOL * 100}%` };
}
/** F23 over saveRun's runs: one row. */
export function saveGauge(runs) {
  const saves = runs.reduce((a, r) => a + r.saves, 0), bad = runs.flatMap(r => r.bad.map(b => `${r.seed} save at ${b.save} (${b.why}) parted at ${b.at}`)), sus = runs.reduce((a, r) => a + r.suspended, 0);
  return { id: 'F23', name: 'determinism', met: saves > 0 && !bad.length && sus > 0, value: `${saves} saves over ${runs.length} lanes (inside a suspended flow ${sus}: ${sus ? 'some' : 'no suspended flow yet'}), carried on to the card: ${bad.length ? bad.slice(0, 3).join('; ') : 'every one byte for byte'}`, target: '100%' };
}
