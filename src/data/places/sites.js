// OLYMPUS data: the site records, listed once (PLACES §1.2; TECH §1.4; CONTRACTS §21).
//
// A site is authored once as a template and is the same in every career: it carries no seed (the hub,
// 2026-11-05: the world is handcrafted). Its record is the environment's middle layer: `body` names a row
// of BODIES, `clock` one of CLOCKS, `outside` the air out of doors (`kind` air or vacuum, `air` a row of
// AIRS, `weather` its model), `inside` the air its buildings and decks keep, `gravity` a regime and a
// down (a `surface` site reads its body's gG; a ship's thrust carries its own), `lighting` a regime of
// LIGHT_REGIMES, `water` (a row of src/data/activities.js WATER_MIN: the shower's minutes), `routine`
// (its Plan of the Day, a row of src/data/pod.js ROUTINES: reveille, taps, the holidays) and `palette`
// the site's (src/data/places/env.js holds the environment's tables). `geo`
// is the site's place on its body (SETTING's SITES in src/data/setting/calendar.js), `horizon` its walls
// (MELAS_WALLS in src/data/places/melas.js). A record that names no body, air or palette throws where it
// is read (src/sim/places/env.js), so no Melas default can hide a missing wire.
// This registry is what src/sim/places/model.js (siteOf) and src/sim/places/sun.js (the site's geo) read:
// SITE_LIST is every site the game knows, in the order the registry was built (the test rooms first).

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The sandbox's site: the test rooms, on Melas's ground, clock, air and gravity. */
export const TEST_SITE = deepFreeze({
  id: 'test', kind: 'base', template: 'test@1', name: 'Test rooms', body: 'mars', geo: 'melas', clock: 'mars-local',
  outside: { kind: 'air', air: 'mars-melas', weather: 'mars-weather' }, inside: { air: 'martian-indoor' },
  gravity: { regime: 'surface', down: [0, -1, 0] }, lighting: 'base', water: 'melas', routine: 'melas', palette: 'mars',
  areas: ['test.rooms'],
});

/** The site record of Base Melas (PLACES §1.2, §4.1): its areas grow with the buildings that get interiors (0.0.12: the Wheel's sector 4, PLACES §4.15, under the base); horizon names its walls. */
export const MELAS_SITE = deepFreeze({
  id: 'melas', kind: 'base', template: 'melas@1', name: 'Marine Corps Base Melas', body: 'mars', geo: 'melas', horizon: 'melas', clock: 'mars-local',
  outside: { kind: 'air', air: 'mars-melas', weather: 'mars-weather' }, inside: { air: 'martian-indoor' },
  gravity: { regime: 'surface', down: [0, -1, 0] }, lighting: 'base', water: 'melas', routine: 'melas', palette: 'mars',
  areas: ['melas.ground', 'melas.echo.1', 'melas.echo.2', 'melas.wheel.s4'],
});

/**
 * v0.0.24 (the anywhere round, its build sheet §3.4; AW§4.4; PLACES §5.7): the Void Operations School at Phobos. Its gravity is
 * the rock's 0.0006 G (micro: free fall for a body's purposes), its air the Martian indoor standard inside and vacuum out, its
 * clock UTC (question 3's default: the Corps' and the fleet's day), its lighting a ship's (06:00 to 22:00 UTC, my call), its
 * routine Melas's Plan of the Day on UTC until CAREER §10.1 writes the void week's (my call), its water a ship's row. No geo
 * on Mars's map and no horizon: it is under the rock, and nothing reads a sun there.
 */
export const PHOBOS_VOID_SITE = deepFreeze({
  id: 'phobos-void', kind: 'base', template: 'phobos-void@1', name: 'the Void Operations School, Phobos', body: 'phobos', clock: 'utc',
  outside: { kind: 'vacuum', air: 'vacuum' }, inside: { air: 'martian-indoor' },
  gravity: { regime: 'micro', gG: 0.0006, down: [0, -1, 0] }, lighting: 'ship', water: 'ship', routine: 'melas', palette: null,
  areas: ['phobos.void.well-a'],
});

/**
 * v0.0.24 (the same; PLACES §5.2): MCRN Testudo, the assault transport, coasting (its gravity its thrust, 0 G until a burn:
 * "Secure for burn" sets the burn's profile live, src/sim/places/gravity.js), the same air, a ship's clock, lighting and water,
 * the embarked marines' hours (Melas's Plan of the Day on UTC, my call, as Phobos's). One compartment is authored this round.
 */
export const TESTUDO_SITE = deepFreeze({
  id: 'mcrn-testudo', kind: 'ship', template: 'mcrn-testudo@1', name: 'MCRN Testudo', body: 'none', clock: 'utc',
  outside: { kind: 'vacuum', air: 'vacuum' }, inside: { air: 'martian-indoor' },
  gravity: { regime: 'thrust', gG: 0, down: [0, -1, 0] }, lighting: 'ship', water: 'ship', routine: 'melas', palette: null,
  areas: ['testudo.deck-b.berth-2'],
});

/** Every site record, in the registry's order. */
export const SITE_LIST = Object.freeze([TEST_SITE, MELAS_SITE, PHOBOS_VOID_SITE, TESTUDO_SITE]);
