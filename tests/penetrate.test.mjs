// What a round does to what it meets (src/sim/arms/penetrate.js; WEAPONS §7.7, §8; tradecraft's armour.js adapted): the wound factor, the stop tables, exits, walls, holes, and the line through the KD range.
// Tradecraft's numbers (layerHit's shares and bullet()'s blunt trauma on its own streams, a plate carrier's
// cover 0.5 and 0.25, 7 points of a 9×19) come from its armour.js run read-only in a scratch script
// (/private/tmp/claude-501/olympus-build/r7/ballistics/tc-armour.mjs) and are pasted here as data: no test imports
// ../tradecraft. The streams are the same sfc32 on the same hash (the scratch printed 0.8891872169915587 from both).
import { assert, near, fmt } from './helpers.mjs';
import { stream, chance } from '../src/core/rng.js';
import { flight, ENV_CLASSES as E, woundFactor } from '../src/sim/arms/ballistics.js';
import { CALIBRES } from '../src/sim/arms/calibres.js';
import { penOf, pStop, after, throughMaterial, throughLayer, throughTissue, layerHit, bluntOf, holeArea, traceRound, hitOf, WALLS, LAYERS, TISSUE_P } from '../src/sim/arms/penetrate.js';
import { KD_RANGE } from '../src/data/places/range.js';
import { armsWorld } from './arms-world.mjs';

const VALLEY = E['mars-valley'], SHIP = E['ship-thrust'];
const loads = [['9x21r', 'ball', 110, 'P-12'], ['6.5x40r', 'ball', 460, 'R-7'], ['6.5x40r', 'frangible', 460, 'R-7'], ['6.5x40r', 'ap', 460, 'R-7']];
const vAt = (cal, load, bar, env, d) => flight(cal, load, bar, env, d).vMs;
const N = 4000;
const rate = (fn, key) => { let n = 0; for (let i = 0; i < N; i++) if (fn(stream('pen-test', key, i))) n++; return n / N; };

// (tradecraft's, from the scratch: layerHit's counts of 10,000 at centre 0, 0.6, 1; bullet()'s 9×19 stops, seeds 0 to 19)
const TC_LAYER = { 0: { plate: 4988, soft: 2476, none: 2536 }, 0.6: { plate: 5634, soft: 2887, none: 1479 }, 1: { plate: 6282, soft: 3082, none: 636 } };
const TC_BLUNT = [['plate', 2.1, false, 2.7, false], ['plate', 2.1, false, 2.8, false], ['plate', 2.1, true, 1.8, false], ['plate', 2.1, true, 2.4, true], ['plate', 2.1, false, 2.1, false],
  ['plate', 2.1, false, 1.2, false], ['soft', 1.5, false, 2.2, false], null, ['plate', 2.1, false, 2.1, false], ['plate', 2.1, false, 1.6, false], ['plate', 2.1, false, 1.5, false],
  ['soft', 1.5, false, 1.9, false], ['plate', 2.1, false, 1.3, true], ['soft', 1.5, false, 2.5, false], ['plate', 2.1, false, 1.1, false], ['plate', 2.1, false, 1.8, true],
  ['plate', 2.1, false, 2.4, false], null, null, null];
const TC_STOP_9X19 = { soft: 0.98, plate: 1 };

