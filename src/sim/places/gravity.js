// OLYMPUS places: gravity events, a ship's thrust changing under you: the profile, its cursor, the ramp, the siren and the 1MC, the thrown bodies, couched, the surprise's card (v0.0.24, ROADMAP "anywhere" step 6; AW§4.3; PLACES §3.11; BODY §13.7, §14.1, §16.5; COMBAT §14.8; TIME §5.1.6, §7.1; CONTRACTS §21).
//
// The profile. A scene's spec names its ship's events in env.profile (src/data/scenes.js: test-burn's), and the URL's &grav= adds
// one to any scene (a test parameter, src/sim/places/profile.js parseGrav; main.js drops an unknown one with a toast): a list of
//     { kind: 'burn' | 'cut' | 'flip' | 'jink' | 'brace', atS, toG, onsetGs, holdS, warnS, surprise, chance, dirDeg }
// atS the seconds from the scene's start (a number, or [lo, hi] drawn from the seed in whole seconds), toG the felt gravity the
// drive brings (a jink's the lateral push across the deck plane, dirDeg its heading, 0 east, 90 south: the deck's x and z), onsetGs
// the ramp's rate (G/s, ONSET_GS 0.5 by default: a 1 G burn comes in over 2 s, 40 ticks), holdS how long it holds (HOLD_S by kind),
// warnS the warning before it (WARN_S 15 s; a surprise has none), chance the share of seeds that have it (test-burn's jink on half).
// setProfile(state, list) writes it, drawn, onto the live environment (src/sim/places/env.js setLiveEnv: places.live.env.profile,
// saved, absent everywhere else, so every save made before it is the same bytes):
//     { t0Ms, list: [{ kind, atMs, toG, onsetGs, holdS, warnS, surprise, dirDeg }], i, phase, next, baseG, ramp, lat, falls, log, card }
// i the cursor (the event under way or next), phase 'wait' | 'warn' | 'onset' | 'hold' | 'off' | 'done', next the queued event's
// phase (so each is posted once, and an event left over from a replaced profile is ignored), baseG the felt gravity before the
// event (what the off ramp returns to), ramp { fromMs, fromG, toG, gs } while the gravity moves, lat the jink's lateral G now,
// falls the bodies in the air, log what the event did to each body (the scene's card reads it), card the surprise's reflex card.
// profileOf(state) is the list in the scene's form (atS from the start), or null. The drawing and the checks are profile.js's (its
// header: kept apart so env.js loads no body, arms or combat module), re-exported here.
//
// The events on the queue (TIME §5.6, src/core/queue.js; the places domain's events table): 'grav:warn' (warnS before the onset,
// an A interrupt, TIME §7.1's alarm: it stops a skip, its line the 1MC's), 'grav:onset' (an A at a warned change, a D at a surprise),
// 'grav:hold' (the ramp done) and 'grav:end' (the hold done: the off ramp, back to baseG; a cut has none and stays), each handler
// moving the cursor and posting the next, so a skip lands on each at its second and a save between any two carries on. The first is
// posted by gravityTick on the first tick that sees the profile (a profile set before the game's first tick, by newGame or by the page,
// posts nothing until it is lived).
//
// The ramp (gravityTick, the fast layer 'due', after the events due: an onset's throw acts on the tick it lands, before the movers):
// while ramp is set the felt gravity is fromG + gs × the seconds since fromMs, toward toG, written each tick to the live environment's
// gravity with its rev bumped (env.js setLiveG), so gravityAt stays a cached lookup and every reader of the tick sees one number.
//
// The warning: the siren while the phase is 'warn' (src/ui/audio/siren.js reads gravNow), and the 1MC's words (src/data/onemc.js),
// said as text: the user's rule of 2026-11-19, "forget about voices, those are all terrible use text bubble only": a 'say' fact
// { who: null, speaker: '1MC', kind: 'pa', text, call } for the radio box and the speaker's bubble, and the event's line for a skip's
// ticker. A brace pending (the phase 'warn' or 'onset') refuses a skip (bracePending: TIME §5.1.6's threat rule, in
// src/sim/time/activities.js startActivity), and the warning itself stops one already running.
//
// The thrown bodies (throwPass, one pass over the live area's actors on the onset's tick, never per tick: BODY §13.7, COMBAT §14.8).
// The change is dG = toG − baseG (a jink's toG, across the deck): a body couched (couchedOf) is safe at any change; standing on the
// deck, on locked mag boots or braced it rides a warned change up to BRACE_G 1.5 G and a surprise up to SURPRISE_G 0.5 G and above
// goes down prone (DOWN_MS 1.5 s) with a bruise roll, impactOf at the centre of mass's DOWN_DROP_M fall at the new gravity; a hand on
// a hold or a lanyard keeps it up to HOLD_MAX_G 1 G and is pulled off above it (let go: src/sim/body/footing.js setAnchor); a floating
// body at a height (free fall's own, actor.floatY, src/sim/body/freefall.js) falls to the deck under the ramp, integrated in closed form
// (fall below: d = g0 t²/2 + k t³/6 on the ramp, then the full g), and lands at that speed (1 G from 3 m after a sharp onset 7.67 m/s,
// √(2 a y); 0.3 G 4.20; under a 0.5 G/s ramp from 3 m it lands at 5.83 m/s, before the ramp is done), feet first if it turned its feet
// aft (actor.feetAft), else on its body, through impactOf (src/sim/body/impact.js, BODY §16.5's bands) on the tick it lands: its
// height written each tick of the fall (actor.floatY, the record the stage draws), the fall kept in falls so a save mid-fall carries on.
// Only free fall's height is fallen from (the review of v0.0.24's A to C): actor.y is the floor a body stands or lies on (a rack, a
// seat: people/place.js; the catwalk: shoothouse.js), never a height in the air, so a sleeper in his rack, a seated man and the
// instructor on the catwalk are not thrown off them (before: thirteen bodies of the bay at 23:00 'fell' out of their racks and seats,
// three with broken ribs, and the instructor fell 3 m through the catwalk); a body resting on a fixture (profile.js restsOn: lying
// or seated) is couched by it at any change.
// A jink pushes a floating body across the deck plane at its lateral g (its velocity, actor.v, the drift's: it moves until it meets
// a face, where src/sim/body/freefall.js lands or impacts it). What each body met is written in log: { atMs, who, what: 'couched' |
// 'rode' | 'held' | 'down' | 'pulled' | 'fell' | 'slid', vMs?, first?, injuries? }, and told on the bus ('grav' { phase: 'thrown' }).
//
// couchedOf(state, pid) (profile.js's, re-exported) is the footing's 'couched' (src/sim/body/footing.js footingOf reads it: BODY
// §14.1): strapped into a couch or a rack (actor.strapped, the seat's id, written by setStrapped: a scene's R at its rack, test-burn's
// 2.0 s strap-in), or at COUCH_G 2.5 G and over for anyone (BODY §14.1's past r 2.8, "can't stand for long", made a footing: no walk).
//
// The surprise's card (AW§4.3 item 6; COMBAT §3.5's reflex, TIME's card): at a surprise's onset you, floating, get the card in that
// tick, time standing still: "Grab the hold" (or "Grab him") where src/sim/body/freefall.js grabOf finds a hold or a person within
// FREEFALL.REACH_M 0.8 m (its grab, BODY §16.6's bands, takes it), "Turn feet aft" where you are falling to the deck, and "Nothing:
// let it come". It is held on the profile (the card, saved) through src/sim/combat/reflex.js offerFree, since a crew aboard is not in
// stop motion; the answer ('grav:card:<key>', the places domain's action gravAction) is given, and your throw is weighed again from
// the body the answer left (a hold taken rides as a hold).
//
// gravNow(state, ms) is what the moment looks like for the readers (the siren, the strip's G line, the scene's card, the bots): null
// with no event pending or under way, else { i, kind, phase, toG, atMs, warnS, leftMs, surprise }. gLineOf(state) is the G line's facts
// (src/ui/hud/strip.js gLineText formats them): null at Mars and the Wheel with nothing pending (the strip shows nothing: the line
// is the body's own sign, shown only when the gravity is not nominal), else { gG, word, phase, kind, leftMs }: gravityAt for the g,
// footingOf for the word (one quantity, one helper).
// Pure but setProfile, setStrapped and the layer, the events and the action, which write the live environment and the actors.
import { post, cancel } from '../../core/queue.js';
import { TICK_MS, SEC_MS, isHeld } from '../../core/clock.js';
import { playerId } from '../../core/ids.js';
import { q } from '../../core/num.js';
import { G0_MS2 } from '../../core/phys.js';
import { BRACE_G, SURPRISE_G, GRAV_BODY, FREEFALL, GAIT_G } from '../../data/body/needs.js';
import { ONE_MC, END, DONE, warnWords } from '../../data/onemc.js';
import { gravityAt, liveEnvOf, setLiveEnv, setLiveG } from './env.js';
import { footingOf, setAnchor } from '../body/footing.js';
import { impactOf } from '../body/impact.js';
import { grab, grabOf } from '../body/freefall.js';
import { offerFree, chosenFree, freeCardOf } from '../combat/reflex.js';
import { GRAV_KINDS, couchedOf, restsOn } from './profile.js';

