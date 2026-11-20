// OLYMPUS sim: the drill instructor's line at the armoury, the canopy and the ammunition point, the DI's next row and its press (test-armoury, "The window and the canopy"; SKILLS §14; the build sheet v0.0.28 item 15, AM§3).
//
// One step at a time, the scene's own (armouryStepOf, from armoury-day.js armouryNow: what the player sees): the muzzle first (arm-muzzle,
// urgent: a muzzle the habit left on a person, "Sling it", T slings the rifle); then, while the standing command waits on you, one of
//   arm-walk    (warn)  a ring you are not on: the keys toward it ("Walk to the yellow ring: up and left (Z and Q)."), or toward the
//                       first corner of the way round what stands between (armoury-day.js walkVia: the barrel's drum); T does nothing,
//                       the walk is yours;
//   arm-serial  (note)  the rifle in hand, unread, unsigned: "Read the serial against your card"; T reads it;
//   arm-count   (note)  the cartons in front of you, uncounted: "Count before you sign"; T counts (never bundled: the habit stays a press);
//   arm-brass   (note)  your brass beyond the police's 4 m: "Three more cases, five metres down: S, then R."; T does nothing;
//   arm-tempo   (note)  at your table: the DI's tempo (armoury-day.js diTempoOf: the most careful whose clean, one re-clean and two trips
//                       fit before ten-thirty; none, rushed) and its row; T cleans at it;
//   arm-cmd     (warn)  any other row the command asks for, the next in order; T does it. From the corporal up (ARM_BUNDLE_RUNG, the test
//                       sheet's rung) T's act at the window is Draw (read, show clear, sign, one press) and at the turn-in Rounds back,
//                       declare; below it one row a press;
//   arm-wait    (calm)  nothing to do: the scene's own clock runs (the armourer at the rack, a splash, an act under way, the next command).
// In the step panel (G) while a command stands, arm-cmd names the panel's UNLOAD, SHOW CLEAR where the command wants a show clear (T
// chooses it), else "Out of the panel" (T leaves it), never arm-wait (the fixer of v0.0.28's play review).
// Every line names what to press, the key by its label from core/keys.js and the row by its label (courses.js ARM_ROWS): the user's report
// of 2026-11-19. Pure: reads only; T's act goes to armoury-day.js armouryTAct (instinct.js).
import { label } from '../../../core/keys.js';
import { ARM_ROWS } from '../../../data/courses.js';
import { armouryOf, armouryNow, diTempoOf, bundlesOf, farCases } from '../../scenarios/armoury-day.js';
import { dirWords } from './void.js';
import { stepsOf } from '../../arms/shooting.js';

// (a word with its first letter up)
const cap = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w);
const KEY = Object.freeze({ R: label('hand'), T: label('instinct') });
// (the rows' words, filled once with the keys' labels: {R} R, {T} T)
const keys = (lines) => Object.freeze(lines.map(l => l.replaceAll('{R}', KEY.R).replaceAll('{T}', KEY.T)));
const COUNT = Object.freeze(['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven']);

/** The DI's step now (see the header): { id, variant, act, …words } or null off the course or when the muzzle's line is up. */
export function armouryStepOf(state, me) {
  const R = armouryOf(state);
  if (!R || R.end || !me) return null;
  const N = armouryNow(state);
  // (the step panel open (G) while a command stands: its UNLOAD, SHOW CLEAR where the command asks for one, else out of the panel; it said
  // "Wait. It comes to you." under a standing "UNLOAD, SHOW CLEAR · R: UNLOAD, SHOW CLEAR" (the fixer of v0.0.28's play review, finding 8))
  if (state.stop?.mode === 'stop' && !N.busy && N.cmd && !R.next && !R.end) return panelStepOf(state, N);
  if (N.busy || !N.cmd || R.next || state.stop) return { id: 'arm-wait', variant: N.busy ? 'busy' : 'wait' };
  const has = (id) => N.acts.includes(id), row = (id) => ({ id: 'arm-cmd', variant: `row|${id}`, act: `arm:${id}`, row: ARM_ROWS[id] });
  if (N.cmd === 'police') {
    if (has('police')) return row('police');
    const f = farCases(state);
    if (f) return { id: 'arm-brass', variant: `brass|${f.n}|${f.m}|${f.dir}`, act: null, n: cap(COUNT[f.n] ?? String(f.n)), cases: f.n === 1 ? 'case' : 'cases', m: f.m, dir: f.dir, key: label(f.key) };
  }
  // (the keys toward the walk's point, the spot or the way round what stands between (armoury-day.js walkVia; the fixer of v0.0.28's play
  // review, finding 1: "up (Z)" into the clearing barrel's drum))
  if (N.ring && !N.at && N.spot) { const to = N.via ?? N.spot, dir = dirWords(me.x, me.z, [to.x, to.z]); return { id: 'arm-walk', variant: `walk|${dir}`, act: null, dir }; }
  if (!N.acts.length) return { id: 'arm-wait', variant: 'wait' };
  const bundle = bundlesOf(state);
  if (N.cmd === 'window') {
    if (bundle) return { id: 'arm-cmd', variant: 'draw', act: 'arm:draw', row: ARM_ROWS.draw, words: 'draw' };
    if (has('read')) return { id: 'arm-serial', variant: 'read', act: 'arm:read', row: ARM_ROWS.read };
    return row(has('show') ? 'show' : 'sign');
  }
  if (N.cmd === 'issue') return has('count') ? { id: 'arm-count', variant: 'count', act: 'arm:count', row: ARM_ROWS.count } : row('sign20');
  if (N.cmd === 'turnIn' && bundle) return { id: 'arm-cmd', variant: 'backDeclare', act: 'arm:backDeclare', row: ARM_ROWS.backDeclare, words: 'backDeclare' };
  if (N.cmd === 'clean') {
    const t = diTempoOf(state), id = N.rows.find(r => r.tempo === t)?.id ?? t;
    if (!has(id)) return row(N.acts[0]);
    return { id: 'arm-tempo', variant: `tempo|${t}`, act: `arm:${id}`, tempo: cap(t), row: ARM_ROWS[id], words: t };
  }
  return row(N.acts[0]);
}

