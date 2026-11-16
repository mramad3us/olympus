// OLYMPUS tests: the target view in node (src/ui/hud/target.js, src/art/doll/hitcard.js's subjects; VIEWS §7.7; the build sheet 0.0.18
// §2.2, §5.2). The user, 2026-11-15: "we need to generalize that target view for every time we're engaging something or someone",
// the people in it "rendered ... as we see them, meaning with their gear". Its model (a stand a khaki board, a man in his colours),
// its place among the house's HUD rectangles, when it opens and closes, and that its dolls are made ahead so no frame paints two.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assert, fmt, machineK, root } from './helpers.mjs';
import { golden } from './golden.mjs';
import { createGame } from './game.mjs';
import { houseBot, runHouse } from './bots/house.mjs';
import { createTargetView, targetModel, targetShown, UNSEEN_WORDS } from '../src/ui/hud/target.js';
import { HIT_HOLD_MS } from '../src/ui/hud/hitcard.js';
import { paintHitcard, HIT_C, hitDollCount } from '../src/art/doll/hitcard.js';
import { dollCount } from '../src/art/doll/dress.js';
import { rectsAt, overlaps, STATES, uiScale } from '../src/ui/hud/layout.js';
import { hitMarks } from '../src/sim/arms/marks.js';
import { PAPERS } from '../src/sim/arms/paper.js';
import { COMBAT_SUIT } from '../src/art/figures/outfits.js';
import { word } from '../src/art/paint.js';
import { playerActor } from '../src/core/ids.js';
import { stepAct } from './bots/lib.mjs';
import { dressOf } from '../src/art/doll/dress.js';
import { doll } from '../src/art/doll/doll.js';
import { cloth } from '../src/art/doll/grid.js';
import { standGear } from '../src/sim/arms/gear.js';

const meAt = (s) => { const a = playerActor(s); return a ? { x: a.x, z: a.z } : null; };
const readers = () => ({ marksOf: (st, key, k, ph) => hitMarks(st, key, { k, phase: ph }), meAt, known: new Map() });
const house = (tier = 'tierone') => createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go' });
const count = (pm, c) => { const w = word(c); let n = 0; for (const v of pm.data) if (v === w) n++; return n; };
// (a card that records what it was given, as hud/hitcard.js's would show it)
const fakeCard = () => { const c = { m: null, n: 0, update(m) { c.m = m; c.n++; return m?.words ?? ''; }, get text() { return c.m?.words ?? ''; } }; return c; };
const SIZES = [[1600, 900], [1024, 768], [1920, 1080]];
const HIT_STATES = ['weapon-hit', 'weapon-hit-paused', 'walking-hit', 'paused-hit'];
// (the stop at a stand in view, taken in, as the house leaves it at a contact's pause)
function atStand(g, i = 0) {
  const s = g.state, R = s.armoury.range, T = R.turners[i], pid = s.player.id;
  T.turnAtMs = s.clock.ms - 1000;
  s.mind = { ...(s.mind ?? {}), contact: { n: 1, known: {}, pending: null, last: { id: 'k1', ids: [T.key], seenMs: s.clock.ms, atMs: s.clock.ms, ident: { [T.key]: T.holds }, armour: {} } } };
  s.stop = { mode: 'stop', who: pid, gun: s.people[pid].kit.worn.sling, phase: 'choose', pick: T.key, aim: null, doing: null, queue: [], reflex: null, keep: {} };
  return T;
}

