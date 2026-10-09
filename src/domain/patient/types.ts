export interface Vitals {
  heartRate: number; // beats/min
  spo2: number; // %
  respiratoryRate: number; // breaths/min
  systolic: number; // mmHg
  diastolic: number; // mmHg
  temperatureC: number; // °C
}

export type VitalKey = 'heartRate' | 'spo2' | 'respiratoryRate' | 'bloodPressure' | 'temperature';

/** How the 3D patient looks. */
export interface PatientAppearance {
  hair: 'short' | 'long';
  hairColor: number;
  beard: boolean;
  skin: number;
  gown: number;
  alertness: number; // 0 = eyes closed ... 1 = wide awake
}

export interface PatientProfile {
  id: string;
  ageYears: number;
  sex: 'male' | 'female';
  bedLabel: string; // e.g. "Bay 3"
  boardLines: string[]; // text on the whiteboard
  appearance: PatientAppearance;
}
