import { hasKey, t } from '../../i18n';
import type { ScenarioId } from '../../domain/scenarios';
import { detectIntents, type Intent } from './intents';
import type { PatientContext, PatientConversationService, PatientReply } from './types';

/** Intents whose answer depends on how sick the patient is right now: the case's own "ask" finding is used. */
const SEVERITY_ANSWERS: Record<ScenarioId, readonly Intent[]> = {
  respiratory: ['complaint', 'breathing'],
  shock: ['complaint', 'dizzy'],
  hypoglycemia: ['complaint'],
};

const MAX_ANSWERS = 2;

/** Answer for one intent. Case-specific text first, then a generic fallback ("hx.default.*"). */
export function answerFor(intent: Intent, ctx: PatientContext): string {
  const { scenario, vitals, glucose } = ctx;
  if (SEVERITY_ANSWERS[scenario.id].includes(intent)) return scenario.findings.ask(vitals, { glucose });
  const specific = `hx.${scenario.id}.${intent}`;
  return t(hasKey(specific) ? specific : `hx.default.${intent}`);
}

/**
 * Offline patient. Works with no server and no cost: the question is matched to what the student is asking about,
 * and the patient answers from the case's history, in the current language and state-aware where it matters.
 */
export class LocalPatientConversation implements PatientConversationService {
  async ask(ctx: PatientContext, question: string): Promise<PatientReply> {
    const intents = detectIntents(question);
    if (intents.length === 0) return { text: t('hx.unknown'), intents, source: 'local' };
    const text = intents
      .slice(0, MAX_ANSWERS)
      .map((i) => answerFor(i, ctx))
      .join(' ');
    return { text, intents, source: 'local' };
  }
}
