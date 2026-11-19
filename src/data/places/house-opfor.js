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

/**
 * v0.0.26, "Bang, then go" (its build sheet §0 items 1 and 4, §3.1; scene.md SC§6.1): room 1 of lane A as set, centre-fed, one man in
 * each marine's sector, both the same two men of the cadre (RP-A your man in the far left corner, RP-B your #2's in the far right).
 * opfor.js reaches them through its seam (rpStandsOf, spotOf) only while the lane's record says so (R.house.bangGo); RP_STANDS and
 * OPFOR_SPOTS are untouched. Each start is the room's far corner hot spot (room.js lanePlanOf's r1:fl, r1:fr), not the board's
 * stand: HOUSE1's 1a and 1b stand 0.25 m off the north wall's line, 0.17 m off its face, inside a C0 body, which the spot rule
 * refuses (my call: the man stands 0.2 m forward of the board, his own corner kept; 3.77 m from the threshold, the board's 4.1).
 * Each hide was found by the same scratch search as v0.0.19's (/private/tmp/claude-501/olympus-build/v026/a/hide.mjs, 2026-11-19):
 * a cell of room 1 by the spot rule (tests/opfor-world.mjs spotCheck), his own side by room.js sectorOf, 3 m or less from his
 * start and no nearer the threshold than 1 m less than it, the dash clear for a C0 body, the farthest off the threshold's line to
 * his start (0.76 m each, 0.9 m along the north wall toward the room's middle; 2.2 m apart). Room 1 is an open box, so the dash buys
 * the entry's surprise, not concealment, as in rooms 2 and 3. They face the far wall ('up'), the door 148° off it, outside the
 * 110° cone, so its leaf turns them; `holds` marks the one man laid on the door from GO when the scene draws the door held
 * (the build sheet §0 item 4: one man, yours; 1b never holds).
 * Each aimAt is on the door's centre line inside the room, not the threshold (the review of A, 2026-11-19; my call): the house's
 * own G-11 lands by the far wall (z 8.14 to 9.76 on 216 of 240 lanes, 20 seeds, every sheet, held and loose), beside the men, and from a far corner
 * the threshold lies 58° off that wall, so a man laid on the threshold faced those bursts 60° to 73° off, outside supp.js
 * FLASH_CONE_DEG 60, and 64 of 240 men in the bang stayed unblinded and fired first. Laid on the funnel 1.3 to 1.5 m inside the
 * door, he faces the whole room: every one of those landings within 54.5° of 1a's facing and 55.5° of 1b's (the most the far
 * corner allows, the starts fixed by the spot rule), the threshold 14.5° off 1a's aim and 17.6° off 1b's, inside react.js
 * SECTOR_HALF_DEG 20, so the held man still takes a marine through the door 'sector'.
 */
export const BREACH_STANDS = Object.freeze(['1a', '1b']);
export const BREACH_SPOTS = deepFreeze({
  '1a': {
    post: 'melas:wheel-house-opfor-a', name: 'the man in the far left corner', door: 'o:w4:r1',
    start: [27.0, 8.5], face: 'up', hide: [27.9, 8.5], dash: [[27.0, 8.5], [27.9, 8.5]], aimAt: [29.0, 10.4], eyes: [29.0, 11.7], holds: true,
  },
  '1b': {
    post: 'melas:wheel-house-opfor-b', name: 'the man in the far right corner', door: 'o:w4:r1',
    start: [31.0, 8.5], face: 'up', hide: [30.1, 8.5], dash: [[31.0, 8.5], [30.1, 8.5]], aimAt: [29.0, 10.2], eyes: [29.0, 11.7],
  },
});

/**
 * The cadre's cards by lane room, weighted (opfor.md §1: room 2's man fight 7, give 3; room 3's fight 4, hide 4, give 2). v0.0.22 (its
 * build sheet §0 item 18, G5): keyed by the lane room ('2', '3'), not the set's stand ('2a', '3a'), so a drawn house's post in a lane
 * room is briefed as the set's man of that room; the stream stays keyed by stand (opfor.js drawCards), so the set's cards are v0.0.21's.
 */
export const RP_CARD_WEIGHTS = deepFreeze({ 2: [['fight', 7], ['give', 3]], 3: [['fight', 4], ['hide', 4], ['give', 2]] });

/** The role-players' quality (COMBAT §7.9's q: corporate security's 0.6, a security-grade fighter), the same every run (the build sheet §13 question 8). */
export const RP_QUALITY = 0.6;
/** Their doctrine on §7.11's table (police and security: cover; surrender pinned with a marine's weapon within 5 m) and their sheet's class (supp.js HARD_K's 'cop'). */
export const RP_DOCTRINE = 'security', RP_CLASS = 'cop';
/** Their inoculation (supp.js's counter; my call: a cadre role-player's drills, so corporate security's hardening 16 at Warfighting 22). */
export const RP_INOC = 3;
