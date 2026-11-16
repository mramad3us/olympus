// OLYMPUS tests: the four dead ends the house lens's drawn layouts found (the build sheet v0.0.21 §1 item 5; house lens H7 a to d), each played on the drawn house at the state the lens met it, with what became of it.
//
//   (a) the corner room last (`Es280pc.Cn250pc.Kn160pc`): the lens's #2 kept his hold on the closet into the hall's leg, you stood
//       in room 3's doorway 44 s, F4 351.9 s and 4 of 8 lanes passed. On v0.0.21 (A's drawn house over v0.0.20's give-way) the
//       #2's hold still outlives room 3 (it does on the set too, from room 2 on: nothing reads it there) but holds nobody: every lane
//       clears. The sheet's `releaseHolds` is not built, since releasing the hold at endLeg would move every honest set lane's save.
//   (b) the last room south of the hall: the lens's fuzz ended 1,266 moves in its doorway, the hall's #2 stack in its funnel. A's
//       derived hall leg sets that stack east of the last door's east jamb, clear of its funnel; held here, and by the fuzz.
//   (c) Stop with the P-12 out: T and Fix had nothing (16 presses by hand on the lens's pull layout). Built in item 6: MAKE SAFE
//       holsters it (sidearm.js ADMIN.safe), Fix names MAKE SAFE; house-pistol plays it on stage 0's Stop save, read here too.
//   (d) a par missed on a man of yours in a drawn room (the tier one, 1 of 2 seeds in the lens). Traced: two mechanisms, neither a
//       dead end, each the drawn house's own. Two threats in your sector of one room up together (seed 7, room 1: the second man's
//       0.8 s par runs out while you engage the first), pinned here by its numbers; and a drawn place at a swing the set never asks,
//       a margin that hangs on the path (seed 9's armoured man in room 3: 823 ms from GO, 648 ms from room 3's setup, against the
//       operator's 800), in the handoff. The fix is the fair lane's (A: at most one threat in each marine's sector of a room up at
//       once) or the pars' (C: a stand's par from its own swing); F10 stays OPEN on drawn lanes until one lands (house-drawn).
//       v0.0.21's fixer landed the pars': the second man of a window times his par from your first man's row (shoothouse.js parFrom),
//       and a drawn place's swing books its turn (turnOffMs); so (d) now holds seed 7's 1b met, the two threats still yours, up together.
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { flawlessLane } from './flawless.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { houseNow } from '../src/sim/scenarios/shoothouse.js';
import { planSetOf } from '../src/sim/scenes/assemble.js';
import { inFunnel } from '../src/sim/combat/room.js';
import { ownerOf } from '../src/sim/combat/team.js';

/** The layouts (see the header). */
export const CORNER_LAST = 'Es280pc.Cn250pc.Kn160pc', SOUTH_LAST = 'Ks280lc.En250lc.Cs220po';
const THREATS = new Set(['threat', 'armoured']);

