import { useI18n } from '../i18n';
import LangSwitch from './LangSwitch';

interface Props {
  introKey: string;
  started: boolean;
  error: string | null;
  touch: boolean;
  onStart: () => void;
  onFinish: () => void;
  onBack: () => void;
}

export default function StartOverlay({ introKey, started, error, touch, onStart, onFinish, onBack }: Props) {
  const { t, dir } = useI18n();
  return (
    <div className="overlay" dir={dir}>
      <div className="overlay__card">
        <div className="menu__top">
          <h1>{t('app.title')}</h1>
          <LangSwitch />
        </div>
        {error ? (
          <p className="overlay__error">{error}</p>
        ) : (
          <>
            <p>{t(started ? 'start.paused' : introKey)}</p>
            {touch ? (
              <>
                <p className="rotate-hint">{t('start.rotate')}</p>
                <dl className="controls">
                  <div>
                    <dt>{t('ctl.leftStick')}</dt>
                    <dd>{t('ctl.move')}</dd>
                  </div>
                  <div>
                    <dt>{t('ctl.dragRight')}</dt>
                    <dd>{t('ctl.look')}</dd>
                  </div>
                  <div>
                    <dt><kbd>E</kbd> {t('ctl.eButton')}</dt>
                    <dd>{t('ctl.interact')}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <dl className="controls">
                <div>
                  <dt dir="ltr"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></dt>
                  <dd>{t('ctl.move')}</dd>
                </div>
                <div>
                  <dt>{t('ctl.mouse')}</dt>
                  <dd>{t('ctl.look')}</dd>
                </div>
                <div>
                  <dt><kbd>E</kbd></dt>
                  <dd>{t('ctl.interact')}</dd>
                </div>
                <div>
                  <dt><kbd>Shift</kbd></dt>
                  <dd>{t('ctl.faster')}</dd>
                </div>
                <div>
                  <dt><kbd>M</kbd></dt>
                  <dd>{t('ctl.sound')}</dd>
                </div>
                <div>
                  <dt><kbd>Esc</kbd></dt>
                  <dd>{t('ctl.pause')}</dd>
                </div>
              </dl>
            )}
            <button type="button" className="overlay__start" onClick={onStart}>
              {t(started ? 'start.resume' : 'start.start')}
            </button>
            {started && (
              <button type="button" className="overlay__secondary" onClick={onFinish}>
                {t('start.finish')}
              </button>
            )}
            <button type="button" className="overlay__secondary" onClick={onBack}>
              {t('start.back')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
