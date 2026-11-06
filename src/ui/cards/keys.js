// OLYMPUS cards: the keys card ('?'), every key that does something in this build, labelled AZERTY.
//
// The user, tradecraft 2026-10-27: "put the keybinds behind '?' key instead of always in the bar at
// the bottom". The card lists only the keys this build gives a meaning (the build sheet 0.0.3 §2.4:
// Z Q S D walk, Shift runs, Alt strolls, R what's at hand, G weapon ready, the digits, J the log,
// Space the pause, Esc the menu, ? these keys; in debug mode ^ and $; the 0.0.4 sheet's §2.4 adds T,
// what the instinct says and held the next, C the character sheet, R held the choices, and in a
// splash Space to the end and Backspace stop here), so nothing on it does nothing. Keys are read by where they sit (KeyboardEvent.code) and named in the player's layout by
// keys.js label(): AZERTY by default (DESIGN.md, Controls), so the walk reads Z Q S D and the debug
// keys ^ and $ (the codes BracketLeft and BracketRight, [ and ] on QWERTY). Alt is Option on a Mac.
// The words for each key are the build's, given by main.js where the sim knows them (R's wait in
// whole minutes from its own WAIT_MS), else keys.js's own.
import { bindingOf } from '../../core/keys.js';

/** The actions with a meaning in this build, in the card's order (the walk and the digits are rows of their own). */
export const KEYS_IN_BUILD = Object.freeze(['run', 'stroll', 'hand', 'instinct', 'ready', 'digits', 'sheet', 'log', 'pause', 'menu', 'help']);
/** The build's words for them, where keys.js's differ. */
export const KEY_WORDS = Object.freeze({
  run: 'run, held',
  stroll: 'stroll, held',
  hand: "what's at hand: an appliance, a door, else wait; held: the choices",
  instinct: 'what the instinct says; held: the next',
  ready: 'weapon ready: time stands still until a digit',
  digits: 'a choice while time stands still, a line of a card',
  sheet: 'character sheet: your body and your file',
  log: 'the log',
  pause: 'pause',
  menu: 'the menu',
  help: 'these keys',
});

/** In a splash, the keys mean (TIME §6.4, VIEWS §10.3): [code or action, words]. */
export const SPLASH_KEYS = Object.freeze([['pause', 'in a splash: to the end (Enter, a click too)'], ['Backspace', 'in a splash: stop here, where the activity allows']]);

/** The card's rows: [[keys, words]…]. label(action or code) names a key; says overrides words; extra adds rows (the debug keys). */
export function keysRows({ label, says = {}, extra = [] }) {
  const rows = [[`${label('up')} ${label('left')} ${label('down')} ${label('right')}`, 'walk (the arrows too)']];
  for (const action of KEYS_IN_BUILD) {
    if (action === 'digits') { rows.push(['1 … 0', says.digits ?? KEY_WORDS.digits]); continue; }
    rows.push([label(action), says[action] ?? KEY_WORDS[action] ?? bindingOf(action)?.say ?? action]);
  }
  for (const [k, words] of SPLASH_KEYS) rows.push([label(k), words]);
  for (const r of extra) rows.push(r);
  return rows;
}

/** The card's body: a glass of key and words rows. */
export function keysCard(rows) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };
  return el('div', { className: 'glass keys' },
    el('h3', { textContent: 'Keys' }),
    el('div', { className: 'keylist' }, ...rows.flatMap(([k, say]) => [el('kbd', { textContent: k }), el('span', { textContent: say })])),
    el('p', { className: 'note', textContent: 'Read by where they sit on the keyboard, so any layout plays the same; labelled AZERTY. ? or Esc to close.' }));
}
