// OLYMPUS sim: the roller, one person's side of every check, with their body and needs in it (SKILLS §5.4, §16; COMBAT §18; the build sheet 0.0.5 §2.2, §8 item 11).
//
// Skills never import the body (TECH correction 8: src/sim/skills/ depends on core only), so the one
// place a roll meets the person rolling it is here. rollerOf(state, pid, { ms }) is
//     { pid, value(skill) → n, mods(skill, ctx) → [{ why, v, src }], light }
// value from SKILLS' value() on the person's sheet (sheetOf: their own, else a lazy one by their rank's
// tier); mods BODY's bodyMods and needMods on the skill's uses (SKILLS §2.2: Marksmanship eyes, arms
// and breath; Weapon handling hands and eyes), each one entry per cause with its src ('body:thermal',
// 'need:fatigue', …), and "no light to see it by" −2 (tradecraft's stress(), WEAPONS §5.1) on handling
// when the light where the person stands is dark (places' lightLevel under DARK_BELOW 0.25, tradecraft's
// band); light the light there, 0 to 1. ctx passes to BODY ({ ms, targetM, … }) and may say
// { noLight: false } to leave the light's term out (a look at a chamber held open to the light, say).
// A roller is what every handling step, every shot and every plaque is computed from, so the plaque's
// odds and the roll's are one list (SKILLS §5.3). fixedRoller(values, { mods, light }) is the tests'
// own: fixed values and a fixed list, no state, calm (felt 0, timeK 1).
// 0.0.9 (the build sheet 0.0.9 §2.1; COMBAT §5.3, §5.9): the chaos is the roller's one entry. rollerOf reads felt at its
// ms (supp.js feltOf: 0 at once with no combat block, hardening never computed) and carries { felt, timeK } (suppTimeK:
// exactly 1 at felt 0, the factor on handling, the aim and the rows' parts); mods appends suppMod(felt, skill) as one
// 'env' entry (absent at 0), in place of firearms.js's retired PRESSURE_MODS.fire; while flash-blind "no light to see it
// by" −2 on handling (once: never twice with the dark), while dazzled 'dazzled' DAZZLE_SIGHT on Awareness.
// Pure.
import { lightLevel } from '../places/light.js';
import { bodyMods, needMods } from '../body/mods.js';
import { SKILLS } from '../skills/skills.js';
import { valueOf } from '../skills/templates.js';
import { playerActor } from '../../core/ids.js';
import { feltOf, suppMod, suppTimeK, blockOf, DAZZLE_SIGHT } from './supp.js';

/** Below this light a hand cannot see the gun it works (tradecraft's lightBand 'dark'). */
export const DARK_BELOW = 0.25;
/** Below this the light is dim (tradecraft's 'dim'). */
export const DIM_BELOW = 0.6;
/** The skills a dark place costs: handling the gun by feel (WEAPONS §5.1). */
export const LIGHT_SKILLS = Object.freeze(new Set(['weapons']));

/** Where a person stands, if they have an actor on the live area: { x, z } or null. */
export function standOf(state, pid) {
  const me = playerActor(state);
  if (me && me.who === pid) return me;
  return state.actors?.list?.find(a => a.who === pid) ?? null;
}

/** The light where a person stands (0 to 1), 1 when they stand nowhere the places know. */
export function lightOf(state, pid, ms = state.clock.ms) {
  const a = standOf(state, pid);
  if (!a || !state.places?.live?.area) return 1;
  return lightLevel(state, a.x, a.z, ms);
}

/** A person's roller (see the header). */
export function rollerOf(state, pid, { ms = state.clock.ms } = {}) {
  const light = lightOf(state, pid, ms), felt = feltOf(state, pid, ms), timeK = suppTimeK(felt);
  // (the flash's eyes: blind or dazzled at ms, from the combat block; none without one)
  const rec = blockOf(state, pid), blind = !!rec && Number.isFinite(rec.blindUntilMs) && ms < rec.blindUntilMs;
  const dazzled = !!rec && !blind && Number.isFinite(rec.dazzleUntilMs) && ms < rec.dazzleUntilMs;
  return Object.freeze({
    pid, light, felt, timeK,
    value: (skill) => valueOf(state, pid, skill),
    mods(skill, ctx = {}) {
      const uses = SKILLS[skill]?.uses ?? 'all', c = { ms, ...ctx };
      const out = [...bodyMods(state, pid, uses, c), ...needMods(state, pid, uses, c)];
      if (LIGHT_SKILLS.has(skill) && ((ctx.noLight !== false && light < DARK_BELOW) || blind)) out.push({ why: 'no light to see it by', v: -2, src: 'env' });
      if (skill === 'awareness' && dazzled) out.push({ why: 'dazzled', v: DAZZLE_SIGHT, src: 'env' });
      const s = suppMod(felt, skill);
      if (s) out.push(s);
      return out;
    },
  });
}

/** The tests' roller: fixed values ({ <skill>: n }), a fixed list of mods for every skill, a light. */
export function fixedRoller(values = { weapons: 10, marksmanship: 10, awareness: 14, fitness: 13 }, { mods = [], light = 1, pid = null } = {}) {
  return Object.freeze({ pid, light, felt: 0, timeK: 1, value: (skill) => values[skill] ?? 0, mods: () => [...mods] });
}
