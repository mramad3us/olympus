// OLYMPUS tests: v0.0.25's fixer, in the page (a browser file; .run/v025/fix.md). Each case fails without its fix:
//   - "Secure for burn" on the user's seed 3156898961: through the 3 G jink the NCO is drawn strapped in rack 1's berth (the view's
//     memory kept him half way in, walking beside it, his berth out of your sight from your own: render/view.js), and you, lying
//     strapped in yours, are drawn whole, the rack's foot taken away over you rather than thinned to the checkerboard (view.js
//     seeFrame's `whole`; the berth layer leaves your own berth out of the see-through: render/figures.js aSee);
//   - the Wreck: the cadre's two lines of the brief's tick both shown as bubbles, the first first (ui/plaque.js speakerMarks); your
//     #2's "Got you." and "Through." shown as bubbles at the scuttle (placeBubbles' reach for a line at a place); the 1MC's bubble at
//     its speaker without "1MC:" before its words; on the Wreck the panel and the line say a hatch, never a door (ui/ship-words.js).
// No page error.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { createGame } from './game.mjs';

// (the page steps the game a tick a frame by a bot, recording the bubbles shown, until pred or n ticks)
async function framesTo(page, { bot, pred, n = 2400 }) {
  return page.evaluate(async ([bot, pred, n]) => {
    const O = window.__olympus, f = new Function('s', 'said', `return ${pred}`);
    const [mod, name] = bot.split(':'), B = await import(`/tests/bots/${mod}.mjs`), b = (window.__fxBot ??= B[name]()), mem = (window.__fxMem ??= {});
    const said = (window.__fxSaid ??= []), shown = (window.__fxShown ??= []);
    if (!window.__fxHooked) { window.__fxHooked = true; O.bus.on('say', (x) => said.push({ ms: O.state.clock.ms, text: String(x.text ?? ''), who: x.who ?? x.speaker ?? null })); }
    let i = 0;
    await new Promise((done) => {
      const tick = () => {
        const s = O.state;
        if (i++ >= n || f(s, said)) return done();
        if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else { const me = s.actors.list.find(a => a.who === s.player.id); O.step(1, b(s, me, mem)); }
        requestAnimationFrame(() => {
          for (const e of document.querySelectorAll('.plaque.speaker')) if (!e.hidden && !shown.some(x => x.words === e.dataset.words)) shown.push({ ms: O.state.clock.ms, who: e.dataset.who, words: e.dataset.words });
          tick();
        });
      };
      tick();
    });
    return { said: said.slice(), shown: shown.slice(), i };
  }, [bot, pred, n]);
}

