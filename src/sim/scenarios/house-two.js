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
// with (W.down.said, team.js TEAM_WORDS' close: "Gun down!" by "Gun up!" though his IA turned into a reload); his P-12 (standard
// issue from v0.0.20, loadout.js TWO_P12_DEFAULT; v0.0.19's ~two:p12; '~two:none' the tests' only) (house-two's twoLacks and twoList for the tower: sidearm.js adminSubs, adminRun on his stream; twoTransition
// in a fight, an armed man facing him within TRANSITION_NEAR_M; twoRifleUp once nobody faces him, never while his rifle has
// nothing left to load as he believes it (planFor's `none`); twoPend the pistol's move at
// its sub-step's end, sidearm.js pistolDrawn and pistolHolstered); his sectors and your sector by side (team.js sideOf).
// v0.0.20 (the build sheet v0.0.20 item 3; COMBAT §25.19.3.5): his rounds never through you (maskHold: his line from his muzzle's tip
// to his man masked by your body, carry.js lineMasked, holds them, "Line!" once a hold, the 'masked' fault at MASK_FAULT_MS, a step
// of MASK_STEP_M off his line at MASK_HOLD_MAX_MS and his row planned again from there, his next round MASK_RESUME_MS after the line
// clears); maskTick, at the end of the house's rules, notes your walks held by a body (L.pins), your limit of advance (H.limit, the
// DI's cqb-limit) and his entry on your heels (L.heelsMs).
// At SHOW CLEAR (the review of the pistol fix, 2026-11-16) his P-12 is judged by what is in it, as yours (pistolLacks 'clear':
// 'two:show' while it holds a magazine, a round or its slide back), its part planned again from his belief when it halts, kept
// when his rifle's tries are spent, and whatever his macro leaves loaded the instructor clears himself at its end (twoShown,
// "Number two, that's still loaded. Give it here."): the lane is never called clear over a loaded gun of his.
// The cycle with shoothouse.js (which re-exports these names and loadedGun, and whose houseOf, curLeg, planOf, noteSighting, houseShot,
// chiefSays, whole and actorOf this module calls) is of function references only: this module reads no shoothouse.js binding
// at its top level (the build sheet's §0 item 12), so either may load first (tests/import-order.test.mjs). Pure but the
// session it writes through the layers that call it.
import { q } from '../../core/num.js';
import { stream } from '../../core/rng.js';
import { playerId, playerActor } from '../../core/ids.js';
import { pastThreshold } from '../combat/room.js';
import { HOUSE_CHIEF } from '../../data/courses.js';
import { SEEN } from '../people/perception.js';
import { check } from '../skills/checks.js';
import { TICK_MS } from '../../core/clock.js';
import { rangeOf, sayOn } from './handling.js';
import { upHeard, adminSubs, adminMs, adminRun, weaponList, pistolDrawn, pistolHolstered } from '../arms/sidearm.js';
import { planFor } from '../arms/plan.js';
import { TRANSITION_NEAR_M } from '../arms/specials.js';
import { gunField, doAction, beliefOf, actionMs, tempoFor } from '../arms/firearms.js';
import { subsOf } from '../arms/drills.js';
import { enterStop, gunOn, faceOfHead } from '../arms/shooting.js';
import { SLUNG, lineFromOf, lineMasked, MASK_RESUME_MS, MASK_HOLD_MAX_MS, MASK_STEP_M, MASK_FAULT_MS } from '../arms/carry.js';
import { stepAside } from '../places/move.js';
import { cornerRuleOf } from '../combat/corner.js';
import { facingOf, turnerTargets } from '../arms/turners.js';
import { resolveShot, aimMsOf, catchAhead, shotIdNext } from '../arms/shot.js';
import { ROWS, rowPlan, HAMMER_MAX_M, stillUp } from '../arms/specials.js';
import { rollerOf } from '../combat/roll.js';
import { takeInMs, goMs } from '../combat/react.js';
import { pendingOf, IDENT_DC0, IDENT_PER_M, CHALLENGE_MS, tell } from '../combat/contact.js';
import { skillsOf, TWO_SAY, tallyCall } from '../combat/bundle.js';
import { frameOf, farCoverOf, placeWordsOf, MARK_AT_M, MOVE_ANSWER_MS } from '../combat/corner.js';
import { halfOrLess } from '../arms/kit.js';
import { advanceList } from '../combat/stepper.js';
import { ownerOf, sideOf, TEAM_WORDS } from '../combat/team.js';
import { seenK, drawnOn } from '../combat/men.js';
import { houseOf, curLeg, planOf, noteSighting, houseShot, chiefSays, whole, actorOf, pistolLacks, loadedGun, THREAT_FACES, TWO_FOLLOW_N, houseFault } from './shoothouse.js';
import { move, pouchFor } from '../arms/kit.js';
import { modelOf, isLong } from '../arms/models.js';

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
  // (v0.0.19: his P-12, where he carries one (standard issue from v0.0.20), judged as yours is after his rifle: Condition 1 on safe in the holster at
  // MAKE READY ("a round up.", "on safe"), holstered on safe at Stop and SHOW CLEAR, and at SHOW CLEAR empty by the truth, its
  // slide home (shoothouse.js pistolLacks 'clear', as yours: the review of the pistol fix, 2026-11-16, his P-12 holstered 1 + 0 under
  // "Number two: clear.", the lane called clear))
  const rifle = twoRifleLacks(state, W, g, cmd, safe);
  if (rifle || rifleOnly || !W.pistol || !state.items?.[W.pistol]) return rifle;
  if (cmd === 'ready') { const p = state.items[W.pistol], held = state.people[W.pid]?.kit?.worn?.holster === W.pistol; return !held ? 'two:safe' : gunField(p, 'chamber') !== 'live' ? 'two:chamber' : gunField(p, 'mode') !== 'safe' ? 'two:safe' : null; }
  if (cmd === 'stop' || cmd === 'clear') { const p = pistolLacks(state, W.pid, cmd); return p === 'pistol:loaded' ? 'two:show' : p ? 'two:safe' : null; }
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
  if (!list.length) { if (W.doing && !W.doing.beats) W.doing = null; if (cmd === 'clear') twoShown(state, bus, W); return null; }
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
    // (the review of his P-12 made standard: a fumbled part (adminRun's ok false: its rack or its safe) is a halt as his
    // rifle's are, counted, planned again from his belief and given up at TWO_TRIES; before, nothing tried again, the tower waited
    // on his P-12 to its move-on (recruit 7001 from the brief: GO at 127.15 s, against 20 s without his P-12); and its clear halted
    // (a lock back missed, a slip, a round seen) the same (the review of the pistol fix, 2026-11-16: the part stopped at a missed
    // lock back and the macro ended on "Number two: clear." over the round))
    if (action === 'pistol:ready' || action === 'pistol:clear') {
      const x = adminRun(st, b2, W.pid, action, dd, { rng: 'house-two', log: false }), fumbled = x.ok === false;
      if (fumbled || x.halts) twoHalt(st, W, dd, i, at);
      return { action, ms: Math.max(0, Math.round(x.ms ?? 0)), ok: !fumbled, grade: null, routine: !fumbled, ...(fumbled || x.halts ? { halts: true } : {}) };
    }
    const gunId = (action === 'draw:thigh' || action === 'holster') && W.pistol ? W.pistol : dd.gun ?? g.id;
    const x = doAction(st, b2, { pid: W.pid, gunId, action, tempo: tempoFor(action, 'normal'), pressure: 'evaluated', observerId: action === 'show' ? H.chiefPid : null, log: false, rng: 'house-two', deferSay: true });
    if (action === 'draw:thigh' && !x.mishap && !x.refused) dd.pend = 'draw';
    if (action === 'holster' && !x.mishap && !x.refused) dd.pend = 'holster';
    if (x.halts) twoHalt(st, W, dd, i, at);
    return { action, ms: Math.max(0, Math.round(x.ms ?? 0)), ok: !!x.ok, grade: x.grade ?? null, routine: !!x.routine, ...(x.halts ? { halts: true } : {}), ...(x.refused ? { refused: String(x.text ?? '') } : {}) };
  });
  if (r === 'ended') twoAdminEnd(state, bus, H, d, d.untilMs);
}
// (a halt in his macro at sub-step i: the rest planned again from what he believes now, after the sub-step's own time; past TWO_TRIES
// the instructor's (v0.0.19: a drill of his from his belief through plan.js, as yours: twoFixOf). v0.0.20: a fumbled part of his
// P-12's is planned again alone, and one whose plan again has nothing left in it (his belief no longer asks a rack) is given up
// there too, the tower never waiting on a part he will not try)
function twoHalt(state, W, dd, i, at) {
  dd.tries += 1;
  const pistolPart = String(dd.list[i] ?? '').startsWith('pistol:');
  // (his P-12's part planned again alone (sidearm.js adminSubs): his rifle's macro, done, is not run again (a fumbled SHOW CLEAR of
  // the pistol re-ran the rifle's whole clearing, three times, in the kit's fuzz))
  const again = dd.tries >= TWO_TRIES ? null : pistolPart ? adminSubs(state, W.pid, TWO_CMDS[dd.cmd]) : dd.cmd === 'down' ? twoFixOf(state, W).subs ?? [] : twoList(state, W, dd.cmd);
  // (his rifle's tries spent, his P-12's part of the macro is still his to do, a gun of its own: the review of the pistol fix,
  // 2026-11-16, the boot recruit's #2 gave up on his R-7's clear and the macro's end left his P-12 1 + 9 in the holster)
  if (again === null || (pistolPart && !again.length)) { (W.gaveUp ??= {})[dd.cmd] = at; dd.list = [...dd.list.slice(0, i + 1), ...(again === null && !pistolPart && dd.cmd !== 'down' ? adminSubs(state, W.pid, dd.macro) : [])]; }
  else dd.list = [...dd.list.slice(0, i + 1), ...again];
}
// (his macro over: the record kept (W.last), his "Number two, clear." from the instructor at SHOW CLEAR, the 'house' fact)
function twoAdminEnd(state, bus, H, d, at) {
  const W = H.two;
  twoPend(state, W, d);
  W.doing = null;
  if (d.cmd === 'down') { twoGunUp(state, bus, H, at); return; }
  W.last = { step: d.step, untilMs: at, why: null };
  if (d.cmd === 'clear') { twoShown(state, bus, W); chiefSays(state, bus, HOUSE_CHIEF.twoClear, 'two-clear'); }
  bus?.emit('house', { phase: 'two', room: null, who: W.pid, atMs: at, kind: d.cmd, text: null });
}
// (his guns shown at SHOW CLEAR: the instructor's look at them by the truth, as the tower's SHOW CLEAR is at yours (shoothouse.js
// houseReady 'shown'). Whatever his macro left loaded (its tries spent, a look that missed a round, a part his belief thought
// done) the instructor clears himself and says so, as the coach takes yours (handling.js coachClears): the lane is never called
// clear over a loaded gun of his, and never waits for ever on one with no macro of his to put it right (the review of the pistol
// fix, 2026-11-16). Nothing where both are clear, the run as before)
function twoShown(state, bus, W) {
  W.shown = true;
  const k = state.people?.[W.pid]?.kit, hand = handGun(state, W);
  const ids = [k?.worn?.sling, k?.worn?.holster, hand].filter((id, i, a) => id && a.indexOf(id) === i && state.items[id]?.type === 'gun');
  const loaded = (g) => loadedGun(g) || (!!gunField(g, 'locked') && !isLong(modelOf(g)));
  const took = ids.filter(id => loaded(state.items[id]));
  if (!took.length) return false;
  const me = actorOf(state, W.pid), R = rangeOf(state);
  for (const id of took) {
    const g = state.items[id];
    if (g.mag) {
      const c = pouchFor(state, W.pid, isLong(modelOf(g)) ? null : state.items[g.mag]?.fam ?? null);
      if (c) move(state, g.mag, { container: c });
      else if (me) move(state, g.mag, { ground: { area: R?.area ?? state.actors?.area, x: me.x + 0.3, z: me.z + 0.1 } });
    }
    for (const f of ['chamber', 'set', 'jam', 'locked', 'load', 'portOpen', 'cocked', 'mode']) delete g[f];
    g.belief = { chamber: 'empty' };
  }
  // (a pistol in his hand back in its holster, on safe)
  if (hand && k?.worn && !k.worn.holster && !isLong(modelOf(state.items[hand]))) move(state, hand, { pid: W.pid, slot: 'holster' });
  chiefSays(state, bus, HOUSE_CHIEF.twoTaken, 'two-taken');
  return true;
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
  // (the room: his status, the last man's mark, the far leg's cover and his call-outs, before his own man (roomTick))
  roomTick(state, bus, R, H, a, now);
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
  if (!roll.ok) {
    c.untilMs = now + CHALLENGE_MS;
    // (failed with you past the room's threshold and him short of it, he looks again on his way in, never
    // halted in the doorway for it (move: runSlot keeps his walk, as for your man on his way in). Before it each failed roll held his
    // entry another CHALLENGE_MS: the corporal on 1481 stood outside room 3 for 2.8 s past his cue, three lanes of the hundred
    // seeds over F25's 3 s once A's and B's timings moved the dice (the user, 2026-11-15: "squad AI sometimes stays out of the room
    // on entry"))
    const L = curLeg(H), P = L && L.door !== 'hall' ? planOf(state, L) : null, me = playerActor(state);
    if (!c.move && P?.plane && me && pastThreshold(P, me.x, me.z) && !pastThreshold(P, a.x, a.z)) c.move = true;
    return;
  }
  W.ident[T.key] = T.face === 'noshoot' ? T.holds : T.holds ?? 'rifle';
  if (!isThreat(T)) { c.held = true; W.contact = null; return; }
  twoPlan(state, R, H, a, T, now);
}

