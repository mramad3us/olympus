// The engine core and the HUD in a real browser (heavy): the title paper shows with no errors and the
// page says it's ready; ?play=sandbox&hour=6 still starts at 06:00 in v0.0.2's test rooms; a new
// career from the title opens in Echo's barracks, in bay-2-1, on Monday, Sol 590 of MY 211 at 12:39
// Melas time (CONTRACTS §2, §3), UTC on the watch's second line, the place line "Echo Company barracks
// · 1st Squad, 2nd Platoon", the squad at its racks; it walks by physical keys, Space and an open card
// pause, G holds time still until a digit (the instinct's line says so), R away from doors passes
// fifteen minutes with its toast; at the bay door the instinct's line offers "R open the door", R
// opens it and the line becomes "R close the door"; at most three toasts, top left, in their
// rectangle; J opens the log with its last lines; ? lists every key this build gives a meaning,
// labelled AZERTY, and in debug mode ^ and $; the HUD's rectangles never meet at 1920 × 1080,
// 1440 × 900 and 1024 × 768 (VIEWS §7.5); the menu's volume and mute are kept across a reload; and a
// save and a load in the page carry on byte for byte through a skip. The build sheet 0.0.3 §5.4. On
// OLYMPUS_TEST_PORT (8223 by default), so a parallel agent's run is its own.
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { rectsAt, overlaps } from '../src/ui/hud/layout.js';

const H = '__olympus';
// (the player's actor: where the sim keeps the player's place since 0.0.2)
const meIn = (h) => { const s = window[h].state, a = s.actors.list.find(x => x.id === s.player.actor); return { x: a.x, z: a.z, face: a.face }; };
// (the HUD's text as the player reads it)
const hudText = () => ({
  watch: document.querySelector('.watch')?.innerText ?? '', time: document.querySelector('.watch .t')?.textContent ?? '', day: document.querySelector('.watch .date')?.textContent ?? '',
  utc: document.querySelector('.watch .utc')?.textContent ?? '', place: document.querySelector('.watch .place')?.textContent ?? '',
  instinct: document.querySelector('.instinct')?.hidden ? '' : document.querySelector('.instinct')?.textContent ?? '', toasts: [...document.querySelectorAll('.toasts .toast')].map(t => t.textContent),
});
// (the frames for the sim to take a key and the HUD to show it: headless frames come 17 to 117 ms apart here)
const settle = (page, ms = 300) => page.waitForTimeout(ms);
/** Beside the door of the room the player stands in (the nearest, if it has several), on the room's side, facing it: { id, x, z, face } (from the area's own data). */
const besideDoor = (h) => {
  const s = window[h].state, me = s.actors.list.find(x => x.id === s.player.actor), area = window[h].areaRecord;
  const room = (area?.rooms ?? []).find(r => me.x >= r.rect[0] && me.x <= r.rect[2] && me.z >= r.rect[1] && me.z <= r.rect[3]);
  const doors = (area?.openings ?? []).filter(o => (o.kind === 'door' || o.kind === 'extDoor') && (!room || (o.rooms ?? []).includes(room.id)));
  let best = null;
  for (const o of doors) {
    const mx = o.axis === 'x' ? (o.a + o.b) / 2 : o.at, mz = o.axis === 'x' ? o.at : (o.a + o.b) / 2, d = Math.hypot(me.x - mx, me.z - mz);
    if (!best || d < best.d) best = { o, d, mx, mz };
  }
  if (!best) return null;
  // (the room's side of the door: where the room's middle lies, else where the player is)
  const { o, mx, mz } = best, cx = room ? (room.rect[0] + room.rect[2]) / 2 : me.x, cz = room ? (room.rect[1] + room.rect[3]) / 2 : me.z;
  const side = o.axis === 'x' ? Math.sign(cz - mz) || -1 : Math.sign(cx - mx) || -1;
  return o.axis === 'x' ? { id: o.id, room: room?.id ?? null, x: mx, z: mz + side * 0.6, face: side < 0 ? 'down' : 'up' } : { id: o.id, room: room?.id ?? null, x: mx + side * 0.6, z: mz, face: side < 0 ? 'right' : 'left' };
};

