// OLYMPUS tests: the device in the hands as the stage reads it (the build sheet v0.0.22 §1 item 17, §6 D, F84; the residuals lens's R3; kit-10 of the v0.0.18 hunt).
//
// The hunt's lane (the tier one on the full loadout, 1489397426, the honest kit bot using both: samples/held-devices' check.json)
// in node: look.js heldLook follows the gear record's device (gear.js gearOf's `device`, devices.js handDeviceOf) on every tick, for you
// and your number two, and goes on naming a thrown G-11 through the throw's 0.7 s (on the floor's record from the beat's start) until
// its flight's first tick, and on that tick names nothing; the hunt's moments read the G-11 armed at 13,350 ms after GO and the halligan
// at 28,850; beatOf names the device beats there (the restack carries the G-11 standing: heldCan; the force: heldForce0); F84 printed
// and enforced (tests/flawless-held.mjs). Heavy: F84 on the kit lanes (the full, flash and breach loadouts, the honest, keys and T
// bots, three sheets). Fails without heldLook.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseBot } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { heldLook, beatOf } from '../src/sim/arms/look.js';
import { gearOf } from '../src/sim/arms/gear.js';
import { heldFrameOf } from '../src/art/figures/poses.js';
import { heldGauge, f84Line } from './flawless-held.mjs';

function lane({ tier, seed, loadout, bot, watch = null }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go', loadout });
  const G = heldGauge(), go = g.state.armoury.range.house.goAtMs;
  runHouse(g, bot, { maxMs: 240_000, each: (game) => { G.each(game.state); watch?.(game.state, game.state.clock.ms - go); } });
  return { g, r: G.end().F84 };
}

export default [
  {
    name: 'heldLook follows the gear\'s device on every tick of the hunt\'s lane, through the throw to its flight\'s first tick; the G-11 at 13,350 ms, the halligan at 28,850 (F84)',
    fn() {
      const rows = [], moments = {}, mis = [];
      let ticks = 0, withDev = 0, thrown = 0;
      const { r } = lane({ tier: 'tierone', seed: 1489397426, loadout: 'full', bot: houseKitBot({ use: 'both', base: 'honest' }), watch: (s, t) => {
        ticks++;
        for (const pid of [s.player.id, s.armoury.range.house.twoPid]) {
          const a = s.actors.list.find(x => x.who === pid), L = heldLook(s, a, s.clock.ms), dev = gearOf(s, pid)?.device ?? null;
          if (dev) withDev++;
          // (no device in the hand: only a grenade of his thrown, before its flight)
          const throwing = !dev && L && s.items[L.id]?.flight?.fromMs > s.clock.ms;
          if (throwing) thrown++;
          if (dev ? !L || L.model !== dev.model || L.shape !== dev.shape || L.colour !== dev.colour : L && !throwing) mis.push({ t, pid, dev, L });
          if (pid === s.player.id && (t === 13350 || t === 28850)) moments[t] = { model: L?.model ?? null, frame: heldFrameOf(L, beatOf(s, pid, s.clock.ms)) };
        }
      } });
      rows.push(`${ticks} ticks from GO, ${withDev} with a device in a hand (yours and your #2's), ${thrown} in a throw before its flight; mismatches ${mis.length}`);
      rows.push(`13,350 ms: ${JSON.stringify(moments[13350])}; 28,850 ms: ${JSON.stringify(moments[28850])}`);
      rows.push(f84Line(r));
      for (const x of rows) console.log(`      ${x}`);
      assert(!mis.length && withDev > 100 && thrown >= 14, JSON.stringify(mis.slice(0, 3)));
      assert(moments[13350]?.model === 'g11' && moments[13350].frame === 'heldCan' && moments[28850]?.model === 'hal' && /^heldForce/.test(moments[28850].frame ?? ''), JSON.stringify(moments));
      assert(r.ok && r.flights >= 1, JSON.stringify({ ...r, frames: undefined }));
    },
  },
  {
    name: 'F84 on the kit lanes (heavy): every tick with a device in a hand carried by the look and drawn, every flight begun the tick after its card\'s last',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const all = [];
      for (const loadout of ['full', 'flash', 'breach']) for (const tier of ['private', 'sgt', 'tierone']) for (const [name, bot] of [['honest', () => houseKitBot({ use: 'both', base: 'honest' })], ['keys', () => houseKitBot({ use: 'both', base: 'keys' })], ['T', () => houseBot({ mode: 'T' })]]) {
        const { r } = lane({ tier, seed: 48213, loadout, bot: bot() });
        all.push({ loadout, tier, name, r });
        console.log(`      ${loadout} ${tier} ${name}: ${f84Line(r)}`);
      }
      const bad = all.filter(x => !x.r.ok), hand = all.reduce((n, x) => n + x.r.handTicks, 0), fl = all.reduce((n, x) => n + x.r.flights, 0);
      console.log(`      F84 ${bad.length ? 'OPEN' : 'MET'} over ${all.length} lanes: ${hand} ticks with a device in a hand, ${fl} flights`);
      assert(!bad.length, JSON.stringify(bad.map(x => ({ ...x, r: { ...x.r, frames: undefined } }))));
    },
  },
];
