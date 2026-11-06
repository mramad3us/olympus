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
// cond, foul, dust, lube, barrelC, rounds (fired, the armourer's book), byId, belief }, saved without
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
// part '?', worse by DROP_BY drops the magazine (a magazine action) or the gun (a long gun swings on
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
// doAction() is the state's way in: the roller (combat/roll.js rollerOf: the skill, the body, the needs,
// the light), the main stream, the spares in reach, the observer; the items moved by kit.move, the
// posture and the finger on kit.carry, the roll logged { kind: 'roll', roll, step, gun } and told
// ('roll'), the observer's look logged short and their word said ('say' kind 'speech': "Clear." or
// "Hold. There's a round in it."), a negligent discharge graded (carry.js ndOf) and told ('nd'), a
// magazine dropped on a hard surface worn MAG_DROP_WEAR (WEAPONS §5.5; loose regolith takes nothing).
// What a step throws out of the port (result.ejected, ejects: 'round' | 'dummy' | 'case') is for the
// caller to store as brass (look.js ejectCase), as resolveShot does a fired case. Positions are metres,
// times game ms; a condition is rounded to 1e-6 before it is saved (core/num.js).
import { q } from '../../core/num.js';
import { hashInt } from '../../core/hash.js';
import { nextId, put } from '../../core/ids.js';
import { rngOf, next, chance } from '../../core/rng.js';
import { logEntry } from '../log.js';
import { check, TEMPO } from '../skills/checks.js';
import { paceOf } from '../skills/skills.js';
import { rollerOf, DARK_BELOW } from '../combat/roll.js';
import { MODELS, FAMILIES, modelOf, isLong, famCap } from './models.js';
import { move, sparesOf, dumpOf, pouchFor, ownerOf, believedN } from './kit.js';
import { ndOf, SLUNG } from './carry.js';
import { surfaceAt } from '../places/model.js';

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
/** The observer's look at UNLOAD, SHOW CLEAR: SHOW_LOOK_S × paceOf(their Awareness), Awareness against SHOW_DC, DARK_DC more in the dark. */
export const SHOW_LOOK_S = 1.0, SHOW_DC = 6, DARK_DC = 4;
/** The count (WEAPONS §4.2): exact at Weapon handling COUNT_EXACT_FROM and up, approximate from COUNT_KEPT_FROM, lost in a burst below; a witness window reads exact to WINDOW_EXACT_TO rounds, ±1 above. */
export const COUNT_EXACT_FROM = 15, COUNT_KEPT_FROM = 8, WINDOW_EXACT_TO = 20;
/** A gun's fields at their defaults: written as absent (TECH §6.6). */
export const GUN_DEFAULTS = Object.freeze({ chamber: null, jam: null, locked: false, mode: 'safe', cocked: true, portOpen: false, set: null, foul: 0, dust: 0, lube: 'wet', rounds: 0 });

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
  tap: A('Tap the magazine', 0.3, 4, { tempo: R, frame: 'magin' }),
  pressCheck: A('Press check', 1.2, 6, { tempo: C, frame: 'check' }),
  magCheck: A('Magazine check', 2.0, 7, { tempo: C, frame: 'magout' }),
  inspect: A('Look in the chamber', 1.0, 6, { tempo: C, frame: 'check', dark: DARK_DC, look: true }),
  observe: A('Look at the port', 0.3, 4, { long: false, paced: false, frame: 'check', dark: DARK_DC, look: true }),
  functionCheck: A('Function check', 0.5, null, { frame: 'aim' }),
  clearDouble: A('Clear the double feed', 5.0, 12, { tempo: C, frame: Object.freeze(['magout', 'charge', 'charge', 'charge', 'magin', 'charge']) }),
  show: A('Show it clear', SHOW_LOOK_S, SHOW_DC, { long: false, frame: 'check', observer: true }),
  finger: A('Finger off', 0, null, { long: false }),
});
/** The actions that move the chamber or a magazine: a miss leaves that part '?' (WEAPONS §5.4). */
const UNSURE = new Set(['charge', 'rack', 'lockBack', 'magOut:drop', 'magOut:dump', 'magOut:pouch', 'magOut:strip', 'inspect', 'clearDouble']);
/** A hand at the trigger or the action: a disaster with the gun ready fires it (tradecraft's list, by OLYMPUS's names). */
export const DISCHARGE_ACTIONS = new Set(['up', 'draw', 'stow', 'selector:safe', 'selector:semi', 'selector:auto', 'pressCheck', 'magIn', 'charge', 'rack', 'release']);
/** A fumble that drops the magazine, not the gun. */
const MAG_ACTIONS = new Set(['magIn', 'magOut:drop', 'magOut:dump', 'magOut:pouch', 'magOut:strip', 'magCheck']);

