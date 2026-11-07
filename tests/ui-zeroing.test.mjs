// The zero's dial on the plate and the weapon card (the user's report, 2026-11-07: "one bug I didn't catch (maybe I
// misunderstand), but I dialed in the coaches corrections, the UI still says that I'm on zero ?"; shot.js zeroingOf,
// plaque.js termText, weaponcard.js distanceParts and dialWords, steps.js weaponCardModel).
//
// A dialled call moves the believed zero with the turrets (shooting.js sight:call), so the dial from the believed zero
// read ON ZERO after every call. While the rifle is being zeroed (the KD course's 25 m zero, until the coach accepts it)
// the plate's zero term and the card count the clicks dialled in this zero from the turrets as issued: "ZEROING · NONE"
// on both before a click, "ZEROING ▲4 <2" (the card's "ZEROING ▲4 ◀2") after; once the
// zero is accepted both read from the believed zero as before (ON ZERO, ▼6 at 200 m on the dope). Off the KD course
// nothing changes. The KD bot plays test-range on seed 48213 with a manual dial of two up and back at the first
// commence fire; the words are read at each point from the sim's own records (plaqueOf, kdNow, beliefOf). A call
// dialled by the keys (or half by the keys, the rest by the row) counts as dialled once (shooting.js callReached, the
// verifier's finding); a zero never accepted reads ZEROING until its UNLOAD, SHOW CLEAR writes it down.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { kdBot } from './bots/kd.mjs';
import { stepAct } from './bots/lib.mjs';
import { kdNow } from '../src/sim/scenarios/range.js';
import { plaqueOf, zeroingOf } from '../src/sim/arms/shot.js';
import { targetsOf, gunOn, stepsOf, pendingCall } from '../src/sim/arms/shooting.js';
import { beliefOf } from '../src/sim/arms/firearms.js';
import { termText } from '../src/ui/plaque.js';
import { distanceParts, dialWords } from '../src/art/weaponcard.js';
import { weaponCardModel } from '../src/ui/hud/steps.js';

// (what the player sees now: the plate's zero term on their own card or face, and the card's dial and caption)
function seen(state) {
  const pid = state.player.id, K = kdNow(state), gunId = gunOn(state, pid), b = beliefOf(state, gunId);
  const own = K.line === 25 ? `paper:${K.lane}` : `face:${K.kdLane}`;
  const T = state.stop ? targetsOf(state, pid).find(t => t.key === own) : null;
  const rec = T ? plaqueOf(state, pid, { target: T, gunId }) : null, zt = rec?.terms?.find(t => t.key === 'zero') ?? null;
  const line = [200, 300, 500].includes(K.line) ? K.line : null;
  const card = weaponCardModel(b, { distance: true, line, hold: state.stop?.hold ?? null, zeroing: K.zeroing });
  const F = distanceParts(b, { distance: true, line, hold: null, zeroing: K.zeroing });
  const w = dialWords(F);
  return { plate: zt ? termText(zt) : null, hover: zt?.words ?? null, card: w.dial, dope: w.dope, onDope: w.onDope, toGo: w.toGo, caption: card.far, sight: b.sight, zero: b.zero, zeroing: K.zeroing };
}

