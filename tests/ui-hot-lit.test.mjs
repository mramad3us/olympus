// OLYMPUS tests: the spot a Watch or Look row names is lit on the floor while the row is under the cursor (v0.0.23, its build sheet item 18, DW; COMBAT §25.11), heavy: a browser.
//
// The user, 2026-11-17: "i don't know what the "look behind the door" option does" and "same for the watch the near right corner etc".
// From v0.0.23 the rows say what they do (bundle.js hotLabel: "Watch behind the door: muzzle on it as you go in", "Look: check the far
// right corner"), and the hot spot a row names is drawn lit on the floor (range-items.js cornerPixels' CORNER_LIT, a warm white over the
// pale and the brass) while the row is under the panel's cursor: main.js passes the hovered row's spot to the view (frame info.hot),
// view.js marks that corner on a copy of the house's corners (stats.hotLit). The private on 48213, layouts C and A:
//   - at GO at room 1's stack, the cursor on "Watch behind the door" (reached by its own keys, keysFor: Tab › 2 › 0 › 1 in C, 7 › 0 › 1
//     in A): the view lights r1:nl, and nothing out of your sight changes on the stage: the room behind its shut door is drawn as last
//     seen (render/memory.js, the fog), so its ticks do not change, lit or not (the rule "we only know what we know");
//   - inside room 1 (the keys bot's first stop there, saved in node and started in the page), the cursor on "Look: check the far right
//     corner", then the far left: that tick's pixels turn brighter (the lit colour), every other corner's tick as it was; the cursor
//     off it, every tick as before. "Look behind the door" lights r1:nl there too (stats.hotLit); its tick lies under your own corner's
//     aid (range-items.js cornerAidPixels, drawn over the floor's pixels), which already marks it.
// The review of 2026-11-18 (each failing without its fix): D's first labels ("Watch the near right corner: muzzle on it as you go
// in") were cut at the tile's two lines in both panels, so what a row does was never read: now every Watch and Look tile's name is
// whole (scrollHeight within a pixel of clientHeight) in C and A at 1280 × 720 and 1600 × 900, and its meta says what it does ("aim
// in", "check": steps.js HOT_PURPOSE). And the lit spot was never seen for the rows the user named: at room 1's stack the set house is
// known (sim/places/known.js familiarOf), so "Watch: behind the door" now lights r1:nl over the remembered floor (render/range.js's
// over layer, as light) and no other tick changes; inside room 1 "Look: behind the door" lights r1:nl over your corner's aid (the
// over layer, CORNER_LIT_Y_M). On a drawn house (unfamiliar) the room behind its shut door stays as it was: no tick of it changes;
// from v0.0.28 (the intel, 'walls') its corner is the brief's and lit as the set house's, the rest of the room unchanged.
// Fails without the hunks (hotLit null, the ticks unchanged).
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { PNG } from './png-read.mjs';
import { createGame } from './game.mjs';
import { houseKeysBot } from './bots/house.mjs';
import { houseLook } from '../src/sim/scenarios/shoothouse.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { CORNER_Y_M } from '../src/render/range-items.js';

