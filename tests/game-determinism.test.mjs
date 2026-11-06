// The determinism suite (TECH §8.2), on the headless game (tests/game.mjs): the sandbox scenario,
// the dummy world in place of the world stub and scriptInput's walking, holds and waits
// (tests/game-dummy.mjs), until mess-noon's people exist (0.0.9; the build sheet, §8 item 11).
// Each test prints its digests and holds them identical:
//   game-determinism   600 lived ticks, a 30-minute outcome skip sliced five grid steps a slice,
//                      600 more (heavy: 3,000, 2 hours, 3,000), run plain, with a save and a load
//                      mid-run, and with a save inside the skip after its third slice loaded into a
//                      fresh game; every save checked by ids-check (TECH §2.3.1: ids well formed,
//                      none dangling) and save, load, save again byte-identical every 250th tick
//   game-keyorder      the mid-run save played on with every object's keys reversed, deep: a
//                      decision that read a JS object's own key order would show (rule 9)
//   game-slices        an 8-hour sleep advanced one grid step a slice, seven, and all at once
//   game-ff            a 30-second fast-forward against 600 ticks lived on the same input (heavy:
//                      90 s against 1,800): the same world, the skip's own bookkeeping aside
//   game-twogames      game A then game B in one process (a child), against B alone (another):
//                      nothing a game leaves in a module reaches the next (TECH §2.3)
//   game-cosmetics     B in child processes at OLYMPUS_PPM 16 and 24 (src/render/scale.js reads
//                      it): a cosmetic setting moves no dice (rule 3)
// and a golden of the sandbox's new game, seed 48213 (PRINT_HASH=1 reprints it).
// The quick variants run in the quick suite; each is well under a second here (my measure).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { assert, fmt } from './helpers.mjs';
import { createGame, NO_INPUT, NO_BUDGET, stepBudget } from './game.mjs';
import { dummyWorld, scriptInput, dummyStats } from './game-dummy.mjs';
import { golden, goldenDigest, PRINT_HASH } from './golden.mjs';
import { checkIds } from './ids-check.mjs';
import { toJSON, fromJSON } from '../src/core/state.js';
import { digest } from '../src/core/hash.js';
import { setIdsCheck } from '../src/core/ids.js';
import { MIN_MS, HOUR_MS } from '../src/core/clock.js';

const execFileP = promisify(execFile);
export const VARIANTS = Object.freeze({
  quick: Object.freeze({ name: 'quick', ticks: 600, skipMs: 30 * MIN_MS, ffMs: 30_000 }),
  heavy: Object.freeze({ name: 'heavy', ticks: 3000, skipMs: 2 * HOUR_MS, ffMs: 90_000 }),
});
export const SEED = 2351;
const SLICE_STEPS = 5;                                             // (a slice of the skip: five grid steps, about a page frame's)
const CHECK_EVERY_TICKS = 250;                                     // (save, load, save again; ids: TECH §6.3)
const GOLDEN_SEED = 48213;
// (the sandbox's new game: set with PRINT_HASH=1 when it changes on purpose, and said in CHANGELOG.md)
const GOLDEN_SANDBOX = '06e4132f321ebc';                          // (pinned 2026-11-05, v0.0.2's sandbox: p1 and a1 at the spawn, one job; re-set for TIME §2.4's calendar and the slow mark; 0.0.3 re-set for the site seed's removal alone: putting places.sites.test.seed back gives 05fa96c32a3dbf)

export const newRun = (opts = {}) => createGame({ seed: SEED, domains: { world: dummyWorld }, ...opts });

// (a save's ids, by core's walk (tests/ids-check.mjs): { checked, byKind, bad }, bad its invalid and dangling ids)
function idsOf(json, g) {
  const r = checkIds(fromJSON(json), g.sim.domains);
  const bad = [...r.invalid, ...r.dangling];
  return { checked: r.checked, byKind: r.byKind, bad, ok: !bad.length };
}

const p99 = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * 0.99))]; };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

