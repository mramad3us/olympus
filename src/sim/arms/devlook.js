// OLYMPUS arms: the kit's devices as the stage draws them, read off the sim's records at the moment drawn (VIEWS §7.3; WEAPONS §12; COMBAT §25.20; the build sheet 0.0.19 §1 K-face, kit2 §2.10).
//
// devicesView(state, ms) is the house look's `kit` (look.js rangeLook().house.kit, drawn by render/devices.js; the render may
// read the sim only through look.js, TECH §2.2): plain numbers, nothing written, every quantity the sim's own helper's:
//   grenades  each thrown and still burning, where its body is at ms (throw.js flightAt's closed form to its landing, then
//             rolled ROLL_MS to where it lies), its lever's release ({ from, atMs }: the item's leverAtMs, a cook's, else the
//             throw's release); and each burst of the last BURST_LOOK_MS (burst.js) where it went, done;
//   practice  the ids of the practice grenades among them (DEVICES[m].as: the G-9P, the G-13P), drawn by the devices layer
//             whole, so the bangs layer leaves them out;
//   charges   a charge placed or primed on its door's edge (the SC-1 on the latch's, the BC-1 on the hinge's: its `side`), the
//             shock tube's other end (its FD-1 where it lies, else the man who placed it, at his firing point), its Fire's ms
//             (a primed charge's fuseAtMs) and its burst's; a charge's burst of the last BURST_LOOK_MS, its tube spent;
//   holes     a ballistic breach's rounds (R.house.breach[door]: its points and their rounds) in the closed leaf, by point
//             (the lock at 1.0 m, the hinges at 1.75, 1.0 and 0.25: HOLE_Y_M), each its round's ms (R.shots, row 'shoot:door');
//   reads     the instructor's read of a practice burst (R.house.bursts[i].read, practice.js's: the truth, from the burst and
//             never before): its fade (readFade: in over READ_IN_MS 200, held READ_HOLD_MS 2,000, out over READ_OUT_MS 400),
//             a tick to each body it counted (a stand down, wounded, stunned or injured; a man of the stack with a fragment or
//             at STUN_KPA) with its fragments, and its ring: where a body standing would take RING_LAMBDA 0.71 (blast.js's
//             fragLambda, the G-9's K 160: 15.0 m), or for a G-13 its stun's radius in the air there (blast.js standoffM at
//             STUN_KPA), and the floor it may be drawn on (the rects of the rooms of the burst's own zone: the house, never the
//             apron outside its walls).
// Pure.
import { playerActor } from '../../core/ids.js';
import { hash01 } from '../../core/hash.js';
import { DEVICES } from './devices.js';
import { flightAt } from './throw.js';
import { standoffM, STUN_KPA } from './blast.js';
import { BURST_LOOK_MS } from '../combat/burst.js';
import { areaOf, openingOf, openingState } from '../places/model.js';
import { leafOf } from '../places/swing.js';
import { airAt } from '../places/env.js';

/** A device model the instructor reads as a live one (a practice grenade): DEVICES[m].as. */
export const isPractice = (model) => !!DEVICES[model]?.as;
/** At most this many of each drawn (kit2 §2.10's buffers: the render's). */
export const DEVICES_MAX = 4, CHARGES_MAX = 2, READ_TICKS_MAX = 16, HOLES_MAX = 24;
/** A thrown grenade's roll from its landing to where it lies (ms: the picture's, the sim puts it there at once; my call). */
export const ROLL_MS = 600;
/** The breach holes' heights by point (m: ballistic.js's), their way in from the leaf's edge (m). */
export const HOLE_Y_M = Object.freeze({ lock: 1.0, h1: 1.75, h2: 1.0, h3: 0.25 }), HOLE_IN_M = 0.12;
/** The read's time on the floor (ms): in, held, out (kit2 §2.10), and the ring's fragment density (λ standing: WEAPONS §12.3). */
export const READ_IN_MS = 200, READ_HOLD_MS = 2000, READ_OUT_MS = 400, RING_LAMBDA = 0.71;
/** The read's whole time on the floor (ms). */
export const READ_MS = READ_IN_MS + READ_HOLD_MS + READ_OUT_MS;

const houseOf = (state) => (state?.armoury?.range?.course === 'house' ? state.armoury.range.house ?? null : null);
const actorOf = (state, pid) => (!pid ? null : playerActor(state)?.who === pid ? playerActor(state) : state.actors?.list?.find(x => x.who === pid) ?? null);
const r3 = (v) => Math.round(v * 1000) / 1000;

