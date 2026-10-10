import { useState } from 'react';
import type { SbarDraft, SbarOption } from '../domain/scenarios/sbar';
import { useI18n } from '../i18n';

interface Props {
  draft: SbarDraft;
  onSend: (option: SbarOption) => void;
  onBack: () => void;
}

/** Situation-Background-Assessment-Recommendation handover. The nurse chooses the Recommendation. */
export default function SbarReport({ draft, onSend, onBack }: Props) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<SbarOption | null>(null);

  return (
    <div className="sbar">
      <p className="sheet__muted sbar__intro">{t('sbar.intro')}</p>

      <section className="sbar__block">
        <h3>{t('sbar.s')}</h3>
        <p>{draft.situation}</p>
      </section>
      <section className="sbar__block">
        <h3>{t('sbar.b')}</h3>
        <ul>
          {draft.background.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>
      <section className="sbar__block">
        <h3>{t('sbar.a')}</h3>
        <p>{draft.assessment}</p>
      </section>
      <section className="sbar__block">
        <h3>{t('sbar.r')}</h3>
        <div className="choices">
          {draft.options.map((o) => (
            <button key={o.id} type="button" className={`choice${picked?.id === o.id ? ' choice--on' : ''}`} onClick={() => setPicked(o)}>
              <strong>{o.label}</strong>
            </button>
          ))}
        </div>
      </section>

      <div className="actions">
        <button type="button" className="btn btn--primary" disabled={!picked} onClick={() => picked && onSend(picked)}>
          {t('sbar.send')}
        </button>
        <button type="button" className="btn" onClick={onBack}>
          {t('sbar.back')}
        </button>
      </div>
    </div>
  );
}
