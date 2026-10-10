import { hasKey } from '../i18n';
import type { Vitals } from './patient/types';
import type { ScenarioId } from './scenarios';

/**
 * The medication cart formulary (educational model). A nurse never gives a drug without an order:
 * the nurse asks the doctor (chat or the cart), the doctor approves or declines with a reason that
 * depends on the case, and only approved drugs can be given.
 */
export type MedId = 'paracetamol' | 'salbutamol' | 'ondansetron' | 'ceftriaxone' | 'morphine' | 'furosemide' | 'insulin';

export interface Medication {
  id: MedId;
  nameKey: string;
  doseKey: string;
  /** Change in the vitals once given; it ramps in over `rampSec` of simulated time and then stays. */
  effect?: { delta: Partial<Vitals>; rampSec: number };
}

export const MEDICATIONS: readonly Medication[] = [
  { id: 'paracetamol', nameKey: 'med.paracetamol', doseKey: 'med.paracetamol.dose', effect: { delta: { temperatureC: -1.1, heartRate: -4 }, rampSec: 25 } },
  { id: 'salbutamol', nameKey: 'med.salbutamol', doseKey: 'med.salbutamol.dose' },
  { id: 'ondansetron', nameKey: 'med.ondansetron', doseKey: 'med.ondansetron.dose', effect: { delta: { heartRate: -3 }, rampSec: 20 } },
  { id: 'ceftriaxone', nameKey: 'med.ceftriaxone', doseKey: 'med.ceftriaxone.dose' },
  { id: 'morphine', nameKey: 'med.morphine', doseKey: 'med.morphine.dose' },
  { id: 'furosemide', nameKey: 'med.furosemide', doseKey: 'med.furosemide.dose' },
  { id: 'insulin', nameKey: 'med.insulin', doseKey: 'med.insulin.dose' },
];

export const medById = (id: MedId): Medication => MEDICATIONS.find((m) => m.id === id)!;

/** Drugs the doctor would order in each case, with the reason shown to the nurse. */
const APPROVED: Record<ScenarioId, Partial<Record<MedId, string>>> = {
  respiratory: { paracetamol: 'med.ok.respiratory.paracetamol' },
  shock: { ondansetron: 'med.ok.shock.ondansetron' },
  hypoglycemia: {},
};

export interface OrderReview {
  approved: boolean;
  reasonKey: string;
}

/** The doctor's decision when the nurse asks for an order. */
export function reviewOrder(scenario: ScenarioId, med: MedId): OrderReview {
  const ok = APPROVED[scenario][med];
  if (ok) return { approved: true, reasonKey: ok };
  const specific = `med.no.${scenario}.${med}`;
  return { approved: false, reasonKey: hasKey(specific) ? specific : `med.no.${med}` };
}
