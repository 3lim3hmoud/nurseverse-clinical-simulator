import { PatientModel } from '../patient/PatientModel';
import type { PatientProfile, Vitals } from '../patient/types';
import type { PhysiologyEngine } from '../physiology';
import type { ProcedureDef, ProcedureId } from './types';

/** The patient each procedure is done on (what the monitor shows). The vitals stay put unless a step changes them. */
const PATIENTS: Record<ProcedureId, { vitals: Vitals; alertness: number; age: number; sex: 'male' | 'female' }> = {
  mv: { vitals: { heartRate: 86, respiratoryRate: 14, spo2: 98, systolic: 124, diastolic: 74, temperatureC: 37.4 }, alertness: 0.15, age: 62, sex: 'male' }, // ventilated, sedated
};

class StableEngine implements PhysiologyEngine {
  constructor(private vitals: Vitals) {}
  step(): Vitals {
    return { ...this.vitals };
  }
}

export function createStablePatient(def: ProcedureDef): PatientModel {
  const p = PATIENTS[def.id];
  const profile: PatientProfile = {
    id: 'procedure',
    ageYears: p.age,
    sex: p.sex,
    bedLabel: def.titleEn,
    boardLines: [def.titleEn],
    appearance: {
      hair: p.sex === 'female' ? 'long' : 'short',
      hairColor: 0x9a9a9a,
      beard: false,
      skin: 0xe2b896,
      gown: 0x8fcfe0,
      alertness: p.alertness,
    },
  };
  return new PatientModel(profile, { ...p.vitals }, new StableEngine(p.vitals));
}
