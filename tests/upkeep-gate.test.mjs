// OLYMPUS tests: upkeep's gate (the build sheet v0.0.28 §6 A, §0 item 15, risk 2; F183): with state.armoury.upkeep absent no upkeep field is written and a pull is the pull it was, to the bit.
//
// src/sim/arms/upkeep.js writes only behind upkeepOn (test-armoury's fill sets the gate; no shipped scene does). The pull's golden
// below was recorded on the round's base tree (v0.0.27's snapshot with stage 0, 511f11c2), before upkeep existed: 10,000 pulls of a
// dirty, worn, hot rifle on one stream, every result and the gun after them, in one digest. A pull that went through roundFired
// ungated would foul the gun round by round, move jamP's threshold and the digest with it. The lanes (test-handling by the range bot
// here; test-range by the KD bot and the house's honest tier one and keys private, heavy) are played with the gate absent to their
// cards (test-handling quick to its first string's fifth round, whole in the heavy case) and must save no foul, dust, barrelC, heatMs,
// lube, lubeRd, cleans or fault on any gun, at their pinned ticks and saves; the same lane with the gate set writes them, so the test
// sees what it guards.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { rangeBot } from './bots/range.mjs';
import { kdBot } from './bots/kd.mjs';
import { runHouse } from './bots/house.mjs';
import { botOf } from './flawless.mjs';
import { PIN as HOUSE_PIN } from './house-pin.test.mjs';
import { pull } from '../src/sim/arms/firearms.js';
import { cleanStart, cleanEnd, fitPin, dustOver, upkeepOn, liveOpts, heatsIn } from '../src/sim/arms/upkeep.js';
import { ENV_PRESETS } from '../src/data/places/env.js';
import { stream } from '../src/core/rng.js';
import { digest } from '../src/core/hash.js';

/** 10,000 pulls on the base tree, before upkeep (see the header). */
export const PULLS_GOLDEN = '14e46a398c714b';
/** test-handling by the range bot on 48213, on the base tree: at its first string's fifth round (quick) and at the card (heavy), its tick and save. */
export const HANDLING_PIN = Object.freeze({ five: [548, '0abdc4d78dd384'], card: [1842, '0326d59ccbcdec'] });
/** test-range by kdBot on 48213 from the fill and on 7 from the confirm, on the base tree (.run/v028/lead.md's KD lanes): tick and save. */
export const RANGE_PINS = Object.freeze({ '48213/fill': [5804, '1277564c217721'], '7/confirm': [3803, '0dcc4122ed621e'] });
/** The fields upkeep writes, none of which a gated-off game may hold. */
export const UPKEEP_FIELDS = Object.freeze(['foul', 'dust', 'barrelC', 'heatMs', 'lube', 'lubeRd', 'cleans', 'fault']);

