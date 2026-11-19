// OLYMPUS cards: a test scene's end card, Again or Score (ROADMAP §2.2).
//
// A test scene ends on its endOn fact (src/data/scenes.js: the shower or the dressing after it done;
// the drill stood down), once its splash has played out (main.js waits for the zoom out, so the card
// never covers the landing). The card pauses the game and offers, numbered: 1 Again with the same
// seed, 2 Again with a new seed (the scene's procedural parts drawn afresh), 3 Score (the score card,
// cards/score.js), 4 the title. A test scene saves nothing (the build sheet 0.0.4 §8, item 24), so
// leaving it loses nothing; the scores alone are kept. A scene with a result says it under the title
// (said: the 0.0.5 round's range summary, cards/tests.js sceneSaid: "Clear at 09:14 · 61 of 75 · 4 V ·
// no faults"). 0.0.7: said may be a list, the summary and an incident under it, each its own line (the KD's
// "Range closed: Pvt Okafor hit in the left thigh by a negligent discharge, evacuated").
// 0.0.8 (the build sheet 0.0.8 §2.4; COMBAT §25.10.3): a scene played as a sheet (test-pairs) says which sheet under
// its title, its three aspects in the scene's numbers (aspects: [[name, words]], cards/pairs.js aspectLines), and offers
// after Score it "Again as …" each other sheet on the same seed (again: [{ tier, label, wf }]; on.againAs(tier)), so the
// recruit's take-in and the tier one's are played on the same targets at the same gaps; runs: this session's runs on
// this seed, a line each (cards/pairs.js runLine), listed once there are two or more, so the gulf is on the card.
// 0.0.9 (the build sheet 0.0.9 §2.3; COMBAT §25.18.3): "Three bangs" leads with the bangs' lines above the course's own
// (bangs: cards/pairs.js bangLines, the scene's bangsNow summary and the calm figure by the book and from this session's calm
// run), and "Again as …" plays each other sheet with the same setup on the same seed (main.js); the Score line counts the
// scene's aspects (one, bangs). The fixer's: there the session's list gives each sheet's bangs line (the sheet just played
// marked, its summary not said twice), and "Again as …" leads with the sheet's hardening in words ("unshakeable · seed 48213").
// 0.0.10 (the build sheet 0.0.10 §2.3; COMBAT §25.18.3): "Bang" (test-stress) leads with the stress course's lines (stress: cards/
// stress.js stressLines: the summary, a line a string, the inoculation), above the course's own, the hot wash beside the card
// (cards: cards/stress.js hotWash's element, one string's truth card and a button a string; the fixer's of 0.0.10, in place of five
// thumbnails) and from the second sheet the session's grid (grid: gridTable's, in place of a summary line a sheet); "Again as …"
// leads with each sheet's hardening word.
// v0.0.20 (the build sheet v0.0.20 §1 items 20, 21, 25; card C5, C6, C7): the shoot house's card leads with the instructor's verdict
// (verdict: { go, words }, its own line, green or red), takes "Again from room 2" after a NO-GO (from: { word, setup }, on.from(setup):
// the weak room drilled without the walk to it) and "Export the run" (on.exportRun(), the run's save at GO and its inputs as a JSON
// file to replay in node: tests/replay-run.mjs), each numbered after "Again as …"; a grid carries its own head (grid.dataset.head).
// v0.0.21 (the build sheet v0.0.21 §1 items 9 and 16): a drawn house names its code in the header ("… as Sergeant · house
// Cn290pc.Ks206lc.En175pc"; code: its layout part, the whole code on the line's hover), and a qualification lane says where it
// stands under the verdict (qual: { words, done, next }: "QUALIFICATION 2 OF 3 · GO", "QUALIFIED: SERGEANT"), leading with "Next
// qualification lane" (on.qual(), a new hidden seed) while the attempt goes on and "Qualify as <next sheet up>" once it is done;
// every other line abandons the attempt (main.js).
// v0.0.22 (the build sheet v0.0.22 §1 item 14): a named house says its letter in the header in the code's place ("… as Sergeant · lane
// B"; lane: 'B' or 'C', the whole code on the line's hover), a drawn house its code as before.
// The hunt of v0.0.20 (P2): a card numbers at most CARD_KEYS lines, the ones the digits reach, the tenth labelled 0 (its key): the
// sergeant's live NO-GO had eleven, "10 Export the run" and "11 Back to the title", and typing 1, 1 for the title started the lane
// again. Past ten, "Export the run" (a tool for a report, not a way on) is the first to lose its number, then the last "Again as"
// lines; such a line stays on the card, clicked, with a dot for its key, and the title keeps its number, always last (keysOf).
import { CARD_KEYS, keyLabel } from './menu.js';

