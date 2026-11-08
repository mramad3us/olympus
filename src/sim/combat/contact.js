// OLYMPUS sim: the contact, from the first sighting of a target to the pause that hands the choice back: the detector, the window, the pause, the identification and the contact's rows (COMBAT §25.4.1, §25.4.5, §25.4.6, §25.4.8; the build sheet 0.0.8 §2.1, §3.1, §8 items 2, 5 to 9, 25, 26).
//
// The detector (contactLook, the people domain's fast layer 'look', lived ticks only) looks at the range
// session's turners (arms/turners.js: at most six on the bay; until the player's sightings exist in 0.0.10 it
// calls PEOPLE's sightOf on them itself, COMBAT §25.10.3) and at nothing else, so a game with no turners, gunless
// or test-handling or test-range, is never touched. A turner not yet known whose seenK = sightOf(me, its spot).vis
// × facingOf(T, ms) reaches SEEN 0.5 on this tick is seen: it opens the window (the 'contact' fact 'seen') or,
// a window being open, joins it ('join': the window's end re-taken as the first sighting plus the take-in for
// all of them, severalK by their number, the worst whoK, the slowest expectation; COMBAT §25.4.5's several
// people). A turner stays known while it faces; turned away (facing under SEEN) it is forgotten, so its next
// turn is a fresh sighting. The window's record is the mind's (people/mind.js noteContact; state.mind.contact =
// { n, known: { key: seenMs }, pending, last }), plain data, absolute times only (COMBAT §25.4.8):
//     pending = { id, ids, seenMs, untilMs, ms, expect, n, grade, roll, parts, rangeM, whoK, armed, goMs, mx, mz, run }
// where ms is react.js takeInMs's take-in and untilMs = seenMs + ms.
//
// During the window (COMBAT §25.4.5) the world runs at 1:1 and the keys are not the marine's: refusesAct(state,
// action) is true for every sim action (game.js act()'s gate, the build sheet's §2.6), the page refusing its own
// keys but Space and Esc; the feet (feetOf, read by places/move.js playerStep) carry the move held at the
// sighting for the body's go (react.js goMs: 235 ms for the private) and then stop (BODY §16.2's braking waits
// for the stances: §8 item 7), unless the marine was pre-armed (pending.armed: nobody this round), whose held
// move carries on through the window.
//
// The pause (contactInput, the people domain's fast layer 'input', which runs while time stands still): on the
// first tick at or past untilMs it enters stop motion with the contact bracketed (shooting.js enterStop, via
// 'contact', the pick the window's target nearest the muzzle's yaw) and holds 'stop', so that very tick freezes
// (TIME §4.3). A step still running then (a live V, A or W out of the mode, or a stop-motion step) is let end
// first and the pause comes on its end's tick (its boundary is taken here when due, as shooting.js stopInput
// would take it later in the same layer); a command (a macro) finishes the sub-step under way and halts there,
// its rest queued as the panel's "Carry on" (COMBAT §25.4.5 as built: the design's 250 ms FINISH_MS rule replaced, a sub-step is never cut: one
// that ends within 250 ms finishes, and so does one that ends later, the pause waiting for it); a chained wait
// is cut. It always ends in a pause, never on a person the marine has not taken in, and time never stands still
// inside the window: a stop-motion step that ends in it lets the clock run on (its 'stop' hold released here,
// should the step's end have set it), and any other hold (a reflex card) ends the window at once, so the game
// cannot freeze with every action refused. At the pause each target is identified (identify: an Awareness check
// against IDENT_DC0 6 + round(range / 5 m), +4 in the dark, on stream(seed, 'combat:ident', pid, contactId, key,
// atMs)): passed, what it holds (T.holds: 'rifle', 'pistol', 'hands', 'phone') and, on an armoured face, the
// armour; failed, 'unseen' ("can't see his hands"), never a weapon that is not there. The record moves to last =
// { id, ids, seenMs, atMs, ms, expect, n, grade, parts, pick, ident, armour, words }, the log gets a 'contact'
// entry with the take-in factor by factor and what was seen, and the bus the 'contact' fact 'pause'.
//
// The contact's rows (contactRows, read by shooting.js stepsOf at a pause on the bracketed target if it is one
// of the contact's and still faces): Hold him ('contact:hold': the aim if not on him, then the held aim to +4,
// no shot) and Challenge ('contact:challenge', CHALLENGE_MS 1.2 s, "Show me your hands!", where his hands were
// not seen or are empty: after it a fresh identification at +CHALLENGE_BONUS 4); both lead the panel (lead:
// true) for an identified no-shoot (COMBAT §25.4.6). runContactSub and endContactSub are the challenge's
// sub-step, called by shooting.js runSub and endSub. lullOf(state, pid, ms) is the lull a Top up waits for: no
// window open, no threat facing and standing, and LULL_MS 3 s since the latest of your last shot, the last
// pause and the last turner gone edge-on. contactNow(state, ms) is the HUD's view: the window's k (the brackets
// closing) and the last contact (the stamp, the plaque's lead, the log).
// 0.0.9 (the build sheet 0.0.9 §2.1, §8 items 9, 11; COMBAT §5.3, §5.7): the window's take-in reads felt's band at its
// first sighting (supp.js bandN(feltOf(state, pid, seenMs)), kept on the window as pending.band so a target joining it
// is taken in on the same band); a startle is the window re-used: refusesAct is true and feetOf stops the feet while the
// player is startled, no sighting is taken while he is startled or flash-blind (the detector looks again on the first
// tick after, with the felt of that moment), and a window open when it came pauses only once it is over.
// Pure but contactLook, contactInput, identify, runContactSub and endContactSub, which write the mind, the stop
// and the log.
import { holdTime, releaseTime, isHeld } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { stream } from '../../core/rng.js';
import { playerActor, playerId } from '../../core/ids.js';
import { check } from '../skills/checks.js';
import { sheetOf } from '../skills/templates.js';
import { rollerOf, DARK_BELOW } from './roll.js';
import { sightOf, SEEN } from '../people/perception.js';
import { contactOf, noteContact } from '../people/mind.js';
import { muzzleOf, angleDiff } from '../arms/carry.js';
import { turnersOf, turnerOf, facingOf, turnerTargets, edgeOnMs } from '../arms/turners.js';
import { takeInMs, goMs, takeInWords, takeInText, windowK } from './react.js';
import { enterStop, stopInput, targetOf } from '../arms/shooting.js';
import { heldOf, aimMsOf, HELD_MAX, HELD_RATE0 } from '../arms/shot.js';
import { logEntry } from '../log.js';
import { startled, feltOf, bandN, blockOf } from './supp.js';

