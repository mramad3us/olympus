// The contact: the detector on the bay's turners, the window at 1:1, the pause, the identification, the contact's rows and the lull (src/sim/combat/contact.js; COMBAT §25.4.1, §25.4.5, §25.4.6; the build sheet 0.0.8 §2.1, §5.1).
//
// On the fixture bay (tests/contact-world.mjs: the private on lane 4's 7 m point, out of stop motion at low ready, six
// turners edge-on), the user's words of 2026-11-07 held: "game would pause on contact with enemy, passing more time
// than if we had more experience". A turner turned at T is seen at T + 100 (half round), the pause lands on seen + the
// take-in; one never turned is never seen; two together are one window (n 2, severalK); a third 200 ms later joins it;
// the pause brackets the one nearest the muzzle; every action is refused in the window and none after; the feet carry
// a walk for the body's go (235 ms for the private) and stand; a live step running at the window's end has the pause
// at its end; the identification says only what is there or "can't see his hands".
import { assert, fmt, machine } from './helpers.mjs';
import { takeInOf, takeInWords, severalK, goMs } from '../src/sim/combat/react.js';
import { contactNow, contactLook, refusesAct, feetOf, contactRows, runContactSub, endContactSub, lullOf, LULL_MS, IDENT_WORDS } from '../src/sim/combat/contact.js';
import { contactOf } from '../src/sim/people/mind.js';
import { turnAway, turnerTargets } from '../src/sim/arms/turners.js';
import { TEST_SHEETS } from '../src/sim/skills/templates.js';
import { bayGame, turn, runTo, LANE } from './contact-world.mjs';

const ACTIONS = ['shoot', 'ready', 'carry', 'stance:down', 'stance:up', 'stop:fire', 'stop:aim', 'digit:1', 'instinct', 'debug:skip:60000', 'people', 'kd:police'];
const paused = (s) => !!contactOf(s)?.last && !contactOf(s)?.pending;

