// OLYMPUS hud: the instinct's line at the bottom centre, and R's offer on it (VIEWS §7.1, §7.4).
//
// The INSTINCT rectangle (layout.js, 720 × 44 at --ui 1) holds one line: its lead, then R's offer as
// a chip, the keycap in the player's layout and what R does here ("R open the door" when a door is
// in reach, "R close the door" once it stands open, "R wait 15 min" elsewhere: places' handOffer,
// asked every frame, which says nothing while time stands still or a skip runs). The lead is what
// the game says it is doing in place of the instinct's own lines (they come with SKILLS's instinct,
// 0.0.5): "Time stands still: a digit to choose." while a choice holds time (VIEWS §7.4's lead), the
// bench's countdown. Tradecraft's settle(): a line holds while its rule does and drops at once when
// it stops, and the DOM is written only when the line changes, so a frame costs a compare.

/** The line in parent: { el, update({ lead, offer }) }; label(action) names a key in the player's layout. */
export function createOffer(parent, { label = (a) => a } = {}) {
  const root = Object.assign(document.createElement('div'), { className: 'instinct' });
  parent.append(root);
  let shown = null;
  return {
    el: root,
    /** lead: a string or null; offer: handOffer()'s { act, verb, target, label } or null. Returns the line's text. */
    update({ lead = null, offer = null } = {}) {
      const key = offer ? label(offer.act ?? 'hand') : '';
      const sig = `${lead ?? ''}|${key}|${offer?.label ?? ''}`;
      if (sig !== shown) {
        shown = sig;
        const kids = [];
        if (lead) kids.push(Object.assign(document.createElement('span'), { className: 'lead', textContent: lead }));
        if (offer) {
          const chip = Object.assign(document.createElement('span'), { className: 'chip' });
          chip.append(Object.assign(document.createElement('kbd'), { textContent: key }), ` ${offer.label}`);
          kids.push(chip);
        }
        root.replaceChildren(...kids);
        root.hidden = !kids.length;
      }
      return root.hidden ? '' : root.textContent;
    },
    get text() { return root.hidden ? '' : root.textContent; },
  };
}
