// Negligent discharges (src/sim/arms/firearms.js, carry.js ndOf; WEAPONS §5.4, §6.5, §6.6; the build sheet 0.0.5 §5.1): per 10,000 UNLOAD SHOW CLEAR cycles by tier, rested in the light or exhausted with cold hands in the dark, with the observer or alone, re-checking a '?' or never, beside §5.4's table; and the grade by where the muzzle's line goes on the bay.
//
// §5.4's table is printed beside, not held to ±20% as the build sheet asked: it was computed before
// SKILLS §5.1's routine work, by a model the section does not give, and under the rules as built it
// cannot come out. Two things part them: routine work (on the range a private and a sergeant in good
// conditions never fumble, so never fire one; at danger, §5.4's own no-routine case, their naturals
// bite again), and the bad inspection's silence (WEAPONS §5.4: "the one silent failure"), which no
// re-check can catch because the holder sees no '?', so re-checking helps an exhausted recruit in the
// dark far less than §5.4's table assumed. What is held is the model's shape: the observer and the
// re-check each lower the rate, the trained in good conditions on the range never fire one, a careless
// recruit in the dark fires one cycle in a few and the net and the check cut that tenfold, a careful
// sergeant almost never. The numbers it prints are for the lead to put into WEAPONS §5.4.
import { assert, fmt } from './helpers.mjs';
import { armsWorld } from './arms-world.mjs';
import { move } from '../src/sim/arms/kit.js';
import { stream, next } from '../src/core/rng.js';
import { feed, doAction, beliefOf, gunField } from '../src/sim/arms/firearms.js';
import { subsOf } from '../src/sim/arms/drills.js';
import { ndOf } from '../src/sim/arms/carry.js';

const N = Number(process.env.ND_N ?? 10_000);
const PRESSURES = (process.env.ND_PRESSURES ?? 'evaluated,danger').split(',');
// WEAPONS §5.4's table [computed before SKILLS §5.1's routine work]: per 10,000, observer re-checks / observer never / alone re-checks / alone never
const TABLE = {
  'recruit (3), rested, in the light': [0.1, 13, 3, 242],
  'recruit (3), exhausted, cold hands, in the dark': [9, 135, 173, 2723],
  'private (10), rested, in the light': [0, 3, 0.3, 47],
  'private (10), exhausted, cold hands, in the dark': [0.1, 7, 1.4, 146],
  'sergeant (18), rested, in the light': null,
  'sergeant (18), exhausted, cold hands, in the dark': [0, 3, 0.1, 49],
};
const WORN = [{ why: 'exhausted', v: -3, src: 'need:fatigue' }, { why: 'cold hands', v: -2, src: 'body:thermal' }];

// (Condition 1 on safe at low ready on lane 4, the coach at the shoulder)
function world(wh, dark, seed) {
  const W = armsWorld({ wh, dark, seed, awareness: 14 }), g = W.state.items[W.gunId], m = W.state.items[W.magIds[0]];
  move(W.state, W.magIds[0], { gun: W.gunId });
  feed(g, m); g.belief = { chamber: 'live', count: m.n }; delete m.belief;
  return W;
}
// (the gun put back in Condition 1, the magazine back in, for the next cycle; the log kept short)
function reset(W) {
  const { state, gunId, pid } = W, g = state.items[gunId];
  // (the cycle moves only the first magazine: pouched, dropped or left in; it goes back into the gun)
  if (!g.mag) move(state, W.magIds[0], { gun: gunId });
  const m = state.items[g.mag];
  for (const k of ['chamber', 'jam', 'locked', 'set', 'portOpen', 'cocked', 'mode']) delete g[k];
  m.n = 5; feed(g, m); g.belief = { chamber: 'live', count: m.n }; delete m.belief;
  state.people[pid].kit.carry = { posture: 'lowReady' };
  if (state.log.length > 200) state.log.length = 0;
  W.bus.events.length = 0;
}

