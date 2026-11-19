// OLYMPUS render: the known cells, what of an unfamiliar place the stage may draw (the build sheet v0.0.23 item 7, §0 items 20 and 35; VIEWS §2.11; the user, 2026-11-17: "we see what is in the rooms before entering them, this should not be the case when we start generating procedurally").
//
// The fog of awareness (src/render/fog.js) dims what you cannot see now; it draws everything. In a place you do not know
// (src/sim/places/known.js familiarOf: the shoot house drawn from the seed, on its own lane area) a cell never in sight is not
// drawn at all: the post pass paints it UNKNOWN_C (U1, black, `samples/house-unknown`'s default until the user scores it), its
// floor, its walls, its things and its people with it. A cell is known from its first frame in sight (perception's visibility
// above 0 at its centre, the fog's own wanted mask, given to see() at each recompute) and stays known, drawn as last seen (the
// fog's dim, as today), so nothing pops while playing; the fog's eased red channel fades the cell in. The cells round a cell in
// sight (SEE_RING, one) are known with it: a wall's own cell is solid on the sight grid and never in sight, and without the ring
// every wall would stay black beside the floor you see (the first shot of the drawn lane: the hall's north wall black).
//
// The cells are the area's, on the fog's lattice (cellM 0.25 m, the area's bounds from its corner, so a fog window's cell is one
// of these whatever the window's place), never the fog window's: the window moves with the camera and a cell must stay known
// when it leaves the window and comes back. They are the view's (runtime, never saved): begin() makes them again for a new state
// (a load, a scene's restart: the view's memory is new) or another area, from the place's known parts (known.js footprintOf: the
// footprint's outer walls, a cell deep inside its rect, and everything outside it, the apron; the catwalk's band; the booth) and
// the legs' states (known.js knownRoomsOf: a room entered known whole, its walls with it, a cell round its rect; the hall as
// walked), then sight adds the rest; a pop across a load is the load's own first frame.
//
// On the GPU the cells are one bit each, eight to a byte of a one-channel texture (`mask`: w × h bytes, w = ceil(nx / 8); the
// house's 160 × 112 cells are 2,240 bytes), re-sent only when a cell turns known: the fog's own mask is 48 KB a frame while it
// eases, and a byte a cell (17.9 KB) would take a frame over UPLOAD_MID_KB 64 with it (§4 item 13; my call: bits, not bytes).
// The post pass reads the cell under the pixel's own world spot (src/render/post.js setFog's `known`), so a man or a box standing
// in a room never seen is black and the wall's face toward a known hall is drawn.
// Pure: no DOM, no three.js (node tests drive it; the view wraps `mask` in its texture).

/** U1 (black), the unknown's colour until `samples/house-unknown` is scored; the ship switch (false: today's dimmed picture everywhere). */
export const UNKNOWN_C = 0x000000, UNKNOWN_HIDDEN = true;
/** The cells round a known room's rect (its walls, astride its lines: WALL_T_M 0.16 m, inside one 0.25 m cell) and the footprint's outer band inside its rect. */
export const WALL_CELLS = 1;
/** The ring of cells known with a cell in sight (its walls: a wall's cell is solid on the sight grid, so never in sight itself). */
export const SEE_RING = 1;

/**
 * The known cells of one area: { begin(state, area, { familiar, footprint, rooms } | () → them) → active, see(vis, box), known(i, j),
 * at(x, z), cellOf(x, z), active, mask: { data, w, h, nx, nz, x0, z0, cellM }, dirty, take(), count, gen, size, forget() }.
 * vis: a fog mask's wanted sight (nx × nz values, 0..1) over box { x0, z0, nx, nz, cellM } on the same lattice.
 */
