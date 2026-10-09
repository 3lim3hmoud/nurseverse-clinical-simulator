/**
 * Records everything the student does during a session, stamped with simulation time (seconds).
 * Used by scoring and by the results timeline. Future: AI clinical debriefing.
 */
export interface SimEvent {
  t: number; // simulation seconds since the case started
  type: string;
  data?: Record<string, unknown>;
}

export class EventLog {
  private events: SimEvent[] = [];

  constructor(private clock: () => number = () => 0) {}

  record(type: string, data?: Record<string, unknown>): void {
    this.events.push({ t: Math.round(this.clock() * 10) / 10, type, data });
  }

  all(): readonly SimEvent[] {
    return this.events;
  }
}
