// places-validate: PLACES §9.6's rules over the test rooms, Echo Company's two floors, Base Melas's
// ground and its site plan, each rule broken on purpose once to prove it fails, and the goldens that
// pin what is authored (the build sheets 0.0.2 §5.3 and 0.0.3 §5.1). The catalogue's sizes are checked
// against the kit's FOOTPRINTS here, the one place that reads both (the sim may not import the art:
// TECH §2.2; build sheet 0.0.2 §8 item 6). The user's rule of 2026-11-05 ("game world is handcrafted")
// is held twice: no place record carries a seed, and a new game's places.sites holds none.
// 0.0.5 (the build sheet 0.0.5 §2.3, §5.3): the KD range's 25 m bay and its tower (src/data/places/range.js),
// at their place on X3 as melas@1's final template: the lanes, boxes, coaches and cards where the sheet puts
// them, every piece inside the ground drawn and X3, none in another, their kinds the kit's FOOTPRINTS, every
// lane's firing point and coach's place reachable from every other on the ground's C0 grid, and the bay
// closed (its fence, rope and berm: nothing outside reached), pinned by goldens. The ground grew over X3, so
// its golden and the site plan's (the bay's zone) were re-set on purpose in 0.0.5; in 0.0.6 Echo's floors'
// and its ground floor's grid's, for the flights' guard (fixtures.js flightGuardOf, a flight's `open`
// side, a rail across its foot), the stair rooms' extinguishers moved off the flights' feet and their
// night lights, and the up bands 0.3 m north, with the new rule stair-foot.
// 0.0.7 (the build sheet 0.0.7 §2.3, §5.3): the rest of the KD ground (KD_RANGE.kd: the 200, 300 and 500 m lines
// with their twenty points, the target line on its carriers, the pits under the parapet, the impact berm, the wind
// flags, the shack, the canopy and the rope round the lanes), every piece in the ground drawn and X3 and the kit's
// FOOTPRINTS; every point of every line and every coach's place reached from the ready line on the ground's C0 grid,
// the pits walked along their length, the lanes closed (nothing outside the rope and the parapet reached), the
// gates still shut. GROUND_AREA, KD_RANGE and RANGE_PIECES re-set on purpose for it.
// 0.0.8 (the build sheet 0.0.8 §2.3, §5.3): test-pairs' ground on the bay (src/data/places/range.js PAIRS): the 7 m and
// 10 m lines at 7 and 10 m from the turners, the pad under them, the twelve points with their boxes and coaches, the six
// turner stands 1 m in front of the frames (block 'see', clear of the cards and the 25 m line), every point and coach
// reached from the 25 m line's points on the ground's C0 grid; GROUND_AREA and RANGE_PIECES re-set on purpose for it,
// PAIRS pinned by its own golden.
// 0.0.12 (the build sheet 0.0.12 §2.1, §5.1; PLACES §4.15, §9.6, §9.9; COMBAT §25.5.1): the Wheel's sector 4, house 1 of
// the shoot houses in X4's layout A and its apron (src/data/places/wheel.js WHEEL_S4, HOUSE1), a `deck` at 1 G of spin
// with no sky: every rule of §9.6, a swing on every leaf, the closet locked; every point, stack and start of the lane
// reached from the start mark on the C0 grid with the doors open, the house closed to the apron but by its doors; the
// start's 4.00 m to room 1's stack and room 1 as COMBAT §25.5.1 draws it; room 3 dim at 10:00; new goldens on purpose.
import { assert, fmt } from './helpers.mjs';
import { golden } from './golden.mjs';
import { createGame } from './game.mjs';
import { TEST_AREA } from '../src/data/places/testroom.js';
import { MELAS_COMPACTION } from '../src/data/places/melas.js';
import { MELAS_PLAN, MELAS_PLAN_AS_WRITTEN } from '../src/sim/places/siteplan.js';
import { ECHO_1, ECHO_2 } from '../src/sim/places/echo.js';
import { GROUND_AREA } from '../src/sim/places/ground.js';
import { validateArea, validatePlan, validateGround, DOOR_CLEAR_M, MIN_GAP_M, EXIT_SIGN_M, SEEDS_PER_KIND, LAMPS_MAX } from '../src/sim/places/validate.js';
import { CATALOGUE, KINDS, berthOf, seatOf, spotsOf } from '../src/sim/places/fixtures.js';
import { buildGrid } from '../src/sim/places/nav.js';
import { FOOTPRINTS } from '../src/art/kit/index.js';
import { melasGame } from './bots/walker.mjs';
import { KD_RANGE, RANGE_PIECES, RANGE_KINDS, LINE_FLAGS, TOWER, PAIRS, KD_PADS, KD_FLAG_AHEAD_M } from '../src/data/places/range.js';
import { pieceRect } from '../src/sim/places/ground.js';
import { chunkGrid, cellOf, CHUNK_M, CELL_M } from '../src/sim/places/nav.js';
import { WHEEL_S4, HOUSE1, X4_CHUNKS, LAYOUT_A, KICK_DC } from '../src/data/places/wheel.js';
import { X4_PLANS } from '../src/data/places/x4-plans.js';
import { gravityAt, envAt, msAtLocal } from '../src/sim/places/env.js';
import { lightLevel } from '../src/sim/places/light.js';
import { newState } from '../src/core/state.js';
import { START_MS } from '../src/data/setting/calendar.js';

const copy = (v) => JSON.parse(JSON.stringify(v));
const rulesOf = (res) => [...new Set(res.problems.map(p => p.rule))];
const AREA_RULES = ['ids', 'unique', 'opening', 'room-opening', 'door-clear', 'zone', 'kind', 'overlap', 'in-room', 'spawn'];
const ECHO_RULES = ['no-seed', 'portal', 'arrive-face', 'stair-top', 'stair-foot', 'link', 'decor', 'exit-sign', 'seeds', 'heads', 'berths'];
const GROUND_RULES = ['ids', 'unique', 'no-seed', 'door', 'reveal', 'portal', 'door-sign', 'fixture', 'gate', 'lamps', 'seeds'];
const PLAN_RULES = ['ids', 'unique', 'ring', 'apart', 'door', 'road', 'gate', 'edge', 'joined', 'daily'];

// (one sample a rule, each the authored data with one thing broken)
const AREA_BREAKS = {
  ids: (a) => { a.rooms[1].id = 'T1 Bay'; },
  unique: (a) => { a.fixtures[1].id = a.fixtures[0].id; },
  opening: (a) => { a.openings[0].rooms = ['t1.bay', 't1.office']; },
  'room-opening': (a) => { a.rooms.push({ id: 't1.store', kind: 'store', rect: [31.6, 2.4, 36.4, 10.1], zone: 't1.z.office' }); a.zones[1].rooms.push('t1.store'); },
  'door-clear': (a) => { a.fixtures.push({ id: 'f:t1:bin:09', kind: 'bin', make: 'bin', x: 28.5, z: 2.9, face: 'down', room: 't1.bay', seed: 1 }); },
  zone: (a) => { a.zones[1].rooms.push('t1.bay'); },
  kind: (a) => { a.fixtures[0].kind = 'hammock'; },
  overlap: (a) => { a.fixtures[1].x = a.fixtures[0].x + 0.5; },
  'in-room': (a) => { a.fixtures[0].room = 't1.office'; },
  spawn: (a) => { a.spawn = { x: 20.625, z: 9.075, face: 'right' }; },
};
// (on Echo's ground floor, or the floor ECHO_BREAK_ON names: each new rule broken once)
const fixtureOf = (a, id) => a.fixtures.find(f => f.id === id);
const ECHO_BREAK_ON = { 'stair-top': ECHO_2 };
const ECHO_BREAKS = {
  'no-seed': (a) => { a.rooms[0].seed = 48213; },
  portal: (a) => { a.portals.find(p => p.id === 'l:echo:stair-e').to.z = 15.0; },          // (0.3 m from floor 2's band back, not 0.6)
  'arrive-face': (a) => { a.portals.find(p => p.id === 'l:echo:stair-e').to.face = 'up'; }, // (arriving upstairs turned back to the well)
  'stair-top': (a) => { fixtureOf(a, 'f:e2:stair-e:flight').face = 'down'; },              // (on floor 2: the open top turned to the north, v0.0.4's picture, the band still at the south)
  'stair-foot': (a) => { a.portals.find(p => p.id === 'l:echo:stair-e').band.at = 11.0; },  // (the band moved to the foot: the floor changes as one steps on, the user's v0.0.5 report)
  link: (a) => { fixtureOf(a, 'f:e1:stair-e:flight').x += 0.4; },
  decor: (a) => { a.look.decor[0].x = 90; },
  'exit-sign': (a) => { a.fixtures = a.fixtures.filter(f => f.id !== 'f:e1:vestibule:sign-1'); },
  seeds: (a) => { a.fixtures.filter(f => f.kind === 'rack2').forEach((f, i) => { f.seed = 100 + i; }); },
  heads: (a) => { a.fixtures = a.fixtures.filter(f => !(f.room === 'e1.head-2a' && f.kind === 'showerStall')); },
  berths: (a) => { fixtureOf(a, 'f:e1:bay-2-1:rack-n1').berths = ['ft2-r', 'ft2-r']; },
};
const GROUND_BREAKS = {
  ids: (g) => { g.fixtures[0].id = 'lamp 1'; },
  unique: (g) => { g.fixtures[1].id = g.fixtures[0].id; },
  'no-seed': (g) => { g.seed = 48213; },
  door: (g) => { g.massing.find(m => m.id === 'b:mess').doors[0].z += 3; },
  reveal: (g) => { g.nav.leaves.find(l => l.id === 'o:e1:front').rect.z0 += 0.4; },
  portal: (g) => { g.portals[0].to.z = 23.5; },                                            // (0.2 m inside the floor's band back)
  'door-sign': (g) => { g.fixtures = g.fixtures.filter(f => f.id !== 'f:melas:echo:sign-front'); },
  fixture: (g) => { g.fixtures.push({ id: 'f:melas:bin-9', kind: 'bin', make: 'bin', x: 522, z: 214.4, face: 'down', seed: 3 }); },
  gate: (g) => { g.gates[0].x = 30; },
  lamps: (g) => { for (let i = 0; i < LAMPS_MAX; i++) g.look.lamps.push({ kind: 'street', x: 500, z: 300, y: 4 }); },
  seeds: (g) => { g.fixtures.filter(f => f.kind === 'lampPost').forEach((f, i) => { f.seed = 10 + i; }); },
};
const PLAN_BREAKS = {
  ids: (p) => { p.buildings[0].id = 'b:Echo Company'; },
  unique: (p) => { p.waypoints[1].id = p.waypoints[0].id; },
  ring: (p) => { const b = p.buildings.find(x => x.id === 'b:hq'); b.rects = [[800, 182, 860, 214]]; },
  apart: (p) => { const b = p.buildings.find(x => x.id === 'b:fox'); b.rects = b.rects.map(r => [r[0] - 15, r[1], r[2] - 15, r[3]]); },
  door: (p) => { p.buildings.find(x => x.id === 'b:mess').doors[0].z += 3; },
  road: (p) => { p.buildings.find(x => x.id === 'b:visitor').rects = [[20, 392, 44, 412]]; },
  gate: (p) => { p.gates[0].x = 30; },
  edge: (p) => { p.edges.push({ a: 'w:echo:front', b: 'w:nowhere', via: [] }); },
  joined: (p) => { p.waypoints.push({ id: 'w:lost', x: 900, z: 650, kind: 'junction' }); },
  daily: (p) => { p.waypoints.push({ id: 'w:island', x: 300, z: 300, kind: 'junction' }); p.daily.places.mess = 'w:island'; },
};

