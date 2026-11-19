// OLYMPUS tests: the instructor's sterile check walks round the walls, and goes home to the booth before GO (the review of
// 2026-11-18 of the build sheet v0.0.23 item 17, carried DC3; COMBAT §25.10).
//
// DC3 walked the instructor on the floor from his post in the booth (33, 9.9) to you in the hall in a straight line: through the
// booth's south wall (z 12) on every live lane, the set's and the drawn houses', and through the booth's west wall and room 1 when
// you walked west during the brief (19 ticks inside walls on 48213). After the looks he stood in the open hall, 3.4 m from you, until
// GO lifted him 28 m to the catwalk in plain sight. Now his floor walk is the nav's (route.js routed): out of the booth by its door,
// which he opens as he sets out, round by the apron and the hall's east doorway; and once both looks are done he walks home and shuts
// the booth's door, so GO lifts him from the shut booth, out of view, as before DC3. Over each lane from the fill to GO, every tick:
// his body never inside a wall's rectangle or a leaf not swung fully open; on GO's tick, the place he is lifted from is his post in
// the booth with its door shut. Lanes: the sergeant by the honest bot on 48213 (live:fight,hide), standing still and walking west for
// 8 s of the brief first; the private on a drawn live lane, seed 2. Prints each lane's ticks, the looks, home and GO.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot } from './bots/house.mjs';
import { areaOf, openingState } from '../src/sim/places/model.js';
import { planOf, wallsOf, wallRect, leafRect } from '../src/sim/places/plan.js';
import { leafAt, turns } from '../src/sim/places/doors.js';
import { houseSpecOf } from '../src/sim/scenes/assemble.js';

const LANES = Object.freeze([
  { cell: 'sgt/48213/live:fight,hide', tier: 'sgt', seed: 48213, opfor: 'live:fight,hide' },
  { cell: 'sgt/48213/live:fight,hide, walking west', tier: 'sgt', seed: 48213, opfor: 'live:fight,hide', west: [2_000, 10_000] },
  { cell: 'private/2/live/drawn', tier: 'private', seed: 2, opfor: 'live', fill: { draw: 'drawn' } },
]);
const inRect = (r, x, z) => x > r.x0 + 0.01 && x < r.x1 - 0.01 && z > r.z0 + 0.01 && z < r.z1 - 0.01;

export default [
  {
    name: 'the instructor\'s sterile check is walked round the walls and he goes home: from the fill to GO never inside a wall or a leaf not open, and GO lifts him from his post in the shut booth (the review of 2026-11-18: through the booth\'s wall on every live lane, through room walls when you moved, and lifted 28 m from the open hall in plain sight)',
    fn() {
      const bad = [];
      for (const L of LANES) {
        const g = createGame({ scenario: 'test-shoothouse', seed: L.seed, tier: L.tier, opfor: L.opfor, ...(L.fill ?? {}) }), s = g.state, t0 = s.clock.ms;
        const R = s.armoury.range, H = R.house, area = areaOf(s.places.live.area), walls = wallsOf(planOf(area)).map(wallRect);
        const leaves = (area.openings ?? []).filter(turns), B = houseSpecOf(s).booth, door = leaves.find(o => (o.rooms ?? []).includes(B.room));
        const boothRect = area.rooms.find(r => r.id === B.room)?.rect;
        const bot = houseHonestBot();
        let ticks = 0, inWall = 0, inLeaf = 0, homeMs = null, prev = null, lift = null;
        const first = [];
        for (let i = 0; i < 4000 && H.goAtMs === null; i++) {
          const t = s.clock.ms - t0;
          if (L.west && t >= L.west[0] && t < L.west[1]) g.step(1, { mx: -1, mz: 0 }); else g.step(1, bot);
          g.clearFacts?.();
          const c = s.actors.list.find(a => a.who === H.chiefPid);
          if (!c) continue;
          if (H.goAtMs !== null) { lift = prev; break; }
          ticks++;
          if (c.y === undefined || c.y === null || c.y === 0) {
            const w = walls.find(r => inRect(r, c.x, c.z)), lf = leaves.find(o => leafAt(s, o.id) < 1 && inRect(leafRect(o), c.x, c.z));
            if (w) { inWall++; if (first.length < 3) first.push(`${(t / 1000).toFixed(2)} s in a wall at ${c.x.toFixed(2)}, ${c.z.toFixed(2)}`); }
            if (lf) { inLeaf++; if (first.length < 3) first.push(`${(t / 1000).toFixed(2)} s in ${lf.id}'s leaf at ${c.x.toFixed(2)}, ${c.z.toFixed(2)}`); }
          }
          if (homeMs === null && H.sterile?.home === 'in') homeMs = t;
          prev = { x: c.x, z: c.z, door: door ? openingState(s, door) : null, leaf: door ? leafAt(s, door.id) : null };
        }
        const S = H.sterile, looks = S ? Object.values(S.done).map(ms => ((ms - t0) / 1000).toFixed(2)) : [];
        const home = !!lift && !!boothRect && lift.x > boothRect[0] && lift.x < boothRect[2] && lift.z > boothRect[1] && lift.z < boothRect[3] && Math.hypot(lift.x - B.x, lift.z - B.z) <= 0.05;
        const shut = !!lift && lift.door === 'closed' && lift.leaf === 0;
        console.log(`      ${L.cell}: ${ticks} ticks from the fill to GO; in a wall ${inWall}, in a leaf not open ${inLeaf}; the looks at ${looks.join(', ')} s; home in the booth at ${homeMs === null ? 'never' : (homeMs / 1000).toFixed(2)} s; GO at ${H.goAtMs === null ? 'never' : ((H.goAtMs - t0) / 1000).toFixed(2)} s, lifted from ${lift ? `${lift.x.toFixed(2)}, ${lift.z.toFixed(2)}, the booth's door ${lift.door}` : '-'}${first.length ? ` (${first.join('; ')})` : ''}`);
        if (inWall || inLeaf) bad.push(`${L.cell}: ${inWall} ticks in a wall, ${inLeaf} in a leaf not open`);
        if (H.goAtMs === null) bad.push(`${L.cell}: never at GO`);
        else if (!home || !shut) bad.push(`${L.cell}: lifted from ${JSON.stringify(lift)}, not his post in the shut booth`);
        if (looks.length !== 2) bad.push(`${L.cell}: ${looks.length} looks`);
      }
      assert(!bad.length, JSON.stringify(bad));
    },
  },
];
