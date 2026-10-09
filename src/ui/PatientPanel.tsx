import { useState } from 'react';
import type { PatientModel } from '../domain/patient/PatientModel';
import { useI18n } from '../i18n';
import Sheet from './Sheet';

export interface PatientActions {
  ask(): string;
  skin(): string;
  heart(): string;
  lungs(): string;
  temp(): string;
  bp(): string;
  ivSite(): string;
  doctor(): string;
  toggleHead(): { message: string; on: boolean };
  toggleLegs(): { message: string; on: boolean };
}

interface Props {
  patient: PatientModel;
  touch: boolean;
  actions: PatientActions;
  onClose: () => void;
}

export default function PatientPanel({ patient, touch, actions, onClose }: Props) {
  const { t } = useI18n();
  const [head, setHead] = useState(patient.getInterventions().headElevated);
  const [legs, setLegs] = useState(patient.getInterventions().legsRaised);
  const [response, setResponse] = useState<string | null>(null);
  const { profile } = patient;

  const say = (fn: () => string) => () => setResponse(fn());

  return (
    <Sheet
      title={t('pt.title')}
      subtitle={t('panel.patientLine', { bay: profile.bedLabel, sex: t(`sex.${profile.sex}`), age: profile.ageYears })}
      touch={touch}
      onClose={onClose}
    >
      <p className="sheet__label">{t('pt.group.assess')}</p>
      <div className="actions">
        <button type="button" className="btn" onClick={say(actions.ask)}>{t('act.ask')}</button>
        <button type="button" className="btn" onClick={say(actions.skin)}>{t('act.skin')}</button>
        <button type="button" className="btn" onClick={say(actions.heart)}>{t('act.heart')}</button>
        <button type="button" className="btn" onClick={say(actions.lungs)}>{t('act.lungs')}</button>
        <button type="button" className="btn" onClick={say(actions.temp)}>{t('act.temp')}</button>
        <button type="button" className="btn" onClick={say(actions.bp)}>{t('act.bp')}</button>
      </div>

      <p className="sheet__label">{t('pt.group.care')}</p>
      <div className="actions">
        <button
          type="button"
          className="btn"
          onClick={() => {
            const r = actions.toggleHead();
            setHead(r.on);
            setResponse(r.message);
          }}
        >
          {t(head ? 'act.headDown' : 'act.headUp')}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            const r = actions.toggleLegs();
            setLegs(r.on);
            setResponse(r.message);
          }}
        >
          {t(legs ? 'act.legsDown' : 'act.legsUp')}
        </button>
        <button type="button" className="btn" onClick={say(actions.ivSite)}>{t('act.ivSite')}</button>
        <button type="button" className="btn" onClick={say(actions.doctor)}>{t('act.doctor')}</button>
      </div>

      <p className={`response${response ? '' : ' response--empty'}`} aria-live="polite">
        {response ?? t('pt.choose')}
      </p>
    </Sheet>
  );
}
