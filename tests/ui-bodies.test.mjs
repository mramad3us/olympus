// OLYMPUS tests: the bodies as the page draws them in the shoot house (the rework's stage R2; VIEWS §3.10.1). Heavy, a browser file.
//
// The user, scoring v0.0.12 (2026-11-11): "saying that the walking about is goofy is an understatement", and the stack read as
// one blob (VIEWS §7.4's v0.0.12 note). In the page at 16 px/m (1280 × 720, the picture 640 × 360 at twice its size):
//   - one person, one outline: at GO on room 1's stack, you and your #2 are two people's parts in the scene pass's IDs (each
//     card its own, src/render/figures.js aPartK), and on every picture row where the two touch the post pass inks the pixel
//     between them (src/render/post.js isPeople); the picture is saved for a look (.run/rework2/r2/shots/);
//   - nothing undrawn: the lane run by T a tick a frame from GO, your #2 drawn walking, every frame draws every figure from its
//     own band, a twin's or a sibling's (the stance pool painted before GO: view.js prepareOwn), never idle0 in a band's place
//     or not at all (view.stats.deferred: figures.js's deferred and fallback), with the frame times printed.
import { assert, fmt, root } from './helpers.mjs';
import { withGame, BROWSER_TEST_PORT } from './browser.mjs';
import { INK } from '../src/art/palette.js';
import fs from 'node:fs';
import path from 'node:path';

const QUERY = 'play=test-shoothouse&setup=go&tier=tierone&seed=48213&nostore=1';
const SHOTS = path.join(root, '.run', 'rework2', 'r2', 'shots');

