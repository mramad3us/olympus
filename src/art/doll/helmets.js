// OLYMPUS art: the helmet candidates on the close figure (the doll), a look sample's only (samples/helmets).
//
// The same candidates as the figures' (src/art/figures/helmets.js: the regulars' closed helmets with a visor lit faintly and a
// moulded jaw, the elites' faceless ones with slits or dots, the OPA's cut helmet over a full-face mask with two round side
// filters, the factions' trim), drawn as the doll draws everything (grid.js): each piece a polygon in the doll's reference
// coordinates (64 × 140, the face from row 5 to 26, the eyes at 14 and 15), rounded where it should curve, lit and shaded in
// five tones of its colour, on the doll's own seams and ink. Where the figure's lights glow, the doll's are their colour lifted
// (the doll is drawn unlit). doll.js calls dollHelm() in place of the vac helmet when a sealed head carries a candidate
// (look.helm), puts the combat EVA suit on the doll for it (black, its seams in the faction's trim), and trimPlate() edges the
// carrier's plate in the trim. No look of the game carries one, so the doll is unchanged until the user picks. Pure.
import { REF, INK, mix, cloth, smooth } from './grid.js';

const MID = REF.W / 2;
const lf = (pts) => pts.map(([d, y]) => [MID - d, y]);
const rt = (pts) => pts.map(([d, y]) => [MID + d, y]);
const both = (pts) => [...lf(pts), ...rt(pts).reverse()];
/** An ellipse's outline about (cx, cy), reference coordinates. */
const ell = (cx, cy, rx, ry, n = 18) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos(2 * Math.PI * i / n), cy + ry * Math.sin(2 * Math.PI * i / n)]);
/** A light's colour on the unlit doll: the glow's own, lifted a little toward white. */
const lit = (c) => mix(c, 0xfff4e0, 0.12);
const GLINT = 0xb8d8ec;

/** The neck sealed in the suit's skin (the face's neck covered), under the helmet. */
function neckSeal(g, B, kit) {
  const S = cloth(kit.legs);
  const n = g.add(g.scan(both([[B.neck + 0.8, 19], [B.neck + 1, 26], [B.neck + 1.4, 28.4]])), S.shade, REF.H);
  g.on(n, g.scan(rt([[1, 19], [1, 29], [10, 29], [10, 19]])), S.deep);
  g.quiet.add(n);
}

/** The shell's outline by family: the regulars' a shield a little over the head, the elites' tighter, the OPA's the cut dome. */
const SHELL = {
  regular: [[0, 0.8], [4.6, 1.2], [8.6, 3], [11, 6.6], [11.6, 11], [11.2, 15.6], [10, 19.6], [7.6, 23.4], [4.4, 26.2], [0, 26.8]],
  elite: [[0, 1.6], [4.4, 1.9], [8.2, 3.6], [10.4, 7], [10.9, 11], [10.6, 15.4], [9.4, 19.4], [6.8, 23.2], [3.4, 26.2], [0, 26.8]],
};
const outline = (half) => smooth([...lf(half.slice(0, -1)), ...rt(half.slice(1)).reverse()], 4);

/** A closed shell in its tones: the gloss at its upper left, its right side in shade, its foot deep. */
function shellOf(g, half, colour) {
  const T = cloth(colour), id = g.add(g.scan(outline(half)), T.base);
  g.on(id, g.scan(smooth([[MID - 9.4, 7.4], [MID - 6.4, 3.2], [MID - 1, 2], [MID + 1, 2.6], [MID - 4.4, 4.6], [MID - 7.8, 9]], 3)), T.soft);
  g.on(id, g.scan(smooth([[MID - 8, 5.6], [MID - 5.4, 3.2], [MID - 3, 3], [MID - 6, 5]], 2)), T.light);
  g.on(id, g.scan(smooth([[MID + 5, 2], [MID + 10, 6], [MID + 12, 14], [MID + 9.6, 21], [MID + 5, 26], [MID + 12, 27], [MID + 13, 1]], 3)), T.shade);
  return { id, T };
}
/** The trim's colour, or the shell's seam (its deep tone) with no faction. */
const seamOf = (H, T) => (H.trim ?? T.deep);

