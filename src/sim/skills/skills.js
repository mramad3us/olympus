// OLYMPUS sim: skills, the sixteen of SKILLS §2.2, a skill's value, and the one pace helper (SKILLS §3, §5.12, §5.13; the build sheet 0.0.5 §2.2).
//
// No attributes, only skills and the class's over-skill (tradecraft's model, kept). A skill on a sheet
// is [base, bg]: the trained base 0 to 20 (BASE_MAX) and the background points 0 to 4 (BG_MAX, the
// sheet's ◆, which never fade); the over-skill (Warfighting for a soldier, 0 to 100) multiplies each
// skill by the class's weight for it (SKILLS §4.2: the core four at 1, fitness at 0):
//     own(sheet, k)   = min(OWN_MAX 23, base + bg)
//     value(sheet, k) = round(own × (1 + wf × os / 100))
// so a master's base with four points under a full Warfighting reaches 46, tradecraft's top. Rust
// (SKILLS §7) and fitness's weekly band (§8) come with their rounds: no sheet carries them yet, and
// fatigue is a named modifier from BODY's needs, never folded into the value (SKILLS §3: "so it shows
// in the log like everything else"). value() is the one helper: every screen, roll and decision reads it.
//
// paceOf(v) = max(0.45, 1.6 / (1 + v / 16.7)) is the one helper for how long skilled work takes
// (SKILLS §5.12: tradecraft's Medicine pace with its floor lowered; base times are at value 10, pace
// 1.00): 1.60 at 0, 1.36 at 3, 1.23 at 5, 1.13 at 7, 1.00 at 10, 0.93 at 12, 0.84 at 15, 0.73 at 20,
// 0.64 at 25, 0.57 at 30. It lives here and nowhere else (tests/syntax.test.mjs fails on any other
// function or constant with pace as a word of its name), so no owner grows a curve of its own.
// mitigated(base, v, fullAt, keepK) is SKILLS §5.13's: a penalty a trained hand wears down, never
// below keepK of itself (gloves at EVA 12: −4 becomes −2).
//
// Ported from tradecraft v0.2.0-rc3 src/sim/skills.js (56 lines): its SKILLS and CLASSES shapes and its
// skill() formula, with SKILLS' changes: [base, bg] for [base, practice], OWN_MAX, the weights of
// SKILLS §4 (tradecraft's soldier had "weights: {}"), strain removed, the pace helper added.
// Pure.

/** A skill's trained base, its background points and their sum at most (SKILLS §3). */
export const BASE_MAX = 20, BG_MAX = 4, OWN_MAX = 23;

const sk = (name, uses, wf, about) => Object.freeze({ name, uses: Object.freeze(uses), wf, about });
/** The sixteen skills (SKILLS §2.2): name, the body's uses (BODY maps conditions onto them), the Warfighting weight, what it covers. */
export const SKILLS = Object.freeze({
  marksmanship: sk('Marksmanship', ['eyes', 'arms', 'breath'], 1, 'Putting rounds where you mean them.'),
  weapons: sk('Weapon handling', ['hands', 'eyes'], 1, 'Everything done to a weapon.'),
  cqc: sk('Close combat', ['all'], 0.8, 'Unarmed, knife, bayonet, the rifle butt, holds.'),
  fieldcraft: sk('Fieldcraft', ['legs', 'eyes'], 1, 'Moving unseen, cover, navigation, living outdoors.'),
  awareness: sk('Awareness', ['eyes', 'ears', 'head'], 1, 'Noticing.'),
  tactics: sk('Tactics', ['head'], 0.8, 'Reading and shaping a fight.'),
  leadership: sk('Leadership', ['voice', 'head'], 0.6, 'Getting people to act under stress.'),
  social: sk('Social', ['face', 'voice', 'head'], 0.2, 'Reading people and working them.'),
  comms: sk('Comms', ['hands', 'voice', 'head'], 0.4, 'Radio and datalink procedure.'),
  tech: sk('Tech', ['hands', 'eyes', 'head'], 0.2, 'Machines and systems, damage control.'),
  medicine: sk('Medicine', ['hands', 'eyes', 'head'], 0.4, 'First aid through combat casualty care.'),
  eva: sk('EVA', ['hands', 'head'], 0.5, 'Suit work.'),
  zerog: sk('Zero-g', ['arms', 'legs'], 0.5, 'Free fall and very low g.'),
  demolitions: sk('Demolitions', ['hands', 'head'], 0.4, 'Explosives.'),
  driving: sk('Driving', ['hands', 'eyes', 'head'], 0.3, 'Ground and ice vehicles.'),
  fitness: sk('Fitness', ['legs', 'torso', 'breath', 'arms'], 0, 'The trained body.'),
});
/** The skill keys in SKILLS §2.2's order (a sheet is drawn in it). */
export const SKILL_KEYS = Object.freeze(Object.keys(SKILLS));

/** The classes and their over-skills (SKILLS §4.1); a soldier's weights are each skill's wf. */
export const CLASSES = Object.freeze({
  soldier: Object.freeze({ name: 'Soldier', overskill: 'Warfighting' }),
  civilian: Object.freeze({ name: 'Civilian', overskill: null }),
});

/** A skill's trained level in words (SKILLS §2.3: tradecraft's TRAINED steps as bands). */
export const LEVELS = Object.freeze([[20, 'master'], [15, 'expert'], [10, 'advanced'], [5, 'course'], [0, 'untrained']]);
export const levelOf = (base) => LEVELS.find(([lo]) => (base ?? 0) >= lo)?.[1] ?? 'untrained';

/** A skill's weight for a sheet's class: the soldier's wf, nobody else's this round. */
export const weightOf = (sheet, k) => (sheet?.cls === 'soldier' ? SKILLS[k]?.wf ?? 0 : 0);

/** A sheet's own points in a skill: base + bg, at most OWN_MAX (a missing skill reads [0, 0]). */
export function own(sheet, k) {
  const [base = 0, bg = 0] = sheet?.skills?.[k] ?? [];
  return Math.min(OWN_MAX, base + bg);
}

/** A skill's value on a sheet (see the header): round(own × (1 + wf × os / 100)). */
export const value = (sheet, k) => Math.round(own(sheet, k) * (1 + weightOf(sheet, k) * (sheet?.os ?? 0) / 100));

/** The one pace helper (SKILLS §5.12): how long skilled work takes at a value, × its base time at value 10. */
export const paceOf = (v) => Math.max(0.45, 1.6 / (1 + (v ?? 0) / 16.7));

/** A situational penalty worn down by a skill (SKILLS §5.13): round(base × max(keepK, 1 − v / fullAt)). */
export const mitigated = (base, v, fullAt = 24, keepK = 0.15) => Math.round(base * Math.max(keepK, 1 - (v ?? 0) / fullAt));

/** A skill's name in words ('Weapon handling'). */
export const skillName = (k) => SKILLS[k]?.name ?? k;
