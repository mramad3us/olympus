// OLYMPUS sim: the drill instructor's rules on the range, what to do next on the tower's line (SKILLS §14; the build sheet 0.0.5 §2.2, §8 item 10).
//
// The DI's voice in your head (dry, second person, one idea); the coach is a person beside you and the
// range officer is on the PA (src/sim/scenarios/handling.js), so these rules say what the training
// says, never what they said. Each rule is SKILLS §14.2's { id, voice: 'di', tone, short, when(state,
// me, ms) → ctx | null, text, act(ctx) → string | null, reach: null }; when() reads only what the
// character knows: the tower's command as heard, the line hot or cold (the red flag), the rifle as
// believed (firearms.js beliefOf: the weapon card's view, never the truth), the finger and the posture
// as felt, the muzzle's heading, the aim. The acts are 'stop:<step>[@<tempo>][><target>]' (a step of the
// panel, done by shooting.js chooseStep through instinct/base.js doAct) and 'stop:enter' (G: the rifle
// up, into the mode); an act is offered only when its step is in the panel now, and never a command the
// tower has not given (T does only the act shown: the build sheet §2.2). Most pressing first:
//   range-cease     urgent  the line cold and the rifle off safe or the finger on: CEASE FIRE
//   range-muzzle    urgent  the rifle in hand and its muzzle past 45° off downrange: aim at your card
//   range-stoppage  warn    a stoppage felt ("Tap, rack.": IMMEDIATE ACTION), the trigger still dead
//                           after it (a look at the port), a double feed seen ("Double feed. Lock,
//                           strip, rack.": REMEDIAL ACTION)
//   range-cmd       warn    the tower's command not done yet ("The tower said LOAD.": it, its stance
//                           first where it has one; out of the mode, the rifle up first); on a KD string,
//                           what the line moved on without first ("The line has moved on. Sitting, then
//                           LOAD, then MAKE READY.": owedOf, 0.0.8); in the house, what the tower still waits on
//                           once the command's macro is done (houseCmd: out of it, back on your mark, Careful,
//                           your number two; at Standby out of it and still; at Stop and SHOW CLEAR with the
//                           P-12 out, Rifle up first: the play and design reviews of 2026-11-13, T silent or
//                           looping before GO on every sheet, and the line cleared with a hot rifle)
//   range-reload    note    in the stance the tower called, the bolt locked on an empty: RELOAD; with no
//                           rounds left anywhere (roundsLeft, the coach's count) "Nothing left to load. Tell your coach."
//   range-unknown   note    a '?' on the weapon card: a press check
//   range-fire      note    the line hot: aim at your card, then off safe, then "Breathe out. Press."
//                           (T aims and goes off safe; the press is never T's, always your own digit)
//   range-wait      calm    nothing to do: wait for the tower
//   range-kd        warn    (0.0.7, test-range's KD course: the build sheet 0.0.7 §2.3) what the KD's own commands ask:
//                           "Dial the coach's call: four up, two left.", "Your dope for three hundred is three
//                           down.", "Four power.", sitting then LOAD, the zero's RELOAD, "Police your brass.",
//                           "Unused rounds back to the coach.", "Say it: no brass, no ammo."; on a hot KD line,
//                           "Wind from the left: the coach says hold a mil left." until held so (hold:call; the point of aim
//                           moves into the wind: shot.js holdFor); police, turn in and declare done by T (kd:<id>)
// v0.0.6's rules are unchanged on the bay's fam25 course; on the kd course your target is the zero card at 25 m and
// your KD lane's face past it, and the tower's own KD commands are range-kd's, not range-cmd's.
// While a session is open the base rules keep quiet below urgent (instinct/base.js) and these speak in
// every tone even while time stands still for the step panel ('stop'), the line's lead "Time stands
// still." (instinct.js; VIEWS §7.4).
// Pure.
import { playerActor, playerId } from '../../../core/ids.js';
import { beliefOf } from '../../arms/firearms.js';
import { stepsOf, gunOn } from '../../arms/shooting.js';
import { rangeOf, lineReady, roundsLeft } from '../../scenarios/handling.js';
import { SEQ, SEQ_KD, KD_STRINGS, COURSES } from '../../../data/courses.js';
import { HOUSE1 } from '../../../data/places/wheel.js';
import { DOPE_CARD } from '../../arms/ballistics.js';
import { holdSaid } from '../../arms/shot.js';
import { headOf } from '../../people/perception.js';
import { keysFor, layoutIn } from '../../arms/groups.js';
import { houseWant, twoLacks } from '../../scenarios/shoothouse.js';
import { drawn } from '../../arms/sidearm.js';

