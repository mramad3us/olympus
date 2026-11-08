// OLYMPUS core: the physical constants and the gas law, once (TECH §1.4; PLACES §3.2, §3.16).
//
// Every module that needs standard gravity, the gas constant or air's ratio of heats reads them here,
// so there is one G0 in the game (ballistics.js and combat/steps.js each had their own until the
// environment foundation, ROADMAP's row "anywhere"). gasOf() is the ideal gas law a place's air is
// read through: the density ρ = P M / (R T) and the speed of sound c = √(γ R T / M), with P in kPa, T
// from °C and M the air's molar mass in kg/mol; no pressure (vacuum) is no air and no sound. The
// operations are in the order ballistics.js has always done them, so every number it printed holds to
// the last bit. Nothing here knows a body, a site or an air: those are data (src/data/places/env.js).
// Pure.

/** Earth's standard gravity (m/s²): one G. */
export const G0_MS2 = 9.80665;
/** The molar gas constant (J/(mol·K)). */
export const R_GAS = 8.314462618;
/** Air's ratio of specific heats (diatomic: N₂ and O₂). */
export const GAMMA_AIR = 1.4;
/** 0 °C in kelvin. */
export const ZERO_C_K = 273.15;

/** An air's density and speed of sound: { rhoKgM3, soundMs }; { 0, 0 } with no pressure. A molar mass is required where there is air. */
export function gasOf(pKpa, airC, molarKgMol) {
  if (!(pKpa > 0)) return { rhoKgM3: 0, soundMs: 0 };
  if (!(molarKgMol > 0)) throw new Error(`gasOf(): an air at ${pKpa} kPa needs its molar mass, not ${molarKgMol}`);
  if (!Number.isFinite(airC)) throw new Error(`gasOf(): an air at ${pKpa} kPa needs its temperature, not ${airC}`);
  const T = airC + ZERO_C_K, M = molarKgMol;
  return { rhoKgM3: pKpa * 1000 * M / (R_GAS * T), soundMs: Math.sqrt(GAMMA_AIR * R_GAS * T / M) };
}
