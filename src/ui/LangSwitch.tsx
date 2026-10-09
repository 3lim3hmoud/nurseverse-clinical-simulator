import { getLang, setLang, t, useLang } from '../i18n';

export default function LangSwitch() {
  useLang();
  return (
    <button type="button" className="lang-switch" onClick={() => setLang(getLang() === 'en' ? 'ar' : 'en')}>
      {t('lang.other')}
    </button>
  );
}