/**
 * One cycle by a marine who carries on through every halt, re-checking a '?' recheck of the time (on
 * the policy's own stream) or never; a round seen in the chamber is cleared by everyone (charge, lock
 * back, look again); a rifle dropped onto its sling is brought up and the step done again.
 */
function cycle(W, { observer, recheck, mods, pressure, r }) {
  const { state, bus, pid, gunId, coachId } = W;
  const subs = subsOf('clear', beliefOf(state, gunId)).filter(a => observer || a !== 'show');
  const go = (action) => doAction(state, bus, { pid, gunId, action, pressure, mods, observerId: observer ? coachId : null });
  let steps = 0;
  for (let i = 0; i < subs.length && steps < 60; i++) {
    const action = subs[i];
    const res = go(action); steps++;
    if (res.nd) return res.nd;
    if (res.mishap === 'dropped') { go('up'); i--; continue; }
    // (a '?': looked at again, or not)
    for (let k = 0; k < 3 && beliefOf(state, gunId).chamber === '?' && next(r) < recheck; k++) {
      const look = go(beliefOf(state, gunId).locked ? 'inspect' : 'pressCheck'); steps++;
      if (look.nd) return look.nd;
      if (look.mishap === 'dropped') go('up');
    }
    // (a round seen, by the holder's look or the coach's "Hold.": cleared, looked at again and, with the coach there, shown again)
    for (let k = 0; k < 3 && ['live', 'dud', 'case'].includes(beliefOf(state, gunId).chamber) && ['lockBack', 'inspect', 'show'].includes(action); k++) {
      for (const a of observer ? ['charge', 'lockBack', 'inspect', 'show'] : ['charge', 'lockBack', 'inspect']) { const x = go(a); steps++; if (x.nd) return x.nd; if (x.mishap === 'dropped') go('up'); }
    }
  }
  return null;
}

