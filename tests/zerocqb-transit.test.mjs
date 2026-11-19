// OLYMPUS tests: one deck at a time, F135's transit half (the build sheet v0.0.25 §0 item 2, §6 A, §8; src/sim/places/hatch.js).
//
// The Wreck's two decks lie 60 m apart in one area's plan, and src/sim/places/hatch.js crossHatch is the only writer of a deck
// change: on the bare Wreck world (tests/wreck-world.mjs: you and your #2 booted on deck 5) these cases take the pair round the
// trunk's scuttle and through it, and hold that the bodies carried move by exactly the trunk's offset in one tick, x, z, $px and $pz
// together (no glide), their own anchor points with them, nobody else; no onFace is written (the plant's); nobody stands between the
// decks at any tick, before, at or after; the actors list, its ids and its area are the same objects and values across it (no area
// change, no resync, no 'area-enter'); the fact 'hatch' is told once; a save the tick after carries on byte for byte. It refuses
// whole (moving nobody, the save's digest unchanged) with the scuttle dogged or shut, a body away from the trunk, an unknown hatch.
// The trunk's state is the save's only where it differs from the template; hatchOf reads the trunk and the bulkhead hatches alike.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { wreckWorld, atTrunk, actorOfPid } from './wreck-world.mjs';
import { crossHatch, hatchOf, hatchState, setHatch, deckAt, HATCH_REACH_M } from '../src/sim/places/hatch.js';
import { setOpening } from '../src/sim/places/model.js';
import { breakOpening } from '../src/sim/combat/op.js';
import { WRECK, WRECK_DECKS, WRECK_TRUNK } from '../src/data/places/wreck.js';

const fmt = (o) => JSON.stringify(o);
// (a body between the decks: past deck 5's outer walls and short of deck 6's, in the plan)
const between = (a) => a.x > WRECK_DECKS[5].rect[2] + 0.5 && a.x < WRECK_DECKS[6].rect[0] - 0.5;
const snap = (s) => s.actors.list.map(a => ({ id: a.id, who: a.who, x: a.x, z: a.z, px: a.$px, pz: a.$pz, at: a.anchorAt ?? null, onFace: a.onFace ?? null }));

