// OLYMPUS body: the readers, the body as the character feels it: felt bands, cues for the figure and the doll, the strip, the words (BODY §23.1; VIEWS §7.6, §8.2; the build sheet 0.0.4 §2.1).
//
// The body reports in sensations, never numbers (BODY §23.1; "we only know what we know", tradecraft
// 2026-10-26). stagesOf(body, ms, lonEDeg) gives each ledger's felt band, { band, i, tone, words, fill }
// (i 0 is fine), for hunger, thirst, the bladder, the bowel, hygiene, fatigue (on the effective
// pressure, the body clock's term at ms), stamina, stubble, stress and morale: the instinct, the
// strip, the sheet and the late card read the same bands, by the one helper (the hub). cuesOf gives
// the stage and the doll what to draw, each 0 to 1: wetK (wet hair fading over its 20 minutes),
// grimeK, sweatK, tiredK (½ at the tired line: the head drops a pixel, the eyelids grow heavy), stubbleK,
// bladderK (½ between need and urgent: knees in, a hand at the belt from 0.6), hungerK (a hand on the
// stomach from 0.6, hungry), thirstK. stripOf is VIEWS §7.6's nine pictograms in their order, each
// filled from the bottom to its band (fill 0 to 5) with its tone; heat, air and pain fill 0 this
// round (thermal is indoors and steady; the air and wounds come later). wordsOf is the sheet's line
// (VIEWS §8.2, BODY's belief in words: "Fed two hours ago; thirsty.", "Fresh. Hair wet.") and each
// need's words. A body without a beard (hasBeard: a woman's) has no stubble stage past 0, no stubbleK
// and no Shave row in the words. A record may be given whole or as its saved deltas. The site's longitude places the
// body clock, and every reader takes it: a missing or non-finite lonEDeg throws (TECH §1.4: no quiet Melas; the
// callers pass the live site's, places/model.js lonOf, which throws off Mars's clock in turn).
// 0.0.6: the hands (the build sheet 0.0.6 §2.2): stagesOf's hands band, its words naming the last soiling
// from dirty on ("Dirty hands, since the head.", "Gun oil and carbon on your hands.", "Regolith ground into
// your palms."; handsWords), cuesOf's handsK (dirt / 100) and handsWhy for the doll, and the words' hands row.
// 0.0.7 (the build sheet 0.0.7 §2.2; src/sim/body/wounds.js): the wounds in words, never a number, for C
// and the instinct: woundWords (each wound and how it bleeds, the blood's band felt, the pain's band,
// down), woundLine (the body line's first say, BODY §23.2's order: an artery or a bleed of 8 %/min or more,
// collapsed or in shock, a bleed of 0.8, pain), and the strip's pain cell filled by the pain's band
// (fine 0, in pain 2, bad pain 3, agony 5). An unwounded body reads as before, word for word.
// Pure.
import { HUNGER, THIRST, BLADDER_BANDS, BOWEL_BANDS, GRIME_BANDS, FATIGUE_BANDS, STAMINA_BANDS, STUBBLE_BANDS, STRESS_BANDS, MORALE_BANDS, HYGIENE, HANDS_BANDS } from '../../data/body/needs.js';
import { HOUR_MS, MIN_MS } from '../../core/clock.js';
import { withDefaults, hasBeard } from './record.js';

export { hasBeard };
import { massOf, hungerIndex } from './energy.js';
import { thirstPct, thirstIndex } from './water.js';
import { bladderIndex, bowelIndex, bowelLowerG } from './elimination.js';
import { grimeIndex, stubbleIndex, handsIndex } from './hygiene.js';
import { phiOf, circ, fatigueIndex, lonMsOf } from './sleep.js';
import { stressIndex, moraleIndex } from './stress.js';
import { stageOf } from './thermal.js';
import { woundWords, painOf, painBand, bandOf, bleeding, hasWounds, LIMB_CAP_PM } from './wounds.js';

export { woundWords };

// (the site's east longitude every reader is given: required, never a default)
const lonNeed = (lonEDeg, who) => { if (!Number.isFinite(lonEDeg)) throw new Error(`${who}(): the site's east longitude (places/model.js lonOf), not ${lonEDeg}`); return lonEDeg; };
/** VIEWS §7.6's strip, in its order. */
export const STRIP_NEEDS = Object.freeze(['water', 'food', 'bladder', 'bowel', 'sleep', 'grime', 'heat', 'air', 'pain']);

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const staminaIndex = (v) => { for (let i = STAMINA_BANDS.length - 1; i >= 1; i--) if (v < STAMINA_BANDS[i].below) return i; return 0; };
const stage = (bands, i) => { const b = bands[i]; return { band: b.id, i, tone: b.tone, words: b.words, fill: b.fill }; };

