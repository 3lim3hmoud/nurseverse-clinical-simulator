import { useEffect, useRef, useState, type FormEvent } from 'react';
import { aiIsRemote, type ChatTurn } from '../services/ai';
import { useI18n } from '../i18n';

/** Quick questions: each one is sent as normal text, so it goes through the same understanding as typed questions. */
const QUICK = ['complaint', 'onset', 'pain', 'allergies', 'meds', 'pmh', 'intake'] as const;

/** Quick questions for the on-call doctor. */
const DOCTOR_QUICK = ['report', 'advice', 'arrive', 'paracetamol'] as const;

interface Props {
  turns: ChatTurn[];
  onTurns: (turns: ChatTurn[]) => void;
  ask: (question: string, history: readonly ChatTurn[]) => Promise<{ text: string }>;
  onTypingChange: (typing: boolean) => void;
  /** Who the nurse is talking to (default: the patient). */
  peer?: 'patient' | 'doctor';
}

export default function PatientChat({ turns, onTurns, ask, onTypingChange, peer = 'patient' }: Props) {
  const { t } = useI18n();
  const doctor = peer === 'doctor';
  const quick = doctor ? DOCTOR_QUICK : QUICK;
  const prefix = doctor ? 'dchat' : 'chat';
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const turnsRef = useRef(turns);
  turnsRef.current = turns;

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [turns, busy]);

  // never leave the clock paused if the tab is switched while the field is focused
  useEffect(() => () => onTypingChange(false), [onTypingChange]);

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || busy) return;
    const history = turnsRef.current;
    onTurns([...history, { from: 'nurse', text: question }]);
    setText('');
    setBusy(true);
    try {
      const reply = await ask(question, history);
      onTurns([...turnsRef.current, { from: peer, text: reply.text }]);
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void send(text);
  };

  return (
    <div className="chat">
      <div className="chat__log" ref={logRef} aria-live="polite">
        {turns.length === 0 && <p className="sheet__muted">{t(`${prefix}.empty`)}</p>}
        {turns.map((m, i) => (
          <div key={i} className={`bubble bubble--${m.from}`}>
            {m.text}
          </div>
        ))}
        {busy && <div className={`bubble bubble--${peer} bubble--typing`}>…</div>}
      </div>

      <div className="chat__chips">
        {quick.map((k) => (
          <button key={k} type="button" className="chip chip--q" disabled={busy} onClick={() => void send(t(`${prefix}.q.${k}`))}>
            {t(`${prefix}.q.${k}`)}
          </button>
        ))}
      </div>

      <form className="chat__form" onSubmit={submit}>
        <input
          type="text"
          dir="auto"
          value={text}
          maxLength={200}
          autoComplete="off"
          enterKeyHint="send"
          placeholder={t(`${prefix}.placeholder`)}
          aria-label={t(`${prefix}.placeholder`)}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => onTypingChange(true)}
          onBlur={() => onTypingChange(false)}
        />
        <button type="submit" className="btn btn--primary" disabled={busy || !text.trim()}>
          {t('chat.send')}
        </button>
      </form>
      <p className="sheet__muted chat__note">{doctor ? t('dchat.noteLocal') : t(aiIsRemote ? 'chat.noteRemote' : 'chat.noteLocal')}</p>
    </div>
  );
}
