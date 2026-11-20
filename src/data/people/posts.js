// OLYMPUS data: the staff posts of Base Melas, who stands where and of what rank (PEOPLE §3.13, §4.3's range detail; the build sheet 0.0.5 §2.2, §8 item 24; 0.0.12's shoot house instructor, §8 item 19).
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
  // (0.0.7: the range's corpsman, behind the line, and the pits' NCO (the build sheet 0.0.7 §1, §2.3))
  'melas:kd-corpsman': { site: 'melas', key: 'kd-corpsman', what: 'range corpsman', ranks: [['HLH', 50], ['HPO2', 35], ['HAR', 15]], mos: '8404', unitId: '2/4', branch: 'navy', outfit: 'rangeStaff' },
  'melas:kd-pits': { site: 'melas', key: 'kd-pits', what: 'pits NCO', ranks: [['Sgt', 55], ['Cpl', 45]], mos: '0311', unitId: '2/4', branch: 'marines', outfit: 'rangeStaff' },
  // (0.0.12: the shoot house's chief instructor, on the catwalk of house 1 in the Wheel's sector 4 (COMBAT §25.10.2; the build
  // sheet 0.0.12 §8 item 19): a generated staff sergeant, as the range's staff are)
  'melas:wheel-house-chief': { site: 'melas', key: 'wheel-house-chief', what: 'shoot house instructor', ranks: [['SSgt', 70], ['GySgt', 20], ['Sgt', 10]], mos: '0369', unitId: '2/4', branch: 'marines', outfit: 'rangeStaff' },
  // (v0.0.19: the live lane's two role-players, the cadre's marines who stand in for stands 2a and 3a in marking-round kit
  // (COMBAT §7.11, §25.18; src/sim/scenarios/opfor.js): generated as every post is, on their own streams, so the roster and
  // the player move by nothing; in utilities, the mask and the carrier their kit's)
  'melas:wheel-house-opfor-a': { site: 'melas', key: 'wheel-house-opfor-a', what: 'shoot house role-player', ranks: [['LCpl', 60], ['Cpl', 40]], mos: '0311', unitId: '2/4', branch: 'marines', outfit: 'utilities' },
  'melas:wheel-house-opfor-b': { site: 'melas', key: 'wheel-house-opfor-b', what: 'shoot house role-player', ranks: [['LCpl', 60], ['Cpl', 40]], mos: '0311', unitId: '2/4', branch: 'marines', outfit: 'utilities' },
  // (the void range's cadre at the Void Operations School, Phobos ("Anchor before you fire"; AW§5), and the berthing
  // compartment's NCO aboard Testudo ("Secure for burn"): generated as every post is, on their own streams; the School's unit and
  // the ship's detachment are not drawn yet, so both are kept on the roster's 2/4 (my call))
  'phobos-void:cadre': { site: 'phobos-void', key: 'cadre', what: 'void range cadre', ranks: [['SSgt', 60], ['GySgt', 25], ['Sgt', 15]], mos: '0369', unitId: '2/4', branch: 'marines', outfit: 'combatSuit' },
  'mcrn-testudo:berth-nco': { site: 'mcrn-testudo', key: 'berth-nco', what: 'berthing NCO', ranks: [['Sgt', 60], ['Cpl', 40]], mos: '0311', unitId: '2/4', branch: 'marines', outfit: 'utilities' },
  // (the boarding round's stage 0, "Away the boarding party" (its build sheet §0 item 32): every person of the scene generated from a post. The
  // boarding team's #1 and #2, the leader and the automatic rifleman (Corps, the roster's 2/4 as every post); the holdouts and the
  // hauler's crew, civilians (ranks.js Civ, never named), drawn in the draw's order (A's drawBoarding: holdout-1 the first armed man
  // drawn, crew-1 the first crewman), so a post is the n-th man of his kind, not a stand; the crew always in coveralls (E's outfit:
  // art/figures/outfits.js 'beltCoverall', samples/belt-crew's D-c until scored, the mixed crew: the second holdout drawn in the light
  // vac suit open, every other man in the coverall, its make by his seed))
  'belt-mule:board-tl': { site: 'belt-mule', key: 'board-tl', what: 'boarding team leader', ranks: [['Cpl', 60], ['Sgt', 40]], mos: '0311', unitId: '2/4', branch: 'marines', outfit: 'combatSuit' },
  'belt-mule:board-ar': { site: 'belt-mule', key: 'board-ar', what: 'automatic rifleman', ranks: [['LCpl', 70], ['Cpl', 30]], mos: '0311', unitId: '2/4', branch: 'marines', outfit: 'combatSuit' },
  'belt-mule:holdout-1': { site: 'belt-mule', key: 'holdout-1', what: 'holdout', ranks: [['Civ', 100]], mos: null, unitId: '2/4', branch: 'civilian', outfit: 'beltCoverall' },
  'belt-mule:holdout-2': { site: 'belt-mule', key: 'holdout-2', what: 'holdout', ranks: [['Civ', 100]], mos: null, unitId: '2/4', branch: 'civilian', outfit: 'vacOpen' },
  'belt-mule:holdout-3': { site: 'belt-mule', key: 'holdout-3', what: 'holdout', ranks: [['Civ', 100]], mos: null, unitId: '2/4', branch: 'civilian', outfit: 'beltCoverall' },
  'belt-mule:holdout-4': { site: 'belt-mule', key: 'holdout-4', what: 'holdout', ranks: [['Civ', 100]], mos: null, unitId: '2/4', branch: 'civilian', outfit: 'beltCoverall' },
  'belt-mule:crew-1': { site: 'belt-mule', key: 'crew-1', what: 'hauler crewman', ranks: [['Civ', 100]], mos: null, unitId: '2/4', branch: 'civilian', outfit: 'beltCoverall' },
  'belt-mule:crew-2': { site: 'belt-mule', key: 'crew-2', what: 'hauler crewman', ranks: [['Civ', 100]], mos: null, unitId: '2/4', branch: 'civilian', outfit: 'beltCoverall' },
  'belt-mule:crew-3': { site: 'belt-mule', key: 'crew-3', what: 'hauler crewman', ranks: [['Civ', 100]], mos: null, unitId: '2/4', branch: 'civilian', outfit: 'beltCoverall' },
  // ("The window and the canopy" (its build sheet §0 item 20; AM§4): the armourer behind window 1 (his Awareness is the inspection's
  // eye), the second armourer idle behind window 2, the ammunition NCO at his table and at your shoulder on the lane; generated as every post is)
  'melas:armourer-1': { site: 'melas', key: 'armourer-1', what: 'armourer', ranks: [['SSgt', 30], ['Sgt', 50], ['Cpl', 20]], mos: '2111', unitId: '2/4', branch: 'marines', outfit: 'utilities' },
  'melas:armourer-2': { site: 'melas', key: 'armourer-2', what: 'armourer', ranks: [['Sgt', 40], ['Cpl', 40], ['LCpl', 20]], mos: '2111', unitId: '2/4', branch: 'marines', outfit: 'utilities' },
  'melas:kd-ammo': { site: 'melas', key: 'kd-ammo', what: 'ammunition NCO', ranks: [['Sgt', 55], ['Cpl', 45]], mos: '2311', unitId: '2/4', branch: 'marines', outfit: 'rangeStaff' },
});
