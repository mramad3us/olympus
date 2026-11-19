// OLYMPUS tests: a plate naming a target never stands under the HUD's cards off the house (v0.0.26's carried round; v0.0.25's fixer's
// held finding 14: in Well A, station five's standby, the "AIM 1.9 S" plate at the cadre stood half under the target card at the top
// left; VIEWS §7.5, nothing over the HUD). main.js plateKeepOff gives plaque.js keepOff the HUD's shown elements and the target card's
// rectangle on every range course, so place() slides the plate off them. A browser file (heavy): the anchors' keys bot from station
// five's command at 1280 × 720, each plate's box against the target card's, the watch's and the log's lines', frame by frame.
import { assert } from './helpers.mjs';
import { withGame, BROWSER_TEST_PORT } from './browser.mjs';

export default [
  {
    name: 'ui-plate-hud: in Well A no plate naming a target stands under the target card, the watch or the log, at station five\'s standby (the AIM plate at the cadre, v0.0.25\'s held finding)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await game.open('play=test-anchors&seed=48213&tier=private&setup=s5&nostore=1');
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.anchors, null, { timeout: 90_000 });
        let withPlates = 0, over = 0, slid = 0, first = null;
        for (let i = 0; i < 400; i++) {
          const r = await page.evaluate(async () => {
            const O = window.__olympus, { anchorsBot } = await import('/tests/bots/void.mjs'), bot = (window.__ab ??= anchorsBot({ mode: 'keys' }));
            O.pause(true);
            for (let j = 0; j < 5; j++) { const s = O.state, me = s.actors.list.find(a => a.who === s.player.id); if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, (me.bot ??= {}))); }
            await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
            const shown = (e) => e && !e.hidden;
            const plates = [...document.querySelectorAll('.plaque.reticle, .plaque.contact, .plaque.parts, .plaque.terms')].filter(shown);
            const cards = [...document.querySelectorAll('.hitcard, .watch, .toasts > *')].filter(shown).map(e => ({ cls: e.className, q: e.getBoundingClientRect() })).filter(c => c.q.width > 0);
            const meet = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
            const hits = [];
            for (const p of plates) { const q = p.getBoundingClientRect(); for (const c of cards) if (meet(q, c.q)) hits.push(`${p.dataset.text} × ${c.cls}`); }
            return { plates: plates.length, slid: plates.filter(p => p.dataset.slid === 'slid' || p.dataset.slid === 'stacked').length, card: cards.some(c => c.cls === 'hitcard'), hits, end: !!O.state.armoury.range.anchors.end };
          });
          if (r.plates) withPlates++;
          if (r.plates && r.card) slid += r.slid;
          if (r.hits.length) { over++; first ??= r.hits; }
          if (r.end) break;
        }
        console.log(`      station five at 1280 × 720: ${withPlates} frames with a plate, ${slid} plates slid with the target card up, ${over} frames with a plate over a card${first ? ` (${first.join('; ')})` : ''}`);
        assert(withPlates > 0 && slid > 0, JSON.stringify({ withPlates, slid }));
        assert(over === 0, JSON.stringify({ over, first }));
        assert(!errors.length, errors.join(' | '));
      }, { port: BROWSER_TEST_PORT });
    },
  },
];