function regular(g, H, kit) {
  const { id, T } = shellOf(g, SHELL.regular, H.shell), seam = seamOf(H, T);
  const J = cloth(H.jaw), V = cloth(H.visor);
  // (the jaw piece: a moulding from under the visor to the chin, its vents in pairs, a ridge down its middle)
  const snout = H.id === 'R3';
  const jaw = g.add(g.scan(smooth(both([[snout ? 7.4 : 6.8, 18.6], [snout ? 7 : 6, 22], [snout ? 4.6 : 3.8, 25.4], [0, 26.2]]), 3)), J.base);
  g.on(jaw, g.scan(rt([[0.6, 18], [9, 18], [9, 27], [0.6, 27]])), J.shade);
  g.on(jaw, g.rows(18.6, MID - 6, MID + 5), J.light);
  for (const y of snout ? [20, 21.6, 23.2] : [21, 22.6]) { g.on(jaw, g.rows(y, MID - 4, MID - 2), J.deep); g.on(jaw, g.rows(y, MID + 1, MID + 3), J.deep); }
  if (snout) for (let x = MID - 4; x <= MID + 3; x += 2) g.on(jaw, g.rows(19.6, x, x, 24), J.deep);
  g.on(jaw, g.rows(19, MID, MID, 25), J.shade);
  // (the visor: glass across the eyes wrapping to the sides, its light a band in it, a glint at its upper left)
  const vis = {
    R1: [[11, 10.6], [10.8, 16.8]], R4: [[11, 10.6], [10.8, 16.8]], R2: [[11, 9.2], [10.6, 17.4]], R3: [[11, 11.4], [11, 14.8]],
  }[H.id] ?? [[11, 10.6], [10.8, 16.8]];
  const [[w0, y0], [w1, y1]] = vis;
  const glassPts = H.id === 'R2'
    ? both([[w0, y0], [w1 + 0.2, 15.6], [8, y1], [3, 20.4], [0, 21]])
    : both([[w0, y0], [w0 + 0.2, (y0 + y1) / 2], [w1, y1], [0, y1 + 0.4]]);
  const glass = g.add(g.scan(glassPts), V.base);
  g.on(glass, g.scan(rt([[2, y0], [12, y0], [12, y1 + 4], [2, y1 + 4]])), V.shade);
  const L = lit(H.lit);
  if (H.id === 'R1') g.on(glass, g.rows(y1 - 1.6, MID - 11, MID + 11, y1 + 0.4), L);
  if (H.id === 'R4') g.on(glass, g.rows(y0, MID - 11, MID + 11, y0 + 0.8), L);
  if (H.id === 'R3') g.on(glass, g.rows(13, MID - 8, MID + 9), L);
  if (H.id === 'R2') { g.on(glass, g.scan(both([[11, 14.6], [9, 17.4], [3, 20.4], [0, 21]])), mix(L, V.base, 0.25)); g.on(glass, g.rows(15, MID - 10, MID + 10), L); }
  g.on(glass, g.scan(smooth([[MID - 9, y0 + 0.8], [MID - 6, y0 + 0.4], [MID - 7.6, y0 + 2.6], [MID - 9.2, y0 + 3]], 2)), GLINT);
  // (the brow over the visor: R3's a jutting ridge in shade; the others' seam, the faction's trim)
  if (H.id === 'R3') { const b = g.add(g.scan(both([[11.8, 8.6], [11.8, 11.4], [0, 11.6], [0, 8.4]])), T.shade); g.on(b, g.rows(8.6, 0, REF.W), T.base); g.on(b, g.rows(11, 0, REF.W), T.deep); }
  g.over(g.scan(both([[w0 - 0.4, y0 - 1.2], [w0, y0 - 0.2], [0, y0 - 0.6], [0, y0 - 1.6]])), seam);
  if (H.id === 'R3') g.over(g.rows(15.2, MID - 10, MID + 9), seam);
  // (the cheek seams down to the jaw)
  for (const s of [-1, 1]) for (let y = Math.ceil(y1 + 1); y < 23; y++) g.put(MID + s * (10 - (y - y1) * 0.55) - (s > 0 ? 1 : 0), y, seam);
  void id; void kit;
}

