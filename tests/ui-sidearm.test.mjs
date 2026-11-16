// OLYMPUS tests: the stoppage's answers and the sidearm in the page (heavy; COMBAT §25.19.6; the rework's R6, 2026-11-13).
//
// The reflex card in the house shows the answers by the situation (src/ui/hud/reflex.js). Every sheet carries the P-12 from
// 2026-11-15 (the user: "everyone should have the same loadout"; the Sergeant up before): the boot recruit's Transition:
// pistol first, its digit drawing the P-12 (the weapon card and the figure drawn with the rifle hanging, look.js gunLook),
// the lane then run to its card by the keys bot (Rifle up by the DI's line); a man with no pistol at all (the holster emptied
// by hand: never the rank's now) sees Transition struck with its why, "not carried", where its time would be, and its digit
// says why instead of answering (main.js). No page error, console error or failed request anywhere.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

// v0.0.18: the weapon card shows both guns in the page: at GO the holstered P-12 in the strip ("P-12 HOLSTER · SAFE · 1 + 9"),
// after Transition the P-12 drawn as a pistol (P12A, pixel for pixel), never the R-7, the rifle hanging in the strip.
// (in the page: the stoppage bot stepped until the dummy's click opens the card; returns the card's options or null)
const toCard = (page, answer, keys = false) => page.evaluate(async ([answer, keys]) => {
  const O = window.__olympus, m = await import('/tests/bots/house.mjs'), bot = keys ? m.houseKeysBot() : m.stoppageBot({ answer });
  O.pause(true);
  for (let n = 0; n < 20 * 60 * 5 && !O.state.stop?.reflex && !O.state.armoury.range.house.end; n++) {
    const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor);
    if (s.skip?.engine === 'ff') O.sim.ffTick(s); else O.step(1, bot(s, me, (me.bot ??= {})));
  }
  O.pause(false);
  return O.state.stop?.reflex?.options?.map(o => ({ key: o.key, label: o.label, off: o.off ?? null })) ?? null;
}, [answer, keys]);

