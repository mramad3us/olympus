// OLYMPUS tests: breach-shock, "Bang, then go"'s gauge F142, the shock and its read (its build sheet items 4 and 6, §0 items 4 and 11, §6 A, §8; COMBAT §7.11 step 2; defenders.md DF§3, DF§6): a shocked man (startled, flash-blind or stunned) starts no take-in, round, dash or aim; the flash blinds him exactly when the burst lies within supp.js FLASH_CONE_DEG 60° of his facing at its tick; men.js liveStateOf reads 'dazed' (and opfor.js opforLook draws 'daze', opforNow says dazed) exactly while his combat block says so; every passed identification inside a shock reads DAZED; the held man is laid on the threshold from the fill, so a marine through it is taken in 'sector'.
//
// On tests/opfor-world.mjs rpScript (room 1 scripted, R.house.bangGo by hand). The shock is read from the block's own fields at the
// tick (startleUntilMs, blindUntilMs, stunUntilMs), never through the helper under test. Fails without its fix: liveStateOf and the
// 'daze' frame (no dazed read at all), identify's liveStateOf (a shocked man read 'aiming'), the held start ('alert', not 'sector').
// The review of A (2026-11-19) adds two: the house's own bang (tests/bots/kit.mjs houseKitBot's "Flash it", where the G-11 really lands,
// by the far wall on most lanes) blinds every man facing the door, red with the men laid on the threshold (52 of 240 men unblinded
// on ten seeds); and the held door is a door held: 1a's first round on a marine through it comes before the loose man's, red with a
// loose man's aim counted from the facing he turned to (he was laid 1.15 s after the leaf moved and the two traces were one).
// The review of B and C (2026-11-19) adds the window's close: a man the bang knocked off his aim lays it on the door again once his
// shock ends, red without opfor.js brain's re-aim (he stood at his low ready, no aim begun, until a marine was in his eyes).
import { assert, fmt } from './helpers.mjs';
import { rpScript, liveGame, ROOM1 } from './opfor-world.mjs';
import { opforLook, opforNow } from '../src/sim/scenarios/opfor.js';
import { liveStateOf, LIVE_STATE, seenK } from '../src/sim/combat/men.js';
import { SEEN } from '../src/sim/people/perception.js';
import { startled, bandN, feltOf } from '../src/sim/combat/supp.js';
import { identify } from '../src/sim/combat/contact.js';
import { noteContact } from '../src/sim/people/mind.js';
import { FLASH_CONE_DEG, FLASH_BLIND_MS } from '../src/sim/combat/supp.js';
import { BREACH_STANDS, BREACH_SPOTS } from '../src/data/places/house-opfor.js';
import { houseKitBot } from './bots/kit.mjs';

const D2R = Math.PI / 180;
const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
// (shocked by his block at ms, read from its fields)
const blockShocked = (s, pid, ms) => { const c = s.actors.list.find(a => a.who === pid)?.combat; return !!c && ((c.startleUntilMs ?? -1) > ms || (c.blindUntilMs ?? 0) > ms || (c.stunUntilMs ?? 0) > ms); };
const spent = (L) => L.st === 'hands' || L.st === 'down' || L.st === 'out' || !!L.give;

