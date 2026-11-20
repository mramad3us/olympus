// OLYMPUS arms: upkeep, the rifle's dirt, carbon, oil and heat made live where a scene says so, the bench's one roll and the armourer's one look (WEAPONS §4.3, §9, §10.3; the build sheet v0.0.28 §0 items 1 to 9, §3.1, items 11, 13, 17, 18).
//
// Four numbers on the gun were read and never moved from v0.0.5 to v0.0.27 (firearms.js misfireP and jamP, WEAPONS §4.3): its
// dust, its fouling (foul: carbon, and after a clean what the clean left, the residual, in the same field), its lube ('dry',
// 'wet', 'vac', 'none') and its barrel's heat (barrelC at heatMs). Three things move them, and nothing else:
//   a round fired   roundFired(gun, { ms, air, suppressor }), called by firearms.js pull after its last draw when the caller
//                   passes `live` (only shot.js resolveShot and catchAhead's clone do, through liveOpts): foul += FOUL 0.0012
//                   (× FOUL_SUPP_K 1.5 suppressed, WEAPONS §9.1), the lube to 'none' once LUBE_ROUNDS 300 have gone since the
//                   last lube (lubeRd, absent 0: an issue rifle never cleaned ages by rounds), the barrel the lazy number below
//                   plus HEAT_C a round (R-7 2.5 °C, P-12 2.0, WEAPONS §9.5). firedOutcome(gun, n, { ms, gapS, air, endMs }) is n
//                   of them over a span as pull and roundFired would leave them, one each gapS, the last at ms, so a relay behind a
//                   splash and the same relay lived leave the same gun (the rounds counted and the condition worn by pull's own
//                   firearms.js countRound); the barrel is then read at endMs (the span's end, ms when absent), so a relay whose
//                   last round is minutes before its end leaves the barrel at the air's, its record dropped (§0 item 9).
//   a minute out    dustOver(gun, { minutes, airDust, exposure, prone, surfaceDust, mags }), WEAPONS §9.2's one formula: dust +=
//                   DUST_PER_MIN 0.002 × the air's dust × EXPOSURE (the port shut 0.2, open 1.0) × (prone: 1 + PRONE_DUST_K 2 ×
//                   the surface's dust, so regolith ×3) × LUBE_K (wet 1.5) × minutes; each magazine named gains the same
//                   but the lube's, × MAG_POUCH_K 0.5. Linear in minutes, so one call for a span is the span stepped.
//                   It is called by a scene for its own minutes (the relay); no slow layer runs it this round (§0 item 7).
//   the bench       cleanEnd: one Weapon handling roll at the clean's end (DC 9, the P-12 8; pressure none, procedure, the
//                   tempo's modifier, TEMPO's rushed, normal or careful: §0 item 1) on stream(seed, 'clean', gunId, n), n the
//                   gun's cleans before it, so a clean lived and the same clean skipped roll the same (WEAPONS §16's parity).
//                   It leaves dust 0 (the person's magazines' too), frost 0, the Corps' dry film (CLEAN_LUBE, lubeRd the rounds
//                   now), the barrel at the air's, foul = the residual max(0, RESIDUAL_AT 0.03 − 0.003 × margin) (WEAPONS
//                   §9.3; "Clean it again" never adds carbon: its foul is the lesser of the residual and what the rifle had, since
//                   a re-clean starts from a cleaned rifle whose dust is already off), and on a bad or a disaster grade the firing pin retaining pin lost (gun.fault 'pin': pull refuses
//                   as 'broken' and firearms.js ready says no, until the armourer fits one: fitPin). The hands come away
//                   soiled (body.js soil, HANDS.CLEAN 40: "Gun oil and carbon on your hands."), the roll logged and told,
//                   and the function check folded into its last line. cleanStart, at the strip, takes a round the belief
//                   missed out of the chamber onto the mat ("A live round drops out of the chamber onto the mat.": no
//                   field strip without pulling the carrier back; §0 item 25), and says so to its caller, whose books it is.
// **The gate** (§0 item 15): every write is behind upkeepOn(state), state.armoury.upkeep true, which only test-armoury's fill sets;
// absent everywhere else, so every shipped scene, pin and save is byte for byte as before (F170, F183): pull with `live` absent is
// the pull it was, and roundFired, dustOver's callers, cleanStart and cleanEnd write nothing ungated. Every read is ungated: a field
// nobody wrote reads its default, as before. GUN_DEFAULTS is untouched (lube 'wet'); the scene's rifles are written 'dry'.
// **The heat** is a lazy number, never a tick's work: barrelNow(gun, ms, air) = the air's + (barrelC − the air's) × exp(−Δt / τ),
// Newton's cooling with τ HEAT_TAU_S by the air (Melas's valley and the datum 186 s, the 66 kPa Martian indoor standard of a
// hull 230 s, Earth's airs 175 s: my fit to WEAPONS §9.5's rows, its cooling rows exact at 20 °C), and heatTauOf throws on an air
// with none (vacuum among them; §0 item 9). A live pull in such an air (a scene's host set to one by the URL's &env=, the vacuum
// and the belt's station: the vacuum branch is cut, §0 item 9) keeps no barrel at all: liveOpts gives it air null, and roundFired
// and firedOutcome leave barrelC and heatMs alone there, the carbon and the lube counted as anywhere; an air left out (undefined)
// still throws, a caller's slip. The stored barrel is dropped once within HEAT_DROP_C 1 °C
// of the air (coolBarrel), so a cool gun saves nothing. Only the number is built: jamP's built +0.01 over 350 °C reads the stored
// barrel, which no scene of this round warms past a few degrees; the shot's heat rows, wear by heat and cook-off are later.
// **The time and the odds** (§0 items 2 and 3): a clean takes CLEAN_MIN (R-7 30 min, P-12 15) × paceOf(Weapon handling) × dirtOf
// (clamp(1 + foul + 1.6 × dust, 1, 2), WEAPONS §9.3) × the tempo's time, "Clean it again" RECLEAN_MIN 10 × pace × the tempo's (the
// dirt is off), in whole seconds (cleanMs); its parts strip, clean, oil and assemble at CLEAN_PARTS 10, 70, 10 and 10%. cleanOdds is
// the closed form over the d20 of the very check cleanEnd rolls (its naturals, routine and mastery as checks.js counts them): the
// chance it comes out spotless (residual at FIND_FREE 0.005 or less: nothing for the armourer to find), the chance of a bad grade,
// and with an armourer's Awareness the chance it passes his window first time. cleanOff is why a clean is struck: "Nothing in your
// hands to clean.", "Clear it first." (a believed stoppage), "Magazine out first.", "Check the chamber first." (the believed
// chamber anything but empty, '?' included, so the show clear is the habit).
// **The inspection** (inspect, WEAPONS §10.3, §9.4): 'keep' at cond under KEEP_COND 0.5 (the LTI; never an issue rifle here), 'pin'
// when the pin is gone (always found: he works the action), else total = foul + dust; at FIND_FREE or less 'pass' with no roll; else
// the armourer's Awareness against max(FIND_DC_MIN 5, FIND_DC_AT 30 − FIND_DC_PER 400 × total), rounded, on stream(seed, 'inspect',
// gunId, the gun's cleans): made, 'again' ("Carbon on the carrier. Clean it again." or the grit's words), else 'pass' ("Clean. Rack
// it. Condition 0.93.": his number, condNumber, the only exact cond anyone sees). Pure: the scene acts on the verdict.
// Pure but the writers named above, each gated.
import { q } from '../../core/num.js';
import { stream } from '../../core/rng.js';
import { MIN_MS, SEC_MS } from '../../core/clock.js';
import { playerId } from '../../core/ids.js';
import { check, grade, isRoutine, isMastered, TEMPO } from '../skills/checks.js';
import { paceOf } from '../skills/skills.js';
import { valueOf } from '../skills/templates.js';
import { rollerOf } from '../combat/roll.js';
import { gunField, beliefOf, countRound } from './firearms.js';
import { ownerOf } from './kit.js';
import { airAt } from '../places/env.js';
import { logEntry } from '../log.js';
import { soil } from '../body/body.js';
import { HANDS } from '../../data/body/needs.js';