export function createKnown({ cellM = 0.25 } = {}) {
  let of = null, cells = null, packed = null, nx = 0, nz = 0, x0 = 0, z0 = 0, dirty = false, count = 0, active = false, gen = 0;
  const idx = (i, j) => j * nx + i;
  function mark(i, j) {
    if (i < 0 || j < 0 || i >= nx || j >= nz) return false;
    const c = idx(i, j);
    if (cells[c]) return false;
    cells[c] = 1; count++;
    packed[j * Math.ceil(nx / 8) + (i >> 3)] |= 1 << (i & 7);
    return true;
  }
  // (every cell whose centre lies in the rect, grown by `grow` cells on each side)
  function markRect([rx0, rz0, rx1, rz1], grow = 0) {
    const i0 = Math.ceil((rx0 - x0) / cellM - 0.5) - grow, i1 = Math.floor((rx1 - x0) / cellM - 0.5) + grow;
    const j0 = Math.ceil((rz0 - z0) / cellM - 0.5) - grow, j1 = Math.floor((rz1 - z0) / cellM - 0.5) + grow;
    for (let j = Math.max(0, j0); j <= Math.min(nz - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(nx - 1, i1); i++) mark(i, j);
  }
  const K = {
    /**
     * A frame begins (see the header): the cells made again for a new state or area; familiar (or UNKNOWN_HIDDEN off) leaves them
     * inactive (every cell known: today's picture). footprint: known.js footprintOf's; rooms: knownRoomsOf's (opts may be a function
     * giving them, called only when the cells are made again). Returns active; gen counts the makings.
     */
    begin(state, area, opts = {}) {
      const id = area?.id ?? null;
      if (of && of.state === state && of.area === id) return active;
      of = { state, area: id }; gen++;
      const { familiar = true, footprint = null, rooms = [] } = (typeof opts === 'function' ? opts() : opts) ?? {};
      active = !familiar && UNKNOWN_HIDDEN && !!footprint && !!area?.boundsM;
      if (!active) { cells = packed = null; nx = nz = 0; count = 0; dirty = false; return false; }
      const b = area.boundsM;
      x0 = Math.floor(b.x0 / cellM) * cellM; z0 = Math.floor(b.z0 / cellM) * cellM;
      nx = Math.ceil((b.x1 - x0) / cellM); nz = Math.ceil((b.z1 - z0) / cellM);
      cells = new Uint8Array(nx * nz); packed = new Uint8Array(Math.ceil(nx / 8) * nz); count = 0;
      // (outside the footprint, and its outer band: known)
      const [fx0, fz0, fx1, fz1] = footprint.rect;
      const fi0 = Math.ceil((fx0 - x0) / cellM - 0.5) + WALL_CELLS, fi1 = Math.floor((fx1 - x0) / cellM - 0.5) - WALL_CELLS;
      const fj0 = Math.ceil((fz0 - z0) / cellM - 0.5) + WALL_CELLS, fj1 = Math.floor((fz1 - z0) / cellM - 0.5) - WALL_CELLS;
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (i < fi0 || i > fi1 || j < fj0 || j > fj1) mark(i, j);
      for (const r of footprint.fixed ?? []) markRect(r, WALL_CELLS);
      for (const r of rooms ?? []) markRect(r.rect, WALL_CELLS);
      dirty = true;
      return true;
    },
    /** A fog recompute's wanted sight: each cell above 0 known from now on. Returns the cells newly known. */
    see(vis, box) {
      if (!active || !vis || !box) return 0;
      const di = Math.round((box.x0 - x0) / cellM), dj = Math.round((box.z0 - z0) / cellM);
      let n = 0;
      for (let j = 0; j < box.nz; j++) {
        const wj = j + dj;
        if (wj < -SEE_RING || wj >= nz + SEE_RING) continue;
        for (let i = 0; i < box.nx; i++) {
          if (!(vis[j * box.nx + i] > 0)) continue;
          // (the cell and the ring round it: a wall's cell is never in sight itself (the sight grid's solid), so its face toward
          // a cell you see is known with that cell; the ring is SEE_RING cells, the wall's 0.16 m inside one)
          for (let dj2 = -SEE_RING; dj2 <= SEE_RING; dj2++) for (let di2 = -SEE_RING; di2 <= SEE_RING; di2++) if (mark(i + di + di2, wj + dj2)) n++;
        }
      }
      if (n) dirty = true;
      return n;
    },
    /** Whether cell (i, j) of the area is known (true everywhere while inactive). */
    known(i, j) { return !active || (i < 0 || j < 0 || i >= nx || j >= nz) || !!cells[idx(i, j)]; },
    /** Whether the cell under (x, z) is known (outside the grid: known). */
    at(x, z) { return K.known(Math.floor((x - x0) / cellM), Math.floor((z - z0) / cellM)); },
    /** The cell (i, j) under (x, z). */
    cellOf(x, z) { return [Math.floor((x - x0) / cellM), Math.floor((z - z0) / cellM)]; },
    get active() { return active; },
    get mask() { return active ? { data: packed, w: Math.ceil(nx / 8), h: nz, nx, nz, x0, z0, cellM } : null; },
    get dirty() { return dirty; },
    /** Whether the mask changed since the last take (and mark it sent). */
    take() { const d = dirty; dirty = false; return d; },
    get count() { return count; },
    get gen() { return gen; },
    get size() { return [nx, nz]; },
    /** Forget everything (the next begin makes the cells again). */
    forget() { of = null; active = false; cells = packed = null; nx = nz = 0; count = 0; dirty = false; },
  };
  return K;
}
