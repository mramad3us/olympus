// kit-suit: the combat EVA suit as worn kit and test-shoothouse's issue 'house-cqb' (src/sim/arms/kit.js; WEAPONS §3, §8.3; BODY §16.2, §17.3; the build sheet 0.0.12 §2.1, §4, §5.1, §8 items 11, 12, 15).
//
// Printed from the code: the issue worn (the suit in its own slot, black, 16 kg, its visor down; the carrier, its
// pouches, the R-7, three magazines of 10 frangible, no ear defenders), what supp.js protOf reads of it ({ visor: true,
// ears: 'suit' }), what the person carries (kitMassKg: 25 ± 1.5 kg, item by item, and the push and brake's mass ratio
// r BODY §16.2 reads), the other issues' masses beside it, the suit's clo; the instructor's dummy in the magazine a
// LOAD takes first; and a training bang 2 m in front of a suited marine against one in utilities with bare ears: no
// flash, the pool ×0.6 (EARPRO_K), not deafened.
import { assert, fmt } from './helpers.mjs';
import { bayGame } from './contact-world.mjs';
import { newState } from '../src/core/state.js';
import { put } from '../src/core/ids.js';
import { materialise, kitMassKg, kitView, pickMag, magMassG, roundMassG, CONTAINERS, KIT_TEMPLATES, SLOTS } from '../src/sim/arms/kit.js';
import { MODELS, OPTICS } from '../src/sim/arms/models.js';
import { protOf, bang, blockOf, inputPts, EARPRO_K } from '../src/sim/combat/supp.js';
import { CLO, warmthOf } from '../src/sim/body/thermal.js';

/** The kit's mass the sheet asks (BODY §16.2's 25 kg on 75 kg), and its tolerance. */
const KIT_KG = 25, KIT_TOL_KG = 1.5, BODY_KG = 75;
// (a bare state and one person with an issue)
function issued(tmpl, sets = {}) {
  const s = newState(48213, { version: 'test' });
  s.places.live = { site: 'melas', area: 'melas.wheel.s4' };
  put(s, s.people, 'p1', { id: 'p1', name: { given: 'Test', family: 'Okafor' }, service: { rank: 'Pvt' } });
  const out = materialise(s, 'p1', tmpl, { sets });
  return { s, ...out };
}

