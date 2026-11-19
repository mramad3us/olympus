// OLYMPUS tests: Again's short brief (v0.0.23, its build sheet item 14, carried FH-5; COMBAT §25.10): on Again of the same lane the tower says "Same lane, same rules." and LOAD comes about 6 s after the fill, not 23.
//
// The tower's brief (12.55 or 10.75 s spoken) and the instructor's line beside you (5.05 or 5.35 s, with the gravity's, the doors'
// and the kit's words) are said before LOAD on every lane; v0.0.22 said them again on every Again, 17 to 19 s before every GO
// after the first. Stage 0 threads `again` from the end card's rows and createGame to the fill (R.house.again, a lane from the fill
// only); from v0.0.23 shoothouse.js houseCmdSay says the brief's `sayAgain` there (courses.js SEQ_HOUSE, the drawn house's own on
// SEQ_HOUSE_DRAWN) and houseOnCmd's brief leaves the beside-you line unsaid, but on a kit with practice grenades: "Same kit." and
// the intelligence (house-kit.js intelWords: the rooms that are hostiles only), so the frag lane's rule is never lost to Again.
// The tower chains its waits on the spoken length (R.paUntilMs), so LOAD comes sooner by itself. Every case is from the fill.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { SEQ_HOUSE, SEQ_HOUSE_DRAWN } from '../src/data/courses.js';
// (Again's LOAD at most AGAIN_LOAD_MAX_MS 9 s after the fill: F95's own constant, tests/flawless-carried.mjs; 6,100 ms measured on
// 48213, 1 and 2, against 23,100 to 25,100 without)
import { AGAIN_LOAD_MAX_MS, carriedWordsGauges } from './flawless-carried.mjs';
export { AGAIN_LOAD_MAX_MS };

// (the fill to LOAD: its ms from the fill, the PA's words of the brief, the instructor's lines said before LOAD)
export function toLoad(opts) {
  const g = createGame({ scenario: 'test-shoothouse', tier: 'recruit', ...opts }), s = g.state, t0 = s.clock.ms, said = [];
  g.bus.on?.('say', (f) => { if (f.text) said.push({ ms: s.clock.ms - t0, kind: f.kind, who: f.who, text: f.text }); });
  let loadMs = null;
  for (let i = 0; i < 2400 && loadMs === null; i++) { g.step(1); if (s.armoury.range.cmd?.id === 'load') loadMs = s.clock.ms - t0; }
  const H = s.armoury.range.house;
  return { g, loadMs, said, again: H.again ?? null, brief: said.find(x => x.kind === 'pa')?.text ?? null, chief: said.filter(x => x.who === H.chiefPid && x.kind !== 'pa').map(x => x.text) };
}