// (10,000 pulls of the gate's dirty rifle; opts given to each pull: { digest, foul, rounds })
function pulls(opts = undefined) {
  const rng = stream(48213, 'upkeep-gate', 'pulls');
  const gun = { type: 'gun', model: 'r7', cond: 0.85, foul: 0.05, dust: 0.15, lube: 'none', barrelC: 360, heatMs: 0, mode: 'semi', chamber: 'live', belief: { chamber: 'live' } };
  const mag = { type: 'mag', fam: 'had30', n: 30, load: 'ball', cond: 0.8, dust: 0.1 }, out = [];
  for (let i = 0; i < 10000; i++) {
    if (mag.n <= 0) mag.n = 30;
    const r = opts === undefined ? pull(rng, gun, mag) : pull(rng, gun, mag, { ...opts, ms: i * 2000 });
    out.push(JSON.stringify(r));
    if (!r.fired || r.stoppage || r.empty) { delete gun.jam; gun.chamber = 'live'; delete gun.cocked; delete gun.locked; delete gun.load; }
  }
  out.push(JSON.stringify(gun));
  return { digest: digest(out.join('\n')), foul: gun.foul, rounds: gun.rounds };
}
// (the guns of a state holding any upkeep field: their ids)
const written = (s) => Object.entries(s.items ?? {}).filter(([, it]) => it?.type === 'gun' && UPKEEP_FIELDS.some(k => it[k] !== undefined)).map(([id]) => id);
// (test-handling by the range bot from the fill, the gate set there or not, to its first string's fifth round (five) or its card)
function handlingLane(gate, to = 'five') {
  const g = createGame({ scenario: 'test-handling', seed: 48213 }), b = rangeBot();
  if (gate) g.state.armoury.upkeep = true;
  const gun = () => g.state.items[g.state.people[g.state.player.id].kit.worn.sling];
  let n = 0; while (n++ < 40_000 && !g.state.armoury.range?.end && !(to === 'five' && (gun().rounds ?? 0) >= 5)) g.step(1, b);
  return { tick: g.state.clock.tick, save: g.digest(), written: written(g.state), gun: gun() };
}
// (test-handling under an environment preset (the URL's &env=, set on the scene's host before the fill), the gate set, by the range
// bot to its third round: the review of v0.0.28 A found the second live round broke the game where the air has no barrel cooling)
function envLane(env) {
  const g = createGame({ scenario: 'test-handling', seed: 48213, env }), b = rangeBot();
  g.state.armoury.upkeep = true;
  const gun = () => g.state.items[g.state.people[g.state.player.id].kit.worn.sling];
  let n = 0, broke = null;
  try { while (n++ < 40_000 && !g.state.armoury.range?.end && (gun().rounds ?? 0) < 3) g.step(1, b); } catch (e) { broke = e.message; }
  const air = ENV_PRESETS[env].air, opts = liveOpts(g.state, 0);
  return { env, air, heats: heatsIn(air), tick: g.state.clock.tick, rounds: gun().rounds ?? 0, foul: gun().foul, barrelC: gun().barrelC, optsAir: opts.air === null ? null : opts.air?.air, broke };
}
// (a preset's lane holds: three rounds, the carbon counted, and the barrel kept exactly where the air has a cooling constant)
const envOk = (r) => !r.broke && r.rounds === 3 && Math.abs(r.foul - 3 * 0.0012) < 1e-9 && (r.heats ? r.barrelC !== undefined && r.optsAir === r.air : r.barrelC === undefined && r.optsAir === null);
const envLine = (r) => `${r.env} (${r.air}${r.heats ? '' : ', no barrel cooling'}): tick ${r.tick}, ${r.rounds} rounds, foul ${r.foul}, barrel ${r.barrelC ?? 'none kept'}${r.broke ? `, BROKE: ${r.broke}` : ''}`;

