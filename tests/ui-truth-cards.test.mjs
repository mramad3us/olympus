// OLYMPUS tests: the end card's truth cards in the page (the build sheet v0.0.24 item 19, F122; samples/truth-cards T-a, the default).
//
// The tier one by the scene's own bot (tests/bots/house.mjs, T) on 48213, the house as set, to his card at 1024 × 768 and 1600 × 900:
// under the plan, a row of the truth cards (src/ui/cards/house.js truthRowEl), one a stand engaged, in the order engaged, each at
// CARD_MIN in whole pixels (its canvas's CSS size its own), captioned with its room, its stand, the time of the first round and what
// you read; the side neither scrolls nor meets the card; no page error. Without the change the card had no truth cards (v0.0.23: a
// stand's truth card only when clicked on the plan). Heavy: a browser. (The sheet's name, ui-truth, is v0.0.7's test of truth never
// leaking to the interface: this file is ui-truth-cards.)
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

const LANE = 'play=test-shoothouse&setup=go&tier=tierone&seed=48213&nostore=1';

export default [
  {
    name: 'F122 the end card\'s truth cards in the page: a row under the plan, one card a stand engaged in order, whole pixels at CARD_MIN, captioned; nothing overlaps or scrolls at 1024 × 768 and 1600 × 900',
    heavy: true,
    timeoutMs: 600_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [];
      await withGame(async (page, errors, game) => {
        for (const [w, h] of [[1024, 768], [1600, 900]]) {
          await page.setViewportSize({ width: w, height: h });
          await game.open(LANE);
          await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
          const ended = await page.evaluate(async () => {
            const O = window.__olympus, { houseBot } = await import('/tests/bots/house.mjs'), bot = houseBot({ mode: 'T' }), mem = {};
            O.pause(true);
            for (let n = 0; n < 400000 && !O.scene?.ended; n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, mem)); }
            O.pause(false);
            return !!O.scene?.ended;
          });
          assert(ended, 'the tier one did not reach his card');
          await page.keyboard.press('Enter');
          await page.waitForSelector('.house-truth', { timeout: 30000 });
          await page.waitForTimeout(300);
          const L = await page.evaluate(() => {
            const box = (e) => e.getBoundingClientRect(), t = document.querySelector('.house-truth'), side = document.querySelector('.end-wrap .house-side'), end = document.querySelector('.glass.end');
            const cvs = [...t.querySelectorAll('canvas')], tb = box(t), eb = box(end), sb = box(side);
            const engaged = window.__olympus.state.armoury.range.turners.filter(T => T.atFirst).sort((a, b) => a.atFirst.ms - b.atFirst.ms).map(T => String(T.stand).toUpperCase());
            return { open: t.open, n: cvs.length, engaged, stands: [...t.querySelectorAll('.truth-card')].map(f => f.dataset.stand.toUpperCase()),
              whole: cvs.every(c => Math.abs(box(c).width - c.width) < 0.01 && Math.abs(box(c).height - c.height) < 0.01), size: cvs[0]?.width ?? 0,
              caps: [...t.querySelectorAll('figcaption')].map(c => c.textContent), under: tb.top >= box(document.querySelector('.houseplan')).bottom - 1,
              meets: !(tb.right <= eb.left || tb.left >= eb.right || tb.bottom <= eb.top || tb.top >= eb.bottom), scroll: side.scrollHeight - side.clientHeight, inWin: sb.bottom <= innerHeight + 1 && sb.right <= innerWidth + 1 };
          });
          rows.push(`${w} × ${h}: ${L.n} truth cards (${L.stands.join(', ')}; engaged ${L.engaged.join(', ')}), ${L.size} px, whole ${L.whole}, under the plan ${L.under}, meets the card ${L.meets}, the side scrolls ${L.scroll} px; "${L.caps[0]}"`);
          assert(L.open && L.n > 0 && JSON.stringify(L.stands) === JSON.stringify(L.engaged) && L.whole && L.size === 170 && L.under && !L.meets && L.scroll <= 1 && L.inWin && L.caps.every(c => /^(ROOM \d|HALL) · \w+ · \d+\.\d S · READ /.test(c)), JSON.stringify(L));
        }
        for (const r of rows) console.log(`      ${r}`);
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
];
