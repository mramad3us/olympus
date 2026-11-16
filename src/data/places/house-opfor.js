// OLYMPUS data: the live lane's role-players in house 1, lane A: where each stands, where he dashes to, what he aims at, and the cadre's cards (COMBAT §7.11, §25.18; the build sheet v0.0.19 §1 L-opfor, §3.3; opfor.md §1, §3).
//
// "Stack and clear, live" puts two role-players in place of stands 2a and 3a (src/sim/scenarios/opfor.js): RP-A in room 2's deep
// corner (2a's place, your sector), RP-B in room 3's near leg's far corner (3a's place, your number two's). Each is authored here,
// the same in every career (the world handcrafted; who stands there is generated: src/data/people/posts.js), HOUSE1's golden
// left alone:
//   post      the staff post that draws him (src/sim/people/staff.js drawStaff)
//   name      his name on the paper and the card ("by the man in the deep corner"), as a stand's (shoothouse.js STANDS)
//   door      the plan's door of his room (src/sim/combat/room.js lanePlanOf): his cue when its leaf moves, and his aim's
//   start     [x, z]: his stand's place (wheel.js HOUSE1.stands); face the four-way face he waits with, the room's door
//             outside his eyes' cone (perception.js eyeOf: a 110° cone on a four-way head), so the door's noise turns him
//             (COMBAT §7.11 step 3) and a quick entry can win the race (§7.8)
//   hide      [x, z]: his one dash's end, cover by §7.11 (a dash of at most DASH_MAX_MS 2 s and 3 m), a cell of his own leg
//   dash      the dash's path, start to hide, clear for a C0 body (tests/opfor-spots.test.mjs)
//   aimAt     [x, z]: where his rifle is laid once he has turned: his door's threshold, where the marines come through
// The spots were found by a scratch search (/private/tmp/claude-501/olympus-build/v019/lopfor/scratch/spots.mjs, 2026-11-16):
// a cell of his leg seen from the plan's point of the slot whose sector holds his start, within its sector, at the stand and the
// crouch layers (room.js coverageOf's rule), BODY_GAP_M + C0 (0.77 m) or more from every path, point and stack point of the plan
// and from every other stand, 0.4 m or more off every wall face, out of every door's swing, 1.5 m or more from room 2's closet
// door, no nearer the threshold than 1 m less than his start, 3 m or less from his start, in the same side as his start by
// room.js sectorOf (so a dash never hands your man to your #2 or his to you: the side is the geometry, manPlace's), and the
// farthest off the threshold's line to his start (the line the entry is looking down: 0.62 m off it for RP-A, 1.33 m for
// RP-B). Both rooms are open boxes: no cell of either leg is out of the threshold's sight, so the dash buys the entry's
// surprise, not concealment (my call, said in the test). RP-A's hide (23.6, 18.5) is 1.12 m from his start toward the room's
// south-west, 3.74 m off the plan's ways; RP-B's (17.4, 5.8) 1.40 m along the north wall toward the bend, 1.98 m off them.
// The cards (the cadre's brief to each, drawn from the seed: opfor.js drawCards) and the opponent's quality are data here, so
// the switch for "the same opponent every run or drawn" is one table (the build sheet §13 question 8). Frozen literals.

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The stands the role-players replace, in the fill's order. */
export const RP_STANDS = Object.freeze(['2a', '3a']);

/** Each role-player's spot (see the header). */
export const OPFOR_SPOTS = deepFreeze({
  '2a': {
    post: 'melas:wheel-house-opfor-a', name: 'the man in the deep corner', door: 'o:w4:r2',
    start: [24.7, 18.7], face: 'right', hide: [23.6, 18.5], dash: [[24.7, 18.7], [23.6, 18.5]], aimAt: [20.6, 14.7],
  },
  '3a': {
    post: 'melas:wheel-house-opfor-b', name: "the man in the near leg's far corner", door: 'o:w4:r3',
    start: [16.0, 5.7], face: 'right', hide: [17.4, 5.8], dash: [[16.0, 5.7], [17.4, 5.8]], aimAt: [17.5, 11.7],
  },
});

/** The cadre's cards by stand, weighted (opfor.md §1: RP-A fight 7, give 3; RP-B fight 4, hide 4, give 2). */
export const RP_CARD_WEIGHTS = deepFreeze({ '2a': [['fight', 7], ['give', 3]], '3a': [['fight', 4], ['hide', 4], ['give', 2]] });

/** The role-players' quality (COMBAT §7.9's q: corporate security's 0.6, a security-grade fighter), the same every run (the build sheet §13 question 8). */
export const RP_QUALITY = 0.6;
/** Their doctrine on §7.11's table (police and security: cover; surrender pinned with a marine's weapon within 5 m) and their sheet's class (supp.js HARD_K's 'cop'). */
export const RP_DOCTRINE = 'security', RP_CLASS = 'cop';
/** Their inoculation (supp.js's counter; my call: a cadre role-player's drills, so corporate security's hardening 16 at Warfighting 22). */
export const RP_INOC = 3;