function elite(g, H, kit) {
  const { id, T } = shellOf(g, SHELL.elite, H.shell), seam = seamOf(H, T), E = lit(H.eye), slit = lit(H.slit);
  if (H.id === 'E4') {
    // (the crest along the crown, a fin from the brow over the top)
    const c = g.add(g.scan(smooth([[MID - 1.2, 9], [MID - 1.4, 1], [MID, -1.6], [MID + 1.4, 1], [MID + 1.2, 9]], 3)), T.soft);
    g.on(c, g.rows(-2, MID + 0.5, MID + 2, 10), T.shade);
  }
  if (H.id === 'E1') {
    for (const [a, b] of [[MID - 8, MID - 3], [MID + 2, MID + 7]]) { g.span(14, a, b, INK); g.span(14.6, a + 0.6, b - 0.6, slit); }
    for (let y = 17; y < 26; y++) g.put(MID, y, seam);
  }
  if (H.id === 'E3') { g.span(13.6, MID - 9.6, MID + 9, INK); g.span(14.2, MID - 9, MID + 8.4, slit); g.span(12.2, MID - 10, MID + 9.4, seam); }
  if (H.id === 'E2') {
    // (the faceplate: glossy black, recessed in its seam, the dots lit in it)
    const F = cloth(H.jaw), fp = both([[9.6, 9.6], [9.4, 15], [6.8, 20], [2.6, 25], [0, 25.8]]);
    g.over(g.scan(smooth(both([[10.6, 8.6], [10.4, 15], [7.6, 20.6], [3.2, 26], [0, 26.8]]), 3)), seam);
    const f = g.add(g.scan(smooth(fp, 3)), F.base);
    g.on(f, g.scan(smooth([[MID - 7.6, 10.4], [MID - 3, 10.2], [MID - 6.4, 12.6]], 2)), F.soft);
    g.on(f, g.scan(rt([[2, 9], [12, 9], [12, 27], [2, 27]])), F.deep);
    for (const x of [MID - 5, MID + 4]) { g.put(x, 14, E); g.put(x + 1, 14, E); g.put(x, 15, E); g.put(x + 1, 15, mix(E, F.base, 0.4)); }
  }
  if (H.id === 'E4') {
    // (the chevron faceplate between the dots, the dots in its corners)
    for (let k = 0; k <= 9; k++) { g.put(MID - 9 + k, 12 + k * 1.3, seam); g.put(MID + 8 - k, 12 + k * 1.3, seam); }
    for (const x of [MID - 6, MID + 5]) { g.put(x, 14, E); g.put(x, 15, mix(E, T.base, 0.3)); }
  }
  // (the chin: a small moulding, deep)
  const J = cloth(H.jaw), chin = g.add(g.scan(smooth(both([[3.4, 22.6], [2.6, 25.6], [0, 26.6]]), 2)), J.shade);
  g.on(chin, g.rows(22.6, 0, REF.W), J.base);
  void id; void kit;
}

