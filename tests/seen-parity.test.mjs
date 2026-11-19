// OLYMPUS tests: the Seen record agrees with the stage on every tick of the pinned lanes (F85, F86, F97; tests/flawless-seen.mjs; the build sheet v0.0.23 §6 A, §8).
//
// The user, 2026-11-17: "the portraits need to be more dynamic and show us what we would be seeing, including what they are holding".
// A card drawn from src/sim/people/seen.js shows what the stage shows only if the record and the stage agree, and the stage is not
// switched to the record (its looks carry per-tick fields a key would freeze): so on every tick of a lane, for you, your number two,
// each role-player and each stand, the record's hold, pose and facing are held to an oracle written in flawless-seen.mjs from the
// stage's own readers (F85); no record's key moves in a pause and the stage's look keys over the lane are those recorded on v0.0.22's
// snapshot (F86); and with the P-12 in the hands its posture is the sim's one record, each stance its own hold, the draw and the
// holster read as they run (F97; the user's note of 2026-11-17, "sidearm should have the same stances (low ready, high ready, aimed,
// etc) as the rifle"). Quick on two lanes, one here (the tier one by T on 48213, the quick lane with the P-12 in the hands) and one in
// seen-parity-live (the live lane's quick cell): the review of 2026-11-18 measured each file at its CPU edge with two lanes (3.4 and
// 3.6 s against 3 s × k at load 7), so the private by the keys and the boot recruit's live lane on 1, which add no hold, pose or P-12
// tick the quick pair lacks, run in the heavy case only; heavy on the 28 pinned lanes (house-pin's 24, house-live-pin's four); each lane held to its pin too, so the reads change nothing. Fails without seen.js, and on a wrong row of CARRY_HOW or FRAME_SEEN (each oracle's table its own).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { botOf } from './flawless.mjs';
import { runHouse, houseBot } from './bots/house.mjs';
import { goldenDigest } from './golden.mjs';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';
import { PIN, PIN_SEEDS, PIN_SHEETS, PIN_KEYS } from './house-pin.test.mjs';
import { LIVE_PIN, LIVE_QUICK_CELL, LIVE_CELLS } from './house-live-pin.test.mjs';
import { seenGauge, f85Line, f86Line, f97Line } from './flawless-seen.mjs';

// (the pinned lanes as the stage-0 lead's lookkeys.mjs lists them: { name, make, bot, pin })
export const pinCells = () => [...PIN_SEEDS.flatMap(seed => PIN_SHEETS.map(tier => ({ bot: 'honest', tier, seed }))), ...PIN_KEYS.map(tier => ({ bot: 'keys', tier, seed: 48213 })),
  ...['flash', 'breach'].flatMap(use => ['', ':keys'].map(k => ({ bot: `kit:${use}${k}`, tier: 'cpl', seed: 48213, loadout: use })))].map(c => {
  const k = `${c.bot}/${c.tier}/${c.seed}/${c.loadout ?? 'standard'}`;
  return { name: `house-pin ${k}`, make: () => createGame({ scenario: 'test-shoothouse', seed: c.seed, tier: c.tier, ...(c.loadout ? { loadout: c.loadout } : {}) }), bot: () => botOf(c.bot, { seed: c.seed }), pin: PIN[k] };
});
export const liveCells = () => [LIVE_QUICK_CELL, ...LIVE_CELLS].map(c => {
  const k = `${c.mode}/${c.tier}/${c.seed}/${c.opfor}`;
  return { name: `house-live-pin ${k}`, make: () => createGame({ scenario: 'test-shoothouse', seed: c.seed, tier: c.tier, opfor: c.opfor }), bot: () => houseBot({ mode: c.mode }), pin: LIVE_PIN[k] };
});
/** The quick lane (see the header; the private by the keys runs in the heavy case). */
export const QUICK_LANES = Object.freeze(['house-pin honest/tierone/48213/standard']);
/** The live lane's quick cell, seen-parity-live's (a file of its own: two lanes in one file are over a quick file's CPU budget; the boot recruit's live lane on 1 runs in the heavy case). */
export const QUICK_LIVE_LANES = Object.freeze([`house-live-pin ${LIVE_QUICK_CELL.mode}/${LIVE_QUICK_CELL.tier}/${LIVE_QUICK_CELL.seed}/${LIVE_QUICK_CELL.opfor}`]);

export function laneRun(cell) {
  const g = cell.make(), G = seenGauge({ lane: cell.name });
  const r = runHouse(g, cell.bot(), { maxMs: 30 * 60_000, each: (gm) => G.each(gm.state) });
  const s = g.state, got = [s.clock.tick, goldenDigest(runSheetOf(s)), g.digest()], held = !!cell.pin && cell.pin.every((v, i) => v === got[i]);
  return { name: cell.name, done: r.done, held, got, ...G.end() };
}
export function report(list) {
  const sum = (F, k) => list.reduce((t, x) => t + (x[F][k] ?? 0), 0);
  for (const x of list) {
    console.log(`      ${x.name}: ${x.done ? 'to the card' : 'NOT to the card'}, tick ${x.got[0]}, ${x.held ? 'its pin held' : `PIN MOVED ${JSON.stringify(x.got)}`}`);
    for (const line of [f85Line(x.F85), f86Line(x.F86), f97Line(x.F97)]) console.log(`        ${line}`);
  }
  console.log(`      in all: F85 ${sum('F85', 'agree')} of ${sum('F85', 'records')} records and ${sum('F85', 'boardsAgree')} of ${sum('F85', 'boards')} boards; F86 ${sum('F86', 'held')} of ${sum('F86', 'pauses')} paused reads, ${list.filter(x => x.F86.ok).length} of ${list.length} lanes' stage keys as recorded; F97 ${sum('F97', 'agree')} of ${sum('F97', 'ticks')} P-12 ticks, ${sum('F97', 'drawsRead')} of ${sum('F97', 'draws')} draws`);
  const bad = list.filter(x => !x.done || !x.held || !x.F85.ok || !x.F86.ok || !x.F97.ok).map(x => ({ name: x.name, done: x.done, held: x.held, F85: x.F85.ok, F86: x.F86.ok, F97: x.F97.ok }));
  assert(!bad.length, JSON.stringify(bad));
}

export default [
  {
    name: 'the record agrees with the stage on the turner lanes\' quick cell (F85, F86, F97): the tier one by T on 48213, the P-12 drawn and holstered; every tick, every man and stand; the stage\'s look keys as recorded; the lane held to its pin (the live lane: seen-parity-live; the private by the keys: the heavy case)',
    timeoutMs: 120_000,
    fn() {
      const all = [...pinCells(), ...liveCells()], cells = QUICK_LANES.map(n => all.find(c => c.name === n));
      assert(cells.every(Boolean), JSON.stringify(QUICK_LANES));
      report(cells.map(laneRun));
    },
  },
  {
    name: 'the record agrees with the stage on the 28 pinned lanes (heavy): house-pin\'s 24 and house-live-pin\'s four, F85, F86 and F97 on every tick, each lane held to its pin',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      report([...pinCells(), ...liveCells()].map(laneRun));
    },
  },
];
