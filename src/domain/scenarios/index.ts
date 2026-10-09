import { t } from '../../i18n';
import type { Interventions } from '../physiology/interventions';
import { HypovolemiaEngine } from '../physiology/HypovolemiaEngine';
import { HypoxiaEngine } from '../physiology/HypoxiaEngine';
import type { PhysiologyEngine } from '../physiology';
import type { PatientProfile, Vitals } from '../patient/types';
import { RespiratoryScorer } from '../scoring/RespiratoryScorer';
import { ShockScorer } from '../scoring/ShockScorer';
import type { PerformanceScorer } from '../scoring';
import { respiratoryFindings, shockFindings, type Findings } from './findings';

export type ScenarioId = 'respiratory' | 'shock';

export interface DoctorContext {
  stabilised: boolean;
  oxygenOn: boolean;
  ivOn: boolean;
}

export interface Scenario {
  id: ScenarioId;
  titleKey: string;
  blurbKey: string;
  introKey: string;
  objectiveKey: string;
  stableObjectiveKey: string;
  timeLimitSec: number;
  stableSeconds: number; // how long the vitals must stay in the stable range
  patient: PatientProfile;
  initialVitals: Vitals;
  createEngine(): PhysiologyEngine;
  isStable(v: Vitals, iv: Interventions): boolean;
  isFailed(v: Vitals): boolean;
  findings: Findings;
  doctorReply(ctx: DoctorContext): string;
  scorer: PerformanceScorer;
}

/** Future: load scenarios from JSON/CMS, add timelines, triggers and expected nursing actions. */
export const respiratoryScenario: Scenario = {
  id: 'respiratory',
  titleKey: 'scen.respiratory.title',
  blurbKey: 'scen.respiratory.blurb',
  introKey: 'scen.respiratory.intro',
  objectiveKey: 'obj.assess',
  stableObjectiveKey: 'obj.stable',
  timeLimitSec: 360,
  stableSeconds: 20,
  patient: {
    id: 'pt-001',
    ageYears: 58,
    sex: 'male',
    bedLabel: 'Bay 3',
    boardLines: ['Male, 58 years', 'Shortness of breath, fever', 'Allergies: none known', 'Doctor on call: ext. 214'],
    appearance: { hair: 'short', hairColor: 0x8c8c8c, beard: true, skin: 0xd9a07c, gown: 0x8fc9d8, alertness: 1 },
  },
  initialVitals: { heartRate: 108, spo2: 92, respiratoryRate: 24, systolic: 104, diastolic: 66, temperatureC: 38.3 },
  createEngine() {
    return new HypoxiaEngine(this.initialVitals);
  },
  isStable: (v, iv) => v.spo2 >= 94 && iv.oxygen !== null,
  isFailed: (v) => v.spo2 < 78,
  findings: respiratoryFindings,
  doctorReply: (c) => t(c.stabilised ? 'doc.thanks' : c.oxygenOn ? 'doc.keepO2' : 'doc.startO2'),
  scorer: new RespiratoryScorer(),
};

export const shockScenario: Scenario = {
  id: 'shock',
  titleKey: 'scen.shock.title',
  blurbKey: 'scen.shock.blurb',
  introKey: 'scen.shock.intro',
  objectiveKey: 'obj.assess',
  stableObjectiveKey: 'obj.stable',
  timeLimitSec: 420,
  stableSeconds: 20,
  patient: {
    id: 'pt-002',
    ageYears: 34,
    sex: 'female',
    bedLabel: 'Bay 5',
    boardLines: ['Female, 34 years', 'Vomiting and diarrhoea x 3 days', 'Dizzy, weak, thirsty', 'Doctor on call: ext. 214'],
    appearance: { hair: 'long', hairColor: 0x3a2619, beard: false, skin: 0xe8b898, gown: 0xc9b8e0, alertness: 0.5 },
  },
  initialVitals: { heartRate: 128, spo2: 95, respiratoryRate: 24, systolic: 82, diastolic: 50, temperatureC: 37.4 },
  createEngine() {
    return new HypovolemiaEngine(this.initialVitals, 1000);
  },
  isStable: (v) => v.systolic >= 100 && v.heartRate <= 110,
  isFailed: (v) => v.systolic < 72,
  findings: shockFindings,
  doctorReply: (c) => t(c.stabilised ? 'doc.thanks' : c.ivOn ? 'doc.keepFluids' : 'doc.startFluids'),
  scorer: new ShockScorer(),
};

export const SCENARIOS: Record<ScenarioId, Scenario> = { respiratory: respiratoryScenario, shock: shockScenario };

export { ScenarioSession, type EndReason } from './session';
