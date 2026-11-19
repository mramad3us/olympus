// OLYMPUS tests: the v0.0.20 hunt's page findings in the page (heavy, a browser): the live end card fits (P1), its keys are the ten
// the digits reach (P2), a stand clicked keeps the run sheet in reach under a caption of its own (P4), and the lane timer's and the
// inset's canvas are shown at their own pixels (T6).
//
// P1: beside the plan the card took what the run sheet's long lines left it (202 to 627 px), so the live casualty's card scrolled 167
// to 252 px with "Back to the title" out of sight; held here on the sergeant's live NO-GO by T (48213) at 1280 × 720 and 1920 × 1080
// and your #2's casualty (the tier one, the house fuzz bot on 15, live:fight,fight) at 1600 × 900 and 1024 × 768: the card and the
// side column in the window, neither scrolls, no choice cut. P2: no label but 1 to 9 and 0, the title 0, and Digit0 there goes to the
// title. P4: a stand clicked opens its truth card captioned "Room 1, 1a" with no string's button, beside the canvas where the column
// has room, and the run sheet stays in sight or the column scrolls to it. T6: the timer's strip in the house and the 25 m card's inset
// at 1024 × 768 to 1920 × 1080: the canvas's pixels are the device pixels it is shown in (they were 2 px narrower, 32 at --ui 0.85).
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

const LANES = [
  { tag: 'the sergeant, live, by T', q: 'play=test-shoothouse&setup=go&tier=sgt&seed=48213&opfor=live', bot: 'T', sizes: [[1280, 720], [1920, 1080]] },
  { tag: 'his casualty (T5)', q: 'play=test-shoothouse-live&tier=tierone&seed=15&opfor=live:fight,fight', bot: 'fuzz', sizes: [[1600, 900], [1024, 768]] },
];
async function toCard(page, game, L) {
  await game.open(`${L.q}&nostore=1`);
  await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
  const ok = await page.evaluate(async (mode) => {
    const O = window.__olympus, B = await import('/tests/bots/house.mjs'), bot = mode === 'fuzz' ? B.houseFuzzBot({ seed: 15 }) : B.houseBot({ mode }), mem = {};
    O.pause(true);
    for (let n = 0; n < 400000 && !O.scene?.ended; n++) {
      const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor);
      if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, mode === 'fuzz' ? (me.bot ??= {}) : mem));
    }
    O.pause(false);
    return !!O.scene?.ended;
  }, L.bot);
  if (!ok) return false;
  await page.keyboard.press('Enter');
  await page.waitForSelector('.glass.end .verdict', { timeout: 30000 });
  await page.waitForTimeout(400);
  return true;
}
const measure = (page) => page.evaluate(() => {
  const inWin = (b) => !!b && b.left >= -0.5 && b.top >= -0.5 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1;
  const g = document.querySelector('.glass.end'), gb = g.getBoundingClientRect(), side = document.querySelector('.end-wrap .house-side'), sb = side.getBoundingClientRect();
  const rs = side.querySelector('.runsheet').getBoundingClientRect(), items = [...g.querySelectorAll('.glass-list .item')];
  const t = document.querySelector('.plan-truth canvas'), c = document.querySelector('.plan-canvas');
  return { glassW: Math.round(gb.width), sideW: Math.round(sb.width), glass: { in: inWin(gb), scroll: g.scrollHeight - g.clientHeight }, side: { in: inWin(sb), scroll: side.scrollHeight - side.clientHeight, oy: getComputedStyle(side).overflowY }, meets: sb.right > gb.left + 1 && sb.left < gb.right - 1,
    cut: items.filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent), keys: items.map(b => b.querySelector('kbd').textContent), title: items.find(b => /Back to the title/.test(b.textContent))?.querySelector('kbd').textContent ?? null,
    rsHidden: Math.max(0, Math.round(rs.bottom - sb.bottom)), caption: document.querySelector('.plan-truth figcaption')?.textContent ?? null, tabs: document.querySelectorAll('.plan-truth .wash-tab').length,
    beside: t && c ? t.getBoundingClientRect().left >= c.getBoundingClientRect().right - 1 : null };
});

