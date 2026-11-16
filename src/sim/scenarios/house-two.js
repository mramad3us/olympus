// OLYMPUS scenarios: your number two in "Stack and clear" (test-shoothouse): his tower admin, his eyes and rows, his cover of you and his own stoppage, moved out of shoothouse.js byte for byte in v0.0.19's stage 0 (the build sheet's T0), so the team's track owns him alone.
//
// The model is shoothouse.js's header's ("The #2" and its 2026-11-12 and 2026-11-13 notes), unchanged: R.house.two is his
// record. The tower's commands go to him as to you (TWO_CMDS, twoCmd): his own Corps macro on his list doing, at the command
// plus his react.js goMs, each sub-step his firearms.js action at his own Weapon handling on his own stream ('house-two'),
// logged nowhere, timed by stepper.js advanceList (twoAdminTick), a halt planned again from his belief up to TWO_TRIES times,
// drawn as yours (handsOf). His eyes (twoTick): slot 2's stands, and yours while he covers you in the room you are in, seen by
// PEOPLE's sightOf from his own eyes (twoSees), taken in by react.js takeInMs, identified by an Awareness check against
// contact.js's IDENT_DC0 + range / IDENT_PER_M, then his row by specials.js rowPlan (twoPlan), each round by shot.js resolveShot
// at its formula time (twoFire). Whose a stand is goes through team.js ownerOf (twoOwns), the one reader of "whose man". His
// cover (twoCover, coverTick): your rifle down, "Covering!", his eyes on your man or your sector, your corner's men his until
// it is back, "Up." UP_WAIT_MS after. His stoppage (twoDrillOf, twoGunDown, twoGunUp): "Gun down!" (a dry rifle "Reloading!"),
// his drill on his list doing, "Gun up!" and back on his man.
//
// v0.0.19 (the team's track): his drill from what he believes (twoFixOf: plan.js planFor on his gun, 'fire'; v0.0.18's twoDrillOf
// read the truth and is kept only as the tests' reference), his "Gun up!" on his belief (fixReady), closing the call he opened
// with (W.down.said, team.js TEAM_WORDS' close: "Gun down!" by "Gun up!" though his IA turned into a reload); his P-12 where the loadout
// carries ~two:p12 (house-two's twoLacks and twoList for the tower: sidearm.js adminSubs, adminRun on his stream; twoTransition
// in a fight, an armed man facing him within TRANSITION_NEAR_M; twoRifleUp once nobody faces him, never while his rifle has
// nothing left to load as he believes it (planFor's `none`); twoPend the pistol's move at
// its sub-step's end, sidearm.js pistolDrawn and pistolHolstered); his sectors and your sector by side (team.js sideOf).
// The cycle with shoothouse.js (which re-exports these names, and whose houseOf, curLeg, planOf, noteSighting, houseShot,
// chiefSays, whole and actorOf this module calls) is of function references only: this module reads no shoothouse.js binding
// at its top level (the build sheet's §0 item 12), so either may load first (tests/import-order.test.mjs). Pure but the
// session it writes through the layers that call it.
import { q } from '../../core/num.js';
import { stream } from '../../core/rng.js';
import { playerId } from '../../core/ids.js';
import { HOUSE_CHIEF } from '../../data/courses.js';
import { SEEN } from '../people/perception.js';
import { check } from '../skills/checks.js';
import { rangeOf, sayOn } from './handling.js';
import { upHeard, adminSubs, adminMs, adminRun, weaponList, pistolDrawn, pistolHolstered } from '../arms/sidearm.js';
import { planFor } from '../arms/plan.js';
import { TRANSITION_NEAR_M } from '../arms/specials.js';
import { gunField, doAction, beliefOf, actionMs, tempoFor } from '../arms/firearms.js';
import { subsOf } from '../arms/drills.js';
import { enterStop, gunOn, faceOfHead } from '../arms/shooting.js';
import { SLUNG } from '../arms/carry.js';
import { facingOf, turnerTargets } from '../arms/turners.js';
import { resolveShot, aimMsOf, catchAhead, shotIdNext } from '../arms/shot.js';
import { ROWS, rowPlan, HAMMER_MAX_M, stillUp } from '../arms/specials.js';
import { rollerOf } from '../combat/roll.js';
import { takeInMs, goMs } from '../combat/react.js';
import { pendingOf, IDENT_DC0, IDENT_PER_M, CHALLENGE_MS } from '../combat/contact.js';
import { skillsOf, TWO_SAY } from '../combat/bundle.js';
import { advanceList } from '../combat/stepper.js';
import { ownerOf, sideOf, TEAM_WORDS } from '../combat/team.js';
import { seenK, drawnOn } from '../combat/men.js';
import { houseOf, curLeg, planOf, noteSighting, houseShot, chiefSays, whole, actorOf, pistolLacks, THREAT_FACES, TWO_FOLLOW_N } from './shoothouse.js';

// ---- the #2's admin: the tower's commands done by him (COMBAT §25.19.5) ----

/** The tower's commands your number two answers with his own Corps macro (drills.js MACROS: LOAD, MAKE READY, Stop's MAKE SAFE, UNLOAD SHOW CLEAR), and Standby with his "Ready." (COMBAT §25.19.5's table). */
export const TWO_CMDS = Object.freeze({ load: 'load', ready: 'ready', standby: 'standby', stop: 'safe', clear: 'clear' });
/** A macro of his that halts (a fumble that is not routine, the instructor's "Hold.") is planned again from his belief this many times, then the instructor puts it right (my call: never a dead end). */
export const TWO_TRIES = 3;
/** His "Ready." at Standby, whispered over his shoulder (ms; bundle.js CALL_S 0.8, the voice beat's own: a literal, since bundle.js and this module are in one cycle and a top-level read of CALL_S threw when bundle.js loaded first). */
const TWO_READY_MS = 800;

