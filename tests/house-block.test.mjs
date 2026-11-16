// You standing on your number two's way in at room 2, his cue given: he calls "Coming in!" after TWO_BLOCK_SAY_MS 1 s, once a
// hold, so you know why he is not with you (the play review of 2026-11-15: in one fuzz room he stayed out 11.9 s while you stood
// across his way 21.9 s, and neither his voice nor the DI said why: the user's "squad AI sometimes stays out of the room on
// entry (room 2)" seen again). Off his way, he goes in, and the call is not said again for that hold.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { setOpening } from '../src/sim/places/model.js';
import { pastThreshold, lanePlanOf } from '../src/sim/combat/room.js';
import { entryGo, crossingClear, crossingOf, TWO_SAY, TWO_BLOCK_SAY_MS } from '../src/sim/combat/bundle.js';
import { liveZoneAt } from '../src/sim/places/zones.js';

const R2 = 'o:w4:r2';

export default [
  {
    name: 'held at room 2\'s stack on his cue by you standing on his way in, your #2 calls "Coming in!" after 1 s, once; you stepping off, he is in (the play review of 2026-11-15)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'room:2' }), s = g.state, H = s.armoury.range.house;
      for (const T of s.armoury.range.turners) T.trigger = { kind: 'never', on: null, gapMs: 0 };
      setOpening(s, R2, 'open', { atMs: s.clock.ms - 5000 });
      const P = lanePlanOf(s).plans[R2], me = s.actors.list.find(a => a.who === s.player.id), two = s.actors.list.find(a => a.who === H.twoPid);
      // (you in the doorway on his lane (v0.0.19: past it, on his side, he takes yours instead, FM 3-06.11 §3-29, tests/two-side): the
      // last point of his lane inside the no-stop zone, as deep as the doorway goes; v0.0.18's case stood you at (20.6, 15.6))
      const inZone = (x, z) => !!liveZoneAt(s, s.places.live.area, x, z), way = crossingOf(P.paths[2], P.paths[2][0], inZone);
      let at = way[0]; for (let i = 1; i < way.length; i++) for (let k = 0; k <= 20; k++) { const p = [way[i - 1][0] + (way[i][0] - way[i - 1][0]) * k / 20, way[i - 1][1] + (way[i][1] - way[i - 1][1]) * k / 20]; if (inZone(p[0], p[1]) && pastThreshold(P, p[0], p[1])) at = p; }
      me.x = at[0]; me.z = at[1]; me.$px = me.x; me.$pz = me.z; delete me.v;
      const cued = entryGo(s, P, me, s.clock.ms), blocked = !crossingClear(s, P.paths[2], [two.x, two.z]);
      const t0 = s.clock.ms, calls = [];
      let inAt = null, cueAt = cued ? 0 : null;
      for (let t = 0; t < 120; t++) {
        // (at 3 s you step off his way, onto your own point)
        if (t === 60) { me.x = P.points[0][0]; me.z = P.points[0][1]; me.$px = me.x; me.$pz = me.z; }
        g.step(1, s.stop ? { act: [stepAct('leave')] } : {});
        for (const [type, d] of g.bus.events) if (type === 'say' && d.who === H.twoPid && d.text === TWO_SAY.coming) calls.push(s.clock.ms - t0);
        g.clearFacts();
        if (inAt === null && pastThreshold(P, two.x, two.z)) inAt = s.clock.ms - t0;
        if (cueAt === null && entryGo(s, P, me, s.clock.ms, s.armoury.range.house.rooms[1])) cueAt = s.clock.ms - t0;
      }
      console.log(`      you in the doorway on his way in at (${fmt(me.x, 2)}, ${fmt(me.z, 2)}) (cued ${cued}, at +${cueAt} ms, his way blocked ${blocked}, his side ${s.armoury.range.house.two.side ? 'swapped' : 'kept'}): "${TWO_SAY.coming}" at ${calls.map(ms => `+${fmt(ms / 1000, 2)} s`).join(', ') || 'never'}; you off it at +3.00 s, he past the threshold at ${inAt === null ? 'never' : `+${fmt(inAt / 1000, 2)} s`}`);
      // (v0.0.19: in the doorway his cue comes ENTRY_WAIT_MS after you stopped inside (bundle.js entryGo), and his call TWO_BLOCK_SAY_MS after it)
      assert(cueAt !== null && blocked && calls.length === 1 && calls[0] - cueAt >= TWO_BLOCK_SAY_MS - 50 && calls[0] - cueAt <= TWO_BLOCK_SAY_MS + 100 && !s.armoury.range.house.two.side, JSON.stringify({ cued, cueAt, blocked, calls }));
      assert(inAt !== null && inAt > 3000, JSON.stringify({ inAt }));
    },
  },
];
