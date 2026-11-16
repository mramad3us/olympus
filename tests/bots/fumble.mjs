// OLYMPUS bots: the fumble net, the shoot house played with its handling rolls fumbled at a rate the test sets, every pause of the lane held to the invariants N1 to N15 (the net's brief, 2026-11-16, and its review's).
//
// Why. The user met two dead ends in minutes of play on v0.0.17, and a hunt (.run/hunt-findings.json, 21 findings, the repro
// scripts under .run/hunt/) found the rest of their kind: a gun that cannot fire, and nothing on the panel, on T or in the DI's
// words that leads back to a gun that does. The bots never met one because their rolls were the game's own and their
// presses the happy path's. The net makes the rolls fail, on purpose and often, on every tier, in every room and setup, and
// checks what the player is offered at each pause; it never changes the game (src/ is read, never written: the dice are
// forced through tests/fumble-hooks.mjs, see its header for why that way).
//
// The copy. Everything the net runs is the net's copy of the game (fumble-hooks.mjs NET_QUERY): createGame, the house bots,
// the sim's modules, loaded a second time with the handling roll wrapped. Its games load the plain game's saves and back.
//
// The dice (`dice`). A plan is set per lane: { rate, twoRate, grades, seed } fumbles a handling roll of the player's at `rate`
// (of the #2's at `twoRate`), the grade drawn from `grades` ('miss', 'bad', 'disaster': SKILLS §5.6's failures), each roll's
// fate a hash of the plan's seed and the roll's count (core/hash.js: the same lane, the same fumbles), applied as doAction's
// own lever applies one (firearms.js forced()). { pass: true } passes every failing roll (the honest recovery's: "every roll
// passed"); null leaves the dice alone. Only skill 'weapons' with procedure true is touched (firearms.js act()'s roll: the
// show's observer, the marksmanship and the kicks keep their own).
//
// The invariants, at every pause of the lane (stop motion, choosing, no card, no window: read on a copy given SETTLE_TICKS
// ticks with no input, as the page shows it once the DI's line has come), each a case { inv, why, ... } with its evidence.
// "Dry" is the gun in hand that cannot fire by what the marine believes (dryOf: the rifle on its sling, a stoppage, the bolt
// locked, the chamber empty or unknown; never "on safe", a choice): the net reads the belief, as the panel must ("we only
// know what we know", the user's rule).
//   N1  fix-live      dry on the lane (the rifle on its sling too: Up is a live row): Fix names a live row (not "Nothing to
//                     fix", not a struck eye), unless no round of the gun's family is left anywhere (gun, hands, pouches, feet) and
//                     the panel says so (the struck eye, "nothing offered now", or the planner's own reason "no rounds", which the
//                     core shows whatever Fire is struck for from the huntfix of v0.0.18); "already so" over a dry gun is never honest.
//   N2  t-offered     T's act names a row offered and not struck (a 'stop:' act at a pause; a 'stop:reflex:' answer at a
//                     stoppage's card); a row the panel does not list counts when T pressed on a copy does something.
//   N3  shot-dry      on the lane, the DI never names a shot (shotLine: the contact's shot variants, "Still up.", the
//                     hostage's head) over a dry gun.
//   N4  slung-back    the rifle on its sling in the mode on the lane: Fix or T names its way back (Up, Transition, Rifle up).
//   N5  recovers      on the lane, from a dry pause with rounds left for the gun, the honest recovery by Fix (Fix, else T,
//                     every roll passed, on a copy) reaches a gun that fires (firesOf: firearms.js ready() by the truth but for
//                     the selector, and nothing in the belief that stops a press: an unknown chamber that is live fires) in
//                     RECOVER_N presses and RECOVER_MS, and never comes back to a state it has been in (a loop); where it stuck
//                     is kept (rc.at).
//   N6  no-pin        a bundle's or move's beat is never held by a body (places/move.js bodyBlocks, the beat's `held`) longer
//                     than PIN_MS; and, reading no field of the doing (so a pin by anything else, or a renamed field, is still
//                     seen), on the lane no doing of the marine's but a wait goes with nothing changing (his place and
//                     facing, his guns' truth and belief, his hands, the leg) for STILL_MS (longer than PIN_MS: one sub-step of
//                     UNLOAD, the P-12's clear, runs 8.3 s with nothing to see; a pin runs for ever). Off the lane the tower holds
//                     him on purpose.
//   N7  right-mag     no seat offered (Fix, T, or the Seat row) of a magazine in the hand that is not of the gun's family, or
//                     that is believed empty while a fuller one of the family is in reach (seatsWrong); and none done, every
//                     tick: a gun's magazine never changes to one of another family, nor (after a reach too) to one believed
//                     empty while one of its family not believed empty is in reach (hands, pouches, feet).
//   N8  card          every lane reaches the card in LANE_MAX_MS, and no tick throws (the lane's, or a copy's under a press).
//   N9  cold-fix      off the lane (the tower's commands), Fix never names Off safe; after the lane, never a reload.
//   N10 has-part      no row for a part the gun has not got: Sling it on a pistol, the port cover on a gun without one.
//   N11 go-ready      at GO every gun carried is in Condition 1 by the truth (a magazine in, a round chambered, the bolt home).
//   N12 recovers-t    N5 for the player who presses T: the recovery by T (T, else Fix), the same bounds, the same loop rule.
//   N13 t-live        dry on the lane with a man facing (sidearm.js threatFacing): T has an act (the DI's line is not silent),
//                     unless nothing at all is left to fire and the panel says so (N1's honest eye).
//   N14 fix-does      dry on the lane, Fix pressed on a copy (every roll passed) changes something of the marine's guns by the
//                     truth or the belief (a magazine swapped counts), his posture or his hands, or brings a card: a Fix that does
//                     nothing over a gun that cannot fire is a dead key. (Over a gun that fires, a Fix that changes nothing is a
//                     waste, not a dead end: v0.0.17's Top up of a magazine of 10 puts the same one back. Not read.)
//   N15 words-truth   (v0.0.21, its build sheet's item 7 (f): the hunt's "a dropped P-12 never leaves the hand or holster", UNCOVERED
//                     until now) every word of the marine's J that says where a gun or a magazine is, held to where it is once the
//                     sub-step that said it has ended (wordsWatch): "P-12 holstered." and "snags in the holster: it stays in." in
//                     the holster, "misses the holster: still in your hand." and a draw's "P-12 out." in a hand, "swings on its
//                     sling." and "hangs on its sling." on the sling, "you catch it." anywhere but the floor, and "The magazine
//                     slips out of your fingers and falls." a magazine at your feet (at its own tick, as a bundle's beat's words
//                     are: doAction moves at once). A later word of the same gun's before then stands in for it. v0.0.18 made a pistol's fumble move nothing, its words saying where it is (firearms.js
//                     act()'s drop branch); N15 is what holds that true on every lane.
// A case is classified against an allow-list (tests/house-fumble.test.mjs KNOWN: each entry a hunt finding's title and a
// signature over the case: the mechanism, not the state alone), so a test can tell a known failure of v0.0.17 from a new one.
//
// runLane({ tier, setup, seed, bot, rate, twoRate, grades, maxMs, until, recover, keep, from, snap, draw }) plays one lane (draw
// 'drawn', v0.0.21: the house drawn from the seed, A's; a fixture's save brings its own) and
// returns { cases, done, ms, ticks, forced, rolls, pauses, err, key } (and the game, with keep); `until(case)` true ends it
// early; from { save, n } plays a lane's tail from a save of it, snap gives each case the save it can be replayed from. The
// bots: 'house' (houseBot by the keys for the recruit and the private, by T above), 'honest' (houseHonestBot) and 'fuzz'
// (houseFuzzBot, its seed the lane's).
//
// The fixtures (readFixtures, replayFixture; tests/fumble-fixtures.json.br, brotli): v0.0.17's dead ends kept as saves, each
// { id, entry, from, lane, n, maxMs, save }: the pause where the hunt's repro or a lane met it (maxMs 0: the pause's checks
// alone), or the pause before a tick's case (N6, N7 done, N11) with the lane's bot and dice to play the tail for maxMs.
import { register } from 'node:module';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { NET_QUERY, NET_DICE } from '../fumble-hooks.mjs';