// (his rifle, its belief and his carry: the rifle on his sling, whatever is in his hands (v0.0.19: his P-12 drawn is not the tower's rifle))
const rifleOf2 = (state, pid) => state.people?.[pid]?.kit?.worn?.sling ?? gunOn(state, pid);
const twoGun = (state, W) => { const id = W?.pid ? rifleOf2(state, W.pid) : null; return id ? { id, gun: state.items[id], b: beliefOf(state, id), carry: state.people[W.pid]?.kit?.carry ?? {} } : null; };
/**
 * What your number two still lacks for a command (houseWant and the tower's readinesses read it): 'two:busy' while a macro of his
 * runs, 'two:mag', 'two:chamber', 'two:safe', 'two:low', 'two:show'; null when he is as the command wants him (or has none).
 */
export function twoLacks(state, cmd, { rifleOnly = false } = {}) {
  const H = houseOf(state), W = H?.two, g = twoGun(state, W);
  if (!g?.gun) return null;
  if (W.doing && !W.doing.beats) return 'two:busy';
  const mode = gunField(g.gun, 'mode'), safe = mode === 'safe' && (g.carry.finger ?? 'off') !== 'on';
  if (W.gaveUp?.[cmd]) return null;
  // (v0.0.19: his P-12, where he carries one (~two:p12), judged as yours is after his rifle: Condition 1 on safe in the holster at
  // MAKE READY ("a round up.", "on safe"), holstered on safe at Stop and SHOW CLEAR (shoothouse.js pistolLacks))
  const rifle = twoRifleLacks(state, W, g, cmd, safe);
  if (rifle || rifleOnly || !W.pistol || !state.items?.[W.pistol]) return rifle;
  if (cmd === 'ready') { const p = state.items[W.pistol], held = state.people[W.pid]?.kit?.worn?.holster === W.pistol; return !held ? 'two:safe' : gunField(p, 'chamber') !== 'live' ? 'two:chamber' : gunField(p, 'mode') !== 'safe' ? 'two:safe' : null; }
  if (cmd === 'stop' || cmd === 'clear') return pistolLacks(state, W.pid) ? 'two:safe' : null;
  return null;
}
// (his rifle's lack for a command (twoLacks, as v0.0.18 had it))
function twoRifleLacks(state, W, g, cmd, safe) {
  switch (cmd) {
    case 'load': return g.gun.mag ? null : 'two:mag';
    case 'ready': return !g.gun.mag ? 'two:mag' : gunField(g.gun, 'chamber') !== 'live' ? 'two:chamber' : !safe ? 'two:safe' : g.carry.posture !== 'lowReady' ? 'two:low' : null;
    case 'stop': return !safe ? 'two:safe' : g.carry.posture !== 'lowReady' ? 'two:low' : null;
    case 'clear': return W.shown ? null : 'two:show';
    default: return null;
  }
}
// (his sub-steps for a command, from his belief as yours are (drills.js subsOf): nothing where the command finds him so already)
function twoList(state, W, cmd) {
  const g = twoGun(state, W), macro = TWO_CMDS[cmd];
  if (!g?.gun || !macro) return [];
  if (macro === 'standby') return ['say:ready'];
  // (v0.0.19: his P-12's part of the tower's macro, after the rifle's (sidearm.js adminSubs: MAKE READY racks it, SHOW CLEAR clears
  // it, nothing where he carries none), and at Stop a pistol in his hand holstered first)
  const own = rifleList(state, W, g, macro), pistol = W.pistol ? adminSubs(state, W.pid, macro) : [];
  const out = macro === 'safe' && W.pistol && handGun(state, W) ? ['holster', ...own] : own;
  return pistol.length ? [...out, ...pistol] : out;
}
// (a pistol in his hand (his transition's), or null)
const handGun = (state, W) => { const k = state.people?.[W?.pid]?.kit, id = (k?.hands ?? []).find(h => h && h === W?.pistol); return id ?? null; };
// (his rifle's sub-steps for a command, as v0.0.18 had them)
function rifleList(state, W, g, macro) {
  // (a rifle that swung onto its sling (a fumble's) is brought up first, as the panel's Up is yours)
  const up = SLUNG.has(g.carry.posture ?? 'slungFront') ? ['up'] : [], low = g.carry.posture === 'lowReady' ? [] : ['posture:lowReady'];
  if (macro === 'load') return g.gun.mag ? [] : [...up, ...subsOf('load', g.b)];
  if (macro === 'ready') return gunField(g.gun, 'chamber') === 'live' && g.gun.mag ? [...up, ...low] : [...up, ...subsOf('ready', g.b), ...low];
  if (macro === 'safe') return twoLacks(state, 'stop', { rifleOnly: true }) ? subsOf('safe', g.b) : [];
  return [...up, ...subsOf(macro, g.b)];
}
// (a list's time before any fumble, at his own Weapon handling (firearms.js actionMs; the instructor's look at his Awareness))
function twoPlanMs(state, W, list) {
  const g = twoGun(state, W), roller = rollerOf(state, W.pid), H = houseOf(state), observer = H?.chiefPid ? rollerOf(state, H.chiefPid) : null;
  const p = W.pistol ? state.items?.[W.pistol] : null;
  return list.reduce((t, a) => t + (a === 'say:ready' ? TWO_READY_MS : a.startsWith('pistol:') ? adminMs(state, W.pid, a) : Math.round(actionMs(roller, (a === 'draw:thigh' || a === 'holster') && p ? p : g.gun, a, { tempo: tempoFor(a, 'normal'), observer }))), 0);
}
/**
 * A tower command given (houseOnCmd): your number two's macro for it on his own list doing (R.house.two.doing: { who, step
 * 'cmd:<macro>', kind 'command', cmd, macro, list, i, subs, fromMs, subFromMs, untilMs, planMs, tries }), begun at the command
 * plus his react.js goMs (his Warfighting's start), each sub-step his firearms.js action at his own Weapon handling, rolled
 * on his own stream (rng 'house-two') and logged nowhere (the log is yours), drawn as yours is (handsOf). Nothing when the
 * command finds him so already. Returns the doing or null.
 */
