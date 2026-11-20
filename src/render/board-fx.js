// OLYMPUS render: the boarding's fx, the dust a round puffs on the face it met and the lock's override panel's lamp (the build sheet v0.0.27 item 12, item 16 and §9's acceptance; "Away the boarding party").
//
// What look.js boardLook gives the stage (null off the boarding) turned into pixels the view's pixel layer draws (render/view.js, a
// decals.js createPixels of BOARD_FX_MAX): a round's puff on the face it met, as a marking round's (range-items.js paintPuffPixels:
// pixels thrown out from the point and thinning over its life, DUST_PUFF_MS 300), pale for the marines' frangible dust and darker for
// the defenders' ball where it holed or dented the face, no hole drawn after (my call: the card counts them); and the panel's lamp,
// two lit pixels a hair in front of its face, amber while the inner hatch is dogged, red while the override is locked out, green once
// the dogs are off (the batch draws the panel once, so its lamp is drawn live here). Pure: no DOM, no three.js.
import { PX_PER_M } from './scale.js';

/** The pixels' cap, the dust's and the ball's grit's colours, the panel lamp's by its state (see the header). */
export const BOARD_FX_MAX = 96;
export const BOARD_FX_C = Object.freeze({ dust: 0xc8c4b8, hole: 0x8a8478, amber: 0xffa23a, green: 0x4ab84a, red: 0xff4a3a });
/**
 * The boarding's fx pixels at game ms (see the header): [{ x, y, z, c, light? }] from look.js boardLook's { dust, panel }. A
 * puff a ring of pixels thrown out from the point and thinning over DUST_PUFF_MS (as a marking round's puff: range-items.js
 * paintPuffPixels' rings); the panel's lamp two lit pixels a hair in front of its face.
 */
export function boardFxPixels(bl, ms, ppm = PX_PER_M) {
  const out = [], P = 1 / ppm;
  for (const d of bl?.dust ?? []) {
    const t = ms - d.atMs, r = 1 + Math.floor(t / 100), gx = (Math.floor(d.x * ppm) + 0.5) * P, gz = (Math.floor(d.z * ppm) + 0.5) * P, y = Math.floor(d.y * ppm) / ppm, c = BOARD_FX_C[d.kind] ?? BOARD_FX_C.dust;
    const ring = [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r], [r, -r], [-r, r]];
    for (const [dx, dy] of ring.slice(0, t < 100 ? 5 : t < 200 ? 9 : 4)) out.push({ x: gx + dx * P, y: y + dy * P, z: gz + 0.02, c });
  }
  const p = bl?.panel;
  if (p) {
    const n = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[p.face] ?? [0, 1], c = BOARD_FX_C[p.lit] ?? BOARD_FX_C.amber, y = Math.floor((p.y + 0.12) * ppm) / ppm;
    for (const k of [0, 1]) out.push({ x: (Math.floor(p.x * ppm) + k + 0.5) * P + n[0] * 0.04, y, z: p.z + n[1] * 0.04, c, light: true });
  }
  return out;
}