/**
 * One determinism run: v.ticks lived on scriptInput, a v.skipMs outcome skip sliced SLICE_STEPS
 * grid steps a slice, v.ticks more. how: 'plain', 'midrun' (save and load at v.ticks / 2, the same
 * game carrying on), 'inskip' (a save after the skip's third slice, loaded into a fresh game), or
 * 'keyorder' (the mid-run save played on with every object's keys reversed). Every save is checked.
 */
export function determinismRun(v, how = 'plain', { checks = true } = {}) {
  let g = newRun();
  const t = { tickUs: [], skipUs: 0, skipMin: 0, slices: 0, steps: 0 }, saves = [];
  const keep = (json, at) => {
    assert(toJSON(fromJSON(json)) === json, `save, load and save again changed the bytes (${how}, ${at})`);
    const ids = checks ? idsOf(json, g) : null;
    if (ids) assert(ids.ok, `ids (${how}, ${at}): ${ids.bad.slice(0, 5).join('; ')}`);
    saves.push({ at, bytes: json.length, ids });
  };
  const live = (from, to) => {
    for (let i = from; i < to; i++) {
      const t0 = performance.now();
      g.step(1, scriptInput(i));
      t.tickUs.push((performance.now() - t0) * 1000);
      if (checks && i % CHECK_EVERY_TICKS === 0) keep(g.save(), `tick ${i}`);
    }
  };
  const half = v.ticks / 2;
  live(0, half);
  if (how === 'midrun' || how === 'keyorder') {
    const json = g.save();
    keep(json, 'mid-run');
    g.load(how === 'keyorder' ? reverseKeys(fromJSON(json)) : json);
  }
  live(half, v.ticks);
  const m0 = g.state.clock.ms;
  g.beginSkip({ activity: 'wait', planMs: v.skipMs, kind: 'outcome', mask: 'D' });
  while (g.state.skip) {
    const t0 = performance.now(), r = g.advance(Infinity, stepBudget(SLICE_STEPS));
    t.skipUs += (performance.now() - t0) * 1000;
    t.slices++; t.steps += r?.steps ?? 0;
    if (how === 'inskip' && t.slices === 3 && g.state.skip) {
      const json = g.save();
      keep(json, 'in the skip, after its third slice');
      const fresh = newRun();
      fresh.load(json);
      g = fresh;
    }
    if (r?.done) break;
  }
  t.skipMin = (g.state.clock.ms - m0) / MIN_MS;
  live(v.ticks, 2 * v.ticks);
  const json = g.save();
  keep(json, 'the end');
  return { g, json, digest: digest(json), t, saves, kb: json.length / 1024 };
}

/** A deep copy with every object's keys in reversed order (arrays keep theirs: their order is data). */
export function reverseKeys(v) {
  if (Array.isArray(v)) return v.map(reverseKeys);
  if (v === null || typeof v !== 'object') return v;
  const out = {};
  for (const k of Object.keys(v).reverse()) out[k] = reverseKeys(v[k]);
  return out;
}

// (the run game B is in the two-games and cosmetics tests: the quick determinism run, plain)
export const runB = () => determinismRun(VARIANTS.quick, 'plain', { checks: false }).digest;
// (game A: another seed, an Ironman career, the built-in world, a skip of an hour and a walk)
export function runA() {
  const g = createGame({ seed: 7, mode: 'ironman' });
  g.step(300, (s, me, mem) => { mem.n = (mem.n ?? 0) + 1; return { mx: mem.n % 80 < 40 ? 1 : -1, mz: mem.n % 120 < 60 ? -1 : 1, run: mem.n % 50 < 10 }; });
  g.skipNow({ activity: 'wait', planMs: HOUR_MS, mask: 'D' });
  g.step(300, { mz: 1 });
  return g.digest();
}

// (a child process of node that imports this file and prints what it ran, as JSON)
async function child(code, env = {}) {
  const src = `const m = await import(${JSON.stringify(import.meta.url)}); ${code}`;
  const { stdout } = await execFileP(process.execPath, ['--input-type=module', '-e', src], { env: { ...process.env, ...env }, maxBuffer: 1 << 20 });
  return JSON.parse(stdout.trim().split('\n').pop());
}