export { GRAV_KINDS, ONSET_GS, WARN_S, HOLD_S, drawProfile, profileRecord, parseGrav, couchedOf, setStrapped } from './profile.js';

/** The surprise's card: a fall from below this height is no fall (m: on the deck). A grab is offered where src/sim/body/freefall.js grabOf finds a hold or a person in reach. */
export const ON_DECK_M = 0.01;
/** The places' event kinds on the queue. */
export const GRAV_EVENTS = Object.freeze(['grav:warn', 'grav:onset', 'grav:hold', 'grav:end']);
const SRC = 'places:grav';

const profileRec = (state) => liveEnvOf(state)?.profile ?? null;
const actorsOf = (state) => state.actors?.list ?? [];
const actorOf = (state, pid) => actorsOf(state).find(a => a.who === pid) ?? null;
const r4 = (g) => Math.round(g * 1e4) / 1e4;

// ---- the profile ----

/** Set the live area's profile (see the header): list the spec's events (null or [] clears it), the old profile's events cancelled. Returns the record written, or null. */
export function setProfile(state, list) {
  const L = liveEnvOf(state);
  cancel(state, SRC);
  const keep = L ? { preset: L.preset, ...(L.gravity ? { gravity: L.gravity } : {}), ...(L.air ? { air: L.air } : {}), ...(L.airC !== undefined ? { airC: L.airC } : {}), ...(L.surface ? { surface: L.surface } : {}) } : { preset: null };
  if (!list?.length) { if (L?.profile) setLiveEnv(state, keep); return null; }
  const rec = setLiveEnv(state, { ...keep, profile: list });
  return rec.profile;
}

