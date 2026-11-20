// OLYMPUS tests: the relay's outcome, F175 (the build sheet v0.0.28 item 7, §6 B, §8; §14 item 16).
//
// On armoury-world's lane setup for a seed of each air (calm, breezy, gusty): the gun's rounds, foul and dust equal A's functions
// (upkeep.js firedOutcome and dustOver on a copy of the gun before the relay, with the scene's own arguments: RELAY_MIN prone, the port
// open, AREA_DUST's dust) within 1e-9; the weapon card's word "gritty" after a gusty relay (0.216 over condWord's 0.2), "fine" after a calm
// or breezy one; the gun as at CEASE FIRE (on safe, a round chambered, the second magazine in with the rounds left less one, believed
// exactly); the brass yours on the lane's tiles, fired in all, the far cases beyond the police's reach of the point; the issue's fired.
// The review of v0.0.28 B's (F174): the lane's show clear by the step panel (G, then UNLOAD, SHOW CLEAR) leaves the rifle slung as R's does,
// so the walk to the far cases, a pause of 10 s there included, is no walk fault and no stop (range safety's OUT_GRACE_S 8).
import { assert } from './helpers.mjs';
import { armGame, armOf, seedWith, untilCmd } from './armoury-world.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { stepAct } from './bots/lib.mjs';
import { createGame } from './game.mjs';
import { KD_RANGE } from '../src/data/places/range.js';
import { armouryOf, AREA_DUST, RELAY_MIN, RELAY_LEFT, FAR_CASES, RELAY_FIRE_MIN, RELAY_COOL_MIN } from '../src/sim/scenarios/armoury-day.js';
import { firedOutcome, dustOver, liveOpts } from '../src/sim/arms/upkeep.js';
import { brassNear, brassLeft, POLICE_M } from '../src/sim/arms/brass.js';
import { beliefOf, gunField } from '../src/sim/arms/firearms.js';
import { gunOn } from '../src/sim/arms/shooting.js';