export default [
  {
    name: 'layout.js reserves VIEWS §7.5\'s rectangles apart at 1920 × 1080, 1440 × 900 and 1024 × 768, --ui 1.5, 1.13 and 0.85 (VIEWS\'s table: the bottom stack 1,080, 814 and 612 px, clear of KEYS by 222, 164 and 94)',
    fn() {
      for (const [w, h, ui, stack, clear] of [[1920, 1080, 1.5, 1080, 222], [1440, 900, 1.13, 814, 164], [1024, 768, 0.85, 612, 94]]) {
        const r = rectsAt(w, h), names = ['TOASTS', 'WATCH', 'INSTINCT', 'KEYS', 'PAUSED'], clash = [];
        for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) if (overlaps(r[names[i]], r[names[j]])) clash.push(`${names[i]} × ${names[j]}`);
        const gap = r.KEYS.x - (r.INSTINCT.x + r.INSTINCT.w);
        console.log(`      ${w} × ${h}: --ui ${r.ui}; the bottom stack ${fmt(r.INSTINCT.w, 0)} px, clear of KEYS by ${fmt(gap, 0)} px; PAUSED ${fmt(r.PAUSED.x - (r.TOASTS.x + r.TOASTS.w), 0)} px from TOASTS, ${fmt(r.WATCH.x - (r.PAUSED.x + r.PAUSED.w), 0)} from WATCH; meeting: ${clash.join(', ') || 'none'}`);
        assert(r.ui === ui && Math.abs(r.INSTINCT.w - stack) < 1 && Math.abs(gap - clear) < 1.5 && !clash.length, JSON.stringify({ r, gap, clash }));
      }
    },
  },
  {
    name: 'the title: OLYMPUS, the version, New career and Load a file on paper, no errors, __ready',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        const t = await page.evaluate(() => ({ text: document.querySelector('#title .sheet')?.innerText ?? '', shown: !document.querySelector('#title').hidden, ready: window.__ready, state: window.__olympus.state, version: window.__olympus.version, pending: window.__report.pending, warm: window.__report.view.warm, audio: window.__olympus.audio }));
        assert(t.shown && t.ready === true && t.state === null, JSON.stringify({ ...t, text: undefined }));
        assert(/OLYMPUS/.test(t.text) && t.text.includes(`v${t.version}`) && /New career/.test(t.text) && /Load a save file/.test(t.text), t.text);
        // (the sound made behind the title, suspended, nothing started or played before a key: engine.js prepare())
        assert(t.audio.contextState === 'suspended' && !t.audio.started && t.audio.steps === 0 && t.audio.doors === 0, `the sound before any key: ${JSON.stringify(t.audio)}`);
        const font = await page.evaluate(() => getComputedStyle(document.querySelector('#title h1')).fontFamily);
        assert(/Courier/.test(font), `the title's face: ${font}`);
        console.log(`      title up, v${t.version}, ready (pending: ${t.pending.length ? t.pending.join(', ') : 'nothing'}; warm-up ${t.warm ? `${t.warm.programs} programs, ${t.warm.ms} ms` : 'not reported'}); type ${font.split(',')[0]}; sound '${t.audio.contextState}' before any key (made at boot in ${fmt(t.audio.prepareMs ?? 0, 0)} ms); ${t.text.split('\n').filter(Boolean).slice(0, 4).join(' | ')}`);
      });
    },
  },
  {
    name: '?play=sandbox&hour=6 still starts at 06:00 on the Mars clock, in the test rooms',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        const w = await page.evaluate(hudText);
        assert(w.time.startsWith('06:0') && /Test rooms/.test(w.place), `the watch at ?hour=6: ${JSON.stringify(w)}`);
        console.log(`      watch '${w.time}' · '${w.day}' · '${w.utc}' · '${w.place}'`);
      }, { query: 'play=sandbox&seed=4&hour=6&nostore=1' });
    },
  },
  {
    name: 'a new career from the title opens in bay-2-1 at Sol 590 · 12:39 (Monday, MY 211; UTC 02:20 on the second line), the squad at its racks; it walks, Space and the menu pause, G holds time for a digit, R away from doors asks again and R twice waits 15 minutes',
    heavy: true,
    timeoutMs: 120000,
    async fn() {
      await withGame(async (page) => {
        await page.click('#title .item.career');
        await page.click('#title .item.ironman');
        // (the area's cut holds the loop: wait until it lifts)
        await page.waitForFunction((h) => window[h].state && !window[h].loop.paused && document.querySelector('.watch .t')?.textContent, H);
        await settle(page);
        const w = await page.evaluate(hudText);
        const s0 = await page.evaluate((h) => ({ mode: window[h].state.meta.mode, scenario: window[h].state.meta.scenario, area: window[h].area, actors: window[h].actors(), me: window[h].state.player.actor }), H);
        const others = s0.actors.filter(a => a.id !== s0.me);
        const postures = s0.actors.reduce((m, a) => ({ ...m, [a.posture]: (m[a.posture] ?? 0) + 1 }), {});
        console.log(`      ${s0.mode} career, ${s0.scenario} in ${s0.area}: watch '${w.time}' · '${w.day}' · '${w.utc}' · '${w.place}'; ${s0.actors.length} actors (${Object.entries(postures).map(([k, v]) => `${v} ${k}`).join(', ')}); the line '${w.instinct}'`);
        assert(s0.mode === 'ironman' && s0.scenario === 'barracks' && s0.area === 'melas.echo.1', JSON.stringify(s0));
        assert(w.time === '12:39' && w.day === 'Monday · Sol 590 · MY 211' && /02:20 UTC$/.test(w.utc) && /19 Dec 2351/.test(w.utc), JSON.stringify(w));
        assert(w.place === 'Echo Company barracks · 1st Squad, 2nd Platoon', `the place line: '${w.place}'`);
        assert(s0.actors.length >= 13 && !postures.lie && others.length >= 12, `the squad at its racks: ${JSON.stringify(postures)}`);
        // (KeyS then KeyD by code, whatever the layout: the keys labelled S and D on the user's AZERTY; into the aisle, then east along it)
        const p0 = await page.evaluate(meIn, H);
        await page.keyboard.down('KeyS'); await page.waitForTimeout(400); await page.keyboard.up('KeyS');
        await page.keyboard.down('KeyD'); await page.waitForTimeout(1000); await page.keyboard.up('KeyD');
        await page.waitForTimeout(100);
        const p1 = await page.evaluate(meIn, H), walked = Math.hypot(p1.x - p0.x, p1.z - p0.z);
        // (1.14 m/s for the 1.4 s of keys, less a frame either end and what the racks stop)
        assert(walked > 0.8 && walked < 2.2 && p1.x > p0.x, `walked ${fmt(walked, 2)} m: ${JSON.stringify({ p0, p1 })}`);
        // (Space: paused, the clock waits, PAUSED in its rectangle)
        await page.keyboard.press('Space');
        const c1 = await page.evaluate((h) => window[h].state.clock.ms, H);
        await page.waitForTimeout(500);
        const c2 = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, banner: document.querySelector('.banner').innerText, paused: window[h].loop.paused }), H);
        assert(c2.paused && c2.ms === c1 && /PAUSED/.test(c2.banner), JSON.stringify(c2));
        await page.keyboard.press('Space');
        // (Esc: the menu, a card of glass, holds a pause of its own, hides the HUD, offers the report and the sound)
        await page.keyboard.press('Escape');
        const m = await page.evaluate((h) => ({ card: !document.querySelector('.overlay').hidden, text: document.querySelector('.overlay').innerText, reasons: window[h].loop.pauseReasons, hud: document.querySelector('#hud').hidden, slider: !!document.querySelector('.glass.menu input.vol') }), H);
        assert(m.card && /Resume/.test(m.text) && /Report a problem/.test(m.text) && /Sound: (on|muted)/.test(m.text) && m.slider && m.reasons.join() === 'overlay:menu' && m.hud, JSON.stringify(m));
        await page.keyboard.press('Escape');
        const after = await page.evaluate((h) => window[h].loop.pauseReasons.length, H);
        assert(after === 0, 'the menu left a pause behind');
        // (G: weapon ready, stop motion; the instinct's line leads with it; Digit1 picks and time runs again)
        await page.keyboard.press('KeyG');
        await page.waitForFunction((h) => window[h].loop.held, H, { timeout: 5000 }).catch(() => {});
        const g1 = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, held: window[h].loop.held }), H);
        await page.waitForTimeout(500);
        const g2 = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, line: document.querySelector('.instinct').textContent }), H);
        assert(g1.held && g2.ms === g1.ms && /Time stands still/.test(g2.line), JSON.stringify({ g1, g2 }));
        await page.keyboard.press('Digit1');
        await page.waitForFunction((h) => !window[h].loop.held, H, { timeout: 5000 }).catch(() => {});
        await settle(page, 200);
        const g3 = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, held: window[h].loop.held, line: document.querySelector('.instinct').textContent }), H);
        assert(!g3.held && g3.ms > g1.ms, JSON.stringify(g3));
        // (R in the aisle, no door in reach: the first R only asks again, the clock untouched (v0.0.3's
        // review: R a step short of a door waited fifteen minutes); R again within 2 s: fifteen minutes
        // pass, a skip, and the toast says so)
        assert(/R\s*wait 15 min/.test(g3.line), `the line away from doors: '${g3.line}'`);
        await page.keyboard.press('KeyR');
        await settle(page, 300);
        const once = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, skip: !!window[h].state.skip, line: document.querySelector('.instinct').textContent }), H);
        assert(/R\s*again: wait 15 min/.test(once.line) && !once.skip && once.ms - g3.ms < 60000, `after one R: ${JSON.stringify(once)}`);
        await page.keyboard.press('KeyR');
        await page.waitForFunction(() => /minutes stepped/.test(document.querySelector('.toasts').innerText), null, { timeout: 5000 }).catch(() => {});
        const r = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, toast: document.querySelector('.toasts').innerText }), H);
        assert(r.ms - g3.ms >= 15 * 60000 && /15 min pass \(15 minutes stepped\)/.test(r.toast), JSON.stringify(r));
        const ui = await page.evaluate(() => new Promise(res => { const xs = []; const f = () => { xs.push(window.__report.frame?.uiMs ?? 0); if (xs.length < 120) requestAnimationFrame(f); else { xs.sort((a, b) => a - b); res({ median: xs[60], p95: xs[114], max: xs[119] }); } }; requestAnimationFrame(f); }));
        console.log(`      the HUD and the sound a frame (the watch, R's offer, the toasts, the foot-falls): median ${fmt(ui.median, 2)} ms, p95 ${fmt(ui.p95, 2)} ms, max ${fmt(ui.max, 2)} ms (CONTRACTS §7: the UI's DOM at most 1 ms)`);
        assert(ui.median <= 1, JSON.stringify(ui));
        console.log(`      walked ${fmt(walked, 2)} m by S then D; Space: clock still, '${c2.banner.replace(/\n/g, ' / ')}'; Esc: '${m.reasons}', the HUD hidden under it; G: '${g2.line}', the clock held ${g2.ms - g1.ms} ms over 0.5 s; '${g3.line}', R: '${once.line}', R again: +${fmt((r.ms - g3.ms) / 60000, 1)} min, '${r.toast.split('\n').pop()}'`);
      }, { query: 'nostore=1' });
    },
  },
  {
    name: 'R at the bay door: "R open the door", R opens it and the line becomes "R close the door"; at most three toasts, top left; J opens the log with its last lines',
    heavy: true,
    timeoutMs: 120000,
    async fn() {
      await withGame(async (page) => {
        // (the live area's record, from the page's own modules, for the door's place)
        await page.evaluate(async (h) => { const m = await import('/src/sim/places/model.js'); window[h].areaRecord = m.areaOf(window[h].area); }, H);
        const spot = await page.evaluate(besideDoor, H);
        assert(spot, 'no door in the player\'s area');
        await page.evaluate(([h, s]) => window[h].go(window[h].area, s.x, s.z, s.face), [H, spot]);
        await settle(page);
        const at = await page.evaluate(meIn, H);
        const o1 = await page.evaluate(hudText), offer1 = await page.evaluate((h) => window[h].offer(), H);
        const open0 = await page.evaluate(([h, id]) => { const s = window[h].state, d = s.places.sites?.[s.places.live.site]?.openings?.[id]; return (d?.state ?? window[h].areaRecord.openings.find(o => o.id === id).state ?? 'open') === 'open'; }, [H, spot.id]);
        const verb = (open) => (open ? 'close the door' : 'open the door');
        await page.keyboard.press('KeyR');
        await settle(page, 400);
        const o2 = await page.evaluate(hudText), state2 = await page.evaluate(([h, id]) => window[h].state.places.sites?.[window[h].state.places.live.site]?.openings?.[id] ?? 'as the template', [H, spot.id]);
        await page.keyboard.press('KeyR');
        await settle(page, 400);
        const o3 = await page.evaluate(hudText);
        console.log(`      ${spot.room ?? 'the area'}'s door: beside ${spot.id} (${open0 ? 'open' : 'closed'}) at (${fmt(at.x, 2)}, ${fmt(at.z, 2)}) facing ${at.face}: '${o1.instinct}' (${JSON.stringify(offer1)}); R: '${o2.instinct}' (${JSON.stringify(state2)}); R again: '${o3.instinct}'`);
        // (the barracks' bay doors stand closed in the template (build sheet 0.0.3 §2.1), so the first offer is to open it)
        assert(!/^melas\.echo/.test(await page.evaluate((h) => window[h].area, H)) || (spot.id === 'o:e1:bay-2-1' && !open0), `the bay's door: ${spot.id}, ${open0 ? 'open' : 'closed'} at the start`);
        assert(o1.instinct.includes(`R ${verb(open0)}`) && offer1?.target === spot.id, JSON.stringify({ o1, offer1 }));
        assert(o2.instinct.includes(`R ${verb(!open0)}`), `after R: '${o2.instinct}'`);
        assert(o3.instinct.includes(`R ${verb(open0)}`), `after R again: '${o3.instinct}'`);
        // (five lines said: three show, newest last, inside TOASTS)
        await page.evaluate((h) => { for (let i = 1; i <= 5; i++) window[h].bus.emit('line', { text: `Line ${i} of five, said to fill the toasts.` }); }, H);
        await settle(page, 200);
        const t = await page.evaluate(() => { const box = document.querySelector('.toasts').getBoundingClientRect(); return { lines: [...document.querySelectorAll('.toasts .toast')].map(e => ({ text: e.textContent, r: e.getBoundingClientRect() })), box: { x: box.x, y: box.y, w: box.width, h: box.height } }; });
        const inside = t.lines.every(l => l.r.left >= t.box.x - 0.5 && l.r.bottom <= t.box.y + t.box.h + 0.5);
        console.log(`      toasts: ${t.lines.length} showing (${t.lines.map(l => `'${l.text.slice(0, 7)}'`).join(', ')}) in ${fmt(t.box.w, 0)} × ${fmt(t.box.h, 0)} at (${fmt(t.box.x, 0)}, ${fmt(t.box.y, 0)}), all inside: ${inside}`);
        assert(t.lines.length <= 3 && t.lines[t.lines.length - 1].text.startsWith('Line 5') && inside && t.box.x < 40 && t.box.y < 40, JSON.stringify(t));
        // (J: the log card, its last lines; a debug skip wrote one)
        const n0 = await page.evaluate((h) => window[h].state.log.length, H);
        await page.evaluate((h) => window[h].act('debug:skip:900000'), H);
        await page.waitForFunction(([h, n]) => window[h].state.log.length > n && !window[h].state.skip, [H, n0], { timeout: 10000 });
        await page.keyboard.press('KeyJ');
        await page.waitForFunction(() => document.querySelector('.glass.log'), null, { timeout: 3000 });
        const log = await page.evaluate((h) => ({ lines: [...document.querySelectorAll('.glass.log .logline')].map(e => e.innerText.replace(/\s+/g, ' ')), reasons: window[h].loop.pauseReasons, records: window[h].state.log.length }), H);
        console.log(`      J: ${log.lines.length} lines of ${log.records} records, paused by '${log.reasons}'; last: '${log.lines[log.lines.length - 1]}'`);
        assert(log.lines.length >= 1 && log.lines.length <= 40 && /\[debug\] skipped 15 min/.test(log.lines[log.lines.length - 1]) && /^S\d+ \d\d:\d\d:\d\d/.test(log.lines[log.lines.length - 1]) && log.reasons.join() === 'overlay:log', JSON.stringify(log));
        await page.keyboard.press('KeyJ');
        const closed = await page.evaluate((h) => ({ card: document.querySelector('.glass.log'), reasons: window[h].loop.pauseReasons }), H);
        assert(!closed.card && !closed.reasons.length, 'J closes the log');
      }, { query: 'play=barracks&seed=48213&nostore=1' });
    },
  },
  {
    name: '? lists every key this build gives a meaning, labelled AZERTY (Z Q S D, Shift, Alt, R, G, J, Space, Esc, ?), and nothing else; in debug mode ^ and $',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        const read = async () => {
          await page.keyboard.press('?');
          await page.waitForFunction(() => document.querySelector('.glass.keys'));
          const rows = await page.evaluate(() => [...document.querySelectorAll('.glass.keys .keylist kbd')].map(k => [k.textContent, k.nextElementSibling.textContent]));
          await page.keyboard.press('Escape');
          return rows;
        };
        const rows = await read(), keys = rows.map(r => r[0]);
        console.log(`      keys: ${rows.map(([k, s]) => `${k} ${s}`).join(' | ')}`);
        const want = ['Z Q S D', 'Shift', /^(Alt|Option)$/, 'R', 'G', '1 … 0', 'J', 'Space', 'Esc', '?'];
        for (const w of want) assert(keys.some(k => (w instanceof RegExp ? w.test(k) : k === w)), `no row for ${w}: ${keys.join(', ')}`);
        for (const not of ['F', 'T', 'X', 'I', 'C', 'H', 'Tab', 'E', 'K', 'L', 'M']) assert(!keys.includes(not), `${not} does nothing in this build, yet it is on the card`);
        assert(/door/.test(rows.find(r => r[0] === 'R')[1]) && /wait 15 min/.test(rows.find(r => r[0] === 'R')[1]), `R's words: ${rows.find(r => r[0] === 'R')[1]}`);
        assert(!keys.includes('^') && !keys.includes('$'), 'the debug keys show only in debug mode');
        await page.goto(page.url().replace(/\?.*$/, '') + '?play=barracks&seed=2&nostore=1&debug=1');
        await page.waitForFunction(() => window.__ready === true);
        const dbg = await read();
        console.log(`      in debug mode: ${dbg.filter(([k]) => k === '^' || k === '$').map(([k, s]) => `${k} ${s}`).join(' | ')}`);
        assert(dbg.some(([k, s]) => k === '^' && /debug: 15 min pass/.test(s)) && dbg.some(([k, s]) => k === '$' && /debug: 1 h pass/.test(s)), JSON.stringify(dbg));
      }, { query: 'play=barracks&seed=2&nostore=1' });
    },
  },
  {
    name: 'the HUD\'s rectangles never meet at 1920 × 1080, 1440 × 900 and 1024 × 768 (VIEWS §7.5), each where layout.js reserves it',
    heavy: true,
    timeoutMs: 120000,
    async fn() {
      await withGame(async (page) => {
        for (const [w, h] of [[1920, 1080], [1440, 900], [1024, 768]]) {
          await page.setViewportSize({ width: w, height: h });
          await settle(page, 300);
          const rect = (sels) => page.evaluate((list) => Object.fromEntries(list.map(([n, sel]) => {
            const e = document.querySelector(sel);
            if (!e || e.hidden) return [n, null];
            const b = e.getBoundingClientRect();
            return [n, { x: b.x, y: b.y, w: b.width, h: b.height, over: e.scrollHeight > e.clientHeight + 1 }];
          })), sels);
          const ui = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ui').trim());
          const live = await rect([['TOASTS', '.toasts'], ['WATCH', '.watch'], ['INSTINCT', '.instinct'], ['KEYS', '.keyshint']]);
          await page.keyboard.press('Space');                          // (paused: PAUSED shows, R's offer goes)
          await settle(page, 200);
          const paused = await rect([['PAUSED', '.banner']]);
          await page.keyboard.press('Space');
          const got = { ui, ...live, ...paused };
          const want = rectsAt(w, h), names = ['TOASTS', 'WATCH', 'INSTINCT', 'KEYS', 'PAUSED'];
          const shown = names.filter(n => got[n]);
          const clash = [];
          for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) if (overlaps(got[shown[i]], got[shown[j]])) clash.push(`${shown[i]} × ${shown[j]}`);
          const off = shown.filter(n => Math.abs(got[n].x - want[n].x) > 1.5 || Math.abs(got[n].y - want[n].y) > 1.5 || got[n].w > want[n].w + 1.5 || got[n].h > want[n].h + 1.5);
          const spill = shown.filter(n => got[n].over);
          console.log(`      ${w} × ${h}, --ui ${got.ui} (layout.js ${want.ui}): ${shown.map(n => `${n} ${fmt(got[n].w, 0)}×${fmt(got[n].h, 0)} at (${fmt(got[n].x, 0)}, ${fmt(got[n].y, 0)})`).join(', ')}; meeting: ${clash.join(', ') || 'none'}; off their reservation: ${off.join(', ') || 'none'}; spilling: ${spill.join(', ') || 'none'}`);
          assert(Number(got.ui) === want.ui && shown.length === 5 && !clash.length && !off.length && !spill.length, JSON.stringify({ got, want, clash, off, spill }));
        }
      }, { query: 'play=barracks&seed=48213&nostore=1' });
    },
  },
  {
    name: 'the menu\'s master volume and mute are kept in the profile across a reload',
    heavy: true,
    timeoutMs: 90000,
    async fn() {
      await withGame(async (page) => {
        const read = () => page.evaluate((h) => ({ volume: window[h].audio.volume, muted: window[h].audio.muted }), H);
        const before = await read();
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.querySelector('.glass.menu input.vol'));
        // (0.30 set, then the slider taken by the keyboard: → one step up, 0.35; the digit 6 and Esc still the card's while it has focus)
        await page.evaluate(() => { const s = document.querySelector('.glass.menu input.vol'); s.value = '0.3'; s.dispatchEvent(new Event('input', { bubbles: true })); s.focus(); });
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Digit6');                          // (6: Sound on → muted)
        const set = await read();
        await page.keyboard.press('Escape');
        const closed = await page.evaluate(() => document.querySelector('.overlay').hidden);
        assert(closed, 'Esc with the slider in focus closes the menu');
        await page.waitForTimeout(800);                                // (the profile is written 300 ms after the last change)
        await page.reload();
        await page.waitForFunction(() => window.__ready === true);
        await page.waitForTimeout(300);
        const after = await read();
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.querySelector('.glass.menu input.vol'));
        const shown = await page.evaluate(() => ({ slider: document.querySelector('.glass.menu input.vol').value, line: document.querySelector('.glass.menu .item.mute').textContent }));
        console.log(`      before ${JSON.stringify(before)}; set ${JSON.stringify(set)}; after a reload ${JSON.stringify(after)}, the menu shows ${shown.slider} and '${shown.line}'`);
        assert(set.volume === 0.35 && set.muted && after.volume === 0.35 && after.muted && shown.slider === '0.35' && /muted/.test(shown.line), JSON.stringify({ set, after, shown }));
      }, { query: 'play=sandbox&seed=3' });
    },
  },
  {
    name: 'determinism in the page: a save, 400 ticks, a skip, 400 ticks; loaded and run again, the same bytes',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        const res = await page.evaluate((h) => {
          const o = window[h];
          o.pause(true);
          const json = o.save();
          const run = () => { o.step(400, { mx: 1, mz: 0 }); o.skip(20 * 60000, { what: 'chow' }); o.step(400, { mx: -1, run: true }); };
          run();
          const a = o.save();
          o.start(json); o.pause(true);
          run();
          const s = o.state, me = s.actors.list.find(x => x.id === s.player.actor);
          return { same: a === o.save(), bytes: a.length, x: me.x, ms: s.clock.ms - JSON.parse(json).clock.ms };
        }, H);
        assert(res.same, 'a loaded save carried on differently');
        console.log(`      800 ticks and a 20-min skip, twice from one save: identical (${res.bytes} bytes; x ${fmt(res.x, 2)} m; ${fmt(res.ms / 60000, 1)} game minutes)`);
      }, { query: 'play=sandbox&seed=4&hour=6&nostore=1' });
    },
  },
  {
    name: 'the title from the keyboard: Tab, the arrows and S move between its buttons and Enter presses one (0.0.2: focus stayed on New career)',
    heavy: true,
    async fn() {
      await withGame(async (page, errors) => {
        const focused = () => page.evaluate(() => document.activeElement?.className ?? null);
        const start = await focused();
        await page.keyboard.press('ArrowDown'); const down = await focused();
        await page.keyboard.press('KeyS'); const s = await focused();
        await page.keyboard.press('ArrowUp'); const up = await focused();
        await page.keyboard.press('Tab'); const tab = await focused();
        // (to New career and Enter: the enlistment page, whose buttons the arrows walk too, Esc back)
        await page.evaluate(() => document.querySelector('#title .item.career').focus());
        await page.keyboard.press('Enter');
        const enlist = await page.evaluate(() => window.__olympus && document.querySelector('#title .sheet.enlist') !== null);
        await page.keyboard.press('ArrowDown'); const e1 = await focused();
        await page.keyboard.press('ArrowDown'); const e2 = await focused();
        console.log(`      the title: ${start} → ArrowDown ${down} → S ${s} → ArrowUp ${up} → Tab ${tab}; Enter on New career: the enlistment page ${enlist}, its arrows ${e1} → ${e2}`);
        assert(start === 'item lead career' && down === 'item load' && s === 'item lead career' && up === 'item load' && tab !== start, JSON.stringify({ start, down, s, up, tab }));
        assert(enlist && e1 === 'item ironman' && e2 === 'item small', JSON.stringify({ enlist, e1, e2 }));
        await page.keyboard.press('Escape');
        assert(!errors.length, errors.join('\n'));
      });
    },
  },
];
