// OLYMPUS tests: the void's beats on the drill's engine (v0.0.25, "Hold to hold"; its build sheet §1 B, §3.2, §6 B; COMBAT §25.3's `void` family; PL§6).
//
// Held, each printed:
//   1. drills/void.js VOID_DRILL in ENTER_AND_CLEAR's shape: every beat's kind registered with the stepper and its channel one of
//      CHANNELS, every row's id, family 'void', group, slot, rung and label, every beat a row names a beat of one catalogue or the
//      other (bundle.js beatDefOf), and the catalogue by rung (VOID_MUSCLE) the rows' labels at a dogged deck hatch;
//   2. nothing moves on the house: every house row's defOf is its bundleDef, every house beat's beatDefOf its own, no void beat in
//      the house's 'all-but-breach', and bundle.js hatchBeats leaves every house row's beats as they are at house 1's doors;
//   3. the recruit's sum and the operator's flow from one list (stepper.js flowOf): the deck hatch's beats for #1 laid out dry at
//      rung 0 (one at a time, their sum) and at rung 4 (the hands and the eyes over the feet), the void's beats on the channels;
//   4. the rows' times by sheet: the dogs 1.5 s and the lift 0.5 s (no roll), the transit 1.0 s × the Zero-g pace (1.04 s for the
//      sergeant at Zero-g 9; the sheet's 1.3 s was the lens's arithmetic), the face change 1.5 s from boots and 1.2 s from a hold, the coaming 0.6 s;
//   5. 'undog' unlocks through op.js breakOpening and bundle.js lockedOf reads it open (house 1's closet, a locked door, off the range).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { cqbWorld } from './cqb-world.mjs';
import { VOID_DRILL, VOID_BUNDLES, VOID_MUSCLE, VOID_BEATS, UNDOG_MS, OPEN_HATCH_MS, THROUGH_MS, COAMING_MS, faceMsOf } from '../src/sim/combat/drills/void.js';
import { ENTER_AND_CLEAR, BUNDLES, bundleDef, beatsOf } from '../src/sim/combat/drills/enter-and-clear.js';
import { defOf, beatDefOf, hatchBeats, lockedOf, planOf, laneOf, throughMsOf, voidLabel } from '../src/sim/combat/bundle.js';
import { kindOf, CHANNELS, advanceBeats } from '../src/sim/combat/stepper.js';
import { areaOf } from '../src/sim/places/model.js';
import { brokenOf } from '../src/sim/combat/op.js';
import { valueOf } from '../src/sim/skills/templates.js';
import { paceOf } from '../src/sim/skills/skills.js';

const TIERS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);
const GROUPS = Object.freeze(['stack', 'door', 'room', 'shot', 'weapon', 'team', 'body']);

// (a doing of beats laid out dry by the stepper at a rung: its time, ms (bundle.js simulate's way))
function dryRun(beats, rung) {
  const d = { beats: beats.map(b => ({ ...b, st: 'wait', fromMs: null, untilMs: null })), rung, atMs: 0, fromMs: 0, lanes: {}, subs: [], dry: true };
  advanceBeats(null, null, d, Number.MAX_SAFE_INTEGER);
  return { ms: d.untilMs ?? d.atMs, at: Object.fromEntries(d.beats.map(b => [b.key, [b.fromMs, b.untilMs]])) };
}

