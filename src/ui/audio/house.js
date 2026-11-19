// OLYMPUS audio: the shoot house in the ears: the hall's reverb, the instructor's PA and timer, the doors, the stack's whisper, "Clear!" (VIEWS §11.2, §11.3; the build sheet 0.0.12 §2.7).
//
// The presenter's ear (VIEWS §11.1: "the sim decides, audio presents"): it hears the scene's 'house' facts (shoothouse.js: { phase:
// 'go' | 'stacked' | 'open' | 'enter' | 'clear' | 'par' | 'fault' | 'stall' | 'stop' | 'wash' | 'end', room, who, atMs, kind?, met? }),
// the drill's 'bundle' facts (a halt for a door that will not give: 'refused') and the instructor's 'say' facts, and asks the engine
// (engine.js) for a HOUSE recipe (src/data/sounds.js) where it is:
//   GO           the PA's "GO" from the catwalk over you and the timer's 2.4 kHz start beep at once; "Standby" on his say;
//                "Stop" on the lane's stop;
//   the stack    the #2's whispered "Ready" at your shoulder when he stacks (a 'stacked' fact that is not yours);
//   a door       its leaf by its verb ('open' with kind push, pull or kick: the kick a thump through the suit's filter), a lock's
//                rattle on a refusal;
//   "Clear!"     shouted by whoever calls it, yours at your mouth, the #2's beside you; a room within par, the timer's double beep;
//   a par        the harness's low tone (400 Hz, 0.4 s) as a threat's par passes with no round on him ('par' with met false).
// And while you stand in the house the world bus feeds the hall's reverb (inHouse: the live area is the Wheel's, or the range's
// course is 'house'; engine.js hall(on)), so the dry sounds and the shots ring in a room of panels, not under a sky. houseVoice()
// and inHouse() are the pure parts the ui-audio test measures in node.
//
// v0.0.20 (the build sheet v0.0.20 item 7; feel.md FL-3): the house speaks. Every 'say' fact in the house is said aloud in a
// voice made by code (voice.js, voices.js), routed by its speaker and kind: the instructor (his PA lines and his own speech, one
// speaker) on the catwalk's PA, your number two at his place through his helmet's speaker, you in your own helmet (no pan, 6 dB
// under his shout), a role-player at his place; how it is said (shout, plain, whisper) by the TEAM_WORDS id that says it
// (voices.js REGISTER). The drill instructor's line stays text: it is "the drill instructor's voice in your head, dry"
// (DESIGN.md). One speaker never talks over himself: his lines queue on the audio clock (each spokenMs long, core/speech.js),
// and a line still queued past its text's hold (the fact's durMs) is dropped and counted (stats.voice.dropped), never piled up.
// The voice set is the To score page's (V-a to V-d, voices.js VOICE_SET; setVoice): V-a is v0.0.19's stand-ins (the five
// syllables, the rest silent) with the Standby rule fixed (/\bstandby\b/i: "Lane A. Standby." was silent); with words, the
// stand-ins give way to the voice (GO's beep, Stop's and the stack's stand-ins are said by the 'say' facts instead).
// The kick's boom plays at the leaf's first move (the door fact's leafAtMs, B's: the boot's strike), the leaf's knock on its
// stop (sounds.js doorStop) at stopAtMs and a softer one at a kick's rebound; a push's knock 6 dB under; a pull none.
import { playerId, playerActor } from '../../core/ids.js';
import { airDb } from '../../sim/people/hearing.js';
import { lowpassHz } from './steps.js';
import { airHere } from './range.js';
import { ROLLOFF, PAN_FULL_M, PA_VOICE_DB, WHISPER_DB, SHOUT_DB, SUIT_EARS_DB, SUIT_EARS_LP_HZ, HOUSE_CUES, DOOR_STOP_DB, DOOR_REBOUND_DB, DOOR_PUSH_STOP_DB } from '../../data/sounds.js';
import { REGISTER, VOICE_SET, VOICE_DEFAULT } from '../../data/voices.js';
import { TEAM_WORDS } from '../../sim/combat/team.js';
import { spokenMs } from '../../core/speech.js';
import { SEQ_HOUSE, HOUSE_CHIEF, COURSES } from '../../data/courses.js';

