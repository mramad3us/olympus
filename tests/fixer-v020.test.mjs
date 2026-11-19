// OLYMPUS tests: v0.0.20's fixer, the play and code reviews of the integrated tree, each case failing without its fix.
//
// The play review drove every sheet to the card in node and in the page; the code review read the diff against v0.0.19. Each
// case below pins one of their findings and prints what it measures.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { doAction } from '../src/sim/arms/firearms.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { houseBot, runHouse } from './bots/house.mjs';
import { runSheetOf, hotWashOf, houseOf, parCauseOf, EYES_K } from '../src/sim/scenarios/shoothouse.js';
import { runSheetEl } from '../src/ui/cards/house.js';
import { houseHonestBot } from './bots/house.mjs';
import { houseNow } from '../src/sim/scenarios/shoothouse.js';
import { laneModel } from '../src/ui/hud/timer.js';
import { createAudio } from '../src/ui/audio/engine.js';
import { modelOf } from '../src/sim/arms/groups.js';
import { fixedLines } from '../src/ui/audio/house.js';

const fixture = () => gunzipSync(readFileSync(path.join(root, 'tests', 'topup-crash.json.gz'))).toString();
// ---- a stand-in AudioContext (audio-gun's): the graph as plain objects ----
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

// (a document enough for runSheetEl in node: elements that keep their children, their text and their dataset)
const fakeDoc = { createElement: (tag) => ({ tag, kids: [], dataset: {}, append(...k) { this.kids.push(...k); } }) };
const textOf = (n) => (typeof n === 'string' ? n : [n.textContent ?? '', ...(n.kids ?? []).map(textOf)].filter(Boolean).join(' '));
const houseLane = ({ tier, seed, mode, opfor = null }) => { const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go', ...(opfor ? { opfor } : {}) }); runHouse(g, houseBot({ mode }), { maxMs: 12 * 60_000 }); return { g, s: g.state, H: houseOf(g.state), rs: runSheetOf(g.state) }; };
const rifleIdOf = (s, pid) => Object.keys(s.items).find(k => s.items[k].model === 'r7' && s.items[k].byId === pid);
const rifleOf = (s, pid) => s.items[rifleIdOf(s, pid)];

export default [
  {
    name: 'with an armed G-11 in the hand and the rifle at high ready, RELOAD, LOAD, UNLOAD, the reaches, Off safe and Low ready are struck "hands full: the G-11" and a press of each leaves the rifle\'s magazine and chamber as they were; Sling it stays live (the play review of v0.0.20: RELOAD seated i8 and chambered a round beside the live grenade)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48006, tier: 'recruit', loadout: 'full', strict: false }), save = fixture();
      g.load(save);
      const s0 = g.state, pid = s0.player.id, rows = stepsOf(s0);
      const ids = ['macro:reload:speed', 'macro:load', 'macro:unload', 'reach@p2', 'reach@dump', 'selector:semi', 'posture:lowReady'];
      const struck = Object.fromEntries(ids.map(id => { const r = rows.find(x => x.id === id); return [id, r ? r.off ?? 'live' : 'not offered']; }));
      const sling = rows.find(r => r.id === 'stow');
      const moved = [];
      for (const id of ids) {
        g.load(save);
        const s = g.state, r0 = rifleOf(s, pid), before = `${r0.mag}/${r0.chamber}/${s.people[pid].kit.carry.posture}/${s.people[pid].kit.hands.join(',')}`;
        g.step(1, { act: [stepAct(id)] });
        for (let k = 0; k < 200; k++) g.step(1, {});
        const r1 = rifleOf(s, pid), after = `${r1.mag}/${r1.chamber}/${s.people[pid].kit.carry.posture}/${s.people[pid].kit.hands.join(',')}`;
        if (after !== before) moved.push({ id, before, after });
      }
      // (and the gun itself refuses a reach while the hand is full, whatever planned it)
      g.load(save);
      const s = g.state, gunSays = doAction(s, { emit() {} }, { pid, gunId: rifleIdOf(s, pid), action: 'reach@p2', log: false });
      // (and the DI's chip names no RELOAD under "It's in your hand.": cqb-hands leads, nothing that works the rifle waits behind it)
      for (let k = 0; k < 3; k++) g.step(1, {});
      const I = instinctNow(g.state), chip = I.chip?.id ?? null;
      console.log(`      the DI: "${I.line?.text}", the chip ${chip}`);
      console.log(`      struck ${JSON.stringify(struck)}; Sling it ${sling ? (sling.off ?? 'live') : 'absent'}; moved ${moved.length} ${JSON.stringify(moved)}; the gun on reach@p2: ${gunSays.refused ? `refused "${gunSays.text}"` : 'done'}`);
      assert(ids.every(id => struck[id] === 'hands full: the G-11') && sling && !sling.off && !moved.length && gunSays.refused && chip !== 'cqb-reload' && chip !== 'cqb-go', JSON.stringify({ chip, struck, sling: sling?.off, moved, gun: gunSays.text }));
    },
  },
  {
    name: 'on the live lane a wound that leaves you fighting is the one thing ("paint"), never "Clean lane", its room is not counted a clean room, and the wound model\'s sentences are on the run sheet the end card shows under the plan view (the play review of v0.0.20: the corporal by T on 1111, struck in the chest and wounded, was told "Clean lane. Again, faster." and "3 clean rooms", the page never said "bleeding")',
    heavy: true, // (the v0.0.22 integration: the file over its quick CPU budget, 3 s (QUICK_FILE_CPU_S), on v0.0.21's runner; its whole lanes moved to the heavy suite as TECH §13.7 says, the case unchanged)
    fn() {
      const { H, rs } = houseLane({ tier: 'cpl', seed: 1111, mode: 'T', opfor: 'live' });
      const el = runSheetEl(rs, { doc: fakeDoc }), text = textOf(el);
      console.log(`      end ${H.end?.why}; struck on the stack ${(H.live.struck ?? []).length}; the one thing ${rs.one.key}: "${rs.one.text}"; ${rs.practised.words}`);
      console.log(`      the run sheet's would: ${JSON.stringify(rs.would)}; on the paper: ${/bleeding/.test(text) ? 'yes' : 'no'}`);
      assert(H.end?.why === 'clear' && (H.live.struck ?? []).length > 0 && rs.one.key === 'paint' && !/Clean/.test(rs.one.text) && rs.practised.clean < rs.practised.rooms
        && rs.would?.length && /would have done/.test(text) && /bleeding/.test(el.dataset.text), JSON.stringify({ end: H.end, one: rs.one, practised: rs.practised, would: rs.would }));
    },
  },
  {
    name: 'the TEAM row counts MARKED over the rooms left or cleared: the room a casualty ended the lane in, never left, is not an unmarked room (the play review of v0.0.20: "MARKED 1 OF 2" on the private by the keys on 48213, the casualty in room 2)',
    fn() {
      const { H, rs } = houseLane({ tier: 'private', seed: 48213, mode: 'keys', opfor: 'live' });
      console.log(`      end ${H.end?.why}; rooms ${H.rooms.map(L => `${L.door}:${L.state}${L.marked ? ':marked' : ''}`).join(', ')}; ${rs.team.words}`);
      assert(H.end?.why === 'casualty' && rs.team.marked === rs.team.of && /MARKED 1 OF 1/.test(rs.team.words), JSON.stringify({ end: H.end, team: rs.team }));
    },
  },
  {
    name: 'a lane ended before any room was run is not told "Clean lane": its one thing is "unplayed" (the play review of v0.0.20: Esc, End the scene at GO read "0 ROOMS … Clean lane. Again, faster.")',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' });
      g.step(2, {});
      const rs = runSheetOf(g.state);
      console.log(`      ${rs.card}; the one thing ${rs.one.key}: "${rs.one.text}"`);
      assert(rs.one.key === 'unplayed' && !/Clean/.test(rs.one.text), JSON.stringify(rs.one));
    },
  },
  {
    name: 'a missed par whose take-in was within its allowance is never "You saw him late": the tier one by the keys on 48213, room 1\'s 1a taken in at 50 ms against a book of 50, is "hands" (the play review of v0.0.20: parCauseOf named \'eyes\' as the larger of two shortfalls)',
    fn() {
      const { H } = houseLane({ tier: 'tierone', seed: 48213, mode: 'keys' });
      const k = H.rooms[0].contacts.find(c => c.stand === '1a' && c.by === 'me'), b = H.books['1a'];
      console.log(`      1a: take-in ${k.takeInMs} ms (book ${b.takeInMs}, allowance ${EYES_K * b.takeInMs}), the pause ${k.pauseAtMs - k.seenMs} ms after the sighting, met ${k.parMet}, cause ${k.cause}`);
      assert(k.parMet === false && k.takeInMs <= EYES_K * b.takeInMs && k.cause !== 'eyes', JSON.stringify({ k, b }));
      // (and every missed par of any lane here: 'eyes' only over the allowance)
      const bad = [...H.rooms, H.hall].flatMap(L => L.contacts.filter(c => c.cause === 'eyes' && Number.isFinite(c.takeInMs) && c.takeInMs <= EYES_K * H.books[c.stand].takeInMs));
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'each missed par on the run sheet the end card shows says its cause, "BASIC MISSED (SLOW HANDS)" (the play review of v0.0.20: the private by the keys on 48213 missed two pars and no cause word reached the page: the hot wash\'s bars stand down beside the plan view)',
    fn() {
      const { s, rs } = houseLane({ tier: 'private', seed: 48213, mode: 'keys' });
      const hw = hotWashOf(s), el = runSheetEl(rs, { doc: fakeDoc, bars: hw.bars }), text = textOf(el);
      const missed = (text.match(/MISSED \([A-Z ,]+\)/g) ?? []), bare = (text.match(/[A-Z]+ MISSED(?! \()/g) ?? []).filter(w => !/^(PARS?) /.test(w));
      console.log(`      causes on the paper: ${JSON.stringify(missed)}; without one: ${JSON.stringify(bare)}`);
      assert(missed.length >= 2 && !bare.length, JSON.stringify({ missed, bare, text }));
    },
  },
  {
    name: 'the lane timer\'s strip never says HE FIRED FIRST of a man whose par the scene then judges met: the tier one by the honest bot on 105, 2a met within the instructor\'s click and 1b the #2\'s own man (the code review of v0.0.20: "2A HE FIRED FIRST" for 1.25 s and "1B HE FIRED FIRST" at +4.75 s, the strip running each par from the first sighting by anyone, the click left out)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 105, tier: 'tierone', setup: 'go' }), s = g.state, H = houseOf(s);
      const red = new Map();
      runHouse(g, houseHonestBot(), { each: () => {
        const hn = houseNow(s), m = hn ? laneModel(hn.timer ?? hn, s.clock.ms) : null, w = m?.strip ?? '';
        const who = /(\S+) HE FIRED FIRST/.exec(w)?.[1];
        if (who && !red.has(who)) red.set(who, s.clock.ms - H.goAtMs);
      } });
      const met = [...H.rooms, H.hall].flatMap(L => L.contacts.filter(c => c.parMet === true)).map(c => c.stand.toUpperCase());
      const wrong = [...red.entries()].filter(([who]) => met.includes(who));
      console.log(`      the strip's FIRED FIRST: ${JSON.stringify(Object.fromEntries([...red].map(([k, v]) => [k, (v / 1000).toFixed(2)])))}; pars met ${JSON.stringify([...new Set(met)])}; the click on 2a ${H.rooms[1].contacts.find(c => c.stand === '2a' && c.parMet !== null)?.click ?? 'none'} ms`);
      assert(!wrong.length, JSON.stringify({ wrong, met }));
    },
  },
  {
    name: 'the house\'s voice keeps every fixed line (the PA\'s, the team\'s calls) however many other lines are said, and bakes a line said after the sounds are all baked: 230 lines after the fixed 56 leave the 56 cached and 160 others, and a fixed line said again is not baked again (the code review of v0.0.20: the trim deleted the oldest, the fixed lines first, at 280; and no line said once toBake was empty was ever baked)',
    heavy: true, // (the v0.0.22 integration: the file over its quick CPU budget, 3 s (QUICK_FILE_CPU_S), on v0.0.21's runner; its whole lanes moved to the heavy suite as TECH §13.7 says, the case unchanged)
    fn() {
      const Klass = function () { return new FakeContext(); };
      const audio = createAudio({ sound: 'new', voice: 'c', AudioContextClass: Klass });
      audio.prepare(); audio.start();
      const F = fixedLines().length, V = audio.stats.voice;
      for (let f = 0; f < 20000 && !(audio.stats.baked && V.fixed >= F && !V.queued); f++) audio.frame(null);
      const before = { ...V };
      for (let i = 0; i < 230; i++) audio.voiceLine(`Line number ${i}, said once.`, { voice: 'pa' });
      for (let f = 0; f < 20000 && (V.waiting || V.queued); f++) audio.frame(null);
      const after = { ...V }, L = fixedLines()[0];
      audio.voiceLine(L.text, { voice: L.voice, register: L.register });
      for (let f = 0; f < 50 && (V.waiting || V.queued); f++) audio.frame(null);
      console.log(`      the fixed lines ${F}; before ${JSON.stringify({ baked: before.baked, cached: before.cached, fixed: before.fixed })}; after 230 more ${JSON.stringify({ baked: after.baked, cached: after.cached, fixed: after.fixed, waiting: after.waiting })}; a fixed line again: baked ${V.baked}`);
      assert(before.fixed === F && after.fixed === F && after.cached === F + 160 && after.baked === before.baked + 230 && !after.waiting && V.baked === after.baked, JSON.stringify({ F, before, after, now: { ...V } }));
    },
  },
  {
    name: 'AT THE DOOR\'s Breach on 5, before Stack up, is struck "stack first" where the loadout carries a charge or a tool, and "not issued" only where it carries none (the play review of v0.0.20: the breach, full, cut and mixed loadouts read "Breach: not issued" with the issue badge at every door\'s first stop)',
    fn() {
      const five = {};
      for (const lo of ['standard', 'breach', 'full', 'cut', 'mixed', 'flash']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go', loadout: lo });
        g.step(2, {});
        const e = modelOf(stepsOf(g.state)).groups.DRILL.slots[5];
        five[lo] = `${e.words}: ${e.row?.off ?? 'live'}${e.stand ? ' (stand-in)' : ''}`;
      }
      console.log(`      5 at room 1, unstacked: ${JSON.stringify(five)}`);
      assert(['breach', 'full', 'cut', 'mixed'].every(lo => five[lo] === 'Breach: stack first') && five.standard === 'Breach: not issued (stand-in)' && five.flash === 'Breach: not issued (stand-in)', JSON.stringify(five));
    },
  },
];
