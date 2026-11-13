// OLYMPUS tests: the shoot house rework's review findings (2026-11-13: the code, play, design and reach lenses), each failing without its fix.
//
// The user's note of 2026-11-13 on F21: "Yes soldiers clearing rooms know not to stop in a doorway. The solution to this is the
// same as in real life, soldiers need to stay fluidly moving ... Later on, there will be much more complexity and a real need for a
// robust system". The reach lens's small findings are fixed here (what the team perceives, not the scene's ground truth); the
// large ones are COMBAT's prerequisites of test-breach. What each test pins:
//   - the tower's Stop and SHOW CLEAR judge both guns: a P-12 still in the hand is not safe, a holstered one goes in on safe,
//     and the DI's line names Rifle up first (the code review: the line was cleared with a hot rifle);
//   - a caught round draws the dice it was judged on, even with another shot taken between (the code review);
//   - your "Clear!" waits on your #2's man at most CLEAR_HOLD_MS, then hands back "Your two's on a man." (the code review);
//   - before GO, T names what the tower waits on and does it, never silent nor looping: out of it, back on your mark, your #2
//     (the play and design reviews: T silent after LOAD and MAKE READY on every sheet, 40 loops off the mark);
//   - after Transition a live shot on a man up is CONTACT's five, and the still-up line names To the head's keys;
//   - out of the mode on the lane, the feet still and nothing done, the DI says keep moving (the play review: 375 s lanes);
//   - Fire is struck on a house man down ("he is down") and at the hostage card ("head only"); a round at a man down says so;
//   - the lane timer's par, once missed for a man, stays missed for him;
//   - the hall's "Clear!" waits for its end; the contact line never says the bare "Two." (your #2 is "your two");
//   - a man's sector and room are worked out from where he stands (sectorOf, roomAt agree with every stand's labels), a his-only
//     window needs your #2 actually on the man, the reflex card's threat is a man you know of, every stand is a body the walker
//     keeps off, and a startle freezes the feet where they are, its time out of the doorway's fault (the reach review);
//   - the entry's stance set says what it now is, in numbers (the play review: one press set Careful with no word);
//   - the keys card names the stances by what they trade (your remark of 2026-11-11).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { stepsOf, gunOn } from '../src/sim/arms/shooting.js';
import { lineReady } from '../src/sim/scenarios/handling.js';
import { houseNow, houseWant } from '../src/sim/scenarios/shoothouse.js';
import { SEQ_HOUSE } from '../src/data/courses.js';
import { move } from '../src/sim/arms/kit.js';
import { firedNow, instinctNow } from '../src/sim/skills/instinct.js';
import { catchAhead, shotIdNext, resolveShot } from '../src/sim/arms/shot.js';
import { targetOf } from '../src/sim/arms/shooting.js';
import { situationOf, modelOf } from '../src/sim/arms/groups.js';
import { CLEAR_HOLD_MS, HANDBACK_WORDS, setVariant } from '../src/sim/combat/bundle.js';
import { laneModel } from '../src/ui/hud/timer.js';
import { CQB_RULES, WALK_NUDGE_MS } from '../src/sim/skills/instinct/cqb.js';
import { lanePlanOf, sectorOf, roomAt } from '../src/sim/combat/room.js';
import { hisOnly } from '../src/sim/combat/contact.js';
import { threatFacing } from '../src/sim/arms/sidearm.js';
import { bodyBlocks } from '../src/sim/places/move.js';
import { HOUSE_KEYS } from '../src/ui/cards/keys.js';
import { setOpening } from '../src/sim/places/model.js';

const SEED = 48213;
const house = (tier, setup = 'go', seed = SEED) => { const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup }); return { g, s: g.state, R: g.state.armoury.range, H: g.state.armoury.range.house }; };
const pid = (s) => s.player.id;
const ruleFired = (s, id) => firedNow(s).find(l => l.id === id) ?? null;
const choosing = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose';