/** The muzzle's heading off downrange past which the DI speaks (the build sheet §2.2), degrees. */
export const MUZZLE_WARN_DEG = 45;
/** The range's rules may speak again as soon as they fire again (instinct.js's REPEAT_MS is a day's pace; a line's commands come every few seconds, each new advice). */
export const RANGE_REPEAT_MS = 0;
const D2R = Math.PI / 180;
const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
const SAID = Object.freeze({ prone: 'the prone position', load: 'LOAD', ready: 'MAKE READY', fire: 'commence fire', cease: 'CEASE FIRE', kneel: 'kneeling, RELOAD',
  stand: 'standing, RELOAD', clear: 'UNLOAD, SHOW CLEAR' });

// (what the character knows on the line now: kept for the tick and the step, since time standing still keeps the
// clock while a step begins or ends (the integrator's: "Cold line! Safe it!" stayed after CEASE FIRE began, the
// rules read from before it))
let memo = { state: null, key: null, v: null };
function know(state, me, ms) {
  const S0 = state.stop, key = `${ms}|${state.clock.tick ?? ''}|${S0 ? `${S0.mode}|${S0.phase}|${S0.doing?.step ?? ''}|${S0.doing?.i ?? ''}|${S0.pick ?? ''}|${S0.aim?.key ?? ''}|${S0.reflex ? 'r' : ''}` : ''}|${rangeOf(state)?.cmd?.i ?? ''}`;
  if (memo.state === state && memo.key === key) return memo.v;
  const R = rangeOf(state);
  let v = null;
  if (R && !R.end) {
    const pid = playerId(state), gunId = gunOn(state, pid), carry = state.people[pid]?.kit?.carry ?? {};
    const b = gunId ? beliefOf(state, gunId) : null, S = state.stop;
    const posture = carry.posture ?? 'slungFront', inHand = posture !== 'slungFront' && posture !== 'slungBack';
    const steps = S?.mode === 'stop' && S.phase === 'choose' ? stepsOf(state, ms) : [];
    const offered = (id) => steps.find(s => s.id === id && !s.off) ?? null;
    v = { R, pid, gunId, b, S, posture, inHand, finger: carry.finger ?? 'off', stance: me.stance ?? 'stand', inMode: S?.mode === 'stop', choosing: S?.mode === 'stop' && S.phase === 'choose',
      busy: !!S?.doing && S.doing.kind !== 'wait', aimed: S?.aim?.key ?? null, own: R.course === 'kd' && (R.line ?? 25) !== 25 ? `face:${R.kdLane}` : `paper:${R.lane}`, kd: R.course === 'kd', head: me.headRad ?? (me.face ? headOf(me.face) : null), offered, steps, cmd: R.cmd?.id ?? null, hot: R.hot };
  }
  memo = { state, key, v };
  return v;
}
// (an act only where its step is in the panel now, choosing)
const actIf = (k, step, tempo = null, target = null) => (k.choosing && k.offered(step) ? `stop:${step}${tempo ? `@${tempo}` : ''}${target ? `>${target}` : ''}` : null);
// (the reload the panel offers, if any: speed or keep the empty from locked empty, tactical with rounds left)
const reloadOf = (k) => k.steps.find(s => s.kind === 'command' && String(s.macro).startsWith('reload:') && !s.off) ?? null;

