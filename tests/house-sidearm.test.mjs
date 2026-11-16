// OLYMPUS tests: the stoppage under contact and the sidearm in the shoot house (COMBAT §25.19.6; WEAPONS §3.2's note, §5.2; the rework's R6, 2026-11-13).
//
// The user's note on v0.0.12 (2026-11-11): "We get a jam in the second room, we should be able to switch to side arm or
// something realistic like take cover". What each test pins, each failing without its build (none of it existed in v0.0.13):
//   - the P-12 is issued on every sheet (the user, 2026-11-15: "everyone should have the same loadout, there is no reason to
//     not give sidearms to low ranks"; R6 issued it from the Sergeant up), in the thigh holster with a HAD-17 of ten
//     frangible seated and a spare in the thigh pouch, its four ids last, so every sheet's fill has the same ids;
//   - the reflex card in the house offers the answers by the situation (COMBAT §25.19.6's table): a threat facing within
//     TRANSITION_NEAR_M with a pistol carried, Transition first, on every sheet; struck "not carried" only for a man who
//     carries none (never the rank's now); never the house's answers off the lane;
//   - Transition: pistol takes the rifle let hang and the thigh's draw, 1.40 s × paceOf(WH) (1.81 s for the boot recruit,
//     0.64 s for the tier one), on every sheet (the boot recruit and the private by the keys), and then the P-12 is the gun
//     in use: its rows fire it, and the lane reaches its card with it holstered;
//   - Gun down: "Gun down!", the knee, tap, rack, "Gun up!", on the knee until your #2's "Up.", then stand; he says
//     "Covering!" and takes the man you had bracketed when he can see him;
//   - Off the line: "Stoppage!", a step of at most COVER_STEP_M off the threat's line, never into a wall or your #2, then
//     tap, rack and "Up!";
//   - Rifle up: with the P-12 out and nobody facing, T holsters it, brings the rifle up and clears it (the DI's cqb-rifle-up);
//   - your #2 gun down: one stop, "Your two's down. His sector.", and T covers his sector (team:cover);
//   - MAKE READY racks the P-12 and SHOW CLEAR clears it, the pistol last; the lane's 'dry' end counts its rounds.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot, houseKeysBot, stoppageBot } from './bots/house.mjs';
import { flawlessSeeds, overlapOf, WALL_TOL_M, SHEETS, T_SHEETS } from './flawless.mjs';
import { conditionOf, gunField, actionMs, beliefOf } from '../src/sim/arms/firearms.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { paceOf } from '../src/sim/skills/skills.js';
import { kitMassKg } from '../src/sim/arms/kit.js';
import { COVER_STEP_M, BODY_GAP_M } from '../src/sim/combat/bundle.js';
import { SIDEARM_TIERS } from '../src/sim/arms/sidearm.js';
import { roundsLeft } from '../src/sim/scenarios/handling.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { gunLook } from '../src/sim/arms/look.js';
import { createGaitView } from '../src/render/gait-view.js';

const SEED = 1489397426;
const meOf = (s) => s.actors.list.find(a => a.who === s.player.id);
const twoActor = (s) => s.actors.list.find(a => a.who === s.armoury.range.house.two.pid);
const pistolOf = (s) => s.armoury.range.house.pistol ?? null;
// (a lane with the stoppage bot up to the reflex card on the dummy's click: the game, the card, or null at the lane's end)
// (the boot recruit and the private by the keys, as they play it: the honest bot's T is the corporal's up; edit(state) at the fill)
function toCard(tier, seed, answer = 'ia', edit = null) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }), bot = T_SHEETS.includes(tier) ? stoppageBot({ answer }) : houseKeysBot();
  edit?.(g.state);
  for (let t = 0; t < 20 * 60 * 5; t++) {
    if (g.state.stop?.reflex) return { g, card: g.state.stop.reflex, bot };
    g.step(1, bot); g.clearFacts();
    if (g.state.armoury.range.house.end) break;
  }
  return { g, card: null, bot };
}
// (the rest of a lane watched tick by tick after the card: each(game) after each step, its facts read there)
function onward(g, bot, each, maxMs = 5 * 60_000) {
  return runHouse(g, bot, { maxMs, each: (game) => each?.(game) });
}

