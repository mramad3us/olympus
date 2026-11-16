// OLYMPUS tests: your #2's call-outs shorten your take-in (quick; the build sheet v0.0.20 item 18; drill.md item 5).
//
// A man of yours (team.js ownerOf) in the room you are in that your #2 sees before you have is taken in, looked at (his own Awareness
// check) and called with what he identified and the place in your frame ("Hostage, far leg!"; "Man, far left!" where he could not
// tell), never a pause; the call is told to your mind (contact.js tell, the one write of state.mind.contact.told) and react.js
// expectOf takes a man within corner.js TOLD_DEG of the place named, inside TOLD_MS, as expected ('sector', ×1, where the room is
// 'area', ×1.5). Each case fails without the fix (no tell, no told, expectOf's 'area').
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot } from './bots/house.mjs';
import { roomLane, roomGauges, gaugeLine } from './flawless-room.mjs';
import { tell } from '../src/sim/combat/contact.js';
import { expectOf } from '../src/sim/combat/react.js';
import { placeWordsOf, TOLD_MS, TOLD_DEG } from '../src/sim/combat/corner.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { ownerOf } from '../src/sim/combat/team.js';

export default [
  {
    name: 'a man where your #2 called one is expected: within TOLD_DEG 20 of the place he named, inside TOLD_MS 3 s, your take-in reads \'sector\' (the room\'s \'area\' before, and after the 3 s, and 30° off); the told record holds no id',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'room:3' }), s = g.state, pid = s.player.id, now = s.clock.ms;
      s.mind.clearing = { room: 'w4.r3', fromMs: now };
      const me = s.actors.list.find(a => a.who === pid), at = [22.5, 6.4], T = { key: 'x', x: at[0], z: at[1] };
      const before = expectOf(s, pid, T, now);
      const rec = tell(s, pid, 'turner:6', { atMs: now, bearingRad: Math.atan2(at[1] - me.z, at[0] - me.x), face: 'hostage', at });
      const b = Math.atan2(at[1] - me.z, at[0] - me.x), off = { key: 'y', x: me.x + 5 * Math.cos(b + 30 * Math.PI / 180), z: me.z + 5 * Math.sin(b + 30 * Math.PI / 180) };
      const rows = { before, told: expectOf(s, pid, T, now + 1000), late: expectOf(s, pid, T, now + TOLD_MS + 50), off: expectOf(s, pid, off, now + 1000) };
      console.log(`      ${JSON.stringify(rows)}; told ${JSON.stringify(rec)}; a call-out's place for (22.5, 6.4) from your point: "${placeWordsOf(lanePlanOf(s).plans['o:w4:r3'], [18.5, 11.5], at)}"`);
      assert(rows.before === 'area' && rows.told === 'sector' && rows.late === 'area' && rows.off === 'area' && !JSON.stringify(rec).includes('"p'), JSON.stringify(rows));
      assert(tell(s, 'p999', 'turner:6', { atMs: now, bearingRad: 0 }) === null, 'told is the player\'s mind only');
    },
  },
  {
    name: 'the call-outs in the lanes (printed, F54): a man of yours your #2 saw before you is called, told to your mind, never a pause; a man owned by him is never called to you; the honest tier one and corporal on 48213',
    timeoutMs: 60_000,
    fn() {
      const lanes = [roomLane({ tier: 'tierone', bot: houseHonestBot() }), roomLane({ tier: 'cpl', bot: houseHonestBot() })];
      for (const R of lanes) console.log(`      ${R.tier}: called ${JSON.stringify(R.H.called ?? {})}, told ${Object.keys(R.H.told ?? {}).length}; ${R.says.filter(x => x.call === 'contact').map(x => `"${x.text}"`).join(', ') || 'no call-out (he saw none of yours before you: room 3\'s far leg is behind its bend from his point)'}`);
      const G = roomGauges(lanes).find(g => g.id === 'F54');
      console.log(`      ${gaugeLine(G)}`);
      // (a man owned by him is never called: every key called is yours by team.js ownerOf)
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone' }), T = g.state.armoury.range.turners;
      const his = lanes.flatMap(R => Object.keys(R.H.called ?? {}).filter(k => ownerOf(g.state, T.find(t => t.key === k)) !== 1));
      assert(G.met && !his.length && lanes.every(R => R.end === 'clear'), JSON.stringify({ G: G.got, his }));
    },
  },
];
