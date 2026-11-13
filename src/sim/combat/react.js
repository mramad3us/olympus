// OLYMPUS sim: the take-in, the one helper of how long a marine takes to take in a person or a target he has just seen (COMBAT §25.4.2, §25.4.3; the build sheet 0.0.8 §2.1, §4, §8 items 2, 5, 6, 8).
//
// The take-in is the time from the first tick a person is seen to the moment the marine has taken them in and
// can act on a choice; it is paid before the pause, with the world running at 1:1 (COMBAT §25.4.1, §25.4.5).
// One formula, here and nowhere else (tests/syntax.test.mjs REACT_HOME: no other module defines a name with
// "take in" or "react … ms" in it, as skills.js is the one home of the pace):
//     takeIn = ticks( max(EXPECT[e].floorMs, coreMs(WF) × EXPECT[e].k × NOTICE_K[grade] × whoK × severalK(n)
//                         × stanceK × lightK × bodyK × behindK) + SUPP_MS × band )
//     coreMs(WF) = TAKEIN_FLOOR_MS 30 + TAKEIN_SPAN_MS 700 × (1 − min(WF, 100) / 100) ^ TAKEIN_EXP 2
//     ticks(ms) = max(1, round(ms / TICK_MS)) × TICK_MS          (one tick, 50 ms, the least: "sub .1 s")
// Warfighting is combat experience (SKILLS §4.2), quadratic so the first tour is felt and the last points are
// hard (the power law of practice). The expectation (EXPECT): 'sector' ×1 (the bearing within SECTOR_HALF_DEG
// 20° of a held sector), 'area' ×1.5 (a room he is clearing: none this round), 'alert' ×2 with a floor of
// ALERT_FLOOR_MS 150 (an exercise running, or a threat known), 'surprise' ×3 with a floor of SURPRISE_FLOOR_MS
// 250 (nothing expected: nobody beats simple reaction time; COMBAT §25.16 question 12's default). The dice: an
// Awareness check against NOTICE_DC0 8 + round(range / 10 m), +4 behind, −2 in a held sector, on its own
// stream (stream(seed, 'combat:notice', pid, contactId, seenMs)), graded as SKILLS §5.6 (a natural 1 a miss at
// least): pass, good and superb ×1, a miss ×1.5, bad ×2, a disaster ×3, a multiplier, so a tier one's natural
// 1 costs a tick. The other terms: whoK 1.5 for a face whose hands are hidden (none this round), severalK
// 1 + 0.15 × log2(n) for n taken in at one pause (Hick and Hyman), stanceK (Relaxed 1.25, Combat 1, Assault
// 1.1: Combat this round), lightK 1 + 0.4 × (1 − min(1, Le / 0.6)) (Piéron; 1 on the lit bay this round),
// bodyK 1 + 0.06 × −Σ the roller's Awareness modifiers at most ×2 (tired 1.06, exhausted 1.18), behindK 1.3
// outside the view cone, and SUPP_MS 200 a suppression band, added (0.0.9: felt's band, supp.js bandN, which contact.js
// passes as contact.band, fixed at the window's first sighting; the chaos's own Awareness entry is left out of bodyK,
// its band being its term here, and kept on the notice roll, the one list).
//
// On a course of fire the muzzle at the ready is a held sector (the build sheet's §8 item 5: COMBAT §25.4.2's
// "an aim held on a point", widened to low and high ready), refreshed by the coach's latest command (R.cmd.atMs)
// or a cue the scene notes (R.cueAtMs: a turn re-armed after "Out of it") and held VIGIL_MS 30 s; off a course only
// an aim holds one. So on the bay's 7 m line a neighbouring lane's turner,
// 23.2° off your muzzle, is 'alert' (the private 1.05 s) and your own lane's 'sector' (0.55 s); from the 10 m
// line the neighbours are 16.7° off, in your sector. A window with several targets takes the slowest
// expectation of them, severalK by their number and the worst whoK (§8 item 6); its notice check is the first
// target's (the one that drew the eye), so a target joining the window never re-rolls it (my call).
//
// takeInOf(inputs) is the formula on plain numbers, with its parts in the log's words (the terms ≠ 1, and
// Warfighting's core always); takeInMs(state, pid, contact) gathers the inputs from the state (the sheet's
// Warfighting, the roller's Awareness and its modifiers, the muzzle, the eyes' cone) and rolls the notice
// check; expectOf(state, pid, target, ms) is one target's expectation. takeInWords(ms) is the one formatter of
// the quantity ('0.55'): the stamp, the plaque, the line, the paper, the log and the card read it, so the
// quantity shows one number on every screen (CLAUDE.md). goMs(WF) = max(GO_MIN_MS 150, GO_BASE_MS 250 − WF) is
// the body's go: how long an untrained marine's feet carry on before they stop (COMBAT §25.4.5).
// 0.0.12 (the build sheet 0.0.12 §2.2, §4, §8 items 6, 14, 25; COMBAT §25.4.2, §25.9): the terms built. stanceK reads the
// actor's movement stance (actor.moveStance): Relaxed ×1.25 only when it is set and the rifle is slung, Assault ×1.1 below
// rung 2 (templates.js rungOf), else ×1 (absent: the built ×1, so the shipped scenes do not move). lightK reads the light
// at the first target (places/light.js lightLevel: the lit bay and lit rooms 1, room 3's dim fill 0.40 ×1.13). whoK is
// ×1.5 for a face whose hands are hidden and for the hostage card. heldSectorOf(state, pid, ms) is a sector held without
// the muzzle's rule: a Watch (the actor's watch, its spot), or a running bundle's eyes on its slot's corner (a beat's eyes:
// the entry from rung 3 and the corner's scan, src/sim/combat/bundle.js), the player's or the #2's (the house's record);
// expectOf reads it beside the muzzle's rule. state.mind.clearing (the scene's, at GO) gives 'area'.
// Pure.
import { TICK_MS } from '../../core/clock.js';
import { stream } from '../../core/rng.js';
import { q } from '../../core/num.js';
import { playerActor } from '../../core/ids.js';
import { check } from '../skills/checks.js';
import { sheetOf } from '../skills/templates.js';
import { rollerOf } from './roll.js';
import { muzzleOf, angleDiff } from '../arms/carry.js';
import { eyeOf } from '../people/perception.js';
import { rungOf } from '../skills/templates.js';
import { lightLevel } from '../places/light.js';

