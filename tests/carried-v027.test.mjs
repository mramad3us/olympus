// OLYMPUS tests: carried-v027, the two seams the boarding's defenders stand on, carried from v0.0.26 (the build sheet v0.0.27 §0 item 18, §6 A; carried.md K1, K2).
//
// K1: v0.0.26 gated the re-aim after the shock on "Bang, then go"'s record; stage 0 pointed it at men.js choosesOf (true on a lane whose
// men choose: R.house.bangGo or R.house.boarding). On the live lane with a boarding's record and no bangGo, a man knocked off his aim by a
// stun lays it on his door again once the stun is over, with nobody in his sight; the same lane with neither record leaves him at his low
// ready ("Stack and clear, live" as built: its pins are house-live-pin's). K2: a defender's dash reads the footing (opfor.js startDash,
// freeOf, the push-off): in free fall with nothing to push from he moves 0 m (the cover taken where he is); on locked mag boots he never
// moves at more than the mag walk's 0.5 m/s while they hold, and his dash is a push-off at DASH_PUSH_MS 1.2 m/s with the boots unlocked
// at its start and locked at its end; standing on the deck without boots he pushes off it at 1.2 m/s. At 1 G the dash is the place's run
// as built. Fails without the gate's predicate or with the dash walking a floor that does not hold him.
import { assert, fmt } from './helpers.mjs';
import { liveGame, rp, rpActor } from './opfor-world.mjs';
import { boardingMen } from './boarding-men.mjs';
import { steelDeck } from './void-world.mjs';
import { setOpening } from '../src/sim/places/model.js';
import { choosesOf } from '../src/sim/combat/men.js';
import { DASH_PUSH_MS, freeOf } from '../src/sim/scenarios/opfor.js';
import { setAnchor } from '../src/sim/body/footing.js';
import { MAG_BOOTS } from '../src/data/body/needs.js';
import { TICK_MS } from '../src/core/clock.js';

// (X at every pause: time runs, nobody of yours fires)
const LEAVE = (st) => (st.stop?.mode === 'stop' && st.stop.phase === 'choose' ? { act: [{ act: 'stop', args: { step: 'leave', tempo: 'normal' } }] } : {});
// (one lane: the man laid, stunned 1 s, then 4 s watched: when his aim began again and whether it was laid)
function stunRun(boarding) {
  const w = liveGame({ seed: 48213, tier: 'sgt', setup: 'room:2', opfor: 'live:fight,fight' }), s = w.s, H = w.H;
  if (boarding) H.boarding = { v: 1 };
  const T = rp(w.g, '2a'), L = T.live, a = rpActor(w.g, '2a');
  for (let i = 0; i < 4; i++) w.g.step(1, LEAVE);
  // (laid as opfor.js holdDoor lays a man: st 'aim', his aim on the threshold, aimed, no turn under way)
  L.st = 'aim'; L.aimAt = [20.6, 14.7]; L.aiming = null; L.turn = null; s.people[L.who].kit.carry.posture = 'aimed';
  (a.combat ??= {}).stunUntilMs = s.clock.ms + 1000;
  const t0 = s.clock.ms;
  let off = null, again = null, laidAt = null;
  for (let i = 0; i < 80; i++) {
    w.g.step(1, LEAVE);
    const ms = s.clock.ms - t0;
    if (off === null && s.people[L.who].kit.carry.posture !== 'aimed') off = ms;
    if (again === null && off !== null && (L.aiming || s.people[L.who].kit.carry.posture === 'aimed')) again = ms;
    if (laidAt === null && again !== null && s.people[L.who].kit.carry.posture === 'aimed' && L.aimAt) laidAt = ms;
  }
  return { chooses: choosesOf(s), off, again, laidAt, st: L.st };
}

