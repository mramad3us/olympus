// Saves in a real browser (heavy: a server and headless Chrome through tests/browser.mjs, on
// OLYMPUS_TEST_PORT, so the origin and its saves are the test's own): src/core/store.js v2 over
// Chrome's IndexedDB. A version-1 database as v0.0.1 left it (store 'saves' alone, its autosave in
// the unprefixed slot 'auto') opens as version 2 with its record kept, listed under w-legacy, and
// the title's Continue loads it. Then on the title page: save, list, load and remove round trips
// byte for byte; an autosave rotating auto to auto-prev in one transaction, and only on time
// (TECH §7.4); the profile and the cache; and a 500 KB synthetic save shaped like 0.1's (TECH §7.4's
// measure), with the ms to encode, write, read and decode it printed.
// (The IndexedDB test that was in core-browser at 0.0.1 is this file's now: the build sheet, §1.)
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { LEGACY_V001_JSON } from './core-store.test.mjs';

const HANDLE = "typeof window.__olympus === 'object' && window.__olympus !== null";

export default [
  {
    name: 'a version-1 database holding a v0.0.1 save opens as version 2: the record kept, listed under w-legacy, and Continue on the title loads it',
    heavy: true,
    async fn() {
      await withGame(async (page, errors, game) => {
        // (on the origin, before the game has opened anything: a database as v0.0.1 made it)
        await page.goto(`${game.origin}/VERSION`);
        const made = await page.evaluate((json) => new Promise((resolve, reject) => {
          const req = indexedDB.open('olympus', 1);
          req.onupgradeneeded = () => req.result.createObjectStore('saves', { keyPath: 'slot' });
          req.onerror = () => reject(req.error);
          req.onsuccess = () => {
            const db = req.result, t = db.transaction('saves', 'readwrite');
            t.objectStore('saves').put({ slot: 'auto', json, about: 'Standard career · MY 211 Sol 600 · Thu 22 Mar 2351 08:00 UTC', version: '0.0.1', schema: 1, mode: 'standard', seed: 4, gameMs: 10000, savedAt: Date.now() - 3600_000 });
            t.oncomplete = () => { const names = [...db.objectStoreNames]; db.close(); resolve({ version: db.version, names }); };
            t.onerror = () => reject(t.error);
          };
        }), LEGACY_V001_JSON);
        assert(made.version === 1 && made.names.join() === 'saves', JSON.stringify(made));
        await game.open('', HANDLE);
        await page.waitForFunction('window.__ready === true', null, { timeout: 30000 });
        const seen = await page.evaluate(async () => {
          const store = await import('/src/core/store.js');
          const list = await store.list();
          const dbs = await indexedDB.databases();
          const rec = await store.getRecord('auto');
          const open = await new Promise((res) => { const r = indexedDB.open('olympus'); r.onsuccess = () => { const names = [...r.result.objectStoreNames].sort(); r.result.close(); res(names); }; });
          return { list: list.map(r => ({ slot: r.slot, world: r.world, name: r.name, bytes: r.bytes, version: r.version })), version: dbs.find(d => d.name === 'olympus')?.version, names: open, kept: rec?.json?.length ?? 0 };
        });
        assert(seen.version === 2 && seen.names.join() === 'cache,profile,saves', `the database: ${JSON.stringify(seen)}`);
        assert(seen.list.length === 1 && seen.list[0].world === 'w-legacy' && seen.list[0].name === 'auto' && seen.kept === LEGACY_V001_JSON.length, JSON.stringify(seen.list));
        const cont = await page.locator('#title .item.continue').innerText();
        await page.click('#title .item.continue');
        await page.waitForFunction(() => window.__olympus.state !== null, null, { timeout: 30000 });
        const st = await page.evaluate(() => {
          const s = window.__olympus.state, a = s.actors?.list?.find?.(x => x.id === s.player?.actor);
          return { seed: s.meta.seed, version: s.meta.version, worldId: s.meta.worldId, sites: 'sites' in s, player: s.player?.id ?? null, at: a ? [a.x, a.z] : null };
        });
        assert(st.seed === 4 && st.version === '0.0.1' && st.worldId === 'w-4' && !st.sites, JSON.stringify(st));
        console.log(`      v1 database (${made.names}) → v2 (${seen.names.join(', ')}); listed: ${seen.list.map(r => `${r.world}:${r.name} (v${r.version}, ${r.bytes} bytes)`).join(', ')}`);
        console.log(`      Continue: '${cont.split('\n').join(' · ')}'; loaded seed ${st.seed}, v${st.version}, world ${st.worldId}; player ${st.player ?? 'none'}${st.at ? ` at (${st.at.map(v => fmt(v, 2)).join(', ')})` : ''}`);
      }, { navigate: false });
    },
  },
  {
    name: 'a database a newer OLYMPUS took to version 3 opens in Chrome as it stands: the title continues from its save, and an autosave writes on (a rollback keeps the saves in reach)',
    heavy: true,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.goto(`${game.origin}/VERSION`);
        const s0 = await page.evaluate(async () => {
          const store = await import('/src/core/store.js'), state = await import('/src/core/state.js');
          const st = state.newState(77, { mode: 'standard', startMs: 0 }); st.meta.worldId = 'w-77'; st.clock.ms = 5_000_000;
          const rec = store.recordOf('w-77:auto', st, 'from a newer OLYMPUS');
          return new Promise((resolve, reject) => {
            const req = indexedDB.open('olympus', 3);
            req.onupgradeneeded = () => { for (const [n, k] of [['saves', 'slot'], ['profile', 'key'], ['cache', 'key']]) req.result.createObjectStore(n, { keyPath: k }); };
            req.onerror = () => reject(req.error);
            req.onsuccess = () => { const db = req.result, t = db.transaction('saves', 'readwrite'); t.objectStore('saves').put({ ...rec, version: '0.0.9' }); t.oncomplete = () => { db.close(); resolve({ version: db.version }); }; t.onerror = () => reject(t.error); };
          });
        });
        await game.open('', HANDLE);
        await page.waitForFunction('window.__ready === true', null, { timeout: 30000 });
        const cont = await page.locator('#title .item.continue').innerText().catch(() => null);
        const seen = await page.evaluate(async () => {
          const store = await import('/src/core/store.js');
          const list = await store.list(), loaded = await store.load('w-77:auto'), r = await store.autosave(loaded, 'after the rollback');
          const dbs = await indexedDB.databases();
          return { list: list.map(x => `${x.slot} (${x.version})`), ms: loaded.clock.ms, wrote: r.slot, version: dbs.find(d => d.name === 'olympus')?.version };
        });
        console.log(`      made at version ${s0.version}; the title's Continue: ${JSON.stringify(cont?.split('\n')[0] ?? null)}; listed ${seen.list.join(', ')}; loaded at game ${seen.ms} ms; autosaved to ${seen.wrote}; the database still version ${seen.version}`);
        assert(cont && /Continue/.test(cont) && seen.list.length === 1 && seen.ms === 5_000_000 && seen.wrote === 'w-77:auto' && seen.version === 3, JSON.stringify({ cont, seen }));
        assert(!errors.length, errors.join('\n'));
      }, { navigate: false });
    },
  },
  {
    name: 'save, list, load and remove round trip byte for byte; an autosave rotates in one transaction, on time; profile and cache; a 500 KB synthetic save timed',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        const r = await page.evaluate(async () => {
          const store = await import('/src/core/store.js'), { newState, toJSON } = await import('/src/core/state.js');
          const { newGame } = await import('/src/sim/game.js'), { put } = await import('/src/core/ids.js'), { post } = await import('/src/core/queue.js');
          const ms = () => performance.now();
          // (a synthetic state shaped like 0.1's, TECH §7.4: 13 tier-1 sheets, 180 tier-2, 600 events, 2,000 log lines, 800 items,
          // grown from a real new game, so a load's upgrade (the page's domains, composed by main.js) finds nothing to fill)
          const big = newGame({ seed: 48213, version: 'test' });
          const pad = (n, k) => Array.from({ length: n }, (_, i) => `${k}${(i * 2654435761 >>> 0).toString(36)}`);
          for (let i = 2; i <= 194; i++) put(big, big.people, `p${i}`, { id: `p${i}`, name: `Marine ${i}`, tier: i <= 14 ? 1 : 2, body: { v: 1, tmpl: 'm-adult', core: 37 + (i % 10) / 10, water: 0.9 }, skills: Object.fromEntries(pad(i <= 14 ? 24 : 12, 's').map((k, j) => [k, j % 7])), notes: pad(i <= 14 ? 20 : 6, 'n').join(' ') });
          for (let i = 1; i <= 600; i++) post(big, { atMs: big.clock.ms + i * 60_000, prio: 5, kind: 'need', src: `people:p${2 + (i % 193)}`, payload: { need: 'water', band: i % 4 } });
          for (let i = 1; i <= 2000; i++) big.log.push({ seq: i, atMs: big.clock.ms + i * 5000, kind: i % 3 ? 'note' : 'roll', tone: 'note', text: i % 3 ? `Line ${i}: the platoon moves to the range, then back to the barracks for chow.` : undefined, roll: i % 3 ? undefined : { skill: 'weapons', d20: 1 + (i % 20), value: 7, mods: [['rested', 1]], dc: 12, margin: (i % 20) - 4 } });
          for (let i = 1; i <= 800; i++) put(big, big.items, `i${i}`, { type: i % 4 ? 'mag' : 'gun', model: i % 4 ? 'had30c' : 'r7', n: i % 31, load: 'ball', holds: i % 9 ? undefined : [`i${i + 1}`] });
          const tEnc = ms(); const json = toJSON(big); const encodeMs = ms() - tEnc;

          // save, list, load, remove
          const tW = ms(); const sum = await store.save('manual-1', big, 'synthetic'); const writeMs = ms() - tW;
          const tR = ms(); const rec = await store.getRecord('w-48213:manual-1'); const readMs = ms() - tR;
          const tL = ms(); const loaded = await store.load('w-48213:manual-1'); const loadMs = ms() - tL;
          const tE = ms(); const again = toJSON(loaded); const reencodeMs = ms() - tE;
          const listed = await store.list();
          await store.save('manual-2', loaded, 'again');
          const rec2 = await store.getRecord('w-48213:manual-2');
          await store.remove('w-48213:manual-1'); await store.remove('w-48213:manual-2');
          const after = await store.list();

          // the autosave's rotation: every autosave one transaction; auto-prev only 10 game minutes on
          const proto = IDBDatabase.prototype, real = proto.transaction;
          let txs = 0;
          proto.transaction = function (...a) { txs++; return real.apply(this, a); };
          const small = newState(7, { version: 'test', startMs: 23_480_400_000 });
          const rot = [], perTx = [];
          for (const [dMs, why] of [[0, 'area'], [8000, 'area'], [16000, 'area'], [600_000, 'area'], [601_000, 'day']]) {
            small.clock.ms = 23_480_400_000 + dMs;
            const before = txs, out = await store.autosave(small, `t+${dMs / 1000} s`, { why });
            perTx.push(txs - before); rot.push({ dS: dMs / 1000, rotated: out.rotated, extra: out.extra, ms: out.ms });
          }
          proto.transaction = real;
          const slots = (await store.list({ world: 'w-7', hidden: true })).map(x => `${x.name}@+${(x.gameMs - 23_480_400_000) / 1000}s`).sort();
          const prev = await store.getRecord('w-7:auto-prev');
          const tA = ms(); const bigAuto = await store.autosave(big, 'big', { why: 'live' }); const autoMs = ms() - tA;

          // profile and cache
          const profile = await store.getProfile();
          await store.putProfile({ ...profile, unlocks: { test: 1 } });
          const profile2 = await store.getProfile();
          await store.cachePut('sky:test:4x4:v1', { w: 4, h: 4, px: new Uint8Array(64).fill(7) });
          const cached = await store.cacheGet('sky:test:4x4:v1');
          await store.cacheClear();
          const cleared = await store.cacheGet('sky:test:4x4:v1');
          const engine = await store.engineInfo();
          return {
            bytes: sum.bytes, kb: sum.bytes / 1024, json: json.length, encodeMs, writeMs, readMs, loadMs, reencodeMs, autoMs, bigAutoMs: bigAuto.ms,
            stored: rec.json === json && rec.digest === sum.digest, reloaded: again === json && rec2.json === json,
            listed: listed.map(x => x.slot), after: after.map(x => x.slot), hasJson: listed.some(x => 'json' in x),
            rot, perTx, slots, prevAt: (prev.gameMs - 23_480_400_000) / 1000,
            worlds: profile.worlds.map(w => w.worldId).sort(), unlocks: profile2.unlocks, cached: cached?.px?.[63] ?? null, cleared, engine,
          };
        });
        console.log(`      synthetic save ${fmt(r.kb, 0)} KB: encode ${fmt(r.encodeMs, 1)} ms, save (encode, digest, put) ${fmt(r.writeMs, 1)} ms, read ${fmt(r.readMs, 1)} ms, load (digest, parse, upgrade) ${fmt(r.loadMs, 1)} ms, encode again ${fmt(r.reencodeMs, 1)} ms; autosave of it ${fmt(r.bigAutoMs, 1)} ms`);
        console.log(`      round trips: stored ${r.stored ? 'byte-identical' : 'DIFFERENT'}, loaded and encoded again ${r.reloaded ? 'byte-identical' : 'DIFFERENT'}; listed ${r.listed.join(', ')}; after remove ${r.after.join(', ') || 'none'}`);
        console.log(`      autosaves at ${r.rot.map(x => `+${x.dS} s${x.rotated ? ' (rotated)' : ''}${x.extra ? ` (+${x.extra.split(':')[1]})` : ''}`).join(', ')}; transactions each ${r.perTx.join(', ')}; slots ${r.slots.join(', ')}`);
        console.log(`      profile worlds ${r.worlds.join(', ')}; unlocks ${JSON.stringify(r.unlocks)}; cache kept ${r.cached}, cleared ${r.cleared}; engine ${JSON.stringify(r.engine)}`);
        assert(r.stored, 'IndexedDB gave back other bytes than were saved');
        assert(r.reloaded, 'a load and a save again changed the bytes');
        assert(!r.hasJson, 'the list carried json');
        assert(r.listed.includes('w-48213:manual-1') && !r.after.includes('w-48213:manual-1'), JSON.stringify({ listed: r.listed, after: r.after }));
        assert(r.kb > 450 && r.kb < 700, `the synthetic save is ${r.kb} KB, not about 500`);
        assert(r.perTx.every(n => n === 1), `an autosave took ${r.perTx} transactions`);
        assert(r.rot.map(x => x.rotated).join() === 'false,true,false,true,false' && r.rot[4].extra === 'w-7:day', JSON.stringify(r.rot));
        assert(r.prevAt === 16 && r.slots.join() === 'auto-prev@+16s,auto@+601s,day@+601s', `auto-prev holds the auto there was at the rotation: ${r.slots}`);
        assert(r.worlds.includes('w-48213') && r.worlds.includes('w-7') && r.unlocks.test === 1 && r.cached === 7 && r.cleared === null, JSON.stringify({ worlds: r.worlds, unlocks: r.unlocks }));
        assert(/^Chrom/.test(r.engine.browser) && /^\d+\.\d$/.test(r.engine.v8), JSON.stringify(r.engine));
      }, { ready: 'window.__ready === true' });
    },
  },
];
