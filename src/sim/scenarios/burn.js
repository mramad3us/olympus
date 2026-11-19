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
//       securedAtMs, how ('strapped' | 'boots' | 'hold' | null), firstHow (how at securedAtMs, the fixer's), onset: { atMs, what, vMs, first, injuries, loose } | null,
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
// v0.0.25's burn polish (the user's score of 2026-11-19, warning 85, fall 50, feel 50, "Good ideas bad execution. We should have
// some indication of how strong is the burn and evasive maneuvers, especially if not straped in, mag boots won't save you from a 3G
// sideways maneuver. No straped in animation, we just linger next to the bunk. Needs overall polish"):
//   - STRAPPED IN DRAWN. Strap in lies you down in your rack's lower berth (people/place.js lieActor, its frames in RACK_IN_MS of the
//     act) and buckles the straps over the rest of STRAP_MS; Unstrap undoes them and gets you up to the rack's foot (riseActor, its
//     frames the last RACK_OUT_MS of UNSTRAP_MS). The stage draws a strapped body on its mattress in utilities with the straps across
//     it (src/art/figures/bedding.js), the doll with its harness (the gear's anchor 'straps', footing.js gearAnchorOf); a strapped
//     body never rises by a move key (riseActor). An act under way is lost only when you leave its reach, the rack's foot or its berth.
//   - THE MANOEUVRE. The scene's profile (data/scenes.js) adds a warned evasive manoeuvre after the burn, 3 G to port, over the boots'
//     hold across the deck (GRAV_BODY.BOOTS_SHEAR_G), so boots that rode the burn are torn off by it (gravity.js throwOne). The record
//     keeps it as `evade` { warnAtMs, atMs, how (how you were secured when it came in), what, vMs, torn }, the surprise as `jink`, each
//     found in the drawn profile by its kind (the warned jink, the surprise), never by its place in the list. The NCO calls it
//     (BURN_NCO.evade) and straps himself into rack 1 (ncoStrapIn), so nobody stands by the hatch on his boots through 3 G.
//   - The words: the summary says what each event did to you in plain words (WHAT_WORDS), never the footing's 'couched'.
// Pure but testBurn, burnActors, burnAct and the hooks, which write the record and the actors.
import { TICK_MS, SEC_MS, isHeld } from '../../core/clock.js';
import { hashPick } from '../../core/hash.js';
import { playerActor, playerId } from '../../core/ids.js';
import { BURN_NCO } from '../../data/courses.js';
import { BERTH_2, BERTH_SPOTS } from '../../data/places/testudo.js';
import { enterSite } from '../places/model.js';
import { registerHandScene } from '../places/hand.js';
import { siteDayOf } from '../jobs.js';
import { setOutfit, syncActors, lieActor, riseActor } from '../people/place.js';
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
/**
 * The scene's acts' times (ms; my calls: the sheet's 2.0 s strap-in, AW§5) and the end's wait after the profile is done. v0.0.25's
 * burn polish: STRAP_MS is the whole act, into the berth in its first RACK_IN_MS (at 0 G a hand on the rack's frame pulls you in: a
 * third of the barracks' 4.0 s lying down) and the straps buckled in the rest; UNSTRAP_MS the straps undone, then out to the foot in
 * its last RACK_OUT_MS (my calls).
 */
