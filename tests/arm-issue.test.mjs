// OLYMPUS tests: the rifle's books, the records and the rounds (the build sheet v0.0.28 §6 A, items 2, 4, 6, 9; WEAPONS §10.2, §10.4, §10.5, §10.7; F172's record half, F173): the serial, the record out and in, the sensitive-item check, the issue by count and the declaration's one reader.
//
// src/sim/arms/armoury.js on scripted states (tests/arms-world.mjs: the private on the 25 m bay with the range's issue, the coach
// standing in for the armourer and the ammunition NCO): the rifle's serial and its words, its record booked, signed out and in (the
// log at most GUN_LOG_MAX lines), serialCheck's mismatches; the session's issue line filled at the count (never a second line, handed
// only when short) and reconcile on six cases (all square; the short count caught by the count; the short count found at the
// declaration; a round held; brass short; a magazine lost and reported), each balanced (issued = fired + back + held + losses + short)
// and ok only when nothing is short, nothing held and every case back. The scene's words and faults at each are B's (arm-window,
// armoury-flow); here the numbers they read.
import { assert } from './helpers.mjs';
import { armsWorld } from './arms-world.mjs';
import { books } from './flawless-books.mjs';
import { serialOf, serialWords, rackOf, bookGun, signOut, signIn, serialCheck, issueRounds, reconcile, reportLost, GUN_LOG_MAX } from '../src/sim/arms/armoury.js';
import { newGun } from '../src/sim/arms/firearms.js';
import { move } from '../src/sim/arms/kit.js';

// (the private's session: the issue line startRange pushes (n 0), his magazines emptied; fired, the rounds in a magazine, back, brass)
function session({ handed = 20, fired = 18, inMag = 0, back = 20 - 18, brassBack = fired, lostMag = 0, dropMag = 0 } = {}) {
  const w = armsWorld(), s = w.state;
  for (const id of w.magIds) s.items[id].n = 0;
  s.armoury.ammoIssues.push({ id: 'ai1', atMs: s.clock.ms, area: 'melas.ground', toId: w.pid, cal: '6.5x40r', load: 'ball', n: 0, fired: 0 });
  issueRounds(s, { issueId: 'ai1', n: 20, handed });
  const line = s.armoury.ammoIssues[0];
  line.fired = fired; line.back = back; line.brassBack = brassBack;
  s.items[w.magIds[0]].n = inMag;
  if (lostMag || dropMag) {
    const id = w.magIds[2]; s.items[id].n = lostMag || dropMag;
    move(s, id, { ground: { area: 'melas.ground', x: w.actor.x + 30, z: w.actor.z } });
    if (lostMag) reportLost(s, w.bus, id, { by: w.pid, where: 'the 25 m line, lane 4' });
  }
  return { w, s, r: reconcile(s, w.pid), lines: s.armoury.ammoIssues.length, line };
}

