// OLYMPUS tests: the shoot house's end card in the page with the plan view, the verdict and the export (the build sheet v0.0.20 §1 items 20, 21, 25, 26; card C2, C5, C7).
//
// The tier one's lane run to its end by the scene's own bot in the page (tests/bots/house.mjs, T), then the card: the verdict leads
// it ("GO"), the plan view stands beside it over the run sheet, in whole pixels at its own scale; the scrubber moved moves both men
// (the canvas changes), a fault's line seeks to SEEK_LEAD_MS before it (a fault forced on the record before the card), a stand
// clicked opens its truth card under the plan; after a GO the first "Again as" is the next sheet up; "Export the run" downloads a
// file that replays in node to the same run sheet and save (tests/replay-run.mjs), the hot wash's fast-forward run by the page's own
// loop at 1600 × 900, as a player has it (the C and D review of 2026-11-16: a log kept on the polls replayed short there); and
// nothing overlaps or scrolls at 1024 × 768 and 1600 × 900. Heavy: a browser.
// v0.0.22 (its build sheet §1 item 16, §6 D, F83; the house lens's G4): the ghost. The private by the keys on 48213, then "Again as
// Tier one" from his card: the second card's plan offers the first as its ghost, drawn (the canvas with it is not the canvas
// without) in whole pixels; scrubbing moves him and his ghost; the clock reads "−5.8 s" at room 2's door; a 4× replay's slowest
// draw is under 16.7 ms × k (F83); at 1600 × 900 "Again" offers both runs, the one just before first; a drawn house's lane on the
// same seed offers none of the set's (the page's ghosts carried over the reload by the module itself); nothing overlaps or scrolls.
import { assert, machineK } from './helpers.mjs';
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
// (v0.0.22: a lane already started in the page played to its card by the scene's bot, a tick at a time, as toCard does)
async function playToCard(page, mode, tier) {
  await page.waitForFunction((t) => { const O = window.__olympus; return window.__ready && O.state?.armoury?.range?.house?.tier === t && !O.scene?.ended && !document.querySelector('.glass.end'); }, tier, { timeout: 60000 });
  const ended = await page.evaluate(async (mode) => {
    const O = window.__olympus, { houseBot } = await import('/tests/bots/house.mjs'), bot = houseBot({ mode }), mem = {};
    O.pause(true);
    for (let n = 0; n < 400000 && !O.scene?.ended; n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, mem)); }
    O.pause(false);
    return !!O.scene?.ended;
  }, mode);
  if (!ended) return false;
  await page.keyboard.press('Enter');
  await page.waitForSelector('.glass.end .houseplan, .glass.end', { timeout: 30000 });
  await page.waitForSelector('.houseplan', { timeout: 10000 });
  return true;
}
const ghostRead = (page) => page.evaluate(() => { const G = window.__report.plan.ghost; return { key: G.key, offered: G.offered, chosen: G.chosen, delta: G.delta }; });
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
  {
    name: 'the ghost on the plan (the build sheet v0.0.22 §1 item 16, F83): the private by the keys, then "Again as Tier one": the second card offers the first as its ghost, drawn in whole pixels, scrubbed with him, "−5.8 s" at room 2\'s door, a 4× replay\'s draws under 16.7 ms × k; "Again" offers both, the run just before first; a drawn house on the same seed offers none of the set\'s; nothing overlaps or scrolls at 1024 × 768 and 1600 × 900',
    heavy: true,
    timeoutMs: 900_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, k = machineK(), F83_MS = 16.7 * k, rows = { push: (r) => console.log(`      ${r}`) };
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await game.open('play=test-shoothouse&setup=go&tier=private&seed=48213&nostore=1');
        assert(await playToCard(page, 'keys', 'private'), 'the private did not reach the card');
        const g1 = await ghostRead(page);
        rows.push(`the private's card: ${g1.offered.length} ghost(s) offered (${g1.key})`);
        assert(!g1.offered.length, JSON.stringify(g1));
        await page.evaluate(() => [...document.querySelectorAll('.glass.end .item.again-as')].find(b => /Tier one/.test(b.textContent)).click());
        assert(await playToCard(page, 'T', 'tierone'), 'the tier one did not reach the card');
        const L = await layout(page), g2 = await ghostRead(page);
        rows.push(`1024 × 768, the tier one's card: ${JSON.stringify(L.glass)} the side ${JSON.stringify(L.side)}; the plan ${L.canvas.w} × ${L.canvas.h} (css ${L.canvas.cssW} × ${L.canvas.cssH}); ghosts ${JSON.stringify(g2.offered)}, drawn "${g2.chosen}"`);
        assert(L.glass.in && L.glass.scroll <= 1 && L.side.in && !L.side.meets && L.side.scroll <= 1 && L.canvas.whole && !L.cut.length, JSON.stringify(L));
        assert(g2.key === g1.key && g2.offered.length === 1 && /^private 74\.0 s$/i.test(g2.offered[0]) && g2.chosen === g2.offered[0], JSON.stringify(g2));
        // (the ghost drawn: the same ms with it and without it; scrubbed with him: 12 s on, both moved)
        const at = await page.evaluate(() => { const s = window.__olympus.state, H = s.armoury.range.house; return { go: H.goAtMs, r2: H.rooms[1].fromMs }; });
        await page.evaluate((t) => window.__report.plan.seek(t), at.go + 10_000);
        const withG = await pixels(page);
        await page.evaluate(() => window.__report.plan.ghost.set(-1));
        const without = await pixels(page);
        await page.evaluate(() => window.__report.plan.ghost.set(0));
        await page.evaluate((t) => window.__report.plan.seek(t), at.go + 22_000);
        const later = await pixels(page);
        await page.evaluate(() => window.__report.plan.ghost.set(-1));
        const laterWithout = await pixels(page);
        await page.evaluate(() => window.__report.plan.ghost.set(0));
        await page.evaluate((t) => window.__report.plan.seek(t), at.r2);
        const r2 = await ghostRead(page);
        rows.push(`  at GO + 10 s the canvas with the ghost ${withG === without ? 'THE SAME as' : 'differs from'} without it; at + 22 s ${later === laterWithout ? 'THE SAME' : 'differs'} and ${later === withG ? 'NOT MOVED' : 'moved'}; at room 2's door the clock says "${r2.delta}"`);
        assert(withG !== without && later !== laterWithout && later !== withG && /^\u2212(5\.[789]) s$/.test(r2.delta), JSON.stringify({ withG, without, later, laterWithout, r2 }));
        // (F83: a 4× replay from GO to the end, each draw timed by the plan itself)
        await page.evaluate((t) => { const G = window.__report.plan.ghost; window.__report.plan.seek(t); G.reset(); G.play(4); }, at.go);
        await page.waitForFunction(() => { const s = window.__olympus.state, H = s.armoury.range.house; return window.__report.plan.ms >= H.end.atMs - 1; }, null, { timeout: 120000, polling: 250 });
        const f83 = await page.evaluate(() => ({ max: window.__report.plan.ghost.drawMaxMs, n: window.__report.plan.ghost.draws }));
        rows.push(`  F83: the 4× replay drew ${f83.n} frames, the slowest ${f83.max.toFixed(2)} ms against ${F83_MS.toFixed(1)} (16.7 × k ${k.toFixed(2)}): ${f83.max <= F83_MS && f83.n > 10 ? 'MET' : 'OPEN'}`);
        assert(f83.max <= F83_MS && f83.n > 10, JSON.stringify(f83));
        // (1600 × 900: "Again" on the same sheet and seed; its card offers both runs, the one just before (the tier one) first)
        await page.setViewportSize({ width: 1600, height: 900 });
        await page.evaluate(() => [...document.querySelectorAll('.glass.end .item')].find(b => /^\d?Again\s*seed/.test(b.textContent) || b.querySelector('kbd')?.nextSibling?.textContent === 'Again').click());
        assert(await playToCard(page, 'T', 'tierone'), 'the tier one did not reach the card again');
        const L2 = await layout(page), g3 = await ghostRead(page);
        rows.push(`1600 × 900, "Again": ${JSON.stringify(L2.glass)} the side ${JSON.stringify(L2.side)}; the plan ${L2.canvas.w} × ${L2.canvas.h}; ghosts ${JSON.stringify(g3.offered)}, drawn "${g3.chosen}"`);
        assert(L2.glass.in && L2.glass.scroll <= 1 && L2.side.in && !L2.side.meets && L2.side.scroll <= 1 && L2.canvas.whole && !L2.cut.length, JSON.stringify(L2));
        assert(g3.offered.length === 2 && /^Tier one /i.test(g3.offered[0]) && /^private /i.test(g3.offered[1]) && g3.chosen === g3.offered[0], JSON.stringify(g3));
        // (a drawn house on the same seed: the set's three ghosts carried over the reload into the page's own list, and one of them copied
        // onto the drawn lane's key as the control: its card offers that one only)
        const carried = await page.evaluate(async () => { const m = await import('/src/ui/cards/house-ghosts.js'); return m.ghostsFor(window.__report.plan.ghost.key).map(G => ({ ...G })); });
        await game.open('play=test-shoothouse&setup=go&tier=tierone&seed=48213&draw=drawn&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.house?.draw?.mode === 'drawn', null, { timeout: 60000 });
        await page.evaluate(async (list) => { const m = await import('/src/ui/cards/house-ghosts.js'), O = window.__olympus, rec = { id: 'test-shoothouse' }, key = m.ghostKeyOf(rec, O.state);
          for (const G of list) m.keepGhost(G);
          m.keepGhost({ ...list[0], key, label: 'control' }); }, carried);
        assert(await playToCard(page, 'T', 'tierone'), 'the drawn lane did not reach the card');
        const g4 = await ghostRead(page);
        rows.push(`a drawn house on 48213 (${g4.key}): ${carried.length} of the set's ghosts in the page, offered ${JSON.stringify(g4.offered)}`);
        assert(carried.length === 3 && g4.offered.length === 1 && /^control /.test(g4.offered[0]) && g4.key !== g1.key, JSON.stringify({ g4, carried: carried.length }));
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
];