export default [
  {
    name: 'F175: the relay\'s outcome on the three airs equal to A\'s functions within 1e-9, "gritty" only at gusty, the gun as at CEASE FIRE, the brass yours on the tiles, the far cases out of the point\'s reach',
    fn() {
      const bad = [];
      for (const air of ['calm', 'breezy', 'gusty']) {
        const seed = seedWith(d => d.air === air && !d.short);
        // (the gun before the relay, from the issue's setup: its copy fouled and dusted by A's functions as the scene asks)
        const g0 = armGame({ seed, setup: 'issue' }), A0 = armOf(g0), before = JSON.parse(JSON.stringify(g0.state.items[A0.gunId]));
        const g = armGame({ seed, setup: 'lane' }), A = armOf(g), R = armouryOf(g.state), pid = g.state.player.id, gun = g.state.items[A.gunId];
        const o = A.relay, copy = { ...before }, now = g.state.clock.ms, at = liveOpts(g.state, now).air ?? null;
        firedOutcome(copy, o.fired, { ms: now - RELAY_COOL_MIN * 60000, gapS: o.fired > 1 ? (RELAY_FIRE_MIN * 60) / (o.fired - 1) : 0, air: at, endMs: now });
        dustOver(copy, { minutes: RELAY_MIN, airDust: AREA_DUST[air].dust, exposure: 'open', prone: true, mags: [] });
        const f = (k) => Number(gunField(gun, k) ?? 0), c = (k) => Number(gunField(copy, k) ?? 0);
        const mag = gun.mag ? g.state.items[gun.mag] : null, b = beliefOf(g.state, gunOn(g.state, pid)), word = b.condWord;
        const near0 = brassNear(g.state, pid, POLICE_M).mine, all = brassLeft(g.state).mine, line = g.state.ammoIssues ?? g.state.armoury.ammoIssues.find(a => a.id === R.issueId);
        console.log(`      ${air} (seed ${seed}): fired ${o.fired}, left ${o.left}, far ${o.far}${o.far ? ` at ${o.farM} m` : ''}; rounds ${f('rounds')} (${c('rounds')}), foul ${f('foul').toFixed(4)} (${c('foul').toFixed(4)}), dust ${f('dust').toFixed(4)} (${c('dust').toFixed(4)}); "${word}"; chamber ${gunField(gun, 'chamber')}, ${gunField(gun, 'mode')}, magazine in ${mag?.n} (believed ${b.count}); brass ${all} yours, ${near0} within ${POLICE_M} m; issue fired ${line.fired}`);
        for (const k of ['rounds', 'foul', 'dust']) if (Math.abs(f(k) - c(k)) > 1e-9) bad.push(`${air} ${k} ${f(k)} against ${c(k)}`);
        if (gun.barrelC !== undefined || gun.heatMs !== undefined) bad.push(`${air}: the barrel kept at ${gun.barrelC} °C`);
        if ((air === 'gusty') !== (word === 'gritty')) bad.push(`${air}: the card says "${word}"`);
        if (gunField(gun, 'chamber') !== 'live' || gunField(gun, 'mode') !== 'safe' || mag?.n !== o.left - 1 || b.count !== o.left - 1) bad.push(`${air}: not as at CEASE FIRE`);
        if (all !== o.fired || near0 !== o.fired - o.far || line.fired !== o.fired) bad.push(`${air}: the brass ${all}/${near0} of ${o.fired}`);
        if (o.left < RELAY_LEFT[0] || o.left > RELAY_LEFT[1] || o.far < FAR_CASES[0] || o.far > FAR_CASES[1]) bad.push(`${air}: draws out of range`);
      }
      // (every case on the walk's ground, where it can be walked to: seed 53's lane 5 had thrown three over the south rope, policed by nobody)
      for (const seed of [53, 1, 2, 7]) {
        const g = armGame({ seed, setup: 'lane' }), R = armouryOf(g.state), [x0, z0, x1, z1] = KD_RANGE.bay.walk;
        const off = Object.keys(R.brassTiles ?? {}).map(k => k.split(',').map(Number)).filter(([i, j]) => i + 0.5 < x0 || i + 0.5 > x1 || j + 0.5 < z0 || j + 0.5 > z1);
        console.log(`      seed ${seed}: lane ${R.lane}, far ${R.arm.relay.far}${R.arm.relay.far ? ` at ${R.arm.relay.farM} m` : ''}, tiles off the walk ${off.length}`);
        if (off.length) bad.push(`seed ${seed}: ${off.length} tiles off the walk`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'F175: under an air with no cooling time (&env=freefall-vacuum, the URL\'s test preset) the relay still lands, its barrel keeps no heat, and the lane goes on',
    fn() {
      const g = createGame({ scenario: 'test-armoury', seed: 1, tier: 'private', setup: 'lane', env: 'freefall-vacuum' }), A = armOf(g), gun = g.state.items[A.gunId];
      console.log(`      the vacuum preset: fired ${A.relay.fired}, rounds ${gun.rounds}, barrel ${gun.barrelC ?? 'none'}, errors ${g.errors.length}`);
      g.step(200, {});
      assert(A.relay.fired > 0 && gun.rounds === A.relay.fired && gun.barrelC === undefined && !g.errors.length, JSON.stringify({ relay: A.relay, barrelC: gun.barrelC, errors: g.errors }));
    },
  },
  {
    name: 'F174: the lane\'s show clear by the panel (G, then UNLOAD, SHOW CLEAR) leaves the rifle slung as R\'s does: walked to the far cases and stood there 10 s, no walk fault and no stop (the review of v0.0.28 B)',
    fn() {
      const g = armGame({ seed: 2, setup: 'lane' }), A = armOf(g), R = armouryOf(g.state), pid = g.state.player.id, me = g.me();
      untilCmd(g, 'lane');
      g.step(1, { act: ['ready'] });
      for (let t = 0; t < 400 && !(g.state.stop?.phase === 'choose' && !g.state.stop?.doing); t++) g.step(1);
      g.step(1, { act: [stepAct('macro:clear')] });
      for (let t = 0; t < 600 && !(g.state.stop?.phase === 'choose' && !g.state.stop?.doing); t++) g.step(1);
      const shown = R.shown;
      g.step(1, { act: [stepAct('leave')] });
      g.step(2);
      const posture = g.state.people[pid].kit.carry?.posture ?? 'slungFront';
      // (to the far cases as the line says, and a reader's 10 s there)
      const far = Object.entries(R.brassTiles ?? {}).filter(([, t]) => t.mine).map(([k]) => k.split(',').map(v => Number(v) + 0.5)).filter(([x, z]) => Math.hypot(x - me.x, z - me.z) > 4);
      const [fx, fz] = far.reduce((t, a) => [t[0] + a[0] / far.length, t[1] + a[1] / far.length], [0, 0]);
      me.x = fx; me.z = fz; me.$px = fx; me.$pz = fz;
      g.step(200);
      const faults = R.faults.map(f => f.rule);
      console.log(`      seed 2: far ${A.relay.far} at ${A.relay.farM} m; shown by the panel ${shown}; the rifle ${posture} after it; at the far cases 10 s: faults ${JSON.stringify(faults)}, the end ${R.end?.phase ?? 'none'}`);
      assert(A.relay.far > 0 && far.length && shown && posture === 'slungFront', JSON.stringify({ far: A.relay.far, shown, posture }));
      assert(!faults.includes('walk') && !R.end, JSON.stringify({ faults, end: R.end }));
    },
  },
];
