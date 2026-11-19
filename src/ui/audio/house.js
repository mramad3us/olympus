// OLYMPUS audio: the shoot house in the ears: the hall's reverb, the instructor's timer and the harness's tone, the doors (VIEWS §11.2, §11.3; the build sheet 0.0.12 §2.7).
//
// The presenter's ear (VIEWS §11.1: "the sim decides, audio presents"): it hears the scene's 'house' facts (shoothouse.js: { phase:
// 'go' | 'stacked' | 'open' | 'enter' | 'clear' | 'par' | 'fault' | 'stall' | 'stop' | 'wash' | 'end', room, who, atMs, kind?, met? }) and
// the drill's 'bundle' facts (a halt for a door that will not give: 'refused'), and asks the engine (engine.js) for a HOUSE recipe
// (src/data/sounds.js) where it is:
//   GO           the timer's 2.4 kHz start beep;
//   a door       its leaf by its verb ('open' with kind push, pull or kick: the kick a thump through the suit's filter), a lock's
//                rattle on a refusal;
//   a room       cleared within par, the timer's double beep;
//   a par        the harness's low tone (400 Hz, 0.4 s) as a threat's par passes with no round on him ('par' with met false).
// And while you stand in the house the world bus feeds the hall's reverb (inHouse: the live area is the Wheel's, or the range's
// course is 'house'; engine.js hall(on)), so the dry sounds and the shots ring in a room of panels, not under a sky. houseVoice()
// and inHouse() are the pure parts the ui-audio test measures in node.
//
// No line is voiced (v0.0.24; the user, 2026-11-19, twice: "forget about voices, those are all terrible use text bubble only" and
// "also let me reiterate : forget voice synthesis, no voices."): v0.0.20's voices (the instructor on the PA, your #2, you, the
// role-players) and 0.0.12's voiced syllables (GO, Stop, Standby, the #2's whispered "Ready", "Clear!") are gone with the synthesis.
// A 'say' fact plays nothing here: every line is a text bubble at its speaker (src/ui/plaque.js) and whole in the radio box.
// The kick's boom plays at the leaf's first move (the door fact's leafAtMs, B's: the boot's strike), the leaf's knock on its
// stop (sounds.js doorStop) at stopAtMs and a softer one at a kick's rebound; a push's knock 6 dB under; a pull none.
import { playerActor } from '../../core/ids.js';
import { airDb } from '../../sim/people/hearing.js';
import { lowpassHz } from './steps.js';
import { airHere } from './range.js';
import { ROLLOFF, PAN_FULL_M, SUIT_EARS_DB, SUIT_EARS_LP_HZ, DOOR_STOP_DB, DOOR_REBOUND_DB, DOOR_PUSH_STOP_DB } from '../../data/sounds.js';

const r1 = (v) => Math.round(v * 10) / 10;
const dbOfDist = (dM, roll = ROLLOFF.floor) => 20 * Math.log10(1 / (1 + roll * Math.max(0, dM - 1)));
/** Whether the house's sounds and its hall apply: the live area is one of the Wheel's, or the range's course is the house. */
export function inHouse(state) {
  const area = state?.places?.live?.area ?? '';
  return String(area).startsWith('melas.wheel') || state?.armoury?.range?.course === 'house';
}
/**
 * A house sound as you hear it: { gainDb, lowpassHz, pan, distM }. kind: what it is ('door', 'kick' where the leaf is, 'timer' at
 * the instructor's hand, 'harness' in your suit); me and at { x, z }; pKpa the air. An impulse (a kick) comes through the suit's
 * filter (its gate, SUIT_EARS_DB); the timer and the harness are electronic, in the suit.
 */
export function houseVoice(kind, { me = null, at = null, pKpa, suit = true } = {}) {
  const lp = lowpassHz(pKpa), air = airDb(pKpa);
  const dx = me && at ? at.x - me.x : 0, dz = me && at ? at.z - me.z : 0;
  const flat = Math.hypot(dx, dz), pan = Math.max(-1, Math.min(1, dx / PAN_FULL_M));
  if (kind === 'timer' || kind === 'harness') return { gainDb: 0, lowpassHz: lp, pan: 0, distM: 0 };
  let gainDb = (kind === 'kick' ? 6 : 0) + air + dbOfDist(Math.max(0.5, flat)), lowHz = lp;
  if (kind === 'kick' && suit) { gainDb += SUIT_EARS_DB / 2; lowHz = Math.min(lowHz, SUIT_EARS_LP_HZ); }
  return { gainDb, lowpassHz: lowHz, pan, distM: flat };
}

/**
 * The house's ear: { fact(type, payload, state), door(fact, state), frame(state), stats }. engine: { house(kind, opts), hall(on) }.
 */
export function createHouse(engine) {
  const stats = { cues: 0, byKind: {}, last: null, hall: false, doors: 0, beeps: 0, tones: 0, knocks: 0 };
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
    const me = playerActor(state), here = me ? { x: me.x, z: me.z } : null, pKpa = airHere(state).pKpa;
    if (type === 'house') {
      const ph = f.phase;
      if (ph === 'go') { stats.beeps++; return play('timerGo', houseVoice('timer', { pKpa })); }
      if (ph === 'open' && f.kind) {
        const verb = f.kind === 'kick' ? 'doorKick' : f.kind === 'pull' ? 'doorPull' : f.kind === 'locked' ? 'lockRattle' : 'doorPush';
        stats.doors++;
        return play(verb, houseVoice(f.kind === 'kick' ? 'kick' : 'door', { me: here, at: Number.isFinite(f.x) ? { x: f.x, z: f.z } : posOf(state, f.who) ?? here, pKpa }));
      }
      // (a room within par: the timer's double beep)
      if (ph === 'clear') { if (f.met !== true) return false; stats.beeps++; return play('timerDouble', houseVoice('timer', { pKpa }), { delayS: 0.35 }); }
      if (ph === 'par' && f.met !== true) { stats.tones++; return play('harnessTone', houseVoice('harness', { pKpa })); }
      return false;
    }
    if (type === 'bundle' && f.phase === 'halt' && f.why === 'refused') { stats.doors++; return play('lockRattle', houseVoice('door', { me: here, at: here, pKpa })); }
    // (a 'say' fact plays nothing: the line is a bubble at its speaker, never a voice)
    return false;
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
  return { fact, door, frame, stats };
}
