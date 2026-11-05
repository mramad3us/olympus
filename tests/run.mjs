// OLYMPUS test runner: `npm test` or `node tests/run.mjs [filter]`.
//
// Each tests/*.test.mjs default-exports an array of { name, fn, heavy?, timeoutMs? } (fn may be
// async; it passes by returning, fails by throwing). Files run in name order, tests in the order
// written, one at a time in this one process: no hooks, no fixtures, shared setup is a plain
// function. A test's full name is "<file> › <name>", and the filter keeps those that contain it.
// Other .mjs files in tests/ are helpers and aren't run.
//
// QUICK=1 (`npm run test:quick`) leaves out the heavy ones (timed, long, machine-loading: the
// browser): use it whenever the user may be playing, since their game shares the machine.
// SKIP=a,b leaves out the tests whose names hold any of those. Both are counted as left out.
//
// A test that never settles would hang a release (tools/release.sh waits on this), so each one
// gets timeoutMs, else TIMEOUT_MS from the environment, else five minutes (my call), and a run
// with a test timed out ends the process outright: whatever it left open (a browser, a server)
// can't keep it alive. A test file that fails to load is a failure, not a crash, so the other
// files still run. Tests print the numbers that matter, indented six spaces under their line:
// read them, don't just count passes.
//
// The quick suite stays under a minute (TECH §13.7): it is what runs while the user may be
// playing. So a QUICK=1 run with no filter prints its total ("quick suite: 41.2 s (limit 60 s)")
// and fails above QUICK_LIMIT_S, 60 unless the environment says otherwise. A run that fails on
// time alone while the user plays is run again on a quiet machine before anything is changed, since
// the machine is shared.
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const filter = process.argv[2] || '';
const quick = !!process.env.QUICK;
const skip = (process.env.SKIP || '').split(',').map(x => x.trim()).filter(Boolean);
const defaultTimeoutMs = Number(process.env.TIMEOUT_MS) || 5 * 60 * 1000;
const QUICK_LIMIT_S = Number(process.env.QUICK_LIMIT_S) || 60;
const files = readdirSync(dir).filter(f => f.endsWith('.test.mjs')).sort();
const first = (e, n = 4) => String(e?.stack || e?.message || e).split('\n').slice(0, n).join('\n      ');

let pass = 0, fail = 0, left = 0, timedOut = 0;
const runT0 = performance.now();
for (const file of files) {
  const base = file.replace('.test.mjs', '');
  let tests;
  try {
    tests = (await import(pathToFileURL(path.join(dir, file)).href)).default;
    if (!Array.isArray(tests)) throw new Error(`${file} must default-export an array of { name, fn }`);
  } catch (e) {
    if (!filter || base.includes(filter)) { fail++; console.log(`  ✗ ${base} (did not load)\n      ${first(e)}`); }
    else console.log(`  (${file} did not load: ${String(e?.message || e).split('\n')[0]})`);
    continue;
  }
  for (const t of tests) {
    const full = `${base} › ${t.name}`;
    if (filter && !full.includes(filter)) continue;
    if ((quick && t.heavy) || skip.some(k => full.includes(k))) { left++; continue; }
    const limitMs = t.timeoutMs ?? defaultTimeoutMs;
    const t0 = performance.now();
    let timer;
    try {
      await Promise.race([
        Promise.resolve().then(() => t.fn()),
        new Promise((_, reject) => { timer = setTimeout(() => { timedOut++; reject(new Error(`timed out after ${limitMs} ms`)); }, limitMs); }),
      ]);
      pass++;
      console.log(`  ✓ ${full} (${(performance.now() - t0).toFixed(0)} ms)`);
    } catch (e) {
      fail++;
      console.log(`  ✗ ${full}\n      ${first(e)}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
const totalS = (performance.now() - runT0) / 1000;
// (the quick suite's minute: only a whole quick run is timed, a filtered one isn't the suite)
let overTime = false;
if (quick && !filter) {
  overTime = totalS > QUICK_LIMIT_S;
  console.log(`\nquick suite: ${totalS.toFixed(1)} s (limit ${QUICK_LIMIT_S} s)${overTime ? ': over the limit, a failure (TECH §13.7; run it again on a quiet machine before changing anything)' : ''}`);
}
const summary = `\n${pass} passed, ${fail + (overTime ? 1 : 0)} failed${left ? `, ${left} left out` : ''}${timedOut ? `, ${timedOut} timed out` : ''} (${totalS.toFixed(1)} s)\n`;
// (after a time-out, exit once the summary is written: stdout to a pipe is asynchronous here, and
// an exit straight after the write would lose it)
if (timedOut) process.stdout.write(summary, () => process.exit(1));
else { process.stdout.write(summary); process.exitCode = fail || overTime ? 1 : 0; }