export function twoCmd(state, bus, cmd) {
  const H = houseOf(state), W = H?.two;
  if (!W?.pid || !TWO_CMDS[cmd] || !twoGun(state, W)?.gun) return null;
  if (cmd === 'clear') W.shown = false;
  // (a tower command over his own stoppage drill: the command's macro, planned from his rifle as it is, takes his hands)
  delete W.down;
  const list = twoList(state, W, cmd), now = state.clock.ms;
  if (!list.length) { if (W.doing && !W.doing.beats) W.doing = null; if (cmd === 'clear') W.shown = true; return null; }
  const at = whole(now + goMs(skillsOf(state, W.pid).wf));
  W.doing = { who: W.pid, step: `cmd:${TWO_CMDS[cmd]}`, kind: 'command', cmd, macro: TWO_CMDS[cmd], list, i: -1, subs: [], fromMs: at, subFromMs: null, untilMs: at, planMs: twoPlanMs(state, W, list), tries: 0 };
  return W.doing;
}
/** Your number two's admin advanced to the clock (houseActors, every lived tick, from the fill): each sub-step at its formula time, applied at its start; a halt planned again from his belief, at most TWO_TRIES times. */
export function twoAdminTick(state, bus, H, now = state.clock.ms) {
  const W = H?.two, d = W?.doing;
  if (!d || d.beats) return;
  const g = twoGun(state, W);
  if (!g?.gun) { W.doing = null; return; }
  // (the stepper's boundaries (stepper.js advanceList), his sub-step's effects here: the say, or his firearms.js action)
  const r = advanceList(state, bus, d, now, (st, b2, dd, i, at) => {
    const action = dd.list[i];
    // (v0.0.19: his P-12 drawn or holstered at the end of its sub-step, before the next (twoPend), as yours at the step's end)
    twoPend(st, W, dd);
    if (action === 'say:ready') { sayOn(st, b2, { who: W.pid, text: 'Ready.', kind: 'speech' }); return { action, ms: TWO_READY_MS, ok: true, grade: null, routine: true }; }
    // (his P-12's part of a tower macro: sidearm.js adminRun on his own stream, logged nowhere)
    if (action === 'pistol:ready' || action === 'pistol:clear') { const x = adminRun(st, b2, W.pid, action, dd, { rng: 'house-two', log: false }); return { action, ms: Math.max(0, Math.round(x.ms ?? 0)), ok: x.ok !== false, grade: null, routine: true }; }
    const gunId = (action === 'draw:thigh' || action === 'holster') && W.pistol ? W.pistol : dd.gun ?? g.id;
    const x = doAction(st, b2, { pid: W.pid, gunId, action, tempo: tempoFor(action, 'normal'), pressure: 'evaluated', observerId: action === 'show' ? H.chiefPid : null, log: false, rng: 'house-two', deferSay: true });
    if (action === 'draw:thigh' && !x.mishap && !x.refused) dd.pend = 'draw';
    if (action === 'holster' && !x.mishap && !x.refused) dd.pend = 'holster';
    if (x.halts) {
      dd.tries += 1;
      // (a halt: the rest planned again from what he believes now, after the sub-step's own time; past TWO_TRIES the instructor's
      // (v0.0.19: a drill of his from his belief through plan.js, as yours: twoFixOf))
      if (dd.tries >= TWO_TRIES) { (W.gaveUp ??= {})[dd.cmd] = at; dd.list = dd.list.slice(0, i + 1); }
      else dd.list = [...dd.list.slice(0, i + 1), ...(dd.cmd === 'down' ? twoFixOf(st, W).subs ?? [] : twoList(st, W, dd.cmd))];
    }
    return { action, ms: Math.max(0, Math.round(x.ms ?? 0)), ok: !!x.ok, grade: x.grade ?? null, routine: !!x.routine, ...(x.halts ? { halts: true } : {}), ...(x.refused ? { refused: String(x.text ?? '') } : {}) };
  });
  if (r === 'ended') twoAdminEnd(state, bus, H, d, d.untilMs);
}
// (his macro over: the record kept (W.last), his "Number two, clear." from the instructor at SHOW CLEAR, the 'house' fact)
function twoAdminEnd(state, bus, H, d, at) {
  const W = H.two;
  twoPend(state, W, d);
  W.doing = null;
  if (d.cmd === 'down') { twoGunUp(state, bus, H, at); return; }
  W.last = { step: d.step, untilMs: at, why: null };
  if (d.cmd === 'clear') { W.shown = true; chiefSays(state, bus, HOUSE_CHIEF.twoClear, 'two-clear'); }
  bus?.emit('house', { phase: 'two', room: null, who: W.pid, atMs: at, kind: d.cmd, text: null });
}
/**
 * What a person's hands are doing now, the one helper the stage reads for you and your number two alike (COMBAT §25.19.5:
 * "his sub-step readable as yours is"): { step, i, action, k, fromMs, toMs } or null. Yours is shooting.js stepNow's; his
 * the admin's current sub-step, else his bundle's running hands beat.
 */
