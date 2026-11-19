// OLYMPUS tests: free fall (ROADMAP "anywhere" step 7; the build sheet v0.0.24 §6 B; F106 to F108, F113's free-fall half):
// src/sim/body/freefall.js in a steel compartment at 0 G (tests/float-world.mjs floatRoom, the sandbox's bay under ship-coast) and in
// the shoot house under ship-coast for the six sheets' Zero-g.
//   - push-off (F106): the keys' 0.3, 0.6 and 1.2 m/s and the step's 2.0 m/s reached within 0.005 m/s at the 1 s step's end; a
//     miss turns the direction 5° a point and adds 0.1 rad/s a point of tumble, to the roll's own margin; the miss rates by Zero-g
//     printed for the six sheets;
//   - drift (F107): the velocity constant to 1e-6 over 200 ticks whatever keys are held; a face met at 1.5 m/s or less lands
//     unhurt, above it impact.js's bands (hands first facing the wall, the body first facing away);
//   - the grab (F108): under 1.5 m/s it holds, 1.5 to 3 m/s it rolls, over 3 an impact on the hands, and it stops the drift and the
//     tumble; L by context (core/keys.js 'grab' through game.js's combat actions): at Mars it does nothing, and a person in a fight
//     is never taken;
//   - saves (F113's half): mid-push, mid-drift and on a hold carry on byte for byte.
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { floatRoom, BAY } from './float-world.mjs';
import { toJSON } from '../src/core/state.js';
import { FREEFALL } from '../src/data/body/needs.js';
import { pushOff, grab, grabOf, floatOf, floating, HOLD_ANCHOR } from '../src/sim/body/freefall.js';
import { impactBand } from '../src/sim/body/impact.js';
import { footingOf } from '../src/sim/body/footing.js';
import { HOUSE_SHEETS } from '../src/sim/scenarios/shoothouse.js';
import { valueOf } from '../src/sim/skills/templates.js';
import { twoBoots } from '../src/sim/combat/two.js';
import { wear } from '../src/sim/arms/kit.js';
import { setAnchor, bootsOf, bootsLocked } from '../src/sim/body/footing.js';
import { MAG_BOOTS } from '../src/data/body/needs.js';
import { floatRoom as steelBay } from './float-world.mjs';

const F = FREEFALL, D2R = Math.PI / 180;
const speed = (a) => Math.hypot(a.v?.[0] ?? 0, a.v?.[1] ?? 0);
// (a body back at rest on the deck where it stands: no push, no drift, no tumble, no height)
const rest = (a) => { delete a.push; delete a.v; delete a.tumble; delete a.tumbleRad; delete a.floatY; delete a.aimFrom; };

