import { useI18n } from '../i18n';
import { promptInstall, usePwa } from '../pwa';

/** "Install the app" (or how to do it on an iPhone). Shows nothing once it is installed or when the browser cannot. */
export default function InstallButton({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const pwa = usePwa();
  if (pwa.installed) return compact ? null : <p className="pwa__note">✓ {t('pwa.installed')} · {t('pwa.offline')}</p>;
  if (pwa.canInstall)
    return (
      <button type="button" className="pwa__btn" onClick={() => void promptInstall()}>
        ⬇ {t('pwa.install')}
      </button>
    );
  if (pwa.showIosHint && !compact) return <p className="pwa__note">📲 {t('pwa.iosHint')}</p>;
  return null;
}
