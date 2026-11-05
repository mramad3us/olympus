// The engine core in a real browser (heavy): the title paper shows with no errors and the page says
// it's ready; ?play=sandbox&hour=6 starts at 06:00 on the Mars clock; a new career from the title
// walks by physical keys on the pixel stage, Space and an open card pause, G holds time still until a
// digit, R passes fifteen minutes with its toast; and a save and a load in the page carry on byte for
// byte through a skip. The saves' IndexedDB part moved to store's tests/store-browser.test.mjs (the
// build sheet 0.0.2 §5.2). On OLYMPUS_TEST_PORT (8223 by default), so a parallel agent's run is its own.
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';

const H = '__olympus';
// (the player's actor: where the sim keeps the player's place since 0.0.2)
const meIn = (h) => { const s = window[h].state, a = s.actors.list.find(x => x.id === s.player.actor); return { x: a.x, z: a.z }; };

export default [
  {
    name: 'the title: OLYMPUS, the version, New career and Load a file on paper, no errors, __ready',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        const t = await page.evaluate(() => ({ text: document.querySelector('#title .sheet')?.innerText ?? '', shown: !document.querySelector('#title').hidden, ready: window.__ready, state: window.__olympus.state, version: window.__olympus.version, pending: window.__report.pending, warm: window.__report.view.warm }));
        assert(t.shown && t.ready === true && t.state === null, JSON.stringify({ ...t, text: undefined }));
        assert(/OLYMPUS/.test(t.text) && t.text.includes(`v${t.version}`) && /New career/.test(t.text) && /Load a save file/.test(t.text), t.text);
        const font = await page.evaluate(() => getComputedStyle(document.querySelector('#title h1')).fontFamily);
        assert(/Courier/.test(font), `the title's face: ${font}`);
        console.log(`      title up, v${t.version}, ready (pending: ${t.pending.length ? t.pending.join(', ') : 'nothing'}; warm-up ${t.warm ? `${t.warm.programs} programs, ${t.warm.ms} ms` : 'not reported'}); type ${font.split(',')[0]}; ${t.text.split('\n').filter(Boolean).slice(0, 4).join(' | ')}`);
      });
    },
  },
  {
    name: '?play=sandbox&hour=6 starts at 06:00 on the Mars clock, in the test rooms',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        const w = await page.evaluate(() => ({ t: document.querySelector('.watch .t').innerText, place: document.querySelector('.watch .place').innerText, date: document.querySelector('.watch .date').innerText, utc: document.querySelector('.watch .utc').innerText }));
        assert(/· 06:0[0-1]$/.test(w.t) && /Test rooms/.test(w.place), `the watch at ?hour=6: ${JSON.stringify(w)}`);
        console.log(`      watch '${w.t}' · '${w.date}' · '${w.utc}' · '${w.place}'`);
      }, { query: 'play=sandbox&seed=4&hour=6&nostore=1' });
    },
  },
  {
    name: 'a new career from the title: walk by physical keys, Space and the menu pause, G holds time for a digit, R skips',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        await page.click('#title .item.career');
        await page.click('#title .item.ironman');
        // (the area's cut holds the loop: wait until it lifts)
        await page.waitForFunction((h) => window[h].state && !window[h].loop.paused && document.querySelector('.watch .t')?.textContent, H);
        const s0 = await page.evaluate((h) => ({ mode: window[h].state.meta.mode, ms: window[h].state.clock.ms, watch: document.querySelector('.watch').innerText }), H);
        assert(s0.mode === 'ironman' && /Sol \d+ · \d\d:\d\d/.test(s0.watch) && /MY \d+ Sol \d+/.test(s0.watch) && /UTC/.test(s0.watch), JSON.stringify(s0));
        // (KeyW is up whatever the layout: the key labelled Z on the user's AZERTY)
        const p0 = await page.evaluate(meIn, H);
        await page.keyboard.down('KeyW'); await page.waitForTimeout(1000); await page.keyboard.up('KeyW');
        await page.waitForTimeout(100);
        const p1 = await page.evaluate(meIn, H);
        // (1.14 m/s for the second Z is down, less a frame either end: headless frames come up to 117 ms apart here)
        assert(p0.z - p1.z > 0.85 && p0.z - p1.z < 2.0, `walked ${p0.z - p1.z} m in a second of holding Z`);
        // (Space: paused, the clock waits)
        await page.keyboard.press('Space');
        const c1 = await page.evaluate((h) => window[h].state.clock.ms, H);
        await page.waitForTimeout(500);
        const c2 = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, banner: document.querySelector('.banner').innerText, paused: window[h].loop.paused }), H);
        assert(c2.paused && c2.ms === c1 && /PAUSED/.test(c2.banner), JSON.stringify(c2));
        await page.keyboard.press('Space');
        // (Esc: the menu, a card of glass, holds a pause of its own, and offers the report)
        await page.keyboard.press('Escape');
        const m = await page.evaluate((h) => ({ card: !document.querySelector('.overlay').hidden, text: document.querySelector('.overlay').innerText, reasons: window[h].loop.pauseReasons }), H);
        assert(m.card && /Resume/.test(m.text) && /Report a problem/.test(m.text) && m.reasons.join() === 'overlay:menu', JSON.stringify(m));
        await page.keyboard.press('Escape');
        const after = await page.evaluate((h) => window[h].loop.pauseReasons.length, H);
        assert(after === 0, 'the menu left a pause behind');
        // (G: weapon ready, stop motion; Digit1 picks and time runs again)
        await page.keyboard.press('KeyG');
        // (the press lands on the next frame's first tick: headless Chrome's frames come 17 to 117 ms apart here, so wait for it)
        await page.waitForFunction((h) => window[h].loop.held, H, { timeout: 5000 }).catch(() => {});
        const g1 = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, held: window[h].loop.held }), H);
        await page.waitForTimeout(500);
        const g2 = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, banner: document.querySelector('.banner').innerText }), H);
        assert(g1.held && g2.ms === g1.ms && /TIME STANDS STILL/.test(g2.banner), JSON.stringify({ g1, g2 }));
        await page.keyboard.press('Digit1');
        await page.waitForFunction((h) => !window[h].loop.held, H, { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(200);
        const g3 = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, held: window[h].loop.held }), H);
        assert(!g3.held && g3.ms > g1.ms, JSON.stringify(g3));
        // (R: fifteen minutes pass, a skip, and the toast says so)
        await page.keyboard.press('KeyR');
        await page.waitForFunction(() => /minutes stepped/.test(document.querySelector('.toasts').innerText), null, { timeout: 5000 }).catch(() => {});
        const r = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, toast: document.querySelector('.toasts').innerText }), H);
        assert(r.ms - g3.ms >= 15 * 60000 && /15 minutes stepped/.test(r.toast), JSON.stringify(r));
        console.log(`      Ironman career; held Z 1 s: walked ${fmt(p0.z - p1.z, 2)} m; Space: clock still; Esc: '${m.reasons}'; G held the clock ${g2.ms - g1.ms} ms over 0.5 s; R: +${fmt((r.ms - g3.ms) / 60000, 1)} min, '${r.toast.split('\n')[0]}'`);
      }, { query: 'nostore=1' });
    },
  },
  {
    name: 'determinism in the page: a save, 400 ticks, a skip, 400 ticks; loaded and run again, the same bytes',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        const res = await page.evaluate((h) => {
          const o = window[h];
          o.pause(true);
          const json = o.save();
          const run = () => { o.step(400, { mx: 1, mz: 0 }); o.skip(20 * 60000, { what: 'chow' }); o.step(400, { mx: -1, run: true }); };
          run();
          const a = o.save();
          o.start(json); o.pause(true);
          run();
          const s = o.state, me = s.actors.list.find(x => x.id === s.player.actor);
          return { same: a === o.save(), bytes: a.length, x: me.x, ms: s.clock.ms - JSON.parse(json).clock.ms };
        }, H);
        assert(res.same, 'a loaded save carried on differently');
        console.log(`      800 ticks and a 20-min skip, twice from one save: identical (${res.bytes} bytes; x ${fmt(res.x, 2)} m; ${fmt(res.ms / 60000, 1)} game minutes)`);
      }, { query: 'play=sandbox&seed=4&hour=6&nostore=1' });
    },
  },
  {
    name: 'the title from the keyboard: Tab, the arrows and S move between its buttons and Enter presses one; in debug mode the keys card lists ^ and $ and says R waits (0.0.2: focus stayed on New career)',
    heavy: true,
    async fn() {
      await withGame(async (page, errors) => {
        const focused = () => page.evaluate(() => document.activeElement?.className ?? null);
        const start = await focused();
        await page.keyboard.press('ArrowDown'); const down = await focused();
        await page.keyboard.press('KeyS'); const s = await focused();
        await page.keyboard.press('ArrowUp'); const up = await focused();
        await page.keyboard.press('Tab'); const tab = await focused();
        // (to New career and Enter: the enlistment page, whose buttons the arrows walk too, Esc back)
        await page.evaluate(() => document.querySelector('#title .item.career').focus());
        await page.keyboard.press('Enter');
        const enlist = await page.evaluate(() => window.__olympus && document.querySelector('#title .sheet.enlist') !== null);
        await page.keyboard.press('ArrowDown'); const e1 = await focused();
        await page.keyboard.press('ArrowDown'); const e2 = await focused();
        console.log(`      the title: ${start} → ArrowDown ${down} → S ${s} → ArrowUp ${up} → Tab ${tab}; Enter on New career: the enlistment page ${enlist}, its arrows ${e1} → ${e2}`);
        assert(start === 'item lead career' && down === 'item load' && s === 'item lead career' && up === 'item load' && tab !== start, JSON.stringify({ start, down, s, up, tab }));
        assert(enlist && e1 === 'item ironman' && e2 === 'item small', JSON.stringify({ enlist, e1, e2 }));
        await page.keyboard.press('Escape');
        // (in play in debug mode: the keys card, opened with ?, in this build's words)
        await page.goto(page.url().replace(/\?.*$/, '') + '?play=sandbox&seed=2&nostore=1&debug=1');
        await page.waitForFunction(() => window.__ready === true);
        await page.keyboard.press('?');
        await page.waitForFunction(() => document.querySelector('.glass.keys'));
        const card = await page.evaluate(() => document.querySelector('.glass.keys').innerText);
        console.log(`      the keys card in debug mode: ${card.split('\n').filter(l => /\^|\$|wait|debug/.test(l)).join(' | ')}`);
        assert(/\^\s*debug: 15 min pass/.test(card) && /\$\s*debug: 1 h pass/.test(card) && /R\s*wait 15 min/.test(card), card);
        assert(!errors.length, errors.join('\n'));
      });
    },
  },
];
