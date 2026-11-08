// OLYMPUS sim: stop motion, the weapon mode's clock and its steps: time stands still while you choose, each step plays for its time (WEAPONS §7.1, §15; COMBAT §3; TIME §4.3; the build sheet 0.0.5 §2.2, §8 items 8, 14 to 17).
//
// Tradecraft's shooting mode (src/sim/shooting.js toggle, options, choose, tick, finish, readyGun),
// its glue rewritten for OLYMPUS's clock (the user, tradecraft 2026-11-03: "time stops while we get
// the weapon ready … each step to ready a weapon has to be acted on by the player and will have time
// move forward as we do"). state.stop (TECH §6.1's key, saved):
//     { mode: 'stop' | 'live', who, gun, phase: 'choose' | 'act', pick, aim: { key, settledMs } | null,
//       doing: { step, kind, tempo, list, subs: [{ action, ms, ok, grade, routine, mishap }], i, fromMs, subFromMs,
//                untilMs, cmd, chain, target, … } | null,
//       queue, reflex, keep }
// null outside the mode. G with a rifle on you is intent (enterStop via 'ready': the mode entered and
// the rifle brought up, 'up', as its first step); X toggles the mode (via 'shoot'); the mode holds
// time ('stop') while you choose and releases it while a step plays.
//
// The clock (TIME §4.3). chooseStep, in a tick's input layer, rolls and applies the step's first
// sub-step at the clock, sets doing and phase 'act' and releases 'stop', so that tick's other layers
// run and the clock moves. Sub-step boundaries fall at their formula times, cumulative from the
// step's start (each sub's ms is known once it is rolled: a fumble ×1.6), each taken on the first tick
// at or after it, so a step lives ceil(Σ ms / TICK_MS) ticks: LOAD at WH 10 is 2,412 ms of formula and
// 2,450 lived. The boundaries are taken in the input layer (stopInput, which runs while time stands
// still, before anything that moves the world): on the first tick at or past one, the sub-step ends
// (its effects land: the aim settles, the stance is taken; 0.0.6, the hands: a handling sub-step leaves
// gun oil and carbon on them, HANDS.RIFLE_SUB, and kneeling or lying prone outdoors regolith,
// HANDS.REGOLITH, through BODY's soil), the next is rolled and applied there, a
// failure that is not routine halts the macro (the rest into stop.queue), and with none left the step
// ends; ending it there and holding 'stop' in the same layer freezes that very tick, so the clock
// stands exactly at the step's end and the body counts no tick the clock did not pass (the sheet put
// this in the rules layer; taking it in input is my call, for that reason). A step that leaves the
// line ready for the tower's current command runs on as a chained wait (until the tower's next
// command or WAIT_MAX_MS 15 s, cut at once by any step chosen: the sheet §8 item 16), else the phase
// is 'choose' again.
//
// Interrupts (COMBAT §3.3, this round's two): orderToMe, a tower command (src/sim/scenarios/handling.js
// onRangeCmd), ends a wait or a hold at once and a CEASE FIRE any other step at its sub-step's end;
// gunStop, a pull that clicks or a shot that does not cycle, ends the fire step at the pull's end and
// offers the reflex card (src/sim/combat/reflex.js: "Click." or "It didn't cycle.", tap and rack, a look
// at the port, or nothing). v0.0.5's taps (Fire again inside a shot's recovery, tradecraft's tap()) are
// retired in 0.0.8 for the shot rows (COMBAT §25.6.4, §25.16's question 9): Fire during a fire step is 'busy'.
//
// The steps (stepsOf, TECH §2.6's options()): Fire (struck with its reason, as the holder believes it:
// "aim first", "on safe", "chamber empty", "a stoppage": short, since the panel's row and the plaque carry them), Aim at the bracketed target or Hold
// the aim (time taken, to +4), the Corps' commands (src/sim/arms/drills.js macrosFor, the tower's current
// first, after the rest of a macro that halted, 'queue'), the singles the belief allows (firearms.js canDo), the stances (A up, W down: COMBAT's steps,
// src/sim/combat/steps.js), the postures (V), Wait, and leave (X). Each lists its time at normal tempo,
// rushed (Shift, where rushable: ×0.6, −3, never routine) and careful (held, where careful: ×1.5, +2);
// Fire held is hold and fire (the hold to +4, then the pull, one step). Targets (targetsOf) are the
// range's cards ('paper:<lane>', left to right) and the people in the frame the camera would show
// bracketing each (VIEWS §2.4's weapon-mode lead: the centre AIM_LEAD_K of the way to the target, the
// shooter kept EDGE_KEEP_M inside the frame's FRAME_HALF_M, or the page's own state.$frame).
// Outside the mode, V, A and W are live steps (liveStep: state.stop { mode: 'live' } for one step,
// nothing held, null after), and a move key while kneeling or prone stands you first.
// 0.0.6 (the user, 2026-11-07; DESIGN.md's log): the magazine reached for is single steps in the panel ("Reach:
// chest pouch 1 (5 ball · front of 2)", "(5, kind not seen)", "Magazine in", "Look at it", "Put back: pouch 2",
// "Dump it", "Drop it":
// firearms.js canDo), a reach's row saying what the holder believes it would bring. While a string is fired a
// step that would seat another magazine than the one the string began with is marked, not struck (warn: "one
// magazine a string"): the player may still do it, and the scene counts it (handling.js magSeated).
// stepNow(state, pid, ms) is what the stage reads of a step (src/sim/arms/look.js: the action's frame
// and its share k); stopNow(state) is the hud's view. The range session's bookkeeping is the scene's
// (handling.js: lineReady, recordShot, afterStep, aheadOf, coachOf).
//
// 0.0.7, the line at distance (WEAPONS §2.5, §3.5, §7.3, §7.4, §11.4; VIEWS §2.4; the build sheet 0.0.7 §2.1, §8
// items 6 to 9 and 25). On a KD line (lineOf: the line whose firing-point box holds the shooter, 200, 300 or 500,
// or 25 on the bay on the KD course) the targets are the KD faces of all twenty lanes ('face:<lane>', 'your
// target' and 'target <n>'), a far one in the list though outside the frame: the far window counts as the frame
// (VIEWS §2.4); on the bay on the KD course the cards are the 25 m zeroing card (paper.js zero25). farPointOf()
// is what the far window shows: the aimed, else the bracketed, else (E held: looking) your own face, when it
// lies outside the lead's frame. The new rows, only on such a line (test-handling's panel unchanged): the
// turrets ('sight:elev:<±n>', 'sight:wind:<±n>': DIAL_S a click × pace, hands off the aim; 'sight:dope:<line>' to
// the believed dope for the line; 'sight:call', the coach's pending call (the confirm's, else the zero's last
// group's), which dials the clicks still to go and moves the believed zero by the call, its log line "Dialled four
// up, two left: the zero moves with it."; a call dialled by the keys, the turrets brought to its want, counts the
// same, once: callReached), the hold ('hold:<x>,<y>' mrad, 'hold:read' for your read of the wind, 'hold:call' for the coach's,
// 'hold:centre': HOLD_SHIFT_MS each, the held aim kept; stop.hold), a read of the flags ('read': READ_S × pace,
// wind.js readWind, kept on the session's reads), the lever ('optic:1', 'optic:4': OPTIC_S) and sitting
// ('stance:sit', its own row, never in A and W's cycle; SIT_MS its times, my calls). Rows given by id that the
// panel does not list ('sight:elev:+4', 'hold:0.5,0') are taken as asked (the hud's keys, the bots).
//
// 0.0.8, close quarters on the bay (COMBAT §25.4.5, §25.6; the build sheet 0.0.8 §2.2, §8 items 3, 9 to 12, 17). On a
// pairs session the targets are the six turners ('turner:<lane>', "the target, lane 3": src/sim/arms/turners.js
// turnerTargets, with their facing and whether they are down), not the cards. The panel at a contact's pause (contact.js:
// state.stop entered via 'contact' with the pick on the target nearest the muzzle) leads with the contact's rows that
// lead (a no-shoot identified: Hold him, Challenge), then the shot rows (src/sim/arms/specials.js shotRows: Pair, Hammer,
// Triple, Failure drill, To the head), then Fire, Aim or Hold, then the contact's other rows; the reloads are named by
// their purpose everywhere (specials.js reloadRows: RELOAD, Top up, RELOAD, keep the empty; the first by the situation
// first of the commands). While the pause's threat faces and stands (contact.js contactLive) the panel is the
// contact's (the fixer's of 0.0.8, after the design review: the recruit's Off safe was the seventh row, under a Top
// up and UNLOAD): below rung 2 (specials.js RUNG_AIM) Off safe on safe and Aim come straight after the lead rows, Fire
// on safe is struck "off safe first", and the commands that are no answer to a man facing you (Top up but at half or
// less with a fuller one at hand, UNLOAD, Lock back, the magazine out, a reach with one in, a press or magazine check
// with a round believed up) go after the singles and off the panel's first page (later), but RELOAD on an empty bolt; on the pairs bay the wait is "Wait for the turn" in a standby, "Wait for the coach" otherwise (no tower there).
// A shot row is a step of parts ('aim', 'hold', 'press', 'round', 'shift': runSub hands them to
// specials.js, the rounds on their formula times); a contact row's 'contact:*' sub-steps are contact.js's. While a
// contact's window is open (contact.js pendingOf) no step's end holds time: the window runs at 1:1 to its pause.
// 0.0.9 (the build sheet 0.0.9 §2.1, §8 item 17; COMBAT §25.18.1): a row whose odds are under SHAKING_ODDS 0.70 while the
// chaos's modifier on its skill is below 0 is marked, never struck: shaking { v, felt, band } and, with no warn of its own,
// warn 'shaking' ("! shaking"); such a row is never routine.
// 0.0.10 (the build sheet 0.0.10 §2.1, §8 items 11 to 13; COMBAT §5.2): Breathe ('breathe', "Breathe · 4.0 s") is a single
// stepsOf offers while supp.js breatheOffer allows it (felt 20 up, no window open, not startled): with no threat of the
// string facing, a fixed row (promoted, on the first page); with one up, a single paged with the rest and marked warn 'up'
// ("! he's up", never struck). Its plan is four sub-steps 'breathe' of BREATHE_SUB_MS (in, hold, out, hold), no roll and
// never × the chaos's time factor (breathing is not the hands); supp.js breatheStart at its first, breatheEnd at its end
// or its cut (a startle or a sighting cuts it at its sub-step's end, as any step). Out of the mode it is a live step
// (breatheAction: in the mode chooseStep, out of it liveStep), and it leaves the hands as they were.
// Pure but enterStop, leaveStop, liveStep, chooseStep, breatheAction, stopInput, stopRules.
import { holdTime, releaseTime, isHeld } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { playerActor, playerId } from '../../core/ids.js';
import { headOf } from '../people/perception.js';
import { downOf } from '../body/wounds.js';
import { isRoutine, oddsOf, TEMPO } from '../skills/checks.js';
import { rollerOf } from '../combat/roll.js';
import { suppMod, bandOf, SHAKING_ODDS, breatheOffer, breatheStart, breatheEnd, BREATHE_MS, BREATHE_SUB_MS } from '../combat/supp.js';
import { stanceMs, WAIT_MAX_MS, STANCES, stanceStep } from '../combat/steps.js';
import { offerReflex, chosenReflex } from '../combat/reflex.js';
import { aimMsOf, pullMsOf, heldOf, plaqueOf, resolveShot, HELD_MAX, poiOf, holdFor, holdWords, windBeliefOf, HOLD_STEP_MRAD, HOLD_MAX_MRAD, HOLD_SHIFT_MS } from './shot.js';
import { canDo, doAction, beliefOf, actionMs, REFUSALS, sayObserved, actionOf, actionKey, actionPlace, dial, dialMs, opticMs, readMs, setOptic, believeZero, beliefZero, sightOf, TURRET_MAX_CLK } from './firearms.js';
import { readWind } from './wind.js';
import { clickWords } from './paper.js';
import { paceOf } from '../skills/skills.js';
import { handMagOf, pickMag, pouchOf, atFeetOf, meantLoad, believedN, believedKind } from './kit.js';
import { modelOf } from './models.js';
import { macrosFor, subsOf, macroMs, MACROS } from './drills.js';
import { POSTURES } from './carry.js';
import { faceUpAt, markedFor, FACE_DOWN_UP } from './pits.js';
import { AIM_LEAD_K, EDGE_KEEP_M, FRAME_HALF_M } from './look.js';
import { KD_RANGE } from '../../data/places/range.js';
import { KD_STRINGS } from '../../data/courses.js';
import { HANDS } from '../../data/body/needs.js';
import { soil } from '../body/body.js';
import { areaOf } from '../places/model.js';
import { logEntry } from '../log.js';
import { lineReady, recordShot, recordEjects, recordDischarge, afterStep, aheadOf, coachOf, rangeOf, markOfMacro, onStepStart, noteTick, magSeated, oneMagWarn, kindWarn, spoutCheck } from '../scenarios/handling.js';
import { turnerTargets } from './turners.js';
import { shotRows, reloadRows, rowPlan, keptPlan, runRowSub, endRowSub, RELOAD_PURPOSE, rungOfShooter, RUNG_AIM, halfOrLess, fullerAtHand, ROWS } from './specials.js';
import { contactRows, runContactSub, endContactSub, pendingOf, feetOf, contactLive, CONTACT_LABELS } from '../combat/contact.js';

