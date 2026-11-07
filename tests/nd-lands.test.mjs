// nd-lands: where a negligent discharge lands on the KD's 300 m line, and what it does when it finds a person
// (WEAPONS §6.5, §6.6, ND-1 to ND-5; BODY §17 through applyHit; the build sheet 0.0.7 §2.3, §5.2, §8 items 15 to 17).
// You on lane 10 of the 300 m line, the relay prone on lanes 9 and 11 (5 m each side), the coach at your left
// shoulder (the lane point's coach mark). 10,000 NDs per posture (slung front, low ready, aimed), shared over the
// stances (standing, kneeling, prone) and what the hands were doing (bringing the rifle up, seating the
// magazine, charging it, the function check), each on its own stream: into the berm, the ground, past, your own
// foot, a neighbour, the coach; graded ND-1 (into the berm or the ground ahead), ND-2 (elsewhere), ND-3 (by a
// person, within 1.5 m), ND-4 (a person hit), ND-5 (a death). Then the same with the muzzle swung onto the
// right-hand neighbour and onto the coach, the turned-round faults that put a person on the line.
// Fixtures, said: the ND's line is the sheet's contract for range's ndOf (§2.3: "an ND's ndOf traces the line
// through traceRound"), built here from carry.js's POSTURES and STANCE_H until ndOf does it: the posture's line
// within its cone (DISCHARGE_SPREAD × (1 − muzzleSafe(Weapon handling)), at most the posture's half-angle once in
// the hands), swept between the posture and the aim when brought up or down, where SELF_SHOT_LONG 0.1 of them go
// into the holder's foot (WEAPONS §6.5, §8 item 17); the function check is pulled shouldered and level, steady.
// The trace is ballistics' traceRound when it loads (src/sim/arms/penetrate.js), else a local stub of its
// contract (a straight line with the drop, the ground, the berm, bodies within 0.25 m, 0.35 m at a quarter);
// the test prints which. Asserts: an aimed prone ND goes into the berm every time (ND-1); SELF_SHOT_LONG 10%
// (±1.5) on a long gun brought up or down; never a hit beyond where the round stopped (through the berm or the
// ground); ND-4 only with a body on the line.
import { assert, fmt } from './helpers.mjs';
import { stream, range, chance } from '../src/core/rng.js';
import { POSTURES, STANCE_H, SPAN_M, DISCHARGE_SPREAD, muzzleSafe } from '../src/sim/arms/carry.js';
import { applyHit, SELF_SHOT_LONG, gradeOfHits } from '../src/sim/body/wounds.js';

const RAD = Math.PI / 180, WH = 10, PER_POSTURE = 10_000;
const LINE_X = 1300, LANE1_Z = 302.5, GAP = 5, LANE = 10, FP = { x: LINE_X, z: LANE1_Z + GAP * (LANE - 1) }, COACH = { x: LINE_X - 0.9, z: FP.z - 1.4 };
const FACE_Y = 1.9, FACE_X = 1600, BERM = { rect: [1612, 300, 1640, 400], h: 8 }, W_MUZZLE = 1.61;
const STANCES = ['stand', 'kneel', 'prone'], DURING = ['up', 'magIn', 'charge', 'functionCheck'], POSTURE_KEYS = ['slungFront', 'lowReady', 'aimed'];

