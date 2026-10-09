import { assessVitals } from './assessment';
import type { Vitals } from './types';

export type AlertCode = 'spo2-low' | 'hr-high' | 'hr-low' | 'rr-high' | 'rr-low' | 'bp-low' | 'bp-high' | 'temp-high' | 'temp-low';

/** English text shown on the 3D monitor screen (real monitors are not translated). */
export const ALERT_TEXT_EN: Record<AlertCode, string> = {
  'spo2-low': 'SpO₂ low',
  'hr-high': 'HR high',
  'hr-low': 'HR low',
  'rr-high': 'RR high',
  'rr-low': 'RR low',
  'bp-low': 'BP low',
  'bp-high': 'BP high',
  'temp-high': 'Temp high',
  'temp-low': 'Temp low',
};

/** Vitals that are in the critical range (drives the monitor alarm). */
export function criticalAlerts(v: Vitals): AlertCode[] {
  const s = assessVitals(v);
  const out: AlertCode[] = [];
  if (s.spo2 === 'critical') out.push('spo2-low');
  if (s.heartRate === 'critical') out.push(v.heartRate > 100 ? 'hr-high' : 'hr-low');
  if (s.respiratoryRate === 'critical') out.push(v.respiratoryRate > 20 ? 'rr-high' : 'rr-low');
  if (s.bloodPressure === 'critical') out.push(v.systolic < 100 ? 'bp-low' : 'bp-high');
  if (s.temperature === 'critical') out.push(v.temperatureC > 37.7 ? 'temp-high' : 'temp-low');
  return out;
}
