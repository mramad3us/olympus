// OLYMPUS tests: the reloads by their purpose (src/sim/arms/specials.js reloadRows; COMBAT §25.6.5; WEAPONS §5.3; the build sheet 0.0.8 §2.2, §4, §5.2, §8 items 17 and 18): what each state offers and in what order, every round accounted for, the times by Weapon handling, nothing done unasked.
// On tests/specials-world.mjs's bay (the specials role's fixture): the R-7 on one magazine of 15 and the familiarisation
// issue's three magazines of five in the chest pouches (1: two, 2: one), the dump pouch empty.
import { assert, fmt } from './helpers.mjs';
import { stepAct } from './bots/lib.mjs';
import { pairsWorld, SHEETS } from './specials-world.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { reloadRows, halfOrLess } from '../src/sim/arms/specials.js';
import { beliefOf } from '../src/sim/arms/firearms.js';
import { macroMs } from '../src/sim/arms/drills.js';
import { pouchesOf, atFeetOf, handMagOf, discard } from '../src/sim/arms/kit.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { roundsLeft } from '../src/sim/scenarios/handling.js';
import { hardOf, suppTimeK } from '../src/sim/combat/supp.js';
// (0.0.9: a person's chaos written so their felt is f at ms: the pool f + their hardening, fresh)
const feltTo = (state, pid, f, ms = state.clock.ms) => { const a = state.actors.list.find(x => x.who === pid); a.combat = { supp: f ? f + hardOf(state, pid, ms) : 0, suppAtMs: ms, suppRate: 2, startleFromMs: null, startleUntilMs: null, blindUntilMs: null, dazzleUntilMs: null, deafUntilMs: null }; };

// (the gun put in a state: its magazine's count n (0 with the bolt locked back on the empty), the belief the holder has)
function gunState(w, { n, locked = false, approx = false }) {
  const gun = w.s.items[w.gunId], mag = w.s.items[gun.mag];
  mag.n = n;
  Object.assign(gun, locked ? { chamber: null, locked: true } : { chamber: 'live', locked: false });
  gun.belief = locked ? { chamber: 'empty', count: 0, locked: true } : { chamber: 'live', count: n, ...(approx ? { countApprox: true } : {}) };
  return gun;
}
// (every round the shooter has, the truth: the chamber, the magazine in, the hand's, the pouches', the feet's)
const rounds = (w) => roundsLeft(w.s, w.pid);
const where = (w) => {
  const gun = w.s.items[w.gunId], m = (id) => w.s.items[id]?.n ?? 0, h = handMagOf(w.s, w.pid);
  return `gun ${gun.chamber === 'live' ? 1 : 0}+${gun.mag ? m(gun.mag) : '-'}${gun.locked ? ' locked' : ''} · hand ${h ? m(h.id) : '-'} · ${pouchesOf(w.s, w.pid).map(p => `${p.key} [${p.mags.map(m).join(',')}]`).join(' ')} · feet [${atFeetOf(w.s, w.pid).map(l => m(l.id)).join(',')}]`;
};
const rowsWords = (rows) => rows.map(r => `${r.label}${r.first ? ' ◆' : ''} ${fmt(r.ms / 1000, 2)} s`).join(' | ');
function play(w, step) {
  const { g, s } = w, f0 = g.facts('step').length, t0 = s.clock.ms;
  g.step(1, { act: [stepAct(step)] });
  for (let n = 0; s.stop?.phase === 'act' && n < 600; n++) g.step(1);
  return { lived: s.clock.ms - t0, steps: g.facts('step').slice(f0) };
}

