// OLYMPUS tests: the fixer of v0.0.27's two reviews (the play review and the code review of the integrated "Away the boarding party"), each case failing without its fix.
//
// The code review: a defender's miss meets a face (holes.js missFace from men.js incoming, finding 1); a real hit is never drawn as
// paint (look.js withLive on would.js realOf, finding 2); the override's lockout lights the panel's lamp red (finding 3); the crew's line
// keyed on what is seen of a man (finding 5); a &holdouts= off the boarding dropped with its toast (finding 8). The play review: "Flash
// it" at a hatch for the sheets below rung 2 (finding 1); the entry on the bang aboard judged on the boots' walk (finding 2); the fall
// back (finding 3: the call hands the drill back, the leg no longer judged, no drill row, T names the lock, the lock's hatch is the lock,
// the call and the send never put in your mouth or Four's to himself, no tower aboard); the card's THEIR CHOICES and the leader's words
// for men who gave up (finding 5); no range verdict, practised line, paper zone or "NO HITS" aboard (finding 6); the override's time in
// minutes and seconds (finding 10). The lanes are the reviewers' own: the sergeant by T on 48213 against pirates, the corporal by T on 13
// (the fall back at two down), the private by the keys on 48213.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { collarLane, collarBotOf } from './bots/collar.mjs';
import { stepAct } from './bots/lib.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { rangeLook, boardLook } from '../src/sim/arms/look.js';
import { holesOf } from '../src/sim/combat/holes.js';
import { bundleRows } from '../src/sim/combat/bundle.js';
import { areaOf } from '../src/sim/places/model.js';
import { runSheetOf, houseNow, overrideRoll, BANG_LATE_SHIP_MS, OVERRIDE_LOCKOUT_MS } from '../src/sim/scenarios/shoothouse.js';
import { BANG_LATE_MS } from '../src/sim/combat/burst.js';
import { valueOf } from '../src/sim/skills/templates.js';
import { CQB_RULES } from '../src/sim/skills/instinct/cqb.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { COLLAR_LEADER, HOUSE_CHIEF } from '../src/data/courses.js';
import { holdoutsOnly, HOLDOUTS_ONLY } from '../src/core/debug.js';
import { laneModel } from '../src/ui/hud/timer.js';
import { houseAspects } from '../src/ui/cards/house.js';

const legsOf = (s) => s.armoury.range.house.rooms;
// (a lane to its card with its bubbles kept (runHouse forgets the facts after each tick): { ...collarLane's, said: [say facts] })
function lane(opts, each = null) {
  const said = [];
  const r = collarLane(createGame, { ...opts, each: (g) => { for (const d of g.facts('say')) if (!d.call) said.push({ ...d, atMs: d.atMs ?? g.state.clock.ms }); each?.(g); } });
  return { ...r, said };
}