// The 1st Squad's berths, the build sheet 0.0.3 §2.1's table as built (area frame): the south row at z
// 6.495, not the sheet's 6.575, because the bay's south wall is an inner wall astride z 7.6 (0.08 m into
// the bay); the squad leader's single along the east wall facing down at 59.945, 1.325 (the sheet's
// "about 60.0, 1.4, left": a rack facing left would run 2.05 m east–west, more than the corner's 1.65).
const BERTH_TABLE = [
  ['rack-n0', 'rack2', 49.625, 1.325, 'down', ['ft2-tl', 'ft2-ar']], ['rack-n1', 'rack2', 52.075, 1.325, 'down', ['ft2-r', 'ft2-aar']],
  ['rack-n2', 'rack2', 54.525, 1.325, 'down', ['ft1-tl', 'ft1-ar']], ['rack-n3', 'rack2', 56.975, 1.325, 'down', ['ft1-aar', 'ft1-r']],
  ['rack-s0', 'rack2', 49.625, 6.495, 'up', ['ft3-tl', 'ft3-ar']], ['rack-s1', 'rack2', 52.075, 6.495, 'up', ['ft3-aar', 'ft3-r']],
  ['rack-s2', 'rack2', 54.525, 6.495, 'up', [null, null]], ['rack-sl', 'rack1', 59.945, 1.325, 'down', ['sl']],
];

