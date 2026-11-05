// OLYMPUS places: a binary min-heap on typed arrays, the open set of the nav's A*.
//
// tradecraft's `wayAcross` (src/sim/interiors/path.js) scanned its open set as a plain array, which
// is quadratic: "fine for a flat, too slow for a 100 m ship deck" (docs/research/tradecraft-sim-
// world.md §11.3). PLACES §2.2 replaces it with this: entries are (key, h, cell), kept in three
// parallel typed arrays, so a push or a pop moves numbers and never allocates. The order is total and
// fixed, so a solve's result never depends on the engine: the smaller key first (A*'s f = g + h),
// ties by the smaller h (the entry nearer the goal, which also makes a straight run expand in a
// line), then by the smaller cell index.
//
// A heap is made once with a capacity (PLACES: NODE_CAP × 8 pushes, a solve's worst case: one push
// per neighbour of every expansion) and reset by its length between solves. A caller that asks for
// more (a long measurement on a ground window) grows it, which doubles the arrays and counts the
// growth in stats.grows: the nav's "no allocation per solve after warm-up" is read off that count.
// Duplicates are allowed (A* pushes a cell again when it finds it cheaper and skips the stale entry
// when it pops it), which is cheaper here than a decrease-key.
// Pure (a runtime object: never put in the state).

/** A min-heap of (key, h, cell) with room for capacity entries before it grows. */
export function createHeap(capacity = 1024) {
  // (the arrays live on one record and are read into locals at each call, so the engine keeps them in
  // registers; sifting moves a hole, not pairs of swaps)
  const st = { cap: Math.max(16, capacity | 0), n: 0, key: null, h: null, cell: null };
  st.key = new Float64Array(st.cap); st.h = new Float64Array(st.cap); st.cell = new Int32Array(st.cap);
  const stats = { grows: 0, pushes: 0, pops: 0, max: 0 };
  function grow() {
    const c2 = st.cap * 2, k2 = new Float64Array(c2), h2 = new Float64Array(c2), e2 = new Int32Array(c2);
    k2.set(st.key); h2.set(st.h); e2.set(st.cell);
    st.key = k2; st.h = h2; st.cell = e2; st.cap = c2; stats.grows++;
  }
  return {
    /** Add a cell with its key (f) and its tie-break h. */
    push(c, k, hv) {
      if (st.n === st.cap) grow();
      const K = st.key, H = st.h, C = st.cell;
      let i = st.n++;
      while (i > 0) {
        const p = (i - 1) >> 1, kp = K[p];
        if (kp < k || (kp === k && (H[p] < hv || (H[p] === hv && C[p] <= c)))) break;
        K[i] = kp; H[i] = H[p]; C[i] = C[p]; i = p;
      }
      K[i] = k; H[i] = hv; C[i] = c;
      stats.pushes++; if (st.n > stats.max) stats.max = st.n;
    },
    /** Take the first cell (the smallest key, then h, then index), or -1 when empty. */
    pop() {
      if (st.n === 0) return -1;
      const K = st.key, H = st.h, C = st.cell, top = C[0], n = --st.n;
      if (n > 0) {
        const k = K[n], hv = H[n], c = C[n];
        let i = 0;
        for (;;) {
          const l = 2 * i + 1;
          if (l >= n) break;
          const r = l + 1;
          let m = l;
          if (r < n) { const kr = K[r], kl = K[l]; if (kr < kl || (kr === kl && (H[r] < H[l] || (H[r] === H[l] && C[r] < C[l])))) m = r; }
          const km = K[m];
          if (km < k || (km === k && (H[m] < hv || (H[m] === hv && C[m] < c)))) { K[i] = km; H[i] = H[m]; C[i] = C[m]; i = m; } else break;
        }
        K[i] = k; H[i] = hv; C[i] = c;
      }
      stats.pops++;
      return top;
    },
    /** The first entry's key without taking it (Infinity when empty). */
    peekKey() { return st.n ? st.key[0] : Infinity; },
    /** Empty it (its arrays kept). */
    reset() { st.n = 0; },
    /** Make room for at least c entries now (so a known big solve grows once, up front). */
    reserve(c) { while (st.cap < c) grow(); },
    get size() { return st.n; },
    get capacity() { return st.cap; },
    stats,
  };
}
