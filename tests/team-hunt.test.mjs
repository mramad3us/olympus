// OLYMPUS tests: your number two in a fight, the hunt of v0.0.20's team findings (T1 to T4; .run/hunt-v020/findings.md): he fights a man shooting at the stack whoever's sector the man stands in, takes your sector while you hold no gun, never calls "Clear!" with a man of the room up or after a casualty, and the paint and the one thing on him are said as his.
//
// Each test fails on the v0.0.20 tag:
//   - T1, the fight: the corporal on 15 ("Stack and clear, live", live:fight,hide), the honest bot to room 2, out of stop motion 1.8 s
//     into Enter and frozen in the doorway, the rifle in hand and on nobody: room 2's man (RP-A, your sector) fires on the stack. On the
//     tag your #2 was on nobody 8 ticks of RP-A's firing with RP-A in his sight, and you were the casualty; now he takes RP-A in
//     (house-two.js fightsUs) and puts him down.
//   - T1, the cover: the same lane with Stow pressed in the doorway instead (a rifle slung is a rifle down: house-two.js youDown): his
//     "Covering!" and RP-A his. On the tag nothing, and the casualty.
//   - T1, the call: the tier one's fuzz on 2 (live:fight,fight): his "Clear!" 38.30 s after GO with RP-A up and firing in room 2; now his
//     call waits on every man of the room the team has seen until he is down, out or has given up (bundle.js twoClearWait).
//   - T2: his casualty (a head strike made by hand from RP-A through men.js incoming, the one writer, as would-lane's) with his
//     Dominate under way: on the tag a fresh Dominate 150 ms after the strike and "Clear!" 600 ms after "I'm hit!"; now nothing of his
//     starts and nothing is said but "I'm hit!". Your casualty the same (the corporal's honest bot on 2, live:fight,fight: "Clear!" 0.8 s
//     after it).
//   - T3: a wound on him by hand: the instructor's "Paint on your two, chest. Keep working." (HOUSE_CHIEF.paintTwo), never "You took
//     paint" (v0.0.20 picked from HOUSE_CHIEF.paint whoever was struck).
//   - T4: his casualty's one thing names him ('casualty:two:yours' by your sector's man, 'casualty:two' by his own), never "You took
//     paint and it stopped there."; paint on him alone, short of a casualty, never "You took paint." ('paint:two').
// The review of the four patches together (.run/huntfix-v020/review.md), each failing without its fix:
//   - R1: a rifle a fumble swung onto its sling is not one put away: the boot recruit's Off safe fumbled inside room 1 (the keys bot on
//     1000, house-pace's first seed) had your #2 say "Covering!" over the 2.4 s swing, and house-pace's lane from GO moved +2.17%
//     against its 2%; now nothing until your Rifle up (house-two.js fumbleSwung).
//   - R2: a man taken in under "Covering!" who is firing on the stack by your Rifle up is kept (coverTick's `keeps`): handed back on
//     5 seeds of 8, taken in afresh 0.3 s later and you the casualty; and a man he knows already, handed back before he fired, is taken
//     again when he does (the fight loop no longer skips W.known).
//   - R3 (T2's belt): a casualty recorded between ticks with your "Clear!" due says no "Clear!", and the lane runs to its cease fire
//     (the call beat says nothing and carries on; the first build halted the bundle there into a choice no act could leave).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot, houseFuzzBot } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';
import { incoming, seenK } from '../src/sim/combat/men.js';
import { pastThreshold, lanePlanOf } from '../src/sim/combat/room.js';
import { HOUSE_CHIEF } from '../src/data/courses.js';
import { houseBot } from './bots/house.mjs';
import { swungWords } from '../src/sim/arms/firearms.js';
import { modelOf } from '../src/sim/arms/models.js';

// (seconds from GO; before it, negative (the tower's words before the lane))
const sec = (s, ms) => { const go = s.armoury.range.house.goAtMs; return go === null ? '-1' : fmt((ms - go) / 1000, 2); };

