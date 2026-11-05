// Saves (src/core/store.js, src/core/state.js) in node: the slots and the rules of the two career
// modes, the record a save makes, and the determinism contract: a dummy sim run 3,000 ticks twice,
// and once with a save and a load halfway, gives byte-identical JSON; save, load and save again
// give the same bytes at any point. (The IndexedDB part is tested in a page: core-browser.)
import { assert, fmt } from './helpers.mjs';
import { SLOTS, MANUAL_SLOTS, isSlot, autoSlotOf, maySaveTo, recordOf, fileName, setVersion, version } from '../src/core/store.js';
import { newState, toJSON, fromJSON } from '../src/core/state.js';
import { createLoop, NO_INPUT } from '../src/core/loop.js';
import { createBus } from '../src/core/bus.js';
import { rngOf, next, chance, d20 } from '../src/core/rng.js';
import { hash01, digest } from '../src/core/hash.js';
import { MIN_MS, holdTime, releaseTime, isHeld } from '../src/core/clock.js';

// A dummy sim with something of everything the real one will have: a player moved by input at
// walking pace, people wandering on their own stream, a stop-motion hold that waits for a digit, a
// minute layer with needs in closed form and a log, an hourly world, and a skip (a meal) from inside
// a tick. Its input is a script of the tick's number (cosmetic hash: no dice), so two runs are fed
// the same.
const WALK_MS = 1.45;
function dummy(state) {
  const loop = createLoop({ bus: createBus(), onError: (e) => { throw e; }, step(s, input, bus, ctx) {
    const p = s.player;
    if (ctx.held) { if (input.act.includes('digit:1')) { releaseTime(s, 'shoot'); p.shots = (p.shots ?? 0) + 1; } return; }
    p.x = Math.round(((p.x ?? 0) + input.mx * WALK_MS * 0.05) * 1e4) / 1e4;
    p.z = Math.round(((p.z ?? 0) + input.mz * WALK_MS * 0.05) * 1e4) / 1e4;
    if (input.act.includes('ready')) holdTime(s, 'shoot');
    if (input.act.includes('hand')) ctx.skip(20 * MIN_MS, { what: 'chow', outcomes: (st, b, r) => { st.player.ateMs = r.toMs; } });
    const r = rngOf(s, 'people');
    for (const id of ['a', 'b', 'c']) {
      const q = (s.people[id] ??= { x: 0, z: 0 });
      q.x = Math.round((q.x + (next(r) - 0.5) * 0.1) * 1e4) / 1e4;
      q.z = Math.round((q.z + (next(r) - 0.5) * 0.1) * 1e4) / 1e4;
    }
    if (chance(rngOf(s), 0.01)) s.log.push({ ms: s.clock.ms, roll: d20(rngOf(s)) });
  } });
  loop.register('slow', (s, bus, ctx) => { s.player.thirstH = Math.round((ctx.atMs - (s.player.ateMs ?? 0)) / 36e3) / 100; });
  loop.register('world', (s) => { s.world.hours = (s.world.hours ?? 0) + 1; s.world.tension = Math.round(next(rngOf(s, 'world')) * 100); });
  loop.setState(state);
  return loop;
}
// (the script: tick i's input)
function inputAt(i) {
  const act = [];
  if (i % 997 === 400) act.push('ready');
  if (i % 997 === 460) act.push('digit:1');
  if (i === 2200) act.push('hand');
  return { ...NO_INPUT, mx: hash01('mx', i >> 5) < 0.4 ? -1 : hash01('mx', i >> 5) > 0.6 ? 1 : 0, mz: hash01('mz', i >> 6) < 0.5 ? 0 : 1, act };
}
// (every run starts at 08:50 UTC, so the meal at tick 2,200 crosses 09:00 and the hourly layer runs)
const fresh = (seed) => newState(seed, { startMs: 50 * MIN_MS });
function runTicks(loop, from, to) { for (let i = from; i < to; i++) loop.tick(inputAt(i)); }

