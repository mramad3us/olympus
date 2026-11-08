// OLYMPUS data: the environment's tables, the one home of every gravity, air and surface number (TECH §1.4; PLACES §1.2, §2.7, §3.2, §3.11, §3.16; CONTRACTS §21).
//
// The user's rule of 2026-11-08: "the engine needs to support any surface on any part of the system by
// design". A place's environment is resolved from layers, the most specific winning: the body, the site
// (src/data/places/sites.js), the area, the zone and room, and the live layer (state.places.live.env, a
// scene's override). src/sim/places/env.js resolves them (envAt, gravityAt, airAt, surfaceAt); this
// module only holds the rows, frozen literals with their units:
//   BODIES    a world's surface gravity in G, its day, obliquity, radius, distance from the Sun, sky
//             class, default palette and ground. `none` is deep space: no surface, no sky.
//   AIRS      PLACES §3.2's table as data: total pressure and partial pressures (kPa), molar mass
//             (kg/mol) and the set temperature (°C). Melas's valley air takes its temperature from the
//             weather, which this round is the cool season's −10 °C (the 0.0.4 sheet's call, mine);
//             a building's Martian indoor standard is 66.0 kPa at 20 °C. `vacuum` has none of it: its
//             temperature is the place's (a preset's airC). Molar masses: Martian air 29.62 g/mol (the
//             hub's mix: N₂ 65.4, O₂ 32, Ar 2, CO₂ 0.6%), Earth's 28.96; Ice standard's 28.90 and belt
//             air's 29.16 are summed from their partial pressures (my calls).
//   SURFACES  PLACES §2.7's rows by id: friction dry and wet, whether mag boots hold (ferrous), the grip
//             (none, handholds, magStrip, loops), the footstep recipe (src/data/sounds.js SURFACE_STEP's
//             kinds), the dust, and the word for what gets on your hands. The tile, vinyl, concrete,
//             grating, soil, grass and rock rows' friction are my calls from published values.
//   CLOCKS    the kinds of clock a site keeps: `mars-local` (the sol at the site's longitude, the
//             timeslip in it), `utc` (a ship's and the Corps' day), `earth-local` (an Earth town's day,
//             not built: it throws until a site names it). src/sim/places/env.js localTime reads them.
//   LIGHT_REGIMES  the lighting a site names (PLACES §3.9), each with the hours its rooms change state
//             at, read on the site's own clock: a base's from its Plan of the Day (reveille and taps,
//             src/data/pod.js ROUTINES, the site's `routine`) and its evening at 18:00; a ship's 06:00
//             to 22:00 UTC, VIEWS's `normal` drawn as the day mood and `shipNight` as lights out until
//             VIEWS gives the ship its moods (my call). town and emergency have no hours yet: a site
//             that names them throws where its light is read.
//   ENV_PRESETS  named bundles of overrides a scene or a test names (CONTRACTS §21; `wheel`, the Wheel's floor
//             under Base Melas, PLACES §4.15: 1 G felt, its regime `spin` with the ring's radius 500 m and its
//             ω 0.1347 rad/s as data that nothing reads until BODY's Coriolis and WEAPONS §2.9's spin bias; the
//             Martian indoor standard inside the rim; Mars's sky and clock above it, as Melas's), and ENV_CLASS_PRESET,
//             WEAPONS §2.1's table classes (ballistics.js ENV_CLASSES) as a view of them, so a new body or
//             air is one row here and every reader has it.
// Gravity is a regime and a value: `surface` reads its body's gG; `thrust`, `spin`, `free` and `micro`
// carry their own. The physical constants (G0, R, γ) are src/core/phys.js's, not data.

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/**
 * The worlds (PLACES §1.2, §3.11): gG at the surface (G), dayH (h), obliquityDeg, radiusKm, sunAu, sky class, palette
 * (null: none drawn yet), ground (a SURFACES id). Mars's dayH is the game clock's sol to the millisecond (src/core/clock.js
 * SOL_MS 88,775,244 ms = 24.65979 h; tests/env-fixes.test.mjs holds them equal), and src/sim/places/sun.js reads its
 * obliquity and radius from here.
 */
export const BODIES = deepFreeze({
  mars: { word: 'Mars', gG: 0.38, dayH: 24.65979, obliquityDeg: 25.19, radiusKm: 3389.5, sunAu: 1.524, sky: 'mars-air', palette: 'mars', ground: 'regolith' },
  earth: { word: 'Earth', gG: 1, dayH: 24, obliquityDeg: 23.44, radiusKm: 6371, sunAu: 1, sky: 'earth-air', palette: null, ground: 'soil' },
  europa: { word: 'Europa', gG: 0.134, dayH: 85.23, obliquityDeg: 0.1, radiusKm: 1560.8, sunAu: 5.2, sky: 'airless', palette: null, ground: 'ice-100K' },
  ganymede: { word: 'Ganymede', gG: 0.146, dayH: 171.7, obliquityDeg: 0.33, radiusKm: 2634.1, sunAu: 5.2, sky: 'airless', palette: null, ground: 'ice-100K' },
  callisto: { word: 'Callisto', gG: 0.126, dayH: 400.5, obliquityDeg: 0, radiusKm: 2410.3, sunAu: 5.2, sky: 'airless', palette: null, ground: 'ice-100K' },
  ceres: { word: 'Ceres', gG: 0.029, dayH: 9.074, obliquityDeg: 4, radiusKm: 469.7, sunAu: 2.77, sky: 'airless', palette: null, ground: 'regolith' },
  phobos: { word: 'Phobos', gG: 0.0006, dayH: 7.654, obliquityDeg: 0, radiusKm: 11.27, sunAu: 1.524, sky: 'airless', palette: null, ground: 'regolith' },
  none: { word: 'deep space', gG: 0, dayH: null, obliquityDeg: null, radiusKm: null, sunAu: null, sky: 'none', palette: null, ground: null },
});