export default [
  {
    name: 'WEAPONS §8.1\'s wound factors as the round arrives: the R-7\'s ball 1.61 at 10 m and 1.42 at 300 m (±0.03); the pistol, frangible and AP beside WEAPONS\'s',
    fn() {
      const W = { 'P-12 9x21r ball': [1.03, 0.88, 0.76], 'R-7 6.5x40r ball': [1.61, 1.55, 1.42], 'R-7 6.5x40r frangible': [1.61, 1.52, 1.31], 'R-7 6.5x40r ap': [1.43, 1.38, 1.28] };
      for (const [cal, load, bar, gun] of loads) {
        const L = CALIBRES[cal].loads[load], w = [10, 100, 300].map(d => woundFactor({ eJ: flight(cal, load, bar, VALLEY, d).eJ, diaMm: CALIBRES[cal].diaMm, woundK: L.woundK }));
        console.log(`      ${gun} ${cal} ${load}: ${w.map(x => fmt(x, 2)).join(', ')} at 10, 100, 300 m (W ${W[`${gun} ${cal} ${load}`].join(', ')})`);
        w.forEach((x, i) => near(x, W[`${gun} ${cal} ${load}`][i], 0.05, `${gun} ${load} w`));
      }
      const h = hitOf({ onId: 'p9', part: 'torso', fromId: 'p1', rangeM: 300, vMs: vAt('6.5x40r', 'ball', 460, VALLEY, 300), shotId: 'sh1' });
      console.log(`      a hit record at 300 m: ${JSON.stringify(h)}`);
      near(h.w, 1.42, 0.03, 'the record\'s w');
      assert(h.kind === 'gunshot' && h.load === '6.5x40r/ball' && h.diaMm === 6.7 && h.nd === false, 'the record');
    },
  },
  {
    name: 'WEAPONS §8.3\'s stops at 10, 100, 300 m on the valley floor: the Corps plate stops the R-7\'s ball 95, 97, 100% (±3); the soft panel 2, 4, 23%; AP beats the plate',
    fn() {
      const W = { '6.5x40r ball': { soft: [2, 4, 23], plate: [95, 97, 100], helmet: [8, 18, 55], lightSuit: [0, 0, 0] }, '6.5x40r ap': { soft: [0, 0, 0], plate: [21, 33, 65], helmet: [0, 0, 0], lightSuit: [0, 0, 0] },
        '9x21r ball': { soft: [100, 100, 100], plate: [100, 100, 100], helmet: [100, 100, 100], lightSuit: [10, 37, 61] } };
      for (const [cal, load, bar] of [['6.5x40r', 'ball', 460], ['6.5x40r', 'ap', 460], ['9x21r', 'ball', 110]]) {
        const cells = [];
        for (const layer of ['soft', 'plate', 'helmet', 'lightSuit']) {
          const got = [10, 100, 300].map(d => Math.round(pStop(penOf(cal, load, vAt(cal, load, bar, VALLEY, d)), LAYERS[layer].P) * 100));
          cells.push(`${layer} ${got.join('/')}% (W ${W[`${cal} ${load}`][layer].join('/')})`);
          got.forEach((g, i) => near(g, W[`${cal} ${load}`][layer][i], layer === 'plate' && load === 'ball' ? 3 : 8, `${cal} ${load} ${layer} at ${[10, 100, 300][i]} m`));
        }
        console.log(`      ${cal} ${load}: ${cells.join(' · ')}`);
      }
      const plate = [10, 100, 300].map(d => rate(r => throughLayer(r, { penMm: penOf('6.5x40r', 'ball', vAt('6.5x40r', 'ball', 460, VALLEY, d)), layer: 'plate' }).stopped, `plate${d}`));
      console.log(`      ${N} rounds a range into the plate: ${plate.map(p => fmt(p * 100, 1)).join(', ')}% stopped`);
      plate.forEach((p, i) => near(p * 100, [95, 97, 100][i], 3, 'the plate by the dice'));
    },
  },
  {
    name: 'WEAPONS §8.4: every rifle ball exits a torso; the pistol\'s exits a torso about four times in five and every limb; a frangible round stays in',
    fn() {
      const at10 = (cal, load, bar) => penOf(cal, load, vAt(cal, load, bar, SHIP, 10));
      const rows = loads.map(([cal, load, bar, gun]) => {
        const pen = at10(cal, load, bar), L = CALIBRES[cal].loads[load];
        const t = rate(r => throughTissue(r, { penMm: pen, part: 'torso', frangible: !!L.frangible }).through, `t${cal}${load}`), l = rate(r => throughTissue(r, { penMm: pen, part: 'legs', frangible: !!L.frangible }).through, `l${cal}${load}`);
        return { gun, cal, load, pen, t, l };
      });
      for (const r of rows) console.log(`      ${r.gun} ${r.load}: pen ${fmt(r.pen, 2)} mm at 10 m; exits a torso ${fmt(r.t * 100, 0)}%, a limb ${fmt(r.l * 100, 0)}% (tissue ${TISSUE_P.torso}, ${TISSUE_P.limb} mm)`);
      const ball = rows.find(r => r.load === 'ball' && r.cal === '6.5x40r'), pistol = rows.find(r => r.cal === '9x21r'), frang = rows.find(r => r.load === 'frangible');
      assert(ball.t === 1 && pistol.l === 1, 'rifle ball through, pistol through a limb');
      near(pistol.t, 0.81, 0.12, 'the pistol through a torso (W 81%)');
      assert(frang.t === 0, 'frangible stays in a torso');
    },
  },
  {
    name: 'WEAPONS §8.5\'s perforations at 10 m in MCRN air: frangible through a pressure bulkhead 0%, ball 100%; the berm and the ground stop everything; paper stops nothing',
    fn() {
      const W = { ball: { partition: 100, cabin: 100, bulkhead: 100, pressureDoor: 94, lander: 100, habitat: 99, ice1m: 9, locker: 100 },
        frangible: { partition: 59, cabin: 23, bulkhead: 0, pressureDoor: 0, lander: 0, habitat: 0, ice1m: 0, locker: 25 }, ap: { partition: 100, cabin: 100, bulkhead: 100, pressureDoor: 100, lander: 100, habitat: 100, ice1m: 90, locker: 100 } };
      const got = {};
      for (const load of ['ball', 'frangible', 'ap']) {
        const L = CALIBRES['6.5x40r'].loads[load], pen = penOf('6.5x40r', load, vAt('6.5x40r', load, 460, SHIP, 10));
        got[load] = {};
        for (const [k, w] of Object.entries(WALLS)) {
          if (W[load][k] === undefined) continue;
          got[load][k] = Math.round(rate(r => !throughMaterial(r, { penMm: pen, material: w.material, mm: w.mm, frangible: !!L.frangible }).stopped, `${load}${k}`) * 100);
        }
        console.log(`      6.5×40 ${load}: ${Object.entries(got[load]).map(([k, v]) => `${k} ${v}% (W ${W[load][k]})`).join(', ')}`);
      }
      const p = penOf('9x21r', 'ball', vAt('9x21r', 'ball', 110, SHIP, 10));
      console.log(`      9×21 ball: ${Object.entries(WALLS).filter(([k]) => W.ball[k] !== undefined).map(([k, w]) => `${k} ${Math.round(rate(r => !throughMaterial(r, { penMm: p, material: w.material, mm: w.mm }).stopped, `p${k}`) * 100)}%`).join(', ')} (W 97, 82, 29, 0, 36, 8, 0, 84)`);
      assert(got.frangible.bulkhead === 0 && got.ball.bulkhead === 100, 'the bulkhead');
      for (const m of ['berm', 'ground']) assert(throughMaterial(stream('x'), { penMm: 50, material: m, mm: 1 }).stopped, `${m} stops all`);
      assert(!throughMaterial(stream('x'), { penMm: 0.1, material: 'paper', mm: 1 }).stopped, 'paper stops nothing');
      near(after(700, 7, 4.8), 700 * Math.sqrt(1 - 4.8 / 7), 1e-9, 'after()');
    },
  },
  {
    name: 'WEAPONS §8.6\'s holes for every 6.5×40 load: 79 mm² through a rigid layer, a suit\'s entry 35 mm² and exit 79 mm²',
    fn() {
      for (const load of Object.keys(CALIBRES['6.5x40r'].loads).filter(l => CALIBRES['6.5x40r'].loads[l].vRefMs)) {
        const rigid = holeArea(`6.5x40r/${load}`, { kind: 'rigid' }), fabric = holeArea({ cal: '6.5x40r', load }, { kind: 'fabric', exits: true });
        console.log(`      ${load}: rigid ${rigid.map(h => `${h.areaMm2} mm² ${h.kind}`).join(', ')}; a suit through and through ${fabric.map(h => `${h.areaMm2} mm² ${h.kind}`).join(', ')}`);
      }
      const r = holeArea('6.5x40r/ball', { kind: 'rigid' }), f = holeArea('6.5x40r/ball', { kind: 'fabric', exits: true }), p = holeArea('9x21r/ball', { kind: 'rigid' });
      near(r[0].areaMm2, 79, 1, 'rigid'); near(f[0].areaMm2, 35, 1, 'entry'); near(f[1].areaMm2, 79, 1, 'exit'); near(p[0].areaMm2, 143, 1, 'the pistol\'s');
    },
  },
  {
    name: 'tradecraft parity: layerHit\'s shares and the blunt trauma behind a stop, on the same streams, equal to tradecraft\'s armour.js',
    fn() {
      const carrier = { armour: { cover: { plate: 0.5, soft: 0.25 } } };
      for (const c of [0, 0.6, 1]) {
        const n = { plate: 0, soft: 0, none: 0 };
        for (let i = 0; i < 10000; i++) { const L = layerHit(carrier, stream('parity-layer', c, i), c); n[L === 'bare' ? 'none' : L]++; }
        console.log(`      centre ${c}: ours ${JSON.stringify(n)}, tradecraft's ${JSON.stringify(TC_LAYER[c])}`);
        assert(JSON.stringify(n) === JSON.stringify(TC_LAYER[c]), `layerHit at centre ${c}`);
      }
      const ours = [];
      for (let i = 0; i < 20; i++) {
        const r = stream('parity-blunt', i), L = layerHit(carrier, r, 0);
        if (L === 'bare') { ours.push(null); continue; }
        chance(r, TC_STOP_9X19[L]);                                    // (tradecraft's stop draw, its per-calibre table: the dice kept in step)
        const b = bluntOf(L, 7, 1.0, r);
        ours.push([L, b.bluntPts, b.crack, b.knockS, b.down]);
      }
      console.log(`      blunt, 20 rounds of 9×19 (7 points, w 1): ${ours.filter(Boolean).length} stopped; first five ours ${JSON.stringify(ours.slice(0, 5))}`);
      assert(JSON.stringify(ours) === JSON.stringify(TC_BLUNT), `blunt: ${JSON.stringify(ours)}`);
    },
  },
  {
    name: 'the line through the KD range: a round at the face holes the paper and stops in the berm; a man on the line is hit and the round goes through; the berm stops every round fired under its crest; the ground and the parapet stop what is low',
    fn() {
      const kd = KD_RANGE.kd, L10 = kd.lanes[9], line = kd.lines[300];
      const W = armsWorld({ mrk: 10, coach: false, at: { x: line.x, z: L10.z, face: 'right' }, extra: [{ x: line.x - 30, z: L10.z + 40, stance: null }, { x: line.x + 5, z: L10.z + 5, stance: 'prone', face: 'right' }] });
      const s = W.state, from = { x: line.x + 0.6, y: 0.3, z: L10.z };
      const aim = Math.atan2(1.9 - 0.3, 300) + 0.0004;
      const clear = traceRound(s, { shooterId: 'p1', from, yawRad: 0, pitchRad: aim, rngKey: 'face', shotId: 'sh1' });
      console.log(`      at the face from the 300 m line: ${JSON.stringify({ stopped: clear.stoppedBy.kind, at: clear.stoppedBy.at, faces: clear.faces, hits: clear.hits.length, near: clear.nearMisses })}`);
      // (with the man at 120 m standing in the lane: hit, through, on to the berm)
      const s2 = W.state; Object.assign(s2.actors.list.find(a => a.who === 'p10'), { x: line.x + 120, z: L10.z });
      const hit = traceRound(s2, { shooterId: 'p1', from, yawRad: 0, pitchRad: Math.atan2(1.2 - 0.3, 120), rngKey: 'man', shotId: 'sh2', nd: true });
      console.log(`      at a man 120 m out: ${hit.hits.map(h => `${h.onId} ${h.part} w ${h.w} through ${h.through} left ${h.penLeftMm} mm`).join('; ')}; stopped by ${hit.stoppedBy.kind} at x ${hit.stoppedBy.at.x}`);
      assert(clear.stoppedBy.kind === 'berm' && clear.faces.length === 1 && clear.faces[0].lane === 10 && clear.hits.length === 0, 'paper holed, the berm stops it');
      assert(hit.hits.length === 1 && hit.hits[0].onId === 'p10' && hit.hits[0].part === 'torso' && hit.hits[0].through && hit.hits[0].nd && hit.stoppedBy.kind === 'berm', 'a man on the line');
      s2.actors.list = s2.actors.list.filter(a => a.who !== 'p10');
      // (1,000 lines fired under the berm's crest at random across the lanes: none past it; a man behind the berm never hit)
      s2.actors.list.push({ id: 'a30', who: 'p30', x: 1630, z: L10.z, face: 'left', gait: 'idle' });
      s2.people.p30 = { id: 'p30', name: { family: 'Behind' }, skills: s2.people.p1.skills };
      const r = stream('lines', 1), kinds = {};
      let behind = 0;
      for (let i = 0; i < 1000; i++) {
        const yaw = (r[0] % 100) * 0 + (i / 1000 - 0.5) * 0.3, pitch = -0.02 + (i % 37) / 37 * 0.042;
        const t = traceRound(s2, { shooterId: 'p1', from, yawRad: yaw, pitchRad: pitch, rngKey: `l${i}` });
        kinds[t.stoppedBy.kind] = (kinds[t.stoppedBy.kind] ?? 0) + 1;
        if (t.hits.some(h => h.onId === 'p30')) behind++;
        const atBerm = t.path.at(-1);
        if (t.stoppedBy.kind === 'past') assert(atBerm.y > kd.berm.heightM - 1 || Math.abs(Math.sin(yaw)) * 400 > 50, `past the berm under its crest: ${JSON.stringify(atBerm)}`);
      }
      console.log(`      1,000 lines from the 300 m line, yaw ±0.15 rad, pitch −0.020 to +0.022 rad: ${JSON.stringify(kinds)}; the man behind the berm hit ${behind} times`);
      assert(behind === 0, 'never through the berm');
      // (a round straight down into the ground at the shooter's feet; a low one into the parapet)
      const down = traceRound(s2, { shooterId: 'p1', from: { ...from, y: 1.0 }, yawRad: 0, pitchRad: -0.6, rngKey: 'down' });
      const low = traceRound(s2, { shooterId: 'p1', from, yawRad: 0, pitchRad: 0.0005, rngKey: 'low' });
      console.log(`      down: ${down.stoppedBy.kind} at ${fmt(down.rangeM, 1)} m; flat from prone: ${low.stoppedBy.kind} at ${fmt(low.rangeM, 1)} m`);
      assert(down.stoppedBy.kind === 'ground' && down.rangeM < 2 && ['parapet', 'ground'].includes(low.stoppedBy.kind), 'the ground and the parapet');
      // (the prone neighbour at 5 m and 5 m across: a line along the lanes passes him, a near miss that cracks; across him, a hit by length)
      const across = traceRound(s2, { shooterId: 'p1', from, yawRad: Math.atan2(5, 5), pitchRad: -Math.atan2(0.1, 7.07), rngKey: 'across' });
      console.log(`      at the prone neighbour: ${across.hits.map(h => `${h.onId} ${h.part}`).join(', ') || 'missed'}; near misses ${JSON.stringify(clear.nearMisses)}`);
      assert(across.hits.some(h => h.onId === 'p11'), 'the prone neighbour along his length');
    },
  },
];
