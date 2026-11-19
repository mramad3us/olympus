// OLYMPUS tests: "Bang, then go", the scene (v0.0.26; its build sheet §1 item 1, §3.2, §6 B, §8 F138's quick half; ROADMAP §4.2's 0.0.7f).
//
// 'test-breach' is a scene of the house's scenario: room 1 of lane A as set, the live lane's two role-players in it both briefed to
// fight, the bang (the flash loadout for both of you) and the held door (1a laid on the threshold from GO) drawn from the seed
// (shoothouse.js drawBreach on stream(seed, 'breach:draw')), the URL's &breach= forcing either part, the lane ended at room 1's "Clear!".
// Its record is R.house.bangGo (never R.house.breach, the house's breached doors by door id: its build sheet §14 item 1), absent on every
// other lane. Held here: the spec and its place in the menu's order (after "Stack and clear, live", on the Tests menu since v0.0.26's integration met its ship rule), the
// fill (room 1's two men and nothing past it, the legs as on every lane, the record), the draw's weights over 400 seeds, the four draws
// forced, each to its card by the sergeant (the bang thrown by its row where issued), the card's head and the one row, "Again" and
// "Again as …" keeping the draw's words and "Another door" drawing anew, and the house's options, kit, role-players and setups dropped
// (the page's one toast, core/debug.js breachChoice; the fill's own drop, so a test's createGame cannot pass them either). The review of
// B and C (2026-11-19) adds the bang by T alone from rung 2 (goNow's flash default: one press throws it, red without it).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { newGame, specOf } from '../src/sim/game.js';
import { SCENES, SCENE_IDS } from '../src/data/scenes.js';
import { drawBreach, parseBreach, breachCode, againAsHouse, bangWindowOf, BREACH_BANG_W, BREACH_HELD_W } from '../src/sim/scenarios/shoothouse.js';
import { readParams, breachChoice, breachOnly, BREACH_DROPPED, BREACH_ONLY } from '../src/core/debug.js';
import { breachLane, breachLine, BREACH_DRAWS } from './breach-lanes.mjs';
import { endCard } from '../src/ui/cards/end.js';

const houseOf = (s) => s.armoury.range.house;

