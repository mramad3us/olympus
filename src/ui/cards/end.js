// OLYMPUS cards: a test scene's end card, Again or Score (ROADMAP §2.2).
//
// A test scene ends on its endOn fact (src/data/scenes.js: the shower or the dressing after it done;
// the drill stood down), once its splash has played out (main.js waits for the zoom out, so the card
// never covers the landing). The card pauses the game and offers, numbered: 1 Again with the same
// seed, 2 Again with a new seed (the scene's procedural parts drawn afresh), 3 Score (the score card,
// cards/score.js), 4 the title. A test scene saves nothing (the build sheet 0.0.4 §8, item 24), so
// leaving it loses nothing; the scores alone are kept.

/** The card's body and its numbered lines: { body, lines }. scene: SCENES' record; seed; on: { again(sameSeed), score(), title() }. */
export function endCard({ scene, seed, on = {}, said = null }) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(globalThis.document.createElement(tag), props); n.append(...kids.filter(k => k !== null && k !== undefined)); return n; };
  const line = (n, text, small, fn, cls = 'item') => el('button', { className: cls, type: 'button', onclick: fn }, el('kbd', { textContent: String(n) }), text, small ? el('small', { textContent: small }) : null);
  const lines = [
    line(1, 'Again', `seed ${seed}`, () => on.again?.(true)),
    line(2, 'Again with a new seed', 'what is drawn, drawn afresh', () => on.again?.(false)),
    line(3, 'Score it', 'three aspects, a ★, a note', () => on.score?.(), 'item lead'),
    line(4, 'Back to the title', null, () => on.title?.()),
  ];
  const body = el('div', { className: 'glass end' },
    el('h3', { textContent: `End of the scene: ${scene.title}` }),
    said ? el('p', { className: 'said', textContent: said }) : null,
    el('div', { className: 'glass-list' }, ...lines),
    el('p', { className: 'note', textContent: 'A test scene saves nothing; your scores are kept in this browser.' }));
  return { body, lines };
}
