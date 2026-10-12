import { allItems } from '../domain/procedures/catalog';
import type { ProcedureSession } from '../domain/procedures/ProcedureSession';
import { useI18n } from '../i18n';
import Sheet from './Sheet';

interface Common {
  session: ProcedureSession;
  touch: boolean;
  onClose: () => void;
}

/** The steps (practice: in order with the next one marked; exam: shuffled, with some that do not belong). */
export function StepsPanel({ session, touch, onClose, busy, onDo, onFinish }: Common & { busy: boolean; onDo: (key: string) => void; onFinish: () => void }) {
  const { t, lang } = useI18n();
  const exam = session.mode === 'exam';
  const next = session.nextIndex();
  const main = (en: string, ar: string) => (lang === 'ar' ? ar : en);
  const other = (en: string, ar: string) => (lang === 'ar' ? en : ar);

  return (
    <Sheet title={t('proc.steps.title')} subtitle={t(exam ? 'proc.steps.sub.exam' : 'proc.steps.sub.practice')} touch={touch} onClose={onClose}>
      <ul className="steps">
        {session.actions.map((a) => {
          const done = a.stepIndex !== null && session.isDone(a.stepIndex);
          const isNext = !exam && session.def.ordered && a.stepIndex === next;
          const step = a.stepIndex === null ? null : session.def.steps[a.stepIndex];
          return (
            <li key={a.key}>
              <button type="button" className={`step${isNext ? ' step--next' : ''}${done ? ' step--done' : ''}`} disabled={done || busy} onClick={() => onDo(a.key)}>
                <span className="step__n">{done ? '✓' : exam ? '•' : step?.n}</span>
                <span className="step__txt">
                  <b>{main(a.en, a.ar)}</b>
                  <small>{other(a.en, a.ar)}</small>
                  {isNext && step && lang === 'ar' && <em>{step.doing}</em>}
                </span>
                {isNext && <span className="step__go">{t('proc.do')}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="steps__foot">
        <button type="button" className="btn" onClick={onFinish}>
          {t('proc.finish')}
        </button>
      </div>
    </Sheet>
  );
}

/** The equipment tray (practice: the full checklist; exam: only what has been picked). */
export function TrayPanel({ session, touch, onClose }: Common) {
  const { t, lang } = useI18n();
  const exam = session.mode === 'exam';
  const name = (i: { en: string; ar: string }) => (lang === 'ar' ? i.ar : i.en);
  const picked = session.trayItems();
  const total = allItems(session.def).length;

  return (
    <Sheet title={t('proc.tray.title')} subtitle={t(exam ? 'proc.tray.sub.exam' : 'proc.tray.sub.practice')} touch={touch} onClose={onClose}>
      <div className="tray">
        {exam ? (
          <>
            <p className="tray__count">{t('proc.tray.picked', { n: picked.length })}</p>
            {picked.length === 0 && <p className="sheet__muted">{t('proc.tray.empty')}</p>}
            <ul className="tray__list">
              {picked.map((i) => (
                <li key={i.id}>✓ {name(i)}</li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="tray__count">{t('proc.tray.count', { n: session.required.length - session.missing().length, total })}</p>
            {session.def.groups.map((g, gi) => (
              <section key={gi}>
                <h4>{name(g)}</h4>
                <ul className="tray__list">
                  {g.items.map((i) => (
                    <li key={i.id} className={session.has(i.id) ? 'is-in' : ''}>
                      {session.has(i.id) ? '✓' : '○'} {name(i)}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </Sheet>
  );
}
