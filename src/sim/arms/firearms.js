// OLYMPUS arms: the gun as a state machine, its truth and its holder's belief, every action on it with its time and its roll (WEAPONS §4, §5.1, §5.2, §5.4; the build sheet 0.0.5 §2.1).
//
// Adapted from tradecraft v0.2.0-rc3 src/sim/firearms.js (487 lines): newGun, act, fire (here pull),
// feed, canDo, said and ready keep their meaning, and its fumble ladder is kept to the die (the
// firearms test runs tradecraft's own experiment through act() and gets its numbers). What changed:
// SKILLS' paceOf replaces tradecraft's pace() (base times are at value 10, thumb work takes the pace
// squared, long guns LONG_K but on up, stow and thumb work); SKILLS' grades and routine work read the
// roll (a routine natural 1 costs time and nothing else); the reliability is WEAPONS §4.3's, service
// grade, with dust, fouling, lube and heat as fields read and never moved this round; the coach's
// dummy is a set stoppage of three kinds; and the holder's belief is new.
//
// **The truth** (WEAPONS §4.1) is the gun's record in state.items: { type: 'gun', model, mag (the
// magazine in it: an item id, its holder field, written only by kit.move), chamber ('live' | 'dud' |
// 'case' | absent), jam ('double' | absent), locked (the bolt held open), mode (the selector's: 'safe',
// 'semi', 'auto'; a manual safety reads 'safe' or 'semi', a gun with none 'semi'), cocked (the hammer;
// absent: cocked), portOpen, set (the chambered round is the coach's: 'dud' | 'stovepipe' | 'double'),
// cond, foul, dust, lube, barrelC, rounds (fired, the armourer's book), byId, finish (0.0.12: its colours, an id of
// src/data/finishes.js, absent for the issue's, the Corps' black; read through finishOf), belief }, saved without
// its defaults (TECH §6.6: setG writes a default as an absent field). A magazine is { type: 'mag', fam,
// n, load, cond?, dust?, set?: { n, kind }, belief?: { n, approx } }.
//
// **The belief** (WEAPONS §4.2: "we only know what we know") is gun.belief = { chamber: 'live' |
// 'empty' | '?' | 'dud' | 'case', locked, stoppage: 'click' | 'dead' | 'felt' | 'case' | 'double',
// count, countApprox }, the count being the believed rounds of the magazine in the gun; a magazine out
// of the gun carries its own (mag.belief, absent when unknown), so a belief about one magazine is in one
// place at a time and moves with it. The magazine in or out, the selector, the port and the hammer are
// always known to the gun's holder (felt under the hand) and read from the truth by beliefOf(), the one
// view the HUD reads; nothing else of the truth leaves this module through it. The belief moves only by
// what the holder did, saw or felt: charge, release and magIn as the holder expects from what they
// believe; a press check, an inspection, a magazine check and a look at the port copy the truth they
// look at; a miss on charge, lockBack, magOut or inspect makes that part '?'; a bad inspection sees
// what it expected, 'empty', whatever is there (the one silent failure, logged hidden: SKILLS §5.14,
// "a failed roll to notice something leaves no trace"); a pull says what it felt (feel()).
//
// **An action** (ACTIONS, WEAPONS §5.2's this round): base seconds at value 10 and a DC; thumb (the
// pace squared), long (LONG_K on a long gun), the tempos it may take (R rushed, C careful), its frame
// for the art; a look at the port takes the eye's time, unpaced (the build sheet's IA times: 2.02 s at
// value 3, 1.02 at 30). actionMs() is its time before any fumble. act() is the pure core: one Weapon handling
// roll (SKILLS' check, procedure, at the caller's pressure), then the ladder (§5.4): a failure costs
// FUMBLE_K more time; a failure that bites (not routine) on a chamber or magazine action leaves its
// part '?', on the selector leaves the lever where it was (the thumb slipped: v0.0.9), worse by DROP_BY drops the magazine (a magazine action) or the gun (a long gun swings on
// its two-point sling, SLING_RECOVER_S to recover: §5.5), worse by DISCHARGE_BY with the gun ready and
// a hand at the trigger (DISCHARGE_ACTIONS) fires it; a natural 1 draws its own die (tradecraft's: under
// NAT1_DROP_BELOW a drop NAT1_DROP of the time, under NAT1_SHOT_BELOW a shot NAT1_SHOT of the time too).
// A lockBack missed leaves a live round in the chamber (the extractor slipped off its rim: "you're not
// sure the round came out", because it didn't), which is how a negligent discharge really happens
// (§5.4): a check skipped, a look failed, a function check pulled on a gun believed empty. Moving the
// magazines between gun, pouch and ground is doAction()'s, through kit.move.
//
// **A pull** (pull(): WEAPONS §4.3, §4.4) is the single place a round fires: on safe, broken, jammed,
// the bolt open, the hammer down, a click on an empty chamber; a set round does what the coach set it
// to (a dud clicks; a stovepipe fires and short-strokes; a double fires and feeds two); else a misfire
// on misfireP(), else it fires and, on jamP(), stops (a double feed DOUBLE_SHARE of the time, if rounds
// are left, else a stovepipe); else it feeds the next round, or locks the bolt back on an empty
// magazine. The draws (misfire, stoppage, its kind) are tradecraft's, in its order, on the caller's
// stream. feed() is the single place a round enters the chamber (tradecraft's), and where a magazine's
// set round becomes the chambered round's.
//
// **A magazine reached for** (0.0.6; the user, 2026-11-07: "putting magazine in should be a "Reach for
// magazine" (or equivalent) and when we have the mag we reached for, we see if it has ammo in and which kind
// before we decide to either put it away again, drop it or put it in"; WEAPONS §5.2). v0.0.5's magIn (1.4 s
// at value 10, DC 9: a spare taken by rule and seated with the tug) is split into its two motions: `reach`
// (REACH_S 0.6 s, no roll: the hand to a named pouch, kit.js pickMag's 'p1', 'p2', 'dump', or 'ground', a
// pickup off the ground, PICKUP_S 1.0 s and no LONG_K, WEAPONS §5.5) brings a magazine to the support hand,
// and `seat` (SEAT_S 0.8 s, DC 9, the old roll whole) puts the one in the hand into the well. Both take
// LONG_K, so reach and seat make the old 1.61 s at value 10 and the drills' times stand (LOAD 2.41 s, the
// RELOADs 2.53 / 2.99 / 3.22 s). magIn stays as it was, the two in one, for v0.0.5's saves and REMEDIAL
// ACTION (its stripped magazine brought back from the hand that racked, in the reach's time). An action id
// may carry its place after '@' ('reach@p1', 'stowMag@p2'): actionKey() gives its ACTIONS key. In the hand
// the magazine is felt: its weight's band (FEEL: 'none', 'few', 'half', 'most', 'full' of its capacity, the
// truth's, no roll), written to its belief when the count is not known, and a band that contradicts a
// believed count makes the count unknown and halts a drill ("It feels empty. You thought five."). Then the
// steps for a magazine in hand: `lookMag` (LOOK_MAG_S 0.6 s, DC 4, dark +4: the witness holes give the
// count as a magazine check does, the feed lips the top round's kind, ball's bare copper or tracer's red
// tip, or the coach's orange dummy), `seat`, `stowMag@<pouch>` (put it back, 1.0 s, DC 5), `dumpMag` (0.7
// s, DC 4) and `dropMag` (0.3 s, no roll). A magazine's belief gains `kind` (the kind of round it holds, as
// told or seen) and `feel`; the gun's gains `load`, the believed kind of the magazine in it, moving with the
// magazine as its count does. A round carries its kind into the chamber (gun.load, feed()), out of the
// muzzle (pull()'s load: the shot's look draws a tracer's trace) and out of the port ('tracer', a live
// tracer round thrown by a hand).
//
// **The sight and the zero** (0.0.7; WEAPONS §2.5, §3.5, §11.4; the build sheet 0.0.7 §2.1, §8 items 7 and 8). The
// gun's truth gains sight { elev, wind } (the SO-4's turrets, integer clicks of CLICK_MRAD 0.1, ±TURRET_MAX_CLK 60;
// up raises the strike, right moves it right), zero { elev, wind } (the settings at which this rifle strikes on
// the Corps' BZO: drawn at issue by drawZero(), N(0, ZERO_SD_CLK 10) clamped ±ZERO_MAX_CLK 25 on
// stream('zero', seed, gunId), never shown) and optic (the lever: 1 or 4). Absent, each reads 0, 0 and 0, 0
// and 1, so a v0.0.6 gun is zeroed on the BZO at 1× and saves byte for byte. The belief gains zero (what the
// holder believes the zero is: absent, the armoury card's, the turrets as issued, 0, 0; the coach's after a
// zero). The turrets and the lever are seen and felt, so beliefOf() returns them as they are, with the dope the
// holder believes (belief.zero + ballistics.js DOPE_CARD). Dialling (dialMs: DIAL_S 0.12 s a click × pace, no
// roll; the hands on the turret, off the aim), the lever (OPTIC_S 0.5 s, no roll) and a read of the wind
// (READ_S 1.5 s × pace, no roll) are the singles of src/sim/arms/shooting.js, which call dial() and setOptic().
//
// doAction() is the state's way in: the roller (combat/roll.js rollerOf: the skill, the body, the needs,
// the light), the main stream, the spares in reach, the observer; the items moved by kit.move, the
// posture and the finger on kit.carry, the roll logged { kind: 'roll', roll, step, gun } and told
// ('roll'), the observer's look logged short and their word said ('say' kind 'speech': "Clear." or
// "Hold. There's a round in it."), a negligent discharge graded (carry.js ndOf) and told ('nd'), a
// magazine dropped on a hard surface worn MAG_DROP_WEAR (WEAPONS §5.5; loose regolith takes nothing).
// What a step throws out of the port (result.ejected, ejects: 'round' | 'dummy' | 'case') is for the
// caller to store as brass (look.js ejectCase), as resolveShot does a fired case. Positions are metres,
// times game ms; a condition is rounded to 1e-6 before it is saved (core/num.js).
// 0.0.9 (the build sheet 0.0.9 §2.1, §8 items 8, 9; COMBAT §5.3, §5.9): the chaos reaches the hands through the roller
// only. WEAPONS §5.1's flat 'fire' −3 (PRESSURE_MODS, never applied: no caller passed 'fire') is retired for the roller's
// one felt entry (combat/supp.js suppMod), and an action's time is × roller.timeK (supp.js suppTimeK: exactly 1 at felt 0),
// the roller taken at the sub-step's start. Pressure stays 'evaluated' on the range: routine emerges from value + mods.
import { q } from '../../core/num.js';
import { hashInt } from '../../core/hash.js';
import { nextId, put } from '../../core/ids.js';
import { rngOf, next, chance, stream, normal } from '../../core/rng.js';
import { logEntry } from '../log.js';
import { check, TEMPO } from '../skills/checks.js';
import { paceOf } from '../skills/skills.js';
import { rollerOf, DARK_BELOW } from '../combat/roll.js';
import { MODELS, FAMILIES, OPTICS, modelOf, isLong, famCap } from './models.js';
import { DOPE_CARD } from './ballistics.js';
import { move, sparesOf, dumpOf, pouchFor, ownerOf, holderOf, believedN, believedKind, handMagOf, pickMag, pouchesOf, pouchOf, atFeetOf, meantLoad, PLACE_WORDS } from './kit.js';
import { CALIBRES, loadOf } from './calibres.js';
import { ndOf, SLUNG } from './carry.js';
import { surfaceAt } from '../places/model.js';
import { ISSUE_FINISH, isFinish, finishId } from '../../data/finishes.js';