/** The core's terms (COMBAT §25.4.2): coreMs = TAKEIN_FLOOR_MS + TAKEIN_SPAN_MS × (1 − WF/100)^TAKEIN_EXP. */
export const TAKEIN_FLOOR_MS = 30, TAKEIN_SPAN_MS = 700, TAKEIN_EXP = 2;
/** The floors of an alert and a surprised take-in (COMBAT §25.16, question 12's default). */
export const ALERT_FLOOR_MS = 150, SURPRISE_FLOOR_MS = 250;
/** The expectations, quickest first: the factor and the floor (COMBAT §25.4.2). */
export const EXPECT = Object.freeze({
  sector: Object.freeze({ k: 1, floorMs: 0 }), area: Object.freeze({ k: 1.5, floorMs: 0 }),
  alert: Object.freeze({ k: 2, floorMs: ALERT_FLOOR_MS }), surprise: Object.freeze({ k: 3, floorMs: SURPRISE_FLOOR_MS }),
});
/** The expectations in order, quickest first (the slowest of a window's targets is its expectation). */
export const EXPECT_ORDER = Object.freeze(['sector', 'area', 'alert', 'surprise']);
/** The expectations in the log's words. */
export const EXPECT_WORDS = Object.freeze({ sector: 'your sector', area: 'a room you are clearing', alert: 'not where your muzzle was', surprise: 'a surprise' });
/** The notice check's grade as a factor (SKILLS §5.6's grades; a natural 1 a miss at least). */
export const NOTICE_K = Object.freeze({ superb: 1, good: 1, pass: 1, miss: 1.5, bad: 2, disaster: 3 });
/** The notice check's DC: NOTICE_DC0 + round(range / NOTICE_PER_M), NOTICE_BEHIND outside the cone, NOTICE_SECTOR in a held sector. */
export const NOTICE_DC0 = 8, NOTICE_PER_M = 10, NOTICE_BEHIND = 4, NOTICE_SECTOR = -2;
/** Who it might be: a face whose hands are hidden, or the hostage card (COMBAT §25.4.2; the build sheet 0.0.12 §8 item 14). */
export const WHO_K = 1.5;
/** The faces whose who-it-might-be is ×WHO_K. */
export const WHO_FACES = Object.freeze(new Set(['unknown', 'hostage']));
/** Assault's ×STANCE_K.assault holds below this rung (COMBAT §25.9: ×1 from rung 2). */
export const ASSAULT_RUNG = 2;
/** How many at once: 1 + SEVERAL_K × log2(n). */
export const SEVERAL_K = 0.15;
/** The movement stances (BODY §16.1): Relaxed, Combat, Assault (Assault ×1 from rung 2). Combat this round. */
export const STANCE_K = Object.freeze({ relaxed: 1.25, combat: 1, assault: 1.1 });
/** The light at him as the adapted eye takes it: 1 + LIGHT_K × (1 − min(1, Le / LE_FULL)). */
export const LIGHT_K = 0.4, LE_FULL = 0.6;
/** The body: 1 + BODY_K × −Σ the roller's Awareness modifiers, at most BODY_K_MAX. */
export const BODY_K = 0.06, BODY_K_MAX = 2;
/** Outside the view cone: the head turns before the eyes work. */
export const BEHIND_K = 1.3;
/** Suppression, added a band (COMBAT §5.3's bands 0 to 3: felt's, supp.js bandN, fixed at the window's first sighting). */
export const SUPP_MS = 200;
/** The bands above calm in the take-in's words (supp.js BANDS's). */
const BAND_WORDS = Object.freeze(['under fire', 'suppressed', 'pinned']);
/** A held sector: its half-angle, and how long it holds with no new cue (COMBAT §25.4.2). */
export const SECTOR_HALF_DEG = 20, VIGIL_MS = 30_000;
/** The body's go (COMBAT §25.4.5): max(GO_MIN_MS, GO_BASE_MS − WF) ms of feet carrying on. */
export const GO_BASE_MS = 250, GO_MIN_MS = 150;
const D2R = Math.PI / 180;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const r3 = (x) => q(x, 0.001);

