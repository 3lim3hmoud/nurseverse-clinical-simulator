import { detectIntents } from './intents';
import type { ChatTurn, Debrief, DebriefInput, DebriefingService, PatientContext, PatientConversationService, PatientReply } from './types';

/**
 * Optional LLM backends. They talk to YOUR OWN endpoint (set VITE_AI_ENDPOINT at build time), never to a model
 * provider directly: an API key must never ship inside a browser app. If the endpoint fails or is slow, the
 * offline service answers instead, so the simulator always works.
 *
 * POST {endpoint}  Content-Type: application/json
 *   patient:  { kind: "patient", lang, scenarioId, patient: { ageYears, sex }, vitals, glucose?, question, history }
 *             -> { "text": "<the patient's answer, in the requested language>" }
 *   debrief:  { kind: "debrief", lang, scenarioId, score, items: [{ label, points, maxPoints, feedback }], events }
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
          vitals: ctx.vitals,
          glucose: ctx.glucose,
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
