// OLYMPUS tests: the fumble net, the quick cut (tests/bots/fumble.mjs): the shoot house with its handling rolls fumbled, every pause held to N1 to N14, v0.0.17's known failures listed by mechanism and pinned by fixtures.
//
// The user met two dead ends in minutes of play on v0.0.17, and the hunt of 2026-11-16 (.run/hunt-findings.json) found the
// rest of their kind. This file is the net that keeps them caught.
//
// KNOWN is the allow-list: each entry names the hunt's findings (by title, exactly as the hunt wrote them) whose class it is,
// the invariants it fails, and a signature over a case (`how`, in words, and `match`): the mechanism, not the state alone
// (what Fix names, what T sends, where an honest recovery stuck and what it pressed last, the DI's line, the step held, the
// error thrown; fumble.mjs checkPause's fields). A new dead end in a known state reads another mechanism, and is UNKNOWN.
// Each entry is pinned by fixtures (tests/fumble-fixtures.json.br, fumble.mjs readFixtures): the dead end's own state, a
// save of v0.0.17 at the pause (the hunt's repro's, or a lane's at the pause before a tick's case, with the lane's dice and
// bot to play its tail). So "still failing" and "fixed" are exact, and do not hang on a lane's path. The quick tests fail when
//   - a fixture of an entry in KNOWN no longer shows it (FIXED?: delete the entry; its fixtures stay, now pinning the fix),
//   - a fixture shows a case no entry names (a fixed one come back, or a new dead end in a known place), or
//   - a quick lane (QUICK_LANES: every tier, setup and bot) meets a case no entry names (UNKNOWN).
// Some entries are not the hunt's findings but its notes ("seen but not filed"), the build sheet's cross-check, or the net's
// own; each says so in its `source`. The hunt's findings the net cannot reach yet are in UNCOVERED, with why.
// The heavy sweep (house-fumble-more) fails on UNKNOWN cases only, over hundreds of lanes, and prints where each entry is met.
import { assert } from './helpers.mjs';
import { runLane, classify, caseLine, netGame, netHouse, netInstinct, dice, INVARIANTS, RATE, checkPause, choosing, seatsWrong, seatsDone, inReach, scratchOf, readFixtures, replayFixture } from './bots/fumble.mjs';
import { createGame } from './game.mjs';
import { houseBot, runHouse } from './bots/house.mjs';

// ---- the hunt's findings (titles as .run/hunt-findings.json has them) ----
const H = Object.freeze({
  slungContact: 'A fumble that lets the rifle swing on its sling at a contact leaves Fix on "Nothing to fix", T doing nothing, and Up buried four keys deep',
  feetOnly: 'Rounds only at the feet: no RELOAD or LOAD is offered, Fix is silent and the DI\'s "Reload." gives T nothing',
  lockedTopUp: 'The bolt locked back with rounds in the magazine: T is Top up for ever (and Fix too after a missed lock back)',
  doubleCharge: 'A double feed seen (or a dead trigger) with the bolt believed on an empty chamber: Fire reads "chamber empty" and Fix is Charge, which does nothing',
  chargeLeft: 'A RELOAD halted before its Charge leaves the rifle unloaded, the DI saying "Press." and Fix MAKE READY in the fight',
  wrongMag: 'A magazine of the wrong gun held in the support hand gets seated: Rifle up leaves the P-12\'s stripped magazine in the hand, then every rifle reload seats it and throws the tick',
  slungStoppage: 'A rifle hanging on its sling with a stoppage gets the slung panel: no Transition, Gun down or Off the line while a man faces you, and Fix says "Nothing to fix"',
  p12Go: 'The P-12 reaches GO unchambered without a word, and out of the holster with an empty chamber the DI gives no act while a man faces you',
  p12Drop: 'A dropped P-12 never leaves the hand or holster: "slips out of your hand and falls", yet a fumbled holster still holsters it on safe',
  p12Sling: '"Sling it" is offered for the drawn P-12: it spends about 1 s, says "P-12 slung." and does nothing',
  coldFix: 'On a cold line the Fix key offers "Off safe" (at the instructor\'s Stop, the wait and UNLOAD, SHOW CLEAR), and "Top up" while the DI says "Safety on"',
  pinTwo: 'The body gap pins you behind your standing #2: a bundle or move row whose path runs through him is held for ever, and T\'s own line leads you into it',
  pinStuck: 'A bundle stuck on the body gap cannot be stopped: Backspace, X, G and the keys do nothing, and the stall\'s pass of the leg does not hand it back',
  lockedSwap: 'Bolt locked back on a loaded magazine: the DI\'s "Reload." makes T swap magazines for ever, and Fix names Top up or Off safe, never the bolt release',
  cond3TopUp: 'Empty chamber with a magazine in (Condition 3) at a contact: Fix offers a Top up that leaves the chamber empty, and once aimed the DI goes silent',
  floorMags: 'Every rifle magazine on the floor at your feet: no LOAD or RELOAD, Fix "Nothing to fix", and the DI\'s "Reload." has no act',
  lockedLoop: 'Bolt locked back on a loaded magazine: T, the DI\'s "Reload." and Fix all say Top up, which never closes the bolt, so T loops',
  slungMode: 'Rifle dropped onto its sling in stop motion: Fix shows a tick, T and G do nothing, the band flips to IN THE ROOM with "Clear!" live',
  cond3Shot: 'Condition 3 at a contact (magazine in, chamber empty): the DI names a shot no row can take, T is dead, Fix says Top up',
  offLane: 'Off the lane, Fix offers "Off safe" under the instructor\'s LOAD, MAKE READY and UNLOAD, SHOW CLEAR',
  remedialDrop: 'REMEDIAL ACTION halted by its charge dropping the rifle: the magazine is believed empty, the bolt home, and nothing reloads or charges',
});

