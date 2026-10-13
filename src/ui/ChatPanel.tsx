import { useState } from 'react';
import { useI18n } from '../i18n';
import type { ChatTurn } from '../services/ai';
import PatientChat from './PatientChat';

interface Props {
  patientTurns: ChatTurn[];
  doctorTurns: ChatTurn[];
  onPatientTurns: (turns: ChatTurn[]) => void;
  onDoctorTurns: (turns: ChatTurn[]) => void;
  askPatient: (question: string, history: readonly ChatTurn[]) => Promise<{ text: string }>;
  askDoctor: (question: string, history: readonly ChatTurn[]) => Promise<{ text: string }>;
  onTypingChange: (typing: boolean) => void;
}

/** One place to talk to the patient and to message the on-call doctor. It is a tab of the dashboard (key T). */
export default function ChatPanel({ patientTurns, doctorTurns, onPatientTurns, onDoctorTurns, askPatient, askDoctor, onTypingChange }: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<'patient' | 'doctor'>('patient');

  return (
    <div className="chatpane">
      <div className="tabs" role="tablist">
        {(['patient', 'doctor'] as const).map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`tab${tab === id ? ' tab--on' : ''}`} onClick={() => setTab(id)}>
            {t(`chatp.tab.${id}`)}
          </button>
        ))}
      </div>
      {tab === 'patient' ? (
        <PatientChat key="patient" peer="patient" turns={patientTurns} onTurns={onPatientTurns} ask={askPatient} onTypingChange={onTypingChange} />
      ) : (
        <PatientChat key="doctor" peer="doctor" turns={doctorTurns} onTurns={onDoctorTurns} ask={askDoctor} onTypingChange={onTypingChange} />
      )}
    </div>
  );
}