const r1 = (v) => Math.round(v * 10) / 10;
const dbOfDist = (dM, roll = ROLLOFF.floor) => 20 * Math.log10(1 / (1 + roll * Math.max(0, dM - 1)));
/** A line's hold as the radio box shows it (ms, and ms a word): handling.js SAY_MS and SAY_WORD_MS, its durOf (the ui-audio test holds them equal). */
export const HOLD_MS = 3500, HOLD_WORD_MS = 330;
/** Where the PA is heard from: the catwalk, 3 m over the rooms (m), straight above you. */
export const PA_DIST_M = 3;
/** Whether the house's sounds and its hall apply: the live area is one of the Wheel's, or the range's course is the house. */
export function inHouse(state) {
  const area = state?.places?.live?.area ?? '';
  return String(area).startsWith('melas.wheel') || state?.armoury?.range?.course === 'house';
}
/**
 * A house sound as you hear it: { gainDb, lowpassHz, pan, distM }. kind: what it is ('pa' from the catwalk, 'whisper' at your ear,
 * 'shout' at a mouth, 'door', 'kick', 'timer' at the instructor's hand, 'harness' in your suit); me and at { x, z }; pKpa the air.
 * An impulse (a kick) comes through the suit's filter (its gate, SUIT_EARS_DB); the timer and the harness are electronic, in the suit.
 */
export function houseVoice(kind, { me = null, at = null, pKpa, suit = true } = {}) {
  const lp = lowpassHz(pKpa), air = airDb(pKpa);
  const dx = me && at ? at.x - me.x : 0, dz = me && at ? at.z - me.z : 0;
  const flat = Math.hypot(dx, dz), pan = Math.max(-1, Math.min(1, dx / PAN_FULL_M));
  if (kind === 'pa') { const d = Math.hypot(flat, PA_DIST_M); return { gainDb: PA_VOICE_DB + air + dbOfDist(d), lowpassHz: Math.min(lp, 4000), pan, distM: d }; }
  if (kind === 'whisper') return { gainDb: WHISPER_DB + air, lowpassHz: lp, pan: pan || -0.3, distM: Math.max(0.3, flat) };
  // (your own voice, in your helmet: no pan, no distance)
  if (kind === 'own') return { gainDb: air, lowpassHz: lp, pan: 0, distM: 0 };
  if (kind === 'timer' || kind === 'harness') return { gainDb: 0, lowpassHz: lp, pan: 0, distM: 0 };
  const src = kind === 'shout' ? SHOUT_DB : kind === 'kick' ? 6 : kind === 'talk' ? SHOUT_DB - 3 : 0;
  let gainDb = src + air + dbOfDist(Math.max(0.5, flat)), lowHz = lp;
  if (kind === 'kick' && suit) { gainDb += SUIT_EARS_DB / 2; lowHz = Math.min(lowHz, SUIT_EARS_LP_HZ); }
  return { gainDb, lowpassHz: lowHz, pan, distM: flat };
}

/** The parts a held paint call names at the zone (shoothouse.js liveTick's words where the would-have gives no `where`). */
export const PAINT_PARTS = Object.freeze(['chest', 'head']);
/**
 * The house's fixed lines, baked at the first key (engine.js): the tower's PA lines and every TEAM_WORDS call in the voice of each
 * man who says it ({ text, voice, register }); a line said otherwise (the instructor's, a templated one) is baked when said.
 * v0.0.22 (its build sheet §0 item 6): the wash's words by the lane's end (SEQ_HOUSE's sayEnd) with the PA's, and the live lane's
 * fixed lines, whose timing is their point: the instructor's held paint call at the zone's parts (HOUSE_CHIEF.paint, paintTwice,
 * paintStopped, and on your #2 paintTwo, paintTwiceTwo and paintStoppedTwo: v0.0.22's fixer, the hunt's merged lines), the casualty's
 * cease fire and lessons (his and the bled one's too), the bled rulings (bled, twoBled), the ruling ("You, out."), and each marine's "I'm hit!" and "Man down!"
 * (COURSES.house.opfor hit and manDown: you in your helmet, your #2 at his place; a shout by their "!"). A paint call at a part the
 * would-have names ("right arm") is baked when said.
 */