export default [
  {
    name: 'the tower\'s Stop and SHOW CLEAR judge both guns (WEAPONS §3.2\'s note): the sergeant with the P-12 in his hand and the rifle off safe is not ready at Stop, the line names Rifle up first and T does it; holstered, the P-12 goes in on safe, and the rifle on safe and at low ready is ready (the code review of 2026-11-13: Stop passed on the pistol\'s safety, the line cleared with a hot rifle)',
    fn() {
      const { g, s, R } = house('sgt');
      const k = s.people[pid(s)].kit, pistol = k.worn.holster, rifle = k.worn.sling;
      // (the lane over, the pistol drawn and off safe as a transition leaves it, the rifle hanging off safe)
      R.house.end = { why: 'clear', atMs: s.clock.ms };
      move(s, pistol, { pid: pid(s), hand: 0 });
      s.items[pistol].mode = 'semi'; s.items[rifle].mode = 'semi';
      if (s.stop) s.stop.gun = pistol;
      R.cmd = { id: 'stop', i: SEQ_HOUSE.findIndex(c => c.id === 'stop'), atMs: s.clock.ms };
      const held = { gun: gunOn(s, pid(s)), ready: lineReady(s, 'stop') };
      g.step(1);
      const L = ruleFired(s, 'range-cmd');
      console.log(`      the P-12 in hand (${held.gun === pistol ? 'the gun in use' : 'not'}), the rifle off safe: Stop ready ${held.ready}; the line "${L?.ctx?.variant}" act ${L?.act}`);
      assert(held.gun === pistol && held.ready === false && L?.ctx?.variant === 'pistol' && (L.act === 'stop:weapon:rifle-up' || L.act === 'stop:enter'), JSON.stringify({ held, L: L && { v: L.ctx?.variant, act: L.act } }));
      // (holstered as the row's holster leaves it: on safe; the rifle still off safe: not ready; on safe and low ready: ready)
      move(s, pistol, { pid: pid(s), slot: 'holster' }); s.items[pistol].mode = 'safe';
      const rifleHot = lineReady(s, 'stop');
      s.items[rifle].mode = 'safe'; k.carry.posture = 'lowReady'; delete k.carry.finger;
      const both = lineReady(s, 'stop');
      s.items[pistol].mode = 'semi';
      const pistolHot = lineReady(s, 'stop');
      console.log(`      holstered: the rifle off safe ${rifleHot}; both on safe ${both}; the holstered P-12 off safe ${pistolHot}`);
      assert(rifleHot === false && both === true && pistolHot === false, JSON.stringify({ rifleHot, both, pistolHot }));
    },
  },
  {
    name: 'a caught round draws the dice its catch was judged on (SKILLS §5.1; the code review of 2026-11-13): another shot taken in the catch\'s 0.13 s (your #2\'s) moves the record\'s id, never the roll, which is the natural 1, caught',
    fn() {
      const { s, R } = house('tierone', 'contact');
      const T = R.turners.find(t => t.stand === '1a'), gunId = gunOn(s, pid(s));
      T.turnAtMs = s.clock.ms - 2000; s.items[gunId].mode = 'semi';
      const target = targetOf(s, T.key, pid(s)) ?? { key: T.key, kind: 'turner', x: T.x, y: 1.35, z: T.z, face: T.face, facingK: 1, dM: 4, room: T.room };
      // (the next shot ids until one whose dice catch (a natural 1, mastered at the tier one's Marksmanship))
      let id = null, c = 0;
      for (let n = 0; n < 400 && !id; n++) { c = catchAhead(s, { pid: pid(s), gunId, target }); if (c > 0) id = shotIdNext(s); else s.meta.next.sh = (s.meta.next.sh ?? 1) + 1; }
      assert(id, 'no catch in 400 ids');
      // (your #2 fires in between: the id is his)
      s.meta.next.sh += 1;
      const { shot } = resolveShot(s, null, { pid: pid(s), gunId, target, foreseen: id, log: false });
      console.log(`      the catch at ${id} (${c} ms); the round left as ${shot.id}: natural ${shot.roll?.nat}, caught ${!!shot.roll?.caught}, ok ${shot.roll?.ok}`);
      assert(shot.id !== id && shot.roll?.nat === 1 && shot.roll.caught === true && shot.roll.ok === true, JSON.stringify({ id, shot: shot.id, roll: shot.roll && { nat: shot.roll.nat, caught: shot.roll.caught } }));
    },
  },
  {
    name: 'your "Clear!" waits on your #2\'s man at most CLEAR_HOLD_MS, then hands back "Your two\'s on a man." with the call still to come (the code review of 2026-11-13: that wait alone had no cap, and a #2 kept on a man held your bundle polling for ever)',
    timeoutMs: 120_000,
    fn() {
      const { g, s, H } = house('tierone');
      const bot = houseHonestBot();
      // (to room 1's call beat, then the #2 kept on a man of the room for good)
      let at = null;
      for (let t = 0; t < 20 * 60 * 3 && at === null; t++) {
        g.step(1, bot); g.clearFacts();
        const d = s.stop?.doing?.beats ? s.stop.doing : s.stop?.flow, b = d?.beats?.find(x => x.k === 'call' && x.say === 'clear' && x.st === 'run');
        if (b && H.cur === 0) at = s.clock.ms;
      }
      assert(at !== null, 'no call beat in room 1');
      const man = s.armoury.range.turners.find(t => t.room === 'w4.r1');
      let handed = null;
      for (let t = 0; t < Math.ceil((CLEAR_HOLD_MS + 3000) / 50) && !handed; t++) {
        H.two.contact = { key: man.key, seenMs: at, untilMs: s.clock.ms + 1000, ms: 1000, expect: null };
        g.step(1); g.clearFacts();
        if (choosing(s) && s.stop.carry?.why === 'clear') handed = { ms: s.clock.ms - at, words: s.stop.carry.words };
      }
      console.log(`      held on his man from the call: handed back after ${handed ? fmt(handed.ms / 1000, 2) : 'never'} s, "${handed?.words}" (CLEAR_HOLD_MS ${CLEAR_HOLD_MS})`);
      assert(handed && handed.ms <= CLEAR_HOLD_MS + 1000 && handed.words === HANDBACK_WORDS.twoMan, JSON.stringify(handed));
    },
  },
  {
    name: 'before GO T names what the tower waits on and does it (the play and design reviews of 2026-11-13): from the brief, the honest T on every sheet meets no stop it cannot press; walked off the mark after MAKE READY, T walks back on it (Back on your mark), leaves the mode and the GO comes, with no loop',
    timeoutMs: 300_000,
    fn() {
      const rows = [];
      for (const tier of ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: SEED, tier }), s = g.state, bot = houseHonestBot();
        for (let t = 0; t < 20 * 120 && s.armoury.range.house.goAtMs === null; t++) { g.step(1, bot); g.clearFacts(); }
        const m = s.player ? s.actors.list.find(a => a.who === s.player.id)?.bot ?? null : null, mem = m ?? {};
        rows.push({ tier, go: s.armoury.range.house.goAtMs !== null, dead: Object.keys(mem.dead ?? {}).filter(k => /off the lane/.test(k)).length, hand: mem.hand ?? 0 });
      }
      console.log(`      to GO by T alone: ${rows.map(r => `${r.tier} GO ${r.go}, off-lane dead ends ${r.dead}, presses by hand ${r.hand}`).join('; ')}`);
      assert(rows.every(r => r.go && r.dead === 0), JSON.stringify(rows));
      // (off the mark: the corporal walked 1.5 m off it, up the hall, at MAKE READY's end)
      const g = createGame({ scenario: 'test-shoothouse', seed: SEED, tier: 'cpl' }), s = g.state, H = s.armoury.range.house, bot = houseHonestBot();
      for (let t = 0; t < 20 * 60 && !(s.armoury.range.cmd?.id === 'ready' && !s.stop && houseWant(s) === null); t++) { g.step(1, bot); g.clearFacts(); }
      const me = g.me(); me.x -= 1.5;
      const t0 = s.clock.ms, acts = [];
      let lines = 0;
      for (let t = 0; t < 20 * 90 && H.goAtMs === null; t++) {
        const L = instinctNow(s).line;
        if (L?.act) { lines++; acts.push(L.act); }
        g.step(1, bot); g.clearFacts();
      }
      const loops = acts.filter(a => a === 'stop:enter').length;
      console.log(`      off the mark: GO after ${fmt((s.clock.ms - t0) / 1000, 1)} s; the acts ${[...new Set(acts)].join(', ')}; enters ${loops}`);
      assert(H.goAtMs !== null && acts.includes('stop:move:mark') && loops <= 3 && s.clock.ms - t0 < 30_000, JSON.stringify({ go: H.goAtMs, acts: [...new Set(acts)], loops }));
    },
  },
  {
    name: 'after Transition a live shot on a man up is CONTACT\'s five, Rifle up in the fan (the design review of 2026-11-13: the STOPPAGE five stood with the head row at Tab › 1 › 5), and the still-up line names To the head\'s keys from rung 2',
    fn() {
      const row = (id, o = {}) => ({ id, kind: id.startsWith('shot:') ? 'shot' : 'weapon', label: id, ms: 100, off: null, ...(id.startsWith('shot:') ? { rounds: [{ part: 'torso', odds: 0.9 }] } : {}), ...o });
      const pistolUp = [row('weapon:rifle-up'), row('shot:pair', { target: 't' }), row('shot:head', { target: 't' }), row('fire', { kind: 'fire' })];
      const allDown = [row('weapon:rifle-up'), row('shot:pair', { off: 'nothing in the frame to aim at' }), row('fire', { kind: 'fire', off: 'he is down' })];
      const a = situationOf(pistolUp, { groups: modelOf(pistolUp).groups }).id, b = situationOf(allDown, { groups: modelOf(allDown).groups }).id;
      const still = CQB_RULES.find(r => r.id === 'cqb-still-up');
      console.log(`      the pistol out, a live shot on him: ${a}; the pistol out, nobody up: ${b}; the still-up line's key words "${still.text.key[0]}"`);
      assert(a === 'contact' && b === 'stoppage' && /\{key\}/.test(still.text.key[0]), JSON.stringify({ a, b }));
    },
  },
  {
    name: 'out of the mode on the lane, the feet still and nothing of the lane done for WALK_NUDGE_MS, the DI says keep moving and T takes you into the drill (G) (the play review of 2026-11-13: after X nothing told a key player to walk on, lanes of 375 s; the user\'s "soldiers need to stay fluidly moving", 2026-11-13)',
    fn() {
      const { g, s } = house('cpl');
      g.step(1, { act: [{ act: 'stop', args: { step: 'leave' } }] });
      const t0 = s.clock.ms;
      let first = null;
      for (let t = 0; t < 20 * 6 && !first; t++) { g.step(1); g.clearFacts(); const L = ruleFired(s, 'cqb-walk'); if (L) first = { ms: s.clock.ms - t0, act: L.act, text: instinctNow(s).line?.text }; }
      console.log(`      out of the mode at GO, still: cqb-walk after ${first ? fmt(first.ms / 1000, 2) : 'never'} s, act ${first?.act}, "${first?.text}" (WALK_NUDGE_MS ${WALK_NUDGE_MS})`);
      assert(first && first.ms >= WALK_NUDGE_MS - 1000 && first.act === 'stop:enter', JSON.stringify(first));
    },
  },
  {
    name: 'in the house Fire is struck on a man down ("he is down") and at the hostage card ("head only"), and a round at a man down says he was already down (the play and design reviews of 2026-11-13: "Fire at the far left target 95%" live on the private\'s man down, and at the hostage under "Head only, or hold")',
    fn() {
      const { g, s, R } = house('private', 'contact');
      for (let t = 0; t < 200 && !choosing(s); t++) { g.step(1); g.clearFacts(); }
      const T = R.turners.find(t => t.stand === '1a'), Hs = R.turners.find(t => t.face === 'hostage');
      if (!s.stop) g.step(1, { act: ['ready'] });
      T.turnAtMs = s.clock.ms - 2000; T.stoppedAtMs = s.clock.ms;
      s.stop.aim = { key: T.key, settledMs: s.clock.ms }; s.stop.pick = T.key;
      const down = stepsOf(s).find(r => r.id === 'fire');
      // (the hostage card from room 3's point, its door open, facing him, off safe)
      const P3 = lanePlanOf(s).plans['o:w4:r3'];
      setOpening(s, 'o:w4:r3', 'open', { atMs: s.clock.ms - 5000 });
      Hs.turnAtMs = s.clock.ms - 2000;
      // (2 m from him toward the room's point, facing him)
      const me = g.me(), ux = P3.points[0][0] - Hs.x, uz = P3.points[0][1] - Hs.z, uL = Math.hypot(ux, uz) || 1;
      me.x = Hs.x + (ux / uL) * 2; me.z = Hs.z + (uz / uL) * 2; me.headRad = Math.atan2(Hs.z - me.z, Hs.x - me.x);
      s.items[gunOn(s, pid(s))].mode = 'semi';
      s.stop.aim = { key: Hs.key, settledMs: s.clock.ms }; s.stop.pick = Hs.key;
      const hostage = stepsOf(s).find(r => r.id === 'fire');
      const target = { key: T.key, kind: 'turner', x: T.x, y: 1.35, z: T.z, face: T.face, facingK: 0, down: true, dM: 4, room: T.room };
      const { shot } = resolveShot(s, null, { pid: pid(s), gunId: gunOn(s, pid(s)), target, log: false });
      console.log(`      Fire on 1a down: struck "${down?.off}"; on the hostage card: struck "${hostage?.off}"; a round at him down: "${shot.roll?.verb}"`);
      assert(down?.off === 'he is down' && hostage?.off === 'head only' && /already down/.test(shot.roll?.verb ?? ''), JSON.stringify({ down: down?.off, hostage: hostage?.off, verb: shot.roll?.verb }));
    },
  },
  {
    name: 'the lane timer\'s par, once missed for a man, stays missed for him: a later record of the same man (seen again, or by your #2) never starts a fresh countdown (the play review of 2026-11-13: "HE FIRED FIRST" at the click, then "PAR 0.80 · 0.8 LEFT")',
    fn() {
      const hn = { timerMs: 16300, parMs: 800, legs: [{ word: 'ROOM 2', state: 'entered', ms: 6000 }], contacts: [{ key: 'turner:3', face: 'armoured', seenMs: 15000, parMet: null }, { key: 'turner:3', face: 'armoured', seenMs: 16000, parMet: null }] };
      const par = (m) => m.rows.find(r => /PAR/.test(r.label));
      const at = par(laneModel(hn, 16300)), later = par(laneModel({ ...hn, timerMs: 16800 }, 16800));
      console.log(`      at 16.3 s: ${at?.label} ${at?.value}; at 16.8 s: ${later?.label} ${later?.value}`);
      assert(at?.value === 'HE FIRED FIRST' && later?.value === 'HE FIRED FIRST', JSON.stringify({ at, later }));
    },
  },
  {
    name: 'the words: the hall\'s "Clear!" waits for its end (no line while Move to the hall\'s end is offered) and says "hall"; the contact line never says the bare "Two."; the keys card names the stances by what they trade and drops "Carry on" (the design review of 2026-11-13; your remark of 2026-11-11)',
    fn() {
      const contact = CQB_RULES.find(r => r.id === 'cqb-contact'), clear = CQB_RULES.find(r => r.id === 'cqb-clear');
      const twos = Object.values(contact.text).flat().filter(t => /(^|\. )Two\.$/.test(t));
      const card = HOUSE_KEYS.map(([, w]) => w).join(' | ');
      // (the hall: every hot spot covered, nobody up, its end not reached)
      const { g, s, H } = house('private', 'hall');
      for (let t = 0; t < 400 && !choosing(s); t++) { g.step(1); g.clearFacts(); }
      if (!choosing(s)) g.step(1, { act: ['ready'] });
      const P = lanePlanOf(s).plans.hall;
      H.hall.covered = Object.fromEntries((P.hot ?? []).map(h => [h.id, { atMs: s.clock.ms, by: 'me' }]));
      const offered = stepsOf(s).some(r => r.id === 'move:hallEnd' && !r.off), L = ruleFired(s, 'cqb-clear');
      console.log(`      the hall short of its end: Move to the hall's end offered ${offered}, cqb-clear ${L ? 'fires' : 'silent'}; its hall words "${clear.text.hall[0]}"; bare "Two." lines ${twos.length}; the keys card: ${card}`);
      assert(offered && !L && clear.text.hall?.length >= 4 && !twos.length && /Careful/.test(card) && /Fast/.test(card) && !/Carry on/.test(card) && !/Combat, Assault/.test(card), JSON.stringify({ offered, L: !!L, twos, card }));
    },
  },
  {
    name: 'a man\'s sector and room by where he stands (the reach review of 2026-11-13): sectorOf and roomAt agree with every stand\'s authored slot and room; a his-only window needs your #2 on the man (on his stack behind a shut door he is not); the reflex card\'s threat is a man you know of; every stand is a body the walker keeps off',
    fn() {
      const { g, s, R, H } = house('tierone');
      const L = lanePlanOf(s), bad = [];
      for (const T of R.turners) {
        const P = Object.values(L.plans).find(p => p.room === T.room);
        if (sectorOf(P, T.x, T.z) !== (T.slot ?? 1) || roomAt(s, T.x, T.z) !== T.room) bad.push(`${T.stand}: ${sectorOf(P, T.x, T.z)}/${T.slot} ${roomAt(s, T.x, T.z)}/${T.room}`);
      }
      // (1b, the #2's man of room 1, turned; the #2 on his stack, the door shut, standing; your muzzle away from him)
      const b1 = R.turners.find(t => t.stand === '1b'), P1 = L.plans['o:w4:r1'], two = s.actors.list.find(a => a.who === H.two.pid);
      b1.turnAtMs = s.clock.ms - 2000;
      two.x = P1.stack[1][0]; two.z = P1.stack[1][1]; H.two.doing = null; H.two.contact = null; H.two.eng = null;
      const me = g.me(); me.headRad = Math.atan2(b1.z - me.z, b1.x - me.x) + Math.PI;
      const his = hisOnly(s, { ids: [b1.key] });
      // (the reflex card's threat: 1a facing from room 1's doorway, unknown, then known)
      const c = house('tierone', 'contact'), a1c = c.R.turners.find(t => t.stand === '1a');
      a1c.turnAtMs = c.s.clock.ms - 2000;
      const mc = c.g.me(); mc.headRad = Math.atan2(a1c.z - mc.z, a1c.x - mc.x);
      if (c.s.mind.contact?.known) delete c.s.mind.contact.known[a1c.key];
      if (c.s.mind.contact?.last) c.s.mind.contact.last = null;
      const unknown = threatFacing(c.s, pid(c.s));
      ((c.s.mind.contact ??= {}).known ??= {})[a1c.key] = c.s.clock.ms;
      const known = threatFacing(c.s, pid(c.s));
      const a1 = R.turners.find(t => t.stand === '1a');
      // (a stand as a body: a step toward 1a from 0.6 m to 0.4 m is blocked)
      const blocks = bodyBlocks(s, pid(s), a1.x + 0.6, a1.z, a1.x + 0.4, a1.z);
      console.log(`      stands against sectorOf and roomAt: ${bad.length ? bad.join('; ') : 'all agree'}; his-only with him on his stack behind the shut door ${his}; the card's threat unknown ${unknown?.T?.stand ?? 'none'}, known ${known?.T?.stand ?? 'none'}; a step into 1a blocked ${blocks}`);
      assert(!bad.length && his === false && !unknown && known?.T === a1c && blocks, JSON.stringify({ bad, his, unknown: !!unknown, known: known?.T?.stand, blocks }));
    },
  },
  {
    name: 'a startle freezes the feet where they are, never carried through a door to the point, and its freeze in the doorway is out of the doorway\'s fault (the reach review of 2026-11-13, default yes); the entry\'s stance set says what it now is, in numbers (the play review of 2026-11-13)',
    fn() {
      const { g, s, H } = house('private', 'contact');
      const me = g.me();
      me.combat = { ...(me.combat ?? {}), startleUntilMs: s.clock.ms + 1500 };
      let carried = 0, run = 0;
      for (let t = 0; t < 20; t++) { g.step(1); g.clearFacts(); if (me.through) carried++; run = Math.max(run, H.rooms[0].funnelRunMs ?? 0); }
      console.log(`      startled in room 1's doorway for 1.5 s: carried ${carried} ticks, the fault's clock at most ${run} ms`);
      // (the stance: a variant row set says its words on the bus)
      const t2 = house('tierone'), lines = [];
      const row = stepsOf(t2.s).find(r => r.id === 'drill:variant:stance');
      setVariant(t2.s, row, { emit: (type, f) => { if (type === 'line') lines.push(f.text); } });
      console.log(`      "${row?.label}" pressed: ${JSON.stringify(lines)}`);
      assert(carried === 0 && run === 0 && row && lines.length === 1 && /m\/s/.test(lines[0]), JSON.stringify({ carried, run, lines }));
    },
  },
];
