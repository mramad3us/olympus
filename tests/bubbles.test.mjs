// OLYMPUS tests: every line a text bubble at its speaker (v0.0.24 F; the user, 2026-11-19: "forget about voices, those are all
// terrible use text bubble only", and again: "also let me reiterate : forget voice synthesis, no voices."). src/ui/plaque.js:
// bubblePages wraps a line's words to rows of at most BUBBLE_ROW_PX in the 5 × 7 alphabet, BUBBLE_ROWS a page; speakerMarks makes
// every line a balloon held for its spoken time (core/speech.js spokenMs, at least CALL_BALLOON_MS), a long line paged by its words'
// share; placeBubbles stands each over its speaker clear of every other figure, the HUD's rectangles and the bubbles placed before it
// (main.js speakerHud draws what it places). Quick: the pure parts, and the house's lanes in node over the page's projection at 1600 ×
// 900 (tests/flawless-card.mjs keepBoxesAt): every line said by a man on the stage, the share placed at its first tick, and none over
// another bubble, the HUD or a figure. Heavy: the page, the bubbles' canvases against the HUD's own elements.
// F59 (v0.0.20's "every line heard") is "every line shown" from v0.0.24: no line is voiced, the synthesis gone whole, so the
// house's lanes' case below is its home (house-done's GAUGE_HOMES), its 95% and its 0 overlaps the gauge.
import { assert } from './helpers.mjs';
import { bubblePages, speakerMarks, placeBubbles, balloonPixels, BUBBLE_ROW_PX, BUBBLE_ROWS, CALL_BALLOON_MS } from '../src/ui/plaque.js';
import { width57 } from '../src/art/kit/type.js';
import { spokenMs } from '../src/core/speech.js';
import { rectsAt, STATES } from '../src/ui/hud/layout.js';
import { keepBoxesAt, PAGE, sheetBot } from './flawless-card.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { withGame, BROWSER_TEST_PORT } from './browser.mjs';

const meets = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const BRIEF = 'This is lane A. Three rooms and the hall. You lead, your number two follows. Clear each room by the drill, call it, mark it, move on. Standby.';
/** The HUD's rectangles in the picture's pixels at the page's size: the weapon state's that the house shows (main.js speakerHud reads the page's own elements; the shot timer's paper is not up in the house). */
const HOUSE_HUD = Object.freeze(STATES.weapon.filter(n => n !== 'PAPER'));
function uiAt(P = PAGE) {
  const k = Math.min(P.w / P.picW, P.h / P.picH), ox = (P.w - P.picW * k) / 2, oy = (P.h - P.picH * k) / 2, r = rectsAt(P.w, P.h, 'weapon');
  return HOUSE_HUD.map(n => r[n]).filter(Boolean).map(q => ({ x: (q.x - ox) / k, y: (q.y - oy) / k, w: q.w / k, h: q.h / k, who: 'ui' }));
}
/** A lane's lines and their bubbles: every 'say' by a man with a body, placed at the tick it is said and half way through it. */
function laneBubbles(tier, seed, { setup = 'go', opfor = null } = {}) {
  const says = [], ui = uiAt(), out = { lines: 0, placed: 0, mid: 0, midPlaced: 0, over: 0, worstRows: 0, pages: 0, unplaced: [] };
  const mids = [];
  const g0 = createGame({ scenario: 'test-shoothouse', seed, tier, ...(setup ? { setup } : {}), ...(opfor ? { opfor } : {}) });
  runHouse(g0, sheetBot(tier), { each: (g) => {
    const s = g.state, byWho = new Map(s.actors.list.filter(a => a.who).map(a => [a.who, a]));
    for (const [type, f] of g.bus.events ?? []) if (type === 'say' && f?.who && f.text && byWho.has(f.who)) { says.push({ who: f.who, text: String(f.text), atMs: s.clock.ms, spokenMs: spokenMs(f.text) }); mids.push(s.clock.ms + Math.round(Math.max(CALL_BALLOON_MS, spokenMs(f.text)) / 2)); out.lines++; }
    const fresh = says.some(x => x.atMs === s.clock.ms), mid = mids.includes(s.clock.ms);
    if (!fresh && !mid) return;
    const K = keepBoxesAt(s, PAGE), marks = speakerMarks(says, s.clock.ms);
    const headOf = (m) => { const a = byWho.get(m.who); if (!a) return null; const [hx, hy] = K.proj(a.x, 1.8, a.z); return { x: hx - 0.3 * PAGE.ppm, y: hy, w: 0.6 * PAGE.ppm, h: 0.4 * PAGE.ppm }; };
    const boxes = K.boxes.filter(b => b.who !== 'room' && b.who !== 'STEPS' && b.who !== 'RADIO');
    const { placed, unplaced } = placeBubbles(marks, { headOf, boxes, ui, bounds: K.bounds });
    // (every bubble placed: over no other bubble, no HUD rectangle, no figure but its speaker's, inside the picture)
    for (let i = 0; i < placed.length; i++) {
      const p = placed[i], r = { x: p.at.x, y: p.at.y, w: p.pix.w, h: p.pix.h };
      if (placed.some((q, j) => j !== i && meets(r, { x: q.at.x, y: q.at.y, w: q.pix.w, h: q.pix.h })) || ui.some(u => meets(r, u)) || boxes.some(b => b.who !== p.m.who && meets(r, b)) || r.x < 0 || r.y < 0 || r.x + r.w > PAGE.picW || r.y + r.h > PAGE.picH) out.over++;
      out.worstRows = Math.max(out.worstRows, p.m.text.split('\n').length);
      out.pages = Math.max(out.pages, p.m.pages);
    }
    const isFresh = (m) => m.fromMs === s.clock.ms;
    out.placed += placed.filter(p => isFresh(p.m)).length;
    if (mid) { out.mid += marks.filter(m => !isFresh(m)).length; out.midPlaced += placed.filter(p => !isFresh(p.m)).length; }
    for (const m of unplaced.filter(isFresh)) if (out.unplaced.length < 4) out.unplaced.push(`${m.who} "${m.text.replace(/\n/g, ' ')}" at ${s.clock.ms}`);
  } });
  return out;
}

