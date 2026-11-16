// OLYMPUS combat: the would-have of a marking round, what the live round it stands for would have done to the man it struck, by the game's own armour and wound model, and the one rule that judges every strike on the live lane fatal or not (COMBAT §25.18.7; v0.0.20, the user's answer of 2026-11-16 to v0.0.19's question 7: "Paintball should end if the hit is 'fatal'").
//
// One rule for everyone a marking round strikes, you, your number two and the role-players: a strike (men.js incoming's on a
// marine, opfor.js opforHit's on a role-player, both through strikeOf from shot.js resolveShot's record) is rated once, on its
// tick, by wouldHave, which writes the lane's ledger R.house.live.would = { rule, bodies, wear, log }:
//   1. The live load the marking round stands for: STANDS_FOR, the calibre's service ball (the R-7's 6.5×40 at 788 m/s at 5 m,
//      the P-12's 9×21 at 385 m/s), its speed at the strike's range in the place's air (ballistics.js flightOf, envOfPlace). My
//      call: never the frangible, the shoot house's paper load, which no soft panel lets through, so no man could fall by the body.
//   2. The round on the body by the live path's own helper, penetrate.js bodyHit (traceRound's body branch; v0.0.20's code review:
//      the first build had a second copy that took w after the panel): the armour as the man's kit wears it (his carrier's model's
//      `armour`, kit.js CONTAINERS 'pc-m3': 'carrierTraining', the soft panel over 0.85 of the torso, its plates out for training;
//      penetrate.js ARMOUR); on the torso an arm in front of the carrier first (wounds.js armShareOf, 15% at a margin of 0, none
//      from 10), then the layer it lands on (layerHit at the strike's margin) and its contest (throughLayer at the man's wear of
//      it so far, kept on the ledger), the tissue at the pen left, and WEAPONS §8.7's record with w at the impact's speed (1.61
//      for the R-7 at 5 m, through the panel or not; the panel's toll is in the exit). Stopped, the strike is 'stopped' and
//      nothing more: the blunt trauma behind a stop (penetrate.js bluntOf) is BODY's to apply and not built. The suit and the
//      force-on-force mask have no rating (WEAPONS §3.2: the suit's protection "not built"), so the head is bare for everyone; a
//      strike on the legs or the arms (strikeOf passes them) meets no armour.
//   3. The wound: wounds.js applyHit with that record, on a scratch state holding only the man (his sex, his service, so a
//      marine's knock is trained, and his would-have body), bus null: no fact, no blood on the floor, never his own
//      people[pid].body. The would-have body is kept on the ledger (bodies[pid], a body record of the wound model's fields), its
//      Fitness the man's at his first strike, as applyHit fixes it, and from each strike on its bleeding held at a walk's exertion
//      (EXERTION.walk, WOULD_EXERTION), so the next strike finds the blood he would have lost meanwhile. Its dice are applyHit's
//      own stream('wound', seed, pid, shotId); bodyHit's stream('would', seed, pid, shotId): a strike's verdict is a pure function
//      of the seed, the man and the shot.
// **Fatal** (fatalWhy): right after the strike, on the would-have body, at its millisecond,
//   killed     the body is dead (a head kill, or the blood under BLOOD.dead 45%), or
//   down for good at once: wounds.js downOf judged as if the knock had passed (knock false: the head out, the torso out
//              ('chest'), collapsed, shock under 70% of the blood, both legs, past the pain's floor); the knock follows every
//              round (2 to 180 s, ×0.4 trained) and says nothing of what kills (applyHit's own `down` is true on every hit), and
//              read first it hid shock and the pain, so it is left out; or
//   bleeds     the blood, at a walk, would cross the collapse (55%) within BLEED_OUT_MS 120 s of the strike: a man out cold from
//              the blood inside the longest live lane would not have finished it, and a deep wound bleeds untended for DEEP_H 6 h.
// Anything else is a wound (or 'stopped'), and the man carries on: what he feels of it is the sting only (supp.js's 'hit', as
// v0.0.19; my call: no limp, no one-hand drill, no knock this round: the would-have body is the lane's record, never his own,
// so nothing of woundMods or mobilityOf reaches him for free). Measured (2,000 strikes a cell, 5 m, margin 6, the second strike
// 350 ms after the first; .run/asks-v020/measure-fix/table.mjs): one body strike of either gun is never fatal at Fitness 8 to
// 21; two rifle strikes are fatal for 91% of boot recruits (Fitness 8), 88% at 12, 82% at 14, 45% at 19 and 25% of tier ones
// (21); a rifle round in the head 99 to 100%, a P-12's 88 to 91%; the panel lets a 6.5 ball through 98.6% of the time and stops
// the 9×21 ball always (91% of P-12 torso strikes stopped, the rest an arm in front of the carrier or the torso's bare 15%).
// fatalOf(state, pid) is the one reader of the verdicts: the first fatal entry on a man, or null (the casualty, a role-player's
// down, his card's words). A lane saved by v0.0.19 (the upgrade 'arms:house-would' gives it rule 'count') is judged to its end by
// v0.0.19's count (COUNT_DOWN: two torso strikes, A or C, or one head; its strikes have no margin or range saved to rate them by,
// my call). wouldWords(state, pid, ms) says a man's would-have in the wound model's words, never a number; wouldWash(state, pid)
// is the hot wash's, a fatal strike's verdict first (WOULD_WASH) and the words read at the strike that decided it, never the knock.
// Pure but wouldHave, which writes the ledger, and upgradeHouseWould (w).
import { applyHit, downOf, bloodCurve, holdFactor, woundWords, EXERTION } from '../body/wounds.js';
import { BODY_V } from '../body/record.js';
import { BODY_TMPL } from '../../data/people/looks.js';
import { DEFAULT_TMPL } from '../../data/body/templates.js';
import { bodyHit, LAYERS, ARMOUR } from '../arms/penetrate.js';
import { flightOf, envOfPlace } from '../arms/ballistics.js';
import { MODELS } from '../arms/models.js';
import { CONTAINERS } from '../arms/kit.js';
import { valueOf } from '../skills/templates.js';
import { stream } from '../../core/rng.js';

