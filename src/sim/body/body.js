// OLYMPUS body: the body record, its closed-form advance on the game's minute grid, and the one door every change goes through (BODY §2; the build sheet 0.0.4 §2.1, §3, §8 items 7, 8, 10).
//
// One body for everyone (BODY §2.1): the record lives on the person, `people[pid].body` (CONTRACTS
// §9), saved as its deltas from its build's template (TECH §6.6, rule 2): `{ v: 2, tmpl, heightM,
// build, atMs, …the ledgers that differ, held }`. bodyOf(state, pid) gives the whole record (the
// template filling what the record leaves out, the person's sex and age, the traits drawn from the
// world's seed: stream('body', seed, pid, 'traits'), sleepNeedH ~ N(8.0, 0.5) in [6.5, 9.5], tauIntH ~
// N(24.2, 0.2), rounded to 0.01); storeBody writes it back as deltas. A body with no atMs is not
// simulated: this round only the player's is (the squad's closed-form needs come at 0.0.9).
//
// The advance (BODY §2.6; TIME §5.5). bodyAdvance(body, seg, fromMs, toMs) moves every ledger under
// one constant segment, seg = { env, load }: the environment (the felt g, the air's pressure and
// temperature, outdoors or not, the outfit, the site's longitude) and the load (the MET felt at g and
// load, the shares of time over MET 4 and 5, running, outdoors, lying; lived or not). Time is cut on
// the game's own grid, minute cells since the epoch (CELL_MS), and inside a cell at the body's own
// transitions: the gut emptying, falling asleep, natural waking, an accident at 850 mL or 550 g.
// Every rate (burn, absorption, the kidneys, insensible water, grime, sleep pressure, the core's
// settling point, stamina, stress) is evaluated at a rate point (a cell's start, a new segment, a
// writer, a transition) and held to the cell's end; within it each ledger has its closed form, linear
// (the pools, the bladder, grime, pressure, stamina, stress) or exponential (the gut's water, the
// transit, the sweat drying, the core). The rate point is kept in body.held.rp, so a split anywhere
// inside a cell reuses it, and an advance over [a, c] equals [a, b] then [b, c] for any b, to float
// rounding (the ledgers are rounded to fine steps at each cell's end, on the grid, so a split never
// moves them: TECH §8.1 rule 11's rounding of transcendental results, here e^x's). The body clock's
// offset steps on the hour grid. Band crossings (felt hunger, thirst, the bladder, the bowel, grime,
// fatigue, stubble, stamina, stress) are found inside each sub-step by
// bisection to under a microsecond; the bladder at 450 mL while asleep is a crossing of its own
// (it wakes a sleeper). nextCrossings steps a copy the same way, so its times equal stepping's, and
// rounds each up to a whole second (TIME §5.6: events sit on whole seconds); bodyPeek is an advanced
// copy for the splash.
//
// bodySync(state, pid, ms, bus) is THE door (the sheet §8, item 8): it brings the body from atMs to
// ms, first over the live mix, the ms the fast layer lived since the last sync at one load (body.held:
// the mix is cut whenever the tick's load changes, so it is always one segment), then over what was
// skipped, part by part of the activity under way (src/sim/time/doing.js activityNow, the same
// boundaries lived or skipped), or the player's own posture; it emits body-stage and body-event, and
// posts and cancels the bursting and desperate hazards (BODY §2.6: drawn once at the crossing's second
// from their own stream, so lived and skipped meet them at the same second). Every change calls it
// first: intake, relieve, wash, groom, sleepBegin, sleepEnd, each applying the ledger module's rule
// and then re-solving the next interrupting crossing (resolveCrossing: the earliest of nextCrossings
// that BODY §23.3 interrupts on, posted as a priority-3 'body' event, src 'body:<pid>').
//
// The start body (the sheet §8, item 10): startBody(person, ms, lonEDeg, seed) is the template, a
// marine at reveille after a standard night, advanced along REFERENCE_SOL (src/data/body/sol.js) from
// the last reveille to ms, its meals, drinks, heads, shower and basin applied as they come, and out of
// any bed at ms (a game starts with you on your feet).
import { MIN_MS, HOUR_MS, SEC_MS, DAY_MS, SOL_MS } from '../../core/clock.js';
import { msAtMarsTime } from '../../core/calendar.js';
import { q } from '../../core/num.js';
import { stream, next } from '../../core/rng.js';
import { playerId, playerActor } from '../../core/ids.js';
import { post, cancel } from '../../core/queue.js';
import { TEMPLATES, DEFAULT_TMPL } from '../../data/body/templates.js';
import { BODY_V, withDefaults, deltaOf, drawTraits, tmplOf, copy, hasBeard } from './record.js';
import { BODY_TMPL } from '../../data/people/looks.js';
import { REFERENCE_SOL, HEAD_VOID_FROM_ML, STALL_VOID_FROM_ML } from '../../data/body/sol.js';
import {
  MET, GAIT_KIND, HARD_MET, VERY_HARD_MET, G_MELAS, FLOOR_KPA, GROUND_KPA, ROOM_C, OUTDOOR_C, ENERGY, WATER, BLADDER, BOWEL,
  HYGIENE, CELL_MS, CLOCK_STEP_MS, HUNGER, THIRST, BLADDER_BANDS, BOWEL_BANDS, GRIME_BANDS, FATIGUE_BANDS, STUBBLE_BANDS,
  STAMINA_BANDS, STRESS_BANDS,
} from '../../data/body/needs.js';
import { metGOf, baseMassOf, massOf, bmrKcalH, energyRates, hungerIndex, eatBody } from './energy.js';
import { thirstPct, thirstIndex, waterRates, kidneyNight, drinkBody } from './water.js';
import { bladderIndex, bowelIndex, bowelLowerG, transitStep, voidBody, bladderAccident, bowelAccident } from './elimination.js';
import { grimeIndex, stubbleIndex, grimeRate, washBody, groomBody } from './hygiene.js';
import { phiOf, circ, fatigueIndex, asleepAt, qualityOf, pressureRate, beginSleepBody, endSleepBody, wakeAt, clockStep, lonMsOf, depthOf } from './sleep.js';
import { stressRate, stressIndex } from './stress.js';
import { settleTo, coreAfter } from './thermal.js';
import { staminaRate } from './motion.js';
import { activityNow } from '../time/doing.js';
import { areaOf, roomOf } from '../places/model.js';
import { siteLonEDeg } from '../jobs.js';
import { logEntry } from '../log.js';

