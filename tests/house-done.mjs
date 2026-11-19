// OLYMPUS tests: the shoot house's acceptance list as data, the one the user signs (the build sheet v0.0.21 §1 item 20; done lens D1, §1).
//
// The user: "This mission should be perfected before you spend any token on any other mission or core game mission, since most of
// the game will be basically this" (2026-11-11). Nothing said when the pilot ends, so every round added to it; this list is the
// answer, done.md §1's sections A to K kept as data, with this round's rows (the drawn house, qualified, the tick budget, the bench):
//   DONE: [{ id, group, what, words?: { date, text }, check: { kind, ref, by? }, by?, answered? }]
//   kind  'test'    ref 'file › words': the test file tests/<file>.test.mjs, and a case whose name holds the words (or any case);
//         'gauge'   ref 'F25': named by its gauge file (GAUGE_HOMES) and enforced there (an exported *ENFORCED set, a row written
//                   { id, …, enforced: true }, or the case that enforces it: check.by, a test ref);
//         'moment'  ref an id of tests/moment-house.mjs MOMENTS (the house's), or a moment test file of another scene;
//         'sample'  ref a set of samples/ with its sample.json (the look the user scores);
//         'user'    the user's word: answered null until it lands in DESIGN.md's log (the lead copies it here then);
//         'later'   cut from this round to the release named in ref (the sheet's §11), said so, never claimed.
// by: the release (or the role of this round, 'v0.0.21 A') that built it. The quick test (house-done) loads every referenced test
// file and matches its case, checks every gauge enforced, every moment's recipe and every sample's sample.json, and prints WIRED (the
// check is there and enforced: what it proves is the suites' run, not this file's), OPEN (a gauge the last heavy run left red,
// OPEN_GAUGES, with its numbers; every row that names it), USER (with what is pending), ANSWERED (the user's word landed) and
// LATER; a renamed test or a gauge taken out of its ENFORCED fails it, so the list never claims a check that is gone, and never
// counts as met a gauge that is red (the review of 2026-11-16: "MET 194" counted F70, F71 and F73, red in their heavy suites). The
// release announcement quotes the USER and the OPEN rows. Group C, the gauges, is generated: one row a
// gauge, F1 to F99 (GAUGE_LAST). Pure data and two resolvers.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './helpers.mjs';

/** Each gauge's home file under tests/ (by its number) and, where no exported set or row says it, the case that enforces it. */
export const GAUGE_HOMES = Object.freeze([
  { from: 1, to: 26, file: 'flawless.mjs' },
  { from: 27, to: 33, file: 'flawless-kit.mjs' },
  { from: 34, to: 37, file: 'flawless-team.mjs' },
  { from: 38, to: 44, file: 'flawless-live.mjs' },
  { from: 45, to: 49, file: 'flawless-bodies.mjs' },
  { from: 50, to: 54, file: 'flawless-room.mjs' },
  // (the card's: each enforced by its case, its rows carrying no flag (v0.0.20 C); F56's rooms' clause enforced, its stands' printed)
  { from: 55, to: 55, file: 'flawless-card.mjs', by: 'house-cause-rates › F55:' },
  { from: 56, to: 56, file: 'flawless-card.mjs', by: 'house-pars › F56:' },
  { from: 57, to: 57, file: 'flawless-card.mjs', by: 'speaker-marks' },
  { from: 58, to: 58, file: 'flawless-card.mjs', by: 'replay-run' },
  { from: 59, to: 59, file: 'flawless-sound.mjs', by: 'house-voiced › F59 enforced' },
  { from: 60, to: 60, file: 'flawless-perf.mjs', by: 'house-tick-budget' },
  { from: 61, to: 62, file: 'flawless-drawn-a.mjs', role: 'A' },
  { from: 63, to: 68, file: 'flawless-drawn.mjs', role: 'B' },
  { from: 69, to: 71, file: 'flawless-done.mjs', role: 'C' },
  { from: 72, to: 72, file: 'flawless-op.mjs', role: 'D' },
  { from: 73, to: 73, file: 'render-bench.test.mjs', role: 'D', by: 'render-bench' },
  // (its build sheet §8; added by its integration, §0 item 41: each role's file and the set or case that enforces it. F76
  // printed until the lead's quiet run, its case house-drawn8's sweep (red: OPEN_GAUGES); F81 printed and enforced at the measure,
  // its case live-race's drawn one; F80 and F82 by their heavy cases)
  { from: 74, to: 75, file: 'flawless-rooms.mjs', role: 'A' },
  { from: 76, to: 76, file: 'flawless-rooms.mjs', role: 'A', by: 'house-drawn8 › a hundred eight-room houses' },
  { from: 77, to: 77, file: 'flawless-rooms.mjs', role: 'A' },
  { from: 78, to: 79, file: 'flawless-blast.mjs', role: 'B' },
  { from: 80, to: 80, file: 'flawless-end.mjs', role: 'C', by: 'house-flawless-live › v0.0.22, F80' },
  { from: 81, to: 81, file: 'flawless-end.mjs', role: 'C', by: 'live-race › v0.0.22, F81' },
  { from: 82, to: 82, file: 'flawless-end.mjs', role: 'C', by: 'house-live-words › the live lane\'s words over 8 seeds' },
  { from: 83, to: 83, file: 'ui-houseplan.test.mjs', role: 'D', by: 'ui-houseplan › the ghost' },
  { from: 84, to: 84, file: 'flawless-held.mjs', role: 'D' },
  // (v0.0.23, its build sheet §8 and the stage-0 lead's F97: A's record against the stage, enforced in SEEN_ENFORCED)
  { from: 85, to: 86, file: 'flawless-seen.mjs', role: 'A' },
  { from: 97, to: 97, file: 'flawless-seen.mjs', role: 'A' },
  // (B's: nobody drawn before seen and the unknown house, enforced in KNOWN_ENFORCED; their page halves ui-unknown's)
  { from: 87, to: 88, file: 'flawless-known.mjs', role: 'B' },
  // (C's: the portraits, F89 to F91, and the lead's F98 and F99 for the P-12's stances and the slung R-7, enforced in PORTRAIT_ENFORCED)
  { from: 89, to: 91, file: 'flawless-portrait.mjs', role: 'C' },
  { from: 98, to: 99, file: 'flawless-portrait.mjs', role: 'C' },
  // (D's: the carried fixes, F92 to F95 enforced in CARRIED_ENFORCED (F92 and F93 by house-reader's sweep, heavy; F94 by house-live-brief,
  // F95 by house-again-brief), F96 by its page case)
  { from: 92, to: 95, file: 'flawless-carried.mjs', role: 'D' },
  { from: 96, to: 96, file: 'ui-goal-clamp.test.mjs', role: 'D', by: 'ui-goal-clamp' },
]);
/** The gauges' names, a short line each (COMBAT §25.19.8 and the sheets' §8; group C's rows). */
export const GAUGE_WHAT = Object.freeze({
  F1: 'nobody through a wall', F2: 'bodies never overlap', F3: 'the paths walkable', F4: 'nobody stops in a doorway', F5: 'flow in and take your shots',
  F6: 'the #2 flows in', F7: 'your corner first', F8: 'no muzzle over the partner', F9: 'each man taken by his owner', F10: 'the pars met in your sector',
  F11: 'never a dead end', F12: 'every row runs', F13: 'one press a stop', F14: 'every lane to its card in time', F15: 'the tier one\'s lane time',
  F16: 'no "Clear the house"', F17: 'the stack together', F18: 'the #2 answers the tower', F19: 'the #2 seen doing it', F20: 'the jam answered',
  F21: 'the keys sheets\' lanes', F22: 'room 1 the reference room', F23: 'a save anywhere carries on', F24: 'T one press, the panel grouped', F25: 'the #2 in on his cue',
  F26: 'nobody in a door\'s swing', F27: 'bang to entry', F28: 'the stack out of the blast', F29: 'the breach\'s stand-off', F30: 'the frag only where called',
  F31: 'the frag\'s brief', F32: 'the cut through the hinges', F33: 'the kit\'s marks', F34: 'the #2\'s admin', F35: 'the team\'s words',
  F36: 'the team\'s tasks', F37: 'the team\'s panel', F38: 'the live men fight', F39: 'covered when down', F40: 'every live man accounted for',
  F41: 'paint by the rule', F42: 'his rounds by his sight', F43: 'the live gate', F44: 'the live balance', F45: 'never pinned',
  F46: 'in on the cue', F47: 'off your #2\'s line', F48: 'on your heels', F49: 'the bodies\' gaps', F50: 'AT THE DOOR\'s five',
  F51: 'the cold line\'s Fix', F52: '"Coming out!" and the mark', F53: 'the far walk called', F54: 'his call-outs told', F55: 'the par\'s cause',
  F56: 'pars a sheet can meet', F57: 'nothing over the room', F58: 'the debrief and the replay', F59: 'every line heard', F60: 'the busiest tick under 2 ms',
  F61: 'a drawn house keeps every rule', F62: 'a drawn lane\'s doors', F63: 'the tier one\'s drawn lanes', F64: 'the keys private\'s drawn lanes', F65: 'stops on a drawn lane',
  F66: 'room 1 varies', F67: 'the fumble net empty', F68: 'the route budget', F69: 'the ladder ordered', F70: 'GO at your standard, NO-GO at the next',
  F71: 'the moments\' pace', F72: 'the drill off the range', F73: 'the house benches within TECH §16.1',
  F74: 'the deriver checks every plan', F75: 'the eight rooms\' cases', F76: 'eight-room lanes in their pars', F77: 'nobody at rest in a no-stop zone',
  F78: 'the stack\'s own grenade', F79: 'nobody into a live grenade', F80: 'the drawn live lanes', F81: 'the race by post',
  F82: 'the lane ends as it is ended', F83: 'the ghost on its own key, whole pixels, a 4× replay\'s frames', F84: 'the held device drawn',
  F85: 'the record agrees with the stage', F86: 'no key moves in a pause, the stage\'s looks as recorded', F97: 'the P-12\'s posture, one record',
  F87: 'nobody drawn before seen', F88: 'the unknown house drawn as seen',
  F89: 'the gun reads on the card', F90: 'the card shows what you see', F91: 'the card\'s cost', F98: 'the P-12\'s stances drawn', F99: 'the slung R-7 while the pistol is up',
  F92: 'the walk in by the words', F93: 'the line follows the legs', F94: 'the words keep their meaning', F95: 'Again\'s brief', F96: 'the goal line never clipped',
});
// (v0.0.23's integration, the stage-0 lead's plan: F97 to F99, the P-12's gauges of the user's fourth note of 2026-11-17, homed
// from A's and C's merges, counted at the last step; the instructor's sterile walk takes no F number, house-sterile-walk stands as a
// test (the lead's call), and v0.0.24's sheet shifts its numbers by exactly three)
export const GAUGE_LAST = 99;
/** The gauge's home (GAUGE_HOMES' row), or null. */
export const homeOf = (id) => { const n = Number(String(id).replace(/^F/, '')); return GAUGE_HOMES.find(h => n >= h.from && n <= h.to) ?? null; };