// ---- constants (WEAPONS §9, §10.3; the build sheet v0.0.28 §5) ----

/** Carbon a round fired (WEAPONS §9.1), and × this through a suppressor. */
export const FOUL = 0.0012, FOUL_SUPP_K = 1.5;
/** Dust a minute out of doors at an air's dust of 1 and the port open (WEAPONS §9.2). */
export const DUST_PER_MIN = 0.002;
/** The gun's exposure: the port cover shut (and the muzzle capped), or open (WEAPONS §9.2). */
export const EXPOSURE = Object.freeze({ shut: 0.2, open: 1.0 });
/** Lying in it: × (1 + PRONE_DUST_K × the surface's dust), so regolith (dust 1) ×3, WEAPONS §9.2's "lying in the dust". */
export const PRONE_DUST_K = 2;
/** The lube's pull on the dust (WEAPONS §9.2: wet 1.5; the others 1). */
export const LUBE_K = Object.freeze({ wet: 1.5 });
/** A magazine in a pouch takes this share of the gun's dust (WEAPONS §9.2). */
export const MAG_POUCH_K = 0.5;
/** Rounds from a lube to 'none' (WEAPONS §9.1). */
export const LUBE_ROUNDS = 300;
/** The film a clean leaves: the Corps' dry film on Mars (WEAPONS §9.1; my call: the scene is Melas's; the ship's wet and EVA's vac with the career). */
export const CLEAN_LUBE = 'dry';
/** A round's heat into the barrel, °C (WEAPONS §9.5), by model. */
export const HEAT_C = Object.freeze({ r7: 2.5, p12: 2.0 });
/** Newton's cooling time constant by air, s (my fit to WEAPONS §9.5's rows, see the header). */
export const HEAT_TAU_S = Object.freeze({ 'mars-melas': 186, 'mars-datum': 186, 'martian-indoor': 230, 'earth-standard': 175, 'earth-sea-level': 175 });
/** A barrel within this of the air is the air's: its record dropped, °C. */
export const HEAT_DROP_C = 1;
/** The dirt's factor on a clean's time (WEAPONS §9.3): 1 + foul + DIRT_DUST_K × dust, at most DIRT_MAX. */
export const DIRT_DUST_K = 1.6, DIRT_MAX = 2;
/** A clean's minutes at value 10 and its DC, by model (WEAPONS §9.3; TIME §8.5). */
export const CLEAN_MIN = Object.freeze({ r7: 30, p12: 15 }), CLEAN_DC = Object.freeze({ r7: 9, p12: 8 });
/** The clean's parts' shares: strip, clean, oil, assemble (and the function check) (TIME §7.5). */
export const CLEAN_PARTS = Object.freeze([0.1, 0.7, 0.1, 0.1]);
/** The parts by name, in order, as the activity's records name them. */
export const CLEAN_PART_IDS = Object.freeze(['strip', 'clean', 'oil', 'assemble']);
/** What a clean leaves (WEAPONS §9.3): max(0, RESIDUAL_AT − RESIDUAL_PER_MARGIN × margin). */
export const RESIDUAL_AT = 0.03, RESIDUAL_PER_MARGIN = 0.003;
/** The inspection (WEAPONS §10.3): nothing to find at FIND_FREE or less; else Awareness against max(FIND_DC_MIN, FIND_DC_AT − FIND_DC_PER × total). */
export const FIND_FREE = 0.005, FIND_DC_AT = 30, FIND_DC_PER = 400, FIND_DC_MIN = 5;
/** "Clean it again", minutes at value 10; the pin's chit at the window, minutes; under this the armourer keeps it for the LTI (WEAPONS §9.3, §10.3). */
export const RECLEAN_MIN = 10, PIN_CHIT_MIN = 20, KEEP_COND = 0.5;
/** The tempos a clean is offered at (§0 item 1: TEMPO's three; taken steady not offered). */
export const CLEAN_TEMPOS = Object.freeze(['rushed', 'normal', 'careful']);
/** The cleaning activities (src/data/activities.js): while one runs the rifle lies on the mat, off the figure (look.js gunLook). */
export const CLEAN_ACTIVITIES = Object.freeze(new Set(['clean-rifle', 'clean-again']));
/** What a struck clean says, and what the bench says (each a line in the log; none voiced). */
export const CLEAN_WORDS = Object.freeze({
  nothing: 'Nothing in your hands to clean.', stoppage: 'Clear it first.', mag: 'Magazine out first.', chamber: 'Check the chamber first.',
  round: 'A live round drops out of the chamber onto the mat.', dud: 'A dud round drops out of the chamber onto the mat.', caseOut: 'An empty case drops out of the chamber onto the mat.',
  check: 'Function check: safe holds, fire drops, the reset clicks.', pin: 'The firing pin retaining pin is gone: it rolled off the mat somewhere.',
});
/** The armourer's words at the window by verdict (WEAPONS §10.3; the turn-back's by what he found). */
export const INSPECT_WORDS = Object.freeze({
  pass: 'Clean. Rack it.', carbon: 'Carbon on the carrier. Clean it again.', grit: 'Grit in the action. Clean it again.',
  pin: 'Where\'s your firing pin retaining pin?', keep: 'This one stays with me. It wants the LTI.', heard: 'And I heard about the bench.',
});

