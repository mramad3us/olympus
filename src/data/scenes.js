// OLYMPUS data: the test scenes, each a mechanic built as a playable test the user scores before mechanics are joined (ROADMAP §2.2; the build sheet 0.0.4 §2.2.9).
//
// A scene is { id, title, scenario, hour, goal, aspects, body, outfit, drill?, endOn }: the scenario
// it starts (src/sim/scenarios/tests.js fills it: the barracks at the hour, the player at their rack's
// foot), the Mars hour it starts at, the goal line the hud shows for GOAL_S, the aspects the score
// card asks about ([key, what it is]), the body's ledgers set on top of the start body (grime,
// sweatL, stubbleH, pressureH, bladderMl), the outfit worn, a forced alert drill ({ hour }: the night's
// 02:30, in place of the week's draw), a course of fire (course: src/data/courses.js, test-handling's
// 25 m line, 0.0.5), its setup (test-handling's 'mixed': a scene of its own on the same scenario, 0.0.6) and the fact that ends it (the end card, once the strip is done; a phase may be a
// list: the range's 'clear' or 'stopped'; 0.0.7's test-range also 'closed', the range closed after a casualty).
// 0.0.8's test-pairs (the build sheet 0.0.8 §2.3; COMBAT §25.10.3) plays on a test sheet the start card picks (pairs.js
// testPairs' tier: boot recruit, private, sergeant, Raider, tier one; `sheets` the picker's order, `sheet` its default).
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
  // (0.0.6, the fixer's: setup 'mixed' from the Tests menu, not only by the URL, so the reach and the look have kinds to
  // choose between in a scene the user plays (their "we may have different types of rounds in inventory"); scored apart)
  'test-handling-mixed': {
    id: 'test-handling-mixed', title: 'Show clear, mixed magazines', scenario: 'test-handling', setup: 'mixed', hour: 9.0,
    goal: "The 25 m line with a fourth magazine of tracer among the ball, its kind not told: reach, look, and load what the course fires.",
    aspects: [['steps', 'the reach, the look, the choice of magazine'], ['shot', 'the plaque, the roll in the log, the hole in the paper'], ['pace', 'quick to drive by keys, never a wall of text']],
    body: {}, outfit: 'utilities', course: 'fam25',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // (0.0.7: the KD range in full, ROADMAP §4.2's 0.0.7 row (the build sheet 0.0.7 §2.3): the zero, the confirm at 300 m,
  // the 200 m string, the relay beside you; scored on ROADMAP §2.2's three aspects)
  'test-range': {
    id: 'test-range', title: 'The line at 300 m', scenario: 'test-range', hour: 10.0,
    goal: "Zero at 25 m in three-round groups, confirm at 300 m with the pits marking, ten rapid sitting at 200 m. The tower's commands, your coach's calls.",
    aspects: [['far window', 'the far window: the face, the marks, the disk'], ['shot at distance', 'the shot at distance: the zero, the wind, the hold'], ['range safety', 'range safety: the tower, the cold line, the declaration']],
    body: {}, outfit: 'utilities', course: 'kd',
    endOn: { fact: 'range', phase: ['clear', 'stopped', 'closed'] },
  },
  // (0.0.8: the take-in and the shot rows on the bay's turners, ROADMAP §4.2's 0.0.7b row (the build sheet 0.0.8 §2.3))
  'test-pairs': {
    id: 'test-pairs', title: 'Pairs', scenario: 'test-pairs', hour: 11.0,
    goal: "Five strings at 7 and 10 m on the coach's timer. Wait out of it at low ready; when a target turns, take it in, then your shots. Threats only.",
    aspects: [['turn', 'the turn: the take-in, its time, the brackets and the stamp'], ['shots', 'the shots: the rows, their price, odds and holes'], ['gun', 'the gun: RELOAD when dry, Top up in the lull']],
    body: {}, outfit: 'utilities', course: 'pairs', sheets: ['recruit', 'private', 'sgt', 'raider', 'tierone'], sheet: 'private',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
});

/** The scenes in the title's order. */
export const SCENE_IDS = Object.freeze(Object.keys(SCENES));
