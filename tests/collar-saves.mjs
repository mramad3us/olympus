// OLYMPUS tests: the boarding's ten save points (the build sheet v0.0.27 §1 D, §6 D's collar-save, F153; FT§14), shared by collar-save (one quick) and its heavy twin (the other nine).
//
// Each point is a moment of "Away the boarding party" a save must survive (the player's save made anywhere, loaded, carrying on byte for
// byte: TECH §13.1): { id, what, lanes: [{ tier, seed, bot, holdouts, setup }], at(state) }, `at` true on the first tick the moment holds,
// read off the scene's own records only (R.house.boarding, the live men's records, your actor and body), each lane tried in turn until one
// meets it. The points, FT§14's ten:
//   contact    the passage's first contact: GO given, the passage's man turned (his first cue: R.turners' '1a' turnAtMs, or his live cue)
//   blind      a man firing blind (his live st 'blind': opfor.js blindTick, A's)
//   pushoff    a man's push-off in flight (his live move a push, his boots off: opfor.js startDash or startFlee at 0 G, A's)
//   down       you down (your actor's stance 'down': body/domain.js woundsFast)
//   tourniquet mid-tourniquet (your step the tourniquet's: contact.js's row, B's)
//   rising     a man rising (his live st back from 'down': opfor.js opforRise, A's)
//   side       the side's roll pending (R.house.boarding.side crossed, not given up: opfor.js sideTick, A's)
//   giveup     the give-up's tick (R.house.boarding.side.gaveAtMs this tick)
//   splash     the fall back's splash (R.house.boarding.fallback ended in the lock, its splash running)
//   card       the card (the range's end)
// reachPoint(createGame, point) runs its lanes to the moment: { game, lane, tick } or { lane: null } where no lane meets it (printed: a
// moment a lane never reaches is said, never passed). carryOn(createGame, reached, n) saves there, plays the game on n ticks, loads the
// save into a fresh game and plays it the same n with its bot (the bot's memory is on the actor, so it is in the save), and returns both
// digests.
import { collarBotOf, boardingNow } from './bots/collar.mjs';

const live = (s) => s.armoury?.range?.turners?.filter(T => T.live) ?? [];
const meOf = (s) => s.actors?.list?.find(a => a.who === s.player.id) ?? null;
const H = (s) => s.armoury?.range?.house ?? null;

