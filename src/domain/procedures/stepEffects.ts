import type { Vitals } from '../patient/types';
import type { ProcStep } from './types';

/** What a step does to the patient, so the monitor and the room react (kept deliberately small and mild). */
export interface StepEffect {
  sound?: 'cough' | 'moan';
  delta?: Partial<Vitals>;
  rampSec?: number;
  holdSec?: number;
  decaySec?: number;
}

export function effectOf(step: ProcStep): StepEffect | null {
  const en = step.en;
  if (/pre-?oxygenat|hyper-?oxygenat/i.test(en)) return { delta: { spo2: 2 }, rampSec: 4, holdSec: 20, decaySec: 20 };
  if (/suction/i.test(en) && !/gather|prepare/i.test(en)) {
    // suctioning is unpleasant: the patient coughs and the saturation dips for a moment
    return { sound: 'cough', delta: { spo2: -4, heartRate: 10 }, rampSec: 3, holdSec: 6, decaySec: 12 };
  }
  return null;
}
