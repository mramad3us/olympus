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
const PIN = Object.freeze({
  'honest/private/48213/standard': [8822, '0caabf53835d5b', '0734cb9a541ab3'],
  'honest/recruit/1489397426/standard': [8902, '0646d3c1c8916a', '13328529d067b0'],
  'honest/private/1489397426/standard': [8822, '0df037ef484f76', '18077afddce26d'],
  'honest/cpl/1489397426/standard': [3842, '0c90faae68e5bf', '0ef8a2005e1ba8'],
  'honest/sgt/1489397426/standard': [3402, '11db58673e7fc1', '0905d99ce1db32'],
  'honest/raider/1489397426/standard': [3222, '0f3ad5ec3ae014', '073dd8974f53b6'],
  'honest/tierone/1489397426/standard': [3142, '0c8d47676bb063', '16426e74a1b884'],
  'honest/recruit/48213/standard': [9062, '150c83213b95e7', '047458c13552a7'],
  'honest/cpl/48213/standard': [3822, '1b948516d2d7b5', '03b60224637a43'],
  'honest/sgt/48213/standard': [3422, '173eaf801c0b5e', '036782aa5dbd5d'],
  'honest/raider/48213/standard': [3222, '175b4b62081885', '035ff62837564d'],
  'honest/tierone/48213/standard': [3162, '152eba8094e222', '1c4cbbdded2f00'],
  'honest/recruit/1037/standard': [9003, '16699c2720e293', '0d5c8faf47e2f5'],
  'honest/private/1037/standard': [8803, '0c67ca73f1dbb3', '1b2faff3a5dc1c'],
  'honest/cpl/1037/standard': [3763, '0860913ef7b0e3', '1051745f81e16e'],
  'honest/sgt/1037/standard': [3403, '1027b291ed6738', '058d8171fad6a6'],
  'honest/raider/1037/standard': [3183, '1d641de677f59f', '01e894c1bb0106'],
  'honest/tierone/1037/standard': [3123, '00b8c8daf875d8', '1e1fa9838a0510'],
  'keys/private/48213/standard': [4002, '153b395c735b70', '0b166c918585a3'],
  'keys/recruit/48213/standard': [4502, '051a3b54a8d8a6', '0455c7f9376d86'],
  'kit:flash/cpl/48213/flash': [3982, '1db00a95733dc8', '0054246990c0ba'], // (0ac02cb91ee1bc on v0.0.18: K's kit bot marks room 3 done in its memory, kitDoors; the game's state the same)
  'kit:flash:keys/cpl/48213/flash': [3782, '18440659d9f179', '005cbdefd853ec'],
  'kit:breach/cpl/48213/breach': [4642, '0d5f517b6022ce', '1fe7036bc071fb'],
  'kit:breach:keys/cpl/48213/breach': [3782, '1e518e834f7d5f', '19b4b4fc8c2f9d'],
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
  if (!PRINT_HASH) assert(!moved.length, `${moved.length} of ${cells.length} cells moved or not pinned (re-record only at the team's merge, for §0 item 16's two movers, with PRINT_HASH=1): ${moved.join(', ')}`);
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
    name: 'the house pin, quick: the honest tier one on 48213, from the fill to the card on the standard loadout, is v0.0.18\'s to the tick, the run sheet and the save (stage 0 byte-identical)',
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
