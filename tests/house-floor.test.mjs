// OLYMPUS tests: the shoot house's floor, the rest of R1 (COMBAT §25.19.10, §25.19.4's no-dead-end rules, §25.19.3.4, §25.19.3.5): Top up's "half or less" of the magazine's own load, the stall clock counting progress only, the rifle's frame by the walls' own line, a row's round held for its man.
//
// What each test pins, each failing without its fix (2026-11-12, the rework's R1):
//   - specials.js halfOrLess reads half the load the magazine went in with (the gun's belief fullN, recorded at the seat and
//     by the house's setups), not half its family's capacity: v0.0.12 read nine of a thirty loaded with ten as "half or
//     less", so Top up led the panel from the lane's first round;
//   - shoothouse.js's stall clock moves on progress only (a cover, a round, a leg's state, a door): a marine who presses
//     Wait for ever hears "Move on." at STALL_MS and his leg is passed STALL_MORE_MS later, as one who stands still does
//     (before, every step's start and end reset it, and the lane ran to LANE_MAX_MS with no word);
//   - shooting.js targetsOf's house frame takes the walls' own line (route.js lineClear) where the sight grid's 0.25 m
//     cells block one the walls leave open: from the door's outer middle on room 1's left lane the far-left man is in the
//     frame (the walkable lanes put #1 there at his pause, and the grid hid 1a behind a jamb's cell);
//   - specials.js runRound holds a row's round while its man, up and facing, is out of the frame, a tick at a time to
//     LINE_WAIT_MS, rather than firing it at nothing;
//   - bundle.js runSlot: the #2's entry waits for a leaf still swinging (a door kicked by the keys is 'open' at once, its
//     leaf at its stop only at the swing's end): the recruit's fuzz lane on 1185 put him 0.14 m into room 1's leaf;
//   - instinct/cqb.js: "Hold it or clear it?" answered (the closet held by the #2) is no longer a question, so Carry on is
//     the line again (the Raider by T on seeds 5 and 7 held the closet and stood for the rest of the lane).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseFuzzBot } from './bots/house.mjs';
import { overlapOf } from './flawless.mjs';
import { stepAct } from './bots/lib.mjs';
import { drillWorld } from './drill-world.mjs';
import { houseNow, STALL_MS, STALL_MORE_MS, LANE_MAX_MS } from '../src/sim/scenarios/shoothouse.js';
import { halfOrLess, reloadRows, LINE_WAIT_MS } from '../src/sim/arms/specials.js';
import { beliefOf } from '../src/sim/arms/firearms.js';
import { famCap } from '../src/sim/arms/models.js';
import { stepsOf, targetOf } from '../src/sim/arms/shooting.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { sightGridOf } from '../src/sim/places/sight.js';
import { clearLine } from '../src/sim/people/perception.js';
import { firedNow } from '../src/sim/skills/instinct.js';
import { CQB_RULES } from '../src/sim/skills/instinct/cqb.js';
import { TICK_MS } from '../src/core/clock.js';

const gunOfMe = (s) => s.items[s.people[s.player.id].kit.worn.sling];
const meOf = (s) => s.actors.list.find(a => a.who === s.player.id);
const choosing = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.mind?.contact?.pending;

