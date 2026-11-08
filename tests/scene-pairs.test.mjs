// test-pairs, "Pairs" (src/sim/scenarios/pairs.js; ROADMAP §4.2's 0.0.7b row, shipped as v0.0.8; COMBAT §25.10.3; the build sheet 0.0.8 §5.3): the pairs bot drives the course by its actions for each sheet, from the coach's brief to "The line is clear.", and the paper, the card and the take-ins hold their numbers.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { pairsBot } from './bots/pairs.mjs';
import { pairsNow, paperText, drawStrings, STRING_MAX_MS } from '../src/sim/scenarios/pairs.js';
import { rangeNow, roundsLeft } from '../src/sim/scenarios/handling.js';
import { takeInOf, takeInWords } from '../src/sim/combat/react.js';
import { TEST_SHEETS } from '../src/sim/skills/templates.js';
import { aimMsOf } from '../src/sim/arms/shot.js';
import { targetOf, gunOn, stepsOf } from '../src/sim/arms/shooting.js';
import { SEQ_PAIRS } from '../src/data/courses.js';
import { checkIds } from './ids-check.mjs';

/** The sheets the start card offers, played on seed 48213 (the build sheet §5.3). */
export const SHEETS = Object.freeze(['recruit', 'private', 'sgt', 'raider', 'tierone']);
/** COMBAT §25.4.4's body floor: no first round earlier than the sighting + this + the aim (ms). */
export const BODY_FLOOR_MS = 150;

/**
 * Play test-pairs with the pairs bot to its card: { g, P, ticks, livedMs, gameMs, contacts, strings, dryFirst } where
 * contacts are the pause facts, strings each string's { k, seenMs, pauseMs, aimMs, firstMs } (the aim from where the
 * rifle was at the pause, aimMsOf), dryFirst the first row the panel offered each time the bolt was locked on an empty.
 */
export function playPairs({ seed = 48213, tier = 'private', setup = null, bot = pairsBot(), maxTicks = 20 * 60 * 30 } = {}) {
  const g = createGame({ scenario: 'test-pairs', seed, tier, setup }), s = g.state, t0 = s.clock.ms;
  const contacts = [], strings = {}, dryFirst = [];
  let ticks = 0, seen = 0, livedMs = 0, dryAt = null;
  for (; ticks < maxTicks; ticks++) {
    const before = s.clock.ms;
    g.step(1, bot);
    if (s.clock.ms - before <= 50) livedMs += s.clock.ms - before;
    const ev = g.bus.events;
    for (; seen < ev.length; seen++) {
      const [type, d] = ev[seen];
      const R = s.armoury.range, k = R.str?.k;
      if (type === 'contact' && d.phase === 'pause') {
        contacts.push({ ...d, k });
        const pick = s.stop?.pick ? targetOf(s, s.stop.pick) : null;
        const pid = s.player.id;
        strings[k] ??= { k, seenMs: d.seenMs, pauseMs: d.atMs, aimMs: pick ? aimMsOf(s, pid, gunOn(s, pid), pick) : null, firstMs: null, grade: d.grade, expect: d.expect, n: d.n, ms: d.ms };
      }
      if (type === 'shot' && d.fired && strings[k] && strings[k].firstMs === null && !R.str?.done) strings[k].firstMs = d.atMs;
    }
    // (each time the bolt locks on an empty in a string, the first row the panel offers)
    const S = s.stop, gun = s.items[gunOn(s, s.player.id)];
    if (S?.mode === 'stop' && S.phase === 'choose' && !S.reflex && gun?.locked && gun.mag && s.items[gun.mag]?.n === 0 && roundsLeft(s) > 0 && dryAt !== s.clock.ms) {
      dryAt = s.clock.ms;
      // (RELOAD first of the commands (specials.js reloadRows' first): the panel's first command row unstruck, and its first row of all)
      const st = stepsOf(s);
      dryFirst.push({ k: s.armoury.range.str?.k ?? null, first: st.find(x => !x.off && (x.kind === 'command' || /^macro:/.test(x.id)))?.id ?? null, top: st.find(x => !x.off)?.id ?? null });
    }
    if (pairsNow(s).end) break;
  }
  g.clearFacts();
  return { g, P: pairsNow(s), ticks, livedMs, gameMs: s.clock.ms - t0, contacts, strings, dryFirst, t0 };
}

