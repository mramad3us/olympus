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
// gauge, F1 to F73. Pure data and two resolvers.
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
});
export const GAUGE_LAST = 73;
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
  { id: 'J5', group: 'J', what: 'room plans derived and checked against the authored', check: later('v0.0.22 (D9, with the second chunk set)') },
  { id: 'J6', group: 'J', what: 'a clean room counts toward the career\'s rung', check: test('drill-reps'), by: 'v0.0.21 C' },
  { id: 'J7', group: 'J', what: 'the no-stop zone a kind any plan declares', check: later('v0.0.22 (D9\'s zone kinds)') },
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
