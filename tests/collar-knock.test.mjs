// OLYMPUS tests: the knock (F163's B half): you are down exactly while your body is; no act of yours begins while down, the fight's time runs on, nothing moves or fires from the deck while you lie after it; "On your feet." and the row "Get up" after it (v0.0.27's build sheet §6 B, item 8, FT§5.2, FT§6.4; src/sim/combat/contact.js, stepper.js HALTS, instinct/cqb.js cqb-up).
//
// The house's live lane ("Stack and clear, live", the sergeant by T on 48213) stands in for the boarding's (tests/boarding-world.mjs
// cannot be stepped before D's plans: .run/v027/lead.md, contradiction 16) with the ledger made 'real' (would.js realOf) and the
// boarding's record written. You are struck by would.js's real strike from the role-player's R-7: on a pause (time standing still, the
// pair offered), in a pair (its first round fired), and in a bundle (T's first press at GO). Each case fails without its fix: with no
// refusal the pair's row starts from the deck; with no knock tick the pause holds time on a man who cannot choose and the bundle runs
// on; with no cut the pair's second round is fired; with no cqb-up the line after the knock names no row. The review of B, A and C
// (2026-11-19) adds two: after the knock, your stance still down, "Carry on" walked you 1.51 m along the deck lying (contact.js
// lyingTick stands you as a row of yours begins, feetOf keeps the feet still while you lie: each red without itself), and with the rifle
// on its sling the urgent wound line had no act (the slung panel offers no Tourniquet: base.js tourniquetLine and cqb-up bring the
// rifle up first, each red without itself; the line's words the build sheet's, red with the injury's name).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseBot, houseHonestBot } from './bots/house.mjs';
import { boardingRecord } from './boarding-world.mjs';
import { newLedger, wouldHave, strikeOf } from '../src/sim/combat/would.js';
import { knockedDown, refusesAct, feetOf, lyingNow } from '../src/sim/combat/contact.js';
import { downOf } from '../src/sim/body/wounds.js';
import { tourniquetOf, applyTourniquet } from '../src/sim/body/aid.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { HALTS } from '../src/sim/combat/stepper.js';
import { instinctNow, firedNow } from '../src/sim/skills/instinct.js';
import { isHeld, SEC_MS } from '../src/core/clock.js';

