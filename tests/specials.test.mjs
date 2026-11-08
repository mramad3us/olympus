// OLYMPUS tests: the shot rows (src/sim/arms/specials.js; COMBAT §25.6; the build sheet 0.0.8 §2.2, §4, §5.2): their times by sheet, their odds at 7 and 10 m, their parts and holes, where they are offered and where refused.
// The rows play on tests/specials-world.mjs's bay (six turners, the shooter on the 7 m or 10 m line with an exact sheet,
// the real loop): the specials role's own fixture until the scene's test-pairs is merged.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { pairsWorld, refill, SHEETS } from './specials-world.mjs';
import { stepsOf, chooseStep, targetOf, leaveStop } from '../src/sim/arms/shooting.js';
import { contactNow } from '../src/sim/combat/contact.js';
import { rowPlan, ROWS, shotRows, stillUp, HEAD_SHIFT_S, CONTROLLED_CLIMB_K, A_MARGIN } from '../src/sim/arms/specials.js';
import { resolveShot, pullMsOf, aimMsOf, dcOf, modsOf, plaqueOf } from '../src/sim/arms/shot.js';
import { PAPERS } from '../src/sim/arms/paper.js';
import { actionMs } from '../src/sim/arms/firearms.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { oddsOf } from '../src/sim/skills/checks.js';
import { hardOf, suppTimeK } from '../src/sim/combat/supp.js';
// (0.0.9: a person's chaos written so their felt is f at ms: the pool f + their hardening, fresh)
const feltTo = (state, pid, f, ms = state.clock.ms) => { const a = state.actors.list.find(x => x.who === pid); a.combat = { supp: f ? f + hardOf(state, pid, ms) : 0, suppAtMs: ms, suppRate: 2, startleFromMs: null, startleUntilMs: null, blindUntilMs: null, dazzleUntilMs: null, deafUntilMs: null }; };

const s2 = (ms) => (ms === null || ms === undefined ? '-' : (ms / 1000).toFixed(2));
// (the build sheet §4's row-time table, seconds: Fire, Pair and its split, Hammer and its split, Triple, Failure, To the head,
// Off safe, Aim from low ready at 0°, and the climbs on the second round of the Pair and the Hammer; null where the sheet
// prints the gate)
const TABLE = {
  recruit: { fire: 0.47, pair: null, hammer: null, triple: null, failure: null, head: 0.70, safe: 0.52, aim: 1.12, climb: [-1, -2] },
  private: { fire: 0.40, pair: [0.79, 0.40], hammer: null, triple: null, failure: null, head: 0.55, safe: 0.40, aim: 0.87, climb: [-1, -1] },
  cpl: { fire: 0.36, pair: [0.71, 0.36], hammer: [0.57, 0.21], triple: null, failure: 0.82, head: 0.46, safe: 0.34, aim: 0.73, climb: [-1, -1] },
  sgt: { fire: 0.33, pair: [0.67, 0.33], hammer: [0.52, 0.19], triple: 0.71, failure: 0.75, head: 0.41, safe: 0.30, aim: 0.65, climb: [0, -1] },
  raider: { fire: 0.29, pair: [0.57, 0.29], hammer: [0.43, 0.14], triple: 0.57, failure: 0.60, head: 0.31, safe: 0.22, aim: 0.49, climb: [0, 0] },
  tierone: { fire: 0.26, pair: [0.52, 0.26], hammer: [0.38, 0.11], triple: 0.49, failure: 0.51, head: 0.25, safe: 0.18, aim: 0.40, climb: [0, 0] },
};
const ORDER = ['recruit', 'private', 'lcpl', 'cpl', 'sgt', 'recon', 'raider', 'tierone'];
const near = (a, b, tol = 0.01) => Math.abs(a - b) <= tol + 1e-9;
// (a row's split: its second round's start less its first's)
const splitOf = (plan) => { const r = plan.parts.filter(p => p.k === 'round'); return r.length > 1 ? r[1].at - r[0].at : null; };

