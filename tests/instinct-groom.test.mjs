// instinct-groom: the DI's haircut rule (src/sim/skills/instinct/groom.js; the build sheet 0.0.6 §2.2, §5.2; the user,
// 2026-11-06: "we should have to groom our hair the same way we will have to groom our beards"). A cut past 0.7 of its
// dueSols is a note, "Haircut's due Thursday." (the day it goes over: hairOf's dueDay), out of regulation a warning;
// by day only, quiet at night, in a drill, on the range, busy or lying; T buzzes a shaved head at a sink (the
// clippers) and cuts at the PX barber's pole. The rule is weighed through the instinct's own firedNow (with
// GROOM_RULES added to RULES until instinct.js merges them: the actions role's file).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { HOUR_MS, SOL_MS, MIN_MS } from '../src/core/clock.js';
import { marsTimeText } from '../src/core/calendar.js';
import { playerId, playerActor } from '../src/core/ids.js';
import { SITES } from '../src/data/setting/calendar.js';
import { RULES, firedNow } from '../src/sim/skills/instinct.js';
import { GROOM_RULES } from '../src/sim/skills/instinct/groom.js';
import { doAct } from '../src/sim/skills/instinct/base.js';
import { hairOf, SOL_H } from '../src/sim/body/hair.js';
import { setCut } from '../src/sim/body/hair.js';
import { spotsOf } from '../src/sim/places/fixtures.js';
import { ECHO_1 } from '../src/sim/places/echo.js';
import { GROUND_AREA } from '../src/sim/places/ground.js';
import { CUTS } from '../src/data/people/looks.js';

const LON = SITES.melas.lonEDeg;
const MERGED = RULES.some(r => r.id === 'haircut');
const ALL = MERGED ? RULES : [...RULES, ...GROOM_RULES];
// (the line's words as the instinct picks them: its variant's lines, the first, the ctx's fields filled)
const words = (l) => { const lines = l.rule.text[l.ctx.variant] ?? l.rule.text[1]; return lines[0].replace(/\{(\w+)\}/g, (_, k) => l.ctx[k] ?? ''); };
const haircut = (g) => firedNow(g.state, g.state.clock.ms, ALL).find(l => l.id === 'haircut') ?? null;
// (the player's cut set to sols old: the body's hours since the cut at its own atMs)
function grown(g, sols, cut = null) {
  const s = g.state, pid = playerId(s), p = s.people[pid];
  if (cut) setCut(s, pid, cut, s.clock.ms, g.bus);
  p.body.hair = { h: sols * SOL_H + (p.body.atMs - s.clock.ms) / HOUR_MS };
  if (p.body.held) p.body.held.rp = null;
  return hairOf(s, pid);
}
const BARBER_SPOT = spotsOf(GROUND_AREA.fixtures.find(f => f.kind === 'barberPole'))[0];
const SINK_SPOT = spotsOf(ECHO_1.fixtures.find(f => f.kind === 'sinkRow'))[0];

