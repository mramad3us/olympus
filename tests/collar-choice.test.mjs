// OLYMPUS tests: collar-choice, "Away the boarding party"'s gauges F156 (they choose by their doctrine) and F164's defenders' half (their own tourniquet) (its build sheet item 5, item 6, item 9, §0 items 5, 31, §6 A, §8; COMBAT §7.9, §7.11, §14.4; FT§3, FT§4.1, FT§7.1).
//
// The holdouts are drawn from the seed (src/sim/scenarios/opfor.js drawBoarding: pirates or smugglers 1 : 1, the armed men, the
// barricade, the deckhead man, the crew; at most four armed, six men and two armed a compartment), sheeted by their type (opforSheet's
// { cls, doctrine, inoc }), and choose on their own doctrine's table (CHOICE_TABLES by the man's skills.doctrine: 'security' the
// role-players' as built, 'irregular' with blind fire and flight, 'civilian' a freeze always). Each table is reproduced here from the
// code by the d20's twenty faces (supp.js NERVE_DC0, NERVE_PER, NERVE_K, checks.js grade) and sampled through choiceOf on 400 streams
// within 3 points; COMBAT T10's two rows (the clan boarder fights at felt 38; the cell member at felt 52: 65/13/12/10) are printed from
// the game. On the hauler's deck (tests/boarding-men.mjs: the boarding's own men by opfor.js fillOpfor on stage 0's boarding world):
// a crewman fires no round over 200 scripted rooms (pressed to pinned, a marine in his cabin, challenged or not), and a defender with a
// limb bleeding hard puts his own tourniquet on once his knock is over (aid.js tourniquetOf and applyTourniquet, B's: TQ_MS of nothing
// else), never before; and on 'real' a man going down says no "Hit!" (a 'wound' ledger's still does). Fails without the doctrine's
// tables (every man reads security's), the crew's freeze (a civilian on a roll), the self-aid or the "Hit!" guard.
import { assert, fmt } from './helpers.mjs';
import { boardingMen } from './boarding-men.mjs';
import { choiceOf, opforSheet, drawBoarding, parseBoarding, opforNow, CHOICE_TABLES, CHOICE_TABLE, COVER_BLIND, IRREG_BLIND_SHARE, BOARDING_TYPES, BOARDING_ARMED_MAX,
  BOARDING_MEN_MAX, BOARDING_ROOM_ARMED_MAX, BARRICADE_STAND, DECKHEAD_STAND, CREW_Q, RP_Q, protectedOf, PROTECTED_AFTER_MS, RP_SAY } from '../src/sim/scenarios/opfor.js';
import { newLedger } from '../src/sim/combat/would.js';
import { NERVE_DC0, NERVE_PER, NERVE_K, HARD_K, bandN } from '../src/sim/combat/supp.js';
import { grade } from '../src/sim/skills/checks.js';
import { downOf } from '../src/sim/body/wounds.js';
import { tourniquetOf, TQ_MS } from '../src/sim/body/aid.js';
import { stream, next } from '../src/core/rng.js';
import { TICK_MS } from '../src/core/clock.js';

