// OLYMPUS tests: the hatch, F128 (v0.0.25, "Hold to hold"; its build sheet §6 B, §8; PL§5, PL§6; COMBAT §14.8).
//
// On A's bare Wreck with an operation open (tests/void-run.mjs), held and printed:
//   1. #1 anchored from his transit's first tick on the new deck: in his #2's grip ('braced', the buddy through the trunk), or with
//      no #2 ready a hand on the coaming ('handhold', one-handed), never floating, then his boots on the deckhead at the plant;
//   2. the deck hatch's whole single row by row: Undog (the trunk 'shut'), Open (the trunk 'open'), Through (the deck changed by
//      places/hatch.js crossHatch, one 'hatch' fact, the body under the far deckhead at 1.2 m), the plant ('deckhead', locked,
//      magWalk), each in its row's time; the transit refused shut ("The hatch is shut.") and dogged ("Dogged. Undog it.");
//   3. the hatches' beats as planned (bundle.js hatchBeats on the lane's plans, wreck-plans.js): the hold's rows dog, lift, go
//      through and plant (no door, read, tell, muzzle or jamb mark; your #2's hand out after his "Ready." and his "Through." before his
//      transit), a dogged bulkhead hatch's door after its dogs and its entry over the coaming, the face change first from the
//      deckhead to a stack on the deck; the Kick struck "no kick in free fall" at every bulkhead hatch (kickableOf, never a variant).
// The review of v0.0.25's E, A and B (each failing without its fix):
//   4. "Through the hatch" offered within the transit's own reach (places/hatch.js HATCH_REACH_M 1.2 m), not at 1.35 m; a transit
//      tried from there refused in your words ("Not through: get to the scuttle.", no person id) with your boots as they were, and one
//      the trunk refuses after his grip is taken ("Not through: the hatch is not clear.") puts your anchor back exactly (a hand on the
//      hold stays a hand on the hold: the boots re-locked only where they were locked), "Got you." never said;
//   5. a body on the deckhead is kept out of a bulkhead hatch's head (move.js headStop), walking or in a stance, and must go to the
//      deck to cross; the deckhead's row is struck "the hatch's head" in the opening and offered in the passage clear of it; on the
//      deck the same walk goes through into the cell.
// The lane's own halves of F128 (never in a coaming over FUNNEL_FAULT_MS with nothing to shoot, F4 on the bulkhead hatches) are
// C's, on test-zerocqb's lanes (zerocqb-flawless).
import { assert } from './helpers.mjs';
import { wreckOp, voidDoing, runFor, holdPlan, planData, TRUNK } from './void-run.mjs';
import { footingOf, onFaceOf, setOnFace, setAnchor } from '../src/sim/body/footing.js';
import { hatchState } from '../src/sim/places/hatch.js';
import { hatchBeats, kickableOf, breachWays, throughInReach, THROUGH_REACH_WHY, THROUGH_WHY } from '../src/sim/combat/bundle.js';
import { kindOf } from '../src/sim/combat/stepper.js';
import { faceRows, HATCH_HEAD_WHY } from '../src/sim/arms/shooting.js';
import { wreckWorld } from './wreck-world.mjs';
import { breakOpening } from '../src/sim/combat/op.js';
import { setOpening, roomOf } from '../src/sim/places/model.js';
import { WRECK, WRECK_TRUNK } from '../src/data/places/wreck.js';
import { HATCH_REACH_M } from '../src/sim/places/hatch.js';
import { releaseTime } from '../src/core/clock.js';
import { beatsOf, bundleDef } from '../src/sim/combat/drills/enter-and-clear.js';
import { voidDef, KICK_VOID_WHY } from '../src/sim/combat/drills/void.js';
import { openingOf } from '../src/sim/places/model.js';

const deckOf = (a) => (a.x >= 30 ? 6 : 5);

// (#1's transit and plant, every tick's deck and anchor from the doing's start to its end)
function transit(w) {
  const pid = w.pid, me = w.me(), rows = [];
  if (w.twoPid) { const b = voidDoing(w.s, w.twoPid, ['brace'], { slot: 2 }); runFor(w, [b], 1); }
  const d = voidDoing(w.s, pid, ['hatch', 'plant']), t0 = w.s.clock.ms;
  runFor(w, [d], 60, () => { const F = footingOf(w.s, pid); rows.push({ ms: w.s.clock.ms - t0, deck: deckOf(me), anchor: F.anchor, hold: F.hold, mode: F.mode, face: onFaceOf(w.s, pid) }); });
  return { d, rows };
}

