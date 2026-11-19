// OLYMPUS scenarios: test-burn, "Secure for burn": aboard Testudo coasting to Phobos at 0 G, three items to stow, then the 1MC's warning and the burn, strapped in or thrown (the anywhere note AW§5; ROADMAP "anywhere" step 6; BODY §13.7, §14.1, §16.5; the build sheet v0.0.24 §1 D, §3.4).
//
// The ship's events are the gravity's (src/sim/places/gravity.js: the profile the scene's spec names, drawn from the seed when the
// game is made, its warning, ramp, hold and the bodies thrown at the onset); this module is the scene round them. The ground is
// authored (src/data/places/testudo.js BERTH_2 and BERTH_SPOTS); the profile's times are the seed's alone (gravity.js drawProfile on
// stream(seed, 'grav', k): the burn's onset 40 to 60 s in, so its warning 25 to 45 s in; on half the seeds a surprise jink of 0.4 G
// after it), so "Again" on the same seed meets the same burn.
//
// The fill (testBurn): the barracks drawn (Echo Company, you), you moved aboard into berthing 2 by your rack in utilities with mag
// boots worn and released (floating: the deck is under you, nothing holds you to it), the berth's NCO at the forward hatch on his
// boots, and the scene's record state.armoury.burn (additive: absent everywhere else, so no other save changes):
//     { rack, locker, items: [{ key, word, stowedAtMs }], t0Ms, doing: { what, key?, untilMs } | null, strappedAtMs, warnAtMs,
//       securedAtMs, how ('strapped' | 'boots' | 'hold' | null), onset: { atMs, what, vMs, first, injuries, loose } | null,
//       jink: { atMs, what } | null, end, ncoPid, boots }
// You hold the three items (your helmet, your seabag, your R-7 in its case: the scene's props, not kit items: my call) until each is
// stowed. R does the scene's acts where you are (registered on places/hand.js's scene hook, so R's plate names them with their
// time): at your locker "Stow your helmet · 1.0 s" (STOW_MS, an item a press), at your rack's foot "Strap in · 2.0 s" (STRAP_MS:
// the gravity's setStrapped, couched at any burn) and, strapped, "Unstrap · 1.0 s"; anywhere else the boots' lock or release (with
// no rifle there is no panel to take them from: the boots' own step, arms/shooting.js bootsAction). An act runs for its time on lived ticks and is
// lost if you leave its reach meanwhile (burnActors). With nothing at hand R's plate is struck until the scene's end ("Stand by for
// the burn", "Strapping in" while an act runs), never the place's fifteen-minute wait, whose skip would pass over the burn and the jink.
// The instinct's line aboard is the scene's (data/courses.js BURN_T, by the ship's phase), never the barracks' day lines. Getting about at 0 G is the body's: push off a hold and drift, grab (L), or
// your boots on the deck (src/sim/body/freefall.js, footing.js).
// At the warning (the gravity's 'grav' fact, phase 'warn') the NCO shouts it too (BURN_NCO, a text bubble at him), and the scene
// notes when you were secured after it: strapped in, boots locked, or on a hold (the gravity rides a hold to 1 G). At the onset
// the gravity's throw pass writes what the change did to each body (the profile's log); the scene keeps yours (onset: what, the
// fall's speed, the first contact and the injuries, impactOf's, src/sim/body/impact.js, never recomputed here) and counts the items
// not yet stowed as loose gear thrown about the compartment. The course ends ENDS_AFTER_MS after the profile's last event is done
// (the 'burn' fact 'done', the scene's endOn). burnNow(state, ms) is the end card's and the bots' view.
// Pure but testBurn, burnActors, burnAct and the hooks, which write the record and the actors.
import { TICK_MS, SEC_MS, isHeld } from '../../core/clock.js';
import { hashPick } from '../../core/hash.js';
import { playerActor, playerId } from '../../core/ids.js';
import { BURN_NCO } from '../../data/courses.js';
import { BERTH_2, BERTH_SPOTS } from '../../data/places/testudo.js';
import { enterSite } from '../places/model.js';
import { registerHandScene } from '../places/hand.js';
import { siteDayOf } from '../jobs.js';
import { setOutfit, syncActors } from '../people/place.js';
import { drawStaff, setPost } from '../people/staff.js';
import { startBody } from '../body/body.js';
import { deltaOf } from '../body/record.js';
import { footingOf, setAnchor } from '../body/footing.js';
import { gravNow, setStrapped, couchedOf } from '../places/gravity.js';
import { barracks } from './barracks.js';
import { setLedgers } from './tests.js';
import { wear } from '../arms/kit.js';
import { bootsRow, bootsAction } from '../arms/shooting.js';

