// OLYMPUS core: the debug handle and the test parameters.
//
// window.__olympus is how tests, shots and a curious developer drive the game from outside
// (tradecraft's window.__tradecraft; TECH §15.2):
//   state              the live state (a getter: it follows loads)
//   version            the game's VERSION
//   step(n, input)     n ticks now, paused or not, with a partial input ({ mx: 1 } is enough), the
//                      same input every tick (an act given here fires n times: step(1, …) for one)
//   start(state|json)  play this state (a save's JSON, or a state object): a promise of the state
//   newGame(opts)      a new career (opts as src/sim/game.js newGame: { seed, mode, scenario, hour }),
//                      played at once: a promise of the state
//   save(slot?)        the state's JSON; with a slot, also written there (a promise of the JSON). A
//                      bare name ('auto', 'manual-3') is the state's own world's; one holding a ':'
//                      is taken as it is
//   load(json|slot)    a JSON save (now), or a slot ('auto' by default, in the state's world: a promise)
//   skip(ms, { what }) time passing in an activity (the sim's skipNow: activity what, 'idle' by
//                      default, mask D), with its skip-end report
//   pause(on)          pause or carry on (a pause reason of its own, 'debug')
//   events()           the queue in its order, each with its time on the live site's clock (main.js
//                      gives the sim's dates.js solText: core can't import SETTING's years) and in UTC
//   report()           a bug report of the state now: the page's own (main.js gives the builder its
//                      menu's Report a problem uses, so both carry the anchor, the renderer, the
//                      engine, the screen and the density: a promise), else the store's reportOf
//   view               the stage's numbers (the view's stats, with idle and pending), or null
//   act(action)        an action into the sim (a string or { act, args }): queued for the next tick
//                      the loop runs, or, while it is paused, run at once in a tick of its own
//   activity(id, spotId, args)  an activity begun at a spot (time's action { act: 'activity', args:
//                      { id, spotId, args } }: the late card's and the choices card's way in), by act()
//   drill(ms)          the alert drill forced to sound at ms tonight (the debug action
//                      debug:drill:<ms>, which marks the save), by act()
//   body()             the player's body record and its stages now (main.js gives BODY's readers:
//                      { body, stages, strip, words, cues })
//   instinct()         the instinct's line, chip and keys now (SKILLS' instinctNow), and the parts the
//                      HUD shows
//   splash()           the running splash, its plan, phase and shown clock (hud/splash.js), or null
//   scores()           the scores kept in this browser (localStorage['olympus.scores'])
//   gun()              the gun the player holds or slings: { id, truth (its record), belief (arms'
//                      beliefOf: what the HUD may show) }, or null (the build sheet 0.0.5 §2.4)
//   steps()            the step panel now: { steps (the shot role's stepsOf), slots (the digits as the
//                      panel numbers them), text (as shown) }, or null outside stop motion
//   plaque()           the plaque now: { rec (plaqueOf's record for the target shown), words, parts }
//   range()            the range session now (the shot role's rangeNow), or null; on test-range (0.0.7) its
//                      record carries, unenumerated, kd() (range.js kdNow: the stages, groups, strings, pits,
//                      the coach's call, the relay, brass, the declaration, the casualty) and nd(who) (a
//                      negligent discharge forced from your rifle toward a person id or { x, z }: range.js
//                      forceNd, the build sheet 0.0.7 §6 item 7); and far() the far window (farPointOf, its
//                      place, the stage's farState)
//   stop()             stop motion now (the shot role's stopNow: mode, phase, pick, aim, doing, reflex)
//   pairs()            test-pairs now (0.0.8: the scene's pairsNow: the sheet, the line, the string, the turners, the papers,
//                      the card, the summary), or null off the pairs course
//   contact()          the contact now (0.0.8: contact.js contactNow: the window pending, its k, the last pause, its take-in,
//                      its identification and words), and what the page draws of it (the brackets, the stamp, the plate)
//   supp()             (main.js's, 0.0.9) the chaos now: supp.js suppNow, hardParts, inocOf, and what the page makes of it (the
//                      picture's chaos, the bangs drawn, the FROZE stamp, the sound's mix)
//   stress()           (main.js's, 0.0.10) "Bang" now: the scene's stressNow and stressLook (the coach, the horn, the blanks, the
//                      bangs), the hit card as shown (its string, turner, phase, words and drawn marks), the din as drawn, the din's
//                      sound, Breathe's offer and whether it runs; null off the stress course
//   menu()             R held's menu now (places' handMenu: { title, spotId, fixtureId, quick, rows }), or
//                      null; and the card open, if it is: { …, card: { text, cursor, checked, picks } }
//                      (the build sheet 0.0.6 §2.3)
//   hands()            the player's hands: { dirt, why, band, words, k } (BODY's ledger and its stage)
//   hair()             the player's hair: hairOf's { cut, word, h, sols, mm, step, band, dueDay, … }
//   loop, bus, sim     the machinery, for tests that listen
// and what main.js adds through more (property descriptors, so getters stay getters), since core
// may not import the sim (TECH §2.2): area (the live area's id), go(area, x, z, face) (the debug
// action debug:go, which marks the save), door(id, to) (the door action), actors() (each actor with
// its person's name, posture, outfit and whether you see them), light(x, z) (places' lightLevel
// now), sun() (sunAt now), sightMask() (people's, for the player now), offer() (R's offer now),
// audio (the sound's stats), hud (the HUD's lines: the watch, the instinct's line, the toasts, the
// splash's plaque, ticker and strip), scene (the test scene playing: its id, seed, whether it has
// ended) and world (the world's sounds: the water, the tap, the flushes, the klaxon's whoops, the
// bugle, the splash's muffle and ticks). window.__ready turns true once the page has drawn its frames
// with nothing pending (main.js), so a test or a shot knows the page is up.
//
// URL parameters skip the title for tests and shots (main.js reads them through readParams()):
// ?play=<scenario>&seed=<n>&hour=<h>[&mode=ironman][&debug=1][&setup=hot|bench|mixed][&tier=recruit|private|cpl|sgt|raider|tierone]
// [&par=basic|advanced|operator] (0.0.12: test-shoothouse's par, else the sheet's own; its setups go, room:2, room:3, hall, contact)
// [&loadout=standard|flash|breach|full|v1~…] (0.0.18: test-shoothouse's loadout, one for every sheet; main.js drops an unknown one)
// [&opfor=none|live|live:<2a card>,<3a card>] (0.0.19: test-shoothouse's role-players, the cards fight, give or hide; ?play=test-shoothouse-live is 'live')
// [&breach=<bang|quiet>,<held|loose>] (v0.0.26: ?play=test-breach's draw, "Bang, then go": the bang issued or not, room 1's door held or
// not; either part '*' or left out is drawn from the seed (src/sim/scenarios/shoothouse.js parseBreach, drawBreach); the scene's own is
// 'drawn'. Its house options, kit and role-players are dropped with one toast (breachChoice below), every setup but 'go' too; on any
// other scene &breach itself is dropped with its own toast, "&breach is Bang, then go's." (breachOnly))
// [&draw=set|drawn] [&house=<code>] [&doors=fixed] (test-shoothouse's house, as set (layout A, the default) or drawn from the
// seed (src/sim/scenes/assemble.js); &house a drawn house's code, its layout part alone ('Cn290pc.Ks206lc.En175pc', the cast then
// drawn from &seed) or whole (with '|f…|p…'), which implies drawn; &doors=fixed the chunks' authored swings, every door closed)
// [&rooms=a|all] [&layout=A|B|C] [&plans=derived] (the build sheet §2 step 3: a drawn house's rooms, the three of layout A
// (the default, scenes.js HOUSE_ROOMS_DEFAULT) or all eight of X4, &rooms=all alone implying drawn; a named house, A the set and B or
// C the instructors' other two panel settings; the room plans derived by combat/derive.js at the fill, a lead's switch. main.js sets
// their precedence (&layout over &house over &rooms) and drops a loser with a toast; here only the form)
// (tier: test-pairs' sheet, TECH §15.3; else null, the scene's private), hour being the Mars local hour at the
// start (0-24, a fraction giving minutes), seed a whole number; &area=<id>&at=<x>,<z>&face=<f> a
// start somewhere else than the scenario's (the barracks' berth): an area, a place in its frame in
// metres, a facing (up, down, left, right); setup test-handling's start or test-range's ('confirm', 's200',
// 'far': the build sheet 0.0.7 §2.3; test-pairs' 'standby[:k]', and 0.0.9's 'bangs' and 'bangs:standby'; 0.0.10's test-stress takes 'standby' and 'standby:1' to 'standby:4', string k's standby, 'standby:4' with the one-round magazine in); &flashes=reduced (VIEWS
// §12: a bang's white a grey veil, no startle's pale frame); for test-handling ('hot': string 1 in Condition 1,
// prone, the line hot, aimed at your card; 'bench': the same with one magazine of 15, the build sheet
// 0.0.5 §2.2's fill; 'mixed', 0.0.6: the course from its brief with a fourth magazine, of tracer); &env=<preset> (ROADMAP
// "anywhere" step 2: any scene under a named environment, src/data/places/env.js ENV_PRESETS, such as ship-1g, wheel (the Wheel's 1 G),
// earth-temperate, europa-surface, ship-coast or freefall-vacuum: the sim's newGame sets it live on the scene's host before the fill, and
// an unknown name throws there, core knowing no preset); &grav=burn:1.0@40s~15 (v0.0.24, ROADMAP "anywhere" step 6: a ship's gravity events on
// any scene, a test parameter, src/sim/places/gravity.js parseGrav: kind:toG@atSs[~warnS][^onsetGs][+holdS][!] (! a surprise), several by ','); and for the stage &mood=<name>, &fog=1, &nostore=1 (IndexedDB neither read nor written: shots, benches,
// agents' smoke runs), &perf=1 (the GL counters and pass times) and &sound=old (v0.0.15's sound, to compare: 0.0.16); v0.0.20's &shot=A0..A4 (the
// shot's candidate, every scene; A5 from v0.0.24) and &look=stack:4+5,helm:r1,jamb:m2 (the To score
// page's picks, runtime only: state.$look), each winning over the page's kept picks. ?bench=<scene> (or ?bench=1, the
// default scene) runs the bench card (main.js; src/data/bench.js holds the scenes).
import { toJSON, fromJSON } from './state.js';
import { NO_INPUT } from './loop.js';
import { sorted } from './queue.js';
import { utcText, marsTimeText } from './calendar.js';

