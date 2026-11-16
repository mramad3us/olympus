// OLYMPUS tests: qualified in the page (the build sheet v0.0.21 §1 items 9 and 16; done lens D5; heavy, a browser file).
//
// The picker of "Stack and clear" (cards/pairs.js) offers "Qualify as <sheet>", the sheet after the highest qualified in this
// browser (house-runs.js qualNext). Here the corporal is already qualified (localStorage['olympus.house'].quals.cpl), so it offers
// "Qualify as Sergeant"; pressed, the lane starts on the drawn house with a seed the page draws and hides (main.js qualFirst: the
// page's randomSeed, made deterministic here by the init script so the run repeats), played by the honest bot in the page to its
// card. The card says "QUALIFICATION 1 OF 3 · GO", leads with "Next qualification lane (2 of 3)", names the house's code in its
// header; after the third GO "QUALIFIED: SERGEANT" and "Qualify as Raider"; back on the picker the sergeant's line says QUALIFIED and
// the entry is "Qualify as Raider". No page or console error. Fails without the qualify entry (there was none).
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

// (the page's seeds: crypto.getRandomValues on a one-word array answered from a fixed list, then by a counter)
function seeds(list) {
  const orig = crypto.getRandomValues.bind(crypto);
  let i = 0;
  crypto.getRandomValues = (a) => { if (a instanceof Uint32Array && a.length === 1) { a[0] = list[i] ?? (2_000_000 + i); i++; return a; } return orig(a); };
  try { localStorage.setItem('olympus.house', JSON.stringify({ v: 1, runs: [], quals: { cpl: { atIso: '2026-11-16T00:00:00Z', seeds: [1, 2, 3], codes: [], version: 'test' } } })); } catch { /* (no storage: the test fails on the entry) */ }
}

export default [
  {
    name: 'qualified in the page: "Qualify as Sergeant" starts a drawn lane on a hidden seed; three GOs in a row, each card saying where the attempt stands, write QUALIFIED on the picker and offer "Qualify as Raider" (heavy)',
    heavy: true,
    timeoutMs: 15 * 60_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [];
      await withGame(async (page, errors) => {
        await page.waitForSelector('#title .item.tests');
        await page.evaluate(() => document.querySelector('#title .item.tests').click());
        await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.startsWith('Stack and clear')).click());
        await page.waitForSelector('#title .sheet.picker');
        const q0 = await page.evaluate(() => document.querySelector('#title .item.qualpick')?.textContent ?? null);
        rows.push(`the picker's entry: ${JSON.stringify(q0)}`);
        assert(q0 && q0.startsWith('Qualify as Sergeant'), JSON.stringify(q0));
        await page.evaluate(() => document.querySelector('#title .item.qualpick').click());
        for (let lane = 1; lane <= 3; lane++) {
          await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
          const at = await page.evaluate(() => { const s = window.__olympus.state, H = s.armoury.range.house; return { seed: s.meta.seed, tier: H.tier, draw: H.draw?.mode ?? 'set', code: H.draw?.code ?? null, url: location.search }; });
          const ended = await page.evaluate(async () => {
            const O = window.__olympus, { houseHonestBot } = await import('/tests/bots/house.mjs'), bot = houseHonestBot();
            O.pause(true);
            for (let n = 0; n < 400000 && !O.scene?.ended; n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') O.sim.ffTick(s); else O.step(1, bot(s, me, (me.bot ??= {}))); }
            O.pause(false);
            return !!O.scene?.ended;
          });
          assert(ended, `lane ${lane}: the bot did not reach the card`);
          await page.keyboard.press('Enter');
          await page.waitForSelector('.glass.end', { timeout: 30000 });
          const card = await page.evaluate(() => ({ head: document.querySelector('.glass.end h3')?.textContent ?? '', verdict: document.querySelector('.glass.end .verdict')?.textContent ?? '', qual: document.querySelector('.glass.end .qual-said')?.textContent ?? null, first: document.querySelector('.glass.end .glass-list .item')?.textContent ?? '' }));
          rows.push(`lane ${lane}: seed ${at.seed} (hidden: the URL ${JSON.stringify(at.url)}), the ${at.tier} on the ${at.draw} house ${at.code}; the card "${card.head}", "${card.verdict}", "${card.qual}", first "${card.first}"`);
          assert(at.tier === 'sgt' && at.draw === 'drawn' && !String(at.url).includes(String(at.seed)) && card.head.includes('house '), JSON.stringify({ at, card }));
          assert(card.qual === (lane < 3 ? `QUALIFICATION ${lane} OF 3 · GO` : 'QUALIFIED: SERGEANT') && card.first.includes(lane < 3 ? `Next qualification lane (${lane + 1} of 3)` : 'Qualify as Raider'), JSON.stringify(card));
          if (lane < 3) await page.evaluate(() => document.querySelector('.glass.end .item.qual-next').click());
        }
        // (back on the picker: the sergeant marked, the Raider offered)
        await page.evaluate(() => [...document.querySelectorAll('.glass.end .item')].find(b => b.textContent.includes('Back to the title')).click());
        await page.waitForSelector('#title .item.tests');
        await page.evaluate(() => document.querySelector('#title .item.tests').click());
        await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.startsWith('Stack and clear')).click());
        await page.waitForSelector('#title .sheet.picker');
        const pk = await page.evaluate(() => ({ q: document.querySelector('#title .item.qualpick')?.textContent ?? null, sgt: document.querySelector('#title .item.sheetpick[data-tier="sgt"]')?.textContent ?? '', quals: JSON.parse(localStorage.getItem('olympus.house') ?? '{}').quals ?? {} }));
        rows.push(`the picker after: "${pk.q}"; the sergeant's line "${pk.sgt}"; quals ${Object.keys(pk.quals).join(', ')} (the sergeant's seeds ${pk.quals.sgt?.seeds?.join(', ')})`);
        for (const r of rows) console.log(`      ${r}`);
        assert(pk.q?.startsWith('Qualify as Raider') && pk.sgt.includes('QUALIFIED') && pk.quals.sgt?.seeds?.length === 3, JSON.stringify(pk));
        assert(!errors.length, errors.join(' | '));
      }, { port, query: 'nostore=1', init: seeds, initArg: [3_100_001, 3_100_002, 3_100_003] });
    },
  },
];
