// OLYMPUS tests: ship-seam, F150's registry half (the build sheet v0.0.27 §2 step 3, §6 stage 0, §8; SH§4): the ship seam is a registry, and nothing moves through it.
//
// v0.0.25 selected the Wreck by one field of the operation record, R.house.ship, and tested it against the Wreck's name at some sixty
// places in ten modules; v0.0.27's stage 0 made the field a key of src/data/places/ships.js SHIPS, each branch reading the ship's row
// (its data), any ship (the void's rules) or the Wreck's own (its cadre and its tug). These cases hold that move to "nothing moves":
//   - the source scan: no literal of the Wreck's name in src outside the registry (ships.js), the Wreck's own data (wreck.js,
//     wreck-plans.js) and test-zerocqb's scene entry (scenes.js, once, its `ship`); a branch left on the literal fails here, and the
//     scan's probe shows it would (a planted line is found);
//   - the Wreck's row is v0.0.25's data by identity (the area, decks, trunk, plans, legs, sequence, words, roles, set, spots), its
//     spec (scenes/assemble.js shipSpec, wreckSpec its alias) the snapshot's to the digest, its eight hatches built by the shared builder
//     (ship-parts.js) the snapshot's to the digest, DECK_HATCHES its one trunk, shipDeckAt its decks' rule at every 0.1 m from
//     −10 to 80 m, its setups, toast, names and goal the strings v0.0.25 wrote;
//   - test-zerocqb at 1,000 ticks on 48213 with no keys is env-noregress's SCENE_DIGESTS row to the byte (the Wreck's pin cells are
//     zerocqb-pin's, heavy, run whole by env-noregress's heavy case; zerocqb-pin has no quick cell).
// The digests were recorded on the snapshot (.run/v027/v026-snapshot.tree a49eac55) before any stage-0 edit
// (.run/v027/lead-figures; its scratch specdig.mjs).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { goldenDigest } from './golden.mjs';
import { createGame } from './game.mjs';
import { SCENE_DIGESTS } from './env-noregress.test.mjs';
import { SHIPS, shipOf, shipOfLane, shipOfArea, shipDeckAt, hatch } from '../src/data/places/ships.js';
import { WRECK, WRECK_DECKS, WRECK_TRUNK, WRECK_HATCHES, WRECK_SET_A, WRECK_SPOTS } from '../src/data/places/wreck.js';
import { WRECK_PLANS } from '../src/data/places/wreck-plans.js';
import { SEQ_WRECK, WRECK_CHIEF, WRECK_LEGS, WRECK_ROLES } from '../src/data/courses.js';
import { shipSpec, wreckSpec, wreckDeckAt } from '../src/sim/scenes/assemble.js';
import { DECK_HATCHES } from '../src/sim/places/hatch.js';
import { SHIP_DROPPED, shipChoice } from '../src/core/debug.js';
import { WRECK_SETUPS } from '../src/sim/scenarios/shoothouse.js';

