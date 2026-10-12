import { useMemo } from 'react';
import type { ProcedureSession, SessionResult } from '../domain/procedures/ProcedureSession';
import { useI18n } from '../i18n';
import LangSwitch from './LangSwitch';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

interface Props {
  session: ProcedureSession;
  result: SessionResult;
  onRestart: () => void;
  onMenu: () => void;
}

/** Score, mistakes and the correct order with the reason for every step (the point of the exam). */
export default function ProcedureResults({ session, result, onRestart, onMenu }: Props) {
  const { t, lang, dir } = useI18n();
  const def = session.def;
  const title = lang === 'ar' ? def.titleAr : def.titleEn;
  const missing = useMemo(() => session.missing(), [session]);
  const pct = (x: number) => `${Math.round(x * 100)}%`;

  return (
    <div className="overlay overlay--scroll" dir={dir}>
      <div className="overlay__card menu">
        <div className="menu__top">
          <h1>{t(`procres.title.${session.mode}`)}</h1>
          <LangSwitch />
        </div>
        <h2>{title}</h2>
        <p className={`procres__score${result.passed ? ' procres__score--ok' : ''}`}>
          <strong>{result.percent}%</strong> · {t(result.passed ? 'procres.passed' : 'procres.failed')}
        </p>
        {result.timedOut && <p>{t('procres.timedout')}</p>}
        <ul className="procres__metrics">
          <li><span>{t('procres.steps')}</span><b>{result.stepsDone} / {result.stepsTotal}</b></li>
          {def.ordered && <li><span>{t('procres.order')}</span><b>{pct(result.orderAccuracy)}</b></li>}
          <li><span>{t('procres.equipment')}</span><b>{result.requiredCollected} / {result.requiredTotal}</b></li>
          <li><span>{t('procres.time')}</span><b>{mmss(result.seconds)}</b></li>
          {result.extras > 0 && <li><span>{t('procres.extras')}</span><b>{result.extras}</b></li>}
        </ul>

        {session.errors.length > 0 && (
          <>
            <h3>{t('procres.mistakes')}</h3>
            <ul className="procres__list">
              {session.errors.slice(0, 12).map((e, i) => (
                <li key={i}>{t(`procres.mistake.${e.type}`, { what: e.detail })}</li>
              ))}
            </ul>
          </>
        )}
        {missing.length > 0 && (
          <>
            <h3>{t('procres.missing')}</h3>
            <p>{missing.map((m) => (lang === 'ar' ? m.ar : m.en)).join(lang === 'ar' ? '، ' : ', ')}</p>
          </>
        )}

        <h3>{t('procres.review')}</h3>
        <ol className="procres__review">
          {def.steps.map((s) => (
            <li key={s.index} className={session.isDone(s.index) ? 'is-done' : 'is-missed'}>
              <b>{lang === 'ar' ? s.ar : s.en}</b>
              <em>{t(session.isDone(s.index) ? 'procres.review.done' : 'procres.review.missed')}</em>
              <p>{lang === 'ar' ? s.whyAr : s.whyEn}</p>
            </li>
          ))}
        </ol>

        <div className="menu__actions">
          <button type="button" className="btn btn--primary" onClick={onRestart}>{t('procres.again')}</button>
          <button type="button" className="btn" onClick={onMenu}>{t('procres.menu')}</button>
        </div>
      </div>
    </div>
  );
}
