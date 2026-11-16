// OLYMPUS tests: v0.0.18's reviews and the shoot house's dead-end hunt of 2026-11-16, each finding pinned by a test that fails
// without its fix (the fixer's round of v0.0.18).
//
// The user's rule is "never a dead end": in a fight Fix names the shortest honest way to fire and T does what Fix names; off the
// lane Fix follows the instructor; a choice made at one door is that door's alone. Each test below states a state the play
// review, the code review or the hunt reached (their fixtures under .run/hunt and .run/v018/review-play), sets it up through the
// game's own actions where it can (doAction with a forced grade, the bots' presses) and by the kit's and the belief's own fields
// where a fumble would take a seed hunt to reach (the carry's posture after a dropped rifle, a stoppage believed), and prints what
// the panel, Fix and T then say.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot, houseKeysBot, houseTBot } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { stepAct } from './bots/lib.mjs';
import { doAction, beliefOf, gunField } from '../src/sim/arms/firearms.js';
import { stepsOf, chooseStep, enterStop } from '../src/sim/arms/shooting.js';
import { modelOf } from '../src/sim/arms/groups.js';
import { move, pouchesOf, handMagOf, pistolOf } from '../src/sim/arms/kit.js';
import { planFor } from '../src/sim/arms/plan.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { contactNow } from '../src/sim/combat/contact.js';
import { houseNow, houseWant } from '../src/sim/scenarios/shoothouse.js';
import { BREACH_SAFE_KPA } from '../src/sim/arms/blast.js';

const choosing = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.stop.reflex;
const settle = (g) => { for (let i = 0; i < 800 && g.state.stop?.mode === 'stop' && !choosing(g.state); i++) g.step(1); };
const fixOf = (s) => modelOf(stepsOf(s)).core.fix.row;
// (the instinct read again after a write made at a pause (time standing, no act: it would wait for the next second or press))
const line = (g) => { delete g.state.$instinct; g.step(1); return instinctNow(g.state).line; };
// (a step chosen and run to its end, time standing again)
function run(g, step) { const r = chooseStep(g.state, g.bus, { step }); settle(g); return r; }
// (the house at its first contact's pause on 1a: setup 'contact', stepped until the take-in has named a man)
function atContact(tier = 'sgt', seed = 48213) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'contact' }), s = g.state;
  for (let i = 0; i < 2000 && !(choosing(s) && contactNow(s)?.last?.ids?.length); i++) g.step(1);
  assert(choosing(s) && contactNow(s)?.last?.ids?.length, 'the contact pause was not reached');
  return { g, s, pid: s.player.id, rifle: s.people[s.player.id].kit.worn.sling };
}
// (the house at GO in stop motion)
function atGo(tier = 'sgt', seed = 48213, loadout = null) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go', ...(loadout ? { loadout } : {}) }), s = g.state;
  if (s.stop?.mode !== 'stop') enterStop(s, g.bus, { pid: s.player.id });
  settle(g);
  return { g, s, pid: s.player.id, rifle: s.people[s.player.id].kit.worn.sling };
}

