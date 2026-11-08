// OLYMPUS cards: the title's Tests menu, the test scenes the user plays and scores (ROADMAP §2.2).
//
// Each new mechanic is first a small playable scene with its own goal, reachable from the title's
// Tests menu and from ?play=test-<id>&seed=<n> (ROADMAP §2.1). The scenes are time's data
// (src/data/scenes.js SCENES: { id, title, scenario, hour, goal, aspects, body, outfit, endOn }); this
// page lists them on the title's paper, each with its goal line and, once scored, the last score kept
// in this browser (cards/score.js), and a click (or Enter on the focused one) starts it: main.js makes
// newGame({ scenario, seed, hour }) with no saves (the build sheet 0.0.4 §8, item 24). Back (or Esc)
// returns to the title. First used at v0.0.4: "Ten minutes under the shower" and "The klaxon at 02:30".
// In play the goal line shows for GOAL_S in the toasts, and the scene ends on its endOn fact
// (endsScene: a shower cut short by Backspace is not the end, its finish is: my call), once the splash
// has played out and END_HOLD_S 6 s of live play after it (or Enter: the line says so; C and J open over
// the world meanwhile), with the end card (cards/end.js). The 0.0.5 round's test-handling ends on the
// range fact at either of two phases ({ fact: 'range', phase: ['clear', 'stopped'] }: "The line is
// clear.", or the range stopped for a fault), so endOn's phase may be a list; endFacts() names every
// fact a scene ends on, for main.js to hear; sceneSaid(scene, range) the end card's line for a scene
// that has one (the range's summary: "Clear at 09:14 · 61 of 75 · 4 V · no faults").
// 0.0.8 (the build sheet 0.0.8 §2.3, §2.4): "Pairs" (test-pairs) is listed after test-range; a scene played as a sheet
// (pickerOf: its course 'pairs') opens the sheet picker (cards/pairs.js) before it starts, and its end card's line is
// the scene's own summary (rangeNow's, from pairsNow: "Private · 5 strings · take-in 0.55 to 1.25 s · …").
// 0.0.10 (the build sheet 0.0.10 §2.3): "Bang" (test-stress, listed after "Three bangs" by scenes.js) is played as a sheet too, its
// picker opening on the Boot recruit (its course 'stress' counts as a sheet's course where a scene names no sheets).
import { lastScore } from './score.js';
import { stopWords } from '../../sim/scenarios/handling.js';

/** A scene's goal line shows this long in TOASTS on arrival (s of play; the build sheet 0.0.4 §2.4). */
export const GOAL_S = 8;
/** A scene's end card waits this long of live play after its fact's splash has played out, or Enter, so you see where it left you (s; the review of v0.0.4: clean and wet-headed at 19:40, the squad lying down at 03:00). */
export const END_HOLD_S = 6;

/** Whether a fact ends a scene (its endOn: { fact, phase? (a phase or a list), activity?: [ids] }): a cut activity (a fraction under 1) does not (my call: finishing it does). */
export function endsScene(endOn, type, payload = {}) {
  if (!endOn || type !== endOn.fact) return false;
  if (endOn.phase && !(Array.isArray(endOn.phase) ? endOn.phase.includes(payload?.phase) : payload?.phase === endOn.phase)) return false;
  if (endOn.activity && !endOn.activity.includes(payload.activity)) return false;
  if (type === 'activity' && Number.isFinite(payload.fraction) && payload.fraction < 1) return false;
  return true;
}

/** Whether a scene is played as a sheet, its picker first (test-pairs: the sheets it lists, scenes.js; or its course 'pairs'). */
export const pickerOf = (scene) => !!scene && ((Array.isArray(scene.sheets) && scene.sheets.length > 0) || scene.course === 'pairs' || scene.course === 'stress');

/** The facts the scenes end on (SCENES' endOn facts), each once. */
export const endFacts = (scenes) => [...new Set(Object.values(scenes ?? {}).map(s => s.endOn?.fact).filter(Boolean))];

/** The clock's hh:mm of a game ms, by clockText (main.js's, the live site's clock). */
const DEFAULT_CLOCK = (ms) => String(ms);
/**
 * The end card's line for a scene, or null: a range scene's summary from rangeNow(state) ({ summary: { score, of,
 * v, shots, faults, clearAtMs, sat }, end: { phase, atMs, why } }): "Clear at 09:14 · 61 of 75 · 4 V · no faults", or
 * "Stopped: <why> · 21 of 75 · 2 faults", a string sat out "· 1 string not fired" (0.0.6).
 */
