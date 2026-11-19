// OLYMPUS tests: a steel compartment in free fall, for free fall's suites (freefall, recoil-float, brass-free; the build sheet v0.0.24 §1 B, §6 B).
//
// floatRoom(opts) is the sandbox (test-rooms) as its fill makes it, under `&env=ship-coast` (0 G, the Martian indoor air: a
// coasting deck), the player moved into a generated copy of its bay (places/model.js registerArea, id 'test.rooms~float' or
// '~floatH' with holds): the bay's 11.6 × 7.7 m alone, no fixture, no opening, so its four walls are the only faces, its floor
// steel plate (`deckPlate`: ferrous, no holds) or, with holds, a plate with handholds on the grid (SURFACES.plateGrid and the
// area's `holds` rule where step 5 built them, else the grating's handholds). Nothing here is a scene's: it is the place the
// float meets, a room you can drift across and land on the far wall of. The player stands at the bay's middle (25.8, 6.25), with
// holds 0.3 m west of the pad-eye nearest it, unless `at` says, facing east. Returns { g, s, pid, me(), area, room: { x0, z0, x1, z1 } }.
import { createGame } from './game.mjs';
import { TEST_AREA } from '../src/data/places/testroom.js';
import { SURFACES } from '../src/data/places/env.js';
import { registerArea, areaOf, holdNear } from '../src/sim/places/model.js';

/** The bay's rect (m) and its middle. */
export const BAY = Object.freeze({ x0: 20, z0: 2.4, x1: 31.6, z1: 10.1 }), MID = Object.freeze([25.8, 6.25]);

// (the bay copied as a generated area, its floor's kind the surface asked)
function bayArea(id, surface, holds) {
  const bay = TEST_AREA.rooms.find(r => r.id === 't1.bay');
  const room = { ...bay, id: `t1${id.slice(id.indexOf('~'))}.bay`, zone: 't1.z.float', floor: { ...bay.floor, kind: surface }, surface };
  return { id, site: 'test', kind: 'floor', code: 't1f', name: 'A steel bay', level: 1, originM: [0, 0, 0], boundsM: { x0: BAY.x0, z0: BAY.z0, x1: BAY.x1, z1: BAY.z1 },
    spawn: { x: MID[0], z: MID[1], face: 'right' }, rooms: [room], openings: [], fixtures: [], zones: [{ id: 't1.z.float', rooms: [room.id] }], portals: [],
    surface, ...(holds ? { holds: { gridM: 1.5, padEyeM: 3, faces: true } } : {}), look: TEST_AREA.look };
}

/** The steel compartment in free fall (see the header). opts: { seed (48213), holds (false), at ([x, z]), env ('ship-coast') }. */
export function floatRoom({ seed = 48213, holds = false, at = null, env = 'ship-coast' } = {}) {
  const id = holds ? 'test.rooms~floatH' : 'test.rooms~float';
  const surface = holds ? (SURFACES.plateGrid ? 'plateGrid' : 'grating') : 'deckPlate';
  if (!areaOf(id)) registerArea(bayArea(id, surface, holds));
  const g = createGame({ scenario: 'sandbox', seed, env }), s = g.state, pid = s.player.id;
  const me = () => s.actors.list.find(a => a.id === s.player.actor);
  s.places.live.area = id;
  const a = me();
  // (with holds and no place asked: 0.3 m west of the pad-eye nearest the bay's middle (model.js holdNear's lattice), within reach)
  const p = at ?? (holds ? (({ x, z }) => [x - 0.3, z])(holdNear(s, MID[0], MID[1], 3, { kind: 'padEye' })) : MID);
  a.x = p[0]; a.z = p[1]; a.face = 'right'; a.headRad = 0;
  return { g, s, pid, me, area: id, room: BAY };
}