export default [
  {
    name: '(a) the corner room last, north of the hall: the tier one by T from room 3 clears room 3 and the hall, no leg passed, under 60 s (the lens: 351.9 s in a doorway, 4 of 8 lanes passed)',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'room:3', house: CORNER_LAST }), s = g.state, H = s.armoury.range.house;
      let holdHall = 0;
      const r = runHouse(g, houseHonestBot(), { maxMs: 300_000, each: (gg) => { if (gg.state.armoury.range.house.cur === 3 && gg.state.armoury.range.house.two?.hold) holdHall++; } });
      const N = houseNow(s), legs = N.legs.map(V => V.state), laneS = N.timerMs / 1000;
      console.log(`      ${H.draw.code}: ${r.done ? 'to the card' : 'NO CARD'} (${H.end?.why}), legs ${legs.join(', ')}, ${laneS.toFixed(2)} s on the clock; the #2's hold in the hall's leg ${holdHall} ticks (it holds nobody)`);
      assert(r.done && H.end?.why === 'clear' && legs.every(x => x !== 'passed') && laneS <= 60, JSON.stringify({ end: H.end?.why, legs, laneS }));
    },
  },
  {
    name: '(b) the last room south of the hall: the hall\'s #2 stack stands clear of its door\'s funnel (A\'s derived hall leg), and the fuzz from the hall on three seeds ends no move in a doorway',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 2, tier: 'sgt', setup: 'go', house: SOUTH_LAST }), set = planSetOf(g.state);
      const last = set.plans[set.order[2]], hall = set.plans.hall, two = hall.stack[1];
      const recs = [2, 3, 4].map(seed => flawlessLane({ tier: 'sgt', seed, bot: 'fuzz', setup: 'hall', fill: { house: SOUTH_LAST } }));
      const ends = recs.reduce((a, r) => a + (r.door?.endsIn ?? 0), 0);
      console.log(`      room 3 ${set.order[2]} (its threshold z ${last.threshold[1]}), the hall's #2 stack ${JSON.stringify(two)}: in its funnel ${inFunnel(last, two[0], two[1])}; the fuzz from the hall: ${recs.map(r => `${r.seed} ${r.end}`).join(', ')}, moves ending in a doorway ${ends}`);
      assert(last.threshold[1] > 14.4 && !inFunnel(last, two[0], two[1]) && recs.every(r => r.done) && ends === 0, JSON.stringify({ two, ends, ends2: recs.map(r => r.door?.endsWhat) }));
    },
  },
  {
    name: '(c) Stop with the P-12 out (stage 0\'s save, as house-pistol plays it): Fix names MAKE SAFE, whose last part holsters it (the lens: nothing offered, 16 presses by hand)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213 }), s = g.load(gunzipSync(readFileSync(`${root}/tests/saves/v0.0.20-house-stop.json.gz`)).toString());
      g.step(3, {});
      const fix = stepsOf(s).find(r => r.fix);
      console.log(`      Fix "${fix?.label}" (${(fix?.subs ?? []).map(x => x.id).join(', ')})`);
      assert(fix?.id === 'macro:safe' && fix.subs.at(-1).id === 'pistol:holster', JSON.stringify(fix?.subs?.map(x => x.id)));
    },
  },
  {
    name: '(d) two threats of your sector up together in one drawn room (seed 7, room 1): the second\'s par, which ran out while you took the first, now runs from your first man\'s row and is met (v0.0.21\'s fixer); the lane to its card',
    timeoutMs: 120_000,
    fn() {
      // (a lane to its card, the first shot fact of yours on each man kept)
      const lane = (seed, setup) => {
        const g = createGame({ scenario: 'test-shoothouse', seed, tier: 'tierone', setup, draw: 'drawn' }), s = g.state, first = {};
        const r = runHouse(g, houseHonestBot(), { maxMs: 300_000, each: (gg) => { for (const [t, f] of gg.facts()) if (t === 'shot' && f.who === s.player.id && f.target && first[f.target] === undefined) first[f.target] = f.atMs; } });
        const N = houseNow(s), R = s.armoury.range, cs = N.legs.flatMap(V => V.contacts).filter(c => c.by === 'me' && c.parMet === false);
        return { g, s, r, N, R, cs, first, code: R.house.draw.code };
      };
      // (seed 7: room 1 a pull centre, 1a and 1b both in your sector, both up at GO)
      const A = lane(7, 'go'), a1 = A.R.turners.filter(T => T.room.endsWith('.r1') && THREATS.has(T.face));
      const mine1 = a1.filter(T => ownerOf(A.s, T) === 1), miss1 = A.cs.find(c => c.stand === '1b');
      const shot1 = A.N.legs[0].contacts.find(c => c.stand === '1a' && c.by === 'me');
      console.log(`      seed 7 ${A.code}: room 1's threats ${a1.map(T => `${T.stand} owner ${ownerOf(A.s, T)}`).join(', ')}; 1a seen at ${((shot1.seenMs - A.R.house.goAtMs) / 1000).toFixed(2)} s, his first round at ${((shot1.firstAtMs - A.R.house.goAtMs) / 1000).toFixed(2)} s; 1b ${miss1 ? `seen at ${((miss1.seenMs - A.R.house.goAtMs) / 1000).toFixed(2)} s, his par ${A.R.house.parMs} ms missed` : 'not missed'}; the lane ${A.R.house.end?.why}`);
      const met1 = A.N.legs[0].contacts.find(c => c.stand === '1b' && c.by === 'me')?.parMet ?? null;
      console.log(`      1b's par now ${met1}`);
      assert(A.r.done && mine1.length === 2 && !miss1 && met1 === true, JSON.stringify({ mine: mine1.map(T => T.stand), miss: A.cs.map(c => c.stand), met1 }));
    },
  },
];