export default [
  {
    name: 'slots: auto, manual-1 to manual-9, ironman; an Ironman career saves only to its own, a Standard one anywhere else',
    fn() {
      assert(SLOTS.length === 11 && SLOTS[0] === 'auto' && SLOTS.at(-1) === 'ironman' && MANUAL_SLOTS.join() === 'manual-1,manual-2,manual-3,manual-4,manual-5,manual-6,manual-7,manual-8,manual-9', SLOTS.join());
      assert(isSlot('manual-9') && !isSlot('manual-10') && !isSlot('quick'), 'isSlot');
      const std = newState(1), iron = newState(1, { mode: 'ironman' });
      assert(autoSlotOf(std) === 'auto' && autoSlotOf(iron) === 'ironman', 'autosave slots');
      assert(maySaveTo(std, 'manual-3') && maySaveTo(std, 'auto') && !maySaveTo(std, 'ironman'), 'Standard');
      assert(maySaveTo(iron, 'ironman') && !maySaveTo(iron, 'auto') && !maySaveTo(iron, 'manual-1'), 'Ironman');
      console.log(`      ${SLOTS.join(', ')}`);
    },
  },
  {
    name: 'a record: the canonical JSON, stamped with VERSION, the mode, the seed and the game time; a file name from the date',
    fn() {
      const was = version();
      setVersion('0.0.1\n');
      const s = newState(42, { mode: 'ironman', startMs: 90 * MIN_MS });
      const r = recordOf('ironman', s, 'Melas, sol 341');
      assert(r.version === '0.0.1' && r.schema === 1 && r.mode === 'ironman' && r.seed === 42 && r.gameMs === 90 * MIN_MS && r.json === toJSON(s) && r.about === 'Melas, sol 341' && r.savedAt > 0, JSON.stringify({ ...r, json: undefined }));
      assert(fileName(s) === 'olympus-ironman-2351-03-22T09-30-00Z.json', fileName(s));
      setVersion(was);
      console.log(`      record of ${r.json.length} bytes, version ${r.version}; file ${fileName(s)}`);
    },
  },
  {
    name: 'determinism: 3,000 ticks of a dummy sim twice, and with a save and a load at 1,500, give byte-identical saves',
    fn() {
      const t0 = performance.now();
      const A = dummy(fresh(2351)); runTicks(A, 0, 3000);
      const tickUs = (performance.now() - t0) * 1000 / 3000;
      const B = dummy(fresh(2351)); runTicks(B, 0, 3000);
      const C = dummy(fresh(2351)); runTicks(C, 0, 1500);
      const mid = toJSON(C.state);
      assert(toJSON(fromJSON(mid)) === mid, 'save, load, save again changed the bytes at 1,500');
      const D = dummy(fromJSON(mid)); runTicks(D, 1500, 3000);
      const a = toJSON(A.state), b = toJSON(B.state), d = toJSON(D.state);
      assert(a === b, 'two runs of one seed differ');
      assert(a === d, 'a save and load at 1,500 changed the run');
      assert(toJSON(fromJSON(a)) === a, 'save, load, save again changed the bytes at 3,000');
      const s = A.state;
      assert(s.player.shots >= 2 && s.player.ateMs > 0 && s.world.hours === 1 && s.log.length > 10 && !isHeld(s), `the dummy did too little: ${JSON.stringify(s.player)}, log ${s.log.length}`);
      assert(toJSON(dummyRunOf(2352)) !== a, 'another seed gave the same run');
      console.log(`      3000 ticks: ${fmt(tickUs, 1)} µs a tick; game time lived ${fmt((s.clock.ms - 50 * MIN_MS) / 1000, 1)} s (${s.clock.tick} lived ticks, a 20-min meal, ${s.player.shots} stop-motion holds); save ${a.length} bytes, digest ${digest(a)}`);
    },
  },
  {
    name: 'determinism: save, load and save again are byte-identical at every 250th tick of the run',
    fn() {
      const L = dummy(fresh(7));
      let checked = 0;
      for (let i = 0; i < 3000; i++) {
        L.tick(inputAt(i));
        if (i % 250 === 0) { const j = toJSON(L.state); assert(toJSON(fromJSON(j)) === j, `tick ${i}`); checked++; }
      }
      console.log(`      ${checked} points checked, every one identical`);
    },
  },
];

function dummyRunOf(seed) { const L = dummy(fresh(seed)); runTicks(L, 0, 3000); return L.state; }