/** A strike whose blood, at a walk, crosses the collapse within this is fatal (ms: the longest live lane, LIVE_LANE_MAX_S 120 s). */
export const BLEED_OUT_MS = 120_000;
/** The would-have body bleeds at a walking man's exertion (× the rate: wounds.js EXERTION.walk; the stack moves through the house). */
export const WOULD_EXERTION = EXERTION.walk;
/** The live load a marking round stands for, by calibre: the service ball (see the header; my call). */
export const STANDS_FOR = Object.freeze({ '6.5x40r': 'ball', '9x21r': 'ball' });
/** A strike's margin where its record has none (the tests' hand-made records, an old save's): the zone's floor (paper.js A_MARGIN 4 for A and the head, 0 for C). */
export const MARGIN_OF_ZONE = Object.freeze({ A: 4, C: 0, head: 4 });
/** v0.0.19's count, for a lane it saved (rule 'count'): two torso strikes (A or C) or one head (the stands' sensor; men.js MARINE_DOWN reads it). */
export const COUNT_DOWN = Object.freeze({ torso: 2, head: 1 });
/** The card's words for a fatal strike, by its why (never a number). */
export const WOULD_WHY = Object.freeze({ killed: 'KILLED OUTRIGHT', head: 'A ROUND IN THE HEAD', chest: 'THE CHEST', collapsed: 'BLED OUT', bleeds: 'BLED OUT', shock: 'SHOCK FROM THE BLOOD LOST', legs: 'BOTH LEGS', pain: 'THE PAIN', count: 'TWO TORSO OR ONE HEAD' });

const LIMBS = new Set(['legs', 'arms']);
const ledgerOf = (state) => state.armoury?.range?.house?.live?.would ?? null;

/** The ledger a live lane starts with (opfor.js fillOpfor writes it): the rule 'wound', nothing rated yet. */
export const newLedger = () => ({ rule: 'wound', bodies: {}, wear: {}, log: [] });

/**
 * A strike from shot.js resolveShot's record (see the header): { on, by, shotId, atMs, part, zone, margin, rangeM, gunId }. on: the
 * man struck; by: who fired (a role-player's turner key, or a marine's 'me' | 'two'); part and zone as the hit records them.
 */
export function strikeOf(state, shot, { on, by = null, part = shot?.part ?? 'torso', zone = shot?.zone ?? null } = {}) {
  // (the part as the hit gives it: the head, the legs, the arms, else the torso (a leg or an arm was rated as the
  // torso, through its panel; applyHit and bodyHit take each))
  const head = part === 'head' || zone === 'head', at = head ? 'head' : LIMBS.has(part) ? part : 'torso';
  const margin = Number.isFinite(shot?.roll?.margin) ? shot.roll.margin : MARGIN_OF_ZONE[head ? 'head' : zone] ?? 0;
  const rangeM = Number.isFinite(shot?.flight?.rangeM) ? shot.flight.rangeM : 5;
  return { on, by, shotId: shot?.id ?? null, atMs: shot?.atMs ?? state.clock.ms, part: at, zone, margin, rangeM, gunId: shot?.gun ?? null };
}

