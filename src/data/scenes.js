// OLYMPUS data: the scene specs: every start a new game can make, the test scenes each a mechanic built as a playable test the user scores before mechanics are joined (ROADMAP §2.2; the build sheet 0.0.4 §2.2.9; PLACES §9.9; CONTRACTS §21).
//
// A scene is a spec (ROADMAP "anywhere", step 4): { id, title, scenario, host, env, hour, goal, aspects, body,
// outfit, drill?, endOn }. scenario names the fill that builds it (src/sim/game.js SCENARIOS: the barracks at
// the hour, the player at their rack's foot, the range, the bay's turners); host is where it stands, { site,
// area? } (a site of src/data/places/sites.js: the start's clock and longitude are the host's, and the fill
// must enter that site; the generated host { generate: chunkset } comes with the assembler, PLACES §9.9); env
// is its environment, { preset: 'site' } for the host's own (no live override: every shipped scene) or a
// preset of src/data/places/env.js ENV_PRESETS with any of { gravity, air, airC } over it, which newGame sets
// live before the fill (src/sim/places/env.js setLiveEnv), so the fill and every tick read the scene's
// gravity and air; hour is the local hour on the host's clock it starts at (localTime's face: Melas's sol;
// a ship's UTC), a fraction giving minutes, or null for the scenario's own start. The rest is the
// hud's: the goal line it shows for GOAL_S, the aspects the score card asks about ([key, what it is]), the
// body's ledgers set on top of the start body (grime, sweatL, stubbleH, pressureH, bladderMl), the outfit
// worn, a forced alert drill ({ hour }: the night's 02:30, in place of the week's draw), a course of fire
// (course: src/data/courses.js, test-handling's 25 m line, 0.0.5), its setup (test-handling's 'mixed': a
// scene of its own on the same scenario, 0.0.6) and the fact that ends it (the end card, once the strip is
// done; a phase may be a list: the range's 'clear' or 'stopped'; 0.0.7's test-range also 'closed', the range
// closed after a casualty). Scenes sharing a scenario share its host and env (src/sim/game.js specOf checks it).
// 0.0.8's test-pairs (the build sheet 0.0.8 §2.3; COMBAT §25.10.3) plays on a test sheet the start card picks (pairs.js
// testPairs' tier: boot recruit, private, sergeant, Raider, tier one; `sheets` the picker's order, `sheet` its default).
// 0.0.9's test-pairs-bangs, "Three bangs" (the build sheet 0.0.9 §2.2; COMBAT §25.18.3): test-pairs' scenario with its
// setup 'bangs', scored apart on one aspect, the picker opening on the boot recruit (the anchor's first half; "Again as Tier
// one" its second, the sheet's §8 item 21).
// 0.0.10's test-stress, "Bang" (the build sheet 0.0.10 §2.2; COMBAT §25.18.3): five strings at 7 m with the coach's noise in ear
// defenders, on the stress course (src/sim/scenarios/stress.js), scored on three aspects, the picker opening on the boot recruit.
// test-shoothouse, "Stack and clear" (COMBAT §25.10.4; ROADMAP §4.2's 0.0.7d), is a stub: its spec stands at house 1 of the
// Wheel's sector 4 (PLACES §4.15: the Wheel is Base Melas's, so its host is the Melas site and its clock the sol) under the
// `wheel` preset at 1 G, with no scenario and `built: false` until the next round authors its layout; SCENE_IDS (the Tests
// menu) leaves it out and newGame refuses it. STARTS are the two starts that are not test scenes: the career's barracks
// and the sandbox's test rooms (the title and ?play= start them; the Tests menu never lists them).
// The hud reads every field; scenes save nothing (the sheet §8, item 24): their scores alone are kept.
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };
// (every shipped scene stands on Base Melas in the site's own environment: v0.0.10's, byte for byte)
const MELAS = { site: 'melas' }, SITE_ENV = { preset: 'site' };

