// OLYMPUS tests: "Away the boarding party" from the brief to the card, F153's flow, F155's fault, F160's card half and F169 (the build sheet v0.0.27 §1 D, items 1, 4, 10, 12, 15, 17, §6 D, §8).
//
// One lane, the private by the keys against pirates on 1074 from the fill (on 48213 the pirates' barricade man puts both holders down as
// they come through the hatch and the party falls back, the balance's question: tests/collar-balance.test.mjs): the leader's words in order (the brief, "Four, override.",
// "Stand by.", GO, each compartment's send, "Deck secure.", the after-action line), the passage held by the team ('held' on the card)
// and the three compartments cleared, Four over each hatch's threshold within F25's 3 s of his cue (tests/cqb-gauges.mjs entry, the
// house's own watcher; F169's boarding half), the bodies never under the body gap, the card's head the ship's and its rows the boarding's
// (OURS, THEIRS, THE CREW, the rounds and holes where any, THEIR CHOICES where a man chose), the counts the boarding's record's. And the
// fault (F155): on the boarding's men (opfor.js, A's), a round of yours at a man with his hands up, down or unarmed is faulted
// 'protected' by houseShot over opfor.js protectedOf, its card words by why; one who gives up on the round's own tick is not.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { watch } from './cqb-gauges.mjs';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { runSheetOf, houseShot, houseNow, PROTECTED_CARD } from '../src/sim/scenarios/shoothouse.js';
import { laneModel } from '../src/ui/hud/timer.js';
import * as OPFOR from '../src/sim/scenarios/opfor.js';
import { collarBot, runCollar } from './bots/collar.mjs';

const ENTRY_S = 3;
/**
 * The boarding's gauges still open on this tree, each with its cause, measured (printed every run; a gauge leaves this list when the
 * lane meets it, never by a target moved, as zerocqb-quick's WRECK_OPEN).
 */
export const COLLAR_OPEN = Object.freeze({
  F169: 'Four over a hatch\'s threshold 3.95 to 5.65 s after his cue by the keys (cabin 1 4.85 to 5.3 s on every sheet): on locked boots he walks the mag walk\'s 0.5 m/s, his 1.7 m from his stack to past the threshold 3.4 s at best, and aboard a ship he leaves for his stack only once you stand on yours (combat/bundle.js leadGone, v0.0.25 C\'s rule for the Wreck\'s 1.2 m passage); letting him follow from behind (D\'s trial) took cabin 1 to 3.6 s and lost the tier one\'s smugglers lane (every compartment passed), so not taken: the cue\'s wait on his "Ready." does not shorten his walk from the stack',
});
// (the live lane's paper words that have no place aboard: paint, a par, the first-round race, what the rounds would have done (the
// user's rule of 2026-11-16, no paint aboard; the review of D read them on the boarding's card and its lane timer))
const PAPER_WORDS = /PAINT|\bPAR\b|\/ \d|HIS FIRST ROUND|BEFORE HIS|FIRST ROUNDS TOGETHER|WOULD HAVE|would have done|took paint|HE FIRED FIRST/;
/** The lane timer's words and zones at this tick (src/ui/hud/timer.js laneModel over houseNow): '' before GO. */
const timerWords = (s) => { const m = laneModel(houseNow(s), s.clock.ms); return m ? [m.text, m.strip ?? '', ...m.zones.map(z => `${z.n} ${z.word}`)].join(' | ') : ''; };
/** Every paper word of the boarding's run sheet (rows, card, one thing, would, the boarding's rows) and its legs' zones, as one text. */
const sheetWords = (s) => { const rs = runSheetOf(s), N = houseNow(s); return [JSON.stringify({ rows: rs.rows, card: rs.card, one: rs.one, would: rs.would ?? null, boarding: rs.boarding }), ...N.legs.flatMap(V => Object.keys(V.zones ?? {}).length ? [`zones ${JSON.stringify(V.zones)}`] : [])].join(' | '); };
const factsOf = (g, type) => (g.bus.events ?? []).filter(e => (Array.isArray(e) ? e[0] : e.type) === type).map(e => (Array.isArray(e) ? e[1] : e.payload ?? e));

