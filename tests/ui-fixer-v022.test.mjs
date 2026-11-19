// OLYMPUS tests: v0.0.22's fixer in the page (the play review of 2026-11-17), each case failing without its fix.
//
// The picker for "Stack and clear" with a session's bests fits a 1280 × 720 window unscrolled, Back on it (the best on the sheet's
// own line, not a line of its own); and its House B starts lane B (boot.js pickedScene: the page played lane A). Heavy (a browser,
// its own port: OLYMPUS_TEST_PORT).
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

const port = () => Number(process.env.OLYMPUS_TEST_PORT) || undefined;
const run = (sheet, laneMs, go) => ({ scene: 'test-shoothouse', sheet, loadout: null, seed: 1, laneMs, go, why: [], atIso: '2026-11-17T00:00:00Z', version: 'test' });
const RUNS = { v: 1, runs: [run('recruit', 98000, false), run('private', 74000, false), run('cpl', 61000, true), run('sgt', 52800, true), run('raider', 44100, true), run('tierone', 41000, true)] };
const toPicker = async (page) => {
  await page.waitForSelector('#title .item.tests');
  await page.click('#title .item.tests');
  await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.split('\n')[0].trim() === 'Stack and clear')?.click());
  await page.waitForSelector('#title .item.drawpick');
  await page.waitForTimeout(300);
};

export default [
  {
    name: 'the picker of "Stack and clear" with a best on every sheet fits 1280 × 720 unscrolled, Back on it; and its House B starts lane B (the play review of 2026-11-17: Back 95 px below the fold once a session had bests; B lit and lane A played)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      let got = null;
      await withGame(async (page, errors) => {
        await toPicker(page);
        const fit = await page.evaluate(() => {
          const b = [...document.querySelectorAll('#title button')].find(x => x.textContent.trim() === 'Back'), sheet = document.querySelector('#title .sheet');
          return { back: Math.round(b.getBoundingClientRect().bottom), h: innerHeight, bests: document.querySelectorAll('#title small.best').length, scroll: Math.max(0, (sheet?.scrollHeight ?? 0) - (sheet?.clientHeight ?? 0)) };
        });
        // (House B lit by its chip, then the sergeant: the lane the page starts)
        await page.evaluate(() => [...document.querySelectorAll('#title .item.drawpick')].find(b => b.textContent.trim() === 'B')?.click());
        await page.evaluate(() => [...document.querySelectorAll('#title .item.sheetpick')].find(b => b.dataset.tier === 'sgt')?.click());
        await page.waitForFunction(() => window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        const lane = await page.evaluate(() => { const H = window.__olympus.state.armoury.range.house; return { draw: H.draw ? { code: H.draw.code, layout: H.draw.layout ?? null } : null, tier: H.tier }; });
        got = { fit, lane, errors: [...errors] };
        errors.length = 0;
      }, { port: port(), query: 'nostore=1', viewport: { width: 1280, height: 720 }, init: (r) => { try { localStorage.setItem('olympus.house', JSON.stringify(r)); } catch { /* (no storage) */ } }, initArg: RUNS });
      console.log(`      1280 × 720 with ${got.fit.bests} bests: Back's foot at ${got.fit.back} px of ${got.fit.h}; House B and the sergeant: ${JSON.stringify(got.lane)}`);
      assert(got.fit.bests === 6 && got.fit.back <= got.fit.h && got.lane.tier === 'sgt' && got.lane.draw?.layout === 'B' && !got.errors.length, JSON.stringify(got));
    },
  },
];
