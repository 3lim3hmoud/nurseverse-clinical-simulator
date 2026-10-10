import { useState } from 'react';
import { MEDICATIONS, type MedId } from '../domain/medications';
import { useI18n } from '../i18n';
import Sheet from './Sheet';

interface Props {
  touch: boolean;
  ordered: readonly MedId[];
  given: readonly MedId[];
  /** Low blood sugar case: point the nurse to the glucose treatments instead. */
  glucoseHint: boolean;
  onAsk: (id: MedId) => Promise<string>;
  onGive: (id: MedId) => string;
  onClose: () => void;
}

/** The medication cart: ask the doctor for an order, then give the medication. */
export default function MedsPanel({ touch, ordered, given, glucoseHint, onAsk, onGive, onClose }: Props) {
  const { t } = useI18n();
  const [response, setResponse] = useState<string | null>(null);
  const [busy, setBusy] = useState<MedId | null>(null);

  const ask = async (id: MedId) => {
    setBusy(id);
    try {
      setResponse(await onAsk(id));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet title={t('meds.title')} subtitle={t('meds.sub')} touch={touch} onClose={onClose}>
      <p className={`response${response ? '' : ' response--empty'}`} aria-live="polite">
        {response ?? t('meds.pick')}
      </p>
      <ul className="meds">
        {MEDICATIONS.map((m) => {
          const isGiven = given.includes(m.id);
          const isOrdered = ordered.includes(m.id);
          return (
            <li key={m.id} className="med">
              <div className="med__info">
                <strong>{t(m.nameKey)}</strong>
                <span>{t(m.doseKey)}</span>
              </div>
              {isGiven ? (
                <span className="med__tag med__tag--done">✓ {t('meds.given')}</span>
              ) : isOrdered ? (
                <button type="button" className="btn btn--primary med__btn" onClick={() => setResponse(onGive(m.id))}>
                  {t('meds.give')}
                </button>
              ) : (
                <button type="button" className="btn med__btn" disabled={busy !== null} onClick={() => void ask(m.id)}>
                  {busy === m.id ? '…' : t('meds.ask')}
                </button>
              )}
              {!isGiven && <span className={`med__tag${isOrdered ? ' med__tag--ok' : ''}`}>{isOrdered ? `✓ ${t('meds.ordered')}` : t('meds.needOrder')}</span>}
            </li>
          );
        })}
      </ul>
      {glucoseHint && <p className="sheet__muted">{t('meds.hintGlucose')}</p>}
    </Sheet>
  );
}