export const FACES = Object.freeze(['up', 'down', 'left', 'right']);
/** (0.0.10: test-stress's setups are 'standby' and 'standby:<k>', test-pairs' names: the list holds them already.) test-handling's setups (the build sheet 0.0.5 §2.2; 'mixed', the 0.0.6 arms role's: one tracer magazine besides the ball); test-range's (0.0.7 §2.3: 'confirm' zeroed at the 300 m line, 's200' sitting at the 200 m line, 'far' the range-far bench's); test-pairs' (0.0.8: 'standby' and 'standby:<k>', string k's standby, out of the mode at low ready on safe, the turn armed; 0.0.9: 'bangs', "Three bangs" from its brief, and 'bangs:standby', its first string's standby with the bangs planned). */
export const SETUPS = Object.freeze(['hot', 'bench', 'mixed', 'confirm', 's200', 'far', 'standby', 'standby:1', 'standby:2', 'standby:3', 'standby:4', 'bangs', 'bangs:standby',
  // (0.0.12: test-shoothouse's, the build sheet 0.0.12 §2.3: at GO in stop motion, at room 2's or room 3's door or the hall's last leg with the rooms
  // before it cleared by the tier one's plan on the same draws, and room 1 at the sighting with the private's window open)
  'go', 'room:2', 'room:3', 'hall', 'contact',
  // (test-anchors', "Anchor before you fire": station k's command given, the stations before it set up (scenarios/anchors.js ANCHORS_SETUPS))
  's1', 's2', 's3', 's4', 's5',
  // (test-zerocqb's, "Hold to hold" (scenarios/shoothouse.js WRECK_SETUPS, with 'go'): stacked on the trunk with both cells
  // cleared, on the hold's deckhead after the transit, at the yard tug's warning)
  'trunk', 'hold', 'tug']);
