// OLYMPUS core: how long a line takes to say aloud, the one helper the sim's tower wait and the speaker's bubbles read.
//
// A line said in the game is shown as text for its hold (handling.js durOf: the radio box's 3.5 s plus 0.33 s a word),
// which is a reading time. Spoken, it takes less: SPOKEN_LEAD_MS 250 ms to draw breath and key the horn, then
// SPOKEN_WORD_MS 300 ms a word (about 200 words a minute, a range officer's clipped pace; the build sheet v0.0.20 item 7,
// feel.md FL-3). So the shoot house's brief, 35 words, is 10.75 s spoken, and the instructor's own 27 words after it 8.35 s.
// One quantity, one helper (CLAUDE.md, "visuals obey the sim"): the tower holds its next command while the instructor's
// chained line is still being said (shoothouse.js houseReady, `R.paUntilMs`), and the bubble over the speaker's head lasts as
// long (src/ui/plaque.js), so the two never part. No line is voiced (v0.0.24: the voice synthesis that paced its queue by it
// is gone, the user's "forget voice synthesis, no voices." of 2026-11-19).
//
// Words are split on white space; a token is a word, but a token with digits is said by the numbers' rule (numberWords, v0.0.20): a token that opens with a digit, "10" is "ten", "300" "three
// hundred", "0.38" "zero point three eight", "2a" "two A", so a line with numbers takes the time its words take aloud (a token
// that opens with a letter, a name such as "w12", is one word). A line with no words takes no time. Pure:
// no state, no clock, integer milliseconds.

/** A word said aloud (ms), at the range's clipped pace. */
export const SPOKEN_WORD_MS = 300;
/** The breath and the key before the first word (ms). */
export const SPOKEN_LEAD_MS = 250;

const ONES = Object.freeze(['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
  'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']);
const TENS = Object.freeze(['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']);
/** A whole number 0 to 999 999 as said: [words] ("three hundred and five" as the range says it: 'three', 'hundred', 'and', 'five'). */
export function numberWords(n) {
  n = Math.floor(Math.abs(Number(n)));
  if (!Number.isFinite(n)) return [];
  if (n >= 1000) { const k = Math.floor(n / 1000), r = n % 1000; return [...numberWords(k), 'thousand', ...(r ? (r < 100 ? ['and', ...numberWords(r)] : numberWords(r)) : [])]; }
  if (n >= 100) { const h = Math.floor(n / 100), r = n % 100; return [ONES[h], 'hundred', ...(r ? ['and', ...numberWords(r)] : [])]; }
  if (n >= 20) { const t = Math.floor(n / 10), r = n % 10; return r ? [TENS[t], ONES[r]] : [TENS[t]]; }
  return [ONES[n]];
}
/**
 * A token that opens with a digit as said (see the header): its digits' runs by numberWords, a decimal's digits one by one after "point",
 * its letters as they are, the token's trailing punctuation kept on its last word ("10," → ['ten,']); any other token as it is.
 */
export function sayToken(tok) {
  const t = String(tok);
  if (!/^[(\[]?\d/.test(t)) return [t];
  const m = /^(.*?)([.,;:!?)]*)$/.exec(t), body = m[1], tail = m[2], out = [];
  for (const part of body.match(/\d+(?:\.\d+)?|[^\d]+/g) ?? []) {
    if (/^\d/.test(part)) { const [w, f] = part.split('.'); out.push(...numberWords(w)); if (f) out.push('point', ...[...f].map(d => ONES[+d])); }
    // (a stand's letter after its number, "2a": its letter's name, "two A")
    else { const p = part.replace(/^[-']+|[-']+$/g, ''); if (p) out.push(p.length === 1 ? p.toUpperCase() : p); }
  }
  if (!out.length) return [t];
  out[out.length - 1] += tail;
  return out;
}
/** The words of a line as said: split on white space, a token with digits as its numbers' words (sayToken). */
export const spokenWords = (text) => String(text ?? '').split(/\s+/).filter(Boolean).flatMap(sayToken);

/** How long a line takes to say aloud (ms): SPOKEN_LEAD_MS plus SPOKEN_WORD_MS a word; 0 for a line with no words. */
export function spokenMs(text) {
  const n = spokenWords(text).length;
  return n ? SPOKEN_LEAD_MS + SPOKEN_WORD_MS * n : 0;
}