const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
/** A heading as a sprite's facing. */
export const faceOfHead = (h) => { const a = wrap(h); return Math.abs(a) <= Math.PI / 4 ? 'right' : Math.abs(a) >= 3 * Math.PI / 4 ? 'left' : a > 0 ? 'down' : 'up'; };

/** The words of the singles in the panel. */
export const LABELS = Object.freeze({
  up: 'Rifle up', stow: 'Sling it', 'posture:lowReady': 'Low ready', 'posture:highReady': 'High ready', 'selector:safe': 'Safe', 'selector:semi': 'Off safe',
  'selector:auto': 'Auto', port: 'Port cover', charge: 'Charge', release: 'Bolt release', lockBack: 'Lock back', 'magOut:drop': 'Drop the magazine',
  'magOut:dump': 'Magazine to the dump pouch', 'magOut:pouch': 'Magazine to a pouch', magIn: 'Magazine in', tap: 'Tap', pressCheck: 'Press check',
  magCheck: 'Magazine check', inspect: 'Inspect the chamber', observe: 'Look at the port', functionCheck: 'Function check', clearDouble: 'Clear the double feed',
  'magOut:strip': 'Strip the magazine', rack: 'Rack it clear',
  // (0.0.6: the magazine in the hand: see the header)
  reach: 'Reach for a magazine', seat: 'Magazine in', lookMag: 'Look at it', dumpMag: 'Dump it', dropMag: 'Drop it',
  'reach@p1': 'Reach: chest pouch 1', 'reach@p2': 'Reach: chest pouch 2', 'reach@p3': 'Reach: chest pouch 3', 'reach@p4': 'Reach: chest pouch 4',
  'reach@dump': 'Reach: the dump pouch', 'reach@ground': 'Reach: at your feet',
  // (short enough for the panel's column at 1600 × 900: "…chest pouch 1" wrapped its digit onto a line of its own (the fixer's, 0.0.6))
  'stowMag@p1': 'Put back: pouch 1', 'stowMag@p2': 'Put back: pouch 2', 'stowMag@p3': 'Put back: pouch 3', 'stowMag@p4': 'Put back: pouch 4',
  show: 'Show clear', finger: 'Finger off', fire: 'Fire', aim: 'Aim', hold: 'Hold the aim', wait: 'Wait for the tower', 'wait:mark': 'Wait for the mark', leave: 'Stand easy',
  'stance:stand': 'Stand', 'stance:kneel': 'Kneel', 'stance:prone': 'Prone', 'stance:sit': 'Sitting',
  // (0.0.7: the turrets, the hold, the read and the lever (see the header))
  read: 'Read the flags', 'optic:1': 'One power', 'optic:4': 'Four power', 'hold:centre': 'Hold centre', 'sight:call': 'Dial the coach\'s call',
  // (0.0.10: Breathe (see the header))
  breathe: 'Breathe',
});
/** Breathe's four sub-steps' words, in order (box breathing: in, hold, out, hold). */
export const BREATHE_WORDS = Object.freeze(['Breathe in.', 'Hold it.', 'Breathe out.', 'Hold it.']);
/**
 * A step's words from its id alone, for a step whose row the panel never drew (a load, an "Again", T's step): the single's
 * LABELS, a command's macro label ('macro:ready' → "MAKE READY"), a shot row's ('shot:pair' → "Pair"), "Carry on", else the
 * id (the runtime review of v0.0.9: the weapon card showed "macro:ready ◦◦✗◦").
 */
export function stepLabel(id) {
  if (!id) return '';
  if (LABELS[id]) return LABELS[id];
  if (id.startsWith('macro:')) return MACROS[id.slice(6)]?.label ?? id;
  if (id.startsWith('shot:')) return Object.values(ROWS).find(r => r.id === id)?.label ?? id;
  if (id === 'queue') return 'Carry on';
  return CONTACT_LABELS[id] ?? id;
}
/** Sitting's times (my calls; COMBAT §3.4's stances have none): from and to each stance, ms at pace 1, × paceOf(Fitness). */
export const SIT_MS = Object.freeze({ 'stand>sit': 2000, 'kneel>sit': 1500, 'prone>sit': 1800, 'sit>stand': 1200, 'sit>kneel': 1000, 'sit>prone': 1500 });
/** A stance change's time with sitting in it (steps.js stanceMs for the rest), ms. */
export const stanceMsOf = (from, to, fitness = 10) => (from === 'sit' || to === 'sit' ? (from === to ? 0 : Math.round((SIT_MS[`${from}>${to}`] ?? 1500) * paceOf(fitness))) : stanceMs(from, to, { fitness }));
/**
 * The handling that takes a hand off the rifle's grip or the cheek off the stock, so the held aim settles again
 * after it (tradecraft's list: its dropMag, insertMag, release, rack, clear, chamber1; WEAPONS §7.1's "magazine,
 * charge, release, clear"): the thumb's work (the selector, the port cover), a look at the port and the finger
 * keep the aim (the parity review's: every step had reset it).
 */
export const HANDS_OFF = Object.freeze(new Set(['magIn', 'magOut:drop', 'magOut:dump', 'magOut:pouch', 'magOut:strip', 'charge', 'rack', 'release', 'lockBack', 'clearDouble',
  'pressCheck', 'magCheck', 'tap', 'inspect', 'show', 'functionCheck', 'reach', 'seat', 'lookMag', 'stowMag', 'dumpMag', 'dropMag', 'dial', 'optic']));
// (a 0.0.7 row's key for HANDS_OFF and the like: 'sight:…' a dial, 'optic:N' the lever)
const rowKey = (id) => (id.startsWith('sight:') ? 'dial' : id.startsWith('optic:') ? 'optic' : id.startsWith('hold:') ? 'holdmark' : actionKey(id));
/** The stances' keys: A up, W down (VIEWS §10). */
export const STANCE_KEYS = Object.freeze({ up: 'A', down: 'W' });

// ---- who and what ----

const meOf = (state) => playerActor(state);
const gunOf = (state, gunId) => state.items?.[gunId] ?? null;
/** The rifle a person carries, if any: kit.worn.sling (WEAPONS: the rifle stays worn.sling whatever its posture). */
export const gunOn = (state, pid) => state.people?.[pid]?.kit?.worn?.sling ?? null;
const postureOf = (state, pid) => state.people?.[pid]?.kit?.carry?.posture ?? 'slungFront';
const setPosture = (state, pid, posture) => { const k = state.people?.[pid]?.kit; if (k) (k.carry ??= {}).posture = posture; };
const setFinger = (state, pid, finger) => { const k = state.people?.[pid]?.kit; if (k) (k.carry ??= {}).finger = finger; };
const slung = (posture) => posture === 'slungFront' || posture === 'slungBack';
const inHand = (state, pid) => !slung(postureOf(state, pid));

// ---- targets ----

/** The frame's half extents (m): the page's own (state.$frame), else VIEWS's 40 × 22.5 m picture. */
const frameHalf = (state) => (state.$frame ? [Math.abs(state.$frame.x1 - state.$frame.x0) / 2, Math.abs(state.$frame.z1 - state.$frame.z0) / 2] : FRAME_HALF_M);
/** Whether a point would be in the frame the camera shows bracketing it from the shooter (VIEWS §2.4's lead). */
export function inLeadFrame(me, x, z, half) {
  const lead = (p, t, h) => { let c = p + AIM_LEAD_K * (t - p); const keep = Math.max(0, h - EDGE_KEEP_M); if (Math.abs(p - c) > keep) c = p + Math.sign(c - p) * keep; return Math.abs(t - c) <= h; };
  return lead(me.x, x, half[0]) && lead(me.z, z, half[1]);
}

/**
 * The line a shooter stands on (see the header): 200, 300 or 500 (a KD point's box holds them), 25 on the bay on the
 * KD course, or null (test-handling's bay included: its panel is v0.0.6's).
 */
export function lineOf(state, pid = playerId(state)) {
  const a = pid === playerId(state) ? meOf(state) : state.actors?.list?.find(x => x.who === pid);
  if (!a || state.places?.live?.area !== KD_RANGE.area) return null;
  const kd = KD_RANGE.kd;
  if (kd) for (const d of [200, 300, 500]) {
    const L = kd.lanes.find(l => { const b = l.points[d].box; return a.x >= b[0] && a.x <= b[2] && a.z >= b[1] && a.z <= b[3]; });
    if (L) return d;
  }
  return rangeOf(state)?.course === 'kd' && a.x < KD_RANGE.bay.targetX ? 25 : null;
}
/** The KD lane a shooter's line puts them on (their face), or null. */
export const kdLaneAt = (state, pid = playerId(state)) => {
  const a = pid === playerId(state) ? meOf(state) : state.actors?.list?.find(x => x.who === pid), kd = KD_RANGE.kd;
  if (!a || !kd) return null;
  return kd.lanes.reduce((best, L) => (Math.abs(L.z - a.z) < Math.abs((best?.z ?? Infinity) - a.z) ? L : best), null)?.lane ?? null;
};
// (a face's carrier height now: the pits' view of the session's record (pits.js faceUpAt), up off the course)
const faceUp = (state, lane) => faceUpAt(state.armoury?.range, lane, state.clock.ms);