function opa(g, H, kit) {
  const M = cloth(H.jaw), F = cloth(H.filter), Hc = cloth(H.shell), R = cloth(H.rail), V = cloth(H.visor);
  // (the mask: a full face of rubber from the brow to under the chin, wider at the cheeks)
  const mask = g.add(g.scan(smooth(both([[9.6, 9.4], [10.4, 14], [10.2, 19], [8.4, 23.4], [5, 26.4], [0, 27.2]]), 3)), M.base);
  g.on(mask, g.scan(rt([[1, 9], [12, 9], [12, 28], [1, 28]])), M.shade);
  g.on(mask, g.scan(smooth([[MID - 8.6, 18], [MID - 6, 17], [MID - 5.4, 22], [MID - 7.4, 23]], 2)), M.soft);
  // (the lenses: two round, or O2's one wide; a glint each)
  const lenses = H.id === 'O2' ? [both([[9.2, 12.2], [9.4, 16.6], [0, 17.4], [0, 12]])] : [ell(MID - 4.4, 14.6, 3, 2.6), ell(MID + 4.4, 14.6, 3, 2.6)];
  for (const pts of lenses) {
    const rim = g.add(g.scan(H.id === 'O2' ? smooth(pts, 2) : pts.map(([x, y]) => [MID + (x - MID) * 1.12, 14.6 + (y - 14.6) * 1.18])), M.deep);
    void rim;
    const l = g.add(g.scan(H.id === 'O2' ? smooth(both([[8.6, 12.8], [8.8, 16], [0, 16.8], [0, 12.6]]), 2) : pts), V.base);
    g.on(l, g.scan(rt([[1, 10], [12, 10], [12, 19], [1, 19]])), V.shade);
    const xs = pts.map(p => p[0]), x0 = Math.min(...xs);
    g.put(x0 + 1, 13, GLINT, l); g.put(x0 + 1.8, 13, GLINT, l);
  }
  // (the voicemitter at the mouth, and the two round filters at the cheeks standing out of the face)
  const vm = g.add(g.scan(ell(MID, 22.6, 2.4, 2)), M.deep);
  g.on(vm, g.rows(22, MID - 1, MID), M.shade);
  for (const s of [-1, 1]) {
    const cx = MID + s * 9.6, cy = 21.6;
    const f = g.add(g.scan(ell(cx, cy, 3.8, 3.4)), F.base);
    g.on(f, g.scan(ell(cx, cy, 2.6, 2.2)), F.shade);
    g.on(f, g.scan(ell(cx - 0.6, cy - 0.6, 1, 0.8, 8)), F.deep);
    g.on(f, g.scan(smooth([[cx - 3, cy - 1], [cx - 1.6, cy - 3], [cx + 0.4, cy - 3.2], [cx - 1.6, cy - 2]], 2)), F.light);
    if (s > 0) g.on(f, g.scan([[cx, cy - 4], [cx + 5, cy - 4], [cx + 5, cy + 4], [cx, cy + 4]]), F.shade);
  }
  // (the cut helmet: a dome to the brow, cut high over the ears, its rim deep; a rail along each side; O2's shroud on the brow)
  const dome = g.add(g.scan(smooth(both([[0, -0.2], [4.8, 0.2], [9.4, 2], [11.8, 6], [12, 11.6]]), 3)), Hc.base);
  g.on(dome, g.scan(smooth([[MID - 9.4, 7], [MID - 6.4, 2.6], [MID - 1, 1.4], [MID - 4.4, 4.2], [MID - 8, 9]], 3)), Hc.soft);
  g.on(dome, g.scan(rt([[3, -1], [13, -1], [13, 13], [3, 13]])), Hc.shade);
  g.on(dome, g.rows(10.6, 0, REF.W, 11.6), Hc.deep);
  if (H.scuff) for (const [x, y] of [[MID - 6, 4], [MID - 2, 6], [MID + 3, 3], [MID + 6, 7], [MID - 8, 8]]) g.put(x, y, Hc.light, dome);
  for (const s of [-1, 1]) { const r = g.add(g.rows(7, s < 0 ? MID - 13 : MID + 11.2, s < 0 ? MID - 11.2 : MID + 13, 9.4), R.base); g.on(r, g.rows(7, 0, REF.W), R.light); g.on(r, g.rows(9, 0, REF.W, 9.4), R.deep); }
  if (H.id === 'O2') { const sh = g.add(g.rows(3.6, MID - 2.4, MID + 2, 6.6), R.shade); g.on(sh, g.rows(3.6, 0, REF.W), R.base); g.on(sh, g.rows(6, 0, REF.W, 6.6), R.deep); }
  void kit;
}

/** A candidate on the doll's sealed head: the neck sealed, then its family's helmet. */
export function dollHelm(g, B, kit, H) {
  neckSeal(g, B, kit);
  if (H.family === 'opa') opa(g, H, kit);
  else if (H.family === 'elite') elite(g, H, kit);
  else regular(g, H, kit);
}

/** The faction's trim round the carrier's plate (its top and sides: a pixel whose upper, left or right neighbour is not the plate). */
export function trimDollPlate(g, plate, trim) {
  const hit = [];
  for (let y = 0; y < g.ROWS; y++) for (let x = 0; x < g.W; x++) {
    if (g.part[y][x] !== plate) continue;
    const out = (X, Y) => { const p = g.part[Y]?.[X]; return !p || p < plate || g.col[Y][X] === null; };
    if (out(x, y - 1) || out(x - 1, y) || out(x + 1, y)) hit.push([x, y]);
  }
  for (const [x, y] of hit) g.col[y][x] = trim;
}
