import type { VitalKey, Vitals } from './types';

export type Severity = 'normal' | 'warning' | 'critical';

/**
 * Simplified adult reference ranges for the prototype only.
 * Future: replaced by the clinical decision engine / scenario-specific rules.
 */
export function assessVitals(v: Vitals): Record<VitalKey, Severity> {
  return {
    heartRate: v.heartRate < 50 || v.heartRate > 130 ? 'critical' : v.heartRate < 60 || v.heartRate > 100 ? 'warning' : 'normal',
    spo2: v.spo2 < 90 ? 'critical' : v.spo2 < 95 ? 'warning' : 'normal',
    respiratoryRate:
      v.respiratoryRate < 8 || v.respiratoryRate > 28 ? 'critical' : v.respiratoryRate < 12 || v.respiratoryRate > 20 ? 'warning' : 'normal',
    bloodPressure:
      v.systolic < 90 || v.systolic > 180 ? 'critical' : v.systolic < 100 || v.systolic > 139 ? 'warning' : 'normal',
    temperature:
      v.temperatureC < 35 || v.temperatureC >= 39.5 ? 'critical' : v.temperatureC < 36.1 || v.temperatureC > 37.7 ? 'warning' : 'normal',
  };
}
