// OLYMPUS tests: the house's assembly, set or drawn (the build sheet v0.0.21 §1 item 1, §6; house lens H1, H2).
//
// Stage 0's case (§3 step 5): the set's spec, area and plans are HOUSE1, WHEEL_S4 and X4_PLANS.A, the same objects, whether
// read with a game's state or none, so every reader of the seam (scenes/assemble.js houseSpecOf, planSetOf, plansOfArea,
// houseCodeOf) is the set's to the byte; nothing is written for it (R.house.draw absent: "absent means default"). The drawn
// house's cases (A's, v0.0.21 §6): assembleHouse of layout A's code gives WHEEL_S4, X4_PLANS.A and HOUSE1 field for field once
// its `~<v>` ids are mapped back (fails on a wrong transform, a wrong chunk plan or a hall leg not derived as A's); a drawn door
// opens and closes through setOpening (fails without model.js openingArea's fallback: "no opening"); a drawn save loads into an
// empty registry and carries on byte for byte (fails without the places domain's 'places:gen' upgrade); an unknown `~` id is null,
// never a throw; and the registry keeps HOUSE_REG_KEEP layouts, the third evicted from every cache it fed, and brought back on a
// read (fails without the eviction: three areas held).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { HOUSE1, WHEEL_S4 } from '../src/data/places/wheel.js';
import { X4_PLANS } from '../src/data/places/x4-plans.js';
import { houseSpecOf, planSetOf, plansOfArea, houseCodeOf, assembleHouse, registerHouse, heldLayouts, areaIdOf, resetCaches as resetHouses, HOUSE_CODE_SET, HOUSE_REG_KEEP } from '../src/sim/scenes/assemble.js';
import { areaOf, openingOf, openingArea, setOpening, openingState, generatedIds, resetCaches as resetRegistry } from '../src/sim/places/model.js';
import { zonesOf } from '../src/sim/places/zones.js';
import { houseBot } from './bots/house.mjs';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { houseLook } from '../src/sim/scenarios/shoothouse.js';

