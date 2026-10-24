import type { WashProgress } from '../game/hands/HandWashRun';
import { useI18n } from '../i18n';

interface Props {
  progress: WashProgress;
  fast: boolean;
  /** practice mode may speed the wash up; the exam always runs it in full */
  canSpeedUp: boolean;
  touch: boolean;
  onFaster(): void;
}

/** Shows which movement of the WHO hand-washing technique is being done, and how far along the wash is. */
export default function HandWashCard({ progress, fast, canSpeedUp, touch, onFaster }: Props) {
  const { t, lang, dir } = useI18n();
  const ar = lang === 'ar';
  return (
    <div className="washcard" dir={dir} role="status" aria-live="polite">
      <div className="washcard__head">
        <span className="washcard__n">
          {progress.index + 1}/{progress.total}
        </span>
        <b>{ar ? progress.ar : progress.en}</b>
      </div>
      <p className="washcard__tip">{ar ? progress.tipAr : progress.tipEn}</p>
      <div className="washcard__bar" aria-hidden="true">
        <i style={{ width: `${Math.round(progress.overall * 100)}%` }} />
      </div>
      <div className="washcard__foot">
        <small>{t(touch ? 'wash.hintTouch' : 'wash.hint')}</small>
        {canSpeedUp && (
          <button type="button" className="washcard__fast" onClick={onFaster}>
            {fast ? t('wash.normal') : t('wash.faster')}
          </button>
        )}
      </div>
    </div>
  );
}
