import type { InteractableInfo } from '../game/Simulator';
import { useI18n } from '../i18n';

interface Props {
  title: string;
  objective: string;
  target: InteractableInfo | null;
  touch: boolean;
  panelOpen: boolean;
  muted: boolean;
}

export default function Hud({ title, objective, target, touch, panelOpen, muted }: Props) {
  const { t, dir } = useI18n();
  return (
    <>
      <div className="hud__info" dir={dir}>
        <strong>{title}</strong>
        <span>{objective}</span>
        {!touch && <small>{t(muted ? 'hud.soundOff' : 'hud.soundOn')}</small>}
        {!touch && <small>{t('hud.chatHint')}</small>}
      </div>
      {!panelOpen && <div className={`crosshair${target ? ' crosshair--active' : ''}`} aria-hidden="true" />}
      {target && !panelOpen && (
        <div className="hud__prompt" dir={dir}>
          <kbd>E</kbd> {target.label ?? t(target.labelKey)}
        </div>
      )}
    </>
  );
}
