import { GLUCOSE_TREATMENTS, type GlucoseTreatment } from '../domain/physiology/glucose';
import { useI18n } from '../i18n';

interface Props {
  onCheck: () => void;
  onGive: (kind: GlucoseTreatment) => void;
}

/** Glucometer and treatments for low blood sugar. Only shown in cases that model blood glucose. */
export default function GlucoseTools({ onCheck, onGive }: Props) {
  const { t } = useI18n();
  return (
    <>
      <p className="sheet__label">{t('pt.group.sugar')}</p>
      <div className="actions">
        <button type="button" className="btn" onClick={onCheck}>
          {t('act.glucose')}
        </button>
      </div>
      <p className="sheet__label">{t('pt.group.treat')}</p>
      <div className="choices">
        {(Object.keys(GLUCOSE_TREATMENTS) as GlucoseTreatment[]).map((k) => (
          <button key={k} type="button" className="choice" onClick={() => onGive(k)}>
            <strong>{t(GLUCOSE_TREATMENTS[k].labelKey)}</strong>
            <span>{t(GLUCOSE_TREATMENTS[k].summaryKey)}</span>
          </button>
        ))}
      </div>
    </>
  );
}
