// OLYMPUS tests: the fixer of v0.0.24's two reviews (the play review and the code review of the integrated tree), each case failing
// without its fix. Quick: the sim and the pure parts in node; the page's own cases are tests/ui-fixer-v024.test.mjs (heavy).
//   H2  the live lane on &env=ship-coast reaches GO: the instructor's sterile walk had nothing to push on at 0 G and the brief stood
//       for good (shoothouse.js sterileTick: where his legs cannot push he checks each of you by eye from where he stands);
//   M1  on the coast house the stall says why it moves you on ("Move. You are clearing, not visiting." where you could not move),
//       and the one thing is the footing's ('passed:footing'), never the stack's or the door's;
//   CR2 a body strapped into its rack is held there: the keys only turn it (places/move.js), so it is never 'couched' away from it;
//   CR6 the URL's &grav= adds to the scene's profile (gravity.js addProfile; main.js called setProfile, which replaced the burn);
//   CR3 the bubbles' sizes and pages are kept by their text, never drawn again each frame (plaque.js balloonSize, bubblePages);
//   L1  in Well A the step panel waits for the cadre, never the tower;
//   L2  a bubble's line never ends on a page of one row after a full page (the widow "metres.");
//   L3  the burn's card names the time first secured and the way secured at the drive's lighting as two moments;
//   L4  the clock box names Well A once;
//   M4  the To score page: no rated set in a waiting row, and every set the gallery has waiting has a row;
//   L8  the gallery's "Copy my picks" with nothing new says so and copies nothing.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { root } from './helpers.mjs';
import { houseBot, runHouse } from './bots/house.mjs';
import { anchorsBot } from './bots/void.mjs';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';
import { HOUSE_CHIEF } from '../src/data/courses.js';
import { footingOf } from '../src/sim/body/footing.js';
import { setStrapped, parseGrav, addProfile, profileOf } from '../src/sim/places/gravity.js';
import { BERTH_SPOTS } from '../src/data/places/testudo.js';
import { bubblePages, balloonSize, balloonPixels, placeBubbles, BUBBLE_ROWS } from '../src/ui/plaque.js';
import { anchorsNow } from '../src/sim/scenarios/anchors.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { burnSaid } from '../src/ui/cards/anchors.js';
import { placeLine } from '../src/sim/places/model.js';
import { ROWS, ratedRow, RATED_SETS } from '../src/ui/cards/topick.js';
import { toScore } from '../samples/to-score.js';

const said = (g, out) => { for (const [t, f] of g.bus.events ?? []) if (t === 'say' && f?.text) out.push(String(f.text)); };

