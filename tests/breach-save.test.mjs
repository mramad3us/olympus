// OLYMPUS tests: a save anywhere in "Bang, then go" loads and carries on byte for byte (TECH §13.1; v0.0.26, its build sheet §6 B, §8 F138's saves; §11 risk 7).
//
// The scene's record is plain data on the house's (R.house.bangGo: its draw, the window, the track, the search's offer and wait) and the
// role-players' on their turner records (T.live), none of it runtime. Nine points of the lane, each the first tick a lane meets it (a list
// of lanes tried in turn): at GO, mid-throw (the bang's row between its door and its burst), the bang's tick, a man dazed, a man's dash, a
// man cowering, mid-challenge, mid-search, the hot wash. At each the save is checked by the id walk (tests/ids-check.mjs) and loaded into a
// second game (each point on a lane of its own where the lockstep of an earlier one would run past it); both step AFTER ticks on by the same bot in lockstep and must end on the same digest, and the save made again from the loaded
// game is the save it was loaded from, byte for byte (no key gained).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { checkIds } from './ids-check.mjs';
import { breachBot } from './breach-lanes.mjs';
import { rpShocked } from '../src/sim/scenarios/opfor.js';

const AFTER = 120, MAX_TICKS = 6000;
const men = (s) => (s.armoury?.range?.turners ?? []).filter(T => T.live);
const H = (s) => s.armoury?.range?.house;
const lane = (s) => H(s)?.goAtMs !== null && H(s)?.goAtMs !== undefined && !H(s).end;
const doing = (s, re) => { const d = s.stop?.doing; return !!d && re.test(String(d.step ?? '')) ; };
// (the bang's tick: the first tick a burst is on the record, the points read every tick)
// (1b frozen at GO, as opfor.js choiceTick leaves a man the table froze: kneeling, the rifle low, his choice the freeze at a band of 2)
function freezeBuilt(g) {
  const s = g.state, T = men(s).find(x => x.stand === '1b'), a = s.actors.list.find(x => x.who === T.live.who), k = s.people[T.live.who].kit;
  Object.assign(T.live, { st: 'freeze', fromMs: s.clock.ms, choice: { what: 'freeze', band: 2, atMs: s.clock.ms, grade: 'bad', dc: 10 }, eng: null, eyes: null, aiming: null });
  a.stance = 'kneel'; k.carry.posture = 'lowReady'; k.carry.finger = 'off';
}
/** The nine points: a predicate on the state, and the lanes tried for it in turn ({ tier, code, seed, bot }). */
export const POINTS = Object.freeze({
  'at GO': { at: (s) => lane(s) && s.clock.ms === H(s).goAtMs, lanes: [{ tier: 'sgt', code: 'bang,held', seed: 48213, bot: 'auto' }] },
  'mid-throw': { at: (s) => lane(s) && doing(s, /flash/) && !(H(s).bursts ?? []).length && s.stop.doing.beats?.some(b => b.k === 'throw' && b.st === 'run'), lanes: [{ tier: 'private', code: 'bang,held', seed: 48213, bot: 'auto' }, { tier: 'sgt', code: 'bang,held', seed: 48213, bot: 'auto' }] },
  'the bang\'s tick': { at: (s) => lane(s) && (H(s).bursts ?? []).length > 0, lanes: [{ tier: 'tierone', code: 'bang,held', seed: 48213, bot: 'auto' }] },
  'a man dazed': { at: (s) => lane(s) && men(s).some(T => T.live.st !== 'down' && rpShocked(s, T.live.who, s.clock.ms)), lanes: [{ tier: 'sgt', code: 'bang,loose', seed: 48213, bot: 'auto' }] },
  'a man\'s dash': { at: (s) => lane(s) && men(s).some(T => T.live.st === 'move'), lanes: [{ tier: 'recruit', code: 'bang,held', seed: 2082, bot: 'auto' }] },
  // (no lane of 240 (ten seeds × six sheets × four draws by the honest player) met a freeze: the men are down before the table rolls one;
  // built by hand on the lane's state at GO as opfor.js choiceTick writes it (house-live-save's way), the load replaying from the save)
  'a man cowering': { at: (s) => lane(s) && men(s).some(T => T.live.st === 'freeze'), lanes: [{ tier: 'sgt', code: 'quiet,loose', seed: 48213, bot: 'auto', build: freezeBuilt }] },
  'mid-challenge': { at: (s) => s.stop?.doing?.list?.[s.stop.doing.i] === 'contact:challenge', lanes: [{ tier: 'recruit', code: 'bang,held', seed: 1037, bot: 'auto' }] },
  'mid-search': { at: (s) => s.stop?.doing?.list?.[s.stop.doing.i] === 'contact:search', lanes: [{ tier: 'recruit', code: 'bang,held', seed: 48213, bot: 'auto' }] },
  'the hot wash': { at: (s) => !!H(s)?.wash && !s.armoury.range.end, lanes: [{ tier: 'sgt', code: 'quiet,loose', seed: 48213, bot: 'auto' }] },
});
/** The points met on the quick case's lanes (the sergeant's, the tier one's and the private's on 48213); the rest on the heavy case's named
 * lanes (found by a scan of 240 lanes after A's merge: the dash on the recruit's 2082, the challenge on his 1037, the search on his 48213). */