// (the step panel's line while a command stands (see armouryStepOf): its UNLOAD, SHOW CLEAR (the panel's row, T chooses it) where the command
// asks for a show clear not yet made and the panel offers one, else out of the panel (T leaves it), so the command's row is R's again)
function panelStepOf(state, N) {
  const wants = N.rows.some(r => r.id === 'show' || r.id === 'barrel') && !armouryOf(state).shown;
  const clear = wants ? stepsOf(state).find(x => x.id === 'macro:clear' && !x.off) : null;
  if (clear) return { id: 'arm-cmd', variant: 'panel|clear', act: 'stop:macro:clear', row: 'macro:clear', words: 'panel', name: ARM_ROWS.show };
  return { id: 'arm-cmd', variant: 'panel|leave', act: 'stop:leave', row: null, words: 'leave', name: 'Leave the panel' };
}
// (the muzzle the habit left on a person (carry.js's flag or point, still in the cone): the line until it is off them)
function muzzleOn(state, me) {
  const near = state.people?.[me.who]?.kit?.carry?.near ?? {};
  return Object.values(near).some(r => (r.result === 'flag' || r.result === 'point') && Number.isFinite(r.inMs));
}

/** The armoury's rules (see the header), weighed after the range's (instinct.js RULES). */
export const ARMOURY_RULES = Object.freeze([
  {
    id: 'arm-muzzle', voice: 'di', tone: 'urgent', short: 'Muzzle', reach: null, repeatMs: 0,
    when(state, me) { return armouryOf(state) && !armouryOf(state).end && muzzleOn(state, me) ? { noHumour: true } : null; },
    act: () => 'arm:sling',
    text: { 1: keys(['Muzzle off them. Sling it: {T}.', 'Your muzzle is on a man. Sling it: {T}.']) },
  },
  ...[
    ['arm-walk', 'warn', 'Walk', ['Walk to the yellow ring: {dir}.', 'The yellow ring: {dir}.']],
    ['arm-serial', 'note', 'Serial', ['Read the serial against your card: {R}, or {T}.', 'Check the number before you sign: {R}, Read the serial back.']],
    ['arm-count', 'note', 'Count', ['Count before you sign: {R}, Count the rounds.', 'Count what you sign for: {R}, or {T}.']],
    ['arm-brass', 'note', 'Brass', ['{n} more {cases}, {m} metres {dir}: {key}, then {R}.', 'Your brass, {m} metres {dir}: {key} to it, then {R}.']],
    ['arm-cmd', 'warn', null, ['{row}: {R}, or {T}.', 'Next, {row}: {R}.']],
    ['arm-wait', 'calm', 'Wait', ['Wait for the command.', 'Wait. It comes to you.']],
  ].map(([id, tone, short, lines]) => ({
    id, voice: 'di', tone, short: short ?? ((ctx) => ctx.name ?? ctx.row ?? 'Next'), reach: null, repeatMs: 0,
    when(state, me) { const s = armouryStepOf(state, me); return s && s.id === id ? { ...s, noHumour: id !== 'arm-wait' } : null; },
    act: (ctx) => ctx.act ?? null,
    text: { 1: keys(lines), draw: keys(['Draw: {T} reads it, shows it clear and signs.', 'Draw it: {T}, or {R} a row at a time.']), backDeclare: keys(['Rounds back, then declare: {T}.', 'Hand them back and declare: {T}, or {R} a row at a time.']),
      panel: keys(['{name} on the panel: its row, or {T}.', 'The panel\'s {name}: its row, or {T}.']), leave: keys(['Out of the panel for the command: {T}.', 'Leave the panel, then {R}: {T} leaves it.']) },
  })),
  {
    id: 'arm-tempo', voice: 'di', tone: 'note', short: (ctx) => ctx.tempo ?? 'Tempo', reach: null, repeatMs: 0,
    when(state, me) { const s = armouryStepOf(state, me); return s && s.id === 'arm-tempo' ? { ...s, noHumour: true } : null; },
    act: (ctx) => ctx.act ?? null,
    text: {
      1: keys(['{tempo}: hold {R} for {row}, or {T}.', '{tempo} fits the time: hold {R}, {row}.']),
      rushed: keys(['Rushed: ten-thirty is close. Hold {R}, {row}, or {T}.', 'No time for more: hold {R}, {row}.']),
      normal: keys(['Normal leaves time for a second go. Hold {R}, {row}, or {T}.', 'Normal: room for one more if he turns it back. Hold {R}, {row}.']),
      careful: keys(['Careful: you have the time. Hold {R}, {row}, or {T}.', 'Take it careful, there is time. Hold {R}, {row}.']),
    },
  },
]);