export default [
  {
    name: 'ui-fixer-v025: in "Secure for burn" on 3156898961 the NCO is drawn strapped in rack 1 through the jink (never remembered walking beside it), and you strapped in your berth whole, the rack\'s foot taken away over you (the play review\'s first two)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.burn, null, { timeout: 90_000 });
        await page.evaluate(() => window.__olympus.pause(true));
        await framesTo(page, { bot: 'void:burnBot', pred: '!!s.armoury.burn.evade?.atMs && s.clock.ms > s.armoury.burn.evade.atMs + 1500', n: 20 * 140 });
        await page.evaluate(() => window.__olympus.pause(false));
        await page.waitForTimeout(300);
        await page.evaluate(() => window.__olympus.pause(true));
        await page.waitForTimeout(150);
        const r = await page.evaluate(() => {
          const s = window.__olympus.state, me = s.actors.list.find(a => a.who === s.player.id), nco = s.actors.list.find(a => a.who === s.armoury.burn.ncoPid);
          const figs = window.__report?.view?.figures ?? [], of = (a) => figs.filter(f => f.id === a.id || f.id === `${a.id}:berth`).map(f => ({ frame: f.frame, lie: f.lie, straps: f.straps, remembered: f.remembered, x: f.x, z: f.z }));
          return { me: of(me), nco: of(nco), ncoSim: { posture: nco.posture, strapped: !!nco.strapped }, see: window.__report?.view?.see ?? null };
        });
        console.log(`      the NCO (${JSON.stringify(r.ncoSim)}) drawn ${JSON.stringify(r.nco)}; you ${JSON.stringify(r.me)}; the see-through ${JSON.stringify(r.see)}`);
        assert(r.ncoSim.strapped && r.nco.length && r.nco.every(f => f.lie && f.frame === 'berth' && f.straps), JSON.stringify(r.nco));
        assert(r.me.length && r.me.every(f => f.lie && f.straps) && (!r.see?.hidden || r.see.whole === true), JSON.stringify({ me: r.me, see: r.see }));
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-burn&seed=3156898961&nostore=1', timeoutMs: 200_000 });
    },
  },
  {
    name: 'ui-fixer-v025: on the Wreck the brief\'s two lines of one tick both shown as bubbles, the first first; your #2\'s "Got you." and "Through." shown as bubbles; the 1MC\'s bubble at its speaker without "1MC:"; the panel and the line say a hatch, never a door (the play review\'s 4, 7, 13 and 16)',
    heavy: true,
    timeoutMs: 400_000,
    async fn() {
      // (the brief from the fill: the cadre's lines of its first tick)
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.house, null, { timeout: 90_000 });
        await page.evaluate(() => window.__olympus.pause(true));
        // (the lines said on the brief's tick, before the page's hook: the same game in node, its first two ticks)
        const g0 = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'sgt' });
        g0.step(2);
        const first = g0.facts('say').map(f => ({ text: String(f.text), who: f.who }));
        const t0 = await page.evaluate(() => window.__olympus.state.clock.ms);
        const r = await framesTo(page, { bot: 'house:houseTBot', pred: `s.clock.ms - ${t0} > 16000`, n: 20 * 30 });
        const up = (t) => t.toUpperCase().replace(/\s+/g, ' ').slice(0, 14);
        const seenFirst = first.map(x => r.shown.find(b => b.words.toUpperCase().replace(/\s+/g, ' ').startsWith(up(x.text))));
        console.log(`      said on the brief's tick: ${first.map(x => `"${x.text.slice(0, 40)}…"`).join(', ')}; shown from ${seenFirst.map(b => (b ? b.ms - t0 : 'never')).join(', ')} ms of the page's first stepped tick`);
        assert(first.length >= 2 && seenFirst.every(Boolean) && seenFirst[0].ms <= seenFirst[1].ms, JSON.stringify({ first, shown: r.shown.slice(0, 6) }));
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-zerocqb&seed=48213&tier=sgt&nostore=1', timeoutMs: 200_000 });
      // (the transit by T from the trunk: your #2's two lines at the scuttle; the hatch's words on the HUD)
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.house, null, { timeout: 90_000 });
        await page.evaluate(() => window.__olympus.pause(true));
        const r = await framesTo(page, { bot: 'house:houseTBot', pred: 'said.some(x => x.text === "Through." ) && s.clock.ms - said.find(x => x.text === "Through.").ms > 1500', n: 20 * 90 });
        const hud = await page.evaluate(() => document.getElementById('hud').innerText);
        const two = r.shown.filter(b => /GOT YOU|THROUGH/i.test(b.words)).map(b => b.words);
        console.log(`      said: ${r.said.filter(x => /Got you|Through\./.test(x.text)).map(x => x.text).join(', ')}; bubbles: ${two.join(', ') || 'none'}; a door on the HUD: ${/\bdoor/i.test(hud)}`);
        assert(two.some(w => /GOT YOU/i.test(w)) && two.some(w => /THROUGH/i.test(w)), JSON.stringify(r.shown));
        assert(!/\bdoor/i.test(hud), hud.slice(0, 400));
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-zerocqb&seed=48213&tier=sgt&setup=trunk&nostore=1', timeoutMs: 200_000 });
      // (the tug's warning: the 1MC's bubble at its speaker, its words alone)
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.house, null, { timeout: 90_000 });
        await page.evaluate(() => window.__olympus.pause(true));
        const r = await framesTo(page, { bot: 'house:houseTBot', pred: 'said.some(x => /^Brace/.test(x.text)) && s.clock.ms - said.find(x => /^Brace/.test(x.text)).ms > 1000', n: 20 * 60 });
        const pa = r.shown.filter(b => /BRACE/i.test(b.words)).map(b => b.words);
        console.log(`      the 1MC's bubbles: ${pa.join(' | ') || 'none'}`);
        assert(pa.length && pa.every(w => !/^1MC:/i.test(w)), JSON.stringify(r.shown));
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-zerocqb&seed=48213&tier=sgt&setup=tug&nostore=1', timeoutMs: 200_000 });
    },
  },
];