// (the trace: ballistics' traceRound if it is there, else the stub of its contract)
let traceRound = null, traceSrc = 'the local stub of traceRound';
try { ({ traceRound } = await import('../src/sim/arms/penetrate.js')); traceSrc = 'ballistics\' traceRound (src/sim/arms/penetrate.js)'; } catch { traceRound = null; }
function stubTrace(state, { shooterId, from, yawRad, pitchRad, rngKey, nd, shotId }) {
  const r = stream('pen', state.meta.seed, rngKey), cx = Math.cos(yawRad), cz = Math.sin(yawRad), tp = Math.tan(pitchRad), v = 700, g = 3.727;
  const yAt = (s) => from.y + s * tp - 0.5 * g * (s / v) ** 2;
  let end = 2000, kind = 'past';
  for (let s = 0.5; s < 2000; s += 0.5) { const x = from.x + cx * s, z = from.z + cz * s; if (yAt(s) <= 0) { end = s; kind = 'ground'; break; } if (x >= BERM.rect[0] && x <= BERM.rect[2] && z >= BERM.rect[1] && z <= BERM.rect[3] && yAt(s) < BERM.h) { end = s; kind = 'berm'; break; } }
  const hits = [], near = [];
  for (const a of state.actors.list) {
    if (a.who === shooterId) continue;
    const st = a.stance ?? 'stand';
    if (st === 'prone') { const ux = Math.cos(0), along = [a.x + 0.35, a.x - 1.45]; let best = null; for (let u = 0; u <= 1; u += 0.02) { const px = along[0] + (along[1] - along[0]) * u, pz = a.z, s = (px - from.x) * cx + (pz - from.z) * cz, d = Math.abs((px - from.x) * cz - (pz - from.z) * cx); if (s > 0 && s < end && (!best || d < best.d)) best = { s, d, u }; } if (best && yAt(best.s) <= SPAN_M.prone[1] && (best.d <= 0.25 || (best.d <= 0.35 && chance(r, 0.25)))) hits.push({ onId: a.who, part: best.u < 0.15 ? 'head' : best.u < 0.6 ? 'torso' : 'legs', rangeM: best.s, w: W_MUZZLE, through: true, shotId, nd, fromId: shooterId }); else if (best && best.d <= 3) near.push({ who: a.who, passM: best.d }); void ux; continue; }
    const s = (a.x - from.x) * cx + (a.z - from.z) * cz, d = Math.abs((a.x - from.x) * cz - (a.z - from.z) * cx);
    if (s <= 0 || s >= end) continue;
    const y = yAt(s), span = SPAN_M[st] ?? SPAN_M.stand;
    if (y >= span[0] && y <= span[1] && (d <= 0.25 || (d <= 0.35 && chance(r, 0.25)))) { const k = (y - span[0]) / (span[1] - span[0]); hits.push({ onId: a.who, part: k < 0.45 ? 'legs' : k < 0.85 ? 'torso' : 'head', rangeM: s, w: W_MUZZLE, through: true, shotId, nd, fromId: shooterId }); }
    else if (d <= 3) near.push({ who: a.who, passM: d });
  }
  return { hits: hits.slice(0, 1), stoppedBy: { kind: hits.length ? 'body' : kind, at: { x: from.x + cx * end, z: from.z + cz * end } }, nearMisses: near, rangeM: hits[0]?.rangeM ?? end, path: [] };
}
const trace = (state, o) => (traceRound ? traceRound(state, o) : stubTrace(state, o));

// (the line: you, the relay prone on lanes 9 and 11, the coach at your left shoulder)
function lineState(stance) {
  const person = (id, family, rank = 'Pvt') => ({ id, sex: 'm', name: { given: 'X', family }, service: { branch: 'marines', rank }, body: { v: 2, tmpl: 'm-adult' } });
  return {
    meta: { seed: 48213 }, clock: { ms: 2_000_000_000 }, player: { id: 'p1', actor: 'a1' }, armoury: {},
    places: { live: { site: 'melas', area: 'melas.ground' }, sites: { melas: { template: 'melas@1' } } },
    people: { p1: person('p1', 'Nyberg'), p2: person('p2', 'Okafor'), p3: person('p3', 'Baptiste'), p4: person('p4', 'Reyes', 'Sgt') },
    actors: { list: [
      { id: 'a1', who: 'p1', x: FP.x, z: FP.z, face: 'right', ...(stance === 'stand' ? {} : { stance }) },
      { id: 'a2', who: 'p2', x: FP.x, z: FP.z - GAP, face: 'right', stance: 'prone' },
      { id: 'a3', who: 'p3', x: FP.x, z: FP.z + GAP, face: 'right', stance: 'prone' },
      { id: 'a4', who: 'p4', x: COACH.x, z: COACH.z, face: 'right' },
    ] },
  };
}
const ROLE = { p2: 'neighbour', p3: 'neighbour', p4: 'coach' };

