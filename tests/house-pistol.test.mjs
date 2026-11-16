// OLYMPUS tests: your P-12 at the tower (the build sheet v0.0.21 §1 item 6; house lens H7 (c); done lens D2 (c) and (f)): MAKE SAFE holsters it at Stop, a P-12 owed at MAKE READY is answered or racked, never taken to GO cold, and a fumbled P-12 is where its words say.
//
// At Stop (the tower's MAKE SAFE, macros.js MACROS.safe): the P-12's share (sidearm.js ADMIN.safe, 'pistol:holster') holsters a
// P-12 in your hand, brings the R-7 up off its sling and runs its MAKE SAFE, so one press passes the tower's Stop (shoothouse.js
// houseReady 'houseSafe'); Stop's end holds a pistol in its holster (plan.js COLD_ENDS.stop), so Fix names MAKE SAFE over it, never
// "already so". At MAKE READY: the house bot answers the P-12's round still owed by its own row (tests/bots/house.mjs), and the
// tower's move-on racks a P-12 owed in the hand as in the holster (shoothouse.js houseMoveOn). The sheet's "Your pistol. A round up."
// and "P-12 COLD" (H.pistolCold) are not built: the snapshot of v0.0.20 already has the instructor rack an owed P-12 at the move-on
// and say so ("Your pistol had no round up. I've racked it.", HOUSE_CHIEF.pistolRacked: v0.0.19's fixer and the hunt of v0.0.18's
// pistol-6), so GO is never given cold, silently or not, and that is kept (the round's task). N15 (fumble.mjs wordsWatch) is the
// net's check of the words against the truth; its own case here plays forty dice plans of the P-12's draws and holsters.
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { netGame, netHouse, dice, wordsWatch, laneKey, RATE, TWO_RATE, GRADES } from './bots/fumble.mjs';
import { houseHonestBot } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { gunField, beliefOf } from '../src/sim/arms/firearms.js';
import { pistolDrawn, adminSubs } from '../src/sim/arms/sidearm.js';
import { N15_FINDING } from './house-fumble.test.mjs';
import { HOUSE_CHIEF } from '../src/data/courses.js';

const STOP_SAVE = () => gunzipSync(readFileSync(`${root}/tests/saves/v0.0.20-house-stop.json.gz`)).toString();
const kitOf = (s) => s.people[s.player.id].kit;
// (a gun's truth in a word: its chamber, its magazine)
const truthOf = (g) => `chamber ${gunField(g, 'chamber') ?? 'empty'}, magazine ${g?.mag ? 'in' : 'out'}`;
// (the J's words since a seq; the instructor's "I've racked it", by its variants)
const saidSince = (s, seq) => (s.log ?? []).filter(e => e.seq > seq && typeof e.text === 'string').map(e => e.text);
const isRacked = (t) => HOUSE_CHIEF.pistolRacked.includes(t);

// (the boot recruit from the brief on seed 1 by the net's house bot, the net's fumbles on his rolls, to GO: the faults and the
// instructor's words before it, the P-12 at GO)
function toGo({ p12 }) {
  const lane = { tier: 'recruit', setup: null, seed: 1, bot: 'house', rate: RATE };
  const g = netGame.createGame({ scenario: 'test-shoothouse', seed: 1, tier: 'recruit' }), s = g.state, bot = netHouse.houseBot({ mode: 'keys', p12 });
  dice.plan = { rate: RATE, twoRate: TWO_RATE, grades: GRADES, seed: laneKey(lane) }; dice.n = 0; dice.forced = 0; dice.log = []; dice.pid = s.player.id;
  try {
    for (let i = 0; i < 6000 && (s.armoury.range.house.goAtMs ?? null) === null; i++) { g.step(1, bot); g.clearFacts?.(); }
  } finally { dice.plan = null; }
  const H = s.armoury.range.house, p = s.items[H.pistol], log = s.log ?? [];
  return { go: H.goAtMs !== null, forced: dice.forced, slow: s.armoury.range.faults.filter(f => f.rule === 'slow').length, racked: log.filter(e => isRacked(e.text)).length,
    ready: !!p?.mag && gunField(p, 'chamber') === 'live', truth: truthOf(p) };
}