// ---- constants (WEAPONS §4.3, §5.1, §5.4, §5.5; the build sheet's §4) ----

/** A long gun's actions, slower in the hands (tradecraft), on all but up, stow and thumb work (the build sheet's §8 item 13). */
export const LONG_K = 1.15;
/** A failed roll costs this much more of the action's time (×1.6: tradecraft's). */
export const FUMBLE_K = 0.6;
/** The ladder (tradecraft's, kept): short by DROP_BY, dropped; by DISCHARGE_BY and ready, it goes off; decocked, DA_GUARD worse first. */
export const DROP_BY = 6, DISCHARGE_BY = 10, DA_GUARD = 5;
/** A natural 1's own die (tradecraft's): under NAT1_DROP_BELOW a drop NAT1_DROP of the time; under NAT1_SHOT_BELOW a shot NAT1_SHOT of the time, if ready. */
export const NAT1_DROP_BELOW = 10, NAT1_SHOT_BELOW = 5, NAT1_SHOT = 0.4, NAT1_DROP = 0.4;
/** A dropped long gun swings on its two-point sling: this long to recover it, at value 10 (WEAPONS §5.5). */
export const SLING_RECOVER_S = 1.0;
/** Reliability, WEAPONS §4.3 whole (service grade): misfire and stoppage per pull and their terms. */
export const MISFIRE = 0.00015, MISFIRE_WORN = 0.05, MISFIRE_DUST = 0.002;
export const JAM = 0.0006, JAM_WORN = 0.12, JAM_DUST = 0.014, JAM_FOUL = 0.02, JAM_LIMP = 0.03, LIMP_BELOW = 6;
export const MAG_JAM = 0.3, MAG_DUST_JAM = 0.005, DRY_LUBE = 0.005, CATCHER_JAM = 0.001, HEAT_JAM = 0.01, HEAT_JAM_C = 350, FROST_JAM = 0.05;
/** Wear: a serviceable gun (WORN_FROM and up) carries none; it reaches the worst at WORN_FROM − WORN_SPAN; BROKEN won't fire. */
export const WORN_FROM = 0.90, WORN_SPAN = 0.65, BROKEN = 0.25, COND_SERVICE = 0.6;
/** Condition lost a round fired (WEAPONS §4.3: 0.00004, against tradecraft's 0.0008 for a pistol's few magazines). */
export const WEAR = 0.00004;
/** Of stoppages, the double feeds (if the magazine has rounds); the rest stovepipes (tradecraft). */
export const DOUBLE_SHARE = 0.3;
/** A magazine's condition fresh, and what a drop on a hard floor takes off it (tradecraft's; WEAPONS §5.5: on paving, a deck or a floor, not loose regolith). */
export const MAG_FRESH = 0.95, MAG_DROP_WEAR = 0.04;
/** A magazine picked up off regolith takes its dust (WEAPONS §5.5: +0.1). */
export const PICKUP_DUST = 0.1;
/** The observer's look at UNLOAD, SHOW CLEAR: SHOW_LOOK_S × paceOf(their Awareness), Awareness against SHOW_DC, DARK_DC more in the dark. */
export const SHOW_LOOK_S = 1.0, SHOW_DC = 6, DARK_DC = 4;
/** The count (WEAPONS §4.2): exact at Weapon handling COUNT_EXACT_FROM and up, approximate from COUNT_KEPT_FROM, lost in a burst below; a witness window reads exact to WINDOW_EXACT_TO rounds, ±1 above. */
export const COUNT_EXACT_FROM = 15, COUNT_KEPT_FROM = 8, WINDOW_EXACT_TO = 20;
/** A gun's fields at their defaults: written as absent (TECH §6.6). load: the chambered round's kind (0.0.6), ball unless said. */
export const GUN_DEFAULTS = Object.freeze({ chamber: null, jam: null, locked: false, mode: 'safe', cocked: true, portOpen: false, set: null, foul: 0, dust: 0, lube: 'wet', rounds: 0, load: 'ball',
  sight: null, zero: null, optic: 1 });
/** The turrets (0.0.7, see the header): a click's seconds at value 10 (× pace), the lever's, a read of the wind's (× pace). */
export const DIAL_S = 0.12, OPTIC_S = 0.5, READ_S = 1.5;
/** The turrets' reach, clicks either way (the SO-4's). */
export const TURRET_MAX_CLK = OPTICS.so4.turretMaxClk;
/** A rifle as the armoury hands it out: its zero off the turrets' 0 by N(0, ZERO_SD_CLK), at most ZERO_MAX_CLK (my call: 1 mrad sd, 30 cm at 300 m). */
export const ZERO_SD_CLK = 10, ZERO_MAX_CLK = 25;
/** The magazine in hand (0.0.6, see the header): the reach and the seat, base seconds at value 10 (with LONG_K they make magIn's 1.61 s), a pickup off the ground, the look at a magazine. */
export const REACH_S = 0.6, SEAT_S = 0.8, PICKUP_S = 1.0, LOOK_MAG_S = 0.6;
/** A magazine's weight felt in the hand, by its share of the capacity: none, then up to each fraction (the truth's band, no roll). */
export const FEEL = Object.freeze([['few', 0.25], ['half', 0.6], ['most', 0.9999]]);
/** The bands in words, as the hand says them (the user's "about how many"). */
export const FEEL_WORDS = Object.freeze({ none: 'none', few: 'a few', half: 'about half', most: 'nearly full', full: 'full' });
/** A magazine of n rounds of a capacity: its weight's band. */
export function feelOf(n, cap) {
  if (!(n > 0)) return 'none';
  if (n >= cap) return 'full';
  for (const [band, k] of FEEL) if (n <= cap * k) return band;
  return 'most';
}
/** An action id's ACTIONS key: the id before its place ('reach@p1' → 'reach'). */
export const actionKey = (id) => (typeof id === 'string' && id.includes('@') ? id.slice(0, id.indexOf('@')) : id);
/** An action id's place ('reach@p1' → 'p1'), or null. */
export const actionPlace = (id) => (typeof id === 'string' && id.includes('@') ? id.slice(id.indexOf('@') + 1) : null);
/** An action's record by its id (a placed id by its key), or null. */
export const actionOf = (id) => ACTIONS[id] ?? ACTIONS[actionKey(id)] ?? null;

/** The observer's word after a show (SHOW CLEAR's look): the 'say' fact and its log line (J shows the coach's "Clear."). */
export function sayObserved(state, bus, { who, text }) {
  bus?.emit('say', { who, text, kind: 'speech', durMs: 2000 });
  logEntry(state, bus, { kind: 'say', tone: 'note', who, text, say: 'speech', area: state.places?.live?.area ?? undefined });
}

/** What a pull that didn't fire says (WEAPONS §4.4). */
export const REFUSALS = Object.freeze({
  safety: 'The trigger won\'t move: it\'s on safe.', empty: 'Click.', dud: 'Click.', jammed: 'The trigger\'s dead.',
  broken: 'Nothing: it wants the armourer.', open: 'Nothing: the bolt is back.', dead: 'The trigger\'s dead: the hammer is down.',
});

const R = Object.freeze(['rushed']), C = Object.freeze(['careful']), N = Object.freeze([]);
const A = (label, s, dc, o = {}) => Object.freeze({ label, s, dc, thumb: false, long: true, tempo: N, frame: null, ...o });
/** The actions (WEAPONS §5.2, this round's): id → { label, s (base seconds at value 10), dc (null: no roll), thumb, long, tempo, frame, … }. */
export const ACTIONS = Object.freeze({
  up: A('Up', 1.0, 6, { long: false, tempo: R, frame: 'raise', fromBack: Object.freeze({ s: 2.5, dc: 9 }) }),
  stow: A('Sling it', 1.0, 5, { long: false, frame: 'sling', pistol: Object.freeze({ s: 1.3, dc: 6 }) }),
  draw: A('Draw', 1.0, 8, { long: false, tempo: R, frame: 'raise' }),
  'posture:lowReady': A('Low ready', 0.3, 3, { frame: 'raise', posture: 'lowReady' }),
  'posture:highReady': A('High ready', 0.3, 3, { frame: 'raise', posture: 'highReady' }),
  'selector:safe': A('Safe', 0.4, 6, { thumb: true, long: false, mode: 'safe' }),
  'selector:semi': A('Semi', 0.4, 6, { thumb: true, long: false, mode: 'semi' }),
  'selector:auto': A('Auto', 0.4, 6, { thumb: true, long: false, mode: 'auto' }),
  port: A('Close the port', 0.4, 3, { thumb: true, long: false }),
  charge: A('Charge', 0.8, 8, { tempo: R, frame: 'charge' }),
  release: A('Bolt release', 0.3, 6, { tempo: R, frame: 'release' }),
  lockBack: A('Lock it back', 0.6, 6, { frame: 'charge' }),
  'magOut:drop': A('Drop the magazine', 0.5, 5, { tempo: R, frame: 'magout', to: 'drop' }),
  'magOut:dump': A('Magazine to the dump pouch', 0.9, 6, { tempo: R, frame: 'magout', to: 'dump' }),
  'magOut:pouch': A('Magazine to a pouch', 1.4, 7, { tempo: R, frame: 'magout', to: 'pouch' }),
  // (REMEDIAL ACTION's own steps, the design review's: the magazine stripped out into the support hand and kept there
  // to go back in, and the action racked clear with no magazine under it; 0.85 and 0.45 s make the drill's lock,
  // strip, rack ×3, in, rack WEAPONS §5.3's 5.75 s at value 10, and the look at the port its 6.05)
  'magOut:strip': A('Strip the magazine', 0.85, 6, { tempo: R, frame: 'magout', to: 'hand' }),
  rack: A('Rack it clear', 0.45, 5, { tempo: R, frame: 'charge' }),
  magIn: A('Magazine in', 1.4, 9, { tempo: R, frame: 'magin' }),
  // (0.0.6: magIn's two motions, the reach to a named pouch or the ground and the seat with the tug (see the header),
  // and what a hand does with the magazine it holds: a look at it, put back, dumped, dropped)
  reach: A('Reach for a magazine', REACH_S, null, { tempo: R, frame: 'magout', ground: Object.freeze({ s: PICKUP_S, long: false }) }),
  seat: A('Magazine in', SEAT_S, 9, { tempo: R, frame: 'magin' }),
  lookMag: A('Look at the magazine', LOOK_MAG_S, 4, { long: false, tempo: C, frame: 'magout', dark: DARK_DC, look: true }),
  stowMag: A('Put it back', 1.0, 5, { long: false, tempo: R, frame: 'magout' }),
  dumpMag: A('Into the dump pouch', 0.7, 4, { long: false, tempo: R, frame: 'magout' }),
  dropMag: A('Drop it', 0.3, null, { long: false, frame: 'magout' }),
  tap: A('Tap the magazine', 0.3, 4, { tempo: R, frame: 'magin' }),
  pressCheck: A('Press check', 1.2, 6, { tempo: C, frame: 'check' }),
  magCheck: A('Magazine check', 2.0, 7, { tempo: C, frame: 'magout' }),
  inspect: A('Look in the chamber', 1.0, 6, { tempo: C, frame: 'check', dark: DARK_DC, look: true }),
  observe: A('Look at the port', 0.3, 4, { long: false, paced: false, frame: 'check', dark: DARK_DC, look: true }),
  functionCheck: A('Function check', 0.5, null, { frame: 'aim' }),
  clearDouble: A('Clear the double feed', 5.0, 12, { tempo: C, frame: Object.freeze(['magout', 'charge', 'charge', 'charge', 'magin', 'charge']) }),
  show: A('Show it clear', SHOW_LOOK_S, SHOW_DC, { long: false, frame: 'check', observer: true }),
  finger: A('Finger off', 0, null, { long: false }),
  // (0.0.7: the turrets, the lever and a read of the wind: no roll; their times by dialMs, opticMs, readMs (see the header))
  dial: A('Dial the turrets', DIAL_S, null, { long: false, frame: 'check' }),
  optic: A('Throw the lever', OPTIC_S, null, { long: false, paced: false, frame: 'check' }),
  read: A('Read the wind', READ_S, null, { long: false }),
});
/** The actions that move the chamber or a magazine: a miss leaves that part '?' (WEAPONS §5.4). */
const UNSURE = new Set(['charge', 'rack', 'lockBack', 'magOut:drop', 'magOut:dump', 'magOut:pouch', 'magOut:strip', 'inspect', 'clearDouble']);
/** A hand at the trigger or the action: a disaster with the gun ready fires it (tradecraft's list, by OLYMPUS's names). */
export const DISCHARGE_ACTIONS = new Set(['up', 'draw', 'stow', 'selector:safe', 'selector:semi', 'selector:auto', 'pressCheck', 'magIn', 'seat', 'charge', 'rack', 'release']);
/** A fumble that drops the magazine, not the gun (the magazine in the hand, for the hand's own steps). */
const MAG_ACTIONS = new Set(['magIn', 'seat', 'magOut:drop', 'magOut:dump', 'magOut:pouch', 'magOut:strip', 'magCheck', 'stowMag', 'dumpMag']);
/** The steps of a magazine held in the hand (0.0.6): each needs one there. */
export const HELD_ACTIONS = new Set(['seat', 'lookMag', 'stowMag', 'dumpMag', 'dropMag']);