const NO_UPKEEP = Object.freeze({});
const field = (g, k, v) => { if (v === undefined || v === null || v === 0) delete g[k]; else g[k] = v; };
const modelKey = (gun) => gun?.model ?? 'r7';
const need = (v, why) => { if (v === undefined || v === null || Number.isNaN(v)) throw new Error(`upkeep: ${why}`); return v; };

// ---- the gate ----

/** Whether upkeep writes here (see the header): the scene's fill sets state.armoury.upkeep. */
export const upkeepOn = (state) => state?.armoury?.upkeep === true;
/** A pull's upkeep options (shot.js resolveShot and catchAhead): live only behind the gate, the air the shooter's place's; else none. */
export function liveOpts(state, ms) {
  if (!upkeepOn(state)) return NO_UPKEEP;
  const air = airAt(state);
  return { ms, air: heatsIn(air) ? air : null, live: true };
}
/** Whether a person is at the bench now (the player cleaning: the rifle lies on the mat, look.js draws none on the figure). */
export const benchOf = (state, pid) => !!pid && pid === playerId(state) && CLEAN_ACTIVITIES.has(state?.time?.doing?.activity);

// ---- heat ----

/** Whether an air (an airAt record or its id) has a barrel cooling constant: where it has none, no barrel is kept (see the header). */
export const heatsIn = (air) => HEAT_TAU_S[typeof air === 'string' ? air : air?.air] !== undefined;
/** The cooling time constant of an air (an airAt record or its id), s; an air with none throws. */
export function heatTauOf(air) {
  const id = typeof air === 'string' ? air : air?.air;
  return need(HEAT_TAU_S[id], `no barrel cooling for the air '${id}' (${Object.keys(HEAT_TAU_S).join(', ')})`);
}
// (the air's temperature, °C: an airAt record's)
const airCOf = (air) => need(typeof air === 'object' ? air?.airC : undefined, `an air with no temperature (${JSON.stringify(air)})`);
/** The barrel's temperature at ms, °C (see the header): the air's when nothing warmed it. */
export function barrelNow(gun, ms, air) {
  const a = airCOf(air);
  if (gun?.barrelC === undefined) return a;
  const dtS = Math.max(0, (ms - (gun.heatMs ?? ms)) / SEC_MS);
  return a + (gun.barrelC - a) * Math.exp(-dtS / heatTauOf(air));
}
/** The barrel's record dropped once within HEAT_DROP_C of the air at ms (the save keeps no cool barrel). Writes gun. */
export function coolBarrel(gun, ms, air) {
  if (gun?.barrelC === undefined) return;
  if (barrelNow(gun, ms, air) - airCOf(air) <= HEAT_DROP_C) { delete gun.barrelC; delete gun.heatMs; }
}

