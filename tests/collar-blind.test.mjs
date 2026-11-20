// OLYMPUS tests: collar-blind, "Away the boarding party"'s gauge F158, blind fire (its build sheet item 6, §5, §6 A, §8; COMBAT §7.11; DF§5; FT§4.2).
//
// An irregular who chose blind fire (opfor.js CHOICE_TABLES.irregular's cover-or-blind cell) fires only from behind his cover and only
// while a marine not down is in his own compartment (the ship's room he stands in): st 'blind' exactly then, read FIRING BLIND (men.js
// liveStateOf 'firing-blind', plaque.js STATE_WORDS), one round every BLIND_GAP_MS 700 at the nearest such marine, each with shot.js
// BLIND_FIRE_MOD −10 on its roll ('firing blind'), no take-in and no sighting while he does (his eyes down: nothing remembered, nothing
// known); the shock stops it until it ends. On the hauler's bunk room (tests/boarding-men.mjs: 3a and 3b, pirates,
// you and Four at its hatch in the passage). Fails without blindTick (no round, or rounds from the open), without the modifier, or with
// FIRING BLIND read while he waits behind cover.
import { assert } from './helpers.mjs';
import { boardingMen } from './boarding-men.mjs';
import { blindTick, BLIND_GAP_MS } from '../src/sim/scenarios/opfor.js';
import { BLIND_FIRE_MOD, modsOf } from '../src/sim/arms/shot.js';
import { liveStateOf, bodyDown, marineTarget } from '../src/sim/combat/men.js';
import { roomOf } from '../src/sim/places/model.js';
import { CQB_RULES } from '../src/sim/skills/instinct/cqb.js';
import { STATE_WORDS } from '../src/ui/plaque.js';
import { gunOn } from '../src/sim/arms/shooting.js';

// (a man made to have chosen blind fire behind his cover at his hide: his choice and band as choiceTick writes them, felt calm so the
// dwell rolls nothing again)
function blindMan(w, stand) {
  const T = w.man(stand), L = T.live, a = w.actor(stand), S = { hide: null };
  L.choice = { what: 'blind', band: 0, atMs: w.s.clock.ms }; L.band = 0; L.st = 'cover'; L.dashed = true; L.fromMs = w.s.clock.ms;
  a.stance = 'kneel';
  return { T, L, a, S };
}