/** The identification's DC (COMBAT §25.4.6): IDENT_DC0 + round(range / IDENT_PER_M), IDENT_DARK in the dark. */
export const IDENT_DC0 = 6, IDENT_PER_M = 5, IDENT_DARK = 4;
/** The challenge (COMBAT §9.3, §25.4.6): its time and the identification's bonus after it. */
export const CHALLENGE_MS = 1200, CHALLENGE_BONUS = 4;
/** The lull a Top up waits for (the build sheet's §4). */
export const LULL_MS = 3000;
/** What a turner holds, in the words of what the marine saw; and what a failed look leaves. */
export const IDENT_WORDS = Object.freeze({ rifle: 'a rifle', pistol: 'a pistol', hands: 'hands empty', phone: 'a phone in his hand', unseen: "can't see his hands" });
/** The challenge's words. */
export const CHALLENGE_SAY = 'Show me your hands!';
/** The contact rows' labels. */
export const CONTACT_LABELS = Object.freeze({ 'contact:hold': 'Hold him', 'contact:challenge': 'Challenge' });

const sgn = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const ZERO_FEET = Object.freeze({ mx: 0, mz: 0, run: false, stroll: false });
const threatFace = (face) => face === 'threat' || face === 'armoured' || face === 'unknown';

/** The window open, or null. */
export function pendingOf(state) { return contactOf(state)?.pending ?? null; }

