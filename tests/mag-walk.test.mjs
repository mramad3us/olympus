// The walk on locked mag boots (v0.0.25's carried round): the user's report of 2026-11-19 playing v0.0.24 at 0 G, "the 0G boots locked
// walking animation should be a walking animation not a leaping animation, with mags on, each step is slower, but both feet never leave
// the ground". The leap was sim/body/loco.js stepMOf's lope: at micro-g a 0.5 m/s walk has a Froude number over LOPE_FROUDE, so the
// phase counted a flight and the view drew the run's flight frames lifted. On locked boots under 0.3 G no flight, the walk's band
// (Assault read as the Combat glide), the cadence the boots' speed over the walk's step; the bound kept without boots from 0.05 to
// 0.3 G. Each case fails without the fix.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepMOf, bootsWalk } from '../src/sim/body/loco.js';
import { stepOf } from '../src/sim/people/figure.js';
import { walkFrame } from '../src/art/figures/poses.js';
import { flightLiftM } from '../src/art/figures/walk.js';
import { MAG_BOOTS, GAIT_G } from '../src/data/body/needs.js';
import { G0_MS2 } from '../src/core/phys.js';
import { GP_WRAP } from '../src/data/body/gait.js';
import { houseTBot, runHouse } from './bots/house.mjs';

export default [
  {
    name: 'mag-walk: on locked boots under 0.05 G (and to 0.3 G) the step has no flight and its band is the walk\'s (Assault the glide), its cadence slower than the 1 G walk; without boots the bound keeps its flight from 0.05 to 0.3 G',
    fn() {
      const rows = [], bad = [];
      const walk1 = stepMOf({ gait: 'walk', vMs: 1.4, gMs2: G0_MS2 }), cad1 = 1.4 / walk1.stepM;
      for (const gG of [0, 0.0006, 0.01, 0.1, 0.2, 0.29]) for (const stance of [null, 'combat', 'assault']) {
        const gMs2 = gG * G0_MS2, b = stepMOf({ gait: 'walk', stance, vMs: MAG_BOOTS.WALK_MS, gMs2, boots: true }), cad = MAG_BOOTS.WALK_MS / b.stepM;
        rows.push(`${gG} G ${stance ?? 'relaxed'} on boots: band ${b.band}, flight ${fmt(b.flight, 2)} s, step ${fmt(b.stepM, 3)} m, ${fmt(cad, 2)} steps/s`);
        if (b.flight !== 0 || b.band === 'assault' || b.band === 'run' || !(cad < cad1)) bad.push(`${gG} G ${stance}`);
      }
      for (const gG of [0.1, 0.2]) {
        const n = stepMOf({ gait: 'walk', vMs: 1.6, gMs2: gG * G0_MS2 });
        rows.push(`${gG} G without boots at 1.6 m/s: flight ${fmt(n.flight, 2)} s (the bound)`);
        if (!(n.flight > 0)) bad.push(`no bound at ${gG} G`);
      }
      rows.push(`the 1 G walk at 1.4 m/s: ${fmt(cad1, 2)} steps/s`);
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length && bootsWalk({ anchor: 'boots' }, 0.006) && !bootsWalk({ anchor: 'boots' }, GAIT_G.BOUND_BELOW_G * G0_MS2) && !bootsWalk({}, 0), bad.join('; '));
    },
  },
  {
    name: 'mag-walk: you walking to station one on locked boots in Well A, every tick drawn on the walk\'s frames with no flight and no lift, the gait record \'walk\', the phase a step a 0.375 m',
    fn() {
      const g = createGame({ scenario: 'test-anchors', seed: 48213, tier: 'private', setup: 's1' }), s = g.state, me = g.me();
      const bad = [];
      let ticks = 0, frames = new Set(), maxLift = 0, gpLast = me.gp ?? 0, steps = 0, x0 = me.x;
      for (let n = 0; n < 120; n++) {
        g.step(1, { mx: 1, mz: 0 });
        steps += (((me.gp ?? 0) - gpLast) % GP_WRAP + GP_WRAP) % GP_WRAP; gpLast = me.gp ?? 0;
        if (me.gait === 'idle') continue;
        ticks++;
        const f = stepOf(s, me), band = me.moveStance === 'combat' || me.moveStance === 'assault' ? 'combat' : 'walk', at = walkFrame(band, { gp: me.gp, stepM: f.stepM });
        const lift = at.flight ? flightLiftM(at.u, 1, f.gMs2) : 0;
        frames.add(at.frame); maxLift = Math.max(maxLift, lift);
        if (me.gait !== 'walk' || !f.magWalk || at.flight || /^(run|flight|bound)/.test(at.frame)) bad.push(`${s.clock.ms}: gait ${me.gait}, ${at.frame}${at.flight ? ' FLIGHT' : ''}`);
      }
      const walked = me.x - x0;
      console.log(`      ${ticks} ticks walking on boots (${me.anchor}), ${fmt(walked, 2)} m: the frames ${[...frames].sort().join(' ')}; lift at most ${maxLift} m; ${fmt(steps, 2)} steps (${fmt(walked / Math.max(1e-9, steps), 3)} m a step)`);
      assert(ticks > 50 && !bad.length && maxLift === 0 && Math.abs(walked / steps - 0.375) < 0.01, bad.slice(0, 4).join('; ') || JSON.stringify({ ticks, walked, steps }));
    },
  },
  {
    name: 'mag-walk: your #2 on his boots in the Wreck (the sergeant by T to the trunk), every tick he walks the walk\'s frames, never a flight',
    fn() {
      const g = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state;
      let walked = 0, flights = 0, onBoots = 0;
      const frames = new Set();
      runHouse(g, houseTBot(), { maxMs: 60_000, each: () => {
        const two = s.actors.list.find(a => a.who === s.armoury.range.house.twoPid);
        if (!two || two.gait !== 'walk') return;
        walked++;
        const f = stepOf(s, two);
        if (!f.magWalk) return;
        onBoots++;
        const at = walkFrame(two.moveStance === 'combat' || two.moveStance === 'assault' ? 'combat' : 'walk', { gp: two.gp, stepM: f.stepM });
        frames.add(at.frame);
        if (at.flight) flights++;
      } });
      console.log(`      your #2 walked ${walked} ticks, ${onBoots} on locked boots: ${flights} in flight; the frames ${[...frames].sort().join(' ')}`);
      assert(onBoots > 20 && flights === 0, JSON.stringify({ walked, onBoots, flights }));
    },
  },
];
