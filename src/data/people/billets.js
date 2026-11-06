// OLYMPUS data: Echo Company's billets, the posts the roster fills (PEOPLE §3.2, §2.6; CONTRACTS §15).
//
// The billets are part of the handcrafted world (the user, 2026-11-05: "game world is handcrafted",
// PEOPLE §1: the posts a place holds are authored, the same in every career): who fills each is drawn
// from the world's seed (src/sim/people/roster.js). A billet is { key, what, ranks, mos, branch }:
// its key in its unit's `billets` map (PEOPLE §2.6: "the second team's AR" is `ft2-ar` in a squad),
// what it is in words, the rank weights PEOPLE §3.2 gives it ([[rank, weight]…]), its MOS from
// SETTING §5.6's list and its branch (the corpsmen are the Navy's, attached).
//
// Three tables, in the order the roster draws (and so numbers) people: COMPANY_HQ, the thirteen on
// '2/4-E' (PEOPLE §3.2: commander, executive officer, first sergeant, gunnery sergeant, clerk, supply
// sergeant, communications chief, senior corpsman, the pressure-and-suit safety NCO, two drivers, two
// runners; their rank weights are my calls where PEOPLE names only the post, and so are the clerk's
// 0111, the communications chief's 0621, the corpsmen's 8404, the suit NCO's 2147 and the drivers'
// 3531); PLATOON_HQ, the five on a rifle platoon (its commander, sergeant and guide, and the attached
// corpsman and radio operator); SQUAD, the thirteen of a rifle squad (the squad leader, then three fire
// teams of team leader, automatic rifleman, assistant and rifleman). A rifle platoon is 5 + 3 × 13 =
// 44 (CONTRACTS §15); Echo's three rifle platoons and its headquarters are 145. The weapons platoon
// (PEOPLE §3.2's sections, 47 by its own sum against its stated 46) waits until PEOPLE settles it
// (the 0.0.3 build sheet §8, item 4). The player's billet is SQUAD's `ft2-r` of 2nd Platoon's 1st
// Squad (PEOPLE §3.12), left empty by the roster and filled by fillPlayer.

const b = (key, what, ranks, mos, branch = 'marines') => Object.freeze({ key, what, ranks: Object.freeze(ranks.map(r => Object.freeze(r))), mos, branch });

/** The battalion and the company the roster fills: '2/4' and its Echo Company. */
export const BATTALION = Object.freeze({ id: '2/4', name: '2nd Battalion, 4th Marines' });
export const COMPANY = Object.freeze({ id: '2/4-E', name: 'Echo Company, 2nd Battalion, 4th Marines' });
/** Rifle platoons and their squads (CONTRACTS §15). */
export const RIFLE_PLATOONS = 3, SQUADS_A_PLATOON = 3, FIRE_TEAMS = 3;

/** The company headquarters, on '2/4-E' (PEOPLE §3.2, §2.6). */
export const COMPANY_HQ = Object.freeze([
  b('co', 'company commander', [['Capt', 100]], '0302'),
  b('xo', 'executive officer', [['1stLt', 100]], '0302'),
  b('1sg', 'first sergeant', [['1stSgt', 100]], '0369'),
  b('gysgt', 'company gunnery sergeant', [['GySgt', 100]], '0369'),
  b('clerk', 'company clerk', [['LCpl', 50], ['Cpl', 40], ['PFC', 10]], '0111'),
  b('supply', 'supply sergeant', [['Sgt', 70], ['SSgt', 30]], '3043'),
  b('comm', 'communications chief', [['SSgt', 60], ['Sgt', 40]], '0621'),
  b('doc', 'senior corpsman', [['HPO2', 60], ['HPO1', 40]], '8404', 'navy'),
  b('pss', 'pressure-and-suit safety NCO', [['Cpl', 100]], '2147'),
  b('driver-1', 'driver', [['LCpl', 60], ['PFC', 40]], '3531'),
  b('driver-2', 'driver', [['LCpl', 60], ['PFC', 40]], '3531'),
  b('runner-1', 'runner', [['PFC', 60], ['Pvt', 20], ['LCpl', 20]], '0311'),
  b('runner-2', 'runner', [['PFC', 60], ['Pvt', 20], ['LCpl', 20]], '0311'),
]);

/** A rifle platoon's headquarters and attachments, on '2/4-E-<n>' (PEOPLE §3.2). */
export const PLATOON_HQ = Object.freeze([
  b('pltcmdr', 'platoon commander', [['2ndLt', 80], ['1stLt', 20]], '0302'),
  b('pltsgt', 'platoon sergeant', [['SSgt', 85], ['GySgt', 10], ['Sgt', 5]], '0369'),
  b('guide', 'platoon guide', [['Sgt', 70], ['SSgt', 15], ['Cpl', 15]], '0365'),
  b('doc', 'corpsman (Navy, attached)', [['HAR', 40], ['HLH', 50], ['HPO2', 10]], '8404', 'navy'),
  b('ro', 'radio operator (attached)', [['LCpl', 60], ['Cpl', 25], ['PFC', 15]], '0621'),
]);

// (a fire team's four, numbered)
const team = (n) => [
  b(`ft${n}-tl`, `fire team leader, ${['1st', '2nd', '3rd'][n - 1]} fire team`, [['Cpl', 60], ['LCpl', 40]], '0311'),
  b(`ft${n}-ar`, `automatic rifleman, ${['1st', '2nd', '3rd'][n - 1]} fire team`, [['LCpl', 60], ['PFC', 30], ['Cpl', 10]], '0311'),
  b(`ft${n}-aar`, `assistant automatic rifleman, ${['1st', '2nd', '3rd'][n - 1]} fire team`, [['PFC', 50], ['LCpl', 40], ['Pvt', 10]], '0311'),
  b(`ft${n}-r`, `rifleman, ${['1st', '2nd', '3rd'][n - 1]} fire team`, [['PFC', 50], ['Pvt', 30], ['LCpl', 20]], '0311'),
];

/** A rifle squad, on '2/4-E-<n>-<s>': the squad leader, then three fire teams (PEOPLE §3.2). */
export const SQUAD = Object.freeze([
  b('sl', 'squad leader', [['Sgt', 75], ['Cpl', 20], ['SSgt', 5]], '0365'),
  ...team(1), ...team(2), ...team(3),
]);

/** The billet the roster leaves for the player (PEOPLE §3.12): rifleman, 2nd fire team, 1st Squad, 2nd Platoon. */
export const PLAYER_BILLET = Object.freeze({ unitId: '2/4-E-2-1', billet: 'ft2-r' });
