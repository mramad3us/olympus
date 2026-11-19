// OLYMPUS tests: the Seen record's shape and its rules (src/sim/people/seen.js, src/data/portrait.js; the build sheet v0.0.23 §3.1, §6 A).
//
// The user, 2026-11-17: "the portraits need to be more dynamic and show us what we would be seeing, including what they are holding",
// and of the sidearm: "sidearm should have the same stances (low ready, high ready, aimed, etc) as the rifle". The record's key holds
// only what a portrait draws (SEEN_KEYS: never a count, a chamber or a load, as gear's whitelist), changes with each drawn field and
// with nothing else; the facing is read from the viewer's eye (a man turned 150° from you is drawn from behind, 90° side on, 30° front
// on; the check's bands, back only beyond 3π/4); the mirror is always front on; FRAME_SEEN names every frame opforLook gives and
// CARRY_HOW every carry and pistol posture; a board's record for each face the target view warms; the record's bands are the card's;
// and the P-12's three stances and its acts read through gunLook: the draw and the holster on a lane, and (the review of 2026-11-18:
// no pinned lane runs them with the P-12 in the hands, so F97's act rows had no teeth) the press check, the reload and the clearing
// driven from v0.0.17's save with the pistol drawn, through F97's own gauge. Fails today: there is no seen.js.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseBot } from './bots/house.mjs';
import { seenOf, seenKey, standSeen, frameOfSeen, SEEN_KEYS, FACING_FRONT_RAD, FACING_BACK_RAD, AIM_AT_RAD } from '../src/sim/people/seen.js';
import { HOLD_HOWS, POSES, FACINGS, FRAME_SEEN, CARRY_HOW, PORTRAIT_BANDS, PISTOL_ACT_NAMES, portraitBand } from '../src/data/portrait.js';
import { CARRY_RIGS } from '../src/sim/arms/look.js';
import { POSTURES, SLUNG } from '../src/sim/arms/carry.js';
import { opforLook } from '../src/sim/scenarios/opfor.js';
import { HIT_BANDS } from '../src/art/doll/hitcard.js';
import { chooseStep, stepNow } from '../src/sim/arms/shooting.js';
import { handGunOf } from '../src/sim/arms/kit.js';
import { gunLook } from '../src/sim/arms/look.js';
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { root } from './helpers.mjs';
import { seenGauge, f85Line, f97Line, actOfAction, actOfFrame } from './flawless-seen.mjs';

/** The frames opfor.js opforLook documents (its header: 'stand', 'aim', 'run', 'crouch', 'cower', 'drop', 'hands', 'kneel', 'sit'). */
const OPFOR_FRAMES = Object.freeze(['stand', 'aim', 'run', 'crouch', 'cower', 'drop', 'hands', 'kneel', 'sit']);
/** The target view's warmed faces (ui/hud/target.js warm()), the board records' cases, and the user's 2a (armoured with a pistol). */
const FACES = Object.freeze([['threat', 'rifle'], ['threat', 'pistol'], ['noshoot', 'hands'], ['noshoot', 'phone'], ['armoured', 'rifle'], ['armoured', 'unseen'], ['armoured', 'pistol'], ['hostage', 'pistol'], ['hostage', 'rifle'], ['hostage', 'unseen'], ['unknown', 'unseen']]);
const BAD_WORDS = /round|chamber|load|count|ammo|stoppage|selector/i;

const live = () => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live:fight,hide' });
const actorOf = (s, who) => s.actors.list.find(a => a.who === who);