const W = (date, text) => ({ date, text });
const test = (ref, by = null) => ({ kind: 'test', ref, ...(by ? { by } : {}) });
const gauge = (ref) => ({ kind: 'gauge', ref });
const user = (ref) => ({ kind: 'user', ref });
const later = (ref) => ({ kind: 'later', ref });
const D11 = '2026-11-11', D13 = '2026-11-13', D15 = '2026-11-15', D16 = '2026-11-16';

/** The list (see the header): done.md §1's groups A to K, as built to v0.0.21, and this round's rows (L). */
export const DONE = Object.freeze([
  // ---- A. The user's verdict ----
  { id: 'A1', group: 'A', what: '"Stack and clear" starred, every aspect 70 or more', words: W(D11, 'This mission should be perfected before you spend any token on any other mission or core game mission'), check: user('the score line of test-shoothouse'), answered: null },
  { id: 'A2', group: 'A', what: '"Stack and clear, live" starred', check: user('the score line of test-shoothouse-live'), answered: null },
  { id: 'A3', group: 'A', what: 'the panel\'s condition: P3-j starred 100 "if we can make the controls work cleanly"', words: W('2026-11-12', 'if we can make the controls work cleanly'), check: user('the panel aspect'), answered: null },
  { id: 'A3a', group: 'A', what: 'T one press, the panel grouped', check: gauge('F24'), by: 'v0.0.14' },
  { id: 'A3b', group: 'A', what: 'AT THE DOOR\'s five the same on every lane', check: gauge('F50'), by: 'v0.0.20' },
  { id: 'A4', group: 'A', what: 'the walk judged live', words: W('2026-11-12', 'Hard to tell without seeing it animated ... will judge when live'), check: user('the feel aspect, the To score page\'s Walk row'), answered: null },
  { id: 'A5', group: 'A', what: 'every waiting sample picked or waived', check: user('the To score page: helmets, stack figures, the P-12\'s card, wcard2, doll-gear, target-view, opfor-look, marks, the shot, the voices'), answered: null },
  ...['helmets', 'house-stack-figures', 'p12-card', 'wcard2', 'doll-gear', 'target-view', 'opfor-look', 'marks', 'audio', 'voices', 'walk'].map((set, i) => ({ id: `A5${String.fromCharCode(97 + i)}`, group: 'A', what: `the samples to score: ${set}`, check: { kind: 'sample', ref: set } })),
  { id: 'A6', group: 'A', what: 'the open questions answered or their defaults accepted (v0.0.18 to v0.0.21\'s)', check: user('DESIGN.md\'s log'), answered: null },
  // ---- B. The user's complaints, each closed by a test (ROADMAP §2.4 item 7) ----
  { id: 'B1', group: 'B', what: 'nobody through a wall', words: W(D11, 'Operators path through walls when automatic pathing'), check: gauge('F1'), by: 'v0.0.14' },
  { id: 'B1b', group: 'B', what: 'the paths walkable', words: W(D11, 'Operators path through walls when automatic pathing'), check: gauge('F3'), by: 'v0.0.14' },
  { id: 'B2', group: 'B', what: 'low ready over the partner is no muzzle fault', words: W(D11, 'still get flagged a fault for muzzle'), check: test('house-muzzle'), by: 'v0.0.14' },
  { id: 'B2b', group: 'B', what: 'no muzzle over the partner', check: gauge('F8') },
  { id: 'B3', group: 'B', what: 'a jam answered as a marine would', words: W(D11, 'switch to side arm or something realistic like take cover'), check: test('house-transition'), by: 'v0.0.17' },
  { id: 'B3b', group: 'B', what: 'the jam answered', check: gauge('F20') },
  { id: 'B4', group: 'B', what: 'the #2 answers the tower and is seen doing it', words: W(D11, 'Partner does nothing the tower asks for or at least doesn\'t animate doing it'), check: gauge('F18') },
  { id: 'B4b', group: 'B', what: 'the #2 seen doing it', check: gauge('F19') },
  { id: 'B4c', group: 'B', what: 'the #2\'s admin, his P-12 too', check: gauge('F34'), by: 'v0.0.19' },
  { id: 'B5', group: 'B', what: 'flow in and take the shots in position', words: W(D11, 'trained operators know to flow in and take shots when they\'re in position'), check: gauge('F5') },
  { id: 'B5b', group: 'B', what: 'the #2 flows in', check: gauge('F6') },
  { id: 'B6', group: 'B', what: 'one press a stop', words: W(D11, 'the automatic pauses are awkward in general'), check: gauge('F13') },
  { id: 'B7', group: 'B', what: 'no "Clear the house"', words: W(D11, 'the option to clear the whole house should not exist'), check: gauge('F16'), by: 'v0.0.14' },
  { id: 'B8', group: 'B', what: 'the AI clears it flawlessly: every gauge on 100 seeds a sheet', words: W(D11, 'the AI should be able to clear this flawlessly with an operator'), check: test('house-flawless-more'), by: 'v0.0.18' },
  { id: 'B8b', group: 'B', what: 'never a dead end', check: gauge('F11') },
  { id: 'B9', group: 'B', what: 'the muscle-memory rows: stack up, take point, breach, kick', words: W(D11, '"stack up", "stack up, take point", "breach (explosive)", "kick door"'), check: test('house-catalogue'), by: 'v0.0.14' },
  { id: 'B10', group: 'B', what: 'grouped by type, always visible, greyed when not', words: W(D11, 'group them by type ... always visible and accessible (even if grayed out'), check: test('panel-keys'), by: 'v0.0.17' },
  { id: 'B11', group: 'B', what: 'the walk', words: W(D11, 'saying that the walking about is goofy is an understatement'), check: user('A4'), answered: null },
  { id: 'B12', group: 'B', what: 'no "assault <-> combat" riddle', words: W(D11, 'don\'t know what the assault <-> combat option is supposed to mean'), check: test('house-review'), by: 'v0.0.14' },
  { id: 'B13', group: 'B', what: 'natural 1s far more often than 20s, and slower', words: W(D11, 'much much more than nat 20s'), check: test('catches'), by: 'v0.0.14' },
  { id: 'B13b', group: 'B', what: 'the catches marked', check: test('catch-marks') },
  { id: 'B14', group: 'B', what: 'nobody stops in a doorway', words: W(D13, 'soldiers need to stay fluidly moving'), check: gauge('F4') },
  { id: 'B15', group: 'B', what: 'the keys follow the choices made', words: W(D15, 'the keys selection isn\'t updated according to the choices made earlier'), check: test('ui-panel-c'), by: 'v0.0.17' },
  { id: 'B16', group: 'B', what: 'a P-12 on every sheet', words: W(D15, 'everyone should have the same loadout, there is no reason to not give sidearms to low ranks'), check: test('house-sidearm'), by: 'v0.0.17' },
  { id: 'B16b', group: 'B', what: 'your #2\'s P-12 standard issue', words: W(D16, '#2 has to have a sidearm.'), check: test('two-p12'), by: 'v0.0.20' },
  { id: 'B17', group: 'B', what: 'your #2 in on his cue, room 2 included', words: W(D15, 'squad AI sometimes stays out of the room on entry (room 2)'), check: gauge('F25'), by: 'v0.0.17' },
  { id: 'B17b', group: 'B', what: 'in on the cue under the bodies\' rules', check: gauge('F46'), by: 'v0.0.20' },
  { id: 'B17c', group: 'B', what: 'on your heels', check: gauge('F48'), by: 'v0.0.20' },
  { id: 'B18', group: 'B', what: 'which is your corner, defined', words: W(D15, 'rigorous definition of which is our corner'), check: test('house-corner'), by: 'v0.0.17' },
  { id: 'B19', group: 'B', what: 'the guns bang harder, the steps quieter', words: W(D15, 'guns should bang harder and closer to realistic ... steps are too loud'), check: test('audio-gun'), by: 'v0.0.17' },
  { id: 'B19b', group: 'B', what: 'the shot picked', check: user('the To score page\'s Shot row (A0 to A4)'), answered: null },
  { id: 'B20', group: 'B', what: 'the helmet', words: W(D15, 'The helmet design is pretty goofy'), check: test('art-helmets'), by: 'v0.0.17' },
  { id: 'B21', group: 'B', what: 'doors open one way, and the way shapes the entry', words: W(D15, 'doors should have a direction they open (pull or push) and it should affect our options for entry'), check: test('house-doors'), by: 'v0.0.17' },
  { id: 'B21b', group: 'B', what: 'nobody in a door\'s swing', check: gauge('F26'), by: 'v0.0.17' },
  { id: 'B21c', group: 'B', what: 'the swings drawn by the seed, the latch toward you', check: test('house-swings'), by: 'v0.0.21 A' },
  { id: 'B22', group: 'B', what: 'breaching, grenades and a loadout screen', words: W(D15, 'breaching options and equipment (explosives etc), and grenades (bangs, frags, concussion etc) and a loadout screen'), check: test('house-breach'), by: 'v0.0.18' },
  { id: 'B22b', group: 'B', what: 'the bang', check: test('house-flash'), by: 'v0.0.18' },
  { id: 'B22c', group: 'B', what: 'the loadout screen', check: test('ui-loadout'), by: 'v0.0.18' },
  ...['F27', 'F28', 'F29', 'F30', 'F31', 'F32', 'F33'].map((F, i) => ({ id: `B22${String.fromCharCode(100 + i)}`, group: 'B', what: `the kit: ${GAUGE_WHAT[F]}`, check: gauge(F) })),
  { id: 'B23', group: 'B', what: 'the target view wherever you engage', words: W(D15, 'we need to generalize that target view for every time we\'re engaging something or someone'), check: test('ui-target'), by: 'v0.0.18' },
  { id: 'B24', group: 'B', what: 'a way to load always offered', words: W(D15, 'fumbled magazine when topping up, no option to load'), check: test('house-magout'), by: 'v0.0.17' },
  { id: 'B25', group: 'B', what: 'the preview wears the gear', words: W(D15, 'the I and C menu preview of the character should show the currently worn gear'), check: test('gear-guns'), by: 'v0.0.18' },
  { id: 'B25b', group: 'B', what: 'the doll dressed', check: test('figures-doll'), by: 'v0.0.18' },
  { id: 'B26', group: 'B', what: 'the options from the gun\'s state', words: W(D15, 'the reload, top up etc options should simply look at the state of our weapons'), check: test('plan-walk'), by: 'v0.0.18' },
  { id: 'B26b', group: 'B', what: 'the cold line\'s Fix', check: gauge('F51'), by: 'v0.0.20' },
  { id: 'B27', group: 'B', what: 'it works against men who fight', words: W(D13, 'will these changes translate naturally to the eventual game ? I mean will this work well when we are fighting actual enemies ?'), check: test('house-flawless-live'), by: 'v0.0.19' },
  ...['F38', 'F39', 'F40', 'F41', 'F42', 'F43', 'F44'].map((F, i) => ({ id: `B27${String.fromCharCode(98 + i)}`, group: 'B', what: `the live men: ${GAUGE_WHAT[F]}`, check: gauge(F) })),
  { id: 'B27i', group: 'B', what: 'the drill off the range\'s lane', check: test('cqb-anywhere'), by: 'v0.0.21 D' },
  { id: 'B28', group: 'B', what: 'paint ends the lane only on a fatal hit', words: W(D16, 'Paintball should end if the hit is \'fatal\''), check: test('would-lane'), by: 'v0.0.20' },
  // ---- C. The gauges: generated below (one row a gauge) ----
  { id: 'C6', group: 'C', what: 'no criterion left printed only but the fuzz bot\'s (F44\'s balance, F56\'s stands, F59\'s if the voice were not the default)', check: later('the lead: enforced at the measured value or struck in CHANGELOG (c.md)') },
  // ---- D. Never a dead end ----
  { id: 'D1', group: 'D', what: 'every bot, every sheet, to the card', check: test('shoothouse-nodead'), by: 'v0.0.12' },
  { id: 'D2', group: 'D', what: 'the fumble net\'s lists are empty and its sweep meets no case', check: test('house-fumble › lists are empty'), by: 'v0.0.21 B' },
  { id: 'D2b', group: 'D', what: 'the fumble net empty', check: gauge('F67'), by: 'v0.0.21 B' },
  { id: 'D3', group: 'D', what: 'the hunt\'s findings each closed by a test failing without its fix', check: test('house-fumble'), by: 'v0.0.18' },
  { id: 'D4', group: 'D', what: 'never a dead end on a drawn house: the four found', check: test('house-drawn-fixes'), by: 'v0.0.21 B' },
  { id: 'D5', group: 'D', what: 'your P-12 at the tower: holstered at Stop, never cold at GO in silence', check: test('house-pistol'), by: 'v0.0.21 B' },
  // ---- E. The ladder and the verdict ----
  { id: 'E1', group: 'E', what: 'the instructor\'s GO or NO-GO for your sheet', check: test('house-verdict'), by: 'v0.0.20' },
  { id: 'E2', group: 'E', what: 'pars a sheet can meet', check: test('house-pars'), by: 'v0.0.20' },
  { id: 'E2b', group: 'E', what: 'pars a sheet can meet', check: gauge('F56'), by: 'v0.0.20' },
  { id: 'E3', group: 'E', what: 'bests, GOs and the next sheet up on the picker', check: test('house-runs'), by: 'v0.0.20' },
  { id: 'E4', group: 'E', what: 'the ladder ordered, with real steps', check: gauge('F69'), by: 'v0.0.21 C' },
  { id: 'E5', group: 'E', what: 'the standards differ', check: gauge('F70'), by: 'v0.0.21 C' },
  { id: 'E6', group: 'E', what: 'qualified: three GOs in a row on houses never seen', check: test('house-qual'), by: 'v0.0.21 C' },
  { id: 'E6b', group: 'E', what: 'qualified in the page', check: test('ui-qual'), by: 'v0.0.21 C' },
  { id: 'E7', group: 'E', what: 'a clean room counted for the career', check: test('drill-reps'), by: 'v0.0.21 C' },
  // ---- F. Moments (ROADMAP §2.3, §2.4 item 1) ----
  ...['house-steps', 'house-clean', 'house-jam', 'house-bang', 'house-cut', 'house-man'].map((m, i) => ({ id: `F${i + 1}`, group: 'F', what: `the moment ${m}`, check: { kind: 'moment', ref: m }, by: 'v0.0.21 C' })),
  { id: 'F7', group: 'F', what: 'the moments\' pace', check: gauge('F71'), by: 'v0.0.21 C' },
  // ---- G. Saves, determinism, replay ----
  { id: 'G1', group: 'G', what: 'a save anywhere carries on byte for byte', check: gauge('F23') },
  { id: 'G2', group: 'G', what: 'every earlier house save loads and carries on', check: test('game-upgrade'), by: 'v0.0.13' },
  { id: 'G3', group: 'G', what: 'a run exported from the page replays in node', check: test('replay-run'), by: 'v0.0.20' },
  { id: 'G4', group: 'G', what: 'the save small, clean and quick', check: test('house-save-size'), by: 'v0.0.21 C' },
  // ---- H. Performance (TECH §16.1) ----
  { id: 'H1', group: 'H', what: 'the house benches within TECH §16.1 on the Mac', check: gauge('F73'), by: 'v0.0.21 D' },
  { id: 'H2', group: 'H', what: 'the same benches from Windows', check: user('the four bench cards pasted from play.cmd --dev'), answered: null },
  { id: 'H3', group: 'H', what: 'the sim\'s busiest house tick under 2 ms', check: gauge('F60'), by: 'v0.0.21 stage 0' },
  { id: 'H4', group: 'H', what: 'the page quiet in stop motion', check: test('ui-held'), by: 'v0.0.21 D' },
  { id: 'H5', group: 'H', what: 'a long session stays light', check: test('ui-soak'), by: 'v0.0.21 D' },
  { id: 'H6', group: 'H', what: 'the #2 never storms the router', check: gauge('F68'), by: 'v0.0.21 B' },
  // ---- I. The scored scenes untouched ----
  { id: 'I1', group: 'I', what: '"Bang" as starred', check: test('scene-stress'), by: 'v0.0.10' },
  { id: 'I2', group: 'I', what: '"Three bangs" as starred', check: test('bangs-pin'), by: 'v0.0.9' },
  { id: 'I3', group: 'I', what: '"Pairs" as starred', check: test('scene-pairs'), by: 'v0.0.8' },
  { id: 'I4', group: 'I', what: 'test-handling as starred', check: test('scene-handling'), by: 'v0.0.6' },
  // ---- J. The hand-off ----
  { id: 'J1', group: 'J', what: 'the drill wherever a team meets a room plan', check: gauge('F72'), by: 'v0.0.21 D' },
  { id: 'J2', group: 'J', what: 'a breach opens the place\'s door', check: test('cqb-anywhere'), by: 'v0.0.21 D' },
  { id: 'J3', group: 'J', what: 'the #2\'s brain in combat/', check: test('two-anywhere'), by: 'v0.0.21 D' },
  { id: 'J3b', group: 'J', what: 'no file of combat/ imports a scenario', check: test('syntax › combat imports no scenario'), by: 'v0.0.21 stage 0' },
  { id: 'J4', group: 'J', what: 'the gauges a library', check: test('cqb-gauges'), by: 'v0.0.21 D' },
  { id: 'J5', group: 'J', what: 'room plans derived and checked against the authored', check: test('plans-derived'), by: 'v0.0.22 A' },
  { id: 'J6', group: 'J', what: 'a clean room counts toward the career\'s rung', check: test('drill-reps'), by: 'v0.0.21 C' },
  { id: 'J7', group: 'J', what: 'the no-stop zone a kind any plan declares', check: test('zones-kinds'), by: 'v0.0.22 A' },
  // ---- K. Docs ----
  { id: 'K1', group: 'K', what: 'the docs give the numbers the code has', check: later('the lead\'s docs stage, each release') },
  { id: 'K2', group: 'K', what: 'COMBAT §25.21 "The pilot handed off", the ROADMAP rows closed, the log', check: user('A1, then the lead\'s close (D12)'), answered: null },
  // ---- L. This round: the drawn house ----
  { id: 'L1', group: 'L', what: 'a house you have not seen: three rooms placed by the seed', check: test('house-assemble'), by: 'v0.0.21 A' },
  { id: 'L1b', group: 'L', what: 'the rooms\' cases', check: test('house-cases'), by: 'v0.0.21 A' },
  { id: 'L1c', group: 'L', what: 'the shapes and their goldens', check: test('house-shapes'), by: 'v0.0.21 A' },
  { id: 'L2', group: 'L', what: 'doors found open or locked; an open door turns nobody before GO', check: test('house-door-states'), by: 'v0.0.21 A' },
  { id: 'L3', group: 'L', what: 'each room\'s own men, the hostage anywhere, every lane fair', check: test('house-fair'), by: 'v0.0.21 A' },
  { id: 'L4', group: 'L', what: 'the drawn house on the card and the score line', check: test('house-draw-mode'), by: 'v0.0.21 A' },
  { id: 'L5', group: 'L', what: 'your man is the one in your sector', check: test('house-owner'), by: 'v0.0.21 B' },
  { id: 'L6', group: 'L', what: 'the gauges on drawn lanes', check: test('house-drawn-quick'), by: 'v0.0.21 B' },
  { id: 'L7', group: 'L', what: 'the drawn house by default', words: W(D16, 'question 3 of v0.0.21'), check: user('question 3: "drawn from the seed" by default, the handcrafted rule read through PLACES §4.12'), answered: null },
  // ---- M. v0.0.22 (its build sheet §1): each role's rows directly below its own anchor ----
  // (A: the rooms; F76's row only at the lead's run that enforces it, §0 item 41)
  { id: 'M1', group: 'M', what: 'every room plan checked by the deriver (F74): layout A\'s and the chunks\' families within DERIVE_TOL, the same owners', check: test('plans-derived'), by: 'v0.0.22 A' },
  { id: 'M2', group: 'M', what: 'X4\'s other five rooms (the long, narrow, offset and small rooms, the room and its back room), every case held (F75)', check: test('house-cases › v0.0.22, F75'), by: 'v0.0.22 A' },
  { id: 'M3', group: 'M', what: 'the five rooms\' plans derived by a tool, committed, and fresh', check: test('chunks-fresh'), by: 'v0.0.22 A' },
  { id: 'M4', group: 'M', what: 'what a no-stop zone is: the back room\'s doorway a funnel, a hatch\'s rect, nobody at rest in either', check: test('zones-kinds'), by: 'v0.0.22 A' },
  { id: 'M5', group: 'M', what: 'a house drawn from all eight rooms', check: test('house-draw8'), by: 'v0.0.22 A' },
  { id: 'M6', group: 'M', what: 'layouts B and C, the instructors\' other two panel settings', check: test('house-layouts'), by: 'v0.0.22 A' },
  { id: 'M7', group: 'M', what: 'the gauges on eight-room lanes (F76 printed, F77)', check: test('house-drawn8'), by: 'v0.0.22 A' },
  { id: 'M8', group: 'M', what: 'whole lanes on the deriver\'s plans', check: test('house-flawless-derived'), by: 'v0.0.22 A' },
  { id: 'M9', group: 'M', what: 'X4\'s eight rooms drawn by default', words: W(D16, 'question 4 of v0.0.22'), check: user('question 4: the drawn house from all eight rooms, once 100 eight-room lanes meet every gauge'), answered: null },
  // (B: the kit's blast and the instinct's words)
  { id: 'MB1', group: 'M', what: 'your own G-11 shielded by the jamb you stand behind: one blast model with the practice read', check: test('blast-line › one model'), by: 'v0.0.22 B' },
  { id: 'MB2', group: 'M', what: 'a grenade at your feet or short on you hands back "Get clear", and the DI names it', check: test('slip-g11'), by: 'v0.0.22 B' },
  { id: 'MB3', group: 'M', what: 'your #2 waits for the bang, and runs clear of a live grenade', check: test('two-live'), by: 'v0.0.22 B' },
  { id: 'MB4', group: 'M', what: 'the frag named at the stack, the brief\'s warning with it', check: test('cqb-frag-words'), by: 'v0.0.22 B' },
  { id: 'MB5', group: 'M', what: 'the DI\'s words a new player can read', check: test('house-shorthand › shorthand'), by: 'v0.0.22 B' },
  { id: 'MB6', group: 'M', what: 'the stack\'s own grenade over the kit lanes, none of yours over BREACH_SAFE_KPA on the stack but a hand-back declined (F78)', check: test('blast-line › F78 (heavy)'), by: 'v0.0.22 B' },
  { id: 'MB8', group: 'M', what: 'the twin\'s far walk said as its back room, the habit said as kept', check: test('house-twin-words › the twin'), by: 'v0.0.22 B' },
  { id: 'MB7', group: 'M', what: 'nobody into a live grenade over the kit lanes, the fuzz included (F79)', check: test('two-live › F79 (heavy)'), by: 'v0.0.22 B' },
  // (C: the lane's end and the live lane; F81's row only at the lead's run that enforces it)
  { id: 'M-C1', group: 'M', what: 'SHOW CLEAR to the instructor\'s eye, your #2\'s clear behind the splash', check: test('house-showclear'), by: 'v0.0.22 C' },
  { id: 'M-C2', group: 'M', what: 'paint called when it has landed, the lane\'s words ending with it', check: test('house-live-words'), by: 'v0.0.22 C' },
  { id: 'M-C3', group: 'M', what: 'one "Clear!" a man a room', check: test('house-echo'), by: 'v0.0.22 C' },
  { id: 'M-C4', group: 'M', what: 'the casualty\'s lesson names what killed you', check: test('house-cause'), by: 'v0.0.22 C' },
  { id: 'M-C5', group: 'M', what: 'the umpire\'s words to the man ruled out', check: test('house-words'), by: 'v0.0.22 C' },
  { id: 'M-C6', group: 'M', what: '"Stack and clear, live" on a drawn house', check: test('house-live-drawn'), by: 'v0.0.22 C' },
  { id: 'M-C7', group: 'M', what: 'every chunk\'s post valid where it falls', check: test('opfor-spots-drawn'), by: 'v0.0.22 C' },
  { id: 'MD1', group: 'M', what: 'the plan view\'s ghost: a run kept by the page, keyed on its house and lane, "+5.8 s" at room 2\'s door', check: test('house-ghost'), by: 'v0.0.22 D' },
  { id: 'MD2', group: 'M', what: '"Again as Tier one" shows where he was: the ghost on the card, in whole pixels, F83', check: test('ui-houseplan › the ghost'), by: 'v0.0.22 D' },
  { id: 'MD3', group: 'M', what: 'the picker\'s house (A, B, C, drawn) and rooms rows; "LANE B" on the paper and the card', check: test('house-picker'), by: 'v0.0.22 D' },
  { id: 'MD4', group: 'M', what: 'the device in your hands drawn: every shape, frame and facing on its hand', check: test('art-held'), by: 'v0.0.22 D' },
  { id: 'MD5', group: 'M', what: 'the held device one quantity with its flight, F84', check: test('look-held › heldLook follows'), by: 'v0.0.22 D' },
  { id: 'MD6', group: 'M', what: 'the G-11 in your hand on the stage, nothing baked mid-lane', check: test('ui-held-device'), by: 'v0.0.22 D' },
  { id: 'MD7', group: 'M', what: 'the samples to score: held-devices (G, T, B, R, C; the defaults G1, T1, B1, R1, C1 drawn until scored)', check: { kind: 'sample', ref: 'held-devices' } },
  // (D: the page and the art)
  // ---- N. v0.0.23 (its build sheet §1): each role's rows directly below its own anchor ----
  // (A: the record of what you see and the back of a man, F85 and F86; the P-12's posture in the record, F97)
  { id: 'NA1', group: 'N', what: 'one record of what you see of a man (his hold, his pose, his facing from your eye), the key only what a portrait draws', check: test('seen › the key holds only what is drawn'), by: 'v0.0.23 A' },
  { id: 'NA2', group: 'N', what: 'the record agrees with the stage on every tick, the stage\'s look keys as recorded (F85, F86): the turner lanes\' quick cell', check: test('seen-parity › the turner lanes'), by: 'v0.0.23 A' },
  { id: 'NA3', group: 'N', what: 'the same on the live lane\'s quick cell, the role-players\' frames held', check: test('seen-parity-live › the live lane'), by: 'v0.0.23 A' },
  { id: 'NA4', group: 'N', what: 'the same on the 28 pinned lanes, each held to its pin', check: test('seen-parity › the 28 pinned lanes (heavy)'), by: 'v0.0.23 A' },
  { id: 'NA5', group: 'N', what: 'the P-12 drawn has the rifle\'s stances in the record: low ready, high ready, aimed, the draw and the holster (F97)', words: W('2026-11-17', 'sidearm should have the same stances (low ready, high ready, aimed, etc) as the rifle'), check: test('seen › the P-12 drawn has the rifle\'s stances'), by: 'v0.0.23 A' },
  { id: 'NA6', group: 'N', what: 'the back of a man: no hands where his body hides them, the carrier\'s back panel, a rifle on his back whole, the anchors where the front\'s are', check: test('portrait-back'), by: 'v0.0.23 A' },
  { id: 'NA7', group: 'N', what: 'the record imports no scenario and loads first in its own process', check: test('import-order › people/seen.js'), by: 'v0.0.23 A' },
  { id: 'NA8', group: 'N', what: 'the P-12\'s admin read as it runs: the press check, the reload and the clearing, each tick by your action and your drawn frame (F97\'s act rows)', words: W('2026-11-17', 'sidearm should have the same stances (low ready, high ready, aimed, etc) as the rifle'), check: test('seen › the P-12\'s admin read as it runs'), by: 'v0.0.23 A' },
  // (B: the stage's knowledge, nobody before seen and the unknown house, F87 and F88)
  { id: 'NB1', group: 'N', what: 'nobody drawn before you have seen him: at GO on the live lane neither role-player drawn, each from his first sighting, then as last seen (F87, node half)', words: W('2026-11-17', 'we see what is in the rooms before entering them, this should not be the case when we start generating procedurally'), check: test('house-unseen › F87 (node half)'), by: 'v0.0.23 B' },
  { id: 'NB2', group: 'N', what: 'a load keeps the men seen before it (your sightings, the rooms you entered), and no other', check: test('house-unseen › a load keeps'), by: 'v0.0.23 B' },
  { id: 'NB3', group: 'N', what: 'a drawn house drawn only as you see into it: no cell known before in sight, none unknown again (F88, node half)', check: test('view-unknown › F88 (node half)'), by: 'v0.0.23 B' },
  { id: 'NB4', group: 'N', what: 'the rebuild at a load from the legs: a room entered known whole, the hall as walked', check: test('view-unknown › the rebuild at a load'), by: 'v0.0.23 B' },
  { id: 'NB5', group: 'N', what: 'familiar places as before: the set house, the named layouts, the live lane as set, the bay', check: test('view-unknown › familiar places'), by: 'v0.0.23 B' },
  { id: 'NB6', group: 'N', what: 'in the page: the drawn lane\'s rooms black (U1) until seen, the known cells\' sends under UPLOAD_MID_KB; the set house v0.0.22\'s picture to the byte; neither man drawn at GO (F87, F88)', check: test('ui-unknown'), by: 'v0.0.23 B' },
  // (C: the portraits, F89 to F91; the P-12's stances and the slung R-7's hang, F98 and F99)
  { id: 'NC1', group: 'N', what: 'the gun in his hands on the card in the board\'s ink, where the stage paints it: 2a armoured with a pistol, the hostage\'s hostile, 1a, at the three bands (F89)', words: W('2026-11-17', 'the portrait of the NPC holding a gun does not display the gun they are holding'), check: test('portrait-gun › F89 the gun reads on the house'), by: 'v0.0.23 C' },
  { id: 'NC2', group: 'N', what: '"Bang"\'s boards as starred until question 1: no ink, the gun hanging', check: test('portrait-gun › "Bang"'), by: 'v0.0.23 C' },
  { id: 'NC3', group: 'N', what: 'the warm set holds every face the fill gives, armoured with a pistol among them', check: test('portrait-warm'), by: 'v0.0.23 C' },
  { id: 'NC4', group: 'N', what: 'the card never contradicts the stage: never empty hands where it draws a gun, the take-in\'s read in the words (F90)', check: test('portrait-agrees › F90'), by: 'v0.0.23 C' },
  { id: 'NC5', group: 'N', what: 'the man as he stands: aimed at you, kneeling, sitting, hands up, each its own doll; from behind and side on (F90)', words: W('2026-11-17', 'the portraits need to be more dynamic and show us what we would be seeing, including what they are holding'), check: test('portrait-dynamic › on the live lane'), by: 'v0.0.23 C' },
  { id: 'NC6', group: 'N', what: 'turned away, drawn from behind; side on, the head turned', check: test('portrait-dynamic › a role-player turned'), by: 'v0.0.23 C' },
  { id: 'NC7', group: 'N', what: 'you on the C card as in a mirror: kneeling, prone, a G-11, the P-12', words: W('2026-11-15', 'the I and C menu preview of the character should show the currently worn gear'), check: test('portrait-dynamic › you on the C card'), by: 'v0.0.23 C' },
  { id: 'NC8', group: 'N', what: 'the marks where the sim put them whatever the pose and facing, "Bang"\'s unmoved', check: test('portrait-marks'), by: 'v0.0.23 C' },
  { id: 'NC9', group: 'N', what: 'the card\'s cost: a posed doll under 4 ms × k, one new doll a frame, every doll warmed or a variant (F91)', check: test('portrait-perf'), by: 'v0.0.23 C' },
  { id: 'NC10', group: 'N', what: 'the P-12\'s stances drawn on the stage, the doll and the card; the rifle\'s frames as before (F98)', words: W('2026-11-17', 'sidearm should have the same stances (low ready, high ready, aimed, etc) as the rifle'), check: test('portrait-p12 › F98'), by: 'v0.0.23 C' },
  { id: 'NC11', group: 'N', what: 'the R-7 hanging on its sling while the pistol is up, never through the arms, swinging with the walk (F99)', words: W('2026-11-17', 'Holding the sidearm with the rifle dangling should be redrawn'), check: test('portrait-p12 › F99'), by: 'v0.0.23 C' },
  { id: 'NC12', group: 'N', what: 'in the page: the user\'s saves of 4028068471, the gun in the board\'s ink on 2a\'s and the hostage\'s cards, the live 2a\'s card his record', check: test('ui-portrait'), by: 'v0.0.23 C' },
  // (D: the carried fixes, F92 to F96)
  { id: 'ND1', group: 'N', what: 'the walk in named along #1\'s path: "Q to the door, S through it, then D", never into the wall beside the doorway', check: test('house-walkwords › the walk-in words on every room'), by: 'v0.0.23 D' },
  { id: 'ND2', group: 'N', what: 'the walk-in line re-read the tick your leg changes (F93)', check: test('house-walkkey › the walk-in line names the leg'), by: 'v0.0.23 D' },
  { id: 'ND3', group: 'N', what: 'the reading recruit and private through every door by the words, 80 lanes (F92, F93)', check: test('house-reader'), by: 'v0.0.23 D' },
  { id: 'ND4', group: 'N', what: 'a room passed at its open door taught as one: "You stood at an open door. …"', check: test('house-one-passed › the honest recruit on 48213'), by: 'v0.0.23 D' },
  { id: 'ND5', group: 'N', what: 'T names the key it will not press: "6: yours. T never shoots.", the row pulsed', check: test('ui-t-names'), by: 'v0.0.23 D' },
  { id: 'ND6', group: 'N', what: 'the goal line whole at three lines, the live lane\'s its own, every PA page whole (F96)', check: test('ui-goal-clamp'), by: 'v0.0.23 D' },
  { id: 'ND7', group: 'N', what: 'Again: the short brief, LOAD 6.1 s after the fill, not 23 (F95)', check: test('house-again-brief › Again of the same lane'), by: 'v0.0.23 D' },
  { id: 'ND8', group: 'N', what: 'the Tests list opens on the scene played last, else "Stack and clear"', check: test('tests-focus'), by: 'v0.0.23 D' },
  { id: 'ND9', group: 'N', what: 'the keys card leads with the shoot house\'s keys in the house', check: test('keys-house'), by: 'v0.0.23 D' },
  { id: 'ND10', group: 'N', what: 'the picker\'s note and the Kit line in plain words', check: test('house-words › the house\'s picker note'), by: 'v0.0.23 D' },
  { id: 'ND11', group: 'N', what: 'the Kit line says how to choose', check: test('ui-loadout › the Kit screen says'), by: 'v0.0.23 D' },
  { id: 'ND12', group: 'N', what: 'the instructor agrees with the drill: the #2 low, never "muzzle up" over him', check: test('house-words › the instructor agrees with the drill'), by: 'v0.0.23 D' },
  { id: 'ND13', group: 'N', what: 'the live lane briefed as live, a sterile check on the floor before LOAD (F94)', check: test('house-live-brief › the live lane is briefed as live'), by: 'v0.0.23 D' },
  { id: 'ND14', group: 'N', what: 'F94 from the fill to the card on 28 live lanes', check: test('house-live-brief › F94 from the fill to the card'), by: 'v0.0.23 D' },
  { id: 'ND15', group: 'N', what: 'a save inside the sterile check carries on to LOAD byte for byte', check: test('house-sterile-save'), by: 'v0.0.23 D' },
  { id: 'ND16', group: 'N', what: 'the door rows say what they do: "Look: behind the door", "check" on the row, the corner the open door hides on its hover', words: W('2026-11-17', 'i don\'t know what the "look behind the door" option does'), check: test('house-words › every Watch and Look row'), by: 'v0.0.23 D' },
  { id: 'ND17', group: 'N', what: 'the spot a Watch or Look row names lit on the floor under the cursor', words: W('2026-11-17', 'same for the watch the near right corner etc'), check: test('ui-hot-lit'), by: 'v0.0.23 D' },
  { id: 'ND18', group: 'N', what: 'two v0.0.22 saves load under the new rules: the walk words, passWhy \'door\', the sterile check begun', check: test('game-upgrade › v0.0.23 (its build sheet §2 step 4)'), by: 'v0.0.23 D' },
  { id: 'ND20', group: 'N', what: 'the hostage line on safe gives T the thumb, never a dead end (found by F92)', check: test('house-hostage-safe'), by: 'v0.0.23 D' },
  { id: 'ND19', group: 'N', what: 'the instructor walks to the catwalk, never jumps there (FH-10)', check: later('v0.0.24: not taken in v0.0.23 (its build sheet item 19, question 13: built only with every pin\'s ticks held; not measured this round)') },
  // (E: the samples and the To score page; no gauge)
  { id: 'NE1', group: 'N', what: 'every look set this round and the next depend on, made first, and one "To score" list of every open set with its default', words: W('2026-11-17', 'the portraits need to be more dynamic and show us what we would be seeing, including what they are holding'), check: test('gallery-open'), by: 'v0.0.23 E' },
  { id: 'NE2', group: 'N', what: 'the portraits\' sets shot whole, their defaults views of their sets, the candidates C\'s tables', check: test('samples-portrait'), by: 'v0.0.23 E' },
  { id: 'NE3', group: 'N', what: 'the anywhere round\'s two sets (a floating body\'s height, mag boots and the anchors) shot whole', check: test('samples-void'), by: 'v0.0.23 E' },
  ...['portrait-gun', 'house-unknown', 'portrait-light', 'portrait-pose', 'portrait-facing', 'pistol-stances', 'portrait-suit', 'truth-cards', 'float-look', 'mag-boots'].map((set, i) => ({ id: `NE4${String.fromCharCode(97 + i)}`, group: 'N', what: `the samples to score: ${set}`, check: { kind: 'sample', ref: set } })),
]);

