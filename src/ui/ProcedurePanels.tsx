import type { ProcedureSession } from '../domain/procedures/ProcedureSession';
import { shortTitle } from '../domain/procedures/format';
import { useI18n } from '../i18n';

/**
 * The steps, as a compact list. Practice: the step to do now is a card with its full text, a one-line "why" and a
 * button; the rest are short rows. Exam: every row is a button (some of them do not belong to this procedure).
 */
export function StepsTab({ session, busy, onDo, onFinish }: { session: ProcedureSession; busy: boolean; onDo: (key: string) => void; onFinish: () => void }) {
  const { t, lang } = useI18n();
  const exam = session.mode === 'exam';
  const main = (en: string, ar: string) => (lang === 'ar' ? ar : en);
  const nextIndex = exam ? null : session.nextIndex();
  const nextStep = nextIndex === null ? null : session.def.steps[nextIndex];
  const nextAction = nextStep ? session.actions.find((a) => a.stepIndex === nextStep.index) : undefined;

  return (
    <div className="steps2">
      {nextStep && nextAction && (
        <section className="nowcard" aria-live="polite">
          <small>{t('proc.now', { n: nextStep.n, total: session.def.steps.length })}</small>
          <b>{main(nextStep.en, nextStep.ar)}</b>
          {lang === 'ar' && <p>{nextStep.doing}</p>}
          <details>
            <summary>{t('proc.why')}</summary>
            <p>{main(nextStep.whyEn, nextStep.whyAr)}</p>
          </details>
          <button type="button" className="btn btn--primary" disabled={busy} onClick={() => onDo(nextAction.key)}>
            {t('proc.do')}
          </button>
        </section>
      )}
      {exam && <p className="dash__note">{t('proc.steps.sub.exam')}</p>}

      <ol className="steplist">
        {session.actions.map((a) => {
          const step = a.stepIndex === null ? null : session.def.steps[a.stepIndex];
          const done = a.stepIndex !== null && session.isDone(a.stepIndex);
          const isNext = !exam && step !== null && step.index === nextIndex;
          const mark = done ? '✓' : exam ? '•' : String(step?.n ?? '');
          const cls = `srow${isNext ? ' srow--next' : ''}${done ? ' srow--done' : ''}`;
          const label = <span className="srow__txt">{shortTitle(main(a.en, a.ar))}</span>;
          return (
            <li key={a.key}>
              {exam ? (
                <button type="button" className={cls} disabled={done || busy} onClick={() => onDo(a.key)}>
                  <span className="srow__n">{mark}</span>
                  {label}
                </button>
              ) : (
                <div className={cls}>
                  <span className="srow__n">{mark}</span>
                  {label}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="dash__actions">
        <button type="button" className="btn" onClick={onFinish}>
          {t('proc.finish')}
        </button>
      </div>
    </div>
  );
}

/** The equipment tray (practice: the full checklist by table; exam: only what has been picked). */
export function TrayTab({ session, numbers }: { session: ProcedureSession; numbers: Record<number, number> }) {
  const { t, lang } = useI18n();
  const exam = session.mode === 'exam';
  const name = (i: { en: string; ar: string }) => (lang === 'ar' ? i.ar : i.en);
  const picked = session.trayItems();
  const total = session.required.length;
  const bedside = session.fixtures();

  return (
    <div className="tray">
      {exam ? (
        <>
          <p className="tray__count">{t('proc.tray.picked', { n: picked.length })}</p>
          <p className="dash__note">{t('proc.tray.sub.exam')}</p>
          {picked.length === 0 && <p className="sheet__muted">{t('proc.tray.empty')}</p>}
          <ul className="tray__list">
            {picked.map((i) => (
              <li key={i.id}>✓ {name(i)}</li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="tray__count">{t('proc.tray.count', { n: total - session.missing().length, total })}</p>
          {session.def.groups.map((g, gi) => {
            const here = g.items.filter((i) => !bedside.some((b) => b.id === i.id));
            if (here.length === 0) return null;
            return (
              <section key={gi}>
                <h4>
                  {numbers[gi] ? `${numbers[gi]} · ` : ''}
                  {name(g)}
                </h4>
                <ul className="tray__list">
                  {here.map((i) => (
                    <li key={i.id} className={session.has(i.id) ? 'is-in' : ''}>
                      {session.has(i.id) ? '✓' : '○'} {name(i)}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {bedside.length > 0 && (
            <section>
              <h4>{t('proc.tray.bedside')}</h4>
              <ul className="tray__list">
                {bedside.map((i) => (
                  <li key={i.id} className="is-in">
                    ✓ {name(i)}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