export default [
  {
    name: 'H2: "Stack and clear, live" on &env=ship-coast reaches GO: at 0 G the instructor checks each of you by eye from his post ("Clean. Next.", "Clean."), and LOAD follows (the play review: the brief stood 15 min, his walk unable to start)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live', env: 'ship-coast' }), bot = houseBot({ mode: 'keys' }), lines = [];
      let n = 0;
      for (; n < 4000 && g.state.armoury.range.house.goAtMs === null; n++) { g.step(1, bot); said(g, lines); g.clearFacts?.(); }
      const H = g.state.armoury.range.house;
      console.log(`      ${n} ticks: GO ${H.goAtMs !== null ? 'set' : 'NOT SET'}; the sterile check ${JSON.stringify(Object.keys(H.sterile?.done ?? {}).length)} of 2 done; said ${lines.filter(t => /^Clean/.test(t)).join(' / ') || 'nothing'}`);
      assert(H.goAtMs !== null && Object.keys(H.sterile?.done ?? {}).length === 2, JSON.stringify({ n, go: H.goAtMs, sterile: H.sterile, cmd: g.state.armoury.range.cmd?.id }));
    },
  },
  {
    name: 'M1: the coast house (set lane, the sergeant by T): every move-on says the footing\'s words, never "Move. You are clearing, not visiting."; the rooms passed are the footing\'s and the one thing says so',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', env: 'ship-coast' }), lines = [];
      const r = runHouse(g, houseBot({ mode: 'T' }), { each: (gg) => said(gg, lines) });
      const H = g.state.armoury.range.house, sheet = runSheetOf(g.state), why = [...H.rooms, H.hall].map(L => L.passWhy ?? null);
      const moves = lines.filter(t => HOUSE_CHIEF.stall.includes(t) || HOUSE_CHIEF.stallFooting.includes(t));
      console.log(`      ${r.done ? 'to the card' : 'NOT DONE'}; the move-ons: ${moves.join(' / ')}; passed by why ${JSON.stringify(why)}; the one thing ${sheet.one?.key}: "${sheet.one?.text}"`);
      assert(r.done && moves.length > 0 && moves.every(t => HOUSE_CHIEF.stallFooting.includes(t)), JSON.stringify(moves));
      assert(why.filter(Boolean).every(w => w === 'footing') && sheet.one?.key === 'passed:footing', JSON.stringify({ why, one: sheet.one }));
    },
  },
  {
    name: 'M1: at 1 G the house is as it was: the sergeant\'s T lane on 48213 passes nothing, never the footing\'s words',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt' }), lines = [];
      const r = runHouse(g, houseBot({ mode: 'T' }), { each: (gg) => said(gg, lines) });
      const H = g.state.armoury.range.house, why = [...H.rooms, H.hall].map(L => L.passWhy ?? null);
      assert(r.done && !why.some(Boolean) && !lines.some(t => HOUSE_CHIEF.stallFooting.includes(t)) && runSheetOf(g.state).one?.key !== 'passed:footing', JSON.stringify({ why, one: runSheetOf(g.state).one }));
    },
  },
  {
    name: 'CR2: strapped into the rack at 0 G, the keys only turn you: no walk away while still strapped (the code review: 1.41 m walked in 120 ticks, still \'couched\'); unstrapped you push off',
    fn() {
      const g = createGame({ scenario: 'test-burn', seed: 48213 }), s = g.state, me = g.me();
      Object.assign(me, { x: BERTH_SPOTS.rack.foot[0], z: BERTH_SPOTS.rack.foot[1] });
      setStrapped(s, s.player.id, 'rack');
      const x0 = me.x, z0 = me.z;
      for (const k of [{ mx: 1 }, { mz: 1 }, { mx: -1 }]) g.step(40, k);
      const moved = Math.hypot(me.x - x0, me.z - z0);
      const g2 = createGame({ scenario: 'test-burn', seed: 48213 }), me2 = g2.me(), a0 = [me2.x, me2.z];
      g2.step(40, { mx: 1 });
      const free = Math.hypot(me2.x - a0[0], me2.z - a0[1]);
      console.log(`      strapped: ${moved.toFixed(3)} m in 120 ticks of keys, footing ${footingOf(s, s.player.id).mode}; unstrapped: ${free.toFixed(3)} m in 40`);
      assert(moved < 1e-6 && me.strapped === 'rack' && free > 0.1, JSON.stringify({ moved, free }));
    },
  },
  {
    name: 'CR6: the URL\'s &grav= is added to the scene\'s profile (test-burn keeps its burn with a jink added), and main.js sets it so',
    fn() {
      const g = createGame({ scenario: 'test-burn', seed: 48213 }), before = profileOf(g.state);
      addProfile(g.state, parseGrav('jink:0.3@200s!'));
      const after = profileOf(g.state);
      console.log(`      before: ${before.map(e => `${e.kind}@${e.atS}`).join(', ')}; after: ${after.map(e => `${e.kind}@${e.atS}${e.surprise ? '!' : ''}`).join(', ')}`);
      assert(after.length === before.length + 1 && after.some(e => e.kind === 'burn') && after.at(-1).kind === 'jink' && after.at(-1).atS === 200, JSON.stringify(after));
      const main = readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
      assert(/addProfile\(s, gravList\)/.test(main) && !/setProfile\(s, gravList\)/.test(main), 'main.js sets the URL\'s profile with addProfile');
    },
  },
  {
    name: 'CR3: a bubble\'s size is kept by its text and equals its drawn balloon\'s; its pages are kept by their text; placeBubbles places by the size, drawing nothing',
    fn() {
      const t = 'Station four: the gap between the plates. Wedge in. Twenty metres.';
      const z = balloonSize(t), b = balloonPixels(t);
      assert(balloonSize(t) === z && bubblePages(t) === bubblePages(t) && z.w === b.w && z.h === b.h, JSON.stringify({ z, b: { w: b.w, h: b.h } }));
      const { placed } = placeBubbles([{ who: 'a', text: 'Up.', fromMs: 0 }], { headOf: () => ({ x: 100, y: 100, w: 10, h: 6 }), bounds: { x: 0, y: 0, w: 400, h: 300 } });
      assert(placed.length === 1 && !('data' in placed[0].pix), JSON.stringify(placed[0]?.pix ?? null));
    },
  },
  {
    name: 'M3, L6, CR3: the frame places the bubbles after every other part of the HUD is written (the hit card, the radio box, the line), so they keep off what the frame shows and the HUD\'s read is the frame\'s one layout; the HUD\'s rectangles grown to whole picture pixels',
    fn() {
      // (v0.0.26's carried stage: the frame's keep-off call is plateKeepOff (the house's houseKeepOff inside it, the plates off the HUD
      // elsewhere), so the frame's body is read from it; the order asserted is unchanged)
      const main = readFileSync(path.join(root, 'src', 'main.js'), 'utf8'), body = main.slice(main.indexOf('plateKeepOff(s, { hidden: inSplash });'), main.indexOf('report.hud = {'));
      const at = (re) => body.search(re), order = { weaponHud: at(/weaponHud\(s, alpha/), hitHud: at(/hitHud\(s, \{/), radio: at(/radio\.update\(\{/), line: at(/instinct\.update\(\{/), bubbles: at(/speakerHud\(s, \{/) };
      console.log(`      the frame's order: ${Object.entries(order).sort((a, b) => a[1] - b[1]).map(([k]) => k).join(' → ')}`);
      assert(Object.values(order).every(i => i >= 0) && order.bubbles > Math.max(order.weaponHud, order.hitHud, order.radio, order.line), JSON.stringify(order));
      assert(/const toPic = \(q\) => \{ const x0 = Math\.floor\(\(q\.left - ox\) \/ k\)/.test(main), 'speakerHud grows the HUD\'s rectangles to whole picture pixels');
    },
  },
  {
    name: 'L2: no widow page: "Station four: … Wedge in. Twenty metres." pages two rows and two, never "metres." alone; a short line one page',
    fn() {
      const lines = ['Station four: the gap between the plates. Wedge in. Twenty metres.', 'Station four. Into the gap between the plates and wedge yourself. Back on one, boots on the other. Twenty metres.', 'Up.'];
      for (const t of lines) {
        const P = bubblePages(t);
        console.log(`      ${P.map(p => `[${p.rows.join(' / ')}]`).join(' ')}`);
        assert(Math.abs(P.reduce((a, p) => a + p.share, 0) - 1) < 1e-9 && P.every(p => p.rows.length <= BUBBLE_ROWS), JSON.stringify(P));
        if (P.length > 1) assert(P.at(-1).rows.length >= 2, `a widow: ${JSON.stringify(P.map(p => p.rows))}`);
      }
    },
  },
  {
    name: 'L1: Well A\'s panel at the first station\'s standby waits for the cadre, never the tower (Well A has none)',
    fn() {
      const g = createGame({ scenario: 'test-anchors', seed: 48213, tier: 'private' }), bot = anchorsBot({ mode: 'keys' });
      let seen = null;
      for (let n = 0; n < 900 && !seen; n++) {
        const s = g.state, me = g.me(); g.step(1, bot(s, me, (me.bot ??= {})));
        if (g.state.stop?.mode === 'stop' && anchorsNow(g.state).phase === 'standby') seen = { pick: g.state.stop.pick ?? null, rows: stepsOf(g.state).map(x => x.label) };
      }
      console.log(`      at the standby: pick ${seen?.pick ?? 'none'}; rows ${seen?.rows?.join(' | ')}`);
      assert(seen && !seen.rows.some(l => /tower/.test(l)) && seen.rows.some(l => l === 'Wait for the cadre'), JSON.stringify(seen));
    },
  },
  {
    name: 'L3 and L4: the burn\'s card says when you were first secured and how you were secured at the drive\'s lighting as two; the clock box names Well A once',
    fn() {
      const bn = { summary: 'x', secured: { atMs: 1, how: 'strapped', inMs: 0 }, warn: { atMs: 1 }, onset: null, jink: null, jinks: 0 };
      const line = burnSaid(bn, { fmtS: (ms) => `${(ms / 1000).toFixed(1)} s` })[1];
      console.log(`      "${line}"`);
      assert(/^Secured 0\.0 s after the warning; when the drive lit, strapped in your rack$/.test(line), line);
      const g = createGame({ scenario: 'test-anchors', seed: 48213, tier: 'private' }), pl = placeLine(g.state);
      console.log(`      the place line in Well A: "${pl}"`);
      assert(pl && (pl.match(/Well A/g) ?? []).length === 1, pl);
    },
  },
  {
    name: 'M4: the To score page holds no rated set among its waiting rows, folds the rated ones (wcard2, opfor-look among them), and every set the gallery has waiting has a row (the user, 2026-11-19: "place the already rated picks in a hidden drop down section at the bottom")',
    fn() {
      const index = JSON.parse(readFileSync(path.join(root, 'samples', 'index.json'), 'utf8'));
      const waiting = toScore(index).map(r => r.id), cardSets = { 'card.gun': 'portrait-gun', 'card.unread': 'portrait-gun', 'card.aim': 'portrait-pose', 'card.pistol': 'portrait-pose', stack: 'house-stack-figures', shot: 'audio', helm: 'helmets', walk: 'walk', jamb: 'marks' };
      const top = ROWS.filter(r => !ratedRow(r)), folded = ROWS.filter(ratedRow);
      const setsOf = (rows) => rows.flatMap(r => (r.seen ? [...r.ids] : cardSets[r.id] ? [cardSets[r.id]] : []));
      const ratedOnTop = setsOf(top).filter(id => RATED_SETS.includes(id)), noRow = waiting.filter(id => !setsOf(top).includes(id));
      console.log(`      on top: ${setsOf(top).join(', ')}; folded: ${setsOf(folded).join(', ')}; rated on top: ${ratedOnTop.join(', ') || 'none'}; waiting with no row: ${noRow.join(', ') || 'none'}`);
      assert(!ratedOnTop.length && !noRow.length && ['wcard2', 'opfor-look'].every(id => setsOf(folded).includes(id)), JSON.stringify({ ratedOnTop, noRow }));
    },
  },
  {
    name: 'L8: the gallery\'s "Copy my picks" with nothing new toasts what it found and copies nothing (it said "Copied: paste it in the conversation" over "No picks yet.")',
    fn() {
      const html = readFileSync(path.join(root, 'samples', 'index.html'), 'utf8');
      const m = /getElementById\('copy'\)\.onclick = async \(\) => \{([\s\S]*?)\n  \};/.exec(html);
      assert(m && /if \(\/\^No \/\.test\(text\)\) \{ toast\(text\); return; \}/.test(m[1]) && m[1].indexOf('{ toast(text); return; }') < m[1].lastIndexOf('Copied: paste'), m?.[1] ?? 'no copy handler');
    },
  },
];
