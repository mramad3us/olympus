// The R menu's model (quick): src/ui/cards/actions.js fed a handMenu and a planChain, in node (the build sheet 0.0.6
// §5.3's ui-menu). The user, 2026-11-06: "long pressing R should open the menu with all the possible interractions
// as single actions, with the ability to select several actions (not pre-combined actions like you do now that
// make lists hard to read)". Part one feeds fixtures of handMenu's and planChain's shapes (the sheet §2.1), so it is
// the card's rule under test: its rows (solo where a row is done alone), the foot (the total and the end of what is
// checked, or of the cursor's row; amber with the late's words when late), what it sends (Enter with nothing
// checked does the cursor's row; one row the single, as v0.0.5 sent R's choices, with its lead; three one chain in
// the menu's order; a drop-down's pick lands in args; the wait and a door as R's own hand), the late card's view of
// a chain ("fit it in" the leading whole steps, never one shortened), and the card's pixels and words. Part two
// reads the real game: seed 48213's barracks at 19:30, the player put at Head A's first sink (a debug move), places'
// handMenu there and TIME's planChain of brush teeth, shave and wash face, the card's foot and what it would send.
// Prints the card as the player reads it.
import { assert } from './helpers.mjs';
import { createList } from '../src/ui/kit/list.js';
import { menuRows, planFor, footOf, sendOf, lateView, cardPixels, cardText, SOLO } from '../src/ui/cards/actions.js';
import { asText } from '../src/ui/kit/pixels.js';
import { createGame, playerActor } from './game.mjs';
import { handMenu, handOffer } from '../src/sim/places/hand.js';
import { planChain } from '../src/sim/time/chain.js';
import { areaOf, openingState } from '../src/sim/places/model.js';
import { spotsOf } from '../src/sim/places/fixtures.js';
import { marsClock } from '../src/core/calendar.js';
import { siteLonEDeg } from '../src/sim/jobs.js';

const SPOT = 'f:e1:head-2a:sinks-1#1';
const clock = (ms) => `${String(Math.floor(ms / 3_600_000) % 24).padStart(2, '0')}:${String(Math.floor(ms / 60_000) % 60).padStart(2, '0')}`;
const T0 = 19 * 3_600_000 + 31 * 60_000;
const row = (key, words, durMs, more = {}) => ({ key, id: key, verb: 'activity', spotId: SPOT, fixtureId: 'f:e1:head-2a:sinks-1', words, args: {}, durMs, label: `${words} · ${durMs < 60_000 ? `${durMs / 1000} s` : `${durMs / 60_000} min`}`, late: null, off: null, choices: null, pick: null, ...more });
const SINK = { title: 'The sink', spotId: SPOT, fixtureId: 'f:e1:head-2a:sinks-1', quick: 'shave', rows: [
  row('wash-hands', 'wash hands', 30_000), row('teeth', 'brush teeth', 120_000), row('shave', 'shave', 240_000),
  row('clip', 'buzz your head', 600_000, { off: 'buzzed today' }), row('wash-face', 'wash face', 60_000), row('drink', 'drink', 30_000),
  { key: 'door', id: null, verb: 'open', target: 'o:e1:head-2a', words: 'open the door', args: {}, durMs: 0, label: 'open the door', late: null, off: null, choices: null, pick: null },
  { key: 'wait', id: 'wait', verb: 'wait', words: 'wait', args: {}, durMs: 900_000, label: 'wait 15 min', late: null, off: null, choices: null, pick: null },
] };
// (planChain's shape over the fixture: each step from the end of the one before, the late's when the end passes LEAVE)
const LEAVE = T0 + 6 * 60_000;
function fakeChain(steps, { late = false } = {}) {
  let from = T0;
  const out = steps.map(s => { const r = SINK.rows.find(x => x.id === s.id); const st = { id: s.id, args: s.args, fromMs: from, toMs: from + r.durMs, durMs: r.durMs, off: r.off }; from = st.toMs; return st; });
  const endMs = from, durMs = endMs - T0;
  return { ok: true, why: null, steps: out, durMs, endMs, label: `${steps.map(s => s.id).join(', ')} · ${durMs / 60_000} min`, kind: 'outcome', late: late && endMs > LEAVE ? { block: true, dueMs: LEAVE + 60_000, walkMs: 60_000, endMs, fitMs: LEAVE - T0, label: 'the count at your rack, 19:38' } : null };
}

