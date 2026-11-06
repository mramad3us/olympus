// The user's walk of v0.0.3 in node (ROADMAP §4.4's moment 2; the build sheet 0.0.3 §6 items 5 to 9):
// tests/walk-moment2.mjs's bot from the bay at 23:00 to the north fence and back, on the headless
// game (tests/game.mjs). A save made anywhere on that walk loads and carries on byte for byte: the walk
// is run once straight through, saving at SAVE_AT's ticks; then each save is loaded into a fresh game
// (its own loop and sim, the save through fromJSON as a page's load) and the same bot carries the
// walk on from it, its memory being plain data on the player's actor. Every one must end on the same
// tick with the straight run's digest. Each save is also checked by ids-check (TECH §2.3.1) and saved
// again after a load, byte for byte. The quick variant saves at 16 ticks chosen to fall in each part
// of the walk (mid-aisle at 23:00, between the debug skips, at the bay door, a tick either side of
// the stair's and the front door's portals, in the vestibule, waiting for the sun, at the fence, on
// the way back, a tick before the end); the heavy one every 499 ticks (40 saves), a number that falls
// on no moment in particular, so the saves land mid-stride, mid-door and mid-stair alike.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { checkIds } from './ids-check.mjs';
import { runBot } from './bots/lib.mjs';
import { WALK_START, walkSteps, walkBot } from './walk-moment2.mjs';
import { toJSON, fromJSON } from '../src/core/state.js';
import { marsClock } from '../src/sim/time/dates.js';
import { lonOf } from '../src/sim/places/model.js';
import { sunAt } from '../src/sim/places/sun.js';

/** The straight run's saves: the quick variant's ticks, and the heavy one's every so many. */
export const SAVE_AT = Object.freeze({
  quick: Object.freeze([57, 284, 290, 640, 1007, 1009, 1700, 2127, 2129, 2300, 2377, 2379, 9000, 14916, 17521, 20140]),
  heavy: 499,
});
const MAX_TICKS = 60_000;
const hhmm = (s) => { const c = marsClock(s.clock.ms, lonOf(s)); return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`; };

// (the walk straight through, saving at `at` (ticks, or every so many): { saves: [{ tick, json, area, x, z, at }], digest, tick, log, ms })
function straight(at) {
  const due = (n) => (Array.isArray(at) ? at.includes(n) : n % at === 0);
  const g = createGame(WALK_START), bot = walkBot(), saves = [];
  const t0 = performance.now();
  let n = 0;
  const status = () => g.me()?.bot?.plan?.status ?? 'running';
  while (status() === 'running' && n < MAX_TICKS) {
    g.step(1, bot); n++;
    if (due(n) && status() === 'running') { const me = g.me(); saves.push({ tick: g.state.clock.tick, json: g.save(), area: g.state.places.live.area, x: me.x, z: me.z, at: hhmm(g.state) }); }
  }
  const P = g.me().bot.plan;
  return { g, saves, digest: g.digest(), tick: g.state.clock.tick, ms: g.state.clock.ms, status: P.status, why: P.why, log: P.log, wallMs: performance.now() - t0 };
}

// (a save loaded into a fresh game and the walk carried on to its end)
function carryOn(json) {
  const g = createGame(WALK_START);
  g.load(json);
  const r = runBot(g, walkBot(), { maxTicks: MAX_TICKS });
  return { digest: g.digest(), tick: g.state.clock.tick, done: r.done, reason: r.reason };
}

function walkTest(variant) {
  const at = SAVE_AT[variant];
  return {
    name: `the user's walk (${variant}): the bay at 23:00, the morning, the stairs, the street at sunrise, the north fence and back; a save made ${Array.isArray(at) ? `at ${at.length} ticks along it` : `every ${at} ticks of it`} loads in a fresh game and carries on byte for byte to the same end`,
    heavy: variant === 'heavy',
    fn() {
      const A = straight(at), names = walkSteps().map(([n]) => n);
      assert(A.status === 'done', `the walk did not end: ${A.why}`);
      if (variant === 'quick') {
        // (the walk's moments, as the bot met them)
        const moments = new Map(A.log.map(e => [e.k, e]));
        console.log(`      ${A.log.length} primitives, ${A.tick} ticks lived (${fmt(A.tick / 1200, 1)} game minutes) in ${fmt(A.wallMs, 0)} ms (${fmt(A.wallMs * 1000 / A.tick, 1)} µs a tick, the bot's planning included); debug used: ${A.g.state.meta.debugUsed === true}`);
        for (const [k, e] of moments) {
          const name = names[k];
          if (/leg \d+$/.test(name) && !/leg 1$/.test(name) && !moments.get(k + 1)?.name?.startsWith?.('crossTo') && names[k + 1]?.replace(/\d+$/, '') === name.replace(/\d+$/, '')) continue;
          console.log(`        tick ${String(e.at).padStart(5)}: ${name}${e.done ? '' : ` FAILED ${e.fail}`} → ${e.area} (${fmt(e.x, 2)}, ${fmt(e.z, 2)})${e.lengthM ? `, ${fmt(e.lengthM, 1)} m` : ''}`);
        }
      }
      const sun = sunAt('melas', A.ms);
      console.log(`      straight through: tick ${A.tick}, ${hhmm(A.g.state)} Melas time, the sun ${fmt(sun.elevDeg, 1)}° up; digest ${A.digest}`);
      let ok = 0;
      const bad = [], bytes = [];
      for (const sv of A.saves) {
        const back = toJSON(fromJSON(sv.json));
        assert(back === sv.json, `save, load and save again changed the bytes (tick ${sv.tick})`);
        const ids = checkIds(fromJSON(sv.json), A.g.sim.domains), wrong = [...ids.invalid, ...ids.dangling];
        assert(!wrong.length, `ids at tick ${sv.tick}: ${wrong.slice(0, 5).join('; ')}`);
        const B = carryOn(sv.json);
        bytes.push(sv.json.length);
        if (B.done && B.tick === A.tick && B.digest === A.digest) ok++;
        else bad.push({ tick: sv.tick, area: sv.area, at: sv.at, x: sv.x, z: sv.z, end: B.tick, digest: B.digest, done: B.done, reason: B.reason });
      }
      const where = {};
      for (const sv of A.saves) where[sv.area] = (where[sv.area] ?? 0) + 1;
      console.log(`      ${A.saves.length} saves (${Object.entries(where).map(([a, n]) => `${n} in ${a}`).join(', ')}; ${fmt(Math.min(...bytes) / 1024, 0)} to ${fmt(Math.max(...bytes) / 1024, 0)} KB): ${ok} carried on to tick ${A.tick} with the same digest, ${bad.length} parted`);
      for (const sv of A.saves.slice(0, variant === 'quick' ? 16 : 0)) console.log(`        saved at tick ${sv.tick}, ${sv.at}, ${sv.area} (${fmt(sv.x, 2)}, ${fmt(sv.z, 2)})`);
      assert(!bad.length, JSON.stringify(bad.slice(0, 3)));
      assert(A.saves.length >= (Array.isArray(at) ? at.length : 8), `${A.saves.length} saves`);
    },
  };
}

export default [walkTest('quick'), walkTest('heavy')];
