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
import { houseTBot, houseKeysBot, runHouse, stoppageBot } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { handDeviceOf } from '../src/sim/arms/devices.js';
import { checkIds } from './ids-check.mjs';
import { conditionOf, gunField } from '../src/sim/arms/firearms.js';
import { marsClock } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';

const LON = SITES.melas.lonEDeg, MIN_TICKS = 20 * 60;
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
    name: 'a v0.0.13 save loads (the shoot house\'s rework R1, 2026-11-12: the tier one by T at a contact\'s pause in room 2), its withdrawn rows mapped (R4, COMBAT §25.19.2.2: the lane\'s "Clear the house" carried on as room 2\'s "Clear the room", the #2\'s "Enter" as "In: your corner"), nothing else written: it saves again byte for byte but for the mapping, plays 600 ticks by the T bot with no error, and a save after carries on byte for byte',
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
      const again = norm(JSON.parse(g.save())) === norm(mapped) ? json : null;
      const gun = s.items[s.people[s.player.id].kit.worn.sling], belief = JSON.stringify(gun.belief);
      g.step(300, b); const mid = g.save(); g.step(300, b); const end = g.save();
      const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); h.step(300, houseTBot());
      console.log(`      ${name}: saved in leg ${old.armoury.range.house.cur} at a ${old.stop?.via ?? 'no'} pause, the gun believed ${belief}, ${json.length} bytes; saved again at once ${again === json ? 'byte for byte' : 'DIFFERENT'}; 600 ticks, ${g.errors.length} errors, now leg ${s.armoury.range.house.cur}; carried on from the save after ${h.save() === end ? 'byte for byte' : 'DIFFERENT'}`);
      assert(again === json && !g.errors.length && !h.errors.length && h.save() === end, name);
    },
  },
  {
    name: 'a v0.0.15 save loads (the private by the keys at a contact\'s pause in room 2, made with no sidearm: the house issued it from the Sergeant up) and gains its P-12 (the user, 2026-11-15: "everyone should have the same loadout"): in the holster in Condition 1 on safe as MAKE READY leaves it, its spare in the thigh\'s pouch, its ids new and every item held once, nothing else written; saved and loaded again the same bytes, 600 ticks by the keys with no error, a save after carried on byte for byte',
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
      const now = JSON.parse(g.save()), strip = (o) => { const c = JSON.parse(JSON.stringify(o)); for (const id of mine) delete c.items[id]; delete c.people[pid].kit.worn.holster; delete c.people[pid].kit.worn.thigh; delete c.armoury.range.house.pistol; c.meta.next = null; c.meta.schema = null; return c; };
      const norm = (o) => JSON.stringify(o, (key, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(x => [x, v[x]])) : v));
      const only = norm(strip(now)) === norm(strip(old));
      const twice = createGame({ scenario: old.meta.scenario, seed: 48213 }); twice.load(g.save());
      const same = twice.save() === g.save();
      const b = houseKeysBot();
      g.step(300, b); const mid = g.save(); g.step(300, b); const end = g.save();
      const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); h.step(300, houseKeysBot());
      console.log(`      nothing else written: ${only}; saved and loaded again ${same ? 'byte for byte' : 'DIFFERENT'}; 600 ticks by the keys, ${g.errors.length} errors, now leg ${g.state.armoury.range.house.cur}; carried on from the save after ${h.save() === end ? 'byte for byte' : 'DIFFERENT'}`);
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
    name: 'a v0.0.17 save loads with nothing written (the build sheet 0.0.18 §3.2: the shoot house with the P-12 drawn and the rifle hanging on its click, and a test-pairs standby): it saves again byte for byte at once, plays 600 ticks with no error, a save made after carries on byte for byte, and the house lane reaches its card with the P-12 holstered',
    timeoutMs: 180_000,
    fn() {
      for (const name of ['v0.0.17-house-pistol', 'v0.0.17-pairs-standby']) {
        const json = read(name), old = JSON.parse(json), house = old.meta.scenario === 'test-shoothouse';
        assert(old.meta.version === '0.0.17' && old.meta.scenario === (house ? 'test-shoothouse' : 'test-pairs'), `${name}: ${old.meta.version} ${old.meta.scenario}`);
        // (each by the bot that made it, whose memory is saved on the actor: the house's the honest T bot answering its card with Transition)
        const bot = () => (house ? stoppageBot({ answer: 'transition' }) : pairsBot());
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), again = g.save(), pid = s.player.id, b = bot();
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
        console.log(`      ${name}: ${where}, ${json.length} bytes; saved again at once ${again === json ? 'byte for byte' : 'DIFFERENT'}; 600 ticks, ${g.errors.length} errors; carried on from a save ${carried ? 'byte for byte' : 'DIFFERENT'}${card}`);
        assert(again === json && !g.errors.length && !h.errors.length && carried, JSON.stringify({ same: again === json, errors: g.errors.slice(0, 3), carried }));
      }
    },
  },
  {
    name: 'a v0.0.18 save loads with nothing written (the build sheet 0.0.19 §2 step 7: the flash lane with a G-11 armed in the hand on room 1\'s stack, and a standard lane mid-room 2 with the #2 on his own stoppage): it saves again byte for byte at once with its ids whole, plays 600 ticks with no error, a save made after carries on byte for byte, and the lane reaches its card',
    timeoutMs: 180_000,
    fn() {
      // (each by the bot that made it, whose memory is saved on the actor)
      const BOTS = { 'v0.0.18-house-flash': () => houseKitBot({ use: 'flash' }), 'v0.0.18-house-twodown': () => stoppageBot({ answer: 'gundown' }) };
      for (const [name, bot] of Object.entries(BOTS)) {
        const json = read(name), old = JSON.parse(json), H0 = old.armoury.range.house, pid = old.player.id;
        assert(old.meta.version === '0.0.18' && old.meta.scenario === 'test-shoothouse', `${name}: ${old.meta.version} ${old.meta.scenario}`);
        const g = createGame({ scenario: old.meta.scenario, seed: 48213 }), s = g.load(json), again = g.save(), H = s.armoury.range.house, b = bot();
        const ids = checkIds(JSON.parse(again), g.sim.domains), dev = handDeviceOf(s, pid);
        const where = name.endsWith('flash')
          ? `the ${H.tier} on '${H.loadout}' in leg ${H.cur}, the ${dev?.model ?? 'no device'} ${dev?.st ?? ''} in hand ${dev?.hand ?? '-'}, stop ${s.stop?.mode ?? 'none'}`
          : `the ${H.tier} in leg ${H.cur} (${H.rooms[H.cur]?.state}), the #2 down (${H.two.down?.macro}, his sub-step ${H.two.doing?.i} ${H.two.doing?.list?.[H.two.doing?.i]})`;
        if (name.endsWith('flash')) assert(H.loadout === 'flash' && H.cur === 0 && dev?.model === 'g11' && dev.st === 'armed', JSON.stringify({ loadout: H.loadout, cur: H.cur, dev }));
        else assert(!H0.loadout && H.cur === 1 && H.rooms[1].state === 'entered' && H.two.down && H.two.doing?.cmd === 'down', JSON.stringify({ cur: H.cur, down: H.two.down }));
        g.step(300, b); const mid = g.save(); g.step(300, b); const end = g.save();
        const h = createGame({ scenario: old.meta.scenario, seed: 48213 }); h.load(mid); h.step(300, bot());
        const carried = h.save() === end, run = runHouse(g, b, { maxMs: 10 * 60_000 });
        console.log(`      ${name}: ${where}, ${json.length} bytes; saved again at once ${again === json ? 'byte for byte' : 'DIFFERENT'}, ids ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; 600 ticks, ${g.errors.length} errors; carried on from a save ${carried ? 'byte for byte' : 'DIFFERENT'}; on to the card ${run.done ? 'reached' : 'NOT reached'} in ${fmt(run.ms / 1000, 1)} s more (${g.state.armoury.range.house.end?.why ?? 'no end'})`);
        assert(again === json && !ids.invalid.length && !ids.dangling.length && !g.errors.length && !h.errors.length && carried && run.done, JSON.stringify({ same: again === json, invalid: ids.invalid.slice(0, 3), dangling: ids.dangling.slice(0, 3), errors: g.errors.slice(0, 3), carried, done: run.done }));
      }
    },
  },
];
