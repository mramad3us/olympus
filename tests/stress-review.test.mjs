// "Bang"'s review fixes (the fixer's of 0.0.10, from the code, runtime and design reviews of the round), in node (quick) and in the
// page (heavy). Each pins a finding and fails without its fix: the din's paper led by its plan ("DIN 30 BLANKS · 22 HEARD"), the
// banged row's FROZE only when he froze (the paper's text and its drawing one quantity), the end card's string line saying how it
// ended ("time: he stayed up", "no RELOAD", "not finished") and leaving "calm" unsaid beside a freeze, the inoculation naming the
// strings left out, the summary counting a string cut short, the DI never naming Breathe on a line T cannot do and the shaking
// line naming T, the coach's Breathe in four one-second counts, the din's turn after its second horn (the recruit under fire at
// it), the coach's rest after the noise said and put behind the brief splash once the shooter stands ready (a fast-forward: the
// same noise at the same times, a save inside it carrying on byte for byte), the session's grid, the hit card's numbers never on
// each other and its coach's line at the headline's size. In the page: the shot's toast in belief during a string, a walk key
// pressed in a startle and held, and the end card with its hot wash and the grid inside the window after a second sheet.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stressBot } from './bots/stress.mjs';
import { pairsNow, paperText } from '../src/sim/scenarios/pairs.js';
import { stressNow, recOf, REST_SKIP_MIN_MS } from '../src/sim/scenarios/stress.js';
import { timerModel } from '../src/ui/hud/timer.js';
import { stringLine, inocLine, stressLines, sessionGrid, gridCell } from '../src/ui/cards/stress.js';
import { STOP_WORDS } from '../src/sim/scenarios/handling.js';
import { PAIRS_RULES } from '../src/sim/skills/instinct/pairs.js';
import { STRESS_COACH, COURSES } from '../src/data/courses.js';
import { paintHitcard, tagPlaces, wordsW, WORDS_K } from '../src/art/doll/hitcard.js';
import { PAPERS } from '../src/sim/arms/paper.js';
import { takeInWords } from '../src/sim/combat/react.js';
import { withGame } from './browser.mjs';

const MAX = 40_000;
// (the whole course with a bot, the facts it gave kept by kind)
function course(tier, { seed = 48213, bot = stressBot(), keep = ['skip-start', 'skip-end', 'say', 'range'] } = {}) {
  const g = createGame({ scenario: 'test-stress', seed, tier }), facts = [];
  let n = 0;
  for (; n < MAX && !pairsNow(g.state)?.end; n++) {
    g.step(1, bot);
    for (const k of keep) for (const f of g.facts(k)) facts.push({ k, f, ms: g.state.clock.ms, tick: g.state.clock.tick });
    g.clearFacts();
  }
  return { g, n, facts, sn: stressNow(g.state) };
}