// (a run's strings as printed: the expectation, the take-in, the pause to the first round, the splits, the zones, the rows, how it ended)
function lines(P) {
  return P.strs.map(x => `string ${x.k} at ${x.line} m [${x.keys.join(' ')}]: ${x.expect ?? '-'}${x.n > 1 ? ` ×${x.n}` : ''}, "${x.paper}"${x.rows.length ? `, rows ${x.rows.join(' ')}` : ''}, ${x.done}`);
}

/**
 * test-pairs as v0.0.8 played it (the build sheet 0.0.9 §3.3: calm test-pairs unchanged to the tick): each sheet on seed
 * 48213 and the private on 7 and 99, by the pairs bot, printed by v0.0.8's own code (a worktree at the tag, the scene
 * role's /private/tmp/claude-501/olympus-build/r9/scene/papers.mjs) and pasted: the ticks to the card, the game time, the
 * card's summary, each string's take-in, paper, rows and end. A constant moved by the design moves these on purpose, said.
 */
export const V008_PAPERS = Object.freeze([
  {"tier":"recruit","seed":48213,"ticks":2380,"gameMs":116100,"summary":"Boot recruit · 5 strings · take-in 0.65 to 2.25 s · 13 A, 1 C, 1 ring, 1 head down, 4 miss · no-shoot untouched · RELOAD 3.30 s · topped up","strs":[{"k":0,"takeInMs":650,"paper":"TURN TO PAUSE 0.65 · PAUSE TO FIRST 1.85 · SPLITS 0.50 · 2 A","rows":[],"done":"stopped"},{"k":1,"takeInMs":2250,"paper":"TURN TO PAUSE 2.25 · PAUSE TO FIRST 1.85 · SPLITS 0.50 1.70 0.50 · 4 A","rows":[],"done":"stopped"},{"k":2,"takeInMs":800,"paper":"TURN TO PAUSE 0.80 · PAUSE TO FIRST 1.85 · SPLITS 0.50 0.50 0.50 2.85 0.50 · 4 A, 2 MISS","rows":[],"done":"stopped"},{"k":3,"takeInMs":650,"paper":"TURN TO PAUSE 0.65 · PAUSE TO FIRST 1.85 · SPLITS 0.50 0.89 · 1 RING, 1 HEAD DOWN, 1 MISS","rows":["shot:head"],"done":"stopped"},{"k":4,"takeInMs":750,"paper":"TURN TO PAUSE 0.75 · PAUSE TO FIRST 1.85 · SPLITS 0.50 2.85 3.80 0.50 · 3 A, 1 C, 1 MISS","rows":[],"done":"stopped"}]},
  {"tier":"private","seed":48213,"ticks":1906,"gameMs":93100,"summary":"Private · 5 strings · take-in 0.55 to 1.25 s · 14 A, 1 ring, 1 head down, 4 miss · no-shoot untouched · RELOAD 2.55 s · topped up","strs":[{"k":0,"takeInMs":550,"paper":"TURN TO PAUSE 0.55 · PAUSE TO FIRST 1.50 · SPLITS 0.40 · 2 A","rows":["shot:pair"],"done":"stopped"},{"k":1,"takeInMs":1250,"paper":"TURN TO PAUSE 1.25 · PAUSE TO FIRST 1.50 · SPLITS 0.40 1.35 0.40 · 4 A","rows":["shot:pair","shot:pair"],"done":"stopped"},{"k":2,"takeInMs":650,"paper":"TURN TO PAUSE 0.65 · PAUSE TO FIRST 1.50 · SPLITS 0.40 0.41 0.40 1.30 0.40 · 4 A, 2 MISS","rows":["shot:pair","shot:pair","shot:pair"],"done":"stopped"},{"k":3,"takeInMs":550,"paper":"TURN TO PAUSE 0.55 · PAUSE TO FIRST 1.50 · SPLITS 0.40 0.56 · 1 RING, 1 HEAD DOWN, 1 MISS","rows":["shot:pair","shot:head"],"done":"stopped"},{"k":4,"takeInMs":600,"paper":"TURN TO PAUSE 0.60 · PAUSE TO FIRST 1.50 · SPLITS 0.40 1.30 2.95 0.40 · 4 A, 1 MISS","rows":["shot:pair","shot:pair","shot:pair"],"done":"stopped"}]},
  {"tier":"sgt","seed":48213,"ticks":1533,"gameMs":75100,"summary":"Sergeant · 5 strings · take-in 0.25 to 0.55 s · 14 A, 1 ring, 1 head down, 4 miss · no-shoot untouched · RELOAD 1.90 s · topped up","strs":[{"k":0,"takeInMs":250,"paper":"TURN TO PAUSE 0.25 · PAUSE TO FIRST 0.80 · SPLITS 0.33 · 2 A","rows":["shot:pair"],"done":"stopped"},{"k":1,"takeInMs":550,"paper":"TURN TO PAUSE 0.55 · PAUSE TO FIRST 0.80 · SPLITS 0.33 1.05 0.33 · 4 A","rows":["shot:pair","shot:pair"],"done":"stopped"},{"k":2,"takeInMs":300,"paper":"TURN TO PAUSE 0.30 · PAUSE TO FIRST 0.80 · SPLITS 0.33 0.37 0.33 1.01 0.33 · 4 A, 2 MISS","rows":["shot:pair","shot:pair","shot:pair"],"done":"stopped"},{"k":3,"takeInMs":250,"paper":"TURN TO PAUSE 0.25 · PAUSE TO FIRST 0.80 · SPLITS 0.19 0.23 · 1 RING, 1 HEAD DOWN, 1 MISS","rows":["shot:failure"],"done":"stopped"},{"k":4,"takeInMs":300,"paper":"TURN TO PAUSE 0.30 · PAUSE TO FIRST 0.80 · SPLITS 0.33 0.87 2.40 0.33 · 4 A, 1 MISS","rows":["shot:pair","shot:pair"],"done":"stopped"}]},
  {"tier":"raider","seed":48213,"ticks":1350,"gameMs":66100,"summary":"Raider, five years · 5 strings · take-in 0.10 to 0.20 s · 14 A, 1 ring, 1 head down, 4 miss · no-shoot untouched · RELOAD 1.45 s · topped up","strs":[{"k":0,"takeInMs":100,"paper":"TURN TO PAUSE 0.10 · PAUSE TO FIRST 0.64 · SPLITS 0.29 · 2 A","rows":["shot:pair"],"done":"stopped"},{"k":1,"takeInMs":200,"paper":"TURN TO PAUSE 0.20 · PAUSE TO FIRST 0.64 · SPLITS 0.29 0.83 0.29 · 4 A","rows":["shot:pair","shot:pair"],"done":"stopped"},{"k":2,"takeInMs":100,"paper":"TURN TO PAUSE 0.10 · PAUSE TO FIRST 0.64 · SPLITS 0.29 0.33 0.29 0.79 0.29 · 4 A, 2 MISS","rows":["shot:pair","shot:pair","shot:pair"],"done":"stopped"},{"k":3,"takeInMs":100,"paper":"TURN TO PAUSE 0.10 · PAUSE TO FIRST 0.64 · SPLITS 0.14 0.17 · 1 RING, 1 HEAD DOWN, 1 MISS","rows":["shot:failure"],"done":"stopped"},{"k":4,"takeInMs":100,"paper":"TURN TO PAUSE 0.10 · PAUSE TO FIRST 0.64 · SPLITS 0.29 0.68 1.90 0.29 · 4 A, 1 MISS","rows":["shot:pair","shot:pair"],"done":"stopped"}]},
  {"tier":"tierone","seed":48213,"ticks":1310,"gameMs":64100,"summary":"Tier one · 5 strings · take-in 0.05 to 0.15 s · 14 A, 1 ring, 1 head down, 4 miss · no-shoot untouched · RELOAD 1.20 s · topped up","strs":[{"k":0,"takeInMs":50,"paper":"TURN TO PAUSE 0.05 · PAUSE TO FIRST 0.55 · SPLITS 0.26 · 2 A","rows":["shot:pair"],"done":"stopped"},{"k":1,"takeInMs":150,"paper":"TURN TO PAUSE 0.15 · PAUSE TO FIRST 0.55 · SPLITS 0.26 0.70 0.26 · 4 A","rows":["shot:pair","shot:pair"],"done":"stopped"},{"k":2,"takeInMs":50,"paper":"TURN TO PAUSE 0.05 · PAUSE TO FIRST 1.75 · SPLITS 0.26 0.29 0.26 0.68 0.26 · 4 A, 2 MISS","rows":["shot:pair","shot:pair","shot:pair"],"done":"stopped"},{"k":3,"takeInMs":50,"paper":"TURN TO PAUSE 0.05 · PAUSE TO FIRST 1.75 · SPLITS 0.11 0.14 · 1 RING, 1 HEAD DOWN, 1 MISS","rows":["shot:failure"],"done":"stopped"},{"k":4,"takeInMs":50,"paper":"TURN TO PAUSE 0.05 · PAUSE TO FIRST 0.55 · SPLITS 0.26 0.54 1.65 0.26 · 4 A, 1 MISS","rows":["shot:pair","shot:pair"],"done":"stopped"}]},
  {"tier":"private","seed":7,"ticks":1804,"gameMs":88150,"summary":"Private · 5 strings · take-in 0.55 to 1.25 s · 15 A, 1 ring, 1 head down, 3 miss · no-shoot untouched · RELOAD 2.90 s · topped up","strs":[{"k":0,"takeInMs":550,"paper":"TURN TO PAUSE 0.55 · PAUSE TO FIRST 1.50 · SPLITS 0.40 · 2 A","rows":["shot:pair"],"done":"stopped"},{"k":1,"takeInMs":1250,"paper":"TURN TO PAUSE 1.25 · PAUSE TO FIRST 1.50 · SPLITS 0.40 1.35 0.40 0.41 0.40 · 4 A, 2 MISS","rows":["shot:pair","shot:pair","shot:pair"],"done":"stopped"},{"k":2,"takeInMs":650,"paper":"TURN TO PAUSE 0.65 · PAUSE TO FIRST 1.50 · SPLITS 0.40 1.30 0.40 · 4 A","rows":["shot:pair","shot:pair"],"done":"stopped"},{"k":3,"takeInMs":550,"paper":"TURN TO PAUSE 0.55 · PAUSE TO FIRST 1.50 · SPLITS 0.40 0.56 · 1 A, 1 RING, 1 HEAD DOWN","rows":["shot:pair","shot:head"],"done":"stopped"},{"k":4,"takeInMs":600,"paper":"TURN TO PAUSE 0.60 · PAUSE TO FIRST 1.50 · SPLITS 0.40 1.30 3.30 0.40 · 4 A, 1 MISS","rows":["shot:pair","shot:pair","shot:pair"],"done":"stopped"}]},
  {"tier":"private","seed":99,"ticks":1771,"gameMs":86100,"summary":"Private · 5 strings · take-in 0.55 to 1.25 s · 14 A, 3 ring, 1 head down, 4 miss · no-shoot untouched · RELOAD 2.55 s · topped up","strs":[{"k":0,"takeInMs":1050,"paper":"TURN TO PAUSE 1.05 · PAUSE TO FIRST 1.70 · SPLITS 0.40 · 2 A","rows":["shot:pair"],"done":"stopped"},{"k":1,"takeInMs":1250,"paper":"TURN TO PAUSE 1.25 · PAUSE TO FIRST 1.50 · SPLITS 0.40 1.35 0.40 0.41 0.40 · 4 A, 2 MISS","rows":["shot:pair","shot:pair","shot:pair"],"done":"stopped"},{"k":2,"takeInMs":650,"paper":"TURN TO PAUSE 0.65 · PAUSE TO FIRST 1.65 · SPLITS 0.40 0.41 0.40 2.65 0.40 · 4 A, 2 MISS","rows":["shot:pair","shot:pair","shot:pair"],"done":"stopped"},{"k":3,"takeInMs":550,"paper":"TURN TO PAUSE 0.55 · PAUSE TO FIRST 1.65 · SPLITS 0.40 0.56 0.55 · 3 RING, 1 HEAD DOWN","rows":["shot:pair","shot:head","shot:head"],"done":"stopped"},{"k":4,"takeInMs":600,"paper":"TURN TO PAUSE 0.60 · PAUSE TO FIRST 1.50 · SPLITS 0.40 1.30 2.95 · 4 A","rows":["shot:pair","shot:pair","shot:pair"],"done":"stopped"}]},
]);