// ---- the records ----

/** A gun's field, its default when absent. */
export const gunField = (g, k) => (g?.[k] === undefined ? GUN_DEFAULTS[k] : g[k]);
// (write a field, a default as absent)
function setG(g, k, v) { if (v === undefined || v === GUN_DEFAULTS[k] || (v === null && GUN_DEFAULTS[k] === undefined)) delete g[k]; else g[k] = v; }

// ---- 0.0.7: the turrets, the zero, the lever (see the header) ----

const clk = (v) => Math.max(-TURRET_MAX_CLK, Math.min(TURRET_MAX_CLK, Math.round(v ?? 0) || 0));
/** The turrets' settings (truth, and seen): { elev, wind }, 0, 0 when absent. */
export const sightOf = (g) => ({ elev: g?.sight?.elev ?? 0, wind: g?.sight?.wind ?? 0 });
/** The rifle's true zero (never shown): the settings at which it strikes on the BZO, 0, 0 when absent. */
export const zeroOfGun = (g) => ({ elev: g?.zero?.elev ?? 0, wind: g?.zero?.wind ?? 0 });
/** The lever's magnification (1 when absent). */
export const opticOf = (g) => g?.optic ?? 1;
/** The holder's believed zero: belief.zero, or the armoury card's (the turrets as issued: 0, 0). */
export const beliefZero = (g) => ({ elev: g?.belief?.zero?.elev ?? 0, wind: g?.belief?.zero?.wind ?? 0 });
// (an { elev, wind } pair written, 0, 0 as absent)
function setPair(g, k, p) { const e = clk(p?.elev), w = clk(p?.wind); if (!e && !w) delete g[k]; else g[k] = { elev: e, wind: w }; }
/** The turrets turned by clicks (w; clamped to their reach): returns the clicks actually turned { elev, wind, n }. */
export function dial(g, { elev = 0, wind = 0 } = {}) {
  const was = sightOf(g);
  setPair(g, 'sight', { elev: was.elev + elev, wind: was.wind + wind });
  const now = sightOf(g);
  return { elev: now.elev - was.elev, wind: now.wind - was.wind, n: Math.abs(now.elev - was.elev) + Math.abs(now.wind - was.wind) };
}
/** The turrets set to a setting (w): dial()'s clicks to get there. */
export const setSight = (g, to) => { const was = sightOf(g); return dial(g, { elev: (to?.elev ?? 0) - was.elev, wind: (to?.wind ?? 0) - was.wind }); };
/** The rifle's true zero written (w; the armoury's draw, a test's). */
export const setZero = (g, z) => setPair(g, 'zero', z);
/** The holder's believed zero written (w; the coach's call after a group, the armoury card's at issue). */
export function believeZero(g, z) {
  const B = beliefRec(g);
  if (!z) { delete B.zero; return; }
  const e = clk(z.elev), w = clk(z.wind);
  if (!e && !w) delete B.zero; else B.zero = { elev: e, wind: w };
}
/** The lever thrown (w): 1 or 4. */
export function setOptic(g, mag) { if (mag === 1 || !mag) delete g.optic; else g.optic = mag; }
/** A turn of the turrets' time, ms: DIAL_S a click × pace (no roll); at least a touch. */
export const dialMs = (roller, clicks) => Math.round(Math.max(1, Math.abs(clicks)) * DIAL_S * paceOf(roller.value('weapons')) * 1000);
/** The lever's time, ms (no roll), and a read of the wind's (× pace). */
export const opticMs = () => Math.round(OPTIC_S * 1000);
export const readMs = (roller) => Math.round(READ_S * paceOf(roller.value('marksmanship')) * 1000);
/** A rifle's zero as the armoury hands it out (see the header): { elev, wind }, integer clicks, the same for a gun id in a world. */
export function drawZero(seed, gunId) {
  const r = stream('zero', seed, gunId), c = (v) => Math.max(-ZERO_MAX_CLK, Math.min(ZERO_MAX_CLK, Math.round(v)));
  return { elev: c(normal(r, 0, ZERO_SD_CLK)), wind: c(normal(r, 0, ZERO_SD_CLK)) };
}
/** The dope a holder believes from a believed zero (the Corps' card added): { 200, 300, 500: { elev, wind } }, or null for a model with no card. */
export function dopeFrom(model, z) {
  const card = DOPE_CARD[model];
  if (!card || !z) return null;
  return Object.fromEntries(Object.entries(card).map(([d, c]) => [d, { elev: z.elev + c.elev, wind: z.wind + c.wind }]));
}
/** A gun's finish as drawn (an id of src/data/finishes.js): its own, else the issue's black; a gun's colours are seen, not believed, and read from the item. */
export const finishOf = (gun) => finishId(gun?.finish);
const BELIEF_DEFAULTS = Object.freeze({ locked: false, stoppage: null, countApprox: false });
function setB(b, k, v) { if (v === undefined || v === null && k === 'count' || v === BELIEF_DEFAULTS[k]) delete b[k]; else b[k] = v; }
const beliefRec = (g) => (g.belief ??= { chamber: 'empty' });

/**
 * A new gun (w): its record in state.items, Condition 4 (no magazine, the chamber empty, the bolt closed and cocked, on safe, the
 * port shut), its holder's belief known; finish its colours (src/data/finishes.js, the issue's black written as no field, an
 * unknown id refused). Returns its id.
 */
export function newGun(state, { model = 'r7', byId = null, cond = 0.93, finish = null } = {}) {
  const M = MODELS[model];
  if (!M) throw new Error(`firearms.newGun(): no model '${model}'`);
  if (finish !== null && finish !== undefined && !isFinish(finish)) throw new Error(`firearms.newGun(): no finish '${finish}'`);
  const id = nextId(state, 'i'), g = { type: 'gun', model, cond };
  if (M.safety === 'none') g.mode = 'semi';
  if (byId) g.byId = byId;
  if (finish && finish !== ISSUE_FINISH) g.finish = finish;
  g.belief = { chamber: 'empty' };
  put(state, state.items, id, g);
  return id;
}

/** A new box magazine (w) of a family with n rounds of a load; set: the coach's set round { n, kind }; told: the holder knows its count; toldKind: and its kind (0.0.6). Returns its id. */
export function newMag(state, { fam = 'had30', n = null, load = 'ball', set = null, told = true, toldKind = told } = {}) {
  if (!FAMILIES[fam]) throw new Error(`firearms.newMag(): no family '${fam}'`);
  const id = nextId(state, 'i'), rounds = Math.max(0, Math.min(famCap(fam), n ?? famCap(fam)));
  const m = { type: 'mag', fam, n: rounds, load };
  if (set) m.set = { n: set.n, kind: set.kind };
  if (told || toldKind) m.belief = {};
  if (told) m.belief.n = rounds;
  if (toldKind) m.belief.kind = load;
  put(state, state.items, id, m);
  return id;
}

// ---- reliability (WEAPONS §4.3) ----

const wearK = (g) => Math.max(0, Math.min(1, (WORN_FROM - (g.cond ?? 0.95)) / WORN_SPAN));
/** The chance a live round doesn't go off at a pull. Dust, fouling, lube and heat are read; nothing moves them this round. */
export function misfireP(gun, mag = null, M = modelOf(gun)) {
  return (MISFIRE + MISFIRE_WORN * wearK(gun) + MISFIRE_DUST * gunField(gun, 'dust')) * (M?.unreliable ?? 1);
}
/** The chance the gun stops as it cycles a shot (wh: the holder's Weapon handling, for a pistol's limp wrist). */
export function jamP(gun, mag = null, { wh = 10, M = modelOf(gun) } = {}) {
  const dust = gunField(gun, 'dust'), foul = gunField(gun, 'foul'), lube = gunField(gun, 'lube');
  const gunTerms = JAM + JAM_WORN * wearK(gun) ** 2 + JAM_DUST * dust ** 2 * (M?.dustK ?? 1) + JAM_FOUL * foul ** 2
    + (M?.kind === 'pistol' && wh < LIMP_BELOW ? JAM_LIMP : 0) + (gun.catcher ? CATCHER_JAM : 0) + (lube === 'none' ? DRY_LUBE : 0)
    + ((gun.barrelC ?? 0) > HEAT_JAM_C ? HEAT_JAM : 0) + (gun.frost ?? 0) * FROST_JAM;
  const magTerms = mag ? MAG_JAM * Math.max(0, 0.9 - (mag.cond ?? MAG_FRESH)) + MAG_DUST_JAM * (mag.dust ?? 0) : 0;
  return gunTerms * (M?.unreliable ?? 1) + magTerms;
}

