/** Treatments for low blood sugar (educational model). */
export type GlucoseTreatment = 'oral' | 'iv-dextrose' | 'glucagon';

export interface GlucoseTreatmentInfo {
  labelKey: string;
  summaryKey: string;
  /** Total mg/dL the treatment adds, and how fast (mg/dL per simulated second). */
  riseMgDl: number;
  ratePerSec: number;
}

export const GLUCOSE_TREATMENTS: Record<GlucoseTreatment, GlucoseTreatmentInfo> = {
  oral: { labelKey: 'glu.oral', summaryKey: 'glu.oral.sum', riseMgDl: 55, ratePerSec: 1 },
  'iv-dextrose': { labelKey: 'glu.iv', summaryKey: 'glu.iv.sum', riseMgDl: 120, ratePerSec: 4 },
  glucagon: { labelKey: 'glu.glucagon', summaryKey: 'glu.glucagon.sum', riseMgDl: 70, ratePerSec: 0.5 },
};

export type GlucoseStatus = 'low' | 'normal' | 'high';
export const glucoseStatus = (mgDl: number): GlucoseStatus => (mgDl < 70 ? 'low' : mgDl > 180 ? 'high' : 'normal');
