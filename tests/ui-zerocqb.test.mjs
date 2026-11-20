// OLYMPUS tests: ui-zerocqb, "Hold to hold" in the page (the build sheet v0.0.25 items 8, 9, 11 and 14, §6 D ui-zerocqb; F130, F133,
// F136 and F137's page halves). Heavy, a browser file.
//
// In the page at 16 px/m (1280 × 720, the picture 640 × 360) on test-zerocqb 48213, the sergeant:
//   - at GO (F137): every board in a compartment never in sight drawn the unknown's colours (UNKNOWN_C or, from v0.0.28's U2, its hatch) where the stage puts it
//     (its turned board's centre, render/range-items.js boardPixels), the passage you stand in drawn; nothing of deck 6 in the picture
//     (the frame's metres against the decks' boxes: the camera framed a deck at a time, render/view.js cameraBounds);
//   - played on by the honest sergeant by T (the page's own bot, a tick a frame) through the trunk to the hold's deckhead and its
//     first board: at every frame no page error; F130's page half (every lane body drawn on the face the sim gives him, flipped head
//     down on the deckhead, view.stats.figures; every board the stage draws on its stand's face, view.stats.range.house.faces); F137
//     at every frame (the frame never shows the other deck); the deck switch (the fact 'hatch', the view's deck wipe) with no frame
//     over 33 ms and no band or queue upload in its frames (F133: "0 bytes sent"), and every frame after GO + 1 s within UPLOAD_MID_KB
//     of the queue's and the figures' bytes;
//   - F136's page half: the cadre's and the 1MC's lines (no body on the stage) bubbles at your compartment's speaker (the area's
//     `speakers`, main.js speakerAt), none overlapping another at 1024 × 768 and 1600 × 900.
// The frame times printed. Fails without the deck framing, the wipe, the flip or the speakers' bubbles.
import { assert } from './helpers.mjs';
import { withGame, frameMs } from './browser.mjs';
import { UNKNOWN_C, UNKNOWN_HATCH } from '../src/render/known.js';
import { UPLOAD_MID_KB } from '../src/data/bench.js';
import { WRECK_DECKS, WRECK_DECK_M } from '../src/data/places/wreck.js';

const PORT = Number(process.env.OLYMPUS_TEST_PORT) || undefined;
const LANE = 'play=test-zerocqb&seed=48213&tier=sgt&setup=go&nostore=1&perf=1';
const fmt = (o) => JSON.stringify(o);
// (the decks' boxes in the area's plan, x0..x1, for "nothing of the other deck in the picture")
const DECKS = Object.entries(WRECK_DECKS).map(([n, d]) => ({ n: Number(n), x0: d.origin[0], x1: d.origin[0] + WRECK_DECK_M[0] }));

