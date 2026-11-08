// OLYMPUS body: wounds, bleeding, pain, the knock, consciousness and death, on the body record (BODY §17, §21, §22; the build sheet 0.0.7 §2.2, §3.1, §4, §8 items 14 to 17).
//
// Ported from tradecraft's src/sim/health.js (404 lines), the pain of its medicine.js and the wound half
// of its shooting.js bullet(), with BODY §17.1's four changes. Everything lives on the body record
// (people[pid].body, saved as deltas, src/sim/body/record.js), for anyone, simulated needs or not:
//   parts     { head, torso, armL, armR, legL, legR }: damage in points (each rounded to 0.1), against
//             what the part takes, PARTS × (1 + Fitness / FITNESS_K 20); its state (stateOf) bruised,
//             hurt (⅓), wounded (⅔), out (1: a broken limb, the torso down, the head out cold);
//   injuries  [{ part, kind, name, ms, until, bleed, rate, deep?, artery?, gunshot?, through?, internal?,
//             cared?, where?, scalp?, drip? }]: tradecraft's injure() (cracks, cuts shallow and deep, an
//             artery ARTERY_CHANCE + 0.2 × force of a deep limb cut at force ≥ 0.35, 10 to 15 %/min),
//             the chest's inside bleed (CHEST_BLEED 0.25 %/min, +0.25 a bullet, at most 1, for 3 h), the
//             head's kill, graze or bullet in the skull; a bleed lasts until `bleed` (ms), a deep one
//             DEEP_H 6 h untended (as good as forever); rates to 0.01 %/min, times whole ms;
//   blood     the % of the body's blood at the anchor bloodMs (rounded to 0.01), with bleedK the factor
//             the bleeding has run at since (exertion, a hand pressed, the cold): the anchor is the one
//             departure from the sheet's shape (my call), what makes blood a closed form;
//   knock     { untilMs } while a bullet's knock keeps them down; dead { ms, why }; fitness, the
//             person's Fitness at the first wound (what the parts take, so every reader agrees).
// Absent, each is unhurt: an unwounded body runs none of this and saves nothing new (§8 item 14).
//
// **Blood is a closed form** (bloodAt): from the anchor, piecewise linear over each injury's bleed
// window at bleedK × the sum of the rates bleeding; nothing bleeding, it comes back REGEN_PER_H 2 %/h
// to 100; collapsed (under 55) with nothing bleeding, the blood comes to the head again COME_ROUND_S 90
// after the bleeding stopped (tradecraft's bloodBeat: lifted to 55.5). Death (under 45) and collapse
// are found inside a step as exact crossings. stepWounds(rec, fromMs, toMs, ctx) is the slow layer's
// and a skip's step: it moves the anchor only when the factor changes (ctx: exertion, pressed, the
// core's temperature) or at a death, so a minute's steps and one skip land on the same numbers, to the
// millisecond (wounds-skip). EXERTION ×1.25 crawling, ×1.5 walking, ×2.5 running; PRESSURE_K ×0.35; BODY
// change 3, the lethal triad: ×1.25 under a core of 35 °C, ×1.5 under 33.
//
// **The intake** (applyHit(state, bus, hit), what penetrate.js's caller calls with WEAPONS §8.7's
// record): tradecraft's bullet() with the round's wound factor w in place of its calibre's dmg: the
// part (legs to a side, a torso hit turned to an arm ARM_SHARE 0.15 × (1 − clamp(margin / 10)) of the
// time: WEAPONS §7.7), BULLET 7 × w × U(0.8, 1.25) points, injure() with a gunshot's deep cut at
// (1 + 8 × force) × bleedK (TORSO_BLEED_K 0.6, LIMB_BLEED_K 0.9, × min(1.6, w)), a limb's capped at
// LIMB_CAP_PM 8 (BODY change 1); through and through is penetrate.js's (hit.through), not tradecraft's
// EXIT_P (§8 item 16); the head (HEAD_KILL 0.6 × max(1, w), else HEAD_GRAZE 0.3 a graze, else a bullet in
// the skull); the chest's inside bleed; then the knock (knockS: KNOCK_S by part, × the pain's band and
// the blood's, × TRAINED_K 0.4 for a marine, 2 to 180 s), the player's as everyone's (BODY change 2).
// Every draw in tradecraft's order on one stream, stream('wound', seed, onId, shotId), so a hit is the
// same whatever was rolled before (tradecraft drew its knock on a stream of its own; one here). It
// emits 'wound' and, on a death, 'body-dead', and spills blood where the person stands (blood.js).
//
// **What it costs** (woundMods, BODY §22's rows on SKILLS's uses, through mods.js bodyMods): the head
// hurt −1, wounded or out −3, every roll; the torso −1 / −3 on torso and breath; each arm −1 / −3 /
// broken −4 (a tourniquet counts as broken; −6 on Weapon handling) on hands and arms; each leg −1 / −2
// / −4 on legs; a crack −2, a fracture −3 where the part is used (on the head −1 / −2, every roll);
// pain's bands 25 / 45 / 70 −1 / −2 / −3 on every roll but CQC (adrenaline: tradecraft's 60% of the
// pain off for 40 s, fading over 80, here a closed form of the last wound's time); the blood pale −1,
// in shock −3. **What it says** (woundWords): words, never numbers ("A gunshot wound in the left thigh,
// bleeding hard."). avpuOf (BODY §17.2): blood under 55 U; 55 to 60 while bleeding P; the head out U; a
// knock from the head dazed V. downOf: dead, past standing (tradecraft's canStand), the knock, past
// the pain's floor (1.4 × PAIN_LIMIT 30 + 2 × Fitness) or in shock.
//
// **The casualty** (§8 item 15): careOf(rec, ms) is the corpsman's care as a closed form (a limb's
// bleed stopped by a tourniquet, the rest pressed and dressed to ×0.35, the inside's unchanged);
// casualtyOutcome(rec, { fromMs, evacMs }) reads the numbers: dead if the blood falls under 45 before
// the aid station (EVAC_MIN 12 min) or a head kill; stabilised if after care nothing bleeds over
// STABLE_BLEED_PM 0.5 %/min, the blood is at 70 or more and no part is out (a tourniquet counts as out:
// it is the aid station's); else evacuated.
// Pure but applyHit, stepWounds and careOf, which write the record they are given (applyHit the state).
import { MIN_MS, SEC_MS, HOUR_MS, DAY_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { stream, chance, pick, range } from '../../core/rng.js';
import { BODY_V } from './record.js';
import { BODY_TMPL } from '../../data/people/looks.js';
import { DEFAULT_TMPL } from '../../data/body/templates.js';
import { valueOf } from '../skills/templates.js';
import { spatter } from './blood.js';

/** What each part takes, in points, before Fitness (tradecraft's PARTS). */
export const PARTS = Object.freeze({ head: 6, torso: 12, armL: 8, armR: 8, legL: 9, legR: 9 });
export const PART_KEYS = Object.freeze(Object.keys(PARTS));
/** Fitness 10: half as much again (tradecraft); the Fitness a record without one reads. */
export const FITNESS_K = 20, FITNESS_DEFAULT = 10;
export const STATES = Object.freeze(['unhurt', 'bruised', 'hurt', 'wounded', 'out']);
const OUT = Object.freeze({ head: 'out cold', torso: 'down', armL: 'broken', armR: 'broken', legL: 'broken', legR: 'broken' });
const SIDE = Object.freeze({ armL: 'left', armR: 'right', legL: 'left', legR: 'right' });
const ARMS = Object.freeze(['armL', 'armR']), LEGS = Object.freeze(['legL', 'legR']), LIMBS = Object.freeze([...ARMS, ...LEGS]);
const isLimb = (part) => LIMBS.includes(part);

/** The blood's bands (%): tradecraft's, the textbook's classes of haemorrhage, roughly. */
export const BLOOD = Object.freeze({ pale: 85, shock: 70, collapse: 55, dead: 45 });
/** BODY §17.2: from the collapse to here while still bleeding, stupor (P). */
export const STUPOR_BELOW = 60;
export const REGEN_PER_H = 2, COME_ROUND_S = 90, COME_ROUND_TO = BLOOD.collapse + 0.5;
export const ARTERY_CHANCE = 0.15, DEEP_H = 6, CRACK_AT = 0.5, SPLIT_AT = 0.3, NOSE_AT = 0.2, CRACK_MOD = -2, FRACTURE_MOD = -3;
/** A gunshot (tradecraft's shooting.js): points BULLET × w × U(0.8, 1.25); bleed factors; the head's outcomes; the chest's inside bleed. */
export const BULLET = 7, TORSO_BLEED_K = 0.6, LIMB_BLEED_K = 0.9, W_BLEED_MAX = 1.6;
export const HEAD_KILL = 0.6, HEAD_KILL_MAX = 0.95, HEAD_GRAZE = 0.3, GRAZE_RATE = 0.8, GRAZE_BLEED_MIN = 20, BRAIN_BLEED = 1.2;
export const CHEST_BLEED = 0.25, CHEST_BLEED_MAX = 1, CHEST_BLEED_H = 3;
/** BODY change 1: a non-artery limb wound bleeds at most this (%/min). */
export const LIMB_CAP_PM = 8;
/** WEAPONS §7.7: a torso hit turned to an arm, at a margin of 0 (none at 10 and over). */
export const ARM_SHARE = 0.15;
/** The knock (tradecraft's): seconds by part, × the pain's band and the blood's; a marine's TRAINED_K of it. */
export const KNOCK_S = Object.freeze({ arm: Object.freeze([4, 12]), leg: Object.freeze([10, 30]), torso: Object.freeze([20, 60]), head: Object.freeze([15, 35]) });
export const KNOCK_PAIN = Object.freeze({ 'in pain': 1.3, 'bad pain': 2, agony: 3 });
export const KNOCK_BLOOD = Object.freeze({ pale: 1.3, shock: 2 });
export const KNOCK_MIN_S = 2, KNOCK_MAX_S = 180, TRAINED_K = 0.4;
/** Pain (tradecraft's medicine.js): points by state and injury; bands; what a body bears; adrenaline. */
export const PAIN = Object.freeze({ bruised: 3, hurt: 9, wounded: 18, out: 30, crack: 8, fracture: 22, cut: 3, deep: 10, artery: 12, split: 2, nose: 1, blunt: 4 });
export const PAIN_BANDS = Object.freeze([[70, 'agony', -3], [45, 'bad pain', -2], [25, 'in pain', -1]]);
export const PAIN_LIMIT = Object.freeze({ base: 30, perFit: 2 }), FLOOR_K = 1.4;
export const ADRENALINE = Object.freeze({ k: 0.6, holdS: 40, fadeS: 80 });
/** What makes a bleed faster or slower: moving (tradecraft's), a hand pressed on it, the cold (BODY change 3). */
export const EXERTION = Object.freeze({ crawl: 1.25, walk: 1.5, run: 2.5 });
export const PRESSURE_K = 0.35;
export const COLD_BLEED = Object.freeze([[33, 1.5], [35, 1.25]]);
/** WEAPONS §6.5: a long gun brought up or down, slung or unslung, discharging into its holder's foot. */
export const SELF_SHOT_LONG = 0.1;
/** The casualty on the line (§8 item 15): the corpsman's lived edge, the ambulance to the aid station, what a stable casualty is. */
export const CARE_EDGE_S = 20, EVAC_MIN = 12, STABLE_BLEED_PM = 0.5, STABLE_BLOOD = 70;
/** A bleed the words call hard (%/min; my call: at 4 a body collapses inside twelve minutes). */
export const HARD_BLEED_PM = 4;
/** The injuries a blow or a round leaves besides the damage (tradecraft's INJURIES): days to mend, bleed seconds, names. */
export const INJURIES = Object.freeze({
  crack: { days: 21, name: (part) => ({ head: 'a cracked cheekbone', torso: 'a cracked rib' }[part] ?? `a cracked ${SIDE[part]} ${part.startsWith('arm') ? 'forearm' : 'shin'}`) },
  split: { days: 7, bleedS: [120, 300], name: (part, r) => pick(r, ['a split brow', 'a split lip']) },
  nose: { days: 1, bleedS: [60, 150], name: () => 'a bloody nose' },
  fracture: { days: 42, name: (part, r) => (part === 'head' ? pick(r, ['a broken jaw', 'a fractured eye socket', 'a broken cheekbone']) : part === 'torso' ? 'broken ribs' : `a fractured ${SIDE[part]} ${part.startsWith('arm') ? 'forearm' : 'shin'}`) },
  cut: { days: 10, bleedS: [180, 600], name: (part) => (part === 'head' ? 'a cut on the face' : part === 'torso' ? 'a cut across the ribs' : `a cut on the ${SIDE[part]} ${part.startsWith('arm') ? 'arm' : 'leg'}`) },
});
/** Where a round went in, in words (tradecraft's WORD, the legs at the thigh unless the hit says lower). */
const WHERE = Object.freeze({ head: 'head', torso: 'chest', armL: 'left arm', armR: 'right arm', legL: 'left thigh', legR: 'right thigh' });

// ---- the parts ----

const fitOf = (rec) => rec?.fitness ?? FITNESS_DEFAULT;
/** What a part of this body can take, in points. */
export const takes = (rec, part, fitness = fitOf(rec)) => PARTS[part] * (1 + fitness / FITNESS_K);
/** Damage on a part, in points. */
export const damageOf = (rec, part) => rec?.parts?.[part] ?? 0;
/** A part's state: 'unhurt' | 'bruised' | 'hurt' | 'wounded' | 'out'. */
export function stateOf(rec, part, fitness = fitOf(rec)) {
  const d = damageOf(rec, part), f = d / takes(rec, part, fitness);
  return d <= 0 ? 'unhurt' : f < 1 / 3 ? 'bruised' : f < 2 / 3 ? 'hurt' : f < 1 ? 'wounded' : 'out';
}
/** A part's state in words ('out' named for the part: broken, down, out cold). */
export const stateText = (rec, part) => { const s = stateOf(rec, part); return s === 'out' ? OUT[part] : s; };
const level = (s) => STATES.indexOf(s);
// (a limb's level as what it costs: a tourniquet on it, as good as broken)
const limbLevel = (rec, k) => ((rec.injuries ?? []).some(i => i.part === k && i.cared === 'tourniquet') ? 4 : level(stateOf(rec, k)));
/** Damage a part (points ≥ 0), rounded to 0.1. Writes rec. Returns its state after. */
export function hurt(rec, part, points) {
  rec.parts ??= {};
  rec.parts[part] = q(damageOf(rec, part) + Math.max(0, points), 0.1);
  return stateOf(rec, part);
}
/** Whether a body record carries anything of this module's (an unwounded body steps nothing). */
export const hasWounds = (rec) => !!rec && (!!rec.injuries?.length || !!rec.knock || !!rec.dead || (rec.bloodMs !== undefined && rec.bloodMs !== null));

// ---- injuries ----

const has = (rec, part, kind) => (rec.injuries ?? []).some(i => i.part === part && i.kind === kind);
/**
 * What a blow of `force` (its share of what the part takes) did besides hurt, at ms (tradecraft's
 * injure(), every draw in its order on r): the new injuries, pushed on rec.injuries. Writes rec.
 */
export function injure(rec, part, force, r, ms, { edge = false, fracture = 0, bleedK = 1, crackK = 0, deep = false } = {}) {
  const out = [];
  const add = (kind) => {
    const K = INJURIES[kind], i = { part, kind, name: K.name(part, r), ms, until: ms + K.days * DAY_MS, bleed: K.bleedS ? ms + Math.round(range(r, ...K.bleedS) * (kind === 'cut' ? bleedK : 1)) * SEC_MS : 0 };
    if (kind === 'nose') i.rate = 0.1;
    if (kind === 'split') i.rate = 0.15;
    if (kind === 'cut') {
      const artery = deep && part !== 'torso' && force >= 0.35 && chance(r, ARTERY_CHANCE + force * 0.2);
      let rate = artery ? range(r, 10, 15) : deep ? (1 + force * 8) * bleedK : (0.3 + force * 3) * bleedK;
      if (!artery && isLimb(part)) rate = Math.min(LIMB_CAP_PM, rate);   // (BODY change 1)
      i.rate = q(rate, 0.01);
      if (deep || artery) { i.deep = true; i.bleed = ms + DEEP_H * HOUR_MS; }
      if (artery) { i.artery = true; i.name = part === 'head' ? 'a cut to the neck, an artery' : `a cut artery in the ${SIDE[part]} ${part.startsWith('arm') ? 'arm' : 'thigh'}`; }
      else if (deep) i.name = part === 'torso' ? 'a stab wound in the side' : `a deep cut on the ${part === 'head' ? 'face' : `${SIDE[part]} ${part.startsWith('arm') ? 'arm' : 'leg'}`}`;
    }
    (rec.injuries ??= []).push(i);
    out.push(i);
  };
  if (fracture && !has(rec, part, 'fracture') && chance(r, fracture)) add('fracture');
  else if (force >= CRACK_AT - crackK && !has(rec, part, 'crack') && chance(r, Math.min(1, 0.4 + crackK + (force - CRACK_AT) * 2))) add('crack');
  if (edge && force > 0.05) add('cut');
  else if (part === 'head') {
    if (force >= SPLIT_AT && chance(r, 0.45)) add('split');
    else if (force >= NOSE_AT && !has(rec, 'head', 'nose') && chance(r, 0.4)) add('nose');
  }
  return out;
}

// ---- blood: the closed form ----

const bleedSum = (inj, t) => { let s = 0; for (const i of inj) if (i.bleed > t) s += i.rate ?? 0.2; return s; };
/** The rates bleeding at ms summed, %/min, before any factor. */
export const bleedSumOf = (rec, ms) => bleedSum(rec?.injuries ?? [], ms);
/** The factor a bleed runs at: { exertion, pressed, coreC } (see the header), to 1e-4. */
export function bleedFactor({ exertion = 1, pressed = false, coreC = 37 } = {}) {
  const cold = COLD_BLEED.find(([below]) => coreC < below)?.[1] ?? 1;
  return q(exertion * (pressed ? PRESSURE_K : 1) * cold, 1e-4);
}
/** How fast a body bleeds at ms, %/min (ctx: bleedFactor's; absent, the factor held since the anchor). */
export function bleedRate(rec, ms, ctx = null) {
  return bleedSum(rec?.injuries ?? [], ms) * (ctx ? bleedFactor(ctx) : rec?.bleedK ?? 1);
}
/** Whether a body bleeds at ms. */
export const bleeding = (rec, ms) => !!rec?.injuries?.some(i => i.bleed > ms);

/**
 * The blood from the anchor to toMs (see the header): { blood, deadMs, collapseMs, roundMs }, the
 * times exact (fractional ms) or null; the blood at the death's crossing once dead.
 */
export function bloodCurve(rec, toMs) {
  const B0 = rec?.blood ?? 100, t0 = rec?.bloodMs ?? null, k = rec?.bleedK ?? 1;
  const out = { blood: B0, deadMs: null, collapseMs: null, roundMs: null };
  if (!rec || rec.dead || t0 === null || !(toMs > t0)) return out;
  const inj = rec.injuries ?? [];
  const marks = [...new Set(inj.map(i => i.bleed).filter(b => b > t0 && b < toMs))].sort((a, b) => a - b);
  marks.push(toMs);
  let B = B0, t = t0, round = B0 < BLOOD.collapse && bleedSum(inj, t0) === 0 ? t0 + COME_ROUND_S * SEC_MS : null;
  for (const b of marks) {
    const R = k * bleedSum(inj, t);
    if (R > 0) {
      const B1 = B - R * (b - t) / MIN_MS;
      if (out.collapseMs === null && B >= BLOOD.collapse && B1 < BLOOD.collapse) out.collapseMs = t + (B - BLOOD.collapse) / R * MIN_MS;
      if (B1 <= BLOOD.dead) { out.deadMs = t + (B - BLOOD.dead) / R * MIN_MS; out.blood = BLOOD.dead; return out; }
      B = B1; round = null;
    } else {
      if (B < BLOOD.collapse && round === null) round = t + COME_ROUND_S * SEC_MS;   // (the bleeding stopped at t: 90 s to come round)
      let s = t;
      if (round !== null && round >= s && round < b) {
        B = Math.max(Math.min(100, B + REGEN_PER_H * (round - s) / HOUR_MS), COME_ROUND_TO);
        out.roundMs = round; s = round; round = Infinity;
      }
      B = Math.min(100, B + REGEN_PER_H * (b - s) / HOUR_MS);
    }
    t = b;
  }
  out.blood = B;
  return out;
}
/** The blood at ms, % of the body's (100 unhurt). */
export const bloodAt = (rec, ms) => Math.max(0, bloodCurve(rec, ms).blood);
/** The blood's band: 'steady' | 'pale' | 'shock' | 'collapsed' | 'dead'. */
export function bandOf(rec, ms) {
  if (rec?.dead) return 'dead';
  const b = bloodAt(rec, ms);
  return b >= BLOOD.pale ? 'steady' : b >= BLOOD.shock ? 'pale' : b >= BLOOD.collapse ? 'shock' : b > BLOOD.dead ? 'collapsed' : 'dead';
}
// (the anchor moved to ms: the blood there, rounded to 0.01; a death on the way written at its crossing)
function anchor(rec, ms) {
  if (rec.bloodMs === undefined || rec.bloodMs === null) { rec.blood = rec.blood ?? 100; rec.bloodMs = ms; return rec; }
  if (rec.dead) return rec;
  const c = bloodCurve(rec, ms);
  if (c.deadMs !== null) { die(rec, Math.ceil(c.deadMs), 'blood loss'); return rec; }
  rec.blood = q(c.blood, 0.01);
  rec.bloodMs = ms;
  return rec;
}
function die(rec, ms, why) {
  if (rec.dead) return;
  const b = rec.bloodMs === undefined || rec.bloodMs === null ? rec.blood ?? 100 : bloodCurve(rec, ms).blood;   // (read before the death freezes it)
  rec.dead = { ms, why };
  rec.blood = q(Math.max(0, b), 0.01);
  rec.bloodMs = ms;
  delete rec.knock;
}

/** The bleed's factor held from ms on (ctx: bleedFactor's): the anchor moved to ms when it changes, so what bled before bled at the old one. Writes rec. */
export function holdFactor(rec, ms, ctx) {
  if (!hasWounds(rec) || rec.dead || !ctx) return rec;
  const k = bleedFactor(ctx);
  if (k === (rec.bleedK ?? 1)) return rec;
  anchor(rec, ms);
  if (k === 1) delete rec.bleedK; else rec.bleedK = k;
  return rec;
}

/**
 * The slow layer's step and a skip's (see the header): the anchor moved if the factor changed (ctx:
 * { exertion, pressed, coreC }; none given, the factor held), a death written at its crossing, the
 * knock ended, the blood come back to 100 put away. Writes rec; returns { rec, events: [{ kind:
 * 'collapse' | 'come-round' | 'dead' | 'up', atMs }] } for what happened inside (fromMs, toMs].
 */
export function stepWounds(rec, fromMs, toMs, ctx = null) {
  const events = [];
  if (!hasWounds(rec) || !(toMs > fromMs)) return { rec, events };
  if (!rec.dead) {
    holdFactor(rec, fromMs, ctx);
    // (a crossing is this step's when the curve to its end has it and the curve to its start has not: one rule, however the span is cut)
    const before = bloodCurve(rec, fromMs), c = bloodCurve(rec, toMs);
    if (c.collapseMs !== null && before.collapseMs === null) events.push({ kind: 'collapse', atMs: Math.ceil(c.collapseMs) });
    if (c.roundMs !== null && before.roundMs === null) events.push({ kind: 'come-round', atMs: Math.ceil(c.roundMs) });
    if (c.deadMs !== null && !rec.dead) { die(rec, Math.ceil(c.deadMs), 'blood loss'); events.push({ kind: 'dead', atMs: rec.dead.ms, why: rec.dead.why }); }
    else if (c.blood >= 100 && !bleeding(rec, toMs) && rec.bloodMs !== undefined) { delete rec.blood; delete rec.bloodMs; delete rec.bleedK; }
  }
  if (rec.knock && rec.knock.untilMs <= toMs) { if (rec.knock.untilMs > fromMs) events.push({ kind: 'up', atMs: rec.knock.untilMs }); delete rec.knock; }
  return { rec, events };
}

/** When the next thing of this module happens after fromMs (the knock's end, the collapse, coming round, a death), or Infinity. */
export function woundsNextMs(rec, fromMs, horizonMs = DAY_MS) {
  if (!hasWounds(rec) || rec.dead) return Infinity;
  let m = rec.knock && rec.knock.untilMs > fromMs ? rec.knock.untilMs : Infinity;
  const c = bloodCurve(rec, fromMs + horizonMs);
  for (const t of [c.collapseMs, c.roundMs, c.deadMs]) if (t !== null && t > fromMs && t < m) m = Math.ceil(t);
  return m;
}

// ---- pain, adrenaline, the knock ----

const depthOf = (i) => (i.artery ? 'artery' : i.deep ? 'deep' : i.kind);
/** Adrenaline's level at ms, 0 to 1, from the last wound's time (a closed form: tradecraft kept it at runtime). */
export function adrenalK(rec, ms) {
  let last = -Infinity;
  for (const i of rec?.injuries ?? []) if (i.ms <= ms && i.ms > last) last = i.ms;
  if (last === -Infinity) return 0;
  const s = (ms - last) / SEC_MS;
  return s < ADRENALINE.holdS ? 1 : Math.max(0, 1 - (s - ADRENALINE.holdS) / ADRENALINE.fadeS);
}
/** Pain at ms, in points (the parts' states and the injuries; adrenaline's share off it unless told not). */
export function painOf(rec, ms, { adrenaline = true } = {}) {
  if (!rec) return 0;
  let pts = 0;
  for (const part of PART_KEYS) pts += PAIN[stateOf(rec, part)] ?? 0;
  for (const i of rec.injuries ?? []) pts += (i.kind === 'cut' ? PAIN[depthOf(i)] : PAIN[i.kind]) ?? 0;
  return adrenaline ? pts * (1 - ADRENALINE.k * adrenalK(rec, ms)) : pts;
}
/** Pain's cost by its points: { word, v } or null. */
export const painBand = (pts) => { const b = PAIN_BANDS.find(([at]) => pts >= at); return b ? { word: b[1], v: b[2] } : null; };
/** What a body bears before it stops where it is (tradecraft's, more with Fitness). */
export const painLimit = (rec) => PAIN_LIMIT.base + PAIN_LIMIT.perFit * Math.max(0, fitOf(rec));
/** How long a bullet's knock keeps a body down (s), by where it went in, the pain and the blood after it (tradecraft's knockS; r: the dice). */
export function knockS(rec, part, r, trained = false, ms = 0) {
  const K = KNOCK_S[part.startsWith('arm') ? 'arm' : part.startsWith('leg') ? 'leg' : part] ?? KNOCK_S.torso;
  const pain = painBand(painOf(rec, ms, { adrenaline: false }));   // (tradecraft's: the surge's share not yet kept when the knock is drawn)
  const s = range(r, ...K) * (KNOCK_PAIN[pain?.word] ?? 1) * (KNOCK_BLOOD[bandOf(rec, ms)] ?? 1) * (trained ? TRAINED_K : 1);
  return q(Math.max(KNOCK_MIN_S, Math.min(KNOCK_MAX_S, s)), 0.1);
}

// ---- consciousness, standing ----

const headOut = (rec) => stateOf(rec, 'head') === 'out' || (rec.injuries ?? []).some(i => i.internal && i.part === 'head');
/** Whether a body can stand at ms (tradecraft's canStand: alive, the blood above the collapse, a leg, the torso, the head). */
export const canStand = (rec, ms) => !rec?.dead && bloodAt(rec, ms) >= BLOOD.collapse && LEGS.some(k => stateOf(rec, k) !== 'out') && stateOf(rec, 'torso') !== 'out' && !headOut(rec);
/** BODY §17.2's level at ms: 'A' | 'V' | 'P' | 'U'. */
export function avpuOf(rec, ms) {
  if (!rec) return 'A';
  if (rec.dead) return 'U';
  const b = bloodAt(rec, ms);
  if (b < BLOOD.collapse || headOut(rec)) return 'U';
  if (b < STUPOR_BELOW && bleeding(rec, ms)) return 'P';
  if (rec.knock && rec.knock.untilMs > ms && (rec.injuries ?? []).some(i => i.part === 'head' && i.gunshot && i.ms <= ms)) return 'V';   // (knocked down by a round to the head: dazed)
  return 'A';
}
/** Down at ms, and why: { down, untilMs, why: null | 'dead' | 'collapsed' | 'head' | 'legs' | 'chest' | 'knock' | 'pain' | 'shock' }. */
export function downOf(rec, ms) {
  if (!hasWounds(rec)) return { down: false, untilMs: null, why: null };
  if (rec.dead) return { down: true, untilMs: Infinity, why: 'dead' };
  const c = bloodCurve(rec, ms), b = Math.max(0, c.blood);
  if (b < BLOOD.collapse) {
    const round = bloodCurve(rec, ms + DAY_MS).roundMs;
    return { down: true, untilMs: round !== null && round > ms ? Math.ceil(round) : Infinity, why: 'collapsed' };
  }
  if (headOut(rec)) return { down: true, untilMs: Infinity, why: 'head' };
  if (stateOf(rec, 'torso') === 'out') return { down: true, untilMs: Infinity, why: 'chest' };
  if (LEGS.every(k => stateOf(rec, k) === 'out')) return { down: true, untilMs: Infinity, why: 'legs' };
  if (rec.knock && rec.knock.untilMs > ms) return { down: true, untilMs: rec.knock.untilMs, why: 'knock' };
  if (b < BLOOD.shock) return { down: true, untilMs: Infinity, why: 'shock' };
  if (painOf(rec, ms) >= painLimit(rec) * FLOOR_K) return { down: true, untilMs: Infinity, why: 'pain' };
  return { down: false, untilMs: null, why: null };
}
/** Tradecraft's mobility (the user's, of tradecraft, 2026-11-03: "wounds should slow everyone down especially gunshot wounds"): a factor on the walk by the legs, the torso, the blood and a fresh gunshot, and whether a run is left. */
export const MOBILITY = Object.freeze({ legs: Object.freeze({ hurt: 0.85, wounded: 0.55, out: 0.3 }), torso: Object.freeze({ hurt: 0.9, wounded: 0.65 }), blood: Object.freeze({ pale: 0.85, shock: 0.6 }), gunshot: 0.8 });
export const RUN_BELOW = 0.7, GUNSHOT_DAYS = 3;
/** { k, runOk } at ms. */
export function mobilityOf(rec, ms) {
  let k = 1;
  for (const leg of LEGS) k *= MOBILITY.legs[stateOf(rec, leg)] ?? 1;
  k *= MOBILITY.torso[stateOf(rec, 'torso')] ?? 1;
  const band = bandOf(rec, ms);
  k *= MOBILITY.blood[band] ?? 1;
  if ((rec?.injuries ?? []).some(i => i.gunshot && ms - i.ms < GUNSHOT_DAYS * DAY_MS)) k *= MOBILITY.gunshot;
  return { k: q(k, 0.001), runOk: k >= RUN_BELOW && band !== 'shock' && band !== 'collapsed' };
}
/** How much harder a body bleeds for how its actor moves (× the rate): crawling, walking, running (the low-g bound is a run); still or floating, 1. */
export function exertionOf(actor) {
  const g = actor?.gait;
  if (g !== 'run' && g !== 'bound' && g !== 'walk' && g !== 'stroll') return 1;
  return actor.stance === 'down' ? EXERTION.crawl : g === 'run' || g === 'bound' ? EXERTION.run : EXERTION.walk;
}

// ---- the intake ----

const nameOf = (p) => `${p?.service?.rank ? `${p.service.rank} ` : ''}${p?.name?.family ?? p?.name ?? 'someone'}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// (a leg's or an arm's place by the strike's height on the body, when the hit gives it: hFrac 0 at the feet)
function whereOf(at, hit) {
  if (hit.where) return `${SIDE[at] ? `${SIDE[at]} ` : ''}${hit.where}`;
  if (isLimb(at) && at.startsWith('leg') && Number.isFinite(hit.hFrac)) return `${SIDE[at]} ${hit.hFrac < 0.08 ? 'foot' : hit.hFrac < 0.28 ? 'shin' : 'thigh'}`;
  if (at === 'torso' && Number.isFinite(hit.hFrac) && hit.hFrac < 0.62) return 'belly';
  return WHERE[at];
}

/**
 * A round's wound (see the header): hit is WEAPONS §8.7's record ({ onId, part: 'head' | 'torso' |
 * 'legs' | 'arms' | a PARTS key, w, margin, shotId, fromId, through, nd, hFrac?, where?, atMs? }).
 * Writes the person's body and the place's blood; emits 'wound' and 'body-dead'. Returns { injuries,
 * part, down, dead, knockS, words } or null for no such person.
 */
export function applyHit(state, bus, hit) {
  const pid = hit?.onId, p = state?.people?.[pid];
  if (!p) return null;
  const ms = hit.atMs ?? state.clock.ms, me = pid === state.player?.id;
  const rec = (p.body ??= { v: BODY_V, tmpl: BODY_TMPL[p.sex] ?? DEFAULT_TMPL });
  if (rec.dead) return { injuries: [], part: null, down: true, dead: true, knockS: 0, words: `${me ? 'You' : cap(nameOf(p))}: already dead.` };
  anchor(rec, ms);
  if (rec.dead) return { injuries: [], part: null, down: true, dead: true, knockS: 0, words: `${me ? 'You' : cap(nameOf(p))}: already dead.` };
  if (rec.fitness === undefined) rec.fitness = Math.round(valueOf(state, pid, 'fitness'));
  const w = Math.max(0.05, hit.w ?? 1), r = stream('wound', state.meta?.seed ?? 0, pid, hit.shotId ?? ms);
  const armK = ARM_SHARE * (1 - Math.max(0, Math.min(1, (hit.margin ?? 0) / 10)));
  const at = hit.part === 'legs' ? pick(r, LEGS) : hit.part === 'arms' ? pick(r, ARMS) : hit.part === 'torso' && chance(r, armK) ? pick(r, ARMS) : PARTS[hit.part] ? hit.part : 'torso';
  const raw = BULLET * w * range(r, 0.8, 1.25);
  hurt(rec, at, raw);
  const force = raw / takes(rec, at), where = whereOf(at, hit);
  const made = injure(rec, at, force, r, ms, { edge: true, deep: true, bleedK: (at === 'torso' ? TORSO_BLEED_K : LIMB_BLEED_K) * Math.min(W_BLEED_MAX, w) });
  const shot = made.find(i => i.kind === 'cut');
  // (a bone cracked where the round went in, named for the place: the foot, the thigh, the shin)
  for (const i of made) if (i.kind === 'crack' && at.startsWith('leg')) i.name = /foot$/.test(where) ? `a cracked bone in the ${where}` : /thigh$/.test(where) ? `a cracked ${SIDE[at]} thighbone` : i.name;
  if (shot) {
    shot.gunshot = true; shot.where = where;
    shot.name = shot.artery ? `a bullet through an artery in the ${where}` : `a gunshot wound in the ${where}`;
    if (hit.through) shot.through = true;
    if (hit.nd) shot.nd = true;
  }
  if (at === 'head' && chance(r, Math.min(HEAD_KILL_MAX, HEAD_KILL * Math.max(1, w)))) die(rec, ms, 'shot');
  else if (at === 'head') {
    if (chance(r, HEAD_GRAZE)) {
      if (shot) Object.assign(shot, { name: 'a bullet graze along the skull', through: false, artery: false, scalp: true, rate: Math.min(shot.rate ?? GRAZE_RATE, GRAZE_RATE), bleed: Math.min(shot.bleed ?? ms, ms + GRAZE_BLEED_MIN * MIN_MS) });
      if (shot && !shot.through) delete shot.through;
      if (shot && !shot.artery) delete shot.artery;
    } else {
      hurt(rec, 'head', takes(rec, 'head'));
      const i = { part: 'head', kind: 'cut', name: 'a bullet in the skull', ms, until: ms + 60 * DAY_MS, bleed: ms + 12 * HOUR_MS, rate: BRAIN_BLEED, deep: true, gunshot: true, internal: true };
      rec.injuries.push(i); made.push(i);
    }
  }
  if (at === 'torso') {
    const inside = rec.injuries.find(i => i.internal && i.part === 'torso' && i.bleed > ms);
    if (inside) { inside.rate = q(Math.min(CHEST_BLEED_MAX, inside.rate + CHEST_BLEED), 0.01); inside.bleed = ms + CHEST_BLEED_H * HOUR_MS; inside.name = 'bleeding inside, from the chest wounds'; }
    else { const i = { part: 'torso', kind: 'cut', name: 'bleeding inside, from the chest wound', ms, until: ms + 30 * DAY_MS, bleed: ms + CHEST_BLEED_H * HOUR_MS, rate: CHEST_BLEED, deep: true, gunshot: true, internal: true }; rec.injuries.push(i); made.push(i); }
  }
  const trained = p.service?.branch === 'marines';
  const knock = rec.dead ? 0 : knockS(rec, at, r, trained, ms);
  if (knock > 0) rec.knock = { untilMs: Math.max(rec.knock?.untilMs ?? 0, ms + Math.round(knock * SEC_MS)) };
  const dead = !!rec.dead, down = dead || !canStand(rec, ms) || knock > 0;
  // (the blood where they stood, flung away from the shooter)
  const a = me ? state.actors?.list?.find(x => x.id === state.player?.actor) : state.actors?.list?.find(x => x.who === pid);
  const from = hit.fromId ? state.actors?.list?.find(x => x.who === hit.fromId) : null;
  if (a && state.places?.live?.area) spatter(state, { area: state.places.live.area, x: a.x, z: a.z, dx: Math.sign(a.x - (from?.x ?? a.x - 1)) || 1, n: at === 'head' ? 8 : 5, who: pid, atMs: ms });
  bus?.emit('wound', { who: pid, part: at, kind: shot ? 'gunshot' : made[0]?.kind ?? 'blunt', name: shot?.name ?? made[0]?.name ?? null, rate: shot?.rate ?? 0, artery: !!shot?.artery, through: !!shot?.through, atMs: ms, down, knockS: knock });
  if (dead) bus?.emit('body-dead', { who: pid, why: rec.dead.why, atMs: rec.dead.ms });
  const who = me ? 'You' : cap(nameOf(p));
  const words = dead ? `${who}, hit in the ${where}, ${me ? 'drop' : 'drops'}, and ${me ? 'don\'t' : 'doesn\'t'} move.` : down ? `${who}, hit in the ${where}, ${me ? 'go' : 'goes'} down.` : `${who}: hit in the ${where}.`;
  return { injuries: made, part: at, down, dead, knockS: knock, words };
}
/** An ND's grade by what its hits did (WEAPONS §6.6): ND-5 a death, ND-4 a person hit, else the line's own grade. */
export const gradeOfHits = (base, applied = []) => (applied.some(x => x?.dead) ? 'ND-5' : applied.some(x => x && x.injuries) ? 'ND-4' : base);
/** The 'casualty' fact (the line's phases, BODY §27; range.js drives them). */
export function tellCasualty(bus, { who, phase, byId = null, outcome = null, bloodPct = null, atMs }) {
  bus?.emit('casualty', { who, phase, byId, outcome, bloodPct: bloodPct === null ? null : q(bloodPct, 0.01), atMs });
}

// ---- what it costs, what it says ----

const PART_USES = Object.freeze({ head: '*', torso: Object.freeze(['torso', 'breath']), armL: Object.freeze(['hands', 'arms']), armR: Object.freeze(['hands', 'arms']), legL: Object.freeze(['legs']), legR: Object.freeze(['legs']) });
const lands = (rowUses, keyUses) => rowUses === '*' || keyUses === '*' || rowUses.some(u => keyUses.includes(u));
const usesIn = (key) => (key === undefined || key === null || key === '*' || key === 'all' ? '*' : Array.isArray(key) ? (key.includes('all') ? '*' : key) : [key]);
/**
 * BODY §22's wound rows on a roll of key (a SKILLS use, a list of uses, or 'all'; mods.js resolves BODY's
 * groups before it calls) at ms: [{ why, v, src }]. ctx.skill names the roll's skill where it matters
 * (a broken arm costs Weapon handling −6, a roll on the hands without a skill named too; CQC feels no
 * pain till after).
 */
export function woundMods(rec, key, ms, ctx = {}) {
  if (!hasWounds(rec) && !Object.values(rec?.parts ?? {}).some(v => v > 0)) return [];
  const out = [], uses = usesIn(key);
  const add = (rowUses, why, v, src) => { if (v && lands(rowUses, uses)) out.push({ why, v, src }); };
  if (rec.dead) return out;
  const h = level(stateOf(rec, 'head'));
  if (h >= 2) add('*', h >= 3 ? 'dazed, a head wound' : 'a hurt head', h >= 3 ? -3 : -1, 'body:wound');
  const t = level(stateOf(rec, 'torso'));
  if (t >= 2) add(PART_USES.torso, t >= 3 ? 'a torso wound' : 'hurt ribs', t >= 3 ? -3 : -1, 'body:wound');
  const handling = ctx.skill ? ctx.skill === 'weapons' : uses !== '*' && uses.includes('hands');
  for (const k of ARMS) {
    const l = limbLevel(rec, k), tq = (rec.injuries ?? []).some(i => i.part === k && i.cared === 'tourniquet');
    if (l >= 2) add(PART_USES[k], l >= 4 ? (tq ? `a tourniquet on the ${SIDE[k]} arm` : `a broken ${SIDE[k]} arm`) : l >= 3 ? `a wounded ${SIDE[k]} arm` : `a hurt ${SIDE[k]} arm`, l >= 4 ? (handling ? -6 : -4) : l >= 3 ? -3 : -1, 'body:wound');
  }
  for (const k of LEGS) {
    const l = limbLevel(rec, k), tq = (rec.injuries ?? []).some(i => i.part === k && i.cared === 'tourniquet');
    if (l >= 2) add(PART_USES[k], l >= 4 ? (tq ? `a tourniquet on the ${SIDE[k]} leg` : `a broken ${SIDE[k]} leg`) : l >= 3 ? `a wounded ${SIDE[k]} leg` : `a hurt ${SIDE[k]} leg`, l >= 4 ? -4 : l >= 3 ? -2 : -1, 'body:wound');
  }
  for (const i of (rec.injuries ?? []).filter(j => j.kind === 'crack' || j.kind === 'fracture')) {
    add(PART_USES[i.part], i.name, i.part === 'head' ? (i.kind === 'fracture' ? -2 : -1) : i.kind === 'fracture' ? FRACTURE_MOD : CRACK_MOD, 'body:wound');
  }
  const pain = ctx.skill === 'cqc' ? null : painBand(painOf(rec, ms));
  if (pain) add('*', pain.word, pain.v, 'body:pain');
  const band = bandOf(rec, ms);
  if (band === 'pale') add('*', 'pale, light-headed', -1, 'body:blood');
  else if (band === 'shock' || band === 'collapsed') add('*', 'in shock, from the blood lost', -3, 'body:blood');
  return out;
}

// (a bleed in words: how it looks to the one who has it, never a rate)
function bleedWords(i, ms) {
  const on = i.bleed > ms, rate = i.rate ?? 0.2;
  if (i.cared === 'tourniquet') return 'a tourniquet on it';
  if (i.cared === 'dressing') return on ? 'dressed, the dressing soaking through' : 'dressed';
  if (!on) return i.bleed ? 'no longer bleeding' : null;
  return i.artery ? 'pumping blood' : rate >= HARD_BLEED_PM ? 'bleeding hard' : rate >= 0.8 ? 'bleeding' : 'oozing';
}
/** A body's wounds in words at ms (C and the instinct): one sentence each, worst first; never a number. */
export function woundWords(rec, ms) {
  if (!hasWounds(rec)) return [];
  if (rec.dead) return ['Dead.'];
  const out = [];
  const list = [...(rec.injuries ?? [])].filter(i => i.ms <= ms).sort((a, b) => (b.bleed > ms ? b.rate ?? 0 : 0) - (a.bleed > ms ? a.rate ?? 0 : 0) || a.ms - b.ms);
  const seen = new Set();
  for (const i of list) {
    if (i.internal) { if (i.part === 'torso' && !seen.has('inside')) { seen.add('inside'); out.push('A deep, spreading ache inside the chest.'); } continue; }
    const w = i.kind === 'cut' ? bleedWords(i, ms) : null;
    const line = `${cap(i.name)}${i.through ? ', the round gone through' : ''}${w ? `, ${w}` : ''}.`;
    if (!seen.has(line)) { seen.add(line); out.push(line); }
  }
  const band = bandOf(rec, ms), cold = avpuOf(rec, ms) === 'U', pain = cold ? null : painBand(painOf(rec, ms)), d = downOf(rec, ms);   // (out cold: nothing felt)
  if (band === 'pale') out.push('Pale and light-headed.');
  else if (band === 'shock') out.push('Cold, clammy, the heart racing: shock.');
  else if (band === 'collapsed') out.push('Fading.');
  if (pain) out.push(pain.word === 'agony' ? 'Agony.' : pain.word === 'bad pain' ? 'Bad pain.' : 'In pain.');
  if (d.down && d.why === 'knock') out.push('Knocked down.');
  else if (d.down && d.why !== 'collapsed') out.push('Down, and staying down.');
  return out;
}

// ---- the casualty ----

/** The corpsman's care at ms as a closed form (see the header). Writes rec; returns it. */
export function careOf(rec, ms, { tier = 'corpsman' } = {}) {   // (tier: the corpsman's is the only one this round; the IFAK's steps are 0.1.x's)
  if (!hasWounds(rec) || rec.dead) return rec;
  anchor(rec, ms);
  if (rec.dead) return rec;
  for (const i of rec.injuries ?? []) {
    if (!(i.bleed > ms) || i.internal || i.cared) continue;
    if (isLimb(i.part)) { i.bleed = ms; i.cared = 'tourniquet'; }
    else { i.rate = q((i.rate ?? 0.2) * PRESSURE_K, 0.01); i.cared = 'dressing'; }
  }
  return rec;
}
const OUTCOME_WORDS = Object.freeze({ dead: 'died before the aid station', stabilised: 'stabilised on the line', evacuated: 'evacuated to the aid station' });
/**
 * The casualty's outcome from fromMs (care given) over the ambulance's evacMs, lying still (see the
 * header): { outcome: 'stabilised' | 'evacuated' | 'dead', atMs, bloodPct, words }. Pure.
 */
export function casualtyOutcome(rec, { fromMs, evacMs = EVAC_MIN * MIN_MS } = {}) {
  if (rec?.dead) return { outcome: 'dead', atMs: rec.dead.ms, bloodPct: q(rec.blood ?? 0, 0.01), words: rec.dead.why === 'shot' ? 'killed outright' : OUTCOME_WORDS.dead };
  const c0 = { ...rec, injuries: rec?.injuries ?? [] };
  anchor(c0, fromMs);                                              // (a copy: lying in the ambulance, nothing pressing but the dressings)
  if (c0.dead) return { outcome: 'dead', atMs: c0.dead.ms, bloodPct: q(c0.blood, 0.01), words: OUTCOME_WORDS.dead };
  delete c0.bleedK;
  const arrive = fromMs + evacMs, c = bloodCurve(c0, arrive);
  if (c.deadMs !== null) return { outcome: 'dead', atMs: Math.ceil(c.deadMs), bloodPct: BLOOD.dead, words: OUTCOME_WORDS.dead };
  const out = PART_KEYS.some(k => stateOf(c0, k) === 'out') || c0.injuries.some(i => i.cared === 'tourniquet') || headOut(c0);
  const stable = bleedRate(c0, fromMs) <= STABLE_BLEED_PM && bloodAt(c0, fromMs) >= STABLE_BLOOD && !out;
  return stable ? { outcome: 'stabilised', atMs: fromMs, bloodPct: q(bloodAt(c0, fromMs), 0.01), words: OUTCOME_WORDS.stabilised }
    : { outcome: 'evacuated', atMs: arrive, bloodPct: q(c.blood, 0.01), words: OUTCOME_WORDS.evacuated };
}
/** Where a body was hit, in words ('the left foot'), from its first gunshot wound, or null. */
export function hitWhere(rec) {
  const i = (rec?.injuries ?? []).find(j => j.gunshot && !j.internal);
  return i ? (i.scalp ? 'the head' : `the ${i.where ?? WHERE[i.part]}`) : null;
}
/** The card's line for a casualty (the sheet §2.3): "You were hit in the left foot: evacuated to the aid station"; "Pvt Okafor hit in the left thigh by a negligent discharge, evacuated". */
export function casualtyLine(state, pid, outcome, { nd = true } = {}) {
  const p = state?.people?.[pid], rec = p?.body, where = hitWhere(rec) ?? 'the body', me = pid === state?.player?.id;
  return me ? `You were hit in ${where}: ${outcome.words}` : `${nameOf(p)} hit in ${where}${nd ? ' by a negligent discharge' : ''}, ${OUTCOME_SHORT[outcome.outcome] ?? outcome.outcome}`;
}
const OUTCOME_SHORT = Object.freeze({ dead: 'dead', stabilised: 'stabilised', evacuated: 'evacuated' });