/** How far ahead resolveCrossing looks for the next interrupting crossing, ms. */
export const RESOLVE_MS = DAY_MS;
export { BODY_V, withDefaults, deltaOf, drawTraits, tmplOf };

/** Write a whole record back to its person as deltas. */
export function storeBody(person, full) { person.body = deltaOf(full); return person.body; }

/** The whole body record of a person (see the header), or null without the person. */
export function bodyOf(state, pid, ms = state?.clock?.ms) {
  const p = state?.people?.[pid];
  if (!p) return null;
  const full = withDefaults(p.body ?? null, p, ms);
  if (!p.body?.traits) full.traits = drawTraits(state.meta?.seed ?? 0, pid);
  return full;
}

/** A scene's ledgers written into a record by name (the test scenes' body: { grime, sweatL, stubbleH, pressureH, bladderMl, … }). Writes body. */
export function withLedgers(body, flat = {}) {
  const map = { gutKcal: ['energy', 'gutKcal'], reserveKcal: ['energy', 'reserveKcal'], emptyH: ['energy', 'emptyH'], balanceL: ['water', 'balanceL'], gutL: ['water', 'gutL'],
    bladderMl: ['bladder', 'ml'], bowelG: ['bowel', 'g'], transitG: ['bowel', 'transitG'], grime: ['hygiene', 'grime'], sweatL: ['hygiene', 'sweatL'], stubbleH: ['hygiene', 'stubbleH'],
    pressureH: ['sleep', 'pressureH'], offsetH: ['sleep', 'offsetH'], coreC: ['thermal', 'coreC'], stress: ['stress', 'v'], morale: ['morale', 'v'] };
  for (const [k, v] of Object.entries(flat)) {
    if (k === 'stamina') { body.stamina = v; continue; }
    const at = map[k];
    if (!at) throw new Error(`withLedgers(): no ledger '${k}' (${Object.keys(map).join(', ')}, stamina)`);
    (body[at[0]] ??= {})[at[1]] = v;
  }
  if (body.held) body.held.rp = null;
  return body;
}

// ---- the segment: where the body is and what it does ----

const envKey = (e) => `${e.gG}|${e.airC}|${e.outdoors ? 1 : 0}|${e.outfit}|${e.lonEDeg}`;
/** An environment record for a site's longitude: indoors at Melas unless told (outdoors, outfit). */
export function envOf({ gG = G_MELAS, outdoors = false, airC = outdoors ? OUTDOOR_C : ROOM_C, pKpa = outdoors ? GROUND_KPA : FLOOR_KPA, outfit = 'utilities', lonEDeg = 0, area = null, room = null } = {}) {
  const e = { gG, pKpa, airC, outdoors: !!outdoors, outfit, lonEDeg, area, room };
  e.key = envKey(e);
  return e;
}
/** Where a person is, as the body reads it (the sheet §2.1: floors 66.0 kPa and ROOM_C; the ground 65.9 kPa and OUTDOOR_C). */
export function envAt(state, pid, { room = false } = {}) {
  const a = pid === playerId(state) ? playerActor(state) : (state?.actors?.list ?? []).find(x => x.who === pid) ?? null;
  const area = state?.places?.live?.area ?? null, rec = area ? areaOf(area) : null, outdoors = rec?.kind === 'ground';
  return envOf({ outdoors, outfit: a?.outfit ?? 'utilities', lonEDeg: siteLonEDeg(state), area, room: room && !outdoors && a ? roomOf(area, a.x, a.z)?.id ?? null : null });
}

/** A load from what the body does (BODY §3.1, §3.2): met at 1 G, its kind, the load carried, posture, outdoors, wet; lived (stamina stepped by the fast layer). */
export function loadOf({ met = MET.idle, kind = 'still', loadKg = 0, posture = 'stand', out = false, wet = false, lived = false } = {}, env = envOf(), massKg = 75) {
  const metG = metGOf(met, kind, env.gG, loadKg, massKg);
  const L = { met, kind, metG, hiFrac: met > HARD_MET ? 1 : 0, vhFrac: met > VERY_HARD_MET ? 1 : 0, runFrac: kind === 'run' ? 1 : 0, outFrac: out ? 1 : 0,
    wetFrac: wet ? 1 : 0, lieFrac: posture === 'lie' ? 1 : 0, posture, lived: !!lived };
  L.key = `${metG}|${L.hiFrac}|${L.vhFrac}|${L.runFrac}|${L.outFrac}|${L.lieFrac}|${L.lived ? 1 : 0}`;
  return L;
}
/** The load of the player's own motion and posture (the sheet: idle 1.5, stroll 2.5, walk 3.0, run 8.0; lying 1.0; seated 1.3). */
export function gaitLoad(actor, env, massKg, lived = false) {
  const posture = actor?.posture ?? 'stand', gait = posture === 'lie' ? 'lie' : posture === 'sit' ? 'sit' : (actor?.gait ?? 'idle');
  return loadOf({ met: MET[gait] ?? MET.idle, kind: GAIT_KIND[gait] ?? 'still', posture, out: env.outdoors, lived }, env, massKg);
}
/** The load of an activity's part (src/sim/time/doing.js activityNow). */
export const activityLoad = (a, env, massKg, lived = false) => loadOf({ met: a.met, kind: a.kind, posture: a.posture, out: env.outdoors, wet: a.wet, lived }, env, massKg);
/** A segment's key: two segments with one key have the same rates. */
export const segKey = (seg) => `${seg.load.key}|${seg.env.key ?? envKey(seg.env)}`;
// (the activity under way covering ms, or null: activityNow answers the first part before it starts and the last after it ends)
export const covering = (a, ms) => (a && ms >= a.fromMs && ms < a.toMs ? a : null);

