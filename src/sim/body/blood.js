// OLYMPUS body: blood on the ground and on the figure, as the stage reads it (BODY §17.1 change 4, VIEWS §2.12; the build sheet 0.0.7 §2.2; tradecraft's src/sim/blood.js, 47 lines).
//
// places.sites[site].blood: [{ area, x, z, dx, n, seed, atMs }] plain data, the latest BLOOD_DECALS_MAX
// 120 of the site kept: a spatter where a round drew blood (n pixels, flung dx the way the round went,
// applyHit's: 5, the head 8), and drips under whoever is bleeding, DRIP_S 3 to 7 s apart, a pixel or
// two. Each is drawn pixel by pixel from its seed (src/render/blood.js), the same every time, and stays
// on the area it fell on; x, z rounded to 0.01 m. The seed and a drip's interval and place are hashes
// (core/hash.js) of the world's seed, the person and the time, never the dice: blood is a picture,
// and it must not move a roll. The next drip is kept on the injury bleeding (injury.drip, whole ms),
// so a save mid-drip carries on as the game would have. A body lying still pools: a drip within POOL_M 0.35 m
// of a pool grows it (n, to POOL_N_MAX 40) rather than adding a decal. Departure from the sheet's shape: each decal
// names its area (a site has several, and their frames overlap), my call.
// bloodLook(state, area, ms) is what the stage draws: the area's decals, and the marks on each figure
// (an actor's person's wounds that show: { part, atMs }). Drips are lived only: a skip draws none.
// bloodLook is Pure. spatter and dripStep write places.sites[site].blood.
import { hash, hash01 } from '../../core/hash.js';
import { TICK_MS, SEC_MS } from '../../core/clock.js';

export const BLOOD_DECALS_MAX = 120;
export const DRIP_S = Object.freeze([3, 7]);
/** Drips within POOL_M of a pool among the last POOL_LOOK decals grow it, to POOL_N_MAX pixels (my call: a body lying still pools, and the cap is not spent on drips). */
export const POOL_M = 0.35, POOL_LOOK = 20, POOL_N_MAX = 40;

const r2 = (x) => Math.round(x * 100) / 100;
// (an area's site: the live one's, else the area id's first word, as Base Melas names its areas: 'melas.ground')
const siteOf = (state, area) => (state.places?.live?.area === area ? state.places.live.site : String(area).split('.')[0]);

/** A spatter at (x, z) on an area: n pixels, flung toward dx (−1 west, 1 east, 0 a pool). Writes the site's blood. */
export function spatter(state, { area, x, z, dx = 0, n = 5, who = '', atMs = state.clock.ms }) {
  const rec = state.places?.sites?.[siteOf(state, area)];
  if (!rec || !Number.isFinite(x) || !Number.isFinite(z)) return null;
  const list = (rec.blood ??= []);
  const d = { area, x: r2(x), z: r2(z), dx, n, seed: hash('blood', state.meta?.seed ?? 0, who, atMs, list.length, n) || 1, atMs };
  list.push(d);
  if (list.length > BLOOD_DECALS_MAX) list.splice(0, list.length - BLOOD_DECALS_MAX);
  return d;
}

// (a drip's interval from the last one: DRIP_S's range by a hash, on the tick grid)
const dripGap = (seed, who, ms) => Math.round((DRIP_S[0] + (DRIP_S[1] - DRIP_S[0]) * hash01('drip', seed, who, ms)) * SEC_MS / TICK_MS) * TICK_MS;

/** A lived tick at ms: whoever stands on the live area bleeding drips there, now and then. Writes. */
export function dripStep(state, ms = state.clock.ms) {
  const area = state.places?.live?.area;
  if (!area) return 0;
  const seed = state.meta?.seed ?? 0;
  let n = 0;
  for (const a of state.actors?.list ?? []) {
    const rec = a.who ? state.people?.[a.who]?.body : null;
    if (!rec?.injuries || rec.dead) continue;
    const i = rec.injuries.find(j => j.bleed > ms && !j.internal && !j.cared);
    if (!i) continue;
    i.drip ??= ms + dripGap(seed, a.who, ms);
    if (ms < i.drip) continue;
    i.drip = ms + dripGap(seed, a.who, ms);
    const h = hash01('drip-at', seed, a.who, ms), x = a.x + (h - 0.5) * 0.3, z = a.z + (hash01('drip-z', seed, a.who, ms) - 0.5) * 0.2, k = 1 + (h < 0.5 ? 0 : 1);
    // (lying still, the drips pool: the last pool under them grows instead of a new decal)
    const list = state.places?.sites?.[siteOf(state, area)]?.blood ?? [];
    const pool = list.slice(-POOL_LOOK).reverse().find(d => d.area === area && d.dx === 0 && d.n < POOL_N_MAX && Math.hypot(d.x - x, d.z - z) <= POOL_M);
    if (pool) pool.n = Math.min(POOL_N_MAX, pool.n + k);
    else spatter(state, { area, x, z, dx: 0, n: k, who: a.who, atMs: ms });
    n++;
  }
  return n;
}

/** What the stage draws on an area at ms: { decals, marks: { [actorId]: [{ part, atMs }] } }. Pure. */
export function bloodLook(state, area, ms = state.clock.ms) {
  const decals = (state.places?.sites?.[siteOf(state, area)]?.blood ?? []).filter(d => d.area === area && d.atMs <= ms);
  const marks = {};
  if (state.places?.live?.area === area) {
    for (const a of state.actors?.list ?? []) {
      const inj = a.who ? state.people?.[a.who]?.body?.injuries : null;
      if (!inj) continue;
      const m = inj.filter(i => !i.internal && i.ms <= ms && (i.kind === 'cut' || i.kind === 'split' || i.kind === 'nose')).map(i => ({ part: i.part, atMs: i.ms }));
      if (m.length) marks[a.id] = m;
    }
  }
  return { decals, marks };
}
