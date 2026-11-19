// OLYMPUS tests: house-unseen, nobody drawn before you have seen him (the build sheet v0.0.23 item 6, §0 items 20 and 34, §6 B; the overhaul's M4; the user, 2026-11-17: "a person or a thing is drawn only where it is seen now, or as last seen, never before it has been seen").
//
// The headless live lane through the view's own people half (src/render/memory.js recall with src/sim/places/known.js
// seenEver, as view.js calls them; flawless-known.mjs viewPeople, no three.js): at GO on "Stack and clear, live" 48213 neither
// role-player is drawn (v0.0.22 drew both, dimmed but whole, in rooms nobody had looked into: M4); each is drawn from the tick
// his spot is in your sight, then as last seen, and never where you cannot see him but his remembered spot (F87's node half:
// the tier one's lane quick, three cards and four seeds heavy); a save once room 2 is entered loads with room 2's man drawn and
// room 3's hidden; a man who gave up (forgotten by men.js forget(), so on nobody's sightings) in a room you entered is drawn
// after a load. The page half (the stage's figures, view.stats.people) is ui-unknown's people case.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, houseKeysBot, houseFuzzBot, runHouse } from './bots/house.mjs';
import { viewPeople, peopleGauge, f87Line, KNOWN_ENFORCED } from './flawless-known.mjs';
import { contactOf } from '../src/sim/people/mind.js';
import { forget } from '../src/sim/combat/men.js';
import * as KNOWN from '../src/sim/places/known.js';

const fmt = (o) => JSON.stringify(o);
const men = (s) => s.armoury.range.turners.filter(T => T.live);
const legs = (s) => s.armoury.range.house.rooms;
const rowOf = (rows, s, stand) => { const T = men(s).find(t => t.stand === stand); return rows.find(r => r.who === T.live.who) ?? null; };
const live = (o = {}) => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', opfor: 'live', ...o });
const name = (s, r) => { const H = s.armoury.range.house; return r.who === H.twoPid ? '#2' : r.who === H.chiefPid ? 'instructor' : men(s).find(t => t.live.who === r.who)?.stand ?? r.who; };

// (the tier one's live lane on 48213, played once for the quick cases: F87's gauge over it, the view's answers at GO, the save as
// room 2 is entered)
let LANE = null;
function laneA() {
  if (LANE) return LANE;
  const g = live(), P = peopleGauge();
  let go = null, json = null, saveAt = null;
  const r = runHouse(g, houseHonestBot(), { maxMs: 10 * 60_000, each: (gg) => {
    const s = gg.state, H = s.armoury.range.house;
    P.each(s);
    if (!go && H.goAtMs === s.clock.ms) go = { now: viewPeople()(s), old: viewPeople({ legacy: true })(s), names: null, ms: s.clock.ms - s.meta.createdMs };
    if (go && !go.names) go.names = Object.fromEntries([...go.now].map(x => [x.id, name(s, x)]));
    if (!json && legs(s)[1].state === 'entered') { json = gg.save(); saveAt = { ms: s.clock.ms - H.goAtMs, seen: Object.keys(contactOf(s)?.seenAt ?? {}).map(k => men(s).find(T => T.key === k)?.stand ?? k) }; }
  } });
  return (LANE = { r, F: P.end().F87, go, json, saveAt });
}

