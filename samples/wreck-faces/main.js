// OLYMPUS sample: a room with no floor, read from above (v0.0.25's stage 0, its build sheet §10). The pictures are ./faces.js's (see its header for the queries: ?k=, ?t=, ?p=, ?h=, ?b=, ?x=); this page shows one, scaled up by a whole number.
import { picture } from './faces.js';
import { show } from '../portrait-lib/page.js';

show(picture(new URLSearchParams(location.search)));
