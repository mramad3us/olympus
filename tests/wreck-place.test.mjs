// OLYMPUS tests: the Wreck as a place, F135's place half (the build sheet v0.0.25 §6 A, §8; src/data/places/wreck.js, src/data/places/wreck-plans.js, src/sim/places/plan.js).
//
// The Wreck holds both decks in one area, 60 m apart in its plan, so the lane's one-area readers work unchanged and neither deck is
// ever in the other's picture. These cases hold the data to that: the area keeps PLACES §9.6's rules (validate.js), every room is a
// room of deck 5 or 6 inside its deck, the trunk's ends are offset by exactly the decks' origins and lie farther apart than the
// stage's widest window, every bulkhead hatch is the house's door dressed as a hatch with its middle on the hold lattice, every
// standing fixture stands deck to deckhead, set A meets every face with its stands on their faces in their rooms, the plans are what
// the deriver gives today and every point the lane walks is standable and routed, with the scuttle shut and open; and the cutaway
// stands the Wreck's bulkheads to its 2.2 m deckhead while every shipped area's plan and walls are what they were, to the byte.
import { assert } from './helpers.mjs';
import { golden, goldenDigest } from './golden.mjs';
import { validateArea } from '../src/sim/places/validate.js';
import { planOf, wallsOf, WALL_H_M, CUT_H_M } from '../src/sim/places/plan.js';
import { CATALOGUE, mountOf, footprintOf, blocks } from '../src/sim/places/fixtures.js';
import { AREA_LIST } from '../src/sim/places/areas.js';
import { buildGrid, path } from '../src/sim/places/nav.js';
import { standOk } from '../src/sim/places/collide.js';
import { sectorOf } from '../src/sim/combat/room.js';
import { MAX_VIEW_M } from '../src/render/scale.js';
import { WRECK, WRECK_ID, WRECK_DECKS, WRECK_DECK_M, WRECK_CEILING_M, WRECK_TRUNK, WRECK_HATCHES, WRECK_SET_A, WRECK_SPOTS, BOARD_OFF_FACE_M, HATCH_W_M } from '../src/data/places/wreck.js';
import { WRECK_PLANS, WRECK_ORDER } from '../src/data/places/wreck-plans.js';
import { SITE_LIST } from '../src/data/places/sites.js';
import { deriveWreck } from '../tools/derive-plans.mjs';

const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;
const onGrid = (v, step) => near(Math.round(v / step) * step, v, 1e-6);
const inRect = ([x0, z0, x1, z1], x, z, e = 1e-6) => x >= x0 - e && x <= x1 + e && z >= z0 - e && z <= z1 + e;
const roomRec = (id) => WRECK.rooms.find(r => r.id === id);
const FACES = ['deck', 'deckhead', 'dorsal', 'ventral', 'port', 'starboard'];
// (a stand's base distance from its face: the deck and the deckhead are the plane itself; a bulkhead its room's edge)
function faceDist(st) {
  const [x0, z0, x1, z1] = roomRec(st.room).rect, [x, z] = st.base;
  return { deck: 0, deckhead: 0, dorsal: Math.abs(z - z0), ventral: Math.abs(z - z1), port: Math.abs(x - x0), starboard: Math.abs(x - x1) }[st.onFace];
}
// (the area with the deck 5 scuttle open: a blocker its size, as a walker would meet the hole; the template stops nobody)
const openScuttle = () => ({ ...WRECK, fixtures: WRECK.fixtures.map(f => (f.id === WRECK_TRUNK.ends[0].fixture ? { ...f, block: true } : f)) });

/** Every shipped area's plan and walls (all but the Wreck), digested: pinned on the snapshot's plan.js (v0.0.24's), before this round. */
export const SHIPPED_WALLS = '1332b0a4de7447';

