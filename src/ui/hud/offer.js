// OLYMPUS hud: R's offer, the chip of what's at hand at the end of the instinct's line (VIEWS §7.1, §7.4).
//
// What R does here is places' and time's handOffer(state) (src/sim/places/hand.js, the build sheet
// 0.0.4 §2.2.6): getting up when lying or sitting, an activity at the fixture you stand at ("shower ·
// 10 min, done 19:41"), a door ("open the door", "close the door"), the resume of a cut activity
// ("finish your shower · 7 min"), else the wait ("wait 15 min"), asked every frame; it says nothing
// while time stands still or a skip runs. offerWords() is the chip's words: the offer's label, "again:"
// before the wait while a first R has armed it (R twice waits, as built in v0.0.3: HAND_AGAIN_MS in
// main.js), and whether the offer has more (R held: the rack's sleep and naps, the sink's three: the
// choices card, cards/choose.js). The chip itself is drawn by hud/instinct.js, after the line and its
// own chip, and never on an urgent line (SKILLS §14.1: R's offer is appended as a chip, except on an
// urgent line). wantOf() is what R tapped sends the sim for an offer (hand.js's handAction reads it).

/** The chip's words for an offer: { key, text, more } (key the action whose keycap leads it). armed: a first R has asked for the wait. */
export function offerWords(offer, { armed = false } = {}) {
  if (!offer) return null;
  const label = offer.label ?? offer.verb ?? '';
  const text = offer.verb === 'wait' && armed ? `again: ${label}` : label;
  return { key: offer.act ?? 'hand', text, more: Array.isArray(offer.more) && offer.more.length > 0 };
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
