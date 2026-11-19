// OLYMPUS tests: your number two and the live men (COMBAT §25.18, §25.19; the build sheet v0.0.19 §1 L-house, §3.3): his fading memory of a role-player, his own cover of a man down ("Got him."), and fire on him.
//
// The house keeps the #2's side of a role-player (shoothouse.js liveTick, each lived tick): what he has seen of each man
// (H.two.seenAt, combat/men.js remember and stale), his known dropped once a man has been out of his sight MAN_MEMORY_MS and is
// not his man now, so a man who comes back is a fresh sighting for his eyes (house-two.js twoTick); and, on nobody and not
// covering you, his head onto a man down or with his hands up that he can see, "Got him." once, which covers the man (men.js
// accountedOf reads H.two.got). Fire on him is men.js incoming's: his pool fills, his felt band rises and his take-in with it.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseShot, liveTick } from '../src/sim/scenarios/shoothouse.js';
import { houseHonestBot } from './bots/house.mjs';
import { LATE_ROUND_MS } from './flawless-live.mjs';
import { twoTick } from '../src/sim/combat/two.js';
import { accountedOf, gateWhy, seenK, incoming, MAN_MEMORY_MS } from '../src/sim/combat/men.js';
import { feltOf, bandN } from '../src/sim/combat/supp.js';
import { takeInMs } from '../src/sim/combat/react.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { faceOfHead } from '../src/sim/arms/shooting.js';
import { SEEN } from '../src/sim/people/perception.js';

function at(setup, opfor = 'live:fight,fight', tier = 'tierone') {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup, opfor }), st = g.state, R = st.armoury.range, H = R.house;
  for (const T of R.turners) if (T.turnAtMs !== null) T.turnAtMs -= 5000;
  const facts = [], bus = { emit: (type, f) => facts.push({ type, ...f }) };
  return { g, st, R, H, bus, facts, plans: lanePlanOf(st).plans, legs: [...H.rooms, H.hall], two: st.actors.list.find(a => a.who === H.twoPid), T2: R.turners.find(t => t.stand === '2a'), T3: R.turners.find(t => t.stand === '3a') };
}
const place = (a, x, z, face) => { a.x = x; a.z = z; a.$px = x; a.$pz = z; a.headRad = face; a.face = faceOfHead(face); };
const toward = (a, T) => Math.atan2(T.z - a.z, T.x - a.x);

