// OLYMPUS sample: the man as he stands on the target card, and you on the C card (the build sheet v0.0.23 §1 items 4, 5 and 8).
// The pictures are ./pose.js's (see its header: ?c=<candidate>, the candidates C's ./poses.js); this page shows one, scaled up by
// a whole number.
import { picture } from './pose.js';
import { show } from '../portrait-lib/page.js';

show(picture(new URLSearchParams(location.search)));