/** The keys of n lines in order (a label, or null for a line no digit reaches): spare the indexes that give up their number first,
 * in order, then the lines before the last from the bottom up; the last line (the title) always keeps its number. */
export function keysOf(n, spare = []) {
  const drop = new Set(), extra = Math.max(0, n - CARD_KEYS);
  for (const i of [...spare, ...Array.from({ length: Math.max(0, n - 1) }, (_, j) => n - 2 - j)]) { if (drop.size >= extra) break; if (i >= 0 && i < n - 1) drop.add(i); }
  let k = 0;
  return Array.from({ length: n }, (_, i) => (drop.has(i) ? null : keyLabel(++k)));
}
const COUNT_WORDS = Object.freeze(['no aspect', 'one aspect', 'two aspects', 'three aspects', 'four aspects', 'five aspects', 'six aspects']);

/** The card's body and its numbered lines: { body, lines }. scene: SCENES' record; seed; on: { again(sameSeed), score(), title(), from?(setup), exportRun?() }. */
export function endCard({ scene, seed, on = {}, said = null, sheet = null, aspects = [], again = [], runs = [], bangs = [], stress = [], cards = null, grid = null, verdict = null, from = null, exportRun = false, code = null, qual = null, lane = null }) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(globalThis.document.createElement(tag), props); n.append(...kids.filter(k => k !== null && k !== undefined)); return n; };
  // (each line built with its place for a number; keysOf numbers them once all are known)
  const line = (n, text, small, fn, cls = 'item') => el('button', { className: cls, type: 'button', onclick: fn }, el('kbd', { textContent: String(n) }), text, small ? el('small', { textContent: small }) : null);
  // (a qualification's next lane leads while the attempt goes on, or the next sheet up's once qualified; a hidden seed)
  const q = qual?.next ? [line(1, qual.done ? `Qualify as ${qual.next.label}` : `Next qualification lane (${qual.n + 1} of ${qual.of})`, 'a house you have not seen, its seed hidden', () => on.qual?.(qual.next.tier), 'item lead qual-next')] : [];
  const all = [
    ...q,
    line(q.length + 1, 'Again', `seed ${seed}${qual?.next && !qual.done ? ' · ends the qualification' : ''}`, () => on.again?.(true)),
    line(q.length + 2, 'Again with a new seed', 'what is drawn, drawn afresh', () => on.again?.(false)),
    line(q.length + 3, 'Score it', `${COUNT_WORDS[scene.aspects?.length ?? 3] ?? `${scene.aspects.length} aspects`}, a ★, a note`, () => on.score?.(), q.length ? 'item' : 'item lead'),
    // (0.0.8: the other sheets on the same seed)
    // (0.0.9: on "Three bangs" the hardening's word leads, the scene's lesson (the design review))
    ...again.map((a, i) => line(q.length + 4 + i, `Again as ${a.label}`, a.hard ? `${a.hard} · seed ${seed}` : a.why ? `${a.why} · seed ${seed}` : `Warfighting ${a.wf} · seed ${seed}`, () => on.againAs?.(a.tier), `item again-as${a.up ? ' up' : ''}`)),
  ];
  // (the weak room after a NO-GO, the run's export; then the title, always last)
  if (from?.setup) all.push(line(all.length + 1, `Again from ${from.word}`, `the setup ${from.setup} · seed ${seed}`, () => on.from?.(from.setup), 'item again-from'));
  if (exportRun) all.push(line(all.length + 1, 'Export the run', 'the save at GO and every press, to replay', () => on.exportRun?.(), 'item export'));
  all.push(line(all.length + 1, 'Back to the title', null, () => on.title?.()));
  // (the keys: past CARD_KEYS the export first, then the last "Again as" lines, give up their number; lines holds the numbered ones,
  // in order, as boot.js digit reads them)
  const spare = [exportRun ? all.length - 2 : -1, ...again.map((_, i) => q.length + 3 + i).reverse()];
  const keys = keysOf(all.length, spare), lines = [];
  all.forEach((b, i) => { b.firstChild.textContent = keys[i] ?? '·'; if (keys[i] === null) b.className += ' nokey'; else lines.push(b); });
  // (0.0.10, the fixer's: "Bang"'s card is wider and lays its choices in two columns, so with the hot wash beside it and the
  // session's grid in it, it never scrolls at 1600 × 900 or 1024 × 768 (the runtime review: 907 px of 826 after a second sheet))
  // (the shoot house's card, with its verdict, lays its choices in two columns too, at its own width: the plan stands beside it)
  const body = el('div', { className: `glass end${stress.length ? ' wide' : verdict ? ' house' : ''}` },
    // (the house's code in its own case: the heading's capitals made it a code no parser reads, "KN240LC.ES195PC.CN160LC" for
    // Kn240lc.Es195pc.Cn160lc, and a player who copied it off the card could not replay the house (the play review of 2026-11-16))
    // (a named house says its lane, "· lane B", where the code would stand)
    el('h3', { textContent: `End of the scene: ${scene.title}${sheet ? `, as ${sheet}` : ''}${lane ? ` · lane ${lane}` : code ? ' · house ' : ''}`, ...(code ? { title: `house ${code}` } : {}) },
      ...(code && !lane ? [el('span', { className: 'house-code', textContent: String(code).split('|')[0] })] : [])),
    // (0.0.9: the bangs' lines first, the summary and the calm figure)
    bangs.length ? el('div', { className: 'bangs-said' }, ...bangs.map((t, i) => el('p', { className: `bang-said${i ? ' calm' : ''}`, textContent: t }))) : null,
    // (0.0.10: the stress course's summary, its strings and the inoculation; from the second sheet the session's grid)
    stress.length ? el('div', { className: 'stress-said' }, ...stress.map((t, i) => el('p', { className: i === 0 ? 'head' : i === stress.length - 1 && /^Inoculation/.test(t) ? 'inoc' : 'string', textContent: t }))) : null,
    // (the instructor's verdict leads the shoot house's card)
    verdict?.words ? el('p', { className: `verdict ${verdict.go ? 'go' : 'nogo'}`, textContent: verdict.words }) : null,
    // (the qualification's line under the verdict)
    qual?.words ? el('p', { className: `qual-said${qual.done ? ' done' : ''}`, textContent: qual.words }) : null,
    grid ? el('div', { className: 'runs-said' }, el('p', { className: 'runs-head', textContent: grid.dataset?.head ? `${grid.dataset.head}:` : `This seed, this session (${grid.querySelectorAll('tr:first-child th').length - 1} sheets): froze, the first round from the sighting (calm by the book):` }), grid) : null,
    // (said: a line, or the lines of a scene with an incident (0.0.7: the range closed by a casualty), each its own)
    ...(Array.isArray(said) ? said : [said]).filter(Boolean).map((t, i) => el('p', { className: `said${i ? ' incident' : ''}`, textContent: t })),
    aspects.length ? el('div', { className: 'aspects-said' }, ...aspects.map(([k, t]) => el('p', { className: 'aspect-said' }, el('b', { textContent: k }), ` ${t}`))) : null,
    // (0.0.8, the fixer's: this session's runs on this seed, one line a sheet, so "Again as" shows the gulf here)
    // (0.0.9: a run may be { text, now }: the sheet just played marked)
    runs.length > 1 && !grid ? el('div', { className: 'runs-said' }, el('p', { className: 'runs-head', textContent: `This seed, this session (${runs.length} sheets):` }), ...runs.map(r => el('p', { className: `run-said${r?.now ? ' now' : ''}`, textContent: r?.text ?? r }))) : null,
    el('div', { className: 'glass-list' }, ...all),
    el('p', { className: 'note', textContent: 'A test scene saves nothing; your scores are kept in this browser.' }));
  // (0.0.10: the stress course's hot wash stands beside the card, outside its glass, so it costs the card no height)
  if (cards) return { body: el('div', { className: 'end-wrap' }, cards, body), lines };
  return { body, lines };
}
