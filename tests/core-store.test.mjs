// Saves (src/core/store.js v2, src/core/state.js) in node: slots per world and the rules of the two
// career modes; the record a save makes (its JSON, digest, marks, file name); the rotation of
// auto-prev and ironman-prev on time (TECH §7.4: 30 doors in 4 game minutes leave auto-prev alone);
// the day and edge slots; a damaged record reported with the slots that could stand in, Ironman's
// recovery marked; the bug report's fields (TECH §7.6); profile and cache; a version-1 database
// opened as version 2; and the determinism contract on a dummy sim (kept from 0.0.1): 3,000 ticks
// twice, and with a save and a load halfway, give byte-identical JSON.
//
// The IndexedDB part runs on a small IndexedDB of this file's own (fakeIndexedDB below: object
// stores with key paths, transactions whose requests complete in order and commit when none is
// left, values structured-cloned), given to the store with useIndexedDB(), and a clock of the
// test's own with useClock(), so 5 real minutes pass in a line. The browser's own IndexedDB is
// tested in a page (store-browser).
import { assert, fmt } from './helpers.mjs';
import * as store from '../src/core/store.js';
import {
  SLOT_NAMES, MANUAL_SLOTS, HIDDEN_NAMES, LEGACY_WORLD, AUTO_PREV_GAME_MS, AUTO_PREV_REAL_MS, DB_VERSION,
  slotOf, parseSlot, isSlot, autoSlotOf, maySaveTo, recordOf, summaryOf, planAutosave, offersFor, stateOfRecord,
  fileName, reportName, reportOf, markImported, setVersion, version, useClock, useIndexedDB, utf8Bytes, SaveError,
} from '../src/core/store.js';
import { newState, toJSON, fromJSON } from '../src/core/state.js';
import { createLoop, NO_INPUT } from '../src/core/loop.js';
import { createBus } from '../src/core/bus.js';
import { rngOf, next, chance, d20 } from '../src/core/rng.js';
import { hash01, digest } from '../src/core/hash.js';
import { MIN_MS, SEC_MS, holdTime, releaseTime, isHeld } from '../src/core/clock.js';

// ---- a small IndexedDB, enough for the store ----
// One open() per call; onupgradeneeded with oldVersion; a transaction's requests run one at a time
// in the order made (as IndexedDB's do on one store), each a turn of the event loop later, and the
// transaction completes when its last request's callback has made no more. Counts transactions, so
// a test can say an autosave is one.
export function fakeIndexedDB() {
  const dbs = new Map();
  const later = (fn) => setTimeout(fn, 0);
  const stats = { transactions: 0, puts: 0 };
  function connection(d) {
    return {
      objectStoreNames: { contains: (n) => d.stores.has(n), get length() { return d.stores.size; } },
      createObjectStore(n, { keyPath }) { if (d.stores.has(n)) throw new Error(`ConstraintError: ${n}`); d.stores.set(n, { keyPath, data: new Map() }); },
      get version() { return d.version; },
      close() {},
      onversionchange: null,
      transaction(names, mode = 'readonly') {
        stats.transactions++;
        const list = [].concat(names), queue = [];
        for (const n of list) if (!d.stores.has(n)) throw new Error(`NotFoundError: no store '${n}'`);
        let pumping = false, done = false;
        const t = { oncomplete: null, onerror: null, onabort: null, error: null, abort() { done = true; later(() => t.onabort?.()); } };
        const pump = () => {
          if (pumping || done) return;
          pumping = true;
          later(() => {
            pumping = false;
            if (done) return;
            const job = queue.shift();
            if (!job) { done = true; t.oncomplete?.(); return; }
            try { job.req.result = job.op(); job.req.onsuccess?.(); }
            catch (e) { done = true; t.error = e; job.req.error = e; t.onerror?.(); return; }
            pump();
          });
        };
        const request = (op) => { const req = { result: undefined, error: null, onsuccess: null }; queue.push({ op, req }); pump(); return req; };
        const writes = () => { if (mode !== 'readwrite') throw new Error('ReadOnlyError'); };
        t.objectStore = (n) => {
          if (!list.includes(n)) throw new Error(`NotFoundError: '${n}' is not in this transaction`);
          const s = d.stores.get(n);
          return {
            get: (k) => request(() => (s.data.has(k) ? structuredClone(s.data.get(k)) : undefined)),
            getAll: () => request(() => [...s.data.keys()].sort().map(k => structuredClone(s.data.get(k)))),
            put: (v) => { writes(); return request(() => { stats.puts++; s.data.set(v[s.keyPath], structuredClone(v)); return v[s.keyPath]; }); },
            delete: (k) => { writes(); return request(() => { s.data.delete(k); }); },
            clear: () => { writes(); return request(() => { s.data.clear(); }); },
          };
        };
        pump();
        return t;
      },
    };
  }
  return {
    dbs, stats,
    // (with no version: the database as it stands, made at version 1 if it is new; a lower version than it has: a VersionError, as the spec says)
    open(name, ver) {
      const req = { result: null, error: null, onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null };
      later(() => {
        let d = dbs.get(name);
        if (!d) dbs.set(name, d = { version: 0, stores: new Map() });
        if (ver === undefined) ver = Math.max(1, d.version);
        if (ver < d.version) { req.error = Object.assign(new Error(`VersionError: ${name} is at version ${d.version}, not ${ver}`), { name: 'VersionError' }); req.onerror?.(); return; }
        req.result = connection(d);
        if (ver > d.version) { const oldVersion = d.version; d.version = ver; req.onupgradeneeded?.({ oldVersion, newVersion: ver }); }
        req.onsuccess?.();
      });
      return req;
    },
  };
}