// (the keys bot's first stop inside room 1 with "Look: behind the door" offered: its save, and room 1's four corners)
function insideRoom1() {
  const g = createGame({ scenario: 'test-shoothouse', setup: 'go', tier: 'private', seed: 48213 }), s = g.state, bot = houseKeysBot();
  const corners = houseLook(s).corners.filter(c => /^r1:/.test(c.id)).map(c => ({ id: c.id, x: c.x, z: c.z }));
  for (let i = 0; i < 3000 && !s.armoury.range.end; i++) {
    if (s.stop?.mode === 'stop' && s.stop.phase === 'choose' && stepsOf(s).some(r => r.id === 'look:r1:nl')) return { json: g.save(), tick: s.clock.tick, corners };
    g.step(1, bot); g.clearFacts?.();
  }
  return { json: null, tick: null, corners };
}
// (a drawn house at GO on 48213: room 1's corners, for the unfamiliar case)
function drawnRoom1() {
  const g = createGame({ scenario: 'test-shoothouse', setup: 'go', tier: 'private', seed: 48213, draw: 'drawn' });
  return houseLook(g.state).corners.filter(c => /\.r1:|^r1:/.test(c.id) || /r1/.test(c.id.split(':')[0])).map(c => ({ id: c.id, x: c.x, z: c.z }));
}
// (every Watch or Look tile of the list now drawn: its name whole, and its meta)
const tilesNow = (page) => page.evaluate(() => [...document.querySelectorAll('.steps [data-step]')].filter(e => /^(watch|look):/.test(e.dataset.step) && e.offsetParent).map(e => { const n = e.querySelector('.name'); return { id: e.dataset.step, text: n?.textContent ?? '', sh: n?.scrollHeight ?? 0, ch: n?.clientHeight ?? 0, purpose: e.querySelector('.meta .odds.purpose')?.textContent ?? null }; }));

