import type { FluidType } from './fluids';
import type { OxygenSetup } from './oxygen';

export interface IvInfusion {
  fluid: FluidType;
  rateMlHr: number;
}

/** Everything the nurse has done to the patient that changes physiology. */
export interface Interventions {
  oxygen: OxygenSetup | null;
  headElevated: boolean;
  legsRaised: boolean;
  iv: IvInfusion | null;
}
