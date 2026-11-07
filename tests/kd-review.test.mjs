// The reviews of v0.0.7's test-range (the code, runtime and design lenses), each finding the fixer took pinned here so it fails without its fix.
//
// What the reviewers found by reading the code and playing "The line at 300 m" by its keys at 16 px/m: a face's
// carrier height read off a field nobody wrote, so every face counted as up and a round into a face down in the pits
// scored; the relay firing its five confirm rounds 1.3 s apart, never waiting for its mark, and lying through LOAD and
// MAKE READY with its rifles slung (doAction refused every step); a player hit by a neighbour's ND among others carried
// on to declare, their wound nowhere on the card; the casualty's outcome reckoned from the hit, not the evacuation;
// the coach's dummy and an ND's chambered round lost from the issue's count; the shot's log line giving the ring and
// the true wind seconds before the pits marked it; the end card printing a rule's id ("Stopped: cold"); "A 0" for a
// hole off the rings; the relay's scores never shown.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { kdBot } from './bots/kd.mjs';
import { kdNow, forceNd, pitView } from '../src/sim/scenarios/range.js';
import { targetsOf, stepsOf, markWaitOf } from '../src/sim/arms/shooting.js';
import { faceUpAt, FACE_DOWN_UP } from '../src/sim/arms/pits.js';
import { gunnerTarget } from '../src/sim/arms/gunner.js';
import { bloodAt } from '../src/sim/body/wounds.js';
import { STOP_WORDS, stopWords } from '../src/sim/scenarios/handling.js';
import { sceneSaid, sceneLines } from '../src/ui/cards/tests.js';
import { cardFit } from '../src/ui/hud/steps.js';
import { termText } from '../src/ui/plaque.js';
import { plaqueOf } from '../src/sim/arms/shot.js';

// (a course driven by the KD bot until pred, or its end)
function drive(g, bot, pred, maxTicks = 20 * 60 * 60) {
  for (let n = 0; n < maxTicks && !pred() && !kdNow(g.state).end; n++) g.step(1, bot);
}

