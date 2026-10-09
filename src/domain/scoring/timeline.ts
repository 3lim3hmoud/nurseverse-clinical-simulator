import type { SimEvent } from '../../core/EventLog';
import { t } from '../../i18n';
import { FLUIDS, type FluidType } from '../physiology/fluids';
import { OXYGEN_DEVICES, type OxygenDevice } from '../physiology/oxygen';

export interface TimelineRow {
  time: string;
  text: string;
}

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Human-readable list of what the student did, in order (in the current language). */
export function buildTimeline(events: readonly SimEvent[]): TimelineRow[] {
  const rows: TimelineRow[] = [];
  for (const e of events) {
    const d = (e.data ?? {}) as Record<string, string | number>;
    const device = d.device ? t(OXYGEN_DEVICES[d.device as OxygenDevice].labelKey) : '';
    const fluid = d.fluid ? t(FLUIDS[d.fluid as FluidType].labelKey) : '';
    let text: string | null = null;
    switch (e.type) {
      case 'monitor-checked': text = t('tl.monitor', { spo2: d.spo2, hr: d.hr, rr: d.rr }); break;
      case 'oxygen-applied': text = t('tl.o2on', { device, flow: d.flowLpm, spo2: d.spo2 }); break;
      case 'oxygen-changed': text = t('tl.o2change', { device, flow: d.flowLpm, spo2: d.spo2 }); break;
      case 'oxygen-removed': text = t('tl.o2off'); break;
      case 'iv-started': text = t('tl.ivOn', { fluid, rate: d.rateMlHr, sys: d.sys, dia: d.dia }); break;
      case 'iv-changed': text = t('tl.ivChange', { fluid, rate: d.rateMlHr }); break;
      case 'iv-stopped': text = t('tl.ivOff'); break;
      case 'iv-bag-changed': text = t('tl.newBag'); break;
      case 'head-raised': text = t('tl.headUp'); break;
      case 'head-lowered': text = t('tl.headDown'); break;
      case 'legs-raised': text = t('tl.legsUp'); break;
      case 'legs-lowered': text = t('tl.legsDown'); break;
      case 'patient-asked': text = t('tl.ask'); break;
      case 'skin-checked': text = t('tl.skin'); break;
      case 'heart-auscultated': text = t('tl.heart'); break;
      case 'lungs-auscultated': text = t('tl.lungs'); break;
      case 'temp-measured': text = t('tl.temp'); break;
      case 'bp-measured': text = t('tl.bp', { sys: d.sys, dia: d.dia }); break;
      case 'iv-checked': text = t('tl.ivSite'); break;
      case 'alarm-silenced': text = t('tl.alarm'); break;
      case 'doctor-notified': text = t('tl.doctor', { spo2: d.spo2, sys: d.sys, dia: d.dia }); break;
      case 'patient-stabilised': text = t('tl.stable'); break;
      case 'session-end': text = t('tl.end'); break;
    }
    if (text) rows.push({ time: mmss(e.t), text });
  }
  return rows;
}
