// The shot at distance (src/sim/arms/shot.js, paper.js, wind.js; WEAPONS §7.3, §7.4, §7.10, §11.1; the build sheet 0.0.7 §2.1, §8 items 2 to 4): hit and score rates on the A face at 200 and 300 m by position and Marksmanship, the wind's cost, the plaque against the truth, and the 25 m card untouched.
// The grid is the shot's own helpers (the DC, the d20 on its own stream, faceHole, the drift, the hold on its 0.25
// mrad steps); the plaque and the record are the game's own calls on a small state at the KD's 300 m line (armsWorld
// moved there: the range role's scene is not needed for them). Every shot aimed and held to +4, the SO-4 at 4×.
import { assert, near, fmt } from './helpers.mjs';
import { stream, d20, range } from '../src/core/rng.js';
import { digest } from '../src/core/hash.js';
import { flight, ENV_CLASSES as E, DOPE_CARD, CLICK_MRAD } from '../src/sim/arms/ballistics.js';
import { faceHole, faceOdds, holeOf, PAPERS } from '../src/sim/arms/paper.js';
import { dcOf, opticMod, POSITION, plaqueOf, poiOf, resolveShot, holdFor, modsOf, biasMod } from '../src/sim/arms/shot.js';
import { windCorrOf, pathWind } from '../src/sim/arms/wind.js';
import { targetsOf, lineOf, farPointOf, stepsOf, chooseStep, stopInput } from '../src/sim/arms/shooting.js';
import { setZero, believeZero, setSight, setOptic } from '../src/sim/arms/firearms.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { oddsOf } from '../src/sim/skills/checks.js';
import { KD_RANGE } from '../src/data/places/range.js';
import { armsWorld } from './arms-world.mjs';

const R7 = ['6.5x40r', 'ball', 460], STANCES = ['prone', 'sit', 'kneel', 'stand'], MRKS = [6, 10, 14, 18], N = 2000;
const drift = (d, w) => flight(...R7, E['mars-valley'], d, { crossMs: w }).driftCm;
// (the dope's own residual: the path at the line after the card's clicks, cm (+ high))
const dopeLeft = (d) => flight(...R7, E['mars-valley'], d).pathCm + DOPE_CARD.r7[d].elev * CLICK_MRAD * d / 10;

/** A cell: N shots on the A face: { five (a 5 or better), score (a scoring hit), pts (mean points), v }. */
export function cell({ mrk, stance, d, wind = 0, hold = 'none', coachMrk = 14, seed = 1 }) {
  const dc = dcOf({ model: 'r7', rangeM: d, paper: 'kdA' }).dc, net = mrk + POSITION[stance] + 4 + opticMod(4, d) - dc;
  const r = stream('shot-distance', mrk, stance, d, wind, hold), corr = windCorrOf(hold === 'coach' ? coachMrk : mrk, { coach: hold === 'coach' });
  let five = 0, score = 0, pts = 0, v = 0;
  for (let i = 0; i < N; i++) {
    const roll = d20(r), nat = roll === 20 ? 20 : roll === 1 ? 1 : 0;
    let windCm = drift(d, wind);
    if (hold !== 'none' && wind) { const est = wind * (1 + range(r, -(1 - corr), 1 - corr)); windCm += holdFor({ windCm: drift(d, est) }, d).xMil * d / 10; }
    const h = faceHole('kdA', { poiCm: { elevCm: dopeLeft(d), windCm }, roll: { margin: roll + net, nat }, shotId: `${mrk}:${stance}:${d}:${wind}:${hold}:${i}`, seed });
    if (h.score >= 5) five++; if (h.score >= 2) score++; pts += h.score; if (h.v) v++;
  }
  return { five: five / N, score: score / N, pts: pts / N, v: v / N, net };
}

