import type { Vitals } from '../patient/types';
import { GLUCOSE_TREATMENTS, type GlucoseTreatment } from './glucose';
import type { Interventions } from './interventions';
import type { PhysiologyEngine } from './index';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const NORMAL = { hr: 76, sys: 122, dia: 76, rr: 16, spo2: 98 };
const INSULIN_DROP_PER_SEC = 0.05; // insulin / sulfonylurea is still acting, so untreated sugar keeps falling

/**
 * Educational model of hypoglycaemia in a diabetic patient. Blood glucose (mg/dL) is the hidden state:
 * it keeps falling until treated; each treatment is absorbed over time. Low glucose causes an adrenergic
 * response (fast pulse, higher systolic pressure). The monitor alone never shows the glucose: the nurse must check it.
 */
export class HypoglycemiaEngine implements PhysiologyEngine {
  private glucose: number;
  private v: Vitals;
  private absorbing: { left: number; rate: number }[] = [];

  constructor(base: Vitals, startGlucose = 38) {
    this.glucose = startGlucose;
    this.v = { ...base };
  }

  getGlucose(): number {
    return this.glucose;
  }

  applyTreatment(kind: GlucoseTreatment): void {
    const info = GLUCOSE_TREATMENTS[kind];
    this.absorbing.push({ left: info.riseMgDl, rate: info.ratePerSec });
  }

  step(dt: number, _iv: Interventions): Vitals {
    this.glucose -= INSULIN_DROP_PER_SEC * dt;
    for (const a of this.absorbing) {
      const add = Math.min(a.left, a.rate * dt);
      this.glucose += add;
      a.left -= add;
    }
    this.absorbing = this.absorbing.filter((a) => a.left > 0.01);
    this.glucose = clamp(this.glucose, 15, 400);

    const low = clamp(70 - this.glucose, 0, 55);
    const k = 1 - Math.exp(-dt / 8);
    const v = this.v;
    v.heartRate += (NORMAL.hr + low * 1.1 - v.heartRate) * k;
    v.systolic += (NORMAL.sys + low * 0.4 - v.systolic) * k;
    v.diastolic += (NORMAL.dia + low * 0.1 - v.diastolic) * k;
    v.respiratoryRate += (NORMAL.rr + low * 0.08 - v.respiratoryRate) * k;
    v.spo2 += (NORMAL.spo2 - v.spo2) * k;
    return v;
  }
}
