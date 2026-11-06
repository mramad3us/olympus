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
//                           first where it has one; out of the mode, the rifle up first)
//   range-reload    note    in the stance the tower called, the bolt locked on an empty: RELOAD
//   range-unknown   note    a '?' on the weapon card: a press check
//   range-fire      note    the line hot: aim at your card, then off safe, then "Breathe out. Press."
//                           (T aims and goes off safe; the press is never T's, always your own digit)
//   range-wait      calm    nothing to do: wait for the tower
// While a session is open the base rules keep quiet below urgent (instinct/base.js) and these speak in
// every tone even while time stands still for the step panel ('stop'), the line's lead "Time stands
// still." (instinct.js; VIEWS §7.4).
// Pure.
import { playerActor, playerId } from '../../../core/ids.js';
import { beliefOf } from '../../arms/firearms.js';
import { stepsOf, gunOn } from '../../arms/shooting.js';
import { rangeOf, lineReady } from '../../scenarios/handling.js';
import { SEQ } from '../../../data/courses.js';
import { headOf } from '../../people/perception.js';

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
      busy: !!S?.doing && S.doing.kind !== 'wait', aimed: S?.aim?.key ?? null, own: `paper:${R.lane}`, head: me.headRad ?? (me.face ? headOf(me.face) : null), offered, steps, cmd: R.cmd?.id ?? null, hot: R.hot };
  }
  memo = { state, key, v };
  return v;
}
// (an act only where its step is in the panel now, choosing)
const actIf = (k, step, tempo = null, target = null) => (k.choosing && k.offered(step) ? `stop:${step}${tempo ? `@${tempo}` : ''}${target ? `>${target}` : ''}` : null);
// (the reload the panel offers, if any: speed or keep the empty from locked empty, tactical with rounds left)
const reloadOf = (k) => k.steps.find(s => s.kind === 'command' && String(s.macro).startsWith('reload:') && !s.off) ?? null;

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
    act: (ctx) => actIf(ctx.k, 'macro:cease'),
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
      if (!k || !k.cmd || k.cmd === 'brief' || k.cmd === 'end' || k.cmd === 'fire' || k.busy || lineReady(state, k.cmd)) return null;
      // (what the command asks first: the stance, then the rest)
      const want = { prone: 'stance:prone', kneel: 'stance:kneel', stand: 'stance:stand' }[k.cmd];
      const stanceNow = { prone: 'prone', kneel: 'kneel', stand: 'stand' }[k.cmd];
      if ((k.cmd === 'kneel' || k.cmd === 'stand') && k.stance === stanceNow) return null;   // (the stance taken: the reload's line, range-reload)
      const step = want ?? { load: 'macro:load', ready: 'macro:ready', cease: 'macro:cease', clear: 'macro:clear' }[k.cmd] ?? null;
      return { k, step, said: SAID[k.cmd] ?? k.cmd, short: (SAID[k.cmd] ?? k.cmd).split(',')[0].replace(/^\w/, c => c.toUpperCase()) };
    },
    act: (ctx) => (!ctx.k.inMode ? 'stop:enter' : ctx.step ? actIf(ctx.k, ctx.step) : null),
    text: { 1: ['The tower said {said}.', 'You heard the tower: {said}.', '{said}. The tower does not say it for the exercise.', 'The tower is waiting on you: {said}.'] },
  },
  {
    id: 'range-reload', voice: 'di', repeatMs: RANGE_REPEAT_MS, tone: 'note', short: 'Reload', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || (k.cmd !== 'kneel' && k.cmd !== 'stand') || k.busy || lineReady(state, k.cmd)) return null;
      if (k.stance !== (k.cmd === 'kneel' ? 'kneel' : 'stand')) return null;
      return { k, reload: reloadOf(k)?.id ?? null };
    },
    act: (ctx) => (ctx.reload ? actIf(ctx.k, ctx.reload) : null),
    text: { 1: ['RELOAD. A fresh magazine, and close the bolt on it.', 'Fresh magazine. The bolt goes forward on it.', 'The tower said RELOAD. That means now.', 'Empty one out, full one in, bolt home.'] },
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
    short: (ctx) => (ctx.variant === 'aim' ? 'Aim' : ctx.variant === 'safe' ? 'Off safe' : 'Press'),
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || !k.hot || !k.b || k.b.stoppage || k.busy || !k.inHand) return null;
      if (k.b.chamber === 'empty' && k.b.locked) return null;
      if (k.aimed !== k.own) return { k, variant: 'aim' };
      if (k.b.mode === 'safe') return { k, variant: 'safe' };
      return { k, variant: 'press' };
    },
    // (T aims and takes the safety off, but never takes the shot: the press is always your own digit, held or tapped
    // (the design review's: 33 presses of T cleared the scene, T pulling every trigger; pillar 3, you decide))
    act: (ctx) => (ctx.variant === 'aim' ? actIf(ctx.k, 'aim', null, ctx.k.own) : ctx.variant === 'safe' ? actIf(ctx.k, 'selector:semi') : null),
    text: {
      1: ['Breathe out. Press.'],
      aim: ['Your card. Aim.', 'The card in your lane. Get on it.', 'Commence fire means the card. Aim.', 'The reticle on your card.'],
      safe: ['Off safe, then press.', 'The safety is still on. Thumb it off.', 'Off safe. It will not fire on safe, whatever you hope.', 'Thumb the selector to semi.'],
      press: ['Breathe out. Press.', 'Let the sight settle. Then press.', 'Squeeze, do not snatch.', 'Exhale, hold, press. Let the shot surprise you.'],
    },
  },
  {
    id: 'range-wait', voice: 'di', repeatMs: RANGE_REPEAT_MS, tone: 'calm', reach: null, short: 'Wait',
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || k.hot || k.busy) return null;
      if (k.cmd && k.cmd !== 'brief' && k.cmd !== 'end' && !lineReady(state, k.cmd)) return null;
      return { k, noHumour: true };
    },
    act: (ctx) => (ctx.k.choosing && ctx.k.offered('wait') ? 'stop:wait' : null),
    text: { 1: ['Wait for the tower.', 'Nothing happens until the tower says so.', 'Done. Wait for the next command.', 'Hands still. The tower runs this line.'] },
  },
]);

/** The step an act names: { step, tempo, target } ('stop:fire@careful', 'stop:aim>paper:4'), or null. */
export function stepOfAct(act) {
  if (typeof act !== 'string' || !act.startsWith('stop:')) return null;
  let rest = act.slice(5), target = null, tempo = 'normal';
  const gt = rest.indexOf('>');
  if (gt >= 0) { target = rest.slice(gt + 1); rest = rest.slice(0, gt); }
  const at = rest.indexOf('@');
  if (at >= 0) { tempo = rest.slice(at + 1); rest = rest.slice(0, at); }
  return { step: rest, tempo, target };
}

/** The tower's commands, for the rules' words (courses.js SEQ). */
export const RANGE_CMDS = Object.freeze(SEQ.map(c => c.id));
