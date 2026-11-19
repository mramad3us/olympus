// OLYMPUS tests: no line is voiced, and the voice synthesis is gone whole (the user, 2026-11-19, twice: "forget about voices, those
// are all terrible use text bubble only" and "also let me reiterate : forget voice synthesis, no voices.").
//
// v0.0.23's fixer made the game's voice set 'none'; v0.0.24 removes the synthesis: src/data/voices.js and src/ui/audio/voice.js are
// gone, the engine (audio/engine.js createAudio) has no line to bake or say (no voiceLine, setVoice, prebakeCallouts), the house's
// ear (audio/house.js createHouse) plays nothing for a 'say' fact and none of 0.0.12's voiced syllables (paGo, paStop, paStandby,
// shoutClear, whisperReady: gone from sounds.js HOUSE), while the timer's beeps, the harness's tone, the doors and the lock keep
// their sounds; readParams has no &voice= (an old URL with it is read as if it had none); the To score page has no voice row and
// the gallery no voices set. Every line is a text bubble at its speaker instead (tests/bubbles.test.mjs). Each case fails if any
// line is voiced again: a 'say' fact that plays, a recipe of a voice in HOUSE, an engine method or module that speaks.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseBot, runHouse } from './bots/house.mjs';
import { createHouse } from '../src/ui/audio/house.js';
import { createAudio } from '../src/ui/audio/engine.js';
import { HOUSE } from '../src/data/sounds.js';
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
    name: 'the house\'s ear says no line of a whole lane (the private by the keys on 48213, from the fill) and HOUSE holds no voiced syllable, while the timer\'s beeps and the doors still sound (the user, 2026-11-19: "forget voice synthesis, no voices.")',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' });
      const cues = [], asked = [];
      // (an engine that would take a line if the ear ever asked: nothing may)
      const ear = createHouse({ house: (kind) => { cues.push(kind); return true; }, hall: () => {}, voice: (text) => { asked.push(text); return true; } });
      let says = 0, heard = 0, doors = 0;
      const each = (game) => {
        for (const { type, p } of factsOf(game)) {
          if (type === 'say') { says++; if (ear.fact('say', p, game.state)) heard++; }
          else if (type === 'house' || type === 'bundle') ear.fact(type, p, game.state);
          else if (type === 'door' && p?.how) { if (ear.door(p, game.state)) doors++; }
        }
      };
      const r = runHouse(g, houseBot({ mode: 'keys' }), { each, maxMs: 600_000 });
      const voiced = cues.filter(k => VOICED.has(k)), kinds = [...new Set(cues)], recipes = Object.keys(HOUSE).filter(k => VOICED.has(k));
      console.log(`      ${says} 'say' facts, ${heard} heard, ${asked.length} lines asked of the engine; the cues ${kinds.join(', ')} (${voiced.length} voiced); HOUSE's recipes ${Object.keys(HOUSE).join(', ')}; the lane ${g.state.armoury.range.house.end?.why ?? 'open'}`);
      assert(r.done && says > 20, JSON.stringify({ done: r.done, says }));
      assert(heard === 0 && asked.length === 0 && voiced.length === 0 && !recipes.length, JSON.stringify({ heard, asked: asked.slice(0, 5), voiced: voiced.slice(0, 5), recipes }));
      assert(cues.includes('timerGo') && doors > 0, JSON.stringify({ kinds, doors }));
      assert(!('setVoice' in ear) && !('voiceSet' in ear), Object.keys(ear).join());
    },
  },
  {
    name: 'the engine has no voice: no line baked or said, no voice set, no call-outs (no voiceLine, setVoice, prebakeCallouts, voiceSet, stats.voice), and the synthesis\'s modules are gone (src/data/voices.js, src/ui/audio/voice.js)',
    fn() {
      const audio = createAudio({ sound: 'new', voice: 'c', AudioContextClass: function () { return new FakeContext(); } });
      audio.prepare(); audio.start(); audio.frame(null);
      const api = ['voiceLine', 'setVoice', 'prebakeCallouts', 'calloutBaked', 'voiceSet'].filter(k => k in audio);
      const files = ['src/data/voices.js', 'src/ui/audio/voice.js'].filter(f => existsSync(path.join(root, f)));
      // (no module of the game imports a voice module or speaks: speechSynthesis, the browser's own voice, never either)
      const src = [], walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.m?js$/.test(e.name)) src.push(p); } };
      walk(path.join(root, 'src'));
      const speaks = src.filter(p => /from '[^']*\/voices?\.js'|speechSynthesis|SpeechSynthesisUtterance/.test(readFileSync(p, 'utf8'))).map(p => path.relative(root, p));
      console.log(`      the engine's voice API ${api.length ? api.join(', ') : 'none'}; stats.voice ${audio.stats.voice ? 'kept' : 'none'}; the modules ${files.length ? files.join(', ') : 'gone'}; ${src.length} modules of src read, ${speaks.length} that speak`);
      assert(!api.length && audio.stats.voice === undefined && !files.length && !speaks.length, JSON.stringify({ api, files, speaks }));
    },
  },
  {
    name: 'an old URL with &voice= is read as if it had none (no voice parameter, no error); the To score page has no voice row; the gallery has no voices set, in its index or its folders',
    fn() {
      const none = readParams('?play=test-shoothouse'), c = readParams('?play=test-shoothouse&voice=c'), old = readParams('?play=test-shoothouse&voice=old&seed=7');
      const main = readFileSync(path.join(root, 'src/main.js'), 'utf8');
      const index = JSON.parse(readFileSync(path.join(root, 'samples/index.json'), 'utf8'));
      const folder = existsSync(path.join(root, 'samples/voices'));
      console.log(`      the URL: &voice=c → ${JSON.stringify(c.voice)}, &voice=old&seed=7 → voice ${JSON.stringify(old.voice)}, seed ${old.seed}; main.js names a voice ${/settings\.voice|params\.voice|voiceSet/.test(main)}; the rows ${ROWS.map(r => r.id).join(', ')}; the index's sets ${index.samples.length}, voices ${index.samples.some(s => s.id === 'voices')}; samples/voices ${folder ? 'there' : 'gone'}`);
      assert(!('voice' in none) && !('voice' in c) && !('voice' in old) && old.seed === 7, JSON.stringify({ none, c, old }));
      assert(!/settings\.voice|params\.voice|voiceSet/.test(main), 'main.js still carries a voice');
      assert(!ROWS.some(r => r.id === 'voice' || /voice/i.test(r.title ?? '')), ROWS.map(r => r.id).join());
      assert(!index.samples.some(s => s.id === 'voices') && !folder, 'samples/voices still in the gallery');
    },
  },
];
