// The engine core in a real browser (heavy): the title paper shows with no errors and the page says
// it's ready; a new career starts from it; the physical keys walk, Space and an open card pause, G
// holds time still until a digit; a skip passes its minutes; a save and a load in the page carry on
// byte for byte; and the IndexedDB part of the saves (src/core/store.js): save, list, load, save
// again byte-identical, delete, and Continue on the title. Port 8235 (the engine round's own origin,
// so its saves are its own).
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';

const PORT = 8235;
const H = '__olympus';

export default [
  {
    name: 'the title: OLYMPUS, the version, New career and Load a file on paper, no errors, __ready',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        const t = await page.evaluate(() => ({ text: document.querySelector('#title .sheet')?.innerText ?? '', shown: !document.querySelector('#title').hidden, ready: window.__ready, state: window.__olympus.state, version: window.__olympus.version }));
        assert(t.shown && t.ready === true && t.state === null, JSON.stringify({ ...t, text: undefined }));
        assert(/OLYMPUS/.test(t.text) && t.text.includes(`v${t.version}`) && /New career/.test(t.text) && /Load a save file/.test(t.text), t.text);
        const font = await page.evaluate(() => getComputedStyle(document.querySelector('#title h1')).fontFamily);
        assert(/Courier/.test(font), `the title's face: ${font}`);
        console.log(`      title up, v${t.version}, ready; type ${font.split(',')[0]}; ${t.text.split('\n').filter(Boolean).slice(0, 4).join(' | ')}`);
      }, { port: PORT });
    },
  },
  {
    name: 'a new career from the title: walk by physical keys, Space and the menu pause, G holds time for a digit, R skips',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        await page.click('#title .item.career');
        await page.click('#title .item.ironman');
        await page.waitForFunction(() => document.querySelector('.watch .t')?.textContent);
        const s0 = await page.evaluate((h) => ({ mode: window[h].state.meta.mode, ms: window[h].state.clock.ms, watch: document.querySelector('.watch').innerText }), H);
        assert(s0.mode === 'ironman' && /Sol \d+ · \d\d:\d\d/.test(s0.watch) && /MY \d+ Sol \d+/.test(s0.watch) && /UTC/.test(s0.watch), JSON.stringify(s0));
        // (KeyW is up whatever the layout: the key labelled Z on the user's AZERTY)
        const z0 = await page.evaluate((h) => window[h].state.player.z, H);
        await page.keyboard.down('KeyW'); await page.waitForTimeout(1000); await page.keyboard.up('KeyW');
        const z1 = await page.evaluate((h) => window[h].state.player.z, H);
        assert(z0 - z1 > 1.0 && z0 - z1 < 2.0, `walked ${z0 - z1} m in a second of holding Z`);
        // (Space: paused, the clock waits)
        await page.keyboard.press('Space');
        const p1 = await page.evaluate((h) => window[h].state.clock.ms, H);
        await page.waitForTimeout(500);
        const p2 = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, banner: document.querySelector('.banner').innerText, paused: window[h].loop.paused }), H);
        assert(p2.paused && p2.ms === p1 && /PAUSED/.test(p2.banner), JSON.stringify(p2));
        await page.keyboard.press('Space');
        // (Esc: the menu, a card of glass, holds a pause of its own)
        await page.keyboard.press('Escape');
        const m = await page.evaluate((h) => ({ card: !document.querySelector('.overlay').hidden, text: document.querySelector('.overlay').innerText, reasons: window[h].loop.pauseReasons }), H);
        assert(m.card && /Resume/.test(m.text) && m.reasons.join() === 'overlay:menu', JSON.stringify(m));
        await page.keyboard.press('Escape');
        const after = await page.evaluate((h) => window[h].loop.pauseReasons.length, H);
        assert(after === 0, 'the menu left a pause behind');
        // (G: weapon ready, stop motion; Digit1 picks and time runs again)
        await page.keyboard.press('KeyG');
        await page.waitForTimeout(100);
        const g1 = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, held: window[h].loop.held }), H);
        await page.waitForTimeout(500);
        const g2 = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, banner: document.querySelector('.banner').innerText }), H);
        assert(g1.held && g2.ms === g1.ms && /TIME STANDS STILL/.test(g2.banner), JSON.stringify({ g1, g2 }));
        await page.keyboard.press('Digit1');
        await page.waitForTimeout(200);
        const g3 = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, held: window[h].loop.held }), H);
        assert(!g3.held && g3.ms > g1.ms, JSON.stringify(g3));
        // (R: fifteen minutes pass, a skip, and the toast says so)
        await page.keyboard.press('KeyR');
        await page.waitForTimeout(200);
        const r = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, toast: document.querySelector('.toasts').innerText }), H);
        assert(r.ms - g3.ms >= 15 * 60000 && /15 minutes stepped/.test(r.toast), JSON.stringify(r));
        console.log(`      Ironman career; held Z 1 s: walked ${fmt(z0 - z1, 2)} m; Space: clock still; Esc: '${m.reasons}'; G held the clock ${g2.ms - g1.ms} ms over 0.5 s; R: +${fmt((r.ms - g3.ms) / 60000, 1)} min`);
      }, { port: PORT });
    },
  },
  {
    name: 'determinism in the page: a save, 400 ticks, a load of the save and the same 400 ticks give the same bytes',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        const res = await page.evaluate((h) => {
          const o = window[h];
          o.pause(true);
          const json = o.save();
          o.step(400, { mx: -1, mz: 1 }); o.skip(20 * 60000, { what: 'chow' }); o.step(400, { mx: 1, run: true });
          const a = o.save();
          o.start(json); o.pause(true);
          o.step(400, { mx: -1, mz: 1 }); o.skip(20 * 60000, { what: 'chow' }); o.step(400, { mx: 1, run: true });
          return { same: a === o.save(), bytes: a.length, x: o.state.player.x, ms: o.state.clock.ms };
        }, H);
        assert(res.same, 'an imported save carried on differently');
        console.log(`      800 ticks and a 20-min skip, twice from one save: identical (${res.bytes} bytes; x ${fmt(res.x, 2)} m)`);
      }, { port: PORT, query: 'play=sandbox&seed=4&hour=6' });
    },
  },
  {
    name: '?play=sandbox&hour=6 starts at 06:00 on the Mars clock; IndexedDB: save, list, load, save again byte-identical, delete; Continue on the title',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        const w = await page.evaluate(() => document.querySelector('.watch .t').innerText);
        assert(/· 06:0[0-1]$/.test(w), `the watch at ?hour=6: ${w}`);
        const res = await page.evaluate(async (h) => {
          const o = window[h];
          o.pause(true); o.step(100, { mx: 1 });
          const store = await import('/src/core/store.js'), { toJSON } = await import('/src/core/state.js');
          const before = toJSON(o.state);
          const rec = await store.save('manual-1', o.state, 'a test');
          const list1 = await store.list();
          const raw = await store.getRecord('manual-1');
          const loaded = await store.load('manual-1');
          const again = toJSON(loaded);
          await store.save('manual-2', loaded, 'again');
          const raw2 = await store.getRecord('manual-2');
          await store.remove('manual-1'); await store.remove('manual-2');
          const list2 = await store.list();
          await o.save('auto');                                     // (through the handle: then Continue shows on the title)
          return { bytes: rec.bytes, version: rec.version, slots1: list1.map(r => r.slot), slots2: list2.map(r => r.slot),
            same: raw.json === before && again === before && raw2.json === before, hasJson: list1.some(r => 'json' in r) };
        }, H);
        assert(res.same, 'a save through IndexedDB changed the bytes');
        assert(res.slots1.includes('manual-1') && !res.slots2.includes('manual-1') && !res.hasJson, JSON.stringify(res));
        await page.evaluate(() => { window.__olympus.loop.setState(null); });
        await page.goto(`http://localhost:${PORT}/`);
        await page.waitForFunction('window.__ready === true');
        const cont = await page.locator('#title .item.continue').innerText();
        assert(/Continue/.test(cont) && /Standard career/.test(cont), cont);
        await page.click('#title .item.continue');
        await page.waitForFunction(() => window.__olympus.state !== null);
        const back = await page.evaluate((h) => window[h].state?.player?.x, H);
        assert(back > 0.3, `continued at x ${back}`);
        console.log(`      watch '${w}'; manual-1: ${res.bytes} bytes, v${res.version}, identical through IndexedDB and back; deleted; title: '${cont.split('\n')[0]}: ${cont.split('\n')[1]}'`);
      }, { port: PORT, query: 'play=sandbox&seed=4&hour=6' });
    },
  },
];