export function handsOf(state, pid, ms = state.clock.ms) {
  const H = houseOf(state), W = H?.two;
  if (!W?.pid || pid !== W.pid) return null;
  const d = W.doing;
  if (!d) return null;
  if (d.beats) {
    const b = d.beats.find(x => x.st === 'run' && x.ch === 'hands');
    return b ? { step: d.step, i: null, action: b.k === 'reorg' ? 'reach' : b.k, k: b.untilMs > b.fromMs ? Math.max(0, Math.min(1, (ms - b.fromMs) / (b.untilMs - b.fromMs))) : 1, fromMs: b.fromMs, toMs: b.untilMs } : null;
  }
  if (d.i < 0 || ms < d.subFromMs) return null;
  const k = d.untilMs > d.subFromMs ? Math.max(0, Math.min(1, (ms - d.subFromMs) / (d.untilMs - d.subFromMs))) : 1;
  return { step: d.step, i: d.i, action: d.list[d.i] ?? null, k, fromMs: d.subFromMs, toMs: d.untilMs };
}

// ---- the #2's eyes and rows ----

export const legOf = (T) => (T.stand === 'H' ? 3 : Number(T.stand?.[0]) - 1);
export const isThreat = (T) => THREAT_FACES.includes(T.face);
/** Whose man a stand is to your number two's eyes (twoTick): the role that owns it, team.js ownerOf's (2 his own; 1 yours, taken while he covers you in the room you are in). The team's track's seam (the build sheet v0.0.19 §0 item 15). */
export const twoOwns = (state, T) => ownerOf(state, T);
/** Whether your number two sees a man from where he stands, quantised, at SEEN (twoTick's sighting and twoGunUp's look back onto his man): combat/men.js seenK, a stand's facing times his eyes' sight of its spot as ever, a live man's by his exposure, his eye drawn by a round of that man's (R.house.two.drawn). The live men's track's seam (the build sheet v0.0.19 §0 item 15). */
export const twoSees = (state, a, T, now, f = facingOf(T, now)) => f >= SEEN && q(seenK(state, a, T, now, { f, drawn: !!T.live && drawnOn(houseOf(state)?.two, T.key, now) }), 1e-6) >= SEEN;

// (the #2's sightings, take-in, identification and row on slot 2's stands (see the header))
export function twoTick(state, bus, R, H, a, now) {
  const W = H.two;
  coverTick(state, bus, R, H, a, now);
  if (W.eng) { twoFire(state, bus, R, H, a, now); return; }
  // (his rifle down (twoGunDown): no new man taken in until it is up; the man he was on is his again at "Gun up!")
  if (W.down) return;
  // (v0.0.19: his P-12 out and nobody facing now: his rifle back (twoRifleUp), looked at every tick, not only at a row's end)
  if (W.hand === 'pistol' && twoRifleUp(state, H, now)) return;
  if (!W.contact) {
    const walking = !!W.doing?.beats?.some(b => b.st === 'run' && b.k === 'move');
    for (const T of R.turners) {
      // (his own stands, and, while he covers you (W.cover), your corner's in the room you are in (COMBAT §25.19.6))
      // (he pivots, never walks (COMBAT §25.19.6): your man is his from where he is, his eyes; on his way in he takes him on the
      // move, his entry never cut for him (move: runSlot keeps his walk) (the rework's R6, F20: "under Gun down the #2 engages
      // the bracketed man whenever he can see him"; R5 had left him to you while the #2 walked, 8 of 17 seen in ten lanes a sheet)
      const own = twoOwns(state, T), yours = !!W.cover && own === 1 && legOf(T) === H.cur;
      if ((own !== 2 && !yours) || T.stoppedAtMs !== null || W.known[T.key] !== undefined) continue;
      if (!twoSees(state, a, T, now)) continue;
      W.known[T.key] = now;
      const rangeM = q(Math.hypot(T.x - a.x, T.z - a.z), 0.01);
      // (the man you had bracketed he takes in as his sector's (you showed him); your others as the room's area)
      const t = takeInMs(state, H.twoPid, { id: `two:${T.key}`, targets: [{ key: T.key, x: T.x, z: T.z, rangeM, face: T.face }], seenMs: now, ...(yours ? { expect: { [T.key]: W.cover.man === T.key ? 'sector' : 'area' } } : {}) });
      W.contact = { key: T.key, seenMs: now, untilMs: now + t.ms, ms: t.ms, expect: t.expect ?? null, ...(yours && walking ? { move: true } : {}) };
      noteSighting(state, H, T, { seenMs: now, takeInMs: t.ms, pauseAtMs: now + t.ms, by: 'two' });
      break;
    }
    return;
  }
  const c = W.contact, T = R.turners.find(x => x.key === c.key);
  if (now < c.untilMs) return;
  if (!T || T.stoppedAtMs !== null || facingOf(T, now) < SEEN) { W.contact = null; return; }
  // (what he can tell at his pause: an Awareness check against IDENT_DC0 + range / IDENT_PER_M; failed, he looks again after CHALLENGE_MS)
  const rangeM = Math.hypot(T.x - a.x, T.z - a.z), roller = rollerOf(state, H.twoPid, { ms: now });
  const roll = check(stream(state.meta.seed, 'house:two-ident', T.key, now), { skill: 'awareness', value: roller.value('awareness'), dc: IDENT_DC0 + Math.round(rangeM / IDENT_PER_M), mods: roller.mods('awareness', { ms: now }), pressure: 'evaluated', by: H.twoPid });
  if (!roll.ok) { c.untilMs = now + CHALLENGE_MS; return; }
  W.ident[T.key] = T.face === 'noshoot' ? T.holds : T.holds ?? 'rifle';
  if (!isThreat(T)) { c.held = true; W.contact = null; return; }
  twoPlan(state, R, H, a, T, now);
}

