// OLYMPUS tests: the fresh game kept per process (v0.0.26's build sheet §2 step 2, §6 stage 0; the carried lens §4.2 item 1).
//
// tests/game.mjs createGame takes its new state from newGameMemo: the first newGame for given options kept, every game a
// structuredClone of it. This file holds that a clone is the game newGame would make: ten option sets (the bay, the barracks, the
// sandbox, the shoot house set, live, drawn and with the flash kit, the KD range, the pairs, the Wreck), each made three ways (with
// the memo twice, the second a hit, and with NO_GAME_MEMO=1), give the same save at once and the same digest 60 ticks on; and that
// a game changed after its make leaves the next clone fresh (a memo that handed out the kept state itself fails it: the second
// game would start where the first was left).
import { assert } from './helpers.mjs';
import { createGame, gameMemoStats, GAME_MEMO_MAX } from './game.mjs';

const SETS = Object.freeze([
  { scenario: 'barracks', seed: 48213, hour: 23 },
  { scenario: 'barracks', seed: 48213 },
  { scenario: 'sandbox', seed: 1 },
  { scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' },
  { scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', opfor: 'live' },
  { scenario: 'test-shoothouse', seed: 1037, tier: 'tierone', setup: 'go', draw: 'drawn' },
  { scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', loadout: 'flash' },
  { scenario: 'test-range', seed: 48213, setup: 'confirm' },
  { scenario: 'test-pairs', seed: 48213, tier: 'sgt' },
  { scenario: 'test-zerocqb', seed: 48213, tier: 'private' },
]);
const TICKS = 60;

// (one game made with the memo on or off: its save at once and its digest TICKS on)
function made(o, memo) {
  const was = process.env.NO_GAME_MEMO;
  if (memo) delete process.env.NO_GAME_MEMO; else process.env.NO_GAME_MEMO = '1';
  try {
    const g = createGame(o), save = g.save();
    g.step(TICKS, {});
    return { save, digest: g.digest(), errors: g.errors.length };
  } finally { if (was === undefined) delete process.env.NO_GAME_MEMO; else process.env.NO_GAME_MEMO = was; }
}

export default [
  {
    name: 'the fresh game kept per process: ten option sets made with the memo (twice, the second a clone of the kept state) and without (NO_GAME_MEMO=1) give the same save at once and the same digest 60 ticks on',
    fn() {
      const s0 = gameMemoStats(), bad = [];
      for (const o of SETS) {
        const off = made(o, false), a = made(o, true), b = made(o, true);
        const same = a.save === off.save && b.save === off.save && a.digest === off.digest && b.digest === off.digest && !off.errors && !a.errors && !b.errors;
        console.log(`      ${JSON.stringify(o)}: save ${off.save.length} bytes; ${TICKS} ticks on ${off.digest} without the memo, ${a.digest} and ${b.digest} with it${same ? '' : '  DIFFERENT'}`);
        if (!same) bad.push(o);
      }
      const s1 = gameMemoStats();
      console.log(`      the memo: ${s1.hits - s0.hits} hits, ${s1.misses - s0.misses} made, ${s1.skipped - s0.skipped} without it; ${s1.kept} kept (at most ${GAME_MEMO_MAX})`);
      assert(!bad.length, JSON.stringify(bad));
      assert(s1.hits - s0.hits >= SETS.length && s1.kept <= GAME_MEMO_MAX, JSON.stringify({ s0, s1 }));
    },
  },
  {
    name: 'a game changed after its make leaves the next clone fresh: the bay at 23:00 played 200 ticks and its state written into, then the same options again give the fresh save (a memo handing out its kept state fails it)',
    fn() {
      const o = { scenario: 'barracks', seed: 48213, hour: 23 };
      const fresh = made(o, false).save;
      const g = createGame(o);
      g.step(200, {});
      g.state.meta.memoProbe = 'written';
      const h = createGame(o), again = h.save();
      console.log(`      fresh ${fresh.length} bytes; the changed game at tick ${g.state.clock.tick}; the next game ${again === fresh ? 'the fresh save to the byte' : 'DIFFERENT from the fresh save'} (tick ${h.state.clock.tick})`);
      assert(again === fresh && h.state.meta.memoProbe === undefined, JSON.stringify({ tick: h.state.clock.tick, probe: h.state.meta.memoProbe }));
    },
  },
];