/** The body's segment at ms (the sheet §2.1): the activity's part when one runs, else the live mix's load, else the player's posture. */
export function segOf(state, pid, ms = state?.clock?.ms) {
  const env = envAt(state, pid), rec = state?.people?.[pid]?.body, mass = massOf(withDefaults(rec));
  const a = pid === playerId(state) ? covering(activityNow(state, ms), ms) : null;
  if (a) return { env, load: activityLoad(a, env, mass) };
  if (rec?.held?.cur) return { env: rec.held.env ?? env, load: rec.held.cur };
  return { env, load: gaitLoad(playerActor(state), env, mass) };
}

// ---- the stepper ----

// (the ledgers the stepper evolves, flat)
const flatOf = (b) => ({ gut: b.energy.gutKcal, res: b.energy.reserveKcal, emptyH: b.energy.emptyH, gutL: b.water.gutL, bal: b.water.balanceL, ml: b.bladder.ml,
  g: b.bowel.g, tr: b.bowel.transitG, grime: b.hygiene.grime, sweat: b.hygiene.sweatL, stub: b.hygiene.stubbleH, p: b.sleep.pressureH, core: b.thermal.coreC,
  stam: b.stamina, stress: b.stress.v });
function writeFlat(b, f) {
  b.energy.gutKcal = f.gut; b.energy.reserveKcal = f.res; b.energy.emptyH = f.emptyH; b.water.gutL = f.gutL; b.water.balanceL = f.bal; b.bladder.ml = f.ml;
  b.bowel.g = f.g; b.bowel.transitG = f.tr; b.hygiene.grime = f.grime; b.hygiene.sweatL = f.sweat; b.hygiene.stubbleH = f.stub; b.sleep.pressureH = f.p;
  b.thermal.coreC = f.core; b.stamina = f.stam; b.stress.v = f.stress;
}
// (each ledger's resolution, for the rounding at a cell's end: TECH §8.1 rule 11)
const ROUND = Object.freeze({ gut: 1e-9, res: 1e-9, emptyH: 1e-12, gutL: 1e-12, bal: 1e-12, ml: 1e-9, g: 1e-9, tr: 1e-9, grime: 1e-9, sweat: 1e-12, stub: 1e-12, p: 1e-12, core: 1e-12, stam: 1e-9, stress: 1e-9 });
const K9 = Math.round(1 / 1e-9), K12 = Math.round(1 / 1e-12);
// (num.js q()'s rounding with its factor precomputed: the stepper rounds fifteen ledgers at every cell's end)
const rq = (x, k) => { const v = Math.round(x * k) / k; return v === 0 ? 0 : v; };
function roundBody(b) {
  const e = b.energy, w = b.water, h = b.hygiene;
  e.gutKcal = rq(e.gutKcal, K9); e.reserveKcal = rq(e.reserveKcal, K9); e.emptyH = rq(e.emptyH, K12);
  w.gutL = rq(w.gutL, K12); w.balanceL = rq(w.balanceL, K12); b.bladder.ml = rq(b.bladder.ml, K9);
  b.bowel.g = rq(b.bowel.g, K9); b.bowel.transitG = rq(b.bowel.transitG, K9);
  h.grime = rq(h.grime, K9); h.sweatL = rq(h.sweatL, K12); h.stubbleH = rq(h.stubbleH, K12);
  b.sleep.pressureH = rq(b.sleep.pressureH, K12); b.thermal.coreC = rq(b.thermal.coreC, K12); b.stamina = rq(b.stamina, K9); b.stress.v = rq(b.stress.v, K9);
}

/** The rates at a rate point t (see the header): plain numbers, held to the cell's end. */
function ratesAt(b, seg, t, lonMs) {
  const L = seg.load, env = seg.env, s = b.sleep, asleep = asleepAt(s, t), phi = phiOf(t, lonMs, s.offsetH);
  const massKg = massOf(b), bmr = bmrKcalH({ massKg, heightM: b.heightM, ageY: b.ageY, sex: b.sex, bmrK: b.traits.bmrK ?? 1 });
  const metG = asleep ? MET.asleep : L.metG;
  const e = energyRates(b.energy.gutKcal, b.energy.stoolK ?? BOWEL.STOOL_G_PER_KCAL, b.energy.waterK ?? 0, bmr, metG, asleep);
  const w = waterRates(b.water.balanceL, e.burn, metG, L.outFrac, kidneyNight(phi));
  const quality = asleep ? qualityOf({ phi, bed: s.bed, berthNights: s.berthNights, hungerI: hungerIndex(b.energy.gutKcal, b.energy.emptyH, b.energy.reserveKcal), ml: b.bladder.ml, coreC: b.thermal.coreC }) : 1;
  const th = settleTo(env, L.runFrac);
  return {
    asleep: asleep ? 1 : 0, burn: e.burn, absorb: e.absorb, emptyRate: e.emptyRate, stoolA: e.stoolA, foodL: e.foodL, metabL: w.metabL, insL: w.insL, urineL: w.urineL,
    grimeH: grimeRate(asleep, L.vhFrac, L.outFrac), quality,
    pH: pressureRate({ asleep, needH: b.traits.sleepNeedH, quality, depthK: s.depthK ?? 1, hiFrac: L.hiFrac, stress: b.stress.v, coreC: b.thermal.coreC }),
    coreT: th.target, coreTau: th.tauMin, stamS: L.lived ? 0 : staminaRate(metG), stressM: stressRate(env.outdoors),
  };
}

/** The flat ledgers dtMs after f under the rates R (each its closed form). Pure. */
function evolve(f, R, dtMs) {
  const dtH = dtMs / HOUR_MS, dtMin = dtMs / MIN_MS;
  const absorbed = Math.min(f.gut, R.absorb * dtH);
  const gutL = f.gutL * Math.exp(-dtMin / WATER.GUT_TAU_MIN);
  const tr = transitStep(f.tr, R.stoolA, dtH);
  return {
    gut: f.gut - absorbed, res: Math.min(ENERGY.RESERVE_CAP_KCAL, f.res + absorbed - R.burn * dtH), emptyH: f.emptyH + R.emptyRate * dtH,
    gutL, bal: f.bal + (f.gutL - gutL) + (R.foodL + R.metabL - R.insL - R.urineL) * dtH, ml: f.ml + R.urineL * 1000 * dtH,
    g: f.g + tr.movedG, tr: tr.transitG, grime: Math.min(100, f.grime + R.grimeH * dtH), sweat: f.sweat * Math.exp(-dtH / HYGIENE.SWEAT_DRY_TAU_H),
    stub: f.stub + dtH, p: Math.max(0, f.p + R.pH * dtH), core: coreAfter(f.core, R.coreT, R.coreTau, dtMin),
    stam: Math.max(0, Math.min(100, f.stam + R.stamS * dtMs / SEC_MS)), stress: Math.max(0, Math.min(100, f.stress + R.stressM * dtMin)),
  };
}

