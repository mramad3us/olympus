// OLYMPUS tests: the splash's picture as numbers (src/render/splash.js irisOf and cropOf, src/render/vignettes.js vignetteItems), in node.
//
// The GPU pass draws what irisOf() says, so this reads the same radii: the full form's iris closing from
// beyond the picture's corners to SPLASH_IRIS_M 3.5 m as inkK goes 0 to 1 and opening again; a brief
// fast-forward's ring at BRIEF_RING_M 6 m and a brief outcome skip's iris (TIME §6.1: inked before
// anything is placed); the beat by the interrupt's kind (an alert's red twice in it, reveille's tubes
// striking, the body's edge pulse). The zoom's crop (VIEWS §2.4): zoom times smaller round the centre,
// kept in the picture, its corner on a whole pixel once settled. And each vignette's pieces at the
// fixtures of Echo's Head A and bay-2-1: what stands where, inside the fixture's footprint grown by half a
// metre and below 3 m, by the activity's part (the shower's water only in its water part, the towel over
// the partition until dressing, the stall's boots and slide, the open locker). Prints the radii, the
// crops and the items.
import { assert, fmt } from './helpers.mjs';
import { irisOf, cropOf, SPLASH_ZOOM, SPLASH_IRIS_M, BRIEF_RING_M, IRIS_EDGE_M, RING_EDGE_M, BEAT_EDGE_M } from '../src/render/splash.js';
import { vignetteItems, insideSpot, fixturePoint, faceToward } from '../src/render/vignette-items.js';
import { VIGNETTE_PIECES } from '../src/art/kit/vignette.js';
import { FOOTPRINTS } from '../src/art/kit/index.js';
import { areaOf } from '../src/sim/places/model.js';

const VIEW_M = [40, 22.5];
const frame = (o) => ({ form: 'full', engine: 'outcome', phase: 'lapse', k: 0.5, zoom: SPLASH_ZOOM, irisM: SPLASH_IRIS_M, inkK: 1, centre: { x: 0, z: 0 }, ...o });

