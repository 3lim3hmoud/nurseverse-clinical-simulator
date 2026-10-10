import { useEffect, useMemo, useState } from 'react';
import type { SimEvent } from '../core/EventLog';
import type { Scenario } from '../domain/scenarios';
import { buildTimeline } from '../domain/scoring';
import { useI18n } from '../i18n';
import { debriefing, type Debrief } from '../services/ai';
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

  const [debrief, setDebrief] = useState<Debrief | null>(null);
  useEffect(() => {
    let alive = true;
    setDebrief(null);
    void debriefing.debrief({ scenario, events, report, lang }).then((d) => alive && setDebrief(d));
    return () => {
      alive = false;
    };
  }, [scenario, events, report, lang]);

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

        <h2>{t(debrief?.source === 'remote' ? 'deb.titleAi' : 'deb.title')}</h2>
        {!debrief && <p className="sheet__muted">{t('deb.loading')}</p>}
        {debrief && (
          <div className="debrief">
            {debrief.strengths.length > 0 && (
              <>
                <h3>{t('deb.strengths')}</h3>
                <ul className="debrief__good">
                  {debrief.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </>
            )}
            {debrief.improvements.length > 0 && (
              <>
                <h3>{t('deb.improve')}</h3>
                <ul className="debrief__work">
                  {debrief.improvements.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="debrief__next">
              <strong>{t('deb.next')}</strong> {debrief.nextStep}
            </p>
          </div>
        )}

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
