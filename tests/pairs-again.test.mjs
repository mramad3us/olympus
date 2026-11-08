// "Again as …" on test-pairs (src/sim/scenarios/pairs.js againAs, drawStrings; the build sheet 0.0.8 §5.3, §8 item 22; 0.0.9 §5.2): the same seed as each of the five sheets turns the same targets at the same gaps, with the same faces and what they hold, and on "Three bangs" (setup 'bangs') throws the same bangs at the same times and places; only the sheet differs; scenes never write a career.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { pairsBot } from './bots/pairs.mjs';
import { pairsNow, againAs, drawStrings, PAIRS_SHEETS, PAIRS_SHEET } from '../src/sim/scenarios/pairs.js';
import { TEST_SHEETS } from '../src/sim/skills/templates.js';
import { value } from '../src/sim/skills/skills.js';
import { newGame } from '../src/sim/game.js';

// (a course played to its card: what turned at each standby, as the game did it: [{ k, keys, faces, holds, gapMs }]; on the
// setup 'bangs' the bangs as they went off: [{ id, fromCmdMs, x, z }])
function turnsOf(seed, tier, setup = null) {
  const g = createGame({ scenario: 'test-pairs', seed, tier, setup }), s = g.state, bot = pairsBot(), out = [], bangs = [];
  for (let n = 0; n < 20 * 60 * 30 && !pairsNow(s).end; n++) {
    g.step(1, bot);
    for (const [type, d] of g.bus.events) {
      if (type === 'range' && d.phase === 'turn') {
        const R = s.armoury.range, T = R.str.keys.map(k => R.turners.find(t => t.key === k));
        out.push({ k: R.str.k, keys: [...R.str.keys], faces: T.map(t => t.face), holds: T.map(t => t.holds), gapMs: R.str.turnAtMs - R.cmd.atMs, attempt: R.str.attempt });
      }
      if (type === 'fx' && d.kind === 'bang') bangs.push({ id: d.id, fromCmdMs: d.atMs - s.armoury.range.cmd.atMs, x: d.x, z: d.z });
    }
    g.clearFacts();
  }
  return { g, s, out, bangs, lane: s.armoury.range.lane, sheet: s.people[s.player.id].skills };
}

export default [
  {
    name: '"Three bangs" (0.0.9) on one seed as each sheet: the same lane, the same three bangs at the same times from the standby and the same places, the same turners at the same gaps; againAs keeps the setup; the scene writes no career (a scene saves nothing: scenes.js)',
    fn() {
      const seed = 48213, runs = PAIRS_SHEETS.map(tier => ({ tier, ...turnsOf(seed, tier, 'bangs') }));
      const ref = JSON.stringify({ lane: runs[0].lane, out: runs[0].out, bangs: runs[0].bangs });
      for (const r of runs) {
        console.log(`      seed ${seed} as ${TEST_SHEETS[r.tier].label}: lane ${r.lane}; bangs ${r.bangs.map(b => `${b.id} +${b.fromCmdMs} ms at (${b.x}, ${b.z})`).join(', ')}; turns ${r.out.map(x => `${x.k} +${x.gapMs} ms`).join(', ')}`);
        assert(r.bangs.length === 3 && JSON.stringify({ lane: r.lane, out: r.out, bangs: r.bangs }) === ref, `as ${r.tier}: not the same bangs or turners`);
      }
      const s = runs[0].s, a = againAs(s, 'tierone'), fresh = newGame({ seed, scenario: 'test-pairs' });
      console.log(`      again as the tier one: ${JSON.stringify(a)}`);
      assert(a.setup === 'bangs' && a.seed === seed && a.tier === 'tierone', JSON.stringify(a));
      const keys = ['career', 'careers', 'memorial'];
      assert(keys.every(k => JSON.stringify(s[k]) === JSON.stringify(fresh[k])), 'a career written');
      const calm = createGame({ scenario: 'test-pairs', seed, tier: 'recruit' });
      assert(againAs(calm.state, 'tierone').setup === null, 'the calm course again as itself');
    },
  },
  {
    name: 'the same seed as each sheet turns the same targets at the same gaps, faces and holds alike, the lane alike (the build sheet §8 item 22: the strings drawn from the seed alone); only the sheet\'s numbers differ',
    fn() {
      for (const seed of [48213, 7]) {
        const runs = PAIRS_SHEETS.map(tier => ({ tier, ...turnsOf(seed, tier) }));
        const ref = JSON.stringify({ lane: runs[0].lane, out: runs[0].out });
        for (const r of runs) {
          const v = (k) => value(r.sheet, k);
          console.log(`      seed ${seed} as ${TEST_SHEETS[r.tier].label} (WF ${r.sheet.os}, MRK ${v('marksmanship')}, WH ${v('weapons')}, AWR ${v('awareness')}): lane ${r.lane}, ${r.out.map(x => `${x.k}: ${x.keys.map((k, i) => `${k.split(':')[1]} ${x.faces[i]}/${x.holds[i]}`).join(', ')} +${x.gapMs} ms`).join(' · ')}`);
          assert(JSON.stringify({ lane: r.lane, out: r.out }) === ref, `seed ${seed} as ${r.tier}: not the same targets ${JSON.stringify(r.out)}`);
        }
        const d = drawStrings(seed, runs[0].lane);
        assert(runs[0].out.every(x => JSON.stringify(x.keys) === JSON.stringify(d[x.k].keys) && x.gapMs === d[x.k].gapMs), `seed ${seed}: the game's turns are drawStrings' ${JSON.stringify(d)}`);
      }
    },
  },
  {
    name: 'againAs gives the same seed and another sheet; an unknown sheet is the private; a scene never writes a career (the career keys as a fresh game\'s)',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'recruit' }), s = g.state;
      const a = againAs(s, 'tierone'), b = againAs(s, 'nobody');
      console.log(`      again as the tier one: ${JSON.stringify(a)}; as an unknown sheet: ${JSON.stringify(b)}; the default ${PAIRS_SHEET}`);
      assert(a.scenario === 'test-pairs' && a.seed === 48213 && a.tier === 'tierone' && b.tier === 'private', JSON.stringify({ a, b }));
      const h = createGame({ scenario: a.scenario, seed: a.seed, tier: a.tier });
      assert(h.state.armoury.range.sheet === 'tierone' && h.state.people[h.state.player.id].skills.os === TEST_SHEETS.tierone.wf, 'the tier one\'s sheet');
      const bot = pairsBot();
      for (let n = 0; n < 20 * 60 * 30 && !pairsNow(s).end; n++) g.step(1, bot);
      const fresh = newGame({ seed: 48213, scenario: 'test-pairs' });
      const keys = ['career', 'careers', 'memorial'];
      console.log(`      after the card: ${keys.map(k => `${k} ${JSON.stringify(s[k])}`).join(', ')}`);
      assert(pairsNow(s).end && keys.every(k => JSON.stringify(s[k]) === JSON.stringify(fresh[k])), 'a career written');
    },
  },
];
