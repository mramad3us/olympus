// OLYMPUS tests: the gravity's signs to the player: the G line on the strip, the siren, the 1MC on the radio box, the surprise's card (v0.0.24, ROADMAP "anywhere" step 6; the build sheet §6 C, grav-hud).
//
// The G line (src/ui/hud/strip.js gLineText over src/sim/places/gravity.js gLineOf) shows only when the gravity is not nominal:
// "0.00 G · floating" and "0.00 G · on mag boots" on a coasting deck, "BRACE 0:08" through a warning, "1.00 G · burn" through the
// change, and nothing at Mars, in the Wheel, or aboard a ship under a steady 1 G with nothing pending. The siren (src/ui/audio/siren.js)
// plays one cycle a SIREN_CYCLE_MS through the warning and none outside it, at SIREN_DB through the compartment's air; the 1MC's
// words reach the radio box under its own name; the surprise's card reads as the reflex card does (src/ui/hud/reflex.js reflexOf).
// v0.0.25's burn polish (the user's score of test-burn, 2026-11-19: "some indication of how strong is the burn"): the words pinned
// here are the event's size and direction now, "BRACE 0:08 · BURN 1.0 G ▼", "1.00 G ▼ burn" and the 1MC's "Secure for burn: one
// G."; burn-polish holds the rest (the jink's, the meter, the boots' note).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { setProfile, gLineOf, gravCardOf } from '../src/sim/places/gravity.js';
import { setAnchor } from '../src/sim/body/footing.js';
import { wear } from '../src/sim/arms/kit.js';
import { airAt } from '../src/sim/places/env.js';
import { airDb } from '../src/sim/people/hearing.js';
import { gLineText } from '../src/ui/hud/strip.js';
import { sirenCycle, createSiren } from '../src/ui/audio/siren.js';
import { gravNow } from '../src/sim/places/gravity.js';
import { lineOf } from '../src/ui/hud/radio.js';
import { reflexOf } from '../src/ui/hud/reflex.js';
import { SIREN_CYCLE_MS, SIREN_DB, WORLD } from '../src/data/sounds.js';
import { TICK_MS } from '../src/core/clock.js';

const SEED = 48213, APRON = Object.freeze([2, 10]);
const meOf = (s) => s.actors.list.find(a => a.id === s.player.actor);
const text = (s) => gLineText(gLineOf(s));

