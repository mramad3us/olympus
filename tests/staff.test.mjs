// The range's staff (src/sim/people/staff.js, src/data/people/posts.js; PEOPLE §3.13): generated people of authored posts, on their own streams, standing at their posts.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { whereIs } from '../src/sim/people/place.js';
import { holderOf, postOf, staffName } from '../src/sim/people/staff.js';
import { sheetOf, valueOf } from '../src/sim/skills/templates.js';
import { POSTS } from '../src/data/people/posts.js';

const who = (s, pid) => { const p = s.people[pid]; return `${pid} ${staffName(s, pid)} (${p.name.given}${p.name.nick ? ` "${p.name.nick}"` : ''}, ${p.sex}, ${Math.round((s.clock.ms - p.bornMs) / 31_557_600_000)} y, ${p.home.id}, ${p.service.mos}), Awareness ${valueOf(s, pid, 'awareness')}`; };

export default [
  {
    name: 'the range officer and the coach are drawn for their posts from the world\'s seed: the same twice, different across worlds, tier 3, by the posts\' ranks, with lazy sheets by their rank\'s tier',
    fn() {
      const seen = {};
      for (const seed of [48213, 7, 1]) {
        const a = createGame({ scenario: 'test-handling', seed, hour: 9 }).state, b = createGame({ scenario: 'test-handling', seed, hour: 9 }).state;
        const ro = holderOf(a, 'melas:kd-ro'), coach = holderOf(a, 'melas:kd-coach');
        console.log(`      ${seed}: RO ${who(a, ro)}; coach ${who(a, coach)}`);
        assert(JSON.stringify(a.people[ro]) === JSON.stringify(b.people[ro]) && JSON.stringify(a.people[coach]) === JSON.stringify(b.people[coach]), 'the same twice');
        for (const [pid, key] of [[ro, 'melas:kd-ro'], [coach, 'melas:kd-coach']]) {
          const p = a.people[pid];
          assert(p.tier === 3 && postOf(p) === key && POSTS[key].ranks.some(([r]) => r === p.service.rank) && !p.skills && sheetOf(a, pid).os > 0, JSON.stringify(p.service));
          assert(!Object.values(a.units).some(u => Object.values(u.billets ?? {}).includes(pid)), 'a staff person holds no billet');
        }
        seen[seed] = `${a.people[ro].name.family}|${a.people[coach].name.family}`;
      }
      assert(new Set(Object.values(seen)).size === 3, JSON.stringify(seen));
    },
  },
  {
    name: 'drawn on stream(\'staff\', seed, site, post) alone: the roster and the player are the barracks\' to the byte; the staff stand at their posts and are never away while posted',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 }), s = g.state;
      const b = createGame({ scenario: 'barracks', seed: 48213, hour: 9 }).state;
      const roster = Object.keys(b.people).filter(id => id !== b.player.id);
      const same = roster.every(id => JSON.stringify(s.people[id]) === JSON.stringify(b.people[id]));
      const me = s.people[s.player.id], them = b.people[b.player.id];
      const core = (p) => JSON.stringify({ name: p.name, service: p.service, look: p.look, home: p.home, bornMs: p.bornMs });
      console.log(`      the roster's ${roster.length} people ${same ? 'identical' : 'DIFFERENT'} to the barracks'; the player ${core(me) === core(them) ? 'the same person' : 'DIFFERENT'} (${me.name.given} ${me.name.family}, ${me.service.rank}); the staff ${Object.keys(s.people).length - roster.length - 1}, ids ${Object.keys(s.people).filter(id => !b.people[id]).join(', ')}`);
      assert(same && core(me) === core(them) && s.player.id === b.player.id, 'the roster moved');
      const R = s.armoury.range, posts = [[R.roId, 'the tower\'s deck'], [R.coachId, 'your right shoulder']];
      g.step(20 * 60 * 2);
      for (const [pid, where] of posts) {
        const p = s.people[pid].post, a = s.actors.list.find(x => x.who === pid);
        const at = [s.clock.ms, s.clock.ms + 3_600_000, s.clock.ms + 12 * 3_600_000].map(ms => whereIs(s, pid, ms));
        console.log(`      ${staffName(s, pid)} at ${where}: post (${p.x}, ${p.z}, y ${p.y ?? 0}) facing ${p.face} in ${p.outfit}; the actor at (${a.x}, ${a.z}, y ${a.y ?? 0}); whereIs now, in 1 h, in 12 h: ${at.map(w => (w.away ? 'away' : `${w.x},${w.z}`)).join(' / ')}`);
        assert(a && a.x === p.x && a.z === p.z && (a.y ?? 0) === (p.y ?? 0) && a.outfit === p.outfit && at.every(w => !w.away && w.x === p.x && w.z === p.z), JSON.stringify({ a, p }));
      }
    },
  },
];
