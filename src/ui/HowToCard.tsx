import { useI18n } from '../i18n';
import type { Mode } from '../domain/procedures/types';

interface Props {
  touch: boolean;
  mode: Mode;
  onClose: () => void;
}

/** First-time help: how to move, what to press and what to do first. */
export default function HowToCard({ touch, mode, onClose }: Props) {
  const { t, dir } = useI18n();
  const kind = touch ? 'touch' : 'desk';
  return (
    <div className="howto" dir={dir} role="dialog" aria-modal="true">
      <div className="howto__card">
        <h2>{t('howto.title')}</h2>
        <ul>
          <li>🚶 {t(`howto.move.${kind}`)}</li>
          <li>👆 {t(`howto.interact.${kind}`)}</li>
          <li>☰ {t(`howto.panels.${kind}`)}</li>
          {mode === 'practice' && <li>🧭 {t('howto.guide')}</li>}
        </ul>
        <p className="howto__first">{t(mode === 'practice' ? 'howto.first' : 'howto.first.exam')}</p>
        <button type="button" className="btn btn--primary" onClick={onClose}>
          {t('howto.go')}
        </button>
      </div>
    </div>
  );
}
