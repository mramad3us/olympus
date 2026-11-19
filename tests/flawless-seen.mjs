// OLYMPUS tests: F85, F86 and F97, the Seen record against the stage (the build sheet v0.0.23 §8; §0 item 33; the stage-0 lead's F97 for the user's note of 2026-11-17).
//
// The stage is not switched to the record (render/view.js armsOf keeps reading look.js gunLook and kitLook, whose per-tick fields a key
// would freeze), so the two could drift apart; this file holds them together on every tick of a lane, through an ORACLE written here
// from the stage's own readers and never through src/sim/people/seen.js (the check of the build sheet: a parity against a look made
// from the record could not fail):
//   F85  the record agrees with the stage: for you, your number two, each role-player and each other man with a kit, the record's hold
//        (how) and pose equal the oracle's (a device in the hands, devices.js handDeviceOf, as heldLook draws it; the hands up by the
//        view's own rule, the actor's flag with no gun record, or the house's look's frame for a role-player who gave up; the gun by
//        gunLook's carry through ORACLE_CARRY, the P-12 in the hands by the sim's own posture record, kit.carry.posture; a magazine in a
//        hand with no gun in them; the body by figureOf's posture, the stance the rifle's frame is drawn in, and the role-player's state
//        on the house's look for one frozen on his knee), and the facing from the actor's heading against the bearing to your eye,
//        computed here with dot products; for each stand, the board's record for the stand as you identified it (engage.js seenFace)
//        holds what the stage paints in its hands (shoothouse.js houseLook's stands' holds through ORACLE_BOARD; the record for a face and
//        a hold is the same each tick, so it is made once a lane for each);
//   F86  no record's key changes in a pause (at every read with the clock standing in stop motion, nothing under way, each actor's key
//        is the one read at the tick's end, ms + TICK_MS, and the one read before it at the same tick), and the stage's look keys over the lane (stageKeyOf, the stage-0 lead's lookkeys.mjs keyOf to the letter: view.js
//        armsOf's armedLook variant, heldLook's device and the stance sheet's carry, per actor per tick) are the set recorded on the
//        snapshot of v0.0.22 (tests/seen-lookkeys.json), so nothing of this round moves the stage's figures;
//   F97  the P-12's posture, one record (the user, 2026-11-17: "sidearm should have the same stances (low ready, high ready, aimed, etc)
//        as the rifle"): on every tick with the P-12 in a man's hands (kit.js handGunOf), gunLook's pistol.posture is the sim's
//        kit.carry.posture and the record's hold its own for each (pistol-ready, pistol-high, pistol-aim); and the act the record names
//        is the oracle's: on your ticks the one your running action makes (shooting.js stepNow's action by ORACLE_ACT: the draw while
//        'draw:thigh' runs, the holster, the press check, the reload, the clearing), none otherwise; on another man's, the one his
//        drawn frame makes (gunLook's action frame by ORACLE_FRAME_ACT, this file's own table: before the review of 2026-11-18 a man
//        not you was held to his own record's act, a check that could not fail), and on yours the two oracles agree (actsByFrame
//        against actsByAction, so ORACLE_FRAME_ACT is held to the actions too). seen's admin case drives the press check, the reload
//        and the clearing through the gauge (no pinned lane runs them with the P-12 in the hands). The P-12's admin the drill runs as one timed beat
//        ('pistol:ready', 'pistol:clear': sidearm.js, the pistol never out of its holster in the state) is counted apart (adminBeat):
//        the stage draws the rifle through it, and so does the record (a finding for the lead: the stances' admin is never seen there).
// seenGauge({ lane }) watches a lane tick by tick (each(state)) and end() gives { F85, F86, F97 }, each { ok, …figures }; f85Line,
// f86Line and f97Line print them. Enforced at once (SEEN_ENFORCED): seen-parity runs four lanes quick and the 28 pinned ones heavy.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { root } from './helpers.mjs';
import { seenOf, standSeen } from '../src/sim/people/seen.js';
import { gunLook, kitLook, heldLook, rangeLook } from '../src/sim/arms/look.js';
import { handDeviceOf } from '../src/sim/arms/devices.js';
import { handGunOf, handMagOf } from '../src/sim/arms/kit.js';
import { faceRad } from '../src/sim/arms/carry.js';
import { seenFace } from '../src/sim/arms/engage.js';
import { stepNow } from '../src/sim/arms/shooting.js';
import { figureOf } from '../src/sim/people/figure.js';
import { TICK_MS } from '../src/core/clock.js';
import { gaitCarryOf, STANCE_CARRIES, HELD_CARRY } from '../src/art/figures/poses.js';