/** Warfighting's core (unrounded ms). */
export function coreMs(wf) { return TAKEIN_FLOOR_MS + TAKEIN_SPAN_MS * (1 - Math.min(Math.max(0, wf ?? 0), 100) / 100) ** TAKEIN_EXP; }
/** A time in whole ticks, one the least. */
export function ticks(ms) { return Math.max(1, Math.round(ms / TICK_MS)) * TICK_MS; }
/** How many at once (Hick and Hyman). */
export function severalK(n) { return 1 + SEVERAL_K * Math.log2(Math.max(1, n ?? 1)); }
/** The light at him (Piéron): Le the adapted eye's light, 0 to 1. */
export function lightK(le) { return 1 + LIGHT_K * (1 - Math.min(1, Math.max(0, le ?? 1) / LE_FULL)); }
/** The body (lapses): mods the roller's Awareness modifiers ({ v } each). */
export function bodyK(mods = []) {
  const sum = (mods ?? []).reduce((a, m) => a + (m?.v ?? 0), 0);
  return Math.min(BODY_K_MAX, Math.max(1, 1 + BODY_K * -sum));
}
/** The body's go: how long an untrained marine's feet carry on in a window (ms). */
export function goMs(wf) { return Math.max(GO_MIN_MS, GO_BASE_MS - Math.round(wf ?? 0)); }
/** The one formatter of the quantity: two decimals of a second ('0.55'). */
export function takeInWords(ms) { return (Math.max(0, ms ?? 0) / 1000).toFixed(2); }

