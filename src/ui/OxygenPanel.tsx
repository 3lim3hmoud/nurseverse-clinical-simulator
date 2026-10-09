import { useState } from 'react';
import { OXYGEN_DEVICES, type OxygenDevice, type OxygenSetup } from '../domain/physiology/oxygen';
import { useI18n } from '../i18n';
import Sheet from './Sheet';

interface Props {
  current: OxygenSetup | null;
  touch: boolean;
  onApply: (setup: OxygenSetup) => void;
  onRemove: () => void;
  onClose: () => void;
}

const ORDER: OxygenDevice[] = ['nasal-cannula', 'simple-mask', 'non-rebreather'];

export default function OxygenPanel({ current, touch, onApply, onRemove, onClose }: Props) {
  const { t } = useI18n();
  const [device, setDevice] = useState<OxygenDevice | null>(current?.device ?? null);
  const [flow, setFlow] = useState<number | null>(current?.flowLpm ?? null);

  const pickDevice = (d: OxygenDevice) => {
    setDevice(d);
    if (flow !== null && !OXYGEN_DEVICES[d].flows.includes(flow)) setFlow(null);
  };

  return (
    <Sheet
      title={t('o2.title')}
      subtitle={current ? t('o2.now', { device: t(OXYGEN_DEVICES[current.device].labelKey), flow: current.flowLpm }) : t('o2.none')}
      touch={touch}
      onClose={onClose}
    >
      <p className="sheet__label">{t('o2.device')}</p>
      <div className="choices" role="radiogroup" aria-label={t('o2.device')}>
        {ORDER.map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={device === d}
            className={`choice${device === d ? ' choice--on' : ''}`}
            onClick={() => pickDevice(d)}
          >
            <strong>{t(OXYGEN_DEVICES[d].labelKey)}</strong>
            <span>{t(OXYGEN_DEVICES[d].summaryKey)}</span>
          </button>
        ))}
      </div>

      <p className="sheet__label">{t('o2.flow')}</p>
      <div className="chips" role="radiogroup" aria-label={t('o2.flow')}>
        {device ? (
          OXYGEN_DEVICES[device].flows.map((f) => (
            <button key={f} type="button" role="radio" aria-checked={flow === f} className={`chip${flow === f ? ' chip--on' : ''}`} onClick={() => setFlow(f)}>
              {f}
            </button>
          ))
        ) : (
          <span className="sheet__muted">{t('o2.chooseFirst')}</span>
        )}
      </div>

      <div className="sheet__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!device || flow === null}
          onClick={() => device && flow !== null && onApply({ device, flowLpm: flow })}
        >
          {t(current ? 'o2.update' : 'o2.start')}
        </button>
        {current && (
          <button type="button" className="btn" onClick={onRemove}>
            {t('o2.remove')}
          </button>
        )}
      </div>
    </Sheet>
  );
}