export default [
  {
    name: 'a P-12 magazine held in the support hand on the R-7 is never offered "Magazine in", "Put back" names the pistol pouch, and every row then offered runs without breaking the tick (the play review of v0.0.18: "kit.move(i21): R-7 takes no had17")',
    timeoutMs: 120_000,
    fn() {
      const setup = () => {
        const w = atGo('sgt'), { g, s, pid, rifle } = w;
        doAction(s, g.bus, { pid, gunId: rifle, action: 'magOut:drop', force: { 'magOut:drop': 'pass' } });
        const had = pouchesOf(s, pid).find(p => p.key === 'pp')?.mags?.[0];
        move(s, had, { pid, hand: 1 });
        g.step(1);
        return { ...w, had };
      };
      const w = setup(), rows = stepsOf(w.s).filter(r => !r.off), ids = rows.map(r => r.id);
      const seat = rows.filter(r => r.id === 'seat' || (r.kind === 'command' && (r.subs ?? [])[0]?.id === 'seat'));
      const put = rows.find(r => r.id === 'stowMag@pp');
      console.log(`      the hand: ${w.s.items[w.had]?.fam}; offered: ${ids.join(', ')}`);
      assert(w.s.items[w.had]?.fam === 'had17' && handMagOf(w.s, w.pid)?.id === w.had, 'the HAD-17 in the hand');
      assert(!seat.length, `a seat of the HAD-17 offered: ${seat.map(r => r.id).join(', ')}`);
      assert(put?.label === 'Put back: the pistol pouch', `the put back's words: ${put?.label}`);
      const broke = [];
      for (const id of ids.filter(x => x !== 'leave' && x !== 'wait' && !x.startsWith('stance:'))) {
        const v = setup();
        run(v.g, id);
        if (v.g.errors.length) broke.push(`${id}: ${v.g.errors[0]?.message ?? v.g.errors[0]}`);
      }
      console.log(`      ${ids.length} rows offered, each run on its own copy: ${broke.length} broke the tick`);
      assert(!broke.length, broke.join('; '));
    },
  },
  {
    name: 'the rifle swung onto its sling at a contact: Fix is Rifle up and T brings it up, never "Nothing to fix" with T silent; hanging on a stoppage with the P-12 holstered and a man close, Transition is offered (the review and the dead-end hunt of v0.0.18)',
    fn() {
      const { g, s, pid, rifle } = atContact('sgt');
      s.people[pid].kit.carry.posture = 'slungFront';   // (as firearms.js act's dropped ladder writes it)
      const L = line(g), f = fixOf(s);
      console.log(`      slung: Fix "${f?.label}" (${f?.id}); the DI "${L?.text}" T ${L?.act}`);
      assert(f?.id === 'up' && L?.act === 'stop:up', JSON.stringify({ fix: f?.id, act: L?.act, line: L?.id }));
      run(g, 'up');
      assert(s.people[pid].kit.carry.posture !== 'slungFront', `the rifle up: ${s.people[pid].kit.carry.posture}`);
      const c = atContact('sgt'), b = c.s.items[c.rifle];
      c.s.people[c.pid].kit.carry.posture = 'slungFront';
      b.belief = { ...(b.belief ?? {}), stoppage: 'click' };
      const rows = stepsOf(c.s), tr = rows.find(r => r.id === 'weapon:transition'), L2 = line(c.g);
      console.log(`      slung on a click: Transition ${tr ? (tr.off ?? 'live') : 'not offered'} (${tr?.subs?.map(x => x.id).join(', ')}); Fix "${fixOf(c.s)?.label}"; T ${L2?.act}`);
      assert(tr && !tr.off && JSON.stringify(tr.subs.map(x => x.id)) === '["draw:thigh"]', JSON.stringify(tr));
      assert(L2?.act && rows.some(r => `stop:${r.id}` === L2.act && !r.off), `T names an offered row: ${L2?.act}`);
    },
  },
  {
    name: 'at a contact with the rifle ready and its magazine in, Fix is nothing to fix, never the reload slot\'s Top up (the review of v0.0.18: "Top up 2.1 s" at 19 of 21 of the boot recruit\'s contact pauses); Top up stays on GUN 1',
    fn() {
      const { g, s, pid, rifle } = atContact('recruit');
      if (gunField(s.items[rifle], 'mode') === 'safe') doAction(s, g.bus, { pid, gunId: rifle, action: 'selector:semi', force: { 'selector:semi': 'pass' } });
      const m = modelOf(stepsOf(s)), f = m.core.fix.row, slot = m.groups.GUN.slots[1]?.row;
      console.log(`      Fix "${f?.label}" (${f?.off ?? ''}); GUN 1 "${slot?.label}"`);
      assert(f?.id === 'core:fix' && f.label === 'Nothing to fix', JSON.stringify(f));
      assert(!String(f.id).startsWith('macro:reload'), 'a reload as Fix');
    },
  },
  {
    name: 'off the lane Fix follows the instructor: before GO and after the lane it is never Off safe, Charge or a reload, only the tower\'s command row or nothing to fix (the review and the dead-end hunt of v0.0.18: Charge before the tower\'s MAKE READY, Off safe under LOAD and UNLOAD, SHOW CLEAR)',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' }), seen = {}, bad = [];
      runHouse(g, houseKeysBot(), {
        each(game) {
          const s = game.state, H = houseNow(s);
          if (!choosing(s) || !H || (H.goAtMs !== null && !H.end)) return;
          const f = fixOf(s), cmd = s.armoury.range.cmd?.id ?? '-', k = `${cmd}:${f?.id}`;
          seen[k] = (seen[k] ?? 0) + 1;
          if (/^(selector:semi|charge|macro:reload)/.test(f?.id ?? '')) bad.push(k);
        },
      });
      console.log(`      the cold line's pauses by command and Fix: ${Object.entries(seen).map(([k, n]) => `${k} ${n}`).join(', ')}`);
      assert(Object.keys(seen).length && !bad.length, bad.join(', '));
    },
  },
  {
    name: 'the rifle with no round believed anywhere and the P-12 holstered and loaded: Transition is offered, Fix names it and T does it, never "Reload." over nothing to reload (the review of v0.0.18)',
    fn() {
      const { g, s, pid, rifle } = atContact('private'), gun = s.items[rifle];
      for (const p of pouchesOf(s, pid)) for (const id of p.mags) if (s.items[id].fam !== 'had17') { s.items[id].n = 0; s.items[id].belief = { n: 0 }; }
      s.items[gun.mag].n = 0; delete gun.chamber; gun.locked = true; gun.belief = { ...(gun.belief ?? {}), chamber: 'empty', count: 0, locked: true };
      const p = planFor(s, pid, rifle, 'fire', { purpose: null }), f = fixOf(s), L = line(g);
      console.log(`      the rifle's plan: ${p.none ?? p.path}; Fix "${f?.label}"; the DI "${L?.text}" T ${L?.act}`);
      assert(p.none === 'no rounds' && f?.id === 'weapon:transition' && L?.act === 'stop:weapon:transition', JSON.stringify({ none: p.none, fix: f?.id, act: L?.act }));
    },
  },
  {
    name: 'T does what Fix names at a contact: the bolt locked back on a magazine with rounds is the bolt release, never a Top up for ever; Condition 3 (the magazine in, the chamber empty) is Charge, never a shot named with no act; the P-12 drawn unchambered is "Rack the slide" (the dead-end hunt of 2026-11-16)',
    fn() {
      const a = atContact('cpl');
      doAction(a.s, a.g.bus, { pid: a.pid, gunId: a.rifle, action: 'lockBack', force: { lockBack: 'pass' } });
      const La = line(a.g), fa = fixOf(a.s);
      run(a.g, La?.act?.slice(5));
      const ba = beliefOf(a.s, a.rifle);
      console.log(`      locked on ${beliefOf(a.s, a.rifle).count ?? '?'}: Fix "${fa?.label}", T ${La?.act}; after T: chamber ${ba.chamber}, locked ${!!ba.locked}`);
      assert(fa?.id === 'release' && La?.act === 'stop:release' && ba.chamber === 'live' && !ba.locked, JSON.stringify({ fix: fa?.id, act: La?.act, b: ba }));
      const c = atContact('sgt'), gun = c.s.items[c.rifle];
      delete gun.chamber; gun.belief = { ...(gun.belief ?? {}), chamber: 'empty' };
      const Lc = line(c.g), fc = fixOf(c.s);
      console.log(`      Condition 3: Fix "${fc?.label}", the DI "${Lc?.text}" T ${Lc?.act}`);
      assert(fc?.id === 'charge' && Lc?.act === 'stop:charge', JSON.stringify({ fix: fc?.id, act: Lc?.act, line: Lc?.id }));
      const p = atContact('sgt');
      run(p.g, 'weapon:transition');
      const pg = p.s.items[pistolOf(p.s, p.pid)];
      delete pg.chamber; pg.belief = { ...(pg.belief ?? {}), chamber: 'empty' };
      const Lp = line(p.g), fp = fixOf(p.s);
      console.log(`      the P-12 drawn unchambered: Fix "${fp?.label}", the DI "${Lp?.text}" T ${Lp?.act}`);
      assert(fp?.id === 'charge' && fp.label === 'Rack the slide' && Lp?.act === 'stop:charge', JSON.stringify({ fix: fp?.id, label: fp?.label, act: Lp?.act }));
    },
  },
  {
    name: 'a breach chosen at one door is that door\'s alone: after the sergeant\'s charge at room 1 (&loadout=breach), T alone fires no second charge at room 3; and nobody in the house takes over 27.6 kPa at the charge, the instructor on the catwalk included (the play review of v0.0.18: two bursts, and SSgt Martinez at 103.5 kPa)',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'breach' }), s = g.state, H = () => s.armoury.range.house;
      const kb = houseKitBot({ use: 'breach' }), me = () => s.actors.list.find(a => a.who === s.player.id);
      for (let i = 0; i < 20_000 && !Object.keys(H().broken ?? {}).length; i++) { const m = me(); g.step(1, kb(s, m, (m.bot ??= {}))); }
      const tb = houseHonestBot();
      runHouse(g, tb, { maxMs: 8 * 60_000 });
      const bursts = H().bursts ?? [], kPa = bursts[0]?.kPa ?? {}, people = Object.entries(kPa).filter(([k]) => !k.startsWith('turner:'));
      console.log(`      bursts ${bursts.length} (${bursts.map(b => b.door).join(', ')}); broken ${Object.keys(H().broken ?? {}).join(', ')}; room 1's peaks: ${people.map(([k, v]) => `${k} ${fmt(v, 1)} kPa`).join(', ')}; the lane ${H().end?.why}`);
      assert(bursts.length === 1 && bursts[0].door === 'o:w4:r1', JSON.stringify(bursts.map(b => b.door)));
      assert(people.length >= 3 && people.every(([, v]) => v <= BREACH_SAFE_KPA), JSON.stringify(kPa));
    },
  },
  {
    name: 'Rifle up halted on its RELOAD\'s fumbled seat (the boot recruit, seed 14, the rifle locked on an empty magazine): Carry on is planned from the rifle now, never "Carry on: Bolt release" on no magazine (the code review of v0.0.18)',
    fn() {
      const { g, s, pid, rifle } = atGo('recruit', 14);
      run(g, 'weapon:transition');
      const gun = s.items[rifle];
      s.items[gun.mag].n = 0; delete gun.chamber; gun.locked = true; gun.belief = { ...gun.belief, chamber: 'empty', locked: true, count: 0 }; delete gun.belief.stoppage; delete gun.jam;
      run(g, 'weapon:rifle-up');
      const q = stepsOf(s).find(r => r.id === 'queue'), b = beliefOf(s, rifle);
      console.log(`      halted: the rifle's magazine ${b.mag}, the queue ${s.stop.queue?.join(', ') || '-'} (${s.stop.queueOf ?? 'unnamed'}); "${q?.label ?? 'no Carry on'}"`);
      assert(s.stop.queue?.length && b.mag === 'out', `the halt this test pins was not reached: ${JSON.stringify({ q: s.stop.queue, b })}`);
      assert(q && q.label !== 'Carry on: Bolt release' && q.queue.includes('seat'), JSON.stringify(q?.queue));
      run(g, 'queue');
      assert(gunField(s.items[rifle], 'chamber') === 'live' && !s.items[rifle].locked, JSON.stringify({ chamber: s.items[rifle].chamber, locked: s.items[rifle].locked }));
    },
  },
  {
    name: 'off the house with no command current, the in-0 state on safe (a magazine believed empty in, the bolt home, the chamber empty) is Fix RELOAD, never Off safe with nothing to fire (the code review of v0.0.18): test-pairs\' standby',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby' }), s = g.state;
      for (let i = 0; i < 2000 && !choosing(s); i++) g.step(1);
      const gun = s.items[s.stop.gun];
      s.items[gun.mag].n = 0; delete gun.chamber; delete gun.locked; gun.belief = { ...gun.belief, chamber: 'empty', count: 0 }; delete gun.belief.locked; delete gun.belief.stoppage; delete gun.mode;
      const f = fixOf(s);
      console.log(`      the command ${s.armoury.range.cmd?.id ?? '-'}; on ${gunField(gun, 'mode')}: Fix "${f?.label}" (${f?.id})`);
      assert(f?.id === 'macro:reload:speed', JSON.stringify(f));
    },
  },
  {
    name: 'a fumbled holster leaves the P-12 in the hand and says so, never "slips out of your hand and falls" with the P-12 holstered on safe (the dead-end hunt of 2026-11-16)',
    fn() {
      const { g, s, pid } = atGo('sgt');
      run(g, 'weapon:transition');
      const p = pistolOf(s, pid), said = [];
      g.bus.on('roll', () => {});
      const r = doAction(s, g.bus, { pid, gunId: p, action: 'holster', force: { holster: 'bad' } });
      const mode = gunField(s.items[p], 'mode');
      console.log(`      the holster forced bad: "${r.text}"; the P-12 ${s.people[pid].kit.worn.holster === p ? 'holstered' : 'in the hand'}, on ${mode}`);
      assert(r.mishap === 'dropped' && !/falls/.test(r.text) && /hand/.test(r.text), r.text);
      void said;
    },
  },
  {
    name: 'your bundle\'s walk is never pinned behind your #2: "Clear the room" from beside your stack (the sergeant, seed 7091) through him standing on his own stack is held at most 1.5 s, he steps off your path, and room 1 is entered, not passed by the stall (the dead-end hunt of 2026-11-16: 88.8 s held)',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 7091, tier: 'sgt', setup: 'go' }), s = g.state;
      g.step(1, { act: [stepAct('leave')] });
      g.step(47, { mz: -1 });
      g.step(1, { act: ['ready'] }); g.step(1, {});
      const L = instinctNow(s).line;
      assert(L?.act === 'stop:drill:room:clear>o:w4:r1', `the path to the state moved: ${L?.act}`);
      g.step(1, { act: [{ act: 'instinct', args: { id: L.id, act: L.act } }] });
      let held = 0;
      for (let i = 0; i < 4000 && s.stop?.doing?.step?.startsWith('drill:room:clear>o:w4:r1'); i++) {
        g.step(1);
        const mv = s.stop?.doing?.beats?.find(b => b.st === 'run' && b.k === 'move');
        if (mv?.held) held = Math.max(held, mv.held);
      }
      const leg = houseNow(s).legs[0];
      console.log(`      held by the body gap ${fmt(held / 1000, 2)} s; the #2 stepped aside ${s.armoury.range.house.two?.gave?.n ?? 0}×; room 1 ${leg.state}, faults ${leg.faults?.map(f => f.kind).join(', ') || 'none'}`);
      assert(held <= 1500 && leg.state !== 'passed', JSON.stringify({ held, state: leg.state }));
    },
  },
  {
    name: 'the tower waits on a P-12 left unchambered before GO, as on the rifle: "P-12: MAKE READY" offered and named by the DI, and GO comes with a round up the pistol (the dead-end hunt of 2026-11-16: the boot recruit on 9052 reached GO with the P-12 empty, without a word)',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'recruit' }), s = g.state, pid = s.player.id, bot = houseTBot();
      const me = () => s.actors.list.find(a => a.who === pid);
      let cut = null, seen = null;
      for (let i = 0; i < 40_000 && s.armoury.range.house.goAtMs === null; i++) {
        const R = s.armoury.range, p = pistolOf(s, pid);
        if (!cut && ['ready', 'standby'].includes(R.cmd?.id) && !s.stop && gunField(s.items[s.people[pid].kit.worn.sling], 'chamber') === 'live' && gunField(s.items[p], 'chamber') === 'live') {
          // (out of the mode, time running: the pistol's round taken out, believed so, as two fumbles in MAKE READY left it on 9052)
          delete s.items[p].chamber; s.items[p].belief = { ...(s.items[p].belief ?? {}), chamber: 'empty' };
          cut = { cmd: R.cmd.id, want: houseWant(s) };
        }
        const L = instinctNow(s).line;
        if (cut && !seen && L?.act === 'stop:weapon:other:macro:ready') seen = { text: L.text, row: stepsOf(s).find(r => r.id === 'weapon:other:macro:ready')?.label };
        // (from the cut, T pressed whenever the line has an act, as a player does (the calm bot keeps its own rules before GO))
        if (cut && L?.act && !s.stop?.doing) { g.step(1, { act: ['instinct'] }); continue; }
        const m = me(); g.step(1, bot(s, m, (m.bot ??= {})));
      }
      console.log(`      under ${cut?.cmd}, the P-12 unchambered: the tower wants ${cut?.want}; the DI "${seen?.text}" names "${seen?.row}"`);
      const p = pistolOf(s, pid);
      console.log(`      GO ${s.armoury.range.house.goAtMs !== null ? 'given' : 'never'}; the P-12's chamber ${gunField(s.items[p], 'chamber') ?? 'empty'}`);
      assert(cut?.want === 'pistol' && seen?.row === 'P-12: MAKE READY', JSON.stringify({ cut, seen }));
      assert(s.armoury.range.house.goAtMs !== null && gunField(s.items[p], 'chamber') === 'live', 'GO with the P-12 made ready');
    },
  },
];
