// OLYMPUS tests: the fixes of v0.0.28's play and code reviews (.run/v028/fix.md), each failing without its fix.
//
// The play review's: the clearing barrel's ring reached by the DI's own keys from every side (walkVia, finding 1); the serial check's line
// waiting for your name (finding 3); T's Draw reading the right rifle back after the slip (finding 4); "Bleeding" naming what can be done
// (finding 5); the canopy's rows priced once (finding 7); the step panel's line while a command stands (finding 8); no ring under you
// (finding 9); the rank's calls one at a time (finding 10); the card in words (finding 11). The code review's: F173 on the books at the
// lane's end (finding 1); a v0.0.27 'surrender' read as 'give' (finding 6); a magazine at your feet never booked lost (finding 7); a live
// pull's suppressor (finding 8); a clean cut before its assembly no clean (finding 9). Quick: setups, no lane from the fill but the slip's
// window stage.
import { assert } from './helpers.mjs';
import { armGame, untilCmd, toStation, act, armOf } from './armoury-world.mjs';
import { armouryTBot } from './bots/armoury.mjs';
import { laneOf, gauges } from './flawless-armoury.mjs';
import { armouryNow, armouryOf, armouryPressOf, armouryLook, CHECK_GAP_MS } from '../src/sim/scenarios/armoury-day.js';
import { armouryStepOf } from '../src/sim/skills/instinct/armoury.js';
import { serialOf } from '../src/sim/arms/armoury.js';
import { upgradeChoiceGive, weaponsDomain as ARMS } from '../src/sim/arms/domain.js';
import { pull } from '../src/sim/arms/firearms.js';
import { FOUL_SUPP_K } from '../src/sim/arms/upkeep.js';
import { move } from '../src/sim/arms/kit.js';
import { woundLine } from '../src/sim/body/cues.js';
import { timeTextOf } from '../src/ui/kit/list.js';
import { spokenMs } from '../src/core/speech.js';
import { stream } from '../src/core/rng.js';
import { createGame } from './game.mjs';

