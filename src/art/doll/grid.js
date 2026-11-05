// OLYMPUS art: the close figure's drawing surface. tradecraft's doll grid, at a scale.
//
// tradecraft's doll (src/art/doll.js, the user's ask of 2026-10-31: "improve the character outline,
// it's not as good as it should be") is drawn as a pixel artist would, in shapes and clusters: each
// part a polygon scan-converted to spans (scan()), its contour placed by hand and rounded where it should
// curve (smooth(), Catmull-Rom), its lights and shadows shapes of their own within it (on()), folds as
// tapering strokes (ribbon()), in five tones of its colour (cloth(), flesh(): lit, half lit, base, shade,
// deep; skin's shadows warm, a dark cloth lifted toward grey or black reads as a hole). Its coordinates
// are those of a 64 × 140 figure (REF), the figure 175 cm over 126 rows.
//
// OLYMPUS draws it at a scale S (doll.js DOLL_SCALE: the picture's density over tradecraft's 16 px/m, so
// the close figure keeps its size against the picture at either density, its pixels half the stage's).
// The doll's own code keeps tradecraft's reference coordinates; this grid scales them: polygons are scaled
// before they are scan-converted (so a curve is drawn finer, not blown up), and the literal rows and pixels
// tradecraft placed by hand (a hem's row, a button, the hand's template) are filled as the S × S blocks they
// cover (rows(), put(), span()). At S = 1 the figure is tradecraft's, pixel for pixel.
// Pure.

export const REF = Object.freeze({ W: 64, H: 140 });
export const INK = 0x14151c;

// ---------- colour ----------
export const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
export const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return (Math.round(A[0] + (B[0] - A[0]) * t) << 16) | (Math.round(A[1] + (B[1] - A[1]) * t) << 8) | Math.round(A[2] + (B[2] - A[2]) * t); };
export const lum = (c) => { const [r, g, b] = rgb(c); return 0.3 * r + 0.59 * g + 0.11 * b; };
/** A cloth's tones: lit, half lit, itself, in shade, deep. A dark cloth is lifted a little, or black reads as a hole. */
export function cloth(c) {
  const v = lum(c), base = v < 42 ? mix(c, 0x6a7182, 0.13) : c;
  const light = mix(base, 0xdfe2e8, v < 70 ? 0.2 : 0.26);
  return { light, soft: mix(base, light, 0.45), base, shade: mix(base, 0x16172a, v > 170 ? 0.2 : 0.32), deep: mix(base, INK, v > 170 ? 0.42 : 0.62) };
}
/** Skin's tones: its shadows go warm, not grey. */
export const flesh = (c) => { const light = mix(c, 0xffe9d2, lum(c) < 100 ? 0.15 : 0.32); return { light, soft: mix(c, light, 0.5), base: c, shade: mix(c, 0x6b2f2a, 0.3), deep: mix(c, 0x3a1a1c, 0.55) }; };
export const TONES = Object.freeze(['light', 'soft', 'base', 'shade', 'deep']);

// ---------- geometry (reference coordinates) ----------
/** A closed contour rounded through its points (Catmull-Rom). */
export function smooth(pts, steps = 5) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, c = (a, b, d, e) => 0.5 * (2 * b + (d - a) * t + (2 * a - 5 * b + 4 * d - e) * t * t + (3 * b - a - 3 * d + e) * t * t * t);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}
/** A fold: a stroke along a path, width w at its middle, tapering to nothing at the ends; a polygon. */
export function ribbon(path, w) {
  const a = [], b = [], n = path.length - 1;
  path.forEach(([x, y], i) => {
    const [px, py] = path[Math.max(0, i - 1)], [qx, qy] = path[Math.min(n, i + 1)], l = Math.hypot(qx - px, qy - py) || 1, k = Math.sin(Math.PI * i / n) * w / 2 + 0.01;
    a.push([x + (qy - py) / l * k, y - (qx - px) / l * k]); b.push([x - (qy - py) / l * k, y + (qx - px) / l * k]);
  });
  return [...a, ...b.reverse()];
}
/** Where a contour of [d, y], in order of y, is at row y. */
export const edgeOf = (table, y) => { for (let i = 0; i + 1 < table.length; i++) if (y <= table[i + 1][1]) return table[i][0] + (table[i + 1][0] - table[i][0]) * (y - table[i][1]) / (table[i + 1][1] - table[i][1]); return table.at(-1)[0]; };

