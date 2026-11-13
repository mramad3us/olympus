// OLYMPUS tests: the shoot house's catalogue and pauses (COMBAT §25.19.2, §25.19.4; the rework's R4, 2026-11-12): the muscle-memory rows by phase, one room a press to "Room clear!", the #2's sector his, every stop's why and a live act, the standing order (built, off), the stances that say what they trade, and the saves' mapping.
//
// The user, 2026-11-11, scoring "Stack and clear" 25/25/25: "the option to clear the whole house should not exist ... Pre-baked
// 'muscle memory' options should be stuff like 'stack up', 'stack up, take point', 'breach (explosive)', 'kick door'", "the
// automatic pauses are awkward in general", and "don't know what the assault <-> combat option is supposed to mean". Each test
// here fails on v0.0.13's tree: 'house:clear' was offered, the reflex card and the lane's Stop had no act, a man of the #2's
// sector stopped you, the stops had no why, and the stances were "Combat" and "Assault" with nothing said.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { MUSCLE, BUNDLES, GROUPS, ENTER_AND_CLEAR, beatsOf } from '../src/sim/combat/drills/enter-and-clear.js';
import { upgradeMuscle, STANCE_NAMES, orderOf } from '../src/sim/combat/bundle.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { contactNow } from '../src/sim/combat/contact.js';
import { flawlessSeeds, STOPS_P95 } from './flawless.mjs';
import { stepAct } from './bots/lib.mjs';

// (a row pressed as the page sends it)
const press = (g, id) => g.step(1, () => ({ act: [stepAct(id)] }));

const LANE = /\b(house|lane)\b/i;
const SEED = 1489397426;
// (a lane by the honest bot (T and the shot the line names), every stop on the lane: { atS, lead, line, act, live })
function lane({ tier, seed = SEED, order = null }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }), stops = [], said = [], his = [];
  if (order) g.state.armoury.range.house.order = { engage: order };
  g.bus.on?.('say', (f) => { if (f.call) said.push({ call: f.call, room: f.room, who: f.who }); });
  g.bus.on?.('contact', (f) => { if (f.phase === 'his') his.push(f.ids.join()); });
  let was = false;
  const r = runHouse(g, houseHonestBot(), { maxMs: 12 * 60_000, each: (game) => {
    // (a stop: time standing still for a choice; a choice while a take-in's window runs time at 1:1 is no stop, nor the reflex
    // card's first pass while a window is still open: contact.js ends the window at once under that hold and the pause comes
    // in the same ms, with its line (the rework's R9, 2026-11-13: the corporal's click on seeds 1037 and 1074 once his room 2
    // man was taken in his sector, 0.25 s sooner))
    const s = game.state, S = s.stop, H = s.armoury.range.house, ch = !!S && ((S.mode === 'stop' && S.phase === 'choose' && (s.clock.holds ?? []).includes('stop')) || !!S.reflex) && !contactNow(s)?.pending;
    if (ch && !was && H.goAtMs !== null) {
      const I = instinctNow(s), line = I.line, steps = stepsOf(s), id = line?.act?.startsWith('stop:') ? line.act.slice(5) : null;
      const live = !!S.reflex ? !!line?.act : id ? steps.some(x => (x.id === id || x.id === id.split('>')[0]) && !x.off) : !!line && ['cqb-contact', 'cqb-still-up', 'cqb-hostage'].includes(line.id) && steps.some(x => x.kind === 'shot' && !x.off);
      stops.push({ atS: Math.round((s.clock.ms - H.goAtMs) / 10) / 100, lead: I.lead, line: line?.id ?? null, act: line?.act ?? null, live, onLane: !H.end });
    }
    was = ch;
  } });
  return { g, r, stops, said, his, mem: r.mem };
}