export function fixedLines() {
  const out = [], seen = new Set(), add = (text, voice, register) => { const k = `${voice}|${register}|${text}`; if (text && !seen.has(k)) { seen.add(k); out.push({ text, voice, register }); } };
  for (const c of SEQ_HOUSE) for (const t of [...(c.say ?? []), ...(c.sayEnd?.other ?? [])]) add(t, 'pa', REGISTER.pa);
  for (const t of [...HOUSE_CHIEF.paint, ...HOUSE_CHIEF.paintTwice, ...HOUSE_CHIEF.paintStopped, ...(HOUSE_CHIEF.paintTwo ?? []), ...(HOUSE_CHIEF.paintTwiceTwo ?? []), ...(HOUSE_CHIEF.paintStoppedTwo ?? [])]) for (const part of PAINT_PARTS) add(t.replaceAll('{part}', part), 'pa', REGISTER.speech);
  for (const t of [...HOUSE_CHIEF.casualty, ...HOUSE_CHIEF.twoDown, ...HOUSE_CHIEF.out, ...HOUSE_CHIEF.one.casualty, ...HOUSE_CHIEF.one['casualty:click'], ...HOUSE_CHIEF.one['casualty:fought'], ...HOUSE_CHIEF.one['casualty:unseen'],
    ...(HOUSE_CHIEF.bled ?? []), ...(HOUSE_CHIEF.twoBled ?? []), ...['casualty:two', 'casualty:two:yours', 'casualty:bled', 'paint:two'].flatMap(k => HOUSE_CHIEF.one[k] ?? [])]) add(t, 'pa', REGISTER.speech);
  for (const t of [...COURSES.house.opfor.hit, ...COURSES.house.opfor.manDown]) for (const who of ['me', 'two']) add(t, who, /!\s*$/.test(t) ? 'shout' : REGISTER.speech);
  for (const [id, w] of Object.entries(TEAM_WORDS)) {
    if (!w?.words) continue;
    const reg = REGISTER[id] ?? REGISTER.speech;
    if (w.by !== 1) add(w.words, 'two', reg);
    if (w.by !== 2) add(w.words, 'me', reg);
  }
  return out;
}
// (a TEAM_WORDS id by its words, for a 'say' fact that carries no call: "Covering!" → 'covering')
const WORD_ID = (() => { const m = new Map(); for (const [id, w] of Object.entries(TEAM_WORDS)) if (w?.words && !m.has(w.words)) m.set(w.words, id); return m; })();
/** How a 'say' fact is said (voices.js REGISTER): by its call's TEAM_WORDS id, else its words', else its speaker's role. */
export function registerOf(f, role) {
  const id = (f.call && REGISTER[f.call] ? f.call : null) ?? (f.call && REGISTER[`call:${f.call}`] ? `call:${f.call}` : null) ?? WORD_ID.get(String(f.text ?? '').trim()) ?? null;
  if (id && REGISTER[id]) return REGISTER[id];
  if (role === 'pa') return REGISTER[f.kind] ?? REGISTER.pa;
  if (role === 'man') return REGISTER.man;
  return /!\s*$/.test(String(f.text ?? '')) ? 'shout' : REGISTER.speech;
}
/** Who says a 'say' fact in the house: 'me' (you), 'two' (your number two), 'pa' (the instructor, on the PA or not), 'man' (anyone else: a role-player). */
export function roleOf(state, f) {
  const H = state?.armoury?.range?.house, R = state?.armoury?.range;
  if (!f?.who || f.who === playerId(state)) return 'me';
  if (H?.twoPid && f.who === H.twoPid) return 'two';
  if (f.kind === 'pa' || f.who === R?.roId || f.who === R?.coachId || f.who === H?.chiefPid) return 'pa';
  return 'man';
}
/**
 * One speaker's queue on the audio clock (see the header): say(who, ms, holdMs, nowS) → { atS, endS } where his line starts, or
 * null when it would start past its hold (dropped). Pure: the house's ear holds one, the tests run it on the game's clock.
 */
export function createVoiceQueue() {
  const freeAt = new Map(), stats = { said: 0, dropped: 0, overlaps: 0, waitedS: 0 };
  return {
    say(who, ms, holdMs, nowS) {
      const free = freeAt.get(who) ?? -Infinity, atS = Math.max(nowS, free);
      if (atS - nowS > holdMs / 1000) { stats.dropped++; return null; }
      if (atS < free - 1e-9) stats.overlaps++;
      freeAt.set(who, atS + ms / 1000); stats.said++; stats.waitedS += atS - nowS;
      return { atS, endS: atS + ms / 1000 };
    },
    reset() { freeAt.clear(); },
    stats,
  };
}

/**
 * The house's ear: { fact(type, payload, state), door(fact, state), frame(state), setVoice(set), stats }. engine: { house(kind,
 * opts), hall(on), voice?(text, { voice, register, set, atS, gainDb, lowHz, pan }) (a line said at atS on the audio
 * clock, true if it will play), now?() (the audio clock, s) }. voice: the set (voices.js VOICE_SETS), else VOICE_DEFAULT.
 */
