// OLYMPUS tests: the review of C and D of v0.0.25 ("Hold to hold"), its findings seen in whole lanes, each pinned by a case that fails without its fix.
//
// The moments (the hatch, the open middle, the tug's footing, the lock and the stances) are tests/zerocqb-review.test.mjs's; the lanes
// here (feet aft by T, the hold's plan from the setups, the corner, the brace, the Wreck's words) are a file of their own so each stays
// under its quick CPU budget. The findings, as there.
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
    name: 'feet aft at the onset by T: the corporal on 1074 at the trunk with 8.3 s to the onset holds on the deck ("Feet aft. Hold on the deck for the burn.") and is booted on deck 5 at it, through after the burn (the review of C and D: he went through and hung on the hold\'s deckhead at the onset)',
    timeoutMs: 120_000,
    fn() {
      // (the first tick you are on deck 6, from GO: the transit after the burn)
      let crossS = null;
      const { rec } = wreckLane({ tier: 'cpl', seed: 1074, bot: 'honest', each: (g) => { const s = g.state, me = s.actors.list.find(a => a.who === s.player.id), H = s.armoury.range.house; if (crossS === null && me && me.x > 30 && H.goAtMs) crossS = (s.clock.ms - H.goAtMs) / 1000; } });
      console.log(`      ${laneLine(rec)}; at the onset ${JSON.stringify(rec.tug?.atOnset)}; aft faults ${rec.tug?.aftFaults}; the burn over at ${rec.tug?.endS} s, through the trunk at ${crossS} s (its Wait ended with the burn)`);
      assert(rec.done && rec.why === 'clear' && rec.tug?.atOnset?.me === 'deck' && rec.tug?.atOnset?.two === 'deck', JSON.stringify(rec.tug));
      assert(crossS !== null && crossS - rec.tug.endS <= 4, JSON.stringify({ crossS, endS: rec.tug.endS }));
    },
  },
  {
    name: 'the hold\'s plan: from the setups \'hold\' and \'tug\' the sergeant and the tier one by T clear it with no \'time\' and no \'corner\', and no hot spot of the hold lies where neither plant sees it (the review of C and D: look:r3:sw pressed 440 to 884 times, the hold passed by \'time\')',
    timeoutMs: 120_000,
    fn() {
      const lanes = [['sgt', 'hold'], ['tierone', 'tug']].map(([tier, setup]) => ({ tier, setup, ...wreckLane({ tier, seed: 48213, bot: 'honest', setup }) }));
      const P = lanePlanOf(lanes[0].g.state).plans[WRECK_TRUNK.id];
      for (const L of lanes) console.log(`      ${L.setup}: ${laneLine(L.rec)}; faults ${L.rec.faults.join(',') || 'none'}; ticks ${L.rec.ticks}`);
      console.log(`      the hold's hot spots ${P.hot.map(h => h.id).join(', ')}; its dead space ${JSON.stringify(P.dead)}`);
      assert(lanes.every(L => L.rec.why === 'clear' && !L.rec.faults.includes('corner') && !L.rec.faults.includes('time') && L.rec.laneS < 60), lanes.map(L => `${L.tier} ${L.rec.why} ${L.rec.laneS} ${L.rec.faults}`).join(' | '));
      assert(!P.hot.some(h => h.id === 'r3:sw' || h.id === 'r3:se') && P.dead.length === 3, JSON.stringify(P.hot));
    },
  },
  {
    name: 'the honest T lanes from GO on 48213, the sergeant and the tier one: no "Corner! You never looked." (the hold\'s hidden corners gone, your "Clear!" waiting on your #2\'s sweep at the boots\' pace)',
    timeoutMs: 120_000,
    fn() {
      const T1 = wreckLane({ tier: 'tierone', seed: 48213, bot: 'honest' }).rec, S = sgtLane().rec;
      console.log(`      ${laneLine(S)}; faults ${S.faults.join(',') || 'none'}`);
      console.log(`      ${laneLine(T1)}; faults ${T1.faults.join(',') || 'none'}`);
      // (both to the card clear: with the house's 5 s wait the tier one's "Clear!" came before his #2's sweep, and on this seed the hold
      // was then passed by 'time', 228.85 s)
      assert(S.why === 'clear' && T1.why === 'clear' && !S.faults.includes('corner') && !T1.faults.includes('corner'), JSON.stringify({ sgt: [S.why, S.faults], tierone: [T1.why, T1.faults] }));
    },
  },
  {
    name: 'the brace in a lane: the sergeant by T on 48213 goes through the trunk in his #2\'s grip ("Got you.", then "Through."), braced at least one tick, the grip let go by the lane\'s end (the review of C and D: no tick braced on any sheet)',
    timeoutMs: 120_000,
    fn() {
      const { rec } = sgtLane();
      console.log(`      ${laneLine(rec)}; braced ${SGT_TICKS.braced} ticks; said ${SGT_TICKS.said.join(', ') || 'nothing'}; the hold's first round ${rec.firstAnchors[2]}; a brace at the end ${rec.braceAtEnd}`);
      assert(SGT_TICKS.braced > 0 && SGT_TICKS.said.includes('Got you.') && SGT_TICKS.said.includes('Through.') && rec.braceAtEnd === 0, JSON.stringify(SGT_TICKS));
    },
  },
  {
    name: 'the Wreck\'s words: no Wheel\'s spin line on its card, its own hot wash ("Hot wash. Here is your lane, compartment by compartment."), and the house at 0 G (&env=ship-coast) still briefs "0.00 G on this deck." (the review of C and D)',
    timeoutMs: 120_000,
    fn() {
      const { g } = sgtLane(), sheet = runSheetOf(g.state), hw = hotWashOf(g.state);
      const h = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', env: 'ship-coast' }), said = [];
      for (let i = 0; i < 400; i++) { h.step(1, {}); said.push(...h.facts('say').map(f => f.text)); h.clearFacts?.(); }
      const brief = said.find(t => /G on this deck|holds you in here|Free fall in here/.test(t)) ?? '-';
      console.log(`      the Wreck: spin line ${JSON.stringify(sheet.spinLine)}, the hot wash's first line "${hw.lines[0]}"; the house at ship-coast's brief: "${brief}"`);
      assert(sheet.spinLine === null && hw.spinLine === null, JSON.stringify(sheet.spinLine));
      assert(WRECK_CHIEF.wash.includes(hw.lines[0]) && !HOUSE_CHIEF.wash.includes(hw.lines[0]), hw.lines[0]);
      assert(/0\.00 G on this deck/.test(brief) && !WRECK_CHIEF.zero.some(z => brief.includes(z)), brief);
    },
  },
];
