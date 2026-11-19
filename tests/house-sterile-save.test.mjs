// OLYMPUS tests: a save inside the live lane's sterile check loads and carries on byte for byte to LOAD (v0.0.23, its build sheet item 17, carried DC3; TECH §13.1).
//
// The sterile check is plain data on the house (H.sterile { pid, near, done, to, base, who }: absent until the brief's chain is said,
// additive, so a save of v0.0.22 loads without it) and the instructor's walk on H.chief, as SHOW CLEAR's look keeps H.show. Three
// points, each the first tick a lane from the fill meets it (the sergeant by the honest bot on 48213, live:fight,hide): the instructor
// walking to you on the floor, his look at you under way, then on his way to your #2. At each the save is checked by the id walk
// (tests/ids-check.mjs) and both games, the one that saved and one loaded from it, run on to LOAD by the same bot and must reach it on
// the same tick with the same digest. The build sheet put the point in house-live-save; it is a file of its own because that file
// sits at its QUICK_SLOW ceiling (5.3 s of CPU) without it.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot } from './bots/house.mjs';
import { checkIds } from './ids-check.mjs';

export default [
  {
    name: 'v0.0.23: a save at three points of the live lane\'s sterile check before LOAD (the instructor walking to you, looking at you, on to your #2) loads and carries on byte for byte to LOAD, both games there on the same tick, every item held exactly once (carried DC3; H.sterile additive)',
    fn() {
      const opts = { scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live:fight,hide' };
      // (each point on a lane of its own from the fill: the instructor's walk and looks are a second or two apart)
      const STER = {
        'walking to you': (S, H, me) => !!S && S.done[me] === undefined && S.near[me] === undefined && !!H.chief,
        'looking at you': (S, H, me) => !!S && S.near[me] !== undefined && S.done[me] === undefined,
        'on to your #2': (S, H, me) => !!S && S.done[me] !== undefined && S.done[H.twoPid] === undefined,
      };
      const rows = [], bad = [];
      for (const [k, at] of Object.entries(STER)) {
        const g = createGame(opts), bot = houseHonestBot(), t0 = g.state.clock.ms, R = () => g.state.armoury.range;
        let n = 0;
        while (n++ < 1200 && R().cmd?.id !== 'load' && !at(R().house.sterile, R().house, g.state.player.id)) { g.step(1, bot); g.clearFacts?.(); }
        if (!at(R().house.sterile, R().house, g.state.player.id)) { rows.push(`${k.padEnd(16)} NEVER REACHED`); bad.push(`${k}: never reached`); continue; }
        const json = g.save(), ids = checkIds(JSON.parse(json), g.sim.domains), ms = g.state.clock.ms - t0;
        const g2 = createGame(opts), bot2 = houseHonestBot();
        g2.load(json);
        // (both on to LOAD in lockstep by the same bot)
        let m = 0;
        while (m++ < 1200 && (R().cmd?.id !== 'load' || g2.state.armoury.range.cmd?.id !== 'load')) { g.step(1, bot); g.clearFacts?.(); g2.step(1, bot2); g2.clearFacts?.(); }
        const same = g.digest() === g2.digest(), ta = g.state.clock.tick, tb = g2.state.clock.tick;
        rows.push(`${k.padEnd(16)} at ${(ms / 1000).toFixed(2)} s from the fill: ${ids.checked} ids, ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; on to LOAD ${same ? 'the same' : 'APART'}, at tick ${ta} and ${tb} (${m - 1} ticks on)`);
        if (!same || ta !== tb || R().cmd?.id !== 'load' || ids.invalid.length || ids.dangling.length || g.errors.length || g2.errors.length) bad.push(`${k}: ${JSON.stringify({ same, ta, tb, ids: [...ids.invalid, ...ids.dangling].slice(0, 3) })}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, bad.join(' | '));
    },
  },
];
