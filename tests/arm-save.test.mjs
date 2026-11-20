// OLYMPUS tests: "The window and the canopy"'s records and saves, F179's scene half (the build sheet v0.0.28 §6 B, §8).
//
// The private by the keys on 48213 played once to the card (tests/bots/armoury.mjs armouryBot, its memory on the actor so it saves), its
// digest the reference; at each save point the same lane is stopped there, saved, loaded into a fresh game (saved again byte for byte, the
// ids clean: tests/ids-check.mjs, both rifles at the rack's place among the items held once) and carried on to the card, whose digest must be
// the reference's. Quick: the window (the rifle across the counter) and the table (the canopy's rows), each carried on CARRY_TICKS (half a
// minute of play) and held to the reference's save at that tick, the round's quick budget a file (its §0 item 17); heavy: the same two
// to the card, and after the signature, the rank's
// check, the ammunition point, the lane, mid-police (the activity under way), the declaration, the barrel, and a turn-back (the boot recruit
// rushing on a seed the armourer turns back).
import { assert } from './helpers.mjs';
import { armGame, laneMemo, LANE_POINTS, CARRY_TICKS } from './armoury-world.mjs';
import { armouryBot, runArmoury } from './bots/armoury.mjs';
import { armouryNow } from '../src/sim/scenarios/armoury-day.js';
import { checkIds } from './ids-check.mjs';

const POINTS = LANE_POINTS;
// (the lane once: the tick each point is first met, the save's digest CARRY_TICKS after each, and the card's digest)
function reference(opts, botOpts) {
  const g = armGame(opts), bot = armouryBot(botOpts), at = new Map(), after = new Map(), saves = new Map();
  for (let t = 0; t < 20 * 60 * 15; t++) {
    const N = armouryNow(g.state);
    if (!N || N.end) break;
    for (const [k, f] of Object.entries(POINTS)) if (!at.has(k) && f(N, g.state)) { at.set(k, t); saves.set(k, g.save()); }
    for (const [k, tp] of at) if (tp + CARRY_TICKS === t) after.set(k, g.digest());
    g.step(1, bot);
  }
  return { at, after, saves, D: g.digest(), ticks: g.state.clock.ms };
}
// (the quick half: each point saved, loaded, saved again, carried on CARRY_TICKS and held to the reference's save there)
function carryShort(opts, botOpts, names, ref) {
  const bad = [];
  for (const name of names) {
    const tp = ref.at.get(name), want = ref.after.get(name);
    if (tp === undefined || !want) { bad.push(`${name}: never met`); continue; }
    // (the reference's own save at the point: the lane stopped there is the lane as played to there)
    const json = ref.saves.get(name), ids = checkIds(JSON.parse(json), armGame(opts).sim.domains);
    const b = armGame(opts);
    b.load(json);
    const again = b.save() === json;
    b.step(CARRY_TICKS, armouryBot(botOpts));
    const d = b.digest();
    console.log(`      ${name} (tick ${tp}, ${json.length} bytes): saved again byte for byte ${again}, ids ${ids.invalid.length + ids.dangling.length ? `BAD ${JSON.stringify([...ids.invalid, ...ids.dangling].slice(0, 2))}` : 'clean'}; ${CARRY_TICKS} ticks on: ${d}${d === want ? '' : ` DIFFERS (${want})`}`);
    if (!again || d !== want || ids.invalid.length || ids.dangling.length) bad.push(name);
  }
  return bad;
}
function carryOn(opts, botOpts, names, ref) {
  const bad = [];
  for (const name of names) {
    const tp = ref.at.get(name);
    if (tp === undefined) { bad.push(`${name}: never met`); continue; }
    const a = armGame(opts);
    a.step(tp, armouryBot(botOpts));
    const json = a.save(), ids = checkIds(JSON.parse(json), a.sim.domains);
    const b = armGame(opts);
    b.load(json);
    const again = b.save() === json;
    const out = runArmoury(b, armouryBot(botOpts));
    const d = b.digest();
    console.log(`      ${name} (tick ${tp}, ${json.length} bytes): saved again byte for byte ${again}, ids ${ids.invalid.length + ids.dangling.length ? `BAD ${JSON.stringify([...ids.invalid, ...ids.dangling].slice(0, 2))}` : 'clean'}; carried on to ${out.done ? 'the card' : 'NO CARD'}: ${d}${d === ref.D ? '' : ' DIFFERS'}`);
    if (!again || d !== ref.D || !out.done || ids.invalid.length || ids.dangling.length) bad.push(name);
  }
  return bad;
}

export default [
  {
    name: 'F179 (quick): saved at the window and at the table, loaded and carried on byte for byte half a minute of play, the ids clean',
    fn() {
      // (the lane armoury-world plays once a process: its saves at the points and its digests half a minute on)
      const opts = { seed: 48213, tier: 'private' }, ref = laneMemo(opts);
      console.log(`      the reference's card: ${ref.D}`);
      const bad = carryShort(opts, {}, ['window', 'table'], ref);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'F179 (heavy): the window and the table to the card, and eight more save points (the signature, the check, the ammunition point, the lane, mid-police, the declaration, the barrel, a turn-back) to the same card',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const opts = { seed: 48213, tier: 'private' }, ref = reference(opts, {});
      const bad = carryOn(opts, {}, ['window', 'signed', 'check', 'ammo', 'lane', 'police', 'declare', 'table', 'barrel'], ref);
      // (a turn-back: the boot recruit rushing; the first seed of ten the armourer turns back)
      let found = null;
      for (let seed = 1; seed <= 10 && !found; seed++) { const r = reference({ seed, tier: 'recruit' }, { tempo: 'rushed' }); if (r.at.has('turnBack')) found = { seed, r }; }
      if (!found) bad.push('turnBack: no seed of ten turned back');
      else bad.push(...carryOn({ seed: found.seed, tier: 'recruit' }, { tempo: 'rushed' }, ['turnBack'], found.r));
      assert(!bad.length, bad.join('; '));
    },
  },
];