// ---- your number two covering you (COMBAT §25.19.6) ----

/** His "Up." after your rifle is back, once nobody he is on and no window of yours is open, this long after (ms; COMBAT §25.19.9's UP_WAIT_MS). */
export const UP_WAIT_MS = 400;
// (your rifle down: the reflex card on a click, its drill under way (IMMEDIATE or REMEDIAL ACTION; R6's Gun down and Off the line
// by their step's name), or a stoppage you believe in it, on the lane in a room you have entered)
function youDown(state, H) {
  const S = state.stop, L = curLeg(H);
  if (!L || (L.state !== 'entered' && L.state !== 'open')) return false;
  if (S?.reflex) return true;
  // (Gun down and Off the line: down until "Gun up!" or "Up!" is called (the rework's R6), then up on the knee until his "Up.")
  const d = S?.doing, st = String(d?.step ?? '');
  if (/gun-?down|offline/.test(st) && d?.list) { const up = d.list.findIndex(a => a === 'call:gunup' || a === 'call:up'); return up < 0 || d.i < up; }
  if (/^(macro:)?(ia|remedial)$|transition/.test(st)) return true;
  return !!beliefOf(state, gunOn(state, playerId(state)))?.stoppage;
}
/**
 * Your number two takes your sector while your rifle is down (COMBAT §25.19.6, the rework's R5): if he is up and on nobody he
 * says "Covering!", his head goes onto the man you had bracketed or your sector's middle (he pivots, never walks: a man he
 * cannot see stays yours), and your corner's stands in the room become his (twoTick: your bracketed man taken in as his
 * sector's, the others as the room's) until it is back; on a man he finishes his row first. why: R6's "Gun down!" or
 * "Stoppage!" may call it at once; else coverTick sees it. Returns whether he covers.
 */
export function twoCover(state, bus, why = 'down', now = state.clock.ms) {
  const H = houseOf(state), W = H?.two, a = W?.pid ? actorOf(state, W.pid) : null;
  if (!a || W.cover) return !!W?.cover;
  if (W.eng || W.contact || W.down) { W.coverOwed = why; return false; }
  const man = state.stop?.pick ?? null, T = man ? rangeOf(state).turners.find(x => x.key === man && x.stoppedAtMs === null) : null;
  const L = curLeg(H), P = planOf(state, L), mine = sideOf(state, L?.door, 1), sec = P?.sectors?.find(x => x.slot === mine);
  if (T) a.headRad = q(Math.atan2(T.z - a.z, T.x - a.x), 1e-6);
  else if (sec) a.headRad = q(sec.yawRad, 1e-6);
  W.cover = { fromMs: now, why, man: T ? T.key : null };
  delete W.coverOwed; delete W.upAtMs;
  sayOn(state, bus, { who: W.pid, text: TWO_SAY.covering, kind: 'speech' });
  return true;
}
// (each tick: the cover begun where your rifle went down (or owed until his row ends), ended when it is back, his "Up." after)
function coverTick(state, bus, R, H, a, now) {
  const W = H.two, down = youDown(state, H);
  if (down && !W.cover && (!W.coverOwed || (!W.eng && !W.contact && !W.down))) twoCover(state, bus, W.coverOwed || 'down', now);
  if (!down && (W.cover || W.coverOwed)) {
    const was = !!W.cover; delete W.cover; delete W.coverOwed; if (was) W.upAtMs = now + UP_WAIT_MS;
    // (your rifle back: a man of yours he had not fired on yet is yours again (his take-in dropped, his row not begun); once a
    // round of his has gone he finishes his row)
    const yours = (k) => ownerOf(state, R.turners.find(x => x.key === k)) === 1;
    if (W.eng && yours(W.eng.key) && !W.eng.rounds.some(r => r.done)) { W.eng = null; W.contact = null; twoStandDown(state, H); }
    else if (!W.eng && W.contact && yours(W.contact.key)) W.contact = null;
  }
  // (his eyes held on your man or your sector while he covers, stands and is on nobody, whatever his drill's scan would have them on)
  if (W.cover && !W.eng && !W.contact && !W.doing?.beats?.some(b => b.st === 'run' && b.k === 'move')) {
    const L = curLeg(H), mine = sideOf(state, L?.door, 1), T = W.cover.man ? R.turners.find(x => x.key === W.cover.man && x.stoppedAtMs === null) : null, sec = planOf(state, L)?.sectors?.find(x => x.slot === mine);
    const head = T ? Math.atan2(T.z - a.z, T.x - a.x) : sec ? sec.yawRad : null;
    if (head !== null) { a.headRad = q(head, 1e-6); a.face = faceOfHead(a.headRad); }
  }
  // (you on a knee waiting for his "Up." (the rework's R6: wait:up) and no "Up." owed (he never got to cover you): owed now)
  const wd = state.stop?.doing;
  if (!down && W.upAtMs === undefined && wd && !wd.beats && wd.list?.[wd.i] === 'wait:up' && !W.down) W.upAtMs = now + UP_WAIT_MS;
  if (W.upAtMs !== undefined && now >= W.upAtMs && !W.eng && !W.contact && !pendingOf(state)) { delete W.upAtMs; sayOn(state, bus, { who: W.pid, text: TWO_SAY.up, kind: 'speech' }); W.upSaidMs = now; upHeard(state, now); }
}

