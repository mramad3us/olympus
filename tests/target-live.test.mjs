// OLYMPUS tests: the target view on a live man (the build sheet 0.0.19 §1 L-look, §6; opfor §2.6, §5 "target-live"). A role-player
// rides R.turners with `live`: engage.js gives him as a person, never a board, under the stand's rule (the bracket opens nothing
// until your take-in has seen him since he showed); the target view draws him in his gear as your take-in identified him (what is
// in his hands is what it read: unseen, empty; 'hands', up), his marks the house's (marks.js hitMarks: belief, then truth) as paint
// in the cadre's pink, and the words the state your take-in read. A board's card is v0.0.18's to the pixel.
// THE STUB (until L-opfor and L-men land at the integration): the #2's own body on stand 2a's record (opfor §2.1's shape), his mask
// a stub item in kit.worn.mask, your take-in's record written as contact.js identify writes it (last.ids, ident, and L-men's
// last.state), the stand's hits as shoothouse.js houseShot pushes them.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { engagedOf, seenState } from '../src/sim/arms/engage.js';
import { hitMarks } from '../src/sim/arms/marks.js';
import { targetModel, liveGear, paintOn, UNSEEN_WORDS } from '../src/ui/hud/target.js';
import { paintHitcard, PAINT_C, PAINT_LOOKS, cardDigest } from '../src/art/doll/hitcard.js';
import { gearOf } from '../src/sim/arms/gear.js';
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
    name: 'the target view shows a live man as identified, in his gear, with the team\'s paint: engaged as a person (his stand\'s key, his pid) only once taken in, his hands empty while unseen and the rifle when seen, "AIMING" read, your two rounds and your #2\'s one in the cadre\'s pink (truth) or your two painted where called (belief)',
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
      assert(m0.subject.kind === 'man' && m0.subject.gear.mask === 'fof' && m0.subject.gear.rifle === null && m0.words.startsWith(UNSEEN_WORDS), JSON.stringify({ words: m0.words, rifle: m0.subject.gear.rifle }));
      takeIn(s, T, 'rifle', 'aiming');
      assert(seenState(s, T.key) === 'aiming', 'the state read');
      const m1 = targetModel(s, { key: T.key, kind: 'person', who, readers });
      assert(m1.subject.gear.rifle?.place === 'ready' && /^AIMING · /.test(m1.words), JSON.stringify({ words: m1.words, rifle: m1.subject.gear.rifle }));
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
    name: 'a live man who gave up is drawn with his hands up and nothing in them once a take-in read it (liveGear), and the role-players\' paint on you is blue marks on your own card (paintOn); a board\'s card with no paint is the same card whatever the paint\'s look',
    fn() {
      const g = house(), { s, R, who, pid } = liveOn(g), gear = gearOf(s, who);
      const up = liveGear(gear, { holds: 'hands' }), read = liveGear(gear, { holds: 'rifle', state: 'hands' });
      assert(up.hands === 'up' && up.rifle === null && read.hands === 'up' && read.rifle === null && up.mask === 'fof', JSON.stringify(up));
      R.house.live = { mode: 'live', cards: {}, seenBy: {}, struck: [{ who: pid, by: 'turner:3', shotId: 'r1', part: 'torso', zone: 'A', at: [2, 3], atMs: 100 }, { who: 'nobody', part: 'head', zone: 'head', at: [0, -30], atMs: 120 }], casualty: null, ruled: [] };
      const mine = paintOn(s, pid);
      assert(mine.length === 1 && mine[0].paint === 'rp' && mine[0].hole.join() === '2,3', JSON.stringify(mine));
      const card = paintHitcard({ look: 'B', man: null, phase: 'truth', marks: mine, words: 'PAINT: 1 TORSO', line: null, tabs: [], rangeM: 5, subject: { kind: 'man', key: 'me', gear: gearOf(s, pid), person: { look: {}, sex: 'm' } } });
      let blue = 0;
      for (const v of card.data) if (colourOf(v) === PAINT_C.rp) blue++;
      assert(card.marks.length === 1 && card.marks[0].kind === 'paint' && blue >= 8, `${blue} blue`);
      const board = { look: 'B', man: null, phase: 'belief', marks: [{ n: 1, called: [0, 0], seen: true, hole: null, zone: null, part: 'torso' }], words: '1A', line: null, tabs: [], rangeM: 4, face: 'threat', holds: 'rifle' };
      assert(cardDigest(paintHitcard(board)) === cardDigest(paintHitcard({ ...board, paintLook: 'P2' })), 'a board\'s card is not painted');
      console.log(`      hands up: rifle ${up.rifle}, hands ${up.hands}; paint on you: ${mine.length} mark, ${blue} blue pixels; a board's card unchanged by the paint's look`);
    },
  },
];
