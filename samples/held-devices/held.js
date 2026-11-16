// OLYMPUS sample data: the held devices' candidates, as poses the game's figure code draws (samples/held-devices; kit-10 of the v0.0.18 hunt).
//
// With a G-11 armed in your hand, the halligan at a pry, the ram at a swing or a charge being placed, the stage's figure draws
// both fists empty and the rifle slung front (look.js gunLook and kitLook carry no device, and beatOf knows the door, the kick,
// the tap and the stack only), so the grenade comes out of nowhere on its flight's first frame. This module holds the candidates
// the user scores, each a set of poses for compose.js (src/art/figures): a given pose's `reach` puts a free hand on a point by
// the rig's IK and its `device` draws the device's parts as capsules between the hands (both hooks are the sample's: no pose of
// the game carries them, so the game's frames are unchanged until the user picks). Every point is [forward, left, up] metres
// from the shoulders' middle (a part's `hand` measures it from that hand's tip instead; `free` names a hand put somewhere that
// holds nothing, the left arm out at the target), at the body's own scale: the chibi's
// shoulders 0.825 m over its soles, its arm 0.39 m long. The devices are drawn bigger than life, as body.js draws the guns: the
// G-11's can 0.25 m (four pixels tall at 16 px/m, three wide), the halligan as long as the rifle (1.0 m), the ram 0.55 to 0.6 m and
// four pixels thick, the strip charge 0.5 m; their colours are the doll's (src/art/doll/worn.js DEVICE_C, by the look's colour
// word of devicetable.js), in letters of their own that only this sample's colours know.
// The candidates (the defaults first, the doll's own choices of v0.0.20, so the stage and the I card agree until scored):
//   G1 the can above the right fist at the chest (the doll's); G2 low at the right hip, the left hand's finger in the ring;
//   G3 the throwing hand cocked at the shoulder, the left arm out at the target;
//   T1 the underhand lob (the arm swung low and through); T2 the short overarm; T3 the bowl round the jamb (the arm out low to
//   the side, the body kept behind the wall);
//   B1 the halligan across the body, the fork high at the viewer's right (the doll's); B2 upright at port arms; B3 on the right
//   shoulder, the fork behind; the pry the same for the three;
//   R1 the ram level at the belly, its face forward (the doll's); R2 hanging at arm's length by its rear handle, swung up only
//   for the strike;
//   C1 the strip upright in the right fist (the doll's); C2 flat across both palms.
// The loops (WEAPONS §12 and COMBAT §25.20's times, devices.js DEVICE_ACTIONS at Weapon handling 10 and the front face): the
// rifle let hang 0.3 s (ACTIONS.hang); the reach 1.2 s; the pin 0.5 s; the throw 0.7 s, the can leaving the hand at its end
// (RELEASE_MS); the force 3.0 s with the halligan, a swing 1.0 s with the ram; the placing 6.0 s, cut to its first and last
// second; the rifle back up 1.0 s (UP_S). Pure.

/** The devices' letters and colours (the doll's DEVICE_C: olive, steel, black, orange). */
export const DEV_COL = Object.freeze({ 'ǧ': 0x5a6238, 'š': 0x8a909c, 'ƶ': 0x2a2c34, 'ő': 0xc8742a });
/** Whether a cell's letter is a device's (either case: an upper-case letter is in shade). */
export const isDevice = (ch) => !!ch && DEV_COL[ch.toLowerCase()] !== undefined;

