// OLYMPUS cards: what you carry (I), gear by gear (VIEWS §8.3; tradecraft's src/ui/pockets.js, 142 lines, ported).
//
// Tradecraft's inventory (the user, 2026-10-28: "most menus need revamping, the generic paper isn't
// adapted to inventory for instance"): the dark glass, its heading a plaque of the picture's alphabet
// (src/ui/plaque.js), you at the left, then each container as a tile with what is in it drawn in pixels
// and how full it is. OLYMPUS arranges the tiles by the load-bearing gear they belong to, as they sit on
// the body (VIEWS §8.3: "one rig, one table"), from arms' kitView(state, pid) (src/sim/arms/kit.js: {
// groups: [{ id, word, holds, reachS, items: [{ id, kind, word, n, approx, reachS }] }], sling: { gunId, posture } }),
// which gives the counts the marine believes, never the truth (WEAPONS §4.2): a magazine filled and
// told by the range detail reads its five, one fired from reads "≈3" under Weapon handling 15, one
// never counted shows its baseplate only and "?". Each tile shows its fill bar (the magazines in it of
// what it holds), its things with their icons (a magazine's own: its body, its window, the rounds in it
// stacked as believed, VIEWS §4.4's look at icon size) and its reach, how long a magazine from it takes
// to go in (kitView's reachS: the sim's Magazine in, firearms.js actionMs 'magIn', which the caller passes
// as magInS; the same for every pouch, so the card never promises a time the step does not take). The
// sling: the rifle and its carry posture; the head: the ear defenders. This round I shows and does not
// move (the build sheet 0.0.5 §7: "the inventory's actions (I shows, it does not move)"): no buttons, I
// or Esc closes it.
//
// 0.0.6 (the user, 2026-11-07: "There should be some way to select which mag we put in as well because we may
// have different types of rounds in inventory"): each pouch by its name ("Chest pouch 1", "Chest pouch 2", "The
// dump pouch"), each magazine with its believed count and kind ("5 in it, ball", "5 in it, kind not seen", "a few
// by its weight", the icon's top round tipped red for a tracer), and two tiles more when they hold anything: the
// magazine in your hand and those at your feet (kitView's hand and feet), the feet's reach a pickup's and a seat's.
// tilesOf(view) is the pure part (the ui tests read it), magIcon(item) the icon's pixels, inventoryCard
// (view, { dollOf }) the DOM.
import { plaque, pixelBuffer } from '../plaque.js';

/** The carry postures' words (WEAPONS §6.1). */
export const POSTURE_WORDS = Object.freeze({ slungBack: 'slung on your back', slungFront: 'slung in front', lowReady: 'at the low ready', highReady: 'at the high ready', aimed: 'aimed' });
/** A HAD-30 magazine's rounds (WEAPONS §3.3: 30, the range detail fills five). */
export const MAG_OF = 30;
const ICON_K = 3;

const FEEL_SAID = Object.freeze({ none: 'empty by its weight', few: 'a few by its weight', half: 'about half by its weight', most: 'nearly full by its weight', full: 'full by its weight' });
/** A magazine's line as believed: '5 in it, ball', '≈3 in it, kind not seen', 'a few by its weight', 'not counted'. */
export function magWords(it) {
  const known = it.n !== null && it.n !== undefined && it.n !== '?';
  const count = known ? `${it.approx ? '≈' : ''}${it.n} in it` : it.feel ? FEEL_SAID[it.feel] ?? 'not counted' : 'not counted';
  return `${count}${known && it.n === 0 ? '' : `, ${it.load ?? 'kind not seen'}`}`;
}

/** The card's tiles: [{ id, word, items: [{ id, kind, word, count ('5', '≈3', '?'), reach ('1.4 s'), n, approx, known, load, feel, says }], fill (0 to 1) }], and the sling's line. */
export function tilesOf(view) {
  const item = (it) => {
    const known = it.n !== null && it.n !== undefined && it.n !== '?';
    return { id: it.id, kind: it.kind, word: it.word ?? it.kind, n: known ? it.n : null, approx: !!it.approx, known, load: it.load ?? null, feel: it.feel ?? null,
      count: it.kind === 'mag' ? (known ? `${it.approx ? '≈' : ''}${it.n}` : '?') : null, reach: Number.isFinite(it.reachS) && it.reachS > 0 ? `${it.reachS.toFixed(1)} s` : null,
      says: it.kind === 'mag' ? magWords(it) : null };
  };
  const groups = (view?.groups ?? []).map(g => {
    const items = (g.items ?? []).map(item);
    const holds = Number.isFinite(g.holds) ? g.holds : null;
    return { id: g.id, word: g.word ?? g.id, items, fill: holds ? Math.min(1, items.length / holds) : items.length ? 1 : 0 };
  });
  // (the magazine in your hand and those at your feet, as tiles of their own when there are any)
  if (view?.hand) groups.push({ id: 'hand', word: 'in your hand', items: [item(view.hand)], fill: 1 });
  if (view?.feet?.length) groups.push({ id: 'feet', word: 'at your feet', items: view.feet.map(item), fill: 1 });
  const sl = view?.sling ?? null;
  const sling = sl?.gunId ? { gunId: sl.gunId, word: `${sl.word ?? 'Your rifle'}, ${POSTURE_WORDS[sl.posture] ?? sl.posture ?? 'on its sling'}` } : null;
  return { groups, sling, empty: !groups.some(g => g.items.length) && !sling };
}

