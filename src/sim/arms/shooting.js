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
// (its effects land: the aim settles, the stance is taken), the next is rolled and applied there, a
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
// at the port, or nothing). Taps: Fire again inside a shot's recovery fires a follow-up at the same aim
// (tradecraft's tap(): TAP_SPLIT_S 0.25 s, a double from Marksmanship 8, a triple from 18).
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
// stepNow(state, pid, ms) is what the stage reads of a step (src/sim/arms/look.js: the action's frame
// and its share k); stopNow(state) is the hud's view. The range session's bookkeeping is the scene's
// (handling.js: lineReady, recordShot, afterStep, aheadOf, coachOf).
// Pure but enterStop, leaveStop, liveStep, chooseStep, stopInput, stopRules.
import { holdTime, releaseTime, isHeld } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { playerActor, playerId } from '../../core/ids.js';
import { headOf } from '../people/perception.js';
import { isRoutine, oddsOf, TEMPO } from '../skills/checks.js';
import { rollerOf } from '../combat/roll.js';
import { stanceMs, WAIT_MAX_MS, STANCES, stanceStep } from '../combat/steps.js';
import { offerReflex, chosenReflex } from '../combat/reflex.js';
import { aimMsOf, pullMsOf, heldOf, plaqueOf, resolveShot, tapsOf, TAP_SPLIT_S, HELD_MAX } from './shot.js';
import { ACTIONS, canDo, doAction, beliefOf, actionMs, REFUSALS, sayObserved } from './firearms.js';
import { modelOf } from './models.js';
import { macrosFor, subsOf, macroMs } from './drills.js';
import { POSTURES } from './carry.js';
import { AIM_LEAD_K, EDGE_KEEP_M, FRAME_HALF_M } from './look.js';
import { KD_RANGE } from '../../data/places/range.js';
import { lineReady, recordShot, recordEjects, recordDischarge, afterStep, aheadOf, coachOf, rangeOf, markOfMacro, onStepStart, noteTick } from '../scenarios/handling.js';

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
  show: 'Show clear', finger: 'Finger off', fire: 'Fire', aim: 'Aim', hold: 'Hold the aim', wait: 'Wait for the tower', leave: 'Stand easy',
  'stance:stand': 'Stand', 'stance:kneel': 'Kneel', 'stance:prone': 'Prone',
});
/**
 * The handling that takes a hand off the rifle's grip or the cheek off the stock, so the held aim settles again
 * after it (tradecraft's list: its dropMag, insertMag, release, rack, clear, chamber1; WEAPONS §7.1's "magazine,
 * charge, release, clear"): the thumb's work (the selector, the port cover), a look at the port and the finger
 * keep the aim (the parity review's: every step had reset it).
 */
export const HANDS_OFF = Object.freeze(new Set(['magIn', 'magOut:drop', 'magOut:dump', 'magOut:pouch', 'magOut:strip', 'charge', 'rack', 'release', 'lockBack', 'clearDouble',
  'pressCheck', 'magCheck', 'tap', 'inspect', 'show', 'functionCheck']));
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