/** The airs (PLACES §3.2): pKpa total, o2Kpa, n2Kpa (with argon), co2Kpa, h2oKpa, molarKgMol, airC the set temperature (null: the place's). */
export const AIRS = deepFreeze({
  'mars-melas': { word: 'Melas\'s valley air', pKpa: 65.9, o2Kpa: 21.1, n2Kpa: 44.4, co2Kpa: 0.4, h2oKpa: 0.2, molarKgMol: 0.02962, airC: -10 },
  'mars-datum': { word: 'Martian air at the datum', pKpa: 52, o2Kpa: 16.6, n2Kpa: 35.0, co2Kpa: 0.31, h2oKpa: 0.1, molarKgMol: 0.02962, airC: -25 },
  'martian-indoor': { word: 'the Martian indoor standard', pKpa: 66.0, o2Kpa: 21.0, n2Kpa: 44.0, co2Kpa: 0.1, h2oKpa: 0.94, molarKgMol: 0.02962, airC: 20 },
  'ice-standard': { word: 'Ice standard', pKpa: 75.0, o2Kpa: 16.5, n2Kpa: 57.5, co2Kpa: 0.23, h2oKpa: 0.8, molarKgMol: 0.0289, airC: 14 },
  'belt-station': { word: 'belt station air', pKpa: 70.0, o2Kpa: 18.2, n2Kpa: 50.8, co2Kpa: 0.5, h2oKpa: 0.5, molarKgMol: 0.02916, airC: 18 },
  'earth-standard': { word: 'Earth standard', pKpa: 101.3, o2Kpa: 21.2, n2Kpa: 78.8, co2Kpa: 0.08, h2oKpa: 1.2, molarKgMol: 0.02896, airC: 21 },
  'earth-sea-level': { word: 'Earth\'s air at sea level', pKpa: 101.325, o2Kpa: 21.2, n2Kpa: 80.1, co2Kpa: 0.04, h2oKpa: 0, molarKgMol: 0.02896, airC: 15 },
  'condition-vac': { word: 'Condition Vac', pKpa: 20, o2Kpa: 6.4, n2Kpa: 13.3, co2Kpa: 0.1, h2oKpa: 0.2, molarKgMol: 0.02962, airC: 20 },
  vacuum: { word: 'vacuum', pKpa: 0, o2Kpa: 0, n2Kpa: 0, co2Kpa: 0, h2oKpa: 0, molarKgMol: 0, airC: null },
});

/** The surfaces (PLACES §2.7): muDry, muWet, ferrous (mag boots hold), grip, step (the footstep's kind), dust (0 to 1), soilWord. */
export const SURFACES = deepFreeze({
  regolith: { muDry: 0.5, muWet: 0.45, ferrous: false, grip: 'none', step: 'regolith', dust: 1, soilWord: 'regolith' },
  paving: { muDry: 0.6, muWet: 0.3, ferrous: false, grip: 'none', step: 'concrete', dust: 0.5, soilWord: 'dust' },
  concrete: { muDry: 0.6, muWet: 0.3, ferrous: false, grip: 'none', step: 'concrete', dust: 0.3, soilWord: 'dust' },
  stairs: { muDry: 0.6, muWet: 0.3, ferrous: false, grip: 'none', step: 'concrete', dust: 0.3, soilWord: 'dust' },
  tile: { muDry: 0.5, muWet: 0.25, ferrous: false, grip: 'none', step: 'tile', dust: 0.1, soilWord: 'dust' },
  vinyl: { muDry: 0.55, muWet: 0.3, ferrous: false, grip: 'none', step: 'tile', dust: 0.1, soilWord: 'dust' },
  deckPlate: { muDry: 0.6, muWet: 0.3, ferrous: true, grip: 'magStrip', step: 'concrete', dust: 0, soilWord: 'grease' },
  grating: { muDry: 0.7, muWet: 0.5, ferrous: true, grip: 'handholds', step: 'concrete', dust: 0, soilWord: 'grease' },
  'ice-100K': { muDry: 0.3, muWet: 0.3, ferrous: false, grip: 'none', step: 'regolith', dust: 0.2, soilWord: 'frost' },
  'ice-263K': { muDry: 0.1, muWet: 0.05, ferrous: false, grip: 'none', step: 'regolith', dust: 0, soilWord: 'frost' },
  soil: { muDry: 0.6, muWet: 0.4, ferrous: false, grip: 'none', step: 'regolith', dust: 0.6, soilWord: 'soil' },
  grass: { muDry: 0.55, muWet: 0.35, ferrous: false, grip: 'none', step: 'regolith', dust: 0.2, soilWord: 'soil' },
  rock: { muDry: 0.7, muWet: 0.5, ferrous: false, grip: 'none', step: 'concrete', dust: 0.4, soilWord: 'dust' },
});