// ---- the records ----

/** A gun's field, its default when absent. */
export const gunField = (g, k) => (g?.[k] === undefined ? GUN_DEFAULTS[k] : g[k]);
// (write a field, a default as absent)
function setG(g, k, v) { if (v === undefined || v === GUN_DEFAULTS[k] || (v === null && GUN_DEFAULTS[k] === undefined)) delete g[k]; else g[k] = v; }
const BELIEF_DEFAULTS = Object.freeze({ locked: false, stoppage: null, countApprox: false });
function setB(b, k, v) { if (v === undefined || v === null && k === 'count' || v === BELIEF_DEFAULTS[k]) delete b[k]; else b[k] = v; }
const beliefRec = (g) => (g.belief ??= { chamber: 'empty' });

/** A new gun (w): its record in state.items, Condition 4 (no magazine, the chamber empty, the bolt closed and cocked, on safe, the port shut), its holder's belief known. Returns its id. */
export function newGun(state, { model = 'r7', byId = null, cond = 0.93 } = {}) {
  const M = MODELS[model];
  if (!M) throw new Error(`firearms.newGun(): no model '${model}'`);
  const id = nextId(state, 'i'), g = { type: 'gun', model, cond };
  if (M.safety === 'none') g.mode = 'semi';
  if (byId) g.byId = byId;
  g.belief = { chamber: 'empty' };
  put(state, state.items, id, g);
  return id;
}