export default [
  {
    name: 'code review 1: a defender\'s round that strikes nobody aboard meets a face (holes.js missFace from men.js incoming): THEIRS counts every miss of theirs, the ball\'s hole in the hull and the leader\'s "Hull\'s holed." moment, the private by the keys on 105 against pirates (fails without the call: theirs 0, the hull never holed)',
    fn() {
      const r = lane({ tier: 'private', seed: 105, holdouts: 'pirates', bot: 'keys' }), s = r.game.state, B = s.armoury.range.house.boarding;
      const shots = s.armoury.range.house.live.shots ?? [], missed = shots.filter(x => x.fired && !x.hit).length;
      const C = holesOf(s), theirs = (B.holes ?? []).filter(h => h.side === 'theirs'), hull = r.said.filter(d => COLLAR_LEADER.hull.includes(d.text));
      console.log(`      ${r.end} at ${r.laneS} s: their rounds fired ${shots.filter(x => x.fired).length}, missed ${missed}; THEIRS ${JSON.stringify(C.theirs)}; their records ${theirs.map(h => `${h.face} ${h.kind}`).join(', ')}; "Hull's holed." said ${hull.length}`);
      assert(missed > 0 && C.theirs.rounds === missed && theirs.length === missed, JSON.stringify({ theirs: C.theirs, missed }));
      // (the line's moment written (collarTick's hullTick); its bubble goes by the leader's voice, nobody's where every marine but you is down)
      assert(C.theirs.hull > 0 && Number.isFinite(B.hullSaidAtMs) && hull.length <= 1, JSON.stringify({ hull: C.theirs.hull, at: B.hullSaidAtMs, said: hull.length }));
    },
  },
  {
    name: 'code review 2: on the real ledger no paint puff is drawn on a body (look.js withLive): a strike on a defender or a marine shows none at any tick of the sergeant\'s lane, where every strike was drawn pink or blue before (fails without the guard)',
    heavy: true,
    fn() {
      let strikes = 0, puffs = 0;
      collarLane(createGame, { tier: 'sgt', seed: 1037, holdouts: 'pirates', bot: 'T', each: (g) => {
        const s = g.state, ms = s.clock.ms, L = s.armoury.range.house.live;
        if ((L?.struck ?? []).some(x => ms - x.atMs >= 0 && ms - x.atMs < 400) || s.armoury.range.turners.some(T => (T.hits ?? []).some(h => ms - h.atMs >= 0 && ms - h.atMs < 400))) strikes++;
        if (rangeLook(s, ms)?.house?.paint?.length) puffs++;
      } });
      console.log(`      ticks with a strike under 400 ms old ${strikes}, ticks with a paint puff drawn ${puffs}`);
      assert(strikes > 0 && puffs === 0, JSON.stringify({ strikes, puffs }));
    },
  },
  {
    name: 'code review 3: Four\'s override missed by 5 or more locks the panel out for its minute, and the lock\'s panel lamp is red for it (look.js boardLook reads collar.lockedOutUntilMs), amber after it (fails without the field: amber throughout; the minute passes inside the override\'s splash, so it shows only where a tick is drawn in it)',
    fn() {
      let seed = null;
      for (let k = 1; k < 200 && seed === null; k++) { const g0 = createGame({ scenario: 'test-collar', seed: k, tier: 'sgt', holdouts: 'pirates' }); if (overrideRoll(k, valueOf(g0.state, g0.state.armoury.range.house.twoPid, 'tech')).tries > 1) seed = k; }
      assert(seed !== null, 'no seed of 200 locks the panel out');
      const g = createGame({ scenario: 'test-collar', seed, tier: 'sgt', holdouts: 'pirates' }), s = g.state, B = s.armoury.range.house.boarding;
      for (let i = 0; i < 2000 && !B.collar; i++) g.step(1, {});
      const K = B.collar, at = (ms) => boardLook(s, ms)?.panel?.lit ?? null;
      const lit = [at(K.atMs + 50), at(K.atMs + OVERRIDE_LOCKOUT_MS - 50), at(K.atMs + OVERRIDE_LOCKOUT_MS + 50)];
      console.log(`      seed ${seed}: the roll ${K.total} against ${K.dc}, tries ${K.tries}, ${K.ms / 1000} s; the lamp 50 ms after his miss ${lit[0]}, 50 ms before the lockout's end ${lit[1]}, 50 ms after ${lit[2]}`);
      assert(K.tries > 1 && lit[0] === 'red' && lit[1] === 'red' && lit[2] === 'amber', JSON.stringify({ K, lit }));
    },
  },
  {
    name: 'code review 5: "He\'s crew. Challenge him." keys on what you see (no gun in his hands), never the fill\'s hidden `unarmed`: at every tick it names a crewman (the private by the keys on 48213), that man handed a rifle is no longer named crew (fails with the flag read)',
    heavy: true,
    fn() {
      const rule = CQB_RULES.find(r => r.id === 'cqb-rp-crew'), gun = (s) => Object.keys(s.items).find(id => s.items[id].type === 'gun' && s.items[id].model === 'r7');
      let named = 0, still = 0;
      collarLane(createGame, { tier: 'private', seed: 48213, holdouts: 'pirates', bot: 'keys', each: (g) => {
        const s = g.state, me = s.actors.list.find(a => a.who === s.player.id), w = rule.when(s, me, s.clock.ms);
        if (!w) return;
        named++;
        const who = s.armoury.range.turners.find(T => T.key === w.key)?.live?.who, k = s.people[who].kit, hands = k.hands;
        k.hands = [gun(s)];
        const again = rule.when(s, me, s.clock.ms);
        k.hands = hands;
        if (again?.key === w.key) still++;
      } });
      console.log(`      ticks the line named a crewman ${named}; still named with a rifle in his hands ${still}`);
      assert(named > 0 && still === 0, JSON.stringify({ named, still }));
    },
  },
  {
    name: 'code review 8: &holdouts= on a scene that boards nobody is dropped with its toast (debug.js holdoutsOnly), kept on the boarding (fails without it: dropped with no word)',
    fn() {
      const off = holdoutsOnly('pirates', 'pirates', false), on = holdoutsOnly('pirates', 'pirates', true), none = holdoutsOnly(null, null, false);
      console.log(`      off the boarding ${JSON.stringify(off)}; aboard ${JSON.stringify(on)}; not asked ${JSON.stringify(none)}`);
      assert(off.holdouts === null && off.dropped[0] === HOLDOUTS_ONLY && on.holdouts === 'pirates' && !on.dropped.length && !none.dropped.length, JSON.stringify({ off, on, none }));
    },
  },
  {
    name: 'play review 1: the recruit and the private, three G-11s carried, are offered "Flash it" at a compartment\'s hatch (the house\'s kit row at a hatch), and its bang goes off inside the compartment (fails without the row: no row of theirs throws one)',
    fn() {
      const out = [];
      for (const tier of ['recruit', 'private']) {
        const g = createGame({ scenario: 'test-collar', seed: 48213, tier, holdouts: 'pirates', setup: 'cabin2' }), s = g.state;
        const row = stepsOf(s).find(x => x.id.startsWith('drill:door:flash') && !x.off);
        if (!row) { out.push({ tier, row: null }); continue; }
        g.step(1, { act: [stepAct(row.id)] });
        let b = null;
        for (let i = 0; i < 400 && !b; i++) { g.step(1, {}); b = (s.armoury.range.house.bursts ?? []).find(x => x.thrown) ?? null; }
        const A = areaOf(s.places.live.area), room = b ? A.rooms.find(q => b.x > q.rect[0] && b.x < q.rect[2] && b.z > q.rect[1] && b.z < q.rect[3])?.id ?? null : null;
        out.push({ tier, row: row.label, burst: b ? { x: b.x, z: b.z, room, atFeet: !!b.atFeet } : null });
      }
      for (const o of out) console.log(`      ${o.tier}: ${o.row ?? 'no row'}${o.burst ? `, the bang at (${o.burst.x}, ${o.burst.z}) in ${o.burst.room}` : ''}`);
      assert(out.every(o => o.row === 'Flash it' && o.burst?.room === 'mu.d2.cabin-2' && !o.burst.atFeet), JSON.stringify(out));
    },
  },
  {
    name: 'play review 2: aboard, the entry on the bang is judged on the boots\' walk (BANG_LATE_SHIP_MS 4 s): the sergeant\'s and the tier one\'s T entries, 2.96 to 3.46 s from the bang, are on the bang, not "You gave them back the bang" (fails with the house\'s 2 s)',
    heavy: true,
    fn() {
      const rows = [], bad = [];
      for (const [tier, seed, hold] of [['sgt', 48213, 'pirates'], ['tierone', 1037, 'smugglers']]) {
        const r = collarLane(createGame, { tier, seed, holdouts: hold, bot: 'T' }), L = legsOf(r.game.state);
        const bangs = L.map(x => x.bangMs).filter(Number.isFinite), faults = L.flatMap(x => x.faults.filter(f => f.kind === 'bang'));
        rows.push(`${tier} ${seed} ${hold}: ${r.end}, bang to entry ${bangs.map(ms => `${(ms / 1000).toFixed(2)} s`).join(', ')}; bang faults ${faults.length}`);
        if (!bangs.length || bangs.some(ms => ms > BANG_LATE_SHIP_MS) || faults.length || !bangs.some(ms => ms > BANG_LATE_MS)) bad.push({ tier, bangs, faults: faults.length });
      }
      for (const x of rows) console.log(`      ${x}`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'play review 3: the fall back called with your bundle under way (the corporal by T on 13 against pirates, two down): Four calls it, not you; the drill handed back and no drill row offered; no doorway, stall or bang fault and no "In." after the call; T names the lock; you back at the lock\'s hatch long before the 60 s wait; the send by Four his own words; no tower aboard; and the one thing the fall back\'s, never "Clean." (play review 6) (fails without each: the bundle went on into cabin 1, Four held you in its hatch 41 s, the wait ended it)',
    heavy: true,
    fn() {
      const lines = [], bad = [];
      let callAt = null, rowsAfter = 0, after = [], inside = 0;
      const r = lane({ tier: 'cpl', seed: 13, holdouts: 'pirates', bot: 'T' }, (g) => {
        const s = g.state, B = s.armoury.range.house.boarding, l = instinctNow(s).line;
        if (B.fallback && callAt === null) callAt = s.clock.ms;
        if (callAt !== null && !s.armoury.range.end) {
          if (bundleRows(s).length) rowsAfter++;
          if (l) after.push(`${l.id}|${l.text ?? ''}`);
          // (into a compartment after the call: the drill under way at it went on (cabin 1's rect, hauler.js's rooms))
          const me = s.actors.list.find(a => a.who === s.player.id), A = areaOf(s.places.live.area), room = A.rooms.find(q => me.x > q.rect[0] && me.x < q.rect[2] && me.z > q.rect[1] && me.z < q.rect[3])?.id ?? null;
          if (room && /cabin|bunks/.test(room)) inside++;
        }
        if (l) lines.push(l.text ?? '');
      });
      const s = r.game.state, B = s.armoury.range.house.boarding, F = B.fallback, sd = r.said;
      const faultsAfter = legsOf(s).flatMap(L => L.faults.filter(f => f.atMs >= callAt)).map(f => f.kind);
      const sendFour = sd.filter(d => d.who === s.armoury.range.house.twoPid && /: (cabin|the bunk)/.test(d.text)).map(d => d.text);
      console.log(`      ${r.end}: the call at ${((callAt - s.armoury.range.house.goAtMs) / 1000).toFixed(1)} s by ${F?.by === s.player.id ? 'you' : F?.by}, back ${((F.inAtMs - F.atMs) / 1000).toFixed(2)} s after it (you among ${F.inLock.length} at the lock); drill rows offered after it on ${rowsAfter} ticks; faults after it [${faultsAfter.join(', ')}]; T's lines after it: ${[...new Set(after.map(x => x.split('|')[0]))].join(', ') || 'none'}; Four's sends: ${sendFour.join(' / ') || 'none'}`);
      if (r.end !== 'fellBack' || !F || F.inAtMs - F.atMs >= 20_000 || !F.inLock.includes(s.player.id)) bad.push('not back at the lock by the walk');
      if (F?.by === s.player.id) bad.push('the call in your mouth');
      if (rowsAfter) bad.push(`drill rows after the call on ${rowsAfter} ticks`);
      if (inside) bad.push(`in a compartment after the call on ${inside} ticks`);
      // (the sergeant on 13 is at a Wait for his #2 at the call: ended by it, so "Back to the lock" is offered at once, not 11.5 s on)
      const r2 = lane({ tier: 'sgt', seed: 13, holdouts: 'pirates', bot: 'T' }), F2 = r2.game.state.armoury.range.house.boarding.fallback;
      console.log(`      the sergeant on 13: ${r2.end}, back ${((F2.inAtMs - F2.atMs) / 1000).toFixed(2)} s after the call`);
      if (r2.end !== 'fellBack' || F2.inAtMs - F2.atMs > 8000) bad.push(`the sergeant back ${(F2.inAtMs - F2.atMs) / 1000} s after the call`);
      if (faultsAfter.some(k => ['funnel', 'bang', 'time', 'hatch'].includes(k))) bad.push(`faults after the call: ${faultsAfter}`);
      if (after.some(x => x.startsWith('cqb-funnel') || x.startsWith('cqb-walk'))) bad.push('the funnel or the walk to your point after the call');
      if (!after.some(x => x.startsWith('cqb-back'))) bad.push('T never named the lock');
      if (lines.some(t => /tower/i.test(t)) || sd.some(d => /tower/i.test(d.text))) bad.push('a tower aboard');
      if (sendFour.some(t => /Four/.test(t))) bad.push('Four sends himself');
      if (sd.some(d => COLLAR_LEADER.stall.includes(d.text) && d.atMs >= callAt)) bad.push('the stall line over the walk back');
      // (play review 6: a fall back with nothing faulted is the fall back's lesson, never "Clean.")
      const one = runSheetOf(s).one;
      console.log(`      the one thing ${one.key}: "${one.text}"`);
      if (one.key !== 'fellBack' || !COLLAR_LEADER.one.fellBack.includes(one.text)) bad.push(`the one thing ${one.key}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'play review 5: the card\'s THEIR CHOICES names no ruling as a man down (an unhurt man who gave up is never "DOWN", a man down once), and at a compartment\'s "Clear!" the leader leaves men who all gave up where they are, never "for the corpsman" (the private by the keys on 48213; fails with the ruling read as DOWN, or the one words for both)',
    heavy: true,
    fn() {
      const bad = [], heard = [];
      // (each of the leader's ruling lines against the last rulings made before it (opfor.js ruleOut's records: the man's state when ruled))
      const r = lane({ tier: 'private', seed: 48213, holdouts: 'pirates', bot: 'keys' }, (g) => {
        const s = g.state, ruled = s.armoury.range.house.live?.ruled ?? [];
        for (const d of g.facts('say')) {
          const kind = COLLAR_LEADER.out.includes(d.text) ? 'out' : COLLAR_LEADER.outHands.includes(d.text) ? 'outHands' : null;
          if (!kind) continue;
          const t = Math.max(...ruled.filter(x => x.why === 'clear').map(x => x.atMs)), last = ruled.filter(x => x.why === 'clear' && x.atMs === t), down = last.some(x => x.was === 'down');
          heard.push(`${kind} over ${last.map(x => `${x.key} ${x.was}`).join(', ')}`);
          if ((kind === 'out') !== down) bad.push(`${kind} said over ${last.map(x => x.was).join(', ')}`);
        }
      });
      const s = r.game.state, B = s.armoury.range.house.boarding, row = (runSheetOf(s).boarding?.rows ?? []).find(x => x.startsWith('THEIR CHOICES')) ?? '';
      for (const T of s.armoury.range.turners.filter(t => t.live)) {
        const downs = (B.track?.[T.stand] ?? []).filter(e => e.st === 'down').length, said = (row.match(new RegExp(`\\b${T.stand.toUpperCase()} DOWN AT`, 'g')) ?? []).length;
        if (said !== downs) bad.push(`${T.stand}: ${said} DOWN said for ${downs} down`);
      }
      console.log(`      ${row.slice(0, 260)}`);
      console.log(`      the leader at the rulings: ${heard.join(' · ') || 'nothing'}`);
      assert(heard.length && !bad.length, bad.join('; ') || 'no ruling words heard');
    },
  },
  {
    name: 'play review 6 and 10: no range verdict, practised count, paper zone, berm or "NO HITS" aboard: the one thing\'s words the boarding\'s (none of HOUSE_CHIEF.one\'s clean), no practised line, the log\'s rounds in a body\'s words, the lane timer and the shots aspect with no zones line; and the override\'s 150 s said "2 min 30 s" (the sergeant by T on 48213; fails without each)',
    heavy: true,
    fn() {
      let zone = 0, berm = 0;
      const r = collarLane(createGame, { tier: 'sgt', seed: 48213, holdouts: 'pirates', bot: 'T', each: (g) => {
        for (const d of g.facts('log')) { const t = JSON.stringify(d.entry ?? d); if (/ zone/.test(t)) zone++; if (/berm/.test(t)) berm++; }
        g.clearFacts?.();
      } });
      const s = r.game.state, rs = runSheetOf(s), N = houseNow(s), timer = laneModel(N, s.clock.ms), shots = houseAspects(N).find(([k]) => k === 'shots')?.[1] ?? '';
      const log = (s.log ?? []).map(e => e.text ?? '').filter(t => /override/.test(t));
      console.log(`      ${r.end}; the one thing ${rs.one.key}: "${rs.one.text}"; practised ${JSON.stringify(rs.practised)}; zone words ${zone}, berm ${berm}; the timer's paper ${timer?.paper}, zones ${timer?.zones.length}; shots "${shots}"; the override's log "${log.join(' / ')}"`);
      assert(!HOUSE_CHIEF.one.clean.includes(rs.one.text) && rs.practised === null, JSON.stringify({ one: rs.one, practised: rs.practised }));
      assert(zone === 0 && berm === 0, JSON.stringify({ zone, berm }));
      assert(timer?.paper === false && !/no hits/.test(shots), JSON.stringify({ paper: timer?.paper, shots }));
      assert(s.armoury.range.house.boarding.collar.ms === 150_000 && log.some(t => t.includes('2 min 30 s')), JSON.stringify({ ms: s.armoury.range.house.boarding.collar.ms, log }));
    },
  },
  {
    name: 'play review 3: the fall back called and you standing still after it (the sergeant on 13, by T to the call): Four goes back to his place in the lock and stays silent there, never his stack-up again and its "Ready." every few seconds; no stall line, no leg passed (fails without his slot stopped, or with the leg still judged: "Move. The deck is not cleared standing still." at 54 s)',
    fn() {
      const g = createGame({ scenario: 'test-collar', seed: 13, tier: 'sgt', holdouts: 'pirates' }), s = g.state, bot = collarBotOf('T', 'sgt', 13), B = s.armoury.range.house.boarding, said = [];
      for (let i = 0; i < 6000 && !s.armoury.range.end; i++) {
        const me = s.actors.list.find(a => a.who === s.player.id);
        const inp = !B.fallback ? bot(s, me, (me.bot ??= {})) : s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.stop.reflex && stepsOf(s).some(x => x.id === 'leave' && !x.off) ? { act: [stepAct('leave')] } : {};
        g.step(1, inp);
        if (B.fallback) for (const d of g.facts('say')) if (!d.call) said.push(d);
        g.clearFacts();
      }
      const F = B.fallback, W = s.armoury.range.house.two, ready = said.filter(d => d.text === 'Ready.').length, stall = said.filter(d => COLLAR_LEADER.stall.includes(d.text) || COLLAR_LEADER.time.includes(d.text)).length;
      const passed = legsOf(s).filter(L => L.state === 'passed' && !L.held).length;
      console.log(`      ${B.end?.why} ${(F.inAtMs - F.atMs) / 1000} s after the call (its wait); Four back in the lock ${Number.isFinite(W.back?.in) ? `at ${((W.back.in - F.atMs) / 1000).toFixed(2)} s` : 'never'}; "Ready." ${ready}; stall or time words ${stall}; legs passed ${passed}`);
      assert(B.end?.why === 'fellBack' && Number.isFinite(W.back?.in) && !ready && !stall && !passed, JSON.stringify({ end: B.end, back: W.back, ready, stall, passed }));
    },
  },
];
