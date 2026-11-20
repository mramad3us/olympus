// OLYMPUS tests: "The window and the canopy"'s window, F172's scene half (the build sheet v0.0.28 items 2 to 4, §6 B, §8).
//
// On armoury-world's window: Sign struck before the show clear (the armourer's "Show me clear first." and nothing signed), the show clear by R
// (drills.js runMacro at the act's end, the armourer the observer) and by the panel (G, then UNLOAD, SHOW CLEAR in stop motion: the readiness
// reads the gun, never the key), the record written at the signature (loc 'out', out { toId, byId }, the log); the slip caught by a scripted
// pass ("My mistake.", the right rifle across the counter) and missed by a scripted 1 (the card's number read, signed) then found at the
// rank's check, never carried past it, the fault 'serial' only when it was never read; the slip's and the short count's rates over 4,000
// seeds within 3 points of SLIP_W and SHORT_W (heavy: 20,000 within 1). Each fails without its rule.
import { assert } from './helpers.mjs';
import { armGame, untilCmd, act, dieAs, armOf, seedWith, awareOf } from './armoury-world.mjs';
import { armouryNow, armouryOf, armouryAct, SLIP_W, SHORT_W } from '../src/sim/scenarios/armoury-day.js';
import { serialOf } from '../src/sim/arms/armoury.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { stepAct } from './bots/lib.mjs';
import { stream, next } from '../src/core/rng.js';

const clean = seedWith(d => !d.slip && !d.short), slipped = seedWith(d => d.slip && !d.short);
// (to the window's command, the rifle across the counter)
function atWindow(seed, tier = 'private') {
  const g = armGame({ seed, tier });
  untilCmd(g, 'card'); act(g, 'card'); untilCmd(g, 'window');
  return g;
}
// (the rank's check to your name and the call)
function check(g) {
  act(g, 'sign');
  untilCmd(g, 'fallIn');
  const st = armouryNow(g.state).spot, me = g.me(); me.x = st.x; me.z = st.z;
  untilCmd(g, 'serials');
  for (let t = 0; t < 2000 && !armouryNow(g.state).acts.includes('call'); t++) g.step(1);
  act(g, 'call');
}
const rate = (n, key, w) => { let k = 0; for (let s = 1; s <= n; s++) if (next(stream(s, key)) < w) k++; return k / n; };

