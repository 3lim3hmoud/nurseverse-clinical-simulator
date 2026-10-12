import { useEffect, useRef, useState, type FormEvent } from 'react';
import { aiIsRemote, type ChatTurn } from '../services/ai';
import { useI18n } from '../i18n';

/** Quick questions: each one is sent as normal text, so it goes through the same understanding as typed questions. */
const QUICK = ['complaint', 'onset', 'pain', 'allergies', 'meds', 'pmh', 'intake'] as const;

/** Quick questions for the on-call doctor. */
const DOCTOR_QUICK = ['report', 'advice', 'arrive', 'paracetamol'] as const;
const COACH_QUICK = ['next', 'why', 'equipment', 'steps'] as const;

interface Props {
  turns: ChatTurn[];
  onTurns: (turns: ChatTurn[]) => void;
  ask: (question: string, history: readonly ChatTurn[]) => Promise<{ text: string }>;
  onTypingChange: (typing: boolean) => void;
  /** Who the nurse is talking to (default: the patient). */
  peer?: 'patient' | 'doctor' | 'coach';
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
const SpeechRec: (new () => Recognition) | undefined =
  typeof window === 'undefined' ? undefined : (window as unknown as Record<string, new () => Recognition>).SpeechRecognition ?? (window as unknown as Record<string, new () => Recognition>).webkitSpeechRecognition;

export default function PatientChat({ turns, onTurns, ask, onTypingChange, peer = 'patient' }: Props) {
  const { t, lang } = useI18n();
  const doctor = peer === 'doctor';
  const coach = peer === 'coach';
  const quick = coach ? COACH_QUICK : doctor ? DOCTOR_QUICK : QUICK;
  const prefix = coach ? 'pcoach' : doctor ? 'dchat' : 'chat';
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const turnsRef = useRef(turns);
  turnsRef.current = turns;

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [turns, busy]);

  // never leave the clock paused if the tab is switched while the field is focused
  useEffect(() => () => onTypingChange(false), [onTypingChange]);

  // Voice input (Chrome / Android / Safari): speak, and the question is sent when the phrase ends
  useEffect(() => () => recRef.current?.stop(), []);
  const listen = () => {
    if (!SpeechRec || busy) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SpeechRec();
    rec.lang = lang === 'ar' ? 'ar-EG' : 'en-US';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const said = e.results[0]?.[0]?.transcript ?? '';
      if (said.trim()) void send(said);
    };
    rec.onend = () => {
      setListening(false);
      onTypingChange(false);
    };
    rec.onerror = () => rec.onend?.();
    recRef.current = rec;
    onTypingChange(true); // keep the clock paused while talking
    setListening(true);
    rec.start();
  };

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
        {SpeechRec && (
          <button type="button" className={`btn chat__mic${listening ? ' chat__mic--on' : ''}`} onClick={listen} disabled={busy} aria-label={t(listening ? 'chat.micListening' : 'chat.mic')} title={t('chat.mic')}>
            {listening ? '●' : '🎤'}
          </button>
        )}
        <button type="submit" className="btn btn--primary" disabled={busy || !text.trim()}>
          {t('chat.send')}
        </button>
      </form>
      <p className="sheet__muted chat__note">{coach ? t(aiIsRemote ? 'pcoach.noteRemote' : 'pcoach.noteLocal') : doctor ? t(aiIsRemote ? 'dchat.noteRemote' : 'dchat.noteLocal') : t(aiIsRemote ? 'chat.noteRemote' : 'chat.noteLocal')}</p>
    </div>
  );
}