// ---- the round into the chamber, and the pull ----

/** The top round off a magazine into the chamber (w the two records): live, or the coach's set round when the magazine's count is its n (tradecraft's mag.dummy). */
export function feed(gun, mag) {
  const set = mag.set && mag.set.n === mag.n ? mag.set.kind : null;
  mag.n -= 1;
  if (mag.set && (set || mag.set.n > mag.n)) delete mag.set;
  setG(gun, 'chamber', 'live');
  setG(gun, 'set', set);
  setG(gun, 'load', mag.load ?? 'ball');
}

/** Whether a trigger pull would fire it: a live round chambered, the bolt closed and in battery, cocked, off safe, not broken. */
export function ready(gun) {
  if (!gun || (gun.cond ?? 1) < BROKEN) return false;
  return gunField(gun, 'mode') !== 'safe' && gunField(gun, 'chamber') === 'live' && !gunField(gun, 'jam') && !gunField(gun, 'locked') && gunField(gun, 'cocked');
}

/**
 * The trigger pulled, one round (w the gun and its magazine): { fired, why (not fired: 'safety' |
 * 'broken' | 'jammed' | 'open' | 'dead' | 'empty' | 'dud'), stoppage ('case' | 'double': fired, and
 * it stopped cycling), empty (the last round gone), set (the coach's round, what it was), dummy }.
 * opts: { model (a fixture's), wh }. Draws on rng: the misfire, then the stoppage, then its kind
 * (tradecraft's order).
 */
export function pull(rng, gun, mag = null, { model = null, wh = 10 } = {}) {
  const M = model ?? modelOf(gun);
  if (gunField(gun, 'mode') === 'safe') return { fired: false, why: 'safety' };
  if ((gun.cond ?? 1) < BROKEN) return { fired: false, why: 'broken' };
  if (gunField(gun, 'jam')) return { fired: false, why: 'jammed' };
  if (gunField(gun, 'locked')) return { fired: false, why: 'open' };
  if (!gunField(gun, 'cocked')) return { fired: false, why: 'dead' };
  const ch = gunField(gun, 'chamber');
  if (ch === null) { setG(gun, 'cocked', false); return { fired: false, why: 'empty' }; }
  if (ch === 'case') return { fired: false, why: 'jammed' };
  if (ch === 'dud') { setG(gun, 'cocked', false); return { fired: false, why: 'dud' }; }
  const set = gunField(gun, 'set');
  if (set === 'dud') { setG(gun, 'chamber', 'dud'); setG(gun, 'cocked', false); return { fired: false, why: 'dud', set: 'dud', dummy: true }; }
  if (chance(rng, misfireP(gun, mag, M))) { setG(gun, 'chamber', 'dud'); setG(gun, 'cocked', false); return { fired: false, why: 'dud' }; }
  // (it fires: the round counted, the condition worn, the port cover opens itself; its kind leaves with it)
  const load = gunField(gun, 'load');
  setG(gun, 'rounds', gunField(gun, 'rounds') + 1);
  gun.cond = q(Math.max(0, (gun.cond ?? 0.95) - WEAR), 1e-6);
  setG(gun, 'portOpen', true);
  setG(gun, 'set', null);
  const left = !!mag && mag.n > 0;
  if (set === 'stovepipe' || (set === 'double' && !left)) { setG(gun, 'chamber', 'case'); setG(gun, 'load', null); return { fired: true, why: null, stoppage: 'case', set, load }; }
  if (set === 'double') { mag.n -= 1; setG(gun, 'chamber', 'case'); setG(gun, 'jam', 'double'); setG(gun, 'load', null); return { fired: true, why: null, stoppage: 'double', set, load }; }
  if (chance(rng, jamP(gun, mag, { wh, M }))) {
    const double = chance(rng, DOUBLE_SHARE) && left;
    setG(gun, 'chamber', 'case'); setG(gun, 'load', null);
    if (double) { mag.n -= 1; setG(gun, 'jam', 'double'); }
    return { fired: true, why: null, stoppage: double ? 'double' : 'case', load };
  }
  if (left) { feed(gun, mag); return { fired: true, why: null, load }; }
  setG(gun, 'chamber', null); setG(gun, 'load', null);
  setG(gun, 'locked', !!mag && !!M?.holdOpen);
  return { fired: true, why: null, empty: true, locked: !!mag && !!M?.holdOpen, load };
}

/**
 * What a pull tells its holder (the belief after it, a new object): a shot fired counts the magazine
 * down one (approximate under COUNT_EXACT_FROM, lost in a burst under COUNT_KEPT_FROM), the last round
 * locks the bolt back on an empty chamber, a shot that did not cycle is felt ('felt'), a click is a
 * click, a dead trigger dead. b: the stored belief ({ chamber, locked, stoppage, count, countApprox }).
 */
export function feel(b, r, { wh = 10, burst = false } = {}) {
  const out = { ...b };
  const countDown = () => {
    if (typeof out.count !== 'number') return;
    if (wh < COUNT_KEPT_FROM && burst) { delete out.count; delete out.countApprox; return; }
    out.count = Math.max(0, out.count - 1);
    if (wh < COUNT_EXACT_FROM) out.countApprox = true;
  };
  if (r.fired) {
    countDown();
    if (r.empty) { out.chamber = 'empty'; out.locked = r.locked !== false; if (out.locked) out.count = 0; delete out.countApprox; delete out.stoppage; }
    else if (r.stoppage) out.stoppage = 'felt';
    else { out.chamber = 'live'; delete out.stoppage; }
  } else if (r.why === 'empty' || r.why === 'dud') out.stoppage = 'click';
  // (the bolt held open: the holder sees it back, which is no stoppage; the code review's: a tap after the last
  // round of a string called one, and the reflex card offered "Tap, rack")
  else if (r.why === 'open') { out.locked = true; out.chamber = 'empty'; }
  else if (r.why === 'jammed' || r.why === 'dead' || r.why === 'broken') out.stoppage = out.stoppage === 'double' ? 'double' : 'dead';
  for (const k of ['locked', 'countApprox']) if (!out[k]) delete out[k];
  if (!out.stoppage) delete out.stoppage;
  return out;
}

// ---- times ----

/** An action's base { s, dc, long } on a model (up from the back, a pistol's stow, a reach to the ground). */
export function baseOf(M, action, { posture = null } = {}) {
  const a = actionOf(action);
  if (!a) return null;
  if (action === 'up' && posture === 'slungBack') return { ...a.fromBack, long: a.long };
  if (action === 'stow' && !isLong(M)) return { ...a.pistol, long: a.long };
  if (actionKey(action) === 'reach' && actionPlace(action) === 'ground') return { s: a.ground.s, dc: a.dc, long: a.ground.long };
  return { s: a.s, dc: a.dc, long: a.long };
}
/** The tempo an action takes when asked for one: rushed only where rushable, careful only where careful, else normal. */
export const tempoFor = (action, tempo = 'normal') => ((tempo === 'rushed' || tempo === 'careful') && actionOf(action)?.tempo.includes(tempo) ? tempo : 'normal');
const timeK = (tempo) => TEMPO[tempo]?.timeK ?? 1;

/**
 * An action's time in ms before any fumble: s (× LONG_K on a long gun's long actions) × paceOf(Weapon
 * handling) (thumb work its square) × the tempo's time. show is the observer's: SHOW_LOOK_S ×
 * paceOf(their Awareness). opts: { tempo, posture (up from the back), pace (an override: the parity
 * test's tradecraft pace), observer (a roller), model }.
 */
export function actionMs(roller, gun, action, opts = {}) {
  return Math.round(actionS(roller, gun, action, opts) * 1000);
}
// (the same, in seconds, unrounded: the fumble multiplies it before the one rounding, as tradecraft's act() does)
function actionS(roller, gun, action, { tempo = 'normal', posture = null, pace = null, observer = null, model = null } = {}) {
  const M = model ?? modelOf(gun), a = actionOf(action), base = baseOf(M, action, { posture });
  if (!a || !base) return 0;
  if (a.observer) return SHOW_LOOK_S * paceOf(observer ? observer.value('awareness') : 10);
  const p = a.paced === false ? 1 : pace ?? paceOf(roller.value('weapons'));
  const s0 = base.s * (base.long && isLong(M) ? LONG_K : 1);
  // (× the chaos's time factor, the roller's: exactly 1 when calm, and x × 1 is x to the bit)
  return s0 * (a.thumb ? p * p : p) * timeK(tempoFor(action, tempo)) * (roller?.timeK ?? 1);
}

// ---- the pure core: one action ----

const isDark = (ctx, roller) => ctx.dark ?? (roller?.light === 'dark' || (typeof roller?.light === 'number' && roller.light < DARK_BELOW) || (typeof ctx.light === 'number' && ctx.light < DARK_BELOW));
// (a live tracer thrown out shows its red tip: its own kind, 'tracer')
const ejectedOf = (ch, set, load = 'ball') => (ch === 'case' ? 'case' : ch === 'dud' || ch === 'live' ? (set === 'dud' ? 'dummy' : load === 'tracer' ? 'tracer' : 'round') : null);
// (what the chamber shows a look: a round, the orange dummy, a case, nothing)
const seen = (g) => { const ch = gunField(g, 'chamber'); return ch === 'case' ? 'case' : ch === 'dud' && gunField(g, 'set') === 'dud' ? 'dud' : ch ? 'live' : 'empty'; };
// (the chamber's content out of the port: the record cleared, the kind thrown)
function eject(g) {
  const kind = ejectedOf(gunField(g, 'chamber'), gunField(g, 'set'), gunField(g, 'load'));
  setG(g, 'chamber', null); setG(g, 'set', null); setG(g, 'load', null);
  return kind;
}
// (a magazine's weight in the hand (see the header): the band written to its belief; a band that contradicts the count
// believed (by more than its ±1 when it is a guess) makes the count unknown: { band, surprise, was })
function feelIn(mag) {
  const cap = famCap(mag.fam), band = feelOf(mag.n, cap), was = believedN(mag), B = (mag.belief ??= {});
  const fits = was === null || [was, ...(B.approx ? [was - 1, was + 1] : [])].some(n => feelOf(Math.max(0, n), cap) === band);
  if (was === null || !fits) { B.feel = band; delete B.n; delete B.approx; } else delete B.feel;
  return { band, surprise: !fits, was };
}
const FEEL_SAID = Object.freeze({ none: 'It feels empty.', few: 'Light: a few rounds in it.', half: 'About half full, by the weight.', most: 'Heavy: nearly full.', full: 'Full, by the weight.' });
const placeWord = (from) => (from === 'ground' ? 'Off the ground' : from === 'rule' ? null : `From ${PLACE_WORDS[from] ?? from}`);
const capital = (w) => w.charAt(0).toUpperCase() + w.slice(1);
const roundsWord = (n) => (n === 0 ? 'empty' : n === 1 ? 'one round' : `${n} rounds`);