export default [
  {
    name: 'carried-v027: K1, on a lane whose men choose (a boarding\'s record, no bangGo) a man stunned off his aim lays it on his door again once the stun is over, nobody in his sight; the live lane with neither record leaves him at his low ready, as built (fails with the gate on bangGo)',
    fn() {
      const on = stunRun(true), off = stunRun(false);
      console.log(`      with the boarding's record: choosesOf ${on.chooses}, knocked off at +${on.off} ms, his aim begun again at +${on.again} ms, laid at +${on.laidAt} ms (${on.st}); the live lane: choosesOf ${off.chooses}, knocked off at +${off.off} ms, begun again ${off.again === null ? 'never' : `+${off.again} ms`} (${off.st})`);
      assert(on.chooses && !off.chooses && on.off !== null && on.again !== null && on.again <= 1000 + 2 * TICK_MS && on.laidAt !== null && off.off !== null && off.again === null, JSON.stringify({ on, off }));
    },
  },
  {
    name: 'carried-v027: K2, a defender in free fall with nothing to push from (floating mid-room in house 1 under 0 G, no boots, no hold) chosen to take cover moves 0 m; at 1 G the same dash is the place\'s run, as built (fails with the dash walking a floor that does not hold him)',
    fn() {
      const rows = [], off = [];
      for (const free of [true, false]) {
        const w = liveGame({ seed: 48213, tier: 'sgt', setup: 'room:2', opfor: 'live:hide,fight' }), s = w.s;
        if (free) steelDeck(s, { surface: null });
        const T = rp(w.g, '2a'), a = rpActor(w.g, '2a');
        // (mid-room 2, off the deck: a floating body with no face behind its push in reach (house 1's rooms have no deckhead within reach))
        if (free) { a.x = 22.6; a.z = 16.9; a.$px = a.x; a.$pz = a.z; a.floatY = 1.2; }
        const x0 = a.x, z0 = a.z;
        setOpening(s, 'o:w4:r2', 'open', { atMs: s.clock.ms });
        let moved = 0, vMax = 0, px = a.x, pz = a.z;
        for (let i = 0; i < 60; i++) { w.g.step(1, LEAVE); const d = Math.hypot(a.x - px, a.z - pz); vMax = Math.max(vMax, d / (TICK_MS / 1000)); moved = Math.max(moved, Math.hypot(a.x - x0, a.z - z0)); px = a.x; pz = a.z; }
        rows.push(`${free ? '0 G, floating' : '1 G'}: free fall ${freeOf(s, a)}, moved ${fmt(moved, 3)} m, at most ${fmt(vMax, 2)} m/s, ${T.live.st}${T.live.held ? ` (${T.live.held})` : ''}`);
        if (free ? moved > 0.001 || T.live.held !== 'no footing' : moved < 0.5 || vMax <= DASH_PUSH_MS) off.push(rows.at(-1));
      }
      console.log(`      ${rows.join('; ')}`);
      assert(!off.length, JSON.stringify(off));
    },
  },
  {
    name: 'carried-v027: K2 aboard the hauler at 0 G: on locked mag boots a defender never moves at more than the mag walk\'s 0.5 m/s while they hold; his dash to his hide is a push-off at 1.2 m/s, the boots unlocked at its start and locked at its end; on the deck without boots he pushes off it at 1.2 m/s',
    fn() {
      const rows = [], off = [];
      for (const boots of [true, false]) {
        const w = boardingMen({ seed: 48213, holdouts: 'pirates', stands: ['4a', '4b'] }), s = w.s, T = w.man('4a'), a = w.actor('4a'), L = T.live;
        if (!boots) { setAnchor(s, L.who, null); delete s.people[L.who].kit.worn.boots; }
        w.H.goAtMs = s.clock.ms;
        L.card = 'hide';
        let lockedV = 0, flyV = 0, unlockedAt = null, lockedAt = null, px = a.x, pz = a.z;
        const x0 = a.x, z0 = a.z;
        for (let i = 0; i < 80; i++) {
          const wasLocked = a.anchor === 'boots';
          w.tick();
          const v = Math.hypot(a.x - px, a.z - pz) / (TICK_MS / 1000);
          if (wasLocked && a.anchor === 'boots') lockedV = Math.max(lockedV, v); else flyV = Math.max(flyV, v);
          if (unlockedAt === null && wasLocked && a.anchor !== 'boots') unlockedAt = i;
          if (unlockedAt !== null && lockedAt === null && a.anchor === 'boots') lockedAt = i;
          px = a.x; pz = a.z;
        }
        const S = { hide: [7.9, 0.8] }, at = Math.hypot(a.x - S.hide[0], a.z - S.hide[1]);
        rows.push(`${boots ? 'on locked boots' : 'no boots, on the deck'}: free fall ${freeOf(s, a)}, at most ${fmt(lockedV, 2)} m/s locked and ${fmt(flyV, 2)} m/s flying, the boots off at tick ${unlockedAt} and on at ${lockedAt}, ${fmt(Math.hypot(a.x - x0, a.z - z0), 2)} m to ${fmt(at, 2)} m off his hide (${L.st}, anchor ${a.anchor ?? 'none'})`);
        // (a tick's speed read off places kept to 0.1 mm: ±0.004 m/s)
        if (lockedV > MAG_BOOTS.WALK_MS + 0.005 || flyV > DASH_PUSH_MS + 0.005 || flyV < DASH_PUSH_MS - 0.25 || at > 0.05) off.push(rows.at(-1));
        if (boots && (unlockedAt === null || lockedAt === null)) off.push(`boots ${unlockedAt} ${lockedAt}`);
      }
      console.log(`      ${rows.join('; ')}; MAG_BOOTS.WALK_MS ${MAG_BOOTS.WALK_MS}, DASH_PUSH_MS ${DASH_PUSH_MS}`);
      assert(!off.length, JSON.stringify(off));
    },
  },
];