/**
 * The URL's &grav= added to the scene's own profile (see the header: "adds one to any scene"): the scene's events as drawn (profileOf)
 * and the list given, in time order, written by setProfile; the list alone where the scene has none. The fixer of v0.0.24's code
 * review: main.js called setProfile with the URL's list alone, so test-burn with &grav= lost its burn. Returns the profile record.
 */
export function addProfile(state, list) {
  if (!list?.length) return profileRec(state);
  const own = profileOf(state) ?? [];
  return setProfile(state, [...own, ...list].map((e, i) => ({ e, i })).sort((a, b) => a.e.atS - b.e.atS || a.i - b.i).map(x => x.e));
}

/** The profile in the scene's form (atS from the start), or null. */
export function profileOf(state) {
  const P = profileRec(state);
  if (!P) return null;
  return P.list.map(e => ({ atS: (e.atMs - P.t0Ms) / SEC_MS, kind: e.kind, toG: e.toG, onsetGs: e.onsetGs, holdS: e.holdS, warnS: e.warnS, ...(e.surprise ? { surprise: true } : {}), ...(e.dirDeg !== undefined ? { dirDeg: e.dirDeg } : {}) }));
}

// ---- reads ----

/** The event pending or under way (see the header), or null. */
export function gravNow(state, ms = state?.clock?.ms) {
  const P = profileRec(state);
  if (!P || P.phase === 'done' || P.phase === 'wait') return null;
  const e = P.list[P.i];
  if (!e) return null;
  return { i: P.i, kind: e.kind, phase: P.phase, toG: e.toG, atMs: e.atMs, warnS: e.warnS, leftMs: Math.max(0, e.atMs - ms), surprise: !!e.surprise };
}

