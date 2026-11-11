// OLYMPUS tests: "Again as …" on test-shoothouse (the build sheet 0.0.12 §5.3, §2.3): every sheet on one seed meets the same lane, and a save anywhere in it carries on byte for byte.
//   - each sheet on 48213: the same stands, faces, holds and gaps, the same dummy in magazine 1, the same #2 and the same
//     instructor (drawn from the seed alone, never from the sheet: COMBAT §25.10.4's "Again as …"); againAsHouse names the
//     same seed and the sheet asked for, with the picker's par if one was set;
//   - a save at GO, in a bundle (the tier one's "Clear the house" running), in a take-in's window (setup 'contact') and in
//     the hot wash's splash: loaded and stepped on with the same bot, the digest is the unbroken run's, tick for tick.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseBot } from './bots/house.mjs';
import { houseNow, againAsHouse, drawStands, drawDummy } from '../src/sim/scenarios/shoothouse.js';

const SHEETS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);
// (what the lane draws, as the sheet would not change it)
const laneOf = (s) => {
  const R = s.armoury.range, H = R.house;
  return JSON.stringify({ turners: R.turners.map(T => [T.key, T.stand, T.room, T.face, T.holds, T.trigger, T.x, T.z]), dummy: [H.dummy.n, H.dummy.round], two: H.twoPid, chief: H.chiefPid,
    twoName: s.people[H.twoPid]?.name, chiefName: s.people[H.chiefPid]?.name });
};

// (a run carried on from a save: the unbroken game and its loaded twin stepped n ticks with the same bot, their digests each tick)
function carriesOn(g, mkBot, n, label) {
  const json = g.save(), twin = createGame({ scenario: 'test-shoothouse', seed: g.state.meta.seed });
  twin.load(json);
  const a = mkBot(), b = mkBot();
  for (let i = 0; i < n; i++) {
    g.step(1, a); twin.step(1, b); g.clearFacts(); twin.clearFacts();
    if (g.digest() !== twin.digest()) return { ok: false, at: i, label };
  }
  return { ok: true, at: n, label, digest: g.digest() };
}

export default [
  {
    name: '"Again as …": every sheet on 48213 meets the same stands, faces, holds, gaps, dummy, #2 and instructor; againAsHouse names the same seed, the sheet asked and the picker\'s par',
    fn() {
      const lanes = SHEETS.map(tier => laneOf(createGame({ scenario: 'test-shoothouse', seed: 48213, tier }).state));
      const s = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' }).state, R = s.armoury.range;
      console.log(`      the lane on 48213: ${R.turners.map(T => `${T.stand} ${T.face} ${T.holds}${T.trigger.gapMs ? ` +${T.trigger.gapMs} ms` : ''}`).join(' · ')}; the dummy round ${R.house.dummy.round} of magazine 1; the #2 ${s.people[R.house.twoPid].service.rank} ${s.people[R.house.twoPid].name.family}; the instructor ${s.people[R.house.chiefPid].service.rank} ${s.people[R.house.chiefPid].name.family}`);
      console.log(`      other seeds: ${[7, 99, 2024].map(seed => `${seed}: ${Object.entries(drawStands(seed)).map(([k, d]) => `${k} ${d.face[0]}${d.gapMs ? d.gapMs : ''}`).join(' ')} dummy ${drawDummy(seed).round}`).join(' | ')}`);
      assert(lanes.every(l => l === lanes[0]), 'a sheet changed the lane');
      const again = againAsHouse(s, 'tierone'), withPar = againAsHouse(createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', par: 'operator' }).state, 'sgt');
      console.log(`      again as the tier one: ${JSON.stringify(again)}; with the operator's par set: ${JSON.stringify(withPar)}`);
      assert(again.scenario === 'test-shoothouse' && again.seed === 48213 && again.tier === 'tierone' && again.par === null, JSON.stringify(again));
      assert(withPar.par === 'operator' && withPar.tier === 'sgt', JSON.stringify(withPar));
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', par: 'operator' });
      assert(g.state.armoury.range.house.parMs === 800, `the par set: ${g.state.armoury.range.house.parMs}`);
    },
  },
  {
    name: 'a save at GO, in a bundle, in a take-in\'s window and in the hot wash\'s splash loads and carries on byte for byte',
    timeoutMs: 180_000,
    fn() {
      const out = [];
      // (at GO, in stop motion, the first choice to make)
      { const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }); out.push(carriesOn(g, () => houseBot({ mode: 'keys' }), 600, 'GO')); }
      // (in a bundle: the tier one's "Clear the house" running)
      {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), bot = houseBot({ mode: 'T' });
        for (let i = 0; i < 400 && !g.state.stop?.doing?.beats; i++) { g.step(1, bot); g.clearFacts(); }
        for (let i = 0; i < 20; i++) { g.step(1, bot); g.clearFacts(); }
        out.push({ ...carriesOn(g, () => houseBot({ mode: 'T' }), 600, `a bundle (${g.state.stop?.doing?.step})`), was: g.state.stop?.doing?.step ?? null });
      }
      // (in a take-in's window: setup 'contact', a tick on)
      {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'contact' }), bot = houseBot({ mode: 'keys' });
        for (let i = 0; i < 40 && !g.state.mind?.contact?.pending; i++) { g.step(1, bot); g.clearFacts(); }
        const pending = !!g.state.mind?.contact?.pending;
        out.push({ ...carriesOn(g, () => houseBot({ mode: 'keys' }), 400, 'a window'), pending });
      }
      // (in the hot wash's splash)
      {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), bot = houseBot({ mode: 'T' });
        for (let i = 0; i < 20_000 && !(g.state.armoury.range.house.wash && g.state.skip); i++) { g.step(1, bot); g.clearFacts(); }
        const inSplash = !!g.state.skip;
        out.push({ ...carriesOn(g, () => houseBot({ mode: 'T' }), 200, 'the hot wash'), inSplash });
      }
      for (const o of out) console.log(`      ${o.label}: ${o.ok ? `carried on ${o.at} ticks byte for byte (${o.digest})` : `DIFFERED at tick ${o.at}`}${'pending' in o ? `; the window open: ${o.pending}` : ''}${'inSplash' in o ? `; behind the splash: ${o.inSplash}` : ''}`);
      assert(out.every(o => o.ok), JSON.stringify(out));
      assert(out[1].was && out[2].pending && out[3].inSplash, JSON.stringify(out.map(o => [o.label, o.was, o.pending, o.inSplash])));
    },
  },
];