export default [
  {
    name: 'kit-suit: the house-cqb issue worn (the combat EVA suit in its own slot, black, its visor down; the carrier and its pouches, the R-7 at low ready, three magazines of 10 frangible, no ear defenders); protOf reads { visor: true, ears: \'suit\' }; what the marine carries is 25 ± 1.5 kg',
    fn() {
      const { s, gunId, magIds, wornIds } = issued('house-cqb'), kit = s.people.p1.kit, suit = s.items[kit.worn.suit], C = CONTAINERS['ces-1'];
      const prot = protOf(s, 'p1'), kg = kitMassKg(s, 'p1'), view = kitView(s, 'p1');
      const parts = [['the suit', C.massKg], ['the carrier', CONTAINERS['pc-m3'].massKg], ['its pouches', 2 * CONTAINERS['pouch-mag2'].massKg + CONTAINERS['pouch-dump'].massKg],
        ['the R-7', MODELS.r7.massKg], ['the SO-4', OPTICS.so4.massG / 1000], ['three magazines', magIds.reduce((n, id) => n + magMassG(s.items[id]) / 1000, 0)]];
      console.log(`      SLOTS ${SLOTS.join(', ')}; worn ${JSON.stringify(kit.worn)}; posture ${kit.carry.posture}; the suit ${JSON.stringify(suit)} (${C.word}, ${C.colour}, ${C.massKg} kg, visor ${C.visor})`);
      console.log(`      the magazines ${magIds.map(id => { const m = s.items[id]; return `${id} ${m.n} ${m.load} (${fmt(magMassG(m), 1)} g)`; }).join(', ')}; a frangible round ${fmt(roundMassG('6.5x40r', 'frangible'), 2)} g, a ball round ${fmt(roundMassG('6.5x40r', 'ball'), 2)} g`);
      console.log(`      the I card's worn: ${view.groups.find(g => g.id === 'worn')?.items.map(i => i.word).join(', ')}; pouches ${view.groups.filter(g => g.key).map(g => `${g.word} ${g.items.length}`).join(', ')}`);
      console.log(`      protOf ${JSON.stringify(prot)}; carried ${kg} kg (${parts.map(([w, v]) => `${w} ${fmt(v, 2)}`).join(', ')}); on ${BODY_KG} kg, r ${fmt((BODY_KG + kg) / BODY_KG, 3)} (BODY §16.2's push and brake ÷ r)`);
      assert(SLOTS.indexOf('ears') === SLOTS.length - 3 && SLOTS.slice(-2).join() === 'holster,thigh' && SLOTS.includes('suit') && kit.worn.suit && !kit.worn.ears && !kit.worn.head && kit.worn.sling === gunId && wornIds.length === 1 && wornIds[0] === kit.worn.suit, JSON.stringify(kit.worn));
      assert(suit.type === 'suit' && suit.model === 'ces-1' && C.colour === 'black' && C.massKg === 16 && C.visor === true && kit.carry.posture === 'lowReady', JSON.stringify(suit));
      assert(magIds.length === 3 && magIds.every(id => s.items[id].n === 10 && s.items[id].load === 'frangible' && s.items[id].belief?.kind === 'frangible'), 'three magazines of 10 frangible');
      assert(prot.visor === true && prot.ears === 'suit', JSON.stringify(prot));
      assert(Math.abs(kg - KIT_KG) <= KIT_TOL_KG && Math.abs(kg - parts.reduce((n, [, v]) => n + v, 0)) < 0.01, `${kg} kg`);
      // (the other issues, for the scale: nothing else carries a suit, and every worn thing weighs something)
      const others = Object.keys(KIT_TEMPLATES).filter(t => t !== 'house-cqb').map(t => { const w = issued(t); return `${t} ${kitMassKg(w.s, 'p1')} kg`; });
      console.log(`      the other issues: ${others.join(', ')}; every container weighs something: ${Object.entries(CONTAINERS).map(([k, c]) => `${k} ${c.massKg}`).join(', ')}`);
      assert(Object.values(CONTAINERS).every(c => c.massKg > 0), 'a massKg on every worn thing');
      // (the suit's clo: worn unpressurised over utilities, the sheet's 1.2)
      console.log(`      CLO.combatSuit ${CLO.combatSuit} clo, warmth ${fmt(warmthOf('combatSuit'), 2)} on tradecraft's scale (utilities ${fmt(warmthOf('utilities'), 2)})`);
      assert(CLO.combatSuit === 1.2, 'the suit\'s clo');
    },
  },
  {
    name: 'kit-suit: the instructor\'s dummy set in magazine 1 (rounds 3 to 6 by the scene\'s draw) is the magazine a LOAD takes first (pickMag by rule, whatever the meant load), and it weighs as one round of its magazine',
    fn() {
      const rows = [];
      for (const round of [3, 4, 5, 6]) {
        const n = 10 - round + 1, { s, magIds } = issued('house-cqb', { 1: { n, kind: 'dud' } });
        const ball = pickMag(s, 'p1', { from: 'rule', load: 'ball' }), fr = pickMag(s, 'p1', { from: 'rule', load: 'frangible' });
        rows.push({ round, n, set: s.items[magIds[0]].set, ball: ball?.id === magIds[0] && ball.from, fr: fr?.id === magIds[0] && fr.from, others: magIds.slice(1).every(id => !s.items[id].set), kg: kitMassKg(s, 'p1') });
      }
      for (const r of rows) console.log(`      the dummy at round ${r.round} (set n ${r.n}: ${JSON.stringify(r.set)}): a LOAD takes magazine 1 from ${r.ball} (meant ball) and ${r.fr} (meant frangible); the others unset ${r.others}; carried ${r.kg} kg`);
      assert(rows.every(r => r.set?.kind === 'dud' && r.set.n === r.n && r.ball === 'p1' && r.fr === 'p1' && r.others), JSON.stringify(rows));
    },
  },
  {
    name: 'kit-suit: a training bang 2 m in front, indoors: the marine in the suit is not flashed, his pool ×0.6 of the bare-eared one\'s (EARPRO_K) and he is not deafened; the one in utilities with bare ears is blinded and deafened',
    fn() {
      const run = (suited) => {
        const w = bayGame({ tier: 'private' }), T = w.state.clock.ms;
        if (suited) materialise(w.state, w.pid, 'house-cqb');
        else { const worn = w.state.people[w.pid].kit.worn; for (const [slot, id] of Object.entries(worn)) if (w.state.items[id]?.type === 'ears') delete worn[slot]; }
        const prot = protOf(w.state, w.pid), out = bang(w.state, w.g.bus, { id: `test:suit:${suited}`, x: w.me.x + 2, z: w.me.z, atMs: T, indoor: true });
        const me = out.find(o => o.who === w.pid), b = blockOf(w.state, w.pid);
        return { prot, pool: b?.supp ?? 0, flash: me?.flash ?? null, deaf: (b?.deafUntilMs ?? null) !== null, felt: me?.felt };
      };
      const suit = run(true), bare = run(false), pts = inputPts('flash', { rM: 2, indoor: true });
      console.log(`      the bang's ${pts} points at 2 m indoors; in the suit ${JSON.stringify(suit)}; in utilities, bare ears ${JSON.stringify(bare)}; the ratio ${fmt(suit.pool / bare.pool, 3)} (EARPRO_K ${EARPRO_K})`);
      assert(suit.prot.visor && suit.prot.ears === 'suit' && suit.flash === null && !suit.deaf, JSON.stringify(suit));
      assert(!bare.prot.visor && bare.prot.ears === 'none' && bare.flash === 'blind' && bare.deaf, JSON.stringify(bare));
      assert(Math.abs(suit.pool / bare.pool - EARPRO_K) < 0.01, `the pool ×${suit.pool / bare.pool}, not ×${EARPRO_K}`);
    },
  },
];