// ---- a round, a span ----

/**
 * A round fired, as upkeep keeps it (see the header): called by pull when live, after its last draw. air null: an air with no barrel
 * cooling (liveOpts), the barrel left alone. Writes gun.
 */
export function roundFired(gun, { ms, air, suppressor = false } = {}) {
  field(gun, 'foul', q(Math.min(1, gunField(gun, 'foul') + FOUL * (suppressor ? FOUL_SUPP_K : 1)), 1e-6));
  if (gunField(gun, 'lube') !== 'none' && gunField(gun, 'rounds') - (gun.lubeRd ?? 0) >= LUBE_ROUNDS) gun.lube = 'none';
  if (air === null) return;
  const T = barrelNow(gun, need(ms, 'a round fired with no ms'), air) + need(HEAT_C[modelKey(gun)], `no heat a round for '${modelKey(gun)}'`);
  gun.barrelC = q(T, 1e-6);
  gun.heatMs = ms;
}
/**
 * n rounds fired, one each gapS, the last at ms, as pull and roundFired leave a gun, the barrel read at endMs (the span's end, at
 * least ms; see the header). Writes gun.
 */
export function firedOutcome(gun, n, { ms, gapS = 0, air, suppressor = false, endMs = ms } = {}) {
  for (let k = 0; k < n; k++) {
    const at = Math.round(ms - (n - 1 - k) * gapS * SEC_MS);
    countRound(gun);
    roundFired(gun, { ms: at, air, suppressor });
  }
  // (its port cover open, as a lived round leaves it: firearms.js pull)
  if (n > 0) gun.portOpen = true;
  if (air !== null) coolBarrel(gun, Math.max(ms, need(endMs, 'a span with no end')), air);
}