/** What the shooter may aim at (see the header): [{ key, kind, x, z, dM, lane, name, paper, far? }], the cards or the faces left to right, then the people. */
export function targetsOf(state, pid = playerId(state)) {
  const me = meOf(state);
  if (!me) return [];
  const half = frameHalf(state), out = [], area = state.places?.live?.area;
  if (area === KD_RANGE.area) {
    const R = rangeOf(state), own = R?.lane ?? null, line = lineOf(state, pid);
    if (R?.turners?.length) {
      // (0.0.8: the pairs course's turners, their facing now (see the header); the cards behind them are not its targets)
      for (const t of turnerTargets(state, state.clock.ms)) {
        if (!inLeadFrame(me, t.x, t.z, half)) continue;
        out.push({ ...t, dM: Math.hypot(t.x - me.x, t.z - me.z), name: `the target, lane ${t.lane}` });
      }
    } else if (line && line !== 25 && KD_RANGE.kd) {
      // (a KD line: the twenty faces, far ones too (the far window is the frame for them: VIEWS §2.4))
      const ownKd = R?.kdLane ?? kdLaneAt(state, pid);
      for (const L of KD_RANGE.kd.lanes) {
        const f = L.face, up = faceUp(state, L.lane), y = f.downY + (f.upY - f.downY) * up;
        out.push({ key: `face:${L.lane}`, kind: 'paper', x: f.x, z: f.z, y, dM: Math.hypot(f.x - me.x, f.z - me.z), lane: L.lane, line, name: L.lane === ownKd ? 'your target' : `target ${L.lane}`,
          paper: f.paper ?? 'kdA', far: !inLeadFrame(me, f.x, f.z, half), up });
      }
    } else for (const L of KD_RANGE.bay.lanes) {
      const t = L.target, y = t.centreY ?? 0.6;
      if (!inLeadFrame(me, t.x, t.z, half)) continue;
      out.push({ key: `paper:${L.lane}`, kind: 'paper', x: t.x, z: t.z, y, dM: Math.hypot(t.x - me.x, t.z - me.z), lane: L.lane, name: L.lane === own ? 'your card' : `the lane ${L.lane} card`,
        paper: R?.course === 'kd' ? 'zero25' : 'card25', ...(line === 25 ? { line } : {}) });
    }
  }
  out.sort((a, b) => a.x - b.x || a.z - b.z);
  const people = [];
  for (const a of state.actors?.list ?? []) {
    if (a === me || !a.who || !inLeadFrame(me, a.x, a.z, half)) continue;
    const p = state.people?.[a.who];
    people.push({ key: a.id, kind: 'person', x: a.x, z: a.z, y: a.y ?? 0, dM: Math.hypot(a.x - me.x, a.z - me.z), lane: null, name: p ? `${p.service?.rank ?? ''} ${p.name?.family ?? ''}`.trim() : a.id, who: a.who });
  }
  people.sort((a, b) => a.x - b.x || a.z - b.z);
  return [...out, ...people];
}
/** A target by its key, if in the frame now. */
export const targetOf = (state, key, pid = playerId(state)) => (key ? targetsOf(state, pid).find(t => t.key === key) ?? null : null);

/** After a rapid string, how long the far window stays on your face once the pits have marked it (s): the rise and the look. */
export const FAR_MARK_HOLD_S = 6;
/**
 * The far point the far window shows (VIEWS §2.4; the build sheet §2.1): the aimed target, else the bracketed one, else
 * (looking: E held, or a rapid string being marked) your own face, when it lies outside the lead's frame: { key, x, y,
 * z, rangeM, lane, line, why: 'aim' | 'bracket' | 'look' | 'marking', label: 'TARGET 10 · 300 M' }, or null.
 */
export function farPointOf(state, pid = playerId(state), { looking = false } = {}) {
  const S = state.stop, list = targetsOf(state, pid), by = (k) => (k ? list.find(t => t.key === k) ?? null : null);
  const R = rangeOf(state), ownKd = R?.kdLane ?? kdLaneAt(state, pid);
  // (a rapid string marked together after CEASE FIRE: the window stays on your face until its holes have been up
  // FAR_MARK_HOLD_S, so the string is seen landing (the design review's of v0.0.7: it closed at CEASE FIRE, the ten
  // holes marked while you unloaded))
  const str = R?.course === 'kd' ? R.strings?.at(-1) : null, lastId = str?.shots?.at(-1) ?? null;
  const lastRec = lastId && KD_STRINGS[str.id]?.marked === 'after' ? R.shots?.find(x => x.id === lastId) ?? null : null;
  const marking = !!lastRec && !R.hot && !R.end && (!lastRec.marked || state.clock.ms - lastRec.marked < FAR_MARK_HOLD_S * 1000);
  const pick = [[by(S?.aim?.key), 'aim'], [by(S?.pick), 'bracket'], [looking || marking ? list.find(t => t.key === `face:${ownKd}`) ?? null : null, looking ? 'look' : 'marking']].find(([t]) => t?.far);
  if (!pick) return null;
  const [t, why] = pick, line = t.line ?? lineOf(state, pid);
  return { key: t.key, x: t.x, y: t.y, z: t.z, rangeM: Math.round(t.dM), lane: t.lane, line, why, label: `TARGET ${t.lane} · ${line ?? Math.round(t.dM)} M` };
}

// ---- the mode ----

/** The view the hud reads (see the header): { mode, phase, pick, aim, held, doing, queue, reflex }, or null. */
export function stopNow(state) {
  const S = state.stop;
  if (!S) return null;
  const held = S.aim ? heldOf(state, S.who, state.clock.ms, S.aim.key) : null;
  return { mode: S.mode, phase: S.phase, pick: S.pick, aim: S.aim, held, doing: S.doing, queue: S.queue ?? [], reflex: S.reflex ?? null };
}

/**
 * Into the mode (see the header). via 'ready' (G: the rifle brought up as the first step), 'shoot' (X) or 'contact' (a
 * contact's pause, contact.js: pick the bracketed target, contact { id, ms } for the fact; stop.via written then only).
 */
export function enterStop(state, bus, { pid = playerId(state), gunId = gunOn(state, pid), via = 'shoot', pick = null, contact = null } = {}) {
  const me = meOf(state);
  if (state.skip) return { ok: false, why: 'skip' };
  if (!me || !gunId || !gunOf(state, gunId)) return { ok: false, why: 'no rifle' };
  if (state.stop?.mode === 'stop') return { ok: false, why: 'in the mode' };
  if (state.stop?.mode === 'live' || state.time?.doing) return { ok: false, why: 'busy' };
  if (rangeOf(state)?.end) return { ok: false, why: 'the line is clear' };
  me.headRad ??= headOf(me.face ?? 'right');
  // (your own: on a KD line your face (KD lane 6 + your bay lane, the session's kdLane), on the bay your card)
  const list = targetsOf(state, pid), R = rangeOf(state);
  const own = (pick ? list.find(t => t.key === pick) : null) ?? list.find(t => t.key === `face:${R?.kdLane ?? kdLaneAt(state, pid)}`) ?? list.find(t => t.kind === 'paper' && t.lane === R?.lane)
    ?? list.find(t => t.kind === 'turner' && t.lane === R?.lane) ?? list[0] ?? null;
  state.stop = { mode: 'stop', who: pid, gun: gunId, phase: 'choose', pick: own?.key ?? null, aim: null, doing: null, queue: [], reflex: null, keep: {} };
  if (via === 'contact') state.stop.via = 'contact';
  holdTime(state, 'stop');
  bus?.emit('stop-mode', { phase: 'enter', who: pid, gun: gunId, via, why: null, ...(via === 'contact' ? { contact: contact ? { id: contact.id ?? null, ms: contact.ms ?? null } : null } : {}) });
  // (no 'line' of its own: "Time stands still." is the instinct line's lead, and a toast would say it twice)
  if (via === 'ready' && slung(postureOf(state, pid))) chooseStep(state, bus, { step: 'up' });
  return { ok: true, why: null };
}

/** Out of the mode (see the header): only while choosing, unless the scene or a forced exit says so. Returns whether it left. */
export function leaveStop(state, bus, why = 'player') {
  const S = state.stop;
  if (!S || S.mode !== 'stop') return false;
  if (why === 'player' && S.phase !== 'choose') return false;
  if (why === 'player' && S.reflex) return false;
  releaseTime(state, 'stop');
  releaseTime(state, 'reflex');
  // (0.0.10: a Breathe the scene's exit cut short (the line stopped under it) closes its window where it stands)
  if (S.doing?.kind === 'breathe') breatheEnd(state, bus, S.doing.who, Math.min(state.clock.ms, S.doing.untilMs), { cut: true, fromPts: S.doing.breathePool ?? null });
  const me = meOf(state);
  if (me && me.headRad !== undefined) { me.face = faceOfHead(me.headRad); delete me.headRad; }
  state.stop = null;
  bus?.emit('stop-mode', { phase: 'leave', who: S.who, gun: S.gun, via: null, why });
  return true;
}

// ---- the steps ----

const tempoOk = (action, tempo) => (tempo === 'normal' ? true : (actionOf(action)?.tempo ?? []).includes(tempo));
const subOdds = (roller, action, pressure = 'evaluated') => {
  const A = actionOf(action);
  if (!A || A.dc === undefined || A.dc === null) return { odds: null, routine: null };
  const wh = roller.value('weapons'), mods = roller.mods('weapons');
  return { odds: oddsOf(wh, A.dc, mods), routine: isRoutine({ value: wh, dc: A.dc, mods, pressure, procedure: true }) };
};
const actionStep = (state, roller, gun, action, kind = 'single') => {
  const o = subOdds(roller, action);
  return { id: action, kind, label: LABELS[action] ?? action, ms: actionMs(roller, gun, action, { tempo: 'normal' }),
    rushMs: tempoOk(action, 'rushed') ? actionMs(roller, gun, action, { tempo: 'rushed' }) : null,
    carefulMs: tempoOk(action, 'careful') ? actionMs(roller, gun, action, { tempo: 'careful' }) : null,
    odds: o.routine ? null : o.odds, routine: o.routine, off: null, subs: [{ id: action, label: LABELS[action] ?? action, ms: actionMs(roller, gun, action, { tempo: 'normal' }) }], cmd: false, skill: o.odds === null ? null : 'weapons' };
};

// (what a reach's row says it would bring, as believed: "(5 ball)", "(5)", "(a few)", "(?)")
const FEEL_ROW = Object.freeze({ none: 'empty', few: 'a few', half: 'about half', most: 'nearly full', full: 'full' });
function reachLabel(state, pid, gun, id) {
  const place = actionPlace(id), fams = modelOf(gun)?.fams ?? null;
  const pk = place ? pickMag(state, pid, { from: place, fams, load: meantLoad(state) }) : null, m = pk ? state.items[pk.id] : null;
  if (!m) return LABELS[id] ?? id;
  const n = believedN(m), k = believedKind(m), more = place === 'ground' ? atFeetOf(state, pid).length : place ? (pouchOf(state, pid, place)?.mags.length ?? 1) : 1;
  // (in the I card's words: "5 ball", "5, kind not seen", "empty", a weight's band; "front of 2" the first of two in
  // the pouch, never the cryptic "1 of 2" (the fixer's, 0.0.6))
  const what = n !== null ? (n === 0 ? 'empty' : k ? `${n} ${k}` : `${n}, kind not seen`) : m.belief?.feel ? `${FEEL_ROW[m.belief.feel]} by its weight` : '?';
  return `${LABELS[id] ?? id} (${what}${more > 1 ? ` · front of ${more}` : ''})`;
}