// ---------- the devices' parts ----------
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** The G-11's can over a fist (its body olive, three pixels wide; its spoon a line of steel down the viewer's left facing you). */
export const can = (hand = 'r') => [
  { hand, a: [0, 0, 0.04], b: [0, 0, 0.14], th: 3, role: 'ǧ', layer: 'over' },
  { hand, a: [0, -0.11, 0.05], b: [0, -0.11, 0.14], th: 1, role: 'š', layer: 'over', dz: 0.001 },
];
/** The pin's ring on a finger: a pixel of steel. */
export const ring = (hand = 'l') => [{ hand, a: [0, 0, 0.02], th: 1, role: 'š', layer: 'over', dz: 0.002 }];
/** The halligan from its pick end p0 to its fork p1: the shaft, the fork's two tines, the adze. */
export const bar = (p0, p1) => [
  { a: p0, b: p1, th: 2, role: 'š', layer: 'under' },
  { a: p1, b: [p1[0] + 0.02, p1[1] + 0.07, p1[2] - 0.03], th: 1, role: 'š', layer: 'under', dz: 0.001 },
  { a: p1, b: [p1[0] + 0.02, p1[1] - 0.04, p1[2] + 0.06], th: 1, role: 'š', layer: 'under', dz: 0.001 },
  { a: p0, b: [p0[0] + 0.06, p0[1] - 0.06, p0[2] - 0.02], th: 1, role: 'Š', layer: 'under', dz: 0.001 },
];
/** The ram from its rear p0 to its striking face p1: the black body, the steel face. */
export const ram = (p0, p1) => {
  const d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], L = Math.hypot(...d), e = d.map(v => v / L);
  return [
    { a: p0, b: p1, th: 4, role: 'ƶ', layer: 'under' },
    { a: [p1[0] - e[0] * 0.02, p1[1] - e[1] * 0.02, p1[2] - e[2] * 0.02], b: [p1[0] + e[0] * 0.03, p1[1] + e[1] * 0.03, p1[2] + e[2] * 0.03], th: 4, role: 'š', layer: 'under', dz: 0.001 },
  ];
};
/** The strip charge from a to b (olive, two pixels), under the fists or (over) laid on the palms. */
export const strip = (a, b, layer = 'under', hand = null) => [{ a, b, th: 2, role: 'ǧ', layer, ...(hand ? { hand } : {}) }];
/** The FD-1's shock tube paid out from the charge's foot to the floor and back along it (orange, a pixel). */
export const tube = (from) => [
  { a: from, b: [from[0], from[1], -0.8], th: 1, role: 'ő', layer: 'under', dz: 0.002 },
  { a: [from[0], from[1], -0.8], b: [-0.7, from[1] + 0.1, -0.8], th: 1, role: 'ő', layer: 'under', dz: 0.002 },
];
/** Hands on a long device at shares along it. */
const along = (p0, p1, kr, kl) => ({ r: kr === null ? null : lerp3(p0, p1, kr), l: kl === null ? null : lerp3(p0, p1, kl) });