export default [
  {
    name: 'the plate\'s zero term and the card\'s dial in words: "ZEROING · NONE" before a click on both, "ZEROING ▲4 <2" and "ZEROING ▲4 ◀2" after, ON ZERO and ▼6 off the zero, test-handling\'s words as they were (the user\'s report, 2026-11-07)',
    fn() {
      const z = (v, zeroing) => termText({ key: 'zero', v, ...(zeroing ? { zeroing } : {}) });
      const plate = [z({ elev: 0, wind: 0 }, true), z({ elev: 4, wind: -2 }, true), z({ elev: -1, wind: 0 }, true), z({ elev: 0, wind: 0 }), z({ elev: -6, wind: 0 }), z({ elev: 2, wind: -1 })];
      const card = (sight, zero, zeroing) => dialWords(distanceParts({ sight, zero, optic: 1 }, { distance: true, zeroing })).dial;
      const issued = { from: { elev: 0, wind: 0 } };
      const cards = [card({ elev: 0, wind: 0 }, null, issued), card({ elev: 4, wind: -2 }, { elev: 4, wind: -2 }, issued), card({ elev: 4, wind: -2 }, { elev: 4, wind: -2 }, null), card({ elev: -2, wind: 3 }, { elev: 4, wind: 3 }, null)];
      console.log(`      the plate: ${plate.join(' | ')}`);
      console.log(`      the card: ${cards.join(' | ')}`);
      assert(plate.join(' | ') === 'ZEROING · NONE | ZEROING ▲4 <2 | ZEROING ▼1 | ON ZERO | ▼6 | ▲2 <1', plate.join(' | '));
      assert(cards.join(' | ') === 'ZEROING · NONE | ZEROING ▲4 ◀2 | ON ZERO | ▼6', cards.join(' | '));
      // (off the KD course: no zeroing, the card and the caption as v0.0.7 drew them (test-handling's bay, scored))
      const g = createGame({ scenario: 'test-handling', seed: 48213 }), s = g.state;
      const b = beliefOf(s, gunOn(s, s.player.id));
      const m0 = weaponCardModel(b, {}), m1 = weaponCardModel(b, { zeroing: null });
      console.log(`      test-handling: zeroingOf ${JSON.stringify(zeroingOf(s))}, kdNow ${JSON.stringify(kdNow(s))}, the card "${m0.line}"`);
      assert(zeroingOf(s) === null && kdNow(s) === null && JSON.stringify(m0) === JSON.stringify(m1) && m0.far === null, JSON.stringify(m0));
    },
  },
  {
    name: 'through a zero on test-range (seeds 48213, 7, 99 and 5, which takes two calls): the plate and the card read "ZEROING · NONE" before a click, the clicks after a manual dial and after each of the coach\'s calls dialled, added up (with "Dialled …: the zero moves with it." in the log), ON ZERO once the zero is accepted, the confirm\'s call from the believed zero as before, and ▼6 at 200 m on the dope (the user\'s report, 2026-11-07: "I dialed in the coaches corrections, the UI still says that I\'m on zero ?")',
    fn() {
      let summed = 0;
      for (const seed of [48213, 7, 99, 5]) summed += throughZero(seed) >= 2 ? 1 : 0;
      assert(summed >= 1, 'a seed with two calls on the zero, the second added to the first');
    },
  },
  {
    name: 'a coach\'s call dialled by the keys (Z S, Shift Q D) counts as dialled, once: the row gone, the believed zero moved by the call, "Dialled …" in the log, no call offered after "Leave the turrets alone." and no second dial, and at 300 m the card on the dope (▼3 ✓), not asking for the call back off; half by the keys and the rest by the row dials the call once (seeds 99, 5 and 48213; the verifier\'s finding on the user\'s report, 2026-11-07)',
    fn() {
      for (const seed of [99, 5, 48213]) byKeys(seed, 'keys');
      for (const seed of [99, 5, 48213]) byKeys(seed, 'half');
    },
  },
  {
    name: 'a zero never accepted, written down at UNLOAD, SHOW CLEAR after four groups: ZEROING on the plate and the card through the fourth dial, ON ZERO at the zero\'s UNLOAD, SHOW CLEAR, ▼3 at 300 m (seed 48213, eight clicks up added before every group; the verifier\'s, on the user\'s report of 2026-11-07)',
    fn() { neverAccepted(48213); },
  },
];