/** Whether a sim action is refused: every one while a window is open or the player is startled (COMBAT §25.4.5, §5.7; game.js act()'s gate). */
export function refusesAct(state, action) { return !!pendingOf(state) || startled(state, playerId(state), state.clock.ms); }

/**
 * The feet while a window is open (see the header): the move held at the sighting until seenMs + goMs, then
 * stopped; pre-armed, the held move all through. With no window, the input's own. Returns { mx, mz, run, stroll }.
 */
export function feetOf(state, input) {
  if (startled(state, playerId(state), state.clock.ms)) return ZERO_FEET;
  const P = pendingOf(state);
  if (!P) return { mx: sgn(input?.mx), mz: sgn(input?.mz), run: !!input?.run, stroll: !!input?.stroll };
  if (P.armed || state.clock.ms < P.seenMs + P.goMs) return { mx: P.mx, mz: P.mz, run: !!P.run, stroll: false };
  return ZERO_FEET;
}

// (the target records of a window's keys at ms, with the range from the player)
function targetsAt(state, keys, ms) {
  const me = playerActor(state);
  return turnerTargets(state, ms).filter(t => keys.includes(t.key)).sort((a, b) => keys.indexOf(a.key) - keys.indexOf(b.key))
    .map(t => ({ key: t.key, x: t.x, z: t.z, face: t.face, rangeM: q(Math.hypot(t.x - (me?.x ?? 0), t.z - (me?.z ?? 0)), 0.01) }));
}

// (the take-in of a window's targets, from its first sighting: one notice check, keyed by the contact)
// (band: the window's, felt's band at its first sighting, given on a join)
function windowOf(state, pid, id, keys, seenMs, roll = null, band = null) {
  const targets = targetsAt(state, keys, seenMs);
  const b = band ?? bandN(feltOf(state, pid, seenMs));
  const t = takeInMs(state, pid, { id, targets, seenMs, roll, band: b });
  return { t, rangeM: targets[0]?.rangeM ?? 0, band: b };
}
// (the player's eyes taken by a flash at ms)
const blindAt = (state, pid, ms) => { const r = blockOf(state, pid); return !!r && Number.isFinite(r.blindUntilMs) && ms < r.blindUntilMs; };

// (the 'contact' fact's payload)
const fact = (phase, pid, rec, extra = {}) => ({ phase, id: rec.id, who: pid, ids: [...rec.ids], seenMs: rec.seenMs, untilMs: rec.untilMs ?? rec.atMs ?? null, ms: rec.ms, expect: rec.expect, n: rec.n,
  grade: rec.grade, parts: rec.parts, ident: rec.ident ?? null, armour: rec.armour ?? null, atMs: extra.atMs ?? rec.atMs ?? rec.seenMs, ...extra });

