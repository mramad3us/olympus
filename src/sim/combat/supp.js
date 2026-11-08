// OLYMPUS sim: suppression and hardening, the chaos arriving at a body pooled and the hardening that keeps it from the hands (COMBAT §5, §11.4, §25.18; SKILLS §6.8; BODY §9.3, §17.3; the build sheet 0.0.9 §2.1, §3, §4, §8).
//
// The user's rule (2026-11-07, DESIGN.md's log): "suppression should be a roll modifier that picks up on those
// factors, with "hardening" ... being an offset to it"; "Tier one operator would have such hardening, that having
// three flashbangs go off right next to him would barely affect his ability to operate his weapon, where a recruit
// would likely be so supressed that they would be even likely to fail simple actions like thumbing safety off or
// reloading". This module is the one home of that model (tests/syntax.test.mjs SUPP_HOME: no other module of the sim
// defines a SUPP_, HARD_, STARTLE_, INOC_, FLASH_, DEAF_ or NERVE_ name, react.js's take-in SUPP_MS excepted).
//
// The pool (COMBAT §5.1, §5.2) is per actor, 0 to SUPP_MAX 120 points, on the live actor's combat block (actor.combat,
// created by the first input above SUPP_MIN_PTS, absent otherwise, so a calm game never carries one). Each input pools
// with saturation, supp ← supp + pts × k × (1 − supp / SUPP_MAX), where pts is inputPts's table (a round cracking past
// the head, a friend's muzzle, a kicked door, a blast, a flashbang, being hit) and k its physics (kOf: readiness on
// bangs and blasts, ear protection on what is sound-borne, vacuum, blanks). No skill scales an input: two men in the
// same place take the same chaos. The pool falls SUPP_DECAY points a second after SUPP_GRACE_MS with no input, kept as
// { supp, suppAtMs, suppRate } and read in closed form (suppAt), so a lived run and a skip land on the same number.
//
// Hardening (COMBAT §5.6; SKILLS §6.8) is the offset, derived and never stored: experience round(WF × HARD_K[class])
// plus the inoculation counter (person.skills.inoc.pts, else INOC_OF_TIER by the rank's tier) plus HARD_AXIS_PTS a
// step of the nerve axis (PEOPLE §3.6), less the body's toll (exhausted, frayed, morale very low, bad pain, shock; at
// most HARD_TOLL_MAX). What reaches the hands is felt = clamp(round(min(SUPP_MAX, pool) − H), 0, 100), 0 at once with
// no block or an empty pool (hardening is then never computed: a calm scene costs nothing). Felt names a band (calm,
// under fire, suppressed, pinned) and is the roller's one entry (suppMod: −1 a SUPP_MOD_PER 10 felt on hands-and-eyes
// rolls, half on head-and-voice, at most −SUPP_MOD_MAX 10), a time factor on handling and the aim (suppTimeK: 1 +
// felt / SUPP_TIME_PTS 200, exactly 1 at felt 0) and the take-in's band (react.js's SUPP_MS 200 ms a band).
//
// The startle (COMBAT §5.7): an input that raises felt by STARTLE_FROM 10 or more at once, unless it was prepared,
// freezes the body for ticks(U(STARTLE_MIN_MS, STARTLE_MAX_MS) × (1 − H / 100)² × STARTLE_REPEAT_K ^ n × (forewarned ?
// STARTLE_FOREWARNED_K : 1)), n the bangs and blasts before it within STARTLE_REPEAT_MS of each other, its draw on
// stream(seed, 'combat:startle', pid, inputId). A startle inside a startle runs to the later end, and one within
// STARTLE_JOIN_MS of the last one's end joins its freeze (FROZE: the frozen time in all, startleMs). While it lasts the
// keys are not the marine's (contact.js refusesAct and feetOf, as in the take-in's window), a command on the player
// halts at its sub-step's end, no sighting is taken in until it ends, and a stop-motion hold with nothing running is
// let go so time runs (suppInput, the people domain's fast 'input', before the contact's); at its end the 'startle'
// fact 'end' carries the whole freeze (FROZE), the log says it, and in stop motion with nothing running time stands
// still again.
//
// The air (ROADMAP "anywhere"; COMBAT §11.4, BODY §17.3): every input is scaled by the live place's air (kOf reads
// env.js airAt unless the input says): in vacuum the sound-borne inputs (the bang's blast, a muzzle beside you, the din)
// pool VACUUM_K.bang 0 and a round VACUUM_K.round, and a bang deafens no one: its flash is all that reaches you. At Melas
// nothing changes (its air is never vacuum).
// The bang's physics (COMBAT §11.4; BODY §17.3): bang() writes the chaos into everyone on the live area within reach
// (the thrower's own and a called bang prepared), the flash by the angle between the facing and the burst (under
// FLASH_CONE_DEG blind for FLASH_BLIND_MS, to FLASH_DAZZLE_DEG dazzled for FLASH_DAZZLE_MS; a filtered visor none) and
// the deafness of an unprotected ear within DEAF_REACH_M (U(DEAF_MIN_MS, DEAF_MAX_MS) on stream(seed, 'combat:deaf',
// pid, id); hearing × DEAF_K, a voice heard within DEAF_VOICE_M). Hardening touches none of the physics. Protection
// is read from the worn kit (protOf: ear defenders in the ears slot or on the head; the combat EVA suit's filtered
// visor and sound filtering when it is worn kit, the user's overrule of question 6, 2026-11-07: none on the range in
// utilities). nerveCheck (the NPC's choice and the exposing step, COMBAT §5.3, §7.11) and noteExposure (the
// inoculation counter, SKILLS §6.8) are built and tested, called by nothing this round.
//
// suppNow(state, pid, ms) is the HUD's view and suppWords the one formatter of the sum ("the chaos 105 − your hardening
// 17 = felt 88: pinned, −9"): the roll's hover, J and the card read it, so the quantity reads one way on every screen.
//
// 0.0.10, "Bang" (the build sheet 0.0.10 §2.1, §8 items 4 to 8, 11 to 14, 19, 20; COMBAT §5.1 to §5.3; BODY §9.3): the
// inputs v0.0.9 built pure are posted. shotNoise is a shot's report at its muzzle: 'muzzle' to everyone but the shooter
// within MUZZLE_M, indoors 'roomShot' to the rest of the room (FLASH_REACH_M until PLACES gives rooms); a blank's report is
// a muzzle blast like any (BLANKS_K is the harness's near-miss tone in place of a crack, never a blank's report). dinOf is
// the din (an air horn, an alarm, shouting) a whole second at a time to everyone within DIN_M. Called this round by the
// stress course's coach alone: the player's own rounds post nothing (own: 0). A block is made only by an input of
// SUPP_MIN_PTS or more; once one is there every input above 0 pools, so the din in ear defenders (0.3 a second) adds to
// a pool the blanks began and never makes one by itself. A bang may carry the thrower's "Bang!" (call { x, z, atMs }): a
// person who heard it (hearsVoice at its time) within CALL_HEARD_MS before the burst is forewarned (×0.6, the startle
// ×0.5), a called bang stays prepared.
// Breathe (COMBAT §5.2) is a step of BREATHE_MS in four sub-steps (shooting.js), offered from felt BREATHE_FROM with no
// window open and not startled (breatheOffer, up when a threat of the string stands facing); while it runs the pool falls
// BREATHE_K times as fast, kept as the window { breatheFromMs, breatheUntilMs } on the block and read by suppAt in the
// closed form (the decay × BREATHE_K over the window's part past the grace), so it is never a free reset: 4 s of your
// time for 8 points exposed. A second Breathe since the last input folds the first one's drain into supp first. Its
// shed (breatheShedPts while it runs, null once its end is written) is the pool under the same run without it: an input
// landing in the window keeps the gap so far, × (1 − pts / SUPP_MAX), as the saturating add narrows it.
// The stress (BODY §9.3): SUPP_STRESS_PER_S a second by felt's band (0.3 suppressed, 0.6 pinned), integrated in closed form
// over the pool's linear pieces (stressGainOf: the bands' crossing times solved, exact) and folded into the body through
// BODY's own door (body/stress.js addStress) before every input written, at a startle's end, and every
// SUPP_STRESS_FOLD_MS of the game clock while the pool is up (suppSecond, the people domain's 'second'; lived ticks, so a
// skip folds once at its end, the same total). stressAtMs keeps the last fold. The body's stress feeds back through the
// toll (frayed, 75, takes HARD_TOLL.frayed off hardening), as built.
// Pure but addSupp, bang, shotNoise, dinOf, breatheStart, breatheEnd, foldStress, suppSecond, noteExposure and
// suppInput, which write the block, the body's stress, the sheet's counter, the clock's hold and the log.
import { stream, next } from '../../core/rng.js';
import { q } from '../../core/num.js';
import { SOL_MS, holdTime, releaseTime, isHeld } from '../../core/clock.js';
import { playerActor, playerId } from '../../core/ids.js';
import { check, oddsOf } from '../skills/checks.js';
import { airAt } from '../places/env.js';
import { sheetOf, tierOfRank } from '../skills/templates.js';
import { bodyMods, needMods } from '../body/mods.js';
import { addStress } from '../body/stress.js';
import { headOf, wrap, SEEN } from '../people/perception.js';
import { contactOf } from '../people/mind.js';
import { turnersOf, facingOf } from '../arms/turners.js';
import { logEntry } from '../log.js';
import { ticks } from './react.js';