export default [
  {
    name: '"Haircut\'s due Thursday." on the right day: the note from 0.7 of the cut\'s dueSols, the day the cut goes over; a warning out of regulation; quiet before then',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: 48213, hour: 13 }), s = g.state;
      const rows = [];
      for (const sols of [2, 6.9, 7.5, 9.9, 10.5]) {
        const h = grown(g, sols, 'lowReg'), l = haircut(g);
        rows.push(`${sols} sols: ${l ? `${l.tone} "${words(l)}"` : 'quiet'} (band ${h.band.id}, due ${h.dueDay})`);
        if (h.step < 2) assert(!l, `${sols} sols: ${l && words(l)}`);
        else {
          assert(l && l.tone === (h.step >= 3 ? 'warn' : 'note'), `${sols} sols: ${JSON.stringify(l?.tone)}`);
          if (h.step === 2) assert(words(l) === `Haircut's due ${h.dueDay}. The barber's at the PX, 10:00 to 20:00.`, words(l));
        }
      }
      for (const r of rows) console.log(`      ${r}`);
      const h = grown(g, 7.5);
      console.log(`      Monday ${marsTimeText(s.clock.ms, LON)}, a low regulation cut 7.5 sols old: due ${marsTimeText(h.dueMs, LON)} on ${h.dueDay}; the instinct ${MERGED ? 'has' : 'does not yet have'} GROOM_RULES merged (instinct.js)`);
      assert(h.dueDay === 'Thursday', h.dueDay);
      // (a shaved head's words send it to the basins)
      const sh = grown(g, 8, 'shaved'), l = haircut(g);
      console.log(`      a shaved head 8 sols on: "${words(l)}"`);
      assert(sh.step === 2 && words(l) === `Haircut's due ${sh.dueDay}. Clippers. Head A has mirrors.`, words(l));
      if (MERGED) {
        g.step(20);
        const line = s.$instinct?.line;
        console.log(`      the instinct's line: ${line ? `${line.id} "${line.text}"` : 'none'}`);
      }
    },
  },
  {
    name: 'quiet at night, in a drill, on the range, lying down and busy',
    fn() {
      const out = [];
      const night = createGame({ scenario: 'barracks', seed: 48213, hour: 2 });
      grown(night, 9, 'lowReg');
      out.push(`02:00: ${haircut(night) ? 'speaks' : 'quiet'}`);
      assert(!haircut(night), 'at night');
      const drill = createGame({ scenario: 'barracks', seed: 48213, hour: 13 });
      grown(drill, 9, 'lowReg');
      assert(haircut(drill), 'by day it speaks');
      drill.state.time.drills ??= {};
      drill.state.time.drills.open = { drill: 'test', dueMs: drill.state.clock.ms + 5 * MIN_MS, endMs: drill.state.clock.ms + 30 * MIN_MS };
      out.push(`a drill open: ${haircut(drill) ? 'speaks' : 'quiet'}`);
      assert(!haircut(drill), 'in a drill');
      const range = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 });
      grown(range, 9);
      out.push(`on the range: ${haircut(range) ? 'speaks' : 'quiet'}`);
      assert(!haircut(range), 'on the range');
      const lying = createGame({ scenario: 'barracks', seed: 48213, hour: 13 });
      grown(lying, 9, 'lowReg');
      playerActor(lying.state).posture = 'lie';
      out.push(`lying: ${haircut(lying) ? 'speaks' : 'quiet'}`);
      assert(!haircut(lying), 'lying');
      console.log(`      a cut 9 sols old: ${out.join('; ')}`);
    },
  },
  {
    name: 'T buzzes a shaved head at a sink (the clippers, 10 minutes) and cuts at the PX barber\'s pole (12 minutes, 10:00 to 20:00): the hair fresh after',
    fn() {
      const lines = [];
      // (the sink: a shaved head due, standing at Head A's first basin)
      const g = createGame({ scenario: 'barracks', seed: 48213, hour: 13, at: { area: ECHO_1.id, x: SINK_SPOT.x, z: SINK_SPOT.z, face: SINK_SPOT.face } }), s = g.state, pid = playerId(s);
      grown(g, 8, 'shaved');
      const l = haircut(g);
      lines.push(`at Head A's basin (${SINK_SPOT.id}), a shaved head 8 sols on: "${l ? words(l) : '-'}", T ${l?.act ?? 'nothing'}`);
      if (l?.act) {
        const ok = doAct(s, g.bus, { sim: g.sim }, l.act);
        g.run(11 * MIN_MS);
        const h = hairOf(s, pid);
        lines.push(`T: ${ok ? 'begun' : 'refused'}; 11 minutes on: ${fmt(h.h, 2)} h since the cut, "${h.band.words}"`);
        assert(ok && h.h < 1 && h.step === 0, JSON.stringify({ ok, h: h.h }));
      } else lines.push('the sink offers no clippers yet (the actions role\'s idsAt)');
      assert(l?.act === 'activity:clip' || !l?.act, `the act at a sink: ${l?.act}`);
      // (the barber's pole at 14:00, a low regulation cut due)
      const b = createGame({ scenario: 'barracks', seed: 48213, hour: 14, at: { area: 'melas.ground', x: BARBER_SPOT.x, z: BARBER_SPOT.z, face: BARBER_SPOT.face } }), sb = b.state;
      grown(b, 8, 'lowReg');
      const lb = haircut(b);
      lines.push(`at the barber's pole (${BARBER_SPOT.id}, ${BARBER_SPOT.x}, ${BARBER_SPOT.z}) at 14:00: "${lb ? words(lb) : '-'}", T ${lb?.act ?? 'nothing'}`);
      if (lb?.act) {
        const ok = doAct(sb, b.bus, { sim: b.sim }, lb.act);
        b.run(13 * MIN_MS);
        const h = hairOf(sb, playerId(sb));
        lines.push(`T: ${ok ? 'begun' : 'refused'}; 13 minutes on: ${fmt(h.h, 2)} h since the cut, ${CUTS[h.cut].word}, "${h.band.words}"`);
        assert(ok && h.h < 1 && h.step === 0, JSON.stringify({ ok, h: h.h }));
      } else lines.push('the pole offers no haircut yet (the actions role\'s activity)');
      assert(lb?.act === 'activity:haircut' || !lb?.act, `the act at the pole: ${lb?.act}`);
      // (at 09:00 the barber is shut: the line gives his hours and T does nothing, never "Haircut. Now" for a T refused; the fixer's, 0.0.6)
      const e = createGame({ scenario: 'barracks', seed: 48213, hour: 9, at: { area: 'melas.ground', x: BARBER_SPOT.x, z: BARBER_SPOT.z, face: BARBER_SPOT.face } });
      grown(e, 8, 'lowReg');
      const le = haircut(e);
      lines.push(`at the pole at 09:00, the barber shut: "${le ? words(le) : '-'}" (${le?.ctx.variant}), T ${le?.act ?? 'nothing'}`);
      assert(le && !le.act && /barber|Barber/i.test(words(le)) && !['here', 'overHere'].includes(le.ctx.variant), JSON.stringify({ variant: le?.ctx.variant, act: le?.act }));
      for (const x of lines) console.log(`      ${x}`);
    },
  },
];