// ---- 0.0.7: the line's rows (see the header) ----

const row = (id, kind, label, ms, o = {}) => ({ id, kind, label, ms, rushMs: null, carefulMs: null, odds: null, routine: null, off: null, subs: [], cmd: false, skill: null, words: label, ...o });
const signed = (n) => (n > 0 ? `+${n}` : String(n));
const clampHold = (v) => Math.max(-HOLD_MAX_MRAD, Math.min(HOLD_MAX_MRAD, Math.round(v / HOLD_STEP_MRAD) * HOLD_STEP_MRAD)) || 0;
// (the face a hold or a read is for: the aimed, the bracketed, else your own)
function faceFor(state, pid) {
  const S = state.stop, list = targetsOf(state, pid), R = rangeOf(state);
  return list.find(t => t.key === S?.aim?.key && t.kind === 'paper') ?? list.find(t => t.key === S?.pick && t.kind === 'paper')
    ?? list.find(t => t.key === `face:${R?.kdLane ?? kdLaneAt(state, pid)}`) ?? list.find(t => t.kind === 'paper' && t.lane === R?.lane) ?? null;
}
// (the call not yet marked dialled, whether or not the turrets stand at it: the confirm's (R.call), else the zero's last
// group's while the zero is open; an older group's call is never offered, the last group's pooled read stands for them all)
function callWaiting(state) {
  const R = rangeOf(state);
  if (!R) return null;
  const c = R.call?.clicks && !R.call.dialled && (R.call.clicks.elev || R.call.clicks.wind) ? R.call : null;
  if (c) return { call: c, clicks: c.clicks, want: c.want ?? null };
  const g = R.stage === 'zero' && !R.zeroed ? R.groups?.at(-1) : null;
  return g?.call && !g.call.dialled && (g.call.elev || g.call.wind) ? { call: g.call, clicks: { elev: g.call.elev, wind: g.call.wind }, want: g.want ?? null } : null;
}
// (the call's clicks not yet on the turrets: its want less the turrets, or the whole call when it has no want)
const callLeft = (p, s) => (p.want ? { elev: p.want.elev - s.elev, wind: p.want.wind - s.wind } : { ...p.clicks });
// (the player's rifle on the line: the call is theirs)
const callGun = (state) => gunOf(state, state.stop?.gun ?? gunOn(state, playerId(state)));
/**
 * The coach's call waiting to be dialled (the session's: the confirm's call, else the zero's last group's), or null:
 * { call, clicks, want }. None once the turrets stand at its want: dialled by the keys, it is dialled (callReached).
 */
export function pendingCall(state) {
  const p = callWaiting(state), gun = p?.want ? callGun(state) : null;
  if (gun) { const s = sightOf(gun); if (s.elev === p.want.elev && s.wind === p.want.wind) return null; }
  return p;
}
// (the call's dial as the log says it: "Dialled fourteen down, seven right: the zero moves with it.")
function callDialledLine(state, bus, clicks, { id, gunId, pid }) {
  const w = clickWords(clicks).replace(/\.$/, '');
  const text = `Dialled ${w.charAt(0).toLowerCase()}${w.slice(1)}: the zero moves with it.`;
  logEntry(state, bus, { kind: 'note', tone: 'note', text, step: id, gun: gunId, who: pid });
  return text;
}
/**
 * A call dialled by the keys (Z S, Shift Q D: 'sight:elev:±n', 'sight:wind:±n'), or any dial that brings the turrets
 * to the call's want, counts as the call dialled, as the row does: marked dialled, the believed zero moved by its
 * clicks once, the same log line (the verifier's, on the user's report of 2026-11-07: dialled by the keys, the call
 * stayed on the panel past "Leave the turrets alone." and the row then dialled it twice; at 300 m the card asked for
 * the call back off). Returns the log's text, or null.
 */
function callReached(state, bus, gun, ctx) {
  const p = callWaiting(state);
  if (!p?.want || !gun || gun !== callGun(state)) return null;
  const s = sightOf(gun);
  if (s.elev !== p.want.elev || s.wind !== p.want.wind) return null;
  p.call.dialled = true;
  const z = beliefZero(gun);
  believeZero(gun, { elev: z.elev + p.clicks.elev, wind: z.wind + p.clicks.wind });
  return callDialledLine(state, bus, p.clicks, ctx);
}
/** The row for a 0.0.7 step id, whether the panel lists it or not (see the header), or null. */
export function lineRow(state, id, ms = state.clock.ms) {
  const S = state.stop, pid = S?.who ?? playerId(state), gun = gunOf(state, S?.gun), me = meOf(state);
  if (!gun || !me) return null;
  const roller = rollerOf(state, pid, { ms }), b = beliefOf(state, S.gun), line = lineOf(state, pid);
  let m;
  if ((m = /^sight:(elev|wind):([+-]?\d+)$/.exec(id))) {
    const n = Number(m[2]), dir = m[1] === 'elev' ? (n > 0 ? 'up' : 'down') : n > 0 ? 'right' : 'left';
    const off = !n ? 'nothing to dial' : Math.abs((m[1] === 'elev' ? b.sight.elev : b.sight.wind) + n) > TURRET_MAX_CLK ? 'the turret\'s end' : null;
    return row(id, 'sight', `Dial ${Math.abs(n)} ${dir}`, dialMs(roller, n), { off, clicks: m[1] === 'elev' ? { elev: n, wind: 0 } : { elev: 0, wind: n } });
  }
  if ((m = /^sight:dope:(\d+)$/.exec(id))) {
    const d = Number(m[1]), want = b.dope?.[d];
    if (!want) return null;
    const ce = want.elev - b.sight.elev, cw = want.wind - b.sight.wind, n = Math.abs(ce) + Math.abs(cw);
    const words = n ? clickWords({ elev: ce, wind: cw }).replace(/\.$/, '').toLowerCase() : 'set';
    return row(id, 'sight', `Dope for ${d} m: ${words}`, dialMs(roller, n), { off: n ? null : 'set already', clicks: { elev: ce, wind: cw } });
  }
  if (id === 'sight:call') {
    const p = pendingCall(state);
    if (!p) return row(id, 'sight', LABELS['sight:call'], 0, { off: 'no call to dial' });
    // (the clicks still to dial: some may be on already by the keys, and the row never dials them twice)
    const left = callLeft(p, sightOf(gun)), n = Math.abs(left.elev) + Math.abs(left.wind);
    return row(id, 'sight', `Dial the coach's call: ${clickWords(left).replace(/\.$/, '').toLowerCase()}`, dialMs(roller, n), { clicks: left });
  }
  if (id.startsWith('hold:')) {
    const face = faceFor(state, pid), cur = S.hold ?? { xMil: 0, yMil: 0 };
    let to = null, label;
    if (id === 'hold:centre') { to = { xMil: 0, yMil: 0 }; label = LABELS['hold:centre']; }
    else if (id === 'hold:read' || id === 'hold:call') {
      const R = rangeOf(state), wb = id === 'hold:read' ? (R?.reads?.[pid] ?? S.read ?? null) : R?.call ?? null;
      if (!wb || !face) return row(id, 'hold', id === 'hold:read' ? 'Hold for your read' : 'Hold for the coach', 0, { off: id === 'hold:read' ? 'read the flags first' : 'no call yet' });
      to = id === 'hold:call' && Array.isArray(wb.holdMil) ? { xMil: wb.holdMil[0], yMil: wb.holdMil[1] ?? 0 }
        : (() => { const p = poiOf(state, pid, S.gun, face, { ms, belief: true, crossMs: wb.crossMs, hold: null }); return { xMil: holdFor({ windCm: p.terms.find(t => t.key === 'wind').windCm }, face.dM).xMil, yMil: cur.yMil ?? 0 }; })();
      label = `${id === 'hold:read' ? 'Hold for your read' : 'Hold for the coach'}: ${holdWords(to)}`;
    } else {
      const xy = /^hold:(-?[\d.]+),(-?[\d.]+)$/.exec(id);
      if (!xy) return null;
      to = { xMil: clampHold(Number(xy[1])), yMil: clampHold(Number(xy[2])) };
      label = `Hold ${holdWords(to)}`;
    }
    const same = (to.xMil ?? 0) === (cur.xMil ?? 0) && (to.yMil ?? 0) === (cur.yMil ?? 0);
    return row(id, 'hold', label, HOLD_SHIFT_MS, { off: same ? 'held so' : null, hold: to });
  }
  if (id === 'read') return row(id, 'read', `${LABELS.read}`, readMs(roller), { off: line ? null : 'nothing to read here' });
  if (id === 'optic:1' || id === 'optic:4') {
    const mag = Number(id.slice(6));
    return row(id, 'optic', LABELS[id], opticMs(), { off: b.optic === mag ? 'set already' : null, mag });
  }
  if (id === 'stance:sit') return row(id, 'stance', LABELS['stance:sit'], stanceMsOf(me.stance ?? 'stand', 'sit', roller.value('fitness')), { off: me.stance === 'sit' ? 'sitting already' : null });
  return null;
}
// (the line's rows the panel lists, on a KD line or the zero card's line only (test-handling's panel unchanged))
function lineRows(state, pid) {
  const line = lineOf(state, pid), me = meOf(state);
  if (!line) return [];
  const b = beliefOf(state, state.stop.gun), out = [];
  const add = (id) => { const r = lineRow(state, id); if (r && !(r.off && /set already|held so|no call|sitting already|nothing to dial/.test(r.off))) out.push(r); };
  add('sight:call');
  if (line !== 25) add(`sight:dope:${line}`);
  if (line !== 25) { add('hold:call'); add('hold:read'); if ((state.stop.hold?.xMil ?? 0) || (state.stop.hold?.yMil ?? 0)) add('hold:centre'); add('read'); }
  add(b.optic === 4 ? 'optic:1' : 'optic:4');
  // (the turrets click by click and a hold mark by mark are the hud's keys ('sight:elev:±n', 'hold:x,y'), not rows: the
  // panel keeps the call, the dope and the holds a line needs (my call: four more rows would push the commands off it))
  if (me?.stance !== 'sit') add('stance:sit');
  return out;
}

/** The longest wait for a mark (ms): the pits' slowest cycle (reaction 2 s, the carrier 2 s down, a failed marking 6 s, 2 s up) and room. */
export const MARK_WAIT_MS = 20_000;
/**
 * Whether the shooter's next slow-fire pull would come before their mark (see the stepsOf note): { down } while the
 * string is hot and marked shot by shot, their aim on their own face, and their last shot not yet marked or the face
 * not up; null otherwise.
 */
export function markWaitOf(state, pid, aimT, ms = state.clock.ms) {
  const R = rangeOf(state);
  if (!R || R.course !== 'kd' || !R.hot || !aimT || aimT.kind !== 'paper' || !aimT.lane || aimT.lane !== R.kdLane) return null;
  if (KD_STRINGS[R.string]?.marked !== 'each') return null;
  const str = R.strings?.at(-1), shots = str?.shots ?? [];
  const down = faceUpAt(R, aimT.lane, ms) < FACE_DOWN_UP;
  if (!down && (!shots.length || markedFor(R, aimT.lane, ms, shots))) return null;
  return { down };
}