// ---- the signatures a case carries (fumble.mjs checkPause's fields) ----
// A KNOWN entry matches a case by its mechanism, not by its state alone: what Fix names (fixId, fixOff), what T sends
// (line.act), where an honest recovery stuck (rc.at) and what it pressed last (the path's last), the DI's line (line.id), the
// step held (N6) or the error thrown (N8). A new dead end in a known state (Up that does nothing on a slung rifle, a Bolt
// release that does nothing on a locked one) reads another mechanism, and is UNKNOWN.
const at = (c) => c.rc?.at ?? {};
// (the recovery's last press but G: a T that leads out of the mode is followed by the G that brings it back)
const lastPress = (c) => [...(c.rc?.path ?? [])].reverse().find(p => p !== 'G') ?? '';
const tick = (c) => c.fixOff === 'already so';
const eye = (c) => c.fixOff === 'nothing offered now';
const silent = (c) => !c.line?.act;
const rc = (c) => c.inv === 'N5' || c.inv === 'N12';
const looped = (c) => c.rc?.why === 'looped';
const stuckBare = (c) => /^nothing to press/.test(c.rc?.why ?? '');
/** A press that leads the marine on (a move, a drill, a door, the leg's calls), not one for the gun. */
const LEADS = /^(T|Fix):(stop:)?(drill|move|door|leave|look|call|team|aim|contact|wait)/;
const DRY_EMPTY = new Set(['empty-no-mag', 'locked-empty', 'empty-mag-0']);
const UP_ACTS = new Set(['stop:up', 'stop:weapon:transition', 'stop:weapon:rifle-up']);
const TOP_UP = /macro:reload:tactical$/;

/**
 * v0.0.17's known failures, most specific first (classify takes the first entry of a case's invariant that matches). Each:
 * { id, findings (titles), source, inv, how (the mechanism, in words: the signature below), match(case) }. When a fix lands,
 * delete the entry: its fixtures (tests/fumble-fixtures.json.br) stay, and from then on pin the fix (a fixture of an entry not
 * in KNOWN fails on any case it shows that no entry names).
 */
export const KNOWN = Object.freeze([
  // (v0.0.18 fixed the other 17 of v0.0.17's entries: wrong-mag, nothing-left, remedial-drop, slung-stoppage, slung, feet-only,
  // locked-top-up, chamber-unknown, cond3-top-up, p12-unready, cond3-di, leads-on, charge-nothing, pin, cold-fix, p12-sling and
  // p12-port; v0.0.19's fixer the last two: stoppage-silent (cqb-stoppage's act falls to Fix's row where no drill is offered) and
  // noshoot-silent (cqb-noshoot keeps quiet over a gun that cannot fire, cqb-reload leading); their fixtures stay in
  // tests/fumble-fixtures.json.br and now pin the fixes)
].map(e => Object.freeze({ ...e, inv: Object.freeze(e.inv), match: (c) => e.inv.includes(c.inv) && e.match(c) })));

