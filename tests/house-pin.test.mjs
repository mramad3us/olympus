// OLYMPUS tests: the house pin (the build sheet v0.0.19 §2 step 5, §9 item 2): "Stack and clear" played whole, from the fill to the card, by the honest and the keys bots, held to the tick, the run sheet and the save on the standard loadout and on D1's flash and breach loadouts.
//
// Each cell is a lane from the fill (no setup: the brief, LOAD, MAKE READY with your #2's own admin, Standby, GO, the three
// rooms and the hall, Stop, UNLOAD, SHOW CLEAR, the hot wash) run by tests/bots/house.mjs runHouse to the range's end, and
// compared on three things: the lane's last tick (state.clock.tick), the digest of its run sheet (runSheetOf, canonical JSON)
// and the digest of its save (game.digest()). The cells:
//   - the honest bot (T and the shot the line names) on the user's seed 1489397426, 48213 and 1037, at each of the six sheets,
//     and the keys bot at the private and the boot recruit on 48213, on the standard loadout;
//   - the kit's two bots (tests/bots/kit.mjs: the honest and the keys bot with the kit's row once a door) at the corporal on
//     48213, on the 'flash' and the 'breach' loadouts.
// The honest tier one on 48213 is quick (one sheet on one seed, under a second of CPU: the sheet's §0 item 26); the rest is
// heavy.
//
// The goldens were recorded on v0.0.18's tag (first on the snapshot the round was built on, the integrated tree before its tag;
// re-recorded on the tag at the integration, where four cells' saves differ from the snapshot's, their ticks and run sheets
// not: v0.0.18's last fixes), by this file run there with PRINT_HASH=1, and held byte for byte by v0.0.19's stage 0 (the #2's move to house-two.js, team.js's
// seams, the anchors, the harness). They move only at the team's merge, for the build sheet's §0 item 16's two movers (the #2's
// drill from his belief, and your Cover his sector saying "Covering!" first), and then only on lanes where the #2 has a
// stoppage: the lead re-records them (PRINT_HASH=1) with every moved cell printed, in .run/v019/lead.md and CHANGELOG.md. A
// cell that moves anywhere else is a bug. Each mismatch prints the cell, its numbers then and now.
// v0.0.20's stage 0 (its build sheet §3) holds all 24 cells byte for byte: the #2's P-12 switch is built (loadout.js twoP12Of,
// '~two:none') with TWO_P12_DEFAULT false. Turned on, every cell moves (his four items in every save, his MAKE READY and SHOW
// CLEAR longer, his walk 1.21 kg heavier): the cells for it are printed in .run/v020/lead.md, with the patch that turns it on.
// From here the v0.0.20 roles' merges move them, each cell on its role's list (§3 step 5).
// The integration (on v0.0.19's tag, stage 0 byte-identical there too) re-recorded them at each merge that moved them, every
// moved cell on its role's list (.run/v020/integrate.md):
//   - A's (the bodies and the line): ten cells, by item 8 (your #2 on your heels below rung 3: ENTRY_WAIT_MS 400, his entry at
//     Fast; the keys sheets and the corporal's kit lanes) and item 19 (the pair in the hall: cqb-pair, the honest bot's T on the
//     recruit and the private); no other cell's tick, run sheet or save.
//   - B's (the room): all 24, by item 12 (leaving a room: his status, "Coming out!", the last man's mark; L.teamCalls, L.marked)
//     and item 17 (the far leg's wait, room 3, from rung 2), and every save by item 15 (the door delta's `how`); the honest bot
//     below rung 2 keeps its ticks and run sheets. The 24 equal the review's A+B tree's (12f7f84e) to the byte.
//   - D's (the sound and the look): all 24, by item 7 alone (the tower waits on the instructor's chained lines, R.paUntilMs: GO
//     about 22 to 33 s later, and the lanes' dice keyed by absolute game ms move with it; 13 of 24 run sheets keep their digest);
//     the gauges, not the cells, are its check (house-pace's distribution, F11 to F26).
//   - C's (the card): all 24 run sheets and saves (the cause on a missed par, the pars a sheet can meet, the TEAM row, the verdict:
//     L.parMs, H.laneParMs, H.iaBookMs, the contacts' cause and carry), and no tick: every cell's last tick D's.
//   - the hunt of v0.0.18's fixes (.run/huntfix/merged.md, a diff on v0.0.19, merged after C): on v0.0.19 its pistol fixer
//     moved every save (the P-12's words at SHOW CLEAR) and honest/recruit/1037's tick (9003 → 8823, the rifle's clear not run again
//     after the show) and its look fixer kit:breach/cpl/48213's (4642 → 4622, Dominate named before the far leg). On the merged tree:
//     every save, honest/recruit/1037's tick 9443 → 9303 (the same cause) and kit:breach/cpl/48213's run sheet, its tick kept; no other
//     tick or run sheet. Its notes, as on v0.0.19:
//     Re-recorded by the pistol fixer of the hunt of v0.0.18 (.run/huntfix/pistol.md): every cell's save, by the P-12's words at SHOW
//     CLEAR alone ("The slide locked back, the round out.", "The slide goes home."; the J else line for line, ticks and run sheets
//     the same), and honest/recruit/1037's tick 9003 → 8823 (its rifle's clear halted after the show: "P-12: SHOW CLEAR" now, then the
//     wait on the #2, never the rifle's clear run again).
//     Re-recorded at the hunt fixes' merge (.run/huntfix/merged.md): kit:breach/cpl/48213/breach, tick 4642 → 4622 and its sheet
//     (the look fixer's page-1: at rung 2 the instructor names the room's Dominate before the walk to the far leg, 1.0 s shorter),
//     its save also carrying the P-12's words above. No other cell moved at the merge.
//   - the user's answers of 2026-11-16 (.run/asks-v020/handoff.md, a diff on v0.0.19, merged last): his P-12 standard issue
//     (TWO_P12_DEFAULT true) and paint that ends the live lane only when fatal. On the merged tree all 24 cells moved, by his P-12
//     alone (no cell runs the live lane): 23 last ticks by 20 to 100 ticks (his MAKE READY and SHOW CLEAR on the tower, 1.21 kg on
//     his walk; the corporal on 1489397426 keeps his), 14 run sheets, every save (his four items). On v0.0.19 the asks' own note:
//     v0.0.20: re-recorded with PRINT_HASH=1 for the #2's P-12 as standard issue (the user's answer of 2026-11-16, "#2 has to have a
//     sidearm"; loadout.js TWO_P12_DEFAULT true), every cell moved: each save has his P-12, its HAD-17, the thigh pouch and its spare
//     (four ids after every other item), and 21 of the 24 last ticks move by 20 to 160 ticks (the tower waits on his P-12 at MAKE
//     READY and SHOW CLEAR; his kit 1.21 kg heavier moves a lane's seconds by ±0.5 s); 12 run sheets move with them. The cells
//     before and after are listed in .run/asks-v020/handoff.md. The live lane (&opfor=live) is not pinned here: no cell runs it.
//   - F15 on the kit's lanes (.run/v020-close/f15.md, after the integration): "Coming out!" said over the walk from rung 2
//     (enter-and-clear.js `out`, flowFrom 2; below rung 3 it was said standing, CALL_S 0.8 s a room, and the corporal's breach
//     lane on 1489397426 ran 121.0 s against KIT_LANE_MAX_S 120). Five cells moved, every one the corporal's (rung 2, the one
//     rung the flow changes: below it the call is said standing as before, from rung 3 every voice flowed already):
//     honest/cpl/1489397426 4382 → 4322, honest/cpl/48213 4362 → 4322, honest/cpl/1037 4343 → 4303, kit:flash/cpl/48213
//     4702 → 4582 and kit:breach/cpl/48213 5322 → 5162, their run sheets and saves with them; the kit's keys cells at the
//     corporal keep theirs. No other cell moved.
//   - The other closers (the lane's due, F14; your #2 off a passed leg's stack and round you, F17 and F46; his "Gun down!"
//     closed and the entry on his bang pre-armed, F36 and team-task): no cell moved, alone or with the four merged.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { goldenDigest, PRINT_HASH } from './golden.mjs';
import { botOf } from './flawless.mjs';
import { runHouse } from './bots/house.mjs';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';

