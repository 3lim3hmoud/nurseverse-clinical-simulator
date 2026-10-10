import { LocalDebriefing } from './LocalDebriefing';
import { LocalPatientConversation } from './LocalPatientConversation';
import { RemoteDebriefing, RemotePatientConversation } from './RemoteServices';
import type { DebriefingService, PatientConversationService } from './types';

export type { ChatTurn, Debrief, DebriefInput, DebriefingService, PatientContext, PatientConversationService, PatientReply } from './types';
export { detectIntents, INTENTS, SMALL_TALK, type Intent } from './intents';
export { askedTopics } from './LocalDebriefing';

/** Set VITE_AI_ENDPOINT at build time to let your own server (an LLM proxy) write the answers. Empty = fully offline. */
const ENDPOINT = (import.meta.env.VITE_AI_ENDPOINT as string | undefined)?.trim() || '';

export const aiIsRemote = ENDPOINT !== '';

const localPatient = new LocalPatientConversation();
const localDebrief = new LocalDebriefing();

export const patientConversation: PatientConversationService = ENDPOINT ? new RemotePatientConversation(ENDPOINT, localPatient) : localPatient;
export const debriefing: DebriefingService = ENDPOINT ? new RemoteDebriefing(ENDPOINT, localDebrief) : localDebrief;