/** The kinds of clock a site keeps (PLACES §1.2; TIME §2): Melas's sol, a ship's UTC, an Earth town's day; day 'sol' (SOL_MS, the timeslip in it) or 'day' (24 h). built false: no reader yet. */
export const CLOCKS = deepFreeze({
  'mars-local': { word: 'the local sol', body: 'mars', day: 'sol', built: true },
  utc: { word: 'UTC, the ship\'s clock', body: null, day: 'day', built: true },
  'earth-local': { word: 'the local day', body: 'earth', day: 'day', built: false },
});

/**
 * The lighting regimes a site names (PLACES §3.9), their hours on the site's clock: `routine` true takes
 * the day from reveille and lights out from taps (the site's Plan of the Day, src/data/pod.js ROUTINES),
 * else dayH and outH are the regime's own; eveningH the evening's start (outH for none). hours null: not
 * built (a site naming it throws where its light is read).
 */
export const LIGHT_REGIMES = deepFreeze({
  base: { word: 'a base: reveille and taps on the sol', hours: { routine: true, eveningH: 18.0 } },
  ship: { word: 'a ship: day and night watches on UTC', hours: { routine: false, dayH: 6.0, eveningH: 22.0, outH: 22.0 } },
  town: { word: 'a town: its own day', hours: null },
  emergency: { word: 'emergency lighting', hours: null },
});

/**
 * The named presets (PLACES §3.16; CONTRACTS §21): body, gravity { regime, gG (none: the body's) }, air (an
 * AIRS id), airC (the place's temperature where the air sets none, or a set one), open (outdoor air with
 * weather), sky ('open' or 'none'). A preset is a whole environment: a test or a scene may name one.
 */
export const ENV_PRESETS = deepFreeze({
  'melas-ground': { word: 'the Melas valley floor', body: 'mars', gravity: { regime: 'surface' }, air: 'mars-melas', open: true, sky: 'open' },
  'melas-indoor': { word: 'a building at Melas', body: 'mars', gravity: { regime: 'surface' }, air: 'martian-indoor', open: false, sky: 'none' },
  'mars-datum': { word: 'Mars at the datum', body: 'mars', gravity: { regime: 'surface' }, air: 'mars-datum', open: true, sky: 'open' },
  'wheel': { word: 'the Wheel, the 1 G training hall under Base Melas', body: 'mars', gravity: { regime: 'spin', gG: 1, spin: { radiusM: 500, omegaRadS: 0.1347 } }, air: 'martian-indoor', open: false, sky: 'none' },
  'ship-1g': { word: 'an MCRN hull under 1 g', body: 'none', gravity: { regime: 'thrust', gG: 1 }, air: 'martian-indoor', open: false, sky: 'none' },
  'ship-light': { word: 'an MCRN hull under 0.3 g', body: 'none', gravity: { regime: 'thrust', gG: 0.3 }, air: 'martian-indoor', open: false, sky: 'none' },
  'ship-coast': { word: 'a coasting MCRN deck', body: 'none', gravity: { regime: 'free', gG: 0 }, air: 'martian-indoor', open: false, sky: 'none' },
  'earth-temperate': { word: 'Earth at sea level', body: 'earth', gravity: { regime: 'surface' }, air: 'earth-sea-level', open: true, sky: 'open' },
  'earth-ship': { word: 'a UN hull at Earth standard', body: 'none', gravity: { regime: 'thrust', gG: 1 }, air: 'earth-standard', open: false, sky: 'none' },
  'europa-surface': { word: 'Europa\'s surface', body: 'europa', gravity: { regime: 'surface' }, air: 'vacuum', airC: -170, open: false, sky: 'open' },
  'ceres-drum': { word: 'a drum station under Ceres', body: 'ceres', gravity: { regime: 'spin', gG: 0.3 }, air: 'belt-station', open: false, sky: 'none' },
  'freefall-vacuum': { word: 'free fall in vacuum', body: 'none', gravity: { regime: 'free', gG: 0 }, air: 'vacuum', airC: 0, open: false, sky: 'none' },
});

/** WEAPONS §2.1's table classes (ballistics.js ENV_CLASSES, the names the dope and the tests print) as presets. */
export const ENV_CLASS_PRESET = deepFreeze({
  earth: 'earth-temperate', 'mars-valley': 'melas-ground', 'mars-datum': 'mars-datum', 'ship-thrust': 'ship-1g', 'ship-light': 'ship-light',
  'freefall-air': 'ship-coast', 'earth-ship': 'earth-ship', europa: 'europa-surface', 'freefall-vacuum': 'freefall-vacuum',
});