export default [
  {
    name: 'at GO on the live lane 48213 no role-player is drawn (v0.0.22\'s view drew both in rooms nobody had looked into: M4); your #2 and the instructor are',
    fn() {
      const { go } = laneA(), show = (rows) => rows.map(r => `${go.names[r.id]} ${r.how}`).join(', ');
      console.log(`      GO at ${go.ms} ms from the fill: now ${show(go.now)}; v0.0.22's ${show(go.old)}`);
      const rp = (rows) => rows.filter(r => /^[23]a$/.test(go.names[r.id]));
      assert(rp(go.now).length === 2 && rp(go.now).every(r => r.how === 'hidden'), fmt(go.now));
      assert(go.now.filter(r => !/^[23]a$/.test(go.names[r.id])).every(r => r.how !== 'hidden'), fmt(go.now));
      assert(rp(go.old).every(r => r.how !== 'hidden'), `the teeth: v0.0.22's view hid someone ${fmt(go.old)}`);
    },
  },
  {
    name: 'F87 (node half): the tier one\'s live lane on 48213, every frame: nobody drawn before his first sighting, never where he is out of sight but as last seen; v0.0.22\'s view fails it; your #2 and the instructor are never hidden',
    fn() {
      assert(KNOWN_ENFORCED.has('F87'), 'F87 enforced');
      const { r, F } = laneA();
      console.log(`      tierone live: ${r.ticks} ticks${r.done ? '' : ' (not done)'}; ${f87Line(F)}`);
      const g = live(), P = peopleGauge({ legacy: true });
      runHouse(g, houseHonestBot(), { maxTicks: 760, each: (gg) => P.each(gg.state) });
      const T = P.end().F87;
      console.log(`      the teeth, v0.0.22's view on the lane's first 760 ticks (GO at 741): F87 ${T.ok ? 'MET' : 'OPEN'}, at GO ${fmt(T.atGo)}, shown before his first sighting ${T.shownBefore.length}${T.shownBefore.length >= 6 ? ' or more' : ''}`);
      assert(F.ok && r.done && F.atGo && F.shownFrames > 0, fmt(F));
      assert(!T.ok && T.shownBefore.length > 0, fmt(T));
      // (the staff's teeth: the combat branch given to your #2 and the instructor too hides one of them on the lane)
      const g3 = live(), P3 = peopleGauge({ staffRule: false });
      runHouse(g3, houseHonestBot(), { maxTicks: 1100, each: (gg) => P3.each(gg.state) });
      const S = P3.end().F87;
      console.log(`      the staff's teeth, the combat branch for your #2 and the instructor too, the lane's first 1100 ticks: ${S.staffHidden.length}${S.staffHidden.length >= 6 ? ' or more' : ''} frames with one hidden, the first ${fmt(S.staffHidden[0] ?? null)}; with the rule ${F.staffHidden.length}`);
      assert(F.staffHidden.length === 0 && S.staffHidden.length > 0, fmt({ with: F.staffHidden, without: S.staffHidden }));
    },
  },
  {
    name: 'a load keeps those seen before it: a save as room 2 is entered loads with room 2\'s man drawn and room 3\'s hidden; F87 holds on from the load',
    fn() {
      const { json, saveAt } = laneA();
      assert(json, 'room 2 entered');
      const g2 = live();
      g2.load(json);
      const s = g2.state, rows = viewPeople()(s), r2 = rowOf(rows, s, '2a'), r3 = rowOf(rows, s, '3a');
      console.log(`      saved at ${saveAt.ms} ms after GO, your sightings ${fmt(saveAt.seen)}; after the load: 2a ${r2.how}${r2.inSight ? ' (in sight)' : ''}, 3a ${r3.how}${r3.inSight ? ' (in sight)' : ''}`);
      assert(r2.how !== 'hidden' && r3.how === 'hidden' && !r3.inSight, fmt({ r2, r3 }));
      const P = peopleGauge();
      P.each(s, { loaded: true });
      const rr = runHouse(g2, houseHonestBot(), { maxTicks: 600, each: (gg) => P.each(gg.state) }), F = P.end().F87;
      console.log(`      on from the load, ${rr.ticks} ticks: ${f87Line(F)}`);
      assert(F.ok, fmt(F));
    },
  },
  {
    name: 'a man forgotten by men.js forget() (as a man who gives up is: on nobody\'s sightings) in a room you entered is drawn after a load though out of sight, and kept the next frame; the rebuild\'s rooms count on a new state\'s first frame only',
    fn() {
      const { json } = laneA();
      const loadTurned = () => {
        const g2 = live();
        g2.load(json);
        const s = g2.state, T = men(s).find(t => t.stand === '2a'), me = s.actors.list.find(a => a.who === s.player.id);
        // (forgotten, as a give's start forgets him (opfor.js forgetMan), and you back at the start mark facing east, the hall's
        // wall between you: out of your sight at the load)
        forget(s, T.key);
        me.x = me.$px = 33.88; me.z = me.$pz = 13.2; me.headRad = 0; me.face = 'right';
        return { g2, s, T };
      };
      const { s, T } = loadTurned(), seen = contactOf(s)?.seenAt?.[T.key] !== undefined, view = viewPeople(), r = rowOf(view(s), s, '2a');
      // (the next frame of the same state, still out of sight: the rooms no longer count, he is the view's memory now)
      const r2 = rowOf(view(s), s, '2a');
      console.log(`      2a after the load (${seen ? 'on your sightings' : 'on nobody\'s sightings'}, ${r.inSight ? 'in sight' : 'out of sight'}): ${r.how}; the next frame ${r2.how}${r2.inSight ? ' (in sight)' : ''}`);
      assert(!seen && !r.inSight && r.how !== 'hidden' && r2.how !== 'hidden', fmt({ seen, r, r2 }));
      // (the teeth: the same load with no room entered (the legs as at GO): he is hidden; and in play the rooms never count)
      const t = loadTurned();
      for (const L of legs(t.s)) { L.state = 'ahead'; L.enteredAtMs = null; }
      const rt = rowOf(viewPeople()(t.s), t.s, '2a');
      const u = loadTurned(), a = u.s.actors.list.find(x => x.who === u.T.live.who);
      const inPlay = KNOWN.seenEver(u.s, a, { rooms: false, sight: () => false }), onLoad = KNOWN.seenEver(u.s, a, { rooms: true, sight: () => false });
      console.log(`      the teeth: no room entered, 2a ${rt.how}; seenEver out of sight in play (the rooms not counted) ${inPlay}, on a load's first frame ${onLoad}`);
      assert(rt.how === 'hidden' && inPlay === false && onLoad === true, fmt({ rt, inPlay, onLoad }));
    },
  },
  {
    name: 'F87 (heavy): live lanes on four seeds by the tier one honest (fight, hide and give), the keys private and the fuzz: nobody drawn before his first sighting',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const lanes = [];
      for (const seed of [48213, 11, 1037, 4028068471]) {
        lanes.push({ seed, tier: 'tierone', opfor: 'live', bot: () => houseHonestBot() }, { seed, tier: 'tierone', opfor: 'live:hide,hide', bot: () => houseHonestBot() },
          { seed, tier: 'tierone', opfor: 'live:give,give', bot: () => houseHonestBot() }, { seed, tier: 'private', opfor: 'live:fight,hide', bot: () => houseKeysBot() }, { seed, tier: 'private', opfor: 'live', bot: () => houseFuzzBot({ seed: 3 }) });
      }
      const bad = [];
      for (const L of lanes) {
        const g = createGame({ scenario: 'test-shoothouse', seed: L.seed, tier: L.tier, opfor: L.opfor }), P = peopleGauge();
        const r = runHouse(g, L.bot(), { maxMs: 10 * 60_000, each: (gg) => P.each(gg.state) }), F = P.end().F87;
        console.log(`      ${L.seed} ${L.tier} ${L.opfor}: ${r.ticks} ticks${r.done ? '' : ' (not done)'}; ${f87Line(F)}`);
        if (!F.ok) bad.push({ L: `${L.seed} ${L.tier} ${L.opfor}`, F });
      }
      console.log(`      ${lanes.length} lanes, ${bad.length} OPEN`);
      assert(!bad.length, fmt(bad.map(b => ({ L: b.L, before: b.F.shownBefore, off: b.F.shownOff, rem: b.F.rememberedInSight }))));
    },
  },
];
