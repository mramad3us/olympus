// OLYMPUS tests: "The window and the canopy" in the page, F180's and F188's page halves (the build sheet v0.0.28 §6 B, §8).
//
// The scene from its URL (?play=test-armoury&tier=private): R at the window hands the card over (the act under way, then the armourer's
// fetch); the radio box's standing line carries the press words after the speaker's (handling.js standingCmd, armouryPressOf); R held opens
// the actions card on the window's rows; the yellow ring drawn where the standing command wants you (the stage's station pixels); at the
// canopy (&setup=canopy at its own hour) R on your table starts the clean and its splash shows; from the turn-in (&setup=turnin) the barrel,
// the window and the end card, its title the scene's, its lines the day's, "Again as" the other sheets. No page error, console error or failed
// request; the frame times printed. The review of v0.0.28 B's: the standing line shown whole (its element's scrollHeight within its
// clientHeight, the radio box's two lines) at 1024 × 768, 1280 × 720 and 1920 × 1080 at the window, and at 1024 × 768 off the table's ring
// and the barrel's; and C's: on the apron (the window, the barrel) the cleaning canopy's roof lifted (view.js seeFrame, the report's see.lift),
// so the barrels and the rank are drawn whole.
import { assert, fmt } from './helpers.mjs';
import { withGame, frameMs } from './browser.mjs';

const tap = async (page, code) => { await page.keyboard.down(code); await page.waitForTimeout(60); await page.keyboard.up(code); };
const nowOf = (page) => page.evaluate(async () => { const { armouryNow } = await import('/src/sim/scenarios/armoury-day.js'); const N = armouryNow(window.__olympus.state); return { cmd: N.cmd, next: N.next, busy: N.busy, at: N.at, acts: N.acts, doing: N.doing, spot: N.spot, ring: N.ring, end: N.end }; });
const until = async (page, pred, ms = 60_000) => { const t0 = Date.now(); for (;;) { const N = await nowOf(page); if (pred(N)) return N; if (Date.now() - t0 > ms) throw new Error(`until: timed out at ${JSON.stringify(N)}`); await page.waitForTimeout(200); } };
// (the standing line's element in the radio box: its text and whether it shows whole)
const standingOf = (page) => page.evaluate(() => { const e = document.querySelector('.radio.voices .voice.standing .said'); return e ? { text: e.textContent, sh: e.scrollHeight, ch: e.clientHeight, whole: e.scrollHeight <= e.clientHeight + 1 } : null; });
const sizes = Object.freeze([[1024, 768], [1280, 720], [1920, 1080]]);
const toSpot = (page) => page.evaluate(async () => { const { armouryNow } = await import('/src/sim/scenarios/armoury-day.js'); const s = window.__olympus.state, st = armouryNow(s).spot, me = s.actors.list.find(a => a.who === s.player.id); if (st) { me.x = st.x; me.z = st.z; me.face = st.face ?? me.face; } return st; });

