import { SCENARIOS, type ScenarioId } from '../domain/scenarios';
import { useI18n } from '../i18n';
import LangSwitch from './LangSwitch';

export default function Menu({ onPick }: { onPick: (id: ScenarioId) => void }) {
  const { t, dir } = useI18n();
  return (
    <div className="overlay overlay--scroll" dir={dir}>
      <div className="overlay__card menu">
        <div className="menu__top">
          <h1>{t('app.title')}</h1>
          <LangSwitch />
        </div>
        <h2>{t('menu.title')}</h2>
        <p>{t('menu.subtitle')}</p>
        <div className="cases">
          {Object.values(SCENARIOS).map((sc) => (
            <button key={sc.id} type="button" className="case" onClick={() => onPick(sc.id)}>
              <strong>{t(sc.titleKey)}</strong>
              <span>{t(sc.blurbKey)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
