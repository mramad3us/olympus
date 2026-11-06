// The placed people's poses (the 0.0.3 build sheet §2.2, §5.2; ROADMAP §4.4's moment 2, "the bay at
// 23:00"): no AI yet, so the 1st Squad and the fire watch are placed by whereIs, asleep in their racks
// after taps, at their racks by day, and a pose changes only while the player cannot see the person
// (the fog's own function), all at once behind a cut, and in a skip by the same rule as live play.
// "Nobody pops in or out" (the hub's
// pillar 6) is what these hold: through 22:00 lived nobody seen changes, turned away everyone is
// down within a game second, the actors stay the same people with the same ids, an area change
// remakes them at whereIs, a wait across taps changes nobody in sight and ends with everyone out of
// sight lying, and a save and load carries
// on byte for byte. Prints the postures by hour, the changes held back while seen and the actors
// layer's cost a tick against its 0.25 ms (CONTRACTS §6).
import { assert, fmt, machine } from './helpers.mjs';
import { createGame } from './game.mjs';
import { areaOf } from '../src/sim/places/model.js';
import { seatOf, spotsOf } from '../src/sim/places/fixtures.js';
import { playerActor } from '../src/core/ids.js';
import { MIN_MS, TICK_MS } from '../src/core/clock.js';
import { marsClock } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';
import { canSee, eyeOf } from '../src/sim/people/perception.js';
import { figureOf } from '../src/sim/people/figure.js';
import { placed, whereIs, fireWatchOf, actorsStep, placeStats, inSight, CURTAIN_FRAC, FIRE_WATCH_POST, POSE_PERIOD_MS } from '../src/sim/people/place.js';
import { postOf } from '../src/sim/places/fixtures.js';

