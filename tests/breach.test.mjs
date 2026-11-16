// OLYMPUS tests: a door's ways in by its swing and the kit, and the stack's safe points for a charge (COMBAT §25.5.6, §25.20; PLACES §1.6; the build sheet 0.0.18 §5.3; src/sim/combat/breach.js).
//
// The user, 2026-11-15: "doors should have a direction they open (pull or push) and it should affect our options for entry".
// Room 1, room 3 and the booth open away from the hall (push), room 2 toward it (pull), the closet is a push door from room 2,
// locked. Each test fails without breach.js.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { entryOptions, safePointsOf, chargePointOf, kitHas, NOT_ISSUED } from '../src/sim/combat/breach.js';
import { planOf, doorSwing } from '../src/sim/combat/bundle.js';
import { openingOf, areaOf, roomOf } from '../src/sim/places/model.js';
import { KICK_PULL_WHY, STACK_OFF_WALL_M } from '../src/sim/places/swing.js';

const house = (loadout = null) => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go', ...(loadout ? { loadout } : {}) });
const fmtO = (opts) => opts.map(o => `${o.id}${o.live ? '' : ` (${o.off})`}`).join(', ');

export default [
  {
    name: 'a door\'s entry options follow its swing and the kit (the user, 2026-11-15): room 1 and room 3 push (Open, Kick, Pry, Charge), room 2 pull (Open, Pry; Kick, Ram and Charge struck "opens toward you"), the closet locked (Open struck "locked", a charge not on an inner door), anything not carried struck "not issued"',
    fn() {
      const bad = [];
      for (const lo of ['standard', 'full', 'v1~front:mag2,mag2,dump~back:ram']) {
        const g = house(lo), s = g.state, pid = s.player.id, line = [];
        for (const d of ['o:w4:r1', 'o:w4:r2', 'o:w4:r3']) {
          const P = planOf(s, d), O = entryOptions(s, pid, P), get = (id) => O.find(o => o.id === id);
          line.push(`${d.slice(5)} ${doorSwing(s, P).how}: ${fmtO(O)}`);
          const pull = doorSwing(s, P).how === 'pull';
          if (!get('open').live) bad.push(`${lo} ${d} open`);
          if (pull && (get('kick').live || get('kick').off !== KICK_PULL_WHY)) bad.push(`${lo} ${d} kick`);
          if (!pull && !get('kick').live) bad.push(`${lo} ${d} kick on a push`);
          if (lo === 'standard' && (get('pry').off !== NOT_ISSUED || get('charge').off !== 'no charge issued' || get('flash').off !== NOT_ISSUED)) bad.push(`${lo} ${d} the kit`);
          if (lo === 'full' && (!get('pry').live || get('charge').live === pull || (pull && get('charge').off !== KICK_PULL_WHY) || !get('flash').live)) bad.push(`${lo} ${d} full`);
          if (lo.includes('ram') && (get('ram').live === pull || (pull && get('ram').off !== KICK_PULL_WHY))) bad.push(`${lo} ${d} ram`);
        }
        const P2 = planOf(s, 'o:w4:r2'), C = entryOptions(s, pid, { ...P2, door: 'o:w4:closet' }, { from: P2.room });
        line.push(`closet ${doorSwing(s, { ...P2, door: 'o:w4:closet' }, P2.room).how}: ${fmtO(C)}`);
        if (C.find(o => o.id === 'open').off !== 'locked' || (lo === 'full' && (!C.find(o => o.id === 'pry').live || C.find(o => o.id === 'charge').live))) bad.push(`${lo} the closet`);
        console.log(`      ${lo}: ${line.join(' | ')}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'the stack\'s safe points for a charge stand on the latch-side wall at least the stand-off from it, never across the hall from the door nor in line with it, inside the hall, for every lane door',
    fn() {
      const g = house('breach'), s = g.state, A = areaOf(s.places.live.area), bad = [], rows = [];
      for (const d of ['o:w4:r1', 'o:w4:r3']) {
        const P = planOf(s, d), sp = safePointsOf(s, P, 'sc1'), o = openingOf(d), sw = doorSwing(s, P), c = chargePointOf(s, P);
        const along = (p) => (o.axis === 'x' ? p[0] : p[1]), across = (p) => (o.axis === 'x' ? p[1] : p[0]);
        const latchDir = Math.sign(along(sw.latchXZ) - along(sw.hingeXZ)), side = Math.sign(across(P.stack[0]) - o.at);
        for (const [who, p] of [['#1', sp.one], ['#2', sp.two]]) {
          const dM = Math.hypot(p[0] - c[0], p[1] - c[1]), inLine = along(p) >= Math.min(o.a, o.b) && along(p) <= Math.max(o.a, o.b);
          const latchSide = Math.sign(along(p) - along(sw.latchXZ)) === latchDir, ourSide = Math.sign(across(p) - o.at) === side, wall = Math.abs(across(p) - o.at);
          const room = roomOf(A, p[0], p[1])?.id;
          rows.push(`${d.slice(5)} ${who} (${p.join(', ')}) ${fmt(dM, 2)} m from the charge, ${fmt(wall, 2)} m off the wall, ${sp.kPa[who === '#1' ? 'one' : 'two']} kPa`);
          if (dM < sp.standoffM - 0.001 || inLine || !latchSide || !ourSide || room !== 'w4.hall' || Math.abs(wall - STACK_OFF_WALL_M) > 0.01) bad.push(`${d} ${who}`);
        }
        if (sp.short) bad.push(`${d} short`);
      }
      console.log(`      stand-off ${fmt(safePointsOf(s, planOf(s, 'o:w4:r1')).standoffM, 2)} m: ${rows.join(' | ')}`);
      assert(!bad.length, bad.join('; '));
      assert(kitHas(s, s.player.id, 'charge') && kitHas(s, s.player.id, 'halligan') && !kitHas(s, s.player.id, 'flashbang') && !kitHas(s, s.player.id, 'ram'), 'the breach kit');
    },
  },
];
