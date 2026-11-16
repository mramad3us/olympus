// OLYMPUS test runner: `npm test` or `node tests/run.mjs [filter]`.
//
// Each tests/*.test.mjs default-exports an array of { name, fn, heavy?, timeoutMs? } (fn may be
// async; it passes by returning, fails by throwing). Tests in a file run in the order written, one at
// a time: no hooks, no fixtures, shared setup is a plain function. A test's full name is
// "<file> › <name>", and the filter keeps those that contain it. Other .mjs files in tests/ are
// helpers and aren't run.
//
// QUICK=1 (`npm run test:quick`) leaves out the heavy ones (timed, long, machine-loading: the
// browser): use it whenever the user may be playing, since their game shares the machine.
// SKIP=a,b leaves out the tests whose names hold any of those. Both are counted as left out.
//
// In parallel (v0.0.11, TECH §13.7). The files run in four groups, each printed in name order:
//   - first, here in this process, one at a time: the files with a CPU-time ceiling that start no
//     browser (they call helpers.mjs machine() or machineK()). The factor is measured once before
//     anything else and printed, and these run on the quiet machine it was measured on: a ceiling
//     scaled by the machine's slowness means nothing while a dozen neighbours share the cores.
//   - the pool: every other file, in worker processes, JOBS of them (half the machine's cores, 7
//     on the user's M5 Pro, and at most PLAYING_JOBS 3 while the play copy answers on :8200), each this same script started with OLYMPUS_RUN_WORKER=1, taking a
//     file at a time and keeping its modules between files as the one process did before. The
//     longest files start first, by their times on the last whole run (.run/test-times.json, quick
//     and full apart; files not yet timed before any, the largest first). A browser file (one that
//     imports browser.mjs) runs only in a worker with a port of its own, OLYMPUS_TEST_PORT one of
//     browser.mjs POOL_PORTS (8240 to 8249), BROWSER_JOBS of them (at least LANES; 4 by default, my call:
//     core-browser, 228 s, holds one, and the other browser files, about 310 s together, fit in
//     three while it runs). A port is claimed with a lock file in the system's temporary folder, so
//     two runs at once (two agents) never share one, and one that already answers is passed over.
//   - the quiet lanes: the browser files that judge frame times (a median or a 95th percentile held
//     under a bound) or hold a CPU-time ceiling. They wait until every pooled file has started and at
//     most QUIET_WITH (1) still runs, the machine all but quiet, then run LANES (2) at once in the
//     workers with a port (my call: alone, one after another, they took 627 s of the full suite's
//     856, over its ten minutes by themselves; two at once on the quiet machine gave the same
//     numbers, every median 16.7 ms and the GPU bursts within their noise). Every worker has the
//     factor measured first in OLYMPUS_MACHINE_K (helpers.mjs does not read it yet: view-areas, in
//     a lane, measures its own, on the all but quiet machine).
//   - last, here, one at a time: what no worker could take (the browser files, when no port could be
//     claimed: on OLYMPUS_TEST_PORT or 8223, as before). JOBS=0 runs every file here, in name order,
//     the runner before v0.0.11; LANES=1 QUIET_WITH=0 runs the quiet files strictly one at a time
//     after the pool.
// A worker's output (its stderr folded in) is held whole per file and printed in the file's place,
// so each test's numbers stay under its line and a log reads the same from run to run. What reaches
// the runner on a worker's stderr pipe (the engine's own: a Node warning, a native crash's trace) joins
// its stdout in arrival order, at a line's end, so it prints where it happened. A worker that dies in a
// file counts the ✓ and ✗ lines it had printed, and one failure more; its time is the file's time so
// far, so the next run's longest-first order still knows it. A filtered run claims browser ports, and
// prints the quiet lanes' header, only when a browser file may hold a test the filter keeps (by its
// name or its text: mayMatch); every file is still loaded, so one that fails to load still fails.
//
// A test that never settles would hang a release (tools/release.sh waits on this), so each one
// gets timeoutMs, else TIMEOUT_MS from the environment, else five minutes (my call). A worker with a
// test timed out finishes its file, reports, and is stopped with whatever it left open (a server, a
// browser: a worker leads a process group of its own, and the group is killed), and a fresh one
// takes its place; a run with a test timed out ends the process outright once its summary is
// written. A test file that fails to load is a failure (whatever the filter), not a
// crash, so the other files still run; a worker that dies in a file fails that file, and the rest
// go on. Ctrl+C stops every worker's group. Tests print the numbers that matter, indented six spaces
// under their line: read them, don't just count passes.
//
// The quick suite stays under a minute (TECH §13.7): it is what runs while the user may be
// playing. So a QUICK=1 run with no filter prints its total ("quick suite: 41.2 s (limit 60 s)")
// and fails above QUICK_LIMIT_S, 60 unless the environment says otherwise (90 in v0.0.10, one file
// at a time). In macOS's background band the limit is scaled by the machine's measured slowness
// (machine().k, as the CPU-time ceilings are: 19 s in the foreground is about 70 s there), so a run
// does not fail on the band alone while the user plays. A run that fails on time alone is still run
// again on a quiet machine before anything is changed, since the machine is shared.
// From v0.0.21 (the build sheet v0.0.21 §1 item 26; the perf lens P5; TECH §13.7) the minute is the full pool's: the wall
// limit is QUICK_LIMIT_S × max(1, QUICK_JOBS_REF 7 / JOBS) (a pool of 2, the build's roles, or of 3 while the user plays,
// needs 7/2 or 7/3 of the time for the same work), printed with its parts. The guard that does not move with the neighbours
// is CPU: each file's CPU (process.cpuUsage() in the process that ran it, from its module loaded to its last test) is measured, the ten largest
// quick files printed, and a quick file over QUICK_FILE_CPU_S 3 s × k fails unless QUICK_SLOW names it, each with its own
// ceiling × k, frozen at v0.0.21's stage 0 (its measure plus 25%): a ceiling may only go down and no file may join the list
// (tests/syntax.test.mjs checks it against the last tag's). A whole quick run's CPU summed fails over QUICK_CPU_S × k. A whole
// lane in a quick file is heavy, unless it is one sheet on one seed (v0.0.19's rule, now checked). On this shared machine a
// neighbour still adds CPU (contention moves work onto the efficiency cores), so a file over its budget is read again: the
// machine's factor after it, and the file run once more alone in a fresh worker, held by the less of its two runs (noise only
// adds, as F60's minimum of three has it). With the one-minute load over half the cores the budgets are printed and not judged
// (contention inflates CPU time itself: 288 to 372 s for the same quick suite at stage 0), as the wall minute is run again on a
// quiet machine; QUICK_CPU_JUDGE=1 judges them whatever the load.
//
// The priority (0.0.3). On macOS a process started from an app in the background (the terminal behind
// a game in front) runs in the darwin background band (`ps -o pri` 4, a foreground terminal's 31), on
// the efficiency cores: CPU work there runs 3.5 to 4 times slower (a plain loop, 380 ms against
// 101 ms), and the headless Chrome the browser tests start inherits it and paces its frames at 10 Hz.
// It can't be left from inside (taskpolicy -B does not stick while the app stays behind), so the
// runner says so once at the start; CPU-time ceilings are scaled by helpers.mjs machineK(), the
// machine's measured slowness against the foreground's.
import { readdirSync, readFileSync, writeFileSync, renameSync, mkdirSync, unlinkSync, statSync } from 'node:fs';
import { execFileSync, fork } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer, connect } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { POOL_PORTS } from './browser.mjs';

