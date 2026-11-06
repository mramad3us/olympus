// The reviews of v0.0.5's test-handling (the code, runtime, design and parity lenses), each finding the fixer took pinned here so it fails without its fix.
//
// What the four reviewers found by reading the code and by playing the scene by its keys at 16 px/m:
// a bracket key counted as walking with the feet held; "Carry on" after the coach's "Hold." fired the
// round; a set double on a magazine's 4th round was never counted cleared; a tap after a string's last
// round called a stoppage; a double feed cleared only by its single, not by its steps; the lever's
// refusal on a dead hammer rolled and said nothing; R offered a fifteen-minute wait on the tower's line;
// both UNLOAD and UNLOAD, SHOW CLEAR wore the tower's mark; REMEDIAL ACTION was one 5 s roll; a negligent
// discharge left the issue's count and the brass short; Sling it kept the mode; the thumb's work reset
// the held aim; Charge sat on the first page with a round in.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { stepsOf, HANDS_OFF } from '../src/sim/arms/shooting.js';
import { beliefOf, act, newGun, newMag, gunField, canDo } from '../src/sim/arms/firearms.js';
import { subsOf, MACROS } from '../src/sim/arms/drills.js';
import { move, pouchFor } from '../src/sim/arms/kit.js';
import { fixedRoller } from '../src/sim/combat/roll.js';
import { stream } from '../src/core/rng.js';
import { handOffer } from '../src/sim/places/hand.js';
import { doAction } from '../src/sim/arms/firearms.js';
import { logLines, rollLine, LOG_CARD_LINES } from '../src/ui/cards/log.js';
import { plaqueOf } from '../src/sim/arms/shot.js';
import { gunLook, FLASH_MS } from '../src/sim/arms/look.js';
import { fxMsOf } from '../src/render/lead.js';
import { flashPixels } from '../src/render/range-items.js';
import { rangeLook } from '../src/sim/arms/look.js';
import { targetsOf } from '../src/sim/arms/shooting.js';
import { rangeBot } from './bots/range.mjs';

// (the scene set up hot, the line at a command; helpers to choose a step and play it out)
function hot(seed = 48213, setup = 'hot') {
  const g = createGame({ scenario: 'test-handling', seed, setup });
  const s = g.state, pid = s.player.id, gunId = s.people[pid].kit.worn.sling;
  const until = (pred, max = 2000) => { for (let i = 0; i < max && !pred(); i++) g.step(1); };
  const still = () => until(() => s.stop?.phase === 'choose' && !s.stop.doing);
  const choose = (step, extra = {}) => { g.step(1, { act: [stepAct(step, extra.tempo)] }); still(); };
  return { g, s, pid, gunId, gun: s.items[gunId], R: s.armoury.range, until, still, choose };
}
const says = (g) => g.facts('say').filter(f => f.kind === 'speech').map(f => f.text);