/** The test scenes (see the header). */
export const SCENES = deepFreeze({
  'test-shower': {
    id: 'test-shower', title: 'Ten minutes under the shower', scenario: 'test-shower', host: MELAS, env: SITE_ENV, hour: 19.5,
    goal: 'Filthy after PT. The showers are across the hall, in Head A: R at a free stall.',
    aspects: [['splash', 'the zoom, the fast watch, the strip'], ['vignette', 'the stall, the water, the steam'], ['pace', 'ten minutes in four seconds']],
    body: { grime: 58, sweatL: 0.4, stubbleH: 14 }, outfit: 'utilities',
    endOn: { fact: 'activity', phase: 'end', activity: ['shower', 'dress'] },
  },
  'test-night': {
    id: 'test-night', title: 'The klaxon at 02:30', scenario: 'test-night', host: MELAS, env: SITE_ENV, hour: 21 + 55 / 60,
    goal: 'Taps at 22:00. Sleep until reveille. If the klaxon goes: up, in utilities, at the foot of your rack in five minutes.',
    aspects: [['night', 'the rack and the night going by'], ['klaxon', 'the klaxon and the landing'], ['drill', 'the scramble, the late card, the count']],
    body: { pressureH: 16.4, bladderMl: 250 }, outfit: 'pt', drill: { hour: 2.5 },
    endOn: { fact: 'alert', phase: 'stand-down' },
  },
  'test-handling': {
    id: 'test-handling', title: 'Show clear', scenario: 'test-handling', host: MELAS, env: SITE_ENV, hour: 9.0,
    goal: "The 25 m line, on the tower's commands: make ready, fire your string, clear the stoppage, unload and show clear.",
    aspects: [['steps', 'every action its time and its roll; the stoppage by its steps'], ['shot', 'the plaque, the roll in the log, the hole in the paper'], ['pace', 'quick to drive by keys, never a wall of text']],
    body: {}, outfit: 'utilities', course: 'fam25',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // (0.0.6, the fixer's: setup 'mixed' from the Tests menu, not only by the URL, so the reach and the look have kinds to
  // choose between in a scene the user plays (their "we may have different types of rounds in inventory"); scored apart)
  'test-handling-mixed': {
    id: 'test-handling-mixed', title: 'Show clear, mixed magazines', scenario: 'test-handling', setup: 'mixed', host: MELAS, env: SITE_ENV, hour: 9.0,
    goal: "The 25 m line with a fourth magazine of tracer among the ball, its kind not told: reach, look, and load what the course fires.",
    aspects: [['steps', 'the reach, the look, the choice of magazine'], ['shot', 'the plaque, the roll in the log, the hole in the paper'], ['pace', 'quick to drive by keys, never a wall of text']],
    body: {}, outfit: 'utilities', course: 'fam25',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // (0.0.7: the KD range in full, ROADMAP §4.2's 0.0.7 row (the build sheet 0.0.7 §2.3): the zero, the confirm at 300 m,
  // the 200 m string, the relay beside you; scored on ROADMAP §2.2's three aspects)
  'test-range': {
    id: 'test-range', title: 'The line at 300 m', scenario: 'test-range', host: MELAS, env: SITE_ENV, hour: 10.0,
    goal: "Zero at 25 m in three-round groups, confirm at 300 m with the pits marking, ten rapid sitting at 200 m. The tower's commands, your coach's calls.",
    aspects: [['far window', 'the far window: the face, the marks, the disk'], ['shot at distance', 'the shot at distance: the zero, the wind, the hold'], ['range safety', 'range safety: the tower, the cold line, the declaration']],
    body: {}, outfit: 'utilities', course: 'kd',
    endOn: { fact: 'range', phase: ['clear', 'stopped', 'closed'] },
  },
  // (0.0.8: the take-in and the shot rows on the bay's turners, ROADMAP §4.2's 0.0.7b row (the build sheet 0.0.8 §2.3))
  'test-pairs': {
    id: 'test-pairs', title: 'Pairs', scenario: 'test-pairs', host: MELAS, env: SITE_ENV, hour: 11.0,
    goal: "Five strings at 7 and 10 m on the coach's timer. Wait out of it at low ready; when a target turns, take it in, then your shots. Threats only.",
    aspects: [['turn', 'the turn: the take-in, its time, the brackets and the stamp'], ['shots', 'the shots: the rows, their price, odds and holes'], ['gun', 'the gun: RELOAD when dry, Top up in the lull']],
    body: {}, outfit: 'utilities', course: 'pairs', sheets: ['recruit', 'private', 'sgt', 'raider', 'tierone'], sheet: 'private',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // (0.0.9: "Three bangs", test-pairs with the coach's three bangs behind you in the first standby, ears unprotected: the
  // user's anchor, 2026-11-07, "three flashbangs go off right next to him" (ROADMAP §4.2's 0.0.7c row, its first patch))
  'test-pairs-bangs': {
    id: 'test-pairs-bangs', title: 'Three bangs', scenario: 'test-pairs', setup: 'bangs', host: MELAS, env: SITE_ENV, hour: 11.0,
    goal: 'Three bangs behind you in the first standby, ears unprotected. Then Pairs as built.',
    aspects: [['bangs', "the bangs: does the recruit's hand fail and the tier one's not, as the marine's, not as lag"]],
    body: {}, outfit: 'utilities', course: 'pairs', sheets: ['recruit', 'private', 'sgt', 'raider', 'tierone'], sheet: 'recruit',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // (0.0.10: "Bang", the stress course: ROADMAP §4.2's 0.0.7c row, its second patch (the build sheet 0.0.10 §2.2))
  'test-stress': {
    id: 'test-stress', title: 'Bang', scenario: 'test-stress', host: MELAS, env: SITE_ENV, hour: 11.0,
    goal: "Five strings at 7 m with the coach's noise. Threats down.",
    aspects: [['chaos', "the chaos: do the horn, the blanks and the bangs feel like a fight, as the marine's and not as lag"], ['contrast', 'the contrast: the recruit overwhelmed, the tier one calm, by "Again as …"'], ['hands', 'the hands: the fumbles, the RELOAD and Breathe, fair and readable']],
    body: {}, outfit: 'utilities', course: 'stress', sheets: ['recruit', 'private', 'sgt', 'raider', 'tierone'], sheet: 'recruit',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // (ROADMAP "anywhere", step 4: the next scene's spec, a stub until the next round builds its layout and its fill (COMBAT
  // §25.10.4; PLACES §4.15): house 1 of the Wheel's sector 4 at 1 G of spin; its hour (a morning training block) is my call)
  'test-shoothouse': {
    id: 'test-shoothouse', title: 'Stack and clear', scenario: null, built: false,
    host: { site: 'melas', area: 'melas.wheel.s4' }, env: { preset: 'wheel' }, hour: 10.0,
    goal: "Lane A of the shoot house with your number two, on the instructor's GO: three rooms and the hall. Threats down, no-shoots untouched.",
    aspects: [['pause', "the pause: the take-in's feel, the brackets, the stamp, the brake, the log"], ['drill', 'the drill: step by step against the bundle, and the decisions that matter yours'], ['shots', 'the shots: the rows and the reloads']],
    body: {}, outfit: 'utilities', course: null, sheets: ['private', 'cpl', 'sgt', 'raider', 'tierone'], sheet: 'private',
    endOn: null,
  },
});

/** The scenes the Tests menu lists, in its order: every built one (a stub's spec waits for its layout). */
export const SCENE_IDS = Object.freeze(Object.keys(SCENES).filter(id => SCENES[id].built !== false));

/** The starts that are not test scenes: the career's barracks and the sandbox's test rooms, each in its host's own environment. */
export const STARTS = deepFreeze({
  barracks: { id: 'barracks', title: 'New career', scenario: 'barracks', host: MELAS, env: SITE_ENV, hour: null },
  sandbox: { id: 'sandbox', title: 'The test rooms', scenario: 'sandbox', host: { site: 'test' }, env: SITE_ENV, hour: null },
});
