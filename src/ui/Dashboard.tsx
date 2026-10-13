import type { ReactNode } from 'react';
import { useI18n } from '../i18n';

export interface DashTab {
  id: string;
  label: string;
  icon: string;
  /** small number or text next to the label (3/13, 17/17...) */
  badge?: string;
}

interface Props {
  title: string;
  /** small pill next to the title (Practice / Exam) */
  tag?: { text: string; tone?: 'practice' | 'exam' };
  /** 0..1, shown as a thin bar under the title */
  progress?: { value: number; text: string };
  /** right side of the progress row (exam countdown) */
  timer?: { text: string; low: boolean };
  /** "what to do now" card, always visible */
  objective?: ReactNode;
  tabs?: DashTab[];
  active?: string;
  onTab?: (id: string) => void;
  /** true while the mouse is free to click inside the dashboard (desktop) */
  focused: boolean;
  /** key hints under the content (desktop only) */
  hint?: string;
  onCollapse: () => void;
  children: ReactNode;
}

/**
 * The side dashboard: everything the nurse needs next to the 3D room (progress, what to do now, steps, equipment tray,
 * map, chat) in one place, instead of cards floating over the picture. On a phone held sideways it is a narrow column
 * on the right; held upright it is the lower half of the screen.
 */
export default function Dashboard({ title, tag, progress, timer, objective, tabs, active, onTab, focused, hint, onCollapse, children }: Props) {
  const { t, dir } = useI18n();
  return (
    <aside className={`dash${focused ? ' dash--focus' : ''}`} dir={dir} aria-label={title}>
      <header className="dash__head">
        <div className="dash__title">
          <strong>{title}</strong>
          {tag && <span className={`badge badge--${tag.tone ?? 'practice'}`}>{tag.text}</span>}
        </div>
        <button type="button" className="dash__collapse" onClick={onCollapse} aria-label={t('dash.hide')} title={t('dash.hide')}>
          ›
        </button>
      </header>

      {(progress || timer) && (
        <div className="dash__progress">
          {progress && (
            <>
              <div className="dash__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.value * 100)}>
                <i style={{ width: `${Math.round(progress.value * 100)}%` }} />
              </div>
              <span>{progress.text}</span>
            </>
          )}
          {timer && <span className={`timer${timer.low ? ' timer--low' : ''}`}>⏱ {timer.text}</span>}
        </div>
      )}

      {objective}

      {tabs && tabs.length > 0 && (
        <nav className="dash__tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active === tab.id}
              className={`dash__tab${active === tab.id ? ' dash__tab--on' : ''}`}
              onClick={() => onTab?.(tab.id)}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span className="dash__tabtxt">{tab.label}</span>
              {tab.badge && <small>{tab.badge}</small>}
            </button>
          ))}
        </nav>
      )}

      <div className="dash__body">{children}</div>

      {hint && <footer className="dash__foot">{hint}</footer>}
    </aside>
  );
}