/**
 * What a KD line moved on without (0.0.8; the player's verifier, seed 2614078355: idle at the 200 m's "Sitting, five
 * rounds. LOAD.", the move-on gave MAKE READY to a shooter still standing with no magazine, and the line said only
 * "The tower said MAKE READY.", which T could not do): at LOAD, MAKE READY and commence fire on a KD string, the
 * string's position not taken, no magazine in (rounds left to load), no round chambered (the bolt not locked on an
 * empty), each owed only where its command came before this one, in the order the training does them, and under fire
 * only before your first round since the command. The line names them and the command after them ("The line has
 * moved on. Sitting, then LOAD, then MAKE READY."), and T does the first.
 * Nothing is done for you and nothing forgiven: the move-on's fault stands, and the tower waits no longer for it.
 * The range-cmd ctx (variant 'owed'), or null when nothing is owed.
 */
function owedOf(state, k) {
  const has = OWED_BEFORE[k.cmd], pos = KD_STRINGS[SEQ_KD[k.R.cmd?.i]?.stage]?.position ?? null;
  if (!has || !pos || !k.b || (k.cmd !== 'fire' && lineReady(state, k.cmd, { relay: false }))) return null;
  // (under fire, once you have fired since the command the string is begun: a magazine out is a reload or a stoppage's
  // drill under way, a stance changed is your own, nothing the line moved on without)
  if (k.cmd === 'fire' && k.R.shots?.some(x => x.who === k.pid && x.atMs >= (k.R.cmd?.atMs ?? 0))) return null;
  const owed = [], dry = !!k.R.dry || roundsLeft(state) === 0;
  if (k.stance !== pos) owed.push(pos);
  const load = has.includes('load') && k.b.mag === 'out' && !dry;
  if (load) owed.push('load');
  if (has.includes('ready') && k.b.chamber === 'empty' && !k.b.locked && (load || k.b.mag === 'in')) owed.push('ready');
  if (!owed.length) return null;
  const said = SAID[k.cmd] ?? k.cmd, chain = [...owed.map(o => OWED_SAID[o]), said].join(', then ');
  return { k, variant: 'owed', owed, step: OWED_STEP[owed[0]], said, chain, Chain: chain.replace(/^\w/, c => c.toUpperCase()), short: OWED_SHORT[owed[0]] };
}
/** What each KD command needs done before it (owedOf), and their words, steps and chips. */
const OWED_BEFORE = Object.freeze({ load: ['stance'], ready: ['stance', 'load'], fire: ['stance', 'load', 'ready'] });
const OWED_SAID = Object.freeze({ prone: 'the prone position', sit: 'sitting', load: 'LOAD', ready: 'MAKE READY' });
const OWED_STEP = Object.freeze({ prone: 'stance:prone', sit: 'stance:sit', load: 'macro:load', ready: 'macro:ready' });
const OWED_SHORT = Object.freeze({ prone: 'Prone', sit: 'Sit', load: 'Load', ready: 'Make ready' });