/** The gauges this file enforces (the build sheet v0.0.23 §8: at once). */
export const SEEN_ENFORCED = Object.freeze(new Set(['F85', 'F86', 'F97']));
/** The oracle's own tables (see the header): the stage's carry to the hold, the P-12's posture to its hold, a board's paint. */
export const ORACLE_CARRY = Object.freeze({ front: 'rifle-slung', slung: 'empty', low: 'rifle-low', high: 'rifle-high', aim: 'rifle-aim' });
export const ORACLE_PISTOL = Object.freeze({ lowReady: 'pistol-ready', highReady: 'pistol-high', aimed: 'pistol-aim' });
export const ORACLE_BOARD = Object.freeze({ rifle: 'rifle-low', pistol: 'pistol-ready', hands: 'up', phone: 'phone' });
/** Your running action to the P-12's act (see the header); an action whose frames change through it (the double feed's) may read either. */
export const ORACLE_ACT = Object.freeze({
  'draw:thigh': ['draw'], draw: ['draw'], holster: ['holster'], pressCheck: ['check'], inspect: ['check'], observe: ['check'], show: ['check'],
  seat: ['reload'], magIn: ['reload'], tap: ['reload'], reach: ['reload'], magCheck: ['reload'], lookMag: ['reload'], stowMag: ['reload'], dumpMag: ['reload'], dropMag: ['reload'],
  charge: ['clear'], release: ['clear'], lockBack: ['clear'], rack: ['clear'], clearDouble: ['clear', 'reload'],
});
/** Your running action to the P-12's acts it may make (ORACLE_ACT; a magazine out by any route reloads). */
export const actOfAction = (a) => (!a ? [null] : a.startsWith('magOut:') ? ['reload'] : ORACLE_ACT[a] ?? [null]);
/** The drawn frame (gunLook's action frame, firearms.js ACTIONS' frames) to the P-12's act, for a man not you (see the header); a frame not named is none. */
export const ORACLE_FRAME_ACT = Object.freeze({ sling: 'holster', check: 'check', magout: 'reload', magin: 'reload', charge: 'clear', release: 'clear' });
/** The act a man's drawn frame makes with the P-12 in his hands (see the header). */
export const actOfFrame = (gl) => ORACLE_FRAME_ACT[gl?.action?.frame] ?? null;
const TWO_HANDS = new Set(['rifle-low', 'rifle-high', 'rifle-aim', 'pistol-ready', 'pistol-high', 'pistol-aim']);
const COS_FRONT = Math.cos(Math.PI / 4), COS_BACK = Math.cos(3 * Math.PI / 4), EDGE = 1e-6;
const RO_POST = /(^|:)kd-ro$/;

/** The stage's look key of one actor (the stage-0 lead's lookkeys.mjs keyOf, to the letter; see the header). */
export function stageKeyOf(state, a) {
  const person = state.people?.[a.who] ?? null;
  const gl = person?.kit ? gunLook(state, a, state.clock.ms) : null;
  const kit = gl || person?.kit ? kitLook(state, a.who) : null;
  const headset = !!person?.post && RO_POST.test(person.post.key ?? '');
  const held = gl ? heldLook(state, a, state.clock.ms) : null;
  const sc = held ? HELD_CARRY : gl && STANCE_CARRIES.includes(gl.carry) ? gl.carry : null;
  const model = gl && gl.model && gl.model !== 'r7' ? gl.model : null, finish = gl && gl.finish ? gl.finish : null;
  return [a.who, gl ? 'rifle' : '-', gl?.carry ?? '-', gl ? gaitCarryOf(gl.carry) : '-', gl?.pistol?.posture ?? '-', gl && gl.mag === false ? 1 : 0,
    kit?.ears ? 1 : 0, kit?.carrier ? 1 : 0, headset ? 1 : 0, model ?? '-', finish ?? '-', kit?.mask ? 1 : 0, held?.model ?? '-', sc ?? '-'].join('|');
}
let KEYS = null;
/** The stage's look keys recorded on v0.0.22's snapshot, by lane ('house-pin <cell>' or 'house-live-pin <cell>'). */
export function recordedKeys() {
  KEYS ??= JSON.parse(readFileSync(path.join(root, 'tests', 'seen-lookkeys.json'), 'utf8'));
  return KEYS;
}