export default [
  {
    name: 'in the page (heavy): the boot recruit\'s card shows Transition: pistol first (every sheet carries the P-12 from 2026-11-15) and its digit draws the P-12 (the weapon card and the figure drawn), and the lane runs to its card by the keys with no error; a man with no pistol at all sees it struck "not carried" and its digit says why',
    heavy: true,
    timeoutMs: 600000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined;
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        // (the corporal with his holster emptied by hand at the fill: no pistol at all)
        await game.open('play=test-shoothouse&setup=go&tier=cpl&seed=1489397426&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        await page.evaluate(() => { const s = window.__olympus.state, k = s.people[s.player.id].kit, P = s.items[k.worn.holster]; delete s.items[P.mag]; delete s.items[k.worn.holster]; delete k.worn.holster; s.armoury.range.house.pistol = null; });
        const cpl = await toCard(page, 'ia');
        await page.waitForSelector('.reflexcard .rx-row', { timeout: 10000 });
        const card = await page.evaluate(() => [...document.querySelectorAll('.reflexcard .rx-row')].map(r => ({ text: r.innerText.replace(/\s+/g, ' ').trim(), off: r.classList.contains('off') })));
        const struck = card.findIndex(r => r.off);
        console.log(`      cpl, no pistol: ${card.map(r => `${r.text}${r.off ? ' [struck]' : ''}`).join(' | ')}`);
        assert(cpl && struck >= 0 && /Transition: pistol/.test(card[struck].text) && /not carried/.test(card[struck].text), JSON.stringify({ cpl, card }));
        // (the loop's frames running again before the key, as a player's would be)
        await page.waitForTimeout(500);
        await page.keyboard.press(`Digit${struck + 1}`);
        await page.waitForTimeout(400);
        const still = await page.evaluate(() => ({ card: !!window.__olympus.state.stop?.reflex, toast: [...document.querySelectorAll('.toasts *')].map(e => e.textContent).join(' | ') }));
        console.log(`      its digit: the card ${still.card ? 'still up' : 'gone'}; said '${still.toast.slice(0, 160)}'`);
        assert(still.card && /not carried/.test(still.toast), JSON.stringify(still));
        // (the boot recruit by the keys: Transition first, by its digit)
        await game.open('play=test-shoothouse&setup=go&tier=recruit&seed=1489397426&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        // (v0.0.18: at GO the card's strip carries the holstered P-12, its condition its own belief's)
        await page.waitForFunction(() => !!document.querySelector('.steps .wcard')?.dataset.other, null, { timeout: 15000 });
        const atGo = await page.evaluate(() => document.querySelector('.steps .wcard').dataset.other);
        console.log(`      recruit at GO: the strip "${atGo}"`);
        assert(/^P-12 HOLSTER · SAFE · 1 \+ \d+$/.test(atGo), atGo);
        const rec = await toCard(page, 'transition', true);
        console.log(`      recruit: ${rec?.map(o => `${o.label}${o.off ? ` [${o.off}]` : ''}`).join(' | ')}`);
        assert(rec?.[0]?.key === 'transition' && !rec.some(o => o.off), JSON.stringify(rec));
        await page.waitForSelector('.reflexcard .rx-row', { timeout: 10000 });
        await page.waitForTimeout(500);
        await page.keyboard.press('Digit1');
        await page.waitForFunction(() => { const s = window.__olympus.state, p = s.armoury.range.house.pistol; return s.stop?.gun === p; }, null, { timeout: 15000 });
        await page.waitForTimeout(300);
        const out = await page.evaluate(() => { const s = window.__olympus.state, pid = s.player.id; return { gun: s.stop?.gun, hands: s.people[pid].kit.hands ?? null, weapon: s.items[s.stop?.gun]?.model ?? null, figure: !!document.querySelector('canvas') }; });
        console.log(`      recruit: the P-12 drawn: ${JSON.stringify(out)}`);
        assert(out.weapon === 'p12' && out.hands?.[0] === out.gun, JSON.stringify(out));
        // (v0.0.18: the card draws the P-12 as a pistol (P12A), never the R-7, with the rifle hanging in its strip)
        await page.waitForFunction(() => /^R-7 HANGING/.test(document.querySelector('.steps .wcard')?.dataset.other ?? ''), null, { timeout: 15000 });
        const pic = await page.evaluate(async () => {
          const W = await import('/src/art/weaponcard.js'), G = await import('/src/sim/arms/guns.js'), F = await import('/src/sim/arms/firearms.js');
          const s = window.__olympus.state, pid = s.player.id, belief = F.beliefOf(s, s.stop.gun), other = G.otherGunView(s, pid);
          const c = document.querySelector('.steps .wcard canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
          const same = (pm) => { const b = new Uint8ClampedArray(pm.data.buffer); if (b.length !== d.length) return false; for (let i = 0; i < b.length; i++) if (b[i] !== d[i]) return false; return true; };
          return { strip: document.querySelector('.steps .wcard').dataset.other, pistol: same(W.paintWeaponCard({ model: 'p12', drawing: 'p12a', belief, other })), rifle: same(W.paintWeaponCard({ model: 'r7', belief, other })) };
        });
        console.log(`      recruit, the P-12 drawn: the card is P12A's ${pic.pistol}, the R-7's ${pic.rifle}; the strip "${pic.strip}"`);
        assert(pic.pistol && !pic.rifle, JSON.stringify(pic));
        // (v0.0.18, the review's: a click on the strip is GUN 3's row, Rifle up here, sent whole: it was the row's id alone, and
        // main.js's sendStep read step.act and step.id off a string, so the click sent { step: undefined } and nothing started)
        await page.waitForTimeout(300);
        const box = await page.evaluate(async () => {
          const W = await import('/src/art/weaponcard.js'), r = document.querySelector('.steps .wcard canvas').getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + (W.OTHER_Y + W.OTHER_H / 2) / W.CARD_H * r.height, rifle: window.__olympus.state.people[window.__olympus.state.player.id].kit.worn.sling };
        });
        await page.mouse.click(box.x, box.y);
        await page.waitForFunction((rifle) => { const s = window.__olympus.state; return s.stop?.doing?.step === 'weapon:rifle-up' || s.stop?.gun === rifle; }, box.rifle, { timeout: 15000 });
        const clicked = await page.evaluate(() => ({ step: window.__olympus.state.stop?.doing?.step ?? null, gun: window.__olympus.state.items[window.__olympus.state.stop?.gun]?.model ?? null }));
        console.log(`      a click on the strip: ${JSON.stringify(clicked)}`);
        // (the rest of the lane by the keys bot, to the card)
        const ended = await page.evaluate(async () => {
          const O = window.__olympus, m = await import('/tests/bots/house.mjs'), bot = m.houseKeysBot();
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