/**
 * Do one action on a gun (the pure core; w the gun, its magazine and the spare going in): one roll,
 * the ladder, the truth and the belief changed. roller: { value, mods, light } (combat/roll.js);
 * mag: the magazine record in the gun (gun.mag's) or null; ctx: { spares: [{ id, mag }] (in reach, the
 * one to go in first), pressure, tempo, light, dark, observer (a roller, for show), posture (the
 * carry's now), finger, mods (the caller's own: the chaos is the roller's), pace (an override), model (a fixture),
 * force ({ <action>: grade }: a test's lever, the roll kept and marked forced), wh }.
 * Returns { ms, ok, grade, routine, roll, mishap: null | 'dropMag' | 'dropped' | 'discharge', fired,
 * text, ejected, ejects, magId, magOut: 'drop' | 'dump' | 'pouch' | null, magIn: id | null, posture,
 * finger, halts, silent, refused, observed: { roll, said }, slipped (the selector left where it was) }.
 */
export function act(rng, roller, gun, mag, action, ctx = {}) {
  const a = actionOf(action), key = actionKey(action), M = ctx.model ?? modelOf(gun);
  if (!a || !M || !gun) return { ms: 0, ok: false, refused: true, halts: true, text: 'Nothing to do that with.' };
  const out = { ms: 0, ok: true, grade: 'pass', routine: false, roll: null, mishap: null, fired: null, text: '', ejected: null, ejects: [], magId: gun.mag ?? null, magOut: null, magIn: null, posture: null, finger: null, halts: false, silent: false, refused: false };
  const refuse = (text) => ({ ...out, ok: false, refused: true, halts: true, text });
  const B = beliefRec(gun), t = (k) => gunField(gun, k);
  // (what can't be tried at all: the hand finds nothing to do it with)
  if (action === 'magIn' && gun.mag) return refuse('There\'s a magazine in.');
  if (action === 'magIn' && !ctx.spares?.length) return refuse('No magazine to put in.');
  // (the magazine in the hand (0.0.6): a reach needs the hand free and something there; its steps need one in it)
  if (key === 'reach' && ctx.held) return refuse('Your hand holds a magazine already.');
  if (key === 'reach' && !ctx.reach) return refuse(ctx.reachWhy ?? 'No magazine there to reach for.');
  if (HELD_ACTIONS.has(key) && !ctx.held) return refuse('No magazine in your hand: reach for one first.');
  if (key === 'seat' && gun.mag) return refuse('There\'s a magazine in.');
  if ((key === 'stowMag' || key === 'dumpMag') && !ctx.to) return refuse(key === 'dumpMag' ? 'The dump pouch is full.' : 'No room in that pouch.');
  if (action.startsWith('magOut:') && !gun.mag) return refuse('There\'s no magazine in it.');
  if (action === 'magCheck' && !gun.mag) return refuse('There\'s no magazine in it.');
  if (action === 'inspect' && !t('locked')) return refuse('The bolt is closed: lock it back to look in.');
  if (action === 'pressCheck' && t('locked')) return refuse('The bolt is back: look in instead.');
  if (action === 'show' && !ctx.observer) return refuse('Nobody to show it to.');
  if (action === 'show' && !t('locked')) return refuse('The bolt is closed: lock it back to show it.');
  // (the R-7's lever won't turn to safe with the hammer down: felt at once, so no roll and no fumble's time; the
  // runtime review: it rolled, spent 372 ms and halted with nothing on screen to say why)
  if (action === 'selector:safe' && M.safeNeedsCocked && !t('cocked')) return { ...refuse('The lever won\'t go to safe: the hammer is down. Charge it first.'), blocked: true };

  const dark = isDark(ctx, roller), wh = ctx.wh ?? roller.value('weapons'), tempo = tempoFor(action, ctx.tempo ?? 'normal');
  const p = ctx.pace ?? paceOf(wh);
  const sec = actionS(roller, gun, action, { tempo, posture: ctx.posture, pace: ctx.pace, observer: ctx.observer, model: M });
  out.ms = Math.round(sec * 1000);

  // ---- the observer's look (SHOW CLEAR): their Awareness, not the holder's hands ----
  if (a.observer) {
    const obs = ctx.observer, dc = SHOW_DC + (dark ? DARK_DC : 0);
    let roll = check(rng, { skill: 'awareness', value: obs.value('awareness'), dc, mods: obs.mods('awareness', {}) ?? [], pressure: ctx.pressure ?? 'evaluated', procedure: false, by: obs.pid ?? ctx.observerId ?? null, dcParts: dark ? [{ why: 'a look into the chamber', v: SHOW_DC }, { why: 'in the dark', v: DARK_DC }] : null, verb: 'clear' });
    roll = forced(roll, ctx.force?.[action]);
    const round = seen(gun) !== 'empty';
    const said = roll.ok && round ? 'Hold. There\'s a round in it.' : 'Clear.';
    // (the roll says what the look found: "a round in it" when he holds it, "clear" otherwise (the parity review's:
    // J read "· clear" over his "Hold."); a failed look says "clear" as he does, and J shows it with no number)
    roll = { ...roll, verb: roll.ok && round ? 'a round in it' : 'clear' };
    B.chamber = roll.ok && round ? 'live' : 'empty';
    out.observed = { roll, said };
    out.roll = null; out.ok = true; out.grade = 'pass'; out.routine = true;
    out.halts = roll.ok && round; out.text = said;
    return out;
  }

  // ---- the roll ----
  let roll = null;
  if (a.dc !== null) {
    const base = baseOf(M, action, { posture: ctx.posture }), dc = base.dc + (a.dark && dark ? a.dark : 0);
    const mods = [...(roller.mods('weapons', {}) ?? []), ...(ctx.mods ?? [])];
    roll = check(rng, { skill: 'weapons', value: wh, dc, mods, tempo, pressure: ctx.pressure ?? 'evaluated', procedure: true, by: roller.pid ?? null,
      dcParts: a.dark && dark ? [{ why: a.label.toLowerCase(), v: base.dc }, { why: 'in the dark', v: a.dark }] : null });
    roll = forced(roll, ctx.force?.[action]);
  }
  out.roll = roll;
  const slow = !!roll && (!roll.ok || roll.grade === 'miss' || roll.grade === 'bad' || roll.grade === 'disaster');
  const bites = slow && !roll.routine;
  out.ok = !roll || roll.ok; out.grade = roll?.grade ?? 'pass'; out.routine = !!roll?.routine;
  if (slow) out.ms = Math.round(sec * (1 + FUMBLE_K) * 1000);

  // ---- the looks: a bad grade is a wrong reading, never a drop ----
  if (a.look) {
    if (action === 'inspect') {
      if (!bites) B.chamber = seen(gun);
      else if (roll.grade === 'miss') { B.chamber = '?'; out.text = 'You didn\'t get a good look: not sure what\'s in the chamber.'; }
      else { B.chamber = 'empty'; out.silent = true; roll.hidden = true; }
      if (!out.text) out.text = B.chamber === 'empty' ? 'The chamber\'s empty.' : B.chamber === 'case' ? 'A case in the chamber.' : B.chamber === 'dud' ? 'An orange dummy in the chamber.' : 'There\'s a round in the chamber.';
      out.halts = (bites && roll.grade === 'miss') || (B.chamber !== 'empty' && B.chamber !== '?');
      out.found = B.chamber !== 'empty' && B.chamber !== '?';
      return out;
    }
    // (a look at the magazine in the hand: its witness holes give the count, as a magazine check's window does, and
    // its feed lips the top round's kind; a failure learns nothing and says so)
    if (key === 'lookMag') {
      const m = ctx.held.mag, Bm = (m.belief ??= {});
      if (bites) { out.text = 'You can\'t make out the witness holes.'; out.halts = true; return out; }
      const n = m.n, exact = n <= WINDOW_EXACT_TO || !!FAMILIES[m.fam]?.counter;
      const read = exact ? n : Math.max(0, Math.min(famCap(m.fam), n + hashInt(3, 'window', ctx.held.id, n) - 1));
      const top = n === 0 ? null : m.set && m.set.n === n && m.set.kind === 'dud' ? 'dummy' : m.load ?? 'ball';
      Bm.n = read; if (exact) delete Bm.approx; else Bm.approx = true;
      delete Bm.feel;
      if (top && top !== 'dummy') Bm.kind = top;
      out.seen = { n: read, approx: !exact, top };
      out.found = true;
      const L = top && top !== 'dummy' ? loadOf(CALIBRES[FAMILIES[m.fam]?.cal] ? FAMILIES[m.fam].cal : '6.5x40r', top) : null;
      out.text = n === 0 ? 'Empty: the follower is up at the lips.' : top === 'dummy' ? `${capital(roundsWord(read))}, an orange dummy on top.`
        : `${exact ? '' : 'About '}${roundsWord(read)}, ${L?.word ?? top} on top: ${L?.tipWord ?? 'a round'}.`;
      return out;
    }
    // observe: the port shows what's there
    if (bites) { out.silent = true; roll.hidden = true; out.text = 'You look at the port.'; return out; }
    const st = B.stoppage;
    if (t('jam') === 'double') { B.stoppage = 'double'; B.chamber = 'case'; out.found = true; out.text = 'Two rounds in the action: a double feed.'; }
    else if (t('chamber') === 'case') { B.stoppage = 'case'; B.chamber = 'case'; out.found = true; out.text = 'A case caught in the port: a stovepipe.'; }
    // (the bolt back: the open port shows the chamber, a round left in it too, as a missed lock back leaves one)
    else if (t('locked')) {
      delete B.stoppage; B.locked = true; B.chamber = seen(gun);
      out.found = B.chamber !== 'empty';
      out.text = B.chamber === 'live' ? 'The bolt is back, and there\'s a round in the chamber.' : B.chamber === 'dud' ? 'The bolt is back on an orange dummy.' : gun.mag ? 'The bolt is locked back on an empty magazine.' : 'The bolt is locked back, the chamber empty.';
    }
    else { if (st) B.stoppage = 'click'; out.text = st ? 'The bolt is home. A dud, or nothing in it: a press check would tell.' : 'The bolt is home.'; }
    return out;
  }

  // ---- the ladder (WEAPONS §5.4, tradecraft's act()) ----
  if (bites && roll) {
    const u = roll.nat === 1 && roll.value < NAT1_DROP_BELOW ? next(rng) : 1;
    const da = !!M.decocker && !t('cocked');
    const shot = roll.margin <= -(DISCHARGE_BY + (da ? DA_GUARD : 0)) || (!da && roll.value < NAT1_SHOT_BELOW && u < NAT1_SHOT);
    const drop = shot || roll.margin <= -DROP_BY || u < (roll.value < NAT1_SHOT_BELOW ? NAT1_SHOT : 0) + NAT1_DROP;
    if (drop) {
      if (shot && ready(gun) && DISCHARGE_ACTIONS.has(key)) {
        out.mishap = 'discharge';
        out.fired = pull(rng, gun, mag, { model: M, wh });
        out.text = 'Your finger is inside the trigger guard, and it goes off.';
        out.halts = true;
        B.chamber = '?';
        return out;
      }
      if (MAG_ACTIONS.has(key)) {
        out.mishap = 'dropMag';
        out.text = 'The magazine slips out of your fingers and falls.';
        out.halts = true;
        if (action === 'magIn') { out.magIn = ctx.spares[0].id; out.dropSpare = true; return out; }
        if (HELD_ACTIONS.has(key)) { out.dropHeld = true; return out; }
        if (action === 'magCheck') { out.magOut = 'drop'; moveCount(gun, mag, true); return out; }
        out.magOut = 'drop'; moveCount(gun, mag, true);
        return out;
      }
      out.mishap = 'dropped';
      out.halts = true;
      if (isLong(M)) {
        out.ms += Math.round(SLING_RECOVER_S * p * 1000);
        out.posture = 'slungFront';
        out.text = `${M.short} slips out of your hands and swings on its sling.`;
      } else out.text = `${M.short} slips out of your hand and falls.`;
      return out;
    }
  }

  // ---- what the action does: the truth, then the belief as the holder expects ----
  const before = { ...B };
  switch (key) {
    case 'up': out.posture = 'lowReady'; out.text = `${M.short} up, at low ready.`; break;
    case 'draw': out.text = `${M.short} out.`; break;
    case 'stow': out.posture = isLong(M) ? 'slungFront' : null; out.text = `${M.short} slung.`; break;
    case 'posture:lowReady': case 'posture:highReady': out.posture = a.posture; out.text = `${a.label}.`; break;
    case 'selector:safe': case 'selector:semi': case 'selector:auto': {
      const ring = M.ring ?? ['safe', 'semi'];
      if (!ring.includes(a.mode) && M.safety !== 'none') { out.text = `${M.short} has no ${a.mode}.`; out.halts = true; break; }
      const was = t('mode');
      // (a thumb that slips on the lever leaves it where it was: a biting failure on the selector costs its slow time and
      // moves nothing, so "OFF SAFE ✗" means still on safe; the user, 2026-11-07: "likely to fail simple actions like
      // thumbing safety off"; the fixer's call of v0.0.9, WEAPONS §5.4. A drop is the ladder's, above)
      if (bites && M.safety !== 'none' && was !== a.mode) {
        out.slipped = true;
        out.text = `Your thumb slipped off the lever: still ${was === 'safe' ? 'on safe' : `on ${was}`}.`;
        break;
      }
      if (M.safety !== 'none') setG(gun, 'mode', a.mode);
      out.text = was === a.mode ? (a.mode === 'safe' ? 'On safe.' : `On ${a.mode}.`) : a.mode === 'safe' ? 'Safe.' : `Off safe: ${a.mode}.`;
      break;
    }
    case 'port': setG(gun, 'portOpen', false); out.text = 'Port cover closed.'; break;
    case 'charge': case 'rack': {
      // (a double feed with the magazine in: the handle runs, the bolt won't close; IA carries on to its look, which
      // shows why. With the magazine out, nothing holds the loose round up: the bolt runs and throws it out, the
      // action clear and the bolt home on nothing, so lock, strip and rack clear it as REMEDIAL ACTION's own steps
      // (the code review's: only the clearDouble single could, and charge with the magazine stripped never did))
      if (t('jam') === 'double' && mag) { out.text = 'It won\'t go into battery.'; B.stoppage = B.stoppage === 'double' ? 'double' : 'dead'; break; }
      if (t('jam') === 'double') {
        const kinds = ['round'], ch = eject(gun);
        if (ch) kinds.push(ch);
        setG(gun, 'jam', null); setG(gun, 'locked', false); setG(gun, 'cocked', true); setG(gun, 'portOpen', true);
        delete B.stoppage; delete B.locked; B.chamber = 'empty';
        out.ejects = kinds; out.ejected = kinds[0];
        out.text = 'The loose round falls clear: the action\'s empty.';
        break;
      }
      const was = t('chamber');
      out.ejected = eject(gun);
      if (mag && mag.n > 0) feed(gun, mag);
      setG(gun, 'locked', !!mag && !t('chamber') && !!M.holdOpen);
      setG(gun, 'cocked', true); setG(gun, 'portOpen', true);
      // (the belief: what the holder expects, by what they believed and what they see of the bolt)
      delete B.stoppage;
      if (t('locked')) { B.locked = true; B.chamber = 'empty'; B.count = 0; delete B.countApprox; }
      else if (gun.mag) {
        delete B.locked;
        if (before.count === 0) { B.chamber = '?'; delete B.count; delete B.countApprox; }
        else { B.chamber = 'live'; if (typeof B.count === 'number') B.count = Math.max(0, B.count - 1); }
      } else { delete B.locked; B.chamber = 'empty'; }
      out.text = was === 'dud' || (was === 'live' && out.ejected === 'dummy') ? (t('chamber') ? 'The dud out, and one in.' : 'The dud out, and nothing comes up after it.')
        : was === 'case' ? (t('chamber') ? 'The case out: it\'s clear, and there\'s one in.' : 'The case out, and nothing comes up after it.')
        : t('chamber') ? (was === 'live' ? 'A round flies out; another goes in.' : 'One in the chamber.') : t('locked') ? 'The bolt locks back on an empty magazine.' : 'It closes on nothing.';
      break;
    }
    case 'release': {
      const was = t('chamber'), wasLocked = t('locked');
      setG(gun, 'locked', false); setG(gun, 'cocked', true);
      if (wasLocked && mag && mag.n > 0) {
        if (was) { mag.n -= 1; setG(gun, 'jam', 'double'); }
        else feed(gun, mag);
      }
      delete B.locked;
      if (t('jam') === 'double') { B.stoppage = 'dead'; out.text = 'It slams forward and stops short: something\'s wrong.'; out.halts = true; break; }
      if (!wasLocked) { /* (home already: nothing moved, nothing to believe anew) */ }
      else if (gun.mag && before.count !== 0) { B.chamber = 'live'; if (typeof B.count === 'number' && !was) B.count = Math.max(0, B.count - 1); }
      else if (!gun.mag && (before.chamber === 'live' || before.chamber === '?')) B.chamber = before.chamber;
      else B.chamber = 'empty';
      out.text = !wasLocked ? 'The bolt is already home.' : t('chamber') === 'live' && !was ? 'It slams home on a fresh round.' : 'The bolt goes home.';
      break;
    }
    case 'lockBack': {
      const was = t('chamber');
      // (missed: the extractor slips off the rim and a live round stays in the chamber, the bolt locked behind it)
      if (!(bites && was === 'live')) out.ejected = eject(gun);
      setG(gun, 'locked', true); setG(gun, 'cocked', true); setG(gun, 'portOpen', true);
      B.locked = true; B.chamber = 'empty';
      // (a double feed: the case out, the bolt locked open on the loose round, which is in plain sight now: the
      // stoppage stays, seen (the code review's: the belief said clean while the truth kept the jam))
      if (t('jam') === 'double') B.stoppage = 'double';
      else delete B.stoppage;
      out.text = t('jam') === 'double' ? 'The bolt locked back on the loose round: strip the magazine.' : out.ejected === 'round' ? 'The bolt locked back, the round out.' : 'The bolt locked back.';
      break;
    }
    case 'magOut:drop': case 'magOut:dump': case 'magOut:pouch': case 'magOut:strip':
      // (stripped off a double: its top round went into the action, and the holder saw two there)
      if (action === 'magOut:strip' && B.stoppage === 'double' && typeof B.count === 'number') B.count = Math.max(0, B.count - 1);
      out.magOut = a.to; moveCount(gun, mag, false);
      out.text = { drop: 'The magazine drops.', dump: 'Magazine out, into the dump pouch.', pouch: 'Magazine out, into a pouch.', hand: 'The magazine stripped out, held in the other hand.' }[a.to];
      break;
    case 'magIn': case 'seat': {
      const sp = key === 'seat' ? ctx.held : ctx.spares[0];
      out.magIn = sp.id;
      // (its count and its kind, as the holder believes them, go into the gun with it)
      const n = believedN(sp.mag), kind = believedKind(sp.mag);
      if (n === null) { delete B.count; delete B.countApprox; } else { B.count = n; if (sp.mag.belief?.approx) B.countApprox = true; else delete B.countApprox; }
      if (kind) B.load = kind; else delete B.load;
      delete sp.mag.belief;
      out.text = n === null ? 'A magazine in.' : `A magazine in: ${roundsWord(n)}${n > 0 && kind && kind !== 'ball' ? ` of ${kind}` : ''}.`;
      break;
    }
    case 'reach': {
      const r = ctx.reach, f = feelIn(r.mag), where = placeWord(r.from);
      out.reach = { id: r.id, from: r.from };
      out.feel = f.band;
      out.text = `${where ? `${where}. ` : ''}${FEEL_SAID[f.band]}${f.surprise ? ` You thought ${roundsWord(f.was)}.` : ''}`;
      // (a weight that is not what you believed stops a drill: the next step is yours to choose)
      if (f.surprise) out.halts = true;
      break;
    }
    case 'stowMag': case 'dumpMag': out.stowTo = ctx.to; out.text = key === 'dumpMag' ? 'Into the dump pouch.' : `Back in ${ctx.toWord ?? 'its pouch'}.`; break;
    case 'dropMag': out.dropHeld = true; out.text = 'You let it fall.'; break;
    case 'tap': out.text = 'Tap: the magazine seated.'; break;
    case 'pressCheck':
      if (t('jam') === 'double') { B.stoppage = 'double'; B.chamber = 'case'; out.text = 'It won\'t open: two rounds in the action.'; break; }
      B.chamber = seen(gun);
      out.text = B.chamber === 'live' ? 'Brass in the chamber: one in.' : B.chamber === 'dud' ? 'An orange dummy in the chamber.' : B.chamber === 'case' ? 'A case in the chamber.' : 'The chamber\'s empty.';
      break;
    case 'magCheck': {
      const n = mag.n, F = FAMILIES[mag.fam], exact = n <= WINDOW_EXACT_TO || F?.counter;
      const read = exact ? n : Math.max(0, Math.min(famCap(mag.fam), n + hashInt(3, 'window', gun.mag, n) - 1));
      B.count = read; if (exact) delete B.countApprox; else B.countApprox = true;
      out.text = `${exact ? '' : 'About '}${read} in the magazine.`;
      break;
    }
    case 'functionCheck': {
      out.fired = pull(rng, gun, mag, { model: M, wh });
      if (out.fired.fired) { Object.assign(B, feel(B, out.fired, { wh })); if (!out.fired.stoppage) delete B.stoppage; out.mishap = 'discharge'; out.halts = true; out.text = 'BANG. It was loaded.'; }
      else out.text = out.fired.why === 'safety' ? REFUSALS.safety : 'Click: the hammer falls on an empty chamber.';
      break;
    }
    case 'clearDouble': {
      // (lock, strip the magazine, rack three times, the magazine in, charge: whatever was in the action to the ground)
      const kinds = [];
      if (t('jam') === 'double') kinds.push('round');
      const ch = eject(gun);
      if (ch) kinds.push(ch);
      setG(gun, 'jam', null);
      if (mag && mag.n > 0) feed(gun, mag);
      setG(gun, 'locked', !!mag && !t('chamber') && !!M.holdOpen);
      setG(gun, 'cocked', true); setG(gun, 'portOpen', true);
      out.ejects = kinds; out.ejected = kinds[0] ?? null;
      delete B.stoppage;
      if (t('locked')) { B.locked = true; B.chamber = 'empty'; B.count = 0; delete B.countApprox; }
      else if (gun.mag && before.count !== 0) { delete B.locked; B.chamber = 'live'; if (typeof B.count === 'number') B.count = Math.max(0, B.count - 1); }
      else { delete B.locked; B.chamber = gun.mag ? '?' : 'empty'; }
      out.text = kinds.length ? 'Lock, strip, rack, rack, rack, in, rack: clear.' : 'Lock, strip, rack, rack, rack, in, rack: nothing was stuck.';
      break;
    }
    case 'finger': out.finger = 'off'; out.text = 'Finger off the trigger.'; break;
    default: break;
  }
  if (out.ejected && !out.ejects.length) out.ejects = [out.ejected];
  // (a miss that bites, on a chamber or a magazine action: done, but that part unsure)
  if (bites && roll.grade === 'miss' && UNSURE.has(action)) {
    if (action.startsWith('magOut:')) out.unsureMag = true;
    else B.chamber = '?';
    out.text = action === 'lockBack' ? 'Fumbled the lock: you\'re not sure the round came out.' : action.startsWith('magOut:') ? 'Fumbled the magazine: not sure what\'s left in it.' : 'Fumbled it: you\'re not sure what\'s in the chamber.';
  }
  if (bites) out.halts = true;
  for (const k of ['locked', 'countApprox']) if (!B[k]) delete B[k];
  if (!B.stoppage) delete B.stoppage;
  if (B.count === undefined || B.count === null) delete B.count;
  return out;
}
// (a magazine coming out takes its count belief with it, and its kind; dropped or fumbled, its count is unknown, its kind still known)
function moveCount(gun, mag, lost) {
  const B = beliefRec(gun);
  if (mag) {
    const mb = {};
    if (!lost && typeof B.count === 'number') { mb.n = B.count; if (B.countApprox) mb.approx = true; }
    if (B.load) mb.kind = B.load;
    if (Object.keys(mb).length) mag.belief = mb; else delete mag.belief;
  }
  delete B.count; delete B.countApprox; delete B.load;
}
// (a test's forced grade on a roll: the numbers kept as rolled, the outcome what the test asks)
function forced(roll, grade) {
  if (!grade || !roll) return roll;
  const ok = grade === 'pass' || grade === 'good' || grade === 'superb';
  return { ...roll, grade, ok, routine: false, forced: true, margin: ok ? Math.max(0, roll.margin) : Math.min(roll.margin, { miss: -1, bad: -6, disaster: -10 }[grade]) };
}