/** The snapshot's digests (see the header): the Wreck's spec, its bulkhead hatches, its area, its plans, the deck hatches. */
export const SNAPSHOT = Object.freeze({ spec: '04263d451b1d17', hatches: '18e5368e23da40', area: '031180f0254beb', plans: '15d9440dbae1e8', deckHatches: '02d5fef8b842de' });
/** Where the Wreck's name may stand as a literal (see the header): the registry and its own data anywhere, the scene's entry once. */
export const LITERAL_HOMES = Object.freeze({ 'src/data/places/ships.js': Infinity, 'src/data/places/wreck.js': Infinity, 'src/data/places/wreck-plans.js': Infinity, 'src/data/scenes.js': 1 });
const LITERAL = /(['"`])wreck\1/g;

// (every .js under src, its path from the root)
function sources(dir = path.join(root, 'src'), out = []) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) sources(p, out); else if (e.endsWith('.js')) out.push(path.relative(root, p));
  }
  return out;
}
/** The scan (see the header): { file: count } for every file holding the literal; and the lines outside its homes. */
export function scanLiterals(files) {
  const counts = {}, outside = [];
  for (const [f, text] of files) {
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      const n = (line.match(LITERAL) ?? []).length;
      if (!n) return;
      counts[f] = (counts[f] ?? 0) + n;
      if (!(f in LITERAL_HOMES)) outside.push(`${f}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
  for (const [f, max] of Object.entries(LITERAL_HOMES)) if ((counts[f] ?? 0) > max) outside.push(`${f}: ${counts[f]} (at most ${max})`);
  return { counts, outside };
}

export default [
  {
    name: 'the source scan (F150, the registry\'s half): no literal of the Wreck\'s name in src outside ships.js, wreck.js, wreck-plans.js and test-zerocqb\'s scene entry, and no ship tested by its name; a branch left on the literal is found',
    fn() {
      const files = sources().map(f => [f, readFileSync(path.join(root, f), 'utf8')]);
      const { counts, outside } = scanLiterals(files);
      const byName = files.filter(([f, t]) => f !== 'src/data/places/ships.js' && /\.ship\s*[!=]==\s*(['"`])\w+\1/.test(t)).map(([f]) => f);
      const sceneLine = files.find(([f]) => f === 'src/data/scenes.js')[1].split('\n').find(l => /(['"`])wreck\1/.test(l)) ?? '';
      console.log(`      ${files.length} modules scanned; the literal in ${Object.entries(counts).map(([f, n]) => `${f} ${n}`).join(', ')}; outside its homes ${outside.length}; a ship tested by its name in ${byName.length}`);
      // (the probe: one branch left on the literal in a module of the sim is found)
      const probe = scanLiterals([['src/sim/scenarios/shoothouse.js', "const legWord = (H, k) => (H?.ship === 'wreck' ? WRECK_LEGS[k]?.word : LEG_WORD[k]);"]]);
      console.log(`      the probe (a branch left on the literal in shoothouse.js): ${probe.outside.length} found`);
      assert(probe.outside.length === 1, JSON.stringify(probe));
      assert(!outside.length, outside.join('\n'));
      assert(!byName.length, `a ship tested by its name: ${byName.join(', ')}`);
      assert(/id: 'test-zerocqb'.*ship: 'wreck'/.test(sceneLine), `the scene's one literal is not test-zerocqb's ship: ${sceneLine.trim()}`);
    },
  },
  {
    name: 'the Wreck\'s row is v0.0.25\'s data by identity, its spec, hatches, area, plans and deck hatches the snapshot\'s to the digest, shipDeckAt its decks\' rule, its setups, toast, names and goal v0.0.25\'s strings; shipOf reads the record and nothing else',
    fn() {
      const W = SHIPS.wreck;
      const same = { area: W.area === WRECK.id, decks: W.decks === WRECK_DECKS, trunks: W.trunks.length === 1 && W.trunks[0] === WRECK_TRUNK, plans: W.plans === WRECK_PLANS, legs: W.legs === WRECK_LEGS,
        seq: W.seq === SEQ_WRECK, words: W.words === WRECK_CHIEF, roles: W.roles === WRECK_ROLES, set: W.set === WRECK_SET_A, spots: W.spots === WRECK_SPOTS };
      const dig = { spec: goldenDigest(shipSpec('wreck')), hatches: goldenDigest(WRECK_HATCHES), area: goldenDigest(WRECK), plans: goldenDigest(WRECK_PLANS), deckHatches: goldenDigest(DECK_HATCHES) };
      let deckOff = 0, n = 0;
      // (v0.0.25's rule, written out: deck 6 where its origin is nearer, else deck 5)
      const old = (x) => (Math.abs(x - WRECK_DECKS[6].origin[0]) < Math.abs(x - WRECK_DECKS[5].origin[0]) ? 6 : 5);
      for (let i = -100; i <= 800; i++) { const x = i / 10; n++; if (shipDeckAt('wreck', x) !== old(x) || wreckDeckAt(x) !== old(x)) deckOff++; }
      // (the builder with the Wreck's arguments: cell 2's hatch built again, to the key)
      const cell2 = WRECK_HATCHES.find(h => h.id === 'o:wk:d5:cell-2'), again = hatch(cell2.id, cell2.at, [cell2.a, cell2.b], cell2.rooms, { hinge: cell2.swing.hinge });
      console.log(`      the row by identity: ${Object.entries(same).map(([k, v]) => `${k} ${v ? 'yes' : 'NO'}`).join(', ')}`);
      console.log(`      digests: ${Object.entries(dig).map(([k, v]) => `${k} ${v}${v === SNAPSHOT[k] ? '' : ` (the snapshot's ${SNAPSHOT[k]})`}`).join(', ')}`);
      console.log(`      shipDeckAt over ${n} points: ${deckOff} off v0.0.25's rule; cell 2's hatch built again ${JSON.stringify(again) === JSON.stringify(cell2) ? 'to the key' : 'DIFFERENT'}; setups ${WRECK_SETUPS.join(', ')}; the toast "${W.dropped}"`);
      assert(Object.values(same).every(Boolean), JSON.stringify(same));
      assert(Object.entries(dig).every(([k, v]) => v === SNAPSHOT[k]), JSON.stringify(dig));
      assert(wreckSpec() === shipSpec('wreck') && shipSpec('wreck').ship === W.id, 'the spec is not one object');
      assert(!deckOff && JSON.stringify(again) === JSON.stringify(cell2), JSON.stringify({ deckOff }));
      assert(JSON.stringify(WRECK_SETUPS) === JSON.stringify(['go', 'trunk', 'hold', 'tug']) && JSON.stringify(Object.values(W.setups)) === JSON.stringify([0, 2, 2, 2]), JSON.stringify(W.setups));
      assert(W.dropped === SHIP_DROPPED && shipChoice({ ship: 'wreck' }, { layout: 'B', words: W.dropped }).dropped[0] === SHIP_DROPPED && shipChoice({ ship: 'wreck' }, { layout: 'B' }).dropped[0] === SHIP_DROPPED, W.dropped);
      assert(W.name === 'The Wreck' && W.card === 'THE WRECK' && W.lane === 'W' && W.staff === 'cadre' && W.tug === true && W.chief.post === 'phobos-void:cadre' && W.chief.area === 'phobos.void.well-a', JSON.stringify({ name: W.name, card: W.card }));
      assert(W.goal.replace('{who}', 'Cpl Okafor') === 'The Wreck at Phobos, in free fall on mag boots, Cpl Okafor your number two. On GO: the brig, the trunk, the hold. Anchor before you fire.', W.goal);
      assert(shipOf({ ship: 'wreck' }) === W && shipOf({}) === null && shipOf(null) === null && shipOf({ ship: 'toString' }) === null && shipOfLane('W') === W && shipOfLane('A') === null && shipOfArea(WRECK.id) === W && shipOfArea('melas.wheel.s4') === null, 'shipOf');
    },
  },
  {
    name: 'test-zerocqb at 1,000 ticks on 48213 with no keys is the snapshot\'s to the byte (env-noregress\'s SCENE_DIGESTS row), through the registry',
    fn() {
      const g = createGame({ scenario: 'test-zerocqb', seed: 48213 });
      g.step(1000, {});
      const d = g.digest(), want = SCENE_DIGESTS['test-zerocqb'];
      console.log(`      test-zerocqb at tick ${g.state.clock.tick}: ${d} (the snapshot's ${want}), errors ${g.errors.length}; the record's ship ${g.state.armoury.range.house?.ship}`);
      assert(d === want && !g.errors.length, JSON.stringify({ d, want, errors: g.errors.slice(0, 2) }));
    },
  },
];
