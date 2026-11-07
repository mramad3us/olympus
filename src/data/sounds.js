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
//
// The 0.0.6 round's (the build sheet 0.0.6 §2.3, VIEWS §11.3; my calls, unscored, VIEWS §11.5's sound set to come):
// the clippers, a loop while a shaved head is buzzed at a sink (a 120 Hz motor's sawtooth hum, CLIPPER_HZ,
// through a 2 kHz band, its fundamental under it and the blades' hiss); and the R menu's sounds on the UI bus:
// uiMove a 12 ms tick as the cursor moves, uiCheck a latch's click as a box is checked and uiUncheck the same
// lower, uiConfirm two rising notes (660 then 880 Hz) on DO IT, uiClose a falling blip.

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
/** The clippers' motor hum (Hz): a vibrating motor at twice a 60 Hz mains (my call, unscored). */
export const CLIPPER_HZ = 120;
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
  // (the 0.0.6 round's, below: the clippers' loop and the R menu's sounds)
  clippers: Object.freeze({
    levelDb: -24, durS: 1.0, loop: true, variants: 1, rateHz: WORLD_RATE_HZ,
    layers: Object.freeze([
      Object.freeze({ kind: 'glide', hz: CLIPPER_HZ, toHz: CLIPPER_HZ, durS: 1.2, attackS: 0.002, releaseS: 0.002, formant: Object.freeze([2000, 0.9]), db: 0 }),
      Object.freeze({ kind: 'tone', hz: CLIPPER_HZ, toHz: CLIPPER_HZ, attackS: 0, decayS: 1e6, db: -10 }),
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([2400, 1.4]), attackS: 0, decayS: 1e6, db: -22 }),
    ]),
  }),
  uiMove: Object.freeze({
    levelDb: -34, durS: 0.012, variants: 1,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', highpass: 3000, attackS: 0.0002, decayS: 0.0012, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 2400, toHz: 2300, attackS: 0.0002, decayS: 0.0016, db: -8 }),
    ]),
  }),
  uiCheck: Object.freeze({
    levelDb: -24, durS: 0.04, variants: 1,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([1800, 2]), attackS: 0.0003, decayS: 0.003, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 1100, toHz: 900, attackS: 0.0005, decayS: 0.006, db: -4 }),
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([2600, 3]), attackS: 0.0003, decayS: 0.002, delayS: 0.012, db: -10 }),
    ]),
  }),
  uiUncheck: Object.freeze({
    levelDb: -25, durS: 0.04, variants: 1,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([1200, 2]), attackS: 0.0003, decayS: 0.003, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 700, toHz: 560, attackS: 0.0005, decayS: 0.006, db: -4 }),
    ]),
  }),
  uiConfirm: Object.freeze({
    levelDb: -22, durS: 0.24, variants: 1,
    layers: Object.freeze([
      Object.freeze({ kind: 'notes', notes: Object.freeze([Object.freeze([660, 0.07]), Object.freeze([880, 0.11])]), formant: Object.freeze([1500, 0.8]), lowpass: 3500, attackS: 0.004, releaseS: 0.03, gapS: 0.012, vibratoK: 0, scoopK: 0, db: 0 }),
    ]),
  }),
  uiClose: Object.freeze({
    levelDb: -27, durS: 0.08, variants: 1,
    layers: Object.freeze([
      Object.freeze({ kind: 'tone', hz: 700, toHz: 420, attackS: 0.001, decayS: 0.03, db: 0 }),
      Object.freeze({ kind: 'noise', lowpass: 900, attackS: 0.0005, decayS: 0.01, db: -8 }),
    ]),
  }),
});
/** The R menu's sounds by the list's kinds (src/ui/kit/list.js): WORLD's recipes, played on the UI bus, never muffled. */
export const UI_SOUNDS = Object.freeze({ move: 'uiMove', check: 'uiCheck', uncheck: 'uiUncheck', confirm: 'uiConfirm', close: 'uiClose' });

