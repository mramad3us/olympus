// OLYMPUS tests: breach-choice, "Bang, then go"'s gauge F141, the table chooses (its build sheet item 5, §0 item 5, §6 A, §8; COMBAT §7.10, §7.11; defenders.md DF§4): every change of a role-player's state is the procedure's, the shock's, the give's, the fall's or choiceOf's at his felt band and nerve grade, never a card; a calm or under-fire man never covers or freezes; a friend seen falling is +10 on the other man's pool and −0.1 on his resolve, exactly once a fall, and nothing on the live lane's set; the scene's flag read from R.house.bangGo alone.
//
// The scripted room is tests/opfor-world.mjs rpScript (room 1, the two men forced 'fight', R.house.bangGo set by hand: A tests against
// no other role's code). DF§4's table is reproduced from the code: each case enumerated over the d20's twenty faces with the code's own
// constants (supp.js NERVE_DC0, NERVE_PER, NERVE_K, the sheet's Warfighting, checks.js grade, opfor.js CHOICE_TABLE) and held within
// one point of the lens's printed shares, then sampled through choiceOf itself (its streams) within six. Each case prints its numbers.
// Fails without its fix: friendDown (no friendHit, no resolve), choiceOf's resolve (the same grades with and without it), and the
// seam on R.house.bangGo (a seam reading R.house.breach, the house's breached doors, would put room 1's stands on a cut door's lane).
import { assert, fmt } from './helpers.mjs';
import { rpScript, liveGame } from './opfor-world.mjs';
import { createGame } from './game.mjs';
import { choiceOf, opforSheet, rpStandsOf, spotOf, friendDown, opforBled, CHOICE_TABLE, CHOICE_DWELL_MS, RESOLVE_FRIEND, RP_Q } from '../src/sim/scenarios/opfor.js';
import { NERVE_DC0, NERVE_PER, NERVE_K, FRIEND_HIT_PTS, FRIEND_HIT_M, bandN, feltOf } from '../src/sim/combat/supp.js';
import { grade } from '../src/sim/skills/checks.js';
import { burst } from '../src/sim/combat/burst.js';
import { RP_STANDS, OPFOR_SPOTS, BREACH_STANDS, BREACH_SPOTS } from '../src/data/places/house-opfor.js';
import { TICK_MS } from '../src/core/clock.js';

// (the lens's table, DF§4: [case, felt, resolve, a marine's weapon near, [fight, cover, freeze, surrender] %], security's columns)
const DF_TABLE = Object.freeze([
  ['one bang, entry 1.5 s, friend paired and down, H 13', 56, 0.9, true, [60, 25, 15, 0]],
  ['the same, H 16', 53, 0.9, true, [60, 25, 15, 0]],
  ['the same, H 19', 50, 0.9, true, [65, 25, 10, 0]],
  ['one bang, slow entry 4.0 s, H 13', 52, 0.9, true, [65, 25, 10, 0]],
  ['the same, H 19', 46, 0.9, true, [70, 25, 5, 0]],
  ['one bang, a pair at him missed, H 13', 51, 1, true, [70, 25, 5, 0]],
  ['the same, H 19', 45, 1, true, [75, 25, 0, 0]],
  ['two bangs, H 13', 77, 1, true, [0, 45, 45, 10]],
  ['two bangs, H 19', 71, 1, true, [0, 50, 45, 5]],
  ['friend down, then a pair at him missed, H 13', 61, 0.9, true, [55, 25, 20, 0]],
  ['the same, H 19', 55, 0.9, true, [60, 25, 15, 0]],
]);
const SHARES = ['fight', 'cover', 'freeze', 'give'];

// (the d20 enumerated with the code's constants: the nerve check's DC and modifier, checks.js grade, CHOICE_TABLE, surrender only near)
function enumerate(felt, resolve, near) {
  const sheet = opforSheet(RP_Q), nerve = Math.round(sheet.os * NERVE_K[sheet.cls]), dc = NERVE_DC0 + Math.round(felt / NERVE_PER), mod = resolve === null ? 0 : Math.round(10 * (resolve - 1));
  const band = bandN(felt), n = { fight: 0, cover: 0, freeze: 0, give: 0 };
  for (let r = 1; r <= 20; r++) {
    if (band < 2) { n.fight++; continue; }
    const g = grade(r + nerve + mod - dc, r === 20 ? 20 : r === 1 ? 1 : 0);
    let what = CHOICE_TABLE[Math.min(3, band)][g];
    if (what === 'give' && !near) what = 'freeze';
    n[what]++;
  }
  return SHARES.map(k => n[k] * 5);
}

