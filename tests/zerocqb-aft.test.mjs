// OLYMPUS tests: "Secure for burn" in the Wreck, feet aft at the yard tug (v0.0.25, "Hold to hold"; its build sheet §1 item 10, §8 F131).
//
// The scene's `tug` (0.2 G for 3 s toward the deck, its onset 60 s after GO, its warning 15 s before: scenes.js, set at GO by
// shoothouse.js goNow through gravity.js setProfile) is read each lived tick by the lane (wreckRules): from its warning a marine booted on
// the deck is feet aft (H.tug.aft, the card's "FEET AFT IN 3.10 S"), at its onset a marine booted on the deckhead is faulted 'aft' ("Feet
// aft! Boots on the deck."), a body floating is the gravity's to throw (gravity.js throwPass: its fall from actor.floatY under the
// 0.5 G/s ramp, fallOf's speed at the deck, carded by impactOf), and no skip is begun while the warning is out (activities.js
// startActivity's BRACE_REFUSED). F131: every honest lane meets its onset (the window brought in to the honest tier one's lane less 30 s,
// never under 60), every honest marine booted on the deck at it; a floating body thrown at fallOf's speed; no skip while pending.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { wreckLane, laneLine, WRECK_SHEETS, wreckSeeds } from './flawless-wreck.mjs';
import { fallOf, gravNow, profileOf } from '../src/sim/places/gravity.js';
import { startActivity, BRACE_REFUSED } from '../src/sim/time/activities.js';
import { setAnchor, setOnFace, onFaceOf } from '../src/sim/body/footing.js';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';
import { SCENES } from '../src/data/scenes.js';

// (an honest lane's tug kept: its onset met before the lane's end, and you and your #2 feet aft by it, each read at the onset's own tick
// (booted on the deck there: the review of C and D, a private hanging one-handed from the hold's coaming at the onset passed as feet
// aft because he had been booted on deck 5 at the warning), the card's time no later than the onset)
const aftOk = (r) => !!r.tug && r.tug.onsetS !== null && Number.isFinite(r.laneS) && r.tug.onsetS <= r.laneS && r.tug.atOnset?.me === 'deck' && r.tug.atOnset?.two === 'deck' && r.tug.aftS.me !== null && r.tug.aftS.me <= r.tug.onsetS && r.tug.aftS.two !== null && r.tug.aftS.two <= r.tug.onsetS && r.tug.aftFaults === 0;

