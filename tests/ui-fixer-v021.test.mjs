// OLYMPUS tests: v0.0.21's fixer in the page (the play review of 2026-11-16), each case failing without its fix.
//
// The picker for "Stack and clear" fits a 1280 × 720 and a 1920 × 1080 window unscrolled (its par, kit, house, "Qualify as", Back and
// its line); a drawn house's brief in the radio box shows no row cut (the long line paged, src/ui/hud/radio.js); the end card keeps
// the house's code in its own case; the &house= note says what is played. Heavy (a browser, its own port: OLYMPUS_TEST_PORT).
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

const port = () => Number(process.env.OLYMPUS_TEST_PORT) || undefined;
// (every element with text of its own inside the title's sheet: those outside the window)
const offWindow = (page) => page.evaluate(() => {
  const out = [];
  for (const e of document.querySelectorAll('#title *')) {
    if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) || e.closest('[hidden]')) continue;
    const r = e.getBoundingClientRect();
    if (r.width && (r.bottom > innerHeight + 1 || r.right > innerWidth + 1)) out.push(`'${e.textContent.trim().slice(0, 40)}' at ${Math.round(r.top)} to ${Math.round(r.bottom)}`);
  }
  return out;
});

export default [
  {
    name: 'the picker of "Stack and clear" fits 1280 × 720 and 1920 × 1080 unscrolled (the play review of 2026-11-16: "As set" to Back below 720, Back below 1080); the Tests menu\'s line no longer says "Lane A" of a house that may be drawn',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const rows = [], bad = [];
      for (const [w, h] of [[1280, 720], [1920, 1080]]) {
        await withGame(async (page, errors) => {
          await page.waitForSelector('#title .item.tests');
          await page.click('#title .item.tests');
          const line = await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.split('\n')[0].trim() === 'Stack and clear')?.innerText ?? '');
          await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.split('\n')[0].trim() === 'Stack and clear')?.click());
          await page.waitForSelector('#title .item.drawpick');
          await page.waitForTimeout(300);
          const off = await offWindow(page), back = await page.evaluate(() => { const b = [...document.querySelectorAll('#title button')].find(x => x.textContent.trim() === 'Back'); return b ? Math.round(b.getBoundingClientRect().bottom) : null; });
          rows.push(`${w} × ${h}: Back's foot at ${back} px; off the window ${off.length}${off.length ? `: ${off.join('; ')}` : ''}; the menu's line ${JSON.stringify(line.split('\n').slice(1).join(' ').slice(0, 90))}`);
          if (off.length || /Lane A/.test(line)) bad.push(`${w}x${h}`);
          if (errors.length) bad.push(errors.join(' | '));
        }, { port: port(), query: 'nostore=1', viewport: { width: w, height: h } });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, JSON.stringify({ bad, rows }));
    },
  },
  {
    name: 'a drawn house\'s brief in the radio box: no row cut, the long line paged ("…"), and the &house= note of a set lane says it is not played (the play review and the code review of 2026-11-16)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      let said = null, note = null;
      await withGame(async (page, errors, game) => {
        await game.open('play=test-shoothouse&tier=sgt&seed=36&draw=drawn&loadout=mixed&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.house?.said, null, { timeout: 60000 });
        await page.waitForFunction(() => [...document.querySelectorAll('.radio.voices .voice .said')].some(e => /…/.test(e.textContent)), null, { timeout: 20000 }).catch(() => null);
        said = await page.evaluate(() => [...document.querySelectorAll('.radio.voices .voice .said')].map(e => ({ text: e.textContent, cut: e.scrollHeight > e.clientHeight + 1, w: e.clientWidth, h: e.clientHeight, sh: e.scrollHeight })));
        await game.open('play=test-shoothouse&tier=sgt&seed=36&draw=set&house=Kn240lc.Es195pc.Cn160lc&nostore=1');
        await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
        await page.waitForTimeout(500);
        note = await page.evaluate(() => [...document.querySelectorAll('.toasts .toast')].map(t => t.textContent).find(t => /House '/.test(t)) ?? null);
        if (errors.length) said.push({ errors: errors.join(' | ') });
      }, { port: port(), viewport: { width: 1280, height: 720 } });
      for (const s of said) console.log(`      the radio: ${JSON.stringify(s).slice(0, 220)}`);
      console.log(`      &draw=set with &house=: ${JSON.stringify(note)}`);
      assert(said.length && !said.some(s => s.cut || s.errors) && said.some(s => /…/.test(s.text)) && /not played here: the house as set/.test(note ?? ''), JSON.stringify({ said, note }));
    },
  },
  {
    name: 'a struck tile\'s reason reads whole: "stack first" on the breach\'s tile at 1920 × 1080 (the play review of 2026-11-16: "stack fi")',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      let rows = null;
      await withGame(async (page, errors) => {
        // (the panel's own markup and the page's own stylesheet: a row of six tiles at the panel's width at this size, as P3 draws it)
        rows = await page.evaluate(() => {
          const host = document.createElement('div');
          host.className = 'steps';
          host.style.cssText = 'position: fixed; left: 0; top: 0; width: calc(530px * var(--ui)); height: calc(140px * var(--ui));';
          const tile = (k, name, why, t) => `<button class="step off"><kbd>${k}</kbd><span class="label"><span class="name">${name}</span></span><span class="meta"><span class="badge b-${t}">${why}</span></span></button>`;
          host.innerHTML = `<div class="steplist grouped" data-form="tiles" style="display: grid; height: 100%;">${tile(3, 'Open', 'locked door', 'note')}${tile(4, 'Kick door', 'stack first', 'note')}${tile(5, 'Breach (explosive)', 'stack first', 'note')}${tile(6, 'Fire', 'not on an inner door', 'gate')}</div>`;
          document.body.append(host);
          const out = [...host.querySelectorAll('.badge')].map(b => ({ text: b.textContent, w: b.clientWidth, sw: b.scrollWidth, h: b.clientHeight, sh: b.scrollHeight, tile: b.closest('.step').clientWidth, inTile: b.getBoundingClientRect().bottom <= b.closest('.step').getBoundingClientRect().bottom + 0.5 }));
          host.remove();
          return out;
        });
        if (errors.length) rows.push({ errors: errors.join(' | ') });
      }, { port: port(), query: 'nostore=1', viewport: { width: 1920, height: 1080 } });
      for (const r of rows) console.log(`      ${JSON.stringify(r)}`);
      assert(rows.length && rows.every(r => !r.errors && r.sw <= r.w + 1 && r.sh <= r.h + 1 && r.inTile), JSON.stringify(rows));
    },
  },
];
