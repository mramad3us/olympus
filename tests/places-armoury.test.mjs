// OLYMPUS tests: places-armoury, "The window and the canopy"'s ground (the build sheet v0.0.28 §1 C, item 19, §6 C; F187).
//
// The armoury's south front, its porch and the cleaning canopy on Base Melas's ground (src/data/places/armoury.js, laid out by
// src/sim/places/ground.js): the two issue windows in their bays, the two clearing barrels and the stencil, the rank's thirteen places,
// the eight cleaning tables with their 32 spots, the two solvent tanks, the four air hoses and the six lamps. F187 (tests/flawless-ground.mjs
// groundGauge): every place a free cell reached from the door's waypoint on the C0 and C1 grids, the staff spots free and closed off
// from the apron, the door's path free, the rank clear, the kinds the kit's size, the data, spotsOf and armouryPlaceOf agreeing. And
// nothing else on the ground moved: the ground less the round's pieces and lamps, the armoury's block whole again, is v0.0.27's to the
// digest (places-validate's GROUND_AREA golden of the base, 1682873bc5491e). Quick. Fails without the ground (no pieces, no spots, no
// bays: the staff spots inside the building's block) or with a place moved onto a blocker, a rank place too near a window, a piece off
// its data.
import { assert, fmt } from './helpers.mjs';
import { goldenDigest } from './golden.mjs';
import { GROUND_AREA } from '../src/sim/places/ground.js';
import { validateGround } from '../src/sim/places/validate.js';
import { armouryPlaceOf, ARMOURY_PLACE_IDS } from '../src/sim/places/fixtures.js';
import { FRONT, PORCH, CANOPY, ARM_RANK, BAY_M, LAMP_Y_M } from '../src/data/places/armoury.js';
import { groundGauge, f187Line, GROUND_ENFORCED } from './flawless-ground.mjs';

/** The ground's digest before the round's pieces (places-validate's GROUND_AREA golden on the base tree 511f11c2, v0.0.27's ground). */
const GROUND_BEFORE = '1682873bc5491e';
const ROUND_IDS = new Set([...FRONT.windows.map(w => w.id), ...PORCH.barrels.map(b => b.id), PORCH.sign.id, ...CANOPY.tables.map(t => t.id), ...CANOPY.tanks.map(t => t.id), ...CANOPY.hoses.map(t => t.id)]);

