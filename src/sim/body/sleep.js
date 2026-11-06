// OLYMPUS body: sleep pressure, the body clock across Mars's timeslip, falling asleep and waking, and fatigue's penalties (BODY §7; the build sheet 0.0.4 §2.1, §4, §8 item 9).
//
// Sleep pressure (BODY §7.1) is Borbély's process S made linear, in hours-equivalent: awake it builds
// 1.0 an hour (×1.3 at a MET over 4, ×1.1 at stress 50 or more, ×1.2 with the core over 38 °C); asleep
// it clears `clearH × depthK` an hour, `clearH = (24 − sleepNeedH)/sleepNeedH × quality` (2.0 at an 8 h
// need and a perfect night), floored at 0. depthK, the deeper night after a long day, `1 + 0.5 ×
// max(0, p − 16)/16`, is fixed when sleep begins. Quality is the product of BODY §7.1's factors this
// round has: the body's hour (1.0 in 22:00 to 08:00, 0.85 to 12:00, 0.75 to 18:00, 0.6 in the
// wake-maintenance zone 18:00 to 22:00), the bed (your own rack 1.0, its first two nights 0.9, another
// rack 0.9, a seat 0.6), very hungry 0.85, a bladder of 400 mL 0.8, cold 0.6, hot 0.7; clamped 0.3 to
// 1. Falling asleep (sleepBegin) takes `10 + 40 × (1 − min(1, pEff/14))` minutes, doubled in the
// wake-maintenance zone (as a rate: only the minutes spent inside it count double, my call), where
// under 4 h of pressure you lie awake till it ends; fixed when you lie down. depthK is fixed when sleep
// begins, at the onset (BODY's "fixed when sleep begins": the pressure after the latency). Waking is
// natural when the pressure is down to 0.5 in the body's 05:00 to 10:00, or at 0 anywhere, or after
// 12 h asleep; else an alarm, reveille, the klaxon or the player end it
// (sleepEnd), and woken over 3 h of pressure you carry sleep inertia, −2 for 15 minutes (−3 for 30
// over 8 h).
//
// The body clock (BODY §7.2; the sheet §8, item 9): φ, the body's hour, is the site's mean solar time
// at 24 body hours a sol plus `offsetH`, so it runs smoothly where the civil clock stands at 24:00
// through the slip (TIME §2.4: φ at civil 22:00 is 21.73). Each hour on the game's hour grid the offset
// drifts by `24/τ − 24/T_day` (the body's own period τ, ~24.2 h, against the sol's 24.66) and is
// pulled back toward 0 by at most 1.5 h a day delaying (1.0 advancing) × the light (1.0 for a lit base
// on a day and night): on Mars the pull wins, and an aligned marine stays aligned (Scheer 2007). φ
// drives the night's urine, the bowel's morning, the window of natural waking, sleep quality and the
// circadian term of effective pressure (BODY §7.3): `pEff = p + circ(φ)`, circ the small-hours trough
// (+3.0 at 04:30), the afternoon dip (+1.0 at 15:00) and the lift before bedtime (−1.5 at 20:00),
// each a Gaussian whose distance wraps round the clock (my call: no step at midnight). Fatigue is
// tradecraft's user-endorsed ladder on pEff (src/sim/campaign.js fatigue(), TIRED_H 16, EXHAUSTED_H
// 20, WEAR_H 3, WORN_MAX 12, RAGGED_H 36, LOST_H 48): tired −1 from 16; exhausted from 20, −(3 +
// ⌊(pEff − 20)/3⌋) to at most −12; "dead on your feet" at 36, "seeing things" at 48.
import { SLEEP, QUALITY, QUALITY_BY_PHASE, QUALITY_BY_BED, CIRC, FATIGUE_BANDS, EXHAUSTED } from '../../data/body/needs.js';
import { SOL_MS, HOUR_MS, MIN_MS } from '../../core/clock.js';
import { MSD_EPOCH_MS, lonMs as lonMsOf } from '../../core/calendar.js';

/** Tradecraft's fatigue ladder (src/sim/campaign.js), printed beside BODY's by body-sleep. */
export const TRADECRAFT_FATIGUE = Object.freeze({ TIRED_H: 16, EXHAUSTED_H: 20, WEAR_H: 3, WORN_MAX: 12, RAGGED_H: 36, LOST_H: 48 });
/** A sol in hours (the day lived at Melas, BODY §7.2's T_day). */
export const SOL_H = SOL_MS / HOUR_MS;
export { lonMsOf };

const mod = (x, m) => ((x % m) + m) % m;
/** The body's hour φ at ms (0 to 24): the site's mean solar hour at 24 body hours a sol, plus the offset. */
export const phiOf = (ms, lonMs, offsetH = 0) => mod(24 * mod(ms + MSD_EPOCH_MS + lonMs, SOL_MS) / SOL_MS + offsetH, 24);
/** Whether φ lies in [from, to) on the clock (to past 24 wraps: [22, 32) is 22:00 to 08:00). */
export const inPhase = (phi, from, to) => (to > 24 ? phi >= from || phi < to - 24 : phi >= from && phi < to);
/** The game time, at or after ms, when φ next reads h (the offset held). */
export function msAtPhi(ms, lonMs, offsetH, h) {
  const dh = mod(h - phiOf(ms, lonMs, offsetH), 24);
  return ms + dh / 24 * SOL_MS;
}

