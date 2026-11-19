// OLYMPUS tests: "Secure for burn" polished, in the page (v0.0.25's burn polish; the user's score of test-burn, 2026-11-19: "We should
// have some indication of how strong is the burn and evasive maneuvers ... No straped in animation, we just linger next to the bunk").
// A browser file: the burn bot plays the scene in the page (its own module, loaded by the page) on the user's seed 3156898961; once
// strapped in, the stage draws you lying in your rack's berth with its straps (the view's figures: a berth with straps, never a card
// standing by it), and the NCO in rack 1 once the manoeuvre is called; the G line under the watch gives the manoeuvre's size and
// arrow through its warning ("BRACE 0:0n · JINK 3.0 G ↓ PORT") and while it acts, its meter shown with "STRAPPED IN" beside it;
// the booted marine on 48213 reads "BOOTS WILL NOT HOLD" there. No page error.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

// (the page's bot to a moment: steps the game by hand, paused, then lets the loop draw a few frames and reads the HUD and the view)
async function runTo(page, botName, pred) {
  const r = await page.evaluate(async ([botName, pred]) => {
    const bots = await import('/tests/bots/void.mjs');
    const { burnNow } = await import('/src/sim/scenarios/burn.js');
    const o = window.__olympus, bot = (window.__burnBot ??= bots[botName]()), f = new Function('B', 's', `return ${pred}`);
    let n = 0;
    for (; n < 20 * 60 * 3 && !f(burnNow(o.state), o.state); n++) { const s = o.state, me = s.actors.list.find(a => a.who === s.player.id); o.step(1, bot(s, me, (me.bot ??= {}))); }
    return { n, t: (o.state.clock.ms - o.state.armoury.burn.t0Ms) / 1000 };
  }, [botName, pred]);
  await page.evaluate(() => window.__olympus.pause(false));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__olympus.pause(true));
  await page.waitForTimeout(150);
  const seen = await page.evaluate(() => {
    const s = window.__olympus.state, me = s.actors.list.find(a => a.who === s.player.id), nco = s.actors.list.find(a => a.who === s.armoury.burn.ncoPid);
    const figs = window.__report?.view?.figures ?? [];
    const of = (a) => figs.filter(f => f.id === a.id || f.id === `${a.id}:berth`).map(f => ({ frame: f.frame, lie: f.lie, straps: f.straps }));
    const q = (sel) => document.querySelector(sel);
    return { me: of(me), nco: of(nco), gtext: q('.watch .gline .gtext')?.textContent ?? '', note: q('.watch .gline .gnote')?.textContent ?? '', meter: !q('.watch .gline .gmrow')?.hidden, fill: q('.watch .gline .gmeter .fill')?.style.width ?? '' };
  });
  return { ...r, ...seen };
}

export default [
  {
    name: 'ui-burn-polish: in the page on 3156898961, strapped in you are drawn lying in your rack\'s berth with its straps (the NCO in rack 1 from the manoeuvre\'s call); the G line gives the manoeuvre\'s size and arrow through its warning and as it acts, its meter "STRAPPED IN"; the booted marine on 48213 reads "BOOTS WILL NOT HOLD"; no page error',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.burn, null, { timeout: 90_000 });
        await page.evaluate(() => window.__olympus.pause(true));
        const strapped = await runTo(page, 'burnBot', '!!B.strapped && !B.doing');
        const warn = await runTo(page, 'burnBot', '!!B.evade && s.clock.ms - B.evade.warnAtMs > 3000');
        const acts = await runTo(page, 'burnBot', 'B.grav?.kind === "jink" && B.grav?.phase === "hold"');
        for (const [k, v] of Object.entries({ strapped, warn, acts })) console.log(`      ${k} at ${v.t.toFixed(1)} s: you ${JSON.stringify(v.me)}, the NCO ${JSON.stringify(v.nco)}; "${v.gtext}" ${v.meter ? `meter ${v.fill} "${v.note}"` : 'no meter'}`);
        assert(strapped.me.length && strapped.me.every(f => f.lie && f.frame === 'berth' && f.straps), JSON.stringify(strapped.me));
        assert(warn.nco.some(f => f.lie && f.straps), JSON.stringify(warn.nco));
        assert(/^BRACE 0:0\d · JINK 3\.0 G ↓ PORT$/.test(warn.gtext) && warn.meter && warn.note === 'STRAPPED IN', JSON.stringify(warn));
        assert(acts.gtext === '3.00 G ↓ jink to port' && acts.meter && acts.fill === '100%', JSON.stringify(acts));
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-burn&seed=3156898961&nostore=1', timeoutMs: 150_000 });
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.burn, null, { timeout: 90_000 });
        await page.evaluate(() => window.__olympus.pause(true));
        const warn = await runTo(page, 'burnBootsBot', '!!B.evade && s.clock.ms - B.evade.warnAtMs > 3000');
        console.log(`      booted, the warning at ${warn.t.toFixed(1)} s: "${warn.gtext}" meter ${warn.fill} "${warn.note}"; you ${JSON.stringify(warn.me)}`);
        assert(/JINK 3\.0 G ↓ PORT$/.test(warn.gtext) && warn.meter && warn.note === 'BOOTS WILL NOT HOLD' && warn.me.every(f => !f.lie), JSON.stringify(warn));
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-burn&seed=48213&nostore=1', timeoutMs: 150_000 });
    },
  },
];
