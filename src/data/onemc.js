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

/** The warning's words for an event: "Brace, brace, brace. Secure for burn. Burn in fifteen seconds." */
export function warnWords(kind, warnS) {
  const W = WARN[kind];
  if (!W) throw new Error(`onemc: no warning for a '${kind}'`);
  const n = Math.round(warnS);
  return `${BRACE_CALL} ${W.secure} ${W.noun} in ${countWords(n)} second${n === 1 ? '' : 's'}.`;
}
