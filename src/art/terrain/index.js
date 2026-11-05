// OLYMPUS art: the terrain, in one place. The valley floor, its rocks and drifts, a canyon wall where one shows.
//
// ground.js paints the ground a chunk at a time in world pixels (regolith, dust lying, tracks, boot
// prints) and lays sinter-slab paths; rocks.js builds boulders from boxes and heaps dust in a wall's lee;
// scarp.js stands a south-facing face of the canyon's layered deposits with its talus. All of it goes into
// an area as boxes and flat pieces (src/render/batch.js), so a stretch of the valley floor with its rocks
// and a wall behind is one draw call, like a room.
// Pure.
export * from './ground.js';
export * from './rocks.js';
export * from './scarp.js';