/**
 * The formula on plain numbers (see the header): { ms, rawMs, parts }. parts in the log's words: Warfighting's
 * core always ({ why: 'Warfighting 15', ms: 536 }), then each term ≠ 1 ({ why, k }), a floor that binds
 * ({ why, ms }) and suppression ({ why: 'under fire', ms }).
 */
export function takeInOf({ wf, expect = 'surprise', grade = 'pass', n = 1, whoK = 1, stanceK = 1, lightK: lk = 1, bodyK: bk = 1, behindK = 1, band = 0 }) {
  const E = EXPECT[expect] ?? EXPECT.surprise, core = coreMs(wf), nk = NOTICE_K[grade] ?? 1, sk = severalK(n);
  const raw = core * E.k * nk * whoK * sk * stanceK * lk * bk * behindK;
  const floored = Math.max(E.floorMs, raw);
  const ms = ticks(floored + SUPP_MS * Math.max(0, band | 0));
  const parts = [{ why: `Warfighting ${Math.round(wf ?? 0)}`, ms: Math.round(core) }];
  const k = (why, v) => { if (Math.abs(v - 1) > 1e-9) parts.push({ why, k: r3(v) }); };
  k(EXPECT_WORDS[expect] ?? expect, E.k);
  k(grade === 'miss' ? 'noticed late' : grade === 'bad' ? 'slow to notice' : 'very slow to notice', nk);
  k('his hands unseen', whoK);
  k(`${n} at once`, sk);
  k(stanceK > 1.2 ? 'relaxed' : 'at a lope', stanceK);
  k(lk >= 1.25 ? 'in the dark' : 'in dim light', lk);
  k(bk >= 1.15 ? 'exhausted' : 'tired', bk);
  k('behind you', behindK);
  if (E.floorMs && raw < E.floorMs) parts.push({ why: `at least ${takeInWords(E.floorMs)} s, ${expect === 'alert' ? 'alert' : 'surprised'}`, ms: E.floorMs });
  if (band > 0) parts.push({ why: BAND_WORDS[Math.min(3, band | 0) - 1], ms: SUPP_MS * band });
  return { ms, rawMs: Math.round(floored + SUPP_MS * Math.max(0, band | 0)), parts };
}

// (a range session that is a course of fire running: the line open)
const courseOf = (state) => { const R = state.armoury?.range; return R && !R.end ? R : null; };
// (whether the side knows a threat: PEOPLE's threat board, when it is built; none on the bay)
const threatKnown = (state) => !!state.mind?.threat?.known;

/**
 * One target's expectation for a person at ms (see the header): 'sector' when its bearing lies within
 * SECTOR_HALF_DEG of the muzzle's yaw with the rifle in the hands (aimed anywhere; at low or high ready on a
 * course of fire, within VIGIL_MS of the coach's latest command); 'area' when clearing (none this round);
 * 'alert' on a course of fire or with a threat known; else 'surprise'.
 */
export function expectOf(state, pid, target, ms = state.clock.ms) {
  const R = courseOf(state);
  // (0.0.12: a Watch or a bundle's eyes hold a sector without the muzzle's rule (see the header))
  const H = target ? heldSectorOf(state, pid, ms) : null;
  if (H) {
    const a = actorOfPid(state, pid), b = Math.atan2(target.z - (a?.z ?? 0), target.x - (a?.x ?? 0));
    if (Math.abs(angleDiff(b, H.yawRad)) <= SECTOR_HALF_DEG * D2R + 1e-9) return 'sector';
  }
  const m = target ? muzzleOf(state, pid) : null;
  if (m && m.inHand) {
    const cue = Math.max(R?.cmd?.atMs ?? -Infinity, R?.cueAtMs ?? -Infinity);
    const held = m.posture === 'aimed' || (R && (cue === -Infinity || ms - cue <= VIGIL_MS));
    const bearing = Math.atan2(target.z - m.oz, target.x - m.ox);
    if (held && Math.abs(angleDiff(bearing, m.yawRad)) <= SECTOR_HALF_DEG * D2R + 1e-9) return 'sector';
  }
  if (state.mind?.clearing) return 'area';
  if (R || threatKnown(state)) return 'alert';
  return 'surprise';
}