// ---- the pool (COMBAT §5.1, §5.2) ----

/** The pool's ceiling, the grace before it falls, its fall a second by where you are (exposed this round), the least input that makes a block. */
export const SUPP_MAX = 120, SUPP_GRACE_MS = 1500, SUPP_MIN_PTS = 1;
export const SUPP_DECAY = Object.freeze({ cover: 4, exposed: 2, down: 6 });
/** Breathe (COMBAT §5.2): its time in four sub-steps (in, hold, out, hold), the decay's factor while it runs, the felt it is offered from. */
export const BREATHE_MS = 4000, BREATHE_SUB_MS = 1000, BREATHE_K = 2, BREATHE_FROM = 20;
/** A thrower's "Bang!" heard this long before the burst forewarns; the din's reach (COMBAT §5.1). */
export const CALL_HEARD_MS = 3000, DIN_M = 10;
/** BODY §9.3: the body's stress a second by felt's band, folded at least every SUPP_STRESS_FOLD_MS of the game clock while the pool is up. */
export const SUPP_STRESS_PER_S = Object.freeze({ calm: 0, 'under fire': 0, suppressed: 0.3, pinned: 0.6 });
export const SUPP_STRESS_FOLD_MS = 5000;
/** A round past the head: full within FULL_M, linear to 0 at its zero (COMBAT §5.1). */
export const FULL_M = 1, CRACK_PTS = 8, CRACK_HEAVY_PTS = 11, CRACK_ZERO_M = 5, SUBSONIC_PTS = 5, SUBSONIC_ZERO_M = 3;
/** An impact you see or hear within IMPACT_M; a shot fired by someone else within MUZZLE_M of your head; a shot in your room. */
export const IMPACT_PTS = 4, IMPACT_M = 2, MUZZLE_M = 1.5;
export const MUZZLE_PTS = Object.freeze({ indoor: 4, open: 2 }), ROOM_SHOT_PTS = Object.freeze({ indoor: 1, open: 0 });
/** A door kicked within KICK_M; the din a second; a blast outside your room min(BLAST_PTS, BLAST_PTS × (BLAST_REF_M / r)²). */
export const KICK_PTS = 6, KICK_M = 5, DIN_PTS_S = 0.5, BLAST_PTS = 60, BLAST_REF_M = 5;
/** A flashbang: FLASH_PTS in its room, FLASH_NEXT_PTS in the next through an open doorway, in the open × min(1, (FLASH_REF_M / r)²). */
export const FLASH_PTS = 60, FLASH_NEXT_PTS = 20, FLASH_REF_M = 5;
/** You are hit; a friend hit within FRIEND_HIT_M. */
export const HIT_PTS = 25, FRIEND_HIT_PTS = 10, FRIEND_HIT_M = 10;
/** Readiness on bangs and blasts (COMBAT §5.1's multipliers). */
export const PREP_K = Object.freeze({ prepared: 0.25, forewarned: 0.6, unprepared: 1 });
/** Ear protection on every sound-borne input (never a round's crack); vacuum; training blanks. */
export const EARPRO_K = 0.6, BLANKS_K = 0.5;
export const VACUUM_K = Object.freeze({ round: 0.4, bang: 0 });
/** The inputs that are not sound-borne: what a round, an impact or a hit tells you is its meaning, not its loudness. */
const NOT_SOUND = Object.freeze(new Set(['crack', 'subsonic', 'impact', 'hit', 'friendHit', 'own']));
/** The inputs readiness scales (bangs and blasts), and those that count as repeats for the startle. */
const PREPPED = Object.freeze(new Set(['flash', 'blast']));
/** The rounds (vacuum's ×0.4: what you see land). */
const ROUNDS = Object.freeze(new Set(['crack', 'subsonic', 'impact']));
/** What each input is, in the log's words. */
export const INPUT_WORDS = Object.freeze({ crack: 'a round past your head', subsonic: 'a round past your head', impact: 'a round striking close', muzzle: 'a shot beside your ear',
  roomShot: 'shots in the room', kick: 'a door kicked in', din: 'the din', blast: 'the blast', flash: 'the bang', hit: 'the hit', friendHit: 'a friend hit', own: 'your own fire' });

// ---- felt, the bands, the modifier (COMBAT §5.3) ----

/** The bands' floors in felt, calmest first. */
export const BANDS = Object.freeze([Object.freeze(['calm', 0]), Object.freeze(['under fire', 20]), Object.freeze(['suppressed', 45]), Object.freeze(['pinned', 70])]);
/** The modifier's word by band (the calm band's, my call: the tier one's −1 at felt 10 needs a name). */
export const SUPP_WORDS = Object.freeze({ calm: 'the noise', 'under fire': 'under fire', suppressed: 'suppressed', pinned: 'pinned' });
/** −1 a SUPP_MOD_PER felt, at most SUPP_MOD_MAX; the time × (1 + felt / SUPP_TIME_PTS); a row under SHAKING_ODDS cut by the chaos is marked. */
export const SUPP_MOD_PER = 10, SUPP_MOD_MAX = 10, SUPP_TIME_PTS = 200, SHAKING_ODDS = 0.70;
/** The modifier's weight by skill: the hands and the eyes 1, the head and the voice 0.5, the trained body 0. */
export const SUPP_K = Object.freeze({ marksmanship: 1, weapons: 1, cqc: 1, medicine: 1, demolitions: 1, tech: 1, eva: 1, zerog: 1, driving: 1,
  awareness: 0.5, fieldcraft: 0.5, tactics: 0.5, leadership: 0.5, comms: 0.5, social: 0.5, fitness: 0 });

// ---- the nerve check (COMBAT §5.3, §7.11; SKILLS §2.2) ----

/** DC NERVE_DC0 + round(felt / NERVE_PER), asked from NERVE_FROM; a leader's call +NERVE_HELP. */
export const NERVE_DC0 = 1, NERVE_PER = 5, NERVE_FROM = 45, NERVE_HELP = 2;
/** Nerve = round(WF × NERVE_K[class]) (SKILLS §2.2's, not yet built elsewhere: a third of HARD_K). */
export const NERVE_K = Object.freeze({ soldier: 0.25, cop: 0.2, criminal: 0.2, spook: 0.2, spacer: 0.12, civilian: 0 });

// ---- hardening (COMBAT §5.6; SKILLS §6.8) ----