export function createHouse(engine, { voice = VOICE_DEFAULT } = {}) {
  const stats = { cues: 0, byKind: {}, last: null, hall: false, whispers: 0, doors: 0, beeps: 0, tones: 0, pa: 0, shouts: 0, knocks: 0, voice: null, set: null };
  let set = VOICE_SET[voice] ? voice : VOICE_DEFAULT;
  const queue = createVoiceQueue();
  stats.voice = { ...queue.stats, byRole: {} }; stats.set = set;
  const words = () => VOICE_SET[set].words && typeof engine.voice === 'function';
  const play = (recipe, v, extra = {}) => {
    const ok = engine.house(recipe, { gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan, ...extra });
    if (ok) { stats.cues++; stats.byKind[recipe] = (stats.byKind[recipe] ?? 0) + 1; stats.last = { what: recipe, gainDb: r1(v.gainDb), lowpassHz: Math.round(v.lowpassHz) }; }
    return ok;
  };
  const posOf = (state, who) => {
    if (!who) return null;
    const list = Array.isArray(state.actors) ? state.actors : state.actors?.list ?? [], a = list.find(x => x.who === who || x.id === who);
    return a ? { x: a.x, z: a.z } : null;
  };
  function fact(type, f, state) {
    if (!state || !f || !inHouse(state)) return false;
    const me = playerActor(state), here = me ? { x: me.x, z: me.z } : null, pKpa = airHere(state).pKpa, mine = !f.who || f.who === playerId(state);
    if (type === 'house') {
      const ph = f.phase;
      // (with words, GO, Stop and the stack's "Ready" are the 'say' facts' to say; GO keeps its timer's beep)
      if (ph === 'go') { stats.beeps++; if (!words()) { stats.pa++; play(HOUSE_CUES.go, houseVoice('pa', { me: here, pKpa })); } return play('timerGo', houseVoice('timer', { pKpa })); }
      if (ph === 'stop') { if (words()) return false; stats.pa++; return play(HOUSE_CUES.stop, houseVoice('pa', { me: here, pKpa })); }
      if (ph === 'stacked' && !mine) { if (words()) return false; stats.whispers++; return play('whisperReady', houseVoice('whisper', { me: here, at: posOf(state, f.who), pKpa })); }
      if (ph === 'open' && f.kind) {
        const verb = f.kind === 'kick' ? 'doorKick' : f.kind === 'pull' ? 'doorPull' : f.kind === 'locked' ? 'lockRattle' : 'doorPush';
        stats.doors++;
        return play(verb, houseVoice(f.kind === 'kick' ? 'kick' : 'door', { me: here, at: Number.isFinite(f.x) ? { x: f.x, z: f.z } : posOf(state, f.who) ?? here, pKpa }));
      }
      if (ph === 'clear') {
        // (with words, the "Clear!" is its 'say' fact's; the room within par keeps its double beep)
        if (words()) { if (f.met === true) { stats.beeps++; return play('timerDouble', houseVoice('timer', { pKpa }), { delayS: 0.35 }); } return false; }
        stats.shouts++;
        const ok = play(HOUSE_CUES.clear, houseVoice('shout', { me: here, at: mine ? here : posOf(state, f.who), pKpa }));
        if (f.met === true) { stats.beeps++; play('timerDouble', houseVoice('timer', { pKpa }), { delayS: 0.35 }); }
        return ok;
      }
      if (ph === 'par' && f.met !== true) { stats.tones++; return play(HOUSE_CUES.par, houseVoice('harness', { pKpa })); }
      return false;
    }
    if (type === 'bundle' && f.phase === 'halt' && f.why === 'refused') { stats.doors++; return play('lockRattle', houseVoice('door', { me: here, at: here, pKpa })); }
    // (every line said aloud, in its speaker's voice)
    if (type === 'say' && words()) return sayLine(f, state, { me, here, pKpa });
    // (V-a: the stand-ins; the Standby rule fixed: "Lane A. Standby." matches it, v0.0.19's /^\s*standby\b/i did not)
    if (type === 'say' && /\bstandby\b/i.test(String(f.text ?? ''))) { stats.pa++; return play('paStandby', houseVoice('pa', { me: here, pKpa })); }
    // (the drill's calls are said: the #2's "Ready." whispered at your shoulder; "Clear!" shouted by whoever calls it, where the scene's fact did not)
    if (type === 'say' && (f.call === 'ready' || /^\s*ready\.?\s*$/i.test(String(f.text ?? ''))) && !mine) { stats.whispers++; return play('whisperReady', houseVoice('whisper', { me: here, at: posOf(state, f.who), pKpa })); }
    if (type === 'say' && f.call === 'clear' && !mine) { stats.shouts++; return play(HOUSE_CUES.clear, houseVoice('shout', { me: here, at: posOf(state, f.who), pKpa })); }
    return false;
  }
  // (a line said: its speaker's voice, how, where, and when on his queue)
  function sayLine(f, state, { me, here, pKpa }) {
    const role = roleOf(state, f), register = registerOf(f, role), text = String(f.text ?? '').trim();
    const ms = spokenMs(text);
    if (!ms) return false;
    const at = role === 'me' ? here : role === 'pa' ? null : posOf(state, f.who) ?? here;
    const v = role === 'pa' ? houseVoice('pa', { me: here, pKpa }) : role === 'me' ? houseVoice('own', { pKpa })
      : register === 'whisper' ? houseVoice('whisper', { me: here, at, pKpa }) : houseVoice(register === 'shout' ? 'shout' : 'talk', { me: here, at, pKpa });
    if (!Number.isFinite(v.gainDb)) return false;
    // (the hold: the text's, handling.js durOf (3.5 s and 0.33 s a word), or the fact's own where longer)
    const hold = Math.max(Number.isFinite(f.durMs) ? f.durMs : 0, HOLD_MS + HOLD_WORD_MS * text.split(/\s+/).filter(Boolean).length);
    const nowS = engine.now?.() ?? 0, slot = queue.say(f.who ?? role, ms, hold, nowS);
    Object.assign(stats.voice, queue.stats);
    if (!slot) return false;
    const ok = engine.voice(text, { voice: role, register, set, atS: slot.atS, gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan, ms });
    // (a line in a whisper or a shout counts as the stand-ins' cue did, so the house's counters read the same with words: his
    // "Ready." on his stack a whisper, a "Clear!" a shout; the 0.0.12 ear's case reads them)
    if (ok && register === 'whisper' && role !== 'me') stats.whispers++;
    if (ok && register === 'shout') stats.shouts++;
    if (ok) { stats.voice.byRole[role] = (stats.voice.byRole[role] ?? 0) + 1; stats.last = { what: 'voice', role, register, text: text.slice(0, 40), atS: Math.round(slot.atS * 1000) / 1000 }; }
    return ok;
  }
  /** A door's leaf moving in the house (the places' door fact, with the drill's how: push, pull, kick): its verb's sound where it is; false off the house or with no how. */
  function door(f, state) {
    if (!state || !f || !inHouse(state) || !f.how || f.state === 'closed') return false;
    const me = playerActor(state), here = me ? { x: me.x, z: me.z } : null, pKpa = airHere(state).pKpa;
    const verb = f.how === 'kick' ? 'doorKick' : f.how === 'pull' ? 'doorPull' : 'doorPush';
    const at = Number.isFinite(f.x) ? { x: f.x, z: f.z } : here, now = state.clock?.ms ?? 0;
    // (the build sheet v0.0.20 item 15: the kick's boom at the leaf's first move, the boot's strike (leafAtMs, B's door fact), not at the fact,
    // KICK_S before; then the knocks on its stop: stopAtMs, and a kick's rebound back; a push's 6 dB under; a pull none. A fact
    // without them (B's not merged, a pry, a ram) plays as v0.0.19 did)
    const lag = (atMs) => (Number.isFinite(atMs) ? Math.max(0, atMs - now) / 1000 : 0);
    stats.doors++;
    const ok = play(verb, houseVoice(f.how === 'kick' ? 'kick' : 'door', { me: here, at, pKpa }), f.how === 'kick' && Number.isFinite(f.leafAtMs) ? { delayS: lag(f.leafAtMs) } : {});
    if (Number.isFinite(f.stopAtMs) && f.how !== 'pull') {
      const knock = houseVoice('door', { me: here, at, pKpa });
      if (play('doorStop', { ...knock, gainDb: knock.gainDb + (f.how === 'kick' ? DOOR_STOP_DB : DOOR_PUSH_STOP_DB) }, { delayS: lag(f.stopAtMs) })) stats.knocks++;
      // (a kick's leaf off its stop to 0.88 and back by the span's end: the softer knock there)
      if (f.how === 'kick' && Number.isFinite(f.leafAtMs) && play('doorStop', { ...knock, gainDb: knock.gainDb + DOOR_REBOUND_DB }, { delayS: lag(f.leafAtMs + (f.stopAtMs - f.leafAtMs) / 0.55) })) stats.knocks++;
    }
    return ok;
  }
  function frame(state) {
    const on = !!state && inHouse(state);
    if (on !== stats.hall) { stats.hall = on; engine.hall(on); }
  }
  return {
    fact, door, frame, stats,
    /** The voice set from now (voices.js VOICE_SETS: 'a' v0.0.19's stand-ins, 'b' to 'd' the words); an unknown one the default. */
    setVoice(id) { set = VOICE_SET[id] ? id : VOICE_DEFAULT; stats.set = set; queue.reset(); return set; },
    get voiceSet() { return set; },
  };
}
