// OLYMPUS tests: the DI's close-quarters rules in the house (src/sim/skills/instinct/cqb.js; COMBAT §25.8.3; SKILLS §14; the build sheet 0.0.12 §2.2, §5.2, §8 items 9, 10).
//
// Each rule in a scripted state of the drill's house (tests/drill-world.mjs), its words by tier and its act: every act a
// row the panel has now (the user's rule: never a dead end, every DI line names a row the panel has and T does it), never
// a shot ("T aims and goes off safe but never takes the shot"); cqb-go at rungs 0 and 1 is X go ('leave'), the feet
// unmoved by T (the user, 2026-11-07: "then would move in using movement keys (game unpaused with X)"); the voice the DI's
// below rung 3 and the marine's own from it.
import { assert } from './helpers.mjs';
import { drillWorld } from './drill-world.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { firedNow, instinctAction } from '../src/sim/skills/instinct.js';
import { CQB_RULES } from '../src/sim/skills/instinct/cqb.js';
import { stepOfAct } from '../src/sim/skills/instinct/range.js';
import { setPost } from '../src/sim/people/staff.js';
import { HOUSE1 } from '../src/data/places/wheel.js';

const pick = (g, id) => g.step(1, { act: [{ act: 'stop', args: { step: id } }] });
const settle = (g, s, max = 3000) => { let n = 0; while (n++ < max && !(s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.mind.contact?.pending)) g.step(1); };
const lines = (s) => firedNow(s, s.clock.ms, CQB_RULES);
// (an act as the panel row it names: 'stop:<id>[>target]' found in stepsOf, its id or its id with the door)
function rowOfAct(s, act) {
  const st = stepOfAct(act);
  if (!st) return null;
  // (the aim onto another man ('stop:aim>turner:2'): the rifle's aim or hold row, the bracket moved by the act (cqb.js aimOnto))
  return stepsOf(s).find(r => !r.off && (r.id === st.step || (st.target && r.id === `${st.step}>${st.target}`) || (st.step === 'aim' && st.target && r.id === 'hold'))) ?? null;
}
const seen = [];
function check(s, label, want = null) {
  const L = lines(s);
  for (const l of L) {
    const row = l.act ? rowOfAct(s, l.act) : null;
    seen.push({ label, id: l.id, act: l.act, row: row?.id ?? null, voice: l.voice });
    assert(!l.act || row, `${label}: ${l.id}'s act ${l.act} names no row the panel has`);
    assert(!l.act || !/^stop:(shot:|fire)/.test(l.act), `${label}: ${l.id} acts a shot (${l.act})`);
  }
  if (want) assert(L.some(l => l.id === want), `${label}: ${want} did not fire (${L.map(l => l.id).join(', ')})`);
  return L;
}