/** test-shoothouse's pars by the URL (&par=: the build sheet 0.0.12 §4's PAR_MS names); else null, the sheet's own (PAR_OF_TIER). */
export const PARS_URL = Object.freeze(['basic', 'advanced', 'operator']);
/** test-shoothouse's role-players by the URL (&opfor=: 0.0.19, "Stack and clear, live"): 'none', 'live', or 'live:' and two cards (fight, give, hide); else null, none. */
export const OPFOR_URL = /^(none|live(:(fight|give|hide),(fight|give|hide))?)$/;
/** "Bang, then go"'s draw by the URL (&breach=: v0.0.26): 'drawn', or '<bang|quiet>,<held|loose>', either part '*' or empty (drawn), the door's part may be left out; else null, the scene's own ('drawn'). */
export const BREACH_URL = /^(drawn|(bang|quiet|\*)?(,(held|loose|\*)?)?)$/;
/** test-shoothouse's house by the URL (&draw=: v0.0.21, the drawn house): 'set' (layout A) or 'drawn' (from the seed); else null, the scene's default. */
export const DRAWS_URL = Object.freeze(['set', 'drawn']);
/** A drawn house's code by the URL (&house=: the form only, three rooms and the cast's parts; scenes/assemble.js parseHouse reads and checks it). */
// (a room's letter any of X4's eight chunks', C, K and E and the build sheet's W, D, O, T and Q (§5), so an eight-room code
// reaches parseHouse, which refuses a letter its chunks do not have)
export const HOUSE_URL = /^[CKEWDOTQ][nsm0-9plcok]{4,7}\.[CKEWDOTQ][nsm0-9plcok]{4,7}\.[CKEWDOTQ][nsm0-9plcok]{4,7}(\|f[tnah]{6})?(\|p[0-3]{6})?$/;
/** The doors of a drawn house by the URL (&doors=fixed: the chunks' authored swings, every door closed). */
export const DOORS_URL = Object.freeze(['fixed']);
/** A drawn house's rooms by the URL (&rooms=): 'a', layout A's three (the centre, the corner and the L), or 'all', X4's eight. */
export const ROOMS_URL = Object.freeze(['a', 'all']);
/** A named house by the URL (&layout=): 'A' the set, 'B' and 'C' the instructors' other two panel settings (assemble.js HOUSE_LAYOUTS). */
export const LAYOUTS_URL = Object.freeze(['A', 'B', 'C']);
/** The room plans' source by the URL (&plans=): 'derived', each room's plan derived at the fill (combat/derive.js), a lead's switch; else the authored. */
export const PLANS_URL = Object.freeze(['derived']);
/** VIEWS §12's "reduce flashes" by the URL (&flashes=reduced: 0.0.9). */
export const FLASHES = Object.freeze(['reduced']);