export default [
  {
    name: 'Again of the same lane says LOAD within AGAIN_LOAD_MAX_MS 9 s of the fill, the tower\'s "Same lane, same rules." and no line beside you; without `again` at v0.0.22\'s 23.1 to 25.1 s, the brief whole (the user\'s first hour: 17 to 19 s of brief before every GO after the first)',
    fn() {
      const rows = [];
      for (const seed of [48213, 1, 2]) {
        const a = toLoad({ seed, again: true }), b = toLoad({ seed });
        rows.push({ seed, again: a.loadMs, plain: b.loadMs, briefA: a.brief, chiefA: a.chief.length, chiefB: b.chief.length });
        console.log(`      ${seed}: LOAD at ${(a.loadMs / 1000).toFixed(2)} s on Again ("${a.brief}"; ${a.chief.length} line beside you), ${(b.loadMs / 1000).toFixed(2)} s without (${b.chief.length} line beside you)`);
        assert(a.again === true && b.again === null, JSON.stringify({ a: a.again, b: b.again }));
      }
      // (F95, Again's brief: LOAD within AGAIN_LOAD_MAX_MS on every turner lane given `again`, the drawn house's own included)
      const d = toLoad({ seed: 48213, draw: 'drawn', again: true }), F95 = carriedWordsGauges({ again: [...rows.map(r => ({ cell: `recruit/${r.seed}/again`, loadMs: r.again })), { cell: 'recruit/48213/again/drawn', loadMs: d.loadMs }] }).find(x => x.id === 'F95');
      console.log(`      F95 ${F95.name}: ${F95.met ? 'MET' : 'NOT MET'}, ${F95.value}`);
      assert(rows.every(r => r.again <= AGAIN_LOAD_MAX_MS && r.plain >= 20_000 && SEQ_HOUSE[0].sayAgain.includes(r.briefA) && r.chiefA === 0 && r.chiefB === 1) && F95.met, JSON.stringify({ rows, F95: F95.bad }));
    },
  },
  {
    name: 'Again on a drawn house of the same code says the drawn house\'s own short brief ("Same layout"), never SEQ_HOUSE\'s "lane"; Again on a kit with practice grenades still names the hostiles-only rooms ("Same kit. …")',
    fn() {
      const d = toLoad({ seed: 48213, draw: 'drawn', again: true });
      const f = toLoad({ seed: 48213, tier: 'cpl', loadout: 'frag', again: true }), f0 = toLoad({ seed: 48213, tier: 'cpl', loadout: 'frag' });
      console.log(`      drawn: "${d.brief}" LOAD at ${(d.loadMs / 1000).toFixed(2)} s`);
      console.log(`      frag kit, Again: "${f.chief.join(' | ')}" LOAD at ${(f.loadMs / 1000).toFixed(2)} s; without: LOAD at ${(f0.loadMs / 1000).toFixed(2)} s`);
      assert(SEQ_HOUSE_DRAWN[0].sayAgain.includes(d.brief) && !/\blane\b/i.test(d.brief) && d.loadMs <= AGAIN_LOAD_MAX_MS, JSON.stringify(d.brief));
      assert(f.chief.length === 1 && /^Same kit\. /.test(f.chief[0]) && /hostiles only|Hostiles only|No room in this house/.test(f.chief[0]) && f.loadMs < f0.loadMs, JSON.stringify({ chief: f.chief, loadMs: f.loadMs, plain: f0.loadMs }));
    },
  },
  {
    name: 'Again on the live lane checks again: its own short brief ("Same lane, live."), the instructor\'s two looks before LOAD ("Clean. Next.", "Clean."), LOAD sooner than the live lane\'s whole brief by the brief\'s saving (carried DC3 with FH-5; Griffith 2003, "entering or re-entering")',
    fn() {
      const a = toLoad({ seed: 48213, tier: 'sgt', opfor: 'live:fight,hide', again: true }), b = toLoad({ seed: 48213, tier: 'sgt', opfor: 'live:fight,hide' });
      const looks = (r) => Object.values(r.g.state.armoury.range.house.sterile?.done ?? {}).map(ms => ms - (r.g.state.clock.ms - r.loadMs));
      const clean = (r) => r.chief.filter(t => /^Clean\./.test(t));
      console.log(`      live, Again: "${a.brief}" LOAD at ${(a.loadMs / 1000).toFixed(2)} s, the looks at ${looks(a).map(x => (x / 1000).toFixed(2)).join(', ')} s (${clean(a).join(' | ')}); without: "${b.brief.slice(0, 40)}…" LOAD at ${(b.loadMs / 1000).toFixed(2)} s, the looks at ${looks(b).map(x => (x / 1000).toFixed(2)).join(', ')} s`);
      assert(SEQ_HOUSE[0].sayAgainLive.includes(a.brief) && SEQ_HOUSE[0].sayLive.includes(b.brief) && looks(a).length === 2 && looks(a).every(x => x <= a.loadMs) && clean(a).length === 2 && looks(b).length === 2 && a.loadMs < b.loadMs, JSON.stringify({ a: a.brief, b: b.brief, la: looks(a), lb: looks(b), ca: clean(a), al: a.loadMs, bl: b.loadMs }));
    },
  },
];