/** The DI's range rules (see the header), most pressing first. */
export const RANGE_RULES = Object.freeze([
  {
    id: 'range-cease', voice: 'di', repeatMs: RANGE_REPEAT_MS, tone: 'urgent', short: 'Cease fire', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || k.hot || !k.b || !k.inHand || k.busy) return null;
      if (k.b.mode === 'safe' && k.finger !== 'on') return null;
      return { k };
    },
    // (the house's Stop: Make safe, the one row of safe, finger off and low ready (COMBAT §25.19.4), where it is offered)
    act: (ctx) => actIf(ctx.k, 'macro:safe') ?? actIf(ctx.k, 'macro:cease'),
    text: { 1: ['The line is cold. Finger off, on safe. Now.', 'Cold line! Safe it!', 'Finger off the trigger, safety on. The line is cold.', 'Cease fire means safe. Do it now.'] },
  },
  {
    id: 'range-muzzle', voice: 'di', repeatMs: RANGE_REPEAT_MS, tone: 'urgent', short: 'Muzzle', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.inHand || k.head === null) return null;
      const off = Math.abs(wrap(k.head - 0)) / D2R;
      if (off <= MUZZLE_WARN_DEG) return null;
      return { k, off };
    },
    act: (ctx) => actIf(ctx.k, 'aim', null, ctx.k.own) ?? (ctx.k.choosing && ctx.k.offered('posture:lowReady') ? 'stop:posture:lowReady' : null),
    text: { 1: ['Muzzle downrange! Your card, nowhere else.', 'That muzzle is pointing at Mars. Downrange, now.', 'Downrange! Everything else is people.', 'Muzzle! Back on your card.'] },
  },
  {
    id: 'range-stoppage', voice: 'di', repeatMs: RANGE_REPEAT_MS, tone: 'warn', reach: null,
    short: (ctx) => (ctx.variant === 'double' ? 'Remedial' : ctx.variant === 'look' ? 'Look' : 'Tap, rack'),
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.b?.stoppage || k.S?.reflex || k.busy) return null;
      // (a drill under way says nothing over it: the panel shows it; seen a double: the drill for it; the trigger dead after a tap and rack: look before trying again; else tap, rack)
      return { k, variant: k.b.stoppage === 'double' ? 'double' : k.b.stoppage === 'dead' ? 'look' : 'felt' };
    },
    act: (ctx) => (ctx.variant === 'double' ? actIf(ctx.k, 'macro:remedial') : ctx.variant === 'look' ? actIf(ctx.k, 'observe') : actIf(ctx.k, 'macro:ia')),
    text: {
      1: ['Tap, rack.'],
      look: ['It did not clear. Look at the port before you do anything else.', 'Still dead. Look at it.', 'Tap and rack did nothing. Eyes on the port.', 'Stop pulling things. Look at what you have.'],
      felt: ['Tap, rack. Then look.', 'It stopped. Tap, rack, and get back on the card.', 'Immediate action: tap, rack.', 'A stoppage. Tap the magazine, rack it.'],
      double: ['Double feed. Lock, strip, rack.', 'Two rounds fighting for one chamber. Lock, strip, rack.', 'That is a double. Remedial action.', 'Lock it back, strip the magazine, rack it clear.'],
    },
  },
  {
    id: 'range-cmd', voice: 'di', repeatMs: RANGE_REPEAT_MS, tone: 'warn', reach: null,
    short: (ctx) => ctx.short,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.cmd || k.busy) return null;
      // (0.0.8, on the KD course: what the line moved on without, named before the command itself)
      const owed = k.kd ? owedOf(state, k) : null;
      if (owed) return owed;
      // (the house: what the tower waits on once the command's own work is done (houseCmd, see the header))
      if (k.R.course === 'house' && k.cmd !== 'brief' && k.cmd !== 'end') { const h = houseCmd(state, k); if (h !== undefined) return h; }
      if (k.cmd === 'brief' || k.cmd === 'end' || k.cmd === 'fire' || lineReady(state, k.cmd)) return null;
      if (k.kd && KD_OWN.has(k.cmd)) return null;
      // (what the command asks first: the stance, then the rest)
      const want = { prone: 'stance:prone', kneel: 'stance:kneel', stand: 'stance:stand' }[k.cmd];
      const stanceNow = { prone: 'prone', kneel: 'kneel', stand: 'stand' }[k.cmd];
      if ((k.cmd === 'kneel' || k.cmd === 'stand') && k.stance === stanceNow) return null;   // (the stance taken: the reload's line, range-reload)
      const step = want ?? { load: 'macro:load', ready: 'macro:ready', cease: 'macro:cease', clear: 'macro:clear', ...(k.R?.course === 'house' ? { stop: 'macro:safe' } : {}) }[k.cmd] ?? null;
      const said = SAID[k.cmd] ?? k.cmd, Said = said.replace(/^\w/, c => c.toUpperCase());
      return { k, step, said, Said, short: Said.split(',')[0] };
    },
    act: (ctx) => (ctx.variant === 'out' ? actIf(ctx.k, 'leave') : ctx.variant === 'two' || ctx.variant === 'standby' ? (ctx.k.inMode ? actIf(ctx.k, 'leave') : null)
      : !ctx.k.inMode ? 'stop:enter' : ctx.step ? actIf(ctx.k, ctx.step) : null),
    text: { 1: ['The tower said {said}.', 'You heard the tower: {said}.', '{Said}. The tower means it.', 'The tower is waiting on you: {said}.'],
      owed: ['The line has moved on. {Chain}.', 'You are behind the line: {chain}.', 'Catch up. {Chain}.', 'The tower went on without you. {Chain}.'],
      out: ['Done. Now out of it: X.', 'That is {said} done. Out of it: X.', 'Done. X, and stand still on your mark.', 'Out of it now: X.'],
      mark: ['Back on your mark.', 'You are off your mark. Back on it.', 'The tower wants you on your mark.', 'Your mark. Back on it.'],
      gait: ['Careful. Weapon up.', 'Careful, as the tower said.', 'The tower said Combat: Careful.', 'Careful.'],
      low: ['Low ready.', 'Muzzle down. Low ready.', 'Low ready, as the tower said.', 'Low ready.'],
      safe: ['On safe, finger off.', 'Safe it.', 'On safe for the tower.', 'Safety on.'],
      up: ['Rifle up first.', 'It swung onto the sling. Up.', 'Get the rifle back up.', 'Rifle up.'],
      chamber: ['A round up: MAKE READY.', 'Not sure what is in it. Find out, then a round up.', 'The chamber. Make it ready.', 'MAKE READY, as the tower said.'],
      two: ['Your number two is still on it. Wait.', 'Wait for your number two.', 'He is not done yet. Wait.', 'Your two. Wait for him.'],
      standby: ['Standby. Still, for the GO.', 'Standby. Out of it and still.', 'Hands still. GO is coming.', 'Standby. Wait for the GO.'],
      pistol: ['Rifle up first: holster the pistol.', 'Holster the pistol. Then the rifle.', 'Pistol away first. Rifle up.', 'The pistol back in. Rifle up.'] },
  },
  {
    id: 'range-kd', voice: 'di', repeatMs: RANGE_REPEAT_MS, tone: 'warn', reach: null,
    short: (ctx) => ctx.short,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.kd || !k.cmd || k.busy) return null;
      const R = k.R, line = R.line ?? 25;
      // (a hot KD line: the coach's hold, until it is held)
      if (k.cmd === 'fire' && k.hot && line !== 25 && R.call?.holdMil && k.choosing && k.offered('hold:call')) {
        const h = { xMil: R.call.holdMil[0], yMil: R.call.holdMil[1] ?? 0 };
        return { k, variant: 'hold', step: 'hold:call', short: 'Hold', from: R.call.crossMs > 0 ? 'the left' : 'the right', hold: holdSaid(h) };
      }
      if (!KD_OWN.has(k.cmd) || lineReady(state, k.cmd, { relay: false })) return null;
      const call = state.stop && k.steps.find(s => s.id === 'sight:call' && !s.off);
      switch (k.cmd) {
        case 'dial': return call ? { k, variant: 'dial', step: 'sight:call', short: 'Dial', call: call.label.replace(/^Dial the coach's call: /, '') } : null;
        case 'dope': { const c = DOPE_CARD.r7?.[line]?.elev ?? 0; return { k, variant: 'dope', step: `sight:dope:${line}`, short: 'Dope', line: line === 300 ? 'three hundred' : 'two hundred', clicks: `${Math.abs(c)} ${c < 0 ? 'down' : 'up'}` }; }
        case 'optic': return { k, variant: 'optic', step: 'optic:4', short: 'Four power' };
        case 'sit': return { k, variant: 'sit', step: k.stance !== 'sit' ? 'stance:sit' : 'macro:load', short: k.stance !== 'sit' ? 'Sit' : 'Load' };
        case 'reload': return { k, variant: 'reload', step: reloadOf(k)?.id ?? 'macro:load', short: 'Reload' };
        case 'police': return { k, variant: 'police', step: null, kdAct: 'kd:police', short: 'Police' };
        case 'turnIn': return { k, variant: 'turnIn', step: null, kdAct: 'kd:turnIn', short: 'Turn in' };
        case 'declare': return { k, variant: 'declare', step: null, kdAct: 'kd:declare', short: 'Declare' };
        default: return null;
      }
    },
    // (police, turn in and declare are the range's own actions, done by T as by their panel rows: range.js kdAct)
    act: (ctx) => (ctx.kdAct ?? (!ctx.step ? null : !ctx.k.inMode ? 'stop:enter' : actIf(ctx.k, ctx.step))),
    text: {
      1: ['Wait for the tower.'],
      hold: ['Wind from {from}: the coach says hold {hold}.', 'The coach called the wind. Hold {hold}.', 'Hold {hold}, as the coach called it.', 'Wind from {from}. Hold where the coach said: {hold}.'],
      dial: ['Dial the coach\'s call: {call}.', 'The coach called {call}. Dial it.', 'Turrets: {call}, as called.', 'Your corrections: {call}.'],
      dope: ['Your dope for {line} is {clicks}.', 'The card says {clicks} for {line}. Dial it.', 'Dope for {line}: {clicks}.', 'Set {clicks}: your dope for {line}.'],
      optic: ['Four power.', 'Optic up to four.', 'Throw the lever: four power.', 'Four power, as the tower said.'],
      sit: ['Sitting, then LOAD.', 'Sit down, then the magazine in.', 'The sitting position. Then LOAD.', 'Sit, and load.'],
      reload: ['Your next three. RELOAD.', 'Next magazine. RELOAD.', 'The tower said RELOAD.', 'Three more. RELOAD.'],
      police: ['Police your brass.', 'Every case off the regolith. Police your brass.', 'Your brass. All of it.', 'Pick up your brass.'],
      turnIn: ['Unused rounds back to the coach.', 'Anything left goes back to the coach.', 'Rounds to the coach.', 'Turn in what you did not fire.'],
      declare: ['Say it: no brass, no ammo.', 'The declaration: no brass, no ammo.', 'No brass, no ammo. Say it.', 'Declare it: no brass, no ammo.'],
    },
  },
  {
    id: 'range-reload', voice: 'di', repeatMs: RANGE_REPEAT_MS, tone: 'note', short: 'Reload', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || (k.cmd !== 'kneel' && k.cmd !== 'stand') || k.busy || lineReady(state, k.cmd)) return null;
      if (k.stance !== (k.cmd === 'kneel' ? 'kneel' : 'stand')) return null;
      // (nothing left anywhere, as the coach counts it: never "Empty one out, full one in" with no full one to be had
      // (the fixer's, 0.0.6, after the user's run-out: the line read it throughout; my call, the count the coach's own)
      if (k.R.dry || roundsLeft(state) === 0) return { k, reload: null, variant: 'dry' };
      return { k, reload: reloadOf(k)?.id ?? null };
    },
    act: (ctx) => (ctx.reload ? actIf(ctx.k, ctx.reload) : null),
    text: { 1: ['RELOAD. A fresh magazine, and close the bolt on it.', 'Fresh magazine. The bolt goes forward on it.', 'The tower said RELOAD. That means now.', 'Empty one out, full one in, bolt home.'],
      dry: ['Nothing left to load. Tell your coach.', 'No rounds anywhere. On safe, and tell your coach.', 'Every magazine is empty. Safe, and say so.', 'Nothing to load. On safe; the coach will see.'] },
  },
  {
    id: 'range-unknown', voice: 'di', repeatMs: RANGE_REPEAT_MS, tone: 'note', short: 'Press check', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.b || !k.inHand || k.b.stoppage || k.busy) return null;
      if (k.b.chamber !== '?' && k.b.mag !== '?') return null;
      return { k };
    },
    act: (ctx) => actIf(ctx.k, 'pressCheck'),
    text: { 1: ["You don't know what's in it. Find out.", 'Not sure of the chamber? Press check.', 'A question mark is not a condition. Check it.', 'Find out what is in the chamber before the coach asks.'] },
  },
  {
    id: 'range-fire', voice: 'di', repeatMs: RANGE_REPEAT_MS, tone: 'note', reach: null,
    short: (ctx) => (ctx.variant === 'aim' ? 'Aim' : ctx.variant === 'safe' ? 'Off safe' : ctx.variant === 'mark' ? 'Your mark' : 'Press'),
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.hot || !k.b || k.b.stoppage || k.busy || !k.inHand) return null;
      if (k.b.chamber === 'empty' && k.b.locked) return null;
      if (k.aimed !== k.own) return { k, variant: 'aim' };
      if (k.b.mode === 'safe') return { k, variant: 'safe' };
      // (slow fire at a KD face: the next pull after your mark (shooting.js markWaitOf), never into a face in the pits)
      if (k.offered('wait:mark') || state.stop?.doing?.step === 'wait:mark') return { k, variant: 'mark' };
      // (the press names Fire's key on the panel drawn (the design review of 2026-11-13: Fire moved from 1 to 6 on the 25 m and KD lines))
      const key = k.offered('fire') ? keysFor(k.steps, 'fire', { layout: layoutIn(state) }).text : null;
      return key ? { k, variant: `press${key}`, words: 'pressKey', key } : { k, variant: 'press' };
    },
    // (T aims and takes the safety off, but never takes the shot: the press is always your own digit, held or tapped
    // (the design review's: 33 presses of T cleared the scene, T pulling every trigger; pillar 3, you decide))
    act: (ctx) => (ctx.variant === 'aim' ? actIf(ctx.k, 'aim', null, ctx.k.own) : ctx.variant === 'safe' ? actIf(ctx.k, 'selector:semi') : ctx.variant === 'mark' ? actIf(ctx.k, 'wait:mark') : null),
    text: {
      1: ['Breathe out. Press.'],
      aim: ['Your card. Aim.', 'The card in your lane. Get on it.', 'Commence fire means the card. Aim.', 'The reticle on your card.'],
      safe: ['Off safe, then press.', 'The safety is still on. Thumb it off.', 'Off safe. It will not fire on safe, whatever you hope.', 'Thumb the selector to semi.'],
      press: ['Breathe out. Press.', 'Let the sight settle. Then press.', 'Squeeze, do not snatch.', 'Exhale, hold, press. Let the shot surprise you.'],
      pressKey: ['Breathe out. Press: {key}.', 'Let the sight settle. Then press: {key}.', 'Squeeze, do not snatch: {key}.', 'Exhale, hold, press: {key}. Let the shot surprise you.'],
      mark: ['Wait for your mark.', 'Your target is in the pits. Wait for the disk.', 'Slow fire: one shot, one mark. Wait.', 'Let the pits mark it. Then the next.'],
    },
  },
  {
    id: 'range-wait', voice: 'di', repeatMs: RANGE_REPEAT_MS, tone: 'calm', reach: null, short: 'Wait',
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || k.hot || k.busy) return null;
      if (k.cmd && k.cmd !== 'brief' && k.cmd !== 'end' && !lineReady(state, k.cmd)) return null;
      // (the KD course: nothing during the brief (nothing has been done to be "done"), and no "Hands still" after a
      // command answered as asked, which read as a reprimand nobody earned (the design review's of v0.0.7))
      if (k.kd) return k.cmd === 'brief' ? null : { k, noHumour: true, variant: 'kd' };
      return { k, noHumour: true };
    },
    act: (ctx) => (ctx.k.choosing && ctx.k.offered('wait') ? 'stop:wait' : null),
    text: { 1: ['Wait for the tower.', 'Nothing happens until the tower says so.', 'Done. Wait for the next command.', 'Hands still. The tower runs this line.'],
      kd: ['Wait for the tower.', 'Nothing happens until the tower says so.', 'Done. Wait for the next command.', 'Good. Now wait for the tower.'] },
  },
]);

