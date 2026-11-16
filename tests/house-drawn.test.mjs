// OLYMPUS tests: the gauges on every drawn lane (heavy; the build sheet v0.0.21 §1 item 17, §6 B, §8 F63 to F66; house lens H8): a hundred houses drawn from their seeds, four bots each, the kit's second slice and the fuzz, every criterion as on the set.
//
// The first case is the sheet's sweep: drawn seeds 1 to DRAWN_SEEDS 100 by the honest tier one and sergeant and the keys private and
// recruit (tests/flawless.mjs flawlessLane on `draw: 'drawn'`, flawless-drawn.mjs drawnLane), F1 to F26 as on the set (drawnGaugeOf:
// F3 judged on each lane's own house; F13, F15 and F22 the set's), and their drawn twins against the set played on the same seeds
// by the same bots: F63 (the tier one's lane), F64 (the keys private's), F65 (stops against the lane's own budget), F66 (room 1 not
// learnt by heart). The second is the kit's slice on drawn houses (frag and cut on 20 seeds by the honest kit bot, every sheet:
// F27 to F33, the frag's intel the drawn turners', the cut's stand-off checked on every door), the third the fuzz on 40 drawn lanes
// (F11: never a dead end). It prints the layouts, each room's time and the four bots' drawn means beside the set's (the ladder's,
// the build sheet §0 item 42: printed, never enforced this round). It fails on ENFORCED and DRAWN_ENFORCED as the set's suites do:
// it is the default's gate (the build sheet's ship rule). On v0.0.21 it is red on DRAWN_OPEN's findings (flawless-drawn.mjs, the
// handoff .run/v021/b.md), each traced there; never a threshold moved.
import { assert } from './helpers.mjs';
import { withHouse } from './game.mjs';
import { flawlessLane, printGauge, failing, mean, s1, ENFORCED } from './flawless.mjs';
import { drawnLane, drawnGaugeOf, f3Drawn, f63, f64, f65, f66, drawnFailing, DRAWN_SEEDS, DRAWN_ENFORCED, DRAWN_OPEN } from './flawless-drawn.mjs';
import { drawnCodeOf } from '../src/sim/scenes/assemble.js';
import { kitLanes, kitGaugeOf, kitFailing, KIT_ENFORCED } from './flawless-kit.mjs';

const BOTS = Object.freeze([['tierone', 'honest'], ['sgt', 'honest'], ['private', 'keys'], ['recruit', 'keys']]);
const seedsOf = (n) => Array.from({ length: n }, (_, i) => i + 1);

export default [
  {
    name: 'a hundred drawn houses by the honest tier one and sergeant and the keys private and recruit: F1 to F26 as on the set (F3 on each lane\'s own house), F63 to F66 against the set on the same seeds, every lane to its card; the ladder\'s drawn means printed',
    heavy: true,
    timeoutMs: 60 * 60_000,
    fn() {
      const seeds = seedsOf(Number(process.env.DRAWN_SEEDS) || DRAWN_SEEDS), drawn = [], set = [];
      for (const seed of seeds) for (const [tier, bot] of BOTS) drawn.push(drawnLane({ tier, seed, bot, setup: 'go', fill: { draw: 'drawn' } }));
      for (const seed of seeds) for (const [tier, bot] of [['tierone', 'honest'], ['private', 'keys']]) set.push(flawlessLane({ tier, seed, bot, setup: 'go' }));
      const layouts = new Set(drawn.map(r => r.code.split('|')[0]));
      console.log(`      ${drawn.length} drawn lanes on ${layouts.size} layouts (${seeds.length} seeds), ${set.length} set lanes on the same seeds`);
      for (const [tier, bot] of BOTS) {
        const D = drawn.filter(r => r.tier === tier && r.bot === bot), rooms = [0, 1, 2, 3].map(k => s1(mean(D.map(r => r.legS?.[k]).filter(Number.isFinite))));
        const S = set.filter(r => r.tier === tier && r.bot === bot);
        console.log(`      ${tier} by ${bot}: the drawn lane ${s1(mean(D.map(r => r.laneS).filter(Number.isFinite)))} s (rooms 1 to 3 and the hall ${rooms.join(', ')} s)${S.length ? `, the set's ${s1(mean(S.map(r => r.laneS).filter(Number.isFinite)))} s` : ''}; ${D.filter(r => !r.done).length} not to the card`);
      }
      const rows = [...drawnGaugeOf(drawn), f63(set, drawn), f64(set, drawn), f65(drawn), f66(drawn)];
      printGauge(`the drawn gauges over ${drawn.length} lanes (ENFORCED: F1 to F26 as on the set; DRAWN_ENFORCED: ${[...DRAWN_ENFORCED].join(', ')})`, rows);
      for (const [id, why] of Object.entries(DRAWN_OPEN)) { const r = rows.find(x => x.id === id); if (r && !r.met) console.log(`      ${id} a drawn finding (the handoff): ${why}`); }
      assert(drawn.every(r => r.done), `not to the card: ${drawn.filter(r => !r.done).map(r => `${r.tier} ${r.seed} ${r.code}`).join(', ')}`);
      const f = [...failing(rows), ...drawnFailing(rows)];
      assert(!f.length, f.join(' | '));
    },
  },
  {
    name: 'the kit\'s second slice on drawn houses: frag and cut on 20 drawn seeds by the honest kit bot, every sheet, F1 to F33 (the frag\'s intel the drawn turners\', every lane door with its stand-off), every lane to its card',
    heavy: true,
    timeoutMs: 60 * 60_000,
    fn() {
      // (F3 on each lane's own house, as the first case's: kitGaugeOf reads the set's grid there (A's finding 4); F13 the set's, its twin F65)
      const recs = withHouse({ draw: 'drawn' }, () => kitLanes({ uses: ['frag', 'cut'], seeds: seedsOf(20), print: false })).map(r => ({ ...r, code: drawnCodeOf(r.seed) }));
      const rows = kitGaugeOf(recs).filter(r => r.id !== 'F13').map(r => (r.id === 'F3' ? f3Drawn(recs) : r));
      printGauge(`the kit on drawn houses over ${recs.length} lanes (ENFORCED: ${[...ENFORCED, ...KIT_ENFORCED].length} criteria)`, rows);
      assert(recs.every(r => r.done && !r.err), JSON.stringify(recs.filter(r => !r.done || r.err).map(r => [r.tier, r.seed, r.kit, r.err])));
      const f = kitFailing(rows);
      assert(!f.length, f.join(' | '));
    },
  },
  {
    name: 'the fuzz on 40 drawn houses (four sheets, ten seeds each): never a dead end, every lane to its card (F11, F14)',
    heavy: true,
    timeoutMs: 60 * 60_000,
    fn() {
      const recs = [];
      for (const tier of ['recruit', 'private', 'sgt', 'tierone']) for (let seed = 1001; seed <= 1010; seed++) recs.push(drawnLane({ tier, seed, bot: 'fuzz', setup: 'go', fill: { draw: 'drawn' } }));
      const rows = drawnGaugeOf(recs).filter(r => r.id === 'F11' || r.id === 'F14');
      printGauge(`the fuzz on ${recs.length} drawn lanes`, rows);
      console.log(`      ${recs.map(r => `${r.tier} ${r.seed} ${r.end}`).join(', ')}`);
      assert(recs.every(r => r.done) && rows.every(r => r.met), rows.filter(r => !r.met).map(r => `${r.id}: ${r.value}`).join(' | ') || JSON.stringify(recs.filter(r => !r.done).map(r => [r.tier, r.seed])));
    },
  },
];
