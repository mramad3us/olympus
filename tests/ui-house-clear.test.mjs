// OLYMPUS tests: the plates stay off the room, in the page (the build sheet v0.0.20 §1 item 14; feel FL-8).
//
// The private's lane on 48213 by the keys bot in the page; at the pause of each of your contacts (each room and the hall), at
// 1024 × 768, 1600 × 900 and 1920 × 1080, the contact's plate and the shot's plaque (.plaque.contact, .plaque.reticle) are read
// against every figure's and stand's box (projected from the sim through __olympus.project onto the page by the picture's place and
// scale, report.keepOff's ox, oy and k, the men 0.7 m wide from foot to head,
// the stands 0.6 m) and the current room's floor: no overlap (each printed in px²), unless slid to the reserved rect. While the lane
// runs the lane timer is its strip (data-strip). Heavy: a browser.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';

export default [
  {
    name: 'at every contact of the private\'s lane on 48213, at 1024 × 768, 1600 × 900 and 1920 × 1080, no plate over a figure, a stand or the current room\'s floor, and the lane timer a strip while the lane runs',
    heavy: true,
    timeoutMs: 900_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [];
      let worst = 0, n = 0, strips = 0;
      await withGame(async (page, errors, game) => {
        for (const [w, h] of [[1024, 768], [1600, 900], [1920, 1080]]) {
          await page.setViewportSize({ width: w, height: h });
          await game.open('play=test-shoothouse&setup=go&tier=private&seed=48213&nostore=1');
          await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
          await page.evaluate(async () => { window.__houseBot = (await import('/tests/bots/house.mjs')).houseBot({ mode: 'keys' }); window.__olympus.pause(true); });
          for (let leg = 0; leg < 4; leg++) {
            const at = await page.evaluate((leg) => {
              const O = window.__olympus, bot = window.__houseBot;
              let seen = null;
              for (let i = 0; i < 6000; i++) {
                const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor), H = s.armoury.range.house;
                if (s.armoury.range.end) return null;
                const c = H.rooms.concat([H.hall])[leg]?.contacts.find(x => x.by === 'me' && x.pauseAtMs !== null);
                if (H.cur === leg && c && s.stop?.mode === 'stop') { seen = c; break; }
                if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, (me.bot ??= {})));
              }
              return seen ? { stand: seen.stand } : null;
            }, leg);
            if (!at) continue;
            await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
            const m = await page.evaluate(async () => {
              const { WHEEL_S4 } = await import('/src/data/places/wheel.js');
              const O = window.__olympus, s = O.state, { ox, oy, k } = window.__report.keepOff;
              const toPage = (p) => ({ x: ox + p.x * k, y: oy + p.y * k }), boxes = [];
              for (const a of s.actors.list) { if (!a.who) continue; const f = toPage(O.project(a.x, 0, a.z)), hd = toPage(O.project(a.x, 1.85, a.z)), ppm = 16 * k; boxes.push({ x: f.x - 0.35 * ppm, y: hd.y, w: 0.7 * ppm, h: f.y - hd.y, who: a.who }); }
              for (const T of s.armoury.range.turners) { const f = toPage(O.project(T.x, 0, T.z)), hd = toPage(O.project(T.x, 1.8, T.z)), ppm = 16 * k; boxes.push({ x: f.x - 0.3 * ppm, y: hd.y, w: 0.6 * ppm, h: f.y - hd.y, who: T.stand }); }
              { const H = s.armoury.range.house, L = [...H.rooms, H.hall][H.cur], rr = WHEEL_S4.rooms.find(r => r.id === L?.room)?.rect; if (rr) { const a = toPage(O.project(rr[0], 0, rr[1])), b = toPage(O.project(rr[2], 0, rr[3])); boxes.push({ x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y, who: 'room' }); } }
              const area = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
              const plates = [...document.querySelectorAll('.plaque.contact, .plaque.reticle')].filter(e => !e.hidden).map(e => { const r = e.getBoundingClientRect(); return { cls: e.className, slid: e.dataset.slid ?? null, r: { x: r.left, y: r.top, w: r.width, h: r.height } }; });
              return { plates: plates.map(p => ({ cls: p.cls, slid: p.slid, over: boxes.map(b => [b.who, Math.round(area(p.r, b))]).filter(([, a]) => a > 0) })), strip: document.querySelector('.timer')?.dataset.strip ?? '' };
            });
            for (const p of m.plates) { n++; if (p.slid !== 'reserved') worst = Math.max(worst, ...p.over.map(([, a]) => a), 0); }
            if (m.strip) strips++;
            rows.push(`${w} × ${h} leg ${leg} (${at.stand}): ${m.plates.map(p => `${p.cls.replace('plaque ', '')} ${p.slid ?? 'not slid'} over ${JSON.stringify(p.over)}`).join('; ') || 'no plate'}; the strip '${m.strip}'`);
          }
        }
        for (const r of rows) console.log(`      ${r}`);
        console.log(`      ${n} plates read, the worst overlap ${worst} px²; ${strips} strips`);
        assert(n > 0 && worst === 0 && strips > 0, JSON.stringify({ n, worst, strips }));
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
];
