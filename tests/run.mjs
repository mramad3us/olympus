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
/** The pool's ceiling while the play copy answers on :8200 (the user likely playing). */
const PLAYING_JOBS = 3;
const QUICK_LIMIT_S = Number(process.env.QUICK_LIMIT_S) || 60;   // (60 again from v0.0.11, in parallel; 90 in v0.0.10, one file at a time: 875 quick tests in 73 s)
const first = (e, n = 4) => String(e?.stack || e?.message || e).split('\n').slice(0, n).join('\n      ');

/** Marks a worker's report in its output: what comes before it is the file's. */
const MARK = '\x1e';
const REPORT = new RegExp(`${MARK}END (.*?)${MARK}\n?`);

/** One file's tests, in order: { pass, fail, left, timedOut, ms }. log(text) prints a line. */
async function runFile(file, log) {
  const base = file.replace('.test.mjs', '');
  const r = { pass: 0, fail: 0, left: 0, timedOut: 0, ms: 0 };
  const f0 = performance.now();
  let tests;
  try {
    tests = (await import(pathToFileURL(path.join(dir, file)).href)).default;
    if (!Array.isArray(tests)) throw new Error(`${file} must default-export an array of { name, fn }`);
  } catch (e) {
    // (a file that does not load is a failure whatever the filter: its tests can't be told apart from the filter's
    // without it, and a pin that cannot load passed silently with a filter on its tests' names, "0 passed, 0 failed",
    // the sleeve fix's verifier's of v0.0.7)
    r.fail++; log(`  ✗ ${base} (did not load)\n      ${first(e)}`);
    r.ms = Math.round(performance.now() - f0);
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
  r.ms = Math.round(performance.now() - f0);
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
  // The factor the CPU-time ceilings use, measured now, before any work shares the machine.
  const { machine, REF_LOOP_MS } = await import('./helpers.mjs');
  const M = machine();
  console.log(`(the machine: the reference loop in ${M.ms.toFixed(1)} ms against ${REF_LOOP_MS} ms in the foreground, so the CPU-time ceilings × ${M.k.toFixed(2)}; measured before the pool)`);

  // What each file is, from its text: a browser file, one with a CPU-time ceiling, one with a frame-time ceiling.
  const CEILING = /\bmachine(?:K)?\(\)/, FRAMES = /\b(?:medianMs|p95Ms)\s*<=|\bpct\(dts[^)]*\)\s*<=/, BROWSER = /from\s+['"]\.\/browser\.mjs['"]/;
  const kind = Object.fromEntries(files.map(f => {
    const src = readFileSync(path.join(dir, f), 'utf8');
    return [f, { browser: BROWSER.test(src), quiet: CEILING.test(src) || FRAMES.test(src), may: mayMatch(f, src) }];
  }));
  const num = (v, d) => (v === undefined || v === '' ? d : Math.max(0, Number(v) | 0));
  const cores = os.availableParallelism?.() ?? os.cpus().length;
  // (the pool is a guest on the user's Mac (their words of 2026-11-08 on the dozen node processes in Activity
  // Monitor): half the cores by default, and at most PLAYING_JOBS while the play copy answers on :8200, the user
  // likely playing; JOBS sets it outright)
  const playing = await new Promise(done => { const c = connect({ host: '127.0.0.1', port: 8200 }); const end = (v) => { c.destroy(); done(v); }; c.once('connect', () => end(true)); c.once('error', () => end(false)); c.setTimeout(300, () => end(false)); });
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
  const took = {};
  const names = list => list.map(f => f.replace('.test.mjs', '')).join(', ') || 'none';
  const here = async list => { for (const file of list) { const r = await runFile(file, s => console.log(s)); add(r); took[file] = r.ms; } };

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
      add(r); took[w.file] = r.ms || past[w.file] || 0; done.set(w.file, out);
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
      writeFileSync(`${timesFile}.${process.pid}`, JSON.stringify(times, null, 1));
      renameSync(`${timesFile}.${process.pid}`, timesFile);
    } catch { /* (no .run: the order is only by name next time) */ }
  }
  if (!serial) console.log(`\n(first ${firstS.toFixed(1)} s; the pool and the lanes ${poolS.toFixed(1)} s${quietAt !== null && lanes.length ? `, the lanes from +${quietAt.toFixed(1)} s` : ''}; last ${lastS.toFixed(1)} s)`);
  // (the quick suite's minute: only a whole quick run is timed, a filtered one isn't the suite)
  let overTime = false;
  if (quick && !filter) {
    // (in the background band the limit is scaled by the machine's slowness, measured before the pool: see the header)
    const limitS = inBand ? Math.round(QUICK_LIMIT_S * Math.max(1, M.k)) : QUICK_LIMIT_S;
    overTime = totalS > limitS;
    console.log(`\nquick suite: ${totalS.toFixed(1)} s (limit ${limitS} s${limitS !== QUICK_LIMIT_S ? `: ${QUICK_LIMIT_S} s × ${M.k.toFixed(2)}, the background band` : ''})${overTime ? ': over the limit, a failure (TECH §13.7; run it again on a quiet machine before changing anything)' : ''}`);
  }
  const { pass, fail, left, timedOut } = total;
  const summary = `\n${pass} passed, ${fail + (overTime ? 1 : 0)} failed${left ? `, ${left} left out` : ''}${timedOut ? `, ${timedOut} timed out` : ''} (${totalS.toFixed(1)} s)\n`;
  // (after a time-out, exit once the summary is written: stdout to a pipe is asynchronous here, and
  // an exit straight after the write would lose it; a test timed out in this process may still hold
  // a browser or a server open)
  if (timedOut) process.stdout.write(summary, () => process.exit(1));
  else { process.stdout.write(summary); process.exitCode = fail || overTime ? 1 : 0; }
}
