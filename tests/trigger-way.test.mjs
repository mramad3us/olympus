// OLYMPUS tests: the pistol's trigger drawn the right way round (the user's report of 2026-11-20, with a screenshot of the
// P-12 small on the HUD: "sidearm trigger is backwards").
//
// Every small pistol in the game is the weapon card's drawing (pistols.js bodyCard): the card itself, the strip's mini of the
// other gun (weaponcard.js miniOf), and the dolls' held guns (held.js gunCells resamples weaponcard.js gunLayer). The trigger hangs
// from the frame inside the guard, in front of the grip; its blade curves forward to its foot, toward the muzzle (the card draws
// the muzzle to the right). Until v0.0.28 the foot curved back toward the grip, so the pistol read as pointing the other way.
// The test reads the drawn pixels: in each row under the frame and above the guard's bar, the runs of drawn pixels are the grip,
// the trigger and the guard's front, in that order; the trigger's column at its foot must lie forward of (right of) its column at
// its top, never behind it. It reads every design (p12a, and the alternates p12c and p12d) in every finish, and the layer the
// dolls resample. The R-7's trigger (rifles.js) is a straight upright line, with no way round to get wrong.
import { assert } from './helpers.mjs';
import { pistolDrawingOf, PISTOL_DESIGN_IDS } from '../src/art/pistols.js';
import { gunLayer, cardParts } from '../src/art/weaponcard.js';
import { FINISH_IDS } from '../src/data/finishes.js';

/** The drawn runs of a row: [[x0, x1], ...] (inclusive), left to right. */
function runs(get, w, y) {
  const out = [];
  let start = -1;
  for (let x = 0; x <= w; x++) {
    const on = x < w && get(x, y);
    if (on && start < 0) start = x;
    if (!on && start >= 0) { out.push([start, x - 1]); start = -1; }
  }
  return out;
}
/** The trigger's rows: the rows whose runs are exactly grip, trigger (narrow) and the guard's front: [{ y, x0, x1 }], top first. */
function triggerRows(get, w, h) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    const r = runs(get, w, y);
    if (r.length !== 3) continue;
    const [g, t, f] = r;
    if (t[1] - t[0] > 3 || g[1] >= t[0] || t[1] >= f[0]) continue;
    rows.push({ y, x0: t[0], x1: t[1] });
  }
  return rows;
}
const check = (name, rows) => {
  assert(rows.length >= 5, JSON.stringify({ name, why: 'no trigger found inside the guard', rows }));
  const top = rows[0], foot = rows[rows.length - 1];
  // (the foot forward of the top, and never stepping back on the way down)
  const back = rows.some((r, i) => i > 0 && r.x0 < rows[i - 1].x0);
  assert(foot.x0 > top.x0 && !back, JSON.stringify({ name, why: 'the trigger curves back toward the grip (backwards)', top, foot, rows }));
  return { top: top.x0, foot: foot.x0, rows: rows.length };
};

export default [
  {
    name: 'the P-12\'s trigger curves forward to its foot, toward the muzzle, in every design and finish (the user\'s "sidearm trigger is backwards", 2026-11-20)',
    fn() {
      const seen = [];
      for (const id of PISTOL_DESIGN_IDS) for (const f of FINISH_IDS) {
        const D = pistolDrawingOf(id, f), G = new Map();
        const px = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) G.set(`${x + i},${y + j}`, c); };
        D.card({ px, P: { ...cardParts({ mag: 'in', mode: 'safe', chamber: 'live' }), mark: null }, say: () => {} });
        const get = (x, y) => { const c = G.get(`${x},${y}`); return c !== undefined && c !== null; };
        const r = check(`${id} ${f}`, triggerRows(get, 200, 120));
        if (f === FINISH_IDS[0]) seen.push(`${id}: top x ${r.top}, foot x ${r.foot}, ${r.rows} rows`);
      }
      console.log(`      ${seen.join('; ')} (the muzzle to the right; ${FINISH_IDS.length} finishes each)`);
    },
  },
  {
    name: 'the dolls\' held P-12 (the card\'s layer they resample) has its trigger the same way round',
    fn() {
      const L = gunLayer('p12'), get = (x, y) => (L.data[y * L.w + x] >>> 24) >= 128;
      const r = check('gunLayer p12', triggerRows(get, L.w, L.h));
      assert(L.muzzle[0] > L.grip[0], JSON.stringify({ muzzle: L.muzzle, grip: L.grip }));
      console.log(`      the layer ${L.w} × ${L.h} px: trigger top x ${r.top}, foot x ${r.foot}; muzzle x ${L.muzzle[0]}, grip x ${L.grip[0]}`);
    },
  },
];