// (the cover a man's worn carrier gives the torso: its model's armour kind (kit.js CONTAINERS), penetrate.js ARMOUR's cover; none, null)
function coverOn(state, pid) {
  const id = state.people?.[pid]?.kit?.worn?.carrier, kind = id ? CONTAINERS[state.items?.[id]?.model]?.armour : null;
  return kind ? ARMOUR[kind]?.cover ?? null : null;
}

/** Why a would-have body is fatal at ms (see the header): 'killed', a downOf why but the knock, 'bleeds', or null. */
export function fatalWhy(body, ms) {
  if (body?.dead) return 'killed';
  // (judged as if the knock had passed (downOf's knock false): the knock follows every round and hid shock and the pain's floor,
  // which the header names (the code review of v0.0.20's asks: 'shock' and 'pain' could never be returned))
  const d = downOf(body, ms, { knock: false });
  if (d.down) return d.why;
  const c = bloodCurve(body, ms + BLEED_OUT_MS);
  return c.collapseMs !== null || c.deadMs !== null ? 'bleeds' : null;
}

/**
 * A strike rated (w: the ledger; see the header): its entry { shotId, on, by, atMs, part, zone, layer, fatal, why, where, w },
 * written once (a strike handed twice is read back), or null on a lane with no ledger.
 */
export function wouldHave(state, strike) {
  // (a live lane's record made without its ledger (a test's hand-made one): the rule 'wound', made here; a save of v0.0.19's has
  // the rule 'count' from its upgrade before any strike reaches this)
  const L = state.armoury?.range?.house?.live, W = L ? (L.would ??= newLedger()) : null;
  if (!W || !strike?.on) return null;
  const seen = W.log.find(x => x.shotId === strike.shotId && x.on === strike.on);
  if (seen) return seen;
  const { on, by, shotId, atMs: ms, zone } = strike, part = strike.part === 'head' || LIMBS.has(strike.part) ? strike.part : 'torso';
  const entry = { shotId, on, by, atMs: ms, part, zone };
  if (W.rule === 'count') { W.log.push(Object.assign(entry, { layer: null, fatal: false, why: null, where: null, w: null })); return entry; }
  const p = state.people?.[on], gun = state.items?.[strike.gunId], model = MODELS[gun?.model] ? gun.model : 'r7', cal = MODELS[model].cal, load = STANDS_FOR[cal] ?? 'ball';
  const r = stream('would', state.meta?.seed ?? 0, on, shotId ?? ms), rangeM = Math.max(0, strike.rangeM ?? 5);
  const v = flightOf(model, load, envOfPlace(state), rangeM).vMs;
  // (the round on the body by the live path's own helper (penetrate.js bodyHit, traceRound's): an arm in front of the carrier first,
  // the layer as worn and its contest at the man's wear of it, the tissue, the record with w at the impact's speed)
  const b = bodyHit(r, { onId: on, part, rangeM, cal, load, vMs: v, margin: strike.margin, shotId, cover: coverOn(state, on), wear: W.wear[on] ?? {} });
  if (b.layer !== 'bare') W.wear[on] = b.wear;
  if (b.stopped) { W.log.push(Object.assign(entry, { part: b.part, layer: b.layer, fatal: false, why: 'stopped', where: null, w: 0 })); return entry; }
  // (the wound on a scratch state holding the man alone: applyHit writes only the body it is given, emits nothing (bus null), spills nothing (no actor, no place))
  const body = (W.bodies[on] ??= { v: BODY_V, tmpl: BODY_TMPL[p?.sex] ?? DEFAULT_TMPL, fitness: Math.round(valueOf(state, on, 'fitness')) });
  const S = { meta: { seed: state.meta?.seed ?? 0 }, clock: { ms }, player: { id: null }, people: { [on]: { sex: p?.sex, service: p?.service, name: p?.name, body } }, actors: { list: [] }, places: {} };
  const out = applyHit(S, null, { ...b.hit, atMs: ms });
  holdFactor(body, ms, { exertion: WOULD_EXERTION });
  const why = fatalWhy(body, ms), shotWound = out?.injuries?.find(i => i.gunshot && !i.internal);
  W.log.push(Object.assign(entry, { part: out?.part ?? b.part, layer: b.layer, fatal: why !== null, why, where: shotWound?.where ?? (out?.part === 'head' ? 'head' : null), w: b.hit.w }));
  return entry;
}

