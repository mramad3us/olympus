// OLYMPUS tests: house-options, the shoot house's rooms, named layout and plans threaded from the URL, the picker and createGame to the fill (the build sheet v0.0.22 §2 step 3, §0 items 20 and 40).
//
// v0.0.22's stage 0 threads three options as v0.0.21 threaded draw, house and doors: &rooms=a|all (a drawn house's rooms: layout A's
// three, or X4's eight), &layout=A|B|C (a named house: A the set, B and C the instructors' other two panel settings) and
// &plans=derived (the room plans derived at the fill, a lead's switch). core/debug.js readParams reads their form only; core/debug.js
// houseChoice is their one precedence, for the page (main.js playScene, the URL's start and its toasts) and the tests
// (tests/game.mjs houseOpts, createGame): a named layout beats a code, the rooms and the draw; a code beats the rooms; rooms 'all'
// alone implies drawn and with draw 'set' is dropped; a drawn lane given no rooms takes the page's HOUSE_ROOMS_DEFAULT (createGame
// 'a' whatever it says). Each is passed only when it is not the default, so a lane given none of them, or their defaults, is the
// lane it was to the byte (the digests below). The fill (shoothouse.js testShoothouse) takes them; v0.0.22's A reads them.
// v0.0.23 (its build sheet §2 step 3, item 14): again, the house's Again of the same lane, threaded the same way (newGame, createGame,
// main.js playScene and the picker's hook) to the fill, which writes R.house.again only when given with no setup; v0.0.23's D reads it.
import { assert, near } from './helpers.mjs';
import { createGame, houseOpts } from './game.mjs';
import { readParams, houseChoice, ROOMS_URL, LAYOUTS_URL, PLANS_URL } from '../src/core/debug.js';

const fmt = (o) => JSON.stringify(o);

