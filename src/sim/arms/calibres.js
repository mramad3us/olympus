// OLYMPUS arms: the calibres, what a round is, by its name (WEAPONS §2.2, §2.3, §2.10; the build sheet 0.0.5 §2.1).
//
// A magazine takes one calibre and a box of rounds is one calibre (tradecraft's rule from the user,
// 2026-11-03: "ammunition shouldn't be 'rounds' it should be very specific calibers based on specific
// caliber magazines used on specific weapons"). Each calibre is a real-world-sized cartridge given a
// Martian identity, its numbers WEAPONS §2.2's: the bullet's diameter, the case (its length and mass,
// what the brass weighs as it flies, §2.8), the propellant, the box of loose rounds; and its loads
// (§2.3), each a variant with its own bullet: ball (the ground standard), tracer, the blank and the
// orange dummy of drills (the coach's set round, §11.3). The ballistic fields (vRefMs at refBarrelMm,
// the G7 coefficient, the penetration at the muzzle and its fall with speed, the wound factor) are
// read by 0.0.7's ballistics.js and penetrate.js; this round reads only the words and the case.
//
// This round's cut (the build sheet's §2.1): 6.5×40 mm Republic (the R-7's: ball, tracer, blank,
// dummy) and 9×21 mm Republic ball (the P-12's, named so a pistol magazine has a calibre to say).
// The rest of §2.2's nine come with their guns. Data only: frozen literals and one lookup.

/** The calibres (WEAPONS §2.2, §2.3): id → { word, diaMm, caseMm, caseG, propG, boxN, loads }. */
export const CALIBRES = Object.freeze({
  '6.5x40r': Object.freeze({
    word: '6.5×40 mm Republic', diaMm: 6.7, caseMm: 40, caseG: 6.8, propG: 1.95, maker: 'had', boxN: 20, boxCm: 11, boxL: 0.16, bandolierN: 70,
    loads: Object.freeze({
      ball: Object.freeze({ massG: 7.8, vRefMs: 790, refBarrelMm: 460, vExp: 0.18, bcG7: 0.23, pen0Mm: 7.0, penExp: 2, woundK: 1.0, priceMcr: 0.30 }),
      tracer: Object.freeze({ massG: 7.5, vRefMs: 790, refBarrelMm: 460, vExp: 0.18, bcG7: 0.22, pen0Mm: 6.5, penExp: 2, woundK: 1.0, tracerM: 900, ignites: true, priceMcr: 0.40 }),
      blank: Object.freeze({ blank: true, word: 'a blank' }),
      dummy: Object.freeze({ dummy: true, word: 'an orange dummy' }),
    }),
  }),
  '9x21r': Object.freeze({
    word: '9×21 mm Republic', diaMm: 9.0, caseMm: 21, caseG: 4.0, propG: 0.38, maker: 'had', boxN: 50,
    loads: Object.freeze({
      ball: Object.freeze({ massG: 7.5, vRefMs: 390, refBarrelMm: 110, vExp: 0.18, bcG7: 0.072, pen0Mm: 2.0, penExp: 2, woundK: 1.0, priceMcr: 0.15 }),
    }),
  }),
});

/** A calibre by its name ('6.5×40 mm Republic'), or the id itself when it is not in the table. */
export const calWord = (cal) => CALIBRES[cal]?.word ?? cal;

/** A load's record ({ massG, … } | { dummy: true, … }), or null. */
export const loadOf = (cal, load = 'ball') => CALIBRES[cal]?.loads?.[load] ?? null;
