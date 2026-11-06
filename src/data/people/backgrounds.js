// OLYMPUS data: the backgrounds a person grew up in, weighted by home kind (PEOPLE §3.7).
//
// PEOPLE §3.7's sixteen, each { id, homes, w, lifts, traits, tags, hooks }: homes the home kinds
// (src/data/setting/homes.js) it is drawn for, or 'any' (every home) or 'mars' (every Martian home:
// valley-town, dome, sea-shore and orbital, PEOPLE's "any Mars"); w its weight in the draw for a home
// it fits, BG_W_FIT for one written for that kind and BG_W_ANY for the ones open to any home (my calls:
// a Redwater kid is likelier to have grown up on a valley farm or in its streets than in a church
// family or as an athlete, which any town makes); lifts the skill lifts PEOPLE gives (SKILLS reads them
// at 0.0.6: data only here; an athlete's "fitness +3 or cqc +3" is two choices, one drawn); traits the
// axis bias added after the draw, before clamping; tags the tag weights it multiplies (PEOPLE's
// "`terraformer` ×3"); hooks the arcs and notes PEOPLE names, as words.

/** A background's weight for a home kind it was written for, and for one open to any home (my calls). */
export const BG_W_FIT = 3, BG_W_ANY = 1;
/** PEOPLE §3.7's "any Mars": the Martian home kinds. */
export const MARS_KINDS = Object.freeze(['valley-town', 'dome', 'sea-shore', 'orbital']);

const g = (id, homes, lifts, traits = {}, tags = {}, hooks = []) => Object.freeze({
  id, homes: Object.freeze(Array.isArray(homes) ? homes : [homes]), lifts: Object.freeze(lifts.map(l => Object.freeze(l))),
  traits: Object.freeze(traits), tags: Object.freeze(tags), hooks: Object.freeze(hooks),
});

/** The backgrounds (PEOPLE §3.7). lifts: [[skill, +n]…], or [[[skill, +n], [skill, +n]]] for a choice of one. */
export const BACKGROUNDS = Object.freeze([
  g('terraforming-family', ['valley-town', 'sea-shore'], [['fieldcraft', 2], ['tech', 1]], {}, { terraformer: 3 }, ['water-rights arc']),
  g('ice-hauler-family', ['belt', 'orbital'], [['eva', 2], ['zerog', 2]], {}, {}, ['zero-g at ease']),
  g('dome-apprentice', ['dome'], [['tech', 3]], { drive: 1 }),
  g('lowland-farm', ['valley-town'], [['fitness', 2], ['fieldcraft', 1]], { warmth: 1 }),
  g('redwater-streets', ['valley-town'], [['cqc', 3], ['fieldcraft', 1]], { rules: -1 }, {}, ["knows Redwater's bars"]),
  g('police-family', 'mars', [['awareness', 2]], { rules: 1 }),
  g('navy-brat', ['orbital'], [['eva', 1], ['tech', 1]], {}, {}, ["knows the Navy's ways"]),
  g('university-dropout', ['dome', 'valley-town'], [['tech', 2], ['social', 1]], {}, { bookish: 2 }),
  g('mine-worker', ['dome', 'belt'], [['fitness', 2], ['demolitions', 1]]),
  g('ambulance-trainee', 'any', [['medicine', 3]], {}, { 'mother-hen': 2 }),
  g('church-family', 'any', [['social', 1]], {}, { devout: 4 }, ['faith arc']),
  g('athlete', 'any', [[['fitness', 3], ['cqc', 3]]], {}, {}, ['recon-dreams arc']),
  g('sea-shore-warden', ['sea-shore'], [['marksmanship', 3], ['fieldcraft', 2]]),
  g('belter-dock-hand', ['belt'], [['zerog', 3], ['eva', 1]], {}, {}, ['Lang Belta fluent', 'Belter-blood arc']),
  g('earth-immigrant', ['earth'], [['fitness', 1]], {}, {}, ['one Earth language', 'Earther arc']),
  g('corps-family', 'any', [['marksmanship', 2]], { rules: 1, drive: 1 }, {}, ['legacy pressure']),
]);
