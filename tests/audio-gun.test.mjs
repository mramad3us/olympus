// The gunshot rebuilt (v0.0.16, quick, in node): src/ui/audio/gun.js, mix.js, the steps' trim and the engine's two sounds.
//
// The user, 2026-11-15: "Sound design is pretty weak, guns should bang harder and closer to realistic, I'm sure you can figure
// out how to do that, steps are too loud". Measured without anyone listening (VIEWS §11.5's way): the blast's first 5 ms the
// loudest, its rise within a tenth of a millisecond, broadband; the R-7 and the P-12 told apart by their body, their brightness
// and their action's clacks at their own times; the shoot house's answer dense in its first tens of ms with a short tail (RT60
// near 0.55 s), the ranges' longer, drier and later; the electronic protection (the suit's, the defenders') clamping the level
// but keeping the attack hard and first; another's shot by distance and side, a sound's way late; the new master holding a
// burst of open shots under full scale; the steps well under the shots, the Careful walk under the Fast; &sound=old the old
// sound whole; and the engine on a stand-in AudioContext playing each sound's voices on its own graph. Every number printed.
// v0.0.21: engineOn is exported for tests/audio-bake.test.mjs, the bake in slices (this file's CPU, QUICK_SLOW's 5.1 s, is full).
import { assert, near, fmt } from './helpers.mjs';
import { renderDry, renderTail, protect, gunBakes, ownShot, otherShot, echoShot, spaceOf, loudDb, shotKey, GUNS, SPACES, PROTECT, PROTECT_AT, OWN_DB, GUN_RATE_HZ, TAIL_RATE_HZ, TAIL_FAR_MIN_DB } from '../src/ui/audio/gun.js';
import { mixdown, master, levels, MASTER, MASTER_OLD, CLIP_LIMIT, makeupDb, clipCurve } from '../src/ui/audio/mix.js';
import { render, measure } from '../src/ui/audio/synth.js';
import { stepVoice, stepTrimDb, STEP_TRIM_DB, STANCE_STEP_DB } from '../src/ui/audio/steps.js';
import { reportVoice, gunSpaceOf } from '../src/ui/audio/range.js';
import { createAudio, soundModeOf } from '../src/ui/audio/engine.js';
import { STEPS, RANGE, ROLLOFF, SHOT_IDS, SHOT_CANDIDATES, shotFor } from '../src/data/sounds.js';
import { createGame } from './game.mjs';
import { playerActor, playerId } from '../src/core/ids.js';

const SR = GUN_RATE_HZ, db = (v) => (v > 0 ? 20 * Math.log10(v) : -Infinity);
// (a window's peak and RMS, dB against the buffer's full scale)
function win(buf, sr, fromS, toS) {
  let p = 0, s = 0, n = 0;
  for (let i = Math.max(0, Math.round(fromS * sr)); i < Math.min(buf.length, Math.round(toS * sr)); i++) { p = Math.max(p, Math.abs(buf[i])); s += buf[i] * buf[i]; n++; }
  return { peakDb: db(p), rmsDb: db(Math.sqrt(s / Math.max(1, n))) };
}
// (the share of a buffer's energy under hz: a one-pole split)
function lowShare(buf, sr, hz) {
  const a = Math.exp(-2 * Math.PI * hz / sr);
  let y = 0, lo = 0, all = 0;
  for (let i = 0; i < buf.length; i++) { y = (1 - a) * buf[i] + a * y; lo += y * y; all += buf[i] * buf[i]; }
  return lo / all;
}
const bakes = (() => { const G = {}; for (const b of gunBakes()) for (let v = 0; v < b.variants; v++) { const it = b.steps(v, GUN_RATE_HZ, TAIL_RATE_HZ); let r; do r = it.next(); while (!r.done); (G[b.key] ??= []).push(r.value); } return G; })();
const asVoice = (x, atS = 0) => ({ samples: bakes[x.key][0], sampleRate: bakes[x.key][0].left ? TAIL_RATE_HZ : GUN_RATE_HZ, atS: atS + (x.delayS ?? 0), gainDb: x.gainDb, lowHz: x.lowHz, pan: x.pan, rate: x.rate });
const HOUSE_AIR = Object.freeze({ pKpa: 66, soundMs: 339.4 }), GROUND_AIR = Object.freeze({ pKpa: 65.9, soundMs: 321.6 });