/** Experience: round(WF × HARD_K[class]) (3 × NERVE_K). */
export const HARD_K = Object.freeze({ soldier: 0.75, cop: 0.6, criminal: 0.6, spook: 0.6, spacer: 0.36, civilian: 0 });
export const HARD_AXIS_PTS = 3, HARD_MAX = 100;
/** The body's toll (BODY §9.3), at most HARD_TOLL_MAX together; the load, the stress load and concussion read 0 until they exist. */
export const HARD_TOLL = Object.freeze({ exhausted: 10, frayed: 5, load: 10, morale: 5, concussed: 5, pain: 5, shock: 10 });
export const HARD_TOLL_MAX = 25;
/** Hardening in words (the user's answer to question 16: "shown in words from green to unshakeable"), each word's floor. */
export const HARD_WORDS = Object.freeze([Object.freeze(['green', 0]), Object.freeze(['settled', 20]), Object.freeze(['steady', 40]), Object.freeze(['hardened', 60]), Object.freeze(['unshakeable', 80])]);
/** The inoculation counter: at most INOC_MAX; an exposure counts from felt INOC_FELT, at most INOC_PER_SOL a sol, up to its teacher's cap. */
export const INOC_MAX = 25, INOC_FELT = 20, INOC_PER_SOL = 4;
export const INOC_CAP = Object.freeze({ boot: 6, unit: 10, cadre: 15, school: 20, itc: 25 });
/** The teachers, the lowest first, and their words (C's "as far as unit training goes"). */
export const INOC_TEACHERS = Object.freeze(['boot', 'unit', 'cadre', 'school', 'itc']);
export const INOC_TEACHER_WORDS = Object.freeze({ boot: 'boot camp', unit: 'unit training', cadre: 'the cadre course', school: 'the school', itc: 'the ITC' });
/** An absent counter reads its rank's tier's (SKILLS §11.1's tiers; the test sheets write their own). */
export const INOC_OF_TIER = Object.freeze({ recruit: 2, private: 6, lt: 6, lcpl: 8, cpl: 10, sgt: 12, ssgt: 14, gysgt: 14, recon: 18, raider: 22, tierone: 25 });

// ---- the startle (COMBAT §5.7) ----

export const STARTLE_FROM = 10, STARTLE_MIN_MS = 1500, STARTLE_MAX_MS = 3000, STARTLE_REPEAT_K = 0.5, STARTLE_REPEAT_MS = 10_000, STARTLE_FOREWARNED_K = 0.5;
/** A startle within this of the last one's end joins its freeze: FROZE adds them up (my call: startles a second or less apart read as one freeze). */
export const STARTLE_JOIN_MS = 1000;

// ---- the flash and the deafness (COMBAT §11.4; BODY §17.3) ----

/** Blind under FLASH_CONE_DEG off the facing, dazzled to FLASH_DAZZLE_DEG; how long; the eyes' roll while dazzled; the reach in the open. */
export const FLASH_CONE_DEG = 60, FLASH_DAZZLE_DEG = 120, FLASH_BLIND_MS = 5000, FLASH_DAZZLE_MS = 2000, DAZZLE_SIGHT = -3, FLASH_REACH_M = 10;
/** Deafened: hearing × DEAF_K for U(DEAF_MIN_MS, DEAF_MAX_MS); a voice within DEAF_VOICE_M still heard; the reach of an unprotected ear in the open. */
export const DEAF_K = 0.1, DEAF_MIN_MS = 3_600_000, DEAF_MAX_MS = 21_600_000, DEAF_VOICE_M = 2, DEAF_REACH_M = 5;

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const r2 = (x) => q(x, 0.01);
const D2R = Math.PI / 180;

// ---- the block ----

/** The live actor of a person: the player's, else one of the live area's. */
function actorOf(state, pid) {
  const me = playerActor(state);
  if (me && me.who === pid) return me;
  return state.actors?.list?.find(a => a.who === pid) ?? null;
}
/** A person's combat block on the live actor, or null (none until a first input). */
export function blockOf(state, pid) { return actorOf(state, pid)?.combat ?? null; }

// (a record as if no Breathe had run, and whether one is running: its window open and its end not yet written)
const plainOf = (rec) => ({ ...rec, breatheFromMs: null, breatheUntilMs: null });
const running = (rec) => Number.isFinite(rec.breatheFromMs) && rec.breatheShedPts !== null;
// (the length of [a0, a1] ∩ [b0, b1], ms; 0 with no window)
const overlapMs = (a0, a1, b0, b1) => (Number.isFinite(b0) && Number.isFinite(b1) ? Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)) : 0);
// (the decay's ms at ms, Breathe's window counted BREATHE_K times: dec(ms) + (BREATHE_K − 1) × its overlap with [d0, ms])
function drainMs(rec, ms) {
  const dec = Math.max(0, ms - (rec.suppAtMs ?? ms) - SUPP_GRACE_MS);
  if (!Number.isFinite(rec.breatheFromMs)) return dec;
  const d0 = (rec.suppAtMs ?? ms) + SUPP_GRACE_MS;
  return dec + (BREATHE_K - 1) * overlapMs(d0, ms, rec.breatheFromMs, rec.breatheUntilMs);
}
/** The pool at ms in closed form (see the header): max(0, supp − rate × drain / 1000), Breathe's window draining BREATHE_K times as fast. */
export function suppAt(rec, ms) {
  if (!rec || !rec.supp) return 0;
  return Math.max(0, rec.supp - (rec.suppRate ?? SUPP_DECAY.exposed) * drainMs(rec, ms) / 1000);
}
/** The pool after an input of pts (already × k), saturating at SUPP_MAX. */
export const poolAdd = (s0, pts) => Math.min(SUPP_MAX, s0 + pts * (1 - s0 / SUPP_MAX));

/**
 * An input's points (COMBAT §5.1's table; pure): kind 'crack' | 'subsonic' | 'impact' | 'muzzle' | 'roomShot' | 'kick' | 'din' |
 * 'blast' | 'flash' | 'hit' | 'friendHit' | 'own'; rM the distance (m) from the head; indoor; heavy (a heavy calibre's crack);
 * next (a flashbang in the next room); s (the din's seconds).
 */
export function inputPts(kind, { rM = 0, indoor = false, heavy = false, next: nextRoom = false, s = 1 } = {}) {
  const r = Math.max(0, rM ?? 0);
  const ramp = (full, zero) => (r <= full ? 1 : r >= zero ? 0 : (zero - r) / (zero - full));
  switch (kind) {
    case 'crack': return (heavy ? CRACK_HEAVY_PTS : CRACK_PTS) * ramp(FULL_M, CRACK_ZERO_M);
    case 'subsonic': return SUBSONIC_PTS * ramp(FULL_M, SUBSONIC_ZERO_M);
    case 'impact': return r <= IMPACT_M ? IMPACT_PTS : 0;
    case 'muzzle': return r <= MUZZLE_M ? MUZZLE_PTS[indoor ? 'indoor' : 'open'] : 0;
    case 'roomShot': return ROOM_SHOT_PTS[indoor ? 'indoor' : 'open'];
    case 'kick': return r <= KICK_M ? KICK_PTS : 0;
    case 'din': return DIN_PTS_S * Math.max(0, s);
    case 'blast': return r <= 0 ? BLAST_PTS : Math.min(BLAST_PTS, BLAST_PTS * (BLAST_REF_M / r) ** 2);
    case 'flash': return indoor ? (nextRoom ? FLASH_NEXT_PTS : FLASH_PTS) : r <= 0 ? FLASH_PTS : FLASH_PTS * Math.min(1, (FLASH_REF_M / r) ** 2);
    case 'hit': return HIT_PTS;
    case 'friendHit': return r <= FRIEND_HIT_M ? FRIEND_HIT_PTS : 0;
    default: return 0;
  }
}

/** Whether an input is sound-borne (ear protection and vacuum scale it): every one but a round's crack, an impact and a hit. */
export const soundBorne = (input) => input?.sound !== false && !NOT_SOUND.has(input?.kind);

/**
 * An input's multiplier on plain terms (pure; COMBAT §5.1): PREP_K on bangs and blasts × EARPRO_K on the sound-borne with
 * ears protected × vacuum (a round ×0.4, the sound-borne 0) × BLANKS_K.
 */
export function inputK({ kind, prep = 'unprepared', sound = true, ears = 'none', vacuum = false, blanks = false } = {}) {
  const input = { kind, sound };
  let k = PREPPED.has(kind) ? PREP_K[prep] ?? 1 : 1;
  if (soundBorne(input) && ears && ears !== 'none') k *= EARPRO_K;
  if (vacuum) k *= ROUNDS.has(kind) ? VACUUM_K.round : soundBorne(input) ? VACUUM_K.bang : 1;
  if (blanks) k *= BLANKS_K;
  return k;
}

