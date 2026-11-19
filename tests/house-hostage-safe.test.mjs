// OLYMPUS tests: the hostage line on safe gives T the thumb (v0.0.23 D, found by house-reader's F92; COMBAT §25.19.4, "never a dead end").
//
// cqb.js cqb-hostage names the head shot and leaves it to you ("Hostage. Head only, or hold."), its act Aim until you are on him. On him
// with the rifle still on safe, the head shot is struck "off safe first" and the line had no act and named no row: T did nothing, and
// the reading recruit (tests/bots/reader.mjs) on eight-room seed 208, the first to walk into room 1's far leg by the words, stood 90 s in
// stop motion at room 1's hostage-taker until the room was passed, then met room 2's door open 7.5 m away (F92 red on two lanes). Now,
// on him with the head struck only for the safe and Off safe offered, the line is "Hostage. Off safe, then the head." with Off safe as
// its act (cqb-contact's 'safe', the same thumb); every other case as before (house-pin's 44 cells held). Here that stop, by the reader:
// the line's act, T pressed, the selector on semi and the head shot live, and room 1 cleared. Fails without the hunk (act null).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { readerBot } from './bots/reader.mjs';
import { runHouse } from './bots/house.mjs';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { stepsOf } from '../src/sim/arms/shooting.js';

export default [
  {
    name: 'on the hostage-taker with the rifle on safe, the hostage line gives T Off safe ("Hostage. Off safe, then the head."), then the head shot is live: the reading recruit on eight-room seed 208, room 1 cleared (before: no act, no row, 90 s in stop motion, the room passed)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 208, tier: 'recruit', rooms: 'all' }), s = g.state, bot = readerBot();
      let at = null;
      for (let i = 0; i < 6000 && !s.armoury.range.end; i++) {
        const l = instinctNow(s).line;
        if (s.stop?.phase === 'choose' && l?.id === 'cqb-hostage' && s.stop.aim?.key === s.stop.pick) { at = { tick: s.clock.tick, act: l.act ?? null, row: l.row ?? null, text: l.text }; break; }
        g.step(1, bot); g.clearFacts?.();
      }
      assert(at, 'the hostage stop on him was never reached');
      g.step(1, { act: [{ act: 'instinct', args: { id: 'cqb-hostage', act: at.act } }] });
      for (let i = 0; i < 200 && !(s.stop?.phase === 'choose' && !s.stop.doing); i++) g.step(1);
      const head = stepsOf(s).find(r => r.id.startsWith('shot:head')), next = instinctNow(s).line;
      console.log(`      tick ${at.tick}: "${at.text}", act ${at.act ?? 'none'}, row ${at.row ?? 'none'}; T: the head shot ${head ? (head.off ? `struck (${head.off})` : 'live') : 'absent'}, the line "${next?.text ?? ''}"`);
      assert(at.act === 'stop:selector:semi' && /Off safe|Thumb it off|Safe off/.test(at.text) && head && !head.off, JSON.stringify({ at, head: head?.off ?? null }));
      runHouse(g, bot, { maxMs: 10 * 60_000 });
      const r1 = s.armoury.range.house.rooms[0];
      console.log(`      room 1 ${r1.state}`);
      assert(r1.state === 'clear', r1.state);
    },
  },
];