/** The steps the panel offers now (see the header). */
export function stepsOf(state, ms = state.clock.ms) {
  const S = state.stop;
  if (!S || S.mode !== 'stop') return [];
  const pid = S.who, gun = gunOf(state, S.gun), me = meOf(state);
  if (!gun || !me) return [];
  const roller = rollerOf(state, pid, { ms }), belief = beliefOf(state, S.gun), posture = postureOf(state, pid), out = [];
  const stance = me.stance ?? 'stand', fit = roller.value('fitness');
  // (knocked down by a wound: no stance while wounds.js downOf holds you down, then each stance as from prone)
  const down = stance === 'down', lying = down && downOf(state.people?.[pid]?.body, ms).down, from = down ? 'prone' : stance;
  const stances = lying ? [] : STANCES.filter(s => s !== stance).map(to => ({ id: `stance:${to}`, kind: 'stance', label: LABELS[`stance:${to}`], ms: stanceMsOf(from, to, fit), rushMs: null, carefulMs: null,
    odds: null, routine: null, off: null, subs: [], cmd: false, skill: null, key: stance === 'sit' || down ? null : STANCES.indexOf(to) > STANCES.indexOf(stance) ? STANCE_KEYS.down : STANCE_KEYS.up }));
  // (0.0.8: the pairs bay has no tower: the coach runs it, and in a standby you wait for the turn)
  const R0 = rangeOf(state), waitLabel = R0?.course === 'pairs' && !R0.end ? (R0.cmd?.id === 'standby' && R0.str && !R0.str.done ? 'Wait for the turn' : 'Wait for the coach') : LABELS.wait;
  const wait = { id: 'wait', kind: 'wait', label: waitLabel, ms: WAIT_MAX_MS, rushMs: null, carefulMs: null, odds: null, routine: null, off: null, subs: [], cmd: false, skill: null };
  const leave = { id: 'leave', kind: 'leave', label: LABELS.leave, ms: 0, rushMs: null, carefulMs: null, odds: null, routine: null, off: null, subs: [], cmd: false, skill: null };
  // (0.0.10: Breathe where the model offers it: fixed with nothing facing you, a single marked "! he's up" with a threat up (see the header))
  const br = breatheRow(state, pid, ms);
  if (slung(posture)) return shaking(roller, [...(br && !br.later ? [br] : []), ...canDo(state, pid, S.gun).map(a => actionStep(state, roller, gun, a)), ...stances, ...(br?.later ? [br] : []), wait, leave]);
  // (1 Fire: at the aim, the gun as the holder believes it)
  const aimT = S.aim ? targetOf(state, S.aim.key, pid) : null, pull = pullMsOf(state, pid, S.gun);
  const h = aimT ? heldOf(state, pid, ms, aimT.key) : null;
  // (at a contact's pause with the man facing and standing: the panel is the contact's (see the header))
  const live = S.via === 'contact' && contactLive(state, ms), stepwise = live && rungOfShooter(state, pid) < RUNG_AIM;
  const fireOff = stepwise && belief.mode === 'safe' ? 'off safe first' : !aimT ? 'aim first' : belief.mode === 'safe' ? 'on safe' : belief.chamber === 'empty' ? 'chamber empty' : (belief.stoppage || belief.chamber === 'dud' || belief.chamber === 'case') ? 'a stoppage' : null;
  const pl = aimT ? plaqueOf(state, pid, { target: aimT, ms }) : null;
  const fire = { id: 'fire', kind: 'fire', label: aimT ? `Fire at ${aimT.name}` : LABELS.fire, ms: pull.ms, rushMs: Math.round(pull.ms * TEMPO.rushed.timeK),
    carefulMs: h && h.v < HELD_MAX ? (h.toFullMs ?? 0) + pull.ms : null, odds: pl?.odds ?? null, routine: false, off: fireOff, subs: [{ id: 'fire', label: LABELS.fire, ms: pull.ms }], cmd: false, skill: 'marksmanship', target: aimT?.key ?? null };
  // (slow fire on a KD face: the pits mark each shot; a pull before your mark is warned, and the wait for it offered
  // (the reviewers' of v0.0.7: the relay and the player fired five rounds in 8 s into faces going down))
  const mw = markWaitOf(state, pid, aimT, ms), Rl = rangeOf(state);
  if (mw) fire.warn = mw.down ? 'the target is down: wait for your mark' : 'wait for your mark';
  // (the line cold with rounds in it: the first press is the coach's warning, the second the stop; marked before either
  // (the runtime review's of v0.0.7, as v0.0.6 marks RELOAD's "one magazine a string"))
  else if (Rl && !Rl.end && !Rl.hot && Rl.cmd && !fireOff) fire.warn = 'the line is cold';
  // (2 Aim at the bracketed target, or Hold the aim already on it)
  const pickT = S.pick ? targetOf(state, S.pick, pid) : null;
  let aimRow;
  if (pickT && S.aim?.key !== pickT.key) aimRow = { id: 'aim', kind: 'aim', label: `Aim at ${pickT.name}`, ms: aimMsOf(state, pid, S.gun, pickT), rushMs: null, carefulMs: null, odds: null, routine: null, off: null, subs: [], cmd: false, skill: 'weapons', target: pickT.key,
    // (on a range, a rifle aimed at a person stops the line at once: said on the row before the press does it)
    ...(pickT.kind === 'person' && Rl && !Rl.end ? { warn: 'a person: the range stops' } : {}) };
  else if (aimT) aimRow = { id: 'hold', kind: 'hold', label: LABELS.hold, ms: h?.toFullMs ?? 0, rushMs: null, carefulMs: null, odds: null, routine: null, off: h && h.v >= HELD_MAX ? 'steady' : null, subs: [], cmd: false, skill: 'marksmanship', target: aimT.key };
  else aimRow = { id: 'aim', kind: 'aim', label: LABELS.aim, ms: null, rushMs: null, carefulMs: null, odds: null, routine: null, off: 'nothing in the frame to aim at', subs: [], cmd: false, skill: 'weapons' };
  // (0.0.8: the contact's rows that lead (a no-shoot identified), the shot rows, Fire and the aim, the contact's others (see the header))
  const cRows = contactRows(state, pid, ms) ?? [];
  // (a row struck by its gate goes after the contact's, so the recruit's Fire and Aim stay on the panel's first rows)
  const sRows = shotRows(state, pid, ms), gated = (r) => !!r.gate && r.off === `Marksmanship ${r.gate.v}`;
  // (below rung 2 at the pause, step by step: Off safe on safe, then the aim, then the rows and Fire (see the header))
  const singles0 = canDo(state, pid, S.gun), offSafe = stepwise && belief.mode === 'safe' && singles0.includes('selector:semi') ? { ...actionStep(state, roller, gun, 'selector:semi'), promoted: true } : null;
  if (stepwise && aimRow.kind === 'aim' && !aimRow.off) out.push(...cRows.filter(r => r.lead), ...(offSafe ? [offSafe] : []), aimRow, ...sRows.filter(r => !gated(r)), fire, ...cRows.filter(r => !r.lead), ...sRows.filter(gated));
  else out.push(...cRows.filter(r => r.lead), ...(offSafe ? [offSafe] : []), ...sRows.filter(r => !gated(r)), fire, aimRow, ...cRows.filter(r => !r.lead), ...sRows.filter(gated));
  if (br && !br.later) out.push(br);
  // (the Corps' commands, the tower's current first)
  // (UNLOAD, SHOW CLEAR is shown to the coach on the tower's command, so the panel offers it only once the
  // tower has said it: before then the coach is not looking, and the row would sit in the panel all course)
  const R = rangeOf(state), now = R?.cmd?.id ?? null;
  const built = macrosFor(state, pid, S.gun, { observerId: now === 'clear' ? coachOf(state) : null }).map(m => macroRow(state, roller, gun, belief, m));
  // (0.0.8: the reloads by their purpose in place of the built ones, where they stood (specials.js reloadRows))
  const at = built.findIndex(r => RELOAD_PURPOSE[r.macro]), macros = built.filter(r => !RELOAD_PURPOSE[r.macro]);
  if (at >= 0) macros.splice(at, 0, ...reloadRows(state, pid, ms));
  macros.sort((a, b) => Number(b.cmd) - Number(a.cmd) || Number(!!b.first) - Number(!!a.first));
  // (a macro halted on a failure: the rest of it, first of the commands, as the panel's 'carry on')
  if (S.queue?.length) {
    const q = S.queue, ms = q.reduce((t, a) => t + actionMs(roller, gun, a, { tempo: 'normal' }), 0);
    let odds = 1, routine = true;
    for (const a of q) { const o = subOdds(roller, a); if (o.odds !== null && !o.routine) { odds *= o.odds; routine = false; } }
    out.push({ id: 'queue', kind: 'command', label: `Carry on: ${q.map(a => LABELS[a] ?? a).join(', ')}`, ms, rushMs: null, carefulMs: null, odds: routine ? null : odds, routine, off: null,
      subs: q.map(a => ({ id: a, label: LABELS[a] ?? a, ms: actionMs(roller, gun, a, { tempo: 'normal' }) })), cmd: false, skill: 'weapons', macro: null, queue: [...q] });
  }
  // (0.0.8, the integrator's: on the bay of turners a bolt believed locked on an empty puts RELOAD at the panel's head,
  // over Fire struck and the aim (COMBAT §25.6.5, "Empty. Reload."); test-handling's and test-range's panels keep their order)
  const dry = R?.turners?.length ? macros.findIndex(r => r.first && r.purpose === 'speed' && !r.off) : -1;
  if (dry >= 0) out.unshift(...macros.splice(dry, 1));
  // (a man facing you: the commands that are no answer to him wait after the singles; Top up stays where it answers, at
  // half or less with a fuller one at hand (the runtime review: "Top up 4.2 s" fifth with a full magazine in))
  const answers = (r) => r.queue || r.cmd || r.purpose === 'speed' || r.purpose === 'retain' || (r.purpose === 'tactical' && halfOrLess(belief) && fullerAtHand(state, pid, S.gun, belief));
  const later = live ? macros.filter(r => !answers(r)).map(r => Object.assign(r, { later: true })) : [];
  out.push(...macros.filter(r => !later.includes(r)));
  // (0.0.7: the line's rows: the call, the dope, the hold, the read, the lever, the turrets, sitting (see the header))
  out.push(...lineRows(state, pid));
  // (the singles the belief allows, the selector first: off safe before a string and on safe at its end are the
  // singles a shooter takes most, and canDo's order put them past the panel's first page behind the magazine's
  // five (the integrator's, played by the keys); the postures apart, as V's)
  // (the R-7's lever won't go to safe with the hammer down: Safe struck with why, Charge before it (the runtime
  // review: offered, it rolled, took its time and halted with nothing said))
  const hammerDown = !belief.cocked && !!modelOf(gun)?.safeNeedsCocked;
  const singles = singles0, first = (a) => (hammerDown && a === 'charge' ? -1 : a.startsWith('selector:') ? 0 : 1);
  // (a man facing you: Lock back and the magazine out are no answer to him either (see the header))
  const noAnswer = (a) => live && (a === 'lockBack' || a.startsWith('magOut') || (belief.mag === 'in' && actionKey(a) === 'reach') || (belief.chamber === 'live' && (a === 'pressCheck' || a === 'magCheck')));
  const tail = [];
  for (const a of singles.filter(x => !x.startsWith('posture:') && !(offSafe && x === 'selector:semi')).sort((a, b) => first(a) - first(b))) {
    const st = actionStep(state, roller, gun, a);
    if (a === 'selector:safe' && hammerDown) st.off = 'hammer down: charge first';
    (noAnswer(a) ? tail : out).push(noAnswer(a) ? Object.assign(st, { later: true }) : st);
  }
  out.push(...stances, ...later, ...tail, ...(br?.later ? [br] : []));
  for (const a of singles) if (a.startsWith('posture:')) out.push(actionStep(state, roller, gun, a, 'posture'));
  if (mw) out.push({ ...wait, id: 'wait:mark', label: LABELS['wait:mark'], ms: MARK_WAIT_MS });
  out.push(wait, leave);
  // (a reach's row says what it would bring; a step that would seat another magazine mid-string is marked, not struck)
  for (const st of out) if (actionKey(st.id) === 'reach' && actionPlace(st.id)) st.label = reachLabel(state, pid, gun, st.id);
  const hold = handMagOf(state, pid)?.id ?? null;
  for (const st of out) {
    const subs = st.kind === 'command' ? (st.queue ?? (st.macro ? subsOf(st.macro, belief) : [])) : [st.id];
    if (!subs.some(a => a === 'seat' || a === 'magIn')) continue;
    // (a drill that strips the rifle's own magazine into the hand first seats that one again (REMEDIAL ACTION's double
    // feed drill): no other magazine, no mark (the fixer's, 0.0.6: it was marked "! one magazine a string")
    const strips = subs.findIndex(a => a === 'magOut:strip'), seats = subs.findIndex(a => a === 'seat' || a === 'magIn');
    const would = strips >= 0 && strips < seats && gun.mag ? gun.mag
      : hold ?? (subs.includes('reach') || subs.includes('magIn') ? pickMag(state, pid, { from: 'rule', fams: modelOf(gun)?.fams ?? null, load: meantLoad(state) })?.id ?? null : null);
    const w = oneMagWarn(state, would) ?? kindWarn(state, would ? state.items[would] : null);
    if (w) st.warn = w;
  }
  return shaking(roller, out);
}

