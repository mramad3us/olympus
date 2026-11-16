// OLYMPUS arms: the Corps' macros and their sub-steps for a belief (WEAPONS §5.3), in a leaf that reads only the models.
//
// drills.js runs and offers the macros; plan.js reads their sub-steps for its compound edges (IMMEDIATE ACTION, REMEDIAL ACTION)
// and plans the reloads that drills.js offers. Both import from here, so neither imports the other's planner or offers (the code
// review of v0.0.18: drills.js and plan.js imported each other, a cycle that would throw on the first top-level read of the other's
// table). drills.js re-exports MACROS and subsOf, so every caller keeps its import. The tables and the rule are drills.js's of
// v0.0.17 to the byte, the P-12's port dropped by its model (the build sheet 0.0.18 §0 item 6). Pure.
import { MODELS } from './models.js';

/** The macros (WEAPONS §5.3): id → { label, subs, observer? }. */
export const MACROS = Object.freeze({
  load: Object.freeze({ label: 'LOAD', subs: Object.freeze(['selector:safe', 'reach', 'seat', 'port']) }),
  ready: Object.freeze({ label: 'MAKE READY', subs: Object.freeze(['selector:safe', 'charge', 'pressCheck', 'port']) }),
  unload: Object.freeze({ label: 'UNLOAD', subs: Object.freeze(['selector:safe', 'magOut:pouch', 'lockBack', 'inspect', 'release', 'selector:safe', 'port']) }),
  clear: Object.freeze({ label: 'UNLOAD, SHOW CLEAR', observer: true, subs: Object.freeze(['selector:safe', 'magOut:pouch', 'lockBack', 'inspect', 'show', 'release', 'selector:semi', 'functionCheck', 'charge', 'selector:safe', 'port']) }),
  'reload:speed': Object.freeze({ label: 'RELOAD', subs: Object.freeze(['magOut:drop', 'reach', 'seat', 'release']) }),
  'reload:retain': Object.freeze({ label: 'RELOAD, keep the empty', subs: Object.freeze(['magOut:dump', 'reach', 'seat', 'release']) }),
  'reload:tactical': Object.freeze({ label: 'RELOAD', subs: Object.freeze(['magOut:pouch', 'reach', 'seat']) }),
  ia: Object.freeze({ label: 'IMMEDIATE ACTION', subs: Object.freeze(['tap', 'charge', 'observe']) }),
  remedial: Object.freeze({ label: 'REMEDIAL ACTION', subs: Object.freeze(['lockBack', 'magOut:strip', 'rack', 'rack', 'rack', 'magIn', 'charge', 'observe']) }),
  cease: Object.freeze({ label: 'CEASE FIRE', subs: Object.freeze(['finger', 'selector:safe']) }),
  // (the shoot house's Stop at the lane's end (COMBAT §25.19.4: "Make safe", one row): the finger off, on safe, low ready)
  safe: Object.freeze({ label: 'MAKE SAFE', subs: Object.freeze(['finger', 'selector:safe', 'posture:lowReady']) }),
});

/** The actions that cock the hammer on the way (the R-7's lever reaches safe only after one: drills.js's header). */
const COCKS = new Set(['charge', 'rack', 'lockBack', 'clearDouble']);
/**
 * A macro's sub-steps for a belief (beliefOf's view): skipping only a magazine out with none believed in, a
 * lock back with the bolt believed locked on an empty (or unsure) chamber, and a reach with a magazine already
 * in the hand (0.0.6); a reload's bolt release becomes Charge on a bolt not believed locked (the magazine out on a dry
 * chamber, macrosFor's: nothing holds the bolt back); with the hammer believed down on a
 * model whose lever needs it cocked, the first safe after the first step that cocks it, or a charge before it.
 */
export function subsOf(macroId, belief) {
  const m = MACROS[macroId];
  if (!m) return [];
  const subs = m.subs.filter(a => !(a.startsWith('magOut:') && belief?.mag === 'out') && !(a === 'lockBack' && belief?.locked && (belief.chamber === 'empty' || belief.chamber === '?'))
    && !(a === 'reach' && belief?.hand) && (a !== 'port' || MODELS[belief?.model]?.portCover !== false)).map(a => (a === 'release' && macroId.startsWith('reload:') && belief && !belief.locked ? 'charge' : a));
  if (belief?.cocked === false && MODELS[belief.model]?.safeNeedsCocked) {
    const s = subs.indexOf('selector:safe'), c = subs.findIndex(a => COCKS.has(a));
    if (s >= 0 && (c < 0 || c > s)) {
      if (c < 0) subs.splice(s, 0, 'charge');
      else { subs.splice(s, 1); subs.splice(c, 0, 'selector:safe'); }
    }
  }
  return subs;
}

