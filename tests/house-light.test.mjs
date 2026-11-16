// OLYMPUS tests: the shoot house's light candidates change nothing until one is set (FL-9; quick).
//
// src/data/places/house-light.js holds three candidates of house 1's light (HL-a today's, HL-b the floods from the
// catwalk, HL-c warm pools over each room's centre), carried by a runtime key, state.$houseLight, which the URL's
// &houselight=b|c or the sample's page (samples/house-light) sets. With none (or HL-a) every light number in the house
// is v0.0.19's, the same lamp table comes back, the key is never saved and touches no other area. HL-c's pools stay
// inside their rooms (the hall and the booth keep today's light). Prints perception's reach (PEOPLE §7: 10 m + 42 m ×
// the light) at room 1's corners under each, the difference a pick makes to what you see there.
import { assert, fmt } from './helpers.mjs';
import { lampsOf, lightLevel, lightingOf, lightFrame, spectrumAt } from '../src/sim/places/light.js';
import { areaOf } from '../src/sim/places/model.js';
import { stripRuntime } from '../src/core/state.js';
import { readParams } from '../src/core/debug.js';
import { HOUSE_LIGHTS, HOUSE_LIGHT_IDS, HOUSE_LIGHT_AREA, houseLightOf, houseLightFor } from '../src/data/places/house-light.js';
import { msAtMarsTime } from '../src/core/calendar.js';
import { START_MS } from '../src/data/setting/calendar.js';

const LON = 287.2;
const at = (h) => msAtMarsTime(START_MS, Math.floor(h), Math.round((h % 1) * 60), LON);
const stateIn = (area, ms, hl) => ({ clock: { ms }, places: { live: { site: 'melas', area }, sites: {}, nav: { queue: [], pending: [], debtNodes: 0 } }, meta: { seed: 1 }, ...(hl ? { $houseLight: hl } : {}) });
// (every 0.25 m of an area: the light, the room's lighting and the spectrum, as one string)
function survey(area, s, ms) {
  const parts = [], F = lightFrame(s, area.id, ms);
  for (let x = area.boundsM.x0 + 0.125; x < area.boundsM.x1; x += 0.25) for (let z = area.boundsM.z0 + 0.125; z < area.boundsM.z1; z += 0.25) {
    const sp = spectrumAt(F, x, z);
    parts.push(`${lightLevel(s, x, z, ms, area.id)}/${sp.level}/${sp.sp}`);
  }
  for (const r of area.rooms) parts.push(`${r.id}:${lightingOf(s, area.id, r.id, ms)}`);
  return parts.join(',');
}

