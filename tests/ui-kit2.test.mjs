// OLYMPUS tests: the kit's second slice in the page (the build sheet 0.0.19 §6 K-face, kit2 §6 test 39; src/ui/cards/loadout.js, src/render/devices.js), heavy: a browser.
//
// The loadout screen at 1024 × 768 with D2's issue (the G-9P, the G-13P, the BC-1) and its eight presets: no two of its controls
// meet and every one is inside the window (the no-overlap rule; the sheet's §4 item 5: PRESET_ORDER grew), 5 is Frag, the line
// "Your #2: P-12, issued as yours" a line and not a control (v0.0.20: his P-12 standard issue, the user's answer of 2026-11-16,
// "#2 has to have a sidearm"; v0.0.19's row "Your #2: P-12 ⇄ none" turned it on and off), and the picker says "Kit: Frag ▸". The devices layer on the
// stage: a G-9P thrown into room 1, its burst and the instructor's read drawn on the frames, the overlay coming in and going out
// over its 200 ms, 2 s and 400 ms, nothing written while the clock stands; a BC-1 on room 2's hinges with its tube. And the frag
// lane from the picker to the card, the read's overlay fading in and out (K-sim's lane: tests/bots/kit.mjs houseKitBot({ use:
// 'frag' })). No page errors, console errors or failed requests. Fails without the screen's rows, the layer or the view's wiring.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { TWO_P12_DEFAULT } from '../src/sim/arms/loadout.js';

const overlaps = (a, b) => a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
// (the picker's Kit ▸ opened from the title's Tests menu)
async function openKit(page, game) {
  await game.open('nostore=1');
  await page.waitForSelector('#title .item.tests');
  await page.click('#title .item.tests');
  await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.startsWith('Stack and clear')).click());
  await page.waitForSelector('#title .item.kitpick');
  await page.click('#title .item.kitpick');
  await page.waitForSelector('#title .sheet.loadout');
}
// (the read's overlay sampled on the stage's frames: one tick a sample, two frames drawn between)
const sampleOverlay = (page, n) => page.evaluate(async (n) => {
  const O = window.__olympus, frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))), out = [];
  for (let i = 0; i < n; i++) { O.step(1); await frame(); const d = window.__report.view.devices; out.push({ ms: O.state.clock.ms, readPx: d?.readPx ?? 0, bodies: d?.bodies ?? 0, levers: d?.levers ?? 0, puff: d?.puff ?? 0, charges: d?.charges ?? 0, tube: d?.tube ?? 0, writes: d?.writes ?? 0 }); }
  return out;
}, n);

