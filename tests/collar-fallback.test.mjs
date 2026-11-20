// OLYMPUS tests: the fall back, F153's fall back half (the build sheet v0.0.27 §1 D, item 14, §0 item 9, §6 D, §8; COMBAT §14.6; FT§5.3).
//
// At FALLBACK_DOWN 2 of the fire team's four down (team.js fireTeamOf; down by the body's own, a knock alone never counts: shoothouse.js
// marineDown), the senior marine standing calls "Fall back to the lock!"; the scene ends 'fellBack' when you stand in the lock, or
// FALLBACK_WAIT_MS 60 s from the call, behind FALLBACK_SPLASH_MS 30 s (one outcome skip: the inner hatch shut behind you, the casualties
// carried, nothing judged meanwhile), and never 'clear' while it is called. These cases hold the call on two marines put down by real
// torso rounds (wounds.js applyHit) at the cabin 2 setup, the leader's knock alone calling nothing; and the 'fallback' setup played by the
// keys (the walk to the lock: ended in it), and by the fuzz that never walks (ended at its wait), each with its one splash.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { applyHit } from '../src/sim/body/wounds.js';
import { fireTeamOf } from '../src/sim/combat/team.js';
import { FALLBACK_DOWN, FALLBACK_WAIT_MS, FALLBACK_SPLASH_MS, PASSAGE_SEND_MAX_MS } from '../src/sim/scenarios/shoothouse.js';
import { SEQ_COLLAR } from '../src/data/courses.js';
import { collarBot, collarFuzzBot } from './bots/collar.mjs';

const factsOf = (g, type) => (g.bus.events ?? []).filter(e => (Array.isArray(e) ? e[0] : e.type) === type).map(e => (Array.isArray(e) ? e[1] : e.payload ?? e));