/** Whether a brace is pending (the warning out, or the change coming in): a skip is refused (TIME §5.1.6). */
export function bracePending(state) {
  const P = profileRec(state);
  return !!P && (P.phase === 'warn' || P.phase === 'onset');
}

/** The footing's word on the G line (the body's own sense of what holds it). */
export const FOOTING_WORDS = Object.freeze({ magWalk: 'on mag boots', handhold: 'on a hold', braced: 'braced', float: 'floating', couched: 'couched', bound: 'low g', walk: 'standing', heavy: 'heavy' });
/** The G line's facts (see the header): null when the gravity is nominal and nothing is pending, else { gG, word, phase, kind, leftMs }. */
export function gLineOf(state, pid = playerId(state)) {
  const a = actorOf(state, pid);
  if (!a || !state?.places?.live?.area) return null;
  const g = gravityAt(state, null, a.x, a.z).gG, now = gravNow(state);
  if (g >= GAIT_G.BOUND_BELOW_G && !now) return null;
  const F = footingOf(state, pid), word = F.hold === 'tether' ? 'clipped in' : couchedOf(state, pid) ? FOOTING_WORDS.couched : FOOTING_WORDS[F.mode] ?? F.mode;
  return { gG: r4(g), word, phase: now?.phase ?? null, kind: now?.kind ?? null, leftMs: now?.phase === 'warn' ? now.leftMs : null };
}

// ---- the events ----

// (post the cursor's next event: its warning, its onset, its hold's end, by the phase)
function postNext(state, P, phase, atMs) {
  const e = P.list[P.i];
  P.next = phase;
  const prio = phase === 'warn' ? 1 : phase === 'onset' ? (e.surprise ? 0 : 1) : 5;
  const line = phase === 'warn' ? warnWords(e.kind, e.warnS) : null;
  post(state, { atMs, kind: `grav:${phase}`, src: SRC, prio, ...(line ? { line, tone: 'warn' } : {}), payload: { i: P.i } });
}
// (the event i's first: its warning if it has one, else its onset)
function postFirst(state, P) {
  const e = P.list[P.i];
  if (!e) { P.phase = 'done'; P.next = null; return; }
  P.phase = 'wait';
  if (e.warnS > 0) postNext(state, P, 'warn', Math.max(state.clock.ms, e.atMs - e.warnS * SEC_MS));
  else postNext(state, P, 'onset', Math.max(state.clock.ms, e.atMs));
}
// (the ship's words as text: the radio box's line and the speaker's bubble, never a voice)
const say = (bus, text, call) => bus?.emit('say', { who: null, speaker: ONE_MC, text, kind: 'pa', call });
// (an event of the profile's, for the phase the cursor waits on: a stale one (another profile's, or its phase past) does nothing)
const mine = (P, ev, phase) => !!P && ev.payload?.i === P.i && P.next === phase;

function onWarn(state, bus, ev) {
  const P = profileRec(state);
  if (!mine(P, ev, 'warn')) return;
  const e = P.list[P.i];
  P.phase = 'warn';
  say(bus, warnWords(e.kind, e.warnS), 'grav:warn');
  bus?.emit('grav', { phase: 'warn', i: P.i, kind: e.kind, toG: e.toG, atMs: e.atMs });
  postNext(state, P, 'onset', e.atMs);
}