// (a step chosen and played to its end: the lived ms, the shot facts, the step facts, the clock before)
function play(w, step, tempo = 'normal') {
  const { g, s } = w, n0 = g.facts('shot').length, f0 = g.facts('step').length, t0 = s.clock.ms;
  g.step(1, { act: [stepAct(step, tempo)] });
  for (let n = 0; s.stop?.phase === 'act' && n < 400; n++) g.step(1);
  return { t0, lived: s.clock.ms - t0, shots: g.facts('shot').slice(n0), steps: g.facts('step').slice(f0) };
}
const inBox = ([x, y], [w, h], [cx, cy]) => Math.abs(x - cx) <= w / 2 + 0.05 && Math.abs(y - cy) <= h / 2 + 0.05;
// (a hole in the zone it claims, on the man-target's geometry)
function holeFits(h, zone) {
  const P = PAPERS.man, Z = P.zones;
  if (!zone) return h === null;
  if (zone === 'head') return Math.hypot(h[0] - Z.head.at[0], h[1] - Z.head.at[1]) <= Z.head.r + 0.05;
  if (zone === 'A') return inBox(h, Z.A, P.centres.A);
  return inBox(h, Z.torso, P.centres.torso) && !inBox(h, [Z.A[0] - 0.2, Z.A[1] - 0.2], P.centres.A);
}

