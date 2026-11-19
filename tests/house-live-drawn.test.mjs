// OLYMPUS tests: "Stack and clear, live" on a drawn house (the build sheet v0.0.22 item 15, G5): the role-players stand at the posts of lane rooms 2 and 3 wherever those rooms fall, read through opfor.js's one seam.
//
// v0.0.21 forced the live lane to the set (shoothouse.js drawnCodeFor), its men's spots authored by stand in the area's frame
// (house-opfor.js OPFOR_SPOTS). Now each chunk carries its post in its own frame (data/chunks/x4.js `posts`), scenes/assemble.js postsOf
// places them with their rooms, and opfor.js spotOf and rpStandsOf read them on a drawn lane (the set's by stand on the set). The forced
// cards of `&opfor=live:<room 2's>,<room 3's>` reach the drawn posts by lane room (drawCards; parseOpfor keys them by the set's
// stands), the cards' weights are the lane room's (RP_CARD_WEIGHTS '2', '3'), and each man is drawn by his lane room's billet (the post's
// `post`), so the same two men of Base Melas stand in rooms 2 and 3 of any house. The lane is the sergeant by T on 48213 with the cards
// forced, all eight rooms drawn from (rooms 'all'), from the fill to its card.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseBot, runHouse } from './bots/house.mjs';
import { spotOf, rpStandsOf, drawCards } from '../src/sim/scenarios/opfor.js';
import { postsOf, houseSpecOf } from '../src/sim/scenes/assemble.js';
import { OPFOR_SPOTS } from '../src/data/places/house-opfor.js';
import { newGame } from '../src/sim/game.js';
import { houseChoice } from '../src/core/debug.js';
import { HOUSE_ROOMS_DEFAULT, SCENES } from '../src/data/scenes.js';
import { houseCodeOf, wholeCodeOf, HOUSE_CODE_SET } from '../src/sim/scenes/assemble.js';