export default [
  {
    name: 'the key holds only what is drawn: SEEN_KEYS\' whitelist, no count, chamber or load in the record; seenKey changes with each drawn field and with nothing else (light, cover, the yaw, the frame, the who and the range inside its band outside it)',
    fn() {
      const g = live(), s = g.state, rp = s.armoury.range.turners.find(T => T.live).live.who, rec = seenOf(s, rp);
      // (v0.0.24, the build sheet v0.0.24 §3.5: his light, the jamb's share and a side card's yaw join the key; they are the card's
      // paint, never the doll's key (art/doll/portrait.js portraitKey))
      assert(SEEN_KEYS.join(',') === 'kind,face,gear,hold,aimAt,pose,facing,read,band,light,cover,yawQ', JSON.stringify(SEEN_KEYS));
      const words = [];
      const walk = (o, at) => { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (BAD_WORDS.test(k)) words.push(`${at}.${k}`); walk(v, `${at}.${k}`); } };
      walk({ ...rec, gear: null }, 'rec');
      assert(!words.length, JSON.stringify(words));
      const base = seenKey(rec), changes = {
        kind: { kind: 'board' }, face: { face: 'threat' }, gear: { gear: { ...rec.gear, ears: 'cups' } }, hold: { hold: { ...rec.hold, how: 'rifle-aim' } },
        aimAt: { aimAt: 'you' }, pose: { pose: 'kneel' }, facing: { facing: 'back' }, read: { read: { holds: 'rifle', state: 'aiming' } }, band: { rangeM: 30 },
        light: { light: { level: 0.2, sp: 1 } }, cover: { cover: { left: 0.5, right: 0 } }, yawQ: { facing: 'left', yawQ: 1.2 },
      };
      const moved = Object.entries(changes).map(([k, v]) => [k, seenKey({ ...rec, ...v }) !== base]);
      // (outside it: a level the card draws as lit, a man the walls hide whole (drawn whole, as last seen), a front card's yaw, sp)
      const still = { lightFull: { light: { level: 0.95, sp: rec.light?.sp ?? 1 } }, sp: { light: { ...rec.light, sp: 3 } }, coverWhole: { cover: { left: 1, right: 0 } }, yawFront: { yawQ: 1.2 }, frame: { frame: 'run' }, who: { who: 'p1' }, rangeInBand: { rangeM: [3, 20, 40].find(m => portraitBand(m) === portraitBand(rec.rangeM)) } };
      const kept = Object.entries(still).map(([k, v]) => [k, seenKey({ ...rec, ...v }) === base]);
      console.log(`      key ${base}`);
      console.log(`      each drawn field moves it: ${moved.map(([k, m]) => `${k} ${m ? 'yes' : 'NO'}`).join(', ')}; outside it: ${kept.map(([k, m]) => `${k} ${m ? 'kept' : 'MOVED'}`).join(', ')}`);
      assert(moved.every(([, m]) => m) && kept.every(([, m]) => m) && Object.keys(changes).every(k => SEEN_KEYS.includes(k)), JSON.stringify({ moved, kept }));
      // (v0.0.24: the light is read at his feet (the house's lit rooms 0.75: 'full'); the cover only when the page asks for it)
      assert(rec.light && Number.isFinite(rec.light.level) && rec.cover === null && seenOf(s, rp, { cover: true }).cover !== null, JSON.stringify({ light: rec.light, cover: rec.cover }));
    },
  },
  {
    name: 'the facing from the eye: a man turned 150° from you reads back, 90° a side (left the way the angle grows, right the other), 30° front; the mirror always front; his gun aimed within AIM_AT_RAD of your eye is aimed at you',
    fn() {
      const g = live(), s = g.state, me = actorOf(s, s.player.id), rp = s.armoury.range.turners.find(T => T.live).live.who, a = actorOf(s, rp);
      a.x = me.x + 4; a.z = me.z;                                     // (4 m east of you: the bearing to your eye is π)
      const at = (deg) => { a.headRad = Math.PI + deg * Math.PI / 180; return seenOf(s, rp, { fresh: true }); };
      const rows = [[0, 'front'], [30, 'front'], [-30, 'front'], [60, 'left'], [90, 'left'], [-90, 'right'], [120, 'left'], [150, 'back'], [-150, 'back'], [180, 'back']];
      const got = rows.map(([d, want]) => { const r = at(d); return { d, want, got: r.facing, yawQ: +r.yawQ.toFixed(3) }; });
      console.log(`      ${got.map(x => `${x.d}° ${x.got}`).join(', ')} (front within ${(FACING_FRONT_RAD * 180 / Math.PI).toFixed(0)}°, back beyond ${(FACING_BACK_RAD * 180 / Math.PI).toFixed(0)}°)`);
      assert(got.every(x => x.got === x.want), JSON.stringify(got));
      a.headRad = 0;
      assert(seenOf(s, rp, { mirror: true, fresh: true }).facing === 'front' && seenOf(s, s.player.id, { mirror: true }).facing === 'front' && seenOf(s, s.player.id).facing === 'front', 'the mirror and your own record front on');
      assert(seenOf(s, rp, { fresh: true }).rangeM === 4 && seenOf(s, rp, { mirror: true, fresh: true }).rangeM === null, 'the range on the ground, none in the mirror');
      // (aimed at you: his carry aimed, his heading toward you, then turned AIM_AT_RAD × 2 away)
      s.people[rp].kit.carry.posture = 'aimed';
      a.headRad = Math.PI;
      const you = seenOf(s, rp, { fresh: true });
      a.headRad = Math.PI + 2 * AIM_AT_RAD;
      const away = seenOf(s, rp, { fresh: true });
      console.log(`      aimed: toward you ${you.hold.how} ${you.aimAt}; ${(2 * AIM_AT_RAD).toFixed(1)} rad off ${away.hold.how} ${away.aimAt}; in the mirror ${seenOf(s, rp, { mirror: true, fresh: true }).aimAt}`);
      assert(you.hold.how === 'rifle-aim' && you.aimAt === 'you' && away.aimAt === 'away' && seenOf(s, rp, { mirror: true, fresh: true }).aimAt === 'away', JSON.stringify({ you: you.aimAt, away: away.aimAt }));
    },
  },
  {
    name: 'the tables cover the stage: FRAME_SEEN every frame opforLook gives (its header\'s nine, and those of the live lane\'s run), CARRY_HOW every CARRY_RIGS carry and every pistol posture in the hands, each to a hold of HOLD_HOWS; over the run every record\'s hold, pose and facing in their lists, and the record\'s bands the card\'s',
    fn() {
      const missFrames = OPFOR_FRAMES.filter(f => !FRAME_SEEN[f]);
      const carries = Object.values(CARRY_RIGS), inHand = Object.keys(POSTURES).filter(p => !SLUNG.has(p));
      const missCarry = [...carries, ...inHand.map(p => `pistol:${p}`)].filter(k => !HOLD_HOWS.includes(CARRY_HOW[k]));
      const badFrame = Object.values(FRAME_SEEN).filter(F => (F.pose && !POSES.includes(F.pose)) || (F.how && !HOLD_HOWS.includes(F.how)));
      const g = live(), s = g.state, seenFrames = new Set(), hows = new Set(), poses = new Set(), facings = new Set(), acts = new Set(), off = [];
      runHouse(g, houseBot({ mode: 'T' }), { each: (gm) => {
        for (const m of opforLook(gm.state)) seenFrames.add(m.frame);
        for (const a of gm.state.actors.list) {
          const r = seenOf(gm.state, a.who);
          if (!r) continue;
          hows.add(r.hold.how); poses.add(r.pose); facings.add(r.facing); if (r.hold.act) acts.add(r.hold.act);
          if (!HOLD_HOWS.includes(r.hold.how) || !POSES.includes(r.pose) || !FACINGS.includes(r.facing) || (r.hold.act && !PISTOL_ACT_NAMES.includes(r.hold.act))) off.push({ who: a.who, how: r.hold.how, pose: r.pose, facing: r.facing });
        }
      } });
      const unnamed = [...seenFrames].filter(f => !FRAME_SEEN[f]);
      const bands = PORTRAIT_BANDS.map(b => `${b.id} ${b.maxM}`).join(', '), card = HIT_BANDS.map(b => `${b.id} ${b.maxM}`).join(', ');
      console.log(`      opforLook's frames over the live lane: ${[...seenFrames].sort().join(', ')}; FRAME_SEEN misses ${missFrames.length + unnamed.length}; CARRY_HOW covers ${carries.length} carries and ${inHand.length} pistol postures, misses ${missCarry.length}`);
      console.log(`      the records' holds: ${[...hows].sort().join(', ')}; poses: ${[...poses].sort().join(', ')}; facings: ${[...facings].sort().join(', ')}; acts: ${[...acts].sort().join(', ') || 'none'}; bands ${bands} (the card's ${card})`);
      assert(!missFrames.length && !unnamed.length && !missCarry.length && !badFrame.length && !off.length, JSON.stringify({ missFrames, unnamed, missCarry, badFrame, off: off.slice(0, 3) }));
      assert(bands === card, 'the record\'s bands are the card\'s (HIT_BANDS)');
      // (frameOfSeen's own rules: a role-player frozen on his knee cowers, giving up with his rifle still on him drops, sitting sits)
      const cases = [[{ stance: 'kneel' }, null, { st: 'freeze' }, 'cower'], [{}, { carry: 'low' }, { st: 'hands' }, 'drop'], [{ posture: 'sit' }, { carry: 'low' }, null, 'sit'], [{ hands: true, stance: 'kneel' }, null, null, 'kneel'], [{ stance: 'prone' }, { carry: 'aim' }, null, 'aim'], [{ stance: 'prone' }, { carry: 'low' }, null, 'prone']];
      const bad = cases.filter(([a, gl, man, want]) => frameOfSeen(a, gl, man) !== want);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'a board\'s record for each face the target view warms, and the user\'s 2a: the hold the stage paints for what the stand holds (a rifle at the low ready, a pistol at the chest, hands up, a phone), nothing before it is identified; each face its own key',
    fn() {
      const want = { rifle: 'rifle-low', pistol: 'pistol-ready', hands: 'up', phone: 'phone', unseen: 'empty' };
      const rows = FACES.map(([face, holds]) => { const r = standSeen(face, holds); return { face, holds, how: r.hold.how, kind: r.kind, facing: r.facing, pose: r.pose, key: r.key }; });
      console.log(`      ${rows.map(r => `${r.face}/${r.holds} ${r.how}`).join(', ')}`);
      const bad = rows.filter(r => r.how !== (r.face === 'unknown' ? 'empty' : want[r.holds]) || r.kind !== 'board' || r.facing !== 'front' || r.pose !== 'stand');
      assert(!bad.length && new Set(rows.map(r => r.key)).size === rows.length, JSON.stringify({ bad, keys: rows.length, distinct: new Set(rows.map(r => r.key)).size }));
      assert(standSeen('threat', 'rifle', null, { rangeM: 30 }).key !== standSeen('threat', 'rifle', null, { rangeM: 5 }).key && standSeen('hostage', 'pistol', null, { side: 'left' }).side === 'left', 'the band in the key; the hostage card\'s side carried');
    },
  },
  {
    name: 'the P-12 drawn has the rifle\'s stances (the user, 2026-11-17: "sidearm should have the same stances (low ready, high ready, aimed, etc) as the rifle"): Transition reads the draw, the pistol in the hands its low ready, high ready and aim each its own hold, the holster read as Rifle up begins',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state, pid = s.player.id;
      const ticks = [];
      const watch = () => { const r = seenOf(s, pid), sn = stepNow(s, pid); ticks.push({ act: r.hold.act, how: r.hold.how, action: sn?.action ?? null, pistol: s.items[handGunOf(s, pid)]?.model === 'p12' }); };
      chooseStep(s, g.bus, { step: 'weapon:transition' });
      for (let i = 0; i < 400 && s.stop?.mode === 'stop' && s.stop.phase !== 'choose'; i++) { g.step(1); watch(); }
      const draws = ticks.filter(t => t.action === 'draw:thigh'), drawn = draws.filter(t => t.act === 'draw').length;
      assert(s.items[handGunOf(s, pid)]?.model === 'p12', 'the P-12 in the hands after Transition');
      const stances = {};
      for (const p of ['lowReady', 'highReady', 'aimed']) { s.people[pid].kit.carry.posture = p; stances[p] = seenOf(s, pid).hold; }
      const keys = new Set(Object.values(stances).map(h => h.how));
      s.people[pid].kit.carry.posture = 'highReady';
      ticks.length = 0;
      chooseStep(s, g.bus, { step: 'weapon:rifle-up' });
      for (let i = 0; i < 400 && s.stop?.mode === 'stop' && s.stop.phase !== 'choose'; i++) { g.step(1); watch(); }
      const hol = ticks.filter(t => t.action === 'holster'), holAct = hol.filter(t => t.act === 'holster').length;
      console.log(`      Transition: ${draws.length} ticks of draw:thigh, ${drawn} read 'draw'; the P-12 in the hands: ${Object.entries(stances).map(([p, h]) => `${p} ${h.how} (${h.right}/${h.left})`).join(', ')}; Rifle up: ${hol.length} ticks of holster, ${holAct} read 'holster', then ${seenOf(s, pid).hold.how}`);
      assert(draws.length > 0 && drawn === draws.length, JSON.stringify({ draws: draws.length, drawn }));
      assert(stances.lowReady.how === 'pistol-ready' && stances.highReady.how === 'pistol-high' && stances.aimed.how === 'pistol-aim' && keys.size === 3 && stances.aimed.right === 'p12', JSON.stringify(stances));
      assert(hol.length > 0 && holAct === hol.length && seenOf(s, pid).hold.how !== 'pistol-high', JSON.stringify({ hol: hol.length, holAct }));
    },
  },
  {
    name: 'the P-12\'s admin read as it runs (F97\'s act rows; the review of 2026-11-18): from v0.0.17\'s save with the pistol drawn, the press check reads check, the magazine out and seated read reload, the rack, the lock back and the release read clear, each tick the act your action makes and the act your drawn frame makes, and none between; seen from your #2\'s eye the same ticks read by the drawn frame, F97\'s oracle for a man not you',
    fn() {
      const json = gunzipSync(readFileSync(path.join(root, 'tests', 'saves', 'v0.0.17-house-pistol.json.gz'))).toString('utf8');
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213 }), s = g.load(json), pid = s.player.id, me = actorOf(s, pid);
      assert(s.items[handGunOf(s, pid)]?.model === 'p12' && s.stop?.phase === 'choose', 'the save holds the P-12 drawn at a pause');
      // (G is F97 as you see yourself; G2 the same ticks with your #2 as the viewer, so the P-12 is in the hands of a man not the
      // viewer and F97 holds his act to ORACLE_FRAME_ACT: no pinned lane puts the P-12 in another man's hands, 0 of 797 ticks)
      const G = seenGauge(), G2 = seenGauge(), byStep = {}, rows = [], mismatch = [], two = s.armoury.range.house.two?.pid;
      assert(two && two !== pid, 'your #2 on the lane');
      // (the steps as the panel offers them with the P-12 in the hands: the check, the magazine out to a pouch, the rack with none in,
      // the reach and the seat, the slide locked back and released)
      for (const step of ['pressCheck', 'magOut:pouch', 'charge', 'reach@pp', 'seat', 'lockBack', 'release']) {
        const r = chooseStep(s, g.bus, { step });
        rows.push(`${step} ${r.ok ? 'ok' : r.why}`);
        assert(r.ok, JSON.stringify({ step, r }));
        const seen = byStep[step] = {};
        for (let i = 0; i < 600 && s.stop?.mode === 'stop' && (i === 0 || s.stop.phase !== 'choose'); i++) {
          g.step(1);
          G.each(s);
          s.player.id = two; G2.each(s); s.player.id = pid;
          const sn = stepNow(s, pid), act = seenOf(s, pid).hold.act ?? '-', want = actOfAction(sn?.action), frame = actOfFrame(gunLook(s, me));
          seen[act] = (seen[act] ?? 0) + 1;
          if (!want.includes(act === '-' ? null : act) || !want.includes(frame)) mismatch.push({ step, action: sn?.action ?? null, act, frame });
        }
      }
      const R = G.end(), acts = R.F97.acts, R2 = G2.end();
      console.log(`      ${rows.join(', ')}`);
      console.log(`      the record's acts by step: ${Object.entries(byStep).map(([k, v]) => `${k} {${Object.entries(v).map(([a, n]) => `${a} ${n}`).join(', ')}}`).join('; ')}`);
      console.log(`      ${f97Line(R.F97)}`);
      console.log(`      ${f85Line(R.F85)}`);
      console.log(`      from your #2's eye: ${f97Line(R2.F97)}`);
      assert(!mismatch.length, JSON.stringify(mismatch.slice(0, 4)));
      assert(R2.F97.ok && R2.F97.ticks === R.F97.ticks && R2.F97.byFrame === 0 && (R2.F97.acts.check ?? 0) === (acts.check ?? 0) && (R2.F97.acts.reload ?? 0) === (acts.reload ?? 0) && (R2.F97.acts.clear ?? 0) === (acts.clear ?? 0), JSON.stringify({ F97: R2.F97.ok, ticks: R2.F97.ticks, byFrame: R2.F97.byFrame, acts: R2.F97.acts, off: R2.F97.off.slice(0, 3) }));
      assert(R.F97.ok && R.F85.ok && R.F97.ticks > 0, JSON.stringify({ F97: R.F97.ok, F85: R.F85.ok, off: [...R.F97.off, ...R.F85.off].slice(0, 3) }));
      assert((acts.check ?? 0) > 0 && (acts.reload ?? 0) > 0 && (acts.clear ?? 0) > 0 && R.F97.byFrame === R.F97.ticks, JSON.stringify({ acts, byFrame: R.F97.byFrame, ticks: R.F97.ticks }));
      assert(byStep.pressCheck.check > 0 && byStep['magOut:pouch'].reload > 0 && byStep.seat.reload > 0 && byStep.charge.clear > 0 && byStep.lockBack.clear > 0 && byStep.release.clear > 0, JSON.stringify(byStep));
    },
  },
];