export default [
  {
    name: 'F172 (the record\'s half): a rifle\'s serial is six digits by hash of the seed and its id, read back in threes; its record booked at the rack, signed out to the private by the armourer and back in (its rounds copied, the log at most 20 lines); the sensitive-item check names the rifle that is not his',
    fn() {
      const w = armsWorld(), s = w.state, other = newGun(s, { model: 'r7' });
      const serial = serialOf(s, w.gunId), serial2 = serialOf(s, other), again = serialOf(s, w.gunId);
      bookGun(s, w.gunId, { assignedId: w.pid }); bookGun(s, other, { assignedId: 'p2' });
      const rec = s.armoury.guns[w.gunId], booked = JSON.stringify(rec);
      signOut(s, w.gunId, w.pid, w.coachId); const out = JSON.parse(JSON.stringify(rec));
      s.items[w.gunId].rounds = 18; signIn(s, w.gunId, w.coachId); const back = JSON.parse(JSON.stringify(rec));
      const ok = serialCheck(s, [{ pid: w.pid, gunId: w.gunId }]), slip = serialCheck(s, [{ pid: w.pid, gunId: other }]);
      for (let i = 0; i < 30; i++) { signOut(s, w.gunId, w.pid, w.coachId); signIn(s, w.gunId, w.coachId); }
      console.log(`      the serial ${serial} ("${serialWords(serial)}"), another rifle's ${serial2}, the same rifle again ${again}; its rack ${rackOf(w.gunId)}`);
      console.log(`      booked ${booked}; out ${JSON.stringify({ loc: out.loc, out: out.out })}; in ${JSON.stringify({ loc: back.loc, out: back.out, rounds: back.rounds, log: back.log.map(l => l.what).join(',') })}; after 30 more, the log ${rec.log.length} lines`);
      console.log(`      the check, his own rifle: ${JSON.stringify(ok)}; the slip's: ${JSON.stringify(slip)}`);
      assert(/^[1-9]\d{5}$/.test(serial) && serial === again && serial !== serial2 && serialWords('447193') === 'four four seven, one nine three', JSON.stringify({ serial, serial2 }));
      assert(out.loc === 'out' && out.out.toId === w.pid && out.out.byId === w.coachId && back.loc === 'rack' && back.out === null && back.rounds === 18 && back.log.length === 2 && rec.log.length === GUN_LOG_MAX, JSON.stringify({ out, back }));
      assert(ok.length === 0 && slip.length === 1 && slip[0].assignedGunId === w.gunId && slip[0].card === serial && slip[0].held === serial2, JSON.stringify(slip));
    },
  },
  {
    name: 'F173: the issue fills the session\'s own line (never a second; handed written only when short) and reconcile balances the books on six cases: square; the short count caught; the short count found; a round held; brass short; a magazine lost and reported (and one dropped and not)',
    fn() {
      const cases = {
        square: session(),
        'short count caught (counted, the twentieth added)': session({ handed: 20 }),
        'short count found (signed uncounted: 19 against 20)': session({ handed: 19, back: 1 }),
        'a round held in a magazine': session({ back: 1, inMag: 1 }),
        'brass short (15 of 18 back)': session({ brassBack: 15 }),
        'a magazine of 2 lost and reported': session({ back: 0, lostMag: 2 }),
        'a magazine of 2 dropped, not reported': session({ back: 0, dropMag: 2 }),
      };
      for (const [k, c] of Object.entries(cases)) { const { issued, handed, fired, back, held, losses, brassFired, brassBack, short, ok } = c.r; console.log(`      ${k}: ${JSON.stringify({ issued, handed, fired, back, held, losses, brassFired, brassBack, short, ok })}, ${c.lines} line${c.lines === 1 ? '' : 's'}, handed on the line ${c.line.handed ?? 'absent'}`); }
      for (const c of Object.values(cases)) { const b = books(c.r); assert(b.balanced && b.okRight && c.lines === 1 && c.line.n === 20 && Number.isFinite(c.line.signedAtMs), JSON.stringify({ r: c.r, b, lines: c.lines })); }
      const v = Object.fromEntries(Object.entries(cases).map(([k, c]) => [k, c.r]));
      assert(v.square.ok && v.square.short === 0 && cases.square.line.handed === undefined, JSON.stringify(v.square));
      assert(v['short count caught (counted, the twentieth added)'].ok, 'caught');
      assert(!v['short count found (signed uncounted: 19 against 20)'].ok && v['short count found (signed uncounted: 19 against 20)'].short === 1 && v['short count found (signed uncounted: 19 against 20)'].handed === 19, 'found');
      assert(!v['a round held in a magazine'].ok && v['a round held in a magazine'].held === 1 && v['a round held in a magazine'].short === 0, 'held');
      assert(!v['brass short (15 of 18 back)'].ok && v['brass short (15 of 18 back)'].brassBack === 15 && v['brass short (15 of 18 back)'].short === 0, 'brass');
      assert(v['a magazine of 2 lost and reported'].ok && v['a magazine of 2 lost and reported'].losses === 2, 'lost');
      assert(!v['a magazine of 2 dropped, not reported'].ok && v['a magazine of 2 dropped, not reported'].short === 2, 'dropped');
    },
  },
];