// ---------- the candidates ----------
/** The G-11 held between the pin and the throw. */
export const HOLDS = Object.freeze({
  G1: { id: 'G1', name: 'G1 AT THE CHEST, THE DOLL\'S: THE DEFAULT', short: 'G1 AT THE CHEST', hold: { r: [0.22, -0.06, -0.2], dev: can('r') } },
  G2: { id: 'G2', name: 'G2 LOW AT THE HIP, THE RING FINGER', short: 'G2 AT THE HIP', hold: { r: [0.12, -0.2, -0.44], l: [0.13, -0.1, -0.36], dev: [...can('r'), ...ring('l')] } },
  G3: { id: 'G3', name: 'G3 COCKED AT THE SHOULDER', short: 'G3 COCKED', hold: { r: [-0.04, -0.27, 0.1], l: [0.3, 0.06, 0.0], free: 'l', dev: can('r') } },
});
/** The throw: its two frames (the can in the hand) and the follow-through (the hand empty: the flight has it). */
export const THROWS = Object.freeze({
  T1: { id: 'T1', name: 'T1 THE UNDERHAND LOB: THE DEFAULT', short: 'T1 UNDERHAND',
    throw0: { lean: 0.2, r: [-0.14, -0.3, -0.4], dev: can('r') }, throw1: { lean: 0.16, r: [0.34, -0.12, -0.3], dev: can('r') }, after: { lean: 0.12, r: [0.36, -0.06, -0.08] } },
  T2: { id: 'T2', name: 'T2 THE SHORT OVERARM', short: 'T2 OVERARM',
    throw0: { lean: 0.0, r: [-0.1, -0.28, 0.16], l: [0.28, 0.08, 0.0], free: 'l', dev: can('r') }, throw1: { lean: 0.14, r: [0.3, -0.16, 0.06], dev: can('r') }, after: { lean: 0.16, r: [0.32, -0.04, -0.3] } },
  T3: { id: 'T3', name: 'T3 THE BOWL ROUND THE JAMB', short: 'T3 BOWLED',
    throw0: { lean: 0.04, r: [-0.08, -0.4, -0.42], dev: can('r') }, throw1: { lean: 0.06, r: [0.22, -0.46, -0.44], dev: can('r') }, after: { lean: 0.06, r: [0.3, -0.4, -0.36] } },
});
const B1P = [[0.22, -0.3, -0.54], [0.24, 0.26, 0.28]], B2P = [[0.24, -0.12, -0.52], [0.26, 0.1, 0.46]], B3P = [[0.3, -0.26, -0.18], [-0.6, -0.3, 0.25]];
/** The halligan carried. */
export const BARS = Object.freeze({
  B1: { id: 'B1', name: 'B1 ACROSS THE BODY, THE DOLL\'S: THE DEFAULT', short: 'B1 ACROSS', carry: { ...along(...B1P, 0.3, 0.65), dev: bar(...B1P) } },
  B2: { id: 'B2', name: 'B2 AT PORT ARMS', short: 'B2 PORT ARMS', carry: { ...along(...B2P, 0.2, 0.6), dev: bar(...B2P) } },
  B3: { id: 'B3', name: 'B3 ON THE SHOULDER', short: 'B3 SHOULDER', carry: { ...along(...B3P, 0.08, null), dev: bar(...B3P) } },
});
const R1P = [[0.02, -0.25, -0.42], [0.62, 0.02, -0.38]], R2P = [[0.04, -0.34, -0.3], [0.5, -0.34, -0.42]];
/** The ram carried. */
export const RAMS = Object.freeze({
  R1: { id: 'R1', name: 'R1 LEVEL AT THE BELLY, THE DOLL\'S: THE DEFAULT', short: 'R1 AT THE BELLY', carry: { ...along(...R1P, 0.25, 0.6), dev: ram(...R1P) } },
  R2: { id: 'R2', name: 'R2 HANGING, SWUNG UP TO STRIKE', short: 'R2 HANGING', carry: { ...along(...R2P, 0.05, null), dev: ram(...R2P) } },
});
/** The charge carried. */
export const CHARGES = Object.freeze({
  C1: { id: 'C1', name: 'C1 UPRIGHT IN THE FIST, THE DOLL\'S: THE DEFAULT', short: 'C1 UPRIGHT', carry: { r: [0.2, -0.12, -0.3], dev: strip([0, 0, -0.02], [0, 0, 0.3], 'under', 'r') } },
  C2: { id: 'C2', name: 'C2 FLAT ACROSS BOTH PALMS', short: 'C2 ON THE PALMS', carry: { r: [0.22, -0.13, -0.38], l: [0.22, 0.11, -0.38], dev: strip([0.25, -0.2, -0.33], [0.25, 0.18, -0.33], 'over') } },
});

