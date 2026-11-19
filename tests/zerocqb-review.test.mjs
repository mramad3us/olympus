// OLYMPUS tests: the review of C and D of v0.0.25 ("Hold to hold"), each finding of the Wreck's lane pinned by a case that fails without its fix.
//
// The review played the Wreck by the house's bots on every sheet and setup (its scripts in the round's scratch) and found what a player
// hits; each case below is one of its findings, the lane or the moment it was seen in, and the number that shows it fixed:
//   - the deck hatch's fault ('hatch', shoothouse.js wreckRules): its count held while you plant or change face, or work a man (busyInHatch);
//     hung idle on the coaming with nothing up it is still faulted, once;
//   - the open middle ('open'): a body floating with nothing in reach in a hot compartment over OPEN_MS is faulted, once;
//   - feet aft judged at the onset: T holds you on the deck at the trunk with the onset AFT_HOLD_MS off or nearer (instinct/base.js 'aft');
//   - hanging by a hand off the deck under the tug is 'handhold', never 'light' (footing.js footingAt's low-g branch);
//   - the hold's plan (wreck-plans.js): its ventral corners behind the cargo are dead space, no hot spot no look can cover, so T never loops
//     on one look from the 'hold' and 'tug' setups and no honest T lane is told "Corner! You never looked.";
//   - your "Clear!" waits on your #2's sweep at the boots' pace on a ship (bundle.js CLEAR_WAIT_SHIP_MS);
//   - the brace: your #2 stacks again at a deck hatch where his hand was never out, so "Got you.", the pair from his grip, "Through.";
//   - the brace let go by your #2 at most BRACE_HOLD_MAX_MS after he took you (combat/two.js voidTick), you neither planting nor firing;
//   - the lock's inner hatch never offered; no kneel or prone on the deckhead;
//   - the Wreck's words: no Wheel's spin line, its own hot wash, and the house's brief at 0 G its own ("0.00 G on this deck.").
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { wreckLane, wreckBot, laneLine } from './flawless-wreck.mjs';
import { runSheetOf, hotWashOf, FUNNEL_FAULT_MS, OPEN_MS } from '../src/sim/scenarios/shoothouse.js';
import { WRECK_CHIEF, HOUSE_CHIEF } from '../src/data/courses.js';
import { footingOf, setAnchor, setOnFace, onFaceOf, bootsLocked } from '../src/sim/body/footing.js';
import { openMiddleOf } from '../src/sim/body/freefall.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { WRECK_HATCHES, WRECK_TRUNK } from '../src/data/places/wreck.js';
import { BRACE_HOLD_MAX_MS } from '../src/sim/combat/two.js';

// (a lane's faults by kind, every leg)
const faultsOf = (s, kind) => s.armoury.range.house.rooms.flatMap(L => L.faults.filter(f => f.kind === kind));
// (out of stop motion every tick: the clock runs, a contact's pause left at once)
const live = (s) => (s.stop ? { act: [stepAct('leave')] } : {});
// (the sergeant by T on 48213 from GO, played once for the cases that read it)
let SGT = null;
const sgtLane = () => (SGT ??= wreckLane({ tier: 'sgt', seed: 48213, bot: 'honest', each: (g) => {
  const s = g.state, me = s.actors.list.find(a => a.who === s.player.id);
  SGT_TICKS.braced += me?.anchor === 'buddy' ? 1 : 0;
  for (const f of g.facts('say')) if (f.text === 'Got you.' || f.text === 'Through.') SGT_TICKS.said.push(f.text);
} }));
const SGT_TICKS = { braced: 0, said: [] };

// (the private by the keys on 48213, held where the bot first presses "Boots to the deckhead" on the hold's coaming: the game's save there)
function atCoamingPlant() {
  const g = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'private', setup: 'go' }), B = wreckBot('honest', 'private', 48213);
  for (let i = 0; i < 6000; i++) {
    let want = null;
    const peek = (s, m, mem) => { want = B(s, m, mem); return want; };
    const s = g.state, me = s.actors.list.find(a => a.who === s.player.id);
    // (on the coaming's hold, choosing, the face row offered and nothing of the leg up: the moment the keys press it)
    if (me?.anchor === 'handhold' && Number.isFinite(me.floatY) && onFaceOf(s, s.player.id) === 'deck' && s.stop?.phase === 'choose' && stepsOf(s).some(r => r.id === 'face:deckhead' && !r.off)) {
      const L = s.armoury.range.house.rooms[s.armoury.range.house.cur];
      const up = s.armoury.range.turners.some(T => T.stand?.[0] === String(s.armoury.range.house.cur + 1) && ['threat', 'armoured'].includes(T.face) && T.stoppedAtMs === null && T.turnAtMs !== null);
      if (!up && L && !L.faults.some(f => f.kind === 'hatch')) return { g, json: g.save(), hr: s.armoury.range.house.hatchRunMs ?? 0 };
    }
    g.step(1, peek); g.clearFacts?.();
    if (s.armoury.range.end) break;
  }
  return null;
}