// ---- the dust ----

/** Dust over minutes (see the header): the gun and each magazine named. Writes them; returns the gun's increment. */
export function dustOver(gun, { minutes, airDust, exposure = 'open', prone = false, surfaceDust = 1, mags = [] } = {}) {
  const ex = need(EXPOSURE[exposure], `no exposure '${exposure}' (${Object.keys(EXPOSURE).join(', ')})`);
  const base = DUST_PER_MIN * need(airDust, 'no air dust') * ex * (prone ? 1 + PRONE_DUST_K * surfaceDust : 1) * need(minutes, 'no minutes');
  const inc = base * (LUBE_K[gunField(gun, 'lube')] ?? 1);
  field(gun, 'dust', q(Math.min(1, gunField(gun, 'dust') + inc), 1e-6));
  for (const m of mags) if (m) field(m, 'dust', q(Math.min(1, (m.dust ?? 0) + base * MAG_POUCH_K), 1e-6));
  return inc;
}

// ---- the bench ----

/** The dirt's factor on a clean's time (WEAPONS §9.3). */
export const dirtOf = (gun) => Math.max(1, Math.min(DIRT_MAX, 1 + gunField(gun, 'foul') + DIRT_DUST_K * gunField(gun, 'dust')));
// (a tempo of the bench's three, or it throws)
const tempoOf = (tempo) => { if (!CLEAN_TEMPOS.includes(tempo)) throw new Error(`upkeep: no bench tempo '${tempo}' (${CLEAN_TEMPOS.join(', ')})`); return TEMPO[tempo]; };
/** The gun a person would clean: the one in a hand, else the one on the sling (shooting.js gunOn's rule). */
export function cleanGunOf(state, pid) {
  const k = state.people?.[pid]?.kit;
  for (const id of k?.hands ?? []) if (id && state.items?.[id]?.type === 'gun') return id;
  return k?.worn?.sling ?? null;
}
/** A clean's length, ms in whole seconds (see the header); again: "Clean it again" (the dirt off). */
export function cleanMs(state, pid, gunId, tempo = 'normal', { again = false } = {}) {
  const gun = need(state.items?.[gunId], `no gun '${gunId}'`), T = tempoOf(tempo);
  const min = again ? RECLEAN_MIN : need(CLEAN_MIN[modelKey(gun)], `no clean for '${modelKey(gun)}'`) * dirtOf(gun);
  return Math.round(min * MIN_MS * paceOf(valueOf(state, pid, 'weapons')) * T.timeK / SEC_MS) * SEC_MS;
}

// (one d20 of a check as checks.js check() grades it, without the dice: { ok, margin, grade })
function faceOf(d, { value, dc, mods, tempo, pressure, procedure }) {
  const T = TEMPO[tempo] ?? TEMPO.normal;
  const list = T.v ? [...mods, { why: T.why, v: T.v, src: 'tempo' }] : mods;
  const total = d + value + list.reduce((a, m) => a + (m?.v ?? 0), 0), nat = d === 20 ? 20 : d === 1 ? 1 : 0;
  const caught = nat === 1 && (isRoutine({ value, dc, mods: list, tempo, pressure, procedure }) || isMastered({ value, dc, mods: list, tempo }));
  const margin = total - dc, ok = nat === 20 ? true : nat === 1 ? caught : total >= dc;
  return { ok, margin, grade: grade(margin, caught ? 0 : nat) };
}
/** What a clean at a margin leaves (WEAPONS §9.3), quantised as the gun keeps it. */
export const residualOf = (margin) => q(Math.max(0, RESIDUAL_AT - RESIDUAL_PER_MARGIN * margin), 1e-6);
/** The armourer's DC against what is left (WEAPONS §10.3), or null when there is nothing to find. */
export const findDcOf = (total) => (total <= FIND_FREE ? null : Math.max(FIND_DC_MIN, Math.round(FIND_DC_AT - FIND_DC_PER * total)));
/** The chance an armourer of an Awareness (and his mods) finds what is left of total (the closed form of inspect's roll). */
export function findOdds(total, awareness, mods = []) {
  const dc = findDcOf(total);
  if (dc === null) return 0;
  let n = 0;
  for (let e = 1; e <= 20; e++) if (faceOf(e, { value: awareness, dc, mods, tempo: 'normal', pressure: 'none', procedure: false }).ok) n++;
  return n / 20;
}
const isBad = (g) => g === 'bad' || g === 'disaster';
/**
 * The bench's odds on numbers (see the header): { spotless, bad, first } for a Weapon handling value and its mods at a tempo on a
 * model, first (with awareness, an armourer's) the chance he passes it at his window first time (a lost pin never does). foul
 * (a re-clean's): the carbon the rifle has, which a re-clean never raises (cleanEnd), so each face leaves the lesser.
 */