const REG = Symbol.for('olympus.net.registered');
if (!globalThis[REG]) { register('../fumble-hooks.mjs', import.meta.url); globalThis[REG] = true; }
const net = (p) => import(`${new URL(p, import.meta.url).href}?${NET_QUERY}`);
const [G, HB, SH, FA, GR, IN, KIT, MD, CT, HASH, SA] = await Promise.all([
  net('../game.mjs'), net('./house.mjs'), net('../../src/sim/arms/shooting.js'), net('../../src/sim/arms/firearms.js'), net('../../src/sim/arms/groups.js'),
  net('../../src/sim/skills/instinct.js'), net('../../src/sim/arms/kit.js'), net('../../src/sim/arms/models.js'), net('../../src/sim/combat/contact.js'),
  net('../../src/core/hash.js'), net('../../src/sim/arms/sidearm.js'),
]);
export const netGame = G, netHouse = HB, netInstinct = IN;

/** A fumble's rate on the player's handling rolls, by default (my call: about one roll in eight; a lane rolls 30 to 90 times). */
export const RATE = 0.12;
/** The #2's (his LOAD and MAKE READY, his reloads), by default. */
export const TWO_RATE = 0.04;
/** The grades a fumble takes, drawn evenly. */
export const GRADES = Object.freeze(['miss', 'bad', 'disaster']);
/** N5's bound: presses of the recovery. */
export const RECOVER_N = 8;
/** N5's bound: game time of the recovery (ms). */
export const RECOVER_MS = 60_000;
/** N6's bound: a beat held by a body this long is a pin (ms; the hunt's 8 s). */
export const PIN_MS = 8_000;
/** N6's bound without the field: a doing of the marine's with nothing changing this long (ms). */
export const STILL_MS = 20_000;
/** N8's bound: a lane's game time to its card (ms; runHouse's 30 min). */
export const LANE_MAX_MS = 30 * 60_000;
/** The invariants' ids and names (the header). */
export const INVARIANTS = Object.freeze({
  N1: 'fix-live', N2: 't-offered', N3: 'shot-dry', N4: 'slung-back', N5: 'recovers', N6: 'no-pin',
  N7: 'right-mag', N8: 'card', N9: 'cold-fix', N10: 'has-part', N11: 'go-ready', N12: 'recovers-t', N13: 't-live', N14: 'fix-does',
  N15: 'words-truth',
});
export const TIERS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);
/** The scene's setups (CLAUDE.md: none is the instructor's brief; 'ref' is the tests' only, left out). */
export const SETUPS = Object.freeze([null, 'go', 'room:2', 'room:3', 'hall', 'contact']);
export const BOTS = Object.freeze(['house', 'honest', 'fuzz']);

// ---- the dice ----

/** The net's dice: plan (see the header), the player's pid, the roll count, the forced rolls (the last 12). */
export const dice = { plan: null, pid: null, n: 0, forced: 0, log: [] };
const forced = (roll, grade) => {
  const ok = grade === 'pass' || grade === 'good' || grade === 'superb';
  return { ...roll, grade, ok, routine: false, forced: true, margin: ok ? Math.max(0, roll.margin) : Math.min(roll.margin, { miss: -1, bad: -6, disaster: -10 }[grade]) };
};
globalThis[Symbol.for(NET_DICE)] = (r, o) => {
  const P = dice.plan;
  if (!P || o?.skill !== 'weapons' || !o.procedure || !r) return r;
  // (v0.0.18: the planner's witness rolls through act() with no holder (plan.js BASE_ROLLER, by null) and its force lever
  // decides the grade; left alone and uncounted, so the k of a real roll is the same whatever the panel planned)
  if (o.by == null) return r;
  if (P.pass) return r.ok ? r : forced(r, 'pass');
  const me = o.by === dice.pid, rate = me ? P.rate ?? 0 : P.twoRate ?? 0, k = dice.n++;
  if (!(rate > 0) || HASH.hash01('net-fumble', P.seed, k) >= rate) return r;
  const grade = P.grades[HASH.hashInt(P.grades.length, 'net-grade', P.seed, k)];
  dice.forced++; dice.log.push(`${me ? 'me' : 'two'}:${grade}@${k}`); if (dice.log.length > 12) dice.log.shift();
  return forced(r, grade);
};
/** Run fn with the dice's plan set to plan, then put the old one back. */
export function withDice(plan, fn) { const save = dice.plan; dice.plan = plan; try { return fn(); } finally { dice.plan = save; } }

// ---- what the player sees ----