/**
 * What a person wears against the chaos, from the worn kit (pure): { visor, ears: 'none' | 'defenders' | 'suit' }. Ear
 * defenders in their own slot or on the head; a suit with sound filtering (type 'suit', the combat EVA suit: not issued
 * yet); a filtered visor (an item with visor true). Utilities have none.
 */
export function protOf(state, pid) {
  const worn = state.people?.[pid]?.kit?.worn ?? {};
  let ears = 'none', visor = false;
  for (const id of Object.values(worn)) {
    const it = state.items?.[id];
    if (!it) continue;
    if (it.type === 'suit') { ears = 'suit'; if (it.visor !== false) visor = true; }
    else if (it.type === 'ears' && ears === 'none') ears = 'defenders';
    if (it.visor === true) visor = true;
  }
  return { visor, ears };
}

/** An input's multiplier for a person (see inputK): their worn protection read from the kit; vacuum the input's, else the live place's air (env.js airAt). */
export function kOf(state, pid, input) {
  const vacuum = input?.vacuum ?? vacuumHere(state);
  return inputK({ kind: input?.kind, prep: input?.prep ?? 'unprepared', sound: input?.sound !== false, ears: protOf(state, pid).ears, vacuum: !!vacuum, blanks: !!input?.blanks });
}
// (whether the live place has no air: every noise input and the bang's deafness read it, so a bang in vacuum is its flash
// alone. The listener and the source stand in the one live area, so one air serves both)
const vacuumHere = (state) => airAt(state).vacuum;

// ---- hardening ----

/** Hardening on plain terms (pure): clamp(round(WF × HARD_K[cls]) + inoc + HARD_AXIS_PTS × axis − min(HARD_TOLL_MAX, toll), 0, HARD_MAX). */
export function hardFrom({ wf = 0, cls = 'soldier', inoc = 0, axis = 0, toll = 0 }) {
  return clamp(Math.round((wf ?? 0) * (HARD_K[cls] ?? 0)) + (inoc ?? 0) + HARD_AXIS_PTS * (axis ?? 0) - Math.min(HARD_TOLL_MAX, toll ?? 0), 0, HARD_MAX);
}

/** The toll BODY takes at ms (see the header): [{ why, v }], each cause once. */
function tollOf(state, pid, ms) {
  const out = [], seen = new Set();
  const add = (key, why) => { if (!seen.has(key)) { seen.add(key); out.push({ why, v: HARD_TOLL[key] }); } };
  for (const m of needMods(state, pid, 'all', { ms })) {
    if (m.src === 'need:fatigue' && m.why === 'exhausted') add('exhausted', 'exhausted');
    else if (m.src === 'need:stress' && String(m.why).startsWith('frayed')) add('frayed', 'frayed');
    else if (m.src === 'need:morale' && m.why === 'morale very low') add('morale', 'morale very low');
  }
  for (const m of bodyMods(state, pid, 'all', { ms })) {
    if (m.src === 'body:pain' && m.v <= -2) add('pain', m.why);
    else if (m.src === 'body:blood' && m.v <= -3) add('shock', 'in shock');
  }
  return out;
}

/** The inoculation's points of a sheet: its written counter, else its rank's tier's. */
function inocPts(state, pid) {
  const p = state.people?.[pid], sheet = sheetOf(state, pid);
  const w = sheet?.inoc?.pts;
  if (Number.isFinite(w)) return w;
  return INOC_OF_TIER[tierOfRank(p?.service?.rank)] ?? INOC_OF_TIER.private;
}

/** Hardening's parts for a person at ms (see the header): { exp, inoc, axis, toll: [{ why, v }], H }. */
export function hardParts(state, pid, ms = state.clock.ms) {
  const p = state.people?.[pid], sheet = sheetOf(state, pid);
  const cls = sheet?.cls ?? 'soldier', wf = sheet?.os ?? 0;
  const exp = Math.round(wf * (HARD_K[cls] ?? 0)), inoc = inocPts(state, pid), axis = HARD_AXIS_PTS * (p?.traits?.nerve ?? 0);
  const toll = tollOf(state, pid, ms), tsum = Math.min(HARD_TOLL_MAX, toll.reduce((a, t) => a + t.v, 0));
  return { exp, inoc, axis, toll, H: clamp(exp + inoc + axis - tsum, 0, HARD_MAX) };
}
/** Hardening, 0 to HARD_MAX. */
export const hardOf = (state, pid, ms = state.clock.ms) => hardParts(state, pid, ms).H;
/** Hardening in words. */
export function hardWord(H) {
  let w = HARD_WORDS[0][0];
  for (const [word, from] of HARD_WORDS) if ((H ?? 0) >= from) w = word;
  return w;
}

/** The teacher who could take a counter further: the lowest whose cap is over its points, else the last. */
const teacherFor = (pts) => INOC_TEACHERS.find(t => INOC_CAP[t] > pts) ?? INOC_TEACHERS.at(-1);
/** The inoculation counter (C's row): { pts, cap, teacher, fixed, words } ("inoculation 6 of 10: as far as unit training goes"). */
export function inocOf(state, pid) {
  const sheet = sheetOf(state, pid), pts = inocPts(state, pid), teacher = teacherFor(pts), cap = INOC_CAP[teacher];
  return { pts, cap, teacher, fixed: !!sheet?.inoc?.fixed, words: `inoculation ${pts} of ${cap}: as far as ${INOC_TEACHER_WORDS[teacher]} goes` };
}

// ---- felt ----

/** Felt from a pool and a hardening (pure). */
export const feltFrom = (pool, H) => clamp(Math.round(Math.min(SUPP_MAX, pool) - H), 0, 100);
/** What reaches the hands at ms (see the header): 0 with no block or an empty pool, hardening not computed. */
export function feltOf(state, pid, ms = state.clock.ms) {
  const rec = blockOf(state, pid), pool = suppAt(rec, ms);
  if (!(pool > 0)) return 0;
  return feltFrom(pool, hardOf(state, pid, ms));
}
/** Felt's band index, 0 calm to 3 pinned. */
export function bandN(felt) {
  let n = 0;
  for (let i = 0; i < BANDS.length; i++) if ((felt ?? 0) >= BANDS[i][1]) n = i;
  return n;
}
/** Felt's band in words. */
export const bandOf = (felt) => BANDS[bandN(felt)][0];
/** The roller's one entry (see the header), or null at 0. */
export function suppMod(felt, skill) {
  const K = SUPP_K[skill] ?? 0, v = -Math.min(SUPP_MOD_MAX, Math.round(((felt ?? 0) * K) / SUPP_MOD_PER));
  if (!v) return null;
  return { why: SUPP_WORDS[bandOf(felt)], v, src: 'env', felt };
}
/** The hands' and the aim's time factor: exactly 1 at felt 0. */
export const suppTimeK = (felt) => (felt > 0 ? 1 + felt / SUPP_TIME_PTS : 1);

// ---- the startle ----

/** The startle's length on plain terms (pure): u the draw in [0, 1). */
export function startleMsOf({ u, H = 0, n = 0, forewarned = false }) {
  const base = STARTLE_MIN_MS + (STARTLE_MAX_MS - STARTLE_MIN_MS) * u;
  return ticks(base * (1 - Math.min(Math.max(0, H), 100) / 100) ** 2 * STARTLE_REPEAT_K ** Math.max(0, n) * (forewarned ? STARTLE_FOREWARNED_K : 1));
}
/** A startle's length for a person and an input (see the header). */
export function startleOf(state, pid, input, { H, n = 0, forewarned = false }) {
  const u = next(stream(state.meta.seed, 'combat:startle', pid, input?.id ?? 0));
  return startleMsOf({ u, H, n, forewarned });
}
/** Whether a person is startled at ms. */
export function startled(state, pid, ms = state.clock.ms) {
  const rec = blockOf(state, pid);
  return !!rec && Number.isFinite(rec.startleUntilMs) && ms < rec.startleUntilMs;
}

// ---- writing the pool ----