// (one course to the 200 m string's commence fire: the words at each point, asserted; returns the calls dialled on the zero)
function throughZero(seed) {
  const g = createGame({ scenario: 'test-range', seed }), s = g.state, bot = kdBot();
  const at = {}, zeroCalls = [], dialLines = [];
  let manual = 0, seenEv = 0;
  // (the KD bot, with a manual dial of two up at the first commence fire, read, and two down again)
  const mine = (state, me, mem) => {
    const K = kdNow(state), S = state.stop;
    if (K?.cmd === 'fire' && K.stage === 'zero' && S?.mode === 'stop' && S.phase === 'choose' && !S.doing && manual < 3) {
      if (manual === 0) { at.none = seen(state); manual = 1; return { act: [stepAct('sight:elev:+2')] }; }
      if (manual === 1) { at.manual = seen(state); manual = 2; return { act: [stepAct('sight:elev:-2')] }; }
      if (manual === 2) { at.back = seen(state); manual = 3; }
    }
    return bot(state, me, mem);
  };
  for (let t = 0; t < 20 * 60 * 30; t++) {
    g.step(1, mine);
    for (const ev = g.bus.events; seenEv < ev.length; seenEv++) {
      const [type, d] = ev[seenEv];
      // (the dial's line in the log (sim/log.js), as the log box shows it)
      if (type === 'log' && d.entry?.step === 'sight:call') {
        dialLines.push(d.entry.text);
        const v = { ...seen(s), text: d.entry.text, stage: kdNow(s).stage };
        if (v.stage === 'zero') zeroCalls.push(v); else at.confirmCall ??= v;
      }
    }
    const K = kdNow(s);
    if (!at.accepted && K.stage === 'zero' && !K.zeroing && K.groups.length && s.stop) at.accepted = { ...seen(s), groups: K.groups.length, zeroed: K.zeroed };
    if (!at.s200 && K.line === 200 && K.cmd === 'fire' && s.stop?.phase === 'choose') at.s200 = seen(s);
    if (K.end || at.s200) break;
  }
  g.clearFacts();
  zeroCalls.forEach((v, i) => { at[`call ${i + 1}`] = v; });
  console.log(`      seed ${seed}: the zero accepted after ${at.accepted?.groups} group${at.accepted?.groups === 1 ? '' : 's'} (${at.accepted?.zeroed ? '"Zeroed. Leave it."' : 'written down at UNLOAD, SHOW CLEAR'}), ${zeroCalls.length} call${zeroCalls.length === 1 ? '' : 's'} dialled on it`);
  for (const k of ['none', 'manual', 'back', ...zeroCalls.map((_, i) => `call ${i + 1}`), 'accepted', 'confirmCall', 's200']) {
    const v = at[k];
    if (v) console.log(`        ${k}: plate "${v.plate}", card "${v.card}"${v.dope ? ` (${v.dope})` : ''}, caption "${v.caption}"; turrets ${JSON.stringify(v.sight)}, believed ${JSON.stringify(v.zero)}${v.text ? `; the log: "${v.text}"` : ''}`);
  }
  const gun = s.items[gunOn(s, s.player.id)];
  console.log(`        the rifle's true zero ${JSON.stringify(gun.zero ?? { elev: 0, wind: 0 })} (never shown)`);
  assert(at.none?.plate === 'ZEROING · NONE' && at.none.card === 'ZEROING · NONE' && /^zeroing: nothing dialled yet/.test(at.none.hover ?? ''), `seed ${seed}: ${JSON.stringify(at.none)}`);
  assert(at.manual?.plate === 'ZEROING ▲2' && at.manual.card === 'ZEROING ▲2' && /ZEROING ▲2/.test(at.manual.caption), `seed ${seed}: ${JSON.stringify(at.manual)}`);
  assert(at.back?.plate === 'ZEROING · NONE', `seed ${seed}: ${JSON.stringify(at.back)}`);
  const arrows = (p, l, r) => [p.elev ? `${p.elev > 0 ? '▲' : '▼'}${Math.abs(p.elev)}` : null, p.wind ? `${p.wind > 0 ? r : l}${Math.abs(p.wind)}` : null].filter(Boolean).join(' ');
  // (each call: the turrets counted from their issue, every call so far added, never reset by the believed zero moving)
  for (const c of zeroCalls) {
    assert((c.sight.elev || c.sight.wind) && c.plate === `ZEROING ${arrows(c.sight, '<', '>')}` && c.card === `ZEROING ${arrows(c.sight, '◀', '▶')}`, `seed ${seed}: after the call, ${JSON.stringify(c)}`);
    assert(/^Dialled .+: the zero moves with it\.$/.test(c.text), c.text);
  }
  assert(at.accepted?.plate === 'ON ZERO' && at.accepted.card === 'ON ZERO' && JSON.stringify(at.accepted.sight) === JSON.stringify(at.accepted.zero), `seed ${seed}: ${JSON.stringify(at.accepted)}`);
  // (the confirm's call at 300 m: from the believed zero, as v0.0.7 said it)
  if (at.confirmCall) assert(!/ZEROING/.test(at.confirmCall.plate + at.confirmCall.card) && /^Dialled /.test(at.confirmCall.text), `seed ${seed}: ${JSON.stringify(at.confirmCall)}`);
  assert(at.s200?.card === '▼6' && at.s200.plate === '▼6' && /^200 ▼6/.test(at.s200.dope ?? ''), `seed ${seed}: ${JSON.stringify(at.s200)}`);
  return zeroCalls.length;
}

