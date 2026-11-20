// OLYMPUS sample tool: the corner aid's rooms in node, for the corner-aid sample (v0.0.28; the user's note of 2026-11-20 on the angles
// drawn on the floor, "we need a slicker way of doing it").
//
//   node samples/corner-aid/make.mjs
//
// Writes scene.json: for room 1 at its entry and room 3 (the house as set, seed 48213, the private), the plan's walls round the room
// (src/sim/places/plan.js wallsOf, the cutaway's own), the room's rects, your and your #2's corner marks as the stage's look gives them
// (src/sim/combat/corner.js cornerTableOf, the shoot house's cornerAidLook's fields) and your sector's wedge (corner.js sectorWedgeOf:
// its rays, its arc, and from v0.0.28 where each edge meets its wall). The sample's page draws them both ways (./aid.js).
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGame } from '../../tests/game.mjs';
import { lanePlanOf } from '../../src/sim/combat/room.js';
import { cornerTableOf, sectorWedgeOf, pointOfRule } from '../../src/sim/combat/corner.js';
import { areaOf } from '../../src/sim/places/model.js';
import { planOf, wallsOf, wallRect } from '../../src/sim/places/plan.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const rooms = [];
for (const [name, setup, door] of [['ROOM 1, ON ENTRY', 'room:1', 'o:w4:r1'], ['ROOM 3, AN L', 'room:3', 'o:w4:r3']]) {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup }), s = g.state, P = lanePlanOf(s).plans[door], T = cornerTableOf(P), W = sectorWedgeOf(P, T[0]);
  const xs = P.rects.flatMap(r => [r[0], r[2]]), zs = P.rects.flatMap(r => [r[1], r[3]]), win = [Math.min(...xs) - 0.6, Math.min(...zs) - 0.6, Math.max(...xs) + 0.6, Math.max(...zs) + 0.6];
  const walls = wallsOf(planOf(areaOf(s.places.live.area))).map(wallRect).filter(r => r.x1 >= win[0] && r.x0 <= win[2] && r.z1 >= win[1] && r.z0 <= win[3]).map(r => [r.x0, r.z0, r.x1, r.z1]);
  const marks = T.map(r => ({ slot: r.slot, mine: r.slot === 1, k: 1, corner: { x: r.corner.x, z: r.corner.z, along: r.corner.along, back: r.corner.back }, point: pointOfRule(r) }));
  rooms.push({ name, window: win, rects: P.rects, walls, marks, sector: { k: 1, ...W } });
}
writeFileSync(path.join(HERE, 'scene.json'), `${JSON.stringify({ seed: 48213, tier: 'private', rooms })}\n`);
console.log(`scene.json: ${rooms.map(r => `${r.name}: ${r.walls.length} walls, ${r.marks.length} marks, the sector's walls ${JSON.stringify(r.sector.walls)}`).join('; ')}`);
