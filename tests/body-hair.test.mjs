// body-hair: the hair, grown on every head and kept in regulation (the build sheet 0.0.6 §2.2, §5.2, §8 items
// 16 to 24; the user, 2026-11-06: "we should have to groom our hair the same way we will have to groom our
// beards and a soldier with half balding hair would 100% go fully shaved head for service"). Printed: each
// cut's lengths and steps at 0, 3, 7, 10 and 14 sols; the squad's barber cycles and steps over 30 sols; the
// due day said. Held: 0.40 mm a day; the hours since the cut lived and skipped alike; the clippers and the
// barber reset them; a thinning man is offered the shaved head only; New career's player starts fresh; the
// squad is never out of regulation; v0.0.5's cuts are mapped on load (people:cuts) and a new save loads unchanged.
import { assert, fmt, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { HOUR_MS, SEC_MS, SOL_MS, MIN_MS } from '../src/core/clock.js';
import { marsTimeText } from '../src/core/calendar.js';
import { playerId } from '../src/core/ids.js';
import { toJSON } from '../src/core/state.js';
import { CUTS, HAIR_STYLES, LEGACY_CUTS } from '../src/data/people/looks.js';
import { HAIR, HAIR_BANDS } from '../src/data/body/needs.js';
import { START_MS, SITES } from '../src/data/setting/calendar.js';
import { hairOf, hairAt, squadHairH, cutsFor, cutHair, setCut, SOL_H, hairStepOf, cutIdOf } from '../src/sim/body/hair.js';
import { bodyAdvance, bodyOf, envOf, loadOf, groom, withLedgers } from '../src/sim/body/body.js';
import { withDefaults, copy } from '../src/sim/body/record.js';
import { upgradeCuts } from '../src/sim/people/domain.js';

const LON = SITES.melas.lonEDeg;
const read = (name) => gunzipSync(readFileSync(path.join(root, 'tests', 'saves', `${name}.json.gz`))).toString('utf8');
const squadOf = (s) => Object.values(s.units['2/4-E-2-1'].billets).filter(id => id !== playerId(s));

export default [
  {
    name: 'each cut\'s lengths and steps at 0, 3, 7, 10 and 14 sols: 0.40 mm an Earth day (Loussouarn et al. 2005), the steps at 0.3, 0.7 and 1.0 of the cut\'s dueSols, its band\'s words with the day it goes over',
    fn() {
      for (const cut of Object.keys(CUTS)) {
        const cols = [0, 3, 7, 10, 14].map(sols => {
          const r = hairAt(cut, sols * SOL_H, START_MS, LON);
          return `${sols} sols ${r.mm.sides === null ? '' : `${fmt(r.mm.sides, 1)}/`}${fmt(r.mm.top, 1)} mm step ${r.step} ${r.band.id}`;
        });
        console.log(`      ${CUTS[cut].word} (due ${CUTS[cut].dueSols} sols): ${cols.join('; ')}`);
      }
      const day = hairAt('lowReg', 24, 0).mm.top - hairAt('lowReg', 0, 0).mm.top;
      const tenSols = hairAt('highTight', 10 * SOL_H, 0).mm.sides;
      console.log(`      a day: ${fmt(day, 3)} mm (HAIR.MM_DAY ${HAIR.MM_DAY}); a sol ${fmt(HAIR.MM_DAY * SOL_H / 24, 3)} mm; high and tight's sides after 10 sols ${fmt(tenSols, 2)} mm`);
      assert(Math.abs(day - 0.40) <= 0.01, `a day's growth ${day}`);
      for (const cut of ['highTight', 'lowReg', 'medReg', 'shaved']) {
        const steps = [0, 2.9, 3.1, 6.9, 7.1, 9.9, 10.1].map(sols => hairAt(cut, sols * SOL_H).step).join('');
        assert(steps === '0011223', `${cut}: steps ${steps}`);
      }
      // (the due day: the weekday the cut reaches its dueSols, from New career's start, Monday Sol 590)
      const r = hairAt('lowReg', 7.5 * SOL_H, START_MS, LON);
      console.log(`      a low regulation cut 7.5 sols old on Monday 12:39: "${r.band.words}" (due ${marsTimeText(r.dueMs, LON)}, ${r.dueDay}); regulation ${r.regulation}`);
      assert(r.band.id === 'due' && r.band.words === `Haircut due ${r.dueDay}.` && r.dueDay === 'Thursday' && r.regulation, JSON.stringify(r.band));   // (Monday 12:39 plus 2.5 sols: Thursday 00:19)
      assert(HAIR_BANDS.map(b => b.id).join() === 'fresh,growing,due,over' && !hairAt('lowReg', 10.01 * SOL_H).regulation, 'the bands');
    },
  },
  {
    name: 'the hours since the cut grow in the stepper as the stubble does: one 8-hour call equals 28,800 one-second calls, and in the game an 8-hour skip moves them 8 hours',
    fn() {
      const b = withDefaults({ v: 2, tmpl: 'm-adult' }), seg = { env: envOf({}), load: loadOf({ met: 1.5 }) };
      b.atMs = START_MS;
      const a = copy(b);
      bodyAdvance(a, seg, START_MS, START_MS + 8 * HOUR_MS);
      for (let t = START_MS; t < START_MS + 8 * HOUR_MS; t += SEC_MS) bodyAdvance(b, seg, t, t + SEC_MS);
      console.log(`      from ${withDefaults({}).hair.h} h: one call ${fmt(a.hair.h, 9)} h, 28,800 calls ${fmt(b.hair.h, 9)} h; stubble ${fmt(a.hygiene.stubbleH, 9)}/${fmt(b.hygiene.stubbleH, 9)} h`);
      assert(Math.abs(a.hair.h - 32) < 1e-9 && Math.abs(a.hair.h - b.hair.h) < 1e-9, `${a.hair.h} ${b.hair.h}`);
      const g = createGame({ scenario: 'barracks', seed: 48213, hour: 13 }), s = g.state, pid = playerId(s);
      const h0 = hairOf(s, pid).h, t0 = s.clock.ms;
      g.skipNow({ activity: 'wait', planMs: 8 * HOUR_MS, mask: 'D' });
      const h1 = hairOf(s, pid).h, rec = bodyOf(s, pid).hair.h;
      console.log(`      the barracks at 13:00, an 8-hour skip (${fmt((s.clock.ms - t0) / HOUR_MS, 2)} h): ${fmt(h0, 4)} → ${fmt(h1, 4)} h (the record ${fmt(rec, 4)} at its atMs)`);
      assert(Math.abs(h1 - h0 - (s.clock.ms - t0) / HOUR_MS) < 1e-6, `${h0} → ${h1} over ${(s.clock.ms - t0) / HOUR_MS} h`);
    },
  },
  {
    name: 'a new join arrives fresh from the barber (the template\'s cut a day old): New career\'s player at 12:39 reads "Fresh from the barber."; 8 sols on, the sides grown and "Haircut due …"; the clippers (a shaved head) and the barber\'s chair reset the cut',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: 48213 }), s = g.state, pid = playerId(s), me = s.people[pid];
      const h = hairOf(s, pid);
      console.log(`      ${me.name.given} ${me.name.family}'s ${h.word} at ${marsTimeText(s.clock.ms, LON)}: ${fmt(h.h, 1)} h (${fmt(h.sols, 2)} sols), sides ${h.mm.sides === null ? '-' : fmt(h.mm.sides, 2)} mm, step ${h.step}, "${h.band.words}"`);
      assert(h.step === 0 && h.band.id === 'fresh', JSON.stringify(h.band));
      const later = hairOf(s, pid, s.clock.ms + 8 * SOL_MS);
      console.log(`      8 sols on: step ${later.step}, "${later.band.words}" (${later.dueDay})`);
      assert(later.step === 2 && later.band.words.startsWith('Haircut due '), JSON.stringify(later.band));
      // (the barber: a cut to the chosen cut, the hours to 0, the look a new object; the facts told)
      g.clearFacts();
      withLedgers(me.body, { hairH: 200 });
      const look0 = me.look, other = cutsFor(me).find(c => c !== me.look.hair.style);
      const r = cutHair(s, pid, { cut: other }, s.clock.ms, g.bus);
      const after = hairOf(s, pid), facts = g.bus.events.filter(([t, d]) => t === 'look' || (t === 'body-event' && d.kind === 'haircut')).map(([t, d]) => `${t} ${d.kind ?? d.what} ${d.to ?? d.cut}`);
      console.log(`      the barber's chair at 200 h: ${JSON.stringify(r)}; now ${after.word}, ${fmt(after.h, 3)} h; facts: ${facts.join(', ')}`);
      assert(r.changed && me.look !== look0 && me.look.hair.style === other && after.h < 1e-6 && facts.length === 2, JSON.stringify({ r, h: after.h, facts }));
      // (the clippers at a sink: groom's clip, a shaved head's buzz)
      setCut(s, pid, 'shaved', s.clock.ms, g.bus);
      withLedgers(me.body, { hairH: 180 });
      groom(s, pid, { clip: true }, s.clock.ms, g.bus);
      const buzz = hairOf(s, pid);
      console.log(`      the clippers at 180 h on a shaved head: ${fmt(buzz.h, 3)} h, step ${buzz.step}; the groom's bits ${g.bus.events.filter(([t, d]) => t === 'body-event' && d.kind === 'groom').map(([, d]) => d.amount).join()}`);
      assert(buzz.h < 1e-6 && buzz.cut === 'shaved', JSON.stringify(buzz));
    },
  },
  {
    name: 'a thinning man is offered the shaved head only (the user, 2026-11-06: "a soldier with half balding hair would 100% go fully shaved head for service"); the barber cuts nothing else for him',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: 48213 }), s = g.state;
      const thin = Object.values(s.people).filter(p => p.look?.hair?.thin), all = Object.values(s.people).filter(p => p.sex === 'm');
      console.log(`      seed 48213: ${thin.length} of ${all.length} men thinning, all shaved: ${thin.every(p => p.look.hair.style === 'shaved')}; e.g. ${thin.slice(0, 4).map(p => `${p.name.family} (${p.service.rank})`).join(', ')}`);
      assert(thin.length > 0 && thin.every(p => p.sex === 'm' && p.look.hair.style === 'shaved' && cutsFor(p).join() === 'shaved'), 'thinning men');
      const p = thin[0], r = cutHair(s, p.id, { cut: 'highTight' }, s.clock.ms, g.bus);
      assert(r.cut === 'shaved' && p.look.hair.style === 'shaved', `asked high and tight: ${JSON.stringify(r)}`);
      const man = all.find(q => !q.look.hair.thin), woman = Object.values(s.people).find(q => q.sex === 'f');
      console.log(`      the cuts offered: a thinning man ${cutsFor(p).join(', ')}; a man ${cutsFor(man).join(', ')}; a woman ${cutsFor(woman).join(', ')}`);
      assert(cutsFor(man).join() === HAIR_STYLES.m.map(x => x[0]).join() && cutsFor(woman).join() === HAIR_STYLES.f.map(x => x[0]).join(), 'the cuts by sex');
    },
  },
  {
    name: 'the squad keeps its hair by the barber in closed form: each a cycle of 7, 8 or 9 sols (0.7 to 0.9 of 10), cut at 12:00 local; over 30 sols never out of regulation',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: 48213 }), s = g.state;
      const ids = squadOf(s), rows = [];
      let worst = 0, steps = new Set();
      for (const id of ids) {
        const p = s.people[id], cut = cutIdOf(p.look, p.sex);
        let maxH = 0, cuts = 0, prev = Infinity;
        for (let t = s.clock.ms; t < s.clock.ms + 30 * SOL_MS; t += 30 * MIN_MS) {
          const h = squadHairH(48213, id, cut, t, LON), st = hairStepOf(s, id, t);
          if (h < prev) cuts++;
          prev = h; maxH = Math.max(maxH, h); steps.add(st);
          worst = Math.max(worst, h / SOL_H / CUTS[cut].dueSols);
        }
        rows.push(`${p.name.family} ${CUTS[cut].word} every ${fmt(maxH / SOL_H, 1)} sols (${cuts} cuts)`);
      }
      for (let i = 0; i < rows.length; i += 4) console.log(`      ${rows.slice(i, i + 4).join('; ')}`);
      console.log(`      over 30 sols: the steps drawn ${[...steps].sort().join(', ')}; the most grown ${fmt(worst * 100, 1)}% of a cut's dueSols (never over: 100%)`);
      assert(worst < 1 && !steps.has(3), `a squadmate out of regulation: ${worst}`);
      // (a cut is at noon local: the hours since it at 12:00 are 0 on a cut's sol)
      const id = ids[0], p = s.people[id], cut = cutIdOf(p.look, p.sex);
      let minH = Infinity;
      for (let t = s.clock.ms; t < s.clock.ms + 10 * SOL_MS; t += MIN_MS) minH = Math.min(minH, squadHairH(48213, id, cut, t, LON));
      assert(minH < 1 / 60 + 1e-9, `the cut's minute: ${minH} h`);
    },
  },
  {
    name: 'v0.0.5\'s cuts are mapped on load (people:cuts: crew to low regulation, a man\'s short to medium regulation, bald to the shaved head, no thinning drawn); a new save loads unchanged and sets no flag',
    fn() {
      const json = read('v0.0.4-barracks-1300'), old = JSON.parse(json);
      const before = {};
      for (const p of Object.values(old.people)) if (p.look?.hair) before[`${p.sex}:${p.look.hair.style}`] = (before[`${p.sex}:${p.look.hair.style}`] ?? 0) + 1;
      const g = createGame({ scenario: 'barracks', seed: 48213 }), s = g.load(json);
      const after = {};
      for (const p of Object.values(s.people)) if (p.look?.hair) after[`${p.sex}:${p.look.hair.style}`] = (after[`${p.sex}:${p.look.hair.style}`] ?? 0) + 1;
      console.log(`      a v0.0.4 save: ${Object.entries(before).map(([k, v]) => `${k} ${v}`).join(', ')} → ${Object.entries(after).map(([k, v]) => `${k} ${v}`).join(', ')}; flag mig:people-cuts ${!!s.flags['mig:people-cuts']}`);
      for (const p of Object.values(s.people)) if (p.look?.hair) assert(CUTS[p.look.hair.style]?.sex === (p.sex ?? 'm') && !p.look.hair.thin, `${p.id}: ${JSON.stringify(p.look.hair)}`);
      assert(s.flags['mig:people-cuts'] === true, 'the flag');
      assert((after['m:lowReg'] ?? 0) === (before['m:crew'] ?? 0) && (after['m:shaved'] ?? 0) === (before['m:bald'] ?? 0) && (after['m:medReg'] ?? 0) === (before['m:short'] ?? 0), 'the map one to one');
      const fresh = createGame({ scenario: 'barracks', seed: 48213 }), j0 = fresh.save(), n = upgradeCuts(fresh.state);
      assert(n === 0 && fresh.save() === j0 && !fresh.state.flags['mig:people-cuts'], `a new save moved: ${n}`);
      g.step(600, { mx: 1 });
      assert(!g.errors.length, g.errors.join('; '));
      assert(LEGACY_CUTS.m.crew === 'lowReg' && LEGACY_CUTS.m.bald === 'shaved' && LEGACY_CUTS.m.short === 'medReg', 'the legacy map');
    },
  },
  {
    name: 'a shaved head fresh from the clippers reads "Freshly buzzed.", never "Fresh from the barber." (the fixer\'s, 0.0.6: after buzzing your own head at a sink); the barber\'s cuts keep theirs',
    fn() {
      const shaved = hairAt('shaved', 1), lowReg = hairAt('lowReg', 1), grown = hairAt('shaved', 0.5 * CUTS.shaved.dueSols * SOL_H);
      console.log(`      shaved 1 h on: "${shaved.band.words}"; low regulation 1 h on: "${lowReg.band.words}"; shaved ${fmt(0.5 * CUTS.shaved.dueSols, 1)} sols on: "${grown.band.words}"`);
      assert(shaved.band.words === 'Freshly buzzed.' && lowReg.band.words === 'Fresh from the barber.' && grown.band.words === 'Growing out.', JSON.stringify({ shaved: shaved.band, lowReg: lowReg.band }));
    },
  },
];
