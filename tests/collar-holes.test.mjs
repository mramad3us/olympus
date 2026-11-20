// OLYMPUS tests: frangible against bulkheads, their ball through walls and the hull (F160's record half): every miss met by one face once, no onward round, 0 marine rounds through a bulkhead or the hull, the counts equal the record (v0.0.27's build sheet §6 B, item 12, FT§8; src/sim/combat/holes.js).
//
// On tests/boarding-world.mjs (the hauler's cabin 2 and the bunk room, the boarding's record), holes.js's own functions are called on scripted
// shot records: the faces of eight known lines, 500 misses each way from points all over the deck (yours frangible from your R-7,
// theirs ball from the pirates' R-7 and a smuggler's P-12, at the men and past them), and WEAPONS §8.5's 10 m table from the walls' rows.
// Each case fails without its fix: with no missFace the record stays empty; with the hull rated as a cabin wall or the frangible's half
// pen left out, a marine round goes through a bulkhead or the hull; with the counts or the kept list off, they differ from the records.
import { assert, fmt } from './helpers.mjs';
import { boardingWorld } from './boarding-world.mjs';
import { faceOf, missFace, holesOf, holeOf, HOLES_KEPT, WALL_KINDS, SEALED_KINDS } from '../src/sim/combat/holes.js';
import { WALLS, penOf, pOfMaterial, pStop, FRANGIBLE_HARD_K } from '../src/sim/arms/penetrate.js';
import { flightOf, envOfPlace } from '../src/sim/arms/ballistics.js';
import { MODELS } from '../src/sim/arms/models.js';
import { MATERIALS } from '../src/sim/arms/penetrate.js';
import { loadOf } from '../src/sim/arms/calibres.js';
import { stream, range, next } from '../src/core/rng.js';
import { areaOf } from '../src/sim/places/model.js';

const busOf = () => { const events = []; return { events, emit: (type, data) => events.push({ type, data }) }; };
// (the chance a round of a load from a gun goes through a wall row at a range: the contest missFace rolls, read whole)
function throughP(state, model, load, row, rangeM) {
  const cal = MODELS[model].cal, W = WALLS[row], frangible = !!loadOf(cal, load)?.frangible, M = MATERIALS[W.material];
  const pen = penOf(cal, load, flightOf(model, load, envOfPlace(state), rangeM).vMs) * (frangible && M.hard ? FRANGIBLE_HARD_K : 1);
  return 1 - pStop(pen, pOfMaterial(W.material, W.mm));
}
// (a point on the deck, inside a room by 0.4 m, from a stream)
function deckPoint(A, r) {
  const room = A.rooms[Math.floor(next(r) * A.rooms.length)], [x0, z0, x1, z1] = room.rect;
  return [range(r, x0 + 0.4, x1 - 0.4), range(r, z0 + 0.4, z1 - 0.4)];
}
// (500 misses of a side: shot records as shot.js resolveShot writes them, from points all over the deck, at a man or along a bearing)
function sweep(w, side, n, key) {
  const s = w.s, A = areaOf(s.places.live.area), r = stream(48213, 'collar-holes', key), out = [], bus = busOf();
  const men = w.men.map(m => m.T.key), mine = s.people[w.pid].kit.worn.sling, theirs = s.people[w.men[0].pid].kit.worn.sling;
  s.items['t-p12'] ??= { type: 'gun', model: 'p12' };
  for (let i = 0; i < n; i++) {
    const [x, z] = deckPoint(A, r), aimed = next(r) < 0.6, p12 = side === 'theirs' && next(r) < 0.4;
    const shot = { id: `${key}${i}`, who: side === 'ours' ? w.pid : w.men[i % w.men.length].pid, gun: side === 'ours' ? mine : p12 ? 't-p12' : theirs, atMs: s.clock.ms + i * 50, fired: true,
      load: side === 'ours' ? 'frangible' : 'ball', muzzle: { x, y: next(r) < 0.2 ? 1.05 : 1.45, z }, dirRad: range(r, -Math.PI, Math.PI), target: aimed ? men[i % men.length] : null };
    out.push({ shot, rec: missFace(s, shot, bus), model: s.items[shot.gun].model });
  }
  return { out, bus };
}