/** What the shooter may aim at (see the header): [{ key, kind, x, z, dM, lane, name, paper }], the cards left to right, then the people. */
export function targetsOf(state, pid = playerId(state)) {
  const me = meOf(state);
  if (!me) return [];
  const half = frameHalf(state), out = [], area = state.places?.live?.area;
  if (area === KD_RANGE.area) {
    const own = rangeOf(state)?.lane ?? null;
    for (const L of KD_RANGE.bay.lanes) {
      const t = L.target, y = t.centreY ?? 0.6;
      if (!inLeadFrame(me, t.x, t.z, half)) continue;
      out.push({ key: `paper:${L.lane}`, kind: 'paper', x: t.x, z: t.z, y, dM: Math.hypot(t.x - me.x, t.z - me.z), lane: L.lane, name: L.lane === own ? 'your card' : `the lane ${L.lane} card`, paper: 'card25' });
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

// ---- the mode ----

/** The view the hud reads (see the header): { mode, phase, pick, aim, held, doing, queue, reflex }, or null. */
export function stopNow(state) {
  const S = state.stop;
  if (!S) return null;
  const held = S.aim ? heldOf(state, S.who, state.clock.ms, S.aim.key) : null;
  return { mode: S.mode, phase: S.phase, pick: S.pick, aim: S.aim, held, doing: S.doing, queue: S.queue ?? [], reflex: S.reflex ?? null };
}

/** Into the mode (see the header). via 'ready' (G: the rifle brought up as the first step) or 'shoot' (X). */
export function enterStop(state, bus, { pid = playerId(state), gunId = gunOn(state, pid), via = 'shoot' } = {}) {
  const me = meOf(state);
  if (state.skip) return { ok: false, why: 'skip' };
  if (!me || !gunId || !gunOf(state, gunId)) return { ok: false, why: 'no rifle' };
  if (state.stop?.mode === 'stop') return { ok: false, why: 'in the mode' };
  if (state.stop?.mode === 'live' || state.time?.doing) return { ok: false, why: 'busy' };
  if (rangeOf(state)?.end) return { ok: false, why: 'the line is clear' };
  me.headRad ??= headOf(me.face ?? 'right');
  const own = targetsOf(state, pid).find(t => t.kind === 'paper' && t.lane === rangeOf(state)?.lane) ?? targetsOf(state, pid)[0] ?? null;
  state.stop = { mode: 'stop', who: pid, gun: gunId, phase: 'choose', pick: own?.key ?? null, aim: null, doing: null, queue: [], reflex: null, keep: {} };
  holdTime(state, 'stop');
  bus?.emit('stop-mode', { phase: 'enter', who: pid, gun: gunId, via, why: null });
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
  const me = meOf(state);
  if (me && me.headRad !== undefined) { me.face = faceOfHead(me.headRad); delete me.headRad; }
  state.stop = null;
  bus?.emit('stop-mode', { phase: 'leave', who: S.who, gun: S.gun, via: null, why });
  return true;
}

// ---- the steps ----

const tempoOk = (action, tempo) => (tempo === 'normal' ? true : (ACTIONS[action]?.tempo ?? []).includes(tempo));
const subOdds = (roller, action, pressure = 'evaluated') => {
  const A = ACTIONS[action];
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

/** The steps the panel offers now (see the header). */
export function stepsOf(state, ms = state.clock.ms) {
  const S = state.stop;
  if (!S || S.mode !== 'stop') return [];
  const pid = S.who, gun = gunOf(state, S.gun), me = meOf(state);
  if (!gun || !me) return [];
  const roller = rollerOf(state, pid, { ms }), belief = beliefOf(state, S.gun), posture = postureOf(state, pid), out = [];
  const stance = me.stance ?? 'stand', fit = roller.value('fitness');
  const stances = STANCES.filter(s => s !== stance).map(to => ({ id: `stance:${to}`, kind: 'stance', label: LABELS[`stance:${to}`], ms: stanceMs(stance, to, { fitness: fit }), rushMs: null, carefulMs: null,
    odds: null, routine: null, off: null, subs: [], cmd: false, skill: null, key: STANCES.indexOf(to) > STANCES.indexOf(stance) ? STANCE_KEYS.down : STANCE_KEYS.up }));
  const wait = { id: 'wait', kind: 'wait', label: LABELS.wait, ms: WAIT_MAX_MS, rushMs: null, carefulMs: null, odds: null, routine: null, off: null, subs: [], cmd: false, skill: null };
  const leave = { id: 'leave', kind: 'leave', label: LABELS.leave, ms: 0, rushMs: null, carefulMs: null, odds: null, routine: null, off: null, subs: [], cmd: false, skill: null };
  if (slung(posture)) return [...canDo(state, pid, S.gun).map(a => actionStep(state, roller, gun, a)), ...stances, wait, leave];
  // (1 Fire: at the aim, the gun as the holder believes it)
  const aimT = S.aim ? targetOf(state, S.aim.key, pid) : null, pull = pullMsOf(state, pid, S.gun);
  const h = aimT ? heldOf(state, pid, ms, aimT.key) : null;
  const fireOff = !aimT ? 'aim first' : belief.mode === 'safe' ? 'on safe' : belief.chamber === 'empty' ? 'chamber empty' : (belief.stoppage || belief.chamber === 'dud' || belief.chamber === 'case') ? 'a stoppage' : null;
  const pl = aimT ? plaqueOf(state, pid, { target: aimT, ms }) : null;
  out.push({ id: 'fire', kind: 'fire', label: aimT ? `Fire at ${aimT.name}` : LABELS.fire, ms: pull.ms, rushMs: Math.round(pull.ms * TEMPO.rushed.timeK),
    carefulMs: h && h.v < HELD_MAX ? (h.toFullMs ?? 0) + pull.ms : null, odds: pl?.odds ?? null, routine: false, off: fireOff, subs: [{ id: 'fire', label: LABELS.fire, ms: pull.ms }], cmd: false, skill: 'marksmanship', target: aimT?.key ?? null });
  // (2 Aim at the bracketed target, or Hold the aim already on it)
  const pickT = S.pick ? targetOf(state, S.pick, pid) : null;
  if (pickT && S.aim?.key !== pickT.key) out.push({ id: 'aim', kind: 'aim', label: `Aim at ${pickT.name}`, ms: aimMsOf(state, pid, S.gun, pickT), rushMs: null, carefulMs: null, odds: null, routine: null, off: null, subs: [], cmd: false, skill: 'weapons', target: pickT.key });
  else if (aimT) out.push({ id: 'hold', kind: 'hold', label: LABELS.hold, ms: h?.toFullMs ?? 0, rushMs: null, carefulMs: null, odds: null, routine: null, off: h && h.v >= HELD_MAX ? 'steady' : null, subs: [], cmd: false, skill: 'marksmanship', target: aimT.key });
  else out.push({ id: 'aim', kind: 'aim', label: LABELS.aim, ms: null, rushMs: null, carefulMs: null, odds: null, routine: null, off: 'nothing in the frame to aim at', subs: [], cmd: false, skill: 'weapons' });
  // (the Corps' commands, the tower's current first)
  // (UNLOAD, SHOW CLEAR is shown to the coach on the tower's command, so the panel offers it only once the
  // tower has said it: before then the coach is not looking, and the row would sit in the panel all course)
  const R = rangeOf(state), now = R?.cmd?.id ?? null;
  const macros = macrosFor(state, pid, S.gun, { observerId: now === 'clear' ? coachOf(state) : null }).map(m => {
    const subs = subsOf(m.id, belief);
    let odds = 1, routine = true;
    for (const a of subs) { const o = subOdds(roller, a); if (o.odds !== null && !o.routine) { odds *= o.odds; routine = false; } }
    const rushable = subs.some(a => tempoOk(a, 'rushed')), careful = subs.some(a => tempoOk(a, 'careful'));
    // (◉ on the macro that completes the tower's command, never one that only answers it: UNLOAD is not shown to
    // the coach, so at 'clear' only UNLOAD, SHOW CLEAR is marked (the runtime review: two rows marked, the first
    // costing 4.1 s of the pace scored))
    const mark = markOfMacro(m.id);
    return { id: `macro:${m.id}`, kind: 'command', label: m.label, ms: m.ms ?? macroMs(roller, gun, m.id, belief, 'normal'),
      rushMs: rushable ? macroMs(roller, gun, m.id, belief, 'rushed') : null, carefulMs: careful ? macroMs(roller, gun, m.id, belief, 'careful') : null,
      odds: routine ? null : odds, routine, off: null, subs: subs.map(a => ({ id: a, label: LABELS[a] ?? a, ms: actionMs(roller, gun, a, { tempo: 'normal' }) })),
      cmd: !!now && (Array.isArray(mark) ? mark.includes(now) : mark === now), skill: 'weapons', macro: m.id };
  });
  macros.sort((a, b) => Number(b.cmd) - Number(a.cmd));
  // (a macro halted on a failure: the rest of it, first of the commands, as the panel's 'carry on')
  if (S.queue?.length) {
    const q = S.queue, ms = q.reduce((t, a) => t + actionMs(roller, gun, a, { tempo: 'normal' }), 0);
    let odds = 1, routine = true;
    for (const a of q) { const o = subOdds(roller, a); if (o.odds !== null && !o.routine) { odds *= o.odds; routine = false; } }
    out.push({ id: 'queue', kind: 'command', label: `Carry on: ${q.map(a => LABELS[a] ?? a).join(', ')}`, ms, rushMs: null, carefulMs: null, odds: routine ? null : odds, routine, off: null,
      subs: q.map(a => ({ id: a, label: LABELS[a] ?? a, ms: actionMs(roller, gun, a, { tempo: 'normal' }) })), cmd: false, skill: 'weapons', macro: null, queue: [...q] });
  }
  out.push(...macros);
  // (the singles the belief allows, the selector first: off safe before a string and on safe at its end are the
  // singles a shooter takes most, and canDo's order put them past the panel's first page behind the magazine's
  // five (the integrator's, played by the keys); the postures apart, as V's)
  // (the R-7's lever won't go to safe with the hammer down: Safe struck with why, Charge before it (the runtime
  // review: offered, it rolled, took its time and halted with nothing said))
  const hammerDown = !belief.cocked && !!modelOf(gun)?.safeNeedsCocked;
  const singles = canDo(state, pid, S.gun), first = (a) => (hammerDown && a === 'charge' ? -1 : a.startsWith('selector:') ? 0 : 1);
  for (const a of singles.filter(x => !x.startsWith('posture:')).sort((a, b) => first(a) - first(b))) {
    const st = actionStep(state, roller, gun, a);
    if (a === 'selector:safe' && hammerDown) st.off = 'hammer down: charge first';
    out.push(st);
  }
  out.push(...stances);
  for (const a of singles) if (a.startsWith('posture:')) out.push(actionStep(state, roller, gun, a, 'posture'));
  out.push(wait, leave);
  return out;
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
  const list = st.queue ? [...st.queue] : st.kind === 'command' ? subsOf(st.macro, beliefOf(state, S.gun)) : st.kind === 'fire' ? (tempo === 'careful' ? ['hold', 'fire'] : ['fire']) : [st.id];
  const t = tempo === 'careful' && st.kind === 'fire' ? 'normal' : tempo;
  const d = { who: S.who, step: st.id, kind: st.kind, tempo: t, list, subs: [], i: 0, fromMs: now, subFromMs: now, untilMs: now, cmd: st.cmd ? rangeOf(state)?.cmd?.id ?? null : null,
    chain: false, target: target ?? st.target ?? null, taps: 0 };
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
  if (id === 'aim') {
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
    const { ms, shot } = resolveShot(state, bus, { pid, gunId, target: T, tempo: d.tempo, follow: d.taps });
    rec.ms = ms; rec.shot = shot.id; rec.ok = shot.fired;
    recordShot(state, bus, shot);
    if (S.aim && shot.fired) S.aim.settledMs = atMs + ms;
    if (!shot.fired) d.gunStop = 'click';
    else if (shot.stoppage) d.gunStop = 'stop';
    text = shot.fired ? (shot.hole ? `Bang. ${shot.roll?.verb ?? ''}` : 'Bang.') : (REFUSALS[shot.why] ?? 'Click.');
  } else if (id.startsWith('stance:')) {
    const to = id.slice(7), from = me?.stance ?? 'stand';
    rec.ms = stanceMs(from, to, { fitness: rollerOf(state, pid).value('fitness') });
    d.stanceTo = to;
    noteTick(state, { moving: true });
    S.aim = null;
    if (postureOf(state, pid) === 'aimed') setPosture(state, pid, 'lowReady');
  } else if (id === 'wait') {
    rec.ms = WAIT_MAX_MS;
  } else if (id === 'functionCheck' && beliefOf(state, gunId)?.chamber !== 'empty') {
    // (nobody pulls the trigger on a rifle they believe has a round in it: the rest of a macro carried on after a
    // look found one stops here (the code review's: "Carry on" after the coach's "Hold." fired it into the berm))
    rec.ok = false; d.halt = true;
    text = 'Not with a round in it: clear it and look again.';
    bus?.emit('line', { text, kind: 'warn' });
  } else {
    const r = doAction(state, bus, { pid, gunId, action: id, tempo: d.tempo, pressure: 'evaluated', observerId: id === 'show' ? coachOf(state) : null, deferSay: id === 'show' });
    if (r.say) d.say = r.say;                                       // (the coach's word when his look ends: endSub)
    if (id.startsWith('posture:') || id === 'up' || id === 'stow') noteTick(state, { moving: true });
    if (r.nd) noteTick(state, { nd: true });
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
    else if (S.aim && HANDS_OFF.has(id)) S.aim.settledMs = Math.max(S.aim.settledMs, atMs + rec.ms);   // (hands off the aim: it settles again after: tradecraft)
  }
  const brass = rec.brass?.length ? rec.brass : null;
  delete rec.brass;
  d.subs.push(rec);
  d.untilMs = atMs + rec.ms;
  bus?.emit('step', stepFact(d, 'sub', { ok: rec.ok, grade: rec.grade, routine: rec.routine, mishap: rec.mishap, text, ...(brass ? { brass } : {}) }));
}

// (a sub-step's end: its effects that land there)
function endSub(state, bus, d) {
  const S = state.stop, me = meOf(state), id = d.list[d.i];
  if (id === 'aim' && d.aimKey) {
    if (me) { me.headRad = d.aimTo; me.face = faceOfHead(d.aimTo); }
    S.aim = { key: d.aimKey, settledMs: d.untilMs };
  } else if (id && id.startsWith('stance:') && me) {
    if (d.stanceTo === 'stand') delete me.stance; else me.stance = d.stanceTo;
  } else if (id === 'show' && d.say) {
    // (the coach looks into the chamber, then says what he saw: "Clear." at the look's end, not its start)
    sayObserved(state, bus, d.say);
    delete d.say;
  }
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
  bus?.emit('step', stepFact(d, why === 'halt' ? 'halt' : why === 'cut' ? 'cut' : 'end', { ok: why === 'end' || why === 'stop', grade: null, routine: null, mishap: null, text: why }));
  S.doing = null;
  if (S.mode === 'live') { state.stop = null; afterStep(state, bus, d, why); return; }
  afterStep(state, bus, d, why);
  if (state.stop !== S) return;                                     // (the scene ended the mode: the line clear, or stopped)
  if (why === 'stop' && d.gunStop) {
    S.phase = 'choose';
    holdTime(state, 'stop');
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
  holdTime(state, 'stop');
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

/** Fire again inside the shot's recovery: a follow-up at the same aim (see the header). */
function tap(state, bus) {
  const S = state.stop, d = S.doing, pid = S.who;
  const mrk = rollerOf(state, pid).value('marksmanship'), pull = pullMsOf(state, pid, S.gun), now = state.clock.ms;
  if (d.list[d.i] !== 'fire' || d.gunStop || !S.aim || d.taps + 1 >= tapsOf(mrk)) return { ok: false, why: 'no tap' };
  // (as the panel's Fire: a bolt believed locked back, an empty chamber or a stoppage is no follow-up (the code
  // review's: a tap after a string's last round pulled on the locked bolt and called a stoppage))
  const b = beliefOf(state, S.gun);
  if (b.locked || b.chamber === 'empty' || b.stoppage) return { ok: false, why: 'chamber empty' };
  if (b.mode !== 'semi' || now - d.subFromMs > pull.ms) return { ok: false, why: 'the moment has gone' };
  d.taps++;
  const T = targetOf(state, S.aim.key, pid);
  const { shot } = resolveShot(state, bus, { pid, gunId: S.gun, target: T, tempo: d.tempo, follow: d.taps });
  recordShot(state, bus, shot);
  d.subs.push({ action: 'fire', ms: 0, ok: shot.fired, shot: shot.id, tap: d.taps });
  if (!shot.fired) { d.gunStop = 'click'; d.untilMs = now + 150; return { ok: true, why: null }; }
  if (shot.stoppage) d.gunStop = 'stop';
  d.subFromMs = now;
  d.untilMs = now + Math.round(TAP_SPLIT_S * 1000) + shot.recoverMs;
  S.aim.settledMs = d.untilMs;
  return { ok: true, why: null };
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
    const d = S.doing;
    if (step === 'fire' && d?.kind === 'fire') return tap(state, bus);
    if (!d || d.kind !== 'wait') return { ok: false, why: 'busy' };
    bus?.emit('step', stepFact(d, 'cut', { ok: true, grade: null, routine: null, mishap: null, text: 'cut' }));
    S.doing = null; S.phase = 'choose';
  }
  if (step === 'leave') return { ok: leaveStop(state, bus, 'player'), why: null };
  if (target && step === 'aim') { if (targetOf(state, target, S.who)) S.pick = target; else return { ok: false, why: 'not in the frame' }; }
  const st = stepsOf(state).find(x => x.id === step);
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
  } else {
    if (!gunId || !canDo(state, pid, gunId).includes(step)) return { ok: false, why: 'not offered' };
    st = { id: step, kind: 'single' };
  }
  state.stop = { mode: 'live', who: pid, gun: gunId, phase: 'act', pick: null, aim: null, doing: null, queue: [], reflex: null, keep: {} };
  startStep(state, bus, st, { mode: 'live' });
  return { ok: true, why: null };
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
    if (me?.stance && (input?.mx || input?.mz)) liveStep(state, bus, { pid: me.who, step: 'stance:stand' });
    return;
  }
  if (!S.doing || isHeld(state)) return;
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
