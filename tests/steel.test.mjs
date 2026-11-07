// OLYMPUS tests: the armoured silhouette's steel (src/sim/arms/shot.js steelOf; WEAPONS §8.2, §8.5; COMBAT §25.10.2, §25.10.3; the build sheet 0.0.8 §2.2, §5.2, §8 item 14): torso rounds ring on 10 mm of armour steel and the face stays up; the head plate falls at a margin of 4 or better and rings at a pass.
// On tests/specials-world.mjs's bay (the specials role's fixture), each round through resolveShot on its own stream, the gun put back between.
import { assert, fmt } from './helpers.mjs';
import { pairsWorld, refill, SHEETS } from './specials-world.mjs';
import { targetOf } from '../src/sim/arms/shooting.js';
import { resolveShot, modsOf, dcOf, PLATE_MM, steelOf } from '../src/sim/arms/shot.js';
import { A_MARGIN } from '../src/sim/arms/paper.js';
import { penOf, pStop, pOfMaterial } from '../src/sim/arms/penetrate.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { oddsOf } from '../src/sim/skills/checks.js';

const N = 2000;
// (N rounds at the armoured face on lane 4 from a line, a part, by a sheet: the shares)
function fire(tier, line, part) {
  const w = pairsWorld({ tier, line, lane: 4, turned: [4], aimAt: 4, faces: { 4: 'armoured' } }), { s, pid, gunId } = w, T = targetOf(s, 'turner:4', pid);
  const out = { n: 0, hit: 0, ring: 0, through: 0, down: 0, downBelow: 0, ringFail: 0, vMs: 0, holes: 0 };
  for (let i = 0; i < N; i++) {
    refill(s, gunId);
    const { shot } = resolveShot(s, null, { pid, gunId, target: T, part, held: { v: 0 }, log: false });
    if (!shot.fired || shot.stoppage) continue;
    out.n++; out.vMs += shot.flight.vMs;
    if (shot.zone) out.hit++;
    if (shot.ring) out.ring++;
    if (shot.through) out.through++;
    if (shot.down) out.down++;
    if (shot.hole?.at) out.holes++;
    if (shot.down && !(shot.roll.margin >= A_MARGIN)) out.downBelow++;
    if (shot.ring && !shot.roll.ok) out.ringFail++;
  }
  out.vMs /= out.n;
  return { ...out, w, T };
}

export default [
  {
    name: 'torso rounds on the armoured face at 7 and 10 m ring on 10 mm of armour steel (penetrate.js\'s contest at the round\'s speed there), a few go through, and the face stays up every time: a torso round never puts it down',
    fn() {
      const lines = [], bad = [];
      for (const line of [7, 10]) {
        const r = fire('private', line, 'torso'), pen = penOf('6.5x40r', 'ball', r.vMs), p = pStop(pen, pOfMaterial('steelArmour', PLATE_MM));
        lines.push(`${line} m: ${r.n} fired, ${r.hit} on the plate; rang ${r.ring} (${fmt(100 * r.ring / r.hit, 1)}%), through ${r.through} (${fmt(100 * r.through / r.hit, 1)}%), down ${r.down}; the round at ${Math.round(r.vMs)} m/s, pen ${fmt(pen, 2)} mm against ${PLATE_MM} mm: pStop ${fmt(p, 3)}`);
        if (r.down || r.ring + r.through !== r.hit || Math.abs(r.ring / r.hit - p) > 0.03 || r.ringFail) bad.push(`${line} m: ${JSON.stringify({ ...r, w: undefined, T: undefined })}`);
      }
      // (a paper threat's torso round never rings: the steel is the armoured face's)
      const w = pairsWorld({ tier: 'private', lane: 4, turned: [4], aimAt: 4 }), T = targetOf(w.s, 'turner:4', w.pid);
      refill(w.s, w.gunId);
      const { shot } = resolveShot(w.s, null, { pid: w.pid, gunId: w.gunId, target: T, part: 'torso', held: { v: 4 }, log: false });
      lines.push(`a paper threat's torso round: zone ${shot.zone}, ring ${shot.ring}, through ${shot.through}, down ${shot.down ?? '(not the steel\'s)'}; steelOf on it ${JSON.stringify(steelOf(w.s, shot, T))}`);
      if (shot.ring || 'down' in shot) bad.push('paper rang');
      for (const l of lines) console.log(`      ${l}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'head rounds by sheet: the head plate falls at a margin of A_MARGIN 4 or better and rings at a pass, at the plaque\'s odds (the recruit 50%, the private 80%, the rest 95%; 2,000 rounds each)',
    fn() {
      const lines = [], bad = [];
      for (const tier of ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']) {
        const r = fire(tier, 10, 'head'), { s, pid, gunId } = r.w;
        const mods = modsOf(s, pid, { gunId, target: r.T, part: 'head', held: { v: 0 } }), dc = dcOf({ rangeM: r.T.dM, part: 'head' }).dc, mrk = rollerOf(s, pid).value('marksmanship');
        const want = oddsOf(mrk, dc + A_MARGIN, mods), pass = oddsOf(mrk, dc, mods);
        lines.push(`${SHEETS[tier].label.padEnd(14)} MRK ${String(mrk).padStart(2)}: ${r.n} head rounds at 10 m, hit the head plate ${fmt(100 * r.hit / r.n, 1)}% (odds ${Math.round(pass * 100)}%), rang ${fmt(100 * r.ring / r.n, 1)}%, fell ${fmt(100 * r.down / r.n, 1)}% (odds ${Math.round(want * 100)}%); fell below the margin ${r.downBelow}, rang on a miss ${r.ringFail}`);
        if (Math.abs(r.down / r.n - want) > 0.03 || r.downBelow || r.ringFail || r.ring !== r.hit) bad.push(tier);
      }
      for (const l of lines) console.log(`      ${l}`);
      assert(!bad.length, bad.join('; '));
    },
  },
];
