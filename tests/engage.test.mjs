// OLYMPUS tests: what you engage and how you saw it (src/sim/arms/engage.js), and the hit card's marks in the shoot house
// (src/sim/arms/marks.js hitMarks' house branch); the build sheet 0.0.18 §2.2, §5.2. The user, 2026-11-15: "we need to generalize
// that target view for every time we're engaging something or someone", under their rule "we only know what we know": the view
// shows a stand as your take-in identified it, never as its record holds; "Bang" (scored 100 on 2026-11-15) keeps its cards,
// pinned against stage C0's run of v0.0.17's own code.
import { assert } from './helpers.mjs';
import { goldenDigest } from './golden.mjs';
import { createGame } from './game.mjs';
import { houseBot, runHouse } from './bots/house.mjs';
import { stressBot } from './bots/stress.mjs';
import { engagedOf, struckLast, seenFace, ENGAGE_WHY } from '../src/sim/arms/engage.js';
import { hitMarks } from '../src/sim/arms/marks.js';
import { houseLook } from '../src/sim/scenarios/shoothouse.js';
import { createTargetView, targetModel } from '../src/ui/hud/target.js';
import { paintHitcard, cardDigest } from '../src/art/doll/hitcard.js';
import { pairsNow } from '../src/sim/scenarios/pairs.js';
import { playerActor } from '../src/core/ids.js';

const house = (tier = 'tierone', seed = 48213) => createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' });
const meAt = (s) => { const a = playerActor(s); return a ? { x: a.x, z: a.z } : null; };
// (a tier one's lane by T's bundles, each(game) after each tick)
function lane(each = null, { tier = 'tierone', seed = 48213 } = {}) {
  const g = house(tier, seed), r = runHouse(g, houseBot({ mode: 'T' }), { each });
  return { g, r };
}
/** Stage C0 (v0.0.17's code, before any edit): "Bang" on seed 48213 by the boot recruit's stress bot, the card hitHud chose at every change (time aside), its sequence's digest, and each rifle card's digest in order. */
const BANG_C0 = Object.freeze({ ticks: 2849, changes: 25, seq: '1f26ec67b6fba6', rifleCards: ['2a1045f5', '3b8bb122', '497e5f37', 'c8e7eddd', '5fa6bbdf', '7c9ed866', 'ff0af5c5', '5dbb5314', '3f6264a4', '6de26fad', '2f1d1ddc', 'b5458c50', '3b7a9be2', '78a04297', '40ffd99a', 'be93c043', 'b035419b', '49e7ca8f'] });