// (the honest bot to room 2; when its Enter has walked cutMs, `row` pressed once (or none), out of stop motion, and from then nothing:
// a player frozen in the doorway. Returns the lane's record: your #2 on RP-A or not, his ticks on nobody while RP-A fires in his
// sight, the casualty, his words)
function frozen(row, { tier = 'cpl', seed = 15, opfor = 'live:fight,hide', cutMs = 1800 } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, opfor }), s = g.state, H = s.armoury.range.house, W = H.two, R = s.armoury.range;
  const honest = houseHonestBot();
  let cutAt = null, done = false, pending = row, rowAt = null;
  const bot = (st, me, mem) => {
    // (frozen: at a choice, the row once (where offered), then X (the panel's 'leave') and nothing more)
    if (done) {
      if (st.stop?.mode !== 'stop' || st.stop.phase !== 'choose' || st.stop.doing) return {};
      if (pending && stepsOf(st).some(x => x.id === pending && !x.off)) { const id = pending; pending = null; rowAt = st.clock.ms; return { act: [stepAct(id)] }; }
      return stepsOf(st).some(x => x.id === 'leave' && !x.off) ? { act: [stepAct('leave')] } : {};
    }
    const d = st.stop?.doing;
    if (d?.beats && d.step === 'drill:room:in>o:w4:r2') {
      const run = d.beats.find(b => b.k === 'move' && (b.st === 'run' || b.st === 'done'));
      if (run && st.clock.ms - d.fromMs >= cutMs) { done = true; cutAt = st.clock.ms; return {}; }
    }
    return honest(st, me, mem);
  };
  const P = () => Object.values(lanePlanOf(s).plans).find(p => p.door === 'o:w4:r2');
  let alone = 0, onA = false;
  const said = [];
  runHouse(g, bot, { maxMs: 6 * 60_000, each: (game) => {
    for (const f of game.facts('say')) if (f.who === W.pid) said.push(`${sec(s, s.clock.ms)} ${f.text}`);
    if (cutAt === null || H.end || H.live.casualty) return;
    const two = s.actors.list.find(a => a.who === W.pid), T = R.turners.find(x => x.stand === '2a'), pl = P();
    if (T?.live?.st === 'fire' && pl && pastThreshold(pl, two.x, two.z) && seenK(s, two, T, s.clock.ms) >= 0.5 && !W.contact && !W.eng) alone++;
    if (T && (W.contact?.key === T.key || W.eng?.key === T.key)) onA = true;
  } });
  const T = R.turners.find(x => x.stand === '2a');
  return { s, H, cutAt, rowAt, slung: s.people[s.player.id].kit.carry?.posture, alone, onA, said, casualty: H.live.casualty ? (H.live.casualty.who === W.pid ? 'his' : 'yours') : null, rpa: T?.live?.st, rpaDown: T?.stoppedAtMs !== null };
}

