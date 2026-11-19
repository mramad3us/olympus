// OLYMPUS tests: your number two and a live grenade (the build sheet v0.0.22 item 9, R2; COMBAT §25.19.5).
//
// Before v0.0.22 nothing of his read a live grenade: cued by your place, he started his entry while it burned (the hunt's recipe on
// 1489397426: the tier one walks into room 1 with his G-11 armed and throws it there, the #2 in at 6,900 ms against the burst at
// 8,500), and at your G-11 slipped at your feet (48229) he stood 0.98 m from it. Now (a) bundle.js runSlot never starts his entry,
// nor his close-up on your heels, into a live grenade (burst.js liveIn: one lying in the room he goes into, or within its stun line
// of his way in), and halts a walk in begun before it came down while he is still short of the doorway, silently, the burst
// letting him go ("the bang, then in"); (b) two.js twoClear runs him clear of one lying where
// its burst would stun him (burst.js stunOn), after his reaction, by bundle.js clearOf, a doing that ends at the burst. The honest
// lanes never meet either: the corporal's flash cell holds its pin. The heavy case is F79 over the kit lanes (tests/flawless-blast.mjs).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { stepAct } from './bots/lib.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { houseNow } from '../src/sim/scenarios/shoothouse.js';
import { handDeviceOf, liveDevices, pouchedOf, setSt } from '../src/sim/arms/devices.js';
import * as KIT from '../src/sim/arms/kit.js';
import { liveIn } from '../src/sim/combat/burst.js';
import { entryPathOf } from '../src/sim/combat/bundle.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { areaOf } from '../src/sim/places/model.js';
import { STUN_KPA } from '../src/sim/arms/blast.js';
import { TWO_CLEAR_STEP } from '../src/sim/combat/two.js';
import { PIN } from './house-pin.test.mjs';
import { botOf } from './flawless.mjs';
import { blastLanes, blastRows, blastFailing } from './flawless-blast.mjs';

const choose = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.stop.reflex;

// (the hunt's recipe: #1 walks into room 1 holding an armed G-11 and throws it there; when the #2 starts his entry against the burst)
function recipe(tier) {
  const g = createGame({ scenario: 'test-shoothouse', seed: 1489397426, tier, setup: 'go', loadout: 'flash' });
  const s = () => g.state, pid = g.state.player.id, H = () => s().armoury.range.house, t = () => s().clock.ms - houseNow(s()).goAtMs;
  const until = (p, n = 4000) => { for (let i = 0; i < n && !p(); i++) g.step(1, {}); if (!p()) throw new Error('timeout'); };
  const rows = () => stepsOf(s()).filter(r => !r.off).map(r => r.id);
  until(() => choose(s()));
  g.step(1, { act: [stepAct('drill:variant:bang')] }); until(() => choose(s()));
  g.step(1, { act: [stepAct(rows().find(id => /^drill:room:clear@flash/.test(id)))] });
  until(() => handDeviceOf(s(), pid)?.st === 'armed');
  g.step(1, { act: ['drill:stop'] }); until(() => choose(s()));
  g.step(1, { act: [stepAct(rows().find(x => /^door:push>o:w4:r1/.test(x)))] }); until(() => choose(s()));
  g.step(1, { act: [stepAct('leave')] });
  for (let i = 0; i < 40; i++) g.step(1, { mx: -0.3, mz: -1 });
  g.step(5, {}); g.step(1, { act: ['ready'] }); until(() => choose(s()));
  g.step(1, { act: [stepAct('dev:throw')] });
  let started = null, fuse = null;
  for (let i = 0; i < 400 && !(H().bursts ?? []).length; i++) { g.step(1, {}); const d = liveDevices(s())[0]; if (d) fuse = s().items[d.id].fuseAtMs - houseNow(s()).goAtMs; if (!started && /^drill:room:in/.test(H().two?.doing?.step ?? '')) started = t(); }
  for (let i = 0; i < 400 && !started; i++) { g.step(1, choose(s()) ? { act: [stepAct('leave')] } : {}); if (/^drill:room:in/.test(H().two?.doing?.step ?? '')) started = t(); }
  const b = H().bursts[0];
  return { tier, burstT: b.atMs - houseNow(s()).goAtMs, fuse, twoEntryT: started, twoKPa: b.kPa[H().twoPid], meKPa: b.kPa[pid] };
}

