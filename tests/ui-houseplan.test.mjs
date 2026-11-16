// OLYMPUS tests: the shoot house's end card in the page with the plan view, the verdict and the export (the build sheet v0.0.20 §1 items 20, 21, 25, 26; card C2, C5, C7).
//
// The tier one's lane run to its end by the scene's own bot in the page (tests/bots/house.mjs, T), then the card: the verdict leads
// it ("GO"), the plan view stands beside it over the run sheet, in whole pixels at its own scale; the scrubber moved moves both men
// (the canvas changes), a fault's line seeks to SEEK_LEAD_MS before it (a fault forced on the record before the card), a stand
// clicked opens its truth card under the plan; after a GO the first "Again as" is the next sheet up; "Export the run" downloads a
// file that replays in node to the same run sheet and save (tests/replay-run.mjs), the hot wash's fast-forward run by the page's own
// loop at 1600 × 900, as a player has it (the C and D review of 2026-11-16: a log kept on the polls replayed short there); and
// nothing overlaps or scrolls at 1024 × 768 and 1600 × 900. Heavy: a browser.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { replayRun } from './replay-run.mjs';
import { readFileSync } from 'node:fs';

const LANE = 'play=test-shoothouse&setup=go&tier=tierone&seed=48213&nostore=1';
async function toCard(page, game, { fault = false, realWash = false } = {}) {
  await game.open(LANE);
  await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
  const ended = await page.evaluate(async ({ fault, realWash }) => {
    const O = window.__olympus, { houseBot } = await import('/tests/bots/house.mjs'), bot = houseBot({ mode: 'T' }), mem = {};
    // (the bot's memory kept off the state, as a player has none: the export's save is then the lane's alone; with realWash the
    // bot plays the lane by hand to its end and the page's own loop runs the hot wash's fast-forward, up to 40 ticks a frame, as it
    // does for a player: a log kept on the loop's polls replayed short there, the C and D review of 2026-11-16)
    const washing = () => realWash && O.state.armoury.range.house.end && O.state.skip?.engine === 'ff';
    O.pause(true);
    for (let n = 0; n < 400000 && !O.scene?.ended && !washing(); n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, mem)); }
    if (washing()) { O.pause(false); return 'wash'; }
    // (at 1024 × 768 a fault forced on the record before the card, so the plan has one to seek to: a corner in room 2, at its leg's
    // clear less 2 s; the export is read at 1600 × 900, its record untouched)
    if (fault) { const L = O.state.armoury.range.house.rooms[1]; L.faults.push({ kind: 'corner', atMs: L.clearAtMs - 2000 }); }
    O.pause(false);
    return !!O.scene?.ended;
  }, { fault, realWash });
  if (ended === 'wash') await page.waitForFunction(() => !!window.__olympus.scene?.ended, null, { timeout: 240000 });
  else if (!ended) return false;
  await page.keyboard.press('Enter');
  await page.waitForSelector('.glass.end .houseplan, .glass.end', { timeout: 30000 });
  await page.waitForSelector('.houseplan', { timeout: 10000 });
  return true;
          }
const layout = (page) => page.evaluate(() => {
  const inWin = (b) => !!b && b.left >= -0.5 && b.top >= -0.5 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1;
  const e = document.querySelector('.glass.end'), r = e.getBoundingClientRect(), side = document.querySelector('.end-wrap .house-side'), sr = side.getBoundingClientRect(), cv = document.querySelector('.houseplan canvas'), cr = cv.getBoundingClientRect();
  return { win: [innerWidth, innerHeight], parts: [...e.children].map(c => `${c.className || c.tagName}:${Math.round(c.getBoundingClientRect().height)}`).join(' '), glass: { in: inWin(r), scroll: e.scrollHeight - e.clientHeight }, side: { in: inWin(sr), meets: sr.right > r.left + 1 && sr.left < r.right - 1, scroll: side.scrollHeight - side.clientHeight }, canvas: { w: cv.width, h: cv.height, cssW: cr.width, cssH: cr.height, whole: cr.width === cv.width && cr.height === cv.height },
    verdict: e.querySelector('.verdict')?.textContent ?? null, again: [...e.querySelectorAll('.item.again-as')].map(b => b.textContent), lines: [...e.querySelectorAll('.glass-list .item')].map(b => b.textContent),
    // (a choice whose words are cut (v0.0.20's fixer, the play review: "Score it six aspec", "Again as Boot rec" at 1600 × 900))
    cut: [...e.querySelectorAll('.glass-list .item')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent) };
});
const pixels = (page) => page.evaluate(() => { const cv = document.querySelector('.houseplan canvas'), g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height).data; let h = 0; for (let i = 0; i < d.length; i += 7) h = (h * 31 + d[i]) >>> 0; return h; });

