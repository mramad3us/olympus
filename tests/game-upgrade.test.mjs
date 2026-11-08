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
];