export const QUICK_POINTS = Object.freeze(['at GO', 'mid-throw', 'the bang\'s tick', 'a man dazed', 'the hot wash']);

const keyOf = (L) => `${L.tier}|${L.code}|${L.seed}|${L.bot}|${L.build ? 'built' : ''}`;

function savesAt(names) {
  const rows = {}, bad = [], left = new Set(names);
  const lanes = []; for (const name of names) for (const L of POINTS[name].lanes) if (!lanes.some(x => keyOf(x) === keyOf(L))) lanes.push(L);
  for (const L of lanes) {
    const want = [...left].filter(n => POINTS[n].lanes.some(x => keyOf(x) === keyOf(L)));
    if (!want.length) continue;
    const opts = { scenario: 'test-shoothouse', seed: L.seed, tier: L.tier, breach: L.code, setup: 'go' }, g = createGame(opts), bot = breachBot(L.bot, L);
    if (L.build) L.build(g);
    let n = 0;
    while (n++ < MAX_TICKS && want.some(x => left.has(x)) && !g.state.armoury.range.end) {
      const hits = want.filter(x => left.has(x) && POINTS[x].at(g.state));
      if (hits.length) {
        for (const h of hits) left.delete(h);
        const json = g.save(), ms = g.state.clock.ms - H(g.state).goAtMs, ids = checkIds(JSON.parse(json), g.sim.domains);
        const g2 = createGame(opts), bot2 = breachBot(L.bot, L);
        g2.load(json);
        const again = g2.save() === json;
        for (let i = 0; i < AFTER && !g.state.armoury.range.end; i++) { g.step(1, bot); g.clearFacts?.(); g2.step(1, bot2); g2.clearFacts?.(); }
        const same = g.digest() === g2.digest(), st = men(JSON.parse(json)).map(T => `${T.stand} ${T.live.st}`).join(', ');
        for (const hit of hits) rows[hit] = `${hit.padEnd(16)} ${L.tier} ${L.code} ${L.seed} (${L.bot}${L.build ? ', built by hand' : ''}) at +${(ms / 1000).toFixed(2)} s (${st}): ${ids.checked} ids, ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; saved again ${again ? 'the same' : 'DIFFERENT'}; ${AFTER} ticks on ${same ? 'the same' : 'APART'}`;
        if (!same || !again || ids.invalid.length || ids.dangling.length || g.errors.length || g2.errors.length) bad.push(`${hits.join(', ')}: ${same ? '' : 'apart '}${again ? '' : 'saved again different '}${[...ids.invalid, ...ids.dangling].slice(0, 3).join('; ')}`);
      } else { g.step(1, bot); g.clearFacts?.(); }
    }
  }
  for (const name of names) console.log(`      ${rows[name] ?? `${name.padEnd(16)} not met on its lanes`}`);
  const missing = names.filter(x => !rows[x]);
  assert(!bad.length, bad.join(' | '));
  assert(!missing.length, `points no lane met: ${missing.join(', ')}`);
}

export default [
  {
    name: 'F138 (the saves, quick): a save at GO, mid-throw, on the bang\'s tick, with a man dazed and at the hot wash loads and carries on byte for byte, every id held once, nothing gained on the save again',
    timeoutMs: 300_000,
    fn() { savesAt(QUICK_POINTS); },
  },
  {
    name: 'F138 (the saves): a save at a man\'s dash, a man cowering (built by hand: no honest lane froze one), mid-challenge and mid-search, each on its lane, loads and carries on byte for byte',
    heavy: true,
    timeoutMs: 900_000,
    fn() { savesAt(Object.keys(POINTS).filter(x => !QUICK_POINTS.includes(x))); },
  },
];