export default [
  {
    name: 'ui-armoury: the window in the page: R hands the card over, the radio box\'s standing line carries the press words, R held lists the window\'s rows, the ring drawn; no page error; the frame times',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.arm, null, { timeout: 90_000 });
        await until(page, N => N.cmd === 'card' && !N.next);
        const radio0 = await page.evaluate(() => window.__report.hud?.radio ?? null);
        await tap(page, 'KeyR');
        const after = await until(page, N => N.doing === 'card' || N.busy || N.cmd !== 'card', 5000);
        await until(page, N => N.cmd === 'window' && !N.next && !N.busy);
        await page.waitForTimeout(800);
        const radio = await page.evaluate(() => JSON.stringify(window.__report.hud?.radio ?? null));
        // (the window's standing line whole at three sizes; the canopy's roof lifted at the window)
        const lift = await page.evaluate(() => window.__report.view?.see?.lift ?? null), whole = [];
        for (const [w, h] of sizes) { await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(500); whole.push({ size: `${w}×${h}`, ...(await standingOf(page)) }); }
        await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(300);
        await page.keyboard.down('KeyR'); await page.waitForTimeout(450); await page.keyboard.up('KeyR');
        await page.waitForTimeout(300);
        const card = await page.evaluate(() => !!document.querySelector('.glass.actions'));
        const menu = await page.evaluate(async () => { const { handMenu } = await import('/src/sim/places/hand.js'); const m = handMenu(window.__olympus.state); return m ? { title: m.title, rows: m.rows.map(r => r.words) } : null; });
        await tap(page, 'Escape');
        // (the ring: walked off the window, the stage draws the station's pixels)
        await page.evaluate(() => { const s = window.__olympus.state, me = s.actors.list.find(a => a.who === s.player.id); me.x += 3; });
        await page.waitForTimeout(600);
        const ring = await page.evaluate(() => { const find = (o, d = 0) => { if (!o || typeof o !== 'object' || d > 4) return null; if (Number.isFinite(o.station) && 'anchors' in o) return o.station; for (const v of Object.values(o)) { const r = find(v, d + 1); if (r !== null) return r; } return null; }; return find(window.__report.view); });
        const f = await frameMs(page);
        console.log(`      R at "Weapons card.": ${JSON.stringify(after)}; the radio box at the window: ${radio.slice(0, 220)}`);
        console.log(`      R held: the card ${card ? 'open' : 'NOT OPEN'}, ${JSON.stringify(menu)}; the ring off the window ${ring} pixels; frames p50 ${fmt(f.medianMs, 1)} ms, p95 ${fmt(f.p95Ms, 1)} ms; before ${JSON.stringify(radio0)?.slice(0, 80)}`);
        console.log(`      the window's standing line: ${whole.map(x => `${x.size} ${x.sh}/${x.ch} px ${x.whole ? 'whole' : 'CLIPPED'}`).join(', ')} ("${whole[0]?.text}"); the canopy's roof at the window lifted ${lift}`);
        assert(whole.length === sizes.length && whole.every(x => x.whole) && lift >= 0.99, JSON.stringify({ whole, lift }));
        assert(/· R: Read the serial back/.test(radio) && card && menu?.title === 'WINDOW 1' && menu.rows.length === 3 && ring > 0, JSON.stringify({ radio, card, menu, ring }));
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-armoury&seed=48213&tier=private&nostore=1', timeoutMs: 150_000 });
    },
  },
  {
    name: 'ui-armoury: the canopy\'s clean starts from R at your table and its splash shows; the turn-in to the end card (its title, the day\'s lines, Again as the other sheets); no page error',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.arm, null, { timeout: 90_000 });
        await until(page, N => N.cmd === 'clean' && !N.next);
        // (off the table's ring: the walk and the key, whole at 1024 × 768)
        await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
        const off = await standingOf(page);
        await page.setViewportSize({ width: 1280, height: 720 });
        console.log(`      off the table's ring at 1024×768: ${off?.sh}/${off?.ch} px ${off?.whole ? 'whole' : 'CLIPPED'} ("${off?.text}")`);
        assert(off?.whole, JSON.stringify(off));
        await toSpot(page); await page.waitForTimeout(300);
        await tap(page, 'KeyR');
        const splash = await page.waitForFunction(() => window.__report.frame?.splash || window.__olympus.state?.time?.doing?.activity === 'clean-rifle', null, { timeout: 10_000 }).then(() => true, () => false);
        const doing = await page.evaluate(() => window.__olympus.state?.time?.doing?.activity ?? window.__report.frame?.splash ?? null);
        // (the splash's vignette: the mat on your table (C's 'clean' branch, found by the table's spot on the activity's record), and what the
        // splash uploaded once it was up: the pieces stood at the brief, so nothing new (F188's page half))
        const up0 = await page.evaluate(() => JSON.stringify(window.__report.uploads ?? null));
        await page.waitForTimeout(1500);
        const vig = await page.evaluate(() => window.__report.view?.vignette ?? null), up1 = await page.evaluate(() => JSON.stringify(window.__report.uploads ?? null));
        console.log(`      R at your table: the clean ${splash ? `under way (${doing})` : 'NOT STARTED'}; the vignette ${JSON.stringify(vig)}; uploads ${up0} → ${up1}`);
        assert(splash && vig?.name === 'clean' && vig.fixture === 'f:canopy:t3' && vig.items > 0, JSON.stringify({ splash, vig }));
        // (nothing uploaded once the splash is up: its pieces stood at the brief (F188's page half))
        const u0 = JSON.parse(up0), u1 = JSON.parse(up1);
        assert(!u0 || !u1 || u1.n === u0.n, JSON.stringify({ u0, u1 }));
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-armoury&seed=48213&tier=private&setup=canopy&hour=9.43&nostore=1', timeoutMs: 150_000 });
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.arm, null, { timeout: 90_000 });
        const atBarrel = [];
        for (const key of ['barrel', 'handIn', 'signIn']) {
          await until(page, N => N.cmd === key && !N.next && !N.busy, 90_000);
          if (key === 'barrel') {
            // (off the barrel's ring at 1024 × 768: the line whole; on it, the canopy's roof lifted over the barrels)
            await page.evaluate(() => { const s = window.__olympus.state, me = s.actors.list.find(a => a.who === s.player.id); me.x -= 3; });
            await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
            atBarrel.push(await standingOf(page));
            await page.setViewportSize({ width: 1280, height: 720 });
          }
          await toSpot(page); await page.waitForTimeout(key === 'barrel' ? 1000 : 300);
          if (key === 'barrel') atBarrel.push(await page.evaluate(() => window.__report.view?.see?.lift ?? null));
          await tap(page, 'KeyR');
          await page.waitForTimeout(400);
        }
        console.log(`      off the barrel's ring at 1024×768: ${atBarrel[0]?.sh}/${atBarrel[0]?.ch} px ${atBarrel[0]?.whole ? 'whole' : 'CLIPPED'} ("${atBarrel[0]?.text}"); on it the canopy's roof lifted ${atBarrel[1]}`);
        assert(atBarrel[0]?.whole && atBarrel[1] >= 0.99, JSON.stringify(atBarrel));
        await page.waitForFunction(() => !!document.querySelector('.glass.end'), null, { timeout: 60_000 });
        const card = await page.evaluate(() => ({ title: document.querySelector('.glass.end h3')?.textContent ?? '', said: [...document.querySelectorAll('.glass.end .said')].map(e => e.textContent), again: [...document.querySelectorAll('.glass.end .again-as')].length }));
        console.log(`      the end card: "${card.title}"; ${card.said.length} lines: ${card.said.join(' / ')}; Again as ${card.again} sheets`);
        assert(/The window and the canopy/.test(card.title) && card.said.length >= 2 && /racked at/.test(card.said[0]) && card.again >= 4, JSON.stringify(card));
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-armoury&seed=48213&tier=private&setup=turnin&nostore=1', timeoutMs: 150_000 });
    },
  },
];
