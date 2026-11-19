// OLYMPUS tests: the live pin (the build sheet v0.0.22 §0 item 10, §2 step 5): "Stack and clear, live" played whole, from the fill to the card, by the house bot by T and by the keys, held to the tick, the run sheet and the save.
//
// tests/house-pin.test.mjs holds the turner lane and runs no live lane ("the live lane (&opfor=live) is not pinned here"), so until
// v0.0.22 nothing held the role-players' lane byte for byte. Each cell here is a lane of test-shoothouse with &opfor= (the
// role-players in place of stands 2a and 3a, src/sim/scenarios/opfor.js) from the fill (no setup: the brief, LOAD, MAKE READY,
// Standby, GO, the rooms, the casualty's CEASE FIRE or the hall, Stop, UNLOAD, SHOW CLEAR, the hot wash), run by
// tests/bots/house.mjs houseBot ({ mode: 'T' }, a player pressing T, or { mode: 'keys' }, by the keys) to the range's end with
// runHouse, and compared on three things as house-pin's are: the lane's last tick (state.clock.tick), the digest of its run sheet
// (runSheetOf, canonical JSON) and the digest of its save (game.digest()). The cells are the feel lens's lanes
// (.run/v022-design/feel.md): the sergeant on 48213 with the cards forced, `live:fight,hide`, by T (the quick cell, about 0.4 s); the
// private on seed 2 by the keys; the tier one on 48213 by T; the boot recruit on seed 1 by the keys (each `live`, the cards drawn
// from the seed). On v0.0.21's tree three end on the casualty (you, struck fatally), the tier one's clear.
//
// Recorded at v0.0.22's stage 0 on the snapshot of v0.0.21's integrated tree (.run/v022/v021-snapshot.tree f7d808c4) with stage
// 0 on it, which moves no tick of any lane (.run/v022/lead.md), by this file run with PRINT_HASH=1. It moves only where v0.0.22's
// build sheet §0 item 14 says: v0.0.22's C re-records every cell (FL22-1's walk and skip at SHOW CLEAR, FL22-2's paint, FL22-3's
// words after the lane's end, FL22-5's lesson), each move attributed to its step in C's handoff; A, B and D move none. A cell that
// moves anywhere else is a bug. Each mismatch prints the cell, its numbers then and now.
// v0.0.22's C (its build sheet §0 item 14) re-recorded every cell in four steps, each on the tree A, D and B left (.run/v022/after-ADB.tree)
// with C's work added a step at a time and each cell's move named on its line: (1) FL22-4, one "Clear!" a man a room: saves only, no
// tick or run sheet (35 of 44 across the three pins); (2) item 18, the house bot's "Rifle up" after Stop: the boot recruit's live cell's
// tick (4703 → 4263) and 15 saves; (3) FL22-1, SHOW CLEAR to the instructor's eye and the skip: every turner cell's last tick 20 ticks
// sooner (the wash a breath after the last "Clear.", no longer the tower's next gap), no run sheet; (4) FL22-2, 3 and 5, the live
// lane's words: the live cells only, every turner cell held. A cell that moves anywhere else is a bug.
// v0.0.23's D (its build sheet §0 item 23) re-recorded every cell in its named steps, each measured on the stage-0 tree (.run/v023/base.tree)
// with D's work and the later steps switched off, all 44 cells of the three pins a step: (1) FH-1 with the walk-in key, FH-3, FH-4, FH-5's
// words, FH-6 to FH-9 and (2) DW's door-row labels: no cell; (3) DC2, the instructor's brief and muzzle lesson at their old word counts:
// every save, no tick or run sheet (44 of 44); (4) FH-2, a room passed by why (L.passWhy, the one thing 'passed:door'): the honest
// recruit's and private's six cells, their run sheets and saves, no tick; (5) DC3, the live lane briefed as live and its sterile check
// before LOAD: the four live cells, their ticks 60 to 80 later, two run sheets, every turner cell held. FH-10 not taken (no step 6).
// The review of 2026-11-18 (D's fix pass): the sterile check's floor walk routed (route.js routed, out of the booth by its door, which
// he opens) and his walk home to the shut booth after the looks: the four live cells again, their ticks 60 to 80 later still (the
// longer walk round by the apron), every run sheet and save; house-pin's 24 and house-pin-drawn's 16 cells held.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { goldenDigest, PRINT_HASH } from './golden.mjs';
import { houseBot, runHouse } from './bots/house.mjs';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';