// A save made by v0.0.1 itself (its tag's state.js newState, main.js's sandbox fill, 200 ticks of
// its stub walk east: made in a scratch worktree of v0.0.1, 2026-11-05), as its store wrote it in
// slot 'auto'. store-browser puts the same into a real version-1 database.
export const LEGACY_V001_JSON = '{"clock":{"holds":[],"ms":10000,"tick":200},"flags":{},"log":[],"meta":{"createdMs":0,"game":"olympus","mode":"standard","scenario":"sandbox","schema":1,"seed":4,"version":"0.0.1"},"people":{},"player":{"name":"Private (stub)","x":14.5,"z":0},"rng":{"main":[3383045941,133646322,2179121275,970576573]},"sites":{"sandbox":{"lonEDeg":-72}},"world":{}}';

// A store of the test's own: a fresh IndexedDB, a clock that moves when told, the version stamped.
function fresh({ realMs = 1_793_900_000_000 } = {}) {
  const idb = fakeIndexedDB(), clock = { ms: realMs };
  useIndexedDB(idb);
  useClock(() => clock.ms);
  setVersion('0.0.2');
  return { idb, clock, done() { useIndexedDB(null); useClock(); } };
}
// A state at game ms, in its world, of a mode: the save's contents don't matter here, only where they go.
function stateAt(gameMs, { seed = 1, mode = 'standard', worldId = null } = {}) {
  const s = newState(seed, { mode, startMs: 0 });
  s.meta.worldId = worldId ?? `w-${seed}`;
  s.clock.ms = gameMs;
  return s;
}
const ageText = (r, now) => (r ? `${fmt((now.gameMs - r.gameMs) / MIN_MS, 1)} game min, ${fmt((now.savedAt - r.savedAt) / SEC_MS, 0)} real s` : 'none');

