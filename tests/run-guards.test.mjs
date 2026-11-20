// OLYMPUS tests: the runner's honest lines (v0.0.28's stage 0, its build sheet §2 step 3, §6; the hardening lens HD§3).
//
// tests/run.mjs judges each quick file's CPU, and the quick suite's sum, on the CPU normalised by the factor its own worker read just
// before it (helpers.mjs workerK, cpuNormS), against the ceilings themselves (QUICK_FILE_CPU_S 3 s, QUICK_SLOW's, QUICK_CPU_S 375 s,
// untouched); and the wall limit only while the load at the run's start and its end is at most half the cores (wallJudged). Measured
// on the v0.0.26 tag: three workers beside other workflows ran the same files 7 to 15% slower in CPU (342.6 s at two workers, 399.0 s
// at three, the same hour), so the line was red on the neighbours. These cases hold the rules with scripted figures (a file 10% slow in
// a busy worker judged at its normalised CPU, green; a file 3% over its line on a quiet machine still red, as before the change; the
// sum the same way; the wall's load rule), and that the runner reads them and its ceilings are the tag's. The rules fail without their
// fix: the old judge (the raw CPU against the ceiling × the runner's one factor, 1.00 here) holds the busy worker's file red. The real
// runner was probed the same way once (lead.md, a scratch file deleted after).
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { assert, root, workerK, cpuNormS, overCeiling, wallJudged } from './helpers.mjs';

const RUNNER = () => readFileSync(path.join(root, 'tests', 'run.mjs'), 'utf8');
const constOf = (src, name) => Number(new RegExp(`const ${name} = ([0-9.]+);`).exec(src)?.[1]);

