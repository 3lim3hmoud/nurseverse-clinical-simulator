import type { Vitals } from '../patient/types';
import { FLUIDS, FLUID_TIME_SCALE } from './fluids';
import type { Interventions } from './interventions';
import { fio2 } from './oxygen';
import type { PhysiologyEngine } from './index';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const NORMAL = { hr: 76, sys: 118, dia: 72, rr: 16, spo2: 99 };
const LOSS_ML_PER_SEC = 0.8; // ongoing vomiting / diarrhoea

/**
 * Educational model of hypovolaemia. A circulating-volume deficit (mL) drives the vitals.
 * Crystalloids reduce the deficit (dextrose barely does), raising the legs helps a little,
 * sitting up makes it worse. The deficit keeps growing until it is treated.
 */
export class HypovolemiaEngine implements PhysiologyEngine {
  private deficit: number;
  private v: Vitals;

  constructor(base: Vitals, deficitMl = 1000) {
    this.deficit = deficitMl;
    this.v = { ...base };
  }

  step(dt: number, iv: Interventions): Vitals {
    const v = this.v;
    this.deficit += LOSS_ML_PER_SEC * dt;
    if (iv.iv) this.deficit -= (iv.iv.rateMlHr / 3600) * FLUID_TIME_SCALE * FLUIDS[iv.iv.fluid].effect * dt;
    this.deficit = Math.max(-150, this.deficit);
    const d = this.deficit;

    const legs = iv.legsRaised ? 1 : 0;
    const sit = iv.headElevated ? 1 : 0;
    const k = 1 - Math.exp(-dt / 8);

    const sysT = clamp(NORMAL.sys - d * 0.036 + legs * 8 - sit * 4, 40, 160);
    const diaT = clamp(NORMAL.dia - d * 0.022 + legs * 3 - sit * 3, 25, 100);
    const hrT = clamp(NORMAL.hr + d * 0.052 - legs * 6 + sit * 5, 55, 180);
    const rrT = clamp(NORMAL.rr + d * 0.008, 10, 36);
    const spo2T = clamp(NORMAL.spo2 - d * 0.004 + (iv.oxygen ? (fio2(iv.oxygen) - 0.21) * 10 : 0), 80, 100);

    v.systolic += (sysT - v.systolic) * k;
    v.diastolic += (diaT - v.diastolic) * k;
    v.heartRate += (hrT - v.heartRate) * k;
    v.respiratoryRate += (rrT - v.respiratoryRate) * k;
    v.spo2 += (spo2T - v.spo2) * k;
    return v;
  }
}