// (impactOf's states, worst last (impact.js's))
const STATES = Object.freeze(['bruised', 'hurt', 'wounded', 'out']);
/** The scene's acts' times (ms; my calls: the sheet's 2.0 s strap-in, AW§5) and the end's wait after the profile is done. */
export const STOW_MS = 1000, STRAP_MS = 2000, UNSTRAP_MS = 1000, ENDS_AFTER_MS = 5000;
const whole = (ms) => Math.ceil(ms / TICK_MS) * TICK_MS;
const SPOTS = BERTH_SPOTS;
/** The scene's record, or null off it. */
export const burnOf = (state) => state?.armoury?.burn ?? null;
const profileRec = (state) => state?.places?.live?.env?.profile ?? null;
const nearXZ = (a, p, r) => !!a && Math.hypot(a.x - p[0], a.z - p[1]) <= r + 1e-9;
function ncoSay(state, bus, lines, ...key) {
  const B = burnOf(state);
  if (!B?.ncoPid || !lines) return;
  const text = hashPick(lines, 'burn-nco', state.meta.seed, ...key);
  bus?.emit('say', { who: B.ncoPid, text, kind: 'speech', durMs: Math.max(1500, text.length * 60) });
}

// ---- the fill ----

/**
 * The fill of 'test-burn' (see the header): the barracks drawn, you moved aboard by your rack, floating in utilities with mag boots
 * worn and released; the NCO at the forward hatch on his boots; the scene's record. The burn's profile is the spec's, set live by
 * newGame before the fill (kept across the barracks' visit to Melas).
 */
export function testBurn(state, { at = null } = {}) {
  const seed = state.meta.seed, keep = state.places?.live?.env ?? null;
  barracks(state);
  const me = playerActor(state), pid = playerId(state), person = state.people[pid];
  const S0 = { ...SPOTS.start, ...(at ?? {}) };
  Object.assign(me, { x: S0.x, z: S0.z, face: S0.face ?? 'down', gait: 'idle', strideM: 0 });
  enterSite(state, BERTH_2.site, BERTH_2.id);
  if (keep) state.places.live.env = keep;
  setOutfit(me, 'utilities');
  person.body = deltaOf(setLedgers(startBody(person, state.clock.ms, siteDayOf(state), seed), {}));
  const boots = wear(state, pid, 'mb-1');
  const ncoPid = drawStaff(state, 'mcrn-testudo:berth-nco');
  setPost(state, ncoPid, { area: BERTH_2.id, x: SPOTS.nco.x, z: SPOTS.nco.z, face: SPOTS.nco.face, outfit: 'utilities' });
  const ncoBoots = wear(state, ncoPid, 'mb-1');
  syncActors(state);
  setAnchor(state, ncoPid, 'boots');
  setAnchor(state, pid, null);
  state.armoury.burn = {
    rack: SPOTS.rack.id, locker: SPOTS.locker.id, items: SPOTS.items.map(it => ({ key: it.key, word: it.word, stowedAtMs: null })),
    t0Ms: state.clock.ms, doing: null, strappedAtMs: null, warnAtMs: null, securedAtMs: null, how: null, onset: null, jink: null, end: null, ncoPid, boots, ncoBoots,
  };
  return state;
}

// ---- R: the scene's acts at hand ----

// (R's struck plate while the scene runs with nothing to do at hand (see burnOffer): an act under way, else the stand-by)
const DOING_WORDS = Object.freeze({ stow: 'Stowing', strap: 'Strapping in', unstrap: 'Unstrapping' });
const STANDBY = Object.freeze({ id: 'standby', label: 'Stand by for the burn', words: 'stand by', durMs: 0, off: 'no wait before the burn' });

/**
 * What R would do in the berth now: { id, key?, label, durMs, off? } or null (see the header). While the scene runs it is never
 * null (the fixer of D's review, 2026-11-19): a null let R fall through to the place's "wait 15 min", whose skip passed over the
 * burn's hold and the surprise jink, its Grab card included. With nothing at hand R's plate is struck (off: why; burnAct does
 * nothing): "Stowing" or "Strapping in" while an act runs, else "Stand by for the burn". Null off the scene and after its end.
 */