/**
 * A magazine's icon (7 × 13 pixels): the body, its window, the rounds as believed stacked in it from the top
 * (a round a pixel row while it holds up to ten, the rest a full window), its baseplate; uncounted, the
 * window shows nothing and a question mark sits on the baseplate. { w, h, data } (plaque.js's buffer).
 */
export function magIcon({ n = null, approx = false, known = n !== null, load = null } = {}) {
  const w = 7, h = 13, buf = pixelBuffer(w, h), { px } = buf;
  const BODY = 0x3e4452, EDGE = 0x14151c, WIN = 0x1f2029, BRASS = 0xd9a83a, COPPER = 0xb8643a, PLATE = 0x5a6272;
  px(1, 0, 5, 12, EDGE); px(2, 1, 3, 10, BODY);                   // (the body, inked)
  px(0, 11, 7, 2, EDGE); px(1, 11, 5, 1, PLATE);                  // (the baseplate)
  px(3, 2, 1, 8, WIN);                                             // (the window)
  if (known && n > 0) {
    const rows = Math.min(8, Math.max(1, Math.round((Math.min(n, MAG_OF) / 10) * 8)));
    // (the top round's nose: ball's bare copper, a tracer's red tip (0.0.6), brass when the kind is not seen)
    for (let r = 0; r < rows; r++) px(3, 2 + r, 1, 1, r === 0 ? (load === 'tracer' ? 0xc23b2e : load ? COPPER : BRASS) : BRASS);
    if (approx) px(4, 2 + rows - 1, 1, 1, 0x8f96a6);               // (a believed-about count: a grey tick beside the last)
  }
  if (!known) { px(2, 11, 1, 1, 0xf8e08a); px(4, 11, 1, 1, 0xf8e08a); }   // (an uncounted one: two marks on its plate)
  return buf;
}

const cv = (buf, k = ICON_K) => {
  const c = globalThis.document.createElement('canvas');
  c.width = buf.w; c.height = buf.h;
  c.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(buf.data.buffer.slice(0)), buf.w, buf.h), 0, 0);
  c.className = 'pk-icon'; c.style.width = `calc(${buf.w * k}px * var(--ui))`; c.style.height = `calc(${buf.h * k}px * var(--ui))`;
  return c;
};

/** The card: { body, lines }. view: kitView's record (or null: nothing issued); dollOf() → a Pixmap of you, or null; label(action) names a key. */
export function inventoryCard(view, { dollOf = null, label = (a) => a, title = 'WHAT YOU CARRY', sub = null } = {}) {
  const doc = globalThis.document;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); n.append(...kids.filter(k => k !== null && k !== undefined && k !== false)); return n; };
  const t = tilesOf(view);
  const head = plaque({ text: title, sub: sub ?? (t.sling ? 'RANGE KIT' : 'UTILITIES'), style: 'armoury', icon: 'rifle', notch: false });
  const headCv = el('canvas', { className: 'pk-plaque' });
  headCv.width = head.w; headCv.height = head.h; headCv.getContext('2d')?.drawImage(head.canvas, 0, 0);
  headCv.style.width = `calc(${head.w * 2}px * var(--ui))`; headCv.style.height = `calc(${head.h * 2}px * var(--ui))`;
  let figure = null;
  if (dollOf) {
    try {
      const pm = dollOf();
      if (pm?.data) {
        figure = el('canvas', { className: 'doll' });
        figure.width = pm.w; figure.height = pm.h;
        figure.style.width = `calc(${pm.w * 2}px * var(--ui))`; figure.style.height = `calc(${pm.h * 2}px * var(--ui))`;
        figure.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(pm.data.buffer.slice(0)), pm.w, pm.h), 0, 0);
      }
    } catch (e) { console.warn('the inventory: the doll was not drawn', e); }
  }
  const thing = (it) => el('div', { className: `pk-thing ${it.kind}` },
    it.kind === 'mag' ? cv(magIcon(it)) : el('span', { className: 'pk-dot' }),
    el('span', { className: 'pk-name', textContent: it.kind === 'mag' ? `${it.word}: ${it.says}` : it.word }),
    it.reach ? el('span', { className: 'pk-reach', textContent: it.reach }) : null);
  const tile = (g) => el('div', { className: `pk-pocket${g.items.length ? '' : ' empty'}` },
    el('div', { className: 'pk-pocket-head' }, el('span', { textContent: g.word.replace(/^./, c => c.toUpperCase()) }), el('span', { className: 'pk-fill' }, el('i', { style: `width: ${Math.round(g.fill * 100)}%` }))),
    ...(g.items.length ? g.items.map(thing) : [el('p', { className: 'pk-none', textContent: 'Empty' })]));
  const main = el('div', { className: 'pk-main' },
    t.sling ? el('div', { className: 'pk-group' }, el('h4', { textContent: 'On the sling' }), el('div', { className: 'pk-thing gun' }, el('span', { className: 'pk-dot gun' }), el('span', { className: 'pk-name', textContent: t.sling.word }))) : null,
    ...t.groups.map(g => el('div', { className: 'pk-group' }, tile(g))),
    t.empty ? el('p', { className: 'pk-none', textContent: 'Nothing issued: the utilities you stand in and what is in their pockets.' }) : null);
  const body = el('div', { className: 'glass pockets' },
    el('div', { className: 'pk-head' }, headCv),
    el('div', { className: 'pk-body' }, figure ? el('div', { className: 'pk-doll' }, figure) : null, main),
    el('p', { className: 'note', textContent: `What you believe you carry, where it is and how long it takes to reach. ${label('inventory')} or ${label('menu')} to close.` }));
  return { body, lines: [], tiles: t };
}
