// The inoculation counter growing from drills under the chaos, capped by its teacher (SKILLS §6.8; COMBAT §5.6; the build sheet 0.0.10 §2.1, §5.1, §8 item 19).
//
// noteExposure on a counter that is not fixed (a career's): twelve drills at felt peak 25 taught by the cadre, four a sol
// over three sols, 6 → 10 → 14 → 15 and then held at the cadre's cap; unit training held at 10; felt 19 never counts; a
// fixed counter (a test sheet) never moves, its why 'test sheet'; no teacher never counts (a real fight teaches through
// Warfighting). Each drill's counter printed. And the scene's call: test-stress played by the stress bot on the recruit
// and the tier one, R.stress.inoc read (the strings that would count in a career; the test sheet's counter fixed and never
// moved). The scene's part runs where the scene role's test-stress is in the build, and says so where it is not.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { SOL_MS } from '../src/core/clock.js';
import { SCENARIOS } from '../src/sim/game.js';
import { noteExposure, inocOf, hardOf, INOC_CAP, INOC_FELT, INOC_PER_SOL } from '../src/sim/combat/supp.js';

// (a player with a career's counter: the private's test sheet with its counter freed, at pts)
function career(pts = 6) {
  const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private' }), s = g.state, pid = s.player.id;
  s.people[pid].skills.inoc = { pts, n: 0, sol: 0 };
  return { g, s, pid, sol0: Math.floor(s.clock.ms / SOL_MS) };
}

