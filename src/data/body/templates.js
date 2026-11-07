// OLYMPUS data: the body templates, the resting values a body record leaves out (BODY §2.5; TECH §6.6, rule 2; the build sheet 0.0.4 §3).
//
// A body is saved as its deltas from its build's template: `{ v, tmpl, …what differs }`. The template
// is a marine at reveille after a standard night on the Plan of the Day: the reference sol's own
// steady state at a training sol's reveille (src/data/body/sol.js lived for weeks, body-sleep prints
// it; the sheet §3's first numbers in brackets where they moved): the gut empty since about 21:35 (7.9
// h; emptyH, the night counted at a quarter, 2.0 [1.7]), dinner 12.7 h ago [12.1], the reserve
// balanced, a little dry from the night (−0.2 L [−0.3]), the night's 160 mL in the bladder [380: the
// last head is at 21:45], yesterday's food in the bowel (180 g) and in transit (100 g [250]: τ 18 h of
// a 2,800 kcal sol), a day's grime since the morning shower after PT (32, clean [8]), a day's
// stubble, the hands washed at the basin at 21:45 and a night's slow dirt on them since (0.0.6:
// dirt 5, the reference sol's own at reveille, body-hands; why null, the slow rate alone), a cut a
// day old (0.0.6: hair.h 24 hours, cut the day before shipping, so a new join starts fresh), the
// night's sleep pressure all but cleared (0.5, the sheet's: a rested marine; the reference week
// settles at 1.1 to 1.7, body-sleep), the body clock on the site's mean solar time,
// stamina full, the stress of a new morning, morale steady, the core at 37 °C. `traits` are the
// reference ones; a generated person draws their own at the first read (stream('body', seed, pid,
// 'traits'), BODY §2.5). sex, heightM, build and ageY stand in for the person's when the record does
// not say (the sandbox's player has no roster entry).
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

const ledgers = (more = {}) => ({
  energy: { gutKcal: 0, reserveKcal: 0, emptyH: 2.0, emptyForH: 7.9, ateAgoH: 12.7, stoolK: 0.06, waterK: 0.0003 },
  water: { balanceL: -0.2, gutL: 0 },
  bladder: { ml: 160 },
  bowel: { g: 180, transitG: 100, reflexUntilMs: null },
  hygiene: { grime: 32, stubbleH: 24, wetUntilMs: null, sweatL: 0 },
  hands: { dirt: 5, why: null },
  hair: { h: 24 },
  sleep: { pressureH: 0.5, offsetH: 0, bed: null, sinceMs: null, fallMs: null, wokeMs: null, depthK: 1, berthNights: 12, inertia: null },
  stamina: 100, blown: false,
  stress: { v: 10 },
  morale: { v: 70 },
  thermal: { coreC: 37.0 },
  traits: { sleepNeedH: 8.0, tauIntH: 24.2, bmrK: 1.0 },
  ...more,
});

/** The templates by id (BODY_TMPL in src/data/people/looks.js names them by sex). */
export const TEMPLATES = deepFreeze({
  'm-adult': { sex: 'm', heightM: 1.78, build: 'medium', ageY: 21, ...ledgers() },
  'f-adult': { sex: 'f', heightM: 1.66, build: 'medium', ageY: 21, ...ledgers() },
});
/** The template a record without one reads. */
export const DEFAULT_TMPL = 'm-adult';
/** The ledger groups a record may hold (the rest of a record is v, tmpl, heightM, build, atMs, held). */
export const GROUPS = Object.freeze(['energy', 'water', 'bladder', 'bowel', 'hygiene', 'hands', 'hair', 'sleep', 'stress', 'morale', 'thermal', 'traits']);
/** The scalar ledgers kept at the record's top level. */
export const SCALARS = Object.freeze(['stamina', 'blown']);