export default [
  {
    name: 'the catalogue is the phases of a room (COMBAT §25.19.2.2): every row has a group of stack, door, room, weapon or team and a slot in it; no row names a lane or a house, and "Clear the house" is gone; rung 2\'s groups are "Stack up, take point", "Open, in: your corner", "Dominate"; every room row ends at "Room clear!"; the explosive breach is a row, struck with no charge issued',
    fn() {
      const bad = [];
      for (const B of BUNDLES) {
        if (!GROUPS.includes(B.group) || !Number.isInteger(B.slot)) bad.push(`${B.id} group ${B.group} slot ${B.slot}`);
        if (LANE.test(B.label) || /(^|:)house(:|$)/.test(B.id)) bad.push(`${B.id} names a lane or a house`);
      }
      const slots = new Set(BUNDLES.map(B => `${B.group}:${B.slot}`));
      if (slots.size !== BUNDLES.length) bad.push('two rows share a slot');
      const ends = ['room:dominate', 'room:clear'].map(id => beatsOf(MUSCLE[id]).filter(k => k !== 'mark').at(-1));
      console.log(`      ${BUNDLES.length} rows: ${GROUPS.map(gp => `${gp} ${BUNDLES.filter(B => B.group === gp).map(B => B.label).join(', ')}`).join(' | ')}`);
      console.log(`      rung 2's groups: ${ENTER_AND_CLEAR.groups.map(x => MUSCLE[x[0]].label).join(' → ')}; the room rows end at ${ends.join(', ')}; the breach ${MUSCLE['door:breach'].offeredNow} (${MUSCLE['door:breach'].needs})`);
      assert(!MUSCLE['house:clear'] && ENTER_AND_CLEAR.groups.flat().join() === 'stack:point,room:in,room:dominate' && ends.every(e => e === 'roomclear') && MUSCLE['door:breach'].offeredNow === 'struck', JSON.stringify({ ends }));
      // (in play: at the tier one's door the breach is greyed "no charge issued", a rung above greyed with its rung, never hidden)
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' });
      g.step(2);
      const rows = stepsOf(g.state), grey = rows.filter(r => r.later && r.kind === 'bundle').map(r => `${r.label} (${r.off})`);
      console.log(`      the private at GO, greyed last: ${grey.join(', ')}`);
      assert(grey.some(x => /clear the room \(rung 3\)/.test(x)) && rows.every(r => !LANE.test(String(r.label))), JSON.stringify(grey));
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'one press reaches one room (the user, 2026-11-11: "the option to clear the whole house should not exist"): the tier one by T on the user\'s seed says "Room clear!" once a room, and every next door is a new press whose stop says "Room clear. Next: room 2, … m." and names that door\'s row',
    timeoutMs: 120_000,
    fn() {
      const { stops, said, r } = lane({ tier: 'tierone' });
      const rc = said.filter(x => x.call === 'roomclear'), next = stops.filter(x => /^(Room|Hall) clear\. Next: /.test(x.lead ?? ''));
      console.log(`      "Room clear!" for ${rc.map(x => x.room).join(', ')}; the stops after: ${next.map(x => `${x.atS} s "${x.lead}" → ${x.act}`).join(' | ')}`);
      assert(r.done && rc.length === 4 && new Set(rc.map(x => x.room)).size === 4, JSON.stringify(rc));
      assert(next.length === 3 && next.every(x => /^stop:drill:room:clear>/.test(x.act ?? '')), JSON.stringify(next));
    },
  },
  {
    name: 'every stop says why and has a live act or names a live row (COMBAT §25.19.4; the no-dead-end rules): the corporal and the tier one by T on three seeds, the reflex card\'s first answer by T, the lane\'s Stop made safe and then Wait, no dead end; the leads are the table\'s ("GO.", "Contact · ", "Room clear. Next: ", "Stoppage.", "Door, east wall." …)',
    timeoutMs: 240_000,
    fn() {
      const bad = [], leads = {};
      for (const tier of ['cpl', 'tierone']) for (const seed of flawlessSeeds(3)) {
        const { stops, mem } = lane({ tier, seed });
        const dead = Object.values(mem?.dead ?? {}).reduce((a, b) => a + b, 0);
        for (const x of stops.filter(y => y.onLane)) {
          const key = String(x.lead).replace(/[\d.]+( m| s)?/g, '#');
          leads[key] = (leads[key] ?? 0) + 1;
          if (!x.lead || x.lead === 'Time stands still.') bad.push(`${tier} ${seed} ${x.atS} s: no why (${x.line})`);
          if (!x.live) bad.push(`${tier} ${seed} ${x.atS} s: ${x.line} ${x.act} not live`);
        }
        if (dead) bad.push(`${tier} ${seed}: dead ends ${JSON.stringify(mem.dead)}`);
      }
      console.log(`      the leads: ${Object.entries(leads).sort((a, b) => b[1] - a[1]).map(([k, n]) => `"${k}" ${n}`).join(', ')}`);
      assert(!bad.length, bad.slice(0, 6).join('; '));
    },
  },
  {
    name: 'a man in the #2\'s sector is his (COMBAT §25.19.4): while he is up and with you and the man is not in your muzzle\'s cone, his window closes with no pause ("His. Taken in …"); the tier one on the user\'s seed stops no more than 14 times, his two men taken by him, never by you; with the #2 down the same man pauses you',
    timeoutMs: 120_000,
    fn() {
      const { stops, his, g } = lane({ tier: 'tierone' });
      const R = g.state.armoury.range, mine = (R.shots ?? []).filter(x => x.who === g.state.player.id && (R.turners.find(T => T.key === x.target)?.slot ?? 1) === 2);
      const log = (g.state.log ?? []).filter(e => /^His\. Taken in/.test(e.text ?? '')).map(e => e.text);
      console.log(`      ${stops.filter(x => x.onLane).length} stops on the lane; his windows ${his.join(' | ')}; the log "${log[0]}"; your rounds on his men ${mine.length}`);
      assert(his.length >= 2 && log.length === his.length && !mine.length && stops.filter(x => x.onLane).length <= STOPS_P95, JSON.stringify({ his, n: stops.filter(x => x.onLane).length }));
      // (his rifle gone: the same game from GO, the #2 down, and his man pauses you)
      const g2 = createGame({ scenario: 'test-shoothouse', seed: SEED, tier: 'tierone', setup: 'go' });
      g2.state.armoury.range.house.two.down = true;
      const paused = [];
      g2.bus.on?.('contact', (f) => { if (f.phase === 'pause') paused.push(f.ids.join()); if (f.phase === 'his') paused.push(`his ${f.ids.join()}`); });
      runHouse(g2, houseHonestBot(), { maxMs: 30_000 });
      console.log(`      the #2 down: the windows ${paused.join(' | ')}`);
      assert(paused.length && paused.every(x => !x.startsWith('his')), JSON.stringify(paused));
    },
  },
  {
    name: 'the standing order "Engage: armed, my sector" (COMBAT §25.19.4, question 1\'s default): built, offered from rung 4 as a row set at no time, off by default; on, a clean armed man of your sector is shot at the end of his take-in with no pause ("By your order: …, moving on"), and a no-shoot, the hostage and his man still pause; never a round on a no-shoot or the hostage',
    timeoutMs: 240_000,
    fn() {
      const g0 = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }); g0.step(2);
      const g1 = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }); g1.step(2);
      const row = stepsOf(g0.state).find(r => r.id === 'drill:variant:engage'), below = stepsOf(g1.state).find(r => r.id === 'drill:variant:engage');
      console.log(`      the tier one at GO: "${row?.label}" (${row?.hint}); the sergeant: ${below ? 'offered' : 'not offered'}; the default ${orderOf(g0.state).engage}`);
      assert(row && !below && orderOf(g0.state).engage === 'off', 'offered from rung 4, off');
      const out = [];
      for (const seed of flawlessSeeds(3)) {
        const off = lane({ tier: 'tierone', seed }), on = lane({ tier: 'tierone', seed, order: 'armed' });
        const R = on.g.state.armoury.range, byOrder = (on.g.state.log ?? []).filter(e => /^By your order: /.test(e.text ?? '')).length;
        const wrong = (R.shots ?? []).filter(x => x.who === on.g.state.player.id && ['noshoot', 'hostage'].includes(R.turners.find(T => T.key === x.target)?.face) && x.hole?.at).length;
        out.push({ seed, off: off.stops.filter(x => x.onLane).length, on: on.stops.filter(x => x.onLane).length, byOrder, wrong, done: on.r.done, end: R.house.end?.phase ?? R.house.end?.why ?? null });
      }
      console.log(`      off → on, stops on the lane: ${out.map(o => `${o.seed} ${o.off} → ${o.on} (by order ${o.byOrder}, rounds on a no-shoot or the hostage ${o.wrong})`).join('; ')}`);
      assert(out.every(o => o.done && o.on < o.off && o.byOrder > 0 && o.wrong === 0), JSON.stringify(out));
    },
  },
  {
    name: 'the stances say what they trade (the user, 2026-11-11: "don\'t know what the assault <-> combat option is supposed to mean"): Careful (Combat) and Fast (Assault) by name, each row with its walk and its moving shot in numbers, and the first switch explains itself in one line, once',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), lines = [];
      g.bus.on?.('line', (f) => lines.push(f.text));
      g.step(2);
      const rows = stepsOf(g.state).filter(r => r.kind === 'gait' || r.id === 'drill:variant:stance');
      console.log(`      ${rows.map(r => `${r.label}: "${r.hint}"`).join(' | ')}`);
      assert(STANCE_NAMES.combat === 'Careful' && STANCE_NAMES.assault === 'Fast' && rows.length >= 2 && rows.every(r => !/Assault|Combat/.test(r.label) && /m\/s/.test(r.hint ?? '')), JSON.stringify(rows.map(r => [r.label, r.hint])));
      press(g, 'gait:assault'); g.step(1); press(g, 'gait:combat'); g.step(1);
      const hints = lines.filter(t => /Careful \(Combat/.test(t));
      console.log(`      the first switch: "${hints[0]}"; said ${hints.length} time(s) over two switches`);
      assert(hints.length === 1 && /m\/s/.test(hints[0]), JSON.stringify(lines));
    },
  },
  {
    name: 'a save made before the catalogue loads mapped (COMBAT §25.19.2.2; the pre-1.0 rule): a running "Clear the house" becomes "Clear the room" for the leg it stands in, its keys bare and its dependencies on other legs dropped; "Enter" becomes "In: your corner"; "Stack and open" loads as the choice, time standing still',
    fn() {
      const beat = (key, plan, st, after = []) => ({ key, k: 'move', ch: 'feet', plan, door: plan, st, after, fromMs: null, untilMs: null });
      const s = { clock: { ms: 1000, holds: [] }, armoury: { range: { house: { two: { pid: 'p2', doing: { bundle: 'room:enter', step: 'drill:room:enter>o:w4:r2', beats: [beat('enter', 'o:w4:r2', 'run')] } } } } },
        stop: { mode: 'stop', phase: 'act', doing: { bundle: 'house:clear', step: 'drill:house:clear>o:w4:r1', door: 'o:w4:r1', lanes: {}, subs: [], beats: [beat('0:mark', 'o:w4:r1', 'done'), beat('1:approach', 'o:w4:r2', 'run', ['0:mark']), beat('1:enter', 'o:w4:r2', 'wait', ['1:approach']), beat('2:approach', 'o:w4:r3', 'wait', ['1:enter'])] } } };
      upgradeMuscle(s);
      const d = s.stop.doing;
      console.log(`      the lane's doing → ${d.bundle} for ${d.door}: ${d.beats.map(b => `${b.key}(${b.after.join(',') || '-'})`).join(', ')}; the #2's → ${s.armoury.range.house.two.doing.step}`);
      assert(d.bundle === 'room:clear' && d.door === 'o:w4:r2' && d.step === 'drill:room:clear>o:w4:r2' && d.beats.map(b => b.key).join() === 'approach,enter' && d.beats[0].after.length === 0 && d.beats[1].after.join() === 'approach', JSON.stringify(d.beats));
      assert(s.armoury.range.house.two.doing.bundle === 'room:in', 'the #2 renamed');
      const s2 = { clock: { ms: 1000, holds: [] }, stop: { mode: 'stop', phase: 'act', doing: { bundle: 'room:stack-open', step: 'drill:room:stack-open>o:w4:r1', beats: [beat('approach', 'o:w4:r1', 'run')] } } };
      upgradeMuscle(s2);
      assert(s2.stop.doing === null && s2.stop.phase === 'choose' && s2.clock.holds.includes('stop'), JSON.stringify(s2.stop));
    },
  },
  {
    name: 'a row that names a Top up is the asking (COMBAT §25.19.2.1, the `reorg` variant): with the magazine believed at half or less of its load and a fuller one at hand, the stack row reads "· top up on the way" and the approach tops up on the hands (the magazine changed, the stack reached); with a full magazine it says nothing of it',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'room:2' });
      g.step(2);
      const s = g.state, gun = s.items[s.stop.gun], before = stepsOf(s).find(r => r.bundle === 'room:clear');
      const mag0 = gun.mag, m = s.items[mag0];
      m.n = 2; gun.belief.count = 2; (gun.belief.fullN = 10);
      const row = stepsOf(s).find(r => r.bundle === 'room:clear');
      console.log(`      a full magazine: "${before?.label}"; two of ten left: "${row?.label}" · ${fmt((row?.ms ?? 0) / 1000, 2)} s`);
      assert(before && !/top up/.test(before.label) && /top up on the way$/.test(row?.label ?? ''), JSON.stringify([before?.label, row?.label]));
      press(g, row.id);
      for (let i = 0; i < 400 && !(s.stop?.phase === 'choose'); i++) g.step(1);
      console.log(`      after the press: the magazine ${gun.mag === mag0 ? 'the same' : 'changed'}, ${s.items[gun.mag]?.n} rounds in it`);
      assert(gun.mag !== mag0 && s.items[gun.mag].n > 2, 'topped up on the way');
    },
  },
];