export default [
  {
    name: 'your #2 never starts his entry into a live grenade: the hunt\'s recipe (1489397426, flash: you walk into room 1 with your G-11 armed and throw it there), on the tier one and the sergeant, his walk in, begun before you threw, is halted short of the doorway and he goes in after its burst, under STUN_KPA: the tier one\'s #2 at 8,550 ms against the burst at 8,500, 2.2 kPa (the build sheet v0.0.22 item 9, R2 a: in at 6,400 ms on this tree before, 6.2 kPa; 6,900 on the hunt\'s)',
    timeoutMs: 60_000,
    fn() {
      const out = ['tierone', 'sgt'].map(recipe);
      console.log(`      ${out.map(o => `${o.tier}: the burst at ${o.burstT} ms, his entry at ${o.twoEntryT} ms, ${o.twoKPa} kPa on him (${o.meKPa} on you)`).join('; ')}`);
      assert(out.every(o => o.twoEntryT !== null && o.twoEntryT >= o.burstT && (o.twoKPa ?? 0) < STUN_KPA), JSON.stringify(out));
    },
  },
  {
    name: 'your #2 runs clear of your G-11 slipped at your feet: the boot recruit on 48229 (the kit bot by the keys, Get clear taken), his clear begun after his reaction and his peak under STUN_KPA, never onto your stack point beside it (the build sheet v0.0.22 item 9, R2 b: he stood 0.98 m from it, 38.7 kPa, and closed up on your heels as you ran, 321.3)',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48229, tier: 'recruit', setup: 'go', loadout: 'flash' }), H = g.state.armoury.range.house;
      let clear = null, heels = false, rel = null;
      runHouse(g, houseKitBot({ use: 'flash', base: 'keys' }), { maxMs: 13_000, each: (game) => {
        const st = game.state, d = liveDevices(st).find(x => x.kind === 'grenade'), step = H.two?.doing?.step ?? '';
        if (d && rel === null) rel = st.items[d.id].flight?.fromMs ?? null;
        if (d && /^drill:heels/.test(step)) heels = true;
        if (step === TWO_CLEAR_STEP && !clear) clear = { t: st.clock.ms - H.goAtMs, afterRelMs: st.clock.ms - rel, to: H.two.doing.beats[0].path.at(-1) };
      } });
      const b = (H.bursts ?? []).find(x => x.atFeet), a = g.state.actors.list.find(x => x.who === H.twoPid);
      console.log(`      the slip's burst at ${b?.atMs - H.goAtMs} ms, ${b?.kPa?.[H.twoPid]} kPa on him at ${Math.hypot(a.x - b?.x, a.z - b?.z).toFixed(2)} m; his clear ${JSON.stringify(clear)}; on your heels over it ${heels}`);
      assert(b && clear && clear.afterRelMs > 0 && (b.kPa[H.twoPid] ?? 0) < STUN_KPA && !heels, JSON.stringify({ b, clear, heels }));
    },
  },
  {
    name: 'the honest lanes never meet the hold or the clear: the corporal\'s flash lane on 48213 by the kit bot reaches its card on its pin cell\'s tick (the build sheet v0.0.22 item 9, R2: no cell moves)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', loadout: 'flash' });
      let clears = 0;
      runHouse(g, botOf('kit:flash', { seed: 48213 }), { maxMs: 30 * 60_000, each: (game) => { if (game.state.armoury.range.house.two?.doing?.step === TWO_CLEAR_STEP) clears++; } });
      const want = PIN['kit:flash/cpl/48213/flash'][0];
      console.log(`      to tick ${g.state.clock.tick} (the pin's ${want}); his clear ticks ${clears}`);
      assert(g.state.clock.tick === want && !clears, JSON.stringify({ tick: g.state.clock.tick, want, clears }));
    },
  },
  {
    // (after A's merge: layout B's room 3 is the twin, its back room behind a leafless 1.2 m doorway (A's chunks); burst.js liveIn reads
    // the burst's room through burstRoom, whose `in` joins rooms through a doorway, so a grenade in the back room holds an entry into the
    // front. The G-11 is laid there from your pouch, live with 3 s of fuse, on the tick you stand on your stack at room 3, before his walk in)
    name: 'a live G-11 in the twin\'s back room holds your #2\'s entry into its front room till its burst, the back room one space with the front through its doorway (layout B on 48213, the tier one by the honest bot, the grenade laid as you stack on room 3; the build sheet v0.0.22 §0 item 27, §10: without the hold he went in at 26,950 ms against its burst at 29,000)',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', loadout: 'flash', layout: 'B' }), pid = g.state.player.id, H = g.state.armoury.range.house;
      const L3 = H.rooms[2], P = lanePlanOf(g.state).plans[L3.door], back = areaOf(g.state.places.live.area).rooms.find(r => /-back$/.test(r.id));
      let laid = null, entry = null, nb = 0, burst = null;
      runHouse(g, houseHonestBot(), { maxMs: 30 * 60_000, each: (game) => {
        const st = game.state, me = st.actors.list.find(a => a.who === pid), now = st.clock.ms;
        if (!laid && H.cur === 2 && me && Math.hypot(me.x - P.stack[0][0], me.z - P.stack[0][1]) <= 0.5 && !/^drill:room:in/.test(H.two?.doing?.step ?? '')) {
          const d = pouchedOf(st, pid, 'g11'), at = [(back.rect[0] + back.rect[2]) / 2 + 1.0, (back.rect[1] + back.rect[3]) / 2];
          KIT.move(st, d.id, { ground: { area: st.places.live.area, x: at[0], z: at[1] } }); setSt(st, d.id, 'live');
          Object.assign(st.items[d.id], { fuseAtMs: now + 3000, byId: pid, flight: { x0: me.x, z0: me.z, x1: at[0], z1: at[1], fromMs: now, landMs: now } });
          laid = { t: now - H.goAtMs, at, id: d.id, held: !!liveIn(st, P, entryPathOf(P, 2)) };
        }
        if (laid && !entry && new RegExp(`^drill:room:in>${L3.door}`).test(H.two?.doing?.step ?? '')) entry = now - H.goAtMs;
        const bs = H.bursts ?? [];
        while (nb < bs.length) { const b = bs[nb++]; if (laid && b.id === laid.id) burst = { t: b.atMs - H.goAtMs, room: b.room, two: b.kPa[H.twoPid] ?? 0 }; }
      } });
      console.log(`      ${H.draw?.layout ?? 'set'} room 3 (${L3.room}, back room ${back?.id}): laid at ${laid?.t} ms in the back room (${laid?.at?.join(', ')}), liveIn for the front ${laid?.held}; the burst at ${burst?.t} ms in ${burst?.room}, ${burst?.two} kPa on him; his entry at ${entry} ms; the lane ${H.end?.why}`);
      assert(back && laid?.held && burst && entry !== null && entry >= burst.t && burst.two < STUN_KPA && H.end?.why, JSON.stringify({ laid, burst, entry, end: H.end }));
    },
  },
  {
    name: 'F79 (heavy): nobody into a live grenade, over the kit lanes (the kit bot, T and the fuzz, every sheet, twelve seeds, the flash and full loadouts): no entry of your #2 begun into one, his peak at STUN_KPA only from one within its stun line of him (the build sheet v0.0.22 §8)',
    heavy: true,
    timeoutMs: 1_200_000,
    fn() {
      const lanes = [...blastLanes(), ...blastLanes({ bots: ['fuzz'], seeds: [48214, 48216, 48218, 48220, 48224], loadouts: ['flash', 'full'] })];
      const rows = blastRows(lanes), f79 = rows.find(r => r.id === 'F79');
      console.log(`      F79 ${f79.met ? 'MET' : 'NOT MET'}: ${f79.value}`);
      assert(!blastFailing([f79]).length, blastFailing([f79]).join('; '));
    },
  },
];
