// wounds-skip: the wounds lived against skipped (src/sim/body/wounds.js, domain.js; BODY §2.6, §17; TIME §5.5; the build
// sheet 0.0.7 §5.2). A thigh wound (7.2 %/min, deep) on the player and a chest wound (3.5 %/min and the inside's
// 0.25) on a squadmate in Echo's bay, lived 20 minutes tick by tick in the game (the fast layer's stance and factor
// each tick, the slow layer each minute), against the same records stepped in one outcome step and in twenty
// one-minute slow steps, and against the game's own outcome skip over the same 20 minutes: the blood, the pain,
// AVPU, and the times of the collapse and of death. Equal within 0.01 % of blood, to the same second. And a save
// made mid-bleed carries on byte for byte.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { MIN_MS, SEC_MS, HOUR_MS, DAY_MS, TICK_MS } from '../src/core/clock.js';
import * as W from '../src/sim/body/wounds.js';
import { copy } from '../src/sim/body/record.js';

const SPAN_MIN = 20, TICKS_MIN = MIN_MS / TICK_MS;
// (the two wounds, made at t0 on the stored records)
function wound(g) {
  const s = g.state, t0 = s.clock.ms, me = s.player.id, mate = s.actors.list.find(a => a.who && a.who !== me && s.people[a.who])?.who;
  const thigh = s.people[me].body, chest = s.people[mate].body;
  Object.assign(thigh, { fitness: 10, blood: 100, bloodMs: t0, parts: { legL: 9.8 },
    injuries: [{ part: 'legL', kind: 'cut', name: 'a gunshot wound in the left thigh', where: 'left thigh', ms: t0, until: t0 + 10 * DAY_MS, bleed: t0 + 6 * HOUR_MS, rate: 7.2, deep: true, gunshot: true }] });
  Object.assign(chest, { fitness: 10, blood: 100, bloodMs: t0, parts: { torso: 11.2 },
    injuries: [{ part: 'torso', kind: 'cut', name: 'a gunshot wound in the chest', where: 'chest', ms: t0, until: t0 + 10 * DAY_MS, bleed: t0 + 6 * HOUR_MS, rate: 3.5, deep: true, gunshot: true },
      { part: 'torso', kind: 'cut', name: 'bleeding inside, from the chest wound', ms: t0, until: t0 + 30 * DAY_MS, bleed: t0 + 3 * HOUR_MS, rate: 0.25, deep: true, gunshot: true, internal: true }] });
  return { t0, me, mate };
}
const facts = (rec, ms) => ({ blood: W.bloodAt(rec, ms), pain: W.painOf(rec, ms), avpu: W.avpuOf(rec, ms) });
const deadSec = (rec) => (rec.dead ? Math.ceil(rec.dead.ms / SEC_MS) : null);