/**
 * Breathe's row (see the header), or null where supp.js breatheOffer does not offer it: { id: 'breathe', kind: 'breathe',
 * label, ms: BREATHE_MS, subs: its four, promoted } with nothing facing, { …, later, warn: 'up' } with a threat up.
 */
export function breatheRow(state, pid = playerId(state), ms = state.clock.ms) {
  const o = breatheOffer(state, pid, ms);
  if (!o.ok) return null;
  const subs = BREATHE_WORDS.map(w => ({ id: 'breathe', label: w.replace(/\.$/, ''), ms: BREATHE_SUB_MS }));
  return o.up ? row('breathe', 'breathe', LABELS.breathe, BREATHE_MS, { subs, later: true, warn: 'up' }) : row('breathe', 'breathe', LABELS.breathe, BREATHE_MS, { subs, promoted: true });
}

// (0.0.9: a row whose odds the chaos holds under SHAKING_ODDS is marked "! shaking", never struck (combat/supp.js; COMBAT
// §25.18.1); the slung panel's rows too, its Rifle up the first a recruit dropped onto his sling needs (the code review's))
function shaking(roller, out) {
  if (roller.felt > 0) for (const st of out) {
    if (st.odds === null || st.odds === undefined || st.odds >= SHAKING_ODDS || !st.skill) continue;
    const m = suppMod(roller.felt, st.skill);
    if (!m) continue;
    st.shaking = { v: m.v, felt: roller.felt, band: bandOf(roller.felt) };
    if (!st.warn) st.warn = 'shaking';
    st.routine = false;
  }
  return out;
}

/**
 * A Corps command as the panel's row (see the header): { id: 'macro:<id>', kind: 'command', label, ms, rushMs, carefulMs, odds,
 * routine, off, subs, cmd, skill, macro }; m macrosFor's ({ id, label, ms }). cmd: ◉ on the macro that completes the
 * tower's current command, never one that only answers it: UNLOAD is not shown to the coach, so at 'clear' only UNLOAD,
 * SHOW CLEAR is marked (the runtime review: two rows marked, the first costing 4.1 s of the pace scored).
 */
export function macroRow(state, roller, gun, belief, m) {
  const subs = subsOf(m.id, belief), now = rangeOf(state)?.cmd?.id ?? null;
  let odds = 1, routine = true;
  for (const a of subs) { const o = subOdds(roller, a); if (o.odds !== null && !o.routine) { odds *= o.odds; routine = false; } }
  const rushable = subs.some(a => tempoOk(a, 'rushed')), careful = subs.some(a => tempoOk(a, 'careful'));
  const mark = markOfMacro(m.id);
  return { id: `macro:${m.id}`, kind: 'command', label: m.label, ms: m.ms ?? macroMs(roller, gun, m.id, belief, 'normal'),
    rushMs: rushable ? macroMs(roller, gun, m.id, belief, 'rushed') : null, carefulMs: careful ? macroMs(roller, gun, m.id, belief, 'careful') : null,
    odds: routine ? null : odds, routine, off: null, subs: subs.map(a => ({ id: a, label: LABELS[a] ?? a, ms: actionMs(roller, gun, a, { tempo: 'normal' }) })),
    cmd: !!now && (Array.isArray(mark) ? mark.includes(now) : mark === now), skill: 'weapons', macro: m.id };
}

// ---- a step chosen ----

/** The step the shooter is doing now, for the stage (see the header): { step, i, action, k, fromMs, toMs, frame } or null. */
export function stepNow(state, pid = playerId(state), ms = state.clock.ms) {
  const d = state.stop?.who === pid ? state.stop.doing : null;
  if (!d) return null;
  const action = d.list[d.i] ?? null, from = d.subFromMs ?? d.fromMs, to = d.untilMs;
  const k = to > from ? Math.max(0, Math.min(1, (ms - from) / (to - from))) : 1;
  return { step: d.step, i: d.i, action, k, fromMs: from, toMs: to, frame: null };
}

// (a step's record as the 'step' fact carries it)
const stepFact = (d, phase, extra = {}) => ({ phase, who: d.who, step: d.step, i: d.i, action: d.list?.[d.i] ?? null, fromMs: d.subFromMs ?? d.fromMs, toMs: d.untilMs, ...extra });

/** Begin a step (the panel's or a live one): its first sub-step rolled and applied at the clock. */
function startStep(state, bus, st, { tempo = 'normal', target = null, mode = 'stop' } = {}) {
  const S = state.stop, now = state.clock.ms;
  // (0.0.8: a shot row's parts, planned at its start (specials.js rowPlan); the row's off safe at no time from rung 2)
  const plan = st.kind === 'shot' ? rowPlan(state, S.who, st.id, targetOf(state, st.target, S.who), { tempo, atMs: now, gunId: S.gun, odds: false }) : null;
  const list = st.queue ? [...st.queue] : plan ? plan.parts.map(p => p.k) : st.kind === 'command' ? subsOf(st.macro, beliefOf(state, S.gun))
    : st.kind === 'fire' ? (tempo === 'careful' ? ['hold', 'fire'] : ['fire']) : st.kind === 'contact' && st.subs?.length ? st.subs.map(x => (typeof x === 'string' ? x : x.id))
    : st.kind === 'breathe' ? Array.from({ length: Math.round(BREATHE_MS / BREATHE_SUB_MS) }, () => 'breathe') : [st.id];
  const t = (tempo === 'careful' && (st.kind === 'fire' || st.kind === 'shot')) || st.kind === 'breathe' ? 'normal' : tempo;
  // (taps: v0.0.5's follow-ups, retired (COMBAT §25.6.4); the field kept so a step's saved record keeps its shape)
  const d = { who: S.who, step: st.id, kind: st.kind, tempo: t, list, subs: [], i: 0, fromMs: now, subFromMs: now, untilMs: now, cmd: st.cmd ? rangeOf(state)?.cmd?.id ?? null : null,
    chain: false, target: target ?? st.target ?? null, taps: 0 };
  if (plan) {
    d.plan = keptPlan(plan);
    const g = gunOf(state, S.gun);
    if (plan.offSafe && g) g.mode = 'semi';
  }
  S.doing = d;
  S.phase = 'act';
  S.queue = [];
  releaseTime(state, 'stop');
  bus?.emit('step', stepFact(d, 'start', { ok: null, grade: null, routine: null, mishap: null, text: st.label ?? st.id, mode }));
  onStepStart(state, bus, d);
  runSub(state, bus, d, 0, now);
  advance(state, bus);
  return d;
}

