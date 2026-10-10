import { useState } from 'react';
import type { GlucoseTreatment } from '../domain/physiology/glucose';
import type { PatientModel } from '../domain/patient/PatientModel';
import type { SbarDraft, SbarOption } from '../domain/scenarios/sbar';
import { useI18n } from '../i18n';
import type { ChatTurn, PatientReply } from '../services/ai';
import GlucoseTools from './GlucoseTools';
import PatientChat from './PatientChat';
import SbarReport from './SbarReport';
import Sheet from './Sheet';

export interface PatientActions {
  ask(): string;
  skin(): string;
  heart(): string;
  lungs(): string;
  temp(): string;
  bp(): string;
  ivSite(): string;
  sbarDraft(): SbarDraft;
  sendSbar(option: SbarOption, draft: SbarDraft): Promise<string>;
  checkGlucose(): string;
  giveGlucose(kind: GlucoseTreatment): string;
  askPatient(question: string, history: readonly ChatTurn[]): Promise<PatientReply>;
  toggleHead(): { message: string; on: boolean };
  toggleLegs(): { message: string; on: boolean };
}

interface Props {
  patient: PatientModel;
  touch: boolean;
  hasGlucometer: boolean;
  actions: PatientActions;
  turns: ChatTurn[];
  onTurns: (turns: ChatTurn[]) => void;
  onTypingChange: (typing: boolean) => void;
  onClose: () => void;
}

type Tab = 'examine' | 'talk' | 'report';

export default function PatientPanel({ patient, touch, hasGlucometer, actions, turns, onTurns, onTypingChange, onClose }: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('examine');
  const [head, setHead] = useState(patient.getInterventions().headElevated);
  const [legs, setLegs] = useState(patient.getInterventions().legsRaised);
  const [response, setResponse] = useState<string | null>(null);
  const [draft, setDraft] = useState<SbarDraft | null>(null);
  const { profile } = patient;

  const say = (fn: () => string) => () => setResponse(fn());

  const openReport = () => {
    setDraft(actions.sbarDraft());
    setTab('report');
  };

  return (
    <Sheet
      title={t('pt.title')}
      subtitle={t('panel.patientLine', { bay: profile.bedLabel, sex: t(`sex.${profile.sex}`), age: profile.ageYears })}
      touch={touch}
      onClose={onClose}
    >
      <div className="tabs" role="tablist">
        {(['examine', 'talk'] as const).map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`tab${tab === id ? ' tab--on' : ''}`} onClick={() => setTab(id)}>
            {t(`pt.tab.${id}`)}
          </button>
        ))}
        {tab === 'report' && (
          <button type="button" role="tab" aria-selected className="tab tab--on">
            {t('pt.tab.report')}
          </button>
        )}
      </div>

      {tab === 'talk' && <PatientChat turns={turns} onTurns={onTurns} ask={actions.askPatient} onTypingChange={onTypingChange} />}

      {tab === 'report' && draft && (
        <SbarReport
          draft={draft}
          onBack={() => setTab('examine')}
          onSend={(option) => {
            setResponse(t('pt.waitDoctor'));
            setTab('examine');
            void actions.sendSbar(option, draft).then(setResponse);
          }}
        />
      )}

      {tab === 'examine' && (
        <>
          <p className="sheet__label">{t('pt.group.assess')}</p>
          <div className="actions">
            <button type="button" className="btn" onClick={say(actions.ask)}>{t('act.ask')}</button>
            <button type="button" className="btn" onClick={say(actions.skin)}>{t('act.skin')}</button>
            <button type="button" className="btn" onClick={say(actions.heart)}>{t('act.heart')}</button>
            <button type="button" className="btn" onClick={say(actions.lungs)}>{t('act.lungs')}</button>
            <button type="button" className="btn" onClick={say(actions.temp)}>{t('act.temp')}</button>
            <button type="button" className="btn" onClick={say(actions.bp)}>{t('act.bp')}</button>
          </div>

          {hasGlucometer && (
            <GlucoseTools onCheck={() => setResponse(actions.checkGlucose())} onGive={(kind) => setResponse(actions.giveGlucose(kind))} />
          )}

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
            <button type="button" className="btn" onClick={openReport}>{t('act.doctor')}</button>
          </div>

          <p className={`response${response ? '' : ' response--empty'}`} aria-live="polite">
            {response ?? t('pt.choose')}
          </p>
        </>
      )}
    </Sheet>
  );
}
