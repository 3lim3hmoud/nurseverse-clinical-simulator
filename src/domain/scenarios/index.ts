import { t } from '../../i18n';
import type { Interventions } from '../physiology/interventions';
import { HypoglycemiaEngine } from '../physiology/HypoglycemiaEngine';
import { HypovolemiaEngine } from '../physiology/HypovolemiaEngine';
import { HypoxiaEngine } from '../physiology/HypoxiaEngine';
import type { PhysiologyEngine } from '../physiology';
import type { PatientProfile, Vitals } from '../patient/types';
import { RespiratoryScorer } from '../scoring/RespiratoryScorer';
import { HypoglycemiaScorer } from '../scoring/HypoglycemiaScorer';
import { ShockScorer } from '../scoring/ShockScorer';
import type { PerformanceScorer } from '../scoring';
import { hypoglycemiaFindings, respiratoryFindings, shockFindings, type Findings, type SimExtras } from './findings';

export type ScenarioId = 'respiratory' | 'shock' | 'hypoglycemia';
export type Severity3 = 'severe' | 'moderate' | 'mild';

export interface DoctorContext {
  stabilised: boolean;
  oxygenOn: boolean;
  ivOn: boolean;
  glucoseTreated?: boolean;
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
  isStable(v: Vitals, iv: Interventions, x: SimExtras): boolean;
  isFailed(v: Vitals, x: SimExtras): boolean;
  /** How unwell the patient looks right now (drives the interview answers). */
  severity(v: Vitals, x: SimExtras): Severity3;
  /** Extra bedside tools this case offers. */
  tools?: { glucometer?: boolean };
  /** Topics a good history should cover in this case (used in the debrief). */
  keyHistory: string[];
  /** Recommendation options for the SBAR report: the specific, best one first. */
  sbarBestKey: string;
  debriefTipKey: string;
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
  severity: (v) => (v.spo2 < 88 ? 'severe' : v.spo2 < 94 ? 'moderate' : 'mild'),
  keyHistory: ['onset', 'allergies', 'meds', 'pmh'],
  sbarBestKey: 'sbar.rec.resp',
  debriefTipKey: 'tip.respiratory',
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
  severity: (v) => (v.systolic < 85 ? 'severe' : v.systolic < 100 ? 'moderate' : 'mild'),
  keyHistory: ['onset', 'allergies', 'meds', 'gi'],
  sbarBestKey: 'sbar.rec.shock',
  debriefTipKey: 'tip.shock',
  findings: shockFindings,
  doctorReply: (c) => t(c.stabilised ? 'doc.thanks' : c.ivOn ? 'doc.keepFluids' : 'doc.startFluids'),
  scorer: new ShockScorer(),
};

export const hypoglycemiaScenario: Scenario = {
  id: 'hypoglycemia',
  titleKey: 'scen.hypoglycemia.title',
  blurbKey: 'scen.hypoglycemia.blurb',
  introKey: 'scen.hypoglycemia.intro',
  objectiveKey: 'obj.assess',
  stableObjectiveKey: 'obj.stable',
  timeLimitSec: 420,
  stableSeconds: 20,
  patient: {
    id: 'pt-003',
    ageYears: 67,
    sex: 'male',
    bedLabel: 'Bay 2',
    boardLines: ['Male, 67 years', 'Diabetic, sweaty and confused', 'Allergies: none known', 'Doctor on call: ext. 214'],
    appearance: { hair: 'short', hairColor: 0xb5b5b5, beard: false, skin: 0xd2a07a, gown: 0xb7d7a8, alertness: 0.6 },
  },
  initialVitals: { heartRate: 112, spo2: 98, respiratoryRate: 19, systolic: 134, diastolic: 80, temperatureC: 36.5 },
  createEngine() {
    return new HypoglycemiaEngine(this.initialVitals, 38);
  },
  isStable: (v, _iv, x) => (x.glucose ?? 0) >= 70 && v.heartRate <= 105,
  isFailed: (_v, x) => (x.glucose ?? 100) < 22,
  severity: (_v, x) => ((x.glucose ?? 100) < 45 ? 'severe' : (x.glucose ?? 100) < 70 ? 'moderate' : 'mild'),
  tools: { glucometer: true },
  keyHistory: ['onset', 'meds', 'lastmeal', 'diabetes'],
  sbarBestKey: 'sbar.rec.hypo',
  debriefTipKey: 'tip.hypoglycemia',
  findings: hypoglycemiaFindings,
  doctorReply: (c) => t(c.stabilised ? 'doc.thanks' : c.glucoseTreated ? 'doc.hypoTreated' : 'doc.hypoCheck'),
  scorer: new HypoglycemiaScorer(),
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  respiratory: respiratoryScenario,
  shock: shockScenario,
  hypoglycemia: hypoglycemiaScenario,
};

export { ScenarioSession, type EndReason } from './session';