// ---- reading the gun ----

/** The weapons condition from the truth (WEAPONS §5.3): 1 a magazine in and a round chambered, 3 a magazine in and an empty chamber, 4 neither; each with the bolt closed and on safe; else null. */
export function conditionOf(gun) {
  if (!gun || gunField(gun, 'jam') || gunField(gun, 'locked') || gunField(gun, 'mode') !== 'safe') return null;
  const ch = gunField(gun, 'chamber');
  if (ch === 'case' || ch === 'dud') return null;
  if (gun.mag && ch === 'live') return 1;
  if (gun.mag && !ch) return 3;
  if (!gun.mag && !ch) return 4;
  return null;
}
/** The condition the holder believes (beliefOf's view): 1, 3, 4, '?' when the chamber is unsure, null when none applies. */
export function conditionOfBelief(b) {
  if (!b) return null;
  if (b.chamber === '?' || b.mag === '?') return '?';
  if (b.stoppage || b.locked || b.mode !== 'safe' || b.chamber === 'case' || b.chamber === 'dud') return null;
  if (b.mag === 'in' && b.chamber === 'live') return 1;
  if (b.mag === 'in' && b.chamber === 'empty') return 3;
  if (b.mag === 'out' && b.chamber === 'empty') return 4;
  return null;
}
/** The gun's state in words, for its holder (WEAPONS §4.2): fine, gritty, fouled, wants cleaning, wants the armourer. */
export function condWord(gun) {
  const c = gun?.cond ?? 0.95, d = gunField(gun, 'dust'), f = gunField(gun, 'foul');
  return c < 0.4 ? 'wants the armourer' : c < COND_SERVICE || d >= 0.4 ? 'wants cleaning' : f >= 0.4 ? 'fouled' : d >= 0.2 ? 'gritty' : 'fine';
}