const KEY = Object.freeze({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] });
// (the keys a line's direction names, "up and left (Z and Q)", as a player presses them)
const keysOf = (dir) => { let mx = 0, mz = 0; for (const w of String(dir).replace(/ \(.*$/, '').split(' and ')) { mx += KEY[w][0]; mz += KEY[w][1]; } return { mx, mz }; };

export default [
  {
    name: 'the clearing barrel\'s ring is reached by the keys the DI names, from the canopy\'s side, straight behind the drum and either flank (the play review of v0.0.28, finding 1: "up (Z)" into the drum, 1.3 m short until the armourer cleared it at 60 s)',
    fn() {
      const out = [];
      for (const [x, z] of [[456.63, 216.5], [456.6, 214.3], [458.9, 222.3], [452, 219], [462, 218]]) {
        const g = armGame({ setup: 'turnin' });
        untilCmd(g, 'barrel');
        const me = g.me(); me.x = x; me.z = z; me.$px = x; me.$pz = z;
        let t = 0;
        for (; t < 600 && !armouryNow(g.state).at; t++) { const s = armouryStepOf(g.state, me); g.step(1, s?.id === 'arm-walk' ? keysOf(s.dir) : {}); }
        out.push({ from: [x, z], at: armouryNow(g.state).at, ticks: t, stood: [Math.round(me.x * 100) / 100, Math.round(me.z * 100) / 100], slow: armouryNow(g.state).faults.includes('slow') });
      }
      for (const o of out) console.log(`      from ${o.from.join(', ')}: ${o.at ? `on the ring in ${o.ticks} ticks` : `STUCK at ${o.stood.join(', ')}`}`);
      assert(out.every(o => o.at && !o.slow && o.ticks < 400), JSON.stringify(out));
    },
  },
  {
    name: 'the serial check\'s line waits for your name ("wait for your name", no key) while the rank calls, then names R (the play review of v0.0.28, finding 3: "R: Call your serial" for 14.4 s while R did nothing)',
    fn() {
      const g = armGame({ setup: null });
      const bot = armouryTBot(); let wait = null, call = null;
      for (let t = 0; t < 6000 && !call; t++) {
        const N = armouryNow(g.state);
        if (N.cmd === 'serials' && !N.next && !N.busy) {
          const A = armOf(g), p = armouryPressOf(g.state, 'serials');
          if (!A.check?.you && N.at) wait ??= p;
          if (A.check?.you && N.at && !A.called) call = p;
        }
        g.step(1, bot);
      }
      console.log(`      before your name: "${wait}"; at it: "${call}"`);
      assert(wait === 'wait for your name' && /^R: Call your serial$/.test(call ?? ''), JSON.stringify({ wait, call }));
    },
  },
  {
    name: 'the rank\'s calls come one at a time, each its serial\'s last three digits, the next after the last is said (spokenMs), so one bubble stands over the rank (the play review of v0.0.28, finding 10: eleven calls in 14 s)',
    fn() {
      const g = armGame({ setup: null }), bot = armouryTBot(), calls = [];
      let seen = 0;
      for (let t = 0; t < 6000; t++) {
        g.step(1, bot);
        const F = g.facts('say');
        for (; seen < F.length; seen++) if (armouryNow(g.state).cmd === 'serials' && F[seen].who !== armOf(g).leaderId && F[seen].who !== g.state.player.id) calls.push({ atMs: g.state.clock.ms, text: F[seen].text });
        if (armOf(g).called) break;
      }
      const overlaps = calls.slice(1).filter((c, k) => c.atMs < calls[k].atMs + spokenMs(calls[k].text));
      console.log(`      ${calls.length} calls over ${((calls.at(-1).atMs - calls[0].atMs) / 1000).toFixed(1)} s, the gap ${CHECK_GAP_MS} ms: ${calls.slice(0, 3).map(c => `"${c.text}"`).join(', ')}…; overlapping ${overlaps.length}`);
      assert(calls.length >= 6 && !overlaps.length && calls.every(c => c.text.split(/\s+/).length <= 4), JSON.stringify({ calls, overlaps }));
    },
  },
  {
    name: 'T\'s Draw reads the right rifle back after the slip: the corporal on 48213 by T signs the rifle on his card, read, the card\'s window "serial read back" (the play review of v0.0.28, finding 4: the bundle showed and signed the replacement unread)',
    fn() {
      const g = armGame({ seed: 48213, tier: 'cpl' }), bot = armouryTBot();
      for (let t = 0; t < 6000 && !(armOf(g).signed && armouryNow(g.state).cmd !== 'window'); t++) g.step(1, bot);
      const A = armOf(g), aspect = armouryNow(g.state).card.aspects.find(a => a[0] === 'window')[1];
      console.log(`      slip ${A.slip}, caught ${!!A.slipCaught}; signed ${A.signed === A.gunId ? 'his own' : A.signed}, read ${A.read} as ${A.readAs} (his ${serialOf(g.state, A.gunId)}); "${aspect}"`);
      assert(A.slip && A.slipCaught && A.signed === A.gunId && A.read && A.readAs === serialOf(g.state, A.gunId) && aspect.startsWith('serial read back'), JSON.stringify({ slip: A.slip, read: A.read, readAs: A.readAs, aspect }));
    },
  },
  {
    name: 'a bleed under the tourniquet\'s names nothing to press: the line says the corpsman will see to it, never "press on it" or "keep pressure on" (the play review of v0.0.28, finding 5: "Bleeding: press on it." named no key and no row did it)',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 }), s = g.state, ms = s.clock.ms, rec = s.people[s.player.id].body;
      rec.blood = 100; rec.bloodMs = ms;
      rec.injuries = [{ part: 'armL', kind: 'cut', name: 'a cut on the left forearm', where: 'left forearm', ms, until: ms + 864000000, bleed: ms + 3600000, rate: 1.2 }];
      const a = woundLine(rec, ms)?.text ?? '';
      rec.injuries[0].rate = 0.3;
      const b = woundLine(rec, ms)?.text ?? '';
      console.log(`      1.2 %/min: "${a}"; 0.3 %/min: "${b}"`);
      assert(a && b && ![a, b].some(t => /press on it|keep pressure/i.test(t)) && /corpsman/.test(a) && /corpsman/.test(b), JSON.stringify({ a, b }));
    },
  },
  {
    name: 'the canopy\'s rows price each choice once: the words the row\'s name, the R menu\'s time column its minutes and its spotless chance (the play review of v0.0.28, finding 7: "CLEAN, RUSHED · 50% SPOTLESS · 20 MIN · 50% SPOTLESS")',
    fn() {
      const g = armGame({ setup: 'canopy' });
      untilCmd(g, 'clean'); toStation(g); g.step(1);
      const rows = armouryNow(g.state).rows.map(r => `${r.words} · ${timeTextOf(r)}`);
      console.log(`      ${rows.join(' | ')}`);
      assert(rows.length === 3 && rows.every(t => (t.match(/spotless/g) ?? []).length === 1 && / min · \d+% spotless$/.test(t)), JSON.stringify(rows));
    },
  },
  {
    name: 'with the step panel open on the lane the DI names its UNLOAD, SHOW CLEAR (T chooses it), never "Wait" under a standing command (the play review of v0.0.28, finding 8)',
    fn() {
      const g = armGame({ setup: 'lane' });
      untilCmd(g, 'lane'); toStation(g);
      g.step(1, { act: ['ready'] });
      for (let t = 0; t < 40 && g.state.stop?.phase !== 'choose'; t++) g.step(1);
      const s = armouryStepOf(g.state, g.me());
      console.log(`      in the panel: ${s?.id} ${s?.variant} act ${s?.act}`);
      assert(g.state.stop?.mode === 'stop' && s?.id === 'arm-cmd' && s.act === 'stop:macro:clear', JSON.stringify(s));
    },
  },
  {
    name: 'no yellow ring under you: on your table the ring is gone, so it never lies over the mat in the clean\'s splash (the play review of v0.0.28, finding 9)',
    fn() {
      const g = armGame({ setup: 'canopy' });
      untilCmd(g, 'clean');
      const off = armouryLook(g.state);
      toStation(g); g.step(1);
      const on = armouryLook(g.state);
      console.log(`      off the table: ${JSON.stringify(off?.station ?? null)}; on it: ${JSON.stringify(on?.station ?? null)}`);
      assert(off?.station && !on, JSON.stringify({ off, on }));
    },
  },
  {
    name: 'the card in words: a range rule\'s fault by the range\'s words (no "uprange"), the armourer\'s verdict with no number, the far cases along the line (the play review of v0.0.28, finding 11)',
    fn() {
      const g = armGame({ setup: 'turnin' }), R = armouryOf(g.state), A = R.arm;
      R.faults.push({ rule: 'uprange', kind: 'stop', atMs: g.state.clock.ms });
      A.inspections.push({ atMs: g.state.clock.ms, verdict: 'pass', total: 0.021, dc: 10, roll: 12 });
      A.relay = { ...(A.relay ?? {}), far: 3, farM: 6.1 };
      const lines = armouryNow(g.state).card.lines;
      console.log(`      ${lines.slice(1).join(' | ')}`);
      const text = lines.join(' ');
      assert(/the muzzle uprange/.test(text) && !/; uprange|: uprange|dirt \d/.test(text) && /The armourer: passed it\./.test(text) && /along the line/.test(text) && !/down the line/.test(text), JSON.stringify(lines));
    },
  },
  {
    name: 'F173 reads the books at the lane\'s end: a round taken off the books after the declaration is a gap, where the declaration\'s own record could never show one (the code review of v0.0.28, finding 1)',
    fn() {
      const tamper = (inner) => (state, me, mem) => {
        if (!mem.tampered) { const R = armouryOf(state), line = state.armoury.ammoIssues.find(a => a.id === R.issueId); if (line) { line.back = (line.back ?? 0) - 1; mem.tampered = true; } }
        return inner(state, me, mem);
      };
      const honest = laneOf({ seed: 48213, tier: 'private', setup: 'canopy' }), lost = laneOf({ seed: 48213, tier: 'private', setup: 'canopy', bot: tamper(armouryTBot()) });
      const G = gauges([honest, lost]);
      console.log(`      honest ${JSON.stringify(honest.sums)}; a round off the books ${JSON.stringify(lost.sums)}; F173 off ${G.F173.length}`);
      assert(honest.done && lost.done && honest.sums.gap === 0 && lost.sums.gap === 1 && G.F173.length === 1 && G.F173[0] === lost, JSON.stringify({ honest: honest.sums, lost: lost.sums }));
    },
  },
  {
    name: 'a save of v0.0.27 holding the security table\'s \'surrender\' loads as \'give\': the man\'s choice and both cards\' tracks, an upgrade of the arms domain\'s (the code review of v0.0.28, finding 6)',
    fn() {
      const s = { armoury: { range: { turners: [{ live: { choice: { what: 'surrender', band: 3, atMs: 5 } } }, { live: { choice: { what: 'cover' } } }],
        house: { boarding: { track: { '2a': [{ atMs: 5, what: 'surrender' }, { atMs: 6, st: 'hands' }] } }, bangGo: { track: { k1: [[5, 'choice', 'surrender', 3, null], [6, 'hands']] } } } } } };
      upgradeChoiceGive(s);
      const R = s.armoury.range, ids = ARMS.upgrades.map(([id]) => id);
      console.log(`      choices ${R.turners.map(T => T.live.choice.what).join(', ')}; boarding ${R.house.boarding.track['2a'][0].what}; bang ${R.house.bangGo.track.k1[0][2]}; upgrades ${ids.join(', ')}`);
      assert(R.turners[0].live.choice.what === 'give' && R.turners[1].live.choice.what === 'cover' && R.house.boarding.track['2a'][0].what === 'give' && R.house.bangGo.track.k1[0][2] === 'give' && ids.includes('arms:choice-give'), JSON.stringify(s));
    },
  },
  {
    name: 'a magazine at your feet at the window is counted, never booked lost (WEAPONS §10.6\'s rule, armoury.js lostOf: within 10 m of you) (the code review of v0.0.28, finding 7)',
    fn() {
      const g = armGame({ setup: 'turnin' }), s = g.state, A = armOf(g);
      untilCmd(g, 'barrel'); toStation(g); act(g, 'barrel');
      untilCmd(g, 'handIn'); toStation(g); g.step(1);
      const me = g.me(), drop = A.mags.find(id => s.items[id]);
      move(s, drop, { ground: { area: s.places.live.area, x: me.x + 0.3, z: me.z + 0.2 } });
      act(g, 'handIn');
      for (let t = 0; t < 400 && armOf(g).inspections.length === 0; t++) g.step(1);
      const N = armouryNow(g.state), said = g.facts('say').map(f => f.text).slice(-4);
      console.log(`      inspections ${A.inspections.length}; lost ${(s.armoury.lost ?? []).length}; faults ${N.faults.join(', ') || 'none'}; said ${said.map(t => `"${t}"`).join(', ')}`);
      assert(A.inspections.length === 1 && !(s.armoury.lost ?? []).length && !N.faults.includes('lost'), JSON.stringify({ lost: s.armoury.lost, faults: N.faults }));
    },
  },
  {
    name: 'a live pull through a suppressor fouls the gun FOUL_SUPP_K times a bare one\'s (WEAPONS §9.1; the code review of v0.0.28, finding 8: the flag was never passed)',
    fn() {
      const one = (suppressor) => {
        const gun = { type: 'gun', model: 'r7', cond: 0.95, foul: 0, mode: 'semi', chamber: 'live', belief: { chamber: 'live' } }, mag = { type: 'mag', fam: 'had30', n: 30, load: 'ball', cond: 0.95 };
        const r = pull(stream(48213, 'fixer-v028', 'supp'), gun, mag, { live: true, ms: 0, air: null, suppressor });
        return { fired: r.fired, foul: gun.foul };
      };
      const bare = one(false), supp = one(true);
      console.log(`      bare ${JSON.stringify(bare)}; suppressed ${JSON.stringify(supp)}; K ${FOUL_SUPP_K}`);
      assert(bare.fired && supp.fired && bare.foul > 0 && Math.abs(supp.foul / bare.foul - FOUL_SUPP_K) < 0.01, JSON.stringify({ bare, supp }));
    },
  },
  {
    name: 'a clean that ends before its assembly (cleanEnd never rolled) is no clean: the command stands, no bench on the card (the code review of v0.0.28, finding 9)',
    fn() {
      const g = armGame({ setup: 'canopy' }), A = armOf(g), R = armouryOf(g.state);
      untilCmd(g, 'clean'); toStation(g); g.step(1);
      const gun = g.state.items[A.given ?? A.gunId];
      A.cleaning = { tempo: 'normal', again: false, ms: 1, fromMs: g.state.clock.ms, i: R.cmd.i, cleans: gun.cleans ?? 0 };
      g.step(2);
      console.log(`      cleans recorded ${A.cleans.length}; cleanedAt ${A.cleanedAt}; the command ${armouryNow(g.state).cmd}`);
      assert(A.cleans.length === 0 && A.cleanedAt === null && armouryNow(g.state).cmd === 'clean', JSON.stringify({ cleans: A.cleans, cleanedAt: A.cleanedAt }));
    },
  },
];