/** The sound by the URL (&sound=old: v0.0.15's, to compare; ui/audio/engine.js createAudio's sound option, the 0.0.16 round's): else null, the new sound. */
export const SOUNDS_URL = Object.freeze(['old', 'new']);

/** The step panel's layouts by the URL (&panel=a|b|c: VIEWS §7.8.5, the rework's R7; C until the user scores P1 to P3). */
export const PANELS_URL = Object.freeze(['a', 'b', 'c']);

/** The walk cycle by the URL (&cycle=A|B|C: VIEWS §3.10.4, the rework's R8; else the game's, B, until the user scores W-b to W-d). */
export const CYCLES_URL = Object.freeze(['A', 'B', 'C']);

/** The shot by the URL (&shot=A0..A4: v0.0.20's candidates, src/data/sounds.js SHOT_CANDIDATES; engine.js setShot): else null, the scene's own. */
export const SHOTS_URL = Object.freeze(['A0', 'A1', 'A2', 'A3', 'A4']);
// (no &voice=. The voice synthesis is gone whole (the user, 2026-11-19: "forget voice synthesis, no voices."): an old URL
// with &voice= is read as if it had none, with no toast and no error, as any parameter the game does not know)
/** The look's flags by the URL (&look=stack:4+5,helm:r1,jamb:m2: v0.0.20's To score picks; a query reads '+' as a space, taken as one), the form only (ui/cards/topick.js parseLook reads and checks them). */
export const LOOK_URL = /^[a-z0-9:+, ]{1,80}$/i;
/** &grav='s form (v0.0.24, step 6): kinds, numbers and the grammar's marks, a '+' coming through as a space; the events are parsed by gravity.js parseGrav. */
export const GRAV_URL = /^[a-z0-9.:@~^+!, ]{1,160}$/;
/** The shoot house's light by the URL (&houselight=b|c, FL-9's candidates: src/data/places/house-light.js houseLightOf; else null, today's HL-a). */
export const HOUSE_LIGHTS_URL = Object.freeze(['a', 'b', 'c']);

/** test-pairs' sheets by the URL (&tier=: the build sheet 0.0.8 §2.6; the corporal by the URL only): else null, the scene's private. */
export const TIERS_URL = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);