// (a state at the 300 m line, lane 10, prone, the R-7 at 4× on the dope, aimed at its face and held: the plaque's)
export function kdWorld({ mrk = 10, seed = 48213, line = 300, lane = 10 } = {}) {
  const L = KD_RANGE.kd.lanes[lane - 1], fp = L.points[line].fp;
  const W = armsWorld({ seed, mrk, coach: false, stance: 'prone', posture: 'aimed', at: { x: fp.x, z: fp.z, face: 'right' } });
  const s = W.state, g = s.items[W.gunId];
  setOptic(g, 4); setSight(g, DOPE_CARD.r7[line]);
  s.stop = { mode: 'stop', who: W.pid, gun: W.gunId, phase: 'choose', pick: `face:${lane}`, aim: { key: `face:${lane}`, settledMs: s.clock.ms - 5000 }, doing: null, queue: [], reflex: null, keep: {} };
  W.actor.headRad = 0;
  return W;
}

export default [
  {
    name: 'the A face at 200 and 300 m by position and Marksmanship (2,000 shots a cell, prone, sitting, kneeling, standing; held, 4×): still air on the dope, a 4 m/s crosswind uncorrected, held for the read, held for the coach\'s call; Marksmanship 10 prone at 300 m in still air ≥ 70% a 5 or better; the wind uncorrected costs it ≥ 1.0 point a shot',
    fn() {
      const out = {};
      for (const d of [200, 300]) {
        console.log(`      ${d} m (DC ${dcOf({ model: 'r7', rangeM: d, paper: 'kdA' }).dc}; the dope leaves ${fmt(dopeLeft(d), 1)} cm; a 4 m/s crosswind drifts ${fmt(drift(d, 4), 1)} cm): a 5 or better / scoring / points`);
        for (const stance of STANCES) {
          const cells = [];
          for (const mrk of MRKS) {
            const c = ['none0', 'none', 'read', 'coach'].map(h => cell({ mrk, stance, d, wind: h === 'none0' ? 0 : 4, hold: h === 'none0' ? 'none' : h }));
            out[`${d}:${stance}:${mrk}`] = c;
            cells.push(`MRK ${mrk}: ${c.map(x => `${fmt(x.five * 100, 0)}/${fmt(x.score * 100, 0)}/${fmt(x.pts, 2)}`).join(' · ')}`);
          }
          console.log(`        ${stance} (still · 4 m/s · read · coach): ${cells.join(' | ')}`);
        }
      }
      const base = out['300:prone:10'];
      console.log(`      MRK 10 prone at 300 m: still air ${fmt(base[0].five * 100, 1)}% a 5 or better, ${fmt(base[0].pts, 2)} points; 4 m/s uncorrected ${fmt(base[1].pts, 2)} (−${fmt(base[0].pts - base[1].pts, 2)}); held for the read ${fmt(base[2].pts, 2)}; for the coach ${fmt(base[3].pts, 2)}`);
      assert(base[0].five >= 0.7, `${base[0].five}`);
      assert(base[0].pts - base[1].pts >= 1.0, `the wind's cost ${base[0].pts - base[1].pts}`);
      assert(base[3].pts > base[1].pts && base[2].pts > base[1].pts, 'a hold helps');
      for (const d of [200, 300]) for (const stance of STANCES) assert(out[`${d}:${stance}:18`][0].pts >= out[`${d}:${stance}:6`][0].pts, 'skill pays');
      const str = (mrk) => 5 * out[`300:prone:${mrk}`][0].pts + 10 * out[`200:sit:${mrk}`][0].pts;
      console.log(`      a course of 5 at 300 m prone and 10 at 200 m sitting, still air: MRK 6 ${fmt(str(6), 1)}, 10 ${fmt(str(10), 1)}, 14 ${fmt(str(14), 1)}, 18 ${fmt(str(18), 1)} of 75`);
    },
  },
  {
    name: 'the plaque on a face at the 300 m line equals faceOdds\' chance of a five or a V on the believed strike (±1 point); with the read equal to the truth and the zero known it equals the true rate of fives (±3 points over 2,000); the terms and kd on it',
    fn() {
      const W = kdWorld({ mrk: 10 }), s = W.state, pid = W.pid, g = s.items[W.gunId];
      setZero(g, { elev: 6, wind: -3 }); setSight(g, { elev: 6 + DOPE_CARD.r7[300].elev, wind: -3 });
      const T = targetsOf(s, pid).find(t => t.key === 'face:10');
      assert(lineOf(s, pid) === 300 && T && T.far && T.paper === 'kdA', `the line and the face: ${lineOf(s, pid)} ${JSON.stringify(T)}`);
      const truthCross = pathWind(s.meta.seed, s.clock.ms, W.actor, T).crossMs;
      // (believing the card's zero (0, 0) and no read: the plaque on that belief)
      let pl = plaqueOf(s, pid, { target: T });
      const b = poiOf(s, pid, W.gunId, T, { belief: true }), fo = faceOdds('kdA', { value: rollerOf(s, pid).value('marksmanship'), dc: pl.dc, mods: pl.mods, poiCm: b });
      console.log(`      believing the card's zero, no read: ${pl.oddsText} (faceOdds: a five or a V ${fmt(fo.five * 100, 1)}%, on the paper ${fmt(fo.score * 100, 1)}%), the believed strike ${JSON.stringify(pl.kd.poiCm)}; terms ${pl.terms.map(t => t.words).join('; ')}`);
      // (the headline a five or a V (the design review's of v0.0.7: the chance on the paper sat at 94 to 96% whatever you did); on the paper in kd)
      near(pl.odds, fo.five, 0.01, 'the plaque is faceOdds on the belief');
      near(pl.kd.scoreOdds, fo.score, 0.01, 'the paper\'s chance in kd');
      assert(pl.part === 'FIVE', pl.part);
      // (the zero believed exactly, the read the truth: the plaque against 2,000 shots at the true strike)
      believeZero(g, { elev: 6, wind: -3 });
      s.stop.read = { crossMs: truthCross, band: null, atMs: s.clock.ms };
      s.stop.hold = holdFor({ windCm: drift(300, truthCross) }, 300);
      pl = plaqueOf(s, pid, { target: T });
      const truth = poiOf(s, pid, W.gunId, T), net = rollerOf(s, pid).value('marksmanship') + pl.mods.reduce((t, m) => t + m.v, 0) - pl.dc;
      const r = stream('plaque-truth', 1);
      let hits = 0;
      for (let i = 0; i < N; i++) { const d = d20(r); if (faceHole('kdA', { poiCm: truth, roll: { margin: d + net, nat: d === 20 ? 20 : d === 1 ? 1 : 0 }, shotId: `pt${i}`, seed: s.meta.seed }).score >= 5) hits++; }
      console.log(`      the read the truth (${fmt(truthCross, 2)} m/s across), the zero known, held ${JSON.stringify(s.stop.hold)}: the plaque ${pl.oddsText}, the true rate ${fmt(hits / N * 100, 1)}% (the true strike ${fmt(truth.windCm, 1)}, ${fmt(truth.elevCm, 1)} cm); terms: ${pl.terms.map(t => t.words).join('; ')}`);
      console.log(`      the plaque's rings: ${JSON.stringify(Object.fromEntries(Object.entries(pl.kd.ringOdds).map(([k, v]) => [k, Math.round(v * 1000) / 10])))}; DC ${pl.dc} (${pl.dcParts.map(p => `${p.why} ${p.v}`).join(', ')}); mods ${pl.mods.map(m => `${m.v > 0 ? '+' : ''}${m.v} ${m.why}`).join(', ')}`);
      near(pl.odds * 100, hits / N * 100, 3, 'the plaque against the truth');
      assert(pl.terms.map(t => t.key).join() === 'range,wind,hold,zero' && pl.kd && Array.isArray(pl.kd.holdMil), 'the terms');
      // (a read's band: a percentage while its two ends move the chance of a scoring hit under 10 points (the A face's
      // scoring rings are 60 cm across: a Marksmanship 10 read of 4 m/s, 0.7 to 7.3, moves it less), words past that)
      s.stop.read = { crossMs: 4, band: [0.7, 7.3], atMs: s.clock.ms };
      const mid = plaqueOf(s, pid, { target: T });
      s.stop.read = { crossMs: 9, band: [0, 18], atMs: s.clock.ms };
      const wide = plaqueOf(s, pid, { target: T });
      console.log(`      a read of 4 m/s, its band 0.7 to 7.3: "${mid.oddsText}"; a recruit's 9 m/s, 0 to 18: "${wide.oddsText}"`);
      assert(mid.words === null && wide.words !== null, 'a percentage on a tight band, words on a wide one');
      const fp = farPointOf(s, pid);
      console.log(`      the far point: ${JSON.stringify(fp)}`);
      assert(fp && fp.key === 'face:10' && fp.label === 'TARGET 10 · 300 M' && fp.why === 'aim', 'the far point');
    },
  },
  {
    name: 'five pulls at the face resolved: each shot\'s record carries the face, the true strike and its terms, the hole in real units, the flight and the true wind; the log line gives the roll and the shooter\'s own terms (the wind as read, the hold), never the ring nor the true wind (the reviews of v0.0.7: it spoiled the pits\' mark)',
    fn() {
      const W = kdWorld({ mrk: 10 }), s = W.state, pid = W.pid, g = s.items[W.gunId], mag = s.items[g.mag ?? W.magIds[0]];
      if (!g.mag) { g.mag = W.magIds[0]; }
      Object.assign(g, { chamber: 'live', mode: 'semi' });
      s.items[g.mag].n = 20;
      s.stop.read = { crossMs: 3, band: [2.5, 3.5], atMs: s.clock.ms };
      const T = targetsOf(s, pid).find(t => t.key === 'face:10'), lines = [];
      for (let i = 0; i < 5; i++) {
        const { shot } = resolveShot(s, W.bus, { pid, gunId: W.gunId, target: T });
        lines.push(`${shot.hole.score}${shot.hole.v ? 'V' : ''} at ${JSON.stringify(shot.hole.at)} (strike ${shot.poiCm.windCm}, ${shot.poiCm.elevCm} cm; wind ${shot.crossMs} m/s; ${shot.flight.tofS} s, ${shot.flight.vMs} m/s)`);
        assert(shot.face?.paper === 'kdA' && shot.face.lane === 10 && shot.flight && typeof shot.crossMs === 'number' && shot.poiCm.terms.length === 4 && 'onPaper' in shot.hole, JSON.stringify(shot));
        s.clock.ms += 3000;
      }
      for (const l of lines) console.log(`      ${l}`);
      const logs = (s.log ?? []).filter(e => e.kind === 'roll').map(e => e.text);
      console.log(`      the log: "${logs.at(-1)}"`);
      // (the shooter's own terms only, never the ring nor the true wind: the pits mark it (the reviews of v0.0.7))
      assert(logs.length && /the wind as read, 3 m\/s from the left/.test(logs.at(-1)) && /held/.test(logs.at(-1)) && !/\d\.\d m\/s|\ba [0-5V]\b|centre:|dead centre/.test(logs.at(-1)), `the log line: ${logs.at(-1)}`);
    },
  },
  {
    name: 'test-handling\'s 25 m card unchanged: 1,000 holes by v0.0.6\'s holeOf, the same digest; a card25 shot\'s hole is the margin\'s by hash (no strike), its record gains only flight',
    fn() {
      const out = [];
      for (let i = 0; i < 1000; i++) { const d = 1 + (i * 7) % 20; out.push(holeOf('card25', { margin: d - 8 + (i % 5), nat: d === 20 ? 20 : d === 1 ? 1 : 0 }, `sh${i}`, 48213)); }
      const dg = digest(JSON.stringify(out));
      console.log(`      1,000 holes: digest ${dg} (v0.0.6's, from git HEAD's paper.js in a scratch: 1bc2ee681e9899)`);
      assert(dg === '1bc2ee681e9899', dg);
      const W = armsWorld({ mrk: 10, stance: 'prone', posture: 'aimed' }), s = W.state, g = s.items[W.gunId];
      if (!g.mag) g.mag = W.magIds[0];
      Object.assign(g, { chamber: 'live', mode: 'semi' });
      W.actor.headRad = 0;
      s.stop = { mode: 'stop', who: W.pid, gun: W.gunId, phase: 'choose', pick: 'paper:4', aim: { key: 'paper:4', settledMs: s.clock.ms - 5000 }, doing: null, queue: [], reflex: null, keep: {} };
      const T = targetsOf(s, W.pid).find(t => t.key === 'paper:4');
      const { shot } = resolveShot(s, W.bus, { pid: W.pid, gunId: W.gunId, target: T });
      const again = holeOf('card25', shot.roll, shot.id, s.meta.seed);
      console.log(`      a card25 shot: hole ${JSON.stringify(shot.hole)}, flight ${JSON.stringify(shot.flight)}; face ${shot.face ?? 'none'}`);
      assert(T.paper === 'card25' && JSON.stringify(shot.hole) === JSON.stringify({ at: again.at, score: again.score, v: again.v }) && !shot.face && shot.flight, 'the card as v0.0.6');
      assert(lineOf(s, W.pid) === null, 'test-handling\'s bay is no KD line: its panel unchanged');
    },
  },
  {
    name: 'the line\'s rows at 300 m: the dope, the read, the hold for it, four power and sitting in the panel; dialled, the turrets move and the believed zero does not; a read kept; a hold set without the held aim lost',
    fn() {
      const W = kdWorld({ mrk: 10 }), s = W.state, pid = W.pid, g = s.items[W.gunId];
      setSight(g, { elev: 0, wind: 0 }); setOptic(g, 1);
      const ids = stepsOf(s).map(r => r.id);
      const rows = stepsOf(s).filter(r => /^(sight|hold|read|optic|stance:sit)/.test(r.id)).map(r => `${r.label} · ${fmt(r.ms / 1000, 1)} s`);
      console.log(`      the line's rows: ${rows.join(' | ')}`);
      assert(ids.includes('sight:dope:300') && ids.includes('read') && ids.includes('optic:4') && ids.includes('stance:sit'), ids.join());
      // (one step at a time through the layer the game runs: stopInput, the clock moved a tick at a time)
      {
        const go = (id) => { const r = chooseStep(s, W.bus, { step: id }); let n = 0; while (s.stop?.doing && n++ < 2000) { s.clock.ms += 50; stopInput(s, {}, W.bus, null); } return r; };
        const settled = s.stop.aim.settledMs;
        let r = go('sight:dope:300');
        console.log(`      dope dialled: ${JSON.stringify(r)}, turrets ${JSON.stringify(g.sight)}, the believed zero ${JSON.stringify(g.belief?.zero ?? null)}`);
        assert(g.sight?.elev === -3 && !g.belief?.zero, 'the dope dialled, the zero belief untouched');
        r = go('read');
        const rd = s.stop.read;
        console.log(`      read: ${JSON.stringify(rd)}`);
        assert(rd && typeof rd.crossMs === 'number', 'a read kept');
        const before = s.stop.aim?.settledMs;
        r = go('hold:read');
        console.log(`      hold for the read: ${JSON.stringify(s.stop.hold ?? 'centre')}; the held aim's settle ${before} → ${s.stop.aim?.settledMs}`);
        assert(s.stop.aim?.settledMs === before, 'the hold keeps the held aim');
        go('optic:4');
        assert(g.optic === 4, 'four power');
        const mods = modsOf(s, pid, { gunId: W.gunId, target: targetsOf(s, pid).find(t => t.key === 'face:10') });
        console.log(`      at 4×: ${mods.map(m => `${m.v > 0 ? '+' : ''}${m.v} ${m.why}`).join(', ')}; biasMod on a torso 5 to 100 cm: ${[5, 10, 15, 25, 40, 60, 100].map(b => biasMod(b, 25)).join(', ')}`);
        assert(mods.some(m => m.why === 'the SO-4 at 4×' && m.v === 5), 'the optic at 4×');
        go('stance:sit');
        assert(W.actor.stance === 'sit' && modsOf(s, pid, { gunId: W.gunId, target: null }).some(m => m.why === 'sitting' && m.v === 3), 'sitting +3');
        assert(settled > 0, 'aimed');
      }
    },
  },
];