export default [
  {
    name: 'F183: with the gate absent a pull is the pull it was, to the bit: 10,000 pulls of a dirty, worn, hot rifle digest as on the base tree before upkeep; given live (the gate\'s options) the same pulls foul the rifle round by round and digest otherwise',
    fn() {
      const off = pulls(), none = pulls({}), live = pulls({ live: true, air: { air: 'mars-melas', airC: -10 } });
      console.log(`      no options: ${off.digest} (the base tree's ${PULLS_GOLDEN}), foul ${off.foul}, ${off.rounds} rounds; options without live: ${none.digest}`);
      console.log(`      live: ${live.digest}, foul ${live.foul} (at most 1) after ${live.rounds} rounds`);
      assert(off.digest === PULLS_GOLDEN && none.digest === PULLS_GOLDEN && off.foul === 0.05, JSON.stringify({ off, none }));
      assert(live.digest !== PULLS_GOLDEN && live.foul > 0.05 && live.foul <= 1, JSON.stringify(live));
    },
  },
  {
    name: 'F183: test-handling by the range bot to its first string\'s fifth round with the gate absent saves no upkeep field on any gun, at its pinned tick and save; the same lane with the gate set fouls the rifle round by round (so the gate is the one switch); liveOpts is empty off the gate',
    fn() {
      const off = handlingLane(false), on = handlingLane(true);
      const g = createGame({ scenario: 'test-handling', seed: 48213 }), opts = liveOpts(g.state, 0), gate = upkeepOn(g.state);
      console.log(`      gate absent, to the first string's fifth round: tick ${off.tick}, save ${off.save} (pinned ${HANDLING_PIN.five.join(', ')}), guns with an upkeep field: ${off.written.length}`);
      console.log(`      gate set: tick ${on.tick}, guns written ${on.written.join(', ')}: rounds ${on.gun.rounds}, foul ${on.gun.foul}, barrel ${on.gun.barrelC} °C; liveOpts off the gate ${JSON.stringify(opts)} (gate ${gate})`);
      assert(off.tick === HANDLING_PIN.five[0] && off.save === HANDLING_PIN.five[1] && off.written.length === 0, JSON.stringify(off));
      assert(on.written.length === 1 && on.gun.foul > 0 && Math.abs(on.gun.foul - on.gun.rounds * 0.0012) < 1e-9, JSON.stringify(on.gun));
      assert(JSON.stringify(opts) === '{}' && gate === false, JSON.stringify({ opts, gate }));
    },
  },
  {
    name: 'F183: upkeep\'s writers write nothing ungated: the strip (a live round left in), the bench\'s roll, the pin fitted and the dust leave the state byte for byte',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213 }), s = g.state, pid = s.player.id, gunId = s.people[pid].kit.worn.sling;
      Object.assign(s.items[gunId], { chamber: 'live', foul: 0.02, fault: 'pin' });
      const before = g.save();
      const a = cleanStart(s, g.bus, pid, gunId), b = cleanEnd(s, g.bus, pid, gunId, { tempo: 'normal' });
      fitPin(s, gunId);
      const after = g.save();
      console.log(`      ungated: the strip ${JSON.stringify(a)}, the bench ${JSON.stringify(b)}, the save ${after === before ? 'byte for byte' : 'CHANGED'}`);
      assert(a.found === null && b === null && after === before, JSON.stringify({ a, b }));
      // (dustOver is a scene's to call: it is pure on the gun given, so a scene off the gate never calls it; the gate's own read)
      const gun = { type: 'gun', model: 'r7' }; dustOver(gun, { minutes: 1, airDust: 0.2 });
      assert(gun.dust > 0, 'dustOver writes the gun it is given');
    },
  },
  {
    name: 'F183: a live rifle fires on in an air with no barrel cooling (the URL\'s &env=ceres-drum, the belt\'s station, and europa-surface, vacuum): test-handling with the gate set by the range bot to its third round, the carbon counted and no barrel kept, where the second round broke the game (the review of v0.0.28 A)',
    fn() {
      const rows = ['ceres-drum', 'europa-surface'].map(envLane);
      for (const r of rows) console.log(`      ${envLine(r)}`);
      for (const r of rows) assert(envOk(r), JSON.stringify(r));
    },
  },
  {
    name: 'F183 (heavy): test-handling with the gate set under every environment preset (src/data/places/env.js ENV_PRESETS, the URL\'s &env=) fires three rounds: the barrel kept where its air has a cooling constant, none where it has not, never a break',
    heavy: true,
    fn() {
      const rows = Object.keys(ENV_PRESETS).map(envLane);
      for (const r of rows) console.log(`      ${envLine(r)}`);
      console.log(`      ${rows.filter(r => !r.heats).length} of ${rows.length} presets in an air with no barrel cooling: ${rows.filter(r => !r.heats).map(r => r.env).join(', ')}`);
      for (const r of rows) assert(envOk(r), JSON.stringify(r));
    },
  },
  {
    name: 'F183 (heavy): test-handling by the range bot, test-range by the KD bot (48213 from the fill, 7 from the confirm) and the house\'s honest tier one and keys private on 48213, played to their cards with the gate absent, save no upkeep field, at their pinned ticks and saves',
    heavy: true,
    fn() {
      const h = handlingLane(false, 'card');
      const rows = [{ lane: 'test-handling 48213/fill', tick: h.tick, save: h.save, want: HANDLING_PIN.card, written: h.written }];
      for (const [key, [tick, save]] of Object.entries(RANGE_PINS)) {
        const [seed, setup] = key.split('/'), g = createGame({ scenario: 'test-range', seed: Number(seed), ...(setup === 'fill' ? {} : { setup }) }), b = kdBot();
        let n = 0; while (n++ < 72_000 && !g.state.armoury.range?.end) g.step(1, b);
        rows.push({ lane: `test-range ${key}`, tick: g.state.clock.tick, save: g.digest(), want: [tick, save], written: written(g.state) });
      }
      for (const [bot, tier] of [['honest', 'tierone'], ['keys', 'private']]) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier });
        runHouse(g, botOf(bot, { seed: 48213 }), { maxMs: 30 * 60_000 });
        const pin = HOUSE_PIN[`${bot}/${tier}/48213/standard`];
        rows.push({ lane: `house ${bot}/${tier}/48213`, tick: g.state.clock.tick, save: g.digest(), want: [pin[0], pin[2]], written: written(g.state) });
      }
      for (const r of rows) console.log(`      ${r.lane}: tick ${r.tick}, save ${r.save} (pinned ${r.want.join(', ')}), guns with an upkeep field ${r.written.length}`);
      for (const r of rows) assert(r.tick === r.want[0] && r.save === r.want[1] && r.written.length === 0, JSON.stringify(r));
    },
  },
];