/** Group C: one row a gauge, F1 to GAUGE_LAST. */
export const GAUGE_ROWS = Object.freeze(Array.from({ length: GAUGE_LAST }, (_, i) => `F${i + 1}`).map(F => ({ id: `C${F}`, group: 'C', what: GAUGE_WHAT[F], check: gauge(F), ...(homeOf(F)?.role ? { by: `v0.0.21 ${homeOf(F).role}` } : {}) })));
/** Every row: the list and the gauges. */
export const ALL = Object.freeze([...DONE, ...GAUGE_ROWS]);

// ---- the resolvers ----

const testsDir = path.join(root, 'tests');
const cache = new Map();
/** A test file's cases' names (its default export loaded), or null when the file is not there. */
export async function caseNames(file) {
  if (cache.has(file)) return cache.get(file);
  const p = path.join(testsDir, `${file}.test.mjs`);
  let out = null;
  if (existsSync(p)) { const m = await import(pathToFileURL(p).href); out = (m.default ?? []).map(c => c.name); }
  cache.set(file, out);
  return out;
}
/** A test ref resolved: { ok, why } ('file › words': the file, and a case whose name holds the words). */
export async function resolveTest(ref) {
  const [file, words = null] = String(ref).split(' › ');
  const names = await caseNames(file.trim());
  if (!names) return { ok: false, why: `no tests/${file}.test.mjs` };
  if (!names.length) return { ok: false, why: `${file}: no case` };
  if (words && !names.some(n => n.includes(words.trim()))) return { ok: false, why: `${file}: no case named "${words}"` };
  return { ok: true, why: words ? `${file} › "${words}"` : `${file} (${names.length} cases)` };
}
/** A gauge resolved: { ok, why }: named in its home file and enforced there (see the header). */
export async function resolveGauge(id) {
  const h = homeOf(id);
  if (!h) return { ok: false, why: `${id}: no home` };
  const p = path.join(testsDir, h.file);
  if (!existsSync(p)) return { ok: false, why: `${id}: no tests/${h.file}${h.role ? ` (v0.0.21 role ${h.role})` : ''}` };
  const src = readFileSync(p, 'utf8');
  if (!new RegExp(`['"\`]${id}\\b`).test(src) && !new RegExp(`\\b${id}\\b`).test(src)) return { ok: false, why: `${id}: not named in ${h.file}` };
  // (an exported set whose name ends ENFORCED holding it)
  if (h.file.endsWith('.mjs') && !h.file.endsWith('.test.mjs')) {
    const m = await import(pathToFileURL(p).href);
    for (const [k, v] of Object.entries(m)) if (/ENFORCED$/.test(k) && (v instanceof Set ? v.has(id) : Array.isArray(v) && v.includes(id))) return { ok: true, why: `${h.file} ${k}` };
  }
  // (a row written enforced: { id: 'F50', …, enforced: true } on one line)
  if (src.split('\n').some(l => l.includes(`id: '${id}'`) && /enforced: true/.test(l))) return { ok: true, why: `${h.file}, its row enforced` };
  // (the case that enforces it)
  if (h.by) { const t = await resolveTest(h.by); return t.ok ? { ok: true, why: `enforced by ${t.why}` } : { ok: false, why: `${id}: ${t.why}` }; }
  return { ok: false, why: `${id}: not enforced in ${h.file}` };
}
/** A moment resolved: the house's in tests/moment-house.mjs MOMENTS with its recipe, or another scene's moment test file. */
export async function resolveMoment(ref) {
  const p = path.join(testsDir, 'moment-house.mjs');
  if (existsSync(p)) {
    const { MOMENTS } = await import(pathToFileURL(p).href);
    const m = (MOMENTS ?? []).find(x => x.id === ref);
    if (m) return m.start && m.bot ? { ok: true, why: `moment-house.mjs ${ref}: ${m.title}${m.skip ? ` (${m.skip})` : ''}` } : { ok: false, why: `${ref}: no recipe` };
  }
  const t = await resolveTest(`moment-${ref}`);
  return t.ok ? t : { ok: false, why: `${ref}: no moment` };
}
/** A sample set resolved: samples/<set>/sample.json. */
export function resolveSample(set) {
  const p = path.join(root, 'samples', set, 'sample.json');
  return existsSync(p) ? { ok: true, why: `samples/${set}/sample.json` } : { ok: false, why: `no samples/${set}/sample.json` };
}
/**
 * The gauges the last heavy run left red (enforced in their file, so WIRED, but not met): { [id]: { run, value, target } }. The lead
 * writes it from each quiet-machine run of the heavy suites and empties an entry once its gauge is met; a gauge is never taken
 * out of its file's ENFORCED to leave this list (never loosened).
 */