/** The seeds (the user's first) and the sheets the honest bot plays; the keys bot's sheets on 48213. */
export const PIN_SEEDS = Object.freeze([1489397426, 48213, 1037]);
export const PIN_SHEETS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);
export const PIN_KEYS = Object.freeze(['private', 'recruit']);

// (the pinned cells: 'bot/sheet/seed/loadout' → [last tick, run sheet digest, save digest]; PRINT_HASH=1 prints them to paste)
export const PIN = Object.freeze({
  'honest/private/48213/standard': [9302, '198079885defd4', '0dd6a86a6022cc'],
  'honest/recruit/1489397426/standard': [9422, '14f7403e0e2a4a', '0639a4df0290a7'],
  'honest/private/1489397426/standard': [9262, '0dc11833e17968', '1a6643148aceae'],
  'honest/cpl/1489397426/standard': [4322, '1333937e34d33d', '1871f24996a6c8'],
  'honest/sgt/1489397426/standard': [3882, '05058e569986bb', '0f7acc9f50240d'],
  'honest/raider/1489397426/standard': [3722, '0c48a7755f1e3c', '13c1559201e371'],
  'honest/tierone/1489397426/standard': [3662, '0738174f30db68', '1eb626c6730ce5'],
  'honest/recruit/48213/standard': [9502, '154f28d41514eb', '0e13ac34c7bd00'],
  'honest/cpl/48213/standard': [4322, '0217f422262c2e', '14a581100e1b8c'],
  'honest/sgt/48213/standard': [3902, '04005bd3b2ffdf', '06a0d34fecca87'],
  'honest/raider/48213/standard': [3742, '16ae19057c83fe', '1606854302991b'],
  'honest/tierone/48213/standard': [3702, '0001dbf0c63e8c', '054fea56515720'],
  'honest/recruit/1037/standard': [9383, '025846a0ca6042', '1b37cf07dc9cc2'],
  'honest/private/1037/standard': [9243, '03ae2aa49291ff', '1e8587ffc77d37'],
  'honest/cpl/1037/standard': [4303, '15931fbe9c1185', '0476b200312300'],
  'honest/sgt/1037/standard': [3903, '0cbfada019a4e3', '12232b58bfebba'],
  'honest/raider/1037/standard': [3703, '00f1c996122111', '16e02a1278eb96'],
  'honest/tierone/1037/standard': [3663, '02b7dd11fb27d6', '1eb1c9e1b44fff'],
  'keys/private/48213/standard': [4522, '0f9a4f3c5944a7', '06826268530246'], // (v0.0.20's fixer: the run sheet and the save only, the tick kept: a missed par whose take-in was within its allowance is the hands', no longer 'eyes' (shoothouse.js parCauseOf, the play review); was '05d75bda80fff9', '0bf7b43d6e56a8')
  'keys/recruit/48213/standard': [4962, '0e5ade83d0a87f', '0ba3500682116b'], // (v0.0.20's fixer: the run sheet and the save only, the tick kept: a missed par whose take-in was within its allowance is the hands', no longer 'eyes' (shoothouse.js parCauseOf, the play review); was '130bbde6f823cb', '0dce5b5f1a4f34')
  'kit:flash/cpl/48213/flash': [4582, '1cb56b6ca13a5e', '0d370755434c43'], // (v0.0.20's fixer: the run sheet and the save only, the tick kept: a missed par whose take-in was within its allowance is the hands', no longer 'eyes' (shoothouse.js parCauseOf, the play review); was '1ee1820255e1cf', '0b39b2cce62eca') // (0ac02cb91ee1bc on v0.0.18: K's kit bot marks room 3 done in its memory, kitDoors; the game's state the same)
  'kit:flash:keys/cpl/48213/flash': [4322, '0c3a65cd8da568', '04d19037c94af4'], // (v0.0.20's fixer: the run sheet and the save only, the tick kept: a missed par whose take-in was within its allowance is the hands', no longer 'eyes' (shoothouse.js parCauseOf, the play review); was '1bf425ebac9a3f', '09d7216f730330')
  'kit:breach/cpl/48213/breach': [5162, '1294eebb815d8d', '114bb100a1481c'],
  'kit:breach:keys/cpl/48213/breach': [4342, '1e268238476f56', '0f13cdbd5bc72e'], // (v0.0.20's fixer: the run sheet and the save only, the tick kept: a missed par whose take-in was within its allowance is the hands', no longer 'eyes' (shoothouse.js parCauseOf, the play review); was '0bcb781e30c8fa', '0077dacdc12918')
});