export default [
  {
    name: 'a drawn live lane: the sergeant by T on 48213, live:fight,hide, all eight rooms drawn from, to the card; its role-players at the drawn posts of lane rooms 2 and 3 (opfor.js spotOf, rpStandsOf), room 2\'s man fighting and room 3\'s hiding as forced (drawCards finds a forced card by lane room: on stands \'2b\' and \'3c\' it fails read by the set\'s stand alone), each drawn by his room\'s billet (before: the live lane forced to the set)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live:fight,hide', rooms: 'all' }), s = g.state, R = s.armoury.range, H = R.house;
      const posts = postsOf(houseSpecOf(s)), stands = rpStandsOf(s), men = R.turners.filter(T => T.live);
      const at = men.map(T => ({ stand: T.stand, card: T.live.card, x: T.x, z: T.z, spot: spotOf(s, T), post: s.people[T.live.who]?.post?.key ?? s.people[T.live.who]?.service?.post ?? null }));
      console.log(`      ${H.draw?.code ?? 'the set'}: role-player stands ${stands.join(', ')} (posts ${Object.keys(posts).join(', ')}); ${at.map(m => `${m.stand} ${m.card} at (${m.x}, ${m.z}), his post's start (${m.spot?.start?.join(', ')}), billet ${m.spot?.post}`).join('; ')}`);
      // (the forced cards on the drawn stands, the set's keys: what drawCards gives them by lane room; by the stand alone a drawn '2b' or '3c' draws)
      // (and on stands no chunk has today, '2b' and '3c': a forced card by lane room, never drawn for being keyed by the set's stands)
      const forced = drawCards(48213, { '2a': 'fight', '3a': 'hide' }, ['2b', '3c']);
      assert(H.draw?.mode === 'drawn' && stands.length === 2 && stands.every(st => posts[st]) && men.length === 2, JSON.stringify({ draw: H.draw, stands, posts: Object.keys(posts), men: men.length }));
      assert(at.every(m => m.spot && m.x === m.spot.start[0] && m.z === m.spot.start[1]), JSON.stringify(at));
      assert(at.find(m => m.stand[0] === '2')?.card === 'fight' && at.find(m => m.stand[0] === '3')?.card === 'hide' && forced['2b'] === 'fight' && forced['3c'] === 'hide', JSON.stringify({ at, forced }));
      assert(at.find(m => m.stand[0] === '2')?.spot.post === OPFOR_SPOTS['2a'].post && at.find(m => m.stand[0] === '3')?.spot.post === OPFOR_SPOTS['3a'].post, JSON.stringify(at.map(m => m.spot?.post)));
      const r = runHouse(g, houseBot({ mode: 'T' }), { maxMs: 20 * 60_000 });
      console.log(`      to the card ${r.done} (${H.end?.why}) at tick ${s.clock.tick}`);
      assert(r.done && ['clear', 'casualty', 'passed'].includes(H.end?.why) && !g.errors.length, JSON.stringify({ done: r.done, end: H.end?.why, errors: g.errors.slice(0, 2) }));
    },
  },
  {
    name: 'on the set the seam is the set\'s byte for byte: spotOf is OPFOR_SPOTS by stand and rpStandsOf RP_STANDS, and the set\'s posts placed in layout A are OPFOR_SPOTS (scenes/assemble.js postsOf on HOUSE1)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live:fight,hide' }), s = g.state;
      const set = postsOf(houseSpecOf(s)), same = Object.keys(OPFOR_SPOTS).every(st => JSON.stringify({ ...set[st], why: undefined }) === JSON.stringify({ ...OPFOR_SPOTS[st], why: undefined }) || (set[st] && ['start', 'hide', 'face', 'door', 'aimAt', 'post'].every(k => JSON.stringify(set[st][k]) === JSON.stringify(OPFOR_SPOTS[st][k]))));
      console.log(`      the set's stands ${rpStandsOf(s).join(', ')}; spotOf('2a') ${spotOf(s, { stand: '2a' }) === OPFOR_SPOTS['2a'] ? 'is' : 'is NOT'} OPFOR_SPOTS['2a']; postsOf(HOUSE1) ${same ? 'equals' : 'differs from'} OPFOR_SPOTS (start, hide, face, door, aimAt, post)`);
      assert(rpStandsOf(s).join() === '2a,3a' && spotOf(s, { stand: '2a' }) === OPFOR_SPOTS['2a'] && spotOf(s, { stand: '3a' }) === OPFOR_SPOTS['3a'] && same, JSON.stringify(set));
    },
  },
  {
    // (the B and C review of 2026-11-16: with the live gate gone from drawnCodeFor, the URL's &draw=drawn, &rooms=all, &layout=B and
    // &layout=C each played "Stack and clear, live" on a drawn house (Kn240lc…, Ws270lc…, Wn280pc…, Qn290pc… on 48213) while F80 is open;
    // the page's pipe is main.js newGame → sim/game.js newGame, which never passes liveDraw, so it is driven here as the page drives it)
    name: 'from the page "Stack and clear, live" is the set while its ship rule is open (F80): the URL\'s &draw=drawn, &rooms=all, &layout=B, &layout=C and &house=<code>, through houseChoice and sim/game.js newGame as main.js passes them (no liveDraw), all play the set and write nothing; &opfor=live on "Stack and clear" with &draw=drawn likewise; the tests\' createGame still draws it as asked',
    fn() {
      const code = wholeCodeOf('Wn280pc.Os195lc.Tn165pc', 48213), asks = [{ draw: 'drawn' }, { rooms: 'all' }, { layout: 'B' }, { layout: 'C' }, { draw: 'drawn', house: code }];
      const page = (scene, ask, opfor = null) => {
        const H = houseChoice(ask, { roomsDefault: HOUSE_ROOMS_DEFAULT ?? 'a' }).opts;
        return newGame({ seed: 48213, scene, scenario: 'test-shoothouse', version: 'test', ...(opfor ? { opfor } : {}), ...H });
      };
      const live = asks.map(ask => { const s = page('test-shoothouse-live', ask); return { ask, code: houseCodeOf(s), written: 'draw' in s.armoury.range.house || 'gen' in s.places.live }; });
      const viaOpfor = page('test-shoothouse', { draw: 'drawn' }, 'live'), plain = page('test-shoothouse', { draw: 'drawn' });
      const tests = houseCodeOf(createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live', draw: 'drawn' }).state);
      for (const x of live) console.log(`      the live scene, ${JSON.stringify(x.ask).replace(code, '<code>')}: ${x.code}${x.written ? ' (written)' : ''}`);
      console.log(`      "Stack and clear" &opfor=live&draw=drawn: ${houseCodeOf(viaOpfor)}; with no role-players: ${houseCodeOf(plain)}; the tests' createGame: ${tests}; the live scene's draws ${JSON.stringify(SCENES['test-shoothouse-live'].draws)}`);
      assert(live.every(x => x.code === HOUSE_CODE_SET && !x.written) && houseCodeOf(viaOpfor) === HOUSE_CODE_SET, JSON.stringify(live));
      assert(houseCodeOf(plain) !== HOUSE_CODE_SET && tests !== HOUSE_CODE_SET && SCENES['test-shoothouse-live'].draws.join() === 'set', JSON.stringify({ plain: houseCodeOf(plain), tests }));
    },
  },
];
