// OLYMPUS tests: the gauges on lanes drawn from all eight rooms (heavy; the build sheet v0.0.22 item 14, §6 A, §8 F76, F77; house lens G3): a hundred eight-room houses, four bots each, the kit's slice and the fuzz, every criterion as on v0.0.21's drawn lanes.
//
// v0.0.21's house-drawn on `rooms: 'all'` (createGame's, the lazy draw: scenes/assemble.js lazyOf): eight-room seeds 1 to DRAWN_SEEDS
// 100 by the honest tier one and sergeant and the keys private and recruit (flawless-rooms.mjs roomsLane), F1 to F26 as on drawn lanes
// (flawless-drawn.mjs drawnGaugeOf: F3 on each lane's own house; F13, F15 and F22 the set's), F63 to F66 against the set played on the
// same seeds, and the rooms' own: F76 (each room within its own par on 90% of its lanes, every lane at most 60 s, the mean within 1.10 ×
// the summed par; printed until the lead's quiet run: the build sheet §8) and F77 (nobody at rest in a no-stop zone of any why but by
// choice; enforced). The second case is the kit on eight-room houses (frag, conc, cut and mixed on ten seeds by the honest kit bot,
// every sheet: F27 to F33 as on the set, flawless-kit.mjs), the third the fuzz on 40 eight-room lanes (F11, F14; F77 printed). It is the
// eight-room draw's gate (the build sheet's ship rule: the picker's "Rooms" row only when it is green on the lead's quiet run); it
// fails on ENFORCED, DRAWN_ENFORCED and ROOMS_ENFORCED as house-drawn does, and on v0.0.21's drawn findings (DRAWN_OPEN) as house-drawn
// does, never a threshold moved.
import { assert } from './helpers.mjs';
import { withHouse } from './game.mjs';
import { flawlessLane, printGauge, failing, mean, s1 } from './flawless.mjs';
import { drawnGaugeOf, f3Drawn, f63, f64, f65, f66, drawnFailing, DRAWN_SEEDS, DRAWN_OPEN } from './flawless-drawn.mjs';
import { roomsLane, f76, f77, roomsFailing, ROOMS_ENFORCED } from './flawless-rooms.mjs';
import { drawnCodeOf } from '../src/sim/scenes/assemble.js';
import { kitLanes, kitGaugeOf, kitFailing, KIT_ENFORCED } from './flawless-kit.mjs';

const BOTS = Object.freeze([['tierone', 'honest'], ['sgt', 'honest'], ['private', 'keys'], ['recruit', 'keys']]);
const seedsOf = (n) => Array.from({ length: n }, (_, i) => i + 1);

