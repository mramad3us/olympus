// OLYMPUS tests: you see who speaks (the build sheet v0.0.20 §1 item 13; feel FL-4), the pure parts: plaque.js speakerMarks and markPlace, and F57 on one lane.
//
// A call of at most two words is a balloon over its speaker for CALL_BALLOON_MS; from v0.0.24 (the user, 2026-11-19: "use text
// bubble only") a longer line is a balloon too, its words wrapped, for its spoken time (core/speech.js spokenMs; it was his 3 × 3
// ◉), both fading over MARK_FADE_MS, the newest line a speaker's only, on the game clock (held by stop motion as the clock is). markPlace stands it within MARK_ABOVE_PX over his head, clear of every other figure's and stand's box. F57 (tests/
// flawless-card.mjs placeGauge) on the private by the keys on 48213: every contact's plate and every mark and balloon of the lane.
import { assert } from './helpers.mjs';
import { speakerMarks, markPlace, isCall, CALL_BALLOON_MS, MARK_FADE_MS, MARK_ABOVE_PX, balloonPixels, markPixels } from '../src/ui/plaque.js';
import { spokenMs } from '../src/core/speech.js';
import { placeGauge } from './flawless-card.mjs';

export default [
  {
    name: 'a call of at most two words is a balloon for CALL_BALLOON_MS, a longer line a balloon of its words for its spoken time (v0.0.24: the mark retired), each fading over MARK_FADE_MS, the newest a speaker\'s only; placed within MARK_ABOVE_PX over his head and clear of the others',
    fn() {
      const says = [{ who: 'two', text: 'Clear!', atMs: 1000 }, { who: 'chief', text: 'Stop. On safe, finger off.', atMs: 1000, spokenMs: spokenMs('Stop. On safe, finger off.') }, { who: 'two', text: 'Up.', atMs: 1500 }];
      const at = (ms) => speakerMarks(says, ms).map(m => `${m.who}:${m.kind}${m.text ? `(${m.text})` : ''}@${m.k}`).join(' ');
      const t = [1000, 1060, 1500, 2600, 2700, 2900, 3000].map(ms => `${ms}: ${at(ms) || 'none'}`);
      for (const x of t) console.log(`      ${x}`);
      const head = { x: 100, y: 50, w: 10, h: 6 }, b = balloonPixels('Coming in!'), p1 = markPlace(head, { w: b.w, h: b.h }, []), p2 = markPlace(head, { w: b.w, h: b.h }, [{ x: 80, y: 30, w: 60, h: 19 }]);
      console.log(`      "Coming in!" ${b.w} × ${b.h} px: over a clear head at ${JSON.stringify(p1)}, with a box over it at ${JSON.stringify(p2)}; the mark ${markPixels().w} × ${markPixels().h}; isCall: ${['Clear!', 'Coming in!', 'Coming out, coming!'].map(isCall).join(', ')}`);
      const m0 = speakerMarks(says, 1000), m1 = speakerMarks(says, 1500 + CALL_BALLOON_MS + 1);
      assert(m0.find(m => m.who === 'two').kind === 'balloon' && m0.find(m => m.who === 'chief').kind === 'balloon' && m0.find(m => m.who === 'chief').text === 'Stop. On safe, finger\noff.' && m0.every(m => m.k === 0), JSON.stringify(m0));
      assert(speakerMarks(says, 1000 + MARK_FADE_MS).find(m => m.who === 'chief').k === 1 && speakerMarks(says, 1600).filter(m => m.who === 'two').length === 1 && speakerMarks(says, 1600).find(m => m.who === 'two').text === 'Up.', at(1600));
      assert(!m1.some(m => m.who === 'two') && speakerMarks(says, 1000 + spokenMs('Stop. On safe, finger off.') + 1).every(m => m.who !== 'chief'), at(2700));
      assert(p1 && head.y - (p1.y + b.h) >= 1 && head.y - (p1.y + b.h) <= MARK_ABOVE_PX && p2 && head.y - (p2.y + b.h) <= MARK_ABOVE_PX && (p2.x + b.w <= 80 || p2.x >= 140 || p2.y >= 49), JSON.stringify({ p1, p2 }));
      assert(isCall('Clear!') && isCall('Coming in!') && !isCall('Coming out, coming!'), 'the calls');
    },
  },
  {
    name: 'F57 on a lane: every contact\'s plate slid off the room (or reserved) and every mark and balloon placed clear of the others (the private by the keys, 48213)',
    fn() {
      const g = placeGauge([['private', 48213]]);
      for (const l of g.lines) console.log(`      ${l}`);
      for (const r of g.rows) console.log(`      ${r.id} ${r.met ? 'MET' : 'NOT MET'}: ${r.value} (target ${r.target})`);
      assert(g.met && g.n.plates > 0 && g.n.marks > 0, g.fails.join('; '));
    },
  },
];
