import type { SimEvent } from '../../core/EventLog';
import { t } from '../../i18n';
import { OXYGEN_DEVICES, isFlowAppropriate, type OxygenDevice } from '../physiology/oxygen';
import type { Scenario } from '../scenarios';
import { Events, ItemList, finish, scoreAssessment, scoreEscalation } from './common';
import type { PerformanceScorer, ScoreReport } from './index';

/** How well a device fits the patient's SpO2 at the moment oxygen was started (educational rules). */
function deviceFit(spo2: number, device: OxygenDevice): { points: number; key: string } {
  if (spo2 >= 90) {
    if (device === 'nasal-cannula') return { points: 20, key: 'sc.fit.best' };
    if (device === 'simple-mask') return { points: 16, key: 'sc.fit.more' };
    return { points: 8, key: 'sc.fit.more' };
  }
  if (spo2 >= 85) {
    if (device === 'simple-mask') return { points: 20, key: 'sc.fit.best' };
    if (device === 'non-rebreather') return { points: 14, key: 'sc.fit.more' };
    return { points: 8, key: 'sc.fit.less' };
  }
  if (device === 'non-rebreather') return { points: 20, key: 'sc.fit.best' };
  if (device === 'simple-mask') return { points: 10, key: 'sc.fit.less' };
  return { points: 3, key: 'sc.fit.far' };
}

/** Oxygen case, 100 points. */
export class RespiratoryScorer implements PerformanceScorer {
  score(events: readonly SimEvent[], _scenario: Scenario): ScoreReport {
    const ev = new Events(events);
    const list = new ItemList();
    const o2 = ev.first('oxygen-applied');
    const head = ev.first('head-raised');
    const recheck = ev.firstAfter(o2, 'monitor-checked');

    scoreAssessment(ev, list, ['oxygen-applied', 'head-raised']);

    // Timely oxygen
    if (!o2) list.add('sc.o2time.label', 0, 20, t('sc.o2time.none'));
    else {
      const s = Math.round(o2.t);
      if (o2.t <= 60) list.add('sc.o2time.label', 20, 20, t('sc.o2time.t1', { s }));
      else if (o2.t <= 120) list.add('sc.o2time.label', 14, 20, t('sc.o2time.t2', { s }));
      else if (o2.t <= 180) list.add('sc.o2time.label', 8, 20, t('sc.o2time.t3', { s }));
      else list.add('sc.o2time.label', 3, 20, t('sc.o2time.t4', { s }));
    }

    // Device + flow (first application)
    if (!o2) {
      list.add('sc.device.label', 0, 20, t('sc.device.none'));
      list.add('sc.flow.label', 0, 10, t('sc.flow.none'));
    } else {
      const device = o2.data?.device as OxygenDevice;
      const flow = o2.data?.flowLpm as number;
      const spo2 = o2.data?.spo2 as number;
      const name = t(OXYGEN_DEVICES[device].labelKey);
      const fit = deviceFit(spo2, device);
      list.add('sc.device.label', fit.points, 20, t(fit.key, { device: name, spo2 }));
      const [lo, hi] = OXYGEN_DEVICES[device].goodRange;
      const ok = isFlowAppropriate({ device, flowLpm: flow });
      list.add('sc.flow.label', ok ? 10 : 0, 10, t(ok ? 'sc.flow.ok' : 'sc.flow.bad', { flow, lo, hi }));
    }

    // Reassessment
    if (!o2) list.add('sc.recheck.label', 0, 15, t('sc.recheck.none'));
    else if (!recheck) list.add('sc.recheck.label', 0, 15, t('sc.recheck.never'));
    else if (recheck.t - o2.t <= 120) list.add('sc.recheck.label', 15, 15, t('sc.recheck.ok'));
    else list.add('sc.recheck.label', 8, 15, t('sc.recheck.late'));

    // Positioning
    if (!head) list.add('sc.pos.label', 0, 10, t('sc.pos.none'));
    else if (head.t <= 120) list.add('sc.pos.label', 10, 10, t('sc.pos.ok'));
    else list.add('sc.pos.label', 6, 10, t('sc.pos.late'));

    scoreEscalation(ev, list, o2, recheck);

    const stabilised = !!ev.first('patient-stabilised');
    list.add('sc.out.label', stabilised ? 5 : 0, 5, t(stabilised ? 'sc.out.ok' : 'sc.out.no'));
    return finish(list, ev);
  }
}