export default [
  {
    name: 'the scene: "Bang, then go" on the house\'s scenario after "Stack and clear, live", on the Tests menu (its ship rule met at v0.0.26\'s integration); its fill puts the two role-players in room 1 and nothing past it, the legs as on every lane, and writes R.house.bangGo on this lane alone',
    fn() {
      const rec = SCENES['test-breach'], ids = Object.keys(SCENES), at = ids.indexOf('test-breach');
      const s = newGame({ seed: 48213, scene: 'test-breach', version: 'test' }), H = houseOf(s), R = s.armoury.range;
      const men = R.turners.map(T => `${T.stand}${T.live ? `:${T.live.card}:${T.live.st}` : ''}`);
      const others = ['test-shoothouse', 'test-shoothouse-live', 'test-zerocqb'].map(id => [id, 'bangGo' in houseOf(newGame({ seed: 48213, scene: id, version: 'test' }))]);
      console.log(`      ${rec.id} "${rec.title}": scenario ${rec.scenario}, opfor ${rec.opfor}, breach ${rec.breach}, draws ${rec.draws}, menu ${rec.menu}, sheets ${rec.sheets.join(' ')} (${rec.sheet}); the menu's order ${ids.slice(at - 2, at + 2).join(', ')}`);
      console.log(`      on 48213: bangGo ${JSON.stringify(H.bangGo)}; the stands ${men.join(' ')}; legs ${H.rooms.map(L => L.state).join(' ')} + hall ${H.hall.state}; loadout ${H.loadout ?? 'standard'}; R.house.opfor ${H.opfor}; lane par ${H.laneParMs} ms (room 1's ${H.rooms[0].parMs})`);
      console.log(`      bangGo on the other house scenes: ${others.map(([id, has]) => `${id} ${has}`).join(', ')}`);
      assert(at === ids.indexOf('test-shoothouse-live') + 1 && ids[at + 1] === 'test-anchors' && SCENE_IDS.includes('test-breach') && rec.menu !== false, `the menu's order: ${ids.join(', ')}`);
      assert(rec.scenario === 'test-shoothouse' && rec.opfor === 'live' && rec.breach === 'drawn' && rec.course === 'house' && JSON.stringify(rec.draws) === '["set"]' && rec.sheets.length === 6 && rec.sheet === 'private', JSON.stringify(rec));
      assert(Object.keys(SCENES).every(id => specOf({ scene: id }).id === id) && specOf({ scenario: 'test-shoothouse' }).id === 'test-shoothouse', 'specOf resolves every scene, and the scenario its first');
      assert(H.bangGo && H.bangGo.v === 1 && H.bangGo.code === breachCode(H.bangGo) && H.bangGo.window === null && JSON.stringify(H.bangGo.track) === '{}' && H.bangGo.search === null, JSON.stringify(H.bangGo));
      assert(R.turners.length === 2 && R.turners.every(T => T.live && T.live.card === 'fight' && (T.stand === '1a' || T.stand === '1b')), men.join(' '));
      assert(H.rooms.length === 3 && H.hall && [...H.rooms, H.hall].every(L => L.state === 'ahead') && H.laneParMs === H.rooms[0].parMs, 'the legs as on every lane, the par room 1\'s');
      assert((H.bangGo.bang === 'bang') === (H.loadout === 'flash' || /flash|g11/i.test(String(H.loadout ?? ''))) && H.opfor === 'live' && !('breach' in H), JSON.stringify({ loadout: H.loadout, opfor: H.opfor }));
      assert(others.every(([, has]) => !has), 'R.house.bangGo absent on every other lane');
    },
  },
  {
    name: 'the draw: the bang on three seeds in four and the door held on one in two (the quiet held door one in eight) from its own stream; a forced part kept and the other the seed\'s; &breach= read by its form; no other draw of the house moves',
    fn() {
      const N = 400, n = { bang: 0, held: 0, qh: 0 };
      for (let seed = 1; seed <= N; seed++) { const d = drawBreach(seed); if (d.bang === 'bang') n.bang++; if (d.held === 'held') n.held++; if (d.bang === 'quiet' && d.held === 'held') n.qh++; }
      const se = (p) => Math.sqrt(p * (1 - p) / N), pB = BREACH_BANG_W[0][1] / (BREACH_BANG_W[0][1] + BREACH_BANG_W[1][1]), pH = BREACH_HELD_W[0][1] / (BREACH_HELD_W[0][1] + BREACH_HELD_W[1][1]);
      const forms = ['bang,held', 'quiet', '*,loose', 'drawn', '', 'bang,x', 'held,bang', 'quiet,held,more'].map(t => `${JSON.stringify(t)} → ${JSON.stringify(parseBreach(t))}`);
      const d0 = drawBreach(48213), forced = drawBreach(48213, parseBreach('quiet')), urls = ['?breach=bang,held', '?breach=*,loose', '?breach=nope', '?play=test-breach'].map(q => `${q} ${JSON.stringify(readParams(q).breach)}`);
      console.log(`      over ${N} seeds: the bang ${n.bang} (${(n.bang / N * 100).toFixed(1)}%, weight ${(pB * 100).toFixed(1)}%), held ${n.held} (${(n.held / N * 100).toFixed(1)}%), the quiet held door ${n.qh} (${(n.qh / N * 100).toFixed(1)}%)`);
      console.log(`      48213 draws ${breachCode(d0)}; forced quiet ${breachCode(forced)}; ${forms.join('; ')}`);
      console.log(`      the URL: ${urls.join('; ')}`);
      assert(Math.abs(n.bang / N - pB) <= 4 * se(pB) && Math.abs(n.held / N - pH) <= 4 * se(pH) && Math.abs(n.qh / N - (1 - pB) * pH) <= 4 * se((1 - pB) * pH), JSON.stringify(n));
      assert(forced.bang === 'quiet' && forced.held === d0.held, 'a forced part kept, the other the seed\'s');
      assert(parseBreach('bang,x').error && parseBreach('held,bang').error && parseBreach('quiet,held,more').error && parseBreach('drawn').bang === null && parseBreach('*,loose').held === 'loose', 'parseBreach\'s forms');
      assert(readParams('?breach=bang,held').breach === 'bang,held' && readParams('?breach=nope').breach === null && readParams('?play=test-breach').breach === null, urls.join('; '));
      // (the draw's stream is its own: the house's stands drawn the same with the scene or without it)
      const plain = createGame({ scenario: 'test-shoothouse', seed: 48213, opfor: 'live' }).state, bg = createGame({ scenario: 'test-shoothouse', seed: 48213, breach: 'drawn' }).state;
      const same = (k) => JSON.stringify(houseOf(plain)[k]) === JSON.stringify(houseOf(bg)[k]);
      assert(same('twoPid') && houseOf(plain).dummy.round === houseOf(bg).dummy.round && same('laneParMs') === false, 'the dummy and your #2 the same draws (the lane\'s par room 1\'s alone)');
    },
  },
  {
    name: 'F138 (quick): the four draws forced by &breach=, each to its card by the sergeant (T, the bang thrown by its row where issued): the lane ends at room 1, the run sheet one row, the card\'s head naming the draw',
    timeoutMs: 120_000,
    fn() {
      const bad = [];
      for (const code of BREACH_DRAWS) {
        const { rec } = breachLane({ tier: 'sgt', seed: 48213, code });
        const B = rec.sheet.breach, [bang, held] = code.split(',');
        console.log(`      ${breachLine(rec)}`);
        console.log(`        ${B?.head}; ${B?.window}; ${rec.sheet.card}`);
        const ok = rec.done && ['clear', 'casualty', 'passed'].includes(rec.end) && rec.sheet.rows.length === 1 && /^ROOM 1 /.test(rec.sheet.rows[0].words) && /BANG, THEN GO · .* · ROOM 1 /.test(rec.sheet.card)
          && B.head.includes(bang === 'bang' ? 'THE BANG ISSUED' : 'NO BANG') && B.head.includes(held === 'held' ? 'THE DOOR WAS HELD' : 'THE DOOR WAS LOOSE') && (bang === 'bang') === (rec.W.bangAtMs !== null);
        // (the lane's clock stopped at room 1's "Clear!", the search's offer after it never timed: the card's lane time is room 1's)
        const legS = /^ROOM 1 · ([0-9.]+) S/.exec(rec.sheet.rows[0].words)?.[1], laneS = / · ([0-9.]+) S · PAR /.exec(rec.sheet.card)?.[1];
        if (!ok || !legS || !laneS || Math.abs(Number(legS) - Number(laneS)) > 0.051) bad.push(`${code}${legS !== laneS ? ` (room 1 ${legS} s, the lane ${laneS} s)` : ''}`);
      }
      assert(!bad.length, `draws not to their card as the scene: ${bad.join(', ')}`);
    },
  },
  {
    name: '"Another door" on the end card: "Bang, then go"\'s second line names the new seed in the scene\'s words ("Another door · a new seed, a new draw", ui/cards/end.js reading scenes.js newSeed) and plays Again on a new seed; every other scene keeps "Again with a new seed" (the review of B and C, 2026-11-19: no test read the line)',
    fn() {
      const calls = [], on = { again: (same) => calls.push(same) };
      const breach = endLines(SCENES['test-breach'], on), house = endLines(SCENES['test-shoothouse'], on);
      const door = breach.find(l => l.text.includes('Another door')) ?? null;
      door?.click?.();
      console.log(`      "Bang, then go": ${breach.slice(0, 3).map(l => `"${l.text}"`).join(', ')}; "Stack and clear": ${house.slice(0, 3).map(l => `"${l.text}"`).join(', ')}; Another door's click → again(${calls[0]})`);
      assert(door && /^2Another door/.test(door.text) && door.text.includes('a new seed, a new draw') && calls[0] === false, JSON.stringify(breach.map(l => l.text)));
      assert(house.some(l => /^2Again with a new seed/.test(l.text)) && !house.some(l => l.text.includes('Another door')), JSON.stringify(house.map(l => l.text)));
    },
  },
  {
    name: 'F138 (quick, by T alone): from rung 2 one press throws the bang (goNow starts room 1\'s bundle with its bang at flash where it was issued): houseTBot throws exactly one G-11 through room 1\'s door on the bang, the corporal and the tier one on 48213, and none on the quiet door (the review of B and C, 2026-11-19: no test failed without the default)',
    fn() {
      const rows = [], bad = [];
      for (const [tier, code] of [['cpl', 'bang,held'], ['tierone', 'bang,held'], ['cpl', 'quiet,held']]) {
        const { g, rec } = breachLane({ tier, seed: 48213, code, bot: 'T' }), H = houseOf(g.state), door = H.rooms[0].door;
        const thrown = (H.bursts ?? []).filter(b => b.thrown === door && b.model === 'g11').length, all = (H.bursts ?? []).length, want = code.startsWith('bang') ? 1 : 0;
        rows.push(`${breachLine(rec)}; G-11 through ${door} ${thrown} (bursts ${all}); the wash "${(rec.wash?.lines ?? [])[0]}"`);
        if (!rec.done || thrown !== want || all !== want || (want && rec.W.bangAtMs === null)) bad.push(`${tier} ${code}: thrown ${thrown}, bursts ${all}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: '"Again" and "Again as …" keep the draw\'s words; "Another door" is the end card\'s new seed; every house option, kit, role-players\' cards and setup but \'go\' dropped by the fill and said once by the page; &breach= dropped with its toast on every other scene',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', breach: 'quiet,held' }), a = againAsHouse(g.state, 'tierone');
      const again = createGame({ scenario: a.scenario, seed: a.seed, tier: a.tier, breach: a.breach });
      const asked = createGame({ scenario: 'test-shoothouse', seed: 48213, breach: 'bang,loose', draw: 'drawn', layout: 'B', loadout: 'frag', opfor: 'live:give,give', setup: 'room:2', plans: 'derived' }).state;
      const H = houseOf(asked), toast = breachChoice(SCENES['test-breach'], { layout: 'B', loadout: 'frag', setup: 'room:2' }), quiet = breachChoice(SCENES['test-breach'], { opfor: 'live', setup: 'go' }), other = breachChoice(SCENES['test-shoothouse'], { layout: 'B' });
      console.log(`      Again as the tier one: ${JSON.stringify(a)}; its bangGo ${houseOf(again.state).bangGo.code}; "Another door": ${JSON.stringify(SCENES['test-breach'].newSeed)}`);
      console.log(`      asked draw drawn, layout B, loadout frag, opfor live:give,give, setup room:2, plans derived: draw ${H.draw ?? 'none'}, plans ${H.plans ?? 'authored'}, loadout ${H.loadout}, cards ${R1(asked)}, cur ${H.cur}, GO ${H.goAtMs}; the page: ${JSON.stringify(toast)}, ${JSON.stringify(quiet)}, the house's ${JSON.stringify(other)}`);
      assert(a.breach === 'quiet,held' && a.tier === 'tierone' && houseOf(again.state).bangGo.code === 'quiet,held', JSON.stringify(a));
      assert(SCENES['test-breach'].newSeed?.[0] === 'Another door', 'the card\'s new seed named');
      assert(!H.draw && !H.plans && H.bangGo.code === 'bang,loose' && /flash|g11/i.test(String(H.loadout)) && R1(asked) === '1a:fight 1b:fight' && H.goAtMs === null, 'the fill drops every house option, the kit and the cards, and the setup');
      assert(toast.dropped.length === 1 && toast.dropped[0] === BREACH_DROPPED && !quiet.dropped.length && !other.dropped.length, 'the page\'s one toast');
      // (&breach= is the scene's alone: on "Stack and clear", its live lane or a bare scenario, dropped with its toast, never played as room 1
      // (the review of B and C, 2026-11-19); main.js' URL start passes breachOnly's breach)
      const only = Object.fromEntries([['test-breach', SCENES['test-breach']], ['test-shoothouse', SCENES['test-shoothouse']], ['test-shoothouse-live', SCENES['test-shoothouse-live']], ['bare', null]].map(([k, r]) => [k, breachOnly(r, 'bang,held')]));
      console.log(`      &breach=bang,held: ${Object.entries(only).map(([k, o]) => `${k} ${o.breach ?? 'dropped'}${o.dropped.length ? ` ("${o.dropped[0]}")` : ''}`).join(', ')}; none asked ${JSON.stringify(breachOnly(SCENES['test-shoothouse'], null))}`);
      assert(only['test-breach'].breach === 'bang,held' && !only['test-breach'].dropped.length && ['test-shoothouse', 'test-shoothouse-live', 'bare'].every(k => only[k].breach === null && only[k].dropped.length === 1 && only[k].dropped[0] === BREACH_ONLY) && !breachOnly(SCENES['test-shoothouse'], null).dropped.length, JSON.stringify(only));
    },
  },
];
// (a stand-in for the page's elements, what endCard touches (tests/house-picker.test.mjs's, cut down), and the text of a node)
class El {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.childNodes = []; this.dataset = {}; this.on = {}; this.textContent = ''; this.style = {}; this.className = ''; }
  get firstChild() { return this.childNodes[0] ?? null; }
  get classList() { return { add() {}, remove() {}, contains: () => false, toggle() {} }; }
  append(...k) { this.childNodes.push(...k); }
  replaceChildren(...k) { this.childNodes = [...k]; }
  addEventListener(t, f) { (this.on[t] ??= []).push(f); }
  focus() {}
}
const textOf = (n) => (typeof n === 'string' ? n : [n.textContent ?? '', ...(n.childNodes ?? []).map(textOf)].join(''));
const buttonsOf = (n, out = []) => { if (typeof n !== 'string') { if (n.tagName === 'BUTTON') out.push(n); for (const k of n.childNodes ?? []) buttonsOf(k, out); } return out; };
function endLines(scene, on) {
  const was = globalThis.document;
  globalThis.document = { createElement: (t) => new El(t) };
  try { const c = endCard({ scene, seed: 48213, on, sheet: 'Private' }); return buttonsOf(c.body ?? c).map(b => ({ text: textOf(b), click: b.onclick })); } finally { globalThis.document = was; }
}
function R1(s) { return s.armoury.range.turners.map(T => `${T.stand}:${T.live?.card}`).join(' '); }
