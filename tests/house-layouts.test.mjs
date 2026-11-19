// OLYMPUS tests: layouts B and C, the instructors' other two panel settings, as named houses (the build sheet v0.0.22 item 14, §6 A; house lens G3, §0 item 4; PLACES §4.12).
//
// scenes/assemble.js HOUSE_LAYOUTS names three houses: A the set itself, B the long room, the offset room and the room with its back
// room (Wn280pc.Os195lc.Tn165pc), C the small room, the narrow room and the L (Qn290pc.Ds205lc.En175pc), each at A's rhythm of doors,
// every door closed. A named house is assembled from its code as a drawn one is and its cast drawn from the seed (R.house.draw.layout
// 'B' or 'C'). Held here: each assembles and keeps every layout rule; its cast fair on 40 seeds (castFair, the live posts' rule in);
// laneWordOf names it ('A', 'B', 'C', else 'drawn'); `&layout` beats a code and a draw (createGame's layout over house); the honest tier
// one to the card on 48213 on each, faultless; and their codes on 48213 pinned. It fails without HOUSE_LAYOUTS (no B or C).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { drawnLane } from './flawless-drawn.mjs';
import { HOUSE_LAYOUTS, assembleHouse, parseHouse, layoutOk, wholeCodeOf, castFair, laneWordOf, drawnCodeOf } from '../src/sim/scenes/assemble.js';

/** The named houses' whole codes on 48213 (the cast drawn from the seed), pinned. */
const PINNED = Object.freeze({ B: 'Wn280pc.Os195lc.Tn165pc|fttantt|p302102', C: 'Qn290pc.Ds205lc.En175pc|ftnttna|p023023' });

export default [
  {
    name: 'layouts B and C assemble from their codes, keep every layout rule, draw a fair cast on 40 seeds, are named by laneWordOf (A, B, C, else drawn), and beat a code given with them; their codes on 48213 pinned',
    fn() {
      const out = {}, bad = [];
      for (const k of ['B', 'C']) {
        const L = HOUSE_LAYOUTS[k], H = parseHouse(L), A = assembleHouse(L);
        if (!H || !layoutOk(H.rooms) || !A) { bad.push(`${k}: ${L} no house`); continue; }
        let unfair = 0;
        for (let seed = 1; seed <= 40; seed++) { const c = parseHouse(wholeCodeOf(L, seed)); if (!castFair(c.rooms, c.faces, c.places).ok) unfair++; }
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', layout: k, house: drawnCodeOf(7) }), D = g.state.armoury.range.house.draw;
        out[k] = D.code;
        if (unfair) bad.push(`${k}: ${unfair} of 40 casts unfair`);
        if (D.layout !== k || parseHouse(D.code).layout !== L) bad.push(`${k}: the fill wrote ${JSON.stringify(D)}`);
        if (laneWordOf(D.code) !== k) bad.push(`${k}: laneWordOf ${laneWordOf(D.code)}`);
        if (PINNED[k] !== 'PRINT' && PINNED[k] !== D.code) bad.push(`${k}: 48213's code ${D.code}, pinned ${PINNED[k]}`);
        console.log(`      ${k} ${L}: rooms ${H.rooms.map(r => `${r.letter} at ${fmt(r.doorX, 1)} m`).join(', ')}; 40 casts, ${unfair} unfair; 48213 (a code given too, beaten) ${D.code}`);
      }
      const words = [laneWordOf('A'), laneWordOf(null), laneWordOf(drawnCodeOf(1)), laneWordOf(drawnCodeOf(1, { rooms: 'all' }))];
      console.log(`      laneWordOf: the set ${words[0]}, none ${words[1]}, drawn ${words[2]}, eight rooms drawn ${words[3]}${PINNED.B === 'PRINT' ? `; to pin: ${JSON.stringify(out)}` : ''}`);
      if (words.join() !== 'A,A,drawn,drawn') bad.push(`laneWordOf ${words}`);
      assert(!bad.length, bad.join(' | '));
    },
  },
  {
    name: 'the honest tier one clears layouts B and C on 48213 to the card, faultless (every room, the back room\'s far walk through its doorway included)',
    timeoutMs: 60_000,
    fn() {
      const recs = ['B', 'C'].map(k => drawnLane({ tier: 'tierone', seed: 48213, bot: 'honest', setup: 'go', fill: { layout: k } }));
      for (const r of recs) console.log(`      ${r.code}: ${r.end}, ${r.laneS} s (rooms ${r.legS.map(x => fmt(x, 2)).join(', ')} s); faults ${JSON.stringify(r.faults)}`);
      assert(recs.every(r => r.done && r.end === 'clear' && !Object.values(r.faults).some(Boolean)), JSON.stringify(recs.map(r => [r.code, r.end, r.faults])));
    },
  },
];