export default [
  {
    name: 'void-beats: VOID_DRILL in ENTER_AND_CLEAR\'s shape: every beat\'s kind registered and its channel the stepper\'s, every row whole, every beat it names in a catalogue, the catalogue by rung the rows\' labels at a dogged deck hatch',
    fn() {
      const beats = Object.entries(VOID_DRILL.beats).map(([k, b]) => ({ k, kind: b.k, ch: b.ch, ok: !!kindOf(b.k) && CHANNELS.includes(b.ch) }));
      const rows = VOID_BUNDLES.map(B => ({ id: B.id, ok: B.family === 'void' && GROUPS.includes(B.group) && Number.isInteger(B.slot) && Number.isInteger(B.rung) && !!B.label }));
      const named = VOID_BUNDLES.flatMap(B => (Array.isArray(B.beats) ? B.beats : beatsOf(B)).map(b => ({ row: B.id, b, ok: !!beatDefOf(b) })));
      // (the labels at a dogged deck hatch: '{undog}' read "Undog"; the face row's own)
      const plan = { hatch: 'h:none', door: null };
      const fakeState = { places: { hatchStub: {} } };
      const lab = (B) => voidLabel(fakeState, B, plan);
      const byRung = Object.fromEntries(Object.keys(VOID_MUSCLE).map(r => [r, VOID_MUSCLE[r].map(w => VOID_BUNDLES.find(B => lab(B) === w || B.label === w)?.id ?? null)]));
      console.log(`      beats: ${beats.map(b => `${b.k} ${b.kind}/${b.ch}`).join(', ')}`);
      console.log(`      rows: ${VOID_BUNDLES.map(B => `${B.id} r${B.rung} ${B.group} "${lab(B)}"${B.as ? ` as ${B.as}` : ''}`).join('; ')}`);
      console.log(`      the catalogue by rung: ${Object.entries(byRung).map(([r, ids]) => `${r}: ${ids.join(', ')}`).join(' · ')}`);
      assert(beats.every(b => b.ok), JSON.stringify(beats.filter(b => !b.ok)));
      assert(rows.every(r => r.ok), JSON.stringify(rows.filter(r => !r.ok)));
      assert(named.every(n => n.ok), JSON.stringify(named.filter(n => !n.ok)));
      assert(Object.values(byRung).every(ids => ids.every(Boolean)), JSON.stringify(byRung));
    },
  },
  {
    name: 'void-beats: nothing moves on the house: every house row\'s defOf is its bundleDef, every house beat\'s beatDefOf its own, no void beat in \'all-but-breach\', and hatchBeats leaves every house row as it is at house 1\'s doors',
    fn() {
      const rowsSame = BUNDLES.every(B => defOf(B.id) === bundleDef(B.id)), beatsSame = Object.keys(ENTER_AND_CLEAR.beats).every(k => beatDefOf(k) === ENTER_AND_CLEAR.beats[k]);
      const all = beatsOf({ beats: 'all-but-breach' }), leak = all.filter(k => VOID_BEATS.includes(k));
      const w = cqbWorld({ rooms: null }), L = laneOf(w.s), moved = [];
      for (const door of L.order) {
        const plan = planOf(w.s, door);
        for (const B of BUNDLES) { const ids = beatsOf(B), out = hatchBeats(w.s, w.pid, ids, plan); if (out.join() !== ids.join()) moved.push(`${door}/${B.id}`); }
      }
      console.log(`      ${BUNDLES.length} house rows, defOf the same ${rowsSame}; ${Object.keys(ENTER_AND_CLEAR.beats).length} house beats, beatDefOf the same ${beatsSame}; void beats in 'all-but-breach' ${leak.length}`);
      console.log(`      hatchBeats over ${L.order.length} doors × ${BUNDLES.length} rows: ${moved.length} changed`);
      assert(rowsSame && beatsSame && !leak.length && !moved.length, JSON.stringify({ rowsSame, beatsSame, leak, moved: moved.slice(0, 5) }));
    },
  },
  {
    name: 'void-beats: the recruit\'s sum and the operator\'s flow from one list: the deck hatch\'s beats for #1 one at a time at rung 0, the hands and the eyes over the feet at rung 4',
    fn() {
      const B = (key, ms, more = {}) => { const D = beatDefOf(key); return { key, k: D.k, ch: D.ch, after: [...(D.after ?? [])], ms, ...more }; };
      const list = [
        B('approach', 2000, { arriveMs: 1600, prof: null }), B('ready', 350), B('squeeze', 800, { after: ['approach'] }),
        B('undog', UNDOG_MS, { passMs: UNDOG_MS }), B('lift', OPEN_HATCH_MS, { passMs: OPEN_HATCH_MS }), B('hatch', 1300), B('plant', faceMsOf(false)), B('corner', 400, { after: ['hatch'] }),
      ].map(b => ({ ...b, after: b.after.filter(x => ['approach', 'ready', 'squeeze', 'undog', 'lift', 'hatch', 'plant'].includes(x.split('@')[0])) }));
      const sum = list.reduce((n, b) => n + b.ms, 0), r0 = dryRun(list, 0), r4 = dryRun(list, 4);
      console.log(`      the beats: ${list.map(b => `${b.key} ${b.k}/${b.ch} ${b.ms}`).join(', ')}; their sum ${sum} ms`);
      console.log(`      rung 0: ${r0.ms} ms; rung 4: ${r4.ms} ms (${Object.entries(r4.at).map(([k, [a, b]]) => `${k} ${a}–${b}`).join(', ')})`);
      assert(r0.ms === sum, JSON.stringify({ r0: r0.ms, sum }));
      assert(r4.ms < r0.ms && r4.at.hatch[0] >= r4.at.lift[1] && r4.at.plant[0] >= r4.at.hatch[1], JSON.stringify(r4));
    },
  },
  {
    name: 'void-beats: the rows\' times by sheet: the dogs 1.5 s and the lift 0.5 s with no roll, the transit 1.0 s × the Zero-g pace (1.04 s for the sergeant at Zero-g 9), the face change 1.5 s from boots and 1.2 s from a hold, the coaming 0.6 s',
    fn() {
      const out = {};
      for (const tier of TIERS) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go' }), s = g.state, pid = s.player.id, zg = valueOf(s, pid, 'zerog');
        out[tier] = { zg, through: throughMsOf(s, pid), want: Math.round(THROUGH_MS * paceOf(zg)) };
      }
      console.log(`      the dogs ${UNDOG_MS} ms, the lift ${OPEN_HATCH_MS} ms, the face ${faceMsOf(true)} ms (${faceMsOf(false)} from a hold), the coaming ${COAMING_MS} ms`);
      console.log(`      the transit by sheet: ${Object.entries(out).map(([t, o]) => `${t} Zero-g ${o.zg} ${o.through} ms`).join(', ')}`);
      assert(UNDOG_MS === 1500 && OPEN_HATCH_MS === 500 && faceMsOf(true) === 1500 && faceMsOf(false) === 1200 && COAMING_MS === 600, 'the void\'s times');
      assert(Object.values(out).every(o => o.through === o.want), JSON.stringify(out));
      // (the sheet's "1.3 s for the sergeant" was the lens's arithmetic: THROUGH_MS × paceOf at his Zero-g 9 is 1.04 s, the formula the sheet names)
      assert(out.sgt.through === 1040 && out.recruit.through > out.sgt.through && out.tierone.through < out.sgt.through, JSON.stringify(out));
    },
  },
  {
    name: 'void-beats: \'undog\' unlocks a locked door through op.js breakOpening, and lockedOf reads it open (house 1\'s closet, off the range), in UNDOG_MS with no roll',
    fn() {
      const w = cqbWorld({ rooms: null }), s = w.s, area = areaOf(s.places.live.area), o = (area.openings ?? []).find(x => x.lock);
      assert(o, 'a locked door on house 1');
      const before = lockedOf(s, o.id), D = beatDefOf('undog');
      const d = { who: w.pid, step: 'test:undog', kind: 'bundle', rung: 0, beats: [{ key: 'undog', k: D.k, ch: D.ch, how: 'undog', door: o.id, ms: UNDOG_MS, passMs: UNDOG_MS, after: [], st: 'wait', fromMs: null, untilMs: null }], lanes: {}, subs: [], fromMs: s.clock.ms, atMs: s.clock.ms, untilMs: s.clock.ms };
      const r = advanceBeats(s, w.g.bus, d, s.clock.ms + UNDOG_MS), after = lockedOf(s, o.id), rolled = d.subs[0];
      console.log(`      ${o.id}: locked ${before} → ${after} (broken at ${brokenOf(s, o.id)}), the beat ${r}, ${d.beats[0].ms} ms, routine ${rolled?.routine}, grade ${rolled?.grade}`);
      assert(before && !after && r === 'ended' && d.beats[0].ms === UNDOG_MS && rolled?.routine === true && rolled?.grade === null, JSON.stringify({ before, after, r, rolled }));
    },
  },
];