/** The circadian term of effective pressure (BODY §7.3), hours. */
export function circ(phi) {
  let s = 0;
  for (const [a, c, w] of CIRC) { const d = mod(phi - c + 12, 24) - 12; s += a * Math.exp(-(d / w) * (d / w)); }
  return s;
}
/** Fatigue's band index in FATIGUE_BANDS by effective pressure. */
export function fatigueIndex(pEff) {
  for (let i = FATIGUE_BANDS.length - 1; i >= 1; i--) if (pEff >= FATIGUE_BANDS[i].h) return i;
  return 0;
}
/** What fatigue costs every roll (BODY §7.3): 0, −1 tired, −(3 + ⌊(pEff − 20)/3⌋) exhausted, at most −12. */
export function fatigueMod(pEff) {
  if (pEff >= FATIGUE_BANDS[2].h) return -Math.min(EXHAUSTED.MAX, EXHAUSTED.BASE + Math.floor((pEff - FATIGUE_BANDS[2].h) / EXHAUSTED.WEAR_H));
  if (pEff >= FATIGUE_BANDS[1].h) return -1;
  return 0;
}

/** Whether the sleep record has the body asleep at t. */
export const asleepAt = (sleep, t) => !!sleep.bed && sleep.fallMs !== null && sleep.fallMs !== undefined && t >= sleep.fallMs && (sleep.wokeMs === null || sleep.wokeMs === undefined);

/** Sleep quality at a rate point (BODY §7.1's factors this round), 0.3 to 1. */
export function qualityOf({ phi, bed, berthNights = 99, hungerI = 0, ml = 0, coreC = 37 }) {
  let q = 1;
  for (const [from, to, k] of QUALITY_BY_PHASE) if (inPhase(phi, from, to)) { q *= k; break; }
  q *= QUALITY_BY_BED[bed] ?? QUALITY_BY_BED.rack;
  if (bed === 'own-rack' && berthNights < SLEEP.BERTH_NEW_NIGHTS) q *= QUALITY.NEW_BERTH;
  if (hungerI >= 3) q *= QUALITY.VERY_HUNGRY;
  if (ml >= QUALITY.BLADDER_FROM_ML) q *= QUALITY.BLADDER;
  if (coreC < QUALITY.COLD_BELOW_C) q *= QUALITY.COLD; else if (coreC > QUALITY.HOT_ABOVE_C) q *= QUALITY.HOT;
  return Math.max(0.3, Math.min(1, q));
}

/** Sleep pressure's rate, h/h: awake its build, asleep its clearance. */
export function pressureRate({ asleep, needH, quality, depthK, hiFrac = 0, stress = 0, coreC = 37 }) {
  if (asleep) return -((24 - needH) / needH) * quality * depthK;
  let k = SLEEP.AWAKE_H_H * (1 + (SLEEP.HARD_K - 1) * hiFrac);
  if (stress >= SLEEP.STRESS_FROM) k *= SLEEP.STRESS_K;
  if (coreC > SLEEP.HOT_FROM_C) k *= SLEEP.HOT_K;
  return k;
}

/** The deep sleep after a long day (BODY §7.1), fixed at sleep's start. */
export const depthOf = (p) => 1 + SLEEP.DEPTH_K * Math.max(0, p - SLEEP.DEPTH_FROM_H) / SLEEP.DEPTH_FROM_H;

/**
 * How long falling asleep takes from ms (BODY §7.1), ms: the latency at the effective pressure, its
 * share spent inside the wake-maintenance zone counting double (the zone's doubling as a rate, my
 * call: a body lying down 16 minutes before the zone ends is slowed for those 16 minutes only), and
 * under 4 h of pressure inside the zone, awake until it ends and the latency after.
 */
export function latencyMs(p, ms, lonMs, offsetH) {
  const phi = phiOf(ms, lonMs, offsetH), base = SLEEP.LATENCY_MIN + SLEEP.LATENCY_SPAN_MIN * (1 - Math.min(1, (p + circ(phi)) / SLEEP.LATENCY_FULL_H));
  if (!inPhase(phi, SLEEP.WMZ_FROM_H, SLEEP.WMZ_TO_H)) return base * MIN_MS;
  const zoneMin = (msAtPhi(ms, lonMs, offsetH, SLEEP.WMZ_TO_H) - ms) / MIN_MS;
  if (p < SLEEP.WMZ_AWAKE_BELOW_H) return (zoneMin + base) * MIN_MS;
  const inZoneMin = base * SLEEP.WMZ_LATENCY_K;
  return (inZoneMin <= zoneMin ? inZoneMin : zoneMin + (base - zoneMin / SLEEP.WMZ_LATENCY_K)) * MIN_MS;
}