export default [
  {
    name: 'with no candidate set the house\'s light is today\'s, point for point, at 10:00 and at 23:00; HL-a is the same; the key is never saved',
    fn() {
      const area = areaOf(HOUSE_LIGHT_AREA);
      for (const h of [10, 23]) {
        const ms = at(h), none = stateIn(area.id, ms), a = stateIn(area.id, ms, 'HL-a');
        const sNone = survey(area, none, ms), sA = survey(area, a, ms);
        assert(sNone === sA, `HL-a differs from no key at ${h}:00`);
        assert(lampsOf(none, area.id, ms) === lampsOf(a, area.id, ms), 'HL-a made a lamp table of its own');
        // (the candidates do change it: so the survey would see a change)
        assert(survey(area, stateIn(area.id, ms, 'HL-c'), ms) !== sNone && survey(area, stateIn(area.id, ms, 'HL-b'), ms) !== sNone, 'a candidate changed nothing');
        console.log(`      ${h}:00: ${sNone.split(',').length} points and rooms, the same with no key and HL-a; HL-b and HL-c differ`);
      }
      const saved = stripRuntime(stateIn(area.id, at(10), 'HL-c'));
      assert(!('$houseLight' in saved), 'the candidate was saved');
    },
  },
  {
    name: 'a candidate lights house 1 only: Echo\'s first floor and Base Melas\'s ground read the same under HL-b and HL-c as with none',
    fn() {
      const others = ['melas.echo.1', 'melas.ground'].map(areaOf).filter(Boolean);
      for (const area of others) {
        const ms = at(23), base = stateIn(area.id, ms);
        const pts = [];
        for (let i = 0; i < 400; i++) { const x = area.boundsM.x0 + ((i * 37) % 97) / 97 * (area.boundsM.x1 - area.boundsM.x0), z = area.boundsM.z0 + ((i * 53) % 89) / 89 * (area.boundsM.z1 - area.boundsM.z0); pts.push([x, z]); }
        const read = (s) => pts.map(([x, z]) => lightLevel(s, x, z, ms, area.id)).join(',') + '|' + (area.rooms ?? []).map(r => lightingOf(s, area.id, r.id, ms)).join(',');
        for (const hl of ['HL-b', 'HL-c']) {
          const s = stateIn(area.id, ms, hl);
          assert(houseLightFor(s, area.id) === null && read(s) === read(base) && lampsOf(s, area.id, ms) === lampsOf(base, area.id, ms), `${hl} reached ${area.id}`);
        }
      }
      console.log(`      ${others.map(a => a.id).join(', ')}: the same under HL-b and HL-c`);
    },
  },
  {
    name: 'HL-c\'s pools stay inside their rooms (the hall and the booth keep today\'s light), and perception\'s reach at room 1\'s corners is printed for each candidate',
    fn() {
      const area = areaOf(HOUSE_LIGHT_AREA), ms = at(10), a = stateIn(area.id, ms), c = stateIn(area.id, ms, 'HL-c');
      const lamps = HOUSE_LIGHTS['HL-c'].areas[area.id].lamps;
      for (const l of lamps) {
        const r = area.rooms.find(q => q.id === l.room), R = 1.5 * l.r;
        assert(l.x - R >= r.rect[0] && l.x + R <= r.rect[2] && l.z - R >= r.rect[1] && l.z + R <= r.rect[3], `${l.room}'s pendant's ring leaves its room: ${JSON.stringify({ l, rect: r.rect })}`);
      }
      let diff = 0, n = 0;
      for (const id of ['w4.hall', 'w4.booth']) {
        const [x0, z0, x1, z1] = area.rooms.find(q => q.id === id).rect;
        for (let x = x0 + 0.05; x < x1; x += 0.1) for (let z = z0 + 0.05; z < z1; z += 0.1) { n++; if (lightLevel(a, x, z, ms, area.id) !== lightLevel(c, x, z, ms, area.id)) diff++; }
      }
      assert(diff === 0, `${diff} of ${n} points of the hall and the booth lit differently under HL-c`);
      const corner = [26.8, 8.3], reach = (s) => 10 + 42 * lightLevel(s, ...corner, ms, area.id);
      console.log(`      the hall and the booth: ${n} points, ${diff} lit differently under HL-c; sight's reach at room 1's north-west corner: ${HOUSE_LIGHT_IDS.map(hl => `${hl} ${fmt(reach(stateIn(area.id, ms, hl)), 1)} m`).join(', ')}`);
    },
  },
  {
    name: 'the URL\'s &houselight= takes b or c (or HL-b, HL-c), and a, nothing or anything else is today\'s',
    fn() {
      const cases = { '?houselight=b': 'HL-b', '?houselight=HL-c': 'HL-c', '?houselight=hl-b': 'HL-b', '?houselight=a': null, '?houselight=d': null, '?houselight=': null, '': null };
      for (const [q, want] of Object.entries(cases)) assert(readParams(q).houseLight === want, JSON.stringify({ q, got: readParams(q).houseLight, want }));
      assert(houseLightOf('c') === 'HL-c' && houseLightOf('a') === null && houseLightOf('x') === null, 'houseLightOf');
    },
  },
];
