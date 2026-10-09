import { useEffect, useState } from 'react';
import type { PatientModel } from '../domain/patient/PatientModel';
import type { Vitals } from '../domain/patient/types';

export function useVitals(patient: PatientModel): Vitals {
  const [vitals, setVitals] = useState<Vitals>(patient.getVitals());
  useEffect(() => {
    setVitals(patient.getVitals());
    return patient.subscribe(setVitals);
  }, [patient]);
  return vitals;
}
