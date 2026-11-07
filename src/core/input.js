// OLYMPUS core: the keyboard and the mouse, read from the browser into a per-tick snapshot.
//
// The keys' table and the hold/tap machine are keys.js (pure data and logic, tested without a
// browser); this module listens for the events and keeps what the sim gets each tick:
//     { mx, mz, run, stroll, look, act: ['people', 'digit:2', 'glance'…], mouse }
// mx, mz are -1, 0 or 1 from the move keys held; run, stroll and look are held states; act is every
// action for the sim fired since the last snapshot (sim and digit kinds), each delivered once:
// snapshot() drains them, so of the ticks a frame runs, the first gets the presses. The snapshot is
// plain data, so a run can be recorded and replayed.
//
// queue(action) puts an action of the UI's own (a menu's choice, a splash's command, a debug key's
// 'debug:skip:<ms>') into the same list, for the next snapshot, as a key press would: the UI never
// changes the state itself (TECH §2.6).
//
// Every action also goes to the onAction(fn) listeners as fn(action, kind, event): the UI routes the
// screens ('inventory', 'menu'), the loop's pause ('pause'), and a menu's digits. accept(action,
// kind) decides whether a sim action is queued at all (main.js says no while the game is paused or
// an overlay is open, so a key pressed in a menu doesn't land in the world when it closes).
//
// R and T are press keys (keys.js): their 'down', 'tap' and 'held' go to the listeners only, never
// into the queue, since what they send depends on what the line and the offer said when the key went
// down (the UI queues it, with its arguments). The digits are press keys too since the 0.0.5 round:
// their 'digit' on the key going down is queued as before (a menu's line, G's stub), their 'tap' and
// 'held' go to the listeners only (the step panel of stop motion sends its step from what it showed,
// and main.js's accept refuses the bare digit there). A press held TAP_MS fires 'held' then, while the key is
// still down (the build sheet 0.0.4 §2.4: "R and T act on key-up under TAP_MS 220, or at 220 ms while
// held"): a timer set on the key going down asks the key machine's due() at TAP_MS, and every
// snapshot asks it too, so a stalled timer only delays it to the next tick.
//
// The mouse, in stage coordinates: the position over the stage element (the canvas) in its own
// pixels (setStage(el, widthPx, heightPx): 640 × 360 or 960 × 540, whatever PX_PER_M decides), its
// buttons held (the MouseEvent bitmask: 1 left, 2 right, 4 middle), the clicks on the stage since
// the last snapshot as [button, x, y], and the wheel's travel. Clicks on the interface over the
// stage (a button, a card) are not the stage's. The mouse is for menus and aiming (DESIGN.md,
// Controls).
//
// Browser manners kept from tradecraft (src/ui/input.js): Cmd and Ctrl combinations are left to the
// browser; typing in a text field is not a key for the game; while the game owns the keys (swallow():
// main.js says a state is live and no card or title page is up) the move keys, Tab and Space don't
// scroll, move focus or press a button, and otherwise they keep their browser meaning, so the title's
// and the enlistment's buttons are reached with Tab (0.0.2 swallowed them everywhere, and only the
// first button could be used from the keyboard); Alt never opens the browser's menu; a key's
// auto-repeat fires nothing; losing focus lets every key go, and so does letting Cmd go (on macOS
// Chrome sends no keyup for a letter released while Cmd is held, so a move key held into a Cmd
// shortcut would walk on by itself). This module is imported only by the browser side (main.js):
// nothing in the sim reads the DOM.
//
// A card that reads its own keys (the 0.0.6 round's R menu, cards/actions.js: the build sheet 0.0.6 §2.3)
// takes them through own(fn): while fn is set every key going down is fn(code, event)'s alone (the move keys,
// Space, Enter and the arrows lose their browser meaning), and neither the key machine, the queue nor the
// listeners hear it, so a key pressed in the menu never lands in the world, now or when it closes; keys going
// up still reach the machine, so a key held into the card (R, held to open it) is let go as it should be and
// fires nothing more.
import { createKeyState, label as keyLabel, BINDINGS, TAP_MS } from './keys.js';

const PREVENT = new Set(['Tab', 'Space', 'AltLeft', 'AltRight', ...BINDINGS.filter(b => b.kind === 'move').flatMap(b => b.codes)]);

/**
 * Input from a target (window by default). Options: stage (the canvas) and stageSize ([w, h] in
 * stage pixels), layout ('azerty' | 'qwerty' | 'auto'), accept(action, kind), swallow() (whether the
 * game owns the keys now: Tab, Space and the move keys lose their browser meaning), now() (ms).
 */
