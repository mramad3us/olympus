// OLYMPUS tests: the other side (v0.0.19, the team's track T1; FM 3-06.11 §3-29: "#2 moves in the direction opposite #1"; team.js, bundle.js sideFor).
//
// At your number two's cue (his entry's, bundle.js entryGo), you past the threshold on his side (team.js sideTaken: nearer his
// point than yours across the door's frame, out of the band halfway between them), his way along your lane clear of you, he takes
// yours: R.house.two.side[door] = 1 once a room and saved, "Left!" or "Right!" as the screen shows it, the leg's L.sides and the
// run sheet's neutral "SIDES SWAPPED"; whose a stand is follows (team.js ownerOf), and so do your corner's aid and his sector.
// You standing in the doorway across both lanes keeps v0.0.18's hold and "Coming in!". The cases place you where a keys walk in
// along his path would leave you (past the threshold on his point, standing), time running, as the side bot's walk does.
// Each fails without the swap: v0.0.18's #2 walked his own lane onto you (his walk's end was his point, where you stood).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseKeysBot } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { lanePlanOf, pastThreshold } from '../src/sim/combat/room.js';
import { setOpening } from '../src/sim/places/model.js';
import { cornerAidLook, runSheetOf, THREAT_FACES } from '../src/sim/scenarios/shoothouse.js';
import { ownerOf, sideWords } from '../src/sim/combat/team.js';
import { cornerRuleOf } from '../src/sim/combat/corner.js';
import { houseOwnerBot } from './bots/team.mjs';
import { TWO_SAY, TWO_BLOCK_SAY_MS, crossingOf, crossingClear, entryGo } from '../src/sim/combat/bundle.js';
import { liveZoneAt } from '../src/sim/places/zones.js';
import { TWO_CUE_MS } from './flawless.mjs';

const SETUPS = Object.freeze([['go', 'o:w4:r1'], ['room:2', 'o:w4:r2'], ['room:3', 'o:w4:r3'], ['hall', 'hall']]);
const actor = (s, pid) => s.actors.list.find(a => a.who === pid);
const put = (s, a, [x, z]) => { a.x = x; a.z = z; a.$px = x; a.$pz = z; const p = s.people[a.who]?.post; if (p) { p.x = x; p.z = z; } };

// (a leg set up at its door: the door open, the #2 on his stack, you where `at` says (his point, or the doorway), out of stop motion)
function placed(setup, door, at, { seed = 48213, tier = 'private' } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup }), s = g.state, H = s.armoury.range.house, P = lanePlanOf(s).plans[door];
  if (P.door) { setOpening(s, P.door, 'open', { atMs: s.clock.ms }); H.doors[P.door] ??= s.clock.ms; }
  put(s, actor(s, H.two.pid), P.stack[1]);
  put(s, actor(s, s.player.id), at(P, s));
  g.step(1, { act: [stepAct('leave')] });
  return { g, s, H, P, L: [...H.rooms, H.hall].find(x => x.door === door) };
}