function onOnset(state, bus, ev) {
  const P = profileRec(state);
  if (!mine(P, ev, 'onset')) return;
  const e = P.list[P.i], now = state.clock.ms, K = GRAV_KINDS[e.kind];
  const g0 = gravityAt(state).gG;
  P.phase = 'onset'; P.baseG = r4(g0);
  if (K.feltG) P.ramp = { fromMs: now, fromG: r4(g0), toG: e.toG, gs: e.onsetGs, lat: false };
  else P.ramp = { fromMs: now, fromG: 0, toG: e.toG, gs: e.onsetGs, lat: true };
  bus?.emit('grav', { phase: 'onset', i: P.i, kind: e.kind, toG: e.toG, atMs: now });
  throwPass(state, bus, P, e);
  postNext(state, P, 'hold', now + Math.ceil(rampMs(P.ramp) / SEC_MS) * SEC_MS);
}

function onHold(state, bus, ev) {
  const P = profileRec(state);
  if (!mine(P, ev, 'hold')) return;
  const e = P.list[P.i];
  P.phase = 'hold';
  finishRamp(state, P);
  bus?.emit('grav', { phase: 'hold', i: P.i, kind: e.kind, toG: e.toG, atMs: state.clock.ms });
  postNext(state, P, 'end', state.clock.ms + Math.round(e.holdS * SEC_MS));
}

function onEnd(state, bus, ev) {
  const P = profileRec(state);
  if (!mine(P, ev, 'end')) return;
  const e = P.list[P.i], K = GRAV_KINDS[e.kind];
  bus?.emit('grav', { phase: 'end', i: P.i, kind: e.kind, toG: e.toG, atMs: state.clock.ms });
  const words = e.surprise ? DONE[e.kind] : END[e.kind];
  if (words) say(bus, words, 'grav:end');
  if (K.back) {
    P.phase = 'off'; P.next = null;
    P.ramp = K.feltG ? { fromMs: state.clock.ms, fromG: gravityAt(state).gG, toG: P.baseG, gs: e.onsetGs, lat: false } : { fromMs: state.clock.ms, fromG: P.lat, toG: 0, gs: e.onsetGs, lat: true };
    return;
  }
  nextEvent(state, P);
}
// (the cursor on to the next event)
function nextEvent(state, P) {
  P.ramp = null; P.i++;
  postFirst(state, P);
}

/** The places domain's events table for the profile (TIME §5.6). */
export const GRAV_HANDLERS = Object.freeze({ 'grav:warn': onWarn, 'grav:onset': onOnset, 'grav:hold': onHold, 'grav:end': onEnd });

// ---- the ramp ----

/** A ramp's length, ms. */
export const rampMs = (R) => (Math.abs(R.toG - R.fromG) / R.gs) * SEC_MS;
/** A ramp's g at ms (G): fromG toward toG at gs, held there once reached. */
export function rampG(R, ms) {
  const dt = Math.max(0, ms - R.fromMs) / SEC_MS, span = R.toG - R.fromG, move = R.gs * dt;
  return move >= Math.abs(span) ? R.toG : r4(R.fromG + Math.sign(span) * move);
}
// (the ramp's value written: the felt gravity (env.js setLiveG: its rev bumped) or the jink's lateral g)
function writeRamp(state, P, g) {
  if (P.ramp.lat) { P.lat = g; return; }
  if (gravityAt(state).gG !== g) setLiveG(state, g);
}
function finishRamp(state, P) {
  if (!P.ramp) return;
  writeRamp(state, P, P.ramp.toG);
  P.ramp = null;
}

/**
 * The fast layer 'due', the profile's part (see the header): the first event posted, the ramp written, the falls brought down,
 * the jink's push on the floating. Nothing at all without a profile.
 */
export function gravityTick(state, input, bus) {
  const P = profileRec(state);
  if (!P || P.phase === 'done' && !P.falls.length) return;
  if (P.next === null && P.phase === 'wait') postFirst(state, P);
  const now = state.clock.ms;
  if (P.ramp) {
    const g = rampG(P.ramp, now);
    writeRamp(state, P, g);
    if (g === P.ramp.toG && P.phase === 'off') { P.ramp = null; P.lat = 0; nextEvent(state, P); }
  }
  if (P.falls.length) fallsTick(state, bus, P, now);
  if (P.lat > 0) jinkTick(state, P);
}

// ---- the thrown bodies ----