/** The ledgers whose bands the body reports, in order; interrupt: the band index from which a rise stops a skip (BODY §23.3). */
export const LEDGERS = Object.freeze([
  { key: 'hunger', bands: HUNGER, interrupt: 4 },
  { key: 'thirst', bands: THIRST, interrupt: 4 },
  { key: 'bladder', bands: BLADDER_BANDS, interrupt: 4 },
  { key: 'bowel', bands: BOWEL_BANDS, interrupt: 4 },
  { key: 'hygiene', bands: GRIME_BANDS },
  { key: 'fatigue', bands: FATIGUE_BANDS },
  { key: 'stubble', bands: STUBBLE_BANDS },
  { key: 'stamina', bands: STAMINA_BANDS },
  { key: 'stress', bands: STRESS_BANDS },
  { key: 'wake', as: 'bladder', bands: Object.freeze([{ id: 'asleep' }, { id: 'wake', words: 'Your bladder wakes you.' }]), interrupt: 1, pseudo: true },
].map(s => Object.freeze(s)));
const staminaIndex = (v) => { for (let i = STAMINA_BANDS.length - 1; i >= 1; i--) if (v < STAMINA_BANDS[i].below) return i; return 0; };
// (a ledger's band index at t, from the flat ledgers and the sub-step's context d)
function bandAt(i, f, t, d) {
  switch (i) {
    case 0: return hungerIndex(f.gut, f.emptyH, f.res);
    case 1: return thirstIndex(thirstPct(f.bal, d.baseMass + Math.min(0, f.res) / 7700));
    case 2: return bladderIndex(f.ml);
    case 3: return bowelIndex(f.g, bowelLowerG(d.reflexUntilMs, t, phiOf(t, d.lonMs, d.offsetH)));
    case 4: return grimeIndex(f.grime);
    case 5: return fatigueIndex(f.p + circ(phiOf(t, d.lonMs, d.offsetH)));
    case 6: return d.beard === false ? 0 : stubbleIndex(f.stub);
    case 7: return staminaIndex(f.stam);
    case 8: return stressIndex(f.stress);
    default: return d.asleep && f.ml >= BLADDER.WAKE_ML ? 1 : 0;
  }
}
const bandsAt = (f, t, d) => LEDGERS.map((_, i) => bandAt(i, f, t, d));
// (the first time in (ta, tb] at which pred holds, pred(ta) false and pred(tb) true; to well under a microsecond)
function firstTime(ta, tb, pred) {
  let lo = ta, hi = tb;
  for (let k = 0; k < 44 && hi - lo > 1e-4; k++) { const m = (lo + hi) / 2; if (pred(m)) hi = m; else lo = m; }
  return hi;
}
const crossing = (spec, fromI, toI, atMs) => ({ atMs, ledger: spec.as ?? spec.key, from: spec.bands[fromI].id, to: spec.bands[toI].id, fromI, toI,
  interrupt: spec.interrupt !== undefined && toI >= spec.interrupt && fromI < spec.interrupt, tone: spec.bands[toI].tone ?? 'note', words: spec.bands[toI].words ?? '', pseudo: !!spec.pseudo });

// (the crossings between two flat states over [t0, t1] under R: each band boundary passed, timed by bisection)
function crossingsIn(f0, R, t0, t1, d, b0, b1, out) {
  for (let i = 0; i < LEDGERS.length; i++) {
    if (b0[i] === b1[i]) continue;
    const spec = LEDGERS[i], up = b1[i] > b0[i];
    for (let k = up ? b0[i] + 1 : b0[i] - 1; up ? k <= b1[i] : k >= b1[i]; k += up ? 1 : -1) {
      const at = firstTime(t0, t1, (tt) => { const v = bandAt(i, evolve(f0, R, tt - t0), tt, d); return up ? v >= k : v < k + 1; });
      out.push(crossing(spec, up ? k - 1 : k + 1, k, at));
    }
  }
}

// (the body's next transition in (t, end]: the gut empty, an accident, asleep, natural waking)
function nextTransition(b, f, R, t, end, lonMs) {
  let best = end, kind = null;
  const consider = (tt, k) => { if (tt > t && tt <= best && (kind === null || tt < best)) { best = tt; kind = k; } };
  if (R.absorb > 0 && f.gut > 0) consider(t + f.gut / R.absorb * HOUR_MS, 'gut-empty');
  if (R.urineL > 0 && f.ml < BLADDER.ACCIDENT_ML) consider(t + (BLADDER.ACCIDENT_ML - f.ml) / (R.urineL * 1000) * HOUR_MS, 'bladder-accident');
  if (f.g < BOWEL.ACCIDENT_G && evolve(f, R, best - t).g >= BOWEL.ACCIDENT_G) consider(firstTime(t, best, (tt) => evolve(f, R, tt - t).g >= BOWEL.ACCIDENT_G), 'bowel-accident');
  const s = b.sleep;
  if (s.bed && s.fallMs !== null && s.fallMs !== undefined && (s.wokeMs === null || s.wokeMs === undefined)) {
    if (t < s.fallMs) consider(s.fallMs, 'asleep');
    else if (R.asleep) { const w = wakeAt({ t, end: best, p: f.p, pH: R.pH, fallMs: s.fallMs, lonMs, offsetH: s.offsetH }); if (w !== null && w > t) consider(w, 'woke'); }
  }
  return kind ? { atMs: best, kind } : null;
}

