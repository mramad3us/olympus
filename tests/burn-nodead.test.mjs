// test-burn never dead-ends (the build sheet v0.0.24 §6, §8 F118, its numbers read three higher): the bot secured in time on 40 seeds to the scene's end, and the fuzz bot's 40 seeds to the end all the same, whatever it pressed (heavy).
import { assert, fmt } from './helpers.mjs';
import { burnBot, burnFuzzBot } from './bots/void.mjs';
import { burnRun } from './scene-burn.test.mjs';

/** The heavy seeds (40). */
export const SEEDS40 = Object.freeze(Array.from({ length: 40 }, (_, i) => (i === 0 ? 48213 : 4000 + i)));

export default [
  {
    name: 'burn-nodead (F118): the bot on 40 seeds, every one secured before the drive lit and to the scene\'s end; the jink on about half',
    heavy: true,
    timeoutMs: 1_800_000,
    fn() {
      const bad = [], how = {}, inMs = [];
      let jinks = 0;
      for (const seed of SEEDS40) {
        const r = burnRun({ seed, bot: burnBot() }), B = r.B;
        if (!r.done) bad.push(`${seed}: not done`);
        if (!B.secured) bad.push(`${seed}: not secured`); else { how[B.secured.how] = (how[B.secured.how] ?? 0) + 1; inMs.push(B.secured.inMs); }
        if (B.jinks) jinks++;
      }
      const s = [...inMs].sort((a, b) => a - b);
      console.log(`      ${SEEDS40.length - bad.filter(b => /not done/.test(b)).length}/${SEEDS40.length} to the end; secured ${JSON.stringify(how)}, after the warning p50 ${fmt((s[s.length >> 1] ?? 0) / 1000, 1)} s, max ${fmt((s.at(-1) ?? 0) / 1000, 1)} s; a jink on ${jinks}`);
      assert(!bad.length, bad.join('; '));
      assert(jinks >= 8 && jinks <= 32, `the jink on ${jinks} of 40`);
    },
  },
  {
    name: 'burn-nodead (F118): the fuzz bot on 40 seeds, every scene to its end whatever it pressed',
    heavy: true,
    timeoutMs: 1_800_000,
    fn() {
      const bad = [], what = {};
      for (const seed of SEEDS40) {
        const r = burnRun({ seed, bot: burnFuzzBot({ seed }) });
        if (!r.done) bad.push(`${seed}: not done (${r.ticks} ticks)`);
        what[r.B.onset?.what ?? 'none'] = (what[r.B.onset?.what ?? 'none'] ?? 0) + 1;
        if (r.ids.invalid.length || r.ids.dangling.length) bad.push(`${seed}: ids`);
      }
      console.log(`      ${SEEDS40.length - bad.length}/${SEEDS40.length} to the end; what the burn did ${JSON.stringify(what)}`);
      assert(!bad.length, bad.join('; '));
    },
  },
];