export default [
  {
    name: 'each row\'s time by sheet from aimed, to the last round\'s recovery, as the build sheet §4 pins it (±0.01 s): the private\'s Pair 0.79 s on a 0.40 split, the tier one\'s Hammer 0.38 on 0.11; the climb on the second round; Off safe and the aim from low ready',
    fn() {
      const rows = [], bad = [], offSafe = [];
      for (const tier of ORDER) {
        const w = pairsWorld({ tier, lane: 4, turned: [4], aimAt: 4 }), { s, pid, gunId } = w, T = targetOf(s, 'turner:4', pid);
        const plan = (k) => rowPlan(s, pid, ROWS[k].id, T, { atMs: s.clock.ms });
        const P = Object.fromEntries(Object.keys(ROWS).map(k => [k, plan(k)]));
        const S = SHEETS[tier], fire = pullMsOf(s, pid, gunId).ms, safe = actionMs(rollerOf(s, pid), s.items[gunId], 'selector:semi', { tempo: 'normal' });
        s.stop.aim = null; s.people[pid].kit.carry.posture = 'lowReady';
        const aim = aimMsOf(s, pid, gunId, T);
        const gated = (k) => (ROWS[k].gate && S.mrk < ROWS[k].gate ? `(${ROWS[k].gate})` : null);
        const climb = [P.pair.rounds[1].climb, P.hammer.rounds[1].climb];
        rows.push(`${S.label.padEnd(14)} MRK ${String(S.mrk).padStart(2)}, WH ${String(S.wh).padStart(2)} | Fire ${s2(fire)} | Pair ${gated('pair') ?? `${s2(P.pair.ms)}, ${s2(splitOf(P.pair))}`} | Hammer ${gated('hammer') ?? `${s2(P.hammer.ms)}, ${s2(splitOf(P.hammer))}`} | Triple ${gated('triple') ?? s2(P.triple.ms)} | Failure ${gated('failure') ?? s2(P.failure.ms)} | head ${s2(P.head.ms)} | off safe ${s2(safe)} | aim ${s2(aim)} | climb ${climb.join(' / ')}`);
        const E = TABLE[tier];
        if (!E) continue;
        const chk = (what, got, want) => { if (want !== null && !near(got / 1000, want)) bad.push(`${tier} ${what} ${s2(got)} not ${want}`); };
        // (Off safe is firearms.js's built selector, v0.0.5's and pinned by the firearms suite: the sheet's column is 0.4 s ×
        // paceOf, which the built time meets at Weapon handling 10 only; printed against it, not asserted (the specials role's report))
        chk('fire', fire, E.fire); chk('head', P.head.ms, E.head); chk('aim', aim, E.aim);
        if (!near(safe / 1000, E.safe)) offSafe.push(`${tier} ${s2(safe)} (the sheet ${E.safe})`);
        if (E.pair) { chk('pair', P.pair.ms, E.pair[0]); chk('pair split', splitOf(P.pair), E.pair[1]); }
        if (E.hammer) { chk('hammer', P.hammer.ms, E.hammer[0]); chk('hammer split', splitOf(P.hammer), E.hammer[1]); }
        if (E.triple) chk('triple', P.triple.ms, E.triple);
        if (E.failure) chk('failure', P.failure.ms, E.failure);
        if (climb.join() !== E.climb.join()) bad.push(`${tier} climb ${climb.join('/')} not ${E.climb.join('/')}`);
        for (const k of ['pair', 'hammer', 'triple', 'failure']) if ((gated(k) !== null) !== (E[k] === null)) bad.push(`${tier} ${k}'s gate`);
      }
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      (the shift to the head ${HEAD_SHIFT_S} s × pace; the Pair's second ×${CONTROLLED_CLIMB_K} climb; a gated row in brackets)`);
      console.log(`      Off safe as built (firearms.js) where the sheet's 0.4 s × pace differs: ${offSafe.join(', ') || 'none'}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'their odds at 7 and 10 m (planted, lit, the aim fresh): the row\'s figure within 3 points of 4,000 rolls each, torso, its A zone, the head, the Pair\'s and the Hammer\'s second, the failure drill\'s head and the plate down; everyone 95% on the torso but the recruit\'s A (80%) and head (70%), the plate down 50%, 80%, then 95% (the build sheet §4)',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    fn() {
      const N = 4000, out = [], bad = [];
      for (const tier of ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']) for (const line of [7, 10]) {
        const w = pairsWorld({ tier, line, lane: 4, turned: [4], aimAt: 4, faces: { 4: 'armoured' } }), { s, pid, gunId } = w, T = targetOf(s, 'turner:4', pid);
        const mrk = rollerOf(s, pid).value('marksmanship');
        const cases = {
          torso: { part: 'torso' }, head: { part: 'head' }, pair2: { part: 'torso', follow: 1, climbK: CONTROLLED_CLIMB_K }, hammer2: { part: 'torso', follow: 1 }, failure3: { part: 'head', follow: 2, climbK: 0.5 },
        };
        const rate = {}, fig = {};
        for (const [k, c] of Object.entries(cases)) {
          const mods = modsOf(s, pid, { gunId, target: T, part: c.part, follow: c.follow ?? 0, climbK: c.climbK ?? 1, held: { v: 0 } }), dc = dcOf({ rangeM: T.dM, part: c.part }).dc;
          fig[k] = oddsOf(mrk, dc, mods);
          if (k === 'torso') fig.A = oddsOf(mrk, dc + A_MARGIN, mods);
          if (k === 'head') fig.plate = oddsOf(mrk, dc + A_MARGIN, mods);
          let n = 0, hit = 0, a = 0, down = 0;
          for (let i = 0; i < N; i++) {
            refill(s, gunId);
            const { shot } = resolveShot(s, null, { pid, gunId, target: T, part: c.part, follow: c.follow ?? 0, climbK: c.climbK ?? 1, held: { v: 0 }, log: false });
            if (!shot.fired || shot.stoppage) continue;
            n++; if (shot.zone) hit++; if (shot.zone === 'A') a++; if (shot.down) down++;
          }
          rate[k] = hit / n;
          if (k === 'torso') rate.A = a / n;
          if (k === 'head') rate.plate = down / n;
        }
        // (the plaque on the turner says the first round's figure: the same list)
        const pl = plaqueOf(s, pid, { target: T, part: 'torso', gunId }), plH = plaqueOf(s, pid, { target: T, part: 'head', gunId });
        const keys = ['torso', 'A', 'head', 'pair2', 'hammer2', 'failure3', 'plate'];
        out.push(`${SHEETS[tier].label.padEnd(14)} ${line} m | ${keys.map(k => `${k} ${Math.round(fig[k] * 100)}/${fmt(rate[k] * 100, 1)}`).join(' | ')} | plaque ${pl.oddsText} ${plH.part} ${plH.oddsText}`);
        for (const k of keys) if (Math.abs(fig[k] - rate[k]) > 0.03) bad.push(`${tier} ${line} m ${k}: ${fig[k]} against ${rate[k]}`);
        if (Math.abs(pl.odds - fig.torso) > 1e-9 || Math.abs(plH.odds - fig.head) > 1e-9) bad.push(`${tier} plaque ${pl.odds} ${plH.odds}`);
        const want = { recruit: [0.95, 0.80, 0.70, 0.50], private: [0.95, 0.95, 0.95, 0.80] }[tier] ?? [0.95, 0.95, 0.95, 0.95];
        if ([fig.torso, fig.A, fig.head, fig.plate].some((v, i) => Math.abs(v - want[i]) > 1e-9)) bad.push(`${tier} ${line} m: ${[fig.torso, fig.A, fig.head, fig.plate]} not ${want}`);
      }
      console.log('      the row\'s figure / the rate over 4,000 rolls (%), DC 6 torso and 12 head at 7 and 10 m, the SO-4 at 1× +1:');
      for (const r of out) console.log(`      ${r}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'a row\'s rounds are each their own shot record, roll, part, zone and hole, at their formula times (the private\'s Pair split 395 ms, the tier one\'s Hammer 114 ms, to the ms); the step lives its ticks; the failure drill\'s third is a head round, not fired when the target is down after the pair',
    fn() {
      const lines = [], bad = [];
      for (const [tier, row, want] of [['private', 'shot:pair', [150, 545]], ['tierone', 'shot:hammer', [150, 264]], ['sgt', 'shot:triple', [150, 337, 524]], ['cpl', 'shot:failure', [150, 361, 614]]]) {
        const w = pairsWorld({ tier, lane: 4, turned: [4], aimAt: 4 }), plan = rowPlan(w.s, w.pid, row, targetOf(w.s, 'turner:4', w.pid));
        const logs0 = w.s.log.length, r = play(w, row);
        const at = r.shots.map(x => x.atMs - r.t0), rolls = w.s.log.slice(logs0).filter(e => e.kind === 'roll');
        lines.push(`${SHEETS[tier].label} ${row}: plan ${plan.ms} ms, lived ${r.lived}; rounds at +${at.join(', +')} ms; ${r.shots.map(x => `${x.part} ${x.zone ?? 'miss'}${x.hole?.at ? ` (${x.hole.at.join(', ')})` : ''} row ${x.row.i + 1}/${x.row.n}`).join('; ')}; ${rolls.length} rolls (${rolls.map(e => `${e.roll.roll}+${e.roll.value}${e.roll.mods.map(m => (m.v > 0 ? '+' : '') + m.v).join('')} vs ${e.roll.dc}`).join(', ')})`);
        if (at.join() !== want.join()) bad.push(`${row} at ${at} not ${want}`);
        if (r.lived !== Math.ceil(plan.ms / 50) * 50) bad.push(`${row} lived ${r.lived} for ${plan.ms}`);
        if (rolls.length !== want.length || new Set(r.shots.map(x => x.id)).size !== want.length || new Set(rolls.map(e => e.shot)).size !== want.length) bad.push(`${row}: ${rolls.length} rolls`);
        for (const x of r.shots) if (!holeFits(x.hole?.at ?? null, x.zone) || x.row.id !== row) bad.push(`${row} hole ${JSON.stringify(x.hole)} ${x.zone}`);
        if (row === 'shot:failure' && r.shots.map(x => x.part).join() !== 'torso,torso,head') bad.push('the failure drill\'s parts');
      }
      // (the failure drill on a target down after the pair: the scene's sensor stood in for by T.stoppedAtMs at the second round)
      const w = pairsWorld({ tier: 'cpl', lane: 4, turned: [4], aimAt: 4 }), { g, s } = w, n0 = g.facts('shot').length, f0 = g.facts('step').length, t0 = s.clock.ms;
      g.step(1, { act: [stepAct('shot:failure')] });
      for (let n = 0; s.stop?.phase === 'act' && n < 400; n++) {
        const sh = g.facts('shot').slice(n0);
        if (sh.length === 2 && w.T(4).stoppedAtMs === null) w.T(4).stoppedAtMs = sh[1].atMs;
        g.step(1);
      }
      const r = { lived: s.clock.ms - t0, shots: g.facts('shot').slice(n0), steps: g.facts('step').slice(f0) }, cut = r.steps.find(f => f.phase === 'cut' || f.phase === 'end');
      lines.push(`the corporal's failure drill on a target down after the pair: ${r.shots.length} rounds (${r.shots.map(x => x.part).join(', ')}), the step ${cut?.phase} after ${r.lived} ms; the log: "${w.s.log.at(-1).text}"`);
      if (r.shots.length !== 2 || cut?.phase !== 'cut') bad.push(`down after the pair: ${r.shots.length} rounds`);
      for (const l of lines) console.log(`      ${l}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'offered when relevant: Hammer and Triple absent at 10 m; a gated row struck with its gate\'s words after those offered ("Marksmanship 12"); To the head only after "He\'s still up" and first then; the failure drill first where armour was seen; a row refused where not offered or struck; nothing on a turner edge-on or down, nor on the coach',
    fn() {
      const lines = [], bad = [];
      const ids = (rows) => rows.map(r => `${r.id.slice(5)}${r.off ? ` (${r.off})` : ''}${r.first ? ' ◆' : ''}`).join(', ');
      // (at 7 m and 10 m, the sergeant)
      for (const line of [7, 10]) {
        const w = pairsWorld({ tier: 'sgt', line, lane: 4, turned: [4], aimAt: 4 }), r = shotRows(w.s, w.pid);
        lines.push(`the sergeant at ${line} m: ${ids(r)}`);
        if (line === 10 && r.some(x => x.id === 'shot:hammer' || x.id === 'shot:triple')) bad.push('a hammer at 10 m');
        if (line === 7 && !r.some(x => x.id === 'shot:triple')) bad.push('no triple at 7 m');
        if (line === 10) { const c = chooseStep(w.s, w.g.bus, { step: 'shot:hammer' }); lines.push(`  Hammer asked at 10 m: ${c.why}`); if (c.ok || c.why !== 'not offered') bad.push('hammer at 10 m chosen'); }
      }
      // (the private: Hammer, Triple and the failure drill struck "Marksmanship 12"/"18", after the Pair)
      { const w = pairsWorld({ tier: 'private', lane: 4, turned: [4], aimAt: 4 }), r = shotRows(w.s, w.pid); lines.push(`the private, aimed: ${ids(r)}`);
        if (r[0].id !== 'shot:pair' || r[0].off || r.find(x => x.id === 'shot:hammer')?.off !== 'Marksmanship 12' || r.at(-1).off === null) bad.push('the private\'s gates');
        const c = chooseStep(w.s, w.g.bus, { step: 'shot:hammer' }); lines.push(`  Hammer asked: ${c.why}`); if (c.ok || c.why !== 'Marksmanship 12') bad.push('hammer chosen by the private'); }
      // (below rung 2: on safe, struck "off safe first"; not aimed, "aim first"; from rung 2 the aim is in the row)
      { const w = pairsWorld({ tier: 'private', lane: 4, turned: [4], safe: true }), r = shotRows(w.s, w.pid); lines.push(`the private on safe, not aimed: ${ids(r)}`); if (r[0].off !== 'off safe first') bad.push('off safe first'); }
      { const w = pairsWorld({ tier: 'private', lane: 4, turned: [4] }), r = shotRows(w.s, w.pid); lines.push(`the private off safe, not aimed: ${ids(r)}`); if (r[0].off !== 'aim first') bad.push('aim first'); }
      { const w = pairsWorld({ tier: 'cpl', lane: 4, turned: [4], safe: true }), r = shotRows(w.s, w.pid), p = r.find(x => x.id === 'shot:pair');
        lines.push(`the corporal (rung 2) on safe, not aimed: ${ids(r)}; the Pair's parts ${p.parts.map(x => `${x.k} ${x.ms}`).join(', ')}`);
        if (p.off || p.parts[0].k !== 'aim') bad.push('rung 2 aim inside');
        const g = play(w, 'shot:pair'), gun = w.s.items[w.gunId];
        lines.push(`  played: ${g.shots.length} rounds, the first at +${g.shots[0]?.atMs - g.t0} ms (the aim ${p.parts[0].ms} + the press 150), the selector ${gun.mode}, aimed at ${w.s.stop.aim?.key}`);
        if (g.shots.length !== 2 || g.shots[0].atMs - g.t0 !== p.parts[0].ms + 150 || gun.mode !== 'semi' || w.s.stop.aim?.key !== 'turner:4') bad.push('rung 2 played'); }
      // (still up: two torso hits and standing, or a ring on the plate; one torso hit on paper is not it (the design review of
      // v0.0.8: the coach, the DI and the panel all said it after one round); armour seen at the pause)
      { const w = pairsWorld({ tier: 'cpl', lane: 4, turned: [4], aimAt: 4 }), T = w.T(4);
        T.hits = [{ shotId: 'sh0', part: 'torso', zone: 'A', ring: false, through: false }];
        const r1 = shotRows(w.s, w.pid); lines.push(`the corporal, one torso hit on paper (still up: ${stillUp(w.s, 'turner:4')}): ${ids(r1)}`);
        if (stillUp(w.s, 'turner:4') || r1[0].id !== 'shot:pair' || r1.some(x => x.id === 'shot:head')) bad.push('one hit is not still up');
        T.hits = [{ shotId: 'sh0', part: 'torso', zone: 'A', ring: true, through: false }];
        lines.push(`the corporal, one torso round rang on a plate (still up: ${stillUp(w.s, 'turner:4')}): ${ids(shotRows(w.s, w.pid))}`);
        if (!stillUp(w.s, 'turner:4') || shotRows(w.s, w.pid)[0].id !== 'shot:head') bad.push('a ring is still up');
        T.hits = [{ shotId: 'sh0', part: 'torso', zone: 'A', ring: false, through: false }, { shotId: 'sh1', part: 'torso', zone: 'C', ring: false, through: false }];
        const r = shotRows(w.s, w.pid); lines.push(`the corporal, two torso hits on him and still up (${stillUp(w.s, 'turner:4')}): ${ids(r)}`);
        if (r[0].id !== 'shot:head' || !r[0].first || r[1].id !== 'shot:failure') bad.push('still up order');
        T.stoppedAtMs = w.s.clock.ms;
        lines.push(`  and down: ${ids(shotRows(w.s, w.pid)) || 'none'}`);
        if (shotRows(w.s, w.pid).length) bad.push('rows on a target down'); }
      { const w = pairsWorld({ tier: 'cpl', lane: 4, turned: [4], aimAt: 4, faces: { 4: 'armoured' } });
        w.s.mind.contact = { n: 1, known: { 'turner:4': w.s.clock.ms - 600 }, pending: null, last: { id: 1, ids: ['turner:4'], seenMs: w.s.clock.ms - 600, atMs: w.s.clock.ms, ms: 550, expect: 'sector', n: 1, grade: 'pass', parts: [], ident: { 'turner:4': 'rifle' }, armour: { 'turner:4': true } } };
        const r = shotRows(w.s, w.pid); lines.push(`the corporal, armour seen at the pause: ${ids(r)}`);
        if (r[0].id !== 'shot:failure' || !r[0].first || r.some(x => x.id === 'shot:head')) bad.push('armour order'); }
      // (edge-on, and the coach: no rows)
      { const w = pairsWorld({ tier: 'tierone', lane: 4, turned: [], aimAt: 4 }); lines.push(`the tier one at a turner edge-on: ${ids(shotRows(w.s, w.pid)) || 'none'}; in the panel: ${stepsOf(w.s).filter(x => x.kind === 'shot').length} shot rows`);
        if (shotRows(w.s, w.pid).length) bad.push('rows on edge-on'); }
      for (const l of lines) console.log(`      ${l}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'rushed is ×0.6 of the row\'s time and −3 on each round; careful holds the aim to +4 before the press; a turner edge-on or turned away takes its round into the berm, "past the target", and no hole',
    fn() {
      const lines = [], bad = [];
      const w = pairsWorld({ tier: 'sgt', lane: 4, turned: [4], aimAt: 4 }), T = targetOf(w.s, 'turner:4', w.pid);
      const n = rowPlan(w.s, w.pid, 'shot:triple', T), r = rowPlan(w.s, w.pid, 'shot:triple', T, { tempo: 'rushed' }), c = rowPlan(w.s, w.pid, 'shot:triple', T, { tempo: 'careful' });
      lines.push(`the sergeant's Triple: ${n.ms} ms normal, ${r.ms} rushed (×${fmt(r.ms / n.ms, 3)}), ${c.ms} careful (the hold ${c.parts[0].ms} ms first); rushed odds ${r.rounds.map(x => Math.round(x.odds * 100)).join(', ')} against ${n.rounds.map(x => Math.round(x.odds * 100)).join(', ')}`);
      if (Math.abs(r.ms - n.ms * 0.6) > 3 || c.parts[0].k !== 'hold') bad.push('tempo times');
      const g = play(w, 'shot:triple', 'rushed'), rolls = w.s.log.filter(e => e.kind === 'roll').slice(-3);
      lines.push(`  played rushed: ${g.shots.length} rounds at +${g.shots.map(x => x.atMs - g.t0).join(', +')} ms; each roll's tempo: ${rolls.map(e => e.roll.mods.filter(m => m.src === 'tempo').map(m => `${m.v} ${m.why}`).join('') || 'none').join(' | ')}`);
      if (rolls.length !== 3 || !rolls.every(e => e.roll.mods.some(m => m.src === 'tempo' && m.v === -3))) bad.push('rushed −3');
      // (careful: the first round at +4)
      const w2 = pairsWorld({ tier: 'private', lane: 4, turned: [4], aimAt: 4 }), g2 = play(w2, 'shot:pair', 'careful'), roll2 = w2.s.log.filter(e => e.kind === 'roll').slice(-2);
      lines.push(`the private's Pair held: ${g2.lived} ms lived; the rounds' held aim ${roll2.map(e => e.roll.mods.find(m => m.why === 'the aim held')?.v ?? 0).join(' and ')}`);
      if (roll2[0].roll.mods.find(m => m.why === 'the aim held')?.v !== 4) bad.push('careful +4');
      // (edge-on and turned away: past the target)
      for (const [what, set] of [['edge-on', (t) => { t.turnAtMs = null; }], ['down, turned away', (t) => { t.stoppedAtMs = w.s.clock.ms - 2000; t.awayAtMs = w.s.clock.ms - 1500; }]]) {
        const w3 = pairsWorld({ tier: 'private', lane: 4, turned: [4], aimAt: 4 });
        set(w3.T(4));
        refill(w3.s, w3.gunId);
        const T3 = targetOf(w3.s, 'turner:4', w3.pid), { shot } = resolveShot(w3.s, null, { pid: w3.pid, gunId: w3.gunId, target: T3, held: { v: 4 } });
        lines.push(`a round at a turner ${what} (facing ${fmt(T3.facingK, 2)}): roll ${shot.roll.ok ? 'passed' : 'failed'}, hole ${JSON.stringify(shot.hole)}, zone ${shot.zone}, "${shot.roll.verb}"`);
        if (shot.hole.at !== null || shot.zone !== null || !/past the target/.test(shot.roll.verb)) bad.push(`${what} took a hole`);
      }
      for (const l of lines) console.log(`      ${l}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'at a contact\'s pause (react\'s contact.js on a turner turned while you wait out of stop motion at low ready) the panel leads with the shot rows, then Fire and the aim, then the contact\'s, then the rows struck by their gate; the private aims, then pairs, the tier one pairs with the aim inside the row; no first round earlier than the sighting + 0.15 s + the aim (COMBAT §25.4.4\'s body floor)',
    fn() {
      const lines = [], bad = [];
      for (const tier of ['recruit', 'private', 'cpl', 'tierone']) {
        const w = pairsWorld({ tier, lane: 4 }), { g, s } = w;
        leaveStop(s, g.bus, 'scene'); delete w.R.end;
        const t0 = s.clock.ms;
        w.T(4).turnAtMs = t0 + 200;
        for (let n = 0; s.stop?.mode !== 'stop' && n < 400; n++) g.step(1);
        const c = contactNow(s)?.last, panel = stepsOf(s), at = (id) => panel.findIndex(r => r.id === id);
        const order = `${panel.slice(0, 7).map(r => `${r.id}${r.off ? ` (${r.off})` : ''}`).join(', ')}`;
        if (s.stop?.via !== 'contact' || !c) { bad.push(`${tier}: no pause`); continue; }
        const pairGated = panel.find(r => r.id === 'shot:pair')?.off === 'Marksmanship 8';
        if (!(pairGated ? at('fire') < at('contact:hold') && at('contact:hold') < at('shot:pair') : at('shot:pair') < at('fire') && at('fire') < at('contact:hold'))) bad.push(`${tier} order: ${order}`);
        const pair = panel.find(r => r.id === 'shot:pair'), aimFirst = pair.off === 'aim first';
        let aimMs = 0;
        if (aimFirst) { const t = s.clock.ms; g.step(1, { act: [stepAct('aim')] }); for (let n = 0; s.stop.phase === 'act' && n < 200; n++) g.step(1); aimMs = s.clock.ms - t; }
        else aimMs = pair.parts.find(p => p.k === 'aim')?.ms ?? 0;
        if (pair.off && !aimFirst) {
          lines.push(`${SHEETS[tier].label}: paused at the turn + ${s.clock.ms - t0} ms (taken in ${c.ms} ms); ${order}; the Pair struck (${pair.off})`);
          continue;
        }
        const n0 = g.facts('shot').length;
        g.step(1, { act: [stepAct('shot:pair')] }); for (let n = 0; s.stop.phase === 'act' && n < 200; n++) g.step(1);
        const shots = g.facts('shot').slice(n0), first = shots[0]?.atMs - c.seenMs;
        lines.push(`${SHEETS[tier].label}: taken in ${c.ms} ms (${c.expect}); ${order}; ${aimFirst ? `Aim ${aimMs} ms, then ` : ''}the Pair: the first round ${first} ms after the sighting (the floor ${c.ms + 150 + aimMs}), ${shots.map(x => x.zone ?? 'miss').join(', ')}`);
        if (shots.length !== 2 || first < 150 + aimMs + c.ms) bad.push(`${tier}: ${shots.length} rounds, the first at ${first}`);
      }
      for (const l of lines) console.log(`      ${l}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'a save made in the middle of a row (after its first round, before its last) loads and carries the row on to the same end, byte for byte (TECH §13.1: the row\'s plan and its held aim are plain data on the step)',
    fn() {
      const lines = [], bad = [];
      for (const [tier, row] of [['sgt', 'shot:triple'], ['cpl', 'shot:failure']]) {
        const w = pairsWorld({ tier, lane: 4, turned: [4], aimAt: 4 }), { g, s } = w, n0 = g.facts('shot').length, t0 = s.clock.ms;
        g.step(1, { act: [stepAct(row)] });
        let json = null;
        for (let n = 0; s.stop.phase === 'act' && n < 200; n++) { if (!json && g.facts('shot').length - n0 === 1) json = g.save(); g.step(1); }
        g.step(20);
        const end = g.save(), b = createGame({ scenario: 'test-handling', seed: 48213, hour: 11, setup: 'bench' });
        b.load(json);
        for (let n = 0; b.state.stop.phase === 'act' && n < 200; n++) b.step(1);
        b.step(20);
        const same = b.save() === end;
        lines.push(`${SHEETS[tier].label}'s ${row}: saved after round 1, ${JSON.parse(json).clock.ms - t0} ms into the row; loaded and carried on ${same ? 'byte for byte' : 'DIFFERENT'}`);
        if (!same) bad.push(row);
      }
      for (const l of lines) console.log(`      ${l}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'a magazine believed out leaves only the chambered round: Pair is struck "one left" and Fire stays offered (the code review of v0.0.8: with the magazine out the Pair was offered unstruck and fired one round)',
    fn() {
      const w = pairsWorld({ tier: 'private', lane: 4, turned: [4], aimAt: 4 });
      const before = shotRows(w.s, w.pid).find(r => r.id === 'shot:pair');
      const g = play(w, 'magOut:pouch'), b = w.s.items[w.gunId];
      const rows = shotRows(w.s, w.pid), pair = rows.find(r => r.id === 'shot:pair'), fire = stepsOf(w.s).find(x => x.id === 'fire');
      console.log(`      before: Pair ${before?.off ?? 'offered'}; magOut:pouch (${g.steps.map(x => x.phase).join(', ')}), the gun's magazine ${b.mag ?? 'out'}: Pair ${pair?.off ?? 'offered'}, Fire ${fire?.off ?? 'offered'}`);
      assert(before && !before.off, 'the Pair offered with the magazine in');
      assert(!b.mag && pair?.off === 'one left' && fire && !fire.off, JSON.stringify({ mag: b.mag, pair: pair?.off ?? null, fire: fire?.off ?? null }));
    },
  },
  {
    name: '0.0.9: a row\'s parts are × timeK at the row\'s start (COMBAT §25.18.1): the sergeant\'s Pair and failure drill at felt 0 and 60 (×1.30), the calm figures unchanged, each part within a millisecond of calm × the factor, the odds the roll\'s with the chaos\'s entry',
    fn() {
      const lines = [], bad = [];
      for (const id of [ROWS.pair.id, ROWS.failure.id]) {
        const plans = [0, 60].map(f => { const w = pairsWorld({ tier: 'sgt', aimAt: 4, turned: [4] }); feltTo(w.s, w.pid, f); const T = targetOf(w.s, w.key(4), w.pid); return rowPlan(w.s, w.pid, id, T); });
        const k = suppTimeK(60);
        plans[0].parts.forEach((p, i) => { const q = plans[1].parts[i]; if (Math.abs(q.ms - Math.round(p.ms * k)) > 1) bad.push({ id, k: p.k, calm: p.ms, felt: q.ms }); });
        lines.push(`${id}: ${plans[0].ms} → ${plans[1].ms} ms (${plans[0].parts.map((p, i) => `${p.k} ${p.ms}→${plans[1].parts[i].ms}`).join(', ')}); first round ${Math.round(plans[0].rounds[0].odds * 100)}% → ${Math.round(plans[1].rounds[0].odds * 100)}%`);
      }
      for (const l of lines) console.log(`      the sergeant (felt 0 → 60, ×${suppTimeK(60)}): ${l}`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
];
