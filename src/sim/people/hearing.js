// OLYMPUS people: hearing's one air law, the factor every sound is scaled by in thin air (PEOPLE §7.3; the 0.0.3 build sheet §2.2, §8 item 16).
//
// PEOPLE §7.3 settles one law for every sound, after the critics found three (a square root here,
// VIEWS §11.2's −20 dB a decade of pressure, WEAPONS §7.12's linear scale): a sound's audible radius
// goes with the square root of the air's pressure against Earth's sea level, AIR_REF_KPA 101.3 (ship
// air too), and nothing carries through air under AIR_MIN_KPA 0.1. airK(pKpa) is that factor (0.81 on
// the Mariner Valley's floor at 66 kPa, 0.08 for the 0.6 kPa of Mars before the terraforming), airDb
// the same law in decibels, 10 log10(P / 101.3) = 20 log10(airK) (−1.9 dB at Melas's 65.9 kPa, the
// audio's gain: hud's src/ui/audio reads it; VIEWS keeps its own low-pass, which models absorption,
// not loudness). The exponent is PEOPLE's fit to the Mars microphones' 20 dB at 0.6 kPa, bent for
// play. Hearing as perception (who hears what, through doors and bulkheads) is not built this round:
// only the law, so the one number the sound plays by is the one perception will use.
// Pure.

/** Earth's sea-level air, and ship air (PEOPLE §7.3). */
export const AIR_REF_KPA = 101.3;
/** Below this, nothing carries through the air (PEOPLE §7.3). */
export const AIR_MIN_KPA = 0.1;

/** A sound's audible radius factor at pressure pKpa: 0 under AIR_MIN_KPA, else √(P / 101.3). */
export const airK = (pKpa) => (pKpa < AIR_MIN_KPA ? 0 : Math.sqrt(pKpa / AIR_REF_KPA));

/** The same law in decibels against Earth: −Infinity under AIR_MIN_KPA, else 10 log10(P / 101.3). */
export const airDb = (pKpa) => (pKpa < AIR_MIN_KPA ? -Infinity : 10 * Math.log10(pKpa / AIR_REF_KPA));
