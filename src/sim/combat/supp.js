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
// Pure but addSupp, bang, noteExposure and suppInput, which write the block, the sheet's counter, the clock's hold and
// the log.
import { stream, next } from '../../core/rng.js';
import { q } from '../../core/num.js';
import { SOL_MS, holdTime, releaseTime, isHeld } from '../../core/clock.js';
import { playerActor, playerId } from '../../core/ids.js';
import { check, oddsOf } from '../skills/checks.js';
import { sheetOf, tierOfRank } from '../skills/templates.js';
import { bodyMods, needMods } from '../body/mods.js';
import { headOf, wrap } from '../people/perception.js';
import { logEntry } from '../log.js';
import { ticks } from './react.js';

// ---- the pool (COMBAT §5.1, §5.2) ----

/** The pool's ceiling, the grace before it falls, its fall a second by where you are (exposed this round), the least input written. */
export const SUPP_MAX = 120, SUPP_GRACE_MS = 1500, SUPP_MIN_PTS = 1;
export const SUPP_DECAY = Object.freeze({ cover: 4, exposed: 2, down: 6 });
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

/** The pool at ms in closed form (see the header). */
export function suppAt(rec, ms) {
  if (!rec || !rec.supp) return 0;
  return Math.max(0, rec.supp - (rec.suppRate ?? SUPP_DECAY.exposed) * Math.max(0, ms - (rec.suppAtMs ?? ms) - SUPP_GRACE_MS) / 1000);
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

/** An input's multiplier for a person (see inputK): their worn protection read from the kit. */
export function kOf(state, pid, input) {
  return inputK({ kind: input?.kind, prep: input?.prep ?? 'unprepared', sound: input?.sound !== false, ears: protOf(state, pid).ears, vacuum: !!input?.vacuum, blanks: !!input?.blanks });
}

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
function pool(state, pid, input) {
  const a = actorOf(state, pid);
  if (!a) return null;
  const atMs = input.atMs ?? state.clock.ms, k = kOf(state, pid, input), pts = (input.pts ?? 0) * k;
  const rec0 = a.combat ?? null, s0 = suppAt(rec0, atMs);
  if (pts < SUPP_MIN_PTS) return { who: pid, written: false, input: { id: input.id, kind: input.kind, pts: r2(input.pts ?? 0), k: q(k, 0.001) }, before: null, after: null, jump: 0, supp: r2(s0), startleMs: 0, startle: null, H: null };
  const H = hardOf(state, pid, atMs), before = feltFrom(s0, H);
  const rec = (a.combat ??= {});
  const s1 = poolAdd(s0, pts);
  rec.supp = r2(s1); rec.suppAtMs = atMs; rec.suppRate = SUPP_DECAY.exposed;
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
  return { who: pid, written: true, input: { id: input.id ?? null, kind: input.kind, pts: r2(input.pts ?? 0), k: q(k, 0.001) }, why: input.why ?? INPUT_WORDS[input.kind] ?? input.kind,
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
  const w = pool(state, pid, input);
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
 * A bang (w; see the header): { id, x, z, atMs, byId, kind: 'training', indoor, called }. Every actor on the live area
 * within reach takes inputPts('flash', { rM, indoor }) (the thrower's own and a called bang prepared: ×0.25, no startle,
 * no flash), the flash by facing, the deafness of an unprotected ear within DEAF_REACH_M; the 'fx' fact 'bang' once, then
 * the 'supp' and 'startle' facts per person. Returns [{ who, pts, felt, startleMs, flash, deafUntilMs }].
 */
export function bang(state, bus, { id, x, z, atMs = state.clock.ms, byId = null, kind = 'training', indoor = false, called = false }) {
  const me = playerActor(state), list = [...(me ? [me] : []), ...(state.actors?.list ?? []).filter(a => a !== me && a.who !== me?.who)];
  const written = [];
  for (const a of list) {
    // (indoors the room's 60 points, bounded by FLASH_REACH_M until PLACES gives the bang its room)
    const pid = a.who, rM = Math.hypot(a.x - x, a.z - z), pts = indoor && rM > FLASH_REACH_M ? 0 : inputPts('flash', { rM, indoor });
    const prep = called || (byId && pid === byId) ? 'prepared' : 'unprepared';
    const w = pool(state, pid, { id: `${id}`, kind: 'flash', pts, prep, why: 'the bang', atMs });
    if (!w) continue;
    const prot = protOf(state, pid), rec0 = a.combat;
    let flash = null, deafUntilMs = rec0?.deafUntilMs ?? null;
    if (prep !== 'prepared') flash = flashOf(state, pid, { x, z }, { indoor });
    const near = indoor ? rM <= FLASH_REACH_M : rM <= DEAF_REACH_M;
    if (prot.ears === 'none' && near) {
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