export default [
  {
    name: 'a hundred eight-room houses by the honest tier one and sergeant and the keys private and recruit: F1 to F26 as on drawn lanes, F63 to F66 against the set on the same seeds, F76 printed, F77 enforced, every lane to its card; each room\'s means printed',
    heavy: true,
    // (v0.0.25's stage 0: a gate, run on GATES=1 only (tests/run.mjs; the lead's quiet heavy run and the round that switches the
    // drawn or eight-room default), its rows kept in house-done; every other run names it among the gates not run)
    gate: true,
    timeoutMs: 90 * 60_000,
    fn() {
      const seeds = seedsOf(Number(process.env.DRAWN_SEEDS) || DRAWN_SEEDS), drawn = [], set = [];
      for (const seed of seeds) for (const [tier, bot] of BOTS) drawn.push(roomsLane({ tier, seed, bot, setup: 'go', fill: { rooms: 'all' } }));
      for (const seed of seeds) for (const [tier, bot] of [['tierone', 'honest'], ['private', 'keys']]) set.push(flawlessLane({ tier, seed, bot, setup: 'go' }));
      const layouts = new Set(drawn.map(r => r.code.split('|')[0])), byRoom = {};
      for (const r of drawn.filter(x => x.tier === 'tierone')) r.code.split('|')[0].split('.').forEach((p, k) => { (byRoom[p[0]] ??= []).push(r.legS?.[k]); });
      console.log(`      ${drawn.length} eight-room lanes on ${layouts.size} layouts (${seeds.length} seeds), ${set.length} set lanes on the same seeds; the tier one's mean leg by room ${Object.entries(byRoom).map(([l, xs]) => `${l} ${s1(mean(xs.filter(Number.isFinite)))} s`).join(', ')}`);
      for (const [tier, bot] of BOTS) {
        const D = drawn.filter(r => r.tier === tier && r.bot === bot), S = set.filter(r => r.tier === tier && r.bot === bot);
        console.log(`      ${tier} by ${bot}: the lane ${s1(mean(D.map(r => r.laneS).filter(Number.isFinite)))} s${S.length ? `, the set's ${s1(mean(S.map(r => r.laneS).filter(Number.isFinite)))} s` : ''}; ${D.filter(r => !r.done).length} not to the card, ${D.reduce((a, r) => a + (r.stalls ?? 0), 0)} legs stalled`);
      }
      const rows = [...drawnGaugeOf(drawn), f63(set, drawn), f64(set, drawn), f65(drawn), f66(drawn), f76(drawn), f77(drawn)];
      printGauge(`the eight-room gauges over ${drawn.length} lanes (ROOMS_ENFORCED ${[...ROOMS_ENFORCED].join(', ')}; F76 printed)`, rows);
      for (const [id, why] of Object.entries(DRAWN_OPEN)) { const r = rows.find(x => x.id === id); if (r && !r.met) console.log(`      ${id} v0.0.21's drawn finding: ${why}`); }
      assert(drawn.every(r => r.done), `not to the card: ${drawn.filter(r => !r.done).map(r => `${r.tier} ${r.seed} ${r.code}`).join(', ')}`);
      const f = [...failing(rows), ...drawnFailing(rows), ...roomsFailing(rows)];
      assert(!f.length, f.join(' | '));
    },
  },
  {
    name: 'the kit on eight-room houses: frag, conc, cut and mixed on ten seeds by the honest kit bot, every sheet, F1 to F33, every lane to its card',
    heavy: true,
    // (v0.0.25's stage 0: a gate, run on GATES=1 only (tests/run.mjs; the lead's quiet heavy run and the round that switches the
    // drawn or eight-room default), its rows kept in house-done; every other run names it among the gates not run)
    gate: true,
    timeoutMs: 90 * 60_000,
    fn() {
      const recs = withHouse({ draw: 'drawn', rooms: 'all' }, () => kitLanes({ uses: ['frag', 'conc', 'cut', 'mixed'], seeds: seedsOf(10), print: false })).map(r => ({ ...r, code: drawnCodeOf(r.seed, { rooms: 'all' }) }));
      const rows = kitGaugeOf(recs).filter(r => r.id !== 'F13').map(r => (r.id === 'F3' ? f3Drawn(recs) : r));
      printGauge(`the kit on eight-room houses over ${recs.length} lanes (KIT_ENFORCED ${[...KIT_ENFORCED].join(', ')})`, rows);
      assert(recs.every(r => r.done && !r.err), JSON.stringify(recs.filter(r => !r.done || r.err).map(r => [r.tier, r.seed, r.kit, r.err])));
      const f = kitFailing(rows);
      assert(!f.length, f.join(' | '));
    },
  },
  {
    name: 'the fuzz on 40 eight-room houses (four sheets, ten seeds each): never a dead end, every lane to its card (F11, F14); F77 printed',
    heavy: true,
    timeoutMs: 60 * 60_000,
    fn() {
      const recs = [];
      for (const tier of ['recruit', 'private', 'sgt', 'tierone']) for (let seed = 1001; seed <= 1010; seed++) recs.push(roomsLane({ tier, seed, bot: 'fuzz', setup: 'go', fill: { rooms: 'all' } }));
      const rows = drawnGaugeOf(recs).filter(r => r.id === 'F11' || r.id === 'F14');
      printGauge(`the fuzz on ${recs.length} eight-room lanes`, [...rows, f77(recs)]);
      console.log(`      ${recs.map(r => `${r.tier} ${r.seed} ${r.end}`).join(', ')}`);
      assert(recs.every(r => r.done) && rows.every(r => r.met), rows.filter(r => !r.met).map(r => `${r.id}: ${r.value}`).join(' | ') || JSON.stringify(recs.filter(r => !r.done).map(r => [r.tier, r.seed])));
    },
  },
];