export default [
  {
    name: 'inoc: twelve drills at felt peak 25 taught by the cadre, four a sol over three sols: 6 → 10 → 14 → 15, then held at the cadre\'s cap (15) whatever comes after; unit training held at 10; each drill\'s counter printed',
    fn() {
      const { s, pid, sol0 } = career(6), trail = [], why = [], pts = [];
      for (let sol = 0; sol < 4; sol++) for (let i = 0; i < INOC_PER_SOL + (sol === 0 ? 1 : 0); i++) {
        const r = noteExposure(s, pid, { feltPeak: 25, teacher: 'cadre', atMs: (sol0 + 1 + sol) * SOL_MS + i * 600_000 });
        trail.push(`${r.counted ? '+1 → ' : '· '}${r.pts}`); why.push(r.why); pts.push(r.pts);
      }
      const bySol = [0, 1, 2, 3].map(k => trail.slice(k === 0 ? 0 : 5 + (k - 1) * 4, k === 0 ? 5 : 5 + k * 4).join(', '));
      console.log(`      the cadre, felt peak 25: sol 1 ${bySol[0]} (the fifth: ${why[4]}) | sol 2 ${bySol[1]} | sol 3 ${bySol[2]} (${why[11]}) | sol 4 ${bySol[3]}; ${inocOf(s, pid).words}, hardening ${hardOf(s, pid)}`);
      const ends = [4, 8, 12, 16].map(i => pts[i]);
      const unit = career(6), ut = [];
      for (let sol = 0; sol < 3; sol++) for (let i = 0; i < INOC_PER_SOL; i++) ut.push(noteExposure(unit.s, unit.pid, { feltPeak: 40, teacher: 'unit', atMs: (unit.sol0 + 1 + sol) * SOL_MS + i * 600_000 }).pts);
      console.log(`      unit training, felt peak 40, four a sol over three sols: ${ut.join(' ')} (its cap ${INOC_CAP.unit})`);
      assert(ends.join() === '10,14,15,15' && s.people[pid].skills.inoc.pts === INOC_CAP.cadre && why[4] === 'enough for one sol' && ut.at(-1) === INOC_CAP.unit && Math.max(...ut) === 10, JSON.stringify({ trail, ut }));
    },
  },
  {
    name: 'inoc: felt peak 19 never counts (INOC_FELT 20 does); a fixed counter (a test sheet) never moves, \'test sheet\'; no teacher never counts (a real fight teaches through Warfighting)',
    fn() {
      const a = career(6), at = (k) => (a.sol0 + 1) * SOL_MS + k * 60_000;
      const r19 = noteExposure(a.s, a.pid, { feltPeak: INOC_FELT - 1, teacher: 'cadre', atMs: at(0) }), r20 = noteExposure(a.s, a.pid, { feltPeak: INOC_FELT, teacher: 'cadre', atMs: at(1) });
      const fight = noteExposure(a.s, a.pid, { feltPeak: 98, teacher: null, atMs: at(2) });
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'recruit' }), s = g.state, pid = s.player.id, before = JSON.stringify(s.people[pid].skills.inoc);
      const fixed = [0, 1, 2, 3, 4].map(i => noteExposure(s, pid, { feltPeak: 98, teacher: 'cadre', atMs: s.clock.ms + i * 1000 }));
      console.log(`      felt 19: ${r19.counted ? 'counted' : `not counted (${r19.why})`}, ${r19.pts}; felt 20: ${r20.counted ? 'counted' : 'not'}, ${r20.pts}; a real fight at felt 98: ${fight.counted ? 'counted' : `not counted (${fight.why})`}, ${fight.pts}`);
      console.log(`      the boot recruit's test sheet, five drills at felt 98 by the cadre: ${fixed.map(r => `${r.counted ? '+1' : '·'}${r.pts} (${r.why})`).join(', ')}; the counter ${before} → ${JSON.stringify(s.people[pid].skills.inoc)}`);
      assert(!r19.counted && r20.counted && r20.pts === 7 && !fight.counted && fight.pts === 7, JSON.stringify({ r19, r20, fight }));
      assert(fixed.every(r => !r.counted && r.why === 'test sheet' && r.pts === 2) && JSON.stringify(s.people[pid].skills.inoc) === before, JSON.stringify(fixed));
    },
  },
  {
    name: 'inoc: the scene\'s call (the build sheet 0.0.10 §2.2, §8 item 19): test-stress played to its card by the stress bot on the recruit and the tier one; R.stress.inoc says which strings would count in a career, and the test sheet\'s counter never moves',
    async fn() {
      if (!SCENARIOS['test-stress']) { console.log('      test-stress is not in this build yet (the scene role\'s SCENARIOS entry): the scene\'s part is not run'); return; }
      const mod = await import('./bots/stress.mjs');
      const mk = mod.stressBot ?? Object.values(mod).find(f => typeof f === 'function');
      if (!mk) { console.log('      the stress bot is not in this build yet (tests/bots/stress.mjs): the scene\'s part is not run'); return; }
      const rows = [];
      for (const tier of ['recruit', 'tierone']) {
        const g = createGame({ scenario: 'test-stress', seed: 48213, tier }), s = g.state, pid = s.player.id, before = JSON.stringify(s.people[pid].skills.inoc), bot = mk();
        let n = 0;
        for (; n < 20 * 60 * 30 && !s.armoury.range.end; n++) g.step(1, bot);
        const list = s.armoury.range.stress?.inoc ?? [];
        rows.push({ tier, ended: !!s.armoury.range.end, n, list, same: JSON.stringify(s.people[pid].skills.inoc) === before, inoc: inocOf(s, pid).pts, errors: g.errors.length });
      }
      for (const r of rows) console.log(`      ${r.tier}: ${r.ended ? 'to the card' : 'NOT ENDED'} in ${(r.n / 20 / 60).toFixed(1)} min; ${r.list.map(x => `string ${x.k}: ${x.counted ? 'counted' : x.would ? 'would count' : 'would not'} (${x.why})`).join(', ') || 'no record'}; the counter ${r.inoc}, ${r.same ? 'unmoved' : 'MOVED'}; ${r.errors} errors`);
      assert(rows.every(r => r.same && !r.errors && r.list.every(x => !x.counted)), JSON.stringify(rows));
      assert(rows[1].list.every(x => !x.would), 'the tier one is never at felt 20 in ear defenders: nothing would count');
    },
  },
];
