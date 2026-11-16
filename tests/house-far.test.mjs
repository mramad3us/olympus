// OLYMPUS tests: "Moving!", "Move!": the far leg covered (quick; the build sheet v0.0.20 item 17; drill.md item 4).
//
// In room 3 #1 walked the far leg alone, past his point of domination, the #2's eyes on it 4.7 to 8.3% of the walk. Now: "Moving!"
// (the `moving` beat, after the sector and the inner door) waits on his "Move!" (corner.js MOVE_ANSWER_MS once he is on nobody, at most
// MOVE_WAIT_MAX_MS, then handed back as the "Clear!" gate does, in the words of what keeps him; gun down, at once), and his eyes go onto the far leg's mouth (corner.js farCoverOf) until your
// "Clear!" there; by the keys your walk is seen by its place and covered with "Covering!", nothing waiting. Each case fails without it.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, houseKeysBot, runHouse } from './bots/house.mjs';
import { roomLane, roomGauges, gaugeLine } from './flawless-room.mjs';
import { farCoverOf, MOVE_WAIT_MAX_MS, FAR_COVER_DEG } from '../src/sim/combat/corner.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { HANDBACK_WORDS, moveWaitWhy } from '../src/sim/combat/bundle.js';

let memo = null;
const lanes = () => (memo ??= [roomLane({ tier: 'tierone', bot: houseHonestBot() }), roomLane({ tier: 'cpl', bot: houseHonestBot(), setup: 'room:3' })]);

export default [
  {
    name: '"Moving!" then your #2\'s "Move!" before your feet leave your point for the far leg (the tier one by T on 48213, the corporal from room 3); neither word existed',
    timeoutMs: 60_000,
    fn() {
      const rows = lanes().map(R => {
        const start = R.beats.find(b => b.who === 1 && b.beat === 'far' && b.phase === 'beat'), mv = R.says.find(x => x.call === 'moving'), go = R.says.find(x => x.call === 'move');
        return { lane: R.tier, moving: mv?.ms ?? null, move: go?.ms ?? null, walk: start?.ms ?? null, wait: mv && go ? (go.ms - mv.ms) / 1000 : null };
      });
      console.log(`      ${rows.map(r => `${r.lane}: "Moving!" then "Move!" ${r.wait?.toFixed(2)} s on, the walk ${r.walk !== null && r.move !== null ? ((r.walk - r.move) / 1000).toFixed(2) : '-'} s after it`).join('; ')}`);
      assert(rows.every(r => r.moving !== null && r.move !== null && r.walk !== null && r.moving <= r.walk && r.move <= r.walk + 50 && r.lane), JSON.stringify(rows));
    },
  },
  {
    name: 'his eyes within FAR_COVER_DEG 20 of the far leg for 90% or more of your far walk from rung 2 (4.7 to 8.3% before: drill.md §1)',
    timeoutMs: 60_000,
    fn() {
      const G = roomGauges(lanes()).find(g => g.id === 'F53');
      console.log(`      ${gaugeLine(G)}`);
      for (const R of lanes()) console.log(`      ${R.tier}: ${R.far.length} ticks of your far walk, his eyes off the far leg by at most ${Math.max(0, ...R.far.map(x => x.off)).toFixed(1)}°, within ${FAR_COVER_DEG}° on ${R.far.filter(x => x.off <= FAR_COVER_DEG).length}`);
      assert(G.met, G.got);
    },
  },
  {
    name: 'with your #2 gun down at your "Moving!", your far walk is handed back at once in the words of the cause, "Your two\'s gun down." (it waited MOVE_WAIT_MAX_MS 4 s and said "Your two\'s on a man.": the review of 2026-11-16); Carry on then walks it without him, and the lane reaches its card; on a man or on his sector the wait is MOVE_WAIT_MAX_MS, in those words',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'room:3' }), s = g.state, H = s.armoury.range.house, bot = houseHonestBot();
      let held = null, halt = null;
      runHouse(g, (st, me, mem) => {
        const r = H.two.moving?.['o:w4:r3'];
        if (r && r.saidMs !== undefined && r.moveMs === undefined && r.handed === undefined) { H.two.down ??= { fake: true, atMs: st.clock.ms }; held ??= r.saidMs; }
        else if (H.two.down?.fake) delete H.two.down;
        return bot(st, me, mem);
      }, { maxMs: 6 * 60_000, each(game) { for (const f of game.facts('bundle')) if (f.phase === 'halt' && f.why === 'clear' && held !== null && halt === null) halt = { ms: f.atMs ?? game.state.clock.ms, words: game.state.stop?.carry?.words ?? game.state.stop?.doing?.halt?.words ?? null }; } });
      const wait = held !== null && halt ? (halt.ms - held) / 1000 : null, why = { down: moveWaitWhy({ down: {} }), man: moveWaitWhy({ contact: {} }), eng: moveWaitWhy({ eng: {} }), sector: moveWaitWhy({}) };
      console.log(`      "Moving!" at +0, gun down: the hand-back ${wait === null ? 'never' : `+${wait.toFixed(2)} s`} "${halt?.words ?? '-'}"; the lane ${H.end?.why ?? 'not over'}; the causes' words ${JSON.stringify(Object.fromEntries(Object.entries(why).map(([k, v]) => [k, HANDBACK_WORDS[v]])))}`);
      assert(wait !== null && wait <= 0.3 && H.end?.why, JSON.stringify({ held, halt, end: H.end }));
      assert(halt.words === HANDBACK_WORDS.twoDown, JSON.stringify(halt));
      assert(HANDBACK_WORDS.twoDown === "Your two's gun down." && why.down === 'twoDown' && why.man === 'twoMan' && why.eng === 'twoMan' && why.sector === 'twoSector' && HANDBACK_WORDS.twoMan === "Your two's on a man.", JSON.stringify(why));
    },
  },
  {
    name: 'by the keys (no "Moving!"), your walk up the far leg is seen by its place and your #2 covers it, "Covering!", nothing waiting: the private on 48213',
    timeoutMs: 60_000,
    fn() {
      const R = roomLane({ tier: 'private', bot: houseKeysBot() }), cov = R.says.filter(x => x.who === 2 && x.call === 'covering'), mv = R.says.filter(x => x.call === 'moving');
      const c = farCoverOf(lanePlanOf(createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' }).state).plans['o:w4:r3']);
      console.log(`      "Covering!" ${cov.length}× (${cov.map(x => x.text).join(', ')}), "Moving!" ${mv.length}×; the far leg's mouth (${c.x}, ${c.z}); the lane ${R.end}`);
      assert(cov.length >= 1 && !mv.length && R.end === 'clear', JSON.stringify({ cov: cov.length, mv: mv.length, end: R.end }));
    },
  },
];