/** The test parameters of a URL's query: { play, seed, hour, mode, debug, mood, fog, nostore, perf, bench, area, at, face, setup, tier, par, flashes, env, grav, loadout, opfor, breach, draw, house, doors, rooms, layout, plans, panel, cycle, sound, shot, look, houseLight }. */
export function readParams(search = globalThis.location?.search ?? '') {
  const q = new URLSearchParams(search);
  const num = (k) => (q.has(k) && q.get(k) !== '' && Number.isFinite(Number(q.get(k))) ? Number(q.get(k)) : null);
  const on = (k) => q.get(k) === '1';
  const hl = String(q.get('houselight') ?? '').toLowerCase().replace(/^hl-?/, '');
  return {
    play: q.get('play') || null,
    seed: num('seed'),
    hour: num('hour'),
    mode: q.get('mode') === 'ironman' ? 'ironman' : 'standard',
    debug: on('debug'),
    mood: q.get('mood') || null,
    fog: on('fog'),
    nostore: on('nostore'),
    perf: on('perf'),
    bench: q.get('bench') || null,
    area: q.get('area') || null,
    at: pair(q.get('at')),
    face: FACES.includes(q.get('face')) ? q.get('face') : null,
    setup: SETUPS.includes(q.get('setup')) ? q.get('setup') : null,
    tier: TIERS_URL.includes(q.get('tier')) ? q.get('tier') : null,
    par: PARS_URL.includes(q.get('par')) ? q.get('par') : null,
    flashes: FLASHES.includes(q.get('flashes')) ? q.get('flashes') : null,
    env: /^[a-z0-9-]{1,32}$/.test(q.get('env') ?? '') ? q.get('env') : null,
    // (ROADMAP "anywhere" step 6: a ship's gravity events on any scene, 'burn:1.0@40s~15' (src/sim/places/gravity.js
    // parseGrav, which main.js reads and drops with a toast when it does not parse, as it does &env=; a form past GRAV_URL kept short
    // for the toast, never parsed as anything else)
    grav: q.get('grav') ? (GRAV_URL.test(q.get('grav')) ? q.get('grav') : String(q.get('grav')).slice(0, 40)) : null,
    // (v0.0.18: test-shoothouse's loadout, a preset or a code (src/sim/arms/loadout.js; a '+' comes through as a space), read by
    // main.js, which drops an unknown one with a toast as it does &env=)
    loadout: /^[a-z0-9~:,+ -]{1,160}$/.test(q.get('loadout') ?? '') ? q.get('loadout') : null,
    // (v0.0.19: test-shoothouse's role-players, 'none', 'live' or 'live:<2a card>,<3a card>' (src/sim/scenarios/opfor.js parseOpfor,
    // which the fill reads; a card unknown there leaves the lane without them): the form only, here)
    opfor: OPFOR_URL.test(q.get('opfor') ?? '') ? q.get('opfor') : null,
    // ("Bang, then go"'s draw, the form only (shoothouse.js parseBreach reads it); '' and a malformed one null: the scene's own)
    breach: q.get('breach') && BREACH_URL.test(String(q.get('breach')).toLowerCase()) ? String(q.get('breach')).toLowerCase() : null,
    // (the drawn house, read by the fill (shoothouse.js drawnCodeFor): the form only, here)
    draw: DRAWS_URL.includes(q.get('draw')) ? q.get('draw') : null,
    house: HOUSE_URL.test(q.get('house') ?? '') ? q.get('house') : null,
    // (the &house= as written, for the page's note when it is not played as asked (assemble.js houseUrlNote): a malformed one
    // is dropped above, and said, as &env= and &loadout= are)
    houseAsked: q.get('house') ? String(q.get('house')).slice(0, 80) : null,
    doors: DOORS_URL.includes(q.get('doors')) ? q.get('doors') : null,
    // (a drawn house's rooms, a named house and the plans' source: the form only (houseChoice below orders them), null when absent)
    rooms: ROOMS_URL.includes(String(q.get('rooms') ?? '').toLowerCase()) ? String(q.get('rooms')).toLowerCase() : null,
    layout: LAYOUTS_URL.includes(String(q.get('layout') ?? '').toUpperCase()) ? String(q.get('layout')).toUpperCase() : null,
    plans: PLANS_URL.includes(q.get('plans')) ? q.get('plans') : null,
    panel: PANELS_URL.includes(String(q.get('panel') ?? '').toLowerCase()) ? String(q.get('panel')).toLowerCase() : null,
    cycle: CYCLES_URL.includes(String(q.get('cycle') ?? '').toUpperCase()) ? String(q.get('cycle')).toUpperCase() : null,
    sound: SOUNDS_URL.includes(q.get('sound')) ? q.get('sound') : null,
    // (the shot's candidate and the look's flags: the To score page's, by the URL, which wins)
    shot: SHOTS_URL.includes(String(q.get('shot') ?? '').toUpperCase()) ? String(q.get('shot')).toUpperCase() : null,
    look: LOOK_URL.test(q.get('look') ?? '') ? q.get('look') : null,
    // (FL-9: a candidate of the shoot house's light, 'HL-b' or 'HL-c' (runtime only, state.$houseLight); 'a' or none is today's)
    houseLight: HOUSE_LIGHTS_URL.includes(hl) && hl !== 'a' ? `HL-${hl}` : null,
  };
}

