import type { PatientModel } from '../domain/patient/PatientModel';
import { assessVitals, type Severity } from '../domain/patient/assessment';
import { useI18n } from '../i18n';
import type { AlarmState } from '../game/Simulator';
import Sheet from './Sheet';
import { useVitals } from './useVitals';

interface Props {
  patient: PatientModel;
  alarm: AlarmState;
  touch: boolean;
  onSilence: () => void;
  onClose: () => void;
}

export default function VitalsPanel({ patient, alarm, touch, onSilence, onClose }: Props) {
  const { t } = useI18n();
  const v = useVitals(patient);
  const s = assessVitals(v);
  const { profile } = patient;
  const statusText: Record<Severity, string> = { normal: t('status.normal'), warning: t('status.warning'), critical: t('status.critical') };

  const rows = [
    { label: t('vital.hr'), value: String(v.heartRate), unit: t('unit.bpm'), severity: s.heartRate },
    { label: t('vital.spo2'), value: String(v.spo2), unit: '%', severity: s.spo2 },
    { label: t('vital.rr'), value: String(v.respiratoryRate), unit: t('unit.breaths'), severity: s.respiratoryRate },
    { label: t('vital.bp'), value: `${v.systolic}/${v.diastolic}`, unit: t('unit.mmhg'), severity: s.bloodPressure },
    { label: t('vital.temp'), value: v.temperatureC.toFixed(1), unit: t('unit.c'), severity: s.temperature },
  ];

  return (
    <Sheet
      title={t('panel.vitals')}
      subtitle={t('panel.patientLine', { bay: profile.bedLabel, sex: t(`sex.${profile.sex}`), age: profile.ageYears })}
      badge={t('panel.live')}
      touch={touch}
      onClose={onClose}
    >
      {alarm.active && (
        <div className={`alarm-bar${alarm.silenced ? ' alarm-bar--silenced' : ''}`}>
          <span>
            {t(alarm.silenced ? 'alarm.silenced' : 'alarm.label')}: {alarm.codes.map((c) => t(`alert.${c}`)).join(' · ')}
          </span>
          {!alarm.silenced && (
            <button type="button" onClick={onSilence}>
              {t('alarm.silence')}
            </button>
          )}
        </div>
      )}
      <ul className="vitals__list">
        {rows.map((r) => (
          <li key={r.label} className={`vital vital--${r.severity}`}>
            <span className="vital__label">{r.label}</span>
            <span className="vital__value">
              <bdi>{r.value}</bdi>
              <small>{r.unit}</small>
            </span>
            <span className="vital__status">{statusText[r.severity]}</span>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