export default [
  {
    name: 'the test rooms keep every rule of PLACES §9.6, and each rule fails on a sample made to break it',
    fn() {
      const res = validateArea(TEST_AREA);
      console.log(`      ${res.counts.rooms} rooms, ${res.counts.openings} openings, ${res.counts.fixtures} fixtures, ${res.counts.zones} zones; checks: ${[...AREA_RULES, 'no-seed', 'decor', 'seeds'].map(r => `${r} ${res.counts[r] ?? 0}`).join(', ')}`);
      assert(res.ok, JSON.stringify(res.problems));
      const caught = [];
      for (const rule of AREA_RULES) {
        const a = copy(TEST_AREA);
        AREA_BREAKS[rule](a);
        const got = rulesOf(validateArea(a));
        caught.push(`${rule}: ${got.join('+') || 'none'}`);
        assert(got.includes(rule), `breaking '${rule}' was not caught: ${got.join(', ')}`);
      }
      console.log(`      broken on purpose (each rule, then what fired): ${caught.join('; ')}`);
      console.log(`      a door's clear zone ${DOOR_CLEAR_M} m either side`);
    },
  },
  {
    name: 'Echo Company\'s two floors keep every rule (PLACES §9.6 and the sheet\'s: portals, links, decor, exit signs, seeds, heads, berths), and each new rule fails on a sample made to break it',
    fn() {
      for (const a of [ECHO_1, ECHO_2]) {
        const res = validateArea(a), c = res.counts, kinds = {};
        for (const f of a.fixtures) kinds[f.kind] = (kinds[f.kind] ?? 0) + 1;
        console.log(`      ${a.id}: ${c.rooms} rooms, ${c.openings} openings, ${c.fixtures} fixtures, ${c.zones} zones, ${c.portals} portals, ${c.links} links, ${c.lamps} lamps`);
        console.log(`        checks: ${[...AREA_RULES, ...ECHO_RULES].map(r => `${r} ${c[r] ?? 0}`).join(', ')}`);
        console.log(`        fixtures by kind: ${Object.entries(kinds).sort((p, q) => q[1] - p[1]).map(([k, n]) => `${k} ${n}`).join(', ')}`);
        assert(res.ok, JSON.stringify(res.problems.slice(0, 6)));
      }
      const caught = [];
      for (const rule of ECHO_RULES) {
        const a = copy(ECHO_BREAK_ON[rule] ?? ECHO_1);
        ECHO_BREAKS[rule](a);
        const got = rulesOf(validateArea(a));
        caught.push(`${rule}: ${got.join('+') || 'none'}`);
        assert(got.includes(rule), `breaking '${rule}' was not caught: ${got.join(', ')}`);
      }
      console.log(`      broken on purpose: ${caught.join('; ')}`);
      console.log(`      an exit sign within ${EXIT_SIGN_M} m of every portal's band; at most ${SEEDS_PER_KIND} look seeds a kind`);
    },
  },
  {
    name: 'the 1st Squad\'s berths are the sheet\'s §2.1 table (the player in rack n1\'s lower berth), every squad bay has its 15 berths, and berthOf, seatOf and the fire watch\'s post read them from data alone',
    fn() {
      const off = [];
      for (const [name, kind, x, z, face, berths] of BERTH_TABLE) {
        const f = ECHO_1.fixtures.find(q => q.id === `f:e1:bay-2-1:${name}`);
        if (!f || f.kind !== kind || Math.abs(f.x - x) > 1e-6 || Math.abs(f.z - z) > 1e-6 || f.face !== face || JSON.stringify(f.berths) !== JSON.stringify(berths)) off.push(`${name}: ${JSON.stringify(f && { kind: f.kind, x: f.x, z: f.z, face: f.face, berths: f.berths })}`);
      }
      const me = berthOf('2/4-E-2-1', 'ft2-r'), seat = seatOf(me), post = seatOf('f:e1:bay-2-1:stool-1#1');
      const bays = [ECHO_1, ECHO_2].flatMap(a => a.rooms.filter(r => r.kind === 'squadBay').map(r => ({ a, r })));
      const counts = bays.map(({ a, r }) => `${r.id.split('.')[1]} ${r.layout} ${a.fixtures.filter(f => f.room === r.id && f.berths).reduce((n, f) => n + f.berths.length, 0)}`);
      console.log(`      bay-2-1 (layout A): ${BERTH_TABLE.map(([n, , x, z, f, b]) => `${n} (${x}, ${z}) ${f} ${b.map(v => v ?? 'spare').join('/')}`).join('; ')}`);
      console.log(`      the player's berth ${me}: (${seat.x}, ${seat.z}) y ${seat.y}, head ${seat.head}, locker ${seat.lockerId}, footlocker ${seat.footlockerId}`);
      console.log(`      the fire watch's post: ${post.id} at (${post.x}, ${post.z}) y ${post.y}`);
      console.log(`      berths by bay: ${counts.join(', ')}`);
      assert(!off.length, off.join('\n'));
      assert(me === 'f:e1:bay-2-1:rack-n1#2' && seat.y === 0.45 && seat.head === 'n' && seat.lockerId === 'f:e1:bay-2-1:locker-n1a', JSON.stringify(seat));
      assert(bays.length === 12 && counts.every(c => c.endsWith(' 15')), counts.join(', '));
    },
  },
  {
    name: 'Base Melas\'s ground keeps every rule (the masses\' doors and reveals, portals, a plate by every door into a building, fixtures, gates, lamps, seeds), and each rule fails on a sample made to break it',
    fn() {
      const res = validateGround(GROUND_AREA), c = res.counts;
      const lampKinds = {};
      for (const l of GROUND_AREA.look.lamps) lampKinds[l.kind] = (lampKinds[l.kind] ?? 0) + 1;
      console.log(`      ${GROUND_AREA.id}: ${c.masses} masses (${GROUND_AREA.massing.filter(m => m.open).length} open), ${c.doors} doors, ${c.surfaces} surfaces, ${c.fixtures} fixtures, ${c.lamps} lamps (${Object.entries(lampKinds).map(([k, n]) => `${k} ${n}`).join(', ')}), ${c.portals} portals, ${c.gates} gates, the drawn ground ${JSON.stringify(GROUND_AREA.boundsM)}`);
      console.log(`        checks: ${GROUND_RULES.map(r => `${r} ${c[r] ?? 0}`).join(', ')}`);
      assert(res.ok, JSON.stringify(res.problems.slice(0, 6)));
      const caught = [];
      for (const rule of GROUND_RULES) {
        const g = copy(GROUND_AREA);
        GROUND_BREAKS[rule](g);
        const got = rulesOf(validateGround(g));
        caught.push(`${rule}: ${got.join('+') || 'none'}`);
        assert(got.includes(rule), `breaking '${rule}' was not caught: ${got.join(', ')}`);
      }
      console.log(`      broken on purpose: ${caught.join('; ')}`);
    },
  },
  {
    name: 'no place holds a seed: no area or room record carries one, and a new game\'s places.sites hold only their template (the user, 2026-11-05: "game world is handcrafted")',
    fn() {
      const records = [TEST_AREA, ECHO_1, ECHO_2, GROUND_AREA, WHEEL_S4];
      const seeded = records.flatMap(a => [a, ...a.rooms].filter(r => 'seed' in r || 'siteSeed' in r || 'dressSeed' in r).map(r => r.id));
      const sandbox = createGame({ scenario: 'sandbox', seed: 48213 }), melas = melasGame(createGame, { seed: 48213 });
      const sites = [sandbox, melas].map(g => g.state.places.sites);
      console.log(`      area and room records with a seed: ${seeded.length ? seeded.join(', ') : 'none'}; the ground's look seed ${GROUND_AREA.look.seed} (an authored constant)`);
      console.log(`      a new sandbox's places.sites ${JSON.stringify(sites[0])}; a game in Echo's bay (${melas.state.meta.scenario}) ${JSON.stringify(sites[1])}`);
      assert(!seeded.length, seeded.join(', '));
      for (const s of sites) for (const [id, rec] of Object.entries(s)) assert(!('seed' in rec) && Object.keys(rec).every(k => k === 'template' || k === 'openings'), `${id}: ${JSON.stringify(rec)}`);
      // (a v0.0.2 save, its site's seed in it, loses the seed on load (places:no-site-seed) and plays on; a fresh save loads unchanged)
      const old = createGame({ scenario: 'sandbox', seed: 48213 });
      old.state.places.sites.test.seed = 2843217;
      const json = old.save(), fresh = sandbox.save();
      old.load(json);
      old.step(40, { mx: 1 });
      sandbox.load(fresh);
      console.log(`      a v0.0.2 save's ${JSON.stringify(JSON.parse(json).places.sites)} loads as ${JSON.stringify(old.state.places.sites)}, flags ${JSON.stringify(old.state.flags)}, and walks on (${old.errors.length} errors); a fresh save loads unchanged: ${sandbox.save() === fresh}`);
      assert(!('seed' in old.state.places.sites.test) && old.state.flags['mig:no-site-seed'] === true && !old.errors.length, JSON.stringify(old.state.places.sites));
      assert(sandbox.save() === fresh && !('mig:no-site-seed' in (sandbox.state.flags ?? {})), 'a fresh save moved on load');
    },
  },
  {
    name: 'the catalogue\'s sizes are the kit\'s FOOTPRINTS (what is drawn is what blocks)',
    fn() {
      const missing = KINDS.filter(k => !FOOTPRINTS[k]);
      const off = KINDS.filter(k => { const f = FOOTPRINTS[k], c = CATALOGUE[k]; return f && (f.w !== c.w || f.d !== c.d || f.h !== c.h); });
      const open = KINDS.filter(k => !CATALOGUE[k].block);
      console.log(`      ${KINDS.length} core kinds, ${KINDS.length - off.length - missing.length} equal to FOOTPRINTS${missing.length ? `, not yet in the kit: ${missing.join(', ')}` : ''}; not blocking: ${open.join(', ')}; spots ${KINDS.reduce((n, k) => n + CATALOGUE[k].spots.length, 0)}, seats ${KINDS.reduce((n, k) => n + CATALOGUE[k].seats.length, 0)}`);
      assert(!off.length, off.map(k => `${k}: catalogue ${JSON.stringify(CATALOGUE[k])} kit ${JSON.stringify(FOOTPRINTS[k])}`).join('\n'));
      assert(!missing.length, `the kit lacks ${missing.join(', ')} (the stage's §2.3)`);
      assert(open.join() === 'chair,stool,board,sign,window,emergencyLight,wallClock,stairs', open.join());
    },
  },
  {
    name: 'the test rooms, Echo\'s two floors, the ground and Echo\'s ground floor\'s C0 grid are pinned by goldens',
    fn() {
      const grid = buildGrid(TEST_AREA, 'C0'), e1 = buildGrid(ECHO_1, 'C0', { closed: (o) => o.state === 'closed' });
      const a = golden('places: TEST_AREA', TEST_AREA, '1b598ff4fcfa65');
      const g = golden('places: TEST_AREA C0 grid bytes', grid.cost, '189fefcff571bf');
      const b = golden('places: ECHO_1', ECHO_1, '16a0991afd36f2');   // (0.0.6 re-set from 0784d8b14248b8, by way of 1bfaeadda3e1a7: the doors' openS and closeS 0.4 s and 0.6 s (were 1.0 and 1.2); each flight's open side, the stair rooms' extinguishers moved to the east wall and a night light over each stair, the bands up 0.3 m north and the arrivals down with them; 0.0.5's from 11196730cf23f2: the floor's floorName, 'ground floor'; 0.0.4's from 08f56e69dfa150: a drinking fountain in each wing's hall)
      const c = golden('places: ECHO_2', ECHO_2, '0d9c4e955d0e04');   // (0.0.6 re-set from 1127fea3c6e702, by way of 1475eb634db564: the doors' openS and closeS 0.4 s and 0.6 s; the stair rooms' extinguishers moved to the east wall, a night light over each well, the arrivals down 0.3 m north; 0.0.5's from 0beba02edd957f: floorName 'upper floor', and its name 'first floor' became 'upper floor'; 0.0.4's from 1afda0fc95253b: the fountains)
      const d = golden('places: GROUND_AREA', GROUND_AREA, '1682873bc5491e');   // (0.0.8, merged, re-set on purpose from test-pairs' 15e07adedbca73 and the follow-up's 1ee90ae625b30c: test-pairs' pad and turners with the follow-up's flags and stakes; 0.0.8's follow-up re-set from 199368af298f72: on purpose, the KD's middle flags a row of four 18 m downrange of each line (f:kd:wind-m1118-340 to m1418-355, m1310 and m1410 gone: the sock verifier's), and the 25 m bay's lane stakes the KD's kind on their own rows 2 m behind their points, no longer nav blockers (the tower verifier's); 0.0.7's tower fixer re-set from 0db1458f268269: each KD point's stake on its own row, 2 m behind its fp (it was 1.6 m behind and 1.2 m south: the user's "did call me line 5 when I'm line 10", 2026-11-07); 0.0.7's fixer re-set from 0bd09616d76961: the middle row of wind flags, z 345; 0.0.7 re-set from 03f5d7ec1b64b8: the KD's lines, pits, berm, flags, shack, canopy, rope (in runs of at most 30 m, the integrator's) and pads, its walked rects, the carriers drawn under their faces; 0.0.6 re-set from 0620249a3a1ee1: the PX barber's pole on its stand, f:melas:px:barber; 0.0.5 re-set from 000d6d7a726622: the ground grew over X3, the KD range's 25 m bay and its tower; 0.0.3's fixer set that from 131d1b63b7f5b2)
      const e = golden('places: ECHO_1 C0 grid bytes', e1.cost, '0e95501282079e');   // (0.0.6 re-set from 1201fe98a1ceda: the flights' rails, their closed tops and the rails across their feet, the extinguishers moved; 0.0.4's from 14b1247ac344b4: the fountains' footprints)
      console.log(`      TEST_AREA ${a}; its C0 grid (${grid.nx} × ${grid.nz}) ${g}`);
      console.log(`      ECHO_1 ${b}, ECHO_2 ${c}, GROUND_AREA ${d}; ECHO_1's C0 grid (${e1.nx} × ${e1.nz}, its doors as the template has them) ${e}`);
    },
  },
  {
    name: 'Base Melas\'s site plan keeps every rule (as written and compacted), each rule fails on a sample made to break it, and the daily places lie within reach of Echo\'s door',
    fn() {
      for (const plan of [MELAS_PLAN_AS_WRITTEN, MELAS_PLAN]) {
        const res = validatePlan(plan), c = res.counts;
        console.log(`      ${plan.id} (${plan.template}): ${c.buildings} buildings, ${c.doors} doors, ${c.waypoints} waypoints, ${c.edges} edges, ${c.roads} roads, ${c.paths} paths, ${c.gates} gates, ${c.zones} zones`);
        console.log(`        checks: ${PLAN_RULES.map(r => `${r} ${c[r] ?? 0}`).join(', ')}; buildings ${MIN_GAP_M} m apart or more`);
        console.log(`        from Echo's door by route (PLACES §4.1's ${plan.daily.warnM} m): ${Object.entries(res.daily).map(([k, v]) => `${k} ${fmt(v.lengthM, 1)} m${v.lengthM > plan.daily.warnM ? ' (over: a warning)' : ''}`).join(', ')}`);
        assert(res.ok, JSON.stringify(res.problems.slice(0, 5)));
        assert(Object.keys(res.daily).length === 5, JSON.stringify(res.daily));
      }
      console.log(`      the compaction: ${MELAS_COMPACTION.map(m => `${m.id} (${m.from}) → (${m.to})`).join('; ')}`);
      const caught = [];
      for (const rule of PLAN_RULES) {
        const p = copy(MELAS_PLAN);
        PLAN_BREAKS[rule](p);
        const got = rulesOf(validatePlan(p));
        caught.push(`${rule}: ${got.join('+') || 'none'}`);
        assert(got.includes(rule), `breaking '${rule}' was not caught: ${got.join(', ')}`);
      }
      console.log(`      broken on purpose: ${caught.join('; ')}`);
    },
  },
  {
    name: 'Base Melas\'s site plan is pinned by goldens',
    fn() {
      const p = golden('places: MELAS_PLAN', MELAS_PLAN, '0fa77d16885ab8');   // (0.0.7 re-set from 07d03f4ca4f3c7: the KD's line zones, melas.kd-line-200, 300 and 500; 0.0.5 re-set from 0f9ae504ac4dbc: the 25 m bay's zone, melas.kd-25)
      const w = golden('places: MELAS_PLAN_AS_WRITTEN', MELAS_PLAN_AS_WRITTEN, '0e823a645338ed');   // (0.0.7 re-set from 05d1dbf22c101d: the KD's line zones; 0.0.5 re-set from 140c63b80bc327: the same zone)
      console.log(`      MELAS_PLAN ${p}; MELAS_PLAN_AS_WRITTEN ${w}`);
    },
  },
  {
    name: 'the KD range\'s 25 m bay and its tower stand at their final place on X3 (PLACES §4.12, the build sheet 0.0.5 §2.3): lanes, boxes, coaches and cards where the sheet puts them, every piece in the ground drawn and in X3, none in another, their kinds the kit\'s',
    fn() {
      const bay = KD_RANGE.bay, lanes = bay.lanes, W = bay.walk, X3 = [1060, 280, 1640, 420], inR = (r, q) => r.x0 >= q[0] - 1e-9 && r.z0 >= q[1] - 1e-9 && r.x1 <= q[2] + 1e-9 && r.z1 <= q[3] + 1e-9;
      const inWalk = (p) => p.x > W[0] && p.x < W[2] && p.z > W[1] && p.z < W[3];
      console.log(`      ${lanes.length} lanes on the line at x ${bay.lineX}, cards at x ${bay.targetX} (${bay.targetX - bay.lineX} m), z ${lanes.map(l => l.fp.z).join(', ')}; the berm ${JSON.stringify(bay.berm)}; the walk ${JSON.stringify(W)}`);
      console.log(`      the tower ${JSON.stringify(KD_RANGE.tower.rect)}, ${KD_RANGE.tower.heightM} m, its deck at ${KD_RANGE.tower.deckY} m, the RO at (${KD_RANGE.tower.ro.x}, ${KD_RANGE.tower.ro.z}) facing ${KD_RANGE.tower.ro.face}, its flag at (${KD_RANGE.tower.flag.x}, ${KD_RANGE.tower.flag.z}); the line's flags ${LINE_FLAGS.map(f => `(${f.x}, ${f.z})`).join(', ')}`);
      assert(lanes.length === 6 && lanes.every((l, i) => l.lane === i + 1 && l.fp.x === 1100 && Math.abs(l.fp.z - (283.5 + 3 * i)) < 1e-9 && l.target.x === 1125 && l.target.z === l.fp.z && l.target.centreY === 0.6), 'the lanes as the sheet gives them');
      for (const l of lanes) {
        assert(inWalk(l.fp) && inWalk(l.coach), `lane ${l.lane}: its firing point and its coach inside the walk`);
        assert(Math.abs(l.box[0] - (l.fp.x - 1.4)) < 1e-9 && Math.abs(l.box[2] - (l.fp.x + 2.2)) < 1e-9 && Math.abs(l.box[3] - l.box[1] - 2) < 1e-9, `lane ${l.lane}'s box`);
        assert(l.fixtures.fp === `f:kd:fp25-${l.lane}` && l.fixtures.target === `f:kd:t25-${l.lane}` && RANGE_PIECES.some(p => p.id === l.fixtures.fp) && RANGE_PIECES.some(p => p.id === l.fixtures.target), `lane ${l.lane}'s pieces`);
      }
      const t = KD_RANGE.tower, tr = { x0: t.rect[0], z0: t.rect[1], x1: t.rect[2], z1: t.rect[3] };
      assert(JSON.stringify(t.rect) === JSON.stringify(TOWER.rect) && t.ro.x === 1080 && t.ro.z === 296 && t.heightM === 9 && t.deckY === 6, 'the tower at (1,080, 296), 9 m, the deck at 6.0');
      assert(t.flag.x > tr.x0 && t.flag.x < tr.x1 && t.flag.z > tr.z0 && t.flag.z < tr.z1, 'the flag on the tower');
      // (every piece: in the ground drawn and in X3; blocking ones apart, but the fence, the rope and the berm, which meet)
      const drawn = GROUND_AREA.drawnM, rects = RANGE_PIECES.map(p => ({ p, r: pieceRect(p) }));
      for (const { p, r } of rects) {
        assert(drawn.some(d => inR(r, [d.x0, d.z0, d.x1, d.z1])) && inR(r, X3), `${p.id} ${JSON.stringify(r)} outside the ground drawn or X3`);
        const k = RANGE_KINDS[p.kind], f = FOOTPRINTS[p.kind];
        assert(f && k && f.w === k.w && f.d === k.d && f.h === k.h && f.makes.includes(p.make), `${p.id}: the kit's ${p.kind} (${JSON.stringify(f)}) is the range's (${JSON.stringify(k)}) and has its make ${p.make}`);
      }
      const joins = new Set(['berm', 'rangeFence']), clash = [];
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        if (!a.p.block || !b.p.block || (joins.has(a.p.kind) && joins.has(b.p.kind))) continue;
        if (a.r.x0 < b.r.x1 && b.r.x0 < a.r.x1 && a.r.z0 < b.r.z1 && b.r.z0 < a.r.z1) clash.push(`${a.p.id} × ${b.p.id}`);
      }
      const kinds = {};
      for (const p of RANGE_PIECES) kinds[p.kind] = (kinds[p.kind] ?? 0) + 1;
      console.log(`      ${RANGE_PIECES.length} pieces (${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ')}), all in the ground drawn ${JSON.stringify(drawn.map(d => [d.x0, d.z0, d.x1, d.z1]))} and X3; ${GROUND_AREA.nav.blockers.filter(b => String(b.tag).startsWith('f:kd:')).length} of the nav's blockers theirs; overlaps ${clash.length ? clash.join(', ') : 'none'}`);
      assert(!clash.length, clash.join(', '));
      // (0.0.7: and the KD's lanes and its pits after them)
      const KW = KD_RANGE.kd.walk, PW = KD_RANGE.kd.pits.walk, R4 = (q) => JSON.stringify({ x0: q[0], z0: q[1], x1: q[2], z1: q[3] });
      assert(GROUND_AREA.walksM.length === 4 && JSON.stringify(GROUND_AREA.walksM[1]) === R4(W) && JSON.stringify(GROUND_AREA.walksM[2]) === R4(KW) && JSON.stringify(GROUND_AREA.walksM[3]) === R4(PW)
        && JSON.stringify(GROUND_AREA.walkM) === JSON.stringify({ x0: 0, z0: 0, x1: 1000, z1: 700 }), 'the walked rects: Main Side, the bay, the KD\'s lanes and its pits');
      assert(GROUND_AREA.zones.some(z => z.id === KD_RANGE.zone), 'the bay\'s zone on the ground');
    },
  },
  {
    name: 'every lane\'s firing point and coach\'s place on the 25 m line are reached from every other on the ground\'s C0 grid, and the bay is closed: nothing outside its fence, rope and berm is reached (the gates stay shut: the scene starts on the line)',
    fn() {
      const st = createGame({ scenario: 'sandbox', seed: 48213 }).state;
      // (the window of chunks round the bay, its cells joined into one grid and flooded from lane 1's firing point)
      const i0 = Math.floor(1060 / CHUNK_M), i1 = Math.floor(1150 / CHUNK_M), j0 = Math.floor(270 / CHUNK_M), j1 = Math.floor(310 / CHUNK_M);
      const grids = new Map();
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) grids.set(`${i},${j}`, chunkGrid(st, GROUND_AREA, i, j, 'C0'));
      const free = (x, z) => { const g = grids.get(`${Math.floor(x / CHUNK_M)},${Math.floor(z / CHUNK_M)}`); if (!g) return false; const c = cellOf(g, x, z); return c >= 0 && g.cost[c] !== 255; };
      const key = (x, z) => `${Math.round(x / CELL_M)},${Math.round(z / CELL_M)}`, seen = new Set(), start = KD_RANGE.bay.lanes[0].fp;
      const snapC = (v) => (Math.floor(v / CELL_M) + 0.5) * CELL_M;
      const todo = [[snapC(start.x), snapC(start.z)]];
      seen.add(key(...todo[0]));
      let leak = null;
      while (todo.length) {
        const [x, z] = todo.pop();
        if (x < i0 * CHUNK_M + 1 || x > (i1 + 1) * CHUNK_M - 1 || z < j0 * CHUNK_M + 1 || z > (j1 + 1) * CHUNK_M - 1) { leak = [x, z]; break; }
        for (const [dx, dz] of [[CELL_M, 0], [-CELL_M, 0], [0, CELL_M], [0, -CELL_M]]) {
          const nx = x + dx, nz = z + dz, k = key(nx, nz);
          if (seen.has(k) || !free(nx, nz)) continue;
          seen.add(k); todo.push([nx, nz]);
        }
      }
      const reached = (p) => seen.has(key(snapC(p.x), snapC(p.z)));
      const spots = KD_RANGE.bay.lanes.flatMap(l => [{ what: `lane ${l.lane}'s firing point`, ...l.fp }, { what: `lane ${l.lane}'s coach`, x: l.coach.x, z: l.coach.z }]);
      const missed = spots.filter(p => !reached(p)).map(p => p.what);
      const outside = [{ x: 1092, z: 303 }, { x: 1083, z: 290 }, { x: 1137, z: 290 }, { x: 1110, z: 278 }, { x: 1080, z: 299.5 }].filter(reached);
      console.log(`      the bay flooded from lane 1's firing point: ${seen.size} cells of ${CELL_M} m (${(seen.size * CELL_M * CELL_M).toFixed(0)} m²); ${spots.length - missed.length} of ${spots.length} firing points and coaches reached; outside the bay reached: ${outside.length ? JSON.stringify(outside) : 'none'}; ${leak ? `it leaked out at ${leak}` : 'closed'}`);
      assert(!missed.length, `not reached: ${missed.join(', ')}`);
      assert(!leak && !outside.length, `the bay is open: ${JSON.stringify(leak ?? outside)}`);
      assert(seen.size * CELL_M * CELL_M > 600 && seen.size * CELL_M * CELL_M < 1000, `the bay's walkable ground ${seen.size * CELL_M * CELL_M} m²`);
    },
  },
  {
    name: 'the KD ground in full stands at its final place (PLACES §4.12, the build sheet 0.0.7 §2.3): twenty lanes 5 m apart on the 200, 300 and 500 m lines, each point with its box and its coach, the faces on their carriers at 1,600 m east, the pits behind the parapet, the berm, the flags every 100 m on both sides, a row of four 18 m downrange of each line and two more down the middle',
    fn() {
      const K = KD_RANGE.kd, lines = [200, 300, 500];
      console.log(`      ${K.lanes.length} lanes at z ${K.lanes[0].z} to ${K.lanes.at(-1).z} (${K.laneGap} m); the lines ${lines.map(d => `${d} m at x ${K.lines[d].x} (${K.targetX - K.lines[d].x} m to the faces)`).join(', ')}; the ready line at x ${K.readyX}`);
      console.log(`      the pits x ${K.pits.x0} to ${K.pits.x1}, floor ${K.pits.floorY} m, the parapet ${JSON.stringify(K.pits.parapet)}, the pits' walk ${JSON.stringify(K.pits.walk)}; the berm ${JSON.stringify(K.berm.rect)} ${K.berm.heightM} m; ${K.flags.length} flags (${K.flags.map(f => `${f.x}/${f.z}`).join(', ')}); the ammunition point ${JSON.stringify(K.ammo)}; the walk ${JSON.stringify(K.walk)}`);
      assert(K.lanes.length === 20 && K.lanes.every((L, i) => L.lane === i + 1 && Math.abs(L.z - (302.5 + 5 * i)) < 1e-9 && L.face.x === 1600 && L.carrier.x === 1603.5), 'the lanes');
      for (const d of lines) assert(K.targetX - K.lines[d].x === d, `the ${d} m line at ${d} m from the faces`);
      for (const L of K.lanes) for (const d of lines) {
        const P = L.points[d];
        assert(P.fp.x === K.lines[d].x && P.fp.z === L.z && Math.abs(P.box[0] - (P.fp.x - 1.4)) < 1e-9 && Math.abs(P.box[2] - (P.fp.x + 2.2)) < 1e-9 && P.coach.x === P.fp.x - 0.9 && Math.abs(P.coach.z - (P.fp.z - 1.4)) < 1e-9, `lane ${L.lane} at ${d} m`);
        assert(RANGE_PIECES.some(p => p.id === L.fixtures.fp[d] && p.kind === 'kdPoint' && p.look.text === String(L.lane)), `lane ${L.lane}'s stake at ${d} m`);
      }
      // (and the middle flags: on each line a row 18 m downrange, one between each pair of the relay's lanes 8 to 12 (z 340 to
      // 355), so the flag on your lane's south side stands clear in the picture as played (the sock verifier's, 0.0.8); one
      // 10 m downrange of the 100 m mark and one 5 m short of the parapet, in the far window (the design review's of v0.0.7);
      // none stands on a lane's row, in its line of fire)
      const mid = K.flags.filter(f => f.z > 320 && f.z < 380), rowZ = [340, 345, 350, 355];
      const rows = [500, 300, 200].map(d => mid.filter(f => f.x - K.lines[d].x === KD_FLAG_AHEAD_M).map(f => f.z).sort((a, b) => a - b).join(','));
      console.log(`      the middle flags: ${rows.map((r, i) => `${[500, 300, 200][i]} m line ${KD_FLAG_AHEAD_M} m downrange at z ${r}`).join('; ')}; ${mid.filter(f => f.x % 100 !== KD_FLAG_AHEAD_M).map(f => `${f.x}/${f.z}`).join(', ')}`);
      assert(K.flags.length === 26 && K.flags.every(f => f.z === 299 || f.z === 401 || mid.includes(f)) && mid.length === 14 && mid.every(f => f.x < K.pits.parapet.x0 && !K.lanes.some(L => L.z === f.z)) && rows.every(r => r === rowZ.join(',')) && mid.filter(f => f.z === 345 && f.x % 100 === 10 || f.x === 1595).length === 2, 'the flags on both sides and down the middle');
      assert(K.pits.parapet.x0 === 1597 && K.pits.parapet.x1 === 1600 && K.berm.rect[0] === 1612 && K.berm.heightM === 8, 'the pits and the berm');
    },
  },
  {
    name: 'every point of every KD line and every coach\'s place is reached from the ready line on the ground\'s C0 grid, the pits are walked along their length, and the lanes are closed: nothing past the rope or the parapet reached, the gates still shut',
    fn() {
      const st = createGame({ scenario: 'sandbox', seed: 48213 }).state, K = KD_RANGE.kd;
      const grids = new Map(), grid = (x, z) => { const k = `${Math.floor(x / CHUNK_M)},${Math.floor(z / CHUNK_M)}`; if (!grids.has(k)) grids.set(k, chunkGrid(st, GROUND_AREA, Math.floor(x / CHUNK_M), Math.floor(z / CHUNK_M), 'C0')); return grids.get(k); };
      const free = (x, z) => { const g = grid(x, z); const c = cellOf(g, x, z); return c >= 0 && g.cost[c] !== 255; };
      const snapC = (v) => (Math.floor(v / CELL_M) + 0.5) * CELL_M, key = (x, z) => `${Math.round(x / CELL_M)},${Math.round(z / CELL_M)}`;
      const flood = (sx, sz, box) => {
        const seen = new Set(), todo = [[snapC(sx), snapC(sz)]];
        seen.add(key(...todo[0]));
        let leak = null;
        while (todo.length) {
          const [x, z] = todo.pop();
          if (x < box[0] || x > box[2] || z < box[1] || z > box[3]) { leak = [x, z]; break; }
          for (const [dx, dz] of [[CELL_M, 0], [-CELL_M, 0], [0, CELL_M], [0, -CELL_M]]) {
            const nx = x + dx, nz = z + dz, k = key(nx, nz);
            if (seen.has(k) || !free(nx, nz)) continue;
            seen.add(k); todo.push([nx, nz]);
          }
        }
        return { seen, leak, reached: (p) => seen.has(key(snapC(p.x), snapC(p.z))) };
      };
      const t0 = performance.now();
      const lanes = flood(K.readyX + 1, 350, [1050, 290, 1660, 410]);
      const spots = K.lanes.flatMap(L => [200, 300, 500].flatMap(d => [{ what: `lane ${L.lane}'s ${d} m point`, ...L.points[d].fp }, { what: `lane ${L.lane}'s ${d} m coach`, x: L.points[d].coach.x, z: L.points[d].coach.z }]));
      const missed = spots.filter(p => !lanes.reached(p)).map(p => p.what);
      const outside = [{ x: 1100, z: 298.5 }, { x: 1300, z: 402 }, { x: 1058, z: 350 }, { x: 1605, z: 350 }, { x: 1620, z: 350 }].filter(lanes.reached);
      const pits = flood(1605, 350, [1595, 295, 1615, 405]), pitEnds = [{ x: 1605.5, z: 301 }, { x: 1605.5, z: 399 }, ...K.lanes.map(L => L.puller)];
      const pitMissed = pitEnds.filter(p => !pits.reached(p)), pitOut = [{ x: 1595, z: 350 }, { x: 1620, z: 350 }].filter(pits.reached);
      const gates = GROUND_AREA.gates.filter(g => g.state !== 'closed');
      console.log(`      the lanes flooded from the ready line: ${lanes.seen.size} cells (${(lanes.seen.size * CELL_M * CELL_M).toFixed(0)} m²), ${spots.length - missed.length} of ${spots.length} points and coaches reached, outside reached ${outside.length ? JSON.stringify(outside) : 'none'}, ${lanes.leak ? `leaked at ${lanes.leak}` : 'closed'}; the pits ${pits.seen.size} cells, ${pitEnds.length - pitMissed.length} of ${pitEnds.length} places reached, ${pits.leak ? `leaked at ${pits.leak}` : 'closed'}; gates open ${gates.length}; ${fmt(performance.now() - t0, 0)} ms`);
      assert(!missed.length, `not reached: ${missed.slice(0, 6).join(', ')}`);
      assert(!lanes.leak && !outside.length, `the lanes are open: ${JSON.stringify(lanes.leak ?? outside)}`);
      assert(!pitMissed.length && !pits.leak && !pitOut.length, `the pits: ${JSON.stringify({ pitMissed, leak: pits.leak, pitOut })}`);
      assert(!gates.length, `the gates stay shut: ${gates.map(g => g.id).join(', ')}`);
    },
  },
  {
    name: 'the KD range\'s bay and its pieces are pinned by goldens (melas@1\'s template: a change to them is on purpose and said)',
    fn() {
      const a = golden('places: KD_RANGE', KD_RANGE, '1bf6880e66d850');   // (0.0.8's follow-up re-set from 12a9082a867be1: on purpose, the middle flags a row of four 18 m downrange of each line; 0.0.7's fixer re-set from 148f94d9302372: the middle row of wind flags; 0.0.7 re-set from 09bbbab6c91cad: KD_RANGE.kd, the KD ground in full, its zone melas.kd-range)
      const b = golden('places: RANGE_PIECES', RANGE_PIECES, '143eb1aef84906');   // (0.0.8, merged, re-set on purpose from test-pairs' 1cc17c3caea7ac and the follow-up's 160cf3625c43d6 with test-pairs' six turner stands and painted lines f:kd:turner-1 to 6, f:kd:paint-7 and paint-10; 0.0.8's follow-up re-set from 0af442f8c66602: on purpose, the middle flags' row and the bay's lane stakes on their own rows (kdPoint, 2 m behind); 0.0.7's tower fixer re-set from 0387e9d07c1d12: the KD points' stakes on their own rows, 2 m behind; 0.0.7's fixer re-set from 06b3e5db9bdd5b: four wind sleeves down the middle, f:kd:wind-m1310 to m1595; 0.0.7 re-set from 0369e5d085a39f: the KD's pieces after the bay's, its ropes in 30 m runs, the carriers at 1,601.1)
      console.log(`      KD_RANGE ${a}; RANGE_PIECES ${b}`);
    },
  },
  {
    name: 'test-pairs\' ground on the bay stands where the build sheet 0.0.8 puts it (PLACES §4.12, COMBAT §25.10.3): the 7 m and 10 m lines painted on their pad at 7 and 10 m from the turners, each lane\'s two points with their boxes and coaches, the six turner stands 1 m in front of the frames, clear of the cards and the 25 m line; every point and coach reached from the 25 m line on the ground\'s C0 grid; pinned by a golden',
    fn() {
      const bay = KD_RANGE.bay, W = bay.walk, pad = PAIRS.pad, inWalk = (p) => p.x > W[0] && p.x < W[2] && p.z > W[1] && p.z < W[3];
      console.log(`      the turners at x ${PAIRS.turnerX} (${bay.targetX - PAIRS.turnerX} m in front of the frames), their faces ${PAIRS.face.wM} × ${PAIRS.face.hM} m centred ${PAIRS.face.centreY} m up, the stands ${JSON.stringify(PAIRS.stand)}`);
      console.log(`      the lines: 7 m at x ${PAIRS.lines[7].x}, 10 m at x ${PAIRS.lines[10].x}; the pad ${JSON.stringify(pad)} (${KD_PADS.find(p => p.id === 's:kd:pairs') ? 'a surface on the ground' : 'MISSING'}); the 25 m line at x ${bay.lineX}`);
      for (const L of PAIRS.lanes) console.log(`      lane ${L.lane} (z ${L.z}): the turner ${L.turner.fixture} at (${L.turner.x}, ${L.turner.z}); 7 m ${JSON.stringify(L.points[7].fp)} box ${JSON.stringify(L.points[7].box)} coach (${L.points[7].coach.x}, ${fmt(L.points[7].coach.z, 1)}); 10 m ${JSON.stringify(L.points[10].fp)} box ${JSON.stringify(L.points[10].box)} coach (${L.points[10].coach.x}, ${fmt(L.points[10].coach.z, 1)})`);
      assert(PAIRS.turnerX - PAIRS.lines[7].x === 7 && PAIRS.turnerX - PAIRS.lines[10].x === 10 && bay.targetX - PAIRS.turnerX === 1, 'the lines at 7 and 10 m from the turners, the turners 1 m in front of the frames');
      assert(PAIRS.lanes.length === 6 && PAIRS.lanes.every((L, i) => L.lane === i + 1 && L.z === bay.lanes[i].fp.z && L.turner.z === L.z), 'a turner on each lane\'s axis');
      for (const L of PAIRS.lanes) for (const d of [7, 10]) {
        const P = L.points[d];
        assert(P.fp.x === PAIRS.lines[d].x && P.fp.z === L.z && Math.abs(P.box[0] - (P.fp.x - 1.4)) < 1e-9 && Math.abs(P.box[2] - (P.fp.x + 2.2)) < 1e-9 && Math.abs(P.box[3] - P.box[1] - 2) < 1e-9
          && Math.abs(P.coach.x - (P.fp.x - 0.9)) < 1e-9 && Math.abs(P.coach.z - (P.fp.z - 1.4)) < 1e-9, `lane ${L.lane} at ${d} m: the point, its box, its coach`);
        assert(inWalk(P.fp) && inWalk(P.coach), `lane ${L.lane} at ${d} m inside the bay's walk`);
        assert(P.fp.x >= pad[0] && P.fp.x <= pad[2] && P.fp.z >= pad[1] && P.fp.z <= pad[3], `lane ${L.lane} at ${d} m on the pad`);
      }
      // (the stands: one a lane, facing the line, block 'see' (seen past, walked round), covering no card nor the 25 m line)
      const stands = RANGE_PIECES.filter(p => p.kind === 'kdTurner'), paint = RANGE_PIECES.filter(p => p.kind === 'kdPaint');
      assert(stands.length === 6 && stands.every(p => p.block === 'see' && p.face === 'left' && p.make === 'stand' && PAIRS.lanes.some(L => L.turner.fixture === p.id && L.turner.x === p.x && L.turner.z === p.z)), 'six stands, facing the line');
      for (const p of stands) {
        const r = pieceRect(p);
        for (const f of RANGE_PIECES.filter(q => q.kind === 'kdFrame')) { const fr = pieceRect(f); assert(!(r.x0 < fr.x1 && fr.x0 < r.x1 && r.z0 < fr.z1 && fr.z0 < r.z1), `${p.id} over ${f.id}`); }
        assert(r.x0 > bay.lineX + 2.2, `${p.id} clear of the 25 m line's boxes`);
      }
      assert(paint.length === 2 && paint.every(p => p.block === null && p.look.text === `${p.id.split('-').pop()} M` && Math.abs(p.x - PAIRS.lines[Number(p.id.split('-').pop())].x) < 1e-9), 'the two painted lines');
      console.log(`      ${stands.length} stands (${stands.map(p => { const r = pieceRect(p); return `${p.id} x ${r.x0} to ${r.x1}`; }).join(', ')}); ${paint.length} lines painted (${paint.map(p => `${p.look.text} at x ${p.x}, ${p.w ?? RANGE_KINDS.kdPaint.w} m long`).join(', ')})`);
      // (walked: from lane 1's 25 m point to every 7 m and 10 m point and coach, the stands walked round)
      const st = createGame({ scenario: 'sandbox', seed: 48213 }).state;
      const i0 = Math.floor(1080 / CHUNK_M), i1 = Math.floor(1130 / CHUNK_M), j0 = Math.floor(275 / CHUNK_M), j1 = Math.floor(305 / CHUNK_M);
      const grids = new Map();
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) grids.set(`${i},${j}`, chunkGrid(st, GROUND_AREA, i, j, 'C0'));
      const free = (x, z) => { const g = grids.get(`${Math.floor(x / CHUNK_M)},${Math.floor(z / CHUNK_M)}`); if (!g) return false; const c = cellOf(g, x, z); return c >= 0 && g.cost[c] !== 255; };
      const snapC = (v) => (Math.floor(v / CELL_M) + 0.5) * CELL_M, key = (x, z) => `${Math.round(x / CELL_M)},${Math.round(z / CELL_M)}`;
      const start = bay.lanes[0].fp, seen = new Set([key(snapC(start.x), snapC(start.z))]), todo = [[snapC(start.x), snapC(start.z)]];
      while (todo.length) {
        const [x, z] = todo.pop();
        for (const [dx, dz] of [[CELL_M, 0], [-CELL_M, 0], [0, CELL_M], [0, -CELL_M]]) {
          const nx = x + dx, nz = z + dz, k = key(nx, nz);
          if (seen.has(k) || nx < i0 * CHUNK_M || nx > (i1 + 1) * CHUNK_M || nz < j0 * CHUNK_M || nz > (j1 + 1) * CHUNK_M || !free(nx, nz)) continue;
          seen.add(k); todo.push([nx, nz]);
        }
      }
      const spots = PAIRS.lanes.flatMap(L => [7, 10].flatMap(d => [{ what: `lane ${L.lane}'s ${d} m point`, ...L.points[d].fp }, { what: `lane ${L.lane}'s ${d} m coach`, x: L.points[d].coach.x, z: L.points[d].coach.z }]));
      const missed = spots.filter(p => !seen.has(key(snapC(p.x), snapC(p.z)))).map(p => p.what);
      const onStand = stands.filter(p => seen.has(key(snapC(p.x), snapC(p.z)))).map(p => p.id);
      console.log(`      from lane 1's 25 m point: ${spots.length - missed.length} of ${spots.length} points and coaches reached; stands stood on: ${onStand.length ? onStand.join(', ') : 'none'}`);
      assert(!missed.length, `not reached: ${missed.join(', ')}`);
      assert(!onStand.length, `walked through: ${onStand.join(', ')}`);
      // (0.0.8, set on purpose: test-pairs' ground; 0.0.9, re-set on purpose: PAIRS.bang, where the coach's training bangs land)
      const g = golden('places: PAIRS', PAIRS, '0957dd557b1ff6');
      console.log(`      PAIRS ${g}`);
    },
  },
  {
    name: 'the PX barber\'s pole (0.0.6, the build sheet 0.0.6 §2.2): on its stand by the PX\'s north door, east of it and out from the wall so the camera sees it over the roof, facing north, its spot free and reached from the base\'s walks on the ground\'s C0 grid',
    fn() {
      const st = createGame({ scenario: 'sandbox', seed: 48213 }).state;
      const pole = GROUND_AREA.fixtures.find(f => f.kind === 'barberPole'), spot = spotsOf(pole)[0];
      // (a window of chunks round the pole, flooded from its spot: it must reach the window's edge, the base beyond)
      const i0 = Math.floor((spot.x - 24) / CHUNK_M), i1 = Math.floor((spot.x + 24) / CHUNK_M), j0 = Math.floor((spot.z - 24) / CHUNK_M), j1 = Math.floor((spot.z + 24) / CHUNK_M);
      const grids = new Map();
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) grids.set(`${i},${j}`, chunkGrid(st, GROUND_AREA, i, j, 'C0'));
      const free = (x, z) => { const g = grids.get(`${Math.floor(x / CHUNK_M)},${Math.floor(z / CHUNK_M)}`); if (!g) return false; const c = cellOf(g, x, z); return c >= 0 && g.cost[c] !== 255; };
      const snapC = (v) => (Math.floor(v / CELL_M) + 0.5) * CELL_M, key = (x, z) => `${Math.round(x / CELL_M)},${Math.round(z / CELL_M)}`;
      const start = [snapC(spot.x), snapC(spot.z)], seen = new Set([key(...start)]), todo = [start];
      let edge = null;
      assert(free(...start), `the pole's spot (${spot.x}, ${spot.z}) is blocked`);
      while (todo.length && !edge) {
        const [x, z] = todo.pop();
        if (Math.abs(x - spot.x) > 20 || Math.abs(z - spot.z) > 20) { edge = [x, z]; break; }
        for (const [dx, dz] of [[CELL_M, 0], [-CELL_M, 0], [0, CELL_M], [0, -CELL_M]]) {
          const nx = x + dx, nz = z + dz, k = key(nx, nz);
          if (seen.has(k) || !free(nx, nz)) continue;
          seen.add(k); todo.push([nx, nz]);
        }
      }
      console.log(`      ${pole.id} at (${pole.x}, ${pole.z}) facing ${pole.face}, ${pole.x - 292} m east of the PX's north door (292, 430); its spot ${spot.id} at (${spot.x}, ${spot.z}) facing ${spot.face}, ${spot.use}; flooded ${seen.size} cells to ${edge ? `the window's edge at (${edge.map(v => fmt(v, 1)).join(', ')})` : 'NOWHERE: enclosed'}`);
      // (the camera looks north: a point at height y and z shows at z − y, and the PX's 4 m roof from z 430 covers the picture to 426, so the tube, 1.3 to 2.1 m up, must stand north of 427.3)
      assert(pole.face === 'up' && pole.z - 1.3 < 430 - 4.0 && pole.x - 292 >= 2 && pole.x - 292 <= 3 && spot.use === 'haircut' && spot.x < pole.x && spot.z === pole.z && spot.face === 'right', JSON.stringify({ pole, spot }));
      assert(edge, 'the pole\'s spot is enclosed: not reached from the base');
    },
  },

  {
    name: 'the Wheel\'s sector 4 (PLACES §4.15, the build sheet 0.0.12 §2.1): house 1 in X4\'s layout A and its apron keep every rule of PLACES §9.6, a `deck` at 1 G of spin under no sky; every leaf records its swing, the lane\'s doors closed at the template, the closet locked; each rule fails on a sample made to break it',
    fn() {
      const res = validateArea(WHEEL_S4), c = res.counts;
      console.log(`      ${WHEEL_S4.id} (${WHEEL_S4.kind}, ${WHEEL_S4.boundsM.x1} × ${WHEEL_S4.boundsM.z1} m): ${c.rooms} rooms, ${c.openings} openings, ${c.fixtures} fixtures, ${c.zones} zones, ${c.lamps} lamps; checks: ${[...AREA_RULES, 'no-seed', 'decor', 'seeds'].map(r => `${r} ${c[r] ?? 0}`).join(', ')}`);
      for (const r of WHEEL_S4.rooms) console.log(`        ${r.id} '${r.name}' ${r.kind} [${r.rect.join(', ')}] ${fmt((r.rect[2] - r.rect[0]) * (r.rect[3] - r.rect[1]), 1)} m², ${r.floor.kind}${r.lighting ? `, lit ${r.lighting}` : ''}`);
      for (const o of WHEEL_S4.openings) console.log(`        ${o.id} ${o.kind} on ${o.axis} ${o.at} from ${o.a} to ${o.b} (${fmt(o.b - o.a, 2)} m) ${o.rooms.join(' | ')}${o.swing ? `, hinged ${o.swing.hinge} into ${o.rooms[o.swing.into]}, ${o.state}, kick DC ${o.kickDc}${o.lock ? `, locked (${o.lock.kind})` : ''}` : ''}`);
      assert(res.ok, JSON.stringify(res.problems));
      const leaves = WHEEL_S4.openings.filter(o => o.kind === 'door');
      assert(leaves.length === 5 && leaves.every(o => (o.swing?.hinge === 'a' || o.swing?.hinge === 'b') && (o.swing.into === 0 || o.swing.into === 1) && o.state === 'closed' && o.kickDc === (o.lock ? KICK_DC.locked : KICK_DC.door) && o.openS === 0.4), 'a swing, a kick and a closed leaf on every door');
      assert(leaves.filter(o => o.lock).map(o => o.id).join() === 'o:w4:closet' && WHEEL_S4.openings.find(o => o.id === 'o:w4:r2').swing.into === 0, 'the closet locked; room 2 opens outward, a pull');
      // (the place's environment: the Wheel's spin from the area's own record, the Martian indoor standard, no sky)
      const st = newState(1);
      st.places.live = { site: 'melas', area: WHEEL_S4.id };
      const G = gravityAt(st, WHEEL_S4.id), E = envAt(st, WHEEL_S4.id);
      console.log(`      gravity ${G.regime} ${G.gG} G (${fmt(G.gMs2, 3)} m/s²), spin ${JSON.stringify(G.spin)}; the air ${E.air.air} ${E.air.pKpa} kPa; sky ${E.sky}; outdoors ${E.outdoors}`);
      assert(G.regime === 'spin' && G.gG === 1 && G.spin.radiusM === 500 && G.spin.omegaRadS === 0.1347 && G.spin.alongRad === 0 && E.sky === 'none' && !E.outdoors && E.air.air === 'martian-indoor', JSON.stringify({ G, E }));
      // (the chunks: four rooms' chunks and the hall placed by layout A, every room of the house from one of them)
      const fromChunks = LAYOUT_A.flatMap(P => Object.values(P.rooms));
      console.log(`      ${Object.keys(X4_CHUNKS).length} chunks (${Object.values(X4_CHUNKS).map(k => `${k.id} ${k.rooms.length} room${k.rooms.length > 1 ? 's' : ''}, ${k.sockets.length} socket`).join('; ')}); layout A places ${LAYOUT_A.length}: ${LAYOUT_A.map(P => `${P.chunk} at (${P.at.join(', ')})`).join(', ')}`);
      assert(WHEEL_S4.rooms.filter(r => r.zone === 'w4.z.house').map(r => r.id).sort().join() === fromChunks.sort().join(), 'the house is its chunks');
      // (the rules broken on the house: a leaf's room missing, a fixture in a door's clear zone, a seed on a room)
      const caught = [];
      for (const [rule, br] of [['opening', (a) => { a.openings.find(o => o.id === 'o:w4:r1').at = 12.5; }], ['door-clear', (a) => { a.fixtures.find(f => f.id === 'f:w4:bin:01').z = 10.0; a.fixtures.find(f => f.id === 'f:w4:bin:01').x = 34.6; }], ['no-seed', (a) => { a.rooms[0].seed = 48213; }], ['zone', (a) => { a.zones[1].rooms.push('w4.r1'); }]]) {
        const a = copy(WHEEL_S4);
        br(a);
        const got = rulesOf(validateArea(a));
        caught.push(`${rule}: ${got.join('+') || 'none'}`);
        assert(got.includes(rule), `breaking '${rule}' on the house was not caught: ${got.join(', ')}`);
      }
      console.log(`      broken on purpose: ${caught.join('; ')}`);
    },
  },
  {
    name: 'lane A of house 1 stands as the build sheet 0.0.12 §2.1 draws it: the start mark 4.00 m from room 1\'s #1 stack point, the #2 0.65 m behind, room 1 COMBAT §25.5.1\'s reference room, the stands in their rooms, the catwalk at 3 m; every point, stack and threshold reached from the start on the C0 grid with the doors open, and with them shut only the hall and the apron',
    fn() {
      const H = HOUSE1, P = X4_PLANS.A.plans, r1 = P['o:w4:r1'], room1 = WHEEL_S4.rooms.find(r => r.id === 'w4.r1'), d1 = WHEEL_S4.openings.find(o => o.id === 'o:w4:r1');
      const startToStack = Math.hypot(H.start.x - r1.stack[0][0], H.start.z - r1.stack[0][1]), behind = Math.hypot(H.two.x - H.start.x, H.two.z - H.start.z);
      const w = room1.rect[2] - room1.rect[0], d = room1.rect[3] - room1.rect[1], mid = (d1.a + d1.b) / 2;
      console.log(`      the start (${H.start.x}, ${H.start.z}) facing ${H.start.face} on the hall's axis z ${H.hall.axisZ}: ${fmt(startToStack, 3)} m to room 1's #1 stack (${r1.stack[0].join(', ')}); the #2 at (${H.two.x}, ${H.two.z}), ${fmt(behind, 2)} m behind`);
      console.log(`      room 1: ${w} × ${d} m, its door ${fmt(d1.b - d1.a, 2)} m centred ${fmt(mid - room1.rect[0], 2)} m along the near wall (z ${d1.at}), opening ${d1.swing.into === 1 ? 'inward' : 'outward'}, hinged at its ${d1.swing.hinge} end (x ${d1[d1.swing.hinge]}: the left as seen from the hall); #1's stack ${fmt(r1.stack[0][0] - d1.b, 2)} m from the frame and ${fmt(r1.stack[0][1] - d1.at, 2)} m off the wall; his point ${fmt(r1.points[0][0] - room1.rect[0], 2)} m along the near wall from the near-left corner and ${fmt(d1.at - r1.points[0][1], 2)} m off it`);
      assert(Math.abs(startToStack - 4.0) <= 0.05 && Math.abs(behind - 0.65) < 1e-9 && H.start.z === H.hall.axisZ, 'the start 4.0 ± 0.05 m from the stack, the #2 0.65 m behind');
      assert(w === 5 && d === 4 && Math.abs(d1.b - d1.a - 0.9) < 1e-9 && Math.abs(mid - (room1.rect[0] + 2.5)) < 1e-9 && d1.swing.into === 1 && d1.swing.hinge === 'a' && d1.at === room1.rect[3], 'room 1: 5 × 4, the door 0.9 m in the middle of the near wall, inward, hinged left');
      assert(Math.abs(r1.stack[0][0] - d1.b - 0.5) < 1e-9 && Math.abs(r1.stack[0][1] - d1.at - 0.45) < 1e-9 && Math.abs(r1.points[0][0] - room1.rect[0] - 1.0) < 1e-9 && Math.abs(d1.at - r1.points[0][1] - 0.5) < 1e-9, 'room 1: the stack and the point as §25.5.1 places them');
      // (the stands: inside their rooms, each with its slot, trigger and faces)
      const roomOfId = (id) => WHEEL_S4.rooms.find(r => r.id === id);
      for (const s of H.stands) {
        const p = s.door ? P[s.door] : P.hall, inPart = p.parts.some(id => { const r = roomOfId(id).rect; return s.x > r[0] && s.x < r[2] && s.z > r[1] && s.z < r[3]; });
        console.log(`        ${s.key} ${s.stand} '${s.name}' in ${s.room} at (${s.x}, ${s.z}) y ${s.y}, slot ${s.slot}, ${s.faces.join('|')}, ${s.trigger.kind}${s.trigger.gapMs ? ` ${s.trigger.id} + ${s.trigger.gapMs.join(' to ')} ms` : ''}, facing ${fmt(s.faceRad, 3)} rad; ${fmt(Math.hypot(s.x - p.threshold[0], s.z - p.threshold[1]), 2)} m from the threshold`);
        assert(inPart, `${s.stand} outside its room's plan`);
      }
      const hs = H.stands.find(s => s.stand === 'H'), d3 = WHEEL_S4.openings.find(o => o.id === 'o:w4:r3'), hFrom3 = Math.hypot(hs.x - (d3.a + d3.b) / 2, hs.z - d3.at);
      console.log(`      H ${fmt(hFrom3, 2)} m from room 3's door; the hall's west zone ${JSON.stringify(H.zones.hallWest)}; the catwalk at y ${H.catwalk.y} m along ${JSON.stringify(H.catwalk.path)}, its stairs ${JSON.stringify(H.catwalk.stairs)}; the booth (${H.booth.x}, ${H.booth.z})`);
      assert(H.stands.length === 7 && Math.abs(hFrom3 - 10.0) <= 0.05 && H.catwalk.y === 3.0 && WHEEL_S4.zones.some(z => z.id === H.zones.hallWest.id), 'seven stands, H 10 m from room 3\'s door, the catwalk at 3 m');
      assert(H.stands.map(s => s.stand).join() === '1a,1b,2a,2b,3a,3b,H' && H.stands.filter(s => s.slot === 2).map(s => s.stand).join() === '1b,3a', 'the #2\'s stands are 1b and 3a');
      // (reached: the doors open, every point, stack and threshold from the start; shut, the hall and the apron only)
      const flood = (closed) => {
        const g = buildGrid(WHEEL_S4, 'C0', { closed: () => closed }), seen = new Uint8Array(g.nx * g.nz), c0 = cellOf(g, H.start.x, H.start.z), todo = [c0];
        seen[c0] = 1;
        while (todo.length) {
          const k = todo.pop(), i = k % g.nx, j = Math.floor(k / g.nx);
          for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const ii = i + di, jj = j + dj, kk = jj * g.nx + ii;
            if (ii < 0 || jj < 0 || ii >= g.nx || jj >= g.nz || seen[kk] || g.cost[kk] === 255) continue;
            seen[kk] = 1; todo.push(kk);
          }
        }
        return { g, n: seen.reduce((a, b) => a + b, 0), at: (x, z) => seen[cellOf(g, x, z)] === 1 };
      };
      const open = flood(false), shut = flood(true);
      const spots = [{ what: 'the start', ...H.start }, { what: 'the #2\'s start', ...H.two }, ...Object.entries(P).flatMap(([k, p]) => [...p.stack.map((q, i) => ({ what: `${k}'s stack ${i + 1}`, x: q[0], z: q[1] })), ...p.points.map((q, i) => ({ what: `${k}'s point ${i + 1}`, x: q[0], z: q[1] })), { what: `${k}'s threshold`, x: p.threshold[0], z: p.threshold[1] }])];
      const missed = spots.filter(q => !open.at(q.x, q.z)).map(q => q.what);
      const inHouseShut = [[29, 10], [22, 17], [17, 8], [21, 7], [26.1, 16.9], [33, 10.5]].filter(([x, z]) => shut.at(x, z));
      console.log(`      the C0 grid ${open.g.nx} × ${open.g.nz}: from the start with the doors open ${open.n} cells (${fmt(open.n * CELL_M * CELL_M, 0)} m²), ${spots.length - missed.length} of ${spots.length} points, stacks and thresholds reached; shut, ${shut.n} cells (the hall and the apron), rooms reached ${inHouseShut.length ? JSON.stringify(inHouseShut) : 'none'}`);
      assert(!missed.length, `not reached: ${missed.join(', ')}`);
      assert(!inHouseShut.length && shut.at(36, 2) && shut.at(2, 26), 'with the doors shut, the rooms are closed and the apron is round the house');
    },
  },
  {
    name: 'house 1\'s light at 10:00 (the build sheet 0.0.12 §2.1, §8 item 25): the lit rooms and the hall at the day\'s 0.75, room 3 and its far leg at MOODS.dim\'s 0.40 at every hour (class cqbDim)',
    fn() {
      const st = newState(1);
      st.places.live = { site: 'melas', area: WHEEL_S4.id };
      const at10 = msAtLocal('melas', START_MS, 10, 0), at23 = msAtLocal('melas', at10, 23, 0);
      const probe = [['hall', 25, 13.2], ['room 1', 29, 10], ['room 2', 22.75, 17], ['room 3', 17.5, 8.6], ['the far leg', 21.25, 7.2], ['the booth', 33.5, 10.5]];
      const rows = probe.map(([w, x, z]) => [w, lightLevel(st, x, z, at10), lightLevel(st, x, z, at23)]);
      console.log(`      at 10:00 (and 23:00): ${rows.map(([w, a, b]) => `${w} ${a} (${b})`).join(', ')}`);
      const by = Object.fromEntries(rows.map(([w, a, b]) => [w, [a, b]]));
      assert(by['room 1'][0] === 0.75 && by['room 2'][0] === 0.75 && by['room 3'][0] === 0.4 && by['the far leg'][0] === 0.4 && by['room 3'][1] === 0.4, JSON.stringify(by));
    },
  },
  {
    name: 'the Wheel\'s sector 4 and lane A are pinned by goldens (melas@1\'s template: set on purpose in 0.0.12)',
    fn() {
      const a = golden('places: WHEEL_S4', WHEEL_S4, '05f066607e544d')   // (0.0.12, set on purpose: house 1 of the Wheel's sector 4 and its apron);
      const b = golden('places: HOUSE1', HOUSE1, '04447e988e6958')   // (0.0.12, set on purpose: lane A's start, stands, catwalk and booth);
      const g = golden('places: WHEEL_S4 C0 grid bytes', buildGrid(WHEEL_S4, 'C0', { closed: (o) => o.state === 'closed' }).cost, '1dd12b42226e54')   // (0.0.12, set on purpose);
      console.log(`      WHEEL_S4 ${a}; HOUSE1 ${b}; its C0 grid (the doors as the template has them) ${g}`);
    },
  },
];
