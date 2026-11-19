// OLYMPUS tests: impacts (BODY §16.5; ROADMAP "anywhere" step 7; the build sheet v0.0.24 §6 B; F109): src/sim/body/impact.js
// impactOf over 2,000 seeded falls a band on a fresh body each time (the sandbox's recruit, the R-7's kit or none), each band's
// injuries, fractures, inside bleeding, knock and deaths printed and held to BODY §16.5's table; the legs' 3.0 m/s feet first (4.0
// trained), ÷ √(the load's mass ratio); the bone factor on the absorption and on the fracture's chance (× (1 / bone)²).
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { FREEFALL } from '../src/data/body/needs.js';
import { impactOf, impactBand, impactWords, BONE_UNTRACKED } from '../src/sim/body/impact.js';
import { valueOf } from '../src/sim/skills/templates.js';
import { kitMassKg } from '../src/sim/arms/kit.js';

const I = FREEFALL.IMPACT, N = 2000;
// (n falls at vMs, first, each on a fresh body record at its own moment: the rates of what they did)
function falls(s, pid, vMs, first, n = N, { bone = null } = {}) {
  const p = s.people[pid], t0 = s.clock.ms, out = { n, hurt: 0, fracture: 0, crack: 0, inside: 0, knock: 0, dead: 0, torso: 0, legs: 0, head: 0 };
  for (let k = 0; k < n; k++) {
    delete p.body;
    if (bone !== null) p.body = { v: 1, tmpl: 'm-adult', cond: { bone } };
    const list = impactOf(s, pid, { vMs, first, atMs: t0 + k });
    const rec = p.body, inj = rec?.injuries ?? [];
    if (list.length) out.hurt++;
    if (inj.some(i => i.kind === 'fracture')) out.fracture++;
    if (inj.some(i => i.kind === 'crack')) out.crack++;
    if (inj.some(i => i.internal)) out.inside++;
    if (rec?.knock) out.knock++;
    if (rec?.dead) out.dead++;
    out.torso += rec?.parts?.torso ?? 0; out.legs += ((rec?.parts?.legL ?? 0) + (rec?.parts?.legR ?? 0)) / 2; out.head += rec?.parts?.head ?? 0;
  }
  for (const k of ['torso', 'legs', 'head']) out[k] = Math.round(out[k] / n * 100) / 100;
  delete p.body;
  return out;
}
const pct = (k, n) => `${fmt(100 * k / n, 1)}%`;