// (his row planned: the failure drill on armour, the hammer within its reach from its gate, else the pair; below rung 2 the
// aim first; a follow-up on a man still up after his row (follow > 0): To the head after "he's still up", else the pair
// again, at most TWO_FOLLOW_N times (the player's still-up rule, on the same mechanics; the fixer's of 0.0.12: a missed
// round left his man up for the rest of the room))
function twoPlan(state, R, H, a, T, now, follow = 0) {
  const W = H.two, gunId = gunOn(state, H.twoPid), gun = state.items?.[gunId];
  if (!gun) { W.contact = null; return; }
  const target = { ...turnerTargets(state, now).find(t => t.key === T.key), dM: Math.hypot(T.x - a.x, T.z - a.z) };
  const mrk = rollerOf(state, H.twoPid, { ms: now }).value('marksmanship');
  const row = follow > 0 ? (stillUp(state, T.key) ? 'head' : mrk >= ROWS.pair.gate ? 'pair' : null)
    : T.face === 'armoured' && mrk >= ROWS.failure.gate ? 'failure' : target.dM <= HAMMER_MAX_M && mrk >= ROWS.hammer.gate ? 'hammer' : mrk >= ROWS.pair.gate ? 'pair' : null;
  a.headRad = Math.atan2(T.z - a.z, T.x - a.x);
  gun.mode = 'semi';
  state.people[H.twoPid].kit.carry.posture = 'aimed';
  const aimMs = (W.rung < 2 || !row) && !follow ? aimMsOf(state, H.twoPid, gunId, target, { ms: now }) : 0;
  const move = W.contact?.move ? { move: true } : {};
  if (!row) { W.eng = { key: T.key, row: 'fire', follow, rounds: [{ atMs: whole(now + aimMs + 150), part: 'torso', follow: 0, climbK: 1, i: 0, n: 1 }], ...move }; return; }
  const plan = rowPlan(state, H.twoPid, `shot:${row}`, target, { atMs: now, gunId, odds: false });
  const rounds = plan.parts.filter(p => p.k === 'round');
  W.eng = { key: T.key, row, follow, rounds: rounds.map(p => ({ atMs: whole(now + aimMs + p.at), part: p.part, follow: p.follow ?? 0, climbK: p.climbK ?? 1, i: p.i, n: rounds.length })), ...move };
}

// (his rounds at their times; the failure drill's third not fired on a man already down)
function twoFire(state, bus, R, H, a, now) {
  const W = H.two, E = W.eng, T = R.turners.find(x => x.key === E.key), gunId = gunOn(state, H.twoPid);
  for (const r of E.rounds) {
    if (r.done || r.atMs > now) continue;
    // (his natural 1 mastered is caught as yours is (SKILLS §5.1: "for everyone"): the round and those after it late by the catch)
    const t0 = T && T.stoppedAtMs === null ? { ...turnerTargets(state, now).find(t => t.key === T.key), dM: Math.hypot(T.x - a.x, T.z - a.z) } : null;
    const c = t0 && !r.caught ? catchAhead(state, { pid: H.twoPid, gunId, target: t0, part: r.part, follow: r.follow, climbK: r.climbK, atMs: now }) : 0;
    if (c > 0) { r.caught = true; r.catchId = shotIdNext(state); for (const x of E.rounds) if (!x.done && x.atMs >= r.atMs) x.atMs = whole(x.atMs + c); break; }
    r.done = true;
    if (!T || T.stoppedAtMs !== null) continue;
    const target = t0 ?? { ...turnerTargets(state, now).find(t => t.key === T.key), dM: Math.hypot(T.x - a.x, T.z - a.z) };
    // (a round whose catch was charged draws the dice it was judged on (shot.js shotIdNext))
    const foreseen = r.catchId ?? null;
    if (foreseen) delete r.catchId;
    const { shot } = resolveShot(state, bus, { pid: H.twoPid, gunId, target, part: r.part, follow: r.follow, climbK: r.climbK, log: false, atMs: now, row: { id: `shot:${E.row}`, n: r.n, i: r.i }, ...(foreseen ? { foreseen } : {}) });
    // (a man of yours he fired on: only ever while he covered you (twoCover), so his by the rule (COMBAT §25.19.8 F9))
    if (ownerOf(state, T) === 1 && !(W.covered ??= []).includes(T.key)) W.covered.push(T.key);
    houseShot(state, bus, shot);
    // (his rifle stopped (a click, a dead trigger, a jam, the bolt locked on an empty) or a stoppage behind the round: the row
    // ends there and his own drill takes his hands (twoGunDown); v0.0.13's #2 pressed a stopped rifle six times and left his man up)
    if ((!shot.fired && shot.why !== 'safety') || shot.stoppage) { twoGunDown(state, bus, H, a, T, now); return; }
  }
  if (E.rounds.every(r => r.done)) {
    W.eng = null;
    if (T && T.stoppedAtMs === null && isThreat(T) && facingOf(T, now) >= SEEN && (E.follow ?? 0) < TWO_FOLLOW_N) { twoPlan(state, R, H, a, T, now, (E.follow ?? 0) + 1); if (W.eng) return; }
    W.contact = null;
    twoStandDown(state, H);
  }
}
// ---- your number two's own stoppage (COMBAT §25.19.5: "If his rifle stops ... he calls 'Gun down!'") ----

