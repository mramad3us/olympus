// OLYMPUS tests: SHOW CLEAR's tail in the page (the build sheet v0.0.22 item 1, FL22-1): from your guns passed (the instructor's "Clear." under his eye) to "The lane is clear." under 2,000 ms of wall clock at 1×.
//
// The private's lane on 48213 by the keys bot, stepped in the page (__olympus.step, a fast-forward ended by the bot as the loop's
// ffFrame does) from GO to the tick your guns pass (R.house.show.done holds you: your SHOW CLEAR over and looked at); then the page's
// own loop runs at 1× with nothing pressed (your #2's clear, the instructor's walk to him, his look and the wash's wait are the scene's
// clock, behind the brief splash: 'house-showclear'), and the wall clock is read from there to the tower's wash command in the page
// (performance.now) and to "The lane is clear." in the radio box. Before v0.0.22 the private's tail was 10.8 s at 1× (the feel lens).
// Heavy: a browser.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

/** The tail's wall-clock ceiling at 1× (ms; the build sheet's §6 C). */
export const TAIL_WALL_MAX_MS = 2000;

export default [
  {
    name: 'SHOW CLEAR in the page: the private by the keys on 48213, from your guns passed to "The lane is clear." in the radio box under 2,000 ms of wall clock at 1× (before: 10.8 s)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined;
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('play=test-shoothouse&setup=go&tier=private&seed=48213&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        await page.evaluate(async () => { window.__houseBot = (await import('/tests/bots/house.mjs')).houseBot({ mode: 'keys' }); window.__olympus.pause(true); });
        const at = await page.evaluate(() => {
          const O = window.__olympus, bot = window.__houseBot;
          for (let i = 0; i < 40_000; i++) {
            const s = O.state, R = s.armoury.range, H = R.house, me = s.actors.list.find(a => a.id === s.player.actor);
            if (R.end) return null;
            if (R.cmd?.id === 'clear' && H.show?.done?.[s.player.id] !== undefined) return { ms: s.clock.ms - H.goAtMs, two: !!H.two.shown };
            if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, (me.bot ??= {})));
          }
          return null;
        });
        assert(at, 'your guns never passed at SHOW CLEAR');
        const t = await page.evaluate(() => new Promise((resolve) => {
          const O = window.__olympus, t0 = performance.now();
          let wash = null, skipped = 0, frames = 0, act = null;
          O.pause(false);
          const poll = () => {
            const s = O.state, now = performance.now();
            if (wash === null && s.armoury.range.cmd?.id === 'wash') wash = now - t0;
            frames++; if (s.skip || s.time?.doing) { skipped++; act ??= s.time?.doing?.activity ?? s.skip?.engine ?? 'skip'; }
            const radio = [...document.querySelectorAll('.radio, .radio *')].map(e => e.textContent).join(' ');
            if (/The lane is clear/.test(radio) || now - t0 > 20_000) { resolve({ wash, radio: /The lane is clear/.test(radio) ? now - t0 : null, gameMs: s.clock.ms - s.armoury.range.house.goAtMs, frames, skipped, act }); return; }
            requestAnimationFrame(poll);
          };
          requestAnimationFrame(poll);
        }));
        console.log(`      your guns passed ${(at.ms / 1000).toFixed(2)} s from GO (your #2 shown then: ${at.two}); the wash command ${t.wash === null ? 'never' : `${Math.round(t.wash)} ms`} of wall clock later, "The lane is clear." in the radio ${t.radio === null ? 'never' : `${Math.round(t.radio)} ms`} (game ${(t.gameMs / 1000).toFixed(2)} s from GO); ${t.frames} frames, ${t.skipped} in a skip (${t.act ?? 'none'}); TAIL_WALL_MAX_MS ${TAIL_WALL_MAX_MS}`);
        assert(t.wash !== null && t.radio !== null && t.radio < TAIL_WALL_MAX_MS, JSON.stringify(t));
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
];
