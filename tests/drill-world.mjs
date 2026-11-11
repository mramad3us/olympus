// OLYMPUS tests: the drill role's house, lane A of the Wheel's house 1 at 1 G with a marine of a test sheet on its start mark, for the stepper, bundle, enter-and-clear and instinct-cqb suites until the scene's test-shoothouse is real (the build sheet 0.0.12 §1: "test against your own stub of a dependency until it is real").
//
// drillWorld(opts) is test-handling's bench (the R-7 in Condition 1 off safe, the real headless game) with a sheet of exact
// values (tests/specials-world.mjs exactSheet) and the weapons domain's rules layer stop motion's alone (DRILL_WEAPONS: the
// bay's range rules and the scene's house rules sleep, so this world tests the drill and nothing of the scene's), moved into the house's area (src/data/places/wheel.js WHEEL_S4, 'melas.wheel.s4': its
// 1 G is the area's, src/sim/places/env.js gravityAt; its concrete μ 0.6) onto HOUSE1's start mark, facing west, with the
// combat EVA suit worn (so the body carries the house's 25 ± 1.5 kg: the legs' push and brake read it, motion.js
// tractionOf), its test sheet's rung written as testSheet writes it, at low ready in Combat (actor.moveStance). The plans
// are the house's (src/sim/combat/room.js lanePlanOf, X4_PLANS.A). The range session is the bench's, its tower silent
// (no command, none next) and open (stop motion is refused on an ended session), its area the house's (R.area) and its turners the lane's stands
// (HOUSE1.stands as the scene's records, src/sim/arms/turners.js's shape: { key, lane, room, stand, name, slot, x, z, y,
// face, holds, trigger, turnAtMs, awayAtMs, hits, stoppedAtMs }), each facing away until a test turns it: 1a a threat
// with a rifle, 1b a threat, 2a the armoured, 2b a no-shoot with empty hands, 3a a threat, 3b the hostage, H a threat.
import { SHEETS, exactSheet } from './specials-world.mjs';
import { createGame } from './game.mjs';
import { testSheet } from '../src/sim/skills/templates.js';
import { put } from '../src/core/ids.js';
import { kitMassKg } from '../src/sim/arms/kit.js';
import { moveTo } from '../src/sim/places/portals.js';
import { HOUSE1 } from '../src/data/places/wheel.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { weaponsDomain } from '../src/sim/arms/domain.js';
import { enterStop, leaveStop, gunOn, stopRules, stopInput } from '../src/sim/arms/shooting.js';

/** The weapons domain with its input and rules layers stop motion's alone and no actors: the bench's bay rules (the firing point's box, uprange) and the scene's house (its input, actors and rules, read off R.house) sleep. */
export const DRILL_WEAPONS = Object.freeze({ ...weaponsDomain, fast: Object.freeze({ ...weaponsDomain.fast, input: (s, i, b, c) => stopInput(s, i, b, c), actors: () => {}, rules: (s, i, b, c) => stopRules(s, i, b, c) }) });

/** The faces and holds each stand shows in the drill's world (a threat's rifle; 2b's hands). */
const FACES = Object.freeze({ '1a': ['threat', 'rifle'], '1b': ['threat', 'rifle'], '2a': ['armoured', 'rifle'], '2b': ['noshoot', 'hands'], '3a': ['threat', 'pistol'], '3b': ['hostage', 'rifle'], H: ['threat', 'rifle'] });

/**
 * The fixture (see the header). opts: { seed, tier (a test sheet: 'recruit' … 'tierone'), at ({ x, z }: the start mark by
 * default), stance ('combat'), posture ('lowReady'), safe }. Returns pairsWorld's { g, s, pid, gunId, R } and lane (the plans),
 * T(stand) (a stand's turner record), me(), loadKg.
 */
export function drillWorld({ seed = 48213, tier = 'private', at = null, stance = 'combat', posture = 'lowReady', safe = false } = {}) {
  const sh = SHEETS[tier] ?? SHEETS.private;
  const g = createGame({ scenario: 'test-handling', seed, hour: 11, setup: 'bench', domains: { weapons: DRILL_WEAPONS } }), s = g.state, pid = s.player.id;
  // (the sheet's exact values (tests/specials-world.mjs exactSheet), the test sheet's own fitness (the legs read it), its rung)
  s.people[pid].skills = exactSheet({ wf: sh.wf, mrk: sh.mrk, wh: sh.wh, awr: sh.awr, rung: sh.rung });
  s.people[pid].skills.skills.fitness = testSheet(tier).skills.fitness;
  s.events = s.events.filter(e => e.kind !== 'range-cmd');
  if (s.stop) leaveStop(s, g.bus, 'scene');
  // (the combat EVA suit worn, so the body carries the house's kit, as 'house-cqb' would)
  put(s, s.items, 'it:drill-suit', { id: 'it:drill-suit', type: 'suit', model: 'ces-1' });
  s.people[pid].kit.worn.suit = 'it:drill-suit';
  const start = at ?? HOUSE1.start;
  moveTo(s, g.me().id, { area: HOUSE1.area, x: start.x, z: start.z, face: 'left' }, null, { why: 'test' });
  const me = g.me();
  me.headRad = Math.PI; me.face = 'left'; me.moveStance = stance; delete me.v; delete me.stance;
  const R = s.armoury.range;
  R.area = HOUSE1.area; R.cmd = null; R.next = null; R.hot = true; R.end = null;
  R.turners = HOUSE1.stands.map(st => ({ key: st.key, lane: st.lane, room: st.room, stand: st.stand, name: st.name, slot: st.slot, x: st.x, z: st.z, y: st.y, face: FACES[st.stand][0], holds: FACES[st.stand][1],
    trigger: { ...st.trigger }, turnAtMs: null, awayAtMs: null, hits: [], stoppedAtMs: null, faceRad: st.faceRad }));
  const gunId = gunOn(s, pid), gun = s.items[gunId];
  gun.mode = safe ? 'safe' : 'semi';
  s.people[pid].kit.carry.posture = posture;
  enterStop(s, g.bus, { pid, gunId, via: 'shoot' });
  s.stop.pick = null; s.stop.aim = null;
  return { g, s, pid, gunId, R, lane: lanePlanOf(s), T: (stand) => R.turners.find(x => x.stand === stand), me: () => g.me(), loadKg: kitMassKg(s, pid) };
}
export { SHEETS, HOUSE1 };