export default [
  {
    name: 'each state offers the reloads by purpose, the first by the situation first (RELOAD on a bolt believed locked on an empty, Top up in a lull at half or less with a fuller one at hand, RELOAD, keep the empty), no id renamed; each run accounts for every round',
    fn() {
      const lines = [], bad = [];
      const cases = [
        ['locked on empty, spares', { turned: [] }, { n: 0, locked: true }, ['RELOAD', 'RELOAD, keep the empty'], 'RELOAD'],
        ['3 of 30 in a lull', { turned: [] }, { n: 3 }, ['Top up'], 'Top up'],
        ['3 of 30, no lull (a target facing)', { turned: [4] }, { n: 3 }, ['Top up'], null],
        ['full (30)', { turned: [] }, { n: 30 }, ['Top up'], null],
        ['5 of 30, nothing fuller at hand', { turned: [] }, { n: 5 }, ['Top up'], null],
        ['no spare', { turned: [], noSpare: true }, { n: 3 }, [], null],
        ['the coach names the 2-round magazine', { turned: [], want: true }, { n: 3 }, ['Top up: the two-round magazine, chest pouch 2'], 'Top up: the two-round magazine, chest pouch 2'],
      ];
      for (const [what, o, gs, want, first] of cases) {
        const w = pairsWorld({ tier: 'private', lane: 4, turned: o.turned, aimAt: 4 });
        if (o.noSpare) for (const p of pouchesOf(w.s, w.pid)) for (const id of p.mags) discard(w.s, id);
        if (o.want) { const p2 = pouchesOf(w.s, w.pid).find(p => p.key === 'p2'); w.s.items[p2.mags[0]].n = 2; w.s.items[p2.mags[0]].belief = { n: 2, kind: 'ball' }; w.R.wantMag = p2.mags[0]; }
        gunState(w, gs);
        const rows = reloadRows(w.s, w.pid), b = beliefOf(w.s, w.gunId), panel = stepsOf(w.s).filter(r => r.macro?.startsWith('reload:'));
        lines.push(`${what.padEnd(40)} ${rowsWords(rows) || 'none'}${rows.some(r => r.queue) ? ` (its queue: ${rows.find(r => r.queue).queue.join(', ')})` : ''}; half or less ${halfOrLess(b)}`);
        if (rows.map(r => r.label).join() !== want.join()) bad.push(`${what}: ${rows.map(r => r.label)}`);
        if ((rows.find(r => r.first)?.label ?? null) !== first) bad.push(`${what}: first ${rows.find(r => r.first)?.label}`);
        if (panel.map(r => r.id).join() !== rows.map(r => r.id).join()) bad.push(`${what}: the panel's reloads ${panel.map(r => r.id)}`);
        if (rows.some(r => !['macro:reload:speed', 'macro:reload:tactical', 'macro:reload:retain'].includes(r.id) || r.kind !== 'command')) bad.push(`${what}: an id`);
        // (each one played: every round where it was, before and after)
        for (const r of rows) {
          const w2 = pairsWorld({ tier: 'private', lane: 4, turned: o.turned, aimAt: 4 });
          if (o.want) { const p2 = pouchesOf(w2.s, w2.pid).find(p => p.key === 'p2'); w2.s.items[p2.mags[0]].n = 2; w2.s.items[p2.mags[0]].belief = { n: 2, kind: 'ball' }; w2.R.wantMag = p2.mags[0]; }
          gunState(w2, gs);
          const n0 = rounds(w2), before = where(w2), p = play(w2, r.id), n1 = rounds(w2), gun = w2.s.items[w2.gunId];
          const seated = gun.mag ? w2.s.items[gun.mag].n : null;
          lines.push(`    ${r.label}: ${before} → ${where(w2)}; ${n0} rounds before, ${n1} after; ${p.steps.filter(f => f.phase === 'sub').map(f => f.action).join(', ')} (${p.lived} ms)`);
          if (n0 !== n1) bad.push(`${what} ${r.label}: ${n0} → ${n1} rounds`);
          if (o.want && seated !== 2) bad.push(`${what}: seated ${seated}, not the named two`);
        }
      }
      for (const l of lines) console.log(`      ${l}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'the reloads\' times by Weapon handling as the build sheet §4 pins them (±0.02 s): RELOAD 3.27 / 2.53 / 2.13 / 1.89 / 1.45 / 1.15 s and RELOAD, keep the empty 3.86 / 2.99 / 2.52 / 2.24 / 1.71 / 1.36 at 4, 10, 15, 19, 30 and 42; Top up as built',
    fn() {
      const WANT = { speed: [3.27, 2.53, 2.13, 1.89, 1.45, 1.15], retain: [3.86, 2.99, 2.52, 2.24, 1.71, 1.36] }, WH = [4, 10, 15, 19, 30, 42], got = { speed: [], retain: [], tactical: [] }, bad = [];
      for (const wh of WH) {
        const sheet = { 4: SHEETS.recruit, 10: SHEETS.private, 15: SHEETS.cpl, 19: SHEETS.sgt, 30: { wf: 60, mrk: 30, wh: 30, awr: 19, rung: 4 }, 42: SHEETS.tierone }[wh];
        const w = pairsWorld({ sheet, lane: 4, aimAt: 4 });
        const gun = gunState(w, { n: 0, locked: true }), r = rollerOf(w.s, w.pid), b = beliefOf(w.s, w.gunId);
        if (r.value('weapons') !== wh) bad.push(`WH ${r.value('weapons')} not ${wh}`);
        got.speed.push(macroMs(r, gun, 'reload:speed', b) / 1000); got.retain.push(macroMs(r, gun, 'reload:retain', b) / 1000);
        gunState(w, { n: 3 });
        got.tactical.push(macroMs(r, gun, 'reload:tactical', beliefOf(w.s, w.gunId)) / 1000);
      }
      for (const k of ['speed', 'retain', 'tactical']) console.log(`      ${{ speed: 'RELOAD', retain: 'RELOAD, keep the empty', tactical: 'Top up' }[k].padEnd(23)} at WH ${WH.join(' / ')}: ${got[k].map(v => v.toFixed(2)).join(' / ')} s`);
      for (const k of ['speed', 'retain']) got[k].forEach((v, i) => { if (Math.abs(v - WANT[k][i]) > 0.02) bad.push(`${k} at ${WH[i]}: ${v} not ${WANT[k][i]}`); });
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'nothing is done unasked: a bolt locked on an empty with spares in reach stays so, in the mode for 30 s held and out of it for 10 s lived; a reload only by its row (COMBAT §25.0: "never reloads unasked")',
    fn() {
      const w = pairsWorld({ tier: 'tierone', lane: 4, aimAt: 4 }), { g, s } = w;
      gunState(w, { n: 0, locked: true });
      const f0 = g.facts('step').length, n0 = rounds(w);
      g.step(600);
      g.step(1, { act: ['shoot'] });
      g.step(200);
      const steps = g.facts('step').slice(f0), gun = s.items[w.gunId];
      console.log(`      ${steps.length} step facts in 800 ticks (${[...new Set(steps.map(f => f.action))].join(', ') || 'none'}); the bolt ${gun.locked ? 'still locked back' : 'FORWARD'}, the magazine in ${s.items[gun.mag]?.n}; rounds ${n0} → ${rounds(w)}; the mode ${s.stop ? s.stop.mode : 'left'}`);
      assert(!steps.some(f => ['reach', 'seat', 'magOut:drop', 'magOut:dump', 'magOut:pouch', 'release'].includes(f.action)) && gun.locked && rounds(w) === n0, JSON.stringify(steps.map(f => f.action)));
    },
  },
  {
    name: '0.0.9: the reloads by purpose take × timeK (COMBAT §5.3): the private\'s RELOAD, Top up and keep-the-empty rows at felt 0 and 98, each within a few milliseconds of calm × 1.49, the calm figures unchanged',
    fn() {
      const res = {};
      for (const f of [0, 98]) {
        const w = pairsWorld({ tier: 'private', turned: [] });
        const gun = w.s.items[w.gunId];
        gun.locked = true; gun.chamber = null; w.s.items[gun.mag].n = 0; gun.belief = { chamber: 'empty', locked: true, count: 0, mag: 'in' };
        feltTo(w.s, w.pid, f);
        res[f] = reloadRows(w.s, w.pid).map(r => ({ id: r.id, ms: r.ms }));
      }
      const k = suppTimeK(98), pairs = res[0].map((r, i) => ({ id: r.id, calm: r.ms, felt: res[98][i]?.ms }));
      console.log(`      ×${k}: ${pairs.map(p => `${p.id} ${p.calm} → ${p.felt} ms (× ${fmt(p.felt / p.calm, 3)})`).join('; ')}`);
      assert(pairs.length && pairs.every(p => Math.abs(p.felt - p.calm * k) <= 6), JSON.stringify(pairs));
    },
  },
];