/** The fast layer 'look', the detector (see the header): lived ticks only. */
export function contactLook(state, input, bus, ctx) {
  const list = turnersOf(state);
  if (!list.length || state.skip) return;
  const me = playerActor(state);
  if (!me) return;
  const pid = me.who, ms = state.clock.ms;
  // (startled or flash-blind, nothing is taken in: the detector looks again on the first tick after)
  if (startled(state, pid, ms) || blindAt(state, pid, ms)) return;
  const c0 = contactOf(state);
  // (a turner turned away is forgotten: its next turn is a fresh sighting)
  if (c0) for (const key of Object.keys(c0.known)) { const T = list.find(x => x.key === key); if (!T || facingOf(T, ms) < SEEN) delete c0.known[key]; }
  const fresh = [];
  for (const T of list) {
    if (c0?.known?.[T.key] !== undefined || (T.stoppedAtMs !== null && T.stoppedAtMs !== undefined)) continue;
    const f = facingOf(T, ms);
    if (f < SEEN) continue;
    if (q(sightOf(state, me, { x: T.x, z: T.z }, ms).vis * f, 1e-6) < SEEN) continue;
    fresh.push(T.key);
  }
  if (!fresh.length) return;
  const c = noteContact(state, {});
  for (const key of fresh) c.known[key] = ms;
  const P = c.pending;
  if (!P) {
    const id = c.n + 1, { t, rangeM, band } = windowOf(state, pid, id, fresh, ms);
    c.n = id;
    c.pending = { id, ids: fresh, seenMs: ms, untilMs: ms + t.ms, ms: t.ms, expect: t.expect, n: t.n, grade: t.grade, roll: t.roll, parts: t.parts, rangeM, whoK: t.whoK,
      armed: false, goMs: goMs(sheetOf(state, pid)?.os ?? 0), mx: sgn(input?.mx), mz: sgn(input?.mz), run: !!input?.run, ...(band ? { band } : {}) };
    bus?.emit('contact', fact('seen', pid, c.pending));
    return;
  }
  // (a turner of this window turned away and back inside it is known again, not taken in twice)
  const more = fresh.filter(k => !P.ids.includes(k));
  if (!more.length) return;
  const ids = [...P.ids, ...more], { t } = windowOf(state, pid, P.id, ids, P.seenMs, P.roll, P.band ?? 0);
  Object.assign(P, { ids, untilMs: Math.max(P.untilMs, P.seenMs + t.ms), ms: Math.max(P.ms, t.ms), expect: t.expect, n: t.n, parts: t.parts, whoK: t.whoK });
  bus?.emit('contact', fact('join', pid, P, { atMs: ms }));
}

// (the window's target nearest the muzzle's yaw: the pause's bracket)
function pickOf(state, pid, keys, ms) {
  const m = muzzleOf(state, pid), list = targetsAt(state, keys, ms);
  if (!list.length) return keys[0] ?? null;
  if (!m) return list[0].key;
  let best = null;
  for (const t of list) {
    const off = Math.abs(angleDiff(Math.atan2(t.z - m.oz, t.x - m.ox), m.yawRad));
    if (!best || off < best.off - 1e-9) best = { key: t.key, off };
  }
  return best.key;
}

// (a chained wait cut at the pause, as any step chosen cuts it)
function cutWait(state, bus) {
  const S = state.stop, d = S?.doing;
  if (!d || d.kind !== 'wait') return;
  bus?.emit('step', { phase: 'cut', who: d.who, step: d.step, i: d.i, action: d.list?.[d.i] ?? null, fromMs: d.subFromMs ?? d.fromMs, toMs: d.untilMs, ok: true, grade: null, routine: null, mishap: null, text: 'cut' });
  S.doing = null; S.phase = 'choose';
}