// ---- the 0.0.5 round: the range (the build sheet §2.4, VIEWS §11.3; my calls, unscored) ----
//
// The R-7's report as its shooter hears it: the muzzle's blast (white noise low-passed at 3.6 kHz under
// a 0.3 ms attack and a 22 ms decay), the bullet's crack riding on it (high-passed noise, 3 ms), the
// powder's thump (a sine falling 95 to 48 Hz), and the open air's tail (low-passed noise over 0.18 s),
// at REPORT_SOURCE_DB over its recipe's peak at 1 m (a rifle at a metre is some 100 dB over a foot-fall:
// the limiter catches the rest, as it does the klaxon), heard from MUZZLE_AHEAD_M 0.9 m ahead of the
// ear, through Melas's air (airDb(65.9) −1.9 dB, the low-pass at 5.2 kHz). The berm gives it back:
// ECHO_DB −12 dB and low-passed at ECHO_LP_HZ, 2 × its distance at SOUND_SPEED_MS 322 m/s later (the
// line at x 1,100 and the berm's face at 1,128: 0.17 s). The range's rule is ear defenders (ears-m1):
// electronic ones, which pass the range's voices and take every impulse (a report, its echo) down
// EARS_DB −25 dB and low-pass it at EARS_LP_HZ 2 kHz, so the shot is a dull, heavy thump and the coach
// stays words in the radio box (the sheet: "speech stays text"). The action's clicks, felt as much as
// heard through the hands and the cheek, are not muffled (my call). ACTION_SOUNDS puts each click at
// its fraction of its sub-step's time on the game clock (the sheet's: the magazine's seat at 0.8 of
// magIn, the charging handle's pull at 0.35 and slam at 0.9, the release's slam at 0.5, the tap's palm
// at 0.5, the selector at 0.6; the rest mine), so stop motion freezes them with the picture. A case
// lands on regolith with a soft tick (no ring: the ground takes it) at its own landing time and place;
// the tower's speaker chimes twice before each of its lines (a bell's two notes, E5 then C5, through a
// horn's band), PA_SOURCE_DB over its peak at the tower, 20 m off.

/** The report at 1 m against its recipe's peak (dB; my call: the limiter takes the rest). */
export const REPORT_SOURCE_DB = 24;
/** The muzzle stands this far ahead of the shooter's ear (m: the R-7's 0.92 m, shouldered). */
export const MUZZLE_AHEAD_M = 0.9;
/** The berm's slap-back: its level against the report, and its low-pass (dB, Hz). */
export const ECHO_DB = -12, ECHO_LP_HZ = 1500;
/** The speed of sound in Melas's air (m/s: the build sheet's, 2 × 28 m in 0.17 s). */
export const SOUND_SPEED_MS = 322;
/** Ear defenders (ears-m1, electronic): every impulse taken down this far and low-passed here (dB, Hz: the range's rule, VIEWS §11.3's 25 dB). */
export const EARS_DB = -25, EARS_LP_HZ = 2000;
/** A click of your own gun's action at your hands, against its recipe's peak (dB). */
export const CLICK_SOURCE_DB = 0;
/** The tower's speaker against its recipe's peak at 1 m (dB: a loudspeaker; my call). */
export const PA_SOURCE_DB = 20;
/** The click's sound at a fraction of each action's time (the sheet's §2.4 and mine): action id (or a family 'magOut:*') → [[kind, fraction]]. */
export const ACTION_SOUNDS = Object.freeze({
  magIn: Object.freeze([Object.freeze(['magSeat', 0.8])]),
  // (0.0.6: LOAD's magazine in is a reach and a seat (firearms.js); the seat clicks at the same moment of LOAD as magIn's
  // 0.8 did: 0.8 × 1,610 ms = 690 + 0.65 × 920)
  seat: Object.freeze([Object.freeze(['magSeat', 0.65])]),
  charge: Object.freeze([Object.freeze(['chargePull', 0.35]), Object.freeze(['chargeSlam', 0.9])]),
  rack: Object.freeze([Object.freeze(['chargePull', 0.3]), Object.freeze(['chargeSlam', 0.85])]),
  release: Object.freeze([Object.freeze(['boltSlam', 0.5])]),
  tap: Object.freeze([Object.freeze(['palm', 0.5])]),
  'selector:*': Object.freeze([Object.freeze(['selector', 0.6])]),
  'magOut:*': Object.freeze([Object.freeze(['magOut', 0.3])]),
  lockBack: Object.freeze([Object.freeze(['chargePull', 0.4]), Object.freeze(['selector', 0.85])]),
  pressCheck: Object.freeze([Object.freeze(['chargePull', 0.3]), Object.freeze(['chargeSlam', 0.8])]),
  port: Object.freeze([Object.freeze(['selector', 0.5])]),
  functionCheck: Object.freeze([Object.freeze(['dryClick', 0.7])]),
  clearDouble: Object.freeze([Object.freeze(['magOut', 0.1]), Object.freeze(['chargePull', 0.28]), Object.freeze(['chargeSlam', 0.45]), Object.freeze(['chargePull', 0.6]), Object.freeze(['magSeat', 0.8]), Object.freeze(['chargeSlam', 0.95])]),
});
/** A pull that did not fire and clicks (the shot fact's why). */
export const DRY_WHY = Object.freeze(['dud', 'empty']);

