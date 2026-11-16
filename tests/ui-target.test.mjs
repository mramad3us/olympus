// OLYMPUS tests: the target view and the dressed doll in the page (heavy, a browser file; the build sheet 0.0.18 §5.2). The user's
// asks of 2026-11-15: "the I and C menu preview of the character should show the currently worn gear", and the target view "for
// every time we're engaging something or someone". On Stack and clear (seed 48213, the tier one): with setup contact (room 1's door
// open, you in its doorway) the target view opens at the take-in's pause on 1a, the stand as identified, clear of the step panel's
// and the instinct line's real boxes in the panel's layouts A, B and C at 1600 × 900 and 1024 × 768; from GO, run by the house's
// T bot in the page, it shows the pair's two marks on 1a and follows the engagement to 2a. A man's card bracketed on test-handling
// is not carried to test-range launched after it. The I and C figures wear the suit and carry the carrier, the holster and the R-7
// (their pixels counted against the same doll drawn without each piece, by the page's own modules); no page errors.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { overlaps } from '../src/ui/hud/layout.js';
import { COMBAT_SUIT } from '../src/art/figures/outfits.js';

const hex = (r, g, b) => (r << 16) | (g << 8) | b;

export default [
  {
    name: 'on Stack and clear (seed 48213, the tier one) the target view opens at the take-in\'s pause on 1a, the stand as your take-in identified it, clear of the step panel\'s and the instinct line\'s real boxes in panels A, B and C, shows the pair\'s marks on 1a and follows the engagement to 2a; a man\'s card is not carried from test-handling to test-range launched after it; the I and C figures wear the suit and carry the carrier, the holster and the R-7; no page errors',
    heavy: true,
    timeoutMs: 180000,
    async fn() {
      await withGame(async (page, errors, game) => {
        for (const [w, h] of [[1600, 900], [1024, 768]]) for (const panel of ['a', 'b', 'c']) {
          await page.setViewportSize({ width: w, height: h });
          await game.open(`play=test-shoothouse&setup=contact&tier=tierone&seed=48213&nostore=1&panel=${panel}`);
          await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
          // (the window opens on 1a and the take-in pauses: stop motion with the contact)
          await page.waitForFunction(() => { const s = window.__olympus.state; return s.stop?.mode === 'stop' && s.mind?.contact?.last && !document.querySelector('.hitcard')?.hidden; }, null, { timeout: 60000 });
          await page.waitForTimeout(300);
          const got = await page.evaluate(() => {
            const box = (q) => { const e = document.querySelector(q); if (!e || e.hidden || e.offsetParent === null) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
            const hc = document.querySelector('.hitcard'), s = window.__olympus.state;
            return { key: hc.dataset.key, text: hc.dataset.text, card: box('.hitcard canvas'), steps: box('.steps') ?? box('.reflexcard'), instinct: box('.instinct'), toasts: box('.toasts'), pick: s.stop.pick, ident: s.mind.contact.last.ident };
          });
          console.log(`      ${w} × ${h} panel ${panel.toUpperCase()}: the card on ${got.key} ('${got.text}'), the pick ${got.pick}, identified ${JSON.stringify(got.ident)}; card ${JSON.stringify(got.card)}, panel ${JSON.stringify(got.steps)}`);
          assert(got.key && got.key === got.pick && got.card && got.steps, JSON.stringify(got));
          for (const n of ['steps', 'instinct']) if (got[n]) assert(!overlaps(got.card, got[n]), `${w} × ${h} panel ${panel}: the card meets ${n}`);
        }
        // (from GO, the house's T bot in the page: the pair's marks on 1a, then the engagement on 2a)
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('play=test-shoothouse&setup=go&tier=tierone&seed=48213&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        const runTo = (stand) => page.evaluate(async (stand) => {
          const O = window.__olympus, { houseBot } = await import('/tests/bots/house.mjs'), { engagedOf } = await import('/src/sim/arms/engage.js');
          const bot = (window.__uiTargetBot ??= houseBot({ mode: 'T' })), R = O.state.armoury.range, key = R.turners.find(t => t.stand === stand).key;
          const done = (s) => (stand === '1a' ? s.armoury.range.shots.filter(x => x.key === key).length >= 2 : engagedOf(s)?.key === key);
          O.pause(true);
          let n = 0;
          for (; n < 20000 && !done(O.state); n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, (me.bot ??= {}))); }
          return { key, n, done: done(O.state) };
        }, stand);
        const frames = () => page.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(res)))));
        const cardNow = () => page.evaluate(() => { const hc = document.querySelector('.hitcard'); return { hidden: hc.hidden, key: hc.dataset.key ?? null, text: hc.dataset.text ?? '', marks: JSON.parse(hc.dataset.marks ?? '[]') }; });
        const pair = await runTo('1a'); await frames();
        const atPair = await cardNow();
        console.log(`      after the pair on 1a (${pair.n} ticks): the card on ${atPair.key} ('${atPair.text}'), ${atPair.marks.length} marks`);
        assert(pair.done && !atPair.hidden && atPair.key === pair.key && atPair.marks.length >= 2 && /PAIR/.test(atPair.text), JSON.stringify({ pair, atPair }));
        const two = await runTo('2a'); await frames();
        const at2a = await cardNow();
        console.log(`      engaging 2a (${two.n} ticks on): the card on ${at2a.key} ('${at2a.text}')`);
        assert(two.done && !at2a.hidden && at2a.key === two.key, JSON.stringify({ two, at2a }));
        await page.evaluate(() => window.__olympus.pause(false));
        // (a man's card is not carried to the next scene: the coach bracketed on test-handling, then test-range launched in the page)
        await game.open('play=test-handling&setup=hot&seed=48213&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.stop?.mode === 'stop', null, { timeout: 60000 });
        const coach = await page.evaluate(() => { const s = window.__olympus.state; return s.actors.list.find(a => a.who && a.id !== s.player.actor).id; });
        await page.evaluate((id) => window.__olympus.act({ act: 'stop', args: { step: `pick=${id}` } }), coach);
        await page.waitForFunction((id) => document.querySelector('.hitcard')?.dataset.key === id && !document.querySelector('.hitcard').hidden, coach, { timeout: 10000 });
        await page.evaluate(() => window.__olympus.newGame({ scenario: 'test-range', seed: 48213 }));
        await page.waitForFunction(() => window.__olympus.state?.armoury?.range?.course === 'kd', null, { timeout: 60000 }).catch(() => null);
        await page.waitForTimeout(800);
        const carried = await page.evaluate(() => { const hc = document.querySelector('.hitcard'); return { hidden: hc.hidden, key: hc.dataset.key ?? null, text: hc.dataset.text ?? '', scene: window.__olympus.state?.armoury?.range?.course ?? null }; });
        console.log(`      the coach (${coach}) bracketed on test-handling, then test-range launched (${carried.scene}): the card ${carried.hidden ? 'closed' : `on ${carried.key} '${carried.text}'`}`);
        assert(carried.hidden, JSON.stringify(carried));
        // (I and C: the figure in the gear worn now, at the instructor's brief, the rifle slung)
        await game.open('play=test-shoothouse&tier=tierone&seed=48213&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        await page.waitForTimeout(500);
        const carry = await page.evaluate(() => { const s = window.__olympus.state; return s.people[s.player.id].kit.carry?.posture ?? null; });
        console.log(`      at the brief the R-7 is carried ${carry}`);
        // (each piece's pixels: the colours the full doll has beyond the same doll drawn without that piece, by the page's own modules)
        const pieces = await page.evaluate(async () => {
          const s = window.__olympus.state, pid = s.player.id, P = s.people[pid], { gearOf } = await import('/src/sim/arms/gear.js'), { dressOf } = await import('/src/art/doll/dress.js'), { doll } = await import('/src/art/doll/doll.js');
          const gear = gearOf(s, pid), hist = (pm) => { const o = {}; for (const v of pm.data) { const k = ((v & 255) << 16) | (v & 0xff00) | ((v >>> 16) & 255); o[k] = (o[k] ?? 0) + 1; } return o; };
          const full = hist(doll({ ...dressOf(gear, { look: P.look, sex: P.sex }) })), out = { gear: { carrier: !!gear.carrier, pistol: gear.pistol?.place ?? null, rifle: gear.rifle?.place ?? null }, full, extra: {} };
          for (const [name, minus] of [['carrier', { carrier: null }], ['holster', { pistol: null, thigh: null }], ['rifle', { rifle: null }]]) {
            const m = hist(doll({ ...dressOf({ ...gear, ...minus }, { look: P.look, sex: P.sex }) })), e = {};
            for (const [c, n] of Object.entries(full)) if (n > (m[c] ?? 0)) e[c] = { full: n, without: m[c] ?? 0 };
            out.extra[name] = e;
          }
          return out;
        });
        assert(pieces.gear.carrier && pieces.gear.pistol === 'holster' && pieces.gear.rifle, JSON.stringify(pieces.gear));
        for (const [key, sel] of [['KeyI', '.pk-doll canvas'], ['KeyC', 'canvas.doll']]) {
          await page.keyboard.press(key);
          await page.waitForSelector(sel, { timeout: 10000 });
          const px = await page.evaluate((q) => { const c = document.querySelector(q), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data, out = {}; for (let i = 0; i < d.length; i += 4) { const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; out[k] = (out[k] ?? 0) + 1; } return { w: c.width, h: c.height, out }; }, sel);
          const shell = px.out[COMBAT_SUIT.shell] ?? 0, visor = px.out[COMBAT_SUIT.visor] ?? 0, utilities = px.out[hex(0x9a, 0x6a, 0x4a)] ?? 0;
          // (the canvas's density against the doll's: the shell's pixels)
          const f = shell / (pieces.full[COMBAT_SUIT.shell] ?? 1), got = {};
          for (const [name, e] of Object.entries(pieces.extra)) {
            const want = Object.values(e).reduce((a, x) => a + (x.full - x.without), 0);
            const seen = Object.entries(e).reduce((a, [c, x]) => a + Math.max(0, (px.out[c] ?? 0) - f * x.without), 0);
            got[name] = { want: Math.round(f * want), seen: Math.round(seen) };
          }
          console.log(`      ${key}: the figure ${px.w} × ${px.h} (${f.toFixed(2)} canvas px a doll px), the suit's shell ${shell} px, the visor ${visor} px; beyond the doll without each: ${Object.entries(got).map(([n, x]) => `${n} ${x.seen} of ${x.want} px`).join(', ')}`);
          assert(shell > 150 && visor > 20, JSON.stringify({ shell, visor, utilities }));
          for (const [name, x] of Object.entries(got)) assert(x.want > 0 && x.seen >= 0.8 * x.want, `${key}: the ${name} ${JSON.stringify(x)}`);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
        assert(!errors.length, errors.join(' | '));
      }, { viewport: { width: 1600, height: 900 }, navigate: false });
    },
  },
];
