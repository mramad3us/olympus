// OLYMPUS arms: an action's words by the gun's model, where a pistol's differ from the rifle's (WEAPONS §3.2's note; the build sheet 0.0.18 §2.1).
//
// The panel's words for the hands' steps are the rifle's (shooting.js LABELS: "Charge", "Bolt release", "Lock back"). A pistol
// has a slide, not a charging handle and a bolt, and the P-12's spare rides in the thigh's pistol pouch (kit.js 'pp'), which the
// rifle's table never named: the drawn P-12's reach read "reach@pp (10 frangible)" in v0.0.17. wordsOf(action, model) gives the
// pistol's words where they differ and null everywhere else, so every caller keeps LABELS for the rifle and its range rows
// stand word for word: `wordsOf(a, model) ?? LABELS[a] ?? SIDEARM_LABELS[a]`. The P-12 is striker fired with a manual frame
// safety and no decocker (models.js), so Safe and Off safe stay the rifle's words. A leaf with no imports, so the label sites
// (shooting.js, sidearm.js, plan.js) read it without a cycle.

/** The pistol's words where they differ from the rifle's: action id → words. */
export const PISTOL_WORDS = Object.freeze({
  charge: 'Rack the slide', release: 'Slide release', lockBack: 'Lock the slide back',
  'reach@pp': 'Reach: the pistol pouch', 'stowMag@pp': 'Put back: the pistol pouch', 'magOut:pouch': 'Magazine to the thigh pouch',
});
/** The models whose words are the pistol's (the kind a model is: models.js KINDS; a leaf, so by id). */
const PISTOLS = new Set(['p12']);

/** An action's words on a model where they differ from the rifle's, else null (the caller's LABELS then). */
export function wordsOf(action, model) {
  if (!PISTOLS.has(model)) return null;
  return PISTOL_WORDS[action] ?? null;
}