export default [
  {
    name: 'the P-12 is issued on every sheet, the boot recruit and the private included (the user, 2026-11-15: "everyone should have the same loadout, there is no reason to not give sidearms to low ranks"), in the thigh holster with a HAD-17 of ten frangible seated (Condition 3) and a spare in the thigh pouch; every sheet\'s fill has the same ids, the sidearm\'s four numbered after all of it, then your #2\'s four (his P-12 standard issue from v0.0.20, the user\'s answer of 2026-11-16: "#2 has to have a sidearm")',
    fn() {
      const ids = {}, kg = {};
      assert(SHEETS.every(t => SIDEARM_TIERS.includes(t)), JSON.stringify(SIDEARM_TIERS));
      for (const tier of SHEETS) {
        const g = createGame({ scenario: 'test-shoothouse', seed: SEED, tier }), s = g.state, pid = s.player.id, k = s.people[pid].kit;
        ids[tier] = Object.keys(s.items).filter(id => !id.startsWith('$'));
        kg[tier] = kitMassKg(s, pid);
        const P = k.worn.holster ? s.items[k.worn.holster] : null, pouch = k.worn.thigh ? s.items[k.worn.thigh] : null;
        assert(P && pouch, JSON.stringify({ tier, worn: k.worn }));
        const mag = s.items[P.mag], spare = s.items[pouch.holds[0]];
        console.log(`      ${tier}: holster ${k.worn.holster} ${P.model} Condition ${conditionOf(P)}, ${mag.n} ${mag.load} in its ${mag.fam}; the thigh pouch ${spare.n} ${spare.load}; carried ${fmt(kg[tier], 2)} kg`);
        assert(P.model === 'p12' && conditionOf(P) === 3 && mag.fam === 'had17' && mag.n === 10 && mag.load === 'frangible' && pouch.model === 'pouch-p12' && pouch.holds.length === 1 && spare.n === 10 && pistolOf(s) === k.worn.holster, JSON.stringify({ tier, P, pouch }));
      }
      // (the same seed: every sheet's fill the same ids, the P-12, its pouch and two magazines numbered last; the same kilograms)
      const num = (id) => Number(id.slice(1)), P = createGame({ scenario: 'test-shoothouse', seed: SEED, tier: 'recruit' }).state, k = P.people[P.player.id].kit, k2 = P.people[P.armoury.range.house.two.pid].kit;
      const set = (kk) => [kk.worn.holster, kk.worn.thigh, P.items[kk.worn.holster].mag, ...P.items[kk.worn.thigh].holds];
      const mine = set(k), his = set(k2), rest = ids.recruit.filter(id => !mine.includes(id) && !his.includes(id));
      console.log(`      the sidearm's ids ${mine.join(', ')} after the fill's last ${rest.map(num).sort((a, b) => b - a)[0]}, your #2's ${his.join(', ')} after them; every sheet's ${ids.recruit.length} ids the same: ${SHEETS.every(t => ids[t].join() === ids.recruit.join())}; kilograms ${[...new Set(SHEETS.map(t => fmt(kg[t], 2)))].join(', ')}`);
      assert(SHEETS.every(t => ids[t].join() === ids.recruit.join()) && Math.min(...mine.map(num)) > Math.max(...rest.map(num)) && Math.min(...his.map(num)) > Math.max(...mine.map(num)) && new Set(SHEETS.map(t => fmt(kg[t], 2))).size === 1, JSON.stringify({ mine, his }));
    },
  },
  {
    name: 'the reflex card in the house by the situation (COMBAT §25.19.6\'s table): at the dummy\'s click with the armoured man facing close, Transition: pistol first on every sheet (the boot recruit and the private by the keys), then Gun down, Tap, rack (standing), Off the line, Look at the port, Nothing; struck "not carried" only for a man with no pistol at all, never chosen',
    fn() {
      const keys = (c) => c.options.map(o => `${o.key}${o.off ? `(${o.off})` : ''}`).join(' ');
      for (const tier of SHEETS) {
        const { card } = toCard(tier, SEED);
        console.log(`      ${tier}: ${card.options.map(o => `${o.label}${o.off ? ` [${o.off}]` : ` ${fmt(o.ms / 1000, 2)} s`}`).join(' | ')}`);
        assert(keys(card).startsWith('transition gundown') && keys(card).endsWith('look none') && !card.options.some(o => o.off) && card.options.find(o => o.key === 'ia').label.endsWith('(standing)'), `${tier}: ${keys(card)}`);
      }
      // (a man with no pistol at all (none in the house now: the holster emptied by hand at the fill), Transition struck "not carried")
      const { g } = toCard('cpl', SEED, 'ia', (s) => { const k = s.people[s.player.id].kit, P = s.items[k.worn.holster]; delete s.items[P.mag]; delete s.items[k.worn.holster]; delete k.worn.holster; s.armoury.range.house.pistol = null; });
      const card = g.state.stop.reflex;
      console.log(`      cpl with no pistol: ${keys(card)}`);
      assert(keys(card) === 'gundown ia offline look transition(not carried) none', keys(card));
      // (the struck answer refused: the card stays, and the line's act is never it)
      const atMs = card.atMs;
      g.step(1, { act: [{ act: 'stop', args: { step: 'reflex:transition' } }] });
      const line = instinctNow(g.state).line;
      assert(g.state.stop.reflex?.atMs === atMs, 'the struck answer leaves the card up');
      assert(line?.act === 'stop:reflex:gundown', JSON.stringify(line));
    },
  },
  {
    name: 'Transition: pistol on every sheet: the rifle let hang and the P-12 drawn from the thigh in 1.40 s × paceOf(Weapon handling) (the boot recruit 1.81 s, the private 1.40, the corporal 1.18, the sergeant 1.05, the Raider 0.78, the tier one 0.64: WEAPONS §5.2\'s table), then the P-12 is the gun in use and the next round is its own; the lane reaches its card with the P-12 back in its holster (the boot recruit and the private by the keys, Rifle up by the DI\'s line)',
    timeoutMs: 120_000,
    fn() {
      for (const tier of SHEETS) {
        const { g, card, bot } = toCard(tier, SEED, 'transition'), s = g.state, pid = s.player.id, rifle = s.people[pid].kit.worn.sling, P = pistolOf(s);
        const ro = rollerOf(s, pid), wh = ro.value('weapons'), formula = actionMs(ro, s.items[rifle], 'hang') + actionMs(ro, s.items[P], 'draw:thigh');
        // (the keys bot answers its card with Tap, rack: the boot recruit's and the private's Transition pressed as a player would)
        if (!T_SHEETS.includes(tier)) g.step(1, { act: [{ act: 'stop', args: { step: 'reflex:transition' } }] });
        let from = null, drawn = null, round = null, inHand = false;
        const run = onward(g, bot, (game) => {
          const st = game.state, S = st.stop;
          if (from === null && S?.doing?.step === 'weapon:transition') from = S.doing.fromMs;
          if (from !== null && drawn === null && S?.gun === P) { drawn = st.clock.ms; inHand = st.people[pid].kit.hands?.[0] === P && !st.people[pid].kit.worn.holster; }
          for (const f of game.facts('shot')) if (round === null && f.who === pid && f.fired) round = { gun: f.gun, ms: f.atMs, held: st.people[pid].kit.hands?.includes(P) || f.gun === P };
        }, 5 * 60_000);
        const want = Math.round(1400 * paceOf(wh)), back = s.people[pid].kit.worn.holster === P;
        console.log(`      ${tier} (WH ${wh}): the card's ${fmt(card.options[0].ms / 1000, 3)} s; the draw's end ${fmt((drawn - from) / 1000, 2)} s after its start (formula ${fmt(formula / 1000, 3)} s, 1.4 × paceOf ${fmt(want / 1000, 3)} s); the next round ${round ? `by ${round.gun === P ? 'the P-12' : 'the rifle'} ${fmt((round.ms - from) / 1000, 2)} s after` : 'none'}; the card ${run.done ? 'reached' : 'NOT reached'}, the P-12 ${back ? 'holstered' : 'not holstered'}`);
        assert(card.options[0].key === 'transition' && Math.abs(card.options[0].ms - formula) <= 1 && Math.abs(formula - want) <= 2, JSON.stringify({ card: card.options[0], formula, want }));
        // (the next round with the P-12 in the hand is its own; the boot recruit's man on 1489397426 falls to his #2 while he draws,
        // so his next round is the rifle's, after Rifle up)
        assert(drawn !== null && drawn - from >= formula && drawn - from <= formula * 1.6 + 50 && round && (round.gun === P || (!round.held && tier === 'recruit')) && inHand, JSON.stringify({ from, drawn, formula, round, inHand }));
        assert(run.done && back, JSON.stringify({ done: run.done, holster: s.people[pid].kit.worn.holster }));
      }
    },
  },
  {
    name: 'Gun down: "Gun down!", the knee, tap, rack, "Gun up!", on the knee until your #2\'s "Up.", then stand; your #2 says "Covering!" and takes the man you had bracketed (FM 3-06.11 §3-15d: "until directed to stand up")',
    fn() {
      let took = 0, n = 0;
      for (const [tier, seed] of [['sgt', SEED], ['tierone', SEED], ['cpl', 1037], ['raider', 1148]]) {
        const { g, card, bot } = toCard(tier, seed, 'gundown'), s = g.state, pid = s.player.id, twoPid = s.armoury.range.house.two.pid, man = s.stop.pick;
        assert(card.options.some(o => o.key === 'gundown'), JSON.stringify(card.options));
        const said = [], stances = new Set();
        let stand = null, fired = false;
        onward(g, bot, (game) => {
          const st = game.state, S = st.stop, now = st.clock.ms;
          for (const f of game.facts('say')) if ((f.who === pid || f.who === twoPid) && /Gun|Up|Cover/.test(f.text)) said.push({ who: f.who === pid ? 'me' : 'two', text: f.text, ms: now });
          if (S?.doing?.step === 'weapon:gun-down') { stances.add(meOf(st).stance ?? 'stand'); const i = S.doing.list.indexOf('stance:stand'); if (stand === null && S.doing.i === i) stand = S.doing.subFromMs; }
          if (stand === null) for (const f of game.facts('shot')) if (f.who === twoPid && f.fired && f.target === man) fired = true;
        }, 20_000);
        n++; if (fired) took++;
        const first = (who, text) => said.find(x => x.who === who && x.text === text)?.ms ?? null;
        const down = first('me', 'Gun down!'), cov = first('two', 'Covering!'), up = first('me', 'Gun up!'), ok = said.find(x => x.who === 'two' && x.text === 'Up.' && x.ms >= (up ?? Infinity))?.ms ?? null;
        console.log(`      ${tier} ${seed}: ${said.slice(0, 6).map(x => `${x.who} "${x.text}"`).join(', ')}; knelt ${stances.has('kneel')}; stood ${stand !== null ? fmt((stand - up) / 1000, 2) : '-'} s after "Gun up!", his "Up." ${ok !== null ? fmt((ok - up) / 1000, 2) : '-'} s after; the man ${man} taken by him ${fired}`);
        assert(down !== null && cov !== null && up !== null && ok !== null && stances.has('kneel') && stand !== null && stand >= ok - 50, JSON.stringify({ down, cov, up, ok, stand, stances: [...stances] }));
      }
      assert(took >= 2, `your #2 took the bracketed man in ${took} of ${n}`);
    },
  },
  {
    name: 'the kneel drawn as it goes (VIEWS §3.10.7, §3.10.9 item 2, the rework\'s R8): on every Gun down the knee is `kneelGoing` for the first third of its time and `kneelLow` after, and standing the reverse, by the step\'s own k (stop motion holds it); never a pop from standing to the knee',
    fn() {
      const rows = [];
      let kneels = 0, stands = 0, going = 0, back = 0, pops = 0;
      for (const [tier, seed] of [['sgt', SEED], ['tierone', SEED], ['raider', 1148]]) {
        const { g, card, bot } = toCard(tier, seed, 'gundown');
        if (!card?.options.some(o => o.key === 'gundown')) continue;
        const G = createGaitView(), seen = { kneel: [], stand: [] };
        onward(g, bot, (game) => {
          const st = game.state, S = st.stop, me = meOf(st);
          const sub = S?.doing?.step === 'weapon:gun-down' ? S.doing.list[S.doing.i] : null;
          if (sub !== 'stance:kneel' && sub !== 'stance:stand') return;
          const gl = gunLook(st, me, st.clock.ms), action = Array.isArray(gl?.action?.frame) ? null : gl?.action?.frame ?? null;
          const f = G.draw({ id: me.id, ms: st.clock.ms, tickMs: st.clock.ms, free: true, simFace: 'right', yawRad: 0, turnsByYaw: true, walking: false, sheet: true, action }).frame;
          seen[sub === 'stance:kneel' ? 'kneel' : 'stand'].push(`${(gl?.action?.k ?? 0).toFixed(2)}:${f}`);
        }, 20_000);
        const firstK = seen.kneel[0] ?? '', lastS = seen.stand.at(-1) ?? '';
        if (seen.kneel.length) { kneels++; if (/kneelGoing/.test(firstK)) going++; else pops++; }
        if (seen.stand.length) { stands++; if (seen.stand.some(x => /kneelGoing/.test(x))) back++; else pops++; }
        rows.push(`${tier} ${seed}: down ${seen.kneel.map(x => x.split(':')[1].replace('kneel', '')).join(' ')}; up ${seen.stand.map(x => x.split(':')[1].replace('kneel', '')).join(' ')}`);
        assert(seen.kneel.every(x => { const [k, fr] = x.split(':'); return fr === (+k < 1 / 3 ? 'kneelGoing' : 'kneelLow'); }), JSON.stringify(seen.kneel));
        assert(!lastS || /kneelGoing/.test(lastS), JSON.stringify(seen.stand));
      }
      console.log(`      ${rows.join(' · ')}`);
      console.log(`      kneels ${kneels}, each opening on kneelGoing ${going}; stands ${stands}, each passing kneelGoing ${back}; pops ${pops}`);
      assert(kneels >= 2 && going === kneels && back === stands && !pops, JSON.stringify({ kneels, going, stands, back, pops }));
    },
  },
  {
    name: 'Off the line: "Stoppage!", a step of at most COVER_STEP_M off the threat\'s line toward a wall, never into a wall or within BODY_GAP_M of your #2, then tap, rack and "Up!" (TC 3-22.9 §8-26)',
    fn() {
      const rows = [];
      for (const tier of ['cpl', 'sgt', 'tierone']) for (const seed of flawlessSeeds(4)) {
        const { g, card, bot } = toCard(tier, seed, 'offline');
        if (!card?.options.some(o => o.key === 'offline')) continue;
        const s = g.state, pid = s.player.id;
        let wall = 0, gap = Infinity, end = null, at0 = null, calls = [];
        onward(g, bot, (game) => {
          const st = game.state, S = st.stop, me = meOf(st), two = twoActor(st);
          // (from where the feet record starts, the body brought to its place by the brake first: shooting.js weaponStep)
          if (S?.doing?.step === 'weapon:offline') { at0 ??= S.feet?.path?.[0] ?? [me.x, me.z]; wall = Math.max(wall, overlapOf(st, me.x, me.z).m); gap = Math.min(gap, Math.hypot(me.x - two.x, me.z - two.z)); end = [me.x, me.z]; }
          for (const f of game.facts('say')) if (f.who === pid) calls.push(f.text);
        }, 15_000);
        const stepM = end && at0 ? Math.hypot(end[0] - at0[0], end[1] - at0[1]) : 0;
        rows.push({ tier, seed, stepM, wall, gap, calls: calls.filter(t => /Stoppage|Up!/.test(t)).join(' ') });
      }
      console.log(`      ${rows.map(r => `${r.tier} ${r.seed}: step ${fmt(r.stepM, 2)} m, wall ${fmt(r.wall, 3)}, gap ${fmt(r.gap, 2)} m, "${r.calls}"`).join('\n      ')}`);
      assert(rows.length >= 6 && rows.every(r => r.stepM <= COVER_STEP_M + 0.05 && r.wall <= WALL_TOL_M && r.gap >= BODY_GAP_M && /Stoppage!/.test(r.calls) && /Up!/.test(r.calls)), JSON.stringify(rows));
      assert(rows.some(r => r.stepM > 0.1), 'somewhere the step moved the body');
    },
  },
  {
    name: 'Rifle up: with the P-12 out and nobody facing, the DI\'s "Rifle up." (cqb-rifle-up) and T holster it, bring the rifle up and clear it; the lane ends at its card with the P-12 back in its holster and the rifle working',
    fn() {
      for (const tier of ['sgt', 'tierone']) {
        const { g, bot } = toCard(tier, SEED, 'transition'), s = g.state, pid = s.player.id, rifle = s.people[pid].kit.worn.sling;
        const lines = new Set();
        let rifleUp = 0;
        const r = onward(g, bot, (game) => {
          const L = instinctNow(game.state).line;
          if (L?.id === 'cqb-rifle-up') lines.add(L.act);
          if (game.state.stop?.doing?.step === 'weapon:rifle-up' && game.state.stop.doing.i === 0) rifleUp++;
        });
        const k = s.people[pid].kit, b = beliefOf(s, rifle);
        console.log(`      ${tier}: the line's acts ${[...lines].join(', ')}; Rifle up begun ${rifleUp > 0}; at the card: holster ${k.worn.holster}, hands ${JSON.stringify(k.hands ?? null)}, the rifle ${b.chamber}, stoppage ${b.stoppage ?? 'none'}; done ${r.done}`);
        assert(r.done && lines.has('stop:weapon:rifle-up') && rifleUp > 0 && k.worn.holster === pistolOf(s) && !(k.hands ?? []).some(Boolean) && !b.stoppage, JSON.stringify({ lines: [...lines], worn: k.worn, hands: k.hands, b }));
      }
    },
  },
  {
    name: 'your number two gun down: one stop, "Your two\'s down. His sector." (cqb-two-down), and T covers his sector (team:cover: your eyes on it), you saying "Covering!" first (v0.0.19, team.js TEAM_WORDS call:covering; v0.0.18 said nothing); his "Gun up!" gives it back (COMBAT §25.19.5)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: SEED, tier: 'tierone', setup: 'go' }), s = g.state, H = s.armoury.range.house, W = H.two;
      // (his rifle's chamber the coach's dummy: his first pull on his man clicks)
      const gun = s.items[s.people[W.pid].kit.worn.sling];
      gun.chamber = 'dud'; gun.set = 'dud';
      const bot = houseHonestBot(), seen = { line: null, covered: null, gunUp: null };
      runHouse(g, bot, { maxMs: 60_000, each: (game) => {
        const st = game.state, L = instinctNow(st).line;
        if (L?.id === 'cqb-two-down' && !seen.line) seen.line = { act: L.act, text: L.text, down: !!st.armoury.range.house.two.down };
        if (st.armoury.range.house.two.coveredBy && !seen.covered) seen.covered = { atMs: st.clock.ms, head: meOf(st).headRad };
        for (const f of game.facts('say')) if (f.who === W.pid && f.text === 'Gun up!' && seen.covered && !seen.gunUp) seen.gunUp = { coveredBy: st.armoury.range.house.two.coveredBy ?? null };
        for (const f of game.facts('say')) if (f.who === st.player.id && f.text === 'Covering!' && seen.line && !seen.covering) seen.covering = { atMs: st.clock.ms };
      } });
      console.log(`      ${JSON.stringify(seen)}; your "Covering!" ${seen.covering && seen.covered ? `${seen.covered.atMs - seen.covering.atMs} ms before his sector was yours` : 'never'}`);
      assert(seen.line?.act === 'stop:team:cover' && seen.line.down && seen.covered && seen.gunUp && seen.gunUp.coveredBy === null, JSON.stringify(seen));
      assert(seen.covering && seen.covering.atMs <= seen.covered.atMs, JSON.stringify(seen));
    },
  },
  {
    name: 'MAKE READY racks the P-12 and SHOW CLEAR clears it, the pistol last (COMBAT §25.19.6: "one macro each"): the sergeant from the fill reaches GO with it in Condition 1 in its holster and the card with it in Condition 4; the lane\'s rounds left count it',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: SEED, tier: 'sgt' }), s = g.state, pid = s.player.id, P = pistolOf(s);
      const n0 = roundsLeft(s);
      let atGo = null, macros = new Set();
      const r = runHouse(g, houseHonestBot(), { each: (game) => {
        const st = game.state, d = st.stop?.doing;
        if (d?.list && d.step?.startsWith('macro:')) macros.add(`${d.step}: ${d.list.filter(a => a.startsWith('pistol:')).join(' ') || '-'}`);
        if (atGo === null && st.armoury.range.house.goAtMs !== null) atGo = { cond: conditionOf(st.items[P]), holster: st.people[pid].kit.worn.holster === P, left: roundsLeft(st) };
      } });
      const end = { cond: conditionOf(s.items[P]), mag: s.items[P].mag ?? null, chamber: gunField(s.items[P], 'chamber'), holster: s.people[pid].kit.worn.holster === P };
      console.log(`      the rounds at the fill ${n0} (the rifle's 30, the P-12's 20); the macros ${[...macros].join(' · ')}; at GO ${JSON.stringify(atGo)}; at the card ${JSON.stringify(end)}; done ${r.done}`);
      assert(n0 === 50 && atGo?.cond === 1 && atGo.holster && atGo.left === 50, JSON.stringify({ n0, atGo }));
      assert(r.done && end.cond === 4 && end.holster && [...macros].some(m => m.startsWith('macro:ready: pistol:ready')) && [...macros].some(m => /macro:(clear|unload): pistol:clear/.test(m)), JSON.stringify({ end, macros: [...macros] }));
    },
  },
];
