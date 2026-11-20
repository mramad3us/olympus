// OLYMPUS tests: your number two's roles on your word (v0.0.19, the team's track T4; team.js, drills/enter-and-clear.js TEAM_TASKS, bundle.js's order and cue and taskSlot; TEAM 2 "#2, bang it", TEAM 3 "Breacher up", TEAM 4 "As you were").
//
// Your order (its end writes R.house.two.task) sends you to the give line (team.js giveOf: GIVE_M 0.6 m off the stack's wall line)
// and him to the stack's front point on the latch-side wall, where he works the door: the G-11 thrown ("Bang out!"), the halligan,
// or the charge from its safe point; he steps back to his own stack point and you lead in on his work (your entry's cue beat). The
// tasks are planned on his own skills and his own kit (the loadout is issued to both). T never orders one (COMBAT §25.5.6): the
// task bot does, as a player would (tests/bots/team.mjs teamTaskBot). Each case fails without the task: v0.0.18 had no such row.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { teamTaskBot } from './bots/team.mjs';
import { stepAct } from './bots/lib.mjs';
import { checkIds, checkHolders } from './ids-check.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { lanePlanOf, pastThreshold } from '../src/sim/combat/room.js';
import { giveOf, GIVE_M, TASK_WHY } from '../src/sim/combat/team.js';
import { handDeviceOf, devicesOf } from '../src/sim/arms/devices.js';
import { BREACH_SAFE_KPA } from '../src/sim/arms/blast.js';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { TWO_BLOCK_SAY_MS } from '../src/sim/combat/bundle.js';

import { BANG_HOLD_MS } from '../src/sim/skills/instinct/cqb.js';
import { BANG_LATE_MS } from '../src/sim/combat/burst.js';

const actor = (s, pid) => s.actors.list.find(a => a.who === pid);
const d2 = (a, p) => Math.hypot(a.x - p[0], a.z - p[1]);

// (a lane by the task bot, watching one door: where each man stood at his throw or his force, who crossed the threshold first, the
// bang to your entry, the burst's pressures on the stack, the say events)
function watched(tier, loadout, use, door, { seed = 48213 } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, loadout }), s = g.state, H = s.armoury.range.house, P = lanePlanOf(s).plans[door];
  const me = actor(s, s.player.id), two = actor(s, H.two.pid), o = { door, says: [], first: null, burstMs: null, inMs: null, work: null, kPa: null };
  const s0 = P.stack[0], g0 = giveOf(P, s0);
  const r = runHouse(g, teamTaskBot({ use }), { maxMs: 12 * 60_000, each: (game) => {
    for (const f of game.facts('say')) if (f.who === H.two.pid || f.who === s.player.id) o.says.push({ who: f.who === H.two.pid ? 'two' : 'me', text: f.text, ms: s.clock.ms });
    const b = H.two.doing?.beats?.find(x => x.st === 'run' && (x.k === 'throw' || x.k === 'force' || x.k === 'place'));
    if (b && !o.work && H.two.doing.step.endsWith(`>${door}`)) o.work = { k: b.k, two: d2(two, s0), me: d2(me, g0) };
    const L = [...H.rooms, H.hall].find(x => x.door === door);
    if (o.first === null && L && (pastThreshold(P, me.x, me.z) || pastThreshold(P, two.x, two.z))) o.first = pastThreshold(P, me.x, me.z) ? 'me' : 'two';
    if (o.inMs === null && pastThreshold(P, me.x, me.z)) o.inMs = s.clock.ms;
    const bu = (H.bursts ?? []).find(x => x.room === P.room || x.door === P.door);
    if (bu && o.burstMs === null) { o.burstMs = bu.atMs; o.kPa = { me: bu.kPa?.[s.player.id] ?? 0, two: bu.kPa?.[H.two.pid] ?? 0 }; }
  } });
  return { ...o, done: r.done, tasks: r.mem.tasks ?? [], s, H, P, row: runSheetOf(s).rows.find(x => x.room === P.room)?.words ?? '' };
}