// (the hands' words by band and the last soiling: from dirty on, the cause named; my calls)
const HANDS_WHY = Object.freeze({
  head: Object.freeze(['Clean hands.', 'Your hands could do with a wash.', 'Dirty hands, since the head.', 'Grimy hands, since the head.']),
  stall: Object.freeze(['Clean hands.', 'Your hands could do with a wash.', 'Dirty hands, since the stall.', 'Filthy hands, since the stall.']),
  food: Object.freeze(['Clean hands.', 'Crumbs on your fingers.', 'Sticky fingers.', 'Grimy, sticky hands.']),
  rifle: Object.freeze(['Clean hands.', 'A smear of gun oil on your fingers.', 'Gun oil and carbon on your hands.', 'Black with gun oil and carbon.']),
  regolith: Object.freeze(['Clean hands.', 'Red dust in the creases of your hands.', 'Regolith ground into your palms.', 'Regolith ground into your palms, red to the wrists.']),
});
/** The hands' words at a band index and a cause ('head', 'stall', 'food', 'rifle', 'regolith', or null: the band's own). */
export const handsWords = (i, why) => HANDS_WHY[why]?.[i] ?? HANDS_BANDS[i]?.words ?? '';

/** The body's effective sleep pressure at ms (BODY §7.3): the pressure and the body clock's term. */
export function pEffOf(body, ms, lonEDeg) {
  lonNeed(lonEDeg, 'pEffOf');
  const b = withDefaults(body);
  return b.sleep.pressureH + circ(phiOf(ms, lonMsOf(lonEDeg), b.sleep.offsetH));
}

/** Each ledger's felt band at ms (see the header). */
export function stagesOf(body, ms, lonEDeg) {
  lonNeed(lonEDeg, 'stagesOf');
  const b = withDefaults(body), lonMs = lonMsOf(lonEDeg), phi = phiOf(ms, lonMs, b.sleep.offsetH), mass = massOf(b);
  const e = b.energy;
  return {
    hunger: stage(HUNGER, hungerIndex(e.gutKcal, e.emptyH, e.reserveKcal)),
    thirst: stage(THIRST, thirstIndex(thirstPct(b.water.balanceL, mass))),
    bladder: stage(BLADDER_BANDS, bladderIndex(b.bladder.ml)),
    bowel: stage(BOWEL_BANDS, bowelIndex(b.bowel.g, bowelLowerG(b.bowel.reflexUntilMs, ms, phi))),
    hygiene: stage(GRIME_BANDS, grimeIndex(b.hygiene.grime)),
    fatigue: stage(FATIGUE_BANDS, fatigueIndex(b.sleep.pressureH + circ(phi))),
    stamina: stage(STAMINA_BANDS, staminaIndex(b.stamina)),
    stubble: stage(STUBBLE_BANDS, hasBeard(b) ? stubbleIndex(b.hygiene.stubbleH) : 0),
    stress: stage(STRESS_BANDS, stressIndex(b.stress.v)),
    morale: stage(MORALE_BANDS, moraleIndex(b.morale.v)),
    hands: handsStage(b),
  };
}
// (the hands' stage, its words naming the cause)
function handsStage(b) {
  const i = handsIndex(b.hands?.dirt ?? 0), st = stage(HANDS_BANDS, i);
  st.words = handsWords(i, b.hands?.why ?? null);
  return st;
}

const HUNGER_K = Object.freeze([0, 0.2, 0.6, 0.8, 1, 1, 1]);
/** What the figure and the doll draw, each 0 to 1 (see the header). */
export function cuesOf(body, ms, lonEDeg) {
  lonNeed(lonEDeg, 'cuesOf');
  const b = withDefaults(body), h = b.hygiene, wet = h.wetUntilMs !== null && h.wetUntilMs !== undefined && ms < h.wetUntilMs ? (h.wetUntilMs - ms) / HYGIENE.WET_HAIR_MS : 0;
  const e = b.energy;
  return {
    wetK: clamp01(wet), grimeK: clamp01(h.grime / 100), sweatK: clamp01((h.sweatL ?? 0) / 0.5),
    tiredK: clamp01((pEffOf(b, ms, lonEDeg) - 12) / 8), stubbleK: hasBeard(b) ? clamp01(h.stubbleH / 48) : 0,
    bladderK: clamp01((b.bladder.ml - 200) / 500), hungerK: HUNGER_K[hungerIndex(e.gutKcal, e.emptyH, e.reserveKcal)] ?? 1,
    thirstK: clamp01(thirstPct(b.water.balanceL, massOf(b)) / 6),
    handsK: clamp01((b.hands?.dirt ?? 0) / 100), handsWhy: b.hands?.why ?? null,
  };
}

