// OLYMPUS tests: the v0.0.20 hunt's page findings in node (quick): the end card's keys (P2), a lane set up on the card and the picker
// (P3), the timer's and the inset's paper drawn at the size they are shown (T6).
//
// P2: a card numbers at most CARD_KEYS lines, the tenth labelled 0 (boot.js digit's key for it): the sergeant's live NO-GO had eleven,
// "10 Export the run" and "11 Back to the title", and typing 1, 1 as labelled started the lane again. endCard and menuCard are built
// here on a stub document (the cards only create, assign and append). P3: a lane set up ("Again from room 2", &setup=) is never a
// sheet's best (house-runs.js bestsOf), and its card counts its own rooms, threats and par, its one thing never "Clean lane" beside
// its NO-GO, its set-up rows "SET UP" alone (shoothouse.js runSheetOf), the sergeant by T on 48213 from room 2, room 3 and the hall.
// T6: timer.js and paper.js size the canvas's pixels --ui × dpr (below 1 too) and show it at its own pixels over dpr: at --ui 0.85 it
// was drawn at 200 px into a 170 px box, and at every size 2 px wider than its bordered box (the page's half: ui-hunt-page).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseBot, runHouse } from './bots/house.mjs';

// (a document of plain objects: what the cards use of it)
function stubDoc() {
  const node = (tag) => ({
    tag, className: '', children: [], dataset: {}, style: {}, classList: { toggle() {}, add() {} },
    append(...k) { this.children.push(...k); }, replaceChildren(...k) { this.children = k; }, addEventListener() {}, setAttribute() {},
    get firstChild() { return this.children[0] ?? null; }, querySelectorAll: () => [], getContext: () => null,
  });
  return { createElement: node };
}
const withDoc = async (fn) => { const was = globalThis.document; globalThis.document = stubDoc(); try { return await fn(); } finally { globalThis.document = was; } };
const keyOf = (b) => b.children[0].textContent, wordsOf = (b) => b.children[1];

