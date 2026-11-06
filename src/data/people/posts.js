// OLYMPUS data: the staff posts of Base Melas, who stands where and of what rank (PEOPLE §3.13, §4.3's range detail; the build sheet 0.0.5 §2.2, §8 item 24).
//
// A post is authored, the same in every career (the user, 2026-11-05: "game world is handcrafted"):
// what it is, the rank weights it takes, its MOS and the unit it belongs to. Who fills it is generated
// (the user, 2026-11-05: "All people generated"): src/sim/people/staff.js drawStaff draws the person
// on stream('staff', seed, site, post), a tier 3 person with a sheet by their rank's tier, dressed
// 'rangeStaff'. Keyed '<site>:<post>'; key is the billet's word for it (service.billet), never an id.
// Data only.
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The posts (see the header). */
export const POSTS = deepFreeze({
  'melas:kd-ro': { site: 'melas', key: 'kd-ro', what: 'range officer', ranks: [['SSgt', 60], ['GySgt', 25], ['Sgt', 15]], mos: '0369', unitId: '2/4', branch: 'marines', outfit: 'rangeStaff' },
  'melas:kd-coach': { site: 'melas', key: 'kd-coach', what: 'marksmanship coach', ranks: [['Sgt', 60], ['Cpl', 40]], mos: '8531', unitId: '2/4', branch: 'marines', outfit: 'rangeStaff' },
});