const self = fileURLToPath(import.meta.url);
const dir = path.dirname(self);
const filter = process.argv[2] || '';
const quick = !!process.env.QUICK;
const skip = (process.env.SKIP || '').split(',').map(x => x.trim()).filter(Boolean);
const defaultTimeoutMs = Number(process.env.TIMEOUT_MS) || 5 * 60 * 1000;
/** The pool's ceiling while the user is likely playing (the play copy answering on :8200 and the machine in use, PLAYING_IDLE_S). */
const PLAYING_JOBS = 3;
/**
 * The keyboard and mouse idle (s) past which the user is not playing, though the play copy still answers (the user,
 * 2026-11-15: "I've not been playing for hours"; the server alone had kept every run at 3 workers all day). macOS's
 * HIDIdleTime (ioreg); elsewhere, or if it can't be read, the server alone decides, as before.
 */
const PLAYING_IDLE_S = 300;
/** The seconds since the last keyboard or mouse input (macOS), or null. */
function hidIdleS() {
  if (process.platform !== 'darwin') return null;
  try {
    const m = /"HIDIdleTime" = (\d+)/.exec(execFileSync('ioreg', ['-c', 'IOHIDSystem', '-d', '4'], { encoding: 'utf8', timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] }));
    return m ? Number(m[1]) / 1e9 : null;
  } catch { return null; }
}
const QUICK_LIMIT_S = Number(process.env.QUICK_LIMIT_S) || 60;   // (60 again from v0.0.11, in parallel; 90 in v0.0.10, one file at a time: 875 quick tests in 73 s)
/** The pool the quick suite's minute is set for (v0.0.21: the user's 7 workers; a smaller pool's limit is scaled by 7/JOBS). */
const QUICK_JOBS_REF = 7;
/** A quick file's CPU budget (s × k; v0.0.19's rule, checked from v0.0.21): over it, a file fails unless QUICK_SLOW names it. */
const QUICK_FILE_CPU_S = 3;
/** The whole quick suite's CPU budget (s × k), set from v0.0.21 stage 0's first whole run (see TECH §13.7). */
const QUICK_CPU_S = 375;   // (v0.0.21's stage 0: the whole quick runs measured 288.4 to 298.6 s at JOBS=3, plus 25%; the build sheet's 200 was an estimate before v0.0.20's suites)
/**
 * The quick files over QUICK_FILE_CPU_S at v0.0.21's stage 0, each with its ceiling (s × k: its measure plus 25%). Frozen: a
 * ceiling may only go down and no file may join (tests/syntax.test.mjs against the last tag's list); a file that falls under
 * 3 s leaves it. A new quick file over 3 s × k is moved to heavy, never added here.
 */
