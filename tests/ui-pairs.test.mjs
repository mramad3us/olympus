// test-pairs' cards and paper in node (quick): the sheet picker (src/ui/cards/pairs.js), the coach's shot timer's paper
// (src/ui/hud/timer.js) and the end card's "Again as …" and three aspects (the build sheet 0.0.8 §2.4, §5.4 ui-pairs;
// COMBAT §25.10.3). The picker lists the five sheets in the scene's order with their Warfighting, the Private focused
// and the corporal left to the URL; the paper's numbers are the string's record's to the hundredth, through the one
// formatter (react.js takeInWords), and its words the scene's paperText exactly; the paper stands in PAPER, which meets
// no HUD rectangle in any state it shows in at 1600 × 900 and 1024 × 768 (nor at 1280 × 600 and 1920 × 1080). The
// sheets are react's templates.js TEST_SHEETS and the paper's helpers the scene's pairs.js; where a role's module is not
// in this tree yet, a fixture of the sheet's §4 numbers stands in, and the test says so.
import { assert } from './helpers.mjs';
import { pickerRows, sheetLine, aspectLines, againTiers, PICKER_ORDER, PICKER_DEFAULT } from '../src/ui/cards/pairs.js';
import { timerModel, ZONE_ORDER, TIMER_W, TIMER_H } from '../src/ui/hud/timer.js';
import { rectsAt, clashesAt, overlaps, STATES, RECTS } from '../src/ui/hud/layout.js';
import { pickerOf } from '../src/ui/cards/tests.js';

const templates = await import('../src/sim/skills/templates.js').catch(() => null);
const pairs = await import('../src/sim/scenarios/pairs.js').catch(() => null);
const react = await import('../src/sim/combat/react.js').catch(() => null);
const scenesMod = await import('../src/data/scenes.js');
const takeInWords = react?.takeInWords ?? ((ms) => (Math.max(0, ms) / 1000).toFixed(2));
// (the build sheet 0.0.8 §4's test sheets, where templates.js has none yet)
const FIXTURE_SHEETS = Object.freeze({
  recruit: { label: 'Boot recruit', wf: 6, values: { marksmanship: 4, weapons: 4, awareness: 2, fitness: 8 }, rung: 0, picker: true },
  private: { label: 'Private', wf: 15, values: { marksmanship: 10, weapons: 10, awareness: 6, fitness: 12 }, rung: 1, picker: true },
  cpl: { label: 'Corporal', wf: 34, values: { marksmanship: 15, weapons: 15, awareness: 11, fitness: 13 }, rung: 2, picker: false },
  sgt: { label: 'Sergeant', wf: 44, values: { marksmanship: 19, weapons: 19, awareness: 14, fitness: 14 }, rung: 3, picker: true },
  raider: { label: 'Raider, five years', wf: 70, values: { marksmanship: 31, weapons: 31, awareness: 31, fitness: 19 }, rung: 4, picker: true },
  tierone: { label: 'Tier one', wf: 93, values: { marksmanship: 42, weapons: 42, awareness: 41, fitness: 21 }, rung: 4, picker: true },
});
const SHEETS = templates?.TEST_SHEETS ?? FIXTURE_SHEETS;
const SCENE = scenesMod.SCENES['test-pairs'] ?? { id: 'test-pairs', title: 'Pairs', course: 'pairs', sheets: ['recruit', 'private', 'sgt', 'raider', 'tierone'], sheet: 'private' };
// (the scene's paper helpers, or the build sheet §2.3's form where pairs.js is not here yet)
const ZW = { A: 'A', C: 'C', head: 'HEAD', miss: 'MISS', noshoot: 'NO-SHOOT HIT' };
const paperText = pairs?.paperText ?? (({ takeInMs, pauseToFirstMs, splitsMs = [], zones = {} }) => [`TURN TO PAUSE ${takeInWords(takeInMs)}`, pauseToFirstMs === null ? 'NO ROUNDS' : `PAUSE TO FIRST ${takeInWords(pauseToFirstMs)}`,
  splitsMs.length ? `SPLITS ${splitsMs.map(takeInWords).join(' ')}` : null, Object.keys(ZW).filter(k => zones[k]).map(k => `${zones[k]} ${ZW[k]}`).join(', ') || null].filter(Boolean).join(' · '));
// (string records as the session keeps them: the private's five on seed 48213, as the build sheet §3 shows the first)
const STRS = [
  { k: 0, line: 7, takeInMs: 550, pauseToFirstMs: 1450, splitsMs: [400], zones: { A: 2 } },
  { k: 1, line: 7, takeInMs: 600, pauseToFirstMs: 1300, splitsMs: [400, 870, 400], zones: { A: 3, C: 1 } },
  { k: 2, line: 10, takeInMs: 650, pauseToFirstMs: 2650, splitsMs: [400, 1120, 400], zones: { A: 4 } },
  { k: 3, line: 10, takeInMs: 550, pauseToFirstMs: 1450, splitsMs: [400, 550], zones: { A: 2, head: 1 } },
  { k: 4, line: 10, takeInMs: 1250, pauseToFirstMs: 1900, splitsMs: [2930, 400], zones: { A: 3, miss: 1, noshoot: 1 } },
];

