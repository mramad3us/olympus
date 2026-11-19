// OLYMPUS places: every area the game knows, in one list, for the modules that index them all.
//
// The test rooms (src/data/places/testroom.js) and Base Melas's areas: Echo Company's two floors
// (src/sim/places/echo.js) and the ground (src/sim/places/ground.js), built at load from their tables,
// and from 0.0.12 the Wheel's sector 4 (src/data/places/wheel.js: house 1 of the shoot houses and its
// apron, a `deck` at 1 G of spin; PLACES §4.15), and from v0.0.24 the void range at Phobos (src/data/places/phobos.js) and
// Testudo's berthing compartment (src/data/places/testudo.js), each its site's `deck`, and from v0.0.25 the Wreck at Phobos
// (src/data/places/wreck.js: decks 5 and 6 of a stripped corvette in one plan, 60 m apart).
// model.js keys them by id (AREA_RECORDS, areaOf) and fixtures.js indexes their berths and posts from
// this list, so neither has to import the other (fixtures.js is read while the areas are built: a
// cycle through model.js would leave the catalogue unread). Frozen. Pure.
import { TEST_AREA } from '../../data/places/testroom.js';
import { ECHO_1, ECHO_2 } from './echo.js';
import { GROUND_AREA } from './ground.js';
import { WHEEL_S4 } from '../../data/places/wheel.js';
import { WELL_A } from '../../data/places/phobos.js';
import { BERTH_2 } from '../../data/places/testudo.js';
import { WRECK } from '../../data/places/wreck.js';

/** Every area with a record: the test rooms, Echo's two floors, Base Melas's ground, the Wheel's sector 4; from v0.0.24 Well A at Phobos and Testudo's berthing 2 (the anywhere round's two scenes); from v0.0.25 the Wreck at Phobos ("Hold to hold"). */
export const AREA_LIST = Object.freeze([TEST_AREA, ECHO_1, ECHO_2, GROUND_AREA, WHEEL_S4, WELL_A, BERTH_2, WRECK]);