// (whatever runs on the player finishes its sub-step and stops there (COMBAT §5.7): a command in stop motion halts, its rest
// queued "Carry on" (as contact.js's pause); anything else with sub-steps left (a shot row's next round, a careful Fire's
// press after its hold, a contact's answer, a command in live motion) is cut, its rest dropped and offered again from the
// panel, so no round leaves the rifle while the keys are taken (the code review of v0.0.9: a Pair's second round fired
// 0.5 s into a 1.7 s startle))
function haltCommand(state, pid) {
  if (pid !== playerId(state)) return;
  const d = state.stop?.doing;
  if (!d || d.kind === 'wait' || d.i + 1 >= d.list.length) return;
  if (d.kind === 'command' && state.stop.mode === 'stop') d.halt = true;
  else d.cut = true;
}

// (one input written into a person's pool, the facts deferred: { who, input, before, after, jump, supp, startleMs, startle, H } or null)
function pool(state, pid, input, bus = null) {
  const a = actorOf(state, pid);
  if (!a) return null;
  const atMs = input.atMs ?? state.clock.ms, k = kOf(state, pid, input), pts = (input.pts ?? 0) * k;
  const rec0 = a.combat ?? null, s0 = suppAt(rec0, atMs), prep0 = input.prep ?? 'unprepared';
  // (0.0.10: SUPP_MIN_PTS makes a block; once one is there every input above 0 pools: the din in ear defenders, 0.3 a
  // second, adds to a pool the blanks began and never makes one by itself (see the header))
  if (rec0 ? !(pts > 0) : pts < SUPP_MIN_PTS) return { who: pid, written: false, input: { id: input.id, kind: input.kind, pts: r2(input.pts ?? 0), k: q(k, 0.001), ...(prep0 !== 'unprepared' ? { prep: prep0 } : {}) }, before: null, after: null, jump: 0, supp: r2(s0), startleMs: 0, startle: null, H: null };
  // (BODY §9.3: the stress of the pool so far, folded on the record it was read on, before the input changes it)
  if (rec0) foldStress(state, bus, pid, atMs);
  const H = hardOf(state, pid, atMs), before = feltFrom(s0, H);
  // (a Breathe running: how far its window has put the pool under the same run without it, kept before the record is
  // rewritten (the code review of 0.0.10: read at the end alone, the drain before an input's grace was lost from its
  // shed). The input then adds pts × (1 − s / SUPP_MAX) to each run's pool, so the gap carries on × (1 − pts / SUPP_MAX))
  if (rec0 && running(rec0)) {
    const gap = (rec0.breatheShedPts ?? 0) + Math.max(0, suppAt(plainOf(rec0), atMs) - s0);
    rec0.breatheShedPts = r2(gap * Math.max(0, 1 - pts / SUPP_MAX));
  }
  const rec = (a.combat ??= {});
  const s1 = poolAdd(s0, pts);
  rec.supp = r2(s1); rec.suppAtMs = atMs; rec.suppRate = SUPP_DECAY.exposed; rec.stressAtMs = atMs;
  // (the bangs and blasts in a row: each within STARTLE_REPEAT_MS of the one before is a repeat)
  let n = 0;
  if (PREPPED.has(input.kind)) {
    const repeat = Number.isFinite(rec.lastBangMs) && atMs - rec.lastBangMs <= STARTLE_REPEAT_MS;
    rec.bangN = repeat ? (rec.bangN ?? 0) + 1 : 1;
    rec.lastBangMs = atMs;
    n = rec.bangN - 1;
  }
  for (const f of ['startleFromMs', 'startleUntilMs', 'blindUntilMs', 'dazzleUntilMs', 'deafUntilMs']) rec[f] ??= null;
  const after = feltFrom(rec.supp, H), jump = after - before, prep = input.prep ?? 'unprepared';
  let startleMs = 0, startle = null;
  if (jump >= STARTLE_FROM && prep !== 'prepared') {
    startleMs = startleOf(state, pid, input, { H, n, forewarned: prep === 'forewarned' });
    const on = Number.isFinite(rec.startleUntilMs) && atMs < rec.startleUntilMs;
    const joins = on || (Number.isFinite(rec.startleUntilMs) && Number.isFinite(rec.startleFromMs) && atMs - rec.startleUntilMs <= STARTLE_JOIN_MS);
    const until = Math.max(on ? rec.startleUntilMs : 0, atMs + startleMs);
    // (the freeze in all: the spans' union, added up across a joined gap; a fresh freeze starts its own)
    rec.startleMs = !joins ? startleMs : on ? (rec.startleMs ?? 0) + Math.max(0, until - rec.startleUntilMs) : (rec.startleMs ?? 0) + startleMs;
    if (!joins) rec.startleFromMs = atMs;
    rec.startleUntilMs = until;
    rec.startleWhy = INPUT_WORDS[input.kind] ?? input.why ?? input.kind;
    startle = { phase: 'start', who: pid, ms: startleMs, fromMs: rec.startleFromMs, untilMs: rec.startleUntilMs, why: rec.startleWhy, inputId: input.id ?? null };
    haltCommand(state, pid);
  }
  return { who: pid, written: true, input: { id: input.id ?? null, kind: input.kind, pts: r2(input.pts ?? 0), k: q(k, 0.001), ...(prep !== 'unprepared' ? { prep } : {}) }, why: input.why ?? INPUT_WORDS[input.kind] ?? input.kind,
    before, after, jump, supp: rec.supp, startleMs, startle, H, atMs };
}

// (the 'supp' fact of a written input)
const suppFact = (w, rec) => ({ who: w.who, input: w.input, why: w.why, supp: w.supp, felt: w.after, band: bandOf(w.after), jump: w.jump,
  flash: w.flash ?? null, deafUntilMs: rec?.deafUntilMs ?? null, atMs: w.atMs });

/**
 * One input into a person's pool (w; see the header): input { id, kind, pts, prep = 'unprepared', sound = true, why, atMs,
 * vacuum, blanks }. Under SUPP_MIN_PTS (pts × k) nothing is written. Returns { supp, before, after, jump, startleMs }.
 */
export function addSupp(state, bus, pid, input) {
  const w = pool(state, pid, input, bus);
  if (!w) return null;
  if (w.written) {
    bus?.emit('supp', suppFact(w, blockOf(state, pid)));
    if (w.startle) bus?.emit('startle', w.startle);
  }
  return { supp: w.supp, before: w.before, after: w.after, jump: w.jump, startleMs: w.startleMs };
}

// ---- the bang's physics ----

/** The flash at a person (see the header): 'blind' | 'dazzled' | null, by the angle off the facing and the reach; a filtered visor none. */
export function flashOf(state, pid, { x, z }, { indoor = false } = {}) {
  const a = actorOf(state, pid);
  if (!a || protOf(state, pid).visor) return null;
  const rM = Math.hypot(x - a.x, z - a.z);
  // (indoors the room, until PLACES gives the bang its room: FLASH_REACH_M too)
  if (rM > FLASH_REACH_M) return null;
  if (rM < 1e-6) return 'blind';
  const head = Number.isFinite(a.headRad) ? a.headRad : headOf(a.face);
  const off = Math.abs(wrap(Math.atan2(z - a.z, x - a.x) - head)) / D2R;
  return off < FLASH_CONE_DEG ? 'blind' : off < FLASH_DAZZLE_DEG ? 'dazzled' : null;
}

/**
 * A bang (w; see the header): { id, x, z, atMs, byId, kind: 'training', indoor, called, call }. Every actor on the live
 * area within reach takes inputPts('flash', { rM, indoor }) (the thrower's own and a called bang prepared: ×0.25, no
 * startle, no flash; 0.0.10: one who heard the thrower's "Bang!", call { x, z, atMs }, within CALL_HEARD_MS before it
 * forewarned: ×0.6, the startle ×0.5, the flash by facing as ever), the flash by facing, the deafness of an unprotected
 * ear within DEAF_REACH_M; the 'fx' fact 'bang' once, then the 'supp' and 'startle' facts per person. Returns [{ who,
 * pts, felt, startleMs, flash, deafUntilMs }].
 */