/** A new box magazine (w) of a family with n rounds of a load; set: the coach's set round { n, kind }; told: the holder knows its count. Returns its id. */
export function newMag(state, { fam = 'had30', n = null, load = 'ball', set = null, told = true } = {}) {
  if (!FAMILIES[fam]) throw new Error(`firearms.newMag(): no family '${fam}'`);
  const id = nextId(state, 'i'), rounds = Math.max(0, Math.min(famCap(fam), n ?? famCap(fam)));
  const m = { type: 'mag', fam, n: rounds, load };
  if (set) m.set = { n: set.n, kind: set.kind };
  if (told) m.belief = { n: rounds };
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
  // (it fires: the round counted, the condition worn, the port cover opens itself)
  setG(gun, 'rounds', gunField(gun, 'rounds') + 1);
  gun.cond = q(Math.max(0, (gun.cond ?? 0.95) - WEAR), 1e-6);
  setG(gun, 'portOpen', true);
  setG(gun, 'set', null);
  const left = !!mag && mag.n > 0;
  if (set === 'stovepipe' || (set === 'double' && !left)) { setG(gun, 'chamber', 'case'); return { fired: true, why: null, stoppage: 'case', set }; }
  if (set === 'double') { mag.n -= 1; setG(gun, 'chamber', 'case'); setG(gun, 'jam', 'double'); return { fired: true, why: null, stoppage: 'double', set }; }
  if (chance(rng, jamP(gun, mag, { wh, M }))) {
    const double = chance(rng, DOUBLE_SHARE) && left;
    setG(gun, 'chamber', 'case');
    if (double) { mag.n -= 1; setG(gun, 'jam', 'double'); }
    return { fired: true, why: null, stoppage: double ? 'double' : 'case' };
  }
  if (left) { feed(gun, mag); return { fired: true, why: null }; }
  setG(gun, 'chamber', null);
  setG(gun, 'locked', !!mag && !!M?.holdOpen);
  return { fired: true, why: null, empty: true, locked: !!mag && !!M?.holdOpen };
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

/** An action's base { s, dc } on a model (up from the back, a pistol's stow, the draw from a holster). */
export function baseOf(M, action, { posture = null } = {}) {
  const a = ACTIONS[action];
  if (!a) return null;
  if (action === 'up' && posture === 'slungBack') return a.fromBack;
  if (action === 'stow' && !isLong(M)) return a.pistol;
  return { s: a.s, dc: a.dc };
}
/** The tempo an action takes when asked for one: rushed only where rushable, careful only where careful, else normal. */
export const tempoFor = (action, tempo = 'normal') => ((tempo === 'rushed' || tempo === 'careful') && ACTIONS[action]?.tempo.includes(tempo) ? tempo : 'normal');
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
  const M = model ?? modelOf(gun), a = ACTIONS[action], base = baseOf(M, action, { posture });
  if (!a || !base) return 0;
  if (a.observer) return SHOW_LOOK_S * paceOf(observer ? observer.value('awareness') : 10);
  const p = a.paced === false ? 1 : pace ?? paceOf(roller.value('weapons'));
  const s0 = base.s * (a.long && isLong(M) ? LONG_K : 1);
  return s0 * (a.thumb ? p * p : p) * timeK(tempoFor(action, tempo));
}

// ---- the pure core: one action ----

const isDark = (ctx, roller) => ctx.dark ?? (roller?.light === 'dark' || (typeof roller?.light === 'number' && roller.light < DARK_BELOW) || (typeof ctx.light === 'number' && ctx.light < DARK_BELOW));
const ejectedOf = (ch, set) => (ch === 'case' ? 'case' : ch === 'dud' || ch === 'live' ? (set === 'dud' ? 'dummy' : 'round') : null);
// (what the chamber shows a look: a round, the orange dummy, a case, nothing)
const seen = (g) => { const ch = gunField(g, 'chamber'); return ch === 'case' ? 'case' : ch === 'dud' && gunField(g, 'set') === 'dud' ? 'dud' : ch ? 'live' : 'empty'; };
// (the chamber's content out of the port: the record cleared, the kind thrown)
function eject(g) {
  const kind = ejectedOf(gunField(g, 'chamber'), gunField(g, 'set'));
  setG(g, 'chamber', null); setG(g, 'set', null);
  return kind;
}

/**
 * Do one action on a gun (the pure core; w the gun, its magazine and the spare going in): one roll,
 * the ladder, the truth and the belief changed. roller: { value, mods, light } (combat/roll.js);
 * mag: the magazine record in the gun (gun.mag's) or null; ctx: { spares: [{ id, mag }] (in reach, the
 * one to go in first), pressure, tempo, light, dark, observer (a roller, for show), posture (the
 * carry's now), finger, mods (the moment's: pressure's stress), pace (an override), model (a fixture),
 * force ({ <action>: grade }: a test's lever, the roll kept and marked forced), wh }.
 * Returns { ms, ok, grade, routine, roll, mishap: null | 'dropMag' | 'dropped' | 'discharge', fired,
 * text, ejected, ejects, magId, magOut: 'drop' | 'dump' | 'pouch' | null, magIn: id | null, posture,
 * finger, halts, silent, refused, observed: { roll, said } }.
 */
