// OLYMPUS sample: the target view's hostage cards (VIEWS §7.7; v0.0.28, the user's note of 2026-11-20 on target-view H: "If the
// hostage is hit, the shot is a fail."), apart from the page (./main.js) so tests/hostage-card.test.mjs holds them to the card as
// drawn: each truth card's hole touches her pixels exactly when its words say HOSTAGE HIT.
import { hostageHead } from '../../src/sim/arms/paper.js';

/**
 * The hostage card's three (v0.0.28): [phase, the hole (man-target cm) or null, the words, the line]; HIT_WORDS a round touching her.
 * Each hole is one the game places (paper.js hostageHead): his clear of her, and a round scored on her where it lands on her (the
 * review of the picks: the third card's hole [2.2, -29.1], between the two, was no hole the game makes and stood 4 card px clear of
 * her at this band under HOSTAGE HIT).
 */
export const HIT_WORDS = 'TO THE HEAD · HOSTAGE HIT';
export const HOSTAGE_CARDS = Object.freeze([
  ['belief', null, 'TO THE HEAD · 1 SEEN', null],
  ['truth', [7.2, -29.1], 'TO THE HEAD · HEAD', 'One in the head. He went down.'],
  ['truth', hostageHead([2.2, -29.1], true), HIT_WORDS, 'You hit the hostage!'],
]);