const SLUNG = new Set(['slungFront', 'slungBack']);
/** The DI's lines that name a shot (N3; the hunt's fuzz.mjs SHOT_LINE): the contact's shot variants, "Still up.", the hostage's head. */
export const shotLine = (l) => !!l && ((l.id === 'cqb-contact' && ['press', 'row', 'aim', 'onto', 'safe'].includes(l.variant)) || l.id === 'cqb-still-up' || l.id === 'cqb-hostage');
/** The rows that bring the rifle back off its sling (N4). */
export const UP_ROWS = Object.freeze(new Set(['up', 'weapon:transition', 'weapon:rifle-up']));
const houseOf = (s) => s.armoury?.range?.house ?? null;
/** On the lane: GO given, the lane not ended. */
export const onLane = (s) => { const H = houseOf(s); return !!H && H.goAtMs !== null && !H.end; };
/** A pause: stop motion, choosing, no reflex card, no skip, no take-in window. */
export const choosing = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.stop.reflex && !s.skip && !CT.contactNow(s)?.pending;
const pidOf = (s) => s.player.id;
const rifleOf = (s) => s.people[pidOf(s)]?.kit?.worn?.sling ?? null;
const postureOf = (s) => s.people[pidOf(s)]?.kit?.carry?.posture ?? 'slungFront';
/** The gun in hand at a pause (the stop's), and whether it is the long gun. */
function gunInHand(s) {
  const id = s.stop?.gun ?? rifleOf(s), g = s.items[id];
  return { id, g, long: !!g && MD.isLong(MD.modelOf(g)), kind: id === rifleOf(s) ? 'rifle' : 'pistol' };
}
/** Why the gun in hand cannot fire, by the belief (see the header), or null. */
export function dryOf(s, b = null, gun = gunInHand(s)) {
  b ??= FA.beliefOf(s, gun.id);
  if (!b) return 'no gun';
  if (gun.long && SLUNG.has(postureOf(s)) && !SA.drawn(s, pidOf(s))) return 'slung';
  if (b.stoppage) return `stoppage:${b.stoppage}`;
  if (b.chamber === 'dud' || b.chamber === 'case') return `stoppage:${b.chamber}`;
  if (b.locked) return b.mag === 'in' && b.count !== 0 ? 'locked-loaded' : 'locked-empty';
  if (b.chamber === 'empty') return b.mag === 'out' ? 'empty-no-mag' : b.count === 0 ? 'empty-mag-0' : 'cond3';
  if (b.chamber === '?') return 'chamber-unknown';
  return null;
}
/** The panel at a pause: { rows, live, line, model, fix, fixRow }. */
export function panelOf(s) {
  const rows = SH.stepsOf(s), line = IN.instinctNow(s).line ?? null;
  const model = GR.modelOf(rows, { act: line?.act ?? null, actLabel: line?.short ?? null });
  const fix = model.core.fix, fixRow = fix?.row && !fix.stand && !fix.row.off ? fix.row : null;
  return { rows, live: rows.filter(r => !r.off), line, model, fix, fixRow };
}
/** The row a 'stop:' act names (instinct/range.js stepOfAct's reading), or null. */
export function rowOfAct(rows, act) {
  const rest = act.slice(5), gt = rest.indexOf('>'), step = (gt >= 0 ? rest.slice(0, gt) : rest).split('@')[0], target = gt >= 0 ? rest.slice(gt + 1) : null;
  return rows.find(r => r.id === rest) ?? rows.find(r => r.id === step && (!target || !r.target || r.target === target))
    ?? rows.find(r => r.id.split('>')[0] === step && (!target || r.id.endsWith(`>${target}`))) ?? null;
}
/** Where the gun's rounds are by the truth: { left (all the marine could get at), spares (magazines of its family with rounds in his hands and pouches), feet (at his feet) }. */
function roundsOf(s, gun) {
  const fams = MD.modelOf(gun.g)?.fams ?? [], pid = pidOf(s), fits = (id) => fams.includes(s.items[id]?.fam) && (s.items[id].n ?? 0) > 0;
  const spares = KIT.sparesOf(s, pid, null).filter(fits), feet = KIT.atFeetOf(s, pid).map(l => l.id).filter(fits);
  const left = (gun.g.chamber === 'live' ? 1 : 0) + (gun.g.mag ? s.items[gun.g.mag]?.n ?? 0 : 0) + [...spares, ...feet].reduce((a, id) => a + s.items[id].n, 0);
  return { left, spares: spares.length, feet: feet.length };
}
const shortB = (b) => (b ? `ch=${b.chamber} mag=${b.mag}${b.count !== null ? `:${b.count}` : ''} ${b.mode}${b.locked ? ' locked' : ''}${b.stoppage ? ` stop=${b.stoppage}` : ''}${b.hand ? ` hand=${b.hand.fam}:${b.hand.n ?? b.hand.feel ?? '?'}` : ''}` : '-');
const truthOf = (s, g) => { const m = g?.mag ? s.items[g.mag] : null; return g ? `ch=${g.chamber ?? '-'}${g.jam ? ` jam=${g.jam}` : ''}${g.locked ? ' locked' : ''} mag=${m ? `${m.fam}:${m.n}` : '-'} ${g.mode ?? 'safe'}` : '-'; };
const rowWord = (r) => (r ? `${r.id}${r.label ? ` "${r.label}"` : ''}${r.off ? ` [${r.off}]` : ''}` : null);
/** A magazine the marine believes empty (kit.js emptyOf's reading: counted 0, or felt empty; an unknown count is not). */
export const emptyB = (m) => KIT.believedN(m) === 0 || m?.belief?.feel === 'none';
/** The magazines in the marine's reach: in his hands and pouches (kit.js sparesOf), at his feet (atFeetOf). */
export const inReach = (s) => [...KIT.sparesOf(s, pidOf(s), null), ...KIT.atFeetOf(s, pidOf(s)).map(l => l.id)];
const actorOf = (s) => s.actors?.list?.find(a => a.who === pidOf(s)) ?? null;
const handsOf = (s) => (s.people[pidOf(s)]?.kit?.hands ?? []).map(id => (id ? `${s.items[id]?.type ?? '?'}:${id}` : '-')).join(',');
/** The marine's guns and hands, one string, truth and belief (N14's and N6's "something changed"). */
function gearOf(s) {
  const k = s.people[pidOf(s)]?.kit ?? {}, ids = [...new Set([k.worn?.sling, k.worn?.holster, ...(k.hands ?? [])].filter(id => id && s.items[id]?.type === 'gun'))];
  return `${ids.map(id => `${id}:${truthOf(s, s.items[id])}@${s.items[id].mag ?? '-'}/${shortB(FA.beliefOf(s, id))}`).join(';')}|${postureOf(s)}|${handsOf(s)}|${k.worn?.holster ?? '-'}|${s.stop?.gun ?? '-'}`;
}

/** The sub-steps that change the gun in the hand (sidearm.js: Rifle up's holster and up, Transition's draw, the rifle let hang). */
const GUN_CHANGES = new Set(['holster', 'up', 'draw:thigh', 'hang']);
/**
 * A row that seats the magazine in the hand into the gun in the hand: Seat itself, or a drill whose sub-steps seat with no reach
 * before, and no change of gun before the seat (Rifle up holsters the P-12 and seats the held magazine into the rifle: v0.0.18's
 * sweep read that as a seat into the P-12, n7-rifle-up, the net's own misreading).
 */
export const seatsHeld = (r) => {
  if (!r || r.off) return false;
  if (r.id === 'seat') return true;
  const subs = (r.subs ?? []).map(x => String(x.id)), i = subs.indexOf('seat');
  return i >= 0 && !subs.some(x => x.startsWith('reach')) && !subs.slice(0, i).some(x => GUN_CHANGES.has(x));
};
/** N7's judgement, pure (so its own test can show it bites): who would seat a held magazine that should not go in: ['Fix', 'T', 'the Seat row'] or []. */
export function seatsWrong({ live = [], fixRow = null, tRow = null, wrong = false, heldEmpty = false, fuller = false }) {
  if (!wrong && !(heldEmpty && fuller)) return [];
  return [seatsHeld(fixRow) ? 'Fix' : null, seatsHeld(tRow) ? 'T' : null, live.some(r => r.id === 'seat' && !r.off) ? 'the Seat row' : null].filter(Boolean);
}
/** The context every case of a pause carries (what the classifier and the evidence read). */
function contextOf(s, P, gun, b, dry) {
  const H = houseOf(s);
  return {
    atMs: s.clock.ms, leg: H?.cur ?? null, lane: onLane(s), cmd: s.armoury?.range?.cmd?.id ?? null, gun: gun.kind, model: gun.g?.model ?? null,
    posture: postureOf(s), dry, b: b ? { chamber: b.chamber, mag: b.mag, count: b.count, mode: b.mode, locked: b.locked, stoppage: b.stoppage, hand: b.hand ? { fam: b.hand.fam, n: b.hand.n, feel: b.hand.feel } : null } : null,
    belief: shortB(b), truth: truthOf(s, gun.g), sit: P.model.situation?.id ?? null,
    fix: rowWord(P.fix?.row), fixId: P.fix?.row?.id ?? null, fixOff: P.fix?.row?.off ?? null, fixStand: !!P.fix?.stand,
    line: P.line ? { id: P.line.id, variant: P.line.variant ?? null, act: P.line.act ?? null, text: String(P.line.text ?? '').slice(0, 80) } : null,
    fire: rowWord(P.rows.find(r => r.id === 'fire')), queue: s.stop?.queue?.length ? [...s.stop.queue] : null,
    ...roundsOf(s, gun), forced: [...dice.log],
  };
}

