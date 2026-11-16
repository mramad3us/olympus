// OLYMPUS tests: the kit's devices drawn by code (VIEWS §7.3; the build sheet 0.0.19 §6 K-face, kit2 §6 test 37; src/render/devices.js), in node with three.js and no GPU.
//
// kit2 §2.10: every buffer the devices layer draws with is allocated at its making (DEVICES_MAX, CHARGES_MAX, TUBE_PX,
// READ_TICKS_MAX, HOLES_MAX), so no buffer is made or grown after the first frame: over a G-9P's throw, its burst and its read
// in room 1, and a BC-1 placed, primed and fired on room 2's pull door with a ballistic breach's holes in the closet's leaf,
// the layer's buffers keep their arrays and their bytes on every frame, never overflow, and nothing is written while the clock
// stands. Nothing pops: the practice body and its lever are drawn on the frames either side of the burst, and the read's
// overlay fades in over 200 ms, holds 2 s and fades out over 400 ms, no frame dropping more than a fifth of it. The house's G-11
// stays the bangs layer's, a practice grenade this layer's. Fails without the layer, its allocation at load, its dither or its
// session's lever.
import { registerHooks } from 'node:module';
import { assert, fmt } from './helpers.mjs';
import * as THREE from '../vendor/three/build/three.module.js';
import { createGame } from './game.mjs';
import { burst } from '../src/sim/combat/burst.js';
import { move } from '../src/sim/arms/kit.js';
import { setSt } from '../src/sim/arms/devices.js';

// (the page's import map in node: the render modules import 'three' by its bare name, here the vendored build)
const THREE_URL = new URL('../vendor/three/build/three.module.js', import.meta.url).href;
registerHooks({ resolve: (spec, ctx, next) => (spec === 'three' ? { url: THREE_URL, shortCircuit: true } : next(spec, ctx)) });
const { createDevices, bangListOf, DEVICES_MAX, CHARGES_MAX, TUBE_PX, READ_TICKS_MAX, HOLES_MAX } = await import('../src/render/devices.js');
const { devicesView, readFade, READ_IN_MS, READ_HOLD_MS, READ_OUT_MS } = await import('../src/sim/arms/devlook.js');
const { rangeLook } = await import('../src/sim/arms/look.js');
// (the layer as the view runs it: the house look's kit at the moment drawn)
const draw = (L, s, ms, views) => L.update(rangeLook(s, ms)?.house?.kit ?? null, { ms, views, sessionKey: 'one' });

const FRAME_MS = 1000 / 60;

// (a lane at GO on the mixed loadout (a G-11, a G-9P, a BC-1 with its FD-1 on you), the G-9P thrown deep into room 1 at t0
// and the BC-1 on room 2's hinges, as K-sim's beats would leave them; the read a stub of practice.js's shape (§3.1))
function scene() {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', setup: 'go', loadout: 'mixed' });
  const s = g.state, area = s.places.live.area, H = s.armoury.range.house, me = s.player.id;
  const ids = (m) => Object.keys(s.items).filter(id => s.items[id].model === m);
  const g9p = ids('g9p')[0], bc1 = ids('bc1')[0], fd1 = ids('fd1')[0];
  return { g, s, area, H, me, g9p, bc1, fd1 };
}
function throwIt(S, t0) {
  const { s, area, g9p } = S, rec = s.items[g9p];
  const fromMs = t0, landMs = t0 + 1200, vz = (8.8 - 13.0) / 1.2, vy = (0.05 - 1.4 + 0.5 * 9.8 * 1.44) / 1.2;
  move(s, g9p, { ground: { area, x: 29.1, z: 8.6 } });
  setSt(s, g9p, 'live');
  Object.assign(rec, { fuseAtMs: t0 + 4300, leverAtMs: t0, byId: S.me, flight: { x0: 29.0, y0: 1.4, z0: 13.0, vx: 0, vy, vz, g: 9.8, fromMs, landMs, x1: 29.0, z1: 8.8, door: 'o:w4:r1' } });
}
function readOf(S, b) {
  return { model: 'g9p', as: 'g9', x: b.x, z: b.z, atMs: b.atMs, room: 'w4.r1', kPaRoom: 0.4,
    stands: { 'turner:1': { stand: '1a', face: 'threat', rM: 2.3, lam: 31, n: 4, kPa: 48, out: 'down', stunMs: 0 }, 'turner:2': { stand: '1b', face: 'threat', rM: 2.3, lam: 31, n: 3, kPa: 48, out: 'down', stunMs: 0 } },
    stack: { me: { rM: 3.8, lam: 0, n: 0, kPa: 17.4 }, two: { rM: 4.4, lam: 0, n: 0, kPa: 13.1 } }, noncombatants: [], fragged: false, concussed: [], exposed: null, uncookedMs: null };
}