export default [
  {
    name: 'both holders down in the passage with its man up: no send at 45 s or after (the pair is never sent into an uncovered passage), the man yours (slot 1, not Four\'s), the leader\'s words from the senior marine standing but you and never from a man down, and you down for good the end\'s own line, "Three is down." (the review of D: the recruit on 48213 sent at 45.05 s by the leader lying down with a chest wound, the man Four\'s, who never fired, and "We are out." over you in the passage)',
    fn() {
      const g = createGame({ scenario: 'test-collar', seed: 48213, tier: 'recruit', holdouts: 'pirates', setup: 'go' }), s = g.state, R = s.armoury.range, H = R.house, B = H.boarding;
      const bot = collarBot({ mode: 'keys' }), holders = H.holders.men.map(m => m.pid), man = R.turners.find(T => T.stand === '1a');
      const stance = (pid) => { const a = s.actors.list.find(x => x.who === pid); return a ? a.stance ?? 'stand' : null; };
      assert(man?.live && holders.length === 2, 'the barricade man and two holders on the pirates\' 48213');
      // (both holders down in the lock's hatch by torso rounds, their knocks long (past the 45 s latest): no fall back meanwhile)
      for (const pid of holders) applyHit(s, g.bus, { onId: pid, part: 'torso', w: 2, margin: 0, shotId: `t:${pid}`, atMs: s.clock.ms });
      g.step(1, bot);
      for (const pid of holders) (s.people[pid].body.knock ??= {}).untilMs = s.clock.ms + PASSAGE_SEND_MAX_MS + 30_000;
      const said = [];
      const run = (ms) => { const end = s.clock.ms + ms; while (s.clock.ms < end && !R.end) { g.step(1, bot); for (const f of g.facts('say')) said.push({ ...f, st: stance(f.who), t: (s.clock.ms - H.goAtMs) / 1000 }); g.clearFacts?.(); } };
      run(PASSAGE_SEND_MAX_MS + 3_000);
      const sentLate = B.send, slot = man.slot, upNow = !['down', 'hands', 'out'].includes(man.live.st);
      const fromDown = said.filter(f => f.st === 'down' && !/hit/i.test(f.text));
      // (you down for good: the end's line, from a marine standing)
      const me = s.player.id;
      applyHit(s, g.bus, { onId: me, part: 'head', w: 3, margin: 0, shotId: 't:me', atMs: s.clock.ms });
      run(10_000);
      const endLine = said.find(f => SEQ_COLLAR.find(c => c.id === 'end').sayEnd.down.includes(f.text)) ?? null, other = said.find(f => SEQ_COLLAR.find(c => c.id === 'end').sayEnd.other.includes(f.text)) ?? null;
      console.log(`      the man ${man.stand} ${upNow ? 'up' : man.live.st} at ${((PASSAGE_SEND_MAX_MS + 3_000) / 1000)} s, slot ${slot}; the send ${sentLate ? JSON.stringify(sentLate) : 'none'}; lines from a man down (not his own "hit") ${fromDown.length}${fromDown.length ? ` ("${fromDown[0].text}" by ${fromDown[0].who})` : ''}; the end ${B.end?.why ?? 'none'}, its line ${endLine ? `"${endLine.text}" by ${endLine.who} (${endLine.st})` : other ? `"${other.text}" (the other end's)` : 'none'}`);
      assert(!upNow || (!sentLate && slot === 1), JSON.stringify({ send: sentLate, slot, st: man.live.st }));
      assert(!fromDown.length, JSON.stringify(fromDown.slice(0, 3)));
      assert(B.end?.why === 'down' && endLine && endLine.st !== 'down' && endLine.who !== me && !other, JSON.stringify({ end: B.end, endLine, other }));
    },
  },
  {
    name: 'F153: two of the four down by real torso rounds call "Fall back to the lock!" from the senior marine standing, a knock alone none; never "Deck secure." while it stands; the end \'fellBack\' within its wait and one splash',
    fn() {
      const g = createGame({ scenario: 'test-collar', seed: 48213, tier: 'sgt', holdouts: 'smugglers', setup: 'cabin2' }), s = g.state, H = s.armoury.range.house, B = H.boarding;
      const team = fireTeamOf(s), others = team.filter(m => m.pid !== s.player.id && m.n !== 4);
      console.log(`      the fire team: ${team.map(m => `#${m.n} ${m.role}${m.holder ? ' (holder)' : ''}`).join(', ')}`);
      assert(team.length === 4 && others.length >= 2, 'the fire team of four (C\'s fireTeamOf, the holders filled)');
      const bot = collarBot({ mode: 'T' });
      g.step(20, bot);
      // (a knock alone: the leader's knock with no wound that keeps him down calls nothing)
      const n0 = others[0].pid, rec = (s.people[n0].body ??= {});
      rec.knock = { untilMs: s.clock.ms + 5000 };
      g.step(20, bot);
      const afterKnock = !!B.fallback;
      delete rec.knock;
      // (each a torso round; his knock then run out (the test's step: a man still down after it is a casualty, shoothouse.js marineDown))
      const hurt = others.slice(0, FALLBACK_DOWN);
      for (const m of hurt) applyHit(s, g.bus, { onId: m.pid, part: 'torso', w: 2, margin: 0, shotId: `t:${m.pid}`, atMs: s.clock.ms });
      g.step(1, bot);
      for (const m of hurt) { const b = s.people[m.pid].body; if (b.knock) b.knock.untilMs = s.clock.ms; }
      let calledAt = null, ended = null;
      for (let i = 0; i < 4000 && !s.armoury.range.end; i++) {
        g.step(1, bot);
        if (B.fallback && calledAt === null) calledAt = s.clock.ms;
        if (H.end && ended === null) ended = { why: H.end.why, ms: H.end.atMs };
      }
      const splash = factsOf(g, 'activity').filter(f => f.phase === 'start' && f.mode === 'outcome' && f.toMs - f.fromMs === FALLBACK_SPLASH_MS);
      const said = factsOf(g, 'say').filter(f => /Fall back|Back to the lock/.test(f.text ?? ''));
      console.log(`      after the knock alone: called ${afterKnock}; called at ${calledAt !== null ? 'the wounds\' tick' : 'never'} by ${said.map(f => f.who === H.chiefPid ? 'the leader' : f.who).join(', ') || 'nobody'} ("${said[0]?.text ?? ''}"); ended ${JSON.stringify(ended)}, ${ended && calledAt !== null ? (ended.ms - calledAt) / 1000 : '-'} s after; splashes of ${FALLBACK_SPLASH_MS / 1000} s ${splash.length}; "Deck secure." ${factsOf(g, 'say').some(f => /Deck (two )?secure/.test(f.text ?? ''))}`);
      assert(!afterKnock, 'a knock alone called the fall back');
      assert(calledAt !== null && said.length >= 1 && B.fallback.down.length >= FALLBACK_DOWN, JSON.stringify(B.fallback));
      assert(ended?.why === 'fellBack' && ended.ms - calledAt <= FALLBACK_WAIT_MS && splash.length === 1, JSON.stringify({ ended, splash: splash.length }));
      assert(!factsOf(g, 'say').some(f => /Deck (two )?secure/.test(f.text ?? '')), 'secured while falling back');
    },
  },
  {
    name: 'F153: the \'fallback\' setup ends \'fellBack\' in the lock by the keys\' walk back, at its 60 s wait by the fuzz that stands, each behind one 30 s splash',
    fn() {
      const rows = [], bad = [];
      for (const [kind, mk] of [['keys', () => collarBot({ mode: 'keys' })], ['fuzz', () => collarFuzzBot({ seed: 2 })]]) {
        const g = createGame({ scenario: 'test-collar', seed: 48213, tier: 'private', holdouts: 'pirates', setup: 'fallback' }), s = g.state, B = s.armoury.range.house.boarding, bot = mk();
        const me = s.actors.list.find(a => a.who === s.player.id);
        (me.bot ??= {}).collar = { fbWalk: kind !== 'fuzz' };
        for (let i = 0; i < 4000 && !s.armoury.range.end; i++) g.step(1, bot);
        const F = B.fallback, splash = factsOf(g, 'activity').filter(f => f.phase === 'start' && f.mode === 'outcome');
        rows.push(`${kind}: ended ${B.end?.why} ${(F.inAtMs - F.atMs) / 1000} s after the call, in the lock ${F.inLock.length ? 'you' : 'nobody'}; splashes ${splash.map(f => `${(f.toMs - f.fromMs) / 1000} s`).join(', ')}`);
        if (B.end?.why !== 'fellBack' || splash.length !== 1 || splash[0].toMs - splash[0].fromMs !== FALLBACK_SPLASH_MS) bad.push(kind);
        if (kind === 'keys' && !(F.inAtMs - F.atMs < FALLBACK_WAIT_MS && F.inLock.includes(s.player.id))) bad.push('keys: not in the lock');
        if (kind === 'fuzz' && F.inAtMs - F.atMs !== FALLBACK_WAIT_MS) bad.push('fuzz: not at its wait');
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, bad.join('; '));
    },
  },
];