export function cleanOddsOf({ value, mods = [], tempo = 'normal', model = 'r7', awareness = null, aMods = [], foul = null }) {
  tempoOf(tempo);
  const dc = need(CLEAN_DC[model], `no clean for '${model}'`);
  let spotless = 0, bad = 0, first = 0;
  for (let d = 1; d <= 20; d++) {
    const f = faceOf(d, { value, dc, mods, tempo, pressure: 'none', procedure: true }), res = foul === null ? residualOf(f.margin) : Math.min(foul, residualOf(f.margin));
    if (isBad(f.grade)) { bad++; continue; }
    if (res <= FIND_FREE) { spotless++; first++; continue; }
    if (awareness !== null) first += 1 - findOdds(res, awareness, aMods);
  }
  return { spotless: spotless / 20, bad: bad / 20, first: awareness === null ? null : first / 20 };
}
/** The bench's odds for a person on their gun now (the row's spotless chance; first with an armourer named; again: "Clean it again"). */
export function cleanOdds(state, pid, gunId, tempo = 'normal', { armourerId = null, again = false } = {}) {
  const gun = need(state.items?.[gunId], `no gun '${gunId}'`), r = rollerOf(state, pid);
  const a = armourerId ? rollerOf(state, armourerId) : null;
  return cleanOddsOf({ value: r.value('weapons'), mods: r.mods('weapons'), tempo, model: modelKey(gun), awareness: a ? a.value('awareness') : null, aMods: a ? a.mods('awareness') : [], foul: again ? gunField(gun, 'foul') : null });
}
/** Why a clean is struck for a person on a gun now, or null (see the header): the row's words and startActivity's refusal. */
export function cleanOff(state, pid, gunId) {
  const gun = gunId ? state.items?.[gunId] : null;
  if (!gun || gun.type !== 'gun' || ownerOf(state, gunId) !== pid) return CLEAN_WORDS.nothing;
  const b = beliefOf(state, gunId);
  if (b.stoppage || b.chamber === 'case' || b.chamber === 'dud') return CLEAN_WORDS.stoppage;
  if (b.mag !== 'out') return CLEAN_WORDS.mag;
  if (b.chamber !== 'empty') return CLEAN_WORDS.chamber;
  return null;
}
// (a line in the log, the bench's: none voiced)
const note = (state, bus, pid, gunId, text, tone = 'note') => logEntry(state, bus, { kind: 'note', tone, text, step: 'clean', gun: gunId, who: pid, area: state.places?.live?.area ?? undefined });
/**
 * The strip (see the header): a round the belief missed out of the chamber onto the mat. Returns { found: 'live' | 'dud' | 'case' |
 * null }; nothing written ungated.
 */