export default [
  {
    name: 'the Wreck validates by PLACES §9.6\'s rules, is listed on the School\'s site and in AREA_LIST, and every room is a room of deck 5 or 6 inside its deck\'s 9.2 × 7.2 m from its origin, on the 0.1 m grid, 2.2 m clear and plate on every face',
    fn() {
      const r = validateArea(WRECK);
      console.log(`      validate: ${r.ok ? 'ok' : 'FAILED'}; ${JSON.stringify(r.counts)}`);
      assert(r.ok, JSON.stringify(r.problems));
      const site = SITE_LIST.find(x => x.id === WRECK.site);
      assert(site?.areas.includes(WRECK_ID) && AREA_LIST.includes(WRECK), 'the Wreck is not listed');
      const bad = [];
      for (const rm of WRECK.rooms) {
        const D = WRECK_DECKS[rm.deck], [x0, z0, x1, z1] = rm.rect;
        if (!D) { bad.push(`${rm.id}: deck ${rm.deck}`); continue; }
        if (!rm.id.startsWith(`wk.d${rm.deck}.`)) bad.push(`${rm.id}: not named for deck ${rm.deck}`);
        if (!inRect(D.rect, x0, z0) || !inRect(D.rect, x1, z1)) bad.push(`${rm.id}: outside deck ${rm.deck}`);
        if (![x0, z0, x1, z1].every(v => onGrid(v, 0.1))) bad.push(`${rm.id}: off the 0.1 m grid`);
        if (rm.ceilingM !== WRECK_CEILING_M || rm.surface !== 'plateGrid') bad.push(`${rm.id}: ${rm.ceilingM} m, ${rm.surface}`);
      }
      for (const n of [5, 6]) {
        const D = WRECK_DECKS[n];
        if (!near(D.rect[2] - D.rect[0], WRECK_DECK_M[0]) || !near(D.rect[3] - D.rect[1], WRECK_DECK_M[1]) || !near(D.rect[0], D.origin[0]) || !near(D.rect[1], D.origin[1])) bad.push(`deck ${n}'s rect ${JSON.stringify(D.rect)}`);
        const area = WRECK.rooms.filter(rm => rm.deck === n).reduce((a, rm) => a + (rm.rect[2] - rm.rect[0]) * (rm.rect[3] - rm.rect[1]), 0);
        console.log(`      deck ${n} (${D.name}): origin ${JSON.stringify(D.origin)}, ${WRECK.rooms.filter(rm => rm.deck === n).length} rooms, ${area.toFixed(2)} m² of ${(WRECK_DECK_M[0] * WRECK_DECK_M[1]).toFixed(2)}`);
        if (!near(area, WRECK_DECK_M[0] * WRECK_DECK_M[1], 1e-6)) bad.push(`deck ${n}'s rooms tile ${area} m²`);
      }
      // (the 0.25 m grid the sheet names would make PLACES §5.4's 9.2 × 7.2 m deck 9.25 × 7.25: the deck's own numbers win, on the 0.1 m grid)
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'the trunk\'s two ends are offset by exactly the decks\' origins, each in its room with its scuttle (deck 5\'s in the deck, deck 6\'s in the deckhead), and the decks lie farther apart than the stage\'s widest window (MAX_VIEW_M), so one is never in the other\'s picture',
    fn() {
      const [a, b] = WRECK_TRUNK.ends, off = [b.at[0] - a.at[0], b.at[1] - a.at[1]], dOrg = [WRECK_DECKS[6].origin[0] - WRECK_DECKS[5].origin[0], WRECK_DECKS[6].origin[1] - WRECK_DECKS[5].origin[1]];
      const gap = WRECK_DECKS[6].rect[0] - WRECK_DECKS[5].rect[2] - 2 * 0.3;
      console.log(`      ends ${JSON.stringify(a.at)} (deck ${a.deck}, ${a.face}) and ${JSON.stringify(b.at)} (deck ${b.deck}, ${b.face}); offset ${JSON.stringify(off)}, the origins' ${JSON.stringify(dOrg)}; the gap between the decks' outer walls ${gap.toFixed(2)} m against the widest window ${MAX_VIEW_M[0]} m`);
      assert(near(off[0], dOrg[0]) && near(off[1], dOrg[1]), JSON.stringify({ off, dOrg }));
      assert(a.deck === 5 && a.face === 'deck' && b.deck === 6 && b.face === 'deckhead', JSON.stringify(WRECK_TRUNK.ends));
      for (const e of [a, b]) {
        const f = WRECK.fixtures.find(x => x.id === e.fixture);
        assert(f && f.kind === 'scuttle' && mountOf(f) === e.face && near(f.x, e.at[0]) && near(f.z, e.at[1]) && f.room === e.room && inRect(roomRec(e.room).rect, ...e.at), JSON.stringify({ e, f }));
      }
      assert(gap > MAX_VIEW_M[0], `the decks are ${gap} m apart, within the ${MAX_VIEW_M[0]} m window`);
      assert(WRECK_TRUNK.state === 'dogged' && WRECK_TRUNK.area === WRECK_ID, JSON.stringify(WRECK_TRUNK));
    },
  },
  {
    name: 'every bulkhead hatch is the house\'s door dressed as a hatch: a leafed door 0.8 m wide, its coaming 0.3 m, four dogs, locked (dogged), its two rooms on one deck either side of its line, its middle on the hold lattice (0.75 m + 1.5 m k); the four the cadre dogged for good and the lock\'s, dogged until he comes aboard through it at Stop, never offered (the review of C and D)',
    fn() {
      const bad = [], lines = [];
      for (const h of WRECK_HATCHES) {
        const mid = h.axis === 'x' ? (h.a + h.b) / 2 : (h.a + h.b) / 2, decks = h.rooms.map(id => roomRec(id)?.deck);
        if (h.kind !== 'door' || h.leaf !== 'hatch' || !h.lock || h.dogs !== 4 || h.coamingM !== 0.3 || h.state !== 'closed' || !h.swing) bad.push(`${h.id}: ${JSON.stringify(h)}`);
        if (!near(h.b - h.a, HATCH_W_M)) bad.push(`${h.id}: ${h.b - h.a} m wide`);
        if (!onGrid(mid - 0.75, 1.5)) bad.push(`${h.id}: its middle ${mid} off the lattice`);
        if (decks[0] !== decks[1] || !decks[0]) bad.push(`${h.id}: decks ${decks}`);
        lines.push(`${h.id} ${mid}${h.offered === false ? ' (dogged for good)' : ''}`);
      }
      console.log(`      ${WRECK_HATCHES.length} hatches: ${lines.join(', ')}`);
      const offered = WRECK_HATCHES.filter(h => h.offered !== false).map(h => h.id);
      assert(!bad.length, bad.join('; '));
      assert(JSON.stringify(offered) === JSON.stringify(['o:wk:d5:cell-2', 'o:wk:d5:cell-5', 'o:wk:d6:store']), JSON.stringify(offered));
    },
  },
  {
    name: 'every standing fixture stands deck to deckhead (one grid serves both faces), the mounted ones (the scuttles, the 1MC\'s speakers) stop nobody and hide nobody, and every compartment the lane enters has a speaker on its deckhead',
    fn() {
      const bad = [], kinds = {};
      for (const f of WRECK.fixtures) {
        const K = CATALOGUE[f.kind], m = mountOf(f);
        kinds[f.kind] = (kinds[f.kind] ?? 0) + 1;
        if (m) { if (blocks(f) || !['deck', 'deckhead'].includes(m)) bad.push(`${f.id}: mounted ${m}, blocks ${blocks(f)}`); continue; }
        if (K.h < WRECK_CEILING_M - 1e-9) bad.push(`${f.id}: ${K.h} m high`);
      }
      const rooms = ['wk.d5.passage', 'wk.d5.cell-2', 'wk.d5.cell-5', 'wk.d6.hold', 'wk.d6.store', 'wk.d6.lock'];
      const noSpeaker = rooms.filter(r => !WRECK.speakers.some(sp => sp.room === r));
      console.log(`      fixtures ${JSON.stringify(kinds)}; speakers ${WRECK.speakers.length} (${WRECK.speakers.map(sp => sp.room).join(', ')}), y ${WRECK.speakers[0].y} m`);
      assert(!bad.length, bad.join('; '));
      assert(!noSpeaker.length && WRECK.speakers.every(sp => sp.y < WRECK_CEILING_M && sp.y > WRECK_CEILING_M - 0.2 && inRect(roomRec(sp.room).rect, sp.x, sp.z)), JSON.stringify({ noSpeaker, sp: WRECK.speakers }));
    },
  },
  {
    name: 'set A: ten stands of the house\'s form (the leg\'s number and a letter) in their legs\' compartments, every face met, each base within 0.1 m of its face and inside its room, a bulkhead\'s board 0.9 m out from it, each slot the one its plan\'s sectors give it',
    fn() {
      const bad = [], faces = new Set(), lines = [];
      for (const st of WRECK_SET_A) {
        const leg = Number(st.stand[0]), P = WRECK_PLANS.plans[WRECK_ORDER[leg - 1]], rm = roomRec(st.room);
        faces.add(st.onFace);
        if (!/^[1-9][a-z]$/.test(st.stand)) bad.push(`${st.stand}: not of the house's form`);
        if (!P || !P.parts.includes(st.room)) bad.push(`${st.stand}: not in leg ${leg}'s compartment (${st.room})`);
        if (!FACES.includes(st.onFace)) bad.push(`${st.stand}: face ${st.onFace}`);
        const d = faceDist(st);
        if (!(d <= 0.1 + 1e-9)) bad.push(`${st.stand}: base ${d} m off its face`);
        if (!inRect(rm.rect, ...st.base) || !inRect(rm.rect, ...st.at)) bad.push(`${st.stand}: outside ${st.room}`);
        const out = Math.hypot(st.at[0] - st.base[0], st.at[1] - st.base[1]), want = ['deck', 'deckhead'].includes(st.onFace) ? 0 : BOARD_OFF_FACE_M;
        if (!near(out, want)) bad.push(`${st.stand}: board ${out} m out`);
        const slot = P ? sectorOf(P, ...st.at) : null;
        if (slot !== st.slot) bad.push(`${st.stand}: slot ${st.slot}, its sectors give ${slot}`);
        if (st.onFace === 'deckhead' && !(st.y > 0.45 && st.y < WRECK_CEILING_M)) bad.push(`${st.stand}: y ${st.y} on the deckhead`);
        lines.push(`${st.stand} ${st.name} ${st.onFace}${st.pop ? ' pop-up' : ''} ${st.role} #${st.slot}`);
      }
      console.log(`      ${lines.join('; ')}`);
      console.log(`      faces met: ${[...faces].join(', ')}`);
      assert(WRECK_SET_A.length === 10 && FACES.every(f => faces.has(f)), `faces ${[...faces]}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'the plans: four legs and no hall\'s (cell 2, cell 5, the hold through the trunk, the store); the three bulkhead hatches\' plans equal what the deriver gives today, field for field; the hold\'s authored with no door, its gate across the scuttle, its paths on deck 6 from the landing',
    async fn() {
      const { plans, lines } = await deriveWreck();
      for (const l of lines) console.log(`      ${l}`);
      const stale = [];
      for (const [id, P] of Object.entries(plans)) for (const [k, v] of Object.entries(P)) if (JSON.stringify(v) !== JSON.stringify(WRECK_PLANS.plans[id]?.[k])) stale.push(`${id} ${k}`);
      assert(!stale.length, `stale: ${stale.join(', ')} (node tools/derive-plans.mjs --wreck --write)`);
      assert(WRECK_PLANS.lane === 'W' && WRECK_PLANS.area === WRECK_ID && WRECK_PLANS.order.length === 4 && !WRECK_PLANS.order.includes('hall'), JSON.stringify(WRECK_PLANS.order));
      const H = WRECK_PLANS.plans[WRECK_TRUNK.id], off = WRECK_DECKS[6].origin[0] - WRECK_DECKS[5].origin[0];
      console.log(`      the hold: gate ${JSON.stringify(H.gate)}, stack ${JSON.stringify(H.stack)}, points ${JSON.stringify(H.points)}, hot ${H.hot.length}`);
      assert(H.door === null && H.hatch === WRECK_TRUNK.id && H.gate && H.paths[1][0][0] === H.stack[0][0] + off && H.paths[2][0][0] === H.stack[1][0] + off, JSON.stringify(H));
      for (const k of WRECK_ORDER) {
        const P = WRECK_PLANS.plans[k], deckOf = (x) => (x >= WRECK_DECKS[6].rect[0] ? 6 : 5);
        for (const sl of [1, 2]) assert(P.paths[sl].every(p => deckOf(p[0]) === deckOf(P.paths[sl][0][0])), `${k}: path ${sl} crosses the decks`);
      }
    },
  },
  {
    name: 'every point the lane walks is standable on the C0 grid and routed: the start to each stack, through each hatch to each point, the store\'s and the lock\'s from the hold; with the scuttle open it cuts the passage (0.2 m either side of its 0.8 m), and nothing the lane needs on deck 5 after it opens lies beyond it',
    fn() {
      const g = buildGrid(WRECK, 'C0', { closed: () => false }), gOpen = buildGrid(openScuttle(), 'C0', { closed: () => false });
      const bad = [], lens = [];
      // (standable by the walker's own rule, collide.js standOk: the body's circle on the floor and clear of every blocker, every door open)
      const pts = (P) => [...P.stack, ...P.points, P.threshold, ...P.paths[1], ...P.paths[2]];
      const legClear = (a, b) => { const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.05)); for (let i = 0; i <= n; i++) if (!standOk(g, a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n)) return false; return true; };
      let nPts = 0, nLegs = 0;
      for (const k of WRECK_ORDER) for (const p of pts(WRECK_PLANS.plans[k])) { nPts++; if (!standOk(g, ...p)) bad.push(`${k}: ${JSON.stringify(p)} not standable`); }
      for (const k of WRECK_ORDER) for (const sl of [1, 2]) { const Pp = WRECK_PLANS.plans[k].paths[sl]; for (let i = 1; i < Pp.length; i++) { nLegs++; if (!legClear(Pp[i - 1], Pp[i])) bad.push(`${k} path ${sl} leg ${i} not clear`); } }
      console.log(`      ${nPts} plan points standable, ${nLegs} path legs clear every 0.05 m (C0, every door open)`);
      const route = (grid, from, to, why) => { const r = path(grid, from, to); if (r.fail) bad.push(`${why}: ${r.fail}`); else lens.push(`${why} ${r.lengthM} m`); return r; };
      const S = [WRECK_SPOTS.start.x, WRECK_SPOTS.start.z], P = WRECK_PLANS.plans, T = P[WRECK_TRUNK.id];
      // (the scuttle shut: deck 5's lane from the start; deck 6's from the landing; the cadre from the lock)
      route(g, S, P['o:wk:d5:cell-2'].stack[0], 'start → cell 2\'s stack');
      route(g, P['o:wk:d5:cell-2'].stack[0], P['o:wk:d5:cell-5'].stack[0], 'cell 2 → cell 5\'s stack');
      route(g, P['o:wk:d5:cell-5'].stack[0], T.stack[0], 'cell 5 → the trunk\'s #1');
      route(g, P['o:wk:d5:cell-5'].stack[1], T.stack[1], 'cell 5 → the trunk\'s #2');
      route(g, T.paths[1][0], P['o:wk:d6:store'].stack[0], 'the landing → the store\'s stack');
      route(g, [WRECK_SPOTS.cadreIn.x, WRECK_SPOTS.cadreIn.z], T.points[0], 'the lock → the plant');
      // (the scuttle open: each man at his own coaming, and the passage cut between them; the rest of deck 5 out of the lane)
      const cut = path(gOpen, T.stack[0], T.stack[1]);
      console.log(`      the passage's free width either side of the open scuttle ${((1.2 - 0.16 - 0.8) / 2).toFixed(2)} m (0.2 m to the walls' lines, 0.12 m to their faces), against a C0 body's 0.54 m; a C0 walker from #1's coaming to #2's: ${cut.fail ?? `${cut.lengthM} m`}`);
      for (const p of T.stack) if (!standOk(gOpen, ...p)) bad.push(`the trunk's stack ${JSON.stringify(p)} not standable with the scuttle open`);
      console.log(`      ${lens.join('; ')}`);
      assert(cut.fail === 'blocked', `the open scuttle leaves a way past it: ${JSON.stringify(cut.pts)}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'the cutaway stands the Wreck\'s dorsal, port and starboard bulkheads of each deck to its 2.2 m deckhead (look.wallsToCeiling, its decks\' boxes), the rest cut to 1.0 m; every shipped area\'s plan and walls are the snapshot\'s, to the byte',
    fn() {
      const W = wallsOf(planOf(WRECK)), stand = W.filter(w => w.side && w.side !== 's'), cut = W.filter(w => !w.side || w.side === 's');
      const sides = stand.map(w => `${w.side}@${w.at}`);
      console.log(`      the Wreck: ${W.length} runs, ${stand.length} standing (${sides.join(', ')}) at ${[...new Set(stand.map(w => w.h))].join(', ')} m, ${cut.length} cut at ${[...new Set(cut.map(w => w.h))].join(', ')} m`);
      assert(stand.length === 6 && stand.every(w => w.h === WRECK_CEILING_M) && cut.every(w => w.h === CUT_H_M), JSON.stringify(stand));
      for (const n of [5, 6]) { const [x0, , x1] = WRECK_DECKS[n].rect; assert(['w', 'e'].every(sd => stand.some(w => w.side === sd && w.at === (sd === 'w' ? x0 : x1))), `deck ${n}'s side bulkheads not standing`); }
      const shipped = AREA_LIST.filter(a => a.id !== WRECK_ID);
      const all = shipped.map(a => ({ id: a.id, plan: JSON.parse(JSON.stringify(planOf(a))), walls: wallsOf(planOf(a)) }));
      console.log(`      ${shipped.length} shipped areas (${shipped.map(a => a.id).join(', ')}): ${goldenDigest(all)}, every standing run ${[...new Set(all.flatMap(x => x.walls.filter(w => w.side && w.side !== 's').map(w => w.h)))].join(', ')} m`);
      golden('every shipped area\'s plan and walls (v0.0.24\'s snapshot)', all, SHIPPED_WALLS);
      assert(all.every(x => !('wallsToCeiling' in x.plan) && !('boxes' in x.plan)) && WALL_H_M === 2.8, 'a shipped plan carries the Wreck\'s fields');
    },
  },
];
