import type { SimEvent } from '../../core/EventLog';
import { t } from '../../i18n';
import { FLUIDS, type FluidType } from '../physiology/fluids';
import type { Scenario } from '../scenarios';
import { Events, ItemList, finish, scoreAssessment, scoreEscalation } from './common';
import type { PerformanceScorer, ScoreReport } from './index';

/** Low blood pressure (hypovolaemia) case, 100 points. */
export class ShockScorer implements PerformanceScorer {
  score(events: readonly SimEvent[], _scenario: Scenario): ScoreReport {
    const ev = new Events(events);
    const list = new ItemList();
    const iv = ev.first('iv-started');
    const legs = ev.first('legs-raised');
    const headUp = ev.first('head-raised');
    const recheck = ev.firstAfter(iv, 'monitor-checked', 'bp-measured');

    scoreAssessment(ev, list, ['iv-started', 'legs-raised']);

    // Timely fluids
    if (!iv) list.add('sc.fluidTime.label', 0, 15, t('sc.fluidTime.none'));
    else {
      const s = Math.round(iv.t);
      if (iv.t <= 60) list.add('sc.fluidTime.label', 15, 15, t('sc.fluidTime.t1', { s }));
      else if (iv.t <= 120) list.add('sc.fluidTime.label', 11, 15, t('sc.fluidTime.t2', { s }));
      else if (iv.t <= 200) list.add('sc.fluidTime.label', 6, 15, t('sc.fluidTime.t3', { s }));
      else list.add('sc.fluidTime.label', 2, 15, t('sc.fluidTime.t4', { s }));
    }

    // Fluid type + rate (first infusion)
    if (!iv) {
      list.add('sc.fluidType.label', 0, 15, t('sc.fluidType.none'));
      list.add('sc.rate.label', 0, 15, t('sc.rate.none'));
    } else {
      const fluid = iv.data?.fluid as FluidType;
      const rate = iv.data?.rateMlHr as number;
      const name = t(FLUIDS[fluid].labelKey);
      const good = fluid !== 'd5w';
      list.add('sc.fluidType.label', good ? 15 : 3, 15, t(good ? 'sc.fluidType.ok' : 'sc.fluidType.bad', { fluid: name }));
      if (rate >= 2000) list.add('sc.rate.label', 15, 15, t('sc.rate.fast', { rate }));
      else if (rate >= 1000) list.add('sc.rate.label', 8, 15, t('sc.rate.mid', { rate }));
      else list.add('sc.rate.label', 3, 15, t('sc.rate.slow', { rate }));
    }

    // Positioning: legs up helps, sitting up hurts
    let posPoints = !legs ? 0 : legs.t <= 150 ? 10 : 6;
    let posText = t(!legs ? 'sc.legs.none' : legs.t <= 150 ? 'sc.legs.ok' : 'sc.legs.late');
    if (headUp) {
      posPoints = Math.max(0, posPoints - 5);
      posText += t('sc.legs.headUp');
    }
    list.add('sc.pos.label', posPoints, 10, posText);

    // Reassessment
    if (!iv) list.add('sc.recheck.label', 0, 15, t('sc.recheck.none'));
    else if (!recheck) list.add('sc.recheck.label', 0, 15, t('sc.recheckBp.never'));
    else if (recheck.t - iv.t <= 120) list.add('sc.recheck.label', 15, 15, t('sc.recheckBp.ok'));
    else list.add('sc.recheck.label', 8, 15, t('sc.recheckBp.late'));

    scoreEscalation(ev, list, iv, recheck);

    const stabilised = !!ev.first('patient-stabilised');
    list.add('sc.out.label', stabilised ? 10 : 0, 10, t(stabilised ? 'sc.out.ok' : 'sc.out.no'));
    return finish(list, ev);
  }
}
