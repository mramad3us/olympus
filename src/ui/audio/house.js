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
import { playerId, playerActor } from '../../core/ids.js';
import { airDb } from '../../sim/people/hearing.js';
import { lowpassHz } from './steps.js';
import { airHere } from './range.js';
import { ROLLOFF, PAN_FULL_M, PA_VOICE_DB, WHISPER_DB, SHOUT_DB, SUIT_EARS_DB, SUIT_EARS_LP_HZ, HOUSE_CUES } from '../../data/sounds.js';

const r1 = (v) => Math.round(v * 10) / 10;
const dbOfDist = (dM, roll = ROLLOFF.floor) => 20 * Math.log10(1 / (1 + roll * Math.max(0, dM - 1)));
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
  if (kind === 'timer' || kind === 'harness') return { gainDb: 0, lowpassHz: lp, pan: 0, distM: 0 };
  const src = kind === 'shout' ? SHOUT_DB : kind === 'kick' ? 6 : 0;
  let gainDb = src + air + dbOfDist(Math.max(0.5, flat)), lowHz = lp;
  if (kind === 'kick' && suit) { gainDb += SUIT_EARS_DB / 2; lowHz = Math.min(lowHz, SUIT_EARS_LP_HZ); }
  return { gainDb, lowpassHz: lowHz, pan, distM: flat };
}

/** The house's ear: { fact(type, payload, state), frame(state), stats }. engine: { house(kind, opts), hall(on) }. */
export function createHouse(engine) {
  const stats = { cues: 0, byKind: {}, last: null, hall: false, whispers: 0, doors: 0, beeps: 0, tones: 0, pa: 0, shouts: 0 };
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
      if (ph === 'go') { stats.pa++; stats.beeps++; play(HOUSE_CUES.go, houseVoice('pa', { me: here, pKpa })); return play('timerGo', houseVoice('timer', { pKpa })); }
      if (ph === 'stop') { stats.pa++; return play(HOUSE_CUES.stop, houseVoice('pa', { me: here, pKpa })); }
      if (ph === 'stacked' && !mine) { stats.whispers++; return play('whisperReady', houseVoice('whisper', { me: here, at: posOf(state, f.who), pKpa })); }
      if (ph === 'open' && f.kind) {
        const verb = f.kind === 'kick' ? 'doorKick' : f.kind === 'pull' ? 'doorPull' : f.kind === 'locked' ? 'lockRattle' : 'doorPush';
        stats.doors++;
        return play(verb, houseVoice(f.kind === 'kick' ? 'kick' : 'door', { me: here, at: Number.isFinite(f.x) ? { x: f.x, z: f.z } : posOf(state, f.who) ?? here, pKpa }));
      }
      if (ph === 'clear') {
        stats.shouts++;
        const ok = play(HOUSE_CUES.clear, houseVoice('shout', { me: here, at: mine ? here : posOf(state, f.who), pKpa }));
        if (f.met === true) { stats.beeps++; play('timerDouble', houseVoice('timer', { pKpa }), { delayS: 0.35 }); }
        return ok;
      }
      if (ph === 'par' && f.met !== true) { stats.tones++; return play(HOUSE_CUES.par, houseVoice('harness', { pKpa })); }
      return false;
    }
    if (type === 'bundle' && f.phase === 'halt' && f.why === 'refused') { stats.doors++; return play('lockRattle', houseVoice('door', { me: here, at: here, pKpa })); }
    if (type === 'say' && /^\s*standby\b/i.test(String(f.text ?? ''))) { stats.pa++; return play('paStandby', houseVoice('pa', { me: here, pKpa })); }
    // (the drill's calls are said: the #2's "Ready." whispered at your shoulder; "Clear!" shouted by whoever calls it, where the scene's fact did not)
    if (type === 'say' && (f.call === 'ready' || /^\s*ready\.?\s*$/i.test(String(f.text ?? ''))) && !mine) { stats.whispers++; return play('whisperReady', houseVoice('whisper', { me: here, at: posOf(state, f.who), pKpa })); }
    if (type === 'say' && f.call === 'clear' && !mine) { stats.shouts++; return play(HOUSE_CUES.clear, houseVoice('shout', { me: here, at: posOf(state, f.who), pKpa })); }
    return false;
  }
  /** A door's leaf moving in the house (the places' door fact, with the drill's how: push, pull, kick): its verb's sound where it is; false off the house or with no how. */
  function door(f, state) {
    if (!state || !f || !inHouse(state) || !f.how || f.state === 'closed') return false;
    const me = playerActor(state), here = me ? { x: me.x, z: me.z } : null, pKpa = airHere(state).pKpa;
    const verb = f.how === 'kick' ? 'doorKick' : f.how === 'pull' ? 'doorPull' : 'doorPush';
    stats.doors++;
    return play(verb, houseVoice(f.how === 'kick' ? 'kick' : 'door', { me: here, at: Number.isFinite(f.x) ? { x: f.x, z: f.z } : here, pKpa }));
  }
  function frame(state) {
    const on = !!state && inHouse(state);
    if (on !== stats.hall) { stats.hall = on; engine.hall(on); }
  }
  return { fact, door, frame, stats };
}
