import { t } from '../../i18n';
import type { Vitals } from '../patient/types';

export interface SimExtras {
  glucose?: number; // mg/dL, only in cases that model blood sugar
}

/** What the student finds when they examine the patient. */
export interface Findings {
  ask(v: Vitals, x?: SimExtras): string;
  skin(v: Vitals, x?: SimExtras): string;
  heart(v: Vitals): string;
  lungs(v: Vitals): { text: string; crackles: boolean };
}

const heartGeneric = (v: Vitals) => t('heart.generic', { hr: v.heartRate });

export const respiratoryFindings: Findings = {
  ask: (v) => t(v.spo2 < 88 ? 'resp.ask.severe' : v.spo2 < 94 ? 'resp.ask.moderate' : 'resp.ask.mild'),
  skin: (v) => t(v.spo2 < 88 ? 'resp.skin.severe' : v.spo2 < 94 ? 'resp.skin.moderate' : 'resp.skin.mild'),
  heart: heartGeneric,
  lungs: (v) => ({ text: t(v.spo2 < 94 ? 'resp.lungs.bad' : 'resp.lungs.better'), crackles: true }),
};

export const shockFindings: Findings = {
  ask: (v) => t(v.systolic < 85 ? 'shock.ask.severe' : v.systolic < 100 ? 'shock.ask.moderate' : 'shock.ask.mild'),
  skin: (v) => t(v.systolic < 85 ? 'shock.skin.severe' : v.systolic < 100 ? 'shock.skin.moderate' : 'shock.skin.mild'),
  heart: (v) => (v.systolic < 100 ? t('heart.weak', { hr: v.heartRate }) : heartGeneric(v)),
  lungs: () => ({ text: t('shock.lungs'), crackles: false }),
};

const lowSugar = (x?: SimExtras) => x?.glucose ?? 100;

export const hypoglycemiaFindings: Findings = {
  ask: (_v, x) => t(lowSugar(x) < 45 ? 'hypo.ask.severe' : lowSugar(x) < 70 ? 'hypo.ask.moderate' : 'hypo.ask.mild'),
  skin: (_v, x) => t(lowSugar(x) < 45 ? 'hypo.skin.severe' : lowSugar(x) < 70 ? 'hypo.skin.moderate' : 'hypo.skin.mild'),
  heart: heartGeneric,
  lungs: () => ({ text: t('shock.lungs'), crackles: false }),
};