// (the live lane at GO, made real: the boarding's ledger and record, the T bot ready)
function realLane() {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', opfor: 'live' }), s = g.state, H = s.armoury.range.house;
  H.live.would = newLedger('real'); H.boarding = boardingRecord('pirates');
  return { g, s, H, bot: houseBot({ mode: 'T' }), me: () => s.actors.list.find(a => a.id === s.player.actor) };
}
// (a strike on you from the first role-player's rifle in an arm that knocks you down for 2 s or more and leaves you able to stand when the
// knock ends: the first shot id on the strike's own stream that does, each try on your body as it was and a fresh ledger)
function knockYou(g, s) {
  const pid = s.player.id, T = s.armoury.range.turners.find(t => t.live), gun = s.people[T.live.who].kit.worn.sling, was = JSON.stringify(s.people[pid].body ?? null);
  for (let k = 0; k < 300; k++) {
    s.armoury.range.house.live.would = newLedger('real');
    if (was === 'null') delete s.people[pid].body; else s.people[pid].body = JSON.parse(was);
    const e = wouldHave(s, strikeOf(s, { id: `kn${k}`, gun, atMs: s.clock.ms, fired: true, load: 'ball', part: 'arms', zone: 'A', roll: { margin: 3 }, flight: { rangeM: 5 } }, { on: pid, by: T.key }), g.bus);
    const b = s.people[pid].body;
    if (e.why !== 'stopped' && e.knockS >= 2 && !downOf(b, b.knock.untilMs + 50).down) return { e, k };
  }
  throw new Error('no knocking strike in 300 tries');
}
const refused = (g) => g.sim.stats.refused ?? 0;
// (the review of v0.0.27's B, A and C: a strike in an arm or a leg on a pause of the live lane made real, the knock 2 s or more, the
// body able to stand after it; the K-th such strike on its own stream)
function knockAt(g, s, part, K) {
  const pid = s.player.id, T = s.armoury.range.turners.find(t => t.live), gun = s.people[T.live.who].kit.worn.sling, was = JSON.stringify(s.people[pid].body ?? null);
  for (let k = K * 7; k < K * 7 + 300; k++) {
    s.armoury.range.house.live.would = newLedger('real');
    if (was === 'null') delete s.people[pid].body; else s.people[pid].body = JSON.parse(was);
    const e = wouldHave(s, strikeOf(s, { id: `dw${k}`, gun, atMs: s.clock.ms, fired: true, load: 'ball', part, zone: 'A', roll: { margin: 3 }, flight: { rangeM: 5 } }, { on: pid, by: T.key }), g.bus);
    if (e.why !== 'stopped' && e.knockS >= 2 && !s.people[pid].body.dead) return e;
  }
  throw new Error('no knocking strike in 300 tries');
}
// (the honest T bot to the first choosing pause with the pair offered)
function toPause(L, bot) {
  const { g, s } = L;
  let n = 0;
  while (n < 400 && !(s.stop?.mode === 'stop' && s.stop.phase === 'choose' && stepsOf(s).some(r => /^shot:pair/.test(r.id) && !r.off))) { g.step(1, bot); n++; }
  return n;
}
/** The review's lying steps (contact.js LYING_STEPS): what may begin while your stance is down after the knock. */
const LYING_OK = /^(contact:(up|tourniquet)|stance:|posture:|up$|wait$)/;
// (the review's probe as a lane: struck on a pause, the knock waited out with the honest T bot pressing, then every tick that ended with
// you lying read for a step begun (not the hands'), a move and a round of yours; until you stand or 80 s)
function lyingLane(part, K) {
  const L = realLane(), { g, s } = L, bot = houseHonestBot(), pid = s.player.id;
  toPause(L, bot);
  const e = knockAt(g, s, part, K);
  let n = 0;
  while (n < 2000 && knockedDown(s)) { g.step(1, bot); n++; }
  const seen = { ticks: 0, begun: new Set(), movedM: 0, fired: 0 }, mine = () => (s.armoury.range.shots ?? []).filter(x => (x.who ?? pid) === pid).length;
  for (let t = 0; t < 1600 && L.me().stance === 'down'; t++) {
    const x = L.me().x, z = L.me().z, f0 = mine(), step0 = s.stop?.doing?.step ?? null;
    if (step0 && !LYING_OK.test(step0)) seen.begun.add(step0);
    g.step(1, bot);
    seen.ticks++;
    // (a tick that ended with you still lying moved nothing and fired nothing; one that stood you is the step's own from there)
    if (L.me().stance === 'down') { seen.movedM += Math.hypot(L.me().x - x, L.me().z - z); seen.fired += mine() - f0; const st = s.stop?.doing?.step ?? null; if (st && !LYING_OK.test(st)) seen.begun.add(st); }
  }
  const r = { part: e.part, knockS: e.knockS, ticks: seen.ticks, begun: [...seen.begun], movedM: seen.movedM, fired: seen.fired, stood: L.me().stance !== 'down', by: s.stop?.doing?.step ?? null };
  console.log(`      ${r.part}, knock ${r.knockS} s: lying after it ${r.ticks} ticks, steps begun lying ${r.begun.join(', ') || 'none'}, moved ${fmt(r.movedM, 3)} m, rounds ${r.fired}; stood ${r.stood} by ${r.by ?? 'nothing running'}`);
  return r;
}
/** The ticks a body struck on the move takes to brake to a stop (places/move.js: 0.24 m at the private's brake at 1 G, well inside 1 s). */
const BRAKE_TICKS = 20;