/** Roll and apply sub-step i at atMs (its boundary): its time, its effects at once, the rest at its end. */
function runSub(state, bus, d, i, atMs) {
  const S = state.stop, pid = S.who, gunId = S.gun, me = meOf(state), id = d.list[i];
  d.i = i; d.subFromMs = atMs;
  const rec = { action: id, ms: 0, ok: null, grade: null, routine: null, mishap: null };
  let text = LABELS[id] ?? id;
  if (d.plan && (id === 'press' || id === 'round' || id === 'shift')) {
    // (0.0.8: a shot row's part (specials.js): the finger on for the press and the rounds)
    if (id !== 'shift') setFinger(state, pid, 'on');
    const r = runRowSub(state, bus, d, i, atMs);
    rec.ms = r.ms; text = r.text;
    if (r.shot) { rec.shot = r.shot.id; rec.ok = r.shot.fired; }
  } else if (id.startsWith('contact:')) {
    // (0.0.8: a contact's row (contact.js): Hold him's hold is the hold below; the challenge is its own)
    const r = runContactSub(state, bus, d, id, atMs) ?? { ms: 0, text: id };
    rec.ms = r.ms ?? 0; text = r.text ?? text;
  } else if (id === 'aim') {
    const T = targetOf(state, d.target ?? S.pick, pid);
    if (!T) { d.cut = true; rec.ms = 0; }
    else {
      rec.ms = aimMsOf(state, pid, gunId, T);
      // (rounded to 1e-6 rad before it is saved: TECH §8.1 rule 11, so an off-axis aim saves the same bits everywhere)
      d.aimFrom = me?.headRad ?? 0; d.aimTo = q(Math.atan2(T.z - me.z, T.x - me.x), 1e-6); d.aimKey = T.key;
      S.pick = T.key; S.aim = null;
      setPosture(state, pid, 'aimed');
      text = `The R-7 comes onto ${T.name}.`;
    }
  } else if (id === 'hold') {
    const h = S.aim ? heldOf(state, pid, atMs, S.aim.key) : null;
    rec.ms = h?.toFullMs ?? 0;
  } else if (id === 'fire') {
    const T = S.aim ? targetOf(state, S.aim.key, pid) : null;
    setFinger(state, pid, 'on');
    const { ms, shot } = resolveShot(state, bus, { pid, gunId, target: T, tempo: d.tempo });
    rec.ms = ms; rec.shot = shot.id; rec.ok = shot.fired;
    recordShot(state, bus, shot);
    if (S.aim && shot.fired) S.aim.settledMs = atMs + ms;
    if (!shot.fired) d.gunStop = 'click';
    else if (shot.stoppage) d.gunStop = 'stop';
    text = shot.fired ? (shot.hole ? `Bang. ${shot.roll?.verb ?? ''}` : 'Bang.') : (REFUSALS[shot.why] ?? 'Click.');
  } else if (id.startsWith('sight:') || id.startsWith('hold:') || id === 'read' || id.startsWith('optic:')) {
    // (0.0.7: the line's rows (see the header): their effect at the sub-step's start, as a single's)
    const r = lineRow(state, id, atMs), gun = gunOf(state, gunId);
    rec.ms = r?.ms ?? 0;
    if (!r || r.off) { d.cut = true; rec.ms = 0; }
    else if (r.kind === 'sight') {
      const turned = dial(gun, r.clicks);
      text = turned.n ? `${clickWords(turned).replace(/\.$/, '')} on the turrets.` : 'The turrets are where they were.';
      if (id === 'sight:call') {
        // (the call as it waited before the turn: the turrets now stand at its want, where pendingCall offers nothing)
        // (the believed zero moves by the part of the call now on the turrets: all of it, unless a turret's end stopped it)
        const p = callWaiting(state), on = p ? (() => { const l = callLeft(p, sightOf(gun)); return { elev: p.clicks.elev - l.elev, wind: p.clicks.wind - l.wind }; })() : turned;
        if (p) { p.call.dialled = true; const z = beliefZero(gun); believeZero(gun, { elev: z.elev + on.elev, wind: z.wind + on.wind }); }
        // (the log says the believed zero went with the turrets, so an "on zero" after it is no surprise (the user's report,
        // 2026-11-07: "I dialed in the coaches corrections, the UI still says that I'm on zero ?"))
        if (turned.n) text = callDialledLine(state, bus, on, { id, gunId, pid });
      } else if (turned.n) text = callReached(state, bus, gun, { id, gunId, pid }) ?? text;
      if (S.aim) S.aim.settledMs = Math.max(S.aim.settledMs, atMs + rec.ms);
    } else if (r.kind === 'hold') {
      if (!(r.hold.xMil ?? 0) && !(r.hold.yMil ?? 0)) delete S.hold; else S.hold = { xMil: r.hold.xMil ?? 0, yMil: r.hold.yMil ?? 0 };
      text = `Holding ${holdWords(r.hold)}.`;
    } else if (r.kind === 'read') {
      const face = faceFor(state, pid), bearing = face ? Math.atan2(face.z - me.z, face.x - me.x) : (me?.headRad ?? 0);
      const w = readWind(state, pid, { atMs, bearingRad: bearing, rangeM: face?.dM ?? 300 });
      const rd = { crossMs: w.crossMs, band: w.band, atMs };
      const R = rangeOf(state);
      if (R) (R.reads ??= {})[pid] = rd; else S.read = rd;
      // (nothing across: what the flags do, never "hang" while they stand out: wind.js windWords' flags)
      const STILL = { limp: 'The flags hang: no wind to speak of.', front: 'The flags stand out toward you: nothing across.', behind: 'The flags stand out toward the targets: nothing across.', light: 'The flags stir: nothing across to speak of.' };
      text = STILL[w.flags] ?? `The flags: ${w.speedWord} ${w.fromWord}.`;
    } else if (r.kind === 'optic') {
      setOptic(gun, r.mag);
      text = r.mag === 4 ? 'Four power.' : 'One power.';
      if (S.aim) S.aim.settledMs = Math.max(S.aim.settledMs, atMs + rec.ms);
    }
  } else if (id.startsWith('stance:')) {
    const to = id.slice(7), from = me?.stance ?? 'stand';
    rec.ms = stanceMsOf(from, to, rollerOf(state, pid).value('fitness'));
    d.stanceTo = to;
    noteTick(state, { moving: true });
    S.aim = null;
    if (postureOf(state, pid) === 'aimed') setPosture(state, pid, 'lowReady');
  } else if (id === 'breathe') {
    // (0.0.10: a sub-step of Breathe: its fixed time, no roll, never × the chaos's time factor; the window at its first)
    rec.ms = BREATHE_SUB_MS;
    if (i === 0) { const b = breatheStart(state, bus, pid, atMs); d.breathePool = b?.pool ?? null; }
    text = BREATHE_WORDS[i] ?? BREATHE_WORDS[0];
  } else if (id === 'wait') {
    rec.ms = WAIT_MAX_MS;
  } else if (id === 'wait:mark') {
    rec.ms = MARK_WAIT_MS;
  } else if (id === 'functionCheck' && beliefOf(state, gunId)?.chamber !== 'empty') {
    // (nobody pulls the trigger on a rifle they believe has a round in it: the rest of a macro carried on after a
    // look found one stops here (the code review's: "Carry on" after the coach's "Hold." fired it into the berm))
    rec.ok = false; d.halt = true;
    text = 'Not with a round in it: clear it and look again.';
    bus?.emit('line', { text, kind: 'warn' });
  } else {
    // (a magazine about to come out with one still up the spout: the coach says so first, once a string (handling.js spoutCheck))
    if (actionKey(id) === 'reach' || id.startsWith('magOut')) spoutCheck(state, bus, id);
    const r = doAction(state, bus, { pid, gunId, action: id, tempo: d.tempo, pressure: 'evaluated', observerId: id === 'show' ? coachOf(state) : null, deferSay: id === 'show' });
    if (id === 'magCheck') spoutCheck(state, bus, id);
    if (r.say) d.say = r.say;                                       // (the coach's word when his look ends: endSub)
    if (id.startsWith('posture:') || id === 'up' || id === 'stow') noteTick(state, { moving: true });
    if (r.nd) noteTick(state, { nd: true, ndGrade: r.nd.grade ?? null });
    if (r.fired?.fired) rec.brass = recordDischarge(state, bus, pid, r.fired, atMs, `${d.step}:${i}`);
    // (a refusal the hand feels at once (the lever on a dead hammer, no magazine to put in) is said, not only halted)
    if (r.refused && r.text) bus?.emit('line', { text: r.text, kind: 'warn' });
    Object.assign(rec, { ms: r.ms ?? 0, ok: r.ok ?? null, grade: r.grade ?? null, routine: r.routine ?? null, mishap: r.mishap ?? null });
    if (r.text) text = r.text;
    if (r.halts) d.halt = true;
    if (r.nd) d.nd = r.nd;
    if (r.ejects?.length) rec.brass = [...(rec.brass ?? []), ...recordEjects(state, pid, r.ejects, atMs, `${d.step}:${i}`)];
    if (id === 'finger') setFinger(state, pid, 'off');
    if (id.startsWith('posture:') || id === 'stow' || id === 'up') S.aim = null;
    else if (S.aim && HANDS_OFF.has(actionKey(id))) S.aim.settledMs = Math.max(S.aim.settledMs, atMs + rec.ms);   // (hands off the aim: it settles again after: tradecraft)
    // (a magazine seated: the scene's one magazine a string)
    if (r.magIn && !r.dropSpare && !r.refused) magSeated(state, bus, r.magIn);
  }
  // (a shot row's aim and hold take the plan's time (rushed ×0.6), their effects as above)
  if (d.plan && (id === 'aim' || id === 'hold') && !d.cut) rec.ms = d.plan.parts[i]?.ms ?? rec.ms;
  const brass = rec.brass?.length ? rec.brass : null;
  delete rec.brass;
  d.subs.push(rec);
  d.untilMs = atMs + rec.ms;
  bus?.emit('step', stepFact(d, 'sub', { ok: rec.ok, grade: rec.grade, routine: rec.routine, mishap: rec.mishap, text, ...(brass ? { brass } : {}) }));
}

// (a sub-step's end: its effects that land there)
// (the sub-steps that touch nothing of the rifle's working parts: the hands stay as they were; 0.0.6's magazine in the
// hand too, all but the seat, which is the old magazine in's hand on the well, so a LOAD soils the hands as v0.0.5's did)
const CLEAN_SUBS = new Set(['aim', 'hold', 'fire', 'wait', 'finger', 'show', 'observe', 'reach', 'lookMag', 'stowMag', 'dumpMag', 'dropMag', 'breathe']);
// (the hands after a sub-step: the rifle's oil and carbon, or the ground's regolith; the build sheet 0.0.6 §2.1)
function soilOf(state, bus, id, stanceTo) {
  if (!id) return;
  const pid = playerId(state);
  if (id.startsWith('stance:')) {
    if ((stanceTo === 'kneel' || stanceTo === 'prone' || stanceTo === 'sit') && areaOf(state.places?.live?.area)?.kind === 'ground') soil(state, pid, { k: HANDS.REGOLITH, why: 'regolith' }, state.clock.ms, bus);
    return;
  }
  // (0.0.7: the turrets, the lever, the hold and a read touch none of the working parts)
  if (!CLEAN_SUBS.has(actionKey(id)) && !['dial', 'optic', 'holdmark', 'read'].includes(rowKey(id))) soil(state, pid, { k: HANDS.RIFLE_SUB, why: 'rifle' }, state.clock.ms, bus);
}

function endSub(state, bus, d) {
  const S = state.stop, me = meOf(state), id = d.list[d.i];
  soilOf(state, bus, id, d.stanceTo);
  if (id === 'aim' && d.aimKey) {
    if (me) { me.headRad = d.aimTo; me.face = faceOfHead(d.aimTo); }
    S.aim = { key: d.aimKey, settledMs: d.untilMs };
  } else if (id && id.startsWith('stance:') && me) {
    if (d.stanceTo === 'stand') delete me.stance; else me.stance = d.stanceTo;
  } else if (id === 'show' && d.say) {
    // (the coach looks into the chamber, then says what he saw: "Clear." at the look's end, not its start)
    sayObserved(state, bus, d.say);
    delete d.say;
  } else if (id && id.startsWith('contact:')) endContactSub(state, bus, d, id);
  else if (d.plan && id === 'shift') endRowSub(state, bus, d);
}

/** The doing advanced to the clock (see the header): boundaries taken, sub-steps rolled, the step ended. */
function advance(state, bus) {
  const S = state.stop;
  let d = S?.doing;
  const t = state.clock.ms;
  while (state.stop && S.doing === d && d && t >= d.untilMs) {
    if (d.kind === 'wait') { endStep(state, bus, 'end'); break; }
    endSub(state, bus, d);
    if (d.gunStop) { endStep(state, bus, 'stop'); break; }
    if (d.halt) { S.queue = queueAfter(state, d); endStep(state, bus, 'halt'); break; }
    if (d.cut) { endStep(state, bus, 'cut'); break; }
    if (d.i + 1 < d.list.length) runSub(state, bus, d, d.i + 1, d.untilMs);
    else { endStep(state, bus, 'end'); break; }
    d = S.doing;
  }
}

/**
 * The rest of a macro that halted, as the panel's "Carry on" (see the header). A look that found a round in the
 * chamber (the inspection, or the coach's "Hold. There's a round in it.") puts the round out and the look again
 * first, and the show again if it was the show, so carrying on never closes the bolt on it or pulls the trigger
 * on it (the code review's: carried on, the function check fired it into the berm); a look that missed looks
 * again.
 */
function queueAfter(state, d) {
  const id = d.list[d.i], rest = d.list.slice(d.i + 1), b = beliefOf(state, state.stop.gun);
  const round = !!b && b.chamber !== 'empty' && b.chamber !== '?';
  if (id === 'show' && round) return ['lockBack', 'inspect', 'show', ...rest];
  if (id === 'inspect' && round) return ['lockBack', 'inspect', ...rest];
  if (id === 'inspect' && b?.chamber === '?') return ['inspect', ...rest];
  return rest;
}

