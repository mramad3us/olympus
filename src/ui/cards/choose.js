// OLYMPUS cards: the choices card, what else R can do at this fixture (R held; the build sheet 0.0.4 §2.4).
//
// R tapped does the offer's default (the shower stall's shower, the rack's sleep until reveille);
// held TAP_MS (220 ms) at an offer with more, it opens this card: the offer's more, numbered, each
// with its length and when it would be done (handOffer's labels: "sleep until reveille · 8 h 15 min,
// done 05:30", "nap · 45 min, done 22:45"), a digit or a click picking one (by code, so AZERTY's top
// row works without Shift), Esc closing it with nothing done. The card pauses the game, as every card
// does, so the "done" times hold while it is open. A pick goes back to main.js (onPick(entry)), which
// sends time's { act: 'activity', args: { id, spotId, args } }, or opens the late card first when the
// pick would make you late for a call (TIME §9.5: time's lateCheck). The card changes nothing itself.

/** The card's body and its numbered lines: { body, lines }. offer: handOffer's (its more, label, spotId); onPick(entry). */
export function chooseCard({ offer, onPick, title = null }) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(globalThis.document.createElement(tag), props); n.append(...kids.filter(k => k !== null && k !== undefined)); return n; };
  const more = Array.isArray(offer?.more) ? offer.more : [];
  const lines = more.slice(0, 10).map((m, i) => {
    const [head, ...rest] = String(m.label ?? m.id).split(' · ');
    return el('button', { className: 'item', type: 'button', onclick: () => onPick?.(m) },
      el('kbd', { textContent: String((i + 1) % 10) }), head, rest.length ? el('small', { textContent: rest.join(' · ') }) : null);
  });
  const body = el('div', { className: 'glass choose' },
    el('h3', { textContent: title ?? choicesTitle(offer) }),
    el('div', { className: 'glass-list' }, ...lines),
    el('p', { className: 'note', textContent: 'A digit or a click to choose; Esc for nothing.' }));
  return { body, lines };
}

/** The card's heading: what the fixture is ("Your rack", "The sink"), from the offer. */
export function choicesTitle(offer) {
  const id = String(offer?.spotId ?? offer?.target ?? '');
  if (/rack/.test(id)) return 'Your rack';
  if (/sink/.test(id)) return 'The sink';
  if (/locker/.test(id)) return 'Your locker';
  if (/shower/.test(id)) return 'The shower';
  if (/toilet|urinal/.test(id)) return 'The head';
  if (/vending/.test(id)) return 'The machine';
  return 'What you can do here';
}
