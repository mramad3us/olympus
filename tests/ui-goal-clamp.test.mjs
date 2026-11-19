// OLYMPUS tests: the goal line never clipped, and the brief's PA lines paged whole (v0.0.23, its build sheet item 13, carried FH-4 and DC3b; F96), heavy: a browser.
//
// The shoot house's goal names your number two by rank and name (shoothouse.js houseGoal), and from v0.0.23 the live lane's goal is its
// own (the role-players and their marking rounds) and the push door's dead corner is named once on it (DW): on a toast clamped at two
// lines (style.css .toast, -webkit-line-clamp 2) the longest lost its last words at 1280 × 720 ("… Threats down, no-shoots untouched."
// was the first to go). From v0.0.23 the goal is pushed with kind 'goal' (toasts.js push's kind, main.js launch), clamped at three lines
// (.toast.goal). Here the seed and sheet whose goal is longest over 40 seeds and the six sheets (printed), the set lane and the live,
// at 1280 × 720 and 1600 × 900: the goal toast whole (scrollHeight within clientHeight + 1), inside the toasts' box, over neither the
// step panel nor the watch nor the lane timer; and every PA line of the brief, sampled through it to LOAD, paged with no row cut (the
// radio's .said within its two rows: v0.0.21's fixer's paging); and the goal at the longest rank and family the names can give ("Private
// First Class" and FAMILY's longest), on a drawn house and on the live lane, written into the same toast: whole. F96 printed as its row.
// Fails without FH-4: the goals are three lines, the toast's own clamp two.
import { assert } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { createGame } from './game.mjs';
import { houseGoal } from '../src/sim/scenarios/shoothouse.js';
import { FAMILY } from '../src/data/setting/names.js';

const TIERS = ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'];
/** The longest goal of each lane (set, live) over 40 seeds and the six sheets: { seed, tier, text }. */
export function longestGoals(seeds = 40) {
  const best = {};
  for (const live of [false, true]) for (const tier of TIERS) for (let seed = 1; seed <= seeds; seed++) {
    const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go', ...(live ? { opfor: 'live' } : {}) }), text = houseGoal(g.state), k = live ? 'live' : 'set';
    if (!best[k] || text.length > best[k].text.length) best[k] = { seed, tier, text };
  }
  return best;
}
/** The goal at the longest rank and family the names can give (PFC, FAMILY's longest), on the set lane drawn from the seed and on the live lane: { set, live } texts. */
export function worstGoals() {
  const family = [...FAMILY].sort((a, b) => b.length - a.length)[0], out = {};
  for (const [k, opts] of [['set', { draw: 'drawn' }], ['live', { opfor: 'live' }]]) {
    const g = createGame({ scenario: 'test-shoothouse', seed: 1, tier: 'recruit', setup: 'go', ...opts }), s = g.state, two = s.people[s.armoury.range.house.twoPid];
    two.service.rank = 'PFC'; two.name.family = family;
    out[k] = houseGoal(s);
  }
  return out;
}

