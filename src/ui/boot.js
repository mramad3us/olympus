// OLYMPUS ui: the way in, and the two cards the engine needs before the real screens exist.
//
// The title is a typed sheet of paper on the dark (tradecraft's title: docs/research/shots/
// tradecraft-title.png): OLYMPUS, the version, then Continue (the latest autosave, a Standard
// career's or an Ironman's), New career (the lead entry, brass-edged), and Load a save file. New
// career leads to the enlistment paper, a stub until the career screens arrive: the unit the recruit
// joins (DESIGN.md, Setting: 1st Squad, 2nd Platoon, Echo Company, 2nd Battalion, 4th Marine
// Regiment, at Marine Corps Base Melas) and the one choice the user settled at kickoff, how death is
// kept, Standard or Ironman, for the whole career (the user, 2026-11-05).
//
// In play, two cards of dark glass: the menu (Esc: resume, save to a file, load a file, quit to the
// title) and the keys ('?': every binding with its label in the player's layout, from keys.js).
// Each card that opens tells main.js through cb.overlay(name, open), and main.js holds a pause
// reason for it while it is open (DESIGN.md, Time: "an open overlay pauses"). A card's lines are
// numbered and a digit picks one (read by code: AZERTY's top row types & é " ' without Shift).
//
// The screens never change the state: every choice goes back to main.js through cb, which acts.
// Plain DOM, built here and nowhere else; the look is src/ui/style.css.
import { BINDINGS } from '../core/keys.js';

const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k);
  return n;
};
const item = (text, about, onclick, className = 'item') => el('button', { className, onclick, type: 'button' }, text, about ? el('small', { textContent: about }) : null);

