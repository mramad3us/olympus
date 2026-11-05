// OLYMPUS render: a floor plan's walls, as the cutaway stands them: the sim's one wall rule, re-exported.
//
// tradecraft's rule (src/sim/interiors/plan.js, DESIGN.md Look: "cutaways so interiors read from
// above"): a plan is rooms (axis-aligned rectangles) and openings; its walls are the rooms' edges,
// merged along each line and cut where an opening is. The north boundary stands to the ceiling
// (WALL_H_M), the west and east ones too (seen edge on), every other wall is cut to CUT_H_M; a
// boundary's thickness (OUTER_T_M) lies outside the plan, an inner wall (WALL_T_M) astride its line.
// What is drawn is what blocks: the rule lives once, in src/sim/places/plan.js (the build sheet 0.0.2
// §8 item 4: the nav grid and the cutaway read the same walls), which TECH §2.2's SIM_FOR_VIEW lets
// the render import. This module keeps the render's old import path (cutaway.js, the samples, the
// tests) on it.
// Pure.
export { wallsOf, wallRect, roomAt, WALL_H_M, CUT_H_M, WALL_T_M, OUTER_T_M } from '../sim/places/plan.js';