export function act(rng, roller, gun, mag, action, ctx = {}) {
  const a = ACTIONS[action], M = ctx.model ?? modelOf(gun);
  if (!a || !M || !gun) return { ms: 0, ok: false, refused: true, halts: true, text: 'Nothing to do that with.' };
  const out = { ms: 0, ok: true, grade: 'pass', routine: false, roll: null, mishap: null, fired: null, text: '', ejected: null, ejects: [], magId: gun.mag ?? null, magOut: null, magIn: null, posture: null, finger: null, halts: false, silent: false, refused: false };
  const refuse = (text) => ({ ...out, ok: false, refused: true, halts: true, text });
  const B = beliefRec(gun), t = (k) => gunField(gun, k);
  // (what can't be tried at all: the hand finds nothing to do it with)
  if (action === 'magIn' && gun.mag) return refuse('There\'s a magazine in.');
  if (action === 'magIn' && !ctx.spares?.length) return refuse('No magazine to put in.');
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
      if (shot && ready(gun) && DISCHARGE_ACTIONS.has(action)) {
        out.mishap = 'discharge';
        out.fired = pull(rng, gun, mag, { model: M, wh });
        out.text = 'Your finger is inside the trigger guard, and it goes off.';
        out.halts = true;
        B.chamber = '?';
        return out;
      }
      if (MAG_ACTIONS.has(action)) {
        out.mishap = 'dropMag';
        out.text = 'The magazine slips out of your fingers and falls.';
        out.halts = true;
        if (action === 'magIn') { out.magIn = ctx.spares[0].id; out.dropSpare = true; return out; }
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
  switch (action) {
    case 'up': out.posture = 'lowReady'; out.text = `${M.short} up, at low ready.`; break;
    case 'draw': out.text = `${M.short} out.`; break;
    case 'stow': out.posture = isLong(M) ? 'slungFront' : null; out.text = `${M.short} slung.`; break;
    case 'posture:lowReady': case 'posture:highReady': out.posture = a.posture; out.text = `${a.label}.`; break;
    case 'selector:safe': case 'selector:semi': case 'selector:auto': {
      const ring = M.ring ?? ['safe', 'semi'];
      if (!ring.includes(a.mode) && M.safety !== 'none') { out.text = `${M.short} has no ${a.mode}.`; out.halts = true; break; }
      const was = t('mode');
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
    case 'magIn': {
      const sp = ctx.spares[0];
      out.magIn = sp.id;
      // (its count, as the holder believes it, goes into the gun with it)
      const n = believedN(sp.mag);
      if (n === null) { delete B.count; delete B.countApprox; } else { B.count = n; if (sp.mag.belief?.approx) B.countApprox = true; else delete B.countApprox; }
      delete sp.mag.belief;
      out.text = n === null ? 'A magazine in.' : `A magazine in: ${n === 0 ? 'empty' : n === 1 ? 'one round' : `${n} rounds`}.`;
      break;
    }
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
// (a magazine coming out takes its count belief with it; dropped or fumbled, it's unknown)
function moveCount(gun, mag, lost) {
  const B = beliefRec(gun);
  if (mag) {
    if (!lost && typeof B.count === 'number') mag.belief = B.countApprox ? { n: B.count, approx: true } : { n: B.count };
    else delete mag.belief;
  }
  delete B.count; delete B.countApprox;
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
 * ('in' | 'out' | '?'), magFam, count (null: unknown), countApprox, mode, locked, port ('open' |
 * 'closed'), stoppage, condWord, cocked }. The magazine in or out, the mode, the port and the hammer
 * are felt under the holder's hand (read from the truth for the gun's own holder, '?' for anyone else's).
 */
export function beliefOf(state, gunId) {
  const g = state.items?.[gunId];
  if (!g || g.type !== 'gun') return null;
  const M = modelOf(g), B = g.belief ?? {}, mine = !!ownerOf(state, gunId), mag = g.mag ? state.items[g.mag] : null;
  return {
    model: g.model, short: M?.short ?? g.model, chamber: B.chamber ?? '?', mag: mine ? (mag ? 'in' : 'out') : '?', magFam: mine ? mag?.fam ?? null : null,
    count: typeof B.count === 'number' ? B.count : null, countApprox: !!B.countApprox, mode: mine ? gunField(g, 'mode') : '?', locked: !!B.locked,
    port: gunField(g, 'portOpen') ? 'open' : 'closed', stoppage: B.stoppage ?? null, condWord: condWord(g), cocked: !!gunField(g, 'cocked'),
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
  const spares = sparesOf(state, pid, null).filter(id => (modelOf(g)?.fams ?? []).includes(state.items[id]?.fam));
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
  } else if (spares.length) out.push('magIn');
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

/** The moment's stress on handling, by the pressure (WEAPONS §5.1: tradecraft's stress(); shot at in the last 5 s, −3). */
export const PRESSURE_MODS = Object.freeze({ fire: Object.freeze([Object.freeze({ why: 'under fire', v: -3, src: 'env' })]) });
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
 * observerId (show), bay (the range's geometry, for ndOf), force, mods }. Returns act()'s result with
 * { nd, observed } and the roll's log seq.
 */
export function doAction(state, bus, { pid, gunId, action, tempo = 'normal', pressure = 'evaluated', observerId = null, bay = null, force = null, mods = null, deferSay = false } = {}) {
  const gun = state.items?.[gunId], kit = state.people?.[pid]?.kit;
  const refuse = (text) => ({ ms: 0, ok: false, refused: true, halts: true, text, roll: null, mishap: null, nd: null, grade: null, routine: false, ejected: null, ejects: [], magId: gun?.mag ?? null });
  if (!gun || gun.type !== 'gun') return refuse('No gun.');
  if (!kit) return refuse('No kit.');
  const M = modelOf(gun), carry = (kit.carry ??= { posture: 'slungFront' }), posture = carry.posture ?? 'slungFront';
  if (SLUNG.has(posture) && action !== 'up' && action !== 'finger') return refuse(`${M.short} is slung.`);
  if (!SLUNG.has(posture) && action === 'up') return refuse(`${M.short} is up already.`);
  const ms = state.clock.ms, roller = rollerOf(state, pid, { ms });
  const observer = observerId ? rollerOf(state, observerId, { ms }) : null;
  const mag = gun.mag ? state.items[gun.mag] : null;
  const spares = action === 'magIn' ? sparesOf(state, pid, null).filter(id => (M.fams ?? []).includes(state.items[id]?.fam)).map(id => ({ id, mag: state.items[id] })) : [];
  const ctx = { spares, pressure, tempo, light: roller.light, observer, observerId, posture, finger: carry.finger ?? 'off', mods: [...(PRESSURE_MODS[pressure] ?? []), ...(mods ?? [])], force };
  const r = act(rngOf(state, 'main'), roller, gun, mag, action, ctx);
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
  if (r.posture) carry.posture = r.posture;
  if (r.finger) { if (r.finger === 'off') delete carry.finger; else carry.finger = r.finger; }
  // (the rolls, logged and told: the holder's in full, the observer's short; a silent failure hidden)
  const area = state.places?.live?.area ?? undefined;
  // (each roll's entry carries what the action did in words (the parity review's: the look's finding, the charge's,
  // a fumble's never reached J), but a silent failure's: hidden, it leaves no trace (SKILLS §5.14))
  if (r.roll) {
    const e = logEntry(state, bus, { kind: 'roll', tone: r.ok || r.routine || r.silent ? 'note' : 'warn', roll: r.roll, step: action, gun: gunId, who: pid, area,
      ...(r.text && !r.silent ? { text: r.text } : {}), ...(r.silent ? { hidden: true } : {}), ...(r.found ? { found: true } : {}), ...(action.startsWith('posture:') ? { filter: 'habit' } : {}) });
    r.logSeq = e.seq;
    bus?.emit('roll', { roll: r.roll, who: pid });
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
