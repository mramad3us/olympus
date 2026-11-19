// OLYMPUS sample: you in the black suit on the I and C cards (the build sheet v0.0.23 §1 item 8; the overhaul's O-16, PD). The pictures are ./suit.js's (see its header for the queries); this page shows one, scaled up by a whole number.
import { picture } from './suit.js';
import { show } from '../portrait-lib/page.js';

show(picture(new URLSearchParams(location.search)));