// ---- the checks at a pause ----

/** A press's evidence of a throw, one line (digits folded, so one cause is one case). */
const thrown = (e) => String(e?.message ?? e).split('\n')[0];
/**
 * N1 to N5, N7, N9, N10 and N12 to N14 at one pause of `game` (a settled copy: see settledAt): the cases found (empty when all
 * hold). scratch: the lane's spare games (scratchOf), for the presses on copies; recover false leaves N5, N12 and N14 out
 * (costly). A copy that throws under a press is N8's case, and the pause's other checks still run (each press in a try).
 */
export function checkPause(game, { recover = true, seen = null, scratch = scratchOf(game) } = {}) {
  const s = game.state, gun = gunInHand(s);
  if (!gun.g) return [];
  const P = panelOf(s), b = FA.beliefOf(s, gun.id), dry = dryOf(s, b, gun), on = onLane(s), out = [];
  const ctx = contextOf(s, P, gun, b, dry);
  const add = (inv, why, more = {}) => out.push({ inv, name: INVARIANTS[inv], why, ...ctx, ...more });
  const guard = (inv, fn) => { try { fn(); } catch (e) { const m = thrown(e); add('N8', `a press on a copy threw (${inv}): ${m.replace(/\d+/g, 'n').slice(0, 120)}`, { err: m.slice(0, 300), under: inv }); } };
  // N1: dry on the lane (slung too): Fix names a live row, or says honestly that nothing is left
  if (on && dry && !P.fixRow) {
    const honest = ctx.left === 0 && (P.fix?.row?.off === 'nothing offered now' || P.fix?.row?.off === 'no rounds');
    if (!honest) add('N1', P.fix?.row?.off === 'already so' ? `Nothing to fix over a ${dry === 'slung' ? 'rifle on its sling' : 'dry gun'}` : `Fix struck (${P.fix?.row?.off ?? 'none'}) with ${ctx.left} rounds left`);
  }
  // N2: T's act names a row offered and not struck
  const act = P.line?.act;
  if (typeof act === 'string' && act.startsWith('stop:') && act !== 'stop:enter' && !act.startsWith('stop:reflex:')) {
    const r = rowOfAct(P.rows, act);
    // (a row the panel does not list may still be T's to do (an aim at a named man: node has no frame, so the plain Aim row is
    // struck "nothing in the frame"): the act pressed on a copy, against a copy left alone, is the judge)
    if (!r || r.off) guard('N2', () => { if (!tDoes(game, P.line, scratch)) add('N2', r ? `T names a struck row: ${rowWord(r)}` : `T names a row not offered: ${act}`); });
  }
  // N3: no shot named over a dry gun
  if (on && dry && shotLine(P.line)) add('N3', `"${String(P.line.text ?? '').slice(0, 40)}" over a dry gun (${dry})`);
  // N4: the rifle on its sling: Fix or T names its way back
  if (on && dry === 'slung') {
    const fixUp = !!P.fixRow && UP_ROWS.has(P.fixRow.id), tUp = typeof act === 'string' && act.startsWith('stop:') && UP_ROWS.has(rowOfAct(P.rows, act)?.id);
    if (!fixUp && !tUp) add('N4', `slung: Fix ${P.fix?.row?.label ?? '-'}${P.fix?.row?.off ? ` [${P.fix.row.off}]` : ''}, T ${act ?? 'nothing'}`);
  }
  // N7: no seat of a held magazine of the wrong family, or believed empty with a fuller one in reach
  const hm = KIT.handMagOf(s, pidOf(s)), held = hm ? s.items[hm.id] : null;
  if (held) {
    const fams = MD.modelOf(gun.g)?.fams ?? [], wrong = !fams.includes(held.fam), heldEmpty = emptyB(held);
    const fuller = inReach(s).some(id => id !== hm.id && fams.includes(s.items[id]?.fam) && !emptyB(s.items[id]));
    const tRow = typeof act === 'string' && act.startsWith('stop:') ? rowOfAct(P.rows, act) : null;
    const by = seatsWrong({ live: P.live, fixRow: P.fixRow, tRow, wrong, heldEmpty, fuller });
    if (by.length) add('N7', `${by.join(', ')} would seat ${wrong ? `a ${held.fam} (not the ${gun.g.model}'s)` : 'a magazine believed empty, a fuller one in reach'}`, { held: `${held.fam}:${held.n}` });
  }
  // N9: off the lane, Fix never names Off safe
  const H = houseOf(s);
  if (!on && H && P.fixRow && /^selector:(semi|auto)$/.test(P.fixRow.id)) add('N9', `Fix "Off safe" under the tower's ${ctx.cmd ?? 'nothing'}${H.end ? ' (after the lane)' : ' (before GO)'}`);
  else if (!on && H?.end && P.fixRow && /^macro:reload:/.test(P.fixRow.id)) add('N9', `Fix "${P.fixRow.label}" under the tower's ${ctx.cmd ?? 'nothing'} (after the lane)`);
  // N10: no row for a part the gun has not got
  const M = MD.modelOf(gun.g);
  for (const r of P.live) {
    if (r.id === 'stow' && !gun.long) add('N10', `"${r.label}" offered for the ${M.short}`);
    if (r.id === 'port' && M.portCover === false) add('N10', `"${r.label}" offered for the ${M.short}, which has no port cover`);
  }
  // N13: dry on the lane with a man facing: T has an act
  // (nothing at all left to fire, and the panel saying so (N1's honest eye): no act is owed)
  const facing = on && dry && !(ctx.left === 0 && P.fix?.row?.off === 'nothing offered now') ? SA.threatFacing(s, pidOf(s)) : null;
  if (facing && !(typeof act === 'string' && act)) add('N13', `a man facing at ${facing.dM.toFixed(1)} m, the gun ${dry}, and T has no act (the DI ${P.line ? `"${String(P.line.text ?? '').slice(0, 40)}"` : 'silent'})`, { facing: facing.T.key });
  // (the memo keys: what the marine sees and the truth under it (two pauses alike to him may differ in the gun))
  const sees = `${gun.kind}|${ctx.belief}|${ctx.truth}|${ctx.posture}|${handsOf(s)}|${ctx.fixId}|${act ?? '-'}|${ctx.queue ?? '-'}`;
  // N14: over a dry gun, Fix pressed does something
  if (recover && on && dry && P.fixRow) guard('N14', () => {
    const key = `N14|${sees}`, memo = seen?.get(key), r = memo ?? fixDoes(game, P.fixRow, scratch);
    seen?.set(key, r);
    if (!r.ok && !memo) add('N14', `Fix "${P.fixRow.label ?? P.fixRow.id}" (${P.fixRow.id}) changed nothing${r.text ? `: "${r.text}"` : ''}`, { fixDid: r });
  });
  // N5 and N12: the honest recoveries, by Fix and by T, from a dry pause (memoised: the same state, the same answer)
  if (recover && on && dry && ctx.left > 0) {
    for (const [inv, first] of [['N5', 'fix'], ['N12', 't']]) guard(inv, () => {
      const key = `${inv}|${sees}`, memo = seen?.get(key), rc = memo ?? recoverFrom(game, scratch, { first });
      seen?.set(key, rc);
      if (!rc.ok && !memo) add(inv, `the recovery by ${first === 'fix' ? 'Fix' : 'T'} ${rc.why} after ${rc.path.join(' > ') || 'nothing'}`, { rc });
    });
  }
  return out;
}

/** The ticks a pause is given before it is read (houseBot's DEAD_TICKS: the DI's line has its ticks to come, as on the page). */
export const SETTLE_TICKS = HB.DEAD_TICKS ?? 3;
/** A lane's spare games (net games of the house, made once a seed and tier, each a save loaded into it as needed: 4 ms, where a new one is 14). */
const SPARE = new Map();
/** A spare net game of the house for seed and tier, by name k (made once a process: every use loads a save into it first). */
export function spare(seed, tier, k) {
  const at = `${seed}|${tier}`;
  if (!SPARE.has(at)) SPARE.set(at, {});
  return (SPARE.get(at)[k] ??= G.createGame({ scenario: 'test-shoothouse', seed, tier }));
}
export function scratchOf(game) {
  // (kept for the process by seed and tier, so lanes and fixtures share them)
  const s = game.state, seed = s.meta.seed, tier = houseOf(s)?.tier ?? 'private';
  return { get: (k) => spare(seed, tier, k) };
}
// (a copy: the save of `from` loaded into the spare game k)
function copyInto(scratch, k, from) { const c = scratch.get(k); c.load(typeof from === 'string' ? from : from.save()); return c; }
/**
 * The pause as the player reads it: the game's save in a spare game, SETTLE_TICKS ticks with no input (time stands still in
 * the mode; the line and the panel settle), or null when it is no longer a pause. The lane's bot may press on the pause's
 * first tick; the page's player never does, so the net reads what the page would show.
 */
export function settledAt(game, scratch, save = game.save()) {
  return withDice({ pass: true }, () => {
    const c = copyInto(scratch, 'pause', save);
    c.step(SETTLE_TICKS, {});
    return choosing(c.state) ? c : null;
  });
}
/** N2 at a reflex card (the stoppage's: Tap, rack / Look / Transition …): T's 'stop:reflex:<key>' names an answer offered and not struck. */
export function checkCard(game, scratch = scratchOf(game)) {
  const c = withDice({ pass: true }, () => { const k = copyInto(scratch, 'pause', game); k.step(SETTLE_TICKS, {}); return k; });
  const s = c.state, R = s.stop?.reflex;
  if (!R) return [];
  const line = IN.instinctNow(s).line, act = line?.act;
  if (typeof act !== 'string' || !act.startsWith('stop:reflex:')) return [];
  const key = act.slice(12), o = R.options.find(x => x.key === key);
  if (o && !o.off) return [];
  const gun = gunInHand(s), b = FA.beliefOf(s, gun.id);
  return [{ inv: 'N2', name: INVARIANTS.N2, why: o ? `T answers the card with a struck answer: ${key} [${o.off}]` : `T answers the card with one it does not offer: ${key}`,
    atMs: s.clock.ms, leg: houseOf(s)?.cur ?? null, gun: gun.kind, model: gun.g?.model ?? null, belief: shortB(b), truth: truthOf(s, gun.g), dry: dryOf(s, b, gun),
    line: { id: line.id, variant: line.variant ?? null, act, text: String(line.text ?? '').slice(0, 80) }, card: R.options.map(x => `${x.key}${x.off ? `[${x.off}]` : ''}`), forced: [...dice.log] }];
}
// (a save with the house's press counts left out (shoothouse.js houseInput counts every press, one that does nothing too))
const PRESS_KEYS = new Set(['presses', 'pressAbout', 'how']);
function doneOf(game) {
  const st = JSON.parse(game.save()), H = st.armoury?.range?.house;
  for (const L of [...(H?.rooms ?? []), ...(H?.hall ? [H.hall] : []), ...(H?.legs ?? [])]) if (L && typeof L === 'object') for (const k of PRESS_KEYS) delete L[k];
  return JSON.stringify(st);
}
// (whether T's act does anything: the act pressed on a copy, one tick, against a copy given no input (the hunt's tryPress),
// the press counts aside)
function tDoes(game, line, scratch) {
  return withDice({ pass: true }, () => {
    const j = game.save(), a = copyInto(scratch, 'ta', j), b = copyInto(scratch, 'tb', j);
    a.step(1, pressT(line)); b.step(1, {});
    return doneOf(a) !== doneOf(b);
  });
}
// (step a copy until the marine chooses again: 'choose' | 'reflex' | 'out' (out of the mode) | 'end' | 'timeout')
function settle(c, maxTicks = 1200) {
  for (let t = 0; t < maxTicks; t++) {
    const s = c.state;
    if (s.armoury?.range?.end) return 'end';
    if (s.stop?.reflex && !s.skip) return 'reflex';
    if (choosing(s)) return 'choose';
    if (!s.stop && t > 0) return 'out';
    c.step(1, {});
  }
  return 'timeout';
}
/** A gun that fires but for its selector (firearms.js ready() read with the selector off safe). */
export const firesOf = (g) => !!g && FA.ready({ ...g, mode: 'semi' });
// (a row pressed as the panel's key presses it)
const pressRow = (r) => ({ act: [{ act: 'stop', args: { step: r.id, tempo: 'normal', ...(r.target ? { target: r.target } : {}) } }] });
const pressT = (line) => ({ act: [{ act: 'instinct', args: { id: line.id, act: line.act } }] });
/**
 * N14 on a copy (every roll passed): Fix's row pressed, the doing let run until the marine chooses again, and the gear
 * (gearOf: his guns' truth and belief, posture, hands) compared with before. A card or the card's end counts as something
 * done. Returns { ok, how, text } (text: the last words the press left in the J, for the evidence).
 */
export function fixDoes(game, row, scratch = scratchOf(game)) {
  return withDice({ pass: true }, () => {
    const c = copyInto(scratch, 'fx', game), before = gearOf(c.state), n0 = c.state.log?.length ?? 0;
    c.step(1, pressRow(row)); c.step(1, {});
    const how = settle(c);
    if (how === 'reflex' || how === 'end') return { ok: true, how };
    const said = (c.state.log ?? []).slice(n0).filter(e => typeof e?.text === 'string').map(e => e.text);
    return { ok: gearOf(c.state) !== before, how, text: said.length ? said[said.length - 1].slice(0, 80) : null };
  });
}
/**
 * N5's and N12's honest recovery on a copy (every roll passed): at each pause, ready (the truth's ready() and not dry by the
 * belief) ends it well; else, first 'fix': Fix if live, else T's act as the page sends it; first 't': T's act, else Fix;
 * else nothing (a fail). A reflex card: T's answer, else the card's first answer not "Nothing"; out of the mode, G (twice
 * running, a fail). The lane ended (the tower's STOP) ends it well: the fight is over.
 * Returns { ok, why, path, at } (at: where it stuck, for the evidence and the allow-list's signatures).
 */
export function recoverFrom(game, scratch = scratchOf(game), { first = 'fix' } = {}) {
  return withDice({ pass: true }, () => {
    const c = copyInto(scratch, 'rc', game), t0 = c.state.clock.ms, path = [], been = new Set();
    for (let i = 0; i <= RECOVER_N; i++) {
      const r = settle(c);
      const s = c.state;
      if (r === 'end') return { ok: false, why: 'reached the card', path };
      if (r === 'timeout') return { ok: false, why: 'never paused again', path };
      if (s.clock.ms - t0 > RECOVER_MS) return { ok: false, why: `ran past ${RECOVER_MS / 1000} s`, path };
      // (the lane over (the last room cleared, the tower's STOP): the fight is done, and no dead end is left in it)
      if (!onLane(s) && houseOf(s)?.end) return { ok: true, why: 'the lane ended', path };
      if (r === 'out') { if (path[path.length - 1] === 'G') return { ok: false, why: 'G does not bring the mode back', path }; path.push('G'); c.step(1, { act: ['ready'] }); continue; }
      if (r === 'reflex') {
        const line = IN.instinctNow(s).line, opts = s.stop.reflex.options.filter(o => !o.off);
        const tk = line?.act?.startsWith?.('stop:reflex:') ? line.act.slice(12) : null;
        const o = opts.find(x => x.key === tk) ?? opts.find(x => x.key !== 'none') ?? opts[0];
        if (!o) return { ok: false, why: 'a card with no answer', path };
        path.push(`card:${o.key}`); c.step(1, { act: [{ act: "stop", args: { step: `reflex:${o.key}`, tempo: "normal" } }] });
        continue;
      }
      c.step(SETTLE_TICKS, {});
      if (!choosing(s)) continue;
      const gun = gunInHand(s), b = FA.beliefOf(s, gun.id), dry = dryOf(s, b, gun);
      // (a gun that fires: ready by the truth but for the selector (on safe is a choice, and Off safe one press: a T that
      // leads on with a loaded rifle on safe is no dead end), and nothing in the belief that stops a press (an unknown
      // chamber that is live fires))
      if (firesOf(gun.g) && (!dry || dry === 'chamber-unknown')) return { ok: true, why: 'fires', path };
      const P = panelOf(s), sig = `${gun.kind}|${shortB(b)}|${postureOf(s)}|${truthOf(s, gun.g)}|${P.fixRow?.id ?? '-'}|${P.line?.act ?? '-'}`;
      const at = { dry, belief: shortB(b), truth: truthOf(s, gun.g), fix: P.fixRow?.id ?? null, act: P.line?.act ?? null };
      if (i === RECOVER_N) return { ok: false, why: `not ready in ${RECOVER_N} presses`, path, at };
      if (been.has(sig)) return { ok: false, why: 'looped', path, at };
      been.add(sig);
      const act = P.line?.act, byT = !!act && (first === 't' || !P.fixRow);
      if (byT) { path.push(`T:${act}`); c.step(1, pressT(P.line)); continue; }
      if (P.fixRow) { path.push(`Fix:${P.fixRow.id}`); c.step(1, pressRow(P.fixRow)); continue; }
      return { ok: false, why: 'nothing to press (no Fix, no T)', path, at };
    }
    return { ok: false, why: 'bound', path };
  });
}

/**
 * N7 done, at a tick: the magazine of each of the marine's guns against `before` (the last tick's { gun id: magazine id }), a
 * case for each newly seated one of another family, or believed empty while one of its family not believed empty is in reach
 * (a reach's seat too: kit.js sparesOf and atFeetOf, as N7's offered check reads them). Returns { cases, mags } (mags: now's).
 */
export function seatsDone(s, before) {
  const pid = pidOf(s), k = s.people[pid].kit, cases = [];
  const guns = [k.worn?.sling, k.worn?.holster, ...(k.hands ?? [])].filter(id => id && s.items[id]?.type === 'gun');
  const mags = Object.fromEntries(guns.map(id => [id, s.items[id].mag ?? null]));
  for (const id of guns) if (mags[id] && before && before[id] !== mags[id]) {
    const fams = MD.modelOf(s.items[id])?.fams ?? [], m = s.items[mags[id]], short = MD.modelOf(s.items[id]).short;
    const at = { inv: 'N7', name: INVARIANTS.N7, atMs: s.clock.ms, gun: id === k.worn?.sling ? 'rifle' : 'pistol', model: s.items[id].model, truth: truthOf(s, s.items[id]), seated: true };
    if (m && !fams.includes(m.fam)) cases.push({ ...at, why: `a ${m.fam} seated in the ${short}` });
    else if (m && emptyB(m)) {
      const fuller = inReach(s).filter(x => x !== mags[id] && fams.includes(s.items[x]?.fam) && !emptyB(s.items[x]));
      if (fuller.length) cases.push({ ...at, why: `a magazine believed empty seated in the ${short}, ${fuller.length} not believed empty in reach`, held: `${m.fam}:${m.n}` });
    }
  }
  return { cases, mags };
}

// ---- the lane ----

/** The bot of a lane (see the header). */
export function botOf(bot, { tier, seed }) {
  if (bot === 'honest') return HB.houseHonestBot();
  if (bot === 'fuzz') return HB.houseFuzzBot({ seed });
  return HB.houseBot({ mode: tier === 'recruit' || tier === 'private' ? 'keys' : 'T' });
}
/** A lane's key: tier/setup/seed/bot@rate. */
export const laneKey = (L) => `${L.tier}/${L.setup ?? 'brief'}/${L.seed}/${L.bot}${L.draw === 'drawn' ? '/drawn' : ''}@${L.rate ?? RATE}`;

/**
 * Play one lane with fumbles forced, every pause checked (see the header). from: { save, n } plays the lane's tail from a save
 * of it (a fixture: the dice's count n at the save, so the lane's own fumbles come again), its first pause checked before any
 * tick, no N8 for a card not reached. snap: each case carries `snap` { save, n, atMs }, the lane's last pause at or before it
 * (for a case of a pause, that pause; for a case of a tick, the pause before), from which a fixture replays it.
 */
export function runLane({ tier = 'private', setup = null, seed = 48213, bot = 'house', rate = RATE, twoRate = TWO_RATE, grades = GRADES, maxMs = LANE_MAX_MS, until = null, recover = true, keep = false, from = null, snap = false, draw = null } = {}) {
  const lane = { tier, setup, seed, bot, rate, ...(draw === 'drawn' ? { draw } : {}) };
  const cases = [], seen = new Map(), once = new Set(), key = laneKey(lane);
  let mark = null;
  const add = (c) => { const k = `${c.inv}|${c.why}|${c.belief ?? ''}`; if (once.has(k)) return; once.add(k); cases.push({ ...c, lane: key, ...(snap && mark ? { snap: mark } : {}) }); if (until?.(c)) stop = true; };
  dice.plan = { rate, twoRate, grades, seed: `${key}` }; dice.n = from?.n ?? 0; dice.forced = 0; dice.log = [];
  let game = null, err = null, ticks = 0, pauses = 0, lastPause = null, lastCard = null, wasGo = null, mags = null, stop = false, still = null;
  const n8 = (why, e, s) => { const m = thrown(e); add({ inv: 'N8', name: INVARIANTS.N8, why: `${why}: ${m.replace(/\d+/g, 'n').slice(0, 120)}`, err: m.slice(0, 300), atMs: s?.clock?.ms ?? null, forced: [...dice.log] }); };
  try {
    if (from) {
      const st = JSON.parse(from.save);
      game = spare(st.meta.seed, st.armoury?.range?.house?.tier ?? tier, 'lane');
      game.load(from.save);
    } else game = G.createGame({ scenario: 'test-shoothouse', seed, tier, setup, ...(draw === 'drawn' ? { draw } : {}) });
    dice.pid = game.state.player.id;
    const scratch = scratchOf(game), b = botOf(bot, lane), s0 = game.state.clock.ms, pid = dice.pid, words = wordsWatch(pid);
    words.tick(game.state);
    if (snap) mark = { save: game.save(), n: dice.n, atMs: s0 };
    wasGo = houseOf(game.state)?.goAtMs ?? null;
    // (the checks of the state as it stands: a reflex card's, a pause's; once each)
    const look = (s) => {
      if (s.stop?.reflex && !s.skip && lastCard !== s.clock.ms) {
        lastCard = s.clock.ms;
        try { for (const c of checkCard(game, scratch)) add(c); } catch (e) { n8("a card's copy threw", e, s); }
      }
      if (choosing(s) && lastPause !== s.clock.ms) {
        lastPause = s.clock.ms; pauses++;
        const save = game.save();
        if (snap) mark = { save, n: dice.n, atMs: s.clock.ms };
        // (read on a settled copy; a press on a copy that throws is N8's, the pause's other checks and the lane going on)
        let found = [];
        try { const c = settledAt(game, scratch, save); if (c) found = checkPause(c, { recover, seen, scratch }); } catch (e) { n8('a pause\'s copy threw', e, s); }
        for (const c of found) add(c);
      }
    };
    look(game.state);
    while (!game.state.armoury?.range?.end && game.state.clock.ms - s0 < maxMs && !stop) {
      game.step(1, b);
      ticks++;
      const s = game.state, H = houseOf(s);
      // N11: at GO, every gun carried in Condition 1 by the truth
      if (H && wasGo === null && H.goAtMs !== null) {
        wasGo = H.goAtMs;
        const k = s.people[pid].kit;
        for (const id of [k.worn?.sling, k.worn?.holster, SA.drawn(s, pid)].filter(Boolean)) {
          const g = s.items[id];
          if (!(g.mag && g.chamber === 'live' && !g.locked && !g.jam)) add({ inv: 'N11', name: INVARIANTS.N11, why: `the ${MD.modelOf(g).short} at GO: ${truthOf(s, g)}`, atMs: s.clock.ms, gun: id === k.worn?.sling ? 'rifle' : 'pistol', model: g.model, truth: truthOf(s, g), belief: shortB(FA.beliefOf(s, id)), forced: [...dice.log] });
        }
      }
      // N7 (done): a gun's magazine never changes to one of another family, nor to one believed empty with a fuller one in reach
      const seated = seatsDone(s, mags);
      for (const c of seated.cases) add({ ...c, leg: H?.cur ?? null, forced: [...dice.log] });
      mags = seated.mags;
      // N6: a beat held by a body past PIN_MS; and (no field of the doing read) a doing with nothing changing for PIN_MS
      const d = s.stop?.doing;
      for (const bt of d?.beats ?? []) if ((bt.held ?? 0) >= PIN_MS) add({ inv: 'N6', name: INVARIANTS.N6, why: `${String(d.step ?? '').split('>')[0]} held ${PIN_MS / 1000} s by a body`, atMs: s.clock.ms, leg: H?.cur ?? null, step: d.step, setup, forced: [...dice.log] });
      if (d && d.who === pid && d.kind !== 'wait' && s.stop.phase !== 'choose' && onLane(s)) {
        const me = actorOf(s), pose = `${d.step}|${H?.cur ?? '-'}|${me ? `${me.x.toFixed(2)},${me.z.toFixed(2)},${me.face},${(me.headRad ?? 0).toFixed(2)},${me.moveStance ?? ''}` : '-'}|${gearOf(s)}`;
        if (still?.pose !== pose) still = { pose, fromMs: s.clock.ms };
        else if (s.clock.ms - still.fromMs >= STILL_MS) add({ inv: 'N6', name: INVARIANTS.N6, why: `${String(d.step ?? '').split('>')[0]} went ${STILL_MS / 1000} s with nothing changing (the marine, his gear, the leg)`, still: true, atMs: s.clock.ms, leg: H?.cur ?? null, step: d.step, setup, forced: [...dice.log] });
      } else still = null;
      // N15: the words of a place against the truth, once their sub-step has ended
      for (const c of words.tick(s)) add({ ...c, leg: H?.cur ?? null });
      look(s);
      game.clearFacts?.();
    }
    for (const c of words.end(game.state)) add({ ...c, leg: houseOf(game.state)?.cur ?? null });
  } catch (e) {
    err = thrown(e).slice(0, 300);
    n8('a tick threw', e, game?.state);
  }
  const done = !!game?.state?.armoury?.range?.end;
  if (!done && !err && !stop && !from) add({ inv: 'N8', name: INVARIANTS.N8, why: `no card in ${maxMs / 60_000} min`, atMs: game?.state?.clock?.ms ?? null, forced: [...dice.log] });
  const out = { key, lane, cases, done, ms: game ? game.state.clock.ms : 0, ticks, pauses, forced: dice.forced, rolls: dice.n, err, ...(keep ? { game } : {}) };
  dice.plan = null;
  return out;
}

// ---- N15: the words against the truth (see the header) ----

/** The J's words of a place (N15): [the words' end, the place they say, the step they must come from (or any)]. */
export const PLACE_WORDS = Object.freeze([
  [/ holstered\.$/, 'holster', null], [/snags in the holster: it stays in\.$/, 'holster', null], [/misses the holster: still in your hand\.$/, 'hand', null],
  [/ out\.$/, 'hand', new Set(['draw', 'draw:thigh'])], [/(swings|hangs) on its sling\.$/, 'sling', null], [/you catch it\.$/, 'not the floor', null],
  [/slips out of your fingers and falls\.$/, 'at your feet', null],
]);
// (where a gun of the marine's is: in a hand, the holster, on the sling, or none of them)
const placeOf = (s, pid, id) => { const k = s.people?.[pid]?.kit; return (k?.hands ?? []).includes(id) ? 'hand' : k?.worn?.holster === id ? 'holster' : k?.worn?.sling === id ? 'sling' : 'elsewhere'; };
/**
 * N15's watch of a lane (see the header): tick(state) after every tick and end(state) at the lane's end each return the cases found:
 * each new J entry of the marine's with words of a place is held until the sub-step that said it has ended (the doing gone, another,
 * or past that sub-step), then checked against where its gun (or a magazine) is; a later entry of the same gun's stands in for it.
 */
export function wordsWatch(pid) {
  let seq = null;
  const pending = [];
  const check = (s, w) => {
    const at = w.place === 'at your feet' ? (KIT.atFeetOf(s, pid).length ? 'at your feet' : 'not at your feet') : placeOf(s, pid, w.gun);
    const ok = w.place === 'not the floor' ? at !== 'elsewhere' : at === w.place;
    return ok ? null : { inv: 'N15', name: INVARIANTS.N15, why: `"${w.text}" but ${w.place === 'at your feet' ? 'no magazine is at your feet' : `the ${w.model} is ${at === 'elsewhere' ? 'on none of you' : `in the ${at}`}`}`, atMs: w.atMs, saidAtMs: w.atMs, gun: w.model, step: w.step, forced: [...dice.log] };
  };
  const due = (s, w) => { const d = s.stop?.doing; return !w.doing || !d || d.who !== pid || d.fromMs !== w.doing.fromMs || d.step !== w.doing.step || (d.i ?? 0) > w.doing.i; };
  return {
    tick(s) {
      const log = s.log ?? [], out = [];
      if (seq === null) { seq = log.length ? log[log.length - 1].seq : 0; return out; }
      let k = log.length;
      while (k > 0 && log[k - 1].seq > seq) k--;
      for (const e of log.slice(k)) {
        seq = e.seq;
        if (e.who !== pid || typeof e.text !== 'string' || e.hidden) continue;
        const m = PLACE_WORDS.find(([re, , steps]) => re.test(e.text) && (!steps || steps.has(e.step)));
        if (!m || (!e.gun && m[1] !== 'at your feet')) continue;
        // (a later word of the same gun's stands in for one not yet due)
        for (let i = pending.length - 1; i >= 0; i--) if (pending[i].gun === e.gun && m[1] !== 'at your feet') pending.splice(i, 1);
        // (held to its sub-step's end only in a list step (sidearmEnd moves the pistol there); a bundle's beat, or a magazine's fall, is
        // checked at its own tick: doAction moves what it moves at once, and the marine walks on in the beats after)
        const d = s.stop?.doing, list = !!d && d.who === pid && !d.beats && m[1] !== 'at your feet';
        pending.push({ gun: e.gun, model: MD.modelOf(s.items[e.gun])?.short ?? 'gun', place: m[1], text: e.text, step: e.step ?? null, atMs: e.atMs, doing: list ? { fromMs: d.fromMs, step: d.step, i: d.i ?? 0 } : null });
      }
      for (let i = 0; i < pending.length;) {
        if (!due(s, pending[i])) { i++; continue; }
        const c = check(s, pending.splice(i, 1)[0]);
        if (c) out.push(c);
      }
      return out;
    },
    // (at the lane's end only the words whose sub-step has ended: a fixture's tail cut at its maxMs inside a sub-step (v0.0.21's
    // integration: pin-v018/recruit/room:3/1's slow holster, "P-12 holstered." said at its start, 2.6 s of it left at the cut) is
    // not yet held to its words, as on any tick before its end)
    end(s) { const out = pending.splice(0).filter(w => due(s, w)).map(w => check(s, w)).filter(Boolean); return out; },
  };
}

/** The lanes of a sweep: every tier × every setup × the bots, over seeds (deterministic). */
export function lanesOf({ seeds, tiers = TIERS, setups = SETUPS, bots = BOTS, rate = RATE, draw = null } = {}) {
  const out = [];
  for (const seed of seeds) for (const tier of tiers) for (const setup of setups) for (const bot of bots) out.push({ tier, setup, seed, bot, rate, ...(draw === 'drawn' ? { draw } : {}) });
  return out;
}

// ---- the fixtures ----

/** The fixtures' file: { made, fixtures: [{ id, entry, from, lane, n, maxMs, save }] }, brotli (the saves share most of their text). */
export const FIXTURES_FILE = new URL('../fumble-fixtures.json.br', import.meta.url);
/** The fixtures (empty when the file is missing). */
export function readFixtures(file = FIXTURES_FILE) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(zlib.brotliDecompressSync(fs.readFileSync(file)).toString('utf8')).fixtures;
}
/** Write the fixtures (a tool's, not a test's). */
export function writeFixtures(fixtures, file = FIXTURES_FILE) {
  const text = JSON.stringify({ made: 'v0.0.17, the fumble net', fixtures });
  fs.writeFileSync(file, zlib.brotliCompressSync(text, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_LGWIN]: 24, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: text.length } }));
}
/**
 * A fixture played as a lane's tail: its save loaded, its pause checked, then (maxMs > 0) its lane's bot and dice run on for
 * maxMs with every check (runLane's from). until(case) ends it early. Returns runLane's record, its cases' lane the fixture's id.
 */
