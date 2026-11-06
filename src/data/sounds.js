// OLYMPUS data: the sounds' parameters, every number a synthesised sound is made from (VIEWS §11.5).
//
// No audio file ships, as no image does (VIEWS §11.1; the user, 2026-11-05: every image and sound is
// made by the game's code): each sound is a recipe of layers rendered into a buffer by
// src/ui/audio/synth.js at the first key or click, then played through the air's filter and gain by
// src/ui/audio/engine.js. A layer is one of
//   noise   white noise through one filter (bandpass [Hz, Q], lowpass Hz or highpass Hz), under an
//           attack and an exponential decay (the time to fall by 1/e), from delayS;
//   tone    a sine at hz, gliding to toHz over its decay (a heel's thump, a latch's ring);
//   grains  n short bursts of band-passed noise scattered over spreadS (the grit of regolith);
//   sweep   band-passed noise whose centre glides from hz to toHz over durS (a hinge's creak);
// with db its level against the recipe's loudest layer. A recipe's levelDb is its peak at 1 m in
// Earth's sea-level air at 1 G (dBFS); the air and the gravity are applied when it plays (steps.js
// stepVoice, VIEWS §11.2 and §11.3). variants recipes of one kind are rendered from different
// noise seeds, so twenty foot-falls are not one sample twenty times.
//
// These are the skeleton's sounds, unscored: VIEWS §11.5's sound gallery puts numbered sets to the
// user, and a scored set replaces these numbers (a sound in the game is always a scored sample's
// parameters, never a number tuned in code). Footsteps after VIEWS §11.3's table: tile and lino a
// sharp tick, concrete a band-pass at 800 Hz over 50 ms, regolith low-passed noise over 60 ms with
// a gritty crackle; doors a latch and a hinge opening, a thud and a latch closing (my calls, each).

/** At most this many voices at once; a sound past it is dropped (VIEWS §11.2's 48). */
export const VOICES_MAX = 48;
/** The master volume of a new profile, 0 to 1. */
export const MASTER_DEFAULT = 0.8;
/** Foot-falls are scheduled within this of their moment, and one later than this (a stalled frame) is dropped, not played in a burst (seconds). */
export const LOOKAHEAD_S = 0.1;
/** VIEWS §11.2's air filter: the low-pass corner at a pressure, 8 kHz at Earth's 101.3 kPa, scaled with P. */
export const LOWPASS_REF_HZ = 8000, LOWPASS_REF_KPA = 101.3;
/**
 * The air a sound is heard in, by area kind, until PLACES's zones carry their own (0.1): the ground
 * is Melas's valley air, 65.9 kPa, a building the Martian indoor standard, 66.0 kPa (CONTRACTS §16).
 */
export const AIR_KPA = Object.freeze({ ground: 65.9, floor: 66.0, default: 65.9 });
/** A gait's foot strikes harder or softer than the walk's (dB, my calls; the bound's landing is BODY's at 0.0.5). */
export const GAIT_DB = Object.freeze({ walk: 0, stroll: -4, run: 4, bound: 6 });
/** What the feet hear on each surface PLACES names (surfaceAt): tile and vinyl tick, concrete and paving slap, regolith crunches. */
export const SURFACE_STEP = Object.freeze({ tile: 'tile', vinyl: 'tile', concrete: 'concrete', paving: 'concrete', stairs: 'concrete', regolith: 'regolith', path: 'regolith' });
/** Distance for a sound not your own: inverse distance from 1 m, rolloff 1.5 indoors and 1 outdoors (VIEWS §11.2). */
export const ROLLOFF = Object.freeze({ floor: 1.5, ground: 1, default: 1.5 });
/** The stereo spread: a source this far to one side is panned fully (metres, my call). */
export const PAN_FULL_M = 8;

/** The footsteps, one recipe a surface kind. */
export const STEPS = Object.freeze({
  tile: Object.freeze({
    levelDb: -10, durS: 0.05, variants: 4,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([3400, 1.6]), attackS: 0.0006, decayS: 0.006, db: 0 }),
      Object.freeze({ kind: 'noise', highpass: 6000, attackS: 0.0003, decayS: 0.002, db: -8 }),
      Object.freeze({ kind: 'tone', hz: 150, toHz: 110, attackS: 0.001, decayS: 0.016, db: -11 }),
    ]),
  }),
  concrete: Object.freeze({
    levelDb: -10, durS: 0.07, variants: 4,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([800, 1.1]), attackS: 0.001, decayS: 0.014, db: 0 }),
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([1900, 2.2]), attackS: 0.004, decayS: 0.02, delayS: 0.012, db: -15 }),
      Object.freeze({ kind: 'tone', hz: 100, toHz: 70, attackS: 0.002, decayS: 0.02, db: -8 }),
    ]),
  }),
  regolith: Object.freeze({
    levelDb: -11, durS: 0.09, variants: 4,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', lowpass: 1500, attackS: 0.004, decayS: 0.026, db: 0 }),
      Object.freeze({ kind: 'grains', n: 10, spreadS: 0.055, bandpass: Object.freeze([2800, 1.2]), decayS: 0.0018, db: -6 }),
      Object.freeze({ kind: 'tone', hz: 85, toHz: 60, attackS: 0.003, decayS: 0.022, db: -12 }),
    ]),
  }),
});

/** A door's leaf: a latch and the hinge's creak opening; the leaf's thud and the latch closing. */
export const DOORS = Object.freeze({
  open: Object.freeze({
    levelDb: -12, durS: 0.85, variants: 2,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([2600, 3]), attackS: 0.0005, decayS: 0.004, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 1900, toHz: 1850, attackS: 0.0005, decayS: 0.012, db: -12 }),
      Object.freeze({ kind: 'sweep', hz: 420, toHz: 880, q: 9, attackS: 0.08, decayS: 0.35, delayS: 0.06, durS: 0.7, db: -10 }),
    ]),
  }),
  close: Object.freeze({
    levelDb: -9, durS: 0.32, variants: 2,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', lowpass: 320, attackS: 0.002, decayS: 0.05, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 72, toHz: 52, attackS: 0.002, decayS: 0.06, db: -3 }),
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([2400, 3]), attackS: 0.0005, decayS: 0.005, delayS: 0.035, db: -9 }),
    ]),
  }),
});
