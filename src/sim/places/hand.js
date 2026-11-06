// OLYMPUS places: R, what's at hand (VIEWS's R; the build sheet 0.0.3 §2.1, §8 item 15).
//
// R does what is at hand: the nearest door within DOOR_REACH_M 1.2 m of the player that a hand can
// turn, its middle in the player's facing half-plane (or so close the player stands in it), opened or
// closed; with none, 0.0.2's R, a wait of WAIT_MS (fifteen minutes, an outcome skip with mask D). Ties
// between doors at one distance go by cmpId (TECH §2.3.1). handOffer(state) says what R would do, for
// the HUD's instinct line ("R open the door") and the bots; it is null while time stands still or a
// skip runs (TIME §5.3, check 1), when R does nothing. On a ground the doors are the masses' doors that
// name an opening (Echo's outside doors: the same leaf as inside); a gate is not a hand's to open.
//
// The places domain's actions (domain.js): `hand` (R) does what handOffer says, and `door`
// ({ act: 'door', args: { id, to } }: 'open' | 'closed', or the other way when to is left out) turns
// one door whatever the reach, for tests and the debug handle. The page sends R as { act: 'hand', args:
// { want: 'door' | 'wait' } }, what its offer said when the key went down, and the action does nothing
// where the offer has changed kind by the tick (a door the walk carried out of reach does not become a
// fifteen-minute wait, nor a wait a door); plain 'hand' (tests, bots, a replay) does what handOffer says.
// The page asks for the wait twice (main.js: R once arms it, "R again: wait 15 min", and a second R
// within HAND_AGAIN_MS sends it), so R pressed a step short of a door, or just after walking through
// one, never waits by accident (v0.0.3's review: in Ironman that cannot be taken back).
import { isHeld } from '../../core/clock.js';
import { playerActor, playerId, cmpId } from '../../core/ids.js';
import { liveArea, openingOf, openingState } from './model.js';
import { toggleDoor, turns } from './doors.js';
import { WAIT_MS } from '../time/domain.js';

/** How far a hand reaches for a door, metres (my call). */
export const DOOR_REACH_M = 1.2;
/** Standing this close to a door's middle, it is at hand whichever way one faces, metres (my call). */
export const IN_DOOR_M = 0.3;
const FACE = Object.freeze({ down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] });
const WAIT_OFFER = Object.freeze({ act: 'hand', verb: 'wait', target: null, label: 'wait 15 min' });

// (the doors of an area a hand can turn, with their middles: a floor's leaves, a ground's masses' doors naming an opening)
function doorsOf(area) {
  if (area.kind === 'ground') return (area.massing ?? []).flatMap(m => m.doors.filter(d => d.opening).map(d => ({ id: d.opening, x: (d.a + d.b) / 2, z: d.z })));
  return (area.openings ?? []).filter(turns).map(o => ({ id: o.id, x: o.axis === 'x' ? (o.a + o.b) / 2 : o.at, z: o.axis === 'x' ? o.at : (o.a + o.b) / 2 }));
}

/** What R would do now: { act: 'hand', verb: 'open' | 'close' | 'wait', target, label } | null (see the header). */
export function handOffer(state) {
  if (!state || state.skip || isHeld(state)) return null;
  const me = playerActor(state), area = liveArea(state);
  if (!me || !area) return WAIT_OFFER;
  const [fx, fz] = FACE[me.face] ?? FACE.down;
  let best = null, bestD = Infinity;
  for (const d of doorsOf(area)) {
    const dx = d.x - me.x, dz = d.z - me.z, dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > DOOR_REACH_M || (dist > IN_DOOR_M && dx * fx + dz * fz <= 0)) continue;
    if (dist < bestD || (dist === bestD && cmpId(d.id, best.id) < 0)) { best = d; bestD = dist; }
  }
  if (!best) return WAIT_OFFER;
  const open = openingState(state, openingOf(best.id)) === 'open';
  return Object.freeze({ act: 'hand', verb: open ? 'close' : 'open', target: best.id, label: open ? 'close the door' : 'open the door' });
}

/** The `hand` action (R): what handOffer says, unless the page's want names the other kind (see the header). */
export function handAction(state, action, bus, ctx) {
  const offer = handOffer(state);
  if (!offer) return;
  const want = typeof action === 'object' ? action?.args?.want ?? null : null;
  if (want && (want === 'wait') !== (offer.verb === 'wait')) return;
  if (offer.verb === 'wait') { ctx.sim.beginSkip(state, { activity: 'wait', planMs: WAIT_MS, mask: 'D' }); return; }
  toggleDoor(state, offer.target, bus, { who: playerId(state) });
}

/** The `door` action ({ act: 'door', args: { id, to } }): one door turned, whatever the reach (tests, the debug handle). */
export function doorAction(state, action, bus) {
  const args = typeof action === 'object' ? action.args ?? {} : {};
  if (!args.id || state.skip || isHeld(state)) return;
  toggleDoor(state, args.id, bus, { who: playerId(state), to: args.to ?? null });
}