export default [
  {
    name: 'the picker lists the five sheets in the scene\'s order with their Warfighting and numbers, the Private focused, the corporal by the URL only; the Tests menu\'s "Pairs" opens it',
    fn() {
      console.log(`      ${templates?.TEST_SHEETS ? 'templates.js TEST_SHEETS' : 'the build sheet §4\'s sheets as a fixture (templates.js has none in this tree)'}; the scene's ${scenesMod.SCENES['test-pairs'] ? 'own entry' : 'entry as a fixture'}`);
      const rows = pickerRows(SHEETS, Array.isArray(SCENE.sheets) ? SCENE.sheets : PICKER_ORDER, SCENE.sheet ?? PICKER_DEFAULT);
      for (const r of rows) console.log(`      ${r.focus ? '>' : ' '} ${r.label}: ${r.line}`);
      assert(rows.map(r => r.tier).join() === 'recruit,private,sgt,raider,tierone', rows.map(r => r.tier).join());
      assert(rows.map(r => r.wf).join() === '6,15,44,70,93', rows.map(r => r.wf).join());
      assert(rows.filter(r => r.focus).map(r => r.tier).join() === 'private', 'the Private focused');
      assert(!rows.some(r => r.tier === 'cpl') && !!SHEETS.cpl, 'the corporal by the URL only');
      assert(sheetLine(SHEETS.private).startsWith('Warfighting 15 · Marksmanship 10 · Weapon handling 10 · Awareness 6'), sheetLine(SHEETS.private));
      assert(pickerOf(SCENE) && !pickerOf(scenesMod.SCENES['test-range']) && !pickerOf(scenesMod.SCENES['test-handling']), 'only Pairs opens a picker');
      const titles = Object.values(scenesMod.SCENES).map(s => s.id);
      console.log(`      the Tests menu: ${titles.join(', ')}`);
      if (scenesMod.SCENES['test-pairs']) assert(titles.indexOf('test-pairs') === titles.indexOf('test-range') + 1, 'Pairs after test-range');
    },
  },
  {
    name: 'the coach\'s paper says the string\'s record to the hundredth through the one formatter, its words the scene\'s paperText exactly ("TURN TO PAUSE 0.55 · PAUSE TO FIRST 1.45 · SPLITS 0.40 · 2 A")',
    fn() {
      console.log(`      ${pairs?.paperText ? 'pairs.js paperText' : 'paperText as a fixture (pairs.js not in this tree)'}; ${react ? 'react.js takeInWords' : 'a stand-in for takeInWords'}`);
      for (const rec of STRS) {
        const text = paperText(rec), m = timerModel(rec, { text, fmt: takeInWords });
        console.log(`      ${m.head}: ${m.rows.map(r => `${r.label} ${r.value}`).join(' | ')} | ${m.zones.map(z => `${z.n} ${z.word}`).join(', ')}`);
        assert(m.text === text, JSON.stringify({ m: m.text, text }));
        assert(m.rows[0].value === takeInWords(rec.takeInMs) && m.rows[1].value === takeInWords(rec.pauseToFirstMs) && m.rows[2].value === rec.splitsMs.map(takeInWords).join(' '), JSON.stringify(m.rows));
        // (the paper's numbers back from its words: equal to the record's)
        const back = text.match(/TURN TO PAUSE ([\d.]+)/)?.[1], first = text.match(/PAUSE TO FIRST ([\d.]+)/)?.[1];
        assert(Math.round(Number(back) * 1000) === rec.takeInMs && Math.round(Number(first) * 1000) === rec.pauseToFirstMs, JSON.stringify({ back, first, rec }));
        assert(m.zones.map(z => z.k).join() === ZONE_ORDER.map(([k]) => k).filter(k => rec.zones[k]).join(), JSON.stringify(m.zones));
      }
      const first = paperText(STRS[0]);
      assert(first === 'TURN TO PAUSE 0.55 · PAUSE TO FIRST 1.45 · SPLITS 0.40 · 2 A', first);
      // (a string with no round fired: its paper says so, never a zero)
      const none = timerModel({ k: 2, line: 10, takeInMs: 650, pauseToFirstMs: null, splitsMs: [], zones: {} });
      assert(none.rows[1].value === '-' && none.rows[2].value === '-' && none.zones.length === 0, JSON.stringify(none.rows));
    },
  },
  {
    name: 'the paper stands in PAPER, which meets no HUD rectangle in the states it shows in (weapon, walking-paper, paused-paper and their paused) at 1600 × 900 and 1024 × 768, and at 1280 × 600 and 1920 × 1080',
    fn() {
      for (const [w, h] of [[1600, 900], [1024, 768], [1280, 600], [1920, 1080]]) {
        const out = [];
        for (const st of ['weapon', 'weapon-paused', 'walking-paper', 'paused-paper']) {
          const c = clashesAt(w, h, st), r = rectsAt(w, h, st);
          assert(!c.length && STATES[st].includes('PAPER'), `${w} × ${h} ${st}: ${c.join(', ')}`);
          // (the paper inside PAPER's rectangle: 200 × 124 at --ui in a 200 × 200)
          const ui = r.ui, paper = { x: r.PAPER.x, y: r.PAPER.y, w: TIMER_W * ui, h: TIMER_H * ui };
          assert(paper.w <= r.PAPER.w + 0.01 && paper.h <= r.PAPER.h + 0.01, JSON.stringify({ paper, PAPER: r.PAPER }));
          for (const n of STATES[st]) if (n !== 'PAPER') assert(!overlaps(paper, r[n]), `${st}: the paper over ${n}`);
          out.push(`${st} ui ${ui}: the paper ${Math.round(paper.w)} × ${Math.round(paper.h)} at ${Math.round(paper.x)}, ${Math.round(paper.y)}; ${Math.round(r.RADIO.y - (paper.y + paper.h))} px over RADIO`);
        }
        console.log(`      ${w} × ${h}: ${out.join(' · ')}`);
      }
      assert(RECTS.PAPER.w >= TIMER_W && RECTS.PAPER.h >= TIMER_H, 'the paper fits PAPER');
    },
  },
  {
    name: 'the end card says the run\'s three aspects in the scene\'s numbers and offers "Again as …" each other sheet on the same seed',
    fn() {
      const card = { turn: [{ k: 0, expect: 'sector', n: 1, takeInMs: 550 }, { k: 1, expect: 'sector', n: 2, takeInMs: 600 }, { k: 2, expect: 'sector', n: 3, takeInMs: 650 }, { k: 3, expect: 'sector', n: 1, takeInMs: 550 }, { k: 4, expect: 'alert', n: 2, takeInMs: 1250 }],
        shots: { rounds: 16, A: 13, C: 1, head: 2, miss: 0, noshoot: 0, rows: { 'shot:pair': 6, 'shot:failure': 1, 'shot:head': 1 } }, gun: { reload: { kind: 'speed', ms: 2530 }, topUp: { ms: 2800 }, short: true, rounds: 22 } };
      const lines = aspectLines(card, { fmt: takeInWords });
      for (const [k, t] of lines) console.log(`      ${k}: ${t}`);
      assert(lines.map(l => l[0]).join() === 'turn,shots,gun', JSON.stringify(lines));
      assert(lines[0][1].startsWith('0.55 · 0.60 · 0.65 · 0.55 · 1.25 s (sector, sector ×2, sector ×3, sector, alert ×2)'), lines[0][1]);
      assert(lines[1][1] === '13 A, 1 C, 2 head · no-shoot untouched · Pair 6, Failure drill 1, To the head 1', lines[1][1]);
      assert(lines[2][1] === 'RELOAD 2.53 s · topped up 2.80 s · dry on the short magazine', lines[2][1]);
      for (const played of ['private', 'tierone']) {
        const again = againTiers(SHEETS, played, SCENE.sheets);
        console.log(`      played as ${played}: ${again.map(a => `Again as ${a.label}`).join(', ')}`);
        assert(again.length === 4 && !again.some(a => a.tier === played) && again.every(a => Number.isFinite(a.wf)), JSON.stringify(again));
      }
      if (pairs?.againAs) {
        const a = pairs.againAs({ meta: { seed: 48213 } }, 'tierone');
        console.log(`      pairs.js againAs: ${JSON.stringify(a)}`);
        assert(a.seed === 48213 && a.tier === 'tierone' && a.scenario === 'test-pairs', JSON.stringify(a));
      }
    },
  },
  {
    name: 'the boot recruit\'s panel at the pause, as the page lays it (panelOf): Off safe first, then the aim, then Fire struck "off safe first"; the commands that are no answer to a man facing him (UNLOAD) off the first page (the design review of v0.0.8: Off safe was the seventh row, under a Top up and UNLOAD)',
    async fn() {
      const { createGame } = await import('./game.mjs');
      const { stepsOf } = await import('../src/sim/arms/shooting.js');
      const { contactNow } = await import('../src/sim/combat/contact.js');
      const { panelOf } = await import('../src/ui/hud/steps.js');
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'recruit', setup: 'standby:2' }), s = g.state;
      for (let n = 0; n < 400 && !(contactNow(s)?.last && s.stop?.mode === 'stop'); n++) g.step(1);
      const P = panelOf(stepsOf(s)), first = P.slots.map(x => `${x.key} ${x.step.id}${x.step.off ? ` (${x.step.off})` : ''}`);
      console.log(`      the recruit's first page: ${first.join(' · ')}${P.more ? ` · 0 more ${P.more.pages}` : ''}`);
      const ids = P.slots.map(x => x.step.id);
      assert(ids[0] === 'selector:semi' && ids[1] === 'aim' && ids[2] === 'fire' && P.slots[2].step.off === 'off safe first' && !ids.includes('macro:unload') && ids.filter(i => i === 'selector:semi').length === 1, first.join(' · '));
    },
  },
];