// (one cell: the lane from the fill to the range's end; its numbers)
function laneOf({ bot, tier, seed, loadout = null }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, ...(loadout ? { loadout } : {}) });
  const r = runHouse(g, botOf(bot, { seed }), { maxMs: 30 * 60_000 });
  const s = g.state;
  return { done: r.done, end: s.armoury?.range?.house?.end?.why ?? null, tick: s.clock.tick, sheet: goldenDigest(runSheetOf(s)), save: g.digest() };
}
const keyOf = (c) => `${c.bot}/${c.tier}/${c.seed}/${c.loadout ?? 'standard'}`;

// (the cells played and compared: each printed, the moved ones listed; PRINT_HASH=1 prints the table's lines and passes)
function pin(cells) {
  const moved = [];
  for (const c of cells) {
    const k = keyOf(c), got = laneOf(c), want = PIN[k] ?? null;
    const line = `${k}: ${got.done ? `to the card (${got.end})` : 'NOT to the card'}, tick ${got.tick}, sheet ${got.sheet}, save ${got.save}`;
    if (PRINT_HASH) { console.log(`      '${k}': [${got.tick}, '${got.sheet}', '${got.save}'],${want && (want[0] !== got.tick || want[1] !== got.sheet || want[2] !== got.save) ? `  // (was [${want[0]}, '${want[1]}', '${want[2]}'])` : ''}`); continue; }
    const same = !!want && want[0] === got.tick && want[1] === got.sheet && want[2] === got.save;
    console.log(`      ${line}${same ? '' : want ? `  MOVED from tick ${want[0]}, sheet ${want[1]}, save ${want[2]}` : '  (no pin yet)'}`);
    if (!same || !got.done) moved.push(k);
  }
  if (!PRINT_HASH) assert(!moved.length, `${moved.length} of ${cells.length} cells moved or not pinned (re-record only at a merge that moves them, each cell on its role's list (the build sheet v0.0.20 §3 step 5), with PRINT_HASH=1): ${moved.join(', ')}`);
}

// (the quick cell: the tier one on 48213, whose lane the #2 works (his men taken in and engaged, his cover); the honest bot
// below rung 2 plays T alone and its legs pass by the stall, so its lanes are blind to whose man a stand is: forcing team.js
// ownerOf to 1 moved 18 of the 24 cells, every one from the corporal up and both keys lanes, and none of the honest boot
// recruit's or private's)
const QUICK_CELL = Object.freeze({ bot: 'honest', tier: 'tierone', seed: 48213 });
const standard = () => [
  ...PIN_SEEDS.flatMap(seed => PIN_SHEETS.map(tier => ({ bot: 'honest', tier, seed }))),
  ...PIN_KEYS.map(tier => ({ bot: 'keys', tier, seed: 48213 })),
].filter(c => keyOf(c) !== keyOf(QUICK_CELL));
const kit = () => ['flash', 'breach'].flatMap(use => ['', ':keys'].map(k => ({ bot: `kit:${use}${k}`, tier: 'cpl', seed: 48213, loadout: use })));

export default [
  {
    name: 'the house pin, quick: the honest tier one on 48213, from the fill to the card on the standard loadout (your #2\'s P-12 standard issue from v0.0.20), is held to the tick, the run sheet and the save',
    fn() { pin([QUICK_CELL]); },
  },
  {
    name: 'the house pin: the honest bot on 1489397426, 48213 and 1037 at every sheet, and the keys bot at the private and the recruit on 48213, on the standard loadout, each to the tick, the run sheet and the save',
    heavy: true,
    timeoutMs: 600_000,
    fn() { pin(standard()); },
  },
  {
    name: 'the house pin: the kit\'s honest and keys bots at the corporal on 48213 on D1\'s flash and breach loadouts, each to the tick, the run sheet and the save',
    heavy: true,
    timeoutMs: 300_000,
    fn() { pin(kit()); },
  },
];