/**
 * Open in v0.0.18's sweep (house-fumble-more, 216 lanes): classes whose fixtures v0.0.18 fixed but which its lanes still meet,
 * so they are not KNOWN (the fixtures would call them fixed) and not UNKNOWN (they are not new). The sweep accepts them and
 * prints them; each is v0.0.19's or v0.0.20's to close (the v0.0.20 sheet's item 1 is the pin). Delete an entry when the sweep
 * meets it no more. Seen on v0.0.18, seeds 1 and 2: the pin 32 cases in 16 lanes (the fuzz bot's only), the P-12 unready at GO 7, T leading
 * on over a dry gun 4, T going between Rifle up and Transition with both guns dry 1, and N7 reading Rifle up's seat of a
 * HAD-30 as the P-12's 3 (the net's own misreading: Rifle up holsters the pistol and seats the magazine in the rifle).
 */
export const OPEN = Object.freeze([
  // (v0.0.19's fixer closed all five, each with fixtures from v0.0.18's sweep lanes (tests/fumble-fixtures.json.br, "v0.0.19's
  // fixer"): pin-v018 (places/move.js PIN_END_MS: a walk of yours held 2 s by a body hands back), p12-unready-v018 (the tower's
  // move-on past MAKE READY racks a P-12 still owed, shoothouse.js houseMoveOn), leads-on-v018 (cqb-contact's lines that lead on
  // keep quiet over a gun that cannot fire), pingpong-v018 (cqb-rifle-up yields to Fix over a dry rifle) and n7-rifle-up (the
  // net's seatsHeld: a seat after a change of gun is the other gun's))
].map(e => Object.freeze({ ...e, inv: Object.freeze(e.inv), match: (c) => e.inv.includes(c.inv) && e.match(c) })));

/** The hunt's findings the net does not reach yet, and why (printed, so the list is honest about its holes). */
export const UNCOVERED = Object.freeze([
  { finding: H.p12Drop, why: 'the words against the truth (the J says the P-12 fell, it is holstered): no invariant reads the log\'s words yet' },
]);

/**
 * The quick lanes (my call), at RATE: every tier, every setup and the three bots, for breadth at about 3 s (an UNKNOWN case is a
 * fail; the entries' persistence is the fixtures', not the lanes'; the heavy sweep looks wide).
 */
export const QUICK_LANES = Object.freeze([
  { tier: 'cpl', setup: null, seed: 1, bot: 'honest' },            // p12-unready, p12-sling, cond3-top-up, slung, cold-fix
  { tier: 'recruit', setup: 'hall', seed: 1, bot: 'fuzz' },
  { tier: 'tierone', setup: 'hall', seed: 1, bot: 'fuzz' },
  { tier: 'private', setup: 'room:3', seed: 1, bot: 'house' },
  { tier: 'sgt', setup: 'go', seed: 1, bot: 'house' },
  { tier: 'raider', setup: 'contact', seed: 1, bot: 'honest' },
  { tier: 'tierone', setup: 'room:2', seed: 1, bot: 'honest' },
].map(L => Object.freeze({ ...L, rate: RATE })));

/** The counts by invariant and by entry, printed six spaces in (an entry unmet in lanes is no news: its fixtures say whether it still fails). */
export function printSweep(recs, { hits, unknown }) {
  const all = recs.flatMap(r => r.cases), by = {};
  for (const c of all) by[c.inv] = (by[c.inv] ?? 0) + 1;
  console.log(`      ${recs.length} lanes, ${recs.filter(r => r.done).length} to the card, ${recs.reduce((a, r) => a + r.pauses, 0)} pauses, ${recs.reduce((a, r) => a + r.forced, 0)} of ${recs.reduce((a, r) => a + r.rolls, 0)} handling rolls fumbled; ${all.length} cases`);
  console.log(`      by invariant: ${Object.keys(INVARIANTS).map(k => `${k} ${by[k] ?? 0}`).join(', ')}`);
  for (const [e, cs] of hits) console.log(`      ${cs.length ? 'KNOWN' : 'unmet here'} ${e.id} (${e.inv.join(' ')}): ${cs.length} case${cs.length === 1 ? '' : 's'}${cs.length ? ` in ${new Set(cs.map(c => c.lane)).size} lane(s), first ${cs[0].lane}` : ''}`);
  for (const c of unknown.slice(0, 12)) console.log(`      UNKNOWN ${caseLine(c).slice(0, 600)}`);
  if (unknown.length > 12) console.log(`      … ${unknown.length - 12} more unknown`);
}

