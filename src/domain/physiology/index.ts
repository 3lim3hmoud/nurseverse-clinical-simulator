import type { Vitals } from '../patient/types';
import type { Interventions } from './interventions';

export type { Interventions, IvInfusion } from './interventions';
export type { OxygenDevice, OxygenSetup } from './oxygen';
export type { FluidType } from './fluids';
export { OXYGEN_DEVICES, fio2, isFlowAppropriate } from './oxygen';
export { FLUIDS, FLUID_RATES, BAG_ML, FLUID_TIME_SCALE } from './fluids';
export { HypoxiaEngine } from './HypoxiaEngine';
export { HypovolemiaEngine } from './HypovolemiaEngine';
export { HypoglycemiaEngine } from './HypoglycemiaEngine';
export { GLUCOSE_TREATMENTS, glucoseStatus, type GlucoseTreatment, type GlucoseStatus } from './glucose';

/** Computes the next (unrounded) vitals from the patient's condition and what the nurse has done. */
export interface PhysiologyEngine {
  step(dtSeconds: number, interventions: Interventions): Vitals;
  /** Only engines that model blood sugar provide these. */
  getGlucose?(): number;
  applyTreatment?(kind: import('./glucose').GlucoseTreatment): void;
}