// (a strike made by hand on your #2 from a role-player, on a lived tick, when `when(s, H)` first holds: men.js incoming, the one writer)
function strikeTwo(g, { by = '2a', zone = 'head', part = 'head', margin = 6, gun = null, id = 'by-hand' } = {}) {
  const s = g.state, H = s.armoury.range.house, T = s.armoury.range.turners.find(t => t.stand === by), two = s.actors.list.find(a => a.who === H.twoPid);
  const T2 = s.armoury.range.turners.find(t => t.stand === '2a');
  return incoming(s, g.bus, { who: H.twoPid, by: T.key, shot: { id, fired: true, hole: { at: [0, 5] }, zone, part, load: 'marking', gun: gun === 'pistol' ? H.pistol : gun ?? s.people[T2.live.who].kit.worn.sling, roll: { margin }, flight: { rangeM: 4.2 }, muzzle: { x: T.x, y: 1.4, z: T.z }, dirRad: Math.atan2(two.z - T.z, two.x - T.x), atMs: s.clock.ms } });
}
// (the sergeant's honest lane on 48213, live, room:2's setup, a strike made on your #2 the first lived tick he stands past room 2's
// threshold with his Dominate under way (or `at` said otherwise); every word of his and the instructor's kept with its time)
function struckLane({ by = '2a', zone = 'head', part = 'head', margin = 6, gun = null } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'room:2', opfor: 'live' }), s = g.state, H = s.armoury.range.house, W = H.two;
  const P = () => Object.values(lanePlanOf(s).plans).find(p => p.door === 'o:w4:r2');
  let out = null, atMs = null, was = s.clock.ms;
  const said = [], starts = [];
  runHouse(g, houseHonestBot(), { maxMs: 4 * 60_000, each: (game) => {
    for (const [t, f] of game.facts()) {
      if (t === 'say' && (f.who === W.pid || f.who === H.chiefPid)) said.push({ ms: s.clock.ms, who: f.who === W.pid ? '#2' : 'DI', text: f.text });
      if (t === 'bundle' && f.phase === 'start' && f.who === W.pid) starts.push({ ms: s.clock.ms, id: f.id });
    }
    const lived = s.clock.ms > was; was = s.clock.ms;
    if (out || !lived || H.end || H.live.casualty) return;
    const two = s.actors.list.find(a => a.who === W.pid), pl = P();
    if (!pl || !pastThreshold(pl, two.x, two.z) || W.doing?.bundle !== 'room:dominate') return;
    out = strikeTwo(g, { by, zone, part, margin, gun }); atMs = s.clock.ms;
  } });
  return { g, s, H, out, atMs, said, starts, one: runSheetOf(s).one };
}

// (R2's lane: the honest bot to room 2, Stow 1.8 s into Enter, then, once your #2 has room 2's man (2a) as his contact, Rifle up at the
// next choice, and frozen after it (X at every choice); every tick after the Rifle up counted: 2a firing in his sight with him on nobody)
function stowUp({ seed, tier = 'cpl', opfor = 'live:fight,hide' }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, opfor }), s = g.state, H = s.armoury.range.house, W = H.two, R = s.armoury.range;
  const honest = houseHonestBot();
  let phase = 'honest', upAt = null, handedFire = null;
  const bot = (st, me, mem) => {
    const choose = st.stop?.mode === 'stop' && st.stop.phase === 'choose' && !st.stop.doing;
    const ids = choose ? stepsOf(st).filter(x => !x.off).map(x => x.id) : [];
    const T = R.turners.find(x => x.stand === '2a');
    if (phase === 'stow') { if (!choose) return {}; if (ids.includes('stow')) { phase = 'wait'; return { act: [stepAct('stow')] }; } return ids.includes('leave') ? { act: [stepAct('leave')] } : {}; }
    if (phase === 'wait') { if (W.contact?.key === T.key && !W.eng) phase = 'up'; return choose && ids.includes('leave') ? { act: [stepAct('leave')] } : {}; }
    if (phase === 'up') { if (!choose || !ids.includes('up')) return {}; phase = 'frozen'; upAt = st.clock.ms; handedFire = T.live?.st === 'fire'; return { act: [stepAct('up')] }; }
    if (phase === 'frozen') return choose && ids.includes('leave') ? { act: [stepAct('leave')] } : {};
    const d = st.stop?.doing;
    if (d?.beats && d.step === 'drill:room:in>o:w4:r2') { const run = d.beats.find(b => b.k === 'move' && (b.st === 'run' || b.st === 'done')); if (run && st.clock.ms - d.fromMs >= 1800) { phase = 'stow'; return {}; } }
    return honest(st, me, mem);
  };
  let alone = 0, onA = false;
  runHouse(g, bot, { maxMs: 6 * 60_000, each: () => {
    if (upAt === null || H.end || H.live.casualty) return;
    const T = R.turners.find(x => x.stand === '2a'), two = s.actors.list.find(a => a.who === W.pid);
    if (T.live?.st === 'fire' && seenK(s, two, T, s.clock.ms) >= 0.5 && !W.contact && !W.eng) alone++;
    if (W.contact?.key === T.key || W.eng?.key === T.key) onA = true;
  } });
  return { s, H, upAt, handedFire, alone, onA, casualty: H.live.casualty ? (H.live.casualty.who === W.pid ? 'his' : 'yours') : null, late: !!H.live.casualty?.late, end: H.end?.why ?? null };
}