export function sceneSaid(range, { clockText = DEFAULT_CLOCK } = {}) {
  const sm = range?.summary;
  if (!sm) return null;
  // (0.0.7: the KD course's summary is the range's own line, "Clear at 10:31 · zero in 2 groups · 300 m 21 of 25 · …",
  // rangeNow giving kdNow's in its place (the build sheet 0.0.7 §2.3); an incident goes on a line of its own: sceneLines)
  if (typeof sm === 'string') return sm;
  const faults = Number(sm.faults) || 0, stopped = (range.end?.phase ?? range.phase) === 'stopped', why = range.end?.why ?? range.why ?? null;
  const head = stopped ? `Stopped${why ? `: ${stopWords(why)}` : ''}` : Number.isFinite(sm.clearAtMs) ? `Clear at ${clockText(sm.clearAtMs)}` : 'The line';
  // (0.0.6: a string sat out for want of rounds is said, so 70 of 75 with one string unfired reads as it was; one fired
  // with more than its rounds too, "1 string over-fired" (the fixer's))
  const sat = Number(sm.sat) || 0, over = Number(sm.over) || 0;
  return [head, `${sm.score ?? 0} of ${sm.of ?? 0}`, sm.v ? `${sm.v} V` : null, sat ? `${sat} string${sat === 1 ? '' : 's'} not fired` : null, over ? `${over} string${over === 1 ? '' : 's'} over-fired` : null, faults ? `${faults} fault${faults === 1 ? '' : 's'}` : 'no faults'].filter(Boolean).join(' · ');
}

/**
 * The end card's lines for a scene: [summary, incident?, relay?]: sceneSaid's line, then on the KD an incident's words
 * ("Range closed: Pvt Okafor hit in the left thigh by a negligent discharge, evacuated"), from kdNow's casualty
 * ({ words } or { who, outcome, part }) or the range's incident line where it gives one, and the relay's ranked scores
 * (kdNow's relayLine: "Relay one: you 62 of 70 · Cpl Xie 68 of 75 · … (2nd of 6)"). kd: kdNow's record, or null.
 */
export function sceneLines(range, kd = null, opts = {}) {
  const head = sceneSaid(range, opts) ?? (typeof kd?.summary === 'string' ? kd.summary : null);
  const c = kd?.casualty ?? null, incident = range?.incident ?? kd?.incident ?? (c ? c.words ?? (c.outcome ? `Range closed: ${c.name ?? c.who ?? 'a marine'} hit${c.part ? ` in the ${c.part}` : ''} by a negligent discharge, ${c.outcome}` : null) : null);
  return [head, incident, kd?.relayLine ?? null].filter(Boolean);
}

/** The page's body: a paper sheet. scenes: SCENES' records in order; onPick(scene); onBack(); storage (the scores). */
export function testsPage({ scenes, onPick, onBack, version = '?', storage = globalThis.localStorage }) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(globalThis.document.createElement(tag), props); for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k); return n; };
  const item = (text, about, onclick, className = 'item') => el('button', { className, onclick, type: 'button' }, text, about ? el('small', { textContent: about }) : null);
  const rows = scenes.map((s) => {
    const last = lastScore(storage, s.id);
    const scored = last ? ` · last scored ${Object.entries(last.aspects).map(([k, v]) => `${k} ${v}`).join(', ')}${last.star ? ' ★' : ''}` : ' · not scored yet';
    return item(s.title, `${s.goal}${scored}`, () => onPick?.(s), 'item scene');
  });
  return el('div', { className: 'sheet tests' },
    el('h2', { textContent: 'TESTS' }),
    el('p', { className: 'sub', textContent: `v${version} · each mechanic first as a scene of its own, to play and score` }),
    el('hr'),
    ...rows,
    el('hr'),
    item('Back', null, () => onBack?.(), 'item small'),
    el('p', { className: 'note', textContent: 'A scene saves nothing. At its end: Again, or Score it (three aspects 0 to 100, a ★, a note), then Copy my scores and paste the line into the conversation.' }));
}
