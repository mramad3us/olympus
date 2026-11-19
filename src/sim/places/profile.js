// OLYMPUS places: a ship's gravity profile as data, drawn from the seed and checked, and the URL's &grav= read (v0.0.24, ROADMAP "anywhere" step 6; src/sim/places/gravity.js is the rest).
//
// The profile's events and their record are gravity.js's (its header says what each field means); this module is only their
// shape, kept apart so that src/sim/places/env.js setLiveEnv can draw a spec's profile into the live environment without loading
// the body, the arms and the combat modules the events act on (an import cycle through env.js: the ballistics table reads env.js
// at its load). drawProfile(list, t0Ms, seed) checks and draws a spec's list (atS a number or [lo, hi], drawn in whole seconds
// from stream(seed, 'grav', k); an event whose `chance` the seed does not meet dropped; sorted by onset), profileRecord(state,
// list) is the record a live environment keeps, and parseGrav(text) the URL's form. couchedOf(state, pid) and setStrapped(state, pid,
// ref) live here too (gravity.js's header says what they are), for the same reason: src/sim/body/footing.js footingOf reads couchedOf,
// and footing.js is read by the arms modules that freefall.js (gravity.js's grab) loads in turn.
// Pure but setStrapped, which writes the actor.
import { stream, next } from '../../core/rng.js';
import { SEC_MS } from '../../core/clock.js';
import { COUCH_G, GAIT_G } from '../../data/body/needs.js';
import { gravityAt } from './env.js';

const need = (v, what) => { if (v === undefined || v === null) throw new Error(`gravity: ${what}`); return v; };
const finite = (v, what) => { if (!Number.isFinite(v)) throw new Error(`gravity: ${what} (${v})`); return v; };

/** The kinds of event (PLACES §3.11): whether each moves the felt gravity (a jink pushes across the deck), and whether it ramps back at its end. */
export const GRAV_KINDS = Object.freeze({
  burn: Object.freeze({ feltG: true, back: true }),
  flip: Object.freeze({ feltG: true, back: true }),
  brace: Object.freeze({ feltG: true, back: true }),
  cut: Object.freeze({ feltG: true, back: false }),
  jink: Object.freeze({ feltG: false, back: true }),
});
/** The ramp's rate by default (G/s: AW§4.3 item 2, a 1 G burn in over 2 s), the warning (s: the 1MC's fifteen seconds) and each kind's hold by default (s; my calls: test-burn's 20 s burn, a jink's 2 s). */
export const ONSET_GS = 0.5, WARN_S = 15;
export const HOLD_S = Object.freeze({ burn: 20, flip: 10, brace: 3, cut: 0, jink: 2 });
/**
 * A profile's events drawn and checked (see the header): list the spec's, t0Ms the scene's start, seed the world's. Throws on an
 * unknown kind or a value that is not a number; an event whose chance the seed does not meet is dropped. Sorted by their onset.
 */
export function drawProfile(list, t0Ms, seed) {
  if (!Array.isArray(list)) throw new Error('gravity: a profile is a list of events');
  const out = [];
  list.forEach((e, k) => {
    const kind = need(e?.kind, `event ${k} names no kind`), K = GRAV_KINDS[kind];
    if (!K) throw new Error(`gravity: event ${k}'s kind '${kind}' is not one of ${Object.keys(GRAV_KINDS).join(', ')}`);
    const r = stream(seed, 'grav', k);
    const at = Array.isArray(e.atS) ? (() => { const [lo, hi] = e.atS.map(v => finite(v, `event ${k}'s atS`)); return Math.floor(lo + next(r) * (hi - lo + 1)); })() : Math.round(finite(e.atS, `event ${k}'s atS`));
    const chanceRoll = next(r);
    if (e.chance !== undefined && !(chanceRoll < finite(e.chance, `event ${k}'s chance`))) return;
    const surprise = !!e.surprise, toG = kind === 'cut' ? 0 : finite(e.toG, `event ${k}'s toG`);
    if (toG < 0) throw new Error(`gravity: event ${k}'s toG is negative (${toG})`);
    const onsetGs = finite(e.onsetGs ?? ONSET_GS, `event ${k}'s onsetGs`), holdS = finite(e.holdS ?? HOLD_S[kind], `event ${k}'s holdS`);
    if (!(onsetGs > 0) || holdS < 0) throw new Error(`gravity: event ${k}'s onset (${onsetGs} G/s) or hold (${holdS} s) is not a time`);
    const warnS = surprise ? 0 : Math.round(finite(e.warnS ?? WARN_S, `event ${k}'s warnS`));
    out.push({ kind, atMs: t0Ms + Math.max(0, at) * SEC_MS, toG, onsetGs, holdS, warnS, surprise, ...(kind === 'jink' ? { dirDeg: finite(e.dirDeg ?? 0, `event ${k}'s dirDeg`) } : {}) });
  });
  return out.sort((a, b) => a.atMs - b.atMs);
}

