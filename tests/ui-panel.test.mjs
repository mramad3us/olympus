// OLYMPUS tests: the step panel by groups in the page (heavy; VIEWS §7.8; COMBAT §25.19.7; the shoot house's rework R7, 2026-11-13).
//
// The three layouts behind &panel=a|b|c, C the default, each at 1600 × 900 and 1024 × 768: the band, and each second and third
// level (C's fan held on Tab and its group, A's drawer, B's bank, a group's ▸), every tile inside STEPS and apart from every
// other, its words and its time apart within it, no name past its two lines, STEPS apart from INSTINCT (VIEWS §7.5: no
// overlapping UI); and the keys by physical code (AZERTY: the page reads KeyboardEvent.code): C's Tab held, 2, 1 runs Stack up;
// A's 7, 1 and B's R, 1 the same; NEXT (C's 0) does T's act; a struck row's digit says why and the remedy's key ("→ 7").
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

const SIZES = [[1600, 900], [1024, 768]];
// (the rectangles of what STEPS draws now: tiles out of STEPS, tiles on each other, words on the time, names past two lines, STEPS on INSTINCT)
const measure = (page) => page.evaluate(() => {
  const S = document.querySelector('.steps'), I = document.querySelector('.instinct'), R = (e) => e.getBoundingClientRect(), s = R(S);
  const kids = [...S.querySelectorAll('.steplist > *')].map(e => ({ k: e.dataset.key ?? e.className.split(' ')[0], e, r: R(e) }));
  const bad = [];
  const over = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
  for (const a of kids) if (a.r.left < s.left - 0.5 || a.r.right > s.right + 0.5 || a.r.top < s.top - 0.5 || a.r.bottom > s.bottom + 0.5) bad.push(`${a.k} out of STEPS`);
  for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) if (over(kids[i].r, kids[j].r)) bad.push(`${kids[i].k} on ${kids[j].k}`);
  for (const a of kids) {
    const lab = a.e.querySelector(':scope > .label'), meta = a.e.querySelector(':scope > .meta');
    if (lab && meta && R(lab).width && R(meta).width && R(lab).right > R(meta).left + 0.5) bad.push(`${a.k}: its words on its time`);
    for (const p of [lab, meta]) if (p && R(p).width && (R(p).left < a.r.left - 0.5 || R(p).right > a.r.right + 0.5)) bad.push(`${a.k}: a part out of its tile`);
    // (a name cut short ends in "…" inside its tile (its words whole on the hover); never drawn past the tile)
    const nm = a.e.querySelector('.name');
    if (nm && R(nm).height && (R(nm).bottom > a.r.bottom + 0.5 || R(nm).top < a.r.top - 0.5)) bad.push(`${a.k}: its name past its tile`);
    if (nm && nm.scrollHeight > nm.clientHeight + 1 && !(a.e.title ?? '').startsWith(nm.firstChild?.textContent ?? '\u0000')) bad.push(`${a.k}: its name cut and not whole on its hover`);
  }
  const ii = I && !I.hidden ? R(I) : null;
  if (ii && ii.width && over(ii, s)) bad.push('STEPS on INSTINCT');
  return { n: kids.length, bad, ui: getComputedStyle(document.documentElement).getPropertyValue('--ui').trim(), where: window.__olympus.panel().where };
});
const settle = (page, ms = 250) => page.waitForTimeout(ms);
const toast = (page) => page.evaluate(() => [...document.querySelectorAll('.toasts *')].map(e => e.textContent).join(' | '));