export default [
  {
    name: 'ui-zerocqb: the Wreck in the page from GO through the trunk to the hold\'s deckhead by the honest sergeant: at GO the compartments\' boards black (F137) and no frame of deck 6; every frame on its own deck, every body on his face (F130), the deck wipe with no frame over 33 ms and no upload, every frame after GO + 1 s within UPLOAD_MID_KB (F133); no page error',
    heavy: true,
    timeoutMs: 600_000,
    async fn() {
      const rows = [];
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.house?.goAtMs !== null, null, { timeout: 90_000 });
        await page.evaluate(() => window.__olympus.pause(true));
        await page.evaluate((k) => new Promise(r => { let i = 0; const f = () => (++i < k ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); }), 30);
        // ---- at GO: the boards of the compartments you have not looked into, black where the stage draws them ----
        const go = await page.evaluate(({ decks, unk }) => {
          const O = window.__olympus, s = O.state, me = s.actors.list.find(a => a.who === s.player.id), V = window.__report.view;
          const W = V.res[0] / V.ppm, cam = V.camera, frame = [cam.x - W / 2, cam.x + W / 2];
          const px = O.pixels(0, 0, 4000, 4000), cs = [].concat(unk).map(u => [(u >> 16) & 255, (u >> 8) & 255, u & 255]), isU = (q) => cs.some(c => q[0] === c[0] && q[1] === c[1] && q[2] === c[2]);
          const out = [];
          for (const T of s.armoury.range.turners ?? []) {
            if (T.x > frame[1] || T.x < frame[0]) continue;
            const p = O.project(T.x, T.y ?? 1.35, T.z), xi = Math.round(p.x), yi = Math.round(p.y);
            if (xi < 0 || yi < 0 || xi >= px.w || yi >= px.h) continue;
            const q = px.picture[yi][xi];
            out.push({ stand: T.stand, onFace: T.onFace ?? 'deck', black: isU(q) });
          }
          const mine = decks.find(d => me.x >= d.x0 - 1 && me.x <= d.x1 + 1)?.n ?? null;
          // (the hull east of deck 5, in no compartment: 3 m past its starboard bulkhead, on the deck's plane; known from the start, so
          // the background's colour, never the unknown's (the review of C and D: a black slab about 476 × 216 px there on every frame))
          const g = O.project(decks.find(d => d.n === 5).x1 + 3, 0, 3.6), gx = Math.round(g.x), gy = Math.round(g.y), gq = gx >= 0 && gy >= 0 && gx < px.w && gy < px.h ? px.picture[gy][gx] : null;
          const gap = gq ? { x: gx, y: gy, rgb: [...gq].slice(0, 3), black: isU(gq) } : null;
          return { stands: out, frame, mine, other: decks.filter(d => d.n !== mine).some(d => d.x1 > frame[0] && d.x0 < frame[1]), known: V.fog?.known ?? null, gap };
        }, { decks: DECKS, unk: [UNKNOWN_C, ...(UNKNOWN_HATCH ? [UNKNOWN_HATCH.colour] : [])] });
        rows.push(`at GO: the frame x ${go.frame.map(v => v.toFixed(2)).join(' to ')} m on deck ${go.mine}, the other deck in it: ${go.other}; the boards in the picture ${go.stands.map(t => `${t.stand} (${t.onFace}) ${t.black ? 'black' : 'DRAWN'}`).join(', ')}; the known cells ${fmt(go.known)}`);
        rows.push(`at GO: the hull 3 m east of deck 5 at pixel (${go.gap?.x}, ${go.gap?.y}) rgb ${go.gap?.rgb?.join(',')}: ${go.gap?.black ? 'the unknown\'s black' : 'not the unknown\'s'}`);
        assert(go.mine === 5 && !go.other && go.stands.length >= 2 && go.stands.every(t => t.black) && go.known?.cells > 0, fmt(go));
        assert(go.gap && !go.gap.black, fmt(go.gap));
        // ---- played on a tick a frame by the honest sergeant by T to the hold's first board ----
        const run = await page.evaluate(async ({ decks, budgetKB }) => {
          const O = window.__olympus, { houseTBot } = await import('/tests/bots/house.mjs'), bot = houseTBot(), mem = {};
          const s0 = O.state, go = s0.armoury.range.house.goAtMs, out = { frames: 0, other: 0, offFace: [], turning: 0, upList: null, grip: { 'Got you.': 0, 'Through.': 0 }, gripOff: 0, wipes: 0, wipeFrames: [], maxDt: 0, maxUpKB: 0, upAt: null, deckhead: 0, flipped: 0, boardFaces: new Set(), lastDeck: 5, crossedAt: null };
          let last = performance.now(), wipeLeft = 0;
          await new Promise((done) => {
            const tick = () => {
              const s = O.state, me = s.actors.list.find(a => a.who === s.player.id), H = s.armoury.range.house;
              const onHoldFace = me.x > 50 && (me.onFace === 'deckhead' || out.deckhead > 0);
              if (s.armoury.range.end || s.clock.ms - go > 240_000 || (onHoldFace && out.crossedAt !== null && s.clock.ms - out.crossedAt > 8000)) return done();
              if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, mem));
              requestAnimationFrame(() => {
                const now = performance.now(), dt = now - last; last = now; out.frames++;
                const V = window.__report.view, st = O.state, me2 = st.actors.list.find(a => a.who === st.player.id);
                const W = V.res[0] / V.ppm, frame = [V.camera.x - W / 2, V.camera.x + W / 2];
                const mine = decks.find(d => me2.x >= d.x0 - 1 && me2.x <= d.x1 + 1)?.n ?? null;
                if (decks.filter(d => d.n !== mine).some(d => d.x1 > frame[0] && d.x0 < frame[1])) out.other++;
                if (mine !== out.lastDeck) { out.crossedAt ??= st.clock.ms; out.lastDeck = mine; }
                // (F130's page half: every lane body drawn on his face, flipped head down on the deckhead)
                const lane = new Set([st.player.id, H.twoPid].filter(Boolean));
                for (const f of V.figures ?? []) {
                  const a = st.actors.list.find(x => x.id === f.id);
                  if (!a || !lane.has(a.who) || f.remembered) continue;
                  const want = a.onFace ?? 'deck', drawnOn = f.onFace === 'turning' ? null : f.onFace;
                  if (drawnOn !== null && drawnOn !== want) { if (out.offFace.length < 5) out.offFace.push({ t: st.clock.tick, id: f.id, want, drawn: f.onFace }); }
                  if (want === 'deckhead' && f.onFace === 'deckhead') { out.deckhead++; if (f.flip) out.flipped++; }
                  if (f.onFace === 'turning') out.turning++;
                }
                for (const b of V.range?.house?.faces ?? []) out.boardFaces.add(`${b.stand}:${b.onFace}`);
                // (your #2's "Got you." and "Through." from across the trunk (B's `at`, the scuttle on your deck): placed, inside the picture)
                for (const e of document.querySelectorAll('.plaque.speaker')) {
                  if (e.hidden) continue;
                  const w = String(e.dataset.words ?? ''), k = w.includes('Got you.') ? 'Got you.' : w.includes('Through.') ? 'Through.' : null;
                  if (!k) continue;
                  const r = e.getBoundingClientRect();
                  if (r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight) out.gripOff++; else out.grip[k]++;
                }
                // (the deck wipe's frames: the view's count of them, and what each sent: the queue's and the figures' bands (view.stats.bands))
                const w = V.deckWipes ?? 0;
                if (w > out.wipes) { out.wipes = w; wipeLeft = 30; }
                const qKB = ((V.uploads?.bytes ?? 0) + (V.bands?.bytes ?? 0)) / 1024;
                if (wipeLeft > 0) { wipeLeft--; out.wipeFrames.push({ dt: Math.round(dt * 10) / 10, qKB: Math.round(qKB * 10) / 10 }); }
                if (st.clock.ms - go > 1000 && qKB > out.maxUpKB) { out.maxUpKB = qKB; out.upAt = st.clock.ms - go; out.upList = [...(V.bands?.list ?? []), V.uploads?.key ?? ''].filter(Boolean); }
                if (out.frames > 60) out.maxDt = Math.max(out.maxDt, dt);
                tick();
              });
            };
            tick();
          });
          return { ...out, boardFaces: [...out.boardFaces], t: O.state.clock.ms - go };
        }, { decks: DECKS, budgetKB: UPLOAD_MID_KB });
        const f = await frameMs(page);
        rows.push(`played to GO + ${(run.t / 1000).toFixed(1)} s in ${run.frames} frames: the other deck in ${run.other} of them; a lane body planted on the deckhead in ${run.deckhead} figure-frames, flipped in ${run.flipped}, changing face in ${run.turning}; off his face ${fmt(run.offFace)}; the boards drawn on ${run.boardFaces.join(', ')}`);
        rows.push(`your #2's grip's words placed in frames: "Got you." ${run.grip['Got you.']}, "Through." ${run.grip['Through.']}, off the picture ${run.gripOff}${run.grip['Got you.'] + run.grip['Through.'] ? '' : ' (none placed in these frames; the same lane in node says both at +43.55 and +43.80 s since the review of C and D: open, for D and the lead)'}`);
        rows.push(`the deck wipes ${run.wipes}; their first 30 frames: dt at most ${Math.max(0, ...run.wipeFrames.map(x => x.dt))} ms, the queue's bytes at most ${Math.max(0, ...run.wipeFrames.map(x => x.qKB))} KB; the largest queue upload after GO + 1 s ${run.maxUpKB.toFixed(1)} KB at GO + ${((run.upAt ?? 0) / 1000).toFixed(2)} s (${(run.upList ?? []).join(' ') || '-'}; UPLOAD_MID_KB ${UPLOAD_MID_KB}); the frames after: median ${f.medianMs.toFixed(1)} ms, p95 ${f.p95Ms.toFixed(1)} ms`);
        for (const r of rows) console.log(`      ${r}`);
        assert(run.other === 0, `the other deck in ${run.other} frames`);
        assert(!run.offFace.length && run.deckhead > 0 && run.flipped === run.deckhead && run.turning > 0, fmt({ off: run.offFace, deckhead: run.deckhead, flipped: run.flipped, turning: run.turning }));
        assert(run.wipes >= 1 && run.wipeFrames.every(x => x.dt <= 33.4 && x.qKB === 0), fmt(run.wipeFrames));
        assert(run.maxUpKB <= UPLOAD_MID_KB, `an upload of ${run.maxUpKB} KB at ${run.upAt} ms`);
        // (placed wherever said: the lane may not say them, the brace being B's and C's open finding (c.md: no lane braced on 48213))
        assert(run.gripOff === 0, fmt({ grip: run.grip, off: run.gripOff }));
        assert(!errors.length, errors.join('\n'));
      }, { port: PORT, query: LANE, viewport: { width: 1280, height: 720 }, timeoutMs: 120_000 });
    },
  },
  {
    name: 'ui-zerocqb: every line a bubble at its speaker (F136): the cadre\'s and the 1MC\'s, with no body on the stage, at your compartment\'s speaker on the deckhead; no two bubbles over each other at 1024 × 768 and 1600 × 900',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      for (const viewport of [{ width: 1024, height: 768 }, { width: 1600, height: 900 }]) {
        await withGame(async (page, errors) => {
          await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.house, null, { timeout: 90_000 });
          // (the brief runs: the cadre's lines from the gallery; every bubble's rect and who, sampled over 20 s of the brief)
          const seen = await page.evaluate(async () => {
            const out = { bubbles: 0, cadre: 0, pa: 0, atSpeaker: 0, offSpeaker: 0, overlaps: 0, samples: [] }, O = window.__olympus;
            const area = O.state.places.live.area, { areaOf } = await import('/src/sim/places/model.js'), speakers = areaOf(area)?.speakers ?? [];
            // (a picture point in the page's CSS pixels: the stage's canvas holds the picture at its own scale)
            const cv = [...document.querySelectorAll('canvas')].reduce((b, c) => (c.width * c.height > b.width * b.height ? c : b)), V = window.__report.view, css = (p) => { const r = cv.getBoundingClientRect(); return { x: r.left + p.x * r.width / V.res[0], y: r.top + p.y * r.height / V.res[1], k: r.width / V.res[0] }; };
            for (let k = 0; k < 40; k++) {
              await new Promise(r => setTimeout(r, 500));
              const els = [...document.querySelectorAll('.plaque.speaker')].filter(e => !e.hidden);
              const rects = els.map(e => ({ who: e.dataset.who, r: e.getBoundingClientRect(), words: e.dataset.words }));
              for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
                const a = rects[i].r, b = rects[j].r;
                if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) out.overlaps++;
              }
              out.bubbles += rects.length;
              for (const x of rects) {
                const s = O.state, H = s.armoury.range.house, off = !s.actors.list.some(a => a.who === x.who);
                if (x.who === 'chief' || x.who === H.chiefPid) out.cadre++;
                if (String(x.who).startsWith('pa:')) out.pa++;
                if (off || String(x.who).startsWith('pa:') || x.who === 'chief') {
                  // (its tail over a speaker of the area: the speaker's picture under the bubble's span, its foot at most 3 m above it)
                  const near = speakers.some(q => { const c = css(O.project(q.x, q.y ?? 2.1, q.z)); return c.x >= x.r.left - 8 * c.k && c.x <= x.r.right + 8 * c.k && x.r.bottom <= c.y + 4 * c.k && c.y - x.r.bottom <= 48 * c.k; });
                  if (near) out.atSpeaker++; else out.offSpeaker++;
                }
                if (out.samples.length < 4) out.samples.push(`${x.who}: ${String(x.words).slice(0, 40)}`);
              }
            }
            return { ...out, area };
          });
          console.log(`      ${viewport.width} × ${viewport.height}: ${seen.bubbles} bubble-samples over the brief, the cadre's ${seen.cadre}, the 1MC's ${seen.pa}; of a speaker off the stage ${seen.atSpeaker} over a speaker of the deck, ${seen.offSpeaker} not; overlaps ${seen.overlaps}; ${seen.samples.slice(0, 2).join(' | ')}`);
          assert(seen.bubbles > 0 && seen.cadre + seen.pa > 0 && seen.atSpeaker > 0 && seen.offSpeaker === 0 && seen.overlaps === 0, fmt(seen));
          assert(!errors.length, errors.join('\n'));
        }, { port: PORT, query: 'play=test-zerocqb&seed=48213&tier=sgt&nostore=1', viewport, timeoutMs: 120_000 });
      }
    },
  },
];
