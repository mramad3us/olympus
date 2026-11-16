// OLYMPUS sample: the room's mark on its jamb (v0.0.20, the build sheet's item 12; drill.md D3: the last man out marks the room).
//
// The two looks of src/render/range-items.js jambMarks, drawn by the game's own code: M1 a chalk X (JAMB_CHALK, JAMB_X_PX across),
// M2 a chemlight taped to the jamb (JAMB_GLOW, a JAMB_STICK_PX bar, light: it glows through the fog). Each view is the latch-side
// jamb of a house door seen from the hall, face on, at the game's density (range-items.js PX_PER_M, 16 px/m), the wall and the
// door's frame in the house's plaster and steel, a marine's head height marked, the mark at corner.js MARK_H_M 1.5 m: lit (the
// hall's lamps) and in the dark (the fog of awareness: the chalk dims with the light where it is, the chemlight does not). ?k=
// picks the look (m1, m2), ?set= the picture: lit, dark. The picture is drawn at its own size and scaled up by a whole number to
// fill the window, so the gallery shoots it crisply. window.__report.frame is its size, window.__ready true once drawn.
import { jambMarks, JAMB_KINDS } from '../../src/render/range-items.js';
import { PX_PER_M } from '../../src/render/scale.js';
import { MARK_H_M } from '../../src/sim/combat/corner.js';

const params = new URLSearchParams(location.search), set = params.get('set') === 'dark' ? 'dark' : 'lit';
const kind = JAMB_KINDS.includes(params.get('k')) ? params.get('k') : 'm1';
// (the picture: 2.4 m of wall either side of a 0.9 m door, 2.4 m high, 16 px a metre)
const W = Math.round(3.0 * PX_PER_M), H = Math.round(2.6 * PX_PER_M), DIM = set === 'dark' ? 0.28 : 1;
const PLASTER = 0xb9b2a4, FRAME = 0x5d6670, DOOR = 0x7b6650, FLOOR = 0x4a4740, HEAD = 0x3a3a3a;
const cv = document.getElementById('pic'), g = cv.getContext('2d'), img = g.createImageData(W, H);
const put = (x, y, c, lit = false) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const k = lit ? 1 : DIM, i = 4 * (y * W + x);
  img.data[i] = ((c >> 16) & 0xff) * k; img.data[i + 1] = ((c >> 8) & 0xff) * k; img.data[i + 2] = (c & 0xff) * k; img.data[i + 3] = 255;
};
const yOf = (m) => H - 1 - Math.round(m * PX_PER_M);
// (the wall, the floor, the door's leaf shut, the frame's jambs and head; the latch jamb at x 1.5 m)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) put(x, y, y > yOf(0.1) ? FLOOR : PLASTER);
const latch = Math.round(1.5 * PX_PER_M), hinge = latch - Math.round(0.9 * PX_PER_M);
for (let y = yOf(2.1); y <= yOf(0.1); y++) { for (let x = hinge + 1; x < latch; x++) put(x, y, DOOR); put(hinge, y, FRAME); put(latch, y, FRAME); put(latch + 1, y, FRAME); }
for (let x = hinge; x <= latch + 1; x++) put(x, yOf(2.1), FRAME);
// (a marine's head height, 1.75 m, a dotted line for scale)
for (let x = 0; x < W; x += 2) put(x, yOf(1.75), HEAD);
// (the mark, by the game's own pixels: x along the wall from the latch jamb's outer face, y up)
for (const p of jambMarks([{ x: (latch + 2) / PX_PER_M, z: 0, y: MARK_H_M }], { kind })) put(Math.round(p.x * PX_PER_M), yOf(p.y), p.c, !!p.light);
g.canvas.width = W; g.canvas.height = H; g.putImageData(img, 0, 0);
const s = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
cv.style.width = `${W * s}px`; cv.style.height = `${H * s}px`;
window.__report = { frame: [W, H], set, kind };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
