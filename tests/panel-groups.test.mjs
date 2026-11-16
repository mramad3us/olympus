// OLYMPUS tests: the step panel by groups (VIEWS §7.8; COMBAT §25.19.7, the shoot house's rework R7; src/sim/arms/groups.js): the
// model built once over every stop the bots meet in the house and the scored scenes, laid out by the three layouts. The user's
// note on v0.0.12 (2026-11-11): "group them by type and find a clever way to make this manageable with top of the head core
// gameplay options being always visible and accessible (even if grayed out, like hammer if you only have one bullet)".
// Pinned: every row has a group and a slot it keeps (the stability count against v0.0.13's paged panel); the core five at every
// stop on their fixed keys in each layout; a struck row keeps its slot with its badge, a remedy's badge pointing at a key that
// holds the remedy; Hammer struck "▮1" with one round left; every key path the panel gives resolves to its row (T's act's in each
// layout, with NEXT and by its own place); the DI's keys follow the layout played (state.$panel, never saved); the press model
// over the bots' choices, printed against v0.0.13's pages; layout B's banks on physical keys labelled the same on AZERTY.
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assert, fmt, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, houseKeysBot, runHouse } from './bots/house.mjs';
import { pairsBot } from './bots/pairs.mjs';
import { stressBot } from './bots/stress.mjs';
import { rangeBot } from './bots/range.mjs';
import { kdBot } from './bots/kd.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { panelOf } from '../src/sim/arms/panel.js';
import { modelOf, viewOf, keyPathOf, resolvePath, placesOf, coreKeys, badgeKey, badgeOf, layoutIn, keyOn, situationOf, LAYOUTS, CORE, GROUPS, BANK_CODES, BANK_KEYS, DEFAULT_LAYOUT } from '../src/sim/arms/groups.js';
import { houseKitBot } from './bots/kit.mjs';
import { label } from '../src/core/keys.js';
import { playerActor } from '../src/core/ids.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { move as kitMove } from '../src/sim/arms/kit.js';
import { setSt } from '../src/sim/arms/devices.js';
import { stepAct } from './bots/lib.mjs';
import { HANDBACK_WORDS } from '../src/sim/combat/bundle.js';

// (a verb: a row's id without its target or way, 'door:push>d1' → 'door:push', 'shot:pair@moving' → 'shot:pair')
const verb = (id) => String(id).replace(/>.*$/, '').replace(/@.*$/, '');
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const pct = (a, b) => `${fmt((100 * a) / Math.max(1, b), 1)}%`;
// (v0.0.13's presses for a row: its page's 0s and its digit; null off every page)
function oldPresses(steps, id) {
  const p0 = panelOf(steps);
  for (let k = 0; k < p0.pages; k++) if (panelOf(steps, { page: k }).slots.some(sl => sl.step.id === id || sl.step.rows?.some(r => r.id === id))) return k + 1;
  return null;
}

/** Every stop the bots meet ('choose', no reflex card): { scene, steps, act, model, chosen (the row the bot's line names) }. */
function stops({ wide = false } = {}) {
  const out = [];
  const watch = (scene) => {
    let was = false;
    return (st) => {
      const S = st.stop, ch = !!S && S.mode === 'stop' && S.phase === 'choose' && !S.reflex;
      if (ch && !was) {
        const line = instinctNow(st).line, steps = stepsOf(st), act = line?.act ?? null;
        const actId = act?.startsWith('stop:') && !act.startsWith('stop:reflex') ? act.slice(5) : null;
        out.push({ scene, steps, act, actId, line: line?.id ?? null, model: modelOf(steps, { act }) });
      }
      was = ch;
    };
  };
  const run = (scene, opts, bot, ticks = 40000) => {
    const g = createGame({ scenario: scene, ...opts }), w = watch(scene);
    const b = (s, me, mem) => { w(s); return bot(s, me, mem); };
    if (scene === 'test-shoothouse') { runHouse(g, b); return; }
    for (let i = 0; i < ticks; i++) { g.step(1, b); if (g.state.armoury?.range?.end) break; }
  };
  const seeds = wide ? [1489397426, 1037, 1074, 1111, 1148] : [1489397426, 1037];
  for (const tier of wide ? ['cpl', 'sgt', 'raider', 'tierone'] : ['cpl', 'tierone']) for (const seed of seeds) run('test-shoothouse', { seed, tier, setup: 'go' }, houseHonestBot());
  run('test-shoothouse', { seed: 48213, tier: 'private', setup: 'go' }, houseKeysBot());
  if (wide) run('test-shoothouse', { seed: 48213, tier: 'recruit', setup: 'go' }, houseKeysBot());
  run('test-pairs', { seed: 48213, tier: 'private' }, pairsBot());
  run('test-stress', { seed: 48213, tier: 'private' }, stressBot());
  run('test-handling', { seed: 48213, hour: 9 }, rangeBot());
  run('test-range', { seed: 48213 }, kdBot(), 200000);
  return out;
}
let memo = null;
const quickStops = () => (memo ??= stops());

