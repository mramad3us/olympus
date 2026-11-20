// OLYMPUS sample: "The window and the canopy", the armoury's day (the build sheet v0.0.28 §10). The pictures are ./armoury.js's (see its
// header: ?c=<candidate>); this page shows one, scaled up by a whole number.
import { picture } from './armoury.js';
import { show } from '../portrait-lib/page.js';

show(picture(new URLSearchParams(location.search)));