// A dummy sim with something of everything the real one will have: a player moved by input at
// walking pace, people wandering on their own stream, a stop-motion hold that waits for a digit, a
// minute layer with needs in closed form and a log, an hourly world, and a skip (a meal) from inside
// a tick. Its input is a script of the tick's number (cosmetic hash: no dice), so two runs are fed
// the same. (Kept from 0.0.1; the loop's built skip, which stays for these and core-loop's tests.)
const WALK_MS = 1.45;
function dummy(state) {
  const loop = createLoop({ bus: createBus(), onError: (e) => { throw e; }, step(s, input, bus, ctx) {
    const p = s.player;
    if (ctx.held) { if (input.act.includes('digit:1')) { releaseTime(s, 'shoot'); p.shots = (p.shots ?? 0) + 1; } return; }
    p.x = Math.round(((p.x ?? 0) + input.mx * WALK_MS * 0.05) * 1e4) / 1e4;
    p.z = Math.round(((p.z ?? 0) + input.mz * WALK_MS * 0.05) * 1e4) / 1e4;
    if (input.act.includes('ready')) holdTime(s, 'shoot');
    if (input.act.includes('hand')) loop.skip(20 * MIN_MS, { what: 'chow', outcomes: (st, b, r) => { st.player.ateMs = r.toMs; } });
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
// (every run starts at 08:50 UTC, so the meal at tick 2,200 crosses 09:00 and the hourly layer runs.
// The state starts as this process loads it, through fromJSON once: src/core/state.js keeps the
// upgrades of the last sim composed in the process (core-loop's, core-queue's), and they fill a bare
// state on its first load (the game's recurring job posted); filled once, a load changes nothing)
const dummyState = (seed) => { const s = fromJSON(toJSON(newState(seed, { startMs: 50 * MIN_MS }))); s.player ??= {}; s.people ??= {}; s.world ??= {}; return s; };
function runTicks(loop, from, to) { for (let i = from; i < to; i++) loop.tick(inputAt(i)); }
function dummyRunOf(seed) { const L = dummy(dummyState(seed)); runTicks(L, 0, 3000); return L.state; }

export default [
  {
    name: 'slots are <world>:<name>; an unprefixed slot is w-legacy\'s; an Ironman career saves only to its own, a Standard one to the rest of its world, nobody to a -prev by hand',
    fn() {
      assert(SLOT_NAMES.length === 15 && MANUAL_SLOTS.length === 9 && HIDDEN_NAMES.join() === 'auto-prev,ironman-prev', SLOT_NAMES.join());
      assert(slotOf('w-48213', 'auto') === 'w-48213:auto', slotOf('w-48213', 'auto'));
      let threw = 0;
      for (const [w, n] of [['w-1', 'quick'], ['w-1', 'manual-10'], ['', 'auto'], ['w:1', 'auto']]) { try { slotOf(w, n); } catch { threw++; } }
      assert(threw === 4, `slotOf took a bad slot (${threw} of 4 refused)`);
      const p = parseSlot('w-48213-2:manual-3'), legacy = parseSlot('auto');
      assert(p.world === 'w-48213-2' && p.name === 'manual-3' && legacy.world === LEGACY_WORLD && legacy.name === 'auto', JSON.stringify({ p, legacy }));
      assert(isSlot('w-1:manual-9') && isSlot('manual-9') && !isSlot('w-1:manual-10') && !isSlot('quick'), 'isSlot');
      const std = stateAt(0, { seed: 7 }), iron = stateAt(0, { seed: 7, mode: 'ironman' });
      assert(autoSlotOf(std) === 'w-7:auto' && autoSlotOf(iron) === 'w-7:ironman', `${autoSlotOf(std)} ${autoSlotOf(iron)}`);
      const yes = (s, slots) => slots.every(x => maySaveTo(s, x)), no = (s, slots) => slots.every(x => !maySaveTo(s, x));
      assert(yes(std, ['auto', 'day', 'edge', 'manual-1', 'manual-9', 'w-7:manual-3']), 'Standard: auto, day, edge, manual');
      assert(no(std, ['ironman', 'auto-prev', 'ironman-prev', 'w-8:manual-1', 'manual-10', 'quick']), 'Standard: not ironman, a -prev, another world');
      assert(yes(iron, ['ironman', 'w-7:ironman']) && no(iron, ['auto', 'day', 'edge', 'manual-1', 'ironman-prev', 'w-8:ironman']), 'Ironman: its own slot only');
      const noWorld = newState(9); delete noWorld.meta.worldId;
      assert(autoSlotOf(noWorld) === 'w-9:auto', `a state without worldId saves in the world of its seed: ${autoSlotOf(noWorld)}`);
      console.log(`      ${SLOT_NAMES.join(', ')}; hidden ${HIDDEN_NAMES.join(', ')}; 'auto' alone reads as ${legacy.world}:${legacy.name}`);
    },
  },
  {
    name: 'a record: the canonical JSON and its digest, stamped with VERSION, mode, seed, game time and marks; a summary without the JSON; file names from the world and the date',
    fn() {
      const was = version();
      setVersion('0.0.2\n');
      const s = stateAt(23_480_400_000, { seed: 42, mode: 'ironman', worldId: 'w-42' });
      s.meta.debugUsed = true; s.meta.imported = true;
      for (let i = 0; i < 2000; i++) s.log.push({ seq: i + 1, atMs: s.clock.ms + i * 1000, kind: 'note', text: `line ${i} · Ngũgĩ` });
      const t0 = performance.now(), r = recordOf('w-42:ironman', s, 'Ironman · Sol 590');
      const encodeMs = performance.now() - t0;
      assert(r.version === '0.0.2' && r.schema === 1 && r.mode === 'ironman' && r.seed === 42 && r.gameMs === 23_480_400_000 && r.world === 'w-42' && r.career === null, JSON.stringify({ ...r, json: undefined }));
      assert(r.json === toJSON(s) && r.digest === digest(r.json) && /^[0-9a-f]{14}$/.test(r.digest), 'json and digest');
      assert(r.marks.join() === 'debugUsed,imported' && r.about === 'Ironman · Sol 590' && r.savedAt > 0, `marks ${r.marks}`);
      assert(r.bytes === Buffer.byteLength(r.json, 'utf8') && r.bytes > r.json.length, `bytes ${r.bytes} against ${Buffer.byteLength(r.json, 'utf8')} (json ${r.json.length} characters)`);
      assert(utf8Bytes('ab') === 2 && utf8Bytes('·') === 2 && utf8Bytes('€') === 3 && utf8Bytes('𝄞') === 4, 'utf8Bytes');
      const sum = summaryOf(r);
      assert(!('json' in sum) && sum.name === 'ironman' && sum.world === 'w-42' && sum.digest === r.digest, JSON.stringify(sum));
      const old = summaryOf({ slot: 'auto', json: '{"a":1}', about: 'x', version: '0.0.1', schema: 1, mode: 'standard', seed: 4, gameMs: 0, savedAt: 5 });
      assert(old.world === LEGACY_WORLD && old.name === 'auto' && old.bytes === 7 && old.marks.length === 0, `a v0.0.1 record's summary: ${JSON.stringify(old)}`);
      assert(fileName(s) === 'olympus-w-42-ironman-2351-12-19T02-20-00Z.json', fileName(s));
      assert(reportName(s) === 'olympus-report-w-42-2351-12-19T02-20-00Z.json', reportName(s));
      setVersion(was);
      console.log(`      a 2,000-line log: ${fmt(r.bytes / 1024, 1)} KB (${r.json.length} characters), encoded and digested in ${fmt(encodeMs, 2)} ms; digest ${r.digest}; marks ${r.marks.join(', ')}`);
      console.log(`      ${fileName(s)}; ${reportName(s)}`);
    },
  },
  {
    name: 'rotation on time: 30 doors in 4 game minutes leave auto-prev untouched; auto-prev rotates only 10 game or 5 real minutes on (TECH §7.4)',
    async fn() {
      const T = fresh();
      try {
        const slot = 'w-1:auto', prevSlot = 'w-1:auto-prev';
        let gameMs = 23_480_400_000;
        const write = async (why = 'area') => { const r = await store.autosave(stateAt(gameMs), 'x', { why }); return r; };
        const first = await write();
        assert(!first.rotated && first.slot === slot, JSON.stringify(first));
        const rotations = [], ages = [];
        let txBefore = T.idb.stats.transactions, prevSeen = null, prevChanges = 0;
        // (30 doors, 8 game seconds and 2 real seconds apart: 4 game minutes)
        for (let door = 1; door <= 30; door++) {
          gameMs += 8 * SEC_MS; T.clock.ms += 2 * SEC_MS;
          const r = await write();
          if (r.rotated) rotations.push({ door, gameMs });
          const prev = await store.getRecord(prevSlot);
          if (prev?.gameMs !== prevSeen) { prevChanges++; prevSeen = prev?.gameMs; }
        }
        const doorTx = T.idb.stats.transactions - txBefore;
        // (the first door finds no auto-prev and makes one; the other 29 leave it be)
        assert(rotations.length === 1 && rotations[0].door === 1 && prevChanges === 1, JSON.stringify({ rotations, prevChanges }));
        assert(doorTx === 30 + 30, `each autosave one transaction (and each getRecord one): ${doorTx} for 30 doors`);
        const auto1 = await store.getRecord(slot), prev1 = await store.getRecord(prevSlot);
        ages.push(`after 30 doors: auto-prev ${ageText(prev1, auto1)} behind auto`);
        // (10 game minutes after the auto-prev: the next save rotates, copying the auto there was,
        // not the one being written)
        gameMs = prev1.gameMs + AUTO_PREV_GAME_MS - SEC_MS; T.clock.ms += SEC_MS;
        const almost = await write(), almostRec = await store.getRecord(slot);
        gameMs = prev1.gameMs + AUTO_PREV_GAME_MS; T.clock.ms += SEC_MS;
        const due = await write();
        const prev2 = await store.getRecord(prevSlot), auto2 = await store.getRecord(slot);
        ages.push(`10 game min on: rotated ${due.rotated} (a second before: ${almost.rotated}); auto-prev ${ageText(prev2, auto2)} behind`);
        // (5 real minutes after the new auto-prev's savedAt, in 31 game seconds: rotates too)
        gameMs += 30 * SEC_MS; T.clock.ms = prev2.savedAt + AUTO_PREV_REAL_MS - SEC_MS;
        const realAlmost = await write(), realAlmostRec = await store.getRecord(slot);
        gameMs += SEC_MS; T.clock.ms = prev2.savedAt + AUTO_PREV_REAL_MS;
        const realDue = await write();
        const prev3 = await store.getRecord(prevSlot), auto3 = await store.getRecord(slot);
        ages.push(`5 real min on (31 game s): rotated ${realDue.rotated} (a second before: ${realAlmost.rotated}); auto-prev ${ageText(prev3, auto3)} behind`);
        assert(!almost.rotated && due.rotated && !realAlmost.rotated && realDue.rotated, JSON.stringify({ almost, due, realAlmost, realDue }));
        assert(prev2.json === almostRec.json && prev2.slot === prevSlot && prev2.gameMs === prev1.gameMs + AUTO_PREV_GAME_MS - SEC_MS, 'the rotation copied the auto there was');
        assert(prev3.json === realAlmostRec.json && prev3.digest === digest(prev3.json) && auto3.gameMs - prev3.gameMs === SEC_MS, 'the real-time rotation copied the auto there was');
        assert(auto1.gameMs - prev1.gameMs === 30 * 8 * SEC_MS, `after 30 doors auto-prev is the first save, 4 game minutes behind: ${auto1.gameMs - prev1.gameMs} ms`);
        for (const a of ages) console.log(`      ${a}`);
        console.log(`      rotations at door ${rotations.map(r => r.door).join(', ')} of 30 (4 game min); then at +10 game min and +5 real min; ${doorTx} transactions for the 30 doors and their checks`);
      } finally { T.done(); }
    },
  },
  {
    name: 'leaving the page: autosaveSync writes with no read and no await, every put made before it returns, rotating from the records this page knows; with no connection open it writes nothing (v0.0.3\'s review: the leave-the-page save never landed)',
    async fn() {
      const idb = fakeIndexedDB(), log = [];
      let inside = false;
      // (a spy on the connection: every request a transaction makes, and whether it was made inside the call)
      const open0 = idb.open.bind(idb);
      idb.open = (name, ver) => {
        const req = open0(name, ver);
        let user = null;
        Object.defineProperty(req, 'onsuccess', { configurable: true, set(fn) { user = fn; }, get() { return () => {
          const c = req.result, tx0 = c.transaction.bind(c);
          c.transaction = (names, mode) => {
            const t = tx0(names, mode), os0 = t.objectStore;
            t.objectStore = (n) => { const st = os0(n); return Object.fromEntries(Object.entries(st).map(([k, f]) => [k, (...a) => { log.push({ op: k, store: n, sync: inside }); return f(...a); }])); };
            return t;
          };
          user?.();
        }; } });
        return req;
      };
      const clock = { ms: 1_793_900_000_000 };
      useClock(() => clock.ms); setVersion('0.0.3');
      try {
        useIndexedDB(idb);
        // (nothing open yet: nothing written)
        const none = store.autosaveSync(stateAt(1000), 'x');
        // (the career's first autosave opens the connection; then 3 s of play, and the page goes)
        let gameMs = 23_480_400_000;
        await store.autosave(stateAt(gameMs), 'launch', { why: 'launch' });
        gameMs += 3 * SEC_MS; clock.ms += 3 * SEC_MS;
        const mark = log.length, txBefore = idb.stats.transactions;
        inside = true;
        const r = store.autosaveSync(stateAt(gameMs), 'leaving', { why: 'live' });
        inside = false;
        const ops = log.slice(mark), tx = idb.stats.transactions - txBefore;
        for (let i = 0; i < 5; i++) await new Promise(res => setTimeout(res, 0));
        const auto = await store.getRecord('w-1:auto'), prev = await store.getRecord('w-1:auto-prev');
        // (10 game minutes on, a second leaving: the rotation copies the auto it wrote, known with no read)
        gameMs += AUTO_PREV_GAME_MS; clock.ms += SEC_MS;
        const r2 = store.autosaveSync(stateAt(gameMs), 'leaving again');
        for (let i = 0; i < 5; i++) await new Promise(res => setTimeout(res, 0));
        const auto2 = await store.getRecord('w-1:auto'), prev2 = await store.getRecord('w-1:auto-prev');
        console.log(`      before any connection: ${none}; leaving 3 s after the first autosave: ${tx} transaction, requests ${ops.map(o => `${o.op} ${o.store}${o.sync ? '' : ' (later)'}`).join(', ')}; auto at +${fmt((auto.gameMs - 23_480_400_000) / SEC_MS, 0)} s, rotated ${r.rotated}`);
        console.log(`      leaving 10 game min on: rotated ${r2.rotated}, auto-prev ${fmt((auto2.gameMs - prev2.gameMs) / MIN_MS, 1)} game min behind auto (the record the first leave wrote)`);
        assert(none === null, JSON.stringify(none));
        assert(r && tx === 1 && ops.length > 0 && ops.every(o => o.op === 'put' && o.sync && o.store === 'saves'), JSON.stringify({ r, tx, ops }));
        assert(auto.gameMs === gameMs - AUTO_PREV_GAME_MS && auto.about === 'leaving' && prev?.about === 'launch', JSON.stringify({ auto: auto.about, prev: prev?.about }));
        assert(r2.rotated && prev2.about === 'leaving' && auto2.about === 'leaving again', JSON.stringify({ r2, prev2: prev2.about, auto2: auto2.about }));
      } finally { useIndexedDB(null); useClock(); }
    },
  },
  {
    name: 'ironman-prev rotates from ironman by the same rule; a damaged auto is never copied over a good -prev; the plan is pure',
    async fn() {
      const T = fresh();
      try {
        let gameMs = 1_000_000_000;
        const iron = () => stateAt(gameMs, { seed: 3, mode: 'ironman' });
        await store.autosave(iron(), 'x', { why: 'area' });
        gameMs += 5 * SEC_MS;
        const r1 = await store.autosave(iron(), 'x', { why: 'area' });
        gameMs += AUTO_PREV_GAME_MS;
        const r2 = await store.autosave(iron(), 'x', { why: 'combat' });
        const slots = (await store.list({ hidden: true })).map(r => r.slot).sort();
        assert(r1.rotated && r2.rotated && r1.slot === 'w-3:ironman' && slots.join() === 'w-3:ironman,w-3:ironman-prev', JSON.stringify({ r1, r2, slots }));
        const shown = (await store.list()).map(r => r.slot);
        assert(shown.join() === 'w-3:ironman', `ironman-prev is hidden: ${shown}`);
        // (the plan, pure: a damaged auto due for rotation is left to be overwritten)
        const next = { ...recordOf('w-1:auto', stateAt(10 * MIN_MS + 1)), savedAt: 0 };
        const good = { ...recordOf('w-1:auto', stateAt(5 * MIN_MS)), savedAt: 0 }, prev = { ...recordOf('w-1:auto-prev', stateAt(0)), savedAt: 0 };
        const bad = { ...good, json: good.json.replace('"olympus"', '"olympvs"') };
        const okPlan = planAutosave({ auto: good, prev }, next), badPlan = planAutosave({ auto: bad, prev }, next), noPrev = planAutosave({ auto: good, prev: null }, next), none = planAutosave({}, next);
        assert(okPlan.rotated && okPlan.puts.map(p => p.slot).join() === 'w-1:auto-prev,w-1:auto' && okPlan.puts[0].json === good.json, JSON.stringify(okPlan.puts.map(p => p.slot)));
        assert(!badPlan.rotated && badPlan.kept === 'damaged' && badPlan.puts.length === 1, JSON.stringify({ ...badPlan, puts: badPlan.puts.length }));
        assert(noPrev.rotated && !none.rotated && none.puts.length === 1, 'no -prev yet: rotate; no auto yet: nothing to rotate');
        console.log(`      Ironman: ${slots.join(', ')} (rotated at +5 s with no -prev, then at +10 game min); list() shows ${shown.join(', ')}; a damaged auto due for rotation: kept '${badPlan.kept}', not copied`);
      } finally { T.done(); }
    },
  },
  {
    name: 'the day and edge slots: Standard writes day after 00:00 and edge at the content edge beside auto; Ironman\'s edge save is its own slot',
    async fn() {
      const T = fresh();
      try {
        const day = await store.autosave(stateAt(5_000_000), 'a', { why: 'day' });
        const live = await store.autosave(stateAt(5_060_000), 'b', { why: 'live' });
        const edge = await store.autosave(stateAt(5_120_000), 'c', { why: 'edge' });
        const iron = await store.autosave(stateAt(5_000_000, { seed: 2, mode: 'ironman' }), 'd', { why: 'day' });
        const ironEdge = await store.autosave(stateAt(5_060_000, { seed: 2, mode: 'ironman' }), 'e', { why: 'edge' });
        const w1 = (await store.list({ world: 'w-1' })).map(r => `${r.name}@${r.gameMs}`).sort(), w2 = (await store.list({ world: 'w-2', hidden: true })).map(r => r.name).sort();
        assert(day.extra === 'w-1:day' && live.extra === null && edge.extra === 'w-1:edge' && iron.extra === null && ironEdge.extra === null, JSON.stringify({ day, live, edge, iron, ironEdge }));
        assert(w1.join() === 'auto@5120000,day@5000000,edge@5120000', `w-1: ${w1}`);
        assert(w2.join() === 'ironman,ironman-prev', `w-2: ${w2}`);
        let refused = null;
        try { await store.save('ironman', stateAt(0), 'x'); } catch (e) { refused = e.message; }
        assert(refused && /may not save/.test(refused), `a Standard career saved to ironman: ${refused}`);
        console.log(`      Standard w-1: ${w1.join(', ')}; Ironman w-2: ${w2.join(', ')}; a Standard save to 'ironman': "${refused}"`);
      } finally { T.done(); }
    },
  },
  {
    name: 'a damaged save is reported with its stand-ins (Standard: auto-prev, day, the newest manual; Ironman: ironman-prev, which marks the career recovered)',
    async fn() {
      const T = fresh();
      try {
        const st = (ms) => stateAt(ms, { seed: 5 });
        await store.autosave(st(1_000_000), 'a', { why: 'day' });
        T.clock.ms += 1000; await store.autosave(st(1_005_000), 'a');                 // (auto-prev made)
        T.clock.ms += 1000; await store.save('w-5:manual-4', st(800_000), 'oldest manual');
        T.clock.ms += 1000; await store.save('manual-2', st(900_000), 'older manual');
        T.clock.ms += 1000; await store.save('manual-7', st(950_000), 'newest manual (by savedAt)');
        // (damage auto in place: one character of its json)
        const db = T.idb.dbs.get('olympus').stores.get('saves').data, rec = db.get('w-5:auto');
        db.set('w-5:auto', { ...rec, json: rec.json.replace('"standard"', '"standarb"') });
        let err = null;
        try { await store.load('w-5:auto'); } catch (e) { err = e; }
        assert(err instanceof SaveError && err.code === 'damaged' && err.slot === 'w-5:auto', `${err}`);
        assert(err.offers.join() === 'w-5:auto-prev,w-5:day,w-5:manual-7', `offers ${err.offers}`);
        const rec1 = await store.recover('w-5:auto');
        assert(rec1.from === 'w-5:auto-prev' && rec1.state.clock.ms === 1_000_000 && !rec1.state.meta.recovered, JSON.stringify({ from: rec1.from, ms: rec1.state.clock.ms }));
        // (a manual damaged: auto-prev, day and the newest other manual)
        const offersManual = offersFor('w-5:manual-7', await store.list({ hidden: true }));
        assert(offersManual.join() === 'w-5:auto-prev,w-5:day,w-5:manual-2', `offers for manual-7: ${offersManual}`);
        // (Ironman: ironman-prev only, and the recovery is marked)
        const ir = (ms) => stateAt(ms, { seed: 6, mode: 'ironman' });
        await store.autosave(ir(2_000_000), 'i'); T.clock.ms += 1000; await store.autosave(ir(2_010_000), 'i');
        const irRec = db.get('w-6:ironman');
        db.set('w-6:ironman', { ...irRec, json: irRec.json.slice(0, -10) });
        let ierr = null;
        try { await store.load('w-6:ironman'); } catch (e) { ierr = e; }
        const back = await store.recover('w-6:ironman');
        assert(ierr?.code === 'damaged' && ierr.offers.join() === 'w-6:ironman-prev' && back.from === 'w-6:ironman-prev' && back.state.meta.recovered === true, JSON.stringify({ code: ierr?.code, offers: ierr?.offers, from: back.from, recovered: back.state.meta.recovered }));
        // (missing and newer)
        let miss = null, newer = null;
        try { await store.load('w-5:manual-9'); } catch (e) { miss = e; }
        db.set('w-5:manual-1', { ...db.get('w-5:manual-2'), slot: 'w-5:manual-1', schema: 99 });
        try { await store.load('w-5:manual-1'); } catch (e) { newer = e; }
        assert(miss?.code === 'missing' && newer?.code === 'newer', `${miss?.code} ${newer?.code}`);
        // (nothing to stand in)
        let none = null;
        try { await store.recover('w-77:auto'); } catch (e) { none = e; }
        assert(none?.code === 'damaged' && /nothing to stand in/.test(none.message), `${none}`);
        console.log(`      "${err.message}": offers ${err.offers.join(', ')}; recovered from ${rec1.from} at game ${rec1.state.clock.ms} ms`);
        console.log(`      Ironman "${ierr.message}": offers ${ierr.offers.join(', ')}; recovered from ${back.from}, meta.recovered ${back.state.meta.recovered}; missing: ${miss.code}; schema 99: ${newer.code}`);
      } finally { T.done(); }
    },
  },
  {
    name: 'the bug report carries the anchor, the inputs, skip commands, checkpoints, errors, renderer, engine, screen, density and the state with its digest (TECH §7.6); an imported Ironman career is marked',
    async fn() {
      const T = fresh();
      try {
        const s = stateAt(23_480_460_000, { seed: 48213 });
        s.meta.errors = ['tick: TypeError: x is undefined'];
        const anchor = toJSON(s);
        const engine = await store.engineInfo();
        const r = reportOf(s, { anchor, anchorSeq: 41200, inputs: [[41201, { mx: 1 }, 37]], skipCmds: [['k37', 1234560000, 'stop']], checkpoints: [[41200, digest(anchor)]],
          renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M5 Pro)', screen: [3456, 2234, 2], ppm: 24, engine, stats: { lostTicks: 1 } });
        const keys = ['olympus', 'version', 'renderer', 'engine', 'screen', 'ppm', 'anchor', 'anchorSeq', 'inputs', 'skipCmds', 'checkpoints', 'errors', 'stats', 'state', 'digest', 'world', 'gameMs', 'madeAt'];
        const missing = keys.filter(k => !(k in r));
        assert(!missing.length && r.olympus === 'report' && r.version === '0.0.2' && r.world === 'w-48213', `missing ${missing}`);
        assert(r.state === toJSON(s) && r.digest === digest(r.state) && r.errors[0].startsWith('tick:') && r.engine.v8 && r.engine.browser.startsWith('node'), JSON.stringify(r.engine));
        const back = JSON.parse(JSON.stringify(r));
        assert(fromJSON(back.anchor).clock.ms === s.clock.ms && fromJSON(back.state).meta.seed === 48213, 'the report reads back');
        assert(store.v8OfChrome(142) === '14.2' && store.v8OfChrome(124) === '12.4', 'V8 by Chrome milestone');
        const iron = markImported(stateAt(0, { mode: 'ironman' })), std = markImported(stateAt(0));
        assert(iron.meta.imported === true && !std.meta.imported, 'imported marks Ironman only');
        console.log(`      ${Object.keys(r).length} fields; engine ${JSON.stringify(engine)}; report ${fmt(JSON.stringify(r).length / 1024, 1)} KB; Chrome 142 runs V8 ${store.v8OfChrome(142)}`);
      } finally { T.done(); }
    },
  },
  {
    name: 'profile and cache: the profile notes each world played and its marks, and outlives a world\'s saves; the cache keeps and clears',
    async fn() {
      const T = fresh();
      try {
        const empty = await store.getProfile();
        assert(empty.key === 'profile' && empty.worlds.length === 0 && empty.careers.length === 0, JSON.stringify(empty));
        await store.autosave(stateAt(0, { seed: 1 }), 'a');
        T.clock.ms += 60_000;
        const two = stateAt(0, { seed: 2, mode: 'ironman' }); two.meta.imported = true;
        await store.autosave(two, 'b');
        T.clock.ms += 60_000;
        await store.save('manual-1', stateAt(10, { seed: 1 }), 'c');
        const p = await store.getProfile();
        const w1 = p.worlds.find(w => w.worldId === 'w-1'), w2 = p.worlds.find(w => w.worldId === 'w-2');
        assert(p.worlds.length === 2 && w1.lastPlayedAt - w1.createdAt === 120_000 && w2.marks?.join() === 'imported' && !w1.marks, JSON.stringify(p.worlds));
        for (const r of await store.list({ world: 'w-1', hidden: true })) await store.remove(r.slot);
        const after = await store.getProfile();
        assert(after.worlds.length === 2, 'the profile outlives the saves');
        await store.putProfile({ ...after, unlocks: { cadence: true } });
        assert((await store.getProfile()).unlocks.cadence === true, 'putProfile');
        await store.cachePut('sky:Phobos:1024x512:v1', { w: 1024, h: 512, px: new Uint8Array([1, 2, 3]) });
        const got = await store.cacheGet('sky:Phobos:1024x512:v1');
        await store.cacheClear();
        const gone = await store.cacheGet('sky:Phobos:1024x512:v1');
        assert(got?.px?.[2] === 3 && got.w === 1024 && gone === null, JSON.stringify({ got: !!got, gone }));
        console.log(`      worlds ${p.worlds.map(w => `${w.worldId} (${fmt((w.lastPlayedAt - w.createdAt) / 1000, 0)} s played${w.marks ? `, ${w.marks}` : ''})`).join(', ')}; kept after w-1's saves went; cache: a typed array kept and cleared`);
      } finally { T.done(); }
    },
  },
  {
    name: 'updateProfile reads and writes the profile in one transaction: a save landing beside it keeps its world, where a getProfile then a putProfile (0.0.3\'s first sound settings) lost it',
    async fn() {
      const T = fresh();
      try {
        await store.autosave(stateAt(0, { seed: 1 }), 'a');
        // (the old way: read, a save writes its world into the profile, then the stale read written whole)
        const stale = await store.getProfile();
        await store.autosave(stateAt(0, { seed: 3 }), 'b');
        await store.putProfile({ ...stale, audio: { volume: 0.5, muted: false } });
        const lost = !(await store.getProfile()).worlds.some(w => w.worldId === 'w-3');
        // (the new way, with a save begun beside it)
        const both = await Promise.all([store.updateProfile(p => ({ ...p, audio: { volume: 0.25, muted: true } })), store.autosave(stateAt(0, { seed: 4 }), 'c')]);
        const q = await store.getProfile();
        const kept = q.worlds.some(w => w.worldId === 'w-4') && q.audio?.volume === 0.25 && q.audio?.muted === true && both[0]?.audio?.volume === 0.25;
        console.log(`      getProfile, a save, putProfile: the save's world ${lost ? 'lost' : 'kept'}; updateProfile beside a save: worlds ${q.worlds.map(w => w.worldId).join(', ')}, audio ${JSON.stringify(q.audio)}`);
        assert(lost, 'the two-step write was expected to lose the save\'s world (the race this pins)');
        assert(kept, JSON.stringify({ worlds: q.worlds.map(w => w.worldId), audio: q.audio, wrote: both[0] }));
      } finally { T.done(); }
    },
  },
  {
    name: 'a version-1 database opens as version 2: its saves kept, a v0.0.1 record listed under w-legacy and loaded as it stands',
    async fn() {
      const idb = fakeIndexedDB();
      // (v0.0.1's database: 'olympus' version 1, store 'saves', one autosave in its unprefixed slot)
      const json = LEGACY_V001_JSON, v1 = JSON.parse(json);
      await new Promise((resolve, reject) => {
        const req = idb.open('olympus', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('saves', { keyPath: 'slot' });
        req.onsuccess = () => {
          const t = req.result.transaction('saves', 'readwrite');
          t.objectStore('saves').put({ slot: 'auto', json, about: 'Standard career · MY 211 Sol 600', version: '0.0.1', schema: 1, mode: 'standard', seed: 4, gameMs: v1.clock.ms, savedAt: 1_793_000_000_000 });
          t.oncomplete = resolve; t.onerror = reject;
        };
      });
      const T = fresh(); useIndexedDB(idb);
      try {
        const all = await store.list();
        const d = idb.dbs.get('olympus');
        assert(d.version === DB_VERSION && [...d.stores.keys()].sort().join() === 'cache,profile,saves', `stores ${[...d.stores.keys()]}`);
        assert(all.length === 1 && all[0].slot === 'auto' && all[0].world === LEGACY_WORLD && all[0].name === 'auto' && all[0].bytes === json.length, JSON.stringify(all));
        const s = await store.load('auto');
        assert(s.meta.seed === 4 && s.meta.version === '0.0.1' && toJSON(fromJSON(json)) === toJSON(s) && !('sites' in s) && s.meta.worldId === 'w-4', 'the legacy save loads as fromJSON reads it (sites gone to places, its world w-4)');
        // (it saves on in a world of its own from then on)
        const r = await store.autosave(s, 'on');
        assert(r.slot === store.autoSlotOf(s) && r.slot !== 'auto' && (await store.list()).length === 2, JSON.stringify(r));
        console.log(`      v1 → v2: stores ${[...d.stores.keys()].sort().join(', ')}; 'auto' (v0.0.1, ${all[0].bytes} bytes) listed as ${all[0].world}:${all[0].name}, loaded; saved on to ${r.slot}`);
      } finally { T.done(); }
    },
  },
  {
    name: 'a database a newer OLYMPUS took to version 3 opens as it stands: its saves listed, loaded and written on; one without this version\'s stores is refused (0.0.2: a VersionError, an empty title)',
    async fn() {
      const rows = [];
      for (const [label, stores] of [['with the three stores', ['saves', 'profile', 'cache']], ['with only saves', ['saves']]]) {
        const idb = fakeIndexedDB(), s0 = stateAt(4_000_000, { seed: 31 }), json = toJSON(s0);
        await new Promise((resolve, reject) => {
          const req = idb.open('olympus', 3);
          req.onupgradeneeded = () => { for (const n of stores) req.result.createObjectStore(n, { keyPath: n === 'saves' ? 'slot' : 'key' }); };
          req.onsuccess = () => {
            const t = req.result.transaction('saves', 'readwrite');
            t.objectStore('saves').put({ slot: 'w-31:auto', world: 'w-31', json, digest: digest(json), about: 'from 0.0.9', version: '0.0.9', schema: 1, mode: 'standard', seed: 31, gameMs: 4_000_000, savedAt: 1_793_000_000_000, marks: [] });
            t.oncomplete = resolve; t.onerror = reject;
          };
        });
        const T = fresh(); useIndexedDB(idb);
        try {
          let all = null, loaded = null, wrote = null, err = null;
          try { all = await store.list(); loaded = await store.load('w-31:auto'); wrote = await store.save('manual-1', loaded, 'after a rollback'); } catch (e) { err = e; }
          const d = idb.dbs.get('olympus');
          rows.push(`${label}: version ${d.version} kept; ${err ? `refused: "${err.message}"` : `${all.length} save listed, loaded at game ${loaded.clock.ms} ms, written on to ${wrote.slot}`}`);
          if (stores.length === 3) assert(!err && d.version === 3 && all.length === 1 && loaded.clock.ms === 4_000_000 && wrote.slot === 'w-31:manual-1', `${err?.message}`);
          else assert(err && /newer OLYMPUS/.test(err.message) && d.version === 3, `${err?.message}`);
        } finally { T.done(); }
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'a damaged v0.0.1 save offers its stand-ins by their own keys (0.0.2 offered \'w-legacy:manual-3\', which no record has)',
    async fn() {
      const idb = fakeIndexedDB();
      const json = LEGACY_V001_JSON;
      await new Promise((resolve, reject) => {
        const req = idb.open('olympus', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('saves', { keyPath: 'slot' });
        req.onsuccess = () => {
          const t = req.result.transaction('saves', 'readwrite');
          t.objectStore('saves').put({ slot: 'auto', json: json.slice(0, -20), digest: digest(json), about: 'damaged', version: '0.0.1', schema: 1, mode: 'standard', seed: 4, gameMs: 10_000, savedAt: 1_793_000_000_000 });
          t.objectStore('saves').put({ slot: 'manual-3', json, about: 'good', version: '0.0.1', schema: 1, mode: 'standard', seed: 4, gameMs: 10_000, savedAt: 1_792_000_000_000 });
          t.oncomplete = resolve; t.onerror = reject;
        };
      });
      const T = fresh(); useIndexedDB(idb);
      try {
        let err = null;
        try { await store.load('auto'); } catch (e) { err = e; }
        const back = await store.recover('auto');
        console.log(`      v0.0.1's 'auto' damaged: offers ${JSON.stringify(err?.offers)}; recovered from '${back.from}' (seed ${back.state.meta.seed})`);
        assert(err?.code === 'damaged' && JSON.stringify(err.offers) === '["manual-3"]' && back.from === 'manual-3' && back.state.meta.seed === 4, JSON.stringify({ code: err?.code, offers: err?.offers, from: back.from }));
      } finally { T.done(); }
    },
  },
  {
    name: 'determinism: 3,000 ticks of a dummy sim twice, and with a save and a load at 1,500, give byte-identical saves',
    fn() {
      const t0 = performance.now();
      const A = dummy(dummyState(2351)); runTicks(A, 0, 3000);
      const tickUs = (performance.now() - t0) * 1000 / 3000;
      const B = dummy(dummyState(2351)); runTicks(B, 0, 3000);
      const C = dummy(dummyState(2351)); runTicks(C, 0, 1500);
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
      const L = dummy(dummyState(7));
      let checked = 0;
      for (let i = 0; i < 3000; i++) {
        L.tick(inputAt(i));
        if (i % 250 === 0) { const j = toJSON(L.state); assert(toJSON(fromJSON(j)) === j, `tick ${i}`); checked++; }
      }
      console.log(`      ${checked} points checked, every one identical`);
    },
  },
];