const QUICK_SLOW = Object.freeze({
  // (v0.0.21's stage 0, four whole quick runs at JOBS=3: each file's worst measure plus 25%; the files from 2.4 s, whose 25% reaches 3 s)
  'house-fumble.test.mjs': 15.3,
  'house-unpinned.test.mjs': 14.7,
  'plan-walk.test.mjs': 14.3,
  'house-sidearm.test.mjs': 10.2,
  'game-upgrade.test.mjs': 9.3,
  'game-walk.test.mjs': 7.9,
  'panel-groups.test.mjs': 7.9,
  'pairs-head.test.mjs': 7.5,
  'shoothouse-again.test.mjs': 7.5,
  'hunt-kit.test.mjs': 7.3,
  'house-two.test.mjs': 6.1,
  'kd-review.test.mjs': 5.5,
  'house-live-save.test.mjs': 5.3,
  'audio-gun.test.mjs': 5.1,
  'stress-review.test.mjs': 5.0,
  'hunt-pistol.test.mjs': 4.9,
  'scene-range.test.mjs': 4.9,
  'panel-keys.test.mjs': 4.7,
  'ui-zeroing.test.mjs': 4.7,
  'kd-tower.test.mjs': 4.4,
  'scene-shoothouse.test.mjs': 4.4,
  'house-flash.test.mjs': 4.3,
  'house-live-perf.test.mjs': 4.1,
  'house-catalogue.test.mjs': 4.0,
  'kit-makers.test.mjs': 3.9,
  'scene-bangs.test.mjs': 3.8,
  'reads-scope.test.mjs': 3.6,
  'house-corner.test.mjs': 3.6,
  'house-shoot.test.mjs': 3.5,
  'team-task.test.mjs': 3.3,
  'house-breach.test.mjs': 3.2,
  'house-fixes.test.mjs': 3.2,
  'house-r9.test.mjs': 3.2,
  'hunt-look.test.mjs': 3.1,
  'house-bodies.test.mjs': 3.1,
});
const first = (e, n = 4) => String(e?.stack || e?.message || e).split('\n').slice(0, n).join('\n      ');

/** Marks a worker's report in its output: what comes before it is the file's. */
const MARK = '\x1e';
const REPORT = new RegExp(`${MARK}END (.*?)${MARK}\n?`);

/** One file's tests, in order: { pass, fail, left, timedOut, ms }. log(text) prints a line. */
async function runFile(file, log) {
  const base = file.replace('.test.mjs', '');
  const r = { pass: 0, fail: 0, left: 0, timedOut: 0, ms: 0, cpuMs: 0 };
  // (v0.0.21: a file's CPU is its tests' own, from its module loaded to its last test: the src modules' first load falls on
  // whichever file a process loads first, 1 to 2 s, and would make a file's CPU depend on its place in the pool)
  const f0 = performance.now();
  let c0 = process.cpuUsage();
  const cpuDone = () => { const c = process.cpuUsage(c0); r.cpuMs = Math.round((c.user + c.system) / 1000); };
  let tests;
  try {
    tests = (await import(pathToFileURL(path.join(dir, file)).href)).default;
    if (!Array.isArray(tests)) throw new Error(`${file} must default-export an array of { name, fn }`);
    c0 = process.cpuUsage();
  } catch (e) {
    // (a file that does not load is a failure whatever the filter: its tests can't be told apart from the filter's
    // without it, and a pin that cannot load passed silently with a filter on its tests' names, "0 passed, 0 failed",
    // the sleeve fix's verifier's of v0.0.7)
    r.fail++; log(`  ✗ ${base} (did not load)\n      ${first(e)}`);
    r.ms = Math.round(performance.now() - f0); cpuDone();
    return r;
  }
  for (const t of tests) {
    const full = `${base} › ${t.name}`;
    if (filter && !full.includes(filter)) continue;
    if ((quick && t.heavy) || skip.some(k => full.includes(k))) { r.left++; continue; }
    const limitMs = t.timeoutMs ?? defaultTimeoutMs;
    const t0 = performance.now();
    let timer;
    try {
      await Promise.race([
        Promise.resolve().then(() => t.fn()),
        new Promise((_, reject) => { timer = setTimeout(() => { r.timedOut++; reject(new Error(`timed out after ${limitMs} ms`)); }, limitMs); }),
      ]);
      r.pass++;
      log(`  ✓ ${full} (${(performance.now() - t0).toFixed(0)} ms)`);
    } catch (e) {
      r.fail++;
      log(`  ✗ ${full}\n      ${first(e)}`);
    } finally {
      clearTimeout(timer);
    }
  }
  r.ms = Math.round(performance.now() - f0); cpuDone();
  // (v0.0.21: a quick file over its CPU budget × the run's factor reads the machine's factor again now, helpers.mjs machineNow: on
  // a shared Apple silicon machine contention moves work onto the efficiency cores and CPU time itself grows, so the factor
  // measured once at the run's start no longer says how slow this file's CPU ran; the runner holds the file to the slower of
  // the two, its ceiling untouched)
  if (quick && r.pass + r.fail > 0) {
    const kRun = Math.max(1, Number(process.env.OLYMPUS_MACHINE_K) || 1);
    if (r.cpuMs / 1000 > (QUICK_SLOW[file] ?? QUICK_FILE_CPU_S) * kRun) { const { machineNow } = await import('./helpers.mjs'); r.kNow = machineNow().k; }
  }
  return r;
}

