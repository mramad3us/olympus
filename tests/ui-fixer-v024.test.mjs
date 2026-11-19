// OLYMPUS tests: the fixer of v0.0.24's reviews in the page (heavy: a browser file), each case failing without its fix:
//   H1  Well A on the anchors course draws its turners, the anchors and the brass (render/view.js built the range's look only on the
//       KD's ground and in the shoot house, so at every station you fired at bare deck), with no bay flag in it;
//   H3  a floating body is drawn at free fall's height (actor.floatY) one scale step larger past 0.5 m (float-look's F-b), as the sim
//       makes it at the floating station, nothing set by hand (view.js floatOf read actor.y, the floor: every float on the deck);
//   M3, L6  every bubble clear of every part of the HUD in every frame of the anchors course (the bubbles were placed before the hit
//       card and the radio box were written in the frame: "Standby, standby." under the hit card, a bubble a pixel into the radio box);
//   M2  the burn's jink card ("The deck lurches.") clear of the radio box, which moves over it as in stop motion;
//   CR4 the surprise's free card in stop motion is shown in the panel's place and its digit answers it (it held time unseen there).
import { assert } from './helpers.mjs';
import { withGame, BROWSER_TEST_PORT } from './browser.mjs';

const meets = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const frames = (page) => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
// (n ticks of the anchors' keys bot, stepped by hand in the page; a fast-forward ended as the loop's ffFrame does)
const anchorsSteps = (page, n) => page.evaluate(async (k) => {
  const O = window.__olympus, { anchorsBot } = await import('/tests/bots/void.mjs'), bot = (window.__ab ??= anchorsBot({ mode: 'keys' }));
  O.pause(true);
  for (let i = 0; i < k; i++) { const s = O.state, me = s.actors.list.find(a => a.who === s.player.id); if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, (me.bot ??= {}))); }
}, n);
// (every shown bubble against every other shown part of the HUD, in screen px)
const clashesNow = (page) => page.evaluate(() => {
  const rect = (e) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
  const hud = document.getElementById('hud'), W = innerWidth * innerHeight;
  const bubbles = [...hud.querySelectorAll('.plaque.speaker')].filter(e => !e.hidden).map(e => ({ words: e.dataset.words, ...rect(e) }));
  const parts = [...hud.children].filter(e => !e.hidden && !e.classList.contains('speaker')).map(e => ({ q: e.className, ...rect(e) })).filter(r => r.w > 0 && r.h > 0 && r.w * r.h < 0.5 * W);
  return { bubbles, parts, ms: window.__olympus.state.clock.ms };
});