export default [
  {
    name: 'F172: Sign is struck before the show clear, the armourer says so and nothing is signed; the show clear by R meets the readiness and Sign signs, the record out to you by the armourer with its log',
    fn() {
      const g = atWindow(clean), A = armOf(g);
      const r0 = armouryNow(g.state).rows.find(r => r.id === 'sign'), said0 = g.facts('say').length;
      const a = armouryAct(g.state, g.bus, 'sign'), said = g.facts('say').slice(said0).map(f => f.text);
      console.log(`      before: Sign ${r0.struck ? `struck "${r0.why}"` : 'open'}; R on it ${a.ok ? 'acted' : 'refused'}: ${JSON.stringify(said)}; signed ${A.signed}`);
      assert(r0.struck && /clear first/i.test(r0.why) && !a.ok && !A.signed && said.some(t => /clear first/i.test(t)), JSON.stringify({ r0, said, signed: A.signed }));
      act(g, 'show');
      const R = armouryOf(g.state), r1 = armouryNow(g.state).rows.find(r => r.id === 'sign');
      act(g, 'sign');
      const rec = g.state.armoury.guns[A.gunId];
      console.log(`      after R's show clear: shown ${R.shown}, Sign ${r1.struck ? 'struck' : 'open'}; signed ${A.signed}; the record ${JSON.stringify({ loc: rec.loc, out: rec.out, log: rec.log.map(l => l.what) })}`);
      assert(R.shown && !r1.struck && A.signed === A.gunId && rec.loc === 'out' && rec.out?.toId === g.state.player.id && rec.out?.byId === A.armourerId && rec.log.at(-1).what === 'out', JSON.stringify(rec));
    },
  },
  {
    name: 'F172: the show clear by the panel (G, then UNLOAD, SHOW CLEAR in stop motion, the armourer looking) meets the same readiness as R\'s',
    fn() {
      const g = atWindow(clean), R = armouryOf(g.state);
      g.step(1, { act: ['ready'] });
      // (the rifle up first, the mode's own step; then the row)
      for (let t = 0; t < 200 && !(g.state.stop?.phase === 'choose' && !g.state.stop?.doing); t++) g.step(1);
      const S = g.state.stop, row = stepsOf(g.state).find(s => s.id === 'macro:clear');
      g.step(1, { act: [stepAct('macro:clear')] });
      for (let t = 0; t < 600 && !(g.state.stop?.phase === 'choose' && !g.state.stop?.doing); t++) g.step(1);
      const shown = R.shown;
      g.step(1, { act: [stepAct('leave')] });
      const sign = armouryNow(g.state).rows.find(r => r.id === 'sign');
      console.log(`      the mode ${S?.mode}, its row ${row ? `${row.label} (${row.off ?? 'open'})` : 'none'}; shown ${shown}; Sign ${sign?.struck ? 'struck' : 'open'}`);
      assert(S?.mode === 'stop' && row && !row.off && shown && sign && !sign.struck, JSON.stringify({ mode: S?.mode, row, shown, sign }));
    },
  },
  {
    name: 'F172: the slip caught by a read with a pass ("My mistake.", the right rifle across the counter, the rows again) and, missed by a natural 1, found at the rank\'s check and sent back to the window, the fault \'serial\' only unread',
    fn() {
      // (a pass: the slip's number read against the card's, the armourer's mistake, your own rifle after the fetch)
      const g = atWindow(slipped), A = armOf(g), wrong = A.given;
      dieAs(g, 15); act(g, 'read');
      const said = g.facts('say').map(f => f.text);
      for (let t = 0; t < 400 && A.fetch; t++) g.step(1);
      console.log(`      a pass: handed ${wrong} (yours ${A.gunId}); "${said.at(-2)}" / "${said.at(-1)}"; then ${A.given}, read ${A.read}`);
      assert(wrong === A.slipId && A.slipCaught && A.given === A.gunId && !A.read && said.some(t => /mistake/i.test(t)), JSON.stringify({ wrong, given: A.given, caught: A.slipCaught }));
      // (a natural 1: the card's number read for the rifle's, signed, then found at the check, no fault: you read it)
      const h = atWindow(slipped), B = armOf(h);
      const v1 = awareOf(h, 2); dieAs(h, 1); act(h, 'read'); act(h, 'show');
      check(h);
      for (let t = 0; t < 200 && !armouryNow(h.state).next; t++) h.step(1);
      const R = armouryOf(h.state), next0 = armouryNow(h.state).next;
      console.log(`      a natural 1 at Awareness ${v1}: read as ${B.readAs} (the card's ${serialOf(h.state, B.gunId)}, the rifle's ${serialOf(h.state, B.slipId)}); found at the check ${B.slipFound}, next ${next0}; faults ${JSON.stringify(R.faults.map(f => f.rule))}`);
      assert(B.readOk === false && B.readAs === serialOf(h.state, B.gunId) && B.slipFound && next0 === 'back' && !R.faults.some(f => f.rule === 'serial'), JSON.stringify({ readOk: B.readOk, found: B.slipFound, next0, faults: R.faults }));
      // (never read: found at the check, the fault 'serial')
      const k = atWindow(slipped), C = armOf(k);
      act(k, 'show'); check(k);
      const RK = armouryOf(k.state);
      console.log(`      unread: found ${C.slipFound}, faults ${JSON.stringify(RK.faults.map(f => f.rule))}`);
      assert(C.slipFound && RK.faults.some(f => f.rule === 'serial'), JSON.stringify(RK.faults));
      // (never past the check: the bus waits for the right rifle signed and called again)
      untilCmd(k, 'back'); act(k, 'back'); untilCmd(k, 'window');
      console.log(`      handed back: now ${C.given} (yours ${C.gunId}), the window's command again`);
      assert(C.given === C.gunId, JSON.stringify({ given: C.given }));
    },
  },
  {
    name: 'F172: the slip and the short count each on a quarter of the seeds, independent: 4,000 seeds within 3 points',
    fn() {
      const n = 4000, slip = rate(n, 'arm:slip', SLIP_W), short = rate(n, 'arm:short', SHORT_W);
      let both = 0; for (let s = 1; s <= n; s++) if (next(stream(s, 'arm:slip')) < SLIP_W && next(stream(s, 'arm:short')) < SHORT_W) both++;
      console.log(`      over ${n} seeds: the slip ${(slip * 100).toFixed(1)}%, the short count ${(short * 100).toFixed(1)}%, both ${(both / n * 100).toFixed(1)}% (independent: ${(SLIP_W * SHORT_W * 100).toFixed(1)}%)`);
      assert(Math.abs(slip - SLIP_W) <= 0.03 && Math.abs(short - SHORT_W) <= 0.03 && Math.abs(both / n - SLIP_W * SHORT_W) <= 0.03, JSON.stringify({ slip, short, both }));
    },
  },
  {
    name: 'F172 (heavy): the slip\'s and the short count\'s rates over 20,000 seeds within 1 point',
    heavy: true,
    fn() {
      const n = 20000, slip = rate(n, 'arm:slip', SLIP_W), short = rate(n, 'arm:short', SHORT_W);
      console.log(`      over ${n} seeds: the slip ${(slip * 100).toFixed(2)}%, the short count ${(short * 100).toFixed(2)}%`);
      assert(Math.abs(slip - SLIP_W) <= 0.01 && Math.abs(short - SHORT_W) <= 0.01, JSON.stringify({ slip, short }));
    },
  },
];