/**
 * What the house's tower waits on (range-cmd, see the header), or undefined to let the shared rule speak: at Stop and SHOW
 * CLEAR with the P-12 in your hand, Rifle up first (its rows clear the rifle; the tower judges both guns: shoothouse.js
 * houseReady); at LOAD, MAKE READY and Standby, once the command's own work is done, what houseWant still lacks, in the
 * order it is put right with T: the gun's (the shared rule's macro), on safe, low ready, Careful (Combat), back on your mark
 * (the drill's Back on your mark), then out of it (X), then your number two (out of it, time runs: Wait). null where nothing
 * is lacking but stillness, or the tower's own.
 */
function houseCmd(state, k) {
  const said = SAID[k.cmd] ?? k.cmd, Said = said.replace(/^\w/, c => c.toUpperCase()), base = { k, said, Said };
  if ((k.cmd === 'stop' || k.cmd === 'clear') && drawn(state, k.pid)) return { ...base, variant: 'pistol', step: 'weapon:rifle-up', short: 'Rifle up' };
  if (k.cmd !== 'load' && k.cmd !== 'ready' && k.cmd !== 'standby') return undefined;
  const gun = state.items?.[k.gunId];
  if (k.cmd === 'load') {
    // (your magazine in: the tower waits on his (two:mag, two:busy))
    if (!gun?.mag || k.R.dry) return undefined;
    return twoLacks(state, 'load') ? { ...base, variant: 'two', step: null, short: 'Wait' } : undefined;
  }
  // (MAKE READY and Standby: the rifle's own work first, the shared rule's macro)
  const want = houseWant(state), me = state.actors?.list?.find(a => a.who === k.pid);
  // (a rifle that swung onto its sling (a fumble's): up first, as pairs-ready's)
  if (k.inMode && !k.inHand && k.offered('up') && want !== null && want !== 'out') return { ...base, variant: 'up', step: 'up', short: 'Rifle up' };
  if (want === 'mag' || want === 'chamber') {
    if (k.cmd === 'ready' && (!k.inMode || k.offered('macro:ready'))) return undefined;
    const step = want === 'mag' ? 'macro:load' : k.offered('macro:ready') ? 'macro:ready' : k.offered('pressCheck') ? 'pressCheck' : k.offered('charge') ? 'charge' : 'macro:ready';
    return { ...base, variant: want === 'mag' ? 1 : 'chamber', step, short: 'Make ready' };
  }
  if (want === 'safe') return { ...base, variant: 'safe', step: k.b?.mode !== 'safe' ? 'selector:safe' : 'finger', short: 'Safe' };
  if (want === 'low') return { ...base, variant: 'low', step: 'posture:lowReady', short: 'Low ready' };
  // (out of the mode the rest are the body's: the mark and the gait, put right in the mode by their rows; then out of it)
  const off = !!me && !!k.R.house && want !== null && offMark(me);
  if (want === 'out' || want === 'mark' || want === 'gait') {
    if (off) return { ...base, variant: 'mark', step: 'move:mark', short: 'Your mark' };
    if ((me?.moveStance ?? 'relaxed') !== 'combat') return { ...base, variant: 'gait', step: 'gait:combat', short: 'Careful' };
    if (want === 'out' && !state.time?.doing) return { ...base, variant: 'out', step: null, short: 'Out of it' };
  }
  if (want === 'still') return null;
  if (typeof want === 'string' && want.startsWith('two')) return { ...base, variant: 'two', step: null, short: 'Wait' };
  // (nothing lacking: at Standby the GO comes to a shooter out of it and still; nothing to press)
  if (want === null && k.cmd === 'standby') return { ...base, variant: 'standby', step: null, short: 'Standby' };
  return undefined;
}
// (off the start mark, as houseWant reads it: shoothouse.js STACK_M from the lane's start)
function offMark(me) { const S0 = HOUSE1.start; return Math.hypot(me.x - S0.x, me.z - S0.z) > COURSES.house.stackM; }

