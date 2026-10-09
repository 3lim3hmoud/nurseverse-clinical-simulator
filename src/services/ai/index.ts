import type { SimEvent } from '../../core/EventLog';
import type { Scenario } from '../../domain/scenarios';

/** Future: AI patient conversation (the patient answers the student's questions in character). */
export interface PatientConversationService {
  ask(scenario: Scenario, question: string): Promise<string>;
}

/** Future: AI clinical debriefing after the simulation ends. */
export interface DebriefingService {
  debrief(scenario: Scenario, events: readonly SimEvent[]): Promise<string>;
}
