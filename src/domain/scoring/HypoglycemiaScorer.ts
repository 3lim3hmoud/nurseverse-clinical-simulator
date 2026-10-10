import type { SimEvent } from '../../core/EventLog';
import { t } from '../../i18n';
import type { GlucoseTreatment } from '../physiology/glucose';
import type { Scenario } from '../scenarios';
import { Events, ItemList, finish, scoreAssessment, scoreEscalation } from './common';
import type { PerformanceScorer, ScoreReport } from './index';

/** Low blood sugar case, 100 points. */
export class HypoglycemiaScorer implements PerformanceScorer {
  score(events: readonly SimEvent[], _scenario: Scenario): ScoreReport {
    const ev = new Events(events);
    const list = new ItemList();
    const check = ev.first('glucose-checked');
    const give = ev.first('glucose-given');
    const recheck = ev.firstAfter(give, 'glucose-checked');

    scoreAssessment(ev, list, ['glucose-given']);

    // Check the blood sugar before treating (never treat blind)
    if (!check) list.add('sc.gluCheck.label', 0, 15, t(give ? 'sc.gluCheck.blind' : 'sc.gluCheck.none'));
    else if (give && ev.index(check) > ev.index(give)) list.add('sc.gluCheck.label', 4, 15, t('sc.gluCheck.after'));
    else {
      const s = Math.round(check.t);
      if (check.t <= 60) list.add('sc.gluCheck.label', 15, 15, t('sc.gluCheck.t1', { s }));
      else if (check.t <= 120) list.add('sc.gluCheck.label', 11, 15, t('sc.gluCheck.t2', { s }));
      else list.add('sc.gluCheck.label', 6, 15, t('sc.gluCheck.t3', { s }));
    }

    // Timely treatment
    if (!give) list.add('sc.gluTime.label', 0, 15, t('sc.gluTime.none'));
    else {
      const s = Math.round(give.t);
      if (give.t <= 120) list.add('sc.gluTime.label', 15, 15, t('sc.gluTime.t1', { s }));
      else if (give.t <= 200) list.add('sc.gluTime.label', 10, 15, t('sc.gluTime.t2', { s }));
      else if (give.t <= 300) list.add('sc.gluTime.label', 6, 15, t('sc.gluTime.t3', { s }));
      else list.add('sc.gluTime.label', 2, 15, t('sc.gluTime.t4', { s }));
    }

    // Treatment choice: the patient can swallow when sitting up, so oral carbohydrate is first choice
    const kind = give?.data?.kind as GlucoseTreatment | undefined;
    if (!kind) list.add('sc.gluChoice.label', 0, 20, t('sc.gluChoice.none'));
    else if (kind === 'oral') list.add('sc.gluChoice.label', 20, 20, t('sc.gluChoice.oral'));
    else if (kind === 'iv-dextrose') list.add('sc.gluChoice.label', 16, 20, t('sc.gluChoice.iv'));
    else list.add('sc.gluChoice.label', 11, 20, t('sc.gluChoice.glucagon'));

    // Safe administration
    if (!kind) list.add('sc.gluSafe.label', 0, 10, t('sc.gluSafe.none'));
    else if (kind === 'oral') {
      const headUp = ev.first('head-raised');
      const ok = !!headUp && ev.index(headUp) < ev.index(give);
      list.add('sc.gluSafe.label', ok ? 10 : 4, 10, t(ok ? 'sc.gluSafe.oralOk' : 'sc.gluSafe.oralBad'));
    } else if (kind === 'iv-dextrose') {
      const site = ev.first('iv-checked');
      const ok = !!site && ev.index(site) < ev.index(give);
      list.add('sc.gluSafe.label', ok ? 10 : 5, 10, t(ok ? 'sc.gluSafe.ivOk' : 'sc.gluSafe.ivBad'));
    } else list.add('sc.gluSafe.label', 8, 10, t('sc.gluSafe.other'));

    // Recheck the blood sugar after treatment
    if (!give) list.add('sc.gluRecheck.label', 0, 10, t('sc.gluRecheck.none'));
    else if (!recheck) list.add('sc.gluRecheck.label', 0, 10, t('sc.gluRecheck.never'));
    else if (recheck.t - give.t <= 120) list.add('sc.gluRecheck.label', 10, 10, t('sc.gluRecheck.ok'));
    else list.add('sc.gluRecheck.label', 5, 10, t('sc.gluRecheck.late'));

    scoreEscalation(ev, list, give, recheck);

    const stabilised = !!ev.first('patient-stabilised');
    list.add('sc.out.label', stabilised ? 10 : 0, 10, t(stabilised ? 'sc.out.ok' : 'sc.out.no'));
    return finish(list, ev);
  }
}