export default [
  {
    name: 'MAKE READY, a P-12 owed (the fumble net\'s p12-unready lanes): the boot recruit on seed 1 by the house bot, his fumbles forced, makes his P-12 ready by its own row before GO, no move-on (without the bot\'s answer the tower moves on, a \'slow\' fault, and the instructor racks it, once, as built)',
    timeoutMs: 120_000,
    fn() {
      const on = toGo({ p12: true }), off = toGo({ p12: false });
      console.log(`      with the bot's answer: GO ${on.go}, ${on.forced} rolls fumbled, 'slow' faults before GO ${on.slow}, "I've racked it" ${on.racked}; the P-12 at GO ${on.truth}`);
      console.log(`      without it (the rifle alone, v0.0.20's bot): 'slow' faults ${off.slow}, "I've racked it" ${off.racked}; the P-12 at GO ${off.truth}`);
      assert(on.go && on.ready && on.slow === 0 && on.racked === 0, JSON.stringify(on));
      assert(off.go && off.ready && off.slow >= 1 && off.racked === 1, JSON.stringify(off));
    },
  },
  {
    name: 'MAKE READY, a P-12 left in the hand unchambered (its row halted after the draw: the corporal on seed 1 once the bot answered it): the tower\'s move-on racks it there, in the hand, on safe, and says so; before, it went to GO cold (the net\'s N11)',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl' }), s = g.state, pid = s.player.id, R = s.armoury.range, H = R.house;
      for (let i = 0; i < 4000 && R.cmd?.id !== 'ready'; i++) g.step(1, {});
      assert(R.cmd?.id === 'ready' && !s.stop, JSON.stringify({ cmd: R.cmd?.id, stop: s.stop?.mode }));
      pistolDrawn(s, pid, H.pistol);
      const p = s.items[H.pistol], seq = s.log.at(-1)?.seq ?? 0, before = truthOf(p), b = beliefOf(s, H.pistol);
      for (let i = 0; i < 3000 && R.cmd?.id === 'ready'; i++) g.step(1, {});
      const said = saidSince(s, seq).filter(isRacked);
      console.log(`      the P-12 drawn at MAKE READY (${before}, believed chamber ${b.chamber}); at the move-on to ${R.cmd?.id}: ${truthOf(p)}, in the hand ${kitOf(s).hands?.includes(H.pistol)}, mode ${gunField(p, 'mode')}; said ${JSON.stringify(said)}`);
      assert(gunField(p, 'chamber') === 'live' && gunField(p, 'mode') === 'safe' && kitOf(s).hands?.includes(H.pistol) && said.length === 1, JSON.stringify({ truth: truthOf(p), said }));
    },
  },
  {
    name: 'Stop with the P-12 in the hand (stage 0\'s save): Fix names MAKE SAFE (Stop\'s end holsters it; before, "already so"), and one press holsters it, brings the R-7 up on safe and passes the tower\'s Stop with no \'slow\' fault; the honest bot\'s T as built (Rifle up) needs no press by hand; your #2\'s P-12 is never MAKE SAFE\'s',
    timeoutMs: 60_000,
    fn() {
      const json = STOP_SAVE();
      // (Fix and T at the Stop's first pause)
      let g = createGame({ scenario: 'test-shoothouse', seed: 48213 }), s = g.load(json);
      g.step(3, {});
      const rows = stepsOf(s), fix = rows.find(r => r.fix), safe = rows.find(r => r.id === 'macro:safe'), line = instinctNow(s).line;
      // (your #2's share: none, his P-12 drawn or not (two.js holsters his own first))
      const two = s.armoury.range.house.two, twoShare = two?.pid ? adminSubs(s, two.pid, 'safe') : [];
      console.log(`      at Stop: Fix ${fix ? `"${fix.label}" (${(fix.subs ?? []).map(x => x.id).join(', ')})` : 'none'}; T ${line?.act ?? '-'} ("${line?.text ?? ''}"); your #2's share ${JSON.stringify(twoShare)}`);
      assert(fix?.id === 'macro:safe' && safe?.subs?.at(-1)?.id === 'pistol:holster' && !twoShare.length, JSON.stringify({ fix: fix?.id, subs: safe?.subs?.map(x => x.id) }));
      // (MAKE SAFE pressed once)
      const t0 = s.clock.ms, R = s.armoury.range, faults0 = R.faults.length;
      g.step(1, { act: [stepAct('macro:safe')] });
      for (let i = 0; i < 400 && (s.stop?.doing || s.stop?.phase !== 'choose'); i++) g.step(1, {});
      const k = kitOf(s), rifle = s.items[k.worn.sling], pistolId = R.house.pistol;
      const after = { holstered: k.worn.holster === pistolId, rifle: `${k.carry.posture}, ${gunField(rifle, 'mode')}`, s: (s.clock.ms - t0) / 1000 };
      g.step(1, { act: [stepAct('leave')] });
      for (let i = 0; i < 400 && R.cmd?.id === 'stop'; i++) g.step(1, {});
      console.log(`      MAKE SAFE: ${after.s} s; the P-12 holstered ${after.holstered}, the R-7 ${after.rifle}; the tower to ${R.cmd?.id}, faults since ${R.faults.length - faults0}`);
      assert(after.holstered && after.rifle === 'lowReady, safe' && R.cmd?.id === 'clear' && R.faults.length === faults0, JSON.stringify({ after, cmd: R.cmd?.id, faults: R.faults.slice(faults0) }));
      // (the P-12 already on safe at the low ready, in the hand: MAKE SAFE still offered (drills.js), and Fix names it)
      g = createGame({ scenario: 'test-shoothouse', seed: 48213 }); s = g.load(json);
      s.items[s.armoury.range.house.pistol].mode = 'safe'; kitOf(s).carry.posture = 'lowReady';
      g.step(3, {});
      const fix2 = stepsOf(s).find(r => r.fix);
      console.log(`      the P-12 on safe at the low ready, in the hand: Fix ${fix2?.id ?? 'none'}`);
      assert(fix2?.id === 'macro:safe', fix2?.id ?? 'none');
      // (the honest bot from the save through the tower's Stop: its presses by hand there (the pause settled first, as the page shows it
      // once the DI's line has come: the instinct's line is runtime, never saved))
      g = createGame({ scenario: 'test-shoothouse', seed: 48213 }); s = g.load(json);
      g.step(3, {});
      const me = s.actors.list.find(a => a.who === s.player.id), hand0 = me.bot?.hand ?? 0, bot = houseHonestBot(), R2 = s.armoury.range;
      let ticks = 0;
      for (; ticks < 4000 && R2.cmd?.id === 'stop'; ticks++) g.step(1, bot);
      console.log(`      the honest bot from the save: the tower to ${R2.cmd?.id} after ${ticks} ticks, presses by hand ${me.bot.hand - hand0}`);
      assert(R2.cmd?.id === 'clear' && me.bot.hand - hand0 === 0, JSON.stringify({ cmd: R2.cmd?.id, hand: me.bot.hand - hand0 }));
    },
  },
  {
    name: 'N15\'s own case (the build sheet\'s item 7 (f): "a dropped P-12 never leaves the hand or holster"): forty dice plans of "P-12: Press check" at GO (its draw, its holster) and Rifle up, every fumbled draw and holster leaving the P-12 where its words say; and the watch bites on a word that lies',
    timeoutMs: 120_000,
    fn() {
      const g = netGame.createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' });
      g.step(3, {});
      const save = g.save(), pid = g.state.player.id, said = { snag: 0, miss: 0, catch: 0, out: 0, holstered: 0 }, cases = [];
      for (let k = 1; k <= 40; k++) {
        g.load(save);
        const s = g.state, w = wordsWatch(pid), seq = s.log.at(-1)?.seq ?? 0;
        w.tick(s);
        dice.plan = { rate: 0.5, twoRate: 0, grades: GRADES, seed: `p12-words-${k}` }; dice.n = 0; dice.log = []; dice.pid = pid;
        try {
          for (const row of ['weapon:other:pressCheck', 'weapon:rifle-up', 'weapon:rifle-up']) {
            if (!stepsOf(s).some(r => r.id === row && !r.off)) continue;
            g.step(1, { act: [stepAct(row)] });
            for (let i = 0; i < 300 && (s.stop?.doing || s.stop?.phase !== 'choose'); i++) { g.step(1, {}); cases.push(...w.tick(s)); }
            cases.push(...w.tick(s));
          }
        } finally { dice.plan = null; }
        cases.push(...w.end(s));
        for (const t of saidSince(s, seq)) {
          if (/snags in the holster/.test(t)) said.snag++; else if (/misses the holster/.test(t)) said.miss++; else if (/P-12 slips in your hand/.test(t)) said.catch++;
          else if (/^P-12 out\./.test(t)) said.out++; else if (/^P-12 holstered\./.test(t)) said.holstered++;
        }
      }
      // (the bite: "P-12 holstered." in the J of a P-12 left in the hand)
      g.load(save);
      const s = g.state, w = wordsWatch(pid);
      w.tick(s);
      pistolDrawn(s, pid, s.armoury.range.house.pistol);
      s.log.push({ seq: (s.log.at(-1)?.seq ?? 0) + 1, atMs: s.clock.ms, kind: 'roll', step: 'holster', gun: s.armoury.range.house.pistol, who: pid, text: 'P-12 holstered.' });
      const bite = w.tick(s);
      console.log(`      ${N15_FINDING.slice(0, 60)}…: forty plans, the J said: "snags in the holster" ${said.snag}, "misses the holster" ${said.miss}, "you catch it" ${said.catch}, "P-12 out." ${said.out}, "P-12 holstered." ${said.holstered}; N15 cases ${cases.length}${cases.length ? ` (${cases[0].why})` : ''}; the bite: ${bite.map(c => c.why).join('; ') || 'nothing'}`);
      assert(said.snag > 0 && said.miss > 0 && said.out > 0 && said.holstered > 0, JSON.stringify(said));
      assert(!cases.length, cases.slice(0, 3).map(c => c.why).join(' || '));
      assert(bite.length === 1 && /in the hand/.test(bite[0].why), JSON.stringify(bite));
    },
  },
];