export default [
  {
    name: 'Top up\'s "half or less" is half the magazine\'s own load: on the house\'s thirty loaded with ten, nine and six are not half, five is; a full thirty\'s half is fifteen; Top up does not lead the reloads at nine (v0.0.12 read nine of ten as half of thirty)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), s = g.state, gun = gunOfMe(s), b = beliefOf(s, s.people[s.player.id].kit.worn.sling);
      const at = (n) => halfOrLess({ ...b, count: n }, gun), cap = famCap(b.magFam);
      const rows = reloadRows(s, s.player.id), top = rows.find(r => r.purpose === 'tactical');
      console.log(`      at GO: ${b.count} in a ${cap} loaded with ${gun.belief.fullN}; half or less at 9 ${at(9)}, 6 ${at(6)}, 5 ${at(5)}; by the capacity alone at 9 ${halfOrLess({ ...b, count: 9 })}; a full thirty at 16 ${halfOrLess({ ...b, count: 16 }, { belief: {} })}, 15 ${halfOrLess({ ...b, count: 15 }, { belief: {} })}; Top up first ${top?.first ?? 'no row'}`);
      assert(gun.belief.fullN === 10 && !at(9) && !at(6) && at(5) && halfOrLess({ ...b, count: 9 }) && !halfOrLess({ ...b, count: 16 }, { belief: {} }) && halfOrLess({ ...b, count: 15 }, { belief: {} }), JSON.stringify({ belief: gun.belief }));
      assert(!top?.first, JSON.stringify(top));
    },
  },
  {
    name: 'the seat records the load a magazine goes in with when it is short of its family\'s capacity, and its coming out forgets it: Top up on the lane puts in a ten and the belief says ten',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), s = g.state, gun = gunOfMe(s), was = gun.mag;
      for (let i = 0; i < 20 && !choosing(s); i++) g.step(1);
      g.step(1, { act: [stepAct('macro:reload:tactical')] });
      for (let i = 0; i < 400 && !(gun.mag !== was && choosing(s)); i++) g.step(1);
      const b = beliefOf(s, s.people[s.player.id].kit.worn.sling);
      console.log(`      after Top up: the magazine ${gun.mag !== was ? 'changed' : 'NOT changed'}, believed ${b.count}, its load ${gun.belief.fullN}; half or less ${halfOrLess(b, gun)}`);
      assert(gun.mag !== was && gun.belief.fullN === 10 && b.count === 10 && !halfOrLess(b, gun), JSON.stringify(gun.belief));
    },
  },
  {
    name: 'the stall clock counts progress only: a marine who presses Wait for ever after GO hears "Move on." at 60 s in each leg and the leg is passed with \'time\' 30 s later, the card in 6 minutes, never the lane\'s 10-minute limit (before 2026-11-12 every Wait reset it)',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), stalls = [];
      let waits = 0;
      const waiter = (state) => { if (choosing(state) && stepsOf(state).some(r => r.id === 'wait' && !r.off)) { waits++; return { act: [stepAct('wait')] }; } return {}; };
      const r = runHouse(g, waiter, { maxMs: 20 * 60_000, each: (game) => { for (const f of game.facts('house')) if (f.phase === 'stall') stalls.push(f.atMs); } });
      const N = houseNow(g.state), go = g.state.armoury.range.house.goAtMs;
      console.log(`      ${waits} Waits; stalls at ${stalls.map(t => `${fmt((t - go) / 1000, 0)} s`).join(', ')}; legs ${N.legs.map(V => `${V.state} ${fmt(V.ms / 1000, 1)} s`).join(', ')}; the lane ${N.end?.why} at ${fmt((N.end?.atMs - go) / 1000, 1)} s (the limit ${LANE_MAX_MS / 1000} s)`);
      assert(r.done && waits > 4 && N.end?.why !== 'time' && N.legs.every(V => V.state === 'passed') && stalls.length === 4, JSON.stringify({ end: N.end, legs: N.legs.map(V => V.state), stalls: stalls.length, waits }));
      assert(N.legs.every(V => Math.abs(V.ms - STALL_MS - STALL_MORE_MS) <= 50), JSON.stringify(N.legs.map(V => V.ms)));
    },
  },
  {
    name: 'the rifle\'s frame is the walls\' own line where the sight grid\'s cells are coarser: from the door\'s outer middle on room 1\'s left lane, 0.2 m outside the plane, the far-left man is in the frame though the grid alone hides him behind the jamb\'s cell; behind the wall he is not',
    fn() {
      // (the 'contact' setup: room 1's door open, 1a turned to you)
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'contact' }), s = g.state, P = lanePlanOf(s).plans['o:w4:r1'];
      g.step(Math.round(1000 / TICK_MS));
      const T = s.armoury.range.turners.find(t => t.stand === '1a'), me = meOf(s), grid = sightGridOf(s, s.places.live.area);
      const lane = P.paths[1].find(p => p[1] === 12.3), probe = (x, z) => { me.x = x; me.z = z; me.headRad = Math.atan2(T.z - z, T.x - x); return { frame: !!targetOf(s, T.key, s.player.id), grid: clearLine(grid, x, z, T.x, T.z, 'stand') }; };
      const door = probe(lane[0], 12.2), behind = probe(27.9, 12.45);
      console.log(`      1a at (${T.x}, ${T.z}); from the lane at (${lane[0]}, 12.2): in the frame ${door.frame}, the grid's line ${door.grid}; from behind the wall at (27.9, 12.45): in the frame ${behind.frame}, the grid's line ${behind.grid}`);
      assert(door.frame && !door.grid && !behind.frame, JSON.stringify({ door, behind }));
    },
  },
  {
    name: 'a row\'s round waits for its man while he is up and facing but out of the frame, a tick at a time to LINE_WAIT_MS, then goes; it never fires at nothing at once',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'contact' }), s = g.state, pid = s.player.id, shots = [];
      g.bus.on?.('shot', (f) => { if (f.who === pid && f.fired) shots.push({ atMs: f.atMs, target: f.target ?? null }); });
      g.step(Math.round(1000 / TICK_MS));
      const T = s.armoury.range.turners.find(t => t.stand === '1a'), me = meOf(s), P = lanePlanOf(s).plans['o:w4:r1'];
      // (in the room on #1's threshold, the man in the frame: bracketed, the pair begun; then behind the wall, west of the door, as the press goes)
      me.x = P.paths[1][2][0]; me.z = P.paths[1][2][1]; me.headRad = Math.atan2(T.z - me.z, T.x - me.x);
      for (let i = 0; i < 20 && !choosing(s); i++) g.step(1);
      g.step(1, { act: [stepAct(`pick=${T.key}`)] });
      const row = stepsOf(s).find(r => r.kind === 'shot' && !r.off && (r.target ?? T.key) === T.key);
      g.step(1, { act: [stepAct(row.id, 'normal', T.key)] });
      const t0 = s.clock.ms;
      // (a placement, not a walk: the carry through the doorway the window began (places/move.js throughOf, the rework's R8b) dropped with it)
      me.x = 27.9; me.z = 12.45; me.$px = me.x; me.$pz = me.z; delete me.through; delete me.v;
      for (let i = 0; i < 60 && !shots.length; i++) g.step(1);
      // (the row's own time to its first round: its sub-steps before it, as planned)
      const subs = row.subs ?? [], k = subs.findIndex(x => x.id === 'round'), planned = subs.slice(0, k).reduce((t, x) => t + (x.ms ?? 0), 0);
      const d = s.stop?.doing, first = shots[0] ?? null, wait = first ? first.atMs - t0 : null;
      console.log(`      ${row.id}: the man out of the frame from (27.9, 12.45); the first round ${first ? `${wait} ms after the press (its plan ${planned} ms), at ${first.target ?? 'nothing'}` : 'not fired'}; the row's line wait ${d?.lineMs ?? 'over'} ms (LINE_WAIT_MS ${LINE_WAIT_MS})`);
      assert(k >= 0 && first && wait >= planned + LINE_WAIT_MS - TICK_MS, JSON.stringify({ first, wait, planned }));
    },
  },
  {
    name: 'the #2 never walks into a leaf still swinging: the recruit\'s fuzz lane on 1185, room 1\'s door kicked by the keys and the #2 cued on his first step in, puts neither body in a wall or a leaf (the gauges\' F1 of 2026-11-12: 0.14 m into the leaf)',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1185, tier: 'recruit', setup: 'go' }), H = g.state.armoury.range.house, pid = g.state.player.id;
      let worst = { m: 0 }, ticks = 0;
      const r = runHouse(g, houseFuzzBot({ seed: 1185 }), { maxMs: 15 * 60_000, each: (game) => {
        for (const who of [pid, H.twoPid]) { const a = game.state.actors.list.find(x => x.who === who), o = overlapOf(game.state, a.x, a.z); if (o.m > 0.005) ticks++; if (o.m > worst.m) worst = { m: o.m, what: o.what, who, at: [a.x, a.z] }; }
      } });
      console.log(`      ${r.done ? 'to the card' : 'NOT to the card'}; body-ticks over 0.005 m: ${ticks}; worst ${fmt(worst.m * 100, 2)} cm${worst.what ? ` (${worst.who === pid ? '#1' : '#2'} in ${worst.what} at ${JSON.stringify(worst.at)})` : ''}`);
      assert(r.done && ticks === 0, JSON.stringify(worst));
    },
  },
  {
    name: 'an inner door\'s question answered is no question: "Hold it or clear it?" with room 2\'s closet held by the #2 lets Carry on be the line, and with it unheld Carry on waits on the answer',
    fn() {
      const w = drillWorld({ tier: 'cpl' }), { s, g } = w, p2 = w.lane.plans['o:w4:r2'];
      const twoPid = s.actors.list.find(a => a.who !== w.pid).who;
      g.step(1);
      w.me().x = p2.points[0][0]; w.me().z = p2.points[0][1];
      const house = (hold) => ({ rooms: [{ id: 'w4.r1', door: 'o:w4:r1', state: 'clear' }, { id: 'w4.r2', door: 'o:w4:r2', state: 'entered', covered: {} }, { id: 'w4.r3', door: 'o:w4:r3', state: 'ahead' }], hall: { id: 'w4.hall', state: 'ahead' }, two: { pid: twoPid, rung: 2, doing: null, hold } });
      const carry = () => ({ from: 'x', bundle: 'room:dominate', door: 'o:w4:r2', rung: 2, variant: {}, beats: ['sector', 'clear', 'mark'], why: 'door-unplanned', words: null, paths: {} });
      s.armoury.range.house = house(null); s.stop.carry = carry();
      const open = firedNow(s, s.clock.ms, CQB_RULES).map(l => `${l.id}→${l.act}`);
      s.armoury.range.house = house('o:w4:closet'); s.stop.carry = carry(); s.clock.ms += TICK_MS;
      const held = firedNow(s, s.clock.ms, CQB_RULES).map(l => `${l.id}→${l.act}`);
      console.log(`      the closet unheld: ${open.join(', ')}; held by the #2: ${held.join(', ')}`);
      assert(!open.some(l => l.startsWith('cqb-carryon')) && held.includes('cqb-carryon→stop:drill:carry'), JSON.stringify({ open, held }));
    },
  },
];
