// OLYMPUS tests: the devices as items, their states and actions, the throw's chain and each grenade's fuse (WEAPONS §12.1, §12.2; the build sheet 0.0.18 §5.3; src/sim/arms/devices.js).
//
// The user, 2026-11-15: "breaching options and equipment (explosives etc), and grenades (bangs, frags, concussion etc) and a
// loadout screen". Each test fails without devices.js: the edges with no way out of a full hand, the chain's times, the fuses.
import { assert, fmt } from './helpers.mjs';
import { DEVICES, DEVICE_STATES, DEVICE_EDGES, DEVICE_ACTIONS, wayOut, inHand, throwChainMs, deviceMs, fuseOf, fuseBelieved, FACE_K } from '../src/sim/arms/devices.js';
import { fixedRoller } from '../src/sim/combat/roll.js';

export default [
  {
    name: 'every device\'s actions are closed over its states, and from every state of a grenade, a charge and a tool the hands can be emptied and the rifle brought up (repin, stow, throw, fire or drop; a cooked grenade only thrown)',
    fn() {
      const bad = [], ways = [];
      for (const e of DEVICE_EDGES) {
        const S = DEVICE_STATES[e.kind];
        for (const f of [e.from].flat()) if (!S.includes(f)) bad.push(`${e.act}: from ${f}`);
        if (!S.includes(e.to)) bad.push(`${e.act}: to ${e.to}`);
        if (!DEVICE_ACTIONS[e.act]) bad.push(`${e.act}: no action`);
      }
      for (const [model, D] of Object.entries(DEVICES)) for (const st of DEVICE_STATES[D.kind]) {
        const w = wayOut(D.kind, st, D);
        if (inHand(D.kind, st) && (!w || !w.length)) bad.push(`${model} ${st}: no way out`);
        if (inHand(D.kind, st)) ways.push(`${model} ${st} → ${w?.join(', ')}`);
      }
      console.log(`      ${DEVICE_EDGES.length} edges, ${Object.keys(DEVICE_ACTIONS).length} actions; the ways out of a full hand: ${[...new Set(ways.map(x => x.replace(/^\S+ /, '')))].join(' | ')}`);
      assert(!bad.length, bad.join('; '));
      // (a cooked grenade's only way is the throw: never pinned back)
      assert(wayOut('grenade', 'live', DEVICES.g9).join() === 'gren:throw', JSON.stringify(wayOut('grenade', 'live', DEVICES.g9)));
    },
  },
  {
    name: 'a G-11 is in the air 2.88 s after the decision at Weapon handling 10 (the rifle let hang, the grenade from a side pouch, the pin, the throw), 3.51 s at the boot recruit\'s 4 and 1.69 s at the tier one\'s 42; a front pouch is FACE_K 1.0, a side 1.15, the back 1.25',
    fn() {
      const rows = [4, 10, 42].map(wh => ({ wh, ...throwChainMs(wh, { face: 'left' }) }));
      for (const r of rows) console.log(`      WH ${String(r.wh).padStart(2)}: hang ${r.hangMs} + reach ${r.reachMs} + pin ${r.pinMs} + throw ${r.throwMs} = in the air at ${fmt(r.airMs / 1000, 2)} s; the rifle back up ${fmt(r.upMs / 1000, 2)} s more`);
      const want = { 4: 3510, 10: 2880, 42: 1690 };
      for (const r of rows) assert(Math.abs(r.airMs - want[r.wh]) <= 10, JSON.stringify(r));
      const R10 = fixedRoller({ weapons: 10 }), faces = Object.keys(FACE_K).map(f => `${f} ${fmt(deviceMs(R10, 'gren:reach', { face: f }) / 1000, 2)} s`);
      console.log(`      a G-11's reach at WH 10 by face: ${faces.join(', ')}`);
      assert(deviceMs(R10, 'gren:reach', { face: 'left' }) === 1381 && deviceMs(R10, 'tool:reach', { face: 'back' }) === 1501, faces.join());
    },
  },
  {
    name: 'each grenade\'s fuse is its own: the G-11\'s 1.5 s exactly, a G-9\'s 4.0 to 4.8 s from its stream (the item id), believed at 4.0 s, so a 2 s cook never bursts in the hand',
    fn() {
      const g9 = Array.from({ length: 400 }, (_, i) => fuseOf(48213, 'g9', `i${i + 1}`)), g11 = Array.from({ length: 50 }, (_, i) => fuseOf(48213, 'g11', `i${i + 1}`));
      const lo = Math.min(...g9), hi = Math.max(...g9), mean = g9.reduce((a, b) => a + b, 0) / g9.length;
      console.log(`      G-9 over 400 grenades: ${lo} to ${hi} ms, mean ${Math.round(mean)}; believed ${fuseBelieved('g9')} ms; G-11 ${[...new Set(g11)].join()} ms; the same id twice ${fuseOf(48213, 'g9', 'i7') === fuseOf(48213, 'g9', 'i7')}`);
      assert(g11.every(x => x === 1500) && lo >= 4000 && hi <= 4800 && hi - lo > 600 && fuseBelieved('g9') === 4000, JSON.stringify({ lo, hi }));
      assert(g9.every(x => x > 2000 + 1000), 'a 2 s cook would burst in the hand');
    },
  },
];
