// Saves from v0.0.3 load in this build (the build sheet 0.0.4 §3's upgradeState, additive, SAVE_SCHEMA
// still 1): two real v0.0.3 saves, made by v0.0.3's own code from a worktree at its tag (the barracks,
// seed 48213, at 21:30, a few steps from the rack's foot; and the same inside R's 15-minute wait, five
// minutes in), kept gzipped in tests/saves/. Loaded, each gets BODY's record at v 2 with the player's
// ledgers as the start body at the save's clock (flag mig:body-v2), tonight's taps and reveille
// posted (mig:time-pod), and runs on with no error; the wait saved mid-skip finishes with the mask it
// was saved with (D); and a save made after the load carries on byte for byte.
// 0.0.5 (the build sheet §3, §8 item 30): no upgrade for a v0.0.4 save. Two made by v0.0.4's own code
// from a worktree at its tag (the barracks, seed 48213, at 13:00 after a minute's walk; and at 13:30
// saved while G's 'ready' held time) load as they are, carry on 3,000 ticks, and save and load equal;
// the 'ready' save's digit lets time go, as v0.0.4's did.
// 0.0.6 (the build sheet §3.2): two saves made by v0.0.5's own code from a worktree at its tag, each inside
// an activity this round splits or drops (the barracks, seed 48213: at 19:32 inside the basin bundle's shave
// part, and at 21:57 inside sleep's turn-in into PT kit, R pressed at the rack in utilities). Loaded, the
// people's cuts are mapped (people:cuts: v0.0.4's bald men shaved), the body's new groups read the template's
// (nothing written), and each legacy activity finishes as v0.0.5 finished it (its end, parts, line and
// outfit, taken from v0.0.5's own run of the same save); 3,000 ticks with no error, a save after carried on
// byte for byte. The v0.0.3 and v0.0.4 saves pass their own upgrades, then people:cuts.
// 0.0.7 (the build sheet 0.0.7 §3.2, §5.2, §8 item 14): two saves made by v0.0.6's own code from a worktree at its
// tag (the barracks, seed 48213, at 19:00 after a minute's walk; test-handling setup=hot after two shots). Nothing
// is written on load: each saves again at once byte for byte, every body reads unhurt (the parts at 0, the blood
// at 100 %, no injury, no anchor), each plays 600 ticks with no error, and a save after carries on byte for byte.
// 0.0.8 (the build sheet 0.0.8 §3.2, §3.3): two saves made by v0.0.7's own code from a worktree at its tag (test-range
// setup=confirm after the bot's first shot, in stop motion; test-handling setup=hot after two shots). Nothing is written
// on load (no mind.contact, no drills on the sheet: their defaults read): each saves again at once byte for byte, X lets
// time run, 600 ticks with no error and no contact made (no turners), and a save after carries on byte for byte.
// 0.0.9 (the build sheet 0.0.9 §3.2): two saves made by v0.0.8's own code from a worktree at its tag (test-pairs, the
// private on setup=standby at string 0's pause; the tier one inside the lull's Top up). Nothing is written on load (no
// combat block: calm, felt 0, timeK 1; no inoculation on the sheet: the rank's tier's read; no setup: the calm course):
// each saves again at once byte for byte, plays 600 ticks by the pairs bot with no error and no combat block made, and a
// save after carries on byte for byte.
// 0.0.10 (the build sheet 0.0.10 §3.2): two saves made by v0.0.9's own code from a worktree at its tag ("Three bangs", the
// boot recruit at the banged string's pause with the pool up; calm test-pairs, the private, setup=standby:1). Nothing is
// written on load (no Breathe window: none; no stressAtMs: the fold from suppAtMs, so the banged save gains its stress at
// its first fold, honestly; no R.stress: test-pairs): each saves again at once byte for byte, plays 600 ticks by the pairs
// bot with no error (the calm one with no combat block made), the banged recruit's body taking the chaos's stress, and a
// save after carries on byte for byte.
// 0.0.12 (the build sheet 0.0.12 §3.2): two saves made by v0.0.11's own code from a worktree at its tag (the barracks at
// 13:00; test-pairs at a contact's pause with a step under way, the stepper's extraction's riskiest case: v0.0.5's step
// machinery moved out of shooting.js into src/sim/combat/stepper.js). Nothing is written on load (no moveStance, no watch,
// no drills on the sheet: their defaults read): each saves again at once byte for byte, plays 600 ticks with no error (the
// pairs one by the pairs bot), and a save after carries on byte for byte.
// The shoot house's rework, R1 (2026-11-12): one save made by v0.0.13's own code from a worktree at its tag (test-shoothouse,
// the tier one by T at a contact's pause in room 2, a bundle carried). Nothing is written on load (no fullN on the gun's
// belief: Top up's "half or less" reads the capacity's half, as v0.0.13 did, until the next magazine is seated; the plans'
// walkable lanes are data, and a move beat under way keeps the path it was planned on): it saves again at once byte for
// byte, plays 600 ticks by the honest T bot with no error, and a save after carries on byte for byte. From 2026-11-15 the
// house issues the P-12 on every sheet (the user: "everyone should have the same loadout"), so this tier one's save of
// v0.0.13, made before the R6 sidearm, gains it on load too (shoothouse.js upgradeHousePistol): the mapping and the P-12.
// 0.0.17 (the user, 2026-11-15): one save made by v0.0.15's own code from a worktree at its tag (test-shoothouse, the private
// by the keys at a contact's pause in room 2, seed 48213, no sidearm: the house issued it from the Sergeant up). On load the
// P-12 is issued (upgradeHousePistol) in Condition 1 on safe in the holster, as MAKE READY would have left it, its spare in the
// thigh's pouch, its four ids the save's next and every item held once; nothing else is written; it saves again and loads to
// the same bytes, plays 600 ticks by the keys with no error, and a save after carries on byte for byte. The upgrade's other
// conditions (Condition 3 before MAKE READY, Condition 4 after the rifle's UNLOAD) are pinned on a fresh lane's saves with
// the P-12 taken out, as a v0.0.15 save of those moments would be.
// 0.0.18 (the build sheet 0.0.18 §1 and §3.2): two saves made by v0.0.17's own code in the main tree at its tag, before any
// of the round's merges: test-shoothouse, the sergeant by T on seed 1489397426 at the first contact's pause after Transition:
// pistol, the P-12 in the hand and the R-7 hanging on its click (believed live, 5 of 10, a stoppage felt); and test-pairs, the
// private on setup=standby at the armed standby's pause. Nothing is written on load (no stop.queueOf: the queue runs as saved;
// no loadout: 'standard'; no shot rows, bursts or daze): each saves again at once byte for byte, plays 600 ticks with no
// error (by the bots that made them, the honest T bot and the pairs bot), and a save made after carries on byte for byte; the house lane then reaches its card.
// 0.0.19 (the build sheet 0.0.19 §2 step 7): two saves made by the code of the integrated tree of v0.0.18 before its tag (the
// round's snapshot, .run/v019/v018-snapshot.tree; re-made from v0.0.18's tag at the integration if its save format moved), from
// the fill, meta.version '0.0.18': test-shoothouse on the 'flash' loadout, the corporal by the kit's honest bot on 48213 at
// tick 481, the G-11 armed in his hand on room 1's stack, the door open, in stop motion; and on the standard loadout the tier one
// by the stoppage bot (Gun down) on seed 11050 at tick 636, mid-room 2, the #2 down on his own stoppage (IMMEDIATE ACTION, its
// tap under way) while he covered you (no honest lane of 400, four sheets on 100 seeds, puts him on a stoppage in room 2: both
// its stands, 2a and 2b, are yours, so he fires in it only covering you; 1 lane of 1,151 tier one Gun-down lanes did).
// Nothing is written on load: each saves again at once byte for byte, its ids whole (ids-check), plays 600 ticks with no error by
// the bot that made it, a save made after carries on byte for byte, and the lane reaches its card.
// 0.0.20 (the build sheet 0.0.20 §3 step 4): two saves made by the code of the integrated tree of v0.0.19 before its tag (the
// round's snapshot, .run/v020/v019-snapshot.tree) on seed 48213, meta.version '0.0.19': the private by the keys from the fill on
// the standard loadout between LOAD and MAKE READY, in stop motion at its choice (the magazine seated, the chamber empty: the
// cold Fix and the PA's wait load over it); and the corporal from setup room:3, placed as two-side places him (past the threshold
// on his #2's point) and run on until the #2 has taken his side, mid-room 3 with the sides swapped and the #2 standing at his
// walk's end on your point (the far leg, the mark and the call-out load over it). Neither carries the #2's P-12: nothing is
// written on load, each saves again at once byte for byte, its ids whole, plays 600 ticks with no error (the keys bot that made
// the first; the honest bot reading whose man a stand is, houseOwnerBot, for the second), a save made after carries on byte for
// byte, and the lane reaches its card.
// 0.0.20 (v0.0.20's asks, the design sheet §2.8, §2.10 test 4): a save made by v0.0.19's own code from a worktree at its tag,
// meta.version '0.0.19': "Stack and clear, live" (&opfor=live), the sergeant by the honest bot on 48213, saved on the tick the
// first marking round struck you (room 2's role-player's pair, its second round 350 ms on). Loaded, its lane gains the would-have's
// ledger with the rule 'count' (the upgrade 'arms:house-would': its strikes have no margin or range saved to rate them by), nothing
// else written; it ends 'casualty' at v0.0.19's tick (21.05 s, on the pair's second round, two torso) where v0.0.20's rule would
// have rated both wounds, its card v0.0.19's words; a save made after carries on byte for byte.
// 0.0.21 (the build sheet v0.0.21 §1 item 25, §0 item 17; perf lens P10): a house save from before v0.0.20's pars (v0.0.12 to
// v0.0.19, and v0.0.20's Stop save played on from a v0.0.17 one) gains them on load (shoothouse.js upgradeHousePars, the arms
// domain's 'arms:house-pars'): the cases above compare a save less those keys (lessPars) and print what was written. The par
// case: the v0.0.19 corporal mid-room 3 loaded, its pars those a fresh fill of the same sheet, seed and setup writes, and not one
// room's par planned after the load (PAR_PLANS) over 100 ticks of reads (the timer, houseNow, the paper, the verdict) by the bot.
// v0.0.22 (its build sheet §2 step 7, a heavy case: game-upgrade is at its QUICK_SLOW ceiling): two saves made by v0.0.21's own
// code (a scratch worktree of the snapshot of its integrated tree; the maker .run/v022/lead-figures/scripts/make-saves.mjs), stamped
// 0.0.21: the private by the keys on 48213 at the first pause after your "Clear." at UNLOAD, SHOW CLEAR, your #2 still in his
// 'clear' macro (v0.0.22's FL22-1 loads over it: the instructor's look and the skip begin on load), and the sergeant by T on the live
// lane (live:fight,hide) on 48213 on the tick after the role-player's first strike on you, his second to come (FL22-2 loads over it:
// the strike said once, never twice). Each loads with nothing written, saves again byte for byte with every id valid, carries on
// byte for byte from a save made 300 ticks on, and reaches its card on the tick its lane from the fill does (house-pin's
// keys/private/48213 and house-live-pin's quick cell), the lane's end its own; v0.0.22's C adds the new rules' assertions here.
// v0.0.23's stage 0 (its build sheet §2 step 4): two saves made by v0.0.22's own code (the integrated snapshot, v0.0.22 untagged): the
// honest recruit standing 30 s at room 2's open door on 48213 with the instinct's walk-in line on ("Move. D and S, through the door.",
// the keys into the wall: FH-1), and the sergeant by T on the live lane (live:fight,hide) 10 s into the tower's brief, H.sterile absent
// (DC3). Each loads with nothing written, saves again byte for byte, carries on byte for byte from a save 300 ticks on, and reaches
// its card on its lane's tick from the fill (house-pin's honest/recruit/48213, house-live-pin's quick cell); v0.0.23's D adds the new
// rules' assertions (the room passed with passWhy 'door'; the sterile check begun, LOAD after it) and moves the ticks with the pins.
// v0.0.24's stage 0 (its build sheet §2 step 7, a heavy case: game-upgrade is at its QUICK_SLOW ceiling): two saves made by v0.0.23's
// own code (the integrated snapshot, tree efa558b2, v0.0.23 untagged; the maker .run/v024/lead-figures/scripts/make-saves.mjs),
// stamped 0.0.23: the private by the keys on 48213 at his first contact's pause in room 2 (stop motion at its choice, via 'contact',
// the pick 2a), and the bay at 23:00 (the barracks on 48213 at hour 23, 100 ticks on). Each loads with nothing written, saves again
// byte for byte with every id valid, and carries on byte for byte from a save made 300 ticks on; the room 2 save reaches its card on
// the tick the same lane played straight from GO does (the keys private on 48213 from setup 'go', played in the test beside it:
// 3702 on the snapshot, V023_GO_TICK; house-pin's cell starts at the fill, before the brief, so its 4502 is not this lane's). They are the anywhere round's held saves (F100): each
// merge, A to D, keeps them byte for byte; after E's the house save gains no T.atFirst until a round is fired after the load (E adds
// that assertion here).
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { assert, fmt, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { bodyOf } from '../src/sim/body/body.js';
import { stagesOf } from '../src/sim/body/cues.js';
import { BODY_V } from '../src/sim/body/record.js';
import { bloodAt, hasWounds, PART_KEYS } from '../src/sim/body/wounds.js';
import { rungOf } from '../src/sim/skills/templates.js';
import { feltOf, inocOf, hardOf, blockOf, suppAt } from '../src/sim/combat/supp.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { pairsBot } from './bots/pairs.mjs';
import { houseTBot, houseKeysBot, houseHonestBot, runHouse, stoppageBot } from './bots/house.mjs';
import { runSheetOf, houseNow, houseVerdict, PAR_PLANS } from '../src/sim/scenarios/shoothouse.js';
import { houseKitBot } from './bots/kit.mjs';
import { houseOwnerBot } from './bots/team.mjs';
import { handDeviceOf } from '../src/sim/arms/devices.js';
import { checkIds } from './ids-check.mjs';
import { conditionOf, gunField } from '../src/sim/arms/firearms.js';
import { marsClock } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';
import { houseBot } from './bots/house.mjs';
import { PIN } from './house-pin.test.mjs';
import { LIVE_PIN } from './house-live-pin.test.mjs';
import { resetCaches as resetHouses } from '../src/sim/scenes/assemble.js';
import { areaOf, resetCaches as resetRegistry } from '../src/sim/places/model.js';
import { HOUSE_CHIEF } from '../src/data/courses.js';
import { botOf } from './flawless.mjs';
import { instinctNow } from '../src/sim/skills/instinct.js';
// (v0.0.22's C: the two v0.0.21 saves' end ticks under v0.0.22's rules (see their case), recorded on C's tree)
const SAVE_TICKS = Object.freeze({ showclear: 4562, paint: 3362 });
/** v0.0.24's stage 0: the keys private on 48213 from setup 'go' to his card, the tick on v0.0.23's snapshot (the room 2 save's lane). */
const V023_GO_TICK = 3702;

const LON = SITES.melas.lonEDeg, MIN_TICKS = 20 * 60;
// (v0.0.21, the build sheet §1 item 25, §0 item 17: a house save from before v0.0.20's pars gains them on load, the stands' books,
// each leg's par, the lane's and the immediate action's book (shoothouse.js upgradeHousePars), so nothing plans a par on a read; a
// save's bytes are then compared less what that upgrade wrote where the old save lacked it, and what it wrote is printed)
const PAR_HOUSE = Object.freeze(['books', 'laneParMs', 'iaBookMs']);
function lessPars(o, old) {
  const H = o?.armoury?.range?.house, H0 = old?.armoury?.range?.house;
  if (!H || !H0) return o;
  for (const k of PAR_HOUSE) if (!(k in H0)) delete H[k];
  for (const [L, L0] of [...(H.rooms ?? []).map((L, i) => [L, H0.rooms?.[i]]), [H.hall, H0.hall]]) if (L && L0 && !('parMs' in L0)) delete L.parMs;
  return o;
}
/** A save's text less the pars written on load (see lessPars), as the old save's own form: equal to the old text where nothing else was written. */
const sansPars = (text, oldText) => JSON.stringify(lessPars(JSON.parse(text), JSON.parse(oldText)));
/** What the pars' upgrade wrote on a loaded state, in words: "pars written: 22000, 30500, 32500, 14500 (lane 99500), books 7, IA 1566". */
function parsWords(s, old) {
  const H = s.armoury.range.house, H0 = old.armoury.range.house;
  if (H0.laneParMs !== undefined && H0.books) return 'the pars as saved';
  return `pars written on load: ${[...H.rooms, H.hall].map(L => L.parMs).join(', ')} (lane ${H.laneParMs}), books ${Object.keys(H.books ?? {}).length}, IA ${H.iaBookMs ?? '-'}`;
}
const SAVES = Object.freeze(['v0.0.3-barracks-2130', 'v0.0.3-barracks-midwait']);
const read = (name) => gunzipSync(readFileSync(path.join(root, 'tests', 'saves', `${name}.json.gz`))).toString('utf8');
const hm = (ms) => { const c = marsClock(ms, LON); return c.timeslip ? `24:00 +${Math.floor(c.slipMs / 60_000)}` : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}`; };

export default [
  {
    name: 'a v0.0.3 save loads: every body at v 2, the player\'s filled in at the save\'s clock, tonight\'s taps and reveille posted; it runs on with no error, a wait saved inside its skip finishes under mask D, and a save made after carries on byte for byte',
    fn() {
      for (const name of SAVES) {
        const json = read(name), old = JSON.parse(json);
        assert(old.meta.version === '0.0.3' && !old.people[old.player.id].body.atMs, `${name}: not a v0.0.3 save (${old.meta.version})`);
        const g = createGame({ scenario: 'barracks', seed: 48213, version: '0.0.4' });
        const s = g.load(json), pid = s.player.id, b = bodyOf(s, pid);
        const vs = new Set(Object.values(s.people).map(p => p.body?.v));
        const kinds = s.events.filter(e => !e.dead).map(e => e.kind);
        const st = stagesOf(b, s.clock.ms, LON);
        const midSkip = !!s.skip, mask = s.skip?.mask ?? null;
        console.log(`      ${name}: saved at ${hm(old.clock.ms)}${midSkip ? `, inside a ${old.skip.activity} to ${hm(old.skip.toMs)}` : ''}; loaded: bodies v ${[...vs].join(', ')}, the player's from ${hm(b.atMs)} (bladder ${st.bladder.band}, fatigue ${st.fatigue.band}, hunger ${st.hunger.band}), flags ${Object.keys(s.flags).filter(k => k.startsWith('mig:')).join(', ')}; queued ${kinds.join(', ')}`);
        assert(vs.size === 1 && vs.has(BODY_V) && b.atMs === s.clock.ms && s.flags['mig:body-v2'] && s.flags['mig:time-pod'], JSON.stringify({ vs: [...vs], atMs: b.atMs, flags: s.flags }));
        assert(kinds.includes('taps') && kinds.includes('reveille') && kinds.includes('body'), `queued: ${kinds.join(', ')}`);
        if (midSkip) assert(mask === 'D', `the wait's mask: ${mask}`);
        g.step(2 * MIN_TICKS);
        assert(!g.state.skip, `${name}: still skipping after two minutes`);
        const mid = g.save();
        g.step(2 * MIN_TICKS, { mx: -1 });
        const end = g.save();
        const h = createGame({ scenario: 'barracks', seed: 48213, version: '0.0.4' });
        h.load(mid); h.step(2 * MIN_TICKS, { mx: -1 });
        console.log(`        ran on to ${hm(g.state.clock.ms)} with no error; saved there and loaded again: ${h.save() === end ? 'byte for byte' : 'DIFFERENT'}`);
        assert(!g.errors.length && h.save() === end, JSON.stringify({ errors: g.errors.slice(0, 3) }));
      }
    },
  },

  {
    name: 'a v0.0.4 save loads with no upgrade: both carry on 3,000 ticks with no error, a save made after carries on byte for byte, and the save made while G held time is let go by a digit',
    fn() {
      for (const name of ['v0.0.4-barracks-1300', 'v0.0.4-barracks-ready']) {
        const json = read(name), old = JSON.parse(json);
        assert(old.meta.version === '0.0.4' && old.stop === null && JSON.stringify(old.armoury) === JSON.stringify({ ammoIssues: [], guns: {} }), `${name}: not a v0.0.4 save (${old.meta.version})`);
        const g = createGame({ scenario: 'barracks', seed: 48213, version: '0.0.5' });
        const s = g.load(json);
        const held = s.clock.holds.join();
        const flags = Object.keys(s.flags ?? {}).filter(k => k.startsWith('mig:')).join(', ');
        let let0 = null;
        if (held === 'ready') {
          const t = s.clock.ms;
          g.step(20);
          const still = g.state.clock.ms === t;
          g.step(1, { act: ['digit:1'] });
          let0 = { still, after: g.state.clock.ms - t, holds: g.state.clock.holds.length, line: g.facts('line').at(-1)?.text };
          assert(still && let0.after === 50 && !let0.holds, JSON.stringify(let0));
        }
        g.step(1500, { mx: 1 });
        const mid = g.save();
        g.step(1500, { mz: -1 });
        const end = g.save();
        const h = createGame({ scenario: 'barracks', seed: 48213, version: '0.0.5' });
        h.load(mid); h.step(1500, { mz: -1 });
        console.log(`      ${name}: saved at ${hm(old.clock.ms)}, holds [${held}], mig flags [${flags}]${let0 ? `; 20 ticks held moved the clock ${let0.still ? 'not at all' : 'SOME'}, the digit let it go ("${let0.line}")` : ''}; 3,000 ticks on to ${hm(g.state.clock.ms)} with ${g.errors.length} errors; saved and loaded again: ${h.save() === end ? 'byte for byte' : 'DIFFERENT'}`);
        assert(!g.errors.length && !h.errors.length && h.save() === end, JSON.stringify({ errors: g.errors.slice(0, 3) }));
      }
    },
  },

  {
    name: 'a v0.0.5 save made inside the basin bundle or the sleep\'s turn-in loads: the cuts mapped (people:cuts), the bundle and the turn-in finishing as v0.0.5 finished them, 3,000 ticks with no error, a save after carried on byte for byte',
    fn() {
      // (v0.0.5's own continuation of each save, 3,000 ticks in the worktree at its tag, 2026-11-07)
      const V005 = {
        'v0.0.5-barracks-basin': { toMs: 23505458000, parts: ['teeth', 'shave', 'face'], line: 'Brushed, scraped and rinsed: 7 min.', outfit: 'utilities', interrupted: false },
        'v0.0.5-barracks-turnin': { toMs: 23534221000, parts: ['turn-in', 'lie:0.69'], line: 'Lights out at 21:56, eyes open at 02:57, through the slip: 5 h 41 min.', outfit: 'pt', interrupted: true },
      };
      for (const [name, want] of Object.entries(V005)) {
        const json = read(name), old = JSON.parse(json);
        assert(old.meta.version === '0.0.5' && old.time.doing && old.skip, `${name}: not a v0.0.5 save inside an activity (${old.meta.version})`);
        const oldCuts = Object.values(old.people).map(p => p.look?.hair?.style).filter(Boolean);
        const g = createGame({ scenario: 'barracks', seed: 48213, version: '0.0.6' });
        const s = g.load(json), pid = s.player.id;
        const cuts = Object.values(s.people).map(p => p.look?.hair?.style).filter(Boolean);
        const count = (list) => Object.entries(list.reduce((m, c) => ({ ...m, [c]: (m[c] ?? 0) + 1 }), {})).map(([k, v]) => `${k} ${v}`).join(', ');
        const rec = s.people[pid].body, b = bodyOf(s, pid);
        g.step(1500);
        const e = g.facts('skip-end').at(-1), me = g.me();
        const got = { toMs: e?.toMs, parts: e?.outcome.activity.parts, line: e?.outcome.activity.line, outfit: me.outfit ?? 'utilities', interrupted: e?.interrupted };
        g.step(1500, { mx: 1 });
        const mid = g.save();
        g.step(600, { mz: -1 });
        const end = g.save();
        const h = createGame({ scenario: 'barracks', seed: 48213, version: '0.0.6' });
        h.load(mid); h.step(600, { mz: -1 });
        console.log(`      ${name}: saved at ${hm(old.clock.ms)} inside ${old.time.doing.activity} (${old.time.doing.parts.map(p => p.part).join(', ')}); cuts ${count(oldCuts)} → ${count(cuts)}, flags ${Object.keys(s.flags).filter(k => k.startsWith('mig:')).join(', ')}; the record without hands or hair (${'hands' in rec || 'hair' in rec ? 'WRITTEN' : 'none'}), read as the template's: dirt ${fmt(b.hands.dirt, 2)}, h ${fmt(b.hair.h, 2)}`);
        console.log(`        finished at ${hm(got.toMs)}: ${got.parts.join(', ')}, "${got.line}", in ${got.outfit}${got.interrupted ? ', landed by an interrupt' : ''}; v0.0.5: ${hm(want.toMs)}, the same ${JSON.stringify(got) === JSON.stringify(want) ? 'in every field' : 'NOT'}; 3,000 ticks, ${g.errors.length} errors; saved and loaded again: ${h.save() === end ? 'byte for byte' : 'DIFFERENT'}`);
        assert(!cuts.some(c => c === 'bald' || c === 'crew') && s.flags['mig:people-cuts'] && !('hands' in rec) && !('hair' in rec), JSON.stringify({ cuts: count(cuts), flags: s.flags }));
        assert(JSON.stringify(got) === JSON.stringify(want), JSON.stringify({ got, want }));
        assert(!g.errors.length && !h.errors.length && h.save() === end, JSON.stringify({ errors: g.errors.slice(0, 3) }));
      }
    },
  },
  {
    name: 'a v0.0.6 save loads with nothing written: it saves again byte for byte at once, every body unhurt (the wound model\'s fields read their defaults), 600 ticks with no error, a save after carried on byte for byte',
    fn() {
      for (const [name, version] of [['v0.0.6-barracks-1900', '0.0.6'], ['v0.0.6-handling-hot', '0.0.6']]) {
        const json = read(name), old = JSON.parse(json);
        assert(old.meta.version === version, `${name}: not a v${version} save (${old.meta.version})`);
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 });
        const s = g.load(json), again = g.save();
        const ids = Object.keys(s.people), hurt = ids.filter(id => { const b = bodyOf(s, id); return hasWounds(b) || bloodAt(b, s.clock.ms) !== 100 || PART_KEYS.some(k => b.parts[k] !== 0); });
        g.step(300, { mx: 1 });
        const mid = g.save();
        g.step(300);
        const end = g.save();
        const h = createGame({ scenario: old.meta.scenario, seed: 48213 });
        h.load(mid); h.step(300);
        console.log(`      ${name}: saved at ${hm(old.clock.ms)} (${old.meta.scenario}, ${json.length} bytes); saved again at once: ${again === json ? 'byte for byte' : 'DIFFERENT'}; ${ids.length} bodies, ${hurt.length} hurt; 600 ticks, ${g.errors.length} errors; saved and loaded again: ${h.save() === end ? 'byte for byte' : 'DIFFERENT'}`);
        assert(again === json && !hurt.length, JSON.stringify({ same: again === json, hurt: hurt.slice(0, 3) }));
        assert(!g.errors.length && !h.errors.length && h.save() === end, JSON.stringify({ errors: g.errors.slice(0, 3) }));
      }
    },
  },
  {
    name: 'a v0.0.7 save loads with nothing written (no contact, no drills: their defaults read): it saves again byte for byte at once, X lets time run, 600 ticks with no error and no contact made, a save after carried on byte for byte',
    fn() {
      for (const name of ['v0.0.7-range-confirm', 'v0.0.7-handling-hot']) {
        const json = read(name), old = JSON.parse(json);
        assert(old.meta.version === '0.0.7' && !old.mind.contact, `${name}: not a v0.0.7 save (${old.meta.version})`);
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 });
        const s = g.load(json), again = g.save(), pid = s.player.id;
        const rung = rungOf(s, pid), drills = !!s.people[pid].skills?.drills;
        const held = s.clock.holds.join(), t0 = s.clock.ms;
        g.step(1, { act: ['shoot'] });
        g.step(299, { mx: 1 });
        const mid = g.save();
        g.step(300);
        const end = g.save();
        const h = createGame({ scenario: old.meta.scenario, seed: 48213 });
        h.load(mid); h.step(300);
        const contact = !!g.state.mind.contact;
        console.log(`      ${name}: saved at ${hm(old.clock.ms)} (${old.meta.scenario}, holds [${held}], ${json.length} bytes); saved again at once: ${again === json ? 'byte for byte' : 'DIFFERENT'}; the player's rung ${rung} (${drills ? 'WRITTEN' : 'by rank'}); X, then 600 ticks: ${fmt((g.state.clock.ms - t0) / 1000, 2)} s lived, ${g.errors.length} errors, ${contact ? 'A CONTACT' : 'no contact'}; saved and loaded again: ${h.save() === end ? 'byte for byte' : 'DIFFERENT'}`);
        assert(again === json && !drills && rung === 1 && !contact, JSON.stringify({ same: again === json, drills, rung, contact }));
        assert(!g.errors.length && !h.errors.length && h.save() === end && g.state.clock.ms > t0, JSON.stringify({ errors: g.errors.slice(0, 3), moved: g.state.clock.ms - t0 }));
      }
    },
  },
  {
    name: 'a v0.0.8 save loads with nothing written (no combat block: calm, felt 0, timeK 1; no inoculation on the sheet: the rank\'s tier\'s; no setup): it saves again byte for byte at once, the pairs bot plays 600 ticks with no error and no combat block made, a save after carried on byte for byte',
    fn() {
      for (const name of ['v0.0.8-pairs-pause', 'v0.0.8-pairs-lull']) {
        const json = read(name), old = JSON.parse(json);
        assert(old.meta.version === '0.0.8' && old.meta.scenario === 'test-pairs' && !old.people[old.player.id].skills?.inoc, `${name}: not a v0.0.8 test-pairs save (${old.meta.version})`);
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 });
        const s = g.load(json), again = g.save(), pid = s.player.id, t0 = s.clock.ms;
        const felt = feltOf(s, pid), r = rollerOf(s, pid), inoc = inocOf(s, pid), H = hardOf(s, pid);
        const bot = pairsBot();
        g.step(300, bot);
        const mid = g.save();
        g.step(300, bot);
        const end = g.save();
        const h = createGame({ scenario: old.meta.scenario, seed: 48213 });
        h.load(mid); h.step(300, bot);
        const blocks = [g.state.actors.list, [g.me()]].flat().filter(a => a?.combat).length;
        console.log(`      ${name}: saved at ${hm(old.clock.ms)} (${old.meta.scenario}, the ${old.armoury.range.sheet}, cmd ${old.armoury.range.cmd?.id}, holds [${old.clock.holds.join()}], ${json.length} bytes); saved again at once: ${again === json ? 'byte for byte' : 'DIFFERENT'}; felt ${felt}, timeK ${r.timeK}, ${inoc.words} (read, not written), hardening ${H}; 600 ticks by the pairs bot: ${fmt((g.state.clock.ms - t0) / 1000, 2)} s lived, ${g.errors.length} errors, ${blocks} combat blocks; saved and loaded again: ${h.save() === end ? 'byte for byte' : 'DIFFERENT'}`);
        assert(again === json && felt === 0 && r.timeK === 1 && !blocks && !g.state.people[pid].skills?.inoc, JSON.stringify({ same: again === json, felt, timeK: r.timeK, blocks }));
        assert(!g.errors.length && !h.errors.length && h.save() === end && g.state.clock.ms > t0, JSON.stringify({ errors: g.errors.slice(0, 3), moved: g.state.clock.ms - t0 }));
      }
    },
  },
  {
    name: 'a v0.0.9 save loads with nothing written (the build sheet 0.0.10 §3.2: no Breathe window, no stressAtMs, no R.stress): it saves again byte for byte at once, the pairs bot plays 600 ticks with no error, the banged recruit\'s pool folding its stress into his body from suppAtMs, the calm one making no combat block; a save after carried on byte for byte',
    fn() {
      for (const name of ['v0.0.9-bangs-pause', 'v0.0.9-pairs-standby']) {
        const json = read(name), old = JSON.parse(json), banged = name.includes('bangs');
        assert(old.meta.version === '0.0.9' && old.meta.scenario === 'test-pairs' && !old.armoury.range.stress, `${name}: not a v0.0.9 test-pairs save (${old.meta.version})`);
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 });
        const s = g.load(json), again = g.save(), pid = s.player.id, t0 = s.clock.ms;
        const rec0 = blockOf(s, pid), pool0 = suppAt(rec0, t0), felt0 = feltOf(s, pid), st0 = bodyOf(s, pid).stress.v;
        const fields0 = rec0 ? ['breatheFromMs', 'breatheUntilMs', 'stressAtMs'].filter(f => f in rec0) : [];
        const bot = pairsBot();
        let gained = 0;
        for (let i = 0; i < 300; i++) { g.step(1, bot); for (const [t, d] of g.bus.events) if (t === 'body-event' && d.kind === 'stress') gained += d.amount; g.clearFacts(); }
        const mid = g.save();
        g.step(300, bot);
        const end = g.save();
        const h = createGame({ scenario: old.meta.scenario, seed: 48213 });
        h.load(mid); h.step(300, bot);
        const blocks = [g.state.actors.list, [g.me()]].flat().filter(a => a?.combat).length;
        console.log(`      ${name}: saved at ${hm(old.clock.ms)} (the ${old.armoury.range.sheet}, cmd ${old.armoury.range.cmd?.id}, setup ${old.armoury.range.bangs ? 'bangs' : 'calm'}, holds [${old.clock.holds.join()}], ${json.length} bytes); saved again at once: ${again === json ? 'byte for byte' : 'DIFFERENT'}; the block's new fields on load: ${fields0.join(', ') || 'none'}; pool ${fmt(pool0, 2)}, felt ${felt0}, hardening ${hardOf(s, pid)}, stress ${fmt(st0, 2)}; 300 ticks by the pairs bot: stress +${fmt(gained, 2)} from the chaos; 600: ${fmt((g.state.clock.ms - t0) / 1000, 2)} s lived, ${g.errors.length} errors, ${blocks} combat blocks; saved and loaded again: ${h.save() === end ? 'byte for byte' : 'DIFFERENT'}`);
        assert(again === json && !fields0.length && !g.state.armoury.range.stress, JSON.stringify({ same: again === json, fields0 }));
        assert(banged ? pool0 > 45 + hardOf(s, pid) && gained > 1 : !blocks && felt0 === 0 && gained === 0, JSON.stringify({ banged, pool0, gained, blocks, felt0 }));
        assert(!g.errors.length && !h.errors.length && h.save() === end && g.state.clock.ms > t0, JSON.stringify({ errors: g.errors.slice(0, 3), moved: g.state.clock.ms - t0 }));
      }
    },
  },
  {
    name: 'a v0.0.11 save loads with nothing written (the build sheet 0.0.12 §3.2: the barracks at 13:00, and test-pairs at a contact\'s pause with a step under way, the stepper\'s extraction\'s riskiest case): it saves again byte for byte at once, plays 600 ticks with no error, and a save made after carries on byte for byte',
    timeoutMs: 120_000,
    fn() {
      for (const name of ['v0.0.11-barracks-1300', 'v0.0.11-pairs-pause']) {
        const json = read(name), old = JSON.parse(json);
        assert(old.meta.version === '0.0.11', `${name}: ${old.meta.version}`);
        const bot = () => (old.meta.scenario === 'test-pairs' ? pairsBot() : {});
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), again = g.save(), b = bot();
        const doing = s.stop?.doing ? `${s.stop.doing.step} sub ${s.stop.doing.i}` : 'nothing';
        g.step(300, b); const mid = g.save(); g.step(300, b); const end = g.save();
        const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); h.step(300, bot());
        console.log(`      ${name}: ${old.meta.scenario}, saved at ${hm(old.clock.ms)}, ${doing} under way, ${json.length} bytes; saved again at once ${again === json ? 'byte for byte' : 'DIFFERENT'}; 600 ticks, ${g.errors.length} errors; carried on from a save ${h.save() === end ? 'byte for byte' : 'DIFFERENT'}`);
        assert(again === json && !g.errors.length && !h.errors.length && h.save() === end, name);
      }
    },
  },
  {
    name: 'a v0.0.13 save loads (the shoot house\'s rework R1, 2026-11-12: the tier one by T at a contact\'s pause in room 2), its withdrawn rows mapped (R4, COMBAT §25.19.2.2: the lane\'s "Clear the house" carried on as room 2\'s "Clear the room", the #2\'s "Enter" as "In: your corner"), nothing else written: it saves again byte for byte but for the mapping (and v0.0.21\'s pars written on load), plays 600 ticks by the T bot with no error, and a save after carries on byte for byte',
    timeoutMs: 120_000,
    fn() {
      const name = 'v0.0.13-house-pause', json = read(name), old = JSON.parse(json);
      assert(old.meta.version === '0.0.13' && old.meta.scenario === 'test-shoothouse', `${name}: ${old.meta.version} ${old.meta.scenario}`);
      const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), b = houseTBot();
      // (the mapping: the carry's lane bundle cut to the leg it stood in, its keys bare; the #2's doing renamed; the rest as saved)
      const C = s.stop.carry, D = s.armoury.range.house.two.doing;
      console.log(`      mapped: the carry ${old.stop.carry.bundle} (${old.stop.carry.beats.length} beats over three legs) → ${C.bundle} for ${C.door} (${C.beats.join(', ')}); the #2's ${old.armoury.range.house.two.doing.bundle} → ${D?.bundle}`);
      assert(C.bundle === 'room:clear' && C.door === 'o:w4:r2' && C.beats.join() === 'enter,sector,clear,mark' && D?.bundle === 'room:in' && D.step === 'drill:room:in>o:w4:r2', JSON.stringify({ C, D: D?.step }));
      const mapped = JSON.parse(json);
      mapped.stop.carry = JSON.parse(JSON.stringify(C)); mapped.armoury.range.house.two.doing = JSON.parse(JSON.stringify(D));
      // (and the P-12, every sheet's from 2026-11-15: its items, the kit's holster and thigh, the house's record of it, the ids' counter)
      const P = s.armoury.range.house.pistol, k = s.people[s.player.id].kit, mine = [P, k.worn.thigh, s.items[P].mag, ...s.items[k.worn.thigh].holds];
      for (const id of mine) mapped.items[id] = JSON.parse(JSON.stringify(s.items[id]));
      Object.assign(mapped.people[s.player.id].kit.worn, { holster: P, thigh: k.worn.thigh }); mapped.armoury.range.house.pistol = P; mapped.meta.next = JSON.parse(JSON.stringify(s.meta.next));
      const norm = (o) => JSON.stringify(o, (key, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(x => [x, v[x]])) : v));
      console.log(`      the P-12 issued on load: ${mine.join(', ')}, Condition ${conditionOf(s.items[P])} (the save at ${old.armoury.range.cmd?.id})`);
      const again = norm(lessPars(JSON.parse(g.save()), old)) === norm(mapped) ? json : null;
      console.log(`      ${parsWords(s, old)}`);
      const gun = s.items[s.people[s.player.id].kit.worn.sling], belief = JSON.stringify(gun.belief);
      g.step(300, b); const mid = g.save(); g.step(300, b); const end = g.save();
      const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); h.step(300, houseTBot());
      console.log(`      ${name}: saved in leg ${old.armoury.range.house.cur} at a ${old.stop?.via ?? 'no'} pause, the gun believed ${belief}, ${json.length} bytes; saved again at once ${again === json ? 'byte for byte' : 'DIFFERENT'}; 600 ticks, ${g.errors.length} errors, now leg ${s.armoury.range.house.cur}; carried on from the save after ${h.save() === end ? 'byte for byte' : 'DIFFERENT'}`);
      assert(again === json && !g.errors.length && !h.errors.length && h.save() === end, name);
    },
  },
  {
    name: 'a v0.0.15 save loads (the private by the keys at a contact\'s pause in room 2, made with no sidearm: the house issued it from the Sergeant up) and gains its P-12 (the user, 2026-11-15: "everyone should have the same loadout"): in the holster in Condition 1 on safe as MAKE READY leaves it, its spare in the thigh\'s pouch, its ids new and every item held once, nothing else written (but v0.0.21\'s pars on load); saved and loaded again the same bytes, 600 ticks by the keys with no error, a save after carried on byte for byte',
    timeoutMs: 120_000,
    fn() {
      const name = 'v0.0.15-house-private', json = read(name), old = JSON.parse(json), pid = old.player.id;
      assert(old.meta.version === '0.0.15' && old.meta.scenario === 'test-shoothouse' && !old.people[pid].kit.worn.holster && !old.armoury.range.house.pistol, `${name}: ${old.meta.version} ${old.meta.scenario}`);
      const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), k = s.people[pid].kit, P = s.armoury.range.house.pistol, gun = s.items[P];
      const pouch = s.items[k.worn.thigh], spare = s.items[pouch?.holds?.[0]], mine = [P, k.worn.thigh, gun?.mag, ...(pouch?.holds ?? [])];
      const num = (id) => Number(id.slice(1)), before = Object.keys(old.items).map(num);
      const ids = checkIds(JSON.parse(g.save()), g.sim.domains);
      console.log(`      ${name}: the ${old.armoury.range.house.tier} in leg ${old.armoury.range.house.cur} at a ${old.stop?.via} pause (cmd ${old.armoury.range.cmd?.id}); on load the P-12 ${P} in the holster, Condition ${conditionOf(gun)}, ${gunField(gun, 'mode')}, believed ${JSON.stringify(gun.belief)}; the pouch ${k.worn.thigh} holds ${spare?.n} ${spare?.load}; its ids ${mine.join(', ')} after the save's last i${Math.max(...before)}; the id walk: ${ids.invalid.length} invalid, ${ids.dangling.length} dangling`);
      assert(k.worn.holster === P && gun.model === 'p12' && conditionOf(gun) === 1 && gunField(gun, 'mode') === 'safe' && gun.belief?.chamber === 'live' && spare?.n === 10 && pouch.model === 'pouch-p12', JSON.stringify({ worn: k.worn, gun }));
      assert(Math.min(...mine.map(num)) > Math.max(...before) && !ids.invalid.length && !ids.dangling.length, JSON.stringify({ mine, invalid: ids.invalid.slice(0, 3), dangling: ids.dangling.slice(0, 3) }));
      // (nothing else written: the save less the P-12's items, its two kit slots, the house's record of it and the id counter is the old one)
      const now = JSON.parse(g.save()), strip = (o) => { const c = JSON.parse(JSON.stringify(o)); for (const id of mine) delete c.items[id]; delete c.people[pid].kit.worn.holster; delete c.people[pid].kit.worn.thigh; delete c.armoury.range.house.pistol; c.meta.next = null; c.meta.schema = null; return lessPars(c, old); };
      const norm = (o) => JSON.stringify(o, (key, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(x => [x, v[x]])) : v));
      const only = norm(strip(now)) === norm(strip(old));
      const twice = createGame({ scenario: old.meta.scenario, seed: 48213 }); twice.load(g.save());
      const same = twice.save() === g.save();
      const b = houseKeysBot();
      g.step(300, b); const mid = g.save(); g.step(300, b); const end = g.save();
      const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); h.step(300, houseKeysBot());
      console.log(`      ${parsWords(s, old)}; nothing else written: ${only}; saved and loaded again ${same ? 'byte for byte' : 'DIFFERENT'}; 600 ticks by the keys, ${g.errors.length} errors, now leg ${g.state.armoury.range.house.cur}; carried on from the save after ${h.save() === end ? 'byte for byte' : 'DIFFERENT'}`);
      assert(only && same && !g.errors.length && !h.errors.length && h.save() === end, JSON.stringify({ only, same, errors: g.errors.slice(0, 2) }));
      // (and the lane to its card from there, the P-12 holstered at it, cleared by SHOW CLEAR as the pistol last)
      const run = runHouse(g, b, { maxMs: 10 * 60_000 }), G = g.state.items[P];
      console.log(`      on to the card: ${run.done ? 'reached' : 'NOT reached'} in ${fmt(run.ms / 1000, 1)} s more; the P-12 at it Condition ${conditionOf(G)}, ${g.state.people[pid].kit.worn.holster === P ? 'holstered' : 'not holstered'}`);
      assert(run.done && g.state.people[pid].kit.worn.holster === P && conditionOf(G) === 4, JSON.stringify({ done: run.done, cond: conditionOf(G) }));
    },
  },
  {
    name: 'the P-12\'s upgrade by the moment of the save: a v0.0.15 lane saved before MAKE READY gains it in Condition 3 (the fill\'s), between MAKE READY and the rifle\'s UNLOAD in Condition 1 on safe, after SHOW CLEAR in Condition 4 (the magazine in the thigh\'s pouch, never racked); a save with one is left as it is (the Sergeant\'s, a fresh fill\'s)',
    timeoutMs: 120_000,
    fn() {
      // (a lane of today's private by the keys, saved at each moment, the P-12 taken out of the save as v0.0.15's had none)
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' }), b = houseKeysBot(), at = {};
      runHouse(g, b, { maxMs: 10 * 60_000, each: (game) => { const st = game.state, c = st.armoury.range.cmd?.id ?? 'none', key = c === 'load' ? 'load' : c === 'go' ? 'go' : c === 'wash' ? 'wash' : null; if (key && !at[key]) at[key] = game.save(); } });
      const out = {};
      for (const [key, json] of Object.entries(at)) {
        const o = JSON.parse(json), pid = o.player.id, k = o.people[pid].kit, P = o.armoury.range.house.pistol;
        const mine = [P, k.worn.thigh, ...(o.items[P].mag ? [o.items[P].mag] : []), ...o.items[k.worn.thigh].holds];
        for (const id of mine) delete o.items[id];
        delete k.worn.holster; delete k.worn.thigh; delete o.armoury.range.house.pistol; o.meta.version = '0.0.15';
        const h = createGame({ scenario: 'test-shoothouse', seed: 48213 }), s = h.load(JSON.stringify(o)), Q = s.armoury.range.house.pistol, G = s.items[Q];
        out[key] = { cond: conditionOf(G), mode: gunField(G, 'mode'), pouch: s.items[s.people[pid].kit.worn.thigh].holds.length };
      }
      const sgt = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt' }), before = sgt.save(), again = createGame({ scenario: 'test-shoothouse', seed: 48213 }); again.load(before);
      console.log(`      the P-12 on load: ${Object.entries(out).map(([k, v]) => `at ${k} Condition ${v.cond} (${v.mode}, ${v.pouch} in the pouch)`).join('; ')}; the sergeant's fill loaded ${again.save() === before ? 'byte for byte' : 'DIFFERENT'}`);
      assert(out.load?.cond === 3 && out.load.pouch === 1 && out.go?.cond === 1 && out.go.mode === 'safe' && out.go.pouch === 1 && out.wash?.cond === 4 && out.wash.pouch === 2 && again.save() === before, JSON.stringify(out));
    },
  },
  {
    name: 'a v0.0.17 save loads with nothing written (the build sheet 0.0.18 §3.2: the shoot house with the P-12 drawn and the rifle hanging on its click, and a test-pairs standby; but the house\'s pars on load, v0.0.21): it saves again byte for byte at once, plays 600 ticks with no error, a save made after carries on byte for byte, and the house lane reaches its card with the P-12 holstered',
    timeoutMs: 180_000,
    fn() {
      for (const name of ['v0.0.17-house-pistol', 'v0.0.17-pairs-standby']) {
        const json = read(name), old = JSON.parse(json), house = old.meta.scenario === 'test-shoothouse';
        assert(old.meta.version === '0.0.17' && old.meta.scenario === (house ? 'test-shoothouse' : 'test-pairs'), `${name}: ${old.meta.version} ${old.meta.scenario}`);
        // (each by the bot that made it, whose memory is saved on the actor: the house's the honest T bot answering its card with Transition)
        const bot = () => (house ? stoppageBot({ answer: 'transition' }) : pairsBot());
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), saved = g.save(), again = house ? (sansPars(saved, json) === JSON.stringify(old) ? json : saved) : saved, pid = s.player.id, b = bot();
        const k = s.people[pid].kit, P = s.armoury.range.house?.pistol ?? null, rifle = s.items[k.worn.sling];
        const where = house ? `the ${s.armoury.range.house.tier} in leg ${s.armoury.range.house.cur} at a ${s.stop?.via} pause, the P-12 ${k.hands?.[0] === P ? 'in the hand' : 'NOT in the hand'}, the rifle believed ${JSON.stringify(rifle.belief)}` : `the ${s.armoury.range.sheet} at a ${s.stop?.via ?? 'no'} pause, cmd ${s.armoury.range.cmd?.id}`;
        if (house) assert(k.hands?.[0] === P && s.stop?.gun === P && rifle.belief?.stoppage === 'click', JSON.stringify({ hands: k.hands, gun: s.stop?.gun, belief: rifle.belief }));
        else assert(s.armoury.range.cmd?.id === 'standby' && s.stop, JSON.stringify({ cmd: s.armoury.range.cmd?.id }));
        g.step(300, b); const mid = g.save(); g.step(300, b); const end = g.save();
        const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); h.step(300, bot());
        const carried = h.save() === end;
        let card = '';
        if (house) {
          const run = runHouse(g, b, { maxMs: 10 * 60_000 });
          card = `; on to the card ${run.done ? 'reached' : 'NOT reached'} in ${fmt(run.ms / 1000, 1)} s more, the P-12 ${g.state.people[pid].kit.worn.holster === P ? 'holstered' : 'not holstered'}`;
          assert(run.done && g.state.people[pid].kit.worn.holster === P, JSON.stringify({ done: run.done }));
        }
        console.log(`      ${name}: ${where}, ${json.length} bytes; ${house ? `${parsWords(s, old)}; ` : ''}saved again at once ${again === json ? 'byte for byte' : 'DIFFERENT'}; 600 ticks, ${g.errors.length} errors; carried on from a save ${carried ? 'byte for byte' : 'DIFFERENT'}${card}`);
        assert(again === json && !g.errors.length && !h.errors.length && carried, JSON.stringify({ same: again === json, errors: g.errors.slice(0, 3), carried }));
      }
    },
  },
  {
    name: 'a v0.0.18 save loads with nothing written (the build sheet 0.0.19 §2 step 7: the flash lane with a G-11 armed in the hand on room 1\'s stack, and a standard lane mid-room 2 with the #2 on his own stoppage; but the pars on load, v0.0.21): it saves again byte for byte at once with its ids whole, plays 600 ticks with no error, a save made after carries on byte for byte, and the lane reaches its card',
    timeoutMs: 180_000,
    fn() {
      // (each by the bot that made it, whose memory is saved on the actor)
      const BOTS = { 'v0.0.18-house-flash': () => houseKitBot({ use: 'flash' }), 'v0.0.18-house-twodown': () => stoppageBot({ answer: 'gundown' }) };
      for (const [name, bot] of Object.entries(BOTS)) {
        const json = read(name), old = JSON.parse(json), H0 = old.armoury.range.house, pid = old.player.id;
        assert(old.meta.version === '0.0.18' && old.meta.scenario === 'test-shoothouse', `${name}: ${old.meta.version} ${old.meta.scenario}`);
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), saved = g.save(), again = sansPars(saved, json) === JSON.stringify(old) ? json : saved, H = s.armoury.range.house, b = bot();
        const ids = checkIds(JSON.parse(saved), g.sim.domains), dev = handDeviceOf(s, pid);
        const where = name.endsWith('flash')
          ? `the ${H.tier} on '${H.loadout}' in leg ${H.cur}, the ${dev?.model ?? 'no device'} ${dev?.st ?? ''} in hand ${dev?.hand ?? '-'}, stop ${s.stop?.mode ?? 'none'}`
          : `the ${H.tier} in leg ${H.cur} (${H.rooms[H.cur]?.state}), the #2 down (${H.two.down?.macro}, his sub-step ${H.two.doing?.i} ${H.two.doing?.list?.[H.two.doing?.i]})`;
        if (name.endsWith('flash')) assert(H.loadout === 'flash' && H.cur === 0 && dev?.model === 'g11' && dev.st === 'armed', JSON.stringify({ loadout: H.loadout, cur: H.cur, dev }));
        else assert(!H0.loadout && H.cur === 1 && H.rooms[1].state === 'entered' && H.two.down && H.two.doing?.cmd === 'down', JSON.stringify({ cur: H.cur, down: H.two.down }));
        g.step(300, b); const mid = g.save(); g.step(300, b); const end = g.save();
        const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); h.step(300, bot());
        const carried = h.save() === end, run = runHouse(g, b, { maxMs: 10 * 60_000 });
        console.log(`      ${name}: ${where}, ${json.length} bytes; ${parsWords(s, old)}; saved again at once ${again === json ? 'byte for byte' : 'DIFFERENT'}, ids ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; 600 ticks, ${g.errors.length} errors; carried on from a save ${carried ? 'byte for byte' : 'DIFFERENT'}; on to the card ${run.done ? 'reached' : 'NOT reached'} in ${fmt(run.ms / 1000, 1)} s more (${g.state.armoury.range.house.end?.why ?? 'no end'})`);
        assert(again === json && !ids.invalid.length && !ids.dangling.length && !g.errors.length && !h.errors.length && carried && run.done, JSON.stringify({ same: again === json, invalid: ids.invalid.slice(0, 3), dangling: ids.dangling.slice(0, 3), errors: g.errors.slice(0, 3), carried, done: run.done }));
      }
    },
  },
  {
    name: 'a v0.0.19 save loads with nothing written (the build sheet 0.0.20 §3 step 4: the private between LOAD and MAKE READY, and the corporal mid-room 3 with the sides swapped and his #2 at his point; but the pars on load, v0.0.21): it saves again byte for byte at once with its ids whole, plays 600 ticks with no error, a save made after carries on byte for byte, and the lane reaches its card',
    timeoutMs: 180_000,
    fn() {
      // (each by the bot that made it, whose memory is saved on the actor; neither carries the #2's P-12, made before v0.0.20's default)
      // (the swap's by the honest bot reading whose man a stand is (tests/bots/team.mjs houseOwnerBot), as two-side plays a swapped room)
      const BOTS = { 'v0.0.19-house-cold': () => houseKeysBot(), 'v0.0.19-house-swap': () => houseOwnerBot() };
      for (const [name, bot] of Object.entries(BOTS)) {
        const json = read(name), old = JSON.parse(json), R0 = old.armoury.range, H0 = R0.house;
        assert(old.meta.version === '0.0.19' && old.meta.scenario === 'test-shoothouse', `${name}: ${old.meta.version} ${old.meta.scenario}`);
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), saved = g.save(), again = sansPars(saved, json) === JSON.stringify(old) ? json : saved, H = s.armoury.range.house, b = bot();
        const ids = checkIds(JSON.parse(saved), g.sim.domains), pid = s.player.id, rifle = s.items[s.people[pid].kit.worn.sling];
        const where = name.endsWith('cold')
          ? `the ${H.tier} at the tower's ${s.armoury.range.cmd?.id}, the rifle a magazine ${rifle.mag ? 'in' : 'out'}, chamber ${gunField(rifle, 'chamber') ?? 'empty'}, ${gunField(rifle, 'mode')}; his P-12 ${H.two.pistol ?? 'none'}`
          : `the ${H.tier} in leg ${H.cur} (${H.rooms[2]?.state}), sides ${JSON.stringify(H.two.side ?? {})}; his P-12 ${H.two.pistol ?? 'none'}`;
        if (name.endsWith('cold')) assert(R0.cmd?.id === 'load' && rifle.mag && !gunField(rifle, 'chamber') && H0.goAtMs === null, JSON.stringify({ cmd: R0.cmd?.id, mag: rifle.mag, go: H0.goAtMs }));
        else assert(H0.cur === 2 && H0.two.side?.['o:w4:r3'] === 1, JSON.stringify({ cur: H0.cur, side: H0.two.side }));
        g.step(300, b); const mid = g.save(); g.step(300, b); const end = g.save();
        const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); h.step(300, bot());
        const carried = h.save() === end, run = runHouse(g, b, { maxMs: 12 * 60_000 });
        console.log(`      ${name}: ${where}, ${json.length} bytes; ${parsWords(s, old)}; saved again at once ${again === json ? 'byte for byte' : 'DIFFERENT'}, ids ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; 600 ticks, ${g.errors.length} errors; carried on from a save ${carried ? 'byte for byte' : 'DIFFERENT'}; on to the card ${run.done ? 'reached' : 'NOT reached'} in ${fmt(run.ms / 1000, 1)} s more (${g.state.armoury.range.house.end?.why ?? 'no end'})`);
        assert(again === json && !ids.invalid.length && !ids.dangling.length && !g.errors.length && !h.errors.length && carried && run.done, JSON.stringify({ same: again === json, invalid: ids.invalid.slice(0, 3), dangling: ids.dangling.slice(0, 3), errors: g.errors.slice(0, 3), carried, done: run.done }));
      }
    },
  },
  {
    name: 'a v0.0.19 save on the live lane between the role-player\'s two rounds (the sergeant on 48213, the honest bot) gains the would-have\'s ledger with the rule \'count\' and nothing else (but the pars on load, v0.0.21), finishes by v0.0.19\'s count (\'casualty\' at its own tick, 21.05 s, on the second round; v0.0.20\'s rule rates the two wounds), and a save made after carries on byte for byte',
    timeoutMs: 120_000,
    fn() {
      const json = read('v0.0.19-house-live'), old = JSON.parse(json), H0 = old.armoury.range.house;
      assert(old.meta.version === '0.0.19' && H0.live && !H0.live.would && H0.live.struck.length === 1 && !H0.live.casualty, JSON.stringify({ v: old.meta.version, struck: H0.live?.struck }));
      const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), again = JSON.parse(g.save()), H = s.armoury.range.house;
      // (the one thing written: the ledger; every other key of the save as it was)
      const W = again.armoury.range.house.live.would; delete again.armoury.range.house.live.would;
      const only = JSON.stringify(lessPars(again, old)) === JSON.stringify(JSON.parse(json));
      const b = houseHonestBot();
      g.step(10, b); const mid = g.save(); g.step(10, b);
      const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); h.step(10, houseHonestBot());
      const carried = h.save() === g.save();
      const run = runHouse(g, b, { maxMs: 10 * 60_000 }), K = H.live.casualty, endS = H.end ? (H.end.atMs - H.goAtMs) / 1000 : null, card = runSheetOf(s).card;
      console.log(`      ${json.length} bytes; the ledger written ${JSON.stringify(W)}; the rest of the save as it was ${only}; carried on from a save ${carried ? 'byte for byte' : 'DIFFERENT'}; the lane ${H.end?.why} at ${fmt(endS, 2)} s, the casualty on ${K?.who === s.player.id ? 'you' : K?.who} at ${K ? fmt((K.atMs - H.goAtMs) / 1000, 2) : '-'} s; its strikes ${H.live.struck.length}, entries ${H.live.would.log.length} (rule ${H.live.would.rule}); the card: ${card.slice(0, 90)}`);
      assert(W && W.rule === 'count' && !W.log.length && only && carried, JSON.stringify({ W, only, carried }));
      assert(run.done && H.end?.why === 'casualty' && Math.abs(endS - 21.05) < 0.001 && K?.who === s.player.id && H.live.struck.length === 2 && /^CASUALTY · PAINT: 2 TORSO, ROOM 2, BY THE MAN IN THE DEEP CORNER/.test(card), JSON.stringify({ end: H.end, K, card }));
    },
  },
  {
    name: 'v0.0.21 (its build sheet §3 step 9): two saves made by v0.0.20\'s code load and carry on byte for byte: the private by the keys at a contact\'s pause in room 2 (the read scope and the op seam load over it), and the sergeant at the tower\'s Stop with the P-12 in the hand (B\'s house-pistol reads it; its recipe: v0.0.17\'s pistol save played by stoppageBot({ answer: \'transition\' }) with Rifle up refused, weapon:rifle-up never chosen, to the Stop\'s first pause)',
    timeoutMs: 120_000,
    fn() {
      // (each by the bot that made it, whose memory is saved on the actor: the contact's by the keys bot, the Stop's by the stoppage
      // bot, Rifle up no longer refused; the maker: .run/v021/lead-figures/scripts/make-saves.mjs, run on the snapshot's tree)
      const BOTS = { 'v0.0.20-house-contact': () => houseKeysBot(), 'v0.0.20-house-stop': () => stoppageBot({ answer: 'transition' }) };
      for (const [name, bot] of Object.entries(BOTS)) {
        const json = read(name), old = JSON.parse(json), R0 = old.armoury.range, H0 = R0.house, S0 = old.stop, pid0 = old.player.id;
        // (the Stop's is stamped 0.0.17, the save it was played on from: a load keeps its stamp; v0.0.20's code made the rest)
        assert(old.meta.version === (name.endsWith('stop') ? '0.0.17' : '0.0.20') && old.meta.scenario === 'test-shoothouse', `${name}: ${old.meta.version} ${old.meta.scenario}`);
        const T0 = S0?.pick ? R0.turners.find(t => t.key === S0.pick) : null, hands0 = old.people[pid0].kit.hands ?? [];
        if (name.endsWith('contact')) assert(H0.cur === 1 && S0?.mode === 'stop' && S0.phase === 'choose' && S0.via === 'contact' && T0?.room === 'w4.r2', JSON.stringify({ cur: H0.cur, via: S0?.via, pick: S0?.pick }));
        else assert(R0.cmd?.id === 'stop' && S0?.mode === 'stop' && S0.phase === 'choose' && hands0[0] === H0.pistol, JSON.stringify({ cmd: R0.cmd?.id, hands: hands0, pistol: H0.pistol }));
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), saved = g.save(), again = sansPars(saved, json) === JSON.stringify(old) ? json : saved, b = bot();
        const ids = checkIds(JSON.parse(saved), g.sim.domains);
        const where = name.endsWith('contact') ? `the ${H0.tier} in room 2 at a contact's pause on ${T0.stand} (${T0.face})` : `the ${H0.tier} at the tower's Stop, the P-12 (${H0.pistol}) in the hand`;
        g.step(300, b); const mid = g.save(); g.step(300, b); const end = g.save();
        const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); h.step(300, bot());
        const carried = h.save() === end;
        console.log(`      ${name}: ${where}, ${json.length} bytes; ${parsWords(s, old)}; saved again at once ${again === json ? 'byte for byte' : 'DIFFERENT'}, ids ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; 600 ticks, ${g.errors.length} errors; a save at 300 carried on ${carried ? 'byte for byte' : 'DIFFERENTLY'}; the lane ${s.armoury.range.house.end?.why ?? 'running'}`);
        assert(again === json && !ids.invalid.length && !ids.dangling.length && !g.errors.length && !h.errors.length && carried, JSON.stringify({ same: again === json, invalid: ids.invalid.slice(0, 3), dangling: ids.dangling.slice(0, 3), errors: g.errors.slice(0, 2), carried }));
      }
    },
  },
  {
    name: 'v0.0.21 (its build sheet §1 item 25): a v0.0.19 save mid-lane gains its pars on load (the corporal mid-room 3: each room\'s, the lane\'s, the books and the immediate action\'s, planned once from the state as loaded, where v0.0.20 planned them on every read), and not one room\'s par is planned after the load\'s tick over 100 ticks of reads (houseNow, the paper, the verdict); fails with the pars computed on read (v0.0.20: four planBundles on every read)',
    timeoutMs: 120_000,
    fn() {
      const json = read('v0.0.19-house-swap'), old = JSON.parse(json), H0 = old.armoury.range.house;
      assert(old.meta.version === '0.0.19' && H0.laneParMs === undefined && H0.rooms.every(L => L.parMs === undefined), JSON.stringify({ v: old.meta.version, lane: H0.laneParMs }));
      const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), n0 = PAR_PLANS.n, s = g.load(json), atLoad = PAR_PLANS.n - n0, H = s.armoury.range.house;
      // (the fill's pars on the same sheet, seed and setup, printed beside: the load plans from the state as it stands, rooms 1 and 2's
      // doors open and the stack inside room 3, as v0.0.20's read did, so a cleared room's par is its walk without the door; the immediate
      // action's book is the rifle's, the fill's to the ms)
      const f = createGame({ scenario: 'test-shoothouse', seed: old.meta.seed, tier: H0.tier, setup: 'room:3' }).state.armoury.range.house;
      const legs = [...H.rooms, H.hall].map(L => L.parMs), fill = [...f.rooms, f.hall].map(L => L.parMs);
      const b = houseOwnerBot(), n1 = PAR_PLANS.n;
      let reads = 0;
      for (let i = 0; i < 100; i++) { g.step(1, b); const N = houseNow(g.state); void N.timerMs; void N.legs.map(V => V.parMs); runSheetOf(g.state); houseVerdict(g.state); reads++; }
      const after = PAR_PLANS.n - n1;
      console.log(`      the ${H0.tier} on ${old.meta.seed} in leg ${H0.cur}: on load ${atLoad} rooms planned; the pars ${legs.join(', ')} (lane ${H.laneParMs}), the fill's ${fill.join(', ')} (lane ${f.laneParMs}); books ${Object.keys(H.books ?? {}).length} (the fill's ${Object.keys(f.books).length}), IA ${H.iaBookMs} (the fill's ${f.iaBookMs}); ${reads} ticks of reads after: ${after} rooms planned`);
      assert(legs.every(Number.isFinite) && H.laneParMs === legs.reduce((a, b) => a + b, 0) && Object.keys(H.books ?? {}).length === s.armoury.range.turners.length && H.iaBookMs === f.iaBookMs, JSON.stringify({ legs, fill, lane: H.laneParMs, fillLane: f.laneParMs }));
      assert(atLoad === 4 && after === 0 && !g.errors.length, JSON.stringify({ atLoad, after, errors: g.errors.slice(0, 2) }));
    },
  },
  {
    name: 'v0.0.21 (its build sheet §1 item 18): a drawn house\'s save made by v0.0.21\'s own code (the sergeant by T on the house drawn from 1489397426, at his first contact\'s pause in room 2) loads into an empty registry, its area rebuilt from places.live.gen (\'places:gen\'), saves again byte for byte with every id valid, and 300 + 300 ticks by its bot carry on byte for byte from a save at 300',
    timeoutMs: 120_000,
    fn() {
      // (the maker: .run/v021/integ/make-drawn-save.mjs, run on v0.0.21's integrated tree; houseBot({ mode: 'T' }) keeps its memory on the actor)
      const json = read('v0.0.21-house-drawn'), old = JSON.parse(json), H0 = old.armoury.range.house, S0 = old.stop, area = old.places.live.area;
      assert(old.meta.version === '0.0.21' && old.meta.scenario === 'test-shoothouse', `${old.meta.version} ${old.meta.scenario}`);
      assert(H0.draw?.mode === 'drawn' && /~/.test(area) && old.places.live.gen?.code && H0.cur === 1 && S0?.mode === 'stop' && S0.phase === 'choose' && S0.via === 'contact', JSON.stringify({ draw: H0.draw, area, cur: H0.cur, via: S0?.via }));
      resetHouses(); resetRegistry();
      const empty = !areaOf(area);
      const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), saved = g.save(), found = !!areaOf(s.places.live.area);
      const ids = checkIds(JSON.parse(saved), g.sim.domains), b = houseBot({ mode: 'T' });
      g.step(300, b); const mid = g.save(); g.step(300, b); const end = g.save();
      const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); h.step(300, houseBot({ mode: 'T' }));
      const carried = h.save() === end;
      console.log(`      ${H0.draw.code} (${area}): the ${H0.tier} at a contact's pause on ${S0.pick}, ${json.length} bytes; the registry empty before the load ${empty}, the area found after ${found}; saved again at once ${saved === json ? 'byte for byte' : 'DIFFERENT'}, ids ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; 600 ticks, ${g.errors.length} errors; a save at 300 carried on ${carried ? 'byte for byte' : 'DIFFERENTLY'}; the lane ${s.armoury.range.house.end?.why ?? 'running'}`);
      assert(empty && found && saved === json && !ids.invalid.length && !ids.dangling.length && !g.errors.length && !h.errors.length && carried, JSON.stringify({ empty, found, same: saved === json, invalid: ids.invalid.slice(0, 3), dangling: ids.dangling.slice(0, 3), errors: g.errors.slice(0, 2), carried }));
    },
  },
  {
    name: 'v0.0.22 (its build sheet §2 step 7): two saves made by v0.0.21\'s own code load and carry on byte for byte, and each reaches its card under v0.0.22\'s rules: the private by the keys at the first pause after your "Clear." at SHOW CLEAR, your #2 mid-macro, looked at by the instructor\'s eye before his "Number two, clear." (R.house.show begun on the load); and the sergeant by T on the live lane the tick after the role-player\'s first strike on you, his second to come, the paint said at most once (heavy: game-upgrade is at its QUICK_SLOW ceiling)',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      // (each by the bot that made it, whose memory is saved on the actor. Stage 0 held each to its lane's tick from the fill (house-pin's
      // and house-live-pin's, v0.0.21's rules then); v0.0.22's C moves both lanes after Stop (FL22-1's walk, look and skip; FL22-2's
      // paint, FL22-3's words), and a save made by v0.0.21 carries its own past into them, so each end tick is its own, recorded on C's
      // tree (the pins' were 4522 and 3362): `tick`)
      const CASES = {
        'v0.0.21-house-showclear': { bot: () => houseKeysBot(), end: 'clear', pin: PIN['keys/private/48213/standard'], tick: SAVE_TICKS.showclear },
        'v0.0.21-house-paint': { bot: () => houseBot({ mode: 'T' }), end: 'casualty', pin: LIVE_PIN['T/sgt/48213/live:fight,hide'], tick: SAVE_TICKS.paint },
      };
      for (const [name, c] of Object.entries(CASES)) {
        const json = read(name), old = JSON.parse(json), R0 = old.armoury.range, H0 = R0.house, S0 = old.stop, W0 = H0.two;
        assert(old.meta.version === '0.0.21' && old.meta.scenario === 'test-shoothouse' && old.meta.seed === 48213, `${name}: ${old.meta.version} ${old.meta.scenario} ${old.meta.seed}`);
        if (name.endsWith('showclear')) assert(R0.cmd?.id === 'clear' && R0.shown && S0?.phase === 'choose' && W0.doing?.cmd === 'clear', JSON.stringify({ cmd: R0.cmd?.id, shown: R0.shown, phase: S0?.phase, his: W0.doing?.cmd ?? null }));
        else assert(H0.live?.struck?.length === 1 && !H0.live.casualty && H0.live.cards?.['2a'] === 'fight' && H0.live.cards?.['3a'] === 'hide', JSON.stringify({ struck: H0.live?.struck?.length, casualty: !!H0.live?.casualty, cards: H0.live?.cards }));
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), saved = g.save(), ids = checkIds(JSON.parse(saved), g.sim.domains), b = c.bot();
        g.step(300, b); const mid = g.save(); g.step(300, b); const end = g.save();
        const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); h.step(300, c.bot());
        const carried = h.save() === end;
        // (v0.0.22's rules after the load: the instructor's words watched to the card)
        const words = [];
        const r = runHouse(g, b, { maxMs: 30 * 60_000, each: (game) => { for (const [type, e] of game.bus.events) if (type === 'say' && e.who === game.state.armoury.range.house.chiefPid) words.push(String(e.text)); } }), H = s.armoury.range.house;
        const twoLine = words.filter(t => HOUSE_CHIEF.twoClear.includes(t)).length, paint = words.filter(t => /Keep working\.$/.test(t)).length;
        const where = name.endsWith('showclear') ? `the ${H0.tier} at SHOW CLEAR, his macro at ${W0.doing.list[W0.doing.i]}` : `the ${H0.tier} on the live lane, struck ${H0.live.struck.length} (${H0.live.struck[0].part ?? '-'})`;
        console.log(`      ${name}: ${where}, tick ${old.clock.tick}, ${json.length} bytes; saved again at once ${saved === json ? 'byte for byte' : 'DIFFERENT'}, ids ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; a save at 300 carried on ${carried ? 'byte for byte' : 'DIFFERENTLY'}; to the card ${r.done} (${H.end?.why}) at tick ${s.clock.tick}, its lane from the fill ${c.pin[0]}`);
        assert(saved === json && !ids.invalid.length && !ids.dangling.length && !g.errors.length && !h.errors.length && carried, JSON.stringify({ same: saved === json, invalid: ids.invalid.slice(0, 3), dangling: ids.dangling.slice(0, 3), errors: g.errors.slice(0, 2), carried }));
        console.log(`        under v0.0.22's rules: the look ${JSON.stringify(H.show?.done ? Object.keys(H.show.done).length : 0)} of 2 done, "Number two, clear." ${twoLine}, paint called after the load ${paint}; the wash "${words.find(t => /^(The lane is clear|Weapons clear|Guns are clear)/.test(t)) ?? '-'}"`);
        assert(r.done && H.end?.why === c.end && s.clock.tick === c.tick, JSON.stringify({ done: r.done, end: H.end?.why, tick: s.clock.tick, want: c.tick }));
        if (name.endsWith('showclear')) assert(H.show?.done?.[s.player.id] !== undefined && H.show?.done?.[H.twoPid] !== undefined && twoLine === 1, JSON.stringify({ show: H.show, twoLine }));
        else assert(paint === 0 && words.some(t => HOUSE_CHIEF.one['casualty:click'].includes(t) || /Weapons clear|Guns are clear/.test(t)), JSON.stringify({ paint, words: words.slice(-6) }));
      }
    },
  },
  {
    // (v0.0.23's stage 0, its build sheet §2 step 4 and carried §5 step 0: two saves made by v0.0.22's own code (the integrated snapshot,
    // tree 5268b1cd; v0.0.22 untagged), for v0.0.23's D, whose rules load over them (FH-1, FH-2: the walk words and the room passed with
    // passWhy 'door'; DC3: the sterile check begun on the load, LOAD after it). Held here to v0.0.22's rules: each reaches its card on
    // its lane's tick from the fill (house-pin's honest/recruit/48213 and house-live-pin's quick cell, the bots that made them, whose
    // memory is saved on the actor); D moves both ticks with the pins and adds its new-rule assertions here)
    // (v0.0.23 D, its build sheet §6: under v0.0.23's rules the door save's line names #1's path from where the recruit stands (FH-1,
    // "Q to the door, S through it, then D"; v0.0.22 said "D and S", into the wall) and room 2 is passed with passWhy 'door' (FH-2, on
    // the honest bot, who walks no keys); the brief save's sterile check begins on the load (H.sterile, absent in it) and LOAD comes after
    // both looks (DC3). The door save's card keeps its tick (9482: FH-1 and FH-2 move no tick); the brief save reaches its card on
    // house-live-pin's quick cell's new tick, 3442 (DC3's check before LOAD: v0.0.22's 3362), its brief's words v0.0.22's, said before the save)
    name: 'v0.0.23 (its build sheet §2 step 4): two saves made by v0.0.22\'s own code load and carry on byte for byte, each to its card on its lane\'s tick: the honest recruit standing 30 s at room 2\'s open door with the walk-in line on, and the sergeant by T 10 s into the live lane\'s brief, H.sterile absent; under v0.0.23\'s rules the line names #1\'s path, room 2 is passed with passWhy \'door\', the sterile check begins on the load and LOAD follows both looks (heavy: game-upgrade is at its QUICK_SLOW ceiling)',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      const CASES = {
        'v0.0.22-house-door-recruit': { bot: () => botOf('honest', { seed: 48213 }), pin: PIN['honest/recruit/48213/standard'] },
        'v0.0.22-house-live-brief': { bot: () => houseBot({ mode: 'T' }), pin: LIVE_PIN['T/sgt/48213/live:fight,hide'] },
      };
      for (const [name, c] of Object.entries(CASES)) {
        const json = read(name), old = JSON.parse(json), R0 = old.armoury.range, H0 = R0.house;
        assert(old.meta.version === '0.0.22' && old.meta.scenario === 'test-shoothouse' && old.meta.seed === 48213, `${name}: ${old.meta.version} ${old.meta.scenario} ${old.meta.seed}`);
        if (name.endsWith('door-recruit')) assert(H0.tier === 'recruit' && H0.cur === 1 && H0.rooms[1].state === 'open' && !old.stop, JSON.stringify({ tier: H0.tier, cur: H0.cur, leg: H0.rooms[1]?.state, stop: !!old.stop }));
        else assert(H0.tier === 'sgt' && R0.cmd?.id === 'brief' && H0.goAtMs === null && H0.sterile === undefined && H0.live?.cards?.['2a'] === 'fight' && H0.live?.cards?.['3a'] === 'hide', JSON.stringify({ tier: H0.tier, cmd: R0.cmd?.id, go: H0.goAtMs, sterile: H0.sterile, cards: H0.live?.cards }));
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), saved = g.save(), ids = checkIds(JSON.parse(saved), g.sim.domains), b = c.bot();
        // (the instinct's line is runtime ($instinct): read on a copy one tick after the load, by the same bot)
        const peek = createGame({ scenario: old.meta.scenario, seed: 48213 }); peek.load(json); const pb = c.bot(); peek.step(1, pb); const line = instinctNow(peek.state).line;
        // (v0.0.23's rules, on the copy: the brief save on to LOAD, the sterile looks' ms against LOAD's)
        let loadMs = null;
        if (name.endsWith('live-brief')) for (let i = 0; i < 1200 && loadMs === null; i++) { peek.step(1, pb); if (peek.state.armoury.range.cmd?.id === 'load') loadMs = peek.state.clock.ms; }
        const looks = Object.values(peek.state.armoury.range.house.sterile?.done ?? {});
        g.step(300, b); const mid = g.save(); g.step(300, b); const end = g.save();
        const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); h.step(300, c.bot());
        const carried = h.save() === end;
        const r = runHouse(g, b, { maxMs: 30 * 60_000 }), H = s.armoury.range.house;
        const where = name.endsWith('door-recruit') ? `the ${H0.tier} at room 2's open door, the line on the load ${line?.id ?? '-'}: "${line?.text ?? ''}"` : `the ${H0.tier} ${((old.clock.ms - R0.cmd.atMs) / 1000).toFixed(2)} s into the live lane's brief`;
        console.log(`      ${name}: ${where}, tick ${old.clock.tick}, ${json.length} bytes; saved again at once ${saved === json ? 'byte for byte' : 'DIFFERENT'}, ids ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; a save at 300 carried on ${carried ? 'byte for byte' : 'DIFFERENTLY'}; to the card ${r.done} (${H.end?.why}) at tick ${s.clock.tick}, its lane from the fill ${c.pin[0]}`);
        assert(saved === json && !ids.invalid.length && !ids.dangling.length && !g.errors.length && !h.errors.length && carried, JSON.stringify({ same: saved === json, invalid: ids.invalid.slice(0, 3), dangling: ids.dangling.slice(0, 3), errors: g.errors.slice(0, 2), carried }));
        assert(r.done && s.clock.tick === c.pin[0], JSON.stringify({ done: r.done, end: H.end?.why, tick: s.clock.tick, want: c.pin[0] }));
        if (name.endsWith('door-recruit')) {
          console.log(`        v0.0.23: room 2 ${H.rooms[1].state}, passWhy ${H.rooms[1].passWhy ?? '-'}; the one thing ${runSheetOf(s).one?.key ?? '-'}`);
          assert(/Q to the door, S through it, then D/.test(line?.text ?? '') && H.rooms[1].state === 'passed' && H.rooms[1].passWhy === 'door', JSON.stringify({ line: line?.text, leg: H.rooms[1].state, why: H.rooms[1].passWhy }));
        } else {
          console.log(`        v0.0.23: the sterile looks at ${looks.map(ms => `${((ms - old.clock.ms) / 1000).toFixed(2)} s`).join(', ')} after the load, LOAD at ${((loadMs - old.clock.ms) / 1000).toFixed(2)} s`);
          assert(H0.sterile === undefined && looks.length === 2 && loadMs !== null && looks.every(ms => ms <= loadMs), JSON.stringify({ looks, loadMs }));
        }
      }
    },
  },
  {
    name: 'v0.0.24 (its build sheet §2 step 7): two saves made by v0.0.23\'s own code load with nothing written and carry on byte for byte: the private by the keys at his first contact\'s pause in room 2, to his card on his lane\'s tick from the fill, and the bay at 23:00 (heavy: game-upgrade is at its QUICK_SLOW ceiling)',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      const CASES = {
        'v0.0.23-house-room2': { bot: () => houseKeysBot(), pin: [V023_GO_TICK] },
        'v0.0.23-bay': { bot: () => ({}), pin: null },
      };
      for (const [name, c] of Object.entries(CASES)) {
        const json = read(name), old = JSON.parse(json);
        assert(old.meta.version === '0.0.23' && old.meta.seed === 48213, `${name}: ${old.meta.version} ${old.meta.seed}`);
        if (c.pin) {
          const H0 = old.armoury.range.house, S0 = old.stop, T0 = S0?.pick ? old.armoury.range.turners.find(t => t.key === S0.pick) : null;
          assert(old.meta.scenario === 'test-shoothouse' && H0.tier === 'private' && H0.cur === 1 && S0?.mode === 'stop' && S0.phase === 'choose' && S0.via === 'contact' && T0?.room === 'w4.r2', JSON.stringify({ tier: H0.tier, cur: H0.cur, via: S0?.via, pick: S0?.pick }));
        } else assert(old.meta.scenario === 'barracks' && old.places.live.area === 'melas.echo.1', JSON.stringify({ scenario: old.meta.scenario, area: old.places.live.area }));
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), saved = g.save(), ids = checkIds(JSON.parse(saved), g.sim.domains), b = c.bot();
        // (v0.0.24 E: the truth cards' capture (shoothouse.js truthAt) is additive: none on the load, a stand's only after a round of yours at it)
        const loadMs = s.clock.ms, capturedAtLoad = c.pin ? s.armoury.range.turners.filter(T => T.atFirst).length : 0;
        const step = (game, bot, n) => (typeof bot === 'function' ? game.step(n, bot) : game.step(n, {}));
        step(g, b, 300); const mid = g.save(); step(g, b, 300); const end = g.save();
        const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); step(h, c.bot(), 300);
        const carried = h.save() === end;
        let card = '';
        if (c.pin) {
          // (the same lane played straight from GO, no save: the oracle, beside the snapshot's tick)
          const f = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), rf = runHouse(f, houseKeysBot(), { maxMs: 30 * 60_000 });
          const r = runHouse(g, b, { maxMs: 30 * 60_000 });
          const caps = s.armoury.range.turners.filter(T => T.atFirst), early = caps.filter(T => T.atFirst.ms < loadMs || !s.armoury.range.shots.some(x => x.key === T.key && x.atMs >= loadMs && x.atMs <= T.atFirst.ms));
          card = `; to the card ${r.done} (${s.armoury.range.house.end?.why}) at tick ${s.clock.tick}, the lane straight from GO ${rf.done} at ${f.state.clock.tick} (the snapshot's ${c.pin[0]}); captures at the load ${capturedAtLoad}, at the card ${caps.map(T => T.stand).join(', ')} (each after a round of yours fired after the load: ${caps.length - early.length} of ${caps.length})`;
          assert(capturedAtLoad === 0 && caps.length > 0 && !early.length, JSON.stringify({ capturedAtLoad, early: early.map(T => T.key) }));
          assert(r.done && rf.done && s.clock.tick === f.state.clock.tick && s.clock.tick === c.pin[0], JSON.stringify({ done: r.done, tick: s.clock.tick, straight: f.state.clock.tick, want: c.pin[0] }));
        }
        console.log(`      ${name}: ${old.meta.scenario} at tick ${old.clock.tick} (${hm(old.clock.ms)}), ${json.length} bytes; saved again at once ${saved === json ? 'byte for byte' : 'DIFFERENT'}, ids ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; 600 ticks, ${g.errors.length} errors; a save at 300 carried on ${carried ? 'byte for byte' : 'DIFFERENTLY'}${card}`);
        assert(saved === json && !ids.invalid.length && !ids.dangling.length && !g.errors.length && !h.errors.length && carried, JSON.stringify({ same: saved === json, invalid: ids.invalid.slice(0, 3), dangling: ids.dangling.slice(0, 3), errors: g.errors.slice(0, 2), carried }));
      }
    },
  },
];