export default [
  {
    name: 'a bracket key (D, the code KeyD, a move key too) pressed in a lived step with the finger on is no finger fault: the feet are held in stop motion (the code review\'s: "Finger off the trigger when you move." for the key the CHANGELOG gives)',
    fn() {
      const { g, s, R, pid } = hot(48213, 'bench');
      const me = g.me(), x0 = me.x, z0 = me.z;
      g.step(1, { act: [stepAct('fire')] });
      g.step(1, { mx: 1, act: [stepAct('pick:+1')] });
      g.step(3, { mx: 1 });
      const finger = s.people[pid].kit.carry.finger;
      console.log(`      the finger ${finger}; the feet moved ${me.x !== x0 || me.z !== z0}; faults ${JSON.stringify(R.faults)}`);
      assert(finger === 'on' && me.x === x0 && me.z === z0 && !R.faults.length, JSON.stringify({ finger, faults: R.faults }));
    },
  },
  {
    name: 'after the coach\'s "Hold. There\'s a round in it." carrying on takes the round out and shows the rifle again, never firing it: no offered step reaches the function check with a round believed in (the code review\'s: "Carry on" gave an ND-1 into the berm)',
    fn() {
      const { g, s, pid, gunId, gun, R, choose } = hot();
      R.cmd = { id: 'clear', i: 12, atMs: s.clock.ms }; R.hot = false; R.phase = 'cmd';
      move(s, gun.mag, { container: pouchFor(s, pid) });
      gun.locked = true; gun.chamber = 'live'; delete gun.mode;
      gun.belief = { chamber: 'empty', locked: true };
      s.people[pid].kit.carry.posture = 'lowReady'; s.stop.aim = null;
      choose('macro:clear');
      const q1 = s.stop.queue.slice(), b1 = beliefOf(s, gunId);
      const lines = [`SHOW CLEAR halted: the belief's chamber ${b1.chamber}; carry on: ${q1.join(', ')}`];
      let guard = 0;
      while (s.stop && stepsOf(s).some(x => x.id === 'queue') && guard++ < 4) {
        const q = stepsOf(s).find(x => x.id === 'queue');
        const fc = q.subs.findIndex(x => x.id === 'functionCheck'), lb = q.subs.findIndex(x => x.id === 'lockBack');
        assert(fc < 0 || (lb >= 0 && lb < fc) || beliefOf(s, gunId).chamber === 'empty', `the queue reaches the function check with a round believed in: ${q.label}`);
        choose('queue');
        lines.push(`carried on: ${s.stop ? `the queue ${s.stop.queue.join(', ') || 'empty'}` : 'the mode left'}`);
      }
      const nd = g.facts('nd');
      lines.push(`the coach: ${says(g).slice(-2).join(' / ')}; ND facts ${nd.length}; the end ${R.end?.phase ?? 'not yet'}; the issue fired ${s.armoury.ammoIssues[0].fired}, the rifle counted ${gun.rounds ?? 0}`);
      for (const l of lines) console.log(`      ${l}`);
      assert(b1.chamber === 'live' && q1[0] === 'lockBack' && q1.includes('show') && !nd.length && says(g).at(-1)?.startsWith('Clear') && !gunField(gun, 'chamber'), JSON.stringify({ q1, nd, said: says(g) }));
    },
  },
  {
    name: 'Fire again inside the recovery of a string\'s last round is no follow-up: the bolt believed locked back on an empty magazine, it pulls nothing and calls no stoppage (the code review\'s: a double tap at Marksmanship 9 opened the "Click." reflex card)',
    fn() {
      const { g, s, gunId, still } = hot(48213);
      g.step(1, { act: [stepAct('selector:semi')] }); still();
      for (let k = 0; k < 4; k++) { g.step(1, { act: [stepAct('fire')] }); still(); }
      g.step(1, { act: [stepAct('fire')] });
      g.step(2);
      g.step(1, { act: [stepAct('fire')] });
      g.step(20);
      const b = beliefOf(s, gunId), reflex = g.facts('reflex').filter(f => f.phase === 'offer');
      console.log(`      after the last round and a tap: the belief ${b.locked ? 'locked back' : 'closed'}, chamber ${b.chamber}, stoppage ${b.stoppage ?? 'none'}; reflex cards ${reflex.length}`);
      assert(b.locked && b.chamber === 'empty' && !b.stoppage && !reflex.length, JSON.stringify({ b, reflex }));
    },
  },
  {
    name: 'a double feed is cleared by its steps: lock back keeps it seen, strip the magazine, rack, and the loose round falls clear; REMEDIAL ACTION is those steps, each rolled (the code and design reviews\': the truth kept the jam while the belief went clean, and REMEDIAL was one 5 s roll)',
    fn() {
      const state = { meta: { next: {} }, items: {}, clock: { ms: 0 } };
      const gid = newGun(state, { model: 'r7' }), mid = newMag(state, { n: 3 }), gun = state.items[gid], mag = state.items[mid];
      Object.assign(gun, { mag: mid, chamber: 'case', jam: 'double', mode: 'semi', portOpen: true }); mag.n = 2; delete mag.belief;
      gun.belief = { chamber: 'live', count: 2, stoppage: 'felt' };
      const rng = stream('review', 1), roller = fixedRoller({ weapons: 20 }), rows = [];
      let held = mag;
      for (const a of ['lockBack', 'magOut:strip', 'rack', 'rack', 'rack', 'magIn', 'charge']) {
        const r = act(rng, roller, gun, gun.mag ? state.items[gun.mag] : null, a, a === 'magIn' ? { spares: [{ id: mid, mag: held }] } : {});
        if (r.magOut) delete gun.mag;
        if (r.magIn) gun.mag = r.magIn;
        rows.push({ a, jam: gun.jam ?? '-', stoppage: gun.belief.stoppage ?? '-', ejects: r.ejects.join('+') || '-', text: r.text });
      }
      for (const r of rows) console.log(`      ${r.a.padEnd(13)} jam ${r.jam.padEnd(7)} believed ${r.stoppage.padEnd(7)} out ${r.ejects.padEnd(6)} "${r.text}"`);
      const subs = subsOf('remedial', { mag: 'in', chamber: 'case', locked: false, stoppage: 'double', model: 'r7', cocked: true });
      console.log(`      REMEDIAL ACTION's sub-steps: ${subs.join(', ')}`);
      assert(rows[0].stoppage === 'double' && rows[0].jam === 'double' && rows[2].jam === '-' && rows[2].ejects.includes('round') && gunField(gun, 'chamber') === 'live' && !gun.belief.stoppage, JSON.stringify(rows));
      assert(subs.join() === 'lockBack,magOut:strip,rack,rack,rack,magIn,charge,observe' && MACROS.remedial.subs.length === 8, subs.join());
    },
  },
  {
    name: 'REMEDIAL ACTION in the scene: each of its eight sub-steps ticked in the panel, the stripped magazine held in the hand and the same magazine back in, the stripped round thrown (seed 48213\'s double)',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 }), s = g.state, bot = rangeBot();
      let rem = null;
      const subs = [];
      for (let t = 0; t < 6000 && !g.me().bot?.done; t++) {
        g.step(1, bot);
        const d = s.stop?.doing;
        if (d?.step === 'macro:remedial') rem = { list: d.list.slice(), magIn: s.items[s.items[s.stop.gun].mag] ? s.items[s.stop.gun].mag : null };
      }
      for (const [type, f] of g.bus.events) if (type === 'step' && f.step === 'macro:remedial' && f.phase === 'sub') subs.push(`${f.action} ${f.toMs - f.fromMs} ms`);
      const thrown = s.armoury.range.brass.filter(b => b.kind === 'round').length;
      console.log(`      ${subs.join(' · ')}; rounds thrown ${thrown}; the end ${s.armoury.range.end?.phase}`);
      assert(rem && rem.list.length === 8 && subs.length === 8 && thrown >= 1 && s.armoury.range.end?.phase === 'clear' && s.armoury.range.stoppage?.cleared, JSON.stringify({ rem, subs, thrown }));
    },
  },
  {
    name: 'with the hammer down the panel strikes Safe ("hammer down: charge first") and puts Charge first; LOAD and CEASE FIRE charge before the lever, UNLOAD locks back before it, and the lever\'s refusal costs no roll (the runtime review\'s: G, Enter, Charge, Off safe, Function check, LOAD halted on the lever with nothing said)',
    fn() {
      const { g, s, gunId, gun, R, choose } = hot();
      R.cmd = { id: 'load', i: 2, atMs: s.clock.ms }; R.hot = false;
      move(s, gun.mag, { container: pouchFor(s, s.player.id) });
      delete gun.chamber; delete gun.set; gun.mode = 'semi'; gun.cocked = false;
      gun.belief = { chamber: 'empty' };
      s.stop.aim = null;
      const steps = stepsOf(s), singles = steps.filter(x => x.kind === 'single'), safe = steps.find(x => x.id === 'selector:safe');
      const b = beliefOf(s, gunId);
      const load = subsOf('load', b), cease = subsOf('cease', b), unload = subsOf('unload', { ...b, mag: 'in' });
      console.log(`      singles: ${singles.slice(0, 3).map(x => `${x.id}${x.off ? ` (${x.off})` : ''}`).join(', ')}; LOAD ${load.join(', ')}; CEASE FIRE ${cease.join(', ')}; UNLOAD ${unload.join(', ')}`);
      const rolls0 = s.log.filter(e => e.kind === 'roll').length;
      const st = { meta: { next: {} }, items: {}, clock: { ms: 0 } }, gid = newGun(st, { model: 'r7' }), dead = st.items[gid];
      dead.mode = 'semi'; dead.cocked = false;
      const r = act(stream('review', 2), fixedRoller({ weapons: 10 }), dead, null, 'selector:safe', {});
      console.log(`      the lever on a dead hammer: refused ${r.refused}, ${r.ms} ms, roll ${r.roll ? 'yes' : 'none'}: "${r.text}"`);
      choose('macro:load');
      const loaded = s.log.filter(e => e.kind === 'roll').length - rolls0;
      console.log(`      LOAD played: ${loaded} rolls, the gun ${gunField(gun, 'mode')} with a magazine ${gun.mag ? 'in' : 'out'}, the hammer ${gunField(gun, 'cocked') ? 'cocked' : 'down'}`);
      assert(singles[0]?.id === 'charge' && safe?.off === 'hammer down: charge first', JSON.stringify(singles.map(x => [x.id, x.off])));
      assert(load[0] === 'charge' && load[1] === 'selector:safe' && cease.join() === 'finger,charge,selector:safe' && unload.indexOf('lockBack') < unload.indexOf('selector:safe'), JSON.stringify({ load, cease, unload }));
      assert(r.refused && r.ms === 0 && !r.roll && r.blocked, JSON.stringify(r));
      assert(gunField(gun, 'mode') === 'safe' && gun.mag && gunField(gun, 'cocked'), JSON.stringify(gun));
    },
  },
  {
    name: 'R offers nothing on the range\'s line, at the brief, between commands, out of the mode and once the line is clear (the runtime and design reviews\': "R wait 15 min" sat out a quarter hour on the tower\'s line, unanswered)',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 }), s = g.state, bot = rangeBot();
      const seen = new Set();
      for (let t = 0; t < 6000 && !g.me().bot?.done; t++) { g.step(1, bot); const o = handOffer(s); if (o) seen.add(`${o.verb} at ${s.armoury.range.cmd?.id}`); }
      const brief = createGame({ scenario: 'test-handling', seed: 7, hour: 9 });
      console.log(`      R offered over the whole scene: ${seen.size ? [...seen].join(', ') : 'nothing'}; at the brief: ${handOffer(brief.state)?.label ?? 'nothing'}; the end ${s.armoury.range.end?.phase}`);
      assert(!seen.size && handOffer(brief.state) === null && s.armoury.range.end?.phase === 'clear', JSON.stringify([...seen]));
    },
  },
  {
    name: 'at UNLOAD, SHOW CLEAR only UNLOAD, SHOW CLEAR wears the tower\'s ◉: plain UNLOAD never shows the rifle to the coach (the runtime review\'s: both marked, the first costing 4.1 s of the pace scored)',
    fn() {
      const { s, R } = hot();
      R.cmd = { id: 'clear', i: 12, atMs: s.clock.ms }; R.hot = false; R.phase = 'cmd';
      const marked = stepsOf(s).filter(x => x.cmd).map(x => x.id);
      console.log(`      ◉ at 'clear': ${marked.join(', ')}; the commands in order: ${stepsOf(s).filter(x => x.kind === 'command').map(x => x.id).join(', ')}`);
      assert(marked.join() === 'macro:clear' && stepsOf(s).filter(x => x.kind === 'command')[0].id === 'macro:clear', JSON.stringify(marked));
    },
  },
  {
    name: 'a negligent discharge is counted in the issue and its case flies and lies as a shot\'s does: the issue\'s fired matches the rounds the rifle counted (the code review\'s: 1 round counted, 0 of 15 fired, no brass)',
    fn() {
      const { s, pid, gun, R, choose } = hot();
      R.cmd = { id: 'clear', i: 12, atMs: s.clock.ms }; R.hot = false; R.phase = 'cmd';
      // (a round left in that a bad inspection missed: the chamber believed empty, the bolt home, off safe, so the
      // function check the panel offers fires it)
      move(s, gun.mag, { container: pouchFor(s, pid) });
      gun.chamber = 'live'; gun.mode = 'semi'; delete gun.locked;
      gun.belief = { chamber: 'empty' };
      s.people[pid].kit.carry.posture = 'lowReady'; s.stop.aim = null;
      const brass0 = R.brass.length, issue = s.armoury.ammoIssues.find(a => a.id === R.issueId), fired0 = issue.fired, rounds0 = gun.rounds ?? 0;
      choose('functionCheck');
      console.log(`      the rifle counted ${(gun.rounds ?? 0) - rounds0} round, the issue fired ${issue.fired - fired0}, cases thrown ${R.brass.filter(b => b.kind === 'case').length - R.brass.slice(0, brass0).filter(b => b.kind === 'case').length}; the end ${R.end?.phase} (${R.end?.why})`);
      assert(R.end?.why === 'nd' && (gun.rounds ?? 0) - rounds0 === 1 && issue.fired - fired0 === 1 && R.brass.length > brass0 && R.brass.at(-1).kind === 'case', JSON.stringify({ end: R.end, rounds: gun.rounds, fired: issue.fired, brass: R.brass.slice(brass0) }));
    },
  },
  {
    name: 'Sling it ends the mode (the build sheet §2.1: "to slung front; ends the mode"; the code review\'s: it left you in stop motion with a slung rifle)',
    fn() {
      const { s, pid, choose, g } = hot();
      choose('stow');
      for (let i = 0; i < 60 && s.stop; i++) g.step(1);
      console.log(`      after Sling it: the mode ${s.stop ? s.stop.mode : 'left'}, the rifle ${s.people[pid].kit.carry.posture}`);
      assert(!s.stop && s.people[pid].kit.carry.posture === 'slungFront', JSON.stringify({ stop: s.stop, carry: s.people[pid].kit.carry }));
    },
  },
  {
    name: 'the thumb\'s work keeps the held aim: Off safe after the aim leaves its hold running, a magazine change resets it (tradecraft\'s list; the parity review\'s: every step had reset it)',
    fn() {
      const { s, choose } = hot();
      const settled0 = s.stop.aim.settledMs;
      choose('selector:semi');
      const keep = s.stop.aim?.settledMs === settled0;
      console.log(`      HANDS_OFF: ${[...HANDS_OFF].join(', ')}; Off safe kept the aim's settle at +${(s.stop.aim.settledMs - settled0)} ms`);
      assert(keep && !HANDS_OFF.has('selector:semi') && !HANDS_OFF.has('port') && !HANDS_OFF.has('observe') && HANDS_OFF.has('magIn') && HANDS_OFF.has('charge'), JSON.stringify({ settled0, now: s.stop.aim }));
    },
  },
  {
    name: 'on the line with the rifle in hand the walking keys move you without turning you, the muzzle held downrange: taps of S, Z and Q draw no fault and never stop the line; slung, they turn you (the design review\'s: a tap of S was a muzzle fault, a tap of Q stopped the line uprange)',
    fn() {
      const { g, s, R, pid } = hot(7);
      g.step(1, { act: [stepAct('leave')] });
      g.step(1, {});
      s.people[pid].kit.carry.posture = 'lowReady';
      delete g.me().stance;
      const faces = [];
      for (const [mx, mz] of [[0, 1], [0, -1], [-1, 0], [0, 1]]) { for (let t = 0; t < 3; t++) g.step(1, { mx, mz }); g.step(4, {}); faces.push(g.me().face); }
      const inHand = { faces: faces.slice(), faults: R.faults.map(f => `${f.rule} ${f.kind}`), end: R.end?.phase ?? null };
      s.people[pid].kit.carry.posture = 'slungFront';
      g.step(2, { mx: 0, mz: 1 });
      console.log(`      the rifle at low ready, S, Z, Q, S tapped: facing ${inHand.faces.join(', ')}; faults ${inHand.faults.join(', ') || 'none'}; the line ${inHand.end ?? 'open'}; slung, S: facing ${g.me().face}`);
      assert(inHand.faces.every(f => f === 'right') && !inHand.faults.some(f => /muzzle|uprange/.test(f)) && !inHand.end && g.me().face === 'down', JSON.stringify(inHand));
    },
  },
  {
    name: 'everything thrown out of the port lands with a sound: the shots\' cases and the steps\' (the double\'s case and its stripped round) each carried in a fact with its landing, one for every case on the ground (the runtime review\'s: 14 reports, 13 ticks)',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 }), s = g.state, bot = rangeBot();
      for (let t = 0; t < 6000 && !g.me().bot?.done; t++) g.step(1, bot);
      const fromShots = g.facts('shot').filter(f => f.brass).length, fromSteps = g.facts('step').flatMap(f => f.brass ?? []);
      const R = s.armoury.range, reports = g.facts('shot').filter(f => f.fired).length;
      console.log(`      ${reports} reports; landings told: ${fromShots} from shots, ${fromSteps.length} from steps (${fromSteps.map(b => b.kind).join(', ')}); on the ground ${R.brass.length}`);
      assert(fromShots + fromSteps.length === R.brass.length && fromShots + fromSteps.length >= reports && fromSteps.every(b => Number.isFinite(b.landMs)), JSON.stringify({ fromShots, fromSteps, brass: R.brass.length }));
    },
  },
  {
    name: 'J leaves a hidden roll out (a bad inspection: no trace), gives each handling roll its words with the sum under them, shows the coach\'s look as what he found with no number ("a round in it" when he holds it), and keeps a whole scene newest first (the parity review\'s)',
    fn() {
      const { g, s, pid, gunId, gun, R } = hot();
      move(s, gun.mag, { container: pouchFor(s, pid) });
      gun.locked = true; gun.chamber = 'live'; delete gun.mode;
      gun.belief = { chamber: 'empty', locked: true };
      s.people[pid].kit.carry.posture = 'lowReady';
      const seq0 = s.log.at(-1)?.seq ?? 0;
      const bad = doAction(s, g.bus, { pid, gunId, action: 'inspect', force: { inspect: 'bad' } });
      const look = doAction(s, g.bus, { pid, gunId, action: 'observe' });
      const show = doAction(s, g.bus, { pid, gunId, action: 'show', observerId: R.coachId, force: { show: 'pass' } });
      const lines = logLines(s), mine = lines.filter(l => l.seq > seq0);
      const showLine = rollLine(s.log.filter(e => e.step === 'show').at(-1));
      console.log(`      a bad inspection (silent ${bad.silent}): ${mine.some(l => /^Look in the chamber/.test(l.roll?.short ?? '')) ? 'IN J' : 'not in J'}; J's newest lines: ${mine.slice(0, 3).map(l => `"${l.text}"${l.sub ? ` / ${l.sub}` : ''}`).join(' | ')}`);
      console.log(`      the coach's look: "${showLine.short}"; J holds ${LOG_CARD_LINES} lines, newest first: ${lines[0].seq > lines.at(-1).seq}`);
      assert(bad.silent && !mine.some(l => /Look in the chamber/.test(l.roll?.short ?? '')), JSON.stringify(mine));
      assert(mine.some(l => l.sub && /^Look at the port: Weapon handling/.test(l.sub) && l.text === look.text), JSON.stringify(mine));
      assert(/looks in the chamber: a round in it\.$/.test(showLine.short) && !/\d/.test(showLine.short.replace(/^\S+ \S+ /, '')) && show.observed.said.startsWith('Hold'), showLine.short);
      assert(LOG_CARD_LINES >= 200 && lines[0].seq > lines.at(-1).seq, JSON.stringify({ first: lines[0].seq, last: lines.at(-1).seq }));
    },
  },
  {
    name: 'on a card the plaque\'s figure is the chance of a hole (the edge ring\'s margin −3 or better), and a 2 on the edge takes the tone of a hole whether its margin is −1 or 0 (the parity review\'s: 85% on the plaque, 94.9% of rounds on the paper)',
    fn() {
      const { s, pid } = hot();
      const card = targetsOf(s, pid).find(t => t.key === `paper:${s.armoury.range.lane}`);
      const pl = plaqueOf(s, pid, { target: card });
      console.log(`      prone, just aimed: the plaque ${pl.oddsText} on the paper; the roll's pass at DC ${pl.dc} ${Math.round(pl.rollOdds * 100)}%`);
      assert(pl.odds > pl.rollOdds || pl.odds === 0.95, JSON.stringify(pl));
    },
  },
  {
    name: 'the first frame after a tapped Fire draws the flash whole: the arms\' effects on the positions\' time between the last two ticks, the flash two ticks long, its star over the head 9 × 5 then 5 × 3 (the runtime review\'s: 0.29 at the first frame drawn, gone by the second)',
    fn() {
      const { g, s } = hot(48213, 'bench');
      g.step(1, { act: [stepAct('fire')] });
      const me = g.me(), ms = s.clock.ms, shot = s.armoury.range.shots.at(-1).atMs;
      const rows = [0, 0.33, 0.67, 1].map(k => ({ k, before: gunLook(s, me, ms + k * 50).flash, now: gunLook(s, me, fxMsOf(ms, k)).flash, star: flashPixels(rangeLook(s, fxMsOf(ms, k)).fire, fxMsOf(ms, k)).length }));
      console.log(`      the clock ${ms - shot} ms past the shot; FLASH_MS ${FLASH_MS}; by the frame's alpha: ${rows.map(r => `${r.k}: ${r.before} → ${r.now} (star ${r.star} px)`).join(', ')}`);
      assert(rows[0].now >= 0.9 && rows[0].before <= 0.5 && rows[0].star >= 15 && rows[3].now > 0 && FLASH_MS >= 100, JSON.stringify(rows));
    },
  },
  {
    name: 'Charge is offered to chamber a round, to empty a chamber with no magazine, to clear a stoppage or to cock a dead hammer, never with a round believed in and a magazine behind it (tradecraft\'s rule; the parity review\'s: "7 Charge" on the first page at every commence fire)',
    fn() {
      const { s, pid, gunId } = hot();
      const atFire = canDo(s, pid, gunId);
      const g2 = hot(7), gun2 = g2.gun;
      g2.s.items[g2.gunId].belief = { chamber: 'empty', count: 4 }; delete gun2.chamber;
      const empty = canDo(g2.s, g2.pid, g2.gunId);
      console.log(`      at commence fire (one in, a magazine in): ${atFire.join(', ')}; chamber empty, a magazine believed to hold 4: ${empty.includes('charge') ? 'charge offered' : 'no charge'}`);
      assert(!atFire.includes('charge') && empty.includes('charge'), JSON.stringify({ atFire, empty }));
    },
  },
];
