// OLYMPUS data: the scene specs: every start a new game can make, the test scenes each a mechanic built as a playable test the user scores before mechanics are joined (ROADMAP §2.2; the build sheet 0.0.4 §2.2.9; PLACES §9.9; CONTRACTS §21).
//
// A scene is a spec (ROADMAP "anywhere", step 4): { id, title, scenario, host, env, hour, goal, aspects, body,
// outfit, drill?, endOn }. scenario names the fill that builds it (src/sim/game.js SCENARIOS: the barracks at
// the hour, the player at their rack's foot, the range, the bay's turners); host is where it stands, { site,
// area? } (a site of src/data/places/sites.js: the start's clock and longitude are the host's, and the fill
// must enter that site; the generated host { generate: chunkset } comes with the assembler, PLACES §9.9); env
// is its environment, { preset: 'site' } for the host's own (no live override: every shipped scene) or a
// preset of src/data/places/env.js ENV_PRESETS with any of { gravity, air, airC } over it, which newGame sets
// live before the fill (src/sim/places/env.js setLiveEnv), so the fill and every tick read the scene's
// gravity and air; hour is the local hour on the host's clock it starts at (localTime's face: Melas's sol;
// a ship's UTC), a fraction giving minutes, or null for the scenario's own start. The rest is the
// hud's: the goal line it shows for GOAL_S, the aspects the score card asks about ([key, what it is]), the
// body's ledgers set on top of the start body (grime, sweatL, stubbleH, pressureH, bladderMl), the outfit
// worn, a forced alert drill ({ hour }: the night's 02:30, in place of the week's draw), a course of fire
// (course: src/data/courses.js, test-handling's 25 m line, 0.0.5), its setup (test-handling's 'mixed': a
// scene of its own on the same scenario, 0.0.6) and the fact that ends it (the end card, once the strip is
// done; a phase may be a list: the range's 'clear' or 'stopped'; 0.0.7's test-range also 'closed', the range
// closed after a casualty). Scenes sharing a scenario share its host and env (src/sim/game.js specOf checks it).
// 0.0.8's test-pairs (the build sheet 0.0.8 §2.3; COMBAT §25.10.3) plays on a test sheet the start card picks (pairs.js
// testPairs' tier: boot recruit, private, sergeant, Raider, tier one; `sheets` the picker's order, `sheet` its default).
// 0.0.9's test-pairs-bangs, "Three bangs" (the build sheet 0.0.9 §2.2; COMBAT §25.18.3): test-pairs' scenario with its
// setup 'bangs', scored apart on one aspect, the picker opening on the boot recruit (the anchor's first half; "Again as Tier
// one" its second, the sheet's §8 item 21).
// 0.0.10's test-stress, "Bang" (the build sheet 0.0.10 §2.2; COMBAT §25.18.3): five strings at 7 m with the coach's noise in ear
// defenders, on the stress course (src/sim/scenarios/stress.js), scored on three aspects, the picker opening on the boot recruit.
// 0.0.12's test-shoothouse, "Stack and clear" (COMBAT §25.10.4; ROADMAP §4.2's 0.0.7d; the build sheet 0.0.12 §2.6): lane A of
// house 1 in the Wheel's sector 4 (PLACES §4.15: the Wheel is Base Melas's, so its host is the Melas site and its clock the
// sol), its environment the site's own (env { preset: 'site' }: the area carries its 1 G of spin, src/data/places/wheel.js),
// played in the combat EVA suit on the house course (src/sim/scenarios/shoothouse.js) with the movement stances (stances: V
// cycles Relaxed, Combat, Assault here only, the sheet's §8 item 7), the picker's sheets from the boot recruit to the tier one
// and its pars (the instructor's timer: basic, advanced, operator; pars). Its goal line is the picker's, with no blank to
// fill (the fixer's of 0.0.12: the picker showed "{two}"); the scene's toast names your number two (shoothouse.js houseGoal). A stub's spec (built false) is left out of SCENE_IDS (the Tests menu) and refused by
// newGame. STARTS are the two starts that are not test scenes: the career's barracks
// and the sandbox's test rooms (the title and ?play= start them; the Tests menu never lists them).
// v0.0.25's test-zerocqb, "Hold to hold" (its build sheet §1 item 1; ROADMAP §4.2's 0.0.7e): the shoot house's lane on the Wreck at Phobos,
// its own scenario, `ship` (the operation record's one field the lane branches on, a key of src/data/places/ships.js SHIPS), `tug` (the yard tug's pull, set at GO),
// `familiar: 'walls'` (the walls briefed, every compartment unknown until seen; v0.0.28: every combat scene's, the intel) and `menu` (false: played by its URL only, left off the
// Tests menu by main.js scenes(), until its ship rule is met).
// v0.0.26's test-breach, "Bang, then go" (its build sheet §1 item 1; ROADMAP §4.2's 0.0.7f): the house's scenario cut to room 1 with
// the live lane's two role-players in it, `breach` ('drawn': the bang and the held door from the seed; shoothouse.js drawBreach) and
// `newSeed` (the end card's "Again with a new seed" in the scene's words: "Another door"); on the Tests menu since its ship rule was met.
// The hud reads every field; scenes save nothing (the sheet §8, item 24): their scores alone are kept.
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };
// (every shipped scene stands on Base Melas in the site's own environment: v0.0.10's, byte for byte)
const MELAS = { site: 'melas' }, SITE_ENV = { preset: 'site' };

