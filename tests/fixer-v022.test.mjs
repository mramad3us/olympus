// OLYMPUS tests: v0.0.22's fixer, the play review's and the code review's findings of 2026-11-17, each case failing without its fix.
//
// The picker's every choice reaches the lane (boot.js pickedScene: House B was lit and lane A played); a named house says its letter
// on the card, in the goal and from the tower, and a drawn house's brief no longer claims "a lane you have not seen"; your #2 calls
// "Clear!" once a room, before your "Room clear!"; the casualty's lesson names the pistol only from rung 2, where the DI's line
// does; the card names a room whose role-player fired first unanswered; "Again" keeps a drawn house's room set and the plans' source;
// one rule for the casualty's wash; the hunt's live-lane lines baked up front; a live lane's other house dropped with words; the
// frag's men counted, the contact's next row its own sentence; a burst's cease fire leads the verdict; your #2 ends a finishing
// stack-up on your cue (F25 on the kit's mixed loadout); no comment points at the deleted house-two.js. Pure and quick but the
// cases that play lanes, which are heavy.
import { assert } from './helpers.mjs';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseBot } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { endWatch } from './flawless-end.mjs';
import { pickedScene } from '../src/ui/boot.js';
import { pickerPage } from '../src/ui/cards/pairs.js';
import { againHouseOf } from '../src/ui/cards/house.js';
import { houseChoice } from '../src/core/debug.js';
import * as COURSES_DATA from '../src/data/courses.js';
import { SCENES } from '../src/data/scenes.js';
import { seqOf } from '../src/sim/scenarios/handling.js';
import { laneNameOf, runSheetOf, houseVerdict } from '../src/sim/scenarios/shoothouse.js';
import { menWords } from '../src/sim/scenarios/house-kit.js';
import { RULES } from '../src/sim/skills/instinct.js';
import { entry } from './cqb-gauges.mjs';

const { HOUSE_CHIEF } = COURSES_DATA;
// (a stand-in for the page's elements, as house-picker's)
class El {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.childNodes = []; this.dataset = {}; this.cls = new Set(); this.on = {}; this.textContent = ''; this.disabled = false; this.style = {}; }
  get className() { return [...this.cls].join(' '); }
  set className(v) { this.cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get classList() { const c = this.cls; return { add: (x) => c.add(x), remove: (x) => c.delete(x), contains: (x) => c.has(x), toggle: (x, f = !c.has(x)) => (f ? c.add(x) : c.delete(x), f) }; }
  get firstChild() { return this.childNodes[0] ?? null; }
  append(...k) { this.childNodes.push(...k); }
  replaceChildren(...k) { this.childNodes = [...k]; }
  addEventListener(t, f) { (this.on[t] ??= []).push(f); }
  click() { this.onclick?.(); }
  focus() {}
  key(code) { const e = { code, preventDefault() {}, stopPropagation() {} }; for (const f of this.on.keydown ?? []) f(e); }
}
const withDoc = (fn) => { const was = globalThis.document; globalThis.document = { createElement: (t) => new El(t) }; try { return fn(); } finally { globalThis.document = was; } };
const houseOf = (g) => g.state.armoury.range.house;
// (a lane played to its card with every say event kept: [{ t, who: 'me' | 'two' | other, text, call, cur }])
function sayLane(opts, bot) {
  const g = createGame({ scenario: 'test-shoothouse', ...opts }), w = endWatch(g), pid = g.state.player.id, twoPid = houseOf(g).twoPid, says = [];
  const r = runHouse(g, bot, { each: (game) => { w.each(game); const H = houseOf(game); for (const [type, e] of game.bus.events) if (type === 'say') says.push({ t: game.state.clock.ms, who: e.who === pid ? 'me' : e.who === twoPid ? 'two' : e.who, text: e.text, call: e.call ?? null, cur: H.cur }); }, maxMs: 20 * 60_000 });
  return { g, r, says, rec: w.rec() };
}

