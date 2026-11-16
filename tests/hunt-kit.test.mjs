// OLYMPUS tests: the hunt of v0.0.18's kit findings, fixed on v0.0.19 (the build of v0.0.20; .run/hunt-v018/findings.md kit-1 to kit-9, look-4).
//
// Each test is the hunt's own recipe, cut to what it pins, and fails without its fix: a device in a hand keeps the rifle on its sling
// (Up struck, the gun refusing it, the drill's posture held) and T names the device's own way (kit-3, look-4), at the lane's end the
// instructor makes it safe with a fault (kit-3); no throw or cook through a shut door (kit-4); a charge on the leaf strikes the
// door's other ways in and T finishes the breach (kit-6); the bracket on a man out of the frame is no aim, T's "In." carries on
// (kit-7); a kick that held is kicked again by a row T can press, and never named over another way (kit-8); #1 tells a pried pull
// door "Opens out" (kit-1); a G-11 burst on the stack past BREACH_SAFE_KPA is a fault (kit-9); a G-11 thrown from inside room 1 lands
// in it, the #2 under STUN_KPA (kit-5, gone in v0.0.19, pinned here for the G-11 as tests/throw.test.mjs pins it for the G-9P).
// The review of those fixes added: T never "finishes" a practice frag or concussion into a room the brief did not call hostiles only;
// a charge on the leaf strikes the drill's rows that open it another way, not the door's singles only, and the cycle offers none;
// the #2 held at his safe point comes with you once the leg is passed, and the door beat never waits on him there; a throw beat at
// a shut door hands back; Open, Kick and Pry struck in breach.js entryOptions; a stun under the fault's line is a mark.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { runHouse, houseHonestBot } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { houseNow } from '../src/sim/scenarios/shoothouse.js';
import { handDeviceOf, MISFIRE_WAIT_MS } from '../src/sim/arms/devices.js';
import { doAction } from '../src/sim/arms/firearms.js';
import { openingState, setOpening } from '../src/sim/places/model.js';
import { STUN_KPA, BREACH_SAFE_KPA } from '../src/sim/arms/blast.js';
import { drawStands } from '../src/sim/scenarios/shoothouse.js';
import { entryOptions } from '../src/sim/combat/breach.js';
import { doorNow } from '../src/sim/combat/bundle.js';

const choose = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.stop.reflex;
function lane({ tier, seed, loadout, strict = true }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go', loadout, strict });
  const s = () => g.state, pid = g.state.player.id;
  const until = (p, n = 6000) => { for (let i = 0; i < n && !p(); i++) g.step(1, {}); if (!p()) throw new Error('timeout'); };
  const live = () => stepsOf(s()).filter(r => !r.off).map(r => r.id), row = (id) => stepsOf(s()).find(r => r.id === id) ?? null;
  const press = (id) => { g.step(1, { act: [stepAct(id)] }); until(() => choose(s())); };
  const t = () => s().clock.ms - (houseNow(s()).goAtMs ?? 0), posture = () => s().people[pid].kit.carry?.posture, line = () => instinctNow(s())?.line ?? null;
  until(() => choose(s()));
  return { g, s, pid, until, live, row, press, t, posture, line };
}
// (the flash bundle Backspaced once its pin is out: on the tier one the arm runs before the door, so the door is still shut)
function armedAtShutDoor(L) {
  L.press('drill:variant:bang');
  L.g.step(1, { act: [stepAct(L.live().find(id => /^drill:room:clear@flash/.test(id)))] });
  L.until(() => handDeviceOf(L.s(), L.pid)?.st === 'armed');
  L.g.step(1, { act: ['drill:stop'] }); L.until(() => choose(L.s()));
}
// (the SC-1 placed on room 1's door by "Clear the room" @charge and Backspaced at "Placing.")
const chargeOf = (L) => Object.values(L.s().items).find(v => v.type === 'charge' && ['placed', 'primed', 'misfire'].includes(v.st));
function chargeLeft(L) {
  for (let k = 0; k < 4 && !L.live().some(x => /^drill:room:clear@charge/.test(x)); k++) L.press('drill:variant:breach');
  L.g.step(1, { act: [stepAct(L.live().find(x => /^drill:room:clear@charge/.test(x)))] });
  L.until(() => chargeOf(L)?.st === 'placed');
  L.g.step(1, { act: ['drill:stop'] }); L.until(() => choose(L.s()));
}
// (a row live now that would open the leaf another way than the charge: the door's hand, or a drill row whose plan breaches otherwise)
const otherWays = (L) => stepsOf(L.s()).filter(r => !r.off && (/^door:(push|pull|kick)>/.test(r.id) || (r.kind === 'bundle' && r.variant?.breach && r.variant.breach !== 'charge'))).map(r => r.id);

