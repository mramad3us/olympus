// The shot's grid by Monte Carlo (WEAPONS §16's 'shot'): 2,000 pulls a cell through the real resolver against the plaque's closed form.
import { assert, fmt } from './helpers.mjs';
import { resolveShot, plaqueOf } from '../src/sim/arms/shot.js';
import { targetsOf } from '../src/sim/arms/shooting.js';
import { hotGame } from './shot.test.mjs';

export default [
  {
    name: 'the 25 m grid by Monte Carlo: 2,000 pulls a cell (Marksmanship 6, 10, 14, 18 × standing, kneeling, prone × unheld, held), each through resolveShot on its own stream, within ±3 points of the plaque\'s odds, the chance of a hole on the card (the parity review\'s: the plaque had given the pass at the DC, under the hole rate); the mean score by the rings',
    heavy: true,
    fn() {
      const N = 2000, rows = [];
      let worst = 0;
      for (const mrk of [6, 10, 14, 18]) {
        const cells = [];
        for (const stance of ['stand', 'kneel', 'prone']) for (const held of [false, true]) {
          const g = hotGame({ seed: 1000 + 10 * mrk + cells.length, mrk, wh: 10, stance }), s = g.state, pid = s.player.id, gunId = s.stop.gun, gun = s.items[gunId], mag = s.items[gun.mag];
          gun.mode = 'semi';
          const card = targetsOf(s, pid).find(t => t.key === `paper:${s.armoury.range.lane}`);
          s.stop.aim.settledMs = s.clock.ms - (held ? 5000 : 0);
          const odds = plaqueOf(s, pid, { target: card }).odds;
          let hits = 0, pts = 0, misfires = 0;
          for (let i = 0; i < N; i++) {
            // (the gun made ready again each pull: a misfire leaves the hammer down, so it is cocked again too)
            gun.chamber = 'live'; delete gun.locked; delete gun.jam; delete gun.set; delete gun.cocked; mag.n = 30; gun.cond = 0.93;
            const { shot } = resolveShot(s, null, { pid, gunId, target: card });
            if (!shot.fired) { misfires++; if (misfires > 50) throw new Error(`${misfires} pulls did not fire: ${shot.why}`); i--; continue; }
            if (shot.hole?.at) hits++;
            pts += shot.hole?.score ?? 0;
          }
          const p = hits / N;
          worst = Math.max(worst, Math.abs(p - odds));
          cells.push(`${stance}${held ? ' held' : ''} ${fmt(p * 100)}/${Math.round(odds * 100)} (${fmt(pts / N, 2)} pts)`);
        }
        rows.push(`MRK ${String(mrk).padStart(2)}: ${cells.join(', ')}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      worst gap ${fmt(worst * 100, 2)} points (measured % / the plaque's %)`);
      assert(worst <= 0.03, `worst ${worst}`);
    },
  },
];
