// OLYMPUS tests: whole lanes on the deriver's plans (heavy; the build sheet v0.0.22 item 12, §6 A; house lens G1): the set with every door's plan derived at the fill (&plans=derived, createGame's `plans: 'derived'`), F1 to F26 as on the authored plans, the authored lanes' figures beside.
//
// The deriver (combat/derive.js) is held to the authored plans field by field by plans-derived (F74); this plays them. Twenty seeds by
// the T sheets (the corporal, the sergeant, the Raider and the tier one, flawless.mjs T_SHEETS, by the honest bot: T and the shot the
// line names) on the set with `plans: 'derived'`, the same seeds and sheets on the authored plans beside: F1 to F26 enforced as on the
// set (flawless.mjs ENFORCED) but F15, F21 and F22, whose absolute figures belong to the authored plans (printed); F11, F13, F15 and F25
// printed beside the authored lanes'. The fuzz on ten derived-plan seeds (F11, F14: never a dead end).
import { assert } from './helpers.mjs';
import { withHouse } from './game.mjs';
import { flawlessLane, gaugeOf, printGauge, ENFORCED, T_SHEETS } from './flawless.mjs';

const SEEDS = Object.freeze(Array.from({ length: 20 }, (_, i) => (i === 0 ? 1489397426 : i === 1 ? 48213 : 1000 + 37 * i)));
/** The gauges whose figures are the authored plans' own (never enforced on the derived: the build sheet §6 A). */
const AUTHORED_ONLY = Object.freeze(['F15', 'F21', 'F22']);

export default [
  {
    name: 'twenty seeds by the T sheets on the derived plans: F1 to F26 as on the set (F15, F21, F22 printed), F11, F13, F15 and F25 beside the authored lanes\' on the same seeds; every lane to its card',
    heavy: true,
    timeoutMs: 90 * 60_000,
    fn() {
      const derived = [], authored = [];
      for (const tier of T_SHEETS) for (const seed of SEEDS) {
        derived.push(flawlessLane({ tier, seed, bot: 'honest', setup: 'go', fill: { plans: 'derived' } }));
        authored.push(flawlessLane({ tier, seed, bot: 'honest', setup: 'go' }));
      }
      const D = gaugeOf(derived), A = gaugeOf(authored);
      printGauge(`the derived plans over ${derived.length} lanes`, D);
      for (const id of ['F11', 'F13', 'F15', 'F25']) { const d = D.find(r => r.id === id), a = A.find(r => r.id === id); console.log(`      ${id} derived ${d?.met ? 'MET ' : 'OPEN'} ${String(d?.value).slice(0, 160)} | authored ${a?.met ? 'MET ' : 'OPEN'} ${String(a?.value).slice(0, 160)}`); }
      assert(derived.every(r => r.done), `not to the card: ${derived.filter(r => !r.done).map(r => `${r.tier} ${r.seed}`).join(', ')}`);
      const f = D.filter(r => ENFORCED.has(r.id) && !AUTHORED_ONLY.includes(r.id) && !r.met).map(r => `${r.id} ${r.name}: ${r.value}`);
      assert(!f.length, f.join(' | '));
    },
  },
  {
    name: 'the fuzz on ten derived-plan seeds (the tier one and the private, five seeds each): never a dead end, every lane to its card (F11, F14)',
    heavy: true,
    timeoutMs: 60 * 60_000,
    fn() {
      const recs = [];
      for (const tier of ['private', 'tierone']) for (let seed = 1001; seed <= 1005; seed++) recs.push(flawlessLane({ tier, seed, bot: 'fuzz', setup: 'go', fill: { plans: 'derived' } }));
      const rows = gaugeOf(recs).filter(r => r.id === 'F11' || r.id === 'F14');
      printGauge(`the fuzz on ${recs.length} derived-plan lanes`, rows);
      assert(recs.every(r => r.done) && rows.every(r => r.met), rows.filter(r => !r.met).map(r => `${r.id}: ${r.value}`).join(' | ') || JSON.stringify(recs.filter(r => !r.done).map(r => [r.tier, r.seed])));
    },
  },
];