export default [
  {
    name: 'push-off (F106; BODY §16.6): the keys\' 0.3, 0.6 and 1.2 m/s and the step\'s 2.0 m/s are reached within 0.005 m/s at the 1 s step\'s end, and a miss turns the push 5° and adds 0.1 rad/s of tumble a point missed, the roll\'s own margin; the miss rates by Zero-g for the six sheets',
    fn() {
      const rows = [];
      for (const [k, input, want] of [['stroll', { mx: 1, stroll: true }, 0.3], ['walk', { mx: 1 }, 0.6], ['run', { mx: 1, run: true }, 1.2], ['sprint', null, 2.0]]) {
        const w = floatRoom({ at: [BAY.x0 + 0.5, 6.25] }), a = w.me();
        let r = null;
        if (input) w.g.step(1, input); else { r = pushOff(w.s, w.pid, 0, 2.0, { bus: w.g.bus }); w.g.step(1); }
        const P = a.push, steps = Math.ceil((P.untilMs - w.s.clock.ms) / 50) + 1;
        w.g.step(steps);
        const got = speed(a), errDeg = Math.atan2(a.v[1], a.v[0]) / D2R, roll = r?.roll ?? w.s.log.filter(e => e.step === 'push').at(-1).roll;
        rows.push(`${k} ${fmt(got, 3)} m/s at ${fmt(errDeg, 1)}° (${P.from}), the roll ${roll.total} against ${roll.dc}, tumble ${a.tumble ?? 0} rad/s, after ${steps + 1} ticks`);
        near(got, want, 0.005, `${k}: the push's speed`);
        assert(!a.push && footingOf(w.s, w.pid).mode === 'float' && a.floatY === F.FLOAT_Y_M, JSON.stringify({ push: a.push, y: a.floatY }));
      }
      // (the six sheets: N pushes each from rest on the deck, one a tick, each its own roll; the error and the tumble checked on every miss)
      const N = 160, rates = [];
      let checked = 0;
      for (const tier of HOUSE_SHEETS) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, env: 'ship-coast', setup: 'go' }), s = g.state, pid = s.player.id, a = s.actors.list.find(x => x.id === s.player.actor);
        let miss = 0, missFast = 0;
        for (let i = 0; i < N; i++) {
          rest(a);
          const fast = i % 4 === 3, v = fast ? 2.0 : 0.6, r = pushOff(s, pid, 0, v);
          assert(r.ok, JSON.stringify(r));
          const by = r.roll.ok ? 0 : Math.max(1, -r.roll.margin), errDeg = Math.atan2(a.push.v[1], a.push.v[0]) / D2R;
          if (by) { if (fast) missFast++; else miss++; }
          // (the error and the tumble: 5° and 0.1 rad/s a point missed, each to its rounding)
          assert(Math.abs(Math.abs(errDeg) - F.PUSH.ERR_DEG * by) < 0.12 && Math.abs(Math.abs(a.tumble ?? 0) - F.PUSH.TUMBLE_RADS * by) < 1e-6 && r.roll.dc === F.PUSH.DC + (fast ? F.PUSH.FAST_DC : 0), JSON.stringify({ tier, by, errDeg, tumble: a.tumble, dc: r.roll.dc }));
          checked++;
          // (the house at GO stands in stop motion: the next push's roll is a tick later on its own stream, the clock moved by hand)
          s.clock.ms += 50;
        }
        rates.push(`${tier} (Zero-g ${valueOf(s, pid, 'zerog')}) ${fmt(100 * miss / (N * 0.75), 0)}% at 0.6, ${fmt(100 * missFast / (N * 0.25), 0)}% at 2.0`);
      }
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      the miss rates (${N} pushes a sheet, a quarter at 2.0 m/s): ${rates.join('; ')}; ${checked} checked`);
    },
  },
  {
    name: 'drift (F107): constant velocity to 1e-6 over 200 ticks with every key held in turn (the keys do nothing floating), along a straight line; a face met at 1.5 m/s or less lands unhurt, above it impact.js\'s bands, hands first facing the wall and the body first facing away',
    fn() {
      const w = floatRoom({ at: [BAY.x0 + 0.5, 6.25] }), a = w.me();
      w.g.step(1, { mx: 1, stroll: true });
      w.g.step(21);
      const v0 = [...a.v], x0 = a.x, z0 = a.z, keys = [{ mx: 1 }, { mx: -1, run: true }, { mz: 1 }, { mz: -1, stroll: true }, { mx: 1, mz: 1 }, {}];
      let worstV = 0, worstLine = 0;
      for (let t = 1; t <= 200; t++) {
        w.g.step(1, keys[t % keys.length]);
        worstV = Math.max(worstV, Math.abs(a.v[0] - v0[0]), Math.abs(a.v[1] - v0[1]));
        const ex = x0 + v0[0] * t * 0.05, ez = z0 + v0[1] * t * 0.05;
        worstLine = Math.max(worstLine, Math.hypot(a.x - ex, a.z - ez));
      }
      console.log(`      drifting at ${JSON.stringify(v0)} m/s for 200 ticks, every key held in turn: the velocity off by ${worstV}, the place off the line by ${fmt(worstLine * 1000, 2)} mm`);
      assert(worstV <= 1e-6 && worstLine < 0.011 && !a.push, JSON.stringify({ worstV, worstLine }));
      // (faces met: the east wall from 0.6 m off it, at each speed, facing it (the hands) or away (the body))
      const rows = [];
      for (const [vMs, face] of [[1.4, 0], [1.5, 0], [2.0, 0], [4.0, 0], [4.0, Math.PI], [7.0, Math.PI], [9.0, Math.PI]]) {
        const u = floatRoom({ at: [BAY.x1 - 0.9, 6.25] }), b = u.me();
        b.floatY = F.FLOAT_Y_M; b.v = [vMs, 0]; b.headRad = face;
        let n = 0;
        while (b.v && n++ < 40) u.g.step(1);
        const rec = u.s.people[u.pid].body, hurt = Object.entries(rec?.parts ?? {}).filter(([, p]) => p > 0), inj = (rec?.injuries ?? []).map(i => i.name);
        const first = face === 0 ? 'hands' : 'body', B = impactBand(vMs, first, { fitness: Math.round(valueOf(u.s, u.pid, 'fitness')), massRatio: 1 });
        rows.push(`${vMs} m/s ${first} first: ${vMs <= F.LAND_MS ? 'landed' : `impact, ${B.band?.id ?? 'under a bruise'} (eff ${fmt(B.effMs, 2)} m/s)`}; ${hurt.length ? hurt.map(([k, p]) => `${k} ${p}`).join(', ') : 'unhurt'}${inj.length ? `; ${inj.join(', ')}` : ''}`);
        assert(!b.v && !b.tumble && floating(u.s, u.pid) && b.x < BAY.x1, JSON.stringify({ v: b.v, x: b.x }));
        if (vMs <= F.LAND_MS) assert(!hurt.length, `${vMs} m/s landed unhurt: ${JSON.stringify(rec?.parts)}`);
        if (vMs >= 7) assert(hurt.some(([k]) => k === 'torso'), `${vMs} m/s body first hurts the torso: ${JSON.stringify(rec?.parts)}`);
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'the grab (F108; BODY §16.6): under 1.5 m/s it holds, 1.5 to 3 m/s a Zero-g roll at DC 10 + 3 a m/s over 1.5, over 3 an impact on the hands and the hold taken; it stops the drift and the tumble; L is the float\'s grab only floating with a hold or a person in reach, at Mars nothing, and never a person in a fight',
    fn() {
      const rows = [];
      for (const vMs of [0.8, 1.4, 2.0, 2.9, 3.5]) {
        let held = 0, glanced = 0, hurt = 0;
        const n = vMs > 1.5 && vMs <= 3 ? 12 : 1;
        for (let k = 0; k < n; k++) {
          const w = floatRoom({ holds: true, seed: 48213 + k }), a = w.me();
          a.floatY = F.FLOAT_Y_M; a.v = [vMs, 0]; a.tumble = 0.4; a.tumbleRad = 0.2;
          assert(grabOf(w.s, w.pid)?.kind === 'hold', JSON.stringify(grabOf(w.s, w.pid)));
          w.g.step(1, { act: ['grab'] });
          const F2 = footingOf(w.s, w.pid);
          if (F2.mode === 'handhold') { held++; assert(!a.v && !a.tumble && !a.push, JSON.stringify({ v: a.v, tumble: a.tumble })); } else glanced++;
          if (Object.values(w.s.people[w.pid].body?.parts ?? {}).some(p => p > 0)) hurt++;
          if (vMs < F.GRAB.HOLD_MS) assert(F2.mode === 'handhold' && F2.hold === HOLD_ANCHOR, JSON.stringify(F2));
          if (vMs > F.GRAB.IMPACT_MS) assert(F2.mode === 'handhold', JSON.stringify(F2));
        }
        rows.push(`${vMs} m/s: held ${held} of ${n}, glanced off ${glanced}, hurt ${hurt}${vMs > 1.5 && vMs <= 3 ? ` (DC ${Math.round(F.GRAB.DC_BASE + F.GRAB.DC_PER_MS * (vMs - F.GRAB.HOLD_MS))})` : ''}`);
      }
      // (L at Mars: the same game's digest as with no key; floating with nothing in reach: nothing)
      const m1 = createGame({ scenario: 'sandbox', seed: 7 }), m2 = createGame({ scenario: 'sandbox', seed: 7 });
      m1.step(20, { act: ['grab'] }); m2.step(20);
      const far = floatRoom(), fa = far.me();
      fa.floatY = 1; fa.v = [0.5, 0];
      far.g.step(1, { act: ['grab'] });
      // (a person in a fight is CQC's, never the float's: the only body in reach set fighting, nothing taken)
      const h = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', env: 'ship-coast', setup: 'go' }), hs = h.state, hp = hs.player.id;
      const me = hs.actors.list.find(x => x.id === hs.player.actor), two = hs.actors.list.find(x => x.who && x.who !== hp);
      me.x = two.x + 0.6; me.z = two.z; me.floatY = 1; me.v = [0.3, 0];
      const before = grabOf(hs, hp);
      hs.fights = { [two.who]: { with: hp } };
      const fighting = grabOf(hs, hp);
      delete hs.fights[two.who];
      const took = grab(hs, hp);
      // (held under 0.05 G only the boots walk: a hand's hold is pushed off by the keys (the push lets go of it), a lanyard holds)
      const hw = floatRoom({ holds: true }), ha = hw.me();
      assert(setAnchor(hw.s, hw.pid, 'handhold').ok, 'a hand on the pad-eye');
      hw.g.step(1, { mx: -1 });
      const offHold = { from: ha.push?.from ?? null, anchor: ha.anchor ?? null, mode: footingOf(hw.s, hw.pid).mode };
      const lw = floatRoom({ holds: true }), la = lw.me(), lx = la.x;
      assert(setAnchor(lw.s, lw.pid, 'tether').ok, 'the lanyard on the pad-eye');
      lw.g.step(20, { mx: -1, run: true });
      const onLanyard = { moved: Math.abs(la.x - lx), mode: footingOf(lw.s, lw.pid).mode, push: !!la.push };
      console.log(`      ${rows.join('; ')}`);
      console.log(`      L at Mars: ${m1.digest() === m2.digest() ? 'nothing' : 'something'}; floating with nothing in reach: ${fa.v ? 'drifting on' : 'stopped'}; your #2 in reach: ${before?.kind} at ${before?.relMs} m/s, in a fight ${fighting ? fighting.kind : 'not taken'}, out of it ${took.ok ? `taken (${footingOf(hs, hp).mode}, the two drifting as one at ${JSON.stringify(me.v ?? null)} and ${JSON.stringify(two.v ?? null)} m/s)` : took.why}`);
      console.log(`      a hand on a pad-eye and the keys: pushed off from the ${offHold.from}, the anchor ${offHold.anchor ?? 'let go'}, ${offHold.mode}; on the lanyard, 20 ticks of Shift and Q: moved ${onLanyard.moved} m, ${onLanyard.mode}`);
      assert(offHold.from === 'hold' && !offHold.anchor && offHold.mode === 'float' && onLanyard.moved === 0 && onLanyard.mode === 'handhold' && !onLanyard.push, JSON.stringify({ offHold, onLanyard }));
      assert(m1.digest() === m2.digest() && fa.v && before?.kind === 'person' && !fighting && took.ok && me.v && two.v && me.v[0] === two.v[0] && me.v[1] === two.v[1], JSON.stringify({ before, fighting, took, me: me.v, two: two.v }));
    },
  },
  {
    name: 'saves in free fall carry on byte for byte (F113\'s free-fall half): a save mid-push, one mid-drift with a tumble and one on a hold just grabbed, each loaded and carried on 60 ticks to the same state as the game that made it',
    fn() {
      const out = [];
      for (const [k, setup] of [
        ['mid-push', (w) => w.g.step(8, { mx: 1, run: true })],
        ['mid-drift', (w) => { w.g.step(1, { mz: 1 }); w.g.step(30); w.me().tumble = 0.3; }],
        ['on a hold', (w) => { const a = w.me(); a.floatY = 1; a.v = [0.7, 0.2]; w.g.step(1, { act: ['grab'] }); }],
      ]) {
        const w = floatRoom({ holds: k === 'on a hold' });
        setup(w);
        const json = w.g.save();
        w.g.step(60, { mx: -1 });
        const d = w.g.digest(), st = toJSON(w.s);
        w.g.load(json); w.g.step(60, { mx: -1 });
        out.push(`${k} ${d === w.g.digest() && st === toJSON(w.s) ? 'byte for byte' : 'DIFFERS'} (${JSON.stringify(floatOf(w.s, w.pid) ?? footingOf(w.s, w.pid).mode)})`);
        assert(d === w.g.digest() && st === toJSON(w.s), `${k}: carried on differently`);
      }
      console.log(`      ${out.join('; ')}`);
    },
  },
  {
    name: 'your #2 wears his mag boots when you wear yours, locks his one beat (400 ms) after yours lock and releases his one beat (300 ms) after yours release (F107\'s #2 half; combat/two.js twoBoots), and does nothing while you wear none',
    fn() {
      // (the house's sergeant and his #2 moved onto the steel bay at 0 G: twoBoots alone, the house's other rules not run)
      const h = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', env: 'ship-coast', setup: 'go' }), s = h.state, you = s.player.id, H = s.armoury.range.house;
      steelBay();
      s.places.live.area = 'test.rooms~float';
      const me = s.actors.list.find(x => x.id === s.player.actor), two = s.actors.list.find(x => x.who === H.two.pid);
      me.x = 24; me.z = 6; two.x = 25.2; two.z = 6;
      const t0 = s.clock.ms, at = (dt) => { s.clock.ms = t0 + dt; twoBoots(s, null, H, s.clock.ms); return bootsLocked(s, H.two.pid); };
      at(0);
      const noneWorn = !bootsOf(s, H.two.pid);
      wear(s, you, 'mb-1');
      at(50);
      const worn = !!bootsOf(s, H.two.pid);
      assert(setAnchor(s, you, 'boots').ok, 'your boots lock on the steel');
      const before = at(100), justBefore = at(100 + MAG_BOOTS.LOCK_MS - 50), locked = at(100 + MAG_BOOTS.LOCK_MS);
      setAnchor(s, you, null);
      const r0 = at(1000), r1 = at(1000 + MAG_BOOTS.UNLOCK_MS - 50), r2 = at(1000 + MAG_BOOTS.UNLOCK_MS);
      console.log(`      with none of yours: his ${noneWorn ? 'none' : 'worn'}; yours on: his ${worn ? 'worn' : 'none'}; yours locked at 100 ms: his locked ${before} at 100, ${justBefore} at ${100 + MAG_BOOTS.LOCK_MS - 50}, ${locked} at ${100 + MAG_BOOTS.LOCK_MS} ms; yours released at 1,000 ms: his locked ${r0}, ${r1} at ${1000 + MAG_BOOTS.UNLOCK_MS - 50}, ${r2} at ${1000 + MAG_BOOTS.UNLOCK_MS} ms`);
      assert(noneWorn && worn && !before && !justBefore && locked && r0 && r1 && !r2, JSON.stringify({ noneWorn, worn, before, justBefore, locked, r0, r1, r2 }));
    },
  },
];
