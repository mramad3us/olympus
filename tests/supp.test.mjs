// The chaos pooled and the roller's one entry: COMBAT §5.1 to §5.3 from the code (src/sim/combat/supp.js; the build sheet 0.0.9 §2.1, §5.1).
//
// The user (2026-11-07): "suppression should be a roll modifier that picks up on those factors, with "hardening" ... being
// an offset to it". Printed from the code: §5.1's inputs and multipliers, T2 (bangs back to back), T3 (felt and the
// modifier by pool and hardening), T8 (cracks to each band), the decay in closed form against a tick-by-tick reference
// and a lived run against a skip, and every handling and shot roll's list at felt 0, 10, 53 and 98 with its one entry.
// A calm game is the same to the byte: the v0.0.8 save at a test-pairs pause gives v0.0.8's panel, rolls and times
// (CALM_DIGEST, printed by v0.0.8's own code from a worktree at its tag, the same digest of the same JSON).
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { assert, fmt, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { bayGame } from './contact-world.mjs';
import { digest } from '../src/core/hash.js';
import { TICK_MS } from '../src/core/clock.js';
import * as FIREARMS from '../src/sim/arms/firearms.js';
import { doAction, actionMs } from '../src/sim/arms/firearms.js';
import { stepsOf, targetOf } from '../src/sim/arms/shooting.js';
import { aimMsOf, pullMsOf, modsOf, plaqueOf } from '../src/sim/arms/shot.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { checkText } from '../src/sim/skills/checks.js';
import {
  inputPts, inputK, poolAdd, suppAt, feltFrom, feltOf, bandOf, suppMod, suppTimeK, hardOf, blockOf, bang, flashOf, hearingOf, hearsVoice, nerveCheck, suppNow,
  SUPP_MAX, SUPP_GRACE_MS, SUPP_DECAY, PREP_K, EARPRO_K, DEAF_VOICE_M, FLASH_BLIND_MS,
} from '../src/sim/combat/supp.js';

/** v0.0.8's calm panel at the v0.0.8-pairs-pause save: stepsOf, the roller's lists, the aim, the pull, the shot's mods, the plaque and six actions' times (see the header). */
const CALM_DIGEST = '1e1ee51edbb6f3';
const seq = (k, n = 3) => { let s = 0; const a = []; for (let i = 0; i < n; i++) { s = poolAdd(s, 60 * k); a.push(fmt(s, 1)); } return a; };
// (a block written so a person's felt is f at ms: the pool f + H, fresh)
function feltTo(state, pid, f, ms = state.clock.ms) {
  const H = hardOf(state, pid, ms), a = state.actors.list.find(x => x.who === pid);
  a.combat = { supp: f === 0 ? 0 : f + H, suppAtMs: ms, suppRate: SUPP_DECAY.exposed, startleFromMs: null, startleUntilMs: null, blindUntilMs: null, dazzleUntilMs: null, deafUntilMs: null };
  return H;
}
const suppEntries = (list) => (list ?? []).filter(m => m.felt !== undefined);

export default [
  {
    name: 'supp: COMBAT §5.1\'s inputs and multipliers, and T2 from the code: bangs back to back 60 → 90 → 105 unprepared, 36 → 61 → 79 with ear defenders, 15 → 28 → 40 prepared (the pool saturating at 120)',
    fn() {
      const at = [0.5, 1, 2, 3, 5, 10];
      console.log('      the inputs, points by distance (m): ' + at.join(' / '));
      for (const [k, o] of [['crack', {}], ['crack', { heavy: true }], ['subsonic', {}], ['impact', {}], ['muzzle', { indoor: true }], ['muzzle', {}], ['roomShot', { indoor: true }], ['kick', {}], ['blast', {}], ['flash', {}], ['flash', { indoor: true }], ['flash', { indoor: true, next: true }], ['hit', {}], ['friendHit', {}], ['own', {}]])
        console.log(`        ${k}${o.heavy ? ' (heavy)' : ''}${o.indoor ? ' indoors' : ''}${o.next ? ', the next room' : ''}: ${at.map(r => fmt(inputPts(k, { rM: r, ...o }), 1)).join(' / ')}`);
      console.log(`        din: ${inputPts('din', { s: 1 })} a second`);
      const ks = [['flash', {}], ['flash', { prep: 'forewarned' }], ['flash', { prep: 'prepared' }], ['flash', { ears: 'defenders' }], ['flash', { ears: 'suit' }], ['flash', { vacuum: true }], ['crack', { ears: 'defenders' }], ['crack', { vacuum: true }], ['crack', { blanks: true }], ['muzzle', { ears: 'defenders' }], ['hit', { ears: 'defenders' }]];
      console.log(`      k: ${ks.map(([kind, o]) => `${kind} ${Object.entries(o).map(([a, b]) => `${a} ${b}`).join(', ') || 'bare'} ×${inputK({ kind, ...o })}`).join('; ')}`);
      const un = seq(1), ear = seq(EARPRO_K), prep = seq(PREP_K.prepared), fore = seq(PREP_K.forewarned);
      console.log(`      T2: unprepared ${un.join(' → ')}; ear defenders ${ear.join(' → ')}; forewarned ${fore.join(' → ')}; prepared ${prep.join(' → ')}; the ceiling ${SUPP_MAX}`);
      const whole = (a) => a.map(x => Math.round(Number(x))).join();
      assert(whole(un) === '60,90,105' && whole(ear) === '36,61,79' && whole(prep) === '15,28,40', JSON.stringify({ un, ear, prep }));
      assert(inputK({ kind: 'crack', ears: 'defenders' }) === 1 && inputK({ kind: 'flash', ears: 'defenders' }) === EARPRO_K && inputK({ kind: 'flash', vacuum: true }) === 0, 'a crack is not sound-borne; a bang in vacuum is a flash');
      assert(inputPts('flash', { rM: 1.5 }) === 60 && inputPts('crack', { rM: 3 }) === 4 && inputPts('crack', { rM: 5 }) === 0 && inputPts('blast', { rM: 10 }) === 15, 'the table');
    },
  },
  {
    name: 'supp: T3 (felt and the hands-and-eyes modifier by pool and hardening) and T8 (rounds cracking within 1 m to each band, felt rounded as the code reads it) from the code; noise alone never pins a Raider or a tier one (the user\'s answer, 2026-11-07); felt never under 0 or over 100, timeK exactly 1 at felt 0',
    fn() {
      const HS = [0, 7, 17, 36, 45, 60, 75, 95];
      console.log(`      T3, pool \\ H: ${HS.join(' / ')}`);
      for (const p of [20, 40, 60, 80, 100, 120]) console.log(`        ${p}: ${HS.map(H => { const f = feltFrom(p, H); return `${f} ${suppMod(f, 'weapons')?.v ?? 0}`; }).join(' / ')}`);
      const cracksTo = (H, lim) => { let s = 0, n = 0; while (feltFrom(s, H) < lim && n < 200) { s = poolAdd(s, inputPts('crack', { rM: 0.5 })); n++; } return feltFrom(s, H) >= lim ? n : 'never'; };
      const t8 = [0, 7, 17, 28, 36, 45, 60, 75, 95].map(H => `H ${H}: ${[20, 45, 70].map(l => cracksTo(H, l)).join(' / ')}`);
      console.log(`      T8, cracks to under fire / suppressed / pinned: ${t8.join(' · ')}`);
      assert(feltFrom(105, 7) === 98 && feltFrom(105, 95) === 10 && feltFrom(60, 17) === 43 && suppMod(98, 'weapons').v === -10 && suppMod(10, 'weapons').v === -1 && suppMod(98, 'awareness').v === -5 && suppMod(98, 'fitness') === null, 'T3');
      // (COMBAT §5.3's T8 compared the unrounded pool with the band's floor; felt is rounded, so a band is reached half a point
      // sooner: H 36, 45, 60 and 95 a crack or two sooner, and the Raider suppressed after 80 cracks with no decay between)
      console.log('      COMBAT §5.3 printed (unrounded): H 0: 3 / 7 / 13 · H 7: 4 / 9 / 15 · H 17: 6 / 11 / 19 · H 28: 8 / 14 / 25 · H 36: 10 / 17 / 32 · H 45: 12 / 21 / 47 · H 60: 16 / 31 / never · H 75: 23 / never / never · H 95: 47 / never / never');
      assert(t8[0] === 'H 0: 3 / 7 / 13' && t8[2] === 'H 17: 6 / 11 / 19' && cracksTo(75, 70) === 'never' && cracksTo(95, 45) === 'never' && cracksTo(95, 70) === 'never', t8.join(' · '));
      let lo = 100, hi = 0;
      for (let p = -10; p <= 200; p += 7) for (let H = -5; H <= 110; H += 3) { const f = feltFrom(p, H); lo = Math.min(lo, f); hi = Math.max(hi, f); }
      console.log(`      felt over pools −10 to 200 and hardening −5 to 110: ${lo} to ${hi}; timeK at 0, 10, 53, 98, 100: ${[0, 10, 53, 98, 100].map(suppTimeK).join(', ')}`);
      assert(lo === 0 && hi === 100 && suppTimeK(0) === 1 && Object.is(suppTimeK(0), 1) && suppTimeK(100) === 1.5, JSON.stringify({ lo, hi }));
    },
  },
  {
    name: 'supp: the decay in closed form equals a tick-by-tick reference to 0.01, and a pool lived 30 s tick by tick reads what a 30 s skip leaves, the block equal (lived and skipped equal, as the body\'s ledgers)',
    fn() {
      // (the reference: the pool kept tick by tick, falling SUPP_DECAY.exposed a second once SUPP_GRACE_MS has passed)
      const rec = { supp: 105, suppAtMs: 1_000_000, suppRate: SUPP_DECAY.exposed };
      let ref = 105, worst = 0;
      for (let t = rec.suppAtMs + TICK_MS; t <= rec.suppAtMs + 70_000; t += TICK_MS) {
        if (t - rec.suppAtMs > SUPP_GRACE_MS) ref = Math.max(0, ref - SUPP_DECAY.exposed * Math.min(TICK_MS, t - rec.suppAtMs - SUPP_GRACE_MS) / 1000);
        worst = Math.max(worst, Math.abs(ref - suppAt(rec, t)));
      }
      const g1 = createGame({ scenario: 'sandbox', seed: 7 }), g2 = createGame({ scenario: 'sandbox', seed: 7 });
      // (three bangs' pool written as a block, no startle, so the pool is all there is on it)
      for (const g of [g1, g2]) g.me().combat = { supp: 105, suppAtMs: g.state.clock.ms, suppRate: SUPP_DECAY.exposed, startleFromMs: null, startleUntilMs: null, blindUntilMs: null, dazzleUntilMs: null, deafUntilMs: null };
      const t0 = g1.state.clock.ms, pid = g1.state.player.id;
      g1.step(5 * 20); g2.step(5 * 20);
      const mid1 = suppAt(blockOf(g1.state, pid), g1.state.clock.ms);
      g1.step(30 * 20);
      g2.skipNow({ activity: 'idle', planMs: 30_000, mask: 'D' });
      const a = suppAt(blockOf(g1.state, pid), g1.state.clock.ms), b = suppAt(blockOf(g2.state, pid), g2.state.clock.ms);
      console.log(`      closed form against the tick-by-tick reference over 70 s: worst ${worst.toExponential(2)} points; at 10 s ${fmt(suppAt(rec, rec.suppAtMs + 10_000), 2)}, at 30 s ${fmt(suppAt(rec, rec.suppAtMs + 30_000), 2)}, empty after ${fmt((SUPP_GRACE_MS + 105_000 / SUPP_DECAY.exposed) / 1000, 1)} s`);
      const same = JSON.stringify(blockOf(g1.state, pid)) === JSON.stringify(blockOf(g2.state, pid));
      console.log(`      a pool of ${blockOf(g1.state, pid).supp} at T: ${fmt(mid1, 2)} at T + 5 s; lived 30 s more to T + ${(g1.state.clock.ms - t0) / 1000} s reads ${fmt(a, 2)} (felt ${feltOf(g1.state, pid)}); skipped 30 s to T + ${(g2.state.clock.ms - t0) / 1000} s reads ${fmt(b, 2)} (felt ${feltOf(g2.state, pid)}); the blocks ${same ? 'equal' : 'DIFFER'}`);
      assert(worst < 0.01 && g1.state.clock.ms === g2.state.clock.ms && Math.abs(a - b) < 0.01 && same && a > 0 && !g1.errors.length && !g2.errors.length, JSON.stringify({ worst, a, b, t1: g1.state.clock.ms, t2: g2.state.clock.ms }));
    },
  },
  {
    name: 'supp: every handling and shot roll\'s list at felt 0, 10, 53 and 98 carries the chaos as one entry (−1 a 10 felt on Weapon handling and Marksmanship, half on Awareness, none on Fitness), the plaque\'s odds the roll\'s, the times × timeK; PRESSURE_MODS retired and \'fire\' adding nothing',
    fn() {
      const { g, state, pid } = bayGame({ tier: 'private' });
      const gunId = state.people[pid].kit.worn.sling, gun = state.items[gunId], T = { key: 'lane:4', kind: 'turner', x: 1124, z: state.actors.list[0].z, dM: 7 };
      const bad = [];
      for (const f of [0, 10, 53, 98]) {
        const H = feltTo(state, pid, f), r = rollerOf(state, pid), felt = feltOf(state, pid);
        const lists = Object.fromEntries(['weapons', 'marksmanship', 'awareness', 'fitness'].map(k => [k, r.mods(k)]));
        const shot = modsOf(state, pid, { gunId, target: T });
        const one = Object.entries({ ...lists, shot }).map(([k, l]) => [k, suppEntries(l)]);
        for (const [k, e] of one) {
          const want = suppMod(felt, k === 'shot' ? 'marksmanship' : k);
          if (e.length > 1 || (want ? e.length !== 1 || e[0].v !== want.v : e.length)) bad.push({ f, k, e, want });
        }
        console.log(`      felt ${felt} (pool ${f ? f + H : 0} − hardening ${H}, ${bandOf(felt)}): ${one.map(([k, e]) => `${k} ${e.map(m => `${m.why} ${m.v}`).join(', ') || 'none'}`).join(' · ')}; timeK ${r.timeK}; Off safe ${actionMs(r, gun, 'selector:semi')} ms, the reload's seat ${actionMs(r, gun, 'seat')} ms, the aim at 7 m ${aimMsOf(state, pid, gunId, T)} ms, the pull ${pullMsOf(state, pid, gunId).ms} ms`);
        if (f === 0 && (r.timeK !== 1 || felt !== 0)) bad.push({ f, timeK: r.timeK });
      }
      // (one real roll at felt 98, its list as J shows it; 'fire' passed as the pressure adds nothing of its own)
      feltTo(state, pid, 98);
      state.people[pid].kit.carry.posture = 'lowReady';
      const res = doAction(state, g.bus, { pid, gunId, action: 'selector:semi', pressure: 'fire' });
      console.log(`      a roll at felt 98, pressure 'fire': ${checkText(res.roll)}`);
      if (suppEntries(res.roll.mods).length !== 1 || res.roll.mods.some(m => m.v === -3 && m.why === 'under fire')) bad.push({ roll: res.roll.mods });
      console.log(`      firearms.js exports PRESSURE_MODS: ${'PRESSURE_MODS' in FIREARMS ? 'YES' : 'no'}`);
      assert(!('PRESSURE_MODS' in FIREARMS), 'PRESSURE_MODS is retired');
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'supp: a calm game is unchanged to the byte: the v0.0.8 save at a test-pairs pause gives v0.0.8\'s own panel, roller lists, aim, pull, shot mods, plaque and handling times (the digest v0.0.8\'s code printed)',
    fn() {
      const json = gunzipSync(readFileSync(path.join(root, 'tests', 'saves', 'v0.0.8-pairs-pause.json.gz'))).toString('utf8');
      const g = createGame({ scenario: 'test-pairs', seed: 48213 });
      const s = g.load(json), pid = s.player.id, S = s.stop, T = targetOf(s, S.pick, pid), gun = s.items[S.gun], r = rollerOf(s, pid);
      const out = {
        steps: stepsOf(s), mods: ['weapons', 'marksmanship', 'awareness', 'fitness'].map(k => r.mods(k)),
        aim: aimMsOf(s, pid, S.gun, T), pull: pullMsOf(s, pid, S.gun), shot: modsOf(s, pid, { gunId: S.gun, target: T }), plaque: plaqueOf(s, pid, { target: T }),
        acts: ['selector:semi', 'magOut:drop', 'reach', 'seat', 'release', 'charge'].map(a => actionMs(r, gun, a)),
      };
      const text = JSON.stringify(out), d = digest(text);
      console.log(`      ${out.steps.length} rows, ${text.length} characters, digest ${d} (v0.0.8's ${CALM_DIGEST}); the aim ${out.aim} ms, the pull ${out.pull.ms} ms, the handling times ${out.acts.join(', ')} ms; felt ${r.felt}, timeK ${r.timeK}`);
      assert(d === CALM_DIGEST && r.felt === 0 && r.timeK === 1, `${d} against ${CALM_DIGEST}`);
    },
  },
  {
    name: 'supp: the bang\'s physics (COMBAT §11.4; BODY §17.3): facing it, blind 5 s (handling "no light to see it by" −2, once with the dark), side on, dazzled 2 s (Awareness −3), his back to it, nothing; an unprotected ear deafened 1 to 6 h, a voice at the shoulder still heard; hardening touching none of it',
    fn() {
      const rows = [], out = {};
      for (const [face, tier] of [['left', 'recruit'], ['up', 'recruit'], ['right', 'recruit'], ['left', 'tierone']]) {
        const { g, state, pid, me } = bayGame({ tier });
        const w = state.people[pid].kit.worn;
        for (const [slot, id] of Object.entries(w)) if (state.items[id]?.type === 'ears') delete w[slot];
        me.face = face; delete me.headRad;
        const at = state.clock.ms, B0 = { x: me.x - 1.5, z: me.z };
        const fl = flashOf(state, pid, B0);
        bang(state, g.bus, { id: `phys:${face}:${tier}`, ...B0, atMs: at });
        const r = rollerOf(state, pid), wm = r.mods('weapons').filter(m => m.why === 'no light to see it by'), am = r.mods('awareness').filter(m => m.why === 'dazzled');
        const n = suppNow(state, pid), hear = hearingOf(state, pid);
        const voiceNear = hearsVoice(state, pid, { x: me.x, z: me.z + DEAF_VOICE_M - 0.1 }), voiceFar = hearsVoice(state, pid, { x: me.x, z: me.z + 3 });
        out[`${face} ${tier}`] = { fl, wm: wm.length, am: am.length, blind: n.blind, dazzle: n.dazzle, deaf: hear.deaf, voiceNear, voiceFar, H: n.H };
        rows.push(`${tier} facing ${face} (the bang to his west): ${fl ?? 'nothing'}${n.blind ? ` to +${n.blind.untilMs - at} ms (k ${n.blind.k})` : ''}${n.dazzle ? ` to +${n.dazzle.untilMs - at} ms` : ''}; handling ${wm.map(m => `${m.why} ${m.v}`).join(', ') || 'clear'}, Awareness ${am.map(m => `${m.why} ${m.v}`).join(', ') || 'clear'}; deaf ${hear.deaf} (×${hear.k}, ${fmt((hear.untilMs - at) / 3_600_000, 2)} h), a voice at ${DEAF_VOICE_M - 0.1} m ${voiceNear ? 'heard' : 'lost'}, at 3 m ${voiceFar ? 'heard' : 'lost'}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      const L = out['left recruit'], U = out['up recruit'], B = out['right recruit'], T = out['left tierone'];
      assert(L.fl === 'blind' && L.wm === 1 && L.blind?.untilMs && U.fl === 'dazzled' && U.am === 1 && B.fl === null && !B.blind && !B.dazzle, JSON.stringify({ L, U, B }));
      assert(T.fl === 'blind' && T.deaf && L.deaf && L.voiceNear && !L.voiceFar, JSON.stringify({ T, L }));
    },
  },
  {
    name: 'supp: the nerve check (COMBAT §5.3, T9; built for NPCs, called by nothing this round): d20 + Nerve against 1 + round(felt / 5), asked from felt 45; after one bang and three, the recruit, the private, the corporal and the sergeant; the Raider and the tier one never asked',
    fn() {
      const rows = [], cells = {};
      for (const tier of ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']) {
        const g = createGame({ scenario: 'test-pairs', seed: 48213, tier }), s = g.state, pid = s.player.id, H = hardOf(s, pid);
        const c = [60, 105].map(pool => { const felt = feltFrom(pool, H), n = nerveCheck(s, pid, { felt, key: 'test', atMs: s.clock.ms }), h = nerveCheck(s, pid, { felt, help: 2, key: 'test', atMs: s.clock.ms });
          return n.asked ? `felt ${felt}, DC ${n.dc}: ${Math.round(n.odds * 100)}% (${Math.round(h.odds * 100)}% with the call; this roll ${n.roll.total}, ${n.ok ? 'up' : 'down'})` : `felt ${felt}: not asked`; });
        cells[tier] = c;
        rows.push(`${tier} (Nerve ${nerveCheck(s, pid, { felt: 100, key: 'n' }).nerve}): ${c.join(' | ')}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(cells.recruit[0].startsWith('felt 53, DC 12: 55% (65%') && cells.recruit[1].startsWith('felt 98, DC 21: 10% (20%') && cells.private[1].startsWith('felt 88, DC 19: 30%'), JSON.stringify(cells));
      assert(cells.raider.every(c => c.endsWith('not asked')) && cells.tierone.every(c => c.endsWith('not asked')) && cells.private[0].endsWith('not asked'), JSON.stringify(cells));
    },
  },
];
