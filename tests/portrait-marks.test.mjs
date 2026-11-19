// OLYMPUS tests: the marks stay where the sim put them whatever the pose (the build sheet v0.0.23 item 4, §6 C; P§3.3).
//
// The card lays the man-target over the doll life size, its head on the doll's head (hitcard.js manToCard), and a hole is drawn at
// the place the sim gave it. A posed doll's body is set down by its pose (doll.js POSE_BENDS: kneeling 31 reference rows, sitting
// 66, cowering 28, prone 86), and the card's crop follows it (paintHitcard: the rows cut from the doll shifted by the pose's drop),
// so the doll's own A zone (its anchor, the head's centre 30 cm under it; from behind back.js's) lands where the card puts the A
// zone's centre. For every pose and facing at the three bands, a hole at the A zone's centre is drawn within 1 px of the doll's A
// anchor on the card. And "Bang"'s boards (the user's starred card, its four goldens in ui-hitcard) draw their marks where the
// house's boards do, whatever the hold: the marks never move with question 1's answer. Prints the worst offset by band.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { paintHitcard } from '../src/art/doll/hitcard.js';
import { PAPERS } from '../src/sim/arms/paper.js';
import { seenOf } from '../src/sim/people/seen.js';
import { POSES, FACINGS } from '../src/data/portrait.js';

const BANDS_M = [5, 15, 30];

export default [
  {
    name: 'for every pose and facing at the near, mid and far bands, a hole at the A zone\'s centre is drawn within 1 px of the posed doll\'s A anchor on the card (the crop follows the pose\'s drop)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', opfor: 'live:fight,fight' }), s = g.state;
      const who = s.armoury.range.turners.find(t => t.live?.who).live.who, base = seenOf(s, who), A = PAPERS.man.centres.A;
      const worst = {}, bad = [];
      for (const pose of POSES) for (const facing of FACINGS) for (const m of BANDS_M) {
        const rec = { ...base, pose, facing, hold: { ...base.hold, how: pose === 'cower' ? 'empty' : 'rifle-low' }, rangeM: m };
        const card = paintHitcard({ phase: 'truth', marks: [{ n: 1, hole: A, called: null, seen: true, zone: 'A', part: 'torso' }], words: 'X', rangeM: m, man: PAPERS.man, subject: { kind: 'man', rec, gear: rec.gear, person: { look: {}, sex: 'm' } } });
        const mk = card.marks.find(x => x.kind === 'hole'), a = card.anchors?.aZone;
        const off = mk && a ? Math.hypot(mk.x - a[0], mk.y - a[1]) : Infinity;
        worst[card.band] = Math.max(worst[card.band] ?? 0, off);
        if (!(off <= 1.001)) bad.push(`${pose} ${facing} @${m} m: ${fmt(off, 2)} px (mark ${mk?.x},${mk?.y}, anchor ${a?.map(v => fmt(v, 1))})`);
      }
      console.log(`      ${POSES.length} poses × ${FACINGS.length} facings × ${BANDS_M.length} bands: the worst offset ${Object.entries(worst).map(([b, v]) => `${b} ${fmt(v, 2)} px`).join(', ')}`);
      for (const b of bad.slice(0, 6)) console.log(`      ${b}`);
      assert(!bad.length, `${bad.length} marks off their anchor`);
    },
  },
  {
    name: '"Bang"\'s boards (no subject: the hold the user starred) draw their marks where the house\'s boards (the gun at the ready) draw them, at each band, whatever question 1 decides',
    fn() {
      const marks = [{ n: 1, hole: [2, -3], called: [0, 0], seen: true, zone: 'A', part: 'torso' }, { n: 2, hole: [-6, -24], called: [0, -25], seen: true, zone: 'head', part: 'head' }];
      const rows = [];
      for (const [face, holds] of [['threat', 'rifle'], ['threat', 'pistol'], ['armoured', 'rifle']]) for (const m of BANDS_M) {
        const P = (subject) => paintHitcard({ face, holds, phase: 'truth', marks, words: 'X', rangeM: m, man: PAPERS.man, ...(subject ? { subject: { kind: 'board', face, holds } } : {}) });
        const bang = P(false), house = P(true), at = (c) => c.marks.map(x => `${x.kind}${x.n}@${x.x},${x.y}`).join(' ');
        rows.push(`${face}/${holds} @${m} m: ${at(bang)} (Bang, ${bang.place}) | ${at(house)} (house, ${house.place})`);
        assert(at(bang) === at(house) && bang.place !== house.place, rows.at(-1));
      }
      for (const r of rows.filter((_, i) => i % 3 === 0)) console.log(`      ${r}`);
    },
  },
];
