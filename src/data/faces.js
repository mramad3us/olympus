// OLYMPUS data: the six faces a body or a board stands on, and how the picture turns each (the build sheet v0.0.25 items 7, 8 and 12, §3.4; PC§3.2, PC§5).
//
// A compartment has six faces: the deck (the floor the plan is drawn on), the deckhead over it, and four bulkheads, named as a
// ship names them in the Wreck's frame (src/data/places/wreck.js: x starboard, z ventral): 'port' the west bulkhead (x small),
// 'starboard' the east, 'dorsal' the north (z small), 'ventral' the south. A body or a board on a face has its up along the face's
// normal into the compartment. The stage's camera looks north and down at 45°, so on the picture a point at height y over plan
// spot (x, z) shows where the ground at z − y does (VIEWS §2.1): a body's up on the deck and on the ventral bulkhead (−z, north)
// both point up the picture, on the deckhead and the dorsal bulkhead (+z, south) down it, on the port bulkhead (+x) to the right,
// on the starboard (−x) to the left. FACE_QUARTERS is where that up points in quarter turns counter-clockwise on the picture (0 up,
// 1 left, 2 down, 3 right). STAGE_TURNS is how the stage draws a card for it, as samples/wreck-faces draws every candidate (its
// TURN, the place lens's table): the deck and the ventral bulkhead upright, the deckhead and the dorsal bulkhead flipped top to bottom
// (head down, the facing kept), starboard and port a quarter turn, the feet to the face (src/art/figures/poses.js faceCard, the
// boards by src/render/range-items.js boardPixels); a portrait is turned by quarter turns (samples/portrait-faces R-a's half turn).
// rollOf(viewer, subject) is the quarter turns between two bodies' ups as the viewer's picture has them (src/sim/people/seen.js
// seenOf's roll): 0 sharing a face (or two faces whose ups the picture draws alike), 2 the deck and the deckhead, 1 or 3 across a
// side bulkhead (PC§5 item 1). One quantity, one table: both are read from FACE_QUARTERS.
// Absent means the deck everywhere (actor.onFace, a stand's onFace: every shipped body and board), so nothing shipped turns.
// Pure: frozen data and two lookups.

/** The six faces (the sheet's §0 item 11: `onFace`, never `face`, which is a body's facing and a board's paint). */
export const ON_FACES = Object.freeze(['deck', 'deckhead', 'port', 'starboard', 'dorsal', 'ventral']);
/** Each face's turn on the picture, quarter turns counter-clockwise (see the header). */
export const FACE_QUARTERS = Object.freeze({ deck: 0, ventral: 0, deckhead: 2, dorsal: 2, starboard: 1, port: 3 });
/** How the stage turns a card on each face (see the header): { quarter (counter-clockwise), flip (top to bottom, about the feet) }. */
export const STAGE_TURNS = Object.freeze(Object.fromEntries(Object.entries(FACE_QUARTERS).map(([f, q]) => [f, Object.freeze(q === 2 ? { quarter: 0, flip: true } : { quarter: q, flip: false })])));
/** A face's stage turn (absent or unknown: the deck's, upright). */
export const stageTurnOf = (onFace) => STAGE_TURNS[onFace] ?? STAGE_TURNS.deck;
/** A face's quarter turns (absent or unknown: the deck's 0). */
export const quarterOf = (onFace) => FACE_QUARTERS[onFace] ?? 0;
/** The quarter turns from a viewer's up to a subject's on the viewer's picture, 0 to 3 (see the header). */
export const rollOf = (viewer, subject) => (quarterOf(subject) - quarterOf(viewer) + 4) % 4;