export default [
  {
    name: 'the net\'s copy of the game is the game: with no plan set, a lane of the private by the keys ends on the same digest in the net\'s copy and in the plain game (the dice untouched, the copy\'s modules its own)',
    fn() {
      const opts = { scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'contact' };
      dice.plan = null;
      const a = createGame(opts), b = netGame.createGame(opts);
      const ra = runHouse(a, houseBot({ mode: 'keys' }), { maxMs: 40_000 }), rb = netHouse.runHouse(b, netHouse.houseBot({ mode: 'keys' }), { maxMs: 40_000 });
      console.log(`      plain ${a.digest()} after ${ra.ticks} ticks, net ${b.digest()} after ${rb.ticks} ticks`);
      assert(a.digest() === b.digest() && ra.ticks === rb.ticks, JSON.stringify({ plain: a.digest(), net: b.digest(), ticks: [ra.ticks, rb.ticks] }));
    },
  },
  {
    name: 'the dice fumble what they are told: at rate 1 every handling roll of the player\'s is forced (the J\'s roll records marked forced, a miss, bad or disaster), and the same lane fumbles the same rolls twice',
    fn() {
      const L = { tier: 'tierone', setup: 'contact', seed: 7, bot: 'house', rate: 1, twoRate: 0, maxMs: 20_000, recover: false, keep: true };
      const a = runLane(L), b = runLane(L), me = a.game.state.player.id;
      const rolls = (a.game.state.log ?? []).filter(e => e.kind === 'roll' && e.roll?.skill === 'weapons' && e.who === me);
      const grades = rolls.map(e => `${e.roll.grade}${e.roll.forced ? '' : '(not forced)'}`);
      console.log(`      ${a.forced} of ${a.rolls} rolls forced (the #2's left alone at twoRate 0), ${a.cases.length} cases; the J's: ${grades.join(', ')}; again: ${b.forced} of ${b.rolls}`);
      assert(a.forced > 0 && a.forced === a.rolls && rolls.length > 0 && rolls.every(e => e.roll.forced && ['miss', 'bad', 'disaster'].includes(e.roll.grade)), JSON.stringify({ forced: a.forced, rolls: a.rolls, grades }));
      assert(a.forced === b.forced && a.rolls === b.rolls && a.game.digest() === b.game.digest(), JSON.stringify({ a: [a.forced, a.rolls, a.game.digest()], b: [b.forced, b.rolls, b.game.digest()] }));
    },
  },
  {
    name: 'the checks that v0.0.17 never fails still bite: T naming a row nobody offers (N2), a seat of a held magazine of the wrong family or believed empty, offered (N7) or done after a reach (N7), a lane with no card (N8)',
    fn() {
      // (N2: at a real pause, the DI's line given an act no panel has; T pressed on a copy does nothing, so it is caught)
      const g = netGame.createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'contact' });
      for (let i = 0; i < 2000 && !choosing(g.state); i++) g.step(1, {});
      assert(choosing(g.state), 'no pause reached on setup contact');
      g.step(3, {});
      const was = netInstinct.instinctNow(g.state);
      g.state.$instinct = { ...was, line: { id: 'net-bite', act: 'stop:no-such-row', text: 'Nothing has this.', tone: 'note' } };
      const n2 = checkPause(g, { recover: false, scratch: scratchOf(g) }).filter(c => c.inv === 'N2');
      // (N7 offered: the judgement itself, on rows as the panel gives them)
      const seat = { id: 'seat', label: 'Seat' }, topUp = { id: 'macro:reload:tactical', label: 'Top up', subs: [{ id: 'magOut:pouch' }, { id: 'seat' }] }, reload = { ...topUp, subs: [{ id: 'reach' }, { id: 'seat' }] };
      const wrong = seatsWrong({ live: [seat, topUp], fixRow: topUp, tRow: topUp, wrong: true }), empty = seatsWrong({ live: [reload], fixRow: reload, heldEmpty: true, fuller: true });
      const fine = seatsWrong({ live: [seat, topUp], fixRow: topUp, wrong: false, heldEmpty: true, fuller: false });
      // (N7 done: the rifle's magazine swapped, as a reach's seat would, for a spare believed empty, a fuller one in the pouch)
      const s = g.state, k = s.people[s.player.id].kit, rifle = s.items[k.worn.sling], before = seatsDone(s, null).mags;
      const spares = inReach(s).filter(id => s.items[id]?.fam === s.items[rifle.mag]?.fam && id !== rifle.mag);
      assert(spares.length >= 2, `the rifle's spares: ${spares.join(', ')}`);
      s.items[spares[0]].belief = { ...(s.items[spares[0]].belief ?? {}), n: 0 }; rifle.mag = spares[0];
      const done = seatsDone(s, before).cases;
      // (N8: a lane cut short of its card)
      const short = runLane({ tier: 'private', setup: 'contact', seed: 1, bot: 'house', maxMs: 5_000, recover: false });
      console.log(`      N2: ${n2.map(c => c.why).join('; ') || 'nothing'}; N7 offered: wrong family ${wrong.join(', ') || '-'}, believed empty ${empty.join(', ') || '-'} (a reach first: none), nothing wrong ${fine.join(', ') || '-'}; N7 done: ${done.map(c => c.why).join('; ') || 'nothing'}; N8: ${short.cases.filter(c => c.inv === 'N8').map(c => c.why).join('; ')}`);
      assert(n2.length === 1 && /not offered/.test(n2[0].why), JSON.stringify(n2.map(c => c.why)));
      assert(wrong.join() === 'Fix,T,the Seat row' && !empty.length && !fine.length, JSON.stringify({ wrong, empty, fine }));
      assert(done.length === 1 && /believed empty seated/.test(done[0].why), JSON.stringify(done));
      assert(short.cases.some(c => c.inv === 'N8' && /no card/.test(c.why)), JSON.stringify(short.cases.map(c => c.why)));
    },
  },
  {
    name: 'the fixtures, v0.0.17\'s dead ends kept as saves: each entry of KNOWN still shows on its own (the hunt\'s repro\'s pause, or a lane\'s tail), no fixture shows a case no entry names, and the body-gap pin is seen by the field-free N6 as well as by the beat\'s held',
    timeoutMs: 120_000,
    fn() {
      const fixtures = readFixtures(), ids = new Set(KNOWN.map(e => e.id)), shown = new Map(KNOWN.map(e => [e.id, 0])), unknown = [], gone = [];
      let stillPin = false;
      for (const e of KNOWN) console.log(`      KNOWN ${e.id} (${e.inv.join(' ')}; ${e.source}): ${e.findings.map(t => t.slice(0, 90)).join(' / ')}`);
      for (const fx of fixtures) {
        const r = replayFixture(fx), cl = classify(r.cases, KNOWN), mine = r.cases.filter(c => KNOWN.find(e => e.id === fx.entry)?.match(c));
        unknown.push(...cl.unknown.map(c => ({ ...c, lane: `fixture ${fx.id}` })));
        if (ids.has(fx.entry) && mine.length) shown.set(fx.entry, shown.get(fx.entry) + 1);
        if (fx.entry === 'pin' && r.cases.some(c => c.inv === 'N6' && c.still)) stillPin = true;
        console.log(`      ${ids.has(fx.entry) ? (mine.length ? 'still' : 'GONE ') : 'fixed'} ${fx.id}: ${ids.has(fx.entry) ? `${[...new Set(mine.map(c => c.inv))].join(' ') || 'nothing'} of ${fx.entry}` : 'pins the fix'}${cl.unknown.length ? `, ${cl.unknown.length} UNKNOWN` : ''}`);
      }
      // (an entry is gone when none of its fixtures shows it any more: one fixture of an entry fixed while another still shows
      // keeps the entry, v0.0.18's stoppage-silent)
      for (const [id, n] of shown) if (!n && fixtures.some(fx => fx.entry === id)) gone.push(id);
      const bare = [...shown].filter(([id]) => !fixtures.some(fx => fx.entry === id)).map(([id]) => id);
      console.log(`      ${fixtures.length} fixtures for ${new Set(fixtures.map(fx => fx.entry)).size} entries; entries with none: ${bare.join(', ') || 'none'}; the pin seen with nothing changing (no field read): ${stillPin}`);
      assert(!bare.length, `KNOWN entries with no fixture (add one: fumble.mjs writeFixtures): ${bare.join(', ')}`);
      assert(!unknown.length, `a fixture shows a case no entry names (a fixed dead end come back, or a new one): ${unknown.slice(0, 4).map(caseLine).join(' || ')}`);
      assert(!gone.length, `entries none of whose fixtures shows them any more (fixed? delete the entry from KNOWN; its fixtures then pin the fix): ${gone.join(', ')}`);
      assert(!ids.has('pin') || stillPin, 'the pin fixture is not seen by the field-free N6 (nothing changing for STILL_MS)');
    },
  },
  {
    name: 'the quick lanes (a lane a tier, every setup, the three bots, fumbles at RATE): every case is one of v0.0.17\'s known failures (KNOWN, by mechanism)',
    timeoutMs: 120_000,
    fn() {
      const recs = QUICK_LANES.map(L => runLane(L));
      const cl = classify(recs.flatMap(r => r.cases), KNOWN);
      printSweep(recs, cl);
      for (const u of UNCOVERED) console.log(`      uncovered: ${u.finding.slice(0, 70)}…: ${u.why}`);
      assert(!cl.unknown.length, `UNKNOWN cases (a dead end not in KNOWN): ${cl.unknown.slice(0, 4).map(caseLine).join(' || ')}`);
    },
  },
];
