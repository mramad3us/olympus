// OLYMPUS tests: six faces agree, the sim's half (the build sheet v0.0.25 item 7, §6 D zerocqb-faces, §8 F130; PC§3.2, PC§5).
//
// "Hold to hold" stands bodies on the deck and the deckhead and boards on every face of the Wreck's compartments. F130: every
// board's and body's face is the same in the sim, the stage's draw list and the card at every tick it is drawn. Here, in node, on
// the Wreck's lanes to their cards (test-zerocqb on 48213, the tier one by T and the sergeant by T; render/ and art/ are pure where
// read: the view's own rule for a body, render/faces.js onFaceOfActor and art/figures/poses.js faceCard; the stage's input for a
// board, sim/arms/look.js rangeLook's house stands; the card, sim/people/seen.js seenOf's and standSeen's roll): at every tick, for
// every lane actor, the face the sim gives him (actor.onFace, absent the deck), the face the stage's rule draws him on and its turn
// (faceCard's quarter and flip, src/data/faces.js STAGE_TURNS), and the roll his card is turned by from you (rollOf of the two
// faces); for every stand, its turner's onFace and pop, rangeLook's stand's, and the board's card's roll. Printed: the ticks, the
// ticks a body stood on the deckhead, the faces the boards stand on, and the disagreements, 0 enforced (F130). The page's half is
// ui-zerocqb's. Quick: one lane; the sergeant's a heavy case.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseTBot } from './bots/house.mjs';
import { onFaceOfActor } from '../src/render/faces.js';
import { faceCard } from '../src/art/figures/poses.js';
import { stageTurnOf, rollOf } from '../src/data/faces.js';
import { rangeLook } from '../src/sim/arms/look.js';
import { seenOf, standSeen } from '../src/sim/people/seen.js';

/** One lane's faces held tick by tick (see the header): { ticks, done, deckheadTicks, boards: { face: n }, off: [first few], n }. */
export function facesLane({ tier = 'tierone', seed = 48213, bot = houseTBot() } = {}) {
  const g = createGame({ scenario: 'test-zerocqb', seed, tier, setup: 'go' }), off = [];
  let n = 0, deckheadTicks = 0, checked = 0;
  const boards = {};
  const check = (game) => {
    const s = game.state, R = s.armoury?.range, H = R?.house, me = s.actors.list.find(a => a.who === s.player.id);
    if (!H || !me) return;
    const lane = new Set([s.player.id, H.twoPid, H.chiefPid].filter(Boolean));
    let up = false;
    for (const a of s.actors.list) {
      if (!lane.has(a.who)) continue;
      const sim = a.onFace ?? 'deck', drawnOn = onFaceOfActor(a), fc = faceCard(drawnOn, a.face ?? 'down'), st = stageTurnOf(sim);
      if (sim !== drawnOn || fc.quarter !== st.quarter || fc.flip !== st.flip) { n++; if (off.length < 6) off.push({ t: s.clock.tick, who: a.who, sim, drawnOn, fc }); }
      if (a.who !== s.player.id) {
        const rec = seenOf(s, a.who, { by: s.player.id, keep: false, fresh: true }), want = rollOf(me.onFace ?? 'deck', sim);
        if ((rec?.roll ?? 0) !== want) { n++; if (off.length < 6) off.push({ t: s.clock.tick, who: a.who, roll: rec?.roll ?? 0, want }); }
      }
      if (sim === 'deckhead') up = true;
    }
    if (up) deckheadTicks++;
    const look = rangeLook(s)?.house, stands = new Map((look?.stands ?? []).map(t => [t.key, t]));
    for (const T of R.turners ?? []) {
      if (T.live) continue;
      const L = stands.get(T.key);
      if (!L) continue;
      if ((L.onFace ?? 'deck') !== (T.onFace ?? 'deck') || !!L.pop !== !!T.pop) { n++; if (off.length < 6) off.push({ t: s.clock.tick, stand: T.key, sim: T.onFace, stage: L.onFace }); }
      const card = standSeen(T.face ?? 'threat', T.holds ?? 'rifle', null, { onFace: T.onFace ?? null, by: me.onFace ?? null });
      if ((card.roll ?? 0) !== rollOf(me.onFace ?? 'deck', T.onFace ?? 'deck')) { n++; if (off.length < 6) off.push({ t: s.clock.tick, stand: T.key, roll: card.roll }); }
      if (s.clock.tick % 200 === 0) boards[T.onFace ?? 'deck'] = (boards[T.onFace ?? 'deck'] ?? 0) + 1;
    }
    checked++;
  };
  const r = runHouse(g, bot, { each: check });
  const faces = {};
  for (const T of g.state.armoury.range.turners ?? []) if (!T.live) faces[T.onFace ?? 'deck'] = (faces[T.onFace ?? 'deck'] ?? 0) + 1;
  return { ticks: r.ticks, checked, done: r.done, deckheadTicks, faces, off, n };
}

export default [
  {
    name: 'F130 six faces agree, the sim\'s half: on the tier one\'s Wreck by T on 48213, every lane body\'s face the same in the sim, the stage\'s rule and his card\'s roll, and every board\'s in its turner, rangeLook\'s stand and its card, at every tick',
    timeoutMs: 240_000,
    fn() {
      const L = facesLane({ tier: 'tierone' });
      console.log(`      the tier one: ${L.ticks} ticks to the card (${L.done ? 'ended' : 'NOT ENDED'}), ${L.checked} checked; a body on the deckhead ${L.deckheadTicks} ticks; the boards' faces ${JSON.stringify(L.faces)}; F130 disagreeing ${L.n}${L.off.length ? ` ${JSON.stringify(L.off)}` : ''}`);
      assert(L.done && L.n === 0 && L.deckheadTicks > 0 && Object.keys(L.faces).length >= 5, JSON.stringify({ done: L.done, n: L.n, up: L.deckheadTicks, faces: L.faces }));
    },
  },
  {
    name: 'F130 six faces agree on the sergeant\'s Wreck by T on 48213 and 1037',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      for (const seed of [48213, 1037]) {
        const L = facesLane({ tier: 'sgt', seed });
        console.log(`      the sergeant on ${seed}: ${L.ticks} ticks (${L.done ? 'ended' : 'NOT ENDED'}); on the deckhead ${L.deckheadTicks} ticks; F130 disagreeing ${L.n}${L.off.length ? ` ${JSON.stringify(L.off)}` : ''}`);
        assert(L.done && L.n === 0, JSON.stringify({ seed, done: L.done, n: L.n }));
      }
    },
  },
];
