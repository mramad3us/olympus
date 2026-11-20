// OLYMPUS tests: the Patient Mule as a place, F151's place half (the build sheet v0.0.27 §0 items 2, 7, 31, 32, §2 step 6, §6 stage 0, §8; src/data/places/hauler.js).
//
// Deck 2 of the Belt ice hauler is written in the Wreck's model (wreck-place's rules, read for one deck) and unreachable until D's
// scene. These cases hold its data to that model and to the sheet's corrections:
//   - the area keeps PLACES §9.6's rules (validate.js validateArea, as wreck-place: places-validate names its areas by hand), is listed
//     on its site (sites.js BELT_MULE_SITE: 0 G coasting, the Belt's station air) and in AREA_LIST; every room is a room of deck 2 inside
//     its 12 × 10 m, on the 0.1 m grid, 2.4 m clear and plate;
//   - every opening is a hatch (0.8 m, four dogs, its coaming, its middle on the hold lattice where the room allows, its rooms either side
//     of its line): the
//     lock's inner hatch on an x line (ship-parts.js's axis 'z'), dogged, never offered; the three compartments' undogged and offered;
//   - every standing fixture stops a walker and hides every layer of the sight grid (one grid serves both faces), the berth boxes deck to
//     deckhead; the trunk's scuttle dogged, never offered, no deck hatch of the trunk's (DECK_HATCHES the Wreck's alone); a speaker on
//     every compartment's deckhead;
//   - every post and crew spot a stand in the house's form, its first digit its leg (§0 item 31's table: 1 the passage, 2 cabin 1, 3 the
//     bunk room, 4 cabin 2), its room its leg's, a role in courses.js HAULER_ROLES (and no role without a stand), and the spec's stands
//     (shipSpec) one a stand; each but 1a through tests/opfor-world.mjs spotCheck on the plan its hatch derives (derive.js, every
//     offered hatch open: what D's derive-plans --ship hauler will write), 1a (the passage's, a plan D authors) by its walls, swings and
//     its line to the lock's hatch; hides and refuges standable in their compartments within FLEE_MAX_M 6 m; the holders 0.9 m and more
//     from every stack point of cabin 1's hatch and out of the lock's swing; the four's start standable and routed to cabin 1's stack;
//   - the walls' kinds each a built row of penetrate.js WALLS (no new material); the people's nine posts (the sheet's "eleven" counts
//     two, four and three) drawn by staff.js drawStaff,
//     the holdouts and crew civilians (ranks.js Civ); and a golden hash over the data.
// A stand whose first digit is not its leg's would put a holdout on the wrong leg (ruled out by a setup, owned by the wrong marine,
// missed by the clear gate: the sheet's §11 risk 15), so the leg check runs over every stand.
import { assert } from './helpers.mjs';
import { golden, goldenDigest } from './golden.mjs';
import { createGame } from './game.mjs';
import { spotCheck } from './opfor-world.mjs';
import { validateArea } from '../src/sim/places/validate.js';
import { CATALOGUE, mountOf, blocks, sightHOf } from '../src/sim/places/fixtures.js';
import { AREA_LIST } from '../src/sim/places/areas.js';
import { buildGrid, path } from '../src/sim/places/nav.js';
import { standOk } from '../src/sim/places/collide.js';
import { LAYER_M, sightGridOf } from '../src/sim/places/sight.js';
import { clearLine } from '../src/sim/people/perception.js';
import { wallClearanceM } from '../src/sim/combat/room.js';
import { derivePlan, geoOf } from '../src/sim/combat/derive.js';
import { DECK_HATCHES } from '../src/sim/places/hatch.js';
import { WALLS } from '../src/sim/arms/penetrate.js';
import { shipSpec } from '../src/sim/scenes/assemble.js';
import { drawStaff } from '../src/sim/people/staff.js';
import { POSTS } from '../src/data/people/posts.js';
import { RANKS } from '../src/data/people/ranks.js';
import { SITE_LIST } from '../src/data/places/sites.js';
import { SHIPS, shipOf } from '../src/data/places/ships.js';
import { HAULER_ROLES } from '../src/data/courses.js';
import { HAULER, HAULER_ID, HAULER_SITE, HAULER_DECKS, HAULER_DECK_M, HAULER_CEILING_M, HAULER_HATCHES, HAULER_WALLS, HAULER_WALL_ROWS, HAULER_POSTS, HAULER_CREW, HAULER_SET,
  HAULER_HOLDERS, HAULER_START, LOCK_COAMING_M, CABIN_COAMING_M } from '../src/data/places/hauler.js';