export default [
  {
    name: 'a turner turned at T is seen at T + 100 ms (its face half round) and the pause lands on seen + 550 for the private in his sector: stop motion, the bracket on it, time held; one never turned is never seen, and a game with no turn writes no contact',
    fn() {
      const { g } = bayGame();
      g.step(40);
      const none = !g.state.mind.contact;
      const T = g.state.clock.ms;
      turn(g, [LANE], T);
      const ticks = [];
      runTo(g, s => { const c = contactNow(s); ticks.push(`${s.clock.ms - T}${c?.pending ? `:${fmt(c.pending.k, 2)}` : ''}`); return paused(s); });
      const s = g.state, c = contactOf(s), L = c.last, facts = g.facts('contact').map(f => f.phase);
      console.log(`      40 ticks with nothing turned: ${none ? 'no contact written' : 'A CONTACT'}; turned at T: seen at T + ${L.seenMs - T}, the pause at T + ${s.clock.ms - T} (${takeInWords(s.clock.ms - L.seenMs)} s after), held [${s.clock.holds.join()}]`);
      console.log(`      the ticks after each step (T + ms: the window's k): ${ticks.join(' ')}`);
      console.log(`      known ${JSON.stringify(Object.keys(c.known))}; facts ${facts.join(', ')}; the stop ${s.stop.mode}, via ${s.stop.via}, the bracket on ${s.stop.pick}; the log: "${s.log.filter(e => e.kind === 'contact').at(-1).text}"`);
      assert(none && L.seenMs - T === 100 && s.clock.ms - L.seenMs === 550 && L.ms === 550 && L.expect === 'sector', JSON.stringify({ none, seen: L.seenMs - T, pause: s.clock.ms - L.seenMs, L }));
      assert(s.stop.mode === 'stop' && s.stop.pick === `turner:${LANE}` && s.clock.holds.includes('stop') && facts.join() === 'seen,pause' && Object.keys(c.known).join() === `turner:${LANE}`, JSON.stringify({ stop: s.stop, facts, known: c.known }));
      assert(!g.errors.length && !s.armoury.range.end, JSON.stringify(g.errors));
    },
  },
  {
    name: 'two turned together are one window (n 2, severalK 1.15, the slower expectation: alert on the next lane, 1,250 ms on a pass); a third turned 200 ms later joins it (n 3, the end re-taken from the first sighting); the pause brackets the one nearest the muzzle',
    fn() {
      const rows = [];
      for (const third of [false, true]) {
        const { g } = bayGame();
        const T = g.state.clock.ms;
        turn(g, [LANE, LANE + 1], T);
        if (third) { runTo(g, s => s.clock.ms >= T + 200); turn(g, [LANE - 1], T + 200); }
        const until = [];
        runTo(g, s => { const p = contactNow(s)?.pending; if (p && until.at(-1) !== p.untilMs - T) until.push(p.untilMs - T); return paused(s); });
        const s = g.state, L = contactOf(s).last, facts = g.facts('contact').map(f => f.phase);
        const formula = takeInOf({ wf: TEST_SHEETS.private.wf, expect: L.expect, grade: L.grade, n: L.n }).ms;
        rows.push({ third, n: L.n, ids: L.ids, expect: L.expect, grade: L.grade, ms: L.ms, formula, pause: s.clock.ms - L.seenMs, until, facts, pick: s.stop.pick });
        console.log(`      ${third ? 'two, then a third at T + 200' : 'two together'}: n ${L.n} (${L.ids.join(', ')}), ${L.expect}, ${L.grade}, take-in ${L.ms} ms (the formula ${formula}, severalK ${fmt(severalK(L.n), 3)}), the window's end at T + ${until.join(' then T + ')}; paused ${s.clock.ms - L.seenMs} ms after the first sighting; facts ${facts.join(', ')}; the bracket on ${s.stop.pick}`);
      }
      const [two, three] = rows;
      assert(two.n === 2 && two.expect === 'alert' && two.ms === two.formula && two.pause === two.ms && two.facts.join() === 'seen,pause' && two.pick === `turner:${LANE}`, JSON.stringify(two));
      assert(three.n === 3 && three.ms === three.formula && three.pause === three.ms && three.facts.join() === 'seen,join,pause' && three.until.length === 2 && three.pick === `turner:${LANE}`, JSON.stringify(three));
      assert(takeInOf({ wf: 15, expect: 'alert', n: 2 }).ms === 1250 && takeInOf({ wf: 15, expect: 'alert', n: 3 }).ms === 1350, 'the pass cases');
    },
  },
  {
    name: 'every action is refused while the window is open, none after the pause (game.js act()\'s gate); the feet carry the walk held at the sighting for the body\'s go (235 ms for the private) and stand, keys released or pressed in the window changing nothing',
    fn() {
      const { g } = bayGame();
      const T = g.state.clock.ms;
      turn(g, [LANE], T);
      runTo(g, s => !!contactOf(s)?.pending);
      const inWin = ACTIONS.filter(a => refusesAct(g.state, a));
      runTo(g, paused);
      const after = ACTIONS.filter(a => refusesAct(g.state, a));
      console.log(`      in the window: ${inWin.length} of ${ACTIONS.length} actions refused; after the pause: ${after.length}`);
      assert(inWin.length === ACTIONS.length && !after.length, JSON.stringify({ inWin, after }));
      // (the walk: south along the line (the muzzle held downrange), the keys as each case holds them)
      const cases = [['walking, keys held', () => ({ mz: 1 })], ['walking, keys released at the sighting', (s) => (contactOf(s)?.pending ? {} : { mz: 1 })], ['standing, keys pressed in the window', (s) => (contactOf(s)?.pending ? { mz: 1 } : {})]];
      const res = [];
      for (const [why, input] of cases) {
        const { g: h, me } = bayGame();
        const T2 = h.state.clock.ms;
        turn(h, [LANE], T2 + 150);
        const track = [];
        runTo(h, s => { track.push({ ms: s.clock.ms, z: me.z }); return paused(s); }, (s) => input(s));
        const P = contactOf(h.state).last, at = (ms) => track.find(p => p.ms === ms)?.z;
        const seenZ = at(P.seenMs + 50), goEnd = track.find(p => p.ms >= P.seenMs + goMs(15) + 50)?.z, endZ = me.z;
        const win = (goEnd ?? endZ) - (seenZ ?? endZ), still = endZ - (goEnd ?? endZ);
        res.push({ why, win, still, feet: feetOf(h.state, { mz: 1 }) });
        console.log(`      ${why}: in the window ${fmt(win, 3)} m in the body's go, then ${fmt(still, 3)} m to the pause (${P.ms} ms); the feet at the pause read the keys again (${JSON.stringify(feetOf(h.state, { mz: 1 }))})`);
      }
      const [held, released, pressed] = res;
      // (the go: the ticks after the sighting's own, while the clock is under seenMs + 235: four, 0.2 s of a walk)
      assert(held.win > 0.15 && held.win < 0.3 && Math.abs(released.win - held.win) < 1e-9 && held.still === 0 && released.still === 0, JSON.stringify(res));
      assert(pressed.win === 0 && pressed.still === 0, JSON.stringify(pressed));
    },
  },
  {
    name: 'a live step running at the window\'s end (W to prone out of stop motion): the pause comes on its end\'s tick, not before and not a tick late',
    fn() {
      const { g } = bayGame();
      const T = g.state.clock.ms;
      g.step(1, { act: ['stance:prone'] });
      const d = g.state.stop?.doing, stepEnd = d ? d.untilMs : null;
      turn(g, [LANE], T);
      runTo(g, paused);
      const s = g.state, L = contactOf(s).last, endTick = Math.ceil(stepEnd / 50) * 50;
      console.log(`      prone begun at T as a live step (${g.state.stop ? 'in the mode now' : '?'}): its end at T + ${stepEnd - T} (the tick T + ${endTick - T}); the window's end at T + ${L.seenMs + L.ms - T}; the pause at T + ${s.clock.ms - T}, the stance ${g.me().stance}, ${s.stop.mode} via ${s.stop.via}`);
      assert(d && d.kind === 'stance' && stepEnd > L.seenMs + L.ms && s.clock.ms === endTick && g.me().stance === 'prone' && s.stop.mode === 'stop' && s.stop.via === 'contact', JSON.stringify({ stepEnd: stepEnd - T, pause: s.clock.ms - T, until: L.seenMs + L.ms - T }));
    },
  },
  {
    name: 'a command running at the window\'s end (LOAD in the mode): the sub-step under way finishes, the pause comes on its end\'s tick and the rest is queued as "Carry on" (COMBAT §25.4.5: never cut mid-sub-step)',
    fn() {
      const { g, R } = bayGame();
      g.step(1, { act: ['shoot'] });
      R.cmd = null;                                                // (no command to chain a wait on)
      const T = g.state.clock.ms;
      g.step(1, { act: ['stop:macro:load'] });
      const d = g.state.stop.doing;
      turn(g, [LANE], T);
      runTo(g, paused);
      const s = g.state, L = contactOf(s).last, until = L.seenMs + L.ms - T;
      const subs = d.subs.map(x => x.action), steps = g.facts('step').filter(f => f.fromMs >= T).map(f => `${f.phase}:${f.action}@${f.fromMs - T}–${f.toMs - T}`);
      const sub = g.facts('step').filter(f => f.phase === 'sub' && f.fromMs - T < until).at(-1), subEnd = Math.ceil(sub.toMs / 50) * 50 - T;
      console.log(`      LOAD chosen at T: the window to T + ${until}, the sub-step then under way ${sub.action} (to T + ${sub.toMs - T}); the pause at T + ${s.clock.ms - T}; done ${subs.join(', ')}, queued ${s.stop.queue.join(', ')}; ${steps.join(' ')}`);
      assert(s.clock.ms - T === subEnd && subEnd > until && s.stop.queue.length && !s.stop.doing && s.stop.via === 'contact' && steps.at(-1).startsWith('halt:'), JSON.stringify({ pause: s.clock.ms - T, subEnd, until, queue: s.stop.queue, steps }));
    },
  },
  {
    name: 'a stop-motion step that ends inside the window lets the clock run on (time never stands still on a person not yet taken in, every action refused), whether its end chains a wait or would hold time (no step\'s end holds time while a window is open: the build sheet 0.0.8 §2.2, §8 item 9), and the pause comes at the window\'s end',
    fn() {
      const bad = [];
      for (const chain of [true, false]) {
        const { g, R } = bayGame();
        g.step(1, { act: ['shoot'] });
        if (!chain) R.cmd = null;                                  // (no command for the step to chain a wait on: its end would hold time, but not in a window)
        const T = g.state.clock.ms;
        g.step(1, { act: ['stop:selector:semi'] });
        const d = g.state.stop?.doing, stepEnd = d?.untilMs ?? null;
        turn(g, [LANE], T);
        const ticks = [];
        runTo(g, s => { ticks.push(`${s.clock.ms - T}${s.clock.holds.length ? `[${s.clock.holds.join()}]` : ''}`); return paused(s); });
        const s = g.state, L = contactOf(s).last, after = g.facts('step').filter(f => f.fromMs >= T).map(f => `${f.phase}:${f.step}`).join(' ');
        console.log(`      ${chain ? 'its end chains a wait' : 'its end would hold time'}: Off safe chosen at T in the mode (its end at T + ${stepEnd - T}); seen at T + ${L.seenMs - T}, the window to T + ${L.seenMs + L.ms - T}; the pause at T + ${s.clock.ms - T}, held [${s.clock.holds.join()}], via ${s.stop.via}; steps ${after}`);
        console.log(`        the ticks: ${ticks.join(' ')}`);
        const held = ticks.some(t => t.includes('[stop]') && !t.startsWith(`${s.clock.ms - T}`));
        if (!(d && stepEnd > L.seenMs && stepEnd < L.seenMs + L.ms && s.clock.ms === L.seenMs + L.ms && s.stop.via === 'contact' && s.clock.holds.join() === 'stop' && !g.errors.length) || after.includes('cut:wait') !== chain || held)
          bad.push(JSON.stringify({ chain, stepEnd: stepEnd - T, pause: s.clock.ms - T, seen: L.seenMs - T, ms: L.ms, after, held, errors: g.errors }));
      }
      assert(!bad.length, bad.join('\n'));
    },
  },
  {
    name: 'the identification at the pause says only what is there ("a rifle", "a pistol", "hands empty", "a phone in his hand") or "can\'t see his hands", never a weapon that is not there; the no-shoot\'s rows lead (Hold him, Challenge) and the challenge looks again at +4; the lull after 3 s',
    fn() {
      const faces = { 3: 'threat', 4: 'noshoot', 5: 'armoured' }, holds = { 3: 'pistol', 4: 'phone', 5: 'rifle' };
      let unseen = 0, wrong = 0, runs = 0, armourSeen = 0, sample = null;
      for (let seed = 1; seed <= 24; seed++) for (const tier of ['recruit', 'private']) {
        const { g } = bayGame({ seed, tier, line: 10, faces, holds });
        turn(g, [3, 4, 5], g.state.clock.ms);
        runTo(g, paused);
        const L = contactOf(g.state).last;
        runs++;
        for (const key of L.ids) {
          const lane = Number(key.split(':')[1]), id = L.ident[key];
          if (id === 'unseen') unseen++;
          else if (id !== holds[lane]) wrong++;
          if (L.armour[key]) { if (faces[lane] !== 'armoured' || id === 'unseen') wrong++; else armourSeen++; }
        }
        if (!sample && tier === 'recruit' && Object.values(L.ident).includes('unseen')) sample = g;
      }
      console.log(`      ${runs} pauses at 10 m (the recruit and the private, 24 seeds, three faces each): ${unseen} "can't see his hands", ${wrong} wrong, armour seen ${armourSeen} times`);
      assert(!wrong && unseen > 0, JSON.stringify({ wrong, unseen }));
      const s = sample.state, L = contactOf(s).last;
      console.log(`      a recruit's pause: "${s.log.filter(e => e.kind === 'contact').at(-1).text}"`);
      // (the no-shoot bracketed: its rows lead, the challenge looks again)
      s.stop.pick = 'turner:4';
      const rows = contactRows(s), seenBefore = L.ident['turner:4'];
      console.log(`      the no-shoot (${IDENT_WORDS[L.ident['turner:4']]}) bracketed: ${rows.map(r => `${r.label} · ${takeInWords(r.ms)} s${r.lead ? ' (leads)' : ''} [${r.list.join(', ')}]`).join('; ')}`);
      const d = { who: s.player.id, target: 'turner:4' }, said = runContactSub(s, sample.bus, d, 'contact:challenge', s.clock.ms), r = endContactSub(s, sample.bus, d, 'contact:challenge');
      console.log(`      Challenge: "${said.text}" (${said.ms} ms); then ${r.roll.total} against ${r.roll.dc} (${r.roll.dcParts.map(p => `${p.why} ${p.v}`).join(', ')}): ${IDENT_WORDS[r.ident]}; the line "${sample.facts('line').at(-1)?.text}"`);
      const ids = rows.map(x => x.id).join();
      assert(ids === 'contact:hold,contact:challenge' && rows.every(x => x.lead === (seenBefore === 'phone')) && said.ms === 1200 && (r.ident === 'phone' || r.ident === 'unseen'), JSON.stringify({ ids, r }));
      assert(r.roll.dcParts.some(p => p.why === 'challenged' && p.v === -4), JSON.stringify(r.roll.dcParts));
      // (the lull: none while a threat faces; 3 s after the last turned edge-on)
      const now = s.clock.ms, before = lullOf(s, s.player.id, now + 5000);
      for (const T of s.armoury.range.turners) if (T.turnAtMs !== null) turnAway(T, now);
      const at = [1000, 2000, 3100, 3200].map(ms => `+${ms} ${lullOf(s, s.player.id, now + ms) ? 'lull' : 'no'}`);
      console.log(`      the lull with the threats facing: ${before ? 'LULL' : 'none'}; turned away at the pause: ${at.join(', ')} (LULL_MS ${LULL_MS} after the last edge-on, ${turnerTargets(s, now + 150).filter(t => t.facingK > 0).length} still turning at +150)`);
      assert(!before && at.join() === '+1000 no,+2000 no,+3100 lull,+3200 lull', at.join());
    },
  },
  {
    name: 'the detector\'s cost a tick on the bay (COMBAT §25.12: an event, never a per-tick pass): six turners edge-on, six facing and known, and a sighting of all six at once (six sightOf), against ceilings × the machine\'s factor',
    fn() {
      const { g, me } = bayGame(), s = g.state, N = 2000, { k } = machine();
      const time = (prep) => { const t0 = performance.now(); for (let i = 0; i < N; i++) { prep?.(); contactLook(s, {}, null, null); } return (performance.now() - t0) / N; };
      const edgeOn = time();
      turn(g, [1, 2, 3, 4, 5, 6], s.clock.ms - 1000);
      const c = () => contactOf(s);
      contactLook(s, {}, null, null);
      const known = Object.keys(c()?.known ?? {}).length;
      const facing = time();
      const sighting = time(() => { c().known = {}; c().pending = null; });
      console.log(`      ${N} calls each: edge-on ${fmt(edgeOn * 1000, 2)} µs, six facing and known (${known}) ${fmt(facing * 1000, 2)} µs, a sighting of six ${fmt(sighting * 1000, 1)} µs (the machine ×${fmt(k, 2)}); the player at (${fmt(me.x, 1)}, ${fmt(me.z, 1)})`);
      assert(known === 6 && edgeOn < 0.005 * k && facing < 0.02 * k && sighting < 0.5 * k, JSON.stringify({ known, edgeOn, facing, sighting, k }));
    },
  },
];
