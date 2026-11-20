// OLYMPUS sample: "The holdouts", the dress of the armed men aboard the Patient Mule (the build sheet v0.0.27 §10). The pictures are
// ./crew.js's (see its header: ?d=<candidate>); this page shows one, scaled up by a whole number.
import { picture } from './crew.js';
import { show } from '../portrait-lib/page.js';

show(picture(new URLSearchParams(location.search)));
