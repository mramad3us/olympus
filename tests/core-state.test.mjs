// The saved state (src/core/state.js): the reserved shape, the round trip, $ keys gone at any depth,
// the odd numbers carried, canonical key order, plain data enforced, foreign saves refused, and the
// additive upgrades.
import { assert, fmt } from './helpers.mjs';
import { newState, toJSON, fromJSON, stripRuntime, upgradeState, addUpgrade, copyState, DOMAINS, SAVE_SCHEMA, GAME } from '../src/core/state.js';

const throwsWith = (fn, re) => { try { fn(); } catch (e) { assert(re.test(e.message), `threw "${e.message}", not ${re}`); return e.message; } throw new Error(`did not throw ${re}`); };

export default [
  {
    name: 'newState: the reserved domains, schema 1, the dice seeded, the clock at the asked time',
    fn() {
      const s = newState(1234, { version: '0.0.1', mode: 'ironman', scenario: 'sandbox', startMs: 12_345 });
      assert(Object.keys(s).join() === DOMAINS.join(), `keys ${Object.keys(s)}`);
      assert(SAVE_SCHEMA === 1 && s.meta.schema === 1 && s.meta.game === GAME && s.meta.seed === 1234 && s.meta.mode === 'ironman' && s.meta.version === '0.0.1', JSON.stringify(s.meta));
      assert(s.clock.ms === 12_300 && s.clock.tick === 0 && s.clock.holds.length === 0 && s.meta.createdMs === 12_300, `clock ${JSON.stringify(s.clock)} (startMs rounds down to the tick)`);
      assert(Array.isArray(s.rng.main) && s.rng.main.length === 4 && s.log.length === 0, 'rng and log');
      assert(newState(-1).meta.seed === 4294967295, 'seed as an unsigned 32-bit word');
      throwsWith(() => newState(1, { mode: 'hardcore' }), /mode/);
      console.log(`      domains: ${DOMAINS.join(', ')}; a fresh save is ${toJSON(s).length} bytes`);
    },
  },
  {
    name: 'round trip: save, load, save again gives the same bytes; the loaded state equals the saved',
    fn() {
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
      s.sites.melas = { seed: 7, $geometry: new Float32Array(9), rooms: [{ id: 'bay', $mesh: { a: 1 } }, { id: 'head' }] };
      s.people.x = { name: 'x', $path: [[0, 0], [1, 1]] };
      const json = toJSON(s);
      assert(!json.includes('$'), `a $ key reached the save: ${json.match(/.{20}\$.{20}/)}`);
      const t = fromJSON(json);
      assert(t.sites.melas.rooms.length === 2 && t.sites.melas.rooms[0].id === 'bay' && !('$mesh' in t.sites.melas.rooms[0]) && !('$world' in t), 'stripped wrongly');
      assert(s.$world && s.sites.melas.$geometry, 'stripping touched the live state');
      const copy = stripRuntime(s);
      assert(!('$world' in copy) && copy !== s && copy.sites !== s.sites, 'stripRuntime is not a copy');
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
      const cases = [['people.a.items', new Map()], ['world.seen', new Set()], ['player.when', new Date(0)], ['flags.f', () => 1], ['sites.s.buf', new Uint8Array(2)]];
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
];