export default [
  {
    name: 'the goal line whole at three lines and the brief\'s PA lines paged with no row cut, the longest goal of 40 seeds and six sheets, set and live, at 1280 × 720 and 1600 × 900: inside the toasts\' box, over neither the panel nor the clocks; F96 (v0.0.23, carried FH-4 and DC3b; before: clamped at two lines, its last words lost)',
    heavy: true,
    timeoutMs: 600_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined, rows = [], bad = [];
      const best = longestGoals(), worst = worstGoals();
      for (const [k, b] of Object.entries(best)) rows.push(`the longest ${k} goal: seed ${b.seed}, the ${b.tier}, ${b.text.length} characters: "${b.text}"`);
      for (const [k, t] of Object.entries(worst)) rows.push(`the worst ${k} goal the names can give, ${t.length} characters: "${t}"`);
      await withGame(async (page, errors, game) => {
        for (const [W, H] of [[1280, 720], [1600, 900]]) {
          for (const [k, b] of Object.entries(best)) {
            await page.setViewportSize({ width: W, height: H });
            await game.open(`play=${k === 'live' ? 'test-shoothouse-live' : 'test-shoothouse'}&seed=${b.seed}&tier=${b.tier}&nostore=1`);
            await page.waitForFunction(() => window.__ready && !!document.querySelector('.toasts .toast.goal'), null, { timeout: 60000 });
            const goal = await page.evaluate(() => {
              const t = document.querySelector('.toasts .toast.goal'), box = document.querySelector('.toasts').getBoundingClientRect(), r = t.getBoundingClientRect();
              const lh = parseFloat(getComputedStyle(t).lineHeight) || 1, others = {};
              for (const sel of ['.steps', '.watch', '.timer']) { const e = document.querySelector(sel); if (e && !e.hidden && e.offsetParent !== null) { const q = e.getBoundingClientRect(); if (q.width && q.height) others[sel] = !(q.right <= r.left || q.left >= r.right || q.bottom <= r.top || q.top >= r.bottom); } }
              return { text: t.textContent, whole: t.scrollHeight <= t.clientHeight + 1, lines: Math.round((t.clientHeight - (parseFloat(getComputedStyle(t).paddingTop) + parseFloat(getComputedStyle(t).paddingBottom))) / lh), sh: t.scrollHeight, ch: t.clientHeight, inside: r.left >= box.left - 0.5 && r.right <= box.right + 0.5 && r.top >= box.top - 0.5 && r.bottom <= box.bottom + 0.5, over: Object.entries(others).filter(([, v]) => v).map(([s]) => s) };
            });
            // (the worst the names can give, written into the same toast: whole)
            const w = await page.evaluate((text) => { const t = document.querySelector('.toasts .toast.goal'), was = t.textContent; t.textContent = text; const r = { whole: t.scrollHeight <= t.clientHeight + 1, sh: t.scrollHeight, ch: t.clientHeight }; t.textContent = was; return r; }, worst[k]);
            if (!w.whole) bad.push(`${W}×${H} ${k}: the worst goal cut ${JSON.stringify(w)}`);
            // (the brief's PA lines through to LOAD, sampled every 250 ms: each shown page within its two rows)
            const cut = [], seen = new Set();
            for (let i = 0; i < 160; i++) {
              const s = await page.evaluate(() => ({ load: window.__olympus.state?.armoury?.range?.cmd?.id === 'load', said: [...document.querySelectorAll('.radio.voices .voice.pa .said')].map(e => ({ text: e.textContent, cut: e.scrollHeight > e.clientHeight + 1 })) }));
              for (const x of s.said) { seen.add(x.text); if (x.cut) cut.push(x.text); }
              if (s.load) break;
              await page.waitForTimeout(250);
            }
            const paged = [...seen].filter(t => /…/.test(t)).length;
            rows.push(`${W} × ${H}, ${k}: the goal ${goal.lines} lines (${goal.ch} px of ${goal.sh}), ${goal.whole ? 'whole' : 'CUT'}, the worst ${w.ch} px of ${w.sh}, ${goal.inside ? 'inside the toasts\' box' : 'OUTSIDE its box'}${goal.over.length ? `, OVER ${goal.over.join(', ')}` : ''}; the PA's pages to LOAD ${seen.size} shown (${paged} a page of a longer line), ${cut.length} cut`);
            if (!goal.whole || !goal.inside || goal.over.length || goal.text !== b.text) bad.push(`${W}×${H} ${k}: ${JSON.stringify(goal)}`);
            if (cut.length || !seen.size) bad.push(`${W}×${H} ${k}: the PA cut ${JSON.stringify(cut.slice(0, 2))}, ${seen.size} shown`);
          }
        }
      }, { port });
      const F96 = { id: 'F96', name: 'the rule never clipped', met: !bad.length, value: `${rows.length - 4} lanes and sizes, ${bad.length} with the goal or a PA page cut` };
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      F96 ${F96.name}: ${F96.met ? 'MET' : 'NOT MET'}, ${F96.value}`);
      assert(F96.met, bad.join(' | '));
    },
  },
];