// (v0.0.19, kit D2: every AT THE DOOR stop of a lane by the kit's bot from the fill, with its five and the keys of Breach and
// Enter there, beside what v0.0.18's five (no `five` on the rows) would have put on them)
function doorStops(loadout, { use = 'breach', base = 'honest', tier = 'cpl', seed = 48213 } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, loadout }), out = [];
  let was = false;
  const inner = houseKitBot({ use, base });
  runHouse(g, (st, me, mem) => {
    const S = st.stop, ch = !!S && S.mode === 'stop' && S.phase === 'choose' && !S.reflex;
    if (ch && !was) {
      const steps = stepsOf(st), act = instinctNow(st).line?.act ?? null, model = modelOf(steps, { act });
      if (model.situation.id === 'door' && !model.situation.hall) {
        const old = modelOf(steps.map(r => { const { five, ...rest } = r; return rest; }), { act });
        const breach = model.groups.DRILL.slots[5]?.row, enter = model.groups.DRILL.slots[7]?.row;
        out.push({ five5: model.situation.five[4]?.row?.id ?? null, breach5: !!model.situation.breach, breachKeys: breach ? keyPathOf(model, 'c', breach.id, { next: false })?.join(' › ') : null, enterKeys: enter ? keyPathOf(model, 'c', enter.id, { next: false })?.join(' › ') : null,
          oldBreach: breach ? keyPathOf(old, 'c', breach.id, { next: false })?.join(' › ') : null, oldEnter: enter ? keyPathOf(old, 'c', enter.id, { next: false })?.join(' › ') : null, breachId: breach?.id ?? null, enterId: enter?.id ?? null, five: model.situation.five.map(e => e.row?.id ?? null) });
      }
    }
    was = ch;
    return inner(st, me, mem);
  });
  return { stops: out, five: g.state.armoury.range.house.five ?? null, end: g.state.armoury.range.house.end?.why ?? null };
}
// (a lane's door stops checked: Breach on 5 at every one where the lane carries a charge or a tool, Enter on 5 elsewhere, never both in one lane)
// (the hall's leg has no door to breach: THE HALL keeps v0.0.18's five, Enter on 5, and is left out here)
function fiveCase(loadout, opts) {
  const L = doorStops(loadout, opts), want = loadout === 'breach' || loadout === 'full';
  const bad = L.stops.filter(x => (want ? !(x.breach5 && x.five5 === x.breachId) : x.breach5 || (x.enterId && x.five5 !== x.enterId)));
  const flips = new Set(L.stops.map(x => x.breach5)).size;
  const keys = [...new Set(L.stops.map(x => `Breach ${x.oldBreach ?? '-'} → ${x.breachKeys ?? '-'}, Enter ${x.oldEnter ?? '-'} → ${x.enterKeys ?? '-'}`))];
  console.log(`      ${loadout} (${opts?.base ?? 'honest'}, ${opts?.tier ?? 'cpl'}, ${opts?.seed ?? 48213}): R.house.five ${L.five ?? 'none'}; ${L.stops.length} door stops, Breach on 5 at ${L.stops.filter(x => x.breach5).length}; the five's state ${flips > 1 ? 'CHANGED' : 'one'} in the lane; the lane ${L.end}; re-pinned keys (v0.0.18 → now): ${keys.join(' | ')}`);
  assert(L.stops.length > 0 && !bad.length && flips === 1 && L.end === 'clear', JSON.stringify({ bad: bad.slice(0, 3), flips, n: L.stops.length, end: L.end }));
  return L;
}

