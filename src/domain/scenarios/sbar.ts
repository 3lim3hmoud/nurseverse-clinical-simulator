import type { SimEvent } from '../../core/EventLog';
import { t } from '../../i18n';
import { askedTopics } from '../../services/ai/LocalDebriefing';
import { FLUIDS } from '../physiology/fluids';
import { GLUCOSE_TREATMENTS, type GlucoseTreatment } from '../physiology/glucose';
import { OXYGEN_DEVICES } from '../physiology/oxygen';
import type { PatientModel } from '../patient/PatientModel';
import type { Scenario } from './index';

export type SbarQuality = 0 | 1 | 2;

export interface SbarOption {
  id: 'review' | 'routine' | 'best';
  label: string;
  quality: SbarQuality; // 2 = the specific, best request; 1 = reasonable; 0 = unsafe
}

export interface SbarDraft {
  situation: string;
  background: string[];
  assessment: string;
  options: SbarOption[];
}

/**
 * Builds the handover report from what is really known: the live vitals, the treatment given, and only the
 * history the student actually asked for. Topics never asked show as "not asked", which is the lesson.
 */
export function buildSbar(scenario: Scenario, patient: PatientModel, events: readonly SimEvent[]): SbarDraft {
  const p = scenario.patient;
  const v = patient.getVitals();
  const iv = patient.getInterventions();

  const situation = t('sbar.situation', {
    bay: p.bedLabel,
    sex: t(`sex.${p.sex}`),
    age: p.ageYears,
    problem: t(`sbar.problem.${scenario.id}`),
  });

  const asked = askedTopics(events);
  const background = scenario.keyHistory
    .filter((k) => k !== 'onset')
    .map((k) => (asked.has(k) ? t(`sbar.bg.${scenario.id}.${k}`) : t('sbar.bg.unknown', { topic: t(`intent.${k}`) })));

  const parts: string[] = [t('sbar.vitals', { hr: v.heartRate, sys: v.systolic, dia: v.diastolic, rr: v.respiratoryRate, spo2: v.spo2, temp: v.temperatureC.toFixed(1) })];
  if (scenario.tools?.glucometer) {
    const last = [...events].reverse().find((e) => e.type === 'glucose-checked');
    parts.push(last ? t('sbar.glucose', { g: String(last.data?.glucose) }) : t('sbar.glucoseUnchecked'));
  }
  const treatments: string[] = [];
  if (iv.oxygen) treatments.push(t('sbar.o2', { device: t(OXYGEN_DEVICES[iv.oxygen.device].labelKey), flow: iv.oxygen.flowLpm }));
  if (iv.iv) treatments.push(t('sbar.iv', { fluid: t(FLUIDS[iv.iv.fluid].labelKey), rate: iv.iv.rateMlHr }));
  const given = events.find((e) => e.type === 'glucose-given');
  if (given) treatments.push(t('sbar.glucoseGiven', { treatment: t(GLUCOSE_TREATMENTS[given.data?.kind as GlucoseTreatment].labelKey) }));
  parts.push(treatments.length ? treatments.join(' ') : t('sbar.noTreatment'));

  const options: SbarOption[] = [
    { id: 'review', label: t('sbar.rec.review'), quality: 1 },
    { id: 'routine', label: t('sbar.rec.routine'), quality: 0 },
    { id: 'best', label: t(scenario.sbarBestKey), quality: 2 },
  ];
  return { situation, background, assessment: parts.join(' '), options };
}