/** v0.0.18's drill for his rifle, read from the truth of the gun (a double feed REMEDIAL ACTION, the bolt locked on an empty a speed reload, else IMMEDIATE ACTION). Kept as the tests' reference only: from v0.0.19 he plans from what he believes (twoFixOf). */
export function twoDrillOf(state, gun) {
  if (!gun) return null;
  if (gunField(gun, 'jam')) return 'remedial';
  const mag = gun.mag ? state.items?.[gun.mag] : null, ch = gunField(gun, 'chamber');
  if (gunField(gun, 'locked') || !mag || ((mag.n ?? 0) <= 0 && ch !== 'dud' && ch !== 'case')) return 'reload:speed';
  return 'ia';
}
/**
 * His fix for the gun in his hands from what he believes (v0.0.19, the user's rule "we only know what we know"; the build sheet
 * v0.0.19 §0 item 20): plan.js planFor(his pid, his gun, 'fire'), as your own rows are planned: { id, path, subs, ms, none }.
 * A double feed he has not felt is an IMMEDIATE ACTION first, as yours (v0.0.18 read the jam and went straight to REMEDIAL).
 */
export function twoFixOf(state, W) {
  const gunId = W?.pid ? gunOn(state, W.pid) : null;
  return gunId ? planFor(state, W.pid, gunId, 'fire') : { goal: 'fire', path: null, none: 'no gun', id: null, label: null, ms: 0, subs: null };
}
/** Whether a fix plan says the gun fires as he believes it: no way left to take but the selector (his row puts it off safe). */
export const fixReady = (p) => !!p && !p.none && Array.isArray(p.path) && p.path.every(x => String(x).startsWith('selector:'));
// (a fix's drill name on his record (W.down.macro, the doing's step 'down:<macro>'): 'ia', 'remedial', 'reload:speed', …, else the row's id)
const drillName = (p) => String(p?.id ?? 'none').replace(/^macro:/, '');
// (an armed man he identified, up and facing him within TRANSITION_NEAR_M (specials.js): the pistol's distance)
function facingNear(state, W, a, now) {
  return (rangeOf(state)?.turners ?? []).some(x => x.stoppedAtMs === null && isThreat(x) && ['rifle', 'pistol'].includes(W.ident?.[x.key]) && facingOf(x, now) >= SEEN && Math.hypot(x.x - a.x, x.z - a.z) <= TRANSITION_NEAR_M);
}
/**
 * His transition (v0.0.19, his P-12 with ~two:p12): the pistol holstered, an armed man of his facing within TRANSITION_NEAR_M
 * (or nothing left to load the rifle with: `any`), the rifle let hang and the P-12 drawn (sidearm.js weaponList 'transition'),
 * no call, on his list as his drills are (twoAdminTick; the pistol into his hand at the draw's end: twoPend). Returns whether he
 * went to it.
 */
function twoTransition(state, bus, H, W, a, T, now, any = false) {
  const k = state.people[W.pid]?.kit;
  if (!W.pistol || !a || k?.worn?.holster !== W.pistol || handGun(state, W) || !(any || facingNear(state, W, a, now))) return false;
  const list = weaponList(state, W.pid, 'transition');
  if (!list) return false;
  W.down = { key: T?.key ?? W.down?.key ?? null, atMs: W.down?.atMs ?? now, macro: 'transition', tries: W.down?.tries ?? 0 };
  (k.carry ??= {}).finger = 'off';
  const at = whole(now + goMs(skillsOf(state, W.pid).wf));
  W.doing = { who: W.pid, step: 'down:transition', kind: 'command', cmd: 'down', macro: 'transition', list, i: -1, subs: [], fromMs: at, subFromMs: null, untilMs: at, planMs: twoPlanMs(state, W, list), tries: 0 };
  return true;
}
// (his P-12's move at the end of the sub-step that took it (twoAdminTick, before the next; twoAdminEnd): drawn into his hand, or
// holstered on safe (sidearm.js pistolDrawn, pistolHolstered: yours, factored out); W.hand 'pistol' while it is out)
function twoPend(state, W, d) {
  const pend = d?.pend;
  if (!pend) return;
  delete d.pend;
  if (pend === 'draw' && W.pistol && pistolDrawn(state, W.pid, W.pistol)) W.hand = 'pistol';
  if (pend === 'holster') { pistolHolstered(state, W.pid); delete W.hand; }
}
/**
 * Your number two's gun down on a man (twoFire; the rework's R5, COMBAT §25.19.5): his row ends, he says "Gun down!" (a reload's:
 * "Reloading!"), and his fix runs on his list doing as his tower macros do (twoAdminTick: his sub-steps at his own Weapon
 * handling, drawn as yours, a halt planned again from his belief), at his react.js goMs; W.down { key, atMs, macro, tries } until
 * "Gun up!" (twoGunUp). He takes in nobody new meanwhile, and the room's "Clear!" waits on his man (clearGateOf). v0.0.19: the fix
 * from his belief (twoFixOf); his P-12, where he carries one, drawn instead with an armed man facing him within 10 m, or with
 * nothing left to load (twoTransition).
 */
