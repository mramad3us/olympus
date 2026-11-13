// OLYMPUS tests: the stoppage's answers and the sidearm in the page (heavy; COMBAT §25.19.6; the rework's R6, 2026-11-13).
//
// The reflex card in the house shows the answers by the situation (src/ui/hud/reflex.js): the corporal's Transition struck
// with its why, "not issued", where its time would be, and its digit says why instead of answering (main.js); the sergeant's
// Transition: pistol first, its digit drawing the P-12 (the weapon card and the figure drawn with the rifle hanging, look.js
// gunLook), the lane then run to its card by the honest bot, with no page error, console error or failed request anywhere.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

// (in the page: the stoppage bot stepped until the dummy's click opens the card; returns the card's options or null)
const toCard = (page, answer) => page.evaluate(async (answer) => {
  const O = window.__olympus, m = await import('/tests/bots/house.mjs'), bot = m.stoppageBot({ answer });
  O.pause(true);
  for (let n = 0; n < 20 * 60 * 5 && !O.state.stop?.reflex && !O.state.armoury.range.house.end; n++) {
    const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor);
    if (s.skip?.engine === 'ff') O.sim.ffTick(s); else O.step(1, bot(s, me, (me.bot ??= {})));
  }
  O.pause(false);
  return O.state.stop?.reflex?.options?.map(o => ({ key: o.key, label: o.label, off: o.off ?? null })) ?? null;
}, answer);

export default [
  {
    name: 'in the page (heavy): the corporal\'s card shows Transition struck "not issued" and its digit says why; the sergeant\'s Transition: pistol by its digit draws the P-12 (the weapon card and the figure drawn), and the lane runs to its card with no error',
    heavy: true,
    timeoutMs: 600000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined;
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        // (the corporal: no pistol)
        await game.open('play=test-shoothouse&setup=go&tier=cpl&seed=1489397426&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        const cpl = await toCard(page, 'ia');
        await page.waitForSelector('.reflexcard .rx-row', { timeout: 10000 });
        const card = await page.evaluate(() => [...document.querySelectorAll('.reflexcard .rx-row')].map(r => ({ text: r.innerText.replace(/\s+/g, ' ').trim(), off: r.classList.contains('off') })));
        const struck = card.findIndex(r => r.off);
        console.log(`      cpl: ${card.map(r => `${r.text}${r.off ? ' [struck]' : ''}`).join(' | ')}`);
        assert(cpl && struck >= 0 && /Transition: pistol/.test(card[struck].text) && /not issued/.test(card[struck].text), JSON.stringify({ cpl, card }));
        // (the loop's frames running again before the key, as a player's would be)
        await page.waitForTimeout(500);
        await page.keyboard.press(`Digit${struck + 1}`);
        await page.waitForTimeout(400);
        const still = await page.evaluate(() => ({ card: !!window.__olympus.state.stop?.reflex, toast: [...document.querySelectorAll('.toasts *')].map(e => e.textContent).join(' | ') }));
        console.log(`      its digit: the card ${still.card ? 'still up' : 'gone'}; said '${still.toast.slice(0, 160)}'`);
        assert(still.card && /not issued/.test(still.toast), JSON.stringify(still));
        // (the sergeant: Transition first, by its digit)
        await game.open('play=test-shoothouse&setup=go&tier=sgt&seed=1489397426&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        const sgt = await toCard(page, 'transition');
        assert(sgt?.[0]?.key === 'transition', JSON.stringify(sgt));
        await page.waitForSelector('.reflexcard .rx-row', { timeout: 10000 });
        await page.waitForTimeout(500);
        await page.keyboard.press('Digit1');
        await page.waitForFunction(() => { const s = window.__olympus.state, p = s.armoury.range.house.pistol; return s.stop?.gun === p; }, null, { timeout: 15000 });
        await page.waitForTimeout(300);
        const out = await page.evaluate(() => { const s = window.__olympus.state, pid = s.player.id; return { gun: s.stop?.gun, hands: s.people[pid].kit.hands ?? null, weapon: s.items[s.stop?.gun]?.model ?? null, figure: !!document.querySelector('canvas') }; });
        console.log(`      sgt: the P-12 drawn: ${JSON.stringify(out)}`);
        assert(out.weapon === 'p12' && out.hands?.[0] === out.gun, JSON.stringify(out));
        // (the rest of the lane by the honest bot, to the card)
        const ended = await page.evaluate(async () => {
          const O = window.__olympus, m = await import('/tests/bots/house.mjs'), bot = m.houseHonestBot();
          O.pause(true);
          for (let n = 0; n < 20 * 60 * 10 && !O.scene?.ended; n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') O.sim.ffTick(s); else O.step(1, bot(s, me, (me.bot ??= {}))); }
          O.pause(false);
          const s = O.state, pid = s.player.id;
          return { ended: !!O.scene?.ended, holster: s.people[pid].kit.worn.holster === s.armoury.range.house.pistol };
        });
        await page.waitForTimeout(500);
        console.log(`      the lane to its card: ${JSON.stringify(ended)}; errors ${errors.length}`);
        assert(ended.ended && ended.holster, JSON.stringify(ended));
      }, { port });
    },
  },
];
