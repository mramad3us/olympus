// The head rows never silent on test-pairs (src/sim/arms/specials.js shotRows, reachOf; src/sim/scenarios/pairs.js pairsReachM; src/sim/skills/instinct/pairs.js; src/sim/arms/panel.js digitOf; COMBAT §25.6.1): the user's report of 2026-11-07, "am i supposed to aim for the head ? How do I do that ?", on the armoured string a metre back in the 10 m point's box, the coach saying "He's still up!" and the DI "It rang and he is up. Head." over a panel with no head row. Pinned: your own lane's turner counts at your line's nominal distance anywhere in that line's box (a neighbour's at its measured range, unrounded); To the head reaches 25 m and the failure drill 15; whenever he is still up the panel holds To the head (offered and first, or struck with its reason), the DI names its key, and the coach's "Still up!" never stands without it; the DI's other calls (RELOAD, Top up with the short one, Challenge, Hold him, the readiness's and the coach's MAKE READY and LOAD) each with their row, T's act in the panel; a struck head's remedy named with its key; the head's key the same on every page.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { pairsBot, pairsFuzzBot } from './bots/pairs.mjs';
import { stepAct } from './bots/lib.mjs';
import { pairsNow, PAIRS_SHEETS, pairsReachM } from '../src/sim/scenarios/pairs.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { stillUp, shotRows, reachOf, HEAD_MAX_M, FAILURE_MAX_M, HAMMER_MAX_M, PAIR_MAX_M } from '../src/sim/arms/specials.js';
import { digitOf, panelOf } from '../src/sim/arms/panel.js';
import { firedNow, RULES, instinctNow } from '../src/sim/skills/instinct.js';
import { facingOf } from '../src/sim/arms/turners.js';
import { contactNow } from '../src/sim/combat/contact.js';
import { contactOf } from '../src/sim/people/mind.js';
import { PAIRS_COACH } from '../src/data/courses.js';
import { pairsLaneOf } from '../src/data/places/range.js';

const REPORT = 'the user, 2026-11-07: "am i supposed to aim for the head ? How do I do that ?"';
const COACH_UP = new Set(PAIRS_COACH.stillUp);
// (the shooter where he was put: the pairs bot, its walk dropped)
const held = (base) => (st, m, mem) => { const o = base(st, m, mem); return o && (o.mx || o.mz) ? {} : o; };
const paused = (s) => !!contactNow(s)?.last && s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !contactNow(s)?.pending;
const rowsText = (steps, n = 6) => steps.slice(0, n).map(x => `${x.label}${x.off ? ` (${x.off})` : ''}`).join(' | ');
// (the DI's calls and the rows they name: a rule's variant that names a single carries it as ctx.step)
const NEEDS = {
  'pairs-reload': (id) => /^macro:reload:(speed|retain)$/.test(id), 'pairs-short': (id) => id === 'macro:reload:tactical', 'pairs-topup': (id) => id === 'macro:reload:tactical',
  'pairs-unknown': (id) => id === 'contact:challenge', 'pairs-noshoot': (id) => id === 'contact:hold', 'pairs-still-up': (id) => id === 'shot:head',
};
// (variants that name no row: what the panel cannot answer is said as such)
const NO_ROW = new Set(['want', 'lost', 'none', 'dry']);
// (the calls whose act must be in the panel at a choice in the mode (T does it): the readiness and the coach's commands,
// the verifier's sweep of 2026-11-07 ("Empty chamber. Charge it.", "MAKE READY", "Reach for one", "Press check" with no
// such row); 'point' is a walk, no row)
const ACTS = new Set(['pairs-ready', 'pairs-cmd']);

/**
 * One run on test-pairs, checked at every tick of stop motion's choice (see the header): { bad, seen, end }. opts: seed, tier,
 * setup, dx and dz (the shooter moved inside the box, held there), fuzz (the fuzz shooter), full (the whole course, else the
 * setup's string alone).
 */