// ---- a stand-in AudioContext: the graph as plain objects, the sources it starts recorded ----
const param = (v = 0) => ({ value: v, setValueAtTime(x) { this.value = x; }, setTargetAtTime(x) { this.value = x; }, cancelScheduledValues() {} });
class FakeNode { constructor(ctx, kind) { this.ctx = ctx; this.kind = kind; this.outs = []; } connect(n) { this.outs.push(n); return n; } disconnect() { this.outs = []; } }
class FakeContext {
  constructor() { this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 48000; this.destination = new FakeNode(this, 'destination'); this.started = []; this.made = []; }
  mk(kind, extra = {}) { const n = Object.assign(new FakeNode(this, kind), extra); this.made.push(n); return n; }
  resume() { this.state = 'running'; this.onstatechange?.(); return Promise.resolve(); }
  close() { this.state = 'closed'; }
  createGain() { return this.mk('gain', { gain: param(1) }); }
  createBiquadFilter() { return this.mk('biquad', { type: 'lowpass', frequency: param(350), Q: param(1) }); }
  createDynamicsCompressor() { return this.mk('compressor', { threshold: param(-24), knee: param(30), ratio: param(12), attack: param(0.003), release: param(0.25) }); }
  createConvolver() { return this.mk('convolver', { normalize: true, buffer: null }); }
  createStereoPanner() { return this.mk('panner', { pan: param(0) }); }
  createWaveShaper() { return this.mk('shaper', { curve: null, oversample: 'unset' }); }
  createBuffer(ch, len, sr) { const data = Array.from({ length: ch }, () => new Float32Array(len)); return { numberOfChannels: ch, length: len, sampleRate: sr, getChannelData: (i) => data[i], copyToChannel: (src, i) => data[i].set(src) }; }
  createBufferSource() { const ctx = this; return this.mk('source', { buffer: null, loop: false, playbackRate: param(1), start(t) { ctx.started.push({ src: this, at: t }); }, stop() {} }); }
}
// (where a node's outputs lead: the kinds along the first path to the destination)
const pathOf = (n) => { const out = []; let x = n; for (let i = 0; i < 24 && x; i++) { out.push(x.kind); x = x.outs[0]; } return out; };
// (v0.0.24: no voice argument: the voice synthesis is gone, the user's "forget voice synthesis, no voices." of 2026-11-19)
export function engineOn(sound, looks = {}) {
  let ctx = null;
  const Klass = function () { ctx = new FakeContext(); return ctx; };
  const audio = createAudio({ sound, looks, AudioContextClass: Klass });
  audio.prepare(); audio.start();
  let frames = 0, worstMs = 0;
  while (!audio.stats.baked && frames < 5000) { const t0 = performance.now(); audio.frame(null); worstMs = Math.max(worstMs, performance.now() - t0); frames++; }
  return { audio, ctx, frames, worstMs };
}
function shotFact(state, { gun = null, who = null, muzzle = null } = {}) {
  const a = playerActor(state), pid = who ?? playerId(state);
  const gunId = gun ?? Object.entries(state.items).find(([, it]) => it.model === 'r7')?.[0];
  return { id: 'test-shot', who: pid, gun: gunId, atMs: state.clock.ms, fired: true, muzzle: muzzle ?? [a.x + 0.9, a.z], dirRad: 0, flight: { rangeM: 7, tofS: 0.01, vMs: 760, supersonic: true }, brass: null };
}