// (a transition applied at t: the state's change, its event, its crossing)
function applyTransition(b, kind, t, out) {
  switch (kind) {
    case 'gut-empty': b.energy.gutKcal = 0; b.energy.emptyH = 0; b.energy.emptySinceMs = t; break;
    case 'bladder-accident': { const ml = bladderAccident(b); out.events.push({ atMs: t, kind: 'accident', what: 'bladder', amount: ml }); out.crossed.push({ atMs: t, ledger: 'bladder', from: 'bursting', to: 'accident', interrupt: true, tone: 'urgent', words: 'You couldn\'t hold it.', transition: true }); break; }
    case 'bowel-accident': { const g = bowelAccident(b); out.events.push({ atMs: t, kind: 'accident', what: 'bowel', amount: g }); out.crossed.push({ atMs: t, ledger: 'bowel', from: 'desperate', to: 'accident', interrupt: true, tone: 'urgent', words: 'You couldn\'t hold it.', transition: true }); break; }
    case 'asleep': b.sleep.depthK = depthOf(b.sleep.pressureH); out.events.push({ atMs: t, kind: 'asleep', amount: 0 }); out.crossed.push({ atMs: t, ledger: 'sleep', from: 'awake', to: 'asleep', interrupt: false, tone: 'fine', words: '', transition: true }); break;
    case 'woke': b.sleep.wokeMs = t; out.events.push({ atMs: t, kind: 'woke', amount: 0, by: 'natural' }); out.crossed.push({ atMs: t, ledger: 'sleep', from: 'asleep', to: 'woke', interrupt: true, tone: 'note', words: 'Awake, before anyone called it.', transition: true }); break;
    default: break;
  }
}

const ctxOf = (b, lonMs, t) => ({ lonMs, offsetH: b.sleep.offsetH, reflexUntilMs: b.bowel.reflexUntilMs ?? null, asleep: asleepAt(b.sleep, t), baseMass: baseMassOf(b), beard: hasBeard(b) });

/**
 * Advance a whole body record from fromMs to toMs under one segment (see the header). Writes body
 * (its ledgers, atMs and held.rp). Returns { events: [{ atMs, kind, … }], crossed: [{ atMs, ledger,
 * from, to, interrupt, tone, words }] }, times exact (fractional ms).
 */
export function bodyAdvance(body, seg, fromMs, toMs, ctx = {}) {
  const out = { events: [], crossed: [] };
  if (!(toMs > fromMs)) return out;
  const key = segKey(seg), lonMs = lonMsOf(seg.env.lonEDeg ?? 0);
  body.held ??= {};
  let t = fromMs, cell = Math.floor(t / CELL_MS), carry = null;    // (carry: the bands at a sub-step's end, the next one's start while nothing jumped between)
  let rp = body.held.rp && body.held.rp.key === key && body.held.rp.cell === cell ? body.held.rp : null;
  while (t < toMs) {
    cell = Math.floor(t / CELL_MS);
    const cellStart = cell * CELL_MS, cellEnd = cellStart + CELL_MS, end = Math.min(toMs, cellEnd);
    if (rp && rp.cell !== cell) rp = null;
    if (t === cellStart && t % CLOCK_STEP_MS === 0 && body.sleep.clockMs !== t) {   // (the body clock's hour step)
      body.sleep.offsetH = q(clockStep(body.sleep.offsetH, body.traits.tauIntH), 1e-12);
      body.sleep.clockMs = t;
      rp = null; carry = null;
    }
    if (!rp) rp = { cell, key, atMs: t, r: ratesAt(body, seg, t, lonMs) };
    const f0 = flatOf(body);
    const d = ctxOf(body, lonMs, t);
    if (rp.r.asleep) {                                                // (waking conditions that hold already: awake at once)
      const s = body.sleep, w = wakeAt({ t, end, p: f0.p, pH: rp.r.pH, fallMs: s.fallMs, lonMs, offsetH: s.offsetH });
      if (w === t) { const before = bandsAt(f0, t, d); applyTransition(body, 'woke', t, out); afterTransition(body, f0, before, t, lonMs, out); rp = null; carry = null; continue; }
    }
    const tr = nextTransition(body, f0, rp.r, t, end, lonMs);
    const t1 = tr ? tr.atMs : end;
    const f1 = evolve(f0, rp.r, t1 - t), b0 = carry && carry.t === t ? carry.b : bandsAt(f0, t, d), b1 = bandsAt(f1, t1, d);
    crossingsIn(f0, rp.r, t, t1, d, b0, b1, out.crossed);
    writeFlat(body, f1);
    t = t1;
    carry = { t, b: b1 };
    if (tr) { applyTransition(body, tr.kind, t, out); afterTransition(body, f1, b1, t, lonMs, out); rp = null; carry = null; }
    if (t === cellEnd) { roundBody(body); rp = null; }
  }
  body.atMs = toMs;
  body.held.rp = rp && toMs < (Math.floor(toMs / CELL_MS) + 1) * CELL_MS && Math.floor(toMs / CELL_MS) === rp.cell ? rp : null;
  if (ctx.sortCrossed !== false) out.crossed.sort((a, b) => a.atMs - b.atMs);
  return out;
}
// (the bands a transition moved at t, as crossings at t)
function afterTransition(body, fBefore, bBefore, t, lonMs, out) {
  const f = flatOf(body), d = ctxOf(body, lonMs, t), after = bandsAt(f, t, d);
  for (let i = 0; i < LEDGERS.length; i++) if (after[i] !== bBefore[i]) out.crossed.push(crossing(LEDGERS[i], bBefore[i], after[i], t));
}

/** An advanced copy of a body (the original untouched): the splash may read it mid-skip. */
export function bodyPeek(body, seg, fromMs, atMs) {
  const b = copy(body);
  bodyAdvance(b, seg, fromMs, atMs);
  return b;
}

/** A whole second at or after ms. */
export const ceilSec = (ms) => Math.ceil(ms / SEC_MS - 1e-9) * SEC_MS;

/**
 * The crossings ahead if the segment held (see the header): [{ atMs, ledger, band, from, interrupt,
 * prio: 3, words, tone }], atMs rounded up to a whole second, sorted. firstInterrupt stops at the first
 * interrupting one.
 */