export function createInput({ target = globalThis.window, stage = null, stageSize = null, layout = 'azerty', accept = () => true, swallow = () => true, now = () => globalThis.performance.now() } = {}) {
  const keys = createKeyState();
  const handlers = new Set();
  let queue = [];
  const mouse = { x: 0, y: 0, inside: false, buttons: 0 };
  let clicks = [], wheel = 0, layoutMap = null;
  const mac = /Mac/.test(globalThis.navigator?.platform ?? '');
  globalThis.navigator?.keyboard?.getLayoutMap?.().then(m => { layoutMap = m; }).catch(() => {});

  const dispatch = (fired, e) => {
    for (const { action, kind } of fired) {
      for (const fn of handlers) fn(action, kind, e);
      if ((kind === 'sim' || kind === 'digit') && accept(action, kind)) queue.push(action);
    }
  };
  const typing = (e) => !!e.target?.closest?.('input, textarea, select, [contenteditable]');

  // (a press held TAP_MS fires 'held' while still down: asked on a timer, and at every snapshot)
  const due = (e = null) => { const fired = keys.due(now()); if (fired.length) dispatch(fired, e); };
  const later = globalThis.setTimeout?.bind(globalThis) ?? null;
  let owner = null;                                                // (a card that reads its own keys, own())
  const onDown = (e) => {
    if (e.metaKey || e.ctrlKey || typing(e)) return;               // (the browser's shortcuts, and text being typed)
    if (owner) { if (owner(e.code, e) !== false) e.preventDefault(); return; }
    if ((PREVENT.has(e.code) && swallow()) || e.altKey || e.code?.startsWith('Alt')) e.preventDefault();   // (Alt is the stroll: held with a move, it mustn't type or wake a menu)
    if (e.repeat) return;
    const fired = keys.down(e.code, now(), e.key);
    dispatch(fired, e);
    if (later && fired.some(f => f.kind === 'down' || f.kind === 'digit')) later(() => due(e), TAP_MS + 5);
  };
  const onUp = (e) => {
    if (e.code?.startsWith('Alt')) e.preventDefault();
    if (e.code === 'MetaLeft' || e.code === 'MetaRight') { keys.clear(); return; }   // (the keys let go under Cmd sent no keyup)
    dispatch(keys.up(e.code, now()), e);
  };
  const onBlur = () => { keys.clear(); mouse.buttons = 0; };

  // (the mouse over the stage, in its pixels)
  const onStage = (e) => !!stage && (e.target === stage || stage.contains?.(e.target));
  const place = (e) => {
    if (!stage) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true; return; }
    const r = stage.getBoundingClientRect();
    const [w, h] = stageSize ?? [r.width, r.height];
    mouse.x = ((e.clientX - r.left) / r.width) * w;
    mouse.y = ((e.clientY - r.top) / r.height) * h;
    mouse.inside = mouse.x >= 0 && mouse.y >= 0 && mouse.x < w && mouse.y < h;
  };
  const onMove = (e) => { place(e); mouse.buttons = e.buttons ?? 0; };
  const onMouseDown = (e) => {
    place(e); mouse.buttons = e.buttons ?? 0;
    if (onStage(e)) clicks.push([e.button, Math.round(mouse.x * 100) / 100, Math.round(mouse.y * 100) / 100]);
  };
  const onMouseUp = (e) => { mouse.buttons = e.buttons ?? 0; };
  const onWheel = (e) => { if (onStage(e)) wheel += e.deltaY; };
  const onMenu = (e) => { if (onStage(e)) e.preventDefault(); };   // (the right button is the game's over the stage)

  const listeners = [['keydown', onDown], ['keyup', onUp], ['blur', onBlur], ['mousemove', onMove], ['mousedown', onMouseDown],
    ['mouseup', onMouseUp], ['wheel', onWheel, { passive: true }], ['contextmenu', onMenu]];
  for (const [type, fn, opt] of listeners) target?.addEventListener?.(type, fn, opt);

  return {
    /** Hear every action: fn(action, kind, event). Returns its removal. */
    onAction(fn) { handlers.add(fn); return () => handlers.delete(fn); },
    /** The next tick's input (drains the actions and clicks). */
    snapshot() {
      due();
      const out = { ...keys.snapshot(now()), act: queue, mouse: { x: mouse.x, y: mouse.y, inside: mouse.inside, buttons: mouse.buttons, clicks, wheel } };
      queue = []; clicks = []; wheel = 0;
      return out;
    },
    /** What is held now, without draining anything (for the UI). */
    peek() { return { ...keys.snapshot(now()), act: queue.slice(), mouse: { ...mouse } }; },
    /**
     * An action for the next snapshot's act, as a key press gives (TECH §2.6: the UI's and the debug
     * keys' way into the sim; the UI never changes the state itself). Deliberate, so accept() is not asked.
     */
    queue(action) { queue.push(action); },
    /**
     * A key pressed or let go by its code, as the keyboard would send it (the bench's scripted keys, the
     * build sheet 0.0.4 §2.3: R at the rack is a press, so it must reach the listeners, not only the key
     * machine): through the key machine to the listeners and the queue.
     */
    key(code, down = true) {
      const fired = down ? keys.down(code, now()) : keys.up(code, now());
      dispatch(fired, null);
      if (down && later && fired.some(f => f.kind === 'down' || f.kind === 'digit')) later(() => due(null), TAP_MS + 5);
      return fired;
    },
    /**
     * A card reads its own keys: every key going down is fn(code, event)'s alone until the release this returns
     * is called (fn returning false lets a key keep its browser meaning; nothing reaches the machine, the
     * queue or the listeners either way). Keys going up still reach the machine.
     */
    own(fn) {
      owner = typeof fn === 'function' ? fn : null;
      const mine = owner;
      return () => { if (owner === mine) owner = null; };
    },
    /** Whether a card owns the keys now. */
    get owned() { return !!owner; },
    /** Drop the queued actions and clicks (a scene change, a load). */
    drop() { queue = []; clicks = []; wheel = 0; },
    /** Let every key go. */
    clear() { keys.clear(); queue = []; clicks = []; wheel = 0; },
    /** What the key of an action (or a code) is called on the player's keyboard. */
    label(actionOrCode) { return keyLabel(actionOrCode, { layout, layoutMap, mac }); },
    setLayout(l) { layout = l; },
    get layout() { return layout; },
    /** The stage the mouse is read over, and its size in stage pixels. */
    setStage(el, widthPx, heightPx) { stage = el; stageSize = widthPx ? [widthPx, heightPx] : null; },
    get mouse() { return { ...mouse }; },
    keys,
    dispose() { for (const [type, fn, opt] of listeners) target?.removeEventListener?.(type, fn, opt); handlers.clear(); owner = null; },
  };
}