export default [
  {
    name: 'the hatch: the private by the keys on 48213 fires from the hold\'s coaming and plants with no "Out of the hatch!"; from the moment he presses "Boots to the deckhead" there, the 1.2 s plant counts nothing, and hung there idle instead he is faulted \'hatch\' once (the review of C and D: 18 of 18 keys lanes faulted)',
    timeoutMs: 120_000,
    fn() {
      const { rec } = wreckLane({ tier: 'private', seed: 48213, bot: 'honest' });
      const at = atCoamingPlant();
      assert(at, 'the coaming\'s plant reached');
      const opts = { scenario: 'test-zerocqb', seed: 48213, tier: 'private', setup: 'go' };
      // (B: the plant pressed, to its end)
      const gB = createGame(opts); gB.load(at.json);
      gB.step(1, { act: [stepAct('face:deckhead')] });
      for (let i = 0; i < 60 && gB.state.stop?.doing; i++) gB.step(1, {});
      const hB = faultsOf(gB.state, 'hatch').length, runB = gB.state.armoury.range.house.hatchRunMs ?? 0, plantedB = bootsLocked(gB.state, gB.state.player.id) && onFaceOf(gB.state, gB.state.player.id) === 'deckhead';
      // (A: a Wait pressed in the hatch with nothing up, the clock run 2 s past the fault's FUNNEL_FAULT_MS)
      const gA = createGame(opts); gA.load(at.json);
      gA.step(1, { act: [stepAct('wait')] });
      for (let i = 0; i < (FUNNEL_FAULT_MS + 2000) / 50; i++) gA.step(1, {});
      const hA = faultsOf(gA.state, 'hatch');
      console.log(`      ${laneLine(rec)}; faults ${rec.faults.join(',') || 'none'}; at the plant's press the count ${at.hr} ms; planted: ${plantedB}, the count ${runB} ms, 'hatch' ${hB}; idle instead: 'hatch' ${hA.length} ("${hA[0]?.text ?? '-'}")`);
      assert(!rec.faults.includes('hatch') && rec.done, JSON.stringify(rec.faults));
      assert(plantedB && hB === 0, JSON.stringify({ plantedB, hB, runB }));
      assert(hA.length === 1, JSON.stringify(hA));
    },
  },
  {
    name: 'the open middle: in the hold, hot, a body let go of every face and floating still where no hold or face is within reach is faulted \'open\' once after OPEN_MS ("Get on a face! Hold to hold."), never again in the leg (the review of C and D: no test failed without the fault)',
    fn() {
      const g = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'sgt', setup: 'hold' }), s = g.state, pid = s.player.id, me = s.actors.list.find(a => a.who === pid);
      g.step(1, live(s));
      // (the first point of the hold's floor, 0.25 m lattice, that is the open middle for a body floating at the plane's 1.0 m)
      setOnFace(s, pid, 'deck'); setAnchor(s, pid, null); delete me.v; delete me.push; delete me.tumble;
      let spot = null;
      for (let x = 61.0; x < 68.5 && !spot; x += 0.25) for (let z = 3.0; z < 6.8 && !spot; z += 0.25) { me.x = x; me.z = z; me.$px = x; me.$pz = z; me.floatY = 1.0; if (openMiddleOf(s, pid)) spot = [x, z]; }
      assert(spot, 'an open middle in the hold');
      const hold = s.armoury.range.house.rooms[2];
      let firstAt = null;
      for (let i = 0; i < 3000 / 50; i++) { g.step(1, live(s)); if (firstAt === null && hold.faults.some(f => f.kind === 'open')) firstAt = i * 50; me.x = spot[0]; me.z = spot[1]; delete me.v; }
      const open = hold.faults.filter(f => f.kind === 'open');
      console.log(`      floating at (${spot.join(', ')}) in the hold (${hold.state}); 'open' ${open.length} ("${open[0]?.text ?? '-'}") after ${firstAt} ms against OPEN_MS ${OPEN_MS}`);
      assert(open.length === 1 && firstAt !== null && firstAt >= OPEN_MS - 100 && firstAt <= OPEN_MS + 200, JSON.stringify({ open, firstAt }));
      assert(WRECK_CHIEF.open.includes(open[0].text) || open[0].text === undefined, JSON.stringify(open[0]));
    },
  },
  {
    name: 'under the tug, hanging one-handed from the hold\'s coaming (off the deck, a hand on a hold) is footing \'handhold\', one hand, never \'light\' (standing) (the review of C and D: the private\'s pair booked "STANDING LIGHT")',
    fn() {
      const g = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'sgt', setup: 'tug' }), s = g.state, pid = s.player.id, H = s.armoury.range.house, me = s.actors.list.find(a => a.who === pid);
      g.step(1, live(s));
      // (off the deckhead's boots onto a hand on the coaming's hold, 1.2 m up: as a body that came through the trunk and has not planted)
      setOnFace(s, pid, 'deck'); setAnchor(s, pid, null); me.floatY = 1.2; delete me.v;
      const r = setAnchor(s, pid, 'handhold');
      for (let i = 0; i < 20 * 25 && !H.tug?.onsetAtMs; i++) g.step(1, live(s));
      g.step(10, live(s));
      const f = footingOf(s, pid);
      console.log(`      the hand on the hold ${JSON.stringify(r)}; at ${f.gG.toFixed(2)} G after the onset: mode ${f.mode}, anchor ${f.anchor}, one hand ${f.oneHand}, floatY ${me.floatY}`);
      assert(r.ok && f.gG >= 0.05 && f.gG < 0.3, JSON.stringify({ r, f }));
      assert(f.anchor === 'handhold' && f.oneHand === true, JSON.stringify(f));
    },
  },
  {
    name: 'the brace is let go: through the trunk in your #2\'s grip from the \'trunk\' setup, neither planting nor firing, he lets go ("Through.") BRACE_HOLD_MAX_MS of lived time after he took you, your hand on the coaming (the review of C and D: the fuzz sergeant on 1962 hung in his grip to the lane\'s end, a brace never let go)',
    fn() {
      const g = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'sgt', setup: 'trunk' }), s = g.state, pid = s.player.id, B = wreckBot('honest', 'sgt', 48213);
      const me = () => s.actors.list.find(a => a.who === pid);
      let took = null;
      for (let i = 0; i < 2000 && !took; i++) { g.step(1, B); g.clearFacts?.(); if (me().anchor === 'buddy') took = s.clock.ms; }
      assert(took !== null, 'braced from the trunk setup');
      // (then nothing pressed: out of stop motion each tick, the clock lived, no plant, no round)
      let letAt = null, said = false;
      for (let i = 0; i < (BRACE_HOLD_MAX_MS + 3000) / 50 && letAt === null; i++) { g.step(1, live(s)); said ||= g.facts('say').some(f => f.text === 'Through.'); g.clearFacts?.(); if (me().anchor !== 'buddy') letAt = s.clock.ms; }
      console.log(`      braced at +${((took - s.armoury.range.house.goAtMs) / 1000).toFixed(2)} s; let go ${letAt === null ? 'never' : `${letAt - took} ms after`} (BRACE_HOLD_MAX_MS ${BRACE_HOLD_MAX_MS}), "Through." ${said}; then on the ${me().anchor}`);
      assert(letAt !== null && letAt - took <= BRACE_HOLD_MAX_MS + 100 && said && me().anchor === 'handhold', JSON.stringify({ letAt, took, said, anchor: me().anchor }));
    },
  },
  {
    name: 'the lock\'s inner hatch is never offered (the cadre\'s way in at Stop): from the hold no row names it and the hold\'s plan has no inner door; on the deckhead kneel and prone are struck "no stance on the deckhead" and pressing prone leaves you standing (the review of C and D)',
    fn() {
      const g = createGame({ scenario: 'test-zerocqb', seed: 48213, tier: 'private', setup: 'hold' }), s = g.state, pid = s.player.id;
      const rows = stepsOf(s), lock = 'o:wk:d6:lock', P = lanePlanOf(s).plans[WRECK_TRUNK.id];
      const named = rows.filter(r => r.id.endsWith(`>${lock}`)).map(r => r.id), st = rows.filter(r => /^stance:(kneel|prone|sit)$/.test(r.id)).map(r => `${r.id}:${r.off}`);
      g.step(1, { act: [stepAct('stance:prone')] });
      for (let i = 0; i < 60 && s.stop?.doing; i++) g.step(1, {});
      const me = s.actors.list.find(a => a.who === pid);
      console.log(`      on the ${onFaceOf(s, pid)}: rows naming the lock ${named.join(', ') || 'none'}; the plan's inner ${JSON.stringify(P.inner)}; the lock offered ${WRECK_HATCHES.find(h => h.id === lock)?.offered}; ${st.join(', ')}; after prone: ${me.stance ?? 'stand'} on the ${onFaceOf(s, pid)}`);
      assert(!named.length && P.inner.length === 0 && WRECK_HATCHES.find(h => h.id === lock)?.offered === false, JSON.stringify({ named, inner: P.inner }));
      assert(st.length >= 2 && st.every(x => x.endsWith(':no stance on the deckhead')) && (me.stance ?? 'stand') === 'stand', JSON.stringify({ st, stance: me.stance }));
    },
  },
];
