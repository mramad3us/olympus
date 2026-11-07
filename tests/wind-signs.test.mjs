// OLYMPUS tests: the wind's sign end to end on the KD (WEAPONS §7.4, PLACES §4.12; the user's report of v0.0.7, 2026-11-07: "the wind hose doesn't match the wind instructions ? Visually it looks like this as we read and coach tells us 3m/s right").
//
// For a wind from each quarter of a shooter facing downrange (east, +x; the area's z runs south, so their right is the
// south), on worlds whose day blows that way at test-range's 10:00: the truth (wind.js windAt: towardRad the way it
// blows to), its crossing component (crossOf, + from the left), the player's own read (readWind) and the coach's call
// (the scene's, at the 200 m line's dope: his words and his crossMs), the plate's arrow (ui/plaque.js termText: the way
// it blows), the hold he gives (into the wind), the drift of the round on the face (shot.js poiOf against the truth, and
// where kdHolePixel draws that hole: right of the face's centre is the shooter's right), and the flags (look.js's
// rangeLook.kd.flags through render/range-items.js sleevePixels): the sleeve's body and its shadow downwind of the pole
// on the ground, and on the picture the sleeve standing up over its hoop for a wind from the right (blowing north,
// away from the camera), hanging below it for one from the left, lying left or right for one along the line.
// Then what the verifier of the sleeve's fix found: a sleeve blowing toward the camera (south) drew the same limp or
// straight out, so its speed shows in its body (full bands wide and smooth, slack ones narrow and creased, the tail's
// open end once straight out); and the words: with nothing across but the flags standing out along the range, the
// coach and your read say so ("Flags are limp" was said under a 3.6 m/s tailwind), and "1 metre a second".
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { windAt, crossOf, readWind, flagOf, steadyPath, windWords, FLAG_BANDS, FLAG_BAND_MS, FLAG_FULL_MS, FLAG_LIMP_MS } from '../src/sim/arms/wind.js';
import { poiOf } from '../src/sim/arms/shot.js';
import { gunOn } from '../src/sim/arms/shooting.js';
import { rangeLook } from '../src/sim/arms/look.js';
import { kdPoint } from '../src/sim/scenarios/range.js';
import { termText } from '../src/ui/plaque.js';
import { sleevePixels, kdFaceAt, kdHolePixel, SLEEVE_BANDS, SLEEVE_M } from '../src/render/range-items.js';
import { playerActor, playerId } from '../src/core/ids.js';
import { SOL_MS } from '../src/core/clock.js';

// (worlds whose wind at 10:00 blows from each quarter at about 6 m/s, found by a scan of windAt; the shooter's words)
const CASES = [
  { from: 'the right', seed: 35629, towardDeg: -90 },
  { from: 'the left', seed: 2682, towardDeg: 90 },
  { from: 'the front', seed: 17240, towardDeg: 180 },
  { from: 'behind', seed: 7168, towardDeg: 0 },
];
const angleDeg = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180);

function caseOf(C) {
  const g = createGame({ scenario: 'test-range', seed: C.seed, setup: 's200' }), s = g.state;
  g.step(1, () => null);                                             // (the dope: the coach's call)
  const ev = g.bus.events, call = ev.find(([t, d]) => t === 'range' && d.phase === 'call')?.[1].call;
  const said = ev.filter(([t, d]) => t === 'say' && /a second|wind|limp|across/i.test(d.text ?? '')).map(([, d]) => d.text).join(' ');
  const pid = playerId(s), me = playerActor(s), ms = s.clock.ms, P = kdPoint(s), dM = P.face.x - me.x;
  const steady = windAt(s.meta.seed, ms, me.x, me.z, { gust: false }), cross = crossOf(steady, 0);
  const read = readWind(s, pid, { atMs: ms, bearingRad: 0, rangeM: dM, from: { x: me.x, z: me.z } });
  const target = { key: `face:${P.lane}`, kind: 'paper', paper: 'kdA', x: P.face.x, z: P.face.z, dM, lane: P.lane, line: P.line };
  const gunId = gunOn(s, pid);
  const drift = poiOf(s, pid, gunId, target, { belief: false, hold: null }), held = poiOf(s, pid, gunId, target, { belief: false, hold: { xMil: call.holdMil[0], yMil: 0 } });
  const fa = kdFaceAt({ ...P.face, up: 1 }, 16), hole = kdHolePixel(fa, { xCm: Math.max(-40, Math.min(40, drift.windCm)), yCm: 0 }, 16), faceMidX = fa.x0 + fa.n / 16 / 2;
  // (the flag nearest the shooter's path: the look's, as the stage draws it)
  const flags = rangeLook(s, ms).kd.flags, flag = flags.reduce((a, f) => (Math.abs(f.z - me.z) + Math.abs(f.x - me.x - 50) / 10 < Math.abs(a.z - me.z) + Math.abs(a.x - me.x - 50) / 10 ? f : a));
  const px = sleevePixels(flag, ms, 16), body = px.filter(p => !p.shadow), shade = px.filter(p => p.shadow);
  const mean = (a, k) => a.reduce((t, p) => t + k(p), 0) / a.length;
  const down = [Math.cos(flag.towardRad), Math.sin(flag.towardRad)];
  // (a body pixel stands at its own height, its z its row on the picture plus that height: its place over the ground)
  const bodyAlong = mean(body, p => (p.x - flag.x) * down[0] + (p.z - flag.z) * down[1]);
  const shadeAlong = mean(shade, p => (p.x - flag.x) * down[0] + (p.z - flag.z) * down[1]);
  const topRow = flag.z - SLEEVE_M.poleTop, picX = mean(body, p => p.x - flag.x), picUp = mean(body, p => topRow - (p.z - p.y));
  return { C, g, s, call, said, steady, cross, read, drift, held, hole, faceMidX, flag, bodyAlong, shadeAlong, picX, picUp, plate: termText({ key: 'wind', v: call.crossMs, by: 'coach' }), readPlate: termText({ key: 'wind', v: read.crossMs }) };
}