export default [
  {
    name: 'the house\'s end card with the plan view: GO leads, the plan in whole pixels beside the card over the run sheet, the scrubber moves the men, a fault seeks SEEK_LEAD_MS before it, a stand opens its truth card, Again as the next sheet up, the export replays in node; nothing overlaps or scrolls at 1024 × 768 and 1600 × 900',
    heavy: true,
    timeoutMs: 600_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [];
      await withGame(async (page, errors, game) => {
        for (const [w, h] of [[1024, 768], [1600, 900]]) {
          await page.setViewportSize({ width: w, height: h });
          if (!(await toCard(page, game, { fault: w === 1024, realWash: w !== 1024 }))) { rows.push(`${w} × ${h}: the bot did not reach the card`); assert(false, 'no card'); }
          const L = await layout(page);
          rows.push(`${w} × ${h}: ${JSON.stringify(L.glass)} the side ${JSON.stringify(L.side)}; the plan ${L.canvas.w} × ${L.canvas.h} (css ${L.canvas.cssW} × ${L.canvas.cssH}); "${L.verdict}"; Again as ${L.again[0] ?? 'none'}; ${L.lines.length} lines`);
          assert(L.glass.in && L.glass.scroll <= 1 && L.side.in && !L.side.meets && L.side.scroll <= 1 && L.canvas.whole && !L.cut.length, JSON.stringify(L));
          assert(/\bGO\.$/.test(L.verdict ?? '') && /^\d?Again as /.test(L.again[0] ?? '') && L.lines.some(t => /Export the run/.test(t)), JSON.stringify(L));
          if (w === 1024) {
            // (the scrubber: a seek moves the men, the canvas changes)
            const p0 = await pixels(page);
            await page.evaluate(() => window.__report.plan.seek(window.__report.plan.ms + 12_000));
            const p1 = await pixels(page), ms1 = await page.evaluate(() => window.__report.plan.ms);
            // (the fault's line seeks SEEK_LEAD_MS before it)
            await page.click('.houseplan .plan-fault');
            const sought = await page.evaluate(() => { const s = window.__olympus.state, L = s.armoury.range.house.rooms[1]; return { ms: window.__report.plan.ms, want: L.clearAtMs - 2000 - 1500 }; });
            // (a stand clicked: its truth card under the plan)
            const hit = await page.evaluate(() => { const cv = document.querySelector('.houseplan canvas'), r = cv.getBoundingClientRect(), s = window.__olympus.state, T = s.armoury.range.turners.find(t => t.stand === '1a');
              const F = window.__report.plan.frame; return { x: r.left + 6 + (T.x - F.x0) * F.pxM, y: r.top + 6 + (T.z - F.z0) * F.pxM }; });
            await page.mouse.click(hit.x, hit.y);
            await page.waitForTimeout(200);
            const truth = await page.evaluate(() => ({ stand: window.__report.plan.stand, kids: document.querySelector('.plan-truth')?.children.length ?? 0 }));
            rows.push(`  the seek to +12 s: the canvas ${p0 === p1 ? 'THE SAME' : 'changed'} (${ms1} ms); the fault's line at ${sought.ms} against ${sought.want}; the stand 1a clicked: ${JSON.stringify(truth)}`);
            assert(p0 !== p1 && sought.ms === sought.want && truth.stand === '1a' && truth.kids > 0, JSON.stringify({ p0, p1, sought, truth }));
          } else {
            // (the export: a download that replays in node)
            const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.evaluate(() => [...document.querySelectorAll('.glass.end .item')].find(b => /Export the run/.test(b.textContent)).click())]);
            const file = await dl.path(), run = JSON.parse(readFileSync(file, 'utf8')), r = replayRun(run);
            rows.push(`  exported ${run.inputs.length} inputs over ${run.steps} calls, ${(JSON.stringify(run).length / 1024).toFixed(1)} KB: replayed, the run sheet ${r.same.sheet ? 'the same' : 'DIFFERENT'}, the save ${r.same.save ? 'the same' : 'DIFFERENT'}`);
            assert(r.same.sheet && r.same.save, JSON.stringify(r.same));
          }
        }
        for (const r of rows) console.log(`      ${r}`);
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
];
