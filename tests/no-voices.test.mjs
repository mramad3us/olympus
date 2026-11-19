// OLYMPUS tests: no line is voiced (the user, 2026-11-19, twice: "forget about voices, those are all terrible use text bubble
// only" and "also let me reiterate : forget voice synthesis, no voices.").
//
// The game's voice set is voices.js VOICE_DEFAULT, 'none' from v0.0.23's fixer: the house's ear (audio/house.js createHouse) says
// no 'say' fact and plays none of V-a's voiced syllables (paGo, paStop, paStandby, shoutClear, whisperReady), while the timer's
// beeps, the harness's tone, the doors and the lock keep their sounds; the engine (audio/engine.js createAudio) queues no fixed
// line at its start, says no line and bakes none of your #2's call-outs; the page takes the voice from the URL only, never from an
// old To score pick; the To score page has no voice row and the gallery's index no voices set. Each case fails with a voiced
// default (VOICE_DEFAULT 'c', v0.0.20's to v0.0.22's). The other sets stay by &voice= for the tests that pin them until v0.0.24
// removes the synthesis whole.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseBot, runHouse } from './bots/house.mjs';
import { createHouse } from '../src/ui/audio/house.js';
import { createAudio } from '../src/ui/audio/engine.js';
import { VOICE_DEFAULT, VOICE_SET } from '../src/data/voices.js';
import { readParams } from '../src/core/debug.js';
import { ROWS } from '../src/ui/cards/topick.js';

const VOICED = new Set(['paGo', 'paStop', 'paStandby', 'shoutClear', 'whisperReady']);
const factsOf = (game) => (game.bus.events ?? []).map(e => (Array.isArray(e) ? { type: e[0], p: e[1] } : { type: e.type, p: e.payload ?? e.data ?? e }));