/** The first fatal strike on a man (see the header), or null; on a v0.0.19 lane (rule 'count') v0.0.19's count, its strikes the house's. */
export function fatalOf(state, pid) {
  const H = state.armoury?.range?.house, W = H?.live?.would;
  if (!W || !pid) return null;
  if (W.rule !== 'count') return W.log.find(x => x.on === pid && x.fatal) ?? null;
  const T = state.armoury.range.turners?.find(t => t.live?.who === pid), list = T ? T.hits.map(h => ({ ...h, on: pid })) : (H.live.struck ?? []).filter(s => s.who === pid);
  let torso = 0, head = 0;
  for (const s of list) {
    if (s.zone === 'head') head++; else if (s.part === 'torso' && (s.zone === 'A' || s.zone === 'C')) torso++;
    if (torso >= COUNT_DOWN.torso || head >= COUNT_DOWN.head) return { shotId: s.shotId, on: pid, by: s.by ?? null, atMs: s.atMs, part: s.part, zone: s.zone, layer: null, fatal: true, why: 'count', where: null };
  }
  return null;
}

/** A man's strikes on the ledger (in order), and their tally: { list, wounds, stopped, fatal }. */
export function wouldOn(state, pid) {
  const list = (ledgerOf(state)?.log ?? []).filter(x => x.on === pid);
  return { list, wounds: list.filter(x => !x.fatal && x.why !== 'stopped' && x.layer !== null).length, stopped: list.filter(x => x.why === 'stopped').length, fatal: list.filter(x => x.fatal).length };
}

/** A man's would-have in words at ms (the wound model's sentences, wounds.js woundWords; never a number), or []. */
export function wouldWords(state, pid, ms = state.clock.ms) {
  const body = ledgerOf(state)?.bodies?.[pid];
  return body ? woundWords(body, ms) : [];
}

/** The hot wash's verdict for a fatal strike, by its why (lower case, never a number; the bleed's limit in minutes from BLEED_OUT_MS). */
export const WOULD_WASH = Object.freeze({ killed: 'killed outright', head: 'down, and staying down: a round in the head', chest: 'down, and staying down: the chest',
  collapsed: 'out cold from the blood lost', bleeds: `bled out inside ${Math.round(BLEED_OUT_MS / 60_000)} minutes`, shock: 'down, and staying down: shock from the blood lost',
  legs: 'down, and staying down: both legs', pain: 'down, and staying down: the pain', count: 'down by the count, two torso or one head' });
/**
 * A man's would-have for the hot wash: a fatal strike's verdict first (WOULD_WASH), then the wound model's sentences
 * read at the strike that decided it (the fatal one, else his last), lower case, without the knock's "Knocked down." (the rule leaves
 * the knock out) or "Dead." (the verdict says it); [] for a man never struck, or struck only on the panel.
 */
export function wouldWash(state, pid) {
  const L = ledgerOf(state), list = (L?.log ?? []).filter(x => x.on === pid && x.layer !== null && x.why !== 'stopped');
  if (!list.length) return [];
  const f = list.find(x => x.fatal), at = (f ?? list.at(-1)).atMs, body = L.bodies?.[pid];
  const words = (body ? woundWords(body, at) : []).filter(x => x !== 'Knocked down.' && x !== 'Dead.' && x !== 'Down, and staying down.')
    .map(x => x.replace(/\.$/, '')).map(x => x.charAt(0).toLowerCase() + x.slice(1));
  return f ? [WOULD_WASH[f.why] ?? 'fatal', ...words] : words;
}

/** A strike's would-have in the paper's words: "FATAL", "STOPPED BY THE SOFT PANEL", "WOUNDED, THE CHEST" (the run sheet and the card). */
export function strikeWords(x) {
  if (!x) return '';
  if (x.fatal) return 'FATAL';
  if (x.why === 'stopped') return `STOPPED BY ${String(LAYERS[x.layer]?.word ?? 'the armour').toUpperCase()}`;
  return x.where ? `WOUNDED, ${String(x.where).toUpperCase()}` : 'WOUNDED';
}

/**
 * The upgrade 'arms:house-would' (w; the arms domain's list): a live lane saved by v0.0.19 (R.house.live, no ledger) gains one with
 * the rule 'count', so it finishes by v0.0.19's count (see the header). A run no-op once it has one, and on every other save.
 */
export function upgradeHouseWould(state) {
  const L = state.armoury?.range?.house?.live;
  if (!L || L.would) return;
  L.would = { ...newLedger(), rule: 'count' };
}
