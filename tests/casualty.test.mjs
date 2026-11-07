// casualty: the range's casualty as an outcome (src/sim/body/wounds.js careOf, casualtyOutcome, casualtyLine; BODY §27;
// WEAPONS §6.6; the build sheet 0.0.7 §2.3's casualty on the line, §5.2, §8 item 15). 1,000 rounds into people on the
// line, by part (legs, torso, head, arms; w from the R-7's 1.42 at 300 m to 1.61 at the muzzle), each through applyHit;
// the corpsman's care at 60 s (careOf: a limb's tourniquet, the rest pressed and dressed), his CARE_EDGE_S 20 s beside
// them, then EVAC_MIN 12 minutes to the aid station (casualtyOutcome): the shares stabilised, evacuated and dead by part,
// and the minutes to each. The same wounds untreated: how long a limb's artery takes to collapse. And the player's own outcome
// in the card's words. Asserts: a tourniqueted limb never dies on the way; an untreated artery collapses in 3 to 6
// minutes; the card's lines as the sheet gives them.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { MIN_MS, SEC_MS } from '../src/core/clock.js';
import * as W from '../src/sim/body/wounds.js';

const N = 1000, PARTS = ['legs', 'torso', 'head', 'arms'], CARE_MS = 60 * SEC_MS;

