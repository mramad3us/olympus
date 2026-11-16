// OLYMPUS tests: leaving a room (quick; the build sheet v0.0.20 item 12; drill.md item 3; COMBAT §25.19.2.1).
//
// "Coming out!" was never said (0 of 132 lanes) and the mark was #1's, standing at his point with nothing in the world. Now: at your
// "Room clear!" your #2 answers his status ("Up.") and the room's end waits on it at most corner.js STATUS_MS; a row started inside a
// room called clear opens with "Coming out!" (bundle.js's `out` kind; by the keys the single, DRILL_IN 6); the last man out marks the
// latch-side jamb ("Last man.", L.marked), your #2 as his Dominate's last beat arms it, you where he went out first; and houseLook
// draws the mark from the hand on (marksLook). Two lanes, one sheet each on 48213: the tier one by T and the private by the keys.
// Each case fails without the fix (no `out`, `status`, `markArm` kinds, no L.marked, no marksLook).
import { assert } from './helpers.mjs';
import { houseHonestBot, houseKeysBot } from './bots/house.mjs';
import { roomLane, roomGauges, gaugeLine } from './flawless-room.mjs';
import { STATUS_MS } from '../src/sim/combat/corner.js';

let memo = null;
const lanes = () => (memo ??= [roomLane({ tier: 'tierone', bot: houseHonestBot() }), roomLane({ tier: 'private', bot: houseKeysBot() })]);
const rooms = (R) => R.legs.slice(0, 3);

export default [
  {
    name: 'every room left after "Room clear!" hears "Coming out!" from you before you pass its door (the tier one by T, the private by the keys, 48213; it was never said)',
    timeoutMs: 60_000,
    fn() {
      const rows = [];
      for (const R of lanes()) for (const L of rooms(R)) {
        const out = R.says.find(x => x.who === 1 && x.call === 'out' && x.ms >= L.clearAtMs), cross = (R.cross[L.door] ?? []).find(c => c.ms >= L.clearAtMs);
        rows.push({ lane: R.tier, door: L.door, out: out ? (out.ms - L.clearAtMs) / 1000 : null, ok: !!out });
      }
      console.log(`      ${rows.map(r => `${r.lane} ${r.door}: ${r.out === null ? 'none' : `+${r.out.toFixed(2)} s after "Room clear!"`}`).join('; ')}`);
      assert(lanes().every(R => R.done && R.end === 'clear') && rows.length === 6 && rows.every(r => r.ok), JSON.stringify(rows));
    },
  },
  {
    name: 'the last man out marks the room on its latch-side jamb and says "Last man.": your #2 within 0.5 s of passing the door\'s plane where he is last, you where he went out first (room 3\'s far leg keeps you deepest); every room marked, and no `mark` beat runs on you while he is up',
    timeoutMs: 60_000,
    fn() {
      const rows = [];
      for (const R of lanes()) for (const L of rooms(R)) {
        const his = (R.cross[L.door] ?? []).find(c => c.ms >= L.clearAtMs && !c.meIn), by = L.marked ? (R.says.find(x => x.call === 'last' && Math.abs(x.ms - L.marked.atMs) <= 50)?.who ?? null) : null;
        rows.push({ lane: R.tier, door: L.door, by, dt: his && L.marked ? (L.marked.atMs - his.ms) / 1000 : null, yours: L.markYours });
      }
      const mine = lanes().flatMap(R => R.beats.filter(b => b.who === 1 && b.beat === 'mark' && b.phase === 'beat'));
      console.log(`      ${rows.map(r => `${r.lane} ${r.door}: ${r.by === 2 ? `your #2 +${r.dt?.toFixed(2)} s past the plane` : r.by === 1 ? 'you (last out)' : 'unmarked'}`).join('; ')}; mark beats run on you ${mine.length}`);
      assert(rows.every(r => r.by === 1 || r.by === 2) && rows.filter(r => r.by === 2).every(r => r.dt !== null && r.dt <= 0.5) && rows.some(r => r.by === 2) && !mine.length, JSON.stringify({ rows, mine: mine.length }));
    },
  },
  {
    name: 'the "Room clear" stop opens on your #2\'s status ("Up."), never before it, at most STATUS_MS 600 ms after your call',
    timeoutMs: 60_000,
    fn() {
      const R = lanes()[0], rows = [];
      for (const L of rooms(R)) {
        const s = R.H.status?.[L.door] ?? null, end = R.beats.find(b => b.who === 1 && b.phase === 'end' && b.ms >= (s?.askMs ?? Infinity));
        rows.push({ door: L.door, said: s?.said ?? null, wait: s ? s.saidMs - s.askMs : null, end: end && s ? end.ms - s.saidMs : null });
      }
      console.log(`      ${rows.map(r => `${r.door}: "${r.said}" ${r.wait} ms after the ask, the row's end +${r.end} ms`).join('; ')}`);
      assert(rows.every(r => r.said && r.wait !== null && r.wait <= STATUS_MS && r.end !== null && r.end >= 0), JSON.stringify(rows));
    },
  },
  {
    name: 'the mark is drawn from its hand on, never before (nothing pops in): houseLook\'s marks hold no room at its stop, and hold it from the tick of L.marked\'s hand; the gauges F52 printed',
    timeoutMs: 60_000,
    fn() {
      const rows = [];
      for (const R of lanes()) for (const L of rooms(R)) rows.push({ lane: R.tier, door: L.door, hand: L.marked?.atMs ?? null, drawn: R.marksAt[L.door] ?? null, clear: L.clearAtMs });
      console.log(`      ${rows.map(r => `${r.lane} ${r.door}: drawn ${r.drawn === null ? 'never' : `${r.drawn - r.hand} ms after the hand (the tick read after it)`}, ${r.hand === null ? '' : `${((r.hand - r.clear) / 1000).toFixed(2)} s after "Room clear!"`}`).join('; ')}`);
      for (const g of roomGauges(lanes()).filter(g => g.id === 'F52')) console.log(`      ${gaugeLine(g)}`);
      // (the lane is read after each tick, so a mark first drawn at its hand's own tick is seen one tick (50 ms) on: never before the hand)
      assert(rows.every(r => r.hand !== null && r.drawn >= r.hand && r.drawn - r.hand <= 50 && r.hand > r.clear), JSON.stringify(rows));
    },
  },
];
