// OLYMPUS tests: the target view on a live man (the build sheet 0.0.19 §1 L-look, §6; opfor §2.6, §5 "target-live"). A role-player
// rides R.turners with `live`: engage.js gives him as a person, never a board, under the stand's rule (the bracket opens nothing
// until your take-in has seen him since he showed); the target view draws him in his gear, his marks the house's (marks.js hitMarks:
// belief, then truth) as paint in the cadre's pink, and the words the state your take-in read. A board's card is v0.0.18's to the pixel.
// v0.0.23 (the build sheet v0.0.23 item 2, rule V1; re-pinned for the user's note of 2026-11-17, "show us what we would be seeing,
// including what they are holding"): liveGear is retired. The card draws in his hands what the stage draws (the Seen record,
// src/sim/people/seen.js seenOf), whatever your take-in has read; the read is in the words ("HANDS NOT SEEN · 2A") alone.
// THE STUB (until L-opfor and L-men land at the integration): the #2's own body on stand 2a's record (opfor §2.1's shape), his mask
// a stub item in kit.worn.mask, your take-in's record written as contact.js identify writes it (last.ids, ident, and L-men's
// last.state), the stand's hits as shoothouse.js houseShot pushes them.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { engagedOf, seenState } from '../src/sim/arms/engage.js';
import { hitMarks } from '../src/sim/arms/marks.js';
import { targetModel, paintOn, UNSEEN_WORDS, aimedRec } from '../src/ui/hud/target.js';
import { paintHitcard, PAINT_C, PAINT_LOOKS, cardDigest } from '../src/art/doll/hitcard.js';
import { gearOf } from '../src/sim/arms/gear.js';
import { move } from '../src/sim/arms/kit.js';
import { contactOf, noteContact } from '../src/sim/people/mind.js';

const house = () => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' });
function liveOn(g) {
  const s = g.state, R = s.armoury.range, who = R.house.two.pid, T = R.turners.find(t => t.stand === '2a');
  T.live = { who, card: 'fight', st: 'aim', fromMs: s.clock.ms, cue: null, aimAt: null, eyes: null, eng: null, move: null, choice: null, seen: [], firstAtMs: null, fired: 0, ia: null, said: {} };
  s.items['i-mask-stub'] = { id: 'i-mask-stub', type: 'worn', model: 'fof-mask' }; s.people[who].kit.worn.mask = 'i-mask-stub';
  T.turnAtMs = s.clock.ms;
  return { s, R, who, T, pid: s.player.id };
}
// (your take-in as contact.js identify records it: the stand named since it showed, what was identified, the state read)
function takeIn(s, T, ident, state = null) {
  noteContact(s, { last: { ...(contactOf(s)?.last ?? {}), seenMs: s.clock.ms, ids: [T.key], ident: { [T.key]: ident }, ...(state ? { state: { [T.key]: state } } : {}) } });
}
const readers = { marksOf: (s, key, k, phase) => hitMarks(s, key, { k, phase }) };
const colourOf = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);