export default [
  {
    name: 'the end card numbers at most ten lines, the tenth labelled 0: the sergeant\'s live NO-GO keeps "0 Back to the title" and "Export the run" gives up its number; the Esc menu\'s tenth reads 0 (the hunt of v0.0.20, P2)',
    async fn() {
      await withDoc(async () => {
        const { endCard, keysOf } = await import('../src/ui/cards/end.js');
        const { menuCard, CARD_KEYS } = await import('../src/ui/cards/menu.js');
        const again = ['recruit', 'private', 'cpl', 'raider', 'tierone'].map(t => ({ tier: t, label: t, wf: 1 }));
        const scene = { id: 'test-shoothouse', title: 'Stack and clear', aspects: [1, 2, 3, 4, 5, 6] };
        const nogo = endCard({ scene, seed: 48213, again, verdict: { go: false, words: 'NO-GO. A casualty.' }, from: { setup: 'room:2', word: 'room 2' }, exportRun: true });
        const go = endCard({ scene, seed: 48213, again, verdict: { go: true, words: 'GO.' }, exportRun: true });
        const card = (c) => c.body.children.find(k => k?.className === 'glass-list');
        const all = (c) => card(c).children.map(b => `${keyOf(b)} ${wordsOf(b)}`);
        const menu = menuCard({ acts: Array.from({ length: 9 }, (_, i) => [`act ${i + 1}`, () => {}]), sound: { volume: 0.8, muted: false } });
        console.log(`      the live NO-GO: ${all(nogo).join(' | ')}`);
        console.log(`      a GO: ${all(go).join(' | ')}; the menu's last: "${keyOf(menu.lines.at(-1))} ${wordsOf(menu.lines.at(-1))}"; keysOf(13): ${keysOf(13).map(k => k ?? '·').join(' ')}`);
        const labels = (c) => c.lines.map(keyOf);
        assert(nogo.lines.length === CARD_KEYS && labels(nogo).join('') === '1234567890' && wordsOf(nogo.lines[9]) === 'Back to the title', JSON.stringify(all(nogo)));
        assert(all(nogo).includes('· Export the run') && !nogo.lines.some(b => wordsOf(b) === 'Export the run'), 'the export unnumbered, still on the card');
        assert(go.lines.length === 10 && wordsOf(go.lines[8]) === 'Export the run' && keyOf(go.lines[9]) === '0', JSON.stringify(all(go)));
        assert(keyOf(menu.lines.at(-1)) === '0' && menu.lines.length === 10, 'the menu\'s tenth reads 0');
        assert(keysOf(13).filter(Boolean).length === 10 && keysOf(13).at(-1) === '0', 'past ten, the title keeps 0');
      });
    },
  },
  {
    name: 'a lane set up is never a sheet\'s best on the picker: "best 5.5 s" was the hall alone over the full lane\'s 46.9 s (the hunt of v0.0.20, P3)',
    async fn() {
      const { bestsOf, bestWords } = await import('../src/ui/cards/house-runs.js');
      const runs = [{ scene: 'test-shoothouse', sheet: 'sgt', loadout: 'standard', seed: 48213, laneMs: 46850, go: true, why: [] },
        { scene: 'test-shoothouse', sheet: 'sgt', loadout: 'standard', seed: 48213, laneMs: 5550, go: false, why: ['setup'] },
        { scene: 'test-shoothouse', sheet: 'cpl', loadout: 'standard', seed: 48213, laneMs: 31400, go: false, why: ['setup'] }];
      const b = bestsOf(runs);
      console.log(`      the sergeant: "${bestWords(b.sgt)}" (${b.sgt.n} run); the corporal, set up only: ${bestWords(b.cpl)}`);
      assert(b.sgt.bestMs === 46850 && b.sgt.n === 1 && bestWords(b.sgt) === 'best 46.9 s · 1 GO' && !b.cpl, JSON.stringify(b));
    },
  },
  {
    name: 'a lane set up counts on its card the rooms it ran, their threats and their par, its set-up rows "SET UP" alone, never "Clean lane" beside its NO-GO; the full lane\'s card is as it was (the hunt of v0.0.20, P3)',
    async fn() {
      const { runSheetOf, houseNow } = await import('../src/sim/scenarios/shoothouse.js');
      const { houseAspects } = await import('../src/ui/cards/house.js');
      const out = {};
      for (const setup of ['room:2', 'room:3', 'hall', 'go']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, setup, tier: 'sgt' });
        runHouse(g, houseBot({ mode: 'T' }));
        const rs = runSheetOf(g.state), H = g.state.armoury.range.house;
        const drill = (houseAspects(houseNow(g.state)) ?? []).find(([k]) => k === 'drill')?.[1] ?? null;
        out[setup] = { card: rs.card, one: rs.one.key, clean: rs.practised.clean, rows: rs.rows.map(r => r.words), legPars: [...H.rooms, H.hall].map(L => (L.setup ? null : L.parMs)), drill };
        console.log(`      ${setup}: ${rs.card}`);
        console.log(`        the one thing '${rs.one.key}' "${rs.one.text}"; ${rs.practised.clean} clean; rows: ${rs.rows.map(r => r.words.split(' · ').slice(0, 2).join(' ')).join(' / ')}`);
        console.log(`        the drill's aspect: ${typeof drill === 'string' ? drill : JSON.stringify(drill)}`);
      }
      const par = (k) => `PAR ${(out[k].legPars.reduce((a, b) => a + (b ?? 0), 0) / 1000).toFixed(1)} S`;
      const two = out['room:2'], three = out['room:3'], hall = out.hall, full = out.go;
      assert(/ 2 ROOMS · /.test(two.card) && two.card.includes(par('room:2')) && two.card.includes('PAR 56.0 S') && / 4 OF 4 THREATS/.test(two.card) && two.one === 'setup' && two.clean === 2 && two.rows[0] === 'ROOM 1 · SET UP', JSON.stringify(two));
      assert(/ 1 ROOM · /.test(three.card) && three.card.includes(par('room:3')) && / 3 OF 3 THREATS · 1 NO-SHOOT UNTOUCHED/.test(three.card) && three.rows[1] === 'ROOM 2 · SET UP', JSON.stringify(three));
      assert(/ THE HALL · 5\.5 S · PAR 15\.0 S · 1 OF 1 THREATS · TAKE-IN/.test(hall.card) && hall.one === 'setup' && !/NO-SHOOT/.test(hall.card) && /^hall 5\.55 s, /.test(String(hall.drill)), JSON.stringify(hall));
      assert(/^room 2 5\.60 s, .*room 3 .*hall /.test(String(two.drill)) && !/room 1/.test(String(two.drill)) && /^room 1 7\.10 s, /.test(String(full.drill)), JSON.stringify({ two: two.drill, full: full.drill }));
      assert(/^GO · .* 3 ROOMS · 46\.9 S · PAR 69\.0 S · 6 OF 6 THREATS · 2 NO-SHOOTS UNTOUCHED/.test(full.card) && full.one !== 'setup' && full.clean === 3, JSON.stringify(full));
    },
  },
  {
    name: 'the lane timer\'s and the inset\'s paper are drawn at the size they are shown: --ui × dpr pixels, shown at their own pixels over dpr, at --ui 0.85 to 1.5 and dpr 1 and 2 (the hunt of v0.0.20, T6)',
    async fn() {
      await withDoc(async () => {
        const { createTimer, TIMER_W, TIMER_H } = await import('../src/ui/hud/timer.js');
        const { createPaper, PAPER_PX } = await import('../src/ui/hud/paper.js');
        const parent = document.createElement('div'), T = createTimer(parent), P = createPaper(parent);
        const tm = { text: 'x', title: 'LANE TIMER', head: 'LANE A', rows: [{ label: 'LANE', value: '46.85' }], zones: [] };
        const pm = { kind: 'card', label: 'LANE 5', score: '', holes: [] };
        const rows = [], bad = [];
        for (const ui of [0.85, 1, 1.07, 1.25, 1.5]) for (const dpr of [1, 2]) {
          T.update(tm, { ui, dpr }); P.update(pm, { ui, dpr });
          const tc = T.el.children[0], pc = P.el.children[0];
          const shown = (c) => parseFloat(c.style.width) * dpr;
          rows.push(`${ui}×${dpr}: timer ${tc.width} px shown ${shown(tc)}, box ${TIMER_W * ui * dpr}; inset ${pc.width} shown ${shown(pc)}, box ${PAPER_PX * ui * dpr}`);
          for (const [c, box, h] of [[tc, TIMER_W, TIMER_H], [pc, PAPER_PX, PAPER_PX]]) {
            if (Math.abs(shown(c) - c.width) > 1e-9 || Math.abs(c.width - box * ui * dpr) > 0.5 || Math.abs(parseFloat(c.style.height) * dpr - c.height) > 1e-9 || Math.abs(c.height - h * ui * dpr) > 0.5) bad.push(rows.at(-1));
          }
        }
        for (const r of rows.filter((_, i) => i % 3 === 0)) console.log(`      ${r}`);
        assert(!bad.length, JSON.stringify(bad));
      });
    },
  },
];
