import type { SimEvent } from '../../core/EventLog';
import type { Lang } from '../../i18n';
import type { Vitals } from '../../domain/patient/types';
import type { Scenario } from '../../domain/scenarios';
import type { ScoreReport } from '../../domain/scoring';
import type { Intent } from './intents';
import type { SbarDraft, SbarOption } from '../../domain/scenarios/sbar';
import type { MedId } from '../../domain/medications';
import type { ProgressSummary } from './progress';

export interface PatientContext {
  scenario: Scenario;
  vitals: Vitals;
  glucose?: number;
  lang: Lang;
}

export interface ChatTurn {
  from: 'nurse' | 'patient' | 'doctor' | 'coach';
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
  progress?: ProgressSummary;
}

/** Clinical debriefing after the simulation ends. */
export interface DebriefingService {
  debrief(input: DebriefInput): Promise<Debrief>;
}

export interface DoctorContext {
  scenario: Scenario;
  draft: SbarDraft;
  option: SbarOption;
  stabilised: boolean;
  lang: Lang;
}

/** The on-call doctor answers the nurse's SBAR report. Returns null when there is no AI reply (the scripted reply is used). */
export interface DoctorService {
  reply(ctx: DoctorContext): Promise<string | null>;
}

/** What the on-call doctor knows when the nurse messages them. */
export interface DoctorChatContext {
  scenario: Scenario;
  vitals: Vitals;
  glucose?: number;
  lang: Lang;
  /** The nurse has examined the patient at least once. */
  assessed: boolean;
  oxygenOn: boolean;
  ivOn: boolean;
  glucoseTreated: boolean;
}

export interface DoctorChatReply {
  text: string;
  /** Set when the nurse asked for a medication: the doctor's decision. */
  order?: { medId: MedId; approved: boolean };
  source: 'local' | 'remote';
}

/** Free-text chat with the on-call doctor (orders, advice, medication requests). */
export interface DoctorChatService {
  ask(ctx: DoctorChatContext, question: string, history?: readonly ChatTurn[]): Promise<DoctorChatReply>;
}
