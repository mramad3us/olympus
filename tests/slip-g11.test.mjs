// OLYMPUS tests: a grenade at your feet or short on you hands back, "Get clear" (the build sheet v0.0.22 item 8, R1 b; WEAPONS §12.2; COMBAT §25.20).
//
// v0.0.19 handed back a practice grenade slipped at your feet; a G-11 slipped there burst with no row to take (the boot recruit on
// 48229: 321.3 kPa on him, 38.7 on his #2). From v0.0.22 every grenade slipped at your feet, and a failed toss that lands where its
// burst would stun you (burst.js stunOn, the walls counted), hands back at once in stop motion with its fuse running: bundle.js
// SLIP_WORDS "Grenade! At your feet. Get clear." or SHORT_WORDS "Grenade short! Get clear.", and the DI names the row (cqb.js
// cqb-grenade, "Grenade! Get clear.", T Get clear: bundle.js move:clear, its heading the one that has you farthest from it at its
// burst, bundle.js clearOf). The kit bot presses T on it, as a player who reads the DI;
// declined (Carry on), the burst is the slip's own fault as v0.0.20 marks it ("BANG AT YOUR FEET", 'feet').
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { SLIP_WORDS, SHORT_WORDS } from '../src/sim/combat/bundle.js';
import { STUN_KPA, BREACH_SAFE_KPA } from '../src/sim/arms/blast.js';

// (the boot recruit's flash lane by the kit bot with the keys, to the burst after its hand-back: the stop, the line, the burst)
function lane(seed, { decline = false, maxMs }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier: 'recruit', setup: 'go', loadout: 'flash' }), pid = g.state.player.id, H = g.state.armoury.range.house;
  let stop = null, nb = 0, burst = null;
  runHouse(g, houseKitBot({ use: 'flash', base: 'keys', decline }), { maxMs, each: (game) => {
    const st = game.state, w = st.stop?.carry?.words ?? null, L = instinctNow(st).line;
    if (!stop && (w === SLIP_WORDS || w === SHORT_WORDS) && st.stop.phase === 'choose') {
      const d = Object.values(st.items).find(x => x.type === 'grenade' && x.st === 'live' && x.flight);
      stop = { t: st.clock.ms - H.goAtMs, words: w, line: L ? `${L.id} "${L.text}" ${L.act}` : null, act: L?.act ?? null, fuseLeftMs: d ? d.fuseAtMs - st.clock.ms : null };
    }
    const bs = H.bursts ?? [];
    while (nb < bs.length) { const b = bs[nb++]; if (stop && !burst && b.model === 'g11') burst = { t: b.atMs - H.goAtMs, me: b.kPa[pid], two: b.kPa[H.twoPid], atFeet: !!b.atFeet }; }
  } });
  const legs = [...H.rooms, H.hall];
  return { seed, decline, stop, burst, faults: legs.flatMap(L => L.faults.map(f => f.kind)), marks: legs.flatMap(L => (L.kit ?? []).filter(m => /^STACK |FEET/.test(m))) };
}
const say = (o) => `${o.seed}${o.decline ? ' declined' : ''}: the stop at ${o.stop?.t} ms "${o.stop?.words}" (${o.stop?.fuseLeftMs} ms of fuse), the line ${o.stop?.line}; the burst at ${o.burst?.t} ms, ${o.burst?.me} kPa on you, ${o.burst?.two} on your #2${o.burst?.atFeet ? ', at your feet' : ''}; faults ${JSON.stringify(o.faults)}, marks ${JSON.stringify(o.marks)}`;

export default [
  {
    name: 'a G-11 slipped at your feet hands back at once, "Grenade! At your feet. Get clear.", the DI names Get clear ("Grenade! Get clear.", T: move:clear) and T runs it, the heading that has you farthest from it at the burst: 15.2 kPa on you, no stun (the boot recruit on 48229, the kit bot by the keys; the build sheet v0.0.22 item 8, R1 b: no hand-back for a G-11 before, 321.3 kPa at your feet; Get clear by the farthest end alone ran past it, 21.7 kPa); declined, Carry on, the slip\'s fault, "BANG AT YOUR FEET", and over BREACH_SAFE_KPA',
    timeoutMs: 60_000,
    fn() {
      const took = lane(48229, { maxMs: 13_000 }), not = lane(48229, { decline: true, maxMs: 13_000 });
      console.log(`      ${say(took)}\n      ${say(not)}`);
      assert(took.stop?.words === SLIP_WORDS && took.stop.t === 9250 && /^cqb-grenade /.test(took.stop.line ?? '') && took.stop.act === 'stop:move:clear', JSON.stringify(took.stop));
      assert(took.burst?.atFeet && took.burst.me === 15.2 && took.burst.me < STUN_KPA && took.burst.two < STUN_KPA, JSON.stringify(took.burst));
      assert(not.stop?.words === SLIP_WORDS && not.burst?.me > BREACH_SAFE_KPA && not.faults.includes('feet') && not.marks.includes('BANG AT YOUR FEET'), JSON.stringify(not));
    },
  },
  {
    name: 'a failed toss that lands where its burst would stun you hands back, "Grenade short! Get clear.", and T runs Get clear, away from it: 5.2 kPa on you (the boot recruit\'s flash at room 2 on 48224; the build sheet v0.0.22 item 8, R1 b: the burst came with you on the stack, no row to take, 22.5 kPa; Get clear by the farthest end alone ran past it, 23.4); declined, the burst over STUN_KPA on you',
    timeoutMs: 60_000,
    fn() {
      const took = lane(48224, { maxMs: 40_000 }), not = lane(48224, { decline: true, maxMs: 40_000 });
      console.log(`      ${say(took)}\n      ${say(not)}`);
      assert(took.stop?.words === SHORT_WORDS && /^cqb-grenade /.test(took.stop.line ?? '') && took.stop.act === 'stop:move:clear' && !took.burst?.atFeet, JSON.stringify(took.stop));
      assert(not.stop?.words === SHORT_WORDS && not.burst?.me >= STUN_KPA && took.burst?.me < STUN_KPA && took.burst.me < not.burst.me, JSON.stringify({ took: took.burst, not: not.burst }));
    },
  },
];