// ---- the 0.0.7 round: the line at 300 m (the build sheet 0.0.7 §2.5 (d), VIEWS §11.3; my calls, unscored) ----
//
// The R-7 at distance, by the air it flies through. Your report at once, then the crack of your own round as it leaves
// (supersonic: a 1 ms N-wave riding the blast, CRACK_SOURCE_DB over its peak, an impulse the defenders take down as the
// report), and the strike coming back to you a flight and a sound's way later: the round's time of flight (the shot
// fact's flight.tofS) plus the distance over the speed of sound in that air (ballistics.js soundMsOf: 322 m/s on the
// valley floor), so at 300 m 0.42 + 0.93 = 1.35 s after the shot, a low thump of the berm taking it (IMPACT_SOURCE_DB
// over its peak at 1 m: a 6.5 mm round into packed regolith), inverse with distance and low-passed further by it
// (DIST_LP_REF_M: the corner falls with the distance past it, never under DIST_LP_MIN_HZ). A neighbour's report comes a
// sound's way late (5 m: 16 ms), panned. The relay fires all through a string, so reports are kept to a few voices:
// two within REPORT_MERGE_MS of each other are one (the second dropped, counted as merged), and at most REPORT_VOICES
// reports and echoes sound at once (a further one dropped, counted), REPORT_HOLD_S each; never a wall of noise. The
// defenders are electronic (v0.0.5's): an impulse over EARS_GATE_DB at the ear is taken EARS_DB down (the reports, the
// echoes, the crack), a quieter one passes (the far strikes, the carriers), and the tower's speaker comes through
// their circuit, low-passed at EARS_LP_HZ. The pits' work comes over the berm: a carrier running down or up its rails
// (a steel rattle, CARRIER_SOURCE_DB) where it is, a sound's way late, under the parapet (PARAPET_DB and its low-pass).
/** The crack of your own round as it leaves, against its recipe's peak (dB: under the report, over the action). */
export const CRACK_SOURCE_DB = 16;
/** The strike's thump at 1 m against its recipe's peak (dB). */
export const IMPACT_SOURCE_DB = 34;
/** A carrier on its rails at 1 m against its recipe's peak (dB). */
export const CARRIER_SOURCE_DB = 26;
/** Distance takes the highs too: the corner falls as DIST_LP_REF_HZ × DIST_LP_REF_M / d past DIST_LP_REF_M, never under DIST_LP_MIN_HZ (Hz, m). */
export const DIST_LP_REF_HZ = 5200, DIST_LP_REF_M = 40, DIST_LP_MIN_HZ = 500;
/** The relay's reports: at most this many at once, two within this of each other one, each sounding this long (voices, ms, s). */
export const REPORT_VOICES = 6, REPORT_MERGE_MS = 60, REPORT_HOLD_S = 0.6;
/** The defenders take an impulse down only over this level at the ear (dBFS over the recipe's peak). */
export const EARS_GATE_DB = -12;
/** The parapet between the pits and the line: its level and its low-pass (dB, Hz). */
export const PARAPET_DB = -10, PARAPET_LP_HZ = 1200;

// ---- the 0.0.8 round: the pairs pad (the build sheet 0.0.8 §2.4, §8 item 24, VIEWS §11; my calls, unscored) ----
//
// The turner's motor, a geared electric whirr (band-passed noise sweeping 500 to 900 Hz and its gear tooth's whine) over
// its TURN_MS 0.3 s, and the clack of the face against its stop as it comes square (a hard knock: a 1.8 kHz click over a
// board's 260 Hz thump), TURNER_SOURCE_DB at the stand; the way back is the same, a little lower. The coach's shot timer
// beeps as the targets turn (its start: the beep is the turner's, §8 item 24), a 2.9 kHz electronic tone of a quarter
// second with its third harmonic, BEEP_SOURCE_DB at the coach's hand, at your left shoulder (BEEP_AT: 0.9 m off). A round
// on the armoured face's steel rings (STEEL_SOURCE_DB at the plate): a sharp strike and the plate's inharmonic partials
// (1.35, 2.21, 3.46, 5.1 kHz, the lowest the longest), heard a sound's way late, through the defenders' gate like any
// impulse; a round through it or into board makes no ring. A row's rounds (a Pair, a Hammer) are each heard at their own
// formula time on the game clock, so the pair's two reports stand a split apart, the tier one's hammer 0.11 s.
/** The turner's motor and clack at 1 m against their recipes' peaks (dB). */
export const TURNER_SOURCE_DB = 10;
/** The shot timer's beep at its 1 m against its recipe's peak (dB), and where it is: off your left shoulder (m; pan −1 to 1). */
export const BEEP_SOURCE_DB = 4, BEEP_AT = Object.freeze({ distM: 0.9, pan: -0.45 });
/** A round ringing on steel at 1 m against its recipe's peak (dB: a 10 mm plate struck by a 6.5 mm round). */
export const STEEL_SOURCE_DB = 30;