export function twoGunDown(state, bus, H, a, T, now = state.clock.ms) {
  const W = H.two, gunId = gunOn(state, W.pid), rifle = rifleOf2(state, W.pid);
  W.eng = null; W.contact = null;
  const fix = twoFixOf(state, W);
  if (twoTransition(state, bus, H, W, a, T, now, !!fix.none)) return;
  const tries = (W.down?.tries ?? 0) + 1, macro = fix.subs?.length ? drillName(fix) : null, reload = !!macro && /^reload:/.test(macro);
  // (the call he opened with (TEAM_WORDS id, `said`), kept over the tries: what his "Gun up!" or "Up." closes (the review of
  // 2026-11-16: an IA that turned into a speed reload opened "Gun down!" and closed "Up.", the words F36 calls not closed))
  const said = W.down?.said ?? (macro && tries <= TWO_TRIES ? (reload ? 'reloading' : 'gunDown') : null);
  W.down = { key: T?.key ?? W.down?.key ?? null, atMs: W.down?.atMs ?? now, macro, tries, ...(said ? { said } : {}) };
  if (!macro || tries > TWO_TRIES) { twoGunUp(state, bus, H, now, { failed: true }); return; }
  if (tries === 1) sayOn(state, bus, { who: W.pid, text: TEAM_WORDS[said].words, kind: 'speech' });
  // (the rework's R6: "Gun down!" stops you once, out of stop motion, so his sector is covered (cqb.js cqb-two-down: Cover his
  // sector); in the mode the line waits for your next choice)
  if (tries === 1 && !reload && !state.stop && !pendingOf(state) && !H.end && H.goAtMs !== null) enterStop(state, bus, { pid: playerId(state), via: 'house' });
  state.people[W.pid].kit.carry.finger = 'off';
  const list = fix.subs, at = whole(now + goMs(skillsOf(state, W.pid).wf));
  W.doing = { who: W.pid, step: `down:${macro}`, kind: 'command', cmd: 'down', macro, list, i: -1, subs: [], fromMs: at, subFromMs: null, untilMs: at, planMs: twoPlanMs(state, W, list), tries: 0, ...(gunId && gunId !== rifle ? { gun: gunId } : {}) };
}
// (his drill over: the gun working as he believes it, "Gun up!" (a reload's "Up.", a transition's nothing) and back on the man he
// was on if he still stands and faces; still stopped, the next drill, at most TWO_TRIES; failed, he stays down and his man is
// yours (the pause's sector rule). A gun he believes ready but is not is found by his next shot (TWO_TRIES bounds it))
function twoGunUp(state, bus, H, now, { failed = false } = {}) {
  const W = H.two, D = W.down, R = rangeOf(state), a = actorOf(state, W.pid);
  if (!D) return;
  const works = fixReady(twoFixOf(state, W));
  if (!works && !failed && a) { twoGunDown(state, bus, H, a, null, now); return; }
  if (!works) { W.down = { ...D, failed: true }; return; }
  delete W.down; delete W.coveredBy;
  if (D.macro !== 'transition') sayOn(state, bus, { who: W.pid, text: D.said ? TEAM_WORDS[TEAM_WORDS[D.said].close].words : /^reload:/.test(D.macro) ? TWO_SAY.up : TWO_SAY.gunUp, kind: 'speech' });
  const T = D.key ? R.turners.find(x => x.key === D.key) : null;
  if (a && T && T.stoppedAtMs === null && isThreat(T) && twoSees(state, a, T, now)) {
    W.contact = { key: T.key, seenMs: now, untilMs: now, ms: 0, expect: null };
    twoPlan(state, R, H, a, T, now);
    return;
  }
  // (a man he cannot see from here is taken in afresh when he can (twoTick skips a man already known))
  if (T && T.stoppedAtMs === null) delete W.known[T.key];
  twoStandDown(state, H, bus, now);
}
// (his P-12 out, nobody of the room up and facing, his hands free: his Rifle up begun (see twoStandDown); true where it was)
function twoRifleUp(state, H, now = state.clock.ms) {
  const W = H.two, a = W?.pid ? actorOf(state, W.pid) : null;
  if (!W?.pistol || !handGun(state, W) || !a || W.eng || W.contact || (W.doing && !W.doing.beats) || (rangeOf(state)?.turners ?? []).some(x => x.stoppedAtMs === null && isThreat(x) && legOf(x) === H.cur && facingOf(x, now) >= SEEN)) return false;
  // (his rifle with no way to fire as he believes it (nothing left to load: plan.js planFor's `none`): the pistol kept (the review
  // of 2026-11-16: up and drawn again eleven times a lane, the rifle's fix on his next man always "none")
  const rifle = rifleOf2(state, W.pid);
  if (rifle && planFor(state, W.pid, rifle, 'fire').none) return false;
  const list = weaponList(state, W.pid, 'rifle-up');
  if (!list) return false;
  W.down = { key: null, atMs: now, macro: 'rifle-up', tries: 0 };
  const at = whole(now + goMs(skillsOf(state, W.pid).wf));
  W.doing = { who: W.pid, step: 'down:rifle-up', kind: 'command', cmd: 'down', macro: 'rifle-up', list, i: -1, subs: [], fromMs: at, subFromMs: null, untilMs: at, planMs: twoPlanMs(state, W, list), tries: 0 };
  return true;
}
// (his rifle after a row: on safe, at high ready. v0.0.19: his P-12 out and nobody facing him, his rifle up (sidearm.js weaponList
// 'rifle-up': the holster, the rifle up, its own way to ready, plan.js readyPath) on his list, W.down set for its part so your
// Cover his sector is offered, "Gun up!" at its end)
function twoStandDown(state, H, bus = null, now = state.clock.ms) {
  if (twoRifleUp(state, H, now)) return;
  const gun = state.items?.[gunOn(state, H.twoPid)];
  if (gun) gun.mode = 'safe';
  if (state.people[H.twoPid]?.kit?.carry) state.people[H.twoPid].kit.carry.posture = 'highReady';
}
