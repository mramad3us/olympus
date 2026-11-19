// OLYMPUS cards: the end cards' lines of the void's two scenes, "Anchor before you fire" and "Secure for burn" (the anywhere note AW§5; the build sheet v0.0.24 §1 D).
//
// Each scene's end card is cards/end.js's, given its lines here (main.js openEnd): what the course measured, said in the numbers
// the sim kept, nothing recomputed (one quantity, one helper: the recovery is the shot's, its planted twin the shot's over the
// footing's factor, the drift the body's velocity record, the burn's fall impactOf's as the gravity logged it).
//   anchorsSaid(an, { fmtS })    "Anchor before you fire"'s lines (scenarios/anchors.js anchorsNow): the summary, then a line a
//                                station: its anchor in words, its hits, its time from the command (the move to it said apart), the
//                                recovery against the planted one, the push the footing kept, and on the floating station the
//                                drift and the grab.
//   anchorsAspects(an, { fmtS }) the score card's four aspects in the course's numbers: [[aspect, words]].
//   burnSaid(bn, { fmtS })       "Secure for burn"'s lines (scenarios/burn.js burnNow): the summary, the warning and the securing,
//                                what the burn did to you, the loose gear, the surprise on the seeds that have one.
//   burnAspects(bn, { fmtS })    its three aspects, [[aspect, words]].
// Pure (no DOM): end.js builds the card from them; the injuries said in impact.js impactWords' words (the sim's one formatter).
import { impactWords } from '../../sim/body/impact.js';

/** The footing's anchors in the card's words (the course's, scenarios/anchors.js ANCHOR_WORDS, repeated: the course's module is the sim's). */
export const ANCHOR_SAID = Object.freeze({ planted: 'planted', light: 'standing light', magBoots: 'on mag boots', handhold: 'on a hold', braced: 'braced', floating: 'floating' });
/** The stations' names on the card. */
export const STATION_SAID = Object.freeze({ boots: 'Boots', lanyard: 'Lanyard', onehand: 'One hand', wedge: 'The wedge', floating: 'Floating' });
const S = (ms) => `${(ms / 1000).toFixed(1)} s`;
const ms = (v) => (Number.isFinite(v) ? `${Math.round(v)} ms` : '?');

/** A station's line (see the header). */
export function stationLine(s, { fmtS = S } = {}) {
  const name = `${s.n} ${STATION_SAID[s.id] ?? s.id}`;
  if (s.end === 'setup') return `${name}: set up, not scored`;
  if (s.end === 'passed') return `${name}: passed after ${fmtS(s.timeMs ?? 0)}, not reached ${ANCHOR_SAID[s.want] ?? s.want}${s.towed ? `, the boat's tow ×${s.towed}` : ''}`;
  const how = s.anchors.length ? s.anchors.map(a => ANCHOR_SAID[a] ?? a).join(' then ') : ANCHOR_SAID[s.want];
  const parts = [`${name}, ${how}${s.oneHand ? ', one-handed' : ''}: ${s.hits} of ${s.of} hit${s.of === 1 ? '' : 's'}${s.end === 'short' ? ` (${s.rounds} fired, the target gone)` : ''}`];
  if (Number.isFinite(s.timeMs)) parts.push(`${fmtS(s.timeMs)}${Number.isFinite(s.moveMs) ? ` (the move ${fmtS(s.moveMs)})` : ''}`);
  if (Number.isFinite(s.recoverMs)) parts.push(`recovery ${ms(s.recoverMs)} against ${ms(s.plantedMs)} planted`);
  if (Number.isFinite(s.pushMs)) parts.push(`push kept ${s.pushMs.toFixed(2)} m/s${s.spinMs ? `, spin ${s.spinMs.toFixed(2)} rad/s` : ''}`);
  if (s.id === 'floating' && s.drift) parts.push(`drift after ${s.drift.vMs.toFixed(2)} m/s, spin ${s.drift.spinRadS.toFixed(2)} rad/s`);
  if (s.id === 'floating') parts.push(s.grab ? 'a hold taken' : 'no grab: the boat fetched you');
  if (s.towed) parts.push(`the boat's tow${s.towed > 1 ? ` ×${s.towed}` : ''}`);
  return parts.join(' · ');
}

/** "Anchor before you fire"'s lines (see the header). */
export function anchorsSaid(an, { fmtS = S } = {}) {
  if (!an) return [];
  return [an.summary, ...an.stations.map(s => stationLine(s, { fmtS }))].filter(Boolean);
}

