// OLYMPUS tests: opfor-brain, the role-player's procedure (src/sim/scenarios/opfor.js; COMBAT §7.11; the build sheet v0.0.19 §1 L-opfor, §6; opfor.md §2.3, §5): the turn to a cue and the aim on the door, the first round's time, the give, the dash, the choice by felt, the sensor, the stoppage, the save.
//
// The fixture is tests/opfor-world.mjs liveGame: test-shoothouse's real lane with setup 'room:2' (room 1 cleared, the stack on room
// 2's pull door, GO given) or 'room:3', the role-players filled (&opfor=live with the cards forced), you out of stop motion; a
// case opens a door itself (places/model.js setOpening) and, where it needs a marine in his eyes, puts you in room 2's doorway
// (20.6, 14.9) facing in, pressing X at every pause so time runs (opfor.md §5 asks "a drill-world bare state": this is the
// house's own record, which the brain reads, with the scene's actors and rules running, my call). Each case prints its numbers
// and fails without its mechanism (the negative controls are said in each).
import { assert, near, fmt } from './helpers.mjs';
import { liveGame, rp, rpActor, liveOf } from './opfor-world.mjs';
import { checkIds } from './ids-check.mjs';
import { setOpening, openingState } from '../src/sim/places/model.js';
import { leaveStop, gunOn } from '../src/sim/arms/shooting.js';
import { holderOf } from '../src/sim/arms/kit.js';
import { gunField, actionMs, tempoFor, beliefOf } from '../src/sim/arms/firearms.js';
import { subsOf } from '../src/sim/arms/drills.js';
import { aimMsOf } from '../src/sim/arms/shot.js';
import { rowPlan } from '../src/sim/arms/specials.js';
import { TURN_MS } from '../src/sim/arms/turners.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { takeInMs } from '../src/sim/combat/react.js';
import { feltOf, bandN, hardOf, blockOf } from '../src/sim/combat/supp.js';
import { burst } from '../src/sim/combat/burst.js';
import { BODY_GAP_M } from '../src/sim/combat/bundle.js';
import { valueOf } from '../src/sim/skills/templates.js';
import { POSTS } from '../src/data/people/posts.js';
import { OPFOR_SPOTS } from '../src/data/places/house-opfor.js';
import { TICK_MS } from '../src/core/clock.js';
import {
  opforSheet, opforLook, opforNow, opforHit, choiceOf, rpShocked, parseOpfor, opforCode, drawCards, RP_Q, CHOICE_DWELL_MS, GIVE_DROP_MS, DASH_MAX_MS, DASH_MAX_M, HELD_SHORT_MS,
} from '../src/sim/scenarios/opfor.js';

const whole = (ms) => Math.ceil(ms / TICK_MS) * TICK_MS;
// (X at every pause: time runs, you never fire)
const LEAVE = (st) => (st.stop?.mode === 'stop' && st.stop.phase === 'choose' ? { act: [{ act: 'stop', args: { step: 'leave', tempo: 'normal' } }] } : {});
// (room 2's door opened, you out of stop motion: the fixture of most cases)
function roomTwo({ seed = 48213, tier = 'private', opfor = 'live:fight,fight', setup = 'room:2', door = 'o:w4:r2' } = {}) {
  const w = liveGame({ seed, tier, opfor, setup }), s = w.s;
  if (s.stop) leaveStop(s, w.g.bus, 'scene');
  w.g.step(4, LEAVE);
  return { ...w, open: () => setOpening(s, door, 'open', { atMs: s.clock.ms }), inDoor: (x = 20.6, z = 14.9, head = Math.PI / 2) => { const me = w.g.me(); me.x = x; me.z = z; me.$px = x; me.$pz = z; me.headRad = head; me.face = 'down'; } };
}