/**
 * Lie down to sleep at ms (BODY §7.1): the bed, and when sleep will come (fallMs, latencyMs above).
 * The depth is fixed when sleep begins (depthOf at the pressure then: the stepper sets it at the
 * onset; until then it reads the pressure lying down). Writes body.sleep; the caller has advanced the
 * body to ms. A body already in bed keeps its night.
 */
export function beginSleepBody(body, ms, { bed = 'own-rack', lonMs = 0 } = {}) {
  const s = body.sleep;
  if (s.bed) return { fallMs: s.fallMs, depthK: s.depthK, latencyMs: s.fallMs - ms };
  s.bed = bed;
  s.sinceMs = ms;
  s.fallMs = Math.round(ms + latencyMs(s.pressureH, ms, lonMs, s.offsetH));
  s.wokeMs = null;
  s.depthK = depthOf(s.pressureH);
  return { fallMs: s.fallMs, depthK: s.depthK, latencyMs: s.fallMs - ms };
}

/** Sleep inertia for a body woken at pressure p (BODY §7.1): { v, ms } or null. */
export function inertiaOf(p) {
  for (const [over, v, ms] of SLEEP.INERTIA) if (p > over) return { v, ms };
  return null;
}

/**
 * Up from the bed at ms (BODY §7.1): sleep inertia if the body was woken from sleep over 3 h of
 * pressure, a night's calm (stress −60 by the hours slept, full at 6: my call), a night in your own
 * rack counted. Writes body. Returns { inertia, untilMs, sleptMs, wasAsleep }.
 */
export function endSleepBody(body, ms, { by = 'player' } = {}) {
  const s = body.sleep;
  if (!s.bed) return { inertia: 0, untilMs: ms, sleptMs: 0, wasAsleep: false };
  const wasAsleep = asleepAt(s, ms);
  const sleptMs = s.fallMs !== null && s.fallMs < ms ? Math.max(0, (s.wokeMs ?? ms) - s.fallMs) : 0;
  const inert = wasAsleep && by !== 'natural' ? inertiaOf(s.pressureH) : null;
  s.inertia = inert ? { v: inert.v, untilMs: ms + inert.ms } : null;
  body.stress.v = Math.max(0, body.stress.v - SLEEP.NIGHT_CALM * Math.min(1, sleptMs / HOUR_MS / SLEEP.NIGHT_CALM_H));
  if (s.bed === 'own-rack' && sleptMs >= 3 * HOUR_MS) s.berthNights = (s.berthNights ?? 0) + 1;
  s.bed = null; s.sinceMs = null; s.fallMs = null; s.wokeMs = null; s.depthK = 1;
  return { inertia: inert ? inert.v : 0, untilMs: inert ? ms + inert.ms : ms, sleptMs, wasAsleep };
}

/**
 * When natural waking comes in (t, end], with the pressure p at t falling at pH h/h and the body
 * asleep since fallMs (BODY §7.1): the earliest of p reaching 0.5 inside the body's 05:00 to 10:00,
 * p reaching 0, and 12 h asleep. Returns t itself when it holds already, or null.
 */
export function wakeAt({ t, end, p, pH, fallMs, lonMs, offsetH }) {
  const holds = (tt, pp) => pp <= 0 || tt - fallMs >= SLEEP.WAKE_MAX_MS || (pp <= SLEEP.WAKE_P_H && inPhase(phiOf(tt, lonMs, offsetH), SLEEP.WAKE_FROM_H, SLEEP.WAKE_TO_H));
  if (holds(t, p)) return t;
  let best = fallMs + SLEEP.WAKE_MAX_MS;
  if (pH < 0) {
    best = Math.min(best, t + p / -pH * HOUR_MS);
    const t05 = p > SLEEP.WAKE_P_H ? t + (p - SLEEP.WAKE_P_H) / -pH * HOUR_MS : t;
    const phi = phiOf(t05, lonMs, offsetH);
    best = Math.min(best, inPhase(phi, SLEEP.WAKE_FROM_H, SLEEP.WAKE_TO_H) ? t05 : msAtPhi(t05, lonMs, offsetH, SLEEP.WAKE_FROM_H));
  } else if (p <= SLEEP.WAKE_P_H) best = Math.min(best, msAtPhi(t, lonMs, offsetH, SLEEP.WAKE_FROM_H));
  return best > t && best <= end ? best : null;
}

/** The body clock's hourly step (BODY §7.2): the drift of the body's period, then the pull of the light. Returns the new offset. */
export function clockStep(offsetH, tauIntH) {
  let o = offsetH + 24 / tauIntH - 24 / SOL_H;
  const cap = (o > 0 ? SLEEP.DELAY_CAP_H_DAY : SLEEP.ADVANCE_CAP_H_DAY) * SLEEP.LIGHT_K / SOL_H;
  o = o > 0 ? Math.max(0, o - cap) : Math.min(0, o + cap);
  return o;
}
