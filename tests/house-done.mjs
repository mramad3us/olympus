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
// gauge, F1 to GAUGE_LAST (F137 at v0.0.25; F149 at v0.0.26's last merge; F169 at v0.0.27's, E's). Pure data and two resolvers.
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
  // (F59 "every line heard" to v0.0.23; from v0.0.24 no line is voiced (the user, 2026-11-19: "forget voice synthesis, no voices."),
  // so its successor is every line shown, a bubble at its speaker: bubbles' lanes in node, the heavy case; flawless-sound.mjs and
  // house-voiced went with the synthesis)
  { from: 59, to: 59, file: 'bubbles.test.mjs', by: 'bubbles › the house\'s lanes in node at 1600 × 900 (F59' },
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
  // (v0.0.24, its build sheet §8 with every number from its F97 read three higher (v0.0.23 took F97 to F99): one row a gauge, its
  // home the suite that names it and the case that enforces it; v: the anywhere note's V number; owner: the role (or roles) that
  // built it; files: every suite its row in the sheet names; when: 'at once' or the ship rule it waits on. tests/void-done.mjs
  // VOID_GAUGES is these rows filtered, never a second list (E's merge, the sheet's §0 item 29))
  ...[
    [100, 0, 'stage 0', 'env-noregress.test.mjs', 'env-noregress › the house\'s quick cell'],
    [101, 1, 'A', 'anchor-table.test.mjs', 'anchor-table › on a coasting deck the anchor table by footing'],
    [102, 2, 'A', 'footing.test.mjs', 'footing › footing (F102)'],
    [103, 3, 'stage 0, A', 'legs-one.test.mjs', 'legs-one › legs-one (F103): no module of src calls tractionOf'],
    [104, 4, 'A, B', 'anchor-table.test.mjs, footing.test.mjs', 'anchor-table › the mag boots as worn kit'],
    [105, 5, 'A', 'void-house.test.mjs', 'void-house › void-house (F105): on ship-coast', 'at once (heavy)'],
    [106, 6, 'B', 'freefall.test.mjs', 'freefall › push-off (F106'],
    [107, 7, 'B', 'freefall.test.mjs', 'freefall › drift (F107)'],
    [108, 8, 'B', 'freefall.test.mjs', 'freefall › the grab (F108'],
    [109, 9, 'B', 'impact.test.mjs', 'impact › impact bands over 2,000 falls a band (F109'],
    [110, 10, 'B', 'recoil-float.test.mjs', 'recoil-float › a round\'s push J / m and spin J × 0.45 / I (F110'],
    [111, 11, 'B', 'brass-free.test.mjs', 'brass-free › a case at 0 G flies to the first face'],
    [112, 12, 'C', 'grav-events.test.mjs', 'grav-events › F112: a burn\'s events to the tick'],
    [113, 13, 'C, B', 'grav-save.test.mjs, freefall.test.mjs', 'grav-save › F113'],
    [114, 14, 'D', 'scene-anchors.test.mjs, anchors-nodead.test.mjs, anchors-save.test.mjs', 'scene-anchors › scene-anchors (F114)', 'at the scene\'s ship rule'],
    [115, 15, 'stage 0', 'syntax.test.mjs', 'syntax › rules: no quiet gravity or grip'],
    [116, 16, 'A, D', 'gear-void.test.mjs', 'gear-void › gear-void (F116, the record)'],
    [117, 17, 'every role, D', 'scene-anchors.test.mjs, house-tick-budget.test.mjs', 'scene-anchors › scene-anchors (F117)'],
    [118, 18, 'D', 'scene-burn.test.mjs, burn-nodead.test.mjs', 'scene-burn › scene-burn (F118)', 'at its ship rule'],
    [119, 19, 'stage 0', 'env-clock.test.mjs', 'env-clock › env-clock (F119): off Mars'],
    [120, null, 'E', 'flawless-looks.mjs', null],
    [121, null, 'E', 'flawless-looks.mjs', null],
    [122, null, 'E', 'flawless-looks.mjs, ui-truth-cards.test.mjs', null],
    [123, null, 'E', 'looks-applied.test.mjs', 'looks-applied › F123 every pick'],
    // (v0.0.25, "Hold to hold", its build sheet §8: F124 to F137 homed at D's merge, the round's last; v the sheet's item, null;
    // tests/wreck-done.mjs WRECK_GAUGES is these rows filtered from here on)
    [124, null, 'stage 0', 'env-noregress.test.mjs', 'env-noregress › env-noregress, quick (F100, F124): the bay at 23:00'],
    [125, null, 'C', 'scene-zerocqb.test.mjs, zerocqb-nodead.test.mjs, zerocqb-save.test.mjs', 'scene-zerocqb › the Wreck to the card (F125', 'at the Tests menu\'s ship rule'],
    [126, null, 'C', 'zerocqb-anchor.test.mjs', 'zerocqb-anchor › F126: no round of the honest sergeant'],
    [127, null, 'B', 'zerocqb-middle.test.mjs', 'zerocqb-middle › zerocqb-middle (F127): the open middle is floating'],
    [128, null, 'B', 'zerocqb-hatch.test.mjs', 'zerocqb-hatch › zerocqb-hatch (F128): #1 anchored'],
    [129, null, 'B', 'zerocqb-two.test.mjs', 'zerocqb-two › zerocqb-two (F129): the brace from your transit'],
    [130, null, 'D', 'zerocqb-faces.test.mjs, ui-zerocqb.test.mjs', 'zerocqb-faces › F130 six faces agree, the sim'],
    [131, null, 'C', 'zerocqb-aft.test.mjs', 'zerocqb-aft › F131: the sergeant by T'],
    [132, null, 'C', 'zerocqb-quick.test.mjs, zerocqb-flawless.test.mjs', 'zerocqb-quick › F132 (quick)'],
    [133, null, 'C, D', 'zerocqb-tick.test.mjs, ui-zerocqb.test.mjs', 'zerocqb-tick › F133 (the tick\'s half, quick)'],
    [134, null, 'C', 'zerocqb-pars.test.mjs', 'zerocqb-pars › F134 (quick)'],
    [135, null, 'A', 'zerocqb-transit.test.mjs, wreck-place.test.mjs', 'zerocqb-transit › one deck at a time'],
    [136, null, 'C, D', 'zerocqb-words.test.mjs, ui-zerocqb.test.mjs', 'zerocqb-words › F136 (the sim\'s half)'],
    [137, null, 'A, D', 'wreck-known.test.mjs, ui-zerocqb.test.mjs', 'wreck-known › from deck 5 nothing of deck 6'],
    // (v0.0.26, "Bang, then go", its build sheet §8: F138 to F149 homed at C's merge, the round's last; tests/breach-done.mjs
    // BREACH_GAUGES is these rows filtered from here on)
    [138, 1, 'B', 'scene-breach.test.mjs, breach-nodead.test.mjs, breach-save.test.mjs', 'scene-breach › F138 (quick): the four draws forced', 'the Tests menu\'s ship rule (F138 and F147 green)'],
    [139, 2, 'B', 'breach-window.test.mjs', 'breach-window › F139: the bang buys the room'],
    [140, 3, 'B', 'breach-window.test.mjs', 'breach-window › F140: the slow stack and the held door'],
    [141, 5, 'A', 'breach-choice.test.mjs', 'breach-choice › breach-choice: the table chooses'],
    [142, 6, 'A', 'breach-shock.test.mjs', 'breach-shock › breach-shock: a shocked man starts nothing'],
    [143, 6, 'A, C', 'breach-look.test.mjs, ui-breach.test.mjs', 'breach-look › F143 (sim): on "Bang, then go"'],
    [144, 7, 'A', 'breach-challenge.test.mjs', 'breach-challenge › breach-challenge: a man frozen, and a man in cover'],
    [145, 8, 'B', 'breach-window.test.mjs, breach-wash.test.mjs', 'breach-window › F145 (one number)'],
    [146, 9, 'A, C', 'breach-search.test.mjs, ui-breach.test.mjs', 'breach-search › breach-search: belief until the search'],
    [147, 15, 'stage 0', 'env-noregress.test.mjs', 'env-noregress › env-noregress, quick (F100, F124): the bay at 23:00'],
    [148, 11, 'B, C', 'breach-tick.test.mjs, ui-breach.test.mjs', 'breach-tick › F148 (the tick\'s half, quick)'],
    [149, 14, 'B, C, D', 'breach-words.test.mjs, ui-breach.test.mjs, carried-v026.test.mjs', 'breach-words › F149 (the sim\'s half)'],
    // (v0.0.27, "Away the boarding party", its build sheet §8: F150 to F169 homed at E's merge, the round's last (by the integration,
    // as lead.md asked); tests/collar-done.mjs COLLAR_GAUGES is these rows filtered from here on)
    [150, 19, 'stage 0, every role', 'env-noregress.test.mjs, ship-seam.test.mjs', 'ship-seam › the source scan (F150'],
    [151, 3, 'stage 0, D', 'hauler-place.test.mjs, hauler-plans.test.mjs', 'hauler-place › the Patient Mule validates'],
    [152, 2, 'D', 'collar-override.test.mjs, collar-nodead.test.mjs', 'collar-override › F152: the override\'s roll'],
    [153, 1, 'D', 'collar-flow.test.mjs, collar-fallback.test.mjs, collar-save.test.mjs, collar-nodead.test.mjs', 'collar-fallback › F153: two of the four down', 'the Tests menu\'s ship rule (F150, F153, F155 and F165 green)'],
    [154, 7, 'B', 'collar-real.test.mjs', 'collar-real › your frangible pair on a pirate (F154)'],
    [155, 10, 'A, D', 'collar-flow.test.mjs, collar-nodead.test.mjs', 'collar-flow › F155: a round of yours'],
    [156, 6, 'A', 'collar-choice.test.mjs, carried-v027.test.mjs', 'collar-choice › collar-choice: each doctrine\'s table'],
    [157, 18, 'D', 'collar-nodead.test.mjs', 'collar-nodead › F157 (heavy)'],
    [158, 6, 'A', 'collar-blind.test.mjs', 'collar-blind › collar-blind: blind fire only from behind his cover'],
    [159, 11, 'A', 'collar-side.test.mjs', 'collar-side › collar-side: the side\'s roll comes only'],
    [160, 12, 'B, D', 'collar-holes.test.mjs, collar-flow.test.mjs', 'collar-holes › 500 misses each way (F160)'],
    [161, 13, 'B', 'collar-flash.test.mjs', 'collar-flash › 200 throws through each compartment\'s hatch'],
    [162, 4, 'C', 'collar-team.test.mjs', 'collar-team › the holders go through the lock\'s inner hatch'],
    [163, 8, 'B, C', 'collar-knock.test.mjs, collar-team.test.mjs', 'collar-knock › struck on a pause'],
    [164, 9, 'B, C, A', 'collar-aid.test.mjs, collar-team.test.mjs, collar-choice.test.mjs', 'collar-aid › the row "Tourniquet" is offered exactly'],
    [165, 16, 'D, E, every role', 'collar-tick.test.mjs, look-sealed.test.mjs, ui-collar.test.mjs', 'collar-tick › F165 (the tick\'s half)'],
    [166, 1, 'D, C, A', 'collar-words.test.mjs, ui-collar.test.mjs', 'collar-words › F166: the boarding\'s words as data'],
    [167, null, 'the lead (D builds)', 'collar-balance.test.mjs', 'collar-balance › F167 (heavy)'],
    [168, 16, 'A, E', 'collar-look.test.mjs, ui-collar.test.mjs', 'collar-look › F168 (sim)'],
    [169, 17, 'D', 'hauler-plans.test.mjs, collar-flow.test.mjs, zerocqb-quick.test.mjs', 'hauler-plans › the hauler\'s derived plans'],
  ].map(([n, v, owner, files, by, when = 'at once']) => ({ from: n, to: n, file: files.split(', ')[0], role: owner, v, owner, files, when, ...(by ? { by } : {}) })),
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
  F56: 'pars a sheet can meet', F57: 'nothing over the room', F58: 'the debrief and the replay', F59: 'every line shown (heard to v0.0.23: no voice from v0.0.24)', F60: 'the busiest tick under 2 ms',
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
  // (v0.0.24: its sheet's F97 to F120, three higher)
  F100: 'nothing moves at Mars and the Wheel: every pin, golden, save, moment 2\'s walk and scene digest at 1,000 ticks, byte for byte through A to D',
  F101: 'WEAPONS §7.8\'s table by footing, the pull\'s formula on the anchor\'s recovery, the anchoring by Zero-g',
  F102: 'the roller\'s footing entry: exactly one below 0.2 G on a roll whose uses meet it, none at 0.3 G and up',
  F103: 'one legs helper; the boots\' grip on locked boots', F104: 'the boots: lock 400 ms and release 300 ms within a tick; 0.50 m/s, no run; a save on locked boots byte for byte; the #2 locks with you',
  F105: 'never a silent stall at 0 G; the steel copy cleared by T with F1, F2, F7, F26 held', F106: 'push-off speeds within 0.005 m/s; the error and tumble by points missed',
  F107: 'drift constant to 1e-6 over 200 ticks; the keys do nothing floating; landing at 1.5 m/s or less', F108: 'the grab\'s bands; it stops a tumble; L a grab only where there is nothing to fight',
  F109: 'impact bands over 2,000 falls', F110: 'recoil floating: push and spin a round, boots keep none and a tenth, the aim lost past the arc',
  F111: 'brass at 0 G: two segments, never through a wall, caseAt ms-exact; Mars\'s bytes', F112: 'events to the tick; the thrown speeds; couched and boots safe; a skip refused while a brace is pending',
  F113: 'a save at each phase of an event, mid-drift, mid-push, mid-grab, byte for byte', F114: 'test-anchors to the card on every sheet; 40 seeds × five sheets no dead end; the fuzz\'s dead ends 0; nine saves',
  F115: 'the quiet defaults refused', F116: 'the gear record and the figure agree on the boots and the anchor at every tick', F117: 'house-tick-budget unmoved; Well A\'s busiest tick under 2 ms × k',
  F118: 'test-burn secured in time on every seed; no dead end; a thrown body\'s card equals impactOf', F119: 'off Mars: a sol at Phobos and aboard Testudo with no throw; Melas byte for byte',
  F120: 'the card\'s facing as scored, the marks on the target\'s plane scaled by the cosine side on',
  F121: 'light and the jamb: lit rooms and "Bang" byte for byte; never below LIGHT_FLOOR_K; the hidden share drawn as the jamb; no doll repainted by light or cover',
  F122: 'the truth cards: each engaged man\'s card equals seenOf at your first round\'s tick, in the scored layout', F123: 'every scored pick drawn as picked, every unscored set at its default',
  // (v0.0.25: its sheet's §8, F124 to F137, tests/wreck-done.mjs's rows)
  F124: 'nothing moves: every v0.0.24 pin byte for byte, but E\'s two re-records, each cell with its cause',
  F125: 'the Wreck to the card on every sheet; 40 seeds × six sheets and the fuzz with no dead end; nine saves byte for byte',
  F126: 'anchor before you fire: no honest round floating; every first round\'s anchor on the card; every fuzz floating round faulted',
  F127: 'hold to hold: no honest body in the open middle over OPEN_MS; every fuzz case faulted; a floating body always has a face to push from',
  F128: 'the hatch: #1 anchored from his transit\'s first tick; never in a coaming over 1 s with nothing to shoot; F4 on the bulkhead hatches',
  F129: 'the #2\'s brace and cue: the brace held from your transit to your plant or 0.2 s after your first round; his entry within 3 s; his boots with yours',
  F130: 'six faces agree: every board\'s and body\'s face the same in the sim, the stage and the card at every tick it is drawn',
  F131: 'feet aft: every honest lane meets its onset, every honest marine booted on the deck at it; a floating body thrown at fallOf\'s speed and carded; no skip while pending',
  F132: 'the house\'s F1, F2, F6, F7, F9, F10, F13, F14, F15, F17, F24, F25, F26 on the Wreck\'s lanes',
  F133: 'the Wreck\'s busiest tick under 2 ms × k; ?bench=wreck within TECH §16.1; the deck switch with no frame over 33 ms and nothing sent',
  F134: 'each sheet\'s T meets its own par on the Wreck on 48213 and two more seeds',
  F135: 'one deck at a time: crossHatch the only deck change, nobody between the decks, the actors list never re-made; a save mid-transit carries on',
  F136: 'every line of the Wreck a text bubble at its speaker, none voiced, none overlapping at 1024 × 768 and 1600 × 900',
  F137: 'nothing drawn before seen in the Wreck, and nothing of the other deck in the picture',
  // (v0.0.26: its sheet's §8, F138 to F149, tests/breach-done.mjs's rows)
  F138: 'the scene to its card on every sheet and draw, by T, the keys and the fuzz; no dead end; nine saves byte for byte',
  F139: 'the bang buys the room: with the entry on the bang, no role-player\'s round before #1\'s first; no casualty from the corporal up over 20 seeds (the recruit\'s and the private\'s printed)',
  F140: 'the slow stack and the held door: T13 reprinted from the game by the bots\' late; the held man blinded by every bang through his door (0 unblinded); quiet held, his first round printed; the 0.5 s cell 100% from the corporal up',
  F141: 'the table chooses: every change of a man\'s state is choiceOf\'s, the shock\'s, the give\'s or the fall\'s, never a card; no roll for a calm or under-fire man; a friend seen falling +10 and -0.1 exactly once',
  F142: 'the shock: a shocked man starts nothing; blind only within 60° of his facing; DAZED exactly while shocked',
  F143: 'seen, never told: the stage\'s frame, the card\'s pose and the plaque\'s word agree with one map at every drawn tick, on both lanes',
  F144: 'the challenge: a frozen or covered man challenged within 6 m, seen or heard, gives on its end tick; never a fighting man; no round after a give',
  F145: 'one number: the window rows, the run sheet, the wash and the tests read bangWindowOf only, equal to the sim to the tick',
  F146: 'belief, then truth: no truth mark before a search\'s end or Stop; a halted search leaves belief; a searched card equals hitMarks\' truth',
  F147: 'nothing else moves: every v0.0.25 pin byte for byte (the scenes at 1,000 ticks, the house\'s pins, the saves, moment 2\'s walk, the goldens, the steel copy), but a house-live-pin cell moved by the DAZED read, with its cause',
  F148: 'cost: the scene\'s busiest tick under 2 ms × k (the least of three); no doll painted and no figure band uploaded after the brief\'s cut',
  F149: 'every line a text bubble at its speaker, none voiced, none overlapping at 1024 × 768 and 1600 × 900',
  // (v0.0.27: its sheet's §8, F150 to F169, tests/collar-done.mjs's rows)
  F150: 'nothing else moves: every v0.0.26 pin byte for byte (house-pin 24, house-pin-drawn 16, house-live-pin 4, breach-pin 4, every scene at 1,000 ticks, the saves) through the registry, K1, the memos and every \'real\' guard; zerocqb-pin and test-zerocqb\'s digest moved only by K3, each cell\'s cause named',
  F151: 'the deck valid and authored once: the grid, the hatches, the fixtures, the posts and crew spots through spotCheck, every stand id in the house\'s form with a role, the materials each a WALLS row, a golden hash; the plans fresh',
  F152: 'the override: one splash, 120 to 300 s, the holdouts alerted at its end and not before, on every sheet and seed of the sweep',
  F153: 'the scene to its card (secured, fallen back, down, time) on every sheet and both types, by T, the keys and the fuzz; no dead end, after a knock too; the fall back ended within 60 s and its splash; ten saves byte for byte',
  F154: 'one rule, real: every strike rated once, on the struck man\'s own body, by the round\'s own load; 0 marking rounds; the ledger\'s verdict equals fatalWhy of the body',
  F155: 'hors de combat: no round by Four or a holder at a man with hands up, down or unarmed; the honest bots 0; every fuzz round at one faulted \'protected\'',
  F156: 'they choose: every change of a defender\'s state is his doctrine\'s table, the shock\'s, the give\'s, the fall\'s, the rise\'s or the side\'s; a crewman fires 0 rounds; no dash on a floor that does not hold',
  F157: 'every choice seen: over 40 honest seeds, fight, cover, freeze and give each met on at least one lane; blind and flee printed, by sheet and type',
  F158: 'blind fire: only from cover with a marine in his compartment, no take-in, no sighting, BLIND_FIRE_MOD on every round; FIRING BLIND exactly while st \'blind\'',
  F159: 'the side gives up only at 35% standing or fewer, rolled at the crossing and every 60 s at 0.5, final; the rate printed',
  F160: 'holes: 0 marine rounds through a bulkhead or the hull; every miss met by one face once, no onward round; every through round a defender\'s ball; the card\'s counts equal the record\'s',
  F161: 'the G-11 at 0 G lands inside the compartment it is thrown into, at most 1.5 m back off the face it meets, never past the hatch\'s plane; 60 in it, 20 through an open hatch only; at FREE_G_MS2 and above v0.0.26\'s landings to the byte',
  F162: 'the holders: 0 rounds through a marine, 0 at a man outside their sector, never off their posts; their words bubbles at them',
  F163: 'the knock: you are down exactly while your stance is; no act of yours begins while down; "On your feet." and "Get up" after it; Four covers you meanwhile',
  F164: 'the care: the Tourniquet offered exactly while tourniquetOf is non-null; done, that bleed stopped and cared \'tourniquet\'; the NPCs by the same rule; the card\'s outcomes equal boardingCare',
  F165: 'cost: the busiest tick (4 marines, 6 defenders, blind fire and a push-off in flight) under 2 ms × k, least of three, a time-only red run again alone (K7); no rifle-pool eviction with 8 aiming; no figure band painted after the brief\'s cut',
  F166: 'every line a bubble at its speaker (the leader, the AR, Four, the defenders, the intercom), none voiced, none overlapping at 1024 × 768 and 1600 × 900',
  F167: 'balance (stated before any build; red is a question for the user, never a constant tuned): from the corporal up by T, 20 seeds a sheet, the deck secured on 17 or more and your body down for good on 1 or fewer; the recruit\'s and the private\'s printed',
  F168: 'seen, never told: FIRING BLIND, RUNNING AWAY, DAZED, COWERING, HANDS UP, DOWN at 0 G: the stage\'s frame, the card\'s pose and the plaque\'s word agree at every drawn tick',
  F169: 'Four through every hatch on his cue: his stack point within 0.9 m of yours; past the threshold within F25\'s 3 s on the boarding; F17 and F25 met on the Wreck\'s 18 lanes (out of WRECK_OPEN)',
});
// (v0.0.23's integration, the stage-0 lead's plan: F97 to F99, the P-12's gauges of the user's fourth note of 2026-11-17, homed
// from A's and C's merges, counted at the last step; the instructor's sterile walk takes no F number, house-sterile-walk stands as a
// test (the lead's call), and v0.0.24's sheet shifts its numbers by exactly three)
// (v0.0.24 E: F100 to F123 homed, the round's last merge; the sheet's §0 item 29)
// (v0.0.25 D: F124 to F137 homed, the round's last merge; its sheet's §7, §8)
// (v0.0.26 C: F138 to F149 homed, the round's last merge; its sheet's §7, §8)
// (v0.0.27: F150 to F169 homed at E's merge, the round's last, by the integration (stage 0's lead.md); its sheet's §7, §8)
export const GAUGE_LAST = 169;
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
  // (v0.0.24: the voices, scored on 2026-11-19 as none, are no sample any more: samples/voices went with the synthesis, so A5j is
  // the user's answer, landed)
  ...['helmets', 'house-stack-figures', 'p12-card', 'wcard2', 'doll-gear', 'target-view', 'opfor-look', 'marks', 'audio', 'voices', 'walk'].map((set, i) => (set === 'voices'
    ? { id: `A5${String.fromCharCode(97 + i)}`, group: 'A', what: 'the samples to score: voices (none: removed with the synthesis, v0.0.24)', check: user('the voices'), answered: W('2026-11-19', 'forget voice synthesis, no voices.') }
    : { id: `A5${String.fromCharCode(97 + i)}`, group: 'A', what: `the samples to score: ${set}`, check: { kind: 'sample', ref: set } })),
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
  // (v0.0.25's stage 0, C4: the user's pick of the shot, 2026-11-19 (DESIGN.md's log, the gallery's picks): A4 in every scene, the
  // R-7 rebuilt meaner as A5 (audio-doom), which the audio set's D group waits to be scored against)
  { id: 'B19b', group: 'B', what: 'the shot picked', check: user('the To score page\'s Shot row (A0 to A4)'), answered: W('2026-11-19', 'If i had to pick only one it\'s the last one, however, I would use the R-7 wave for the P-12 and make the R-7 sound meaner, blunter, more bass heavy. less a "PAF" and more a "DOOM" if that makes sense.') },
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
  { id: 'C6', group: 'C', what: 'no criterion left printed only but the fuzz bot\'s (F44\'s balance, F56\'s stands; F59\'s voiced clause gone with the voices, v0.0.24)', check: later('the lead: enforced at the measured value or struck in CHANGELOG (c.md)') },
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
  // ---- O. v0.0.24 (its build sheet §1, §0 item 29): each role's rows directly below its own anchor (D the two scenes' USER rows,
  // E the overhaul's rows and GAUGE_LAST, F the user's picks of 2026-11-19 applied) ----
  // (v0.0.24 D)
  // (D: the void's places and two scenes (F114, F116's figure half, F117, F118), the user's scores of each, the samples it draws at their defaults)
  { id: 'OD1', group: 'O', what: '"Anchor before you fire" scored: anchor, move, pace, feel', check: user('the score line of test-anchors'), answered: null },
  { id: 'OD2', group: 'O', what: '"Secure for burn" scored: warning, fall, feel', check: user('the score line of test-burn'), answered: null },
  { id: 'OD3', group: 'O', what: 'Well A as authored: every station\'s mark a pad-eye, each turner at its distance, the plates\' passage 1.2 m', check: test('scene-anchors › Well A as authored'), by: 'v0.0.24 D' },
  { id: 'OD4', group: 'O', what: 'the course to its card by the keys bot on every sheet, every station fired from the anchor it wants (F114)', check: test('scene-anchors › the course to its card'), by: 'v0.0.24 D' },
  { id: 'OD5', group: 'O', what: 'nine save points carry on to the card byte for byte (F114)', check: test('anchors-save'), by: 'v0.0.24 D' },
  { id: 'OD6', group: 'O', what: '40 seeds × five sheets and the fuzz\'s 40 to the card, no dead end (F114)', check: test('anchors-nodead'), by: 'v0.0.24 D' },
  { id: 'OD7', group: 'O', what: 'Well A\'s busiest tick under 2 ms × k (F117)', check: test('scene-anchors › Well A\'s busiest tick'), by: 'v0.0.24 D' },
  { id: 'OD8', group: 'O', what: 'the bot secured before the drive lights on every quick seed; a thrown body\'s card is impactOf\'s (F118)', check: test('scene-burn › a body left floating'), by: 'v0.0.24 D' },
  { id: 'OD9', group: 'O', what: 'the burn on 40 seeds and the fuzz\'s 40 to the end, no dead end (F118)', check: test('burn-nodead'), by: 'v0.0.24 D' },
  { id: 'OD10', group: 'O', what: 'in the page: the float at its height by float-look F-b, the boots by mag-boots B-b, Well A and the berth with no page error', check: test('ui-anchors'), by: 'v0.0.24 D' },
  ...['void-look', 'float-look', 'mag-boots'].map((set, i) => ({ id: `OD${11 + i}`, group: 'O', what: `drawn at its default until scored: ${set}`, check: { kind: 'sample', ref: set }, by: 'v0.0.24 D' })),
  // (v0.0.24 E)
  // (E: every portrait as you would see it, F120 to F123; the doll's rifle as a marine holds it)
  { id: 'OE1', group: 'O', what: 'a man turned drawn as scored (F1 from behind, F3 side on, F2 only on its pick), the paint on his plane at the cosine of his yaw (F120)', words: W('2026-11-17', 'the portraits need to be more dynamic and show us what we would be seeing, including what they are holding'), check: test('portrait-facing › F120'), by: 'v0.0.24 E' },
  { id: 'OE2', group: 'O', what: 'the card in his light: room 3\'s dim darker, the lit rooms and "Bang" byte for byte, never below LIGHT_FLOOR_K, no doll repainted (F121)', check: test('portrait-light › F121 the card in his light'), by: 'v0.0.24 E' },
  { id: 'OE3', group: 'O', what: 'a board in his light too', check: test('portrait-light › F121 a board in room 3'), by: 'v0.0.24 E' },
  { id: 'OE4', group: 'O', what: 'half behind the jamb, half drawn: the hidden share the jamb\'s tones, hidden whole drawn whole (F121)', check: test('portrait-cover › F121'), by: 'v0.0.24 E' },
  { id: 'OE5', group: 'O', what: 'you in the black suit on I and C: the ground by the place as portrait-suit draws it, D-a the default', check: test('portrait-suit'), by: 'v0.0.24 E' },
  { id: 'OE6', group: 'O', what: 'you prone at Y-p, v0.0.23\'s bytes', check: test('portrait-prone'), by: 'v0.0.24 E' },
  { id: 'OE7', group: 'O', what: 'mag boots and the anchors on the doll, absent on every shipped person\'s doll', words: W('2026-11-17', 'show us what we would be seeing, including what they are holding'), check: test('portrait-void'), by: 'v0.0.24 E' },
  { id: 'OE8', group: 'O', what: 'the truth cards: each stand engaged as he truly was at your first round, the capture the replay\'s, written once (F122)', check: test('truth-cards › F122 the truth cards: each stand'), by: 'v0.0.24 E' },
  { id: 'OE9', group: 'O', what: 'a v0.0.23 save engaged nothing until a round is fired after the load', check: test('truth-cards › a v0.0.23 save'), by: 'v0.0.24 E' },
  { id: 'OE10', group: 'O', what: 'the end card\'s truth cards in the page, whole pixels, nothing overlaps or scrolls (F122)', check: test('ui-truth-cards'), by: 'v0.0.24 E' },
  { id: 'OE11', group: 'O', what: 'every pick of v0.0.23\'s sets at its home, every game-drawn view its committed shot (F123)', check: test('looks-applied › F123 every pick'), by: 'v0.0.24 E' },
  { id: 'OE12', group: 'O', what: 'the gallery shows what the game draws: every game-drawn view of the portraits\' sets, the boots and doll-gear equal to its shot (F123)', check: test('looks-applied › F123 the game\'s frame'), by: 'v0.0.24 E' },
  { id: 'OE13', group: 'O', what: 'the doll\'s low ready as a marine holds it, the butt in the shoulder\'s pocket', words: W('2026-11-19', 'The Doll is wrong, nobody holds their gun like that'), check: test('doll-hold'), by: 'v0.0.24 E' },
  // (v0.0.24 F)
  // (F: the user's gallery picks of 2026-11-19 applied; no gauge)
  { id: 'OF1', group: 'O', what: 'the gallery: the waiting sets on top, every rated one in a closed section at the bottom; Copy my picks only the new', words: W('2026-11-19', 'please in the future, place the already rated picks in a hidden drop down section at the bottom'), check: test('gallery-rated'), by: 'v0.0.24 F' },
  { id: 'OF2', group: 'O', what: 'the To score page: the rated rows folded under the waiting ones; Copy my picks only the new', words: W('2026-11-19', 'please in the future, place the already rated picks in a hidden drop down section at the bottom'), check: test('topick-rated'), by: 'v0.0.24 F' },
  { id: 'OF3', group: 'O', what: 'the shot A4 rebuilt as A5 in every scene: the P-12 on the R-7\'s wave, the R-7 blunter and heavier in the bass, its loudness targets held', words: W('2026-11-19', 'make the R-7 sound meaner, blunter, more bass heavy. less a "PAF" and more a "DOOM"'), check: test('audio-doom'), by: 'v0.0.24 F' },
  { id: 'OF4', group: 'O', what: 'every line a text bubble at its speaker, none over another or the HUD, at least 95% placed as said', words: W('2026-11-19', 'forget about voices, those are all terrible use text bubble only'), check: test('bubbles'), by: 'v0.0.24 F' },
  { id: 'OF5', group: 'O', what: 'the older sets drawn as scored: R3, E1, O2 in trim; the throw by distance, B3, R2; the masks M2 and M3; the chemlight; the P-12 A with C and D kept, grey gloves; the walk B (W-c)', words: W('2026-11-19', 'Lots of stale picks since I failed to review them earlier, most of what is already in game is fine'), check: test('picks-applied'), by: 'v0.0.24 F' },
  { id: 'OF6', group: 'O', what: 'the samples to score: audio\'s D, A5 against A4', check: { kind: 'sample', ref: 'audio' } },
  // ---- P. v0.0.25, "Hold to hold" and the carried fixes (its build sheet §1, §8): each role's rows directly below its own anchor
  // (A the Wreck's places, B the body on a face and the void's beats, C the lane, D the look off the deck and GAUGE_LAST 137 at
  // its merge, E the carried fixes on the 1 G house); the round's gauges F124 to F137 are tests/wreck-done.mjs's until D homes them ----
  // (v0.0.25 A)
  // (A: the Wreck and its places, F135's and F137's sim halves; the gauges themselves are homed at D's merge)
  { id: 'PA1', group: 'P', what: 'the Wreck: decks 5 and 6 of one area 60 m apart (past the widest window), every room of its deck, the trunk offset by the decks\' origins, every bulkhead hatch the house\'s door dressed, every fixture deck to deckhead, set A meeting all six faces (F135)', check: test('wreck-place › set A'), by: 'v0.0.25 A' },
  { id: 'PA2', group: 'P', what: 'the Wreck\'s plans: cells 2 and 5 and the store derived and fresh, the hold\'s authored from its deckhead; every point the lane walks standable and routed, the open scuttle cutting the passage (F135)', check: test('wreck-place › every point the lane walks'), by: 'v0.0.25 A' },
  { id: 'PA3', group: 'P', what: 'the Wreck\'s bulkheads stand to its 2.2 m deckhead, every shipped area\'s plan and walls the snapshot\'s to the byte', check: test('wreck-place › the cutaway'), by: 'v0.0.25 A' },
  { id: 'PA4', group: 'P', what: 'one deck at a time: crossHatch the only deck change, by the decks\' offset in one tick, nobody between the decks, the actors never made again, a save mid-transit carried on (F135)', check: test('zerocqb-transit › one deck at a time'), by: 'v0.0.25 A' },
  { id: 'PA5', group: 'P', what: 'the Wreck\'s plan briefed: every wall cell known at the start and no compartment\'s floor; nothing of the other deck ever in sight (F137, the sim\'s half)', words: W('2026-11-19', 'we shouldn\'t know what\'s behind closed doors or walls without looking'), check: test('wreck-known › at the start'), by: 'v0.0.25 A' },
  // (v0.0.25 B)
  // (B: the body on a face and the void's beats, F127 to F129's sim halves; the gauges themselves are homed at D's merge)
  { id: 'PB1', group: 'P', what: 'the body on a face: the deck or the deckhead (actor.onFace), the deckhead\'s height 1.2 m and its span [0.45, 2.2] head down, one helper for the hit model and the blast; the boots lock on the deckhead, magWalk there under the tug', check: test('face-footing › onFaceOf, setOnFace and bodySpanOf'), by: 'v0.0.25 B' },
  { id: 'PB2', group: 'P', what: '"Boots to the deckhead" and "Boots to the deck": 1.5 s from boots, 1.2 s from a hold, held on a hold throughout, a save mid-change carried on', check: test('face-footing › the face change lived'), by: 'v0.0.25 B' },
  { id: 'PB3', group: 'P', what: 'a man upside down is hit where he is: a round at chest height takes his chest, at 0.6 m his head', check: test('face-footing › the hit model and the blast'), by: 'v0.0.25 B' },
  { id: 'PB4', group: 'P', what: 'anchor before you fire: every shot row under 0.05 G says its anchor and its pull ("Pair · braced (#2) · 420 ms"), every shipped label as built', words: W('2026-11-08', 'let\'s say we use footing to hold recoil'), check: test('face-footing › the shot rows'), by: 'v0.0.25 B' },
  { id: 'PB5', group: 'P', what: 'the void\'s beats on the drill\'s engine: the dogs, the lift, the transit, the plant, the face change, the coaming; nothing of the house moves', check: test('void-beats › nothing moves on the house'), by: 'v0.0.25 B' },
  { id: 'PB6', group: 'P', what: 'the hatch: #1 anchored from his transit\'s first tick on the new deck, in his #2\'s grip or on the coaming\'s hold, never floating, then planted on the deckhead; no kick at a hatch (F128, the sim\'s half)', check: test('zerocqb-hatch › #1 anchored'), by: 'v0.0.25 B' },
  { id: 'PB7', group: 'P', what: 'your #2\'s grip through the trunk: "Got you." from your transit\'s start to your plant or 0.2 s after your first round, never longer, never absent; his entry on that cue within 3 s; his boots with yours (F129, the sim\'s half)', check: test('zerocqb-two › the brace from your transit'), by: 'v0.0.25 B' },
  { id: 'PB8', group: 'P', what: 'hold to hold: a floating body always has a face to push from in a low compartment; the open middle is floating with no hold or bulkhead in reach, the deck and the deckhead never counted (F127, the sim\'s half)', check: test('zerocqb-middle › never a dead end'), by: 'v0.0.25 B' },
  { id: 'PB9', group: 'P', what: 'feet aft: under a burn\'s warning your #2 says "Feet aft." and puts his boots on the deck, and T\'s first offer is "Feet aft"', check: test('zerocqb-two › feet aft'), by: 'v0.0.25 B' },
  // (v0.0.25 C)
  // (C: the lane on the Wreck, its words, its card and its bots, F125, F126, F131 to F134 and F136's sim half; the gauges themselves are homed at D's merge)
  { id: 'PC1', group: 'P', what: '"Hold to hold": the house\'s lane on the Wreck as its own scenario, four compartments on two decks, no hall, the house\'s due slots; by URL only until its ship rule (F125)', check: test('scene-zerocqb › the Wreck\'s scene'), by: 'v0.0.25 C' },
  { id: 'PC2', group: 'P', what: 'the Wreck to the card on every sheet by T and by the keys, 40 seeds a sheet and the fuzz with no dead end, nine saves byte for byte (F125)', check: test('zerocqb-nodead'), by: 'v0.0.25 C' },
  { id: 'PC3', group: 'P', what: 'anchor before you fire: every round with its anchor, no honest round floating, a floating round faulted with recoilFloat\'s push and spin, the first round\'s anchor on the card (F126)', words: W('2026-11-08', 'let\'s say we use footing to hold recoil'), check: test('zerocqb-anchor'), by: 'v0.0.25 C' },
  { id: 'PC4', group: 'P', what: '"Secure for burn": the yard tug 60 s after GO, feet aft within its 15 s warning, the deckhead faulted, a floating body thrown at fallOf\'s speed, no skip while pending (F131)', check: test('zerocqb-aft'), by: 'v0.0.25 C' },
  { id: 'PC5', group: 'P', what: 'the house\'s gauges on the Wreck: F1, F2, F6, F9, F10, F13, F14, F26 held, F7, F15, F17, F24, F25 printed open with their causes (F132)', check: test('zerocqb-quick'), by: 'v0.0.25 C' },
  { id: 'PC6', group: 'P', what: 'the Wreck\'s busiest tick under 2 ms × k, the least of three (F133, the tick\'s half)', check: test('zerocqb-tick'), by: 'v0.0.25 C' },
  { id: 'PC7', group: 'P', what: 'each T sheet\'s own par on the Wreck, the anchor\'s, the plant\'s and the tug\'s parts in a stand\'s book (F134)', check: test('zerocqb-pars'), by: 'v0.0.25 C' },
  { id: 'PC8', group: 'P', what: 'every line of the Wreck a say with a speaker, the cadre\'s at the 1MC while he has no actor, none voiced; "Deck five clear!", "Deck six clear!"; the cadre aboard at Stop (F136, the sim\'s half)', words: W('2026-11-19', 'forget voice synthesis, no voices.'), check: test('zerocqb-words'), by: 'v0.0.25 C' },
  // (v0.0.25 D)
  // (D: the look off the deck, the portrait's roll, the bubbles at the speakers, the knowledge's page half, C6; F130, F133, F136 and F137's page halves)
  { id: 'PD1', group: 'P', what: 'a body or a board on any face drawn as samples/wreck-faces turns it: the deck and the ventral bulkhead upright, the deckhead and the dorsal bulkhead flipped head down, a side bulkhead a quarter turn, whole pixels, never culled (F130)', check: test('wreck-look › faceCard\'s 24 rows'), by: 'v0.0.25 D' },
  { id: 'PD2', group: 'P', what: 'every body off the deck by one rule, read from floatY: a floater at a standing man\'s height at the deck\'s, raised and one scale step nearer past 0.5 m of lift; a face change through the tumble\'s 45° frames', check: test('wreck-look › heightLookOf is one value'), by: 'v0.0.25 D' },
  { id: 'PD3', group: 'P', what: 'a man or a board upside down to you drawn on the card as you see him (R-a, the sample\'s own turn), every shipped key the same string', check: test('portrait-faces › R-a'), by: 'v0.0.25 D' },
  { id: 'PD4', group: 'P', what: 'the Wreck in the page: framed a deck at a time, the compartments black until seen, the bodies on their faces, the deck wipe with no hitch (F130, F133, F137)', check: test('ui-zerocqb › ui-zerocqb: the Wreck in the page'), by: 'v0.0.25 D' },
  { id: 'PD5', group: 'P', what: 'every line a text bubble at its speaker: the cadre\'s and the 1MC\'s at your compartment\'s speaker, none over another (F136)', words: W('2026-11-19', 'forget voice synthesis, no voices.'), check: test('ui-zerocqb › every line a bubble at its speaker'), by: 'v0.0.25 D' },
  { id: 'PD6', group: 'P', what: 'the samples to score: wreck-faces (K, T, P, H, B, X; K-b, T-a, P-a, H-a, B-a, X-a drawn until scored)', check: { kind: 'sample', ref: 'wreck-faces' } },
  { id: 'PD7', group: 'P', what: 'the samples to score: portrait-faces (R; R-a drawn until scored)', check: { kind: 'sample', ref: 'portrait-faces' } },
  // (v0.0.25 E)
  // (E: the carried fixes on the 1 G house, C1 to C3, and the runner's three files' lanes; no gauge of its own: F4 and F86 hold them)
  { id: 'PE1', group: 'P', what: 'your #2 never holds you in a doorway on a drawn house: out of a room north of the hall he waits inside it while your walk passes its door (F4; drawn seed 3, the tier one, 0 still ticks in room 3\'s funnel, 2 in v0.0.24)', words: W('2026-11-13', 'soldiers need to stay fluidly moving'), check: test('carried-v025 › C1'), by: 'v0.0.25 E' },
  { id: 'PE2', group: 'P', what: 'the P-12\'s admin on MAKE READY and SHOW CLEAR drawn as the pistol in the hands at the low ready, the rifle hanging, and read so by the record (v0.0.23\'s question 19 at its default; drawn so by v0.0.24 as tagged, its ADMIN_FRAMES kept at the merge and E\'s duplicate dropped, the case reading the tag\'s frames)', check: test('carried-v025 › C2'), by: 'v0.0.25 E' },
  { id: 'PE3', group: 'P', what: 'no plate over another in the house: the row\'s plate ("PAIR, MOVING ON") stacked below the shot\'s plaque ("TORSO SURE") it would meet (v0.0.23\'s question 22)', check: test('carried-v025 › C3'), by: 'v0.0.25 E' },
  { id: 'PE4', group: 'P', what: 'the tower\'s wait moves the lane by chance only, judged by the paired difference where it sees a 3% wait, else by the 2% bound kept', check: test('house-pace › the wait moves the lane from GO by chance only'), by: 'v0.0.25 E' },
  { id: 'PE5', group: 'P', what: 'the quick suite lighter, no case changed: reads-scope\'s, panel-keys\' and fixer-v020\'s extra lanes in heavy twins', check: test('panel-keys › every case over the lanes\' stops above'), by: 'v0.0.25 E' },
  // ---- Q. v0.0.26, "Bang, then go" and the carried fixes (its build sheet §1, §8): each role's rows directly below its own anchor
  // (stage 0 the pins, the quick suite's memo, house-pace's sixty seeds and the samples; A the defenders, B the scene and the lane,
  // C the look and GAUGE_LAST 149 at its merge, D the carried fixes); the round's gauges F138 to F149 are tests/breach-done.mjs's
  // until C homes them ----
  // (v0.0.26 stage 0)
  { id: 'QS1', group: 'Q', what: 'the fresh game kept per process: a clone of the first newGame for the same options, the same save and play with NO_GAME_MEMO=1', check: test('game-memo › the fresh game kept per process'), by: 'v0.0.26 stage 0' },
  { id: 'QS2', group: 'Q', what: 'the tower\'s wait judged on the boot recruit\'s sixty seeds, three blocks printed, the paired bound unchanged at two standard errors and the 3% wait injected still seen (K5)', check: test('house-pace › the wait moves the lane from GO by chance only'), by: 'v0.0.26 stage 0' },
  { id: 'QS3', group: 'Q', what: 'the samples to score: breach-poses (D, the daze; C, the cower; D-a and C-a drawn until scored), waiting on top of the gallery and at the head of the To score page\'s waiting row', check: { kind: 'sample', ref: 'breach-poses' } },
  // (v0.0.26 A)
  // (A: the defenders: room 1's posts, the held door, a friend seen falling, the read DAZED, the challenge that ends a freeze, "Search him"; F141, F142, F144 and F143's and F146's sim halves)
  { id: 'QA1', group: 'Q', what: 'room 1\'s two role-players at posts of their own (1a your side, 1b your #2\'s), each start, hide and dash by v0.0.19\'s spot rule, reached through the one seam only on "Bang, then go"\'s record (R.house.bangGo, never the breached doors\' R.house.breach)', check: test('opfor-spots › v0.0.26, room 1\'s two posts'), by: 'v0.0.26 A' },
  { id: 'QA2', group: 'Q', what: 'they choose by COMBAT §7.11\'s table at their felt band and nerve grade, never a card; a friend seen falling +10 on the other\'s pool and −0.1 on his resolve, once a fall, nothing on the live lane\'s set (F141)', words: W('2026-11-07', 'Suppression, training and exprience will decide how well NPCs can respond to threats and whether they fight back, try to rush for cover or flee all together'), check: test('breach-choice › the table chooses'), by: 'v0.0.26 A' },
  { id: 'QA3', group: 'Q', what: 'a shocked man starts nothing, the flash blinds only within 60° of his facing, and he is read DAZED and drawn dazed exactly while his block says so, on every live lane; the held door\'s man laid on the door from GO, taking you in \'sector\' (F142, F143\'s sim half)', check: test('breach-shock › a shocked man starts nothing'), by: 'v0.0.26 A' },
  { id: 'QA4', group: 'Q', what: 'a cowering man challenged within 6 m, seen or heard, gives at the challenge\'s end; never a fighting man, never out of reach or unseen and unheard; T\'s "He\'s done. Challenge him." on the scene (F144)', check: test('breach-challenge › a man frozen, and a man in cover'), by: 'v0.0.26 A' },
  { id: 'QA5', group: 'Q', what: '"Search him" after the room\'s "Clear!", 20 s, within 1.5 m of a man accounted for: belief until its end, then the truth (contact.js cardPhaseOf); a search cut by a cue offered again; never required (F146\'s sim half)', check: test('breach-search › belief until the search'), by: 'v0.0.26 A' },
  // (the review of A, 2026-11-19: its five findings, each failing without its fix)
  { id: 'QA6', group: 'Q', what: 'the house\'s own bang ("Flash it", where the G-11 really lands, by the far wall) blinds both men in room 1 on every sheet, held and loose: each man\'s rifle laid on the funnel inside the door, his eyes on the threshold (F140\'s half: 52 of 240 men unblinded with them laid on the threshold)', check: test('breach-shock › the house\'s own bang ("Flash it"'), by: 'v0.0.26 A' },
  { id: 'QA7', group: 'Q', what: 'the held door is a door held: the held man takes a marine through it \'sector\' and fires first; the loose man, turned by the leaf, lays his aim from the far wall (shot.js aimMsOf from the facing he turned from) and takes him \'alert\', 0.45 s later', check: test('breach-shock › the held door is a door held'), by: 'v0.0.26 A' },
  { id: 'QA8', group: 'Q', what: 'a second Challenge pressed on the first one\'s held end tick leaves the first judged: he gives at its end; T names no Challenge on that tick', check: test('breach-challenge › a second Challenge pressed'), by: 'v0.0.26 A' },
  { id: 'QA9', group: 'Q', what: '"Search him" out of reach is its walk, "To him, to search", named by T, which walks you within 1.5 m of him; the search\'s row and T\'s line there', check: test('breach-search › out of reach (from your point'), by: 'v0.0.26 A' },
  { id: 'QA10', group: 'Q', what: 'on "Bang, then go" a man identified and seen in plain sight is read as he is: the plaque\'s word, the stage\'s frame and T\'s line agree (COWERING the tick he freezes, never DAZED over a man drawn cowering)', check: test('breach-shock › on "Bang, then go" the read follows sight'), by: 'v0.0.26 A' },
  { id: 'QA11', group: 'Q', what: 'the window closes: a man the bang knocked off his aim lays his rifle on the door again once his shock ends, so a slow stack meets it (the review of B and C: he stood at his low ready until a marine was in his eyes, and holding 8 s cost nothing)', check: test('breach-shock › the window closes'), by: 'v0.0.26 A' },
  // (v0.0.26 B)
  // (B: the scene and the lane, its build sheet §1 items 1 to 4, 8 and 10, §6 B; the gauges F138, F139, F140, F145, F148 and F149's halves)
  { id: 'QB1', group: 'Q', what: '"Bang, then go" on the house\'s scenario after "Stack and clear, live", by its URL until its ship rule; room 1\'s two role-players and nothing past it, R.house.bangGo on this lane alone', check: test('scene-breach › the scene'), by: 'v0.0.26 B' },
  { id: 'QB2', group: 'Q', what: 'the draw from the seed on its own stream: the bang on three seeds in four, the door held on one in two; &breach= forcing either part', check: test('scene-breach › the draw'), by: 'v0.0.26 B' },
  { id: 'QB3', group: 'Q', what: 'the four draws to their card by the sergeant, the lane ended at room 1, the card\'s head naming the draw (F138\'s quick half)', check: test('scene-breach › F138 (quick)'), by: 'v0.0.26 B' },
  { id: 'QB4', group: 'Q', what: '"Again" and "Again as …" keep the draw; "Another door" a new seed and a new draw; every house option, the kit, the cards and every setup but GO dropped with one toast', check: test('scene-breach › "Again"'), by: 'v0.0.26 B' },
  { id: 'QB5', group: 'Q', what: 'no dead end: 10 seeds × the six sheets × the four draws by the honest player, and the scene\'s fuzz (F138)', words: W('2026-11-07', 'a scene never dead-ends'), check: test('breach-nodead › F138 (heavy): 10 seeds'), by: 'v0.0.26 B' },
  { id: 'QB6', group: 'Q', what: 'the scene\'s fuzz: in 3 to 6 s after the bang, never a challenge, a man with his hands up searched and shot once (the fault \'surrendered\'), every lane to its card', check: test('breach-nodead › F138 (heavy): the scene\'s fuzz'), by: 'v0.0.26 B' },
  { id: 'QB7', group: 'Q', what: 'the live lane\'s gauges on the scene: F38 to F43 and F45 met on the four draws by every sheet', check: test('breach-nodead › F138 (heavy): the live lane'), by: 'v0.0.26 B' },
  { id: 'QB8', group: 'Q', what: 'a save at nine points of the scene (GO, mid-throw, the bang, a man dazed, his dash, a man cowering, mid-challenge, mid-search, the hot wash) carries on byte for byte (F138)', check: test('breach-save › F138 (the saves, quick)'), by: 'v0.0.26 B' },
  { id: 'QB9', group: 'Q', what: 'the bang buys the room: on the bang no round of theirs before the stack\'s and no casualty from the corporal up over 20 seeds (F139)', check: test('breach-window › F139'), by: 'v0.0.26 B' },
  { id: 'QB10', group: 'Q', what: 'the slow stack and the held door: T13 from the game by the bots\' late, the held man blinded by every bang through his door, the quiet held door\'s first round by sheet (F140)', check: test('breach-window › F140'), by: 'v0.0.26 B' },
  { id: 'QB11', group: 'Q', what: 'one number: THE WINDOW, a line a man, THEIR CHOICES, the run sheet\'s ON THE BANG and DOOR OPEN n S BEFORE THE BANG and the wash from bangWindowOf to the tick (F145)', check: test('breach-window › F145'), by: 'v0.0.26 B' },
  { id: 'QB12', group: 'Q', what: 'the hot wash\'s first line by the window\'s case, a casualty\'s lesson leading its own; each man\'s line his track (F145)', check: test('breach-wash › F145'), by: 'v0.0.26 B' },
  { id: 'QB13', group: 'Q', what: 'every line of the scene a text bubble at its speaker, none voiced; the brief names the kit, never the door; the search offered once (F149\'s sim half)', words: W('2026-11-19', 'forget voice synthesis, no voices.'), check: test('breach-words › F149'), by: 'v0.0.26 B' },
  { id: 'QB14', group: 'Q', what: 'the scene\'s busiest tick under 2 ms × k, the least of three (F148\'s tick half)', check: test('breach-tick › F148 (the tick\'s half, quick)'), by: 'v0.0.26 B' },
  { id: 'QB15', group: 'Q', what: 'the scene\'s pin: four lanes from the fill to the card to the tick, the run sheet and the save', check: test('breach-pin › the scene\'s pin'), by: 'v0.0.26 B' },
  { id: 'QB16', group: 'Q', what: '"Search him" runs its 20 s behind the house\'s skip with its splash, from its first running tick to its end (the review of B and C: 40 s of watching at 1× after "Clear!")', check: test('breach-words › "Search him" runs its 20 s'), by: 'v0.0.26 B' },
  { id: 'QB17', group: 'Q', what: 'from rung 2 one press throws the bang: T alone throws one G-11 through room 1\'s door where it was issued, none on the quiet door (the review of B and C: no test failed without it)', check: test('scene-breach › F138 (quick, by T alone)'), by: 'v0.0.26 B' },
  { id: 'QB18', group: 'Q', what: 'by T alone from the corporal up over 10 seeds and the four draws: every lane to its card at room 1, one G-11 on the bang and none on the quiet door (F138)', check: test('breach-nodead › F138 (heavy, by T alone)'), by: 'v0.0.26 B' },
  { id: 'QB19', group: 'Q', what: 'the end card\'s "Another door" in the scene\'s words, Again on a new seed; &breach= dropped with its toast on every other scene, never playing room 1 there (the review of B and C)', check: test('scene-breach › "Another door" on the end card'), by: 'v0.0.26 B' },
  // (v0.0.26 C)
  // (C: the look of a man in the bang, the searched card and the bench; F143, F146, F148 and F149's page halves; GAUGE_LAST 149 at its merge)
  { id: 'QC1', group: 'Q', what: 'a role-player in the bang drawn dazed exactly while his block says so (hunched, the hand to the eyes, the rifle low: D-a; its sway a pixel at 1.5 Hz, still under "reduce flashes"; on his knee the same over the kneel) and a frozen one cowering (C-a), from a band of the stance pool painted behind the brief\'s cut', check: test('breach-look › the daze exactly while his block says so'), by: 'v0.0.26 C' },
  { id: 'QC2', group: 'Q', what: 'seen, never told: the stage\'s frame, the card\'s pose and the plaque\'s word one map at every tick of "Bang, then go" and of A\'s scripted rooms, and on the live lane with the bang and without (F143, the sim\'s half)', check: test('breach-look › F143 (sim): on "Bang, then go"'), by: 'v0.0.26 C' },
  { id: 'QC3', group: 'Q', what: 'the game draws the scored set\'s defaults pixel for pixel, the stage\'s frames and the target card, each from its one home', check: test('samples-breach › the game draws the sample\'s defaults pixel for pixel'), by: 'v0.0.26 C' },
  // (v0.0.26 D)
  // (D: the carried fixes K2 and K6; no gauge of its own but F149's K6 half (tests/breach-done.mjs), held by carried-v026)
  { id: 'QD1', group: 'Q', what: 'T acts on the first tick after a save loaded at a pause: the line settled first where the load left none, the same act, save and play as the game saved (K2; v0.0.25-house-pause played on to room 2\'s stack)', check: test('carried-v026 › K2: T on the first tick'), by: 'v0.0.26 D' },
  { id: 'QD2', group: 'Q', what: 'every line a bubble at its speaker, never the radio box for want of a free place among figures and boards: your #2\'s "Got you." and "Through." at the Wreck\'s scuttle over the hold\'s boards, every bubble that placed before where it was (K6; F149\'s half)', words: W('2026-11-19', 'forget voice synthesis, no voices.'), check: test('carried-v026 › K6: your #2'), by: 'v0.0.26 D' },
  // ---- R. v0.0.27, "Away the boarding party" and the carried items (its build sheet §1, §8): each role's rows directly below its own
  // anchor (stage 0 the pins, the ship registry, the K1 predicate, the seams, the deck as data, the saves and the samples; A the
  // defenders, B live fire and the wound, C the fire team, D the ship and the scene, E the look; the lead raises GAUGE_LAST to 169 at E's
  // merge); the round's gauges F150 to F169 are tests/collar-done.mjs's until then ----
  // (v0.0.27 stage 0)
  { id: 'RS1', group: 'R', what: 'the ship seam a registry (src/data/places/ships.js SHIPS, shipOf): every branch a row\'s data, any ship\'s rule or the Wreck\'s own, no literal of a ship\'s name left outside the registry, its data and the scene\'s entry; the Wreck\'s spec, hatches, plans and scene the snapshot\'s (F150\'s registry half)', check: test('ship-seam › the source scan'), by: 'v0.0.27 stage 0' },
  { id: 'RS2', group: 'R', what: 'the Patient Mule\'s deck 2 as data, unreachable: the rooms, the hatches (the lock\'s on an x line), the fixtures to the deckhead, the posts and crew spots in the house\'s form through spotCheck, the walls\' kinds as WALLS rows, the people\'s posts and the Civ rank, golden (F151\'s place half)', check: test('hauler-place › the stands'), by: 'v0.0.27 stage 0' },
  { id: 'RS3', group: 'R', what: 'two saves made by v0.0.26\'s own code (a man dazed in "Bang, then go"; the Wreck\'s deck 6 at a contact) load, gain no key and carry on byte for byte to their cards (F150\'s saves)', check: test('game-upgrade › v0.0.27'), by: 'v0.0.27 stage 0' },
  { id: 'RS4', group: 'R', what: 'the samples to score: hauler-deck (I, the inside: I-a drawn until scored), waiting on top of the gallery', check: { kind: 'sample', ref: 'hauler-deck' } },
  { id: 'RS5', group: 'R', what: 'the samples to score: belt-crew (D, the holdouts\' dress: D-c drawn until scored), waiting on top of the gallery', check: { kind: 'sample', ref: 'belt-crew' } },
  { id: 'RS6', group: 'R', what: 'the samples to score: board-poses (B, blind fire; Z, a man down at 0 G: B-a and Z-a drawn until scored), waiting on top of the gallery', check: { kind: 'sample', ref: 'board-poses' } },
  { id: 'RS7', group: 'R', what: 'a tick\'s time line red on its first run is run once more and its second run counts (K7): load alone never fails a line the tick meets alone, a real regression red twice; budgets unchanged', check: test('syntax › rules: the runner\'s gates and warm-up'), by: 'v0.0.27 stage 0' },
  // (E: the look aboard, the sealed suit's one look, the sets' defaults and the page; F165's atlas half, F168's sim half, F165, F166
  // and F168's page halves)
  { id: 'RE1', group: 'R', what: 'every marine in the sealed combat suit one look (lookFor leaves the skin, hair and seed out: nothing of the man is drawn), so the four aboard with one weapon and carry take one rifle sheet and the deck\'s aimed looks fit the pool (F165\'s atlas half)', check: test('look-sealed › two marines of different skins'), by: 'v0.0.27 E' },
  { id: 'RE2', group: 'R', what: 'seen, never told aboard: FIRING BLIND, RUNNING AWAY, DAZED, COWERING, HANDS UP and DOWN at 0 G one map from the stage\'s frame to the card\'s pose and the plaque\'s word; a man down at 0 G hangs from his boots, never seated or lying; the P-12 alone drawn with no R-7; the crew showing their empty hands (F168\'s sim half)', check: test('collar-look › F168 (sim)'), by: 'v0.0.27 E' },
  { id: 'RE3', group: 'R', what: 'the game draws the boarding\'s scored sets\' defaults pixel for pixel, blind fire and the 0 G down on the stage and the card, each from its one home; the coveralls\' makes and the deck\'s colours the sets\', held by the Belter palette', check: test('samples-board › the game draws the set\'s defaults pixel for pixel'), by: 'v0.0.27 E' },
  { id: 'RE4', group: 'R', what: 'in the page from GO to the card: every man drawn as the map says, no band sent after GO + 1 s, no rifle sheet evicted (F165, F168\'s page halves); every bubble over its man at 1024 × 768 and 1600 × 900 (F166\'s page half)', check: test('ui-collar › ui-collar: "Away the boarding party" in the page'), by: 'v0.0.27 E' },
]);