export default [
  {
    name: 'a wind from each quarter reads the same way everywhere: the truth, the coach\'s words and call, your read, the plate\'s arrow, the hold into the wind, the drift on the face and the sleeve and its shadow streaming downwind (the user\'s report of v0.0.7, 2026-11-07: "the wind hose doesn\'t match the wind instructions")',
    fn() {
      for (const C of CASES) {
        const r = caseOf(C), sp = r.steady.speedMs, deg = r.steady.towardRad * 180 / Math.PI;
        console.log(`      from ${C.from} (seed ${C.seed}): blowing toward ${fmt(deg, 0)}° at ${fmt(sp, 2)} m/s steady, across ${fmt(r.cross, 2)} m/s (+ from the left); your read ${r.read.crossMs} "${r.read.speedWord} ${r.read.fromWord}" ${r.readPlate}; the coach ${r.call.crossMs} "${r.said}" plate "${r.plate}", hold ${r.call.holdMil[0]} mil`);
        console.log(`        the drift ${fmt(r.drift.windCm, 1)} cm (held: ${fmt(r.held.windCm, 1)} cm), its hole drawn ${fmt((r.hole?.x ?? NaN) - r.faceMidX, 3)} m right of the face's middle; the flag at (${r.flag.x}, ${r.flag.z}) toward ${fmt(r.flag.towardRad * 180 / Math.PI, 0)}° lift ${fmt(r.flag.liftK, 2)}: its body ${fmt(r.bodyAlong, 2)} m and its shadow ${fmt(r.shadeAlong, 2)} m downwind of the pole; on the picture ${fmt(r.picX * 16, 1)} px right and ${fmt(r.picUp * 16, 1)} px over the pole's top`);
        assert(angleDeg(deg, C.towardDeg) < 30, `the world blows toward ${deg}°, not ${C.towardDeg}°`);
        assert(r.bodyAlong > 0.3 && r.shadeAlong > 0.3, `${C.from}: the sleeve streams downwind ${JSON.stringify({ body: r.bodyAlong, shadow: r.shadeAlong })}`);
        if (C.from === 'the right' || C.from === 'the left') {
          const sign = C.from === 'the right' ? -1 : 1, side = C.from === 'the right' ? 'right' : 'left';
          assert(Math.sign(r.cross) === sign && Math.sign(r.read.crossMs) === sign && Math.sign(r.call.crossMs) === sign, `${C.from}: the cross, the read and the call ${JSON.stringify([r.cross, r.read.crossMs, r.call.crossMs])}`);
          assert(r.read.fromWord === `from the ${side}` && r.said.includes(`from the ${side}`), `${C.from}: the words "${r.read.fromWord}", "${r.said}"`);
          assert(r.plate.endsWith(sign > 0 ? '>' : '<') && r.readPlate.endsWith(sign > 0 ? '>' : '<'), `${C.from}: the plate's arrow "${r.plate}" "${r.readPlate}" (the way it blows)`);
          assert(Math.sign(r.call.holdMil[0]) === -sign, `${C.from}: the hold into the wind ${r.call.holdMil[0]}`);
          assert(Math.sign(r.drift.windCm) === sign && Math.sign(r.hole.x - r.faceMidX) === sign, `${C.from}: the round drifts with the wind ${r.drift.windCm} cm, drawn ${r.hole.x - r.faceMidX}`);
          assert(Math.abs(r.held.windCm) < Math.abs(r.drift.windCm), `${C.from}: the hold takes the drift back ${r.held.windCm} of ${r.drift.windCm}`);
          // (the picture: blowing north, away from the camera, the sleeve stands over its hoop; blowing south it hangs below)
          assert(sign < 0 ? r.picUp > 0.2 : r.picUp < -0.5, `${C.from}: on the picture ${fmt(r.picUp, 2)} m over the pole's top`);
        } else {
          // (along the line: the crossing part is small, the sleeve lies across the picture the way it blows)
          assert(Math.abs(r.cross) < 0.45 * sp && Math.abs(r.call.crossMs) < 0.6 * sp, `${C.from}: a small cross ${r.cross}, called ${r.call.crossMs}`);
          // (the flags stand out along the range: never "limp" nor "no wind to speak of" from the coach while they do)
          assert(!/limp|no wind to speak of/i.test(r.said) && (Math.abs(r.call.crossMs) >= 0.5 || /standing out|straight (up|down) the range/.test(r.said)), `${C.from}: the coach "${r.said}" under flags standing out at ${fmt(sp, 2)} m/s`);
          assert(C.from === 'the front' ? r.picX < -0.4 : r.picX > 0.4, `${C.from}: on the picture ${fmt(r.picX, 2)} m right of the pole`);
        }
        r.g.clearFacts?.();
      }
    },
  },
  {
    name: 'a sleeve\'s bands fill one a FLAG_BAND_MS 1.5 m/s, a real sleeve\'s 3 knots: limp under 1.5 m/s, two out at 3, straight out from 7.5; the look\'s flags carry the gusting wind',
    fn() {
      assert(FLAG_BANDS === SLEEVE_BANDS && FLAG_FULL_MS === FLAG_BANDS * FLAG_BAND_MS, 'the stage\'s bands are the sim\'s');
      const rows = [1, 1.5, 3, 4.5, 6, 7.5, 9].map(v => ({ v, bands: Math.min(1, v / FLAG_FULL_MS) * FLAG_BANDS }));
      console.log(`      bands out: ${rows.map(r => `${r.v} m/s ${fmt(r.bands, 2)}`).join(', ')}`);
      assert(rows[0].bands < 1 && Math.abs(rows[2].bands - 2) < 1e-9 && rows[5].bands === 5 && rows[6].bands === 5, JSON.stringify(rows));
      const at = 3 * SOL_MS + 10 * 3_600_000, f = flagOf(48213, at, 1310, 345), w = windAt(48213, at, 1310, 345);
      assert(f.speedMs === w.speedMs && f.towardRad === w.towardRad && Math.abs(f.liftK - Math.min(1, w.speedMs / FLAG_FULL_MS)) < 1e-12, JSON.stringify({ f, w }));
    },
  },
  {
    name: 'a sleeve blowing toward the camera shows its speed in its body: limp narrow and creased, full bands wide and smooth, straight out its tail\'s open end (the verifier\'s of the sleeve fix: limp and 7.5 m/s drew alike, 45 to 50 px down the pole)',
    fn() {
      // (blowing south, a wind from the left: a band out level and a band hanging both run down the picture, a point at
      // height y showing where the ground at z − y does; the first cut drew limp and straight out 4 to 6 px against 8 px wide)
      const pole = { x: 1300, z: 299 }, topRow = Math.floor((pole.z - SLEEVE_M.poleTop) * 16);
      const south = [1, 3, 6, 7.5].map(v => {
        const body = sleevePixels({ ...pole, towardRad: Math.PI / 2, liftK: Math.min(1, v / FLAG_FULL_MS) }, 0, 16).filter(p => !p.shadow), byRow = new Map();
        for (const p of body) { const r = Math.floor((p.z - p.y) * 16) - topRow; byRow.set(r, (byRow.get(r) ?? 0) + 1); }
        const below = [...byRow].filter(([r]) => r > 4);
        return { v, rows: below.length, wide: below.filter(([, n]) => n >= 5).length, narrow: below.filter(([, n]) => n <= 3).length, tail: body.filter(p => p.c === 0x241010).length };
      });
      console.log(`      blowing south: ${south.map(s => `${s.v} m/s ${s.wide} rows 5 px wide or more and ${s.narrow} rows 3 px or less of ${s.rows} under the hoop, the tail's open end ${s.tail} px`).join('; ')}`);
      assert(south[0].narrow >= 30 && south[0].narrow > south[1].narrow + 5 && south[1].narrow > south[2].narrow + 5 && south[3].narrow <= 2 && south[0].wide < south[1].wide && south[1].wide < south[2].wide && south[3].wide >= 30, `wide and narrow by speed: ${JSON.stringify(south)}`);
      assert(south[3].tail > 0 && south.slice(0, 3).every(s => s.tail === 0), `the tail's open end only straight out: ${JSON.stringify(south)}`);
    },
  },
  {
    name: 'with nothing across but the flags standing out along the range, the coach and your read say which way they stand, never that they are limp; the coach says "1 metre a second" (the verifier\'s of the sleeve fix: "Flags are limp" under a 3.6 m/s tailwind, "1 metres a second")',
    fn() {
      const rows = [];
      for (let k = 0; k < 60; k++) {
        const seed = 1000 + 97 * k, g = createGame({ scenario: 'test-range', seed, setup: 's200' }), s = g.state;
        g.step(1, () => null);
        const said = g.bus.events.filter(([t, d]) => t === 'say' && /a second|wind|limp|across/i.test(d.text ?? '')).map(([, d]) => d.text).join(' ');
        const me = playerActor(s), ms = s.clock.ms, P = kdPoint(s), to = { x: P.face.x, z: me.z }, p = steadyPath(seed, ms, me, to), speed = Math.hypot(p.crossMs, p.headMs);
        const read = readWind(s, playerId(s), { atMs: ms, bearingRad: 0, rangeM: P.face.x - me.x, from: { x: me.x, z: me.z } });
        rows.push({ seed, speed, cross: p.crossMs, head: p.headMs, said, read });
      }
      const limp = rows.filter(r => /limp|no wind to speak of/i.test(r.said)), along = rows.filter(r => /standing out|straight (up|down) the range/.test(r.said)), one = rows.filter(r => /\b1 metres?\b/.test(r.said));
      console.log(`      60 worlds at the 200 m dope: ${limp.length} calls "limp" or "no wind" (steady wind ${limp.map(r => fmt(r.speed, 2)).join(', ') || 'none'} m/s), ${along.length} "standing out" along the range (${along.map(r => `${fmt(r.head, 1)} m/s ${r.head > 0 ? 'head' : 'tail'}`).join(', ')}), ${one.length} at 1 m/s ("${one[0]?.said ?? ''}")`);
      for (const r of limp) assert(r.speed < FLAG_LIMP_MS + 0.1, `"${r.said}" under ${r.speed} m/s (${r.seed})`);
      // (your read with nothing across: the flags limp only under FLAG_LIMP_MS, standing out the way the wind along blows them)
      const still = rows.filter(r => Math.abs(r.read.crossMs) < 0.5);
      for (const r of still) {
        const want = r.speed < FLAG_LIMP_MS ? 'limp' : Math.abs(r.head) >= FLAG_LIMP_MS ? (r.head > 0 ? 'front' : 'behind') : 'light';
        assert(r.read.flags === want && (want === 'limp') === (r.read.fromWord === 'no wind to speak of'), `your read under ${fmt(r.speed, 2)} m/s, ${fmt(r.head, 2)} along: ${JSON.stringify(r.read)} (${r.seed})`);
      }
      console.log(`      your read with nothing across: ${still.map(r => `${r.read.flags} at ${fmt(r.speed, 1)} m/s`).join(', ')}`);
      assert(along.length >= 2 && one.length >= 3 && one.every(r => /\b1 metre a second/.test(r.said)), `the lines: ${JSON.stringify(one.map(r => r.said))}`);
      for (const r of along) assert((r.head > 0) === /faces|toward us/.test(r.said), `which way they stand: "${r.said}" with ${r.head} m/s (+ a headwind)`);
      // (windWords itself, the limp case included, which no world's 10:00 blows: the day's mean is 2 m/s at least)
      const ww = [[0.2, 0.3], [0.2, -3], [0.2, 3], [0.4, 1, 2.2], [-2, 0.5]].map(([c, h, sp]) => windWords(c, h, sp));
      console.log(`      windWords: ${ww.map(w => `${w.flags} "${w.speedWord} ${w.fromWord}"`).join(', ')}`);
      assert(ww.map(w => w.flags).join() === 'limp,behind,front,light,' && ww[0].fromWord === 'no wind to speak of' && ww[1].fromWord === 'nothing across' && ww[4].fromWord === 'from the right', JSON.stringify(ww));
    },
  },
];
