import { LocalDebriefing } from './LocalDebriefing';
import { LocalDoctorConversation } from './LocalDoctorConversation';
import { LocalPatientConversation } from './LocalPatientConversation';
import { RemoteDebriefing, RemoteDoctor, RemotePatientConversation } from './RemoteServices';
import type { DebriefingService, DoctorChatService, DoctorService, PatientConversationService } from './types';

export type { DoctorChatContext, DoctorChatReply, DoctorChatService, DoctorContext, DoctorService, ChatTurn, Debrief, DebriefInput, DebriefingService, PatientContext, PatientConversationService, PatientReply } from './types';
export { detectIntents, INTENTS, SMALL_TALK, type Intent } from './intents';
export { askedTopics } from './LocalDebriefing';
export { detectMedication } from './LocalDoctorConversation';
export { recordRun, summarize, type ProgressSummary } from './progress';

/** Set VITE_AI_ENDPOINT at build time (e.g. /api/ai) to let the AI backend write the answers. Empty = fully offline. */
const ENDPOINT = (import.meta.env.VITE_AI_ENDPOINT as string | undefined)?.trim() || '';

export const aiIsRemote = ENDPOINT !== '';

const localPatient = new LocalPatientConversation();
const localDebrief = new LocalDebriefing();

export const patientConversation: PatientConversationService = ENDPOINT ? new RemotePatientConversation(ENDPOINT, localPatient) : localPatient;
export const debriefing: DebriefingService = ENDPOINT ? new RemoteDebriefing(ENDPOINT, localDebrief) : localDebrief;
export const doctorService: DoctorService = ENDPOINT ? new RemoteDoctor(ENDPOINT) : { reply: async () => null };

/** Free-text chat with the on-call doctor. Always offline: orders and medication safety must stay deterministic. */
export const doctorChat: DoctorChatService = new LocalDoctorConversation();