// (a person's actor: the player's or an NPC's)
const actorOfPid = (state, pid) => (playerActor(state)?.who === pid ? playerActor(state) : state.actors?.list?.find(a => a.who === pid) ?? null);

/**
 * A sector held without the muzzle's rule (see the header): { yawRad, why: 'watch' | 'bundle' } or null. A Watch is the
 * actor's (its spot's bearing from where he stands now); a bundle's eyes are its running beat's (the slot's corner).
 */
export function heldSectorOf(state, pid, ms = state.clock.ms) {
  const a = actorOfPid(state, pid);
  if (!a) return null;
  if (a.watch && Number.isFinite(a.watch.x)) return { yawRad: Math.atan2(a.watch.z - a.z, a.watch.x - a.x), why: 'watch' };
  const two = state.armoury?.range?.house?.two;
  const d = state.stop?.who === pid ? state.stop?.doing : two?.pid === pid ? two.doing : null;
  const b = d?.beats?.find(x => x.st === 'run' && x.eyes);
  return b ? { yawRad: Math.atan2(b.eyes[1] - a.z, b.eyes[0] - a.x), why: 'bundle' } : null;
}

/** The stance's factor for a person now (see the header): Relaxed with the rifle slung 1.25, Assault below rung 2 1.1, else 1. */
export function stanceKOf(state, pid) {
  const a = actorOfPid(state, pid), s = a?.moveStance;
  if (s === 'relaxed') { const p = state.people?.[pid]?.kit?.carry?.posture ?? 'slungFront'; return p === 'slungFront' || p === 'slungBack' ? STANCE_K.relaxed : 1; }
  if (s === 'assault') return rungOf(state, pid, 'room') < ASSAULT_RUNG ? STANCE_K.assault : 1;
  return 1;
}

// (whether a point lies outside an eye's cone: the head must turn first)
function behindOf(state, actor, x, z) {
  if (!actor) return false;
  const eye = eyeOf(state, actor);
  return Math.abs(angleDiff(Math.atan2(z - eye.z, x - eye.x), eye.headRad)) > eye.coneRad;
}

/**
 * A person's take-in of a contact (see the header): contact { id, targets: [{ key, x, z, rangeM, face }],
 * seenMs, roll? (the window's notice check, when a target joins it), expect? ({ key: expectation }, given) }. Returns { ms, rawMs, expect, grade, roll,
 * parts, n, whoK, dc }.
 */