export default [
  {
    name: 'what you engage, in order: the target of the row under way, the one aimed at, the one bracketed at a pause, then the one your last round struck; a stand turning before your take-in opens nothing',
    fn() {
      const g = house(), s = g.state, R = s.armoury.range, pid = s.player.id, [a, b, c] = R.turners;
      const two = s.actors.list.find(x => x.who === R.house.two.pid);
      s.stop = { mode: 'stop', who: pid, gun: s.people[pid].kit.worn.sling, phase: 'choose', pick: c.key, aim: { key: b.key, settledMs: s.clock.ms }, doing: { target: a.key }, queue: [], reflex: null, keep: {} };
      // (each stand turned and taken in, so the bracket counts)
      for (const T of [a, b, c]) T.turnAtMs = s.clock.ms - 1000;
      s.mind = { ...(s.mind ?? {}), contact: { n: 1, known: {}, pending: null, last: { id: 'k1', ids: [a.key, b.key, c.key], seenMs: s.clock.ms - 500, atMs: s.clock.ms, ident: {}, armour: {} } } };
      const order = [];
      order.push(engagedOf(s)); s.stop.doing = null;
      order.push(engagedOf(s)); s.stop.aim = null;
      order.push(engagedOf(s));
      console.log(`      ${order.map(o => `${o.why} ${o.key}`).join(', ')}; ENGAGE_WHY ${ENGAGE_WHY.join(', ')}`);
      assert(order.map(o => o.why).join() === ENGAGE_WHY.join() && order.map(o => o.key).join() === [a.key, b.key, c.key].join(), JSON.stringify(order));
      // (out of stop motion the bracket is not an engagement)
      s.stop.mode = 'live';
      assert(engagedOf(s) === null, 'no bracket out of stop motion');
      s.stop.mode = 'stop';
      // (a stand turned since the take-in: the bracket alone opens nothing)
      c.turnAtMs = s.clock.ms;
      assert(engagedOf(s) === null, 'a stand turning before your take-in opens nothing');
      // (a man: your #2 aimed at)
      s.stop.aim = { key: two.id, settledMs: s.clock.ms };
      const m = engagedOf(s);
      assert(m.kind === 'person' && m.who === R.house.two.pid && m.why === 'aim', JSON.stringify(m));
      // (your last round that struck: struckLast, from the records)
      assert(struckLast(s) === null, 'nothing struck yet');
      R.shots.push({ id: 'i9001', atMs: s.clock.ms, key: a.key, part: 'torso' }); a.hits.push({ shotId: 'i9001', part: 'torso', zone: 'A', at: [1, 2], atMs: s.clock.ms, by: 'me' });
      assert(JSON.stringify(struckLast(s)) === JSON.stringify({ key: a.key, atMs: s.clock.ms }), JSON.stringify(struckLast(s)));
    },
  },
  {
    name: 'the target view shows a stand as your take-in identified it, never as its record holds: 2b\'s phone only once identified, hands not seen before; a failed look keeps the last good one; the card and the stage\'s houseLook agree',
    fn() {
      const rows = [];
      let leaks = 0, disagree = 0, n = 0;
      const { g } = lane((game) => {
        const s = game.state, R = s.armoury.range, look = houseLook(s);
        for (const T of R.turners) {
          const sf = seenFace(s, T.key), st = look.stands.find(x => x.key === T.key);
          n++;
          // (the stage's holds and the card's agree; a told holds is the take-in's or the #2's, never read from the stand's record alone)
          if ((st.holds ?? 'unseen') !== sf.holds) disagree++;
          const last = s.mind?.contact?.last, told = [last?.ident?.[T.key], R.house.two.ident?.[T.key]];
          if (sf.holds !== 'unseen' && !told.includes(sf.holds)) leaks++;
          if (T.stand === '2b') { const r = `${T.stand} ${sf.face}/${sf.holds}`; if (rows.at(-1)?.split(' @')[0] !== r) rows.push(`${r} @${s.clock.ms - R.house.goAtMs} ms`); }
        }
      });
      console.log(`      2b (a no-shoot with a phone) as seen: ${rows.join('; ')}; ${n} readings, ${disagree} unlike the stage, ${leaks} told by the record alone`);
      assert(leaks === 0 && disagree === 0, JSON.stringify({ leaks, disagree }));
      assert(rows[0]?.startsWith('2b unknown/unseen') && rows.some(r => r.startsWith('2b noshoot/phone')), rows.join('; '));
      // (the stand's record moved, the identification not: the view follows the identification)
      const s = g.state, T = s.armoury.range.turners.find(t => t.stand === '2b'), before = seenFace(s, T.key);
      T.holds = 'rifle';
      assert(JSON.stringify(seenFace(s, T.key)) === JSON.stringify(before), 'the record moved the view');
      // (a failed look keeps the last good one: the view's memory across the take-in's one contact)
      const view = createTargetView({ card: { update: () => '', text: '' }, readers: { marksOf: (st, key, k, ph) => hitMarks(st, key, { k, phase: ph }), meAt } });
      const g2 = house(), s2 = g2.state, T2 = s2.armoury.range.turners[0];
      T2.turnAtMs = s2.clock.ms - 1000;
      s2.mind = { ...(s2.mind ?? {}), contact: { n: 1, known: {}, pending: null, last: { id: 'k1', ids: [T2.key], seenMs: s2.clock.ms, atMs: s2.clock.ms, ident: { [T2.key]: 'rifle' }, armour: {} } } };
      const readers = { marksOf: (st, key, k, ph) => hitMarks(st, key, { k, phase: ph }), meAt, known: new Map() };
      const m1 = targetModel(s2, { key: T2.key, readers });
      s2.mind.contact.last = { id: 'k2', ids: ['turner:99'], seenMs: s2.clock.ms, atMs: s2.clock.ms, ident: {}, armour: {} };
      const m2 = targetModel(s2, { key: T2.key, readers }), m3 = targetModel(s2, { key: T2.key, readers: { ...readers, known: new Map() } });
      console.log(`      a stand identified with a rifle, then another taken in: ${m1.subject.key} → ${m2.subject.key} (with no memory: ${m3.subject.key}, "${m3.words}")`);
      assert(m1.subject.holds === 'rifle' && m2.subject.holds === 'rifle' && m3.subject.holds === 'unseen' && /HANDS NOT SEEN/.test(m3.words), JSON.stringify([m1.subject, m2.subject, m3.subject]));
      void view;
    },
  },
  {
    name: 'the house\'s marks on a stand equal its hits on a tier-one lane (seed 48213, houseBot T): your calls in belief during the lane, your holes numbered and the #2\'s apart in truth from Stop; the same after a save and load',
    fn() {
      let belief = 0, bad = 0;
      const { g, r } = lane((game) => {
        const s = game.state, R = s.armoury.range;
        if (R.end) return;
        for (const T of R.turners) {
          const hm = hitMarks(s, T.key), mine = R.shots.filter(x => x.key === T.key);
          if (!mine.length) continue;
          belief++;
          if (hm.phase !== 'belief' || hm.marks.length !== mine.length || hm.marks.some(m => m.hole !== null || m.zone !== null) || hm.face !== null || hm.holds !== null) bad++;
        }
      });
      const s = g.state, R = s.armoury.range, rows = [];
      for (const T of R.turners) {
        const hm = hitMarks(s, T.key);
        const mine = T.hits.filter(h => h.by === 'me'), twos = T.hits.filter(h => h.by === 'two');
        rows.push(`${T.stand}: ${hm ? `${hm.words} | ${hm.line} | ${hm.marks.map(m => `${m.n ?? '#2'} ${m.zone ?? 'miss'}`).join(', ')}` : 'none'}`);
        if (!hm) { assert(!mine.length && !twos.length && !R.shots.some(x => x.key === T.key), T.stand); continue; }
        assert(hm.phase === 'truth', T.stand);
        const own = hm.marks.filter(m => m.n !== null), two = hm.marks.filter(m => m.kind === 'two');
        assert(own.map(m => m.n).join() === own.map((_, i) => i + 1).join(), JSON.stringify(own));
        assert(own.filter(m => m.hole).length === mine.length && own.every(m => !m.hole || mine.some(h => h.shotId === m.shotId && h.zone === m.zone && h.at[0] === m.hole[0] && h.at[1] === m.hole[1])), `${T.stand}: ${JSON.stringify({ own, mine })}`);
        assert(two.length === twos.filter(h => h.at).length && two.every(m => m.n === null), `${T.stand}: the #2's`);
      }
      for (const row of rows) console.log(`      ${row}`);
      console.log(`      ${r.ticks} ticks; ${belief} readings in belief during the lane, ${bad} wrong`);
      assert(r.done && bad === 0 && belief > 0, JSON.stringify({ done: r.done, bad, belief }));
      assert(R.shots.every(x => x.part) && R.shots.some(x => x.row === 'shot:pair'), 'R.shots carry the row and the part (shoothouse.js houseShot)');
      const g2 = house(); g2.load(g.save());
      for (const T of R.turners) assert(JSON.stringify(hitMarks(g2.state, T.key)) === JSON.stringify(hitMarks(s, T.key)), `${T.stand} after a load`);
    },
  },
  {
    name: 'reading the target view every tick changes nothing: a tier-one lane\'s digest is the same with engagedOf, hitMarks and the card\'s model read each tick',
    fn() {
      const plain = lane().g.digest();
      let reads = 0;
      const readers = { marksOf: (st, key, k, ph) => hitMarks(st, key, { k, phase: ph }), meAt };
      const { g } = lane((game) => {
        const s = game.state, e = engagedOf(s);
        struckLast(s);
        for (const T of s.armoury.range.turners) { hitMarks(s, T.key); seenFace(s, T.key); }
        if (e) { targetModel(s, { key: e.key, kind: e.kind, who: e.who, readers }); reads++; }
      });
      console.log(`      ${reads} ticks engaged and read; the digest ${g.digest()} against ${plain}`);
      assert(g.digest() === plain && reads > 0, 'a read wrote');
    },
  },
  {
    name: 'the bay\'s hit marks and cards are v0.0.17\'s: "Bang"\'s strings on seed 48213 give the same marks, words and models through the target view\'s string mode, and every rifle card the same digest (stage C0); the pistol boards now hold the P-12',
    fn() {
      const g = createGame({ scenario: 'test-stress', seed: 48213, tier: 'recruit' }), bot = stressBot();
      let got = null;
      const card = { update: (m) => { got = m; return m?.words ?? ''; }, text: '' };
      const view = createTargetView({ card, readers: { pairsOf: (st) => pairsNow(st, st.clock.ms), marksOf: (st, key, k, ph) => hitMarks(st, key, { k, phase: ph }), meAt } });
      const seq = [], cards = new Map(), seen = { sig: null, t: -Infinity, stop: false, shown: null };
      let last = null, n = 0;
      for (; n < 120000; n++) {
        g.step(1, bot);
        const s = g.state, R = s.armoury.range;
        got = null;
        view.frame(s, { inStop: true, seen, now: 0 });
        const rec = got && seen.shown ? JSON.stringify({ k: seen.shown.k, phase: seen.shown.phase, shownKey: seen.shown.key, m: got }) : null;
        if (got) { const ck = JSON.stringify(got); if (!cards.has(ck)) cards.set(ck, { holds: got.holds, digest: cardDigest(paintHitcard(got)) }); }
        if (rec !== last) { seq.push(rec); last = rec; }
        if (R.strs?.some(x => x.k === 4 && x.done !== 'setup' && x.done != null)) break;
      }
      const rifle = [...cards.values()].filter(c => c.holds === 'rifle').map(c => c.digest), pistol = [...cards.values()].filter(c => c.holds === 'pistol').length;
      console.log(`      ${n} ticks, ${seq.length} changes, the sequence ${goldenDigest(seq.join('\n'))} (C0 ${BANG_C0.seq}); ${rifle.length} rifle cards as C0's, ${pistol} pistol boards redrawn with the P-12`);
      assert(n === BANG_C0.ticks && seq.length === BANG_C0.changes && goldenDigest(seq.join('\n')) === BANG_C0.seq, JSON.stringify({ n, changes: seq.length }));
      assert(JSON.stringify(rifle) === JSON.stringify(BANG_C0.rifleCards), JSON.stringify(rifle));
    },
  },
];
