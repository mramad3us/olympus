// OLYMPUS tests: the drawn house's room cases, each held to room.test's rules where the assembler places it (the build sheet v0.0.21 §1 item 1, §6; house lens H2).
//
// A room case is a chunk on a side of the hall with a swing: the centre, the corner and the ell, north or south, push or pull, 12
// in stage 1 (the mirrors' 8 wait for MIRROR_ROOMS). Each is placed in its reference lane (scenes/assemble.js roomCaseOf: the first
// shape that holds it, its first placement) and its plan read as the game reads it (room.js roomPlanOf: the swing derived from the
// drawn opening, the stack checked on its latch side within STACK_SWING_TOL_M 0.02), then held to room.test's rules for layout A's:
// every point 0.4 m or more off every wall's face; the points seeing 98% or more of the floor (the dead space the far walk clears);
// every path and the far walk walkable as drawn, each leg clear on the C0 grid with the doors open and by the walker's own circle at
// 1 cm steps; each path within PATH_TOL_M 0.15 of the chunk's plan as transformed; corner.js's rule taking the plan's own entry
// and point for #1, and the DI's screen words for both men. The flipped rooms are the ones the grid does not flip with (the hall's
// south wall at 14.4 m is off the 0.25 m grid): the transform alone leaves legs cut there, printed as "raw cut", and the fitted
// plan clears them (fails without assemble.js fitPath or the routing: the raw paths cut 2 to 5 legs a flipped case).
// v0.0.22 (its build sheet item 13, §6 A, F75; house lens G2, G5): X4's other five rooms join, each on both sides of the hall with
// both swings (W, D, T, Q push and pull; O's one family 'fed-hinge' under both): 20 cases more, held to the same rules, and two more
// on every case of the eight rooms: no waypoint of one slot's path within WAYPOINT_GAP_M 0.1 m of the other's (x4-plans.js's rule,
// held on the room's authored side: a flipped room's fitted waypoints may move up to PATH_TOL_M, printed),
// and the room's live post valid where it is placed (tests/opfor-world.mjs spotCheck: his start and his hide in the entered room,
// 0.4 m off the walls, BODY_GAP_M + C0 off every way, out of the leaf's swing, seen by a point within its sector at the stand's and
// the crouch's layers, the hide on the start's side). It fails without the chunks (no case) and with the twin's post searched
// without its far walk (the lens's first search put it 0.36 m from the walk's doorway waypoint: house lens §0 item 5).
import { assert } from './helpers.mjs';
import { caseCheck, f75, chunksFresh, CASES, CASES8 } from './flawless-rooms.mjs';

export default [
  {
    name: 'the 12 room cases of stage 1 (the centre, the corner and the ell, north or south of the hall, push or pull), each in its reference lane: every point 0.4 m off the walls, the points seeing 98% of the floor, every path and far walk walkable as drawn and within PATH_TOL_M 0.15 of its transform, the stack on the latch side, the corner rule\'s entry and point the plan\'s, the screen words said (the transform alone cuts legs on every flipped room)',
    fn() {
      const bad = [];
      let rawCutFlipped = 0;
      for (const c of CASES) {
        const r = caseCheck(c);
        console.log(`      ${r.line}`);
        bad.push(...r.bad.filter(b => !/slots' waypoints|the post/.test(b)));
        if (r.flipped) rawCutFlipped += r.rawCut;
      }
      console.log(`      ${CASES.length} cases; the raw transforms of the flipped rooms cut ${rawCutFlipped} legs, the plans as fitted 0${bad.length ? `; off: ${bad.join('; ')}` : ''}`);
      assert(!bad.length && rawCutFlipped > 0, bad.join('\n') || 'no raw cut on a flipped room: the case proves nothing');
    },
  },
  {
    name: 'v0.0.22, F75: X4\'s other five rooms (the long room, the narrow room, the offset room, the room and its back room, the small room), each side of the hall, each swing: 20 cases held to the same rules, the slots\' waypoints 0.1 m apart, and every room\'s live post (the eight rooms\' 32 cases) valid where it stands (spotCheck)',
    fn() {
      const bad = [], posts = [], all = [];
      for (const c of [...CASES8, ...CASES]) {
        const r = caseCheck(c), mine = CASES8.includes(c);
        if (mine) console.log(`      ${r.line}`);
        bad.push(...(mine ? r.bad : r.bad.filter(b => /the post/.test(b))));
        if (r.post) posts.push(`${c.join('')} ${r.post.ok ? 'ok' : 'NOT'}`);
        all.push(mine ? r : { ...r, bad: r.bad.filter(b => /the post/.test(b)) });
      }
      const row = f75(all, chunksFresh());
      console.log(`      ${CASES8.length} new cases, ${posts.length} posts checked (${posts.filter(p => p.endsWith('ok')).length} valid)${bad.length ? `; off: ${bad.join('; ')}` : ''}`);
      console.log(`      ${row.id} ${row.met ? 'MET ' : 'OPEN'} ${row.name}: ${row.value}`);
      assert(!bad.length && posts.length === CASES8.length + CASES.length && row.met, bad.join('\n') || row.value);
    },
  },
];
