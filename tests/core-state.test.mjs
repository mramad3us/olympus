// The saved state (src/core/state.js): the reserved shape (TECH §6.1's 25 keys at their empty
// defaults), the round trip, $ keys gone at any depth, the odd numbers carried, canonical key order,
// plain data enforced, foreign saves refused, the additive upgrades, 0.0.1's 'sites' become
// 'places' once, and a 0.0.1 sandbox save upgraded and played 400 ticks.
import { assert, fmt } from './helpers.mjs';
import { newState, toJSON, fromJSON, stripRuntime, upgradeState, addUpgrade, copyState, resetDomains, DOMAINS, SAVE_SCHEMA, GAME } from '../src/core/state.js';
import { createLoop } from '../src/core/loop.js';
import { recordingBus } from '../src/core/bus.js';
import { TICK_MS } from '../src/core/clock.js';
import { createSim } from '../src/sim/game.js';
import { scriptInput } from './game-dummy.mjs';
import { playerActor } from '../src/core/ids.js';

// (a v0.0.1 sandbox save, made by v0.0.1's own state.js and main.js's sandbox fill, 400 ticks in:
// its clock off the tick grid, its player a stub, its longitude in 'sites')
const V001_SANDBOX = '{"clock":{"holds":[],"ms":29196348,"tick":400},"flags":{},"log":[],"meta":{"createdMs":29176348,"game":"olympus","mode":"standard","scenario":"sandbox","schema":1,"seed":4,"version":"0.0.1"},"people":{},"player":{"name":"Private (stub)","x":3.625,"z":-1.45},"rng":{"main":[3383045941,133646322,2179121275,970576573]},"sites":{"sandbox":{"lonEDeg":-72}},"world":{}}';

const throwsWith = (fn, re) => { try { fn(); } catch (e) { assert(re.test(e.message), `threw "${e.message}", not ${re}`); return e.message; } throw new Error(`did not throw ${re}`); };