export default [
  {
    name: 'the cursor on a Watch or Look row lights its spot on the floor (CORNER_LIT) where you see it or the house is known, the other corners as they were, and the cursor off it as before; every Watch and Look tile whole with its purpose on its meta in C and A at 1600 × 900 and 1280 × 720; at room 1\'s stack "Watch: behind the door" lit over the remembered floor of the set, a drawn house\'s unknown room unchanged; inside, "Look: behind the door" lit over your corner\'s aid (v0.0.23, DW; the user, 2026-11-17, "i don\'t know what the "look behind the door" option does"; the review of 2026-11-18: the labels cut at two lines, the spot never lit for the rows named)',
    heavy: true,
    timeoutMs: 600_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [], bad = [];
      const room = insideRoom1();
      assert(room.json, 'no stop inside room 1 with Look: behind the door');
      await withGame(async (page, errors, game) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        const frames = (n) => page.evaluate((k) => new Promise(r => { let i = 0; const f = () => (++i >= k ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
        // (each corner's tick on the canvas: its 12-px square's pixels)
        const where = (cs0 = room.corners) => page.evaluate(({ cs, y }) => { const c = document.querySelector('canvas').getBoundingClientRect(); return cs.map(k => { const p = window.__olympus.screenOf(k.x, y, k.z); return { id: k.id, cx: c.left + (p.x / p.W) * c.width, cy: c.top + (p.y / p.H) * c.height }; }); }, { cs: cs0, y: CORNER_Y_M });
        const shots = async (W) => { const out = {}; for (const w of W) out[w.id] = PNG.read(await page.screenshot({ clip: { x: Math.round(w.cx) - 6, y: Math.round(w.cy) - 6, width: 12, height: 12 } })).data; return out; };
        // (pixels changed between two squares, and how many of them brighter)
        const diff = (a, b) => { let n = 0, up = 0; for (let i = 0; i < a.length; i += 4) { const la = a[i] + a[i + 1] + a[i + 2], lb = b[i] + b[i + 1] + b[i + 2]; if (la !== lb || a[i] !== b[i]) { n++; if (lb > la) up++; } } return { n, up }; };
        // (a row reached by its own keys, the cursor on its tile; Tab held in C while the cursor is there)
        const reach = async (id) => {
          const keys = await page.evaluate((x) => window.__olympus.keysFor(x), id), held = keys[0] === 'Tab';
          if (held) await page.keyboard.down('Tab');
          await page.waitForTimeout(200);
          for (const k of keys.slice(held ? 1 : 0, -1)) { await page.keyboard.press(/^\d$/.test(k) ? `Digit${k}` : k); await page.waitForTimeout(250); }
          const tile = await page.evaluate((x) => { const e = document.querySelector(`.steps [data-step="${x}"]`); return e && e.offsetParent ? { label: e.dataset.label ?? e.querySelector('.name')?.textContent ?? e.textContent, name: e.querySelector('.name')?.textContent ?? null, title: e.title } : null; }, id);
          if (tile) await page.hover(`.steps [data-step="${id}"]`);
          await frames(3);
          return { keys, held, tile };
        };
        // (the cursor off, then the panel home: Tab let go in C (the fan closes), Esc in A (the drawer's home; in C Esc is the game's menu))
        const leave = async (held) => { await page.mouse.move(4, 4); await frames(3); if (held) await page.keyboard.up('Tab'); else await page.keyboard.press('Escape'); await page.waitForTimeout(250); };
        // (every Watch and Look tile drawn now whole, its meta the purpose; the rows reached at each viewport and panel)
        const clipCheck = async (tag) => {
          const T = await tilesNow(page);
          for (const t of T) if (t.sh > t.ch + 1 || t.purpose !== (/^watch:/.test(t.id) ? 'aim in' : 'check')) bad.push(`${tag} ${t.id}: ${JSON.stringify(t)}`);
          return T;
        };
        for (const [vw, vh] of [[1600, 900], [1280, 720]]) for (const panel of ['c', 'a']) {
          const at = `${vw}x${vh} ${panel.toUpperCase()}`, full = vw === 1600;
          await page.setViewportSize({ width: vw, height: vh });
          // (1) at GO, room 1's stack: Watch: behind the door; the set house is known, so its spot lights behind the shut door
          await game.open(`play=test-shoothouse&setup=go&tier=private&seed=48213&nostore=1&panel=${panel}`);
          await page.waitForFunction(() => window.__ready && !!window.__olympus.panel()?.where, null, { timeout: 60000 });
          await page.waitForTimeout(800);
          let W = await where();
          const b0 = await shots(W), r0 = await reach('watch:r1:nl'), on0 = await shots(W), lit0 = await page.evaluate(() => window.__olympus.view?.hotLit ?? null);
          const T0 = await clipCheck(`${at} stack`);
          await leave(r0.held);
          const d0 = Object.fromEntries(room.corners.map(c => [c.id, diff(b0[c.id], on0[c.id])]));
          rows.push(`${at}, at room 1's stack: keys ${r0.keys.join(' › ')}, "${r0.tile?.label ?? 'NOT SHOWN'}": lit ${lit0 ?? 'none'}; the remembered room's ticks changed (brighter) ${room.corners.map(c => `${c.id} ${d0[c.id].n} (${d0[c.id].up})`).join(', ')}; the tiles ${T0.map(t => `"${t.text}" ${t.purpose} ${t.sh}/${t.ch} px`).join(', ')}`);
          if (!r0.tile || lit0 !== 'r1:nl' || r0.tile.label !== 'Watch: behind the door' || !/outside: aim in; inside: check/.test(r0.tile.title) || !/the corner the open door hides/.test(r0.tile.title)) bad.push(`${at} stack: ${JSON.stringify({ tile: r0.tile, lit0 })}`);
          if (T0.length < 2) bad.push(`${at} stack: ${T0.length} watch tiles drawn`);
          if (full) {
            // (r1:nl lies under your corner's aid: the lit tick drawn over it, some of the aid's own bright pixels covered, so brighter in part)
            if (!(d0['r1:nl'].up >= 4)) bad.push(`${at} stack: r1:nl's tick behind the shut door ${JSON.stringify(d0['r1:nl'])}`);
            for (const c of room.corners) if (c.id !== 'r1:nl' && d0[c.id].n) bad.push(`${at} stack: ${c.id} changed ${d0[c.id].n}`);
          }
          // (2) inside room 1: the far corners lit in turn, then Look: behind the door, its tick over your corner's aid
          await page.evaluate((j) => window.__olympus.start(j), room.json);
          await page.waitForFunction(() => window.__olympus.stop()?.phase === 'choose' && !!window.__olympus.panel()?.where, null, { timeout: 60000 });
          await page.waitForTimeout(2500);
          W = await where();
          for (const id of full ? ['r1:fr', 'r1:fl', 'r1:nl'] : ['r1:fr', 'r1:nl']) {
            const b = await shots(W), r = await reach(`look:${id}`), on = await shots(W), lit = await page.evaluate(() => window.__olympus.view?.hotLit ?? null);
            const T = await clipCheck(`${at} ${id}`);
            await leave(r.held);
            const off = await shots(W), d = Object.fromEntries(room.corners.map(c => [c.id, diff(b[c.id], on[c.id])])), back = room.corners.map(c => diff(b[c.id], off[c.id]).n).reduce((a, x) => a + x, 0);
            rows.push(`${at}, inside room 1 (tick ${room.tick}): "${r.tile?.label ?? 'NOT SHOWN'}": lit ${lit ?? 'none'}; pixels changed (brighter) ${room.corners.map(c => `${c.id} ${d[c.id].n} (${d[c.id].up})`).join(', ')}; the cursor off: ${back} changed from before; the tiles ${T.map(t => `"${t.text}" ${t.purpose} ${t.sh}/${t.ch} px`).join(', ')}`);
            const want = id === 'r1:nl' ? 'Look: behind the door' : `Look: far ${id === 'r1:fr' ? 'right' : 'left'} corner`;
            if (!r.tile || lit !== id || r.tile.label !== want) bad.push(`${at} ${id}: ${JSON.stringify({ tile: r.tile, lit })}`);
            if (full) {
              if (!(id === 'r1:nl' ? d[id].up >= 4 : d[id].n >= 2 && d[id].up === d[id].n)) bad.push(`${at} ${id}: its tick ${JSON.stringify(d[id])}`);
              for (const c of room.corners) if (c.id !== id && d[c.id].n) bad.push(`${at} ${id}: ${c.id} changed ${d[c.id].n}`);
              if (back) bad.push(`${at} ${id}: ${back} pixels not back`);
            }
          }
        }
        // (3) a drawn house, C at 1600 × 900: from v0.0.28 its plan is briefed as the set house's (the intel, 'walls': the user's note of
        // 2026-11-20), so at room 1's stack its corner is known from the brief and lit behind the shut door, the room's inside still
        // unknown (before, a drawn house hid the spot: nothing changed on the stage)
        await page.setViewportSize({ width: 1600, height: 900 });
        await game.open('play=test-shoothouse&setup=go&tier=private&seed=48213&draw=drawn&nostore=1&panel=c');
        await page.waitForFunction(() => window.__ready && !!window.__olympus.panel()?.where, null, { timeout: 60000 });
        await page.waitForTimeout(800);
        const D = drawnRoom1(), hot = D.find(c => /nl$/.test(c.id)) ?? D[0], WD = await where(D);
        const bD = await shots(WD), rD = await reach(`watch:${hot.id}`), onD = await shots(WD), litD = await page.evaluate(() => window.__olympus.view?.hotLit ?? null);
        await leave(rD.held);
        const movedD = D.map(c => diff(bD[c.id], onD[c.id]).n).reduce((a, b) => a + b, 0);
        const otherD = D.filter(c => c.id !== hot.id).map(c => diff(bD[c.id], onD[c.id]).n).reduce((a, b) => a + b, 0);
        rows.push(`drawn house, C, at room 1's stack: "${rD.tile?.label ?? 'NOT SHOWN'}": lit ${litD ?? 'none'}; the unseen room's ${D.length} ticks, ${movedD} pixels changed (${otherD} off the lit one)`);
        if (!rD.tile || litD !== hot.id) bad.push(`drawn stack: ${JSON.stringify({ tile: rD.tile, litD, hot: hot.id })}`);
        if (!movedD || otherD) bad.push(`drawn stack: ${movedD} pixels changed, ${otherD} off the lit corner`);
      }, { port });
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, bad.join(' | '));
    },
  },
];
