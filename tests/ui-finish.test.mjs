// A rifle's finish in the page (heavy: the browser; the user, 2026-11-08: "Make sure we have multiple colors so we can equip ourselves
// to camo in environments depending on deployments"; src/data/finishes.js).
//
// main.js reads the gun's finish from the item by its id (firearms.js finishOf, never from the belief: ui-truth) and the step panel
// paints the weapon card in it; view.js puts gunLook's finish on the figure's look. On test-handling's bench (prone on the 25 m line,
// stop motion), the player's R-7 is reissued in Mars rust: the weapon card on the page shows the regolith's rust where it showed none
// in black, and the stage's picture, with the HUD hidden, changes only at the player's rifle, every changed pixel redder.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { PNG } from './png-read.mjs';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default [
  {
    name: 'the player\'s R-7 reissued in Mars rust on test-handling\'s bench: the weapon card on the page turns rust (none in black), and the figure\'s rifle on the stage is redder where nothing else moves',
    heavy: true,
    timeoutMs: 180_000,
    async fn() {
      await withGame(async (page) => {
        // (the weapon card's canvas: its rust pixels, the regolith's 0xa65e4b, Mars rust's base)
        const cardRust = () => page.evaluate(() => {
          const cv = document.querySelector('.wcard-pic');
          if (!cv || cv.hidden) return -1;
          const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
          let n = 0;
          for (let i = 0; i < d.length; i += 4) if (d[i] === 0xa6 && d[i + 1] === 0x5e && d[i + 2] === 0x4b) n++;
          return n;
        });
        const reissue = (finish) => page.evaluate((f) => { const s = window.__olympus.state, g = s.items[s.stop.gun]; if (f) g.finish = f; else delete g.finish; return s.stop.gun; }, finish);
        await sleep(1500);
        const black = await cardRust();
        // (the stage alone: the HUD hidden, so only the picture is compared)
        await page.addStyleTag({ content: '.hud, .steps { visibility: hidden !important; }' });
        await sleep(800);
        const stage = page.locator('canvas').first(), shot = async () => PNG.read(await stage.screenshot());
        const a = await shot();
        await sleep(600);
        const a2 = await shot();
        const gunId = await reissue('mars');
        await sleep(2500);
        const b = await shot();
        const diff = (p, q) => {
          let n = 0, redder = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
          for (let i = 0; i < p.data.length; i += 4) {
            if (p.data[i] === q.data[i] && p.data[i + 1] === q.data[i + 1] && p.data[i + 2] === q.data[i + 2]) continue;
            n++;
            const k = i / 4, x = k % p.w, y = Math.floor(k / p.w);
            x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
            if (q.data[i] - q.data[i + 2] > p.data[i] - p.data[i + 2] + 20) redder++;
          }
          return { n, redder, box: n ? [x0, y0, x1 - x0 + 1, y1 - y0 + 1] : null };
        };
        const still = diff(a, a2), rust = diff(a2, b);
        await page.evaluate(() => document.querySelectorAll('style').forEach(st => { if (/visibility: hidden !important/.test(st.textContent)) st.remove(); }));
        await sleep(1500);
        const mars = await cardRust();
        console.log(`      the card: ${black} rust pixels in black, ${mars} with ${gunId} in Mars rust; the stage: ${still.n} px moved standing still, ${rust.n} after the reissue (${rust.redder} redder) in a box ${JSON.stringify(rust.box)}`);
        assert(black === 0 && mars > 300, JSON.stringify({ black, mars }));
        assert(still.n === 0 && rust.n > 20 && rust.redder === rust.n && rust.box[2] <= 48 && rust.box[3] <= 48, JSON.stringify({ still, rust }));
      }, { query: 'play=test-handling&setup=bench&seed=48213&nostore=1' });
    },
  },
];
