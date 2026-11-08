// OLYMPUS tests: Mars's gaits, unloaded and rested, for the bots and the walk tests (BODY §16.1 at Melas's gravity).
//
// The game holds no Mars constant (TECH §1.4; ROADMAP "anywhere" step 2): the walk is BODY's gait helper
// at the place's gravity (src/sim/body/motion.js gaitSpeeds, placeGaits). The bots and the tests that walk
// Melas read its row here, gaitSpeeds at BODIES.mars.gG (src/data/places/env.js): 0.75, 1.14 and 2.69 m/s,
// as move.js's WALK_MS, RUN_MS and STROLL_MS were until v0.0.10.
import { gaitSpeeds } from '../src/sim/body/motion.js';
import { BODIES } from '../src/data/places/env.js';

/** The gaits on Mars's surface, unloaded and rested (BODY §16.1). */
export const MARS_GAITS = Object.freeze(gaitSpeeds({ gG: BODIES.mars.gG }));
/** Mars's walk, run and stroll, m/s: 1.14, 2.69, 0.75. */
export const WALK_MS = MARS_GAITS.walkMs, RUN_MS = MARS_GAITS.runMs, STROLL_MS = MARS_GAITS.strollMs;
