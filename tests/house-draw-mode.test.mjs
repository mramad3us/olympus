// OLYMPUS tests: which house a lane plays, set or drawn (the build sheet v0.0.21 §1 items 1 and 2, §0 items 13, 50 and 54, §6; house lens H10).
//
// &draw=drawn on a seed gives that seed's drawn code (HOUSE_DRAWS' rule: scenes/assemble.js drawnCodeOf) under every sheet; the set
// is the code 'A' and writes nothing (R.house.draw and places.live.gen absent); createGame with no draw is the set whatever
// HOUSE_DRAW_DEFAULT says (the flip moves no test); "Stack and clear, live" is the set from the page until its ship rule (F80) is met, drawn as a test asks; a
// layout part alone gains the seed's cast, a whole code is played as written where its cast is fair (else its layout with the seed's
// cast, and houseCodeWhy says why); &doors=fixed keeps the chunks' authored swings, every
// door closed; the URL's three are read by debug.js readParams (the form only); and the brief names the drawn doors' swings
// ("room 1, pull door, hinge right; …"), on a drawn lane only: the set's brief is v0.0.20's to the word.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { readParams } from '../src/core/debug.js';
import { HOUSE_DRAW_DEFAULT, SCENES } from '../src/data/scenes.js';
import { drawnCodeOf, wholeCodeOf, houseCodeOf, parseHouse, castFair, houseCodeWhy, HOUSE_CODE_SET } from '../src/sim/scenes/assemble.js';
import { doorWords, drawnCodeFor, houseGoal, houseNow, laneNameOf, HOUSE_SHEETS } from '../src/sim/scenarios/shoothouse.js';