export default [
  {
    name: 'an armed G-11 in the hand keeps the rifle on its sling: Rifle up struck "hands full: the G-11", the gun refusing up, "Clear the room" with no bang struck and a Watch held slung; T names the flash drill that throws it, never "Get it up." (the hunt of v0.0.18, kit-3: Up took the rifle to the low ready with the grenade in the strong hand)',
    timeoutMs: 60_000,
    fn() {
      const L = lane({ tier: 'tierone', seed: 48214, loadout: 'flash', strict: false });
      armedAtShutDoor(L);
      const up = L.row('up'), T = L.line(), save = L.g.save();
      const refused = doAction(L.s(), null, { pid: L.pid, gunId: L.s().stop.gun, action: 'up' });
      L.g.load(save); L.press('watch:r1:nl'); const watched = L.posture();
      L.g.load(save); L.press('drill:variant:bang');
      const plain = L.row('drill:room:clear>o:w4:r1'), T2 = L.line();
      console.log(`      Up ${JSON.stringify({ off: up?.off })}; the gun: ${refused.text}; T "${T?.text}" ${T?.act}; after a Watch ${watched}; no bang: Clear the room ${JSON.stringify({ off: plain?.off })}, T "${T2?.text}" ${T2?.act}`);
      assert(up?.off === 'hands full: the G-11' && refused.refused && /G-11/.test(refused.text), JSON.stringify({ up: up?.off, refused }));
      assert(T?.id === 'cqb-hands' && /^stop:drill:(carry|room:clear@flash)/.test(T.act ?? '') && watched === 'slungFront', JSON.stringify({ T, watched }));
      assert(plain?.off === 'hands full: the G-11' && T2?.act && T2.act !== 'stop:up', JSON.stringify({ plain: plain?.off, T2 }));
      // (T's act taken: the G-11 thrown by the drill, the rifle up only after it)
      L.g.load(save); L.press(T.act.slice(5));
      assert(!handDeviceOf(L.s(), L.pid) && L.posture() !== 'slungFront', JSON.stringify({ hand: handDeviceOf(L.s(), L.pid), posture: L.posture() }));
    },
  },
  {
    name: 'the halligan held after a pry that would not give keeps the rifle slung: on the private\'s breach lane (seed 48213, the kit bot) no tick has a device in the hand with the rifle off its sling, and T never says Up over it (the hunt of v0.0.18, look-4: T\'s "Get it up." put the rifle at the low ready with the bar in hand for 1.05 s)',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go', loadout: 'breach' }), pid = g.state.player.id;
      let held = 0, bad = [], ups = [];
      runHouse(g, houseKitBot({ use: 'breach' }), { maxMs: 8 * 60_000, each: (game) => {
        const s = game.state, h = handDeviceOf(s, pid), p = s.people[pid].kit.carry?.posture ?? 'slungFront';
        if (!h) return;
        held++;
        if (p !== 'slungFront' && p !== 'slungBack' && bad.length < 5) bad.push({ ms: s.clock.ms, h: h.model, p });
        const T = choose(s) ? instinctNow(s)?.line : null;
        if (T?.act === 'stop:up' && ups.length < 5) ups.push({ ms: s.clock.ms, text: T.text });
      } });
      console.log(`      ticks with a device in the hand ${held}; the rifle off its sling with it ${bad.length}; T's Up over it ${ups.length}; lane ${g.state.armoury.range.house.end?.why}`);
      assert(held > 0 && !bad.length && !ups.length, JSON.stringify({ held, bad, ups }));
    },
  },
  {
    name: 'an armed G-11 still in the hand at the lane\'s end is a fault, "PIN OUT AT THE END", and the instructor pins and pouches it: the card is reached with the hands empty (the hunt of v0.0.18, kit-3: chaos lanes reached the card holding it, F29)',
    timeoutMs: 120_000,
    fn() {
      const L = lane({ tier: 'tierone', seed: 48214, loadout: 'flash', strict: false });
      armedAtShutDoor(L);
      const id = handDeviceOf(L.s(), L.pid).id, H = L.s().armoury.range.house;
      for (let k = 0; k < 60 && !H.end; k++) L.press('wait');
      const legs = [...H.rooms, H.hall], f = legs.flatMap(x => x.faults).filter(x => x.kind === 'pin'), marks = legs.flatMap(x => x.kit ?? []).filter(m => /PIN OUT/.test(m));
      console.log(`      lane ${H.end?.why} at ${(L.t() / 1000).toFixed(1)} s; hands ${JSON.stringify(L.s().people[L.pid].kit.hands)}; the G-11 ${L.s().items[id]?.st ?? 'pouched'}; faults ${JSON.stringify(f.map(x => x.text))}; marks ${JSON.stringify(marks)}`);
      assert(H.end && !handDeviceOf(L.s(), L.pid) && L.s().items[id] && !L.s().items[id].st && f.length === 1 && marks.length === 1, JSON.stringify({ end: H.end, hand: handDeviceOf(L.s(), L.pid), st: L.s().items[id]?.st, f, marks }));
    },
  },
  {
    name: 'no throw through a shut door: with the G-11 armed at room 1\'s shut door, Throw it is struck "door shut" (Pin back in live), a press of it throws nothing and nothing bursts in room 1 while its leaf is closed (the hunt of v0.0.18, kit-4: it burst at (28.746, 8.905) in w4.r1 with the door shut)',
    timeoutMs: 60_000,
    fn() {
      const L = lane({ tier: 'tierone', seed: 1489397426, loadout: 'flash' });
      armedAtShutDoor(L);
      const thr = L.row('dev:throw'), pin = L.row('dev:repin'), shut = openingState(L.s(), 'o:w4:r1');
      L.g.step(1, { act: [stepAct('dev:throw')] });
      for (let k = 0; k < 200; k++) L.g.step(1, {});
      const B = L.s().armoury.range.house.bursts ?? [];
      console.log(`      door ${shut}; Throw it ${JSON.stringify({ off: thr?.off })}; Pin back in ${JSON.stringify({ off: pin?.off })}; after a press of Throw it: the hand ${handDeviceOf(L.s(), L.pid)?.st}, bursts ${B.length}`);
      assert(shut !== 'open' && thr?.off === 'door shut' && pin && !pin.off && handDeviceOf(L.s(), L.pid)?.st === 'armed' && !B.length, JSON.stringify({ shut, thr: thr?.off, pin: pin?.off, B }));
    },
  },
  {
    name: 'a charge on the door strikes its push and kick ("a charge is on the door") and T finishes the breach: Backspace at "Placing." on room 1\'s SC-1, T\'s act is the charge\'s row and the door is blown by it (the hunt of v0.0.18, kit-6: Push left the door shut, the #2 held at his safe point, "Wait." to the lane\'s end at 363 s)',
    timeoutMs: 60_000,
    fn() {
      for (const tier of ['tierone', 'sgt']) {
        const L = lane({ tier, seed: 1489397426, loadout: 'breach' }), charge = () => Object.values(L.s().items).find(v => v.type === 'charge' && ['placed', 'primed'].includes(v.st));
        for (let k = 0; k < 4 && !L.live().some(x => /^drill:room:clear@charge/.test(x)); k++) L.press('drill:variant:breach');
        L.g.step(1, { act: [stepAct(L.live().find(x => /^drill:room:clear@charge/.test(x)))] });
        L.until(() => charge()?.st === 'placed');
        L.g.step(1, { act: ['drill:stop'] }); L.until(() => choose(L.s()));
        const door = stepsOf(L.s()).filter(r => /^door:(push|pull|kick)>o:w4:r1$/.test(r.id)).map(r => [r.id, r.off]), T = L.line();
        if (T?.act) L.press(T.act.slice(5));
        const blown = (L.s().armoury.range.house.bursts ?? []).some(b => b.model === 'sc1' && b.door === 'o:w4:r1');
        console.log(`      ${tier}: door rows ${JSON.stringify(door)}; T "${T?.text}" ${T?.act}; blown ${blown}, the door ${openingState(L.s(), 'o:w4:r1')}`);
        assert(door.length && door.every(([, off]) => off === 'a charge is on the door') && /^stop:drill:room:clear@charge/.test(T?.act ?? '') && blown, JSON.stringify({ tier, door, T, blown }));
      }
    },
  },
  {
    name: 'the bracket on a man out of the frame is no aim: "Clear the room" chosen at room 1\'s first contact pause and Backspaced, T says "In." and carries on, on the tier one, the sergeant and the raider (the hunt of v0.0.18, kit-7: no line for the rest of the leg)',
    timeoutMs: 60_000,
    fn() {
      const out = [];
      // (the hunt's noline3 recipe: T at GO, its first pause, the room's row and Backspace after each gap (ms))
      for (const [tier, seed, flash, loadout, gaps] of [['tierone', 1489397426, false, 'standard', [300]], ['sgt', 48219, true, 'flash', [300, 400]], ['raider', 1037, false, 'breach', [300]]]) {
        const L = lane({ tier, seed, loadout }), settle = () => { L.until(() => choose(L.s())); L.g.step(3, {}); };
        L.g.step(3, {});
        const T0 = L.line(); L.g.step(1, { act: [{ act: 'instinct', args: { id: T0.id, act: T0.act } }] }); settle();
        if (flash) { L.g.step(1, { act: [stepAct('drill:variant:bang')] }); settle(); }
        L.g.step(1, { act: [stepAct(L.live().find(x => /^drill:room:clear/.test(x)))] });
        for (const ms of gaps) { L.g.step(Math.round(ms / 50), {}); L.g.step(1, { act: ['drill:stop'] }); }
        settle();
        const T = L.line();
        out.push({ tier, at: L.t(), id: T?.id, text: T?.text, act: T?.act });
      }
      console.log(`      ${out.map(o => `${o.tier} ${o.at} ms: ${o.id} "${o.text}" ${o.act}`).join('; ')}`);
      assert(out.every(o => o.act === 'stop:drill:carry'), JSON.stringify(out));
    },
  },
  {
    name: 'a kick that held at room 3 is kicked again by a row T presses, and the way set to Pry is no "Kick it again": the sergeant\'s breach lane on seed 48243 (the hunt of v0.0.18, kit-8: "Again. Kick it." with no act, #1 1.51 m from the door, out of its Kick row\'s reach)',
    timeoutMs: 120_000,
    fn() {
      // (seed 48243 from v0.0.20's integration: the four roles' timings and your #2's P-12 moved the kick's dice, and on 48228 room 3's
      // kick opened the door; on 48243 it holds (on the roles' tree without his P-12 it held on 48229, and T's "Again. Kick it." had
      // no act there before the hunt's fix))
      const g = createGame({ scenario: 'test-shoothouse', seed: 48243, tier: 'sgt', setup: 'go', loadout: 'breach' }), bot = houseHonestBot(), s = () => g.state;
      for (let i = 0; i < 20000; i++) { if (choose(s()) && houseNow(s()).cur === 2 && stepsOf(s()).some(r => /^drill:variant:breach/.test(r.id) && !r.off)) break; g.step(1, bot); }
      const room = () => stepsOf(s()).find(r => /^drill:room:clear/.test(r.id) && !r.off)?.id ?? '', settle = () => { for (let j = 0; j < 2000 && !choose(s()); j++) g.step(1, {}); };
      for (let k = 0; k < 5 && !/@kick/.test(room()); k++) { g.step(1, { act: [stepAct('drill:variant:breach')] }); settle(); }
      g.step(1, { act: [stepAct(room())] }); settle();
      const held = s().stop?.carry?.why, T = instinctNow(s())?.line, save = g.save();
      g.step(1, { act: [stepAct('drill:variant:breach')] }); settle();
      const pry = room(), T2 = instinctNow(s())?.line;
      g.load(save); g.step(1, { act: [stepAct(T.act.slice(5))] }); settle();
      const open = openingState(s(), 'o:w4:r3');
      console.log(`      held: ${held}; T "${T?.text}" ${T?.act}; the door after it ${open}; the way to ${pry}: T ${T2?.id} "${T2?.text}" ${T2?.act}`);
      assert(held === 'refused' && T?.id === 'cqb-locked' && T.act && open === 'open', JSON.stringify({ held, T, open }));
      assert(/@pry/.test(pry) && !/kick/i.test(T2?.text ?? '') && T2?.act, JSON.stringify({ pry, T2 }));
    },
  },
  {
    name: '#1 tells a pried pull door "Opens out": room 2 on the tier one\'s breach lane (seed 1489397426, the kit bot) (the hunt of v0.0.18, kit-1: "Opens in, I go left." under "Pull door, hinge right.")',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1489397426, tier: 'tierone', setup: 'go', loadout: 'breach' }), pid = g.state.player.id, tells = [];
      runHouse(g, houseKitBot({ use: 'breach' }), { maxMs: 4 * 60_000, each: (game) => {
        for (const f of game.facts('say')) if (f.who === pid && /^(Opens|Kicking)/.test(f.text)) tells.push({ text: f.text, door: houseNow(game.state).cur, pry: !!game.state.stop?.doing?.beats?.some(b => b.k === 'force') });
      } });
      const r2 = tells.filter(x => x.door === 1);
      console.log(`      the tells: ${tells.map(x => `leg ${x.door}${x.pry ? ' (pry)' : ''}: ${x.text}`).join('; ')}`);
      assert(r2.length && r2.some(x => x.pry) && r2.every(x => /^Opens out/.test(x.text)), JSON.stringify(tells));
    },
  },
  {
    name: 'a G-11 burst on the stack past BREACH_SAFE_KPA is a fault, "STACK IN THE BLAST 30 KPA": the boot recruit\'s own short flash at room 1 (seed 1489397426, the kit bot by the keys) (the hunt of v0.0.18, kit-9: 29.8 kPa and a 2.4 s stun, no mark)',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1489397426, tier: 'recruit', setup: 'go', loadout: 'flash' }), pid = g.state.player.id, H = g.state.armoury.range.house;
      runHouse(g, houseKitBot({ use: 'flash', base: 'keys' }), { maxMs: 60_000 });
      const B = H.bursts?.[0], L0 = H.rooms[0];
      console.log(`      the burst ${B?.model} at (${B?.x}, ${B?.z}), ${B?.kPa?.[pid]} kPa on you; room 1 faults ${JSON.stringify(L0.faults.map(f => f.kind))}, marks ${JSON.stringify(L0.kit)}`);
      assert(B?.model === 'g11' && B.kPa[pid] > 27.6 && L0.faults.some(f => f.kind === 'blast') && L0.kit.some(m => /^STACK IN THE BLAST \d+ KPA$/.test(m)), JSON.stringify({ B, faults: L0.faults, kit: L0.kit }));
    },
  },
  {
    name: 'a G-11 thrown from inside room 1 lands in room 1, the #2 under STUN_KPA at its burst (the hunt of v0.0.18, kit-5: from past the door\'s line it was thrown back onto the stack, 49.4 kPa on the #2; fixed in v0.0.19 by bundle.js stackSideOf, pinned here for the G-11)',
    timeoutMs: 60_000,
    fn() {
      const L = lane({ tier: 'tierone', seed: 1489397426, loadout: 'flash' });
      armedAtShutDoor(L);
      L.press('door:push>o:w4:r1');
      L.g.step(1, { act: [stepAct('leave')] });
      for (let k = 0; k < 40; k++) L.g.step(1, { mx: -0.3, mz: -1 });
      L.g.step(1, { act: ['ready'] }); L.until(() => choose(L.s()));
      const a = L.s().actors.list.find(x => x.who === L.pid), from = [a.x, a.z];
      L.g.step(1, { act: [stepAct('dev:throw')] });
      const H = L.s().armoury.range.house;
      for (let k = 0; k < 200 && !(H.bursts ?? []).length; k++) L.g.step(1, {});
      const B = H.bursts?.[0], two = H.twoPid;
      console.log(`      thrown from (${from.map(v => v.toFixed(2))}); the burst in ${B?.room} at (${B?.x}, ${B?.z}); kPa you ${B?.kPa?.[L.pid]}, the #2 ${B?.kPa?.[two]}`);
      assert(from[1] < 12 && B?.room === 'w4.r1' && B.z < 12 && (B.kPa[two] ?? 0) < STUN_KPA, JSON.stringify({ from, B }));
    },
  },
  // ---- the review of the hunt fixes (2026-11-16) ----
  {
    name: 'T never finishes a practice frag or concussion into a room with a family: on the sergeant\'s seeds 48214, 48215 and 48217 (a no-shoot in room 1, the brief\'s "unknown") an armed G-9P or G-13P Backspaced at "Pin out." is T\'s Pin back in, nothing bursts and no \'fragged\' or \'concussed\' fault; on 1222, room 1 hostiles only, T still finishes the drill (the review of the hunt fixes, finding 1: "Finish it: Carry on" threw the frag, the \'fragged\' fault)',
    timeoutMs: 120_000,
    fn() {
      const out = [];
      const armed = (seed, loadout, bang) => {
        const L = lane({ tier: 'sgt', seed, loadout }), re = new RegExp(`^drill:room:clear@[^>]*${bang}`);
        for (let k = 0; k < 5 && !L.live().some(x => re.test(x)); k++) L.press('drill:variant:bang');
        L.g.step(1, { act: [stepAct(L.live().find(x => re.test(x)))] });
        L.until(() => handDeviceOf(L.s(), L.pid)?.st === 'armed');
        L.g.step(1, { act: ['drill:stop'] }); L.until(() => choose(L.s()));
        return L;
      };
      for (const seed of [48214, 48215, 48217]) for (const [loadout, bang] of [['frag', 'frag'], ['conc', 'conc']]) {
        const d = drawStands(seed);
        assert(['1a', '1b'].some(k => d[k].face === 'noshoot' || d[k].face === 'hostage'), `seed ${seed} has no family in room 1`);
        const L = armed(seed, loadout, bang), T = L.line(), H = L.s().armoury.range.house;
        if (T?.act) L.g.step(1, { act: [{ act: 'instinct', args: { id: T.id, act: T.act } }] });
        L.g.step(400, {});
        const faults = [...H.rooms, H.hall].flatMap(x => x.faults.map(f => f.kind));
        out.push({ seed, loadout, T: `${T?.id}/${T?.variant} ${T?.act}`, bursts: (H.bursts ?? []).length, faults, hand: handDeviceOf(L.s(), L.pid)?.st ?? null });
      }
      const L = armed(1222, 'frag', 'frag'), T = L.line();
      console.log(`      ${out.map(o => `${o.seed} ${o.loadout}: T ${o.T}, bursts ${o.bursts}, faults ${JSON.stringify(o.faults)}, hand ${o.hand}`).join('; ')}`);
      console.log(`      1222 (room 1 ${L.s().armoury.range.house.intel?.['o:w4:r1']}): T ${T?.id}/${T?.variant} ${T?.act}`);
      assert(out.every(o => o.T === 'cqb-hands/hands stop:dev:repin' && !o.bursts && !o.faults.some(f => f === 'fragged' || f === 'concussed') && o.hand === null), JSON.stringify(out));
      assert(T?.id === 'cqb-hands' && T.variant === 'use' && /^stop:drill:/.test(T.act ?? ''), JSON.stringify(T));
    },
  },
  {
    name: 'a charge on the door strikes the drill\'s rows that would open it another way, not only the door\'s: Backspace at "Placing.", no row live opens room 1\'s leaf but by the charge, the way in has no cycle, T\'s act is the charge\'s row, and the honest bot then clears the lane with no \'charge\' fault, on the tier one and the sergeant; over the #2\'s own charge (his breacher task) no row of yours opens the leaf, the room\'s waiting on his blast (the review of the hunt fixes, finding 2: @push, @kick and @pry live, T naming them, the leaf opened over the SC-1)',
    timeoutMs: 180_000,
    fn() {
      const out = [];
      for (const tier of ['tierone', 'sgt']) {
        const L = lane({ tier, seed: 1489397426, loadout: 'breach' });
        chargeLeft(L);
        const other = otherWays(L), cycle = L.row('drill:variant:breach'), T = L.line(), H = L.s().armoury.range.house;
        runHouse(L.g, houseHonestBot(), { maxMs: 10 * 60_000 });
        const faults = [...H.rooms, H.hall].flatMap(x => x.faults.map(f => f.kind));
        out.push({ tier, other, cycle: cycle?.label ?? null, T: T?.act, end: H.end?.why, s: ((H.end?.atMs - H.goAtMs) / 1000).toFixed(1), faults });
      }
      console.log(`      ${out.map(o => `${o.tier}: other ways live ${JSON.stringify(o.other)}, the cycle ${o.cycle}; T ${o.T}; end ${o.end} at ${o.s} s, faults ${JSON.stringify(o.faults)}`).join('; ')}`);
      assert(out.every(o => !o.other.length && o.cycle === null && /^stop:drill:room:clear@charge/.test(o.T ?? '') && o.end === 'clear' && !o.faults.includes('charge')), JSON.stringify(out));
      // (the #2's charge: placed by him on your word, "Breacher up: charge"; your rows open nothing over it, the room's waits on his
      // blast (its cue), and the leaf is opened by the SC-1)
      const L = lane({ tier: 'tierone', seed: 1489397426, loadout: 'breach' }), H = L.s().armoury.range.house;
      L.press('drill:stack:point>o:w4:r1');
      for (let k = 0; k < 5 && L.row('drill:team:breach@charge>o:w4:r1')?.off !== null; k++) L.press('wait');
      L.g.step(1, { act: [stepAct('drill:team:breach@charge>o:w4:r1')] });
      L.until(() => chargeOf(L)?.st === 'placed');
      if (!choose(L.s())) { L.g.step(1, { act: ['drill:stop'] }); L.until(() => choose(L.s())); }
      const by = chargeOf(L)?.byId, other = otherWays(L), room = L.row('drill:room:clear>o:w4:r1');
      L.g.step(1, { act: [stepAct(room.id)] });
      let openAt = null, blastAt = null;
      for (let i = 0; i < 600 && openAt === null; i++) { L.g.step(1, {}); if (blastAt === null && (H.bursts ?? []).some(b => b.model === 'sc1')) blastAt = L.s().clock.ms; if (openingState(L.s(), 'o:w4:r1') === 'open') openAt = L.s().clock.ms; }
      console.log(`      the #2's charge (by ${by === H.twoPid ? 'him' : by}): other ways live ${JSON.stringify(other)}; Clear the room ${JSON.stringify({ breach: room?.variant?.breach ?? null, off: room?.off })}; the leaf open at the SC-1's blast ${openAt !== null && openAt === blastAt}`);
      assert(by === H.twoPid && !other.length && !room?.off && !room?.variant?.breach && openAt !== null && openAt === blastAt, JSON.stringify({ by, other, room: room?.variant, openAt, blastAt }));
    },
  },
  {
    name: 'a charge left on room 1 and the leg passed by the stall: the #2 held at his safe point comes with you, and the honest bot clears the lane in under 200 s (the review of the hunt fixes, finding 3 (a): without runSlot\'s release the lane ran to "passed" at 375 s, "Wait." 18 times)',
    timeoutMs: 180_000,
    fn() {
      const L = lane({ tier: 'tierone', seed: 1489397426, loadout: 'breach' }), H = L.s().armoury.range.house;
      chargeLeft(L);
      let n = 0;
      while (houseNow(L.s()).cur === 0 && n++ < 40) { L.g.step(1, { act: [stepAct('wait')] }); L.until(() => choose(L.s()) || houseNow(L.s()).cur !== 0, 20000); }
      const held = JSON.stringify(H.two?.safe ?? null);
      L.g.step(20, {});
      const after = H.two?.safe ?? null;
      runHouse(L.g, houseHonestBot(), { maxMs: 10 * 60_000 });
      const s = (H.end?.atMs - H.goAtMs) / 1000;
      console.log(`      leg ${houseNow(L.s()).legs.map(v => v.state).join(' ')} after ${n} Waits; the #2's hold ${held}, a second later ${JSON.stringify(after)}; end ${H.end?.why} at ${s.toFixed(1)} s`);
      assert(houseNow(L.s()).legs[0].state === 'passed' && after === null && H.end?.why === 'clear' && s < 200, JSON.stringify({ after, end: H.end, s }));
    },
  },
  {
    name: 'the door beat never waits on a #2 held at his charge\'s safe point: room 1\'s SC-1 a believed misfire past its 30 s wait, "Clear the room" @push opens the leaf in under 1.5 s with no hand-back (the review of the hunt fixes, finding 3 (b): without it the beat waited on him, "Wait." to "passed" at 363 s)',
    timeoutMs: 60_000,
    fn() {
      const L = lane({ tier: 'sgt', seed: 1489397426, loadout: 'breach' }), H = L.s().armoury.range.house;
      chargeLeft(L);
      const c = chargeOf(L); c.st = 'misfire'; c.misAtMs = L.s().clock.ms - MISFIRE_WAIT_MS - 50;
      for (let k = 0; k < 6 && !L.live().some(x => /^drill:room:clear@push/.test(x)); k++) L.press('drill:variant:breach');
      const id = L.live().find(x => /^drill:room:clear@push/.test(x)), safe = H.two?.safe ?? null, t0 = L.s().clock.ms;
      L.g.step(1, { act: [stepAct(id)] });
      let openAt = null;
      for (let i = 0; i < 400 && openAt === null && !choose(L.s()); i++) { L.g.step(1, {}); if (openingState(L.s(), 'o:w4:r1') === 'open') openAt = L.s().clock.ms; }
      console.log(`      ${id}; the #2 held at ${JSON.stringify(safe)}; the leaf open after ${openAt === null ? 'never' : `${((openAt - t0) / 1000).toFixed(2)} s`}, hand-back ${L.s().stop?.carry?.why ?? 'none'}`);
      assert(id && safe?.door === 'o:w4:r1' && openAt !== null && openAt - t0 < 1500, JSON.stringify({ id, safe, openAt, t0, halt: L.s().stop?.carry }));
    },
  },
  {
    name: 'a throw beat at a door shut between the drill\'s door beat and its throw hands back "Door shut." with the G-11 still armed, Carry on struck "door shut", and T\'s act opens the door and throws it into room 1 (the review of the hunt fixes, finding 3 (c): the guard\'s throw from the thrower burst at his feet, 3,948 kPa)',
    timeoutMs: 60_000,
    fn() {
      const L = lane({ tier: 'tierone', seed: 1489397426, loadout: 'flash' }), H = L.s().armoury.range.house;
      L.press('drill:variant:bang');
      L.g.step(1, { act: [stepAct(L.live().find(x => /^drill:room:clear@flash/.test(x)))] });
      let shut = false;
      for (let i = 0; i < 400 && !choose(L.s()); i++) { L.g.step(1, {}); if (!shut && openingState(L.s(), 'o:w4:r1') === 'open' && handDeviceOf(L.s(), L.pid)) { setOpening(L.s(), 'o:w4:r1', 'closed'); shut = true; } }
      const halt = L.s().stop?.carry, hand = handDeviceOf(L.s(), L.pid)?.st, carry = L.row('drill:carry'), T = L.line(), b0 = (H.bursts ?? []).length;
      L.g.step(1, { act: [{ act: 'instinct', args: { id: T.id, act: T.act } }] });
      for (let i = 0; i < 400 && !(H.bursts ?? []).length; i++) L.g.step(1, {});
      const B = H.bursts?.[0];
      console.log(`      hand-back ${halt?.why} "${halt?.words}", the G-11 ${hand}, bursts ${b0}; Carry on ${JSON.stringify({ off: carry?.off })}; T ${T?.act}; then the burst in ${B?.room}, ${B?.kPa?.[L.pid]} kPa on you`);
      assert(shut && halt?.why === 'blocked' && hand === 'armed' && !b0 && carry?.off === 'door shut' && B?.room === 'w4.r1' && (B.kPa[L.pid] ?? 0) < STUN_KPA, JSON.stringify({ halt, hand, b0, carry: carry?.off, T, B }));
    },
  },
  {
    name: 'breach.js entryOptions strikes Open, Kick and Pry "a charge is on the door" while the SC-1 is on room 1\'s leaf, the charge\'s own row live (the review of the hunt fixes, finding 3 (f))',
    timeoutMs: 60_000,
    fn() {
      const L = lane({ tier: 'tierone', seed: 1489397426, loadout: 'breach' });
      const before = entryOptions(L.s(), L.pid, doorNow(L.s(), L.pid).plan);
      chargeLeft(L);
      const opts = entryOptions(L.s(), L.pid, doorNow(L.s(), L.pid).plan), by = (o, id) => o.find(x => x.id === id);
      console.log(`      before: ${before.map(o => `${o.id}${o.off ? `(${o.off})` : ''}`).join(', ')}; with the charge on: ${opts.map(o => `${o.id}${o.off ? `(${o.off})` : ''}`).join(', ')}`);
      assert(['open', 'kick', 'pry'].every(id => by(opts, id)?.off === 'a charge is on the door' && !by(before, id)?.off) && by(opts, 'charge')?.live, JSON.stringify({ before, opts }));
    },
  },
  {
    name: 'a G-11 that stuns the stack under the fault\'s line is a mark, "STACK STUNNED n KPA", no fault: the boot recruit\'s flashes on seeds 1074 (26.8 kPa) and 1148 (21.8), over STUN_KPA 20 and under BREACH_SAFE_KPA 27.6 (the review of the hunt fixes, finding 4: stunned U(2, 6) s, and the card said nothing)',
    timeoutMs: 120_000,
    fn() {
      const out = [];
      for (const seed of [1074, 1148]) {
        const g = createGame({ scenario: 'test-shoothouse', seed, tier: 'recruit', setup: 'go', loadout: 'flash' }), pid = g.state.player.id, H = g.state.armoury.range.house;
        runHouse(g, houseKitBot({ use: 'flash', base: 'keys' }), { maxMs: 8 * 60_000 });
        const B = (H.bursts ?? []).find(b => (b.kPa?.[pid] ?? 0) >= STUN_KPA), legs = [...H.rooms, H.hall];
        out.push({ seed, kPa: B?.kPa?.[pid], marks: legs.flatMap(x => (x.kit ?? []).filter(m => /^STACK /.test(m))), blast: legs.flatMap(x => x.faults).filter(f => f.kind === 'blast').length });
      }
      console.log(`      ${out.map(o => `${o.seed}: ${o.kPa} kPa, marks ${JSON.stringify(o.marks)}, blast faults ${o.blast}`).join('; ')}`);
      assert(out.every(o => o.kPa >= STUN_KPA && o.kPa <= BREACH_SAFE_KPA && o.marks.includes(`STACK STUNNED ${Math.round(o.kPa)} KPA`) && !o.blast), JSON.stringify(out));
    },
  },
];