export default [
  {
    name: 'the loadout screen at 1024 × 768 with D2\'s issue and presets (the build sheet 0.0.19 §4 item 5): the G-9P, the G-13P and the BC-1 in the issue, eight presets, no two controls meeting and all inside the window; 5 is Frag; "Your #2: P-12, issued as yours" a line, not a control (v0.0.20), inside the window and meeting nothing, and the picker says "Kit: Frag ▸" with the plain code; no page errors',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [];
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await openKit(page, game);
        const sheet = () => page.evaluate(() => {
          const s = document.querySelector('#title .sheet.loadout'), bs = [...s.querySelectorAll('button')].filter(b => b.offsetParent !== null);
          const rect = (b) => { const r = b.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
          return { code: s.dataset.code, issues: [...s.querySelectorAll('button.issue')].map(b => `${b.dataset.issue}: ${b.innerText.replace(/\s+/g, ' ')}`), presets: [...s.querySelectorAll('button.preset')].map(b => b.innerText.replace(/\s+/g, ' ')), two: s.querySelector('.two')?.innerText.replace(/\s+/g, ' ') ?? null, twoTag: s.querySelector('.two')?.tagName ?? null, twoButtons: s.querySelectorAll('button.two').length,
            rects: [...bs.map(b => ({ name: b.dataset.issue ?? b.dataset.preset ?? (b.dataset.face ? `${b.dataset.face}${b.dataset.i}` : b.className), ...rect(b) })), ...['.mass', '.code', '.why', 'p.two'].map(q => s.querySelector(q)).filter(e => e && e.getBoundingClientRect().height).map(e => ({ name: e.className, ...rect(e) }))], win: { w: innerWidth, h: innerHeight } };
        });
        const a = await sheet();
        const out = a.rects.filter(r => r.x < 0 || r.y < 0 || r.x + r.w > a.win.w + 1 || r.y + r.h > a.win.h + 1).map(r => r.name), clash = [];
        for (let i = 0; i < a.rects.length; i++) for (let j = i + 1; j < a.rects.length; j++) if (overlaps(a.rects[i], a.rects[j])) clash.push(`${a.rects[i].name} × ${a.rects[j].name}`);
        rows.push(`1024 × 768: ${a.rects.length} controls, outside ${out.length ? out.join(', ') : 'none'}, meeting ${clash.length ? clash.join(', ') : 'none'}; the issue ${a.issues.join(' | ')}; the presets ${a.presets.join(' · ')}; '${a.two}'`);
        assert(['g9p', 'g13p', 'bc1+fd1'].every(p => a.issues.some(x => x.startsWith(`${p}:`))) && a.presets.length === 8 && !out.length && !clash.length && a.two === 'Your #2: P-12, issued as yours' && a.twoTag === 'P' && a.twoButtons === 0, JSON.stringify({ out, clash, issues: a.issues, presets: a.presets, two: a.two, tag: a.twoTag }));
        // (5 the Frag preset, then the picker's word: the plain code, his P-12 in it)
        await page.focus('#title .sheet.loadout .item.kitup');
        await page.keyboard.press('Digit5');
        const frag = (await sheet()).code;
        await page.click('#title .sheet.loadout .item.kitup');
        await page.waitForSelector('#title .item.kitpick');
        const pick = await page.evaluate(() => ({ text: document.querySelector('#title .item.kitpick').textContent, code: document.querySelector('#title .item.kitpick').dataset.code }));
        rows.push(`5: ${frag}; the picker '${pick.text.trim()}' (${pick.code})`);
        assert(frag === 'frag' && pick.code === 'frag' && /Kit: Frag ▸/.test(pick.text) && !/#2/.test(pick.text), JSON.stringify(rows));
        for (const r of rows) console.log(`      ${r}`);
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
  {
    name: 'the devices layer on the stage (kit2 §2.10): a G-9P thrown into room 1 drawn blue in flight with its lever, its burst\'s pop and puff, the instructor\'s read coming in over 200 ms, held, going out over 400 ms on the frames, nothing written with the clock held; a BC-1 on room 2\'s hinges with its tube lit at Fire; no page errors',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [];
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('play=test-shoothouse&setup=go&tier=sgt&seed=48213&loadout=mixed&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        // (the G-9P on its flight from the hall into room 1, as the throw beat leaves it (throw.js's closed form), its fuse 2 s on)
        const t0 = await page.evaluate(async () => {
          const O = window.__olympus, s = O.state, { move } = await import('/src/sim/arms/kit.js'), { setSt } = await import('/src/sim/arms/devices.js');
          O.pause(true);
          // (out of stop motion, so the clock runs while you stand at GO)
          O.step(1, { act: [{ act: 'stop', args: { step: 'leave', tempo: 'normal' } }] }); O.step(2);
          const me = s.player.id, id = Object.keys(s.items).find(k => s.items[k].model === 'g9p'), t0 = s.clock.ms;
          move(s, id, { ground: { area: s.places.live.area, x: 29.1, z: 8.6 } }); setSt(s, id, 'live');
          Object.assign(s.items[id], { fuseAtMs: t0 + 2000, leverAtMs: t0, byId: me, flight: { x0: 29.0, y0: 1.4, z0: 13.0, vx: 0, vy: 4.755, vz: -3.5, g: 9.8, fromMs: t0, landMs: t0 + 1200, x1: 29.0, z1: 8.8, door: 'o:w4:r1' } });
          window.__kit2 = { id, me };
          return t0;
        });
        const flight = await sampleOverlay(page, 30);
        // (the burst at its fuse through the sim's own writer, and the read as practice.js leaves it on the record)
        await page.evaluate(async () => {
          const O = window.__olympus, s = O.state, { burst } = await import('/src/sim/combat/burst.js'), { id, me } = window.__kit2;
          const b = burst(s, null, { id, model: 'g9p', x: 29.1, z: 8.6, atMs: s.clock.ms, byId: me, called: true }), rec = s.armoury.range.house.bursts.at(-1);
          rec.read ??= { model: 'g9p', as: 'g9', x: rec.x, z: rec.z, atMs: rec.atMs, room: 'w4.r1', kPaRoom: 0.4, stands: { 'turner:1': { stand: '1a', face: 'threat', rM: 2.3, lam: 31, n: 4, kPa: 48, out: 'down', stunMs: 0 }, 'turner:2': { stand: '1b', face: 'threat', rM: 2.3, lam: 31, n: 3, kPa: 48, out: 'down', stunMs: 0 } }, stack: { me: { rM: 3.8, lam: 0, n: 0, kPa: 17.4 }, two: { rM: 4.4, lam: 0, n: 0, kPa: 13.1 } }, noncombatants: [], fragged: false, concussed: [], exposed: null, uncookedMs: null };
          return !!b;
        });
        const read = await sampleOverlay(page, 60);
        // (the clock held: frames drawn, nothing written)
        const held = await page.evaluate(async () => { const w0 = window.__report.view.devices?.writes ?? 0; for (let i = 0; i < 10; i++) await new Promise(r => requestAnimationFrame(r)); return { w0, w1: window.__report.view.devices?.writes ?? 0 }; });
        // (the BC-1 on room 2's hinges, primed, fired: the tube lit to the burst)
        await page.evaluate(async () => {
          const O = window.__olympus, s = O.state, { move } = await import('/src/sim/arms/kit.js'), { setSt } = await import('/src/sim/arms/devices.js'), { me } = window.__kit2;
          const c = Object.keys(s.items).find(k => s.items[k].model === 'bc1');
          move(s, c, { ground: { area: s.places.live.area, x: 20.15, z: 14.4 } }); setSt(s, c, 'primed');
          Object.assign(s.items[c], { door: 'o:w4:r2', side: 'hinge', byId: me, fuseAtMs: s.clock.ms + 1500 });
        });
        const cut = await sampleOverlay(page, 10);
        const full = Math.max(...read.map(x => x.readPx)), drop = Math.max(0, ...read.slice(1).map((x, i) => read[i].readPx - x.readPx)), rise = Math.max(0, ...read.slice(1).map((x, i) => x.readPx - read[i].readPx));
        const seq = read.filter((x, i) => i % 5 === 0).map(x => `${x.ms - t0 - 1500}:${x.readPx}`).join(' ');
        rows.push(`in flight: bodies ${Math.max(...flight.map(x => x.bodies))} px, the lever ${Math.max(...flight.map(x => x.levers))} px; the read by ms after the burst ${seq}; full ${full}, the most a frame gained ${rise} and lost ${drop}; the puff ${Math.max(...read.map(x => x.puff))} px; the clock held: writes ${held.w0} then ${held.w1}; the BC-1: charges ${Math.max(...cut.map(x => x.charges))}, the tube ${Math.max(...cut.map(x => x.tube))} px`);
        assert(Math.max(...flight.map(x => x.bodies)) > 0 && Math.max(...flight.map(x => x.levers)) > 0 && full > 0 && read.at(-1).readPx === 0 && rise <= full / 3 && drop <= full / 3 && held.w1 === held.w0 && Math.max(...cut.map(x => x.tube)) > 0, JSON.stringify(rows));
        await page.evaluate(() => window.__olympus.pause(false));
        for (const r of rows) console.log(`      ${r}`);
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
  {
    name: 'the frag lane from the picker to the card (kit2 §6 test 39): "Kit: Frag" on the sergeant, K-sim\'s frag bot at room 1 (tests/bots/kit.mjs houseKitBot({ use: \'frag\' })), the read\'s overlay fading in and out on the stage\'s frames, the lane to its card; no page errors',
    heavy: true,
    timeoutMs: 600_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [];
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        // (the picker's seed is a new one each time, and a frag goes only into a room the brief names hostiles only: about half the
        // seeds put a no-shoot in room 1 and every room "unknown", so no frag is thrown, rightly; such a draw is played again from the
        // title, up to PICKS times (the integration of v0.0.19: the test failed one run in two on the seed alone))
        const PICKS = 12, seeds = [];
        for (let k = 0; k < PICKS; k++) {
          await openKit(page, game);
          await page.focus('#title .sheet.loadout .item.kitup');
          await page.keyboard.press('Digit5');
          await page.click('#title .sheet.loadout .item.kitup');
          await page.waitForSelector('#title .item.kitpick');
          await page.evaluate(() => [...document.querySelectorAll('#title .item.sheetpick')].find(b => b.dataset.tier === 'sgt').click());
          await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
          const p = await page.evaluate(() => { const H = window.__olympus.state.armoury.range.house; return { seed: window.__olympus.state.meta.seed, hostiles: Object.values(H.intel ?? {}).includes('hostiles') }; });
          seeds.push(`${p.seed}${p.hostiles ? '' : ' (no room hostiles only)'}`);
          if (p.hostiles) break;
        }
        rows.push(`the picker's seeds: ${seeds.join(', ')}`);
        const lane = await page.evaluate(async () => {
          const O = window.__olympus, frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const { houseKitBot } = await import('/tests/bots/kit.mjs'), bot = houseKitBot({ use: 'frag' }), H = () => O.state.armoury.range.house, px = [];
          O.pause(true);
          let read = null;
          for (let n = 0; n < 400000 && !O.scene?.ended; n++) {
            const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor);
            if (s.skip?.engine === 'ff') O.sim.ffTick(s); else O.step(1, bot(s, me, (me.bot ??= {})));
            const b = (H().bursts ?? []).find(x => x.read);
            if (b && !read) read = b.atMs;
            // (the read's 3 s on the frames: a sample a tick)
            if (read !== null && O.state.clock.ms - read <= 3000) { await frame(); px.push(window.__report.view.devices?.readPx ?? 0); }
          }
          O.pause(false);
          return { ended: !!O.scene?.ended, loadout: H().loadout, read, px, end: H().end?.why ?? null };
        });
        const full = Math.max(0, ...lane.px), first = lane.px.findIndex(x => x > 0), last = lane.px.length - 1 - [...lane.px].reverse().findIndex(x => x > 0);
        rows.push(`the lane on '${lane.loadout}': a read at ${lane.read ?? 'none'} ms; its overlay over ${lane.px.length} ticks: full ${full}, first drawn at tick ${first}, last at ${last}, ${lane.px.at(-1) ?? '-'} at the end; the lane ${lane.end} (${lane.ended ? 'the card' : 'NOT the card'})`);
        for (const r of rows) console.log(`      ${r}`);
        assert(lane.loadout === 'frag' && lane.read !== null && full > 0 && lane.px.at(-1) === 0 && first >= 1 && lane.ended, JSON.stringify(rows));
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
  // (the review of v0.0.19's K, finding 5: eight presets made Kit up 21 ArrowDowns from the left face, past ui-loadout's walk of 20)
  {
    name: 'the presets\' row is one stop for the arrows: from the last issue one ArrowDown reaches the row and one more Kit up (v0.0.20: the #2\'s P-12 a line, no longer a stop between them); ArrowRight and ArrowLeft move along the eight; ArrowUp from Kit up goes back to the row and from the row to the issue (the review of v0.0.19\'s K: Kit up 21 ArrowDowns away)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [];
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await openKit(page, game);
        const focus = () => page.evaluate(() => { const n = document.activeElement; return n?.dataset?.issue ? `issue:${n.dataset.issue}` : n?.dataset?.preset ? `preset:${n.dataset.preset}` : n?.dataset?.face ? `${n.dataset.face}${n.dataset.i}` : n?.classList?.contains('kitup') ? 'kitup' : n?.classList?.contains('two') ? 'two' : n?.tagName ?? null; });
        const last = await page.evaluate(() => [...document.querySelectorAll('#title .sheet.loadout button.issue')].at(-1).dataset.issue);
        await page.focus(`#title .sheet.loadout button.issue[data-issue="${last}"]`);
        const walk = [];
        for (const k of ['ArrowDown', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowUp']) { await page.keyboard.press(k); walk.push(`${k.replace('Arrow', '')} ${await focus()}`); }
        // (and from the left face to Kit up, ui-loadout's walk)
        await page.focus('#title .sheet.loadout button.place[data-face="left"][data-i="0"]');
        let downs = 0;
        while ((await focus()) !== 'kitup' && downs < 30) { await page.keyboard.press('ArrowDown'); downs++; }
        rows.push(`from issue:${last}: ${walk.join(' → ')}; left0 to Kit up ${downs} ArrowDowns`);
        for (const r of rows) console.log(`      ${r}`);
        const w = walk.map(x => x.split(' ')[1]);
        assert(w.join() === `preset:standard,preset:flash,preset:breach,preset:flash,kitup,preset:mixed,issue:${last}` && downs <= 15, JSON.stringify(rows));
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
];