// (a lane by the task bot on the breach loadout, "Breacher up: charge" at room 1 and As you were once his charge's beat `at` is done,
// then T alone (the task bot's honest base) on to room 1's end: the presses after the belay, the DI's lines, the charge, the faults)
function belayed(at, { tier = 'cpl', seed = 48213, saveAt = null } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, loadout: 'breach' }), s = g.state, H = s.armoury.range.house, L = H.rooms[0];
  const inner = teamTaskBot({ use: 'breach' }), me = actor(s, s.player.id), o = { at, belayAt: null, presses: 0, flips: 0, lines: [], says: [], save: null, recover: null };
  me.bot ??= {};
  let st = 0, last = null;
  for (let i = 0; i < 20 * 120 && L.state !== 'clear' && L.state !== 'passed'; i++) {
    const t = H.two.task;
    if (st === 0 && t?.st === 'working' && t.how === 'charge' && t.door === 'o:w4:r1' && t.done?.[at] !== undefined) st = 1;
    let inp;
    if (st === 1) {
      if (s.stop?.phase === 'choose') { st = 2; o.belayAt = s.clock.ms; inp = { act: [stepAct('drill:team:belay>o:w4:r1')] }; }
      else inp = { act: [stepAct(s.stop ? 'drill:stop' : 'enter')] };
    } else inp = inner(s, me, me.bot);
    if (st === 2 && inp?.act?.length) {
      o.presses++;
      const id = inp.act[0].args?.id ?? null;
      if (id) { if (last && last !== id && ['cqb-next', 'cqb-walk'].includes(id) && ['cqb-next', 'cqb-walk'].includes(last)) o.flips++; last = id; if (o.lines.at(-1) !== id) o.lines.push(id); }
    }
    if (st === 2 && H.two.doing?.step === 'drill:two:recover>o:w4:r1' && !o.recover) o.recover = { atMs: s.clock.ms - o.belayAt, planMs: H.two.doing.untilPlanMs - s.clock.ms };
    if (saveAt && st === 2 && !o.save && H.two.doing?.step === 'drill:two:recover>o:w4:r1' && H.two.doing.beats.some(b => b.key === saveAt && b.st === 'run')) o.save = g.save();
    g.step(1, inp);
    for (const f of g.facts('say')) if (st === 2 && (f.who === H.two.pid || f.who === s.player.id)) o.says.push(f.text);
    g.clearFacts?.();
  }
  const charge = Object.entries(s.items).filter(([, it]) => it.type === 'charge' && (it.st === 'placed' || it.st === 'primed')).map(([id, it]) => `${id} ${it.st}@${it.door}`);
  return { ...o, g, s, H, L, state: L.state, faults: L.faults.map(f => f.kind), charge, sinceS: (s.clock.ms - o.belayAt) / 1000, task: H.two.task?.st ?? null };
}

// (a lane of "#2, bang it" by the keys to room 1's end: the DI's lines while his bang pends and after, your pause on room 1's man after
// the bang, the bang to your threshold, a Wait's end, the row's BANG TO ENTRY mark)
function bangLane(tier, seed, loadout) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, loadout }), s = g.state, H = s.armoury.range.house, plan = lanePlanOf(s).plans['o:w4:r1'];
  let bang = null, waitEnd = null, entry = null, wasWait = false;
  const lines = new Set(), late = new Set();
  // (120 s of game time from the fill: v0.0.20's tower waits on the instructor's lines (the build sheet's item 7), so GO comes about
  // 20 s later than v0.0.19's and 60 s no longer reached room 1's entry)
  runHouse(g, teamTaskBot({ use: 'bang', base: 'keys' }), { maxMs: 120_000, until: () => H.cur > 0, each: () => {
    const t = H.two.task, me = s.actors.list.find(a => a.who === s.player.id);
    if (bang === null && Number.isFinite(t?.done?.bang)) bang = t.done.bang;
    // (the hold: his task working, or the bang under BANG_HOLD_MS old; after it, the lines are printed apart)
    const pending = t?.door === 'o:w4:r1' && (t.st === 'working' || (bang !== null && s.clock.ms - bang < BANG_HOLD_MS));
    if (pending || (bang !== null && entry === null)) { const l = instinctNow(s).line; if (l) (pending ? lines : late).add(l.id); }
    const w = s.stop?.doing?.kind === 'wait';
    if (wasWait && !w && bang !== null && waitEnd === null) waitEnd = s.clock.ms;
    wasWait = w;
    if (bang !== null && entry === null && pastThreshold(plan, me.x, me.z)) entry = s.clock.ms;
  } });
  // (your first pause on a man of room 1 after the bang: inside the hold or past it)
  const c = (H.rooms[0].contacts ?? []).filter(x => x.by === 'me' && Number.isFinite(x.pauseAtMs) && bang !== null && x.pauseAtMs > bang)[0] ?? null;
  return { tier, seed, lines: [...lines], late: [...late], bangToEntry: bang !== null && entry !== null ? entry - bang : null, waitEnd: waitEnd !== null ? waitEnd - bang : null,
    pause: c ? { key: c.key, seen: c.seenMs - bang, takeIn: c.takeInMs, at: c.pauseAtMs - bang } : null, mark: (H.rooms[0].kit ?? []).find(x => /^BANG TO ENTRY/.test(x)) ?? null };
}