/** A read's share drawn t ms after its burst (0 to 1): in over READ_IN_MS, held READ_HOLD_MS, out over READ_OUT_MS. */
export function readFade(t) {
  if (!(t >= 0)) return 0;
  if (t < READ_IN_MS) return t / READ_IN_MS;
  if (t < READ_IN_MS + READ_HOLD_MS) return 1;
  const u = (t - READ_IN_MS - READ_HOLD_MS) / READ_OUT_MS;
  return u < 1 ? 1 - u : 0;
}
/** A grenade's body at ms from its flight (see the header): { x, y, z, flying }, null before its release. */
export function bodyAt(flight, rest, ms) {
  if (!flight) return { x: rest.x, y: 0.03, z: rest.z, flying: false };
  if (ms < flight.fromMs) return null;
  if (ms < flight.landMs) { const p = flightAt(flight, ms); return { x: r3(p.x), y: r3(p.y), z: r3(p.z), flying: true }; }
  const u = Math.min(1, (ms - flight.landMs) / ROLL_MS), e = 1 - (1 - u) * (1 - u);
  return { x: r3(flight.x1 + (rest.x - flight.x1) * e), y: 0.03, z: r3(flight.z1 + (rest.z - flight.z1) * e), flying: false };
}

/**
 * The house's devices at ms (see the header): { grenades: [{ id, model, practice, at, lever, burstAtMs, done }], practice: [id],
 * charges: [{ id, model, door, side, st, firedAtMs, burstAtMs, from, to }], holes: [{ door, point, closed, x, y, z, atMs }], reads:
 * [{ id, x, z, atMs, k, as, ticks: [{ x, z, n, stack? }], ringM, floor: [rect] }] }, or null outside the house.
 */
