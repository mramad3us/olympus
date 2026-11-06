// OLYMPUS data: the test scenes, each a mechanic built as a playable test the user scores before mechanics are joined (ROADMAP §2.2; the build sheet 0.0.4 §2.2.9).
//
// A scene is { id, title, scenario, hour, goal, aspects, body, outfit, drill?, endOn }: the scenario
// it starts (src/sim/scenarios/tests.js fills it: the barracks at the hour, the player at their rack's
// foot), the Mars hour it starts at, the goal line the hud shows for GOAL_S, the aspects the score
// card asks about ([key, what it is]), the body's ledgers set on top of the start body (grime,
// sweatL, stubbleH, pressureH, bladderMl), the outfit worn, a forced alert drill ({ hour }: the night's
// 02:30, in place of the week's draw), a course of fire (course: src/data/courses.js, test-handling's
// 25 m line, 0.0.5) and the fact that ends it (the end card, once the strip is done; a phase may be a
// list: the range's 'clear' or 'stopped').
// The hud reads every field; scenes save nothing (the sheet §8, item 24): their scores alone are kept.
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The test scenes (see the header). */
export const SCENES = deepFreeze({
  'test-shower': {
    id: 'test-shower', title: 'Ten minutes under the shower', scenario: 'test-shower', hour: 19.5,
    goal: 'Filthy after PT. The showers are across the hall, in Head A: R at a free stall.',
    aspects: [['splash', 'the zoom, the fast watch, the strip'], ['vignette', 'the stall, the water, the steam'], ['pace', 'ten minutes in four seconds']],
    body: { grime: 58, sweatL: 0.4, stubbleH: 14 }, outfit: 'utilities',
    endOn: { fact: 'activity', phase: 'end', activity: ['shower', 'dress'] },
  },
  'test-night': {
    id: 'test-night', title: 'The klaxon at 02:30', scenario: 'test-night', hour: 21 + 55 / 60,
    goal: 'Taps at 22:00. Sleep until reveille. If the klaxon goes: up, in utilities, at the foot of your rack in five minutes.',
    aspects: [['night', 'the rack and the night going by'], ['klaxon', 'the klaxon and the landing'], ['drill', 'the scramble, the late card, the count']],
    body: { pressureH: 16.4, bladderMl: 250 }, outfit: 'pt', drill: { hour: 2.5 },
    endOn: { fact: 'alert', phase: 'stand-down' },
  },
  'test-handling': {
    id: 'test-handling', title: 'Show clear', scenario: 'test-handling', hour: 9.0,
    goal: "The 25 m line, on the tower's commands: make ready, fire your string, clear the stoppage, unload and show clear.",
    aspects: [['steps', 'every action its time and its roll; the stoppage by its steps'], ['shot', 'the plaque, the roll in the log, the hole in the paper'], ['pace', 'quick to drive by keys, never a wall of text']],
    body: {}, outfit: 'utilities', course: 'fam25',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
});

/** The scenes in the title's order. */
export const SCENE_IDS = Object.freeze(Object.keys(SCENES));
