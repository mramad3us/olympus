// "Anchor before you fire" in the page (v0.0.25's carried round; the user's report of 2026-11-19: "translate what I have to do for the
// 0G shooting training"): the station's yellow ring and its line to the turner are drawn on the stage while its command stands (the
// range's pairs layer, render/range.js stats.pairs.station), gone at its string; the DI's line on the way names its step in the HUD's
// words, its keys AZERTY's. A browser file (heavy).
import { assert } from './helpers.mjs';
import { withGame, BROWSER_TEST_PORT } from './browser.mjs';

const frames = (page) => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
// (n ticks of the anchors' keys bot, stepped by hand in the page; a fast-forward ended as the loop's ffFrame does)
const anchorsSteps = (page, n) => page.evaluate(async (k) => {
  const O = window.__olympus, { anchorsBot } = await import('/tests/bots/void.mjs'), bot = (window.__ab ??= anchorsBot({ mode: 'keys' }));
  O.pause(true);
  for (let i = 0; i < k; i++) { const s = O.state, me = s.actors.list.find(a => a.who === s.player.id); if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, (me.bot ??= {}))); }
}, n);

export default [
  {
    name: 'ui-void-words: station two\'s ring and its line to the turner drawn on the stage while its command stands, none at its string; the DI\'s line names the step with its key',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('play=test-anchors&seed=48213&tier=private&setup=s2&nostore=1');
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.anchors, null, { timeout: 90_000 });
        const read = () => page.evaluate(() => { const O = window.__olympus, A = O.state.armoury.range.anchors, I = O.state.$instinct?.line; return { phase: A.phase, st: A.st, station: O.view?.range?.pairs?.station ?? null, line: I?.id === 'void-station' ? I.text : null }; });
        let move = null, string = null;
        for (let i = 0; i < 400 && !(move && string); i++) {
          await anchorsSteps(page, 5); await frames(page);
          const r = await read();
          if (!move && r.phase === 'move' && r.st === 1 && r.line) move = r;
          if (!string && r.phase === 'string' && r.st === 1) string = r;
        }
        console.log(`      station two's command: the ring and its line ${move?.station} px; the DI: "${move?.line}"; at its string ${string?.station} px`);
        assert(move && move.station >= 150 && /Station two/.test(move.line) && string && string.station === 0, JSON.stringify({ move, string }));
        assert(!errors.length, errors.join(' | '));
      }, { port: BROWSER_TEST_PORT });
    },
  },
];
