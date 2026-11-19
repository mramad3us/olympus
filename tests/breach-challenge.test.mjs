// OLYMPUS tests: breach-challenge, "Bang, then go"'s gauge F144, the challenge ends a freeze (its build sheet item 7, §6 A, §8; COMBAT §7.11; defenders.md DF§5): a man frozen or in cover, challenged ("Show me your hands!", contact.js CHALLENGE_MS 1.2 s) by you within opfor.js KNEEL_M 6 m whom he sees or hears, gives on the first tick he lives at its end and kneels once his rifle is down; a fighting man never; out of reach, or unseen and unheard (deaf after the bang, his back to you), never; no round from him after (F39). Challenge is offered on a man seen cowering, and T's line on "Bang, then go" is "He's done. Challenge him." with the challenge its act.
//
// On tests/opfor-world.mjs rpScript: the man is put in his freeze or his cover by hand, as opfor.js choiceTick leaves him (st, the choice,
// the kneel, the rifle low), and the challenge is pressed as the page presses it (the bracket on him, then the row). Fails without its fix:
// challengeTick (he stays frozen), contactRows' cowering (no Challenge row on him), cqb.js's cower variant (no line, no act).
import { assert, fmt } from './helpers.mjs';
import { rpScript } from './opfor-world.mjs';
import { stepAct } from './bots/lib.mjs';
import { enterStop, stepsOf } from '../src/sim/arms/shooting.js';
import { contactRows, CHALLENGE_MS } from '../src/sim/combat/contact.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { KNEEL_M, GIVE_DROP_MS, ruleOut } from '../src/sim/scenarios/opfor.js';
import { noteContact } from '../src/sim/people/mind.js';
import { DEAF_VOICE_M, bandN, feltOf } from '../src/sim/combat/supp.js';
import { AWARE_M, AWARE_PER } from '../src/sim/people/perception.js';
import { TICK_MS } from '../src/core/clock.js';

// (a man put where choiceTick leaves him: frozen (kneeling, the rifle low) or at his hide in cover)
function hold(g, stand, st) {
  const s = g.s, T = g.man(stand), a = g.actor(stand), L = T.live;
  // (his band as it is, so the next tick rolls nothing of its own: the freeze holds unless the chaos moves him)
  L.band = bandN(feltOf(s, L.who)); L.st = st; L.fromMs = s.clock.ms; L.choice = { what: st, band: L.band, atMs: s.clock.ms, grade: 'bad', dc: 12 };
  L.eng = null; L.eyes = null; L.aiming = null; L.aimAt = null;
  a.stance = 'kneel';
  s.people[L.who].kit.carry.posture = 'lowReady'; s.people[L.who].kit.carry.finger = 'off';
  return T;
}
// (the other man ruled out by the instructor, so nobody fires on you while the case runs (opfor.js ruleOut 'setup'))
const quiet = (g, stand = '1a') => ruleOut(g.s, g.g.bus, g.man(stand), 'setup');
// (his hands not seen at the last pause (a failed look leaves 'unseen'): Challenge offered as built, whatever he is doing)
const handsUnseen = (g, T) => { const now = g.s.clock.ms; noteContact(g.s, { last: { id: 900, ids: [T.key], seenMs: now, atMs: now, ms: 0, expect: null, n: 1, grade: null, parts: [], pick: T.key, ident: {}, armour: {}, words: '' } }); };
// (the challenge pressed on him: the bracket, then the row; its end and the next lived tick. Returns { endMs, gaveAtMs, st })
function challenge(g, T, { moveAt = null } = {}) {
  const s = g.s;
  if (s.stop?.mode !== 'stop') enterStop(s, g.g.bus, { via: 'shoot' });
  g.g.step(1, { act: [stepAct(`pick=${T.key}`)] });
  const offered = contactRows(s).some(r => r.id === 'contact:challenge' && !r.off);
  g.g.step(1, { act: [stepAct('contact:challenge', 'normal', T.key)] });
  const endMs = s.stop?.doing?.untilMs ?? null;
  let n = 0;
  while (s.stop?.phase === 'act' && n++ < 100) { if (moveAt && s.clock.ms >= endMs - TICK_MS) { moveAt(); moveAt = null; } g.g.step(1, {}); }
  g.g.step(1, { act: [stepAct('leave')] });
  return { offered, endMs, gaveAtMs: T.live.gaveAtMs ?? null, st: T.live.st };
}