export default [
  {
    name: 'T1: a man of yours shooting at the stack is your #2\'s too: frozen in room 2\'s doorway with your rifle on nobody (the corporal on 15, live:fight,hide), he takes room 2\'s man in and puts him down, and you are not hit (v0.0.20: on nobody 8 ticks of that man\'s fire in his sight, and your casualty)',
    heavy: true, // (the v0.0.22 integration: the file over its quick CPU budget, 3 s (QUICK_FILE_CPU_S), on v0.0.21's runner; its whole lanes moved to the heavy suite as TECH §13.7 says, the case unchanged)
    timeoutMs: 120_000,
    fn() {
      const L = frozen(null);
      console.log(`      frozen at ${L.cutAt === null ? 'never' : sec(L.s, L.cutAt)} s; your #2 on RP-A ${L.onA}; on nobody under RP-A's fire in his sight ${L.alone} ticks; RP-A ${L.rpa}${L.rpaDown ? ', down' : ''}; casualty ${L.casualty ?? 'none'}; end ${L.H.end?.why}`);
      assert(L.cutAt !== null && L.onA && L.alone === 0 && L.casualty === null && L.rpaDown, JSON.stringify({ cut: L.cutAt, onA: L.onA, alone: L.alone, casualty: L.casualty, rpa: L.rpa }));
    },
  },
  {
    name: 'T1: your rifle stowed in a room you have entered is your rifle down: your #2 says "Covering!" and room 2\'s man is his (the corporal on 15, Stow 1.8 s into Enter; v0.0.20: nothing said, your casualty)',
    heavy: true, // (the v0.0.22 integration: the file over its quick CPU budget, 3 s (QUICK_FILE_CPU_S), on v0.0.21's runner; its whole lanes moved to the heavy suite as TECH §13.7 says, the case unchanged)
    timeoutMs: 120_000,
    fn() {
      const L = frozen('stow'), t = L.rowAt === null ? null : Number(sec(L.s, L.rowAt)), after = L.said.filter(x => t !== null && Number(x.split(' ')[0]) >= t);
      console.log(`      Stow at ${t ?? 'never'} s (your rifle ${L.slung} at the end); his words after it ${JSON.stringify(after.slice(0, 6))}; on RP-A ${L.onA}; casualty ${L.casualty ?? 'none'}`);
      assert(t !== null && after.some(x => / Covering!$/.test(x)) && L.onA && L.casualty === null, JSON.stringify({ rowAt: t, said: L.said.slice(-8), onA: L.onA, casualty: L.casualty }));
    },
  },
  {
    name: 'T1: your #2\'s "Clear!" waits on every man of the room the team has seen until he is down, out or has given up (the tier one\'s fuzz on 2, live:fight,fight; v0.0.20: "Clear!" 38.30 s after GO with room 2\'s man firing)',
    heavy: true, // (the v0.0.22 integration: the file over its quick CPU budget, 3 s (QUICK_FILE_CPU_S), on v0.0.21's runner; its whole lanes moved to the heavy suite as TECH §13.7 says, the case unchanged)
    timeoutMs: 180_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 2, tier: 'tierone', opfor: 'live:fight,fight' }), s = g.state, H = s.armoury.range.house, W = H.two, R = s.armoury.range;
      const calls = [], bad = [];
      const run = runHouse(g, houseFuzzBot({ seed: 2 }), { maxMs: 10 * 60_000, each: (game) => {
        for (const f of game.facts('say')) {
          if (f.who !== W.pid || f.call !== 'clear') continue;
          const room = H.rooms.find(L => L.door === f.room)?.room;
          const T = R.turners.find(x => x.live && x.room === room && x.stoppedAtMs === null && !['hands', 'down', 'out'].includes(x.live.st) && H.live.seenBy?.[x.key] !== undefined);
          calls.push(`${sec(s, s.clock.ms)} ${f.room}`);
          if (T) bad.push(`${sec(s, s.clock.ms)} ${T.stand} ${T.live.st}`);
        }
      } });
      console.log(`      his "Clear!" at ${calls.join(', ') || 'none'}; with a seen man of the room up ${bad.length} ${JSON.stringify(bad)}; the lane ${H.end?.why} at ${H.end ? sec(s, H.end.atMs) : '-'} s, the card reached ${run.done}`);
      assert(run.done && bad.length === 0, JSON.stringify({ bad, end: H.end?.why }));
    },
  },
  {
    name: 'T2: your #2 the casualty (a head strike by hand from room 2\'s man during his Dominate): nothing of his starts after it and he says nothing but "I\'m hit!" (v0.0.20: a fresh Dominate 150 ms after the strike, and "Clear!" 600 ms after his "I\'m hit!")',
    timeoutMs: 120_000,
    fn() {
      const L = struckLane(), K = L.H.live.casualty;
      const after = L.said.filter(x => x.who === '#2' && x.ms > L.atMs).map(x => `${sec(L.s, x.ms)} ${x.text}`), started = L.starts.filter(x => x.ms > L.atMs).map(x => `${sec(L.s, x.ms)} ${x.id}`);
      console.log(`      the strike at ${L.atMs === null ? 'never' : sec(L.s, L.atMs)} s, ${L.out?.would?.fatal ? 'fatal' : 'not fatal'}; his words after it ${JSON.stringify(after)}; his drills started after it ${JSON.stringify(started)}; the lane ${L.H.end?.why}`);
      assert(L.out?.would?.fatal && K?.who === L.H.twoPid && L.H.end?.why === 'casualty' && after.every(t => /hit/i.test(t)) && after.length >= 1 && started.length === 0, JSON.stringify({ after, started, end: L.H.end?.why }));
    },
  },
  {
    name: 'T2: your casualty, and no "Clear!" from your #2 after it (the corporal\'s honest bot on 2, live:fight,fight; v0.0.20: "Clear!" 0.8 s after your "I\'m hit!")',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 2, tier: 'cpl', opfor: 'live:fight,fight' }), s = g.state, H = s.armoury.range.house, W = H.two;
      let casAt = null;
      const after = [];
      runHouse(g, houseHonestBot(), { maxMs: 10 * 60_000, each: (game) => {
        for (const [t, f] of game.facts()) {
          if (t === 'house' && f.phase === 'casualty' && casAt === null) casAt = s.clock.ms;
          if (t === 'say' && f.who === W.pid && casAt !== null && s.clock.ms >= casAt) after.push(`${sec(s, s.clock.ms)} ${f.text}`);
        }
      } });
      console.log(`      casualty ${H.live.casualty ? (H.live.casualty.who === W.pid ? 'his' : 'yours') : 'none'} at ${casAt === null ? '-' : sec(s, casAt)} s; his words after it ${JSON.stringify(after)}`);
      assert(H.live.casualty?.who === s.player.id && !after.some(t => /Clear|Up\./.test(t)), JSON.stringify({ casualty: H.live.casualty, after }));
    },
  },
  {
    name: 'T3: paint on your #2 is said as his: "Paint on your two, …" (HOUSE_CHIEF.paintTwo), never "You took paint" (a wound by hand from room 2\'s man)',
    timeoutMs: 120_000,
    fn() {
      // (a P-12 frangible round in the chest's A zone at margin 0: a wound or the panel's stop, never fatal (would-lane's arm case))
      const L = struckLane({ zone: 'A', part: 'torso', margin: 0, gun: 'pistol' });
      const w = L.out?.would, words = L.said.filter(x => x.who === 'DI' && x.ms >= L.atMs && /paint|panel/i.test(x.text)).map(x => x.text);
      const his = [...(HOUSE_CHIEF.paintTwo ?? []), ...(HOUSE_CHIEF.paintStoppedTwo ?? [])].map(t => new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\{part\\}', '[a-z ]+')}$`));
      console.log(`      the strike at ${L.atMs === null ? 'never' : sec(L.s, L.atMs)} s: ${w ? (w.fatal ? 'fatal' : w.why ?? 'wound') : '-'} (${w?.where ?? '-'}); the instructor ${JSON.stringify(words)}; the one thing ${L.one.key}: "${L.one.text}"`);
      assert(w && !w.fatal && words.length >= 1 && words.every(t => his.some(r => r.test(t)) && !/^You took paint/.test(t)), JSON.stringify({ would: w, words }));
      // (T4's other half: paint on him alone short of a casualty is never "You took paint." in the one thing)
      assert(L.one.key !== 'paint' && !/^You took paint/.test(L.one.text), JSON.stringify(L.one));
    },
  },
  {
    name: 'T4: your #2\'s casualty\'s one thing is his: \'casualty:two:yours\' by room 2\'s man (your sector), \'casualty:two\' by room 3\'s (his), never "You took paint and it stopped there." (v0.0.20: the casualty\'s line for either man)',
    timeoutMs: 120_000,
    fn() {
      const A = struckLane(), B = struckLane({ by: '3a' });
      console.log(`      by 2a: ${A.H.end?.why}, the one thing ${A.one.key}: "${A.one.text}"\n      by 3a: ${B.H.end?.why}, the one thing ${B.one.key}: "${B.one.text}"`);
      assert(A.H.live.casualty?.who === A.H.twoPid && A.one.key === 'casualty:two:yours' && !!HOUSE_CHIEF.one['casualty:two:yours']?.includes(A.one.text), JSON.stringify(A.one));
      assert(B.H.live.casualty?.who === B.H.twoPid && B.one.key === 'casualty:two' && !!HOUSE_CHIEF.one['casualty:two']?.includes(B.one.text), JSON.stringify(B.one));
      assert(![A.one.text, B.one.text].some(t => /^You took paint/.test(t)), JSON.stringify([A.one, B.one]));
    },
  },
  {
    name: 'R1: a rifle a fumble swung onto its sling is not a rifle put away: the boot recruit\'s fumbled Off safe inside room 1 (the keys bot, house-pace\'s seeds from 1000) has no "Covering!" from your #2 before your Rifle up (the review of the hunt\'s fixes: "Covering!" 8.80 s after GO on 1000, house-pace +2.17% against its 2%)',
    timeoutMs: 180_000,
    fn() {
      // (house-pace's seeds, the first lane whose rifle a fumble swings onto its sling inside a room, the leg entered)
      let seen = null;
      for (let i = 0; i < 20 && !seen; i++) {
        const seed = 1000 + 37 * i, g = createGame({ scenario: 'test-shoothouse', seed, tier: 'recruit' }), s = g.state, H = s.armoury.range.house, W = H.two;
        const bot = houseBot({ mode: 'keys' }), gunId = s.people[s.player.id].kit.worn.sling, words = swungWords(modelOf(s.items[gunId]));
        let swung = null, up = null, n = 0;
        const cov = [];
        while (!H.end && n++ < 20 * 240 && (swung === null || up === null)) {
          g.step(1, bot);
          for (const [t, f] of g.facts()) {
            if (t === 'say' && f.who === W.pid && /Covering/.test(f.text)) cov.push(s.clock.ms - 50);
            if (t !== 'log' || f.entry?.kind !== 'roll' || f.entry.who !== s.player.id || f.entry.gun !== gunId) continue;
            const L = H.rooms.find(x => x.state === 'entered');
            if (swung === null && f.entry.text === words && L) swung = f.entry.atMs;
            else if (swung !== null && up === null && f.entry.atMs > swung) up = f.entry.atMs;
          }
          g.clearFacts();
        }
        if (swung !== null) seen = { seed, swungS: (swung - H.goAtMs) / 1000, upS: up === null ? null : (up - H.goAtMs) / 1000, during: cov.filter(ms => ms >= swung && (up === null || ms < up)).map(ms => fmt((ms - H.goAtMs) / 1000, 2)) };
      }
      console.log(`      ${seen ? `seed ${seen.seed}: the rifle swung onto its sling at ${fmt(seen.swungS, 2)} s after GO, its next roll at ${seen.upS === null ? 'never' : fmt(seen.upS, 2)} s; your #2's "Covering!" in between at ${JSON.stringify(seen.during)}` : 'no fumble swung the rifle inside a room on 20 seeds'}`);
      assert(seen && seen.upS !== null && seen.during.length === 0, JSON.stringify(seen));
    },
  },
  {
    name: 'R2: a man taken in under "Covering!" who is firing on the stack when your rifle comes back is kept: your #2 puts him down and he never puts you down (the corporal on 2, live:fight,hide, Stow then Rifle up; the first build: given back, 9 ticks of his fire alone, your casualty, on 5 seeds of 8)',
    heavy: true, // (the v0.0.22 integration: the file over its quick CPU budget, 3 s (QUICK_FILE_CPU_S), on v0.0.21's runner; its whole lanes moved to the heavy suite as TECH §13.7 says, the case unchanged)
    timeoutMs: 180_000,
    fn() {
      const rows = [2, 3, 5].map(seed => ({ seed, ...stowUp({ seed }) }));
      for (const L of rows) console.log(`      seed ${L.seed}: Rifle up at ${L.upAt === null ? 'never' : sec(L.s, L.upAt)} s with room 2's man ${L.handedFire ? 'firing' : 'not firing'}; your #2 on him after it ${L.onA}; alone under his fire ${L.alone} ticks; casualty ${L.casualty ? `${L.casualty}${L.late ? ', late (a wound bled down minutes on, the frozen lane never cleared)' : ''}` : 'none'}; the lane ${L.end}`);
      // (the fight's casualty is the one held: a wound bled into shock minutes later (would.js wouldTick, the lane frozen in the doorway
      // and never cleared) is the bleed's rule, not this fight's)
      assert(rows.every(L => L.upAt !== null && L.onA && L.alone === 0 && (L.casualty === null || L.late)), JSON.stringify(rows.map(L => ({ seed: L.seed, onA: L.onA, alone: L.alone, casualty: L.casualty, late: L.late }))));
    },
  },
  {
    name: 'R2: a man your #2 knows already (taken in and given back before he fired) is taken in again when he fires on the stack (the corporal on 15 frozen in room 2\'s doorway, room 2\'s man known to him by hand at the freeze; the first build skipped a known man: on nobody under his fire)',
    heavy: true, // (the v0.0.22 integration: the file over its quick CPU budget, 3 s (QUICK_FILE_CPU_S), on v0.0.21's runner; its whole lanes moved to the heavy suite as TECH §13.7 says, the case unchanged)
    timeoutMs: 120_000,
    fn() {
      // (as frozen(null), with W.known set for 2a at the freeze: the record a hand-back leaves)
      const g = createGame({ scenario: 'test-shoothouse', seed: 15, tier: 'cpl', opfor: 'live:fight,hide' }), s = g.state, H = s.armoury.range.house, W = H.two, R = s.armoury.range;
      const honest = houseHonestBot();
      let cut = null;
      const bot = (st, me, mem) => {
        if (cut !== null) return st.stop?.mode === 'stop' && st.stop.phase === 'choose' && !st.stop.doing && stepsOf(st).some(x => x.id === 'leave' && !x.off) ? { act: [stepAct('leave')] } : {};
        const d = st.stop?.doing;
        if (d?.beats && d.step === 'drill:room:in>o:w4:r2') {
          const run = d.beats.find(b => b.k === 'move' && (b.st === 'run' || b.st === 'done'));
          if (run && st.clock.ms - d.fromMs >= 1800) { cut = st.clock.ms; const T = R.turners.find(x => x.stand === '2a'); if (!W.contact && !W.eng) W.known[T.key] = st.clock.ms; return {}; }
        }
        return honest(st, me, mem);
      };
      let alone = 0, onA = false, known = null;
      runHouse(g, bot, { maxMs: 6 * 60_000, each: () => {
        const T = R.turners.find(x => x.stand === '2a');
        if (cut === null || H.end || H.live.casualty) return;
        known ??= W.known[T.key] !== undefined;
        const two = s.actors.list.find(a => a.who === W.pid);
        if (T.live?.st === 'fire' && seenK(s, two, T, s.clock.ms) >= 0.5 && !W.contact && !W.eng) alone++;
        if (W.contact?.key === T.key || W.eng?.key === T.key) onA = true;
      } });
      const casualty = H.live.casualty ? (H.live.casualty.who === W.pid ? 'his' : 'yours') : null;
      console.log(`      frozen at ${cut === null ? 'never' : sec(s, cut)} s, room 2's man known to him ${known}; your #2 on him ${onA}; alone under his fire ${alone} ticks; casualty ${casualty ?? 'none'}; the lane ${H.end?.why}`);
      assert(cut !== null && known && onA && alone === 0 && casualty === null, JSON.stringify({ cut, known, onA, alone, casualty }));
    },
  },
  {
    name: 'R3 (T2\'s belt): a casualty recorded between ticks with your "Clear!" due: the call says nothing and the lane runs to its cease fire (the sergeant on 48213, room:2, live; without the belt "Clear!" after "I\'m hit!", and the first belt halted the drill into a choice the casualty refuses, the clock stopped for good)',
    timeoutMs: 120_000,
    fn() {
      const lane = (strikeAt) => {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'room:2', opfor: 'live' }), s = g.state, H = s.armoury.range.house;
        let clearAt = null, struck = null;
        const after = [];
        const run = runHouse(g, houseHonestBot(), { maxMs: 90_000, each: (game) => {
          for (const f of game.facts('say')) {
            if (f.who === s.player.id && f.call === 'clear' && clearAt === null) clearAt = s.clock.ms - 50;
            if (struck !== null && f.who === s.player.id) after.push(f.text);
          }
          if (strikeAt !== null && struck === null && s.clock.ms >= strikeAt) {
            struck = s.clock.ms;
            const T = s.armoury.range.turners.find(t => t.stand === '2a'), me = s.actors.list.find(a => a.who === s.player.id);
            incoming(s, game.bus, { who: s.player.id, by: T.key, shot: { id: 'by-hand', fired: true, hole: { at: [0, 5] }, zone: 'head', part: 'head', load: 'marking', gun: s.people[T.live.who].kit.worn.sling, roll: { margin: 6 }, flight: { rangeM: 4.2 }, muzzle: { x: T.x, y: 1.4, z: T.z }, dirRad: Math.atan2(me.z - T.z, me.x - T.x), atMs: s.clock.ms } });
          }
        } });
        return { s, H, clearAt, struck, after, run };
      };
      // (the probe finds the tick your room 2 "Clear!" is said; the lane again, the strike made just before that tick)
      const probe = lane(null), L = lane(probe.clearAt);
      console.log(`      your "Clear!" due at ${probe.clearAt === null ? 'never' : sec(probe.s, probe.clearAt)} s; struck there: your words after it ${JSON.stringify(L.after)}; the lane ${L.H.end?.why ?? 'not ended'} (the clock ${fmt((L.s.clock.ms - (L.struck ?? L.s.clock.ms)) / 1000, 2)} s on from the strike)`);
      assert(probe.clearAt !== null && L.struck !== null && !L.after.some(t => /Clear/.test(t)) && L.H.end?.why === 'casualty', JSON.stringify({ clearAt: probe.clearAt, after: L.after, end: L.H.end?.why }));
    },
  },
];
