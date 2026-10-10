import type { SimEvent } from '../../core/EventLog';
import type { Lang } from '../../i18n';
import type { Vitals } from '../../domain/patient/types';
import type { Scenario } from '../../domain/scenarios';
import type { ScoreReport } from '../../domain/scoring';
import type { Intent } from './intents';

export interface PatientContext {
  scenario: Scenario;
  vitals: Vitals;
  glucose?: number;
  lang: Lang;
}

export interface ChatTurn {
  from: 'nurse' | 'patient';
  text: string;
}

export interface PatientReply {
  text: string;
  intents: Intent[];
  source: 'local' | 'remote';
}

/** The patient answers the student's free-text questions in character. */
export interface PatientConversationService {
  ask(ctx: PatientContext, question: string, history?: readonly ChatTurn[]): Promise<PatientReply>;
}

export interface Debrief {
  strengths: string[];
  improvements: string[];
  nextStep: string;
  source: 'local' | 'remote';
}

export interface DebriefInput {
  scenario: Scenario;
  events: readonly SimEvent[];
  report: ScoreReport;
  lang: Lang;
}

/** Clinical debriefing after the simulation ends. */
export interface DebriefingService {
  debrief(input: DebriefInput): Promise<Debrief>;
}
