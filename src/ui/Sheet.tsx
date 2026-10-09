import type { ReactNode } from 'react';
import { useI18n } from '../i18n';

interface Props {
  title: string;
  subtitle?: string;
  badge?: string;
  touch: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Shared frame for the panels (monitor, oxygen, IV, patient). */
export default function Sheet({ title, subtitle, badge, touch, onClose, children }: Props) {
  const { t, dir } = useI18n();
  return (
    <aside className="sheet" role="dialog" aria-label={title} dir={dir}>
      <header className="sheet__head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {badge && <span className="sheet__badge">{badge}</span>}
      </header>
      <div className="sheet__body">{children}</div>
      <footer className="sheet__foot">
        <span>{touch ? '' : t('panel.hint')}</span>
        <button type="button" onClick={onClose}>
          {t('panel.close')}
        </button>
      </footer>
    </aside>
  );
}
