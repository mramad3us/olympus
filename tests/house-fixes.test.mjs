// OLYMPUS tests: the shoot house's review findings of 0.0.12, each pinned so it fails without its fix (the fixer's pass; COMBAT §25.7, §25.8, §25.10; the build sheet 0.0.12 §2.2, §2.3).
//
// The user's rule for this scene (2026-11-07): "a recruit marine would have to do everything step by step while an
// experience Tier 1 Operator would have "automations through pressing T"", with "no watering down but factor in experience
// in how smooth and fast we do things", and never a dead end: every DI line names a row the panel has, and T does it.
// The heart of these tests is the T player (tests/bots/house.mjs houseTBot): the lane by T alone, the player shooting only
// the men of his own corner where the line names the shot, his #2 trusted with his. Before the fixes, on seed 48213:
// the sergeant's T waited for ever on a #2 already in place (cqb-two, 15 s a press) and ended at the lane's 10 minutes;
// T called room 1 "Clear!" with the #2's man up and unfired on; the #2 fired 0 to 2 rounds in the lane; every sheet
// missed its par on the #2's men, timed from your sighting. Also: the #2's hand-back on the door decided once at the
// beat's start (3 s on a man who arrived in 1.6), a rushed walk 40% short of the stack, the #2's Dominate halted in his
// own window and never run again, the spin's bias never on a man's hole, the #2 reading the player's aim, "Plate.
// Head." on a no-shoot, the drill's rows and T before GO, the hall's twin names, the picker's "{two}". The second pass: "Carry
// on" from the aim walked the room aimed and took the muzzle fault on the #2; the pause bracketed his man; the room's call
// polled 0.25 s past his; the closet's question asked from the doorway where Hold it was not offered, and T walked on; the
// brief never named the deck's gravity; struck Fire and Aim held two of the first keys at GO.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { drillWorld } from './drill-world.mjs';
import { houseBot, houseTBot, runHouse } from './bots/house.mjs';
import { CALL_FLOW_S } from '../src/sim/combat/bundle.js';
import { TICK_MS } from '../src/core/clock.js';
import { houseNow, runSheetOf, TWO_FOLLOW_N } from '../src/sim/scenarios/shoothouse.js';
import { stepsOf, chooseStep } from '../src/sim/arms/shooting.js';
import { panelOf } from '../src/sim/arms/panel.js';
import { contactNow } from '../src/sim/combat/contact.js';
import { shotRows, rowPlan } from '../src/sim/arms/specials.js';
import { heldOf, sectorAim, resolveShot } from '../src/sim/arms/shot.js';
import { manHole } from '../src/sim/arms/paper.js';
import { turnerTargets } from '../src/sim/arms/turners.js';
import { firedNow } from '../src/sim/skills/instinct.js';
import { CQB_RULES, walkWords } from '../src/sim/skills/instinct/cqb.js';
import { runSlot, planBundle, HANDBACK_WORDS, TWO_SLOT_M, TWO_WAIT_MS, carryRow } from '../src/sim/combat/bundle.js';
import { openingState } from '../src/sim/places/model.js';
import { setPost } from '../src/sim/people/staff.js';
import { HOUSE1 } from '../src/data/places/wheel.js';
import { SCENES } from '../src/data/scenes.js';

const pick = (g, id, tempo = 'normal') => g.step(1, { act: [{ act: 'stop', args: { step: id, tempo } }] });
const settle = (g, s, max = 4000) => { let n = 0; while (n++ < max && !(s.stop?.mode === 'stop' && s.stop.phase === 'choose')) g.step(1); return n; };
const lines = (s) => firedNow(s, s.clock.ms, CQB_RULES);
// (the #2 posted at x, z, his record the house's)
function postTwo(w, x, z, rung = 2) {
  const { g, s, pid } = w, twoPid = s.actors.list.find(a => a.who !== pid).who;
  setPost(s, twoPid, { key: 'house-two', area: HOUSE1.area, x, z, face: 'left', outfit: 'combatSuit' });
  g.step(1);
  const rec = { pid: twoPid, aid: s.actors.list.find(a => a.who === twoPid).id, rung, doing: null, contact: null, eng: null, known: {}, ident: {} };
  s.armoury.range.house = { two: rec };
  return { twoPid, rec, actor: () => s.actors.list.find(a => a.who === twoPid) };
}