export function burnOffer(state) {
  const B = burnOf(state), me = playerActor(state), pid = playerId(state);
  if (!B || B.end || !me) return null;
  if (B.doing) return Object.freeze({ id: 'busy', label: DOING_WORDS[B.doing.what] ?? 'Under way', words: 'under way', durMs: 0, off: 'an act under way' });
  const a = me, strapped = !!a.strapped;
  if (strapped) return { id: 'unstrap', label: `Unstrap · ${UNSTRAP_MS / SEC_MS} s`, words: 'unstrap', durMs: UNSTRAP_MS };
  const left = B.items.find(it => it.stowedAtMs === null);
  if (left && nearXZ(a, SPOTS.locker.spot, SPOTS.reachM)) return { id: 'stow', key: left.key, label: `Stow ${left.word} · ${STOW_MS / SEC_MS} s`, words: `stow ${left.word}`, durMs: STOW_MS };
  if (nearXZ(a, SPOTS.rack.foot, SPOTS.reachM)) return { id: 'strap', label: `Strap in · ${STRAP_MS / SEC_MS} s`, words: 'strap in', durMs: STRAP_MS };
  // (anywhere else: the mag boots' magnets, the boots' own step (arms/shooting.js bootsRow and bootsAction): with no rifle in the
  // berth there is no panel to take them from, so R does)
  const b = bootsRow(state, pid);
  if (b && !b.off) return { id: 'boots', label: `${b.label} · ${(b.ms / SEC_MS).toFixed(1)} s`, words: b.label.toLowerCase(), durMs: b.ms, boots: true };
  return STANDBY;
}

/** Begin the act R offers (the hand's scene hook, or the bots and the debug handle by id): its time on lived ticks. Returns { ok, why }. */
export function burnAct(state, bus, id = null) {
  const B = burnOf(state), o = burnOffer(state);
  if (!B || !o) return { ok: false, why: 'nothing to do here' };
  if (id && id !== o.id) return { ok: false, why: `not '${id}' here` };
  if (o.off) return { ok: false, why: o.off };
  // (the boots' own live step, timed and written by the arms (bootsAction))
  if (o.boots) return bootsAction(state, bus);
  const now = state.clock.ms;
  B.doing = { what: o.id, ...(o.key ? { key: o.key } : {}), fromMs: now, untilMs: whole(now + o.durMs) };
  bus?.emit('line', { text: `${o.words[0].toUpperCase()}${o.words.slice(1)}.`, kind: 'calm' });
  return { ok: true, why: null };
}
registerHandScene({ offer: burnOffer, act: burnAct });

// ---- the scene, each lived tick ----

