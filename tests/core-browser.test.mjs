// The engine core and the HUD in a real browser (heavy): the title paper shows with no errors and the
// page says it's ready; ?play=sandbox&hour=6 still starts at 06:00 in v0.0.2's test rooms; a new
// career from the title opens in Echo's barracks, in bay-2-1, on Monday, Sol 590 of MY 211 at 12:39
// Melas time (CONTRACTS §2, §3), UTC on the watch's second line, the place line "Echo Company barracks,
// ground floor · 1st Squad, 2nd Platoon" (the floor named from 0.0.5), the squad at its racks; it
// walks by physical keys, Space and an open card pause, G holds time still until a digit (the
// instinct's line says so), R away from doors passes
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
// The 0.0.5 round's (the build sheet §5.4): the keys card adds G's words, X, the digits (tapped, Shift,
// held), A and W, V, I, Enter and Q D. test-handling ("Show clear") from the title's Tests and by the
// keys on ?play=test-handling&seed=48213: the goal; the tower's brief and the coach in the radio box; G
// (time stands still, "Time stands still." leading the line); the panel by the believed state
// (Condition 4: LOAD offered, MAKE READY not, Fire struck "aim first", then "on safe" once aimed); W twice
// to prone; LOAD on its digit once the tower says it, its ticks; MAKE READY; off safe; Enter aims and the
// plaque says its percentage; Fire held puts a hole in PAPER; then the range bot (tests/bots/range.mjs,
// in the page) to the set stoppage, where the reflex card takes STEPS' place and a digit answers it; the
// weapon card showing the belief, pixel for pixel, while the debug handle makes the truth differ; the bot
// on through SHOW CLEAR to "The line is clear."; the end card's summary, Score and Copy my scores. And the
// weapon state's rectangles in the page at 1024 × 768, 1280 × 600, 1600 × 900 and 1920 × 1080, none meeting.
// The 0.0.6 round's (the build sheet 0.0.6 §5.3; the user, 2026-11-06: "the shave+wash+water when pressing R at a
// basin without the tootip telling us what is going to happen is no good"): R's plate on the instinct's line, in
// the kit's pixels, on every line (the klaxon's urgent one too); at Head A's sink after the urinal the plate reads
// "R WASH HANDS · 30 S" before R, and R does that alone; R held opens the R menu (a canvas of the kit's pixels,
// its keys its own), the digits and Space check brush teeth, shave and wash face, Enter: one splash, three lines
// in its strip; the mouse the same (a click on each box, DO IT); Esc and R close it; the card inside the window
// at four sizes; at the rack mid-drill, R held, the sleep's row and Enter bring the late card.
// The 0.0.7 round's (the build sheet 0.0.7 §5.5 core-browser): test-range, "The line at 300 m", from the Tests menu and by
// the URL with no errors; the KD bot (tests/bots/kd.mjs, in the page) to the zero's first group read: PAPER the group card
// (the zero card, its holes, the call "6 DOWN · 14 RIGHT" or "ZEROED"); on to the confirm at 300 m, aimed at your face: the far window open
// on it (view.farState().open), labelled "TARGET n · 300 M", its disc and stack apart from every HUD rectangle in the page;
// Z twice dials two clicks up: the turrets' belief moves, the believed zero does not, the plaque's zero term follows; the
// bot to the end: the end card's KD summary, Score it at 85, 80, 90, and Copy my scores gives ROADMAP §2.2's line.
// The 0.0.8 round's (the build sheet 0.0.8 §5.4 core-browser): test-pairs, "Pairs": the Tests menu's entry opens the sheet
// picker (five sheets, the Private focused); ?play=test-pairs&tier=private&seed=48213 boots with no errors; out of the mode
// at low ready, the turn draws the amber brackets (three times the face's box at the sighting, closing) and the pause lands
// on the sim's tick (the sighting + 0.55 s); Z, X and a digit pressed in the window change nothing, Space pauses it; at
// the pause the stamp, the plaque's lead "CONTACT · … · TAKEN IN 0.55 S" and the line's "Contact · 0.55 s."; Off safe,
// Aim, then the Pair row with its price and odds, fired: two rounds at the split; the paper's text the sim's; the pairs
// bot (tests/bots/pairs.mjs, in the page) to the end; the end card's sheet and aspects, "Again as Tier one" on the same
// seed; the paper and the HUD apart at 1600 × 900 and 1024 × 768; Copy my scores gives "… · test-pairs · seed 48213 · turn
// 85 · shots 80 · gun 90 · ★ no · note: none".
// The 0.0.9 round's (the build sheet 0.0.9 §5.3 core-browser): "Three bangs": the Tests menu lists it after "Pairs" and its
// picker opens on the Boot recruit with each sheet's hardening in words; ?play=test-pairs&setup=bangs&tier=recruit&seed=48213
// boots with no errors, its goal shown; on 'bangs:standby' each bang's flash drawn on a frame at or after the sim's atMs,
// X, Z and a digit pressed while startled change nothing (no stop motion, no step), FROZE drawn at the startle's end with the
// sim's figure, the picture at the pinned band; at the pause the Off safe row "! shaking" with its odds, and on 48213 its first
// try failing (found in node: the recruit's first Off safe after the bangs fails on 48213, 48215, 48217, 48219, 48220 and
// 48223 of the twelve from 48213), the panel's ticks showing ✗; the paper the scene's; the bot to the end, the end card's
// bangs lines and "Again as Tier one" keeping the seed and the setup (his FROZE 0.05 S); Copy my scores gives "… ·
// test-pairs-bangs · seed 48213 · bangs 80 · ★ no · note: none".
// 0.0.7's tower fixer (the user's play of 2026-11-07): the 200 m line on seed 99, the tower's command on top of the radio box
// at the dope and at commence fire with the coach's lines under it, every voice whole, your stake marked; the command marked
// NOW and the only tower line in the box, its short form keeping its terms (seed 48213 too: the tower verifier's).
// 0.0.10 (the build sheet 0.0.10 §5.3): "Bang" (test-stress) from the Tests menu through its picker (the Boot recruit focused,
// the hardening leading), boots with no errors; on 'standby:1' every blank's flash drawn on the first frame at or after its
// moment and once, the horn in the coach's hand while it sounds (the view's din layer, frame by frame in real time); on
// 'standby:2' the coach's "Bang!" in the radio box (and "[a shout: Bang!]" captioned) before the burst; Breathe's row in the
// mode and T doing it out of the mode in a standby with the turn still armed, its lead counting the box; the hit card in
// belief at a pause after a hit (no hole), in truth at the string's end beside the timer (the sim's holes); "Again as Tier one"
// keeps the seed; Copy my scores gives "… · test-stress · seed 48213 · chaos 80 · contrast 80 · hands 80 · ★ no · note: none".
import { assert, fmt, root } from './helpers.mjs';
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
const lineOf = () => ({ line: document.querySelector('.instinct .line')?.textContent ?? '', tone: document.querySelector('.instinct .line')?.className ?? '', offer: document.querySelector('.instinct .plate:not([hidden]) .words')?.textContent?.trim() ?? '', plate: document.querySelector('.instinct .plate:not([hidden])')?.dataset.text ?? '', all: document.querySelector('.instinct')?.textContent ?? '' });
// (R held: down, past TAP_MS, up; then the R menu's card, its words as the player reads them)
const holdR = async (page) => { await page.keyboard.down('KeyR'); await page.waitForTimeout(350); await page.keyboard.up('KeyR'); };
const menuText = (page) => page.waitForFunction(() => document.querySelector('.glass.actions')?.dataset.text, null, { timeout: 3000 }).then(h => h.jsonValue()).catch(() => '');
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
        assert(w.place === 'Echo Company barracks, ground floor · 1st Squad, 2nd Platoon', `the place line: '${w.place}'`);
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
        console.log(`      J: ${log.lines.length} lines of ${log.records} records, paused by '${log.reasons}'; newest: '${log.lines[0]}'`);
        // (newest first (VIEWS §8.6; the parity review's): the skip's own line from time's activity, 'idle', "15 min went by.", then the debug line)
        const dbg = log.lines.find(l => /\[debug\] skipped 15 min/.test(l));
        assert(log.lines.length >= 1 && log.lines.length <= 400 && dbg && log.lines.indexOf(dbg) <= 1 && /^S\d+ \d\d:\d\d:\d\d/.test(dbg) && log.reasons.join() === 'overlay:log', JSON.stringify(log));
        await page.keyboard.press('KeyJ');
        const closed = await page.evaluate((h) => ({ card: document.querySelector('.glass.log'), reasons: window[h].loop.pauseReasons }), H);
        assert(!closed.card && !closed.reasons.length, 'J closes the log');
      }, { query: 'play=barracks&seed=48213&nostore=1' });
    },
  },
  {
    name: '? lists every key this build gives a meaning, labelled AZERTY (Z Q S D, Shift, Alt, R, T, G, X, the digits, A W, V, I, C, J, Space, Esc, ?, in a splash Space and Backspace, in stop motion Enter and Q D, and 0.0.7\'s Z S and Shift Q D the turrets, E held the far window), and nothing else; in debug mode ^ and $',
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
        const want = ['Z Q S D', 'Shift', /^(Alt|Option)$/, 'R', 'T', 'G', 'X', '1 … 0', 'A W', 'V', 'I', 'C', 'J', 'Space', 'Esc', '?', 'Backspace', 'Enter', 'Q D'];
        for (const w of want) assert(keys.some(k => (w instanceof RegExp ? w.test(k) : k === w)), `no row for ${w}: ${keys.join(', ')}`);
        for (const not of ['F', 'H', 'Tab', 'K', 'L', 'M']) assert(!keys.includes(not), `${not} does nothing in this build, yet it is on the card`);
        // (0.0.7: E held on a KD line opens the far window; Z S and Shift with Q D the scope's turrets in stop motion)
        assert(/far window/.test(rows.find(r => r[0] === 'E')?.[1] ?? '') && /elevation/.test(rows.find(r => r[0] === 'Z S')?.[1] ?? '') && /windage/.test(rows.find(r => r[0] === 'Shift Q D')?.[1] ?? ''), 'the 0.0.7 keys: E, Z S, Shift Q D');
        assert(/Shift rushed/.test(rows.find(r => r[0] === '1 … 0')[1]) && /held careful/.test(rows.find(r => r[0] === '1 … 0')[1]) && /stance/.test(rows.find(r => r[0] === 'A W')[1]), 'the digits\' tempo and the stance keys');
        assert(/door/.test(rows.find(r => r[0] === 'R')[1]) && /wait 15 min/.test(rows.find(r => r[0] === 'R')[1]) && /held: the menu/.test(rows.find(r => r[0] === 'R')[1]), `R's words: ${rows.find(r => r[0] === 'R')[1]}`);
        assert(rows.some(([k, w]) => k === 'Space' && /R menu/.test(w)) && rows.some(([k, w]) => k === 'Q D' && /R menu/.test(w)), 'the R menu\'s keys');
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
        // (the mute's digit as the menu numbers it (6 to v0.0.8; 0.0.9 put "Reduce flashes" above it): Sound on → muted)
        const muteKey = await page.evaluate(() => document.querySelector('.glass.menu .item.mute kbd')?.textContent ?? '6');
        await page.keyboard.press(`Digit${muteKey}`);
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
        // (the rank the scene drew for you: a scene from the title's Tests menu draws its seed, so not always a Private)
        const sheet = await page.evaluate(async (h) => { const s = window[h].state, R = (await import('/src/data/people/ranks.js')).RANKS; return { text: document.querySelector('.glass.sheetcard').innerText, rank: R[s.people[s.player.id].service.rank]?.title ?? null, doll: !!document.querySelector('.glass.sheetcard canvas.doll'), glyphs: document.querySelectorAll('.glass.sheetcard .glyph').length, reasons: window[h].loop.pauseReasons }; }, H);
        await page.keyboard.press('KeyC');
        const closed = await page.evaluate(() => !document.querySelector('.glass.sheetcard'));
        console.log(`      C: PERSONNEL with the doll ${sheet.doll}, ${sheet.glyphs} glyphs, paused by ${sheet.reasons}; '${sheet.text.split('\n').filter(Boolean).slice(0, 12).join(' | ')}'; C closes it: ${closed}`);
        assert(sheet.doll && sheet.glyphs === 9 && /On you/i.test(sheet.text) && /The file/i.test(sheet.text) && !!sheet.rank && sheet.text.includes(sheet.rank) && sheet.reasons.includes('overlay:sheet') && closed, JSON.stringify(sheet));
        // (thirsty at a sink: the drink on the chip, T held drinks there, a fast-forward behind the brief splash. The thirst is
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
        assert(/T held\s*Drink/.test(thirsty.all) && drink.doing?.activity === 'drink' && drink.doing.mode === 'ff', JSON.stringify({ thirsty, drink }));   // (30 s: behind the brief splash since the user's 2026-11-07 "up to 10s")
      }, { query: 'nostore=1' });
    },
  },
  {
    name: 'test-night: at the rack in PT kit at 21:55, R held opens the R menu; R: the night\'s splash stopped at the klaxon\'s exact second (02:30:00.091), ALARM; the urgent line keeps R\'s plate, T rises, T dresses, the count; R held mid-drill, the sleep\'s row and Enter bring the late card; a debug hour to the stand-down, the end card; the splash\'s rectangles apart at three window sizes',
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
        // (R held: the R menu, Esc for nothing)
        await holdR(page);
        const choices = await menuText(page);
        await page.keyboard.press('Escape');
        await settle(page, 200);
        const shut = await page.evaluate((h) => ({ card: !document.querySelector('.overlay').hidden, paused: window[h].loop.pauseReasons }), H);
        console.log(`      R held: ${choices.split('\n').join(' | ')}; Esc: ${JSON.stringify(shut)}`);
        assert(/YOUR RACK/.test(choices) && /SLEEP \[UNTIL REVEILLE ▾\]/.test(choices) && /NAP \[45 MIN ▾\]/.test(choices) && !shut.card && !shut.paused.length, JSON.stringify({ choices, shut }));
        // (R: the night, sampled; the klaxon stops it at its second)
        const tl0 = sampleSplash(page, { maxS: 40 });
        await page.keyboard.press('KeyR');
        const tl = await tl0, ph = phasesOf(tl);
        await page.waitForFunction(() => !!document.querySelector('.instinct .plate:not([hidden])'), null, { timeout: 5000 }).catch(() => {});
        const land = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, ticks: window[h].state.clock.ms % 50, time: document.querySelector('.watch .t').textContent, line: document.querySelector('.instinct .line')?.textContent ?? '', tone: document.querySelector('.instinct .line')?.className ?? '', plate: document.querySelector('.instinct .plate:not([hidden])')?.dataset.text ?? '' }), H);
        const plaques = [...new Set(tl.map(x => x.plaque).filter(Boolean))], slips = tl.filter(x => /^24:00/.test(x.clock)).length;
        console.log(`      the night: ${fmt(tl.at(-1).t - tl[0].t, 2)} s (${fmtPhases(ph)}); through the slip in ${slips} frames; plaques ${plaques.join(', ')}; landed at ${land.ms} (${land.time}, on the tick grid: ${land.ticks === 0}); the line '${land.line}' (${land.tone})`);
        assert(land.ms === 23532601000 && plaques.includes('ALARM') && ph.beat > 0.4 && !ph.strip && slips > 0, JSON.stringify({ land, plaques, ph }));
        assert(/urgent/.test(land.tone) && /Klaxon/i.test(land.line) && /^R /.test(land.plate), `the urgent line, R's plate on it: ${JSON.stringify(land)}`);
        // (an urgent line is never cut for R's plate, at 1024 × 768 too: the plate short and giving way (the fixer's, 0.0.6, after
        // "PT kit is not th…" in review); the window put back after)
        const cutAt = [];
        for (const [w, h] of [[1024, 768], [1600, 900]]) {
          await page.setViewportSize({ width: w, height: h }); await settle(page, 500);
          const m = await page.evaluate(() => { const e = document.querySelector('.instinct .line.urgent'); return e ? { sw: e.scrollWidth, cw: e.clientWidth, plate: document.querySelector('.instinct .plate:not([hidden])')?.dataset.text ?? '' } : null; });
          cutAt.push(`${w} × ${h}: the line ${m?.sw} of ${m?.cw} px, the plate '${m?.plate}'`);
          assert(m && m.sw <= m.cw + 1 && /^R /.test(m.plate), JSON.stringify({ w, h, m }));
        }
        await page.setViewportSize({ width: 1280, height: 720 }); await settle(page, 300);
        console.log(`      the urgent line whole: ${cutAt.join('; ')}`);
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
        await holdR(page);
        const mid = await menuText(page);
        let lateText = '';
        if (mid) {
          // (the sleep's row by its digit, its pick until reveille, Enter: the late card)
          const n = mid.split('\n').slice(1).findIndex(l => / SLEEP /.test(l)) + 1;
          await page.keyboard.press(`Digit${n % 10}`);
          await page.keyboard.press('Enter');
          await page.waitForFunction(() => document.querySelector('.glass.late'), null, { timeout: 3000 }).catch(() => {});
          lateText = await page.evaluate(() => document.querySelector('.glass.late')?.innerText ?? '');
          await page.keyboard.press('Digit3');
        }
        console.log(`      T (rise) on '${t1.line}'; then R held at the rack's foot (${mid.split('\n').slice(1, -2).join(' | ')}) and the sleep, Enter: '${lateText.split('\n').filter(Boolean).join(' | ')}'`);
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
  {
    name: 'R says what it does (the user, 2026-11-06: "the shave+wash+water when pressing R at a basin without the tootip telling us what is going to happen is no good"): after the urinal, at Head A\'s sink the plate reads "R WASH HANDS · 30 S" before R, and R washes the hands alone; R held: the R menu; 2 Space 3 Space 5 Space by row, Enter: one splash, three lines in its strip; the mouse the same; Esc and R close; the card inside the window at four sizes',
    heavy: true,
    timeoutMs: 240000,
    async fn() {
      await withGame(async (page, errors, game) => {
        const go = async (id) => { const sp = await spotIn(page, id); await page.evaluate(([h, p]) => window[h].go('melas.echo.1', p.x, p.z, p.face ?? 'up'), [H, sp]); await settle(page, 600); };
        const done = () => page.waitForFunction((h) => !window[h].splash() && !window[h].state.time?.doing && !window[h].state.skip, H, { timeout: 90000 });
        await playing(page);
        // (the urinal: R there is the head, which no longer washes the hands; half hours of debug time first, until the
        // bladder has something to give (over URINATE_MIN_ML 50 mL: an empty one makes the urinal's row struck))
        for (let i = 0; i < 8 && (await page.evaluate((h) => window[h].body()?.body?.bladder?.ml ?? 0, H)) <= 80; i++) {
          await page.evaluate((h) => window[h].act('debug:skip:1800000'), H);
          await page.waitForFunction((h) => !!window[h].splash(), H, { timeout: 5000 }).catch(() => {});
          await done();
        }
        await go('f:e1:head-2a:urinal-1#1');
        const atUrinal = await page.evaluate(lineOf);
        await page.keyboard.press('KeyR');
        await page.waitForFunction((h) => !!window[h].state.time?.doing || !!window[h].state.skip, H, { timeout: 5000 }).catch(() => {});
        await done();
        const handsAfter = await page.evaluate((h) => window[h].hands(), H);
        // (the sink: its plate before R, then R)
        await go('f:e1:head-2a:sinks-1#1');
        await page.waitForFunction(() => /wash hands/.test(document.querySelector('.instinct .plate .words')?.textContent ?? ''), null, { timeout: 5000 }).catch(() => {});
        const atSink = await page.evaluate(lineOf), menu0 = await page.evaluate((h) => window[h].menu(), H);
        console.log(`      at the urinal: '${atUrinal.plate}'; after the head: ${JSON.stringify(handsAfter)}; at the sink: the plate '${atSink.plate}', the line '${atSink.line}'; the menu's rows ${menu0?.rows?.map(r => r.key).join(', ')}`);
        assert(/^R USE THE HEAD/.test(atUrinal.plate) && (handsAfter?.i ?? 0) >= 2, JSON.stringify({ atUrinal, handsAfter }));
        assert(atSink.plate === 'R WASH HANDS · 30 S', `the sink's plate: ${JSON.stringify(atSink)}`);
        const b0 = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, body: window[h].body()?.body, hands: window[h].hands() }), H);
        await page.keyboard.press('KeyR');
        await page.waitForFunction((h) => !!window[h].state.time?.doing, H, { timeout: 5000 }).catch(() => {});
        await done();
        const b1 = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, body: window[h].body()?.body, hands: window[h].hands(), plate: document.querySelector('.instinct .plate')?.dataset.text }), H);
        console.log(`      R: ${fmt((b1.ms - b0.ms) / 1000, 1)} s lived; the hands ${b0.hands?.band} (${fmt(b0.hands?.dirt ?? NaN, 1)}) → ${b1.hands?.band} (${fmt(b1.hands?.dirt ?? NaN, 1)}); stubble ${fmt(b0.body?.hygiene?.stubbleH ?? NaN, 2)} → ${fmt(b1.body?.hygiene?.stubbleH ?? NaN, 2)} h; the plate now '${b1.plate}'`);
        // (the hands washed and nothing else: no shave, no drink, lived in half a minute)
        assert(b1.hands?.dirt < 1 && b1.body.hygiene.stubbleH >= b0.body.hygiene.stubbleH && (b1.ms - b0.ms) <= 45_000 && (b1.body.water?.balanceL ?? 0) <= (b0.body.water?.balanceL ?? 0) + 1e-6, JSON.stringify({ b0: b0.hands, b1: b1.hands }));
        // (R held: the menu; the keys check brush teeth, shave and wash face by their rows; Enter: one chain, one splash)
        await holdR(page);
        const card = await menuText(page);
        const rowOf = (id) => card.split('\n').slice(1).findIndex(l => new RegExp(`^.\\d \\[.\\] ${id}\\b`).test(l)) + 1;
        const rows = ['BRUSH TEETH', 'SHAVE', 'WASH FACE'].map(rowOf);
        await page.screenshot({ path: `${root}/.run/core-browser-menu.png` }).catch(() => {});
        for (const n of rows) await page.keyboard.press(`Digit${n}`);              // (a digit checks its row: the fixer's, 0.0.6)
        const checked = await page.evaluate(() => document.querySelector('.glass.actions')?.dataset.text ?? '');
        console.log(`      R held:\n${card.split('\n').map(l => `        ${l}`).join('\n')}\n      ${rows.join(', ')} by their digits: ${checked.split('\n').filter(l => /\[x\]|TOTAL/.test(l)).join(' | ')}`);
        assert(rows.every(n => n > 0) && /TOTAL 7 MIN · DONE/.test(checked), JSON.stringify({ rows, checked }));
        const starts = [];
        await page.exposeFunction('__menuSkip', (e) => starts.push(e)).catch(() => {});
        await page.evaluate((h) => { window[h].bus.on('skip-start', (e) => window.__menuSkip({ activity: e.activity, chain: e.chain ?? null, toMs: e.toMs, fromMs: e.fromMs })); }, H);
        const tl0 = sampleSplash(page);
        await page.keyboard.press('Enter');
        const tl = await tl0, strip = tl.filter(x => x.strip.length).at(-1)?.strip ?? [];
        const after = await page.evaluate((h) => ({ ms: window[h].state.clock.ms, stubbleH: window[h].body()?.body?.hygiene?.stubbleH, log: window[h].state.log?.list?.slice(-4)?.map(e => e.text) }), H);
        console.log(`      Enter: ${starts.length} skip-start (${JSON.stringify(starts[0]?.chain)}), ${fmt((tl.at(-1)?.t ?? 0) - (tl[0]?.t ?? 0), 2)} s of splash (${fmtPhases(phasesOf(tl))}); its strip: ${strip.join(' | ')}; stubble ${fmt(after.stubbleH, 2)} h`);
        assert(starts.length === 1 && starts[0].chain?.n === 3 && strip.filter(x => /^✓ /.test(x)).length === 3 && after.stubbleH < 0.1, JSON.stringify({ starts, strip, after }));
        // (Esc and R close the menu, the game paused only while it is up)
        for (const key of ['Escape', 'KeyR']) {
          await holdR(page);
          await menuText(page);
          await page.keyboard.press(key);
          await settle(page, 200);
          const c = await page.evaluate((h) => ({ card: !document.querySelector('.overlay').hidden, paused: window[h].loop.pauseReasons.length, owned: !!document.querySelector('.glass.actions') }), H);
          assert(!c.card && !c.paused && !c.owned, `${key} closes: ${JSON.stringify(c)}`);
        }
        // (the mouse: a fresh career at the sink, R held, a click on each box, DO IT)
        await game.open('play=barracks&seed=48213&hour=19.5&nostore=1&debug=1');
        await playing(page);
        await go('f:e1:head-2a:sinks-1#1');
        await holdR(page);
        const card2 = await menuText(page);
        const geo = await page.evaluate(async () => {
          const c = document.querySelector('.glass.actions canvas'), r = c.getBoundingClientRect();
          const { createList } = await import('/src/ui/kit/list.js'), { menuRows } = await import('/src/ui/cards/actions.js');
          const m = window.__olympus.menu(), l = createList({ rows: menuRows(m), title: m.title });
          const L = l.layout();
          return { k: r.width / c.width, x: r.x, y: r.y, boxes: L.rects.boxes.map(b => ({ key: b.key, x: b.x + b.w / 2, y: b.y + b.h / 2 })), doIt: { x: L.rects.doIt.x + L.rects.doIt.w / 2, y: L.rects.doIt.y + L.rects.doIt.h / 2 } };
        });
        for (const key of ['teeth', 'shave', 'wash-face']) { const b = geo.boxes.find(x => x.key === key); await page.mouse.click(geo.x + b.x * geo.k, geo.y + b.y * geo.k); await page.waitForTimeout(60); }
        const byMouse = await page.evaluate(() => document.querySelector('.glass.actions')?.dataset.text ?? '');
        const starts2 = starts.length, tl2p = sampleSplash(page);
        await page.mouse.click(geo.x + geo.doIt.x * geo.k, geo.y + geo.doIt.y * geo.k);
        const tl2 = await tl2p, strip2 = tl2.filter(x => x.strip.length).at(-1)?.strip ?? [];
        console.log(`      by the mouse: ${byMouse.split('\n').filter(l => /\[x\]|TOTAL/.test(l)).join(' | ')}; DO IT: a splash of ${fmt((tl2.at(-1)?.t ?? 0) - (tl2[0]?.t ?? 0), 2)} s, its strip ${strip2.length} steps`);
        assert((byMouse.match(/\[x\]/g) ?? []).length === 3 && strip2.filter(x => /^✓ /.test(x)).length === 3, JSON.stringify({ byMouse, strip2 }));
        // (the card inside the window at four sizes, the HUD hidden under it)
        const fits = [];
        for (const [w, hgt] of [[1024, 768], [1280, 600], [1600, 900], [1920, 1080]]) {
          await page.setViewportSize({ width: w, height: hgt });
          await settle(page, 300);
          await holdR(page);
          await menuText(page);
          const r = await page.evaluate(() => { const b = document.querySelector('.glass.actions').getBoundingClientRect(), c = document.querySelector('.glass.actions canvas').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, cw: c.width, ch: c.height, hud: document.querySelector('#hud').hidden }; });
          fits.push(`${w} × ${hgt}: the card ${fmt(r.w, 0)} × ${fmt(r.h, 0)} at (${fmt(r.x, 0)}, ${fmt(r.y, 0)}), its pixels ${fmt(r.cw, 0)} × ${fmt(r.ch, 0)}`);
          assert(r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= hgt && r.hud, JSON.stringify({ w, hgt, r }));
          await page.screenshot({ path: `${root}/.run/core-browser-menu-${w}.png` }).catch(() => {});
          await page.keyboard.press('Escape');
          await settle(page, 200);
        }
        console.log(`      ${fits.join('; ')}`);
      }, { query: 'play=barracks&seed=48213&hour=19.5&nostore=1&debug=1' });
    },
  },
  {
    name: 'test-handling, "Show clear", from the Tests menu and by the keys: the goal, the tower and the coach in the radio box, G and "Time stands still.", the panel by the believed state (LOAD offered, MAKE READY not, Fire struck), prone by W, LOAD on its digit after the tower\'s, MAKE READY, Enter and the plaque\'s percentage, Fire held and a hole in PAPER; the reflex card at the set; the weapon card the belief\'s while the truth differs; SHOW CLEAR, the end card\'s summary and Copy my scores',
    heavy: true,
    timeoutMs: 300000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: game.origin });
        // (from the title's Tests: the scene is listed and starts)
        await page.click('#title .item.tests');
        const list = await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].map(b => b.innerText.split('\n')[0]));
        console.log(`      Tests: ${list.join(' | ')}`);
        assert(list.includes('Show clear'), JSON.stringify(list));
        await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => /Show clear/.test(b.innerText)).click());
        await playing(page);
        const fromMenu = await page.evaluate((h) => ({ scene: window[h].scene, goal: document.querySelector('.toasts').textContent, place: document.querySelector('.watch .place')?.textContent ?? '' }), H);
        console.log(`      from the menu: ${JSON.stringify(fromMenu.scene)}; '${fromMenu.goal.slice(0, 90)}…' at '${fromMenu.place}'`);
        assert(fromMenu.scene?.id === 'test-handling' && /tower's commands/.test(fromMenu.goal), JSON.stringify(fromMenu));
        // (the same by the URL, seed 48213, played by the keys)
        await game.open('play=test-handling&seed=48213&nostore=1');
        await playing(page);
        const beat = (what) => page.evaluate(([h, what]) => ({ what, ms: window[h].state.clock.ms, stop: window[h].stop(), panel: window[h].steps()?.slots?.map(s => `${s.key} ${s.label}${s.off ? ` (${s.off})` : ''}`) ?? null, card: document.querySelector('.steps .wcard')?.dataset.text ?? null, radio: window[h].radio.map(l => `${l.head} ${l.text}`), line: document.querySelector('.instinct')?.textContent ?? '', paper: document.querySelector('.paper')?.dataset.text ?? null }), [H, what]);
        const choose = () => page.waitForFunction((h) => window[h].stop()?.phase === 'choose', H, { timeout: 30000 });
        const cmd = (c) => page.waitForFunction(([h, c]) => window[h].range()?.cmd === c, [H, c], { timeout: 60000 });
        const keyOf = async (id) => {
          for (let i = 0; i < 6; i++) {
            const k = await page.evaluate(([h, id]) => window[h].steps()?.slots?.find(s => s.id === id)?.key ?? null, [H, id]);
            if (k) return k;
            await page.keyboard.press('Digit0'); await settle(page, 120);
          }
          throw new Error(`no ${id} on the panel`);
        };
        await cmd('prone');
        const brief = await beat('the prone command');
        console.log(`      the radio box: ${brief.radio.join(' | ')}`);
        assert(brief.radio.some(l => /^◉ TOWER · \w+ \w+/.test(l)) && brief.radio.some(l => /prone/.test(l)), JSON.stringify(brief.radio));
        // (G: the rifle up, time stands still; the panel by the belief: Condition 4)
        await page.keyboard.press('KeyG');
        await choose(); await settle(page, 200);
        const g = await beat('G');
        console.log(`      G: '${g.line}'; the card '${g.card}'; the panel: ${g.panel.join(' · ')}`);
        assert(/^Time stands still\./.test(g.line) && g.stop.mode === 'stop' && g.card === 'SAFE · 0 + OUT', JSON.stringify({ line: g.line, card: g.card }));
        const all0 = await page.evaluate((h) => window[h].steps().steps.map(s => ({ id: s.id, off: s.off ?? null })), H);
        assert(all0.some(s => s.id === 'macro:load' && !s.off) && !all0.some(s => s.id === 'macro:ready') && all0.find(s => s.id === 'fire')?.off === 'aim first', JSON.stringify(all0));
        await page.keyboard.press('Enter'); await settle(page, 150); await choose(); await settle(page, 150);
        const aimed0 = await beat('aimed at Condition 4');
        console.log(`      aimed at Condition 4: ${aimed0.panel[0]}`);
        assert(/\(on safe\)$/.test(aimed0.panel[0]), aimed0.panel[0]);
        // (W twice: kneel, then prone)
        for (let i = 0; i < 2; i++) { await page.keyboard.press('KeyZ'); await settle(page, 150); await choose(); }
        const stance = await page.evaluate((h) => window[h].state.actors.list.find(a => a.id === window[h].state.player.actor).stance ?? 'stand', H);
        assert(stance === 'prone', `W twice: ${stance}`);
        // (LOAD once the tower says it, on its digit; its ticks as it runs; the radio box says the command)
        await cmd('load'); await choose(); await settle(page, 150);
        const load = await beat('LOAD');
        await page.keyboard.press(`Digit${await keyOf('macro:load')}`);
        await page.waitForFunction((h) => window[h].stop()?.phase === 'act', H, { timeout: 5000 });
        await settle(page, 900);
        const loading = await page.evaluate(() => ({ ticks: [...document.querySelectorAll('.steps .running-view .rv-sub b')].map(b => b.textContent).join(''), name: document.querySelector('.steps .running-view .rv-name')?.textContent ?? '', subs: document.querySelector('.steps .running-view .rv-subs')?.textContent ?? '', acting: document.querySelector('.steps')?.classList.contains('acting') }));
        await choose();
        console.log(`      LOAD said: ${load.radio.at(-1)}; on ${load.panel.find(p => /LOAD/.test(p))}; running: '${loading.name}', '${loading.subs}'`);
        assert(load.radio.some(l => /LOAD/.test(l)) && loading.acting && loading.name === 'LOAD' && /^[✓◦✗]{1,4}·{0,3}$/.test(loading.ticks) && loading.ticks.length === 4, JSON.stringify(loading));   // (0.0.6: safe, reach, seat, port)
        await cmd('ready'); await choose();
        await page.keyboard.press(`Digit${await keyOf('macro:ready')}`);
        await cmd('fire'); await choose(); await settle(page, 150);
        await page.keyboard.press(`Digit${await keyOf('selector:semi')}`); await settle(page, 150); await choose();
        await page.keyboard.press('Enter'); await settle(page, 150); await choose(); await settle(page, 200);
        const pl = await page.evaluate((h) => { const pi = document.querySelector('.plaque-info'); return { p: window[h].plaque(), drawn: document.querySelector('.plaque.reticle')?.dataset.text ?? null, hidden: document.querySelector('.plaque.reticle')?.hidden, info: pi && !pi.hidden ? pi.innerText.split('\n') : null }; }, H);
        console.log(`      the plaque: '${pl.p?.words}', drawn '${pl.drawn}'; ${pl.p?.parts.dc}: ${pl.p?.parts.parts.join(', ')} | ${pl.p?.parts.mods.join(', ')}; its list after the aim: ${pl.info ? pl.info.join(' | ') : 'hidden'}`);
        assert(/^PAPER · 25 M · \d+% · /.test(pl.p?.words ?? '') && pl.drawn && /^PAPER \d+%/.test(pl.drawn) && pl.hidden === false, JSON.stringify(pl));
        // (the list has no row of terms on the 25 m bay: none drawn, never the word "null" (the tower fixer's, 0.0.7: an absent row
        // given to replaceChildren was written out as the text "null" between the modifiers and the odds))
        assert(pl.info && pl.info.length === 3 && !pl.info.some(l => /\bnull\b|undefined/.test(l)), JSON.stringify(pl.info));
        // (Fire held: hold and fire; a hole in PAPER, the shot's toast, the roll in J)
        const holes0 = Number(await page.evaluate(() => document.querySelector('.paper')?.dataset.holes ?? 0));
        const fk = await keyOf('fire');
        await page.keyboard.down(`Digit${fk}`); await settle(page, 350); await page.keyboard.up(`Digit${fk}`);
        await settle(page, 150); await choose(); await settle(page, 200);
        const shot = await page.evaluate(() => ({ holes: Number(document.querySelector('.paper')?.dataset.holes ?? 0), paper: document.querySelector('.paper')?.dataset.text, toast: [...document.querySelectorAll('.toasts .toast')].map(t => t.textContent).at(-1) }));
        console.log(`      Fire held: PAPER '${shot.paper}'; the toast '${shot.toast}'`);
        assert(shot.holes === holes0 + 1 && /^Marksmanship \d+ against \d+/.test(shot.toast ?? ''), JSON.stringify(shot));
        // (the bot, in the page, to the set stoppage: the reflex card in STEPS' place, answered by a digit; here and in the KD
        // bots below, a fast-forward (an activity past LIVE_MAX_MS 10 s) is ticked with no keys and checked, as the loop's
        // ffFrame does: h.step alone never ends one, and the bot would stand in it to maxTicks)
        const bot = (until, maxTicks = 60000) => page.evaluate(async ([h, until, maxTicks]) => {
          const { rangeBot } = await import('/tests/bots/range.mjs');
          const O = window[h], run = rangeBot(), done = new Function('O', `return (${until});`);
          O.pause(true);
          let n = 0;
          for (; n < maxTicks && !done(O); n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, run(s, me, (me.bot ??= {}))); }
          O.pause(false);
          return { ticks: n, done: done(O) };
        }, [H, until, maxTicks]);
        const toSet = await bot('!!O.stop()?.reflex || !!O.range()?.end');
        await settle(page, 300);
        // (the weapon card stays at its place beside the reflex card, the two apart (the design review's: the card hid it))
        const rx = await page.evaluate((h) => { const st = document.querySelector('.steps'), rc = document.querySelector('.reflexcard'), a = st.getBoundingClientRect(), b = rc.getBoundingClientRect();
          return { rx: window[h].stop()?.reflex ?? null, card: rc?.hidden === false ? rc.innerText : null, cardOnly: !st.hidden && st.classList.contains('cardonly'), wcard: st.querySelector('.wcard')?.dataset.text ?? null, apart: a.right <= b.left + 0.5, range: window[h].range() }; }, H);
        console.log(`      the bot ran ${toSet.ticks} ticks to the set: '${(rx.card ?? '').split('\n').join(' | ')}'; beside it the weapon card '${rx.wcard}', apart ${rx.apart}`);
        assert(rx.rx && rx.card && /Nothing: stay on the card/.test(rx.card) && rx.cardOnly && rx.apart && rx.wcard, JSON.stringify(rx));
        await page.keyboard.press('Digit1'); await settle(page, 200);
        const answered = await page.evaluate((h) => ({ reflex: window[h].stop()?.reflex ?? null, phase: window[h].stop()?.phase, step: window[h].stop()?.doing?.step ?? null }), H);
        console.log(`      1 answered: ${JSON.stringify(answered)}`);
        assert(!answered.reflex, JSON.stringify(answered));
        await choose(); await settle(page, 200);
        // (the weapon card: the truth made to differ by the debug handle, the card the belief's, pixel for pixel)
        const wc = await page.evaluate(async (h) => {
          const O = window[h], g = O.gun(), id = g.id, truth = O.state.items[id], { paintWeaponCard } = await import('/src/art/weaponcard.js'), { weaponCardModel } = await import('/src/ui/hud/steps.js');
          const was = { chamber: truth.chamber }, mag = truth.mag ? O.state.items[truth.mag] : null, n0 = mag?.n;
          truth.chamber = truth.chamber === 'live' ? 'dud' : 'live'; if (mag) mag.n = (mag.n ?? 0) + 7;
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const cv = document.querySelector('.steps .wcard canvas'), px = new Uint32Array(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data.buffer);
          const b = O.gun().belief, want = paintWeaponCard({ model: b.model, belief: b }), lie = paintWeaponCard({ model: b.model, belief: { ...b, chamber: truth.chamber, count: mag?.n ?? null, countApprox: false } });
          let same = 0, unlike = 0;
          for (let i = 0; i < px.length; i++) { if (px[i] === want.data[i]) same++; if (px[i] !== lie.data[i]) unlike++; }
          const text = document.querySelector('.steps .wcard').dataset.text, model = weaponCardModel(b).line;
          truth.chamber = was.chamber; if (mag) mag.n = n0;
          return { truth: { chamber: truth.chamber === 'live' ? 'dud' : 'live', n: (n0 ?? 0) + 7 }, belief: { chamber: b.chamber, count: b.count }, text, model, same, of: px.length, unlike };
        }, H);
        console.log(`      the truth made to differ (chamber ${wc.truth.chamber}, ${wc.truth.n} in the magazine) under the belief (${wc.belief.chamber}, ${wc.belief.count}): the card '${wc.text}', ${wc.same} of ${wc.of} pixels the belief's card, ${wc.unlike} unlike the truth's`);
        assert(wc.text === wc.model && wc.same === wc.of && wc.unlike > 0, JSON.stringify(wc));
        // (the bot on through SHOW CLEAR: the line is clear, the scene ends; Enter, the end card's summary; Score, Copy my scores)
        const toEnd = await bot('!!O.range()?.end');
        await page.waitForFunction((h) => window[h].scene?.ended, H, { timeout: 10000 });
        const fin = await page.evaluate((h) => ({ range: window[h].range(), radio: window[h].radio.map(l => `${l.head} ${l.text}`), stop: window[h].stop() }), H);
        console.log(`      the bot ran ${toEnd.ticks} ticks more: ${JSON.stringify(fin.range.end)}, ${JSON.stringify(fin.range.summary)}; the radio: ${fin.radio.join(' | ')}`);
        assert(fin.range.end?.phase === 'clear' && !fin.stop, JSON.stringify(fin.range.end));
        await settle(page, 300);
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('.glass.end'), null, { timeout: 10000 });
        const end = await page.evaluate(() => document.querySelector('.glass.end').innerText);
        // (a key at once lands nowhere, the card's guard; then Enter presses its lead, Score it, never Again: the
        // design review's, where Enter read as "end the scene" restarted it and lost the run)
        await page.keyboard.press('Enter');
        await settle(page, 200);
        const guarded = await page.evaluate((h) => ({ end: !!document.querySelector('.glass.end'), score: !!document.querySelector('.glass.score'), focus: document.activeElement?.textContent ?? '', cmd: window[h].range()?.cmd ?? null }), H);
        await settle(page, 300);
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('.glass.score'), null, { timeout: 5000 });
        const restarted = await page.evaluate((h) => window[h].range()?.cmd ?? null, H);
        console.log(`      Enter at once on the end card: the card ${guarded.end ? 'still open' : 'gone'}, focus on '${guarded.focus.replace(/\s+/g, ' ').trim()}'; Enter after it: the score card, the scene's command still '${restarted}'`);
        assert(guarded.end && !guarded.score && /Score it/.test(guarded.focus) && restarted === 'end', JSON.stringify({ guarded, restarted }));
        await page.click('.glass.score .copy');
        await page.waitForFunction(() => /Copied|failed/.test(document.querySelector('.glass.score .copied').textContent), null, { timeout: 5000 });
        const clip = await page.evaluate(async () => navigator.clipboard.readText().catch(e => `(no read: ${e.message})`));
        console.log(`      the end card: '${end.split('\n').filter(Boolean).slice(0, 2).join(' | ')}'; Copy my scores: '${clip}'`);
        // (of 75 for fifteen rounds; 70 when a dud or a stripped round of a double went to the ground: the build sheet §6, check 3)
        assert(/End of the scene: Show clear/i.test(end) && /Clear at \d\d:\d\d · \d+ of (70|75) · .*(no faults|fault)/.test(end), end);
        assert(new RegExp(`^OLYMPUS v${await page.evaluate((h) => window[h].version, H)} · test-handling · seed 48213 · steps 50 · shot 50 · pace 50 · ★ no · note: none$`).test(clip), clip);
      }, { query: 'nostore=1' });
    },
  },
  {
    name: 'the weapon state\'s rectangles in the page at 1024 × 768, 1280 × 600, 1600 × 900 and 1920 × 1080: TOASTS, WATCH, PAPER, INSTINCT, STEPS, RADIO and KEYS each where layout.js reserves it, none meeting',
    heavy: true,
    timeoutMs: 180000,
    async fn() {
      await withGame(async (page) => {
        await page.waitForFunction((h) => window[h].range()?.cmd === 'prone', H, { timeout: 60000 });
        await page.keyboard.press('KeyG');
        await page.waitForFunction((h) => window[h].stop()?.phase === 'choose', H, { timeout: 30000 });
        for (const [w, hh] of [[1024, 768], [1280, 600], [1600, 900], [1920, 1080]]) {
          await page.setViewportSize({ width: w, height: hh });
          await settle(page, 400);
          const got = await page.evaluate(() => {
            const r = (sel) => { const e = document.querySelector(sel); if (!e || e.hidden || getComputedStyle(e).display === 'none') return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
            return { TOASTS: r('.toasts'), WATCH: r('.watch'), PAPER: r('.paper'), INSTINCT: r('.instinct'), STEPS: r('.steps'), RADIO: r('.radio.voices'), KEYS: r('.keyshint') };
          });
          const want = rectsAt(w, hh, 'weapon'), names = Object.keys(got).filter(k => got[k]), clash = [], off = [];
          for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) if (overlaps(got[names[i]], got[names[j]])) clash.push(`${names[i]} × ${names[j]}`);
          for (const n of names) if (n !== 'TOASTS' && n !== 'RADIO' && n !== 'INSTINCT' && (Math.abs(got[n].x - want[n].x) > 2 || Math.abs(got[n].y - want[n].y) > 2)) off.push(`${n} at (${fmt(got[n].x, 0)}, ${fmt(got[n].y, 0)}) not (${fmt(want[n].x, 0)}, ${fmt(want[n].y, 0)})`);
          console.log(`      ${w} × ${hh} (--ui ${want.ui}): ${names.map(n => `${n} ${fmt(got[n].w, 0)}×${fmt(got[n].h, 0)}@${fmt(got[n].x, 0)},${fmt(got[n].y, 0)}`).join(' ')}; meeting: ${clash.join(', ') || 'none'}`);
          assert(['STEPS', 'PAPER', 'WATCH', 'KEYS'].every(n => got[n]) && !clash.length && !off.length, JSON.stringify({ clash, off }));
          if (got.RADIO) assert(got.RADIO.y + got.RADIO.h <= got.STEPS.y + 1, `RADIO on STEPS: ${JSON.stringify({ radio: got.RADIO, steps: got.STEPS })}`);
        }
      }, { query: 'play=test-handling&seed=48213&nostore=1' });
    },
  },
  {
    name: 'test-range, "The line at 300 m": from the Tests menu and by the URL; the group card at the zero; the far window opens on your 300 m face, labelled, apart from every HUD rectangle; two clicks up move the turrets\' belief and the plaque, never the zero; the end card and the score line "… · test-range · seed 48213 · far window 85 · shot at distance 80 · range safety 90 · ★ no · note: none"',
    heavy: true,
    timeoutMs: 420000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: game.origin });
        await page.click('#title .item.tests');
        const list = await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].map(b => b.innerText.split('\n')[0]));
        console.log(`      Tests: ${list.join(' | ')}`);
        assert(list.includes('The line at 300 m'), JSON.stringify(list));
        await game.open('play=test-range&seed=48213&nostore=1');
        await playing(page);
        const start = await page.evaluate((h) => ({ scene: window[h].scene, kd: window[h].kd(), goal: document.querySelector('.toasts')?.textContent ?? '' }), H);
        console.log(`      the scene: ${JSON.stringify(start.scene)}; the KD at ${start.kd?.stage}, line ${start.kd?.line}, lane ${start.kd?.lane}; '${start.goal.slice(0, 80)}…'`);
        assert(start.scene?.id === 'test-range' && start.kd?.stage === 'zero', JSON.stringify(start));
        // (the KD bot in the page, the loop paused while it steps; the HUD drawn again once it lets go)
        const bot = (until, maxTicks = 200000) => page.evaluate(async ([h, until, maxTicks]) => {
          const { kdBot } = await import('/tests/bots/kd.mjs');
          const O = window[h], run = kdBot(), done = new Function('O', `return (${until});`);
          O.pause(true);
          let n = 0;
          for (; n < maxTicks && !done(O); n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, run(s, me, (me.bot ??= {}))); }
          O.pause(false);
          return { ticks: n, done: done(O) };
        }, [H, until, maxTicks]);
        // (a walk or the pits are behind a splash, which the page paces: the bot lets go, Enter takes the splash to its end, and on)
        const through = async (until, rounds = 12) => {
          let ticks = 0, r = null;
          for (let i = 0; i < rounds; i++) {
            r = await bot(`(${until}) || !!O.state.skip`);
            ticks += r.ticks;
            if (await page.evaluate((u) => new Function('O', `return (${u});`)(window.__olympus), until)) return { ticks, done: true };
            if (!(await page.evaluate((h) => !!window[h].state.skip, H))) return { ticks, done: false };
            for (let w = 0; w < 120 && await page.evaluate((h) => !!window[h].state.skip || !!window[h].splash(), H); w++) { await page.keyboard.press('Enter'); await settle(page, 250); }
          }
          return { ticks, done: false };
        };
        const toGroup = await bot('(() => { const k = O.kd(); const g = k?.groups?.at(-1); return !!O.stop() && !!g && !k.hot && !!(g.call || g.ok); })()');
        await settle(page, 600);
        const group = await page.evaluate((h) => ({ paper: document.querySelector('.paper')?.dataset.text ?? null, groups: window[h].kd().groups }), H);
        console.log(`      the bot ran ${toGroup.ticks} ticks to the first group read: PAPER '${group.paper}'`);
        assert(toGroup.done && /the zero card, group \d+: 3 holes/.test(group.paper ?? '') && /(UP|DOWN|LEFT|RIGHT|ZEROED)/.test(group.paper), JSON.stringify(group));
        // (on to the confirm, aimed at your own face: the far window open on it)
        const toFar = await through('(() => { const k = O.kd(), st = O.stop(); return k?.stage === \'confirm\' && k.line === 300 && st?.phase === \'choose\' && st.aim?.key === `face:${k.kdLane}`; })()');
        const why = await page.evaluate((h) => ({ kd: { stage: window[h].kd()?.stage, line: window[h].kd()?.line, cmd: window[h].kd()?.cmd, kdLane: window[h].kd()?.kdLane }, stop: window[h].stop(), far: window[h].far }), H);
        console.log(`      the bot ran ${toFar.ticks} ticks (${toFar.done ? 'there' : 'not there'}): ${JSON.stringify({ kd: why.kd, aim: why.stop?.aim, phase: why.stop?.phase, far: why.far?.far ?? null, open: why.far?.open ?? null })}`);
        await page.waitForFunction((h) => window[h].far?.stage?.open && window[h].far?.alpha >= 1, H, { timeout: 10000 });
        await settle(page, 400);
        const far = await page.evaluate((h) => {
          const r = (sel) => { const e = document.querySelector(sel); if (!e || e.hidden || getComputedStyle(e).display === 'none') return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
          return { far: window[h].far, kd: window[h].kd(), rects: { TOASTS: r('.toasts'), WATCH: r('.watch'), PAPER: r('.paper'), INSTINCT: r('.instinct'), STEPS: r('.steps'), RADIO: r('.radio.voices'), KEYS: r('.keyshint') }, label: r('.plaque.farlabel'), plaque: r('.plaque.reticle'), terms: r('.plaque.terms'), hud: window[h].hud };
        }, H);
        const p = far.far.place, disc = { x: p.cx - p.RK, y: p.cy - p.RK, w: 2 * p.RK, h: 2 * p.RK }, own = [['disc', disc], ['label', far.label], ['plaque', far.plaque], ['terms', far.terms]].filter(([, b]) => b);
        const meets = [];
        for (const [n, b] of own) for (const [m, r] of Object.entries(far.rects)) if (r && overlaps(b, r)) meets.push(`${n} × ${m}`);
        console.log(`      the bot ran ${toFar.ticks} ticks to the confirm, aimed: the far window ${far.far.open ? 'open' : 'shut'} at (${fmt(p.cx, 0)}, ${fmt(p.cy, 0)}) r ${fmt(p.r, 0)}, '${far.far.label}'; PAPER ${far.rects.PAPER ? 'shown' : 'yielding'}; meeting: ${meets.join(', ') || 'none'}`);
        console.log(`      the plaque '${far.hud.plaque}'; its terms '${far.hud.terms}'`);
        assert(far.far.stage.open && /^TARGET \d+ 300 M$/.test(far.far.label ?? '') && far.far.far.key === `face:${far.kd.kdLane}` && !far.rects.PAPER && !meets.length, JSON.stringify({ far: far.far, meets }));
        // (Z twice: two clicks up; the turrets' belief moves, the believed zero not, and the plaque's zero term with them)
        const before = await page.evaluate((h) => ({ b: window[h].gun().belief, terms: window[h].plaque()?.rec?.terms ?? [] }), H);
        await page.keyboard.press('KeyW'); await settle(page, 250); await page.waitForFunction((h) => window[h].stop()?.phase === 'choose', H, { timeout: 5000 });
        await page.keyboard.press('KeyW'); await settle(page, 250); await page.waitForFunction((h) => window[h].stop()?.phase === 'choose', H, { timeout: 5000 });
        await settle(page, 300);
        const after = await page.evaluate((h) => ({ b: window[h].gun().belief, terms: window[h].plaque()?.rec?.terms ?? [], card: document.querySelector('.steps .wcard')?.dataset.text ?? '' }), H);
        const z0 = before.terms.find(t => t.key === 'zero')?.v, z1 = after.terms.find(t => t.key === 'zero')?.v;
        console.log(`      Z twice: the turrets ${JSON.stringify(before.b.sight)} → ${JSON.stringify(after.b.sight)}, the believed zero ${JSON.stringify(before.b.zero)} → ${JSON.stringify(after.b.zero)}; the plaque's zero term ${JSON.stringify(z0)} → ${JSON.stringify(z1)}; the card '${after.card}'`);
        assert(after.b.sight.elev === before.b.sight.elev + 2 && after.b.sight.wind === before.b.sight.wind && JSON.stringify(after.b.zero) === JSON.stringify(before.b.zero) && z1?.elev === (z0?.elev ?? 0) + 2, JSON.stringify({ before, after }));
        // (the bot to the end: the end card says the KD's summary; Score it, 85, 80, 90; Copy my scores)
        const toEnd = await through('!!O.range()?.end', 20);
        await page.waitForFunction((h) => window[h].scene?.ended, H, { timeout: 15000 });
        for (let w = 0; w < 60 && !(await page.evaluate(() => !!document.querySelector('.glass.end'))); w++) { await page.keyboard.press('Enter'); await settle(page, 300); }
        await page.waitForFunction(() => document.querySelector('.glass.end'), null, { timeout: 15000 });
        const end = await page.evaluate(() => document.querySelector('.glass.end').innerText);
        console.log(`      the bot ran ${toEnd.ticks} ticks to the end: '${end.split('\n').filter(Boolean).slice(0, 3).join(' | ')}'`);
        assert(/End of the scene: The line at 300 m/i.test(end) && /(Clear|Closed|Stopped).* · (zero in|not zeroed in) \d group/.test(end), end);
        await settle(page, 400);
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('.glass.score'), null, { timeout: 5000 });
        await page.evaluate(() => { const set = [85, 80, 90]; [...document.querySelectorAll('.glass.score input.score')].forEach((i, n) => { i.value = String(set[n]); i.dispatchEvent(new Event('input')); }); });
        await page.click('.glass.score .copy');
        await page.waitForFunction(() => /Copied|failed/.test(document.querySelector('.glass.score .copied').textContent), null, { timeout: 5000 });
        const clip = await page.evaluate(async () => navigator.clipboard.readText().catch(e => `(no read: ${e.message})`));
        console.log(`      Copy my scores: '${clip}'`);
        assert(new RegExp(`^OLYMPUS v${await page.evaluate((h) => window[h].version, H)} · test-range · seed 48213 · far window 85 · shot at distance 80 · range safety 90 · ★ no · note: none$`).test(clip), clip);
      }, { query: 'nostore=1', viewport: { width: 1600, height: 900 } });
    },
  },
  {
    name: 'test-pairs, "Pairs": the Tests menu\'s picker (five sheets, the Private focused); by the URL with no errors; a turn\'s amber brackets closing and the pause on the sim\'s tick (seen + 0.55 s); Z, X and 1 in the window change nothing; the stamp, the plaque\'s lead and "Contact · 0.55 s."; Off safe, Aim, the Pair row priced and fired; the paper the sim\'s; the end card\'s "Again as Tier one" on the same seed; the HUD apart at 1600 × 900 and 1024 × 768; the score line "… · test-pairs · seed 48213 · turn 85 · shots 80 · gun 90 · ★ no · note: none"',
    heavy: true,
    timeoutMs: 420000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: game.origin });
        // (the Tests menu's "Pairs": the picker first)
        await page.click('#title .item.tests');
        const list = await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].map(b => b.innerText.split('\n')[0]));
        console.log(`      Tests: ${list.join(' | ')}`);
        assert(list.includes('Pairs') && list.indexOf('Pairs') === list.indexOf('The line at 300 m') + 1, JSON.stringify(list));
        await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.startsWith('Pairs')).click());
        await page.waitForSelector('#title .sheet.picker');
        const picker = await page.evaluate(() => ({ rows: [...document.querySelectorAll('#title .item.sheetpick')].map(b => ({ tier: b.dataset.tier, text: b.innerText.replace(/\s+/g, ' ').trim() })), focus: document.activeElement?.dataset?.tier ?? null }));
        console.log(`      the picker: ${picker.rows.map(r => r.text.split(' Warfighting')[0]).join(' | ')}; focused ${picker.focus}`);
        assert(picker.rows.map(r => r.tier).join() === 'recruit,private,sgt,raider,tierone' && picker.focus === 'private' && picker.rows.every(r => /Warfighting \d+/.test(r.text)), JSON.stringify(picker));
        await page.keyboard.press('Escape');
        await page.waitForSelector('#title .sheet.tests:not(.picker)');
        // (by the URL: the private on seed 48213)
        await game.open('play=test-pairs&tier=private&seed=48213&nostore=1');
        await playing(page);
        const start = await page.evaluate((h) => ({ scene: window[h].scene, pairs: window[h].pairs() }), H);
        console.log(`      the scene ${JSON.stringify(start.scene)}: ${start.pairs?.label}, lane ${start.pairs?.lane}, the ${start.pairs?.line} m line`);
        assert(start.scene?.id === 'test-pairs' && start.pairs?.sheet === 'private', JSON.stringify(start));
        // (the pairs bot in the page, the loop paused while it steps)
        const bot = (until, maxTicks = 60000) => page.evaluate(async ([h, until, maxTicks]) => {
          const { pairsBot } = await import('/tests/bots/pairs.mjs');
          const O = window[h]; window.__pairsBot ??= pairsBot();
          const run = window.__pairsBot, done = new Function('O', `return (${until});`);
          O.pause(true);
          let n = 0;
          for (; n < maxTicks && !done(O); n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); O.step(1, run(s, me, (me.bot ??= {}))); }
          return { ticks: n, done: done(O) };
        }, [H, until, maxTicks]);
        // (to the sighting tick of string 1: the window open, the brackets drawn at about three times the face's box)
        const toWin = await bot('!!O.contact()?.pending');
        await page.evaluate((h) => window[h].pause(false), H);
        await page.waitForFunction((h) => (window[h].contact()?.brackets?.length ?? 0) > 0, H, { timeout: 5000 });
        const win = await page.evaluate((h) => { const c = window[h].contact(), me = window[h].state.actors.list.find(a => a.id === window[h].state.player.actor); return { pending: c.pending, hud: c.hud, brackets: c.brackets, me: { x: me.x, z: me.z }, stop: window[h].stop()?.mode ?? null, refused: window[h].sim?.stats?.refused ?? 0 }; }, H);
        console.log(`      ${toWin.ticks} ticks to the sighting: the window ${win.pending.seenMs} to ${win.pending.untilMs} (${win.pending.ms} ms, ${win.pending.expect}, n ${win.pending.n}); the brackets × ${win.hud?.window?.scale} at k ${win.hud?.window?.k}: ${JSON.stringify(win.brackets)}`);
        assert(win.pending.ms === 550 && win.pending.untilMs - win.pending.seenMs === 550 && win.hud?.window?.scale > 1.5, JSON.stringify(win));
        // (Z, X and 1 in the window: nothing; the keys are the marine's once he has taken it in)
        await page.keyboard.down('KeyW'); await page.keyboard.press('KeyX'); await page.keyboard.press('Digit1');
        await page.waitForFunction((h) => window[h].stop()?.mode === 'stop' && !window[h].contact()?.pending, H, { timeout: 5000 });
        await page.keyboard.up('KeyW');
        // (past the pause's guard: main.js PAUSE_GUARD_MS 350 of real time, no key acts but Space and Esc)
        await settle(page, 450);
        const pause = await page.evaluate((h) => { const O = window[h], c = O.contact(), me = O.state.actors.list.find(a => a.id === O.state.player.actor); return { last: c.last, stop: O.stop(), hud: O.hud, plate: c.plate, me: { x: me.x, z: me.z }, ms: O.state.clock.ms, stamp: document.querySelector('.plaque.stamp')?.dataset.text ?? null, stampShown: !document.querySelector('.plaque.stamp')?.hidden }; }, H);
        const moved = Math.hypot(pause.me.x - win.me.x, pause.me.z - win.me.z);
        console.log(`      the pause at ${pause.last.atMs} (seen + ${pause.last.atMs - pause.last.seenMs} ms): the stamp '${pause.stamp}', the plate '${pause.plate}', the line '${pause.hud.lead}'; moved ${fmt(moved, 3)} m in the window, stop ${pause.stop.mode} via ${pause.stop.via ?? '?'}, pick ${pause.stop.pick}`);
        assert(pause.last.atMs === win.pending.untilMs && pause.last.ms === 550 && pause.stop.mode === 'stop' && pause.stop.pick === pause.last.ids[0], JSON.stringify(pause.last));
        assert(moved < 0.05 && pause.stamp === '0.55 S' && pause.stampShown && /^CONTACT · .*TAKEN IN 0\.55 S$/.test(pause.plate ?? '') && pause.hud.lead === 'Contact · 0.55 s.', JSON.stringify({ moved, stamp: pause.stamp, plate: pause.plate, lead: pause.hud.lead }));
        // (Off safe, Aim, then the Pair row: priced, its odds, fired: two rounds a split apart)
        const digitOf = (pred) => page.evaluate(([h, pred]) => { const f = new Function('s', `return (${pred});`); for (let n = 1; n <= 10; n++) { const s = window[h].stepOn(n % 10); if (s && s !== 'more' && f(s)) return n % 10; } return null; }, [H, pred]);
        // (a step chosen: time runs while it acts and stands again at its end, so the clock past the press and 'choose' is its end)
        const press = async (d) => {
          const ms0 = await page.evaluate((h) => window[h].state.clock.ms, H);
          await page.keyboard.press(`Digit${d}`);
          await page.waitForFunction(([h, ms0]) => window[h].state.clock.ms > ms0 && window[h].stop()?.phase === 'choose' && !window[h].stop()?.doing, [H, ms0], { timeout: 10000 });
          await settle(page, 200);
        };
        const offSafe = await digitOf("s.id === 'selector:semi'");
        assert(offSafe !== null, 'Off safe on the first page');
        await press(offSafe);
        const aim = await digitOf("s.kind === 'aim'");
        if (aim === null) console.log(`      no Aim after Off safe: ${await page.evaluate((h) => window[h].steps()?.text, H)}`);
        await press(aim);
        const pairRow = await page.evaluate((h) => window[h].steps().steps.find(x => x.id === 'shot:pair'), H);
        const pairDigit = await digitOf("s.id === 'shot:pair'"), rowText = await page.evaluate(() => [...document.querySelectorAll('.steps .step')].find(r => r.dataset.step === 'shot:pair')?.innerText.replace(/\s+/g, ' ') ?? '');
        console.log(`      the Pair on ${pairDigit}: '${rowText}' (${pairRow?.rounds?.map(r => `${r.part} ${Math.round(r.odds * 100)}%`).join(', ')}; parts ${pairRow?.parts?.map(p => `${p.k} ${p.ms}`).join(', ')})`);
        assert(pairDigit !== null && !pairRow.off && /Pair/.test(rowText) && /\d\.\d\d s/.test(rowText) && /\d+% \d+%/.test(rowText), JSON.stringify({ pairRow, rowText }));
        const shots0 = await page.evaluate((h) => window[h].state.armoury.range.str?.shots?.length ?? 0, H);
        await press(pairDigit);
        const fired = await page.evaluate((h) => (window[h].state.armoury.range.str?.shots ?? []).filter(x => x.fired !== false).map(x => ({ atMs: x.atMs, row: x.row ?? null, zone: x.zone ?? null })), H);
        console.log(`      the Pair fired: ${JSON.stringify(fired.slice(shots0))}; split ${fired.length >= 2 ? fired.at(-1).atMs - fired.at(-2).atMs : '?'} ms; the rows' reports heard ${JSON.stringify(await page.evaluate((h) => window[h].rangeSound?.rowShots ?? null, H))}`);
        assert(fired.length - shots0 === 2, JSON.stringify(fired));
        // (the bot to the string's paper: the paper is the sim's text)
        await bot('!!O.pairs()?.strs?.at(-1)?.done');
        await page.evaluate((h) => window[h].pause(false), H);
        await page.waitForFunction(() => !document.querySelector('.timer')?.hidden, null, { timeout: 5000 });
        const paper = await page.evaluate((h) => { const p = window[h].pairs(), last = p.strs.at(-1); return { shown: document.querySelector('.timer')?.dataset.text, sim: typeof last.paper === 'string' ? last.paper : last.paper?.text }; }, H);
        console.log(`      the paper '${paper.shown}' (the sim's '${paper.sim}')`);
        assert(paper.shown && paper.shown === paper.sim, JSON.stringify(paper));
        // (the HUD and the paper apart, at two sizes)
        for (const [w, hh] of [[1600, 900], [1024, 768]]) {
          await page.setViewportSize({ width: w, height: hh }); await settle(page, 500);
          const got = await page.evaluate(() => {
            const r = (sel) => { const e = document.querySelector(sel); if (!e || e.hidden || e.closest('[hidden]') || getComputedStyle(e).display === 'none') return null; const b = e.getBoundingClientRect(); return b.width && b.height ? { x: b.left, y: b.top, w: b.width, h: b.height } : null; };
            return { TOASTS: r('.toasts'), WATCH: r('.watch'), TIMER: r('.timer'), INSTINCT: r('.instinct'), STEPS: r('.steps'), RADIO: r('.radio.voices'), KEYS: r('.keyshint'), BANNER: r('.banner') };
          });
          const names = Object.keys(got).filter(k => got[k]), clash = [];
          for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) if (overlaps(got[names[i]], got[names[j]])) clash.push(`${names[i]} × ${names[j]}`);
          console.log(`      ${w} × ${hh}: ${names.map(n => `${n} ${fmt(got[n].w, 0)}×${fmt(got[n].h, 0)}@${fmt(got[n].x, 0)},${fmt(got[n].y, 0)}`).join(' ')}; meeting: ${clash.join(', ') || 'none'}`);
          assert(got.TIMER && !clash.length, JSON.stringify({ got, clash }));
        }
        await page.setViewportSize({ width: 1600, height: 900 }); await settle(page, 300);
        // (the bot to the end; the end card's sheet and aspects, then "Again as Tier one")
        await bot('!!O.range()?.end', 200000);
        await page.evaluate((h) => window[h].pause(false), H);
        await page.waitForFunction((h) => window[h].scene?.ended, H, { timeout: 15000 });
        for (let w = 0; w < 60 && !(await page.evaluate(() => !!document.querySelector('.glass.end'))); w++) { await page.keyboard.press('Enter'); await settle(page, 300); }
        await page.waitForFunction(() => document.querySelector('.glass.end'), null, { timeout: 15000 });
        const end = await page.evaluate(() => ({ text: document.querySelector('.glass.end').innerText, again: [...document.querySelectorAll('.glass.end .again-as')].map(b => /Again as [^\n]+/.exec(b.innerText)?.[0] ?? '') }));
        console.log(`      the end card: '${end.text.split('\n').filter(Boolean).slice(0, 5).join(' | ')}'; ${end.again.join(', ')}`);
        assert(/End of the scene: Pairs, as Private/i.test(end.text) && /turn /.test(end.text) && /shots /.test(end.text) && /gun /.test(end.text) && end.again.includes('Again as Tier one') && end.again.length === 4, JSON.stringify(end));
        // (Score it, 85, 80, 90; Copy my scores; Done; then Again as Tier one: the same seed, the same targets)
        await settle(page, 400);
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('.glass.score'), null, { timeout: 5000 });
        await page.evaluate(() => { const set = [85, 80, 90]; [...document.querySelectorAll('.glass.score input.score')].forEach((i, n) => { i.value = String(set[n]); i.dispatchEvent(new Event('input')); }); });
        await page.click('.glass.score .copy');
        await page.waitForFunction(() => /Copied|failed/.test(document.querySelector('.glass.score .copied').textContent), null, { timeout: 5000 });
        const clip = await page.evaluate(async () => navigator.clipboard.readText().catch(e => `(no read: ${e.message})`));
        console.log(`      Copy my scores: '${clip}'`);
        assert(new RegExp(`^OLYMPUS v${await page.evaluate((h) => window[h].version, H)} · test-pairs · seed 48213 · turn 85 · shots 80 · gun 90 · ★ no · note: none$`).test(clip), clip);
        await page.keyboard.press('Digit2');
        await page.waitForFunction(() => document.querySelector('.glass.end'), null, { timeout: 5000 });
        const strings0 = await page.evaluate((h) => window[h].pairs()?.strs?.map(x => x.keys?.join('+')).join(' / '), H);
        await page.evaluate(() => [...document.querySelectorAll('.glass.end .again-as')].find(b => /Again as Tier one/.test(b.innerText)).click());
        await playing(page);
        const again = await page.evaluate((h) => ({ scene: window[h].scene, sheet: window[h].pairs()?.sheet, lane: window[h].pairs()?.lane }), H);
        await page.evaluate(() => { window.__pairsBot = null; });
        const toWin1 = await bot('!!O.contact()?.pending');
        const pend1 = await page.evaluate((h) => window[h].contact().pending, H);
        console.log(`      Again as Tier one: ${JSON.stringify(again)}; its first window ${pend1?.ms} ms (${pend1?.expect}) after ${toWin1.ticks} ticks; the private's strings were ${strings0}`);
        assert(again.scene?.seed === 48213 && again.sheet === 'tierone' && pend1?.ms === 50, JSON.stringify({ again, pend1 }));
        await page.evaluate((h) => window[h].pause(false), H);
      }, { query: 'nostore=1', viewport: { width: 1600, height: 900 } });
    },
  },
  {
    name: '"Three bangs" (0.0.9; the user, 2026-11-07: "a recruit would likely be so supressed that they would be even likely to fail simple actions like thumbing safety off"): the Tests menu\'s entry and its picker (the Boot recruit focused, the hardening words); by the URL with no errors; each bang\'s flash at or after its moment; keys refused while startled; FROZE at its end with the sim\'s figure; the picture pinned; "! shaking" on Off safe, its first try failing on the panel\'s ticks; the paper the scene\'s; the end card\'s bangs, "Again as Tier one" with the setup; the score line',
    heavy: true,
    timeoutMs: 480000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: game.origin });
        // (the Tests menu: "Three bangs" after "Pairs", its picker on the Boot recruit with the words)
        await page.click('#title .item.tests');
        const list = await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].map(b => b.innerText.split('\n')[0]));
        assert(list.indexOf('Three bangs') === list.indexOf('Pairs') + 1, JSON.stringify(list));
        await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.startsWith('Three bangs')).click());
        await page.waitForSelector('#title .sheet.picker');
        const picker = await page.evaluate(() => ({ rows: [...document.querySelectorAll('#title .item.sheetpick')].map(b => ({ tier: b.dataset.tier, text: b.innerText.replace(/\s+/g, ' ').trim() })), focus: document.activeElement?.dataset?.tier ?? null, setup: document.querySelector('#title .sheet.picker .sub.setup')?.textContent ?? null }));
        console.log(`      Tests: ${list.join(' | ')}\n      the picker: ${picker.rows.map(r => r.text.split(' · ')[0]).join(' | ')}; focused ${picker.focus}; '${picker.setup}'`);
        const words = { recruit: 'green', private: 'green', sgt: 'steady', raider: 'hardened', tierone: 'unshakeable' };
        // (the fixer's of v0.0.9: labelled and leading on "Three bangs")
        assert(picker.focus === 'recruit' && picker.rows.every(r => r.text.includes(`Hardening: ${words[r.tier]}`)) && picker.setup, JSON.stringify(picker));
        await page.keyboard.press('Escape');
        // (by the URL, from its brief: no errors, the goal)
        await game.open('play=test-pairs&setup=bangs&tier=recruit&seed=48213&nostore=1');
        await playing(page);
        const boot = await page.evaluate((h) => ({ scene: window[h].scene, setup: window[h].state.armoury.range.setup, toasts: window[h].hud?.toasts ?? [] }), H);
        console.log(`      by the URL: ${JSON.stringify(boot.scene)}, setup ${boot.setup}; toasts ${JSON.stringify(boot.toasts)}`);
        assert(boot.scene?.id === 'test-pairs-bangs' && boot.setup === 'bangs', JSON.stringify(boot));
        // (the banged standby, every frame sampled: the bangs drawn, the startle, FROZE)
        await game.open('play=test-pairs&setup=bangs:standby&tier=recruit&seed=48213&nostore=1');
        await page.waitForFunction((h) => window[h].state?.armoury?.range?.bangs && window.__ready, H, { timeout: 30000 });
        await page.evaluate((h) => {
          window.__bs = [];
          const f = () => { if (!window.__bs) return; const O = window[h], s = O.supp(); window.__bs.push({ ms: s?.bangs?.ms ?? null, flashing: s?.bangs?.flashing ?? [], startle: s?.now?.startle ?? null, froze: s?.now?.froze ?? null, frozeText: s?.frozeText ?? null, band: s?.picture?.bandN ?? 0, stop: O.state.stop?.mode ?? null }); requestAnimationFrame(f); };
          requestAnimationFrame(f);
        }, H);
        // (the first startle: X, Z and 1 pressed in it)
        await page.waitForFunction((h) => !!window[h].supp()?.now?.startle, H, { timeout: 30000, polling: 'raf' });
        const steps0 = await page.evaluate((h) => window[h].state.armoury.range.str?.shots?.length ?? 0, H);
        await page.keyboard.down('KeyW'); await page.keyboard.press('KeyX'); await page.keyboard.press('Digit1'); await page.keyboard.up('KeyW');
        const inIt = await page.evaluate((h) => ({ startle: !!window[h].supp()?.now?.startle, stop: window[h].state.stop?.mode ?? null, me: (() => { const s = window[h].state, a = s.actors.list.find(x => x.id === s.player.actor); return { x: a.x, z: a.z }; })() }), H);
        // (the stamp counts up while he is startled (the fixer's of v0.0.9): its standing figure at the startle's end)
        await page.waitForFunction((h) => { const s = window[h].supp(); return !!s?.frozeText && !!s.now?.froze && !s.now?.startle; }, H, { timeout: 15000, polling: 'raf' });
        const fz = await page.evaluate((h) => { const s = window[h].supp(); return { froze: s.now.froze, text: s.frozeText, band: s.picture?.bandN, stop: window[h].state.stop?.mode ?? null }; }, H);
        const takeIn = await page.evaluate(async (ms) => (await import('/src/sim/combat/react.js')).takeInWords(ms), fz.froze.ms);
        console.log(`      keys pressed while startled: stop motion ${inIt.stop ?? 'off'}, startled ${inIt.startle}; FROZE '${fz.text}' (the sim's ${fz.froze.ms} ms), the picture's band ${fz.band}, stop ${fz.stop ?? 'off'}`);
        assert(inIt.startle && inIt.stop === null && fz.stop === null && fz.text === `FROZE ${takeIn} S` && fz.band === 3, JSON.stringify({ inIt, fz }));
        // (on to the pause; the bangs' frames read)
        await page.waitForFunction((h) => window[h].state.stop?.mode === 'stop' && window[h].contact()?.last && !window[h].contact()?.pending, H, { timeout: 30000 });
        await settle(page, 450);
        const bs = await page.evaluate(() => { const b = window.__bs; window.__bs = null; return b; });
        const plan = await page.evaluate((h) => window[h].state.armoury.range.bangs.plan.map(b => ({ id: b.key ?? b.id, atMs: b.atMs })), H);
        const flashes = plan.map(b => { const f = bs.find(x => x.flashing.includes(b.id)); return { id: b.id, atMs: b.atMs, drawnMs: f?.ms ?? null }; });
        console.log(`      the flashes: ${flashes.map(f => `${f.id} at ${f.atMs} drawn at +${f.drawnMs === null ? '?' : fmt(f.drawnMs - f.atMs, 1)} ms`).join(', ')}`);
        assert(flashes.every(f => f.drawnMs !== null && f.drawnMs >= f.atMs && f.drawnMs - f.atMs < 500), JSON.stringify(flashes));
        // (the pause: Off safe "! shaking" with its odds; its first try fails on 48213, the panel's ticks ✗)
        const off = await page.evaluate((h) => { const r = [...document.querySelectorAll('.steps .step')].find(x => x.dataset.step === 'selector:semi'); return r ? { text: r.innerText.replace(/\s+/g, ' '), key: r.dataset.key, title: r.title, cls: r.className } : null; }, H);
        console.log(`      Off safe: '${off?.text}' (${off?.cls}); its hover '${off?.title}'`);
        assert(off && /! shaking/.test(off.text) && /\d+%/.test(off.text) && /shaking/.test(off.cls) && /felt \d+/.test(off.title), JSON.stringify(off));
        await page.evaluate(() => { window.__ticks = []; const f = () => { if (!window.__ticks) return; const t = [...document.querySelectorAll('.steps .running-view .rv-sub b')].map(b => b.textContent).join('') || (document.querySelector('.steps .wc-last:not([hidden])')?.dataset.text ?? ''); if (t) window.__ticks.push(t); requestAnimationFrame(f); }; requestAnimationFrame(f); });
        const ms0 = await page.evaluate((h) => window[h].state.clock.ms, H);
        await page.keyboard.press(`Digit${off.key}`);
        await page.waitForFunction(([h, ms0]) => window[h].state.clock.ms > ms0 && window[h].stop()?.phase === 'choose' && !window[h].stop()?.doing, [H, ms0], { timeout: 10000 });
        await settle(page, 300);
        const ticks = await page.evaluate(() => { const t = window.__ticks; window.__ticks = null; return t; });
        const failed = await page.evaluate((h) => (window[h].state.log ?? []).filter(r => r.kind === 'roll' && r.step === 'selector:semi').map(r => ({ ok: r.roll?.ok, text: r.text })), H);
        console.log(`      Off safe's ticks on the panel: ${[...new Set(ticks)].map(t => `'${t}'`).join(' → ')}; the rolls: ${JSON.stringify(failed)}`);
        assert(ticks.some(t => t.includes('✗')), JSON.stringify({ ticks, failed }));
        // (the bot to the banged paper: the paper the scene's)
        const bot = (until, maxTicks = 60000) => page.evaluate(async ([h, until, maxTicks]) => {
          const { pairsBot } = await import('/tests/bots/pairs.mjs');
          const O = window[h]; window.__pairsBot ??= pairsBot();
          const run = window.__pairsBot, done = new Function('O', `return (${until});`);
          O.pause(true);
          let n = 0;
          for (; n < maxTicks && !done(O); n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); O.step(1, run(s, me, (me.bot ??= {}))); }
          return { ticks: n, done: done(O) };
        }, [H, until, maxTicks]);
        await bot('!!O.pairs()?.strs?.[0]?.done');
        await page.evaluate((h) => window[h].pause(false), H);
        await page.waitForFunction(() => !document.querySelector('.timer')?.hidden, null, { timeout: 5000 });
        const paper = await page.evaluate((h) => { const p = window[h].pairs(), first = p.strs[0]; return { shown: document.querySelector('.timer')?.dataset.text, sim: typeof first.paper === 'string' ? first.paper : first.paper?.text }; }, H);
        console.log(`      the banged paper '${paper.shown}' (the sim's '${paper.sim}')`);
        assert(paper.shown === paper.sim && /^BANGS 3/.test(paper.shown), JSON.stringify(paper));
        // (to the end: the card's bangs lines; Score it at 80; Copy my scores; Again as Tier one)
        await bot('!!O.range()?.end', 200000);
        await page.evaluate((h) => window[h].pause(false), H);
        await page.waitForFunction((h) => window[h].scene?.ended, H, { timeout: 15000 });
        for (let w = 0; w < 60 && !(await page.evaluate(() => !!document.querySelector('.glass.end'))); w++) { await page.keyboard.press('Enter'); await settle(page, 300); }
        const end = await page.evaluate(() => ({ bangs: [...document.querySelectorAll('.glass.end .bang-said')].map(p => p.textContent), again: [...document.querySelectorAll('.glass.end .again-as')].map(b => /Again as [^\n]+/.exec(b.innerText)?.[0] ?? ''), score: [...document.querySelectorAll('.glass.end .item')].find(b => /Score it/.test(b.innerText))?.innerText.replace(/\s+/g, ' ') }));
        console.log(`      the end card: ${end.bangs.map(t => `'${t}'`).join(' | ')}; '${end.score}'; ${end.again.join(', ')}`);
        assert(end.bangs.length >= 1 && /Boot recruit · three bangs/.test(end.bangs[0]) && /one aspect/.test(end.score) && end.again.includes('Again as Tier one'), JSON.stringify(end));
        await settle(page, 400);
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('.glass.score'), null, { timeout: 5000 });
        await page.evaluate(() => { const i = document.querySelector('.glass.score input.score'); i.value = '80'; i.dispatchEvent(new Event('input')); });
        await page.click('.glass.score .copy');
        await page.waitForFunction(() => /Copied|failed/.test(document.querySelector('.glass.score .copied').textContent), null, { timeout: 5000 });
        const clip = await page.evaluate(async () => navigator.clipboard.readText().catch(e => `(no read: ${e.message})`));
        console.log(`      Copy my scores: '${clip}'`);
        assert(new RegExp(`^OLYMPUS v${await page.evaluate((h) => window[h].version, H)} · test-pairs-bangs · seed 48213 · bangs 80 · ★ no · note: none$`).test(clip), clip);
        await page.keyboard.press('Digit2');
        await page.waitForFunction(() => document.querySelector('.glass.end'), null, { timeout: 5000 });
        await page.evaluate(() => [...document.querySelectorAll('.glass.end .again-as')].find(b => /Again as Tier one/.test(b.innerText)).click());
        await playing(page);
        const again = await page.evaluate((h) => ({ scene: window[h].scene, sheet: window[h].pairs()?.sheet, setup: window[h].state.armoury.range.setup }), H);
        await page.evaluate(() => { window.__pairsBot = null; });
        await bot('!!O.supp()?.now?.froze');
        await page.evaluate((h) => window[h].pause(false), H);
        await page.waitForFunction((h) => window[h].supp()?.frozeText, H, { timeout: 10000, polling: 'raf' }).catch(() => null);
        const t1 = await page.evaluate((h) => ({ froze: window[h].supp()?.now?.froze, text: window[h].supp()?.frozeText, band: window[h].supp()?.now?.bandN }), H);
        console.log(`      Again as Tier one: ${JSON.stringify(again)}; his FROZE '${t1.text}' (${t1.froze?.ms} ms), band ${t1.band}`);
        assert(again.scene?.id === 'test-pairs-bangs' && again.scene.seed === 48213 && again.sheet === 'tierone' && again.setup === 'bangs' && t1.froze && t1.froze.ms <= 100 && t1.band === 0, JSON.stringify({ again, t1 }));
        assert(!errors.length, errors.join('\n'));
      }, { query: 'nostore=1', viewport: { width: 1600, height: 900 } });
    },
  },
  {
    name: 'the pause\'s guard (the runtime review of v0.0.8): X pressed by reflex 150 ms after the brackets appear, as the tier one and the Raider, lands after their pause and does nothing: stop motion is still on 0.5 s later, the clock held at the pause; a digit that went down in the window does nothing when it comes up',
    heavy: true,
    timeoutMs: 240000,
    async fn() {
      await withGame(async (page, errors, game) => {
        const rows = [];
        for (const tier of ['tierone', 'raider']) {
          await game.open(`play=test-pairs&tier=${tier}&seed=48213&setup=standby&nostore=1`);
          await page.waitForFunction((h) => window[h].pairs()?.cmd === 'standby' && !window[h].state.stop, H, { timeout: 30000 });
          await page.waitForFunction((h) => !!window[h].contact()?.pending, H, { timeout: 30000, polling: 'raf' });
          const t0 = Date.now();
          await page.waitForTimeout(150);
          await page.keyboard.press('KeyX');
          const tX = Date.now() - t0;
          await page.waitForTimeout(500);
          const r = await page.evaluate((h) => { const s = window[h].state, c = window[h].contact(); return { stop: s.stop?.mode ?? null, via: s.stop?.via ?? null, take: c?.last?.ms ?? null, past: c?.last ? s.clock.ms - c.last.atMs : null }; }, H);
          rows.push(`${tier}: take-in ${r.take} ms, X at +${tX} ms; 0.5 s later stop motion ${r.stop ?? 'off'} (via ${r.via}), the clock ${r.past} ms past the pause`);
          assert(r.stop === 'stop' && r.via === 'contact' && r.past !== null && r.past <= 100, JSON.stringify({ tier, ...r }));
        }
        // (a digit down in the window, up after the pause: no row chosen)
        await game.open('play=test-pairs&tier=tierone&seed=48213&setup=standby&nostore=1');
        await page.waitForFunction((h) => window[h].pairs()?.cmd === 'standby' && !window[h].state.stop, H, { timeout: 30000 });
        await page.waitForFunction((h) => !!window[h].contact()?.pending, H, { timeout: 30000, polling: 'raf' });
        await page.keyboard.down('Digit1');
        await page.waitForTimeout(120);
        await page.keyboard.up('Digit1');
        await page.waitForTimeout(400);
        const d = await page.evaluate((h) => { const s = window[h].state; return { stop: s.stop?.mode ?? null, doing: s.stop?.doing?.step ?? null, phase: s.stop?.phase ?? null, shots: s.armoury.range.str?.shots?.length ?? 0 }; }, H);
        rows.push(`a digit down in the tier one's window and up after his pause: ${JSON.stringify(d)}`);
        for (const l of rows) console.log(`      ${l}`);
        assert(d.stop === 'stop' && d.phase === 'choose' && !d.doing && d.shots === 0, JSON.stringify(d));
      }, { query: 'nostore=1', viewport: { width: 1600, height: 900 } });
    },
  },
  {
    name: 'test-range\'s 200 m line on seed 99 (you on point 11) at 1600 × 900: "Set your dope for two hundred." stays on top of the radio box under the coach\'s dope and wind call, and in stop motion; "Commence fire." with his wind call wrapped beside it, marked NOW, the only tower line in the box, its short form keeping \"sixty seconds\" (and on seed 48213); every voice whole in the box; your stake marked (the user, 2026-11-07: "tower sometimes doesn\'t say anything but we\'re expected to do it ?", their shot of the 200 m line with the coach\'s wind call alone in the box)',
    heavy: true,
    timeoutMs: 180000,
    async fn() {
      await withGame(async (page) => {
        const box = () => page.evaluate((h) => {
          const r = document.querySelector('.radio.voices'), b = r.getBoundingClientRect();
          const voices = [...r.querySelectorAll('.voice')].map(v => ({ text: v.querySelector('.who').innerText + ' ' + v.querySelector('.said').innerText.replace(/\s+/g, ' '), whole: v.querySelector('.said').scrollHeight <= v.querySelector('.said').clientHeight + 1, top: v.getBoundingClientRect().top, standing: v.classList.contains('standing'), tag: getComputedStyle(v, '::before').content }));
          return { hud: window.__report?.hud?.radio ?? '', voices, inside: voices.every(v => v.top >= b.top - 1), h: b.height, own: window.__report?.view?.range?.kd?.own ?? null, cmd: window[h].kd()?.cmd, kdLane: window[h].kd()?.kdLane };
        }, H);
        await page.waitForFunction((h) => window[h].kd()?.cmd === 'dope', H, { timeout: 30000 });
        await settle(page, 800);
        const dope = await box();
        await page.keyboard.press('KeyG');
        await page.waitForFunction((h) => window[h].stop()?.phase === 'choose', H, { timeout: 10000 });
        await settle(page, 1500);
        const held = await box();
        console.log(`      at the dope, point ${dope.kdLane}: ${dope.voices.map(v => `[${v.text}]`).join(' ')}; stop motion 1.5 s on: ${held.voices.length} voices, the first '${held.voices[0]?.text}'; your stake: ${dope.own} pixels marked`);
        const towerDope = /^◉ TOWER · .+ (Set your dope for two hundred\.|Shooters, dial your dope for two hundred\.)$/;
        assert(dope.kdLane === 11 && towerDope.test(dope.voices[0]?.text ?? '') && dope.voices[0].standing && /Wind from|I make it|No wind|Flags are limp/.test(dope.voices.at(-1)?.text ?? ''), JSON.stringify(dope));
        assert(towerDope.test(held.voices[0]?.text ?? '') && held.voices.every(v => v.whole) && held.inside && dope.own >= 30, JSON.stringify(held));
        // (the KD bot in the page to commence fire, choosing: the tower's command with the coach's wind call)
        const toFire = () => page.evaluate(async (h) => {
          const { kdBot } = await import('/tests/bots/kd.mjs');
          const O = window[h], run = kdBot();
          O.pause(true);
          let k = 0;
          for (; k < 20000 && !(O.kd()?.cmd === 'fire' && O.kd()?.hot && O.stop()?.phase === 'choose'); k++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, run(s, me, (me.bot ??= {}))); }
          O.pause(false);
          return k;
        }, H);
        const n = await toFire();
        await settle(page, 1500);
        const fire = await box();
        console.log(`      the bot ran ${n} ticks to commence fire: ${fire.voices.map(v => `[${v.text}]`).join(' ')}; the box ${fmt(fire.h, 0)} px high; the command's tag ${fire.voices[0]?.tag}`);
        // (the command marked NOW, the only tower line in the box: none of the earlier commands under it, the verifier's)
        const fireOk = (f) => f.cmd === 'fire' && /^◉ TOWER · .+ (.*sixty seconds.*Commence fire\.)$/.test(f.voices[0]?.text ?? '') && f.voices[0].standing && f.voices[0].tag === '"NOW"'
          && f.voices.filter(v => /^◉ TOWER/.test(v.text)).length === 1 && f.voices.every(v => v.whole) && f.inside;
        assert(fireOk(fire), JSON.stringify(fire));
        // (seed 48213, whose command and the coach's wind call both wrap: the command's short form keeps its rounds and its
        // minute, "Ten rounds rapid, sixty seconds. Commence fire.", never the bare "Commence fire." (the tower verifier's))
        await page.evaluate((h) => window[h].newGame({ scenario: 'test-range', seed: 48213, setup: 's200' }), H);
        await page.waitForFunction((h) => window[h].kd()?.cmd, H, { timeout: 30000 });
        const n2 = await toFire();
        await settle(page, 1500);
        const wrap = await box();
        console.log(`      seed 48213, ${n2} ticks to commence fire: ${wrap.voices.map(v => `[${v.text}]`).join(' ')}`);
        assert(fireOk(wrap), JSON.stringify(wrap));
      }, { query: 'play=test-range&seed=99&setup=s200&nostore=1', viewport: { width: 1600, height: 900 } });
    },
  },
  {
    name: '"Bang" in the page (0.0.10, heavy): the Tests menu\'s entry and its picker on the Boot recruit; the din\'s blanks each flashed on the first frame at or after their moment, once, and the horn in the coach\'s hand while it sounds; "Bang!" in the radio box before the burst; Breathe out of the mode in a standby with the turn armed; the hit card in belief at a pause, in truth at the string\'s end; "Again as Tier one" keeps the seed; Copy my scores in ROADMAP §2.2\'s form',
    heavy: true,
    timeoutMs: 600000,
    async fn() {
      await withGame(async (page, errors, game) => {
        const rows = [];
        // (the Tests menu and the picker)
        await page.waitForSelector('#title .item.tests');
        await page.click('#title .item.tests');
        const bang = await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].map(b => b.innerText.split('\n')[0]));
        await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.startsWith('Bang')).click());
        await page.waitForSelector('#title .sheet.picker');
        const pk = await page.evaluate(() => [...document.querySelectorAll('#title .item.sheetpick')].map(b => ({ tier: b.dataset.tier, lead: b.classList.contains('lead') })));
        rows.push(`the Tests menu: ${bang.join(' | ')}; the picker: ${pk.map(r => `${r.tier}${r.lead ? ' (focused)' : ''}`).join(', ')}`);
        assert(bang.includes('Bang') && pk[0]?.tier === 'recruit' && pk[0].lead, JSON.stringify({ bang, pk }));
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.stress, null, { timeout: 60000 });
        rows.push(`Enter: the scene ${JSON.stringify(await page.evaluate(() => window.__olympus.scene))}`);
        // (the din in real time: every frame's din as drawn, with the game's ms; the plan's blanks)
        await game.open('play=test-stress&setup=standby:1&tier=recruit&seed=48213&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.stress, null, { timeout: 60000 });
        await page.evaluate(() => { window.__din = []; const f = () => { if (!window.__din) return; const st = window.__olympus.stress(); if (st) window.__din.push({ ms: window.__olympus.state.clock.ms, horn: !!st.din?.horn, flashing: st.din?.flashing ?? [], look: !!st.look?.horn }); requestAnimationFrame(f); }; requestAnimationFrame(f); });
        // (to the turn, where stop motion holds the clock, or to the last blank)
        await page.waitForFunction(() => { const R = window.__olympus.state.armoury.range, p = (R.stress?.plan ?? []).filter(e => e.kind === 'blank'); return p.length && p.filter(e => e.done).length >= 10 && (R.str?.turnedMs !== null && R.str?.turnedMs !== undefined || p.every(e => e.done)); }, null, { timeout: 60000, polling: 250 });
        await page.waitForTimeout(1500);
        const din = await page.evaluate(() => { const d = window.__din; window.__din = null; const p = window.__olympus.state.armoury.range.stress.plan; return { frames: d, blanks: p.filter(e => e.kind === 'blank' && e.done).map(e => ({ key: e.key, atMs: e.atMs })), horns: p.filter(e => e.kind === 'horn').map(e => ({ atMs: e.atMs, untilMs: e.untilMs })) }; });
        const firstOf = new Map(), counts = new Map();
        for (const f of din.frames) for (const k of f.flashing) { if (!firstOf.has(k)) firstOf.set(k, f.ms); counts.set(k, (counts.get(k) ?? 0) + 1); }
        const late = din.blanks.filter(b => firstOf.has(b.key) && firstOf.get(b.key) - b.atMs > 500), early = din.blanks.filter(b => firstOf.has(b.key) && firstOf.get(b.key) < b.atMs - 50), missed = din.blanks.filter(b => !firstOf.has(b.key));
        const hornFrames = din.frames.filter(f => f.horn).length, hornWrong = din.frames.filter(f => f.horn && !din.horns.some(h => f.ms >= h.atMs - 100 && f.ms <= h.untilMs + 100)).length;
        rows.push(`the din: ${din.frames.length} frames, ${din.blanks.length} blanks gone off, ${firstOf.size} flashed (on ${[...counts.values()].reduce((a, b) => a + b, 0)} frames), missed ${missed.length}, early ${early.length}, late ${late.length}; the horn ${din.horns.length} blasts, drawn on ${hornFrames} frames, ${hornWrong} outside its time`);
        assert(din.blanks.length >= 10 && !missed.length && !early.length && !late.length && hornFrames > 0 && !hornWrong, JSON.stringify({ missed, early, late, hornWrong }));
        // (the called bang: "Bang!" in the radio box before the burst)
        await game.open('play=test-stress&setup=standby:2&tier=recruit&seed=48213&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.stress, null, { timeout: 60000 });
        await page.evaluate(() => { window.__said = []; const f = () => { if (!window.__said) return; const O = window.__olympus, p = O.state.armoury.range.stress?.plan ?? []; const said = (O.radio ?? []).map(l => l.text).join(' | '); window.__said.push({ ms: O.state.clock.ms, bang: /Bang!/.test(said), burst: p.find(e => e.kind === 'bang')?.atMs ?? null, toast: (O.hud?.toasts ?? []).map(t => t.text ?? t).join(' | ') }); requestAnimationFrame(f); }; requestAnimationFrame(f); });
        await page.waitForFunction(() => { const p = window.__olympus.state.armoury.range.stress?.plan ?? []; const b = p.find(e => e.kind === 'bang'); return b && b.done; }, null, { timeout: 60000, polling: 200 });
        const said = await page.evaluate(() => { const s = window.__said; window.__said = null; return s; });
        const burst = said.find(x => x.burst)?.burst ?? null, firstBang = said.find(x => x.bang)?.ms ?? null, cap = said.some(x => /\[a shout: Bang!/.test(x.toast));
        rows.push(`the called bang: "Bang!" in the radio box at ${firstBang}, the burst at ${burst} (${firstBang !== null && burst !== null ? fmt((burst - firstBang) / 1000, 2) : '?'} s before), captioned ${cap}`);
        assert(firstBang !== null && burst !== null && firstBang < burst && cap, JSON.stringify({ firstBang, burst, cap }));
        // (Breathe out of the mode in a standby: the DI's T after the bangs on string 4's standby, the turn still armed)
        await game.open('play=test-stress&setup=standby:3&tier=recruit&seed=48213&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.stress, null, { timeout: 60000 });
        await page.waitForFunction(() => { const O = window.__olympus, I = O.instinct(); return I?.line?.id === 'stress-breathe' || I?.chip?.id === 'stress-breathe' || O.state.armoury.range.str?.turnedMs !== null && O.state.armoury.range.str?.turnedMs !== undefined; }, null, { timeout: 60000, polling: 50 });
        const offer = await page.evaluate(() => { const O = window.__olympus, I = O.instinct(); return { line: I?.line?.id ?? null, chip: I?.chip?.id ?? null, text: I?.line?.text ?? I?.chip?.text ?? null, felt: O.supp()?.now?.felt ?? null }; });
        let breathed = null;
        if (offer.line === 'stress-breathe' || offer.chip === 'stress-breathe') {
          await page.waitForFunction(() => !window.__olympus.supp()?.now?.startle, null, { timeout: 10000 });
          await page.keyboard.down('KeyT');
          if (offer.line !== 'stress-breathe') await page.waitForTimeout(300);
          await page.keyboard.up('KeyT');
          await page.waitForFunction(() => window.__olympus.stress()?.breathe?.running, null, { timeout: 5000 }).catch(() => null);
          await page.waitForTimeout(600);
          breathed = await page.evaluate(() => { const O = window.__olympus, st = O.stress(), s = O.state.armoury.range.str; return { running: st.breathe.running, lead: O.hud?.lead ?? null, armed: !!s && s.turnAtMs !== null && s.turnedMs === null, mode: O.state.stop?.mode ?? null, box: O.stress().sound?.breathing ?? null }; });
        }
        rows.push(`Breathe: the DI's ${offer.line ?? offer.chip ?? 'nothing'} '${offer.text ?? ''}'; T: ${JSON.stringify(breathed)}`);
        assert(breathed && breathed.running && breathed.live !== false && /^Breathe · /.test(breathed.lead ?? '') && breathed.armed, JSON.stringify({ offer, breathed }));
        // (the hit card: the stress bot to a pause after a round on him, then to the string's end)
        const bot = (until, maxTicks = 60000) => page.evaluate(async ([until, maxTicks]) => {
          const { stressBot } = await import('/tests/bots/stress.mjs');
          const O = window.__olympus; window.__bot = window.__bot ?? stressBot();
          const run = window.__bot, done = new Function('O', `return (${until});`);
          let n = 0; O.pause(true);
          for (; n < maxTicks && !done(O); n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); O.step(1, run(s, me, (me.bot ??= {}))); }
          return n;
        }, [until, maxTicks]);
        await game.open('play=test-stress&tier=recruit&seed=48213&nostore=1');
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.stress, null, { timeout: 60000 });
        await bot("O.state.stop?.mode === 'stop' && O.state.stop.phase === 'choose' && O.state.armoury.range.str && !O.state.armoury.range.str.done && O.state.armoury.range.str.shots?.some(x => x.fired)");
        await page.waitForTimeout(300);
        const belief = await page.evaluate(() => window.__olympus.stress().hit);
        await bot("O.state.armoury.range.strs.some(x => x.k === 0 && x.done !== 'setup')");
        await page.waitForTimeout(300);
        const truth = await page.evaluate(() => ({ hit: window.__olympus.stress().hit, timer: !document.querySelector('.timer').hidden, holes: (window.__olympus.state.armoury.range.stress.strs.find(x => x.k === 0)?.holes ?? []).filter(h => h.at).length }));
        rows.push(`the hit card: belief '${belief?.text}' ${JSON.stringify(belief?.marks)}; truth '${truth.hit?.text}' ${JSON.stringify(truth.hit?.marks)}, the timer beside it ${truth.timer}, the record's holes ${truth.holes}`);
        assert(belief?.phase === 'belief' && belief.marks.length && belief.marks.every(m => m[1] !== 'hole' && m[2] === null), JSON.stringify(belief));
        assert(truth.hit?.phase === 'truth' && truth.timer && truth.hit.marks.length === truth.holes && truth.hit.marks.every(m => m[1] === 'hole'), JSON.stringify(truth));
        // (the end card, "Again as Tier one", the score line)
        await bot('O.scene?.ended', 200000);
        await page.evaluate(() => window.__olympus.pause(false));
        await page.keyboard.press('Enter');
        await page.waitForSelector('.glass.end', { timeout: 30000 });
        const endText = await page.evaluate(() => document.querySelector('.glass.end').innerText);
        const asOne = await page.evaluate(() => [...document.querySelectorAll('.glass.end .again-as')].findIndex(b => /Tier one/.test(b.innerText)));
        await page.evaluate((i) => document.querySelectorAll('.glass.end .again-as')[i].click(), asOne);
        await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.sheet === 'tierone', null, { timeout: 60000 });
        const again = await page.evaluate(() => ({ scene: window.__olympus.scene, sheet: window.__olympus.state.armoury.range.sheet }));
        rows.push(`the end card: '${endText.split('\n').slice(1, 3).join(' / ')}'; "Again as Tier one": ${JSON.stringify(again)}`);
        assert(again.scene?.id === 'test-stress' && again.scene.seed === 48213 && again.sheet === 'tierone', JSON.stringify(again));
        await page.evaluate(() => { window.__bot = null; });
        await bot('O.scene?.ended', 200000);
        await page.evaluate(() => window.__olympus.pause(false));
        await page.keyboard.press('Enter');
        await page.waitForSelector('.glass.end', { timeout: 30000 });
        await page.keyboard.press('Digit3');
        await page.waitForSelector('.glass.score', { timeout: 10000 });
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: game.origin });
        for (const [k, v] of [['chaos', 80], ['contrast', 80], ['hands', 80]]) await page.evaluate(([k, v]) => { const i = document.querySelector(`.glass.score input[data-aspect="${k}"]`); i.value = String(v); i.dispatchEvent(new Event('input')); }, [k, v]);
        await page.click('.glass.score .copy');
        await page.waitForTimeout(200);
        const clip = await page.evaluate(async () => navigator.clipboard.readText().catch(e => `(no read: ${e.message})`));
        rows.push(`Copy my scores: '${clip}'`);
        assert(/^OLYMPUS v[\d.]+ · test-stress · seed 48213 · chaos 80 · contrast 80 · hands 80 · ★ no · note: none$/.test(clip), clip);
        for (const l of rows) console.log(`      ${l}`);
        assert(!errors.length, errors.join('\n'));
      }, { query: 'nostore=1', viewport: { width: 1600, height: 900 } });
    },
  },
];