export function bang(state, bus, { id, x, z, atMs = state.clock.ms, byId = null, kind = 'training', indoor = false, called = false, call = null }) {
  const me = playerActor(state), list = [...(me ? [me] : []), ...(state.actors?.list ?? []).filter(a => a !== me && a.who !== me?.who)];
  const written = [], vacuum = vacuumHere(state);
  for (const a of list) {
    // (indoors the room's 60 points, bounded by FLASH_REACH_M until PLACES gives the bang its room)
    const pid = a.who, rM = Math.hypot(a.x - x, a.z - z), pts = indoor && rM > FLASH_REACH_M ? 0 : inputPts('flash', { rM, indoor });
    const prep = called || (byId && pid === byId) ? 'prepared' : heardCall(state, pid, call, atMs) ? 'forewarned' : 'unprepared';
    const w = pool(state, pid, { id: `${id}`, kind: 'flash', pts, prep, why: 'the bang', atMs }, bus);
    if (!w) continue;
    const prot = protOf(state, pid), rec0 = a.combat;
    let flash = null, deafUntilMs = rec0?.deafUntilMs ?? null;
    if (prep !== 'prepared') flash = flashOf(state, pid, { x, z }, { indoor });
    const near = indoor ? rM <= FLASH_REACH_M : rM <= DEAF_REACH_M;
    if (prot.ears === 'none' && near && !vacuum) {                  // (no air, no blast at the ear: the flash alone)
      const u = next(stream(state.meta.seed, 'combat:deaf', pid, id));
      deafUntilMs = Math.max(deafUntilMs ?? 0, atMs + Math.round(DEAF_MIN_MS + (DEAF_MAX_MS - DEAF_MIN_MS) * u));
    }
    const deafNew = deafUntilMs !== (rec0?.deafUntilMs ?? null);
    if (flash || deafNew) {
      const rec = (a.combat ??= { supp: 0, suppAtMs: atMs, suppRate: SUPP_DECAY.exposed, startleFromMs: null, startleUntilMs: null, blindUntilMs: null, dazzleUntilMs: null, deafUntilMs: null });
      if (flash === 'blind') rec.blindUntilMs = Math.max(rec.blindUntilMs ?? 0, atMs + FLASH_BLIND_MS);
      else if (flash === 'dazzled') rec.dazzleUntilMs = Math.max(rec.dazzleUntilMs ?? 0, atMs + FLASH_DAZZLE_MS);
      rec.deafUntilMs = deafUntilMs;
    }
    w.flash = flash; w.deafNew = deafNew;
    written.push({ w, a });
  }
  bus?.emit('fx', { kind: 'bang', id, x, y: 0.05, z, atMs, by: byId ?? null });
  const out = [];
  for (const { w, a } of written) {
    if (w.written || w.flash || w.deafNew) bus?.emit('supp', suppFact(w, a.combat));
    if (w.startle) bus?.emit('startle', w.startle);
    out.push({ who: w.who, pts: w.input.pts, felt: w.after ?? feltOf(state, w.who, atMs), startleMs: w.startleMs, flash: w.flash ?? null, deafUntilMs: a.combat?.deafUntilMs ?? null });
  }
  return out;
}

/** Whether a person heard a thrower's "Bang!" (call { x, z, atMs }) in time to be forewarned of a burst at atMs: within CALL_HEARD_MS before it, his ears letting the voice through then. */
export function heardCall(state, pid, call, atMs) {
  if (!call || !Number.isFinite(call.atMs) || call.atMs > atMs || atMs - call.atMs > CALL_HEARD_MS) return false;
  return hearsVoice(state, pid, call, call.atMs);
}

// ---- the shots and the din (COMBAT §5.1; 0.0.10) ----

// (each written input's line of what shotNoise and dinOf return)
const noiseOut = (w, rec) => ({ who: w.who, pts: w.input.pts, k: w.input.k, felt: w.after ?? 0, supp: rec?.supp ?? 0, startleMs: w.startleMs });

/**
 * A shot's report at its muzzle (w; see the header): { id, x, z, byId, atMs, indoor, blank }. 'muzzle' (inputPts by the
 * distance from the muzzle) to every actor within MUZZLE_M of it but the shooter; indoors 'roomShot' to every other
 * actor within FLASH_REACH_M (the room, until PLACES gives rooms); kOf as built (ear defenders ×0.6). blank changes
 * nothing in the points (BLANKS_K is never a blank's report: the build sheet 0.0.10 §8 item 6). The 'supp' and 'startle'
 * facts per person written. Returns [{ who, pts, k, felt, supp, startleMs }] for the persons written.
 */
export function shotNoise(state, bus, { id, x, z, byId = null, atMs = state.clock.ms, indoor = false, blank = false }) {
  const me = playerActor(state), list = [...(me ? [me] : []), ...(state.actors?.list ?? []).filter(a => a !== me && a.who !== me?.who)];
  const out = [];
  for (const a of list) {
    if (!a.who || (byId && a.who === byId)) continue;
    const rM = Math.hypot(a.x - x, a.z - z);
    const kind = rM <= MUZZLE_M ? 'muzzle' : indoor && rM <= FLASH_REACH_M ? 'roomShot' : null;
    if (!kind) continue;
    const pts = inputPts(kind, { rM, indoor });
    if (!(pts > 0)) continue;
    const w = pool(state, a.who, { id: `${id}`, kind, pts, why: blank && kind === 'muzzle' ? 'a blank beside your ear' : INPUT_WORDS[kind], atMs }, bus);
    if (!w?.written) continue;
    bus?.emit('supp', suppFact(w, a.combat));
    if (w.startle) bus?.emit('startle', w.startle);
    out.push(noiseOut(w, a.combat));
  }
  return out;
}

/**
 * The din (w; see the header): { id, x, z, s, atMs }: 'din' (DIN_PTS_S × s) to every actor within DIN_M of its source, a
 * whole second at a time (the caller folds it once a second, never per tick). Returns [{ who, pts, k, felt, supp,
 * startleMs }] for the persons written.
 */
export function dinOf(state, bus, { id, x, z, s = 1, atMs = state.clock.ms }) {
  const me = playerActor(state), list = [...(me ? [me] : []), ...(state.actors?.list ?? []).filter(a => a !== me && a.who !== me?.who)];
  const out = [];
  for (const a of list) {
    if (!a.who || Math.hypot(a.x - x, a.z - z) > DIN_M) continue;
    const w = pool(state, a.who, { id: `${id}`, kind: 'din', pts: inputPts('din', { s }), atMs }, bus);
    if (!w?.written) continue;
    bus?.emit('supp', suppFact(w, a.combat));
    if (w.startle) bus?.emit('startle', w.startle);
    out.push(noiseOut(w, a.combat));
  }
  return out;
}

/** Hearing at ms: { k: 1 | DEAF_K, deaf, untilMs }. */
export function hearingOf(state, pid, ms = state.clock.ms) {
  const u = blockOf(state, pid)?.deafUntilMs;
  return Number.isFinite(u) && ms < u ? { k: DEAF_K, deaf: true, untilMs: u } : { k: 1, deaf: false, untilMs: null };
}
/** Whether a voice at { x, z } is heard: always, unless deafened, then only within DEAF_VOICE_M. */
export function hearsVoice(state, pid, { x, z }, ms = state.clock.ms) {
  if (!hearingOf(state, pid, ms).deaf) return true;
  const a = actorOf(state, pid);
  return !!a && Math.hypot(x - a.x, z - a.z) <= DEAF_VOICE_M;
}

// ---- the nerve check and the inoculation counter (built, called by nothing this round) ----

/**
 * The nerve check (COMBAT §5.3, §7.11): asked from NERVE_FROM; d20 + Nerve + help + round(10 × (resolve − 1)) against
 * NERVE_DC0 + round(felt / NERVE_PER), on stream(seed, 'combat:nerve', pid, key, atMs). Returns { asked, dc, odds, roll, ok }.
 */
export function nerveCheck(state, pid, { felt, help = 0, resolve = null, atMs = state.clock.ms, key = 'nerve' }) {
  const sheet = sheetOf(state, pid), nerve = Math.round((sheet?.os ?? 0) * (NERVE_K[sheet?.cls ?? 'soldier'] ?? 0));
  const dc = NERVE_DC0 + Math.round((felt ?? 0) / NERVE_PER);
  const mods = [];
  if (help) mods.push({ why: 'your leader\'s call', v: help, src: 'help' });
  if (resolve !== null && resolve !== undefined) { const v = Math.round(10 * (resolve - 1)); if (v) mods.push({ why: 'resolve', v, src: 'people' }); }
  if ((felt ?? 0) < NERVE_FROM) return { asked: false, dc, odds: 1, roll: null, ok: true, nerve };
  const roll = check(stream(state.meta.seed, 'combat:nerve', pid, key, atMs), { skill: 'nerve', value: nerve, dc, mods, pressure: 'fire', by: pid, verb: null });
  return { asked: true, dc, odds: oddsOf(nerve, dc, mods), roll, ok: roll.ok, nerve };
}