/**
 * The gun as its holder believes it (the only view the HUD reads): { model, short, chamber, mag
 * ('in' | 'out' | '?'), magFam, count (null: unknown), countApprox, magLoad (the believed kind of the
 * magazine in it, null unknown), mode, locked, port ('open' | 'closed'), stoppage, condWord, cocked, hand
 * (the magazine in the holder's hand as believed: { fam, n, approx, load, feel, cap } or null) }. The
 * magazine in or out, the mode, the port and the hammer are felt under the holder's hand (read from the
 * truth for the gun's own holder, '?' for anyone else's); a held magazine is in the holder's own hand.
 */
export function beliefOf(state, gunId) {
  const g = state.items?.[gunId];
  if (!g || g.type !== 'gun') return null;
  const M = modelOf(g), B = g.belief ?? {}, owner = ownerOf(state, gunId), mine = !!owner, mag = g.mag ? state.items[g.mag] : null;
  const h = owner ? handMagOf(state, owner) : null, hm = h ? state.items[h.id] : null;
  return {
    model: g.model, short: M?.short ?? g.model, chamber: B.chamber ?? '?', mag: mine ? (mag ? 'in' : 'out') : '?', magFam: mine ? mag?.fam ?? null : null,
    count: typeof B.count === 'number' ? B.count : null, countApprox: !!B.countApprox, magLoad: B.load ?? null, mode: mine ? gunField(g, 'mode') : '?', locked: !!B.locked,
    port: gunField(g, 'portOpen') ? 'open' : 'closed', stoppage: B.stoppage ?? null, condWord: condWord(g), cocked: !!gunField(g, 'cocked'),
    hand: hm ? { fam: hm.fam, n: believedN(hm), approx: !!hm.belief?.approx, load: believedKind(hm), feel: hm.belief?.feel ?? null, cap: famCap(hm.fam) } : null,
    // (0.0.7: the turrets and the lever seen as they are; the zero and the dope as believed, never the truth's)
    sight: sightOf(g), optic: opticOf(g), zero: mine ? beliefZero(g) : null, dope: mine ? dopeFrom(g.model, beliefZero(g)) : null,
  };
}

/** The belief in words: 'R-7: one in the chamber, about 3 in the magazine, on safe.' (b: beliefOf's view). */
export function said(b) {
  if (!b) return '';
  const ch = { live: 'one in the chamber', empty: 'nothing in the chamber', '?': 'not sure what\'s in the chamber', dud: 'a dud in the chamber', case: 'a case stuck in the port' }[b.chamber] ?? 'not sure what\'s in the chamber';
  const mag = b.mag === 'out' ? 'no magazine' : b.mag === '?' ? 'a magazine, maybe' : b.count === null ? 'a magazine in, its count unknown' : b.count === 0 ? 'an empty magazine' : `${b.countApprox ? 'about ' : ''}${b.count} in the magazine`;
  const stop = { double: ', a double feed', click: ', it clicked', dead: ', the trigger\'s dead', felt: ', it didn\'t cycle', case: ', a stovepipe' }[b.stoppage] ?? '';
  const mode = b.mode === 'safe' ? ', on safe' : b.mode === '?' ? '' : `, on ${b.mode}`;
  return `${b.short}: ${ch}, ${mag}${b.locked ? ', the bolt locked back' : ''}${stop}${mode}${b.condWord !== 'fine' ? `, and it ${b.condWord}` : ''}.`;
}

/**
 * What the holder can do with the gun, by the belief, in the panel's order (the build sheet's §2.1):
 * slung, up only; a stoppage felt or seen: observe, tap, charge, then clearDouble once a double is
 * seen; then release, charge, lockBack, the magazine out (dump, drop, pouch) or in, the press check
 * (first when the chamber is '?'), the magazine check, the inspection, the function check, the other of
 * safe and semi, the port, the other postures, the finger off, stow. Never selector:auto (the range's
 * panel: the build sheet's §8 item 28).
 */
export function canDo(state, pid, gunId) {
  const g = state.items?.[gunId], kit = state.people?.[pid]?.kit;
  if (!g || !kit) return [];
  const posture = kit.carry?.posture ?? 'slungFront';
  if (SLUNG.has(posture)) return ['up'];
  const b = beliefOf(state, gunId), out = [];
  const fams = modelOf(g)?.fams ?? [];
  const hammerDown = !b.cocked && !!modelOf(g)?.safeNeedsCocked, round = b.chamber === 'live' || b.chamber === 'dud' || b.chamber === 'case';
  if (b.stoppage) { out.push('observe', 'tap', 'charge'); if (b.stoppage === 'double') out.push('clearDouble'); }
  if (b.chamber === '?' && !b.locked) out.push('pressCheck');
  if (!b.stoppage) {
    if (b.locked && b.mag === 'in' && b.count !== 0) out.push('release');
    // (tradecraft's rule, the parity review's: a charge to chamber a round from a magazine believed to hold some,
    // to empty a chamber with no magazine under it, or to cock a hammer that is down; never to throw out a round
    // believed in with a magazine behind it, which sat on the first page at every commence fire)
    if (hammerDown || ((b.chamber === 'empty' || b.chamber === '?') && b.mag === 'in' && b.count !== 0) || (round && b.mag !== 'in')) out.push('charge');
  }
  // (a round seen in the chamber behind a locked bolt: locking it back again takes it out)
  if (!b.locked || round) out.push('lockBack');
  if (b.mag === 'in') {
    if (dumpOf(state, pid)) out.push('magOut:dump');
    out.push('magOut:drop');
    if (pouchFor(state, pid)) out.push('magOut:pouch');
  }
  // (0.0.6: a magazine in the hand, its steps; a hand free, a reach to each place that holds one: see the header)
  if (b.hand) {
    if (b.mag !== 'in') out.push('seat');
    out.push('lookMag');
    for (const p of pouchesOf(state, pid)) if (!p.dump && p.room > 0) out.push(`stowMag@${p.key}`);
    if (dumpOf(state, pid)) out.push('dumpMag');
    out.push('dropMag');
  } else {
    for (const p of pouchesOf(state, pid)) if (p.mags.some(id => fams.includes(state.items[id]?.fam))) out.push(`reach@${p.key}`);
    if (atFeetOf(state, pid).some(l => fams.includes(state.items[l.id]?.fam))) out.push('reach@ground');
  }
  if (!b.locked && b.chamber !== '?') out.push('pressCheck');
  if (b.mag === 'in') out.push('magCheck');
  if (b.locked) out.push('inspect');
  if (b.chamber === 'empty' && !b.locked && b.mode === 'semi' && !b.stoppage) out.push('functionCheck');
  out.push(b.mode === 'safe' ? 'selector:semi' : 'selector:safe');
  if (b.port === 'open') out.push('port');
  for (const p of ['lowReady', 'highReady']) if (posture !== p) out.push(`posture:${p}`);
  if (kit.carry?.finger === 'on') out.push('finger');
  out.push('stow');
  return [...new Set(out)];
}