/** The tempos an act may name after '@' (checks.js TEMPO). */
const STEP_TEMPOS = Object.freeze(['normal', 'rushed', 'careful', 'steady']);

/** The step an act names: { step, tempo, target } ('stop:fire@careful', 'stop:aim>paper:4'), or null. */
export function stepOfAct(act) {
  if (typeof act !== 'string' || !act.startsWith('stop:')) return null;
  let rest = act.slice(5), target = null, tempo = 'normal';
  const gt = rest.indexOf('>');
  if (gt >= 0) { target = rest.slice(gt + 1); rest = rest.slice(0, gt); }
  const at = rest.indexOf('@');
  // a tempo after '@' ('fire@careful'); otherwise the '@' is the row's place ('reach@p3', 'reach@ground': v0.0.10's fix, T did nothing)
  if (at >= 0 && STEP_TEMPOS.includes(rest.slice(at + 1))) { tempo = rest.slice(at + 1); rest = rest.slice(0, at); }
  return { step: rest, tempo, target };
}

/** The KD course's own commands, range-kd's (0.0.7). */
const KD_OWN = new Set(['dial', 'dope', 'optic', 'sit', 'reload', 'police', 'turnIn', 'declare', 'group', 'walk', 'pits']);

/** The tower's commands, for the rules' words (courses.js SEQ). */
export const RANGE_CMDS = Object.freeze(SEQ.map(c => c.id));
