// OLYMPUS tests: the line of fire held both ways, and your limit of advance (the build sheet v0.0.20 item 3; drill.md item 1; COMBAT §25.19.3.5; TC 3-22.9 §1-10: "never cross in front of another member's muzzle").
//
// carry.js lineMasked: a body within MASK_R_M of a round's line from the muzzle's tip to the man's aim point, the capsule floor
// to head. Your #2's rounds (house-two.js maskHold) and yours (specials.js runRound's lineHold) are held while the other's body
// is on the line, "Line!" said once a hold, and go MASK_RESUME_MS after it clears; held MASK_FAULT_MS by you, his is the
// instructor's 'masked' fault; held MASK_HOLD_MAX_MS, he steps MASK_STEP_M off his line and fires from there. You standing in his
// sector's wedge before he has swept the room LIMIT_WARN_MS brings the DI's cqb-limit. drill.md's construction (mask2.mjs): you
// held at the midpoint of his line to 1b from his sighting on, room 1: before this he fired his pair through you on every seed.
// Quick: the tier one by T and the private by the keys on 48213 from setup go, one lane each; the twenty seeds are the heavy gauge
// file's (house-flawless-bodies, F47).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, houseKeysBot } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { MASK_R_M, MASK_RESUME_MS, MASK_FAULT_MS, MASK_HOLD_MAX_MS, MASK_STEP_M, LIMIT_WARN_MS, lineMasked } from '../src/sim/arms/carry.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { cornerRuleOf } from '../src/sim/combat/corner.js';
import { setOpening } from '../src/sim/places/model.js';
import { stepsOf } from '../src/sim/arms/shooting.js';

const BOTS = Object.freeze({ tierone: houseHonestBot, private: houseKeysBot });
const put = (a, x, z) => { a.x = x; a.z = z; a.$px = x; a.$pz = z; delete a.v; };
// (room 1 from GO, his take-in on 1b begun: you put at the midpoint of his line to 1b and held there holdMs past his take-in (kept on
// his line as he moves for followMs, then where you stand), then 1 m square off it; his rounds at 1b, "Line!", the hold on the leg, his place)
function hold(tier, holdMs, { followMs = Infinity } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go' }), s = g.state, H = s.armoury.range.house;
  const T = s.armoury.range.turners.find(t => t.stand === '1b'), bot = BOTS[tier]();
  const me = s.actors.list.find(a => a.who === s.player.id), two = s.actors.list.find(a => a.who === H.twoPid);
  let since = null, rel = null, at = null, from = null;
  const shots = [], lines = [];
  for (let i = 0; i < 800 && !shots.length; i++) {
    g.step(1, bot);
    if (since === null && H.two.contact?.key === T.key) since = s.clock.ms;
    if (since !== null && rel === null && s.clock.ms - since >= holdMs + (H.two.contact?.ms ?? 0)) rel = s.clock.ms;
    const held = since !== null && rel === null;
    if (held && (at === null || s.clock.ms - since < followMs)) { at = [two.x + 0.5 * (T.x - two.x), two.z + 0.5 * (T.z - two.z)]; from = [two.x, two.z]; }
    if (held) put(me, ...at);
    else if (rel === s.clock.ms) { const dx = T.x - two.x, dz = T.z - two.z, l = Math.hypot(dx, dz); put(me, me.x - dz / l, me.z + dx / l); }
    for (const f of g.facts('say')) if (f.who === H.twoPid && f.text === 'Line!') lines.push(s.clock.ms);
    for (const f of g.facts('shot')) if (f.who === H.twoPid && f.target === T.key) shots.push({ held, sinceRel: rel !== null ? s.clock.ms - rel : null, fired: !!f.fired, from: [+two.x.toFixed(2), +two.z.toFixed(2)] });
    g.clearFacts?.();
  }
  const L = H.rooms[0];
  return { tier, T: T.face, shots, lines: lines.length, masked: L.masked ?? [], fault: L.faults.filter(f => f.kind === 'masked').length, stepM: from && shots[0] ? +Math.hypot(shots[0].from[0] - from[0], shots[0].from[1] - from[1]).toFixed(2) : null };
}

