export type FluidType = 'ns' | 'lr' | 'd5w';

export interface FluidInfo {
  labelKey: string;
  summaryKey: string;
  /** Share of the infused volume that stays in the blood vessels (educational simplification). */
  effect: number;
}

export const FLUIDS: Record<FluidType, FluidInfo> = {
  ns: { labelKey: 'fluid.ns', summaryKey: 'fluid.ns.sum', effect: 0.7 },
  lr: { labelKey: 'fluid.lr', summaryKey: 'fluid.lr.sum', effect: 0.75 },
  d5w: { labelKey: 'fluid.d5w', summaryKey: 'fluid.d5w.sum', effect: 0.12 },
};

export const FLUID_RATES = [100, 250, 500, 1000, 2000, 3000]; // mL/hr offered in the UI
export const BAG_ML = 1000;
/** Infusions are time-compressed so a bolus has an effect within a short training case. */
export const FLUID_TIME_SCALE = 10;