// (the pinned cells: 'mode/sheet/seed/opfor' → [last tick, run sheet digest, save digest]; PRINT_HASH=1 prints them to paste)
export const LIVE_PIN = Object.freeze({
  'T/sgt/48213/live:fight,hide': [3502, '041b7517eaa3d1', '0af26329363daf'], // (v0.0.24 E's pin step 1 (its build sheet §0 item 22): the truth cards' capture, T.atFirst at your first round at each stand, the save only; was [3502, '041b7517eaa3d1', '00cc11ce3df123']) // (the review of 2026-11-18 of v0.0.23 D: the sterile check's walk routed out of the booth by its door and home to it before GO, the booth's door opened and shut: the tick, the run sheet, the save; was [3442, '19ed887755a753', '059fcf729ba292']) // (v0.0.23 D's steps (its build sheet §0 item 23): DC2 the save; DC3 the tick 3362 → 3442, the save; was [3362, '19ed887755a753', '05778c40f1688e']) // (v0.0.22 C's four steps (its build sheet §0 item 14): item 18 the save; FL22-1 the tick 3362 → 3382; FL22-2, 3, 5 the tick 3382 → 3362; was [3362, '1befa2ba2d529f', '001f271d78b03e']) // (and the B and C review of 2026-11-16, the save only, the tick and the run sheet kept: the held paint's `by` (liveTick: the man who struck, read for his rounds still to fire) on the call the casualty left pending in R.house.live.paintDue; attributed by taking the hold out; was '10c23bc16d77c6')
  'keys/private/2/live': [4022, '01b21317849ed2', '05b75ae5565b50'], // (v0.0.24 E's pin step 1 (its build sheet §0 item 22): the truth cards' capture, T.atFirst at your first round at each stand, the save only; was [4022, '01b21317849ed2', '0f614788e6f2da']) // (v0.0.23's integration, re-recorded once on the merged tree: the run sheet by both causes, v0.0.22's fixer's (the card's FIRED FIRST ON YOU and the casualty's lesson, its comment below) and v0.0.23 D's (DC3 and the sterile walk's ticks, its two comments below); the tick and the save D's to the byte; was [3862, '089786213f1398', '0c85ce00945980'] on v0.0.22's tag, [4022, '0238869f778345', '0f614788e6f2da'] on D's tree) // (the review of 2026-11-18 of v0.0.23 D: the sterile check's walk routed out of the booth by its door and home to it before GO, the booth's door opened and shut: the tick, the run sheet, the save; was [3942, '0406bc1cb1e29d', '062901845a372e']) // (v0.0.23 D's steps (its build sheet §0 item 23): DC2 the save; DC3 the tick 3862 → 3942, the run sheet, the save; was [3862, '1e14928ce376e0', '0c85ce00945980']) // (re-recorded at the v0.0.22 integration on v0.0.21's tag, the save: the hunt of v0.0.20's save-gait fix over C's steps: the save only (a keys lane); was [3862, '1e14928ce376e0', '110745011eda2f']) // (v0.0.22 C's four steps (its build sheet §0 item 14): item 18 the save; FL22-1 the save; FL22-2, 3, 5 the tick 3922 → 3862; was [3922, '0900030e0db7fa', '13544796545d18']) // (and the B and C review of 2026-11-16, the save only, the tick and the run sheet kept: the held paint's `by` on the call the casualty left pending (as the sergeant's cell); attributed by taking the hold out; was '05cc490fcf491d') // (v0.0.22's fixer: the run sheet only, the tick and the save kept: the casualty's lesson: below rung 2 never 'casualty:click', the DI's own rule at a stoppage being Tap, rack (shoothouse.js casualtyCause), and the card's FIRED FIRST ON YOU naming room 3, whose role-player fired and was never answered (liveLegOf's unanswered); was [3862, '1e14928ce376e0', '0c85ce00945980'])
  'T/tierone/48213/live': [3762, '0247fb9a989bef', '1a47f0f1703d19'], // (v0.0.25's carried round: the hostage card's head hole put on the side it is scored on (sim/arms/paper.js hostageHead; the user's report of 2026-11-19, "the hit zone partly covers the hostage's head"): one hole on 3b moved off her head onto his, the save only, the tick and the run sheet kept; was [3762, '0247fb9a989bef', '19ebcd192afdc4']) // (v0.0.24 E's pin step 1 (its build sheet §0 item 22): the truth cards' capture, T.atFirst at your first round at each stand, the save only; was [3762, '0247fb9a989bef', '0c7a57f543aa03']) // (the review of 2026-11-18 of v0.0.23 D: the sterile check's walk routed out of the booth by its door and home to it before GO, the booth's door opened and shut: the tick, the run sheet, the save; was [3702, '1e8eac3b3b7aa8', '1153834a168d13']) // (v0.0.23 D's steps (its build sheet §0 item 23): DC2 the save; DC3 the tick 3622 → 3702, the save; was [3622, '1e8eac3b3b7aa8', '0a0c70eb2ffecf']) // (v0.0.22 C's four steps (its build sheet §0 item 14): FL22-4 the save; item 18 the save; FL22-1 the tick 3642 → 3622; FL22-2, 3, 5 the save; was [3642, '1e8eac3b3b7aa8', '039fd04b544936']) // (v0.0.22 B, FL22-6: the save only, the tick and the run sheet kept: the habit's toast in your log reads "Muzzle kept off …: habit.", no longer "Muzzle past …: automatic." (carry.js openApproach); attributed by the toast alone on A's and D's tree; was '143c10b31945ef')
  'keys/recruit/1/live': [4403, '1a220f7272a727', '167f3fbb433317'], // (v0.0.24 E's pin step 1 (its build sheet §0 item 22): the truth cards' capture, T.atFirst at your first round at each stand, the save only; was [4403, '1a220f7272a727', '15576c5e8b7625']) // (v0.0.23's integration, re-recorded once on the merged tree: the run sheet by both causes, v0.0.22's fixer's (the card's FIRED FIRST ON YOU and the casualty's lesson, its comment below) and v0.0.23 D's (DC3 and the sterile walk's ticks, its two comments below); the tick and the save D's to the byte; was [4263, '09504b91225f48', '0f59cf05350b6a'] on v0.0.22's tag, [4403, '042350462648de', '15576c5e8b7625'] on D's tree) // (the review of 2026-11-18 of v0.0.23 D: the sterile check's walk routed out of the booth by its door and home to it before GO, the booth's door opened and shut: the tick, the run sheet, the save; was [4323, '02aace5e28b38a', '0d75543d3f98bc']) // (v0.0.23 D's steps (its build sheet §0 item 23): DC2 the save; DC3 the tick 4263 → 4323, the run sheet, the save; was [4263, '117201406d50be', '0f59cf05350b6a']) // (re-recorded at the v0.0.22 integration on v0.0.21's tag, the save: the hunt of v0.0.20's save-gait fix over C's steps: the save only (a keys lane); was [4263, '117201406d50be', '1ce1e54f27bdaf']) // (v0.0.22 C's four steps (its build sheet §0 item 14): FL22-4 the save; item 18 the tick 4703 → 4263; FL22-1 the save; FL22-2, 3, 5 the save; was [4703, '117201406d50be', '0d459aed54fa57']) // (and the B and C review of 2026-11-16, the save only, the tick and the run sheet kept: the held paint's `by` on the call the casualty left pending, and the keys bot's SHOW CLEAR read (tests/bots/house.mjs: G at "A question mark is not a condition. Check it.", the Wait only on the lines that say it); each alone moves it, 0d1e2c8c1f0af1 and 1c82cf0081372b; was '0ac0d1ed973e0b') // (v0.0.22's fixer: the run sheet only, the tick and the save kept: the card's FIRED FIRST ON YOU naming room 2, whose role-player fired and was never answered (liveLegOf's unanswered); was [4263, '117201406d50be', '0f59cf05350b6a'])
});