// ---- a worker: a file at a time from the runner, its output on stdout, a report after each ----
if (process.env.OLYMPUS_RUN_WORKER === '1') {
  // (stderr folded into stdout, so a file's warnings stay with its lines; what the engine itself writes
  // to stderr still reaches the runner on the other pipe)
  process.stderr.write = process.stdout.write.bind(process.stdout);
  process.on('message', async ({ file }) => {
    const r = await runFile(file, s => console.log(s));
    // (after a time-out the worker leaves once its report is out: the runner kills what it left open)
    process.stdout.write(`${MARK}END ${JSON.stringify({ file, ...r })}${MARK}\n`, () => { if (r.timedOut) process.exit(3); });
  });
  process.on('disconnect', () => process.exit(0));
} else {
  await main();
}

/** Claims n of POOL_PORTS for this run: a lock file each (the pid inside; a dead pid's is taken over), and nothing listening there. */
async function claimPorts(n) {
  const lockDir = path.join(os.tmpdir(), 'olympus-test-ports');
  mkdirSync(lockDir, { recursive: true });
  const free = port => new Promise(res => { const s = createServer(); s.once('error', () => res(false)); s.listen(port, '127.0.0.1', () => s.close(() => res(true))); });
  const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
  const got = [];
  for (const port of POOL_PORTS) {
    if (got.length >= n) break;
    const lock = path.join(lockDir, `${port}.lock`);
    let mine = false;
    for (let tries = 0; tries < 2 && !mine; tries++) {
      try { writeFileSync(lock, String(process.pid), { flag: 'wx' }); mine = true; } catch (e) {
        if (e.code !== 'EEXIST') break;
        const pid = Number(readFileSync(lock, 'utf8').trim());
        if (pid && alive(pid)) break;
        try { unlinkSync(lock); } catch { /* (another run took it over first) */ }
      }
    }
    if (!mine) continue;
    if (await free(port)) got.push({ port, lock });
    else unlinkSync(lock);
  }
  return got;
}

/**
 * Whether a file may hold a test the filter keeps, from its name and its text alone (no import): the filter is in
 * "<file> › <name>", so with a ' › ' in it the part before must end the file's name; else it is in the file's name or
 * in its text (escaped quotes read plain). Generous: a name built in code may pass where it would not match, never
 * the reverse for a name written as a literal.
 */