/** The pause (see the header): the window closed, stop motion with the contact, the identification, the log. */
function pause(state, bus, c) {
  const P = c.pending, pid = playerId(state), now = state.clock.ms;
  const pick = pickOf(state, pid, P.ids, now);
  // (a startle that landed inside the window held the pause to its end (contactInput): the time it added is part of the
  // take-in the stamp, J and the paper report, named, so "Contact · 1.50 s" is the sighting to the pause (the code review of
  // v0.0.9: it said the planned 0.55 s); nothing moves without a startle past the window's end)
  const B = blockOf(state, pid), late = Number.isFinite(B?.startleUntilMs) ? Math.max(0, Math.min(now, B.startleUntilMs) - P.untilMs) : 0;
  const ms = P.ms + late, parts = late ? [...(P.parts ?? []), { why: 'startled', ms: late }] : P.parts;
  const last = { id: P.id, ids: [...P.ids], seenMs: P.seenMs, atMs: now, ms, expect: P.expect, n: P.n, grade: P.grade, parts, pick, ident: {}, armour: {}, words: takeInText({ ...P, ms, parts }) };
  noteContact(state, { pending: null, last });
  const S = state.stop;
  if (S?.mode === 'stop') {
    cutWait(state, bus);
    S.pick = pick; S.via = 'contact';
    holdTime(state, 'stop');
  } else {
    const r = enterStop(state, bus, { pid, via: 'contact', pick, contact: { id: P.id, ms } });
    if (r?.ok && state.stop?.mode === 'stop') { state.stop.pick = pick; state.stop.via = 'contact'; }
  }
  for (const key of last.ids) identify(state, pid, key, { atMs: now });
  const seen = last.ids.map(k => `${targetName(state, k)}: ${identWords(last, k)}`).join('; ');
  logEntry(state, bus, { kind: 'contact', tone: 'warn', text: `Contact · ${takeInWords(last.ms)} s. ${last.words} ${seen.charAt(0).toUpperCase()}${seen.slice(1)}.`, contact: last.id });
  bus?.emit('contact', fact('pause', pid, last));
}

/** The fast layer 'input' (runs while time stands still): the window's end, the pause on its tick (see the header). */
export function contactInput(state, input, bus, ctx) {
  const c = contactOf(state), P = c?.pending;
  if (!P || state.skip) return;
  // (startled: the pause waits for its end (supp.js suppInput lets a stop hold go while it lasts))
  if (startled(state, playerId(state), state.clock.ms)) return;
  if (state.clock.ms < P.untilMs) {
    // (time held inside the window would freeze the game on a person not yet taken in, every action refused: a stop-motion
    // step that ended here lets the clock run on, the body idle (COMBAT §25.4.5); any other hold (a reflex card) ends the
    // window at once, the choice being asked anyway)
    if (!isHeld(state)) return;
    const S = state.stop;
    if (S?.mode === 'stop' && !S.doing && !S.reflex && state.clock.holds.every(h => h === 'stop')) { releaseTime(state, 'stop'); return; }
  }
  // (a step still running: its boundary taken now if due, and the pause at its end; a command (a macro) finishes the
  // sub-step under way and halts there, its rest queued as "Carry on" (COMBAT §25.4.5: never cut mid-sub-step))
  let d = state.stop?.doing;
  if (d && d.kind === 'command' && state.stop.mode === 'stop' && d.i + 1 < d.list.length) d.halt = true;
  if (d && d.kind !== 'wait') {
    if (state.clock.ms >= d.untilMs) stopInput(state, input, bus, ctx);
    d = state.stop?.doing;
    if (d && d.kind !== 'wait') return;
  }
  pause(state, bus, c);
}

// (a target's name in the log's words)
const targetName = (state, key) => { const T = turnerOf(state, key); return T ? `lane ${T.lane}` : key; };
// (what was seen of a target, in words)
const identWords = (last, key) => `${IDENT_WORDS[last.ident?.[key] ?? 'unseen']}${last.armour?.[key] ? ', plate armour' : ''}`;

/**
 * The identification of one target of the last contact (see the header): Awareness against IDENT_DC0 +
 * round(range / IDENT_PER_M) (+IDENT_DARK in the dark) − bonus. Writes last.ident[key] (and last.armour[key] on
 * an armoured face seen); a failed look never takes away what an earlier one saw. Returns { ident, armour, roll }.
 */