// (a stand-in AudioContext, enough for the engine's graph and its start; nothing is rendered by it)
const param = (v) => ({ value: v, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
class FakeNode { constructor(ctx, kind) { this.ctx = ctx; this.kind = kind; } connect(n) { return n; } disconnect() {} }
class FakeContext {
  constructor() { this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 48000; this.destination = new FakeNode(this, 'destination'); }
  mk(kind, extra = {}) { return Object.assign(new FakeNode(this, kind), extra); }
  resume() { this.state = 'running'; this.onstatechange?.(); return Promise.resolve(); }
  close() { this.state = 'closed'; }
  createGain() { return this.mk('gain', { gain: param(1) }); }
  createBiquadFilter() { return this.mk('biquad', { type: 'lowpass', frequency: param(350), Q: param(1) }); }
  createDynamicsCompressor() { return this.mk('compressor', { threshold: param(-24), knee: param(30), ratio: param(12), attack: param(0.003), release: param(0.25) }); }
  createConvolver() { return this.mk('convolver', { normalize: true, buffer: null }); }
  createStereoPanner() { return this.mk('panner', { pan: param(0) }); }
  createWaveShaper() { return this.mk('shaper', { curve: null, oversample: 'unset' }); }
  createBuffer(ch, len, sr) { const data = Array.from({ length: ch }, () => new Float32Array(len)); return { numberOfChannels: ch, length: len, sampleRate: sr, getChannelData: (i) => data[i], copyToChannel: (src, i) => data[i].set(src) }; }
  createBufferSource() { return this.mk('source', { buffer: null, loop: false, playbackRate: param(1), start() {}, stop() {} }); }
}

export default [
  {
    name: 'the house\'s ear at the game\'s default says no line of a whole lane (the private by the keys on 48213, from the fill) and plays none of V-a\'s voiced syllables, while the timer\'s beeps and the doors still sound; V-c by name says them (the user, 2026-11-19: "forget voice synthesis, no voices.")',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' });
      const said = [], cues = [], saidC = [];
      const ear = createHouse({ house: (kind) => { cues.push(kind); return true; }, hall: () => {}, voice: (text) => { said.push(text); return true; }, now: () => g.state.clock.ms / 1000 });
      const earC = createHouse({ house: () => true, hall: () => {}, voice: (text) => { saidC.push(text); return true; }, now: () => g.state.clock.ms / 1000 }, { voice: 'c' });
      let says = 0, heard = 0, doors = 0;
      const each = (game) => {
        for (const { type, p } of factsOf(game)) {
          if (type === 'say') { says++; if (ear.fact('say', p, game.state)) heard++; earC.fact('say', p, game.state); }
          else if (type === 'house' || type === 'bundle') { ear.fact(type, p, game.state); earC.fact(type, p, game.state); }
          else if (type === 'door' && p?.how) { if (ear.door(p, game.state)) doors++; }
        }
      };
      const r = runHouse(g, houseBot({ mode: 'keys' }), { each, maxMs: 600_000 });
      const voiced = cues.filter(k => VOICED.has(k)), kinds = [...new Set(cues)];
      console.log(`      the default '${VOICE_DEFAULT}': ${says} 'say' facts, ${heard} heard, ${said.length} lines asked of the engine; the cues ${kinds.join(', ')} (${voiced.length} voiced); V-c by name ${saidC.length} lines; the lane ${g.state.armoury.range.house.end?.why ?? 'open'}`);
      assert(r.done && says > 20, JSON.stringify({ done: r.done, says }));
      assert(VOICE_DEFAULT === 'none' && VOICE_SET[VOICE_DEFAULT]?.silent === true, VOICE_DEFAULT);
      assert(heard === 0 && said.length === 0 && voiced.length === 0, JSON.stringify({ heard, said: said.slice(0, 5), voiced: voiced.slice(0, 5) }));
      assert(cues.includes('timerGo') && saidC.length > 20, JSON.stringify({ kinds, saidC: saidC.length }));
    },
  },
  {
    name: 'the engine at the game\'s default queues no fixed line at its start, says no line and bakes no call-out of your #2 (createAudio with no voice; &voice=c by name queues and says them)',
    fn() {
      const make = (voice) => { const audio = createAudio({ sound: 'new', ...(voice ? { voice } : {}), AudioContextClass: function () { return new FakeContext(); } }); audio.prepare(); audio.start(); audio.frame(null); return audio; };
      const a = make(null), c = make('c');
      const line = a.voiceLine('Lane A. Standby.', { voice: 'pa' }), lineC = c.voiceLine('Lane A. Standby.', { voice: 'pa' });
      const pre = a.prebakeCallouts(['Rifle, far left!', 'Pistol, right!']), preC = c.prebakeCallouts(['Rifle, far left!', 'Pistol, right!']);
      a.frame(null); c.frame(null);
      const V = a.stats.voice, VC = c.stats.voice;
      console.log(`      the default: set ${V.set}, a line said ${line}, call-outs queued ${pre}, queued ${V.queued ?? 0}, waiting ${V.waiting}, baked ${V.baked}; &voice=c: a line said ${lineC}, call-outs ${preC}, queued ${VC.queued}, waiting ${VC.waiting}`);
      assert(V.set === 'none' && line === false && pre === 0 && !(V.queued > 0) && !(V.waiting > 0) && V.baked === 0, JSON.stringify(V));
      assert(lineC === true && preC === 2 && (VC.queued > 0 || VC.waiting > 0), JSON.stringify(VC));
    },
  },
  {
    name: 'the page takes the voice from the URL only (&voice=none|a|b|c|d|old, else none), never from this browser\'s old To score pick; the To score page has no voice row; the gallery\'s index lists no voices set, its sample.json retired',
    fn() {
      const none = readParams('?play=test-shoothouse'), c = readParams('?play=test-shoothouse&voice=c'), off = readParams('?play=test-shoothouse&voice=none');
      const main = readFileSync(path.join(root, 'src/main.js'), 'utf8');
      const fromPick = /toPick\.flags\.voice/.test(main);
      const index = JSON.parse(readFileSync(path.join(root, 'samples/index.json'), 'utf8')), sample = JSON.parse(readFileSync(path.join(root, 'samples/voices/sample.json'), 'utf8'));
      console.log(`      the URL: none → ${none.voice}, &voice=c → ${c.voice}, &voice=none → ${off.voice}; main.js reads the old pick ${fromPick}; the rows ${ROWS.map(r => r.id).join(', ')}; the index's sets ${index.samples.length}, voices ${index.samples.some(s => s.id === 'voices')}; retired ${!!sample.retired}`);
      assert(none.voice === null && c.voice === 'c' && off.voice === 'none' && !fromPick, JSON.stringify({ none: none.voice, c: c.voice, off: off.voice, fromPick }));
      assert(!ROWS.some(r => r.id === 'voice'), ROWS.map(r => r.id).join());
      assert(!index.samples.some(s => s.id === 'voices') && !!sample.retired, 'samples/voices still in the gallery');
    },
  },
];