const ago = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 90 ? 'just now' : s < 90 * 60 ? `${Math.round(s / 60)} min ago` : s < 36 * 3600 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} days ago`;
};

/**
 * cb: { newCareer(mode), continueFrom(slot), loadFile(), resume(), saveFile(), quit(), overlay(name, open), label(action) }.
 */
export function createBoot({ root = document.body, cb }) {
  const title = el('div', { id: 'title', hidden: true });
  const veil = el('div', { className: 'overlay', hidden: true });
  root.append(title, veil);
  let card = null, picks = [], page = null, titleArgs = null;

  // ---- paper ----

  function showTitle({ version = '?', saves = [], now = Date.now() } = {}) {
    titleArgs = { version, saves };
    page = 'title';
    const last = saves.filter(r => r.slot === 'auto' || r.slot === 'ironman').sort((a, b) => b.savedAt - a.savedAt)[0];
    title.replaceChildren(el('div', { className: 'sheet' },
      el('h1', { textContent: 'OLYMPUS' }),
      el('p', { className: 'sub', textContent: `v${version} · in development: the engine` }),
      el('hr'),
      last ? item('Continue', `${last.about || (last.mode === 'ironman' ? 'Ironman career' : 'Standard career')} · saved ${ago(now - last.savedAt)}`, () => cb.continueFrom(last.slot), 'item continue') : null,
      item('New career: enlist', 'Out of boot camp, a private of the MCRN Marine Corps, posted to a rifle platoon at Marine Corps Base Melas, on the floor of the Mariner Valley.', () => showEnlist(), 'item lead career'),
      el('hr'),
      item('Load a save file…', 'A .json save exported from the menu (Esc), from this browser or another.', () => cb.loadFile(), 'item load'),
      el('hr'),
      el('p', { className: 'note', textContent: 'Keys are read by where they sit on the keyboard, so they work on any layout; they are labelled AZERTY (Z Q S D to walk). In play, ? shows them all, Space pauses, Esc is the menu.' }),
    ));
    title.hidden = false;
    title.querySelector('.item')?.focus();
  }

  function showEnlist() {
    page = 'enlist';
    title.replaceChildren(el('div', { className: 'sheet enlist' },
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center' }, el('h2', { textContent: 'ENLISTMENT' }), el('span', { className: 'stamp', textContent: 'MCRN' })),
      el('p', { className: 'unit', innerHTML: 'Private, MCRN Marine Corps, out of basic training.<br>1st Squad, 2nd Platoon, Echo Company, 2nd Battalion, 4th Marine Regiment.<br>Report to Marine Corps Base Melas, Melas Chasma, Mariner Valley, Mars.' }),
      el('hr'),
      el('div', { className: 'section', textContent: 'HOW DEATH IS KEPT' }),
      el('p', { className: 'note', textContent: 'Chosen once, for the whole career.' }),
      item('Standard', 'Save anywhere: an autosave and nine slots of your own. After a death, load a save and carry on.', () => cb.newCareer('standard'), 'item lead standard'),
      item('Ironman', 'One autosave and nothing else. Death ends the career; the world goes on, and the next recruit can enlist into it.', () => cb.newCareer('ironman'), 'item ironman'),
      el('p', { className: 'note', textContent: 'Either way, a save can be exported to a file and imported again.' }),
      el('hr'),
      item('Back', null, () => back(), 'item small'),
      el('p', { className: 'note', textContent: 'For now the career is a stub: the base, the body and the stage are still being built.' }),
    ));
    title.hidden = false;
    title.querySelector('.item.standard')?.focus();
  }

  const hideTitle = () => { title.hidden = true; page = null; };
  /** Esc on the title's pages: from enlistment back to the title. */
  function back() { if (page === 'enlist' && titleArgs) showTitle(titleArgs); }

  // ---- glass cards ----

  function openCard(name, body, lines = []) {
    if (card) closeCard();
    card = name; picks = lines;
    veil.replaceChildren(body);
    veil.hidden = false;
    cb.overlay(name, true);
    body.querySelector('button')?.focus();
  }
  function closeCard() {
    if (!card) return;
    const was = card;
    card = null; picks = [];
    veil.hidden = true;
    veil.replaceChildren();
    cb.overlay(was, false);
  }
  // (a numbered line of a card: its digit, what it does, and its key if it has one)
  const line = (n, text, onclick, keyName = null) => el('button', { className: 'item', type: 'button', onclick }, el('kbd', { textContent: String(n) }), text, keyName ? el('small', { textContent: keyName }) : null);

  function openMenu() {
    const acts = [
      ['Resume', () => { closeCard(); cb.resume(); }, 'Esc'],
      ['Save to a file', () => cb.saveFile(), null],
      ['Load a save file…', () => { closeCard(); cb.loadFile(); }, null],
      ['Quit to the title', () => { closeCard(); cb.quit(); }, null],
    ];
    const lines = acts.map(([text, fn, k], i) => line(i + 1, text, fn, k));
    openCard('menu', el('div', { className: 'glass menu' },
      el('h3', { textContent: 'Menu' }),
      el('div', { className: 'glass-list' }, lines),
      el('p', { className: 'note', textContent: 'An autosave every 30 game minutes, on leaving the page, and on quitting to the title.' })), lines);
  }

  function openKeys() {
    const L = (a) => cb.label(a);
    const rows = [[`${L('up')} ${L('left')} ${L('down')} ${L('right')}`, 'walk (the arrows too)']];
    for (const b of BINDINGS) if (b.kind !== 'move') rows.push([L(b.action), b.say]);
    rows.push(['1 … 0', 'pick a step or a line']);
    openCard('keys', el('div', { className: 'glass keys' },
      el('h3', { textContent: 'Keys' }),
      el('div', { className: 'keylist' }, rows.flatMap(([k, say]) => [el('kbd', { textContent: k }), el('span', { textContent: say })])),
      el('p', { className: 'note', textContent: 'Read by where they sit on the keyboard; labelled AZERTY. ? or Esc to close.' })));
  }

  return {
    showTitle, showEnlist, hideTitle, back, openMenu, openKeys, closeCard,
    /** A digit while a card is open: its line, if it has one. */
    digit(n) { const b = picks[(n === 0 ? 10 : n) - 1]; if (b) b.click(); return !!b; },
    get card() { return card; },
    get page() { return page; },
  };
}