export default [
  {
    name: 'breach-shock: a shocked man starts nothing (no take-in, round, dash or aim begun on a tick he is shocked), and liveStateOf, opforLook\'s frame and opforNow agree with his block at every tick: \'dazed\', \'daze\' exactly while startled, flash-blind or stunned and not spent',
    fn() {
      const off = [], tally = { ticks: 0, shocked: 0, dazed: 0, cases: [] };
      for (const c of [{ held: 'loose', open: 2500, enterAt: 300 }, { held: 'held', open: 0, enterAt: 1200 }, { held: 'loose', open: 0, enterAt: 600 }]) {
        const g = rpScript({ seed: 48213, held: c.held }), s = g.s;
        const step = () => {
          const t = s.clock.ms, before = Object.fromEntries(BREACH_STANDS.map(st => { const L = g.man(st).live; return [st, { fired: L.fired, move: L.move?.startMs ?? null, shocked: !spent(L) && blockShocked(s, L.who, t) }]; }));
          g.g.step(1, g.LEAVE);
          for (const st of BREACH_STANDS) {
            const T = g.man(st), L = T.live, b = before[st];
            tally.ticks++;
            if (b.shocked && !spent(L)) {
              tally.shocked++;
              if (L.eyes || L.eng || L.aiming || L.fired !== b.fired || (L.move && L.move.startMs !== b.move)) off.push({ st, at: t, why: 'began something shocked', eyes: !!L.eyes, eng: !!L.eng, aiming: !!L.aiming });
            }
            // (the read now, at the clock as it stands)
            const ms = s.clock.ms, want = !spent(L) && blockShocked(s, L.who, ms), look = opforLook(s, ms).find(m => m.key === T.key), now = opforNow(s, ms).find(m => m.key === T.key);
            if (want) tally.dazed++;
            if ((liveStateOf(s, T, ms) === 'dazed') !== want || (look.frame === 'daze') !== want || now.dazed !== want) off.push({ st, at: ms, want, read: liveStateOf(s, T, ms), frame: look.frame });
            if (!want && liveStateOf(s, T, ms) !== LIVE_STATE[L.st]) off.push({ st, at: ms, why: 'not LIVE_STATE', read: liveStateOf(s, T, ms) });
          }
        };
        const run = (ms) => { const t0 = s.clock.ms; while (s.clock.ms < t0 + ms) step(); };
        if (c.open) { g.open(); run(c.open); }
        g.bang(); run(c.enterAt);
        g.enter('me', [28.6, 11.2]); g.enter('two', [29.6, 11.2]); run(6000);
        tally.cases.push(`${c.held}${c.open ? ', the door open first' : ', the door shut'}: ${BREACH_STANDS.map(st => `${st} ${g.man(st).live.st}`).join(', ')}`);
      }
      console.log(`      ${tally.ticks} man-ticks, ${tally.shocked} lived shocked (nothing begun), ${tally.dazed} read dazed; ${tally.cases.join('; ')}; disagreeing ${off.length}`);
      assert(!off.length && tally.shocked > 50 && tally.dazed > 50, JSON.stringify(off.slice(0, 4)));
    },
  },
  {
    name: 'breach-shock: the flash blinds exactly when the burst lies within FLASH_CONE_DEG 60° of his facing at its tick: loose with the door open (both turned to it), loose with it shut (both facing the far wall), held with it shut (1a laid on the door, 1b not)',
    fn() {
      const rows = [], off = [];
      for (const c of [{ held: 'loose', open: true }, { held: 'loose', open: false }, { held: 'held', open: false }]) {
        const g = rpScript({ seed: 48213, held: c.held }), s = g.s;
        if (c.open) { g.open(); g.run(2500); }
        const t = s.clock.ms, offDeg = {};
        for (const st of BREACH_STANDS) { const a = g.actor(st); offDeg[st] = Math.abs(wrapA(Math.atan2(ROOM1.bangAt[1] - a.z, ROOM1.bangAt[0] - a.x) - a.headRad)) / D2R; }
        g.bang();
        for (const st of BREACH_STANDS) {
          const a = g.actor(st), blind = (a.combat?.blindUntilMs ?? 0) >= t + FLASH_BLIND_MS, want = offDeg[st] < FLASH_CONE_DEG;
          rows.push(`${c.held}/${c.open ? 'open' : 'shut'} ${st}: ${fmt(offDeg[st], 0)}° off, ${blind ? 'blind' : 'not blind'}`);
          if (blind !== want) off.push({ c, st, off: offDeg[st], blind });
        }
      }
      console.log(`      ${rows.join('; ')}; FLASH_CONE_DEG ${FLASH_CONE_DEG}, FLASH_BLIND_MS ${FLASH_BLIND_MS}`);
      assert(!off.length && rows.filter(r => r.includes(': ') && r.includes(' blind') && !r.includes('not blind')).length >= 3, JSON.stringify(off));
    },
  },
  {
    name: 'breach-shock: every passed identification of a man inside his shock reads \'dazed\' (contact.js identify through liveStateOf), in the scene\'s room and on the live lane alike; outside it, LIVE_STATE\'s word',
    fn() {
      const g = rpScript({ seed: 48213, held: 'loose' }), s = g.s, seen = [];
      g.open(); g.run(2500); g.bang(); g.run(200);
      g.enter('me', [28.6, 11.2]);
      const t0 = s.clock.ms;
      while (s.clock.ms < t0 + 3000) {
        g.g.step(1, g.LEAVE);
        const last = s.mind?.contact?.last;
        if (last && !seen.some(x => x.id === last.id)) for (const key of Object.keys(last.state ?? {})) { const T = s.armoury.range.turners.find(x => x.key === key); seen.push({ id: last.id, key, read: last.state[key], shocked: blockShocked(s, T.live.who, last.atMs) }); }
      }
      // (the live lane: 2a startled by hand, as a strike's startle leaves him, and identified at a pause made for it)
      const w = liveGame({ seed: 48213, tier: 'sgt', opfor: 'live:fight,fight', setup: 'room:2' }), T2 = w.s.armoury.range.turners.find(t => t.stand === '2a'), a2 = w.s.actors.list.find(x => x.who === T2.live.who), now = w.s.clock.ms;
      noteContact(w.s, { last: { id: 99, ids: [T2.key], seenMs: now, atMs: now, ms: 0, expect: null, n: 1, grade: null, parts: [], pick: T2.key, ident: {}, armour: {}, words: '' } });
      a2.combat = { supp: 0, suppAtMs: now, suppRate: 2, startleFromMs: now, startleUntilMs: now + 1000, blindUntilMs: null, dazzleUntilMs: null, deafUntilMs: null };
      let live = null, liveOk = 0;
      for (let i = 0; i < 40 && !live; i++) { const r = identify(w.s, w.s.player.id, T2.key, { bonus: 20, atMs: now + i }); if (r?.roll.ok) { live = w.s.mind.contact.last.state[T2.key]; liveOk = i + 1; } }
      a2.combat.startleUntilMs = now - 1;
      const after = identify(w.s, w.s.player.id, T2.key, { bonus: 20, atMs: now + 100 })?.roll.ok ? w.s.mind.contact.last.state[T2.key] : null;
      console.log(`      the scene's room: ${seen.map(x => `${x.key} ${x.read}${x.shocked ? ' (shocked)' : ''}`).join(', ') || 'no pause'}; the live lane: 2a startled read '${live}' (pass on look ${liveOk}), after the startle '${after}' (LIVE_STATE ${LIVE_STATE[T2.live.st]})`);
      assert(seen.length && seen.every(x => (x.read === 'dazed') === x.shocked) && seen.some(x => x.read === 'dazed'), JSON.stringify(seen));
      assert(live === 'dazed' && after === LIVE_STATE[T2.live.st], JSON.stringify({ live, after }));
    },
  },
  {
    name: 'breach-shock: the held door: with bangGo.held \'held\' 1a starts laid on the door (st \'aim\', aimed, his head on aimAt, the funnel inside the threshold, his eyes on the threshold, the door his cue) and takes a marine through it in \'sector\'; loose, 1a waits facing the far wall and takes him in \'alert\' after the door\'s cue; 1b never holds',
    fn() {
      const out = {};
      for (const held of ['held', 'loose']) {
        const g = rpScript({ seed: 48213, held }), s = g.s, T = g.man('1a'), a = g.actor('1a'), B = g.man('1b');
        const start = { st: T.live.st, posture: s.people[T.live.who].kit.carry.posture, aimAt: T.live.aimAt, cue: T.live.cue?.why ?? null, headDeg: fmt(a.headRad / D2R, 0), face: a.face, b: B.live.st };
        g.open(); g.enter('me', [29.0, 11.4], [27.0, 8.5]);
        let expect = null;
        for (let i = 0; i < 80 && !expect; i++) { g.g.step(1, g.LEAVE); expect = T.live.eyes?.expect ?? (T.live.known[`m:${s.player.id}`] !== undefined ? 'known' : null); }
        out[held] = { ...start, expect };
      }
      console.log(`      held: ${JSON.stringify(out.held)}; loose: ${JSON.stringify(out.loose)}`);
      assert(out.held.st === 'aim' && out.held.posture === 'aimed' && JSON.stringify(out.held.aimAt) === JSON.stringify(BREACH_SPOTS['1a'].aimAt) && out.held.face === 'down' && out.held.cue === 'door' && out.held.expect === 'sector' && out.held.b === 'wait', JSON.stringify(out.held));
      assert(out.loose.st === 'wait' && out.loose.posture !== 'aimed' && out.loose.expect === 'alert', JSON.stringify(out.loose));
    },
  },
  {
    name: 'breach-shock: on "Bang, then go" the read follows sight: a man taken in DAZED and seen in plain sight after is read as he is (liveStateOf) at every tick you see him, so the plaque\'s word, the stage\'s frame and T\'s line agree; his freeze reads COWERING at once (the review of A, 2026-11-19: DAZED for 4.15 s over a man drawn cowering)',
    fn() {
      const g = rpScript({ seed: 48213, held: 'loose' }), s = g.s, me = () => g.g.me();
      g.open(); g.run(2500); g.bang(); g.run(200);
      g.enter('me', [28.6, 11.2], [29.0, 8.5]);
      // (a pause takes both in, blind and dazed)
      let n = 0;
      while (n++ < 200 && !(BREACH_STANDS.every(st => s.mind?.contact?.last?.state?.[g.man(st).key] !== undefined))) g.g.step(1, g.LEAVE);
      const first = BREACH_STANDS.map(st => s.mind.contact.last.state[g.man(st).key]);
      const seenTicks = { n: 0, off: [], words: new Set() }, prev = {};
      let frozen = null;
      for (let i = 0; i < 200; i++) {
        // (the first man still up frozen by hand 5.5 s on, his eyes back, as choiceTick leaves a man: his band kept so the tick rolls nothing of its own)
        if (i === 110) {
          frozen = BREACH_STANDS.map(st => g.man(st)).find(T => !['down', 'out', 'hands'].includes(T.live.st)) ?? null;
          if (frozen) { const L = frozen.live, a = s.actors.list.find(x => x.who === L.who); L.band = bandN(feltOf(s, L.who)); L.st = 'freeze'; L.fromMs = s.clock.ms; L.choice = { what: 'freeze', band: L.band, atMs: s.clock.ms, grade: 'bad', dc: 12 }; L.eng = null; L.eyes = null; L.aiming = null; L.aimAt = null; L.move = null; a.stance = 'kneel'; }
        }
        g.g.step(1, g.LEAVE);
        const ms = s.clock.ms, last = s.mind.contact.last;
        const look = !(startled(s, me().who, ms) || (me().combat?.blindUntilMs ?? 0) > ms);
        for (const st of BREACH_STANDS) {
          const T = g.man(st), word = last.state?.[T.key], now = liveStateOf(s, T, ms), was = prev[st];
          prev[st] = now;
          if (!look || word === undefined || seenK(s, me(), T, ms) < SEEN) continue;
          seenTicks.n++; seenTicks.words.add(`${st} ${word}`);
          // (the look runs before the men's tick (the tick's order), so a change in this tick is read on the next: one tick, 50 ms)
          if (word !== now && word !== was) seenTicks.off.push({ st, ms, word, now, was });
        }
      }
      const cower = frozen && seenTicks.words.has(`${frozen.stand} cowering`) ? 'cowering' : null;
      console.log(`      taken in: ${first.join(', ')}; then ${seenTicks.n} man-ticks in plain sight, words ${[...seenTicks.words].join(', ')}; ${frozen?.stand ?? 'nobody'} frozen by hand, read ${cower ?? 'never cowering'}; disagreeing ${seenTicks.off.length} (a tick's lag allowed)`);
      assert(first.every(w => w === 'dazed') && seenTicks.n > 40 && !seenTicks.off.length && cower === 'cowering', JSON.stringify({ first, off: seenTicks.off.slice(0, 4), cower }));
    },
  },
  {
    name: 'breach-shock: the held door is a door held: a marine through it 1.4 s after its leaf moves (the corporal\'s pace) is taken in \'sector\' by the held man and \'alert\' by the loose one, whose aim from the far wall is still coming up (shot.js aimMsOf from the facing he turned from), and the held man\'s first round comes first',
    fn() {
      const out = {};
      for (const held of ['held', 'loose']) {
        const g = rpScript({ seed: 48213, held, bang: 'quiet' }), s = g.s, T = g.man('1a'), t0 = s.clock.ms;
        g.open(); g.run(1400);
        g.enter('me', [28.8, 11.4], [27.0, 8.5]);
        let expect = null, aimedAtMs = T.live.aiming ? T.live.aiming.untilMs - t0 : T.live.aimAt ? 0 : null, firstMs = null;
        for (let i = 0; i < 120 && firstMs === null; i++) {
          g.g.step(1, g.LEAVE);
          expect ??= T.live.eyes?.expect ?? null;
          if (T.live.eng && firstMs === null) firstMs = T.live.eng.rounds[0].atMs - t0;
        }
        out[held] = { expect, aimedAtMs, firstMs };
      }
      console.log(`      from the leaf: held ${JSON.stringify(out.held)}; loose ${JSON.stringify(out.loose)} (ms; aimedAtMs the loose man's aim laid, 0 laid from the fill); the held man's round ${out.held.firstMs !== null && out.loose.firstMs !== null ? out.loose.firstMs - out.held.firstMs : '?'} ms first`);
      assert(out.held.expect === 'sector' && out.loose.expect === 'alert' && out.held.firstMs !== null && out.loose.firstMs !== null && out.held.firstMs + 300 <= out.loose.firstMs, JSON.stringify(out));
    },
  },
  {
    name: 'breach-shock: the window closes: a man the bang knocked off his aim lays his rifle on the door again once his shock ends, with nobody in sight (held and loose, the door open 2.5 s before the bang), never while shocked (the review of B and C, 2026-11-19: he stood at his low ready until a marine was in his eyes, and a slow stack of 8 s cost nothing)',
    fn() {
      const rows = [], off = [];
      for (const held of ['held', 'loose']) {
        const g = rpScript({ seed: 48213, held }), s = g.s;
        g.open(); g.run(2500); const t0 = s.clock.ms; g.bang();
        const seen = {};
        for (let i = 0; i < 200; i++) {
          g.g.step(1, g.LEAVE);
          const ms = s.clock.ms;
          for (const st of BREACH_STANDS) {
            const L = g.man(st).live, k = s.people[L.who].kit.carry, m = (seen[st] ??= { shockTo: null, aimingAt: null, laidAt: null });
            const shocked = blockShocked(s, L.who, ms);
            if (shocked && (k.posture === 'aimed' || L.aiming)) off.push({ held, st, ms: ms - t0, why: 'aiming while shocked' });
            if (shocked) m.shockTo = null; else if (m.shockTo === null) m.shockTo = ms - t0;
            if (L.aiming && m.aimingAt === null) m.aimingAt = ms - t0;
            if (k.posture === 'aimed' && L.aimAt && m.laidAt === null && m.shockTo !== null) m.laidAt = ms - t0;
          }
        }
        for (const st of BREACH_STANDS) {
          const m = seen[st], L = g.man(st).live;
          rows.push(`${held} ${st}: shock to ${m.shockTo} ms, aim begun ${m.aimingAt}, laid ${m.laidAt} (${L.st}, aimAt ${JSON.stringify(L.aimAt)})`);
          if (m.shockTo === null || m.aimingAt === null || m.aimingAt > m.shockTo + 50 || m.laidAt === null || m.laidAt > m.shockTo + 2500 || JSON.stringify(L.aimAt) !== JSON.stringify(BREACH_SPOTS[st].aimAt)) off.push({ held, st, ...m });
        }
      }
      console.log(`      ${rows.join('; ')}; off ${off.length}`);
      assert(!off.length, JSON.stringify(off.slice(0, 4)));
    },
  },
  {
    name: 'breach-shock: the house\'s own bang ("Flash it" by tests/bots/kit.mjs houseKitBot, the G-11 where it really lands) blinds every man facing the door, on every sheet, held and loose, seed 48213 (the review of A, 2026-11-19: laid on the threshold, 1a and 1b faced its landings by the far wall 62° off and were only startled); the flash exactly by the cone',
    fn() { bangLanes([48213]); },
  },
  {
    name: 'breach-shock: the house\'s own bang over twenty seeds, every sheet, held and loose: every man blinded but where the G-11 lands at his feet (under 0.5 m, behind him, stunned by its blast: dazed all the same); the flash exactly by the cone',
    heavy: true,
    fn() { bangLanes([48213, ...Array.from({ length: 19 }, (_, i) => i + 1)]); },
  },
];