export default [
  {
    name: 'calm test-pairs plays to the tick as v0.0.8 did (the build sheet 0.0.9 §3.3; the user\'s rule: "test-pairs as built must not get worse"): every sheet on seed 48213 and the private on 7 and 99, the ticks to the card, the summary, each string\'s take-in, paper, rows and end equal to v0.0.8\'s',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    fn() {
      const diffs = [];
      for (const want of V008_PAPERS) {
        const r = playPairs({ seed: want.seed, tier: want.tier }), P = r.P;
        const got = { tier: want.tier, seed: want.seed, ticks: r.ticks, gameMs: r.gameMs, summary: P.summary, strs: P.strs.map(x => ({ k: x.k, takeInMs: x.takeInMs, paper: x.paper, rows: x.rows, done: x.done })) };
        const same = JSON.stringify(got) === JSON.stringify(want);
        console.log(`      ${want.tier} ${want.seed}: ${same ? 'as v0.0.8' : 'MOVED'}, ${r.ticks} ticks, ${P.summary}`);
        if (!same) diffs.push({ want, got });
      }
      assert(!diffs.length, JSON.stringify(diffs[0]));
    },
  },
  {
    name: 'the pairs bot plays test-pairs by its actions to the card for each sheet on seed 48213 (boot recruit, private, sergeant, Raider, tier one) and the private on seeds 7 and 99: no fault, the no-shoot untouched, string 4 dry and its RELOAD, the lull\'s Top up, every round counted, every item held once, each paper the record\'s',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    fn() {
      const t = performance.now(), runs = [];
      for (const [tier, seed] of [...SHEETS.map(x => [x, 48213]), ['private', 7], ['private', 99]]) {
        const r = playPairs({ seed, tier }), { g, P } = r, s = g.state, R = s.armoury.range;
        runs.push({ tier, seed, ...r });
        console.log(`      ${TEST_SHEETS[tier].label}, seed ${seed}, lane ${P.lane}: ${P.summary}`);
        for (const l of lines(P)) console.log(`        ${l}`);
        console.log(`        reloads ${R.reloads.map(x => `${x.kind} ${takeInWords(x.ms)} s (${x.why}${x.string !== null ? `, string ${x.string}` : ''})`).join(', ') || 'none'}; rounds ${JSON.stringify(P.card.gun.rounds)}; ${fmt(r.gameMs / 1000, 1)} s of game time, ${r.ticks} ticks`);
        assert(P.end?.phase === 'clear' && rangeNow(s).summary === P.summary, `${tier} ${seed}: the card ${JSON.stringify(P.end)}`);
        assert(!R.faults.length, `${tier} ${seed}: faults ${JSON.stringify(R.faults)}`);
        // (every threat down, or the rounds run out (a recruit's misses can spend the 22 before string 4's last threat: no fault, the
        // coach's "Out of rounds")
        assert(P.strs.length === 5 && P.strs.every(x => x.done === 'stopped' || (x.done === 'dry' && x.k === 4)), `${tier} ${seed}: five strings, every threat down ${JSON.stringify(P.strs.map(x => x.done))}`);
        assert(P.card.shots.noshoot === 0, `${tier} ${seed}: the no-shoot untouched`);
        console.log(`        the bolt locked on an empty: the panel's first command ${r.dryFirst.map(x => `${x.first} (string ${x.k}; its first row ${x.top})`).join(', ') || 'never'}`);
        assert(r.dryFirst.length && r.dryFirst.every(x => /^macro:reload:/.test(x.first)), `${tier} ${seed}: RELOAD first on the empty ${JSON.stringify(r.dryFirst)}`);
        const dry = R.reloads.find(x => x.why === 'dry');
        assert(dry && dry.string === 4 && ['speed', 'retain'].includes(dry.kind), `${tier} ${seed}: string 4 ran dry and was reloaded ${JSON.stringify(R.reloads)}`);
        assert(P.card.gun.topUp && P.card.gun.short, `${tier} ${seed}: the lull's Top up and the short one ${JSON.stringify(P.card.gun)}`);
        const rd = P.card.gun.rounds;
        assert(rd.issued === rd.fired + rd.held, `${tier} ${seed}: rounds issued ${rd.issued} = fired ${rd.fired} + held ${rd.held}`);
        for (const x of P.strs) assert(x.paper === paperText({ takeInMs: x.takeInMs, pauseToFirstMs: x.pauseToFirstMs, splitsMs: x.splitsMs, zones: x.zones }), `${tier} ${seed}: string ${x.k}'s paper ${x.paper}`);
        const ids = checkIds(JSON.parse(g.save()), g.sim.domains);
        assert(!ids.invalid.length && !ids.dangling.length, JSON.stringify({ invalid: ids.invalid.slice(0, 5), dangling: ids.dangling.slice(0, 5) }));
      }
      console.log(`      ${runs.length} courses in ${fmt(performance.now() - t, 0)} ms`);
    },
  },
  {
    name: 'each take-in is the one helper\'s for its case (react.js takeInOf: the sheet\'s Warfighting, the expectation, the notice roll\'s grade, how many), and the recruit\'s is the tier one\'s × §4\'s ratio in the same case on the same seed: 13 in his sector (650 against 50), 8.7 alert (1,300 against 150)',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    fn() {
      const by = {};
      for (const tier of SHEETS) {
        const { P, contacts } = playPairs({ seed: 48213, tier });
        by[tier] = P;
        const wf = TEST_SHEETS[tier].wf;
        console.log(`      ${TEST_SHEETS[tier].label} (WF ${wf}): ${contacts.map(c => `string ${c.k} ${c.expect}${c.n > 1 ? ` ×${c.n}` : ''} ${c.grade} ${takeInWords(c.ms)}`).join(' · ')}`);
        for (const c of contacts) {
          const want = takeInOf({ wf, expect: c.expect, grade: c.grade, n: c.n }).ms;
          assert(c.ms === want, `${tier}: string ${c.k}'s take-in ${c.ms}, the helper's ${want} (${c.expect}, ${c.grade}, ${c.n})`);
          assert(c.ms >= 50 && c.ms % 50 === 0, `${tier}: whole ticks ${c.ms}`);
        }
      }
      // (the same case on the same seed: the same turners at the same gaps, so the strings line up; a passed roll on both)
      const rec = by.recruit.strs, one = by.tierone.strs, ratios = [];
      for (let k = 0; k < 5; k++) {
        const a = rec[k], b = one[k];
        if (!a?.takeInMs || !b?.takeInMs || a.expect !== b.expect || a.n !== b.n) continue;
        ratios.push({ k, expect: a.expect, n: a.n, recruit: a.takeInMs, tierone: b.takeInMs, ratio: a.takeInMs / b.takeInMs });
      }
      for (const r of ratios) console.log(`      string ${r.k} (${r.expect}${r.n > 1 ? ` ×${r.n}` : ''}): the recruit ${takeInWords(r.recruit)} s, the tier one ${takeInWords(r.tierone)} s: ×${fmt(r.ratio, 1)}`);
      const sector = ratios.find(r => r.expect === 'sector' && r.n === 1 && r.recruit === 650);
      assert(ratios.length >= 3 && ratios.every(r => r.ratio >= 4), `the gulf ${JSON.stringify(ratios)}`);
      if (sector) assert(sector.tierone === 50 && Math.abs(sector.ratio - 13) < 1e-9, `in his sector: ${JSON.stringify(sector)}`);
    },
  },
  {
    name: 'no first round ever leaves earlier than the sighting + 0.15 s + the aim (COMBAT §25.4.4\'s body floor), on every sheet and every string',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    fn() {
      let n = 0, worst = Infinity;
      for (const tier of SHEETS) {
        const { strings } = playPairs({ seed: 48213, tier });
        const row = [];
        for (const x of Object.values(strings)) {
          if (x.firstMs === null || x.aimMs === null) continue;
          const lead = x.firstMs - x.seenMs, floor = BODY_FLOOR_MS + x.aimMs;
          row.push(`${x.k}: ${takeInWords(lead)} s ≥ ${takeInWords(floor)}`);
          worst = Math.min(worst, lead - floor); n++;
          assert(lead >= floor, `${tier}: string ${x.k}'s first round ${lead} ms after the sighting, under the floor ${floor} (the aim ${x.aimMs})`);
        }
        console.log(`      ${TEST_SHEETS[tier].label}: the sighting to the first round ${row.join(', ')}`);
      }
      console.log(`      ${n} strings, the nearest ${fmt(worst, 0)} ms over the floor`);
    },
  },
  {
    name: 'the coach runs the bay: his commands are speech beside you in SEQ_PAIRS\' order, he says the paper after each string, and says nothing while a take-in runs (COMBAT §25.4.5)',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private' }), bot = pairsBot(), s = g.state, said = [];
      let open = null, inWindow = 0;
      for (let n = 0; n < 20 * 60 * 10 && !pairsNow(s).end; n++) {
        g.step(1, bot);
        for (const [type, d] of g.bus.events) {
          if (type === 'contact' && (d.phase === 'seen' || d.phase === 'join')) open = d.untilMs;
          if (type === 'contact' && d.phase === 'pause') open = null;
          if (type === 'say') { said.push(d); if (open !== null) inWindow++; }
        }
        g.clearFacts();
      }
      const R = s.armoury.range, coach = said.filter(d => d.who === R.coachId);
      const kinds = [...new Set(coach.map(d => d.kind))], papers = coach.filter(d => /TURN TO PAUSE/.test(d.text));
      console.log(`      ${coach.length} lines from the coach (${kinds.join(', ')}), ${papers.length} papers read; ${said.length - coach.length} from others; in a window: ${inWindow}`);
      console.log(`      the course: ${SEQ_PAIRS.map(c => c.id + (c.string !== undefined ? c.string : '')).join(' · ')}`);
      assert(kinds.length === 1 && kinds[0] === 'speech' && R.roId === R.coachId, `the coach's voice ${JSON.stringify(kinds)}`);
      assert(papers.length === 5 && inWindow === 0, JSON.stringify({ papers: papers.length, inWindow }));
    },
  },
  {
    name: 'drawStrings: the five strings from the seed alone (the lane\'s turner, two together, three with one no-shoot, the armoured, two on the short magazine), their gaps whole ticks within STANDBY_MS',
    fn() {
      for (const seed of [48213, 7, 99]) {
        const lane = createGame({ scenario: 'test-pairs', seed }).state.armoury.range.lane, d = drawStrings(seed, lane);
        console.log(`      seed ${seed}, lane ${lane}: ${d.map(x => `${x.k} at ${x.line} m ${x.keys.map(k => `${k.split(':')[1]}${x.faces[k] === 'threat' ? '' : `(${x.faces[k]})`}:${x.holds[k]}`).join(' ')} +${takeInWords(x.gapMs)} s`).join(' · ')}`);
        assert(d.length === 5 && d[0].keys.length === 1 && d[1].keys.length === 2 && d[2].keys.length === 3 && d[3].keys.length === 1 && d[4].keys.length === 2, 'the counts');
        assert(Object.values(d[2].faces).filter(f => f === 'noshoot').length === 1 && d[3].faces[d[3].keys[0]] === 'armoured', 'the no-shoot and the armoured');
        assert(d.every(x => x.gapMs % 50 === 0 && x.gapMs >= 1500 && x.gapMs <= 4000), 'the gaps');
        assert(d.every(x => x.keys.every(k => Math.abs(Number(k.split(':')[1]) - lane) <= 1)), 'your lane and its neighbours');
      }
      console.log(`      a string's limit ${STRING_MAX_MS / 1000} s lived since the turn`);
    },
  },
  {
    name: 'the reloads are counted by purpose as believed at their start (the code review of v0.0.8): Top ups between strings are "between", never the lull\'s, so before the lull the card says "not topped up"; the lull opens at the last string\'s end with the coach\'s fresh ten in a pouch, and only a reload there is "topped up"; the steel\'s paper reads RING and HEAD DOWN',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private' }), s = g.state, bot = pairsBot();
      let before = null;
      for (let n = 0; n < 20 * 60 * 30 && !pairsNow(s).end; n++) {
        g.step(1, bot);
        const P = pairsNow(s);
        if (!before && P.strs.some(x => x.k === 3)) before = { reloads: P.reloads.map(r => r.why), topUp: P.card.gun.topUp, lull: P.lull };
      }
      const P = pairsNow(s), R = s.armoury.range, steel = P.strs.find(x => x.k === 3);
      console.log(`      before the lull: reloads ${before.reloads.join(', ')}; topped up ${JSON.stringify(before.topUp)}; the lull ${JSON.stringify(before.lull)}`);
      console.log(`      at the end: reloads ${P.reloads.map(r => `${r.kind} ${r.why}${r.string !== null ? ` (string ${r.string})` : ''}`).join(', ')}; the lull ${JSON.stringify(P.lull)}; the lull's magazine ${R.mags.lull} in ${s.items[R.mags.lull] ? 'the kit' : '?'}; the steel's paper "${steel.paper}"`);
      assert(before.reloads.length && !before.reloads.includes('lull') && before.topUp === null && before.lull === null, JSON.stringify(before));
      assert(P.lull?.handed && P.card.gun.topUp && P.reloads.filter(r => r.why === 'lull').length >= 1 && P.card.gun.topUp.ms === P.lull.topUp.ms, JSON.stringify({ lull: P.lull, reloads: P.reloads }));
      assert(/RING/.test(steel.paper) && !/\d A/.test(steel.paper), steel.paper);
    },
  },
  {
    name: 'the stage draws the turners as the marine knows them (PEOPLE §7.6; COMBAT §25.4.6; the reviews of v0.0.8): every paper face the one board, threat and no-shoot alike; what a face holds only once this turn\'s take-in identified it; a face identified \'unseen\' is drawn with nothing in its hands; the steel as steel',
    async fn() {
      const { pairsLook } = await import('../src/sim/scenarios/pairs.js');
      const { contactNow } = await import('../src/sim/combat/contact.js');
      const { contactOf, noteContact } = await import('../src/sim/people/mind.js');
      const { turnerFace } = await import('../src/render/range-items.js');
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby:2' }), s = g.state, R = s.armoury.range;
      const view = () => pairsLook(s).turners.filter(t => R.str.keys.includes(t.key)).map(t => `${t.key} ${t.face}/${t.holds ?? '-'}`).join(', ');
      let inWindow = null;
      for (let n = 0; n < 400 && !(contactNow(s)?.last && s.stop?.mode === 'stop'); n++) { g.step(1); if (!inWindow && contactNow(s)?.pending) inWindow = view(); }
      const atPause = view(), truth = R.str.keys.map(k => { const T = R.turners.find(t => t.key === k); return `${k} ${T.face}/${T.holds}`; }).join(', ');
      const ns = R.str.keys.find(k => R.turners.find(t => t.key === k).face === 'noshoot'), last = contactOf(s).last;
      noteContact(s, { last: { ...last, ident: { ...last.ident, [ns]: 'unseen' } } });
      const unseen = pairsLook(s).turners.find(t => t.key === ns);
      console.log(`      the truth: ${truth}`);
      console.log(`      in the window: ${inWindow}; at the pause: ${atPause}; ${ns} identified 'unseen': ${unseen.face}/${unseen.holds ?? '-'}`);
      const look = pairsLook(s).turners.filter(t => R.str.keys.includes(t.key));
      assert(/^(turner:\d paper\/-(, )?)+$/.test(inWindow) && look.every(t => t.face === 'paper') && unseen.holds === null, JSON.stringify({ inWindow, atPause, unseen }));
      assert(look.filter(t => t.key !== ns).every(t => t.holds === R.turners.find(T => T.key === t.key).holds), atPause);
      // (the board's painting: the same pixels for a threat and a no-shoot with nothing identified)
      const a = turnerFace('threat', null), b = turnerFace('noshoot', null), c = turnerFace('paper', null);
      assert(a.cells.join() === b.cells.join() && b.cells.join() === c.cells.join(), 'threat and no-shoot boards differ');
      const st = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby:3' });
      for (let n = 0; n < 200 && !st.state.armoury.range.str.turnedMs; n++) st.step(1);
      const steel = pairsLook(st.state).turners.find(t => st.state.armoury.range.str.keys.includes(t.key));
      console.log(`      the armoured, turning: ${steel.face}/${steel.holds ?? '-'}`);
      assert(steel.face === 'armoured', JSON.stringify(steel));
    },
  },
];