/** The oracle's hold, pose and facing of one actor (see the header), from the stage's readers alone. */
export function oracleOf(state, a, viewer, men) {
  const pid = a.who, ms = state.clock.ms, gl = state.people?.[pid]?.kit ? gunLook(state, a, ms) : null, man = men.get(pid) ?? null;
  const fig = figureOf(state, a, ms), sitting = fig.posture === 'sit' || a.posture === 'sit' || man?.frame === 'sitLow';
  const handsUp = man?.frame === 'handsUp' || man?.frame === 'handsKneel' || (a.hands === true && !gl);
  let how;
  if (handDeviceOf(state, pid)) how = 'device';
  else if (handsUp && !sitting) how = 'up';
  else {
    const p = state.items?.[handGunOf(state, pid)]?.model === 'p12' ? state.people[pid].kit.carry?.posture : null;
    how = p ? ORACLE_PISTOL[p] ?? 'pistol-ready' : gl ? ORACLE_CARRY[gl.carry] ?? 'empty' : 'empty';
    if (!TWO_HANDS.has(how) && handMagOf(state, pid)) how = 'mag';
  }
  const stance = gl?.stance ?? a.stance ?? 'stand';
  const pose = sitting ? 'sit' : handsUp ? (man?.frame === 'handsKneel' || a.stance === 'kneel' ? 'kneel' : 'stand') : man?.st === 'freeze' && stance === 'kneel' ? 'cower'
    : a.posture === 'lie' || stance === 'prone' ? 'prone' : stance === 'kneel' ? 'kneel' : 'stand';
  let facing = 'front';
  if (viewer && viewer.who !== pid) {
    const vx = viewer.x - a.x, vz = viewer.z - a.z, n = Math.hypot(vx, vz) || 1, h = Number.isFinite(a.headRad) ? a.headRad : faceRad(a.face);
    const hx = Math.cos(h), hz = Math.sin(h), c = (hx * vx + hz * vz) / n, side = (hz * vx - hx * vz) / n;
    facing = c >= COS_FRONT ? 'front' : c <= COS_BACK ? 'back' : side > 0 ? 'left' : 'right';
    if (Math.abs(c - COS_FRONT) < EDGE || Math.abs(c - COS_BACK) < EDGE) facing = null;            // (on a band's edge: either)
  }
  return { how, pose, facing };
}

