// OLYMPUS hud: the toasts, the log's last lines at the top left (VIEWS §7.1, tradecraft's).
//
// What the sim writes to the log (a `log` fact's record: its text and tone) and the short lines it
// and the page say (`line` facts, the page's own toasts) show in the TOASTS rectangle (layout.js),
// newest last, TOASTS_MAX (3) at most, each for TOAST_S (16 s: the user wanted twice tradecraft's
// first 8 s) of play: the toasts' clock runs only while the game does (not paused, no card up), as
// tradecraft's hudMs did, so a line said while the menu is open is still there to read after it.
// On the title (no game) it runs on real time. A line's border is its tone (note slate, warn
// brass, urgent and bad red, calm green). The rectangle never grows: a line wraps to two at most,
// and if three long ones would overflow it the oldest goes first, so nothing reaches the picture's
// middle or the watch (the user: "overlapping UI elements", tradecraft; VIEWS §7.5). Everything a
// toast said is in the log card (J), whole.

/** How long a toast stays, in seconds of play (VIEWS §7.1), and how many show at once. */
export const TOAST_S = 16, TOASTS_MAX = 3;
/** The fade at a toast's end (ms). */
export const TOAST_FADE_MS = 1200;

/** The toasts in parent: { el, push(text, tone), frame(dtMs, running), clear(), lines }. */
export function createToasts(parent) {
  const root = Object.assign(document.createElement('div'), { className: 'toasts' });
  parent.append(root);
  let clockMs = 0;
  const fit = () => {
    while (root.children.length > TOASTS_MAX) root.firstChild.remove();
    // (the rectangle is fixed: a line that would spill out of it takes the oldest's place)
    while (root.children.length > 1 && root.scrollHeight > root.clientHeight + 1) root.firstChild.remove();
  };
  return {
    el: root,
    /** A line: its text and its tone ('note' | 'warn' | 'urgent' | 'bad' | 'calm'). */
    push(text, tone = 'note') {
      if (!text) return null;
      const t = Object.assign(document.createElement('div'), { className: `toast ${tone || 'note'}`, textContent: String(text) });
      t.dataset.born = String(clockMs);
      root.append(t);
      fit();
      return t;
    },
    /** A frame: dtMs of real time, which counts only while running (play runs, nothing covers it). */
    frame(dtMs, running = true) {
      if (running) clockMs += Math.max(0, Math.min(dtMs, 250));
      for (const t of [...root.children]) {
        const age = clockMs - Number(t.dataset.born);
        if (age > TOAST_S * 1000 && !t.classList.contains('gone')) t.classList.add('gone');
        if (age > TOAST_S * 1000 + TOAST_FADE_MS) t.remove();
      }
    },
    clear() { root.replaceChildren(); },
    /** The lines showing, oldest first. */
    get lines() { return [...root.children].filter(t => !t.classList.contains('gone')).map(t => t.textContent); },
  };
}