export default [
  {
    name: 'zerocqb-hatch (F128): #1 anchored from his transit\'s first tick on deck 6, in his #2\'s grip ("braced", the buddy through the trunk) or with none ready a hand on the coaming, never floating; then his boots on the deckhead',
    fn() {
      const out = {};
      for (const two of [true, false]) {
        const w = wreckOp({ two }), { rows } = transit(w), first = rows.findIndex(r => r.deck === 6);
        const after = rows.slice(first), floating = after.filter(r => r.anchor === 'floating').length;
        const kinds = [...new Set(after.map(r => `${r.anchor}/${r.hold}`))];
        out[two ? 'gripped' : 'alone'] = { first: rows[first]?.ms, ticks: after.length, floating, kinds, end: rows.at(-1) };
      }
      for (const [k, o] of Object.entries(out)) console.log(`      ${k}: on deck 6 from ${o.first} ms, ${o.ticks} ticks there, floating ${o.floating}, anchors ${o.kinds.join(' → ')}; the end ${JSON.stringify(o.end)}`);
      for (const o of Object.values(out)) assert(o.first !== undefined && o.floating === 0 && o.end.anchor === 'magBoots' && o.end.face === 'deckhead' && o.end.mode === 'magWalk', JSON.stringify(o));
      assert(out.gripped.kinds[0] === 'braced/buddy' && out.alone.kinds[0] === 'handhold/handhold', JSON.stringify(out));
    },
  },
  {
    name: 'zerocqb-hatch (F128): the deck hatch row by row: Undog (shut), Open (open), Through (one cut to deck 6, under the deckhead at 1.2 m), the plant (deckhead, locked); the transit refused shut and dogged',
    fn() {
      const w = wreckOp({ open: false }), s = w.s, me = w.me(), pid = w.pid, log = [];
      const step = (keys) => { const d = voidDoing(s, pid, keys), t0 = s.clock.ms; runFor(w, [d], 80, () => {}); const sub = d.subs.at(-1); log.push({ keys: keys.join('+'), ms: d.beats.reduce((n, b) => n + (b.untilMs - b.fromMs), 0), over: d.over, text: sub?.ok === false ? d.halt?.words ?? null : null, at: [me.x, me.z], trunk: hatchState(s, TRUNK), t0 }); return d; };
      const dogged = voidDoing(s, pid, ['hatch']); runFor(w, [dogged], 1);
      const refusedDogged = { why: dogged.halt?.why, words: dogged.halt?.words ?? dogged.subs[0] };
      step(['undog']);
      const shut = voidDoing(s, pid, ['hatch']); runFor(w, [shut], 1);
      const refusedShut = { why: shut.halt?.why, words: shut.halt?.words ?? shut.subs[0] };
      step(['lift']);
      const facts0 = w.g.facts('hatch').length;
      step(['hatch']);
      const cut = { facts: w.g.facts('hatch').length - facts0, deck: deckOf(me), floatY: me.floatY, face: onFaceOf(s, pid) };
      step(['plant']);
      const F = footingOf(s, pid), planted = { face: onFaceOf(s, pid), anchor: me.anchor, mode: F.mode, floatY: me.floatY };
      console.log(`      refused dogged ${JSON.stringify(refusedDogged)}; shut ${JSON.stringify(refusedShut)}`);
      for (const r of log) console.log(`      ${r.keys}: ${r.ms} ms, ${r.over}, the trunk ${r.trunk}, at (${r.at.map(v => v.toFixed(2))})`);
      console.log(`      the cut: ${JSON.stringify(cut)}; planted ${JSON.stringify(planted)}`);
      assert(refusedDogged.why === 'refused' && refusedDogged.words === 'Dogged. Undog it.' && refusedShut.why === 'refused' && refusedShut.words === 'The hatch is shut.', JSON.stringify({ refusedDogged, refusedShut }));
      assert(log[0].ms === 1500 && log[0].trunk === 'shut' && log[1].ms === 500 && log[1].trunk === 'open', JSON.stringify(log.slice(0, 2)));
      assert(cut.facts === 1 && cut.deck === 6 && cut.floatY === 1.2 && cut.face === 'deck', JSON.stringify(cut));
      assert(planted.face === 'deckhead' && planted.anchor === 'boots' && planted.mode === 'magWalk' && planted.floatY === 1.2 && log[3].ms === 1200, JSON.stringify({ planted, plant: log[3] }));
    },
  },
  {
    name: 'zerocqb-hatch (F128): the hatches\' beats as planned: the hold\'s rows dog, lift, go through and plant; a dogged bulkhead hatch\'s door after its dogs, its entry over the coaming; the face change first from the deckhead; the Kick struck at every bulkhead hatch',
    fn() {
      const w = wreckOp({ open: false }), s = w.s, pid = w.pid, hold = holdPlan(), cell = planData('o:wk:d5:cell-2'), store = planData('o:wk:d6:store');
      const rows = {};
      for (const id of ['stack:point', 'room:in', 'room:dominate', 'room:clear']) rows[`hold ${id}`] = hatchBeats(s, pid, beatsOf(bundleDef(id)), hold);
      rows['hold #2 stack:point'] = hatchBeats(s, w.twoPid, beatsOf(bundleDef('stack:point')), hold);
      rows['hold #2 room:in'] = hatchBeats(s, w.twoPid, beatsOf(bundleDef('room:in')), hold);
      rows['cell 2 room:clear'] = hatchBeats(s, pid, beatsOf(bundleDef('room:clear')), cell);
      rows['cell 2 void:undog'] = hatchBeats(s, pid, beatsOf(voidDef('void:undog')), cell);
      // (on the deckhead, the store's stack ahead: the face change first)
      const me = w.me(); me.x = 63.6; me.z = 3.6; setOnFace(s, pid, 'deckhead'); setAnchor(s, pid, 'boots');
      rows['the deckhead, store void:point'] = hatchBeats(s, pid, beatsOf(voidDef('void:point')), store);
      const kicks = ['o:wk:d5:cell-2', 'o:wk:d5:cell-5', 'o:wk:d6:store'].map(door => ({ door, kick: kickableOf(s, planData(door)), ways: breachWays(s, pid, planData(door)), leaf: openingOf(door)?.leaf }));
      for (const [k, ids] of Object.entries(rows)) console.log(`      ${k}: ${ids.join(' ')}`);
      console.log(`      the kicks: ${kicks.map(k => `${k.door} ${k.leaf} kickable ${k.kick}, ways ${k.ways.join('/')}`).join('; ')}; struck "${KICK_VOID_WHY}"`);
      const has = (ids, ...xs) => xs.every(x => ids.includes(x)), none = (ids, ...xs) => xs.every(x => !ids.includes(x)), before = (ids, a, b) => ids.indexOf(a) >= 0 && ids.indexOf(a) < ids.indexOf(b);
      assert(has(rows['hold room:clear'], 'undog', 'lift', 'hatch', 'plant', 'corner', 'sector') && none(rows['hold room:clear'], 'door', 'enter', 'read', 'tell', 'muzzle', 'mark', 'coaming'), rows['hold room:clear'].join());
      assert(before(rows['hold room:clear'], 'undog', 'lift') && before(rows['hold room:clear'], 'lift', 'hatch') && before(rows['hold room:clear'], 'hatch', 'plant'), rows['hold room:clear'].join());
      assert(before(rows['hold #2 stack:point'], 'squeeze', 'brace') && before(rows['hold #2 room:in'], 'let', 'hatch'), JSON.stringify(rows));
      assert(before(rows['cell 2 room:clear'], 'undog', 'door') && before(rows['cell 2 room:clear'], 'coaming', 'enter') && none(rows['cell 2 room:clear'], 'lift', 'hatch', 'plant', 'brace'), rows['cell 2 room:clear'].join());
      assert(rows['cell 2 void:undog'].join() === 'undog' && rows['the deckhead, store void:point'][0] === 'onface', JSON.stringify(rows));
      assert(kicks.every(k => k.leaf === 'hatch' && !k.kick && !k.ways.includes('kick')), JSON.stringify(kicks));
    },
  },
  {
    name: 'zerocqb-hatch (the review of v0.0.25\'s E, A and B): "Through the hatch" offered within HATCH_REACH_M only; tried from 1.35 m refused in your words with your boots as they were; refused after his grip, your anchor put back exactly and "Got you." never said',
    fn() {
      const w = wreckOp(), s = w.s, me = w.me(), pid = w.pid, [cx, cz] = WRECK_TRUNK.ends[0].at;
      // (the row's reach, the one singleRows offers Through by and the transit runs by (the row itself needs the lane's plan set: C's))
      const through = (dx) => { me.x = cx - dx; me.z = cz; me.$px = me.x; me.$pz = me.z; return throughInReach(s, pid, TRUNK); };
      const offered = { 1.0: through(1.0), 1.2: through(1.2), 1.35: through(1.35) };
      runFor(w, [voidDoing(s, w.twoPid, ['brace'], { slot: 2 })], 1);
      const d = voidDoing(s, pid, ['hatch']); runFor(w, [d], 4);
      const far = { words: d.halt?.words ?? null, anchor: me.anchor ?? null, deck: deckOf(me), said: w.g.facts('say').filter(f => f.text === 'Got you.').length };
      // (at the stack, your #2's hand out, a hand on the hold: the trunk refuses (a path asked in flight), after the grip is taken)
      me.x = cx - 0.7; me.z = cz; me.$px = me.x; me.$pz = me.z;
      const held = setAnchor(s, pid, 'handhold'), was = { anchor: me.anchor, anchorAt: me.anchorAt, anchorRef: me.anchorRef, anchorVia: me.anchorVia };
      const nav = (s.places.nav ??= {}); nav.pending = [...(nav.pending ?? []), { who: me.id }];
      const D = voidDoing(s, pid, ['hatch']), b = D.beats[0], r = kindOf('hatch').run(s, w.g.bus, D, b, s.clock.ms);
      nav.pending = nav.pending.filter(x => x.who !== me.id);
      const back = { anchor: me.anchor, anchorAt: me.anchorAt, anchorRef: me.anchorRef, anchorVia: me.anchorVia }, said = w.g.facts('say').filter(f => f.text === 'Got you.').length;
      console.log(`      Through offered at 1.0 m ${offered[1.0]}, at 1.2 m ${offered[1.2]}, at 1.35 m ${offered[1.35]} (HATCH_REACH_M ${HATCH_REACH_M}); tried from 1.35 m: ${JSON.stringify(far)}`);
      console.log(`      refused by the trunk after the grip: ${JSON.stringify({ text: r.text, halt: r.halt })}; the anchor ${JSON.stringify(was)} → ${JSON.stringify(back)}; "Got you." said ${said}`);
      assert(offered[1.0] && offered[1.2] && !offered[1.35], JSON.stringify(offered));
      assert(far.words === THROUGH_REACH_WHY && !/\bp\d+/.test(far.words) && far.anchor === 'boots' && far.deck === 5 && far.said === 0, JSON.stringify(far));
      assert(held.ok && r.halt === 'refused' && r.text === THROUGH_WHY && JSON.stringify(back) === JSON.stringify(was) && said === 0, JSON.stringify({ held, r, was, back, said }));
    },
  },
  {
    name: 'zerocqb-hatch (the review of v0.0.25\'s E, A and B): a body on the deckhead is kept out of a bulkhead hatch\'s head and must go to the deck to cross; the deckhead\'s row struck in the opening; on the deck the same walk goes into the cell',
    fn() {
      const out = {};
      for (const face of ['deckhead', 'deck']) for (const stance of [null, 'combat']) {
        const w = wreckWorld({ two: false }), s = w.s, pid = w.pid, me = w.me();
        s.stop = null; releaseTime(s, 'stop');
        const o = 'o:wk:d5:cell-2'; breakOpening(s, o, s.clock.ms); setOpening(s, o, 'open');
        me.x = 5.25; me.z = 3.6; me.$px = me.x; me.$pz = me.z; delete me.path; if (stance) me.moveStance = stance; else delete me.moveStance;
        if (face === 'deckhead') { setOnFace(s, pid, 'deckhead'); setAnchor(s, pid, 'boots'); }
        let minZ = me.z;
        for (let i = 0; i < 160; i++) { w.g.step(1, { mz: -1 }); minZ = Math.min(minZ, me.z); }
        out[`${face}${stance ? '/' + stance : ''}`] = { z: Math.round(me.z * 100) / 100, minZ: Math.round(minZ * 100) / 100, room: roomOf(WRECK, me.x, me.z)?.id ?? null, face: onFaceOf(s, pid) };
      }
      const w = wreckWorld({ two: false }), s = w.s, me = w.me(), rows = {};
      for (const z of [3.6, 3.3, 3.0, 2.8]) { me.x = 5.25; me.z = z; rows[z] = faceRows(s, w.pid).map(r => r.id + (r.off ? `(${r.off})` : '')).join(','); }
      console.log(`      walking north at the open hatch of cell 2: ${Object.entries(out).map(([k, v]) => `${k} ${JSON.stringify(v)}`).join('; ')}`);
      console.log(`      the face rows by z: ${JSON.stringify(rows)}`);
      for (const k of ['deckhead', 'deckhead/combat']) assert(out[k].minZ >= 3.08 + 0.27 - 0.011 && out[k].room === 'wk.d5.passage' && out[k].face === 'deckhead', JSON.stringify({ k, ...out[k] }));
      for (const k of ['deck', 'deck/combat']) assert(out[k].room === 'wk.d5.cell-2', JSON.stringify({ k, ...out[k] }));
      assert(rows[3.6] === 'face:deckhead' && [3.3, 3.0, 2.8].every(z => rows[z] === `face:deckhead(${HATCH_HEAD_WHY})`), JSON.stringify(rows));
    },
  },
];
