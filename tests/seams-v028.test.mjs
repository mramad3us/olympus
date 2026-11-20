// OLYMPUS tests: the two shared seams of v0.0.28's stage 0 that move nothing (its build sheet §2 step 4, §3.0): a scene's rows at hand
// (places/hand.js registerHandScene's optional rows(state)) and the brass kept on the tiles by the course's row (brass.js settle's gate
// COURSES[course].brassTiles, the KD course's literal before).
//
// A scene that holds R (test-burn's stowing; from v0.0.28 the armoury's stations) gave R one act, its offer's: R held opened no menu
// while its offer stood (places/hand.js menuOf). Stage 0 lets a scene register rows(state) → { title, rows: [{ id, label, tag, struck?,
// why? }] }: handMenu lists them while its offer stands (quick, the offer's id), and handAction acts the row R held picked (args.id)
// when the scene lists it unstruck, else the offer's id, as R tapped. A scene with no rows (test-burn) keeps R and its menu as before.
// The probe scene here offers only while its runtime marker ($handProbe, never saved) is on the state, so registering it leaves every
// other game in this process as it was; the barracks without the marker gives the menu it gave before.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { root } from './helpers.mjs';
import { registerHandScene, handMenu, handOffer, handAction } from '../src/sim/places/hand.js';
import { settle, brassLeft } from '../src/sim/arms/brass.js';
import { COURSES } from '../src/data/courses.js';

const acted = [];
registerHandScene({
  offer: (state) => (state.$handProbe ? { id: 'probe:a', label: 'Probe A', durMs: 0 } : null),
  act: (state, bus, id) => { acted.push(id); },
  rows: (state) => (state.$handProbe?.rows ? { title: 'The probe', rows: [
    { id: 'probe:a', label: 'Probe A', tag: 'R' },
    { id: 'probe:b', label: 'Probe B', tag: '' },
    { id: 'probe:c', label: 'Probe C', tag: '', struck: true, why: 'not now' },
  ] } : null),
});

export default [
  {
    name: 'a scene with rows has R held list them while its offer stands (quick its offer\'s id), and R held\'s pick acts that row\'s id when listed and not struck, else the offer\'s; with no rows its menu is null as before; with no offer the place\'s menu is the one it was',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: 48213 }), s = g.state;
      const before = JSON.stringify(handMenu(s)), offerBefore = JSON.stringify(handOffer(s));
      s.$handProbe = { rows: true };
      const m = handMenu(s), o = handOffer(s);
      const send = (args) => { acted.length = 0; handAction(s, { act: 'hand', args }, { emit() {} }, null); return acted.slice(); };
      const picks = { b: send({ id: 'probe:b' }), c: send({ id: 'probe:c' }), none: send({}), unknown: send({ id: 'probe:z' }) };
      s.$handProbe = { rows: false };
      const bare = handMenu(s), bareOffer = handOffer(s)?.id ?? null, barePick = send({ id: 'probe:b' });
      delete s.$handProbe;
      const after = JSON.stringify(handMenu(s)), offerAfter = JSON.stringify(handOffer(s));
      console.log(`      with rows: "${m?.title}", quick ${m?.quick}, rows ${m?.rows.map(r => `${r.id}${r.struck ? ' (struck)' : ''}`).join(', ')}; R tapped offers ${o?.id}; picked b → ${picks.b}, c (struck) → ${picks.c}, none → ${picks.none}, unknown → ${picks.unknown}`);
      console.log(`      with no rows: the menu ${bare === null ? 'null (as before)' : 'SHOWN'}, R ${bareOffer}, a pick of b → ${barePick}; the marker gone: the place's menu ${after === before ? 'as it was' : 'CHANGED'} (${(JSON.parse(after)?.rows ?? []).length} rows), R ${offerAfter === offerBefore ? 'as it was' : 'CHANGED'}`);
      assert(m && m.title === 'The probe' && m.quick === 'probe:a' && m.rows.length === 3 && m.spotId === null && m.fixtureId === null && o?.verb === 'scene' && o.id === 'probe:a', JSON.stringify({ m, o }));
      assert(picks.b.join() === 'probe:b' && picks.c.join() === 'probe:a' && picks.none.join() === 'probe:a' && picks.unknown.join() === 'probe:a', JSON.stringify(picks));
      assert(bare === null && bareOffer === 'probe:a' && barePick.join() === 'probe:a', JSON.stringify({ bare, bareOffer, barePick }));
      assert(after === before && offerAfter === offerBefore, JSON.stringify({ before, after }));
    },
  },
  {
    name: 'the brass on the tiles by the course\'s row: COURSES.kd.brassTiles and, from v0.0.28 B\'s merge, COURSES.armoury\'s, alone of the shipped courses; settle tiles a landed case on a course whose row says so and leaves it live on one whose row does not; brass.js names no course in its code (the literal \'kd\' before)',
    fn() {
      const rowsWith = Object.entries(COURSES).filter(([, c]) => c.brassTiles).map(([id]) => id);
      const g = createGame({ scenario: 'test-range', seed: 48213 }), s = g.state, R = s.armoury.range, me = s.player.id;
      const land = () => { R.brass = [{ kind: 'case', at: [100, 100], landMs: s.clock.ms - 1, who: me }, { kind: 'case', at: [101, 100], landMs: s.clock.ms - 1, who: me }]; R.brassTiles = {}; };
      land(); const kd = { moved: settle(s), left: brassLeft(s).n, live: R.brass.length };
      R.course = 'fam25'; land(); const fam = { moved: settle(s), left: brassLeft(s).n, live: R.brass.length };
      R.course = 'kd';
      const code = readFileSync(path.join(root, 'src/sim/arms/brass.js'), 'utf8').split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
      const literal = /course\s*[!=]==\s*['"]/.test(code);
      console.log(`      rows with brassTiles: ${rowsWith.join(', ')}; on kd two landed cases: moved ${kd.moved}, on the tiles ${kd.left}, live ${kd.live}; on fam25: moved ${fam.moved}, on the tiles ${fam.left}, live ${fam.live}; a course literal in brass.js's code ${literal}`);
      // (v0.0.28 B: "The window and the canopy"'s course keeps its relay's brass on the tiles too, its build sheet §3.0)
      assert(rowsWith.join() === 'kd,armoury' && kd.moved === 2 && kd.left === 2 && kd.live === 0 && fam.moved === 0 && fam.live === 2 && !literal, JSON.stringify({ rowsWith, kd, fam, literal }));
    },
  },
];