export default [
  {
    name: 'breach-challenge: a man frozen, and a man in cover, challenged from within KNEEL_M whom he sees give on the challenge\'s end tick, drop the rifle GIVE_DROP_MS after and kneel; no round from either after; Challenge is offered on each (the frozen read cowering)',
    fn() {
      const rows = [];
      for (const st of ['freeze', 'cover']) {
        const g = rpScript({ seed: 48213 }), s = g.s;
        g.open(); g.run(1500);
        g.enter('me', [29.5, 10.0], [31.0, 8.5]); quiet(g);
        const T = hold(g, '1b', st), fired = T.live.fired;
        // (a man in cover reads 'aiming' (his rifle on the door): Challenge is his where his hands were not seen, as built)
        if (st === 'cover') handsUnseen(g, T);
        const r = challenge(g, T);
        g.run(2500);
        const a = g.actor('1b'), dM = Math.hypot(a.x - g.g.me().x, a.z - g.g.me().z);
        rows.push(`${st}${st === 'cover' ? ' (his hands unseen)' : ' (read cowering)'}: offered ${r.offered}, its end ${r.endMs % 100000} ms, gave at ${r.gaveAtMs === null ? 'never' : r.gaveAtMs % 100000}, then ${T.live.st} (knelt ${!!T.live.knelt}, rifle ${T.live.rifleId ? 'on the floor' : 'in his hands'}), ${fmt(dM, 2)} m, rounds after ${T.live.fired - fired}`);
        assert(r.offered && r.gaveAtMs === r.endMs && T.live.st === 'hands' && T.live.knelt && T.live.rifleId && T.live.fired === fired, JSON.stringify({ st, r, knelt: T.live.knelt, fired: T.live.fired - fired }));
      }
      console.log(`      ${rows.join('; ')}; CHALLENGE_MS ${CHALLENGE_MS}, GIVE_DROP_MS ${GIVE_DROP_MS}, KNEEL_M ${KNEEL_M}`);
    },
  },
  {
    name: 'breach-challenge: never a fighting man (laid on the door, aiming); never out of reach (you more than KNEEL_M from him at the challenge\'s end); never unseen and unheard (deaf after the bang, his back to you past supp.js DEAF_VOICE_M); heard but unseen, he gives',
    fn() {
      const rows = [], off = [];
      // (fighting: laid on the door, the challenge pressed on him; Challenge on a rifle he holds up is not offered, so the row is forced as a page would never)
      {
        const g = rpScript({ seed: 48213, held: 'held' }), T = g.man('1a');
        g.enter('me', [28.0, 10.0], [27.0, 8.5]); quiet(g, '1b');
        const r = challenge(g, T);
        rows.push(`fighting (${T.live.st}): offered ${r.offered}, ${T.live.st}`);
        if (r.offered || T.live.st === 'hands') off.push({ case: 'fighting', r });
      }
      // (out of reach: frozen, the challenge begun from 2 m, you put 7 m off before its end)
      {
        const g = rpScript({ seed: 48213 });
        g.open(); g.run(1500); g.enter('me', [29.5, 10.0], [31.0, 8.5]); quiet(g);
        const T = hold(g, '1b', 'freeze');
        const r = challenge(g, T, { moveAt: () => g.enter('me', [25.0, 13.0], [31.0, 8.5]) });
        g.run(500);
        rows.push(`out of reach (${fmt(Math.hypot(g.actor('1b').x - g.g.me().x, g.actor('1b').z - g.g.me().z), 1)} m at its end, KNEEL_M ${KNEEL_M}): offered ${r.offered}, ${T.live.st}`);
        if (T.live.st !== 'freeze') off.push({ case: 'reach', st: T.live.st });
      }
      // (unseen and unheard: deaf after the bang, his face to the far wall, you behind him past his all-round awareness (perception.js
      // AWARE_M + AWARE_PER × 5, and its 1.5 m soft edge) and past DEAF_VOICE_M, inside KNEEL_M; then the same with his ears)
      for (const deaf of [true, false]) {
        const g = rpScript({ seed: 48213 }), s = g.s;
        g.open(); g.run(1500); quiet(g);
        if (deaf) { g.bang(); g.run(5500); }
        g.enter('me', [26.8, 11.7], [31.0, 8.5]);
        const T = hold(g, '1b', 'freeze'), a = g.actor('1b');
        a.headRad = -Math.PI / 2; a.face = 'up';
        const r = challenge(g, T);
        const deafNow = (a.combat?.deafUntilMs ?? 0) > s.clock.ms;
        rows.push(`${deaf ? 'deaf' : 'hearing'}, his back to you at ${fmt(Math.hypot(a.x - g.g.me().x, a.z - g.g.me().z), 2)} m (aware ${fmt(AWARE_M + AWARE_PER * 5 + 1.5, 1)} m, DEAF_VOICE_M ${DEAF_VOICE_M}): offered ${r.offered}, ${T.live.st} (deaf ${deafNow})`);
        if ((T.live.st === 'hands') === deaf) off.push({ case: deaf ? 'unseen unheard' : 'heard', st: T.live.st });
      }
      console.log(`      ${rows.join('; ')}`);
      assert(!off.length, JSON.stringify(off));
    },
  },
  {
    name: 'breach-challenge: T on "Bang, then go" over a man seen cowering: cqb.js cqb-rp-hands\' cower variant, "He\'s done. Challenge him.", its act the Challenge with the bracket on him (else the aim onto him), and cqb-contact\'s "Pair." keeps quiet over him',
    fn() {
      const g = rpScript({ seed: 48213, held: 'loose' }), s = g.s;
      g.open(); g.run(2500); g.bang(); g.run(200);
      g.enter('me', [29.5, 10.2], [31.0, 8.5]);
      // (a real pause takes the two men in, blind: the line's men are those you know; 1a out, 1b frozen once his eyes are back)
      g.run(1500); quiet(g); g.run(3600);
      const T = hold(g, '1b', 'freeze');
      if (s.stop?.mode !== 'stop') enterStop(s, g.g.bus, { via: 'shoot' });
      const lines = [];
      for (let i = 0; i < 4; i++) {
        g.g.step(1, {});
        const L = instinctNow(s).line;
        lines.push(L ? `${L.id}/${L.variant ?? '-'} "${L.text}" ${L.act}` : 'none');
        if (L?.act === 'stop:contact:challenge') break;
        if (L?.act) { g.g.step(1, { act: ['instinct'] }); let n = 0; while (s.stop?.phase === 'act' && n++ < 100) g.g.step(1, {}); if (s.stop?.mode !== 'stop') enterStop(s, g.g.bus, { via: 'shoot' }); }
      }
      const steps = stepsOf(s).map(x => x.id);
      // (T pressed on it: the challenge, and he gives at its end)
      g.g.step(1, { act: ['instinct'] });
      let n = 0; while (s.stop?.phase === 'act' && n++ < 100) g.g.step(1, {});
      g.g.step(1, { act: [stepAct('leave')] });
      console.log(`      the lines in turn: ${lines.join(' | ')}; the panel's first: ${steps.slice(0, 4).join(', ')}; T pressed: 1b ${T.live.st}`);
      assert(lines.some(l => l.startsWith('cqb-rp-hands/cower') && l.endsWith('stop:contact:challenge')) && !lines.some(l => l.startsWith('cqb-contact') || l.startsWith('cqb-rp-fire')) && T.live.st === 'hands', JSON.stringify({ lines, st: T.live.st }));
    },
  },
  {
    // (the review of A, 2026-11-19: on the recruit's seed 5 the challenge's held end tick still offered the row and T's cower line, a
    // second press there took its end first, the first was never judged, and he re-rolled to fight 350 ms later: a chest casualty)
    name: 'breach-challenge: a second Challenge pressed on the first one\'s held end tick (the clock held for your next choice, the men not yet living it) leaves the first judged: he gives at its end; T says no Challenge on that tick',
    fn() {
      const g = rpScript({ seed: 48213 }), s = g.s;
      g.open(); g.run(1500);
      g.enter('me', [29.5, 10.0], [31.0, 8.5]); quiet(g);
      const T = hold(g, '1b', 'freeze'), fired = T.live.fired;
      if (s.stop?.mode !== 'stop') enterStop(s, g.g.bus, { via: 'shoot' });
      g.g.step(1, { act: [stepAct(`pick=${T.key}`)] });
      g.g.step(1, { act: [stepAct('contact:challenge', 'normal', T.key)] });
      const endMs = s.stop?.doing?.untilMs ?? null;
      let n = 0;
      while (s.stop?.phase === 'act' && n++ < 100) g.g.step(1, {});
      // (the held tick: the first challenge over, the clock at its end, his record not yet lived past it)
      const heldMs = s.clock.ms, line = instinctNow(s).line, row = contactRows(s).some(r => r.id === 'contact:challenge' && !r.off), pending = T.live.chalUntilMs;
      g.g.step(1, { act: [stepAct('contact:challenge', 'normal', T.key)] });
      const second = s.stop?.doing?.list?.[s.stop.doing.i] === 'contact:challenge' ? s.stop.doing.untilMs : null;
      n = 0;
      while (s.stop?.phase === 'act' && n++ < 100) g.g.step(1, {});
      g.g.step(1, { act: [stepAct('leave')] });
      g.run(2000);
      console.log(`      the first challenge's end ${endMs % 100000} ms, the held tick ${heldMs % 100000} ms (his challenge pending ${pending === undefined ? 'no' : pending % 100000}, the row ${row ? 'offered' : 'not offered'}, T's line ${line ? `${line.id}/${line.variant ?? '-'} ${line.act ?? ''}` : 'none'}); the second pressed there, its end ${second === null ? 'none' : second % 100000} ms; he gave at ${T.live.gaveAtMs === undefined ? 'never' : T.live.gaveAtMs % 100000} ms, then ${T.live.st} (knelt ${!!T.live.knelt}), rounds after ${T.live.fired - fired}`);
      assert(second !== null && T.live.gaveAtMs === endMs && T.live.st === 'hands' && T.live.knelt && T.live.fired === fired, JSON.stringify({ endMs, second, gaveAtMs: T.live.gaveAtMs, st: T.live.st }));
      assert(!(line?.id === 'cqb-rp-hands' && line?.act === 'stop:contact:challenge'), JSON.stringify({ line: line && { id: line.id, variant: line.variant, act: line.act } }));
    },
  },
];