/**
 * The deck's data, digested (golden): the area, its hatches, posts, crew spots, holders and start. Re-set by v0.0.27's D (was
 * '0fd00e876803af', stage 0's), its causes D's data: cabin 1's hatch at x 5.25 hinged to starboard and cabin 2's hinged to starboard (the
 * pair's stack short of you on your way from the lock and the bunk room: in the 1.5 m passage Four had to pass you, and the two of you held
 * each other there for good), cabin 2's locker column against the hull (its pocket behind it no point saw), cabin 1's crew corner and
 * 2a's post moved with its hatch, the holders 0.9 m and more off cabin 1's new stack (tests/hauler-plans.test.mjs).
 */
export const HAULER_DIGEST = '08f67447c4eb84';
/** §0 item 31's legs: the room each leg's stands stand in, by the stand's first digit. */
export const LEG_ROOMS = Object.freeze({ 1: 'mu.d2.passage', 2: 'mu.d2.cabin-1', 3: 'mu.d2.bunks', 4: 'mu.d2.cabin-2' });
/** A flight's most (COMBAT §7.11, the sheet's §5 FLEE_MAX_M) and a holder's least distance from a stack point (§0 item 12), metres. */
const FLEE_MAX_M = 6, HOLDER_GAP_M = 0.9;

const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;
const onGrid = (v, step) => near(Math.round(v / step) * step, v, 1e-6);
const inRect = ([x0, z0, x1, z1], x, z, e = 1e-6) => x >= x0 - e && x <= x1 + e && z >= z0 - e && z <= z1 + e;
const roomRec = (id) => HAULER.rooms.find(r => r.id === id);
// (the plans the offered hatches derive (tools/derive-plans.mjs's way for the Wreck), each with its area and its parts' rects as the lane reads it)
function derivedPlans() {
  const open = HAULER_HATCHES.filter(h => h.offered !== false).map(h => h.id), out = {};
  for (const h of HAULER_HATCHES.filter(x => x.offered !== false)) { const P = derivePlan(geoOf(HAULER_ID, h.id, [h.rooms[1]]), { open }); out[h.id] = { ...P, area: HAULER_ID, rects: P.parts.map(id => roomRec(id).rect) }; }
  return out;
}
// (the lock's inner hatch's swing into the passage: the quarter disc its 0.8 m leaf sweeps about its hinge)
function inLockSwing(x, z, padM = 0) {
  const h = HAULER_HATCHES.find(o => o.id === 'o:mu:d2:lock'), hz = h.swing.hinge === 'a' ? h.a : h.b, along = h.swing.hinge === 'a' ? 1 : -1;
  const dx = x - h.at, dz = (z - hz) * along;
  return dx >= -padM && dz >= -padM && Math.hypot(dx, dz) <= (h.b - h.a) + padM;
}

