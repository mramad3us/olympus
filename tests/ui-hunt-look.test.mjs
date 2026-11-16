// OLYMPUS tests: the I card's fit in the page (the hunt of v0.0.18, look-8), heavy: a browser.
//
// With the breach or the full kit the device pouches' tiles ran the I card off the screen at 1280 × 720 (scrollHeight 738 and
// 776 against 660) and at 1920 × 1080 for the full kit (1031 against 992), the footer "I or Esc to close" cut, and on macOS no
// scrollbar to say the card scrolled. The tiles now go two to a row, the plaque and the footer stay put and only the card's body
// scrolls, with its bar shown. Held here: every loadout at three sizes shows the whole card on the screen, the footer inside it,
// and the body scrolling nothing it hides. Fails without the style's grid and the fixed footer.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default [
  {
    name: 'the I card fits the screen with every loadout (standard, breach, full, cut, mixed) at 1280 × 720, 1920 × 1080 and 1024 × 640, its footer inside the card and nothing hidden below its body (the hunt of v0.0.18, look-8: the breach and full kits ran it off the screen, the footer cut)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, bad = [];
      await withGame(async (page, errors, game) => {
        for (const L of ['standard', 'breach', 'full', 'cut', 'mixed']) {
          await game.open(`play=test-shoothouse&tier=sgt&setup=go&loadout=${L}&seed=48213&nostore=1`);
          for (const [w, h] of [[1280, 720], [1920, 1080], [1024, 640]]) {
            await page.setViewportSize({ width: w, height: h }); await sleep(300);
            await page.keyboard.press('KeyI'); await page.waitForSelector('.glass.pockets'); await sleep(200);
            const r = await page.evaluate(() => {
              const g = document.querySelector('.glass.pockets'), b = g.getBoundingClientRect(), body = g.querySelector('.pk-body'), note = g.querySelector(':scope > .note').getBoundingClientRect();
              return { top: Math.round(b.top), bottom: Math.round(b.bottom), vh: innerHeight, noteBottom: Math.round(note.bottom), cardOver: g.scrollHeight - g.clientHeight, bodyOver: body.scrollHeight - body.clientHeight, tiles: g.querySelectorAll('.pk-pocket').length };
            });
            console.log(`      ${L} ${w}×${h}: the card ${r.top} to ${r.bottom} of ${r.vh} px, the footer to ${r.noteBottom}, ${r.tiles} tiles, hidden below the body ${r.bodyOver} px`);
            if (r.top < 0 || r.bottom > r.vh || r.noteBottom > r.bottom || r.cardOver > 1 || r.bodyOver > 1) bad.push({ L, w, h, ...r });
            await page.keyboard.press('Escape'); await sleep(200);
          }
        }
      }, { port, viewport: { width: 1280, height: 720 }, query: 'play=test-shoothouse&tier=sgt&setup=go&seed=48213&nostore=1' });
      assert(!bad.length, JSON.stringify(bad));
    },
  },
];