// (the house's own throw: the kit bot's "Flash it" on room 1 from GO to the burst, then each man's block at its tick: blind, by the
// cone from his facing then, or stunned with the burst at his feet. Prints the landings' spread and the men by outcome)
function bangLanes(seeds) {
  const tally = { men: 0, blind: 0, feet: 0, off: [], zs: [] };
  for (const seed of seeds) for (const tier of ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']) for (const held of ['loose', 'held']) {
    const g = rpScript({ seed, tier, held, bang: 'bang', loadout: 'flash', stay: true }), s = g.s;
    const bot = houseKitBot({ use: 'flash', base: tier === 'recruit' || tier === 'private' ? 'keys' : 'T' });
    const heads = {};
    for (let i = 0; i < 3000 && !(g.H.bursts ?? []).length && !g.R.end; i++) { for (const st of BREACH_STANDS) heads[st] = g.actor(st).headRad; g.g.step(1, bot); }
    const b = g.H.bursts?.[0];
    if (!b) { tally.off.push({ seed, tier, held, why: 'no burst' }); continue; }
    tally.zs.push(b.z);
    for (const st of BREACH_STANDS) {
      const a = g.actor(st), c = a.combat ?? {}, offDeg = Math.abs(wrapA(Math.atan2(b.z - a.z, b.x - a.x) - heads[st])) / D2R, dM = Math.hypot(b.x - a.x, b.z - a.z);
      const blind = (c.blindUntilMs ?? 0) >= b.atMs + FLASH_BLIND_MS, feet = !blind && dM < 0.5 && (c.stunUntilMs ?? 0) > b.atMs;
      tally.men++; if (blind) tally.blind++; if (feet) tally.feet++;
      if (blind !== (offDeg < FLASH_CONE_DEG) || !(blind || feet)) tally.off.push({ seed, tier, held, st, at: [fmt(b.x, 2), fmt(b.z, 2)], offDeg: fmt(offDeg, 1), dM: fmt(dM, 2), blind });
    }
  }
  const zs = tally.zs.sort((u, v) => u - v);
  console.log(`      ${tally.men} men in the bang: ${tally.blind} blinded, ${tally.feet} stunned with it at their feet, ${tally.off.length} neither or off the cone; its landings z ${fmt(zs[0], 2)} to ${fmt(zs.at(-1), 2)} (the far wall's face 8.08, the threshold 11.7), ${zs.filter(z => z < 9.8).length} of ${zs.length} by the far wall`);
  assert(!tally.off.length && tally.men === seeds.length * 24, JSON.stringify(tally.off.slice(0, 4)));
}