/**
 * The shoot house's options as one choice (the build sheet §0 items 20 and 40; my calls), for the page (main.js playScene and
 * the URL's start) and the tests (tests/game.mjs createGame) alike: a named layout beats a code, the rooms and the draw ('A' is the
 * set, so nothing is passed; 'B' and 'C' go alone); a code beats the rooms (a code names its rooms); rooms 'all' alone implies
 * drawn, and with draw 'set' is dropped; a drawn lane given no rooms takes roomsDefault (the page's scenes.js HOUSE_ROOMS_DEFAULT,
 * the tests' 'a' whatever it says). Returns { opts }, each option only when it is not the default (the set passes nothing; draw
 * and house as given, as v0.0.21 passed them), and { dropped }, the losers' words, which the page says as toasts.
 * v0.0.22's fixer: `pool` is the room set a code was drawn from ('all'), kept with the code as its rooms (no loser: the end card's
 * "Again" of an eight-room house passes its code and its pool, so "Again with a new seed" after it draws from the eight again; the
 * URL never passes it); and `drawable` false is a scene played as set from the page (scenes.js `draws` without 'drawn': "Stack and
 * clear, live" until F80 is met), whose named, coded or drawn house is dropped with its words (the code review of v0.0.22: the live
 * lane's &layout=B was played as set without a word).
 */
export function houseChoice({ draw = null, house = null, rooms = null, layout = null, pool = null } = {}, { roomsDefault = 'a', drawable = true } = {}) {
  const dropped = [];
  if (!drawable) {
    const asked = (layout && layout !== 'A') || house || rooms === 'all' || draw === 'drawn';
    if (asked) dropped.push('This lane is played as set: no other house yet.');
    return { opts: draw === 'set' ? { draw } : {}, dropped };
  }
  if (layout) {
    if (house || rooms || draw === 'drawn') dropped.push(`One house a lane: layout ${layout}.`);
    return { opts: layout === 'A' ? {} : { layout }, dropped };
  }
  if (house) {
    if (rooms) dropped.push('One house a lane: the code given, its rooms with it.');
    return { opts: { ...(draw ? { draw } : {}), house, ...(pool === 'all' ? { rooms: 'all' } : {}) }, dropped };
  }
  if (rooms === 'all' && draw === 'set') { dropped.push('All eight rooms are a drawn house\'s: the house as set instead.'); return { opts: { draw }, dropped }; }
  const eight = rooms === 'all' || (!rooms && draw === 'drawn' && roomsDefault === 'all');
  return { opts: { ...(eight ? { draw: 'drawn', rooms: 'all' } : draw ? { draw } : {}) }, dropped };
}

/**
 * A ship's lane (v0.0.25: a scene with `ship`, the Wreck's "Hold to hold") is shot as set with the standard kit: the URL's house, layout,
 * rooms, draw, code, role-players and any kit but the standard are dropped, and said once (main.js's toasts). Returns { dropped }: the
 * words, or none. `loadout` is the URL's (null or a code); a scene without `ship` drops nothing here (houseChoice is its).
 */
export const SHIP_DROPPED = 'The Wreck is shot as set, with the standard kit.';
export function shipChoice(rec, { draw = null, house = null, rooms = null, layout = null, opfor = null, loadout = null } = {}) {
  if (!rec?.ship) return { dropped: [] };
  const asked = !!(draw || house || rooms || layout || (opfor && opfor !== 'none') || (loadout && loadout !== 'standard'));
  return { dropped: asked ? [SHIP_DROPPED] : [] };
}