export default [
  {
    name: 'F187: the armoury\'s ground as the build sheet v0.0.28 places it: the five kinds the kit\'s size where the data puts them, every window\'s customer spot, every barrel\'s spot, the rank\'s thirteen places and the canopy\'s 32 table spots free and reached from the door\'s waypoint on the C0 and C1 grids, each armourer\'s spot free in its bay and closed from the apron by the counter, the door\'s path free, the rank 1.2 m clear of the customer spots and 1.5 m of the barrels\'',
    fn() {
      const r = groundGauge().F187;
      console.log(`      ${f187Line(r)}`);
      assert(GROUND_ENFORCED.has('F187'), 'F187 is not enforced');
      assert(r.ok, JSON.stringify({ unreached: r.unreached.slice(0, 6), misplaced: r.misplaced, disagree: r.disagree, staff: r.staff, door: r.doorPath.blocked.slice(0, 4), rank: r.rank, inMass: r.counterInMass, kinds: r.kinds.filter(k => !k.ok) }));
    },
  },
  {
    name: 'the round adds to the ground and moves nothing else on it: the armoury\'s block stands round its two windows\' bays (1.2 m deep), each window told its bay and the building\'s 4.0 m, the stencil over the west barrel, six lamps under the canopy\'s roof; the ground\'s rules hold for every new piece; without them the ground is v0.0.27\'s to the digest',
    fn() {
      const arm = GROUND_AREA.massing.find(m => m.id === FRONT.building), mine = GROUND_AREA.fixtures.filter(f => ROUND_IDS.has(f.id));
      console.log(`      ${FRONT.building}: ${arm.rects.length} rects ${JSON.stringify(arm.rects)} (the block round the bays ${FRONT.windows.map(w => `[${w.bay.x0}, ${w.bay.z0}, ${w.bay.x1}, ${w.bay.z1}]`).join(' and ')}), ${arm.heightM} m; its door ${JSON.stringify(arm.doors.map(d => [d.x, d.z, d.side]))}`);
      console.log(`      ${mine.length} pieces: ${mine.map(f => `${f.id} (${f.kind}${f.make ? ` ${f.make}` : ''}) at (${f.x}, ${f.z})`).join('; ')}`);
      assert(mine.length === ROUND_IDS.size, `${mine.length} of ${ROUND_IDS.size} pieces on the ground`);
      // (the bays out of the block, whole: the block's rects cover its rect less the bays exactly)
      const area = (q) => (q[2] - q[0]) * (q[3] - q[1]), bays = FRONT.windows.reduce((n, w) => n + (w.bay.x1 - w.bay.x0) * (w.bay.z1 - w.bay.z0), 0);
      assert(Math.abs(arm.rects.reduce((n, q) => n + area(q), 0) - (32 * 22 - bays)) < 1e-6 && arm.rects.length === 4, JSON.stringify(arm.rects));
      for (const w of FRONT.windows) {
        const f = mine.find(x => x.id === w.id);
        assert(f.look.bayM === BAY_M && f.look.headM === arm.heightM && f.make === 'counter', JSON.stringify(f));
      }
      const sign = mine.find(f => f.id === PORCH.sign.id), lamps = GROUND_AREA.look.lamps.slice(-CANOPY.lamps.length);
      assert(sign.kind === 'sign' && sign.make === 'stencil' && sign.look.text === 'CLEAR YOUR WEAPON' && Math.abs(sign.x - PORCH.barrels[0].x) < 1e-9, JSON.stringify(sign));
      assert(lamps.every((l, i) => l.kind === 'street' && l.y === LAMP_Y_M && l.x === CANOPY.origin[0] + CANOPY.lamps[i].x && l.z === CANOPY.origin[1] + CANOPY.lamps[i].z), JSON.stringify(lamps));
      console.log(`      the canopy's lamps ${lamps.map(l => `(${l.x}, ${l.z})`).join(', ')} at ${LAMP_Y_M} m, ${GROUND_AREA.look.lamps.length} on the ground`);
      // (the ground's rules (validateGround) find nothing wrong with any new piece: out of the masses, the canopy an open structure, clear of the door)
      const v = validateGround(GROUND_AREA), bad = v.problems.filter(p => ROUND_IDS.has(p.id) || p.id === FRONT.building);
      assert(!bad.length, JSON.stringify(bad));
      // (the ground less the round's pieces, its lamps and its bays: v0.0.27's, to the digest)
      const blockers = [], seen = new Set();
      for (const b of GROUND_AREA.nav.blockers) {
        if (b.tag !== FRONT.building) { blockers.push(b); continue; }
        if (!seen.size) blockers.push({ x0: 444, z0: 190, x1: 476, z1: 212, tag: b.tag, h: b.h });
        seen.add(b);
      }
      const before = { ...GROUND_AREA, massing: GROUND_AREA.massing.map(m => (m.id === FRONT.building ? { ...m, rects: [[444, 190, 476, 212]] } : m)), fixtures: GROUND_AREA.fixtures.filter(f => !ROUND_IDS.has(f.id)), look: { ...GROUND_AREA.look, lamps: GROUND_AREA.look.lamps.slice(0, -CANOPY.lamps.length) }, nav: { ...GROUND_AREA.nav, blockers } };
      const d = goldenDigest(before);
      console.log(`      the ground less the round's: ${d} (v0.0.27's ${GROUND_BEFORE}); ${seen.size} blockers of the armoury's block in place of 1`);
      assert(d === GROUND_BEFORE, `the ground moved outside the round's pieces: ${d}`);
    },
  },
  {
    name: 'armouryPlaceOf reads every place of the scene by its id in the ground\'s frame (the windows\' spots, the barrels\', the rank\'s, the tables\', the rack, a piece\'s middle) and throws on one it does not know',
    fn() {
      const out = ARMOURY_PLACE_IDS.map(id => [id, armouryPlaceOf(id)]);
      assert(out.length === 2 * 2 + 2 + 13 + 32 && out.every(([, p]) => Number.isFinite(p.x) && Number.isFinite(p.z) && ['up', 'down', 'left', 'right'].includes(p.face)), JSON.stringify(out.slice(0, 3)));
      const you = armouryPlaceOf('arm:rank:you'), rack = armouryPlaceOf('arm:rack'), t3 = armouryPlaceOf('f:canopy:t3'), t3n = armouryPlaceOf('f:canopy:t3#1');
      assert(you.x === ARM_RANK.at(-1).x && rack.x === FRONT.rack.x && rack.z === FRONT.rack.z && t3.x === 462 && t3.z === 222 && t3n.face === 'down' && t3n.z < t3.z, JSON.stringify({ you, rack, t3, t3n }));
      let thrown = 0;
      for (const id of ['arm:rank:99', 'f:canopy:t9#1', 'f:armoury:window-1#3', 'f:melas:lamp-1', null]) { try { armouryPlaceOf(id); } catch { thrown++; } }
      assert(thrown === 5, `${thrown} of 5 unknown ids thrown`);
      console.log(`      ${out.length} places: window 1's customer (${fmt(out[0][1].x, 3)}, ${fmt(out[0][1].z, 3)}) ${out[0][1].face}, its armourer (${fmt(out[1][1].x, 3)}, ${fmt(out[1][1].z, 3)}) ${out[1][1].face}; yours in the rank (${you.x}, ${you.z}); the rack (${rack.x}, ${rack.z}); t3's #1 (${t3n.x}, ${t3n.z}) ${t3n.face}; 5 of 5 unknown ids thrown`);
    },
  },
];