export default [
  {
    name: 'impact bands over 2,000 falls a band (F109; BODY §16.5): nothing under 1 m/s, a bruise 1 to 3 with no fracture, hard 3 to 5 with 30% fractured, bone-breaking 5 to 8 always fractured, crushing 8 to 12 fractured, bleeding inside and down 60 s, lethal 12 to 18 the same harder, fatal from 18 always dead; each a body first on the recruit with no kit',
    fn() {
      const g = createGame({ scenario: 'sandbox', seed: 48213 }), s = g.state, pid = s.player.id;
      const rows = [], got = {};
      for (const [id, vMs] of [['none', 0.9], ['bruise', 2.0], ['hard', 4.0], ['breaking', 6.5], ['crushing', 10.0], ['lethal', 15.0], ['fatal', 19.0]]) {
        const r = falls(s, pid, vMs, 'body');
        got[id] = r;
        rows.push(`${id.padEnd(8)} ${vMs} m/s: hurt ${pct(r.hurt, N)}, fractured ${pct(r.fracture, N)}, cracked ${pct(r.crack, N)}, bleeding inside ${pct(r.inside, N)}, down ${pct(r.knock, N)}, dead ${pct(r.dead, N)}; torso ${r.torso}, legs ${r.legs}, head ${r.head} points`);
      }
      for (const r of rows) console.log(`      ${r}`);
      const { none, bruise, hard, breaking, crushing, lethal, fatal } = got;
      assert(none.hurt === 0 && bruise.hurt === N && bruise.fracture === 0 && bruise.inside === 0 && bruise.knock === 0, JSON.stringify({ none, bruise }));
      near(hard.fracture / N, 0.3, 0.04, 'the hard band\'s fracture rate:');
      assert(breaking.fracture === N && breaking.inside === 0 && crushing.fracture === N && crushing.inside === N && crushing.knock === N && lethal.inside === N && fatal.dead === N, JSON.stringify({ breaking, crushing, lethal, fatal }));
      assert(bruise.torso < hard.torso && hard.torso < breaking.torso && breaking.torso < crushing.torso && crushing.torso < lethal.torso, 'the torso\'s share rises with the band');
      // (the words: never numbers)
      delete s.people[pid].body;
      const w = impactWords(impactOf(s, pid, { vMs: 6.5, first: 'body' }));
      console.log(`      the words at 6.5 m/s: "${w}"`);
      assert(!/\d/.test(w), w);
    },
  },
  {
    name: 'the legs absorb 3.0 m/s feet first (4.0 trained, Fitness 12 or more), ÷ √(the load\'s mass ratio) × bone, the hands 1.5 m/s, the body nothing; the bone factor raises the fracture\'s chance by (1 / bone)² (F109; BODY §16.5, §14)',
    fn() {
      const g = createGame({ scenario: 'sandbox', seed: 48213 }), s = g.state, pid = s.player.id, fit = Math.round(valueOf(s, pid, 'fitness'));
      const rows = [];
      // (the pure reader: each first and each mass)
      const b = (v, f, o = {}) => impactBand(v, f, { fitness: 10, ...o });
      const feet3 = b(3.0, 'feet'), feet4 = b(4.0, 'feet'), trained4 = b(4.0, 'feet', { fitness: 12 }), kit = b(3.0, 'feet', { massRatio: 100 / 75 }), hands = b(2.0, 'hands'), body = b(2.0, 'body'), bone = b(3.0, 'feet', { bone: 0.8 });
      rows.push(`feet first at Fitness 10: 3.0 m/s absorbed ${feet3.absorbedMs} (${feet3.band?.id ?? 'nothing'}), 4.0 m/s ${feet4.band?.id} at ${feet4.effMs}; trained 4.0 m/s ${trained4.band?.id ?? 'nothing'}; with 25 kg of kit the legs take ${kit.absorbedMs} m/s (3 / √(100 / 75)), so 3.0 m/s is ${kit.band?.id ?? 'nothing'} at ${kit.effMs}; hands first 2.0 m/s ${hands.effMs} left, the body ${body.effMs}; bone 0.8 takes ${bone.absorbedMs}`);
      assert(!feet3.band && feet4.band?.id === 'bruise' && !trained4.band && near(kit.absorbedMs, 3 / Math.sqrt(100 / 75), 1e-3, 'the kit\'s absorption') === undefined, JSON.stringify({ feet3, feet4, trained4, kit }));
      assert(hands.effMs === 0.5 && body.effMs === 2 && bone.absorbedMs === 2.4, JSON.stringify({ hands, body, bone }));
      // (in the game: the recruit at his own Fitness with no kit, feet first at 3.0 m/s, over 2,000 drops: never hurt)
      const f3 = falls(s, pid, 3.0, 'feet', 500), f5 = falls(s, pid, 5.0, 'feet', 500);
      // (the legs' share 1.5 × the torso's: a leg takes 9 points, the torso 12 (wounds.js PARTS), so the shares are read per capacity)
      const legK = (f5.legs / 9) / (f5.torso / 12);
      rows.push(`the recruit (Fitness ${fit}, ${kitMassKg(s, pid)} kg of kit) feet first: 3.0 m/s hurt ${pct(f3.hurt, 500)}; 5.0 m/s hurt ${pct(f5.hurt, 500)}, a leg ${f5.legs} points against the torso's ${f5.torso}, ${fmt(legK, 2)} × its share`);
      assert(f3.hurt === 0 && f5.hurt === 500, JSON.stringify({ f3, f5 }));
      near(legK, I.LEAD_K, 0.1, 'the legs\' share feet first:');
      // (the bone: the hard band, body first (no absorption), its fracture × (1 / 0.8)² = 0.47)
      const hard1 = falls(s, pid, 4.0, 'body', N), hard08 = falls(s, pid, 4.0, 'body', N, { bone: 0.8 });
      rows.push(`hard band, body first: fractured ${pct(hard1.fracture, N)} at bone ${BONE_UNTRACKED}, ${pct(hard08.fracture, N)} at bone 0.8 (0.3 / 0.64 = 46.9%)`);
      for (const r of rows) console.log(`      ${r}`);
      near(hard08.fracture / N, 0.3 / 0.64, 0.04, 'the bone 0.8 fracture rate:');
      assert(hard08.fracture > hard1.fracture, 'weaker bone breaks more often');
      assert(I.LEGS_MS === 3 && I.TRAINED_MS === 4 && I.TRAINED_FIT === 12, 'BODY §16.5\'s numbers');
    },
  },
];