export default [
  {
    name: 'the Patient Mule validates by PLACES §9.6\'s rules, is listed on its site (0 G coasting, the Belt\'s station air) and in AREA_LIST, and every room is a room of deck 2 inside its 12 × 10 m, on the 0.1 m grid, 2.4 m clear and plate; no scene reaches it yet',
    fn() {
      const r = validateArea(HAULER);
      console.log(`      validate: ${r.ok ? 'ok' : 'FAILED'}; ${JSON.stringify(r.counts)}`);
      assert(r.ok, JSON.stringify(r.problems));
      const site = SITE_LIST.find(x => x.id === HAULER.site);
      assert(HAULER.site === HAULER_SITE && site?.areas.includes(HAULER_ID) && AREA_LIST.includes(HAULER), 'the hauler is not listed');
      assert(site.gravity.regime === 'thrust' && site.gravity.gG === 0 && site.inside.air === 'belt-station' && site.kind === 'ship', JSON.stringify(site));
      const bad = [], D = HAULER_DECKS[2];
      for (const rm of HAULER.rooms) {
        const [x0, z0, x1, z1] = rm.rect;
        if (rm.deck !== 2 || !rm.id.startsWith('mu.d2.')) bad.push(`${rm.id}: deck ${rm.deck}`);
        if (!inRect(D.rect, x0, z0) || !inRect(D.rect, x1, z1)) bad.push(`${rm.id}: outside deck 2`);
        if (![x0, z0, x1, z1].every(v => onGrid(v, 0.1))) bad.push(`${rm.id}: off the 0.1 m grid`);
        if (rm.ceilingM !== HAULER_CEILING_M || rm.surface !== 'plateGrid') bad.push(`${rm.id}: ${rm.ceilingM} m, ${rm.surface}`);
      }
      const area = HAULER.rooms.reduce((a, rm) => a + (rm.rect[2] - rm.rect[0]) * (rm.rect[3] - rm.rect[1]), 0);
      const scenes = Object.values(SHIPS).filter(S => S.area === HAULER_ID).map(S => S.scene);
      console.log(`      deck 2 (${D.name}): ${HAULER.rooms.length} rooms (${HAULER.rooms.map(rm => rm.id.slice(6)).join(', ')}), ${area.toFixed(2)} m² of ${(HAULER_DECK_M[0] * HAULER_DECK_M[1]).toFixed(2)} (the rest the two voids), ${HAULER_CEILING_M} m clear; its ship row '${shipOf({ ship: 'hauler' })?.id}', scene '${scenes.join()}'`);
      assert(!bad.length, bad.join('; '));
      assert(near(area, 101.25) && HAULER.decks.length === 1 && HAULER.look.wallsToCeiling && HAULER.look.palette === 'belt', `${area} m²`);
    },
  },
  {
    name: 'every opening is a hatch: 0.8 m, four dogs, its coaming, its middle on the hold lattice (0.75 m + 1.5 m k), its rooms either side of its line; the lock\'s inner hatch on an x line, dogged and never offered (the override\'s); the cabins\' and the bunk room\'s undogged and offered',
    fn() {
      const bad = [], lines = [];
      for (const h of HAULER_HATCHES) {
        const mid = (h.a + h.b) / 2, [from, into] = h.rooms.map(roomRec), lock = h.id === 'o:mu:d2:lock';
        if (h.kind !== 'door' || h.leaf !== 'hatch' || h.dogs !== 4 || h.state !== 'closed' || !h.swing || h.swing.into !== 1) bad.push(`${h.id}: ${JSON.stringify(h)}`);
        if (!near(h.b - h.a, 0.8)) bad.push(`${h.id}: ${h.b - h.a} m wide`);
        // (on the lattice where the room allows (SH§3.3): the lock's inner hatch stands in the passage's 1.5 m, where neither lattice point
        // (3.75, 5.25) leaves its 0.8 m inside the passage, so it takes the passage's middle, 4.75)
        if (!onGrid(mid - 0.75, 1.5) && !(lock && near(mid, (roomRec('mu.d2.passage').rect[1] + roomRec('mu.d2.passage').rect[3]) / 2))) bad.push(`${h.id}: its middle ${mid} off the lattice`);
        if (h.coamingM !== (lock ? LOCK_COAMING_M : CABIN_COAMING_M)) bad.push(`${h.id}: coaming ${h.coamingM}`);
        if (lock ? !(h.axis === 'z' && h.lock === true && h.offered === false) : !(h.axis === 'x' && h.lock === false && h.offered !== false)) bad.push(`${h.id}: axis ${h.axis}, lock ${h.lock}, offered ${h.offered}`);
        // (its line on the shared edge of its two rooms, its ends within both)
        const e = h.axis === 'x' ? [from.rect[1], from.rect[3], into.rect[1], into.rect[3]] : [from.rect[0], from.rect[2], into.rect[0], into.rect[2]];
        if (!e.some(v => near(v, h.at)) || !(e.filter(v => near(v, h.at)).length >= 2)) bad.push(`${h.id}: its line ${h.at} not on both rooms' edge`);
        lines.push(`${h.id.slice(7)} ${h.axis === 'x' ? `z ${h.at}, x` : `x ${h.at}, z`} ${h.a} to ${h.b}, ${h.lock ? 'dogged' : 'undogged'}${h.offered === false ? ', never offered' : ''}, coaming ${h.coamingM} m`);
      }
      console.log(`      ${HAULER_HATCHES.length} hatches: ${lines.join('; ')}`);
      assert(!bad.length, bad.join('; '));
      assert(HAULER.openings.length === 4 && HAULER.openings.every(o => o.leaf === 'hatch'), 'every opening a hatch');
    },
  },
  {
    name: 'every standing fixture stops a walker and hides every sight layer (one grid serves the deck and the deckhead), the berth boxes deck to deckhead; the trunk\'s scuttle dogged and never offered, no deck hatch of the hauler\'s; a speaker on every compartment\'s deckhead',
    fn() {
      const bad = [], kinds = {};
      for (const f of HAULER.fixtures) {
        const K = CATALOGUE[f.kind], m = mountOf(f);
        kinds[f.kind] = (kinds[f.kind] ?? 0) + 1;
        if (m) { if (blocks(f) || !['deck', 'deckhead', 'wall'].includes(m)) bad.push(`${f.id}: mounted ${m}, blocks ${blocks(f)}`); continue; }
        if (!blocks(f) || sightHOf(f) < LAYER_M.STAND) bad.push(`${f.id}: blocks ${blocks(f)}, hides to ${sightHOf(f)} m`);
        if (f.kind === 'berthBox' && K.h < HAULER_CEILING_M - 1e-9) bad.push(`${f.id}: ${K.h} m high`);
      }
      const sc = HAULER.fixtures.filter(f => f.kind === 'scuttle'), hauls = Object.values(DECK_HATCHES).filter(T => T.area === HAULER_ID);
      const noSpeaker = HAULER.rooms.filter(rm => !HAULER.speakers.some(sp => sp.room === rm.id)).map(rm => rm.id);
      console.log(`      fixtures ${JSON.stringify(kinds)}; the scuttle ${sc.map(f => `${f.id} ${f.mount} dogged ${f.dogged} offered ${f.offered}`).join()}; deck hatches on the hauler ${hauls.length}; speakers ${HAULER.speakers.length} at ${HAULER.speakers[0].y} m`);
      assert(!bad.length, bad.join('; '));
      assert(sc.length === 1 && sc.every(f => f.dogged === true && f.offered === false && !f.trunk) && !hauls.length, JSON.stringify(sc));
      assert(!noSpeaker.length && HAULER.speakers.every(sp => sp.y < HAULER_CEILING_M && sp.y > HAULER_CEILING_M - 0.2 && inRect(roomRec(sp.room).rect, sp.x, sp.z)), JSON.stringify({ noSpeaker }));
    },
  },
  {
    name: 'the stands (§0 item 31): every post and crew spot in the house\'s form, its first digit its leg and its room the leg\'s, a role in HAULER_ROLES each and none without a stand, the spec\'s stands one a stand; each through spotCheck on its hatch\'s derived plan (1a by its walls, swings and its line to the lock), its hide and refuge standable within 6 m; the holders and the start clear of the stacks and the lock\'s swing',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: 48213 }), state = g.state, plans = derivedPlans(), nav = buildGrid(HAULER, 'C0', { closed: () => false });
      const stands = HAULER_SET.map(s => ({ stand: s.stand, x: s.at[0], z: s.at[1] })), all = [...HAULER_POSTS, ...HAULER_CREW], bad = [], lines = [];
      for (const p of all) {
        const leg = Number(p.stand[0]);
        if (!/^[1-4][a-z]$/.test(p.stand)) bad.push(`${p.stand}: not of the house's form`);
        if (LEG_ROOMS[leg] !== p.room) bad.push(`${p.stand}: leg ${leg}'s room is ${LEG_ROOMS[leg]}, the stand's ${p.room}`);
        if (!HAULER_ROLES[p.stand]) bad.push(`${p.stand}: no role`);
        if (!['deck', 'deckhead'].includes(p.onFace) || p.anchor !== 'boots') bad.push(`${p.stand}: ${p.onFace}, ${p.anchor}`);
        if (!inRect(roomRec(p.room).rect, ...p.at) || !standOk(nav, ...p.at)) bad.push(`${p.stand}: not standable in its room`);
        const P = plans[p.door];
        if (P) {
          const r = spotCheck(state, p.stand, p.at, { spot: { door: p.door }, plan: P, stands });
          if (!r.ok) bad.push(`${p.stand}: ${r.why.join('; ')}`);
          lines.push(`${p.stand} ${r.ok ? 'ok' : 'NO'} (wall ${r.wall.toFixed(2)}, way ${r.way.toFixed(2)}, stands ${r.stands.toFixed(2)}, slot ${r.slot})`);
        } else {
          // (the passage's man: a plan D authors; his walls, the lock's swing and his line to the lock's hatch on the sight grid, standing)
          const wall = wallClearanceM({ area: HAULER_ID, rects: [roomRec(p.room).rect] }, ...p.at), grid = sightGridOf(state, HAULER_ID);
          const sees = clearLine(grid, ...p.at, ...p.aimAt, 'stand');
          if (wall < 0.4 || inLockSwing(...p.at, 0.27) || !sees) bad.push(`${p.stand}: wall ${wall}, swing ${inLockSwing(...p.at, 0.27)}, sees the lock ${sees}`);
          lines.push(`${p.stand} ${wall >= 0.4 && sees ? 'ok' : 'NO'} (wall ${wall.toFixed(2)}, the lock's hatch in his line ${sees})`);
        }
        for (const q of [p.hide, p.refuge].filter(Boolean)) if (!inRect(roomRec(p.room).rect, ...q) || !standOk(nav, ...q) || Math.hypot(q[0] - p.at[0], q[1] - p.at[1]) > FLEE_MAX_M) bad.push(`${p.stand}: hide or refuge ${JSON.stringify(q)}`);
      }
      const roleless = Object.keys(HAULER_ROLES).filter(k => !all.some(p => p.stand === k));
      const spec = shipSpec('hauler'), keys = new Set(spec.stands.map(s => s.key));
      console.log(`      ${HAULER_POSTS.length} posts and ${HAULER_CREW.length} crew spots: ${lines.join('; ')}`);
      const P1 = plans['o:mu:d2:cabin-1'], hold = HAULER_HOLDERS.map(h => ({ n: h.n, d: Math.min(...P1.stack.map(s => Math.hypot(s[0] - h.at[0], s[1] - h.at[1]))), ok: standOk(nav, ...h.at), swing: inLockSwing(...h.at, 0.27) }));
      const start = HAULER_START.map(s => ({ n: s.n, ok: standOk(nav, ...s.at), swing: inLockSwing(...s.at, 0.27) })), route = path(nav, HAULER_START[2].at, P1.stack[0]);
      console.log(`      the holders: ${hold.map(h => `#${h.n} ${h.d.toFixed(2)} m from cabin 1's stack, standable ${h.ok}, in the lock's swing ${h.swing}`).join('; ')}; the start standable ${start.every(s => s.ok)}, routed to cabin 1's stack ${route.fail ?? `${route.lengthM} m`}`);
      console.log(`      the spec: ${spec.stands.length} stands, lanes ${spec.stands.map(s => `${s.stand}:${s.lane}`).join(' ')}, the ship '${spec.ship}', lane ${spec.lane}`);
      assert(!bad.length, bad.join('\n'));
      assert(!roleless.length && spec.stands.length === all.length && keys.size === all.length && spec.ship === 'hauler', JSON.stringify({ roleless, n: spec.stands.length }));
      assert(hold.every(h => h.d >= HOLDER_GAP_M && h.ok && !h.swing) && start.every(s => s.ok && !s.swing) && !route.fail, JSON.stringify({ hold, start, route: route.fail }));
      // (§0 item 31's draw: armed 1a, 2a, 3a, 3b, 4a, 4b; the crew 2c, 2d, 3c, 3d, 4c)
      assert(HAULER_POSTS.map(p => p.stand).join() === '1a,2a,3a,3b,4a,4b' && HAULER_CREW.map(p => p.stand).join() === '2c,2d,3c,3d,4c' && HAULER_POSTS.find(p => p.stand === '4b').onFace === 'deckhead', 'the stands');
    },
  },
  {
    name: 'the walls\' kinds are each a built row of penetrate.js WALLS (the hull mild steel 6 mm as pressureDoor, the bulkheads aluminium 8, the cabins honeycomb 25, the head aluminium 2: no new material); the people\'s nine posts drawn by drawStaff (the sheet\'s "eleven" counts 2 + 4 + 3), the holdouts and crew civilians; the deck\'s data golden',
    fn() {
      const rows = HAULER_WALLS.map(w => ({ kind: w.kind, row: HAULER_WALL_ROWS[w.kind], wall: WALLS[HAULER_WALL_ROWS[w.kind]] }));
      console.log(`      ${rows.map(r => `${r.kind} → ${r.row} (${r.wall?.material} ${r.wall?.mm} mm)`).join('; ')}`);
      const want = { hull: ['steelMild', 6], bulkhead: ['aluminium', 8], cabin: ['honeycomb', 25], partition: ['aluminium', 2] };
      assert(rows.every(r => r.wall && r.wall.material === want[r.kind][0] && r.wall.mm === want[r.kind][1]) && rows.length === 4, JSON.stringify(rows));
      const keys = Object.keys(POSTS).filter(k => k.startsWith(`${HAULER_SITE}:`)), g = createGame({ scenario: 'barracks', seed: 48213 }), drawn = [];
      for (const k of keys) { const pid = drawStaff(g.state, k), p = g.state.people[pid]; drawn.push(`${k.slice(10)} ${p.service.rank} ${p.name.family}`); }
      console.log(`      ${keys.length} posts: ${drawn.join(', ')}; the rank Civ ${RANKS.Civ?.title} (grade ${RANKS.Civ?.grade}, branch ${RANKS.Civ?.branch})`);
      assert(keys.length === 9 && keys.join() === 'belt-mule:board-tl,belt-mule:board-ar,belt-mule:holdout-1,belt-mule:holdout-2,belt-mule:holdout-3,belt-mule:holdout-4,belt-mule:crew-1,belt-mule:crew-2,belt-mule:crew-3', keys.join());
      assert(HAULER_HOLDERS.every(h => POSTS[h.post]?.branch === 'marines') && keys.filter(k => /holdout|crew/.test(k)).every(k => POSTS[k].ranks.every(([r]) => r === 'Civ')), 'the posts');
      const data = { area: HAULER, hatches: HAULER_HATCHES, posts: HAULER_POSTS, crew: HAULER_CREW, holders: HAULER_HOLDERS, start: HAULER_START };
      console.log(`      the deck's data: ${goldenDigest(data)}`);
      golden('the Patient Mule\'s deck 2 as data (v0.0.27\'s stage 0)', data, HAULER_DIGEST);
    },
  },
];