export default [
  {
    name: 'readParams reads &rooms=a|all, &layout=A|B|C and &plans=derived by their form only (any case for the first two), null when absent or unknown',
    fn() {
      const cases = [
        ['?play=test-shoothouse', { rooms: null, layout: null, plans: null }],
        ['?rooms=all&layout=b&plans=derived', { rooms: 'all', layout: 'B', plans: 'derived' }],
        ['?rooms=ALL&layout=C', { rooms: 'all', layout: 'C', plans: null }],
        ['?rooms=a&layout=A', { rooms: 'a', layout: 'A', plans: null }],
        ['?rooms=eight&layout=D&plans=authored', { rooms: null, layout: null, plans: null }],
        ['?rooms=&layout=&plans=', { rooms: null, layout: null, plans: null }],
      ];
      for (const [q, want] of cases) {
        const p = readParams(q), got = { rooms: p.rooms, layout: p.layout, plans: p.plans };
        console.log(`      ${q}: ${fmt(got)}`);
        assert(fmt(got) === fmt(want), fmt({ q, got, want }));
      }
      // (an eight-room code reaches the fill's parser: the URL's form takes X4's eight letters, never another)
      const eight = readParams('?house=Wn280pc.Os195lc.Tn165pc').house, odd = readParams('?house=Zn280pc.Os195lc.Tn165pc').house;
      console.log(`      &house= an eight-room code ${eight}; a letter of no chunk ${odd}; the lists ${fmt({ ROOMS_URL, LAYOUTS_URL, PLANS_URL })}`);
      assert(eight === 'Wn280pc.Os195lc.Tn165pc' && odd === null, fmt({ eight, odd }));
    },
  },
  {
    name: 'one precedence (core/debug.js houseChoice, the build sheet §0 item 40): &layout over &house, &rooms and &draw; &house over &rooms; &rooms=all alone drawn, with &draw=set dropped; a drawn lane given no rooms takes the page\'s default; each loser said',
    fn() {
      const C = 'Cn290pc.Ks206lc.En175pc';
      const rows = [
        [{}, 'a', {}, 0],
        [{ draw: 'set' }, 'a', { draw: 'set' }, 0],
        [{ draw: 'drawn' }, 'a', { draw: 'drawn' }, 0],
        [{ draw: 'drawn' }, 'all', { draw: 'drawn', rooms: 'all' }, 0],
        [{ draw: 'drawn', rooms: 'a' }, 'all', { draw: 'drawn' }, 0],
        [{ rooms: 'all' }, 'a', { draw: 'drawn', rooms: 'all' }, 0],
        [{ rooms: 'all', draw: 'set' }, 'a', { draw: 'set' }, 1],
        [{ house: C }, 'all', { house: C }, 0],
        [{ house: C, draw: 'drawn', rooms: 'all' }, 'a', { draw: 'drawn', house: C }, 1],
        [{ layout: 'A' }, 'a', {}, 0],
        [{ layout: 'A', draw: 'drawn' }, 'all', {}, 1],
        [{ layout: 'B', house: C }, 'a', { layout: 'B' }, 1],
        [{ layout: 'C', draw: 'set' }, 'a', { layout: 'C' }, 0],
        [{ layout: 'B', rooms: 'all' }, 'all', { layout: 'B' }, 1],
      ];
      for (const [given, roomsDefault, want, nDropped] of rows) {
        const r = houseChoice(given, { roomsDefault });
        console.log(`      ${fmt(given)} (default ${roomsDefault}): ${fmt(r.opts)}${r.dropped.length ? `; said: ${r.dropped.join(' ')}` : ''}`);
        assert(fmt(r.opts) === fmt(want) && r.dropped.length === nDropped, fmt({ given, roomsDefault, got: r, want, nDropped }));
      }
      assert(houseChoice({ layout: 'B', house: C }).dropped[0] === 'One house a lane: layout B.', 'the sheet\'s toast for &layout over &house');
    },
  },
  {
    name: 'createGame threads them as the page does but with rooms \'a\' whatever the page\'s default: a lane given none of them, or their defaults (rooms \'a\', layout \'A\'), is the same lane to the byte; rooms \'all\' alone is drawn; an unknown option throws',
    fn() {
      const C = 'Cn290pc.Ks206lc.En175pc';
      const opts = [[{}, {}], [{ rooms: 'a' }, {}], [{ layout: 'A' }, {}], [{ draw: 'set', rooms: 'all' }, {}], [{ rooms: 'all' }, { draw: 'drawn', rooms: 'all' }],
        [{ layout: 'B', draw: 'drawn', house: C }, { layout: 'B' }], [{ house: C, draw: 'set' }, { draw: 'drawn', house: C }], [{ plans: 'derived' }, { plans: 'derived' }], [{ doors: 'fixed', draw: 'drawn' }, { draw: 'drawn', doors: 'fixed' }]];
      for (const [given, want] of opts) {
        const got = houseOpts(given);
        console.log(`      houseOpts ${fmt(given)}: ${fmt(got)}`);
        assert(fmt(got) === fmt(want), fmt({ given, got, want }));
      }
      const dig = (o) => createGame({ scenario: 'test-shoothouse', seed: 48213, ...o }).digest();
      const set = [{}, { rooms: 'a' }, { layout: 'A' }, { layout: 'A', draw: 'drawn' }, { draw: 'set' }].map(dig), drawn = [{ draw: 'drawn' }, { draw: 'drawn', rooms: 'a' }].map(dig);
      console.log(`      the set at the fill: ${set.join(', ')}; drawn on 48213: ${drawn.join(', ')}`);
      assert(set.every(d => d === set[0]) && drawn.every(d => d === drawn[0]) && drawn[0] !== set[0], fmt({ set, drawn }));
      const bad = [{ rooms: 'eight' }, { layout: 'D' }, { plans: 'authored' }].map(o => { try { createGame({ scenario: 'test-shoothouse', seed: 1, ...o }); return null; } catch (e) { return String(e.message); } });
      console.log(`      unknown options: ${bad.map(m => (m ? 'threw' : 'made a game')).join(', ')}`);
      assert(bad.every(Boolean), fmt(bad));
      near(bad.length, 3, 0, 'three unknowns');
    },
  },
  {
    // (v0.0.23's stage 0, its build sheet §2 step 3 and item 14: the house's Again of the same lane threaded as the options above,
    // newGame and createGame to testShoothouse, which writes R.house.again; nothing reads it until v0.0.23's D, the short brief)
    name: 'again (v0.0.23): absent or false writes nothing, the lane to the byte; true writes R.house.again = true at the fill and nothing else; with a setup (no brief) nothing; a value not true or false throws',
    fn() {
      const mk = (o) => createGame({ scenario: 'test-shoothouse', seed: 48213, ...o });
      const plain = mk({}), off = mk({ again: false }), on = mk({ again: true }), set = mk({ again: true, setup: 'go' }), setPlain = mk({ setup: 'go' });
      const H = (g) => g.state.armoury.range.house;
      // (the save with again taken out: the same text as the plain lane's, so again writes that one field and nothing else)
      const without = JSON.parse(on.save());
      delete without.armoury.range.house.again;
      const same = JSON.stringify(without) === JSON.stringify(JSON.parse(plain.save()));
      console.log(`      digests: none ${plain.digest()}, false ${off.digest()}, true ${on.digest()} (R.house.again ${H(on).again}; with it taken out the plain save: ${same}); setup 'go' with again ${set.digest()}, without ${setPlain.digest()} (R.house.again ${H(set).again})`);
      assert(plain.digest() === off.digest() && !('again' in H(plain)) && !('again' in H(off)), fmt({ plain: plain.digest(), off: off.digest() }));
      assert(H(on).again === true && on.digest() !== plain.digest() && same, fmt({ again: H(on).again, same }));
      assert(!('again' in H(set)) && set.digest() === setPlain.digest(), fmt({ again: H(set).again, set: set.digest(), setPlain: setPlain.digest() }));
      const bad = ['yes', 1, null].map(v => { try { mk({ again: v }); return null; } catch (e) { return String(e.message); } });
      console.log(`      again 'yes', 1, null: ${bad.map(m => (m ? 'threw' : 'made a game')).join(', ')}`);
      assert(bad.every(Boolean), fmt(bad));
    },
  },
];