export default [
  {
    name: 'at GO, by rung: cqb-stack names the rung\'s row and T does it (Stack up at rung 0, Stack up, take point at 1 and 2, "Open, clear the room" at 3 and 4: one room a press, COMBAT §25.19.2.3), the voice the DI\'s below rung 3 and the marine\'s own from it',
    fn() {
      for (const tier of ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']) {
        const w = drillWorld({ tier }), L = check(w.s, `${tier} at GO`, 'cqb-stack'), l = L.find(x => x.id === 'cqb-stack');
        const words = l.rule.text[l.ctx.words ?? l.ctx.variant] ?? l.rule.text[l.ctx.tier];
        console.log(`      ${tier.padEnd(8)} rung ${w.s.people[w.pid].skills.drills.room.rung} · voice ${l.voice} · act ${l.act} · "${String(words[0]).replace('{ms}', l.ctx.ms)}"`);
        const want = { recruit: 'stack:up', private: 'stack:point', cpl: 'stack:point', sgt: 'room:clear', raider: 'room:clear', tierone: 'room:clear' }[tier];
        assert(l.act === `stop:drill:${want}>o:w4:r1` && l.voice === (['sgt', 'raider', 'tierone'].includes(tier) ? 'self' : 'di'), JSON.stringify({ act: l.act, voice: l.voice }));
      }
    },
  },
  {
    name: 'the recruit\'s way, step by step: stacked, cqb-door is Push it open; the door open, cqb-go is X go and T leaves the mode with the feet unmoved; in the doorway with the keys let go, cqb-funnel says "X, then keys, in." and T is X, as at the open door (the fixer\'s of 0.0.12: the same advice did nothing there)',
    fn() {
      const w = drillWorld({ tier: 'private' }), { g, s } = w;
      pick(g, stepsOf(s).find(r => r.id.startsWith('drill:stack:up>')).id); settle(g, s);
      const door = check(s, 'stacked', 'cqb-door').find(l => l.id === 'cqb-door');
      pick(g, door.act.slice(5).split('>')[0] + '>' + door.act.split('>')[1]); settle(g, s);
      const go = check(s, 'the door open', 'cqb-go').find(l => l.id === 'cqb-go'), at = [w.me().x, w.me().z];
      console.log(`      stacked: ${door.act}; the door open: ${go.act} ("${go.rule.text.keys[0]}")`);
      assert(go.act === 'stop:leave', go.act);
      instinctAction(s, { act: 'instinct', args: { id: 'cqb-go', act: go.act } }, g.bus, {});
      for (let i = 0; i < 20; i++) g.step(1);
      const moved = Math.hypot(w.me().x - at[0], w.me().z - at[1]);
      console.log(`      T: out of the mode ${!s.stop}, the feet moved ${moved.toFixed(3)} m in 1 s with no key`);
      assert(!s.stop && moved < 1e-6, `${!!s.stop} ${moved}`);
      // (in the doorway, still: the funnel's line, no act)
      const plan = w.lane.plans['o:w4:r1'];
      w.me().x = 29.0; w.me().z = 12.0; delete w.me().v;
      g.step(1, { act: [{ act: 'shoot' }] });
      const f = check(s, 'in the door', 'cqb-funnel').find(l => l.id === 'cqb-funnel');
      console.log(`      in the doorway at (29.0, 12.0) (the plane z ${plan.plane.at}): "${f.rule.text.keys[0]}", act ${f.act}`);
      assert(f.act === 'stop:leave', f.act);
    },
  },
  {
    name: 'at the pause: below rung 2 T goes off safe, then aims, never the shot; from rung 2 the line names the row and T does nothing; a bundle cut by the contact is carried on by T once the man is down',
    fn() {
      for (const [tier, safe] of [['private', true], ['private', false], ['sgt', false]]) {
        const w = drillWorld({ tier, safe }), { g, s } = w, t0 = s.clock.ms;
        s.mind.clearing = { room: 'w4.r1', fromMs: t0 }; w.T('1a').turnAtMs = t0 - 2000;
        if (tier === 'private') {
          for (const id of ['drill:stack:up>', 'door:push>']) { pick(g, stepsOf(s).find(r => r.id.startsWith(id)).id); settle(g, s); }
          g.step(1, { act: [{ act: 'shoot' }] });
          for (let i = 0; i < 400 && s.stop?.via !== 'contact'; i++) g.step(1, { mx: -1, mz: -1 });
          settle(g, s);
        } else { pick(g, stepsOf(s).find(r => r.id.startsWith('drill:room:clear>')).id); settle(g, s); }
        const c = check(s, `${tier} at the pause`, 'cqb-contact').find(l => l.id === 'cqb-contact');
        console.log(`      ${tier}${safe ? ' (on safe)' : ''}: ${c.act ?? 'no act'}, voice ${c.voice}: "${c.rule.text[c.ctx.words][0].replace('{hold}', c.ctx.hold)}"`);
        assert(tier === 'sgt' ? c.act === null : c.act === (safe ? 'stop:selector:semi' : 'stop:aim'), c.act);
        if (tier === 'sgt') {
          w.T('1a').stoppedAtMs = s.clock.ms;
          const k = check(s, 'the man down', 'cqb-carryon').find(l => l.id === 'cqb-carryon');
          console.log(`      the man down: ${k.act}`);
          assert(k.act === 'stop:drill:carry', k.act);
        }
      }
    },
  },
  {
    name: 'the hand-backs\' lines name their rows: the #2 not with you (Wait), the inner door (Hold it), the hostage (the aim, "Head only, or hold."); and across every state no act is a shot',
    fn() {
      const w = drillWorld({ tier: 'cpl' }), { s, g } = w;
      // (the #2 far down the hall: Wait; on his slot: no Wait, and T carries on (the fixer's of 0.0.12: T waited for ever on a man in place))
      const twoPid = s.actors.list.find(a => a.who !== w.pid).who;
      setPost(s, twoPid, { key: 'house-two', area: HOUSE1.area, x: 12, z: 13.2, face: 'left', outfit: 'combatSuit' });
      g.step(1);
      s.armoury.range.house = { two: { pid: twoPid, rung: 2, doing: null } };
      s.stop.carry = { from: 'x', bundle: 'room:in', door: 'o:w4:r1', rung: 2, variant: {}, beats: ['door'], why: 'two', words: null, paths: {} };
      const two = check(s, 'two', 'cqb-two').find(l => l.id === 'cqb-two');
      const st2 = w.lane.plans['o:w4:r1'].stack[1], a2 = s.actors.list.find(a => a.who === twoPid);
      a2.x = st2[0]; a2.z = st2[1]; s.people[twoPid].post.x = st2[0]; s.people[twoPid].post.z = st2[1];
      const inPlace = check(s, 'two in place', 'cqb-carryon');
      console.log(`      the #2 on his slot: ${inPlace.map(l => `${l.id}→${l.act}`).join(', ')}`);
      assert(!inPlace.some(l => l.id === 'cqb-two') && inPlace.find(l => l.id === 'cqb-carryon').act === 'stop:drill:carry', JSON.stringify(inPlace.map(l => [l.id, l.act])));
      s.stop.carry = null; delete s.armoury.range.house;
      // (room 2 entered, the closet asked: Hold it)
      const p2 = w.lane.plans['o:w4:r2'];
      w.me().x = p2.points[0][0]; w.me().z = p2.points[0][1];
      s.armoury.range.house = { rooms: [{ id: 'w4.r1', door: 'o:w4:r1', state: 'clear' }, { id: 'w4.r2', door: 'o:w4:r2', state: 'entered', covered: {} }, { id: 'w4.r3', door: 'o:w4:r3', state: 'ahead' }], hall: { id: 'w4.hall', state: 'ahead' } };
      s.stop.carry = { from: 'x', bundle: 'room:dominate', door: 'o:w4:r2', rung: 2, variant: {}, beats: ['sector', 'clear', 'mark'], why: 'door-unplanned', words: null, paths: {} };
      const un = check(s, 'inner door', 'cqb-unplanned').find(l => l.id === 'cqb-unplanned');
      s.stop.carry = null;
      // (the hostage card bracketed, facing)
      const T = w.T('3b'); T.turnAtMs = s.clock.ms - 2000;
      const p3 = w.lane.plans['o:w4:r3'];
      w.me().x = p3.points[0][0]; w.me().z = p3.points[0][1]; s.stop.pick = T.key;
      const h = check(s, 'hostage', 'cqb-hostage').find(l => l.id === 'cqb-hostage');
      console.log(`      two: ${two.act} · inner door: ${un.act} · hostage: ${h.act} ("${h.rule.text[h.ctx.tier][0]}")`);
      assert(two.act === 'stop:wait' && un.act === 'stop:door:hold>o:w4:closet', JSON.stringify({ two: two.act, un: un.act }));
      const acts = seen.filter(x => x.act);
      console.log(`      ${seen.length} lines across the states, ${acts.length} with an act, every act a row: ${[...new Set(acts.map(x => `${x.id}→${x.row}`))].join(', ')}`);
      assert(acts.every(x => x.row && !/^(shot:|fire)/.test(x.row)), 'an act a shot or no row');
    },
  },
];