export function identify(state, pid, key, { bonus = 0, atMs = state.clock.ms } = {}) {
  const L = contactOf(state)?.last, T = turnerOf(state, key), me = playerActor(state);
  if (!L || !T) return null;
  const rangeM = Math.hypot(T.x - (me?.x ?? 0), T.z - (me?.z ?? 0)), roller = rollerOf(state, pid, { ms: atMs });
  const dark = roller.light < DARK_BELOW;
  const dcParts = [{ why: 'base', v: IDENT_DC0 }, { why: `${Math.round(rangeM)} m`, v: Math.round(rangeM / IDENT_PER_M) }];
  if (dark) dcParts.push({ why: 'in the dark', v: IDENT_DARK });
  if (bonus) dcParts.push({ why: 'challenged', v: -bonus });
  const parts = dcParts.filter(p => p.v), dc = parts.reduce((a, p) => a + p.v, 0);
  const roll = check(stream(state.meta.seed, 'combat:ident', pid, L.id, key, atMs), { skill: 'awareness', value: roller.value('awareness'), dc, mods: roller.mods('awareness', { ms: atMs }),
    pressure: 'evaluated', by: pid, dcParts: parts, verb: null });
  const before = L.ident[key];
  const ident = roll.ok ? T.holds : before && before !== 'unseen' ? before : 'unseen';
  const armour = (roll.ok && T.face === 'armoured') || !!L.armour[key];
  L.ident[key] = ident;
  if (armour) L.armour[key] = true;
  return { ident, armour, roll };
}

/**
 * The contact's rows on the bracketed target (see the header), the step panel's shape: { id, kind: 'contact', label,
 * ms, rushMs, carefulMs, odds, routine, off, subs: [{ id, label, ms }], list: [id], cmd, skill, target, lead }.
 */
export function contactRows(state, pid = playerId(state), ms = state.clock.ms) {
  const S = state.stop, L = contactOf(state)?.last;
  if (!S || S.mode !== 'stop' || !L || !S.pick || !L.ids.includes(S.pick)) return [];
  const key = S.pick, T = turnerTargets(state, ms).find(t => t.key === key);
  if (!T || T.facingK < SEEN || T.down) return [];
  const id = L.ident[key] ?? 'unseen', lead = id === 'hands' || id === 'phone';
  const tgt = targetOf(state, key, pid) ?? { ...T, dM: Math.hypot(T.x - (playerActor(state)?.x ?? 0), T.z - (playerActor(state)?.z ?? 0)) };
  const aimed = S.aim?.key === key;
  const aimMs = aimed ? 0 : aimMsOf(state, pid, S.gun, tgt);
  const rate = HELD_RATE0 + rollerOf(state, pid, { ms }).value('marksmanship') / 10;
  const holdMs = aimed ? (heldOf(state, pid, ms, key).toFullMs ?? 0) : Math.ceil(HELD_MAX / rate * 1000);
  const row = (rid, ms0, subs, o = {}) => ({ id: rid, kind: 'contact', label: CONTACT_LABELS[rid], ms: ms0, rushMs: null, carefulMs: null, odds: null, routine: null, off: null,
    subs, list: subs.map(s => s.id), cmd: false, skill: null, target: key, lead, ...o });
  // (held already, the aim at its full on him: struck 'held', no longer leading, so the next decision leads (the design
  // review of v0.0.8: pressed again it took 0 ms and did nothing, a dead button at the head of the panel))
  const held = aimed && heldOf(state, pid, ms, key).v >= HELD_MAX;
  const out = [row('contact:hold', aimMs + holdMs, [...(aimed ? [] : [{ id: 'aim', label: 'Aim', ms: aimMs }]), { id: 'hold', label: 'Hold the aim', ms: holdMs }], { skill: 'marksmanship', ...(held ? { off: 'held', lead: false } : {}) })];
  if (id === 'unseen' || id === 'hands' || id === 'phone') out.push(row('contact:challenge', CHALLENGE_MS, [{ id: 'contact:challenge', label: CONTACT_LABELS['contact:challenge'], ms: CHALLENGE_MS }], { words: CHALLENGE_SAY }));
  return out;
}

