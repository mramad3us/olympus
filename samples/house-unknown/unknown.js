// OLYMPUS sample: a house you have not seen, the three looks (pure; main.js decodes the game's pictures and shows the result).
//
// DESIGN.md, 2026-11-17 (U): "we see what is in the rooms before entering them, this should not be the case when we start
// generating procedurally", and its two looks, "black, or the brief's outline". The pictures are the game's own, made by
// ./capture.mjs on the house drawn from seed 48213 at GO and after room 1, each moment twice: today's (go.png, room1.png: the
// unknown house's ship switch off, every room drawn, dimmed by the fog where unseen) and as the game ships it (go-u1.png,
// room1-u1.png: src/render/known.js's known cells and post.js step 2a, each pixel whose own world spot falls on a cell never
// in sight painted UNKNOWN_C; the footprint's outer walls, the catwalk, the booth and the walls' faces toward what you see are
// known and drawn). The unknown pixels are the game's: those UNKNOWN_C in its picture and not in today's (unknownOf), so
// every look covers exactly what the game hides (before the review of 2026-11-18 this module drew a mask of its own, cut
// before B's code: a 0.5 m wall band, a 0.5 m catwalk, no booth, no ring round the cells in sight, each pixel judged by the
// ground under it, so the raised catwalk, the booth and the hall's north wall went black where the game draws them):
//   U1  black (UNKNOWN_C 0x000000, B's constant, the build's default until scored): the game's own picture, pixel for pixel;
//   U2  the unknown pixels hatched in the fog's felt tint (post.js feltTint's cold pale blue at the dark's level) on near black;
//   U3  black with the footprint's floor plan as a faint outline (the brief's outline: the rooms', the closet's, the booth's and
//       the hall's edges on the ground, one pixel in OUTLINE_C where the pixel is unknown), the doors not drawn (where they
//       are is what you find out).
// ?u=U1|U2|U3 picks the look; each picture is today's frame and the look's, at GO and after room 1.
// v0.0.28: the user starred U2 on 2026-11-20 and the game draws it (src/render/known.js UNKNOWN_LOOK, UNKNOWN_C its ground, HATCH_C,
// HATCH_EVERY: this module's HATCH_BASE, HATCH_C and HATCH_EVERY, held equal by tests/samples-portrait.test.mjs); the frames here were
// captured while the game drew U1, black, so the game's unknown pixels are read as U1's black (UNKNOWN_C below, this module's own).
import { glyphOf } from '../../src/art/font.js';

/** The looks, and the sample's default when it was built (the build sheet §5: U1, black; the game draws U2 since the user's star). */
export const LOOKS = Object.freeze(['U1', 'U2', 'U3']), DEFAULT = 'U1';
/** U1's black, the game's unknown when these frames were captured (v0.0.23 to v0.0.27). */
export const UNKNOWN_C = 0x000000;
export const HATCH_BASE = 0x0b0c10, HATCH_C = 0x2b3546, HATCH_EVERY = 5, OUTLINE_C = 0x30343f;
const W0 = 640, H0 = 360, GAP = 4, LABEL_H = 10;
/** The picture's size (sample.json's pixel): today's and the look's, at GO and after room 1. */
export const SIZE = Object.freeze([GAP + 2 * (W0 + GAP), GAP + 2 * (LABEL_H + H0 + GAP)]);
/** The moments, and their pictures' names in the imgs given to picture(): today's and the game's. */
export const MOMENTS = Object.freeze([['go', 'goU1'], ['room1', 'room1U1']]);

const inRect = (x, z, [x0, z0, x1, z1]) => x >= x0 && x < x1 && z >= z0 && z < z1;

/**
 * The game's unknown pixels of a moment (see the header): { unknown: Uint8Array (1 a pixel the game paints UNKNOWN_C and
 * today's does not), n, other (pixels that differ between the two pictures elsewhere: 0 when they are one moment) }.
 */
export function unknownOf(today, game) {
  const unknown = new Uint8Array(game.w * game.h);
  let n = 0, other = 0;
  for (let i = 0; i < unknown.length; i++) {
    const g = game.px[i] & 0xffffff, t = today.px[i] & 0xffffff;
    if (g === UNKNOWN_C && t !== UNKNOWN_C) { unknown[i] = 1; n++; } else if (g !== t) other++;
  }
  return { unknown, n, other };
}