export default [
  {
    name: 'a quick file 10% slow in a busy worker (its factor 1.10, 3.30 s of CPU at the 3 s line) is judged at its normalised 3.00 s and passes; on a quiet machine (1.00) a file 3% over (3.09 s) is red, as before; the old judge (the raw CPU against the ceiling × the runner\'s one factor) held the busy one red',
    fn() {
      const busy = { cpuMs: 3300, k: 1.10 }, quiet = { cpuMs: 3090, k: 1.00 }, ceil = 3;
      const nBusy = cpuNormS(busy.cpuMs, busy.k), nQuiet = cpuNormS(quiet.cpuMs, quiet.k);
      const oldBusy = busy.cpuMs / 1000 > ceil * 1.00;
      // (a factor under 1, a fast worker, never makes a file look slower: the factor is held at 1 at least, as machineK's)
      const nFast = cpuNormS(2950, 0.94);
      console.log(`      busy: ${(busy.cpuMs / 1000).toFixed(2)} s at × ${busy.k.toFixed(2)} → ${nBusy.toFixed(3)} s normalised, over ${ceil} s ${overCeiling(nBusy, ceil)} (the old judge over ${oldBusy}); quiet: ${(quiet.cpuMs / 1000).toFixed(2)} s at × 1.00 → ${nQuiet.toFixed(3)} s, over ${overCeiling(nQuiet, ceil)}; a fast worker's 2.95 s at × 0.94 → ${nFast.toFixed(3)} s`);
      assert(!overCeiling(nBusy, ceil) && oldBusy, JSON.stringify({ nBusy, oldBusy }));
      assert(overCeiling(nQuiet, ceil) && nQuiet === quiet.cpuMs / 1000, JSON.stringify({ nQuiet }));
      assert(nFast === 2.95, JSON.stringify({ nFast }));
    },
  },
  {
    name: 'the quick suite\'s sum normalised file by file: 400 s of CPU at a mean factor 1.10 is 363.6 s, under QUICK_CPU_S 375; 380 s on a quiet machine is red; the wall judged only while the load at the start and the end is at most half the cores',
    fn() {
      const files = Array.from({ length: 400 }, () => ({ cpuMs: 1000, k: 1.10 })), sum = files.reduce((a, f) => a + cpuNormS(f.cpuMs, f.k), 0);
      const quietSum = Array.from({ length: 380 }, () => cpuNormS(1000, 1)).reduce((a, b) => a + b, 0);
      const walls = [[3.0, 4.0, 15, true], [7.5, 7.5, 15, true], [9.0, 4.0, 15, false], [3.0, 8.0, 15, false], [1.0, 1.0, 4, true], [2.5, 1.0, 4, false]];
      const wrong = walls.filter(([a, b, c, want]) => wallJudged(a, b, c) !== want);
      console.log(`      400 files of 1.00 s at × 1.10: ${sum.toFixed(1)} s normalised (375 the budget), over ${overCeiling(sum, 375)}; 380 s at × 1.00: over ${overCeiling(quietSum, 375)}; the wall judged at loads ${walls.map(([a, b, c]) => `${a}/${b} on ${c}: ${wallJudged(a, b, c) ? 'yes' : 'no'}`).join(', ')}`);
      assert(Math.abs(sum - 363.636) < 0.01 && !overCeiling(sum, 375) && overCeiling(quietSum, 375) && !wrong.length, JSON.stringify({ sum, wrong }));
    },
  },
  {
    name: 'the runner reads them (workerK before each quick file and the warm-up, cpuNormS and overCeiling for each file and the sum, wallJudged for the minute) and its ceilings are the last tag\'s: QUICK_FILE_CPU_S 3, QUICK_CPU_S 375, QUICK_LIMIT_S 60; workerK times the best of three thirds of the reference loop, never under 1',
    fn() {
      const src = RUNNER(), w = workerK();
      const has = { workerK: (src.match(/\bworkerK\(\)\.k/g) ?? []).length >= 2, norm: /normOf = \(f\) => cpuNormS\(cpu\[f\], kOf\(f\)\)/.test(src), over: /overCeiling\(sumS, QUICK_CPU_S\)/.test(src), file: /overCeiling\(normOf\(f\), ceilOf\(f\)\)/.test(src), wall: /judged = wallJudged\(loadStart, loadNow, cores\)/.test(src) && /overTime = judged && totalS > limitS/.test(src), loadStart: /const loadStart = os\.loadavg\(\)\[0\]/.test(src) };
      let tag = null, then = null;
      try {
        tag = execFileSync('git', ['describe', '--tags', '--abbrev=0'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        then = execFileSync('git', ['show', `${tag}:tests/run.mjs`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 24 });
      } catch { /* (no git here, the play copy's checkout: the constants are read against their values) */ }
      const NAMES = ['QUICK_FILE_CPU_S', 'QUICK_CPU_S'], now = Object.fromEntries(NAMES.map(n => [n, constOf(src, n)]));
      const want = then ? Object.fromEntries(NAMES.map(n => [n, constOf(then, n)])) : { QUICK_FILE_CPU_S: 3, QUICK_CPU_S: 375 };
      const limit = Number(/const QUICK_LIMIT_S = Number\(process\.env\.QUICK_LIMIT_S\) \|\| ([0-9]+);/.exec(src)?.[1]);
      console.log(`      the runner: ${Object.entries(has).map(([k, v]) => `${k} ${v ? 'yes' : 'NO'}`).join(', ')}; ${NAMES.map(n => `${n} ${now[n]} (the ${tag ?? 'expected'}'s ${want[n]})`).join(', ')}, QUICK_LIMIT_S ${limit}; workerK here × ${w.k.toFixed(2)} (${w.ms.toFixed(1)} ms)`);
      assert(Object.values(has).every(Boolean), JSON.stringify(has));
      assert(NAMES.every(n => now[n] === want[n]) && now.QUICK_FILE_CPU_S === 3 && now.QUICK_CPU_S === 375 && limit === 60, JSON.stringify({ now, want, limit }));
      assert(w.k >= 1 && w.ms > 0, JSON.stringify(w));
    },
  },
];