/**
 * An exposure for the inoculation counter (w; SKILLS §6.8): +1 when feltPeak ≥ INOC_FELT, at most INOC_PER_SOL a sol, up to
 * INOC_CAP[teacher]; never on a fixed counter (a test sheet), never without a teacher (a real fight teaches through
 * Warfighting). Returns { counted, pts, why }.
 */
export function noteExposure(state, pid, { feltPeak, teacher = null, atMs = state.clock.ms }) {
  const sheet = state.people?.[pid]?.skills ?? null;
  const pts0 = inocPts(state, pid);
  if (!sheet) return { counted: false, pts: pts0, why: 'no sheet of his own' };
  if (sheet.inoc?.fixed) return { counted: false, pts: pts0, why: 'test sheet' };
  if (!teacher || !INOC_CAP[teacher]) return { counted: false, pts: pts0, why: 'a real fight teaches through Warfighting' };
  if ((feltPeak ?? 0) < INOC_FELT) return { counted: false, pts: pts0, why: 'not enough to teach' };
  const inoc = (sheet.inoc ??= { pts: pts0, n: 0, sol: 0 }), sol = Math.floor(atMs / SOL_MS);
  if (inoc.sol !== sol) { inoc.sol = sol; inoc.n = 0; }
  if (inoc.n >= INOC_PER_SOL) return { counted: false, pts: inoc.pts, why: 'enough for one sol' };
  const cap = Math.min(INOC_MAX, INOC_CAP[teacher]);
  if (inoc.pts >= cap) return { counted: false, pts: inoc.pts, why: `as far as ${INOC_TEACHER_WORDS[teacher]} goes` };
  inoc.pts += 1; inoc.n += 1;
  return { counted: true, pts: inoc.pts, why: INOC_TEACHER_WORDS[teacher] };
}

// ---- Breathe (COMBAT §5.2; 0.0.10) ----

/** Whether a threat of the string stands facing at ms (a turner with a threat's face, not stopped, facing: the row's "! he's up"). */
function threatUp(state, ms) {
  for (const T of turnersOf(state)) {
    if ((T.face === 'threat' || T.face === 'armoured' || T.face === 'unknown') && (T.stoppedAtMs === null || T.stoppedAtMs === undefined) && facingOf(T, ms) >= SEEN) return true;
  }
  return false;
}
/** Whether a person is doing Breathe at ms (the step running, or its window open). */
function breathing(state, pid, ms) {
  const d = state.stop?.who === pid ? state.stop.doing : null;
  if (d?.kind === 'breathe') return true;
  const rec = blockOf(state, pid);
  return !!rec && Number.isFinite(rec.breatheUntilMs) && Number.isFinite(rec.breatheFromMs) && ms >= rec.breatheFromMs && ms < rec.breatheUntilMs;
}

/**
 * Whether Breathe is offered (see the header): { ok, why: null | 'calm' | 'startled' | 'taking in' | 'breathing', up }; ok
 * from felt BREATHE_FROM, not startled, no take-in window open, not already breathing; up: a threat of the string stands
 * facing (the row then a single marked "! he's up", never struck).
 */
export function breatheOffer(state, pid = playerId(state), ms = state.clock.ms) {
  const up = threatUp(state, ms);
  if (startled(state, pid, ms)) return { ok: false, why: 'startled', up };
  if (contactOf(state)?.pending) return { ok: false, why: 'taking in', up };
  if (breathing(state, pid, ms)) return { ok: false, why: 'breathing', up };
  if (feltOf(state, pid, ms) < BREATHE_FROM) return { ok: false, why: 'calm', up };
  return { ok: true, why: null, up };
}

/**
 * Breathe begun (w; see the header): the window { breatheFromMs: atMs, breatheUntilMs: atMs + BREATHE_MS } written on the
 * block, the closed form carrying the drain; a window already past since the last input has its drain folded into supp
 * first (with the stress over it), so the pool never rises when the next one is written. The 'breathe' fact 'start'.
 * Returns { fromMs, untilMs, pool } (the pool at its start, for its end's line), or null with no block.
 */
export function breatheStart(state, bus, pid, atMs = state.clock.ms) {
  const rec = blockOf(state, pid);
  if (!rec) return null;
  if (Number.isFinite(rec.breatheFromMs)) {
    const d0 = (rec.suppAtMs ?? atMs) + SUPP_GRACE_MS, ov = overlapMs(d0, atMs, rec.breatheFromMs, rec.breatheUntilMs);
    if (ov > 0) {
      foldStress(state, bus, pid, atMs);
      rec.supp = r2(Math.max(0, rec.supp - (rec.suppRate ?? SUPP_DECAY.exposed) * (BREATHE_K - 1) * ov / 1000));
    }
  }
  const pool = r2(suppAt(rec, atMs));
  rec.breatheFromMs = atMs; rec.breatheUntilMs = atMs + BREATHE_MS; rec.breatheShedPts = 0;
  bus?.emit('breathe', { phase: 'start', who: pid, fromMs: atMs, untilMs: rec.breatheUntilMs, atMs, cut: false, shedPts: 0 });
  return { fromMs: atMs, untilMs: rec.breatheUntilMs, pool };
}

/**
 * Breathe over (w; see the header): at its end, or cut (a sighting, a startle) at atMs, the window's end moved there. The
 * 'breathe' fact 'end' and the log's "Breathed 4.0 s: the chaos 79 → 63." Returns { shedPts } (the pool under the same
 * run without Breathe, to 0.01), or null with no window.
 */
export function breatheEnd(state, bus, pid, atMs = state.clock.ms, { cut = false, fromPts = null } = {}) {
  const rec = blockOf(state, pid);
  if (!rec || !Number.isFinite(rec.breatheFromMs)) return null;
  rec.breatheUntilMs = Math.max(rec.breatheFromMs, Math.min(rec.breatheUntilMs ?? atMs, atMs));
  // (the shed: the pool under the same run without Breathe, its gap at the last input carried (pool keeps it) and the
  // window's part since; the end written, nothing more is kept)
  const plain = plainOf(rec), now = suppAt(rec, atMs);
  const shedPts = r2((rec.breatheShedPts ?? 0) + Math.max(0, suppAt(plain, atMs) - now)), fromMs = rec.breatheFromMs, s = (rec.breatheUntilMs - fromMs) / 1000;
  rec.breatheShedPts = null;
  bus?.emit('breathe', { phase: 'end', who: pid, fromMs, untilMs: rec.breatheUntilMs, atMs, cut: !!cut, shedPts });
  if (pid === playerId(state)) {
    logEntry(state, bus, { kind: 'breathe', tone: 'note', who: pid, ms: rec.breatheUntilMs - fromMs, shedPts,
      text: `Breathed ${s.toFixed(1)} s${cut ? ', cut short' : ''}: the chaos ${Math.round(fromPts ?? suppAt(plain, fromMs))} → ${Math.round(now)}.` });
  }
  return { shedPts };
}

// ---- the body's stress (BODY §9.3; 0.0.10) ----

// (the times at which a pool read on its record last stands at or above p, between aMs and bMs: the measure, ms)
function aboveMs(rec, p, aMs, bMs) {
  if (!(bMs > aMs)) return 0;
  const X = (rec.supp ?? 0) - p;                                   // (the drain, in points, the pool can take and still stand at p)
  if (X < 0) return 0;
  const r = (rec.suppRate ?? SUPP_DECAY.exposed) / 1000, d0 = (rec.suppAtMs ?? aMs) + SUPP_GRACE_MS;
  let until;
  if (!(r > 0)) until = Infinity;
  else {
    // (the drain's pieces after the grace: plain, Breathe's window at BREATHE_K, plain again)
    const wf = Number.isFinite(rec.breatheFromMs) && Number.isFinite(rec.breatheUntilMs) ? Math.max(d0, rec.breatheFromMs) : Infinity;
    const wu = wf === Infinity ? Infinity : Math.max(wf, rec.breatheUntilMs);
    const Df = r * (wf - d0), Du = Df + r * BREATHE_K * (wu - wf);
    until = X <= Df ? d0 + X / r : X <= Du ? wf + (X - Df) / (r * BREATHE_K) : wu + (X - Du) / r;
  }
  return Math.max(0, Math.min(bMs, until) - aMs);
}

