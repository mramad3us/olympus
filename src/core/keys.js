// OLYMPUS core: the keys, as data, and the pure machine that reads them.
//
// Keys are read by physical position (KeyboardEvent.code), so the game plays the same on any layout:
// the key a QWERTY board calls W, an AZERTY board calls Z, and both send code 'KeyW', which is
// 'up'. Labels on screen are AZERTY by default (the user, on tradecraft: "don't give me the QWERTY
// keybinds"; DESIGN.md, Controls: "read by physical key and labelled AZERTY"), with a QWERTY table
// and the browser's own layout map ('auto', where Chrome has navigator.keyboard) to choose instead.
//
// The bindings are DESIGN.md's (Controls), in one table, each with what it does in a few words (the
// '?' sheet reads them) and its kind, which says who it is for:
//   move   held, a direction: Z Q S D (and the arrows)
//   mod    held, a modifier: Shift runs, Alt (Option on a Mac) strolls
//   hold   E: held past TAP_MS = 220 ms it is a state (look); let go sooner it is a tap (glance back)
//   press  R and T (the build sheet 0.0.4 §2.4): they act on the key going up under TAP_MS, or at
//          TAP_MS while still held, never both: down(code) fires { action, kind: 'down' } (so the UI
//          can keep what the line said when the key went down), up(code) under TAP_MS fires
//          { action, kind: 'tap' }, and due(tMs) fires { action, kind: 'held' } once a press has been
//          held TAP_MS (input.js asks it on a timer). R tapped is what's at hand, held the choices;
//          T tapped is the instinct's line, held its chip (SKILLS §14.1). The UI turns each into the
//          sim's action with its arguments, so these are never queued for the sim by themselves
//   sim    an action for the sim, fired once on the key going down (F people, G ready, X shoot,
//          K L M hit grab guard)
//   digit  the digits by code (Digit1, Numpad1), because AZERTY's top row types & é " ' without Shift
//          (tradecraft ui.js digit()); they pick steps in the step panel and lines in menus
//   ui     a screen (I inventory, C sheet, H first aid, Tab the mind, J log, Esc menu, ? keys)
//   loop   Space, the pause
// '?' is read by the character it types (e.key), whatever key makes it: Shift and the comma's key
// on AZERTY, which no action uses, so it never steals a move.
//
// createKeyState() is the machine without the DOM: down(code, tMs, key) and up(code, tMs) return
// what fired, and snapshot(tMs) what is held (the per-tick part of the input). input.js feeds it
// from the browser; a test feeds it by hand.

export const TAP_MS = 220;

export const BINDINGS = Object.freeze([
  { action: 'up', codes: ['KeyW', 'ArrowUp'], kind: 'move', dir: [0, -1], say: 'walk up (north)' },
  { action: 'left', codes: ['KeyA', 'ArrowLeft'], kind: 'move', dir: [-1, 0], say: 'walk left (west)' },
  { action: 'down', codes: ['KeyS', 'ArrowDown'], kind: 'move', dir: [0, 1], say: 'walk down (south)' },
  { action: 'right', codes: ['KeyD', 'ArrowRight'], kind: 'move', dir: [1, 0], say: 'walk right (east)' },
  { action: 'run', codes: ['ShiftLeft', 'ShiftRight'], kind: 'mod', say: 'run, held' },
  { action: 'stroll', codes: ['AltLeft', 'AltRight'], kind: 'mod', say: 'stroll, held' },
  { action: 'look', codes: ['KeyE'], kind: 'hold', tap: 'glance', say: 'look, held; glance back, tapped' },
  { action: 'people', codes: ['KeyF'], kind: 'sim', say: 'whoever is at hand' },
  { action: 'hand', codes: ['KeyR'], kind: 'press', say: 'what is at hand; held: the choices' },
  { action: 'instinct', codes: ['KeyT'], kind: 'press', say: 'what the instinct says; held: the next' },
  { action: 'ready', codes: ['KeyG'], kind: 'sim', say: 'weapon ready' },
  { action: 'shoot', codes: ['KeyX'], kind: 'sim', say: 'shooting mode' },
  { action: 'hit', codes: ['KeyK'], kind: 'sim', say: 'hit' },
  { action: 'grab', codes: ['KeyL'], kind: 'sim', say: 'grab' },
  { action: 'guard', codes: ['Semicolon'], kind: 'sim', say: 'guard' },
  { action: 'inventory', codes: ['KeyI'], kind: 'ui', say: 'inventory' },
  { action: 'sheet', codes: ['KeyC'], kind: 'ui', say: 'character sheet' },
  { action: 'aid', codes: ['KeyH'], kind: 'ui', say: 'first aid' },
  { action: 'mind', codes: ['Tab'], kind: 'ui', say: 'the mind: agenda, map, people' },
  { action: 'log', codes: ['KeyJ'], kind: 'ui', say: 'the log' },
  { action: 'pause', codes: ['Space'], kind: 'loop', say: 'pause' },
  { action: 'menu', codes: ['Escape'], kind: 'ui', say: 'menu' },
  { action: 'help', codes: [], key: '?', kind: 'ui', say: 'these keys' },
]);

