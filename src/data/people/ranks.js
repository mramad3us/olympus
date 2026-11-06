// OLYMPUS data: the ranks the roster draws, with their grades, ages and the service time each needs (PEOPLE §3.3; SETTING §5.5; CAREER §8.1).
//
// A rank is { code, title, grade, branch, ageY: [lo, hi], tisMo: [min, max], kind }. code is
// SETTING §5.5's abbreviation (Pvt, PFC, LCpl, Cpl, Sgt, SSgt, GySgt, 1stSgt, SgtMaj; 2ndLt, 1stLt,
// Capt, Maj, LtCol), and for the Navy's corpsmen my short forms of SETTING's Hospital grades: HAR, a
// Hospital Able Rating (E-3, PEOPLE's "junior hospital rating"), HLH a Hospital Leading Hand (E-4,
// "third class"), HPO2 and HPO1 Hospital Petty Officers Second and First Class (E-5, E-6). ageY is
// PEOPLE §3.3's range in whole Earth years on the UTC calendar, both ends included (a sailor takes
// the marine equivalent's: SETTING §5.5's courtesies column); the roster draws an age from a
// triangle over it with its mode at AGE_MODE_FRAC (35%) of the range. tisMo is the time in service
// in months a rank needs (CAREER §8.1's minimum TIS: PFC 6, LCpl 9, Cpl 12, Sgt 24, SSgt 48, GySgt 72,
// 1stSgt 96, SgtMaj 120) and, for the two automatic promotions, the most it may have and still hold
// it (Pvt under 6, PFC under 14, the top of CAREER's 9 to 14 months to LCpl: my call). An officer's
// service counts from commissioning: 1stLt after 18 months, Capt after 48 (my calls on the US model).
// kind is 'junior' (Pvt to LCpl), 'nco' (Cpl, Sgt), 'snco' (SSgt and up) or 'officer', which the
// personality draw reads (PEOPLE §3.6: NCOs add +1 to drive and rules, staff NCOs and officers to
// nerve too). ENTRY_AGE_Y is the age at enlistment (PEOPLE §3.3: 18 to 21) and at commissioning
// (21 to 23, my call).

const r = (code, title, grade, branch, ageY, tisMo, kind) => Object.freeze({ code, title, grade, branch, ageY: Object.freeze(ageY), tisMo: Object.freeze(tisMo), kind });

/** The ranks by code. */
export const RANKS = Object.freeze({
  Pvt: r('Pvt', 'Private', 'E1', 'marines', [18, 20], [0, 6], 'junior'),
  PFC: r('PFC', 'Private First Class', 'E2', 'marines', [18, 22], [6, 14], 'junior'),
  LCpl: r('LCpl', 'Lance Corporal', 'E3', 'marines', [19, 24], [9, null], 'junior'),
  Cpl: r('Cpl', 'Corporal', 'E4', 'marines', [20, 27], [12, null], 'nco'),
  Sgt: r('Sgt', 'Sergeant', 'E5', 'marines', [22, 31], [24, null], 'nco'),
  SSgt: r('SSgt', 'Staff Sergeant', 'E6', 'marines', [25, 35], [48, null], 'snco'),
  GySgt: r('GySgt', 'Gunnery Sergeant', 'E7', 'marines', [29, 39], [72, null], 'snco'),
  '1stSgt': r('1stSgt', 'First Sergeant', 'E8', 'marines', [33, 43], [96, null], 'snco'),
  SgtMaj: r('SgtMaj', 'Sergeant Major', 'E9', 'marines', [38, 48], [120, null], 'snco'),
  '2ndLt': r('2ndLt', 'Second Lieutenant', 'O1', 'marines', [22, 25], [0, null], 'officer'),
  '1stLt': r('1stLt', 'First Lieutenant', 'O2', 'marines', [23, 28], [18, null], 'officer'),
  Capt: r('Capt', 'Captain', 'O3', 'marines', [26, 33], [48, null], 'officer'),
  Maj: r('Maj', 'Major', 'O4', 'marines', [31, 38], [96, null], 'officer'),
  LtCol: r('LtCol', 'Lieutenant Colonel', 'O5', 'marines', [36, 44], [168, null], 'officer'),
  HAR: r('HAR', 'Hospital Able Rating', 'E3', 'navy', [19, 24], [9, null], 'junior'),
  HLH: r('HLH', 'Hospital Leading Hand', 'E4', 'navy', [20, 27], [12, null], 'nco'),
  HPO2: r('HPO2', 'Hospital Petty Officer Second Class', 'E5', 'navy', [22, 31], [24, null], 'nco'),
  HPO1: r('HPO1', 'Hospital Petty Officer First Class', 'E6', 'navy', [25, 35], [48, null], 'snco'),
});

/** The triangle's mode as a fraction of a rank's age range (PEOPLE §3.3). */
export const AGE_MODE_FRAC = 0.35;
/** Age at entry, whole years both ends included: enlisted (PEOPLE §3.3) and commissioned (my call). */
export const ENTRY_AGE_Y = Object.freeze({ enlisted: Object.freeze([18, 21]), officer: Object.freeze([21, 23]) });
/** How often the roster redraws an age to fit a rank's service time before it raises the age to fit (PEOPLE §3.3). */
export const AGE_REDRAWS = 5;