function checkPlaces(list) {
  // (each verb's numbered slots within its group (DRILL by its half): never two; the third level is not a slot)
  const at = new Map(), oldAt = new Map();
  for (const x of list) {
    for (const p of placesOf(x.model)) {
      if (p.slot === 'deep') continue;
      const key = `${verb(p.id)}|${p.group}${p.group === 'DRILL' ? `:${x.model.half}` : ''}`;
      if (!at.has(key)) at.set(key, new Set());
      at.get(key).add(p.slot);
    }
    // (v0.0.13's places of the same verbs: page and digit)
    const p0 = panelOf(x.steps);
    for (let k = 0; k < p0.pages; k++) for (const sl of panelOf(x.steps, { page: k }).slots) {
      const v = verb(sl.step.id);
      if (!oldAt.has(v)) oldAt.set(v, new Set());
      oldAt.get(v).add(`${k}:${sl.key}`);
    }
  }
  const moved = [...at.entries()].filter(([, s]) => s.size > 1).map(([k, s]) => `${k} on ${[...s].join(', ')}`);
  return { at, oldAt, moved };
}

export default [
  {
    name: 'every row stepsOf offers has its group and its slot, and keeps it (VIEWS §7.8.1: "a verb keeps its slot in every scene that has it"): over the house\'s honest lanes, the keys lane and the scored scenes, no verb on two numbered slots of its group; v0.0.13\'s places of the same verbs printed (Fire on 33 in the audit)',
    fn() {
      const list = quickStops(), { at, oldAt, moved } = checkPlaces(list);
      const old = (v) => oldAt.get(v)?.size ?? 0;
      console.log(`      ${list.length} stops (${Object.entries(list.reduce((o, x) => ((o[x.scene] = (o[x.scene] ?? 0) + 1), o), {})).map(([k, n]) => `${k} ${n}`).join(', ')}); ${at.size} verbs on a numbered slot, ${moved.length} on two`);
      console.log(`      v0.0.13's places (page and digit) of the same verbs: Fire ${old('fire')}, Aim ${old('aim')}, Pair ${old('shot:pair')}, "Clear!" ${old('call:clear')}, Top up ${old('macro:reload:tactical')}, High ready ${old('posture:highReady')}; now one each`);
      // (no row ever off the panel: each row of every stop on a slot or its group's third level)
      let lost = 0;
      for (const x of list) { const ids = new Set(placesOf(x.model).map(p => p.id)); for (const s of x.model.rows) if (!ids.has(s.id)) lost++; }
      assert(!moved.length && !lost, JSON.stringify({ moved: moved.slice(0, 8), lost }));
    },
  },
  {
    name: 'the core five at every stop, each on its fixed key in every layout (VIEWS §7.8.1: the shot, Aim ⇄ Hold, Fix, the muzzle, NEXT; A on 1 to 5, B and C on 6 to 0), NEXT live exactly when T has an act, Fix the remedy where a shot is struck for the gun\'s state',
    fn() {
      const list = quickStops(), bad = [], fixes = {};
      for (const x of list) for (const L of LAYOUTS) {
        const v = viewOf(x.model, L, {}), keys = coreKeys(L);
        for (const c of CORE) {
          const e = v.keys.find(k => k.key === keys[c])?.entry;
          if (!e || e.core !== c) bad.push(`${x.scene} ${L}: ${c} not on ${keys[c]}`);
          else if (c !== 'next' && !e.row && !e.words) bad.push(`${x.scene} ${L}: ${c} empty`);
          else if (c === 'next' && !!e.live !== !!x.act) bad.push(`${x.scene} ${L}: NEXT live ${e.live} with act ${x.act}`);
        }
        if (L === DEFAULT_LAYOUT) { const f = x.model.core.fix.row; fixes[f?.label ?? '-'] = (fixes[f?.label ?? '-'] ?? 0) + 1; }
      }
      // (a shot struck for the gun's state: Fix is its remedy, live)
      let remedied = 0, unoffered = 0;
      for (const x of list) {
        const st = x.model.rows.find(s => (s.kind === 'shot' || s.id === 'fire') && /off safe first|^on safe$|a stoppage|chamber (empty|unknown)|RELOAD first/.test(String(s.off ?? '')));
        if (!st) continue;
        const f = x.model.core.fix.row, lifts = x.model.rows.filter(s => /^(macro:(ready|ia|remedial|reload:.*)|release|charge|pressCheck|selector:semi)$/.test(s.id) && !s.off);
        // (a stand-in only where nothing that lifts it is offered: the string's end, one magazine a string; v0.0.18: it carries the
        // planner's reason, no rounds believed anywhere or the course's one magazine a string, never "nothing offered now")
        if (!f || (f.kind === 'stand' ? lifts.length || !/^(no rounds|one magazine a string)$/.test(String(f.off)) : f.off)) bad.push(`${x.scene}: ${st.label} struck "${st.off}" and Fix ${f?.label ?? 'none'} (${f?.off ?? ''}) with ${lifts.map(s => s.id).join(', ')} offered`);
        else if (f.kind !== 'stand') remedied++;
        else unoffered++;
      }
      console.log(`      ${list.length} stops × 3 layouts; Fix by what it was: ${Object.entries(fixes).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')}; a shot struck for the gun and Fix its live remedy ${remedied}, nothing that lifts it offered (Fix struck: the tower's next) ${unoffered}`);
      assert(!bad.length, JSON.stringify(bad.slice(0, 8)));
    },
  },
  {
    name: 'greyed, never removed (VIEWS §7.8.1\'s table): every struck row on the panel carries a badge, and a remedy\'s badge (→ and a key) names the key of the aim or of Fix, which holds a row other than the struck one',
    fn() {
      const list = quickStops(), kinds = {}, bad = [];
      for (const x of list) for (const g of GROUPS) for (const e of x.model.groups[g].slots) {
        if (!e?.row?.off) continue;
        if (!e.badge) { bad.push(`${x.scene} ${g} ${e.slot}: ${e.row.label} struck "${e.row.off}" with no badge`); continue; }
        kinds[e.badge.t] = (kinds[e.badge.t] ?? 0) + 1;
        if (e.badge.t === 'to') for (const L of LAYOUTS) {
          const k = badgeKey(e.badge, L), target = viewOf(x.model, L, {}).keys.find(z => z.key === k)?.entry;
          if (!k || !target?.row || target.row.id === e.row.id) bad.push(`${x.scene} ${L}: ${e.row.label} → ${k} holds ${target?.row?.label ?? 'nothing'}`);
        }
      }
      console.log(`      badges: ${Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')}`);
      assert(!bad.length && kinds.to > 0, JSON.stringify(bad.slice(0, 8)));
    },
  },
  {
    name: 'Hammer struck "▮1" with one round left (the user\'s example, 2026-11-11: "even if grayed out, like hammer if you only have one bullet"): on Bang\'s fourth string, the one-round magazine, the corporal (Hammer is his from Marksmanship 12) at the pause Hammer keeps FIRE 2 and C\'s CONTACT 2, struck with a round\'s badge of 1; Pair the same',
    fn() {
      const g = createGame({ scenario: 'test-stress', seed: 48213, tier: 'cpl', setup: 'standby:4' }), bot = stressBot();
      let seen = null;
      for (let i = 0; i < 20 * 60 * 3 && !seen; i++) {
        g.step(1, bot);
        const S = g.state.stop;
        if (!S || S.mode !== 'stop' || S.phase !== 'choose' || S.reflex) continue;
        const steps = stepsOf(g.state), h = steps.find(s => /^shot:hammer/.test(s.id));
        if (h?.off && /left/.test(h.off)) seen = modelOf(steps);
      }
      assert(seen, 'no pause with Hammer struck for its rounds');
      const fire2 = seen.groups.FIRE.slots[2], c2 = seen.situation.five[1], pair = seen.groups.FIRE.slots[1];
      console.log(`      FIRE 2: ${fire2.row.label} (${fire2.row.off}) badge ${JSON.stringify(fire2.badge)}; C's ${seen.situation.name} 2: ${c2.row?.label}; FIRE 1: ${pair.row.label} (${pair.row.off ?? 'live'})`);
      assert(fire2.badge?.t === 'rounds' && fire2.badge.n === 1 && seen.situation.id === 'contact' && c2.row?.id === fire2.row.id, JSON.stringify({ fire2, c2 }));
    },
  },
  {
    name: 'every key path resolves to its row (VIEWS §7.8.1: "the DI\'s line always names a key that works"): T\'s act at every stop, in each layout, by NEXT and by its own place, pressed from the stop\'s start (A\'s FIRE drawer open at a contact) reaches the act\'s row; every row of the model too',
    fn() {
      const list = quickStops(), bad = [];
      let n = 0, all = 0;
      for (const x of list) for (const L of LAYOUTS) {
        if (x.model.actId) {
          for (const next of [true, false]) {
            const p = keyPathOf(x.model, L, x.model.actId, { next }), r = p ? resolvePath(x.model, L, p) : null;
            const got = r?.next ? r.row?.id : r?.id;
            n++;
            if (got !== x.model.actId) bad.push(`${x.scene} ${L} ${next ? 'NEXT' : 'place'}: ${x.model.actId} by ${p?.join(' ')} reaches ${got}`);
          }
        }
        for (const s of x.model.rows) {
          const p = keyPathOf(x.model, L, s.id, { next: false }), r = p ? resolvePath(x.model, L, p) : null;
          all++;
          if (r?.id !== s.id) bad.push(`${x.scene} ${L}: ${s.id} by ${p?.join(' ')} reaches ${r?.id}`);
        }
      }
      console.log(`      T's act: ${n} paths (3 layouts, NEXT and its place); every row: ${all} paths; wrong ${bad.length}`);
      assert(!bad.length, JSON.stringify(bad.slice(0, 8)));
    },
  },
  {
    name: 'the press model (VIEWS §7.8.5: "the audit\'s choices replayed"): the bots\' choices (T\'s act, the shot their line names) by their own place in each layout against v0.0.13\'s pages: fewer presses in layout C on the lane than v0.0.13, at most four keys, and T\'s act one press on NEXT everywhere',
    fn() {
      const list = quickStops(), by = { a: [], b: [], c: [], old: [] }, lane = { a: [], b: [], c: [], old: [] };
      for (const x of list) {
        const id = x.model.actId ?? (x.model.situation.id === 'contact' ? x.model.rows.find(s => s.kind === 'shot' && !s.off)?.id : null);
        if (!id) continue;
        const o = oldPresses(x.steps, id);
        if (o) { by.old.push(o); if (x.scene === 'test-shoothouse') lane.old.push(o); }
        for (const L of LAYOUTS) { const p = keyPathOf(x.model, L, id, { next: false }); if (p) { by[L].push(p.length); if (x.scene === 'test-shoothouse') lane[L].push(p.length); } }
      }
      const line = (k, xs) => `${k} ${fmt(mean(xs), 2)} a choice, ${pct(xs.filter(v => v === 1).length, xs.length)} in one, max ${Math.max(...xs)}`;
      console.log(`      every scene (${by.c.length} choices): ${['old', ...LAYOUTS].map(k => line(k === 'old' ? 'v0.0.13' : k.toUpperCase(), by[k])).join('; ')}`);
      console.log(`      the house's lane (${lane.c.length}): ${['old', ...LAYOUTS].map(k => line(k === 'old' ? 'v0.0.13' : k.toUpperCase(), lane[k])).join('; ')}`);
      assert(mean(lane.c) < mean(lane.old) && Math.max(...by.a, ...by.b, ...by.c) <= 4 && list.every(x => !x.model.actId || LAYOUTS.every(L => keyPathOf(x.model, L, x.model.actId)?.length === 1)), JSON.stringify({ c: mean(lane.c), old: mean(lane.old) }));
    },
  },
  {
    name: 'the DI\'s keys follow the layout played (state.$panel, a runtime key: never saved): on the armoured string "To the head" is 4 in C (CONTACT\'s five), 5 in A (FIRE\'s drawer open by itself) and 5 in B (the shots on 1 to 5), each reaching the head row; a save carries no $panel',
    fn() {
      const said = {};
      for (const L of LAYOUTS) {
        const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby:3' }), s = g.state, bot = pairsBot();
        s.$panel = L;
        let line = null, steps = null;
        for (let n = 0; n < 20 * 60 * 2 && !line; n++) {
          g.step(1, bot);
          const l = instinctNow(s).line;
          if (l?.id === 'pairs-still-up' && s.stop?.phase === 'choose') { line = l.text; steps = stepsOf(s); }
        }
        const head = steps?.find(x => x.id === 'shot:head'), key = head ? keyOn(steps, head.id, { layout: layoutIn(s) }) : null;
        const r = key ? resolvePath(modelOf(steps), L, key.split(' › ')) : null;
        said[L] = { line, key, reaches: r?.id ?? null, saved: JSON.stringify(g.save()).includes('$panel') };
      }
      console.log(`      ${LAYOUTS.map(L => `${L.toUpperCase()}: "${said[L].line}" (${said[L].key} reaches ${said[L].reaches})`).join(' · ')}`);
      assert(said.c.key === '4' && said.a.key === '5' && said.b.key === '5' && LAYOUTS.every(L => said[L].line?.includes(`: ${said[L].key}.`) && said[L].reaches === 'shot:head' && !said[L].saved), JSON.stringify(said));
    },
  },
  {
    name: 'layout B\'s banks on physical keys (R, C, B, F by KeyR, KeyC, KeyB, KeyF), labelled the same on AZERTY and QWERTY; C\'s fan on Tab; every layout\'s digits by code',
    fn() {
      const rows = Object.entries(BANK_CODES).map(([code, g]) => ({ code, g, az: label(code, { layout: 'azerty' }), qw: label(code, { layout: 'qwerty' }), want: BANK_KEYS[g] }));
      console.log(`      ${rows.map(r => `${r.code} ${r.g}: AZERTY ${r.az}, QWERTY ${r.qw}`).join(' · ')}; Tab ${label('Tab', { layout: 'azerty' })}`);
      assert(rows.every(r => r.az === r.want && r.qw === r.want) && label('Tab', { layout: 'azerty' }) === 'Tab', JSON.stringify(rows));
    },
  },
  {
    name: 'on v0.0.18\'s breach lane Breach is on 5 (the build sheet 0.0.19 §6 K-face, §0 item 25: P3 as the user drew it, on a lane whose kit carries a charge or a tool), and the five never changes within the lane: the corporal by the kit\'s bot on 48213, the re-pinned keys printed (one sheet on one seed: the full lane and the flash lane, where Enter keeps 5, are the heavy case\'s)',
    fn() {
      fiveCase('breach', { use: 'breach' });
    },
  },
  {
    name: 'a live grenade is the first situation, A LIVE GRENADE, Throw on 1 and Throw it clear on 2; HANDS FULL for a device in the hands, Throw, Cook 2, Pin back in, Pouch it (Let it go for a tool) and Fix on 1 to 5 (kit2 §2.7), each on the row the sim makes (stepsOf at room 1\'s stack: a G-9P live, armed, a BC-1 held, the halligan); the badges "hands full" and "live grenade" (→ Fix), "not locked" ("open"), and a believed misfire\'s "wait 30 s" counting (seed 17\'s BC-1); and the v0.0.18 save with a G-11 armed in the hand at room 1 opens on HANDS FULL',
    timeoutMs: 60_000,
    fn() {
      // (the review of v0.0.19's K, finding 6: this case fed invented rows (dev:gren:cook:2:i9, dev:charge:recock:i28) the sim never
      // made; now each band is read off stepsOf with the device put in the hand at room 1's stack)
      const band = (lo, model, st) => {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: lo }), s = g.state;
        const me = playerActor(s), pl = lanePlanOf(s).plans['o:w4:r1']; me.x = pl.stack[0][0]; me.z = pl.stack[0][1];
        const id = Object.keys(s.items).find(k => s.items[k].model === model);
        kitMove(s, id, { pid: s.player.id, hand: 0 }); if (st) setSt(s, id, st);
        if (st === 'live') Object.assign(s.items[id], { leverAtMs: s.clock.ms, fuseAtMs: s.clock.ms + s.items[id].fuseMs });
        g.step(1);
        return modelOf(stepsOf(s), { act: instinctNow(s).line?.act ?? null });
      };
      const L = band('frag', 'g9p', 'live'), H = band('frag', 'g9p', 'armed'), C = band('cut', 'bc1', 'held'), T = band('breach', 'hal', null);
      const words = (M) => M.situation.five.map(e => `${e.words ?? '-'}${e.row ? `=${e.row.id}` : ''}`).join(' | '), at = (M, i) => M.situation.five[i]?.row?.id ?? null;
      // (a believed misfire's wait in a lane: seed 17's BC-1 at room 2, the way in set to another, its room row struck "wait N s")
      const gm = createGame({ scenario: 'test-shoothouse', seed: 17, tier: 'sgt', setup: 'room:2', loadout: 'cut' }), sm = gm.state, kb = houseKitBot({ use: 'cut' });
      for (let i = 0; i < 4000 && sm.stop?.carry?.words !== HANDBACK_WORDS.misfire; i++) gm.step(1, kb);
      gm.step(1, { act: [stepAct('drill:variant:breach')] });
      const waitOff = stepsOf(sm).find(r => /^drill:room:clear@/.test(r.id) && /^wait \d+ s$/.test(r.off ?? ''))?.off ?? null;
      const b1 = badgeOf('hands full'), b1b = badgeOf('live grenade'), b2 = badgeOf('not locked'), b3 = waitOff ? badgeOf(waitOff) : null, b4 = badgeOf('locked');
      console.log(`      a live G-9P: ${L.situation.name}: ${words(L)}`);
      console.log(`      an armed G-9P: ${H.situation.name}: ${words(H)}; a BC-1 held: ${C.situation.name}: ${words(C)}; the halligan: ${T.situation.name}: ${words(T)}`);
      console.log(`      badges: hands full ${JSON.stringify(b1)}, live grenade ${JSON.stringify(b1b)}, not locked ${JSON.stringify(b2)}, the misfire's "${waitOff}" ${JSON.stringify(b3)}, locked ${JSON.stringify(b4)}`);
      assert(L.situation.id === 'live' && at(L, 0) === 'dev:throw' && at(L, 1) === 'dev:gren:clear' && !at(L, 2) && !at(L, 3), words(L));
      assert(H.situation.id === 'hands' && at(H, 0) === 'dev:throw' && at(H, 1) === 'dev:gren:cook:2' && at(H, 2) === 'dev:repin' && at(H, 4) === 'dev:repin', words(H));
      assert(C.situation.id === 'hands' && at(C, 3) === 'dev:stow' && C.situation.five[3].words === 'Pouch it' && T.situation.id === 'hands' && at(T, 3) === 'dev:drop' && T.situation.five[3].words === 'Let it go', `${words(C)} · ${words(T)}`);
      assert(b1?.t === 'to' && b1.ref === 'fix' && b1b?.t === 'to' && b1b.ref === 'fix' && b2?.t === 'note' && b2.text === 'open' && waitOff === 'wait 30 s' && b3?.t === 'note' && b3.text === '30 s' && b3.wait === 30 && b4?.t === 'lock', JSON.stringify({ b1, b1b, b2, b3, waitOff, b4 }));
      // (the lead's save of v0.0.18: the corporal on 'flash' at room 1's stack, the G-11 armed in his hand, in stop motion)
      const json = gunzipSync(readFileSync(path.join(root, 'tests', 'saves', 'v0.0.18-house-flash.json.gz'))).toString('utf8');
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213 }), st = g.load(json), steps = stepsOf(st), M = modelOf(steps, { act: instinctNow(st).line?.act ?? null });
      const throwKeys = keyPathOf(M, 'c', 'dev:throw', { next: false })?.join(' › '), repin = keyPathOf(M, 'c', 'dev:repin', { next: false })?.join(' › ');
      console.log(`      the v0.0.18 flash save: ${M.situation.name}: ${words(M)}; Throw it on ${throwKeys}, Pin back in on ${repin}`);
      assert(M.situation.id === 'hands' && throwKeys === '1' && repin === '3', JSON.stringify({ sit: M.situation.id, throwKeys, repin }));
    },
  },
  {
    name: 'on v0.0.18\'s full lane Breach is on 5 too, by the honest and the keys bots, and the five never changes within a lane; on the flash lane Enter keeps 5 (heavy: three whole lanes)',
    heavy: true, timeoutMs: 10 * 60_000,
    fn() {
      fiveCase('full', { use: 'breach' });
      fiveCase('flash', { use: 'flash' });
      fiveCase('breach', { use: 'breach', base: 'keys', tier: 'private' });
    },
  },
  {
    name: 'wide (heavy): the five sheets\' honest lanes on five seeds, the keys lanes and the scored scenes: no verb on two slots, every key path reaching its row in every layout',
    heavy: true, timeoutMs: 15 * 60_000,
    fn() {
      const list = stops({ wide: true }), { moved } = checkPlaces(list), bad = [];
      for (const x of list) for (const L of LAYOUTS) for (const s of x.model.rows) {
        const p = keyPathOf(x.model, L, s.id, { next: false }), r = p ? resolvePath(x.model, L, p) : null;
        if (r?.id !== s.id) bad.push(`${x.scene} ${L}: ${s.id}`);
      }
      console.log(`      ${list.length} stops; verbs on two slots ${moved.length}; paths that miss ${bad.length}`);
      assert(!moved.length && !bad.length, JSON.stringify({ moved: moved.slice(0, 6), bad: bad.slice(0, 6) }));
    },
  },
];