export function replayFixture(fx, { until = null } = {}) {
  const r = runLane({ ...fx.lane, from: { save: fx.save, n: fx.n ?? 0 }, maxMs: fx.maxMs ?? 0, until });
  for (const c of r.cases) c.lane = `fixture ${fx.id}`;
  return r;
}

/**
 * Classify cases against an allow-list ([{ id, findings, inv (an id or a list), match(case) }]): { known: Map(entry → cases), unknown: [case] }.
 * A case is known when an entry of its invariant matches it (the first, in the list's order).
 */
export function classify(cases, known) {
  const hits = new Map(known.map(e => [e, []])), unknown = [];
  for (const c of cases) {
    const e = known.find(k => [].concat(k.inv).includes(c.inv) && k.match(c));
    if (e) hits.get(e).push(c); else unknown.push(c);
  }
  return { hits, unknown };
}
/** A case in one line, its evidence (for a failure's message and the printout). */
export const caseLine = (c) => `${c.inv} ${c.name}: ${c.why} | ${c.lane ?? ''} at ${c.atMs ?? '-'} ms, leg ${c.leg ?? '-'}, ${c.gun ?? '-'} ${c.belief ?? ''} (truth ${c.truth ?? '-'}), ${c.posture ?? ''}; Fix ${c.fix ?? '-'}; line ${c.line ? `${c.line.id}:${c.line.variant ?? ''} act ${c.line.act ?? '-'} "${c.line.text}"` : '-'}${c.rc ? `; recovery ${c.rc.path.join(' > ')}` : ''}${c.forced?.length ? `; forced ${c.forced.slice(-4).join(',')}` : ''}`;