export default [
  {
    name: 'the target view\'s model: a stand as a khaki board drawn as your take-in identified it, a live man in colour with his gear (the suit, the carrier, the rifle) and no zones, the band from his range; the B goldens\' card unchanged with no subject',
    fn() {
      const g = house(), s = g.state, T = atStand(g), r = readers();
      const board = targetModel(s, { key: T.key, readers: r }), pb = paintHitcard(board);
      const two = s.actors.list.find(a => a.who === s.armoury.range.house.two.pid);
      const man = targetModel(s, { key: two.id, kind: 'person', who: two.who, readers: r }), pm = paintHitcard(man);
      console.log(`      ${T.stand}: subject ${board.subject.kind} ${board.subject.key}, '${board.words}', band ${pb.band}, khaki ${count(pb, HIT_C.khaki) + count(pb, HIT_C.khakiShade)} px, zones ${!!pb.zones}`);
      console.log(`      your #2: subject ${man.subject.kind}, '${man.words}', band ${pm.band} at ${fmt(man.rangeM, 1)} m, khaki ${count(pm, HIT_C.khaki) + count(pm, HIT_C.khakiShade)} px, the suit's shell ${count(pm, COMBAT_SUIT.shell)} px, zones ${!!pm.zones}`);
      assert(pb.subject === 'board' && count(pb, HIT_C.khaki) > 500 && pb.zones, 'a board');
      assert(pm.subject === 'man' && count(pm, HIT_C.khaki) === 0 && count(pm, COMBAT_SUIT.shell) > 100 && pm.zones === null && man.marks.length === 0, 'a man in his colours');
      assert(/Cpl|Sgt|Pte|LCpl|Cfn|Haddad|\w+/.test(man.words), man.words);
      // (no subject: the card as scored, its golden)
      const FIXED = [{ n: 1, shotId: 'g1', called: [-1.5, 2.0], seen: true, hole: [4.6, -3.1], zone: 'A', part: 'torso' }, { n: 2, shotId: 'g2', called: [2.5, 6.0], seen: true, hole: [-12.4, 15.8], zone: 'C', part: 'torso' }, { n: 3, shotId: 'g3', called: [0.5, -21.0], seen: true, hole: [3.0, -26.5], zone: 'head', part: 'head' }, { n: 4, shotId: 'g4', called: [6.0, 12.0], seen: false, hole: null, zone: null, part: 'torso' }];
      golden('hitcard B belief', paintHitcard({ phase: 'belief', man: PAPERS.man, marks: FIXED, words: 'PAIR · HAMMER · 3 SEEN', line: 'Two in the chest, one in the head. He went down.' }).data, '0c3fd5ac83516e');
      // (unseen hands: nothing in them, and the words say so)
      s.mind.contact.last.ident[T.key] = 'unseen';
      const blind = targetModel(s, { key: T.key, readers: readers() });
      assert(blind.subject.holds === 'unseen' && blind.words.startsWith(UNSEEN_WORDS), JSON.stringify([blind.subject, blind.words]));
    },
  },
  {
    name: 'HITCARD meets no rectangle of the house\'s states (STEPS with panels A, B and C, INSTINCT with the lead, TOASTS, WATCH, KEYS, PAUSED, PAPER\'s lane timer) at 1600 × 900, 1024 × 768 and 1920 × 1080, and style.css places it where layout.js says',
    fn() {
      const rows = [];
      for (const [w, h] of SIZES) for (const st of HIT_STATES) {
        const R = rectsAt(w, h, st), H = R.HITCARD;
        for (const n of STATES[st]) if (n !== 'HITCARD') assert(!overlaps(H, R[n]), `${w} × ${h} ${st}: HITCARD meets ${n}`);
        if (st === 'weapon-hit') rows.push(`${w} × ${h}: HITCARD ${fmt(H.x, 0)},${fmt(H.y, 0)} ${fmt(H.w, 0)} × ${fmt(H.h, 0)}, STEPS from y ${fmt(R.STEPS.y, 0)}, ${fmt(R.STEPS.y - H.y - H.h, 0)} px clear`);
      }
      // (the panel's layouts A, B and C are drawn inside STEPS: VIEWS §7.8; its box is the one rectangle for all three)
      const css = readFileSync(path.join(root, 'src/ui/style.css'), 'utf8'), rule = css.match(/\.hitcard \{[^}]*\}/)?.[0] ?? '';
      assert(/top: calc\(var\(--m\) \+ \(84px \+ 6px\) \* var\(--ui\)\)/.test(rule) && /width: calc\(200px \* var\(--ui\)\)/.test(rule), rule);
      for (const [w, h] of SIZES) { const ui = uiScale(w, h), H = rectsAt(w, h, 'weapon-hit').HITCARD; assert(Math.abs(H.y - (12 * ui + 90 * ui)) < 0.01, `${w} × ${h}`); }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'the target view\'s lifecycle: shown while engaged (before any round), held HIT_HOLD_MS out of stop motion after, closed when the stand has turned away after a room\'s Clear!, and from the lane\'s end hidden on the HUD; "Bang" keeps its own',
    fn() {
      const g = house(), s = g.state, card = fakeCard(), view = createTargetView({ card, readers: readers() }), seen = { sig: null, t: -Infinity, stop: false, shown: null };
      const T = atStand(g), rows = [];
      const at = (why, opts) => { const w = view.frame(s, { seen, ui: 1, ...opts }); rows.push(`${why}: ${seen.shown ? `${seen.shown.key} (${seen.shown.why})` : 'closed'}${w ? ` '${w}'` : ''}`); return seen.shown; };
      assert(at('bracketed at the pause', { inStop: true, now: 0 })?.key === T.key, 'shown on the bracket');
      s.stop.mode = 'live'; s.stop.pick = null;
      assert(at('out of the mode, at once', { now: 10 })?.key === T.key, 'held');
      assert(at(`${HIT_HOLD_MS - 100} ms later`, { now: HIT_HOLD_MS - 90 })?.key === T.key, 'held within HIT_HOLD_MS');
      assert(at(`${HIT_HOLD_MS + 100} ms later`, { now: HIT_HOLD_MS + 110 }) === null, 'closed after HIT_HOLD_MS');
      // (engaged again by the aim, then the stand turned away: closed though within the hold)
      s.stop.aim = { key: T.key, settledMs: s.clock.ms };
      assert(at('aimed', { now: 20000 })?.why === 'aim', 'aimed');
      s.stop.aim = null; T.awayAtMs = s.clock.ms;
      assert(at('turned away after "Clear!"', { now: 20010 }) === null, 'closed when turned away');
      // (the lane's end: hidden)
      T.awayAtMs = null; s.stop.aim = { key: T.key, settledMs: s.clock.ms }; s.armoury.range.end = { atMs: s.clock.ms, why: 'test' };
      assert(at('the lane ended', { now: 20020 }) === null, 'hidden from R.end');
      assert(targetShown({ engaged: true }) && !targetShown({ engaged: false, inStop: false, lastT: 0, nowT: HIT_HOLD_MS + 1 }), 'targetShown');
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'on test-handling a man\'s card closes at once when the stop goes back to your own paper, and stays closed through a fire step in stop motion: a man no longer engaged is held only out of stop motion (the review of 0.0.18: the coach\'s card stood over your target for the whole of the stop)',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, setup: 'hot' }), s = g.state, card = fakeCard(), view = createTargetView({ card, readers: readers() }), seen = { sig: null, t: -Infinity, stop: false, shown: null };
      const own = s.stop.pick, man = s.actors.list.find(a => a.who && a.id !== s.player.actor), rows = [];
      let now = 0;
      const frames = (n, why) => { for (let i = 0; i < n; i++) { now += 16; view.frame(s, { seen, inStop: s.stop?.mode === 'stop', ui: 1, now }); } if (why) rows.push(`${why}: ${seen.shown ? `${seen.shown.key} (${seen.shown.why}) '${card.text}'` : 'closed'}`); return seen.shown; };
      g.step(1, { act: [stepAct(`pick=${man.id}`)] });
      const on = frames(3, `bracketed ${man.id}`);
      g.step(1, { act: [stepAct(`pick=${own}`)] });
      const back = frames(3, `back on ${own}`);
      g.step(1, { act: [stepAct('fire')] }); for (let i = 0; i < 80; i++) { g.step(1); frames(1, ''); }
      const fired = frames(1, `after a fire step (${s.stop?.mode})`);
      const later = frames(300, `5 s more of frames (${s.stop?.mode})`);
      for (const r of rows) console.log(`      ${r}`);
      assert(on?.key === man.id && back === null && fired === null && later === null, JSON.stringify(rows));
      // (out of stop motion a man is still held HIT_HOLD_MS after the engagement)
      const v2 = createTargetView({ card: fakeCard(), readers: readers() }), seen2 = { sig: null, t: -Infinity, stop: false, shown: null };
      s.stop.pick = man.id; s.stop.mode = 'stop'; v2.frame(s, { seen: seen2, inStop: true, ui: 1, now: 0 });
      s.stop.pick = null; s.stop.mode = 'live'; s.stop.aim = null; s.stop.doing = null;
      assert(v2.frame(s, { seen: seen2, inStop: false, ui: 1, now: 100 }) && seen2.shown?.why === 'held', JSON.stringify(seen2.shown));
      v2.frame(s, { seen: seen2, inStop: false, ui: 1, now: HIT_HOLD_MS + 200 });
      assert(seen2.shown === null, 'closed after HIT_HOLD_MS');
    },
  },
  {
    name: 'in the house a stand only your #2 struck has no record in belief, so the card names the stand and tells no hit you could not know ("we only know what we know"); in truth his rounds show apart, unnumbered (the review of 0.0.18: it read "YOUR #2 · 0 SEEN")',
    fn() {
      const g = house(), s = g.state, R = s.armoury.range, T = atStand(g, 1);
      R.shots = R.shots.filter(x => x.key !== T.key);
      T.hits = [{ by: 'two', shotId: 'two-1', at: [3.0, -4.0], zone: 'A', part: 'torso' }];
      const belief = hitMarks(s, T.key, { phase: 'belief' }), truth = hitMarks(s, T.key, { phase: 'truth' });
      const m = targetModel(s, { key: T.key, readers: readers() });
      console.log(`      ${T.stand} struck by your #2 alone: belief ${JSON.stringify(belief)}, the card '${m.words}'; truth '${truth?.words}' with ${truth?.marks.length} mark(s), '${truth?.line}'`);
      assert(belief === null && m.words === String(T.stand).toUpperCase() && m.marks.length === 0, JSON.stringify({ belief, words: m.words }));
      assert(truth && truth.marks.length === 1 && truth.marks[0].kind === 'two' && truth.marks[0].n === null && /^Your #2's rounds\./.test(truth.line), JSON.stringify(truth));
    },
  },
  {
    name: 'a stand\'s hands not seen are drawn empty on the card, the armoured face\'s and the hostile\'s behind a hostage too, and a painted pistol has no holster; the hostile\'s gun hand is drawn on the side away from the hostage, so a rifle, a pistol and nothing differ (the review of 0.0.18: 0 px and 1 px)',
    fn() {
      const card = (face, holds, side = 'right') => paintHitcard({ phase: 'belief', man: PAPERS.man, marks: [], words: 'X', subject: { kind: 'board', face, holds, side } });
      const diff = (a, b) => { let n = 0; for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) n++; return n; };
      const rows = [], out = {};
      for (const [face, a, b] of [['armoured', 'rifle', 'unseen'], ['hostage', 'rifle', 'unseen'], ['hostage', 'pistol', 'unseen'], ['hostage', 'rifle', 'pistol']]) for (const side of face === 'hostage' ? ['right', 'left'] : ['right']) {
        const n = diff(card(face, a, side), card(face, b, side)); out[`${face} ${side} ${a}/${b}`] = n; rows.push(`${face}${face === 'hostage' ? ` (${side})` : ''}: ${a} against ${b}, ${n} px differ`);
      }
      // (a painted pistol: the P-12 in the hand and no holster on the thigh, none of the holster's cloth on the doll)
      const A = cloth(COMBAT_SUIT.pouches), painted = doll(dressOf(standGear('threat', 'pistol'), { look: { outfit: 'utilities', skin: 'tan', head: null }, sex: 'm' }));
      const holsterPx = Object.values(A).reduce((n, c) => n + painted.data.filter(v => v === word(c)).length, 0);
      rows.push(`the pistol threat ${diff(card('threat', 'pistol'), card('threat', 'unseen'))} px from empty hands on the card; the holster's cloth on its doll ${holsterPx} px`);
      for (const r of rows) console.log(`      ${r}`);
      for (const [k, n] of Object.entries(out)) assert(n > 20, `${k}: ${n} px`);
      assert(holsterPx === 0, `the holster's cloth on a painted pistol man: ${holsterPx} px`);
    },
  },
  {
    name: 'the house\'s faces are warmed at the scene\'s load: over a tier-one lane no frame paints more than one new doll, and the cards the view shows paint in under 4 ms × k (the 95th percentile; the worst printed)',
    fn() {
      const g = house(), k = machineK(), card = fakeCard(), view = createTargetView({ card, readers: readers() }), seen = { sig: null, t: -Infinity, stop: false, shown: null };
      const t0 = performance.now(); view.warm(g.state); const warmMs = performance.now() - t0;
      const times = [];
      let worst = 0, worstAt = '', cards = 0, lastM = null, frames = 0, now = 0, most = 0, fresh = 0;
      runHouse(g, houseBot({ mode: 'T' }), { each: (game) => {
        now += 50; frames++;
        const n0 = hitDollCount() + dollCount(), f0 = performance.now();
        view.frame(game.state, { seen, inStop: game.state.stop?.mode === 'stop', ui: 1, now });
        if (card.m && card.m !== lastM && JSON.stringify(card.m) !== JSON.stringify(lastM)) { paintHitcard({ ...card.m, size: 200 }); cards++; lastM = card.m; }
        const dt = performance.now() - f0, made = hitDollCount() + dollCount() - n0;
        most = Math.max(most, made); fresh += made;
        times.push(dt);
        if (dt > worst) { worst = dt; worstAt = `${card.m?.subject?.kind} ${card.m?.subject?.key} ${fmt(card.m?.rangeM ?? 0, 1)} m`; }
      } });
      times.sort((a, b) => a - b);
      const p95 = times[Math.floor(times.length * 0.95)];
      console.log(`      warmed in ${fmt(warmMs, 1)} ms at the load; ${frames} frames, ${cards} cards painted, ${fresh} dolls made after the load (at most ${most} in a frame); the view and its paint ${fmt(p95, 3)} ms at the 95th percentile, the worst ${fmt(worst, 2)} ms (${worstAt}), against ${fmt(4 * k, 2)} (k ${fmt(k, 2)})`);
      assert(cards > 5 && most <= 1 && p95 < 4 * k, JSON.stringify({ cards, most, p95, worst }));
    },
  },
];
