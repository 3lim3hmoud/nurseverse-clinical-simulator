import { useEffect, useState } from 'react';
import type { PatientModel } from '../domain/patient/PatientModel';
import { BAG_ML, FLUID_RATES, FLUIDS, type FluidType, type IvInfusion } from '../domain/physiology';
import { useI18n } from '../i18n';
import Sheet from './Sheet';

interface Props {
  patient: PatientModel;
  touch: boolean;
  onStart: (infusion: IvInfusion) => void;
  onStop: () => void;
  onNewBag: () => void;
  onClose: () => void;
}

const ORDER: FluidType[] = ['ns', 'lr', 'd5w'];

export default function IvPanel({ patient, touch, onStart, onStop, onNewBag, onClose }: Props) {
  const { t } = useI18n();
  const current = patient.getInterventions().iv;
  const [fluid, setFluid] = useState<FluidType | null>(current?.fluid ?? null);
  const [rate, setRate] = useState<number | null>(current?.rateMlHr ?? null);
  const [, refresh] = useState(0);

  // keep the bag level live while the panel is open
  useEffect(() => {
    const id = window.setInterval(() => refresh((n) => n + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  const bag = Math.round(patient.getBagMl());
  const running = patient.isIvRunning();
  const subtitle = running && current ? t('iv.now', { fluid: t(FLUIDS[current.fluid].labelKey), rate: current.rateMlHr }) : t('iv.none');

  return (
    <Sheet title={t('iv.title')} subtitle={subtitle} touch={touch} onClose={onClose}>
      <p className="sheet__label">{t('iv.bag', { ml: bag })}</p>
      <div className="bagbar" aria-hidden="true">
        <div style={{ width: `${(bag / BAG_ML) * 100}%` }} />
      </div>

      <p className="sheet__label">{t('iv.fluid')}</p>
      <div className="choices" role="radiogroup" aria-label={t('iv.fluid')}>
        {ORDER.map((f) => (
          <button key={f} type="button" role="radio" aria-checked={fluid === f} className={`choice${fluid === f ? ' choice--on' : ''}`} onClick={() => setFluid(f)}>
            <strong>{t(FLUIDS[f].labelKey)}</strong>
            <span>{t(FLUIDS[f].summaryKey)}</span>
          </button>
        ))}
      </div>

      <p className="sheet__label">{t('iv.rate')}</p>
      <div className="chips" role="radiogroup" aria-label={t('iv.rate')}>
        {FLUID_RATES.map((r) => (
          <button key={r} type="button" role="radio" aria-checked={rate === r} className={`chip${rate === r ? ' chip--on' : ''}`} onClick={() => setRate(r)}>
            {r}
          </button>
        ))}
      </div>

      <div className="sheet__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!fluid || rate === null}
          onClick={() => fluid && rate !== null && onStart({ fluid, rateMlHr: rate })}
        >
          {t(current ? 'iv.update' : 'iv.start')}
        </button>
        {current && (
          <button type="button" className="btn" onClick={onStop}>
            {t('iv.stop')}
          </button>
        )}
        {bag < BAG_ML && (
          <button type="button" className="btn" onClick={onNewBag}>
            {t('iv.newBag')}
          </button>
        )}
      </div>
    </Sheet>
  );
}