export default [
  {
    name: '1,000 wounds by part with the corpsman\'s care at 60 s: stabilised, evacuated and dead shares and times; a tourniqueted limb never dies on the way; an untreated limb artery collapses in 3 to 6 minutes',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 }), s = g.state, t0 = s.clock.ms;
      const pid = Object.keys(s.people).find(id => id !== s.player.id), snap = JSON.stringify(s.people[pid].body);
      const by = Object.fromEntries(PARTS.map(p => [p, { n: 0, stabilised: [], evacuated: [], dead: [], limbDead: 0, arteries: [] }]));
      for (let k = 0; k < N; k++) {
        s.people[pid].body = JSON.parse(snap);
        const part = PARTS[k % PARTS.length], w = 1.42 + 0.19 * ((k * 7919) % 1000) / 1000;
        const hit = W.applyHit(s, null, { onId: pid, part, w, margin: (k * 31) % 12, shotId: `cas${k}`, through: true, atMs: t0 });
        const rec = s.people[pid].body, B = by[part];
        B.n++;
        // (untreated: an artery's collapse)
        // (an artery alone, a limb's: the head's comes with what the skull's round does besides)
        if (rec.injuries?.some(i => i.artery && i.part !== 'head')) { const c = W.bloodCurve(rec, t0 + 3600000).collapseMs; if (c !== null) B.arteries.push((c - t0) / MIN_MS); }
        W.careOf(rec, t0 + CARE_MS);
        const out = W.casualtyOutcome(rec, { fromMs: t0 + CARE_MS + W.CARE_EDGE_S * SEC_MS });
        B[out.outcome].push((out.atMs - t0) / MIN_MS);
        if (out.outcome === 'dead' && (hit.part.startsWith('leg') || hit.part.startsWith('arm'))) B.limbDead++;
      }
      const pc = (a, n) => `${fmt(a.length / n * 100, 1)}%`, mean = (a) => (a.length ? fmt(a.reduce((x, y) => x + y, 0) / a.length, 1) : '-');
      console.log('      part   n    stabilised      evacuated        dead             (mean minutes from the hit)   untreated arteries: collapse min (n, range)');
      const art = [];
      for (const [part, B] of Object.entries(by)) {
        art.push(...B.arteries);
        console.log(`      ${part.padEnd(6)} ${String(B.n).padEnd(4)} ${pc(B.stabilised, B.n).padStart(6)} @ ${mean(B.stabilised).padStart(4)}   ${pc(B.evacuated, B.n).padStart(6)} @ ${mean(B.evacuated).padStart(4)}   ${pc(B.dead, B.n).padStart(6)} @ ${mean(B.dead).padStart(4)}                                 ${B.arteries.length ? `${B.arteries.length}, ${fmt(Math.min(...B.arteries), 2)} to ${fmt(Math.max(...B.arteries), 2)}` : '-'}`);
      }
      const limbDead = Object.values(by).reduce((a, B) => a + B.limbDead, 0);
      assert(limbDead === 0, `a tourniqueted limb died on the way ${limbDead} times`);
      assert(art.length > 20 && art.every(m => m >= 3 && m <= 6), JSON.stringify({ n: art.length, min: Math.min(...art), max: Math.max(...art) }));
      assert(by.head.dead.length > by.head.n * 0.5 && by.legs.dead.length === 0 && by.arms.dead.length === 0, 'the head kills most, a limb under care none');
    },
  },
  {
    name: 'the card\'s lines (the sheet §2.3): "You were hit in the left foot: evacuated to the aid station"; "Pvt Okafor hit in the left thigh by a negligent discharge, evacuated"; and the player down, AVPU and words through it',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 }), s = g.state, me = s.player.id, t0 = s.clock.ms;
      const r = W.applyHit(s, g.bus, { onId: me, part: 'legs', where: 'foot', w: 1.61, margin: 0, shotId: 'nd-self', through: true, nd: true });
      const rec = s.people[me].body;
      const words = W.woundWords(rec, t0 + 5 * SEC_MS);
      W.careOf(rec, t0 + CARE_MS);
      const out = W.casualtyOutcome(rec, { fromMs: t0 + CARE_MS + W.CARE_EDGE_S * SEC_MS });
      const line = W.casualtyLine(s, me, out);
      const other = Object.keys(s.people).find(id => id !== me && s.people[id].service?.rank === 'Pvt');
      W.applyHit(s, g.bus, { onId: other, part: 'legs', w: 1.61, margin: 0, shotId: 'nd-other', through: true, nd: true });
      W.careOf(s.people[other].body, t0 + CARE_MS);
      const out2 = W.casualtyOutcome(s.people[other].body, { fromMs: t0 + CARE_MS + W.CARE_EDGE_S * SEC_MS }), line2 = W.casualtyLine(s, other, out2);
      console.log(`      you: "${r.words}" knock ${r.knockS} s; at +5 s "${words.join(' ')}"; the card: "${line}"`);
      console.log(`      a private: the card: "${line2}"`);
      assert(/^You were hit in the (left|right) foot: (evacuated to the aid station|stabilised on the line)$/.test(line), line);
      assert(new RegExp(`^Pvt ${s.people[other].name.family} hit in the (left|right) thigh by a negligent discharge, (evacuated|stabilised|dead)$`).test(line2), line2);
      assert(r.down && words.every(w => !/\d/.test(w)), JSON.stringify({ r, words }));
    },
  },
  {
    name: 'on the line the casualty lies where they fell (stance \'down\'): a squadmate shot in the thigh stays down after the knock for the corpsman; one shot in the arm and tourniqueted gets up; the player gets up only by a move key once the knock is over (BODY change 2)',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: 48213, hour: 10 }), s = g.state, me = s.player.id;
      const mates = s.actors.list.filter(a => a.who && a.who !== me).slice(0, 2);
      const thigh = W.applyHit(s, g.bus, { onId: mates[0].who, part: 'legL', w: 1.5, margin: 5, shotId: 'st1', through: true });
      const arm = W.applyHit(s, g.bus, { onId: mates[1].who, part: 'armR', w: 1.5, margin: 5, shotId: 'st2', through: true });
      const mine = W.applyHit(s, g.bus, { onId: me, part: 'armL', w: 1.5, margin: 5, shotId: 'st3', through: true });
      g.step(1);
      const at0 = [mates[0].stance, mates[1].stance, g.me().stance];
      W.careOf(s.people[mates[1].who].body, s.clock.ms);
      W.careOf(s.people[me].body, s.clock.ms);
      const knockS = Math.max(thigh.knockS, arm.knockS, mine.knockS);
      g.step(Math.ceil(knockS * 20) + 20);
      const after = [mates[0].stance ?? 'stand', mates[1].stance ?? 'stand', g.me().stance ?? 'stand'];
      g.step(2, { mx: 1 });
      const moved = g.me().stance ?? 'stand';
      console.log(`      hit: thigh knock ${thigh.knockS} s, arm ${arm.knockS} s, yours ${mine.knockS} s; at once [${at0}]; ${fmt(knockS + 1, 1)} s on, the arm and yours tourniqueted: [${after}]; your move key: ${moved}`);
      assert(at0.every(x => x === 'down') && after[0] === 'down' && after[1] === 'stand' && after[2] === 'down' && moved === 'stand', JSON.stringify({ at0, after, moved }));
      assert(!g.errors.length, JSON.stringify(g.errors.slice(0, 2)));
    },
  },
];
