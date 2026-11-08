// "Bang"'s face in node (quick) and in the page (heavy): the build sheet 0.0.10 §5.3's ui-stress. The picker's rows led by the hardening
// (cards/pairs.js, the scene's line under the title), the stress course's papers (hud/timer.js: "DIN 30 BLANKS", "BANG CALLED · FROZE",
// "BANGS 3 · FROZE", OFF SAFE's tries, the last string's RELOAD and SECOND) equal to the scene's paperText, the end card's lines (cards/
// stress.js: the summary, a line a string, the inoculation in a career's words), three aspects and the score line in ROADMAP §2.2's form,
// the Breathe lead out of the mode; felt nowhere a number but on the end card. In the page at 1600 × 900 and 1024 × 768: the picker, the
// HUD with the hit card and the paper meeting no rectangle, the end card with its five small cards and the score card inside the window.
import { assert, fmt } from './helpers.mjs';
import { pickerRows, SCENE_LINES, leadsHard, againTiers } from '../src/ui/cards/pairs.js';
import { stressLines, stringLine, inocLine, andList } from '../src/ui/cards/stress.js';
import { timerModel } from '../src/ui/hud/timer.js';
import { scoreLine } from '../src/ui/cards/score.js';
import { breatheLead, partsOf } from '../src/ui/hud/instinct.js';
import { breatheLine, logLines } from '../src/ui/cards/log.js';
import { pickerOf } from '../src/ui/cards/tests.js';
import { SCENES } from '../src/data/scenes.js';
import { TEST_SHEETS } from '../src/sim/skills/templates.js';
import * as SUPP from '../src/sim/combat/supp.js';
import { COURSES } from '../src/data/courses.js';
import { createGame } from './game.mjs';
import { withGame } from './browser.mjs';
import { overlaps } from '../src/ui/hud/layout.js';

const react = await import('../src/sim/combat/react.js');
const takeInWords = react.takeInWords;
const SCENE = SCENES['test-stress'];
const CAP = SUPP.INOC_CAP[COURSES.stress.teacher];
// (the whole course with the stress bot, a sheet on a seed: stressNow at its end)
const RUNS = new Map();
async function course(tier, seed = 48213) {
  const key = `${tier}|${seed}`;
  if (RUNS.has(key)) return RUNS.get(key);
  const { stressBot } = await import('./bots/stress.mjs');
  const stress = await import('../src/sim/scenarios/stress.js');
  const g = createGame({ scenario: 'test-stress', seed, tier }), bot = stressBot();
  let n = 0;
  for (; n < 200000 && !g.state.armoury.range.end; n++) g.step(1, bot);
  const out = { g, sn: stress.stressNow(g.state), ticks: n, strs: g.state.armoury.range.strs.filter(x => x.done !== 'setup') };
  RUNS.set(key, out);
  return out;
}