// (one ND: the fixture's line (see the header), traced; its hits through applyHit on a fresh body)
function oneNd(state, { posture, stance, during, k, yawTo = 0 }) {
  const r = stream('nd-lands', posture, stance, during, k, yawTo);
  const P = POSTURES[during === 'functionCheck' ? 'aimed' : posture], h = STANCE_H[stance], A = POSTURES.aimed;
  const swept = during === 'up' || during === 'down';
  if (swept && chance(r, SELF_SHOT_LONG)) return { into: 'foot', hits: [{ onId: 'p1', part: 'legs', where: 'foot', w: W_MUZZLE, through: true, nd: true, shotId: `nd${k}`, fromId: 'p1' }], end: 0, self: true };
  const y0 = (swept ? A : P).tipM[1] * h, x0 = FP.x + Math.cos(yawTo) * P.tipM[0], z0 = FP.z + Math.sin(yawTo) * P.tipM[0];
  const aimPitch = Math.atan2(FACE_Y - y0, FACE_X - x0);
  const basePitch = P === A ? aimPitch : P.pitchDeg * RAD;
  const pitch = swept ? range(r, Math.min(basePitch, aimPitch), Math.max(basePitch, aimPitch)) : basePitch;
  const cone = DISCHARGE_SPREAD * (1 - muzzleSafe(WH)), half = during === 'functionCheck' ? 0 : swept ? cone : Math.min(cone, P.halfDeg * RAD);
  const yaw = yawTo + range(r, -half, half);
  const t = trace(state, { shooterId: 'p1', from: { x: x0, y: y0, z: z0 }, yawRad: yaw, pitchRad: pitch, rngKey: `nd:${posture}:${stance}:${during}:${k}:${yawTo}`, nd: true, shotId: `nd${k}`, maxM: 2000 });
  return { into: t.hits.length ? ROLE[t.hits[0].onId] : t.stoppedBy.kind, hits: t.hits, end: t.rangeM, near: t.nearMisses ?? [], at: t.stoppedBy.at, yaw };
}
function grade(state, nd) {
  const applied = [];
  for (const h of nd.hits) {
    const p = state.people[h.onId], keep = JSON.stringify(p.body);
    applied.push(applyHit(state, null, { ...h, atMs: state.clock.ms }));
    p.body = JSON.parse(keep);
  }
  const down = Math.abs(Math.atan2(Math.sin(nd.yaw ?? 0), Math.cos(nd.yaw ?? 0))) <= Math.PI / 2;   // (downrange: within 90° of east)
  const ahead = down && (nd.into === 'berm' || (nd.into === 'ground' && (nd.at?.x ?? 0) >= LINE_X - 0.5));
  const base = ahead ? 'ND-1' : (nd.near ?? []).some(n => n.passM <= 1.5) ? 'ND-3' : 'ND-2';
  return gradeOfHits(base, applied);
}