// ---------- the beats the candidates share ----------
const FORCE = {
  // (the fork in at the latch, 1 m up, the bar back to the hands; then the body leaning back on it, the bar's end pulled out to the side)
  force0: { lean: 0.05, ...along([-0.25, -0.15, -0.25], [0.7, 0.0, 0.1], 0.3, 0.55), dev: bar([-0.25, -0.15, -0.25], [0.7, 0.0, 0.1]) },
  force1: { lean: -0.12, ...along([-0.2, -0.45, -0.2], [0.7, 0.0, 0.1], 0.3, 0.55), dev: bar([-0.2, -0.45, -0.2], [0.7, 0.0, 0.1]) },
};
const SWING = {
  // (drawn back at the hip, then the strike forward on the latch side; its face within the figure's cell, 2.0 m wide, as a stance
  // sheet's frame must be: a strike reaching 0.9 m out was cut off at its edge)
  swing0: { lean: -0.04, ...along([-0.3, -0.2, -0.38], [0.38, -0.02, -0.34], 0.2, 0.55), dev: ram([-0.3, -0.2, -0.38], [0.38, -0.02, -0.34]) },
  swing1: { lean: 0.14, ...along([-0.06, -0.12, -0.3], [0.66, 0.0, -0.22], 0.2, 0.55), dev: ram([-0.06, -0.12, -0.3], [0.66, 0.0, -0.22]) },
};
const PLACE = {
  // (both hands at the leaf at shoulder height, the strip up the latch edge; then pressed on; then the hands empty, the tube out)
  place0: { lean: 0.06, r: [0.43, -0.02, 0.1], l: [0.43, 0.02, -0.2], dev: strip([0.45, 0, -0.3], [0.45, 0, 0.2]) },
  place1: { lean: 0.1, r: [0.43, -0.01, 0.0], l: [0.43, 0.01, -0.16], dev: strip([0.45, 0, -0.3], [0.45, 0, 0.2]) },
  placed: { lean: 0.02, dev: [...strip([0.45, 0, -0.3], [0.45, 0, 0.2]), ...tube([0.45, 0, -0.3])] },
};
const COMMON = {
  ready: { rig: 'low' }, hang: {}, raise: { rig: 'raise' },
  // (the G-11 from its pouch on the carrier's left flank, across the body; the pin: the left hand's finger in the ring, then out)
  reachG: { r: [0.04, 0.2, -0.36], dev: can('r') },
  pin: { r: [0.2, -0.04, -0.16], l: [0.21, 0.02, -0.05], dev: can('r') },
  pinOut: { r: [0.2, -0.04, -0.16], l: [0.24, 0.2, -0.12], dev: [...can('r'), ...ring('l')] },
  // (a tool off the back, over the right shoulder; a charge from the right flank's pouch)
  reachB: { ...along([-0.22, 0.12, -0.55], [-0.2, -0.22, 0.32], 0.8, null), dev: bar([-0.22, 0.12, -0.55], [-0.2, -0.22, 0.32]) },
  reachR: { ...along([-0.25, -0.15, -0.3], [-0.2, -0.25, 0.4], 0.75, null), dev: ram([-0.25, -0.15, -0.3], [-0.2, -0.25, 0.4]) },
  reachC: { r: [0.04, -0.24, -0.36], dev: strip([0, 0, -0.02], [0, 0, 0.3], 'under', 'r') },
  // (a tool let go: the hands open, the bar or the ram falling past the knees)
  dropB: { dev: bar([0.2, -0.2, -0.5], [0.4, 0.15, -0.24]) },
  dropR: { dev: ram([0.12, -0.3, -0.42], [0.3, 0.32, -0.4]) },
  ...FORCE, ...SWING, ...PLACE,
};