/** The step over (see the header): the chained wait, the reflex, or choosing again. */
function endStep(state, bus, why = 'end') {
  const S = state.stop, d = S?.doing;
  if (!d) return;
  const t = state.clock.ms;
  // (0.0.10: Breathe's window closed at its last sub-step's end, or where a cut stopped it (see the header))
  if (d.kind === 'breathe') d.shedPts = breatheEnd(state, bus, d.who, Math.min(t, d.untilMs), { cut: why !== 'end', fromPts: d.breathePool ?? null })?.shedPts ?? 0;
  bus?.emit('step', stepFact(d, why === 'halt' ? 'halt' : why === 'cut' ? 'cut' : 'end', { ok: why === 'end' || why === 'stop', grade: null, routine: null, mishap: null, text: why }));
  S.doing = null;
  if (S.mode === 'live') { state.stop = null; afterStep(state, bus, d, why); return; }
  afterStep(state, bus, d, why);
  if (state.stop !== S) return;                                     // (the scene ended the mode: the line clear, or stopped)
  // (0.0.8: while a contact's window is open no step's end holds time: the window runs at 1:1 to its pause (see the header))
  const windowOpen = !!pendingOf(state);
  if (why === 'stop' && d.gunStop) {
    S.phase = 'choose';
    if (!windowOpen) holdTime(state, 'stop');
    offerGunStop(state, bus, d.gunStop);
    return;
  }
  // (Sling it ends the mode: the rifle slung, nothing left to choose (the build sheet §2.1, §2.2; the code review's))
  if (why === 'end' && d.step === 'stow') { leaveStop(state, bus, 'stow'); return; }
  if (why === 'end' && d.kind !== 'wait' && !d.chain && chainable(state)) {
    S.doing = { who: S.who, step: 'wait', kind: 'wait', tempo: 'normal', list: ['wait'], subs: [], i: 0, fromMs: t, subFromMs: t, untilMs: t + WAIT_MAX_MS, cmd: null, chain: true, target: null, taps: 0 };
    S.phase = 'act';
    return;
  }
  S.phase = 'choose';
  if (!windowOpen) holdTime(state, 'stop');
}

// (whether the line is ready for the tower's current command: a step that made it so waits for the next)
const chainable = (state) => { const R = rangeOf(state); return !!R && !R.end && R.cmd && R.cmd.id !== 'end' && lineReady(state, R.cmd.id); };

/** The gun stopped mid-step (a click, a shot that did not cycle): the reflex card. */
function offerGunStop(state, bus, why) {
  const S = state.stop, roller = rollerOf(state, S.who), gun = gunOf(state, S.gun), belief = beliefOf(state, S.gun);
  const options = [
    { key: 'ia', label: 'Tap, rack', step: 'macro:ia', ms: macroMs(roller, gun, 'ia', belief, 'normal') },
    { key: 'look', label: 'Look at the port', step: 'observe', ms: actionMs(roller, gun, 'observe', { tempo: 'normal' }) },
  ];
  offerReflex(state, bus, { why: why === 'click' ? 'click' : 'stop', title: why === 'click' ? 'Click.' : "It didn't cycle.", options }, {
    run: (opt) => { if (opt.step) chooseStep(state, bus, { step: opt.step }); },
  });
}

/**
 * A step chosen (see the header): { step, tempo, target, keep }; 'pick:±1' moves the brackets and takes
 * no time; 'reflex:<key>' answers the card (keep: the answer kept for KEEP_MS); 'leave' is X. Returns { ok, why }.
 */
export function chooseStep(state, bus, { step, tempo = 'normal', target = null, keep = false } = {}, ctx = null) {
  const S = state.stop;
  if (!S || S.mode !== 'stop') return { ok: false, why: 'not in the mode' };
  if (state.skip) return { ok: false, why: 'skip' };
  if (typeof step !== 'string') return { ok: false, why: 'no step' };
  if (step.startsWith('reflex:')) {
    if (!S.reflex) return { ok: false, why: 'no reflex card' };
    const opt = chosenReflex(state, bus, step.slice(7), { keep });
    if (opt?.step) return chooseStep(state, bus, { step: opt.step });
    return { ok: true, why: null };
  }
  if (S.reflex) return { ok: false, why: 'a reflex card waits' };
  if (step === 'pick:-1' || step === 'pick:+1' || step.startsWith('pick=')) {
    const list = targetsOf(state, S.who);
    if (!list.length) return { ok: true, why: null };
    if (step.startsWith('pick=')) { const k = step.slice(5); if (list.some(t => t.key === k)) S.pick = k; return { ok: true, why: null }; }
    const i = list.findIndex(t => t.key === S.pick), n = step === 'pick:-1' ? -1 : 1;
    S.pick = list[(i < 0 ? 0 : i + n + list.length) % list.length].key;
    return { ok: true, why: null };
  }
  if (S.phase === 'act') {
    // (Fire during a fire step is busy like any other: v0.0.5's tap is retired for the shot rows (see the header))
    const d = S.doing;
    if (!d || d.kind !== 'wait') return { ok: false, why: 'busy' };
    bus?.emit('step', stepFact(d, 'cut', { ok: true, grade: null, routine: null, mishap: null, text: 'cut' }));
    S.doing = null; S.phase = 'choose';
  }
  if (step === 'leave') return { ok: leaveStop(state, bus, 'player'), why: null };
  if (target && step === 'aim') { if (targetOf(state, target, S.who)) S.pick = target; else return { ok: false, why: 'not in the frame' }; }
  // (0.0.7: a line's row asked by id though the panel does not list it (the hud's keys, the bots): taken as asked, on a line)
  const st = stepsOf(state).find(x => x.id === step) ?? (/^(sight:|hold:|optic:|read$|stance:sit$)/.test(step) && lineOf(state, S.who) ? lineRow(state, step) : null);
  if (!st) { if (S.phase === 'choose') holdTime(state, 'stop'); return { ok: false, why: 'not offered' }; }
  if (st.off) { if (S.phase === 'choose') holdTime(state, 'stop'); return { ok: false, why: st.off }; }
  const t = tempo === 'rushed' && st.rushMs !== null && st.rushMs !== undefined ? 'rushed' : tempo === 'careful' && st.carefulMs !== null && st.carefulMs !== undefined ? 'careful' : 'normal';
  if (st.kind === 'command' && st.macro) aheadOf(state, bus, st.macro);
  startStep(state, bus, st, { tempo: t, target });
  return { ok: true, why: null };
}

/** A step outside the mode (V, A, W: see the header). Returns { ok, why }. */
export function liveStep(state, bus, { pid = playerId(state), step } = {}) {
  const me = meOf(state);
  if (!me || state.skip || isHeld(state) || state.time?.doing) return { ok: false, why: 'busy' };
  if (state.stop) return { ok: false, why: state.stop.mode === 'stop' ? 'in the mode' : 'busy' };
  const gunId = gunOn(state, pid);
  let st;
  if (step.startsWith('stance:')) {
    const to = step.slice(7), from = me.stance ?? 'stand';
    if (to === from || !STANCES.includes(to)) return { ok: false, why: 'already' };
    st = { id: step, kind: 'stance' };
  } else if (step === 'breathe') {
    // (0.0.10: Breathe out of the mode, a live step with no rifle needed (see the header))
    const o = breatheOffer(state, pid, state.clock.ms);
    if (!o.ok) return { ok: false, why: o.why };
    st = { id: 'breathe', kind: 'breathe', label: LABELS.breathe };
  } else {
    if (!gunId || !canDo(state, pid, gunId).includes(step)) return { ok: false, why: 'not offered' };
    st = { id: step, kind: 'single' };
  }
  state.stop = { mode: 'live', who: pid, gun: gunId, phase: 'act', pick: null, aim: null, doing: null, queue: [], reflex: null, keep: {} };
  startStep(state, bus, st, { mode: 'live' });
  return { ok: true, why: null };
}

/** Breathe (the action 'breathe', the DI's T): a step in the mode, a live step out of it (see the header). Returns { ok, why }. */
export function breatheAction(state, bus) {
  if (state.stop?.mode === 'stop') return chooseStep(state, bus, { step: 'breathe' });
  return liveStep(state, bus, { pid: playerId(state), step: 'breathe' });
}

/** The carry action (V): the posture's other in the mode, a live step out of it; slung, the rifle up. */
export function carryAction(state, bus) {
  const pid = playerId(state), posture = postureOf(state, pid);
  const step = slung(posture) ? 'up' : posture === 'highReady' ? 'posture:lowReady' : 'posture:highReady';
  if (state.stop?.mode === 'stop') return chooseStep(state, bus, { step });
  return liveStep(state, bus, { pid, step });
}

/** The stance action (A up, W down, or a stance named): a step in the mode, a live step out of it. */
export function stanceAction(state, bus, dir) {
  const me = meOf(state);
  if (!me) return { ok: false, why: 'nobody' };
  const from = me.stance ?? 'stand', to = STANCES.includes(dir) ? dir : stanceStep(from, dir);
  if (to === from) return { ok: false, why: 'already' };
  if (state.stop?.mode === 'stop') return chooseStep(state, bus, { step: `stance:${to}` });
  return liveStep(state, bus, { step: `stance:${to}` });
}

// ---- the layers ----

/** The fast layer 'input' (runs while time stands still): the doing's boundaries (see the header); out of the mode, a move key stands a kneeling or prone player. */
export function stopInput(state, input, bus, ctx) {
  const S = state.stop;
  if (!S) {
    if (state.skip || isHeld(state)) return;
    const me = meOf(state);
    const feet = feetOf(state, input);   // (in a contact's window the keys are not the marine's: contact.js feetOf)
    if (me?.stance && (feet.mx || feet.mz)) liveStep(state, bus, { pid: me.who, step: 'stance:stand' });
    return;
  }
  if (!S.doing || isHeld(state)) return;
  // (the wait for the mark ends as the disk or the flag goes up on your face)
  if (S.doing.step === 'wait:mark' && !markWaitOf(state, S.who, S.aim ? targetOf(state, S.aim.key, S.who) : null, state.clock.ms)) { endStep(state, bus, 'end'); return; }
  advance(state, bus);
}

/** The fast layer 'rules', stop motion's part (see the header): the aim's turn as it plays, the shooter's facing held to the muzzle. */
export function stopRules(state, input, bus, ctx) {
  const S = state.stop;
  if (!S) return;
  const me = meOf(state), d = S.doing;
  if (!me) return;
  if (d && d.list[d.i] === 'aim' && d.aimTo !== undefined) {
    const k = d.untilMs > d.subFromMs ? Math.min(1, (state.clock.ms - d.subFromMs) / (d.untilMs - d.subFromMs)) : 1;
    me.headRad = q(d.aimFrom + wrap(d.aimTo - d.aimFrom) * k, 1e-6);
  }
  if (S.mode === 'stop' && me.headRad !== undefined) me.face = faceOfHead(me.headRad);
}

/** Whether a posture holds the rifle in the hands (POSTURES' inHand, slung otherwise). */
export const postureInHand = (posture) => POSTURES[posture]?.inHand ?? !slung(posture);
