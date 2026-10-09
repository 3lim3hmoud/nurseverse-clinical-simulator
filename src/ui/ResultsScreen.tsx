import { useMemo } from 'react';
import type { SimEvent } from '../core/EventLog';
import type { Scenario } from '../domain/scenarios';
import { buildTimeline } from '../domain/scoring';
import { useI18n } from '../i18n';
import LangSwitch from './LangSwitch';

interface Props {
  scenario: Scenario;
  events: readonly SimEvent[];
  onRestart: () => void;
  onMenu: () => void;
}

export default function ResultsScreen({ scenario, events, onRestart, onMenu }: Props) {
  const { t, dir, lang } = useI18n();
  // recomputed when the language changes so feedback and timeline switch language too
  const { report, timeline } = useMemo(
    () => ({ report: scenario.scorer.score(events, scenario), timeline: buildTimeline(events) }),
    [scenario, events, lang],
  );

  return (
    <div className="overlay overlay--scroll" dir={dir}>
      <div className="overlay__card results">
        <div className="menu__top">
          <h1>{t('res.title')}</h1>
          <LangSwitch />
        </div>
        <p className="results__outcome">{report.outcome}</p>

        <div className="results__score">
          <strong>{report.total}</strong>
          <span>{t('res.outOf')}</span>
          <em>{report.grade}</em>
        </div>

        <ul className="results__items">
          {report.items.map((i) => (
            <li key={i.label} className={i.points === i.maxPoints ? 'full' : i.points === 0 ? 'zero' : 'part'}>
              <div>
                <strong>{i.label}</strong>
                <span>
                  {i.points} / {i.maxPoints}
                </span>
              </div>
              <p>{i.feedback}</p>
            </li>
          ))}
        </ul>

        <h2>{t('res.did')}</h2>
        <ol className="timeline">
          {timeline.map((row, idx) => (
            <li key={idx}>
              <time>{row.time}</time>
              <span>{row.text}</span>
            </li>
          ))}
        </ol>

        <button type="button" className="overlay__start" onClick={onRestart}>
          {t('res.again')}
        </button>
        <button type="button" className="overlay__secondary" onClick={onMenu}>
          {t('start.back')}
        </button>
      </div>
    </div>
  );
}