export default [
  {
    name: 'v0.0.19: your number two forgets a role-player MAN_MEMORY_MS out of his sight (his known dropped, never while the man is his to fire on), then takes him in afresh when he sees him again (fails without the memory)',
    fn() {
      const A = at('room:3'), { st, R, H, two, T3, plans, legs } = A, W = H.two, P = plans[legs[2].door], now = st.clock.ms;
      place(two, P.points[1][0], P.points[1][1], 0); two.headRad = toward(two, T3); two.face = faceOfHead(two.headRad);
      const k0 = seenK(st, two, T3, now);
      liveTick(st, null, R, H, now);
      W.known[T3.key] = now;
      // (his back to him: out of his sight)
      two.headRad += Math.PI; two.face = faceOfHead(two.headRad);
      const k1 = seenK(st, two, T3, now + 1000);
      liveTick(st, null, R, H, now + 1000);
      const kept = W.known[T3.key] !== undefined;
      liveTick(st, null, R, H, now + MAN_MEMORY_MS + 100);
      const dropped = W.known[T3.key] === undefined;
      // (back on him: a fresh take-in by his own eyes)
      two.headRad = toward(two, T3); two.face = faceOfHead(two.headRad);
      st.clock.ms = now + MAN_MEMORY_MS + 150;
      W.contact = null; W.eng = null;
      twoTick(st, A.bus, R, H, two, st.clock.ms);
      console.log(`      3a from your #2's point: seenK ${k0.toFixed(3)}; his back turned ${k1.toFixed(3)}; known after 1 s ${kept}, after ${MAN_MEMORY_MS + 100} ms ${dropped ? 'dropped' : 'KEPT'}; facing him again: his contact ${W.contact?.key ?? 'none'} (take-in ${W.contact?.ms ?? '-'} ms), known ${W.known[T3.key] !== undefined}`);
      assert(k0 >= SEEN && k1 < SEEN && kept && dropped, JSON.stringify({ k0, k1, kept, dropped }));
      assert(W.contact?.key === T3.key && W.known[T3.key] === st.clock.ms, JSON.stringify(W.contact));
    },
  },
  {
    name: 'v0.0.19: your number two, on nobody and not covering you, covers a role-player of his sector down that he can see by himself: his head onto him, "Got him." once, the man covered (men.js accountedOf \'down\', the gate open) (fails without his cover)',
    fn() {
      // (room 3's man, his sector's, down by your rounds; your #2 at his point, his eyes a little off him (his sector's scan))
      const A = at('room:3'), { st, R, H, two, T3: T2, plans, legs, bus, facts } = A, W = H.two, P = plans[legs[2].door], now = st.clock.ms;
      // (down by a round in his head the would-have rates fatal (v0.0.20, combat/would.js: two torso rounds through his soft panel leave him up 87% of the time))
      houseShot(st, null, { id: 'two-1', fired: true, who: st.player.id, target: T2.key, zone: 'head', part: 'head', atMs: now });
      place(two, P.points[1][0], P.points[1][1], 0); two.headRad = toward(two, T2) + 0.3; two.face = faceOfHead(two.headRad);
      const k = seenK(st, two, T2, now), g0 = gateWhy(st, T2, now);
      liveTick(st, bus, R, H, now);
      liveTick(st, bus, R, H, now + 50);
      const said = facts.filter(f => f.type === 'say' && f.who === H.twoPid).map(f => f.text), acc = accountedOf(st, T2, now + 50), g1 = gateWhy(st, T2, now + 50);
      const off = Math.abs(((two.headRad - toward(two, T2)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
      console.log(`      3a down, your #2 at his point (seenK ${k.toFixed(3)}): the gate ${g0} before; he said ${JSON.stringify(said)}, his head ${off.toFixed(3)} rad off the man; the man ${acc}, the gate ${g1 ?? 'open'}`);
      assert(k >= SEEN && g0 === 'down' && said.length === 1 && /Got him/.test(said[0]) && W.got?.[T2.key] === now && off < 1e-3 && acc === 'down' && g1 === null, JSON.stringify({ k, g0, said, got: W.got, off, acc, g1 }));
    },
  },
  {
    name: 'v0.0.19: fire on your number two (men.js incoming\'s near misses, the boot recruit\'s #2) fills his pool and his felt band rises, and a take-in at his band is longer (react.js SUPP_MS a band: house-two.js twoTick passes it on the live lane, the edit L-house asks of its owner)',
    fn() {
      // (the boot recruit's #2, whose pool a marking round's crack reaches: the tier one shrugs them off, his band calm)
      const A = at('room:3', 'live:fight,fight', 'recruit'), { st, H, two, T3, bus } = A, now = st.clock.ms;
      const target = { key: T3.key, x: T3.x, z: T3.z, rangeM: Math.hypot(T3.x - two.x, T3.z - two.z), face: 'threat' };
      const f0 = feltOf(st, H.twoPid, now), t0 = takeInMs(st, H.twoPid, { id: 'two:t', targets: [target], seenMs: now }).ms;
      const rp = st.actors.list.find(a => a.who === T3.live.who) ?? { x: T3.x, z: T3.z };
      for (let i = 0; i < 16; i++) incoming(st, bus, { who: H.twoPid, by: T3.key, shot: { id: `in-${i}`, fired: true, load: 'marking', zone: null, hole: null, muzzle: { x: rp.x, z: rp.z }, atMs: now }, atMs: now });
      const f1 = feltOf(st, H.twoPid, now), t1 = takeInMs(st, H.twoPid, { id: 'two:t', targets: [target], seenMs: now, band: bandN(f1) }).ms;
      console.log(`      sixteen marking rounds past your #2: felt ${JSON.stringify(f0)} → ${JSON.stringify(f1)} (band ${bandN(f0)} → ${bandN(f1)}); his take-in on 3a ${t0} → ${t1} ms`);
      assert(bandN(f1) > bandN(f0) && t1 > t0, JSON.stringify({ f0, f1, t0, t1 }));
    },
  },
  {
    name: 'v0.0.19 (the review of track L): a role-player who gives up is shot by nobody past LATE_ROUND_MS after his hands come up: your #2 reads his hands (a no-shoot) from the give\'s first tick, and a row on him is cut once the shooter sees the give (before: the raider\'s #2 on 12 of 12 such men, up to 1,050 ms after, with no fault)',
    fn() {
      const rows = [];
      for (const [tier, seed] of [['raider', 1111], ['raider', 1037], ['cpl', 1074]]) {
        const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go', opfor: 'live:give,give' }), bot = houseHonestBot(), s = g.state, R = s.armoury.range, gave = {};
        let n = 0;
        while (!R.end && n++ < 30_000) { g.step(1, bot); g.clearFacts?.(); for (const T of R.turners) if (T.live?.st === 'hands' && gave[T.key] === undefined) gave[T.key] = T.live.fromMs; }
        for (const T of R.turners.filter(t => t.live)) {
          const late = gave[T.key] === undefined ? [] : (T.hits ?? []).filter(h => h.atMs >= gave[T.key] + LATE_ROUND_MS);
          rows.push({ tier, seed, stand: T.stand, gave: gave[T.key] !== undefined, late: late.map(h => `${h.by} +${h.atMs - gave[T.key]} ms`), surr: (R.house.rooms ?? []).reduce((a, L) => a + (L.faults ?? []).filter(f => f.kind === 'surrendered').length, 0), end: R.house.end?.why });
        }
      }
      console.log(`      ${rows.map(r => `${r.tier} ${r.seed} ${r.stand}: ${r.gave ? `gave up, rounds on him ${LATE_ROUND_MS} ms or more after ${r.late.length ? r.late.join(', ') : 'none'}` : 'did not give up'}; 'surrendered' ${r.surr}; the lane ${r.end}`).join('\n      ')}`);
      assert(rows.filter(r => r.gave).length >= 4, JSON.stringify(rows));
      assert(rows.every(r => !r.late.length && !r.surr), JSON.stringify(rows.filter(r => r.late.length || r.surr)));
    },
  },
];