/**
 * "Bang, then go" (v0.0.26: a scene with `breach`, test-breach) is played in room 1 as set: the URL's house, layout, rooms, draw, code, plans,
 * role-players and kit are dropped, and said once (main.js's toasts), as the Wreck's are (shipChoice); every setup but 'go' too, said with
 * them. Returns { dropped }: the words, or none. A scene without `breach` drops nothing here.
 */
export const BREACH_DROPPED = 'Bang, then go is played in room 1 as set.';
export function breachChoice(rec, { draw = null, house = null, rooms = null, layout = null, plans = null, opfor = null, loadout = null, setup = null } = {}) {
  if (!rec?.breach) return { dropped: [] };
  const asked = !!(draw || house || rooms || layout || plans || (opfor && opfor !== 'live') || (loadout && loadout !== 'standard') || (setup && setup !== 'go'));
  return { dropped: asked ? [BREACH_DROPPED] : [] };
}

/**
 * &breach= is "Bang, then go"'s alone (v0.0.26; the review of B and C, 2026-11-19: `?play=test-shoothouse&breach=bang,held` and the live
 * lane's played room 1 alone, filed under test-breach, with no word): kept for a scene with `breach`, else dropped and said once, as the
 * Wreck drops what its scene does not take. `rec` is the URL's scene (null for a bare scenario). Returns { breach, dropped }.
 */
export const BREACH_ONLY = '&breach is Bang, then go\'s.';
export function breachOnly(rec, breach = null) {
  if (!breach) return { breach: null, dropped: [] };
  return rec?.breach ? { breach, dropped: [] } : { breach: null, dropped: [BREACH_ONLY] };
}

// ('<x>,<z>' as two finite numbers, else null)
function pair(v) {
  if (!v) return null;
  const xs = String(v).split(',').map(t => (t.trim() === '' ? NaN : Number(t)));
  return xs.length === 2 && xs.every(Number.isFinite) ? xs : null;
}

/**
 * The handle. start(state) plays a state (main.js's launch, which may return a promise); newGame(opts)
 * makes one; sim is src/sim/game.js's; store is src/core/store.js (for save and load by slot and the
 * report); about(state) the line a save shows in the lists; view the stage's view, if any; solText(ms,
 * lonE) the watch's face for events() (the sim's dates.js, SETTING's years bound), else the bare clock;
 * report() the page's bug report builder (main.js: what the menu's Report a problem writes), if any;
 * queue(action) the input's (an action for the next tick the loop runs); more, members main.js adds
 * (an object whose property descriptors are copied onto the handle).
 */