export default [
  {
    name: 'every room and the hall: you past the threshold on your #2\'s point, he takes yours, past his threshold within TWO_CUE_MS of his cue, his walk ending on your point, one side call in the screen\'s words, the leg\'s SIDES SWAPPED; v0.0.18 sent him onto you (FM 3-06.11 §3-29)',
    fn() {
      const rows = [];
      for (const [setup, door] of SETUPS) {
        const { g, s, H, P, L } = placed(setup, door, (P) => P.points[1]);
        const two = actor(s, H.two.pid), t0 = s.clock.ms, calls = [];
        let swapMs = null, pastMs = null, end = null;
        for (let i = 0; i < 200 && pastMs === null; i++) {
          g.step(1, s.stop ? { act: [stepAct('leave')] } : {});
          for (const f of g.facts('say')) if (f.who === H.two.pid) calls.push(f.text);
          g.clearFacts?.();
          if (swapMs === null && H.two.side?.[door]) swapMs = s.clock.ms - t0;
          const mv = H.two.doing?.beats?.find(b => b.key === 'enter');
          if (mv?.path) end = mv.path.at(-1);
          if (pastThreshold(P, two.x, two.z)) pastMs = s.clock.ms - t0;
        }
        // (the call in the screen's words: rule 1's `screen` (corner.js, the view's frame), never its marine-frame `words`; room 2,
        // entered going south, is the screen's right, so "Right!" where v0.0.19's first build said "Left!": the review of 2026-11-16)
        const r1 = cornerRuleOf(P, 1), shown = r1.screen.replace(/^the /, ''), words = `${shown.charAt(0).toUpperCase()}${shown.slice(1)}!`;
        const sheet = runSheetOf(s).rows.find(r => r.room === L.room)?.words ?? '';
        rows.push({ door, swapMs, pastMs, end, pt1: P.points[0], calls, words, marine: r1.words, ours: sideWords(P), took: L.sides?.took ?? null, swapped: sheet.includes('SIDES SWAPPED') });
      }
      for (const r of rows) console.log(`      ${r.door}: swapped at +${r.swapMs} ms, "${r.calls.filter(c => c === r.words).join('", "')}" (${r.took}; the screen's "${r.words}", the marine's own "${r.marine}"); past his threshold +${fmt(r.pastMs / 1000, 2)} s (TWO_CUE_MS ${TWO_CUE_MS / 1000} s); his walk ends ${JSON.stringify(r.end)}, your point ${JSON.stringify(r.pt1)}; SIDES SWAPPED ${r.swapped}`);
      assert(rows.every(r => r.swapMs !== null && r.swapMs <= 100 && r.pastMs !== null && r.pastMs <= TWO_CUE_MS && r.end && Math.hypot(r.end[0] - r.pt1[0], r.end[1] - r.pt1[1]) < 0.1 && r.calls.filter(c => c === r.words).length === 1 && r.ours === r.words && r.swapped), JSON.stringify(rows));
      assert(rows.find(r => r.door === 'o:w4:r2').calls.includes('Right!') && !rows.find(r => r.door === 'o:w4:r2').calls.includes('Left!'), JSON.stringify(rows.map(r => [r.door, r.calls])));
    },
  },
  {
    name: 'the swap given back: you take his side, he takes yours, and you step back to your own point before he is past his threshold: he goes back to his own side (his own side\'s call), his walk ends on his own point, past his threshold within TWO_CUE_MS of your return, no SIDES SWAPPED; v0.0.19\'s first build held him outside the doorway, silent, his walk ending on you (the review of 2026-11-16)',
    fn() {
      const rows = [];
      for (const [setup, door] of SETUPS.filter(([, d]) => d !== 'hall')) {
        const { g, s, H, P, L } = placed(setup, door, (P) => P.points[1]);
        const two = actor(s, H.two.pid), me = actor(s, s.player.id), calls = [];
        for (let i = 0; i < 200 && !H.two.side?.[door]; i++) { g.step(1, s.stop ? { act: [stepAct('leave')] } : {}); for (const f of g.facts('say')) if (f.who === H.two.pid) calls.push(f.text); g.clearFacts?.(); }
        const swapped = !!H.two.side?.[door];
        // (you back on your own point, as a step back by the keys leaves you)
        put(s, me, P.points[0]);
        const t0 = s.clock.ms;
        let pastMs = null, end = null, least = Infinity;
        for (let i = 0; i < 200 && pastMs === null; i++) {
          g.step(1, s.stop ? { act: [stepAct('leave')] } : {});
          for (const f of g.facts('say')) if (f.who === H.two.pid) calls.push(f.text);
          g.clearFacts?.();
          const mv = H.two.doing?.beats?.find(b => b.key === 'enter');
          if (mv?.path) end = mv.path.at(-1);
          least = Math.min(least, Math.hypot(two.x - me.x, two.z - me.z));
          if (pastThreshold(P, two.x, two.z)) pastMs = s.clock.ms - t0;
        }
        const r2 = cornerRuleOf(P, 2), shown = r2.screen.replace(/^the /, ''), own = `${shown.charAt(0).toUpperCase()}${shown.slice(1)}!`;
        const sheet = runSheetOf(s).rows.find(r => r.room === L.room)?.words ?? '';
        rows.push({ door, swapped, back: !H.two.side?.[door], calls, own, pastMs, end, pt2: P.points[1], least: fmt(least, 2), marked: sheet.includes('SIDES SWAPPED') });
      }
      for (const r of rows) console.log(`      ${r.door}: swapped ${r.swapped}, given back ${r.back}; his calls ${r.calls.join(' ')} (his own side "${r.own}"); past his threshold +${r.pastMs === null ? 'never' : fmt(r.pastMs / 1000, 2) + ' s'} after your return (TWO_CUE_MS ${TWO_CUE_MS / 1000} s); his walk ends ${JSON.stringify(r.end)}, his point ${JSON.stringify(r.pt2)}; least gap ${r.least} m; SIDES SWAPPED ${r.marked}`);
      assert(rows.every(r => r.swapped && r.back && r.calls.at(-1) === r.own && r.pastMs !== null && r.pastMs <= TWO_CUE_MS && r.end && Math.hypot(r.end[0] - r.pt2[0], r.end[1] - r.pt2[1]) < 0.1 && !r.marked && Number(r.least) >= 0.5), JSON.stringify(rows));
    },
  },
  {
    name: 'a swapped room played to its "Clear!": you placed on his point in room 1, the sides swapped, the honest bot reading whose man by team.js ownerOf (tests/bots/team.mjs houseOwnerBot) clears it with no fault and every threat engaged by its owner (F9 by owner); the room no slower than 30 s (the review of 2026-11-16: by the stand\'s slot the honest bot waited 90 s on its own man)',
    fn() {
      const out = [];
      for (const tier of ['private', 'tierone']) {
        const { g, s, H, L } = placed('go', 'o:w4:r1', (P) => P.points[1], { tier });
        const t0 = s.clock.ms, bot = houseOwnerBot(), me = actor(s, s.player.id), first = {};
        me.bot ??= {};
        for (let i = 0; i < 1200 && L.state !== 'clear' && L.state !== 'passed'; i++) {
          g.step(1, bot);
          // (F9's way: each threat's first round by whom, the 'shot' facts' target)
          for (const f of g.facts('shot')) if (f.fired && f.target) first[f.target] ??= f.who === s.player.id ? 'me' : f.who === H.two.pid ? 'two' : 'other';
          g.clearFacts?.();
        }
        const R = s.armoury.range, threats = R.turners.filter(T => T.room === L.room && THREAT_FACES.includes(T.face));
        const rows2 = threats.map(T => ({ stand: T.stand, slot: T.slot, owner: ownerOf(s, T), by: first[T.key] ?? null, up: T.stoppedAtMs === null }));
        const wrong = rows2.filter(x => x.by && x.by !== (x.owner === 1 ? 'me' : 'two'));
        out.push({ tier, side: H.two.side ?? null, state: L.state, s: fmt(((L.clearAtMs ?? s.clock.ms) - t0) / 1000, 1), faults: L.faults.map(f => f.kind), threats: rows2.map(x => `${x.stand}(slot ${x.slot}, owner ${x.owner}):${x.by ?? 'none'}${x.up ? ' UP' : ''}`), wrong: wrong.length, up: rows2.filter(x => x.up).length, own: me.bot.ownShots ?? 0 });
      }
      for (const o of out) console.log(`      ${o.tier}: sides ${JSON.stringify(o.side)}; room 1 ${o.state} in ${o.s} s; faults ${o.faults.join(', ') || 'none'}; first rounds ${o.threats.join(' ')} (by the wrong man ${o.wrong}, left up ${o.up}); the bot's presses on a man owned by the swap ${o.own}`);
      assert(out.every(o => o.side?.['o:w4:r1'] === 1 && o.state === 'clear' && !o.faults.length && !o.wrong && !o.up && o.threats.length && o.own >= 1 && Number(o.s) <= 30), JSON.stringify(out));
    },
  },
  {
    name: 'after the swap the room\'s stands change hands (team.js ownerOf) and your corner\'s aid marks the #2\'s corner as yours (cornerAidLook mine on slot 2), and his eyes go to his new side\'s men; the rest of the lane is untouched',
    fn() {
      const { g, s, H, P, L } = placed('room:3', 'o:w4:r3', (P) => P.points[1]);
      for (let i = 0; i < 10; i++) g.step(1, {});
      const R = s.armoury.range, room = R.turners.filter(T => T.room === L.room).map(T => ({ stand: T.stand, slot: T.slot, own: ownerOf(s, T) }));
      const other = R.turners.filter(T => T.room !== L.room).every(T => ownerOf(s, T) === T.slot);
      const aid = cornerAidLook(s, H, s.clock.ms), mine = aid.marks.filter(m => m.room === L.room && m.mine).map(m => m.slot);
      console.log(`      room 3 swapped ${JSON.stringify(H.two.side)}: ${room.map(x => `${x.stand} slot ${x.slot} owner ${x.own}`).join(', ')}; other rooms as their slots ${other}; the aid's "mine" on slot ${mine.join(', ') || 'none (faded)'}`);
      assert(H.two.side?.['o:w4:r3'] === 1 && room.every(x => x.own === 3 - x.slot) && other, JSON.stringify({ side: H.two.side, room }));
      assert(!mine.length || mine.every(k => k === 2), JSON.stringify(aid.marks));
    },
  },
  {
    name: 'you standing in the doorway on his lane (a no-stop zone): no swap, he holds outside it and says "Coming in!" after TWO_BLOCK_SAY_MS, as v0.0.18 (the guard of bundle.js sideFor; tests/house-block.test.mjs\'s case)',
    fn() {
      const rows = [];
      for (const [setup, door] of SETUPS.filter(([, d]) => d !== 'hall')) {
        // (on his lane in the doorway: the last point of his crossing's stretch inside the no-stop zone and past the threshold)
        const { g, s, H, P } = placed(setup, door, (P, s0) => {
          const inZone = (x, z) => !!liveZoneAt(s0, s0.places.live.area, x, z), way = crossingOf(P.paths[2], P.paths[2][0], inZone);
          let at = way[0]; for (let i = 1; i < way.length; i++) for (let k = 0; k <= 20; k++) { const p = [way[i - 1][0] + (way[i][0] - way[i - 1][0]) * k / 20, way[i - 1][1] + (way[i][1] - way[i - 1][1]) * k / 20]; if (inZone(p[0], p[1]) && pastThreshold(P, p[0], p[1])) at = p; }
          return at;
        });
        const t0 = s.clock.ms, calls = [];
        const L = [...H.rooms, H.hall].find(x => x.door === door), me = actor(s, s.player.id), blocked = !crossingClear(s, P.paths[2], P.stack[1]);
        let cue = null;
        for (let i = 0; i < 100; i++) {
          g.step(1, s.stop ? { act: [stepAct('leave')] } : {});
          if (cue === null && entryGo(s, P, me, s.clock.ms, L)) cue = s.clock.ms - t0;
          for (const f of g.facts('say')) if (f.who === H.two.pid) calls.push({ text: f.text, ms: s.clock.ms - t0 });
          g.clearFacts?.();
        }
        const coming = calls.find(c => c.text === TWO_SAY.coming);
        rows.push({ door, side: H.two.side ?? null, blocked, cue, coming: coming?.ms ?? null, calls: calls.map(c => c.text) });
      }
      for (const r of rows) console.log(`      ${r.door}: side ${JSON.stringify(r.side)}; his way ${r.blocked ? 'blocked' : 'clear'}; his cue at +${r.cue} ms, "Coming in!" at +${r.coming} ms (TWO_BLOCK_SAY_MS ${TWO_BLOCK_SAY_MS} after the cue); his calls ${r.calls.join(' ')}`);
      // (no swap anywhere; where you stand across his way he holds and calls TWO_BLOCK_SAY_MS after his cue, as v0.0.18; room 1's
      // doorway carries you through to your point at rest (places/move.js throughOf), so his way clears before the call there)
      assert(rows.every(r => !r.side && (!r.blocked || r.door === 'o:w4:r1' || (r.cue !== null && r.coming !== null && r.coming - r.cue >= TWO_BLOCK_SAY_MS - 50 && r.coming - r.cue <= TWO_BLOCK_SAY_MS + 100))) && rows.filter(r => r.blocked).length >= 2, JSON.stringify(rows));
    },
  },
  {
    name: 'a save made in a swapped room carries on byte for byte: the side, the leg\'s SIDES SWAPPED and the bot\'s memory saved, 400 ticks by the keys bot on both after',
    fn() {
      const { g, s } = placed('room:2', 'o:w4:r2', (P) => P.points[1]);
      for (let i = 0; i < 6; i++) g.step(1, {});
      const json = g.save(), h = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' });
      h.load(json);
      const b1 = houseKeysBot(), b2 = houseKeysBot();
      for (let i = 0; i < 400; i++) { g.step(1, b1); h.step(1, b2); }
      console.log(`      saved at side ${JSON.stringify(s.armoury.range.house.two.side)} (${json.length} bytes); after 400 ticks: ${g.digest()} and ${h.digest()}`);
      assert(json.includes('"side":{"o:w4:r2":1}') && g.digest() === h.digest(), 'the save carried on byte for byte');
    },
  },
  {
    name: 'the side bot (tests/bots/team.mjs: the keys walk in along the #2\'s path at every door) reaches the card at the private on 48213 with the lane clear, never passed by the stall (the review of v0.0.19: it walked into his point and passed on \'passed\' with nothing swapped), and every room it swapped is marked SIDES SWAPPED; the keys bot swaps nothing (F35\'s second half, quick on one seed; the swap itself is F35\'s)',
    heavy: true,
    timeoutMs: 120_000,
    async fn() {
      const { sideBot } = await import('./bots/team.mjs');
      const out = [];
      for (const [name, bot] of [['side', sideBot()], ['keys', houseKeysBot()]]) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' }), r = runHouse(g, bot, { maxMs: 12 * 60_000 }), H = g.state.armoury.range.house;
        const marked = runSheetOf(g.state).rows.filter(x => x.words.includes('SIDES SWAPPED')).map(x => x.room);
        out.push({ name, done: r.done, why: H.end?.why ?? null, s: fmt(r.ms / 1000, 1), side: Object.keys(H.two.side ?? {}), marked, sides: H.rooms.filter(L => L.sides).length });
      }
      for (const o of out) console.log(`      ${o.name}: to the card ${o.done} (${o.why}) in ${o.s} s; sides swapped at ${o.side.join(', ') || 'none'} (rooms with a swap noted ${o.sides}); marked ${o.marked.join(', ') || 'none'}`);
      assert(out.every(o => o.done && o.why === 'clear') && out.find(o => o.name === 'keys').side.length === 0 && out.every(o => o.side.length === o.marked.length), JSON.stringify(out));
    },
  },
];