export const STOW_MS = 1000, STRAP_MS = 2000, UNSTRAP_MS = 2000, ENDS_AFTER_MS = 5000, RACK_IN_MS = 1200, RACK_OUT_MS = 1200;
/** Your rack's lower berth (fixtures.js rack2's seat #2) and the berth's NCO's, rack 1's, by the forward hatch. */
export const BERTH_SEAT = `${BERTH_SPOTS.rack.id}#2`, NCO_RACK = 'f:tb:rack:01', NCO_SEAT = `${NCO_RACK}#2`;
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
  const a = me, strapped = !!a.strapped || a.posture === 'lie';
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
  // (strapping in: into the berth at once, its frames in RACK_IN_MS; unstrapping: out of it once the straps are undone (burnActors))
  if (o.id === 'strap') {
    const me = playerActor(state);
    inBerth(state, me, BERTH_SEAT, now);
    // (into the berth or no strap: a body mid-rise or mid-step cannot be laid in it this tick (the fixer of v0.0.25's code review))
    if (!(me?.posture === 'lie' && me?.spotId === BERTH_SEAT)) { B.doing = null; return { ok: false, why: 'not in the rack yet' }; }
  }
  if (o.id === 'unstrap') B.doing.riseAtMs = whole(now + UNSTRAP_MS - RACK_OUT_MS);
  bus?.emit('line', { text: `${o.words[0].toUpperCase()}${o.words.slice(1)}.`, kind: 'calm' });
  return { ok: true, why: null };
}
// (a body into a rack's berth in sight (people/place.js lieActor), its frames in RACK_IN_MS: off the deck it floated over and still)
function inBerth(state, a, seat, now) {
  if (!a) return null;
  for (const k of ['floatY', 'v', 'push', 'tumble', 'feetAft']) delete a[k];
  if ((a.posture ?? 'stand') !== 'stand') return null;
  const t = lieActor(state, a, seat, now);
  if (t) t.ms = whole(RACK_IN_MS);
  return t;
}
// (out of the berth to the rack's foot (riseActor), its frames in RACK_OUT_MS)
function outOfBerth(state, a, now) {
  const t = riseActor(state, a, now);
  if (t) t.ms = whole(RACK_OUT_MS);
  return t;
}
// (the NCO into rack 1's berth, his boots released and his straps on, his post the berth (so the people layer keeps him there))
function ncoStrapIn(state, B) {
  const a = (state.actors?.list ?? []).find(x => x.who === B.ncoPid);
  if (!a || a.strapped) return;
  setAnchor(state, B.ncoPid, null);
  if (!inBerth(state, a, NCO_SEAT, state.clock.ms)) return;
  setStrapped(state, B.ncoPid, NCO_RACK);
  setPost(state, B.ncoPid, { area: BERTH_2.id, x: a.x, z: a.z, y: a.y, face: a.face, posture: 'lie', spotId: NCO_SEAT, outfit: 'utilities' });
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
    // (the rack's acts are in reach from its foot or its berth: a body lying in it is at the berth's place)
    const inReach = nearXZ(me, at, SPOTS.reachM + 0.3) || (D.what !== 'stow' && me?.spotId === BERTH_SEAT);
    // (strapping in is done lying in the berth or not at all: a move key that got you up off it (time/domain.js riseActor, before the
    // straps were on) loses the act, never straps a body standing at the rack's foot (the fixer of v0.0.25's code review))
    const inBerthNow = me?.posture === 'lie' && me?.spotId === BERTH_SEAT;
    if (D.what === 'strap' && !inBerthNow) { B.doing = null; bus?.emit('line', { text: 'Up out of the rack: not strapped in.', kind: 'warn' }); }
    else if (!inReach) { B.doing = null; bus?.emit('line', { text: 'Out of reach: nothing done.', kind: 'warn' }); }
    else {
      if (D.what === 'unstrap' && now >= (D.riseAtMs ?? D.untilMs) && me.strapped) { setStrapped(state, pid, null); B.strappedAtMs = null; outOfBerth(state, me, now); }
      if (now >= D.untilMs) {
        if (D.what === 'stow') { const it = B.items.find(x => x.key === D.key); if (it && it.stowedAtMs === null) it.stowedAtMs = now; }
        if (D.what === 'strap') { setStrapped(state, pid, B.rack); B.strappedAtMs = now; }
        if (D.what === 'unstrap' && me.strapped) { setStrapped(state, pid, null); B.strappedAtMs = null; outOfBerth(state, me, now); }
        B.doing = null;
      }
    }
  }
  // (the warning: the NCO's word too; then when you were secured after it, held until the onset)
  if (G?.phase === 'warn' && B.warnAtMs === null) { B.warnAtMs = now; ncoSay(state, bus, BURN_NCO.warn, 'warn'); }
  if (B.warnAtMs !== null && B.onset === null) {
    // (the first moment secured after the warning, and the best way you are secured by the onset: strapped, boots, a hold)
    const how = securedHow(state, pid);
    if (how && B.securedAtMs === null) { B.securedAtMs = now; B.how = how; B.firstHow = how; }
    else if (how && HOW_RANK[how] > HOW_RANK[B.how]) B.how = how;
    else if (!how && B.securedAtMs !== null) { B.securedAtMs = null; B.how = null; B.firstHow = null; }
  }
  // (the onset's throw: yours from the profile's log, written in the onset's tick before the movers)
  if (P && B.onset === null && B.warnAtMs !== null && P.i === 0 && P.phase !== 'warn' && P.phase !== 'wait') {
    const loose = B.items.filter(it => it.stowedAtMs === null).length;
    B.onset = { atMs: now, ...logOf(P, pid, P.list[0]?.atMs ?? now), loose };
    if (loose) ncoSay(state, bus, BURN_NCO.loose, 'loose');
  }
  // (a fall is logged when it lands: a body thrown from a height is 'fell' later than the onset's tick)
  if (B.onset && B.onset.what === null) Object.assign(B.onset, logOf(P, pid, B.onset.atMs));
  // (the warned manoeuvre: its warning (the NCO's call, and he straps in), how you were secured as it came in, what it did to you)
  const ei = P ? evadeIndex(P) : -1;
  if (ei >= 0) {
    if (P.i === ei && P.phase === 'warn' && !B.evade) {
      B.evade = { warnAtMs: now, atMs: null, how: null, what: null, vMs: null, torn: false };
      ncoSay(state, bus, BURN_NCO.evade, 'evade');
      ncoStrapIn(state, B);
    }
    if (B.evade && B.evade.atMs === null && P.i === ei && P.phase === 'warn') B.evade.how = securedHow(state, pid);
    if (B.evade && B.evade.atMs === null && (P.i > ei || (P.i === ei && P.phase !== 'warn' && P.phase !== 'wait'))) B.evade.atMs = P.list[ei].atMs;
    if (B.evade?.atMs !== null && B.evade && (B.evade.what === null || B.evade.what === 'torn' || B.evade.what === 'slid' || B.evade.what === 'pulled')) {
      // (its own entries only: from its onset to the next event's (the surprise's, logged as the jink's))
      const toMs = P.list[ei + 1]?.atMs ?? Infinity, L = logOf(P, pid, B.evade.atMs, toMs);
      if (L.what) Object.assign(B.evade, { what: L.what, vMs: L.vMs, torn: B.evade.torn || (P.log ?? []).some(x => x.who === pid && x.atMs >= B.evade.atMs && x.atMs < toMs && x.what === 'torn') });
    }
  }
  // (the surprise, on the seeds that have it: what it did to you)
  const si = P ? P.list.findIndex(e => e.surprise) : -1;
  if (si >= 0 && B.jink === null && (P.i > si || (P.i === si && (P.phase === 'onset' || P.phase === 'hold' || P.phase === 'off')))) {
    B.jink = { atMs: now, ...logOf(P, pid, P.list[si].atMs) };
  }
  if (B.jink && (B.jink.what === null || B.jink.what === 'slid' || B.jink.what === 'torn' || B.jink.what === 'pulled')) Object.assign(B.jink, logOf(P, pid, B.jink.atMs));
  // (the end: the profile done and every body thrown come to rest, ENDS_AFTER_MS after)
  if (P && P.phase === 'done' && !(P.falls?.length) && !(P.flung ?? []).some(f => !f.met)) {
    B.doneAtMs ??= now;
    if (now - B.doneAtMs >= ENDS_AFTER_MS) {
      B.end = { atMs: now, secured: !!B.how, how: B.how };
      ncoSay(state, bus, BURN_NCO.end, 'end');
      bus?.emit('burn', { phase: 'done', atMs: now, secured: !!B.how, how: B.how });
    }
  }
}
// (the warned manoeuvre's place in the drawn profile: the first jink with a warning, or -1)
const evadeIndex = (P) => P.list.findIndex(e => e.kind === 'jink' && !e.surprise);
// (the ways a body is secured, best last)
const HOW_RANK = Object.freeze({ hold: 1, boots: 2, strapped: 3 });
// (how a body is secured for a burn: strapped in (couched), its boots locked on the deck, or a hand on a hold or a lanyard)
function securedHow(state, pid) {
  if (playerActor(state)?.strapped || couchedOf(state, pid)) return 'strapped';
  const F = footingOf(state, pid);
  if (F.hold === 'boots') return 'boots';
  if (F.hold === 'handhold' || F.hold === 'tether') return 'hold';
  return null;
}
// (yours from the profile's log, at or after the event's onset and before toMs: { what, vMs, first, injuries }, what null while nothing is logged)
function logOf(P, pid, fromMs, toMs = Infinity) {
  const r = [...(P?.log ?? [])].reverse().find(x => x.who === pid && x.atMs >= fromMs && x.atMs < toMs) ?? null;
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
  const ev = B.evade ?? null;
  const summary = B.end
    ? `${B.how ? `Secured in ${(securedInMs / SEC_MS).toFixed(1)} s (${B.firstHow && B.firstHow !== B.how ? `${HOW_WORDS[B.firstHow]}; ` : ''}${HOW_WORDS[B.how]} at the burn)` : 'Not secured'} · the burn: ${WHAT_WORDS[onset?.what] ?? 'nothing thrown'}${onset?.vMs ? ` at ${onset.vMs.toFixed(2)} m/s` : ''}${hurt ? `, ${hurt}` : ''}${ev ? ` · the manoeuvre: ${ev.torn ? 'boots torn off, ' : ''}${WHAT_WORDS[ev.what] ?? 'nothing thrown'}${ev.vMs && ev.what !== 'couched' && ev.what !== 'rode' ? ` at ${ev.vMs.toFixed(2)} m/s` : ''}` : ''} · ${3 - left} of 3 stowed`
    : null;
  return {
    items: B.items.map(it => ({ key: it.key, word: it.word, stowed: it.stowedAtMs !== null, atMs: it.stowedAtMs })), left, doing: B.doing, offer: burnOffer(state),
    strapped: !!me?.strapped, footing: footingOf(state, playerId(state)).mode, grav: G,
    warn: B.warnAtMs !== null ? { atMs: B.warnAtMs } : null, secured: B.securedAtMs !== null ? { atMs: B.securedAtMs, how: B.how, inMs: securedInMs } : null,
    onset, jink: B.jink, jinks: P ? P.list.filter(e => e.surprise).length : 0, evade: ev ? { ...ev } : null, end: B.end, summary,
  };
}
/** How you were secured, in the card's words. */
export const HOW_WORDS = Object.freeze({ strapped: 'strapped in your rack', boots: 'on your mag boots', hold: 'on a hold' });
/** What an event did to you (the gravity's log), in plain words: never the footing's 'couched'. */
export const WHAT_WORDS = Object.freeze({ couched: 'rode it strapped in', rode: 'rode it on your feet', held: 'held on', down: 'went down', pulled: 'pulled off the hold', fell: 'fell to the deck', slid: 'pushed across the compartment', torn: 'thrown off your feet', thrown: 'thrown into the compartment\'s side', caught: 'caught a hold' });