export default [
  {
    name: 'grav-hud: the G line\'s words: "0.00 G · floating" and "0.00 G · on mag boots" on a coasting deck, "BRACE 0:08 · BURN 1.0 G ▼" in the warning, "1.00 G ▼ burn" under the burn (v0.0.25\'s burn polish: the size and the arrow); nothing at Mars, in the Wheel, or under a steady 1 G with nothing pending',
    fn() {
      const g = createGame({ scenario: 'sandbox', seed: SEED, env: 'ship-coast' }), s = g.state;
      setProfile(s, [{ kind: 'burn', toG: 1, atS: 20, warnS: 15 }]);
      const words = { floating: text(s) };
      g.step(Math.round(12_000 / TICK_MS)); words.brace = text(s);
      g.step(Math.round(13_000 / TICK_MS)); words.burn = text(s);
      const h = createGame({ scenario: 'test-shoothouse', seed: SEED, env: 'ship-coast' }), hs = h.state, me = meOf(hs);
      me.x = APRON[0]; me.z = APRON[1];
      wear(hs, hs.player.id, 'mb-1'); assert(setAnchor(hs, hs.player.id, 'boots').ok, 'the boots lock');
      words.boots = text(hs);
      const none = {};
      for (const [k, o] of [['Mars', { scenario: 'test-handling' }], ['the Wheel', { scenario: 'test-shoothouse' }], ['a ship at 1 G', { scenario: 'sandbox', env: 'ship-1g' }]]) { const n = createGame({ seed: SEED, ...o }); n.step(20); none[k] = { facts: gLineOf(n.state), text: text(n.state) }; }
      console.log(`      ${Object.entries(words).map(([k, v]) => `${k} "${v}"`).join('; ')}; ${Object.entries(none).map(([k, v]) => `${k} "${v.text}" (${v.facts})`).join('; ')}`);
      assert(words.floating === '0.00 G · floating' && words.boots === '0.00 G · on mag boots' && words.brace === 'BRACE 0:08 · BURN 1.0 G ▼' && words.burn === '1.00 G ▼ burn', JSON.stringify(words));
      for (const [k, v] of Object.entries(none)) assert(v.facts === null && v.text === '', `${k}: ${JSON.stringify(v)}`);
    },
  },
  {
    name: 'grav-hud: the siren plays one cycle a second through a 15 s warning (15 cycles, at SIREN_DB through the compartment\'s air) and none before it or after the onset; its recipe the rising whoop of samples/void-look\'s S-b (v0.0.28, the user\'s star of 2026-11-20; was S-a\'s two tones)',
    fn() {
      const g = createGame({ scenario: 'sandbox', seed: SEED, env: 'ship-coast' }), s = g.state, t0 = s.clock.ms;
      setProfile(s, [{ kind: 'burn', toG: 1, atS: 20, warnS: 15 }]);
      const shots = [], engine = { oneShot: (kind, o) => { shots.push({ kind, ms: s.clock.ms - t0, ...o }); return true; } };
      const siren = createSiren(engine), cycles = new Set();
      for (let k = 0; k < 30_000 / TICK_MS; k++) { g.step(1); siren.frame(s); const c = sirenCycle(gravNow(s), s.clock.ms); if (c !== null) cycles.add(c); }
      const want = SIREN_DB + airDb(airAt(s).pKpa);
      console.log(`      ${shots.length} cycles from +${shots[0]?.ms} to +${shots.at(-1)?.ms} ms, at ${shots[0]?.gainDb.toFixed(2)} dB (${want.toFixed(2)}), low-passed at ${Math.round(shots[0]?.lowHz)} Hz; cycles ${[...cycles].join(',')}; the recipe ${WORLD.siren.layers[0].kind} ${WORLD.siren.layers[0].hz} to ${WORLD.siren.layers[0].toHz} Hz over ${WORLD.siren.layers[0].durS} s`);
      // (each cycle played on the first frame of its second: within a tick of 5 s + i s, the warning's start)
      assert(shots.length === 15 && cycles.size === 15 && shots.every(x => x.kind === 'siren') && shots.every((x, i) => x.ms - (5000 + i * SIREN_CYCLE_MS) >= 0 && x.ms - (5000 + i * SIREN_CYCLE_MS) <= TICK_MS), JSON.stringify(shots.map(x => x.ms)));
      const L = WORLD.siren.layers[0], J = WORLD.sirenJink?.layers?.[0];
      assert(Math.abs(shots[0].gainDb - want) < 1e-9 && L.kind === 'glide' && L.hz === 500 && L.toHz === 1200 && Math.abs(L.durS - 0.98) < 1e-9 && J?.kind === 'glide' && Math.abs(J.durS - 0.48) < 1e-9, `the level and the whoop: ${JSON.stringify({ L, J })}`);
    },
  },
  {
    name: 'grav-hud: the 1MC\'s words on the radio box under "◉ 1MC", and the surprise\'s card as the reflex card reads it, numbered, "Nothing: let it come" last, with no keep line',
    fn() {
      const g = createGame({ scenario: 'sandbox', seed: SEED, env: 'ship-coast' }), s = g.state, said = [];
      g.bus.on('say', (f) => said.push(lineOf(f, s)));
      setProfile(s, [{ kind: 'burn', toG: 1, atS: 2, warnS: 1 }, { kind: 'burn', toG: 0.4, atS: 40, surprise: true, onsetGs: 2 }]);
      g.step(Math.round(30_000 / TICK_MS));
      meOf(s).floatY = 2;
      while (!gravCardOf(s) && s.clock.ms < 1e15) g.step(1);
      const card = reflexOf(gravCardOf(s));
      // (the free card keeps no answer: no keep line; the stop's own card keeps its line (ui-steps))
      assert(card.free === true && card.keepText === null, JSON.stringify({ free: card.free, keepText: card.keepText }));
      console.log(`      ${said.map(l => `${l.head}: "${l.text}"`).join('; ')}; the card "${card.title}": ${card.rows.map(r => r.text).join(' | ')}`);
      assert(said.length >= 2 && said.every(l => l.head === '◉ 1MC') && said[0].text === 'Brace, brace, brace. Secure for burn: one G. Burn in one second.', JSON.stringify(said));
      assert(card.title === 'The drive lights.' && card.rows.map(r => r.text).join('|') === '1 Turn feet aft|2 Nothing: let it come', JSON.stringify(card));
    },
  },
];
