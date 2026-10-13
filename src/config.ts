/**
 * What is switched on in this build.
 *  - clinicalCases: the three bedside cases (breathing, blood pressure, blood sugar) under the MV procedure in the menu.
 * The other course procedures are not listed here: they are parked in docs/future-procedures.json.
 */
export const FEATURES = {
  clinicalCases: true,
} as const;