export function nextCrossings(body, seg, fromMs, { untilMs = fromMs + RESOLVE_MS, firstInterrupt = false } = {}) {
  const b = copy(body), out = [];
  b.atMs = fromMs;
  for (let t = fromMs; t < untilMs;) {
    const t1 = Math.min(untilMs, (Math.floor(t / HOUR_MS) + 1) * HOUR_MS);
    const r = bodyAdvance(b, seg, t, t1);
    for (const c of r.crossed) {
      out.push({ atMs: ceilSec(c.atMs), exactMs: c.atMs, ledger: c.ledger, band: c.to, from: c.from, interrupt: !!c.interrupt, prio: 3, words: c.words, tone: c.tone });
      if (firstInterrupt && c.interrupt) return out.sort((x, y) => x.atMs - y.atMs || x.exactMs - y.exactMs);
    }
    t = t1;
  }
  return out.sort((x, y) => x.atMs - y.atMs || x.exactMs - y.exactMs);
}

// ---- the door ----

const EMPTY = Object.freeze({ events: Object.freeze([]), crossed: Object.freeze([]) });
const merge = (a, r) => { a.events.push(...r.events); a.crossed.push(...r.crossed); return a; };
const simulated = (rec) => !!rec && rec.atMs !== null && rec.atMs !== undefined;

/**
 * Bring a person's body from its atMs to ms (see the header): the live mix first, then the activity's
 * parts or the player's posture; body-stage and body-event emitted, the hazards posted or cancelled.
 * Writes. Returns { events, crossed }.
 */
export function bodySync(state, pid, ms = state?.clock?.ms, bus = null) {
  const p = state?.people?.[pid];
  if (!simulated(p?.body) || !(ms > p.body.atMs)) return EMPTY;
  const body = bodyOf(state, pid, ms), out = { events: [], crossed: [] };
  const env = envAt(state, pid), mass = massOf(body), isPlayer = pid === playerId(state), h = body.held;
  let t = body.atMs;
  if (h.ms > 0 && h.cur) {
    const mixEnd = Math.min(ms, t + h.ms);
    merge(out, bodyAdvance(body, { env: h.env ?? env, load: h.cur }, t, mixEnd));
    t = mixEnd;
  }
  h.ms = 0;
  while (t < ms) {
    const a = isPlayer ? activityNow(state, t) : null;
    if (covering(a, t)) { const end = Math.min(ms, a.toMs); merge(out, bodyAdvance(body, { env, load: activityLoad(a, env, mass) }, t, end)); t = end; continue; }
    const end = a && a.fromMs > t ? Math.min(ms, a.fromMs) : ms;
    merge(out, bodyAdvance(body, { env, load: isPlayer ? gaitLoad(playerActor(state), env, mass) : loadOf({}, env, mass) }, t, end));
    t = end;
  }
  out.crossed.sort((x, y) => x.atMs - y.atMs);
  storeBody(p, body);
  tellFacts(state, pid, out, bus);
  hazards(state, pid, out);
  return out;
}

// (the facts of a sync: a band crossed, a transition; an accident in the log)
function tellFacts(state, pid, out, bus) {
  for (const c of out.crossed) if (!c.transition && !c.pseudo) bus?.emit('body-stage', { who: pid, ledger: c.ledger, from: c.from, to: c.to, tone: c.tone, words: c.words, atMs: Math.ceil(c.atMs) });
  for (const e of out.events) {
    bus?.emit('body-event', { who: pid, kind: e.kind, atMs: Math.ceil(e.atMs), amount: e.amount, what: e.what });
    if (e.kind === 'accident' && pid === playerId(state)) logEntry(state, bus, { kind: 'body', tone: 'warn', text: e.what === 'bowel' ? 'You couldn\'t hold it. Your trousers will need the laundry, and so will you.' : 'You couldn\'t hold it. A wet, warm minute, and then a cold one.' });
  }
}

/** The src of a person's hazard on a ledger. */
export const hazardSrc = (pid, ledger) => `body:${pid}:${ledger}`;
const HAZARD = Object.freeze({ bladder: { band: 4, ratePerMin: BLADDER.BURST_PER_MIN }, bowel: { band: 4, ratePerMin: BOWEL.DESPERATE_PER_MIN } });
// (the bursting and desperate hazards (BODY §2.6): drawn once at the crossing's second, cancelled when the ledger leaves the band)
function hazards(state, pid, out) {
  if (!out.crossed.length) return;
  for (const [ledger, hz] of Object.entries(HAZARD)) {
    const cs = out.crossed.filter(c => c.ledger === ledger && !c.pseudo && (c.toI !== undefined || c.transition));
    if (!cs.length) continue;
    const last = cs[cs.length - 1], src = hazardSrc(pid, ledger);
    const inBand = last.toI !== undefined && last.toI >= hz.band;
    cancel(state, src);
    if (!inBand) continue;
    const enter = [...cs].reverse().find(c => c.toI >= hz.band && c.fromI < hz.band) ?? last, baseMs = ceilSec(enter.atMs), key = `${pid}:${baseMs}`;
    const u = next(stream(state.meta?.seed ?? 0, src, key, 0));
    const waitMs = Math.floor((-Math.log(1 - u) / hz.ratePerMin) * MIN_MS / SEC_MS) * SEC_MS;
    post(state, { atMs: baseMs + waitMs, prio: 3, kind: 'body-hazard', src, who: pid, payload: { ledger, key, ratePerMin: hz.ratePerMin } });
  }
}

/** The line a crossing's event carries (the band's words). */
const lineOf = (c) => (c.ledger === 'sleep' && c.band === 'woke' ? 'Awake.' : c.words || null);
/**
 * Post the next interrupting crossing as a priority-3 'body' event (src 'body:<pid>'), the one
 * before it cancelled (an event due now is left to be dispatched). The body is at ms (synced).
 */
