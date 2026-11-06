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
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { bodyOf } from '../src/sim/body/body.js';
import { stagesOf } from '../src/sim/body/cues.js';
import { BODY_V } from '../src/sim/body/record.js';
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
];