/** The scene's tick (the arms domain's actors layer, lived only: see the header). */
export function burnActors(state, input, bus) {
  const B = burnOf(state);
  if (!B || B.end || state.skip || isHeld(state)) return;
  const now = state.clock.ms, pid = playerId(state), me = playerActor(state), P = profileRec(state), G = gravNow(state, now);
  // (an act under way: done at its time if you are still within its reach, else lost)
  if (B.doing) {
    const D = B.doing, at = D.what === 'stow' ? SPOTS.locker.spot : SPOTS.rack.foot;
    if (!nearXZ(me, at, SPOTS.reachM + 0.3)) { B.doing = null; bus?.emit('line', { text: 'Out of reach: nothing done.', kind: 'warn' }); }
    else if (now >= D.untilMs) {
      if (D.what === 'stow') { const it = B.items.find(x => x.key === D.key); if (it && it.stowedAtMs === null) it.stowedAtMs = now; }
      if (D.what === 'strap') { setStrapped(state, pid, B.rack); B.strappedAtMs = now; }
      if (D.what === 'unstrap') { setStrapped(state, pid, null); B.strappedAtMs = null; }
      B.doing = null;
    }
  }
  // (the warning: the NCO's word too; then when you were secured after it, held until the onset)
  if (G?.phase === 'warn' && B.warnAtMs === null) { B.warnAtMs = now; ncoSay(state, bus, BURN_NCO.warn, 'warn'); }
  if (B.warnAtMs !== null && B.onset === null) {
    // (the first moment secured after the warning, and the best way you are secured by the onset: strapped, boots, a hold)
    const how = securedHow(state, pid);
    if (how && B.securedAtMs === null) { B.securedAtMs = now; B.how = how; }
    else if (how && HOW_RANK[how] > HOW_RANK[B.how]) B.how = how;
    else if (!how && B.securedAtMs !== null) { B.securedAtMs = null; B.how = null; }
  }
  // (the onset's throw: yours from the profile's log, written in the onset's tick before the movers)
  if (P && B.onset === null && B.warnAtMs !== null && P.i === 0 && P.phase !== 'warn' && P.phase !== 'wait') {
    const loose = B.items.filter(it => it.stowedAtMs === null).length;
    B.onset = { atMs: now, ...logOf(P, pid, P.list[0]?.atMs ?? now), loose };
    if (loose) ncoSay(state, bus, BURN_NCO.loose, 'loose');
  }
  // (a fall is logged when it lands: a body thrown from a height is 'fell' later than the onset's tick)
  if (B.onset && B.onset.what === null) Object.assign(B.onset, logOf(P, pid, B.onset.atMs));
  // (the surprise, on the seeds that have it: what it did to you)
  if (P && P.list.length > 1 && B.jink === null && P.i >= 1 && (P.phase === 'onset' || P.phase === 'hold' || P.phase === 'off' || P.phase === 'done')) {
    B.jink = { atMs: now, ...logOf(P, pid, P.list[1].atMs) };
  }
  if (B.jink && B.jink.what === null) Object.assign(B.jink, logOf(P, pid, B.jink.atMs));
  // (the end: the profile done, ENDS_AFTER_MS after)
  if (P && P.phase === 'done' && !(P.falls?.length)) {
    B.doneAtMs ??= now;
    if (now - B.doneAtMs >= ENDS_AFTER_MS) {
      B.end = { atMs: now, secured: !!B.how, how: B.how };
      ncoSay(state, bus, BURN_NCO.end, 'end');
      bus?.emit('burn', { phase: 'done', atMs: now, secured: !!B.how, how: B.how });
    }
  }
}
// (the ways a body is secured, best last)
const HOW_RANK = Object.freeze({ hold: 1, boots: 2, strapped: 3 });
// (how a body is secured for a burn: strapped in (couched), its boots locked on the deck, or a hand on a hold or a lanyard)
function securedHow(state, pid) {
  if (couchedOf(state, pid)) return 'strapped';
  const F = footingOf(state, pid);
  if (F.hold === 'boots') return 'boots';
  if (F.hold === 'handhold' || F.hold === 'tether') return 'hold';
  return null;
}
// (yours from the profile's log, at or after the event's onset: { what, vMs, first, injuries }, what null while nothing is logged)
function logOf(P, pid, fromMs) {
  const r = [...(P?.log ?? [])].reverse().find(x => x.who === pid && x.atMs >= fromMs) ?? null;
  return { what: r?.what ?? null, vMs: r?.vMs ?? null, first: r?.first ?? null, injuries: r?.injuries ?? null, fromM: r?.fromM ?? null };
}

// ---- the views ----

/**
 * The scene now (the end card's and the bots' view): { items (each stowed or not), left, doing, offer (R's), strapped, warn
 * ({ atMs, leftMs } once the warning is out), secured ({ atMs, how, inMs from the warning }), onset (what the burn did to you),
 * jink, end, summary }.
 */
export function burnNow(state, ms = state.clock.ms) {
  const B = burnOf(state);
  if (!B) return null;
  const me = playerActor(state), G = gravNow(state, ms), P = profileRec(state);
  const left = B.items.filter(it => it.stowedAtMs === null).length;
  const securedInMs = B.securedAtMs !== null && B.warnAtMs !== null ? B.securedAtMs - B.warnAtMs : null;
  const onset = B.onset ? { ...B.onset } : null;
  const worst = (onset?.injuries ?? []).reduce((a, o) => (STATES.indexOf(o.state) > STATES.indexOf(a) ? o.state : a), null);
  const hurt = worst ? worst : null;
  const summary = B.end
    ? `${B.how ? `Secured in ${(securedInMs / SEC_MS).toFixed(1)} s (${B.how} at the burn)` : 'Not secured'} · ${onset?.what ?? 'no throw'}${onset?.vMs ? ` at ${onset.vMs.toFixed(2)} m/s` : ''}${hurt ? `, ${hurt}` : ''} · ${3 - left} of 3 stowed`
    : null;
  return {
    items: B.items.map(it => ({ key: it.key, word: it.word, stowed: it.stowedAtMs !== null, atMs: it.stowedAtMs })), left, doing: B.doing, offer: burnOffer(state),
    strapped: !!me?.strapped, footing: footingOf(state, playerId(state)).mode, grav: G,
    warn: B.warnAtMs !== null ? { atMs: B.warnAtMs } : null, secured: B.securedAtMs !== null ? { atMs: B.securedAtMs, how: B.how, inMs: securedInMs } : null,
    onset, jink: B.jink, jinks: P ? P.list.filter(e => e.surprise).length : 0, end: B.end, summary,
  };
}
