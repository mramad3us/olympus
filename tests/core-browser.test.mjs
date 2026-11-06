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
// The 0.0.4 round's (the build sheet §5.4): test-shower from the title's Tests: its goal; "shower · 10
// min, done 19:4x" at a free stall; R: the splash, timed frame by frame (the zoom in, the fast watch,
// "Water off." in the ticker, the strip with the grime glyph emptying, the zoom out, 4.3 s), the end
// card, Score, Copy my scores giving ROADMAP §2.2's line; Again: Esc in the splash opens the menu and
// freezes it, Space snaps it to the end; Again: Backspace at minute 2 lands in a towel with "finish your
// shower"; C opens PERSONNEL. test-night: at the rack in PT kit, R held shows the choices, R the night's
// splash to the klaxon's exact second, ALARM, the urgent line, T rises, T dresses, the count; R held
// mid-drill and "sleep until reveille" brings the late card; a debug hour to the stand-down, the end
// card. The splash's rectangles apart at the three window sizes.
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

// ---- the 0.0.4 round: the splash, the instinct, the cards, the scenes ----
// (a spot of the live area by id, from the page's own modules: { x, z, face })
const spotIn = async (page, spotId) => page.evaluate(async ([h, id]) => {
  const fx = await import('/src/sim/places/fixtures.js'), m = await import('/src/sim/places/model.js');
  const area = m.areaOf(window[h].area), f = area.fixtures.find(x => id.startsWith(`${x.id}#`));
  return f ? fx.spotsOf(f).find(p => p.id === id) ?? null : null;
}, [H, spotId]);
// (every frame's splash, sampled after the game's frame, until the splash has gone: the timeline)
const sampleSplash = (page, { maxS = 30 } = {}) => page.evaluate(([h, maxS]) => new Promise((resolve) => {
  const out = [], t0 = performance.now();
  let started = false;
  const f = () => {
    const sp = window[h].splash(), hud = window.__report.hud?.splash ?? null, t = (performance.now() - t0) / 1000;
    if (sp) { started = true; out.push({ t, phase: sp.phase, shownMs: sp.shownMs, clock: hud?.clock ?? '', plaque: hud?.plaque ?? null, ticker: hud?.ticker ?? '', strip: hud?.strip ?? [], paused: window[h].loop.pauseReasons.slice(), simMs: window[h].state.clock.ms }); }
    if ((started && !sp) || t > maxS) resolve(out); else requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}), [H, maxS]);
const phasesOf = (tl) => { const p = {}; for (let i = 1; i < tl.length; i++) p[tl[i - 1].phase] = (p[tl[i - 1].phase] ?? 0) + (tl[i].t - tl[i - 1].t); return p; };
const fmtPhases = (p) => ['in', 'lapse', 'decel', 'beat', 'strip', 'out'].filter(k => p[k]).map(k => `${k} ${fmt(p[k], 2)}`).join(', ');
const lineOf = () => ({ line: document.querySelector('.instinct .line')?.textContent ?? '', tone: document.querySelector('.instinct .line')?.className ?? '', offer: document.querySelector('.instinct .chip.offer')?.textContent ?? '', all: document.querySelector('.instinct')?.textContent ?? '' });
const playing = (page) => page.waitForFunction((h) => window[h].state && !window[h].loop.paused && !window[h].splash() && document.querySelector('.watch .t')?.textContent, H, { timeout: 30000 });

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
        // (the wait's own line says what passed, once: no second "15 min pass" toast, the review of v0.0.4)
        const WAITED = /15 min of standing by|Hurry up and wait: 15 min|Nothing happened for 15 min|15 min of waiting/;
        await page.waitForFunction((src) => new RegExp(src).test(document.querySelector('.toasts').textContent) && !window.__olympus.splash(), WAITED.source, { timeout: 15000 }).catch(() => {});
        const r = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, toast: document.querySelector('.toasts').textContent }), H);
        assert(r.ms - g3.ms >= 15 * 60000 && WAITED.test(r.toast) && !/minutes stepped/.test(r.toast), JSON.stringify(r));
        const ui = await page.evaluate(() => new Promise(res => { const xs = []; const f = () => { xs.push(window.__report.frame?.uiMs ?? 0); if (xs.length < 120) requestAnimationFrame(f); else { xs.sort((a, b) => a - b); res({ median: xs[60], p95: xs[114], max: xs[119] }); } }; requestAnimationFrame(f); }));
        console.log(`      the HUD and the sound a frame (the watch, R's offer, the toasts, the foot-falls): median ${fmt(ui.median, 2)} ms, p95 ${fmt(ui.p95, 2)} ms, max ${fmt(ui.max, 2)} ms (CONTRACTS §7: the UI's DOM at most 1 ms)`);
        assert(ui.median <= 1, JSON.stringify(ui));
        console.log(`      walked ${fmt(walked, 2)} m by S then D; Space: clock still, '${c2.banner.replace(/\n/g, ' / ')}'; Esc: '${m.reasons}', the HUD hidden under it; G: '${g2.line}', the clock held ${g2.ms - g1.ms} ms over 0.5 s; '${g3.line}', R: '${once.line}', R again: +${fmt((r.ms - g3.ms) / 60000, 1)} min, '${r.toast.match(/15 min pass[^.]*\./)?.[0]}'`);
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
        // (the debug skip has its short splash now: J is the log's once it has played out)
        await page.waitForFunction(([h, n]) => window[h].state.log.length > n && !window[h].state.skip && !window[h].splash(), [H, n0], { timeout: 10000 });
        await page.keyboard.press('KeyJ');
        await page.waitForFunction(() => document.querySelector('.glass.log'), null, { timeout: 3000 });
        const log = await page.evaluate((h) => ({ lines: [...document.querySelectorAll('.glass.log .logline')].map(e => e.innerText.replace(/\s+/g, ' ')), reasons: window[h].loop.pauseReasons, records: window[h].state.log.length }), H);
        console.log(`      J: ${log.lines.length} lines of ${log.records} records, paused by '${log.reasons}'; last: '${log.lines[log.lines.length - 1]}'`);
        // (the debug line, then the skip's own line from time's activity: 'idle', "15 min went by.")
        const dbg = log.lines.findLast(l => /\[debug\] skipped 15 min/.test(l));
        assert(log.lines.length >= 1 && log.lines.length <= 40 && dbg && log.lines.indexOf(dbg) >= log.lines.length - 2 && /^S\d+ \d\d:\d\d:\d\d/.test(dbg) && log.reasons.join() === 'overlay:log', JSON.stringify(log));
        await page.keyboard.press('KeyJ');
        const closed = await page.evaluate((h) => ({ card: document.querySelector('.glass.log'), reasons: window[h].loop.pauseReasons }), H);
        assert(!closed.card && !closed.reasons.length, 'J closes the log');
      }, { query: 'play=barracks&seed=48213&nostore=1' });
    },
  },
  {
    name: '? lists every key this build gives a meaning, labelled AZERTY (Z Q S D, Shift, Alt, R, T, G, C, J, Space, Esc, ?, and in a splash Space and Backspace), and nothing else; in debug mode ^ and $',
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
        const want = ['Z Q S D', 'Shift', /^(Alt|Option)$/, 'R', 'T', 'G', '1 … 0', 'C', 'J', 'Space', 'Esc', '?', 'Backspace'];
        for (const w of want) assert(keys.some(k => (w instanceof RegExp ? w.test(k) : k === w)), `no row for ${w}: ${keys.join(', ')}`);
        for (const not of ['F', 'X', 'I', 'H', 'Tab', 'E', 'K', 'L', 'M']) assert(!keys.includes(not), `${not} does nothing in this build, yet it is on the card`);
        assert(/door/.test(rows.find(r => r[0] === 'R')[1]) && /wait 15 min/.test(rows.find(r => r[0] === 'R')[1]) && /held: the choices/.test(rows.find(r => r[0] === 'R')[1]), `R's words: ${rows.find(r => r[0] === 'R')[1]}`);
        assert(/instinct/.test(rows.find(r => r[0] === 'T')[1]) && /character sheet/.test(rows.find(r => r[0] === 'C')[1]) && rows.some(([k, w]) => k === 'Space' && /to the end/.test(w)), 'T, C and the splash\'s Space');
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
    name: 'the title from the keyboard: Tab, the arrows and S move between its buttons (New career, Load, Tests) and Enter presses one (0.0.2: focus stayed on New career)',
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
        assert(start === 'item lead career' && down === 'item load' && s === 'item tests' && up === 'item load' && tab !== start, JSON.stringify({ start, down, s, up, tab }));
        assert(enlist && e1 === 'item ironman' && e2 === 'item small', JSON.stringify({ enlist, e1, e2 }));
        await page.keyboard.press('Escape');
        assert(!errors.length, errors.join('\n'));
      });
    },
  },
  {
    name: 'test-shower from the title\'s Tests: the goal; "shower · 10 min, done 19:4x" at a free stall; R: the splash (the zoom in, the fast watch, "Water off.", the strip with the grime glyph emptying, the zoom out, 4.3 s); the end card, Score, Copy my scores; Again: Esc freezes it under the menu, Space snaps it to the end; Again: Backspace at minute 2 lands in a towel with "finish your shower"; C opens PERSONNEL',
    heavy: true,
    timeoutMs: 240000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: game.origin });
        await page.click('#title .item.tests');
        const list = await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].map(b => b.innerText.split('\n')[0]));
        console.log(`      Tests: ${list.join(' | ')}`);
        assert(list.includes('Ten minutes under the shower') && list.includes('The klaxon at 02:30'), JSON.stringify(list));
        await page.click('#title .item.scene');                    // (the first: the shower)
        await playing(page);
        const goal = await page.evaluate(() => document.querySelector('.toasts').textContent);
        const s0 = await page.evaluate((h) => ({ scene: window[h].scene, time: document.querySelector('.watch .t').textContent, actors: window[h].actors().length }), H);
        console.log(`      the scene: ${JSON.stringify(s0.scene)} at ${s0.time}; the goal '${goal.slice(0, 80)}…'`);
        assert(s0.scene?.id === 'test-shower' && /Filthy after PT/.test(goal) && /^19:3/.test(s0.time), JSON.stringify({ s0, goal }));
        // (to Head A's second stall, standing in it)
        const sp = await spotIn(page, 'f:e1:head-2a:shower-2#1');
        await page.evaluate(([h, p]) => window[h].go(window[h].area, p.x, p.z, p.face), [H, sp]);
        await settle(page, 500);
        const at = await page.evaluate(lineOf);
        console.log(`      at the stall: '${at.all}'`);
        assert(/R\s*shower · 10 min, done 19:4\d/.test(at.offer), `the stall's offer: ${JSON.stringify(at)}`);
        const sheetBefore = await page.evaluate((h) => window[h].body()?.strip?.find(e => e.need === 'grime'), H);
        // (R: the splash, every frame sampled)
        const tl0 = sampleSplash(page);
        await page.keyboard.press('KeyR');
        const tl = await tl0, ph = phasesOf(tl), total = tl.length ? tl.at(-1).t - tl[0].t : 0;
        const clocks = [...new Set(tl.map(x => x.clock))], tickers = [...new Set(tl.map(x => x.ticker).filter(Boolean))], strips = tl.filter(x => x.strip.length);
        const after = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, me: window[h].actors().find(a => a.id === window[h].state.player.actor), body: window[h].body() }), H);
        const grimeAfter = after.body?.strip?.find(e => e.need === 'grime');
        console.log(`      the splash: ${fmt(total, 2)} s sampled over ${tl.length} frames (${fmtPhases(ph)}); the watch showed ${clocks.join(' ')}; the ticker: ${tickers.map(x => `'${x}'`).join(', ')}; the strip: ${strips[0]?.strip.join(', ') ?? 'none'}; grime ${sheetBefore?.band} (${sheetBefore?.fill}) → ${grimeAfter?.band} (${grimeAfter?.fill}); after: ${after.me?.outfit}, hair wet ${JSON.stringify(after.body?.cues?.wetK)}`);
        assert(clocks.length >= 5 && tickers.some(x => /Water off/.test(x)) && strips.length > 0 && strips[0].strip.some(x => /^grime /.test(x)), JSON.stringify({ clocks, tickers, strip: strips[0]?.strip }));
        assert(Math.abs(total - 4.29) < 0.45, `the shower's splash: ${fmt(total, 2)} s`);
        assert(tl.filter(x => x.phase === 'strip' || x.phase === 'out').every(x => x.paused.includes('splash')) && tl.filter(x => x.phase === 'lapse').every(x => !x.paused.includes('splash')), 'the pause from the landing to the zoom out only');
        // (the scene's last picture held, the line saying Enter ends it: you clean and wet-headed, C over the world (the review of v0.0.4); then Enter, the end card)
        await settle(page, 600);
        const held = await page.evaluate((h) => ({ card: !!document.querySelector('.glass.end'), line: document.querySelector('.instinct')?.textContent ?? '', scene: window[h].scene }), H);
        await page.keyboard.press('KeyC');
        const sheetUp = await page.waitForFunction(() => document.querySelector('.glass.sheetcard'), null, { timeout: 3000 }).then(() => true).catch(() => false);
        await page.keyboard.press('KeyC');
        await settle(page, 200);
        console.log(`      after the splash: the end card ${held.card ? 'open' : 'held'}, the line '${held.line}', C over the world ${sheetUp}`);
        assert(!held.card && /Enter: end the scene/.test(held.line) && held.scene.ended && sheetUp, JSON.stringify(held));
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('.glass.end'), null, { timeout: 10000 });
        const end = await page.evaluate(() => document.querySelector('.glass.end').innerText);
        await page.keyboard.press('Digit3');
        await page.waitForFunction(() => document.querySelector('.glass.score'));
        await page.evaluate(() => { const r = document.querySelector('.glass.score input.score[data-aspect="splash"]'); r.value = '85'; r.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('.glass.score .note-in').value = 'a test of the line'; document.querySelector('.glass.score .note-in').dispatchEvent(new Event('input', { bubbles: true })); });
        await page.click('.glass.score .copy');
        await page.waitForFunction(() => /Copied|failed/.test(document.querySelector('.glass.score .copied').textContent), null, { timeout: 5000 });
        const sc = await page.evaluate(async (h) => ({ clip: await navigator.clipboard.readText().catch(e => `(no read: ${e.message})`), kept: window[h].scores() }), H);
        console.log(`      the end card: '${end.split('\n').filter(Boolean).slice(0, 3).join(' | ')}'; Copy my scores: '${sc.clip}'; kept ${sc.kept.scores.length}`);
        assert(new RegExp(`^OLYMPUS v${await page.evaluate((h) => window[h].version, H)} · test-shower · seed \\d+ · splash 85 · vignette 50 · pace 50 · ★ no · note: a test of the line$`).test(sc.clip) && sc.kept.scores.at(-1)?.aspects?.splash === 85, JSON.stringify(sc));
        // (Done: the end card again; Again with the same seed)
        await page.keyboard.press('Digit2');
        await page.waitForFunction(() => document.querySelector('.glass.end'));
        await page.keyboard.press('Digit1');
        await playing(page);
        await page.evaluate(([h, p]) => window[h].go(window[h].area, p.x, p.z, p.face), [H, sp]);
        await settle(page, 500);
        // (Esc in the splash: the menu, and the splash frozen under it; Esc again, then Space: to the end)
        await page.keyboard.press('KeyR');
        await page.waitForFunction((h) => window[h].splash()?.phase === 'lapse' && window[h].splash().lapseT > 0.5, H, { timeout: 10000 });
        await page.keyboard.press('Escape');
        await settle(page, 100);
        const f0 = await page.evaluate((h) => ({ menu: !!document.querySelector('.glass.menu'), sp: window[h].splash(), ms: window[h].state.clock.ms }), H);
        await settle(page, 700);
        const f1 = await page.evaluate((h) => ({ sp: window[h].splash(), ms: window[h].state.clock.ms }), H);
        await page.keyboard.press('Escape');
        await settle(page, 100);
        const tSpace = Date.now();
        await page.keyboard.press('Space');
        await page.waitForFunction((h) => !window[h].splash(), H, { timeout: 10000 });
        const spaceS = (Date.now() - tSpace) / 1000, ms2 = await page.evaluate((h) => window[h].state.clock.ms, H);
        console.log(`      Esc in the lapse: the menu ${f0.menu}, the splash held at ${fmt(f0.sp.lapseT, 2)} s → ${fmt(f1.sp.lapseT, 2)} s and the clock ${f0.ms === f1.ms ? 'still' : 'moving'} over 0.7 s; Space: the rest in ${fmt(spaceS, 2)} s, the clock ${fmt((ms2 - f0.ms) / 60000, 1)} min on`);
        assert(f0.menu && f1.sp.lapseT === f0.sp.lapseT && f1.ms === f0.ms && spaceS < 2.5, JSON.stringify({ f0: f0.sp, f1: f1.sp, spaceS }));
        // (the end card after its hold: END_HOLD_S of play)
        await page.waitForFunction(() => document.querySelector('.glass.end'), null, { timeout: 20000 });
        await page.keyboard.press('Digit1');
        await playing(page);
        await page.evaluate(([h, p]) => window[h].go(window[h].area, p.x, p.z, p.face), [H, sp]);
        await settle(page, 500);
        // (Backspace once the shown clock is two minutes on: the landing in a towel, the resume offered, the scene not over)
        const from = await page.evaluate((h) => window[h].state.clock.ms, H);
        await page.keyboard.press('KeyR');
        await page.waitForFunction(([h, from]) => (window[h].splash()?.shownMs ?? 0) >= from + 120000, [H, from], { timeout: 10000 });
        await page.keyboard.press('Backspace');
        await page.waitForFunction((h) => !window[h].splash(), H, { timeout: 10000 });
        await settle(page, 400);
        const cut = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, me: window[h].actors().find(a => a.id === window[h].state.player.actor), line: document.querySelector('.instinct').textContent, scene: window[h].scene, end: !!document.querySelector('.glass.end') }), H);
        console.log(`      Backspace at minute 2: landed at +${fmt((cut.ms - from) / 60000, 2)} min in ${cut.me.outfit}; the line '${cut.line}'; the scene over: ${cut.scene.ended}`);
        assert(cut.me.outfit === 'towel' && /finish your shower · \d+ min/.test(cut.line) && !cut.scene.ended && !cut.end, JSON.stringify(cut));
        // (C: PERSONNEL, the doll, ON YOU in words, THE FILE; C again closes it)
        await page.keyboard.press('KeyC');
        await page.waitForFunction(() => document.querySelector('.glass.sheetcard'));
        const sheet = await page.evaluate((h) => ({ text: document.querySelector('.glass.sheetcard').innerText, doll: !!document.querySelector('.glass.sheetcard canvas.doll'), glyphs: document.querySelectorAll('.glass.sheetcard .glyph').length, reasons: window[h].loop.pauseReasons }), H);
        await page.keyboard.press('KeyC');
        const closed = await page.evaluate(() => !document.querySelector('.glass.sheetcard'));
        console.log(`      C: PERSONNEL with the doll ${sheet.doll}, ${sheet.glyphs} glyphs, paused by ${sheet.reasons}; '${sheet.text.split('\n').filter(Boolean).slice(0, 12).join(' | ')}'; C closes it: ${closed}`);
        assert(sheet.doll && sheet.glyphs === 9 && /On you/i.test(sheet.text) && /The file/i.test(sheet.text) && /Private/.test(sheet.text) && sheet.reasons.includes('overlay:sheet') && closed, JSON.stringify(sheet));
        // (thirsty at a sink: the drink on the chip, T held drinks there, lived, the tap running. The thirst is
        // set on the body's water ledger in the page, as a scene's fill sets its ledgers: a fixture, not a rule)
        const sink = await spotIn(page, 'f:e1:head-2a:sinks-1#1');
        await page.evaluate(([h, p]) => window[h].go(window[h].area, p.x, p.z, p.face), [H, sink]);
        await page.evaluate((h) => { const st = window[h].state, b = st.people[st.player.id].body; (b.water ??= {}).balanceL = -1.5; }, H);
        await page.waitForFunction(() => /Drink/.test(document.querySelector('.instinct')?.textContent ?? ''), null, { timeout: 5000 }).catch(() => {});
        const thirsty = await page.evaluate(lineOf);
        await page.keyboard.down('KeyT'); await page.waitForTimeout(350); await page.keyboard.up('KeyT');
        await page.waitForFunction((h) => window[h].state.time?.doing?.activity === 'drink', H, { timeout: 3000 }).catch(() => {});
        const drink = await page.evaluate((h) => ({ doing: window[h].state.time?.doing ?? null }), H);
        console.log(`      thirsty at a sink: '${thirsty.all}'; T held: ${drink.doing?.activity} (${drink.doing?.mode})`);
        assert(/T held\s*Drink/.test(thirsty.all) && drink.doing?.activity === 'drink' && drink.doing.mode === 'live', JSON.stringify({ thirsty, drink }));
      }, { query: 'nostore=1' });
    },
  },
  {
    name: 'test-night: at the rack in PT kit at 21:55, R held shows the choices; R: the night\'s splash stopped at the klaxon\'s exact second (02:30:00.091), ALARM; the urgent line, T rises, T dresses, the count; R held mid-drill and "sleep until reveille" brings the late card; a debug hour to the stand-down, the end card; the splash\'s rectangles apart at three window sizes',
    heavy: true,
    timeoutMs: 240000,
    async fn() {
      await withGame(async (page) => {
        await playing(page);
        const s0 = await page.evaluate((h) => ({ scene: window[h].scene, time: document.querySelector('.watch .t').textContent, me: window[h].actors().find(a => a.id === window[h].state.player.actor), forced: window[h].state.time?.drills?.forced, line: document.querySelector('.instinct').textContent }), H);
        console.log(`      ${s0.scene?.id} at ${s0.time}, in ${s0.me.outfit} at (${s0.me.x}, ${s0.me.z}); the drill forced at ${s0.forced}; the line '${s0.line}'`);
        assert(s0.scene?.id === 'test-night' && s0.me.outfit === 'pt' && /R\s*sleep until reveille · \d+ h( \d+ min)?, done 05:30/.test(s0.line), JSON.stringify(s0));
        // (the splash's rectangles at the three windows: a debug 15 minutes each, before taps' night, sampled mid-lapse)
        for (const [w, hgt] of [[1920, 1080], [1440, 900], [1024, 768]]) {
          await page.setViewportSize({ width: w, height: hgt });
          await settle(page, 200);
          await page.evaluate((h) => window[h].act('debug:skip:900000'), H);
          await page.waitForFunction((h) => window[h].splash()?.phase === 'lapse', H, { timeout: 5000 });
          const r = await page.evaluate(() => Object.fromEntries([['CLOCK', '.splash-clock'], ['RADIO', '.radio'], ['INSTINCT', '.instinct.ticker'], ['WATCH', '.watch'], ['TOASTS', '.toasts']].map(([n, sel]) => { const e = document.querySelector(sel); if (!e || e.hidden || e.offsetParent === null && getComputedStyle(e).position !== 'fixed') return [n, null]; const b = e.getBoundingClientRect(); return [n, b.width ? { x: b.x, y: b.y, w: b.width, h: b.height } : null]; })));
          const want = rectsAt(w, hgt), shown = Object.keys(r).filter(n => r[n]);
          const clash = [];
          for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) if (overlaps(r[shown[i]], r[shown[j]])) clash.push(`${shown[i]} × ${shown[j]}`);
          const off = shown.filter(n => want[n] && (Math.abs(r[n].x - want[n].x) > 1.5 || Math.abs(r[n].y - want[n].y) > 1.5));
          console.log(`      ${w} × ${hgt} in a splash: ${shown.map(n => `${n} ${fmt(r[n].w, 0)}×${fmt(r[n].h, 0)} at (${fmt(r[n].x, 0)}, ${fmt(r[n].y, 0)})`).join(', ')}; meeting: ${clash.join(', ') || 'none'}; off: ${off.join(', ') || 'none'}`);
          assert(shown.includes('CLOCK') && shown.includes('INSTINCT') && !shown.includes('WATCH') && !shown.includes('TOASTS') && !clash.length && !off.length, JSON.stringify({ r, clash, off }));
          await page.waitForFunction((h) => !window[h].splash(), H, { timeout: 15000 });
        }
        await page.setViewportSize({ width: 1280, height: 720 });
        await settle(page, 300);
        // (R held: the choices card, Esc for nothing)
        await page.keyboard.down('KeyR'); await page.waitForTimeout(350); await page.keyboard.up('KeyR');
        await page.waitForFunction(() => document.querySelector('.glass.choose'), null, { timeout: 3000 });
        const choices = await page.evaluate(() => [...document.querySelectorAll('.glass.choose .item')].map(b => b.innerText.replace(/\s+/g, ' ')));
        await page.keyboard.press('Escape');
        console.log(`      R held: ${choices.join(' | ')}`);
        assert(choices.length >= 4 && choices.some(c => /nap/.test(c)), JSON.stringify(choices));
        // (R: the night, sampled; the klaxon stops it at its second)
        const tl0 = sampleSplash(page, { maxS: 40 });
        await page.keyboard.press('KeyR');
        const tl = await tl0, ph = phasesOf(tl);
        const land = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, ticks: window[h].state.clock.ms % 50, time: document.querySelector('.watch .t').textContent, line: document.querySelector('.instinct .line')?.textContent ?? '', tone: document.querySelector('.instinct .line')?.className ?? '' }), H);
        const plaques = [...new Set(tl.map(x => x.plaque).filter(Boolean))], slips = tl.filter(x => /^24:00/.test(x.clock)).length;
        console.log(`      the night: ${fmt(tl.at(-1).t - tl[0].t, 2)} s (${fmtPhases(ph)}); through the slip in ${slips} frames; plaques ${plaques.join(', ')}; landed at ${land.ms} (${land.time}, on the tick grid: ${land.ticks === 0}); the line '${land.line}' (${land.tone})`);
        assert(land.ms === 23532601000 && plaques.includes('ALARM') && ph.beat > 0.4 && !ph.strip && slips > 0, JSON.stringify({ land, plaques, ph }));
        assert(/urgent/.test(land.tone) && /Klaxon/i.test(land.line), `the urgent line: ${JSON.stringify(land)}`);
        // (T: rise, once the line offers it; then R held at the rack's foot, "sleep until reveille": the late card, not now; then T: dress)
        const tWhenKeyed = async () => {
          await page.waitForFunction(() => !!document.querySelector('.instinct .row.top .line kbd'), null, { timeout: 10000 }).catch(() => {});
          const l = await page.evaluate(lineOf);
          await page.keyboard.press('KeyT');
          return l;
        };
        const t1 = await tWhenKeyed();
        await page.waitForFunction((h) => { const s = window[h].state, a = s.actors.list.find(x => x.id === s.player.actor); return (a.posture ?? 'stand') === 'stand' && !(a.trans && s.clock.ms < a.trans.fromMs + a.trans.ms); }, H, { timeout: 10000 }).catch(() => {});
        await settle(page, 300);
        await page.keyboard.down('KeyR'); await page.waitForTimeout(350); await page.keyboard.up('KeyR');
        const chose = await page.waitForFunction(() => document.querySelector('.glass.choose'), null, { timeout: 3000 }).then(() => true).catch(() => false);
        let lateText = '';
        if (chose) {
          await page.evaluate(() => [...document.querySelectorAll('.glass.choose .item')].find(b => /sleep until reveille/.test(b.innerText))?.click());
          await page.waitForFunction(() => document.querySelector('.glass.late'), null, { timeout: 3000 }).catch(() => {});
          lateText = await page.evaluate(() => document.querySelector('.glass.late')?.innerText ?? '');
          await page.keyboard.press('Digit3');
        }
        console.log(`      T (rise) on '${t1.line}'; then R held at the rack's foot and "sleep until reveille": '${lateText.split('\n').filter(Boolean).join(' | ')}'`);
        assert(/Late for/i.test(lateText) && /do it anyway/.test(lateText) && /not now/.test(lateText), lateText);
        const t2 = await tWhenKeyed();
        console.log(`      T (dress) on '${t2.line}'`);
        // (the dressing is an activity of its own: its splash, then the line)
        await page.waitForFunction((h) => !window[h].splash() && window[h].actors().find(a => a.id === window[h].state.player.actor).outfit === 'utilities', H, { timeout: 30000 }).catch(() => {});
        // (the muster is checked on whole seconds while the drill is open: the first one after the landing)
        await page.waitForFunction((h) => (window[h].state.time?.attend ?? []).length > 0, H, { timeout: 5000 }).catch(() => {});
        const up = await page.evaluate((h) => ({ me: window[h].actors().find(a => a.id === window[h].state.player.actor), attend: window[h].state.time?.attend ?? [], ms: window[h].state.clock.ms }), H);
        console.log(`      T, T: ${up.me.posture}, in ${up.me.outfit} at (${up.me.x}, ${up.me.z}), +${fmt((up.ms - 23532601000) / 60000, 1)} min after the klaxon; attendance ${JSON.stringify(up.attend.at(-1) ?? null)}`);
        assert(up.me.outfit === 'utilities' && (up.me.posture ?? 'stand') === 'stand' && up.attend.at(-1)?.class === 'on-time', JSON.stringify({ me: up.me, attend: up.attend }));
        // (the stand-down: an hour or two of debug skips reach 03:00; the end card once the splash is done)
        for (let i = 0; i < 3 && !(await page.evaluate((h) => !!window[h].scene?.ended, H)); i++) {
          await page.evaluate((h) => window[h].act('debug:skip:3600000'), H);
          await page.waitForFunction((h) => !window[h].splash(), H, { timeout: 15000 });
          await settle(page, 300);
        }
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('.glass.end'), null, { timeout: 10000 }).catch(() => {});
        const end = await page.evaluate((h) => ({ card: document.querySelector('.glass.end')?.innerText ?? '', scene: window[h].scene }), H);
        console.log(`      the stand-down: the end card '${end.card.split('\n').filter(Boolean).slice(0, 2).join(' | ')}'`);
        assert(/End of the scene: The klaxon at 02:30/i.test(end.card) && end.scene.ended, JSON.stringify(end));
      }, { query: 'play=test-night&seed=48213&nostore=1&debug=1' });
    },
  },
];