// ---- the state's way in ----

const actorOf = (state, pid) => state.actors?.list?.find(a => a.who === pid) ?? null;
// (a magazine that hits a hard surface: its lips and spring take MAG_DROP_WEAR; loose regolith takes nothing)
function dropWear(state, magId, g) {
  const m = state.items[magId];
  if (!m || surfaceAt(state, g.x, g.z, g.area) === 'regolith') return;
  m.cond = q(Math.max(0, (m.cond ?? MAG_FRESH) - MAG_DROP_WEAR), 1e-6);
}
const atFeet = (state, pid, gunId) => {
  const a = actorOf(state, pid), area = state.actors?.area ?? state.places?.live?.area;
  if (!a || !area) return null;
  // (at the feet, a little ahead and to the side, by hash: where a magazine lands from the hand)
  const k = hashInt(1000, 'drop', gunId, state.clock.ms) / 1000;
  return { area, x: a.x + 0.25 + 0.2 * k, z: a.z + 0.15 - 0.3 * k };
};

/**
 * Do an action on a gun a person holds (w; the state's way in: the build sheet's §2.1). The roll on
 * the main stream through rollerOf, the truth and the belief by act(), the magazines moved by
 * kit.move, the posture and the finger on kit.carry, the roll logged and told, a discharge graded by
 * carry.js ndOf and told ('nd'). opts: { pid, gunId, action, tempo, pressure ('evaluated': the range),
 * observerId (show), bay (the range's geometry, for ndOf), force, mods, log (false: nothing in J, no roll fact),
 * rng (the stream's name, 'main' by default) }. Returns act()'s result with
 * { nd, observed } and the roll's log seq.
 */
export function doAction(state, bus, { pid, gunId, action, tempo = 'normal', pressure = 'evaluated', observerId = null, bay = null, force = null, mods = null, deferSay = false, log = true, rng = 'main' } = {}) {
  const gun = state.items?.[gunId], kit = state.people?.[pid]?.kit;
  const refuse = (text) => ({ ms: 0, ok: false, refused: true, halts: true, text, roll: null, mishap: null, nd: null, grade: null, routine: false, ejected: null, ejects: [], magId: gun?.mag ?? null });
  if (!gun || gun.type !== 'gun') return refuse('No gun.');
  if (!kit) return refuse('No kit.');
  const M = modelOf(gun), carry = (kit.carry ??= { posture: 'slungFront' }), posture = carry.posture ?? 'slungFront';
  if (SLUNG.has(posture) && action !== 'up' && action !== 'finger') return refuse(`${M.short} is slung.`);
  if (!SLUNG.has(posture) && action === 'up') return refuse(`${M.short} is up already.`);
  const ms = state.clock.ms, roller = rollerOf(state, pid, { ms });
  const observer = observerId ? rollerOf(state, observerId, { ms }) : null;
  const mag = gun.mag ? state.items[gun.mag] : null, key = actionKey(action), place = actionPlace(action), load = meantLoad(state);
  const spares = action === 'magIn' ? sparesOf(state, pid, null, { load }).filter(id => (M.fams ?? []).includes(state.items[id]?.fam)).map(id => ({ id, mag: state.items[id] })) : [];
  // (0.0.6: the magazine in the hand, the one a reach would take, and where a magazine put back goes: see the header)
  const h = handMagOf(state, pid), held = h ? { id: h.id, mag: state.items[h.id], hand: h.hand } : null;
  let reach = null, reachWhy = null, to = null, toWord = null;
  if (key === 'reach' && !held) {
    const pk = pickMag(state, pid, { from: place ?? 'rule', fams: M.fams ?? null, load });
    if (pk) reach = { id: pk.id, mag: state.items[pk.id], from: pk.from };
    else reachWhy = place === 'ground' ? 'No magazine at your feet.' : place ? `No magazine in ${PLACE_WORDS[place] ?? place}.` : 'No magazine left in your pouches.';
  }
  if (key === 'stowMag') { const p = pouchOf(state, pid, place ?? 'p1'); if (p && !p.dump && p.room > 0) { to = p.id; toWord = p.word; } }
  if (key === 'dumpMag') { const d = dumpOf(state, pid); if (d) { to = d; toWord = PLACE_WORDS.dump; } }
  const ctx = { spares, held, reach, reachWhy, to, toWord, pressure, tempo, light: roller.light, observer, observerId, posture, finger: carry.finger ?? 'off', mods: [...(mods ?? [])], force };
  const r = act(rngOf(state, rng), roller, gun, mag, action, ctx);
  r.nd = null;
  if (r.refused) return r;
  // (the magazines, by kit.move: the one writer of a holder)
  if (r.magOut && gun.mag) {
    const magId = gun.mag;
    let to = null;
    if (r.magOut === 'dump') { const c = dumpOf(state, pid) ?? pouchFor(state, pid); if (c) to = { container: c }; }
    else if (r.magOut === 'pouch') { const c = pouchFor(state, pid); if (c) to = { container: c }; }
    else if (r.magOut === 'hand') { const hands = kit.hands ?? [null, null]; const h = !hands[1] ? 1 : !hands[0] ? 0 : null; if (h !== null) to = { pid, hand: h }; }
    if (!to) { const g = atFeet(state, pid, gunId); if (g) to = { ground: g }; }
    if (to) move(state, magId, to); else move(state, magId, { pid, hand: 1 });
    if (to?.ground) dropWear(state, magId, to.ground);
    r.magId = magId;
    if (r.unsureMag) delete state.items[magId].belief;
  }
  if (r.magIn) {
    if (r.dropSpare) { const g = atFeet(state, pid, gunId); move(state, r.magIn, g ? { ground: g } : { pid, hand: 1 }); if (g) dropWear(state, r.magIn, g); }
    else move(state, r.magIn, { gun: gunId });
    r.magId = r.magIn;
  }
  // (the magazine in the hand: reached for into the free hand (the support hand first), picked up off regolith with its
  // dust (WEAPONS §5.5: +0.1); put back or dumped into its pouch; dropped at your feet)
  if (r.reach) {
    const hands = kit.hands ?? [null, null], free = !hands[1] ? 1 : !hands[0] ? 0 : 1, from = holderOf(state, r.reach.id);
    move(state, r.reach.id, { pid, hand: free });
    if (from?.ground && surfaceAt(state, from.ground.x, from.ground.z, from.ground.area) === 'regolith') {
      const m = state.items[r.reach.id];
      m.dust = q(Math.min(1, (m.dust ?? 0) + PICKUP_DUST), 1e-6);
    }
    r.magId = r.reach.id;
  }
  if (held && r.stowTo) { move(state, held.id, { container: r.stowTo }); r.magId = held.id; }
  if (held && r.dropHeld) { const g = atFeet(state, pid, gunId); if (g) { move(state, held.id, { ground: g }); dropWear(state, held.id, g); } r.magId = held.id; }
  if (r.posture) carry.posture = r.posture;
  if (r.finger) { if (r.finger === 'off') delete carry.finger; else carry.finger = r.finger; }
  // (the rolls, logged and told: the holder's in full, the observer's short; a silent failure hidden)
  const area = state.places?.live?.area ?? undefined;
  // (each roll's entry carries what the action did in words (the parity review's: the look's finding, the charge's,
  // a fumble's never reached J), but a silent failure's: hidden, it leaves no trace (SKILLS §5.14))
  // (log false: a gunner's sub-step (gunner.js), its roll kept out of J and the roll fact (the sheet 0.0.7 §8 item 23))
  if (log && r.roll) {
    const e = logEntry(state, bus, { kind: 'roll', tone: r.ok || r.routine || r.silent ? 'note' : 'warn', roll: r.roll, step: key, ...(place ? { place } : {}), gun: gunId, who: pid, area,
      ...(r.text && !r.silent ? { text: r.text } : {}), ...(r.silent ? { hidden: true } : {}), ...(r.found ? { found: true } : {}), ...(action.startsWith('posture:') ? { filter: 'habit' } : {}) });
    r.logSeq = e.seq;
    bus?.emit('roll', { roll: r.roll, who: pid });
  } else if (log && r.text && ((key === 'reach' && (place || r.halts)) || key === 'dropMag')) {
    // (no roll, but what the hand felt is the holder's to read again: J keeps it, and the line says it; a drill's own
    // reach by rule says nothing unless the weight surprised it, its seat's "A magazine in: 5 rounds." saying the rest)
    r.logSeq = logEntry(state, bus, { kind: 'note', tone: r.halts ? 'warn' : 'note', text: r.text, step: key, ...(place ? { place } : {}), gun: gunId, who: pid, area }).seq;
  }
  if (r.observed) {
    const o = state.people?.[observerId], name = o ? `${o.service?.rank ?? ''} ${o.name?.family ?? ''}`.trim() : null;
    logEntry(state, bus, { kind: 'roll', tone: 'note', roll: r.observed.roll, step: 'show', gun: gunId, who: observerId, short: true, area, ...(name ? { name } : {}) });
    bus?.emit('roll', { roll: r.observed.roll, who: observerId });
    // (their word, said and logged as the range's other lines are; deferSay: the caller says it when the look
    // ends (stop motion's sub-step: the coach looks, then speaks), r.say carrying it)
    if (deferSay) r.say = { who: observerId, text: r.observed.said };
    else sayObserved(state, bus, { who: observerId, text: r.observed.said });
  }
  // (a negligent discharge: where it went, graded)
  if (r.fired?.fired && (r.mishap === 'discharge' || action === 'functionCheck')) {
    r.nd = ndOf(state, pid, gunId, bay ? { during: action, bay } : { during: action });
    bus?.emit('nd', { who: pid, gun: gunId, grade: r.nd.grade, into: r.nd.into, nearId: r.nd.nearId, atMs: ms, during: action });
  }
  return r;
}
