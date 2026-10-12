import { PatientModel } from '../patient/PatientModel';
import type { PatientProfile, Vitals } from '../patient/types';
import type { PhysiologyEngine } from '../physiology';

/** A calm patient for the procedure practice: the vitals stay where they are. */
const VITALS: Vitals = { heartRate: 78, respiratoryRate: 16, spo2: 97, systolic: 122, diastolic: 76, temperatureC: 36.8 };

class StableEngine implements PhysiologyEngine {
  step(): Vitals {
    return { ...VITALS };
  }
}

export function createStablePatient(bedLabel: string): PatientModel {
  const profile: PatientProfile = {
    id: 'procedure',
    ageYears: 58,
    sex: 'male',
    bedLabel,
    boardLines: [bedLabel],
    appearance: { hair: 'short', hairColor: 0x9a9a9a, beard: false, skin: 0xe2b896, gown: 0x8fcfe0, alertness: 0.9 },
  };
  return new PatientModel(profile, { ...VITALS }, new StableEngine());
}
