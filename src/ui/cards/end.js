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
const COUNT_WORDS = Object.freeze(['no aspect', 'one aspect', 'two aspects', 'three aspects', 'four aspects']);

/** The card's body and its numbered lines: { body, lines }. scene: SCENES' record; seed; on: { again(sameSeed), score(), title() }. */
export function endCard({ scene, seed, on = {}, said = null, sheet = null, aspects = [], again = [], runs = [], bangs = [], stress = [], cards = null, grid = null }) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(globalThis.document.createElement(tag), props); n.append(...kids.filter(k => k !== null && k !== undefined)); return n; };
  const line = (n, text, small, fn, cls = 'item') => el('button', { className: cls, type: 'button', onclick: fn }, el('kbd', { textContent: String(n) }), text, small ? el('small', { textContent: small }) : null);
  const lines = [
    line(1, 'Again', `seed ${seed}`, () => on.again?.(true)),
    line(2, 'Again with a new seed', 'what is drawn, drawn afresh', () => on.again?.(false)),
    line(3, 'Score it', `${COUNT_WORDS[scene.aspects?.length ?? 3] ?? `${scene.aspects.length} aspects`}, a ★, a note`, () => on.score?.(), 'item lead'),
    // (0.0.8: the other sheets on the same seed)
    // (0.0.9: on "Three bangs" the hardening's word leads, the scene's lesson (the design review))
    ...again.map((a, i) => line(4 + i, `Again as ${a.label}`, a.hard ? `${a.hard} · seed ${seed}` : `Warfighting ${a.wf} · seed ${seed}`, () => on.againAs?.(a.tier), 'item again-as')),
    line(4 + again.length, 'Back to the title', null, () => on.title?.()),
  ];
  // (0.0.10, the fixer's: "Bang"'s card is wider and lays its choices in two columns, so with the hot wash beside it and the
  // session's grid in it, it never scrolls at 1600 × 900 or 1024 × 768 (the runtime review: 907 px of 826 after a second sheet))
  const body = el('div', { className: `glass end${stress.length ? ' wide' : ''}` },
    el('h3', { textContent: `End of the scene: ${scene.title}${sheet ? `, as ${sheet}` : ''}` }),
    // (0.0.9: the bangs' lines first, the summary and the calm figure)
    bangs.length ? el('div', { className: 'bangs-said' }, ...bangs.map((t, i) => el('p', { className: `bang-said${i ? ' calm' : ''}`, textContent: t }))) : null,
    // (0.0.10: the stress course's summary, its strings and the inoculation; from the second sheet the session's grid)
    stress.length ? el('div', { className: 'stress-said' }, ...stress.map((t, i) => el('p', { className: i === 0 ? 'head' : i === stress.length - 1 && /^Inoculation/.test(t) ? 'inoc' : 'string', textContent: t }))) : null,
    grid ? el('div', { className: 'runs-said' }, el('p', { className: 'runs-head', textContent: `This seed, this session (${grid.querySelectorAll('tr:first-child th').length - 1} sheets): froze, the first round from the sighting (calm by the book):` }), grid) : null,
    // (said: a line, or the lines of a scene with an incident (0.0.7: the range closed by a casualty), each its own)
    ...(Array.isArray(said) ? said : [said]).filter(Boolean).map((t, i) => el('p', { className: `said${i ? ' incident' : ''}`, textContent: t })),
    aspects.length ? el('div', { className: 'aspects-said' }, ...aspects.map(([k, t]) => el('p', { className: 'aspect-said' }, el('b', { textContent: k }), ` ${t}`))) : null,
    // (0.0.8, the fixer's: this session's runs on this seed, one line a sheet, so "Again as" shows the gulf here)
    // (0.0.9: a run may be { text, now }: the sheet just played marked)
    runs.length > 1 && !grid ? el('div', { className: 'runs-said' }, el('p', { className: 'runs-head', textContent: `This seed, this session (${runs.length} sheets):` }), ...runs.map(r => el('p', { className: `run-said${r?.now ? ' now' : ''}`, textContent: r?.text ?? r }))) : null,
    el('div', { className: 'glass-list' }, ...lines),
    el('p', { className: 'note', textContent: 'A test scene saves nothing; your scores are kept in this browser.' }));
  // (0.0.10: the stress course's hot wash stands beside the card, outside its glass, so it costs the card no height)
  if (cards) return { body: el('div', { className: 'end-wrap' }, cards, body), lines };
  return { body, lines };
}