function slicedSleep(budget) {
  const g = newRun();
  for (let i = 0; i < 200; i++) g.step(1, scriptInput(i, { hands: false }));
  g.beginSkip({ activity: 'sleep', planMs: 8 * HOUR_MS, kind: 'outcome', mask: 'D' });
  let slices = 0, steps = 0;
  for (;;) {
    const r = g.advance(Infinity, budget);
    slices++; steps += r?.steps ?? 0;
    if (r?.done || !g.state.skip) break;
  }
  return { digest: g.digest(), slices, steps, stats: dummyStats(g.state), ms: g.state.clock.ms };
}

// (the state less the bookkeeping a skip leaves of itself: its record, its id counter, and the
// live-play count its end resets when it asks for the autosave, src/sim/time/skip.js finishSkip)
function lessSkip(json) {
  const s = JSON.parse(json);
  s.skip = null;
  if (s.meta?.next) delete s.meta.next.k;
  if (s.time) delete s.time.liveSinceSaveMs;
  return s;
}
const differingKeys = (a, b) => Object.keys({ ...a, ...b }).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).sort();

function ffAgainstLived(v) {
  const lead = 100;
  const A = newRun();
  for (let i = 0; i < lead; i++) A.step(1, scriptInput(i, { hands: false }));
  const tick0 = A.state.clock.tick;
  A.beginSkip({ activity: 'wait', planMs: v.ffMs, kind: 'ff', mask: 'D' });
  assert(A.state.skip?.kind === 'ff', `a ${v.ffMs} ms wait is not a fast-forward: ${A.state.skip?.kind}`);
  let ticks = 0;
  while (A.state.skip && ticks < 10 * v.ffMs) { A.step(1, { mx: 1, run: true }); ticks++; }   // (the caller's input is ignored while ff runs)
  const B = newRun();
  for (let i = 0; i < lead; i++) B.step(1, scriptInput(i, { hands: false }));
  B.step(ticks, NO_INPUT);
  const a = lessSkip(A.save()), b = lessSkip(B.save());
  return { ticks, lived: A.state.clock.tick - tick0, raw: [A.digest(), B.digest()], norm: [digest(toJSON(a)), digest(toJSON(b))], differ: differingKeys(a, b), rawDiffer: differingKeys(JSON.parse(A.save()), JSON.parse(B.save())) };
}

