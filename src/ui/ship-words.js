// OLYMPUS ui: a ship's words for a door's (v0.0.25's fixer; the play review of "Hold to hold", item 13: the panel's "AT THE DOOR",
// "Kick door", the DI's "Read the door, then tell your two.", the toast's "Push door, hinge right." and the fault's "Don't stop in the
// door!" in the Wreck, where every opening is a hatch).
//
// The Wreck's lane runs on the shoot house's drill whole (its build sheet's choice), and the drill's rows, lines, toasts and faults
// name a door, which aboard is a hatch. The words are the page's, never the sim's: the sim's record (its log, its saves, the pins)
// keeps the drill's own words, and the page says them as a hatch where the lane is a ship's (R.house.ship). hatchWords(text) is the
// rule: "door" → "hatch", "doors" → "hatches", "doorway" → "hatchway", in the text's own case; shipWords(text, state) applies it on a
// ship and leaves every other text as it is (the toasts and the says, main.js); shipText(root, state) does the same to the HUD's own
// text in place each frame on a ship (the step panel, the instinct's line, the cards), writing a node only where its words change, so
// a frame off the Wreck reads nothing and one on it touches only the few nodes that name a door.
// Pure but shipText, which writes the text nodes under the root it is given.

const DOOR_RE = /\b(door)(ways|way|s)?\b/gi;
const ENDS = Object.freeze({ way: 'way', ways: 'ways', s: 'es' });

/** A text's door words as a hatch's (see the header), each in its own case. */
export function hatchWords(text) {
  return String(text).replace(DOOR_RE, (m, w, end) => {
    const upper = w === 'DOOR', base = upper ? 'HATCH' : w[0] === 'D' ? 'Hatch' : 'hatch', tail = end ? ENDS[end.toLowerCase()] : '';
    return base + (upper ? tail.toUpperCase() : tail);
  });
}
/** Whether the lane played is a ship's (the Wreck's: R.house.ship). */
export const onShip = (state) => !!state?.armoury?.range?.house?.ship;
/** A text as the page shows it: a hatch's words for a door's on a ship, else as it is (any other value passed through). */
export const shipWords = (text, state) => (typeof text === 'string' && onShip(state) ? hatchWords(text) : text);
/** The HUD's text under root said as a hatch's on a ship (see the header): how many text nodes changed. */
export function shipText(root, state) {
  if (!root || !onShip(state)) return 0;
  const walker = root.ownerDocument.createTreeWalker(root, 4);          // (NodeFilter.SHOW_TEXT)
  let n = 0;
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const v = t.nodeValue;
    if (!v || !/door/i.test(v)) continue;
    const w = hatchWords(v);
    if (w !== v) { t.nodeValue = w; n++; }
  }
  return n;
}
