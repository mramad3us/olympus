// The brass on the KD (src/sim/arms/brass.js; WEAPONS §2.8, §10.4; the build sheet 0.0.7 §2.3, §5.3): every case at rest kept and counted on its tile past the live list's 64, the player's picked up within 4 m and nobody else's.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { settle, police, policeOf, brassNear, brassLeft, tilesLook, POLICE_M } from '../src/sim/arms/brass.js';
import { BRASS_LIVE, ejectCase, caseGMs2 } from '../src/sim/arms/look.js';

export default [
  {
    name: '300 cases of six shooters at rest on their 1 m tiles: none lost past the live list\'s 64, the player\'s counted apart; a police picks up the player\'s within 4 m only, a gunner\'s police theirs alone',
    fn() {
      const g = createGame({ scenario: 'test-range', seed: 48213, setup: 'confirm' }), s = g.state, R = s.armoury.range, me = s.player.id;
      const shooters = [me, ...R.relay.map(G => G.pid)], t0 = s.clock.ms;
      // (fifty cases each, thrown from where they lie prone, landed long before the count)
      let thrown = 0, peak = 0;
      for (let k = 0; k < 50; k++) for (const who of shooters) {
        const a = s.actors.list.find(x => x.who === who);
        R.brass.push({ ...ejectCase({ model: 'r7' }, { x: a.x, z: a.z, headRad: 0, stance: 'prone' }, { atMs: t0 + k * 100, kind: 'case', key: `${who}:${k}`, gMs2: caseGMs2(s) }), who });
        thrown++;
        if (R.brass.length > BRASS_LIVE) { peak = Math.max(peak, R.brass.length); settle(s, t0 + k * 100 + 5000); }
      }
      settle(s, t0 + 60_000);
      const left = brassLeft(s), tiles = tilesLook(s);
      console.log(`      ${thrown} cases thrown by ${shooters.length} shooters; the live list peaked at ${peak} before settling, now ${R.brass.length}; on ${tiles.length} tiles ${left.n} cases, the player's ${left.mine}`);
      assert(left.n === thrown && left.mine === 50 && R.brass.length === 0, JSON.stringify(left));
      const near = brassNear(s, me, POLICE_M), got = police(s, me), after = brassLeft(s);
      console.log(`      within ${POLICE_M} m of you: ${near.n} cases, ${near.mine} yours; police picked up ${got.cases}; left ${after.n} (yours ${after.mine}), policed ${R.policed}`);
      assert(got.cases === near.mine && after.n === thrown - got.cases && after.mine === 50 - got.cases && got.cases === 50, `${JSON.stringify({ near, got, after })}`);
      const G = R.relay[0], theirs = policeOf(s, G.pid), last = brassLeft(s);
      console.log(`      ${G.pid}'s police: ${theirs} of theirs; left ${last.n}, yours ${last.mine}`);
      assert(theirs === 50 && last.n === thrown - 100 && last.mine === 0, JSON.stringify({ theirs, last }));
    },
  },
];