// (the fall under the ramp from height y (m) at the onset: { landMs, vMs } in closed form, the ramp g0 to g1 at k (all m/s², m/s³))
export function fallOf(yM, g0G, g1G, onsetGs) {
  const g0 = g0G * G0_MS2, g1 = g1G * G0_MS2, k = onsetGs * G0_MS2, T = g1 > g0 ? (g1 - g0) / k : 0;
  const d = (t) => (g0 * t * t) / 2 + (k * t * t * t) / 6, v = (t) => g0 * t + (k * t * t) / 2;
  if (T > 0 && d(T) >= yM) {
    let lo = 0, hi = T;
    for (let n = 0; n < 60; n++) { const m = (lo + hi) / 2; if (d(m) < yM) lo = m; else hi = m; }
    const t = (lo + hi) / 2;
    return { tS: t, vMs: v(t) };
  }
  const vT = v(T), rest = yM - d(T);
  if (!(g1 > 0)) return null;
  const t2 = (-vT + Math.sqrt(vT * vT + 2 * g1 * rest)) / g1;
  return { tS: T + t2, vMs: Math.sqrt(vT * vT + 2 * g1 * rest) };
}
// (the height fallen by t s into the fall)
function fallenAt(F, tS) {
  const g0 = F.g0G * G0_MS2, g1 = F.g1G * G0_MS2, k = F.gs * G0_MS2, T = g1 > g0 ? (g1 - g0) / k : 0;
  if (tS <= T) return (g0 * tS * tS) / 2 + (k * tS * tS * tS) / 6;
  const vT = g0 * T + (k * T * T) / 2, dT = (g0 * T * T) / 2 + (k * T * T * T) / 6, u = tS - T;
  return dT + vT * u + (g1 * u * u) / 2;
}

function logIt(state, bus, P, rec) {
  const r = { atMs: state.clock.ms, ...rec };
  P.log.push(r);
  bus?.emit('grav', { phase: 'thrown', i: P.i, ...r });
}

// (one body at the onset: what the change does to it (see the header); card: whether the surprise's card may be offered)
function throwOne(state, bus, P, e, a, card) {
  const pid = a.who, K = GRAV_KINDS[e.kind], dG = K.feltG ? e.toG - P.baseG : e.toG;
  if (!(dG > 0.05)) return;
  const limit = e.surprise ? SURPRISE_G : BRACE_G;
  if (couchedOf(state, pid) || restsOn(a)) { logIt(state, bus, P, { who: pid, what: 'couched' }); return; }
  const F = footingOf(state, pid), y = a.floatY ?? 0;
  const me = pid === playerId(state);
  if (card && me && e.surprise && (F.mode === 'float' || F.mode === 'handhold') && offerCard(state, bus, P, e, a, F)) return;
  if (F.mode === 'handhold') {
    if (dG <= GRAV_BODY.HOLD_MAX_G) { logIt(state, bus, P, { who: pid, what: 'held' }); return; }
    setAnchor(state, pid, null);
    logIt(state, bus, P, { who: pid, what: 'pulled' });
  }
  if (K.feltG && y > ON_DECK_M && (F.mode === 'float' || F.mode === 'handhold')) { startFall(state, bus, P, e, a, y); return; }
  if (!K.feltG && F.mode === 'float') { logIt(state, bus, P, { who: pid, what: 'slid' }); return; }
  if (dG <= limit) { logIt(state, bus, P, { who: pid, what: 'rode' }); return; }
  goDown(state, bus, P, a, K.feltG ? e.toG : Math.hypot(e.toG, P.baseG ?? 0));
}

// (down to the deck, prone, with a bruise roll: the centre of mass's DOWN_DROP_M at the gravity it meets)
function goDown(state, bus, P, a, gG) {
  const vMs = Math.round(Math.sqrt(2 * Math.max(gG, 0) * G0_MS2 * GRAV_BODY.DOWN_DROP_M) * 1000) / 1000;
  a.stance = 'prone';
  const injuries = impactOf(state, a.who, { vMs, first: 'hands', atMs: state.clock.ms });
  logIt(state, bus, P, { who: a.who, what: 'down', vMs, first: 'hands', downMs: GRAV_BODY.DOWN_MS, injuries });
}