export function devicesView(state, ms = state?.clock?.ms ?? 0) {
  const H = houseOf(state);
  if (!H || !state?.places) return null;
  const out = { grenades: [], practice: [], charges: [], holes: [], reads: [] };
  const sites = Object.values(state.places.sites ?? {});
  for (const site of sites) for (const l of site?.items ?? []) {
    const rec = state.items?.[l.id], D = DEVICES[rec?.model];
    if (!rec || D?.kind !== 'grenade' || !rec.flight || !Number.isFinite(rec.fuseAtMs)) continue;
    const at = bodyAt(rec.flight, l, ms);
    if (!at) continue;
    out.grenades.push({ id: l.id, model: rec.model, practice: !!D.as, at, lever: { id: l.id, from: [rec.flight.x0, rec.flight.z0], atMs: Number.isFinite(rec.leverAtMs) ? rec.leverAtMs : rec.flight.fromMs }, burstAtMs: rec.fuseAtMs, done: false });
  }
  for (const b of H.bursts ?? []) {
    if (!(ms >= b.atMs && ms - b.atMs < BURST_LOOK_MS)) continue;
    const D = DEVICES[b.model];
    if (D?.kind === 'grenade') out.grenades.push({ id: b.id, model: b.model, practice: !!D.as, at: { x: b.x, y: 0.03, z: b.z, flying: false }, lever: null, burstAtMs: b.atMs, done: true });
    if (D?.kind === 'charge' && b.door) out.charges.push({ id: b.id, model: b.model, door: b.door, side: D.side ?? 'latch', st: 'gone', firedAtMs: null, burstAtMs: b.atMs, ...tubeEnds(state, b.door, D.side ?? 'latch', b) });
    if (b.read && ms - b.atMs < READ_MS) out.reads.push(readOf(state, H, b, ms));
  }
  out.grenades = out.grenades.slice(-DEVICES_MAX);
  out.practice = out.grenades.filter(g => g.practice).map(g => g.id);
  for (const site of sites) for (const l of site?.items ?? []) {
    const rec = state.items?.[l.id], D = DEVICES[rec?.model];
    if (!rec || D?.kind !== 'charge' || !rec.door || (rec.st !== 'placed' && rec.st !== 'primed' && rec.st !== 'misfire')) continue;
    const side = rec.side ?? D.side ?? 'latch';
    out.charges.push({ id: l.id, model: rec.model, door: rec.door, side, st: rec.st, firedAtMs: rec.st === 'primed' && Number.isFinite(rec.fuseAtMs) ? rec.fuseAtMs : null, burstAtMs: null, ...tubeEnds(state, rec.door, side, { ...rec, id: l.id }) });
  }
  out.charges = out.charges.slice(-CHARGES_MAX);
  const shots = (state.armoury?.range?.shots ?? []).filter(s => s?.row?.id === 'shoot:door');
  for (const [door, B] of Object.entries(H.breach ?? {})) {
    const o = openingOf(door), L = o ? leafOf(o) : null;
    if (!L || !B?.points) continue;
    const closed = openingState(state, o) !== 'open', ux = (L.latch[0] - L.hinge[0]) / (L.widthM || 1), uz = (L.latch[1] - L.hinge[1]) / (L.widthM || 1);
    const mine = shots.filter(x => (x.target?.door ?? x.door) === door);
    let k0 = 0;
    for (const [point, n] of Object.entries(B.points)) for (let k = 0; k < Math.max(0, Number(n) || 0) && out.holes.length < HOLES_MAX; k++, k0++) {
      const edge = point === 'lock' ? L.latch : L.hinge, s = point === 'lock' ? -1 : 1, j = (hash01('hole', door, point, k) - 0.5) * 0.06;
      out.holes.push({ door, point, closed, x: r3(edge[0] + s * ux * (HOLE_IN_M + j)), z: r3(edge[1] + s * uz * (HOLE_IN_M + j)), y: r3((HOLE_Y_M[point] ?? 1.0) + (hash01('hole-y', door, point, k) - 0.5) * 0.05), atMs: mine[k0]?.atMs ?? B.atMs ?? null });
    }
  }
  return out;
}
// (the shock tube's ends: the charge on its door's edge, and its FD-1 (D1's `tubeId`, D2's initiator `chargeId`) where it lies,
// else the man who placed the charge (its `byId`), who fires it from his safe point)
function tubeEnds(state, door, side, rec) {
  const o = openingOf(door), L = o ? leafOf(o) : null;
  if (!L) return { from: null, to: null };
  const edge = side === 'hinge' ? L.hinge : L.latch;
  const fd = rec?.tubeId ?? Object.entries(state.items ?? {}).find(([, r]) => r?.type === 'initiator' && r.chargeId === rec?.id)?.[0] ?? null;
  let to = null;
  if (fd) for (const site of Object.values(state.places?.sites ?? {})) { const l = site?.items?.find(x => x.id === fd); if (l) to = [l.x, l.z]; }
  const a = to ? null : actorOf(state, rec?.byId);
  if (a) to = [r3(a.x), r3(a.z)];
  return { from: [edge[0], edge[1]], to };
}
// (a read as drawn: its ticks to each body it counted, where it stands now, and its ring)
function readOf(state, H, b, ms) {
  const R = state.armoury.range, rd = b.read, ticks = [];
  for (const [key, s] of Object.entries(rd.stands ?? {})) {
    if (!(s?.n >= 1 || s?.out)) continue;
    const T = (R.turners ?? []).find(t => t.key === key);
    if (T) ticks.push({ x: T.x, z: T.z, n: s.n ?? 0 });
  }
  for (const [who, s] of Object.entries(rd.stack ?? {})) {
    if (!(s?.n >= 1 || s?.kPa >= STUN_KPA)) continue;
    const a = actorOf(state, who === 'me' ? state.player?.id : who === 'two' ? H.twoPid : who);
    if (a) ticks.push({ x: r3(a.x), z: r3(a.z), n: s.n ?? 0, stack: true });
  }
  const live = DEVICES[rd.as ?? DEVICES[b.model]?.as];
  const x = rd.x ?? b.x, z = rd.z ?? b.z, air = airAt(state, state.places?.live?.area, x, z), Pa = air?.vacuum ? 0 : air?.pKpa ?? 0;
  const ringM = live?.frag?.K ? Math.sqrt(live.frag.K / RING_LAMBDA) : live?.tntKg && Pa > 0 ? standoffM(live.tntKg, Pa, STUN_KPA) : 0;
  // (the floor the ring is drawn on: the burst's own building, its zone's rooms (the house's walls stop every ball: WALL_STOPS))
  const A = areaOf(state.places?.live?.area), at = (A?.rooms ?? []).find(q => x >= q.rect[0] && x <= q.rect[2] && z >= q.rect[1] && z <= q.rect[3]);
  const floor = (A?.rooms ?? []).filter(q => q.rect && (!at?.zone || q.zone === at.zone)).map(q => q.rect);
  return { id: b.id, x, z, atMs: b.atMs, k: readFade(ms - b.atMs), as: rd.as ?? null, ticks: ticks.slice(0, READ_TICKS_MAX), ringM: r3(ringM), floor };
}