const SEED = 48213;
const AREA = 'melas.echo.1';
const LON = SITES.melas.lonEDeg;
const clockText = (ms) => { const c = marsClock(ms, LON); return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}`; };
const squadmates = (s) => s.actors.list.filter(a => a.who && a.who !== s.player.id && s.people[a.who].service.unitId === s.people[s.player.id].service.unitId);
const fireWatchActor = (s) => s.actors.list.find(a => a.who === fireWatchOf(s));
const poseKey = (a) => `${a.posture ?? 'stand'}|${a.x}|${a.z}|${a.y ?? 0}|${a.spotId ?? ''}|${a.outfit ?? 'utilities'}|${!!a.curtain}`;
const fixture = (id) => areaOf(AREA).fixtures.find(f => f.id === id);
const door = () => areaOf(AREA).openings.find(o => o.id === 'o:e1:bay-2-1');
const put = (me, x, z, face) => Object.assign(me, { x, z, face, $px: x, $pz: z });
const aisle = () => { const ft = fixture('f:e1:bay-2-1:footlocker-n2') ?? fixture('f:e1:bay-2-1:foot-n2'), fs = fixture('f:e1:bay-2-1:footlocker-s0') ?? fixture('f:e1:bay-2-1:foot-s0'); return (ft.z + fs.z) / 2; };

export default [
  {
    name: 'the bay at 23:00: twelve squadmates lying in their berths in PT kit, curtains as CURTAIN_FRAC draws them, the fire watch sitting at the post, the player standing at their berth\'s foot',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 23 });
      const s = g.state, me = playerActor(s);
      const mates = squadmates(s), fw = fireWatchActor(s);
      assert(s.actors.list.length === 14 && mates.length === 12 && fw, `actors ${s.actors.list.length}, squadmates ${mates.length}, fire watch ${!!fw}`);
      let curtains = 0;
      for (const a of mates) {
        const p = s.people[a.who], seat = seatOf(p.berthId), f = figureOf(s, a);
        assert(a.posture === 'lie' && a.spotId === p.berthId && a.x === seat.x && a.z === seat.z && a.y === seat.y && a.outfit === 'pt', `${a.id} ${p.name.family}: ${JSON.stringify(a)}`);
        assert(f.posture === 'lie' && f.look.outfit === 'pt' && f.look.head === null && f.head === seat.head, `${a.id}: figure ${JSON.stringify(f)}`);
        if (a.curtain) curtains++;
      }
      const post = postOf(FIRE_WATCH_POST), ps = seatOf(post.seatId);
      assert(fw.posture === 'sit' && fw.spotId === post.seatId && fw.x === ps.x && fw.z === ps.z && (fw.outfit ?? 'utilities') === 'utilities', `the fire watch: ${JSON.stringify(fw)}`);
      const rack = fixture(seatOf(s.people[s.player.id].berthId).fixture), foot = spotsOf(rack)[0];
      assert(me.x === foot.x && me.z === foot.z && me.face === 'down' && figureOf(s, me).posture === 'stand', `the player: ${JSON.stringify(me)} (foot ${JSON.stringify(foot)})`);
      const fwp = s.people[fw.who];
      console.log(`      ${clockText(s.clock.ms)}: 14 actors, ${mates.length} squadmates lying in PT kit, ${curtains} behind drawn curtains (CURTAIN_FRAC ${CURTAIN_FRAC}); the fire watch ${fwp.service.rank} ${fwp.name.family} (${fwp.service.unitId}) sitting at ${post.seatId}; the player at (${me.x}, ${me.z}) facing ${me.face}`);
      console.log(`      ${mates.map(a => `${s.people[a.who].name.family} ${a.spotId.replace('f:e1:bay-2-1:', '')}${a.curtain ? ' (curtain)' : ''}`).join(', ')}`);
    },
  },
  {
    name: 'at 12:40 every squadmate sits or stands at their own rack (its edge, their footlocker, their locker), no two on one spot, in utilities with no cover indoors',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 12 + 40 / 60 });
      const s = g.state, mates = squadmates(s);
      const spots = new Set();
      for (const a of mates) {
        const p = s.people[a.who], seat = seatOf(p.berthId);
        const own = [seat.fixture, seat.lockerId, seat.footlockerId].filter(Boolean);
        const spotFixture = a.spotId.slice(0, a.spotId.lastIndexOf('#'));
        assert(['sit', 'stand'].includes(a.posture ?? 'stand') && own.includes(spotFixture), `${a.id} ${p.name.family}: ${a.posture} at ${a.spotId} (theirs: ${own.join(', ')})`);
        assert(!spots.has(a.spotId) && !spots.has(`${a.x},${a.z}`), `${a.id}: a second on ${a.spotId}`);
        spots.add(a.spotId); spots.add(`${a.x},${a.z}`);
        const f = figureOf(s, a);
        assert((a.outfit ?? 'utilities') === 'utilities' && f.look.outfit === 'utilities' && f.look.head === null, `${a.id}: ${JSON.stringify(f.look)}`);
      }
      const sit = mates.filter(a => a.posture === 'sit').length;
      console.log(`      ${clockText(s.clock.ms)}: ${sit} sitting, ${mates.length - sit} standing at their lockers, every one at their own rack, ${mates.length} different spots (a pose lasts ${POSE_PERIOD_MS / 3_600_000} h)`);
      console.log(`      ${mates.map(a => `${s.people[a.who].name.family} ${a.posture ?? 'stand'} ${a.spotId.replace('f:e1:bay-2-1:', '')}`).join(', ')}`);
    },
  },
  {
    name: 'through 22:00 lived facing the squad nobody\'s posture changes while seen, nor anywhere the fog is not fully dark; turned away, all twelve lie down within 1 game second (the sheet §8, item 11)',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 21 + 59 / 60 });
      const s = g.state, me = playerActor(s);
      put(me, 54.8, aisle(), 'up');
      const inView = (a) => inSight(s, eyeOf(s, me), a.x, a.z);
      let prev = new Map(s.actors.list.map(a => [a.id, { key: poseKey(a), seen: inView(a) }]));
      let changedSeen = 0, changedUnseen = 0, ticks = 0;
      const d0 = placeStats(s).deferred;
      for (; ticks < 20 * 120; ticks++) {                             // (21:59:xx to past 22:01)
        g.step(1);
        for (const a of s.actors.list) {
          const p = prev.get(a.id), k = poseKey(a);
          if (p && p.key !== k) { if (p.seen) changedSeen++; else changedUnseen++; }
        }
        prev = new Map(s.actors.list.map(a => [a.id, { key: poseKey(a), seen: inView(a) }]));
      }
      const mates = squadmates(s);
      const lyingFacing = mates.filter(a => a.posture === 'lie').length, seenNow = mates.filter(a => canSee(s, me, a)).length;
      const deferred = placeStats(s).deferred - d0;
      assert(changedSeen === 0, `${changedSeen} poses changed while seen`);
      assert(lyingFacing < 12 && seenNow > 0 && deferred > 0, `facing the squad at ${clockText(s.clock.ms)}: ${lyingFacing} lying, ${seenNow} seen, ${deferred} held back`);
      // (turned away: at the bay door facing the hall, the racks behind beyond the awareness radius)
      const d = door();
      put(me, (d.a + d.b) / 2, d.at - 0.45, 'down');
      const t0 = s.clock.ms;
      g.step(20);
      const lying = squadmates(s).filter(a => a.posture === 'lie').length;
      assert(lying === 12, `turned away, after ${(s.clock.ms - t0) / 1000} s: ${lying} of 12 lying`);
      console.log(`      ${ticks} ticks from 21:59 facing north from the aisle: ${changedUnseen} poses changed out of sight, ${changedSeen} in sight; at ${clockText(t0)} ${lyingFacing} of 12 lying, ${seenNow} seen, ${deferred} changes held back while seen`);
      console.log(`      turned away at the door: all 12 lying ${(s.clock.ms - t0) / 1000} s later (each looked at once a game second, on its bucket)`);
    },
  },
  {
    name: 'thirty minutes lived: the actors are the same fourteen with the same ids; out to the ground and back, the same people, made again at whereIs with new ids, the player\'s kept',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 12 + 40 / 60 });
      const s = g.state;
      const ids0 = s.actors.list.map(a => `${a.id}:${a.who}`).join();
      const t0 = performance.now();
      g.run(30 * MIN_MS);
      const runS = (performance.now() - t0) / 1000;
      const ids1 = s.actors.list.map(a => `${a.id}:${a.who}`).join();
      assert(ids0 === ids1 && s.actors.list.length === 14, `ids moved: ${ids0} → ${ids1}`);
      const who0 = s.actors.list.map(a => a.who).sort().join(), playerAid = s.player.actor;
      g.step(1, { act: ['debug:go:melas.ground:530:224:down'] });
      g.step(2);
      const onGround = s.actors.list.map(a => a.id).join();
      assert(s.places.live.area === 'melas.ground' && s.actors.list.length === 1 && s.actors.list[0].id === playerAid, `on the ground: ${onGround}`);
      g.step(20);
      const me = playerActor(s);
      const foot = spotsOf(fixture(seatOf(s.people[s.player.id].berthId).fixture))[0];
      g.step(1, { act: [`debug:go:${AREA}:${foot.x}:${foot.z}:down`] });
      g.step(2);
      const back = s.actors.list;
      const who1 = back.map(a => a.who).sort().join();
      assert(who1 === who0 && back.length === 14 && me.id === playerAid, `back: ${back.length} actors, the same people ${who1 === who0}`);
      assert(back.filter(a => a.id !== playerAid).every(a => Number(a.id.slice(1)) > 14), `new ids: ${back.map(a => a.id).join(' ')}`);
      for (const a of back) if (a.id !== playerAid) { const w = whereIs(s, a.who); assert(a.x === w.x && a.z === w.z && (a.posture ?? 'stand') === w.posture, `${a.id}: not at whereIs ${JSON.stringify({ a, w })}`); }
      console.log(`      30 game minutes lived (${fmt(runS, 1)} s here): ${s.actors.list.length} actors, ids ${ids0 === ids1 ? 'steady' : 'moved'}; on the ground: ${onGround}; back in the bay: ${back.map(a => a.id).join(' ')}, the same ${back.length} people at whereIs`);
    },
  },
  {
    name: 'a 15-minute wait across taps: facing the squad, those in sight keep their pose through it and lie down once you look away; out of the bay, it ends with all twelve lying and the fire watch at the post (TIME §5.9, by the live rule; v0.0.3\'s review: nine changed in one frame at reveille, seven in sight)',
    fn() {
      // (facing them the whole wait from the aisle)
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 21 + 55 / 60 });
      const s = g.state, me = playerActor(s);
      put(me, 54.8, aisle(), 'up');
      const inView = (a) => inSight(s, eyeOf(s, me), a.x, a.z);
      const before = new Map(squadmates(s).map(a => [a.id, { key: poseKey(a), seen: inView(a) }]));
      const t0 = s.clock.ms;
      g.skipNow({ activity: 'wait', planMs: 15 * MIN_MS, mask: 'D' });
      const mates = squadmates(s);
      const seenChanged = mates.filter(a => before.get(a.id).seen && before.get(a.id).key !== poseKey(a)).length;
      const seenBefore = [...before.values()].filter(v => v.seen).length, lyingFacing = mates.filter(a => a.posture === 'lie').length;
      // (then turned away at the bay door: each looked at on its second's bucket, all down within a game second)
      const d = door();
      put(me, (d.a + d.b) / 2, d.at - 0.45, 'down');
      g.step(20);
      const lyingAway = squadmates(s).filter(a => a.posture === 'lie').length;
      // (out in the hall the whole wait, the bay's door shut behind you: all of them by its end, and the fire watch at the post)
      const h = createGame({ scenario: 'barracks', seed: SEED, hour: 21 + 55 / 60 });
      put(playerActor(h.state), (d.a + d.b) / 2, d.at + 1.4, 'down');
      const beforeH = squadmates(h.state).filter(a => a.posture === 'lie').length;
      h.skipNow({ activity: 'wait', planMs: 15 * MIN_MS, mask: 'D' });
      const lyingH = squadmates(h.state).filter(a => a.posture === 'lie').length, fw = fireWatchActor(h.state);
      console.log(`      ${clockText(t0)} to ${clockText(s.clock.ms)} waited facing the squad: ${seenBefore} in sight before, ${seenChanged} of them changed; ${lyingFacing} of 12 lying at the end; turned away, ${lyingAway} lying a second later`);
      console.log(`      the same wait out in the hall, the bay's door shut: ${beforeH} lying before, ${lyingH} after, the fire watch ${fw.posture} at ${fw.spotId}`);
      assert(seenBefore > 0 && seenChanged === 0 && lyingFacing < 12, JSON.stringify({ seenBefore, seenChanged, lyingFacing }));
      assert(lyingAway === 12, `turned away after the wait: ${lyingAway} of 12 lying`);
      assert(beforeH === 0 && lyingH === 12 && fw.posture === 'sit' && fw.spotId === postOf(FIRE_WATCH_POST).seatId, `facing away: before ${beforeH}, after ${lyingH}, fire watch ${JSON.stringify(fw)}`);
    },
  },
  {
    name: 'a save and load mid-run carries on byte for byte: two runs through 22:00 with the player turning, one saved and loaded halfway, end with the same digest',
    fn() {
      const turn = (g) => { const me = playerActor(g.state), k = Math.floor(g.state.clock.tick / 300) % 4; me.face = ['up', 'right', 'down', 'left'][k]; };
      const run = (split) => {
        const g = createGame({ scenario: 'barracks', seed: SEED, hour: 21 + 59 / 60 });
        put(playerActor(g.state), 54.8, aisle(), 'up');
        for (let t = 0; t < 2400; t++) {
          if (t === split) g.load(g.save());
          turn(g);
          g.step(1);
        }
        return { digest: g.digest(), ids: g.state.actors.list.map(a => a.id).join(), lying: squadmates(g.state).filter(a => a.posture === 'lie').length };
      };
      const a = run(-1), b = run(1200);
      assert(a.digest === b.digest && a.ids === b.ids, JSON.stringify({ a, b }));
      console.log(`      2,400 ticks from 21:59 turning every 15 s: ${a.digest} straight, ${b.digest} with a save and load at tick 1,200; ${a.lying} of 12 lying at the end`);
    },
  },
  {
    name: 'the postures by hour, and the actors layer\'s cost a tick against its 0.25 ms (CONTRACTS §6)',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 0 });
      const s = g.state, ids = placed(s).filter(id => id !== s.player.id);
      const rows = [];
      for (let h = 0; h <= 24; h += 2) {
        const ms = s.clock.ms + h * 3_600_000;
        const n = { lie: 0, sit: 0, stand: 0, away: 0 };
        for (const id of ids) { const w = whereIs(s, id, ms); n[w.away ? 'away' : w.posture]++; }
        rows.push(`${clockText(ms).slice(0, 5)} ${n.lie}/${n.sit}/${n.stand}`);
      }
      // (the layer alone, a tick at a time over two game minutes at 12:40, the player looking at the squad)
      const g2 = createGame({ scenario: 'barracks', seed: SEED, hour: 12 + 40 / 60 });
      const s2 = g2.state;
      put(playerActor(s2), 54.8, aisle(), 'up');
      const us = [];
      for (let t = 0; t < 2400; t++) {
        const t0 = performance.now();
        actorsStep(s2, {}, g2.bus, {});
        us.push((performance.now() - t0) * 1000);
        s2.clock.ms += TICK_MS;
      }
      us.sort((a, b) => a - b);
      const mean = us.reduce((x, y) => x + y, 0) / us.length, p99 = us[Math.floor(0.99 * us.length)];
      // (the ceiling in the foreground's terms: this process may run in macOS's background band, helpers.mjs machine())
      const K = machine().k;
      assert(mean <= 250 * K, `the actors layer: ${fmt(mean, 1)} µs a tick (limit 250 × ${fmt(K, 2)})`);
      console.log(`      lying/sitting/standing of the squad's twelve and the fire watch, through Sol ${marsClock(s.clock.ms, LON).sol}: ${rows.join(', ')}`);
      console.log(`      the actors layer: ${fmt(mean, 1)} µs a tick mean, ${fmt(p99, 1)} µs p99 (limit 250 µs mean × ${fmt(K, 2)} here), ${placeStats(s2).checks} looks in 2,400 ticks`);
    },
  },
  {
    name: 'a barracks started at { area, x, z, face } (the URL\'s ?area=&at=, the bench\'s scene) puts the player there, with the squad wherever whereIs has them',
    fn() {
      const out = createGame({ scenario: 'barracks', seed: SEED, hour: 23, at: { area: 'melas.ground', x: 530, z: 224, face: 'left' } });
      const me = playerActor(out.state);
      assert(out.state.places.live.area === 'melas.ground' && me.x === 530 && me.z === 224 && me.face === 'left' && out.state.actors.list.length === 1, JSON.stringify({ live: out.state.places.live, me, n: out.state.actors.list.length }));
      const bay = createGame({ scenario: 'barracks', seed: SEED, hour: 23, at: { area: AREA, x: 54.8, z: aisle(), face: 'right' } });
      const me2 = playerActor(bay.state);
      assert(me2.x === 54.8 && me2.face === 'right' && bay.state.actors.list.length === 14 && squadmates(bay.state).every(a => a.posture === 'lie'), JSON.stringify(me2));
      console.log(`      at the street (530, 224): ${out.state.actors.list.length} actor, the player's; at the aisle (54.8, ${aisle()}) facing right: ${bay.state.actors.list.length} actors, the squad asleep (the bench's squadbay-night start)`);
    },
  },
];
