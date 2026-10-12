import { useState } from 'react';
import { allItems, PROCEDURES } from '../domain/procedures/catalog';
import type { Mode, ProcedureId } from '../domain/procedures/types';
import { SCENARIOS, type ScenarioId } from '../domain/scenarios';
import { useI18n } from '../i18n';
import LangSwitch from './LangSwitch';

interface Props {
  onPick: (id: ScenarioId) => void;
  onPickProcedure: (id: ProcedureId, mode: Mode) => void;
}

export default function Menu({ onPick, onPickProcedure }: Props) {
  const { t, lang, dir } = useI18n();
  const [mode, setMode] = useState<Mode>('practice');
  return (
    <div className="overlay overlay--scroll" dir={dir}>
      <div className="overlay__card menu">
        <div className="menu__top">
          <h1>{t('app.title')}</h1>
          <LangSwitch />
        </div>

        <h2>{t('menu.proc.title')}</h2>
        <p>{t('menu.proc.sub')}</p>
        <div className="modes" role="tablist">
          {(['practice', 'exam'] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} className={`mode${mode === m ? ' mode--on' : ''}`} onClick={() => setMode(m)}>
              {t(`menu.mode.${m}`)}
            </button>
          ))}
        </div>
        <p className="menu__hint">{t(`menu.mode.${mode}.hint`)}</p>
        <div className="cases cases--grid">
          {PROCEDURES.map((p) => (
            <button key={p.id} type="button" className="case" onClick={() => onPickProcedure(p.id, mode)}>
              <strong>{lang === 'ar' ? p.titleAr : p.titleEn}</strong>
              <span>{t('proc.meta', { steps: p.steps.length, items: allItems(p).length })}{!p.ordered ? ` · ${t('proc.anyOrder')}` : ''}</span>
            </button>
          ))}
        </div>

        <h2 className="menu__sep">{t('menu.cases.title')}</h2>
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