export default [
  {
    name: 'no overlapping UI (VIEWS §7.5, §7.8.5): each layout at 1600 × 900 and 1024 × 768, the band and every second and third level (C\'s fan and its group, A\'s drawer, B\'s bank, a group\'s ▸), at the house\'s GO, on the line (Bang\'s standby) and on the KD line: every tile inside STEPS and apart, its words apart from its time, STEPS apart from INSTINCT',
    heavy: true,
    timeoutMs: 900000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined;
      await withGame(async (page, errors, game) => {
        const lines = [], bad = [];
        const scenes = [['house', 'play=test-shoothouse&setup=go&tier=cpl&seed=1489397426&nostore=1'], ['line', 'play=test-stress&setup=standby&tier=cpl&seed=48213&nostore=1'], ['kd', 'play=test-range&setup=far&seed=48213&nostore=1']];
        for (const [W, H] of SIZES) {
          await page.setViewportSize({ width: W, height: H });
          for (const [scene, q] of scenes) for (const L of ['a', 'b', 'c']) {
            await game.open(`${q}&panel=${L}`);
            await page.waitForFunction(() => window.__ready && !!window.__olympus.panel()?.where, null, { timeout: 60000 });
            await settle(page, 400);
            const look = async (what) => { await settle(page); const m = await measure(page); lines.push(`${W} ${scene} ${L} ${what}: ${m.n} tiles, --ui ${m.ui}, ${m.where?.level}${m.bad.length ? ` BAD ${m.bad.join(', ')}` : ''}`); bad.push(...m.bad.map(b => `${W} ${scene} ${L} ${what}: ${b}`)); };
            await look('band');
            if (L === 'c') {
              await page.keyboard.down('Tab'); await look('fan');
              for (const g of ['1', '2', '3', '4', '5']) { await page.keyboard.press(`Digit${g}`); await look(`fan ${g}`); const deep = await page.evaluate(() => window.__olympus.panel().keys.some(k => k.key === '0' || k.key === '9')); if (deep && g === '3') { await page.keyboard.press('Digit9'); await look('fan 3 ▸'); } await page.keyboard.up('Tab'); await page.keyboard.down('Tab'); }
              await page.keyboard.up('Tab'); await look('fan let go');
            }
            if (L === 'a') for (const g of ['6', '7', '8', '9', '0']) { await page.keyboard.press(`Digit${g}`); await look(`drawer ${g}`); await page.keyboard.press('Escape'); await page.keyboard.press('Digit0'); await settle(page, 80); if (await page.evaluate(() => !!window.__olympus.panel().where?.nav?.group)) { await page.keyboard.press('Escape'); } }
            if (L === 'b') for (const k of ['KeyR', 'KeyC', 'KeyB', 'KeyF']) { await page.keyboard.press(k); await look(`bank ${k.slice(3)}`); await page.keyboard.press(k); }
          }
        }
        for (const l of lines) console.log(`      ${l}`);
        // (a test that opens the menu by Esc leaves no error; the list must be empty)
        assert(!bad.length, JSON.stringify(bad.slice(0, 12)));
      }, { port, viewport: { width: 1600, height: 900 }, query: 'play=test-shoothouse&setup=go&tier=cpl&nostore=1' });
    },
  },
  {
    name: 'the keys by physical code (AZERTY: KeyboardEvent.code): C\'s Tab held, 2, 1 runs Stack up; A\'s 7, 1 and B\'s R, 1 the same; C\'s NEXT (0) does T\'s act; a struck row\'s digit says why with the remedy\'s key ("→ 7": Fire, aim first); the menu\'s toggle turns the layout',
    heavy: true,
    timeoutMs: 600000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined;
      await withGame(async (page, errors, game) => {
        const out = {};
        const stepNow = () => page.evaluate(() => { const S = window.__olympus.state.stop; return { phase: S?.phase ?? null, doing: S?.doing?.step ?? null }; });
        const go = async (L) => { await game.open(`play=test-shoothouse&setup=go&tier=cpl&seed=1489397426&nostore=1&panel=${L}`); await page.waitForFunction(() => window.__ready && !!window.__olympus.panel()?.where, null, { timeout: 60000 }); await settle(page, 600); };
        // (C: the fan)
        await go('c');
        await page.keyboard.down('Tab'); await settle(page, 80); await page.keyboard.press('Digit2'); await settle(page, 80); await page.keyboard.press('Digit1'); await page.keyboard.up('Tab');
        await settle(page, 300); out.c = await stepNow();
        // (A: the drawer; B: the bank)
        await go('a'); await page.keyboard.press('Digit7'); await settle(page, 80); await page.keyboard.press('Digit1'); await settle(page, 300); out.a = await stepNow();
        await go('b'); await page.keyboard.press('KeyR'); await settle(page, 80); await page.keyboard.press('Digit1'); await settle(page, 300); out.b = await stepNow();
        // (C's NEXT: T's act)
        await go('c');
        const act = await page.evaluate(() => window.__olympus.instinct(window.__olympus.state).line?.act ?? null);
        await page.keyboard.press('Digit0'); await settle(page, 300); out.next = { act, ...(await stepNow()) };
        // (a struck row: Fire, aim first, on C's 6)
        await go('c');
        const fire = await page.evaluate(() => window.__olympus.panel().keys.find(k => k.key === '6'));
        await page.keyboard.press('Digit6'); await settle(page, 200); out.struck = { fire, said: await toast(page), ...(await stepNow()) };
        // (the menu's toggle: C to A)
        await page.keyboard.press('Escape'); await settle(page, 300);
        const item = await page.evaluate(() => [...document.querySelectorAll('.glass.menu .item')].find(e => /Step panel: /.test(e.textContent ?? ''))?.textContent.replace(/^\d+/, '') ?? null);
        await page.evaluate(() => [...document.querySelectorAll('.glass.menu .item')].find(e => /Step panel: /.test(e.textContent ?? ''))?.click());
        await settle(page, 300);
        out.menu = { item, now: await page.evaluate(() => window.__olympus.panel().layout), kept: await page.evaluate(() => { try { return localStorage.getItem('olympus.panel'); } catch { return null; } }) };
        console.log(`      ${JSON.stringify(out)}`);
        assert(/^drill:stack:up/.test(out.c.doing ?? '') && /^drill:stack:up/.test(out.a.doing ?? '') && /^drill:stack:up/.test(out.b.doing ?? ''), JSON.stringify(out));
        assert(out.next.act && out.next.doing && `stop:${out.next.doing}`.startsWith(out.next.act.split('>')[0]), JSON.stringify(out.next));
        assert(out.struck.fire?.id === 'fire' && out.struck.fire.off && /→ 7/.test(out.struck.said) && out.struck.phase === 'choose', JSON.stringify(out.struck));
        assert(/^Step panel: C/.test(out.menu.item ?? '') && out.menu.now === 'a', JSON.stringify(out.menu));
      }, { port, viewport: { width: 1600, height: 900 }, query: 'play=test-shoothouse&setup=go&tier=cpl&nostore=1' });
    },
  },
];