export default [
  {
    name: 'the target view shows a live man as identified, in his gear, with the team\'s paint: engaged as a person (his stand\'s key, his pid) only once taken in, his hands as the stage draws them, unseen or read (v0.0.23, rule V1; v0.0.22 emptied them while unseen), "AIMING" read (said as the figure is drawn, v0.0.28), your two rounds and your #2\'s one in the cadre\'s pink (truth) or your two painted where called (belief)',
    fn() {
      const g = house(), { s, R, who, T, pid } = liveOn(g);
      // (the bracket at a pause before your take-in has seen him: nothing; once taken in: a person, never a board)
      s.stop = { who: pid, mode: 'stop', pick: T.key, aim: null, doing: null };
      noteContact(s, { last: null });
      const before = engagedOf(s);
      assert(before === null, `bracketed unseen: ${JSON.stringify(before)}`);
      takeIn(s, T, 'unseen');
      const e = engagedOf(s);
      assert(e && e.kind === 'person' && e.who === who && e.key === T.key && e.why === 'bracket', JSON.stringify(e));
      const m0 = targetModel(s, { key: e.key, kind: 'person', who, readers });
      // (v0.0.23, rule V1: his hands as the stage draws them while unseen, the read in the words alone; v0.0.22's liveGear emptied them)
      assert(m0.subject.kind === 'man' && m0.subject.gear.mask === 'fof' && m0.subject.gear.rifle !== null && m0.subject.rec.hold.how !== 'empty' && m0.words.startsWith(UNSEEN_WORDS), JSON.stringify({ words: m0.words, rifle: m0.subject.gear.rifle, how: m0.subject.rec.hold.how }));
      takeIn(s, T, 'rifle', 'aiming');
      assert(seenState(s, T.key) === 'aiming', 'the state read');
      const m1 = targetModel(s, { key: T.key, kind: 'person', who, readers });
      // (v0.0.28, the picks' CARDS (the art director's pass of 2026-11-20: "AIMING · PAIR · 1 SEEN" over the low ready): the read moves
      // the words, never the hands, but the verb follows the figure (target.js captionState): read aiming, drawn at the low ready,
      // LOOKING; drawn aimed, AIMING (tests/portrait-caption.test.mjs holds it on the live lanes))
      const drawnAimed = aimedRec(m1.subject.rec);
      assert(m1.subject.gear.rifle?.place === 'ready' && (drawnAimed ? /^AIMING · / : /^LOOKING · /).test(m1.words) && m1.subject.rec.hold.how === m0.subject.rec.hold.how, JSON.stringify({ words: m1.words, rifle: m1.subject.gear.rifle, how: [m0.subject.rec.hold.how, m1.subject.rec.hold.how] }));
      console.log(`      unseen: '${m0.words}', hold ${m0.subject.rec.hold.how}; read aiming: '${m1.words}', hold ${m1.subject.rec.hold.how} (the read moves the words, never the hands; the verb the figure's)`);
      // (your pair on him and your #2's round, as houseShot records them)
      const ms = s.clock.ms;
      R.shots.push({ id: 'sx1', key: T.key, atMs: ms + 10, part: 'torso', row: 'shot:pair' }, { id: 'sx2', key: T.key, atMs: ms + 120, part: 'torso', row: 'shot:pair' });
      T.hits.push({ shotId: 'sx1', part: 'torso', zone: 'A', at: [-2, 3], atMs: ms + 10, by: 'me' }, { shotId: 'sx2', part: 'torso', zone: 'A', at: [3, 1], atMs: ms + 120, by: 'me' }, { shotId: 'tx1', part: 'torso', zone: 'torso', at: [-6, 11], atMs: ms + 200, by: 'two' });
      const belief = targetModel(s, { key: T.key, kind: 'person', who, readers });
      assert(belief.marks.length === 2 && belief.marks.every(m => m.paint === 'team' && m.seen), JSON.stringify(belief.marks));
      R.end = { why: 'clear', atMs: ms + 5000 };
      const truth = targetModel(s, { key: T.key, kind: 'person', who, phase: 'truth', readers });
      assert(truth.phase === 'truth' && truth.marks.length === 3 && truth.marks.every(m => m.paint === 'team'), JSON.stringify(truth.marks));
      // (the card: paint where the marks are, in the cadre's pink; P2 is another look of it)
      const counts = {};
      for (const [id, model] of [['belief', belief], ['truth', truth]]) {
        const pm = paintHitcard(model), paint = pm.marks.filter(d => d.kind === 'paint');
        let pink = 0;
        for (const v of pm.data) if (colourOf(v) === PAINT_C.team) pink++;
        counts[id] = { marks: pm.marks.length, paint: paint.length, pink };
        assert(paint.length === 2 && pink >= 2 * 8, `${id}: ${JSON.stringify(counts[id])}`);
      }
      const p2 = paintHitcard({ ...truth, paintLook: 'P2' });
      assert(cardDigest(p2) !== cardDigest(paintHitcard(truth)) && Object.keys(PAINT_LOOKS).join() === 'P1,P2', 'P2 differs');
      console.log(`      engaged ${JSON.stringify(e)}; unseen '${m0.words}'; seen '${m1.words}'; belief ${JSON.stringify(counts.belief)}; truth ${JSON.stringify(counts.truth)} ('${truth.words}')`);
    },
  },
  {
    name: 'a live man who gave up is drawn with his hands up and nothing in them as the stage draws him, read or not (v0.0.23, rule V1: liveGear retired), and the role-players\' paint on you is blue marks on your own card (paintOn); a board\'s card with no paint is the same card whatever the paint\'s look',
    fn() {
      const g = house(), { s, R, who, pid, T } = liveOn(g);
      // (the give as opfor.js giveUp ends it: the rifle on the floor at his feet, the sling slung, his hands up; the stage (look.js
      // withLive) draws him 'handsUp' from then, and the record with it; through the give itself the rifle is lowered in his hands)
      const a = s.actors.list.find(x => x.who === who), gunId = s.people[who].kit.worn.sling;
      move(s, gunId, { ground: { area: s.actors.area, x: a.x + 0.4, z: a.z } });
      s.people[who].kit.carry.posture = 'slungFront'; a.hands = true; delete a.stance;
      T.live.st = 'hands'; T.live.droppedAtMs = s.clock.ms;
      R.house.live = { mode: 'live', cards: {}, seenBy: {}, struck: [], casualty: null, ruled: [] };
      const m = targetModel(s, { key: T.key, kind: 'person', who, readers });
      takeIn(s, T, 'hands', 'hands');
      const mr = targetModel(s, { key: T.key, kind: 'person', who, readers });
      const up = m.subject.rec, read = mr.subject.rec;
      assert(up.hold.how === 'up' && read.hold.how === 'up' && up.gear.mask === 'fof', JSON.stringify({ up: up.hold, read: read.hold }));
      R.house.live = { mode: 'live', cards: {}, seenBy: {}, struck: [{ who: pid, by: 'turner:3', shotId: 'r1', part: 'torso', zone: 'A', at: [2, 3], atMs: 100 }, { who: 'nobody', part: 'head', zone: 'head', at: [0, -30], atMs: 120 }], casualty: null, ruled: [] };
      const mine = paintOn(s, pid);
      assert(mine.length === 1 && mine[0].paint === 'rp' && mine[0].hole.join() === '2,3', JSON.stringify(mine));
      const card = paintHitcard({ look: 'B', man: null, phase: 'truth', marks: mine, words: 'PAINT: 1 TORSO', line: null, tabs: [], rangeM: 5, subject: { kind: 'man', key: 'me', gear: gearOf(s, pid), person: { look: {}, sex: 'm' } } });
      let blue = 0;
      for (const v of card.data) if (colourOf(v) === PAINT_C.rp) blue++;
      assert(card.marks.length === 1 && card.marks[0].kind === 'paint' && blue >= 8, `${blue} blue`);
      const board = { look: 'B', man: null, phase: 'belief', marks: [{ n: 1, called: [0, 0], seen: true, hole: null, zone: null, part: 'torso' }], words: '1A', line: null, tabs: [], rangeM: 4, face: 'threat', holds: 'rifle' };
      assert(cardDigest(paintHitcard(board)) === cardDigest(paintHitcard({ ...board, paintLook: 'P2' })), 'a board\'s card is not painted');
      console.log(`      hands up: hold ${up.hold.how} unread, ${read.hold.how} read; paint on you: ${mine.length} mark, ${blue} blue pixels; a board's card unchanged by the paint's look`);
    },
  },
];