/** The range's sounds (see the header). */
export const RANGE = Object.freeze({
  report: Object.freeze({
    levelDb: -6, durS: 0.6, variants: 3, rateHz: WORLD_RATE_HZ,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', lowpass: 3600, attackS: 0.0003, decayS: 0.022, db: 0 }),
      Object.freeze({ kind: 'noise', highpass: 3000, attackS: 0.0001, decayS: 0.003, db: -4 }),
      Object.freeze({ kind: 'tone', hz: 95, toHz: 48, attackS: 0.001, decayS: 0.06, db: -3 }),
      Object.freeze({ kind: 'noise', lowpass: 700, attackS: 0.01, decayS: 0.18, delayS: 0.005, db: -14 }),
    ]),
  }),
  magSeat: Object.freeze({
    levelDb: -14, durS: 0.08, variants: 2,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([2200, 2]), attackS: 0.0004, decayS: 0.006, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 620, toHz: 520, attackS: 0.0005, decayS: 0.012, db: -6 }),
      Object.freeze({ kind: 'tone', hz: 150, toHz: 110, attackS: 0.001, decayS: 0.014, db: -8 }),
    ]),
  }),
  magOut: Object.freeze({
    levelDb: -18, durS: 0.16, variants: 2,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([3000, 4]), attackS: 0.0003, decayS: 0.003, db: 0 }),
      Object.freeze({ kind: 'sweep', hz: 1900, toHz: 1100, q: 4, attackS: 0.01, decayS: 0.05, delayS: 0.02, durS: 0.12, db: -10 }),
    ]),
  }),
  chargePull: Object.freeze({
    levelDb: -17, durS: 0.12, variants: 2,
    layers: Object.freeze([
      Object.freeze({ kind: 'sweep', hz: 1400, toHz: 3200, q: 3, attackS: 0.008, decayS: 0.05, durS: 0.09, db: 0 }),
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([3800, 5]), attackS: 0.0003, decayS: 0.002, delayS: 0.085, db: -4 }),
    ]),
  }),
  chargeSlam: Object.freeze({
    levelDb: -11, durS: 0.1, variants: 2,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([3200, 3]), attackS: 0.0002, decayS: 0.004, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 1850, toHz: 1800, attackS: 0.0003, decayS: 0.018, db: -10 }),
      Object.freeze({ kind: 'tone', hz: 230, toHz: 170, attackS: 0.0008, decayS: 0.016, db: -7 }),
    ]),
  }),
  boltSlam: Object.freeze({
    levelDb: -10, durS: 0.1, variants: 2,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([3600, 3]), attackS: 0.0002, decayS: 0.004, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 2100, toHz: 2050, attackS: 0.0003, decayS: 0.02, db: -9 }),
      Object.freeze({ kind: 'tone', hz: 240, toHz: 180, attackS: 0.0008, decayS: 0.016, db: -8 }),
    ]),
  }),
  palm: Object.freeze({
    levelDb: -15, durS: 0.07, variants: 2,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', lowpass: 800, attackS: 0.001, decayS: 0.012, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 170, toHz: 120, attackS: 0.001, decayS: 0.015, db: -5 }),
    ]),
  }),
  selector: Object.freeze({
    levelDb: -22, durS: 0.03, variants: 2,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([4600, 4]), attackS: 0.0002, decayS: 0.0018, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 3300, toHz: 3200, attackS: 0.0002, decayS: 0.003, db: -9 }),
    ]),
  }),
  dryClick: Object.freeze({
    levelDb: -16, durS: 0.05, variants: 2,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([3000, 5]), attackS: 0.0002, decayS: 0.003, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 2400, toHz: 2300, attackS: 0.0002, decayS: 0.006, db: -8 }),
    ]),
  }),
  caseTick: Object.freeze({
    levelDb: -24, durS: 0.05, variants: 3,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([3400, 3]), attackS: 0.0002, decayS: 0.0025, db: 0 }),
      Object.freeze({ kind: 'grains', n: 4, spreadS: 0.02, bandpass: Object.freeze([2600, 1.5]), decayS: 0.0012, db: -8 }),
    ]),
  }),
  // (0.0.7: the crack of the round leaving, an N-wave of a millisecond; the strike's thump into the berm; a carrier's rattle)
  crack: Object.freeze({
    levelDb: -8, durS: 0.04, variants: 2,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', highpass: 2500, attackS: 0.00005, decayS: 0.0008, db: 0 }),
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([5200, 1.2]), attackS: 0.00005, decayS: 0.0012, delayS: 0.0009, db: -5 }),
    ]),
  }),
  impact: Object.freeze({
    levelDb: -10, durS: 0.3, variants: 3, rateHz: WORLD_RATE_HZ,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', lowpass: 420, attackS: 0.001, decayS: 0.045, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 82, toHz: 46, attackS: 0.002, decayS: 0.07, db: -4 }),
      Object.freeze({ kind: 'grains', n: 6, spreadS: 0.06, bandpass: Object.freeze([900, 1.2]), decayS: 0.004, delayS: 0.01, db: -14 }),
    ]),
  }),
  carrier: Object.freeze({
    levelDb: -12, durS: 1.2, variants: 2, rateHz: WORLD_RATE_HZ,
    layers: Object.freeze([
      Object.freeze({ kind: 'grains', n: 22, spreadS: 0.9, bandpass: Object.freeze([1400, 2]), decayS: 0.01, db: 0 }),
      Object.freeze({ kind: 'sweep', hz: 380, toHz: 260, q: 3, attackS: 0.05, decayS: 0.6, durS: 1.0, db: -6 }),
      Object.freeze({ kind: 'tone', hz: 140, toHz: 120, attackS: 0.003, decayS: 0.08, delayS: 0.95, db: -4 }),
    ]),
  }),
  // (0.0.8: the turner's motor and its clack, the shot timer's beep, the steel's ring)
  turnerMotor: Object.freeze({
    levelDb: -18, durS: 0.36, variants: 2, rateHz: WORLD_RATE_HZ,
    layers: Object.freeze([
      Object.freeze({ kind: 'sweep', hz: 500, toHz: 900, q: 4, attackS: 0.03, decayS: 0.2, durS: 0.3, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 410, toHz: 470, attackS: 0.02, decayS: 0.18, db: -9 }),
      Object.freeze({ kind: 'grains', n: 10, spreadS: 0.28, bandpass: Object.freeze([2400, 2]), decayS: 0.003, db: -14 }),
    ]),
  }),
  turnerClack: Object.freeze({
    levelDb: -12, durS: 0.12, variants: 2,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([1800, 2]), attackS: 0.0003, decayS: 0.005, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 260, toHz: 200, attackS: 0.001, decayS: 0.025, db: -4 }),
    ]),
  }),
  timerBeep: Object.freeze({
    levelDb: -16, durS: 0.32, variants: 1, rateHz: WORLD_RATE_HZ,
    layers: Object.freeze([
      Object.freeze({ kind: 'tone', hz: 2900, toHz: 2900, attackS: 0.003, decayS: 0.6, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 8700, toHz: 8700, attackS: 0.003, decayS: 0.5, db: -16 }),
    ]),
  }),
  steelRing: Object.freeze({
    levelDb: -8, durS: 1.1, variants: 3, rateHz: WORLD_RATE_HZ,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([3800, 1.5]), attackS: 0.0001, decayS: 0.004, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 1350, toHz: 1346, attackS: 0.0005, decayS: 0.32, db: -4 }),
      Object.freeze({ kind: 'tone', hz: 2210, toHz: 2205, attackS: 0.0005, decayS: 0.22, db: -7 }),
      Object.freeze({ kind: 'tone', hz: 3460, toHz: 3455, attackS: 0.0005, decayS: 0.14, db: -10 }),
      Object.freeze({ kind: 'tone', hz: 5100, toHz: 5090, attackS: 0.0005, decayS: 0.08, db: -14 }),
    ]),
  }),
  chime: Object.freeze({
    levelDb: -14, durS: 1.5, variants: 1, rateHz: WORLD_RATE_HZ,
    layers: Object.freeze([
      Object.freeze({ kind: 'tone', hz: 659.26, toHz: 659.26, attackS: 0.004, decayS: 0.45, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 1977.8, toHz: 1977.8, attackS: 0.002, decayS: 0.12, db: -14 }),
      Object.freeze({ kind: 'tone', hz: 523.25, toHz: 523.25, attackS: 0.004, decayS: 0.55, delayS: 0.42, db: -1 }),
      Object.freeze({ kind: 'tone', hz: 1569.8, toHz: 1569.8, attackS: 0.002, decayS: 0.14, delayS: 0.42, db: -15 }),
    ]),
  }),
});
