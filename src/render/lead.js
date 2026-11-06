// OLYMPUS render: the weapon mode's lead and your shot's shake. Where the camera leans with a target bracketed. Pure.
//
// VIEWS §2.4 and the build sheet 0.0.5 §2.3: with a target bracketed or aimed, the frame's centre goes
// AIM_LEAD_K of the way from you to it (the arms role's constants, src/sim/arms/look.js: 0.55), clamped
// so you stay EDGE_KEEP_M (2.5 m) inside the frame's edge; the view eases it as it eases the walk's lead
// (view.js, LEAD_S), so the card at 25 m comes into the frame and you stay in it. Your own shot shakes the
// picture SHOT_SHAKE_PX for SHOT_SHAKE_MS of game time, back along the bore (VIEWS §2.4: "your own rifle
// shot 1 px for 2 ticks"; 2 px from the design review of v0.0.5, where 1 px at 16 px/m did not read as a
// shot: my call, the lead's to carry into VIEWS), on the game's clock, so stop motion holds it.
// Pure: no three.js, no DOM.

/**
 * The game time the arms' effects are drawn at, a frame alpha k between the last two ticks: the positions' own,
 * ms − TICK_MS + k × TICK_MS (a shot is stamped at its tick's start and the clock is a tick past it by the first
 * frame drawn, so on ms + k × TICK_MS its flash's strong part fell in a tick never drawn: the runtime review of
 * v0.0.5); held (k 1), the clock itself.
 */
export const fxMsOf = (ms, k, tickMs = 50) => ms - tickMs + k * tickMs;

/** Your own shot's shake: pixels, and game milliseconds (2 px for 2 ticks of 50 ms: see the header). */
export const SHOT_SHAKE_PX = 2, SHOT_SHAKE_MS = 100;

/**
 * The weapon mode's lead, metres off you: [dx, dz] toward the pick, k of the way, each axis clamped so you
 * stay edgeM inside a frame of half-size halfM ([x, z], metres).
 */
export function aimLead(you, pick, halfM, { k = 0.55, edgeM = 2.5 } = {}) {
  if (!you || !pick) return [0, 0];
  const lim = (v, h) => Math.max(-(h - edgeM), Math.min(h - edgeM, v));
  return [lim((pick.x - you.x) * k, halfM[0]), lim((pick.z - you.z) * k, halfM[1])];
}
