// OLYMPUS tests: the drawn house's cast, every lane fair (the build sheet v0.0.21 §1 item 4, §6; house lens H6; F61).
//
// The draw alone, 1,000 seeds (F61, tests/flawless-drawn-a.mjs): every layout keeps every layout rule and every cast every
// fair-lane rule (a threat in every room; at most one hostage and one armoured, at least one no-shoot a lane; at most one stand in
// the #2's sector a room; every stand 0.57 m off every path, point and arc, 1.0 m from the other; seen from its owner's point; the
// hostage in #1's sector 2.5 to 5.0 m from his point), or it fell to the chunks' set cast after DRAW_TRIES 8 (counted); a lane's
// threats in [4, 6]; at least 40 distinct houses in seeds 1 to 100 (the set: 4 by its faces). The rules are measured once a room
// case (assemble.js roomCaseOf), so a second case checks them again on lanes as filled: the stands where the turners stand, read
// against the lane's own plans (room.js sectorOf, the paths, the points) for ten seeds. And the draw is the seed's alone: the fill
// writes the same code on every sheet and loadout (F61's second half). Prints the face mix, the hostage's rooms and the rooms the
// frag's brief would call hostiles only (house-kit.js intelOf reads the turners as built: nothing is written for it).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { f61, f61Fills, ENFORCED } from './flawless-drawn-a.mjs';
import { drawnCodeOf, parseHouse, STAND_PATH_CLEAR_M, STAND_GAP_M, HOSTAGE_RANGE_M } from '../src/sim/scenes/assemble.js';
import { lanePlanOf, sectorOf } from '../src/sim/combat/room.js';

const THREATS = new Set(['threat', 'armoured', 'hostage']);

export default [
  {
    name: 'F61 over 1,000 drawn seeds: every layout keeps every rule, every cast is fair or fell to the set cast; a lane\'s threats in [4, 6]; at least 40 distinct houses in seeds 1 to 100; the face mix, the hostage\'s rooms and the hostiles-only rooms printed',
    fn() {
      const F = f61(1000), faces = {}, hostage = { none: 0 }, threats = {}, intel = {}, houses = new Set();
      for (let seed = 1; seed <= 1000; seed++) {
        const c = drawnCodeOf(seed), H = parseHouse(c), fs = H.faces;
        if (seed <= 100) houses.add(c);
        fs.forEach(f => { faces[f] = (faces[f] ?? 0) + 1; });
        const h = fs.indexOf('hostage');
        if (h < 0) hostage.none++; else { const k = `room ${Math.floor(h / 2) + 1} (${H.rooms[Math.floor(h / 2)].letter})`; hostage[k] = (hostage[k] ?? 0) + 1; }
        const n = fs.filter(f => THREATS.has(f)).length + 1;
        threats[n] = (threats[n] ?? 0) + 1;
        const clean = [0, 1, 2].filter(k => !fs.slice(2 * k, 2 * k + 2).some(f => f === 'noshoot' || f === 'hostage')).length;
        intel[clean] = (intel[clean] ?? 0) + 1;
      }
      console.log(`      ${F.line}${Object.keys(F.why).length ? `; ${JSON.stringify(F.why)}` : ''}`);
      console.log(`      faces ${JSON.stringify(faces)}; the hostage ${JSON.stringify(hostage)}; threats a lane (H counted) ${JSON.stringify(threats)}; hostiles-only rooms a lane ${JSON.stringify(intel)}; ${houses.size} distinct houses in seeds 1 to 100 (ENFORCED ${ENFORCED.join(', ')})`);
      assert(!F.layoutsBad && !F.castsBad && F.fell < 100 && Object.keys(threats).every(n => n >= 4 && n <= 6) && houses.size >= 40, JSON.stringify({ F, threats, houses: houses.size }));
    },
  },
  {
    name: 'the fair-lane rules hold on lanes as filled (10 seeds): each room\'s stands where the turners stand, against the lane\'s own plans: a threat a room, at most one in the #2\'s sector, 0.57 m off every path and point, 1.0 m apart, the hostage in #1\'s sector 2.5 to 5.0 m from his point or the far walk\'s end; the draw the same on every sheet and loadout',
    fn() {
      const bad = [], games = [];
      for (let seed = 1; seed <= 10; seed++) {
        const g = createGame({ scenario: 'test-shoothouse', seed, tier: 'private', draw: 'drawn' }), s = g.state, L = lanePlanOf(s), R = s.armoury.range;
        games.push(g);
        const code = R.house.draw.code, fs = parseHouse(code).faces;
        for (let k = 0; k < 3; k++) {
          const P = L.plans[L.order[k]], T = R.turners.filter(t => t.stand?.[0] === String(k + 1));
          const segD = (x, z, path) => Math.min(...path.slice(0, -1).map((a, i) => { const b = path[i + 1], vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz, t = l2 ? Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / l2)) : 0; return Math.hypot(a[0] + vx * t - x, a[1] + vz * t - z); }));
          if (!T.some(t => THREATS.has(t.face))) bad.push(`${seed} room ${k + 1}: no threat`);
          if (T.filter(t => sectorOf(P, t.x, t.z) === 2).length > 1) bad.push(`${seed} room ${k + 1}: two in the #2's sector`);
          if (Math.hypot(T[0].x - T[1].x, T[0].z - T[1].z) < STAND_GAP_M - 1e-9) bad.push(`${seed} room ${k + 1}: the stands ${fmt(Math.hypot(T[0].x - T[1].x, T[0].z - T[1].z), 2)} m apart`);
          for (const t of T) {
            const clear = Math.min(segD(t.x, t.z, P.paths[1]), segD(t.x, t.z, P.paths[2]), ...(P.far ? [segD(t.x, t.z, P.far.path)] : []), ...P.points.map(p => Math.hypot(p[0] - t.x, p[1] - t.z)));
            if (clear < STAND_PATH_CLEAR_M - 0.02) bad.push(`${seed} ${t.stand}: ${fmt(clear, 2)} m off a path or point`);
            if (t.face === 'hostage') {
              const dead = P.dead.some(([x, z, r]) => Math.hypot(t.x - x, t.z - z) <= r), from = dead && P.far ? P.far.path.at(-1) : P.points[0], d = Math.hypot(from[0] - t.x, from[1] - t.z);
              if (sectorOf(P, t.x, t.z) !== 1 || d < HOSTAGE_RANGE_M[0] - 0.02 || d > HOSTAGE_RANGE_M[1] + 0.02) bad.push(`${seed} ${t.stand}: the hostage slot ${sectorOf(P, t.x, t.z)}, ${fmt(d, 2)} m`);
          }
          }
          if (T.map(t => t.face).join() !== fs.slice(2 * k, 2 * k + 2).join()) bad.push(`${seed} room ${k + 1}: the turners' faces ${T.map(t => t.face)} not the code's`);
        }
      }
      for (const [seed, opts] of [[1, { tier: 'tierone' }], [1, { tier: 'recruit', loadout: 'full' }], [2, { tier: 'sgt', loadout: 'breach' }], [2, { tier: 'raider' }]]) games.push(createGame({ scenario: 'test-shoothouse', seed, draw: 'drawn', ...opts }));
      const same = f61Fills(games);
      console.log(`      10 lanes filled, ${games.length} fills on four sheets and three loadouts: ${bad.length} off${bad.length ? `: ${bad.join('; ')}` : ''}; the codes by seed ${JSON.stringify(Object.fromEntries(Object.entries(same.codes).slice(0, 3)))} … the same on every sheet and loadout ${same.ok}`);
      assert(!bad.length && same.ok, JSON.stringify({ bad, same }));
    },
  },
];