export default [
  {
    name: '&draw=drawn on 48213 is its drawn code under every sheet; the set is \'A\' with nothing written, and the fill\'s draw \'set\' plays the set whatever code it is given; no draw is the set whatever HOUSE_DRAW_DEFAULT; "Stack and clear, live" is drawn as the lane is when a test asks (createGame\'s liveDraw; v0.0.22 G5), the set from the page (the fill without liveDraw) and its picker the set\'s until F80 ships it (v0.0.21 forced it to the set everywhere; the B and C review of 2026-11-16)',
    fn() {
      const want = drawnCodeOf(48213), codes = HOUSE_SHEETS.map(tier => houseCodeOf(createGame({ scenario: 'test-shoothouse', seed: 48213, tier, draw: 'drawn' }).state));
      const set = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' }).state, setD = drawnCodeFor(48213, { draw: 'set', house: want });
      const live = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live', draw: 'drawn' }).state, livePage = drawnCodeFor(48213, { draw: 'drawn', live: true });
      const absent = (s) => !('draw' in s.armoury.range.house) && !('gen' in s.places.live);
      console.log(`      48213: ${want} on ${HOUSE_SHEETS.length} sheets: ${new Set(codes).size} code(s); no draw ${houseCodeOf(set)} (default '${HOUSE_DRAW_DEFAULT}', nothing written ${absent(set)}); the fill's draw 'set' with a code ${setD}; live ${houseCodeOf(live)} (nothing written ${absent(live)}), from the page ${livePage ?? 'the set'}; the scenes' draws ${JSON.stringify(SCENES['test-shoothouse'].draws)} and live ${JSON.stringify(SCENES['test-shoothouse-live'].draws)}`);
      assert(codes.every(c => c === want) && houseCodeOf(set) === HOUSE_CODE_SET && absent(set) && setD === null && houseCodeOf(live) === want && !absent(live) && livePage === null
        && ['set', 'drawn'].includes(HOUSE_DRAW_DEFAULT) && SCENES['test-shoothouse-live'].draws.join() === 'set', JSON.stringify({ codes, want, live: houseCodeOf(live), livePage }));
    },
  },
  {
    name: 'a code given: its layout part alone gains the seed\'s cast, a whole one with a fair cast is played as written, a code that is no house is dropped (the seed\'s draw); &doors=fixed keeps the authored swings, every door closed; readParams reads the three',
    fn() {
      // (a whole code with a fair cast, another seed's: v0.0.21's review, an unfair one is not played as written (the case below))
      const layout = 'Es280pc.Cn250pc.Kn160pc', whole = wholeCodeOf(layout, 11);
      const a = houseCodeOf(createGame({ scenario: 'test-shoothouse', seed: 7, tier: 'tierone', house: layout }).state);
      const b = houseCodeOf(createGame({ scenario: 'test-shoothouse', seed: 7, tier: 'tierone', house: whole }).state);
      const c = houseCodeOf(createGame({ scenario: 'test-shoothouse', seed: 7, tier: 'tierone', draw: 'drawn', house: 'Cn290pc.Cs206lc.En175pc' }).state);
      const f = parseHouse(houseCodeOf(createGame({ scenario: 'test-shoothouse', seed: 7, tier: 'tierone', draw: 'drawn', doors: 'fixed' }).state));
      const fixed = f.rooms.every(R => R.state === 'closed' && R.how === (R.letter === 'K' ? 'pull' : 'push'));
      const p = readParams('?play=test-shoothouse&draw=drawn&house=Es280pc.Cn250pc.Kn160pc&doors=fixed'), q = readParams('?draw=all&house=Zz&doors=free');
      console.log(`      ${layout} on seed 7 → ${a} (wholeCodeOf ${wholeCodeOf(layout, 7)}); whole → ${b}; a code of no house → ${c} (the seed's ${drawnCodeOf(7)}); fixed ${f.rooms.map(R => `${R.letter}${R.how}/${R.state}`).join(', ')}; the URL ${JSON.stringify({ draw: p.draw, house: p.house, doors: p.doors })}, bad ${JSON.stringify({ draw: q.draw, house: q.house, doors: q.doors })}`);
      assert(a === wholeCodeOf(layout, 7) && a.startsWith(`${layout}|f`) && b === whole && c === drawnCodeOf(7) && fixed && p.draw === 'drawn' && p.house === layout && p.doors === 'fixed' && q.draw === null && q.house === null && q.doors === null, JSON.stringify({ a, b, c }));
    },
  },
  {
    name: 'the brief names each drawn door\'s swing, "room 1, pull door, hinge right; …", on a drawn lane only: on the set the words are none',
    fn() {
      const d = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', draw: 'drawn' }).state, s = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' }).state;
      const wd = doorWords(d), ws = doorWords(s), rooms = parseHouse(houseCodeOf(d)).rooms;
      console.log(`      drawn ${houseCodeOf(d)}: "${wd.trim()}"; set: "${ws}"`);
      assert(ws === '' && rooms.every((R, k) => wd.includes(`room ${k + 1}, ${R.how} door, hinge ${R.side === 'n' ? 'left' : 'right'}`)), JSON.stringify({ wd, ws }));
    },
  },
  {
    name: 'a whole code whose cast is unfair is not played as written: its layout kept, the cast drawn from the seed, and houseCodeWhy says why for the page\'s toast (the review of v0.0.21: \'…|ftttttt|p000000\', no no-shoot and two stands on one spot, played to the card)',
    fn() {
      const layout = 'Cn290pc.Ks206lc.En175pc', bad = `${layout}|ftttttt|p000000`, fair = `${layout}|ftnanth|p010101`;
      const got = houseCodeOf(createGame({ scenario: 'test-shoothouse', seed: 7, tier: 'tierone', house: bad }).state), G = parseHouse(got);
      const kept = houseCodeOf(createGame({ scenario: 'test-shoothouse', seed: 7, tier: 'tierone', house: fair }).state);
      const why = { bad: houseCodeWhy(bad, 7), twice: houseCodeWhy(`${layout}|ftnanth|p000000`, 7), fair: houseCodeWhy(fair, 7), layout: houseCodeWhy(layout, 7), none: houseCodeWhy('Zz', 7), off: houseCodeWhy('Cn290pc.Ks288lc.En175pc', 7) };
      console.log(`      ${bad} on seed 7 → ${got} (fair ${castFair(G.rooms, G.faces, G.places).ok}; the seed's cast ${wholeCodeOf(layout, 7) === got}); ${fair} → ${kept}; houseCodeWhy ${JSON.stringify(why)}`);
      assert(G.layout === layout && got !== bad && castFair(G.rooms, G.faces, G.places).ok && got === wholeCodeOf(layout, 7) && kept === fair
        && why.bad === 'no no-shoot' && /one place twice/.test(why.twice ?? '') && why.fair === null && why.layout === null && why.none === 'no house' && why.off === 'no house', JSON.stringify({ got, kept, why }));
    },
  },
  {
    name: 'the lane in words: "Lane A" on the set, "A new layout" on a drawn house, in the goal box, the run sheet\'s card and its title (the review of v0.0.21: the goal box said "Lane A" over a drawn house)',
    fn() {
      const at = (o) => { const g = createGame({ scenario: 'test-shoothouse', seed: 17, tier: 'sgt', setup: 'go', ...o }); g.step(40, {}); return g.state; };
      const s = at({}), d = at({ draw: 'drawn' }), Ns = houseNow(s), Nd = houseNow(d);
      console.log(`      set: "${houseGoal(s).slice(0, 40)}…", card "${Ns.summary.split(' · ').find(x => /LANE|LAYOUT/.test(x))}", title lane ${Ns.lane}; drawn ${houseCodeOf(d).split('|')[0]}: "${houseGoal(d).slice(0, 40)}…", card "${Nd.summary.split(' · ').find(x => /LANE|LAYOUT/.test(x))}", title lane ${Nd.lane}`);
      assert(laneNameOf(s) === 'Lane A' && houseGoal(s).startsWith('Lane A at 1 G') && Ns.summary.includes('LANE A') && Ns.lane === 'A'
        && laneNameOf(d) === 'A new layout' && houseGoal(d).startsWith('A new layout at 1 G') && !/LANE A/.test(Nd.summary) && Nd.summary.includes('NEW LAYOUT') && Nd.lane === null, JSON.stringify({ s: houseGoal(s), d: houseGoal(d), ns: Ns.summary, nd: Nd.summary }));
    },
  },
];