export default [
  {
    name: 'newState: TECH §6.1\'s 25 keys at their empty defaults, schema 1, the dice seeded, the clock at the asked time',
    fn() {
      resetDomains();                                              // (these are the core's own states: no game's domains registered)
      const s = newState(1234, { version: '0.0.1', mode: 'ironman', scenario: 'sandbox', startMs: 12_345 });
      assert(DOMAINS.length === 25 && Object.keys(s).join() === DOMAINS.join(), `keys ${Object.keys(s)}`);
      assert(SAVE_SCHEMA === 1 && s.meta.schema === 1 && s.meta.game === GAME && s.meta.seed === 1234 && s.meta.mode === 'ironman' && s.meta.version === '0.0.1', JSON.stringify(s.meta));
      assert(s.meta.worldId === 'w-1234' && JSON.stringify(s.meta.next) === '{}' && s.meta.errors.length === 0, JSON.stringify(s.meta));
      assert(s.clock.ms === 12_300 && s.clock.tick === 0 && s.clock.holds.length === 0 && s.clock.seq === 0 && s.meta.createdMs === 12_300, `clock ${JSON.stringify(s.clock)} (startMs rounds down to the tick)`);
      assert(Array.isArray(s.rng.main) && s.rng.main.length === 4 && s.log.length === 0, 'rng and log');
      const empties = { events: '[]', skip: 'null', talk: 'null', stop: 'null', career: 'null', places: '{"live":null,"sites":{}}', actors: '{"list":[]}',
        armoury: '{"guns":{},"ammoIssues":[]}', player: '{"id":null,"actor":null,"waypoint":null,"presets":{},"keeps":{}}',
        time: '{"chapter":null,"voyage":null,"pod":{},"alarms":[],"interrupts":{"perSol":0,"perSkip":0},"liveSinceSaveMs":0,"slowToMs":null}' };
      for (const [k, want] of Object.entries(empties)) assert(JSON.stringify(s[k]) === want, `${k}: ${JSON.stringify(s[k])}`);
      assert(newState(-1).meta.seed === 4294967295, 'seed as an unsigned 32-bit word');
      throwsWith(() => newState(1, { mode: 'hardcore' }), /mode/);
      console.log(`      domains: ${DOMAINS.join(', ')}; a fresh save is ${toJSON(s).length} bytes`);
    },
  },
  {
    name: 'round trip: save, load, save again gives the same bytes; the loaded state equals the saved',
    fn() {
      resetDomains();
      const s = newState(99, { version: '0.0.1' });
      Object.assign(s.player, { name: 'Pvt. Ada Reyes', x: 1.25, z: -3.5, kit: [{ id: 'm1', rounds: 30 }, { id: 'm2', rounds: 0 }] });
      s.people.sgt = { name: 'Sgt. Okafor', gauges: { fear: 0, trust: 2, affinity: -1 } };
      s.log.push({ ms: 0, text: 'Reveille.' });
      const a = toJSON(s), t = fromJSON(a), b = toJSON(t), c = toJSON(fromJSON(b));
      assert(a === b && b === c, 'bytes changed through a load');
      assert(t.player.kit[1].rounds === 0 && t.people.sgt.gauges.affinity === -1 && t.player.z === -3.5, 'a value changed');
      assert(toJSON(copyState(s)) === a, 'copyState');
      console.log(`      ${a.length} bytes, identical after two loads`);
    },
  },
  {
    name: '$ keys: runtime only, dropped at any depth (top, nested, inside arrays), never in the save',
    fn() {
      const s = newState(5);
      s.$world = { grid: new Map([[1, 2]]) };                      // (a Map is fine under a $ key: it is never saved)
      s.places.sites.melas = { seed: 7, $geometry: new Float32Array(9), rooms: [{ id: 'bay', $mesh: { a: 1 } }, { id: 'head' }] };
      s.people.x = { name: 'x', $path: [[0, 0], [1, 1]] };
      const json = toJSON(s);
      assert(!json.includes('$'), `a $ key reached the save: ${json.match(/.{20}\$.{20}/)}`);
      const t = fromJSON(json);
      assert(t.places.sites.melas.rooms.length === 2 && t.places.sites.melas.rooms[0].id === 'bay' && !('$mesh' in t.places.sites.melas.rooms[0]) && !('$world' in t), 'stripped wrongly');
      assert(s.$world && s.places.sites.melas.$geometry, 'stripping touched the live state');
      const copy = stripRuntime(s);
      assert(!('$world' in copy) && copy !== s && copy.places !== s.places, 'stripRuntime is not a copy');
      console.log(`      $world, $geometry, $mesh, $path dropped; live state untouched; ${json.length} bytes`);
    },
  },
  {
    name: 'odd numbers: ±Infinity and NaN carried as strings and read back as numbers; -0 written as 0; undefined dropped',
    fn() {
      const s = newState(5);
      Object.assign(s.world, { never: Infinity, before: -Infinity, broken: NaN, zero: -0, gone: undefined, list: [1, undefined, Infinity] });
      const json = toJSON(s), t = fromJSON(json);
      assert(json.includes('"never":"__inf__"') && json.includes('"before":"__-inf__"') && json.includes('"broken":"__nan__"'), json);
      assert(t.world.never === Infinity && t.world.before === -Infinity && Number.isNaN(t.world.broken), 'not read back');
      assert(Object.is(t.world.zero, 0) && !('gone' in t.world) && t.world.list[1] === null && t.world.list[2] === Infinity, JSON.stringify(t.world));
      console.log(`      Infinity → "__inf__", -Infinity → "__-inf__", NaN → "__nan__"; [1, undefined, Infinity] → ${JSON.stringify(stripRuntime(s).world.list)}`);
    },
  },
  {
    name: 'canonical: the same data with keys added in another order saves to the same bytes',
    fn() {
      const a = newState(8), b = newState(8);
      a.player = { name: 'R', body: { water: 1, food: 2 }, kit: [] };
      b.player = { kit: [], body: { food: 2, water: 1 }, name: 'R' };
      a.people = { zed: 1, amy: 2, 10: 'ten', 9: 'nine' };
      b.people = { 9: 'nine', amy: 2, 10: 'ten', zed: 1 };
      const reordered = {}; for (const k of Object.keys(b).reverse()) reordered[k] = b[k];
      assert(toJSON(a) === toJSON(b) && toJSON(a) === toJSON(reordered), 'key order leaked into the save');
      console.log(`      two insertion orders (and the domains reversed): one save, ${toJSON(a).length} bytes`);
    },
  },
  {
    name: 'plain data: a Map, a Set, a class, a function or a typed array outside a $ key throws with its path',
    fn() {
      const cases = [['people.a.items', new Map()], ['world.seen', new Set()], ['player.when', new Date(0)], ['flags.f', () => 1], ['places.sites.s.buf', new Uint8Array(2)]];
      const said = [];
      for (const [path, bad] of cases) {
        const s = newState(1), keys = path.split('.');
        let o = s; for (const k of keys.slice(0, -1)) o = (o[k] ??= {});
        o[keys.at(-1)] = bad;
        said.push(throwsWith(() => toJSON(s), new RegExp(path.replace(/\./g, '\\.'))));
      }
      console.log(`      e.g. "${said[0]}"`);
    },
  },
  {
    name: 'reading: refuses what isn\'t an OLYMPUS save, and a newer schema',
    fn() {
      throwsWith(() => fromJSON('not json'), /not a save file/);
      throwsWith(() => fromJSON('{"game":"tradecraft","schema":1}'), /not an OLYMPUS save/);
      throwsWith(() => fromJSON(JSON.stringify({ meta: { game: 'longhaul' } })), /not an OLYMPUS save/);
      const s = newState(1); s.meta.schema = SAVE_SCHEMA + 1;
      throwsWith(() => fromJSON(toJSON(s)), /newer game/);
      const ok = fromJSON(newState(3));                             // (an object is taken too)
      assert(ok.meta.seed === 3, 'an object state');
      console.log(`      refused: text, tradecraft's and LONGHAUL's saves, schema ${SAVE_SCHEMA + 1}`);
    },
  },
  {
    name: 'upgrades: an older save gets the missing domains, and each domain\'s own fill, once',
    fn() {
      resetDomains();
      const old = { meta: { game: 'olympus', schema: 1, seed: 77 }, clock: { ms: 5000 } };
      let calls = 0;
      addUpgrade('test-needs', (s) => { calls++; s.player.needs ??= { waterMs: 0 }; });
      addUpgrade('test-needs', (s) => { calls++; s.player.needs ??= { waterMs: 0 }; });   // (the same id: replaces, not adds)
      const s = fromJSON(JSON.stringify(old));
      assert(DOMAINS.every(k => k in s), `missing ${DOMAINS.filter(k => !(k in s))}`);
      assert(s.clock.tick === 0 && s.clock.holds.length === 0 && s.meta.mode === 'standard' && s.meta.createdMs === 5000 && s.rng.main.length === 4, JSON.stringify(s.meta));
      assert(calls === 1 && s.player.needs.waterMs === 0, `upgrade ran ${calls} times`);
      const again = toJSON(upgradeState(fromJSON(toJSON(s))));
      assert(again === toJSON(s), 'upgrading an up-to-date save changed it');
      addUpgrade('test-needs', () => {});                           // (leave nothing behind for other tests)
      console.log(`      a two-key save filled to ${DOMAINS.length} domains; a domain's fill ran once; upgrading twice changes nothing (${fmt(again.length, 0)} bytes)`);
    },
  },

  {
    name: 'upgrades: 0.0.1\'s sites becomes places once; a fresh state loads unchanged, its keys and seq filled',
    fn() {
      resetDomains();
      const old = JSON.parse(V001_SANDBOX);
      const s = upgradeState(JSON.parse(V001_SANDBOX));
      assert(!('sites' in s) && JSON.stringify(s.places) !== undefined && s.places.sites && s.flags['mig:sites-places'] === true, JSON.stringify({ places: s.places, flags: s.flags }));
      assert(s.meta.worldId === 'w-4' && s.clock.seq === 0 && s.clock.ms % TICK_MS === 0 && s.clock.ms === Math.floor(old.clock.ms / TICK_MS) * TICK_MS, JSON.stringify(s.clock));
      assert(DOMAINS.every(k => k in s) && Object.keys(s).filter(k => !DOMAINS.includes(k)).length === 0, `keys ${Object.keys(s)}`);
      const once = toJSON(s), twice = toJSON(upgradeState(JSON.parse(once)));
      assert(once === twice, 'upgrading an upgraded save changed it');
      const fresh = newState(9), json = toJSON(fresh);
      assert(toJSON(fromJSON(json)) === json && !('mig:sites-places' in fromJSON(json).flags), 'a fresh state changed through a load');
      console.log(`      0.0.1's sites {"sandbox":{"lonEDeg":-72}} gone, places ${JSON.stringify(s.places)}, flag set; clock ${old.clock.ms} → ${s.clock.ms} (on the tick grid); a second upgrade and a fresh state's load change nothing`);
    },
  },
  {
    name: 'a 0.0.1 sandbox save upgrades to the sandbox and runs 400 ticks without error',
    fn() {
      const errors = [];
      const bus = recordingBus({ onError: (e, type) => errors.push(`${type}: ${e.message}`) });
      const loop = createLoop({ bus, onError: (e, where) => errors.push(`${where}: ${e.message}`) });
      const sim = createSim({ loop, bus });
      const s = fromJSON(V001_SANDBOX);
      loop.setState(s);
      const me = playerActor(s);
      assert(s.player.id && s.people[s.player.id] && me && s.places.live?.site && s.meta.seed === 4 && s.meta.version === '0.0.1', JSON.stringify({ player: s.player, live: s.places.live }));
      // (TECH §6.1's player record and nothing else: 0.0.1's name, x and z gone, where the actor is)
      assert(Object.keys(s.player).sort().join() === 'actor,id,keeps,presets,waypoint', `player keys ${Object.keys(s.player).sort()}: ${JSON.stringify(s.player)}`);
      const x0 = me.x, z0 = me.z;
      let moved = 0;
      for (let i = 0; i < 400; i++) if (loop.tick(scriptInput(s.clock.seq, { hands: false }))) moved++;
      assert(!errors.length && loop.stats.lostTicks === 0 && s.clock.tick === 400 + moved && s.clock.seq === 400 && moved >= 370, `${errors.join('; ')} (lost ${loop.stats.lostTicks}, tick ${s.clock.tick}, moved ${moved})`);
      console.log(`      loaded as ${s.player.id} (actor ${s.player.actor}) at ${s.places.live.site}/${s.places.live.area}, seed and version kept; 400 ticks, none lost (${400 - moved} held for G's choice); walked to ${fmt(me.x - x0, 2)}, ${fmt(me.z - z0, 2)} m; ${sim.stats.slowSteps} slow steps; ${s.events.length} event${s.events.length === 1 ? '' : 's'} queued`);
    },
  },
];
