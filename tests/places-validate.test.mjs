// places-validate: PLACES §9.6's rules over the test rooms and Base Melas's site plan, each rule
// broken on purpose once to prove it fails, and the goldens that pin what is authored (the build
// sheet 0.0.2 §5.3). The catalogue's sizes are checked against the kit's FOOTPRINTS here, the one
// place that reads both (the sim may not import the art: TECH §2.2; build sheet §8 item 6).
import { assert, fmt } from './helpers.mjs';
import { golden } from './golden.mjs';
import { TEST_AREA } from '../src/data/places/testroom.js';
import { MELAS_COMPACTION } from '../src/data/places/melas.js';
import { MELAS_PLAN, MELAS_PLAN_AS_WRITTEN } from '../src/sim/places/siteplan.js';
import { validateArea, validatePlan, DOOR_CLEAR_M, MIN_GAP_M } from '../src/sim/places/validate.js';
import { CATALOGUE, KINDS } from '../src/sim/places/fixtures.js';
import { buildGrid } from '../src/sim/places/nav.js';
import { FOOTPRINTS } from '../src/art/kit/index.js';

const copy = (v) => JSON.parse(JSON.stringify(v));
const rulesOf = (res) => [...new Set(res.problems.map(p => p.rule))];
const AREA_RULES = ['ids', 'unique', 'opening', 'room-opening', 'door-clear', 'zone', 'kind', 'overlap', 'in-room', 'spawn'];
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

export default [
  {
    name: 'the test rooms keep every rule of PLACES §9.6, and each rule fails on a sample made to break it',
    fn() {
      const res = validateArea(TEST_AREA);
      console.log(`      ${res.counts.rooms} rooms, ${res.counts.openings} openings, ${res.counts.fixtures} fixtures, ${res.counts.zones} zones; checks: ${AREA_RULES.map(r => `${r} ${res.counts[r] ?? 0}`).join(', ')}`);
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
    name: 'the catalogue\'s sizes are the kit\'s FOOTPRINTS (what is drawn is what blocks)',
    fn() {
      const off = KINDS.filter(k => { const f = FOOTPRINTS[k], c = CATALOGUE[k]; return !f || f.w !== c.w || f.d !== c.d || f.h !== c.h; });
      const open = KINDS.filter(k => !CATALOGUE[k].block);
      console.log(`      ${KINDS.length} core kinds, ${KINDS.length - off.length} equal to FOOTPRINTS; not blocking: ${open.join(', ')}; spots ${KINDS.reduce((n, k) => n + CATALOGUE[k].spots.length, 0)}`);
      assert(!off.length, off.map(k => `${k}: catalogue ${JSON.stringify(CATALOGUE[k])} kit ${JSON.stringify(FOOTPRINTS[k])}`).join('\n'));
      assert(open.join() === 'chair,stool,board,sign,window,emergencyLight', open.join());
    },
  },
  {
    name: 'the test rooms and their C0 grid are pinned by goldens',
    fn() {
      const grid = buildGrid(TEST_AREA, 'C0');
      const a = golden('places: TEST_AREA', TEST_AREA, '089faeb83aa5ed');
      const g = golden('places: TEST_AREA C0 grid bytes', grid.cost, '189fefcff571bf');
      console.log(`      TEST_AREA ${a}; its C0 grid (${grid.nx} × ${grid.nz}) ${g}`);
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
      const p = golden('places: MELAS_PLAN', MELAS_PLAN, '0f9ae504ac4dbc');
      const w = golden('places: MELAS_PLAN_AS_WRITTEN', MELAS_PLAN_AS_WRITTEN, '140c63b80bc327');
      console.log(`      MELAS_PLAN ${p}; MELAS_PLAN_AS_WRITTEN ${w}`);
    },
  },
];
