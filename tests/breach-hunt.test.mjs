// OLYMPUS tests: the hunt of v0.0.20's breach findings (breach-1 to breach-11, .run/hunt-v020/findings.md), each failing without its fix.
//
// "Stack and clear" by T and by the panel, from the states the hunt met: T's line looping on a look that never covers the far leg
// (1), on leave and enter off a stack you had taken (2), "In. On him." with no act (3), on Transition and Rifle up over a rifle
// with no round anywhere (6); the lock shot from across room 2 and the room called clear over a closet nobody looked into (4);
// Off safe never named with one round left (5); the same empty P-12 magazine picked off the ground (7); the tower's queued
// command halting at its look on a closed slide (8); "He's down." with nobody down (9); the spent charge read "not issued" (10);
// the halligan let go at room 2 and lost to room 3 (11). Four of the states are the hunt's own saves, made on v0.0.20's snapshot by
// the kit fuzz and the fumble net and loading on the tag (tests/saves/v0.0.20-house-*.json.gz); the rest are played from a setup
// by the honest bot (tests/bots/house.mjs) and the presses the hunt made. Quick: each a second or two.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { stepAct, pressToward } from './bots/lib.mjs';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { modelOf } from '../src/sim/arms/groups.js';
import { atFeetOf } from '../src/sim/arms/kit.js';
import { devicesOf } from '../src/sim/arms/devices.js';
import { contactNow } from '../src/sim/combat/contact.js';
import * as BUNDLE from '../src/sim/combat/bundle.js';
import * as BALL from '../src/sim/combat/ballistic.js';
import { openingOf, setOpening } from '../src/sim/places/model.js';
import { houseCall, curLeg } from '../src/sim/scenarios/shoothouse.js';

const read = (name) => gunzipSync(readFileSync(path.join(root, 'tests', 'saves', `${name}.json.gz`))).toString('utf8');
const fromSave = (name, opts) => { const g = createGame({ scenario: 'test-shoothouse', ...opts }); g.load(read(name)); return g; };
const H = (g) => g.state.armoury.range.house;
const sec = (g, t0) => ((g.state.clock.ms - t0) / 1000).toFixed(1);
const legOf = (g, k) => [...H(g).rooms, H(g).hall][k];
// (the honest bot to the DI's door line at the leg's door, stop motion choosing)
function toDoorLine(g, b, door = null, max = 20 * 600) {
  for (let n = 0; n < max; n++) {
    const l = instinctNow(g.state).line;
    if (l?.id === 'cqb-door' && g.state.stop?.phase === 'choose' && (!door || BUNDLE.doorNow(g.state)?.door === door)) return true;
    g.step(1, b);
  }
  return false;
}
// (T alone on the current leg to its end or a limit: the lines T named at a choice, by rule and act)
function tOnLeg(g, { maxMs = 150_000, each = null } = {}) {
  const b = houseHonestBot(), t0 = g.state.clock.ms, leg0 = H(g).cur, acts = {};
  while (H(g).cur === leg0 && !H(g).end && g.state.clock.ms - t0 < maxMs) {
    const l = instinctNow(g.state).line;
    if (l?.act && g.state.stop?.phase === 'choose') acts[`${l.id}:${l.act}`] = (acts[`${l.id}:${l.act}`] ?? 0) + 1;
    each?.(g, l);
    g.step(1, b);
  }
  return { acts, leg: legOf(g, leg0), t0 };
}