export default [
  {
    name: 'crossHatch takes the pair through the open trunk in one tick: each moved by exactly the decks\' offset (60, 0), $px and $pz with him, his anchor point with him, nobody else, no onFace written; the actors list, its ids and area untouched; the fact \'hatch\' once and no area-enter (fails without the writer)',
    fn() {
      const w = atTrunk(wreckWorld()), s = w.s;
      w.g.step(2);
      const listRef = s.actors.list, before = snap(s), area0 = s.actors.area, tick0 = s.clock.tick;
      w.g.clearFacts();
      const r = crossHatch(s, w.g.bus, WRECK_TRUNK.id, [w.pid, w.twoPid]);
      const after = snap(s), facts = w.g.facts('hatch'), enters = w.g.facts('area-enter');
      const moved = after.map((a, i) => ({ id: a.id, dx: a.x - before[i].x, dz: a.z - before[i].z, glide: Math.hypot(a.x - a.px, a.z - a.pz), anchorDx: a.at && before[i].at ? a.at[0] - before[i].at[0] : null, deck: deckAt(WRECK, a.x, a.z) }));
      console.log(`      ${fmt(r)} at tick ${tick0}; ${moved.map(m => `${m.id} by (${m.dx}, ${m.dz}) to deck ${m.deck}, glide ${m.glide} m, anchor point by ${m.anchorDx}`).join('; ')}`);
      console.log(`      facts: hatch ${facts.length} ${fmt(facts[0])}; area-enter ${enters.length}; the list ${s.actors.list === listRef ? 'the same object' : 'MADE AGAIN'}, ids ${after.map(a => a.id).join(', ')}, area ${s.actors.area}`);
      assert(r.ok && r.moved.length === 2 && moved.every(m => m.dx === 60 && m.dz === 0 && m.glide === 0 && m.deck === 6 && (m.anchorDx === null || m.anchorDx === 60)), fmt({ r, moved }));
      assert(after.every(a => a.onFace === null), 'onFace written');
      assert(s.actors.list === listRef && fmt(after.map(a => [a.id, a.who])) === fmt(before.map(a => [a.id, a.who])) && s.actors.area === area0 && s.places.live.area === WRECK.id, 'the actors were made again');
      assert(facts.length === 1 && facts[0].from === 5 && facts[0].to === 6 && facts[0].dx === 60 && fmt(facts[0].who) === fmt([w.pid, w.twoPid]) && enters.length === 0, fmt({ facts, enters }));
      // (the next tick on the new deck: still there, nobody between)
      w.g.step(20);
      const later = snap(s);
      console.log(`      20 ticks on: ${later.map(a => `${a.id} (${a.x.toFixed(2)}, ${a.z.toFixed(2)}) deck ${deckAt(WRECK, a.x, a.z)}`).join('; ')}`);
      assert(later.every(a => deckAt(WRECK, a.x, a.z) === 6), fmt(later));
    },
  },
  {
    name: 'one deck at a time: nobody between the decks at any tick of the transit and the ticks either side, the one carried alone moved and the other left on deck 5, and back up the trunk by the same offset (F135)',
    fn() {
      const w = atTrunk(wreckWorld()), s = w.s, seen = { ticks: 0, between: 0, decks: new Set() };
      const look = () => { seen.ticks++; for (const a of s.actors.list) { if (between(a)) seen.between++; seen.decks.add(`${a.id}:${deckAt(WRECK, a.x, a.z)}`); } };
      for (let i = 0; i < 20; i++) { w.g.step(1); look(); }
      const r1 = crossHatch(s, w.g.bus, WRECK_TRUNK.id, [w.pid]);
      look();
      for (let i = 0; i < 20; i++) { w.g.step(1); look(); }
      const me = w.me(), two = w.two(), mid = { me: deckAt(WRECK, me.x, me.z), two: deckAt(WRECK, two.x, two.z) };
      const back = crossHatch(s, w.g.bus, WRECK_TRUNK.id, [w.pid]), up = deckAt(WRECK, me.x, me.z);
      look();
      console.log(`      ${seen.ticks} looks, ${seen.between} bodies between the decks; you alone through (${r1.ok}): you on deck ${mid.me}, your #2 on deck ${mid.two}; back up (${back.ok}): you on deck ${up} at (${me.x}, ${me.z})`);
      assert(r1.ok && seen.between === 0 && mid.me === 6 && mid.two === 5 && back.ok && up === 5, fmt({ r1, back, seen: { ...seen, decks: [...seen.decks] }, mid }));
    },
  },
  {
    name: 'it refuses whole, moving nobody (the save\'s digest unchanged): the scuttle dogged, then shut, a body away from the trunk, an unknown hatch, nobody named; the trunk\'s state the save\'s only where it differs from the template',
    fn() {
      const w = atTrunk(wreckWorld(), { open: false }), s = w.s, d0 = w.g.digest(), rows = [], x0 = w.me().x;
      const tryIt = (why, pids, id = WRECK_TRUNK.id) => { const r = crossHatch(s, w.g.bus, id, pids); rows.push(`${why}: ${r.ok ? 'MOVED' : r.why}`); return r; };
      const dogged = tryIt('dogged', [w.pid, w.twoPid]);
      setHatch(s, WRECK_TRUNK.id, 'shut');
      const shutDelta = s.places.sites[WRECK.site].hatches?.[WRECK_TRUNK.id];
      const shut = tryIt('shut', [w.pid]);
      setHatch(s, WRECK_TRUNK.id, 'open');
      const two = w.two(), tx = two.x;
      two.x = WRECK_TRUNK.ends[0].at[0] + HATCH_REACH_M + 0.3; two.$px = two.x;
      const far = tryIt('your #2 1.5 m off', [w.pid, w.twoPid]);
      two.x = tx; two.$px = tx;
      const unknown = tryIt('no such hatch', [w.pid], 'h:wreck:nowhere'), nobody = tryIt('nobody', []);
      const unmoved = w.me().x === x0 && w.two().x === tx;
      setHatch(s, WRECK_TRUNK.id, 'dogged');
      const d1 = w.g.digest(), bad = setHatch(s, WRECK_TRUNK.id, 'ajar');
      console.log(`      ${rows.join('; ')}; the shut delta ${fmt(shutDelta)}; dogged again: ${fmt(s.places.sites[WRECK.site].hatches ?? null)}; the digest ${d0} → ${d1}; 'ajar': ${bad.why}`);
      assert([dogged, shut, far, unknown, nobody].every(r => !r.ok && !r.moved.length) && unmoved, rows.join('; '));
      assert(shutDelta?.state === 'shut' && !s.places.sites[WRECK.site].hatches && d0 === d1 && !bad.ok, fmt({ shutDelta, d0, d1 }));
    },
  },
  {
    name: 'hatchOf reads the trunk (its end on your deck, the far end, its state) and the bulkhead hatches (dogged, then undogged and closed, then open; the face of its compartment\'s bulkhead and the side it is worked from); deckAt finds each deck and nothing between',
    fn() {
      const w = wreckWorld(), s = w.s;
      const t5 = hatchOf(s, WRECK_TRUNK.id), t6 = hatchOf(s, WRECK_TRUNK.id, 6);
      const id = 'o:wk:d5:cell-2', h0 = hatchOf(s, id);
      breakOpening(s, id, s.clock.ms);
      const h1 = hatchOf(s, id);
      setOpening(s, id, 'open');
      const h2 = hatchOf(s, id), store = hatchOf(s, 'o:wk:d6:store');
      const decks = [[4.6, 3.6], [30, 3.6], [64.6, 3.6], [-0.2, 0], [69.5, 7.4]].map(p => deckAt(WRECK, ...p));
      console.log(`      the trunk from deck 5 ${fmt(t5)}; from deck 6 at ${fmt(t6.at)} ${t6.onFace}, far ${fmt(t6.far)}`);
      console.log(`      cell 2's hatch: ${h0.state} → ${h1.state} → ${h2.state}, on cell 2's ${h0.onFace} bulkhead, worked from the passage's ${h0.far.onFace}, deck ${h0.deck}; the store's ${store.state} on its ${store.onFace}; deckAt ${fmt(decks)}; not a hatch: ${hatchOf(s, 'o:wk:d6:hold-far')}`);
      assert(t5.kind === 'deck' && t5.deck === 5 && t5.onFace === 'deck' && t5.far.deck === 6 && t5.far.onFace === 'deckhead' && t5.state === 'dogged' && hatchState(s, WRECK_TRUNK.id) === 'dogged', fmt(t5));
      assert(t6.deck === 6 && t6.far.deck === 5, fmt(t6));
      assert(h0.kind === 'bulkhead' && h0.state === 'dogged' && h1.state === 'closed' && h2.state === 'open' && h0.onFace === 'ventral' && h0.far.onFace === 'dorsal' && h0.deck === 5, fmt({ h0, h1, h2 }));
      assert(store.state === 'dogged' && store.onFace === 'ventral' && store.deck === 6 && hatchOf(s, 'o:wk:d6:hold-far') === null, fmt(store));
      assert(fmt(decks) === fmt([5, null, 6, 5, 6]), fmt(decks));
    },
  },
  {
    name: 'a save the tick after the deck change carries on byte for byte: loaded into a fresh game, 200 ticks on, the two runs\' digests equal (F135\'s save mid-transit)',
    fn() {
      const w = atTrunk(wreckWorld()), s = w.s;
      w.g.step(3);
      const r = crossHatch(s, w.g.bus, WRECK_TRUNK.id, [w.pid, w.twoPid]);
      w.g.step(1);
      const json = w.g.save(), g2 = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' });
      g2.load(json);
      const at = [actorOfPid(g2.state, w.pid), actorOfPid(g2.state, w.twoPid)].map(a => deckAt(WRECK, a.x, a.z));
      w.g.step(200); g2.step(200);
      const d1 = w.g.digest(), d2 = g2.digest();
      console.log(`      crossed ${r.ok}; the save ${json.length.toLocaleString('en-GB')} B, loaded with the pair on decks ${at.join(', ')}; 200 ticks on: ${d1} and ${d2}${g2.errors.length ? `; errors ${g2.errors.join('; ')}` : ''}`);
      assert(r.ok && at.every(d => d === 6) && d1 === d2 && !g2.errors.length, fmt({ d1, d2, errors: g2.errors }));
    },
  },
];