export const OPEN_GAUGES = Object.freeze({
  // (F14 emptied by v0.0.21's integration: house-flawless-keys on the integrated tree (v0.0.20's lane due in), 2026-11-16, MET:
  // past 585 s 0, the fuzz's longest 585.0 s, every lane to its card)
  F70: { run: "house-ladder's sweep, v0.0.21 C's run of 2026-11-16 (40 set seeds)", value: 'the boot recruit a GO at his own standard on 25% (his men\'s pars); the sergeant a NO-GO at operator on 30%', target: 'GO at own 90%, NO-GO at the next 80%' },
  F71: { run: "moment-house's node part, v0.0.21 C's run of 2026-11-16", value: 'the private by the keys from the brief 7.50 real minutes', target: '5 to 7 real minutes; dead air under 20%' },
  F73: { run: "render-bench's house benches, v0.0.21 D's run of 2026-11-16 (this Mac, 60 Hz)", value: 'house-kit 229.8 KB uploaded at 7.67 s, house-live 238.2 KB at 7.25 s (the figures\' bands painted mid-lane)', target: `no upload over 64 KB after GO + 1 s` },
  // (v0.0.22's integration, its full run of 2026-11-16 on the merged tree (JOBS=3, the Mac shared): the new gauges red. F25 on the
  // kit's second slice (B's: the mixed loadout's keys recruit on 1222 after a G-11 slipped at his feet, 3.30 s) emptied by v0.0.22's
  // fixer: your cue ends his stack-up at his stack point (bundle.js), house-flawless-kit2 green on the full run of 2026-11-18
  // (JOBS=4) and fixer-v022's F25 case 2.25 s, 0.7 s, 1 s on 1222; F25 never left its file's ENFORCED)
  F76: { run: "house-drawn8's sweep, A's run at the A and D review, 2026-11-16 (printed until the lead's quiet run)", value: 'the small room 76% (68% as room 1 of layout C: roomBookOf books #1 alone), the centre 73%, the narrow 85%, the long 89%', target: 'each room within its par on 90%, every lane at most 60 s, the mean at most 1.10 × the summed par' },
  F80: { run: "house-flawless-live's drawn case, the v0.0.22 integration's full run of 2026-11-16 (42 lanes)", value: 'F38 to F43 met, 84 posts valid; F44\'s band: the tier one painted on 3 of 7 drawn lanes, the recruit 6 of 7', target: 'F44\'s bands on the drawn slice (the tier one 5%)' },
});

/** A row resolved: { row, status: 'WIRED' | 'OPEN' | 'USER' | 'ANSWERED' | 'LATER' | 'GAP', why } (see the header). */
export async function resolveRow(row) {
  const c = row.check;
  if (c.kind === 'user') return { row, status: row.answered ? 'ANSWERED' : 'USER', why: row.answered ? `answered ${row.answered.date}: "${row.answered.text}"` : `pending: ${c.ref}` };
  if (c.kind === 'later') return { row, status: 'LATER', why: c.ref };
  const r = c.kind === 'test' ? await resolveTest(c.ref) : c.kind === 'gauge' ? await resolveGauge(c.ref) : c.kind === 'moment' ? await resolveMoment(c.ref) : c.kind === 'sample' ? resolveSample(c.ref) : { ok: false, why: `unknown kind ${c.kind}` };
  if (!r.ok) return { row, status: 'GAP', why: r.why };
  const open = c.kind === 'gauge' ? OPEN_GAUGES[c.ref] : null;
  return open ? { row, status: 'OPEN', why: `${c.ref} red at ${open.run}: ${open.value} (target ${open.target}); ${r.why}` } : { row, status: 'WIRED', why: r.why };
}