/**
 * The stress the chaos adds over [fromMs, toMs] (pure; BODY §9.3): ∫ SUPP_STRESS_PER_S[band(felt(t))] dt, felt(t) =
 * feltFrom(suppAt(rec, t), H), the bands' crossing times solved on the pool's linear pieces (the grace, the plain decay,
 * Breathe's window). Exact to float rounding. Returns points.
 */
export function stressGainOf(rec, H, fromMs, toMs) {
  if (!rec || !rec.supp || !(toMs > fromMs)) return 0;
  let gain = 0;
  for (let i = 0; i < BANDS.length; i++) {
    const per = SUPP_STRESS_PER_S[BANDS[i][0]] ?? 0;
    if (!per) continue;
    // (felt ≥ F ⇔ round(pool − H) ≥ F ⇔ pool ≥ F − 0.5 + H: Math.round takes the half up)
    const lo = aboveMs(rec, BANDS[i][1] - 0.5 + H, fromMs, toMs), hi = i + 1 < BANDS.length ? aboveMs(rec, BANDS[i + 1][1] - 0.5 + H, fromMs, toMs) : 0;
    gain += per * Math.max(0, lo - hi) / 1000;
  }
  return gain;
}

/**
 * The stress of a person's pool so far into the body (w; see the header): stressGainOf from stressAtMs (else suppAtMs) to
 * ms, hardening read at its start, through body/stress.js addStress (BODY's door); stressAtMs = ms. Nothing while the
 * pool read 0 at the last fold. Returns the points added.
 */
export function foldStress(state, bus, pid, ms = state.clock.ms) {
  const rec = blockOf(state, pid);
  if (!rec) return 0;
  const from = rec.stressAtMs ?? rec.suppAtMs;
  if (!Number.isFinite(from) || !(ms > from) || !(suppAt(rec, from) > 0)) return 0;
  const pts = stressGainOf(rec, hardOf(state, pid, from), from, ms);
  rec.stressAtMs = ms;
  if (pts > 0) addStress(state, pid, pts, ms, bus);
  return pts;
}

/**
 * The people domain's fast layer 'second' (w; lived ticks; see the header): at each whole SUPP_STRESS_FOLD_MS of the game
 * clock, every live actor whose pool was up at its last fold has its stress folded; the first fold that finds the pool
 * empty is its last until the next input.
 */
export function suppSecond(state, input, bus, ctx) {
  const ms = state.clock.ms;
  if (ms % SUPP_STRESS_FOLD_MS !== 0) return;
  const me = playerActor(state), list = [...(me ? [me] : []), ...(state.actors?.list ?? []).filter(a => a !== me && a.who !== me?.who)];
  for (const a of list) {
    const rec = a.combat;
    if (!rec || !a.who) continue;
    const from = rec.stressAtMs ?? rec.suppAtMs;
    if (Number.isFinite(from) && ms > from && suppAt(rec, from) > 0) foldStress(state, bus, a.who, ms);
  }
}

// ---- the fast layer and the view ----

/** The sum's words (the one formatter: the hover, J, the card): "the chaos 105 − your hardening 17 = felt 88: pinned, −9". */
export function suppWords({ pool: p, H, felt, band = bandOf(felt), mod = null }) {
  const v = typeof mod === 'number' ? mod : mod?.v ?? 0;
  return `the chaos ${Math.round(p ?? 0)} − your hardening ${Math.round(H ?? 0)} = felt ${felt ?? 0}: ${band}${v ? `, ${v < 0 ? `−${-v}` : `+${v}`}` : ''}`;
}

/**
 * The fast layer 'input' (w; lived ticks; the people domain's, before the contact's): inside a startle a stop-motion
 * 'stop' hold with no step running is let go; on the first tick at or past its end the 'startle' fact 'end' (ms the
 * whole freeze), the log entry, and in stop motion with nothing running time held again.
 */
export function suppInput(state, input, bus, ctx) {
  if (state.skip) return;
  const pid = playerId(state), rec = blockOf(state, pid);
  if (!rec || !Number.isFinite(rec.startleUntilMs)) return;
  const ms = state.clock.ms, S = state.stop;
  if (ms < rec.startleUntilMs) {
    if (isHeld(state) && S?.mode === 'stop' && !S.doing && !S.reflex && state.clock.holds.every(h => h === 'stop')) { releaseTime(state, 'stop'); return; }
    // (a reflex card holding time inside a startle would freeze the game with every key refused: the card is answered,
    // so the startle ends here, as contact.js ends a window at a card)
    if (!(isHeld(state) && S?.reflex)) return;
    rec.startleMs = Math.max(0, (rec.startleMs ?? 0) - (rec.startleUntilMs - ms));
    rec.startleUntilMs = ms;
  }
  if (rec.frozeAtMs === rec.startleUntilMs) return;
  rec.frozeAtMs = rec.startleUntilMs;
  foldStress(state, bus, pid, ms);
  const froze = rec.startleMs ?? rec.startleUntilMs - (rec.startleFromMs ?? rec.startleUntilMs);
  const H = hardOf(state, pid, rec.suppAtMs ?? ms), felt = feltFrom(rec.supp ?? 0, H);
  bus?.emit('startle', { phase: 'end', who: pid, ms: froze, fromMs: rec.startleFromMs, untilMs: rec.startleUntilMs, why: rec.startleWhy ?? null, inputId: null });
  logEntry(state, bus, { kind: 'startle', tone: 'warn', who: pid, ms: froze,
    text: `Startled ${(froze / 1000).toFixed(2)} s: ${rec.startleWhy ?? 'the noise'}, ${suppWords({ pool: rec.supp ?? 0, H, felt }).replace(/: [^:]*$/, '')}.` });
  if (S?.mode === 'stop' && !S.doing && !S.reflex && !isHeld(state, 'stop')) holdTime(state, 'stop');
}

/**
 * The HUD's view of a person's chaos at ms (see the header), or null with no block: { pool, H, felt, band, bandN, mod,
 * timeK, word, startle, froze, blind, dazzle, deaf, sum }.
 */
export function suppNow(state, pid = playerId(state), ms = state.clock.ms) {
  const rec = blockOf(state, pid);
  if (!rec) return null;
  const p = suppAt(rec, ms), H = hardOf(state, pid, ms), felt = p > 0 ? feltFrom(p, H) : 0, band = bandOf(felt);
  const mod = suppMod(felt, 'weapons');
  const on = Number.isFinite(rec.startleUntilMs) && ms < rec.startleUntilMs;
  const ended = Number.isFinite(rec.startleUntilMs) && ms >= rec.startleUntilMs;
  const left = (until, span) => (Number.isFinite(until) && ms < until ? { untilMs: until, k: clamp((until - ms) / span, 0, 1) } : null);
  return {
    pool: r2(p), H, felt, band, bandN: bandN(felt), mod: mod?.v ?? 0, timeK: suppTimeK(felt), word: hardWord(H),
    // (soFarMs: the freeze counted to ms, the joined ones before included: the face's FROZE stamp counts up while it lasts)
    startle: on ? { fromMs: rec.startleFromMs, untilMs: rec.startleUntilMs, soFarMs: Math.max(0, (rec.startleMs ?? rec.startleUntilMs - (rec.startleFromMs ?? ms)) - (rec.startleUntilMs - ms)) } : null,
    froze: ended ? { ms: rec.startleMs ?? rec.startleUntilMs - (rec.startleFromMs ?? rec.startleUntilMs), atMs: rec.startleUntilMs } : null,
    blind: left(rec.blindUntilMs, FLASH_BLIND_MS), dazzle: left(rec.dazzleUntilMs, FLASH_DAZZLE_MS),
    deaf: Number.isFinite(rec.deafUntilMs) && ms < rec.deafUntilMs ? { untilMs: rec.deafUntilMs, voiceM: DEAF_VOICE_M } : null,
    sum: suppWords({ pool: p, H, felt, band, mod }),
  };
}
