import { useI18n } from '../i18n';
import { reloadForUpdate, usePwa } from '../pwa';

/** Appears when a new version of the app has been downloaded in the background. */
export default function UpdateBanner() {
  const { t, dir } = useI18n();
  const pwa = usePwa();
  if (!pwa.updateReady) return null;
  return (
    <div className="update" dir={dir} role="status">
      <span>{t('pwa.update')}</span>
      <button type="button" onClick={reloadForUpdate}>
        {t('pwa.reload')}
      </button>
    </div>
  );
}