// ---- v0.0.20, the room (the build sheet's items 12, 17 and 18; drill.md D3 to D5; COMBAT §25.19.2.1) ----
//
// His side of your room's calls, each tick before his own man (twoTick): his status at your "Room clear!" (bundle.js's `status` beat
// asks it on R.house.two.status[door]): "Up." with his rifle working and his magazine believed above half, "Reloading!" at half or
// less (his own Top up follows on his way, as built), "Gun down!" with it down; the last man's mark (his Dominate's `mark` beat arms
// R.house.two.markOwed[door]): passing the door's plane outward, corner.js MARK_AT_M past it, with you already out, "Last man." and
// the mark on the latch-side jamb (L.marked { by, atMs }), flowing with his feet at every rung (my call, against drill.md D3's stop of
// MARK_S × pace below rung 3: 0.3 m past the plane he is still in the doorway's no-stop zone, and the user's "soldiers need to stay
// fluidly moving", 2026-11-13, holds); you still inside, the mark is yours (L.markYours, cqb-mark); the far leg: your "Moving!" answered "Move!"
// MOVE_ANSWER_MS after it once he is on nobody, no look or walk of his running, then his eyes on corner.js farCoverOf's point
// (W.farcover) until your "Clear!" in that room; by the keys, your walk detected by place (half a metre past your point toward the
// far leg) and covered with "Covering!", nothing waiting (my call); and the call-out: a man of yours (team.js ownerOf) in the room you
// are in, that he sees before you have, taken in and looked at (an Awareness check as his own identification, on its own stream), then
// called "{face}, {place}!" ("Hostage, far leg!"; "Man, far left!" where he could not tell: only what he saw) and told to your mind
// (contact.js tell), never a pause. Each call tallied on the leg (bundle.js tallyCall).
const FACE_WORDS = Object.freeze({ hostage: 'Hostage', armoured: 'Plate' });
const capW = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w);
const faceWordOf = (T) => FACE_WORDS[T.face] ?? capW(T.holds ?? (T.face === 'noshoot' ? 'hands' : 'rifle'));
const sayTwo = (bus, W, id, text, more = {}) => bus?.emit('say', { who: W.pid, text, kind: 'speech', durMs: TWO_CALL_MS, call: id, ...more });
/** His calls' time said (ms; bundle.js CALL_FLOW_S, the call-out's CALL_MS 200: never a pause). */
export const TWO_CALL_MS = 200;
const legAt = (H, door) => [...H.rooms, H.hall].find(L => L?.door === door) ?? null;
const busyLook = (W) => !!W.doing?.beats?.some(b => b.st === 'run' && (b.k === 'scan' || b.k === 'move'));
// (a look or a walk of his still to come or under way: his "Move!" waits for his own sector swept (his Dominate run to its end,
// R.house.two.swept[door], bundle.js runSlot, or its "Clear!" said), so his eyes stay on the far leg once he answers)
const sweptOf = (W, door) => W.swept?.[door] !== undefined || (W.doing?.door === door && !!W.doing.beats?.some(b => b.key === 'clear' && b.st === 'done'));
const lookOwed = (W) => !!W.doing?.beats?.some(b => (b.st === 'run' || b.st === 'wait') && (b.k === 'scan' || b.k === 'move'));
function roomTick(state, bus, R, H, a, now) {
  const W = H.two;
  // (his status, once a room, at your "Room clear!")
  for (const [door, s] of Object.entries(W.status ?? {})) {
    if (s.saidMs !== undefined) continue;
    const g = twoGun(state, W), id = W.down ? (W.down.said ?? 'gunDown') : g && halfOrLess(g.b, g.gun) ? 'reloading' : 'up';
    s.saidMs = now; s.said = id;
    // (his rifle down at your "Room clear!" (his P-12's Rifle up under way, a drill on his hands): the "Gun down!" he answers is the
    // call his "Gun up!" closes (W.down.said, kept over a drill his Rifle up turns into: the integration of v0.0.20 left it open,
    // the Rifle up meeting his empty rifle and closing its speed reload's "Reloading!" with "Up." alone; F36))
    // (a record only: house-catalogue's case marks him down with a bare `true`)
    if (W.down && typeof W.down === 'object' && !W.down.said) W.down.said = 'gunDown';
    // (at half or less his own Top up on the way says "Reloading!", then "Up.", as built: his answer, never said twice)
    // (the fact marked `status`: his answer to your "Room clear!", apart from the same words closing a call of his own)
    if (id !== 'reloading') sayTwo(bus, W, id, TEAM_WORDS[id].words, { status: true, room: door });
    tallyCall(legAt(H, door), 'status');
  }
  // (the last man's mark, at the jamb as he passes the plane outward)
  for (const [door] of Object.entries(W.markOwed ?? {})) {
    const L = legAt(H, door), P = L ? planOf(state, L) : null, F = P ? frameOf(P) : null;
    if (!L || !F || L.marked) { delete W.markOwed[door]; continue; }
    if (F.to(a.x, a.z).d > -MARK_AT_M) continue;
    delete W.markOwed[door];
    const me = playerActor(state);
    if (me && pastThreshold(P, me.x, me.z)) { L.markYours = true; continue; }
    L.marked = { by: W.pid, atMs: now };
    sayTwo(bus, W, 'last', TEAM_WORDS.last.words);
    tallyCall(L, 'last');
    bus?.emit('house', { phase: 'marked', room: L.room, who: W.pid, atMs: now });
  }
  if (!Object.keys(W.markOwed ?? {}).length) delete W.markOwed;
  // (he was out first and you are the last man (L.markYours): you mark it as you pass the plane outward, "Last man.", flowing (my
  // call: room 3's far leg keeps you deepest on every sheet, and a DI's note on a walk with no stop is never heard))
  for (const L of H.rooms) {
    if (!L.markYours || L.marked || L.state !== 'clear') continue;
    const P = planOf(state, L), F = P ? frameOf(P) : null, me = playerActor(state);
    if (!F || !me || F.to(me.x, me.z).d > -MARK_AT_M || Math.hypot(me.x - F.mid[0], me.z - F.mid[1]) > MARK_NEAR_M) continue;
    L.marked = { by: me.who, atMs: now };
    bus?.emit('say', { who: me.who, text: TEAM_WORDS.last.words, kind: 'speech', durMs: TWO_CALL_MS, call: 'last' });
    tallyCall(L, 'last');
    bus?.emit('house', { phase: 'marked', room: L.room, who: me.who, atMs: now });
  }
  const L = curLeg(H), P = L ? planOf(state, L) : null, idle = !W.contact && !W.eng && !W.down;
  // (your "Moving!" answered once he is on nobody, his own look and walk done)
  for (const [door, r] of Object.entries(W.moving ?? {})) {
    if (r.saidMs === undefined || r.moveMs !== undefined || r.handed !== undefined || now < r.saidMs + MOVE_ANSWER_MS || !idle || lookOwed(W) || !sweptOf(W, door)) continue;
    r.moveMs = now;
    sayTwo(bus, W, 'move', TEAM_WORDS.move.words);
    tallyCall(legAt(H, door), 'move');
    W.farcover = { door, fromMs: now };
  }
  // (the far walk by the keys: you past your point toward the far leg with no "Moving!": "Covering!", his eyes on it, nothing waiting)
  if (!W.farcover && P?.far && L && L.door !== 'hall' && !W.moving?.[L.door] && !W.farDone?.[L.door] && idle && !busyLook(W)) {
    const me = playerActor(state), pt = P.points?.[sideOf(state, L.door, 1) - 1], c = farCoverOf(P);
    if (me && pt && c && pastThreshold(P, me.x, me.z)) {
      const ux = c.x - pt[0], uz = c.z - pt[1], n = Math.hypot(ux, uz) || 1;
      if (((me.x - pt[0]) * ux + (me.z - pt[1]) * uz) / n >= FAR_WALK_M) {
        W.farcover = { door: L.door, fromMs: now, by: 'keys' };
        sayTwo(bus, W, 'covering', TEAM_WORDS.covering.words);
      }
    }
  }
  // (his eyes on the far leg while you walk it, until your "Clear!" in that room, then back on his sector)
  if (W.farcover) {
    const Lf = legAt(H, W.farcover.door), Pf = Lf ? planOf(state, Lf) : null, c = farCoverOf(Pf);
    const done = !Lf || !c || Lf !== L || (Lf.calls ?? []).some(x => x.say === 'clear' && x.by === 'me' && x.atMs >= W.farcover.fromMs);
    if (done) {
      (W.farDone ??= {})[W.farcover.door] = now; delete W.farcover;
      const sec = Pf?.sectors?.find(x => x.slot === sideOf(state, Lf?.door, 2));
      if (sec && idle && !busyLook(W)) { a.headRad = q(sec.yawRad, 1e-6); a.face = faceOfHead(a.headRad); }
    } else if (idle && !busyLook(W)) { a.headRad = q(Math.atan2(c.z - a.z, c.x - a.x), 1e-6); a.face = faceOfHead(a.headRad); }
  }
  calloutTick(state, bus, R, H, a, now, L, P);
}
/** You mark a room you are last out of only passing its door, within this of the door's middle (m; my call: the jamb in reach). */
export const MARK_NEAR_M = 1.5;
/** By the keys, your far walk is seen this far past your point toward the far leg (m; drill D4, my call). */
export const FAR_WALK_M = 0.5;
// (a man of yours he saw before you, called once (see the section's header))
function calloutTick(state, bus, R, H, a, now, L, P) {
  const W = H.two, c = state.mind?.contact, known = c?.known ?? {}, last = c?.last?.ids ?? [], me = playerActor(state);
  const yoursSeen = (k) => known[k] !== undefined || last.includes(k);
  if (W.callout) {
    if (now < W.callout.untilMs) return;
    const k = W.callout.key, T = R.turners.find(x => x.key === k);
    delete W.callout;
    if (!T || !me || !P || T.stoppedAtMs !== null || yoursSeen(k) || !twoSees(state, a, T, now)) return;
    const rangeM = Math.hypot(T.x - a.x, T.z - a.z), roller = rollerOf(state, H.twoPid, { ms: now });
    const roll = check(stream(state.meta.seed, 'house:two-callout', T.key, now), { skill: 'awareness', value: roller.value('awareness'), dc: IDENT_DC0 + Math.round(rangeM / IDENT_PER_M), mods: roller.mods('awareness', { ms: now }), pressure: 'evaluated', by: H.twoPid });
    const face = roll.ok ? faceWordOf(T) : null, place = placeWordsOf(P, [me.x, me.z], [T.x, T.z]);
    const text = TEAM_WORDS.contact.words.replace('{face}', face ?? 'Man').replace('{place}', place);
    sayTwo(bus, W, 'contact', text, { callout: true });
    tell(state, playerId(state), k, { atMs: now, bearingRad: Math.atan2(T.z - me.z, T.x - me.x), face: roll.ok ? T.face : null, at: [T.x, T.z] });
    (W.called ??= {})[k] = now;
    tallyCall(L, 'contact');
    return;
  }
  if (!L || !P || W.contact || W.eng || W.down) return;
  for (const T of R.turners) {
    if (legOf(T) !== H.cur || twoOwns(state, T) !== 1 || T.stoppedAtMs !== null || W.called?.[T.key] !== undefined || yoursSeen(T.key)) continue;
    if (!twoSees(state, a, T, now)) continue;
    const t = takeInMs(state, H.twoPid, { id: `two-call:${T.key}`, targets: [{ key: T.key, x: T.x, z: T.z, rangeM: q(Math.hypot(T.x - a.x, T.z - a.z), 0.01), face: T.face }], seenMs: now });
    W.callout = { key: T.key, untilMs: now + t.ms };
    (W.called ??= {})[T.key] = -1;
    return;
  }
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
  // (never a round through you (maskHold))
  if (maskHold(state, bus, R, H, a, T, now)) return;
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
// ---- the line of fire held both ways, your limit of advance (the build sheet v0.0.20 item 3; COMBAT §25.19.3.5) ----

/** "Line!" said over the move (ms; bundle.js CALL_FLOW_S 0.2, a call's flowing time: a literal, bundle.js and this module being in one cycle). */
export const LINE_CALL_MS = 200;
// (a stand's aim point, for carry.js lineMasked)
const aimPoint = (T) => ({ x: T.x, y: T.y ?? 1.35, z: T.z });
/** Whether a person's body masks a shooter's line onto a stand now: carry.js lineMasked from the shooter's line at the holder aimed to the stand's aim point, the body a capsule of its stance (MASK_R_M). */
export function maskedBy(state, shooterPid, shooter, T, body) {
  if (!shooter || !T || !body) return false;
  return !!lineMasked(lineFromOf(state, shooterPid, shooter, T), aimPoint(T), [{ x: body.x, z: body.z, stance: body.stance ?? 'stand' }]);
}
// (his rounds' times moved on: the first not fired to `to` at the least, the rest kept their spacing after it)
function pushRounds(E, to) {
  const first = E.rounds.find(r => !r.done);
  if (!first || first.atMs >= to) return;
  const d = to - first.atMs;
  for (const r of E.rounds) if (!r.done) r.atMs += d;
}
/**
 * His row held while you stand on its line (see the section; drill.md item 1): his first round due and his line onto his man
 * passing within MASK_R_M of your body, the rounds wait a tick at a time (W.masked = { since, by, said }), "Line!" once a hold
 * (TEAM_WORDS.line); held MASK_FAULT_MS, the instructor's 'masked' fault once a room; held MASK_HOLD_MAX_MS (not while he takes his
 * man on the move), he steps MASK_STEP_M square to his line on the side clear of you (places/move.js stepAside, a carry 'aside'),
 * his row planned again from there (twoPlan), his take-in kept. The line clear, the hold is noted on the leg (L.masked: [{ atMs,
 * by, ms }]) and his next round goes MASK_RESUME_MS on (TRIGGER_S, the press after the line opens). Returns whether he holds.
 */
function maskHold(state, bus, R, H, a, T, now) {
  const W = H.two, E = W.eng, me = playerActor(state), first = E.rounds.find(r => !r.done);
  if (W.masked?.step !== undefined) {
    // (stepping aside: his rounds wait for his feet; there, his row again from where he stands)
    if (a.through?.prof && (a.through.untilMs ?? 0) > now) { pushRounds(E, whole(now + TICK_MS)); return true; }
    maskEnd(state, H, now);
    if (T && T.stoppedAtMs === null) { twoPlan(state, R, H, a, T, now, E.follow ?? 0); if (W.eng) return true; }
    return false;
  }
  if (!first || first.atMs > now || !T || T.stoppedAtMs !== null) return false;
  if (me && maskedBy(state, H.twoPid, a, T, me)) {
    const M = (W.masked ??= { since: now, by: playerId(state), said: false });
    if (!M.said) { M.said = true; bus?.emit('say', { who: W.pid, text: TEAM_WORDS.line.words, kind: 'speech', durMs: LINE_CALL_MS, call: 'line' }); }
    pushRounds(E, whole(now + TICK_MS));
    const L = curLeg(H);
    // (held this tick too: the hold's length counts the tick it holds, as L.masked's ms does at its end)
    if (now + TICK_MS - M.since >= MASK_FAULT_MS && L && !L.faults?.some(f => f.kind === 'masked')) houseFault(state, bus, 'masked', HOUSE_CHIEF.masked, L);
    if (now - M.since >= MASK_HOLD_MAX_MS && !E.move) maskStep(state, H, a, T, me, now);
    return true;
  }
  if (!W.masked) return false;
  maskEnd(state, H, now);
  pushRounds(E, whole(now + MASK_RESUME_MS));
  return true;
}
// (his step off the line (maskHold): square to his line onto his man, MASK_STEP_M, the side whose line from there you no longer mask
// first, else the one whose line passes farther from you (still masked, he holds again there and steps again MASK_HOLD_MAX_MS on:
// "tries again", drill.md), walked by places/move.js stepAside; none walkable, he holds on)
function maskStep(state, H, a, T, me, now) {
  const W = H.two, dx = T.x - a.x, dz = T.z - a.z, l = Math.sqrt(dx * dx + dz * dz);
  if (!(l > 1e-6)) return;
  const n = [-dz / l, dx / l], tries = [1, -1].map(s => [q(a.x + n[0] * MASK_STEP_M * s, 1e-4), q(a.z + n[1] * MASK_STEP_M * s, 1e-4)]);
  // (how far your body stands off his line from a place: its least distance in plan to the segment to his man)
  const off = (p) => { const ux = T.x - p[0], uz = T.z - p[1], L2 = ux * ux + uz * uz, t = L2 > 0 ? Math.max(0, Math.min(1, ((me.x - p[0]) * ux + (me.z - p[1]) * uz) / L2)) : 0; return Math.hypot(p[0] + ux * t - me.x, p[1] + uz * t - me.z); };
  const score = (p) => (maskedBy(state, W.pid, { ...a, x: p[0], z: p[1] }, T, me) ? 0 : 1000) + off(p);
  tries.sort((p1, p2) => score(p2) - score(p1));
  for (const to of tries) {
    const t = stepAside(state, W.pid, a, to, now);
    if (!t) continue;
    a.through = t; W.masked.step = now;
    return;
  }
}
// (a hold over: noted on the leg (L.masked), the record dropped)
function maskEnd(state, H, now) {
  const M = H.two.masked, L = curLeg(H);
  if (!M) return;
  delete H.two.masked;
  if (L) (L.masked ??= []).push({ atMs: M.since, by: M.by, ms: now - M.since });
}
/**
 * The house's line and bodies watched at the end of the rules layer (shoothouse.js houseRules, after the live men's; the build sheet
 * v0.0.20 §4.4's tick order): each walk of yours held by a body noted once on the leg (L.pins: [{ atMs, ms, how, by }], from the beat's
 * `pinned`, places/move.js); your limit of advance (H.limit = { door, fromMs } while you stand more than LIMIT_FAR_M from your #2 inside
 * his sector's wedge, his point his, before he has swept the room: the DI's cqb-limit at LIMIT_WARN_MS); your #2 past his threshold
 * after you on his heels (L.heelsMs, written only where his heels beat ran: bundle.js heelsStart). Writes nothing on a lane where
 * nobody pins, masks or closes up.
 */
export function maskTick(state, bus, H, now = state.clock.ms) {
  const L = curLeg(H), S = state.stop, me = playerActor(state);
  if (!L || !me) return;
  for (const b of [...(S?.doing?.beats ?? []), ...(S?.flow?.beats ?? []), S?.feet, me.through]) {
    const p = b?.pinned;
    if (!p || p.noted) continue;
    p.noted = true;
    (L.pins ??= []).push({ atMs: p.atMs, ms: p.ms, how: p.how, by: p.by ?? null });
  }
  const W = H.two, two = W?.pid ? actorOf(state, W.pid) : null, P = planOf(state, L);
  if (!two || !P?.door) { if (H.limit) delete H.limit; return; }
  if (W.heels?.door === L.door && L.heelsMs === undefined && Number.isFinite(L.enteredAtMs) && pastThreshold(P, two.x, two.z)) L.heelsMs = now - L.enteredAtMs;
  const rule = L.state === 'entered' && !W.swept?.[L.door] ? cornerRuleOf(P, sideOf(state, L.door, 2)) : null;
  const pt = rule?.point, S2 = rule?.sector, off = Math.hypot(me.x - two.x, me.z - two.z);
  const atPoint = !!pt && Math.hypot(two.x - pt[0], two.z - pt[1]) <= LIMIT_POINT_M;
  const inWedge = !!S2 && off > LIMIT_FAR_M && wrapUp(Math.atan2(me.z - two.z, me.x - two.x) - S2.fromRad) <= S2.toRad - S2.fromRad;
  if (atPoint && inWedge) { if (H.limit?.door !== L.door) H.limit = { door: L.door, fromMs: now }; }
  else if (H.limit) delete H.limit;
}
/** Your limit of advance (maskTick): you inside his sector's wedge farther than this from him (m; drill.md item 1), his point within LIMIT_POINT_M of him (flawless.mjs POINT_AT_M's figure, rounded up). */
export const LIMIT_FAR_M = 0.6, LIMIT_POINT_M = 0.4;
// (an angle brought into [0, 2π))
const wrapUp = (r) => ((r % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

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
 * His transition (v0.0.19, his P-12, standard issue from v0.0.20): the pistol holstered, an armed man of his facing within TRANSITION_NEAR_M
 * (or nothing left to load the rifle with: `any`), the rifle let hang and the P-12 drawn (sidearm.js weaponList 'transition'),
 * no call, on his list as his drills are (twoAdminTick; the pistol into his hand at the draw's end: twoPend). Returns whether he
 * went to it.
 */
function twoTransition(state, bus, H, W, a, T, now, any = false) {
  const k = state.people[W.pid]?.kit;
  if (!W.pistol || !a || k?.worn?.holster !== W.pistol || handGun(state, W) || !(any || facingNear(state, W, a, now))) return false;
  const list = weaponList(state, W.pid, 'transition');
  if (!list) return false;
  W.down = { key: T?.key ?? W.down?.key ?? null, atMs: W.down?.atMs ?? now, macro: 'transition', tries: W.down?.tries ?? 0, ...(W.down?.said ? { said: W.down.said } : {}) };
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
  const tries = (W.down?.tries ?? 0) + 1, macro = fix.subs?.length ? drillName(fix) : null, reload = !!macro && /^reload:/.test(macro), opened = !!W.down?.said;
  // (the call he opened with (TEAM_WORDS id, `said`), kept over the tries: what his "Gun up!" or "Up." closes (the review of
  // 2026-11-16: an IA that turned into a speed reload opened "Gun down!" and closed "Up.", the words F36 calls not closed))
  const said = W.down?.said ?? (macro && tries <= TWO_TRIES ? (reload ? 'reloading' : 'gunDown') : null);
  W.down = { key: T?.key ?? W.down?.key ?? null, atMs: W.down?.atMs ?? now, macro, tries, ...(said ? { said } : {}) };
  if (!macro || tries > TWO_TRIES) { twoGunUp(state, bus, H, now, { failed: true }); return; }
  // (a call already said (his status's "Gun down!" at your "Room clear!", then his Rifle up meeting a stopped rifle) is not said twice)
  if (tries === 1 && !opened) sayOn(state, bus, { who: W.pid, text: TEAM_WORDS[said].words, kind: 'speech' });
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
  if (D.macro !== 'transition' || D.said) sayOn(state, bus, { who: W.pid, text: D.said ? TEAM_WORDS[TEAM_WORDS[D.said].close].words : /^reload:/.test(D.macro) ? TWO_SAY.up : TWO_SAY.gunUp, kind: 'speech' });
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
