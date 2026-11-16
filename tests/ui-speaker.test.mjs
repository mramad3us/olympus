// OLYMPUS tests: who speaks, in the page (the build sheet v0.0.20 §1 item 13; feel FL-4): a short call's balloon over its speaker.
//
// The tier one's lane on 48213 by the scene's own bot in the page, stopped at your number two's first "Clear!" in room 1 (the 'say'
// fact the radio box hears, his record's clearMs or the leg's echo); then frames drawn with the clock standing: the balloon (.plaque.speaker.call, data-who 'two') is in the
// page within a frame, over his head, meeting neither the panel nor the radio box; 1.32 s of game time later (CALL_BALLOON_MS and
// its fade) it is gone. Heavy: a browser.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

export default [
  {
    name: 'your number two\'s first "Clear!" in room 1 stands in a balloon over his head within a frame of the fact, clear of the panel and the radio box, and is gone 1.32 s later (48213, the tier one)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [];
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('play=test-shoothouse&setup=go&tier=tierone&seed=48213&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        const said = await page.evaluate(async () => {
          const O = window.__olympus, { houseBot } = await import('/tests/bots/house.mjs'), bot = houseBot({ mode: 'T' });
          O.pause(true);
          for (let n = 0; n < 20000; n++) {
            const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor), H = s.armoury.range.house;
            if (Number.isFinite(H.two.clearMs) || H.rooms[0].calls.some(c => c.by === 'two' && c.say === 'clear')) return { ms: s.clock.ms, two: H.twoPid };
            if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, (me.bot ??= {})));
          }
          return null;
        });
        assert(said, 'no "Clear!" by the #2 in room 1');
        const look = () => page.evaluate(() => {
          const e = [...document.querySelectorAll('.plaque.speaker.call')].find(x => !x.hidden && x.dataset.who === 'two'), r = e?.getBoundingClientRect();
          const box = (q) => { const x = document.querySelector(q); if (!x || x.hidden) return null; const b = x.getBoundingClientRect(); return b.width ? b : null; };
          const meets = (a, b) => !!a && !!b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
          const s = window.__olympus.state, two = s.actors.list.find(a => a.who === s.armoury.range.house.twoPid), head = window.__olympus.project(two.x, 1.8, two.z);
          return { shown: !!e, text: e?.dataset.text ?? null, r: r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null, panel: meets(r, box('.steps')), radio: meets(r, box('.radio')), head, ms: s.clock.ms };
        });
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        const at = await look();
        await page.evaluate(async (t0) => {
          // (1.4 s of game time on by the bot: stop motion holds the clock while it chooses, so the clock, not the calls, is counted)
          const O = window.__olympus, { houseBot } = await import('/tests/bots/house.mjs'), bot = houseBot({ mode: 'T' });
          for (let i = 0; i < 4000 && O.state.clock.ms < t0 + 1400; i++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); O.step(1, bot(s, me, (me.bot ??= {}))); }
        }, said.ms);
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        const after = await look();
        rows.push(`at ${said.ms}: ${JSON.stringify(at)}; ${after.ms - said.ms} ms later shown ${after.shown}`);
        for (const r of rows) console.log(`      ${r}`);
        assert(at.shown && /clear/i.test(at.text ?? '') && !at.panel && !at.radio && !(after.shown && after.text === at.text && after.ms - said.ms >= 1320), JSON.stringify({ at, after }));
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
];
