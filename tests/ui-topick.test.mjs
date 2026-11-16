// OLYMPUS tests: the Esc menu's To score page in the page (the build sheet v0.0.20 item 10; feel.md FL-2), heavy: a browser.
//
// The waiting samples are judged where they move: from the Esc menu, "To score" opens a page whose rows apply at once, behind
// it. In the house on seed 48213 at GO: Helmet R1 changes your #2's pixels within 2 frames (his figure's look carries the
// helm, the stage repaints it); the shot's row sets the engine's candidate (A0, &sound=old's report; A3 the house's); the walk's
// row the view's cycle; a score and a star kept; "Copy my picks" gives the gallery's line form, which topick.js picksOf reads
// back; Back returns to the menu. No page error. Fails without the page, its menu line and main.js's applying of the rows.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { picksOf } from '../src/ui/cards/topick.js';

export default [
  {
    name: 'To score from the Esc menu: Helmet R1 on your #2 within 2 frames, Shot A0 and A3, Walk A, a score and a star, Copy my picks read back by picksOf, Back to the menu; no page errors',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [];
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
        await game.open('play=test-shoothouse&setup=go&tier=private&seed=48213&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        // (your #2's figure as the stage drew it: his look's key in the view's people)
        const twoKey = () => page.evaluate(() => ({ look: window.__olympus.picks().twoLook, $look: window.__olympus.state.$look ?? null }));
        const frames = (n) => page.evaluate((k) => new Promise(r => { let i = 0; const f = () => (++i >= k ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
        await page.keyboard.press('Escape');
        await page.waitForSelector('.overlay .menu');
        const line = await page.evaluate(() => [...document.querySelectorAll('.overlay .menu .item')].map(b => b.innerText.replace(/\s+/g, ' ').trim()));
        await page.evaluate(() => [...document.querySelectorAll('.overlay .menu .item')].find(b => /To score/.test(b.innerText)).click());
        await page.waitForSelector('.overlay .topick');
        const rowsSeen = await page.evaluate(() => [...document.querySelectorAll('.overlay .topick .topick-row .title')].map(e => e.textContent));
        const before = await twoKey();
        const chip = (title, text) => page.evaluate(([t, x]) => { const row = [...document.querySelectorAll('.overlay .topick .topick-row')].find(r => r.querySelector('.title').textContent === t); [...row.querySelectorAll('.chip')].find(b => b.textContent.startsWith(x)).click(); }, [title, text]);
        await chip('Helmets', 'R1');
        // (the page is over the picture, the game paused: the stage still draws behind its veil; two frames)
        await frames(2);
        const after = await twoKey();
        const shotA0 = await (async () => { await chip('The shot', 'A0'); return page.evaluate(() => window.__olympus.picks().shot); })();
        await chip('The shot', 'A3');
        await page.waitForFunction(() => window.__olympus.picks().shot === 'A3', null, { timeout: 20000 }).catch(() => {});
        const shotA3 = await page.evaluate(() => window.__olympus.picks().shot);
        await chip('The walk', 'A');
        const walk = await page.evaluate(() => window.__olympus.state.$cycle ?? null);
        await page.evaluate(() => { const row = [...document.querySelectorAll('.overlay .topick .topick-row')].find(r => r.querySelector('.title').textContent === 'Helmets'); const sl = row.querySelector('input[type=range]'); sl.value = '70'; sl.dispatchEvent(new Event('input')); row.querySelector('.star').click(); });
        await page.evaluate(() => [...document.querySelectorAll('.overlay .topick .item')].find(b => b.textContent === 'Copy my picks').click());
        await page.waitForTimeout(200);
        const text = await page.evaluate(async () => { try { return await navigator.clipboard.readText(); } catch { return document.querySelector('.overlay .topick .note:last-child')?.textContent ?? ''; } });
        const back = picksOf(text);
        await page.evaluate(() => [...document.querySelectorAll('.overlay .topick .item')].find(b => b.textContent === 'Back').click());
        const menuAgain = await page.evaluate(() => !!document.querySelector('.overlay .menu') && !document.querySelector('.overlay .topick'));
        rows.push(`the menu: ${line.join(' | ')}; the page's rows: ${rowsSeen.join(', ')}`);
        rows.push(`Helmet R1: state.$look ${JSON.stringify(after.$look)}; your #2's look ${before.look === after.look ? 'the same' : 'changed'}; the shot A0 → ${shotA0}, A3 → ${shotA3}; the walk A → state.$cycle ${walk}; copied: ${text.split('\n').join(' | ')}; read back ${back.picks.length} picks; Back to the menu ${menuAgain}`);
        assert(line.some(l => /To score/.test(l)) && rowsSeen.length === 8 && after.$look?.helm === 'R1' && before.look && after.look !== before.look, JSON.stringify({ line, rowsSeen, before, after }));
        assert(shotA0 === 'A0' && shotA3 === 'A3' && walk === 'A' && back.picks.some(p => p.id === 'R1' && p.star && p.score === 70) && menuAgain, JSON.stringify({ shotA0, shotA3, walk, text, menuAgain }));
      }, { port });
      for (const r of rows) console.log(`      ${r}`);
    },
  },
];
