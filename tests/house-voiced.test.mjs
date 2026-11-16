// OLYMPUS tests: the house speaks, every line heard (the build sheet v0.0.20 item 7, F59; feel.md FL-3).
//
// In v0.0.19, over six lanes, 55 of 237 'say' facts made a sound (23.2%): the #2's whispered "Ready.", 24 of his "Clear!" and one
// "Standby."; the brief, the tower's commands, his status calls and every call of yours were silent, and "Lane A. Standby." too
// (house.js's rule matched /^\s*standby\b/i). Now every line is said in its speaker's voice (house.js, voice.js), one speaker
// never over himself. The quick case is one lane (the private by the keys on 48213, from the fill); the heavy case the six
// lanes of feel.md's voiced.mjs (tests/flawless-sound.mjs SOUND_LANES), F59 printed and enforced. V-a, today's stand-ins with the
// Standby rule fixed, is printed beside: the share the voice raises.
import { assert } from './helpers.mjs';
import { soundLane, f59, SOUND_LANES } from './flawless-sound.mjs';

export default [
  {
    name: 'the private by the keys on 48213 hears at least 95% of the house\'s \'say\' facts (v0.0.19\'s stand-ins: about 23%), no speaker over himself, no held command inside the instructor\'s line (F59 on one lane; V-a printed beside)',
    fn() {
      const rec = soundLane({ tier: 'private', seed: 48213, mode: 'keys', also: 'a' }), g = f59([rec]), a = { heard: rec.also.heard, says: rec.says };
      console.log(`      ${g.text}`);
      console.log(`      V-a (v0.0.19's stand-ins, the Standby rule fixed): ${a.heard} of ${a.says} (${(100 * a.heard / a.says).toFixed(1)}%); the lane ${rec.end}, silent with the voice: ${rec.silent.join(' | ') || 'none'}`);
      assert(rec.done && rec.says > 20 && !g.fails, g.text);
      assert(a.heard / a.says < 0.5, 'V-a is the stand-ins');
    },
  },
  {
    name: 'the six lanes of voiced.mjs (the boot recruit and the private by the keys, the corporal to the tier one by T): F59 enforced, every speaker\'s lines printed',
    heavy: true,
    timeoutMs: 15 * 60_000,
    fn() {
      const recs = SOUND_LANES.map(([tier, mode, seed]) => soundLane({ tier, seed, mode })), g = f59(recs);
      for (const r of recs) console.log(`      ${r.tier.padEnd(8)} ${r.mode} ${r.seed}: ${r.heard} of ${r.says} heard, ${JSON.stringify(r.byRole)}, dropped ${r.dropped}, ${r.end}`);
      console.log(`      ${g.text}`);
      assert(recs.every(r => r.done) && !g.fails, g.text);
    },
  },
];