const OUT = ['fight', 'cover', 'blind', 'freeze', 'flee', 'give'];
// (the streams sampled: the sheet's 400 leave a 12.5% cell's sampling error at 1.7 points, so its 3 points would fail on chance one cell
// in fifteen; 2,000 hold it at 0.7, the threshold kept)
const SAMPLES = 2000;
// (a bare state holding one man with a sheet: choiceOf's nerve check reads his sheet and the seed alone)
const bare = (sheet, seed = 48213) => ({ meta: { seed }, clock: { ms: 0 }, people: { p: { skills: sheet } } });
// (the d20 enumerated with the code's constants, the table his doctrine's, the cover-or-blind cell split by IRREG_BLIND_SHARE; surrender never near)
function enumerate(sheet, felt) {
  const nerve = Math.round(sheet.os * (NERVE_K[sheet.cls] ?? 0)), dc = NERVE_DC0 + Math.round(felt / NERVE_PER), band = bandN(felt), n = Object.fromEntries(OUT.map(k => [k, 0]));
  const table = CHOICE_TABLES[sheet.doctrine];
  for (let r = 1; r <= 20; r++) {
    if (!table) { n.freeze++; continue; }
    if (band < 2) { n.fight++; continue; }
    let what = table[Math.min(3, band)][grade(r + nerve - dc, r === 20 ? 20 : r === 1 ? 1 : 0)];
    if (what === 'give') what = 'freeze';
    if (what === COVER_BLIND) { n.blind += IRREG_BLIND_SHARE; n.cover += 1 - IRREG_BLIND_SHARE; } else n[what]++;
  }
  return OUT.map(k => Math.round(n[k] * 5 * 10) / 10);
}
const sample = (sheet, felt, N = SAMPLES) => {
  const s = bare(sheet), n = Object.fromEntries(OUT.map(k => [k, 0]));
  for (let i = 0; i < N; i++) n[choiceOf(s, 'p', { felt, atMs: 1000 + i * TICK_MS, key: 'rp:t' }).what]++;
  return OUT.map(k => Math.round(n[k] / N * 1000) / 10);
};
const SHEETS = {
  security: opforSheet(RP_Q),
  pirate: opforSheet(BOARDING_TYPES.pirates.q, { cls: BOARDING_TYPES.pirates.cls, doctrine: 'irregular', inoc: 0 }),
  smuggler: opforSheet(BOARDING_TYPES.smugglers.q, { cls: BOARDING_TYPES.smugglers.cls, doctrine: 'irregular', inoc: 0 }),
  crew: opforSheet(CREW_Q, { cls: 'civilian', doctrine: 'civilian', inoc: 0 }),
};

