// OLYMPUS sample: "A Belt hauler's crew deck", the inside of the Patient Mule's deck 2 (the build sheet v0.0.27 §10). The pictures
// are ./deck.js's (see its header: ?i=<candidate>); this page shows one, scaled up by a whole number.
import { picture } from './deck.js';
import { show } from '../portrait-lib/page.js';

show(picture(new URLSearchParams(location.search)));