export function resolveCrossing(state, pid, ms = state?.clock?.ms) {
  const p = state?.people?.[pid];
  if (!simulated(p?.body)) return null;
  const body = bodyOf(state, pid, ms), seg = segOf(state, pid, ms), src = `body:${pid}`;
  const list = nextCrossings(body, seg, body.atMs, { untilMs: body.atMs + RESOLVE_MS, firstInterrupt: true });
  const first = list.find(c => c.interrupt && c.atMs > ms) ?? null;
  cancel(state, src, (ev) => ev.atMs > ms);
  if (first) post(state, { atMs: first.atMs, prio: 3, kind: 'body', src, who: pid, line: lineOf(first), payload: { ledger: first.ledger, band: first.band } });
  const h = (p.body.held ??= {});
  h.solved = segKey(seg);
  h.posted = first ? { atMs: first.atMs, ledger: first.ledger, band: first.band } : null;
  return first;
}

/** Whether a person is asleep at ms (the sleep record; perception reads it for the player). */
export function isAsleep(state, pid, ms = state?.clock?.ms) {
  const rec = state?.people?.[pid]?.body;
  if (!simulated(rec)) return false;
  return asleepAt({ ...tmplOf(rec).sleep, ...(rec.sleep ?? {}) }, ms);
}

// ---- the changes, each through the door ----

// (a change's frame: the body synced to ms, the change applied to the whole record, stored, the crossing solved again)
function change(state, pid, ms, bus, fn) {
  const p = state?.people?.[pid];
  if (!simulated(p?.body)) return null;
  bodySync(state, pid, ms, bus);
  const body = bodyOf(state, pid, ms);
  const res = fn(body);
  body.held.rp = null;
  storeBody(p, body);
  resolveCrossing(state, pid, ms);
  return res;
}
const tell = (bus, pid, kind, ms, amount, more = {}) => bus?.emit('body-event', { who: pid, kind, atMs: ms, amount, ...more });

/** Eat and drink (BODY §3.5, §4.1): { kcal, waterL, food }. Returns { kcal, waterL } taken in. */
export function intake(state, pid, { kcal = 0, waterL = 0, food = 'snack' } = {}, ms = state?.clock?.ms, bus = null) {
  return change(state, pid, ms, bus, (body) => {
    const ate = kcal > 0 ? eatBody(body, { kcal, food }, ms) : { kcal: 0, foodWaterL: 0 };
    const drunk = drinkBody(body, waterL);
    if (ate.kcal > 0) tell(bus, pid, 'eat', ms, ate.kcal, { food });
    if (drunk > 0) tell(bus, pid, 'drink', ms, drunk);
    return { kcal: ate.kcal, waterL: drunk };
  });
}
/** Relieve: the shares of the bladder and the bowel emptied (BODY §5: a head 1.0, a stall 0.9 × the share done). Returns { ml, g }. */
export function relieve(state, pid, { bladderK = 0, bowelK = 0 } = {}, ms = state?.clock?.ms, bus = null) {
  const r = change(state, pid, ms, bus, (body) => {
    const v = voidBody(body, { bladderK, bowelK });
    if (v.ml > 0) tell(bus, pid, 'void', ms, v.ml);
    if (v.g > 0) tell(bus, pid, 'bowel', ms, v.g);
    return v;
  });
  if (r) { const body = bodyOf(state, pid, ms); if (bladderIndex(body.bladder.ml) < 4) cancel(state, hazardSrc(pid, 'bladder')); if (bowelIndex(body.bowel.g) < 4) cancel(state, hazardSrc(pid, 'bowel')); }
  return r;
}
/** A shower's water (BODY §6): { waterMin, cold }. Returns { before, after } grime. */
export function wash(state, pid, { waterMin = 0, cold = false } = {}, ms = state?.clock?.ms, bus = null) {
  return change(state, pid, ms, bus, (body) => { const r = washBody(body, { waterMin, cold }, ms); tell(bus, pid, 'wash', ms, waterMin, { grime: r.after }); return r; });
}
/** The basin (BODY §6): { teeth, shave, face }. */
export function groom(state, pid, { teeth = false, shave = false, face = false } = {}, ms = state?.clock?.ms, bus = null) {
  return change(state, pid, ms, bus, (body) => { const r = groomBody(body, { teeth, shave, face }, ms); tell(bus, pid, 'groom', ms, (teeth ? 1 : 0) + (shave ? 2 : 0) + (face ? 4 : 0), r); return r; });
}
/** Lie down with intent to sleep (BODY §7.1): latency and depth fixed now. Returns { fallMs, depthK, latencyMs }. */
export function sleepBegin(state, pid, ms = state?.clock?.ms, { bed = 'own-rack' } = {}, bus = null) {
  return change(state, pid, ms, bus, (body) => beginSleepBody(body, ms, { bed, lonMs: lonMsOf(siteLonEDeg(state)) }));
}
/** Up from the bed (BODY §7.1): { by: 'natural' | 'reveille' | 'alert' | 'player' | 'body' }. Returns { inertia: 0 | −2 | −3, untilMs }. */
export function sleepEnd(state, pid, ms = state?.clock?.ms, { by = 'player' } = {}, bus = null) {
  return change(state, pid, ms, bus, (body) => {
    const r = endSleepBody(body, ms, { by });
    if (r.wasAsleep) tell(bus, pid, 'woke', ms, r.sleptMs, { by, inertia: r.inertia });
    return { inertia: r.inertia, untilMs: r.untilMs };
  });
}

/** The bursting or desperate hazard come due (BODY §2.6): the bladder or the bowel lets go, if it is still in its band. Returns the amount, or 0. */
export function letGo(state, pid, ledger, ms = state?.clock?.ms, bus = null) {
  const r = change(state, pid, ms, bus, (body) => {
    const inBand = ledger === 'bowel' ? bowelIndex(body.bowel.g) >= 4 : bladderIndex(body.bladder.ml) >= 4;
    if (!inBand) return 0;
    const amount = ledger === 'bowel' ? bowelAccident(body) : bladderAccident(body);
    tell(bus, pid, 'accident', ms, amount, { what: ledger });
    if (pid === playerId(state)) logEntry(state, bus, { kind: 'body', tone: 'warn', text: ledger === 'bowel' ? 'You couldn\'t hold it. Your trousers will need the laundry, and so will you.' : 'You couldn\'t hold it. A wet, warm minute, and then a cold one.' });
    return amount;
  });
  if (r) cancel(state, hazardSrc(pid, ledger));
  return r ?? 0;
}