export default [
  {
    name: 'a round at a face down in the pits goes over it into the berm: no hole, score 0, nothing for the pits to mark; the face\'s height is the pits\' record at the shot (the code and runtime reviews\' of v0.0.7: every face counted as up, and three rounds into a lowered face scored 4, 5 and 3)',
    fn() {
      const g = createGame({ scenario: 'test-range', seed: 48213, setup: 'far' }), s = g.state, R = s.armoury.range, lane = R.kdLane, pid = s.player.id;
      const settle = (n = 400) => { for (let k = 0; k < n && s.stop?.phase !== 'choose'; k++) g.step(1); };
      settle(); g.step(1, { act: [stepAct('fire', 'normal', null)] }); settle();
      // (the pits take it down: wait in the chained wait until the face is under the parapet)
      g.step(1, { act: [stepAct('wait:mark', 'normal', null)] });
      for (let k = 0; k < 20 * 30 && faceUpAt(R, lane, s.clock.ms) >= FACE_DOWN_UP; k++) g.step(1);
      const up = faceUpAt(R, lane, s.clock.ms), T = targetsOf(s, pid).find(t => t.key === `face:${lane}`), steps = stepsOf(s);
      const fire = steps.find(x => x.id === 'fire'), wait = steps.find(x => x.id === 'wait:mark');
      console.log(`      ${fmt((s.clock.ms - R.shots[0].atMs) / 1000, 1)} s after the first shot: the pits ${JSON.stringify({ phase: pitView(R, lane, s.clock.ms).phase, up })}; the target's up ${T.up}, y ${T.y}; Fire ${fire?.warn ? `marked "! ${fire.warn}"` : 'unmarked'}; ${wait ? `"${wait.label}" offered` : 'no wait for the mark'}; the stop ${s.stop?.phase}`);
      assert(up < FACE_DOWN_UP && T.up === up, `the target's height is the pits': ${T.up} against ${up}`);
      assert(fire && !fire.off && /target is down/.test(fire.warn ?? ''), `Fire marked, not struck: ${JSON.stringify(fire)}`);
      // (fired all the same: into the berm)
      g.step(1, { act: [stepAct('fire', 'normal', null)] }); settle();
      const mine = R.shots.filter(x => x.who === pid), last = mine.at(-1);
      console.log(`      the shots: ${mine.map(x => `${x.score}${x.v ? 'V' : ''}${x.hole ? '' : ' (no hole)'}${x.berm ? ' berm' : ''}`).join(', ')}; the last marked at once ${last.marked === last.atMs}`);
      assert(mine.length >= 2 && last.hole === null && last.score === 0 && last.berm && last.marked === last.atMs, JSON.stringify(last));
      // (the relay's target the same: its face's height now, not 1)
      const G = R.relay[0], gt = gunnerTarget(s, G);
      assert(gt.up === faceUpAt(R, G.lane, s.clock.ms), `the gunner's target up ${gt.up}`);
    },
  },
  {
    name: 'slow fire waits for the mark: no relay shot in the confirm is pulled while its face is not fully up, over 8 seeds; the player\'s Fire is marked "wait for your mark" until the disk or the flag (the build sheet §2.3; the code review\'s: five rounds 1.3 s apart, the pits queueing the marks)',
    fn() {
      let pulls = 0, early = 0, waits = 0, marked = 0;
      const per = [];
      for (let seed = 1; seed <= 8; seed++) {
        const g = createGame({ scenario: 'test-range', seed, setup: 'confirm' }), s = g.state, R = s.armoury.range, bot = kdBot();
        let seen = 0, sawWarn = false;
        for (let n = 0; n < 20 * 60 * 8 && kdNow(s).cmd !== 'clear' && !kdNow(s).end; n++) {
          g.step(1, bot);
          for (const [type, d] of g.bus.events.slice(seen)) {
            if (type !== 'shot' || !d.fired || d.who === s.player.id || !d.face || d.face.line !== 300) continue;
            pulls++;
            const up = faceUpAt(R, d.lane, d.atMs);
            if (up < 1) early++;
          }
          seen = g.bus.events.length;
          if (s.stop?.phase === 'choose' && markWaitOf(s, s.player.id, s.stop.aim ? targetsOf(s, s.player.id).find(t => t.key === s.stop.aim.key) : null)) sawWarn = true;
        }
        const G = R.relay.map(x => x.shots);
        per.push(`${seed}: ${G.join('/')}`);
        if (sawWarn) waits++;
        marked += R.shots.filter(x => x.string === 'confirm' && x.who !== s.player.id && x.marked).length;
      }
      console.log(`      ${pulls} relay pulls at 300 m over 8 seeds, ${early} with the face not fully up; ${marked} marked; the player's Fire waited for the mark on ${waits} of 8; shots by gunner: ${per.join('; ')}`);
      assert(pulls >= 150 && early === 0, `${early} of ${pulls} relay pulls before the face was up`);
      assert(waits === 8, `the wait for the mark on ${waits} seeds`);
    },
  },
  {
    name: 'the relay brings its rifles up at LOAD: by MAKE READY every gunner on the 300 m line holds its rifle at low ready with a magazine in, by COMMENCE FIRE a round chambered (the runtime review\'s of v0.0.7: all five lay with the rifle slung, doAction refusing each step)',
    fn() {
      const g = createGame({ scenario: 'test-range', seed: 48213, setup: 'confirm' }), s = g.state, R = s.armoury.range, bot = kdBot(), at = {};
      for (let n = 0; n < 20 * 300 && kdNow(s).cmd !== 'cease'; n++) {
        g.step(1, bot);
        const c = kdNow(s).cmd;
        if ((c === 'ready' || c === 'fire') && !at[c]) at[c] = R.relay.map(G => ({ posture: s.people[G.pid].kit.carry.posture, mag: !!s.items[G.gunId].mag, chamber: s.items[G.gunId].chamber ?? null }));
      }
      console.log(`      at MAKE READY: ${at.ready.map(x => `${x.posture}${x.mag ? '+mag' : ''}`).join(', ')}; at COMMENCE FIRE: ${at.fire.map(x => `${x.posture}${x.mag ? '+mag' : ''}${x.chamber ? `+${x.chamber}` : ''}`).join(', ')}`);
      assert(at.ready.every(x => x.posture !== 'slungFront' && x.mag), JSON.stringify(at.ready));
      assert(at.fire.every(x => x.mag && x.chamber === 'live'), JSON.stringify(at.fire));
    },
  },
  {
    name: 'a gunner\'s ND whose round passes through others and then the player makes the player the casualty of record: the scene ends closed with the player\'s wound on the card, the others counted (the code review\'s of v0.0.7: seed 99, shot in the chest as the fourth of five, they declared and the card read "Clear")',
    fn() {
      const g = createGame({ scenario: 'test-range', seed: 99, setup: 'confirm' }), s = g.state, R = s.armoury.range, bot = kdBot(), pid = s.player.id;
      drive(g, bot, () => kdNow(s).cmd === 'fire', 20 * 120);
      const nd = forceNd(s, g.bus, { pid: R.relay[0].pid, toward: pid });
      const order = nd.hits.map(h => (h.onId === pid ? 'you' : h.onId));
      drive(g, bot, () => false, 20 * 60 * 40);
      const K = kdNow(s), lines = sceneLines({ course: 'kd', summary: K.summary, end: K.end }, K);
      console.log(`      the round through ${order.join(', ')} (${nd.grade}); the casualty of record ${R.casualty.who === pid ? 'you' : R.casualty.who}; the end ${JSON.stringify(K.end)}; the card: ${lines.join(' | ')}`);
      assert(order.includes('you') && order[0] !== 'you', `the player not first on the line: ${order}`);
      assert(R.casualty.who === pid && K.end?.phase === 'closed' && K.end.why === 'casualty', JSON.stringify(K.end));
      assert(/You were hit in/.test(K.incident ?? '') && /more hit by the same round/.test(K.incident), K.incident);
    },
  },
  {
    name: 'the casualty\'s outcome is reckoned from the evacuation\'s start and the card\'s blood is the body\'s at the splash\'s end, on seeds 48213, 7 and 2 (the code review\'s of v0.0.7: from the hit, the card said 95.01% where the body read 97.72%)',
    fn() {
      const rows = [];
      for (const seed of [48213, 7, 2]) {
        const g = createGame({ scenario: 'test-range', seed, setup: 'confirm' }), s = g.state, R = s.armoury.range, bot = kdBot();
        drive(g, bot, () => kdNow(s).cmd === 'fire', 20 * 120);
        forceNd(s, g.bus, { toward: R.relay[0].pid });
        drive(g, bot, () => R.casualty?.phase === 'outcome', 20 * 60 * 30);
        const C = R.casualty, body = s.people[C.who].body, live = body.dead ? null : Math.round(bloodAt(body, s.clock.ms) * 100) / 100;
        rows.push(`${seed} ${C.part}: ${C.outcome} ${C.bloodPct}% (the body ${live ?? 'dead'}), evacuated ${fmt((C.evacAtMs - C.atMs) / 1000, 1)} s after the hit`);
        assert(Number.isFinite(C.evacAtMs) && C.evacAtMs > C.atMs, JSON.stringify(C));
        if (live !== null) assert(Math.abs(C.bloodPct - live) < 0.02, `the card ${C.bloodPct}, the body ${live}`);
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'every round of an issue is accounted for at the card: n = fired + back, the coach\'s dummy counted apart, on seeds 48213, 7 and 99 and through the player\'s own ND casualty (the code review\'s of v0.0.7: n 10, fired 9, back 0)',
    fn() {
      const out = [];
      for (const seed of [48213, 7, 99]) {
        const g = createGame({ scenario: 'test-range', seed }), s = g.state, bot = kdBot(), pid = s.player.id;
        drive(g, bot, () => false);
        const issues = s.armoury.ammoIssues.filter(a => a.toId === pid);
        out.push(`${seed}: ${issues.map(a => `${a.line} m n ${a.n}${a.dummy ? ' + the dummy' : ''}, fired ${a.fired}, back ${a.back ?? 0}`).join('; ')}`);
        for (const a of issues) assert(a.n === (a.fired ?? 0) + (a.back ?? 0), `${seed} ${a.id}: ${JSON.stringify(a)}`);
        assert(issues.some(a => a.dummy === 1), `${seed}: the dummy rode somewhere`);
      }
      // (the player's own ND into a neighbour: the round it chambered after it fired goes back with the rest)
      const g = createGame({ scenario: 'test-range', seed: 48213, setup: 'confirm' }), s = g.state, R = s.armoury.range, bot = kdBot(), pid = s.player.id;
      drive(g, bot, () => kdNow(s).cmd === 'fire' && s.items[s.people[pid].kit.worn.sling].chamber === 'live', 20 * 300);
      forceNd(s, g.bus, { toward: R.relay[0].pid });
      drive(g, bot, () => false, 20 * 60 * 60);
      const issues = s.armoury.ammoIssues.filter(a => a.toId === pid && a.line === 300);
      out.push(`the ND at 300 m: ${issues.map(a => `n ${a.n}, fired ${a.fired}, back ${a.back ?? 0}`).join('; ')}; the end ${JSON.stringify(kdNow(s).end)}`);
      for (const a of issues) assert(a.n === (a.fired ?? 0) + (a.back ?? 0), `the ND: ${JSON.stringify(a)}`);
      for (const l of out) console.log(`      ${l}`);
    },
  },
  {
    name: 'on a KD face the shot\'s log line gives the roll and the shooter\'s own terms, never the ring nor the true wind; the coach reads the rapid string whole and calls a hole off the rings "Off the rings" (the reviews of v0.0.7)',
    fn() {
      const g = createGame({ scenario: 'test-range', seed: 48213 }), s = g.state, bot = kdBot(), pid = s.player.id;
      drive(g, bot, () => false);
      const rolls = s.log.filter(e => e.kind === 'roll' && e.who === pid && /Marksmanship/.test(e.text ?? '') && /wind/.test(e.text ?? ''));
      const says = g.bus.events.filter(([t, d]) => t === 'say' && d.who === s.armoury.range.coachId).map(([, d]) => d.text);
      const rapid = says.filter(t => /on the paper[:,]/.test(t)), zero = says.filter(t => /\bA 0\b|Marked a 0/.test(t));
      console.log(`      ${rolls.length} shot lines at distance, e.g. "${rolls[0]?.text}"; the coach on the 200 m string: "${rapid.at(-1)}"`);
      assert(rolls.length >= 5 && rolls.every(e => !/\d\.\d m\/s|\ba [0-5V]\b|dead centre|o'clock/.test(e.text)), rolls.map(e => e.text).join(' | '));
      assert(rapid.length === 1 && zero.length === 0, JSON.stringify({ rapid, zero }));
    },
  },
  {
    name: 'the end card says a stop\'s rule in words, as its toast does, never its id; one map for both (the runtime review\'s of v0.0.7: "Stopped: cold · 3 faults")',
    fn() {
      const kd = sceneSaid({ course: 'kd', summary: { score: 0, of: 0, faults: 3 }, end: { phase: 'stopped', why: 'cold' } });
      const g = createGame({ scenario: 'test-range', seed: 48213, setup: 'confirm' }), s = g.state, R = s.armoury.range;
      R.end = { phase: 'stopped', atMs: s.clock.ms, why: 'person' };
      const K = kdNow(s);
      console.log(`      "${kd}"; "${K.summary}"; the words ${Object.entries(STOP_WORDS).slice(0, 4).map(([k, v]) => `${k} → ${v}`).join(', ')}, …`);
      assert(kd.startsWith('Stopped: a round on a cold line') && K.summary.startsWith('Stopped: aimed at a person'), `${kd} | ${K.summary}`);
      for (const r of ['cold', 'person', 'forward', 'nd', 'lane', 'uprange', 'walk']) assert(stopWords(r) !== r, r);
    },
  },
  {
    name: 'the end card ranks the relay with you: "Relay one: you … (nth of 6)" (the design review\'s of v0.0.7: their scores computed and never shown)',
    fn() {
      const g = createGame({ scenario: 'test-range', seed: 7 }), s = g.state, bot = kdBot();
      drive(g, bot, () => false);
      const K = kdNow(s), lines = sceneLines({ course: 'kd', summary: K.summary, end: K.end }, K);
      console.log(`      ${lines.join(' | ')}`);
      assert(/^Relay one: .*you \d+ of \d+.*\((1st|2nd|3rd|4th|5th|6th) of 6\)$/.test(K.relayLine ?? '') && lines.includes(K.relayLine), K.relayLine);
    },
  },
  {
    name: 'the weapon card fits its box at 1024 × 768 (--ui 0.85, DPR 1): drawn at the box\'s scale, smooth, where a whole device pixel would be cut; whole pixels where they fit (the runtime review\'s of v0.0.7); the coach\'s call on the plate in whole m/s as he said it',
    fn() {
      const cases = [[0.85, 1], [1, 1], [1.244, 1], [0.85, 2], [1.244, 2]].map(([ui, dpr]) => ({ ui, dpr, ...cardFit(ui, dpr) }));
      console.log(`      ${cases.map(c => `--ui ${c.ui} DPR ${c.dpr}: ${fmt(c.k, 3)}${c.smooth ? ' smooth' : ''} (${fmt(180 * c.k, 0)} of ${fmt(180 * c.ui, 0)} px)`).join('; ')}`);
      for (const c of cases) assert(180 * c.k <= 180 * c.ui + 1e-6 && 148 * c.k <= 148 * c.ui + 1e-6, JSON.stringify(c));
      assert(cases[0].smooth && !cases[1].smooth && !cases[3].smooth, 'smooth only where a whole pixel is too big');
      // (the plaque's headline: a five or a V on a face at distance, the paper on the zero card at 25 m)
      const g = createGame({ scenario: 'test-range', seed: 48213 }), s = g.state, pid = s.player.id, gunId = s.people[pid].kit.worn.sling;
      const card = targetsOf(s, pid).find(t => t.key === `paper:${s.armoury.range.lane}`), pc = plaqueOf(s, pid, { target: card, gunId });
      const f = createGame({ scenario: 'test-range', seed: 48213, setup: 'far' }), fs = f.state, face = targetsOf(fs, fs.player.id).find(t => t.key === `face:${fs.armoury.range.kdLane}`), pf = plaqueOf(fs, fs.player.id, { target: face });
      console.log(`      the zero card: ${pc.part} ${pc.oddsText}; the face at 300 m: ${pf.part} ${pf.oddsText} (on the paper ${fmt(pf.kd.scoreOdds * 100, 0)}%)`);
      assert(pc.part === 'PAPER' && pf.part === 'FIVE' && Math.abs(pf.odds - pf.kd.fiveOdds) < 1e-9, `${pc.part} ${pf.part}`);
      const call = termText({ key: 'wind', v: 2.6, by: 'coach' }), read = termText({ key: 'wind', v: 2.6, by: 'read' });
      console.log(`      the wind on the plate: the coach's call "${call}", your read "${read}"`);
      assert(call === '3 M/S >' && read === '2.6 M/S >', `${call} | ${read}`);
    },
  },
];