export function createDebugHandle({ loop, sim = null, start, newGame, version = '?', store = null, bus = null, about = () => 'debug', view = null, solText = null, report = null, queue = null, more = null, body = null, instinct = null, splash = null, scores = null, arms = null, menu = null, hands = null, hair = null }) {
  const inputOf = (inp) => (inp ? { ...NO_INPUT, ...inp, act: inp.act ?? [] } : NO_INPUT);
  const slotOf = (name) => {
    const s = String(name);
    if (s.includes(':') || !store?.slotFor) return s;
    return store.slotFor(loop.state ?? {}, s);
  };
  const lonOf = (state) => { try { return sim?.lonOf?.(state) ?? 0; } catch { return 0; } };
  const handle = {
    get state() { return loop.state; },
    get version() { return typeof version === 'function' ? version() : version; },
    step(n = 1, input = null) { return loop.step(n, inputOf(input)); },
    start(s) { return Promise.resolve(start(typeof s === 'string' ? fromJSON(s) : s)); },
    newGame(opts = {}) { return Promise.resolve(start(newGame(opts))); },
    save(slot = null) {
      const json = toJSON(loop.state);
      if (!slot) return json;
      if (!store) return Promise.reject(new Error('no store'));
      return store.save(slotOf(slot), loop.state, about(loop.state)).then(() => json);
    },
    load(src = 'auto') {
      if (src && typeof src === 'object') return Promise.resolve(start(fromJSON(src)));
      if (typeof src === 'string' && src.trimStart().startsWith('{')) return Promise.resolve(start(fromJSON(src)));
      if (!store) return Promise.reject(new Error('no store'));
      return store.load(slotOf(src)).then(s => (s ? start(s) : null));
    },
    skip(ms, { what = null } = {}) {
      if (!sim) throw new Error('no sim to skip time in');
      return sim.skipNow(loop.state, { activity: what ?? 'idle', planMs: ms, mask: 'D' });
    },
    pause(on = true) { return loop.pause(on, 'debug'); },
    events() {
      const s = loop.state;
      if (!s) return [];
      const lon = lonOf(s);
      return sorted(s).map(ev => ({ ...ev, melas: solText ? solText(ev.atMs, lon) : marsTimeText(ev.atMs, lon), utc: utcText(ev.atMs) }));
    },
    report() {
      if (report) return Promise.resolve(report());                 // (the page's: the one Report a problem writes)
      const s = loop.state;
      const stats = { loop: { ...loop.stats }, sim: sim ? { ...sim.stats } : null };
      if (store?.reportOf && s) return store.reportOf(s, { errors: s.meta?.errors ?? [], stats });
      return { olympus: 'report', version: this.version, state: s ? toJSON(s) : null, errors: s?.meta?.errors ?? [], stats };
    },
    get view() { return view ? { ...(view.stats ?? {}), idle: !!view.idle, pending: view.pending ?? [] } : null; },
    /** Where a world point (m) is drawn on the stage's picture ({ x, y, W, H } in its pixels), or null (the muzzle lamp's test). */
    screenOf(x, y, z) { return view?.screenOf ? view.screenOf(x, y, z) : null; },
    /** An action into the sim: queued for the next tick the loop runs, or run at once in a tick of its own while paused. */
    act(action) {
      if (loop.paused || !queue) return loop.step(1, inputOf({ act: [action] }));
      queue(action);
      return null;
    },
    /** An activity begun at a spot (time's action), as the late card and the choices card send it. */
    activity(id, spotId, args = {}, { late = null } = {}) { return this.act({ act: 'activity', args: { id, spotId, args, ...(late ? { late } : {}) } }); },
    /** The alert drill forced to sound at ms (the debug action: it marks the save). */
    drill(ms) { return this.act(`debug:drill:${Math.round(ms)}`); },
    /** The player's body now: { body, stages, strip, words, cues } (BODY's readers, from main.js), or null. */
    body() { return body && loop.state ? body(loop.state) : null; },
    /** The instinct now: { line, chip, keys, queued, parts }, or null. */
    instinct() { return instinct && loop.state ? instinct(loop.state) : null; },
    /** The running splash: its plan, phase and shown clock, or null. */
    splash() { return splash ? splash() : null; },
    /** The scores kept in this browser: { v: 1, scores: [] }. */
    scores() { return scores ? scores() : { v: 1, scores: [] }; },
    /** The gun the player holds or slings: { id, truth, belief }, or null (main.js gives arms' readers). */
    gun() { return arms?.gun && loop.state ? arms.gun(loop.state) : null; },
    /** The To score page's picks as played (the shot, the walk, the look, your #2's drawn look), or null (main.js gives arms' readers). */
    picks() { return arms?.picks ? arms.picks() : null; },
    /** The step panel now: { steps, slots, text }, or null. */
    steps() { return arms?.steps && loop.state ? arms.steps(loop.state) : null; },
    /** The plaque now: { rec, words, parts }, or null. */
    plaque() { return arms?.plaque && loop.state ? arms.plaque(loop.state) : null; },
    /** The range session now, or null. */
    range() { return arms?.range && loop.state ? arms.range(loop.state) : null; },
    /** Stop motion now, or null. */
    stop() { return arms?.stop && loop.state ? arms.stop(loop.state) : null; },
    /** test-pairs now (the scene's pairsNow), or null off its course (0.0.8). */
    pairs() { return arms?.pairs && loop.state ? arms.pairs(loop.state) : null; },
    /** The contact now (contact.js contactNow, and what the page draws of it), or null (0.0.8). */
    contact() { return arms?.contact && loop.state ? arms.contact(loop.state) : null; },
    /** R held's menu now (handMenu's), with the open card's state where it is up, or null (main.js gives the reader). */
    menu() { return menu && loop.state ? menu(loop.state) : null; },
    /** The player's hands: { dirt, why, band, words, k }, or null. */
    hands() { return hands && loop.state ? hands(loop.state) : null; },
    /** The player's hair (hairOf's record), or null. */
    hair() { return hair && loop.state ? hair(loop.state) : null; },
    loop,
    bus,
    sim,
  };
  if (more) Object.defineProperties(handle, Object.getOwnPropertyDescriptors(more));
  return handle;
}

/** Put the handle on window (globalThis) as __olympus. */
export function installDebug(handle) {
  globalThis.__olympus = handle;
  return handle;
}