// (a wide search for the fight's own moments (A's and B's): every sheet by its honest bot and the fuzz, both types, six seeds)
const WIDE = Object.freeze([48213, 1037, 1074, 1111, 2223, 3335].flatMap(seed => ['recruit', 'private', 'sgt', 'tierone'].flatMap(tier => ['pirates', 'smugglers'].map(holdouts => ({ tier, seed, bot: tier === 'recruit' || tier === 'private' ? 'keys' : 'honest', holdouts })))));
/** The ten points (see the header). */
export const COLLAR_SAVE_POINTS = Object.freeze([
  { id: 'contact', what: 'the passage\'s first contact', lanes: [{ tier: 'private', seed: 48213, bot: 'keys', holdouts: 'pirates', setup: 'go' }, { tier: 'sgt', seed: 48213, bot: 'honest', holdouts: 'pirates' }],
    at: (s) => H(s)?.goAtMs !== null && H(s)?.cur === 0 && s.armoury.range.turners.some(T => T.stand === '1a' && (T.turnAtMs !== null || T.live?.cue)) },
  { id: 'blind', what: 'a man firing blind', lanes: WIDE,
    at: (s) => live(s).some(T => T.live.st === 'blind') },
  { id: 'pushoff', what: 'a man\'s push-off in flight', lanes: WIDE,
    at: (s) => live(s).some(T => (T.live.st === 'dash' || T.live.st === 'flee') && T.live.move) },
  { id: 'down', what: 'you down', lanes: [{ tier: 'recruit', seed: 48213, bot: 'keys', holdouts: 'pirates' }, { tier: 'private', seed: 1037, bot: 'keys', holdouts: 'pirates' }, { tier: 'recruit', seed: 1074, bot: 'keys', holdouts: 'pirates' }],
    at: (s) => meOf(s)?.stance === 'down' },
  { id: 'tourniquet', what: 'mid-tourniquet', lanes: WIDE,
    at: (s) => /tourniquet/.test(String(s.stop?.doing?.step ?? '')) },
  { id: 'rising', what: 'a man rising', lanes: WIDE,
    at: (s) => live(s).some(T => Number.isFinite(T.live.roseAtMs) && T.live.roseAtMs === s.clock.ms) },
  { id: 'side', what: 'the side\'s roll pending', lanes: WIDE,
    at: (s) => { const S = boardingNow(s)?.side; return !!S && Number.isFinite(S.crossedAtMs) && S.gaveAtMs === null; } },
  { id: 'giveup', what: 'the give-up\'s tick', lanes: [{ tier: 'sgt', seed: 48213, bot: 'honest', holdouts: 'pirates' }, { tier: 'tierone', seed: 1037, bot: 'honest', holdouts: 'pirates' }, { tier: 'raider', seed: 1074, bot: 'honest', holdouts: 'smugglers' }],
    at: (s) => { const g = boardingNow(s)?.side?.gaveAtMs; return Number.isFinite(g) && s.clock.ms - g <= 50; } },
  // (the splash itself is one outcome skip, begun and ended inside the tick the lock is reached (game.mjs runs a skip to its end in its step),
  // so its point is the walk back under the call, the tick before the lock: a save there carries on through the splash)
  { id: 'splash', what: 'the fall back\'s walk, through its splash', lanes: [{ tier: 'private', seed: 48213, bot: 'keys', holdouts: 'pirates', setup: 'fallback' }],
    at: (s) => { const F = boardingNow(s)?.fallback, me = meOf(s); return !!F && F.inAtMs === null && !!me && me.x < 3.2; } },
  { id: 'card', what: 'the card', lanes: [{ tier: 'sgt', seed: 48213, bot: 'honest', holdouts: 'smugglers', setup: 'cabin2' }],
    at: (s) => !!s.armoury?.range?.end },
]);
/** The quick test's one (collar-save; the card moved to the heavy twin for the round's quick CPU, the review of D) and the heavy twin's nine. */
export const COLLAR_SAVE_QUICK = Object.freeze(['contact']);

/** Run a point's lanes to its moment (see the header). */
export function reachPoint(createGame, point, { maxTicks = 14_000 } = {}) {
  for (const lane of point.lanes) {
    const g = createGame({ scenario: 'test-collar', seed: lane.seed, tier: lane.tier, holdouts: lane.holdouts, ...(lane.setup ? { setup: lane.setup } : {}) });
    const bot = collarBotOf(lane.bot, lane.tier, lane.seed);
    for (let i = 0; i < maxTicks; i++) {
      if (point.at(g.state)) return { game: g, bot, lane, tick: g.state.clock.tick };
      if (g.state.armoury?.range?.end && point.id !== 'card') break;
      g.step(1, bot);
      g.clearFacts?.();
    }
    if (point.at(g.state)) return { game: g, bot, lane, tick: g.state.clock.tick };
  }
  return { lane: null };
}
/** Save at the point, carry the game on n ticks and its save loaded into a fresh game the same n (see the header): { a, b, tick }. */
export function carryOn(createGame, reached, n = 600) {
  const { game: g, bot, lane } = reached, saved = g.save();
  g.step(n, bot);
  const g2 = createGame({ scenario: 'test-collar', seed: lane.seed, tier: lane.tier, holdouts: lane.holdouts, ...(lane.setup ? { setup: lane.setup } : {}) });
  g2.load(saved);
  g2.step(n, collarBotOf(lane.bot, lane.tier, lane.seed));
  return { a: g.digest(), b: g2.digest(), tick: g.state.clock.tick };
}