export default [
  {
    name: 'the card from a fed handMenu: its rows in order (a door, the wait and a resume solo), the cursor on R\'s quick action, the foot the cursor\'s row with nothing checked, then the total and the end of what is checked; the card\'s words and pixels',
    fn() {
      const rows = menuRows(SINK), L = createList({ rows, cursor: SINK.quick, title: SINK.title });
      assert(rows.map(r => r.key).join() === SINK.rows.map(r => r.key).join() && rows.filter(r => r.solo).map(r => r.key).join() === 'door,wait' && SOLO.includes('wait'), JSON.stringify(rows.map(r => [r.key, r.solo])));
      assert(L.rows[L.cursor].key === 'shave', 'the cursor on the quick row');
      const p0 = planFor(SINK, L, { planChain: (s) => fakeChain(s), nowMs: T0 }), f0 = footOf(p0, { clockText: clock, menu: SINK, list: L });
      assert(p0.single && p0.durMs === 240_000 && f0.text === 'total 4 min · done 19:35' && !f0.late, JSON.stringify(f0));
      L.key('Digit2'); L.key('Digit3'); L.key('Digit5');
      const p1 = planFor(SINK, L, { planChain: (s) => fakeChain(s), nowMs: T0 }), f1 = footOf(p1, { clockText: clock });
      L.setFoot(f1.text, f1);
      console.log(`      the card, three checked:\n${cardText(L).split('\n').map(x => `        ${x}`).join('\n')}`);
      assert(!p1.single && p1.durMs === 420_000 && f1.text === 'total 7 min · done 19:38' && p1.steps.map(s => s.id).join() === 'teeth,shave,wash-face', JSON.stringify(f1));
      const pm = cardPixels(L), art = asText(pm);
      console.log(`      its pixels, ${pm.w} × ${pm.h}: the title plate's first rows\n${art.slice(6, 12).map(r => `        ${r.slice(0, 70)}`).join('\n')}`);
      assert(pm.w === L.layout().w && pm.h === L.layout().h && art.join('').includes('c') && art.join('').includes('#'), 'the card drawn');
      assert(/\[x\] BRUSH TEETH · 2 MIN/.test(cardText(L)) && /\[-\] BUZZ YOUR HEAD \(BUZZED TODAY\)/.test(cardText(L)), cardText(L));
    },
  },
  {
    name: 'what it sends: Enter with nothing checked the cursor\'s row as the single (an activity with its lead); three checked one chain in the menu\'s order; the wait as time\'s activity and a door as R\'s hand with its target; a drop-down\'s pick in args; nothing for a struck row',
    fn() {
      const L = createList({ rows: menuRows(SINK), cursor: 'wash-hands' });
      const one = sendOf(SINK, L.chosen());
      assert(one.act === 'activity' && one.args.id === 'wash-hands' && one.args.spotId === SPOT && one.args.lead === true, JSON.stringify(one));
      // (checked out of order: the chain in the menu's)
      for (const d of ['Digit5', 'Digit3', 'Digit2']) L.key(d);
      const chain = sendOf(SINK, L.chosen());
      assert(chain.act === 'chain' && chain.args.spotId === SPOT && chain.args.steps.map(s => s.id).join() === 'teeth,shave,wash-face', JSON.stringify(chain));
      const W = createList({ rows: menuRows(SINK), cursor: 'wait' }), D = createList({ rows: menuRows(SINK), cursor: 'door' });
      const wait = sendOf(SINK, W.chosen()), door = sendOf(SINK, D.chosen()), lateWait = sendOf(SINK, W.chosen(), { late: 'accepted' });
      assert(wait.act === 'activity' && wait.args.id === 'wait' && door.act === 'hand' && door.args.want === 'door' && door.args.from === 'menu' && door.args.target === 'o:e1:head-2a' && lateWait.act === 'activity' && lateWait.args.late === 'accepted', JSON.stringify({ wait, door, lateWait }));
      const X = createList({ rows: menuRows(SINK), cursor: 'clip' });
      assert(sendOf(SINK, X.chosen()) === null, 'a struck row sends nothing');
      // (a rack's sleep with its drop-down: the pick lands in args)
      const RACK = { title: 'Your rack', spotId: 'f:e1:bay-2-1:rack-n1#1', quick: 'sleep', rows: [{ key: 'sleep', id: 'sleep', verb: 'activity', spotId: 'f:e1:bay-2-1:rack-n1#1', words: 'sleep', pick: 0, choices: [
        { key: 'reveille', words: 'until reveille', args: { until: 'reveille' }, durMs: 27_000_000, label: 'sleep until reveille · 7 h 30 min, done 05:30' },
        { key: '2h', words: '2 h', args: { forMs: 7_200_000 }, durMs: 7_200_000, label: 'sleep 2 h · 2 h, done 00:00' }] }] };
      const R = createList({ rows: menuRows(RACK), cursor: 'sleep' });
      R.key('KeyD');
      const sleep = sendOf(RACK, R.chosen());
      assert(sleep.act === 'activity' && sleep.args.args.forMs === 7_200_000 && sleep.args.lead, JSON.stringify(sleep));
      console.log(`      Enter on wash hands: ${JSON.stringify(one)}\n      three checked (5, 3, 2): ${JSON.stringify(chain)}\n      the wait: ${JSON.stringify(wait)}; a door: ${JSON.stringify(door)}; the sleep picked 2 h: ${JSON.stringify(sleep.args.args)}`);
    },
  },
  {
    name: 'a plan that would make you late: the foot in amber with the late\'s words; the late card\'s view of a chain fits the leading whole steps (brush teeth, shave: 6 min) and never shortens one; a single as v0.0.5 (its least)',
    fn() {
      const L = createList({ rows: menuRows(SINK), cursor: 'teeth' });
      for (const d of ['Digit2', 'Digit3', 'Digit5']) L.key(d);
      const p = planFor(SINK, L, { planChain: (s) => fakeChain(s, { late: true }), nowMs: T0 }), f = footOf(p, { clockText: clock });
      assert(f.late && f.sub === 'late: the count at your rack, 19:38' && f.text === 'total 7 min · done 19:38', JSON.stringify(f));
      const v = lateView(SINK, L, p);
      console.log(`      the foot: '${f.text}' / '${f.sub}' (amber); the late card: '${v.what.label}', ${v.what.durMs / 60_000} min, fit it in ${v.late.fitMs / 60_000} min of the ${p.late.fitMs / 60_000} before you must leave`);
      assert(v.what.label === 'brush teeth, shave, wash face' && v.late.fitMs === 360_000 && v.what.min === 0, JSON.stringify(v));
      const one = createList({ rows: menuRows(SINK), cursor: 'shave' }), p1 = { ...planFor(SINK, one, { nowMs: T0 }), late: { label: 'the count', fitMs: 100_000, endMs: T0 + 240_000 } };
      const v1 = lateView(SINK, one, p1);
      assert(v1.what.id === 'shave' && v1.what.label === 'shave' && v1.late.fitMs === 100_000, JSON.stringify(v1));
      const L2 = createList({ rows: menuRows(SINK), cursor: 'teeth' });
      for (const d of ['Digit3', 'Digit5']) L2.key(d);
      const p2 = planFor(SINK, L2, { planChain: (s) => ({ ...fakeChain(s), late: { label: 'the count', fitMs: 60_000, endMs: T0 + 300_000 } }), nowMs: T0 });
      assert(lateView(SINK, L2, p2).late.fitMs === 0, 'no leading step fits: nothing to fit');
    },
  },
  {
    name: 'the real menu at Head A\'s first sink (seed 48213, 19:30): places\' handMenu\'s rows and quick row, TIME\'s planChain of brush teeth, shave and wash face, the foot, and the one chain the card would send',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: 48213, hour: 19.5 });
      const area = areaOf('melas.echo.1'), fx = area.fixtures.find(f => SPOT.startsWith(`${f.id}#`)), sp = spotsOf(fx).find(p => p.id === SPOT);
      g.step(1, { act: [`debug:go:melas.echo.1:${sp.x}:${sp.z}:${sp.face ?? 'up'}`] });
      g.step(5);
      const s = g.state, me = playerActor(s), menu = handMenu(s), offer = handOffer(s);
      assert(menu && Math.hypot(me.x - sp.x, me.z - sp.z) < 0.3, JSON.stringify({ me: [me.x, me.z], sp: [sp.x, sp.z], menu }));
      const lon = siteLonEDeg(s), txt = (ms) => { const c = marsClock(ms, lon); return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`; };
      const L = createList({ rows: menuRows(menu), cursor: menu.quick, title: menu.title });
      console.log(`      R's plate: '${offer?.label}' (why ${offer?.why}, ${offer?.rows} rows); the menu '${menu.title}', quick '${menu.quick}':`);
      const want = ['teeth', 'shave', 'wash-face'].filter(id => L.rows.some(r => r.key === id && !L.now(L.rows.findIndex(x => x.key === id)).off));
      for (const id of want) L.key(`Digit${L.rows.findIndex(r => r.key === id) + 1}`);
      const plan = planFor(menu, L, { planChain: (steps) => planChain(s, { spotId: menu.spotId, steps }), nowMs: s.clock.ms }), f = footOf(plan, { clockText: txt });
      L.setFoot(f.text, f);
      console.log(cardText(L).split('\n').map(x => `        ${x}`).join('\n'));
      const send = sendOf(menu, L.chosen());
      console.log(`      sends ${JSON.stringify(send)}; the plan ${plan.ok ? `${plan.steps.map(x => `${x.id} ${(x.toMs - x.fromMs) / 1000} s`).join(', ')}` : `refused: ${plan.why}`}`);
      assert(menu.title === 'The sink' && menu.rows.some(r => r.id === 'wash-hands') && menu.rows.some(r => r.id === 'drink') && !menu.rows.some(r => r.id === 'basin'), JSON.stringify(menu.rows.map(r => r.id)));
      assert(menu.rows.every(r => r.verb !== 'activity' || r.choices || typeof r.label === 'string'), 'every row priced');
      if (want.length >= 2) assert(send.act === 'chain' && send.args.steps.map(x => x.id).join() === want.join() && plan.ok && plan.steps.length === want.length, JSON.stringify({ send, plan }));
    },
  },
  {
    name: 'the menu\'s wait and door rows do what they say where R\'s quick action is something else (the fixer\'s, 0.0.6: both went nowhere): at Head A\'s sink at 14:00 the wait starts a 15-minute skip, and by the lounge\'s vending machine the door row closes the lounge\'s door',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: 48213, hour: 14 });
      const area = areaOf('melas.echo.1'), fx = area.fixtures.find(f => SPOT.startsWith(`${f.id}#`)), sp = spotsOf(fx).find(p => p.id === SPOT);
      g.step(1, { act: [`debug:go:melas.echo.1:${sp.x}:${sp.z}:${sp.face ?? 'up'}`] });
      g.step(5);
      g.state.people[g.state.player.id].body.hands = { dirt: 55, why: 'head' };       // (dirty: R washes them, the wait a row of its own)
      const menu = handMenu(g.state), offer = handOffer(g.state);
      const W = createList({ rows: menuRows(menu), cursor: 'wait' }), send = sendOf(menu, W.chosen());
      const t0 = g.state.clock.ms, n0 = g.facts('skip-end').length;
      g.step(1, { act: [send] });
      g.step(1);
      const ends = g.facts('skip-end').slice(n0), dtMin = (g.state.clock.ms - t0) / 60_000;
      console.log(`      at the sink, R's plate '${offer.label}' (${offer.verb}); the menu's wait sends ${JSON.stringify(send)}: ${ends.map(e => `${e.activity} ${(e.toMs - e.fromMs) / 60_000} min`).join(', ') || 'nothing'}, the clock +${dtMin.toFixed(2)} min`);
      assert(offer.verb !== 'wait' && ends.length === 1 && ends[0].activity === 'wait' && ends[0].toMs - ends[0].fromMs === 900_000, JSON.stringify({ offer: offer.label, ends: ends.map(e => [e.activity, e.toMs - e.fromMs]), dtMin }));
      // (the lounge's vending machine, its door at hand: R is the drink, the door row turns the door)
      const h = createGame({ scenario: 'barracks', seed: 48213, hour: 14 });
      h.step(1, { act: ['debug:go:melas.echo.1:76.18:11:up'] });
      h.step(5);
      const m2 = handMenu(h.state), o2 = handOffer(h.state), D = 'o:e1:lounge-2', before = openingState(h.state, D);
      const dRow = m2?.rows.find(r => r.key === 'door');
      assert(dRow && dRow.target === D && o2.verb === 'activity', JSON.stringify({ rows: m2?.rows.map(r => [r.key, r.target ?? null]), offer: o2?.label }));
      const L = createList({ rows: menuRows(m2), cursor: 'door' }), s2 = sendOf(m2, L.chosen());
      h.step(1, { act: [s2] });
      h.step(40);
      const after = openingState(h.state, D);
      console.log(`      by the vending machine, R's plate '${o2.label}'; the door row sends ${JSON.stringify(s2)}: ${D} ${before} to ${after}`);
      assert(before !== after, JSON.stringify({ before, after }));
    },
  },
];
