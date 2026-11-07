// OLYMPUS hud: R's offer, the plate of what R does here, at the right of the instinct's line (VIEWS §7.1, §7.4; the build sheet 0.0.6 §2.3).
//
// What R does here is places' and time's handOffer(state) (src/sim/places/hand.js): getting up when lying or
// sitting, the quick action at the fixture you stand at, chosen by a priority (the user, 2026-11-06: "R should
// wash hands if hygiene is low enough, drink if we're thristy and shave if none of the above (use a priority
// thing and R is the most urgent)"), priced ("wash hands · 30 s", "shave · 4 min, done 19:46"), a door ("open
// the door"), the resume of a cut activity ("finish your shower · 7 min"), else the wait ("wait 15 min"),
// asked every frame; it says nothing while time stands still or a skip runs. offerWords() is the plate's
// words: the offer's label, "again:" before the wait while a first R has armed it (R twice waits, as built in
// v0.0.3: HAND_AGAIN_MS in main.js), whether R held has more than the plate and R's wait (handOffer's rows
// over two, the wait being every menu's last row, or v0.0.5's more, the other choices: the plate's "HOLD ▸"
// mark, R held opening the menu, cards/actions.js; a door alone and its wait carry no mark, the integrator's
// call, 0.0.6), whether it would make you late, and a note of why the spot's own action is not R's where it
// is struck ("use the head: nothing to give · R wait 15 min": the fixer's, 0.0.6). The plate
// itself is drawn by hud/instinct.js, in the kit's pixels, on every line, urgent ones included (the 0.0.6
// round: R says what it does before it is pressed, against SKILLS §14.1's "except on an urgent line"; the
// sheet §8 item 7). wantOf() is what R tapped sends the sim for an offer (hand.js's handAction reads it).

/**
 * The plate's words for an offer: { key, text, more, late, note } (key the action whose keycap leads it). armed: a
 * first R has asked for the wait. short: an urgent line's plate, the price's ', done HH:MM' and ', the count HH:MM'
 * left off so the DI's order is never cut for them (the late shows in amber anyway; the fixer's, 0.0.6), the note
 * too. note: why the spot's own action is not R's (handOffer's struck: 'use the head: nothing to give').
 */
export function offerWords(offer, { armed = false, short = false } = {}) {
  if (!offer) return null;
  let label = offer.label ?? offer.verb ?? '';
  if (short) label = label.replace(/, (done|the count) .*$/, '');
  const text = offer.verb === 'wait' && armed ? `again: ${label}` : label;
  // (rows counts R's wait, the menu's last row everywhere: a door and the wait is nothing more than the plate)
  const more = (Number.isFinite(offer.rows) && offer.rows > 2) || (Array.isArray(offer.more) && offer.more.length > 0);
  const note = !short && offer.struck?.off ? `${offer.struck.words}: ${offer.struck.off}` : null;
  return { key: offer.act ?? 'hand', text, more, late: !!offer.late, note };
}

/** What R tapped sends for an offer: { act: 'hand', args: { want, id?, spotId?, args?, lead? } } (a door's verbs are want 'door'; an activity's lead: a sleep or a nap from your rack's foot lies you down in sight first), or null. */
export function wantOf(offer) {
  if (!offer) return null;
  const want = offer.verb === 'open' || offer.verb === 'close' ? 'door' : offer.verb;
  const args = { want };
  if (offer.verb === 'activity' || offer.verb === 'resume') { args.id = offer.id; args.spotId = offer.spotId ?? null; if (offer.args) args.args = offer.args; }
  if (offer.verb === 'activity') args.lead = true;
  return { act: 'hand', args };
}