export default [
  {
    name: 'collar-blind: blind fire only from behind his cover with a marine in his compartment: st \'blind\' and FIRING BLIND exactly then, a round every 700 ms at the nearest marine there, no take-in and no sighting while he fires; none with the marines outside, none while shocked (and again once the shock is over) (fails without blindTick or with FIRING BLIND read behind cover)',
    fn() {
      const w = boardingMen({ seed: 48213, holdouts: 'pirates', stands: ['3a', '3b'], room: 'bunks' }), s = w.s, off = [];
      w.H.goAtMs = s.clock.ms;
      const { T, L } = blindMan(w, '3a'), me = w.me(), two = w.two();
      const shots = () => (w.H.live.shots ?? []).filter(x => x.by === T.key);
      const tally = { outside: 0, inside: 0, wordOff: 0, eyes: 0 }, times = [];
      // (the marines in the passage: nothing)
      for (let i = 0; i < 40; i++) { w.tick(); if (L.st === 'blind') tally.outside++; if ((liveStateOf(s, T) === 'firing-blind') !== (L.st === 'blind')) tally.wordOff++; }
      const before = shots().length, known0 = JSON.stringify(L.known), seen0 = JSON.stringify(L.seen);
      // (you into the bunk room, Four left in the passage: he is 'blind' exactly while a marine not down is in his compartment (the ship's
      // room he stands in, as the area places it), read off the world's own records each tick)
      me.x = 6.2; me.z = 7.4; me.$px = me.x; me.$pz = me.z;
      const room = (x, z) => roomOf(s.places.live.area, x, z)?.id ?? null, his = () => room(w.actor('3a').x, w.actor('3a').z);
      const there = () => [s.player.id, w.twoPid].filter(Boolean).some(pid => { const m = pid === s.player.id ? me : two; return m && room(m.x, m.z) === his() && !bodyDown(s, pid, s.clock.ms); });
      for (let i = 0; i < 60; i++) {
        // (what his brain reads at the tick's start: a decision made in a tick acts in it, read against the world it began with)
        const was = there();
        w.tick();
        if (L.st === 'blind') tally.inside++;
        if ((L.st === 'blind') !== was) tally.exactOff = (tally.exactOff ?? 0) + 1;
        if ((liveStateOf(s, T) === 'firing-blind') !== (L.st === 'blind')) tally.wordOff++;
        if (L.eyes) tally.eyes++;
      }
      const mine = shots().slice(before);
      for (let i = 1; i < mine.length; i++) times.push(mine[i].atMs - mine[i - 1].atMs);
      const atYou = mine.filter(x => x.at === `m:${s.player.id}`).length, allBlind = mine.every(x => x.blind === true);
      // (out again: back behind his cover, nothing more)
      me.x = 5.0; me.z = 4.75; me.$px = me.x; me.$pz = me.z;
      const n2 = shots().length;
      for (let i = 0; i < 30; i++) w.tick();
      const after = shots().length - n2, stAfter = L.st;
      console.log(`      3a behind his cover: marines in the passage 40 ticks, blind ${tally.outside}; you in the bunk room 60 ticks: blind ${tally.inside} (off 'a marine up in his compartment' ${tally.exactOff ?? 0}; you down ${bodyDown(s, s.player.id, s.clock.ms)}), ${mine.length} rounds (at you ${atYou}, all blind ${allBlind}), gaps ${[...new Set(times)].join(', ')} ms (BLIND_GAP_MS ${BLIND_GAP_MS}); his eyes taken in ${tally.eyes} ticks, known ${known0} → ${JSON.stringify(L.known)}, seen ${seen0 === JSON.stringify(L.seen) ? 'unchanged' : 'changed'}; out again: ${after} rounds, st ${stAfter}; FIRING BLIND read off its state ${tally.wordOff} ticks; the plaque's word ${STATE_WORDS['firing-blind']}; Four ${two ? 'in the passage' : 'none'}`);
      if (tally.outside || after || stAfter !== 'cover' || tally.exactOff || !tally.inside || mine.length < 2 || times.some(t => t !== BLIND_GAP_MS) || atYou !== mine.length || !allBlind || tally.eyes || tally.wordOff || seen0 !== JSON.stringify(L.seen) || known0 !== JSON.stringify(L.known) || STATE_WORDS['firing-blind'] !== 'FIRING BLIND') off.push({ tally, mine: mine.length, times, after, stAfter });
      // (the shock stops it: a startle (the stun of his block) puts him behind his cover, no round until it ends)
      const blk = (w.actor('3a').combat ??= {});
      blk.stunUntilMs = s.clock.ms + 1000;
      me.x = 6.2; me.z = 7.4;
      delete s.people[s.player.id].body; delete me.stance;
      const n3 = shots().length;
      let shockedBlind = 0;
      for (let i = 0; i < 18; i++) { w.tick(); if (L.st === 'blind') shockedBlind++; }
      const shockedRounds = shots().length - n3, word = liveStateOf(s, T);
      const n4 = shots().length;
      for (let i = 0; i < 20; i++) w.tick();
      const resumed = shots().length - n4;
      console.log(`      a stun of 1 s on him, you whole in the room: blind ${shockedBlind} of 18 ticks, ${shockedRounds} rounds (read ${word}); the stun over, ${resumed} rounds in 1 s (st ${L.st})`);
      if (shockedBlind || shockedRounds || word !== 'dazed' || !resumed) off.push({ shockedBlind, shockedRounds, word, resumed });
      assert(!off.length, JSON.stringify(off));
    },
  },
  {
    name: 'collar-blind: every blind round\'s roll carries shot.js BLIND_FIRE_MOD −10 (\'firing blind\'), and no aimed round does; the man\'s gun goes off safe to fire it and its count falls by one a round (fails without the modifier)',
    fn() {
      const w = boardingMen({ seed: 7, holdouts: 'pirates', stands: ['3a', '3b'], room: 'bunks' }), s = w.s;
      w.H.goAtMs = s.clock.ms;
      const { T, a } = blindMan(w, '3b'), me = w.me();
      me.x = 6.2; me.z = 7.4; me.$px = me.x; me.$pz = me.z;
      const gun = s.items[gunOn(s, T.live.who)], n0 = s.items[gun.mag]?.n ?? 0, mods = [];
      for (let i = 0; i < 6; i++) {
        s.clock.ms += BLIND_GAP_MS;
        const shot = blindTick(s, w.bus, w.R, w.H, w.H.live, T, a, s.clock.ms);
        if (shot?.fired) mods.push((shot.roll?.mods ?? []).filter(m => m.why === 'firing blind').map(m => m.v));
        // (each round on a marine whole again: a round that put you down would end his blind fire, which the first case holds)
        delete s.people[s.player.id].body; delete me.stance;
      }
      const plain = modsOf(s, T.live.who, { gunId: gun.id, target: marineTarget(s, s.player.id, a, s.clock.ms), part: 'torso' }).some(m => m.why === 'firing blind');
      const n1 = s.items[gun.mag]?.n ?? 0;
      console.log(`      3b, six blind rounds by blindTick: the modifier on each ${JSON.stringify(mods)} (BLIND_FIRE_MOD ${BLIND_FIRE_MOD}); an aimed roll's list carries it ${plain}; his magazine ${n0} → ${n1}, his gun ${gun.mode}`);
      assert(mods.length === 6 && mods.every(m => m.length === 1 && m[0] === BLIND_FIRE_MOD) && BLIND_FIRE_MOD === -10 && !plain && n0 - n1 === 6 && gun.mode === 'semi', JSON.stringify({ mods, plain, n0, n1 }));
    },
  },
  {
    name: 'collar-blind: T\'s lines over the boarding\'s men (instinct/cqb.js, under A\'s anchor): cqb-rp-blind urgent with no act (the pair left to you, as cqb-rp-dazed), cqb-rp-flee warn with no act, cqb-rp-crew warn with the Challenge or the aim onto him; four words a tier each (a line is text at T\'s chip and the panel: no voice since v0.0.24)',
    fn() {
      const R = Object.fromEntries(CQB_RULES.map(r => [r.id, r])), rows = [], off = [];
      for (const [id, tone, keys] of [['cqb-rp-blind', 'urgent', ['1', '2', '3']], ['cqb-rp-flee', 'warn', ['1', '2', '3']], ['cqb-rp-crew', 'warn', ['crew1', 'crew2', 'crew3', 'crewOnto1', 'crewOnto2', 'crewOnto3']]]) {
        const r = R[id], n = keys.map(k => r?.text?.[k]?.length ?? 0);
        rows.push(`${id} ${r?.tone} ${keys.map((k, i) => `${k}:${n[i]}`).join(' ')} "${r?.text?.[keys[0]]?.[0]}"`);
        if (!r || r.tone !== tone || n.some(x => x !== 4)) off.push(id);
      }
      const order = CQB_RULES.map(r => r.id), noAct = [R['cqb-rp-blind']?.act({}), R['cqb-rp-flee']?.act({})];
      console.log(`      ${rows.join('; ')}; acts ${JSON.stringify(noAct)}; cqb-rp-crew before cqb-rp-hands ${order.indexOf('cqb-rp-crew') < order.indexOf('cqb-rp-hands')}`);
      assert(!off.length && noAct.every(x => x === null) && order.indexOf('cqb-rp-crew') < order.indexOf('cqb-rp-hands'), JSON.stringify(off));
    },
  },
];