export default [
  {
    name: 'carry.js lineMasked: a body within MASK_R_M of the segment from the muzzle\'s tip to the aim point, between its ends, floor to head by its stance; the nearest to the shooter first; nothing behind the muzzle or past the target, and a man kneeling below a level line is clear',
    fn() {
      const from = { x: 0, y: 1.4, z: 0 }, to = { x: 10, y: 1.35, z: 0 };
      const cases = [
        ['on the line', [{ x: 5, z: 0.2, id: 'a' }], 'a'], ['0.31 m off', [{ x: 5, z: 0.31, id: 'b' }], null], ['behind the muzzle', [{ x: -0.5, z: 0, id: 'c' }], null],
        ['past the target', [{ x: 10.5, z: 0, id: 'd' }], null], ['two: the nearer', [{ x: 7, z: 0, id: 'e' }, { x: 3, z: 0.1, id: 'f' }], 'f'], ['kneeling 0.6 m below the line', [{ x: 5, z: 0, stance: 'prone', id: 'g' }], null],
      ];
      const got = cases.map(([why, bodies, want]) => ({ why, want, got: lineMasked(from, to, bodies)?.id ?? null }));
      console.log(`      MASK_R_M ${MASK_R_M} m: ${got.map(c => `${c.why} → ${c.got ?? 'clear'}`).join('; ')}`);
      assert(got.every(c => c.got === c.want), JSON.stringify(got));
    },
  },
  {
    name: 'your #2 holds his pair on 1b while you stand on his line, says "Line!" once, and fires within MASK_RESUME_MS (and its tick) of your stepping off; held MASK_FAULT_MS or more it is the instructor\'s \'masked\' fault, once; the tier one by T and the private by the keys on 48213 (before: both rounds through you, scored A on 1b)',
    fn() {
      const out = ['tierone', 'private'].map(t => hold(t, 600));
      for (const o of out) console.log(`      ${o.tier} (1b ${o.T}): his rounds while you stood on his line ${o.shots.filter(x => x.held).length}; his first ${o.shots[0] ? `${o.shots[0].sinceRel} ms after you stepped off` : 'NEVER'}; "Line!" ×${o.lines}; held ${o.masked.map(m => `${m.ms} ms`).join(', ')}; 'masked' faults ${o.fault}`);
      for (const o of out) assert(o.shots.length && !o.shots.some(x => x.held) && o.shots[0].sinceRel <= MASK_RESUME_MS + 50 && o.lines === 1 && o.masked.length === 1 && o.masked[0].ms >= MASK_FAULT_MS && o.fault === 1, JSON.stringify(o));
    },
  },
  {
    name: 'held MASK_HOLD_MAX_MS by you standing still on his line, your #2 steps MASK_STEP_M square off it, and again while you still mask it, and fires from there while you still stand where you stood, never through you (the tier one by T, 48213)',
    fn() {
      const o = hold('tierone', 3 * MASK_HOLD_MAX_MS + 1500, { followMs: MASK_HOLD_MAX_MS - 300 });
      console.log(`      held ${o.masked.map(m => `${m.ms} ms`).join(', ')}; his first round ${o.shots[0] ? `${o.shots[0].held ? 'while you still stood there' : 'after you left'}, ${o.stepM} m from where he stood when you stopped (MASK_STEP_M ${MASK_STEP_M})` : 'NEVER'}; through you ${o.shots.filter(x => x.held && !x.fired).length}`);
      assert(o.shots.length && o.shots[0].held && o.stepM >= MASK_STEP_M - 0.05 && o.masked[0]?.ms >= MASK_HOLD_MAX_MS && o.fault === 1, JSON.stringify(o));
    },
  },
  {
    name: 'your own pair on 1a waits while your #2 stands on its line: "Line!" by you, the row\'s round MASK_RESUME_MS after he is off it, none through him; held MASK_HOLD_MAX_MS, the row ends with no round (the tier one by T, 48213; before: through him)',
    fn() {
      const out = [];
      for (const leave of [true, false]) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), s = g.state, H = s.armoury.range.house;
        const T = s.armoury.range.turners.find(t => t.stand === '1a'), bot = houseHonestBot();
        const me = s.actors.list.find(a => a.who === s.player.id), two = s.actors.list.find(a => a.who === H.twoPid);
        let rowAt = null, rel = null, shot = null, lines = 0, thru = 0;
        for (let i = 0; i < 800 && !shot; i++) {
          g.step(1, bot);
          const d = s.stop?.doing;
          if (rowAt === null && d && !d.beats && /^shot:/.test(d.step ?? '') && d.target === T.key) rowAt = s.clock.ms;
          const held = rowAt !== null && rel === null;
          if (held) { put(two, me.x + 0.4 * (T.x - me.x), me.z + 0.4 * (T.z - me.z)); if (leave && s.clock.ms - rowAt >= 500) rel = s.clock.ms; }
          if (rel === s.clock.ms) put(two, two.x + (T.z - me.z) * 0.3, two.z - (T.x - me.x) * 0.3);
          for (const f of g.facts('say')) if (f.who === s.player.id && f.text === 'Line!') lines++;
          for (const f of g.facts('shot')) if (f.who === s.player.id && f.target === T.key) { if (held && f.fired) thru++; shot = { sinceRel: rel !== null ? s.clock.ms - rel : null, fired: !!f.fired }; }
          if (!leave && rowAt !== null && s.clock.ms - rowAt > MASK_HOLD_MAX_MS + 1000) break;
          g.clearFacts?.();
        }
        out.push({ leave, rowAt: rowAt !== null, shot, lines, thru, masked: H.rooms[0].masked ?? [] });
      }
      const [go, stay] = out;
      console.log(`      he steps off after 0.5 s: your round ${go.shot ? `${go.shot.sinceRel} ms after` : 'NEVER'}, "Line!" ×${go.lines}, held ${go.masked.map(m => `${m.ms} ms by ${m.by}`).join(', ')}; he stays: a round ${stay.shot ? 'FIRED' : 'never'}, through him ${stay.thru}`);
      assert(go.rowAt && go.shot && go.shot.sinceRel <= MASK_RESUME_MS + 50 && go.lines === 1 && !go.thru, JSON.stringify(go));
      assert(stay.rowAt && !stay.shot && !stay.thru, JSON.stringify(stay));
    },
  },
  {
    name: 'your limit of advance: standing more than 0.6 m from your #2 inside his sector\'s wedge, he on his point and the room not yet swept, brings the DI\'s cqb-limit ("You\'re in his sector. Back to your point.") within LIMIT_WARN_MS and the instinct\'s settle (a second), T G out of the mode and your point in it (room 2, the private)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'room:2' }), s = g.state, H = s.armoury.range.house, P = lanePlanOf(s).plans['o:w4:r2'];
      for (const T of s.armoury.range.turners) T.trigger = { kind: 'never', on: null, gapMs: 0 };
      setOpening(s, 'o:w4:r2', 'open', { atMs: s.clock.ms - 5000 });
      const me = s.actors.list.find(a => a.who === s.player.id), two = s.actors.list.find(a => a.who === H.twoPid), rule = cornerRuleOf(P, 2);
      put(two, ...P.points[1]);
      const yaw = (rule.sector.fromRad + rule.sector.toRad) / 2, at = [P.points[1][0] + Math.cos(yaw) * 1.6, P.points[1][1] + Math.sin(yaw) * 1.6];
      put(me, ...at);
      H.rooms[1].state = 'entered'; H.rooms[1].enteredAtMs = s.clock.ms;
      g.step(1, { act: [stepAct('leave')] });
      let lineAt = null, line = null;
      const t0 = s.clock.ms;
      for (let i = 0; i < 40 && !lineAt; i++) { put(two, ...P.points[1]); put(me, ...at); g.step(1, {}); const l = instinctNow(s).line; if (l?.id === 'cqb-limit') { lineAt = s.clock.ms - t0; line = l; } }
      g.step(1, { act: [{ act: 'instinct', args: { id: line?.id, act: line?.act } }] });
      const l2 = instinctNow(s).line;
      console.log(`      you ${at.map(v => v.toFixed(2)).join(', ')}, 1.6 m into his sector from his point: H.limit from ${H.limit ? H.limit.fromMs - t0 : '-'} ms, the line cqb-limit after ${lineAt} ms ("${line?.text}", T ${line?.act}); then in the mode: ${l2?.id} T ${l2?.act}`);
      assert(lineAt !== null && H.limit && lineAt <= LIMIT_WARN_MS + 1050 && line.act === 'stop:enter' && l2?.id === 'cqb-limit' && l2.act === 'stop:move:point', JSON.stringify({ lineAt, line, l2 }));
    },
  },
];