export default [
  {
    name: 'F131: the sergeant by T on 48213 meets the tug\'s onset before his lane ends, you and your #2 booted on the deck within the 15 s warning, the card\'s "FEET AFT IN …"',
    fn() {
      const { g, rec } = wreckLane({ tier: 'sgt', bot: 'honest' }), card = runSheetOf(g.state).card;
      console.log(`      ${laneLine(rec)}; the tug ${JSON.stringify(rec.tug)}; the profile ${JSON.stringify(profileOf(g.state))}; ${/FEET AFT[^·]+/.exec(card)?.[0] ?? '-'}`);
      assert(aftOk(rec), JSON.stringify(rec.tug));
      assert(/FEET AFT IN \d+\.\d+ S/.test(card), card);
      assert(JSON.stringify(SCENES['test-zerocqb'].tug.atS) === '[60,60]', JSON.stringify(SCENES['test-zerocqb'].tug));
    },
  },
  {
    name: 'F131: at the tug\'s warning (setup \'tug\': on the hold\'s deckhead) a skip is refused; a body left floating at 1.0 m is thrown to the deck at fallOf\'s speed under the 0.5 G/s ramp and carded by impactOf; one left booted on the deckhead is faulted \'aft\'',
    fn() {
      const g = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'sgt', setup: 'tug' }), s = g.state, pid = s.player.id, H = s.armoury.range.house;
      // (out of stop motion first: time stands still in it, and the gravity's events are lived ticks')
      if (s.stop) g.step(1, { act: [stepAct('leave')] });
      g.step(5, {});
      const pending = gravNow(s);
      const sk = startActivity(s, g.bus, null, { id: 'idle', args: { ms: 60_000 } });
      // (your #2 left booted on the deckhead; you let go of the face and floating at the plane's float height, 1.0 m)
      const me = s.actors.list.find(a => a.who === pid);
      setOnFace(s, pid, 'deck'); setAnchor(s, pid, null); me.floatY = 1.0; delete me.v;
      const two = s.actors.list.find(a => a.who === H.twoPid);
      let landed = null;
      // (out of the mode every tick: a man of the hold taken in would stop time, and the tug's events are lived ticks')
      for (let i = 0; i < 20 * 25 && !landed; i++) {
        g.step(1, s.stop ? { act: [stepAct('leave')] } : {});
        landed = (s.places.live.env.profile?.log ?? []).find(e => e.who === pid && e.what === 'fell') ?? null;
      }
      const want = fallOf(1.0, 0.0006, 0.2, 0.5), two0 = onFaceOf(s, H.twoPid);
      const aft = H.rooms.flatMap(L => L.faults.filter(f => f.kind === 'aft')).length;
      console.log(`      the warning ${JSON.stringify(pending)}; the skip ${JSON.stringify(sk)} ("${BRACE_REFUSED}"); you fell ${JSON.stringify(landed)}; fallOf(1.0 m) ${want.vMs.toFixed(3)} m/s after ${want.tS.toFixed(2)} s; your #2 on the ${two0} (his feet aft his own: ${two ? 'yes' : 'no #2'}); your 'aft' faults ${aft}`);
      assert(pending?.phase === 'warn' && sk.ok === false && sk.why === 'brace', JSON.stringify({ pending, sk }));
      assert(landed && Math.abs(landed.vMs - want.vMs) <= 0.05 && Array.isArray(landed.injuries ?? []), JSON.stringify({ landed, want }));
      assert(aft === 0, 'not on the deckhead at the onset: no fault of yours');
      // (the same warning, you left booted on the deckhead to the onset: you hang there (the boots' 600 N against 205 N) and are faulted)
      const g2 = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'sgt', setup: 'tug' }), s2 = g2.state, H2 = s2.armoury.range.house;
      for (let i = 0; i < 20 * 25 && !H2.tug?.onsetAtMs; i++) g2.step(1, s2.stop ? { act: [stepAct('leave')] } : {});
      g2.step(1, s2.stop ? { act: [stepAct('leave')] } : {});
      const aft2 = H2.rooms.flatMap(L => L.faults.filter(f => f.kind === 'aft')), log2 = (s2.places.live.env.profile?.log ?? []).filter(e => e.who === pid);
      console.log(`      left on the deckhead: on the ${onFaceOf(s2, pid)} at the onset, faults 'aft' ${aft2.length} ("${aft2[0]?.text ?? '-'}"), thrown ${JSON.stringify(log2.map(e => e.what))}`);
      assert(onFaceOf(s2, pid) === 'deckhead' && aft2.length === 1 && log2.every(e => e.what === 'rode'), JSON.stringify({ face: onFaceOf(s2, pid), aft2, log2 }));
    },
  },
  {
    name: 'F131: feet aft is judged at the onset: booted on the deck at the warning, then off the boots before the onset, the card says "NOT FEET AFT" (the review of C and D: "FEET AFT IN 0.00 S" for a man hanging one-handed at it)',
    fn() {
      // (on deck 5 at GO, booted on its deck; to the warning, the boots let go 2 s after it, held where you are to the onset)
      const g = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state, pid = s.player.id, H = s.armoury.range.house;
      const live = () => (s.stop ? { act: [stepAct('leave')] } : {});
      for (let i = 0; i < 20 * 200 && !H.tug?.warnAtMs; i++) g.step(1, live());
      const atWarn = H.tug?.aft?.[pid] ?? null, onDeck = onFaceOf(s, pid);
      for (let i = 0; i < 40; i++) g.step(1, live());
      const me = s.actors.list.find(a => a.who === pid);
      setAnchor(s, pid, 'handhold');
      const held = me.anchor;
      for (let i = 0; i < 20 * 20 && !H.tug?.onsetAtMs; i++) { g.step(1, live()); if (me.anchor === 'boots') setAnchor(s, pid, 'handhold'); }
      const card = runSheetOf(s).card, line = /(NOT )?FEET AFT[^·]*/.exec(card)?.[0] ?? '-';
      console.log(`      at the warning on the ${onDeck}, feet aft ${atWarn !== null ? 'from it' : 'no'}; 2 s on the anchor ${held}; at the onset ${me.anchor} on the ${onFaceOf(s, pid)}, feet aft ${H.tug?.aft?.[pid] ?? 'none'}; the card "${line.trim()}"`);
      assert(atWarn !== null && held === 'handhold', JSON.stringify({ atWarn, held }));
      assert(H.tug?.onsetAtMs && H.tug.aft[pid] === undefined && /NOT FEET AFT/.test(card), JSON.stringify({ tug: H.tug, line }));
    },
  },
  {
    name: 'F131, every sheet: on 48213 and two more seeds each honest lane meets its onset before its end, you and your #2 feet aft by it, no \'aft\' fault (the window\'s rule)',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const bad = [];
      for (const tier of WRECK_SHEETS) for (const seed of wreckSeeds(3)) {
        const { rec } = wreckLane({ tier, seed, bot: 'honest' });
        console.log(`      ${laneLine(rec)}; aft faults ${rec.tug?.aftFaults ?? '-'}`);
        if (!aftOk(rec)) bad.push(`${tier} ${seed}`);
      }
      assert(!bad.length, bad.join(', '));
    },
  },
];