/** VIEWS §7.6's strip: [{ need, band, fill, tone }] in STRIP_NEEDS's order. */
export function stripOf(body, ms, lonEDeg) {
  lonNeed(lonEDeg, 'stripOf');
  const s = stagesOf(body, ms, lonEDeg), b = withDefaults(body), cold = stageOf(b.thermal.coreC);
  const of = (need, st) => ({ need, band: st.band, fill: st.fill, tone: st.tone });
  return [
    of('water', s.thirst), of('food', s.hunger), of('bladder', s.bladder), of('bowel', s.bowel), of('sleep', s.fatigue), of('grime', s.hygiene),
    { need: 'heat', band: cold?.id ?? 'fine', fill: 0, tone: cold ? (cold.v <= -3 ? 'urgent' : 'warn') : 'fine' },
    { need: 'air', band: 'fine', fill: 0, tone: 'fine' }, painCell(b, ms),
  ];
}
const PAIN_FILL = Object.freeze({ 'in pain': [2, 'warn'], 'bad pain': [3, 'warn'], agony: [5, 'urgent'] });
// (the strip's pain cell: the pain's band felt now)
function painCell(b, ms) {
  const band = hasWounds(b) ? painBand(painOf(b, ms)) : null, f = band ? PAIN_FILL[band.word] : null;
  return f ? { need: 'pain', band: band.word, fill: f[0], tone: f[1] } : { need: 'pain', band: 'fine', fill: 0, tone: 'fine' };
}
/** The body line's say on wounds at ms (BODY §23.2's order), or null: { tone, text }. Never a number. */
export function woundLine(body, ms) {
  const b = withDefaults(body);
  if (!hasWounds(b) || b.dead) return null;
  const on = (b.injuries ?? []).filter(i => i.bleed > ms && !i.internal && !i.cared);
  const hard = on.find(i => i.artery || (i.rate ?? 0) >= LIMB_CAP_PM);
  if (hard) return { tone: 'urgent', text: `Bleeding hard from ${hard.name.replace(/^an? /, 'the ')}: a tourniquet, now.` };
  const band = bandOf(b, ms);
  if (band === 'collapsed' || band === 'shock') return { tone: 'urgent', text: 'Going into shock: lie flat, keep warm, call the corpsman.' };
  if (on.some(i => (i.rate ?? 0) >= 0.8)) return { tone: 'warn', text: 'Bleeding: press on it.' };
  if (bleeding(b, ms) && on.length) return { tone: 'warn', text: 'Still bleeding: keep pressure on.' };
  const pain = painBand(painOf(b, ms));
  return pain ? { tone: 'note', text: pain.word === 'agony' ? 'The pain is everything.' : 'It hurts. Keep still.' } : null;
}

const NUMBER = Object.freeze(['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']);
/** "Fed two hours ago" from the last meal's time (the sheet's words; no clock reading). */
export function fedPhrase(ateMs, ms) {
  if (!Number.isFinite(ateMs)) return 'Fed';
  const min = (ms - ateMs) / MIN_MS, h = Math.round((ms - ateMs) / HOUR_MS);
  if (min < 15) return 'Fed just now';
  if (min < 45) return 'Fed half an hour ago';
  if (h <= 1) return 'Fed an hour ago';
  return h <= 12 ? `Fed ${NUMBER[h]} hours ago` : 'Fed, a long while ago';
}
const lower = (w) => w.replace(/\.$/, '').replace(/^./, c => c.toLowerCase());
/** The sheet's words (VIEWS §8.2): { line, needs: [{ need, band, words }] }. */
export function wordsOf(body, ms, lonEDeg) {
  lonNeed(lonEDeg, 'wordsOf');
  const b = withDefaults(body), s = stagesOf(b, ms, lonEDeg), wet = cuesOf(b, ms, lonEDeg).wetK > 0;
  const food = s.hunger.i === 0 ? fedPhrase(b.energy.ateMs, ms) : s.hunger.words.replace(/\.$/, '');
  const order = [['bladder', s.bladder], ['bowel', s.bowel], ['water', s.thirst], ['sleep', s.fatigue], ['grime', s.hygiene], ['hands', s.hands], ['stubble', s.stubble], ['stamina', s.stamina], ['stress', s.stress], ['morale', s.morale]];
  const notes = order.filter(([, st]) => st.tone !== 'fine' && st.words).map(([, st]) => lower(st.words));
  let line;
  if (notes.length) line = `${food}; ${notes.join('; ')}.`;
  else {
    const fresh = [s.hygiene.i === 0 ? 'Fresh.' : null, wet ? 'Hair wet.' : null].filter(Boolean);
    line = s.hunger.i > 0 || !fresh.length ? [`${food}.`, ...fresh].join(' ') : fresh.join(' ');
  }
  const needs = [['food', s.hunger], ...order].filter(([need]) => need !== 'stubble' || hasBeard(b)).map(([need, st]) => ({ need, band: st.band, words: st.words }));
  if (wet) needs.push({ need: 'hair', band: 'wet', words: 'Hair wet.' });
  return { line, needs };
}