export default [
  {
    name: 'one person, one outline (VIEWS §3.10.1): stacked at room 1 at GO, you and your #2 are two parts in the IDs, and every picture row where the two touch is inked between them (v0.0.12: one part for everyone, one blob)',
    heavy: true,
    timeoutMs: 180_000,
    async fn() {
      await withGame(async (page) => {
        await page.waitForFunction(() => window.__ready && window.__olympus.state.stop?.phase === 'choose', null, { timeout: 60000 });
        await page.evaluate(() => new Promise(r => { let n = 0; const f = () => (++n < 30 ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); }));
        const r = await page.evaluate((ink) => {
          const O = window.__olympus, s = O.state, H = s.armoury.range.house, me = s.actors.list.find(a => a.who === s.player.id), two = s.actors.list.find(a => a.who === H.twoPid);
          const a = O.project(me.x, 0, me.z), b = O.project(two.x, 0, two.z);
          const x0 = Math.floor(Math.min(a.x, b.x)) - 14, x1 = Math.ceil(Math.max(a.x, b.x)) + 14, y0 = Math.floor(Math.min(a.y, b.y)) - 34, y1 = Math.ceil(Math.max(a.y, b.y)) + 4;
          const px = O.pixels(x0, y0, x1, y1);
          const people = (id) => (id & 0xffff) === 0xa5a5 && (id >> 16) >= 0xa5 && (id >> 16) < 0xa5 + 7;
          const parts = new Set(), rows = { touch: 0, inked: 0, bad: [] };
          for (let y = 0; y < px.ids.length; y++) {
            const row = px.ids[y];
            for (const id of row) if (people(id)) parts.add(id >> 16);
            let touched = false, inked = false;
            for (let x = 1; x < row.length; x++) {
              const l = row[x - 1], rr = row[x];
              if (!people(l) || !people(rr) || l === rr) continue;
              touched = true;
              // (the higher part's pixel is the one inked: its colour the post pass's ink, the palette's INK, not the suit's
              // own darkest shade, 0x14161d in the black combat suit, which v0.0.13's painted outline gave there)
              const xi = (rr >> 16) > (l >> 16) ? x : x - 1, c = px.picture[y][xi];
              if (((c[0] << 16) | (c[1] << 8) | c[2]) === ink) inked = true;
            }
            if (touched) { rows.touch++; if (inked) rows.inked++; else rows.bad.push(y0 + y); }
          }
          return { me: [me.x, me.z], two: [two.x, two.z], a, b, rect: [x0, y0, x1, y1], parts: [...parts].map(p => p.toString(16)), rows, size: [px.w, px.h] };
        }, INK);
        fs.mkdirSync(SHOTS, { recursive: true });
        await page.screenshot({ path: path.join(SHOTS, 'stack-go.png') });
        const crop = { x: Math.max(0, r.rect[0] * 2 - 40), y: Math.max(0, r.rect[1] * 2 - 40), width: (r.rect[2] - r.rect[0]) * 2 + 80, height: (r.rect[3] - r.rect[1]) * 2 + 80 };
        await page.screenshot({ path: path.join(SHOTS, 'stack-go-crop.png'), clip: crop });
        console.log(`      you at ${r.me.map(v => fmt(v, 2)).join(', ')}, your #2 at ${r.two.map(v => fmt(v, 2)).join(', ')}: picture ${r.size.join(' × ')}, the stack's rectangle ${r.rect.join(', ')}`);
        console.log(`      people's parts there: ${r.parts.join(', ')} (high bytes); rows where the two touch ${r.rows.touch}, inked between (the ink ${INK.toString(16)}) ${r.rows.inked}${r.rows.bad.length ? `, not inked at ${r.rows.bad.join(', ')}` : ''}; shots in ${path.relative(root, SHOTS)}`);
        assert(r.parts.length >= 2 && r.rows.touch > 0 && r.rows.inked === r.rows.touch, JSON.stringify(r));
      }, { port: BROWSER_TEST_PORT, query: QUERY, viewport: { width: 1280, height: 720 }, timeoutMs: 60000 });
    },
  },
  {
    name: 'nothing undrawn after GO (VIEWS §3.10.1, "every band pre-painted before GO"): the lane by T a tick a frame for 30 s of game time, every frame draws every figure from its own band, a twin\'s or a sibling\'s, never idle0 in a band\'s place nor not at all; the frame times printed',
    heavy: true,
    timeoutMs: 240_000,
    async fn() {
      await withGame(async (page) => {
        await page.waitForFunction(() => window.__ready && window.__olympus.state.stop?.phase === 'choose', null, { timeout: 60000 });
        const r = await page.evaluate(async () => {
          const O = window.__olympus, bot = (await import('/tests/bots/house.mjs')).houseTBot(), { figureOf } = await import('/src/sim/people/figure.js');
          O.pause(true);
          const out = { frames: 0, deferred: 0, worst: 0, at: [], sib: 0, twin: 0, drawn: 0, twoWalking: 0, dts: [] };
          let t = performance.now();
          const t0 = t;
          await new Promise(res => {
            const f = () => { try { tick(); } catch (e) { out.err = String(e?.message ?? e); res(); } };
            const tick = () => {
              const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor);
              if (s.skip?.engine === 'ff') O.sim.ffTick(s); else O.step(1, bot(s, me, (me.bot ??= {})));
              const v = window.__report?.view ?? {}, F = O.view?.figures?.stats ?? {}, now = performance.now();
              out.frames++; out.dts.push(now - t); t = now;
              if (v.deferred > 0) { out.deferred++; out.worst = Math.max(out.worst, v.deferred); if (out.at.length < 5) out.at.push(s.clock.ms); }
              const two = s.actors.list.find(a => a.who === s.armoury.range.house.twoPid);
              if (two && figureOf(s, two).gait !== 'idle') out.twoWalking++;
              out.sib += F.sib ?? 0; out.twin += F.twin ?? 0; out.drawn = Math.max(out.drawn, v.people?.drawn ?? F.drawn ?? 0);
              if (out.frames < 600 && !O.scene?.ended && performance.now() - t0 < 150_000) requestAnimationFrame(f); else res();
            };
            requestAnimationFrame(f);
          });
          O.pause(false);
          const d = out.dts.slice(5).sort((a, b) => a - b);
          out.median = d[Math.floor(d.length / 2)]; out.p95 = d[Math.floor(d.length * 0.95)]; delete out.dts;
          return out;
        });
        console.log(`      ${r.frames} frames, your #2 drawn walking in ${r.twoWalking}: ${r.deferred} with a figure undrawn or in idle0 (worst ${r.worst}${r.at.length ? ` at ${r.at.join(', ')}` : ''}); drawn from a sibling's sheet ${r.sib} times, a twin's ${r.twin}; at most ${r.drawn} figures; frames median ${fmt(r.median, 1)} ms, p95 ${fmt(r.p95, 1)} ms`);
        // (v0.0.13 never drew him walking, so nothing of his was ever asked past the gait band; without the stance pool his walk's
        // move band fell back to idle0 on 5 frames of these)
        assert(!r.err && r.frames >= 300 && r.twoWalking > 50 && r.deferred === 0, JSON.stringify(r));
      }, { port: BROWSER_TEST_PORT, query: QUERY, viewport: { width: 1280, height: 720 }, timeoutMs: 60000 });
    },
  },
];