export default [
  {
    name: 'the blast (gun.js renderDry): its first 5 ms the loudest, the rise to its peak within 0.1 ms, broadband; the same samples twice, its variants different',
    fn() {
      for (const gun of ['r7', 'p12']) {
        const a = renderDry(gun), b = renderDry(gun), c = renderDry(gun, { variant: 1 });
        let at = 0, p = 0, on = -1;
        a.forEach((v, i) => { if (Math.abs(v) > p) { p = Math.abs(v); at = i; } });
        for (let i = 0; i < a.length; i++) if (Math.abs(a[i]) > 0.1 * p) { on = i; break; }
        const w5 = win(a, SR, 0, 0.005), w20 = win(a, SR, 0.005, 0.02), rest = win(a, SR, 0.02, 1), m5 = measure(a.slice(0, Math.round(0.005 * SR)), SR);
        const same = a.every((v, i) => v === b[i]), differ = a.some((v, i) => v !== c[i]);
        console.log(`      ${gun}: the peak at ${fmt(at / SR * 1000, 3)} ms (rise ${fmt((at - on) / SR * 1000, 3)} ms); 0 to 5 ms ${fmt(w5.peakDb)} / ${fmt(w5.rmsDb)} dB (peak / RMS), 5 to 20 ms ${fmt(w20.peakDb)} / ${fmt(w20.rmsDb)}, after ${fmt(rest.peakDb)} / ${fmt(rest.rmsDb)}; the first 5 ms' centroid ${fmt(m5.centroidHz, 0)} Hz; same twice ${same}, variants differ ${differ}`);
        assert(at / SR <= 0.005 && (at - on) / SR <= 0.0001 && w5.peakDb > w20.peakDb && w5.peakDb > rest.peakDb && w5.rmsDb > rest.rmsDb, JSON.stringify({ gun, at, on, w5, w20, rest }));
        assert(m5.centroidHz > 1500 && same && differ, JSON.stringify({ gun, centroid: m5.centroidHz, same, differ }));
      }
    },
  },
  {
    name: 'the R-7 and the P-12 told apart: the rifle\'s body heavier (more of it under 200 Hz) and longer, the pistol brighter and shorter; each action\'s clacks at their own times, heard over 2 kHz after the blast (the R-7\'s carrier into its buffer at 34 ms and home at 74 ms, the P-12\'s slide at its stop at 14 ms and home at 38 ms); the P-12 2.9 dB under by its loudness',
    fn() {
      const r = renderDry('r7'), p = renderDry('p12'), mr = measure(r, SR), mp = measure(p, SR), lr = lowShare(r, SR, 200), lp = lowShare(p, SR, 200);
      // (the clacks are steel's: heard over 2 kHz, where the blast's body has died and the thump never was)
      const hp = (buf) => { const a = Math.exp(-2 * Math.PI * 2000 / SR), out = new Float32Array(buf.length); let y = 0, xp = 0; for (let i = 0; i < buf.length; i++) { y = a * (y + buf[i] - xp); xp = buf[i]; out[i] = y; } return out; };
      const clacks = (gun, raw) => GUNS[gun].mech.filter(e => e.db >= -24 && e.atMs >= 12).map(e => {
        const buf = hp(raw), t = e.atMs / 1000, here = win(buf, SR, t, t + 0.003), before = win(buf, SR, t - 0.004, t - 0.001);
        return { atMs: e.atMs, upDb: Math.round((here.peakDb - before.peakDb) * 10) / 10 };
      });
      const cr = clacks('r7', r), cp = clacks('p12', p);
      console.log(`      R-7: centroid ${fmt(mr.centroidHz, 0)} Hz, under 200 Hz ${fmt(lr * 100)}% of its energy, ${fmt(mr.durS * 1000, 0)} ms (decay ${fmt(mr.decayS * 1000, 0)} ms); its clacks over the 3 ms before ${JSON.stringify(cr)}`);
      console.log(`      P-12: centroid ${fmt(mp.centroidHz, 0)} Hz, under 200 Hz ${fmt(lp * 100)}%, ${fmt(mp.durS * 1000, 0)} ms (decay ${fmt(mp.decayS * 1000, 0)} ms); its clacks ${JSON.stringify(cp)}; loudness ${fmt(loudDb('p12'))} dB against the R-7`);
      assert(lr > lp && mp.centroidHz > mr.centroidHz && mp.durS < mr.durS && mp.decayS < mr.decayS, JSON.stringify({ lr, lp, mr, mp }));
      assert(cr.every(c => c.upDb >= 3) && cp.every(c => c.upDb >= 3) && cr.length >= 2 && cp.length >= 2, JSON.stringify({ cr, cp }));
      near(loudDb('p12'), -2.92, 0.01, 'the P-12 by its loud 1.0 against the R-7\'s 1.4');
      // (the action is your own gun's alone: another's shot has none, and a subsonic one no crack)
      const far = renderDry('r7', { part: 'far' }), sub = renderDry('r7', { crack: false });
      assert(far.length < r.length && sub.some((v, i) => v !== r[i]), 'far and subsonic differ');
    },
  },
  {
    name: 'the space\'s answer (renderTail): the shoot house dense in its first tens of ms (its reflections off the panels) with a short tail (its diffuse RT60, T20 from 0.1 s, 0.55 s ±20%), the 25 m bay and the 300 m line drier early and rolling later and longer, the open\'s the longest',
    fn() {
      const out = {};
      for (const space of ['room', 'bay', 'open']) {
        const T = renderTail('r7', space), m = T.left.map((v, i) => (v + T.right[i]) / 2), sr = TAIL_RATE_HZ;
        const e = (a, b) => { let s = 0; for (let i = Math.round(a * sr); i < Math.min(m.length, b * sr); i++) s += m[i] * m[i]; return s; };
        // (the Schroeder integral's fall from −5 to −25 dB, ×3: T20)
        const tot = e(0.1, 9), sch = [];
        let acc = tot;
        for (let i = Math.round(0.1 * sr); i < m.length; i++) { sch.push(10 * Math.log10(Math.max(1e-12, acc / tot))); acc -= m[i] * m[i]; }
        const t5 = sch.findIndex(v => v <= -5), t25 = sch.findIndex(v => v <= -25), t20 = t5 >= 0 && t25 > t5 ? 3 * (t25 - t5) / sr : null;
        let last = 0;
        const peak = Math.max(...m.map(Math.abs));
        for (let i = m.length - 1; i > 0; i--) if (Math.abs(m[i]) >= peak * 10 ** (-50 / 20)) { last = i / sr; break; }
        // (the two ears apart: over the room's reflections from 20 ms, over the ranges' rolling echo from 200 ms (the ground's bounce is in front))
        const corr = (() => { let lr = 0, ll = 0, rr = 0; for (let i = Math.round((space === 'room' ? 0.02 : 0.2) * sr); i < T.left.length; i++) { lr += T.left[i] * T.right[i]; ll += T.left[i] ** 2; rr += T.right[i] ** 2; } return lr / Math.sqrt(ll * rr); })();
        const all = e(0, 9);
        out[space] = { early: 10 * Math.log10(e(0.003, 0.09) / all), late: 10 * Math.log10(e(0.25, 9) / all), t20, lastS: last, corr };
        console.log(`      ${space}: the first 90 ms ${fmt(out[space].early)} dB of the tail's energy, after 250 ms ${fmt(out[space].late)} dB; T20 ${t20 === null ? 'n/a' : fmt(t20, 2) + ' s'}; the last sound 50 dB under its peak at ${fmt(last, 2)} s; left and right correlated ${fmt(corr, 2)}`);
      }
      assert(out.room.t20 > 0.44 && out.room.t20 < 0.66, `the room's RT60 ${out.room.t20}`);
      assert(out.room.early > out.bay.early && out.room.early > out.open.early, JSON.stringify(out));
      assert(out.bay.late > out.room.late && out.open.late > out.room.late, JSON.stringify(out));
      assert(out.open.lastS > out.bay.lastS && out.bay.lastS > out.room.lastS && out.room.lastS < 0.9, JSON.stringify(out));
      assert(out.room.corr < 0.9 && out.open.corr < 0.9, 'the two ears hear the space apart');
      assert(SPACES.room.lenS < SPACES.bay.lenS && SPACES.bay.lenS < SPACES.open.lenS, 'lengths');
    },
  },
  {
    name: 'the electronic protection (the suit\'s active hearing, the defenders): the level clamped at its clip and the crest flattened (clipped dense), but the attack still hard (the peak within 0.5 ms) and the first 5 ms still the loudest; the room\'s answer no louder at first, then as it was; the same samples twice',
    fn() {
      for (const gun of ['r7', 'p12']) {
        const ref = OWN_DB + loudDb(gun), open = renderDry(gun), T = renderTail(gun, 'room'), P = protect({ dry: open, tail: T, refDb: ref }), Q = protect({ dry: open, tail: T, refDb: ref });
        const d = P.dry, lim = 10 ** (PROTECT.ceilingDb / 20) * PROTECT.clipK;
        let at = 0, p = 0;
        d.forEach((v, i) => { if (Math.abs(v) > p) { p = Math.abs(v); at = i; } });
        const crest = (b) => { const w = win(b, SR, 0, 0.02); return w.peakDb - w.rmsDb; };
        const w5 = win(d, SR, 0, 0.005), wAfter = win(d, SR, 0.005, 1), t0 = win(T.left, TAIL_RATE_HZ, 0, 0.05), pt0 = win(P.tail.left, TAIL_RATE_HZ, 0, 0.05), t1 = win(T.left, TAIL_RATE_HZ, 0.3, 0.6), pt1 = win(P.tail.left, TAIL_RATE_HZ, 0.3, 0.6);
        const same = d.every((v, i) => v === Q.dry[i]);
        console.log(`      ${gun}: the peak ${fmt(db(p))} dB against the open shot's 0 (the ceiling ${PROTECT.ceilingDb} dB, the clip's limit ${fmt(db(lim))}), at ${fmt(at / SR * 1000, 2)} ms; crest over 20 ms ${fmt(crest(d))} dB (open ${fmt(crest(open))}); 0 to 5 ms ${fmt(w5.peakDb)}, after ${fmt(wAfter.peakDb)}; the room's first 50 ms ${fmt(t0.rmsDb)} → ${fmt(pt0.rmsDb)} dB RMS, 0.3 to 0.6 s ${fmt(t1.rmsDb)} → ${fmt(pt1.rmsDb)}; same twice ${same}`);
        assert(db(p) <= db(lim) + 0.3 && db(p) > PROTECT.ceilingDb - 3 && at / SR <= 0.0005 && w5.peakDb > wAfter.peakDb, JSON.stringify({ gun, p: db(p), at, w5, wAfter }));
        assert(crest(d) < crest(open) && pt0.rmsDb <= t0.rmsDb + 0.5 && Math.abs(pt1.rmsDb - t1.rmsDb) < 6 && same, JSON.stringify({ crest: [crest(d), crest(open)], pt0, t0, pt1, t1 }));
      }
    },
  },
  {
    name: 'your shot and another\'s (ownShot, otherShot, echoShot): yours at your ear with your space\'s answer; the #2\'s a sound\'s way late, fainter and darker with distance, panned to his side, his room\'s answer falling slower; worn, the electronics clamp every shot (its distance\'s fall compressed to half, its side kept); in vacuum nothing; the berm\'s slap-back at its delay',
    fn() {
      const mine = ownShot({ gun: 'r7', space: 'room', prot: 'suit', pKpa: HOUSE_AIR.pKpa }), pist = ownShot({ gun: 'p12', space: 'room', prot: null, pKpa: HOUSE_AIR.pKpa });
      const me = { x: 0, z: 0 }, near2 = otherShot({ gun: 'r7', space: 'room', pKpa: HOUSE_AIR.pKpa, soundMs: HOUSE_AIR.soundMs, me, muzzle: { x: -2, z: 0 }, roll: ROLLOFF.floor });
      const far8 = otherShot({ gun: 'r7', space: 'room', pKpa: HOUSE_AIR.pKpa, soundMs: HOUSE_AIR.soundMs, me, muzzle: { x: 8, z: 0 }, roll: ROLLOFF.floor });
      const far60 = otherShot({ gun: 'r7', space: 'open', pKpa: GROUND_AIR.pKpa, soundMs: GROUND_AIR.soundMs, me, muzzle: { x: 60, z: 0 }, roll: ROLLOFF.ground });
      const p2 = otherShot({ gun: 'r7', space: 'room', prot: 'suit', pKpa: HOUSE_AIR.pKpa, soundMs: HOUSE_AIR.soundMs, me, muzzle: { x: -2, z: 0 }, roll: ROLLOFF.floor });
      const p300 = otherShot({ gun: 'r7', space: 'open', prot: 'ears', pKpa: GROUND_AIR.pKpa, soundMs: GROUND_AIR.soundMs, me, muzzle: { x: 300, z: 0 }, roll: ROLLOFF.ground });
      const vac = ownShot({ gun: 'r7', space: 'room', pKpa: 0 });
      const echo = echoShot({ gun: 'r7', echoDb: -12, lowpassHz: 1500, delayS: 0.17, prot: 'ears', pKpa: GROUND_AIR.pKpa });
      const r = (v) => Math.round(v * 10) / 10;
      console.log(`      yours in the house through the suit: ${mine.voices.map(v => `${v.key} ${r(v.gainDb)} dB`).join(', ')}; the P-12 open: ${pist.voices.map(v => `${v.key} ${r(v.gainDb)} dB`).join(', ')}`);
      console.log(`      the #2 at 2 m west: ${r(near2.gainDb)} dB, ${Math.round(near2.lowpassHz)} Hz, ${fmt(near2.delayS * 1000)} ms late, pan ${r(near2.pan)}, his room's answer ${r(near2.voices[1].gainDb)}; at 8 m east ${r(far8.gainDb)} dB, ${fmt(far8.delayS * 1000)} ms, pan ${r(far8.pan)}, the room's ${r(far8.voices[1].gainDb)}; a shot 60 m off outdoors ${r(far60.gainDb)} dB, ${Math.round(far60.lowpassHz)} Hz, ${fmt(far60.delayS * 1000)} ms`);
      console.log(`      through the suit, the #2 at 2 m: ${p2.voices[0].key} (protected ${p2.protected}) at ${r(p2.gainDb)} dB; a shot 300 m off through the defenders: ${p300.voices[0].key} (protected ${p300.protected}) at ${r(p300.gainDb)} dB; in vacuum ${mine.voices.length} voices at ${vac.gainDb} dB; the berm's slap-back through the defenders ${echo.key} at ${r(echo.gainDb)} dB, ${echo.delayS} s, ${echo.lowHz} Hz`);
      assert(mine.voices.length === 2 && mine.voices[0].key === 'r7:own:p' && mine.voices[1].key === 'r7:tail:room:p' && pist.voices[0].key === 'p12:own' && near(pist.gainDb - (mine.gainDb - PROTECT_AT.suit.db), -2.92, 0.05) === undefined, JSON.stringify({ mine, pist }));
      near(near2.delayS, 2 / HOUSE_AIR.soundMs, 1e-9, 'a sound\'s way late');
      assert(near2.pan < 0 && far8.pan > 0 && far8.gainDb < near2.gainDb && far8.lowpassHz <= near2.lowpassHz && far60.lowpassHz < near2.lowpassHz, JSON.stringify({ near2, far8, far60 }));
      assert(near2.gainDb - far8.gainDb > (near2.voices[1].gainDb - far8.voices[1].gainDb) && far60.voices[1].gainDb >= OWN_DB + GROUND_AIR.pKpa * 0 + TAIL_FAR_MIN_DB - 3, 'the room\'s answer falls slower than the direct');
      const open300 = otherShot({ gun: 'r7', space: 'open', pKpa: GROUND_AIR.pKpa, soundMs: GROUND_AIR.soundMs, me, muzzle: { x: 300, z: 0 }, roll: ROLLOFF.ground }), open2 = otherShot({ gun: 'r7', space: 'room', pKpa: HOUSE_AIR.pKpa, soundMs: HOUSE_AIR.soundMs, me, muzzle: { x: -2, z: 0 }, roll: ROLLOFF.floor });
      assert(p2.protected && p2.voices[0].key === 'r7:far:p' && p300.protected && p300.voices[0].key === 'r7:far:p' && p2.pan < 0 && p300.pan > 0 && p300.gainDb < p2.gainDb, JSON.stringify({ p2, p300 }));
      near(p300.gainDb - (OWN_DB + PROTECT_AT.ears.db - 1.87), 0.5 * (open300.gainDb - (OWN_DB - 1.87)), 0.05, 'the fall compressed to half');
      assert(vac.gainDb === -Infinity && echo.key === 'r7:farSub:p' && near(echo.delayS, 0.17, 1e-9) === undefined && echo.gainDb < OWN_DB + PROTECT_AT.ears.db, JSON.stringify({ vac, echo, open2 }));
    },
  },
  {
    name: 'the scenes\' spaces (range.js gunSpaceOf): the shoot house a room, the 25 m bay the bay (its berm 55 m there and back), the 300 m line the open; nothing assumes the place',
    fn() {
      const got = {};
      for (const [scenario, setup, want] of [['test-shoothouse', 'go', 'room'], ['test-handling', 'bench', 'bay'], ['test-range', 'far', 'open']]) {
        const g = createGame({ scenario, seed: 48213, setup }); g.step(2);
        const a = playerActor(g.state), bx = a.x > 1128 ? 1612 : 1128, path = Math.max(0, bx - a.x - 0.9) + Math.max(0, bx - a.x);
        got[scenario] = { space: gunSpaceOf(g.state, path), area: g.state.places.live.area, pathM: Math.round(path) };
        assert(got[scenario].space === want, JSON.stringify(got));
      }
      console.log(`      ${Object.entries(got).map(([k, v]) => `${k}: ${v.space} (${v.area}, the berm's path ${v.pathM} m)`).join('; ')}`);
      assert(spaceOf({ indoors: true }) === 'room' && spaceOf({ bermPathM: 50 }) === 'bay' && spaceOf({ bermPathM: 600 }) === 'open' && spaceOf({}) === 'open', 'spaceOf');
    },
  },
  {
    name: 'the new master (mix.js MASTER): a burst of twelve open R-7 shots in the house (10 a second) never past the soft clip\'s 0.97, the quiet sounds at their own level (the compressor\'s make-up taken back); the old master\'s the same burst hits full scale',
    fn() {
      const vs = [];
      for (let i = 0; i < 12; i++) for (const x of ownShot({ gun: 'r7', space: 'room', pKpa: HOUSE_AIR.pKpa }).voices) vs.push(asVoice(x, 0.05 + i * 0.1));
      const sum = mixdown(vs, { durS: 2.2 }), nu = master(sum, MASTER), old = master(sum, MASTER_OLD), pre = levels(sum), ln = levels(nu), lo = levels(old);
      const quiet = { left: new Float32Array(4800).fill(0.01), right: new Float32Array(4800).fill(0.01) }, q = levels(master(quiet, MASTER, { volume: 1 }), { fromS: 0.05 });
      const curve = clipCurve(), cmax = Math.max(...curve.map(Math.abs));
      console.log(`      the burst before the master ${fmt(pre.peakDb)} dBFS peak; through the new ${fmt(ln.peakDb, 2)} dBFS peak, ${fmt(ln.rmsDb)} RMS (the make-up ${fmt(makeupDb(MASTER), 2)} dB taken back); through the old ${fmt(lo.peakDb, 2)} dBFS; a −40 dBFS tone through the new at ${fmt(q.peakDb, 2)} dBFS; the clip curve's largest ${fmt(cmax, 3)}`);
      assert(pre.peakDb > 3 && ln.peakDb <= db(CLIP_LIMIT) + 1e-6 && lo.peakDb >= -0.01 && Math.abs(q.peakDb - -40) < 0.1 && cmax <= CLIP_LIMIT + 1e-6, JSON.stringify({ pre, ln, lo, q, cmax }));
    },
  },
  {
    name: 'the steps well under the shots (the user, 2026-11-15: "steps are too loud"): in the house at 1 G through the suit, a Fast foot-fall 20 dB or more under your R-7\'s peak, a Careful one 4 dB or more under the Fast; the old sound\'s balance a few dB; &sound=old keeps the old steps',
    fn() {
      const step = (stance, sound) => {
        const v = stepVoice('concrete', 'walk', { gG: 1, pKpa: HOUSE_AIR.pKpa });
        return master(mixdown([{ samples: render(STEPS.concrete, { sampleRate: SR, name: 'concrete', variant: 0 }), sampleRate: SR, atS: 0.02, gainDb: v.gainDb + stepTrimDb(stance, sound), lowHz: v.lowpassHz, pan: 0.05 }], { durS: 0.3 }), sound === 'old' ? MASTER_OLD : MASTER);
      };
      const shot = master(mixdown(ownShot({ gun: 'r7', space: 'room', prot: 'suit', pKpa: HOUSE_AIR.pKpa }).voices.map(x => asVoice(x, 0.02)), { durS: 1 }), MASTER);
      const rep = reportVoice({ mine: true, ears: true, pKpa: HOUSE_AIR.pKpa, soundMs: HOUSE_AIR.soundMs, bermX: 1128, me: { x: 1100, z: 0 } });
      const oldShot = master(mixdown([{ samples: render(RANGE.report, { sampleRate: 24000, name: 'report', variant: 0 }), sampleRate: 24000, atS: 0.02, gainDb: rep.gainDb, lowHz: rep.lowpassHz, pan: 0 }], { durS: 1 }), MASTER_OLD);
      const L = { shot: levels(shot).peakDb, fast: levels(step('assault', 'new')).peakDb, careful: levels(step('combat', 'new')).peakDb, relaxed: levels(step('relaxed', 'new')).peakDb, oldShot: levels(oldShot).peakDb, oldStep: levels(step('combat', 'old')).peakDb };
      console.log(`      dBFS peaks: your R-7 through the suit ${fmt(L.shot)}; a foot-fall Fast ${fmt(L.fast)}, Relaxed ${fmt(L.relaxed)}, Careful ${fmt(L.careful)} (the trim ${STEP_TRIM_DB} dB, the stances ${JSON.stringify(STANCE_STEP_DB)}); the old: the report ${fmt(L.oldShot)}, a foot-fall ${fmt(L.oldStep)}`);
      console.log(`      the margins: new ${fmt(L.shot - L.fast)} dB over a Fast step, ${fmt(L.shot - L.careful)} over a Careful one; old ${fmt(L.oldShot - L.oldStep)} dB`);
      assert(L.shot - L.fast >= 20 && L.fast - L.careful >= 4 && L.relaxed < L.fast && L.relaxed > L.careful && L.shot - L.fast > L.oldShot - L.oldStep + 12, JSON.stringify(L));
      assert(stepTrimDb('combat', 'old') === 0 && stepTrimDb('assault', 'old') === 0 && stepTrimDb(undefined) === STEP_TRIM_DB, 'the old sound\'s steps as they were');
    },
  },
  {
    name: 'the engine\'s two sounds on a stand-in AudioContext: the new bakes every gun part within its budget, plays your R-7 in the house as gun.js\'s voices on the gun bus (past the hall\'s send) through the suit, a P-12 by its model, the bay\'s shot with the berm\'s slap-back, ends its graph in the soft clip; &sound=old (soundModeOf) the old report, no gun voices, the old master',
    fn() {
      assert(soundModeOf('?play=test-shoothouse&sound=old') === 'old' && soundModeOf('?sound=new') === 'new' && soundModeOf('') === 'new' && soundModeOf(undefined) === 'new', 'soundModeOf');
      const N = engineOn('new');
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, setup: 'go' }); g.step(2);
      const startedBefore = N.ctx.started.length;
      assert(N.audio.fact('shot', shotFact(g.state), g.state), JSON.stringify(N.audio.stats.range.lastReport));
      const played = N.ctx.started.slice(startedBefore), last = N.audio.stats.range.lastReport;
      const paths = played.map(p => pathOf(p.src)), shaper = N.ctx.made.find(n => n.kind === 'shaper');
      // (a P-12 by its model: an item of the model in the state)
      g.state.items['test-p12'] = { id: 'test-p12', model: 'p12' };
      N.ctx.currentTime += 1;                                          // (a second later: not merged into the first by the reports' limit)
      N.audio.fact('shot', { ...shotFact(g.state, { gun: 'test-p12' }), id: 'p', atMs: g.state.clock.ms + 1000 }, g.state);
      const pLast = { ...N.audio.stats.range.lastReport }, pGun = { ...N.audio.stats.lastGun };
      console.log(`      new: ${N.frames} frames to bake (the longest ${fmt(N.worstMs, 1)} ms), ${Object.keys(gunBakes()).length ? gunBakes().length : 0} gun parts; your R-7 in the house: ${JSON.stringify(last)}, ${played.length} voices (${played.map(p => p.src.buffer.numberOfChannels).join(', ')} channels), their path ${paths[0].join(' → ')}; the P-12: ${pLast.gun}, ${pGun.key}`);
      assert(last.sound === 'new' && last.space === 'room' && last.prot === 'suit' && last.gun === 'r7' && played.length === 2 && played[1].src.buffer.numberOfChannels === 2, JSON.stringify({ last, n: played.length }));
      assert(paths.every(p => p.includes('biquad') && p.at(-1) === 'destination' && p.includes('shaper')) && shaper?.curve?.length > 0 && shaper.oversample === 'none' && pLast.gun === 'p12' && /^(A\d\/)?p12:/.test(pGun.key), JSON.stringify({ paths, pLast, pGun }));
      // (the gun bus is not the world's: its voices do not pass the hall's convolver)
      assert(paths.every(p => !p.includes('convolver')), JSON.stringify(paths));
      // (the bay: the ear defenders worn, the berm's slap-back 0.17 s later)
      const B = engineOn('new', { earsOn: () => true });
      const h = createGame({ scenario: 'test-handling', seed: 48213, setup: 'bench' }); h.step(2);
      B.audio.fact('shot', shotFact(h.state), h.state);
      const bl = B.audio.stats.range.lastReport, be = B.audio.stats.range.lastEcho;
      console.log(`      the bay: ${JSON.stringify(bl)}; the slap-back ${JSON.stringify(be)}`);
      assert(bl.space === 'bay' && bl.prot === 'ears' && be && Math.abs(be.delayS - 0.17) < 0.01, JSON.stringify({ bl, be }));
      // (the old sound: the report recipe on the world bus, no gun part baked, no soft clip)
      const O = engineOn('old');
      const n0 = O.ctx.started.length;
      O.audio.fact('shot', shotFact(g.state), g.state);
      const ol = O.audio.stats.range.lastReport, oPlayed = O.ctx.started.slice(n0);
      console.log(`      old: ${O.frames} frames to bake; the shot ${JSON.stringify(ol)}, ${oPlayed.length} voice(s); a soft clip in its graph ${O.ctx.made.some(n => n.kind === 'shaper')}; its sound '${O.audio.sound}'`);
      assert(O.audio.sound === 'old' && ol.sound === undefined && Math.abs(ol.gainDb - -2.9) < 0.2 && !O.ctx.made.some(n => n.kind === 'shaper') && O.audio.stats.gunVoices === 0 && oPlayed.length >= 1, JSON.stringify({ ol, n: oPlayed.length }));
    },
  },
  // ---- v0.0.20: the shot's candidates (the build sheet v0.0.20 item 2, §0 item 21) ----
  {
    name: 'your R-7 in the house through the suit is loud where the ear listens (the user, 2026-11-15: "guns should bang harder"): the house\'s shot (A5 from v0.0.24, A3 before) has its loudest 50 ms at least -11.0 dBFS through the master, its loudest 10 ms at least -9.0, its peak at most -1.0 (v0.0.17\'s A1: -15.6, -12.1, -2.9); the P-12 2 to 4 dB under it; A0 to A5 printed',
    fn() {
      const loudest = (st, wS) => { const n = Math.round(wS * SR); let best = 0, s2 = 0; const e = (i) => (st.left[i] ** 2 + st.right[i] ** 2) / 2; for (let i = 0; i < st.left.length; i++) { s2 += e(i); if (i >= n) s2 -= e(i - n); if (i >= n - 1) best = Math.max(best, s2 / n); } return db(Math.sqrt(best)); };
      const out = {};
      for (const shot of SHOT_IDS) {
        if (SHOT_CANDIDATES[shot].old) {
          // (A0, &sound=old's report through the defenders and the old master: the range's own recipe)
          const rep = reportVoice({ mine: true, ears: true, pKpa: HOUSE_AIR.pKpa, soundMs: HOUSE_AIR.soundMs, bermX: 1128, me: { x: 1100, z: 0 } });
          const o = master(mixdown([{ samples: render(RANGE.report, { sampleRate: 24000, name: 'report', variant: 0 }), sampleRate: 24000, atS: 0.02, gainDb: rep.gainDb, lowHz: rep.lowpassHz, pan: 0 }], { durS: 1 }), MASTER_OLD);
          out[shot] = { r7: { peak: levels(o).peakDb, w10: loudest(o, 0.01), w50: loudest(o, 0.05), w300: loudest(o, 0.3) } };
          continue;
        }
        const G = {};
        for (const b of gunBakes(shot)) { if (!/:(own:p|tail:room:p)$/.test(b.key)) continue; const it = b.steps(0, GUN_RATE_HZ, TAIL_RATE_HZ); let r; do r = it.next(); while (!r.done); G[b.key] = r.value; }
        out[shot] = {};
        for (const gun of ['r7', 'p12']) {
          const vs = ownShot({ gun, space: 'room', prot: 'suit', pKpa: HOUSE_AIR.pKpa }).voices.map(x => { const sm = G[shotKey(x.key, shot)]; return { samples: sm, sampleRate: sm.left ? TAIL_RATE_HZ : GUN_RATE_HZ, atS: 0.02, gainDb: x.gainDb, lowHz: x.lowHz, pan: x.pan, rate: x.rate }; });
          const m = master(mixdown(vs, { durS: 1 }), MASTER);
          out[shot][gun] = { peak: levels(m).peakDb, w10: loudest(m, 0.01), w50: loudest(m, 0.05), w300: loudest(m, 0.3) };
        }
      }
      for (const [shot, o] of Object.entries(out)) console.log(`      ${shot}${shot === shotFor('test-shoothouse') ? ' (the house\'s)' : shot === shotFor('test-handling') ? ' (elsewhere)' : ''}: ${Object.entries(o).map(([g, w]) => `${g} peak ${fmt(w.peak)}, 10 ms ${fmt(w.w10)}, 50 ms ${fmt(w.w50)}, 300 ms ${fmt(w.w300)} dBFS`).join('; ')}`);
      const house = out[shotFor('test-shoothouse')], was = out.A1.r7;
      assert(shotFor('test-shoothouse') === 'A5' && shotFor('test-shoothouse-live') === 'A5', 'the house plays A5');
      assert(house.r7.w50 >= -11.0 && house.r7.w10 >= -9.0 && house.r7.peak <= -1.0, JSON.stringify({ house: house.r7, was }));
      assert(was.w50 < -15 && was.peak <= -1.0, `A1 as built: ${JSON.stringify(was)}`);
      const under = house.r7.w50 - house.p12.w50;
      console.log(`      the P-12 under the R-7 over 50 ms: ${fmt(under)} dB (A1 ${fmt(out.A1.r7.w50 - out.A1.p12.w50)})`);
      assert(under >= 2 && under <= 4, `the pistol ${under} dB under`);
    },
  },
  {
    name: 'every scene plays A5 from v0.0.24 (the user, 2026-11-19: A4 starred, the R-7 wave on the P-12, the R-7 "less a PAF and more a DOOM"); A1 stays v0.0.17\'s, byte for byte: its 44 parts hash as v0.0.19\'s (FNV-1a over their float bytes, recorded from the snapshot\'s gun.js)',
    fn() {
      let h = 2166136261 >>> 0, n = 0;
      const mixF = (f) => { const b = new Uint8Array(new Float32Array([f]).buffer); for (const x of b) { h ^= x; h = Math.imul(h, 16777619) >>> 0; } };
      const keys = [];
      for (const b of gunBakes('A1')) for (let v = 0; v < b.variants; v++) { const it = b.steps(v, GUN_RATE_HZ, TAIL_RATE_HZ); let r; do r = it.next(); while (!r.done); keys.push(b.key); for (const a of r.value.left ? [r.value.left, r.value.right] : [r.value]) for (const f of a) { mixF(f); n++; } }
      const others = ['test-handling', 'test-range', 'test-pairs', 'test-stress', 'barracks'].map(id => `${id} ${shotFor(id)}`);
      console.log(`      A1's parts: ${keys.length}, ${n} samples, digest ${h.toString(16)} (the snapshot's fbde03b6 over 1210560); the scenes: ${others.join(', ')}; gunBakes() is gunBakes('A1') ${gunBakes().map(b => b.key).join() === gunBakes('A1').map(b => b.key).join()}; A3's first keys ${gunBakes('A3').slice(0, 2).map(b => b.key).join(', ')}`);
      assert(h.toString(16) === 'fbde03b6' && n === 1210560 && keys.length === 44, JSON.stringify({ h: h.toString(16), n, k: keys.length }));
      assert(others.every(x => x.endsWith(' A5')) && gunBakes('A3').every(b => b.key.startsWith('A3/')) && gunBakes('A0').length === 0, JSON.stringify(others));
    },
  },
  {
    name: 'the shot chosen per scene (engine.js setShot): A3 asked bakes its parts in BAKE_FRAME_MS slices while the default (A5 from v0.0.24, baked at prepare) plays, then plays them; the To score page\'s A0 plays &sound=old\'s shot (the report at its old level); back to A5 at once',
    fn() {
      const N = engineOn('new');
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, setup: 'go' }); g.step(2);
      const before = N.audio.shot;
      N.audio.setShot('A3');
      const during = N.audio.shot;
      N.audio.fact('shot', shotFact(g.state), g.state);
      const k1 = N.audio.stats.lastGun?.key;
      let frames = 0, worst = 0;
      while (N.audio.shot !== 'A3' && frames < 5000) { const t0 = performance.now(); N.audio.frame(null); worst = Math.max(worst, performance.now() - t0); frames++; }
      N.ctx.currentTime += 1;
      N.audio.fact('shot', { ...shotFact(g.state), id: 'b', atMs: g.state.clock.ms + 1000 }, g.state);
      const k3 = N.audio.stats.lastGun?.key;
      N.audio.setShot('A0'); N.ctx.currentTime += 1;
      N.audio.fact('shot', { ...shotFact(g.state), id: 'c', atMs: g.state.clock.ms + 2000 }, g.state);
      const old = N.audio.stats.rangeOld?.lastReport;
      N.audio.setShot('A5'); const back = N.audio.shot;
      console.log(`      playing ${before}; A3 asked: ${during} plays (${k1}) until its parts are whole, ${frames} frames (the longest ${fmt(worst, 1)} ms), then ${k3}; A0: ${JSON.stringify(old)}; back to ${back}`);
      assert(before === 'A5' && during === 'A5' && k1 === 'A5/r7:tail:room:p' && k3 === 'A3/r7:tail:room:p' && back === 'A5', JSON.stringify({ before, during, k1, k3, back }));
      assert(old && old.sound === undefined && Math.abs(old.gainDb - -2.9) < 0.2, JSON.stringify(old));
    },
  },
];
