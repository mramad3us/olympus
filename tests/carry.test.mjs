// Carry postures, the muzzle's cone, the habit check and range safety (src/sim/arms/carry.js; WEAPONS §6.1, §6.3, §6.4; the build sheet 0.0.5 §4, §5.1): each posture's cone by stance, §6.3's per-approach table by the habit's own rolls, one roll an approach however long it lasts, no habit decided by a natural, and every range rule's verdict.
import { assert, fmt } from './helpers.mjs';
import { armsWorld, heard, LANE } from './arms-world.mjs';
import * as CARRY from '../src/sim/arms/carry.js';
import { POSTURES, STANCE_H, SPAN_M, muzzleOf, inCone, habitStep, rangeSafety, WARN_AGAIN_S, OUT_GRACE_S } from '../src/sim/arms/carry.js';

const RAD = Math.PI / 180;
const tick = (state, ms = 50) => { state.clock.ms += ms; state.clock.tick += 1; };


export default [
  {
    name: 'each posture\'s cone by stance: where its line meets the floor and which bodies ahead it passes through (a low ready flags shins within 1.8 m, a high ready a face within 0.6 m, slung front only toes)',
    fn() {
      const lines = [];
      for (const [posture, P] of Object.entries(POSTURES)) for (const stance of ['stand', 'kneel', 'prone']) {
        const W = armsWorld({ posture, stance: stance === 'stand' ? null : stance, coach: false });
        const m = muzzleOf(W.state, W.pid);
        const floor = m.pitchRad < 0 ? fmt(m.oy / Math.tan(-m.pitchRad), 2) : '-';
        const hits = [0.4, 0.9, 1.5, 2.3].map(d => `${d} m ${['stand', 'kneel', 'prone'].map(s => (inCone(m, { x: W.actor.x + d, z: W.actor.z, spanM: SPAN_M[s] }) ? s[0].toUpperCase() : '·')).join('')}`);
        lines.push(`${posture.padEnd(10)} ${stance.padEnd(5)} yaw ${P.yawDeg}°, pitch ${P.pitchDeg}°, line at ${fmt(m.oy, 2)} m, ±${P.halfDeg}°, reach ${P.reachM} m, floor at ${floor} m; tip (${fmt(m.x - W.actor.x, 2)}, ${fmt(m.y, 2)}); ahead: ${hits.join(', ')}`);
      }
      console.log(`      ${lines.join('\n      ')}`);
      const at = (posture, d, span = SPAN_M.stand) => { const W = armsWorld({ posture, coach: false }); return inCone(muzzleOf(W.state, W.pid), { x: W.actor.x + d, z: W.actor.z, spanM: span }); };
      assert(at('lowReady', 1.5) && !at('lowReady', 2.3), 'low ready: shins at 1.5 m, nobody at 2.3 m');
      assert(at('highReady', 0.5) && !at('highReady', 0.9), 'high ready: a face at 0.5 m, not at 0.9 m');
      assert(at('slungFront', 0.4) && !at('slungFront', 0.9), 'slung front: toes at 0.4 m, nothing at 0.9 m');
      assert(!at('lowReady', 1.0, [1.2, 1.75]), 'low ready at 1 m: below a standing chest');
      assert(STANCE_H.kneel === 0.68 && STANCE_H.prone === 0.2, 'the stance factors');
    },
  },
  {
    name: 'the habit per approach (WEAPONS §6.3) at WH 4, 10 and 18 over 2,000 approaches a cell: automatic when dc ≤ v + 1, else one d20 without naturals; a near miss by 1 or 2, else a flag after 300 ms in the cone',
    fn() {
      // WEAPONS §6.3's table [computed]: near misses / flags per approach
      const WANT = {
        4: { rested: [0.10, 0.15], crowd: [0.10, 0.25], exhausted: [0, 0.50], slung: [0.05, 0] },
        10: { rested: 'auto', crowd: [0.05, 0], exhausted: [0.10, 0.10], slung: 'auto' },
        18: { rested: 'auto', crowd: 'auto', exhausted: 'auto', slung: 'auto' },
      };
      const COLS = { rested: { posture: 'lowReady', crowd: false, mods: [] }, crowd: { posture: 'lowReady', crowd: true, mods: [] },
        exhausted: { posture: 'lowReady', crowd: true, mods: [{ why: 'exhausted', v: -3, src: 'need:fatigue' }] }, slung: { posture: 'slungFront', crowd: true, mods: [] } };
      const N = 2000, rows = [], nat = { one: 0, twenty: 0, rolls: 0 };
      for (const wh of [4, 10, 18]) {
        const cells = [];
        for (const [col, c] of Object.entries(COLS)) {
          const W = armsWorld({ wh, posture: c.posture, coach: false, seed: 77 + wh, extra: c.crowd ? [{ x: 0, z: 0 }, { x: 0, z: 0 }] : [] });
          const { state, bus, actor } = W;
          const extras = state.actors.list.filter(a => a.who.startsWith('p1') && a.who !== 'p1');
          extras.forEach((e, i) => { e.x = actor.x - 1.5; e.z = actor.z + (i ? 1 : -1); });
          state.people.p3 = { id: 'p3', name: { given: 'B', family: 'Walker' }, service: { rank: 'Pvt' } };
          const B = { id: 'a3', who: 'p3', x: 0, z: 0, face: 'left', gait: 'idle' };
          state.actors.list.push(B);
          const ahead = c.posture === 'slungFront' ? 0.4 : 1.2;
          const count = { auto: 0, pass: 0, near: 0, flag: 0, fail: 0 };
          for (let i = 0; i < N; i++) {
            B.x = actor.x + ahead; B.z = actor.z;
            habitStep(state, null, bus, { mods: c.mods });
            tick(state, 350);
            habitStep(state, null, bus, { mods: c.mods });
            const rec = state.people.p1.kit.carry.near?.p3;
            count[rec?.result ?? 'none'] = (count[rec?.result ?? 'none'] ?? 0) + 1;
            B.x = actor.x + 4; tick(state);
            habitStep(state, null, bus, { mods: c.mods });
            assert(!state.people.p1.kit.carry.near?.p3, 'the approach closes past 3 m');
          }
          for (const f of heard(bus, 'roll')) { if (f.roll.verb !== 'habit') continue; nat.rolls++; if (f.roll.roll === 1) nat.one++; if (f.roll.roll === 20) nat.twenty++;
            assert(f.roll.nat === 0 && f.roll.ok === (f.roll.total >= f.roll.dc), `no habit decided by a natural: ${JSON.stringify(f.roll)}`); }
          const want = WANT[wh][col], near = count.near / N, flag = count.flag / N;
          cells.push(count.auto === N ? 'automatic' : `${fmt(near * 100, 1)}% / ${fmt(flag * 100, 1)}%`);
          if (want === 'auto') assert(count.auto === N, `WH ${wh} ${col}: automatic (${JSON.stringify(count)})`);
          else assert(Math.abs(near - want[0]) <= 0.03 && Math.abs(flag - want[1]) <= 0.03 && count.auto === 0, `WH ${wh} ${col}: ${fmt(near * 100, 1)}% / ${fmt(flag * 100, 1)}% against ${want.map(x => x * 100).join('% / ')}%`);
        }
        rows.push(`WH ${String(wh).padStart(2)}: ${cells.map(x => x.padStart(14)).join('')}`);
      }
      console.log(`      near misses / flags per approach   low ready rested (DC 10) · in a crowd (12) · crowd, exhausted (12, −3) · slung front in a crowd (6)`);
      console.log(`      ${rows.join('\n      ')}`);
      console.log(`      ${nat.rolls} habit rolls: ${nat.one} d20 ones and ${nat.twenty} twenties, each decided by its total, never by its face`);
      assert(nat.one > 20 && nat.twenty > 20, 'naturals were rolled, and decided nothing');
    },
  },
  {
    name: 'one roll an approach, however long it lasts: a recruit at low ready with the coach standing in the cone for three minutes rolls once and flags at most once',
    fn() {
      const W = armsWorld({ wh: 4, posture: 'lowReady' }), { state, bus, actor, coachActor } = W;
      coachActor.x = actor.x + 1.2; coachActor.z = actor.z;
      for (let t = 0; t < 3600; t++) { habitStep(state, null, bus, {}); tick(state); }
      const rolls = heard(bus, 'roll').filter(f => f.roll.verb === 'habit').length, autos = state.log.filter(e => e.kind === 'habit' && e.result === 'auto').length;
      const flags = heard(bus, 'muzzle').filter(f => f.kind === 'flag').length;
      const rec = state.people.p1.kit.carry.near?.p2;
      console.log(`      3 minutes in the cone: ${rolls} roll, ${autos} automatic, ${flags} flag; the record: ${JSON.stringify(rec)}; J: ${state.log.filter(e => e.filter === 'habit').map(e => e.text).join(' | ')}`);
      assert(rolls + autos === 1 && flags <= 1, `one roll an approach: ${rolls} rolls, ${autos} automatic, ${flags} flags`);
      // (slung front at the scene's Weapon handling: never rolled, the habit automatic)
      const S = armsWorld({ wh: 9, posture: 'slungFront' });
      S.coachActor.x = S.actor.x + 0.4; S.coachActor.z = S.actor.z;
      for (let t = 0; t < 200; t++) { habitStep(S.state, null, S.bus, {}); tick(S.state); }
      assert(heard(S.bus, 'roll').length === 0 && S.state.log.some(e => e.result === 'auto'), 'slung front at WH 9: automatic, no roll');
    },
  },
  {
    name: 'range safety by heading: in hand past 60° off downrange a warning, past 100° the stop (loaded or not); a slung rifle is never checked; the line hot or cold the same',
    fn() {
      const heads = [0, 45, 61, 90, 101, 180], lines = [];
      for (const posture of ['slungFront', 'lowReady', 'highReady', 'aimed']) for (const hot of [true, false]) {
        const cells = heads.map(h => {
          const W = armsWorld({ posture });
          W.actor.headRad = h * RAD;
          const v = rangeSafety(W.state, W.pid, W.state.clock.ms, { downrangeRad: 0, lane: LANE, hot });
          const word = v.stop ? `stop:${v.stop.rule}` : v.warn.length ? `warn:${v.warn.map(w => w.rule).join('+')}` : 'ok';
          const inHand = POSTURES[posture].inHand;
          const want = !inHand ? 'ok' : h > 100 ? 'stop:uprange' : h > 60 ? 'warn:muzzle' : 'ok';
          assert(word === want, `${posture} ${hot ? 'hot' : 'cold'} at ${h}°: ${word}, want ${want}`);
          return `${h}° ${word}`;
        });
        lines.push(`${posture.padEnd(10)} ${hot ? 'hot ' : 'cold'}: ${cells.join(', ')}`);
      }
      console.log(`      ${lines.join('\n      ')}`);
    },
  },
  {
    name: 'every range rule warns or stops as the sheet has it, and a warning comes again no sooner than 20 s',
    fn() {
      const box = [1098.6, 291.5, 1102.2, 293.5];
      const cases = [
        ['aimed at a person (the aim\'s key)', {}, { targetKey: 'a2' }, 'stop:person'],
        ['aimed back at the coach at the shoulder (Rule 1 first: uprange)', { posture: 'aimed', head: Math.atan2(1.0, -0.6) }, {}, 'stop:uprange'],
        ['aimed at the coach standing downrange', { posture: 'aimed', coachAhead: true }, {}, 'stop:person'],
        ['another lane\'s card aimed', {}, { targetKey: 'paper:3' }, 'warn:lane'],
        ['a shot on another lane', {}, { shot: { lane: 3 } }, 'stop:lane'],
        ['off the box', { off: true }, { box }, 'warn:walk'],
        ['off the box past the grace', { off: true }, { box, outAtMs: -(OUT_GRACE_S * 1000 + 50) }, 'stop:walk'],
        ['a shot on a cold line', {}, { shot: { lane: LANE }, hot: false, coldShots: 1 }, 'warn:cold'],
        ['a second shot on a cold line', {}, { shot: { lane: LANE }, hot: false, coldShots: 2 }, 'stop:cold'],
        ['a command ahead of the tower', {}, { ahead: 'ready' }, 'warn:ahead'],
        ['the finger on, moving', { finger: 'on' }, { moving: true }, 'warn:finger'],
        ['the coach flagged', { flagged: true }, { coachId: 'p2' }, 'warn:coach'],
        ['a negligent discharge', {}, { nd: { grade: 'ND-1' } }, 'stop:nd'],
        ['the muzzle warned 19 s ago', { head: 70 * RAD }, { warned: { muzzle: -19_000 } }, 'ok'],
        ['the muzzle warned 20 s ago', { head: 70 * RAD }, { warned: { muzzle: -20_000 } }, 'warn:muzzle'],
      ];
      const lines = [];
      for (const [what, set, L, want] of cases) {
        const W = armsWorld({ posture: set.posture ?? 'lowReady' }), { state, actor, coachActor } = W, ms = state.clock.ms;
        if (set.head !== undefined) actor.headRad = set.head;
        if (set.off) actor.x -= 3;
        if (set.finger) state.people.p1.kit.carry.finger = 'on';
        if (set.flagged) state.people.p1.kit.carry.near = { p2: { atMs: ms, result: 'flag', posture: 'lowReady' } };
        if (set.coachAhead) { coachActor.x = actor.x + 8; coachActor.z = actor.z; }
        const l = { downrangeRad: 0, lane: LANE, hot: true, ...L };
        if (l.outAtMs !== undefined) l.outAtMs += ms;
        if (l.warned) l.warned = Object.fromEntries(Object.entries(l.warned).map(([k, v]) => [k, ms + v]));
        const v = rangeSafety(state, W.pid, ms, l);
        const word = v.stop ? `stop:${v.stop.rule}` : v.warn.length ? `warn:${v.warn.map(w => w.rule).join('+')}` : 'ok';
        lines.push(`${what}: ${word}${v.stop ? ` "${v.stop.text}"` : v.warn.length ? ` "${v.warn[0].text}"` : ''}`);
        assert(word === want, `${what}: ${word}, want ${want}`);
      }
      console.log(`      ${lines.join('\n      ')}`);
      assert(WARN_AGAIN_S === 20, 'WARN_AGAIN_S 20');
    },
  },
  {
    name: 'sitting (0.0.7, the 200 m string) holds the muzzle at STANCE_H.sit and the body\'s span SPAN_M.sit, between kneeling and standing; a casualty lying is a prone span',
    fn() {
      console.log(`      STANCE_H: ${Object.entries(STANCE_H).map(([k, v]) => `${k} ${v}`).join(', ')}; SPAN_M: ${Object.entries(SPAN_M).map(([k, v]) => `${k} ${v[0]}–${v[1]}`).join(', ')}`);
      assert(STANCE_H.sit > STANCE_H.prone && STANCE_H.sit < STANCE_H.stand && SPAN_M.sit[1] > SPAN_M.kneel[1] && SPAN_M.sit[1] < SPAN_M.stand[1], 'sitting between kneeling and standing');
      assert(JSON.stringify(SPAN_M.down) === JSON.stringify(SPAN_M.prone) && STANCE_H.down === STANCE_H.prone, 'a casualty lying as prone');
    },
  },
  {
    name: 'the habit carries no flat "under fire" term of its own (v0.0.9, COMBAT §5: one cause, one entry; the code review): at pressure \'fire\' its DC is the posture\'s as at \'evaluated\', the chaos reaching it only through the roller\'s felt entry; FIRE_DC is gone',
    fn() {
      const dcs = {};
      for (const pressure of ['evaluated', 'fire']) {
        const W = armsWorld({ wh: 4, posture: 'lowReady', coach: false, seed: 91 }), { state, bus, actor } = W;
        state.people.p3 = { id: 'p3', name: { given: 'B', family: 'Walker' }, service: { rank: 'Pvt' } };
        state.actors.list.push({ id: 'a3', who: 'p3', x: actor.x + 1.2, z: actor.z, face: 'left', gait: 'idle' });
        habitStep(state, null, bus, { pressure });
        const r = heard(bus, 'roll').find(f => f.roll.verb === 'habit')?.roll;
        dcs[pressure] = r ? { dc: r.dc, parts: r.dcParts.map(p => `${p.why} ${p.v}`).join(', ') } : null;
      }
      console.log(`      the recruit at low ready, the coach 1.2 m ahead: evaluated DC ${dcs.evaluated?.dc} (${dcs.evaluated?.parts}); 'fire' DC ${dcs.fire?.dc} (${dcs.fire?.parts})`);
      assert(dcs.evaluated && dcs.fire && dcs.fire.dc === dcs.evaluated.dc && !/under fire/.test(dcs.fire.parts), JSON.stringify(dcs));
      assert(!('FIRE_DC' in CARRY), 'FIRE_DC still exported');
    },
  },
];
