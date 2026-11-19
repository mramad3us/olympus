// OLYMPUS tests: v0.0.23's fixer in the page (the play review of 2026-11-19), each case failing without its fix. Heavy (a browser,
// its own port: OLYMPUS_TEST_PORT).
//
// Again gives the short brief in the page: the end card's Again (main.js playScene, again: true) reaches the sim's new game (the
// page's own newGame dropped `again`, so R.house.again was absent and the tower gave the whole brief at 10 to 12 s). And the private
// by the keys on lane A, 48213, at 1280 × 720, at every stop of the lane: the instinct line under the panel whole (it was cut at
// "T: go: the clock runs, the keys move you. X, then Q to the door, Z t…", the way you turn lost), every Watch and Look tile's name
// whole (cut at "Watch: behind the…" and "Look: near right…": the verb is now the tile's word, the spot its name), and where T's act
// is a Watch or Look row, its spot lit on the floor with no cursor on the panel (view.stats.hotLit; the keys player saw nothing lit).
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

const port = () => Number(process.env.OLYMPUS_TEST_PORT) || undefined;

export default [
  {
    name: 'Again in the page gives the short brief: the end card\'s Again reaches the sim (R.house.again: its short brief) (the play review of 2026-11-19: the page\'s newGame dropped again, the whole brief at 10 to 12 s)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      let got = null;
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        // (the lane to its end by the T bot in the page, then the end card's Again, as a player presses it)
        await page.evaluate(async () => {
          const m = await import('/tests/bots/house.mjs'), bot = m.houseBot({ mode: 'T' }), O = window.__olympus;
          O.pause(true);
          for (let j = 0; j < 200000 && !O.state.armoury?.range?.end; j++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') O.sim.ffTick(s); else O.step(1, bot(s, me, (me.bot ??= {}))); }
          O.pause(false);
        });
        await page.waitForTimeout(500); await page.keyboard.press('Enter');
        await page.waitForSelector('.glass.end', { timeout: 30000 });
        await page.waitForTimeout(400); await page.keyboard.press('Digit1');
        await page.waitForFunction(() => window.__olympus.state?.armoury?.range?.course === 'house' && !window.__olympus.state.armoury.range.end, null, { timeout: 30000 });
        got = await page.evaluate(() => { const H = window.__olympus.state.armoury.range.house; return { again: H.again ?? null, tier: H.tier ?? null, seed: window.__olympus.state.meta?.seed ?? null }; });
        await page.waitForTimeout(300);
        got.errors = [...errors]; errors.length = 0;
      }, { port: port(), query: 'play=test-shoothouse&tier=tierone&seed=48213&nostore=1' });
      console.log(`      the end card's Again: R.house.again ${got.again}, the sheet ${got.tier}, seed ${got.seed}; errors ${got.errors.length}`);
      assert(got.again === true && !got.errors.length, JSON.stringify(got));
    },
  },
  {
    name: 'the private by the keys on lane A (48213) at 1280 × 720: at every stop the instinct line whole, every Watch and Look tile\'s name whole (its verb the tile\'s word), and T\'s Watch or Look lit on the floor with no cursor (the play review of 2026-11-19: "Z t…", "Watch: behind the…", nothing lit by the keys)',
    heavy: true,
    timeoutMs: 900_000,
    async fn() {
      let got = null;
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        await page.addStyleTag({ content: '.banner{visibility:hidden!important}' });
        await page.mouse.move(2, 2);
        await page.evaluate(async () => { const m = await import('/tests/bots/house.mjs'); window.__fxBot = m.houseBot({ mode: 'keys' }); window.__olympus.pause(true); });
        const out = { stops: 0, cutLines: [], cutTiles: [], hotActs: 0, hotLit: 0, unlit: [], tiles: 0, ended: false };
        const frames = (n) => page.evaluate((k) => new Promise(r => { let i = 0; const f = () => (++i >= k ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
        for (let i = 0; i < 120; i++) {
          const r = await page.evaluate(() => {
            const O = window.__olympus;
            for (let j = 0; j < 20000; j++) {
              const s = O.state;
              if (s.armoury?.range?.end) return { why: 'ended' };
              const me = s.actors.list.find(a => a.id === s.player.actor);
              if (s.skip?.engine === 'ff') O.sim.ffTick(s); else O.step(1, window.__fxBot(s, me, (me.bot ??= {})));
              const t = O.state;
              if (t.stop?.mode === 'stop' && t.stop.phase === 'choose' && t.clock.tick !== window.__fxLast) { window.__fxLast = t.clock.tick; return { why: 'stop', tick: t.clock.tick }; }
            }
            return { why: 'n' };
          });
          if (r.why !== 'stop') { out.ended = r.why === 'ended'; break; }
          out.stops++;
          await page.evaluate(() => window.__olympus.pause(false)); await frames(3);
          const seen = await page.evaluate(async () => {
            const I = await import('/src/sim/skills/instinct.js');
            const cut = (e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1;
            const lines = [...document.querySelectorAll('.instinct .line')].filter(e => e.offsetParent && cut(e)).map(e => e.textContent.trim());
            const tiles = [...document.querySelectorAll('.steps [data-step]')].filter(e => e.offsetParent && (/^(watch|look):/.test(e.dataset.step) || e.dataset.label)).map(e => { const n = e.querySelector('.name'); return { id: e.dataset.step, name: n?.textContent ?? '', cut: !!n && cut(n) }; });
            const act = String(I.instinctNow(window.__olympus.state)?.line?.act ?? '');
            return { lines, tiles, act, lit: window.__report.view.hotLit ?? null };
          });
          out.tiles += seen.tiles.length;
          for (const l of seen.lines) if (out.cutLines.length < 6) out.cutLines.push(`t${r.tick} ${l}`);
          for (const t of seen.tiles.filter(x => x.cut)) if (out.cutTiles.length < 6) out.cutTiles.push(`t${r.tick} ${t.id} "${t.name}"`);
          const m = /^stop:(?:watch|look):(.+?)(?:@[a-z]+)?$/.exec(seen.act);
          if (m) { out.hotActs++; if (seen.lit === m[1]) out.hotLit++; else if (out.unlit.length < 4) out.unlit.push(`t${r.tick} ${seen.act} lit ${seen.lit}`); }
          await page.evaluate(() => window.__olympus.pause(true));
        }
        got = { ...out, errors: [...errors] }; errors.length = 0;
      }, { port: port(), query: 'play=test-shoothouse&setup=go&tier=private&seed=48213&nostore=1', viewport: { width: 1280, height: 720 } });
      console.log(`      ${got.stops} stops (the lane ${got.ended ? 'ended' : 'not ended'}); Watch and Look tiles seen ${got.tiles}, cut ${got.cutTiles.length}${got.cutTiles.length ? `: ${got.cutTiles.join(' | ')}` : ''}; instinct lines cut ${got.cutLines.length}${got.cutLines.length ? `: ${got.cutLines.join(' | ')}` : ''}; T's Watch or Look at ${got.hotActs} stops, lit ${got.hotLit}${got.unlit.length ? `: ${got.unlit.join(' | ')}` : ''}`);
      assert(got.ended && got.stops > 10 && got.tiles > 0 && !got.cutTiles.length && !got.cutLines.length && got.hotActs > 0 && got.hotLit === got.hotActs && !got.errors.length, JSON.stringify({ cutTiles: got.cutTiles, cutLines: got.cutLines, unlit: got.unlit, errors: got.errors }));
    },
  },
];
