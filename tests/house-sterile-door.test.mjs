// OLYMPUS tests: the instructor's sterile check opens a room's shut door to reach you, never walks through it (the code review of
// v0.0.23, its sixth finding; COMBAT §25.10).
//
// His floor walk is the nav's (route.js routed, the booth's door open), but routed solves a way blocked by a shut leaf on the
// all-open grid: with you behind room 1's shut door before LOAD (the sergeant on 48213, live:fight,hide, placed at room 1's middle
// and its door shut at the fill), his way went through room 1's leaf, 3 ticks inside it, the door never opened. From v0.0.23's
// fixer he opens the doors on his way as he sets out (shoothouse.js sterileDoors, H.sterile.opened, additive), as he opens the
// booth's. From the fill to GO, every tick: his body never inside a wall's rectangle or a leaf not swung fully open; both looks
// done; room 1's door opened by him. Fails without sterileDoors.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { areaOf, openingState, setOpening } from '../src/sim/places/model.js';
import { planOf, wallsOf, wallRect, leafRect } from '../src/sim/places/plan.js';
import { leafAt, turns } from '../src/sim/places/doors.js';

const inRect = (r, x, z) => x > r.x0 + 0.01 && x < r.x1 - 0.01 && z > r.z0 + 0.01 && z < r.z1 - 0.01;

export default [
  {
    name: 'you behind room 1\'s shut door before LOAD (the sergeant, 48213, live:fight,hide): the instructor opens it to reach you, never inside a wall or a shut leaf, both looks done (the code review of v0.0.23: through room 1\'s leaf for 3 ticks)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live:fight,hide' }), s = g.state, H = s.armoury.range.house;
      const area = areaOf(s.places.live.area), walls = wallsOf(planOf(area)).map(wallRect), leaves = (area.openings ?? []).filter(turns);
      const room = area.rooms.find(r => r.id.endsWith('.r1')), door = leaves.find(o => (o.rooms ?? []).includes(room.id));
      const me = s.actors.list.find(a => a.who === s.player.id);
      me.x = (room.rect[0] + room.rect[2]) / 2; me.z = (room.rect[1] + room.rect[3]) / 2;
      if (openingState(s, door) !== 'closed') setOpening(s, door.id, 'closed');
      let ticks = 0, bad = 0, first = null, openedAt = null;
      for (let i = 0; i < 3000 && !(H.sterile?.home === 'in'); i++) {
        g.step(1, {}); g.clearFacts?.();
        if (openedAt === null && openingState(s, door) !== 'closed') openedAt = i;
        const c = s.actors.list.find(a => a.who === H.chiefPid);
        if (!c || (c.y ?? 0) !== 0) continue;
        ticks++;
        const w = walls.find(r => inRect(r, c.x, c.z)), lf = leaves.find(o => leafAt(s, o.id) < 1 && inRect(leafRect(o), c.x, c.z));
        if (w || lf) { bad++; first ??= `${i} at ${c.x.toFixed(2)}, ${c.z.toFixed(2)}${lf ? ` in ${lf.id}'s leaf` : ' in a wall'}`; }
      }
      const looks = Object.keys(H.sterile?.done ?? {}).length;
      console.log(`      you at room 1's middle, its door shut: ${ticks} ticks on the floor, ${bad} inside a wall or a shut leaf${first ? ` (first: tick ${first})` : ''}; room 1's door opened at tick ${openedAt ?? 'never'} (by him: ${JSON.stringify(H.sterile?.opened ?? [])}); ${looks} looks; home ${H.sterile?.home ?? 'no'}`);
      assert(bad === 0 && looks === 2 && (H.sterile?.opened ?? []).includes(door.id), JSON.stringify({ bad, first, looks, opened: H.sterile?.opened ?? null }));
    },
  },
];
