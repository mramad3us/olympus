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

/** The site record of Base Melas (PLACES §1.2, §4.1): its areas grow with the buildings that get interiors; horizon names its walls. */
export const MELAS_SITE = deepFreeze({
  id: 'melas', kind: 'base', template: 'melas@1', name: 'Marine Corps Base Melas', body: 'mars', geo: 'melas', horizon: 'melas', clock: 'mars-local',
  outside: { kind: 'air', air: 'mars-melas', weather: 'mars-weather' }, inside: { air: 'martian-indoor' },
  gravity: { regime: 'surface', down: [0, -1, 0] }, lighting: 'base', water: 'melas', routine: 'melas', palette: 'mars',
  areas: ['melas.ground', 'melas.echo.1', 'melas.echo.2'],
});

/** Every site record, in the registry's order. */
export const SITE_LIST = Object.freeze([TEST_SITE, MELAS_SITE]);