export default [
  {
    name: 'the iris closes from beyond the picture to 3.5 m as the zoom eases in, holds through the lapse, opens on the zoom out; a brief fast-forward dims beyond its 6 m ring, a brief outcome skip inks beyond the iris (TIME §6.1, VIEWS §5.1)',
    fn() {
      const far = Math.hypot(...VIEW_M) / 2;
      const rows = [0, 0.25, 0.5, 0.75, 1].map(k => { const it = irisOf(frame({ phase: 'in', inkK: k, zoom: 1 + (SPLASH_ZOOM - 1) * k }), VIEW_M); return `${k}: R ${fmt(it.iris.R, 1)} m, zoom ${fmt(it.zoom, 2)}`; });
      const shut = irisOf(frame({}), VIEW_M), open = irisOf(frame({ inkK: 0, phase: 'out' }), VIEW_M);
      const ff = irisOf({ form: 'brief', engine: 'ff', phase: 'lapse', zoom: 1, irisM: Infinity, inkK: 1 }, VIEW_M), oc = irisOf({ form: 'brief', engine: 'outcome', phase: 'lapse', zoom: 1, irisM: Infinity, inkK: 1 }, VIEW_M);
      console.log(`      zooming in (inkK): ${rows.join('; ')}; the edge ${IRIS_EDGE_M} m; open R ${fmt(open.iris.R, 1)} m beyond the corners' ${fmt(far, 1)}`);
      console.log(`      a brief fast-forward: ring ${ff.ring?.R} m (edge ${RING_EDGE_M} m), iris ${ff.iris}; a brief outcome skip: iris ${oc.iris?.R} m, ring ${oc.ring}`);
      assert(shut.iris.R === SPLASH_IRIS_M && open.iris.R > far, 'closed at 3.5 m, open beyond the picture');
      assert(ff.ring.R === BRIEF_RING_M && ff.iris === null && oc.iris.R === SPLASH_IRIS_M && oc.ring === null, 'the brief forms');
      assert(!irisOf(null).on, 'no splash, nothing');
    },
  },
  {
    name: 'the beat shows its cause (TIME §6.5): an alert\'s red twice in the 0.6 s, reveille\'s overheads striking, the body\'s edge pulsing in and out',
    fn() {
      const ks = [0, 0.1, 0.25, 0.5, 0.6, 0.75, 1];
      const at = (kind, letter) => ks.map(k => irisOf(frame({ phase: 'beat', k, interrupt: { kind, letter } }), VIEW_M));
      const red = at('alert', 'A').map(it => fmt(it.beat.pulse, 2)), rev = at('reveille', 'O').map(it => fmt(it.beat.pulse, 2)), body = at('body', 'B').map(it => fmt(it.iris.R, 2));
      console.log(`      at k ${ks.join(', ')}: alert red ${red.join(' ')}; reveille's light ${rev.join(' ')}; the body's iris ${body.join(' ')} m`);
      const peaks = at('alert', 'A').map(it => it.beat.pulse);
      assert(peaks[2] > 0.5 && peaks[3] < 0.05 && peaks[5] > 0.5, 'two pulses of red');
      assert(at('reveille', 'O')[0].beat.pulse < 1 && at('reveille', 'O')[6].beat.pulse === 1, 'the tubes strike, then on');
      assert(Math.abs(at('body', 'B')[3].iris.R - (SPLASH_IRIS_M - BEAT_EDGE_M)) < 1e-9 && at('body', 'B')[0].iris.R === SPLASH_IRIS_M, 'the edge pulses');
      assert(irisOf(frame({ phase: 'lapse', interrupt: { kind: 'alert' } }), VIEW_M).beat === null, 'no beat outside its phase');
    },
  },
  {
    name: 'the zoom is a crop zoom times smaller round its centre, kept inside the picture, settled on a whole pixel (VIEWS §2.4: 13.3 × 7.5 m in view at zoom 3)',
    fn() {
      const W = 640, H = 360, rows = [];
      for (const [z, px, py] of [[3, 320, 180], [3, 10, 10], [3, 630, 355], [2.2, 300.4, 200.7], [1, 320, 180]]) {
        const c = cropOf(W, H, z, px, py, { settled: z >= SPLASH_ZOOM }), mx = c.w / 16, mz = c.h / 16;
        rows.push(`zoom ${z} at (${px}, ${py}): ${fmt(c.x, 2)}, ${fmt(c.y, 2)} ${fmt(c.w, 1)} × ${fmt(c.h, 1)} px (${fmt(mx, 1)} × ${fmt(mz, 1)} m)`);
        assert(c.x >= 0 && c.y >= 0 && c.x + c.w <= W + 1e-9 && c.y + c.h <= H + 1e-9, `inside: ${JSON.stringify(c)}`);
        if (z >= SPLASH_ZOOM) assert(Number.isInteger(c.x) && Number.isInteger(c.y), 'settled on a whole pixel');
      }
      const c3 = cropOf(W, H, 3, 320, 180, { settled: true });
      console.log(`      ${rows.join('; ')}`);
      assert(Math.abs(c3.w / 16 - 13.33) < 0.01 && Math.abs(c3.h / 16 - 7.5) < 1e-9, 'zoom 3 shows 13.3 × 7.5 m');
    },
  },
  {
    name: 'each vignette stands its pieces at Echo\'s fixtures by the activity\'s part: the shower\'s steam before you and its water in the water part only, the stall\'s boots and slide, the open locker, the sink\'s tap; all within the fixture, none over 3 m',
    fn() {
      const area = areaOf('melas.echo.1'), F = (id) => area.fixtures.find(f => f.id === id);
      const shower = F('f:e1:head-2a:shower-2'), stall = F('f:e1:head-2a:stall-1'), sink = F('f:e1:head-2a:sinks-1'), locker = F('f:e1:bay-2-1:locker-n1a');
      const cases = [
        ['shower', shower, 'in'], ['shower', shower, 'water'], ['shower', shower, 'dress'], ['stall', stall, 'sit'], ['sink', sink, 'face'], ['sink', sink, 'teeth'], ['locker', locker, 'dress'], ['rack', F('f:e1:bay-2-1:rack-n1'), 'lie'], ['standby', locker, 'wait'],
      ];
      const rows = [];
      for (const [v, f, part] of cases) {
        const items = vignetteItems({ sp: { vignette: v, part, vk: 0.8, activity: v, fromMs: 23505105700 }, fixture: f, you: { x: f.x + 0.6, z: f.z + 0.6 }, tS: 1.3 });
        const fp = FOOTPRINTS[f.kind], hw = Math.max(fp.w, fp.d) / 2 + 0.5;
        for (const it of items) {
          const def = VIGNETTE_PIECES[it.name];
          assert(def, `${v}: no piece ${it.name}`);
          assert(Math.abs(it.x - f.x) <= hw && Math.abs(it.z - f.z) <= hw && it.y >= 0 && it.y + def.hM <= 3.0, `${v} ${part}: ${it.name} at (${fmt(it.x, 2)}, ${fmt(it.y, 2)}, ${fmt(it.z, 2)}) outside ${f.id}`);
        }
        rows.push(`${v}/${part} [${items.map(i => i.name).join(' ')}]`);
        const names = items.map(i => i.name);
        if (v === 'shower') assert((names.includes('steam') || names.includes('steamCover')) && names.includes('water') === (part === 'water') && names.includes('towelHung') === (part !== 'dress'), `the shower's ${part}: ${names}`);
        if (v === 'stall') assert(names.includes('boots') && names.includes('slide'), 'the stall');
        if (v === 'locker') assert(names.includes('lockerOpen'), 'the locker');
        if (v === 'rack' || v === 'standby') assert(!items.length, `${v} stands nothing of its own`);
      }
      const in2 = insideSpot(shower);
      console.log(`      ${rows.join('; ')}`);
      console.log(`      in ${shower.id} (facing ${shower.face}) you stand at (${in2.x}, ${in2.z}) facing ${in2.face}, its head at (${fixturePoint(shower, 0.1, -0.44).map(v => fmt(v, 2)).join(', ')}); the toilet stall hides you (${insideSpot(stall)})`);
      assert(in2.face === faceToward(shower, 0, -0.5) && in2.face === 'down', 'in Head A you face the shower\'s head, south, toward the camera');
      assert(insideSpot(stall) === null, 'a toilet stall hides you');
    },
  },
];