// (one cell: the live lane from the fill to the range's end; its numbers)
function laneOf({ mode, tier, seed, opfor }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, opfor });
  const r = runHouse(g, houseBot({ mode }), { maxMs: 30 * 60_000 });
  const s = g.state;
  return { done: r.done, end: s.armoury?.range?.house?.end?.why ?? null, tick: s.clock.tick, sheet: goldenDigest(runSheetOf(s)), save: g.digest() };
}
const keyOf = (c) => `${c.mode}/${c.tier}/${c.seed}/${c.opfor}`;

// (the cells played and compared: each printed, the moved ones listed; PRINT_HASH=1 prints the table's lines and passes)
function pin(cells) {
  const moved = [];
  for (const c of cells) {
    const k = keyOf(c), got = laneOf(c), want = LIVE_PIN[k] ?? null;
    const line = `${k}: ${got.done ? `to the card (${got.end})` : 'NOT to the card'}, tick ${got.tick}, sheet ${got.sheet}, save ${got.save}`;
    if (PRINT_HASH) { console.log(`      '${k}': [${got.tick}, '${got.sheet}', '${got.save}'],${want && (want[0] !== got.tick || want[1] !== got.sheet || want[2] !== got.save) ? `  // (was [${want[0]}, '${want[1]}', '${want[2]}'])` : ''}`); continue; }
    const same = !!want && want[0] === got.tick && want[1] === got.sheet && want[2] === got.save;
    console.log(`      ${line}${same ? '' : want ? `  MOVED from tick ${want[0]}, sheet ${want[1]}, save ${want[2]}` : '  (no pin yet)'}`);
    if (!same || !got.done) moved.push(k);
  }
  if (!PRINT_HASH) assert(!moved.length, `${moved.length} of ${cells.length} cells moved or not pinned (re-record only at a merge that moves them, each cell on its role's list (the build sheet v0.0.22 §0 item 14), with PRINT_HASH=1): ${moved.join(', ')}`);
}

/** The quick cell (the sergeant by T with the cards forced) and the three heavy ones. */
export const LIVE_QUICK_CELL = Object.freeze({ mode: 'T', tier: 'sgt', seed: 48213, opfor: 'live:fight,hide' });
export const LIVE_CELLS = Object.freeze([
  { mode: 'keys', tier: 'private', seed: 2, opfor: 'live' },
  { mode: 'T', tier: 'tierone', seed: 48213, opfor: 'live' },
  { mode: 'keys', tier: 'recruit', seed: 1, opfor: 'live' },
]);

export default [
  {
    name: 'the live pin, quick: the sergeant by T on 48213 with the role-players\' cards forced (live:fight,hide), from the fill to the card, is held to the tick, the run sheet and the save',
    fn() { pin([LIVE_QUICK_CELL]); },
  },
  {
    name: 'the live pin: the private by the keys on 2, the tier one by T on 48213 and the boot recruit by the keys on 1, each on the live lane with its cards drawn from the seed, to the tick, the run sheet and the save',
    heavy: true,
    timeoutMs: 300_000,
    fn() { pin(LIVE_CELLS); },
  },
];