export default [
  {
    name: 'H1, H3: Well A draws its turners and the anchors at a station\'s string, no bay flag; at the floating station your body is drawn at its free-fall height one scale step larger (the play review: bare deck at every station, every float on the deck)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        // (station 2, the lanyard: its string, the turner and the lanyard's strap on the stage)
        await game.open('play=test-anchors&seed=48213&tier=private&setup=s2&nostore=1');
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.anchors, null, { timeout: 90_000 });
        let at = null;
        for (let i = 0; i < 200 && !at; i++) {
          await anchorsSteps(page, 5); await frames(page);
          at = await page.evaluate(async () => {
            const { anchorsNow } = await import('/src/sim/scenarios/anchors.js'), O = window.__olympus, N = anchorsNow(O.state), v = O.view;
            return N.phase === 'string' && N.st === 1 ? { st: N.st, pairs: v?.range?.pairs ?? null, flag: v?.range?.flag ?? null } : null;
          });
        }
        console.log(`      station 2's string: the range's pairs ${JSON.stringify(at?.pairs ?? null)}; flag pixels ${at?.flag}`);
        assert(at?.pairs && at.pairs.anchors > 0 && at.pairs.turners > 0 && at.pairs.hung > 0 && at.flag === 0, JSON.stringify(at));
        // (station 5, floating: your body as the sim floats it)
        await game.open('play=test-anchors&seed=48213&tier=private&setup=s5&nostore=1');
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.anchors, null, { timeout: 90_000 });
        await page.evaluate(() => { window.__ab = null; });
        let fl = null;
        for (let i = 0; i < 200 && !fl; i++) {
          await anchorsSteps(page, 5); await frames(page);
          fl = await page.evaluate(() => { const O = window.__olympus, me = O.state.actors.list.find(a => a.who === O.state.player.id); if (!(me.floatY > 0.5)) return null; const f = (O.view?.floats ?? []).find(x => x.id === me.id); return { floatY: me.floatY, drawn: f ?? null }; });
        }
        console.log(`      floating: floatY ${fl?.floatY} m, drawn ${JSON.stringify(fl?.drawn ?? null)}`);
        assert(fl?.drawn && Math.abs(fl.drawn.y - fl.floatY) < 1e-6 && fl.drawn.scaleK > 1, JSON.stringify(fl));
        assert(!errors.length, errors.join(' | '));
      }, { port: BROWSER_TEST_PORT });
    },
  },
  {
    name: 'M3, L6: on the anchors course (the private by the keys on 48213) no bubble is ever over the hit card, the radio box or any other part of the HUD',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('play=test-anchors&seed=48213&tier=private&nostore=1');
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.anchors, null, { timeout: 90_000 });
        const clashes = [], seen = new Set();
        // (ten ticks at a time, two frames drawn after each: the play review's cadence, which met "Standby, standby." under the hit card
        // at tick 340)
        await page.keyboard.press('ShiftLeft');
        for (let i = 0; i < 90; i++) {
          await anchorsSteps(page, 10); await frames(page);
          const f = await clashesNow(page);
          for (const b of f.bubbles) { seen.add(b.words); for (const p of f.parts) if (meets(b, p)) clashes.push(`"${b.words}" × ${p.q} at ${f.ms}`); }
        }
        console.log(`      ${seen.size} lines drawn as bubbles; clashes with the HUD ${clashes.length}${clashes.length ? `: ${clashes.slice(0, 3).join('; ')}` : ''}`);
        assert(seen.size >= 3 && !clashes.length, JSON.stringify(clashes.slice(0, 6)));
        assert(!errors.length, errors.join(' | '));
      }, { port: BROWSER_TEST_PORT });
    },
  },
  {
    name: 'M2: the burn\'s jink card ("The deck lurches.", seed 2, the lazy marine) is clear of the radio box (the 1MC\'s and the NCO\'s lines sat inside it)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('play=test-burn&seed=2&nostore=1');
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.burn, null, { timeout: 90_000 });
        let got = null;
        for (let i = 0; i < 600 && !got; i++) {
          await page.evaluate(async () => {
            const O = window.__olympus, { burnLazyBot } = await import('/tests/bots/void.mjs'), bot = (window.__lb ??= burnLazyBot());
            O.pause(true);
            for (let n = 0; n < 10; n++) { const s = O.state, me = s.actors.list.find(a => a.who === s.player.id); if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, (me.bot ??= {}))); }
          });
          await frames(page);
          got = await page.evaluate(() => {
            const rect = (e) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
            const card = document.querySelector('#hud .reflexcard'), radio = document.querySelector('#hud .radio.voices');
            if (!card || card.hidden || !/LURCHES|lurches/i.test(card.textContent + (card.querySelector('.rx-plaque')?.dataset.text ?? ''))) return null;
            return { card: rect(card), radio: radio && !radio.hidden ? rect(radio) : null, lines: radio ? radio.textContent.slice(0, 120) : '' };
          });
        }
        console.log(`      the jink's card ${JSON.stringify(got?.card ?? null)}; the radio box ${JSON.stringify(got?.radio ?? null)} "${got?.lines ?? ''}"`);
        assert(got && (!got.radio || !meets(got.card, got.radio)), JSON.stringify(got));
        assert(!errors.length, errors.join(' | '));
      }, { port: BROWSER_TEST_PORT });
    },
  },
  {
    name: 'CR4: the surprise\'s free card offered in stop motion (&grav= on test-anchors) is drawn in the panel\'s place and its digit answers it, time moving again (it held time with no card shown and the digits went to the panel)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('play=test-anchors&seed=48213&tier=private&grav=jink:0.3@900s!&nostore=1');
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.anchors && !!window.__olympus.state.places?.live?.env?.profile, null, { timeout: 90_000 });
        for (let i = 0; i < 400; i++) { await anchorsSteps(page, 2); if (await page.evaluate(() => window.__olympus.state.stop?.mode === 'stop' && !window.__olympus.state.stop.reflex)) break; }
        const offered = await page.evaluate(async () => {
          const { offerFree } = await import('/src/sim/combat/reflex.js'), O = window.__olympus, s = O.state;
          return offerFree(s, null, s.places.live.env.profile, { why: 'grav', title: 'The deck lurches.', options: [{ key: 'grab', label: 'Grab the hold', ms: 0 }] }) && s.stop?.mode === 'stop';
        });
        await page.evaluate(() => window.__olympus.pause(false));
        await frames(page);
        const shown = await page.evaluate(() => { const c = document.querySelector('#hud .reflexcard'); return c && !c.hidden ? c.textContent.slice(0, 80) : null; });
        await page.keyboard.press('Digit1');
        let closed = false;
        for (let i = 0; i < 40 && !closed; i++) { await frames(page); closed = await page.evaluate(() => !window.__olympus.state.places.live.env.profile.card); }
        console.log(`      offered in stop motion: ${offered}; the card shown: ${shown ? `"${shown}"` : 'NO'}; answered by 1: ${closed}`);
        assert(offered && shown && /Grab the hold/.test(shown) && closed, JSON.stringify({ offered, shown, closed }));
        assert(!errors.length, errors.join(' | '));
      }, { port: BROWSER_TEST_PORT });
    },
  },
];