/** The test scenes (see the header). */
export const SCENES = deepFreeze({
  'test-shower': {
    id: 'test-shower', title: 'Ten minutes under the shower', scenario: 'test-shower', host: MELAS, env: SITE_ENV, hour: 19.5,
    goal: 'Filthy after PT. The showers are across the hall, in Head A: R at a free stall.',
    aspects: [['splash', 'the zoom, the fast watch, the strip'], ['vignette', 'the stall, the water, the steam'], ['pace', 'ten minutes in four seconds']],
    body: { grime: 58, sweatL: 0.4, stubbleH: 14 }, outfit: 'utilities',
    endOn: { fact: 'activity', phase: 'end', activity: ['shower', 'dress'] },
  },
  'test-night': {
    id: 'test-night', title: 'The klaxon at 02:30', scenario: 'test-night', host: MELAS, env: SITE_ENV, hour: 21 + 55 / 60,
    goal: 'Taps at 22:00. Sleep until reveille. If the klaxon goes: up, in utilities, at the foot of your rack in five minutes.',
    aspects: [['night', 'the rack and the night going by'], ['klaxon', 'the klaxon and the landing'], ['drill', 'the scramble, the late card, the count']],
    body: { pressureH: 16.4, bladderMl: 250 }, outfit: 'pt', drill: { hour: 2.5 },
    endOn: { fact: 'alert', phase: 'stand-down' },
  },
  'test-handling': {
    id: 'test-handling', title: 'Show clear', scenario: 'test-handling', host: MELAS, env: SITE_ENV, hour: 9.0,
    goal: "The 25 m line, on the tower's commands: make ready, fire your string, clear the stoppage, unload and show clear.",
    aspects: [['steps', 'every action its time and its roll; the stoppage by its steps'], ['shot', 'the plaque, the roll in the log, the hole in the paper'], ['pace', 'quick to drive by keys, never a wall of text']],
    body: {}, outfit: 'utilities', course: 'fam25',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // (0.0.6, the fixer's: setup 'mixed' from the Tests menu, not only by the URL, so the reach and the look have kinds to
  // choose between in a scene the user plays (their "we may have different types of rounds in inventory"); scored apart)
  'test-handling-mixed': {
    id: 'test-handling-mixed', title: 'Show clear, mixed magazines', scenario: 'test-handling', setup: 'mixed', host: MELAS, env: SITE_ENV, hour: 9.0,
    goal: "The 25 m line with a fourth magazine of tracer among the ball, its kind not told: reach, look, and load what the course fires.",
    aspects: [['steps', 'the reach, the look, the choice of magazine'], ['shot', 'the plaque, the roll in the log, the hole in the paper'], ['pace', 'quick to drive by keys, never a wall of text']],
    body: {}, outfit: 'utilities', course: 'fam25',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // (0.0.7: the KD range in full, ROADMAP §4.2's 0.0.7 row (the build sheet 0.0.7 §2.3): the zero, the confirm at 300 m,
  // the 200 m string, the relay beside you; scored on ROADMAP §2.2's three aspects)
  'test-range': {
    id: 'test-range', title: 'The line at 300 m', scenario: 'test-range', host: MELAS, env: SITE_ENV, hour: 10.0,
    goal: "Zero at 25 m in three-round groups, confirm at 300 m with the pits marking, ten rapid sitting at 200 m. The tower's commands, your coach's calls.",
    aspects: [['far window', 'the far window: the face, the marks, the disk'], ['shot at distance', 'the shot at distance: the zero, the wind, the hold'], ['range safety', 'range safety: the tower, the cold line, the declaration']],
    body: {}, outfit: 'utilities', course: 'kd',
    endOn: { fact: 'range', phase: ['clear', 'stopped', 'closed'] },
  },
  // (0.0.8: the take-in and the shot rows on the bay's turners, ROADMAP §4.2's 0.0.7b row (the build sheet 0.0.8 §2.3))
  'test-pairs': {
    id: 'test-pairs', title: 'Pairs', scenario: 'test-pairs', host: MELAS, env: SITE_ENV, hour: 11.0,
    goal: "Five strings at 7 and 10 m on the coach's timer. Wait out of it at low ready; when a target turns, take it in, then your shots. Threats only.",
    aspects: [['turn', 'the turn: the take-in, its time, the brackets and the stamp'], ['shots', 'the shots: the rows, their price, odds and holes'], ['gun', 'the gun: RELOAD when dry, Top up in the lull']],
    body: {}, outfit: 'utilities', course: 'pairs', sheets: ['recruit', 'private', 'sgt', 'raider', 'tierone'], sheet: 'private',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // (0.0.9: "Three bangs", test-pairs with the coach's three bangs behind you in the first standby, ears unprotected: the
  // user's anchor, 2026-11-07, "three flashbangs go off right next to him" (ROADMAP §4.2's 0.0.7c row, its first patch))
  'test-pairs-bangs': {
    id: 'test-pairs-bangs', title: 'Three bangs', scenario: 'test-pairs', setup: 'bangs', host: MELAS, env: SITE_ENV, hour: 11.0,
    goal: 'Three bangs behind you in the first standby, ears unprotected. Then Pairs as built.',
    aspects: [['bangs', "the bangs: does the recruit's hand fail and the tier one's not, as the marine's, not as lag"]],
    body: {}, outfit: 'utilities', course: 'pairs', sheets: ['recruit', 'private', 'sgt', 'raider', 'tierone'], sheet: 'recruit',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // (0.0.10: "Bang", the stress course: ROADMAP §4.2's 0.0.7c row, its second patch (the build sheet 0.0.10 §2.2))
  'test-stress': {
    id: 'test-stress', title: 'Bang', scenario: 'test-stress', host: MELAS, env: SITE_ENV, hour: 11.0,
    goal: "Five strings at 7 m with the coach's noise. Threats down.",
    aspects: [['chaos', "the chaos: do the horn, the blanks and the bangs feel like a fight, as the marine's and not as lag"], ['contrast', 'the contrast: the recruit overwhelmed, the tier one calm, by "Again as …"'], ['hands', 'the hands: the fumbles, the RELOAD and Breathe, fair and readable']],
    body: {}, outfit: 'utilities', course: 'stress', sheets: ['recruit', 'private', 'sgt', 'raider', 'tierone'], sheet: 'recruit',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // (0.0.12: stack and clear on the instructor's GO, ROADMAP §4.2's 0.0.7d row (the build sheet 0.0.12 §2.6): house 1 of the
  // Wheel's sector 4 at 1 G of spin, the area's own; its hour (a morning training block) is my call)
  'test-shoothouse': {
    id: 'test-shoothouse', title: 'Stack and clear', scenario: 'test-shoothouse',
    host: { site: 'melas', area: 'melas.wheel.s4' }, env: SITE_ENV, hour: 10.0,
    // (the house as set or drawn, the picker's House row: "Lane A" named only the set (the play review of 2026-11-16))
    goal: 'The shoot house at 1 G, as set or drawn from the seed, with your number two, on GO: three rooms and the hall. Threats down, no-shoots untouched.',
    // (the card (the build sheet v0.0.20 §1 item 10): six aspects from three, the team, the panel ("if we can make the
    // controls work cleanly", the user, 2026-11-12) and the feel scored apart; the score line names what was played (score.js))
    aspects: [['pause', "the pause: the take-in's feel, the brackets, the stamp, the brake, the log"], ['drill', 'the drill: the flow, the doors, your corner'],
      ['team', 'your number two: in on his cue, his calls, his admin'], ['panel', 'the keys: the panel, its rows, every press'],
      ['shots', 'the shots: the rows, the reloads, both guns'], ['feel', 'the feel: the walk, the sound, the look']],
    body: {}, outfit: 'combatSuit', course: 'house', stances: true, sheets: ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'], sheet: 'private',
    pars: ['basic', 'advanced', 'operator'],
    // (the drawn house (the build sheet v0.0.21 §1 item 1; src/sim/scenes/assemble.js): the house as set (layout A) or drawn
    // from the seed, the picker's row (C's) and &draw=; HOUSE_DRAW_DEFAULT below the page's default)
    draws: ['set', 'drawn'],
    // (the named houses (its build sheet item 14; src/sim/scenes/assemble.js HOUSE_LAYOUTS): A the set, B and C the
    // instructors' other two panel settings, the picker's house row (D's) and &layout=; a named house never qualifies (§0 item 21).
    // The ship rule's switch (§0 "Ship rules"): a layout is listed here only once its nets are green; &layout= plays any of
    // HOUSE_LAYOUTS whatever this says. C waits: at the A and D review its gauges (house-drawn8's case 1 over 25 seeds × 4 bots)
    // left F4 open, the keys private stopping in room 3's door (the L at 17.5) on 8 of 25 lanes; the lead adds it at the ship)
    layouts: ['A', 'B'],
    // (the drawn house's room sets the picker offers (its "Rooms" row, D's): 'a' alone until house-drawn8 is green on the
    // lead's quiet run and the nets' eight-room lanes meet 0 cases (the ship rule), then ['a', 'all']; &rooms=all plays the eight
    // whatever this says)
    rooms: ['a'],
    // (the intel (src/sim/places/known.js familiarOf; the user, 2026-11-17: "we see what is in the rooms before entering them, this
    // should not be the case when we start generating procedurally"; v0.0.28, the user's note of 2026-11-20: "the layout would be
    // known most of the time, unless the scenario justifies the lack of intel"): 'walls', the plan briefed, set or drawn, every
    // room's inside unknown until seen; 'none' only the outside, for a scene whose brief says why. Absent on a scene: every place
    // familiar)
    familiar: 'walls',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // (v0.0.19: "Stack and clear, live", the same lane with two role-players of the cadre in place of stands 2a and 3a, firing
  // marking rounds (the build sheet v0.0.19 §0 item 17, §1 L-house; COMBAT §25.18): the house's fill with opfor 'live'
  // (src/sim/scenarios/opfor.js), scored apart; the stand, host and hour test-shoothouse's (game.js specOf's rule)
  'test-shoothouse-live': {
    id: 'test-shoothouse-live', title: 'Stack and clear, live', scenario: 'test-shoothouse', opfor: 'live',
    host: { site: 'melas', area: 'melas.wheel.s4' }, env: SITE_ENV, hour: 10.0,
    goal: 'Lane A at 1 G with your number two, on GO: two of the rooms hold role-players who fire back. Threats down, no-shoots untouched.',
    aspects: [['men', 'do the role-players read as men: the turn, the fire, the hands, the fall'], ['fight', 'does fire on you interrupt fairly and the stack react'], ['calls', "the instructor's calls: paint on you, a man who gave up, a man covered"]],
    body: {}, outfit: 'combatSuit', course: 'house', stances: true, sheets: ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'], sheet: 'private',
    pars: ['basic', 'advanced', 'operator'],
    // (the live lane is the house as set from the page: its men's posts were authored by room (src/data/places/house-opfor.js), and
    // the page's fill never draws it (shoothouse.js drawnCodeFor) and the picker offers no house row (the build sheet §0 item 13).
    // v0.0.22 (its build sheet's item 15, G5): the chunks carry the posts (scenes/assemble.js postsOf) and the tests' createGame draws
    // a live lane as asked (liveDraw), but the page plays it as set and the picker's house row waits on its ship rule: F80
    // (tests/flawless-end.mjs) is OPEN, F44's band (the tier one painted on 3 of 7 drawn lanes against 5%), so ['set', 'drawn'] when it is MET)
    draws: ['set'],
    // (as test-shoothouse's, the scenario's: the plan briefed, the rooms' insides unknown until seen)
    familiar: 'walls',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // ("Bang, then go" (its build sheet §1 item 1, §3.2; ROADMAP §4.2's 0.0.7f; COMBAT §7.10, §7.11, §25.18.2): room 1 of lane
  // A as set, two role-players of the cadre in it (the live lane's two men, one in each marine's sector, both briefed to fight, so what
  // they do after is COMBAT §7.11's table alone), the bang and the held door drawn from the seed (`breach`: 'drawn', or the URL's
  // &breach=<bang|quiet>,<held|loose>; shoothouse.js drawBreach), the lane ended at room 1's "Clear!". The house's fill with
  // `opfor: 'live'` and `breach` (shoothouse.js testShoothouse's breach branch, which writes R.house.bangGo), the house's host and
  // hour (game.js specOf's rule). Played as set from the page (`draws: ['set']`: every other house option dropped with one toast,
  // core/debug.js breachChoice). `newSeed`: the end card's "Again with a new seed" in this scene's words, "Another door" (a new seed, a
  // new draw). On the Tests menu since its ship rule was met (the build sheet's ship rules: F138 and F147 green))
  'test-breach': {
    id: 'test-breach', title: 'Bang, then go', scenario: 'test-shoothouse', opfor: 'live', breach: 'drawn',
    host: { site: 'melas', area: 'melas.wheel.s4' }, env: SITE_ENV, hour: 10.0,
    goal: 'Room 1 at 1 G with your number two: two role-players inside, who fire back. The bang if you carry one, then go. Put them down or take their surrender.',
    aspects: [['defenders', 'the defenders: can you read their state from the figure and the plaque: dazed, cowering, hands up, back on the door'],
      ['bang', 'the bang: the window it buys, and the cost of a slow stack'], ['hitcard', 'the hit card: belief in the fight, the truth when you search him or at the wash']],
    body: {}, outfit: 'combatSuit', course: 'house', stances: true, sheets: ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'], sheet: 'private',
    pars: ['basic', 'advanced', 'operator'],
    draws: ['set'],
    familiar: 'walls',
    newSeed: ['Another door', 'a new seed, a new draw'],
    // (on the Tests menu, after "Stack and clear, live", from the integration of v0.0.26: its ship rule met, scene-breach,
    // breach-nodead and breach-save (F138) and env-noregress (F147) green in the full run on the merged tree; by URL only until then)
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // (the anywhere round (its build sheet §1 D, §3.4; AW§5): "Anchor before you fire", Well A of the Void Operations School at
  // Phobos, in the site's own environment (0.0006 G: free fall), five stations from the anchor each wants, on the void range's course
  // (src/sim/scenarios/anchors.js); 10:00 on the School's UTC day; the house's sheets; a familiar place (the School's range, briefed:
  // the build sheet §0 item 12), so no `familiar`)
  'test-anchors': {
    id: 'test-anchors', title: 'Anchor before you fire', scenario: 'test-anchors',
    host: { site: 'phobos-void', area: 'phobos.void.well-a' }, env: SITE_ENV, hour: 10.0,
    goal: 'Well A at Phobos, in free fall. Five stations: boots, lanyard, a hand on a hold, the wedge, then one round floating. Anchor before you fire.',
    aspects: [['anchor', 'the anchor: does the footing hold the gun, and do the rows say so'], ['move', 'the move: the boots, the push-off, the drift, the grab'],
      ['pace', 'the pace: each station its time, the move part of it'], ['feel', 'the feel: the well, the float, the sound']],
    body: {}, outfit: 'combatSuit', course: 'anchors', sheets: ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'], sheet: 'private',
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // (the same: "Secure for burn", Testudo's berthing 2 coasting to Phobos for the void week, at 0 G (the coasting deck's
  // preset), the burn's profile drawn by the scene's fill from the seed (src/sim/scenarios/burn.js: the warning 25 to 45 s in, 1 G for
  // 20 s, on half the seeds a surprise jink of 0.4 G), written live with the gravity's events (src/sim/places/gravity.js); 14:00 UTC,
  // my call; no rifle fired aboard (the build sheet's risk 12))
  'test-burn': {
    id: 'test-burn', title: 'Secure for burn', scenario: 'test-burn',
    // (the profile (src/sim/places/gravity.js's: atS the onset, drawn in whole seconds from the seed): the burn's onset 40 to 60 s in, so
    // the 1MC's warning, warnS 15 s before it, comes 25 to 45 s in (AW§5); 1 G for 20 s; then, on half the seeds, a surprise jink of
    // 0.4 G across the compartment toward the south bulkhead (dirDeg 90), after the burn's off ramp is done (its onset by 60 + 2 + 20 + 2 s))
    // v0.0.25's burn polish (the user's score of 2026-11-19: "mag boots won't save you from a 3G sideways maneuver"): on every seed a
    // warned evasive manoeuvre after the burn, 3 G to port (dirDeg 90, the south bulkhead: onemc.js dirOf) for 2 s, in at 3 G/s, the
    // 1MC's warning 10 s before it (so 85 to 90 s in, after the burn is done by 84 s): over the boots' hold across the deck
    // (needs.js GRAV_BODY.BOOTS_SHEAR_G 1.0 G), so only a marine strapped in his rack rides it. Listed third, so the surprise keeps its
    // draw (profile.js drawProfile's stream(seed, 'grav', k) by the list's index: the same seeds have it); the surprise moved to 115 to
    // 130 s, after the manoeuvre (done by 100 + 1 + 2 + 1 s), its chance roll unchanged (the stream's second draw)
    host: { site: 'mcrn-testudo', area: 'testudo.deck-b.berth-2' }, hour: 14.0,
    env: { preset: 'ship-coast', profile: [{ kind: 'burn', toG: 1.0, atS: [40, 60], warnS: 15, holdS: 20 }, { kind: 'jink', toG: 0.4, atS: [115, 130], surprise: true, chance: 0.5, dirDeg: 90 }, { kind: 'jink', toG: 3.0, atS: [95, 100], warnS: 10, onsetGs: 3, holdS: 2, dirDeg: 90 }] },
    goal: 'Testudo, coasting to Phobos, at 0 G. Stow your three items in your locker. Then heed the 1MC: boots hold you through a burn, only your rack\'s straps through a hard manoeuvre.',
    aspects: [['warning', 'the warning: the siren and the 1MC, read in time'], ['fall', 'the fall: a body thrown, felt and shown'], ['feel', 'the feel: the berth, the float, the sound']],
    body: {}, outfit: 'utilities',
    endOn: { fact: 'burn', phase: ['done'] },
  },
  // ("Hold to hold" (its build sheet §1 item 1, §3.3; ROADMAP §4.2's 0.0.7e; COMBAT §14.5, §14.8): the shoot house's lane on the
  // Wreck at Phobos (PLACES §5.7), its two decks one authored area of the void site, at the site's own free fall, with your number two on
  // mag boots: the brig's two cells, the trunk head first in his grip, the hold and its store. Its own scenario (game.js specOf refuses one
  // scenario at two hosts: the house's stands in the Wheel), whose fill is the house's on the Wreck's row of the ships' registry (shoothouse.js testZerocqb);
  // the house's course, so the house's tower, card, pars and bots play it. `tug` the yard tug's pull set at GO (the scene's env carries no
  // profile: one in env is drawn at the fill, its t0 the start): its onset (`atS`) 60 s after GO, the warning 15 s before, 0.2 G for 3 s
  // toward the deck. The window is the build sheet's [60, 150] brought in to the honest tier one's lane less 30 s and never under 60 (§1
  // item 10): his lane on 48213 is 83.3 s (73.3 s on 1111, the fastest of the four seeds' honest lanes, 24 of 24 to the card), so its upper
  // bound is 60 too; [lo, hi] kept, so a slower lane after a change of the drill widens it again by this rule.
  // `familiar: 'walls'`: the walls briefed, every compartment black until seen (PC§4). `menu`: on the Tests menu once its ship rule is met
  // (zerocqb-nodead and F124 green); false is by URL only (main.js scenes())
  'test-zerocqb': {
    id: 'test-zerocqb', title: 'Hold to hold', scenario: 'test-zerocqb', ship: 'wreck',
    host: { site: 'phobos-void', area: 'phobos.void.wreck' }, env: SITE_ENV, hour: 10.0,
    goal: 'The Wreck at Phobos, in free fall on mag boots, with your number two, on GO: the brig, the trunk, the hold. Anchor before you fire. Threats down, no-shoots untouched.',
    aspects: [['anchor', 'the anchor: does the footing hold the gun, and do the rows say so'], ['faces', 'the faces: a compartment with no floor, read from above'],
      ['pace', 'the pace: the boots, the hatches, the pars'], ['team', 'your number two: his grip in the hatch, his face, his calls'],
      ['panel', 'the keys: the panel, its rows, every press'], ['feel', 'the feel: the boots, the hatch, the look']],
    body: {}, outfit: 'combatSuit', course: 'house', sheets: ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'], sheet: 'private',
    pars: ['basic', 'advanced', 'operator'],
    // (the Wreck is shot as set, with the standard kit: no drawn house, no layout, no role-players (§1 item 1))
    draws: ['set'],
    tug: { kind: 'burn', toG: 0.2, atS: [60, 60], warnS: 15, holdS: 3 },
    familiar: 'walls',
    // (on the Tests menu, last, from the integration of v0.0.25: its ship rule met, zerocqb-nodead (F125) and env-noregress (F124) green
    // in the full run on the merged tree; by URL only (`menu: false`) until then)
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
  // ("Away the boarding party" (v0.0.27, its build sheet §1 D, item 1; ROADMAP §4.2's 0.0.7g; COMBAT §14.1 to §14.6): the first live
  // fight, deck 2 of the Belt ice hauler Patient Mule coasting at 0 G, you the boarding team's #3 in a fire team of four, through the
  // mated collar's lock on an override, armed men who choose and some of the crew, live rounds both ways. Its own scenario (game.js specOf:
  // one host a scenario), the house's fill on the hauler's row of the ships' registry (shoothouse.js testCollar), the house's course, so
  // the house's tower, card and bots play it. `holdouts` the URL's &holdouts= ('pirates' | 'smugglers'; drawn from the seed when absent).
  // No par tones on a real deck (`pars` none: the run sheet keeps every time), no other house (`draws` the set), the compartments black
  // until seen (`familiar: 'walls'`), "Another hauler" (`newSeed`: the end card's second line). On the Tests menu, last, after "Hold to
  // hold" (the ships together; question 18), from the integration of v0.0.27: its ship rule met, F150, F153, F155 and F165 green in the
  // full run on the merged tree (F157 and F167 red there, a question for the user with their figures, not the ship rule's); by URL only
  // (`menu: false`) until then
  'test-collar': {
    id: 'test-collar', title: 'Away the boarding party', scenario: 'test-collar', ship: 'hauler',
    host: { site: 'belt-mule', area: 'mule.crew' }, env: SITE_ENV, hour: 10.0,
    goal: 'The Belt ice hauler Patient Mule, coasting, its crew struck. Deck 2 did not answer. You are the boarding team\'s number three: through the lock on the override, then the deck. Armed men are aboard, and some of the crew. Secure the deck, or fall back to the lock.',
    aspects: [['fight', 'the fight: men who choose, cover, fire blind, freeze, flee or give'], ['cost', 'the cost: real wounds both ways, the knock, the tourniquet'],
      ['team', 'the team: the leader and the AR on the passage, Four with you'], ['ship', 'the ship: the lock, the hatches, the boots, the deckhead'],
      ['pace', 'the pace: the override, the send, the compartments'], ['feel', 'the feel: the Belter deck, the bubbles, the card']],
    body: {}, outfit: 'combatSuit', course: 'house', sheets: ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'], sheet: 'private',
    pars: [],
    draws: ['set'],
    familiar: 'walls',
    newSeed: ['Another hauler', 'a new seed, new holdouts'],
    endOn: { fact: 'range', phase: ['clear', 'fellBack', 'down', 'stopped'] },
  },
  // ("The window and the canopy" (its build sheet item 1, §0 item 19; ROADMAP §4.2's 0.0.8; PLACES #15): Base Melas's armoury at 07:50 on
  // the sol, the range's course engine with the course 'armoury' (src/sim/scenarios/armoury-day.js): your R-7 drawn by serial at window 1 and shown
  // clear, the serials in the rank, twenty rounds by count, the relay as its outcome, the lane's show clear and brass, the declaration, the canopy's
  // cleaning against the leader's ten-thirty, the barrel and the armourer's inspection. The picker's five sheets, the private first; "Another day"
  // a new seed. By its URL only (`menu: false`) until its ship rule (F170, F171, F179 and F181 green on the lead's quiet run), then last on the
  // Tests menu, after "Away the boarding party"
  'test-armoury': {
    id: 'test-armoury', title: 'The window and the canopy', scenario: 'test-armoury', host: MELAS, env: SITE_ENV, hour: 7 + 50 / 60,
    goal: 'Draw your rifle by serial and show it clear, draw your rounds by count, then the canopy and the window: clean it, turn it in.',
    aspects: [['window', 'the window and the count: the card, the serial, the show clear, the issue, the declaration'], ['cleaning', 'the canopy: rushed, normal or careful, its time and its roll'],
      ['inspection', "the armourer's eye: passed, or clean it again"]],
    body: {}, outfit: 'utilities', course: 'armoury', sheets: ['recruit', 'private', 'sgt', 'raider', 'tierone'], sheet: 'private',
    newSeed: ['Another day', 'a new seed, a new draw'],
    menu: false,
    endOn: { fact: 'range', phase: ['clear', 'stopped'] },
  },
});

/**
 * "Stack and clear"'s house when the page names none (the picker's first choice and a URL with no &draw): 'set' (layout A), until
 * the ship rule flips it to 'drawn' (the build sheet v0.0.21's ship rules: house-drawn green on 100 drawn lanes and the user's yes to
 * question 3). The tests' house is 'set' whatever this says (tests/game.mjs createGame's draw).
 */
export const HOUSE_DRAW_DEFAULT = 'set';
/**
 * A drawn house's rooms when the page names none (its build sheet item 14, §0 item 40: the picker's "Rooms" row and a drawn
 * URL with no &rooms): 'a', layout A's three (the centre, the corner and the L), until the ship rule flips it to 'all', X4's eight
 * (house-drawn8 green on the lead's quiet run, the nets' eight-room lanes at 0 cases, and the user's yes to question 4). The tests'
 * rooms are 'a' whatever this says (tests/game.mjs createGame's rooms).
 */
export const HOUSE_ROOMS_DEFAULT = 'a';

/** The scenes the Tests menu lists, in its order: every built one (a stub's spec waits for its layout). */
export const SCENE_IDS = Object.freeze(Object.keys(SCENES).filter(id => SCENES[id].built !== false));

/** The starts that are not test scenes: the career's barracks and the sandbox's test rooms, each in its host's own environment. */
export const STARTS = deepFreeze({
  barracks: { id: 'barracks', title: 'New career', scenario: 'barracks', host: MELAS, env: SITE_ENV, hour: null },
  sandbox: { id: 'sandbox', title: 'The test rooms', scenario: 'sandbox', host: { site: 'test' }, env: SITE_ENV, hour: null },
});