function determinismTest(v) {
  return {
    name: `game-determinism (${v.name}): ${v.ticks} lived ticks, a ${v.skipMs / MIN_MS}-minute outcome skip, ${v.ticks} more, run plain, with a save and load mid-run and inside the skip after its third slice: identical digests, every save's ids clean`,
    heavy: v.name === 'heavy',
    fn() {
      setIdsCheck(1);
      try {
        const plain = determinismRun(v, 'plain'), mid = determinismRun(v, 'midrun'), inSkip = determinismRun(v, 'inskip');
        const s = dummyStats(plain.g.state), t = plain.t;
        console.log(`      digests: plain ${plain.digest}, mid-run load ${mid.digest}, in-skip load ${inSkip.digest}`);
        console.log(`      lived ticks: ${fmt(mean(t.tickUs), 1)} µs mean, ${fmt(p99(t.tickUs), 1)} µs p99 (${t.tickUs.length}); the skip: ${fmt(t.skipMin, 0)} game min in ${t.slices} slices of ${SLICE_STEPS} steps (${t.steps} steps), ${fmt(t.skipUs / Math.max(1, t.skipMin), 1)} µs a simulated minute`);
        const me = plain.g.me(), facts = plain.g.facts().length;
        console.log(`      save ${fmt(plain.kb, 1)} KB; ${plain.saves.length + mid.saves.length + inSkip.saves.length} saves checked; the player at (${fmt(me?.x ?? NaN, 2)}, ${fmt(me?.z ?? NaN, 2)}), ${fmt(me?.strideM ?? NaN, 1)} m of stride; ${facts} facts carried`);
        console.log(`      the world: ${JSON.stringify(s)}`);
        const ids = plain.saves.at(-1).ids;
        const idsChecked = [...plain.saves, ...mid.saves, ...inSkip.saves].reduce((n, x) => n + (x.ids?.checked ?? 0), 0);
        console.log(`      ids: ${idsChecked} checked over the saves, none invalid or dangling; at the end, by kind ${JSON.stringify(ids.byKind)}`);
        assert(plain.digest === mid.digest, `a save and load mid-run changed the run: ${plain.digest} against ${mid.digest}`);
        assert(plain.digest === inSkip.digest, `a save inside the skip changed the run: ${plain.digest} against ${inSkip.digest}`);
        assert(s && s.incidents > 0 && s.hours > 0 && s.seconds > 0, `the dummy world did too little: ${JSON.stringify(s)}`);
        assert(Math.round(t.skipMin) === v.skipMs / MIN_MS, `the skip ran ${t.skipMin} game minutes, not ${v.skipMs / MIN_MS}`);
        const other = newRun({ seed: SEED + 1 });
        other.step(50, scriptInput(0));
        const same = newRun(); same.step(50, scriptInput(0));
        assert(other.digest() !== same.digest(), 'another seed gave the same game');
      } finally { setIdsCheck(0); }
    },
  };
}