/** The sets: the candidates, the loop's phases ([label, seconds, frame]) and the still the gallery shoots. */
export const SETS = Object.freeze({
  hold: { cands: HOLDS, param: 'g', def: 'G1', still: 'HELD',
    phases: [['READY', 0.6, 'ready'], ['RIFLE HANGS', 0.3, 'hang'], ['THE POUCH', 1.2, 'reachG'], ['THE PIN', 0.25, 'pin'], ['PIN OUT', 0.25, 'pinOut'], ['HELD', 1.2, 'hold'], ['THROW', 0.35, 'throw0'], ['RELEASE', 0.35, 'throw1'], ['FLIGHT', 0.5, 'after'], ['RIFLE UP', 1.0, 'raise'], ['READY', 0.4, 'ready']] },
  bar: { cands: BARS, param: 'b', def: 'B1', still: 'CARRIED', leaf: 0.78,
    phases: [['READY', 0.5, 'ready'], ['RIFLE HANGS', 0.3, 'hang'], ['OFF THE BACK', 1.2, 'reachB'], ['CARRIED', 1.2, 'carry'], ['THE PRY', 1.5, 'force0'], ['LEANING ON IT', 1.5, 'force1'], ['CARRIED', 0.6, 'carry'], ['LET GO', 0.3, 'dropB'], ['RIFLE UP', 1.0, 'raise'], ['READY', 0.4, 'ready']] },
  ram: { cands: RAMS, param: 'r', def: 'R1', still: 'CARRIED', leaf: 0.74,
    phases: [['READY', 0.5, 'ready'], ['RIFLE HANGS', 0.3, 'hang'], ['OFF THE BACK', 1.2, 'reachR'], ['CARRIED', 1.2, 'carry'], ['DRAWN BACK', 0.5, 'swing0'], ['THE STRIKE', 0.5, 'swing1'], ['CARRIED', 0.6, 'carry'], ['LET GO', 0.3, 'dropR'], ['RIFLE UP', 1.0, 'raise'], ['READY', 0.4, 'ready']] },
  charge: { cands: CHARGES, param: 'c', def: 'C1', still: 'CARRIED', leaf: 0.5,
    phases: [['READY', 0.5, 'ready'], ['RIFLE HANGS', 0.3, 'hang'], ['THE POUCH', 1.2, 'reachC'], ['CARRIED', 1.2, 'carry'], ['PLACING 1ST S', 1.0, 'place0'], ['4 S CUT, LAST S', 1.0, 'place1'], ['PLACED, TUBE OUT', 1.0, 'placed'], ['RIFLE UP', 1.0, 'raise'], ['READY', 0.4, 'ready']] },
});
/** The frames with a door leaf in front (the side-on picture draws it): the pry, the swing, the placing. */
export const AT_LEAF = new Set(['force0', 'force1', 'swing0', 'swing1', 'place0', 'place1', 'placed']);

/** A frame's spec for a set and its candidate (the throw's by `t`, the default T1 unless given). */
export function specOf(set, cand, frame, t = 'T1') {
  const S = SETS[set], C = S?.cands[cand] ?? S?.cands[S.def];
  if (frame === 'hold') return C.hold;
  if (frame === 'carry') return C.carry;
  if (frame === 'throw0' || frame === 'throw1' || frame === 'after') return (THROWS[t] ?? THROWS.T1)[frame];
  return COMMON[frame] ?? COMMON.ready;
}

/**
 * The pose compose.js draws for a spec over the stack's legs (walk.js beatPose('stack') at the low ready: crouched, bladed,
 * the knees bent): the rifle low for 'low', coming up for 'raise', else slung in front (the hands-full rule), the hands put
 * where the spec says (a hand it leaves out hangs), the device's parts.
 */
export function poseFor(spec, stackPose) {
  const rig = spec.rig === 'low' ? stackPose.rig : spec.rig === 'raise' ? { mode: 'raise', gun: 'rifle' } : { mode: 'front', gun: 'rifle' };
  const reach = spec.r || spec.l ? { r: spec.r ?? null, l: spec.l ?? null } : null;
  return { ...stackPose, lean: spec.lean ?? stackPose.lean, rig, ...(reach ? { reach } : {}), ...(spec.dev ? { device: { parts: spec.dev, ...(spec.only ? { only: true } : {}) } } : {}) };
}

/** The phase at t s of a loop: { i, label, frame, u (seconds into it), s }. */
export function phaseAt(phases, t) {
  const L = phases.reduce((a, p) => a + p[1], 0);
  let s = ((t % L) + L) % L;
  for (let i = 0; i < phases.length; i++) { if (s < phases[i][1]) return { i, label: phases[i][0], frame: phases[i][2], u: s, s: phases[i][1] }; s -= phases[i][1]; }
  return { i: 0, label: phases[0][0], frame: phases[0][2], u: 0, s: phases[0][1] };
}
/** The loop's length (s) and the middle of its first phase labelled `label` (the gallery's still). */
export const loopS = (phases) => phases.reduce((a, p) => a + p[1], 0);
export function stillT(phases, label) {
  let t = 0;
  for (const p of phases) { if (p[0] === label) return t + p[1] / 2; t += p[1]; }
  return 0;
}