// (the belays of "As you were": the quick case after his "back" alone, its heavy twin after each beat; v0.0.28's stage 0)
function belays(ats) {
  // (after his prime the breach's count has begun, its fuse running: no recovery, "It's lit. Stay off the door." and the burst)
  const rows = ats.map(at => belayed(at));
  for (const r of rows) console.log(`      after ${r.at}: ${r.recover ? `his recovery from +${fmt(r.recover.atMs / 1000, 2)} s (planned ${fmt(r.recover.planMs / 1000, 2)} s)` : 'no recovery (the fuse running)'}; presses after the belay ${r.presses}, the lines ${r.lines.join(' > ')}, next/walk flips ${r.flips}; room 1 ${r.state} ${fmt(r.sinceS, 1)} s after the belay, faults ${r.faults.join(', ') || 'none'}; charges on a door ${r.charge.join(', ') || 'none'}; task ${r.task}`);
  assert(rows.every(r => r.belayAt !== null && (r.recover || r.at === 'prime') && r.state === 'clear' && !r.faults.length && !r.charge.length && r.flips === 0 && r.lines.includes('cqb-task') && r.presses <= 40 && r.sinceS < 60), JSON.stringify(rows.map(r => ({ at: r.at, state: r.state, faults: r.faults, charge: r.charge, flips: r.flips, presses: r.presses, lines: r.lines }))));
}

// (the review of v0.0.19's bang lanes: the quick case the recruit on 48213, whose take-in ran past the hold, its heavy twin the three; v0.0.28's stage 0)
function bangLanes(lanes) {
  const out = [];
  for (const [tier, seed] of lanes) {
    const o = bangLane(tier, seed, 'flash');
    out.push(o);
  }
  for (const o of out) console.log(`      ${o.tier} ${o.seed}: the DI while his bang came ${o.lines.join(', ')}, after the hold ${o.late.join(', ') || 'nothing'}; your pause on ${o.pause ? `${o.pause.key} seen +${fmt(o.pause.seen / 1000, 2)} s, take-in ${fmt(o.pause.takeIn / 1000, 2)} s, at +${fmt(o.pause.at / 1000, 2)} s (${o.pause.at < BANG_HOLD_MS ? 'inside' : 'past'} the hold)` : 'none'}; bang to your threshold ${o.bangToEntry === null ? '-' : fmt(o.bangToEntry / 1000, 2)} s; a Wait ended ${o.waitEnd === null ? 'none run over it' : `${o.waitEnd} ms after the bang`}; the row's mark ${o.mark ?? 'none'}`);
  assert(out.every(o => !o.lines.includes('cqb-contact') && o.lines.includes('cqb-task') && o.bangToEntry !== null && (o.waitEnd === null || o.waitEnd <= 150)), JSON.stringify(out));
  // (every lane, the recruit on 48213 whose take-in of 1a ran past the hold among them (v0.0.20's close: before, only the lanes whose
  // pause came inside the hold were held to it, and that recruit entered 6.85 s after the bang))
  assert(out.every(o => o.bangToEntry < 3500) && out.some(o => o.tier === 'recruit' && o.pause && o.pause.at >= BANG_HOLD_MS), JSON.stringify(out));
  assert(out.filter(o => o.bangToEntry > BANG_LATE_MS + 500).every(o => o.mark), JSON.stringify(out));
}