export default [
  {
    name: 'stage 0, as set: the spec, the area and the plans are HOUSE1, WHEEL_S4 and X4_PLANS.A, the same objects, with a lane\'s state or none; the code \'A\'; nothing written for it (R.house.draw absent); the look carries HOUSE1 to the stage',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), s = g.state, H = s.armoury.range.house;
      const checks = {
        spec: houseSpecOf(s) === HOUSE1 && houseSpecOf(null) === HOUSE1,
        area: areaOf(houseSpecOf(s).area) === WHEEL_S4 && s.places.live.area === WHEEL_S4.id,
        plans: planSetOf(s) === X4_PLANS.A && planSetOf(null) === X4_PLANS.A && lanePlanOf(s).area === X4_PLANS.A.area,
        byArea: plansOfArea(WHEEL_S4.id).length === 1 && plansOfArea(WHEEL_S4.id)[0] === X4_PLANS.A && plansOfArea('nowhere').length === 0,
        code: houseCodeOf(s) === HOUSE_CODE_SET && HOUSE_CODE_SET === 'A',
        absent: H && !('draw' in H) && !('gen' in (s.places.live ?? {})),
        look: houseLook(s)?.spec === HOUSE1,
        notDrawn: assembleHouse(HOUSE_CODE_SET) === null,
      };
      console.log(`      ${Object.entries(checks).map(([k, v]) => `${k} ${v ? 'yes' : 'NO'}`).join(', ')}; the lane's plan ${lanePlanOf(s).order.join(' → ')} in ${lanePlanOf(s).area}`);
      assert(Object.values(checks).every(Boolean), JSON.stringify(checks));
    },
  },
  {
    name: "the drawn house, layout A's code: assembleHouse('Cn290pc.Ks206lc.En175pc') gives WHEEL_S4's rooms, openings, fixtures, zones and look, X4_PLANS.A's four plans and HOUSE1's stands and fixed parts field for field once its ~<v> ids are mapped back (the stands' slot is the fill's, by sectorOf, and their faces the cast's)",
    fn() {
      const H = assembleHouse('Cn290pc.Ks206lc.En175pc'), ic = H.area.code;
      const back = (v) => JSON.parse(JSON.stringify(v).split(ic).join('w4').split(H.area.id).join(WHEEL_S4.id));
      const sortK = (v) => (Array.isArray(v) ? v.map(sortK) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortK(v[k])])) : v);
      const eq = (a, b) => JSON.stringify(sortK(a)) === JSON.stringify(sortK(b));
      const A = back(H.area), P = back(H.plans), S = back(H.spec), off = [];
      for (const k of ['rooms', 'openings', 'fixtures', 'zones', 'look', 'gravity', 'boundsM', 'spawn', 'site', 'kind', 'name']) if (!eq(A[k], WHEEL_S4[k])) off.push(`area.${k}`);
      for (const k of X4_PLANS.A.order) if (!eq(P.plans[k], X4_PLANS.A.plans[k])) off.push(`plan ${k}: ${Object.keys(X4_PLANS.A.plans[k]).filter(f => !eq(P.plans[k][f], X4_PLANS.A.plans[k][f])).join(', ')}`);
      if (!eq(P.order, X4_PLANS.A.order) || P.lane !== 'A') off.push('order');
      for (const s0 of HOUSE1.stands) {
        const d = S.stands.find(x => x.stand === s0.stand), f = Object.keys(s0).filter(k => k !== 'slot' && k !== 'faces' && !eq(s0[k], d?.[k]));
        if (f.length || !s0.faces.includes(d.faces[0])) off.push(`stand ${s0.stand}: ${f.join(', ')}`);
      }
      for (const k of ['start', 'two', 'zones', 'catwalk', 'booth', 'hall', 'rect', 'face', 'standPiece', 'area', 'lane']) if (!eq(S[k], HOUSE1[k])) off.push(`spec.${k}`);
      console.log(`      ${H.code} → ${H.area.id}: ${A.rooms.length} rooms, ${A.openings.length} openings, ${A.look.lamps.length} lamps, ${X4_PLANS.A.order.length} plans, ${S.stands.length} stands; fields off ${off.length}${off.length ? `: ${off.join('; ')}` : ''}`);
      assert(!off.length && H.code === 'Cn290pc.Ks206lc.En175pc|ftnanth|p010101', JSON.stringify({ off, code: H.code }));
    },
  },
  {
    name: 'the drawn house\'s doors open and close through setOpening (model.js openingArea\'s fallback: without it, "no opening"), and an unknown ~ id is null, never a throw',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', draw: 'drawn' }), s = g.state, L = lanePlanOf(s), door = L.order[0];
      const before = openingState(s, door);
      setOpening(s, door, before === 'open' ? 'closed' : 'open', { atMs: s.clock.ms });
      const mid = openingState(s, door);
      setOpening(s, door, before, { atMs: s.clock.ms });
      const after = openingState(s, door), area = openingArea(door)?.id ?? null;
      const unknown = { area: areaOf('melas.wheel.s4~0000000000000'), opening: openingOf('o:w4~0000000000000:r1'), openingArea: openingArea('o:w4~0000000000000:r1') };
      console.log(`      ${s.armoury.range.house.draw.code}: ${door} ${before} → ${mid} → ${after}, its area ${area}; the unknown ~ ids ${JSON.stringify(unknown)}`);
      assert(mid !== before && after === before && area === s.places.live.area && Object.values(unknown).every(v => v === null), JSON.stringify({ before, mid, after, area, unknown }));
    },
  },
  {
    name: 'a drawn save loads into an empty registry (the places domain\'s \'places:gen\' rebuilds its area from places.live.gen) and carries on byte for byte: 300 ticks by the house bot after the load equal 300 ticks unbroken',
    fn() {
      const mk = () => createGame({ scenario: 'test-shoothouse', seed: 1489397426, tier: 'sgt', draw: 'drawn' });
      const a = mk(), bot = houseBot({ mode: 'T' });
      a.step(900, bot);
      const save = a.save();
      a.step(300, bot);
      const want = a.digest(), b = mk();
      resetHouses(); resetRegistry();
      const empty = !areaOf(JSON.parse(save).places.live.area);
      b.load(save);
      const found = !!areaOf(b.state.places.live.area);
      b.step(300, houseBot({ mode: 'T' }));
      const got = b.digest();
      console.log(`      ${b.state.armoury.range.house.draw.code}: the registry empty before the load ${empty}, the area found after ${found}; the digests ${want} and ${got}`);
      assert(empty && found && want === got, JSON.stringify({ empty, found, want, got }));
    },
  },
  {
    name: `the registry keeps HOUSE_REG_KEEP ${HOUSE_REG_KEEP} drawn layouts: the third registered evicts the first from the registry and its zones' memo, and a read of the first's area brings it back the same field for field`,
    fn() {
      resetHouses();
      const codes = ['Cn290pc.Ks206lc.En175pc', 'Es280pc.Cn250pc.Kn160pc', 'Kn240lc.Es195pc.Cn160lc'], ids = codes.map(areaIdOf);
      const first = registerHouse(codes[0]), z0 = zonesOf(ids[0]);
      registerHouse(codes[1]); registerHouse(codes[2]);
      const held = heldLayouts(), reg = generatedIds();
      const again = areaOf(ids[0]), same = JSON.stringify(again) === JSON.stringify(first), newRecord = again !== first, z1 = zonesOf(ids[0]);
      console.log(`      registered ${codes.length}; held after the third ${held.length} (${held.map(id => id.split('~')[1]).join(', ')}), the registry ${reg.length}; the first brought back ${!!again}, the same fields ${same}, a new record ${newRecord}; its zones rebuilt ${z1 !== z0} (${z1.length})`);
      assert(held.length === HOUSE_REG_KEEP && reg.length === HOUSE_REG_KEEP && !held.includes(ids[0]) && !reg.includes(ids[0]) && same && newRecord && z1 !== z0 && z1.length === z0.length, JSON.stringify({ held, reg, same, newRecord }));
    },
  },
];