// ---- the reference sol, and the start body ----

const hm = (s) => { const [h, m] = s.split(':').map(Number); return [h, m]; };
/** The game time of the last reveille of a sol at or before ms. */
export function lastReveille(ms, lonEDeg, sol = REFERENCE_SOL) {
  const [h, m] = hm(sol.reveille), t = msAtMarsTime(ms, h, m, lonEDeg);
  return t <= ms ? t : msAtMarsTime(ms - SOL_MS, h, m, lonEDeg);
}
/** A sol's rows as timed spans from its reveille: [{ fromMs, toMs, row, first }]; the rack's runs to nextReveilleMs (the same sol's by default). */
export function solPlan(sol, reveilleMs, lonEDeg, nextReveilleMs = null) {
  const spans = [];
  let at = reveilleMs;
  for (let i = 0; i < sol.rows.length; i++) {
    const row = sol.rows[i], [h, m] = hm(row.at), from = i === 0 ? reveilleMs : msAtMarsTime(at, h, m, lonEDeg);
    spans.push({ fromMs: from, row, first: i === 0 });
    at = from;
  }
  const [rh, rm] = hm(sol.reveille);
  const end = nextReveilleMs ?? msAtMarsTime(at + MIN_MS, rh, rm, lonEDeg);
  for (let i = 0; i < spans.length; i++) spans[i].toMs = i + 1 < spans.length ? spans[i + 1].fromMs : end;
  return spans;
}
/** A row's segment: its load and environment (outdoors, the outfit) at a site. */
export function rowSeg(row, lonEDeg, massKg = 75, lived = false, gG = G_MELAS) {
  const env = envOf({ gG, outdoors: !!row.out, outfit: row.outfit ?? 'utilities', lonEDeg });
  return { env, load: loadOf({ met: row.met, kind: row.kind, loadKg: row.loadKg ?? 0, posture: row.posture ?? 'stand', out: !!row.out, wet: !!row.wet, lived }, env, massKg) };
}
/**
 * What a row does at its start, to a whole body (body-level, no state): reveille's waking, the head,
 * the stall, a meal, a drink, the shower's water, the basin, the bed. Returns [{ act, … }] done.
 */
export function rowActs(body, span, t, lonEDeg) {
  const row = span.row, done = [], lonMs = lonMsOf(lonEDeg);
  if (span.first && body.sleep.bed) { const r = endSleepBody(body, t, { by: 'reveille' }); done.push({ act: 'wake', ...r }); }
  if (row.stall) {
    const phi = phiOf(t, lonMs, body.sleep.offsetH);
    if (bowelIndex(body.bowel.g, bowelLowerG(body.bowel.reflexUntilMs, t, phi)) >= 1) done.push({ act: 'bowel', ...voidBody(body, { bowelK: BOWEL.RELIEF_K }) });
  }
  if (body.bladder.ml > 0 && (row.head === 'always' || (row.head && body.bladder.ml >= HEAD_VOID_FROM_ML) || (row.stall && body.bladder.ml >= STALL_VOID_FROM_ML))) done.push({ act: 'void', ...voidBody(body, { bladderK: 1 }) });
  if (row.eat) { const ate = eatBody(body, row.eat, t); const w = drinkBody(body, row.eat.waterL ?? 0); done.push({ act: 'eat', kcal: ate.kcal, waterL: row.eat.waterL ?? 0, foodWaterL: ate.foodWaterL, inL: w }); }
  if (row.drink) done.push({ act: 'drink', waterL: drinkBody(body, row.drink) });
  if (row.wash) done.push({ act: 'wash', ...washBody(body, { waterMin: row.wash }, t) });
  if (row.groom) done.push({ act: 'groom', ...groomBody(body, row.groom, t) });
  if (row.bed) done.push({ act: 'bed', ...beginSleepBody(body, t, { bed: row.bed, lonMs }) });
  if (done.length) body.held.rp = null;
  return done;
}
/** Follow a sol's plan from fromMs to toMs on a whole body, skipped a span at a time (startBody's way). Returns the acts done. */
export function followPlan(body, plan, fromMs, toMs, lonEDeg, gG = G_MELAS) {
  const acts = [], mass = massOf(body);
  for (const span of plan) {
    if (span.toMs <= fromMs || span.fromMs >= toMs) continue;
    if (span.fromMs >= fromMs) acts.push(...rowActs(body, span, span.fromMs, lonEDeg).map(a => ({ ...a, atMs: span.fromMs, what: span.row.what })));
    bodyAdvance(body, rowSeg(span.row, lonEDeg, mass, false, gG), Math.max(fromMs, span.fromMs), Math.min(toMs, span.toMs));
  }
  return acts;
}

/**
 * A new body for a person at ms (see the header): the template advanced along REFERENCE_SOL from the
 * last reveille. seed draws the person's traits (BODY §2.5); without one, the template's (drawn at
 * the first read). Returns the whole record (every ledger present: a scene may set them).
 */
export function startBody(person, ms, lonEDeg = 0, seed = null) {
  const t = TEMPLATES[person?.body?.tmpl] ?? TEMPLATES[BODY_TMPL[person?.sex]] ?? TEMPLATES[DEFAULT_TMPL];
  const tmpl = person?.body?.tmpl ?? BODY_TMPL[person?.sex] ?? DEFAULT_TMPL;
  const body = withDefaults({ v: BODY_V, tmpl, heightM: person?.body?.heightM ?? t.heightM, build: person?.body?.build ?? t.build }, person, ms);
  if (seed !== null && seed !== undefined && person?.id) body.traits = drawTraits(seed, person.id);
  const rev = lastReveille(ms, lonEDeg);
  body.atMs = rev;
  body.energy.emptySinceMs = rev - Math.round(t.energy.emptyForH * HOUR_MS);
  body.energy.ateMs = rev - Math.round(t.energy.ateAgoH * HOUR_MS);
  followPlan(body, solPlan(REFERENCE_SOL, rev, lonEDeg), rev, ms, lonEDeg);
  body.atMs = ms;
  if (body.sleep.bed) endSleepBody(body, ms, { by: 'natural' });
  body.held = {};
  delete body.sex; delete body.ageY;
  return body;
}