export default [
  {
    name: 'the house\'s live end card fits the window beside the plan at 1024 × 768 to 1920 × 1080, nothing scrolled or cut; its keys are 1 to 9 and 0, the title 0 and Digit0 reaches it; a stand clicked shows "Room 1, 1a" beside the canvas with the run sheet in reach (the hunt of v0.0.20, P1, P2, P4)',
    heavy: true,
    timeoutMs: 600_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [], faults = [];
      // (every fault gathered, named by its finding, and the test failed on them at the end: each finding's own evidence printed)
      const fault = (ok, what, m) => { if (!ok) faults.push(`${what}: ${JSON.stringify(m)}`); };
      await withGame(async (page, errors, game) => {
        for (const L of LANES) for (const [w, h] of L.sizes) {
          await page.setViewportSize({ width: w, height: h });
          assert(await toCard(page, game, L), `${L.tag}: the bot did not reach the card`);
          const m = await measure(page);
          rows.push(`${L.tag} at ${w} × ${h}: the card ${m.glassW} px ${JSON.stringify(m.glass)}, the side ${m.sideW} px ${JSON.stringify(m.side)}; keys ${m.keys.join(' ')}`);
          fault(m.glass.in && m.glass.scroll <= 1 && m.side.in && m.side.scroll <= 1 && !m.meets && !m.cut.length, `P1 ${L.tag} at ${w} × ${h}`, m);
          fault(m.keys.every(k => /^[0-9·]$/.test(k)) && m.keys.filter(k => k !== '·').length <= 10 && m.title === '0' && m.keys.at(-1) === '0', `P2 ${L.tag} at ${w} × ${h}`, m.keys);
          // (a stand clicked: 1a, room 1's)
          const hit = await page.evaluate(() => { const cv = document.querySelector('.plan-canvas'), r = cv.getBoundingClientRect(), s = window.__olympus.state, T = s.armoury.range.turners.find(t => t.stand === '1a'), F = window.__report.plan.frame; return { x: r.left + 6 + (T.x - F.x0) * F.pxM, y: r.top + 6 + (T.z - F.z0) * F.pxM }; });
          await page.mouse.click(hit.x, hit.y);
          await page.waitForTimeout(200);
          const m2 = await measure(page);
          rows.push(`  1a clicked: "${m2.caption}", ${m2.tabs} buttons, ${m2.beside ? 'beside the canvas' : 'under the canvas'}; the run sheet ${m2.rsHidden} px under the column's foot (${m2.side.oy}, scrolls ${m2.side.scroll} px)`);
          if (m2.caption !== null) fault(m2.caption === 'Room 1, 1a' && m2.tabs === 0 && (m2.rsHidden <= 1 || /auto|scroll/.test(m2.side.oy)), `P4 ${L.tag} at ${w} × ${h}`, m2);
          if (w >= 1280 && m2.caption !== null) fault(m2.beside && m2.rsHidden <= 1, `P4 ${L.tag} at ${w} × ${h}, beside`, m2);
        }
        // (Digit0 on the last card: the title, the key its label names)
        await page.keyboard.press('Digit0');
        await page.waitForTimeout(800);
        const after = await page.evaluate(() => ({ card: !!document.querySelector('.glass.end'), title: !document.getElementById('title')?.hidden }));
        rows.push(`Digit0 on the card: ${JSON.stringify(after)}`);
        fault(!after.card && after.title, 'P2 Digit0 on the card', after);
        for (const r of rows) console.log(`      ${r}`);
        for (const f of faults) console.log(`      FAULT ${f}`);
        assert(!faults.length, faults.join(' | '));
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
  {
    name: 'the lane timer\'s strip and the 25 m card\'s inset are shown at their own pixels, device pixel for device pixel, at 1024 × 768 to 1920 × 1080, inside their boxes (the hunt of v0.0.20, T6: 2 columns dropped at every size, 32 at --ui 0.85)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [], bad = [];
      await withGame(async (page, errors, game) => {
        for (const [w, h] of [[1024, 768], [1280, 720], [1366, 768], [1600, 900], [1920, 1080]]) {
          await page.setViewportSize({ width: w, height: h });
          for (const [q, sel] of [['play=test-shoothouse&setup=go&tier=sgt&seed=48213&nostore=1', '.timer'], ['play=test-handling&setup=bench&seed=48213&nostore=1', '.paper']]) {
            await game.open(q);
            await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
            await page.waitForTimeout(300);
            const m = await page.evaluate((sel) => {
              const box = document.querySelector(`${sel}:not([hidden])`), c = box?.querySelector('canvas');
              if (!c) return null;
              const r = c.getBoundingClientRect(), dpr = devicePixelRatio, ui = Number(getComputedStyle(document.documentElement).getPropertyValue('--ui'));
              return { backing: [c.width, c.height], shown: [r.width * dpr, r.height * dpr], box: [box.clientWidth, box.clientHeight], ui, dpr, want: Math.round(200 * ui * dpr) };
            }, sel);
            rows.push(`${w} × ${h} ${sel}: ${JSON.stringify(m)}`);
            // (the pixels the shown ones, the width --ui's, and the box (its inside) the canvas's to a pixel: the edge outside it)
            if (!m || Math.abs(m.backing[0] - m.shown[0]) > 0.01 || Math.abs(m.backing[1] - m.shown[1]) > 0.01 || m.backing[0] !== m.want || Math.abs(m.box[0] - m.shown[0] / m.dpr) > 1) bad.push(rows.at(-1));
          }
        }
        for (const r of rows) console.log(`      ${r}`);
        assert(!bad.length, bad.join(' | '));
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
];