export function takeInMs(state, pid, contact) {
  const targets = contact?.targets ?? [], seenMs = contact?.seenMs ?? state.clock.ms;
  const sheet = sheetOf(state, pid), wf = sheet?.os ?? 0, roller = rollerOf(state, pid, { ms: seenMs });
  const me = playerActor(state)?.who === pid ? playerActor(state) : state.actors?.list?.find(a => a.who === pid) ?? null;
  let expect = 'sector', whoK = 1;
  // (an expectation given by the contact (contact.expect, by key): the shoot house's #2 covering your sector takes in the man you
  // bracketed as his sector's, your others as the room's (COMBAT §25.19.6); every other contact reads it as built)
  const each = targets.map(t => ({ t, e: contact?.expect?.[t.key] ?? expectOf(state, pid, t, seenMs) }));
  for (const { t, e } of each) {
    if (EXPECT_ORDER.indexOf(e) > EXPECT_ORDER.indexOf(expect)) expect = e;
    if (WHO_FACES.has(t.face)) whoK = Math.max(whoK, WHO_K);
  }
  if (!each.length) expect = 'surprise';
  // (the notice check: the first target's, the one that drew the eye)
  const first = each[0] ?? null, rangeM = first ? first.t.rangeM ?? Math.hypot(first.t.x - (me?.x ?? 0), first.t.z - (me?.z ?? 0)) : 0;
  const behind = first ? behindOf(state, me, first.t.x, first.t.z) : false;
  const dcParts = [{ why: 'base', v: NOTICE_DC0 }, { why: `${Math.round(rangeM)} m`, v: Math.round(rangeM / NOTICE_PER_M) }];
  if (behind) dcParts.push({ why: 'behind you', v: NOTICE_BEHIND });
  if (first && first.e === 'sector') dcParts.push({ why: 'your sector', v: NOTICE_SECTOR });
  const parts0 = dcParts.filter(p => p.v);
  const dc = parts0.reduce((a, p) => a + p.v, 0);
  const mods = roller.mods('awareness', { ms: seenMs });
  // (0.0.9: the chaos is its band below (SUPP_MS), so its entry on the notice roll is left out of the body's lapses)
  const lapses = mods.filter(m => m.felt === undefined);
  // (a window's notice check, given: a target joining it never re-rolls it)
  const roll = contact?.roll ?? check(stream(state.meta.seed, 'combat:notice', pid, contact?.id ?? 0, seenMs), { skill: 'awareness', value: roller.value('awareness'), dc, mods,
    pressure: 'evaluated', by: pid, dcParts: parts0, verb: null });
  const n = Math.max(1, targets.length);
  // (0.0.12: the stance and the light at the first target (see the header))
  const lk = first ? lightK(lightLevel(state, first.t.x, first.t.z, seenMs)) : 1;
  // (a caught 1 on the notice (SKILLS §5.1) costs the take-in its ×1.5 as a natural 1 always did: its figure unchanged, its words the catch's)
  const t = takeInOf({ wf, expect, grade: roll.caught ? 'miss' : roll.grade, n, whoK, stanceK: stanceKOf(state, pid), lightK: lk, bodyK: bodyK(lapses), behindK: behind ? BEHIND_K : 1, band: contact?.band ?? 0 });
  return { ms: t.ms, rawMs: t.rawMs, expect, expects: Object.fromEntries(each.map(({ t: x, e }) => [x.key, e])), grade: roll.grade, roll, parts: t.parts, n, whoK, dc: roll.dc ?? dc };
}

/** A take-in's words for the log (see contact.js's last.words): "Taken in in 0.55 s: 0.54 (Warfighting 15) × 1 (your sector); Awareness 6 + 14 = 20 against 7, noticed." */
export function takeInText({ ms, expect, parts = [], roll = null }) {
  const terms = parts.map(p => (p.k !== undefined ? `× ${p.k} (${p.why})` : p.why.startsWith('Warfighting') ? `${takeInWords(p.ms)} (${p.why})` : `${p.why.startsWith('at least') ? '' : '+ '}${takeInWords(p.ms)} (${p.why})`));
  if (!parts.some(p => p.why === EXPECT_WORDS[expect])) terms.splice(1, 0, `× ${EXPECT[expect]?.k ?? 1} (${EXPECT_WORDS[expect] ?? expect})`);
  let text = `Taken in in ${takeInWords(ms)} s: ${terms.join(' ')}`;
  if (roll) {
    const mods = (roll.mods ?? []).map(m => ` ${m.v < 0 ? '− ' + -m.v : '+ ' + m.v} (${m.why})`).join('');
    const end = roll.caught ? 'caught, noticed late' : roll.grade === 'miss' ? 'noticed late' : roll.grade === 'bad' ? 'slow to notice' : roll.grade === 'disaster' ? 'very slow to notice' : 'noticed';
    text += `; Awareness ${roll.value} + ${roll.roll}${mods} = ${roll.total} against ${roll.dc}${roll.nat === 1 ? ', a natural 1' : roll.nat === 20 ? ', a natural 20' : ''}, ${end}`;
  }
  return `${text}.`;
}

/** The wanted shape of a pending window's progress, 0 at the sighting to 1 at its end (the brackets' k). */
export function windowK(pending, ms) {
  if (!pending) return 0;
  const span = pending.untilMs - pending.seenMs;
  return span > 0 ? clamp01((ms - pending.seenMs) / span) : 1;
}
