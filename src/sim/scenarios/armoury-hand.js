// OLYMPUS scenarios: "The window and the canopy"'s acts at hand, registered with places/hand.js (R does the station's act, R held lists its rows: the build sheet v0.0.28 item 5, §3.0).
//
// A module of its own, imported by src/sim/game.js only, so the registration runs after places/hand.js has run: armoury-day.js sits in
// the course engine's import cycle (handling.js imports it, and places/hand.js reaches handling.js through time/activities.js), where a
// call at its top would meet hand.js's list before hand.js had made it. Off the scene its offer is null, so R everywhere else is as built.
import { registerHandScene } from '../places/hand.js';
import { armouryOffer, armouryAct, armouryRowsHand } from './armoury-day.js';

registerHandScene({ offer: armouryOffer, act: (state, bus, id) => armouryAct(state, bus, id), rows: armouryRowsHand });
