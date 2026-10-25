import { useI18n } from '../i18n';
import { canFullscreen, useFullscreen } from '../pwa';
import { resetSettings, updateSettings, useSettings, type Settings } from '../settings';
import { closeSettings, startEditing } from '../uiState';
import InstallButton from './InstallButton';

function Slider({ label, value, min, max, step = 0.05, lo, hi, onChange }: { label: string; value: number; min: number; max: number; step?: number; lo: string; hi: string; onChange: (v: number) => void }) {
  return (
    <label className="set__row">
      <span className="set__label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="set__ends">
        <small>{lo}</small>
        <small>{hi}</small>
      </span>
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="set__row set__row--toggle">
      <span className="set__label">{label}</span>
      <input type="checkbox" role="switch" checked={value} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Segments<T extends string>({ label, value, options, hint, onChange }: { label: string; value: T; options: { id: T; text: string }[]; hint?: string; onChange: (v: T) => void }) {
  return (
    <div className="set__row">
      <span className="set__label">{label}</span>
      <div className="set__seg" role="radiogroup">
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>
            {o.text}
          </button>
        ))}
      </div>
      {hint && <small className="set__hint">{hint}</small>}
    </div>
  );
}

/** Everything the player can change: how big and where the buttons are, how fast the view turns, graphics. */
export default function SettingsSheet() {
  const { t, dir } = useI18n();
  const s = useSettings();
  const fs = useFullscreen();
  const set = (patch: Partial<Settings>) => updateSettings(patch);
  const inGame = document.querySelector('.stage') !== null;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  return (
    <div className="setsheet" dir={dir} role="dialog" aria-modal="true" aria-label={t('set.title')}>
      <div className="setsheet__card">
        <header className="setsheet__head">
          <h2>⚙ {t('set.title')}</h2>
          <button type="button" className="setsheet__done" onClick={closeSettings}>
            {t('set.close')}
          </button>
        </header>
        <div className="setsheet__body">
          <InstallButton />

          <h3>{t('set.controls')}</h3>
          <Slider label={t('set.joySize')} value={s.joySize} min={0.7} max={1.6} lo={t('set.small')} hi={t('set.big')} onChange={(v) => set({ joySize: v })} />
          <Slider label={t('set.actSize')} value={s.actSize} min={0.7} max={1.8} lo={t('set.small')} hi={t('set.big')} onChange={(v) => set({ actSize: v })} />
          <Slider label={t('set.opacity')} value={s.opacity} min={0.35} max={1} lo={t('set.faint')} hi={t('set.clear')} onChange={(v) => set({ opacity: v })} />
          <Slider label={t('set.lookSens')} value={s.lookSens} min={0.4} max={2.5} lo={t('set.slow')} hi={t('set.fast')} onChange={(v) => set({ lookSens: v })} />
          <Toggle label={t('set.leftHanded')} value={s.leftHanded} onChange={(v) => set({ leftHanded: v })} />
          <Toggle label={t('set.invertY')} value={s.invertY} onChange={(v) => set({ invertY: v })} />
          <Toggle label={t('set.vibrate')} value={s.vibrate} onChange={(v) => set({ vibrate: v })} />
          <Toggle label={t('set.labels')} value={s.labels} onChange={(v) => set({ labels: v })} />
          {touch && inGame && (
            <button type="button" className="set__action" onClick={startEditing}>
              ✥ {t('set.edit')}
            </button>
          )}

          <h3>{t('set.display')}</h3>
          <Segments
            label={t('set.quality')}
            value={s.quality}
            hint={t('set.quality.hint')}
            options={[
              { id: 'auto', text: t('set.quality.auto') },
              { id: 'low', text: t('set.quality.low') },
              { id: 'high', text: t('set.quality.high') },
            ]}
            onChange={(v) => set({ quality: v })}
          />
          <Segments
            label={t('set.panel')}
            value={s.panel}
            options={[
              { id: 'auto', text: t('set.panel.auto') },
              { id: 'open', text: t('set.panel.open') },
              { id: 'closed', text: t('set.panel.closed') },
            ]}
            onChange={(v) => set({ panel: v })}
          />
          {canFullscreen() && (
            <button type="button" className="set__action" onClick={fs.toggle}>
              ⛶ {t(fs.on ? 'set.exitFullscreen' : 'set.fullscreen')}
            </button>
          )}
          <button type="button" className="set__action set__action--quiet" onClick={resetSettings}>
            ↺ {t('set.reset')}
          </button>
        </div>
      </div>
    </div>
  );
}
