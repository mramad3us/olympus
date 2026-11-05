// OLYMPUS places: lightLevel(state, x, z, ms), the light at a point, the one helper every reader of light calls.
//
// TECH correction 14 puts the light helper here, under the name VIEWS uses: perception (PEOPLE §7),
// the fog of awareness, the view's tint of a figure and the shot's sight picture all ask it, so one
// quantity has one number on every screen (the hub). At 0.0.4 it is tradecraft v0.2.0-rc3
// `src/sim/light.js` (143 lines) adapted: the Mars sun at Melas (Mars24, through TIME's sunAt and
// PLACES's horizonAt), the rooms' lighting states (day, evening, lights out, emergency), the lamps'
// pools and the windows' daylight, computed on the CPU from the same tiled pools the stage draws.
// Until then it is a stub with its final signature: every point is fully lit, 1, whatever the time,
// so nothing that reads it now has to change its call later. The range is [0, 1]: 0 no light at
// all, 1 the light a marine reads print and sees colour by.
// Pure.

/** The light at (x, z) in the live area at game time ms, 0 to 1. A stub: 1 everywhere until 0.0.4. */
export function lightLevel(state, x, z, ms) {
  return 1;
}