export default [
  {
    name: "breach-1: after Enter in room 3, T walks the far leg ('Move: the far leg') and never presses its look from the near leg, and the room is cleared on its own time (the hunt of v0.0.20: look:r3:far 452 times, the leg passed at 93.6 s)",
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', loadout: 'standard', setup: 'room:3' });
      assert(toDoorLine(g, houseHonestBot()), 'reached room 3\'s door line');
      const inRow = stepsOf(g.state).find(x => x.id.startsWith('drill:room:in') && !x.off);
      g.step(1, { act: [stepAct(inRow.id)] });
      let farLook = 0, farMove = 0;
      const { leg, t0 } = tOnLeg(g, { each: (gg, l) => { if (gg.state.stop?.phase === 'choose') { if (l?.act === 'stop:look:r3:far') farLook++; if (l?.act === 'stop:move:far') farMove++; } } });
      console.log(`      sergeant 48213 room:3, Enter then T: look:r3:far named ${farLook} times, move:far ${farMove}; the leg ${leg.state} at ${sec(g, t0)} s, faults [${leg.faults.map(f => f.kind)}]`);
      assert(farLook <= 1 && leg.state === 'clear' && !leg.faults.some(f => f.kind === 'time'), JSON.stringify({ farLook, farMove, state: leg.state, faults: leg.faults.map(f => f.kind) }));
    },
  },
  {
    name: "breach-2: a metre off a stack you had taken, the door shut, T says Stack up (the rung's room row) and the door is opened, never leave and enter in turn for ever (the hunt of v0.0.20: 1739 of each, the leg passed at 90 s)",
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', loadout: 'standard', setup: 'room:2' });
      assert(toDoorLine(g, houseHonestBot()), 'reached room 2\'s door line');
      g.step(1, { act: [stepAct('leave')] });
      for (let i = 0; i < 20; i++) g.step(1, { mx: -1, mz: -1 });
      g.step(2);
      const me = g.state.actors.list.find(a => a.who === g.state.player.id), here = BUNDLE.doorNow(g.state), st = here.plan.stack[0], offM = Math.hypot(me.x - st[0], me.z - st[1]), leg0 = here.rec.state;
      const { acts, leg, t0 } = tOnLeg(g);
      const leave = acts['cqb-next:stop:leave'] ?? 0, enter = acts['cqb-walk:stop:enter'] ?? 0, stack = Object.keys(acts).filter(k => k.startsWith('cqb-stack:'));
      console.log(`      sergeant 48213 room:2, ${offM.toFixed(2)} m off the stack (leg '${leg0}'): T ${JSON.stringify(acts)}; the leg ${leg.state} at ${sec(g, t0)} s, faults [${leg.faults.map(f => f.kind)}]`);
      assert(offM > 0.5 && leg0 === 'stacked' && stack.length && leave <= 2 && enter <= 2 && leg.state === 'clear', JSON.stringify({ offM, acts, state: leg.state }));
    },
  },
  {
    name: "breach-3: back on the stack after the take-in in the doorway, \"In. On him.\" acts (the room's In), never a line with no act while In is live (the hunt of v0.0.20, new in v0.0.20: 24 silent stops, the leg passed at 90 s)",
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', loadout: 'standard', setup: 'go' });
      assert(toDoorLine(g, houseHonestBot()), 'reached room 1\'s door line');
      const t0 = g.state.clock.ms, leg0 = H(g).cur;
      const choose = () => { for (let i = 0; i < 2000 && !(g.state.stop?.phase === 'choose' && !contactNow(g.state)?.pending && !g.state.stop?.reflex); i++) g.step(1); g.step(3); };
      const press = (re) => { choose(); const r = stepsOf(g.state).find(x => re.test(x.id) && !x.off); assert(r, `a live ${re}`); g.step(1, { act: [stepAct(r.id)] }); };
      press(/^door:(push|pull)>/); press(/^drill:room:in/); press(/^drill:stack:up/); choose();
      let silentIn = 0, moveActs = 0;
      const { leg } = tOnLeg(g, { each: (gg, l) => {
        if (gg.state.stop?.phase !== 'choose' || !l) return;
        if (!l.act && stepsOf(gg.state).some(x => /^drill:room:in/.test(x.id) && !x.off) && l.id === 'cqb-contact') silentIn++;
        if (l.id === 'cqb-contact' && l.variant === 'move' && l.act) moveActs++;
      } });
      console.log(`      corporal 48213 go: "In. On him." acted ${moveActs} times, silent with In live ${silentIn}; room 1 ${leg.state} at ${sec(g, t0)} s, faults [${leg.faults.map(f => f.kind)}] (leg ${leg0})`);
      assert(silentIn === 0 && leg.state === 'clear' && !leg.faults.some(f => f.kind === 'time'), JSON.stringify({ silentIn, moveActs, state: leg.state, faults: leg.faults.map(f => f.kind) }));
    },
  },
  {
    name: "breach-4: 'Shoot the lock' on room 2's closet walks you to its latch side first and fires with the muzzle on it, and a closet merely open (nobody at its leaf) is 'open' and faulted, never 'cleared' (the hunt of v0.0.20: fired from 5.53 m, resolved at 0.05 m, room 2 clear over it)",
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', loadout: 'breach' });
      const o = openingOf('o:w4:closet'), mid = o.axis === 'x' ? [(o.a + o.b) / 2, o.at] : [o.at, (o.a + o.b) / 2];
      const rounds = []; let seen = 0;
      runHouse(g, houseKitBot({ use: 'shoot' }), { maxMs: 15 * 60_000, each: (game) => {
        const s = game.state, shots = s.armoury.range.shots ?? [];
        for (; seen < shots.length; seen++) if (shots[seen].row === 'shoot:door') { const me = s.actors.list.find(a => a.who === s.player.id); rounds.push({ bodyM: +Math.hypot(me.x - mid[0], me.z - mid[1]).toFixed(2) }); }
      } });
      const L = H(g).rooms[1];
      console.log(`      tier one 48213 breach, the closet's lock: rounds ${JSON.stringify(rounds)} (the body's metres off the leaf's middle; the round resolved at the body's distance less ${BALL.MUZZLE_REACH_M} m, never under ${BALL.BALLISTIC_STANDOFF_M} m); room 2 ${L.state}, inner '${L.inner}', seen at ${H(g).innerSeen?.['o:w4:closet'] ?? '-'} ms`);
      assert(rounds.length && rounds.every(r => r.bodyM <= 1.0) && L.inner === 'cleared', JSON.stringify({ rounds, inner: L.inner }));
      // (an inner door open with nobody at its leaf as it opened: the call reads 'open', a door fault)
      const g2 = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', loadout: 'standard', setup: 'room:2' });
      const b = houseHonestBot(); let called = false, n = 0;
      while (!called && n++ < 20 * 300) {
        const h = H(g2), L2 = curLeg(h), turners = g2.state.armoury.range.turners.filter(T => T.room === 'w4.r2');
        if (h.cur === 1 && L2.state === 'entered' && g2.state.stop?.phase === 'choose' && turners.every(T => T.turnAtMs !== null && (T.stoppedAtMs !== null || T.face === 'noshoot'))) {
          h.two.hold = null; setOpening(g2.state, 'o:w4:closet', 'open', { atMs: g2.state.clock.ms });
          called = houseCall(g2.state, null, { atMs: g2.state.clock.ms });
          break;
        }
        g2.step(1, b);
      }
      const L2 = H(g2).rooms[1];
      console.log(`      corporal 48213 room:2, the closet set open from nowhere at the call: called ${called}, inner '${L2.inner}', faults [${L2.faults.map(f => f.kind)}]`);
      assert(called && L2.inner === 'open' && L2.faults.some(f => f.kind === 'door'), JSON.stringify({ called, inner: L2.inner, faults: L2.faults.map(f => f.kind) }));
    },
  },
  {
    name: "breach-4: the lock's round resolves at the muzzle's real distance, the body's less MUZZLE_REACH_M and never under the stand-off: from 0.6, 1.5, 3 and 5.5 m off the closet's lock, 0.05, 0.9, 2.4 and 4.9 m (the review of the hunt's fixes, R3: v0.0.20 resolved every round at 0.05 m, and no test held the distance)",
    fn() {
      const rows = [];
      for (const off of [0.6, 1.5, 3, 5.5]) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', loadout: 'breach', setup: 'room:2' }), s = g.state, b = houseHonestBot();
        for (let n = 0; n < 20 * 120 && !(H(g).cur === 1 && H(g).rooms[1].state === 'entered'); n++) g.step(1, b);
        const pid = s.player.id, me = s.actors.list.find(a => a.who === pid);
        const P = BALL.shootPlanOf(s, pid, { door: 'o:w4:closet', area: s.places?.live?.area }).points.find(p => p.key === 'lock');
        // (the shooter set off the lock's point along x, as the row's walk would leave him nearer or further)
        me.x = P.x + off; me.z = P.z;
        const r = BALL.shootRound(s, g.bus, { who: pid, door: 'o:w4:closet', atMs: s.clock.ms }, { key: 'lock' });
        rows.push({ off, rangeM: r.shot?.flight?.rangeM ?? null, want: Math.max(BALL.BALLISTIC_STANDOFF_M, +(off - BALL.MUZZLE_REACH_M).toFixed(3)), fired: !!r.shot?.fired });
      }
      console.log(`      the body off the lock (m) → the round's range (m): ${rows.map(x => `${x.off} → ${x.rangeM}`).join(', ')}`);
      assert(rows.every(x => x.fired && x.rangeM !== null && Math.abs(x.rangeM - x.want) < 0.011), JSON.stringify(rows));
    },
  },
  {
    name: "breach-5: the armoured man up, one round left and the rifle on safe, the DI names Off safe at rung 2 and T takes it, and the leg is cleared, never silent to the time fault (the hunt of v0.0.20: 37 silent stops, the leg passed at 104.5 s)",
    fn() {
      const g = fromSave('v0.0.20-house-safe-one-left', { seed: 1037, tier: 'cpl', loadout: 'standard' });
      let offSafe = 0;
      const { leg, t0 } = tOnLeg(g, { each: (gg, l) => { if (gg.state.stop?.phase === 'choose' && l?.id === 'cqb-contact' && l.act === 'stop:selector:semi') offSafe++; } });
      console.log(`      corporal 1037 standard, the kit fuzz's save at 113.50 s: Off safe named ${offSafe} times; room 2 ${leg.state} at ${sec(g, t0)} s, faults [${leg.faults.map(f => f.kind)}]`);
      assert(offSafe >= 1 && leg.state === 'clear' && !leg.faults.some(f => f.kind === 'time'), JSON.stringify({ offSafe, state: leg.state, faults: leg.faults.map(f => f.kind) }));
    },
  },
  {
    name: "breach-6: T never goes round Transition and Rifle up: it never brings up a rifle with no round anywhere (the hunt of v0.0.20: 22 Transitions and 21 Rifle ups in 60 s)",
    fn() {
      const g = fromSave('v0.0.20-house-rifle-dry', { seed: 1037, tier: 'sgt', loadout: 'flash' });
      const t0 = g.state.clock.ms, leg0 = H(g).cur, b = houseHonestBot(), n = {}; let last = null;
      while (H(g).cur === leg0 && g.state.clock.ms - t0 < 60_000) {
        const l = instinctNow(g.state).line;
        if (g.state.stop?.phase === 'choose' && l?.act && l.act !== last) { last = l.act; n[l.act] = (n[l.act] ?? 0) + 1; }
        g.step(1, b);
      }
      const tr = n['stop:weapon:transition'] ?? 0, up = n['stop:weapon:rifle-up'] ?? 0;
      console.log(`      sergeant 1037 flash, the kit fuzz's save at 147.75 s: Transition ${tr}, Rifle up ${up} in ${sec(g, t0)} s; the leg ${H(g).cur === leg0 ? 'still on' : 'ended'} (${legOf(g, leg0).state})`);
      assert(tr <= 2 && up <= 2 && H(g).cur !== leg0, JSON.stringify(n));
    },
  },
  {
    name: "breach-7: RELOAD off the ground takes the magazine believed loaded, never the P-12 magazine just dropped and felt empty while a full one lies at the feet (the hunt of v0.0.20: i21, 0 rounds, seated four times with i22, 10 rounds, 0.47 m off)",
    fn() {
      const g = fromSave('v0.0.20-house-feet-empty', { seed: 5150, tier: 'tierone', loadout: 'full' }); g.step(3);
      const s = g.state, feet = atFeetOf(s, s.player.id).map(x => `${x.id}:${s.items[x.id].n}@${x.dM.toFixed(2)}m`);
      g.step(1, { act: [stepAct('macro:reload:speed')] }); for (let j = 0; j < 300 && g.state.stop?.phase !== 'choose'; j++) g.step(1); g.step(3);
      const p = g.state.items.i19, m = p.mag ? g.state.items[p.mag] : null;
      console.log(`      tier one 5150 full, the fumble net's N5 save: at the feet ${feet.join(', ')}; RELOAD seated ${p.mag} (${m?.n ?? '-'} rounds)`);
      assert(p.mag === 'i22' && m.n > 0, JSON.stringify({ mag: p.mag, n: m?.n }));
    },
  },
  {
    name: "breach-8: the tower's queued command on the P-12 with its slide closed locks the slide back before its look and runs on, never halting at once on every press (the hunt of v0.0.20: five presses, each halted at the inspect after 0 ms)",
    fn() {
      const g = fromSave('v0.0.20-house-queue-p12', { seed: 1037, tier: 'raider', loadout: 'full' }); g.step(3);
      const q0 = stepsOf(g.state).find(r => r.id === 'queue');
      g.clearFacts(); g.step(1, { act: [stepAct('queue')] }); for (let j = 0; j < 400 && g.state.stop?.phase !== 'choose'; j++) g.step(1);
      const halts = g.facts('step').filter(f => f.phase === 'halt').map(f => f.action), subs = g.facts('step').filter(f => f.phase === 'sub').length;
      const q1 = stepsOf(g.state).find(r => r.id === 'queue');
      console.log(`      raider 1037 full, the fumble net's N8 save: "${q0?.label}"; halts ${JSON.stringify(halts)}, sub-steps run ${subs}; the queue after: ${q1 ? `"${q1.label}"` : 'none'}`);
      assert(q0 && /^Carry on: Lock the slide back, Inspect/.test(q0.label) && !halts.includes('inspect') && subs >= 3 && q1?.label !== q0.label, JSON.stringify({ label: q0?.label, halts, subs, after: q1?.label ?? null }));
    },
  },
  {
    name: "breach-9: after a charge's misfire with nobody down, Carry on says \"Carry on.\", never \"He's down.\" (the hunt of v0.0.20: the boot recruit 5150, cut, room 2)",
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 5150, tier: 'recruit', loadout: 'cut', setup: 'room:2' });
      assert(toDoorLine(g, houseHonestBot()), 'reached room 2\'s door line');
      const r = stepsOf(g.state).find(x => /^drill:door:breach/.test(x.id) && !x.off);
      g.step(1, { act: [stepAct(r.id)] }); g.clearFacts();
      const t0 = g.state.clock.ms; let misfire = null, said = null;
      while (g.state.clock.ms - t0 < 40_000 && !said) {
        g.step(1);
        for (const f of g.facts('line')) if (/Misfire/.test(f.text)) misfire = sec(g, t0);
        g.clearFacts();
        const l = instinctNow(g.state).line;
        if (misfire && l?.id === 'cqb-carryon' && g.state.stop?.phase === 'choose') said = { text: l.text, pick: g.state.stop.pick ?? null };
      }
      console.log(`      recruit 5150 cut room:2: misfire at ${misfire} s; cqb-carryon "${said?.text}" (the pick ${said?.pick})`);
      assert(misfire && said && !/down/i.test(said.text), JSON.stringify({ misfire, said }));
    },
  },
  {
    name: "breach-10: Breach at room 3 after your one charge went on room 1 is struck 'charge spent' with a note, never 'no charge issued' with the issue badge (the hunt of v0.0.20: the corporal 48213, full)",
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', loadout: 'full', setup: 'go' });
      const b = houseHonestBot();
      assert(toDoorLine(g, b, 'o:w4:r1'), 'room 1');
      g.step(1, { act: [stepAct(stepsOf(g.state).find(r => /^drill:door:breach/.test(r.id) && !r.off).id)] });
      assert(toDoorLine(g, b, 'o:w4:r2'), 'room 2');
      g.step(1, { act: [stepAct(stepsOf(g.state).find(r => /^drill:door:pry/.test(r.id) && !r.off).id)] });
      assert(toDoorLine(g, b, 'o:w4:r3'), 'room 3');
      const rows = stepsOf(g.state), l = instinctNow(g.state).line, f5 = modelOf(rows, { act: l?.act ?? null }).situation.five[4];
      console.log(`      corporal 48213 full, room 3: bursts ${(H(g).bursts ?? []).map(x => `${x.model}@${x.door}`)}; five 5 "${f5.words}" ${f5.row?.id} off "${f5.row?.off}" badge ${JSON.stringify(f5.badge)}`);
      assert(f5.row?.off === 'charge spent' && BUNDLE.CHARGE_SPENT === 'charge spent' && f5.badge?.t !== 'issue', JSON.stringify({ off: f5.row?.off, badge: f5.badge }));
    },
  },
  {
    name: "breach-11: the halligan let go at room 2's door is named at room 3, Pry it struck 'halligan left at room 2' (the row had vanished, nothing said), and walked back to by the keys it is picked up and Pry it is live again (the hunt of v0.0.20)",
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', loadout: 'breach', setup: 'room:2' });
      const b = houseHonestBot();
      assert(toDoorLine(g, b, 'o:w4:r2'), 'room 2');
      g.step(1, { act: [stepAct(stepsOf(g.state).find(r => /^drill:door:pry/.test(r.id) && !r.off).id)] });
      assert(toDoorLine(g, b, 'o:w4:r3'), 'room 3');
      const pid = g.state.player.id, pry0 = stepsOf(g.state).find(r => r.id === 'drill:door:pry>o:w4:r3');
      assert(pry0?.off === 'halligan left at room 2', `Pry it at room 3: ${pry0 ? `[${pry0.off}]` : 'absent'}`);
      const lie = Object.values(g.state.places.sites).flatMap(x => x.items ?? []).find(l => g.state.items[l.id]?.model === 'hal');
      // (out of the mode, the keys back to it: S down the hall's width past your #2 on his stack, then D along it; then G and its pick-up row)
      g.step(1, { act: [stepAct('leave')] });
      const me = () => g.state.actors.list.find(a => a.who === pid), legs = [[me().x, lie.z], [lie.x, lie.z]];
      for (const p of legs) for (let i = 0; i < 20 * 10 && Math.hypot(p[0] - me().x, p[1] - me().z) > 0.5; i++) g.step(1, pressToward(me(), p));
      const walkedM = Math.hypot(lie.x - me().x, lie.z - me().z);
      for (let i = 0; i < 40 && g.state.stop?.mode !== 'stop'; i++) g.step(1, { act: ['ready'] });
      for (let i = 0; i < 200 && g.state.stop?.phase !== 'choose'; i++) g.step(1);
      const pick = stepsOf(g.state).find(r => r.id === 'dev:pickup' && !r.off);
      if (pick) { g.step(1, { act: [stepAct('dev:pickup')] }); for (let i = 0; i < 200 && !devicesOf(g.state, pid).some(d => d.model === 'hal' && d.st === 'stowed'); i++) g.step(1); }
      const hal = devicesOf(g.state, pid).filter(d => d.model === 'hal').map(d => d.st);
      assert(toDoorLine(g, b, 'o:w4:r3'), 'room 3 again');
      const pry1 = stepsOf(g.state).find(r => r.id === 'drill:door:pry>o:w4:r3');
      console.log(`      corporal 48213 breach, room 3: Pry it [${pry0?.off}]; the halligan at (${lie.x.toFixed(2)}, ${lie.z.toFixed(2)}), walked to ${walkedM.toFixed(2)} m of it, "${pick?.label}"; then the halligan ${JSON.stringify(hal)}, Pry it at room 3 ${pry1 ? (pry1.off ? `[${pry1.off}]` : 'live') : 'absent'}`);
      assert(pry0?.off === 'halligan left at room 2' && pick && hal.includes('stowed') && pry1 && !pry1.off, JSON.stringify({ before: pry0?.off, pick: !!pick, hal, after: pry1?.off ?? 'absent' }));
    },
  },
];