export default [
  {
    name: 'struck on a pause: down exactly while your body is, time running on (the pause\'s hold let go), every act refused (the pair, T) and the feet still; after it the hold back on a whole second, "On your feet." with its row, T stands you',
    fn() {
      const L = realLane(), { g, s } = L;
      let n = 0;
      while (n < 400 && !(s.stop?.mode === 'stop' && s.stop.phase === 'choose' && stepsOf(s).some(r => /^shot:pair/.test(r.id) && !r.off))) { g.step(1, L.bot); n++; }
      const pair = stepsOf(s).find(r => /^shot:pair/.test(r.id) && !r.off);
      assert(pair && isHeld(s, 'stop'), `a pause with the pair offered (${n} ticks)`);
      const { e, k } = knockYou(g, s), t0 = s.clock.ms, untilMs = s.people[s.player.id].body.knock.untilMs, r0 = refused(g);
      const seen = { ticks: 0, downTicks: 0, mismatch: 0, started: 0, moved: 0, held: 0, offered: 0 };
      let presses = 0;
      while (seen.ticks < 2000) {
        const down = knockedDown(s), stance = L.me().stance === 'down';
        if (down !== downOf(s.people[s.player.id].body, s.clock.ms).down) seen.mismatch++;
        if (down && !stance && seen.ticks > 0) seen.mismatch++;
        if (!down) break;
        seen.downTicks++;
        // (a press every fourth tick, each kind in turn: T, the pair's row, X)
        const act = seen.ticks % 4 !== 0 ? [] : seen.ticks % 12 === 0 ? ['instinct'] : seen.ticks % 12 === 4 ? [`stop:${pair.id}`] : ['shoot'];
        const before = s.stop?.doing?.step ?? null, x = L.me().x, z = L.me().z;
        if (seen.ticks > 0 && isHeld(s)) seen.held++;
        if (seen.ticks % 10 === 0 && firedNow(s).some(x => x.id === 'cqb-up' || (x.act && !refusesAct(s, x.act)))) seen.offered++;
        g.step(1, { act, mx: 1 });
        presses += act.length;
        if ((s.stop?.doing?.step ?? null) !== before) seen.started++;
        // (after the body's brake, BRAKE_TICKS: a body walking when struck slides to a stop on its legs' brake, no step of its own)
        if (seen.ticks >= BRAKE_TICKS && Math.hypot(L.me().x - x, L.me().z - z) > 1e-9 && knockedDown(s)) seen.moved++;
        seen.ticks++;
      }
      const tDown = s.clock.ms;
      let m = 0;
      while (!isHeld(s, 'stop') && m < 40) { g.step(1); m++; }
      // (the arm bleeds hard: the wound's tourniquet first, then up; the line, or the chip beside it where a line of the room's stands over it
      // (instinct.js settle keeps a shown line of the same tone))
      const I0 = instinctNow(s), tq = [I0.line, I0.chip].find(x => x?.id === 'wound') ?? null, rows = stepsOf(s).filter(r => r.lead).map(r => r.id);
      // (the tourniquet's own end (aid.js applyTourniquet, collar-aid's), so the next line is the stand's)
      applyTourniquet(s.people[s.player.id].body, tourniquetOf(s.people[s.player.id].body, s.clock.ms), s.clock.ms);
      // (cqb-up fires now, its act the row (instinct.js firedNow); with a man of the room up its line keeps the line and the wound the chip
      // (settle keeps a shown line of the same tone), so T is pressed as the page sends a line it shows: its id and act)
      const I = instinctNow(s), up = firedNow(s).find(x => x.id === 'cqb-up') ?? null, line = I.line;
      console.log(`      the strike kn${k}: ${e.part}, knock ${e.knockS} s (to ${fmt((untilMs - t0) / 1000, 2)} s); down ${seen.downTicks} ticks, the clock ${fmt((tDown - t0) / 1000, 2)} s on (held on ${seen.held}); presses ${presses}, refused ${refused(g) - r0}, begun ${seen.started}, moved ${seen.moved}, T's acts not refused ${seen.offered}, down off the body ${seen.mismatch}`);
      console.log(`      after it: the hold back in ${m} ticks at ${s.clock.ms % SEC_MS} ms past the second; first the wound's ${tq === I0.line ? 'line' : tq ? 'chip' : 'nothing'}, act ${tq?.act}; the tourniquet on, the line ${line?.id} "${line?.text}", the chip ${I.chip?.id ?? 'none'}; cqb-up fires "${up ? up.ctx && up.rule ? 'On your feet.' : '' : ''}", its act ${up?.act}, shown ${up?.id === line?.id ? 'as the line' : up?.id === I.chip?.id ? 'as the chip' : 'behind the room\'s line'}; leading rows ${rows.join(', ')}; HALTS has 'down' ${HALTS.includes('down')}`);
      assert(seen.mismatch === 0 && seen.started === 0 && seen.moved === 0 && seen.held === 0 && seen.offered === 0 && refused(g) - r0 === presses && presses > 10, JSON.stringify({ ...seen, presses, refused: refused(g) - r0 }));
      assert(tDown >= untilMs && tDown - untilMs <= 100, JSON.stringify({ tDown, untilMs }));
      assert(isHeld(s, 'stop') && s.clock.ms % SEC_MS === 0 && !s.stop.knock, 'the hold back on a whole second');
      assert(tq?.act === 'stop:contact:tourniquet' && rows[0] === 'contact:tourniquet' && rows.includes('contact:up'), JSON.stringify({ I0, rows }));
      assert(up?.act === 'stop:contact:up' && L.me().stance === 'down', JSON.stringify({ line, chip: I.chip }));
      g.step(1, { act: [{ act: 'instinct', args: { id: 'cqb-up', act: 'stop:contact:up' } }] });
      let u = 0;
      while (s.stop?.doing && u < 200) { g.step(1); u++; }
      console.log(`      T: "Get up" in ${fmt(u * 0.05, 2)} s, stance ${L.me().stance ?? 'up'}; refusesAct ${refusesAct(s, 'instinct')}, feet ${JSON.stringify(feetOf(s, { mx: 1 }))}`);
      assert(!L.me().stance && !refusesAct(s, 'instinct') && feetOf(s, { mx: 1 }).mx === 1, 'up');
    },
  },
  {
    name: 'after the knock, your stance still down: nothing of yours moves or fires from the deck (the honest T bot\'s row stands you first), a move key\'s first tick stands you and the next walks (the review of v0.0.27: "Carry on" walked you 1.51 m along the deck lying, 8 lanes of 8)',
    fn() {
      const r = lyingLane('arms', 1);
      assert(r.stood && !r.begun.length && r.movedM === 0 && r.fired === 0, JSON.stringify(r));
      // (a move key: its first tick stands you where you lie, the next walks)
      const L = realLane(), { g, s } = L;
      toPause(L, houseHonestBot());
      knockAt(g, s, 'arms', 1);
      let n = 0;
      while (n < 2000 && knockedDown(s)) { g.step(1); n++; }
      const x0 = L.me().x, z0 = L.me().z, lying = lyingNow(s), f0 = feetOf(s, { mx: 1 });
      g.step(1, { mx: 1 });
      const d1 = Math.hypot(L.me().x - x0, L.me().z - z0), st1 = L.me().stance ?? 'up';
      for (let k = 0; k < 10; k++) g.step(1, { mx: 1 });
      const d2 = Math.hypot(L.me().x - x0, L.me().z - z0);
      console.log(`      a move key after the knock: lying ${lying}, the feet ${JSON.stringify(f0)}; its first tick stance ${st1}, moved ${fmt(d1, 3)} m; ten ticks on ${fmt(d2, 2)} m`);
      assert(lying && f0.mx === 0 && st1 === 'up' && d1 === 0 && d2 > 0.05, JSON.stringify({ lying, f0, st1, d1, d2 }));
    },
  },
  {
    name: 'after the knock, your stance still down, on the review\'s eight strikes (arms and legs, knocks of 3 to 15 s): no step but the hands\' begins lying, 0 m moved, 0 rounds, each lane stood',
    heavy: true,
    fn() {
      const out = [0, 1, 2, 3, 5, 8, 13, 21].map((K, i) => lyingLane(i % 2 ? 'arms' : 'legs', K));
      const bad = out.filter(r => !r.stood || r.begun.length || r.movedM !== 0 || r.fired !== 0);
      console.log(`      ${out.length} lanes: ${bad.length} with a step begun, a move or a round lying`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'the rifle on its sling (a fumble\'s "Gun down!") after a knock with an arm bleeding hard: the urgent wound line always has an act, and the honest T bot gets the tourniquet on and gets up, no dead end (the review of v0.0.27: 41 pauses with no act, 120 s stuck)',
    fn() {
      const L = realLane(), { g, s } = L, bot = houseHonestBot(), pid = s.player.id;
      // (the strike at GO: an arm bleeding hard after the knock, under 6 %/min so the bleed leaves time to act)
      const T = s.armoury.range.turners.find(t => t.live), gun = s.people[T.live.who].kit.worn.sling, was = JSON.stringify(s.people[pid].body ?? null);
      let e = null;
      for (let k = 0; k < 400; k++) {
        s.armoury.range.house.live.would = newLedger('real');
        if (was === 'null') delete s.people[pid].body; else s.people[pid].body = JSON.parse(was);
        e = wouldHave(s, strikeOf(s, { id: `sl${k}`, gun, atMs: s.clock.ms, fired: true, load: 'ball', part: 'arms', zone: 'A', roll: { margin: 3 }, flight: { rangeM: 5 } }, { on: pid, by: T.key }), g.bus);
        const b = s.people[pid].body, tq = e.why !== 'stopped' && b ? tourniquetOf(b, (b.knock?.untilMs ?? 0) + 100) : null;
        if (tq && (tq.rate ?? 0) < 6) break;
      }
      // (the body read afresh each tick: the domain replaces the record as it steps it)
      const body = () => s.people[pid].body;
      let n = 0;
      while (n < 1000 && downOf(body(), s.clock.ms).down) { g.step(1); n++; }
      s.people[pid].kit.carry.posture = 'slungFront';
      const t0 = s.clock.ms, actless = { pauses: 0, none: 0 };
      let tqAt = null, upAt = null;
      for (let t = 0; t < 2400 && !(tqAt !== null && upAt !== null) && !body().dead; t++) {
        // (a pause where T is pressed: time held at it, the knock over)
        if (s.stop?.mode === 'stop' && s.stop.phase === 'choose' && isHeld(s, 'stop') && !knockedDown(s)) {
          const I = instinctNow(s);
          if (I.line?.id === 'wound' || I.line?.id === 'cqb-up') { actless.pauses++; if (!I.line.act) actless.none++; }
          if (I.line?.id === 'wound') actless.said = I.line.text;
        }
        g.step(1, bot);
        if (tqAt === null && body().injuries.some(i => i.cared === 'tourniquet')) tqAt = s.clock.ms - t0;
        if (upAt === null && L.me().stance !== 'down') upAt = s.clock.ms - t0;
      }
      const dead = L.me().bot?.dead ?? {};
      console.log(`      ${e.part}, ${JSON.stringify(body().injuries.filter(i => i.gunshot).map(i => [i.name, i.rate]))}: the tourniquet on at ${tqAt === null ? 'never' : fmt(tqAt / 1000, 1) + ' s'}, up at ${upAt === null ? 'never' : fmt(upAt / 1000, 1) + ' s'}; the wound's or the stand's line at ${actless.pauses} pauses, with no act ${actless.none}; the bot's dead ends ${JSON.stringify(dead)}; the rifle now ${s.people[pid].kit.carry.posture}`);
      // (the line's words the build sheet's (§9 item 5): the limb, not the injury's name; the review found "from the gunshot wound in the left arm")
      console.log(`      the wound's line: "${actless.said}"`);
      assert(tqAt !== null && upAt !== null && tqAt <= 40_000 && actless.none === 0 && !Object.keys(dead).length, JSON.stringify({ tqAt, upAt, actless, dead }));
      assert(actless.said === 'Bleeding hard from the left arm: a tourniquet, now.', actless.said);
      // (and with no limb to tie off (the same strike, its tourniquet put on by hand once the knock is over: aid.js applyTourniquet, as
      // the first case does), "On your feet." alone: its act the rifle up, then "Get up")
      const M = realLane(), bm = houseHonestBot();
      M.s.armoury.range.house.live.would = newLedger('real');
      if (was === 'null') delete M.s.people[pid].body; else M.s.people[pid].body = JSON.parse(was);
      const em = wouldHave(M.s, strikeOf(M.s, { id: 'sl-up', gun, atMs: M.s.clock.ms, fired: true, load: 'ball', part: 'arms', zone: 'A', roll: { margin: 3 }, flight: { rangeM: 5 } }, { on: pid, by: T.key }), M.g.bus);
      n = 0;
      while (n < 1000 && downOf(M.s.people[pid].body, M.s.clock.ms).down) { M.g.step(1); n++; }
      const bm0 = M.s.people[pid].body, tqm = tourniquetOf(bm0, M.s.clock.ms);
      if (tqm) applyTourniquet(bm0, tqm, M.s.clock.ms);
      M.s.people[pid].kit.carry.posture = 'slungFront';
      const t1 = M.s.clock.ms, upLines = { pauses: 0, none: 0, acts: new Set() };
      let up2 = null;
      for (let t = 0; t < 2400 && up2 === null; t++) {
        if (M.s.stop?.mode === 'stop' && M.s.stop.phase === 'choose' && isHeld(M.s, 'stop')) {
          const I = instinctNow(M.s);
          if (I.line?.id === 'cqb-up') { upLines.pauses++; if (!I.line.act) upLines.none++; else upLines.acts.add(I.line.act); }
        }
        M.g.step(1, bm);
        if (M.me().stance !== 'down') up2 = M.s.clock.ms - t1;
      }
      const dead2 = M.me().bot?.dead ?? {};
      console.log(`      no limb to tie off (${em.part}, knock ${em.knockS} s), slung: up at ${up2 === null ? 'never' : fmt(up2 / 1000, 1) + ' s'}; "On your feet." at ${upLines.pauses} pauses, its acts ${[...upLines.acts].join(', ')}, with no act ${upLines.none}; dead ends ${JSON.stringify(dead2)}`);
      assert(em.knockS >= 2 && up2 !== null && upLines.none === 0 && !Object.keys(dead2).length, JSON.stringify({ up2, upLines: { ...upLines, acts: [...upLines.acts] }, dead2 }));
    },
  },
  {
    name: 'the rifle on its sling after a knock with an arm bleeding hard: the slung panel offers "Tourniquet" and "Get up" first, as every panel does (shooting.js stepsOfRaw\'s slung branch reads contact.js realRows), so T\'s wound line names the Tourniquet itself (the review of v0.0.27: no contact rows at all there)',
    fn() {
      const L = realLane(), { g, s } = L, pid = s.player.id;
      const T = s.armoury.range.turners.find(t => t.live), gun = s.people[T.live.who].kit.worn.sling, was = JSON.stringify(s.people[pid].body ?? null);
      for (let k = 0; k < 400; k++) {
        s.armoury.range.house.live.would = newLedger('real');
        if (was === 'null') delete s.people[pid].body; else s.people[pid].body = JSON.parse(was);
        const e = wouldHave(s, strikeOf(s, { id: `sl${k}`, gun, atMs: s.clock.ms, fired: true, load: 'ball', part: 'arms', zone: 'A', roll: { margin: 3 }, flight: { rangeM: 5 } }, { on: pid, by: T.key }), g.bus);
        const b = s.people[pid].body, tq = e.why !== 'stopped' && b ? tourniquetOf(b, (b.knock?.untilMs ?? 0) + 100) : null;
        if (tq && (tq.rate ?? 0) < 6) break;
      }
      let n = 0;
      while (n < 1000 && downOf(s.people[pid].body, s.clock.ms).down) { g.step(1); n++; }
      s.people[pid].kit.carry.posture = 'slungFront';
      let m = 0;
      while (m < 60 && !(s.stop?.mode === 'stop' && s.stop.phase === 'choose' && isHeld(s, 'stop'))) { g.step(1); m++; }
      const rows = stepsOf(s).map(r => r.id), I = instinctNow(s);
      console.log(`      slung at the pause: the first rows ${rows.slice(0, 4).join(', ')}; the line ${I.line?.id} "${I.line?.text}", its act ${I.line?.act}`);
      assert(rows[0] === 'contact:tourniquet' && rows[1] === 'contact:up' && I.line?.id === 'wound' && I.line.act === 'stop:contact:tourniquet', JSON.stringify({ rows: rows.slice(0, 6), line: I.line?.id, act: I.line?.act }));
    },
  },
  {
    name: 'struck in a pair: its second round never fired from the deck (the step cut at its sub-step\'s end); struck in a bundle: handed back \'down\', nothing new begun while down',
    heavy: true,
    fn() {
      const L = realLane(), { g, s } = L, pid = s.player.id;
      let n = 0;
      while (n < 400 && !(s.stop?.mode === 'stop' && s.stop.phase === 'choose' && stepsOf(s).some(r => /^shot:pair/.test(r.id) && !r.off))) { g.step(1, L.bot); n++; }
      const pair = stepsOf(s).find(r => /^shot:pair/.test(r.id) && !r.off), shots0 = (s.armoury.range.shots ?? []).filter(x => (x.who ?? pid) === pid).length;
      g.step(1, { act: [`stop:${pair.id}`] });
      let m = 0;
      while (m < 40 && (s.armoury.range.shots ?? []).filter(x => (x.who ?? pid) === pid).length === shots0) { g.step(1); m++; }
      const { e } = knockYou(g, s), d = s.stop.doing;
      let k = 0;
      while (s.stop?.doing && k < 400) { g.step(1); k++; }
      const fired = (s.armoury.range.shots ?? []).filter(x => (x.who ?? pid) === pid).length - shots0;
      console.log(`      the pair ${pair.id}: struck ${fmt(m * 0.05, 2)} s in (${e.part}, knock ${e.knockS} s); it ended after ${d?.subs?.length} of ${d?.list?.length} sub-steps, rounds fired ${fired}`);
      assert(fired === 1 && d.subs.length < d.list.length, JSON.stringify({ fired, subs: d?.subs?.length, list: d?.list }));
      // (a bundle: T's first press at GO, struck as it runs)
      const B = realLane(), gb = B.g, sb = B.s;
      let t = 0;
      while (t < 200 && !sb.stop?.doing?.beats) { gb.step(1, B.bot); t++; }
      const bd = sb.stop.doing, step = bd?.step;
      knockYou(gb, sb);
      gb.step(1);
      const why = bd?.halt?.why ?? sb.stop?.flow?.halt?.why ?? null;
      let begun = 0, w = 0;
      while (knockedDown(sb) && w < 2000) { const before = sb.stop?.doing; gb.step(1, B.bot); if (sb.stop?.doing && sb.stop.doing !== before && sb.stop.doing !== bd) begun++; w++; }
      console.log(`      the bundle ${step}: handed back '${why}' (HALTS' own), ${begun} steps begun in the ${w} ticks down with the T bot pressing`);
      assert(why === 'down' && begun === 0, JSON.stringify({ why, begun }));
    },
  },
];
