// OLYMPUS people: names, drawn by culture and sex from SETTING's pools, and the registry that keeps every full name in the world unique (PEOPLE §3.5; SETTING §12).
//
// personName(culture, homeId, sex, r) draws { given, family } on the dice r (an sfc32 state from
// core/rng.js): the culture's given pools by weight (src/data/setting/names.js CULTURES: a valley
// marine's given name from the valley list at 60%, the dome list at 15%, GIVEN at 25%), then a name
// of the person's sex or worn by both, evenly; the family name the same way, the founders' share
// doubled for a Londres Nova home (SETTING §12.1). Names are LONGHAUL's lists and SETTING's additions,
// nothing written here.
//
// The registry is state.names.people, { '<full name>': personId } (TECH §6.1: PEOPLE's names key,
// LONGHAUL's registry made persistent): fullName(name) is the key ("Saskia Ibarra", or with a middle
// name "Saskia Ruth Ibarra"), nameTaken(state, full) asks it, registerName(state, full, id) writes it.
// nameRejected(state, name, rules) is the one check the roster runs on a draw, and says why a name is
// refused, or null: a full name already in the world, one of SETTING §12.6's canon full names, a
// blocked family name for tier 1 or 2, a given or family name already in the squad, or a family name
// already twice in the company (PEOPLE §3.5: "Family names may repeat once within a company").
// middleName(culture, homeId, sex, r) is the escape SETTING §12.5 gives a full name still taken after
// the rerolls: one more given name between the two.
import { weighted, pick } from '../../core/rng.js';
import { CULTURES, GIVEN_POOLS, FAMILY_POOLS, BLOCKED_FULL, BLOCKED_FAMILY_T12 } from '../../data/setting/names.js';
import { homeOf } from '../../data/setting/homes.js';

const BLOCKED = new Set(BLOCKED_FULL);
const BLOCKED_FAMILY = new Set(BLOCKED_FAMILY_T12);
// (a sex's share of a pool: the names of its sex and those worn by both, cached by pool)
const bySex = new Map();
function namesFor(pool, sex) {
  let m = bySex.get(pool);
  if (!m) bySex.set(pool, (m = new Map()));
  if (!m.has(sex)) m.set(sex, Object.freeze([...(sex === 'f' ? pool.f : pool.m), ...pool.any]));
  return m.get(sex);
}

/** The culture record of a name culture (SETTING §12.1); throws on one it lacks. */
export function cultureOf(culture) {
  const c = CULTURES[culture];
  if (!c) throw new Error(`people: no name culture '${culture}' (${Object.keys(CULTURES).join(', ')})`);
  return c;
}

/** A given name of a sex from a culture's pools, on the dice r. */
export function givenName(culture, sex, r) {
  return pick(r, namesFor(GIVEN_POOLS[weighted(r, cultureOf(culture).given)], sex));
}

/** A family name from a culture's pools, on the dice r: the founders' share doubled for a Londres Nova home. */
export function familyName(culture, homeId, r) {
  const c = cultureOf(culture);
  const londres = c.founderLondres && homeOf(homeId)?.founderLondres;
  const weights = londres ? c.family.map(([k, w]) => (k === 'founder' ? [k, c.founderLondres] : [k, 100 - c.founderLondres])) : c.family;
  return pick(r, FAMILY_POOLS[weighted(r, weights)]);
}

/** A person's name, { given, family }, by culture, home and sex, on the dice r (PEOPLE §3.5). */
export function personName(culture, homeId, sex, r) {
  const given = givenName(culture, sex, r);
  return { given, family: familyName(culture, homeId, r) };
}

/** A middle name (SETTING §12.5's escape for a full name still taken after the rerolls). */
export const middleName = (culture, homeId, sex, r) => givenName(culture, sex, r);

/** The registry's key for a name: "Given Family", or "Given Middle Family". */
export const fullName = (name) => (name.middle ? `${name.given} ${name.middle} ${name.family}` : `${name.given} ${name.family}`);

/** Whether a full name is already someone's in this world. */
export const nameTaken = (state, full) => Object.prototype.hasOwnProperty.call(state.names?.people ?? {}, full);

/** Write a full name into the registry for a person. Throws if it is someone else's. */
export function registerName(state, full, id) {
  const reg = (state.names ??= { people: {}, ships: {}, ops: {} }).people ??= {};
  if (reg[full] && reg[full] !== id) throw new Error(`people: the name '${full}' is ${reg[full]}'s already`);
  reg[full] = id;
}

/**
 * Why a drawn name is refused, or null. rules: { tier, squad: { given: Set, family: Set } | null,
 * companyFamily: Map family → count | null, registry: false to leave the registry out (the middle
 * name's turn) }.
 */
export function nameRejected(state, name, { tier = 2, squad = null, companyFamily = null, registry = true } = {}) {
  const full = fullName(name);
  if (BLOCKED.has(`${name.given} ${name.family}`) || BLOCKED.has(full)) return 'canon';
  if (tier <= 2 && BLOCKED_FAMILY.has(name.family)) return 'blocked-family';
  if (squad && (squad.given.has(name.given) || squad.family.has(name.family))) return 'squad';
  if (companyFamily && (companyFamily.get(name.family) ?? 0) >= 2) return 'company';
  if (registry && nameTaken(state, full)) return 'taken';
  return null;
}
