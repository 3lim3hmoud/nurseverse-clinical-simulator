import { medById } from '../../domain/medications';
import { t } from '../../i18n';
import { detectIntents } from './intents';
import { buildFacts } from './LocalPatientConversation';
import type { ChatTurn, Debrief, DebriefInput, DebriefingService, DoctorChatContext, DoctorChatReply, DoctorChatService, DoctorContext, DoctorService, PatientContext, PatientConversationService, PatientReply } from './types';

/**
 * Optional LLM backends. They talk to YOUR OWN endpoint (set VITE_AI_ENDPOINT at build time), never to a model
 * provider directly: an API key must never ship inside a browser app. If the endpoint fails or is slow, the
 * offline service answers instead, so the simulator always works.
 *
 * The reference backend is api/ai.ts (Vercel). POST {endpoint}  Content-Type: application/json
 *   patient:  { kind: "patient", lang, scenarioId, patient: { ageYears, sex }, facts, state, question, history }
 *             -> { "text": "<the patient's answer, in the requested language>" }
 *   doctor:   { kind: "doctor", lang, scenarioId, stabilised, report: { situation, background, assessment, recommendation } }
 *             -> { "text": "<the doctor's reply>" }
 *   doctor-chat: { kind: "doctor-chat", lang, scenarioId, question, history, decision: { kind, medication?, approved?, draft } }
 *             -> { "text": "<the doctor's message>" }   (the app decides orders; the model only words them)
 *   debrief:  { kind: "debrief", lang, scenarioId, score, items, events, progress }
 *             -> { "strengths": string[], "improvements": string[], "nextStep": string }
 */
async function post(endpoint: string, body: unknown, timeoutMs: number): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
    if (!res.ok) throw new Error(`AI endpoint returned ${res.status}`);
    return await res.json();
  } finally {
    window.clearTimeout(timer);
  }
}

const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

export class RemotePatientConversation implements PatientConversationService {
  constructor(private endpoint: string, private fallback: PatientConversationService, private timeoutMs = 8000) {}

  async ask(ctx: PatientContext, question: string, history: readonly ChatTurn[] = []): Promise<PatientReply> {
    try {
      const data = (await post(
        this.endpoint,
        {
          kind: 'patient',
          lang: ctx.lang,
          scenarioId: ctx.scenario.id,
          patient: { ageYears: ctx.scenario.patient.ageYears, sex: ctx.scenario.patient.sex },
          ...buildFacts(ctx),
          question,
          history: history.slice(-8),
        },
        this.timeoutMs,
      )) as { text?: unknown };
      if (typeof data.text !== 'string' || !data.text.trim()) throw new Error('empty answer');
      return { text: data.text.trim(), intents: detectIntents(question), source: 'remote' };
    } catch {
      return this.fallback.ask(ctx, question, history);
    }
  }
}

export class RemoteDebriefing implements DebriefingService {
  constructor(private endpoint: string, private fallback: DebriefingService, private timeoutMs = 12000) {}

  async debrief(input: DebriefInput): Promise<Debrief> {
    try {
      const data = (await post(
        this.endpoint,
        {
          kind: 'debrief',
          lang: input.lang,
          scenarioId: input.scenario.id,
          score: input.report.total,
          items: input.report.items,
          events: input.events,
          progress: input.progress,
        },
        this.timeoutMs,
      )) as Partial<Debrief>;
      if (!isStrings(data.strengths) || !isStrings(data.improvements) || typeof data.nextStep !== 'string') throw new Error('bad shape');
      return { strengths: data.strengths, improvements: data.improvements, nextStep: data.nextStep, source: 'remote' };
    } catch {
      return this.fallback.debrief(input);
    }
  }
}

export class RemoteDoctor implements DoctorService {
  constructor(private endpoint: string, private timeoutMs = 10000) {}

  async reply(ctx: DoctorContext): Promise<string | null> {
    try {
      const data = (await post(
        this.endpoint,
        {
          kind: 'doctor',
          lang: ctx.lang,
          scenarioId: ctx.scenario.id,
          stabilised: ctx.stabilised,
          report: { situation: ctx.draft.situation, background: ctx.draft.background, assessment: ctx.draft.assessment, recommendation: ctx.option.label },
        },
        this.timeoutMs,
      )) as { text?: unknown };
      return typeof data.text === 'string' && data.text.trim() ? data.text.trim() : null;
    } catch {
      return null;
    }
  }
}

/**
 * Doctor chat with an AI voice. The offline doctor decides first (above all, whether a medication is approved) and the
 * remote model only rewords that decision, so an order can never be invented or flipped by the model. Falls back to the offline text.
 */
export class RemoteDoctorChat implements DoctorChatService {
  constructor(private endpoint: string, private fallback: DoctorChatService, private timeoutMs = 8000) {}

  async ask(ctx: DoctorChatContext, question: string, history: readonly ChatTurn[] = []): Promise<DoctorChatReply> {
    const local = await this.fallback.ask(ctx, question, history);
    try {
      const data = (await post(
        this.endpoint,
        {
          kind: 'doctor-chat',
          lang: ctx.lang,
          scenarioId: ctx.scenario.id,
          question,
          history: history.slice(-8),
          decision: {
            kind: local.order ? 'order' : 'advice',
            medication: local.order ? t(medById(local.order.medId).nameKey) : undefined,
            approved: local.order?.approved,
            draft: local.text,
          },
        },
        this.timeoutMs,
      )) as { text?: unknown };
      if (typeof data.text !== 'string' || !data.text.trim()) throw new Error('empty answer');
      return { ...local, text: data.text.trim(), source: 'remote' };
    } catch {
      return local;
    }
  }
}