/** The lanes' bubbles judged (see the header): printed, none over another, at least 95% placed as said. */
function bubbleGauge(lanes) {
  const rows = [];
  let lines = 0, placed = 0, over = 0;
  for (const [tier, seed, opts] of lanes) {
    const o = laneBubbles(tier, seed, opts);
    rows.push(`${tier} ${seed}${opts.setup === null ? ' from the fill (the brief)' : ''}${opts.opfor ? ' live' : ''}: ${o.lines} lines, ${o.placed} placed as said (${(100 * o.placed / Math.max(1, o.lines)).toFixed(1)}%), half way through ${o.midPlaced} of ${o.mid} shown, over another ${o.over}; at most ${o.worstRows} rows, ${o.pages} pages${o.unplaced.length ? `; not placed: ${o.unplaced.join('; ')}` : ''}`);
    lines += o.lines; placed += o.placed; over += o.over;
  }
  for (const r of rows) console.log(`      ${r}`);
  assert(lines > 20 && over === 0 && placed / lines >= 0.95, JSON.stringify({ lines, placed, over }));
}

export default [
  {
    name: 'a line\'s bubble: its words wrapped to rows no wider than BUBBLE_ROW_PX, BUBBLE_ROWS a page, the pages\' shares its words\'; the brief paged, a call one row',
    fn() {
      const pages = bubblePages(BRIEF), call = bubblePages('Clear!');
      const rows = pages.flatMap(p => p.rows), share = pages.reduce((a, p) => a + p.share, 0), widest = Math.max(...rows.map(r => width57(r.toUpperCase())));
      const pix = balloonPixels(pages[0].rows.join('\n'));
      console.log(`      the brief (${BRIEF.split(' ').length} words): ${pages.length} pages, ${rows.length} rows, the widest ${widest} px (at most ${BUBBLE_ROW_PX}); page 1's balloon ${pix.w} × ${pix.h} px: ${pages[0].rows.join(' / ')}; "Clear!": ${JSON.stringify(call)}`);
      assert(pages.length >= 2 && pages.every(p => p.rows.length <= BUBBLE_ROWS && p.rows.length > 0) && widest <= BUBBLE_ROW_PX && Math.abs(share - 1) < 1e-9 && rows.join(' ') === BRIEF, JSON.stringify(pages));
      assert(call.length === 1 && call[0].rows.length === 1 && call[0].rows[0] === 'Clear!' && pix.w <= BUBBLE_ROW_PX + 6 && pix.h === BUBBLE_ROWS * 9 - 2 + 8, JSON.stringify({ call, w: pix.w, h: pix.h }));
    },
  },
  {
    name: 'every line a bubble for its spoken time, at least CALL_BALLOON_MS, the newest a speaker\'s only; a long line\'s pages in order, each for its words\' share',
    fn() {
      const says = [{ who: 'chief', text: BRIEF, atMs: 1000, spokenMs: spokenMs(BRIEF) }, { who: 'two', text: 'Ready.', atMs: 1200, spokenMs: spokenMs('Ready.') }];
      const T = spokenMs(BRIEF), seen = [];
      for (let ms = 1000; ms <= 1000 + T + 100; ms += 50) { const m = speakerMarks(says, ms).find(x => x.who === 'chief'); if (m && seen.at(-1)?.page !== m.page) seen.push({ page: m.page, ms, first: m.text.split('\n')[0] }); }
      const two = speakerMarks(says, 1200 + CALL_BALLOON_MS - 1).find(x => x.who === 'two'), gone = speakerMarks(says, 1200 + CALL_BALLOON_MS + 1).find(x => x.who === 'two');
      console.log(`      the brief, ${T} ms spoken: ${seen.map(x => `page ${x.page + 1} from ${x.ms - 1000} ms ("${x.first}")`).join(', ')}; "Ready." held ${CALL_BALLOON_MS} ms (spoken ${spokenMs('Ready.')})`);
      assert(seen.length === bubblePages(BRIEF).length && seen.every((x, i) => x.page === i) && !speakerMarks(says, 1000 + T + 1).some(x => x.who === 'chief'), JSON.stringify(seen));
      assert(two?.kind === 'balloon' && two.text === 'Ready.' && !gone, JSON.stringify({ two, gone }));
    },
  },
  {
    name: 'placeBubbles: two men side by side speaking at once, both bubbles over them and apart; a bubble with no free place is left to the radio box, never drawn over the HUD',
    fn() {
      const heads = { a: { x: 100, y: 120, w: 10, h: 6 }, b: { x: 112, y: 120, w: 10, h: 6 } };
      const marks = [{ who: 'a', text: 'Coming in!', fromMs: 0, k: 1 }, { who: 'b', text: 'Clear!\nRoom clear!', fromMs: 0, k: 1 }];
      const ab = placeBubbles(marks, { headOf: (m) => heads[m.who], bounds: { x: 0, y: 0, w: 640, h: 360 } });
      const r = ab.placed.map(p => ({ x: p.at.x, y: p.at.y, w: p.pix.w, h: p.pix.h }));
      const roof = placeBubbles(marks, { headOf: (m) => heads[m.who], ui: [{ x: 0, y: 0, w: 640, h: 119 }], bounds: { x: 0, y: 0, w: 640, h: 360 } });
      console.log(`      side by side: ${JSON.stringify(r)}; under a HUD band to y 119: placed ${roof.placed.length}, left ${roof.unplaced.length}`);
      assert(ab.placed.length === 2 && !meets(r[0], r[1]) && r.every(q => q.y + q.h <= 120), JSON.stringify(r));
      assert(roof.placed.length === 0 && roof.unplaced.length === 2, JSON.stringify(roof));
    },
  },
  {
    name: 'the house\'s lanes in node at 1600 × 900 (F59, every line shown): every line of a man on the stage a bubble, none over another bubble, the HUD, a figure or the picture\'s edge; at least 95% placed the tick they are said (the sergeant from the fill with the brief, the tier one on the live lane, 48213)',
    fn() { bubbleGauge([['sgt', 48213, { setup: null }], ['tierone', 48213, { opfor: 'live' }]]); },
  },
  {
    name: 'the same on four lanes: the private by the keys and the tier one from GO besides',
    heavy: true,
    fn() { bubbleGauge([['private', 48213, {}], ['tierone', 48213, {}], ['sgt', 48213, { setup: null }], ['tierone', 48213, { opfor: 'live' }]]); },
  },
  {
    name: 'in the page: the instructor\'s brief and the #2\'s calls drawn as bubbles over their speakers, none over another or the HUD\'s panels, every one carrying its words (the tier one on 48213, 1600 × 900)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('play=test-shoothouse&tier=tierone&seed=48213&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
        const seen = new Map(), clashes = [];
        for (let i = 0; i < 160; i++) {
          await page.evaluate(async () => {
            const O = window.__olympus, { houseBot } = await import('/tests/bots/house.mjs'), bot = (window.__bb ??= houseBot({ mode: 'T' }));
            O.pause(true);
            for (let n = 0; n < 6; n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, (me.bot ??= {}))); }
          });
          await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
          const f = await page.evaluate(() => {
            const rect = (e) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
            const bubbles = [...document.querySelectorAll('.plaque.speaker')].filter(e => !e.hidden).map(e => ({ who: e.dataset.who, words: e.dataset.words, ...rect(e) }));
            const hud = ['.steps', '.radio', '.instinct', '.watch', '.toasts'].map(q => document.querySelector(q)).filter(e => e && !e.hidden && e.getBoundingClientRect().width).map(e => ({ q: e.className, ...rect(e) }));
            return { bubbles, hud, ms: window.__olympus.state.clock.ms };
          });
          for (const b of f.bubbles) { seen.set(`${b.who}|${b.words}`, b); for (const c of f.bubbles) if (c !== b && meets(b, c)) clashes.push(`${b.words} × ${c.words} at ${f.ms}`); for (const h of f.hud) if (meets(b, h)) clashes.push(`${b.words} × ${h.q} at ${f.ms}`); }
        }
        const whos = new Set([...seen.values()].map(b => b.who));
        console.log(`      ${seen.size} lines drawn as bubbles by ${[...whos].join(', ')}: ${[...seen.values()].slice(0, 6).map(b => `${b.who} "${b.words}"`).join('; ')}; clashes ${clashes.length}${clashes.length ? `: ${clashes.slice(0, 3).join('; ')}` : ''}`);
        assert(seen.size >= 3 && whos.has('chief') && [...seen.values()].every(b => b.words) && clashes.length === 0, JSON.stringify({ n: seen.size, whos: [...whos], clashes: clashes.slice(0, 4) }));
        assert(!errors.length, errors.join(' | '));
      }, { port: BROWSER_TEST_PORT });
    },
  },
  {
    name: 'in the page: the ship\'s 1MC, a speaker with no body, has its bubble at the top of the picture, its name before its words, clear of the HUD (test-burn on 48213, the brace\'s warning)',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('play=test-burn&seed=48213&nostore=1');
        await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
        let got = null;
        for (let i = 0; i < 160 && !got; i++) {
          await page.evaluate(() => { const O = window.__olympus; O.pause(true); for (let n = 0; n < 10; n++) { const s = O.state; if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1); } });
          await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
          got = await page.evaluate(() => {
            const rect = (e) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
            const e = [...document.querySelectorAll('.plaque.speaker')].find(x => !x.hidden && x.dataset.who === 'pa:1MC');
            if (!e) return null;
            const hud = [...document.getElementById('hud').children].filter(x => !x.hidden && !x.classList.contains('speaker') && x.getBoundingClientRect().width).map(x => ({ q: x.className, ...rect(x) }));
            const stage = document.querySelector('canvas').getBoundingClientRect();
            return { words: e.dataset.words, r: rect(e), hud, ms: window.__olympus.state.clock.ms, stageH: stage.height };
          });
        }
        const over = got ? got.hud.filter(h => meets(got.r, h)).map(h => h.q) : [];
        console.log(`      ${got ? `"${got.words}" at ${Math.round(got.r.x)}, ${Math.round(got.r.y)} (${Math.round(got.r.w)} × ${Math.round(got.r.h)} px), over ${over.length ? over.join(', ') : 'nothing of the HUD'}` : 'no 1MC bubble'}`);
        assert(got && /^1MC: Brace, brace, brace/.test(got.words) && !over.length && got.r.y < got.stageH / 2, JSON.stringify(got));
        assert(!errors.length, errors.join(' | '));
      }, { port: BROWSER_TEST_PORT });
    },
  },
];
