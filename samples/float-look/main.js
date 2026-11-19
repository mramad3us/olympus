// OLYMPUS sample: a floating body's height, read from above (the build sheet v0.0.23 §1 item 8; the anywhere round's AW§5). The pictures are ./float.js's (see its header for the queries); this page shows one, scaled up by a whole number.
import { picture } from './float.js';
import { show } from '../portrait-lib/page.js';

show(picture(new URLSearchParams(location.search)));
