import type { SimEvent } from '../../core/EventLog';
import { t } from '../../i18n';
import type { ScoreItem, ScoreReport } from './index';

/** Events that count as examining the patient. */
export const ASSESSMENT_EVENTS = [
  'monitor-checked',
  'bp-measured',
  'skin-checked',
  'lungs-auscultated',
  'heart-auscultated',
  'temp-measured',
  'patient-asked',
  'history-asked',
  'glucose-checked',
];

export class Events {
  constructor(readonly all: readonly SimEvent[]) {}
  first(...types: string[]): SimEvent | undefined {
    return this.all.find((e) => types.includes(e.type));
  }
  list(...types: string[]): SimEvent[] {
    return this.all.filter((e) => types.includes(e.type));
  }
  index(e: SimEvent | undefined): number {
    return e ? this.all.indexOf(e) : -1;
  }
  /** First event of these types that happened after `after`. */
  firstAfter(after: SimEvent | undefined, ...types: string[]): SimEvent | undefined {
    if (!after) return undefined;
    const i = this.index(after);
    return this.all.find((e, idx) => idx > i && types.includes(e.type));
  }
}

export class ItemList {
  items: ScoreItem[] = [];
  add(label: string, points: number, maxPoints: number, feedback: string): void {
    this.items.push({ label: t(label), points, maxPoints, feedback });
  }
}

/** Shared "initial assessment" item (10 points): examined the patient before the first treatment. */
export function scoreAssessment(ev: Events, list: ItemList, treatmentTypes: string[]): void {
  const firstCheck = ev.first(...ASSESSMENT_EVENTS);
  const firstTreatment = ev.first(...treatmentTypes);
  if (!firstCheck) list.add('sc.assess.label', 0, 10, t('sc.assess.none'));
  else if (!firstTreatment || ev.index(firstCheck) < ev.index(firstTreatment)) list.add('sc.assess.label', 10, 10, t('sc.assess.ok'));
  else list.add('sc.assess.label', 5, 10, t('sc.assess.late'));
}

/** Shared "escalation" item (10 points). */
export function scoreEscalation(ev: Events, list: ItemList, treated: SimEvent | undefined, rechecked: SimEvent | undefined): void {
  const doctor = ev.first('doctor-notified');
  if (!doctor) list.add('sc.esc.label', 0, 10, t('sc.esc.none'));
  else if (treated && rechecked && ev.index(doctor) > ev.index(treated) && ev.index(doctor) > ev.index(rechecked)) list.add('sc.esc.label', 10, 10, t('sc.esc.ok'));
  else list.add('sc.esc.label', 4, 10, t('sc.esc.early'));
}

export function finish(list: ItemList, ev: Events): ScoreReport {
  const total = list.items.reduce((sum, i) => sum + i.points, 0);
  const grade = t(total >= 85 ? 'grade.excellent' : total >= 70 ? 'grade.good' : total >= 50 ? 'grade.needs' : 'grade.unsafe');
  const reason = (ev.first('session-end')?.data?.reason as string | undefined) ?? 'ended-by-student';
  return { total, grade, outcome: t(`outcome.${reason}`), items: list.items };
}