/**
 * A moment's picture with a look (see the header): { w, h, col (0xrrggbb), unknownPx }. today, game: the two pictures as
 * { w, h, px (0xrrggbb a pixel) }; look 'today' gives today's, U1 the game's own, U2 and U3 drawn over the game's unknown pixels.
 */
export function overlay(today, game, m, look, U = unknownOf(today, game)) {
  const { w, h } = game;
  if (look === 'today') return { w, h, col: Int32Array.from(today.px), unknownPx: 0 };
  const col = Int32Array.from(game.px);
  if (look === 'U2') for (let i = 0; i < col.length; i++) if (U.unknown[i]) col[i] = ((i % w) + Math.floor(i / w)) % HATCH_EVERY === 0 ? HATCH_C : HATCH_BASE;
  if (look === 'U3') {
    // (the floor plan's outline on the ground, a pixel wide, where the game hides the pixel: each room's edges)
    const ppm = 16, X = (x) => Math.round(w / 2 + (x - m.camera.x) * ppm), Z = (z) => Math.round(h / 2 + (z - m.camera.z) * ppm);
    for (const r of m.rooms) {
      const [x0, z0, x1, z1] = r.rect, line = (pxA, pyA, pxB, pyB) => {
        for (let px = Math.min(pxA, pxB); px <= Math.max(pxA, pxB); px++) for (let py = Math.min(pyA, pyB); py <= Math.max(pyA, pyB); py++) {
          if (px < 0 || py < 0 || px >= w || py >= h || !U.unknown[py * w + px]) continue;
          col[py * w + px] = OUTLINE_C;
        }
      };
      line(X(x0), Z(z0), X(x1) - 1, Z(z0)); line(X(x0), Z(z1) - 1, X(x1) - 1, Z(z1) - 1); line(X(x0), Z(z0), X(x0), Z(z1) - 1); line(X(x1) - 1, Z(z0), X(x1) - 1, Z(z1) - 1);
    }
  }
  return { w, h, col, unknownPx: U.n };
}

/** The ground spot (m) under a picture pixel's centre, the stage's camera at 16 px/m (for the report). */
const groundOf = (m, w, h, px, py) => [m.camera.x + (px + 0.5 - w / 2) / 16, m.camera.z + (py + 0.5 - h / 2) / 16];

/** The whole picture for a look: today's and the look's, at GO and after room 1; imgs: { go, goU1, room1, room1U1 } decoded ({ w, h, px }). */
export function picture(look, scene, imgs) {
  const L = LOOKS.includes(look) ? look : DEFAULT, [W, H] = SIZE, col = new Int32Array(W * H).fill(0x0e0f14), report = { frame: [W, H], look: L, moments: {} };
  const write = (x, y, str, c) => { for (const ch of String(str).toUpperCase()) { const g = ch === '·' ? ['0', '0', '1', '0', '0'] : glyphOf(ch); g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') col[(y + j) * W + x + i] = c; })); x += g[0].length + 1; } };
  const blit = (P, x0, y0) => { for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) col[(y0 + y) * W + x0 + x] = P.col[y * P.w + x]; };
  MOMENTS.forEach(([name, gameName], row) => {
    const m = scene.moments[name], today = imgs[name], game = imgs[gameName], U = unknownOf(today, game), y = GAP + row * (LABEL_H + H0 + GAP);
    ['today', L].forEach((lk, c) => {
      const P = overlay(today, game, m, lk, U), x = GAP + c * (W0 + GAP);
      blit(P, x, y + LABEL_H);
      write(x + 1, y + 2, `${name === 'go' ? 'AT GO' : 'AFTER ROOM 1'} · ${lk === 'today' ? 'TODAY (THE HOUSE DRAWN FROM SEED 48213)' : L}`, 0x9aa0ab);
    });
    // (the report: the game's unknown pixels, inside the footprint and out, and the known cells the game counted)
    let inside = 0;
    for (let i = 0; i < U.unknown.length; i++) if (U.unknown[i] && inRect(...groundOf(m, game.w, game.h, i % game.w, Math.floor(i / game.w)), m.rect)) inside++;
    report.moments[name] = { unknownPx: U.n, insideFootprint: inside, otherPx: U.other, known: m.fogKnown ?? null };
  });
  return { w: W, h: H, col, report };
}