export default [
  {
    name: 'the faces of eight known lines aboard: a cabin wall, the hull (a side and the deckhead), a bulkhead with a void behind, the lock\'s dogged hatch, the head\'s stalls, the DC locker',
    fn() {
      const w = boardingWorld({ room: 'cabin-2' }), s = w.s;
      const lines = [
        ['the passage toward the bunks', [5.0, 4.75], Math.PI / 2, 'cabin'], ['cabin 1 toward its dorsal side', [5.5, 2.0], -Math.PI / 2, 'hull'],
        ['the lock toward the water tank', [1.25, 4.75], -Math.PI / 2, 'bulkhead'], ['the passage toward the lock', [5.0, 4.75], Math.PI, 'hatch'],
        ['the bunk room toward the head', [6.0, 6.5], Math.PI, 'partition'], ['the passage toward the DC locker', [9.0, 4.75], 0, 'locker'],
        ['cabin 2 toward its starboard side', [9.0, 3.0], 0, 'hull'], ['cabin 1 toward cabin 2', [5.0, 3.0], 0, 'cabin'],
      ];
      const got = lines.map(([name, [x, z], dir, want]) => ({ name, want, F: faceOf(s, { id: name, muzzle: { x, y: 1.35, z }, dirRad: dir, target: null }) }));
      // (a round laid on the deckhead man (4b) from below, missing him high: the deckhead's plate, the hull)
      const up = faceOf(s, { id: 'up', muzzle: { x: 10.5, y: 1.0, z: 3.4 }, dirRad: 0, target: w.men[1].T.key });
      console.log(`      ${got.map(g => `${g.name}: ${g.F?.face} (${g.F?.row}) at ${fmt(g.F?.rangeM ?? 0, 2)} m`).join('; ')}; at the deckhead man from below: ${up?.face} at y ${up?.y}`);
      assert(got.every(g => g.F?.face === g.want && WALL_KINDS[g.F.face] === g.F.row), JSON.stringify(got.filter(g => g.F?.face !== g.want).map(g => [g.name, g.F?.face, g.want])));
      assert(up && ['hull', 'cabin', 'bulkhead', 'locker'].includes(up.face), JSON.stringify(up));
    },
  },
  {
    name: '500 misses each way (F160): every one met by one face once, a round handed twice while kept read back, not counted twice; your frangible 0 through a bulkhead, the hull or a hatch; their ball through each material at the contest\'s own rate within 5 points; the counts equal the records, the last 64 kept',
    fn() {
      const w = boardingWorld({ room: 'bunks' }), s = w.s, B = s.armoury.range.house.boarding;
      const ours = sweep(w, 'ours', 500, 'o'), theirs = sweep(w, 'theirs', 500, 't');
      const again = missFace(s, theirs.out[480].shot, theirs.bus);
      const all = [...ours.out, ...theirs.out], met = all.filter(x => x.rec);
      const tally = (side, f) => all.filter(x => x.rec?.side === side && f(x.rec)).length;
      const C = holesOf(s), want = { ours: { rounds: tally('ours', () => true), dust: tally('ours', r => !r.through), through: tally('ours', r => r.through), bulkhead: tally('ours', r => r.through && SEALED_KINDS.has(r.face)) },
        theirs: { rounds: tally('theirs', () => true), holes: tally('theirs', r => r.kind === 'hole'), hull: tally('theirs', r => r.kind === 'hole' && r.face === 'hull') } };
      const byFace = (side) => Object.fromEntries(Object.keys(WALL_KINDS).map(k => [k, all.filter(x => x.rec?.side === side && x.rec.face === k).length]).filter(([, n]) => n));
      // (their ball by material: the through rate against the contest's own chance at each record's range)
      const rates = {};
      for (const x of theirs.out) {
        const m = (rates[x.rec.row] ??= { n: 0, through: 0, p: 0 });
        m.n++; m.through += x.rec.through ? 1 : 0; m.p += throughP(s, x.model, 'ball', x.rec.row, x.rec.rangeM);
      }
      console.log(`      met ${met.length} of ${all.length}; yours by face ${JSON.stringify(byFace('ours'))}, theirs ${JSON.stringify(byFace('theirs'))}; puffs ${ours.bus.events.length + theirs.bus.events.length}`);
      console.log(`      the counts ${JSON.stringify(C)}; kept ${B.holes.length} of ${HOLES_KEPT}; handed twice: ${again === holeOf(s, theirs.out[480].shot.id) ? 'read back' : 'counted again'}`);
      console.log(`      their ball through, by row: ${Object.entries(rates).map(([k, m]) => `${k} ${m.through}/${m.n} = ${fmt(100 * m.through / m.n)}% (the contest's ${fmt(100 * m.p / m.n)}%)`).join(', ')}`);
      assert(met.length === all.length && all.every(x => x.rec && WALL_KINDS[x.rec.face]), 'every miss met by a face');
      assert(C.ours.bulkhead === 0 && ours.out.every(x => !(x.rec.through && SEALED_KINDS.has(x.rec.face))), JSON.stringify(C.ours));
      assert(JSON.stringify(C) === JSON.stringify(want), JSON.stringify({ C, want }));
      assert(B.holes.length === HOLES_KEPT && JSON.stringify(B.holes) === JSON.stringify(all.slice(-HOLES_KEPT).map(x => x.rec)), 'the last 64 kept');
      assert(Object.values(rates).filter(m => m.n >= 30).every(m => Math.abs(m.through - m.p) / m.n <= 0.05), JSON.stringify(rates));
      assert(again === holeOf(s, theirs.out[480].shot.id) && ours.bus.events.every(e => e.type === 'fx' && e.data.kind === 'dust') && ours.bus.events.length === 500 && theirs.bus.events.length === 500, 'one puff a miss, none for a round handed twice');
    },
  },
  {
    name: 'WEAPONS §8.5\'s table at 10 m from the walls\' rows (FT§8) within 5 points: your frangible through a partition 59%, a cabin wall 23%, a bulkhead 0%; their 9×21 ball 97, 82, 29; their R-7 ball 100, 100, 100; the hull stops your frangible always',
    fn() {
      const w = boardingWorld({ room: 'cabin-2', men: 1 }), s = w.s;
      const want = { 'r7/frangible': { partition: 59, cabin: 23, bulkhead: 0, hull: 0 }, 'p12/ball': { partition: 97, cabin: 82, bulkhead: 29 }, 'r7/ball': { partition: 100, cabin: 100, bulkhead: 100 } };
      const bad = [], lines = [];
      for (const [k, row] of Object.entries(want)) {
        const [model, load] = k.split('/'), got = Object.fromEntries(Object.keys(row).map(kind => [kind, 100 * throughP(s, model, load, WALL_KINDS[kind], 10)]));
        lines.push(`${k}: ${Object.entries(got).map(([kind, v]) => `${kind} ${fmt(v)}% (${row[kind]})`).join(', ')}`);
        for (const kind of Object.keys(row)) if (Math.abs(got[kind] - row[kind]) > 5) bad.push(`${k} ${kind} ${fmt(got[kind])} against ${row[kind]}`);
      }
      console.log(`      ${lines.join('; ')}`);
      assert(!bad.length, bad.join('; '));
    },
  },
];