/** "Anchor before you fire"'s aspects (see the header). */
export function anchorsAspects(an, { fmtS = S } = {}) {
  if (!an) return [];
  const st = an.stations.filter(s => s.end !== 'setup' && s.end !== 'passed');
  const slow = st.filter(s => Number.isFinite(s.recoverMs) && Number.isFinite(s.plantedMs)).map(s => `${STATION_SAID[s.id]} ×${(s.recoverMs / Math.max(1, s.plantedMs)).toFixed(1)}`);
  const moves = st.filter(s => Number.isFinite(s.moveMs)).map(s => `${STATION_SAID[s.id]} ${fmtS(s.moveMs)}`);
  const total = st.reduce((a, s) => a + (s.timeMs ?? 0), 0), fl = an.stations.find(s => s.id === 'floating');
  return [
    ['anchor', slow.length ? `the recovery against planted: ${slow.join(', ')}` : 'no round fired from an anchor'],
    ['move', `${moves.length ? `the moves: ${moves.join(', ')}` : 'no station reached'}${fl?.drift ? `; the floating round left ${fl.drift.vMs.toFixed(2)} m/s` : ''}`],
    ['pace', `${st.length} station${st.length === 1 ? '' : 's'} in ${fmtS(total)}`],
    ['feel', 'the well, the float, the boots and the sound'],
  ];
}

/** "Secure for burn"'s lines (see the header). */
export function burnSaid(bn, { fmtS = S } = {}) {
  if (!bn) return [];
  const out = [bn.summary];
  // (the time is when you were first secured after the warning, the way the best you were secured by the drive's lighting: two
  // moments, said as two (the fixer of v0.0.24's play review, L3: "Secured strapped in your rack 0.0 s after the warning" for boots
  // locked before the warning and a strap made after it))
  if (bn.secured) out.push(`Secured ${fmtS(bn.secured.inMs)} after the warning; when the drive lit, ${bn.secured.how === 'strapped' ? 'strapped in your rack' : bn.secured.how === 'boots' ? 'on your mag boots' : 'on a hold'}`);
  else if (bn.warn) out.push('Not secured when the drive lit');
  const o = bn.onset;
  if (o?.what) out.push(throwLine('The burn', o, fmtS));
  if (o?.loose) out.push(`${o.loose} item${o.loose === 1 ? '' : 's'} adrift when the drive lit`);
  // (the user's score of test-burn: the warned manoeuvre, how you were secured as it came in and what it did; the boots torn off said first)
  const ev = bn.evade;
  if (ev?.atMs) out.push(`${throwLine('The manoeuvre', ev, fmtS)}${ev.how ? ` (${ev.how === 'strapped' ? 'strapped in' : ev.how === 'boots' ? 'on your mag boots' : 'on a hold'} as it came in)` : ' (not secured as it came in)'}`);
  if (bn.jink?.what) out.push(throwLine('The jink', bn.jink, fmtS));
  else if (!bn.jinks) out.push('No surprise on this seed');
  return out.filter(Boolean);
}
// (what an event did to you, in the gravity's log's words: couched, rode it, held, down, pulled off a hold, fell, slid)
function throwLine(what, o, fmtS) {
  void fmtS;
  // (impactOf's record in its own words: the worst state and the named injuries, impact.js impactWords)
  const hurt = o.injuries?.length ? `: ${impactWords(o.injuries, 'you').replace(/^you: /, '').replace(/\.$/, '')}` : '';
  const W = { couched: 'you rode it strapped in', rode: 'you rode it on your feet', held: 'you held on', down: `you went down at ${o.vMs?.toFixed(2)} m/s`, pulled: 'it pulled you off the hold', fell: `you fell ${o.fromM ? `${o.fromM.toFixed(1)} m ` : ''}to the deck at ${o.vMs?.toFixed(2)} m/s, ${o.first ?? 'body'} first`, slid: 'you slid across the deck',
    // (the user's score of test-burn: the boots torn off the deck by a push across it, and a body thrown into a face or caught on a hold)
    torn: 'your boots tore off the deck', thrown: `you were thrown into the compartment's side at ${o.vMs?.toFixed(2)} m/s`, caught: 'you caught a hold' };
  return `${what}: ${o.torn && o.what !== 'torn' ? `${W.torn}; ` : ''}${W[o.what] ?? o.what}${hurt}`;
}

/** "Secure for burn"'s aspects (see the header). */
export function burnAspects(bn, { fmtS = S } = {}) {
  if (!bn) return [];
  return [
    ['warning', bn.secured ? `secured ${fmtS(bn.secured.inMs)} after the 1MC` : bn.warn ? 'the 1MC heard, not secured in time' : 'no warning came'],
    ['fall', [bn.onset?.what ? throwLine('the burn', bn.onset, fmtS) : 'nothing thrown', bn.evade?.what ? throwLine('the manoeuvre', bn.evade, fmtS) : null].filter(Boolean).join('; ')],
    ['feel', 'the berth, the float, the siren'],
  ];
}