// (a click toward the call's want by the keys' step, the elevation first: 'sight:elev:+1', or null at the want)
function keyToward(state) {
  const p = pendingCall(state);
  if (!p?.want) return null;
  const s = beliefOf(state, gunOn(state, state.player.id)).sight;
  if (s.elev !== p.want.elev) return `sight:elev:${p.want.elev > s.elev ? '+' : '-'}1`;
  if (s.wind !== p.want.wind) return `sight:wind:${p.want.wind > s.wind ? '+' : '-'}1`;
  return null;
}
const choosing = (state) => state.stop?.mode === 'stop' && state.stop.phase === 'choose' && !state.stop.doing && !state.stop.reflex;
const callRow = (state) => stepsOf(state).find(x => x.id === 'sight:call' && !x.off) ?? null;
// (a call's clicks in words: '4 up, 2 left')
const said = (c) => [c.elev ? `${Math.abs(c.elev)} ${c.elev > 0 ? 'up' : 'down'}` : null, c.wind ? `${Math.abs(c.wind)} ${c.wind > 0 ? 'right' : 'left'}` : null].filter(Boolean).join(', ');

// (the KD bot with the coach's calls dialled by the keys ('keys': every click; 'half': half the clicks, the rest by the
// row), to the 300 m commence fire after the confirm's call is on, or the 200 m string)
function byKeys(seed, how) {
  const g = createGame({ scenario: 'test-range', seed }), s = g.state, bot = kdBot(), pid = s.player.id;
  const calls = [], lines = [];
  let cur = null, seenEv = 0, afterZeroed = 0, reached = null, at300 = null, accepted = null;
  const mine = (state, me, mem) => {
    const K = kdNow(state);
    const ours = K && ((K.stage === 'zero' && K.cmd === 'dial') || (K.stage === 'confirm' && K.cmd === 'fire'));
    if (ours && choosing(state)) {
      const p = pendingCall(state);
      if (p?.want && (!cur || cur.call !== p.call)) {
        cur = { call: p.call, clicks: { ...p.clicks }, want: { ...p.want }, zeroWas: { ...beliefOf(state, gunOn(state, pid)).zero }, stage: K.stage, keys: 0 };
        cur.limit = how === 'half' ? Math.ceil((Math.abs(p.clicks.elev) + Math.abs(p.clicks.wind)) / 2) : Infinity;
        calls.push(cur);
      }
      if (p && cur && cur.keys < cur.limit) { const k = keyToward(state); if (k) { cur.keys++; return { act: [stepAct(k)] }; } }
    }
    return bot(state, me, mem);
  };
  for (let t = 0; t < 20 * 60 * 40; t++) {
    g.step(1, mine);
    for (const ev = g.bus.events; seenEv < ev.length; seenEv++) { const [type, d] = ev[seenEv]; if (type === 'log' && /^Dialled /.test(d.entry?.text ?? '')) lines.push({ text: d.entry.text, step: d.entry.step }); }
    const K = kdNow(s);
    if (cur && !cur.done && choosing(s)) {
      const b = beliefOf(s, gunOn(s, pid));
      if (b.sight.elev === cur.want.elev && b.sight.wind === cur.want.wind) {
        cur.done = true;
        Object.assign(cur, { rowGone: !callRow(s), zero: { ...b.zero }, sight: { ...b.sight }, dialled: !!cur.call.dialled });
        if (cur.stage === 'confirm') reached = cur;
      }
    }
    if (K.stage === 'zero' && K.zeroed && choosing(s) && callRow(s)) afterZeroed++;
    if (!accepted && K.stage === 'zero' && !K.zeroing && K.groups.length && s.stop) accepted = { ...seen(s), groups: K.groups.length };
    if (reached && !at300 && K.stage === 'confirm' && K.cmd === 'fire' && choosing(s)) at300 = seen(s);
    if (K.end || at300 || (K.line === 200 && K.cmd === 'fire')) break;
  }
  g.clearFacts();
  console.log(`      seed ${seed}, ${how === 'keys' ? 'every click by the keys' : 'half by the keys, the rest by the row'}: ${calls.map(c => `the ${c.stage}'s call ${said(c.clicks)} (${c.keys} key click${c.keys === 1 ? '' : 's'}): turrets ${JSON.stringify(c.sight)}, believed ${JSON.stringify(c.zeroWas)} to ${JSON.stringify(c.zero)}, row ${c.rowGone ? 'gone' : 'still offered'}`).join('; ')}`);
  console.log(`        the log: ${lines.map(l => `"${l.text}" (${l.step})`).join(', ') || 'nothing'}; a call offered after the zero was accepted: ${afterZeroed} times; accepted after ${accepted?.groups} groups at ${JSON.stringify(accepted?.sight)}, plate "${accepted?.plate}"`);
  if (at300) console.log(`        at 300 m after the confirm's call: card "${at300.card}" (${at300.dope}${at300.onDope ? ' ✓' : ''}${at300.toGo ? `, ${at300.toGo} to go` : ''}), plate "${at300.plate}"`);
  assert(calls.length && calls.every(c => c.done && c.dialled && c.rowGone && c.zero.elev === c.zeroWas.elev + c.clicks.elev && c.zero.wind === c.zeroWas.wind + c.clicks.wind), `seed ${seed} ${how}: ${JSON.stringify(calls)}`);
  // (one log line a call, however it was dialled, with the call's clicks)
  const words = (c) => new RegExp(`^Dialled ${said(c.clicks).replace(/\d+/g, '[a-z-]+')}: the zero moves with it\\.$`);
  assert(lines.length === calls.length && calls.every((c, i) => words(c).test(lines[i]?.text ?? '')), `seed ${seed} ${how}: ${JSON.stringify(lines)}`);
  assert(afterZeroed === 0, `seed ${seed} ${how}: a call offered ${afterZeroed} times after the zero was accepted`);
  const last = calls.filter(c => c.stage === 'zero').at(-1);
  assert(accepted?.plate === 'ON ZERO' && (!last || JSON.stringify(accepted.sight) === JSON.stringify(last.want)), `seed ${seed} ${how}: no second dial, ${JSON.stringify({ accepted, last })}`);
  if (reached) assert(at300?.card === '▼3' && at300.onDope && !at300.toGo && at300.plate === '▼3', `seed ${seed} ${how}: at 300, ${JSON.stringify(at300)}`);
  return calls;
}

// (the KD bot with eight clicks up before every zero group, so the coach never says "Zeroed.": the words at each dial,
// at the zero's UNLOAD, SHOW CLEAR and at the 300 m commence fire)
function neverAccepted(seed) {
  const g = createGame({ scenario: 'test-range', seed }), s = g.state, bot = kdBot();
  const added = new Set(), dials = [];
  let atClear = null, at300 = null;
  const mine = (state, me, mem) => {
    const K = kdNow(state);
    if (K?.stage === 'zero' && K.cmd === 'fire' && choosing(state) && !added.has(K.groups.length)) { added.add(K.groups.length); return { act: [stepAct('sight:elev:+8')] }; }
    return bot(state, me, mem);
  };
  for (let t = 0; t < 20 * 60 * 40; t++) {
    g.step(1, mine);
    const K = kdNow(s);
    // (each group's call once it is dialled, the line still in the mode)
    if (K.stage === 'zero' && s.stop && K.groups.at(-1)?.call?.dialled && dials.length < K.groups.length) dials.push({ group: K.groups.length, ...seen(s) });
    if (!atClear && K.stage === 'zero' && K.cmd === 'clear' && choosing(s)) atClear = seen(s);
    if (!at300 && K.stage === 'confirm' && K.cmd === 'fire' && choosing(s)) at300 = seen(s);
    if (K.end || at300) break;
  }
  g.clearFacts();
  const K = kdNow(s);
  console.log(`      seed ${seed}: ${dials.length} groups, ${K.zeroed ? 'zeroed' : 'never zeroed'}; ${dials.map(d => `group ${d.group}: plate "${d.plate}", card "${d.card}"`).join('; ')}`);
  console.log(`        at UNLOAD, SHOW CLEAR: plate "${atClear?.plate}", card "${atClear?.card}", turrets ${JSON.stringify(atClear?.sight)}, believed ${JSON.stringify(atClear?.zero)}; at 300 m: card "${at300?.card}" (${at300?.dope}), plate "${at300?.plate}"`);
  assert(!K.zeroed && dials.length === 4 && dials.every(d => /^ZEROING /.test(d.plate) && /^ZEROING /.test(d.card)), JSON.stringify(dials));
  assert(atClear?.card === 'ON ZERO' && atClear.zeroing === null && JSON.stringify(atClear.sight) === JSON.stringify(atClear.zero), JSON.stringify(atClear));
  assert(at300?.card === '▼3' && at300.plate === '▼3', JSON.stringify(at300));
}