/**
 * The grid at scale S: W × ROWS target pixels (the figure; doll.js adds the drop above and the ink round it).
 * Spans are target rows [y, x0, x1]; scan() and rows() make them from reference coordinates.
 */
export function grid(S, drop) {
  const W = Math.round(REF.W * S), ROWS = Math.round((REF.H - drop) * S), MID = REF.W / 2;
  const col = Array.from({ length: ROWS }, () => Array(W).fill(null)), part = Array.from({ length: ROWS }, () => Array(W).fill(0)), edgeFrom = [], quiet = new Set();
  let n = 0;
  const setPx = (x, y, c, id) => { if (x >= 0 && y >= 0 && x < W && y < ROWS) { col[y][x] = c; if (id !== undefined) part[y][x] = id; } };
  const T = (v) => Math.floor(v * S + 1e-6);                       // (a reference coordinate's first target pixel)
  const g = {
    S, W, ROWS, MID, col, part, edgeFrom, quiet,
    /** Spans of a polygon given in reference coordinates (pixel centres inside it, at the target's scale). */
    scan(pts) {
      const P = pts.map(([x, y]) => [x * S, y * S]), ys = P.map(p => p[1]), out = [];
      for (let y = Math.floor(Math.min(...ys)); y < Math.ceil(Math.max(...ys)); y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0; i < P.length; i++) {
          const [ax, ay] = P[i], [bx, by] = P[(i + 1) % P.length];
          if ((ay <= yc) !== (by <= yc)) xs.push(ax + (bx - ax) * (yc - ay) / (by - ay));
        }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) { const a = Math.round(xs[i]), b = Math.round(xs[i + 1]) - 1; if (b >= a) out.push([y, a, b]); }
      }
      return out;
    },
    /** The target spans covering reference rows y0..y1 between reference columns a..b (inclusive). */
    rows(y0, a, b, y1 = y0) { const out = []; for (let y = T(y0); y < T(y1 + 1); y++) out.push([y, T(a), T(b + 1) - 1]); return out; },
    /** A new part, one colour, over what's there; its dark line starts at reference row `from`. */
    add(spans, c, from = 0) { const id = ++n; edgeFrom[id] = T(from); for (const [y, a, b] of spans) for (let x = a; x <= b; x++) setPx(x, y, c, id); return id; },
    /** A shape in a colour on a part's own pixels only. */
    on(id, spans, c) { for (const [y, a, b] of spans) for (let x = a; x <= b; x++) if (part[y]?.[x] === id) col[y][x] = c; },
    /** A shape in a colour over anything drawn: it joins the part beneath. */
    over(spans, c) { for (const [y, a, b] of spans) for (let x = a; x <= b; x++) if (col[y]?.[x] !== null && col[y]?.[x] !== undefined) col[y][x] = c; },
    /** A reference row's span of pixels (y, a..b), belonging to no new part unless id. */
    span(y, a, b, c, id) { for (const [yy, x0, x1] of g.rows(y, a, b)) for (let x = x0; x <= x1; x++) setPx(x, yy, c, id); },
    /** A reference pixel (its S × S block). */
    put(x, y, c, id) { for (let yy = T(y); yy < T(y + 1); yy++) for (let xx = T(x); xx < T(x + 1); xx++) setPx(xx, yy, c, id); },
    /** A target pixel, as is. */
    px: setPx,
    /** A reference coordinate in target pixels. */
    T,
  };
  return g;
}

/** Spans grown by a pixel all round: what a pocket's dark edge is drawn from. */
export function halo(spans) {
  const out = spans.map(([y, a, b]) => [y, a - 1, b + 1]), ys = spans.map(s => s[0]), y0 = Math.min(...ys), y1 = Math.max(...ys);
  for (const [y, a, b] of spans) { if (y === y0) out.push([y - 1, a, b]); if (y === y1) out.push([y + 1, a, b]); }
  return out;
}
/** Spans with a hole taken out of them. */
export const minus = (spans, hole) => spans.flatMap(([y, a, b]) => { const h = hole.find(s => s[0] === y); return h ? [[y, a, h[1] - 1], [y, h[2] + 1, b]].filter(s => s[2] >= s[1]) : [[y, a, b]]; });