export default [
  {
    name: 'breach-choice: DF§4\'s table reproduced from the code, each case within one point of the lens\'s enumeration and sampled through choiceOf within six; calm or under fire (0 to 44) always fights with no roll; resolve 0.9 moves the grade one point (fails with choiceOf ignoring resolve)',
    fn() {
      const g = rpScript({ seed: 48213 }), s = g.s, pid = g.man('1b').live.who, off = [];
      for (const [what, felt, resolve, near, want] of DF_TABLE) {
        const got = enumerate(felt, resolve, near), n = { fight: 0, cover: 0, freeze: 0, give: 0 }, N = 400;
        for (let i = 0; i < N; i++) n[choiceOf(s, pid, { felt, atMs: 1000 + i * TICK_MS, key: 'rp:test', near: () => near, resolve }).what]++;
        const sampled = SHARES.map(k => Math.round(n[k] / N * 100)), d1 = Math.max(...got.map((v, i) => Math.abs(v - want[i]))), d2 = Math.max(...got.map((v, i) => Math.abs(v - sampled[i])));
        console.log(`      ${what} (felt ${felt}, resolve ${resolve}): the code ${got.join('/')}, the lens ${want.join('/')}, choiceOf ${sampled.join('/')} over ${N} (fight/cover/freeze/surrender %)`);
        if (d1 > 1 || d2 > 6) off.push({ what, got, want, sampled });
      }
      assert(!off.length, JSON.stringify(off));
      // (calm or under fire: fight, no roll, at every felt under 45)
      let rolled = 0, other = 0;
      for (let felt = 0; felt < 45; felt++) for (let i = 0; i < 5; i++) { const c = choiceOf(s, pid, { felt, atMs: 7 + i, key: 'rp:test' }); if (c.grade !== null) rolled++; if (c.what !== 'fight') other++; }
      // (resolve: the same streams with resolve 0.9 and without; the grades move where the margin crosses a step)
      let moved = 0;
      for (let i = 0; i < 200; i++) { const a = choiceOf(s, pid, { felt: 60, atMs: 5000 + i * TICK_MS, key: 'rp:r' }), b = choiceOf(s, pid, { felt: 60, atMs: 5000 + i * TICK_MS, key: 'rp:r', resolve: 0.9 }); if (a.grade !== b.grade) moved++; }
      console.log(`      felt 0 to 44 (225 asks): ${rolled} rolled, ${other} not fight; resolve 0.9 against none on 200 streams at felt 60: ${moved} grades moved (a step of a margin, about one face in four)`);
      assert(rolled === 0 && other === 0 && moved > 20, JSON.stringify({ rolled, other, moved }));
    },
  },
  {
    name: 'breach-choice: a friend seen falling: the other man takes supp.js \'friendHit\' (FRIEND_HIT_PTS 10, his rM inside FRIEND_HIT_M) and his resolve 1 → 0.9, exactly once a fall; none to a man down, none to a man out of the room who does not see it, and none on the live lane\'s set (its two men 15.6 m apart behind walls; fails without friendDown)',
    fn() {
      const g = rpScript({ seed: 48213 }), s = g.s, b = g.man('1b'), facts = () => g.g.facts('supp').filter(f => f.input?.kind === 'friendHit');
      const felt0 = feltOf(s, b.live.who);
      g.down('1a');
      const f1 = facts(), felt1 = feltOf(s, b.live.who);
      g.run(200);
      // (a second fall of the same man is none: goDown runs once; and the reached man down himself takes nothing from a later fall)
      opforBled(s, g.g.bus, g.man('1a'), s.clock.ms);
      const f2 = facts();
      g.down('1b');
      const f3 = facts();
      console.log(`      1a down: 1b friendHit ${f1.map(f => `${f.input.pts} pts at ${fmt(Math.hypot(g.actor('1a').x - g.actor('1b').x, g.actor('1a').z - g.actor('1b').z), 2)} m`).join(', ')}, felt ${fmt(felt0, 1)} → ${fmt(felt1, 1)}, resolve ${b.live.resolve} (RESOLVE_FRIEND ${RESOLVE_FRIEND}); facts after a second bleed ${f2.length}, after 1b down too ${f3.length}; 1a's resolve ${g.man('1a').live.resolve ?? 'none'}`);
      assert(f1.length === 1 && f1[0].input.pts === FRIEND_HIT_PTS && f1[0].who === b.live.who && b.live.resolve === 0.9 && f2.length === 1 && f3.length === 1 && g.man('1a').live.resolve === undefined, JSON.stringify({ f1, resolve: b.live.resolve, f2: f2.length, f3: f3.length }));
      // (out of the room and his back to it: nothing)
      const h = rpScript({ seed: 48213 }), a = h.actor('1b');
      a.x = 29.0; a.z = 18.0; a.$px = a.x; a.$pz = a.z; a.headRad = Math.PI / 2;
      const reached = friendDown(h.s, h.g.bus, h.man('1a'), h.s.clock.ms);
      console.log(`      1b put in the hall at (29.0, 18.0) facing south, 1a falls: reached ${JSON.stringify(reached)}, resolve ${h.man('1b').live.resolve ?? 'none'}; FRIEND_HIT_M ${FRIEND_HIT_M}`);
      assert(!reached.length && h.man('1b').live.resolve === undefined, JSON.stringify(reached));
      // (the live lane's set: 2a falls, 3a in room 3 takes nothing)
      const w = liveGame({ seed: 48213, tier: 'sgt', opfor: 'live:fight,fight', setup: 'room:2' }), T2 = w.s.armoury.range.turners.find(t => t.stand === '2a'), T3 = w.s.armoury.range.turners.find(t => t.stand === '3a');
      const a2 = w.s.actors.list.find(x => x.who === T2.live.who), a3 = w.s.actors.list.find(x => x.who === T3.live.who);
      opforBled(w.s, w.g.bus, T2, w.s.clock.ms);
      const live = w.g.facts('supp').filter(f => f.input?.kind === 'friendHit');
      console.log(`      the live lane: 2a down, 3a ${fmt(Math.hypot(a2.x - a3.x, a2.z - a3.z), 1)} m away in ${T3.room}: friendHit ${live.length}, resolve ${T3.live.resolve ?? 'none'}`);
      assert(T2.live.st === 'down' && !live.length && T3.live.resolve === undefined, JSON.stringify({ live: live.length, resolve: T3.live.resolve }));
    },
  },
  {
    name: 'breach-choice: the table chooses: over scripted rooms (the bang or none, held or loose, a friend down, the room pressed), every change of a man\'s state is the procedure\'s, the shock\'s, the give\'s, the fall\'s or choiceOf\'s at his felt band and grade, rolled only at a band change or after CHOICE_DWELL_MS from cover or a freeze, never a card; surrender final',
    fn() {
      const off = [], tally = { rolls: 0, byBand: 0, byDwell: 0, what: {}, moves: {} };
      const CASES = [{ seed: 48213, held: 'loose', bang: true, p: [30, 40] }, { seed: 48213, held: 'held', bang: true, p: [45, 20] }, { seed: 7, held: 'loose', bang: true, p: [20, 50] },
        { seed: 7, held: 'held', bang: false, p: [60, 30] }, { seed: 11, held: 'loose', bang: true, p: [35, 35] }, { seed: 19, held: 'loose', bang: false, p: [70, 10] }];
      for (const c of CASES) {
        const g = rpScript({ seed: c.seed, held: c.held }), s = g.s, prev = {};
        const snap = (T) => ({ st: T.live.st, choiceAt: T.live.choice?.atMs ?? null, band: T.live.band, what: T.live.choice?.what ?? null, card: T.live.card });
        for (const st of BREACH_STANDS) prev[st] = snap(g.man(st));
        const watch = () => {
          for (const st of BREACH_STANDS) {
            const T = g.man(st), L = T.live, p = prev[st], n = snap(T);
            if (L.card !== 'fight' || L.gaveCard) off.push({ c, st, why: 'a card' });
            if (n.choiceAt !== p.choiceAt) {
              tally.rolls++; tally.what[n.what] = (tally.what[n.what] ?? 0) + 1;
              const byBand = n.band !== p.band, byDwell = !byBand && (p.what === 'cover' || p.what === 'freeze') && n.band >= 2 && n.choiceAt - p.choiceAt >= CHOICE_DWELL_MS;
              if (byBand) tally.byBand++; else if (byDwell) tally.byDwell++; else off.push({ c, st, why: 'an unprompted roll', p, n });
              const ch = L.choice;
              if (ch.band < 2 ? ch.what !== 'fight' || ch.grade : !(CHOICE_TABLE[Math.min(3, ch.band)][ch.grade] === ch.what || (CHOICE_TABLE[Math.min(3, ch.band)][ch.grade] === 'give' && ch.what === 'freeze'))) off.push({ c, st, why: 'off the table', ch });
              if (p.what === 'give') off.push({ c, st, why: 'rolled after a give' });
            }
            if (n.st !== p.st) {
              const k = `${p.st}→${n.st}`; tally.moves[k] = (tally.moves[k] ?? 0) + 1;
              const rolledNow = n.choiceAt !== p.choiceAt;
              const ok = n.st === 'down' || n.st === 'out' || (n.st === 'hands' && (rolledNow && n.what === 'give' || L.chalUntilMs !== undefined))
                || (n.st === 'freeze' && rolledNow && n.what === 'freeze') || (n.st === 'move' && rolledNow && n.what === 'cover') || (n.st === 'cover' && (p.st === 'move' || rolledNow) && n.what === 'cover')
                || (['wait', 'turn', 'aim', 'fire'].includes(n.st) && !['freeze', 'cover', 'hands', 'down', 'out'].includes(p.st)) || (n.st === 'aim' && ['freeze', 'cover', 'move'].includes(p.st) && (n.what === 'fight' || p.st === 'move'));
              if (!ok) off.push({ c, st, why: 'a change of state no rule made', k, n });
            }
            prev[st] = n;
          }
        };
        const run = (ms) => { const t0 = s.clock.ms; while (s.clock.ms < t0 + ms) { g.g.step(1, g.LEAVE); watch(); } };
        // (nobody of the stack goes in: the men's own procedure and the table, the room pressed by the script's points)
        g.open(); run(2500);
        if (c.bang) g.bang();
        run(1500);
        g.down('1a'); watch();
        g.press('1b', c.p[0]); run(5000);
        g.press('1b', c.p[1]); run(5000);
      }
      console.log(`      ${CASES.length} rooms: ${tally.rolls} choices rolled (${tally.byBand} at a band change, ${tally.byDwell} after the dwell): ${JSON.stringify(tally.what)}; the changes of state ${JSON.stringify(tally.moves)}; off the table or unprompted ${off.length}`);
      assert(!off.length && tally.rolls > 0, JSON.stringify(off.slice(0, 4)));
    },
  },
  {
    name: 'breach-choice: the scene\'s flag is R.house.bangGo alone: on "Stack and clear, live" a door cut by the BC-1 (burst.js: R.house.breach[door] { how: \'cut\' }) or shot (bundle.js\'s record) leaves rpStandsOf at RP_STANDS and spotOf at OPFOR_SPOTS; with R.house.bangGo, BREACH_STANDS and BREACH_SPOTS',
    fn() {
      const w = liveGame({ seed: 48213, tier: 'sgt', opfor: 'live', setup: 'room:2' }), s = w.s, H = w.H;
      const out = burst(s, w.g.bus, { id: 'test-bc1', model: 'bc1', x: 20.6, z: 14.7, atMs: s.clock.ms, byId: s.player.id, door: 'o:w4:r2' });
      (H.breach ??= {})['o:w4:r3'] = { how: 'shot', rounds: 2, points: {}, atMs: s.clock.ms };
      const stands = rpStandsOf(s), spot = spotOf(s, { stand: '2a' });
      console.log(`      the live lane, room 2's door ${out.blown ? 'blown' : 'not blown'} by the BC-1 (R.house.breach ${JSON.stringify(Object.keys(H.breach))}): rpStandsOf ${JSON.stringify(stands)}, 2a's spot the set's ${spot === OPFOR_SPOTS['2a']}`);
      assert(H.breach['o:w4:r2']?.how === 'cut' && JSON.stringify(stands) === JSON.stringify(RP_STANDS) && spot === OPFOR_SPOTS['2a'], JSON.stringify({ breach: H.breach, stands }));
      const t = createGame({ scenario: 'test-shoothouse', seed: 48213 }).state;
      t.armoury.range.house.bangGo = { v: 1, bang: 'quiet', held: 'loose', code: 'quiet,loose', window: null, track: {}, search: null };
      assert(JSON.stringify(rpStandsOf(t)) === JSON.stringify(BREACH_STANDS) && spotOf(t, { stand: '1b' }) === BREACH_SPOTS['1b'], 'the scene\'s record');
    },
  },
];
