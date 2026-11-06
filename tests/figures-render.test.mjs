// OLYMPUS tests: the figures on the stage (src/render/figures.js), in a real browser. Heavy.
//
// The figures sample's lineup (samples/figures/?view=lineup) at 16 and 24 px/m, in its budget mode
// (nobody "own", so everyone comes in within the render's budget): no page or console errors, the
// chibi's 20 people drawn (the one figure since the user's pick, 2026-11-06), at most SHEETS_PER_FRAME bands sent up in any frame (the user,
// tradecraft 2026-10-29: "each time I turn it staggers almost a second"), nothing sent once all are in,
// and the figures in a handful of draw calls. It prints the atlas's numbers: the sheet, the slots, the
// uploads and what each costs. On OLYMPUS_TEST_PORT (the browser tests' 8223 by default), so a parallel
// agent's run is its own.
import { assert } from './helpers.mjs';
import { withGame, BROWSER_TEST_PORT } from './browser.mjs';

const PORT = BROWSER_TEST_PORT;

export default [
  {
    name: 'the lineup draws the chibi on the stage with no errors, at most two bands sent a frame and none once everyone is in (16 and 24 px/m)',
    heavy: true,
    timeoutMs: 120000,
    async fn() {
      await withGame(async (page, errors, game) => {
        for (const ppm of [16, 24]) {
          if (ppm !== 16) await game.open(`view=lineup&ppm=${ppm}&budget=1&hud=0`);
          await page.evaluate(() => new Promise(r => { let n = 0; const f = () => (++n < 20 ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); }));
          const r = await page.evaluate(() => window.__report);
          const b = r.budget;
          console.log(`      ${ppm} px/m: ${r.drawn} drawn; atlas ${r.atlas.px}², sheet ${r.atlas.sheet.join('×')} (${r.atlas.slots} slots); ${r.uploads} bands sent, ${r.uploadKB} KB, ${r.perUpload.kB} KB and ${r.perUpload.ms} ms each; at most ${b.maxUploadsPerFrame} a frame (${b.maxKBPerFrame} KB, ${b.maxPaintMsPerFrame} ms painting); all in after ${b.framesToAll} frames, ${b.steadyUploads} sent after; ${r.calls.total} draw calls (scene ${r.calls.scene})`);
          assert(r.drawn === 20, `${r.drawn} drawn`);
          assert(b.maxUploadsPerFrame <= 2, 'at most two bands a frame');
          assert(b.steadyUploads === 0, 'nothing sent once everyone is in');
          assert(r.calls.scene <= 1 + 3, 'the figures in three instanced draws at most');
        }
      }, { port: PORT, at: '/samples/figures/', query: 'view=lineup&ppm=16&budget=1&hud=0', viewport: { width: 1280, height: 720 }, timeoutMs: 60000 });
    },
  },
  {
    name: 'the sheets and the close figure pages draw with no errors',
    heavy: true,
    timeoutMs: 120000,
    async fn() {
      await withGame(async (page, errors, game) => {
        const sheets = await page.evaluate(() => window.__report);
        await game.open('view=doll&ppm=24');
        const dolls = await page.evaluate(() => window.__report);
        console.log(`      sheets (chibi, 16 px/m): ${sheets.sheet.join(' × ')}, painted in ${Object.values(sheets.paintMs).map(v => `${v}`).join(', ')} ms; dolls at 24 px/m: ${dolls.dolls.map(d => `${d.w}×${d.h} ${d.ms} ms`).join(', ')}`);
        assert(Object.keys(sheets.paintMs).length === 7 && dolls.dolls.length >= 5, 'every sheet and doll');
      }, { port: PORT, at: '/samples/figures/', query: 'view=sheets&ppm=16', timeoutMs: 60000 });
    },
  },
];