export default [
  {
    name: 'the din\'s paper leads with its plan, the blanks heard after it when the string ended first ("DIN 30 BLANKS · 22 HEARD": the design review of 0.0.10, the tier one\'s "DIN 22 BLANKS" beside the recruit\'s 30 read as less noise); the timer\'s row and the card\'s words the same',
    fn() {
      const p = paperText({ noise: 'din', blanks: 22, blanksPlan: 30, takeInMs: 150, pauseToFirstMs: 630, splitsMs: [260], zones: { A: 2 } });
      const full = paperText({ noise: 'din', blanks: 30, blanksPlan: 30, takeInMs: 150, pauseToFirstMs: 630, splitsMs: [260], zones: { A: 2 } });
      const m = timerModel({ k: 1, line: 7, noise: 'din', blanks: 22, blanksPlan: 30, takeInMs: 150, pauseToFirstMs: 630, splitsMs: [260], zones: { A: 2 } }, { text: p, fmt: takeInWords });
      console.log(`      '${p}'; all heard '${full}'; the timer's row ${m.rows[0].label} | ${m.rows[0].value}`);
      assert(p.startsWith('DIN 30 BLANKS · 22 HEARD · ') && full.startsWith('DIN 30 BLANKS · TURN') && m.rows[0].label === 'DIN 30 BLANKS' && m.rows[0].value === '22 HEARD', JSON.stringify({ p, full, row: m.rows[0] }));
    },
  },
  {
    name: 'the banged row of a paper with no freeze has no FROZE and no amber, as its text (the design review of 0.0.10: the tier one\'s drawn paper marked "FROZE 0.00" where the text the scene checks left it out); a freeze still marked',
    fn() {
      const rec = (frozeMs) => ({ k: 3, line: 7, noise: 'bangs', bangs: 3, frozeMs, offSafe: [], takeInMs: 150, pauseToFirstMs: 630, splitsMs: [260], zones: { A: 2 } });
      const none = timerModel(rec(0), { text: paperText(rec(0)), fmt: takeInWords }), some = timerModel(rec(2400), { text: paperText(rec(2400)), fmt: takeInWords });
      console.log(`      no freeze: ${none.rows[0].label} | '${none.rows[0].value}' (${none.rows[0].mark}); text '${none.text}'`);
      console.log(`      2.40 s: ${some.rows[0].label} | '${some.rows[0].value}' (${some.rows[0].mark}); text '${some.text}'`);
      assert(none.rows[0].value === '' && !none.rows[0].mark && !/FROZE/.test(none.text), JSON.stringify(none.rows[0]));
      assert(some.rows[0].value === 'FROZE 2.40' && some.rows[0].mark === 'froze' && /FROZE 2\.40 S/.test(some.text), JSON.stringify(some.rows[0]));
    },
  },
  {
    name: 'the end card\'s string line says how a string ended when it was not by putting him down ("time: he stayed up", "no RELOAD", "not finished"), never "calm" beside a freeze; the inoculation names a noisy string left out; the summary counts a string cut short (the runtime and design reviews of 0.0.10)',
    fn() {
      const base = { k: 4, name: 'reload', noise: 'three bangs, then the RELOAD', feltPeak: 75, band: 'pinned', frozeMs: 2200, takeInMs: 1550, fumbles: { tries: 3, fails: 1, drops: 0 }, breathe: {}, seenToFirstMs: 4000, calmSeenToFirstMs: 2500, zones: { A: 1, miss: 2 }, reload: null, second: { takeInMs: 3000 }, done: 'time', inoc: { counted: false, would: false, why: 'not finished' } };
      const timed = stringLine(base, { fmt: takeInWords }), calmFroze = stringLine({ ...base, k: 2, name: 'called', noise: 'bang called', feltPeak: 15, band: 'calm', frozeMs: 900, done: 'stopped', second: null }, { fmt: takeInWords });
      const open = stringLine({ ...base, k: 3, name: 'bangs', done: null }, { fmt: takeInWords });
      const il = inocLine({ strings: [{ k: 1, feltPeak: 26, inoc: { counted: false, would: true, why: 'test sheet' } }, base], inoc: { pts: 2, cap: 6 } }, { cap: 15 });
      console.log(`      timed out: '${timed}'\n      felt 15 with a freeze: '${calmFroze}'\n      cut short: '${open}'\n      '${il}'`);
      assert(/ · no RELOAD · /.test(timed) && / · time: he stayed up$/.test(timed), timed);
      assert(/felt 15 · froze 0\.90 s/.test(calmFroze) && !/calm ·/.test(calmFroze.replace(/^3 · bang called · /, '')), calmFroze);
      assert(/ · not finished$/.test(open), open);
      assert(/string 5 not finished, so not counted/.test(il), il);
      // (the summary: the scene ended from Esc during string 4's startle, as the runtime review did)
      const g = createGame({ scenario: 'test-stress', seed: 48213, tier: 'sgt', setup: 'standby:3' }), bot = stressBot();
      for (let n = 0; n < 4000; n++) { g.step(1, bot); const R = g.state.armoury.range; if (R.str?.k === 3 && recOf(R, 3)?.froze?.length) break; }
      const sn = stressNow(g.state), lines = stressLines(sn, { fmt: takeInWords, cap: 15 });
      console.log(`      ended in string 4: '${lines[0]}' over '${lines.at(-2)}'`);
      assert(/string 4 not finished/.test(sn.summary) && /not finished$/.test(lines.at(-2)), JSON.stringify(lines));
      assert(STOP_WORDS.timeFired === 'time, and he was still up', STOP_WORDS.timeFired);
    },
  },
  {
    name: 'a string 5 run out of time with rounds fired (the boot recruit never reloading, 48213: the runtime review\'s r3): the fault\'s fact says he fired (its toast "time, and he was still up", never "not engaged"), the card\'s line "no RELOAD · … · time: he stayed up"',
    fn() {
      const { facts, sn, n } = course('recruit', { bot: stressBot({ noReload: true }) });
      const faults = facts.filter(x => x.k === 'range' && x.f.phase === 'fault' && x.f.rule === 'time').map(x => x.f);
      const s5 = sn.strings.find(x => x.k === 4), line = stringLine(s5, { fmt: takeInWords });
      console.log(`      ${n} ticks; time faults ${JSON.stringify(faults.map(f => ({ fired: f.fired })))}; string 5: '${line}'`);
      assert(faults.length && faults.every(f => f.fired === true) && /no RELOAD/.test(line) && /time: he stayed up$/.test(line), JSON.stringify({ faults, line }));
    },
  },
  {
    name: 'the DI never names Breathe on a line with no act where Breathe is a step (pairs-wait on "Bang" and "Three bangs": "Breathe. It turns when it turns." at felt 0, where T did nothing), and every offer of stress-breathe out of the mode names T; the coach\'s Breathe in the step\'s four one-second counts, never "for four"',
    fn() {
      const rule = (id) => PAIRS_RULES.find(r => r.id === id);
      const wait = rule('pairs-wait'), sb = rule('stress-breathe');
      const out = [...sb.text[1], ...sb.text.out, ...sb.text.shaking];
      console.log(`      pairs-wait on the chaos's courses: ${wait.text.stress.map(t => `'${t}'`).join(', ')}; calm Pairs keep '${wait.text[1][3]}'`);
      console.log(`      stress-breathe out of the mode: ${out.filter(t => !/: T\.$/.test(t)).length} of ${out.length} without T; the coach: ${STRESS_COACH.breathe.map(t => `'${t}'`).join(', ')}`);
      assert(wait.text.stress.every(t => !/breathe/i.test(t)) && wait.text[1][3] === 'Breathe. It turns when it turns.', JSON.stringify(wait.text));
      assert(out.every(t => /: T\.$/.test(t)), JSON.stringify(out));
      assert(STRESS_COACH.breathe.every(t => !/for four/.test(t)), JSON.stringify(STRESS_COACH.breathe));
      // (a whole course: every wait line the DI gave names no Breathe)
      const g = createGame({ scenario: 'test-stress', seed: 48213, tier: 'tierone' }), bot = stressBot(), said = new Set();
      for (let n = 0; n < MAX && !pairsNow(g.state)?.end; n++) { g.step(1, bot); const l = g.state.$instinct?.line; if (l?.id === 'pairs-wait') said.add(l.text); g.clearFacts(); }
      console.log(`      the tier one's course: pairs-wait said ${[...said].map(t => `'${t}'`).join(', ')}`);
      assert([...said].every(t => !/breathe/i.test(t)), JSON.stringify([...said]));
    },
  },
  {
    name: 'the din\'s turn after its second horn (COURSES.stress.din.turnMs 8.5 to 10 s, from 6 to 8: the design review of 0.0.10, the recruit met the turn still calm at felt 15): on 48213 the boot recruit is under fire at the turn, the private under it, the tier one at 0',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    fn() {
      const rows = [];
      for (const tier of ['recruit', 'private', 'tierone']) {
        const { sn } = course(tier), din = sn.strings.find(x => x.name === 'din');
        rows.push({ tier, turn: din.feltTurn, peak: din.feltPeak });
      }
      console.log(`      turnMs ${COURSES.stress.din.turnMs.join(' to ')}; felt at the din's turn and its peak: ${rows.map(r => `${r.tier} ${r.turn} / ${r.peak}`).join('; ')}`);
      const by = Object.fromEntries(rows.map(r => [r.tier, r]));
      assert(COURSES.stress.din.turnMs[0] >= 8500 && by.recruit.turn >= 20 && by.private.turn < 20 && by.tierone.turn === 0, JSON.stringify(rows));
    },
  },
  {
    name: 'the coach\'s rest after his noise (the design review of 0.0.10: 20 s lived at 1:1 with nothing said, about 80 s of the tier one\'s 130): at "Stop" he says why, and once the shooter stands ready and still with no Breathe offered the rest left goes behind the brief splash, a fast-forward of lived ticks ending on the rest\'s last tick; the same noise at the same times for every sheet; a save made inside it carries on byte for byte',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    fn() {
      const one = course('tierone'), rec = course('recruit');
      const rests = (r) => r.facts.filter(x => x.k === 'skip-start' && x.f.activity === 'stress-rest').map(x => ({ ms: x.f.toMs - x.f.fromMs, engine: x.f.engine }));
      const said = (r) => r.facts.filter(x => x.k === 'say' && STRESS_COACH.rest.includes(x.f.text)).length;
      const noise = (r) => r.facts.filter(x => x.k === 'range' && x.f.phase === 'noise').map(x => x.f.atMs - r.g.state.meta.createdMs);
      console.log(`      tier one: ${one.n} ticks, rests behind the splash ${JSON.stringify(rests(one))}, the coach's word ${said(one)} times; recruit: ${rec.n} ticks, rests ${JSON.stringify(rests(rec))}, the word ${said(rec)} times`);
      console.log(`      the noise's starts from the scene's start: tier one ${noise(one).map(v => fmt(v / 1000, 2)).join(', ')}; recruit ${noise(rec).map(v => fmt(v / 1000, 2)).join(', ')}`);
      assert(rests(one).length === 3 && rests(one).every(r => r.engine === 'ff' && r.ms >= REST_SKIP_MIN_MS) && said(one) === 3 && said(rec) === 3, JSON.stringify({ one: rests(one), rec: rests(rec) }));
      assert(rests(rec).length >= 1, JSON.stringify(rests(rec)));
      // (a save inside the rest, carried on)
      const g = createGame({ scenario: 'test-stress', seed: 48213, tier: 'tierone' }), bot = stressBot();
      let json = null, at = null;
      for (let n = 0; n < MAX && !pairsNow(g.state)?.end; n++) { g.step(1, bot); if (!json && g.state.skip?.activity === 'stress-rest' && g.state.clock.ms - g.state.skip.fromMs > 5000) { json = g.save(); at = g.state.clock.tick; } g.clearFacts(); }
      const h = createGame({ scenario: 'test-stress', seed: 48213, tier: 'tierone' });
      h.load(json);
      const hb = stressBot();
      for (let n = 0; n < MAX && !pairsNow(h.state)?.end; n++) { h.step(1, hb); h.clearFacts(); }
      console.log(`      saved 5 s into a rest at tick ${at}: straight tick ${g.state.clock.tick} ${g.digest()}, loaded ${h.state.clock.tick} ${h.digest()}`);
      assert(json && h.state.clock.tick === g.state.clock.tick && h.digest() === g.digest() && g.state.clock.tick === one.g.state.clock.tick, 'a save in the rest');
    },
  },
  {
    name: 'the session\'s grid (the design review of 0.0.10: after "Again as …" two summary lines hid the strings): a row a string, a column a sheet, the freeze and the first round against calm, the RELOAD on string 5',
    fn() {
      const a = course('recruit').sn, b = course('tierone').sn;
      const grid = sessionGrid([a, b], { fmt: takeInWords });
      for (const r of [grid.head, ...grid.rows]) console.log(`      ${r.map(c => c.padEnd(30)).join('')}`);
      assert(grid.head.length === 3 && grid.rows.length === 5 && grid.rows.every(r => r.length === 3) && /RELOAD/.test(grid.rows[4][1]) && /RELOAD/.test(grid.rows[4][2]), JSON.stringify(grid));
      assert(grid.rows[3][1] === gridCell(a.strings[3], { fmt: takeInWords }) && /^froze /.test(grid.rows[3][1]) && /^no freeze/.test(grid.rows[3][2]), JSON.stringify(grid.rows[3]));
    },
  },
  {
    name: 'the hit card\'s numbers never on each other (the runtime review of 0.0.10: a Pair\'s "1", "2" and "4" stacked, "2" hidden) and its coach\'s line drawn at the headline\'s size (WORDS_K), at 200 and 170 px',
    fn() {
      const MARKS = [
        { n: 1, called: [-1.5, 2.0], seen: true, hole: [4.6, -3.1], zone: 'A' }, { n: 2, called: [2.5, 6.0], seen: true, hole: [3.6, -1.1], zone: 'A' },
        { n: 3, called: [0.5, -21.0], seen: true, hole: [3.0, -26.5], zone: 'head' }, { n: 4, called: [1.0, 3.0], seen: true, hole: [5.6, -2.1], zone: 'A' }, { n: 5, called: [0, 0], seen: false, hole: null, zone: null },
      ];
      const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      for (const size of [200, 170]) for (const phase of ['belief', 'truth']) {
        const pm = paintHitcard({ look: 'A', size, phase, man: PAPERS.man, marks: MARKS, words: phase === 'truth' ? 'FIRE · A · A · HEAD · A' : 'FIRE · 4 SEEN', line: 'Three in the chest, one in the head. He went down.' });
        const tags = pm.marks.map(d => d.tag), clash = tags.flatMap((t, i) => tags.slice(i + 1).filter(u => hit(t, u)).map(() => i + 1));
        // (the line's glyphs: rows of the strip in its colour, a 5-row glyph at WORDS_K is 10 rows tall)
        const said = new Set();
        for (let y = pm.h - pm.words.h; y < pm.h; y++) for (let x = 0; x < pm.w; x++) if ((pm.data[y * pm.w + x] & 0xffffff) === 0xd8cec9) said.add(y);
        console.log(`      ${size} px ${phase}: ${pm.marks.length} numbers at ${tags.map(t => `${t.x},${t.y}`).join(' ')}, ${clash.length} on each other; the line ${pm.words.line.length} rows, ${said.size} pixel rows of it`);
        assert(!clash.length && pm.w === size, JSON.stringify(tags));
        if (phase === 'truth') assert(pm.words.line.length >= 2 && said.size >= 10 * pm.words.line.length, JSON.stringify({ rows: pm.words, said: said.size }));
      }
      // (the placing alone, pure: four marks within 3 px)
      const p = tagPlaces([{ n: 1, x: 100, y: 60 }, { n: 2, x: 102, y: 61 }, { n: 3, x: 99, y: 63 }, { n: 4, x: 101, y: 58 }], { W: 200, H: 150, wordsW });
      const plates = p.map(q => ({ x: q.x - 1, y: q.y - 1, w: q.w + 2, h: 7 }));
      assert(plates.every((a, i) => plates.slice(i + 1).every(b => !hit(a, b))) && WORDS_K === 2, JSON.stringify(p));
    },
  },
  {
    name: 'in the page at 1600 × 900 (heavy): during a string the shot\'s toast says only seen or not, never the zone (the runtime review of 0.0.10: "Marksmanship 16 against 6 · in the A zone." beside a card in belief); a walk key pressed in a startle and held does not walk him when it ends',
    heavy: true,
    timeoutMs: 240_000,
    async fn() {
      await withGame(async (page, errors) => {
        const r = await page.evaluate(async () => {
          const h = window.__olympus;
          const { stressBot: mk } = await import('/tests/bots/stress.mjs');
          const { playerActor } = await import('/src/core/ids.js');
          const b = mk(), during = [], after = [];
          const zones = /in the A zone|in the C zone|in the head|past him/;
          h.pause(true);
          for (let t = 0; t < 4000; t++) {
            const s = h.state, me = playerActor(s), R = s.armoury.range, live = !!R.str && !R.str.done && R.str.turnedMs !== null;
            if (s.skip?.engine === 'ff') h.sim.ffTick(s); else h.step(1, b(s, me, (me.bot ??= {})));
            const toasts = [...document.querySelectorAll('.toasts > *')].map(e => e.textContent);
            for (const x of toasts) if (/Marksmanship/.test(x)) (live ? during : after).push(x);
            if (R.strs.filter(x => x.done !== 'setup').length >= 1 && !live && t > 200) break;
          }
          return { during: [...new Set(during)], zoned: [...new Set(during)].filter(x => zones.test(x)) };
        });
        console.log(`      string 1's toasts while it ran: ${r.during.map(x => `'${x}'`).join(', ')}`);
        assert(r.during.length && !r.zoned.length, JSON.stringify(r));
        assert(!errors.length, errors.join('; '));
      }, { query: 'play=test-stress&seed=48213&tier=recruit&setup=standby:1&nostore=1', viewport: { width: 1600, height: 900 } });
      // (a walk key pressed in the startle of string 4's bangs and held past it)
      await withGame(async (page, errors) => {
        await page.evaluate(() => window.__olympus.pause(false));
        const t0 = Date.now();
        await page.waitForFunction(() => { const c = window.__olympus.state.actors.list.find(a => a.who === window.__olympus.state.player.id)?.combat; return c && Number.isFinite(c.startleUntilMs) && window.__olympus.state.clock.ms < c.startleUntilMs; }, null, { timeout: 60_000, polling: 16 });
        const at = await page.evaluate(() => { const s = window.__olympus.state, me = s.actors.list.find(a => a.who === s.player.id); return { x: me.x, z: me.z, until: me.combat.startleUntilMs }; });
        await page.keyboard.down('KeyW');
        await page.waitForFunction((u) => window.__olympus.state.clock.ms > u + 1500, at.until, { timeout: 30_000, polling: 50 });
        await page.waitForTimeout(800);
        const end = await page.evaluate(() => { const s = window.__olympus.state, me = s.actors.list.find(a => a.who === s.player.id); return { x: me.x, z: me.z }; });
        await page.keyboard.up('KeyW');
        const moved = Math.hypot(end.x - at.x, end.z - at.z);
        console.log(`      W pressed in the startle (${fmt((Date.now() - t0) / 1000, 1)} s in) and held 0.8 s past its guard: moved ${fmt(moved, 3)} m`);
        assert(moved < 0.01, JSON.stringify({ at, end }));
        assert(!errors.length, errors.join('; '));
      }, { query: 'play=test-stress&seed=48213&tier=recruit&setup=standby:3&nostore=1', viewport: { width: 1600, height: 900 } });
    },
  },
];