export default [
  {
    name: 'collar-choice: each doctrine\'s table from the code by the d20 and sampled through choiceOf over 2,000 streams (the sheet\'s 400 and more) within 3 points, read off the man\'s own skills.doctrine (security as built, irregular with blind fire 1 : 1 and flight, civilian a freeze always and no roll); COMBAT T10\'s two rows printed from the game (fails with one table for all)',
    fn() {
      const off = [], rows = [];
      for (const [who, sheet] of Object.entries(SHEETS)) for (const felt of [30, 50, 60, 75, 90]) {
        const e = enumerate(sheet, felt), m = sample(sheet, felt), d = Math.max(...e.map((v, i) => Math.abs(v - m[i])));
        rows.push(`${who} ${felt}: ${e.join('/')} | ${m.join('/')}`);
        if (d > 3) off.push({ who, felt, e, m });
      }
      console.log(`      fight/cover/blind/freeze/flee/give %, the code by the d20 | choiceOf over ${SAMPLES}:\n        ${rows.join('\n        ')}`);
      // (the doctrine is the man's own: the same felt and stream on a security and an irregular sheet of the same Nerve differ only in the cells)
      const civ = choiceOf(bare(SHEETS.crew), 'p', { felt: 95, atMs: 5, key: 'rp:t' });
      // (T10: the clan boarder, Nerve 6 (Warfighting 30, criminal); the cell member, Nerve 3 (Warfighting 15))
      const boarder = { ...SHEETS.pirate, os: 30 }, cell = { ...SHEETS.pirate, os: 15 };
      const t1 = choiceOf(bare(boarder), 'p', { felt: 38, atMs: 9, key: 'rp:t' }), t2 = enumerate(cell, 52);
      console.log(`      T10: the clan boarder (Nerve ${Math.round(30 * NERVE_K.criminal)}) at felt 38: ${t1.what}, grade ${t1.grade}; the cell member (Nerve ${Math.round(15 * NERVE_K.criminal)}) at felt 52: ${t2.join('/')} (COMBAT's 65/13/12/10/0/0); a crewman at felt 95: ${civ.what}, grade ${civ.grade}`);
      console.log(`      the sheets: pirate os ${SHEETS.pirate.os} (${SHEETS.pirate.cls}, hardening ${Math.round(SHEETS.pirate.os * HARD_K.criminal)}), smuggler os ${SHEETS.smuggler.os} (${SHEETS.smuggler.cls}, ${Math.round(SHEETS.smuggler.os * HARD_K.spacer)}), crew os ${SHEETS.crew.os}; security's table is CHOICE_TABLE: ${CHOICE_TABLES.security === CHOICE_TABLE}`);
      assert(!off.length && t1.what === 'fight' && t1.grade === null && t2[0] === 65 && Math.abs(t2[1] - 12.5) < 0.1 && Math.abs(t2[2] - 12.5) < 0.1 && t2[3] === 10
        && civ.what === 'freeze' && civ.grade === null && CHOICE_TABLES.security === CHOICE_TABLE && SHEETS.pirate.doctrine === 'irregular' && SHEETS.security.doctrine === 'security', JSON.stringify({ off: off.slice(0, 3), t1, t2, civ }));
    },
  },
  {
    name: 'collar-choice: the draw over 2,000 seeds: pirates and smugglers 1 : 1, their armed men within their ranges, at most four armed, six men and two armed a compartment, the barricade 1 in 2 (pirates) and 1 in 3, the deckhead man 1 in 3 (pirates only), the crew 2 (pirates) or 2 to 3, posts in the draw\'s order; a named type draws the seed\'s deck, a whole code plays as written and round-trips',
    fn() {
      const N = 2000, t = { pirates: 0, smugglers: 0 }, bar = { pirates: 0, smugglers: 0 }, head = { pirates: 0, smugglers: 0 }, armed = { pirates: {}, smugglers: {} }, crew = { pirates: {}, smugglers: {} }, off = [];
      for (let seed = 1; seed <= N; seed++) {
        const d = drawBoarding(seed), A = d.armed.map(e => e.stand), C = d.crew.map(e => e.stand);
        t[d.type]++;
        if (A.includes(BARRICADE_STAND)) bar[d.type]++;
        if (A.includes(DECKHEAD_STAND)) head[d.type]++;
        armed[d.type][A.length] = (armed[d.type][A.length] ?? 0) + 1; crew[d.type][C.length] = (crew[d.type][C.length] ?? 0) + 1;
        const rooms = {};
        for (const st of A) rooms[st[0]] = (rooms[st[0]] ?? 0) + 1;
        if (A.length > BOARDING_ARMED_MAX || A.length + C.length > BOARDING_MEN_MAX || Object.values(rooms).some(n => n > BOARDING_ROOM_ARMED_MAX) || d.armed.some((e, i) => e.post !== `belt-mule:holdout-${i + 1}`) || d.crew.some((e, i) => e.post !== `belt-mule:crew-${i + 1}`)) off.push(d.code);
        if (d.type === 'smugglers' && A.includes(DECKHEAD_STAND)) off.push(`deckhead ${d.code}`);
        if (d.type === 'pirates' && A.includes('2a')) off.push(`2a ${d.code}`);
        const again = drawBoarding(seed, { holdouts: d.type }), whole = drawBoarding(seed + 7, { holdouts: d.code });
        if (again.code !== d.code || whole.code !== d.code) off.push(`code ${d.code} ${again.code} ${whole.code}`);
      }
      const pct = (a, b) => fmt(100 * a / b, 1);
      console.log(`      ${N} seeds: pirates ${t.pirates}, smugglers ${t.smugglers}; the barricade ${pct(bar.pirates, t.pirates)}% of pirates, ${pct(bar.smugglers, t.smugglers)}% of smugglers; the deckhead ${pct(head.pirates, t.pirates)}% of pirates, ${head.smugglers} smugglers; armed by count ${JSON.stringify(armed)}; crew ${JSON.stringify(crew)}; parseBoarding('pirates:9z/') ${JSON.stringify(parseBoarding('pirates:9z/'))}; off ${off.length}`);
      assert(!off.length && Math.abs(t.pirates / N - 0.5) < 0.03 && Math.abs(bar.pirates / t.pirates - 0.5) < 0.04 && Math.abs(bar.smugglers / t.smugglers - 1 / 3) < 0.04 && Math.abs(head.pirates / t.pirates - 1 / 3) < 0.04
        && Object.keys(armed.pirates).every(n => n >= 3 && n <= 4 || n === '3') && Object.keys(armed.smugglers).every(n => n >= 2 && n <= 3) && Object.keys(crew.pirates).join() === '2' && Object.keys(crew.smugglers).every(n => n >= 2 && n <= 3)
        && JSON.stringify(parseBoarding('pirates:9z/')) === '{"type":"pirates"}', JSON.stringify({ off: off.slice(0, 5), t, bar, head }));
    },
  },
  {
    name: 'collar-choice: aboard, each man is his type\'s (pirates criminal, smugglers spacer, the crew civilian: doctrine, class, inoculation 0), on his face with his boots locked; the crew a no-shoot cowering from the start, unarmed, firing 0 rounds over 200 scripted rooms (pressed to pinned, a marine in his cabin, challenged or not)',
    fn() {
      const w = boardingMen({ seed: 48213, holdouts: 'pirates', stands: ['1a', '4b', '2c', '2d'] }), s = w.s, off = [];
      for (const T of w.men) {
        const p = s.people[T.live.who], a = w.actor(T.stand), sh = p.skills;
        const want = T.live.unarmed ? ['civilian', 'civilian'] : ['irregular', 'criminal'];
        if (sh.doctrine !== want[0] || sh.cls !== want[1] || sh.inoc.pts !== 0 || a.anchor !== 'boots' || (T.stand === '4b') !== (a.onFace === 'deckhead')) off.push({ stand: T.stand, d: sh.doctrine, cls: sh.cls, anchor: a.anchor, face: a.onFace });
        if (T.live.unarmed && (T.face !== 'noshoot' || T.live.st !== 'freeze' || T.holds !== 'hands')) off.push({ stand: T.stand, face: T.face, st: T.live.st });
      }
      const crew = w.men.filter(T => T.live.unarmed), r = stream(48213, 'test:crew-rooms'), me = w.me(), sts = {};
      w.H.goAtMs = s.clock.ms;
      let challenged = 0, gave = 0;
      for (let room = 0; room < 200; room++) {
        for (const T of crew) { w.press(T.stand, Math.round(20 + next(r) * 80)); }
        // (a marine in cabin 1, at a drawn point of it, or out in the passage)
        const inside = next(r) < 0.7;
        me.x = inside ? 3.0 + next(r) * 3.5 : 5.0; me.z = inside ? 0.6 + next(r) * 3.0 : 4.75;
        if (inside && next(r) < 0.2 && room > 150) {
          const T = crew[room % crew.length];
          s.stop = { mode: 'stop', who: s.player.id, pick: T.key, doing: { list: ['contact:challenge'], i: 0, untilMs: s.clock.ms + 1200, target: T.key } };
          challenged++;
        }
        // (half a second a room: a challenge's 1.2 s runs over the next room, its end judged there)
        w.run(500);
        if (s.stop?.doing && s.clock.ms > s.stop.doing.untilMs) delete s.stop;
        for (const T of crew) sts[T.live.st] = (sts[T.live.st] ?? 0) + 1;
      }
      for (const T of crew) if (T.live.st === 'hands') gave++;
      const fired = crew.reduce((n, T) => n + (T.live.fired ?? 0), 0), shots = (w.H.live.shots ?? []).filter(x => crew.some(T => T.key === x.by)).length;
      const takeIns = crew.reduce((n, T) => n + Object.keys(T.live.known ?? {}).length, 0);
      console.log(`      ${w.men.map(T => `${T.stand} ${s.people[T.live.who].skills.doctrine}/${s.people[T.live.who].skills.cls}`).join(', ')}; the crew over 200 rooms: states ${JSON.stringify(sts)}, rounds ${fired}, shots on the record ${shots}, challenged ${challenged}, given up ${gave}, marines taken in ${takeIns} (a crewman's eyes take in what they see; his hands never aim); off ${off.length}`);
      assert(!off.length && fired === 0 && shots === 0 && !sts.aim && !sts.fire && !sts.blind && !sts.cover && !sts.move, JSON.stringify({ off, fired, shots, sts }));
    },
  },
  {
    name: 'collar-choice: a defender with a limb bleeding hard puts his own tourniquet on (COMBAT §7.3 level 2, aid.js tourniquetOf and applyTourniquet, B\'s) once his knock is over and never before, TQ_MS of nothing else, the bleed then stopped and cared \'tourniquet\'; a torso wound gets none (fails without the self-aid)',
    fn() {
      const rows = [], off = [];
      for (const [seed, part] of [[48213, 'arms'], [11, 'legs'], [19, 'torso']]) {
        const w = boardingMen({ seed, holdouts: 'pirates', stands: ['4a', '4b'] }), s = w.s, T = w.man('4a'), pid = T.live.who;
        w.H.goAtMs = s.clock.ms;
        w.run(200);
        let k = 0, hurt = null;
        // (the torso at a margin of 12: no arm in front of it (wounds.js armShareOf, none from 10), so no limb to put a tourniquet on)
        while (k++ < (part === 'torso' ? 1 : 8) && !(hurt = tourniquetOf(s.people[pid].body ?? {}, s.clock.ms))) { w.shoot('4a', { part, zone: part === 'torso' ? 'A' : 'C', margin: part === 'torso' ? 12 : 0 }); w.tick(); }
        const t0 = s.clock.ms, body = s.people[pid].body ?? {};
        let startAt = null, earliest = null, endAt = null, during = 0;
        for (let i = 0; i < 2400 && endAt === null; i++) {
          w.tick();
          const ms = s.clock.ms, can = !downOf(body, ms).down && !!tourniquetOf(body, ms);
          if (can && earliest === null) earliest = ms;
          if (T.live.aid && startAt === null) startAt = ms;
          if (T.live.aid && (T.live.eng || T.live.st === 'blind' || T.live.st === 'fire')) during++;
          if (startAt !== null && !T.live.aid) endAt = ms;
        }
        const cared = body.injuries?.filter(i => i.cared === 'tourniquet').length ?? 0;
        rows.push(`${seed} ${part}: ${k - 1} rounds, a hard bleed ${hurt ? `(${hurt.part} ${fmt(hurt.rate ?? 0, 2)} %/min)` : 'none'}; conscious with it at +${earliest === null ? '-' : fmt((earliest - t0) / 1000, 2)} s, his tourniquet from +${startAt === null ? '-' : fmt((startAt - t0) / 1000, 2)} s to +${endAt === null ? '-' : fmt((endAt - t0) / 1000, 2)} s; cared ${cared}`);
        if (part === 'torso') { if (hurt || startAt !== null || cared) off.push({ seed, part, startAt, hurt: hurt?.part }); continue; }
        if (!hurt) continue;
        if (earliest !== null && (startAt !== earliest + TICK_MS && startAt !== earliest)) off.push({ seed, earliest, startAt });
        if (startAt !== null && (endAt - startAt < TQ_MS || endAt - startAt > TQ_MS + 2 * TICK_MS || !cared || during)) off.push({ seed, startAt, endAt, cared, during });
      }
      console.log(`      ${rows.join('; ')}; TQ_MS ${TQ_MS}`);
      assert(!off.length && rows.some(r => /cared [1-9]/.test(r)), JSON.stringify(off));
    },
  },
  {
    name: 'collar-choice: hors de combat, opfor.js protectedOf (F155\'s predicate; the fault \'protected\' is D\'s houseShot\'s): a crewman \'unarmed\' from his first tick; an armed man up null (cowering or fleeing included), \'down\' from PROTECTED_AFTER_MS after his fall and \'hands\' from PROTECTED_AFTER_MS after his give (a pair\'s second round already in the air is not a new decision)',
    fn() {
      const w = boardingMen({ seed: 48213, holdouts: 'pirates', stands: ['4a', '4b', '2c'] }), s = w.s, rows = [], off = [];
      const crew = w.man('2c'), A = w.man('4a'), B = w.man('4b'), t0 = s.clock.ms;
      const at = (T, d) => protectedOf(s, T, t0 + d);
      rows.push(`2c at +0: ${at(crew, 0)}`); if (at(crew, 0) !== 'unarmed') off.push('crew');
      // (4a cowering, then fleeing: lawful)
      A.live.st = 'freeze'; const c1 = at(A, 0); A.live.st = 'flee'; const c2 = at(A, 0);
      rows.push(`4a cowering ${c1}, fleeing ${c2}`); if (c1 !== null || c2 !== null) off.push('cower/flee');
      // (4a down at t0)
      A.live.st = 'down'; A.live.downAtMs = t0; A.stoppedAtMs = t0;
      const d = [0, 350, PROTECTED_AFTER_MS - 50, PROTECTED_AFTER_MS, 2000].map(ms => `${ms}:${at(A, ms)}`);
      rows.push(`4a down at +0: ${d.join(' ')}`);
      if (at(A, 350) !== null || at(A, PROTECTED_AFTER_MS) !== 'down') off.push('down');
      // (4b gives at t0: his give's first tick)
      B.live.st = 'hands'; B.live.gaveAtMs = t0; B.live.give = { atMs: t0, dropAtMs: t0 + 600 }; B.face = 'noshoot';
      const h = [0, 350, PROTECTED_AFTER_MS, 2000].map(ms => `${ms}:${at(B, ms)}`);
      rows.push(`4b gave at +0: ${h.join(' ')}`);
      if (at(B, 0) !== null || at(B, PROTECTED_AFTER_MS) !== 'hands') off.push('hands');
      console.log(`      ${rows.join('; ')}; PROTECTED_AFTER_MS ${PROTECTED_AFTER_MS}`);
      assert(!off.length, JSON.stringify({ off, rows }));
    },
  },
  {
    name: 'collar-choice: no "Hit!" on the real ledger: two pirates put down by your pairs say nothing (FT§5.5, the build sheet item 7: down is the body\'s, never announced), and the same rounds on a \'wound\' ledger still say it, once a man (the review of v0.0.27: nothing failed without the guard)',
    fn() {
      const out = {};
      for (const rule of ['real', 'wound']) {
        const w = boardingMen({ seed: 48213, holdouts: 'pirates', stands: ['3a', '3b', '4a', '4b'], room: 'bunks' });
        if (rule === 'wound') w.H.live.would = newLedger('wound');
        w.H.goAtMs ??= w.s.clock.ms;
        w.run(1000);
        const n0 = w.facts.length;
        for (const st of ['3a', '3b']) { w.shoot(st, { zone: 'A', margin: 6 }); w.shoot(st, { zone: 'A', margin: 6 }); }
        w.run(500);
        out[rule] = { down: ['3a', '3b'].filter(st => w.man(st).live.st === 'down').length, hit: w.facts.slice(n0).filter(([k, f]) => k === 'say' && f.text === RP_SAY.down).length };
      }
      console.log(`      two pirates, two pairs each: on 'real' ${out.real.down} down, "${RP_SAY.down}" said ${out.real.hit}; on 'wound' ${out.wound.down} down, said ${out.wound.hit}`);
      assert(out.real.down === 2 && out.real.hit === 0 && out.wound.down === 2 && out.wound.hit === 2, JSON.stringify(out));
    },
  },
];
