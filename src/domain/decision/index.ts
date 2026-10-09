import type { Vitals } from '../patient/types';

export interface ClinicalAction {
  id: string; // e.g. "apply-oxygen", "start-iv-fluids"
  timeMs: number;
}

export interface DecisionResult {
  appropriate: boolean;
  rationale: string;
}

/** Future: clinical decision engine. Judges whether a nursing action fits the patient's current state. */
export interface DecisionEngine {
  evaluate(action: ClinicalAction, vitals: Vitals): DecisionResult;
}