function startFall(state, bus, P, e, a, y) {
  const f = fallOf(y, P.baseG, e.toG, e.onsetGs);
  if (!f) return;
  const landMs = state.clock.ms + Math.ceil((f.tS * SEC_MS) / TICK_MS) * TICK_MS;
  P.falls.push({ who: a.who, y0: q(y, 0.001), fromMs: state.clock.ms, landMs, vMs: Math.round(f.vMs * 1000) / 1000, g0G: P.baseG, g1G: e.toG, gs: e.onsetGs });
}

function throwPass(state, bus, P, e) {
  for (const a of [...actorsOf(state)]) if (a.who) throwOne(state, bus, P, e, a, true);
}

function fallsTick(state, bus, P, now) {
  const left = [];
  for (const F of P.falls) {
    const a = actorOf(state, F.who);
    if (!a) continue;
    if (now < F.landMs) { a.floatY = q(Math.max(0, F.y0 - fallenAt(F, (now - F.fromMs) / SEC_MS)), 0.001); left.push(F); continue; }
    delete a.floatY;
    const first = a.feetAft ? 'feet' : 'body';
    delete a.feetAft;
    if (F.vMs > FREEFALL.LAND_MS) a.stance = 'prone';
    const injuries = impactOf(state, F.who, { vMs: F.vMs, first, atMs: F.landMs });
    logIt(state, bus, P, { who: F.who, what: 'fell', vMs: F.vMs, first, fromM: F.y0, injuries });
  }
  P.falls = left;
}

// (the jink's push: every floating body's velocity across the deck plane, a tick of the lateral g at the event's heading)
function jinkTick(state, P) {
  const e = P.list[P.i];
  if (!e || e.kind !== 'jink') return;
  const rad = ((e.dirDeg ?? 0) * Math.PI) / 180, dv = P.lat * G0_MS2 * (TICK_MS / SEC_MS);
  for (const a of actorsOf(state)) {
    if (!a.who || footingOf(state, a.who).mode !== 'float') continue;
    a.v = [q((a.v?.[0] ?? 0) + dv * Math.cos(rad), 0.001), q((a.v?.[1] ?? 0) + dv * Math.sin(rad), 0.001)];
  }
}

// ---- the surprise's card ----

function offerCard(state, bus, P, e, a, F) {
  const options = [];
  const g = F.mode === 'float' ? grabOf(state, a.who) : null;
  if (g) options.push({ key: 'grab', label: g.kind === 'hold' ? 'Grab the hold' : 'Grab him', ms: 0 });
  if (GRAV_KINDS[e.kind].feltG && (a.floatY ?? 0) > ON_DECK_M) options.push({ key: 'feet', label: 'Turn feet aft', ms: 0 });
  if (!options.length) return false;
  return offerFree(state, bus, P, { why: 'grav', title: e.kind === 'jink' ? 'The deck lurches.' : 'The drive lights.', options });
}

/** The places domain's action 'grav' ({ act: 'grav', args: { card: key } }, or 'grav:card:<key>'): the card's answer (see the header). Returns { ok, why }. */
export function gravAction(state, action, bus) {
  const key = typeof action === 'string' ? action.replace(/^grav:card:/, '') : action?.args?.card;
  const P = profileRec(state);
  if (!P?.card) return { ok: false, why: 'no card' };
  const opt = chosenFree(state, bus, P, key);
  const pid = playerId(state), a = actorOf(state, pid), e = P.list[P.i];
  if (!a || !e) return { ok: true, why: null };
  if (opt?.key === 'grab') grab(state, pid);
  if (opt?.key === 'feet') a.feetAft = true;
  throwOne(state, bus, P, e, a, false);
  return { ok: true, why: null };
}
/** The surprise's card waiting, or null (reflex.js's free card on the profile). */
export const gravCardOf = (state) => freeCardOf(profileRec(state));
/** Whether time stands still for the card (the page shows it). */
export const gravHeld = (state) => !!gravCardOf(state) && isHeld(state, 'reflex');