export default [
  {
    name: 'opfor-brain: the two posts draw two generated marines of the cadre (a lance corporal or a corporal), their sheet COMBAT §7.9\'s at q 0.6 (Marksmanship and Weapon handling 12, Fieldcraft and Awareness 10, CQC 9, Warfighting 22); everyone else\'s record is the lane\'s without them; the URL\'s cards read and drawn',
    fn() {
      const w = liveGame({ seed: 48213, tier: 'sgt' }), s = w.s, plain = liveGame({ seed: 48213, tier: 'sgt', opfor: null });
      const sheet = opforSheet(RP_Q), rows = [];
      for (const stand of ['2a', '3a']) {
        const T = rp(w.g, stand), p = s.people[T.live.who];
        const v = (k) => valueOf(s, T.live.who, k);
        rows.push(`${stand} ${p.service.rank} (${POSTS[OPFOR_SPOTS[stand].post].what}), card ${T.live.card}: Mrk ${v('marksmanship')}, WH ${v('weapons')}, FC ${v('fieldcraft')}, Awr ${v('awareness')}, CQC ${v('cqc')}, WF ${p.skills.os}, H ${hardOf(s, T.live.who)}`);
        assert(['LCpl', 'Cpl'].includes(p.service.rank) && p.service.billet === POSTS[OPFOR_SPOTS[stand].post].key, JSON.stringify(p.service));
        assert(JSON.stringify(p.skills) === JSON.stringify(sheet), 'his sheet opforSheet\'s');
        assert(v('marksmanship') === 12 && v('weapons') === 12 && v('fieldcraft') === 10 && v('awareness') === 10 && v('cqc') === 9 && p.skills.os === 22 && p.skills.cls === 'cop', JSON.stringify(p.skills));
        assert(s.people[T.live.who].kit.worn.mask && gunField(s.items[gunOn(s, T.live.who)], 'chamber') === 'live' && s.items[gunOn(s, T.live.who)].mode === 'safe', 'Condition 1, masked');
      }
      console.log(`      ${rows.join('\n      ')}`);
      // (nobody else moved: every other person, the stands but his two, and the items but theirs)
      const other = (st, skip) => JSON.stringify(Object.fromEntries(Object.entries(st.people).filter(([id]) => !skip.has(id))));
      const rpIds = new Set(Object.values(w.fill?.pids ?? {}));
      const same = other(w.s, rpIds) === other(plain.s, new Set()), stands = w.s.armoury.range.turners.filter(T => !T.live).map(T => JSON.stringify(T)).join() === plain.s.armoury.range.turners.filter(T => !['2a', '3a'].includes(T.stand)).map(T => JSON.stringify(T)).join();
      console.log(`      everyone else's record as without them: ${same}; the other five stands: ${stands}; people ${Object.keys(plain.s.people).length} → ${Object.keys(w.s.people).length}`);
      assert(w.hooked || (same && stands), 'nobody else moved');
      // (the URL)
      const cases = ['live', 'live:fight,hide', 'live:give,', 'live:*,give', 'none', null, 'live:run', 'dead'].map(x => [x, parseOpfor(x)]);
      console.log(`      &opfor=: ${cases.map(([x, r]) => `${x} → ${r === null ? 'none' : r.error ? 'error' : JSON.stringify(r.cards)}`).join('; ')}; the code of live:fight,hide ${opforCode('live:fight,hide')}`);
      assert(parseOpfor('live:fight,hide').cards['3a'] === 'hide' && parseOpfor('live:give,').cards['2a'] === 'give' && !parseOpfor('live:give,').cards['3a'] && parseOpfor('none') === null && parseOpfor('live:run').error && parseOpfor('dead').error, 'the URL');
      assert(opforCode('live:fight,hide') === 'live:fight,hide' && opforCode('live') === 'live' && opforCode('none') === null, 'the code');
      // (the cards drawn from the seed alone: 1,000 seeds' shares against the weights)
      const n = { '2a': {}, '3a': {} };
      for (let sd = 1; sd <= 1000; sd++) for (const [k, c] of Object.entries(drawCards(sd))) n[k][c] = (n[k][c] ?? 0) + 1;
      console.log(`      the cards over 1,000 seeds: 2a ${JSON.stringify(n['2a'])} (fight 7, give 3), 3a ${JSON.stringify(n['3a'])} (fight 4, hide 4, give 2)`);
      assert(Math.abs(n['2a'].fight - 700) < 60 && Math.abs(n['3a'].hide - 400) < 60 && !n['2a'].hide, JSON.stringify(n));
    },
  },
  {
    name: 'opfor-brain: he turns to the door\'s opening over TURN_MS and is aimed at it within his aim time (a door left shut leaves him waiting)',
    fn() {
      const w = roomTwo(), s = w.s, T = rp(w.g, '2a'), a = rpActor(w.g, '2a'), L = T.live;
      // (the control: 2 s with the door shut, he waits)
      w.g.step(40, LEAVE);
      const waited = L.st;
      w.open();
      const openAt = s.clock.ms;   // (the leaf set moving before the next tick, which is this ms's)
      let turnAt = null, aimAt = null, aimedAt = null, aimMs = null, off = null;
      for (let i = 0; i < 80 && aimedAt === null; i++) {
        w.g.step(1, LEAVE);
        if (turnAt === null && L.st === 'turn') turnAt = L.turn.fromMs;
        // (the brain's tick is the one stepped: the clock after a step is the next tick's, so his own times are read off his record)
        if (aimAt === null && L.st === 'aim' && L.aiming) { aimAt = L.fromMs; aimMs = L.aiming.untilMs - aimAt; const S = OPFOR_SPOTS['2a']; const t = { x: S.aimAt[0], z: S.aimAt[1], dM: Math.hypot(S.aimAt[0] - a.x, S.aimAt[1] - a.z) }; near(aimMs, whole(aimMsOf(s, L.who, gunOn(s, L.who), t, { ms: aimAt })), 0, 'his aim time'); }
        if (aimedAt === null && s.people[L.who].kit.carry.posture === 'aimed') { aimedAt = s.clock.ms - TICK_MS; const S = OPFOR_SPOTS['2a']; off = Math.abs(Math.atan2(S.aimAt[1] - a.z, S.aimAt[0] - a.x) - a.headRad); }
      }
      console.log(`      the door shut 2 s: ${waited}; opened at +0 (the leaf ${openingState(s, 'o:w4:r2')}): his turn from +${turnAt - openAt} ms, its end +${aimAt - openAt} ms (TURN_MS ${TURN_MS}), his aim ${aimMs} ms, aimed at +${aimedAt - openAt} ms, his head ${fmt(off, 4)} rad off the threshold`);
      assert(waited === 'wait', `shut: ${waited}`);
      assert(turnAt !== null && turnAt - openAt <= TICK_MS && aimAt - turnAt === TURN_MS, JSON.stringify({ openAt, turnAt, aimAt }));
      assert(aimedAt !== null && aimedAt - aimAt === aimMs && off < 1e-3, JSON.stringify({ aimAt, aimedAt, aimMs, off }));
    },
  },
  {
    name: 'opfor-brain: fight: his first round comes at his take-in plus aim plus the pair\'s time (prints by seed)',
    fn() {
      for (const seed of [48213, 1037, 1489397426]) {
        const w = roomTwo({ seed }), s = w.s, T = rp(w.g, '2a'), L = T.live;
        w.open();
        w.g.step(30, LEAVE);
        w.inDoor();
        let seen = null, tin = null, plan = null, first = null;
        for (let i = 0; i < 120 && L.firstAtMs === null; i++) {
          w.g.step(1, LEAVE);
          if (!seen && L.eyes) {
            seen = { ...L.eyes };
            const a = rpActor(w.g, '2a'), me = w.g.me();
            tin = takeInMs(s, L.who, { id: `rp:${T.key}:${seen.key}`, targets: [{ key: seen.key, x: me.x, z: me.z, rangeM: Math.round(Math.hypot(me.x - a.x, me.z - a.z) * 100) / 100, face: 'threat' }], seenMs: seen.seenMs, expect: { [seen.key]: seen.expect }, band: bandN(feltOf(s, L.who, seen.seenMs)) });
          }
          if (!plan && L.eng) {
            const me = w.g.me(), a = rpActor(w.g, '2a'), t = { key: L.eng.key, kind: 'marine', x: me.x, z: me.z, y: 1.35, dM: Math.hypot(me.x - a.x, me.z - a.z), face: 'threat', facingK: 1 };
            const P = rowPlan(s, L.who, 'shot:pair', t, { atMs: L.fromMs, gunId: gunOn(s, L.who), odds: false });
            plan = { at: L.fromMs, aim: P.parts.find(p => p.k === 'aim')?.ms ?? 0, press: P.parts.find(p => p.k === 'press')?.ms ?? 0, first: P.parts.find(p => p.k === 'round').at, rounds: L.eng.rounds.map(r => r.atMs) };
          }
        }
        first = L.firstAtMs;
        console.log(`      seed ${seed}: seen at +0 (expect ${seen?.expect}), the take-in ${tin?.ms} ms (his window ${seen?.untilMs - seen?.seenMs} ms), the pair planned at +${plan?.at - seen?.seenMs}: aim ${plan?.aim} + press ${plan?.press} ms, the first round at +${first - seen?.seenMs} ms`);
        assert(seen && tin && seen.untilMs === whole(seen.seenMs + tin.ms), JSON.stringify({ seen, tin: tin?.ms }));
        assert(plan && plan.at === seen.untilMs && plan.rounds[0] === whole(plan.at + plan.first) && first === plan.rounds[0], JSON.stringify({ plan, first }));
        assert(first - seen.seenMs === whole(seen.seenMs + tin.ms) - seen.seenMs + (plan.rounds[0] - plan.at), 'the sum');
      }
    },
  },
  {
    name: 'opfor-brain: give: from the give\'s first tick his record is a no-shoot showing his hands and your memory of him is dropped (the review of track L: he read a threat with a rifle for the 600 ms of the lowering, and was shot); the rifle lowered, then on the floor held once, hands up, "Don\'t shoot!", and a fresh window identifies hands',
    fn() {
      const w = roomTwo({ opfor: 'live:give,fight' }), s = w.s, T = rp(w.g, '2a'), L = T.live, a = rpActor(w.g, '2a'), gunId = gunOn(s, L.who);
      w.open(); w.g.step(30, LEAVE); w.inDoor();
      const before = `${T.face}/${T.holds}`;
      let eyesEnd = null, handsAt = null;
      // (st 'hands' from the give, the rifle on the floor GIVE_DROP_MS after: the drop's tick is the one stepped, the clock the next's)
      let stAt = null, atGive = null, lowered = null, ident = null, seenAgain = null;
      // (the first pause on him from the give on (its identification made at or after the give): what it reads)
      const look = () => { const Lc = s.mind?.contact?.last; if (!ident && eyesEnd !== null && Lc && Lc.atMs >= eyesEnd && Lc.ids?.includes(T.key) && Lc.ident?.[T.key]) { ident = Lc.ident[T.key]; seenAgain = Lc.atMs; } };
      for (let i = 0; i < 120 && handsAt === null; i++) {
        w.g.step(1, LEAVE); look();
        // (the give's first tick: his record, your memory of him and his rifle's carry, read once)
        if (L.give && eyesEnd === null) { eyesEnd = L.give.atMs; stAt = L.st === 'hands' ? L.fromMs : null; atGive = { rec: `${T.face}/${T.holds}`, known: s.mind?.contact?.known?.[T.key] ?? null, gaveAtMs: L.gaveAtMs }; lowered = s.people[L.who].kit.carry.posture; }
        if (L.rifleId) handsAt = s.clock.ms - TICK_MS;
      }
      const h = holderOf(s, gunId), lying = (s.places.sites[Object.keys(s.places.sites).find(k => (s.places.sites[k].items ?? []).some(x => x.id === gunId))]?.items ?? []).filter(x => x.id === gunId).length;
      const known = s.mind?.contact?.known?.[T.key], fresh = known === undefined || known >= eyesEnd;
      for (let i = 0; i < 120 && !ident; i++) { w.g.step(1, LEAVE); look(); }
      const ids = checkIds(JSON.parse(w.g.save()), w.g.sim.domains);
      console.log(`      before: ${before}; the give at the take-in's end (st 'hands' from +${stAt - eyesEnd} ms): his record ${atGive.rec} on its first tick, your memory of him ${atGive.known === null ? 'dropped' : atGive.known >= eyesEnd ? 'dropped and taken in afresh on that tick' : 'kept'}, his rifle at ${lowered}; the rifle on the floor ${handsAt - eyesEnd} ms later (GIVE_DROP_MS ${GIVE_DROP_MS}); the rifle ${JSON.stringify(h)} (on the floor ${lying}×, ${fmt(Math.hypot(h.ground.x - a.x, h.ground.z - a.z), 2)} m from him); actor.hands ${a.hands}; his record ${T.face}/${T.holds}; his pause +${seenAgain - eyesEnd} ms after the give, identified '${ident}'; ids ${ids.checked} checked, ${ids.invalid.length} invalid, ${ids.dangling.length} dangling`);
      assert(before === 'threat/rifle', before);
      assert(atGive.rec === 'noshoot/hands' && (atGive.known === null || atGive.known >= eyesEnd) && atGive.gaveAtMs === eyesEnd && lowered === 'lowReady', JSON.stringify({ atGive, lowered }));
      assert(stAt === eyesEnd && L.fromMs === eyesEnd && handsAt - eyesEnd === GIVE_DROP_MS && h?.ground && lying === 1 && a.hands === true && T.face === 'noshoot' && T.holds === 'hands', JSON.stringify({ handsAt, eyesEnd, h, lying }));
      assert(fresh && seenAgain !== null && (ident === 'hands' || ident === 'unseen'), JSON.stringify({ ident, seenAgain, known }));
      assert(!ids.invalid.length && !ids.dangling.length, JSON.stringify({ invalid: ids.invalid.slice(0, 4), dangling: ids.dangling.slice(0, 4) }));
      assert(opforLook(s).find(m => m.stand === '2a').rifle.where === 'floor' && opforLook(s).find(m => m.stand === '2a').frame !== 'aim', 'the look');
    },
  },
  {
    name: 'opfor-brain: hide: at his spot in at most 2 s and 3 m on the first cue, crouched and laid on his door; held off a marine\'s body, and ended short where he is past HELD_SHORT_MS',
    fn() {
      const w = roomTwo({ opfor: 'live:fight,hide', setup: 'room:3', door: 'o:w4:r3' }), s = w.s, T = rp(w.g, '3a'), L = T.live, a = rpActor(w.g, '3a'), S = OPFOR_SPOTS['3a'];
      const ruled2 = rp(w.g, '2a').live.st;
      w.open();
      let from = null, at = null;
      for (let i = 0; i < 80 && at === null; i++) { w.g.step(1, LEAVE); if (from === null && L.move) from = L.move.startMs; if (from !== null && !L.move) at = s.clock.ms; }
      const d = Math.hypot(a.x - S.hide[0], a.z - S.hide[1]);
      console.log(`      2a ruled out by the setup: ${ruled2}; 3a on the cue: the dash from +0 to +${at - from} ms (DASH_MAX_MS ${DASH_MAX_MS}), ${fmt(Math.hypot(S.hide[0] - S.start[0], S.hide[1] - S.start[1]), 2)} m (DASH_MAX_M ${DASH_MAX_M}), ${fmt(d, 3)} m off his hide, stance ${a.stance}, then ${L.st}`);
      assert(ruled2 === 'out' && at - from <= DASH_MAX_MS && d < 0.01 && a.stance === 'kneel' && L.st === 'aim', JSON.stringify({ at, from, d, stance: a.stance, st: L.st }));
      // (a marine standing on his way: held, never inside BODY_GAP_M, ended short)
      const v = roomTwo({ opfor: 'live:fight,hide', setup: 'room:3', door: 'o:w4:r3' }), U = rp(v.g, '3a'), b = rpActor(v.g, '3a');
      v.inDoor(16.95, 5.75, 0);
      v.open();
      let least = Infinity, held = 0, endAt = null, startAt = null;
      for (let i = 0; i < 80 && endAt === null; i++) {
        v.g.step(1, LEAVE);
        const me = v.g.me();
        least = Math.min(least, Math.hypot(b.x - me.x, b.z - me.z));
        if (U.live.move) { startAt ??= U.live.move.startMs; held = U.live.move.heldMs; } else if (startAt !== null) endAt = v.s.clock.ms;
      }
      console.log(`      a marine at (16.95, 5.75) on his way: least ${fmt(least, 3)} m (BODY_GAP_M ${BODY_GAP_M}), held ${held} ms, ended short at +${endAt - startAt} ms, ${fmt(Math.hypot(b.x - S.hide[0], b.z - S.hide[1]), 2)} m short of his hide, then ${U.live.st}`);
      assert(least >= BODY_GAP_M - 1e-6 && held > HELD_SHORT_MS - TICK_MS && Math.hypot(b.x - S.hide[0], b.z - S.hide[1]) > 0.1, JSON.stringify({ least, held }));
    },
  },
  {
    name: 'opfor-brain: his choice is rolled once a band change, held CHOICE_DWELL_MS, and he surrenders only pinned with a weapon within 5 m (§7.11\'s T10 shares for his sheet after one and two G-11s)',
    fn() {
      const w = roomTwo({ tier: 'private' }), s = w.s, T = rp(w.g, '2a'), L = T.live, pid = L.who, H = hardOf(s, pid);
      // (the table's shares for his sheet, 2,000 rolls at each felt: one G-11 (60 points) and two (90), less his hardening)
      const one = Math.max(0, Math.min(100, Math.round(60 - H))), two = Math.max(0, Math.min(100, Math.round(90 - H)));
      const share = (felt, near) => { const n = {}; for (let i = 0; i < 2000; i++) { const c = choiceOf(s, pid, { felt, atMs: i * TICK_MS, key: 'rp:test', near: () => near }); n[c.what] = (n[c.what] ?? 0) + 1; } return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, Math.round(v / 20)])); };
      const s1 = share(one, true), s2 = share(two, true), s2far = share(two, false), s50 = share(50, true);
      console.log(`      his hardening ${H} (T10's corporate security 16): one bang felt ${one} (band ${bandN(one)}) ${JSON.stringify(s1)}; two bangs felt ${two} (band ${bandN(two)}) ${JSON.stringify(s2)} with a weapon within 5 m, ${JSON.stringify(s2far)} without; suppressed at 50 ${JSON.stringify(s50)} (T10 two bangs: cover 45, freeze 45, surrender 10)`);
      assert(bandN(one) < 2 ? s1.fight === 100 : true, JSON.stringify(s1));
      assert(bandN(two) === 3 && !s2.fight && s2.surrender > 4 && s2.surrender < 17 && !s2far.surrender && !s50.surrender, JSON.stringify({ s2, s2far, s50 }));
      // (in the lane: two G-11s in room 2, then his choice rolled at his first moment able (the startle's or the stun's end), once a band change, again only after the dwell)
      const mid = [22.75, 16.9];
      burst(s, w.g.bus, { id: 'i-test-1', model: 'g11', x: mid[0], z: mid[1], atMs: s.clock.ms, byId: null, called: false });
      w.g.step(2, LEAVE);
      burst(s, w.g.bus, { id: 'i-test-2', model: 'g11', x: mid[0], z: mid[1], atMs: s.clock.ms, byId: null, called: false });
      const rolls = [];
      let able = null;
      for (let i = 0; i < 160; i++) {
        w.g.step(1, LEAVE);
        if (able === null && !rpShocked(s, pid, s.clock.ms)) able = s.clock.ms;
        const c = L.choice;
        if (c && (!rolls.length || rolls.at(-1).atMs !== c.atMs)) rolls.push({ ...c, felt: feltOf(s, pid, c.atMs) });
      }
      const blk = blockOf(s, pid);
      console.log(`      after two G-11s: felt ${feltOf(s, pid, able)} at his first moment able (+${able - (blk.startleFromMs ?? able)} ms from the startle, stun to ${blk.stunUntilMs ? blk.stunUntilMs - able : 0}); rolls ${rolls.map(r => `${r.what}${r.grade ? `(${r.grade})` : ''} band ${r.band} at +${r.atMs - able} ms`).join(', ')}; st ${L.st}`);
      assert(rolls.length >= 1 && rolls[0].atMs === able && rolls[0].band >= 2, JSON.stringify({ rolls, able }));
      for (let i = 1; i < rolls.length; i++) {
        const p = rolls[i - 1], r = rolls[i];
        assert(r.band !== p.band || ((p.what === 'cover' || p.what === 'freeze') && r.atMs - p.atMs >= CHOICE_DWELL_MS), JSON.stringify({ p, r }));
      }
    },
  },
  {
    name: 'opfor-brain: two torso or one head: he sits where he stands, armed, stoppedAtMs at the round, never turned away (one torso and a miss leave him up; a round handed twice counts once)',
    fn() {
      const w = roomTwo(), s = w.s, T = rp(w.g, '2a'), a = rpActor(w.g, '2a'), now = s.clock.ms, me = s.player.id;
      const hit = (id, part, zone, atMs) => { T.hits.push({ shotId: id, part, zone, ring: false, through: false, at: null, atMs, by: 'me' }); return opforHit(s, w.g.bus, T, { id, fired: true, who: me, atMs }); };
      const r1 = hit('shA', 'torso', 'A', now), r1b = opforHit(s, w.g.bus, T, { id: 'shA', fired: true, who: me, atMs: now }), r2 = hit('shM', 'torso', 'miss', now + 50);
      const upAfter = T.live.st;
      const r3 = hit('shC', 'torso', 'C', now + 100);
      const look = opforLook(s).find(m => m.stand === '2a'), gun = s.people[T.live.who].kit.worn.sling;
      console.log(`      one A: ${JSON.stringify(r1)} (again: ${JSON.stringify(r1b)}); a miss: ${JSON.stringify(r2)} → ${upAfter}; a C: ${JSON.stringify(r3)} → ${T.live.st}, stoppedAtMs +${T.stoppedAtMs - now}, ${a.posture}, his post ${s.people[T.live.who].post.posture}, the rifle on his sling ${!!gun}, drawn ${look.frame} with it across his ${look.rifle.where}, turned away ${T.awayAtMs}`);
      assert(upAfter !== 'down' && r1b.again && r1.torso === 1, JSON.stringify({ r1, r1b, upAfter }));
      assert(T.live.st === 'down' && T.stoppedAtMs === now + 100 && a.posture === 'sit' && gun && look.frame === 'sit' && look.rifle.where === 'knees' && T.awayAtMs === null, JSON.stringify({ st: T.live.st, stopped: T.stoppedAtMs }));
      const v = roomTwo(), U = rp(v.g, '2a'), t0 = v.s.clock.ms;
      U.hits.push({ shotId: 'shH', part: 'head', zone: 'head', ring: false, through: false, at: null, atMs: t0, by: 'two' });
      opforHit(v.s, v.g.bus, U, { id: 'shH', fired: true, who: v.H.twoPid, atMs: t0 });
      console.log(`      one head: ${U.live.st}, stoppedAtMs +${U.stoppedAtMs - t0}`);
      assert(U.live.st === 'down' && U.stoppedAtMs === t0, 'one head');
    },
  },
  {
    name: 'opfor-brain: his stoppage clears in his IA time (drills.js subsOf summed over his Weapon handling\'s actionMs), and he fires again',
    fn() {
      const w = roomTwo(), s = w.s, T = rp(w.g, '2a'), L = T.live;
      w.open(); w.g.step(30, LEAVE); w.inDoor();
      for (let i = 0; i < 120 && !L.eng; i++) w.g.step(1, LEAVE);
      const gunId = gunOn(s, L.who), gun = s.items[gunId];
      gun.chamber = 'dud';
      let ia = null;
      for (let i = 0; i < 80 && !ia; i++) { w.g.step(1, LEAVE); if (L.ia) ia = { ...L.ia }; }
      const roller = rollerOf(s, L.who, { ms: ia.fromMs }), list = subsOf(ia.macro, beliefOf(s, gunId));
      const want = whole(list.reduce((n, x) => n + actionMs(roller, gun, x, { tempo: tempoFor(x, 'normal') }), 0));
      const fired0 = L.fired;
      let cleared = null;
      for (let i = 0; i < 120 && cleared === null; i++) { w.g.step(1, LEAVE); if (!L.ia) cleared = s.clock.ms; }
      const after = gunField(gun, 'chamber');
      for (let i = 0; i < 60 && L.fired === fired0 && !liveOf(w.g).casualty; i++) w.g.step(1, LEAVE);
      console.log(`      a dud: ${ia.macro} (${ia.list.join(', ')}), ${ia.untilMs - ia.fromMs} ms against ${want} ms at Weapon handling ${valueOf(s, L.who, 'weapons')}, cleared at +${cleared - ia.fromMs} ms, the chamber ${after}; rounds ${fired0} → ${L.fired}`);
      assert(ia.macro === 'ia' && ia.untilMs - ia.fromMs === want && cleared - ia.fromMs >= want && cleared - ia.fromMs <= want + TICK_MS && after === 'live', JSON.stringify({ ia, want, cleared, after }));
      assert(L.fired > fired0 || !!liveOf(w.g).casualty, `fired ${fired0} → ${L.fired}`);
    },
  },
  {
    name: 'opfor-brain: a save at his turn, mid-dash and between his two rounds loads and carries on byte for byte, every item held once',
    fn() {
      const points = [];
      const check = (w, what) => {
        const json = w.g.save(), g2 = w.again();
        g2.load(json);
        if (g2.state.stop && !w.s.stop) leaveStop(g2.state, g2.bus, 'scene');
        w.g.step(40, LEAVE); g2.step(40, LEAVE);
        const ids = checkIds(JSON.parse(json), w.g.sim.domains);
        points.push(`${what}: ${w.g.digest() === g2.digest() ? 'the same' : 'DIFFERS'} (${ids.invalid.length} invalid, ${ids.dangling.length} dangling)`);
        assert(w.g.digest() === g2.digest() && !ids.invalid.length && !ids.dangling.length, JSON.stringify({ what, invalid: ids.invalid.slice(0, 3), dangling: ids.dangling.slice(0, 3) }));
      };
      const a = roomTwo(); a.open();
      for (let i = 0; i < 20 && rp(a.g, '2a').live.st !== 'turn'; i++) a.g.step(1, LEAVE);
      check(a, 'his turn');
      const b = roomTwo({ opfor: 'live:fight,hide', setup: 'room:3', door: 'o:w4:r3' }); b.open();
      for (let i = 0; i < 30 && !(rp(b.g, '3a').live.move && b.s.clock.ms - rp(b.g, '3a').live.move.startMs >= 300); i++) b.g.step(1, LEAVE);
      check(b, 'mid-dash');
      const c = roomTwo(); c.open(); c.g.step(30, LEAVE); c.inDoor();
      for (let i = 0; i < 160 && rp(c.g, '2a').live.fired < 1; i++) c.g.step(1, LEAVE);
      check(c, 'between his rounds');
      console.log(`      ${points.join('; ')}`);
    },
  },
];
