import { PatientModel } from '../patient/PatientModel';
import type { PatientProfile, Vitals } from '../patient/types';
import type { PhysiologyEngine } from '../physiology';
import type { ProcedureDef, ProcedureId } from './types';

/** The patient each procedure is done on (what the monitor shows). The vitals stay put unless a step changes them. */
const PATIENTS: Record<ProcedureId, { vitals: Vitals; alertness: number; age: number; sex: 'male' | 'female' }> = {
  mv: { vitals: { heartRate: 86, respiratoryRate: 14, spo2: 98, systolic: 124, diastolic: 74, temperatureC: 37.4 }, alertness: 0.15, age: 62, sex: 'male' }, // ventilated, sedated
  trach: { vitals: { heartRate: 82, respiratoryRate: 18, spo2: 96, systolic: 118, diastolic: 72, temperatureC: 37.0 }, alertness: 0.7, age: 58, sex: 'male' },
  acls: { vitals: { heartRate: 0, respiratoryRate: 0, spo2: 0, systolic: 0, diastolic: 0, temperatureC: 36.4 }, alertness: 0, age: 64, sex: 'male' }, // cardiac arrest
  tpn: { vitals: { heartRate: 78, respiratoryRate: 16, spo2: 97, systolic: 122, diastolic: 76, temperatureC: 36.9 }, alertness: 0.9, age: 45, sex: 'female' },
  art: { vitals: { heartRate: 80, respiratoryRate: 16, spo2: 97, systolic: 120, diastolic: 70, temperatureC: 36.8 }, alertness: 0.8, age: 60, sex: 'male' },
  pa: { vitals: { heartRate: 92, respiratoryRate: 20, spo2: 95, systolic: 110, diastolic: 65, temperatureC: 37.3 }, alertness: 0.6, age: 66, sex: 'male' },
  vap: { vitals: { heartRate: 90, respiratoryRate: 16, spo2: 96, systolic: 118, diastolic: 70, temperatureC: 37.6 }, alertness: 0.15, age: 70, sex: 'male' }, // ventilated
  cauti: { vitals: { heartRate: 76, respiratoryRate: 16, spo2: 97, systolic: 126, diastolic: 78, temperatureC: 37.2 }, alertness: 0.85, age: 72, sex: 'female' },
  clabsi: { vitals: { heartRate: 80, respiratoryRate: 16, spo2: 97, systolic: 122, diastolic: 76, temperatureC: 37.0 }, alertness: 0.85, age: 55, sex: 'male' },
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
