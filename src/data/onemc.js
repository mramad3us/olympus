// OLYMPUS data: the 1MC's words, the ship's general announcing circuit, at each phase of a gravity event (v0.0.24, ROADMAP "anywhere" step 6; AW§4.3 item 3).
//
// A ship warns of a change of thrust before it comes: the siren, then the 1MC (the ship's speakers in every compartment, the
// Navy's name kept by the Corps' transports; SETTING's MCRN), "Brace, brace, brace. Secure for burn. Burn in fifteen seconds.",
// the count read from the event's warnS, and at the cut "Burn complete. Coasting.". A surprise (a jink to dodge, the drive
// lighting with no warning) has no words before it: the card is the body's answer (src/sim/places/gravity.js), and the 1MC says
// what it was once it is done. The words are said as the ship says them: the user's rule of 2026-11-19, "forget about voices,
// those are all terrible use text bubble only", so every line here is text, the speaker's bubble and the radio box's line
// (a 'say' fact of kind 'pa' with speaker '1MC'), never a voice; the siren is a sound and stays (src/ui/audio/siren.js).
// WARN by the event's kind: the verb ("Secure for burn") and the noun the count is of ("Burn in fifteen seconds"); END its words
// at the end of the hold; DONE a surprise's after it. countWords(s) is a whole number of seconds in words, as a voice on a ship
// reads a count (one to ninety-nine; a count past it in figures). (My calls, every line: no source gives a transport's 1MC.)
// v0.0.25's burn polish (the user's score of test-burn, 2026-11-19: "We should have some indication of how strong is the burn and
// evasive maneuvers, especially if not straped in, mag boots won't save you from a 3G sideways maneuver"): the warning names the
// event's size and, for a push across the deck, its direction, "Brace, brace, brace. Secure for manoeuvring: three G to port.
// Manoeuvre in ten seconds. Strap in: boots will not hold three G.", the last sentence wherever locked boots will not hold it
// (bootsHold: a push across the deck over GRAV_BODY.BOOTS_SHEAR_G 1.0 G, or a felt change over BRACE_G 1.5 G, the gravity's own
// rules); and ONSET the 1MC's call as the change comes in ("Burning. One G." / "Jinking. Three G to port."), a surprise's too,
// so the size is said while it acts. gWords(g) is a G in words ("one G", "zero point four G", "one and a half G"); dirOf(dirDeg)
// a push across the deck's direction in the ship's words and the screen's arrow (the berth's frame: x along the ship, forward
// west; so +x aft, +z port, the arrow the screen's, +z down).
import { GRAV_BODY, BRACE_G, SURPRISE_G } from './body/needs.js';
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The speaker's name on the radio box and its bubble. */
export const ONE_MC = '1MC';
/** The warning's call, before every kind's own words. */
export const BRACE_CALL = 'Brace, brace, brace.';
/** The warning by kind: what to secure for, and what the count is to. */
export const WARN = deepFreeze({
  burn: { secure: 'Secure for burn.', noun: 'Burn' },
  flip: { secure: 'Secure for flip and burn.', noun: 'Flip' },
  cut: { secure: 'Stand by for zero G.', noun: 'Drive cut' },
  jink: { secure: 'Secure for manoeuvring.', noun: 'Manoeuvre' },
  brace: { secure: 'Brace for shock.', noun: 'Shock' },
});
/** The words at the end of an event's hold (a cut has none: it stays cut). */
export const END = deepFreeze({ burn: 'Burn complete. Coasting.', flip: 'Flip complete. Coasting.', jink: 'Manoeuvring complete. Coasting.', brace: 'Secure from brace. Coasting.' });
/** The words after a surprise, once it is done (a surprise has no warning). */
export const DONE = deepFreeze({ burn: 'Unscheduled burn complete. Coasting.', flip: 'Unscheduled flip complete. Coasting.', jink: 'Evasive manoeuvre complete. Coasting.', brace: 'Secure from brace. Coasting.', cut: 'Drive cut. Coasting.' });

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
/** A whole number of seconds in words (see the header): 15 'fifteen', 45 'forty-five', 1 'one'; 100 and over in figures. */
export function countWords(s) {
  const n = Math.round(s);
  if (!(n >= 0) || n > 99) return String(n);
  return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ''}`;
}

/** A G in words (see the header): whole G in words, halves "and a half", else one decimal ("zero point four G"). */
export function gWords(g) {
  const v = Math.round(Math.abs(g) * 10) / 10, whole = Math.floor(v), tenth = Math.round((v - whole) * 10);
  if (!tenth) return `${countWords(whole)} G`;
  if (tenth === 5 && whole > 0) return `${countWords(whole)} and a half G`;
  return `${countWords(whole)} point ${countWords(tenth)} G`;
}
/** A push across the deck by its heading (dirDeg, 0 the deck's +x): the ship's word and the screen's arrow (see the header). */
export const DIRS = Object.freeze([
  Object.freeze({ deg: 0, word: 'aft', to: 'aft', arrow: '→' }),
  Object.freeze({ deg: 90, word: 'port', to: 'to port', arrow: '↓' }),
  Object.freeze({ deg: 180, word: 'forward', to: 'forward', arrow: '←' }),
  Object.freeze({ deg: 270, word: 'starboard', to: 'to starboard', arrow: '↑' }),
]);
/** The direction nearest a heading (DIRS' row), or the felt change's: onto the deck, its arrow a pressed-down mark. */
export function dirOf(dirDeg) {
  if (!Number.isFinite(dirDeg)) return DECK_DIR;
  const d = ((Math.round(dirDeg / 90) % 4) + 4) % 4;
  return DIRS[d];
}
/** A felt change of thrust's direction: weight onto the deck. */
export const DECK_DIR = Object.freeze({ deg: null, word: 'deck', to: 'onto the deck', arrow: '▼' });
/**
 * Whether locked mag boots hold a body through a change of dG (G: a push across the deck when lateral, its size; else the felt change,
 * the event's toG less the gravity it comes from, negative for a drop): gravity.js throwOne's rule whole, the one the sim acts on
 * (the code review of v0.0.25: the meter and the 1MC read 1.0 G sideways and an absolute toG while the sim read SURPRISE_G and
 * the change). No throw at a change of 0.05 G or less; else held up to BRACE_G warned and SURPRISE_G as a surprise, and across the
 * deck never past GRAV_BODY.BOOTS_SHEAR_G, where the boots tear off.
 */
export const bootsHold = (lateral, dG, { surprise = false } = {}) => !(dG > 0.05) || (dG <= (surprise ? SURPRISE_G : BRACE_G) && (!lateral || dG <= GRAV_BODY.BOOTS_SHEAR_G));
/** The size of an event in the 1MC's words: "one G", "three G to port". ev: { kind, toG, dirDeg }. */
export function sizeWords(ev) {
  if (!ev || ev.kind === 'cut' || !Number.isFinite(ev.toG)) return '';
  return ev.kind === 'jink' ? `${gWords(ev.toG)} ${dirOf(ev.dirDeg).to}` : gWords(ev.toG);
}
/** The 1MC's call at an event's onset, by kind: the size said while it acts (see the header). */
export const ONSET = deepFreeze({ burn: 'Burning.', flip: 'Flipping.', jink: 'Jinking.', brace: 'Shock.', cut: 'Drive cut.' });
/** The onset's words for an event: "Jinking. Three G to port." (a cut: "Drive cut. Zero G."). */
export function onsetWords(ev) {
  const size = ev.kind === 'cut' ? 'zero G' : sizeWords(ev);
  return `${ONSET[ev.kind] ?? 'Thrust.'} ${size[0].toUpperCase()}${size.slice(1)}.`;
}

/**
 * The warning's words for an event: "Brace, brace, brace. Secure for burn: one G. Burn in fifteen seconds." ev ({ toG, dirDeg }:
 * the event's, v0.0.25's burn polish) adds its size and direction, and "Strap in: boots will not hold three G." where they will not;
 * without it, v0.0.24's words.
 */
export function warnWords(kind, warnS, ev = null) {
  const W = WARN[kind];
  if (!W) throw new Error(`onemc: no warning for a '${kind}'`);
  const n = Math.round(warnS);
  const size = ev ? sizeWords({ kind, ...ev }) : '';
  const secure = size ? `${W.secure.replace(/\.$/, '')}: ${size}.` : W.secure;
  // (the change from the gravity it comes from (ev.fromG, gravity.js's, 0 when not given): a 2 G burn from 1 G is a change of 1 G)
  const lateral = kind === 'jink', hold = !ev || !Number.isFinite(ev.toG) || kind === 'cut' || bootsHold(lateral, lateral ? ev.toG : ev.toG - (ev.fromG ?? 0), { surprise: !!ev.surprise });
  return `${BRACE_CALL} ${secure} ${W.noun} in ${countWords(n)} second${n === 1 ? '' : 's'}.${hold ? '' : ` Strap in: boots will not hold ${gWords(ev.toG)}.`}`;
}