export default [
  {
    name: 'the picker\'s House B, and the drawn house\'s rooms, reach the lane: boot.js passes every choice the pick carries (the play review of 2026-11-17: B lit, "Lane A at 1 G…" played, boot.js passing only par, loadout, draw and qual)',
    fn() {
      const picks = [], scene = { ...SCENES['test-shoothouse'], draws: ['set', 'drawn'], layouts: ['A', 'B', 'C'], rooms: ['a', 'all'] };
      const P = withDoc(() => pickerPage({ scene, sheets: { private: { label: 'Private', wf: 15 }, sgt: { label: 'Sergeant', wf: 30 } }, onPick: (tier, o) => picks.push(pickedScene(tier, o)),
        layouts: { A: 'A', B: 'Wn280pc.Os195lc.Tn165pc', C: 'Qn290pc.Ds205lc.En175pc' }, roomSets: { a: ['C', 'K', 'E'], all: [] }, roomsDefault: 'a' }));
      P.draws[1].click(); P.buttons[1].click();                                   // (B, the sergeant)
      P.body.key('KeyH'); P.body.key('KeyH'); P.body.key('KeyR'); P.buttons[0].click(); // (drawn, all eight)
      console.log(`      playScene gets ${JSON.stringify(picks)}`);
      assert(picks[0]?.layout === 'B' && picks[0].tier === 'sgt' && picks[1]?.draw === 'drawn' && picks[1].rooms === 'all', JSON.stringify(picks));
      const src = readFileSync(join(root, 'src/ui/boot.js'), 'utf8');
      assert(/onPick: \(tier, o = \{\}\) => cb\.playScene\?\.\(scene, pickedScene\(tier, o\)\)/.test(src), 'boot.js showPicker does not start the pick through pickedScene');
    },
  },
  {
    name: 'a named house says its letter everywhere: the goal "Lane B at 1 G", the card "LANE B", the tower\'s brief and standby "lane B"; a drawn house\'s brief no longer says "a lane you have not seen" (the play review: "NEW LAYOUT", "A new layout at 1 G" and "The panels are moved: a lane you have not seen." over lane B, the last also on Again)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'recruit', layout: 'B', setup: 'go' }), R = g.state.armoury.range;
      const seq = seqOf(R), brief = seq.find(c => c.id === 'brief').say, standby = seq.find(c => c.id === 'standby').say, card = runSheetOf(g.state).card;
      const d = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'recruit', draw: 'drawn', setup: 'go' }), dBrief = seqOf(d.state.armoury.range).find(c => c.id === 'brief').say;
      console.log(`      lane B: "${laneNameOf(g.state)}", the card "${card.split(' · ').slice(0, 3).join(' · ')}…", the brief "${brief[1].slice(0, 40)}…", standby ${JSON.stringify(standby)}; a drawn house "${laneNameOf(d.state)}", its brief "${dBrief[1].slice(0, 60)}…"`);
      assert(laneNameOf(g.state) === 'Lane B' && /\bLANE B\b/.test(card) && !/NEW LAYOUT/.test(card) && brief.every(t => /lane B\b|Lane B\b/.test(t) && !/lane A\b|Lane A\b/.test(t)) && standby.includes('Lane B. Standby.'), JSON.stringify({ name: laneNameOf(g.state), card, brief, standby }));
      assert(laneNameOf(d.state) === 'A new layout' && !dBrief.some(t => /not seen/.test(t)), JSON.stringify(dBrief));
    },
  },
  {
    name: 'your #2 calls "Clear!" once a room, his before your "Room clear!": the corporal\'s breach lane on 67 over the eight rooms by T (the echo with his own call 0.55 s after it), the keys recruit on 7 (a second "Clear!" after "Covering!" and "Up.") (the play review: 12 of 690 lanes, 22 of 709 rooms out of order)',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      const lanes = [
        [{ tier: 'cpl', seed: 67, rooms: 'all', loadout: 'breach' }, () => houseKitBot({ use: 'breach', base: 'T' }), 'cpl 67 breach T'],
        [{ tier: 'recruit', seed: 7 }, () => houseBot({ mode: 'keys' }), 'recruit 7 keys'],
        [{ tier: 'recruit', seed: 48213, loadout: 'flash' }, () => houseBot({ mode: 'keys' }), 'recruit 48213 flash keys'],
      ];
      const bad = [];
      for (const [o, bot, name] of lanes) {
        const { r, says, rec } = sayLane(o, bot());
        const twice = Object.entries(rec.twoClears).filter(([, n]) => n > 1);
        // (his "Clear!" after your "Room clear!" of the same room: out of order)
        const late = says.filter(s => s.who === 'me' && s.call === 'roomclear').filter(rc => says.some(s => s.who === 'two' && s.text === 'Clear!' && s.t > rc.t && s.t - rc.t < 3000 && !says.some(x => x.who === 'me' && x.call === 'clear' && x.t > rc.t && x.t < s.t)));
        console.log(`      ${name}: ${r.done ? 'to the card' : 'NOT done'}; his "Clear!" a leg ${JSON.stringify(rec.twoClears)}; "Room clear!" before his "Clear!" ${late.length}`);
        if (!r.done || twice.length || late.length) bad.push({ name, twice, late: late.map(x => x.t) });
      }
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'the casualty\'s lesson names the pistol only where the DI\'s line did: the private on 48213 (layout C, live, keys) heard "Tap, rack, back on." at the click and is not taught "a click means the pistol"; the sergeant\'s click on seed 1 live by T still is (the play review: casualty:click below rung 2)',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      const one = (o, bot) => { const g = createGame({ scenario: 'test-shoothouse', ...o }); runHouse(g, bot, { maxMs: 20 * 60_000 }); return { key: runSheetOf(g.state).one?.key ?? null, end: houseOf(g).end?.why }; };
      const priv = one({ tier: 'private', seed: 48213, layout: 'C', opfor: 'live' }, houseBot({ mode: 'keys' })), sgt = one({ tier: 'sgt', seed: 1, opfor: 'live:fight,hide' }, houseBot({ mode: 'T' }));
      // (the sergeant's lane re-pointed from 48213 to seed 1 at v0.0.23's integration: v0.0.23 D's sterile check (DC3, the instructor's
      // look on the floor before LOAD, 140 ticks more of the brief) moves the live lane on 48213 so its fatal strike follows no click
      // ('casualty', the card's cause unchanged); seed 1 is the first of seeds 1 to 40 whose sergeant by T dies after his click there
      // ('casualty:click'), so the case still holds the rule from rung 2. The private's half still fails without the fix: with the
      // rung's floor taken off casualtyCause his lane on 48213 is 'casualty:click')
      console.log(`      the private: ${JSON.stringify(priv)}; the sergeant: ${JSON.stringify(sgt)}`);
      assert(priv.end === 'casualty' && priv.key !== 'casualty:click' && sgt.end === 'casualty' && sgt.key === 'casualty:click', JSON.stringify({ priv, sgt }));
    },
  },
  {
    name: 'on a casualty the card\'s FIRED FIRST names the room whose role-player fired and was never answered: the private by T on 48213, live, "ROOM 2" (the play review: "FIRED FIRST ON YOU: ROOM 1", room 2 left out, on 30 of 50 casualty lanes)',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', opfor: 'live' });
      runHouse(g, houseBot({ mode: 'T' }), { maxMs: 20 * 60_000 });
      const card = runSheetOf(g.state).card, first = /FIRED FIRST ON YOU: ([^·]+)/.exec(card)?.[1]?.trim() ?? '';
      console.log(`      ${houseOf(g).end?.why}: "${card.slice(0, 120)}…"; fired first: ${first}`);
      assert(houseOf(g).end?.why === 'casualty' && /ROOM 2/.test(first), card);
    },
  },
  {
    name: '"Again" keeps a drawn house\'s room set and the plans\' source: the same seed passes the eight rooms with the code, so "Again with a new seed" after it draws from the eight again, and &plans=derived replays on its own plans (the reviews: the third lane drawn from the three; plans dropped by Again, Again as and from)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 67, tier: 'sgt', rooms: 'all', setup: 'go' }), D = houseOf(g).draw;
      const same = againHouseOf({ same: true, code: D.code, rooms: D.rooms ?? null }), opts = houseChoice(same, { roomsDefault: 'a' });
      const g2 = createGame({ scenario: 'test-shoothouse', seed: 67, tier: 'sgt', setup: 'go', draw: same.draw, house: same.house, pool: same.pool ?? null }), D2 = houseOf(g2).draw;
      const next = againHouseOf({ same: false, code: D2.code, rooms: D2.rooms ?? null }), plans = [againHouseOf({ same: true, plans: 'derived' }), againHouseOf({ same: false, plans: 'derived' }), againHouseOf({ same: false, code: D.code, rooms: 'all', plans: 'derived' })];
      console.log(`      the first ${JSON.stringify(D)}; the same seed's pick ${JSON.stringify(same)} → ${JSON.stringify(opts)}; its record ${JSON.stringify(D2)}; then a new seed ${JSON.stringify(next)}; the plans kept ${JSON.stringify(plans)}`);
      assert(D.rooms === 'all' && opts.opts.rooms === 'all' && !opts.dropped.length && D2.code === D.code && D2.rooms === 'all' && next.rooms === 'all' && plans.every(p => p.plans === 'derived'), JSON.stringify({ D, same, opts, D2, next, plans }));
    },
  },
  {
    name: 'one rule for the casualty\'s wash: "Weapons clear. Into the booth: hot wash." (the wash\'s sayEnd), the casualty sequences and "The lane is closed." gone (the code review: two rules for one line, the second never said)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', opfor: 'live', setup: 'go' }), R = g.state.armoury.range;
      R.house.end = { why: 'casualty', atMs: g.state.clock.ms };
      const wash = seqOf(R).find(c => c.id === 'wash'), src = readFileSync(join(root, 'src/data/courses.js'), 'utf8');
      console.log(`      the casualty's wash: ${JSON.stringify(wash.sayEnd.other)}; exported casualty sequences ${['SEQ_HOUSE_CASUALTY', 'SEQ_HOUSE_DRAWN_CASUALTY'].filter(k => k in COURSES_DATA).length}`);
      assert(!('SEQ_HOUSE_CASUALTY' in COURSES_DATA) && !('SEQ_HOUSE_DRAWN_CASUALTY' in COURSES_DATA) && !/The lane is closed/.test(src) && wash.sayEnd.other.includes('Weapons clear. Into the booth: hot wash.'), JSON.stringify(wash));
    },
  },
  // (retired in v0.0.24: "the live lane's lines whose timing is their point are baked up front" pinned the voices' fixed lines,
  // gone with the synthesis (the user, 2026-11-19: "forget voice synthesis, no voices."); the lines are bubbles, bubbles.test.mjs)
  {
    name: 'a scene played as set from the page drops a named, coded or drawn house with its words (the code review: ?play=test-shoothouse-live&layout=B played as set without a word)',
    fn() {
      const live = SCENES['test-shoothouse-live'], drawable = !Array.isArray(live.draws) || live.draws.includes('drawn');
      const rows = [{ layout: 'B' }, { rooms: 'all' }, { draw: 'drawn' }, { house: 'Kn240lc.Es195pc.Cn160lc' }].map(q => ({ q, ...houseChoice(q, { roomsDefault: 'a', drawable }) }));
      const set = houseChoice({}, { drawable }), main = readFileSync(join(root, 'src/main.js'), 'utf8');
      console.log(`      live drawable ${drawable}: ${rows.map(r => `${JSON.stringify(r.q)} → ${JSON.stringify(r.opts)} "${r.dropped.join(' ')}"`).join('; ')}; nothing asked: ${set.dropped.length} dropped`);
      assert(!drawable && rows.every(r => !Object.keys(r.opts).length && r.dropped.length === 1) && !set.dropped.length && /drawable: drawableOf\(recURL\)/.test(main) && /drawable: drawableOf\(rec\)/.test(main), JSON.stringify(rows));
    },
  },
  {
    name: 'the words: the frag\'s men counted ("Good frag: both men down."), never its stands\' ids; the contact\'s next row its own sentence, never "Yours: Move to your point." (the play review: "Good frag. 1a and 1b down." 18 times; "Yours: Look: behind the door.")',
    fn() {
      const frag = HOUSE_CHIEF.fragGood.map(t => t.replace('{list}', menWords(2))), his = RULES.find(r => r.id === 'cqb-contact').text.hisNext;
      console.log(`      ${JSON.stringify(frag)}; one man "${menWords(1)}", three "${menWords(3)}"; hisNext ${JSON.stringify(his)}`);
      assert(frag[0] === 'Good frag: both men down.' && menWords(1) === 'one man' && his.every(t => !/(Yours|You): \{what\}/.test(t) && /\{what\}\.$/.test(t)), JSON.stringify({ frag, his }));
    },
  },
  {
    name: 'a lane a grenade\'s burst ended leads its verdict with the cease fire, and the card says it once (the play review: "CEASE FIRE: IN THE ROOM AT THE BURST · NO-GO: A THREAT LEFT STANDING")',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), H = houseOf(g);
      H.end = { why: 'burst', atMs: g.state.clock.ms };
      const v = houseVerdict(g.state), card = runSheetOf(g.state).card;
      console.log(`      ${JSON.stringify(v.why)}; the card "${card.slice(0, 80)}…"`);
      assert(v.why[0] === 'burst' && !/NO-GO/.test(card), JSON.stringify({ v, card }));
    },
  },
  {
    name: 'your #2 at his stack, his stack-up still to end with its "Ready.", goes in on your cue: the keys recruit on 1222 on the mixed loadout re-stacks him after his own Get clear, and his threshold comes within 3 s of the cue (F25; the integration\'s open gauge, 3.30 s)',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1222, tier: 'recruit', loadout: 'mixed' }), H = houseOf(g);
      const E = entry(g, { team: { me: g.state.player.id, two: H.twoPid } });
      let prev = g.state.clock.ms;
      runHouse(g, houseKitBot({ use: 'mixed', base: 'keys' }), { each: (game) => { const now = game.state.clock.ms; E.tick(game, { now, dt: now - prev, on: houseOf(game).goAtMs !== null && !houseOf(game).end }); prev = now; }, maxMs: 20 * 60_000 });
      const rec = E.result(), rows = Object.entries(rec).map(([door, e]) => ({ door, s: e.inMs !== null && e.cueMs !== null ? (e.inMs - e.cueMs) / 1000 : null }));
      console.log(`      ${rows.map(r => `${r.door} ${r.s} s`).join(', ')}`);
      assert(rows.length >= 3 && rows.every(r => r.s !== null && r.s <= 3), JSON.stringify(rows));
    },
  },
  {
    name: 'no comment points at the deleted src/sim/scenarios/house-two.js but the one that says it moved (the code review: firearms.js, team.js, contact.js, bundle.js and enter-and-clear.js still named it)',
    fn() {
      const files = [], walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p); } };
      walk(join(root, 'src'));
      const hits = files.flatMap(p => readFileSync(p, 'utf8').split('\n').map((l, i) => [p.slice(root.length + 1), i + 1, l]).filter(([, , l]) => /house-two\.js/.test(l) && !/moved from src\/sim\/scenarios\/house-two\.js/.test(l)));
      console.log(`      ${files.length} modules; stale references ${hits.length}`);
      assert(!hits.length, JSON.stringify(hits.map(([p, n]) => `${p}:${n}`)));
    },
  },
];
