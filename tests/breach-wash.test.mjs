// OLYMPUS tests: "Bang, then go"'s hot wash, its first line by the window (v0.0.26; its build sheet §1 item 8, §6 B, §8 F145; SC§10.3).
//
// The wash's first line is shoothouse.js windowWords(state): the window's case (windowCaseOf over bangWindowOf: on the bang, late (2 to 5 s),
// the blind spent outside (over 5 s), the bang kept, the quiet held door, the quiet loose door beaten or not) in courses.js
// BREACH_CHIEF.window's words; a casualty's lesson by its cause (the one thing's) leads where there is one. Held: every case from a
// record made by hand to its words, {n} the seconds from the bang to your entry; the cases met in real lanes (the sergeant late by 3 s, the
// private by the keys with the bang issued and never thrown, the quiet loose door by T, a casualty's lane by the fuzz), each lane's first
// line its case's; and each man's line on the card equal to his track (his fall at the track's 'down' entry, his give at its 'hands').
// The review of B and C (2026-11-19) adds a bang thrown with no entry after it: 'wasted', never 'kept' (red without windowCaseOf's line).
import { assert } from './helpers.mjs';
import { windowCaseOf } from '../src/sim/scenarios/shoothouse.js';
import { BREACH_CHIEF } from '../src/data/courses.js';
import { breachLane, breachLine } from './breach-lanes.mjs';

const W0 = (o) => ({ bang: 'bang', held: 'loose', bangAtMs: null, doorAtMs: 1000, inAtMs: null, twoInAtMs: null, men: {}, ...o });
const CASES = Object.freeze([
  ['onBang', W0({ bangAtMs: 5000, inAtMs: 6900 })],
  ['late', W0({ bangAtMs: 5000, inAtMs: 8000 })],
  ['wasted', W0({ bangAtMs: 5000, inAtMs: 10_500 })],
  // (the bang thrown and nobody through the door after it: the review of B and C, 2026-11-19, the sergeant held 600 s at the stack read 'kept')
  ['wasted', W0({ bangAtMs: 5000, inAtMs: null })],
  ['kept', W0({ inAtMs: 4000 })],
  ['held', W0({ bang: 'quiet', held: 'held', inAtMs: 2500, men: { a: { onDoorAtMs: 1000 } } })],
  ['faster', W0({ bang: 'quiet', inAtMs: 1800, men: { a: { onDoorAtMs: 2400 }, b: { onDoorAtMs: null } } })],
  ['slower', W0({ bang: 'quiet', inAtMs: 3000, men: { a: { onDoorAtMs: 2400 } } })],
]);
const caseOfLine = (line) => Object.entries(BREACH_CHIEF.window).find(([, xs]) => xs.some(x => new RegExp(`^${x.replace(/[.*+?^$()[\]\\|]/g, '\\$&').replace('\\{n\\}', '[0-9.]+').replace('{n}', '[0-9.]+')}$`).test(line)))?.[0] ?? null;

export default [
  {
    name: 'F145 (the wash\'s half): every case of the window to its words, made by hand: on the bang, late, the blind spent outside (late, or thrown and never through the door), the bang kept, the quiet held door, the quiet loose door beaten and not',
    fn() {
      const bad = [];
      for (const [want, W] of CASES) {
        const got = windowCaseOf(W);
        console.log(`      ${want.padEnd(7)} ${JSON.stringify({ bang: W.bang, held: W.held, inMs: W.inAtMs, bangMs: W.bangAtMs })} → ${got}: "${BREACH_CHIEF.window[got]?.[0]}"`);
        if (got !== want) bad.push(`${want} read ${got}`);
      }
      assert(!bad.length, bad.join('; '));
      assert(windowCaseOf(null) === null && windowCaseOf(W0({ bang: 'quiet' })) === null, 'no case off the lane, or with no entry on a quiet door');
    },
  },
  {
    name: 'F145 (the wash\'s half): the cases met in real lanes lead their wash with their words (the sergeant 3 s late, the bang kept, the quiet loose door), a casualty\'s lesson leading its own; each man\'s line on the card is his track',
    timeoutMs: 120_000,
    fn() {
      // (each lane's window case, and its wash led by the case's words, or by the one thing where a casualty ended it: the bang kept by the
      // keys bot is shot walking in on every sheet, so its case is read off the window and its wash led by the casualty's lesson)
      const lanes = [
        { want: 'late', o: { tier: 'sgt', code: 'bang,loose', late: 3000 } },
        { want: 'kept', o: { tier: 'private', code: 'bang,loose', bot: 'keys' } },
        { want: ['faster', 'slower'], o: { tier: 'sgt', code: 'quiet,loose' } },
        { want: 'held', o: { tier: 'recruit', code: 'quiet,held', bot: 'fuzz', seed: 1 } },
      ];
      const bad = [];
      let led = 0;
      for (const { want, o } of lanes) {
        const { rec } = breachLane(o), first = rec.wash.lines[0], k = windowCaseOf(rec.W), W = rec.W, said = caseOfLine(first);
        console.log(`      ${breachLine(rec)}`);
        console.log(`        the case ${k}; the wash leads "${first}" (${said ?? 'the one thing'}); men ${(rec.sheet.breach?.men ?? []).join(' | ')}`);
        if (!(Array.isArray(want) ? want.includes(k) : k === want)) bad.push(`${o.tier} ${o.code}: the case ${k}, not ${want}`);
        if (rec.casualty ? first !== rec.sheet.one.text : said !== k) bad.push(`${o.tier} ${o.code}: "${first}"`);
        if (rec.casualty) led++;
        // (each man's fall and give on his line as on his track)
        const g = rec.sheet.breach, t0 = W.bangAtMs ?? W.doorAtMs;
        for (const [key, M] of Object.entries(W.men)) {
          const tr = rec.track[key] ?? [], line = g.men.find(x => x.startsWith(`${String(M.stand).toUpperCase()}:`)) ?? '';
          const down = /DOWN AT ([0-9.]+) S/.exec(line), gave = /GAVE UP AT ([0-9.]+) S/.exec(line);
          if (M.downAtMs !== null && (!down || Math.abs(Number(down[1]) * 1000 - (M.downAtMs - t0)) > 5)) bad.push(`${M.stand}'s fall: "${line}" against ${M.downAtMs - t0} ms`);
          if (M.gaveAtMs !== null && (!gave || Math.abs(Number(gave[1]) * 1000 - (M.gaveAtMs - t0)) > 5)) bad.push(`${M.stand}'s give: "${line}" against ${M.gaveAtMs - t0} ms`);
          const tDown = tr.find(e => e[1] === 'down')?.[0] ?? null, tHands = tr.find(e => e[1] === 'hands')?.[0] ?? null;
          if (tDown !== M.downAtMs || tHands !== M.gaveAtMs) bad.push(`${M.stand}'s track ${JSON.stringify(tr)} against down ${M.downAtMs}, gave ${M.gaveAtMs}`);
        }
      }
      assert(!bad.length, bad.join('; '));
      assert(led >= 1 && led < lanes.length, `a casualty's lesson led ${led} of ${lanes.length} washes`);
    },
  },
];
