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
// The rest of §2.2's nine come with their guns.
//
// 0.0.6, the kinds of rounds (the user, 2026-11-07: "we may have different types of rounds in
// inventory"; DESIGN.md's log): each live load is a kind a marine can tell by eye, its word and its
// tip (the colour painted on the bullet's nose, `tip`, null for ball's bare copper jacket, read at a
// magazine's feed lips and drawn where the stage shows rounds), and LIVE_LOADS lists the kinds a
// magazine may be filled with, one kind a magazine (mixed loads, a tracer every fifth, wait for the
// belts: my call). The tracer's red tip is my call (the Corps' colour; real armies paint red, orange
// or green); its trace burns from traceFromM 30 m to tracerM 900 m (it lights a few tens of metres out),
// so at 25 m by day the stage draws only a faint spark of it.
//
// 0.0.7 (the build sheet 0.0.7 §1: taken for a missing field): the 6.5×40's AP and frangible loads (WEAPONS
// §2.3, §2.10), which ballistics.js and penetrate.js fly and test (§2.4's table, §8.3 and §8.5's stops and
// perforations). Neither is issued on Mars's ranges (AP by order, frangible the shipboard standard), so each
// is marked range: false and LIVE_LOADS, the kinds a range's magazine is filled with, leaves them out.
// Data only: frozen literals and three lookups.

/** The calibres (WEAPONS §2.2, §2.3): id → { word, diaMm, caseMm, caseG, propG, boxN, loads }. */
export const CALIBRES = Object.freeze({
  '6.5x40r': Object.freeze({
    word: '6.5×40 mm Republic', diaMm: 6.7, caseMm: 40, caseG: 6.8, propG: 1.95, maker: 'had', boxN: 20, boxCm: 11, boxL: 0.16, bandolierN: 70,
    loads: Object.freeze({
      ball: Object.freeze({ word: 'ball', tip: null, tipWord: 'a bare copper tip', massG: 7.8, vRefMs: 790, refBarrelMm: 460, vExp: 0.18, bcG7: 0.23, pen0Mm: 7.0, penExp: 2, woundK: 1.0, priceMcr: 0.30 }),
      tracer: Object.freeze({ word: 'tracer', tip: 0xc23b2e, tipWord: 'a red tip', massG: 7.5, vRefMs: 790, refBarrelMm: 460, vExp: 0.18, bcG7: 0.22, pen0Mm: 6.5, penExp: 2, woundK: 1.0, tracerM: 900, traceFromM: 30, ignites: true, priceMcr: 0.40 }),
      ap: Object.freeze({ word: 'AP', tip: 0x1c1c1c, tipWord: 'a black tip', massG: 7.1, vRefMs: 815, refBarrelMm: 460, vExp: 0.18, bcG7: 0.25, pen0Mm: 13.0, penExp: 1.5, woundK: 0.9, priceMcr: 1.20, byOrder: true, range: false }),
      frangible: Object.freeze({ word: 'frangible', tip: 0x3f6fb5, tipWord: 'a blue tip', massG: 6.0, vRefMs: 790, refBarrelMm: 460, vExp: 0.18, bcG7: 0.15, pen0Mm: 1.5, penExp: 2, woundK: 1.1, frangible: true, priceMcr: 0.45, range: false }),
      blank: Object.freeze({ blank: true, word: 'a blank' }),
      dummy: Object.freeze({ dummy: true, word: 'an orange dummy' }),
    }),
  }),
  '9x21r': Object.freeze({
    word: '9×21 mm Republic', diaMm: 9.0, caseMm: 21, caseG: 4.0, propG: 0.38, maker: 'had', boxN: 50,
    loads: Object.freeze({
      ball: Object.freeze({ word: 'ball', tip: null, tipWord: 'a bare copper tip', massG: 7.5, vRefMs: 390, refBarrelMm: 110, vExp: 0.18, bcG7: 0.072, pen0Mm: 2.0, penExp: 2, woundK: 1.0, priceMcr: 0.15 }),
    }),
  }),
});

/** A calibre by its name ('6.5×40 mm Republic'), or the id itself when it is not in the table. */
export const calWord = (cal) => CALIBRES[cal]?.word ?? cal;

/** A load's record ({ massG, … } | { dummy: true, … }), or null. */
export const loadOf = (cal, load = 'ball') => CALIBRES[cal]?.loads?.[load] ?? null;

/** The kinds a range's magazine of a calibre may be filled with: its live loads (not the blank, the dummy or a load the range never issues), ball first. */
export const LIVE_LOADS = Object.freeze(Object.fromEntries(Object.entries(CALIBRES).map(([cal, C]) => [cal, Object.freeze(Object.keys(C.loads).filter(k => !C.loads[k].blank && !C.loads[k].dummy && C.loads[k].range !== false))])));
/** A kind's word ('ball', 'tracer'; the orange dummy 'dummy'), the id itself when unknown. */
export const loadWord = (load, cal = '6.5x40r') => (load === 'dummy' ? 'dummy' : loadOf(cal, load)?.word ?? load);