const BY_ACTION = new Map(BINDINGS.map(b => [b.action, b]));
const BY_CODE = new Map(BINDINGS.flatMap(b => b.codes.map(c => [c, b])));
const DIGIT_CODE = /^(?:Digit|Numpad)([0-9])$/;

/** The binding of an action ('up', 'ready'…), or undefined. */
export const bindingOf = (action) => BY_ACTION.get(action);
/** The action a code is bound to ('KeyW' → 'up'), 'digit:N' for a digit, or null. */
export function actionOf(code) {
  const b = BY_CODE.get(code);
  if (b) return b.action;
  const d = DIGIT_CODE.exec(code);
  return d ? `digit:${d[1]}` : null;
}

// ---- labels ----

/** What the keys whose label isn't their letter are called on a French AZERTY board. */
export const AZERTY_LABELS = Object.freeze({
  KeyQ: 'A', KeyW: 'Z', KeyA: 'Q', KeyZ: 'W', Semicolon: 'M', KeyM: ',', Comma: ';', Period: ':', Slash: '!',
  Quote: 'Ù', BracketLeft: '^', BracketRight: '$', Backslash: '*', Minus: ')', Equal: '=', Backquote: '²', IntlBackslash: '<',
});
/** And on a US QWERTY board. */
export const QWERTY_LABELS = Object.freeze({
  Semicolon: ';', Comma: ',', Period: '.', Slash: '/', Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\',
  Minus: '-', Equal: '=', Backquote: '`', IntlBackslash: '\\',
});
export const LAYOUTS = Object.freeze({ azerty: AZERTY_LABELS, qwerty: QWERTY_LABELS });
// (keys named the same on every layout; Alt is Option on a Mac)
const NAMES = { Space: 'Space', Escape: 'Esc', Tab: 'Tab', Enter: 'Enter', Backspace: 'Backspace', ShiftLeft: 'Shift', ShiftRight: 'Shift',
  AltLeft: 'Alt', AltRight: 'Alt', ControlLeft: 'Ctrl', ControlRight: 'Ctrl', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };

/**
 * What a key is called on screen: label('up') → 'Z' (AZERTY), label('up', { layout: 'qwerty' }) → 'W',
 * label('KeyQ') → 'A', label('digit:3') → '3', label('help') → '?'. layoutMap is the browser's
 * (navigator.keyboard.getLayoutMap()), used first when layout is 'auto'; mac names Alt 'Option'.
 */