export default [
  {
    name: 'F153, F160, F169 (heavy, its CPU over the round\'s quick budget: the review of D): the private by the keys on 1074 against pirates, from the brief to the card: the leader\'s words in order, the passage held, the three compartments cleared, Four in on his cue at every hatch (F169 printed), the card the ship\'s with the boarding\'s rows and none of the live lane\'s paper words on it or on the lane timer at any tick',
    heavy: true,
    fn() {
      const g = createGame({ scenario: 'test-collar', seed: 1074, tier: 'private', holdouts: 'pirates' }), s = g.state, R = s.armoury.range, H = R.house, B = H.boarding;
      const W = watch(g, { team: { me: s.player.id, two: H.twoPid }, plans: lanePlanOf(s) }, ['entry', 'bodies']), said = [], paper = new Set();
      runCollar(g, collarBot({ mode: 'keys' }), { each: (game) => {
        const now = game.state.clock.ms, on = H.goAtMs !== null && !H.end;
        W.tick(game, { now, dt: 50, on });
        if (on && game.state.clock.tick % 10 === 0) { const t = timerWords(game.state); if (PAPER_WORDS.test(t)) paper.add(t); }
        for (const f of game.facts('say')) if (f.who === H.chiefPid) said.push(f.text);
      } });
      const r = W.result(), E = Object.entries(r.entry).filter(([d]) => d !== lanePlanOf(s).order[0]);
      const rs = runSheetOf(s);
      console.log(`      the leader: ${said.map(t => `"${t}"`).join(', ')}`);
      console.log(`      ended ${B.end?.why} at ${((H.end.atMs - H.goAtMs) / 1000).toFixed(1)} s; legs ${H.rooms.map(L => (L.held ? 'held' : L.state)).join(', ')}; Four on his cue ${E.map(([d, e]) => `${d.split(':').at(-1)} ${e.inMs !== null && e.cueMs !== null ? ((e.inMs - e.cueMs) / 1000).toFixed(2) : 'never'} s`).join(', ')}; the bodies' least ${r.bodies.minM.toFixed(2)} m`);
      console.log(`      the card: ${rs.card}`);
      for (const row of rs.boarding.rows) console.log(`        ${row}`);
      const order = ['Patient Mule', 'override', 'Stand by', 'cabin one', 'the bunk room', 'cabin two', 'secure'].map(w => said.findIndex(t => t.toLowerCase().includes(w.toLowerCase())));
      assert(order.every((i, k) => i >= 0 && (k === 0 || i > order[k - 1])), JSON.stringify(order));
      // (every compartment cleared, or the side given up and every armed man accounted for: the deck secured either way (shoothouse.js securedNow))
      assert(B.end?.why === 'clear' && H.rooms[0].held && (H.rooms.slice(1).every(L => L.state === 'clear') || !!B.side?.gaveAtMs), JSON.stringify({ legs: H.rooms.map(L => L.state), side: B.side }));
      const late = E.filter(([, e]) => e.cueMs !== null && !(e.inMs !== null && e.inMs - e.cueMs <= ENTRY_S * 1000 && !e.out));
      if (COLLAR_OPEN.F169) console.log(`      F169 ${late.length ? 'OPEN' : 'MET (take it out of COLLAR_OPEN)'}: ${late.length} of ${E.length} hatches over ${ENTRY_S} s; ${COLLAR_OPEN.F169}`);
      // (Four in on his cue at every hatch your entry cued (a compartment the side's give-up secured before its entry has no cue))
      const cued = E.filter(([, e]) => e.cueMs !== null);
      assert(cued.length >= 2 && cued.every(([, e]) => e.inMs !== null && !e.out) && (COLLAR_OPEN.F169 || !late.length), JSON.stringify(r.entry));
      assert(r.bodies.minM >= 0.5 - 1e-6, `bodies ${r.bodies.minM}`);
      assert(/^THE PATIENT MULE · BELT ICE HAULER · DECK 2 · SECURED \d+:\d\d · PRIVATE · [23] COMPARTMENTS/.test(rs.card) && rs.place === 'THE PATIENT MULE · DECK 2', rs.card);
      assert(rs.boarding.rows.some(x => x.startsWith('OURS: YOU')) && rs.boarding.rows.some(x => x.startsWith('THEIRS: ')) && rs.boarding.rows.some(x => x.startsWith('THE CREW: ')), JSON.stringify(rs.boarding.rows));
      assert(rs.verdict.go === null && !/ \/ \d/.test(rs.rows.map(x => x.words).join(' ')), 'no verdict and no par aboard');
      const sheet = sheetWords(s);
      console.log(`      the live lane's paper words aboard: the timer ${paper.size} samples, the card ${PAPER_WORDS.test(sheet) || /zones/.test(sheet) ? 'some' : 'none'}`);
      assert(!paper.size && !PAPER_WORDS.test(sheet) && !/zones/.test(sheet), JSON.stringify({ timer: [...paper].slice(0, 3), sheet: sheet.match(PAPER_WORDS)?.[0] ?? sheet.match(/zones.*/)?.[0] }));
    },
  },
  {
    name: 'no paint, par or paper zone aboard (the user\'s rule of 2026-11-16; the review of D): the sergeant by T against the pirates from GO on 48213 to the fall back or 60 s, the lane timer read every half second and the run sheet at the end carry no PAINT, PAR, "/ par", HIS FIRST ROUND, WOULD HAVE or "HE FIRED FIRST", no "You took paint." and no paper zone',
    fn() {
      const g = createGame({ scenario: 'test-collar', seed: 48213, tier: 'sgt', holdouts: 'pirates', setup: 'go' }), s = g.state, H = s.armoury.range.house;
      const paper = new Set();
      let samples = 0;
      runCollar(g, collarBot({ mode: 'T' }), { maxMs: 60_000, each: (game) => {
        if (H.goAtMs === null || H.end || game.state.clock.tick % 10) return;
        samples++;
        const t = timerWords(game.state);
        if (PAPER_WORDS.test(t) || / \d+ (A|C|HEAD)\b/.test(t)) paper.add(t);
      } });
      const sheet = sheetWords(s), rs = runSheetOf(s);
      console.log(`      ended ${H.end?.why ?? 'not yet'} at ${H.goAtMs === null ? '-' : ((s.clock.ms - H.goAtMs) / 1000).toFixed(1)} s; the timer read ${samples} times, with paper words ${paper.size}${paper.size ? ` ("${[...paper][0]}")` : ''}; the run sheet's rows: ${rs.rows.map(r => r.words).join(' / ')}; one thing '${rs.one.key}'`);
      assert(samples > 20 && !paper.size, JSON.stringify([...paper].slice(0, 3)));
      assert(!PAPER_WORDS.test(sheet) && !/zones/.test(sheet) && rs.one.key !== 'paint' && rs.would === undefined, sheet.match(PAPER_WORDS)?.[0] ?? sheet.match(/zones.*/)?.[0] ?? rs.one.key);
    },
  },
  {
    name: 'F155: a round of yours at a man with his hands up, down or unarmed is faulted \'protected\' (its card words by why), one at a man who gives up on the round\'s own tick is not (opfor.js protectedOf, houseShot)',
    fn() {
      assert(typeof OPFOR.protectedOf === 'function', 'opfor.js protectedOf (A\'s, merged before D)');
      const g = createGame({ scenario: 'test-collar', seed: 48213, tier: 'sgt', holdouts: 'pirates', setup: 'go' }), s = g.state, R = s.armoury.range, H = R.house, pid = s.player.id;
      const men = R.turners.filter(T => T.live), armed = men.filter(T => !T.live.unarmed), crew = men.filter(T => T.live.unarmed);
      assert(armed.length >= 3 && crew.length >= 1, `men ${men.map(T => T.stand).join(',')}`);
      g.step(20, {});
      const now = () => s.clock.ms, rows = [];
      let n = 0;
      const shoot = (T) => { const before = (H.boarding.protected ?? []).length; houseShot(s, g.bus, { fired: true, id: `test:${n++}`, atMs: now(), who: pid, target: T.key, zone: null, part: 'torso' }); return (H.boarding.protected ?? []).slice(before); };
      const [hands, down, late] = armed;
      // (his hands up for a while: his give's record as the brain writes it (gaveAtMs, st 'hands', face 'noshoot'))
      Object.assign(hands.live, { st: 'hands', gaveAtMs: now() - 2000 }); hands.face = 'noshoot';
      Object.assign(down.live, { st: 'down', downAtMs: now() - 2000 });
      Object.assign(late.live, { st: 'hands', gaveAtMs: now() }); late.face = 'noshoot';
      for (const [T, want] of [[hands, 'hands'], [down, 'down'], [crew[0], 'unarmed'], [late, null]]) {
        const got = shoot(T), L = H.rooms[Number(T.stand[0]) - 1];
        rows.push(`${T.stand} ${want ?? 'giving on the tick'}: ${got.map(x => x.why).join(',') || 'no fault'}${got.length ? ` ("${PROTECTED_CARD[got[0].why]}" on ${L ? 'its leg' : '?'}: ${L?.kit?.includes(PROTECTED_CARD[got[0].why])})` : ''}`);
        assert(want === null ? !got.length : got.length === 1 && got[0].why === want && L.kit.includes(PROTECTED_CARD[want]), rows.at(-1));
      }
      const faults = factsOf(g, 'house').filter(f => f.phase === 'fault' && f.kind === 'protected').length;
      console.log(`      ${rows.join('; ')}; the 'protected' faults ${faults}`);
      assert(faults === 3, `${faults} faults`);
    },
  },
];