export default [
  {
    name: '"Bang" is played as a sheet: the picker opens on the Boot recruit, each line led by its hardening in words ("Hardening: green · Warfighting 6 · …"), the scene\'s line under the title; three aspects, chaos, contrast and hands',
    fn() {
      assert(SCENE, 'scenes.js has no test-stress');
      const hard = (t) => { const s = TEST_SHEETS[t], inoc = s.inoc ?? SUPP.INOC_OF_TIER?.[t] ?? 0, H = SUPP.hardFrom({ wf: s.wf, cls: 'soldier', inoc }); return { word: SUPP.hardWord(H), title: `Hardening ${H}` }; };
      const rows = pickerRows(TEST_SHEETS, SCENE.sheets, SCENE.sheet, { hard, lead: leadsHard(SCENE) });
      for (const r of rows) console.log(`      ${r.focus ? '›' : ' '} ${r.label}: ${r.line}`);
      console.log(`      under the title: '${SCENE_LINES['test-stress']}'; aspects: ${SCENE.aspects.map(a => a[0]).join(', ')}`);
      assert(pickerOf(SCENE) && leadsHard(SCENE) && rows[0].tier === 'recruit' && rows[0].focus && rows.every(r => /^Hardening: (green|settled|steady|hardened|unshakeable) · Warfighting/.test(r.line)), JSON.stringify(rows));
      assert(SCENE.aspects.map(a => a[0]).join() === 'chaos,contrast,hands', JSON.stringify(SCENE.aspects));
      const line = scoreLine({ version: '0.0.10', scene: SCENE.id, seed: 48213, aspects: [['chaos', 80], ['contrast', 80], ['hands', 80]], star: false, note: '' });
      console.log(`      Copy my scores: '${line}'`);
      assert(line === 'OLYMPUS v0.0.10 · test-stress · seed 48213 · chaos 80 · contrast 80 · hands 80 · ★ no · note: none', line);
      const again = againTiers(TEST_SHEETS, 'recruit', SCENE.sheets);
      assert(again.length === 4 && !again.some(a => a.tier === 'recruit'), JSON.stringify(again));
    },
  },
  {
    name: 'the stress course\'s papers as the timer draws them (seed 48213, the boot recruit, the whole course): "DIN 30 BLANKS", "BANG CALLED", "BANGS 3 · FROZE", OFF SAFE\'s tries on the noisy strings, the last string\'s RELOAD and SECOND; their words the scene\'s paperText exactly; a calm string\'s rows as Pairs\'',
    async fn() {
      const { strs, ticks } = await course('recruit');
      console.log(`      ${ticks} ticks to the end`);
      const seen = new Set();
      for (const x of strs) {
        const text = typeof x.paper === 'string' ? x.paper : x.paper?.text ?? null, rec = typeof x.paper === 'object' && x.paper ? { ...x, ...x.paper } : x;
        const m = timerModel(rec, { text, fmt: takeInWords });
        console.log(`      ${x.k + 1}: ${m.rows.map(r => `${r.label}${r.value ? ` ${r.value}` : ''}`).join(' | ')} (${m.h} px, its last line's foot at ${m.bottom}) · words '${m.text}'`);
        // (every line on the paper: string 5's five splits wrapped and pushed its zones off the foot of a paper sized by its rows
        // alone, seen by the integrator at 1024 × 768)
        assert(m.bottom + 6 <= m.h, JSON.stringify({ k: x.k, bottom: m.bottom, h: m.h }));
        assert(m.text === text, JSON.stringify({ text, m: m.text }));
        const labels = m.rows.map(r => r.label).join();
        for (const l of m.rows) seen.add(l.label.replace(/\d+/g, 'n'));
        const noise = x.stress?.noise ?? x.paper?.noise ?? null;
        if (noise === 'din') assert(/^DIN \d+ BLANKS/.test(labels) && /OFF SAFE/.test(labels), labels);
        if (noise === 'called') assert(/^BANG CALLED/.test(labels), labels);
        if (noise === 'bangs' || noise === 'reload') assert(/^BANGS 3/.test(labels), labels);
        if (noise === 'reload') assert(/RELOAD/.test(labels) && m.h > 140 && m.h <= 200, JSON.stringify({ labels, h: m.h }));
        if (!noise || noise === 'calm') assert(labels === 'TURN TO PAUSE,PAUSE TO FIRST,SPLITS' && m.h === 140, labels);
        // (felt never a number on the paper)
        assert(!/felt/i.test(m.text), m.text);
      }
      console.log(`      rows seen: ${[...seen].join(', ')}`);
    },
  },
  {
    name: 'the end card\'s lines (cards/stress.js): the summary, a line a string with felt\'s peak and band (the end card is where felt is a number), the freeze, the take-in, the fumbles, Breathe, the first round against calm, the RELOAD and the second turner; the inoculation in a career\'s words, the cadre\'s cap 15, a test sheet\'s counter fixed; recruit against tier one on one seed',
    async fn() {
      const rec = await course('recruit'), one = await course('tierone');
      for (const [who, r] of [['recruit', rec], ['tier one', one]]) {
        const lines = stressLines(r.sn, { fmt: takeInWords, cap: CAP });
        console.log(`      ${who} (${r.ticks} ticks):`);
        for (const l of lines) console.log(`        ${l}`);
        assert(lines[0] === r.sn.summary && lines.length === r.sn.strings.length + 2 && /^Inoculation: /.test(lines.at(-1)), JSON.stringify(lines));
        for (const [i, x] of r.sn.strings.entries()) assert(lines[i + 1] === stringLine(x, { fmt: takeInWords }) && lines[i + 1].startsWith(`${x.k + 1} · `), lines[i + 1]);
      }
      // (the inoculation: the cadre's cap, the test sheet's counter where it stands)
      const il = inocLine(rec.sn, { cap: CAP });
      assert(new RegExp(`to ${CAP} at the cadre's course`).test(il) || /no string was noisy enough/.test(il), il);
      assert(andList([2, 4, 5]) === '2, 4 and 5' && andList([3]) === '3' && andList([2, 4]) === '2 and 4', 'andList');
      // (the contrast: the tier one at felt 0 on every string, the recruit higher on the noisy ones)
      const feltOf = (r) => r.sn.strings.map(x => x.feltPeak);
      console.log(`      felt peaks: recruit ${feltOf(rec).join(', ')}; tier one ${feltOf(one).join(', ')}`);
      assert(Math.max(...feltOf(one)) <= Math.max(...feltOf(rec)), JSON.stringify({ rec: feltOf(rec), one: feltOf(one) }));
    },
  },
  {
    name: 'Breathe on the face: out of the mode the lead counts the box ("Breathe · in · HOLD · out · hold", its own tone); J\'s line "Breathed 4.0 s." over the chaos\'s fall, in the Rolls filter',
    fn() {
      const leads = [0, 1, 2, 3].map(breatheLead), parts = partsOf({ lead: leads[1] });
      const j = breatheLine({ kind: 'breathe', text: 'Breathed 4.0 s: the chaos 79 → 63.' });
      const ll = logLines({ log: [{ seq: 1, kind: 'breathe', atMs: 0, text: 'Breathed 4.0 s: the chaos 79 → 63.', tone: 'calm' }] });
      console.log(`      leads: ${leads.map(l => `'${l}'`).join(', ')}; tone '${parts[0].tone}'\n      J: '${ll[0].text}' over '${ll[0].sub}'`);
      assert(leads[1] === 'Breathe · in · HOLD · out · hold' && parts[0].tone === 'breathe', JSON.stringify(parts));
      assert(j.words === 'Breathed 4.0 s.' && j.short === 'the chaos 79 → 63' && ll[0].sub === j.short, JSON.stringify(j));
    },
  },
  {
    name: 'in the page at 1600 × 900 and 1024 × 768 (heavy): the Tests menu\'s "Bang" and its picker inside the window; the HUD on a noisy string\'s debrief with the hit card and the paper meeting no rectangle; the end card inside the window with its hot wash beside it (one string\'s truth card at whole device pixels, a button a string) and, after "Again as Tier one", its grid of both sheets with nothing to scroll; the score card inside the window, Copy my scores in the score line\'s form',
    heavy: true,
    timeoutMs: 600000,
    async fn() {
      await withGame(async (page, errors, game) => {
        const rows = [];
        for (const [w, h] of [[1600, 900], [1024, 768]]) {
          await page.setViewportSize({ width: w, height: h });
          await game.open('nostore=1');
          await page.waitForSelector('#title .item.tests');
          await page.click('#title .item.tests');
          await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.startsWith('Bang')).click());
          await page.waitForSelector('#title .sheet.picker');
          const pk = await page.evaluate(() => ({ rows: [...document.querySelectorAll('#title .item.sheetpick')].map(b => { const r = b.getBoundingClientRect(); return { tier: b.dataset.tier, lead: b.classList.contains('lead'), hard: /^\d?\s*[^\n]*\n?Hardening: (\w+)/.exec(b.innerText)?.[1] ?? /Hardening: (\w+)/.exec(b.innerText)?.[1] ?? null, in: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; }), setup: document.querySelector('#title .sheet.picker .sub.setup')?.textContent ?? null }));
          rows.push(`${w} × ${h} the picker: ${pk.rows.map(r => `${r.tier}${r.lead ? ' (focused)' : ''} ${r.hard}${r.in ? '' : ' (out)'}`).join(', ')}`);
          assert(pk.rows.length === 5 && pk.rows[0].tier === 'recruit' && pk.rows[0].lead && pk.rows.every(r => r.in && r.hard) && pk.setup, JSON.stringify(pk));
          // (string 3's standby, the called bang: the bot to its debrief, the paper and the hit card's truth)
          await game.open('play=test-stress&setup=standby:2&tier=recruit&seed=48213&nostore=1');
          await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.stress, null, { timeout: 60000 });
          await page.evaluate(async () => {
            const { stressBot } = await import('/tests/bots/stress.mjs');
            const O = window.__olympus, run = stressBot(), k = O.state.armoury.range.str?.k ?? 2;
            O.pause(true);
            for (let n = 0; n < 40000 && !O.state.armoury.range.strs.some(x => x.k === k && x.done !== 'setup'); n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); O.step(1, run(s, me, (me.bot ??= {}))); }
          });
          await page.waitForFunction(() => !document.querySelector('.hitcard')?.hidden && !document.querySelector('.timer')?.hidden, null, { timeout: 10000 });
          const got = await page.evaluate(() => {
            const r = (sel) => { const e = document.querySelector(sel); if (!e || e.hidden || e.closest('[hidden]') || getComputedStyle(e).display === 'none') return null; const b = e.getBoundingClientRect(); return b.width && b.height ? { x: b.left, y: b.top, w: b.width, h: b.height } : null; };
            return { rects: { TOASTS: r('.toasts'), WATCH: r('.watch'), TIMER: r('.timer'), HITCARD: r('.hitcard'), INSTINCT: r('.instinct'), STEPS: r('.steps'), RADIO: r('.radio.voices'), KEYS: r('.keyshint'), BANNER: r('.banner') }, hit: document.querySelector('.hitcard').dataset.text, phase: document.querySelector('.hitcard').dataset.phase, paper: document.querySelector('.timer').dataset.text, hud: [...document.querySelectorAll('.toasts .toast, .instinct, .steps .step, .timer, .hitcard')].filter(e => !e.hidden && !e.closest('[hidden]')).map(e => e.innerText || e.dataset.text || '').join(' | ') };
          });
          const names = Object.keys(got.rects).filter(k => got.rects[k]), clash = [];
          for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) if (overlaps(got.rects[names[i]], got.rects[names[j]])) clash.push(`${names[i]} × ${names[j]}`);
          rows.push(`${w} × ${h} the debrief: the paper '${got.paper}', the hit card (${got.phase}) '${got.hit}' at ${JSON.stringify(got.rects.HITCARD)}; meeting ${clash.join(', ') || 'none'}`);
          assert(!clash.length && got.phase === 'truth' && /^BANG CALLED/.test(got.paper ?? ''), JSON.stringify({ clash, got }));
          assert(!/felt\s*\d/i.test(got.hud), got.hud);
          // (the end card: to it, then the score card)
          await page.evaluate(async () => {
            const { stressBot } = await import('/tests/bots/stress.mjs');
            const O = window.__olympus, run = stressBot();
            for (let n = 0; n < 200000 && !O.scene?.ended; n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') O.sim.ffTick(s); else O.step(1, run(s, me, (me.bot ??= {}))); }
            O.pause(false);
          });
          await page.keyboard.press('Enter');
          await page.waitForSelector('.glass.end', { timeout: 30000 });
          // (the fixer's of 0.0.10: the hot wash beside the card, one string's truth card at the HUD's own size at whole device
          // pixels, a button a string; the card never scrolls, after a second sheet too, its grid a column a sheet)
          const endOf = () => page.evaluate(() => {
            const e = document.querySelector('.glass.end'), r = e.getBoundingClientRect(), wash = document.querySelector('.end-wrap .stress-wash'), wr = wash?.getBoundingClientRect(), cv = wash?.querySelector('canvas');
            const inWin = (b) => !!b && b.left >= 0 && b.top >= 0 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1;
            return { in: inWin(r), scroll: e.scrollHeight - e.clientHeight, lines: [...document.querySelectorAll('.glass.end .stress-said p')].map(p => p.textContent), again: [...document.querySelectorAll('.glass.end .again-as small')].map(s => s.textContent),
              wash: wash ? { in: inWin(wr), overlaps: wr.right > r.left + 1 && wr.left < r.right - 1, css: cv.getBoundingClientRect().width, px: cv.width, tabs: [...wash.querySelectorAll('.wash-tab')].map(b => `${b.textContent}${b.classList.contains('on') ? '*' : ''}${b.disabled ? '-' : ''}`), k: wash.querySelector('figure').dataset.k, text: wash.querySelector('figure').dataset.text } : null,
              grid: [...document.querySelectorAll('.glass.end .stress-grid tr')].map(tr => [...tr.children].map(c => c.textContent)) };
          });
          const end = await endOf();
          rows.push(`${w} × ${h} the end card: ${end.lines.length} lines, inside the window ${end.in}, ${end.scroll} px to scroll; the hot wash ${JSON.stringify(end.wash)}; "Again as …" ${end.again.join(' | ')}`);
          assert(end.in && end.scroll <= 1 && end.lines.length >= 3 && end.again.every(t => /^(green|settled|steady|hardened|unshakeable) · seed /.test(t)), JSON.stringify(end));
          const dpr = await page.evaluate(() => devicePixelRatio);
          assert(end.wash && end.wash.in && !end.wash.overlaps && end.wash.tabs.length === end.lines.length - 2 && Math.abs(end.wash.css * dpr / end.wash.px - Math.round(end.wash.css * dpr / end.wash.px)) < 0.01 && end.wash.text, JSON.stringify(end.wash));
          const other = await page.evaluate(() => { const b = [...document.querySelectorAll('.end-wrap .wash-tab')].find(x => !x.disabled && !x.classList.contains('on')); b?.click(); return b?.dataset.k ?? null; });
          const chosen = await page.evaluate(() => document.querySelector('.end-wrap .stress-wash figure').dataset.k);
          assert(other === null || chosen === other, JSON.stringify({ other, chosen }));
          // (again as the tier one, on the same seed: the second sheet's card)
          await page.evaluate(() => [...document.querySelectorAll('.glass.end .again-as')].find(b => /Tier one/.test(b.textContent)).click());
          await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.stress && !document.querySelector('.glass.end'), null, { timeout: 60000 });
          await page.evaluate(async () => {
            const { stressBot } = await import('/tests/bots/stress.mjs');
            const O = window.__olympus, run = stressBot();
            O.pause(true);
            for (let n = 0; n < 200000 && !O.scene?.ended; n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') O.sim.ffTick(s); else O.step(1, run(s, me, (me.bot ??= {}))); }
            O.pause(false);
          });
          await page.keyboard.press('Enter');
          await page.waitForSelector('.glass.end', { timeout: 30000 });
          const two = await endOf();
          rows.push(`${w} × ${h} after "Again as Tier one": inside the window ${two.in}, ${two.scroll} px to scroll; the grid ${two.grid.map(r => r.join(' | ')).join(' / ')}`);
          assert(two.in && two.scroll <= 1 && two.grid.length === 6 && two.grid.every(r => r.length === 3) && two.wash?.in, JSON.stringify(two));
          await page.keyboard.press('Digit3');
          await page.waitForSelector('.glass.score', { timeout: 10000 });
          const sc = await page.evaluate(() => { const e = document.querySelector('.glass.score'), r = e.getBoundingClientRect(); return { in: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, aspects: [...document.querySelectorAll('.glass.score input.score')].map(i => i.dataset.aspect), line: document.querySelector('.glass.score .score-line').value }; });
          rows.push(`${w} × ${h} the score card: ${sc.aspects.join(', ')}; '${sc.line}'`);
          assert(sc.in && sc.aspects.join() === 'chaos,contrast,hands' && /^OLYMPUS v[\d.]+ · test-stress · seed 48213 · chaos 50 · contrast 50 · hands 50 · ★ no · note: none$/.test(sc.line), JSON.stringify(sc));
        }
        for (const l of rows) console.log(`      ${l}`);
        assert(!errors.length, errors.join('\n'));
      }, { query: 'nostore=1', viewport: { width: 1600, height: 900 } });
    },
  },
];