/** The F85, F86 and F97 watcher of one lane (see the header); lane names its recorded keys ('house-pin <cell>'), or null for none. */
export function seenGauge({ lane = null } = {}) {
  const f85 = { records: 0, agree: 0, boards: 0, boardsAgree: 0, off: [], hows: {}, poses: {}, facings: {} };
  const f86 = { pauses: 0, held: 0, moved: [], stage: new Set() };
  const f97 = { ticks: 0, agree: 0, postures: {}, acts: {}, draws: 0, drawsRead: 0, adminBeat: 0, byFrame: 0, framesAgree: 0, off: [] };
  let last = null;
  const boards = new Map();
  const bump = (o, k) => { o[k] = (o[k] ?? 0) + 1; };
  function each(state) {
    const ms = state.clock.ms, me = state.actors.list.find(a => a.who === state.player.id) ?? null;
    const look = rangeLook(state, ms), men = new Map((look?.house?.men ?? []).map(m => [m.who, m]));
    const keys = new Map();
    for (const a of state.actors.list) {
      f86.stage.add(stageKeyOf(state, a));
      if (!a.who || !state.people?.[a.who]) continue;
      const rec = seenOf(state, a.who), want = oracleOf(state, a, me, men);
      if (!rec) continue;
      keys.set(a.who, rec.key);
      f85.records++;
      bump(f85.hows, rec.hold.how); bump(f85.poses, rec.pose); bump(f85.facings, rec.facing);
      const ok = rec.hold.how === want.how && rec.pose === want.pose && (want.facing === null || rec.facing === want.facing);
      if (ok) f85.agree++;
      else if (f85.off.length < 6) f85.off.push({ ms, who: a.who, rec: [rec.hold.how, rec.pose, rec.facing], oracle: [want.how, want.pose, want.facing] });
      // (F97: the P-12 in the hands)
      const inHand = state.items?.[handGunOf(state, a.who)]?.model === 'p12';
      const mine = a.who === state.player.id, sn = mine ? stepNow(state, a.who, ms) : null;
      if (inHand) {
        f97.ticks++;
        const p = state.people[a.who].kit.carry?.posture, gl = gunLook(state, a, ms);
        const byFrame = actOfFrame(gl), acts = mine ? actOfAction(sn?.action) : [byFrame];
        bump(f97.postures, p);
        if (rec.hold.act) bump(f97.acts, rec.hold.act);
        // (on your ticks the frame's oracle against the action's: ORACLE_FRAME_ACT held to the actions, so a man not you is read by a table with teeth)
        const framesOk = !mine || acts.includes(byFrame);
        if (mine) { f97.byFrame++; if (framesOk) f97.framesAgree++; }
        const good = gl?.pistol?.posture === p && rec.hold.how === (ORACLE_PISTOL[p] ?? 'pistol-ready') && acts.includes(rec.hold.act) && framesOk;
        if (good) f97.agree++;
        else if (f97.off.length < 6) f97.off.push({ ms, who: a.who, posture: p, look: gl?.pistol?.posture ?? null, how: rec.hold.how, act: rec.hold.act, action: sn?.action ?? null, frame: gl?.action?.frame ?? null, byFrame });
      } else if (mine && sn?.action === 'draw:thigh') {
        f97.draws++;
        if (rec.hold.act === 'draw') f97.drawsRead++;
        else if (f97.off.length < 6) f97.off.push({ ms, who: a.who, drawing: true, act: rec.hold.act });
      }
      if (mine && /^pistol:/.test(sn?.action ?? '') && !inHand) f97.adminBeat++;
    }
    // (the boards: the record for the stand as you identified it holds what the stage paints)
    for (const st of look?.house?.stands ?? []) {
      const sf = seenFace(state, st.key), k = `${sf.face}|${sf.holds}`, rec = boards.get(k) ?? boards.set(k, standSeen(sf.face, sf.holds)).get(k), want = st.holds ? ORACLE_BOARD[st.holds] ?? 'empty' : 'empty';
      f85.boards++;
      if (rec.hold.how === want) f85.boardsAgree++;
      else if (f85.off.length < 6) f85.off.push({ ms, stand: st.key, rec: rec.hold.how, oracle: want, painted: st.holds });
    }
    // (F86: a pause, the clock standing in stop motion with nothing under way, twice in a row)
    // (and the frame drawn at the paused tick's end, ms + TICK_MS with the clock held: the view's own moment in a pause)
    const paused = state.stop?.mode === 'stop' && !state.stop.doing, tick = state.clock.tick;
    if (paused) {
      f86.pauses++;
      const later = [...keys].filter(([who, k]) => seenOf(state, who, { ms: ms + TICK_MS, fresh: true })?.key !== k);
      const moved = last?.paused && last.tick === tick ? [...keys].filter(([who, k]) => last.keys.has(who) && last.keys.get(who) !== k) : [];
      if (!moved.length && !later.length) f86.held++;
      else if (f86.moved.length < 4) { const [who, k] = moved[0] ?? later[0]; f86.moved.push({ ms, who, was: last?.keys.get(who) ?? null, now: k, later: !!later.length }); }
    }
    last = { paused, tick, keys };
  }
  function end() {
    const rec = lane ? recordedKeys().lanes[lane] ?? null : null, got = [...f86.stage].sort();
    const missing = rec ? rec.filter(k => !f86.stage.has(k)) : [], added = rec ? got.filter(k => !rec.includes(k)) : [];
    return {
      F85: { ok: f85.agree === f85.records && f85.boardsAgree === f85.boards && f85.records > 0, ...f85 },
      F86: { ok: f86.held === f86.pauses && (!lane || (!!rec && !missing.length && !added.length)), pauses: f86.pauses, held: f86.held, moved: f86.moved, lane, stageKeys: got.length, recorded: rec?.length ?? null, missing, added },
      F97: { ok: f97.agree === f97.ticks && f97.drawsRead === f97.draws && f97.framesAgree === f97.byFrame, ...f97 },
    };
  }
  return { each, end };
}
const counts = (o) => Object.entries(o).sort().map(([k, n]) => `${k} ${n}`).join(', ') || 'none';
/** The lines as the runners print them. */
export const f85Line = (r) => `F85 ${r.ok ? 'MET' : 'OPEN'}: ${r.agree} of ${r.records} records agree with the oracle, ${r.boardsAgree} of ${r.boards} boards; holds ${counts(r.hows)}; poses ${counts(r.poses)}; facings ${counts(r.facings)}${r.off.length ? `; off ${JSON.stringify(r.off.slice(0, 2))}` : ''}`;
export const f86Line = (r) => `F86 ${r.ok ? 'MET' : 'OPEN'}: ${r.held} of ${r.pauses} paused reads kept every key (at the tick's end and since the last read); the stage's look keys ${r.stageKeys} against ${r.recorded ?? 'none'} recorded (${r.missing.length} missing, ${r.added.length} new)${r.moved.length || r.missing.length || r.added.length ? ` ${JSON.stringify({ moved: r.moved.slice(0, 1), missing: r.missing.slice(0, 2), added: r.added.slice(0, 2) })}` : ''}`;
export const f97Line = (r) => `F97 ${r.ok ? 'MET' : 'OPEN'}: ${r.agree} of ${r.ticks} ticks with the P-12 in the hands read its posture (${counts(r.postures)}), acts ${counts(r.acts)}; ${r.framesAgree} of ${r.byFrame} of your ticks the drawn frame's act the action's, ${r.ticks - r.byFrame} of another man's read by his drawn frame; ${r.drawsRead} of ${r.draws} draw ticks read 'draw'; ${r.adminBeat} ticks of the drill's P-12 admin beat with it holstered (the rifle drawn)${r.off.length ? `; off ${JSON.stringify(r.off.slice(0, 2))}` : ''}`;