/** Group C: one row a gauge, F1 to GAUGE_LAST. */
/**
 * The release each gauge came in (read from the tags: the highest F number in each tag's tests/flawless*.mjs, F73 render-bench's
 * of v0.0.21, F100 to F123 this round's): every gauge's row says its own round and, where GAUGE_HOMES names one, the role that
 * built it. To v0.0.23 every row with a role was labelled "v0.0.21", whatever its round (F74 to F99 among them), and the others none.
 */
export const GAUGE_ROUNDS = Object.freeze([
  { from: 1, to: 24, v: 'v0.0.14' }, { from: 25, to: 26, v: 'v0.0.17' }, { from: 27, to: 29, v: 'v0.0.18' }, { from: 30, to: 44, v: 'v0.0.19' },
  { from: 45, to: 59, v: 'v0.0.20' }, { from: 60, to: 73, v: 'v0.0.21' }, { from: 74, to: 84, v: 'v0.0.22' }, { from: 85, to: 99, v: 'v0.0.23' },
  { from: 100, to: 123, v: 'v0.0.24' },
  // (v0.0.25's integration: the Wreck's F124 to F137, homed by D's merge)
  { from: 124, to: 137, v: 'v0.0.25' },
  // (v0.0.26's stage 0: "Bang, then go"'s F138 to F149, frozen in tests/breach-done.mjs, homed by C's merge (GAUGE_LAST 149); named
  // here before they are homed, so the round's row is there at its first gauge's merge, as v0.0.25's was not: the case "every gauge's
  // row names its own round" went red at v0.0.25 D's merge for want of it)
  { from: 138, to: 149, v: 'v0.0.26' },
  // (v0.0.27's stage 0: "Away the boarding party"'s F150 to F169, frozen in tests/collar-done.mjs, homed by the lead at E's merge
  // (GAUGE_LAST 169); named here before they are homed, as v0.0.26's were)
  { from: 150, to: 169, v: 'v0.0.27' },
]);
/** A gauge's round (GAUGE_ROUNDS), or null. */
export const roundOf = (id) => { const n = Number(String(id).replace(/^F/, '')); return GAUGE_ROUNDS.find(r => n >= r.from && n <= r.to)?.v ?? null; };
/** A gauge's `by`: its round and, where its home names one, its role ('v0.0.22 A'; 'v0.0.14'). */
export const gaugeBy = (id) => { const v = roundOf(id), role = homeOf(id)?.role; return v ? (role ? `${v} ${role}` : v) : null; };
export const GAUGE_ROWS = Object.freeze(Array.from({ length: GAUGE_LAST }, (_, i) => `F${i + 1}`).map(F => ({ id: `C${F}`, group: 'C', what: GAUGE_WHAT[F], check: gauge(F), ...(gaugeBy(F) ? { by: gaugeBy(F) } : {}) })));
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
  if (!existsSync(p)) return { ok: false, why: `${id}: no tests/${h.file}${gaugeBy(id) ? ` (${gaugeBy(id)})` : ''}` };
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
  // (v0.0.25 D, C6: the late band gone (the prepared looks lacked the mask and the boots, so each was another look's; your look's rifle
  // band at the high ready drawn from a sibling carry's sheet, the same pixels); the frame's bytes left are the fog's and the range layer's)
  F73: { run: "render-bench's house benches, v0.0.25 D's runs of 2026-11-19 (this Mac, 60 Hz, :8233; the bench card's own reading)", value: 'house-kit 117.9 KB at 6.9 s and house-live 117.9 KB at 6.8 s, no band sent (v0.0.24: 230.5 and 237.9 KB, your look\'s rifle band at the high ready 144 KB of it): the fog\'s eased mask (48 KB a frame while it eases) and the range layer\'s pixel buffers (about 70 KB while its pixels change)', target: `no upload over 64 KB after GO + 1 s` },
  // (v0.0.25's gauges red on their owners' runs (c.md, 2026-11-19): homed at D's merge, open until the lead's quiet heavy run says otherwise)
  // (v0.0.26's stage 0, its build sheet §0 item 16: F129's words were C's first handoff's, "no lane braced"; v0.0.25's fix of the
  // review of C and D braces the lanes (your #2 stacks up again at a deck hatch, BRACE_HOLD_MAX_MS 5,000), and the integrator's full
  // run of 2026-11-19 (load 2 to 6, not quiet) had zerocqb-two green. Open until the lead's quiet heavy run; never loosened)
  F129: { run: "zerocqb-two, the v0.0.25 integration's full run of 2026-11-19 (JOBS=4, load 2 to 6: not a quiet run); C's handoff before the fix of the review of C and D", value: 'the lanes braced since that fix (the sergeant 3 ticks, the corporal 48, the tier one 21, each with "Got you." and "Through."), zerocqb-two green in the full run; before it no lane braced (your #2\'s stack:point at the trunk halted by your body before his brace beat)', target: 'the brace held from your transit to your plant or 0.2 s after your first round, never absent' },
  F132: { run: "zerocqb-flawless, v0.0.25 C's run of 2026-11-19 (6 sheets × 48213, 1037, 1074)", value: 'F1, F2, F6, F9, F10, F14, F26 met; F7 18 corner faults, F13 15 stops on the tier one against 14, F15 74.6 s against 46, F17 54 of 54 stacks over 1.5 m, F24 10 of 210 stops naming no row, F25 51 of 54 cues late', target: 'as on the house' },
  // (v0.0.27's integration, homing F150 to F169 at E's merge: D's heavy runs on its final tree (d.md, the fix of D and E's review, JOBS 1,
  // load 3 to 6), read again in the integration's full run)
  F157: { run: "collar-nodead's F157 case, D's heavy run on its final tree, 2026-11-19 (80 honest lanes, pirates and smugglers, the private and the sergeant)", value: 'freeze met on every lane (the crew), fight on 2; cover and give never; blind and flee 0 (the men are down before they choose)', target: 'fight, cover, freeze and give each met on at least one lane over 40 honest seeds' },
  F167: { run: "collar-balance, D's heavy run on its final tree, 2026-11-19 (20 seeds a sheet, by T)", value: 'secured / fell back / down: corporal 10/1/9, sergeant 9/0/11, raider 10/0/10, tier one 13/0/7 (the recruit 8/1/11, the private 10/1/9): your body down for good on 7 to 11 lanes of 20 from the corporal up', target: 'from the corporal up the deck secured on 17 or more and your body down for good on 1 or fewer (red is a question for the user, never a constant tuned)' },
  F169: { run: "collar-flow's COLLAR_OPEN, D's runs, 2026-11-19 (K3's data rule dropped: it moved nothing)", value: 'Four over a hatch\'s threshold 3.95 to 5.65 s after your cue by the keys (cabin 1 4.85 to 5.3 s on every sheet); 1.95 to 2.25 s from the sergeant up at the bunk room and cabin 2; the Wreck\'s F17 and F25 still in WRECK_OPEN (the cause bundle.js leadGone\'s ship rule and the boots\' pace)', target: 'past the threshold within F25\'s 3 s on the boarding; F17 and F25 met on the Wreck\'s 18 lanes' },
  // (F134 emptied by v0.0.25's docs check: zerocqb-pars' heavy case on the integrated tree, 2026-11-19 (JOBS=3, k 1.00), MET: 12 of 12
  // T lanes GO on 48213, 1037 and 1074, 3 of 3 a sheet (the corporal on 48213 and 1037 and the sergeant on 1037 each one stand missed
  // on his hands, GO); the sim's lanes, so the machine's load does not move it; F134 never left its file's ENFORCED)
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
