// OLYMPUS tests: the void's two scenes in the page (the build sheet v0.0.24 §1 D items 13 and 10, §6 ui-anchors; VIEWS §2.11): Well A drawn with no page error, a body floating at its height by float-look's F-b (the shadow left on the deck, one scale step past 0.5 m: render/view.js FLOAT_SCALE_K), the tumble's frame, your figure in mag boots by mag-boots' B-b (its look carries them), the berth aboard Testudo the same; each scene's frame times printed. Heavy: a browser file.
import { assert, fmt } from './helpers.mjs';
import { withGame, frameMs } from './browser.mjs';
import { SCALE_STEP_K as FLOAT_SCALE_K, SCALE_FROM_M as FLOAT_SCALE_FROM_M } from '../samples/float-look/float.js';

export default [
  {
    name: 'ui-anchors: Well A in the page: your figure in mag boots; a body floating 0.7 m over a standing man\'s place (floatY 1.7) drawn there at its own size (v0.0.28: F-a, no scale step), at 0.3 m (floatY 1.3) at its own size, tumbling by its frame; no page error; the frame times printed',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.anchors, null, { timeout: 90_000 });
        await page.waitForTimeout(1500);
        const own = await page.evaluate(() => window.__olympus.view?.ownLook ?? null);
        console.log(`      your look: ${String(own).slice(0, 160)}${String(own).length > 160 ? '…' : ''}`);
        assert(String(own).includes('"boots":"mag"'), `the look carries no mag boots: ${own}`);
        const f0 = await frameMs(page);
        // (the float as the locomotion record says it (B's fields: floatY, gait 'float', tumbleRad), set on your actor between ticks;
        // the fixer of v0.0.24's reviews: it set actor.y, the floor, the very field the view wrongly read, so it passed against the bug;
        // v0.0.25: the view reads the lift over a standing man's place, floatY − FREEFALL.FLOAT_Y_M (render/faces.js liftOf), so
        // v0.0.24's 1.2 m case is a lift of 0.7 m, floatY 1.7, and 0.3 m is floatY 1.3)
        const floatAt = async (y, tumbleRad = 0) => {
          await page.evaluate(([y1, t1]) => { const s = window.__olympus.state, me = s.actors.list.find(a => a.who === s.player.id); me.floatY = 1.0 + y1; me.gait = 'float'; me.tumbleRad = t1; }, [y, tumbleRad]);
          await page.waitForTimeout(250);
          return page.evaluate(() => (window.__olympus.view?.floats ?? []).find(f => f.id === window.__olympus.state.player.actor) ?? null);
        };
        await page.evaluate(() => window.__olympus.pause?.(true));
        const hi = await floatAt(0.7), lo = await floatAt(0.3), tumbling = await floatAt(1.0, Math.PI / 2);
        console.log(`      floating 0.7 m up: ${JSON.stringify(hi)}; 0.3 m: ${JSON.stringify(lo)}; tumbling 90° at 1.0 m: ${JSON.stringify(tumbling)}`);
        // (v0.0.28: F-a, the user's star of 2026-11-20: the shadow alone, no scale step; F-b's FLOAT_SCALE_K at 0.7 m retired)
        assert(hi && Math.abs(hi.y - 0.7) < 1e-9 && hi.scaleK === 1 && FLOAT_SCALE_K > 1, JSON.stringify(hi));
        assert(lo && Math.abs(lo.y - 0.3) < 1e-9 && lo.scaleK === 1 && 0.3 <= FLOAT_SCALE_FROM_M, JSON.stringify(lo));
        assert(tumbling && /^tumble\d$/.test(tumbling.frame ?? ''), JSON.stringify(tumbling));
        console.log(`      Well A: frames p50 ${fmt(f0.medianMs, 1)} ms, p95 ${fmt(f0.p95Ms, 1)} ms`);
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-anchors&seed=48213&tier=private&nostore=1', timeoutMs: 150_000 });
    },
  },
  {
    name: 'ui-anchors: the berth aboard Testudo in the page: you in utilities and mag boots; no page error; the frame times printed',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.burn, null, { timeout: 90_000 });
        await page.waitForTimeout(1500);
        const own = await page.evaluate(() => window.__olympus.view?.ownLook ?? null), f = await frameMs(page);
        console.log(`      your look: ${String(own).slice(0, 160)}…; frames p50 ${fmt(f.medianMs, 1)} ms, p95 ${fmt(f.p95Ms, 1)} ms`);
        assert(String(own).includes('"boots":"mag"') && String(own).includes('utilities'), String(own));
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-burn&seed=48213&nostore=1', timeoutMs: 150_000 });
    },
  },
  {
    name: 'ui-anchors: the floating station played in the page by the keys bot (its own module, loaded by the page) to the course\'s end, and the end card: its title, the sheet, a line a station with the floating one\'s drift, Again as the other sheets; no page error',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.anchors, null, { timeout: 90_000 });
        await page.evaluate(() => window.__olympus.pause(true));
        const run = await page.evaluate(async () => {
          const { anchorsBot } = await import('/tests/bots/void.mjs');
          const { anchorsNow } = await import('/src/sim/scenarios/anchors.js');
          const o = window.__olympus, bot = anchorsBot();
          let n = 0;
          for (; n < 20 * 60 * 3 && !anchorsNow(o.state).end; n++) { const s = o.state, me = s.actors.list.find(a => a.who === s.player.id); o.step(1, bot(s, me, (me.bot ??= {}))); }
          const N = anchorsNow(o.state);
          return { n, end: N.end, floating: N.stations.at(-1) };
        });
        console.log(`      ${run.n} ticks by the bot in the page: the course ${run.end?.phase ?? 'NOT ENDED'}; the floating station ${JSON.stringify(run.floating)}`);
        assert(run.end?.phase === 'clear' && run.floating.end === 'fired', JSON.stringify(run));
        await page.evaluate(() => window.__olympus.pause(false));
        await page.waitForFunction(() => !!document.querySelector('.glass.end'), null, { timeout: 60_000 });
        const card = await page.evaluate(() => ({ title: document.querySelector('.glass.end h3')?.textContent ?? '', said: [...document.querySelectorAll('.glass.end .said')].map(e => e.textContent), again: [...document.querySelectorAll('.glass.end .again-as')].length }));
        console.log(`      the end card: "${card.title}"; ${card.said.length} lines: ${card.said.join(' / ')}; Again as ${card.again} sheets`);
        assert(/Anchor before you fire, as /.test(card.title) && card.said.length === 6 && card.said.some(t => /^5 Floating, floating/.test(t) && /drift after/.test(t)) && card.again >= 4, JSON.stringify(card));
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-anchors&seed=48213&tier=private&setup=s5&nostore=1', timeoutMs: 150_000 });
    },
  },
];