export function cleanStart(state, bus, pid, gunId) {
  const gun = state.items?.[gunId];
  if (!upkeepOn(state) || !gun) return { found: null };
  const ch = gunField(gun, 'chamber');
  if (!ch) return { found: null };
  delete gun.chamber; delete gun.load; delete gun.set;
  gun.belief = { ...(gun.belief ?? {}), chamber: 'empty' };
  delete gun.belief.stoppage;
  note(state, bus, pid, gunId, ch === 'live' ? CLEAN_WORDS.round : ch === 'dud' ? CLEAN_WORDS.dud : CLEAN_WORDS.caseOut, ch === 'case' ? 'note' : 'warn');
  return { found: ch };
}
/** The bench's roll and what it leaves (see the header): { grade, margin, residual, fault, disaster, roll }, or null ungated. */
export function cleanEnd(state, bus, pid, gunId, { tempo = 'normal', again = false } = {}) {
  const gun = state.items?.[gunId];
  if (!upkeepOn(state) || !gun) return null;
  tempoOf(tempo);
  const n = gun.cleans ?? 0, model = modelKey(gun), ms = state.clock.ms;
  const roller = rollerOf(state, pid, { ms });
  const r = check(stream(state.meta.seed, 'clean', gunId, n), { skill: 'weapons', value: roller.value('weapons'), dc: need(CLEAN_DC[model], `no clean for '${model}'`),
    mods: roller.mods('weapons'), tempo, pressure: 'none', procedure: true, by: pid, verb: null });
  // ("Clean it again" never adds carbon: the lesser of the residual and what the rifle had; the header)
  const residual = again ? Math.min(gunField(gun, 'foul'), residualOf(r.margin)) : residualOf(r.margin), bad = isBad(r.grade);
  delete gun.dust; delete gun.frost;
  field(gun, 'foul', residual);
  gun.lube = CLEAN_LUBE;
  field(gun, 'lubeRd', gunField(gun, 'rounds'));
  gun.cleans = n + 1;
  delete gun.barrelC; delete gun.heatMs;
  if (bad) gun.fault = 'pin';
  for (const [id, m] of Object.entries(state.items)) if (m?.type === 'mag' && m.dust !== undefined && ownerOf(state, id) === pid) delete m.dust;
  soil(state, pid, { k: HANDS.CLEAN, why: 'rifle' }, ms, bus);
  const area = state.places?.live?.area ?? undefined;
  logEntry(state, bus, { kind: 'roll', tone: r.ok || r.routine ? 'note' : 'warn', roll: r, step: again ? 'clean-again' : 'clean', gun: gunId, who: pid, area });
  bus?.emit('roll', { roll: r, who: pid });
  if (bad) note(state, bus, pid, gunId, CLEAN_WORDS.pin, 'warn');
  note(state, bus, pid, gunId, CLEAN_WORDS.check);
  return { grade: r.grade, margin: r.margin, residual, fault: bad ? 'pin' : null, disaster: r.grade === 'disaster', roll: r };
}
/** The armourer fits a firing pin retaining pin (the 'pin' verdict's chit): the fault cleared. Gated; writes the gun. */
export function fitPin(state, gunId) {
  const gun = state.items?.[gunId];
  if (upkeepOn(state) && gun) delete gun.fault;
}

// ---- the window ----

/** The armourer's number for a gun's condition, two decimals ("0.93"). */
export const condNumber = (gun) => (Math.round((gun?.cond ?? 0.95) * 100) / 100).toFixed(2);
/**
 * The armourer's look at the window (see the header): { verdict: 'pass' | 'again' | 'pin' | 'keep', total, dc, roll, cond, words }.
 * Pure: the same gun after the same cleans draws the same roll.
 */
export function inspect(state, gunId, { armourerId } = {}) {
  const gun = need(state.items?.[gunId], `no gun '${gunId}'`), cond = condNumber(gun);
  const total = q(gunField(gun, 'foul') + gunField(gun, 'dust'), 1e-6);
  if ((gun.cond ?? 0.95) < KEEP_COND) return { verdict: 'keep', total, dc: null, roll: null, cond, words: INSPECT_WORDS.keep };
  if (gun.fault === 'pin') return { verdict: 'pin', total, dc: null, roll: null, cond, words: INSPECT_WORDS.pin };
  const dc = findDcOf(total);
  if (dc === null) return { verdict: 'pass', total, dc: null, roll: null, cond, words: `${INSPECT_WORDS.pass} Condition ${cond}.` };
  const a = rollerOf(state, need(armourerId, 'an inspection with no armourer'));
  const roll = check(stream(state.meta.seed, 'inspect', gunId, gun.cleans ?? 0, armourerId), { skill: 'awareness', value: a.value('awareness'), dc, mods: a.mods('awareness'), pressure: 'none', procedure: false, by: armourerId });
  if (!roll.ok) return { verdict: 'pass', total, dc, roll, cond, words: `${INSPECT_WORDS.pass} Condition ${cond}.` };
  return { verdict: 'again', total, dc, roll, cond, words: gunField(gun, 'foul') >= gunField(gun, 'dust') ? INSPECT_WORDS.carbon : INSPECT_WORDS.grit };
}
