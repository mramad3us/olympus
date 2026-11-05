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
// Every action also goes to the onAction(fn) listeners as fn(action, kind, event): the UI routes the
// screens ('inventory', 'menu'), the loop's pause ('pause'), and a menu's digits. accept(action,
// kind) decides whether a sim action is queued at all (main.js says no while the game is paused or
// an overlay is open, so a key pressed in a menu doesn't land in the world when it closes).
//
// The mouse, in stage coordinates: the position over the stage element (the canvas) in its own
// pixels (setStage(el, widthPx, heightPx): 640 × 360 or 960 × 540, whatever PX_PER_M decides), its
// buttons held (the MouseEvent bitmask: 1 left, 2 right, 4 middle), the clicks on the stage since
// the last snapshot as [button, x, y], and the wheel's travel. Clicks on the interface over the
// stage (a button, a card) are not the stage's. The mouse is for menus and aiming (DESIGN.md,
// Controls).
//
// Browser manners kept from tradecraft (src/ui/input.js): Cmd and Ctrl combinations are left to the
// browser; typing in a text field is not a key for the game; the move keys, Tab, Space and Alt don't
// scroll, move focus or open the browser's menu; a key's auto-repeat fires nothing; losing focus lets
// every key go. This module is imported only by the browser side (main.js): nothing in the sim reads
// the DOM.
import { createKeyState, label as keyLabel, BINDINGS } from './keys.js';

const PREVENT = new Set(['Tab', 'Space', 'AltLeft', 'AltRight', ...BINDINGS.filter(b => b.kind === 'move').flatMap(b => b.codes)]);

/**
 * Input from a target (window by default). Options: stage (the canvas) and stageSize ([w, h] in
 * stage pixels), layout ('azerty' | 'qwerty' | 'auto'), accept(action, kind), now() (ms).
 */
export function createInput({ target = globalThis.window, stage = null, stageSize = null, layout = 'azerty', accept = () => true, now = () => globalThis.performance.now() } = {}) {
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

  const onDown = (e) => {
    if (e.metaKey || e.ctrlKey || typing(e)) return;               // (the browser's shortcuts, and text being typed)
    if (PREVENT.has(e.code) || e.altKey) e.preventDefault();       // (Alt is the stroll: held with a move, it mustn't type or wake a menu)
    if (e.repeat) return;
    dispatch(keys.down(e.code, now(), e.key), e);
  };
  const onUp = (e) => {
    if (e.code?.startsWith('Alt')) e.preventDefault();
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
      const out = { ...keys.snapshot(now()), act: queue, mouse: { x: mouse.x, y: mouse.y, inside: mouse.inside, buttons: mouse.buttons, clicks, wheel } };
      queue = []; clicks = []; wheel = 0;
      return out;
    },
    /** What is held now, without draining anything (for the UI). */
    peek() { return { ...keys.snapshot(now()), act: queue.slice(), mouse: { ...mouse } }; },
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
    dispose() { for (const [type, fn, opt] of listeners) target?.removeEventListener?.(type, fn, opt); handlers.clear(); },
  };
}