export default [
  determinismTest(VARIANTS.quick),
  {
    name: 'game-keyorder: the mid-run save played on with every object\'s keys reversed gives the same digest',
    fn() {
      const plain = determinismRun(VARIANTS.quick, 'plain', { checks: false }), rev = determinismRun(VARIANTS.quick, 'keyorder', { checks: false });
      console.log(`      digests: as saved ${plain.digest}, keys reversed ${rev.digest}`);
      assert(plain.digest === rev.digest, `a decision read a JS object's own key order: ${plain.digest} against ${rev.digest}`);
    },
  },
  {
    name: 'game-slices: an 8-hour sleep advanced one grid step a slice, seven, and all at once gives one digest',
    fn() {
      const one = slicedSleep(stepBudget(1)), seven = slicedSleep(stepBudget(7)), all = slicedSleep(NO_BUDGET);
      console.log(`      digests: one a slice ${one.digest} (${one.slices} slices), seven ${seven.digest} (${seven.slices}), all at once ${all.digest} (${all.slices})`);
      console.log(`      ${one.steps} grid steps each way (${seven.steps}, ${all.steps}); the world after: ${JSON.stringify(all.stats)}`);
      assert(one.digest === seven.digest && seven.digest === all.digest, 'the slicing moved the result');
      assert(one.steps === seven.steps && seven.steps === all.steps && one.steps >= 480, `steps ${one.steps}, ${seven.steps}, ${all.steps}: an 8-hour sleep on the minute grid is 480 or more`);
      assert(one.slices >= one.steps && all.slices === 1, `slices ${one.slices}, ${all.slices}`);
    },
  },
  {
    name: `game-ff (quick): a ${VARIANTS.quick.ffMs / 1000}-second fast-forward against ${VARIANTS.quick.ffMs / 50} ticks lived on the same input gives the same world`,
    fn() { ffTest(VARIANTS.quick); },
  },
  {
    name: 'game-twogames: game A then game B in one process gives B the digest it has alone',
    async fn() {
      const [ab, b] = await Promise.all([child('const a = m.runA(); console.log(JSON.stringify({ a, b: m.runB() }));'), child('console.log(JSON.stringify({ b: m.runB() }));')]);
      const here = runB();
      console.log(`      B after A (A ${ab.a}): ${ab.b}; B alone: ${b.b}; B here, after the other tests: ${here}`);
      assert(ab.b === b.b && b.b === here, 'a game left something in a module that moved the next');
    },
  },
  {
    name: 'game-cosmetics: the run at OLYMPUS_PPM 16 and 24 gives one digest (a cosmetic setting moves no dice)',
    async fn() {
      const scaleUrl = JSON.stringify(new URL('../src/render/scale.js', import.meta.url).href);
      const run = (ppm) => child(`const scale = await import(${scaleUrl}); console.log(JSON.stringify({ ppm: scale.PX_PER_M, b: m.runB() }));`, { OLYMPUS_PPM: String(ppm) });
      const [p16, p24] = await Promise.all([run(16), run(24)]);
      console.log(`      ${p16.ppm} px/m: ${p16.b}; ${p24.ppm} px/m: ${p24.b}`);
      assert(p16.ppm === 16 && p24.ppm === 24, `the children's density: ${p16.ppm}, ${p24.ppm}`);
      assert(p16.b === p24.b, 'the density moved the game');
    },
  },
  {
    name: `the sandbox's new game, seed ${GOLDEN_SEED}, is pinned by a golden (PRINT_HASH=1 reprints it)`,
    fn() {
      const g = createGame({ seed: GOLDEN_SEED });
      const s = g.state, d = golden(`the sandbox, a new game, seed ${GOLDEN_SEED}`, s, GOLDEN_SANDBOX);
      console.log(`      ${d}: ${Object.keys(s).length} keys, ${s.events.length} events, ${Object.keys(s.people ?? {}).length} people, ${s.actors?.list?.length ?? 0} actors, ${fmt(g.save().length / 1024, 1)} KB`);
    },
  },
  {
    name: 'golden(): canonical JSON whatever the key order, a typed array by its bytes; a moved digest throws with both, a missing one asks for PRINT_HASH',
    fn() {
      const a = goldenDigest({ x: 1, y: [1, 2], $z: 'runtime' }), b = goldenDigest({ y: [1, 2], x: 1 });
      const bytes = new Uint8Array([1, 2, 3, 250]), sameBytes = new Uint8Array([9, 1, 2, 3, 250]).subarray(1);
      assert(a === b && goldenDigest(bytes) === goldenDigest(sameBytes) && goldenDigest(bytes) !== goldenDigest(new Uint8Array([1, 2, 3, 251])), 'digests');
      if (PRINT_HASH) { console.log('      (PRINT_HASH is set: golden() prints and passes, so the throws are not checked)'); return; }
      let moved = '', missing = '';
      try { golden('a sample', { x: 2 }, a); } catch (e) { moved = e.message; }
      try { golden('a sample', { x: 2 }, null); } catch (e) { missing = e.message; }
      assert(moved.includes(a) && moved.includes(goldenDigest({ x: 2 })) && /PRINT_HASH=1/.test(missing), `${moved} | ${missing}`);
      assert(golden('a sample', { y: [1, 2], x: 1 }, a) === a, 'a match returns its digest');
      console.log(`      { x, y } either way ${a}; the moved one: "${moved}"`);
    },
  },
  determinismTest(VARIANTS.heavy),
  {
    name: `game-ff (heavy): a ${VARIANTS.heavy.ffMs / 1000}-second fast-forward against ${VARIANTS.heavy.ffMs / 50} ticks lived on the same input gives the same world`,
    heavy: true,
    fn() { ffTest(VARIANTS.heavy); },
  },
];

function ffTest(v) {
  const r = ffAgainstLived(v);
  console.log(`      ${r.ticks} ticks fast-forwarded (${r.lived} lived); digests, skip bookkeeping aside: ff ${r.norm[0]}, lived ${r.norm[1]}; whole saves ${r.raw[0]} and ${r.raw[1]} (differing in ${r.rawDiffer.join(', ') || 'nothing'})`);
  assert(r.ticks === v.ffMs / 50 && r.lived === r.ticks, `the fast-forward ran ${r.ticks} ticks (${r.lived} lived), not ${v.ffMs / 50}`);
  assert(r.norm[0] === r.norm[1], `fast-forward and lived time differ in ${r.differ.join(', ')}`);
}