export default [
  {
    name: `negligent discharges per 10,000 UNLOAD SHOW CLEAR cycles (${N.toLocaleString('en-GB')} a cell) by tier and state, with the observer or alone, re-checking a '?' or never: §5.4's table, at the range's pressure (routine work) and at danger (§5.4's own, no routine)`,
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const rows = [], cells = {};
      const t0 = performance.now();
      for (const [row, want] of Object.entries(TABLE)) {
        const wh = Number(/\((\d+)\)/.exec(row)[1]), worn = row.includes('exhausted');
        for (const pressure of PRESSURES) {
          const out = [], grades = {};
          for (const [observer, recheck] of [[true, 0.9], [true, 0], [false, 0.9], [false, 0]]) {
            const W = world(wh, worn, 31 + wh);
            const r = stream('nd-policy', wh, worn ? 1 : 0, observer ? 1 : 0, recheck);
            let nds = 0;
            for (let c = 0; c < N; c++) {
              const nd = cycle(W, { observer, recheck, mods: worn ? WORN : [], pressure, r });
              if (nd) { nds++; grades[nd.grade] = (grades[nd.grade] ?? 0) + 1; }
              reset(W);
            }
            out.push(nds / N * 10_000);
          }
          cells[`${row}|${pressure}`] = out;
          rows.push(`${row.padEnd(50)} ${pressure.padEnd(9)} ${out.map(x => fmt(x, 1).padStart(7)).join('')}   §5.4 ${want ? want.map(x => String(x).padStart(6)).join('') : '     -'}   grades ${Object.entries(grades).map(([g, n]) => `${g} ${n}`).join(', ') || 'none'}`);
        }
      }
      console.log(`      per 10,000: observer re-checks · observer never · alone re-checks · alone never (${fmt((performance.now() - t0) / 1000, 1)} s)`);
      console.log(`      ${rows.join('\n      ')}`);
      // (what the model must hold: checking makes a trained marine safe; the observer is the last net; the trained in good conditions never)
      const get = (row, p) => cells[`${row}|${p}`], slack = 3 * 10_000 / N;           // (three events' worth of chance)
      for (const row of Object.keys(TABLE)) for (const p of PRESSURES) {
        const [or, on, ar, an] = get(row, p);
        assert(or <= on + slack && ar <= an + slack && or <= ar + slack && on <= an + slack, `${row} ${p}: the observer and the re-check each lower it (${get(row, p)})`);
      }
      if (PRESSURES.includes('evaluated')) assert(get('private (10), rested, in the light', 'evaluated').every(x => x === 0) && get('sergeant (18), rested, in the light', 'evaluated').every(x => x === 0), 'the trained in good conditions on the range: never');
      if (PRESSURES.includes('danger')) {
        const worst = get('recruit (3), exhausted, cold hands, in the dark', 'danger');
        assert(worst[3] > 1000 && worst[0] < worst[3] / 10, `a recruit exhausted in the dark alone, never re-checking, fires one cycle in a few; the net and the check cut it tenfold: ${worst}`);
        const sgt = get('sergeant (18), exhausted, cold hands, in the dark', 'danger');
        assert(sgt[0] <= slack && sgt[3] < 100, `a sergeant with the net and the habit almost never; alone and careless, under 1%: ${sgt}`);
      }
    },
  },
  {
    name: 'a discharge\'s grade by where the muzzle\'s line goes on the bay: downrange and the ground ahead ND-1, uprange or across the coach ND-3, never ND-4',
    heavy: true,
    fn() {
      const lines = [];
      const cases = [
        ['aimed downrange', 'aimed', 0, null, 'ND-1'], ['low ready downrange', 'lowReady', 0, null, 'ND-1'], ['high ready downrange (over the berm)', 'highReady', 0, null, null],
        ['low ready, 45° off downrange', 'lowReady', 45, null, 'ND-1'], ['aimed uprange', 'aimed', 180, null, 'ND-3'], ['low ready uprange', 'lowReady', 180, null, 'ND-3'],
        ['aimed across the coach', 'aimed', null, 'coach', 'ND-3'], ['low ready, the coach\'s feet in the cone', 'lowReady', 0, 'feet', 'ND-3'],
      ];
      const seen = new Set();
      for (const [what, posture, deg, who, want] of cases) {
        const W = armsWorld({ wh: 10, posture });
        if (who === 'coach') W.actor.headRad = Math.atan2(W.coachActor.z - W.actor.z, W.coachActor.x - W.actor.x);
        else W.actor.headRad = deg * Math.PI / 180;
        if (who === 'feet') { W.coachActor.x = W.actor.x + 1.2; W.coachActor.z = W.actor.z; }
        const nd = ndOf(W.state, W.pid, W.gunId, { during: 'charge' });
        seen.add(nd.grade);
        lines.push(`${what}: ${nd.grade}, into the ${nd.into} at (${fmt(nd.at.x, 1)}, ${fmt(nd.at.z, 1)})${nd.nearId ? `, past ${nd.nearId}` : ''}`);
        if (want) assert(nd.grade === want, `${what}: ${nd.grade}, want ${want}`);
      }
      // (a spread line: an untrained hand's fumble wanders, a trained one's keeps to the posture's line)
      for (const wh of [0, 10, 28]) {
        const g = {};
        for (let i = 0; i < 400; i++) { const W = armsWorld({ wh, posture: 'aimed', seed: 900 + i }); W.state.clock.ms += i; const nd = ndOf(W.state, W.pid, W.gunId, { during: 'charge' }); g[nd.into] = (g[nd.into] ?? 0) + 1; seen.add(nd.grade); }
        lines.push(`aimed downrange at WH ${wh}, 400 fumbles: ${Object.entries(g).map(([k, v]) => `${k} ${v}`).join(', ')}`);
      }
      console.log(`      ${lines.join('\n      ')}`);
      assert(!seen.has('ND-4') && !seen.has('ND-5'), 'never ND-4 this round');
    },
  },
];