/** A contact sub-step at its start (shooting.js runSub): the challenge said. Returns { ms, text }. */
export function runContactSub(state, bus, d, id, atMs) {
  if (id !== 'contact:challenge') return { ms: 0, text: null };
  bus?.emit('say', { who: d?.who ?? playerId(state), text: CHALLENGE_SAY, kind: 'speech', durMs: CHALLENGE_MS });
  return { ms: CHALLENGE_MS, text: CHALLENGE_SAY };
}

/** A contact sub-step at its end (shooting.js endSub): after the challenge, a fresh identification at +CHALLENGE_BONUS, and the line says what you now see. */
export function endContactSub(state, bus, d, id) {
  if (id !== 'contact:challenge') return null;
  const pid = d?.who ?? playerId(state), key = d?.target ?? state.stop?.pick, L = contactOf(state)?.last;
  if (!key || !L?.ids.includes(key)) return null;
  const r = identify(state, pid, key, { bonus: CHALLENGE_BONUS, atMs: state.clock.ms });
  if (!r) return null;
  const text = r.ident === 'unseen' ? "Still can't see his hands." : r.ident === 'hands' ? 'Hands. No weapon.' : r.ident === 'phone' ? 'A phone. No weapon.' : `${IDENT_WORDS[r.ident].charAt(0).toUpperCase()}${IDENT_WORDS[r.ident].slice(1)}!`;
  bus?.emit('line', { text, kind: r.ident === 'rifle' || r.ident === 'pistol' ? 'warn' : 'note' });
  logEntry(state, bus, { kind: 'contact', tone: 'note', text: `${targetName(state, key)}, challenged: ${identWords(L, key)}.`, roll: r.roll, contact: L.id });
  bus?.emit('contact', fact('ident', pid, L, { atMs: state.clock.ms }));
  return r;
}

/**
 * Whether the pause's contact is still live at ms: one of the targets taken in faces (SEEN) and stands. The panel's
 * order reads it (shooting.js stepsOf: the contact's rows first, the commands that are no answer to him after).
 */
export function contactLive(state, ms = state.clock.ms) {
  const L = contactOf(state)?.last;
  if (!L?.ids?.length) return false;
  const ids = new Set(L.ids);
  return turnerTargets(state, ms).some(t => ids.has(t.key) && t.facingK >= SEEN && !t.down);
}

/** Whether there is a lull (see the header) at ms. */
export function lullOf(state, pid = playerId(state), ms = state.clock.ms) {
  const c = contactOf(state);
  if (c?.pending) return false;
  const list = turnersOf(state);
  let latest = -Infinity;
  for (const T of list) {
    if (threatFace(T.face) && (T.stoppedAtMs === null || T.stoppedAtMs === undefined) && facingOf(T, ms) >= SEEN) return false;
    const e = edgeOnMs(T);
    if (e !== null && e <= ms) latest = Math.max(latest, e);
  }
  for (const s of state.armoury?.range?.shots ?? []) if ((s.who ?? pid) === pid && s.atMs <= ms) latest = Math.max(latest, s.atMs);
  if (c?.last) latest = Math.max(latest, c.last.atMs);
  return ms - latest >= LULL_MS;
}

/**
 * The HUD's view of the contact at ms (see the header): { pending: { id, ids, seenMs, untilMs, ms, k, expect, n } | null,
 * last: { id, ids, seenMs, atMs, ms, expect, n, grade, parts, pick, ident, armour, words } | null }, or null before the first.
 */
export function contactNow(state, ms = state.clock.ms) {
  const c = contactOf(state);
  if (!c) return null;
  const P = c.pending;
  return {
    pending: P ? { id: P.id, ids: [...P.ids], seenMs: P.seenMs, untilMs: P.untilMs, ms: P.ms, k: windowK(P, ms), expect: P.expect, n: P.n } : null,
    last: c.last ? { ...c.last, ids: [...c.last.ids], ident: { ...c.last.ident }, armour: { ...c.last.armour } } : null,
  };
}