export function label(actionOrCode, { layout = 'azerty', layoutMap = null, mac = false } = {}) {
  const d = /^digit:([0-9])$/.exec(actionOrCode);
  if (d) return d[1];
  const b = BY_ACTION.get(actionOrCode);
  if (b && !b.codes.length) return b.key ?? actionOrCode;
  const code = b ? b.codes[0] : actionOrCode;
  if (mac && code.startsWith('Alt')) return 'Option';
  if (NAMES[code]) return NAMES[code];
  const digit = DIGIT_CODE.exec(code);
  if (digit) return digit[1];
  const own = layout === 'auto' ? layoutMap?.get?.(code) : null;
  const table = LAYOUTS[layout] ?? AZERTY_LABELS;
  return String(own ?? table[code] ?? code.replace(/^Key/, '')).toUpperCase();
}

// ---- the machine ----

/**
 * Keys held and let go, without the DOM. down(code, tMs, key) and up(code, tMs) return what fired,
 * as [{ action, kind }]; due(tMs) what a press key held TAP_MS fires ('held', once a press);
 * snapshot(tMs) is what is held now: { mx, mz (-1, 0 or 1), run, stroll, look }.
 */
export function createKeyState({ tapMs = TAP_MS } = {}) {
  const held = new Map();                                          // code → when it went down (ms)
  const pressDone = new Set();                                     // (press codes whose 'held' has fired: their key-up fires nothing)
  const fire = (action, kind) => [{ action, kind }];
  return {
    down(code, tMs, key = '') {
      if (key === '?') return fire('help', 'ui');
      if (held.has(code)) return [];                               // (a key already down: a repeat, or a missed keyup)
      held.set(code, tMs);
      pressDone.delete(code);
      const b = BY_CODE.get(code);
      if (b) return b.kind === 'sim' || b.kind === 'ui' || b.kind === 'loop' ? fire(b.action, b.kind) : b.kind === 'press' ? fire(b.action, 'down') : [];
      const d = DIGIT_CODE.exec(code);
      return d ? fire(`digit:${d[1]}`, 'digit') : [];
    },
    up(code, tMs) {
      const since = held.get(code);
      held.delete(code);
      const b = BY_CODE.get(code);
      if (b?.kind === 'hold' && since !== undefined && tMs - since < tapMs && !anotherHolds(b, code)) return fire(b.tap, 'sim');
      if (b?.kind === 'press') {
        const done = pressDone.delete(code);
        // (let go before TAP_MS: a tap; a press whose 'held' fired already says nothing more)
        if (since !== undefined && !done) return tMs - since < tapMs ? fire(b.action, 'tap') : fire(b.action, 'held');
      }
      return [];
    },
    /** The press keys held TAP_MS or more whose 'held' has not fired yet: [{ action, kind: 'held' }], each once a press. */
    due(tMs) {
      const out = [];
      for (const [code, since] of held) {
        const b = BY_CODE.get(code);
        if (b?.kind !== 'press' || pressDone.has(code) || tMs - since < tapMs) continue;
        pressDone.add(code);
        out.push({ action: b.action, kind: 'held' });
      }
      return out;
    },
    /** Whether an action's key (any of its codes) is held, and, for a hold key, held long enough. */
    isHeld(action, tMs) {
      const b = BY_ACTION.get(action);
      if (!b) return false;
      for (const c of b.codes) { const t = held.get(c); if (t !== undefined && (b.kind !== 'hold' || tMs - t >= tapMs)) return true; }
      return false;
    },
    snapshot(tMs) {
      let mx = 0, mz = 0;
      for (const c of held.keys()) { const b = BY_CODE.get(c); if (b?.kind === 'move') { mx += b.dir[0]; mz += b.dir[1]; } }
      return { mx: Math.sign(mx), mz: Math.sign(mz), run: this.isHeld('run', tMs), stroll: this.isHeld('stroll', tMs), look: this.isHeld('look', tMs) };
    },
    /** Everything let go (the window lost focus: keys released while away would stay down). */
    clear() { held.clear(); pressDone.clear(); },
    get held() { return [...held.keys()]; },
  };
  // (a hold key with two codes, one still down: letting the other go isn't a tap)
  function anotherHolds(b, code) { return b.codes.some(c => c !== code && held.has(c)); }
}