export default [
  {
    name: '10,000 NDs per posture on the 300 m line with the relay at 5 m and the coach at your shoulder: where they land and their grades; an aimed prone ND into the berm every time; SELF_SHOT_LONG 10% on a long gun brought up or down; never a hit past the berm or the ground; ND-4 only with a body on the line',
    fn() {
      console.log(`      the trace: ${traceSrc}; the ND's line: this test's fixture of range's ndOf (see the header)`);
      const per = Math.ceil(PER_POSTURE / (STANCES.length * DURING.length));
      const cols = ['berm', 'ground', 'past', 'foot', 'neighbour', 'coach'], grades = ['ND-1', 'ND-2', 'ND-3', 'ND-4', 'ND-5'];
      console.log(`      ${'posture'.padEnd(10)} ${'stance'.padEnd(6)} ${'during'.padEnd(13)} ${cols.map(c => c.padStart(9)).join('')} | ${grades.map(c => c.padStart(6)).join('')}   (n ${per} each)`);
      let upN = 0, upSelf = 0, beyond = 0, ndNoBody = 0;
      const aimedProne = { n: 0, berm: 0, nd1: 0 };
      for (const posture of POSTURE_KEYS) for (const stance of STANCES) {
        const state = lineState(stance);
        for (const during of DURING) {
          const c = Object.fromEntries([...cols, ...grades].map(k => [k, 0]));
          for (let k = 0; k < per; k++) {
            const nd = oneNd(state, { posture, stance, during, k }), g = grade(state, nd);
            c[nd.into] = (c[nd.into] ?? 0) + 1; c[g]++;
            if (during === 'up') { upN++; if (nd.self) upSelf++; }
            if (nd.hits.some(h => !(h.rangeM === undefined || h.rangeM <= nd.end + 1e-6))) beyond++;
            if ((g === 'ND-4' || g === 'ND-5') && !nd.hits.length) ndNoBody++;
            if (posture === 'aimed' && stance === 'prone' && during !== 'up') { aimedProne.n++; if (nd.into === 'berm') aimedProne.berm++; if (g === 'ND-1') aimedProne.nd1++; }
          }
          console.log(`      ${posture.padEnd(10)} ${stance.padEnd(6)} ${during.padEnd(13)} ${cols.map(k => `${fmt(c[k] / per * 100, 1)}%`.padStart(9)).join('')} | ${grades.map(k => `${fmt(c[k] / per * 100, 1)}%`.padStart(6)).join('')}`);
        }
      }
      console.log(`      brought up: ${upSelf} of ${upN} into the holder's foot (${fmt(upSelf / upN * 100, 2)}%, SELF_SHOT_LONG ${SELF_SHOT_LONG * 100}%); aimed prone: ${aimedProne.berm} of ${aimedProne.n} into the berm, ${aimedProne.nd1} ND-1; hits beyond the stop ${beyond}; ND-4 or ND-5 with no body on the line ${ndNoBody}`);
      assert(aimedProne.n > 0 && aimedProne.berm === aimedProne.n && aimedProne.nd1 === aimedProne.n, JSON.stringify(aimedProne));
      assert(Math.abs(upSelf / upN - SELF_SHOT_LONG) <= 0.015, `self-shot ${upSelf}/${upN}`);
      assert(beyond === 0 && ndNoBody === 0, JSON.stringify({ beyond, ndNoBody }));
    },
  },
  {
    name: 'the muzzle swung in the aim onto the right-hand neighbour or the coach while charging: the person on the line is hit (ND-4) or killed (ND-5), the part by the line\'s height on them, the wound through applyHit; a standing shooter\'s level line passes over a prone neighbour',
    fn() {
      const N = 1000, out = [];
      const toCoach = Math.atan2(COACH.z - FP.z, COACH.x - FP.x);
      for (const [who, yawTo, stance] of [['the neighbour (prone, 5 m), you prone', Math.PI / 2, 'prone'], ['the coach (standing at your shoulder), you standing', toCoach, 'stand'], ['the coach, you kneeling', toCoach, 'kneel'], ['the neighbour, you standing (the line over him)', Math.PI / 2, 'stand']]) {
        const state = lineState(stance), c = { 'ND-1': 0, 'ND-2': 0, 'ND-3': 0, 'ND-4': 0, 'ND-5': 0 }, parts = {};
        let example = null;
        for (let k = 0; k < N; k++) {
          const nd = oneNd(state, { posture: 'aimed', stance, during: 'charge', k, yawTo });
          for (const h of nd.hits) parts[h.part] = (parts[h.part] ?? 0) + 1;
          const g = grade(state, nd); c[g]++;
          if (!example && nd.hits.length) { const p = state.people[nd.hits[0].onId], keep = JSON.stringify(p.body); example = applyHit(state, null, { ...nd.hits[0], atMs: state.clock.ms }).words; p.body = JSON.parse(keep); }
        }
        out.push({ who, c });
        console.log(`      onto ${who}: ${Object.entries(c).map(([k, v]) => `${k} ${fmt(v / N * 100, 1)}%`).join(', ')}; parts hit ${JSON.stringify(parts)}; e.g. "${example ?? 'no hit'}"`);
      }
      assert(out.slice(0, 3).every(o => o.c['ND-4'] + o.c['ND-5'] > 0.5 * N) && out[3].c['ND-4'] + out[3].c['ND-5'] === 0, JSON.stringify(out));
    },
  },
];
