import type { Vitals } from '../patient/types';
import type { PhysiologyEngine } from './index';
import type { Interventions } from './interventions';
import { fio2 } from './oxygen';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Educational model of a hypoxaemic patient.
 * - Untreated, SpO2 on room air slowly worsens (disease progression).
 * - Oxygen raises the SpO2 target in proportion to the delivered FiO2; sitting upright helps a little.
 * - HR, RR and BP follow the oxygen deficit.
 * Future: replace with condition-specific engines (sepsis, COPD, shock...).
 */
export class HypoxiaEngine implements PhysiologyEngine {
  private t = 0;
  private v: Vitals;

  constructor(private base: Vitals) {
    this.v = { ...base };
  }

  step(dt: number, iv: Interventions): Vitals {
    const b = this.base;
    const v = this.v;
    this.t += dt;

    const roomAir = Math.max(b.spo2 - 16, b.spo2 - 0.06 * this.t);
    const boost = iv.oxygen ? (fio2(iv.oxygen) - 0.21) * 38 : 0;
    const posture = iv.headElevated ? 1.5 : 0;
    const spo2Target = clamp(roomAir + boost + posture, 60, 99);
    v.spo2 += (spo2Target - v.spo2) * (1 - Math.exp(-dt / 12));

    const deficit = b.spo2 - v.spo2; // positive = worse than at the start
    const k = 1 - Math.exp(-dt / 10);
    const upright = iv.headElevated ? 2 : 0;
    const shock = Math.max(0, 80 - v.spo2);

    v.heartRate += (clamp(b.heartRate + deficit * 1.6 - upright, 55, 170) - v.heartRate) * k;
    v.respiratoryRate += (clamp(b.respiratoryRate + deficit - upright, 10, 40) - v.respiratoryRate) * k;
    v.systolic += (b.systolic + deficit - shock * 3 - v.systolic) * k;
    v.diastolic += (b.diastolic + deficit * 0.5 - shock * 1.5 - v.diastolic) * k;
    v.temperatureC = b.temperatureC;
    return v;
  }
}