/** The profile record a live environment keeps (env.js setLiveEnv's): the events drawn at the clock now. */
export function profileRecord(state, list) {
  return { t0Ms: state.clock.ms, list: drawProfile(list, state.clock.ms, state.meta?.seed ?? 0), i: 0, phase: 'wait', next: null, baseG: null, ramp: null, lat: 0, falls: [], log: [], card: null };
}

/** The &grav= of a URL as a profile's list (see the header): 'burn:1.0@40s~15', a surprise with '!', several by ','. Null for one that does not parse. */
export function parseGrav(text) {
  if (typeof text !== 'string' || !text) return null;
  const out = [];
  for (const part of text.replace(/ /g, '+').split(',')) {
    const m = /^(burn|cut|flip|jink|brace):(\d+(?:\.\d+)?)@(\d+)s(?:~(\d+))?(?:\^(\d+(?:\.\d+)?))?(?:\+(\d+(?:\.\d+)?))?(!)?$/.exec(part.trim());
    if (!m) return null;
    const [, kind, toG, atS, warnS, onsetGs, holdS, bang] = m;
    out.push({ kind, toG: Number(toG), atS: Number(atS), ...(warnS !== undefined ? { warnS: Number(warnS) } : {}), ...(onsetGs !== undefined ? { onsetGs: Number(onsetGs) } : {}), ...(holdS !== undefined ? { holdS: Number(holdS) } : {}), ...(bang ? { surprise: true } : {}) });
  }
  return out.length ? out : null;
}

const actorOf = (state, pid) => (state.actors?.list ?? []).find(a => a.who === pid) ?? null;
/** The postures a body rests on a fixture in (people/place.js: lying in a rack or a berth, seated on a seat): the fixture takes a change of thrust. */
export const RESTING = Object.freeze(new Set(['lie', 'sit']));
/** Whether a body rests on a fixture (see RESTING): its actor.y is that fixture's height, never a height to fall from. */
export const restsOn = (a) => RESTING.has(a?.posture);
/**
 * The footing's 'couched' (see the header): strapped in, or at COUCH_G and over, or (the review of v0.0.24's A to C) under 0.05 G
 * lying in a rack or seated (restsOn): the fixture holds him, so a body in his rack at 0 G does not read 'float'. Only under the
 * float band, so a sleeper at Mars or in the Wheel keeps the footing he had.
 */
export function couchedOf(state, pid) {
  const a = actorOf(state, pid);
  if (!a || !state?.places?.live?.area) return false;
  if (a.strapped) return true;
  const gG = gravityAt(state, null, a.x, a.z).gG;
  return gG >= COUCH_G || (gG < GAIT_G.FLOAT_BELOW_G && restsOn(a));
}

/** Strap a person into the seat or rack ref (a fixture's or a seat's id), or out of it with null: actor.strapped. Returns whether it changed. */
export function setStrapped(state, pid, ref) {
  const a = actorOf(state, pid);
  if (!a) return false;
  if (ref) { if (a.strapped === ref) return false; a.strapped = ref; return true; }
  if (!a.strapped) return false;
  delete a.strapped;
  return true;
}