export default [
  {
    name: 'every device draw\'s pixels are allocated at load (kit2 §2.10): over a G-9P\'s throw, burst and read and a BC-1 placed, primed and fired on room 2\'s pull door with the closet\'s breach holes, the layer\'s buffers keep their arrays and bytes on every frame, never overflow, and write nothing with the clock held',
    fn() {
      const S = scene(), { s, H } = S, stage = { THREE, ppm: 16 }, L = createDevices(stage, { ppm: 16 });
      const arrays = () => Object.values(L.pixels).flatMap(p => [p.mesh.instanceMatrix.array, ...['aColor', 'aTint', 'aPart'].map(k => p.mesh.geometry.getAttribute(k).array)]);
      const a0 = arrays(), bytes0 = L.stats.allocBytes, max = L.stats.max;
      const t0 = 10_000, fire = t0 + 9_000, cutAt = fire + 1_500, views = [{ x0: 5, x1: 36, z0: 4, z1: 22 }];
      let thrown = false, burst1 = null, placed = false, primed = false, cut = false, holes = false, frames = 0, worst = { body: 0, puff: 0, read: 0, pop: 0 }, overflow = 0;
      const seen = { strip: 0, tubeLit: 0, holes: 0, bodiesAround: [], leversAround: [] };
      for (let ms = t0 - 500; ms < t0 + 16_000; ms += FRAME_MS) {
        if (!thrown && ms >= t0) { throwIt(S, t0); thrown = true; }
        if (thrown && !burst1 && ms >= t0 + 4300) { burst(s, null, { id: S.g9p, model: 'g9p', x: 29.1, z: 8.6, atMs: t0 + 4300, byId: S.me, called: true }); burst1 = H.bursts.at(-1); burst1.read = readOf(S, burst1); }
        if (!placed && ms >= t0 + 6000) { move(s, S.bc1, { ground: { area: S.area, x: 20.15, z: 14.4 } }); setSt(s, S.bc1, 'placed'); Object.assign(s.items[S.bc1], { door: 'o:w4:r2', side: 'hinge' }); placed = true; }
        if (!primed && ms >= t0 + 8000) { move(s, S.fd1, { ground: { area: S.area, x: 23.3, z: 13.95 } }); Object.assign(s.items[S.fd1], { st: 'fitted', chargeId: S.bc1 }); setSt(s, S.bc1, 'primed'); primed = true; }
        if (primed && !cut && !s.items[S.bc1].fuseAtMs && ms >= fire) s.items[S.bc1].fuseAtMs = cutAt;
        if (!cut && ms >= cutAt) { burst(s, null, { id: S.bc1, model: 'bc1', x: 20.15, z: 14.4, atMs: cutAt, byId: S.me, called: true, door: 'o:w4:r2' }); cut = true; }
        if (!holes && ms >= t0 + 13_000) { (H.breach ??= {})['o:w4:closet'] = { how: 'lock', rounds: 3, points: { lock: 3 }, atMs: t0 + 13_000 }; holes = true; }
        const st = draw(L, s, ms, views);
        frames++;
        worst = { body: Math.max(worst.body, st.bodies + st.levers + st.tube + st.holes), puff: Math.max(worst.puff, st.puff), read: Math.max(worst.read, st.readPx), pop: Math.max(worst.pop, st.pop) };
        if (st.pixels > max.body + max.puff + max.read + max.pop) overflow++;
        if (Math.abs(ms - (t0 + 4300)) < 3 * FRAME_MS) { seen.bodiesAround.push(st.bodies); seen.leversAround.push(st.levers); }
        if (placed && !cut) seen.strip = Math.max(seen.strip, st.charges);
        if (ms >= fire && ms < cutAt) seen.tubeLit = Math.max(seen.tubeLit, st.tube);
        seen.holes = Math.max(seen.holes, st.holes);
      }
      const same = arrays().every((x, i) => x === a0[i]);
      // (the clock held: the same moment drawn twice writes nothing)
      const w0 = draw(L, s, t0 + 5000, views).writes, w1 = draw(L, s, t0 + 5000, views).writes;
      console.log(`      ${frames} frames over ${fmt((frames * FRAME_MS) / 1000, 1)} s; buffers ${fmt(bytes0 / 1024, 1)} KB made at load (DEVICES_MAX ${DEVICES_MAX}, CHARGES_MAX ${CHARGES_MAX}, TUBE_PX ${TUBE_PX}, READ_TICKS_MAX ${READ_TICKS_MAX}, HOLES_MAX ${HOLES_MAX}), the same ${same ? 'arrays' : 'NOT the same arrays'} at the end, ${fmt(L.stats.allocBytes / 1024, 1)} KB; ${L.stats.writes} frames written of ${frames}`);
      console.log(`      most pixels a frame: bodies, levers, strip, tube and holes ${worst.body} of ${max.body}, puff ${worst.puff} of ${max.puff}, read ${worst.read} of ${max.read}, pop ${worst.pop} of ${max.pop}; over its buffer ${overflow}`);
      console.log(`      around the burst: bodies ${seen.bodiesAround.join(',')}, levers ${seen.leversAround.join(',')}; the BC-1 strip drawn ${seen.strip}, the tube lit ${seen.tubeLit} px from Fire to the cut; holes ${seen.holes} px; the clock held: writes ${w0} then ${w1}`);
      assert(same && L.stats.allocBytes === bytes0 && !overflow, JSON.stringify({ same, bytes0, now: L.stats.allocBytes, overflow }));
      assert(worst.read > 0 && worst.puff > 0 && worst.pop > 0 && seen.strip === 1 && seen.tubeLit > 0 && seen.holes > 0, JSON.stringify({ worst, seen }));
      assert(seen.bodiesAround.every(n => n > 0) && seen.leversAround.every(n => n > 0), `the practice body and its lever stay drawn across the burst: ${JSON.stringify(seen)}`);
      assert(w1 === w0, `the clock held writes nothing: ${w0} then ${w1}`);
    },
  },
  {
    name: 'the instructor\'s read fades in over 200 ms, holds 2 s and fades out over 400 ms (kit2 §2.10: "so nothing pops"): its ticks to 1a and 1b, their counts and its 15 m ring clipped to the floor, no frame dropping more than a fifth of it; shown from the burst, never before',
    fn() {
      const S = scene(), { s, H } = S, L = createDevices({ THREE, ppm: 16 }, { ppm: 16 }), views = [{ x0: 5, x1: 36, z0: 4, z1: 22 }];
      const t0 = 10_000;
      throwIt(S, t0);
      const before = devicesView(s, t0 + 4000).reads.length;
      burst(s, null, { id: S.g9p, model: 'g9p', x: 29.1, z: 8.6, atMs: t0 + 4300, byId: S.me, called: true });
      const b = H.bursts.at(-1); b.read = readOf(S, b);
      const rows = [];
      let full = 0, prev = 0, worstDrop = 0, worstRise = 0;
      for (let t = -100; t <= READ_IN_MS + READ_HOLD_MS + READ_OUT_MS + 100; t += FRAME_MS) {
        const n = draw(L, s, t0 + 4300 + t, views).readPx;
        full = Math.max(full, n);
        if (prev && n < prev) worstDrop = Math.max(worstDrop, prev - n);
        if (n > prev) worstRise = Math.max(worstRise, n - prev);
        prev = n;
      }
      const at = (t) => draw(L, s, t0 + 4300 + t, views).readPx;
      for (const t of [-50, 0, 100, 200, 1000, 2200, 2400, 2600, 2700]) rows.push(`${t} ms ${at(t)}`);
      const v = devicesView(s, t0 + 4300 + 500).reads[0];
      console.log(`      before the burst: ${before} reads; the read's pixels by time: ${rows.join(', ')}; full ${full}; the most a frame gained ${worstRise}, lost ${worstDrop} (${fmt((100 * worstDrop) / Math.max(1, full), 1)}%); ticks ${v.ticks.map(t => `${fmt(t.x, 2)},${fmt(t.z, 2)} n ${t.n}`).join(' · ')}; ring ${fmt(v.ringM, 2)} m; readFade(100) ${fmt(readFade(100), 2)}`);
      assert(before === 0 && at(-50) === 0 && at(2700) === 0 && at(1000) === full && at(100) > 0 && at(100) < full && at(2400) > 0 && at(2400) < full, rows.join(', '));
      assert(worstDrop <= full / 5 && worstRise <= full / 5, JSON.stringify({ worstDrop, worstRise, full }));
      assert(v.ticks.length === 2 && v.ticks.every(t => t.n >= 3) && Math.abs(v.ringM - 15.01) < 0.05, JSON.stringify(v));
    },
  },
  {
    name: 'the house\'s G-11 stays the bangs layer\'s and a practice grenade is this layer\'s (bangListOf, the house look\'s kit.practice): the pairs\' and the stress course\'s bangs as before, null where none',
    fn() {
      const g11 = { id: 'i24', model: 'g11', x: 1, z: 1, atMs: 1 }, g9p = { id: 'i26', model: 'g9p', x: 2, z: 2, atMs: 2 }, g13p = { id: 'i27', model: 'g13p', x: 3, z: 3, atMs: 3 }, pb = { id: 'b1', x: 0, z: 0, atMs: 0 };
      const kit = { practice: ['i26', 'i27'] };
      const house = bangListOf({ house: { bangs: [g11, g9p, g13p], kit } }), pairs = bangListOf({ pairs: { bangs: [pb] } }), none = bangListOf({ house: { bangs: [g9p], kit } }), empty = bangListOf(null);
      console.log(`      house [G-11, G-9P, G-13P] → ${house?.map(b => b.model).join(', ')}; pairs → ${pairs?.length}; practice alone → ${none}; none → ${empty}`);
      assert(house.length === 1 && house[0] === g11 && pairs[0] === pb && none === null && empty === null, JSON.stringify({ house, pairs, none, empty }));
    },
  },
];