/** The lane on a seed by T alone (see the header): { g, N, card, mem, says, carryLabels, ms }. */
export function tLane(tier, seed = 48213, more = null) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' });
  const says = [], carryLabels = new Set(), halts = [], pid = g.state.player.id, t0 = g.state.clock.ms;
  const r = runHouse(g, houseTBot(), {
    maxMs: 12 * 60_000,
    each: (game) => {
      for (const f of game.facts('say')) says.push({ atMs: game.state.clock.ms, who: f.who, text: f.text });
      for (const f of game.facts('bundle')) if (f.who === pid && f.phase === 'halt') halts.push({ atMs: f.atMs, why: f.why });
      const c = game.state.stop?.carry ? carryRow(game.state) : null;
      if (c) carryLabels.add(c.label);
      more?.(game);
    },
  });
  const N = houseNow(g.state), sheet = runSheetOf(g.state);
  return { g, N, card: sheet.card, mem: r.mem, says, carryLabels: [...carryLabels], halts, ms: g.state.clock.ms - t0, done: r.done };
}

export default [
  {
    name: 'by T alone, the player shooting only his own corner\'s men where the line names the shot, every sheet from the corporal to the tier one reaches the card with 6 of 6 threats down and the #2 firing on his own men (1b, 3a); never a "two" hand-back left waiting on a man in place, never a raw beat key in "Carry on", the #2\'s echo and the dummy\'s word said once (the fixer\'s of 0.0.12: the sergeant\'s T waited for ever, the #2 fired 0 to 2 rounds, room 1 called clear with his man up)',
    timeoutMs: 240_000,
    fn() {
      for (const tier of ['cpl', 'sgt', 'raider', 'tierone']) {
        const run = tLane(tier), { N, mem, says } = run, twoPid = N.two?.pid;
        const twoKeys = N.turners.filter(T => T.slot === 2), byTwo = twoKeys.filter(T => T.down && T.hits?.some?.(h => h.by === 'two'));
        const chief = says.filter(x => /dummy/i.test(x.text)), echoes = says.filter((x, i) => x.who === twoPid && x.text === 'Clear!' && says.slice(0, i).some(y => y.who === twoPid && y.text === 'Clear!' && x.atMs - y.atMs < 1000));
        const raw = run.carryLabels.filter(l => /\b\d:\w/.test(l));
        console.log(`      ${tier.padEnd(8)} ${run.done ? 'card' : 'NO CARD'} in ${fmt(run.ms / 1000, 1)} s: "${run.card}"; T ${mem.T ?? 0}, refused ${mem.refused ?? 0}, waits ${mem.waits ?? 0}; the #2 fired ${N.two?.fired}, his men ${twoKeys.map(T => `${T.stand}${T.down ? ' down' : ' UP'}`).join(', ')}; halts ${run.halts.map(h => h.why).join(' ') || 'none'}`);
        assert(run.done && /6 OF 6 THREATS/.test(run.card) && /AT 1 G/.test(run.card), JSON.stringify({ tier, card: run.card }));
        assert(twoKeys.every(T => T.down) && N.two.fired >= 2, JSON.stringify({ tier, fired: N.two.fired, two: twoKeys.map(T => [T.stand, T.down]) }));
        assert(!run.halts.some(h => h.why === 'two') || tier === 'cpl', JSON.stringify({ tier, halts: run.halts }));
        assert(!raw.length && echoes.length === 0 && chief.every((x, i) => !chief.slice(0, i).some(y => y.atMs === x.atMs)), JSON.stringify({ tier, raw, echoes, chief }));
        if (tier === 'tierone') assert(!/FIRED FIRST/.test(run.card), `the tier one's par on the #2's men timed from the #2's own sighting: ${run.card}`);
      }
    },
  },
  {
    name: 'the #2 not with you: the hand on the door waits only until he is within 1.5 m of his slot, then opens it with no hand-back (his walk\'s closed form); from rung 3 the approach is never cut for him (the fixer\'s of 0.0.12: decided at the beat\'s start, 3 s on a man who arrived in 1.6 s, the approach cut 2.05 m short)',
    fn() {
      for (const tier of ['cpl', 'sgt']) {
        const w = drillWorld({ tier }), { g, s } = w, plan = w.lane.plans['o:w4:r1'], st2 = plan.stack[1];
        // (the #2 8 m behind his slot along the hall, his own stack walk started: he comes within 1.5 m during the hand's wait)
        const P = postTwo(w, st2[0] + 8, st2[1], tier === 'cpl' ? 2 : 3);
        runSlot(s, g.bus, P.rec, s.clock.ms);
        const row = stepsOf(s).find(r => r.id.startsWith(tier === 'cpl' ? 'drill:room:stack-open>' : 'drill:room:clear>'));
        const t0 = s.clock.ms;
        pick(g, row.id);
        let openAt = null, inAt = null, carry = null, n = 0;
        while (n++ < 400 && openAt === null && !s.stop?.carry) {
          g.step(1); runSlot(s, g.bus, P.rec, s.clock.ms);
          const a = P.actor();
          if (inAt === null && Math.hypot(a.x - st2[0], a.z - st2[1]) <= TWO_SLOT_M) inAt = s.clock.ms;
          if (openingState(s, 'o:w4:r1') === 'open') openAt = s.clock.ms;
        }
        carry = s.stop?.carry ?? null;
        const me = w.me(), offStack = Math.hypot(me.x - plan.stack[0][0], me.z - plan.stack[0][1]);
        console.log(`      ${tier}: the #2 within ${TWO_SLOT_M} m at ${fmt((inAt - t0) / 1000, 2)} s, the door open at ${openAt === null ? '-' : fmt((openAt - t0) / 1000, 2)} s, hand-back ${carry?.why ?? 'none'}, you ${fmt(offStack, 2)} m off your stack when it opened`);
        assert(openAt !== null && !carry && inAt !== null && openAt > inAt && openAt - inAt <= 1000 && offStack < 0.65, JSON.stringify({ tier, openAt, inAt, carry: carry?.why, offStack }));
      }
    },
  },
  {
    name: 'a rushed bundle reaches the stack: its walks are the legs\' profile (never ×0.6 by time alone), its hands and eyes rushed (the fixer\'s of 0.0.12: a rushed walk ended 40% short)',
    fn() {
      const w = drillWorld({ tier: 'private' }), { g, s } = w, plan = w.lane.plans['o:w4:r1'];
      const normal = planBundle(s, w.pid, 'room:stack', { door: 'o:w4:r1' }), rushed = planBundle(s, w.pid, 'room:stack', { door: 'o:w4:r1', tempo: 'rushed' });
      const mv = (p) => p.beats.find(b => b.k === 'move').ms;
      pick(g, stepsOf(s).find(r => r.id.startsWith('drill:room:stack>')).id, 'rushed');
      settle(g, s);
      const me = w.me(), off = Math.hypot(me.x - plan.stack[0][0], me.z - plan.stack[0][1]);
      console.log(`      the approach ${mv(normal)} ms, rushed ${mv(rushed)} ms; the stack ${normal.ms} ms, rushed ${rushed.ms} ms; you end ${fmt(off, 3)} m off the stack`);
      assert(mv(rushed) === mv(normal) && rushed.ms < normal.ms && off < 0.05, JSON.stringify({ mv: [mv(normal), mv(rushed)], ms: [normal.ms, rushed.ms], off }));
    },
  },
  {
    name: 'the #2 planned at his own rung (a private\'s #2 brings his muzzle onto the door as his #1 does), and his Dominate run to its end before his room counts swept (the fixer\'s of 0.0.12: planned at rung 2 or above; swept when planned)',
    fn() {
      const w = drillWorld({ tier: 'private' }), { g, s } = w, st2 = w.lane.plans['o:w4:r1'].stack[1];
      const P = postTwo(w, st2[0] + 2, st2[1], 0);
      runSlot(s, g.bus, P.rec, s.clock.ms);
      const keys = P.rec.doing?.beats?.map(b => b.key) ?? [];
      // (Dominate halted in his window: not swept, and planned again once his man is dealt with)
      const pt = w.lane.plans['o:w4:r1'].points[1];
      const a = P.actor(); a.x = pt[0] - 0.8; a.z = pt[1]; s.people[P.twoPid].post.x = a.x; s.people[P.twoPid].post.z = a.z;
      P.rec.doing = null; P.rec.last = null;
      w.me().x = w.lane.plans['o:w4:r1'].points[0][0]; w.me().z = w.lane.plans['o:w4:r1'].points[0][1];
      runSlot(s, g.bus, P.rec, s.clock.ms);
      const first = P.rec.doing?.bundle;
      P.rec.contact = { key: 'turner:2', seenMs: s.clock.ms, untilMs: s.clock.ms + 500, ms: 500 };
      runSlot(s, g.bus, P.rec, s.clock.ms);
      const swept1 = !!P.rec.swept?.['o:w4:r1'];
      P.rec.contact = null;
      chooseStep(s, g.bus, { step: 'leave' });
      for (let i = 0; i < 200 && !P.rec.swept?.['o:w4:r1']; i++) { g.step(1); runSlot(s, g.bus, P.rec, s.clock.ms); }
      const b = P.actor();
      console.log(`      a private's #2 stacks with ${keys.join(', ')}; in the room ${first}, halted by his contact (swept ${swept1}), then swept at his point ${fmt(Math.hypot(b.x - pt[0], b.z - pt[1]), 2)} m off`);
      assert(keys.includes('muzzle') && first === 'room:dominate' && !swept1 && P.rec.swept?.['o:w4:r1'] && Math.hypot(b.x - pt[0], b.z - pt[1]) < 0.1, JSON.stringify({ keys, first, swept1 }));
    },
  },
  {
    name: 'the spin moves a man\'s hole on a turner as the wind would and never its zone or odds; and the #2 never borrows your held aim or your sector take-in (the fixer\'s of 0.0.12)',
    fn() {
      const w = drillWorld({ tier: 'tierone' }), { s } = w, T = w.T('1a');
      T.turnAtMs = s.clock.ms - 2000;
      const me = w.me(); me.x = T.x + 10; me.z = T.z; me.headRad = Math.PI;
      const target = { ...turnerTargets(s, s.clock.ms).find(t => t.key === T.key), dM: 10 };
      const { shot } = resolveShot(s, null, { pid: w.pid, gunId: w.gunId, target, part: 'torso', log: false });
      const flat = shot.roll ? manHole(T.face, 'torso', shot.roll, shot.id, s.meta.seed) : null;
      const at = shot.hole?.at ?? null;
      console.log(`      10 m along the Wheel's spin: the hole at ${JSON.stringify(at)}, the roll's ${JSON.stringify(flat?.at ?? null)} (zone ${shot.zone} against ${flat?.zone})`);
      assert(at && flat?.at && (at[0] !== flat.at[0] || at[1] !== flat.at[1]) && Math.hypot(at[0] - flat.at[0], at[1] - flat.at[1]) < 3 && shot.zone === flat.zone, JSON.stringify({ at, flat, zone: shot.zone }));
      // (the #2 against your aim and your sector take-in on the same man)
      const twoPid = s.actors.list.find(a => a.who !== w.pid).who;
      s.stop.aim = { key: T.key, settledMs: s.clock.ms - 3000 };
      s.mind.clearing = { room: 'w4.r1', fromMs: s.clock.ms };
      const hp = heldOf(s, w.pid, s.clock.ms, T.key), h2 = heldOf(s, twoPid, s.clock.ms, T.key);
      s.armoury.range.house = { two: { pid: twoPid, contact: { key: T.key, expect: 'area' } } };
      const sec2 = sectorAim(s, twoPid, target), plan2 = rowPlan(s, twoPid, 'shot:pair', target, { gunId: w.gunId, odds: false });
      console.log(`      your aim held ${hp.v}, the #2's ${h2.aimed ? h2.v : 'none'}; his sector aim ${sec2}; his pair's parts ${plan2.parts.map(p => p.k).join(', ')}`);
      assert(hp.aimed && !h2.aimed && !sec2, JSON.stringify({ hp, h2, sec2 }));
    },
  },
  {
    name: 'a no-shoot hit twice in the torso gets no "Head" line and no To the head row (the fixer\'s of 0.0.12: "Plate. Head." and T aimed at him, eleven no-shoot hits)',
    fn() {
      const w = drillWorld({ tier: 'tierone' }), { s } = w, T = w.T('2b'), p2 = w.lane.plans['o:w4:r2'];
      T.turnAtMs = s.clock.ms - 2000;
      w.me().x = p2.points[0][0]; w.me().z = p2.points[0][1];
      T.hits = [{ shotId: 'x1', part: 'torso', zone: 'A', ring: false, through: false, at: [0, 0], atMs: s.clock.ms - 500, by: 'me' }, { shotId: 'x2', part: 'torso', zone: 'A', ring: false, through: false, at: [1, 1], atMs: s.clock.ms - 400, by: 'me' }];
      s.stop.pick = T.key;
      const L = lines(s), rows = shotRows(s, w.pid).map(r => r.id);
      console.log(`      2b, a no-shoot with two torso hits: lines ${L.map(l => l.id).join(', ') || 'none'}; rows ${rows.join(', ')}`);
      assert(!L.some(l => l.id === 'cqb-still-up') && !rows.includes('shot:head'), JSON.stringify({ L: L.map(l => l.id), rows }));
    },
  },
  {
    name: 'before GO the instructor\'s commands lead: at LOAD no drill row in the panel and the line is LOAD\'s, T doing it (the fixer\'s of 0.0.12: "T: Stack on the door" at LOAD walked a cold rifle to room 1); the picker\'s goal holds no blank',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' }), s = g.state;
      let n = 0;
      while (n++ < 4000 && s.armoury.range.cmd?.id !== 'load') g.step(1);
      chooseStep(s, g.bus, { step: 'leave' });
      g.step(1, { act: ['ready'] }); g.step(2);
      const rows = stepsOf(s).map(r => r.id), L = firedNow(s);
      console.log(`      at LOAD: drill rows ${rows.filter(r => /^(drill:|door:|watch:)/.test(r)).length}, the lines ${L.map(l => `${l.id}→${l.act}`).join(', ')}`);
      assert(s.stop && !rows.some(r => /^(drill:|door:|watch:)/.test(r)) && L.some(l => l.id === 'range-cmd' && l.act === 'stop:macro:load') && !L.some(l => l.id.startsWith('cqb-')), JSON.stringify({ rows: rows.slice(0, 8), L: L.map(l => [l.id, l.act]) }));
      assert(!/[{}]/.test(SCENES['test-shoothouse'].goal), SCENES['test-shoothouse'].goal);
    },
  },
  {
    name: 'the DI\'s words fit the room and the door: the walk in by the keys names each room\'s own keys and corner side; a lane door that held a kick "held", never "hold it"; the house\'s rest counted; the hall\'s two corners named apart (the fixer\'s of 0.0.12)',
    fn() {
      const w = drillWorld({ tier: 'private' }), plans = w.lane.plans;
      const ww = ['o:w4:r1', 'o:w4:r2', 'o:w4:r3'].map(d => walkWords(plans[d]));
      console.log(`      the walk in: ${ww.map((x, i) => `room ${i + 1} ${x.keys}, corner ${x.side}`).join('; ')}`);
      assert(ww[0].keys.includes('Z') && ww[1].keys.includes('S') && !ww[1].keys.includes('Z') && ww[2].side === 'right', JSON.stringify(ww));
      const { s } = w;
      s.stop.carry = { from: 'x', bundle: 'room:stack-open', door: 'o:w4:r1', rung: 2, variant: {}, beats: ['door'], why: 'refused', words: null, paths: {} };
      w.me().x = plans['o:w4:r1'].stack[0][0]; w.me().z = plans['o:w4:r1'].stack[0][1];
      const lk = lines(s).find(l => l.id === 'cqb-locked');
      const said = lk ? lk.rule.text[lk.ctx.words] : null;
      console.log(`      a kick held at room 1's door (not locked): ${lk?.act} "${said?.[0]}"; the bundle's own words "${HANDBACK_WORDS['refused-held']}"`);
      assert(lk && lk.act === 'stop:door:kick>o:w4:r1' && said.every(t => !/hold it/i.test(t)), JSON.stringify({ act: lk?.act, said }));
      s.stop.carry = null;
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'raider', setup: 'hall' });
      g.step(1);
      const watch = stepsOf(g.state).filter(r => r.id.startsWith('watch:')).map(r => r.label);
      const g3 = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'raider', setup: 'room:2' });
      g3.step(1);
      // (off the stack, room 2's door ahead: the house's rest to clear)
      const me3 = g3.state.actors.list.find(a => a.who === g3.state.player.id); me3.x += 1.5; me3.$px = me3.x;
      g3.step(1);
      const st = firedNow(g3.state).find(l => l.id === 'cqb-stack'), stWords = st ? st.rule.text[st.ctx.words] : [];
      console.log(`      the hall's watches: ${watch.join(' | ')}; the Raider at room 2: "${String(stWords[0]).replace('{left}', st?.ctx.left)}"`);
      assert(watch.length >= 2 && new Set(watch).size === watch.length && st?.ctx.words === 'r4rest' && /Two rooms and the hall/.test(st.ctx.left), JSON.stringify({ watch, st: st?.ctx.words, left: st?.ctx.left }));
    },
  },
  {
    name: 'the funnel counts the feet stopped in the doorway, never a walk through it: the corporal by T on 48213 has no doorway fault in any room (the fixer\'s of 0.0.12: 1.30 s moving and 0.05 still was faulted in every room)',
    timeoutMs: 120_000,
    fn() {
      const run = tLane('cpl'), faults = run.N.legs.flatMap(L => L.faults.filter(f => f.kind === 'funnel').map(() => L.word));
      console.log(`      the corporal: doorway faults ${faults.join(', ') || 'none'}; doorway seconds ${run.N.legs.map(L => fmt((L.doorwayMs ?? 0) / 1000, 2)).join(', ')}`);
      assert(!faults.length, JSON.stringify(faults));
    },
  },
  {
    name: `the #2 follows up on a man still up after his row (at most ${TWO_FOLLOW_N} times, To the head after "he's still up"), on the same mechanics (the fixer's of 0.0.12: a missed round left 1b up for the rest of the room)`,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), s = g.state, H = s.armoury.range.house, W = H.two;
      const T = s.armoury.range.turners.find(t => t.stand === '1b');
      const a = s.actors.list.find(x => x.who === H.twoPid), pt = [T.x + 3, T.z + 1.5];
      a.x = pt[0]; a.z = pt[1]; s.people[H.twoPid].post.x = pt[0]; s.people[H.twoPid].post.z = pt[1];
      chooseStep(s, g.bus, { step: 'leave' });
      for (let i = 0; i < 30; i++) g.step(1);
      W.contact = { key: T.key, seenMs: s.clock.ms, untilMs: s.clock.ms, ms: 0, expect: 'area' };
      W.eng = { key: T.key, row: 'pair', follow: 0, rounds: [{ atMs: s.clock.ms, part: 'torso', follow: 0, climbK: 1, i: 0, n: 1, done: true }] };
      g.step(1);
      const E = W.eng;
      console.log(`      1b up and facing after the #2's row: his next ${E ? `${E.row} (follow ${E.follow}), ${E.rounds.length} round(s)` : 'nothing'}`);
      assert(E && E.follow === 1 && E.key === T.key, JSON.stringify(E));
    },
  },
  {
    name: '"Carry on" with the rifle at the aim starts with the muzzle up (a hands beat, flowing with the feet from rung 3): the sergeant by T on 48213 walks the rooms at high ready and takes no muzzle fault on his #2 (the fixer\'s second pass of 0.0.12: the carry walked room 1 aimed, "Muzzle! Not across your number two.")',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }), firsts = [];
      runHouse(g, houseBot({ mode: 'T' }), { maxMs: 12 * 60_000, each: (game) => { const s = game.state; for (const f of game.facts('bundle')) if (f.phase === 'start' && f.id === 'drill:carry' && f.who === s.player.id) firsts.push(s.stop?.doing?.beats?.[0]?.key ?? null); } });
      const N = houseNow(g.state), muzzle = N.legs.flatMap(L => L.faults.filter(f => f.kind === 'muzzle').map(() => L.word));
      console.log(`      the sergeant's carries begin with ${firsts.join(', ')}; muzzle faults ${muzzle.join(', ') || 'none'}; ${N.summary}`);
      assert(!muzzle.length && firsts.some(k => /(^|:)up$/.test(k ?? '')), JSON.stringify({ muzzle, firsts }));
    },
  },
  {
    name: 'the pause\'s bracket in a clear with a #2 goes to your own corner\'s man first, his man after (the fixer\'s second pass of 0.0.12: setup contact bracketed 1b and offered "Aim at the far right target", across his sector)',
    fn() {
      for (const tier of ['private', 'tierone']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'contact' }), s = g.state;
        let n = 0;
        while (n++ < 400 && !contactNow(s)?.last) g.step(1, s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !contactNow(s)?.pending ? { act: [{ act: 'stop', args: { step: 'leave' } }] } : { mz: -1, mx: -1 });
        const c = contactNow(s)?.last, aim = stepsOf(s).find(r => r.id === 'aim');
        console.log(`      ${tier}: the window ${c?.ids?.join(', ')}, the bracket ${s.stop?.pick}${aim ? `, "${aim.label}"` : ''}`);
        assert(c?.ids?.length >= 2 && s.stop?.pick === 'turner:1', JSON.stringify({ ids: c?.ids, pick: s.stop?.pick }));
      }
    },
  },
  {
    name: 'the room\'s "Clear!" waits on your #2\'s sector to his group\'s end and no longer: in the reference room the tier one calls within his call and a tick of the #2\'s (the fixer\'s second pass of 0.0.12: a half-second poll called it 0.45 s after his)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'ref' }), pid = g.state.player.id, calls = {};
      runHouse(g, houseBot({ mode: 'T' }), { maxMs: 6 * 60_000, each: (game) => { for (const f of game.facts('say')) if (f.text === 'Clear!' && f.room === 'o:w4:r1') calls[f.who === pid ? 'me' : 'two'] ??= game.state.clock.ms; } });
      const gap = calls.me - calls.two;
      console.log(`      the #2's "Clear!" then yours ${fmt(gap / 1000, 2)} s after (his call ${CALL_FLOW_S} s and a tick at most: ${fmt((CALL_FLOW_S * 1000 + TICK_MS) / 1000, 2)} s)`);
      assert(Number.isFinite(gap) && gap >= 0 && gap <= CALL_FLOW_S * 1000 + TICK_MS, JSON.stringify(calls));
    },
  },
  {
    name: 'a door the bundle asks about from the doorway ("Door, east wall. Hold it or clear it?"): Hold it is offered there, and neither the line nor a moving-on round carries on past it; by T alone on seeds 1703 and 9 the tier one holds room 2\'s closet and takes no door fault (the fixer\'s second pass of 0.0.12)',
    timeoutMs: 120_000,
    fn() {
      // (the question met wherever a run meets it: T and the house bot hold a door seen from inside by its row before the
      // sector asks, so on 1703 neither is asked since the routing of 2026-11-11 moved the walk; on 9 T is, and wherever
      // asked, Hold it is on the panel)
      const asked = [], ask = (game) => { const s = game.state; if (s.stop?.carry?.why === 'door-unplanned' && s.stop.phase === 'choose') asked.push(stepsOf(s).some(r => r.id.startsWith('door:hold>'))); };
      const run = tLane('tierone', 1703, ask), run9 = tLane('tierone', 9, ask), doors = [run, run9].flatMap(R => R.N.legs.flatMap(L => L.faults.filter(f => f.kind === 'door').map(() => L.word)));
      const held = Math.min(...[run, run9].map(R => R.says.filter(x => x.text === 'Hold that door.').length));
      // (and the panel's own row there, as the house bot answers a hand-back by its row: Hold it offered in the doorway)
      const g = createGame({ scenario: 'test-shoothouse', seed: 1703, tier: 'tierone', setup: 'go' });
      runHouse(g, houseBot({ mode: 'T' }), { maxMs: 12 * 60_000, each: ask });
      const doors2 = houseNow(g.state).legs.flatMap(L => L.faults.filter(f => f.kind === 'door').map(() => L.word));
      console.log(`      by T on 1703 and 9: "Hold that door." ${held} time(s) at least; door faults ${doors.join(', ') || 'none'}; ${run.card}; ${run9.card}`);
      console.log(`      the house bot: Hold it offered at the question ${asked.join(', ') || '-'}; door faults ${doors2.join(', ') || 'none'}`);
      assert(run.done && run9.done && held >= 1 && !doors.length && asked.length && asked.every(Boolean) && !doors2.length, JSON.stringify({ held, doors, asked, doors2, card: run.card }));
    },
  },
  {
    name: 'the brief names the deck\'s gravity from where you stand, never assumed: "Full G" in the Wheel, 0.38 under the mars-datum preset (the fixer\'s second pass of 0.0.12, after the design review: nothing in the scene said it was at 1 G)',
    fn() {
      const out = {};
      for (const env of [null, 'mars-datum']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', ...(env ? { env } : {}) });
        for (let i = 0; i < 400 && !out[env ?? 'site']; i++) { g.step(1); for (const f of g.facts('say')) if (/ G\b/.test(f.text)) out[env ?? 'site'] = f.text; }
      }
      console.log(`      the site: "${out.site}"; mars-datum: "${out['mars-datum']}"`);
      assert(/Full G|One G/.test(out.site ?? '') && /0\.38 G/.test(out['mars-datum'] ?? ''), JSON.stringify(out));
    },
  },
  {
    name: 'at GO the drill\'s, the door\'s and the Watch rows hold the first page; Fire and Aim, struck with nothing bracketed, go after them (the integrator\'s list of 0.0.12)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' });
      g.step(2);
      const steps = stepsOf(g.state), first = panelOf(steps).slots.map(x => x.step.id);
      console.log(`      the first page: ${first.join(', ')}`);
      assert(first[0].startsWith('drill:room:stack>') && first.filter(id => id.startsWith('watch:')).length >= 4 && !first.includes('fire') && !first.includes('aim'), JSON.stringify(first));
    },
  },
];