export default [
  {
    name: 'a thigh wound (7.2 %/min) and a chest wound lived 20 minutes tick by tick, stepped in one outcome step, in one-minute slow steps and skipped by the game: the same blood (within 0.01 %), pain and AVPU, the collapse and death at the same second',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: 48213, hour: 10 }), { t0, me, mate } = wound(g);
      const start = { thigh: copy(g.state.people[me].body), chest: copy(g.state.people[mate].body) };
      const ids = { thigh: me, chest: mate };
      // (the closed form's collapse, from the start records: the lived game is looked at the tick before it and the tick of it)
      const collapse = Object.fromEntries(Object.entries(start).map(([k, rec]) => [k, W.bloodCurve(rec, t0 + SPAN_MIN * MIN_MS).collapseMs]));
      const edges = Object.entries(collapse).flatMap(([k, c]) => { const at = Math.floor(c / TICK_MS) * TICK_MS; return [{ k, ms: at, want: 'not U' }, { k, ms: at + TICK_MS, want: 'U' }]; }).sort((a, b) => a.ms - b.ms);
      // (lived: the game at 20 Hz, sampled each minute and at the collapse's edges)
      const lived = { thigh: [], chest: [] }, seen = [];
      const stepTo = (ms) => { const n = Math.round((ms - g.state.clock.ms) / TICK_MS); if (n > 0) g.step(n); };
      const marks = [...Array.from({ length: SPAN_MIN }, (_, i) => ({ ms: t0 + (i + 1) * MIN_MS, minute: i + 1 })), ...edges].sort((a, b) => a.ms - b.ms);
      for (const mk of marks) {
        stepTo(mk.ms);
        if (mk.minute) for (const k of ['thigh', 'chest']) lived[k].push(facts(g.state.people[ids[k]].body, mk.ms));
        else seen.push({ ...mk, avpu: W.avpuOf(g.state.people[ids[mk.k]].body, mk.ms) });
      }
      const deadFacts = g.facts('body-dead');
      // (one step, and twenty one-minute steps, on copies: their events)
      const one = { thigh: copy(start.thigh), chest: copy(start.chest) }, mins = { thigh: copy(start.thigh), chest: copy(start.chest) }, ev = { one: {}, mins: {} };
      for (const k of ['thigh', 'chest']) {
        ev.one[k] = W.stepWounds(one[k], t0, t0 + SPAN_MIN * MIN_MS).events;
        ev.mins[k] = [];
        for (let m = 0; m < SPAN_MIN; m++) ev.mins[k].push(...W.stepWounds(mins[k], t0 + m * MIN_MS, t0 + (m + 1) * MIN_MS).events);
      }
      // (the game's own outcome skip of the same span)
      const h = createGame({ scenario: 'barracks', seed: 48213, hour: 10 }); wound(h);
      let guard = 0;
      while (h.state.clock.ms < t0 + SPAN_MIN * MIN_MS && guard++ < 40) h.skipNow({ activity: 'wait', planMs: t0 + SPAN_MIN * MIN_MS - h.state.clock.ms });
      const skipT = h.state.clock.ms, skipDead = h.facts('body-dead');
      const end = t0 + SPAN_MIN * MIN_MS, bad = [];
      for (const k of ['thigh', 'chest']) {
        const all = { lived: g.state.people[ids[k]].body, oneStep: one[k], minuteSteps: mins[k], gameSkip: h.state.people[ids[k]].body };
        const at = Object.fromEntries(Object.entries(all).map(([w, rec]) => [w, { ...facts(rec, end), dead: deadSec(rec) }]));
        const cOne = ev.one[k].find(e => e.kind === 'collapse')?.atMs, cMin = ev.mins[k].find(e => e.kind === 'collapse')?.atMs;
        const edge = seen.filter(x => x.k === k);
        console.log(`      ${k}: the closed form's collapse at +${fmt((collapse[k] - t0) / SEC_MS, 3)} s; one step's event at +${fmt((cOne - t0) / SEC_MS, 3)} s, the minute steps' at +${fmt((cMin - t0) / SEC_MS, 3)} s; lived ${edge.map(x => `${x.avpu} at +${fmt((x.ms - t0) / SEC_MS, 2)} s`).join(', ')}`);
        for (const [w, f] of Object.entries(at)) console.log(`        ${w.padEnd(12)} at +${SPAN_MIN} min: blood ${fmt(f.blood, 4)}%, pain ${fmt(f.pain, 2)}, ${f.avpu}; dead ${f.dead === null ? 'no' : `at +${f.dead - Math.ceil(t0 / SEC_MS)} s`}`);
        const ref = at.lived;
        for (const [w, f] of Object.entries(at)) if (Math.abs(f.blood - ref.blood) > 0.01 || Math.abs(f.pain - ref.pain) > 1e-9 || f.avpu !== ref.avpu || f.dead !== ref.dead) bad.push({ k, w, f, ref });
        if (cOne !== cMin || cOne !== Math.ceil(collapse[k]) || edge[0].avpu === 'U' || edge[1].avpu !== 'U') bad.push({ k, cOne, cMin, collapse: collapse[k], edge });
        // (minute by minute, lived against the closed form of the start record)
        for (let m = 1; m <= SPAN_MIN; m++) { const f = facts(start[k], t0 + m * MIN_MS), l = lived[k][m - 1]; if (Math.abs(f.blood - l.blood) > 0.01 || f.avpu !== l.avpu) bad.push({ k, m, f, l }); }
      }
      console.log(`      'body-dead' lived: ${deadFacts.map(f => `${f.who === me ? 'you' : f.who} at +${fmt((f.atMs - t0) / SEC_MS, 3)} s`).join(', ')}; skipped: ${skipDead.map(f => `${f.who === me ? 'you' : f.who} at +${fmt((f.atMs - t0) / SEC_MS, 3)} s`).join(', ')}; the game's skip reached +${fmt((skipT - t0) / MIN_MS, 1)} min in ${guard} skip(s)`);
      assert(!bad.length && skipT >= end, JSON.stringify(bad.slice(0, 4)));
      assert(deadFacts.length === 2 && JSON.stringify(deadFacts.map(f => [f.who, f.atMs])) === JSON.stringify(skipDead.map(f => [f.who, f.atMs])), JSON.stringify({ deadFacts, skipDead }));
    },
  },
  {
    name: 'a save made mid-bleed carries on byte for byte: the wounds, the anchor and the drips survive a load',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: 48213, hour: 10 }), { t0, me, mate } = wound(g);
      g.step(2 * TICKS_MIN + 333);
      const mid = g.save();
      g.step(3 * TICKS_MIN);
      const end = g.save();
      const h = createGame({ scenario: 'barracks', seed: 48213, hour: 10 });
      h.load(mid); h.step(3 * TICKS_MIN);
      const rec = JSON.parse(end).people[mate].body, n = (JSON.parse(end).places.sites.melas?.blood ?? []).length;
      console.log(`      saved at +${fmt((JSON.parse(mid).clock.ms - t0) / SEC_MS, 2)} s; at +5 min the squadmate's blood anchor ${rec.blood}% at +${fmt((rec.bloodMs - t0) / SEC_MS, 2)} s, ${n} blood decals; loaded and carried on: ${h.save() === end ? 'byte for byte' : 'DIFFERENT'}`);
      assert(h.save() === end && !g.errors.length && !h.errors.length, JSON.stringify({ errors: g.errors.slice(0, 2) }));
    },
  },
];
