import type { InteractableInfo } from '../game/Simulator';
import { useI18n } from '../i18n';

interface Props {
  target: InteractableInfo | null;
  panelOpen: boolean;
  /** hide the prompt while something is happening (a step is being performed) */
  quiet?: boolean;
}

/** The dot in the middle of the view and the "press E" prompt under it. The rest of the information lives in the dashboard. */
export default function Hud({ target, panelOpen, quiet = false }: Props) {
  const { t, lang, dir } = useI18n();
  // bilingual labels are "English · العربية": show the one for the current language
  const raw = target ? (target.label ?? t(target.labelKey)) : '';
  const parts = raw.split(' · ');
  const label = parts.length === 2 ? parts[lang === 'ar' ? 1 : 0] : raw;
  return (
    <>
      {!panelOpen && <div className={`crosshair${target && !target.far ? ' crosshair--active' : ''}`} aria-hidden="true" />}
      {target && !panelOpen && !quiet && (
        <div className={`hud__prompt${target.far ? ' hud__prompt--far' : ''}`} dir={dir} role="status">
          {target.far ? (
            <>↗ {t('hud.closer')} · {label}</>
          ) : (
            <>
              <kbd>E</kbd> {label}
            </>
          )}
        </div>
      )}
    </>
  );
}
