// OLYMPUS tests: the loadout screen in the page (WEAPONS §12.7; the build sheet 0.0.18 §5.3; src/ui/cards/loadout.js), heavy: a browser.
//
// The user, 2026-11-15: "a loadout screen where the marine draws and carries them". From the Tests menu's "Stack and clear" the
// picker shows "Kit: Standard ▸"; its screen puts a G-11 on the left face, the place saying the sim's 0.38 kg and 1.38 s at the
// private's Weapon handling 10, Kit up carries the code, and the lane starts with it. &loadout= does the same from the URL, an
// unknown one dropped with a toast. Fails without the screen, the picker's row, boot.js's and main.js's carrying of the code.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

export default [
  {
    name: 'the loadout screen opens from the picker, puts a G-11 on the left face showing 0.38 kg and 1.38 s at WH 10, and the lane starts with it (two G-11s on you and your #2); &loadout=breach from the URL, an unknown one dropped with a toast; no page errors',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [];
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('nostore=1');
        await page.waitForSelector('#title .item.tests');
        await page.click('#title .item.tests');
        await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.startsWith('Stack and clear')).click());
        await page.waitForSelector('#title .item.kitpick');
        const before = await page.evaluate(() => document.querySelector('#title .item.kitpick').textContent);
        await page.click('#title .item.kitpick');
        await page.waitForSelector('#title .sheet.loadout');
        await page.click('#title .sheet.loadout .item.issue[data-issue="g11"]');
        await page.click('#title .sheet.loadout .item.place[data-face="left"][data-i="0"]');
        const placed = await page.evaluate(() => {
          const b = document.querySelector('#title .sheet.loadout .item.place[data-face="left"][data-i="0"]'), r = b.getBoundingClientRect();
          return { item: b.dataset.item, text: b.innerText.replace(/\s+/g, ' '), mass: document.querySelector('#title .sheet.loadout .mass').textContent, code: document.querySelector('#title .sheet.loadout').dataset.code, inWin: r.right <= innerWidth && r.bottom <= innerHeight };
        });
        // (a halligan refused on a side, with its reason)
        await page.click('#title .sheet.loadout .item.issue[data-issue="hal"]');
        await page.click('#title .sheet.loadout .item.place[data-face="right"][data-i="0"]');
        const why = await page.evaluate(() => document.querySelector('#title .sheet.loadout .why').textContent);
        rows.push(`the picker '${before.trim()}'; the left face: '${placed.text}', the code ${placed.code}; ${placed.mass}; a halligan on the right: '${why}'`);
        assert(placed.item === 'g11' && /0\.38 kg · reach 1\.38 s/.test(placed.text) && placed.inWin && /halligan goes on your back/.test(why), JSON.stringify({ placed, why }));
        await page.focus('#title .sheet.loadout .item.kitup');
        await page.keyboard.press('Enter');
        await page.waitForSelector('#title .item.kitpick');
        const after = await page.evaluate(() => ({ text: document.querySelector('#title .item.kitpick').textContent, code: document.querySelector('#title .item.kitpick').dataset.code }));
        await page.evaluate(() => [...document.querySelectorAll('#title .item.sheetpick')].find(b => b.dataset.tier === 'private').click());
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        const lane = await page.evaluate(() => { const s = window.__olympus.state, H = s.armoury.range.house; const g = (pid) => Object.values(s.items).filter(x => x.model === 'g11').length; return { code: H.loadout, g11: Object.values(s.items).filter(x => x.model === 'g11').length }; });
        rows.push(`Kit up: '${after.text.trim()}' (${after.code}); the lane: loadout ${lane.code}, ${lane.g11} G-11s in the house`);
        assert(after.code === placed.code && lane.code === placed.code && lane.g11 === 2, JSON.stringify({ after, lane }));
        // (from the URL: the breach preset, then an unknown code)
        await game.open('play=test-shoothouse&setup=go&tier=private&seed=48213&loadout=breach&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        const br = await page.evaluate(() => window.__olympus.state.armoury.range.house.loadout);
        await game.open('play=test-shoothouse&setup=go&tier=private&seed=48213&loadout=vacuum&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        await page.waitForTimeout(300);
        const un = await page.evaluate(() => ({ code: window.__olympus.state.armoury.range.house.loadout ?? null, toast: document.querySelector('.toasts')?.innerText ?? '' }));
        rows.push(`&loadout=breach: ${br}; &loadout=vacuum: ${un.code ?? 'standard'}, the toast '${un.toast.replace(/\s+/g, ' ').trim()}'`);
        assert(br === 'breach' && un.code === null && /No loadout 'vacuum'/.test(un.toast), JSON.stringify({ br, un }));
      }, { port });
      for (const r of rows) console.log(`      ${r}`);
    },
  },  {
    name: 'the loadout screen works from the keys alone: Enter on the G-11 keeps the focus on it, the arrows reach the left face past the fixed front, Enter puts it there, 2 sets the Flash preset, Kit up carries it (the review of 2026-11-16: the focus fell to the page after Enter, and the arrows and the digits did nothing)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [];
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('nostore=1');
        await page.waitForSelector('#title .item.tests');
        await page.click('#title .item.tests');
        await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.startsWith('Stack and clear')).click());
        await page.waitForSelector('#title .item.kitpick');
        await page.focus('#title .item.kitpick');
        await page.keyboard.press('Enter');
        await page.waitForSelector('#title .sheet.loadout');
        const focus = () => page.evaluate(() => { const n = document.activeElement; return n?.dataset?.issue ? `issue:${n.dataset.issue}` : n?.dataset?.preset ? `preset:${n.dataset.preset}` : n?.dataset?.face ? `${n.dataset.face}${n.dataset.i}` : n?.classList?.contains('kitup') ? 'kitup' : n?.tagName ?? null; });
        const code = () => page.evaluate(() => document.querySelector('#title .sheet.loadout')?.dataset.code ?? null);
        const opened = await focus();
        await page.keyboard.press('Enter');
        const afterEnter = await focus();
        // (up the buttons to the left face's first place: the issue's row, then the back, the right and the left)
        let ups = 0;
        while ((await focus()) !== 'left0' && ups < 12) { await page.keyboard.press('ArrowUp'); ups++; }
        const reached = await focus();
        await page.keyboard.press('Enter');
        const placed = await code(), afterPut = await focus();
        await page.keyboard.press('Digit2');
        const preset = await code(), afterPreset = await focus();
        let downs = 0;
        while ((await focus()) !== 'kitup' && downs < 20) { await page.keyboard.press('ArrowDown'); downs++; }
        await page.keyboard.press('Enter');
        await page.waitForSelector('#title .item.kitpick');
        const carried = await page.evaluate(() => document.querySelector('#title .item.kitpick').dataset.code);
        rows.push(`opened on ${opened}; Enter: ${afterEnter}; ${ups} ArrowUp to ${reached}; Enter: ${placed} (focus ${afterPut}); 2: ${preset} (focus ${afterPreset}); ${downs} ArrowDown to Kit up; carried ${carried}`);
        assert(opened === 'issue:g11' && afterEnter === 'issue:g11' && reached === 'left0' && /left:g11/.test(placed ?? '') && afterPut === 'left0' && preset === 'flash' && afterPreset === 'left0' && carried === 'flash', JSON.stringify(rows));
      }, { port });
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'the loadout screen shows the marine (the build sheet v0.0.20 item 23; the user, 2026-11-15: "a loadout screen where the marine draws and carries them"): the gear doll beside the faces, choosing Flash draws the two G-11 pouches on the carrier\'s left face (its pixels change, its gear two devices), the redraw printed; Kit up in the window at 1600 × 900 (v0.0.20\'s fixer); no page errors',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [];
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('nostore=1');
        await page.waitForSelector('#title .item.tests');
        await page.click('#title .item.tests');
        await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.startsWith('Stack and clear')).click());
        await page.waitForSelector('#title .item.kitpick');
        await page.click('#title .item.kitpick');
        await page.waitForSelector('#title .sheet.loadout canvas.doll.marine');
        const read = () => page.evaluate(() => {
          const c = document.querySelector('#title .sheet.loadout canvas.doll.marine'), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data;
          let h = 2166136261 >>> 0, ink = 0; for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 16777619) >>> 0; if (i % 4 === 3 && d[i]) ink++; }
          const r = c.getBoundingClientRect(), faces = document.querySelector('#title .sheet.loadout .faces').getBoundingClientRect();
          // (Kit up and Back in the window with no scroll (v0.0.20's fixer, the play review: at 1600 × 900 Kit up sat at 905 to 950 px)
          const up = document.querySelector('#title .sheet.loadout .item.kitup').getBoundingClientRect();
          return { w: c.width, h: c.height, digest: h.toString(16), ink, devices: Number(c.dataset.devices), gear: c.dataset.gear, inWin: r.right <= innerWidth && r.bottom <= innerHeight, inFaces: r.top >= faces.top - 1 && r.bottom <= faces.bottom + 1, kitUp: Math.round(up.bottom), winH: innerHeight };
        });
        const std = await read();
        const t0 = await page.evaluate(() => performance.now());
        await page.keyboard.press('Digit2');
        await page.waitForFunction(() => document.querySelector('#title .sheet.loadout')?.dataset.code === 'flash');
        const ms = await page.evaluate((t) => performance.now() - t, t0);
        const fl = await read();
        rows.push(`the marine ${std.w} × ${std.h} px, ${std.ink} inked, its gear '${std.gear}' (${std.devices} devices), in the window ${std.inWin}; Flash: ${fl.devices} devices, '${fl.gear}', its pixels changed ${fl.digest !== std.digest}; the redraw ${ms.toFixed(1)} ms (the fill and the doll)`);
        rows.push(`Kit up's foot at ${std.kitUp} px in a window of ${std.winH}`);
        assert(std.ink > 500 && std.devices === 0 && fl.devices === 2 && /left0:g11,left1:g11/.test(fl.gear) && fl.digest !== std.digest && std.inWin && std.kitUp <= std.winH && fl.kitUp <= fl.winH, JSON.stringify({ std, fl }));
      }, { port });
      for (const r of rows) console.log(`      ${r}`);
    },
  },
];