function mayMatch(file, src) {
  if (!filter) return true;
  const base = file.replace('.test.mjs', ''), at = filter.indexOf(' ›');
  if (at >= 0) return base.endsWith(filter.slice(0, at));
  return base.includes(filter) || src.replace(/\\(['"`])/g, '$1').includes(filter);
}

async function main() {
  /** Below this `ps -o pri` a process is in macOS's background band (4 there; 31 a terminal's). */
  const BG_PRI_BELOW = 20;
  let inBand = false;
  if (process.platform === 'darwin') {
    let pri = null;
    try { pri = Number(execFileSync('ps', ['-o', 'pri=', '-p', String(process.pid)], { encoding: 'utf8' }).trim()); } catch { /* (no ps: nothing to say) */ }
    inBand = pri !== null && pri < BG_PRI_BELOW;
    if (inBand) console.log(`(the runner is in macOS's background band, priority ${pri}: CPU timings run slow here, and the CPU-time ceilings are scaled by the machine's measured slowness, helpers.mjs machineK())`);
  }
  const files = readdirSync(dir).filter(f => f.endsWith('.test.mjs')).sort();
  const runT0 = performance.now();
  // (v0.0.21: the quick suite runs with the read scope's guard on, src/core/reads.js: what the scope shares is frozen, so a
  // reader that writes into it throws; set before any test module loads, here and in every worker, which inherit it)
  if (quick && process.env.READS_FREEZE === undefined) process.env.READS_FREEZE = '1';
  // The factor the CPU-time ceilings use, measured now, before any work shares the machine.
  const { machine, REF_LOOP_MS } = await import('./helpers.mjs');
  const M = machine();
  console.log(`(the machine: the reference loop in ${M.ms.toFixed(1)} ms against ${REF_LOOP_MS} ms in the foreground, so the CPU-time ceilings × ${M.k.toFixed(2)}; measured before the pool)`);

  // What each file is, from its text: a browser file, one with a CPU-time ceiling, one with a frame-time ceiling.
  const CEILING = /\bmachine(?:K|Now)?\(\)/, FRAMES = /\b(?:medianMs|p95Ms)\s*<=|\bpct\(dts[^)]*\)\s*<=/, BROWSER = /from\s+['"]\.\/browser\.mjs['"]/;
  const kind = Object.fromEntries(files.map(f => {
    const src = readFileSync(path.join(dir, f), 'utf8');
    return [f, { browser: BROWSER.test(src), quiet: CEILING.test(src) || FRAMES.test(src), may: mayMatch(f, src) }];
  }));
  const num = (v, d) => (v === undefined || v === '' ? d : Math.max(0, Number(v) | 0));
  const cores = os.availableParallelism?.() ?? os.cpus().length;
  // (the pool is a guest on the user's Mac (their words of 2026-11-08 on the dozen node processes in Activity
  // Monitor): half the cores by default, and at most PLAYING_JOBS while the play copy answers on :8200, the user
  // likely playing; JOBS sets it outright)
  const served = await new Promise(done => { const c = connect({ host: '127.0.0.1', port: 8200 }); const end = (v) => { c.destroy(); done(v); }; c.once('connect', () => end(true)); c.once('error', () => end(false)); c.setTimeout(300, () => end(false)); });
  const idleS = served ? hidIdleS() : null, playing = served && !(idleS !== null && idleS > PLAYING_IDLE_S);
  if (served && !playing && process.env.JOBS === undefined) console.log(`(the play copy answers on :8200, but no keyboard or mouse for ${Math.round(idleS / 60)} min: the full pool)`);
  const JOBS = num(process.env.JOBS, playing ? Math.min(PLAYING_JOBS, Math.max(1, Math.floor(cores / 2))) : Math.max(1, Math.floor(cores / 2)));
  if (process.env.JOBS === undefined) console.log(`(the pool: ${JOBS} worker${JOBS === 1 ? '' : 's'} of ${cores} cores${playing ? ', the play copy answering on :8200, so the pool is kept small' : ''}; JOBS sets it)`);
  const BROWSER_JOBS = Math.min(POOL_PORTS.length, num(process.env.BROWSER_JOBS, 4));
  const LANES = num(process.env.LANES, 2), QUIET_WITH = num(process.env.QUIET_WITH, 1);

  // Last whole run's times, the longest first (files not yet timed first of all, the largest first).
  const timesFile = path.join(dir, '..', '.run', 'test-times.json'), mode = quick ? 'quick' : 'full';
  let times = {};
  try { times = JSON.parse(readFileSync(timesFile, 'utf8')); } catch { /* (none yet) */ }
  const past = times[mode] ?? {};
  const size = f => statSync(path.join(dir, f)).size;
  const longestFirst = (a, b) => (a in past) - (b in past) || (past[b] ?? size(b)) - (past[a] ?? size(a)) || a.localeCompare(b);

  let ports = [];
  if (JOBS > 0 && files.some(f => kind[f].browser && kind[f].may)) ports = await claimPorts(Math.min(JOBS, Math.max(BROWSER_JOBS, LANES)));
  const releasePorts = () => { for (const p of ports) { try { if (readFileSync(p.lock, 'utf8').trim() === String(process.pid)) unlinkSync(p.lock); } catch { /* (gone already) */ } } };
  process.on('exit', releasePorts);

  // The four groups, each in name order: first (here, before the pool), the pool, the quiet lanes, last (here, after).
  const serial = JOBS === 0;
  const first = serial ? [] : files.filter(f => kind[f].quiet && !kind[f].browser);
  const lanes = serial || !ports.length || !LANES ? [] : files.filter(f => kind[f].quiet && kind[f].browser);
  const pooled = serial ? [] : files.filter(f => !kind[f].quiet && (!kind[f].browser || ports.length));
  const last = files.filter(f => !first.includes(f) && !lanes.includes(f) && !pooled.includes(f));
  const total = { pass: 0, fail: 0, left: 0, timedOut: 0 };
  const add = r => { for (const k of Object.keys(total)) total[k] += r[k]; };
  const took = {}, cpu = {}, ran = {}, kNow = {};
  const names = list => list.map(f => f.replace('.test.mjs', '')).join(', ') || 'none';
  const here = async list => { for (const file of list) { const r = await runFile(file, s => console.log(s)); add(r); took[file] = r.ms; cpu[file] = r.cpuMs; ran[file] = r.pass + r.fail; if (r.kNow) kNow[file] = r.kNow; } };

  // ---- first: the CPU-time ceilings' files, here, on the machine the factor was measured on ----
  const firstT0 = performance.now();
  if (first.length) console.log(`(first, alone: ${names(first)})\n`);
  await here(first);
  const firstS = (performance.now() - firstT0) / 1000;

  // ---- the pool, and the quiet lanes ----
  // (the lanes open once every pooled file has started and at most QUIET_WITH of them still run: by then the
  // pool is one long browser file or two, the machine all but quiet; then the workers with a port take the
  // frame-time and browser ceiling files, LANES at once)
  const realWrite = process.stdout.write.bind(process.stdout), say = s => realWrite(`${s}\n`);
  const order = [...pooled, ...lanes];   // (the order the output is printed in)
  const pending = [...pooled].sort(longestFirst), lanePending = [...lanes].sort(longestFirst);
  const done = new Map();
  let next = 0, poolS = 0, quietAt = null, laneOpen = false;
  const drain = () => {
    while (next < order.length && done.has(order[next])) {
      if (next === pooled.length && lanes.some(f => kind[f].may)) say(`\n(the quiet lanes, ${LANES} at once, from +${(quietAt ?? 0).toFixed(1)} s, with at most ${QUIET_WITH} pooled file${QUIET_WITH === 1 ? '' : 's'} still running: ${names(lanes)})`);
      const out = done.get(order[next++]);
      if (out) realWrite(out.endsWith('\n') ? out : `${out}\n`);
    }
  };
  const poolT0 = performance.now();
  if (order.length) await new Promise(resolveAll => {
    const nWorkers = Math.min(JOBS, Math.max(order.length, ports.length ? 1 : 0));
    const nPorts = Math.min(ports.length, nWorkers);
    say(`(${pooled.length} files on ${nWorkers} workers, ${nPorts} with a browser port (${ports.slice(0, nPorts).map(p => p.port).join(', ') || 'none'})${lanes.length ? `; then ${lanes.length} in the quiet lanes` : ''}${last.length ? `; ${last.length} here after: ${names(last)}` : ''})\n`);
    const live = new Set(), all = new Set(), busy = new Set(), laneBusy = new Set();
    const stopGroup = (w, sig) => { try { process.kill(-w.child.pid, sig); } catch { /* (the group is gone) */ } };
    // (Ctrl+C: every worker's group stopped, nothing more started or reported, and out with 130)
    let stopping = false;
    const onSignal = () => {
      stopping = true;
      for (const w of all) stopGroup(w, 'SIGTERM');
      setTimeout(() => { for (const w of all) stopGroup(w, 'SIGKILL'); releasePorts(); process.exit(130); }, 1000);
    };
    process.once('SIGINT', onSignal); process.once('SIGTERM', onSignal);
    const idle = new Set();
    const take = w => {
      idle.delete(w);
      let file = null;
      if (w.port && laneOpen && lanePending.length && laneBusy.size < LANES) { file = lanePending.shift(); laneBusy.add(w); } else {
        // (a worker with a port takes a browser file first; the rest take the longest file left that needs none)
        let i = w.port ? pending.findIndex(f => kind[f].browser) : -1;
        if (i < 0) i = pending.findIndex(f => !kind[f].browser);
        if (i >= 0) { file = pending.splice(i, 1)[0]; busy.add(w); }
      }
      if (file) { w.file = file; w.out = ''; w.t0 = performance.now(); w.child.send({ file }); return; }
      // (a worker with a port waits while the lanes still have files; the others are done)
      if (w.port && lanePending.length) idle.add(w); else w.child.disconnect();
    };
    const checkQuiet = () => {
      if (!laneOpen && !pending.length && busy.size <= QUIET_WITH) { laneOpen = true; quietAt = (performance.now() - poolT0) / 1000; }
      if (laneOpen) for (const w of [...idle]) take(w);
    };
    const finish = (w, out, r) => {
      add(r); took[w.file] = r.ms || past[w.file] || 0; cpu[w.file] = r.cpuMs ?? 0; ran[w.file] = r.pass + r.fail; if (r.kNow) kNow[w.file] = r.kNow; done.set(w.file, out);
      busy.delete(w); laneBusy.delete(w); w.file = null;
      drain();
    };
    const start = port => {
      const env = { ...process.env, OLYMPUS_RUN_WORKER: '1', OLYMPUS_MACHINE_K: String(M.k) };
      if (port) env.OLYMPUS_TEST_PORT = String(port.port);
      const child = fork(self, process.argv.slice(2), { env, stdio: ['ignore', 'pipe', 'pipe', 'ipc'], detached: true });
      const w = { child, port, file: null, out: '', buf: '', err: '', t0: 0 };
      live.add(w); all.add(w);
      child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
      // (the stderr pipe joins stdout in arrival order, at a line's end: never inside a line, nor inside a report's mark)
      const joinErr = () => { if (w.err && (!w.buf || w.buf.endsWith('\n'))) { w.buf += w.err.endsWith('\n') ? w.err : `${w.err}\n`; w.err = ''; } };
      child.stderr.on('data', d => { w.err += d; joinErr(); });
      child.stdout.on('data', d => {
        w.buf += d;
        joinErr();
        for (let m; (m = REPORT.exec(w.buf));) {
          w.out += w.buf.slice(0, m.index); w.buf = w.buf.slice(m.index + m[0].length);
          const r = JSON.parse(m[1]);
          finish(w, w.out, r);
          if (r.timedOut) { checkQuiet(); return; }   // (it leaves on its own: see exit)
          take(w); checkQuiet();
        }
      });
      child.on('exit', (code, signal) => {
        live.delete(w); idle.delete(w);
        if (stopping) return;
        all.delete(w);
        stopGroup(w, 'SIGKILL');   // (what it left open: a server, a browser)
        if (w.file) {
          // (what it printed before it died still counts: its ✓ and ✗ lines, and the death one failure more; its time so far)
          const said = `${w.out}${w.buf}${w.err ? (w.err.endsWith('\n') ? w.err : `${w.err}\n`) : ''}`, count = re => (said.match(re) ?? []).length;
          finish(w, `${said}  ✗ ${w.file.replace('.test.mjs', '')} (its worker stopped: ${signal ?? `exit code ${code}`})\n`,
            { pass: count(/^ {2}✓ /gm), fail: count(/^ {2}✗ /gm) + 1, left: 0, timedOut: 0, ms: Math.round(performance.now() - w.t0) });
        }
        if (pending.some(f => !kind[f].browser || port) || (port && lanePending.length)) take(start(port));
        checkQuiet();
        if (!live.size) { poolS = (performance.now() - poolT0) / 1000; process.removeListener('SIGINT', onSignal); process.removeListener('SIGTERM', onSignal); resolveAll(); }
      });
      return w;
    };
    for (let k = 0; k < nWorkers; k++) take(start(k < nPorts ? ports[k] : null));
    checkQuiet();
  });
  drain();

  // ---- last: whatever had no worker (browser files when no port could be had; everything with JOBS=0), here ----
  const lastT0 = performance.now();
  if (order.length && last.length) console.log(`\n(here, after the pool: ${names(last)})`);
  await here(last);
  const lastS = (performance.now() - lastT0) / 1000;
  const totalS = (performance.now() - runT0) / 1000;
  // (the times only from a whole run: a filtered one's files are not the files' times)
  if (!filter && !skip.length) {
    try {
      mkdirSync(path.dirname(timesFile), { recursive: true });
      const fresh = {}; for (const f of files) if (took[f] !== undefined) fresh[f] = took[f];
      times[mode] = fresh;
      // (v0.0.21: each file's CPU on the last whole run too, ms, beside its time: QUICK_SLOW's measure, TECH §13.7)
      const freshCpu = {}; for (const f of files) if (cpu[f] !== undefined) freshCpu[f] = cpu[f];
      times[`${mode}Cpu`] = freshCpu;
      writeFileSync(`${timesFile}.${process.pid}`, JSON.stringify(times, null, 1));
      renameSync(`${timesFile}.${process.pid}`, timesFile);
    } catch { /* (no .run: the order is only by name next time) */ }
  }
  if (!serial) console.log(`\n(first ${firstS.toFixed(1)} s; the pool and the lanes ${poolS.toFixed(1)} s${quietAt !== null && lanes.length ? `, the lanes from +${quietAt.toFixed(1)} s` : ''}; last ${lastS.toFixed(1)} s)`);
  // (the quick suite's minute: only a whole quick run is timed, a filtered one isn't the suite)
  let overTime = false, overCpu = 0;
  // (v0.0.21: a quick file over its CPU budget runs once more, alone, in a fresh worker, and is held by the least of its two runs:
  // a neighbour only adds CPU (the efficiency cores' slower work under contention), as the busiest tick's minimum of three has it
  // (tests/tick-costs.mjs); a browser file is judged on its one run)
  const again = async (file) => new Promise(done => {
    const child = fork(self, process.argv.slice(2), { env: { ...process.env, OLYMPUS_RUN_WORKER: '1', OLYMPUS_MACHINE_K: String(M.k) }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'], detached: true });
    let buf = '', got = null;
    child.stdout.setEncoding('utf8'); child.stdout.on('data', d => { buf += d; const m = REPORT.exec(buf); if (m && got === null) { got = JSON.parse(m[1]); child.disconnect(); } });
    child.stderr.resume();
    child.on('exit', () => done(got));
    child.send({ file });
  });
  // (v0.0.21: the CPU budgets are judged on a machine not saturated: with the one-minute load over half the cores (other agents'
  // runs, a build) contention inflates CPU time itself, 288 to 372 s for the same suite measured at stage 0, so they are printed
  // and not counted, as the wall minute is run again on a quiet machine; QUICK_CPU_JUDGE=1 judges them whatever the load)
  const loadNow = os.loadavg()[0], busy = loadNow > cores / 2 && process.env.QUICK_CPU_JUDGE !== '1';
  if (quick) {
    // (v0.0.21: each quick file's CPU against its budget, the ten largest printed; see the header)
    const k = Math.max(1, M.k), quickRan = Object.keys(cpu).filter(f => ran[f] > 0).sort((a, b) => cpu[b] - cpu[a]);
    // (each file by the slower of the run's factor and the one its worker read after it, where it read one: see runFile)
    const kOf = (f) => Math.max(k, kNow[f] ?? 1), overOf = (f) => cpu[f] / 1000 > (QUICK_SLOW[f] ?? QUICK_FILE_CPU_S) * kOf(f);
    const ranAgain = [];
    for (const f of busy ? [] : quickRan.filter(overOf)) {
      if (kind[f].browser) continue;
      const r2 = await again(f);
      if (!r2) continue;
      ranAgain.push(`${f.replace('.test.mjs', '')} ${(cpu[f] / 1000).toFixed(1)} → ${(r2.cpuMs / 1000).toFixed(1)} s`);
      if (r2.cpuMs < cpu[f]) cpu[f] = r2.cpuMs;
      if (r2.kNow) kNow[f] = Math.max(kNow[f] ?? 1, r2.kNow);
    }
    if (ranAgain.length) console.log(`(run again alone, over their budget on the first run: ${ranAgain.join(', ')}; each held by the less)`);
    quickRan.sort((a, b) => cpu[b] - cpu[a]);
    const over = quickRan.filter(overOf);
    const reread = Object.keys(kNow).filter(f => kNow[f] > k);
    if (reread.length) console.log(`(the machine's factor read again after a file over its budget × ${k.toFixed(2)}: ${reread.map(f => `${f.replace('.test.mjs', '')} × ${kNow[f].toFixed(2)}`).join(', ')})`);
    if (quickRan.length) console.log(`\n(the quick files' CPU, the ten largest: ${quickRan.slice(0, 10).map(f => `${f.replace('.test.mjs', '')} ${(cpu[f] / 1000).toFixed(1)} s${QUICK_SLOW[f] ? ` (ceiling ${QUICK_SLOW[f]})` : ''}`).join(', ')}; the budget ${QUICK_FILE_CPU_S} s × ${k.toFixed(2)} a file, QUICK_SLOW's own ceilings × k)`);
    const slow = quickRan.filter(f => cpu[f] / 1000 > QUICK_FILE_CPU_S * k);
    if (slow.length) console.log(`(the quick files over ${QUICK_FILE_CPU_S} s × k: ${slow.map(f => `${f.replace('.test.mjs', '')} ${(cpu[f] / 1000).toFixed(1)}${QUICK_SLOW[f] ? `/${QUICK_SLOW[f]}` : ''}`).join(', ')})`);
    for (const f of over) console.log(`  ${busy ? '·' : '✗'} ${f.replace('.test.mjs', '')} (quick): ${(cpu[f] / 1000).toFixed(1)} s of CPU over its budget ${((QUICK_SLOW[f] ?? QUICK_FILE_CPU_S) * kOf(f)).toFixed(1)} s (${QUICK_SLOW[f] ? `QUICK_SLOW's ${QUICK_SLOW[f]} s` : `QUICK_FILE_CPU_S ${QUICK_FILE_CPU_S} s`} × ${kOf(f).toFixed(2)}): make it lighter, or move its whole lanes to a heavy case (TECH §13.7)`);
    if (busy && over.length) console.log(`(the CPU budgets not judged: the machine busy, load ${loadNow.toFixed(1)} on ${cores} cores, more than half; run again on a quiet machine)`);
    if (!busy) overCpu += over.length;
    if (!filter && !skip.length) {
      // (the sum by the slower of the factor at the run's start and at its end: helpers.mjs machineNow)
      const kEnd = (await import('./helpers.mjs')).machineNow().k, kSum = Math.max(k, kEnd);
      const sumS = quickRan.reduce((a, f) => a + cpu[f], 0) / 1000, capS = QUICK_CPU_S * kSum;
      const overSum = sumS > capS;
      if (overSum && !busy) overCpu++;
      console.log(`(the quick suite's CPU: ${sumS.toFixed(1)} s over ${quickRan.length} files, the budget ${capS.toFixed(0)} s: QUICK_CPU_S ${QUICK_CPU_S} × ${kSum.toFixed(2)}, the factor at the start ${k.toFixed(2)} and at the end ${kEnd.toFixed(2)})${overSum ? (busy ? ': over the budget, not judged (the machine busy)' : ': over the budget, a failure (TECH §13.7)') : ''}`);
    }
  }
  if (quick && !filter) {
    // (in the background band the limit is scaled by the machine's slowness, measured before the pool: see the header;
    // v0.0.21: and by the pool against the full one, QUICK_JOBS_REF / JOBS)
    const poolK = Math.max(1, QUICK_JOBS_REF / Math.max(1, JOBS)), bandK = inBand ? Math.max(1, M.k) : 1;
    const limitS = Math.round(QUICK_LIMIT_S * poolK * bandK);
    overTime = totalS > limitS;
    const parts = [poolK > 1 ? `× ${QUICK_JOBS_REF}/${JOBS}, a pool of ${JOBS}` : '', bandK > 1 ? `× ${bandK.toFixed(2)}, the background band` : ''].filter(Boolean).join(' ');
    console.log(`\nquick suite: ${totalS.toFixed(1)} s (limit ${limitS} s${parts ? `: ${QUICK_LIMIT_S} s ${parts}` : ''})${overTime ? ': over the limit, a failure (TECH §13.7; run it again on a quiet machine before changing anything)' : ''}`);
  }
  const { pass, fail, left, timedOut } = total;
  const summary = `\n${pass} passed, ${fail + (overTime ? 1 : 0) + overCpu} failed${left ? `, ${left} left out` : ''}${timedOut ? `, ${timedOut} timed out` : ''} (${totalS.toFixed(1)} s)\n`;
  // (after a time-out, exit once the summary is written: stdout to a pipe is asynchronous here, and
  // an exit straight after the write would lose it; a test timed out in this process may still hold
  // a browser or a server open)
  if (timedOut) process.stdout.write(summary, () => process.exit(1));
  else { process.stdout.write(summary); process.exitCode = fail || overTime || overCpu ? 1 : 0; }
}
