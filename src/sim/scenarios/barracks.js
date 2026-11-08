// OLYMPUS scenarios: the barracks, a career's first ground: Echo Company drawn from the world's seed, the player in 1st Squad's bay (ROADMAP §4.1's 0.0.4 row; the 0.0.3 build sheet §2.2).
//
// The scenario's fill, run by newGame after every domain's init and after the clock has moved to the
// start's hour (the sheet §8, item 20: so a start at 23:00 finds the squad asleep): the roster
// (src/sim/people/roster.js rollRoster, 144 people), the player drawn into the billet it left
// (fillPlayer: rifleman, 2nd fire team, 1st Squad, 2nd Platoon, the next id after the roster), their
// actor at their berth's foot (the rack's spot #1) facing down, or at `at` ({ area, x, z, face }: the
// URL's start, a bench scene's), Base Melas entered on that area, and the live area's actors made
// (syncActors: the squad and the fire watch at their whereIs, behind the first cut). A test world has
// no career (career: null, ROADMAP §2.1): the enlistment paper (0.0.13) is what makes this a career.
import { nextId } from '../../core/ids.js';
import { areaOf, enterSite } from '../places/model.js';
import { seatOf, spotsOf } from '../places/fixtures.js';
import { rollRoster, fillPlayer } from '../people/roster.js';
import { syncActors } from '../people/place.js';
import { STARTS } from '../../data/scenes.js';

/** Where the barracks plays (its site its start's host, src/data/scenes.js STARTS). */
export const BARRACKS = Object.freeze({ site: STARTS.barracks.host.site, area: 'melas.echo.1' });

// (where the player starts: their berth's foot facing down, else the area's spawn)
function startOf(state, pid) {
  const seat = state.people[pid]?.berthId ? seatOf(state.people[pid].berthId) : null;
  const rack = seat ? areaOf(seat.area)?.fixtures?.find(f => f.id === seat.fixture) : null;
  const foot = rack ? spotsOf(rack)[0] : null;
  if (foot) return { area: seat.area, x: foot.x, z: foot.z, face: 'down' };
  const spawn = areaOf(BARRACKS.area)?.spawn;
  return { area: BARRACKS.area, x: spawn?.x ?? 0, z: spawn?.z ?? 0, face: spawn?.face ?? 'down' };
}

/** Fill a new state with the barracks (see the header). at: { area, x, z, face } to start elsewhere. */
export function barracks(state, { at = null } = {}) {
  rollRoster(state);
  const pid = fillPlayer(state);
  const start = at ? { ...startOf(state, pid), ...at } : startOf(state, pid);
  const aid = nextId(state, 'a');
  state.actors.list = [{ id: aid, who: pid, x: start.x, z: start.z, face: start.face ?? 'down', gait: 'idle', strideM: 0 }];
  Object.assign(state.player, { id: pid, actor: aid, waypoint: state.player.waypoint ?? null, presets: state.player.presets ?? {}, keeps: state.player.keeps ?? {} });
  enterSite(state, BARRACKS.site, start.area);
  syncActors(state);
  return state;
}
