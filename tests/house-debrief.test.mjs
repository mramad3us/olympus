// OLYMPUS tests: the debrief's model, the plan view's (the build sheet v0.0.20 §1 item 26; card C2): house-debrief.js debriefOf gives every mark of the lane a place and a time.
//
// Over a whole lane from GO: the counts of debriefOf's events (rounds, sightings, faults, covered corners, "Clear!"s) equal the record's
// own (R.shots and H.two.shots, the legs' contacts, faults, covered hot spots and calls), each placed (x, z) and timed; the walls are the
// house's rooms, the lane's three doors carry their leaf's track, the legs are the run sheet's. F58's half (tests/flawless-card.mjs
// debriefGauge has the export's replay as well, tests/replay-run.test.mjs). The tier one by T and the private by the keys on 48213.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, houseKeysBot, runHouse } from './bots/house.mjs';
import { houseOf } from '../src/sim/scenarios/shoothouse.js';
import { debriefOf, placeAt } from '../src/sim/scenarios/house-debrief.js';

export default [
  {
    name: 'every round, sighting, fault, covered corner and "Clear!" of the run sheet has a place and a time on the plan: the counts equal the record\'s (the tier one by T, the private by the keys, 48213)',
    fn() {
      const out = [];
      for (const [tier, bot] of [['tierone', houseHonestBot()], ['private', houseKeysBot()]]) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go' });
        runHouse(g, bot);
        const s = g.state, H = houseOf(s), d = debriefOf(s), legs = [...H.rooms, H.hall], count = (k) => d.events.filter(e => e.kind === k).length;
        const want = { round: s.armoury.range.shots.length + (H.two.shots ?? []).length, sighting: legs.reduce((a, L) => a + L.contacts.length, 0), fault: legs.reduce((a, L) => a + L.faults.length, 0),
          corner: legs.reduce((a, L) => a + Object.keys(L.covered ?? {}).length, 0), clear: legs.reduce((a, L) => a + L.calls.filter(c => c.say === 'clear').length, 0) };
        const got = Object.fromEntries(Object.keys(want).map(k => [k, count(k)])), unplaced = d.events.filter(e => ![e.x, e.z, e.atMs].every(Number.isFinite));
        const lane = d.doors.filter(o => o.lane), mid = placeAt(d.tracks, 'me', (H.goAtMs + H.end.atMs) / 2);
        console.log(`      ${tier}: ${Object.keys(want).map(k => `${k} ${got[k]} of ${want[k]}`).join(', ')}; unplaced ${unplaced.length}; ${d.walls.length} rooms, ${d.doors.length} doors (${lane.length} on the lane, ${lane.filter(o => o.k?.length === d.tracks.ms.length).length} tracked), ${d.legs.length} legs, ${d.tracks.ms.length} samples; you mid-lane at ${mid?.x}, ${mid?.z}`);
        out.push({ tier, ok: Object.keys(want).every(k => got[k] === want[k]) && !unplaced.length && lane.length === 3 && lane.every(o => o.k?.length === d.tracks.ms.length) && d.legs.length === 4 && mid !== null, want, got });
      }
      assert(out.every(o => o.ok), JSON.stringify(out));
    },
  },
];
