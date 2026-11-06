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
//
// The 0.0.4 round's (the build sheet §2.4, VIEWS §11.3; my calls, unscored): WORLD's shower water (the
// spray's band of noise, its fall low-passed, droplets), the tap (a narrower stream), the flush (a
// rush low-passed, the bowl's gurgle swept down, the valve's hiss), the klaxon (a 1.5 s whoop, a
// sawtooth gliding 600 to 1,100 Hz through a horn's band), reveille's bugle (the call's opening
// phrase on the bugle's harmonics, G4, C5, E5, G5, a sawtooth through a brass formant, as the bay's
// speaker gives it: no lows) and the watch's tick in a splash. The water and the tap loop (rendered
// with a crossfaded seam: synth.js), faded in and out over LOOP_FADE_S. The klaxon's horn is far
// louder than a step at a metre (KLAXON_SOURCE_DB over its recipe's peak, the limiter catching what
// passes full scale): by the horn in hall-2 it is the loudest thing on the floor, in bay-2-1 through
// the door it is muffled (WALL_DB a wall and its low-pass halved, VIEWS §11.2's occlusion at −6 dB
// made −10 for a closed door, my call), two rooms away fainter still. In a splash the world goes
// muffled (SPLASH_LP_HZ, SPLASH_DUCK_DB, eased with the iris) and the watch ticks once a shown
// minute, at most TICK_MAX_HZ.

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

// ---- the 0.0.4 round: water, the tap, the flush, the klaxon, the bugle, the splash ----

/** A wall between a sound and you: this many dB, and the low-pass's corner halved (my calls, the build sheet 0.0.4 §4). */
export const WALL_DB = -10;
/** The klaxon's horn at 1 m against its recipe's peak (dB; a horn is some 50 dB over a step at a metre; my call, the limiter takes the rest). */
export const KLAXON_SOURCE_DB = 20;
/** The klaxon's whoop, Hz (my calls). */
export const KLAXON_HZ = Object.freeze([600, 1100]);
/** Reveille's bugle on the bay's speaker, against its recipe's peak (dB, my call). */
export const BUGLE_SOURCE_DB = 0;
/** The world in a splash: low-passed to this corner and ducked by this much (my calls). */
export const SPLASH_LP_HZ = 900, SPLASH_DUCK_DB = -9;
/** The world's low-pass when nothing muffles it (Hz). */
export const WORLD_OPEN_HZ = 20000;
/** The splash's watch ticks once a shown minute, at most this often (Hz). */
export const TICK_MAX_HZ = 10;
/** A loop (the water, the tap) fades in and out over this long (s). */
export const LOOP_FADE_S = 0.25;
/**
 * The world's sounds are rendered at this rate (Hz): Melas's air low-passes every sound at 5.2 kHz
 * (VIEWS §11.2), so nothing above 12 kHz could be heard, and half the rate halves the rendering after
 * the first key (the flush's 3.2 s, the bugle's 3.9 s).
 */
export const WORLD_RATE_HZ = 24000;
/** Bugle notes (Hz): the call is on the bugle's harmonics in C. */
const G4 = 392, C5 = 523.25, E5 = 659.26, G5 = 783.99;

/** The world's sounds of the round (see the header). */
export const WORLD = Object.freeze({
  water: Object.freeze({
    levelDb: -18, durS: 2.4, loop: true, variants: 1, rateHz: WORLD_RATE_HZ,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([2800, 0.55]), attackS: 0, decayS: 1e6, db: 0 }),
      Object.freeze({ kind: 'noise', lowpass: 520, attackS: 0, decayS: 1e6, db: -4 }),
      Object.freeze({ kind: 'grains', n: 90, spreadS: 2.4, bandpass: Object.freeze([5200, 2]), decayS: 0.0012, db: -9 }),
    ]),
  }),
  tap: Object.freeze({
    levelDb: -24, durS: 1.6, loop: true, variants: 1, rateHz: WORLD_RATE_HZ,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([1700, 1.4]), attackS: 0, decayS: 1e6, db: 0 }),
      Object.freeze({ kind: 'noise', highpass: 6000, attackS: 0, decayS: 1e6, db: -12 }),
      Object.freeze({ kind: 'grains', n: 40, spreadS: 1.6, bandpass: Object.freeze([3600, 3]), decayS: 0.0015, db: -10 }),
    ]),
  }),
  flush: Object.freeze({
    levelDb: -12, durS: 3.2, variants: 2, rateHz: WORLD_RATE_HZ,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', lowpass: 1100, attackS: 0.08, decayS: 0.9, db: 0 }),
      Object.freeze({ kind: 'sweep', hz: 320, toHz: 110, q: 5, attackS: 0.3, decayS: 1.4, delayS: 0.4, durS: 2.6, db: -6 }),
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([3000, 1.5]), attackS: 0.01, decayS: 0.25, db: -8 }),
    ]),
  }),
  klaxon: Object.freeze({
    levelDb: -3, durS: 1.5, variants: 1, rateHz: WORLD_RATE_HZ,
    layers: Object.freeze([
      Object.freeze({ kind: 'glide', hz: KLAXON_HZ[0], toHz: KLAXON_HZ[1], durS: 1.42, attackS: 0.03, releaseS: 0.08, formant: Object.freeze([1400, 0.7]), db: 0 }),
      Object.freeze({ kind: 'glide', hz: KLAXON_HZ[0] * 2, toHz: KLAXON_HZ[1] * 2, durS: 1.42, attackS: 0.03, releaseS: 0.08, formant: Object.freeze([2400, 1.2]), db: -9 }),
    ]),
  }),
  bugle: Object.freeze({
    levelDb: -10, durS: 3.9, variants: 1, rateHz: WORLD_RATE_HZ,
    layers: Object.freeze([
      Object.freeze({
        kind: 'notes', formant: Object.freeze([1250, 1.1]), highpass: 280, lowpass: 4200, attackS: 0.03, releaseS: 0.05, gapS: 0.02, db: 0,
        notes: Object.freeze([[G4, 0.14], [C5, 0.14], [E5, 0.14], [C5, 0.14], [G4, 0.3], [E5, 0.14], [C5, 0.14], [E5, 0.14], [G4, 0.3],
          [C5, 0.14], [E5, 0.14], [G5, 0.3], [E5, 0.14], [C5, 0.14], [G4, 0.14], [C5, 0.5]].map(Object.freeze)),
      }),
    ]),
  }),
  tick: Object.freeze({
    levelDb: -30, durS: 0.014, variants: 2,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', highpass: 4000, attackS: 0.0002, decayS: 0.0012, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 3200, toHz: 3000, attackS: 0.0002, decayS: 0.0018, db: -6 }),
    ]),
  }),
});
