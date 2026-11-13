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
//
// The 0.0.5 round's (the build sheet §2.4, VIEWS §10.1 and §10.2): G weapon ready, the rifle up and time
// standing still (stop motion); X the shooting mode on and off; the digits a step tapped, with Shift
// rushed, held careful (Fire held: hold the aim to +4 and fire); A and W (the codes KeyQ and KeyZ) the
// stance up and down; V the carry posture; I what you carry; and in stop motion (STOP_KEYS) Enter aim at
// the bracketed target, Q and D (the move keys' codes KeyA and KeyD) the brackets to the next target, a
// click to aim and a click on the aimed one to fire, and in a reflex card R to keep the answer.
// The 0.0.7 round's (the build sheet 0.0.7 §2.5 (a), (c)): in stop motion Z and S (and ↑ ↓) the scope's elevation a
// click, Shift with Q and D the windage; E held on a KD line opens the far window on your own target.
// The 0.0.6 round's (the build sheet 0.0.6 §2.3, VIEWS §10.1): R's words are on its plate before it is pressed,
// R held opens the menu of every single action at hand (cards/actions.js), and in it (MENU_KEYS) the digits and
// the arrows (Z S) move, Q D change a row's choice, Space checks, Enter does it, Esc or R closes.
// The 0.0.8 round's (the build sheet 0.0.8 §2.4; COMBAT §25.4.5, §25.11): no new key. While a contact's take-in runs (the
// amber brackets closing round a target) every key is refused but Space and Esc: the marine has seen it and not yet taken
// it in, and the keys are his once he has (CONTACT_KEYS says so on the card); at the pause the digits are the rows.
// The 0.0.12 round's (the build sheet 0.0.12 §8 item 7; VIEWS §10): in the shoot house V is the movement stance (Relaxed,
// Combat, Assault) where the scene's spec sets `stances`, and Backspace stops a drill T started after its running beat
// (HOUSE_KEYS); elsewhere V stays the carry posture.
import { bindingOf } from '../../core/keys.js';

/** The actions with a meaning in this build, in the card's order (the walk and the digits are rows of their own). */
export const KEYS_IN_BUILD = Object.freeze(['run', 'stroll', 'hand', 'instinct', 'ready', 'shoot', 'digits', 'stance', 'carry', 'inventory', 'sheet', 'log', 'pause', 'menu', 'help']);
/** The build's words for them, where keys.js's differ. */
export const KEY_WORDS = Object.freeze({
  run: 'run, held',
  stroll: 'stroll, held',
  hand: "what's at hand, as its plate says (an action, a door, else wait); held: the menu of every action there",
  instinct: 'what the instinct says; held: the next',
  ready: 'weapon ready: the rifle up, time stands still while you choose',
  shoot: 'the shooting mode, on and off (with a rifle)',
  digits: 'a step, tapped; with Shift rushed; held careful (Fire held: hold the aim, then fire); a line of a card',
  stance: 'stance up, stance down (kneel, prone)',
  carry: 'carry: the rifle\'s next posture',
  inventory: 'what you carry',
  sheet: 'character sheet: your body and your file',
  log: 'the log',
  pause: 'pause',
  menu: 'the menu',
  help: 'these keys',
});

/** In a splash, the keys mean (TIME §6.4, VIEWS §10.3): [code or action, words]. */
export const SPLASH_KEYS = Object.freeze([['pause', 'in a splash: to the end (Enter, a click too)'], ['Backspace', 'in a splash: stop here, where the activity allows']]);
/** In stop motion, the keys mean (VIEWS §10.2; the build sheet 0.0.5 §2.4): [codes or actions, words]. */
export const STOP_KEYS = Object.freeze([[['Enter'], 'in stop motion: aim at the bracketed target (a click too; a click on the aimed one fires)'], [['KeyA', 'KeyD'], 'in stop motion: the brackets to the next target; with nobody in sight, the Watch row to the next hot spot'],
  // (2026-11-13, the rework's R7: the step panel by groups, VIEWS §7.8; the layout on the Esc menu, C until the user scores P1 to P3)
  [['Tab'], 'in stop motion, the step panel C: held, the groups (a digit the group, a second the row)'], [['KeyR', 'KeyC', 'KeyB', 'KeyF'], 'in stop motion, the step panel B: the room, the gun, the body, your team (again or Esc: back)'], [['hand'], 'in a reflex card: keep the answer two minutes'],
  // (0.0.7: the scope's turrets, and the far window on your own face by E held on a KD line)
  [['KeyW', 'KeyS'], 'in stop motion: the scope\'s elevation a click up, down (↑ ↓ too)'], [['run', 'KeyA', 'KeyD'], 'in stop motion, Shift held: the windage a click left, right (← → too)'],
  [['look'], 'held on a KD line: the far window on your target']]);

/** In a contact's take-in, the keys mean (COMBAT §25.4.5): [actions, words]. */
export const CONTACT_KEYS = Object.freeze([[['pause', 'menu'], 'while a target is being taken in (the amber brackets closing): only these; every other key waits for the pause']]);

/** In the shoot house, the keys mean (the build sheet 0.0.12 §2.6, §8 item 7): [codes or actions, words]. */
// (the stances by what they trade, the user's remark of 2026-11-11 ("don't know what the assault <-> combat option is supposed to
// mean"); Backspace's stop, Carry on no longer named: the flow carries a drill on by itself (the design review of 2026-11-13))
export const HOUSE_KEYS = Object.freeze([[['carry'], 'in the shoot house: the stance, Relaxed (rifle slung), Careful (slower, steadier shots on the move), Fast (quicker, moving shots worse)'], [['Backspace'], 'a drill running (a bundle T started): stop after its beat']]);

/** In the R menu, the keys mean (cards/actions.js; the build sheet 0.0.6 §2.3): [codes or actions, words]. */
export const MENU_KEYS = Object.freeze([[['Space'], 'in the R menu: check a row (the digits and the arrows move to one; Enter does what is checked)'], [['KeyA', 'KeyD'], 'in the R menu: a row\'s choice (how long, which cut)']]);

/** The card's rows: [[keys, words]…]. label(action or code) names a key; says overrides words; extra adds rows (the debug keys). */
export function keysRows({ label, says = {}, extra = [] }) {
  const rows = [[`${label('up')} ${label('left')} ${label('down')} ${label('right')}`, 'walk (the arrows too)']];
  for (const action of KEYS_IN_BUILD) {
    if (action === 'digits') { rows.push(['1 … 0', says.digits ?? KEY_WORDS.digits]); continue; }
    if (action === 'stance') { rows.push([`${label('stanceUp')} ${label('stanceDown')}`, says.stance ?? KEY_WORDS.stance]); continue; }
    rows.push([label(action), says[action] ?? KEY_WORDS[action] ?? bindingOf(action)?.say ?? action]);
  }
  for (const [k, words] of SPLASH_KEYS) rows.push([label(k), words]);
  for (const [ks, words] of STOP_KEYS) rows.push([ks.map(k => label(k)).join(' '), words]);
  for (const [ks, words] of CONTACT_KEYS) rows.push([ks.map(k => label(k)).join(' '), words]);
  for (const [ks, words] of MENU_KEYS) rows.push([ks.map(k => label(k)).join(' '), words]);
  for (const [ks, words] of HOUSE_KEYS) rows.push([ks.map(k => label(k)).join(' '), words]);
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