export function sweep({ seed, tier, setup = null, dx = 0, dz = 0, fuzz = false, full = false, maxTicks = 20 * 60 * 30 }) {
  const g = createGame({ scenario: 'test-pairs', seed, tier, setup }), s = g.state, me = g.me();
  if (dx || dz) { me.x += dx; me.z += dz; me.$px = me.x; me.$pz = me.z; }
  const base = fuzz ? pairsFuzzBot({ seed }) : pairsBot(), bot = dx || dz ? held(base) : base;
  const bad = [], seen = { up: 0, offered: 0, struck: {}, di: 0, coach: 0, rules: {}, paged: 0, hold: 0 };
  const k0 = s.armoury.range.str?.k ?? null;
  let coachSaid = null;
  for (let n = 0; n < maxTicks && !pairsNow(s).end; n++) {
    g.step(1, bot);
    for (const [type, d] of g.bus.events) if (type === 'say' && COACH_UP.has(d.text)) { coachSaid = s.armoury.range.str?.k ?? null; seen.coach++; }
    g.clearFacts();
    const R = s.armoury.range, S = s.stop;
    if (!full && k0 !== null && (R.str?.k !== k0 || R.str?.done)) break;
    if (!S || S.mode !== 'stop' || !(S.phase === 'choose' || S.doing?.kind === 'wait')) continue;
    const steps = stepsOf(s), T = S.pick ? R.turners.find(t => t.key === S.pick) ?? null : null;
    const standing = !!T && facingOf(T, s.clock.ms) >= 0.5 && T.stoppedAtMs === null;
    const head = steps.find(x => x.id === 'shot:head' && x.target === S.pick) ?? null, key = head ? digitOf(steps, head.id) : null;
    const tag = `${tier} seed ${seed}${setup ? ` ${setup}` : ''}${dx || dz ? ` at +${dx}, +${dz}` : ''}${fuzz ? ' (fuzz)' : ''}, string ${R.str?.k}, ${s.clock.ms - s.meta.createdMs} ms`;
    if (standing && stillUp(s, S.pick)) {
      seen.up++;
      if (!head) bad.push(`${tag}: he is still up and the panel has no head row: ${rowsText(steps, 8)}`);
      else if (!key) bad.push(`${tag}: To the head off the panel's first page`);
      else if (head.off && !String(head.off).trim()) bad.push(`${tag}: To the head struck with no words`);
      else if (head.off) seen.struck[head.off] = (seen.struck[head.off] ?? 0) + 1;
      else seen.offered++;
      // (the same key on every page: a player who pressed 0 and then follows "To the head: 1")
      const pages = panelOf(steps).pages;
      for (let p = 1; key && p < pages; p++) { seen.paged++; if (digitOf(steps, head.id, { page: p }) !== key) bad.push(`${tag}: To the head on ${key} on the first page, ${digitOf(steps, head.id, { page: p })} on page ${p + 1}`); }
    }
    // (the coach's "Still up!" this string, on the one he meant: the steel's ring or two torso hits since the turn, standing)
    if (coachSaid !== null && coachSaid === R.str?.k && !R.str.done && standing && T.face !== 'noshoot') {
      const since = R.str.turnedMs, up = T.hits.some(h => h.part === 'torso' && h.ring && !h.through && h.atMs >= since) || T.hits.filter(h => h.part === 'torso' && h.zone && h.atMs >= since).length >= 2;
      if (up && !head) bad.push(`${tag}: the coach's "Still up!" stands and the panel has no head row: ${rowsText(steps, 8)}`);
    }
    const line = instinctNow(s).line;
    if (line?.id === 'pairs-still-up') {
      seen.di++;
      const m = /To the head(?:: | \()(\d)/.exec(line.text ?? '');
      if (!head || !m) bad.push(`${tag}: the DI says "${line.text}", the head row ${head ? `on ${key}` : 'absent'}`);
      else if (m[1] !== key) bad.push(`${tag}: the DI says "${line.text}", the head row is on ${key}`);
    }
    if (S.phase !== 'choose') continue;
    const fired = firedNow(s, s.clock.ms, RULES);
    // (two drills at once: "Challenge" under "To the head" (the verifier, 2026-11-07))
    if (fired.some(l => l.id === 'pairs-still-up') && fired.some(l => l.id === 'pairs-unknown')) bad.push(`${tag}: pairs-unknown's Challenge under pairs-still-up's head`);
    for (const l of fired) {
      const v = l.ctx?.variant ?? null;
      if (ACTS.has(l.id) && v !== 'point') {
        seen.rules[l.id] = (seen.rules[l.id] ?? 0) + 1;
        if (!l.act && !NO_ROW.has(v)) bad.push(`${tag}: ${l.id} (${v}) at a choice with no act (T does nothing): ${rowsText(steps, 8)}`);
        continue;
      }
      if (l.id === 'pairs-noshoot' && v !== 'other') { seen.hold++; if (l.act !== 'stop:contact:hold') bad.push(`${tag}: pairs-noshoot (${v}) with the act ${l.act}`); }
      const need = NEEDS[l.id];
      if (!need || (l.id === 'pairs-noshoot' && v === 'other')) continue;
      seen.rules[l.id] = (seen.rules[l.id] ?? 0) + 1;
      const ok = NO_ROW.has(v) || (l.ctx?.step ? steps.some(x => x.id === l.ctx.step) : v === 'up' ? steps.some(x => x.id === 'up') : steps.some(x => need(x.id)));
      if (!ok) bad.push(`${tag}: ${l.id}${v ? ` (${v})` : ''} calls for a row the panel lacks: ${rowsText(steps, 8)}`);
    }
  }
  return { bad, seen, end: pairsNow(s).end?.phase ?? null };
}
// (runs summed and checked: their breaches thrown, their counts printed)
function sweepAll(runs, what) {
  const all = [], tot = { up: 0, offered: 0, struck: {}, di: 0, coach: 0, rules: {}, paged: 0, hold: 0 };
  for (const r of runs) {
    const o = sweep(r);
    all.push(...o.bad);
    for (const k of ['up', 'offered', 'di', 'coach', 'paged', 'hold']) tot[k] += o.seen[k];
    for (const k of ['struck', 'rules']) for (const [id, v] of Object.entries(o.seen[k])) tot[k][id] = (tot[k][id] ?? 0) + v;
  }
  console.log(`      ${what}: ${runs.length} runs; he was still up at ${tot.up} choices: To the head offered ${tot.offered}, struck ${JSON.stringify(tot.struck)}; the DI's head line ${tot.di} times, the coach's "Still up!" ${tot.coach}; To the head's key checked on ${tot.paged} later pages; the DI's other calls ${Object.entries(tot.rules).map(([k, v]) => `${k} ${v}`).join(', ')}; ${all.length} silent`);
  for (const b of all.slice(0, 6)) console.log(`      ${b}`);
  assert(!all.length, JSON.stringify(all.slice(0, 6)));
  return tot;
}
// (the box positions swept: the point, the box's back corners, its front: the 10 m box is fp.x − 1.4 to + 2.2, fp.z ± 1.0)
const SPOTS = Object.freeze([[0, 0], [-1.35, 0], [-0.6, 0.9], [-1.35, -0.95], [2.1, -0.9]]);

export default [
  {
    name: `the user's report (${REPORT}): the private on the armoured string 1.3 m back in the 10 m point's box (the turner 11.3 m off) is offered To the head first after "He's still up", the DI says "To the head: 1", and the head round puts the plate down`,
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby:3' }), s = g.state, me = g.me(), bot = held(pairsBot());
      me.x -= 1.3; me.$px = me.x;
      const R = s.armoury.range, own = `turner:${R.lane}`, T = R.turners.find(t => t.key === own);
      let at = null, coach = null;
      for (let n = 0; n < 20 * 60 * 2 && !R.str?.done; n++) {
        g.step(1, bot);
        for (const [type, d] of g.bus.events) if (type === 'say' && COACH_UP.has(d.text)) coach = d.text;
        g.clearFacts();
        if (!at && s.stop?.phase === 'choose' && s.stop.pick === own && stillUp(s, own) && instinctNow(s).line?.id === 'pairs-still-up') {
          const steps = stepsOf(s), head = steps.find(x => x.id === 'shot:head');
          at = { dM: Math.hypot(T.x - me.x, T.z - me.z), reach: reachOf(s, s.player.id, { kind: 'turner', key: own, dM: Math.hypot(T.x - me.x, T.z - me.z) }), rows: rowsText(steps), first: steps[0]?.id, off: head?.off ?? null, odds: head?.rounds?.[0]?.odds, key: head ? digitOf(steps, head.id) : null, di: instinctNow(s).line.text, coach,
            pages: panelOf(steps).pages, page2: head ? digitOf(steps, head.id, { page: 1 }) : null, page2rows: panelOf(steps, { page: 1 }).slots.slice(0, 3).map(x => `${x.key} ${x.step.label}`).join(', ') };
        }
      }
      const P = pairsNow(s), str = P.strs.at(-1);
      console.log(`      standing at x ${fmt(me.x, 2)} (the 10 m line 1114.0, the box from 1112.6): the turner ${fmt(at?.dM ?? NaN, 2)} m off, its reach judged at ${at?.reach} m (To the head ${HEAD_MAX_M} m, the failure drill ${FAILURE_MAX_M} m)`);
      console.log(`      the coach "${at?.coach}"; the panel: ${at?.rows}; To the head on ${at?.key} at ${Math.round((at?.odds ?? 0) * 100)}%; the DI "${at?.di}"; the string: ${str?.done}, "${str?.paper}"`);
      console.log(`      the panel's ${at?.pages} pages: To the head on ${at?.page2} on page 2 (${at?.page2rows})`);
      assert(at && at.dM > 10.5 && at.reach === 10 && at.first === 'shot:head' && !at.off && at.key === '1' && /To the head: 1\./.test(at.di) && str?.done === 'stopped' && /HEAD DOWN/.test(str?.paper ?? ''), JSON.stringify({ at, str }));
      assert(at.pages > 1 && at.page2 === '1', JSON.stringify(at));
    },
  },
  {
    name: 'the reach by the line: your own lane\'s turner counts at the line\'s nominal 7 or 10 m anywhere in that line\'s box (the Hammer offered from the back of the 7 m box at 8.4 m measured), a neighbour\'s at its measured range unrounded (out of the Hammer at 7.36 m, which the rounded rule let in), and none off the course',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'sgt', setup: 'standby:1' }), s = g.state, me = g.me();
      for (let n = 0; n < 20 * 60 && !paused(s); n++) g.step(1, held(pairsBot()));
      assert(paused(s), 'never paused');
      const R = s.armoury.range, pid = s.player.id, L = pairsLaneOf(R.lane), own = `turner:${R.lane}`, other = R.str.keys.find(k => k !== own);
      const rowsAt = (x, z, key) => {
        me.x = x; me.z = z; s.stop.pick = key;
        const T = R.turners.find(t => t.key === key), dM = Math.hypot(T.x - x, T.z - z);
        return { dM, reach: pairsReachM(s, key, x, z), offered: shotRows(s, pid).filter(r => !r.off).map(r => r.id.slice(5)) };
      };
      const fp7 = L.points[7].fp, fp10 = L.points[10].fp, lines = [];
      const back7 = rowsAt(fp7.x - 1.4, fp7.z, own), front7 = rowsAt(fp7.x + 2.2, fp7.z, own), back10 = rowsAt(fp10.x - 1.4, fp10.z + 1.0, own), off = rowsAt(fp10.x - 2.0, fp10.z, own);
      // (the neighbour 7.3 m off from inside the 7 m box: under the rounded rule's 7, out of the Hammer by the measure)
      const N = R.turners.find(t => t.key === other), nx = N.x - Math.sqrt(7.3 ** 2 - (N.z - fp7.z) ** 2);
      const nb = rowsAt(nx, fp7.z, other), nbOld = Math.round(nb.dM) <= HAMMER_MAX_M;
      for (const [w, r] of [['own, the back of the 7 m box', back7], ['own, the front of the 7 m box', front7], ['own, the back corner of the 10 m box', back10], ['own, off both boxes', off], [`the neighbour ${other} from x ${fmt(nx, 2)} in the 7 m box`, nb]]) lines.push(`${w}: ${fmt(r.dM, 2)} m measured, reach ${r.reach ?? 'measured'}: ${r.offered.join(', ')}`);
      for (const l of lines) console.log(`      ${l}`);
      console.log(`      the reaches: Pair ${PAIR_MAX_M}, Hammer and Triple ${HAMMER_MAX_M}, the failure drill ${FAILURE_MAX_M}, To the head ${HEAD_MAX_M} m; the neighbour at ${fmt(nb.dM, 2)} m was in the Hammer under the rounded rule: ${nbOld}`);
      assert(back7.reach === 7 && back7.dM > 8 && back7.offered.includes('hammer') && back7.offered.includes('triple') && front7.reach === 7 && back10.reach === 10 && back10.dM > 11
        && off.reach === null && off.dM > 11 && !off.offered.includes('hammer') && nb.reach === null && nb.dM > 7 && nb.dM < 7.5 && nbOld && nx >= fp7.x - 1.4 && nx <= fp7.x + 2.2 && !nb.offered.includes('hammer') && nb.offered.includes('failure'), JSON.stringify(lines));
    },
  },
  {
    name: `never silent (${REPORT}): on the armoured string, every sheet, seeds 48213, 1 and 2, the shooter held at five places in the 10 m box, and the fuzz shooter on six seeds a sheet: whenever the bracketed is still up To the head is in the panel, offered or struck with words, on its first page; the DI's head line names its key; the coach's "Still up!" never stands without it`,
    fn() {
      const runs = [];
      for (const tier of PAIRS_SHEETS) {
        for (const seed of [48213, 1, 2]) for (const [dx, dz] of SPOTS) runs.push({ seed, tier, setup: 'standby:3', dx, dz });
        for (let seed = 1; seed <= 6; seed++) runs.push({ seed, tier, setup: 'standby:3', fuzz: true });
      }
      const tot = sweepAll(runs, 'the armoured string');
      assert(tot.up > 50 && tot.di > 50 && tot.coach > 20, JSON.stringify(tot));
    },
  },
  {
    name: 'never silent, wide: the armoured string on seeds 3 to 10 at the five places, and the fuzz shooter on 60 seeds a sheet',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const runs = [];
      for (const tier of PAIRS_SHEETS) {
        for (let seed = 3; seed <= 10; seed++) for (const [dx, dz] of SPOTS) runs.push({ seed, tier, setup: 'standby:3', dx, dz });
        for (let seed = 7; seed <= 66; seed++) runs.push({ seed, tier, setup: 'standby:3', fuzz: true });
      }
      sweepAll(runs, 'the armoured string, wide');
    },
  },
  {
    name: 'To the head struck, never absent, where it cannot be taken, with its key, its reason and the step that lifts it (with its key) in the DI\'s line, T taking that step: "aim first" and "off safe first" for the private (T aims, takes the safe off), "empty, RELOAD first" on a bolt believed locked (T reloads), "a stoppage" (IMMEDIATE ACTION), "chamber unknown" (Press check), "chamber empty" (MAKE READY, the bolt release or Charge)',
    fn() {
      // (each case from a fresh game at the moment he is still up, its belief set, then a tick with an action in it (the
      // brackets put back on him) so the DI's line settles as it does after any step)
      const look = (what, fix) => {
        const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby:3' }), s = g.state, bot = held(pairsBot()), own = `turner:${s.armoury.range.lane}`;
        for (let n = 0; n < 20 * 60 * 2 && !(s.stop?.phase === 'choose' && stillUp(s, own)); n++) g.step(1, bot);
        assert(stillUp(s, own), 'never still up');
        fix(s, s.items[s.stop.gun]);
        g.step(1, { act: [stepAct(`pick=${own}`, 'normal', null)] });
        const steps = stepsOf(s), head = steps.find(x => x.id === 'shot:head'), line = instinctNow(s).line, l = firedNow(s, s.clock.ms, RULES).find(x => x.id === 'pairs-still-up');
        const lift = l?.ctx?.fix ?? null, liftKey = lift ? digitOf(steps, lift) : null;
        return { what, own, off: head?.off ?? 'ABSENT', key: head ? digitOf(steps, head.id) : null, di: line?.id === 'pairs-still-up' ? line.text : `(${line?.id})`, act: l?.act ?? null, fix: lift, fixKey: liftKey, rows: rowsText(steps, 4) };
      };
      const out = [
        look('not aimed', (s) => { s.stop.aim = null; }),
        look('on safe', (s, gun) => { gun.mode = 'safe'; s.stop.aim = null; }),
        look('the bolt locked on an empty', (s, gun) => { gun.belief = { ...gun.belief, locked: true, count: 0 }; }),
        look('a stoppage felt', (s, gun) => { gun.belief = { ...gun.belief, stoppage: 'click' }; }),
        look('the chamber not known', (s, gun) => { gun.belief = { ...gun.belief, chamber: '?' }; }),
        look('the chamber believed empty', (s, gun) => { gun.belief = { ...gun.belief, chamber: 'empty' }; }),
      ];
      for (const o of out) console.log(`      ${o.what}: To the head (${o.off}) on ${o.key}; the DI "${o.di}", act ${o.act}; ${o.rows}`);
      const [aim, safe, dry, stop, unknown, empty] = out;
      // (the step that lifts the strike named with its key, and T that step)
      for (const o of out) if (o.fix) assert(o.fixKey && o.di.includes(`: ${o.fixKey}.`) && o.act === `stop:${o.fix}${o.fix === 'aim' ? `>${o.own}` : ''}`, JSON.stringify(o));
      assert(unknown.off === 'chamber unknown' && unknown.act === 'stop:pressCheck' && /chamber unknown\. Press check: \d\./.test(unknown.di), JSON.stringify(unknown));
      assert(empty.off === 'chamber empty' && /^stop:(macro:ready|release|charge)$/.test(empty.act ?? '') && /chamber empty\. .+: \d\./.test(empty.di), JSON.stringify(empty));
      assert(aim.off === 'aim first' && aim.act === `stop:aim>${aim.own}` && new RegExp(`To the head \\(${aim.key}\\)(:| is struck:) aim first`).test(aim.di), JSON.stringify(aim));
      assert(safe.off === 'off safe first' && safe.act === 'stop:selector:semi' && /off safe first/.test(safe.di), JSON.stringify(safe));
      assert(dry.off === 'empty, RELOAD first' && /^stop:macro:reload:(speed|retain)$/.test(dry.act ?? '') && /empty, RELOAD first/.test(dry.di), JSON.stringify(dry));
      assert(stop.off === 'a stoppage' && /a stoppage/.test(stop.di) && (stop.act === null || stop.act === 'stop:macro:ia'), JSON.stringify(stop));
    },
  },
  {
    name: 'the DI\'s other calls each with their row (the fix of 2026-11-07, the same rule): over the whole course, the fuzz shooter (never reloading on odd seeds, dropping magazines, slinging the rifle) on two seeds a sheet, RELOAD and Top up with the short one are in the panel whenever the DI calls for them, or the single that gets there is named (seat it, the empty out, the reach, the rifle up); the readiness and the coach\'s MAKE READY and LOAD at a choice always have their act in the panel (the bolt release, Charge, the rifle up), or say "dry" and name no row',
    fn() {
      const runs = [];
      for (const tier of PAIRS_SHEETS) for (const seed of [3101, 3104]) runs.push({ seed, tier, full: true, fuzz: true });
      const tot = sweepAll(runs, 'the course, fuzzed');
      assert((tot.rules['pairs-short'] ?? 0) > 0 && (tot.rules['pairs-reload'] ?? 0) > 0 && (tot.rules['pairs-ready'] ?? 0) > 0 && (tot.rules['pairs-cmd'] ?? 0) > 0, JSON.stringify(tot.rules));
    },
  },
  {
    name: 'Hold him and Challenge on the no-shoot string (string 2, every sheet, seeds 48213, 1 and 2): the no-shoot bracketed at the pause, the DI says "Not him" and names a threat still up (no act: the brackets are the player\'s) with Hold him in the panel, or Challenge (T\'s act) where his hands were not seen; the threats put down, "Hands. No weapon. Don\'t." with Hold him T\'s act',
    fn() {
      const out = [], bad = [];
      for (const tier of PAIRS_SHEETS) for (const seed of [48213, 1, 2]) {
        const g = createGame({ scenario: 'test-pairs', seed, tier, setup: 'standby:2' }), s = g.state, R = s.armoury.range;
        for (let n = 0; n < 20 * 60 && !paused(s); n++) g.step(1, held(pairsBot()));
        if (!paused(s)) { bad.push(`${tier} ${seed}: never paused`); continue; }
        const ns = R.str.keys.find(k => R.turners.find(t => t.key === k).face === 'noshoot');
        g.step(1, { act: [stepAct(`pick=${ns}`, 'normal', null)] });
        const ident = contactNow(s).last.ident?.[ns], steps = stepsOf(s), has = (id) => steps.some(x => x.id === id && !x.off);
        const fired = firedNow(s, s.clock.ms, RULES), l = fired.find(x => x.id === (ident === 'unseen' ? 'pairs-unknown' : 'pairs-noshoot'));
        const up = R.str.keys.filter(k => k !== ns).map(k => R.turners.find(t => t.key === k)).filter(t => facingOf(t, s.clock.ms) >= 0.5 && t.stoppedAtMs === null);
        // (the threats put down by hand, the clock a millisecond on so the DI reads the bay again)
        for (const t of up) t.stoppedAtMs = s.clock.ms;
        const l2 = ident === 'unseen' ? null : firedNow(s, s.clock.ms + 1, RULES).find(x => x.id === 'pairs-noshoot');
        const o = { tier, seed, ident, first: `${l?.id ?? 'none'} (${l?.ctx?.variant ?? '-'}) act ${l?.act ?? null}${l?.ctx?.where ? ` names ${l.ctx.where}` : ''}`, up: up.length, hold: has('contact:hold'), challenge: has('contact:challenge'), then: l2 ? `${l2.ctx.variant} act ${l2.act}` : '-' };
        out.push(o);
        if (ident === 'unseen' ? !(l?.act === 'stop:contact:challenge') : !(l?.ctx?.variant === 'other' && l.act === null && up.length > 0 && o.hold && ['hands', 'phone'].includes(l2?.ctx?.variant) && l2.act === 'stop:contact:hold')) bad.push(JSON.stringify(o));
      }
      for (const o of out) console.log(`      ${o.tier} seed ${o.seed}: his hands ${o.ident}; ${o.first}, ${o.up} threat up; Hold him ${o.hold ? 'in' : 'NOT in'} the panel, Challenge ${o.challenge ? 'in' : 'not in'}; the threats down: ${o.then}`);
      assert(!bad.length && out.some(o => o.then !== '-'), JSON.stringify(bad.slice(0, 4)));
    },
  },
  {
    name: 'the DI\'s other calls each with their row, wide: the pairs bot on four seeds a sheet and the fuzz shooter on sixteen, over the whole course',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const runs = [];
      for (const tier of PAIRS_SHEETS) {
        for (const seed of [48213, 1, 2, 3]) runs.push({ seed, tier, full: true });
        for (let seed = 3101; seed <= 3116; seed++) runs.push({ seed, tier, full: true, fuzz: true });
      }
      sweepAll(runs, 'the course, wide');
    },
  },
  {
    name: 'no Challenge under "To the head" (the verifier, 2026-11-07: "T held: Challenge" under "Still standing. To the head: 1."): his hands not seen at the take-in, once he is still up the DI says To the head and pairs-unknown keeps quiet; at the first pause, nothing fired at him, it still says Challenge',
    fn() {
      const out = [];
      for (const tier of ['recruit', 'private']) {
        // (the first pause, his hands set unseen, nothing fired at him: Challenge, as before)
        const g0 = createGame({ scenario: 'test-pairs', seed: 1, tier, setup: 'standby:3' }), s0 = g0.state;
        for (let n = 0; n < 20 * 60 && !paused(s0); n++) g0.step(1, held(pairsBot()));
        // (the one bracketed at the pause; read without a step: the take-in's record is the eyes' each tick of the pause, so a
        // step would see his hands again)
        contactOf(s0).last.ident[s0.stop.pick] = 'unseen';
        const first = firedNow(s0, s0.clock.ms + 1, RULES).map(l => l.id);
        // (still up after the pair on the plate, his hands set unseen: the first of seeds 1, 2 and 48213 where the pair leaves him up)
        let g = null, s = null, own = null;
        for (const seed of [1, 2, 48213]) {
          g = createGame({ scenario: 'test-pairs', seed, tier, setup: 'standby:3' }); s = g.state; own = `turner:${s.armoury.range.lane}`;
          const bot = held(pairsBot());
          for (let n = 0; n < 20 * 60 * 2 && !s.armoury.range.str?.done && !(s.stop?.phase === 'choose' && stillUp(s, own)); n++) g.step(1, bot);
          if (stillUp(s, own)) break;
        }
        assert(stillUp(s, own), `${tier}: never still up`);
        contactOf(s).last.ident[own] = 'unseen';
        g.step(1, { act: [stepAct(`pick=${own}`, 'normal', null)] });
        const ids = firedNow(s, s.clock.ms, RULES).map(l => l.id), line = instinctNow(s).line;
        out.push({ tier, first, ids, line: line?.text });
        console.log(`      ${tier} seed ${s.meta?.seed ?? '?'}: the first pause, his hands unseen: ${first?.join(', ')}; still up, his hands unseen: ${ids.join(', ')}; the DI "${line?.text}"`);
      }
      for (const o of out) assert(o.first?.includes('pairs-unknown') && o.ids.includes('pairs-still-up') && !o.ids.includes('pairs-unknown') && /To the head/.test(o.line ?? ''), JSON.stringify(o));
    },
  },
  {
    name: 'the pick moved onto the neighbour at a pause leaves no head row on him unless he is still up himself (a bracket, not a call)',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby:1' }), s = g.state;
      for (let n = 0; n < 20 * 60 && !paused(s); n++) g.step(1, held(pairsBot()));
      const R = s.armoury.range, other = R.str.keys.find(k => k !== `turner:${R.lane}`);
      g.step(1, { act: [stepAct(`pick=${other}`, 'normal', null)] });
      const rows = shotRows(s, s.player.id).map(r => r.id);
      console.log(`      the neighbour ${other} bracketed, nothing on him yet: ${rows.join(', ')}`);
      assert(!rows.includes('shot:head') && !stillUp(s, other), JSON.stringify(rows));
    },
  },
];
