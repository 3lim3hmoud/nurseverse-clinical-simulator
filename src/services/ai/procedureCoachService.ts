import { blockMessage, coachAnswer, type CoachState } from '../../domain/procedures/coach';
import type { Check } from '../../domain/procedures/ProcedureSession';
import { getLang } from '../../i18n';
import { aiEndpoint } from './index';

/**
 * Practice-mode coach. The offline coach always works. With the AI backend the answer is reworded as a friendly
 * conversation, but only from the course-sheet facts the app sends: the model adds no clinical content.
 */
export async function askCoach(state: CoachState, question: string, history: readonly { from: string; text: string }[] = []): Promise<string> {
  const local = coachAnswer(state, question);
  const endpoint = aiEndpoint();
  if (!endpoint) return local;
  try {
    const { session } = state;
    const next = session.nextStep();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: 'coach',
        lang: getLang(),
        question,
        history: history.slice(-6),
        facts: {
          procedure: state.lang === 'ar' ? session.def.titleAr : session.def.titleEn,
          ordered: session.def.ordered,
          next: next ? { n: next.n, en: next.en, ar: next.ar, doing: next.doing, whyEn: next.whyEn, whyAr: next.whyAr } : null,
          done: session.doneCount,
          total: session.def.steps.length,
          missing: session.missing().map((i) => i.en),
          draft: local,
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { text?: unknown };
    return typeof data.text === 'string' && data.text.trim() ? data.text.trim() : local;
  } catch {
    return local;
  }
}

export const explainBlock = (state: CoachState, check: Extract<Check, { ok: false }>) => blockMessage(state, check);
