// OLYMPUS tests: the fumble net, the sweep (heavy): hundreds of lanes of the shoot house with its handling rolls fumbled, every tier × every setup × the three bots × the seeds, each case held against v0.0.17's allow-list (house-fumble.test.mjs KNOWN).
//
// One test a tier (36 lanes a seed: six setups, three bots, two seeds by default: 216 lanes in all, about 3 min on the user's
// Mac). A test fails on an UNKNOWN case only (a dead end no entry of KNOWN names): the quick cut's fixtures hold the list
// honest, this one looks wide. Each prints its counts by invariant and, for every entry met, how often and where first (a
// lane to make a new fixture from).
// The knobs (environment): FUMBLE_SEEDS (a list, default 1,2), FUMBLE_RATE (default fumble.mjs RATE: the allow-list is v0.0.17's
// at that rate; another rate may meet cases it does not name), FUMBLE_TWO_RATE (the #2's, default TWO_RATE), FUMBLE_BOTS (a
// list of house, honest, fuzz). FUMBLE_PRINT=1 prints every case, not the first twelve unknown.
import { assert } from './helpers.mjs';
import { runLane, classify, caseLine, lanesOf, TIERS, BOTS, RATE, TWO_RATE } from './bots/fumble.mjs';
import { KNOWN, OPEN, UNCOVERED, printSweep } from './house-fumble.test.mjs';
import { f67 } from './flawless-drawn.mjs';

const SEEDS = (process.env.FUMBLE_SEEDS ?? '1,2').split(',').map(Number).filter(Number.isFinite);
const RATE_SET = Number.isFinite(+process.env.FUMBLE_RATE) && process.env.FUMBLE_RATE ? +process.env.FUMBLE_RATE : RATE;
const TWO_SET = Number.isFinite(+process.env.FUMBLE_TWO_RATE) && process.env.FUMBLE_TWO_RATE ? +process.env.FUMBLE_TWO_RATE : TWO_RATE;
const BOTS_SET = (process.env.FUMBLE_BOTS ?? BOTS.join(',')).split(',').filter(b => BOTS.includes(b));

const sweep = (tier) => () => {
  const lanes = lanesOf({ seeds: SEEDS, tiers: [tier], bots: BOTS_SET, rate: RATE_SET }).map(L => ({ ...L, twoRate: TWO_SET }));
  const t0 = Date.now(), recs = lanes.map(L => runLane(L));
  // (v0.0.18: OPEN, the classes its fixtures say are fixed that its lanes still meet; accepted, printed, to close)
  const cl = classify(recs.flatMap(r => r.cases), [...KNOWN, ...OPEN]);
  console.log(`      the ${tier}: seeds ${SEEDS.join(', ')}, rate ${RATE_SET} (the #2's ${TWO_SET}), bots ${BOTS_SET.join(', ')}, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  printSweep(recs, cl);
  if (process.env.FUMBLE_PRINT) for (const c of recs.flatMap(r => r.cases)) console.log(`      ${caseLine(c).slice(0, 500)}`);
  assert(!cl.unknown.length, `${cl.unknown.length} UNKNOWN cases (a dead end not in KNOWN or OPEN): ${cl.unknown.slice(0, 4).map(caseLine).join(' || ')}`);
};

// (v0.0.21, the build sheet §1 item 17: the drawn slice, 72 lanes on the house drawn from the seed: every tier, the brief and GO, the
// three bots, seeds 1 and 2; FUMBLE_DRAWN=0 leaves it out)
const DRAWN_SETUPS = Object.freeze([null, 'go']);
const drawnSweep = (tier) => () => {
  const lanes = lanesOf({ seeds: [1, 2], tiers: [tier], setups: DRAWN_SETUPS, bots: BOTS_SET, rate: RATE_SET, draw: 'drawn' }).map(L => ({ ...L, twoRate: TWO_SET }));
  const t0 = Date.now(), recs = lanes.map(L => runLane(L));
  const cl = classify(recs.flatMap(r => r.cases), [...KNOWN, ...OPEN]);
  console.log(`      the ${tier} on the drawn house: seeds 1, 2, the brief and GO, rate ${RATE_SET}, bots ${BOTS_SET.join(', ')}, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  printSweep(recs, cl);
  assert(!cl.unknown.length, `${cl.unknown.length} UNKNOWN cases on the drawn house: ${cl.unknown.slice(0, 4).map(caseLine).join(' || ')}`);
};

export default [
  ...(process.env.FUMBLE_DRAWN === '0' ? [] : TIERS.map(tier => ({
    name: `the ${tier} on the drawn house, the brief and GO, the three bots, seeds 1 and 2, fumbles forced at the net's rate: no dead end, every lane to the card (v0.0.21)`,
    heavy: true,
    timeoutMs: 600_000,
    fn: drawnSweep(tier),
  }))),
  ...TIERS.map(tier => ({
    name: `the ${tier}, every setup, the three bots, fumbles forced at the net's rate: no dead end but v0.0.17's known ones (KNOWN), every lane to the card`,
    heavy: true,
    timeoutMs: 600_000,
    fn: sweep(tier),
  })),
  {
    name: 'F67 (heavy): the hunt\'s findings the net does not reach yet (UNCOVERED), the allow-lists (KNOWN, OPEN): every list empty from v0.0.21, so each sweep above fails on any case at all',
    heavy: true,
    fn() {
      const row = f67({ KNOWN, OPEN, UNCOVERED });
      for (const u of UNCOVERED) console.log(`      ${u.finding}\n        ${u.why}`);
      console.log(`      ${row.id} ${row.met ? 'MET ' : 'OPEN'} ${row.name}: ${row.value}`);
      assert(row.met, row.value);
    },
  },
];