export default [
  {
    name: '"As you were" with his charge on the door (placed, and back at his safe point): he takes it off (two:recover: to the front, the charge off and in its pouch, back to his point), "Your call. Back on the door.", and you lead in by T alone: room 1 clear, no fault, nothing left on the door; v0.0.19\'s first build left the charge there, the DI flipping "Next" and "Keep moving" a tick at a time, and the stall passed the leg with TIME and your "charge" fault (the review of 2026-11-16); after his prime the count has begun: off the door until it bursts (quick: the belay after his "back"; after "place" and "prime" too in its heavy twin below, v0.0.28\'s stage 0)',
    timeoutMs: 60_000,
    fn() { belays(['back']); },
  },
  {
    name: '"As you were" with his charge on the door (placed, and back at his safe point): he takes it off (two:recover: to the front, the charge off and in its pouch, back to his point), "Your call. Back on the door.", and you lead in by T alone: room 1 clear, no fault, nothing left on the door; v0.0.19\'s first build left the charge there, the DI flipping "Next" and "Keep moving" a tick at a time, and the stall passed the leg with TIME and your "charge" fault (the review of 2026-11-16); after his prime the count has begun: off the door until it bursts (the heavy twin of the case above, v0.0.28\'s stage 0: the file over its quick CPU ceiling)',
    heavy: true,
    timeoutMs: 120_000,
    fn() { belays(['place', 'back', 'prime']); },
  },
  {
    name: 'a save made while he takes his charge off the door carries on byte for byte, every item held exactly once and every id whole (ids-check)',
    timeoutMs: 60_000,
    fn() {
      const r = belayed('place', { saveAt: 'recover' }), json = r.save;
      assert(json, 'saved mid-recovery');
      const h = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', loadout: 'breach' });
      h.load(json);
      const g2 = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', loadout: 'breach' });
      g2.load(json);
      const ids = checkIds(JSON.parse(json), h.sim.domains), holders = checkHolders(h.state);
      const b1 = teamTaskBot({ use: 'breach' }), b2 = teamTaskBot({ use: 'breach' });
      for (let k = 0; k < 400; k++) { g2.step(1, b1); h.step(1, b2); }
      const doing = JSON.parse(json).armoury?.range?.house?.two?.doing?.step ?? null;
      console.log(`      saved during ${doing} (${json.length} bytes): invalid ${ids.invalid.length}, dangling ${ids.dangling.length}, holders invalid ${holders.invalid.length}; 400 ticks on: ${g2.digest()} and ${h.digest()}`);
      assert(doing === 'drill:two:recover>o:w4:r1' && !ids.invalid.length && !ids.dangling.length && !holders.invalid.length && g2.digest() === h.digest(), JSON.stringify({ doing, ids: ids.invalid.slice(0, 3), holders: holders.invalid.slice(0, 3) }));
    },
  },
  {
    name: 'you on the stack\'s front point after "#2, bang it": he holds off it and says "Give me the door!" TWO_BLOCK_SAY_MS on; in stop motion the DI says "He needs the door. Give him room." and T is your entry on his bang, which walks you out to the give line first; he throws and you lead in on the bang (v0.0.19\'s first build: both waiting, silent, "Your two\'s on the door. Cover it.")',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', loadout: 'flash' }), s = g.state, H = s.armoury.range.house, P = lanePlanOf(s).plans['o:w4:r1'];
      const bot = teamTaskBot({ use: 'bang' }), me = actor(s, s.player.id), two = actor(s, H.two.pid);
      me.bot ??= {};
      for (let i = 0; i < 4000 && !H.two.task; i++) g.step(1, bot);
      // (the order given: you back onto the front point, out of stop motion, time running)
      for (let i = 0; i < 40 && s.stop; i++) g.step(1, s.stop.phase === 'choose' ? { act: [stepAct('leave')] } : {});
      me.x = P.stack[0][0]; me.z = P.stack[0][1]; me.$px = me.x; me.$pz = me.z; delete me.v;
      const t0 = s.clock.ms, said = [];
      for (let i = 0; i < 60; i++) { g.step(1, {}); for (const f of g.facts('say')) if (f.who === H.two.pid) said.push({ text: f.text, ms: s.clock.ms - t0 }); g.clearFacts?.(); }
      const call = said.find(x => x.text === 'Give me the door!');
      g.step(1, { act: ['ready'] });
      for (let i = 0; i < 20 && s.stop?.phase !== 'choose'; i++) g.step(1, {});
      const line = instinctNow(s).line, row = stepsOf(s).find(r => r.id === String(line?.act ?? '').replace(/^stop:/, ''));
      const gives = row?.beats?.some(b => b.id === 'give') ?? false;
      let bangMs = null, inMs = null;
      for (let i = 0; i < 20 * 60 && H.rooms[0].state !== 'clear' && H.rooms[0].state !== 'passed'; i++) {
        g.step(1, bot);
        if (bangMs === null && (H.bursts ?? []).length) bangMs = s.clock.ms;
        if (inMs === null && pastThreshold(P, me.x, me.z)) inMs = s.clock.ms;
        g.clearFacts?.();
      }
      console.log(`      on the front point: his "Give me the door!" at +${call?.ms ?? 'never'} ms (TWO_BLOCK_SAY_MS ${TWO_BLOCK_SAY_MS}), he ${fmt(Math.hypot(two.x - P.stack[0][0], two.z - P.stack[0][1]), 2)} m off it; the DI ${line?.id} "${line?.text}" act ${line?.act} (${row?.label}, give first ${gives}); the bang to your threshold ${bangMs !== null && inMs !== null ? fmt((inMs - bangMs) / 1000, 2) + ' s' : '-'}; room 1 ${H.rooms[0].state}, faults ${H.rooms[0].faults.map(f => f.kind).join(', ') || 'none'}`);
      assert(call && call.ms >= TWO_BLOCK_SAY_MS && call.ms <= TWO_BLOCK_SAY_MS + 100 && said.filter(x => x.text === 'Give me the door!').length === 1, JSON.stringify(said));
      assert(line?.id === 'cqb-task' && /room|door/i.test(line.text ?? '') && gives && bangMs !== null && inMs !== null && inMs >= bangMs && H.rooms[0].state === 'clear' && !H.rooms[0].faults.length, JSON.stringify({ line, gives, bangMs, inMs, room: H.rooms[0].state, faults: H.rooms[0].faults }));
    },
  },
  {
    name: '"#2, bang it" at room 1 on the flash loadout: you on the give line, he at the stack\'s front point opens it and throws ("Bang out!"), you lead in on the bang, BANG TO ENTRY at most 2 s from the corporal up (F27\'s bound), the lane to its card',
    heavy: true,
    timeoutMs: 180_000,
    fn() {
      const rows = [];
      for (const tier of ['cpl', 'sgt', 'tierone']) rows.push({ tier, ...watched(tier, 'flash', 'bang', 'o:w4:r1') });
      for (const r of rows) console.log(`      ${r.tier}: ordered ${r.tasks.map(t => t.row).filter(x => x.includes('r1')).join(', ')}; at his throw he ${fmt(r.work?.two, 2)} m off the front point, you ${fmt(r.work?.me, 2)} m off the give line (GIVE_M ${GIVE_M}); first in: ${r.first}; the bang to your threshold ${fmt((r.inMs - r.burstMs) / 1000, 2)} s; "${r.says.filter(x => x.who === 'two' && x.text === 'Bang out!').length ? 'Bang out!' : '-'}" by him; the card ${r.done}; ${r.row}`);
      assert(rows.every(r => r.done && r.work?.k === 'throw' && r.work.two < 0.3 && r.work.me < 0.3 && r.first === 'me' && r.burstMs !== null && r.inMs - r.burstMs <= 2000 && r.inMs >= r.burstMs && r.says.some(x => x.who === 'two' && x.text === 'Bang out!') && r.says.some(x => x.who === 'me' && x.text === 'Two, bang it!')), JSON.stringify(rows.map(r => ({ tier: r.tier, work: r.work, first: r.first, inMs: r.inMs, burstMs: r.burstMs }))));
    },
  },
  {
    name: '"Breacher up" on the breach loadout: the charge at room 1 (he places and fires it from the safe point, you on the give line beside it, nobody of the stack over BREACH_SAFE_KPA at the fire) and the halligan at room 2\'s pull door (he pries, steps back, you in first)',
    heavy: true,
    timeoutMs: 180_000,
    fn() {
      const c = watched('cpl', 'breach', 'breach', 'o:w4:r1'), p = watched('cpl', 'breach', 'breach', 'o:w4:r2');
      console.log(`      room 1: ${c.tasks.find(t => t.door === 'o:w4:r1')?.row}; his place ${fmt(c.work?.two, 2)} m off the front point; the fire on you ${c.kPa?.me} kPa, on him ${c.kPa?.two} kPa (limit ${BREACH_SAFE_KPA}); first in ${c.first}; ${c.row}`);
      console.log(`      room 2: ${p.tasks.find(t => t.door === 'o:w4:r2')?.row}; at his force he ${fmt(p.work?.two, 2)} m off the front point, you ${fmt(p.work?.me, 2)} m off the give line; first in ${p.first}; ${p.row}`);
      assert(c.done && c.work?.k === 'place' && c.kPa && c.kPa.me < BREACH_SAFE_KPA && c.kPa.two < BREACH_SAFE_KPA && c.first === 'me' && c.row.includes('DOOR BLOWN'), JSON.stringify({ work: c.work, kPa: c.kPa, first: c.first }));
      assert(p.done && p.work?.k === 'force' && p.work.two < 0.3 && p.work.me < 0.3 && p.first === 'me', JSON.stringify({ work: p.work, first: p.first }));
    },
  },
  {
    name: '"As you were" before his throw: his task belayed, the G-11 back in its pouch by its way out (devices.js wayOut), nothing in his hands, his rifle up; your entry still yours (never a dead end)',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', loadout: 'flash' }), s = g.state, H = s.armoury.range.house, bot = teamTaskBot({ use: 'bang' });
      let belayAt = null, held = null;
      for (let i = 0; i < 4000 && belayAt === null; i++) {
        const armed = H.two.task?.st === 'working' && handDeviceOf(s, H.two.pid)?.kind === 'grenade';
        if (armed && s.stop?.mode === 'stop' && s.stop.phase === 'choose' && stepsOf(s).some(r => /^drill:team:belay/.test(r.id) && !r.off)) { held = handDeviceOf(s, H.two.pid); g.step(1, { act: [stepAct(stepsOf(s).find(r => /^drill:team:belay/.test(r.id)).id)] }); belayAt = s.clock.ms; break; }
        // (once ordered: out of the mode (X) so time runs while he works, and the mode entered by G once his hand holds the G-11)
        const choosing = s.stop?.mode === 'stop' && s.stop.phase === 'choose';
        g.step(1, !H.two.task ? bot : armed ? (s.stop ? {} : { act: ['ready'] }) : choosing ? { act: [stepAct('leave')] } : {});
      }
      // (time running again: out of the mode, as a player who said "As you were" and watches him make it safe)
      for (let i = 0; i < 200; i++) g.step(1, s.stop?.mode === 'stop' && s.stop.phase === 'choose' ? { act: [stepAct('leave')] } : {});
      const left = handDeviceOf(s, H.two.pid), g11 = devicesOf(s, H.two.pid).filter(d => d.model === 'g11');
      console.log(`      belayed at ${belayAt !== null}: he held ${held?.id} (${held?.st}); after: task ${H.two.task?.st}, in his hands ${left?.id ?? 'nothing'}, his G-11s ${g11.map(d => `${d.id} ${d.st}`).join(', ')}, posture ${s.people[H.two.pid].kit.carry.posture}`);
      assert(belayAt !== null && H.two.task?.st === 'belayed' && !left && g11.every(d => d.st === 'pouched') && s.people[H.two.pid].kit.carry.posture === 'highReady', JSON.stringify({ belayAt, task: H.two.task, left, g11 }));
    },
  },
  {
    name: 'the task rows are struck with their reason, never removed, on a kit lane: on the flash loadout Breacher up "not issued" (and on the standard loadout, his kit carrying nothing a task needs, no team row at all: v0.0.18\'s rows, the lead\'s call on the review\'s finding 10), away from your #2 "your two\'s not with you", the charge and the ram at a pull door "opens toward you"; live where his kit and the door allow',
    fn() {
      const rows = (g, door) => stepsOf(g.state).filter(r => /^drill:team:/.test(r.id) && r.id.endsWith(`>${door}`)).map(r => `${r.id.replace(/>.*/, '')} ${r.off ?? 'live'}`);
      const at = (g, door) => { const s = g.state, H = s.armoury.range.house, P = lanePlanOf(s).plans[door], me = actor(s, s.player.id), two = actor(s, H.two.pid); me.x = P.stack[0][0]; me.z = P.stack[0][1]; two.x = P.stack[1][0]; two.z = P.stack[1][1]; return rows(g, door); };
      const std = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', setup: 'go' }), fl = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', setup: 'go', loadout: 'flash' }), away = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', setup: 'go', loadout: 'flash' });
      const pull = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', setup: 'room:2', loadout: 'full' });
      const a = at(std, 'o:w4:r1'), f = at(fl, 'o:w4:r1'), b = rows(away, 'o:w4:r1'), c = at(pull, 'o:w4:r2');
      console.log(`      standard, stacked: ${a.join(' · ') || 'no team row'}\n      flash, stacked: ${f.join(' · ')}\n      flash at GO, your #2 on his mark: ${b.join(' · ')}\n      full at room 2's pull door, stacked: ${c.join(' · ')}`);
      assert(a.length === 0, JSON.stringify(a));
      assert(f.some(x => x.startsWith('drill:team:breach') && x.endsWith(TASK_WHY.issue)) && f.some(x => x.startsWith('drill:team:bang') && x.endsWith('live')), JSON.stringify(f));
      assert(b.some(x => x.startsWith('drill:team:bang') && x.endsWith(TASK_WHY.away)), JSON.stringify(b));
      assert(c.some(x => x.startsWith('drill:team:breach@charge') && x.endsWith(TASK_WHY.toward)) && c.some(x => x.startsWith('drill:team:breach@pry') && x.endsWith('live')), JSON.stringify(c));
    },
  },
  {
    name: 'a save made while his task works (his walk to the front, his throw under way) carries on byte for byte, every item held exactly once and every id whole (ids-check)',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', loadout: 'flash' }), s = g.state, H = s.armoury.range.house, bot = teamTaskBot({ use: 'bang' });
      let i = 0;
      for (; i < 4000 && !(H.two.task?.st === 'working' && H.two.doing?.beats?.some(b => b.key === 'arm' && b.st !== 'wait')); i++) g.step(1, bot);
      const json = g.save(), h = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', loadout: 'flash' });
      h.load(json);
      const ids = checkIds(JSON.parse(json), g.sim.domains), holders = checkHolders(s);
      const b1 = teamTaskBot({ use: 'bang' }), b2 = teamTaskBot({ use: 'bang' });
      for (let k = 0; k < 400; k++) { g.step(1, b1); h.step(1, b2); }
      console.log(`      saved at tick ${i} (task ${JSON.parse(json).armoury?.range?.house?.two?.task?.st ?? '?'}, ${json.length} bytes): invalid ${ids.invalid.length}, dangling ${ids.dangling.length}, holders invalid ${holders.invalid.length}; 400 ticks on: ${g.digest()} and ${h.digest()}`);
      assert(JSON.parse(json).armoury.range.house.two.task?.st === 'working' && !ids.invalid.length && !ids.dangling.length && !holders.invalid.length && g.digest() === h.digest(), JSON.stringify({ ids: ids.invalid.slice(0, 3), holders: holders.invalid.slice(0, 3) }));
    },
  },
  {
    name: 'the review of v0.0.19: "#2, bang it" at the recruit and the private by the keys: while his bang is coming on your door (his task working, or its bang under BANG_HOLD_MS 2 s old: cqb.js bangPending) the DI never leads into a contact through the doorway he opened ("Cover it", then "Bang! Go."), and your Wait ends at the bang (6.36 s and 3.97 s from the bang to the entry before); every lane enters within 3.5 s of the bang, the private on 48213 and the recruit on 48718 among them, and the recruit on 48213 too, whose notice of 1a was missed: your entry on his bang is pre-armed (contact.js bangEntry, v0.0.20\'s close), his take-in made on the move and his pause past the threshold; before it he froze in the doorway, his pause came past the hold, the DI led him into the contact and he entered 6.85 s after the bang; an entry past BANG_LATE_MS + 0.5 s is charged on the room\'s row ("BANG TO ENTRY …") (quick: the recruit on 48213; the recruit on 48718 and the private on 48213 too in its heavy twin below, v0.0.28\'s stage 0)',
    timeoutMs: 60_000,
    fn() { bangLanes([['recruit', 48213]]); },
  },
  {
    name: 'the review of v0.0.19: "#2, bang it" at the recruit and the private by the keys: while his bang is coming on your door (his task working, or its bang under BANG_HOLD_MS 2 s old: cqb.js bangPending) the DI never leads into a contact through the doorway he opened ("Cover it", then "Bang! Go."), and your Wait ends at the bang (6.36 s and 3.97 s from the bang to the entry before); every lane enters within 3.5 s of the bang, the private on 48213 and the recruit on 48718 among them, and the recruit on 48213 too, whose notice of 1a was missed: your entry on his bang is pre-armed (contact.js bangEntry, v0.0.20\'s close), his take-in made on the move and his pause past the threshold; before it he froze in the doorway, his pause came past the hold, the DI led him into the contact and he entered 6.85 s after the bang; an entry past BANG_LATE_MS + 0.5 s is charged on the room\'s row ("BANG TO ENTRY …") (the heavy twin of the case above, v0.0.28\'s stage 0: the file over its quick CPU ceiling)',
    heavy: true,
    timeoutMs: 120_000,
    fn() { bangLanes([['recruit', 48213], ['recruit', 48718], ['private', 48213]]); },
  },
  {
    name: 'your #2\'s P-12 leaves the bang\'s entry where it was (v0.0.20\'s code review: the recruit on 48213 went from 3.10 s to 8.05 s with it): "#2, bang it" by the keys on 16 seeds a sheet, the recruit and the private, with his P-12 and with \'~two:none\'; the share entering within 3.5 s and the mean bang to entry within 1 s and one lane of each other (printed)',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      const rows = [];
      for (const tier of ['recruit', 'private']) for (const loadout of ['flash', 'flash~two:none']) {
        const xs = [];
        for (let i = 0; i < 16; i++) { const o = bangLane(tier, 48213 + i * 101, loadout); if (o.bangToEntry !== null) xs.push(o.bangToEntry / 1000); }
        rows.push({ tier, loadout, n: xs.length, fast: xs.filter(x => x < 3.5).length, mean: xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length) });
      }
      for (const r of rows) console.log(`      ${r.tier}, ${r.loadout}: ${r.fast} of ${r.n} within 3.5 s, mean ${fmt(r.mean, 2)} s`);
      for (const tier of ['recruit', 'private']) {
        const [a, b] = rows.filter(r => r.tier === tier);
        assert(Math.abs(a.mean - b.mean) < 1 && Math.abs(a.fast - b.fast) <= 1 + Math.abs(a.n - b.n), JSON.stringify({ a, b }));
      }
    },
  },
];
